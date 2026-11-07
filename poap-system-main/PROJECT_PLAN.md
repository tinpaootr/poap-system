# 🎖️ Club POAP - Hệ thống Điểm danh & Cấp Chứng nhận NFT

Lưu giữ minh chứng tham gia các hội thảo, seminar học thuật vĩnh viễn trên Blockchain dưới dạng **Soulbound Badge** (NFT định danh không thể chuyển nhượng).

---

## 1. Tổng quan Đề tài

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
1. **Tạo sự kiện:** Admin truy cập `/admin`, nhập thông tin hội thảo (Tên sự kiện, Đơn vị tổ chức, Thời gian, Số lượng giới hạn, Chu kỳ đổi QR) và tải lên hình ảnh Huy hiệu (Badge).
2. **Lưu trữ & Khởi tạo On-chain:**
   - Hình ảnh huy hiệu và thông tin (Metadata) được đẩy lên mạng lưu trữ phi tập trung **IPFS (Pinata)** để lấy đường dẫn `tokenURI`.
   - Dữ liệu sự kiện và khóa bí mật sinh QR động (`speakeasy`) được lưu trữ trên **MongoDB Atlas**.
   - Cửa sổ MetaMask bật lên để Admin ký giao dịch `createEvent()` ghi nhận sự kiện lên Smart Contract trên mạng **Sepolia**.
3. **Chiếu mã QR điểm danh động & Quản lý danh sách:**
   - Tại hội trường sự kiện, Admin mở màn hình trình chiếu QR của sự kiện đó.
   - Mã QR kèm mã code dự phòng sẽ **tự động làm mới (refresh) theo chu kỳ (30s/45s/60s)** nhằm chống việc sinh viên chụp ảnh mã QR gửi cho người ở nhà quét hộ.
   - Khi số lượng sinh viên điểm danh đạt tối đa (`capacity`), cổng QR tự động khóa. Admin có thể xem trực tiếp danh sách sinh viên đã điểm danh và xuất báo cáo ra file **CSV (Excel)**.

---

### Luồng 2: Tại sự kiện — Dành cho Sinh Viên Điểm Danh (Người 2 phụ trách)
1. **Quét mã QR:** Sinh viên có mặt tại hội thảo truy cập `/checkin` (hoặc dùng camera điện thoại), quét mã QR trên màn chiếu của Ban Tổ Chức (hoặc tải ảnh QR / nhập mã code sự kiện).
2. **Kiểm tra tính hợp lệ:**
   - Gửi token lấy từ mã QR lên Backend để thuật toán kiểm tra tính hợp lệ (Token có hết hạn chưa).
   - Kiểm tra ví MetaMask của sinh viên đã nhận huy hiệu của sự kiện này trước đó chưa (mỗi ví và mỗi MSSV chỉ được nhận 1 lần/sự kiện).
3. **Điền thông tin & Nhận NFT (Claim POAP):**
   - Sinh viên nhập **MSSV + Lớp + Họ tên** (hoặc hệ thống tự động điền và khóa cố định nếu ví đã liên kết từ lần điểm danh trước).
   - Bấm nút **"Nhận Huy Hiệu (Claim POAP / SBT)"** -> Ký xác thực thông điệp định danh (không tốn gas) -> Cửa sổ **MetaMask** bật lên yêu cầu xác nhận giao dịch `claimBadge()` trên mạng **Sepolia**.
   - Smart Contract đúc (mint) 1 **Soulbound NFT (ERC-5192)** gửi thẳng vào ví của sinh viên và Backend đối chiếu receipt on-chain trước khi lưu lịch sử.

---

### Luồng 3: Sau sự kiện — Bộ Sưu Tập & Xác minh Chứng nhận (Người 3 phụ trách)
1. **Xem hồ sơ ngoại khóa:** Sinh viên truy cập `/collection`, hệ thống tự động truy vấn toàn bộ các **Soulbound Badge** đang nằm trong ví MetaMask đang kết nối (`0x4da3...5656`) để hiển thị thành bộ sưu tập cá nhân.
2. **Kiểm tra minh chứng chống giả mạo (Dành cho Nhà trường / Nhà tuyển dụng):**
   - Khi bấm vào một huy hiệu bất kỳ, màn hình hiển thị chi tiết thông tin, đối chiếu trực tiếp `ownerOf`, `balanceOf`, `locked` trên Blockchain và Địa chỉ Smart Contract.
   - Người kiểm tra chỉ cần bấm nút **"Xem Giao Dịch Trên Sepolia Etherscan"** hoặc **"Xem Token"** để đối chiếu dữ liệu gốc trên Blockchain — đảm bảo chứng nhận là thật 100%, không thể chỉnh sửa bằng Photoshop hay làm giả.

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
│       │   ├── admin/            # [Tuyen] Trang quản lý, xuất QR & danh sách SV của CLB
│       │   ├── checkin/          # [Trâm] Trang quét QR & nhận NFT của Sinh viên 
│       │   └── collection/       # [Kiệt] Trang bộ sưu tập huy hiệu cá nhân
│       ├── components/
│       │   ├── share/            
│       │   ├── admin/            # [Tuyen] CreateEventForm, EventTable, LiveQrStage
│       │   ├── checkin/          # [Trâm] ScannerPanel, EventDetailsPanel
│       │   └── collection/       # [Kiệt] StudentProfileHeader, FilterToolbar, BadgeCard, CredentialModal
│       ├── hooks/                # useCollection, useOnchainVerify
│       └── lib/                  # contractABI.json, collectionApi, collectionMapper
│
├── backend/                      # Giai đoạn 2: API, Sinh QR động, Lưu trữ MongoDB, IPFS
│   ├── src/
│   │   ├── models/
│   │   │   ├── Event.js          # Schema Database lưu thông tin sự kiện
│   │   │   └── Attendance.js     # Schema Database lưu lịch sử điểm danh (Ví, MSSV, Họ tên, Lớp, txHash)
│   │   ├── routes/
│   │   │   ├── events.js         # API Sự kiện, QR TOTP, Điểm danh & Danh sách SV
│   │   │   └── collection.js     # API Bộ sưu tập & Xác minh công khai
│   │   └── index.js              # Khởi tạo Server Express
│   ├── uploads/                  # Bộ đệm lưu ảnh tạm trước khi đẩy lên IPFS Pinata
│   └── .env                      # Chứa chuỗi kết nối MONGODB_URI, PINATA_KEYS, CONTRACT_ADDRESS
│
├── blockchain/                   # Giai đoạn 3: Hardhat, Smart Contract (ClubPOAP.sol - ERC-5192)
└── PROJECT_PLAN.md               # Tài liệu hướng dẫn & nhật ký tiến độ dự án
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
- [x] **Xây dựng Backend hoàn chỉnh:** Thiết lập thành công Express Server tại cổng 5000. Kết nối thành công MongoDB Atlas, cấu hình lưu trữ IPFS qua Pinata, và sử dụng `speakeasy` sinh mã bí mật cho thuật toán QR động (TOTP).
- [x] **Tích hợp Toàn diện Frontend & Backend (Admin):**
  - Đã xóa sạch Mock Data.
  - Form tạo sự kiện đã chuyển đổi sang `FormData` và gửi thành công dữ liệu/ảnh thật lên Backend.
  - Bảng Quản trị hiển thị Real-time từ Database, các trạng thái Đóng/Mở hoạt động mượt mà.
  - Xử lý hoàn tất lỗi bộ Date-time picker thân thiện và lỗi nhập số 0.
  - Xử lý triệt để các cảnh báo lỗi liên kết thư viện `wagmi` / MetaMask.

====================
== Ngày 31/10/2026: ==
====================

**A. Đã hoàn thành (Người 1 - Tuyen - Admin):**
- [x] **Hoàn thiện IPFS & Metadata chuẩn ERC-721:** Hệ thống nay đã đẩy cả ảnh (`ipfsImageHash`) và file JSON chứa thuộc tính sự kiện (`ipfsMetadataHash` / `tokenURI`) lên Pinata để sẵn sàng đúc NFT.
- [x] **Fix logic UI/UX màn hình Admin:**
  - Ẩn/khóa hoàn toàn mã QR khi sự kiện chuyển trạng thái "Đã kết thúc", thêm biểu tượng ổ khóa.
  - Đồng bộ thành công hiển thị số lượng sinh viên (`capacity`) và ID thật (`_id`) lên URL QR Code.
  - Sửa lỗi tràn chữ khi upload file ảnh có tên quá dài.
- [x] **Xử lý thuật toán TOTP (Chống gian lận thời gian):**
  - Nâng cấp API trả về "số giây thực tế còn lại" của mã QR để Frontend đếm ngược chính xác tuyệt đối, tránh lỗi "Lệch nhịp".
  - Bổ sung Nút **"Đổi Mã Ngay" (Panic Button)**: Gọi API mới ép đổi toàn bộ `qrSecret` để giết mã cũ ngay lập tức nếu bị chụp lén.
- [x] **Clean code & Tối ưu:** Dọn dẹp sạch sẽ các cảnh báo rác của Mongoose (vụ `deprecated new: true`) và Webpack (vụ thư viện `ox`).

====================
== Ngày 01/11/2026: ==
====================

**B. Đã hoàn thành (Người 2 - Trâm - Sinh viên điểm danh, nhánh `tram`):**
- [x] **Sửa lỗi 404 khi Claim:** Mã dự phòng trên màn chiếu chỉ hiển thị 4/6 số của mã TOTP nên Backend không xác thực được. Đã sửa `LiveQrStage.tsx` hiển thị đủ 6 số (`#POAP-XXXXXX`).
- [x] **Hoàn thiện 3 phương thức điểm danh (`ScannerPanel.tsx`):**
  - **Nhập mã dự phòng:** Chấp nhận `#POAP-123456`, `123456` hoặc dán link QR.
  - **Quét bằng Camera:** Dùng thư viện `html5-qrcode`, có chọn camera, bỏ qua camera ảo, báo lỗi rõ ràng.
  - **Tải ảnh QR:** Đọc mã QR trực tiếp từ ảnh (PNG, JPG, WEBP).
- [x] **Quét bằng camera điện thoại:** Trang `/checkin` tự đọc `eventId` + `token` từ link QR.
- [x] **Viết lại API `POST /student-checkin`:** Chuẩn hóa mã, luôn xác thực TOTP, kiểm tra ví/MSSV/họ tên, sự kiện đang mở, còn chỗ; **chống claim 2 lần** theo ví hoặc MSSV (409); trả thêm thông tin sự kiện và `code` lỗi.
- [x] **Nâng cấp API `POST /record-success`:** Kiểm tra dữ liệu, chống ghi trùng, trả về số người đã điểm danh.
- [x] **Sửa lỗi phụ:** Nút "Đổi Mã Ngay" ở chế độ máy chiếu nay đổi mã thật; thêm ví Admin thứ 2.
 
**D. Đã hoàn thành (Người 3 - Kiệt - Bộ sưu tập cá nhân, nhánh `kiet`):**
- [x] **Backend Bộ sưu tập (`backend/src/routes/collection.js`):** Viết 3 API mới tại `/api/collection`, tách riêng khỏi `events.js`. Chỉ đọc dữ liệu từ model `Event` và `Attendance`.
  - Tra cứu huy hiệu theo địa chỉ ví, chỉ hiển thị huy hiệu đã mint thành công (có `txHash`).
  - Hỗ trợ tìm kiếm theo tên sự kiện / đơn vị tổ chức và sắp xếp mới nhất / cũ nhất.
  - Trả sẵn link ảnh IPFS, link giao dịch và link contract trên Sepolia Etherscan.
- [x] **Nối Frontend `/collection` với dữ liệu thật:**
  - Xóa toàn bộ Mock Data.
  - Tạo `lib/collectionApi.ts`, `hooks/useCollection.ts` và `lib/collectionMapper.ts`.
  - Tích hợp trạng thái: chưa kết nối ví, đang tải, báo lỗi, chưa có huy hiệu.

====================
== Ngày 05/11/2026: ==
====================

**B. Đã hoàn thành (Người 2 - Trâm - Sinh viên điểm danh, nhánh `tram`):**
- [x] **Merge nhánh `kiet` vào `tram`:** Lấy đủ file Bộ sưu tập; thêm lại nút `ConnectWalletButton` ở trang chủ.
- [x] **Xác thực ví bằng chữ ký MetaMask:**
  - **`POST /student-challenge`:** Sinh thông điệp có nonce ngẫu nhiên (hết hạn 5 phút).
  - **`POST /student-checkin`:** Kiểm tra chữ ký bằng `ethers.verifyMessage`, khớp ví mới cho điểm danh.
  - **`POST /record-success`:** Nhận `claimTicket` + `txHash`.
- [x] **Ràng buộc định danh & Dữ liệu sự kiện thật (`/checkin`):** 1 ví gắn 1 MSSV; API `POST /student-preview` trả thông tin sự kiện.

**C. Đã hoàn thành (Người 1 - Tuyen - Smart Contract & Blockchain Integration):**
- [x] **Triển khai Smart Contract chuẩn ERC-5192 (Soulbound Token):**
  - Viết và biên dịch hợp đồng `ClubPOAP.sol` tích hợp OpenZeppelin v5, hỗ trợ khóa vĩnh viễn (Non-transferable) và chặn hàm `transferFrom`.
  - Cấu hình Hardhat (`hardhat.config.js`) nhắm mục tiêu EVM Cancun tương thích chuẩn Solidity `0.8.24`.
- [x] **Deploy thành công lên mạng Sepolia Testnet:**
  - Địa chỉ Smart Contract chính thức: `0xaC4eFb69983d3874a9C28C3e7bE1fF33AD6ADF13`
  - Đã lưu ABI vào `frontend/src/lib/contractABI.json` và cập nhật biến môi trường `CONTRACT_ADDRESS` / `NEXT_PUBLIC_CONTRACT_ADDRESS`.
- [x] **Tích hợp Web3 Write Contract vào phân hệ Admin (`CreateEventForm.tsx`):**
  - Sử dụng thư viện `wagmi` (`useWriteContract`) để sau khi tạo sự kiện trên Database thành công, cửa sổ MetaMask tự động bật lên yêu cầu Admin ký giao dịch `createEvent` đưa sự kiện lên Blockchain on-chain.

====================
== Ngày 07/11/2026: ==
====================

**A. Đã hoàn thành (Người 1 - Tuyen - Hoàn thiện Admin, Quản lý Sinh viên & Đồng bộ Lớp toàn hệ thống):**
- [x] **Bổ sung Đơn vị tổ chức (`organizer`) cho Sự kiện:**
  - Thêm trường chọn đơn vị tổ chức (`Khoa CNTT`, `CLB Tin Học`, `Đoàn Thanh Niên`, `Hội Sinh Viên`) vào `CreateEventForm.tsx`, lưu vào `models/Event.js` và đính kèm vào thuộc tính JSON Metadata trên IPFS.
  - Hiển thị nhãn đơn vị tổ chức trên bảng sự kiện (`EventTable.tsx`), khung trình chiếu QR (`LiveQrStage.tsx`) và đồng bộ với bộ lọc của trang Bộ sưu tập (`/collection`).
- [x] **Tự động khóa sự kiện khi đủ số lượng (`capacity`):**
  - Nâng cấp Backend (`GET /api/events`, `GET /:id/qr-token`, `POST /record-success`) và Frontend (`LiveQrStage.tsx`, `EventTable.tsx`): tự động chuyển trạng thái sự kiện sang `'closed'`, ngừng cấp mã QR và khóa nút mở lại khi `currentAttendees >= capacity`.
- [x] **Tính năng Xem danh sách sinh viên đã điểm danh & Xuất CSV (Excel) cho Admin:**
  - Xây dựng API `GET /api/events/:id/attendees` trả về danh sách sinh viên đã điểm danh của từng sự kiện.
  - Bổ sung Modal danh sách sinh viên trong `EventTable.tsx` khi bấm vào cột số lượng (`currentAttendees / capacity`), hỗ trợ thanh tìm kiếm nhanh, link kiểm tra giao dịch trực tiếp trên Sepolia Etherscan và nút **Xuất CSV (Excel)** có hỗ trợ tiếng Việt (`UTF-8 BOM`).
- [x] **Bổ sung trường Lớp (`className`) đồng bộ xuyên suốt toàn hệ thống:**
  - **Database & API:** Thêm trường `className` vào `models/Attendance.js` và trả thêm `className` trong `routes/collection.js` (`toBadge`).
  - **Bảo mật & Chữ ký ví (`routes/events.js`):** Đưa thông tin `Lớp` vào thông điệp ký MetaMask (`POST /student-challenge`), kiểm tra tính nhất quán của Lớp với MSSV/Ví (`POST /student-checkin`), lưu `className` khi mint thành công (`POST /record-success`) và tự động cập nhật bổ sung `className` cho các lượt điểm danh cũ của cùng ví.
  - **Giao diện Điểm danh (`EventDetailsPanel.tsx`):** Thêm ô nhập `Lớp` cạnh `MSSV`; tự động điền và khóa ô `Lớp` nếu ví đã liên kết trước đó.
  - **Giao diện Admin (`EventTable.tsx`):** Bổ sung cột `Lớp` vào bảng Danh sách sinh viên đã điểm danh, cho phép tìm kiếm theo Lớp và xuất cột `Lớp` trong file CSV (Excel).

**B. Đã hoàn thành (Người 2 - Trâm - Sinh viên điểm danh, nhánh `tram`):**
- [x] **Đồng bộ nhánh `tuyen` vào `tram`:** Lấy đủ phần Smart Contract (`blockchain/`), `contractABI.json` và các file Admin mới; cài lại thư viện, cấu hình `.env` / `.env.local`.
- [x] **Nhận huy hiệu bằng Smart Contract thật (`EventDetailsPanel.tsx`):**
  - Thay `txHash` giả bằng giao dịch thật: sinh viên tự ký và trả gas, gọi `claimBadge(eventId, tokenURI)` qua `wagmi` (`useWriteContract`), `eventId` là `_id` MongoDB của sự kiện (khớp với `createEvent` phía Admin).
  - Đợi giao dịch được xác nhận trên Sepolia rồi mới gọi `POST /record-success` với `txHash` thật.
  - Báo lỗi rõ ràng: từ chối ký trong MetaMask, ví không đủ ETH Sepolia, ví đã nhận huy hiệu của sự kiện đó.
- [x] **Nâng cấp `POST /record-success`:** Bật kiểm tra định dạng `txHash`, xác minh giao dịch trên Sepolia (thành công, đúng contract, đúng ví gửi) và chặn dùng lại cùng một `txHash`. Cần có `CONTRACT_ADDRESS` trong `backend/.env`.
- [x] **Kiểm thử Smart Contract (`blockchain/test/ClubPOAP.test.js`):** 24 test đạt trên mạng Hardhat giả lập (tạo sự kiện, nhận huy hiệu, chống nhận 2 lần, hết chỗ, Soulbound không chuyển nhượng được, phân quyền Admin).
- [x] **Xác minh thực tế trên Sepolia:** Nhận huy hiệu thành công (Token ID 1 và 2), trạng thái `Success`, đúng contract `0xaC4eFb69983d3874a9C28C3e7bE1fF33AD6ADF13`; huy hiệu hiển thị ở `/collection`.
- [x] **Sửa lỗi phụ:** Cảnh báo trùng key ở trang Admin (`admin/page.tsx`): `handleCreateEvent` lọc trùng theo `_id`.

**D. Đã hoàn thành (Người 3 - Kiệt - Bộ sưu tập cá nhân; phần này do Trâm làm thay, nhánh `tram`):**
- [x] **Xác minh huy hiệu on-chain (`hooks/useOnchainVerify.ts`):** Đọc receipt của `txHash` trên Sepolia, lấy `tokenId` thật từ event `Transfer` (mint), đối chiếu `ownerOf(tokenId)` với ví đang xem, đọc `balanceOf(ví)` và `locked(tokenId)` (ERC-5192) trực tiếp từ contract, không phụ thuộc Backend.
- [x] **Nâng cấp `CredentialModal.tsx`:** Nhãn "Đã xác thực" phản ánh kết quả on-chain thật (đang kiểm tra / đã xác minh / không khớp / lỗi); thuộc tính khóa đọc từ `locked()`; hiển thị `ownerOf`, `balanceOf`, khối mint, địa chỉ contract (có nút copy).
- [x] **Liên kết Etherscan:** Nút "Xem Giao Dịch" (`/tx/<txHash>`), "Xem Token" (`/token/<contract>?a=<tokenId>`) và link contract.
- [x] **Kiểm thử thực tế trên Sepolia:** Token #3 và #5 xác minh thành công, `ownerOf` khớp ví, `locked` = true, trang Transfers trên Etherscan chỉ có 1 dòng mint (chứng minh Soulbound).

---

## 5. TÀI LIỆU BACKEND API (GIAO TIẾP VỚI FRONTEND)

### A. Cụm API Sự kiện & Điểm danh (`http://localhost:5000/api/events`)
1. **`POST /`**: Tạo sự kiện mới (Upload ảnh/Metadata lên IPFS, lưu MongoDB kèm `organizer`, cấu hình `contractAddress`).
2. **`GET /`**: Lấy danh sách toàn bộ sự kiện cho Bảng Quản trị (tự động đóng sự kiện đã đủ chỗ).
3. **`GET /:id/qr-token`**: Lấy mã TOTP hiện tại (`token`, `refreshInterval`, `remainingSeconds`).
4. **`PATCH /:id/status`**: Đóng/Mở trạng thái sự kiện (`upcoming`, `open`, `closed`).
5. **`POST /verify-qr`**: Kiểm tra mã QR (API cơ bản).
6. **`POST /:id/force-refresh-qr`**: Ép đổi khóa bí mật (Secret) để tạo mã khẩn cấp.
7. **`GET /:id/attendees`**: Lấy danh sách sinh viên đã điểm danh của sự kiện (gồm `studentId`, `fullName`, `className`, `walletAddress`, `claimedAt`, `txHash`) phục vụ Modal quản trị và xuất file CSV.
8. **`POST /student-preview`**: Lấy thông tin sự kiện sau khi quét/nhập mã.
9. **`POST /student-challenge`**: Tạo thông điệp có nonce (kèm Ví, MSSV, Họ tên, Lớp) để sinh viên ký bằng MetaMask.
10. **`POST /student-checkin`**: Xác thực mã QR + chữ ký ví + ràng buộc 1-1 giữa Ví/MSSV/Họ tên/Lớp + chống claim 2 lần.
11. **`POST /record-success`**: Ghi lịch sử điểm danh sau khi Mint thành công. Kiểm tra `txHash` đúng định dạng và xác minh giao dịch thật trên Sepolia (thành công, đúng contract, đúng ví gửi), chặn `txHash` dùng lại.

### B. Cụm API Bộ sưu tập & Xác minh (`http://localhost:5000/api/collection`)
12. **`GET /:wallet`**: Lấy danh sách các huy hiệu đã mint thành công của ví (hỗ trợ tìm kiếm và sắp xếp).
13. **`GET /:wallet/:eventId`**: Xem chi tiết 1 huy hiệu của ví theo sự kiện.
14. **`GET /verify/:eventId/:wallet`**: API xác minh công khai dành cho Nhà trường / Nhà tuyển dụng.

---

## 6. TRẠNG THÁI DỰ ÁN (SẴN SÀNG BẢO VỆ ĐỒ ÁN)
- [x] **Hoàn thiện 100% cả 3 phân hệ:** Ban Tổ Chức (`/admin`) — Sinh Viên Điểm Danh (`/checkin`) — Bộ Sưu Tập Cá Nhân (`/collection`).
- [x] **Smart Contract (`ClubPOAP.sol` - ERC-5192):** Đã triển khai và kiểm thử thực tế trên mạng **Sepolia Testnet** (`0xaC4eFb69983d3874a9C28C3e7bE1fF33AD6ADF13`).