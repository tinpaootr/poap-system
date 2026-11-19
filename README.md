# 🎖️ Club POAP - Hệ thống Điểm danh & Cấp Chứng nhận NFT

Lưu giữ minh chứng tham gia các hội thảo, seminar học thuật vĩnh viễn trên Blockchain dưới dạng **Soulbound Badge** (NFT định danh không thể chuyển nhượng).

---

## 1. Tổng quan Đề tài

- **Vấn đề:** Giấy chứng nhận tham gia hội thảo, seminar học thuật truyền thống dễ bị thất lạc, hư hỏng hoặc làm giả.
- **Giải pháp Blockchain:** Ứng dụng giao thức bằng chứng tham dự (**POAP - Proof of Attendance Protocol**). Mỗi sự kiện được quản lý và phát hành chứng nhận thông qua Smart Contract trên mạng thử nghiệm **Sepolia Testnet**.
- **Vai trò của MetaMask:** Sinh viên tham dự quét mã QR tại sự kiện, kết nối ví **MetaMask** và **ký xác thực** (không tốn gas) để chứng minh mình là chủ ví. Backend dùng **ví Minter của Ban Tổ Chức** đúc (mint) huy hiệu số (NFT) thẳng vào ví sinh viên — **sinh viên không cần có ETH, không trả phí gas**.
- **Kiến trúc lai (Hybrid):** Dữ liệu cá nhân (MSSV, Họ tên, Lớp) và khóa bí mật QR nằm **off-chain** trên MongoDB; bằng chứng tham dự (sự kiện, đã nhận chưa, chủ sở hữu NFT) nằm **on-chain** trên Sepolia; ảnh và metadata huy hiệu nằm trên **IPFS**.

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
   - Cửa sổ MetaMask bật lên để Admin ký giao dịch `createEvent(eventId, capacity)` ghi nhận sự kiện lên Smart Contract trên mạng **Sepolia** (`eventId` chính là `_id` MongoDB).
   - Bảng quản trị hiển thị trạng thái **"Đã đăng ký on-chain" / "Chưa có trên blockchain"**; nếu Admin lỡ hủy ký, có nút **"Đăng ký lại on-chain"**.
3. **Chiếu mã QR điểm danh động & Quản lý danh sách:**
   - Tại hội trường sự kiện, Admin mở màn hình trình chiếu QR của sự kiện đó.
   - Mã QR kèm mã code dự phòng sẽ **tự động làm mới (refresh) theo chu kỳ (30s/45s/60s)** nhằm chống việc sinh viên chụp ảnh mã QR gửi cho người ở nhà quét hộ.
   - Khi số lượng sinh viên điểm danh đạt tối đa (`capacity`), cổng QR tự động khóa. Admin có thể xem trực tiếp danh sách sinh viên đã điểm danh và xuất báo cáo ra file **CSV (Excel)**.

---

### Luồng 2: Tại sự kiện — Dành cho Sinh Viên Điểm Danh (Người 2 phụ trách)
1. **Quét mã QR:** Sinh viên có mặt tại hội thảo truy cập `/checkin` (hoặc dùng camera điện thoại quét QR → link mở thẳng `/checkin?token=...`), quét mã QR trên màn chiếu của Ban Tổ Chức (hoặc tải ảnh QR / nhập mã 6 số dự phòng `#POAP-XXXXXX`).
2. **Xem trước sự kiện (`POST /student-preview`):** Backend kiểm tra mã TOTP còn hiệu lực, sự kiện đang mở và còn chỗ, rồi trả thông tin sự kiện (không lộ `qrSecret`).
3. **Điền thông tin & Ký xác thực (`POST /student-challenge`):**
   - Sinh viên nhập **MSSV + Lớp + Họ tên** (hệ thống tự điền nếu ví đã liên kết từ lần điểm danh trước).
   - Bấm **"Nhận Huy Hiệu"** → Backend sinh **thông điệp có nonce ngẫu nhiên dùng 1 lần** (hết hạn sau 5 phút) → MetaMask bật lên yêu cầu **ký thông điệp** (Sign, không phải giao dịch, **không tốn gas**).
4. **Backend xác thực & Mint hộ (`POST /student-checkin`):**
   - Kiểm tra lại mã TOTP; khôi phục địa chỉ ví từ chữ ký (`ethers.verifyMessage`) và so khớp với ví sinh viên.
   - Chống trùng: mỗi ví / mỗi MSSV chỉ nhận 1 lần mỗi sự kiện; ràng buộc **1 ví ↔ 1 MSSV**; Họ tên/Lớp phải khớp lần đăng ký trước.
   - Đọc trạng thái on-chain (`events`, `claimed`): sự kiện đã đăng ký chưa, ví đã nhận chưa, còn chỗ không.
   - **Ví Minter của Backend** gọi `mintBadge(student, eventId, tokenURI)` trên contract (Ban Tổ Chức trả gas) → Smart Contract đúc 1 **Soulbound NFT (ERC-5192)** thẳng vào ví sinh viên.
   - Chờ Sepolia xác nhận → lưu `Attendance` kèm `txHash` → trả về txHash, tokenId, link Etherscan.
   - Nếu Sepolia xác nhận chậm (> 90 giây): trả **HTTP 202 (MINT_PENDING)**, Backend tiếp tục chờ ở nền và tự ghi nhận sau.
   - Nếu chain đã có huy hiệu nhưng DB chưa ghi (server sập giữa chừng): Backend **đối soát** qua log `BadgeClaimed` và ghi bù.

---

### Luồng 3: Sau sự kiện — Bộ Sưu Tập & Xác minh Chứng nhận (Người 3 phụ trách)
1. **Xem hồ sơ ngoại khóa:** Sinh viên truy cập `/collection`, hệ thống tự động truy vấn (`GET /api/collection/:wallet`) toàn bộ các **Soulbound Badge** đã mint thành công của ví MetaMask đang kết nối để hiển thị thành bộ sưu tập cá nhân (lọc theo học kỳ, đơn vị tổ chức, tìm kiếm, sắp xếp; thống kê điểm rèn luyện).
2. **Kiểm tra minh chứng chống giả mạo (Dành cho Nhà trường / Nhà tuyển dụng):**
   - Khi bấm vào một huy hiệu bất kỳ, màn hình hiển thị chi tiết thông tin, đối chiếu trực tiếp `ownerOf`, `balanceOf`, `locked` trên Blockchain và Địa chỉ Smart Contract.
   - Người kiểm tra chỉ cần bấm nút **"Xem Giao Dịch Trên Sepolia Etherscan"** hoặc **"Xem Token"** để đối chiếu dữ liệu gốc trên Blockchain — đảm bảo chứng nhận là thật 100%, không thể chỉnh sửa bằng Photoshop hay làm giả.

---

## 3. Cấu trúc Thư mục Dự án (Monorepo)

Cấu trúc này giúp nhóm **3 thành viên** cùng làm việc lần lượt qua 3 giai đoạn (**Frontend --> Backend --> Blockchain**) mà không bị xung đột code (merge conflict):

```text
poap-system/
├── frontend/                                   # Giai đoạn 1: Next.js 16 App (Chạy tại localhost:3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css                     # Import Tailwind CSS v4 & style chung
│   │   │   ├── layout.tsx                      # Layout chung + Navbar + Providers + font/icon
│   │   │   ├── page.tsx                        # Trang chủ điều hướng 3 phân hệ
│   │   │   ├── providers.tsx                   # WagmiProvider & QueryClientProvider (chỉ render phía client)
│   │   │   ├── wagmi.ts                        # Cấu hình connector MetaMask/Injected & mạng Sepolia
│   │   │   ├── admin/
│   │   │   │   └── page.tsx                    # [Tuyen] Trang quản trị sự kiện & trình chiếu QR
│   │   │   ├── checkin/
│   │   │   │   └── page.tsx                    # [Trâm] Trang sinh viên quét mã & nhận Soulbound NFT (đọc ?token=)
│   │   │   └── collection/
│   │   │       └── page.tsx                    # [Kiệt] Trang bộ sưu tập huy hiệu cá nhân
│   │   │
│   │   ├── components/
│   │   │   ├── ConnectWalletButton.tsx         # Nút kết nối / ngắt kết nối ví MetaMask
│   │   │   ├── share/
│   │   │   │   └── Navbar.tsx                  # Thanh điều hướng, hiển thị ví & nút chuyển sang mạng Sepolia
│   │   │   ├── admin/                          # [Tuyen] Các Component phân hệ Ban Tổ Chức
│   │   │   │   ├── CreateEventForm.tsx         # Form tạo sự kiện -> Backend đẩy IPFS -> Admin ký createEvent on-chain
│   │   │   │   ├── LiveQrStage.tsx             # Trình chiếu QR động TOTP, đếm ngược, "Đổi mã ngay", toàn màn hình
│   │   │   │   ├── EventTable.tsx              # Bảng sự kiện, đóng/mở điểm danh, Modal danh sách SV & Xuất CSV
│   │   │   │   ├── OnchainEventStatus.tsx      # Đọc events(eventId) trên contract, nút "Đăng ký lại on-chain"
│   │   │   │   └── types.ts                    # Định nghĩa kiểu dữ liệu ClubEvent, EventStatus
│   │   │   ├── checkin/                        # [Trâm] Các Component phân hệ Điểm danh
│   │   │   │   ├── ScannerPanel.tsx            # 3 phương thức: Quét Camera, Tải ảnh QR, Nhập mã dự phòng
│   │   │   │   ├── EventDetailsPanel.tsx       # Nhập MSSV/Lớp/Họ tên -> xin challenge -> ký ví -> gửi student-checkin
│   │   │   │   └── CheckinHeader.tsx           # Banner tiêu đề cổng điểm danh Web3
│   │   │   └── collection/                     # [Kiệt] Các Component phân hệ Bộ sưu tập
│   │   │       ├── StudentProfileHeader.tsx    # Hồ sơ sinh viên, thống kê điểm rèn luyện, avatar (localStorage)
│   │   │       ├── FilterToolbar.tsx           # Bộ lọc theo học kỳ, đơn vị tổ chức, tìm kiếm & sắp xếp
│   │   │       ├── BadgeCard.tsx               # Thẻ hiển thị từng huy hiệu Soulbound ERC-5192 (+ kiểu BadgeItem)
│   │   │       └── CredentialModal.tsx         # Modal chi tiết chứng nhận & đối chiếu dữ liệu on-chain
│   │   │
│   │   ├── hooks/
│   │   │   ├── useCollection.ts                # Hook tải danh sách huy hiệu theo ví đang kết nối
│   │   │   └── useOnchainVerify.ts             # Hook đọc trực tiếp receipt, ownerOf, balanceOf, locked trên Sepolia
│   │   │
│   │   └── lib/
│   │       ├── apiBase.ts                      # Địa chỉ gốc Backend API (NEXT_PUBLIC_API_URL)
│   │       ├── contractABI.json                # ABI của Smart Contract ClubPOAP (copy từ blockchain/artifacts)
│   │       ├── collectionApi.ts                # Các hàm gọi REST API /api/collection
│   │       └── collectionMapper.ts             # Chuyển đổi dữ liệu API sang định dạng hiển thị UI/SVG, tính học kỳ
│   ├── next.config.ts                          # Cấu hình webpack (bỏ qua module Node của MetaMask SDK)
│   ├── .env.example                            # Mẫu biến môi trường
│   └── .env.local                              # NEXT_PUBLIC_CONTRACT_ADDRESS, NEXT_PUBLIC_API_URL (không commit)
│
├── backend/                                    # Giai đoạn 2: Express Server (Chạy tại localhost:5000)
│   ├── src/
│   │   ├── lib/
│   │   │   └── minter.js                       # Ví Minter mint hộ: NonceManager, hàng đợi gửi tx, dịch lỗi, đối soát log
│   │   ├── models/
│   │   │   ├── Event.js                        # Schema Sự kiện (name, organizer, capacity, ipfsHash, qrSecret, refreshInterval...)
│   │   │   └── Attendance.js                   # Schema Điểm danh (eventId, walletAddress, studentId, fullName, className, txHash)
│   │   ├── routes/
│   │   │   ├── events.js                       # Cụm 10 API: Sự kiện, QR TOTP, Challenge/Chữ ký ví, Check-in & Mint hộ, DS Sinh viên
│   │   │   └── collection.js                   # Cụm 3 API: Bộ sưu tập theo ví, Chi tiết huy hiệu, Xác minh công khai
│   │   └── index.js                            # Khởi tạo Express, CORS, kết nối MongoDB Atlas, kiểm tra ví Minter
│   ├── uploads/                                # Bộ đệm lưu ảnh tạm trước khi đẩy lên IPFS Pinata (xóa sau khi pin)
│   ├── .env.example                            # Mẫu biến môi trường
│   └── .env                                    # MONGODB_URI, PINATA keys, SEPOLIA_RPC_URL, MINTER_PRIVATE_KEY, CONTRACT_ADDRESS (không commit)
│
├── blockchain/                                 # Giai đoạn 3: Hardhat & Smart Contract (Solidity 0.8.24)
│   ├── contracts/
│   │   └── ClubPOAP.sol                        # Smart Contract ERC-721 + ERC-5192 (Soulbound), createEvent, mintBadge, setAdmin
│   ├── scripts/
│   │   ├── deploy.js                           # Triển khai hợp đồng lên Sepolia, in địa chỉ + block deploy
│   │   └── setAdmin.js                         # Owner cấp / gỡ quyền Admin cho ví Minter của Backend
│   ├── test/
│   │   └── ClubPOAP.test.js                    # Bộ 27 unit test kiểm thử hợp đồng (Hardhat + Chai)
│   ├── artifacts/                              # (Tự sinh khi compile) ABI + bytecode, VD artifacts/contracts/ClubPOAP.sol/ClubPOAP.json
│   ├── cache/                                  # (Tự sinh) Bộ nhớ đệm biên dịch của Hardhat
│   ├── hardhat.config.js                       # Cấu hình mạng Sepolia & trình biên dịch Solidity 0.8.24 / EVM Cancun
│   └── .env.example                            # Mẫu: SEPOLIA_RPC_URL, ADMIN_PRIVATE_KEY (ví owner), MINTER_ADDRESS
│
├── HUONG_DAN_MINT_HO.md                        # Hướng dẫn cấu hình ví Minter & bảng mã lỗi mint hộ
├── README.md
└── PROJECT_PLAN.md                             # Tài liệu kiến trúc hệ thống, API & nhật ký tiến độ dự án

```

---

## 3.1. Công nghệ, Kỹ thuật & Thuật toán sử dụng

### A. Công nghệ (Tech Stack)

| Tầng | Công nghệ | Vai trò trong hệ thống |
|---|---|---|
| **Frontend** | **Next.js 16** (App Router, webpack) + **React 19** + **TypeScript** | Khung giao diện 3 phân hệ `/admin`, `/checkin`, `/collection` |
| | **Tailwind CSS v4**, lucide-react, Material Symbols | Giao diện, icon |
| | **wagmi v2 + viem** | Kết nối MetaMask, đọc/ghi Smart Contract, ký thông điệp, đọc receipt giao dịch |
| | **@tanstack/react-query** | Quản lý cache & trạng thái truy vấn của wagmi |
| | **qrcode.react** | Vẽ mã QR động trên màn trình chiếu |
| | **html5-qrcode** | Quét QR bằng camera / ảnh tải lên |
| | **axios**, Fetch API | Gọi REST API Backend |
| **Backend** | **Node.js + Express 5** | REST API |
| | **MongoDB Atlas + Mongoose 9** | Lưu sự kiện, điểm danh, dữ liệu cá nhân (off-chain) |
| | **ethers v6** | Ví Minter gửi giao dịch `mintBadge`, `NonceManager`, `verifyMessage`, đọc log |
| | **speakeasy** | Sinh & kiểm tra mã **TOTP** cho QR động |
| | **multer** | Nhận file ảnh upload (multipart/form-data) |
| | **@pinata/sdk (IPFS)** | Lưu ảnh huy hiệu & metadata JSON phi tập trung |
| | **Node crypto**, dotenv, cors, nodemon | Sinh nonce ngẫu nhiên, biến môi trường, CORS, tự reload |
| **Blockchain** | **Solidity 0.8.24** (EVM Cancun) | Ngôn ngữ Smart Contract |
| | **OpenZeppelin Contracts v5** (`ERC721URIStorage`, `Ownable`) | Thư viện NFT & phân quyền đã được kiểm toán |
| | **Hardhat 2** + hardhat-toolbox (ethers, Chai, Mocha) | Biên dịch, kiểm thử, triển khai |
| | **Ethereum Sepolia Testnet** + Etherscan | Mạng triển khai & tra cứu công khai |
| **Ví** | **MetaMask** | Định danh người dùng (Web3 login), ký thông điệp, ký `createEvent` |

### B. Chuẩn Blockchain áp dụng

| Chuẩn | Ý nghĩa |
|---|---|
| **ERC-721** | Chuẩn NFT: mỗi huy hiệu là 1 token duy nhất có `tokenId`, `ownerOf`, `tokenURI` |
| **ERC-5192 (Minimal Soulbound)** | Token bị khóa vĩnh viễn: `locked(tokenId) = true`, phát event `Locked` khi mint |
| **ERC-165** | `supportsInterface` để ví/sàn nhận biết contract hỗ trợ ERC-721, ERC-5192 |
| **ERC-4906** | Event `MetadataUpdate` (kế thừa từ ERC721URIStorage) |
| **EIP-191 (personal_sign)** | Chuẩn ký thông điệp của MetaMask dùng cho đăng nhập bằng ví |

### C. Kỹ thuật chính

1. **Kiến trúc lai On-chain / Off-chain / IPFS:** dữ liệu cá nhân không đưa lên blockchain công khai (bảo vệ quyền riêng tư); chỉ bằng chứng tham dự nằm on-chain; ảnh & metadata nằm IPFS (không phụ thuộc server nhóm).
2. **Soulbound Token:** override hàm `_update` của OpenZeppelin — mọi đường chuyển token (`transferFrom`, `safeTransferFrom`, qua `approve`) đều đi qua hàm này nên chỉ cần chặn 1 chỗ: `from != 0 && to != 0` → revert.
3. **Phân quyền 2 cấp trên contract:** `onlyOwner` (cấp/gỡ Admin bằng `setAdmin`) và `onlyAdmin` (`createEvent`, `mintBadge`).
4. **Backend Minter / Gasless cho sinh viên:** ví của Ban Tổ Chức gọi `mintBadge` hộ, sinh viên chỉ ký thông điệp (miễn phí).
5. **Web3 Authentication (Sign-In with Ethereum dạng đơn giản):** challenge có nonce ngẫu nhiên 16 byte, hết hạn 5 phút, dùng 1 lần → chống phát lại (replay) chữ ký.
6. **QR động TOTP:** mã đổi theo chu kỳ 30/45/60s; nút **"Đổi mã ngay"** sinh `qrSecret` mới làm vô hiệu mọi mã cũ.
7. **Chống trùng 3 tầng:** kiểm tra ở Backend → **unique index** `(eventId, walletAddress)` trong MongoDB → mapping `claimed[eventId][wallet]` trên contract. Kèm ràng buộc **1 ví ↔ 1 MSSV**, khớp Họ tên/Lớp.
8. **Checks-Effects-Interactions:** trong `mintBadge`, cập nhật `claimed`, `currentAttendees` **trước** khi `_safeMint` → chống tấn công reentrancy.
9. **Xử lý đồng thời khi mint hộ:** `ethers.NonceManager` + **hàng đợi gửi tuần tự** (`sendQueue`) để không trùng nonce; bước chờ xác nhận (`tx.wait`) chạy song song; **khóa in-flight** theo ví/MSSV chặn bấm 2 lần.
10. **Chịu lỗi & đối soát:** mạng chậm → HTTP **202 MINT_PENDING** + chờ ở nền (`finishMintInBackground`); chain có mà DB chưa có → quét log `BadgeClaimed` để ghi bù; lưu DB thử lại 3 lần; dịch lỗi revert thành mã lỗi dễ hiểu (`translateError`).
11. **Xác minh độc lập phía client:** `useOnchainVerify` đọc thẳng receipt, `ownerOf`, `balanceOf`, `locked` từ Sepolia — không tin dữ liệu Backend.
12. **Kiểm thử tự động:** 27 unit test Hardhat dùng `loadFixture` (snapshot trạng thái chain) chạy trên mạng giả lập trong máy.

### D. Thuật toán

| Thuật toán | Dùng ở đâu | Mô tả ngắn |
|---|---|---|
| **TOTP (RFC 6238) / HOTP (RFC 4226)** | `speakeasy` – QR động | `counter = floor(thời_gian_unix / step)`; `HMAC-SHA1(qrSecret, counter)` → cắt động (dynamic truncation) → lấy 6 chữ số. Kiểm tra cho phép lệch `window` chu kỳ để bù độ trễ quét |
| **Đếm ngược chu kỳ QR** | `GET /:id/qr-token` | `remainingSeconds = step − (epoch mod step)` |
| **Dò sự kiện theo mã** | `findEventByToken` | Không có `eventId` (nhập mã tay) → duyệt các sự kiện đang `open`, thử verify TOTP từng sự kiện |
| **ECDSA secp256k1 + Keccak-256** | `ethers.verifyMessage` | Băm thông điệp theo EIP-191 bằng Keccak-256, khôi phục public key/địa chỉ ví từ chữ ký (ecrecover), so khớp với ví khai báo |
| **Sinh nonce ngẫu nhiên an toàn** | `crypto.randomBytes(16)` | Nonce 128-bit không đoán được cho challenge |
| **Băm nội dung IPFS (CID)** | Pinata | Địa chỉ file = hash nội dung → sửa 1 byte là đổi địa chỉ, không giả mạo được metadata |
| **Hàng đợi FIFO bằng chuỗi Promise** | `enqueue` trong `minter.js` | Mỗi lệnh gửi nối đuôi lệnh trước → nonce tăng tuần tự 0, 1, 2… |
| **Quét log theo khoảng block (chunked scan)** | `findClaimTx` | Quét `BadgeClaimed` lùi từ block mới nhất về block deploy theo từng đoạn 40.000 block (giới hạn RPC) |
| **Thử lại với độ trễ tăng dần (linear backoff)** | `saveAttendance` | Lưu DB lỗi → chờ 1s, 2s rồi thử lại, tối đa 3 lần |
| **Chuẩn hóa chuỗi Unicode NFC** | So khớp Họ tên/Lớp | `normalize('NFC')`, gộp khoảng trắng, chữ thường → tránh lệch dấu tiếng Việt |
| **Tính học kỳ / khóa / hạng** | `collectionMapper.ts`, `collection/page.tsx` | Suy học kỳ từ ngày sự kiện, khóa học từ MSSV, hạng từ tổng điểm rèn luyện |
| **Nén ảnh avatar (center-crop)** | `StudentProfileHeader.tsx` | Cắt vuông giữa ảnh, thu về 256×256 bằng Canvas, lưu dạng Data URL |

---

## 4. TÀI LIỆU BACKEND API (GIAO TIẾP VỚI FRONTEND)

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
10. **`POST /student-checkin`**: Xác thực mã QR + chữ ký ví + ràng buộc 1-1 giữa Ví/MSSV/Họ tên/Lớp + chống claim 2 lần → **ví Minter của Backend mint hộ** `mintBadge` → lưu lịch sử kèm `txHash`. Trả `201` (thành công), `202 MINT_PENDING` (Sepolia xác nhận chậm) hoặc mã lỗi (`EVENT_NOT_ONCHAIN`, `ALREADY_CLAIMED`, `EVENT_FULL`, `SIGNATURE_INVALID`...).

> Đã gỡ bỏ: `POST /record-success` và hàm `claimBadge` (sinh viên không còn tự gửi giao dịch).

### B. Cụm API Bộ sưu tập & Xác minh (`http://localhost:5000/api/collection`)
11. **`GET /:wallet`**: Lấy danh sách các huy hiệu đã mint thành công của ví (hỗ trợ tìm kiếm và sắp xếp).
12. **`GET /:wallet/:eventId`**: Xem chi tiết 1 huy hiệu của ví theo sự kiện.
13. **`GET /verify/:eventId/:wallet`**: API xác minh công khai dành cho Nhà trường / Nhà tuyển dụng.

---
