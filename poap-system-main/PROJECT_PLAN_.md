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

### Luồng 1: Trước & Trong sự kiện — Dành cho Ban Tổ Chức (Người 1 phụ trách)
1. **Tạo sự kiện:** Admin truy cập `/admin`, nhập thông tin hội thảo (Tên sự kiện, Đơn vị tổ chức, Thời gian, Số lượng giới hạn) và tải lên hình ảnh Huy hiệu (Badge).
2. **Lưu trữ & Khởi tạo:**
   - Hình ảnh huy hiệu và thông tin (Metadata) được đẩy lên mạng lưu trữ phi tập trung **IPFS (Pinata)** để lấy đường dẫn `tokenURI`.
   - Admin xác nhận giao dịch trên MetaMask để lưu thông tin sự kiện lên Smart Contract (hoặc Backend).
3. **Chiếu mã QR điểm danh động:**
   - Tại hội trường sự kiện, Admin mở màn hình trình chiếu QR của sự kiện đó.
   - Mã QR kèm mã code dự phòng sẽ **tự động làm mới (refresh) sau mỗi 15–30 giây** nhằm chống việc sinh viên chụp ảnh mã QR gửi cho người ở nhà quét hộ.

---

### Luồng 2: Tại sự kiện — Dành cho Sinh Viên Điểm Danh (Người 2 phụ trách)
1. **Quét mã QR:** Sinh viên có mặt tại hội thảo truy cập `/checkin` (hoặc dùng camera điện thoại), quét mã QR trên màn chiếu của Ban Tổ Chức (hoặc tải ảnh QR / nhập mã code sự kiện).
2. **Kiểm tra tính hợp lệ:**
   - Hệ thống kiểm tra mã `token` trong QR còn hạn hay đã hết hạn (quá 30 giây).
   - Kiểm tra ví MetaMask của sinh viên đã nhận huy hiệu của sự kiện này trước đó chưa (mỗi ví chỉ được nhận 1 lần/sự kiện).
3. **Điền thông tin & Nhận NFT (Claim POAP):**
   - Sinh viên nhập **MSSV + Họ tên** (hoặc hệ thống tự điền nếu đã lưu từ lần trước).
   - Bấm nút **"Nhận Huy Hiệu NFT (Claim Badge)"** -> Cửa sổ **MetaMask** bật lên yêu cầu xác nhận giao dịch trên mạng **Sepolia**.
   - Smart Contract thực thi hàm `claimBadge()`, đúc (mint) 1 **Soulbound NFT** (huy hiệu gắn chặt vào ví, không thể chuyển nhượng hay mua bán) gửi thẳng vào ví của sinh viên.

---

### Luồng 3: Sau sự kiện — Bộ Sưu Tập & Xác minh Chứng nhận (Người 3 phụ trách)
1. **Xem hồ sơ ngoại khóa:** Sinh viên truy cập `/collection`, hệ thống tự động truy vấn toàn bộ các **Soulbound Badge** đang nằm trong ví MetaMask đang kết nối (`0x4da3...5656`) để hiển thị thành bộ sưu tập cá nhân.
2. **Kiểm tra minh chứng chống giả mạo (Dành cho Nhà trường / Nhà tuyển dụng):**
   - Khi bấm vào một huy hiệu bất kỳ, màn hình hiển thị chi tiết: Tên hội thảo, Họ tên + MSSV, Ngày cấp, Mã giao dịch (`Transaction Hash`) và Địa chỉ Smart Contract.
   - Người kiểm tra chỉ cần bấm nút **"Xem trên Sepolia Etherscan"** để đối chiếu dữ liệu gốc trên Blockchain — đảm bảo chứng nhận là thật 100%, không thể chỉnh sửa bằng Photoshop hay làm giả.

---

## 3. Cấu trúc Thư mục Dự án (Monorepo)

Cấu trúc này giúp nhóm **3 thành viên** cùng làm việc lần lượt qua 3 giai đoạn (**Frontend --> Backend --> Blockchain**) mà không bị xung đột code (merge conflict):

```text
club-poap-system/
├── frontend/                     # Giai đoạn 1: Next.js App (Chạy tại localhost:3000)
│   └── src/
│       ├── app/                  # Chia route độc lập cho 3 thành viên
│       │   ├── page.tsx          # Trang chủ điều hướng (Đã hoàn thành UI khung)
│       │   ├── layout.tsx        # Layout chung + Navbar + MetaMask Provider
│       │   ├── admin/            # [Người 1] Trang quản lý & xuất QR của CLB (Đã xong UI)
│       │   │   └── page.tsx
│       │   ├── checkin/          # [Người 2] Trang quét QR & nhận NFT của Sinh viên 
│       │   │   └── page.tsx
│       │   └── collection/       # [Người 3] Trang bộ sưu tập huy hiệu cá nhân
│       │       └── page.tsx
│       ├── components/
│       │   ├── share/            # Navbar, Button dùng chung (Đã tích hợp Web3 thực)
│       │   ├── admin/            # Component riêng của Người 1 (Form, Table, QR Stage)
│       │   ├── checkin/          # Component riêng của Người 2
│       │   └── collection/       # Component riêng của Người 3
│       ├── types/                # Định nghĩa kiểu dữ liệu (ClubEvent, EventStatus)
│
├── backend/                      # Giai đoạn 2: API, tạo mã QR động, lưu thông tin SV, IPFS
├── blockchain/                   # Giai đoạn 3: Hardhat/Foundry, Smart Contract (Soulbound NFT)
└── README.md                     # Tài liệu hướng dẫn & phân công dự án
```

---

## 4. TIẾN ĐỘ HIỆN TẠI & BÀN GIAO (Cập nhật mới nhất)

====================
== Ngày 26/10/26: ==
====================

**A. Đã hoàn thành (Người 1 - Admin):**
- [x] **Cấu trúc thư mục:** Đã dọn dẹp sạch sẽ lỗi `import`, xử lý dứt điểm tình trạng trùng lặp thư mục `components`.
- [x] **Giao diện Admin (`/admin`):** Đã phân rã chuẩn thành các component độc lập (`CreateEventForm.tsx`, `LiveQrStage.tsx`, `EventTable.tsx`). Các chức năng form, bảng theo dõi và phóng to màn chiếu QR đã hoạt động mượt mà.
- [x] **Navbar (Web3 Wallet):** 
  - Đã thay thế dữ liệu giả bằng kết nối **MetaMask thực tế 100%** qua `window.ethereum`.
  - Tự động nhận diện mạng **Sepolia**.
  - **Contextual Navigation (Điều hướng ngữ cảnh):** Navbar ẩn ở trang chủ, chỉ hiện menu Ban Tổ Chức khi vào `/admin`, phân tách hoàn toàn trải nghiệm với Sinh viên.

**B. Nhiệm vụ tiếp theo (Bàn giao cho Người 2 - Sinh viên Checkin):**
1. **Thiết lập thư mục:** Tạo `src/app/checkin/page.tsx`.
2. **Xử lý URL QR Code:** Viết logic đọc chuỗi URL từ mã QR màn chiếu (ví dụ lấy `eventId` và `token` từ link).
3. **Xây dựng UI Check-in:** Làm giao diện hiển thị thông tin sự kiện vừa quét và nút bấm **"Nhận Huy Hiệu NFT"** dành cho sinh viên.