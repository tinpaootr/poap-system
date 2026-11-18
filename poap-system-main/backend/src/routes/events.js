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
const {
  MintError,
  translateError,
  getOnchainStatus,
  sendMint,
  tokenIdFromReceipt,
  findClaimTx,
  waitTimeoutMs
} = require('../lib/minter');

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
const challenges = new Map(); // wallet -> { message, studentId, fullName, className, expiresAt }

// Ví / MSSV đang trong lúc đúc huy hiệu -> chặn 2 request song song cho cùng một người
const inFlight = new Set();
const ETHERSCAN_TX = 'https://sepolia.etherscan.io/tx';

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
 * @desc    Kiểm tra chữ ký + nonce, mã TOTP, sự kiện, chống trùng, ràng buộc ví - MSSV, khớp họ tên/lớp.
 *          Qua hết -> backend gọi ClubPOAP.mintBadge() bằng ví minter (trả gas thay sinh viên),
 *          chờ xác nhận rồi lưu Attendance kèm txHash.
 * @returns 201 { success, txHash, tokenId, etherscanUrl, event }      đúc thành công
 *          200 { success, txHash, ... }                                 đối soát: chain đã có, ghi bù DB
 *          202 { pending, code: 'MINT_PENDING', txHash }                đã gửi tx nhưng xác nhận chậm
 *          4xx/5xx { code, error }  với code: EVENT_NOT_ONCHAIN, ALREADY_CLAIMED_ONCHAIN, EVENT_FULL,
 *          CHECKIN_IN_PROGRESS, MINTER_NO_FUNDS, MINTER_NOT_ADMIN, MINTER_NOT_CONFIGURED,
 *          MINT_REVERTED, RPC_ERROR, DB_SAVE_FAILED, ... (cùng các mã kiểm tra cũ)
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

    // ===== Qua hết bước kiểm tra -> BACKEND ĐÚC HUY HIỆU HỘ SINH VIÊN (ví minter trả gas) =====
    const lockKeys = [`w:${walletAddress}`, `s:${studentId}`];
    if (lockKeys.some((k) => inFlight.has(k))) {
      return res.status(409).json({
        code: 'CHECKIN_IN_PROGRESS',
        error: 'Yêu cầu nhận huy hiệu của bạn đang được xử lý, vui lòng chờ trong giây lát.'
      });
    }
    lockKeys.forEach((k) => inFlight.add(k));
    let releaseInBackground = false;

    try {
      const eventKey = String(event._id); // eventId on-chain = _id MongoDB (string)
      const tokenURI = event.ipfsMetadataHash || event.ipfsImageHash;
      if (!tokenURI) {
        throw new MintError('NO_TOKEN_URI', 'Sự kiện chưa có metadata huy hiệu (IPFS). Vui lòng liên hệ ban tổ chức.', 500);
      }
      const studentData = { event, walletAddress, studentId, fullName, className };

      // a. Kiểm tra trạng thái on-chain trước khi tốn gas
      const onchain = await getOnchainStatus(eventKey, walletAddress);
      if (!onchain.exists) {
        throw new MintError(
          'EVENT_NOT_ONCHAIN',
          'Sự kiện chưa được đăng ký trên blockchain. Vui lòng liên hệ ban tổ chức.',
          409
        );
      }

      // b. Chain đã có huy hiệu nhưng DB chưa ghi (lần trước bị gián đoạn) -> đối soát, ghi bù DB
      if (onchain.claimed) {
        let found = null;
        try {
          found = await findClaimTx(eventKey, walletAddress);
        } catch (lookupErr) {
          console.warn('[mint] Không tìm lại được giao dịch cũ:', lookupErr.message);
        }
        if (!found) {
          throw new MintError(
            'ALREADY_CLAIMED_ONCHAIN',
            'Ví này đã nhận huy hiệu của sự kiện trên blockchain nhưng hệ thống chưa đồng bộ được. Vui lòng liên hệ ban tổ chức.',
            409
          );
        }
        console.log(`[mint] Đối soát: ví ${walletAddress} đã có huy hiệu (tx ${found.txHash}), ghi bù vào DB.`);
        const saved = await saveAttendance({ ...studentData, txHash: found.txHash });
        return res.status(200).json(mintSuccessBody(saved, found.txHash, found.tokenId));
      }

      if (onchain.currentAttendees >= onchain.capacity) {
        throw new MintError('EVENT_FULL', 'Sự kiện đã đủ số lượng người tham dự.', 400);
      }

      // c. Gửi giao dịch mintBadge(student, eventId, uri) bằng ví minter
      const tx = await sendMint(walletAddress, eventKey, tokenURI);
      console.log(`[mint] Đã gửi tx ${tx.hash} -> ví ${walletAddress}, sự kiện ${eventKey}`);

      // d. Chờ Sepolia xác nhận
      let receipt;
      try {
        receipt = await tx.wait(1, waitTimeoutMs());
      } catch (waitErr) {
        if (waitErr?.code === 'TIMEOUT') {
          // Giao dịch đã gửi nhưng xác nhận chậm: tiếp tục chờ ở nền rồi tự ghi DB
          releaseInBackground = true;
          finishMintInBackground(tx, studentData, lockKeys);
          return res.status(202).json({
            success: false,
            pending: true,
            code: 'MINT_PENDING',
            error: 'Giao dịch đã được gửi nhưng mạng Sepolia xác nhận chậm. Huy hiệu sẽ tự xuất hiện trong Bộ sưu tập sau ít phút.',
            txHash: tx.hash,
            etherscanUrl: `${ETHERSCAN_TX}/${tx.hash}`
          });
        }
        throw translateError(waitErr);
      }

      // e. Ghi Attendance kèm txHash
      let saved;
      try {
        saved = await saveAttendance({ ...studentData, txHash: tx.hash });
      } catch (dbErr) {
        console.error(`[mint] ⚠️ ĐÃ MINT nhưng lưu DB lỗi. tx=${tx.hash} ví=${walletAddress} sự kiện=${eventKey}`, dbErr);
        throw new MintError(
          'DB_SAVE_FAILED',
          'Huy hiệu đã được đúc trên blockchain nhưng chưa lưu được lịch sử điểm danh. Hãy bấm "Nhận Huy Hiệu" lại để hệ thống đồng bộ.',
          500,
          { txHash: tx.hash, etherscanUrl: `${ETHERSCAN_TX}/${tx.hash}` }
        );
      }

      return res.status(201).json(mintSuccessBody(saved, tx.hash, tokenIdFromReceipt(receipt)));
    } finally {
      if (!releaseInBackground) lockKeys.forEach((k) => inFlight.delete(k));
    }
  } catch (err) {
    if (err instanceof MintError) {
      console.warn(`[student-checkin] ${err.code}: ${err.message}`);
      return res.status(err.status).json({ code: err.code, error: err.message, ...err.extra });
    }
    console.error('SERVER ERROR:', err);
    res.status(500).json({ code: 'SERVER_ERROR', error: 'Lỗi server khi điểm danh.' });
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Lưu lịch sử điểm danh sau khi mint thành công (có thử lại).
 * Trả về document Event sau khi cập nhật số người tham dự.
 */
async function saveAttendance({ event, walletAddress, studentId, fullName, className, txHash }) {
  // 1. Tạo bản ghi Attendance (index unique eventId + walletAddress chống ghi trùng)
  let inserted = false;
  for (let attempt = 1; attempt <= 3 && !inserted; attempt++) {
    try {
      const existed = await Attendance.findOne({ eventId: event._id, walletAddress });
      if (existed) {
        if (!existed.txHash) {
          existed.txHash = txHash;
          await existed.save();
        }
        return Event.findById(event._id);
      }
      await new Attendance({ eventId: event._id, walletAddress, studentId, fullName, className, txHash }).save();
      inserted = true;
    } catch (err) {
      if (err?.code === 11000) return Event.findById(event._id); // request khác vừa ghi xong
      console.error(`[mint] Lưu Attendance lỗi (lần ${attempt}/3), tx=${txHash}:`, err.message);
      if (attempt === 3) throw err;
      await sleep(1000 * attempt);
    }
  }

  // 2. Tự động bổ sung Lớp cho các bản ghi điểm danh cũ của cùng ví (nếu trước đó chưa có className)
  if (className) {
    await Attendance.updateMany(
      { walletAddress, $or: [{ className: { $exists: false } }, { className: '' }, { className: null }] },
      { $set: { className } }
    ).catch((err) => console.warn('[mint] Không bổ sung được lớp cho bản ghi cũ:', err.message));
  }

  // 3. Tăng số người tham dự, đủ chỗ thì đóng sự kiện
  const updated = await Event.findByIdAndUpdate(
    event._id,
    { $inc: { currentAttendees: 1 } },
    { returnDocument: 'after' }
  );
  if (updated && updated.capacity > 0 && updated.currentAttendees >= updated.capacity && updated.status !== 'closed') {
    updated.status = 'closed';
    await updated.save();
  }
  return updated;
}

function mintSuccessBody(eventDoc, txHash, tokenId) {
  return {
    success: true,
    message: 'Điểm danh thành công! Huy hiệu đã được đúc về ví của bạn.',
    eventId: eventDoc?._id,
    txHash,
    tokenId: tokenId || null,
    etherscanUrl: `${ETHERSCAN_TX}/${txHash}`,
    event: eventDoc ? toPublicEvent(eventDoc) : null,
    currentAttendees: eventDoc?.currentAttendees
  };
}

/** Giao dịch xác nhận chậm: chờ tiếp ở nền rồi ghi DB. Nếu lỗi, lần điểm danh sau sẽ tự đối soát. */
function finishMintInBackground(tx, studentData, lockKeys) {
  tx.wait(1, 10 * 60 * 1000)
    .then(async () => {
      await saveAttendance({ ...studentData, txHash: tx.hash });
      console.log(`[mint] (nền) tx ${tx.hash} đã xác nhận và được ghi vào DB.`);
    })
    .catch((err) => console.error(`[mint] (nền) tx ${tx.hash} chưa hoàn tất:`, err.message))
    .finally(() => lockKeys.forEach((k) => inFlight.delete(k)));
}

// Route POST /record-success và claimTicket đã được GỠ BỎ:
// sinh viên không còn tự gửi giao dịch, backend mint hộ ngay trong /student-checkin.

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