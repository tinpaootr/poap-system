# Hướng dẫn: Backend mint hộ huy hiệu (sinh viên không trả gas)

## Luồng mới

1. Sinh viên quét mã, nhập MSSV / Lớp / Họ tên.
2. `POST /api/events/student-challenge` → backend trả thông điệp có nonce.
3. Sinh viên **ký thông điệp** bằng MetaMask (miễn phí, không gửi giao dịch).
4. `POST /api/events/student-checkin` → backend kiểm tra chữ ký + nonce, TOTP, sự kiện còn mở/còn chỗ,
   chống trùng ví/MSSV, ràng buộc 1 ví – 1 MSSV, khớp họ tên/lớp.
5. Qua hết → backend dùng **ví minter** (ví Admin cá nhân của người chạy backend) gọi `ClubPOAP.mintBadge(ví sinh viên, eventId, tokenURI)`,
   chờ xác nhận, lưu `Attendance` kèm `txHash`, trả txHash + link Etherscan cho frontend.

Thay đổi chính:

- Contract **không còn** `claimBadge()` công khai, **không còn** nhánh tự tạo sự kiện (capacity 1000).
  Chỉ ví Admin (owner + ví Tuyền/Trâm/Kiệt, hoặc ví được `setAdmin`) gọi được `mintBadge`. Logic Soulbound giữ nguyên.
- Route `POST /api/events/record-success` và `claimTicket` đã bị **gỡ bỏ**.
- Sự kiện phải được **đăng ký on-chain** (`createEvent`) trước khi sinh viên điểm danh, nếu không backend trả
  `EVENT_NOT_ONCHAIN` ("Sự kiện chưa được đăng ký trên blockchain…").
  Trang Admin hiện nhãn "Chưa có trên blockchain" + nút **"Đăng ký lại on-chain"** cho sự kiện đó.

## Contract đang dùng

| | |
|---|---|
| Mạng | Sepolia |
| Địa chỉ contract | `0x5D25Ebe07d284e27E63319F760543F2EBF859643` ([Etherscan](https://sepolia.etherscan.io/address/0x5D25Ebe07d284e27E63319F760543F2EBF859643)) |
| Block deploy | `12158927` (`CONTRACT_DEPLOY_BLOCK`) |
| Owner | Ví Kiệt `0x19F6f7e08644cbA7E9545666DCc0A2B42cd4e427` |
| Admin mặc định (constructor) | Tuyền `0x4da3…5656`, Trâm `0xfaA1…1Fd9`, Kiệt `0x19F6…e427` |

Đã deploy và test thành công: ví sinh viên 0 ETH điểm danh, backend mint hộ (token ID 2), ví Kiệt trả gas.

## Phân công

| Ai | Việc |
|---|---|
| **Kiệt (owner)** | Đã deploy contract (Phần A). Chỉ owner gọi được `setAdmin` khi cần thêm Admin mới |
| **Mỗi thành viên** (Tuyền, Trâm, Kiệt) | Lấy code mới, dùng **ví Admin cá nhân** của mình làm ví minter, điền `.env` trên máy mình (Phần B) |

- **Không tạo ví minter riêng.** Ví cá nhân của Tuyền, Trâm, Kiệt đã có quyền Admin trong constructor nên backend trên
  máy ai thì dùng chính ví người đó để mint hộ và trả gas → **không cần chạy `setAdmin`**.
- Private key ví của ai thì **chỉ người đó giữ**, chỉ dán vào `backend/.env` trên máy mình. **Không gửi private key cho
  nhau**, không commit.

## Phần A – Kiệt (owner) – ĐÃ LÀM

Ghi lại để deploy lại khi cần (VD sửa contract):

1. `cd poap-system-main/blockchain && cp .env.example .env`, điền `SEPOLIA_RPC_URL` và
   `ADMIN_PRIVATE_KEY=0x<private key ví Kiệt>` (MetaMask xuất ra không có `0x` thì tự thêm).
2. `npx hardhat test` rồi `npx hardhat run scripts/deploy.js --network sepolia`.
   Script in địa chỉ contract, block deploy, owner (phải là ví Kiệt) và `isAdmin` của Tuyền/Trâm/Kiệt (phải đều `true`).
3. Gửi địa chỉ contract mới cho nhóm, cập nhật `.env.example` và tài liệu này.

**Thêm Admin ngoài 3 ví trên (chỉ khi cần):** điền `CONTRACT_ADDRESS` và `MINTER_ADDRESS=0x…,0x…` (địa chỉ, không phải
private key) vào `blockchain/.env`, rồi Kiệt chạy `npx hardhat run scripts/setAdmin.js --network sepolia`.
Gỡ quyền: thêm `REVOKE=true` trước lệnh.

## Phần B – Mỗi thành viên làm trên máy mình

### B0. Lấy code mới

```bash
git fetch origin
git checkout kiet        # hoặc: git switch kiet
git pull origin kiet
cd poap-system-main/backend && npm install
cd ../frontend && npm install
```

### B1. Chuẩn bị ví cá nhân làm ví minter

- Dùng **ví Admin cá nhân** của mình (Tuyền / Trâm / Kiệt – đúng ví có trong `ADMIN_WALLETS`).
- ⚠️ **Chỉ dùng ví testnet không chứa tài sản thật** (không có ETH mainnet, token, NFT có giá trị), vì private key sẽ
  nằm dạng chữ thường trong `backend/.env` trên máy. Nếu ví cá nhân đang giữ tài sản thật thì **không** dùng nó:
  tạo ví mới rồi nhờ Kiệt cấp quyền bằng `setAdmin` (Phần A).
- Ví cần ETH Sepolia để trả gas: xin từ faucet (Google Cloud Web3 faucet, Alchemy, Infura…). Mỗi lần mint tốn khoảng
  0.0002–0.001 ETH; nên có **≥ 0.05 ETH** trước buổi demo. Backend cảnh báo khi số dư < 0.01 ETH.
- Lấy private key: MetaMask → *⋮ → Account details → Show private key*.

### B2. Điền `.env`

`backend/.env` (thêm vào file đang có, giữ nguyên MongoDB/Pinata):

```
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com     # hoặc RPC Alchemy/Infura riêng
MINTER_PRIVATE_KEY=0x<private key ví cá nhân của mình>
CONTRACT_ADDRESS=0x5D25Ebe07d284e27E63319F760543F2EBF859643
CONTRACT_DEPLOY_BLOCK=12158927
```

`frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5D25Ebe07d284e27E63319F760543F2EBF859643
```

Mẫu đầy đủ trong `backend/.env.example`, `frontend/.env.example`.

`frontend/src/lib/contractABI.json` đã được cập nhật theo contract mới (có `mintBadge`, không còn `claimBadge`).
Nếu sửa contract thêm, chạy `npx hardhat compile` rồi chép lại mảng `abi` trong
`blockchain/artifacts/contracts/ClubPOAP.sol/ClubPOAP.json`.

### B3. Khởi động lại backend & frontend, kiểm tra log

Backend in ra dạng:

```
🪙  Ví minter: 0x<ví của mình> | contract: 0x5D25…9643
    Số dư: 0.05 ETH | quyền Admin: CÓ
```

- "quyền Admin: CHƯA" → `MINTER_PRIVATE_KEY` không phải ví Tuyền/Trâm/Kiệt; dùng đúng ví hoặc nhờ Kiệt chạy `setAdmin`.
- "Thiếu MINTER_PRIVATE_KEY / CONTRACT_ADDRESS trong backend/.env" → làm lại bước B2.

## Dọn dữ liệu cũ trước khi demo

Huy hiệu cũ được mint trên **contract cũ**. Sau khi đổi `NEXT_PUBLIC_CONTRACT_ADDRESS`, trang Bộ sưu tập
(`useOnchainVerify`) sẽ báo các huy hiệu cũ là "không mint huy hiệu nào cho ví đang xem". Trước khi demo:

- Xoá dữ liệu collection `attendances` cũ trong MongoDB (và đặt lại `currentAttendees` của sự kiện), **hoặc**
- Tạo sự kiện mới hoàn toàn trên contract mới.

Các sự kiện cũ muốn dùng tiếp thì bấm **"Đăng ký lại on-chain"** trên trang Admin (ví Admin ký, tự trả gas).

> **Ghi chú cho bạn phụ trách Bộ sưu tập (làm sau nếu cần):** để huy hiệu của contract cũ vẫn xác minh được,
> sửa `useOnchainVerify` nhận thêm tham số `contractAddress` của từng huy hiệu (backend `/api/collection` đã trả
> field `contractAddress` lấy từ `Event.contractAddress`) và dùng nó thay cho hằng `NEXT_PUBLIC_CONTRACT_ADDRESS`
> khi lọc log `Transfer` và gọi `ownerOf` / `locked`.

## Mã lỗi backend trả về khi mint

| HTTP | `code` | Ý nghĩa / cách xử lý |
|---|---|---|
| 409 | `EVENT_NOT_ONCHAIN` | Sự kiện chưa `createEvent` trên contract → Admin bấm "Đăng ký lại on-chain" |
| 409 | `ALREADY_CLAIMED_ONCHAIN` | Ví đã có huy hiệu on-chain nhưng không tìm lại được giao dịch để đồng bộ |
| 409 | `CHECKIN_IN_PROGRESS` | Đang xử lý một yêu cầu khác của cùng ví/MSSV |
| 400 | `EVENT_FULL` | Hết chỗ on-chain |
| 503 | `MINTER_NO_FUNDS` | Ví minter (ví cá nhân trên máy chạy backend) hết ETH Sepolia → xin thêm faucet |
| 503 | `MINTER_NOT_ADMIN` | `MINTER_PRIVATE_KEY` không phải ví Admin (dùng ví Tuyền/Trâm/Kiệt hoặc nhờ Kiệt `setAdmin`) |
| 503 | `MINTER_NOT_CONFIGURED` | Thiếu / sai `MINTER_PRIVATE_KEY` hoặc `CONTRACT_ADDRESS` |
| 502 | `MINT_REVERTED` | Giao dịch bị revert (kèm lý do) |
| 502 | `RPC_ERROR` | Không kết nối được RPC Sepolia |
| 500 | `DB_SAVE_FAILED` | Đã mint nhưng lưu DB lỗi (kèm `txHash`) → sinh viên bấm lại để đồng bộ |
| 202 | `MINT_PENDING` | Đã gửi tx nhưng xác nhận chậm (> `MINT_WAIT_TIMEOUT_MS`); backend tự lưu khi xong |

Ngoài ra vẫn giữ các mã kiểm tra cũ: `INVALID_CODE`, `CODE_EXPIRED`, `EVENT_CLOSED`, `SIGNATURE_INVALID`,
`CHALLENGE_EXPIRED`, `ALREADY_CLAIMED`, `WALLET_BOUND`, `STUDENT_BOUND`, `NAME_MISMATCH`, `CLASS_MISMATCH`…

## Chống lệch dữ liệu Chain ↔ DB

- Trước khi mint, backend đọc `claimed(eventId, ví)` on-chain. Nếu chain đã có mà DB chưa có (lần trước bị gián đoạn),
  backend tìm lại giao dịch qua log `BadgeClaimed` và **ghi bù** vào DB thay vì mint lại.
- Lưu `Attendance` có thử lại 3 lần; index unique (eventId, walletAddress) chống ghi trùng.
- Các giao dịch mint được gửi tuần tự qua một hàng đợi + `NonceManager` nên nhiều sinh viên cùng lúc không bị trùng nonce.
- Private key ví minter nằm trong `backend/.env` (ví nóng): chỉ dùng ví testnet không có tài sản thật, chỉ để ít ETH
  Sepolia đủ dùng. Nếu lộ key thì báo Kiệt (owner) gỡ quyền ví đó
  (`REVOKE=true npx hardhat run scripts/setAdmin.js --network sepolia`) và chuyển sang ví khác.
