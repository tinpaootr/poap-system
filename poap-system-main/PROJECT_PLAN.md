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
├── frontend/                                   # Giai đoạn 1: Next.js App (Chạy tại localhost:3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css                     # Cấu hình Tailwind CSS
│   │   │   ├── layout.tsx                      # Layout chung + Navbar + Providers
│   │   │   ├── page.tsx                        # Trang chủ điều hướng 3 phân hệ
│   │   │   ├── providers.tsx                   # WagmiProvider & QueryClientProvider
│   │   │   ├── wagmi.ts                        # Cấu hình kết nối MetaMask & mạng Sepolia
│   │   │   ├── admin/
│   │   │   │   └── page.tsx                    # [Tuyen] Trang quản trị sự kiện & trình chiếu QR
│   │   │   ├── checkin/
│   │   │   │   └── page.tsx                    # [Trâm] Trang sinh viên quét mã & nhận Soulbound NFT
│   │   │   └── collection/
│   │   │       └── page.tsx                    # [Kiệt] Trang bộ sưu tập huy hiệu cá nhân
│   │   │
│   │   ├── components/
│   │   │   ├── ConnectWalletButton.tsx         # Nút kết nối / ngắt kết nối ví MetaMask
│   │   │   ├── share/
│   │   │   │   └── Navbar.tsx                  # Thanh điều hướng & hiển thị trạng thái mạng Sepolia
│   │   │   ├── admin/                          # [Tuyen] Các Component phân hệ Ban Tổ Chức
│   │   │   │   ├── CreateEventForm.tsx         # Form tạo sự kiện, đẩy IPFS & gọi createEvent on-chain
│   │   │   │   ├── LiveQrStage.tsx             # Sân khấu trình chiếu QR động TOTP & chế độ toàn màn hình
│   │   │   │   ├── EventTable.tsx              # Bảng quản lý sự kiện, Modal danh sách SV (có Lớp) & Xuất CSV
│   │   │   │   └── types.ts                    # Định nghĩa kiểu dữ liệu ClubEvent, EventStatus
│   │   │   ├── checkin/                        # [Trâm] Các Component phân hệ Điểm danh
│   │   │   │   ├── ScannerPanel.tsx            # 3 phương thức: Quét Camera, Tải ảnh QR, Nhập mã dự phòng
│   │   │   │   ├── EventDetailsPanel.tsx       # Nhập MSSV/Lớp/Họ tên, ký ví, gọi claimBadge() & lưu lịch sử
│   │   │   │   └── CheckinHeader.tsx           # Banner tiêu đề cổng điểm danh Web3
│   │   │   └── collection/                     # [Kiệt] Các Component phân hệ Bộ sưu tập
│   │   │       ├── StudentProfileHeader.tsx    # Hồ sơ sinh viên, thống kê điểm rèn luyện & chia sẻ
│   │   │       ├── FilterToolbar.tsx           # Bộ lọc theo học kỳ, đơn vị tổ chức & tìm kiếm
│   │   │       ├── BadgeCard.tsx               # Thẻ hiển thị từng huy hiệu Soulbound ERC-5192
│   │   │       └── CredentialModal.tsx         # Modal chi tiết chứng nhận & đối chiếu dữ liệu on-chain
│   │   │
│   │   ├── hooks/
│   │   │   ├── useCollection.ts                # Hook tải danh sách huy hiệu theo ví đang kết nối
│   │   │   └── useOnchainVerify.ts             # Hook đọc trực tiếp receipt, ownerOf, balanceOf, locked trên Sepolia
│   │   │
│   │   └── lib/
│   │       ├── contractABI.json                # ABI của Smart Contract ClubPOAP
│   │       ├── collectionApi.ts                # Các hàm gọi REST API /api/collection
│   │       └── collectionMapper.ts             # Chuyển đổi dữ liệu API sang định dạng hiển thị UI/SVG
│   └── .env.local                              # Chứa NEXT_PUBLIC_CONTRACT_ADDRESS, NEXT_PUBLIC_API_URL
│
├── backend/                                    # Giai đoạn 2: Express Server (Chạy tại localhost:5000)
│   ├── src/
│   │   ├── models/
│   │   │   ├── Event.js                        # Schema Sự kiện (name, organizer, capacity, ipfsHash, qrSecret...)
│   │   │   └── Attendance.js                   # Schema Điểm danh (eventId, walletAddress, studentId, fullName, className, txHash)
│   │   ├── routes/
│   │   │   ├── events.js                       # Cụm 11 API: Sự kiện, QR TOTP, Chữ ký ví, Verify Tx Sepolia, DS Sinh viên
│   │   │   └── collection.js                   # Cụm 3 API: Bộ sưu tập theo ví, Chi tiết huy hiệu, Xác minh công khai
│   │   └── index.js                            # Khởi tạo Express, cấu hình CORS & kết nối MongoDB Atlas
│   ├── uploads/                                # Bộ đệm lưu ảnh tạm trước khi đẩy lên IPFS Pinata
│   └── .env                                    # Chứa MONGODB_URI, PINATA_KEYS, CONTRACT_ADDRESS, SEPOLIA_RPC_URL
│
├── blockchain/                                 # Giai đoạn 3: Hardhat & Smart Contract (Solidity 0.8.24)
│   ├── contracts/
│   │   └── ClubPOAP.sol                        # Smart Contract chuẩn ERC-721 + ERC-5192 (Minimal Soulbound NFTs)
│   ├── scripts/
│   │   └── deploy.js                           # Script triển khai hợp đồng lên mạng Sepolia Testnet
│   ├── test/
│   │   └── ClubPOAP.test.js                    # Bộ 24 unit test kiểm thử toàn diện hợp đồng
│   └── hardhat.config.js                       # Cấu hình mạng Sepolia & trình biên dịch EVM Cancun
│
└── PROJECT_PLAN.md                             # Tài liệu kiến trúc hệ thống, API & nhật ký tiến độ dự án

```

---

## 4. TIẾN ĐỘ HIỆN TẠI & BÀN GIAO (Cập nhật mới nhất)

4. TIẾN ĐỘ HIỆN TẠI & BÀN GIAO (Cập nhật mới nhất)

====================
== Ngày 26/10/2026: ==

A. Đã hoàn thành (Người 1 - Tuyen - Admin):

[x] Cấu trúc dự án & Giao diện Admin (/admin): Chuẩn hóa cấu trúc thư mục, phân rã trang Admin thành các component độc lập và tích hợp kết nối ví MetaMask thực tế qua wagmi.

====================
== Ngày 29/10/2026: ==

A. Đã hoàn thành (Người 1 - Tuyen - Admin):

[x] Xây dựng Backend & Tích hợp Admin: Khởi tạo Express Server (cổng 5000), kết nối MongoDB Atlas, Pinata IPFS và thuật toán QR động (speakeasy TOTP). Nối thành công Form tạo sự kiện (FormData) và Bảng quản trị thời gian thực từ Database.

B. Đã hoàn thành (Người 2 - Trâm - Sinh viên điểm danh):

[x] Giao diện Điểm danh (/checkin): Xây dựng hoàn chỉnh bộ khung giao diện sinh viên gồm ScannerPanel.tsx (3 tab: Camera, Tải ảnh, Nhập mã) và EventDetailsPanel.tsx (hiển thị thông tin sự kiện, form định danh sinh viên và các trạng thái chờ ký/thành công).

C. Đã hoàn thành (Người 3 - Kiệt - Bộ sưu tập cá nhân):

[x] Giao diện Bộ sưu tập (/collection): Xây dựng hoàn chỉnh giao diện hồ sơ sinh viên (StudentProfileHeader.tsx), thanh lọc/tìm kiếm (FilterToolbar.tsx), lưới thẻ huy hiệu (BadgeCard.tsx) và Modal chi tiết chứng nhận (CredentialModal.tsx).

====================
== Ngày 31/10/2026: ==

A. Đã hoàn thành (Người 1 - Tuyen - Admin):

[x] Chuẩn hóa Metadata ERC-721 & QR TOTP: Đẩy ảnh + JSON Metadata (tokenURI) lên IPFS Pinata. Đồng bộ bộ đếm ngược TOTP theo thời gian thực từ Server, khóa QR khi sự kiện đóng và thêm nút "Đổi Mã Ngay" (reset qrSecret khẩn cấp).

====================
== Ngày 01/11/2026: ==

B. Đã hoàn thành (Người 2 - Trâm - Sinh viên điểm danh):

[x] Xử lý quét QR & API Điểm danh: Tích hợp html5-qrcode quét camera/tải ảnh QR và nhận diện mã 6 số (#POAP-XXXXXX). Xây dựng API POST /student-checkin và POST /record-success kiểm tra TOTP, trạng thái sự kiện và chống điểm danh trùng.

C. Đã hoàn thành (Người 3 - Kiệt - Bộ sưu tập cá nhân):

[x] Backend & Tích hợp Bộ sưu tập (/collection): Xây dựng 3 API tại routes/collection.js (danh sách theo ví, chi tiết huy hiệu, xác minh công khai). Xóa Mock Data, nối Frontend với dữ liệu thật qua useCollection.ts và collectionMapper.ts.

====================
== Ngày 05/11/2026: ==

A. Đã hoàn thành (Người 1 - Tuyen - Smart Contract & Blockchain):

[x] Triển khai Smart Contract ERC-5192 (ClubPOAP.sol): Viết hợp đồng Soulbound NFT (khóa chuyển nhượng vĩnh viễn) bằng OpenZeppelin v5, deploy lên Sepolia Testnet (0xaC4eFb69983d3874a9C28C3e7bE1fF33AD6ADF13) và tích hợp hàm createEvent vào CreateEventForm.tsx.

B. Đã hoàn thành (Người 2 - Trâm - Sinh viên điểm danh):

[x] Bảo mật chữ ký ví & Định danh 1-1: Bổ sung luồng ký nonce MetaMask (POST /student-challenge), xác thực chữ ký bằng ethers.verifyMessage, cấp vé claimTicket dùng 1 lần, ràng buộc 1 ví - 1 MSSV và thêm API POST /student-preview.

====================
== Ngày 07/11/2026: ==

A. Đã hoàn thành (Người 1 - Tuyen - Hoàn thiện Admin & Đồng bộ Lớp toàn hệ thống):

[x] Bổ sung Đơn vị tổ chức (organizer) & Tự động khóa khi đủ chỗ: Thêm lựa chọn đơn vị tổ chức khi tạo sự kiện (đồng bộ IPFS & bộ lọc /collection); tự động khóa sự kiện và ngừng cấp QR khi currentAttendees >= capacity.

[x] Xem danh sách sinh viên & Xuất CSV (Excel): Tạo API GET /:id/attendees và Modal quản lý danh sách sinh viên trong EventTable.tsx (tìm kiếm, link Etherscan, xuất file CSV chuẩn UTF-8).

[x] Bổ sung trường Lớp (className) toàn hệ thống: Thêm className vào Attendance.js, thông điệp ký MetaMask, kiểm tra định danh, form Điểm danh (EventDetailsPanel.tsx) và bảng/file CSV của Admin (EventTable.tsx).

B. Đã hoàn thành (Người 2 - Trâm - Sinh viên điểm danh):

[x] Mint Soulbound NFT thật & Đối chiếu giao dịch Sepolia: Nối hàm claimBadge(eventId, tokenURI) vào EventDetailsPanel.tsx. Nâng cấp POST /record-success kiểm tra receipt thật trên Sepolia (đúng contract, đúng ví, thành công) và hoàn thành 24 unit test Hardhat (ClubPOAP.test.js).

C. Đã hoàn thành (Người 3 - Kiệt - Bộ sưu tập cá nhân):

[x] Xác minh On-chain trực tiếp (useOnchainVerify.ts & CredentialModal.tsx): Đọc trực tiếp receipt giao dịch, ownerOf(tokenId), balanceOf(ví) và locked(tokenId) (ERC-5192) trên mạng Sepolia, kèm nút liên kết giao dịch và token trên Sepolia Etherscan.

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