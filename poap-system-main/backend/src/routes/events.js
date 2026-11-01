const express = require('express');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const speakeasy = require('speakeasy');
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
    const { name, time, capacity, refreshInterval } = req.body;
    const interval = parseInt(refreshInterval) || 30; // Mặc định 30s

    // Bước 1: Đẩy file ảnh huy hiệu lên IPFS Pinata
    const readableStreamForFile = fs.createReadStream(req.file.path);
    const pinataImageResponse = await pinata.pinFileToIPFS(readableStreamForFile, {
      pinataMetadata: { name: `POAP_Image_${name}` }
    });
    const ipfsImageHash = `ipfs://${pinataImageResponse.IpfsHash}`;

    // Xóa file ảnh tạm trong thư mục uploads/
    fs.unlinkSync(req.file.path);

    // Bước 2 (FIX LỖI 4): Tạo cấu trúc JSON Metadata chuẩn ERC-721 / Soulbound NFT
    const nftMetadata = {
      name: `Chứng nhận: ${name}`,
      description: `Huy hiệu Soulbound POAP chứng nhận sinh viên đã tham gia sự kiện "${name}" diễn ra vào ${time}.`,
      image: ipfsImageHash,
      attributes: [
        { trait_type: 'Sự kiện', value: name },
        { trait_type: 'Thời gian', value: time },
        { trait_type: 'Giới hạn tham dự', value: Number(capacity) },
        { trait_type: 'Chuẩn Token', value: 'ERC-5192 Soulbound' }
      ]
    };

    // Đẩy JSON Metadata lên IPFS Pinata để lấy tokenURI
    const pinataJsonResponse = await pinata.pinJSONToIPFS(nftMetadata, {
      pinataMetadata: { name: `POAP_Metadata_${name}` }
    });
    const ipfsMetadataHash = `ipfs://${pinataJsonResponse.IpfsHash}`;

    // Bước 3: Sinh khóa bí mật cho mã QR động (TOTP)
    const qrSecret = speakeasy.generateSecret().base32;

    // Bước 4: Lưu vào MongoDB
    const newEvent = new Event({
      name,
      time,
      capacity: Number(capacity),
      currentAttendees: 0,
      ipfsImageHash,
      ipfsMetadataHash,
      qrSecret,
      refreshInterval: interval
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

    const step = event.refreshInterval || 30;
    const token = speakeasy.totp({
      secret: event.qrSecret,
      encoding: 'base32',
      step: step
    });

    // TÍNH TOÁN THỜI GIAN THỰC TẾ CÒN LẠI CỦA MÃ NÀY (Bằng Giây)
    const currentEpoch = Math.floor(Date.now() / 1000);
    const remainingSeconds = step - (currentEpoch % step);

    res.json({ 
      token, 
      refreshInterval: step,
      remainingSeconds // Trả thêm dòng này về cho Frontend
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
      step: event.refreshInterval, // Đọc chu kỳ từ Database
      window: 1
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Mã QR đã hết hạn. Vui lòng quét lại!' });
    }

    // Trả về cả ipfsMetadata (JSON tokenURI) và thông tin sự kiện để Người 2 hiển thị & Mint NFT
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

    // CỐT LÕI: Tạo ra một khóa bí mật mới hoàn toàn để vứt bỏ khóa cũ
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
// 🛡️ NGUOI 2: PHÂN HỆ SINH VIÊN (KIỂM TRA TRÙNG VÀ LƯU VẾT)
// =====================================================================

// Chuẩn hóa mã: "#POAP-123456" / " 123 456 " -> "123456"
const normalizeToken = (raw) => String(raw || '').replace(/\D/g, '');

// MSSV: 6–12 chữ số (chỉnh lại nếu trường bạn dùng định dạng khác)
const STUDENT_ID_REGEX = /^\d{6,12}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// Thông tin sự kiện công khai trả về cho trang sinh viên (KHÔNG trả qrSecret)
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

// Kiểm tra dữ liệu sinh viên, trả về chuỗi lỗi hoặc null
const validateStudent = ({ walletAddress, studentId, fullName }) => {
  if (!walletAddress || !studentId || !fullName) return 'Vui lòng cung cấp đầy đủ ví, MSSV và họ tên.';
  if (!WALLET_REGEX.test(walletAddress)) return 'Địa chỉ ví không hợp lệ.';
  if (!STUDENT_ID_REGEX.test(String(studentId).trim())) return 'MSSV không hợp lệ (chỉ gồm 6–12 chữ số).';
  if (String(fullName).trim().length < 2) return 'Họ tên không hợp lệ.';
  return null;
};

/**
 * @route   POST /api/events/student-checkin
 * @desc    Xác thực mã QR / mã dự phòng + kiểm tra ví, MSSV, capacity, chống claim 2 lần
 */
router.post('/student-checkin', async (req, res) => {
  try {
    let { eventId, qrToken, walletAddress, studentId, fullName } = req.body;
    console.log('[student-checkin] body:', req.body);

    const token = normalizeToken(qrToken);
    if (token.length !== 6) {
      return res.status(400).json({ code: 'INVALID_CODE', error: 'Mã check-in phải gồm 6 chữ số, ví dụ #POAP-123456.' });
    }

    const studentError = validateStudent({ walletAddress, studentId, fullName });
    if (studentError) {
      return res.status(400).json({ code: 'INVALID_STUDENT', error: studentError });
    }

    walletAddress = walletAddress.toLowerCase();
    studentId = String(studentId).trim();

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
        return res.status(404).json({ code: 'EVENT_NOT_FOUND', error: 'Không tìm thấy sự kiện.' });
      }
      if (event.status !== 'open') {
        return res.status(400).json({ code: 'EVENT_CLOSED', error: 'Sự kiện này đã đóng cổng điểm danh!' });
      }
      if (!verifyToken(event)) {
        return res.status(400).json({ code: 'CODE_EXPIRED', error: 'Mã check-in không đúng hoặc đã hết hạn. Vui lòng quét lại!' });
      }
    } else {
      const openEvents = await Event.find({ status: 'open' });
      if (openEvents.length === 0) {
        return res.status(404).json({ code: 'NO_OPEN_EVENT', error: 'Hiện không có sự kiện nào đang mở điểm danh.' });
      }
      event = openEvents.find(verifyToken);
      if (!event) {
        return res.status(400).json({ code: 'CODE_EXPIRED', error: 'Mã check-in không đúng hoặc đã hết hạn. Vui lòng quét lại!' });
      }
    }

    if (event.capacity && event.currentAttendees >= event.capacity) {
      return res.status(400).json({ code: 'EVENT_FULL', error: 'Sự kiện đã đủ số lượng người tham dự.' });
    }

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

    return res.status(200).json({
      success: true,
      message: 'Xác thực hợp lệ!',
      eventId: event._id,
      tokenURI: event.ipfsMetadataHash || event.ipfsImageHash,
      event: toPublicEvent(event)
    });
  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ code: 'SERVER_ERROR', error: `Lỗi server: ${err.message}` });
  }
});

/**
 * @route   POST /api/events/record-success
 * @desc    Lưu vết vào MongoDB sau khi sinh viên ký giao dịch thành công trên MetaMask
 */
router.post('/record-success', async (req, res) => {
  try {
    let { eventId, walletAddress, studentId, fullName, txHash } = req.body;

    if (!eventId || !OBJECT_ID_REGEX.test(eventId)) {
      return res.status(400).json({ code: 'INVALID_EVENT', error: 'eventId không hợp lệ.' });
    }
    const studentError = validateStudent({ walletAddress, studentId, fullName });
    if (studentError) {
      return res.status(400).json({ code: 'INVALID_STUDENT', error: studentError });
    }

    walletAddress = walletAddress.toLowerCase();
    studentId = String(studentId).trim();

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ code: 'EVENT_NOT_FOUND', error: 'Không tìm thấy sự kiện.' });
    }

    // Chống ghi trùng (bấm 2 lần / gọi lại API)
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
      fullName: String(fullName).trim(),
      txHash
    });
    await newAttendance.save();

    const updated = await Event.findByIdAndUpdate(
      event._id,
      { $inc: { currentAttendees: 1 } },
      { returnDocument: 'after' }
    );

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

module.exports = router;