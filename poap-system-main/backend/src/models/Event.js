const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  time: { type: String, required: true },
  capacity: { type: Number, required: true },
  currentAttendees: { type: Number, default: 0 }, // FIX LỖI 3: Số lượng SV đã nhận mặc định là 0
  status: { type: String, enum: ['upcoming', 'open', 'closed'], default: 'upcoming' },
  ipfsImageHash: { type: String, required: true },     // Hash của file ảnh hiển thị trên Web
  ipfsMetadataHash: { type: String, default: '' },     // FIX LỖI 4: Hash của file JSON Metadata (tokenURI cho NFT)
  contractAddress: { type: String, default: 'Chưa triển khai' }, // Địa chỉ Smart Contract trên Sepolia
  qrSecret: { type: String, required: true },
  refreshInterval: { type: Number, default: 30, required: true }, // Chu kỳ đổi QR (giây)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);