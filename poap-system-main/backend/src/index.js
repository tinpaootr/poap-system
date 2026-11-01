const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // Import Mongoose để kết nối DB
require('dotenv').config();

const eventRoutes = require('./routes/events');
const collectionRoutes = require('./routes/collection'); // <-- THÊM: Người 3 - Bộ sưu tập

const app = express();
const PORT = process.env.PORT || 5000;

// 1. MIDDLEWARE (Bắt buộc phải đặt lên đầu để Server hiểu được file ảnh và text gửi lên)
app.use(cors()); 
app.use(express.json());

// 2. KẾT NỐI MONGODB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🟢 Đã kết nối thành công với MongoDB!'))
  .catch((err) => console.error('🔴 Lỗi kết nối MongoDB:', err));

// 3. ĐỊNH TUYẾN API
// API test xem server có sống không
app.get('/api', (req, res) => {
  res.json({ message: 'Chào mừng đến với Backend Club POAP!' });
});

// API xử lý Sự kiện & Sinh mã QR
app.use('/api/events', eventRoutes);

// API Bộ sưu tập cá nhân (Người 3)                          // <-- THÊM
app.use('/api/collection', collectionRoutes);                // <-- THÊM

// 4. KHỞI CHẠY SERVER
app.listen(PORT, () => {
  console.log(`🚀 Backend Server đang chạy tại http://localhost:${PORT}`);
});