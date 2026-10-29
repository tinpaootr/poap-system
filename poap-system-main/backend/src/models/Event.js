const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  time: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['upcoming', 'open', 'closed'], default: 'upcoming' },
  ipfsImageHash: { type: String, required: true }, // Lưu chuỗi ipfs://...
  qrSecret: { type: String, required: true },      // Mã bí mật cấp cho mỗi sự kiện để sinh QR động
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);