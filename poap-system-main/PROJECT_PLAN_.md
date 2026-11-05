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

====================
== Ngày 31/10/2026 (Cập nhật mới): ==
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
- [x] **Hoàn thiện 3 phương thức điểm danh (`ScannerPanel.tsx`)** — trước đây chỉ là giao diện mẫu:
  - **Nhập mã dự phòng:** Chấp nhận `#POAP-123456`, `123456` hoặc dán link QR.
  - **Quét bằng Camera:** Dùng thư viện `html5-qrcode`, có chọn camera, bỏ qua camera ảo, báo lỗi rõ ràng.
  - **Tải ảnh QR:** Đọc mã QR trực tiếp từ ảnh (PNG, JPG, WEBP).
- [x] **Quét bằng camera điện thoại:** Trang `/checkin` tự đọc `eventId` + `token` từ link QR.
- [x] **Viết lại API `POST /student-checkin`:** Chuẩn hóa mã, luôn xác thực TOTP, kiểm tra ví/MSSV/họ tên, sự kiện đang mở, còn chỗ; **chống claim 2 lần** theo ví hoặc MSSV (409); trả thêm thông tin sự kiện và `code` lỗi.
- [x] **Nâng cấp API `POST /record-success`:** Kiểm tra dữ liệu, chống ghi trùng, trả về số người đã điểm danh.
- [x] **Sửa lỗi phụ:** Nút "Đổi Mã Ngay" ở chế độ máy chiếu nay đổi mã thật; thêm ví Admin thứ 2.
 
**D. Đã hoàn thành (Người 3 - Kiệt - Bộ sưu tập cá nhân, nhánh `kiet`):**
- [x] **Backend Bộ sưu tập (`backend/src/routes/collection.js`):** Viết 3 API mới tại `/api/collection`, tách riêng khỏi `events.js` nên không ảnh hưởng code của Tuyen và Trâm. Chỉ đọc dữ liệu từ model `Event`, không ghi gì vào DB.
  - Tra cứu huy hiệu theo địa chỉ ví (không phân biệt hoa/thường), chỉ hiển thị huy hiệu đã mint thành công (có `txHash`).
  - Hỗ trợ tìm kiếm theo tên sự kiện / đơn vị tổ chức và sắp xếp mới nhất / cũ nhất.
  - Trả sẵn link ảnh IPFS (Pinata gateway), link giao dịch và link contract trên Sepolia Etherscan.
  - Kiểm tra địa chỉ ví và mã sự kiện hợp lệ, không bao giờ trả `qrSecret` ra ngoài.
- [x] **Gắn route vào server:** Thêm 2 dòng `collectionRoutes` vào `backend/src/index.js`.
- [x] **Nối Frontend `/collection` với dữ liệu thật:**
  - Xóa toàn bộ Mock Data (`MOCK_STATS`, `ALL_6_BADGES`).
  - Tạo `lib/collectionApi.ts` (gọi API), `hooks/useCollection.ts` (tự tải huy hiệu theo ví MetaMask đang kết nối qua `wagmi`) và `lib/collectionMapper.ts` (chuyển dữ liệu API sang `BadgeItem` của giao diện hiện có).
  - Họ tên, MSSV, số huy hiệu, điểm rèn luyện được tính từ dữ liệu thật. Ảnh huy hiệu lấy từ IPFS.
  - Thêm các trạng thái: chưa kết nối ví, đang tải, báo lỗi (có nút Thử Lại), chưa có huy hiệu.

====================
== Ngày 05/11/2026: ==
====================

**B. Đã hoàn thành (Người 2 - Trâm - Sinh viên điểm danh, nhánh `tram`):**
- [x] **Merge nhánh `kiet` vào `tram`:** Lấy đủ file Bộ sưu tập (`useCollection`, `collectionMapper`, `collection.js`); thêm lại nút `ConnectWalletButton` ở trang chủ bị mất sau merge.
- [x] **Xác thực ví bằng chữ ký MetaMask:**
  - **API mới `POST /student-challenge`:** Sinh thông điệp có nonce ngẫu nhiên (dùng 1 lần, hết hạn 5 phút) để sinh viên ký.
  - **`POST /student-checkin`:** Kiểm tra chữ ký bằng `ethers.verifyMessage`, khớp ví mới cho điểm danh; MSSV/họ tên lấy từ thông điệp đã ký. Chống giả mạo ví và replay attack.
  - **`POST /record-success`:** Chỉ nhận `claimTicket` (vé dùng 1 lần, 10 phút) + `txHash`, không thể gọi thẳng API để ghi huy hiệu giả.
- [x] **Ràng buộc định danh:** 1 ví chỉ gắn 1 MSSV và ngược lại (`WALLET_BOUND`, `STUDENT_BOUND`); họ tên phải khớp lần trước (`NAME_MISMATCH`). Frontend tự điền và khóa ô MSSV/Họ tên khi ví đã liên kết.
- [x] **Dữ liệu sự kiện thật ở `/checkin`:** API mới `POST /student-preview` trả tên, ảnh IPFS, thời gian, số người đã điểm danh ngay sau khi quét mã; báo lỗi mã sai/hết hạn ngay. Xóa toàn bộ dữ liệu cứng.
- [x] **Sửa luồng Claim (`EventDetailsPanel.tsx`):** Hết kẹt "Đang Ký Giao Dịch Sepolia..."; xử lý lỗi 400/401/404/409 trong khung lỗi thay vì màn hình đỏ Next.js; nút "Xem Bộ Sưu Tập" chuyển trang.
- [x] **Sửa camera (`ScannerPanel.tsx`):** Tắt camera tắt hẳn đèn webcam; sửa lệch khung nút "Bật camera".
- [x] **Sửa Bộ sưu tập trống (`collection.js`, phối hợp Kiệt):** Đổi sang đọc collection `Attendance` (nơi `record-success` lưu) thay vì `Event.attendees`; sửa link ảnh IPFS bị lặp `ipfs://`.
- [x] **Lưu ý khi pull:** Chạy `npm install ethers` trong `backend`; body `student-checkin` và `record-success` đã đổi (xem mục 5).

---

## 5. TÀI LIỆU BACKEND API (GIAO TIẾP VỚI FRONTEND)

Dưới đây là danh sách 10 API đã hoàn thiện tại `http://localhost:5000/api/events`

1. **`POST /`**: Tạo sự kiện mới. (Nhận `FormData` gồm ảnh, tên, thời gian, số lượng. Trả về thông tin sự kiện sau khi đẩy lên IPFS).
2. **`GET /`**: Lấy danh sách toàn bộ sự kiện để đổ vào Bảng Quản trị.
3. **`GET /:id/qr-token`**: Lấy mã TOTP hiện tại để chiếu lên màn hình. Trả về `token`, `refreshInterval`, và `remainingSeconds` (số giây còn lại của mã).
4. **`PATCH /:id/status`**: Đóng/Mở trạng thái sự kiện (`upcoming`, `open`, `closed`).
5. **`POST /verify-qr`**: Kiểm tra mã QR (API cũ, trang `/checkin` hiện dùng `student-preview` thay thế).
   - Body gửi lên: `{ "eventId": "...", "qrToken": "..." }`
   - Trả về `200` kèm `tokenURI` nếu hợp lệ. Trả về `400` nếu mã hết hạn hoặc sự kiện đã đóng.
6. **`POST /:id/force-refresh-qr`**: Ép đổi khóa bí mật (Secret) để tạo mã khẩn cấp, vô hiệu hóa mã cũ.

**Phân hệ Sinh viên (Trâm) — gọi theo thứ tự 7 → 8 → 9 → (mint) → 10:**

7. **`POST /student-preview` (Trâm)**: Lấy thông tin sự kiện ngay sau khi quét/nhập mã (chưa điểm danh, chưa cần ký).
   - Body: `{ "eventId" (có thể bỏ trống), "qrToken" }`
   - Trả về `200` kèm `event`. Lỗi: `INVALID_CODE`, `CODE_EXPIRED`, `EVENT_CLOSED`, `EVENT_FULL` (400), `EVENT_NOT_FOUND`, `NO_OPEN_EVENT` (404).
8. **`POST /student-challenge` (Trâm)**: Tạo thông điệp có nonce để sinh viên ký bằng MetaMask.
   - Body: `{ "walletAddress", "studentId", "fullName" }`
   - Trả về `200` kèm `message`. Nonce dùng 1 lần, hết hạn 5 phút.
9. **`POST /student-checkin` (Trâm)**: Xác thực mã QR + chữ ký ví + ràng buộc ví/MSSV/họ tên + chống claim 2 lần.
   - Body: `{ "eventId" (có thể bỏ trống), "qrToken", "walletAddress", "signature" }`
   - Trả về `200` kèm `eventId`, `tokenURI`, `event`, `claimTicket`.
   - Lỗi trả `{ code, error }`: như mục 7, thêm `CHALLENGE_EXPIRED`, `SIGNATURE_INVALID` (401), `ALREADY_CLAIMED`, `WALLET_BOUND`, `STUDENT_BOUND`, `NAME_MISMATCH` (409).
10. **`POST /record-success` (Trâm)**: Ghi lịch sử điểm danh sau khi Mint thành công.
    - Body: `{ "claimTicket", "txHash" }` — ví/MSSV/sự kiện lấy từ vé, không nhận từ client.
    - Trả về `201` kèm `currentAttendees`; `401 TICKET_INVALID` nếu vé sai/hết hạn/đã dùng; `409` nếu đã ghi nhận trước đó.
---

## 6. NHIỆM VỤ TIẾP THEO (GIAI ĐOẠN 3: BLOCKCHAIN)

**Dành cho Người 1 (Tuyen) - Bắt đầu vào thư mục `/blockchain`:**

1. **Viết Smart Contract (`ClubPOAP.sol`):**
   - Viết mã nguồn Solidity theo chuẩn **ERC-5192 (Soulbound NFT)**. Nó kế thừa ERC-721 nhưng phải override hàm `transferFrom` (thêm revert) để đảm bảo NFT đúc ra dính chết vào ví sinh viên, không thể gửi cho người khác.
   - Viết hàm `createEvent(string memory _eventId, uint256 _capacity)` dành riêng cho Admin (sử dụng modifier `onlyOwner` hoặc AccessControl).
   - Viết hàm `claimBadge(string memory _eventId, string memory _tokenURI)` cho sinh viên gọi (kèm logic kiểm tra ví đó đã claim chưa, số lượng đã vượt quá `capacity` chưa).
2. **Deploy lên mạng Sepolia:** Cấu hình Hardhat hoặc Foundry để deploy Smart Contract lên mạng thử nghiệm Sepolia. Lấy địa chỉ Contract.
3. **Ghép Contract vào Admin Frontend:**
   - Cập nhật địa chỉ Contract vào `EventTable.tsx` và `LiveQrStage.tsx`.
   - Cấu hình hàm của nút "Tạo Sự Kiện" ở Frontend: Sau khi Backend lưu MongoDB xong, gọi thêm hook `useWriteContract` của thư viện `wagmi` để MetaMask của Ban tổ chức bật lên ký xác nhận đăng ký sự kiện on-chain.

   **C. Việc còn lại (Người 2 - Trâm):**
- [x] ~~Khung thông tin sự kiện ở `/checkin` vẫn dùng dữ liệu cứng~~ → đã đổi sang dữ liệu thật (05/11).
- [ ] Chờ Smart Contract deploy lên Sepolia → gọi `claimBadge` trong `EventDetailsPanel.tsx` (thay `// TODO` và `txHash` giả), chờ giao dịch xác nhận rồi mới gọi `record-success`; bật kiểm tra định dạng `txHash` ở backend.
- [ ] **Nhóm cần thống nhất ai trả gas:** Mục 2 ghi sinh viên tự ký `claimBadge()` (cần SepoliaETH), nhưng giao diện ghi "Phí gas được nhà trường tài trợ 100%". Chọn (A) backend mint hộ bằng ví nhà trường, hoặc (B) sinh viên tự mint và sửa lại câu trên giao diện.
- [ ] Đề nghị contract `claimBadge` kiểm tra `claimed[eventId][msg.sender]` để chống nhận trùng ngay on-chain.
- [ ] Demo bằng điện thoại cần link `https` (ví dụ ngrok).

**E. Việc còn lại (Người 3 - Kiệt):**
- [ ] Chờ Smart Contract deploy → điền `CONTRACT_ADDRESS` vào `backend/.env`, hiển thị `tokenId` thật thay cho dấu "—".
- [ ] Thêm bước đối chiếu on-chain (`ethers`: `ownerOf` / `balanceOf`) vào API verify để chống giả mạo chặt hơn.
- [ ] Thêm `etherscanUrl`, `contractAddress` vào kiểu `BadgeItem` và nối nút "Xem trên Sepolia Etherscan" trong `CredentialModal.tsx`.
- [ ] Làm bộ lọc học kỳ / đơn vị trong `FilterToolbar.tsx` theo dữ liệu thật thay vì danh sách cố định.
- [ ] Hoàn thiện nút "Xuất Bảng Điểm" và "Chia Sẻ Hồ Sơ" (hiện chỉ copy link trang).
- [ ] Điểm rèn luyện mỗi huy hiệu đang mặc định 10, cần thống nhất với nhóm có lưu điểm theo sự kiện hay không.