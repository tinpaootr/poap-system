const express = require('express');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const speakeasy = require('speakeasy'); // Dùng thư viện chuẩn, ổn định hơn
const Event = require('../models/Event');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Khởi tạo Pinata 
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

// ==========================================
// 1. API TẠO SỰ KIỆN (Có upload IPFS)
// ==========================================
router.post('/', upload.single('badgeImage'), async (req, res) => {
  try {
    const { name, time, capacity } = req.body;
    
    // Đẩy file ảnh lên IPFS
    const readableStreamForFile = fs.createReadStream(req.file.path);
    const pinataResponse = await pinata.pinFileToIPFS(readableStreamForFile);
    const ipfsHash = `ipfs://${pinataResponse.IpfsHash}`;

    // Xóa file tạm
    fs.unlinkSync(req.file.path);

    // Dùng speakeasy tạo secret key riêng cho sự kiện (Lưu dạng base32)
    const qrSecret = speakeasy.generateSecret().base32;

    // Lưu vào DB
    const newEvent = new Event({
      name, time, capacity, ipfsImageHash: ipfsHash, qrSecret
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
    res.status(500).json({ error: 'Lỗi lấy danh sách' });
  }
});

// ==========================================
// 3. API CẬP NHẬT TRẠNG THÁI SỰ KIỆN
// ==========================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái' });
  }
});

// ==========================================
// 4. API XÁC THỰC MÃ QR ĐỘNG (Sinh viên quét)
// ==========================================
router.post('/verify-qr', async (req, res) => {
  try {
    const { eventId, qrToken } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    if (event.status !== 'open') return res.status(400).json({ error: 'Sự kiện chưa mở điểm danh' });

    // Dùng speakeasy xác thực mã QR (với chu kỳ 20 giây, cho phép độ trễ 1 chu kỳ)
    const isValid = speakeasy.totp.verify({
      secret: event.qrSecret,
      encoding: 'base32',
      token: qrToken,
      step: 20,
      window: 1 
    });

    if (!isValid) return res.status(400).json({ error: 'Mã QR đã hết hạn. Vui lòng quét lại!' });

    res.status(200).json({ message: 'Điểm danh hợp lệ!', ipfsMetadata: event.ipfsImageHash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

module.exports = router;