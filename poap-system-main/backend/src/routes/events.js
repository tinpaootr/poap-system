const express = require('express');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const ethers = require('ethers'); // npm install ethers - dùng để kiểm tra chữ ký MetaMask
const Event = require('../models/Event');

// ===== [BỔ SUNG CHO PHẦN SINH VIÊN] Import Attendance Model =====
const Attendance = require('../models/Attendance');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

// ==========================================
// 1. API TẠO SỰ KIỆN MỚI (ĐẨY ẢNH + JSON METADATA LÊN IPFS)
// ==========================================
router.post('/', upload.single('badgeImage'), async (req, res) => {
  try {
    const { name, organizer, time, capacity, refreshInterval } = req.body;
    const interval = parseInt(refreshInterval) || 30;
    const orgName = organizer || 'Khoa CNTT';

    // Bước 1: Đẩy file ảnh huy hiệu lên IPFS Pinata
    const readableStreamForFile = fs.createReadStream(req.file.path);
    const pinataImageResponse = await pinata.pinFileToIPFS(readableStreamForFile, {
      pinataMetadata: { name: `POAP_Image_${name}` }
    });
    const ipfsImageHash = `ipfs://${pinataImageResponse.IpfsHash}`;

    fs.unlinkSync(req.file.path);

    // Bước 2: Tạo cấu trúc JSON Metadata chuẩn ERC-721 / Soulbound NFT
    const nftMetadata = {
      name: `Chứng nhận: ${name}`,
      description: `Huy hiệu Soulbound POAP chứng nhận sinh viên đã tham gia sự kiện "${name}" do ${orgName} tổ chức vào ${time}.`,
      image: ipfsImageHash,
      attributes: [
        { trait_type: 'Sự kiện', value: name },
        { trait_type: 'Đơn vị tổ chức', value: orgName },
        { trait_type: 'Thời gian', value: time },
        { trait_type: 'Giới hạn tham dự', value: Number(capacity) },
        { trait_type: 'Chuẩn Token', value: 'ERC-5192 Soulbound' }
      ]
    };

    const pinataJsonResponse = await pinata.pinJSONToIPFS(nftMetadata, {
      pinataMetadata: { name: `POAP_Metadata_${name}` }
    });
    const ipfsMetadataHash = `ipfs://${pinataJsonResponse.IpfsHash}`;

    // Bước 3: Sinh khóa bí mật cho mã QR động (TOTP)
    const qrSecret = speakeasy.generateSecret().base32;

    // Bước 4: Lưu vào MongoDB
    const newEvent = new Event({
      name,
      organizer: orgName,
      time,
      capacity: Number(capacity),
      currentAttendees: 0,
      ipfsImageHash,
      ipfsMetadataHash,
      qrSecret,
      refreshInterval: interval,
      contractAddress: process.env.CONTRACT_ADDRESS
    });

    await newEvent.save();
    res.status(201).json({ message: 'Tạo sự kiện thành công', event: newEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi tạo sự kiện' });
  }
});

// ==========================================
// 2. API LẤY DANH SÁCH SỰ KIỆN
// ==========================================
router.get('/', async (req, res) => {
  try {
    // Tự động đóng tất cả sự kiện đang 'open' nhưng đã đạt đủ số lượng sinh viên
    await Event.updateMany(
      { status: 'open', $expr: { $gte: ['$currentAttendees', '$capacity'] } },
      { $set: { status: 'closed' } }
    );

    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách sự kiện' });
  }
});

// ==========================================
// 3. API LẤY MÃ QR ĐỘNG CHO MÀN HÌNH MÁY CHIẾU
// ==========================================
router.get('/:id/qr-token', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Không tìm thấy sự kiện' });

    // Nếu đã đủ số lượng sinh viên -> Khóa sự kiện và ngừng cấp mã QR
    if (event.capacity > 0 && event.currentAttendees >= event.capacity) {
      if (event.status !== 'closed') {
        event.status = 'closed';
        await event.save();
      }
      return res.status(400).json({ error: 'Sự kiện đã đủ số lượng sinh viên' });
    }

    if (event.status !== 'open') {
      return res.status(400).json({ error: 'Sự kiện đã đóng điểm danh' });
    }

    const step = event.refreshInterval || 30;
    const token = speakeasy.totp({
      secret: event.qrSecret,
      encoding: 'base32',
      step: step
    });

    const currentEpoch = Math.floor(Date.now() / 1000);
    const remainingSeconds = step - (currentEpoch % step);

    res.json({ 
      token, 
      refreshInterval: step,
      remainingSeconds
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo token' });
  }
});

// ==========================================
// 4. API CẬP NHẬT TRẠNG THÁI SỰ KIỆN (ĐÓNG / MỞ)
// ==========================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
    );
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái' });
  }
});

// ==========================================
// 5. API XÁC THỰC MÃ QR ĐIỂM DANH (DÀNH CHO NGƯỜI 2)
// ==========================================
router.post('/verify-qr', async (req, res) => {
  try {
    const { eventId, qrToken } = req.body;
    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    if (event.status !== 'open') return res.status(400).json({ error: 'Sự kiện chưa mở điểm danh' });

    const isValid = speakeasy.totp.verify({
      secret: event.qrSecret,
      encoding: 'base32',
      token: qrToken,
      step: event.refreshInterval,
      window: 1
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Mã QR đã hết hạn. Vui lòng quét lại!' });
    }

    res.status(200).json({
      message: 'Điểm danh hợp lệ!',
      ipfsMetadata: event.ipfsMetadataHash || event.ipfsImageHash,
      tokenURI: event.ipfsMetadataHash || event.ipfsImageHash,
      event: {
        _id: event._id,
        name: event.name,
        time: event.time,
        capacity: event.capacity,
        currentAttendees: event.currentAttendees,
        ipfsImageHash: event.ipfsImageHash,
        ipfsMetadataHash: event.ipfsMetadataHash
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server xác thực' });
  }
});

// ==========================================
// 6. API ÉP ĐỔI MÃ QR NGAY LẬP TỨC (RESET LẠI BÍ MẬT)
// ==========================================
router.post('/:id/force-refresh-qr', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Không tìm thấy sự kiện' });

    event.qrSecret = speakeasy.generateSecret().base32;
    await event.save();

    const step = event.refreshInterval || 30;
    const token = speakeasy.totp({
      secret: event.qrSecret,
      encoding: 'base32',
      step: step
    });

    const currentEpoch = Math.floor(Date.now() / 1000);
    const remainingSeconds = step - (currentEpoch % step);

    res.json({ token, refreshInterval: step, remainingSeconds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi ép đổi token' });
  }
});


// =====================================================================
// 🛡️ NGƯỜI 2: PHÂN HỆ SINH VIÊN (XÁC THỰC CHỮ KÝ VÍ + CHỐNG TRÙNG + LƯU VẾT)
// =====================================================================

const normalizeToken = (raw) => String(raw || '').replace(/\D/g, '');

const STUDENT_ID_REGEX = /^\d{6,12}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const TICKET_TTL_MS = 10 * 60 * 1000;
const challenges = new Map(); // wallet -> { message, studentId, fullName, className, expiresAt }
const tickets = new Map();    // ticketId -> { eventId, walletAddress, studentId, fullName, className, expiresAt }

const cleanupExpired = (map) => {
  const now = Date.now();
  for (const [key, value] of map) if (value.expiresAt < now) map.delete(key);
};

const verifyMessageFn = ethers.verifyMessage || (ethers.utils && ethers.utils.verifyMessage);

const toPublicEvent = (event) => ({
  _id: event._id,
  name: event.name,
  time: event.time,
  capacity: event.capacity,
  currentAttendees: event.currentAttendees,
  status: event.status,
  ipfsImageHash: event.ipfsImageHash,
  ipfsMetadataHash: event.ipfsMetadataHash,
  contractAddress: event.contractAddress
});

// Kiểm tra dữ liệu sinh viên (bao gồm cả Lớp)
const validateStudent = ({ walletAddress, studentId, fullName, className }) => {
  if (!walletAddress || !studentId || !fullName || !className) {
    return 'Vui lòng cung cấp đầy đủ ví, MSSV, họ tên và lớp.';
  }
  if (!WALLET_REGEX.test(walletAddress)) return 'Địa chỉ ví không hợp lệ.';
  if (!STUDENT_ID_REGEX.test(String(studentId).trim())) return 'MSSV không hợp lệ (chỉ gồm 6–12 chữ số).';
  if (String(fullName).trim().length < 2) return 'Họ tên không hợp lệ.';
  if (String(className).trim().length < 2) return 'Tên lớp không hợp lệ.';
  return null;
};

async function findEventByToken(eventId, token) {
  const verifyToken = (ev) =>
    speakeasy.totp.verify({
      secret: ev.qrSecret,
      encoding: 'base32',
      token,
      step: ev.refreshInterval || 30,
      window: 2
    });

  let event = null;

  if (eventId && OBJECT_ID_REGEX.test(eventId)) {
    event = await Event.findById(eventId);
    if (!event) {
      return { status: 404, code: 'EVENT_NOT_FOUND', error: 'Không tìm thấy sự kiện.' };
    }
    if (event.status !== 'open') {
      return { status: 400, code: 'EVENT_CLOSED', error: 'Sự kiện này đã đóng cổng điểm danh!' };
    }
    if (!verifyToken(event)) {
      return { status: 400, code: 'CODE_EXPIRED', error: 'Mã check-in không đúng hoặc đã hết hạn. Vui lòng quét lại!' };
    }
  } else {
    const openEvents = await Event.find({ status: 'open' });
    if (openEvents.length === 0) {
      return { status: 404, code: 'NO_OPEN_EVENT', error: 'Hiện không có sự kiện nào đang mở điểm danh.' };
    }
    event = openEvents.find(verifyToken);
    if (!event) {
      return { status: 400, code: 'CODE_EXPIRED', error: 'Mã check-in không đúng hoặc đã hết hạn. Vui lòng quét lại!' };
    }
  }

  if (event.capacity && event.currentAttendees >= event.capacity) {
    return { status: 400, code: 'EVENT_FULL', error: 'Sự kiện đã đủ số lượng người tham dự.' };
  }
  return { event };
}

/**
 * @route   POST /api/events/student-preview
 * @body    { eventId?, qrToken }
 */
router.post('/student-preview', async (req, res) => {
  try {
    const { eventId, qrToken } = req.body || {};
    const token = normalizeToken(qrToken);
    if (token.length !== 6) {
      return res.status(400).json({ code: 'INVALID_CODE', error: 'Mã check-in phải gồm 6 chữ số, ví dụ #POAP-123456.' });
    }

    const found = await findEventByToken(eventId, token);
    if (found.error) {
      return res.status(found.status).json({ code: found.code, error: found.error });
    }
    res.json({ event: toPublicEvent(found.event) });
  } catch (err) {
    console.error('Error previewing event:', err);
    res.status(500).json({ code: 'SERVER_ERROR', error: 'Lỗi server khi tải thông tin sự kiện.' });
  }
});

/**
 * @route   POST /api/events/student-challenge
 * @body    { walletAddress, studentId, fullName, className }
 */
router.post('/student-challenge', async (req, res) => {
  try {
    let { walletAddress, studentId, fullName, className } = req.body || {};

    const studentError = validateStudent({ walletAddress, studentId, fullName, className });
    if (studentError) {
      return res.status(400).json({ code: 'INVALID_STUDENT', error: studentError });
    }

    walletAddress = walletAddress.toLowerCase();
    studentId = String(studentId).trim();
    fullName = String(fullName).trim().replace(/\s+/g, ' ');
    className = String(className).trim().replace(/\s+/g, ' ').toUpperCase();

    cleanupExpired(challenges);
    const nonce = crypto.randomBytes(16).toString('hex');
    const message = [
      'Club POAP - Xác nhận điểm danh',
      '',
      `Ví: ${walletAddress}`,
      `MSSV: ${studentId}`,
      `Họ tên: ${fullName}`,
      `Lớp: ${className}`,
      `Nonce: ${nonce}`,
      `Thời điểm: ${new Date().toISOString()}`,
      '',
      'Ký thông điệp này KHÔNG tốn phí gas và KHÔNG cấp quyền chuyển tài sản.'
    ].join('\n');

    challenges.set(walletAddress, {
      message,
      studentId,
      fullName,
      className,
      expiresAt: Date.now() + CHALLENGE_TTL_MS
    });

    res.json({ message });
  } catch (err) {
    console.error('Error creating challenge:', err);
    res.status(500).json({ code: 'SERVER_ERROR', error: 'Lỗi tạo phiên xác thực.' });
  }
});

/**
 * @route   POST /api/events/student-checkin
 * @body    { eventId?, qrToken, walletAddress, signature }
 */
router.post('/student-checkin', async (req, res) => {
  try {
    let { eventId, qrToken, walletAddress, signature } = req.body || {};
    console.log('[student-checkin] body:', { eventId, qrToken, walletAddress });

    const token = normalizeToken(qrToken);
    if (token.length !== 6) {
      return res.status(400).json({ code: 'INVALID_CODE', error: 'Mã check-in phải gồm 6 chữ số, ví dụ #POAP-123456.' });
    }
    if (!walletAddress || !WALLET_REGEX.test(walletAddress)) {
      return res.status(400).json({ code: 'INVALID_WALLET', error: 'Địa chỉ ví không hợp lệ.' });
    }
    walletAddress = walletAddress.toLowerCase();

    const challenge = challenges.get(walletAddress);
    challenges.delete(walletAddress);

    if (!challenge || challenge.expiresAt < Date.now()) {
      return res.status(401).json({ code: 'CHALLENGE_EXPIRED', error: 'Phiên xác thực không tồn tại hoặc đã hết hạn. Vui lòng thử lại.' });
    }
    let recovered = '';
    try {
      recovered = verifyMessageFn(challenge.message, signature);
    } catch {
      return res.status(401).json({ code: 'SIGNATURE_INVALID', error: 'Chữ ký không hợp lệ.' });
    }
    if (String(recovered).toLowerCase() !== walletAddress) {
      return res.status(401).json({ code: 'SIGNATURE_INVALID', error: 'Chữ ký không khớp với địa chỉ ví.' });
    }

    const { studentId, fullName, className } = challenge;

    const found = await findEventByToken(eventId, token);
    if (found.error) {
      return res.status(found.status).json({ code: found.code, error: found.error });
    }
    const event = found.event;

    const existed = await Attendance.findOne({
      eventId: event._id,
      $or: [{ walletAddress }, { studentId }]
    });
    if (existed) {
      const byWallet = existed.walletAddress === walletAddress;
      return res.status(409).json({
        code: 'ALREADY_CLAIMED',
        error: byWallet
          ? 'Ví này đã nhận huy hiệu của sự kiện này rồi!'
          : 'MSSV này đã điểm danh sự kiện này rồi!'
      });
    }

    const walletOwner = await Attendance.findOne({ walletAddress, studentId: { $ne: studentId } });
    if (walletOwner) {
      return res.status(409).json({
        code: 'WALLET_BOUND',
        error: `Ví này đã được đăng ký cho MSSV ${walletOwner.studentId}. Mỗi ví chỉ dùng cho 1 sinh viên.`
      });
    }

    const idOwner = await Attendance.findOne({ studentId, walletAddress: { $ne: walletAddress } });
    if (idOwner) {
      return res.status(409).json({
        code: 'STUDENT_BOUND',
        error: 'MSSV này đã được liên kết với một ví khác. Hãy dùng đúng ví đã đăng ký.'
      });
    }

    const normalizeText = (n) => String(n || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
    const previous = await Attendance.findOne({ walletAddress, studentId });
    if (previous) {
      if (normalizeText(previous.fullName) !== normalizeText(fullName)) {
        return res.status(409).json({
          code: 'NAME_MISMATCH',
          error: `Họ tên không khớp với thông tin đã đăng ký của MSSV ${studentId}.`
        });
      }
      if (previous.className && normalizeText(previous.className) !== normalizeText(className)) {
        return res.status(409).json({
          code: 'CLASS_MISMATCH',
          error: `Lớp không khớp với thông tin đã đăng ký (${previous.className}) của MSSV ${studentId}.`
        });
      }
    }

    cleanupExpired(tickets);
    const claimTicket = crypto.randomBytes(24).toString('hex');
    tickets.set(claimTicket, {
      eventId: String(event._id),
      walletAddress,
      studentId,
      fullName,
      className,
      expiresAt: Date.now() + TICKET_TTL_MS
    });

    return res.status(200).json({
      success: true,
      message: 'Xác thực hợp lệ!',
      eventId: event._id,
      tokenURI: event.ipfsMetadataHash || event.ipfsImageHash,
      event: toPublicEvent(event),
      claimTicket
    });
  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ code: 'SERVER_ERROR', error: 'Lỗi server khi điểm danh.' });
  }
});

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

const makeProvider = () =>
  ethers.JsonRpcProvider
    ? new ethers.JsonRpcProvider(SEPOLIA_RPC_URL)
    : new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);

async function verifyClaimTx(txHash, walletAddress) {
  const contractAddress = String(process.env.CONTRACT_ADDRESS || '').toLowerCase();
  if (!contractAddress) {
    console.warn('[record-success] Thiếu CONTRACT_ADDRESS trong .env -> bỏ qua kiểm tra on-chain');
    return null;
  }

  const provider = makeProvider();

  let receipt = null;
  for (let i = 0; i < 5 && !receipt; i++) {
    receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (!receipt) {
    return { status: 400, code: 'TX_NOT_FOUND', error: 'Không tìm thấy giao dịch này trên Sepolia.' };
  }
  if (receipt.status !== 1) {
    return { status: 400, code: 'TX_FAILED', error: 'Giao dịch trên Sepolia đã thất bại (reverted).' };
  }
  if (String(receipt.to || '').toLowerCase() !== contractAddress) {
    return { status: 400, code: 'TX_WRONG_CONTRACT', error: 'Giao dịch không gọi đúng smart contract của hệ thống.' };
  }
  if (String(receipt.from || '').toLowerCase() !== walletAddress) {
    return { status: 400, code: 'TX_WRONG_SENDER', error: 'Giao dịch không do ví điểm danh gửi.' };
  }
  return null;
}

/**
 * @route   POST /api/events/record-success
 * @body    { claimTicket, txHash }
 */
router.post('/record-success', async (req, res) => {
  try {
    const { claimTicket, txHash } = req.body || {};

    const ticket = typeof claimTicket === 'string' ? tickets.get(claimTicket) : null;
    if (ticket) tickets.delete(claimTicket);
    if (!ticket || ticket.expiresAt < Date.now()) {
      return res.status(401).json({
        code: 'TICKET_INVALID',
        error: 'Phiên điểm danh không hợp lệ hoặc đã hết hạn. Vui lòng quét mã lại.'
      });
    }

    if (!txHash || typeof txHash !== 'string' || txHash.length > 100) {
      return res.status(400).json({ code: 'INVALID_TX', error: 'Thiếu mã giao dịch (txHash).' });
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({ code: 'INVALID_TX', error: 'txHash không hợp lệ (cần giao dịch thật trên Sepolia).' });
    }

    const { eventId, walletAddress, studentId, fullName, className } = ticket;

    const txUsed = await Attendance.findOne({ txHash });
    if (txUsed) {
      return res.status(409).json({ code: 'TX_ALREADY_USED', error: 'Giao dịch này đã được ghi nhận trước đó.' });
    }

    let txError = null;
    try {
      txError = await verifyClaimTx(txHash, walletAddress);
    } catch (rpcErr) {
      console.error('[record-success] Lỗi RPC Sepolia:', rpcErr);
      tickets.set(claimTicket, ticket);
      return res.status(502).json({ code: 'RPC_ERROR', error: 'Chưa kiểm tra được giao dịch trên Sepolia, vui lòng thử lại.' });
    }
    if (txError) {
      return res.status(txError.status).json({ code: txError.code, error: txError.error });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ code: 'EVENT_NOT_FOUND', error: 'Không tìm thấy sự kiện.' });
    }

    const existed = await Attendance.findOne({
      eventId: event._id,
      $or: [{ walletAddress }, { studentId }]
    });
    if (existed) {
      return res.status(409).json({ code: 'ALREADY_CLAIMED', error: 'Lượt điểm danh này đã được ghi nhận trước đó.' });
    }

    const newAttendance = new Attendance({
      eventId: event._id,
      walletAddress,
      studentId,
      fullName,
      className,
      txHash
    });
    await newAttendance.save();

    // Tự động bổ sung Lớp cho các bản ghi điểm danh cũ của cùng ví (nếu trước đó chưa có className)
    if (className) {
      await Attendance.updateMany(
        { walletAddress, $or: [{ className: { $exists: false } }, { className: '' }, { className: null }] },
        { $set: { className } }
      );
    }

    const updated = await Event.findByIdAndUpdate(
      event._id,
      { $inc: { currentAttendees: 1 } },
      { new: true }
    );

    if (updated.capacity > 0 && updated.currentAttendees >= updated.capacity) {
      await Event.findByIdAndUpdate(
        event._id,
        { status: 'closed' }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Đã ghi nhận lịch sử điểm danh thành công!',
      currentAttendees: updated.currentAttendees
    });
  } catch (err) {
    console.error('Error recording success:', err);
    res.status(500).json({ code: 'SERVER_ERROR', error: 'Lỗi ghi nhận lịch sử điểm danh.' });
  }
});

// ==========================================
// API LẤY DANH SÁCH SINH VIÊN ĐÃ ĐIỂM DANH THEO SỰ KIỆN (CHO ADMIN)
// ==========================================
router.get('/:id/attendees', async (req, res) => {
  try {
    const attendees = await Attendance.find({ eventId: req.params.id })
      .sort({ claimedAt: -1 })
      .lean();
    res.json({ total: attendees.length, attendees });
  } catch (error) {
    console.error('Lỗi lấy danh sách điểm danh:', error);
    res.status(500).json({ error: 'Lỗi server khi tải danh sách sinh viên' });
  }
});

module.exports = router;