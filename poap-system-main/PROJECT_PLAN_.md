# 🎖️ Club POAP - Hệ thống Điểm danh & Cấp Chứng nhận NFT

Lưu giữ minh chứng tham gia các hội thảo, seminar học thuật vĩnh viễn trên Blockchain dưới dạng **Soulbound Badge** (NFT định danh không thể chuyển nhượng).

---

##  1. Tổng quan Đề tài

- **Vấn đề:** Giấy chứng nhận tham gia hội thảo, seminar học thuật truyền thống dễ bị thất lạc, hư hỏng hoặc làm giả.
- **Giải pháp Blockchain:** Ứng dụng giao thức bằng chứng tham dự (**POAP - Proof of Attendance Protocol**). Mỗi sự kiện được quản lý và phát hành chứng nhận thông qua Smart Contract trên mạng thử nghiệm **Sepolia Testnet**.
- **Vai trò của MetaMask:** Sinh viên tham dự quét mã QR tại sự kiện, kết nối ví **MetaMask** để tự động nhận (Mint/Claim) một huy hiệu số (NFT) về ví cá nhân, chứng minh sự có mặt thực tế và làm đẹp hồ sơ hoạt động ngoại khóa.

---
## 2. Luồng Hoạt Động Của Hệ Thống (System Workflow)

Hệ thống sử dụng cơ chế **Web3 Wallet Authentication** (Đăng nhập trực tiếp bằng ví MetaMask, không sử dụng tài khoản/mật khẩu truyền thống).

### Bước 0: Kết nối Ví & Phân quyền (Xác thực Web3)
1. Người dùng truy cập trang chủ **Club POAP** (`localhost:3000`) và bấm kết nối ví **MetaMask** trên mạng **Sepolia Testnet**.
2. Hệ thống tự động đọc địa chỉ ví (ví dụ: `0x4da3...5656`):
   - **Nếu là ví Ban Tổ Chức (Admin Wallet):** Mở khóa quyền tạo sự kiện và xuất mã QR tại phân hệ **Ban Tổ Chức (Admin)**.
   - **Nếu là ví Sinh viên:** Sử dụng trực tiếp hai phân hệ **Sinh Viên Điểm Danh** và **Bộ Sưu Tập Cá Nhân**.

---

### Luồng 1: Trước & Trong sự kiện — Dành cho Ban Tổ Chức (Tuyen phụ trách)
1. **Tạo sự kiện:** Admin truy cập `/admin`, nhập thông tin hội thảo (Tên sự kiện, Đơn vị tổ chức, Thời gian, Số lượng giới hạn) và tải lên hình ảnh Huy hiệu (Badge).
2. **Lưu trữ & Khởi tạo:**
   - Hình ảnh huy hiệu và thông tin (Metadata) được đẩy lên mạng lưu trữ phi tập trung **IPFS (Pinata)** để lấy đường dẫn `tokenURI`.
   - Dữ liệu sự kiện và khóa bí mật sinh QR động (`speakeasy`) được lưu trữ trên **MongoDB Atlas**.
3. **Chiếu mã QR điểm danh động:**
   - Tại hội trường sự kiện, Admin mở màn hình trình chiếu QR của sự kiện đó.
   - Mã QR kèm mã code dự phòng sẽ **tự động làm mới (refresh) sau mỗi 20 giây** nhằm chống việc sinh viên chụp ảnh mã QR gửi cho người ở nhà quét hộ.

---

### Luồng 2: Tại sự kiện — Dành cho Sinh Viên Điểm Danh (Người 2 phụ trách)
1. **Quét mã QR:** Sinh viên có mặt tại hội thảo truy cập `/checkin` (hoặc dùng camera điện thoại), quét mã QR trên màn chiếu của Ban Tổ Chức (hoặc tải ảnh QR / nhập mã code sự kiện).
2. **Kiểm tra tính hợp lệ:**
   - Gửi token lấy từ mã QR lên Backend để thuật toán kiểm tra tính hợp lệ (Token có hết hạn chưa).
   - Kiểm tra ví MetaMask của sinh viên đã nhận huy hiệu của sự kiện này trước đó chưa (mỗi ví chỉ được nhận 1 lần/sự kiện).
3. **Điền thông tin & Nhận NFT (Claim POAP):**
   - Sinh viên nhập **MSSV + Họ tên** (hoặc hệ thống tự điền nếu đã lưu từ lần trước).
   - Bấm nút **"Nhận Huy Hiệu NFT (Claim Badge)"** -> Cửa sổ **MetaMask** bật lên yêu cầu xác nhận giao dịch trên mạng **Sepolia**.
   - Smart Contract thực thi hàm `claimBadge()`, đúc (mint) 1 **Soulbound NFT** gửi thẳng vào ví của sinh viên.

---

### Luồng 3: Sau sự kiện — Bộ Sưu Tập & Xác minh Chứng nhận (Người 3 phụ trách)
1. **Xem hồ sơ ngoại khóa:** Sinh viên truy cập `/collection`, hệ thống tự động truy vấn toàn bộ các **Soulbound Badge** đang nằm trong ví MetaMask đang kết nối (`0x4da3...5656`) để hiển thị thành bộ sưu tập cá nhân.
2. **Kiểm tra minh chứng chống giả mạo (Dành cho Nhà trường / Nhà tuyển dụng):**
   - Khi bấm vào một huy hiệu bất kỳ, màn hình hiển thị chi tiết thông tin và Địa chỉ Smart Contract.
   - Người kiểm tra chỉ cần bấm nút **"Xem trên Sepolia Etherscan"** để đối chiếu dữ liệu gốc trên Blockchain — đảm bảo chứng nhận là thật 100%, không thể chỉnh sửa bằng Photoshop hay làm giả.

---

## 3. Cấu trúc Thư mục Dự án (Monorepo)

Cấu trúc này giúp nhóm **3 thành viên** cùng làm việc lần lượt qua 3 giai đoạn (**Frontend --> Backend --> Blockchain**) mà không bị xung đột code (merge conflict):

```text
club-poap-system/
├── frontend/                     # Giai đoạn 1: Next.js App (Chạy tại localhost:3000)
│   └── src/
│       ├── app/                  
│       │   ├── page.tsx          
│       │   ├── layout.tsx        # Layout chung + Navbar + MetaMask Provider
│       │   ├── admin/            # [Tuyen] Trang quản lý & xuất QR của CLB (Hoàn thiện)
│       │   ├── checkin/          # [Người 2] Trang quét QR & nhận NFT của Sinh viên 
│       │   └── collection/       # [Người 3] Trang bộ sưu tập huy hiệu cá nhân
│       ├── components/
│       │   ├── share/            
│       │   ├── admin/            # [Tuyen] Các Component: CreateEventForm, EventTable, LiveQrStage
│       │   ├── checkin/          
│       │   └── collection/       
│       └── types/                
│
├── backend/                      # Giai đoạn 2: API, Sinh QR động, Lưu trữ MongoDB, IPFS
│   ├── src/
│   │   ├── models/
│   │   │   └── Event.js          # Schema Database lưu thông tin sự kiện
│   │   ├── routes/
│   │   │   └── events.js         # API (POST Tạo sự kiện, GET Lấy DS, POST Xác thực QR)
│   │   └── index.js              # Khởi tạo Server Express
│   ├── uploads/                  # Bộ đệm lưu ảnh tạm trước khi đẩy lên IPFS Pinata
│   └── .env                      # Chứa chuỗi kết nối MONGODB_URI và PINATA_KEYS
│
├── blockchain/                   # Giai đoạn 3: Hardhat/Foundry, Smart Contract (Soulbound NFT)
└── README.md                     # Tài liệu hướng dẫn & phân công dự án
```

---

## 4. TIẾN ĐỘ HIỆN TẠI & BÀN GIAO (Cập nhật mới nhất)

====================
== Ngày 26/10/2026: ==
====================

**A. Đã hoàn thành (Người 1 - Tuyen - Admin):**
- [x] **Cấu trúc thư mục:** Đã dọn dẹp sạch sẽ lỗi `import`, xử lý dứt điểm tình trạng trùng lặp thư mục `components`.
- [x] **Giao diện Admin (`/admin`):** Đã phân rã chuẩn thành các component độc lập.
- [x] **Navbar (Web3 Wallet):** Thay thế dữ liệu giả bằng kết nối **MetaMask thực tế 100%** qua Wagmi.

====================
== Ngày 29/10/2026: ==
====================

**A. Đã hoàn thành (Người 1 - Tuyen - Admin):**
- [x] **Xây dựng Backend Backend hoàn chỉnh:** Thiết lập thành công Express Server tại cổng 5000. Kết nối thành công MongoDB Atlas, cấu hình lưu trữ IPFS qua Pinata, và sử dụng `speakeasy` sinh mã bí mật cho thuật toán QR động (TOTP 20 giây/lần).
- [x] **Tích hợp Toàn diện Frontend & Backend (Admin):**
  - Đã xóa sạch Mock Data.
  - Form tạo sự kiện đã chuyển đổi sang `FormData` và gửi thành công dữ liệu/ảnh thật lên Backend.
  - Bảng Quản trị hiển thị Real-time từ Database, các trạng thái Đóng/Mở hoạt động mượt mà.
  - Xử lý hoàn tất lỗi bộ Date-time picker thân thiện và lỗi nhập số 0.
  - Xử lý triệt để các cảnh báo lỗi liên kết thư viện `wagmi` / MetaMask.
- **[🎉] BÀN GIAO:** Tuyen đã hoàn thiện 100% công việc của phân hệ Ban Tổ Chức (Admin). Giao diện và API đã sẵn sàng để đón luồng của Sinh Viên.

**B. Đã hoàn thành (Người 2 - Sinh viên Điểm danh / Check-in):**
- [x] **Xây dựng tuyến đường & Giao diện Check-in (`/checkin`):** Đã hoàn thiện trang quét mã QR và xác nhận điểm danh cho sinh viên (`src/app/checkin/page.tsx`).
- [x] **Phát triển các Component Check-in riêng biệt:** Tổ chức thư mục `src/components/checkin/` với các component xử lý luồng quét mã, hiển thị trạng thái sự kiện và tương tác nhận huy hiệu.
- [x] **Tích hợp logic xử lý mã QR động & Trạng thái Claim:** Xây dựng luồng nhận diện mã QR (quét hoặc nhập mã code thủ công), tích hợp hiệu ứng trạng thái chờ xử lý (processing) và nhận thành công (success) khi sinh viên bấm nhận NFT huy hiệu.

**B. Nhiệm vụ tiếp theo (Bàn giao cho Người 2 - Sinh viên Checkin):**
1. **Tiếp nhận QR Code:** Sử dụng điện thoại quét mã QR động được chiếu trên màn hình của Tuyen để lấy đường link dẫn vào trang `/checkin`.
2. **Xử lý Param URL:** Trong trang `/checkin` (Frontend), sử dụng `useSearchParams` của Next.js để bóc tách `eventId`, `token` (mã động) từ link.
3. **Giao tiếp Backend:** Gọi API `POST /api/events/verify-qr` mà Tuyen đã viết sẵn để xác thực xem mã QR vừa quét còn hiệu lực hay đã hết hạn. Thiết kế thông báo lỗi (hết hạn) hoặc hiển thị thông tin sự kiện (thành công) cho Sinh Viên.