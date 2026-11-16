// Địa chỉ gốc của Backend API (có sẵn hậu tố /api).
// Khi deploy: đặt NEXT_PUBLIC_API_URL, ví dụ https://ten-backend.onrender.com/api
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
