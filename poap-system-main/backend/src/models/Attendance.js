const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  walletAddress: { type: String, required: true, lowercase: true }, // Địa chỉ ví MetaMask của sinh viên
  studentId: { type: String, required: true }, // MSSV
  fullName: { type: String, required: true },  // Họ tên sinh viên
  className: { type: String, required: true }, // Lớp sinh hoạt / Lớp học phần
  claimedAt: { type: Date, default: Date.now },
  txHash: { type: String } // Mã giao dịch khi claim thành công trên Sepolia
});

// Đảm bảo 1 ví chỉ claim 1 lần cho 1 sự kiện duy nhất
attendanceSchema.index({ eventId: 1, walletAddress: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);