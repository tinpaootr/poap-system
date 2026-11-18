// backend/src/lib/minter.js
// Ví minter của backend: gọi ClubPOAP.mintBadge() để đúc huy hiệu HỘ sinh viên và trả phí gas.
// NFT vẫn được đúc thẳng về ví sinh viên. Ví minter phải được owner cấp quyền bằng setAdmin(minter, true).
//
// Biến môi trường (backend/.env):
//   SEPOLIA_RPC_URL        RPC Sepolia (Alchemy / Infura / publicnode...)
//   MINTER_PRIVATE_KEY     Private key ví minter (KHÔNG commit, KHÔNG log ra)
//   CONTRACT_ADDRESS       Địa chỉ contract ClubPOAP đã deploy
//   CONTRACT_DEPLOY_BLOCK  (tuỳ chọn) block deploy contract, giúp tìm lại txHash nhanh hơn khi đối soát
//   MINT_WAIT_TIMEOUT_MS   (tuỳ chọn) thời gian tối đa chờ giao dịch được xác nhận, mặc định 90000

const { ethers } = require('ethers');

const DEFAULT_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const SEPOLIA_CHAIN_ID = 11155111n;

const CLUB_POAP_ABI = [
  'function mintBadge(address student, string eventId, string tokenURI) returns (uint256)',
  'function events(string eventId) view returns (uint256 capacity, uint256 currentAttendees, bool exists)',
  'function claimed(string eventId, address student) view returns (bool)',
  'function isAdmin(address account) view returns (bool)',
  'function owner() view returns (address)',
  'event BadgeClaimed(string eventId, address indexed student, uint256 indexed tokenId, string tokenURI)'
];

/** Lỗi có mã rõ ràng để route trả về frontend. */
class MintError extends Error {
  constructor(code, message, status = 500, extra = {}) {
    super(message);
    this.name = 'MintError';
    this.code = code;
    this.status = status;
    this.extra = extra;
  }
}

let ctx = null; // { provider, signer, contract, minterAddress, contractAddress }

function getContext() {
  if (ctx) return ctx;

  const rpcUrl = process.env.SEPOLIA_RPC_URL || DEFAULT_RPC;
  const privateKey = String(process.env.MINTER_PRIVATE_KEY || '').trim();
  const contractAddress = String(process.env.CONTRACT_ADDRESS || '').trim();

  if (!privateKey || !contractAddress) {
    throw new MintError(
      'MINTER_NOT_CONFIGURED',
      'Hệ thống đúc huy hiệu chưa được cấu hình (thiếu MINTER_PRIVATE_KEY hoặc CONTRACT_ADDRESS). Vui lòng liên hệ ban tổ chức.',
      503
    );
  }
  if (!ethers.isAddress(contractAddress)) {
    throw new MintError('MINTER_NOT_CONFIGURED', 'CONTRACT_ADDRESS trong .env không hợp lệ.', 503);
  }

  let wallet;
  try {
    wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
  } catch {
    // Không đưa nội dung key vào thông báo lỗi
    throw new MintError('MINTER_NOT_CONFIGURED', 'MINTER_PRIVATE_KEY trong .env không hợp lệ.', 503);
  }

  // cacheTimeout: -1 -> không cache kết quả RPC (tránh đọc nonce cũ sau khi NonceManager.reset())
  const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true, cacheTimeout: -1 });
  // NonceManager tự tăng nonce cục bộ -> nhiều sinh viên mint liên tiếp không bị trùng nonce
  const signer = new ethers.NonceManager(wallet.connect(provider));
  const contract = new ethers.Contract(contractAddress, CLUB_POAP_ABI, signer);

  ctx = { provider, signer, contract, minterAddress: wallet.address, contractAddress };
  return ctx;
}

const isNetworkError = (err) =>
  ['NETWORK_ERROR', 'SERVER_ERROR', 'TIMEOUT', 'UNKNOWN_ERROR'].includes(err?.code) ||
  /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|fetch failed|socket hang up/i.test(String(err?.message || ''));

/** Dịch lỗi ethers / revert của contract sang MintError dễ hiểu. */
function translateError(err) {
  if (err instanceof MintError) return err;

  const reason = String(err?.reason || err?.shortMessage || err?.message || '');
  // Gom mọi thông báo lỗi (RPC mỗi nơi đặt thông báo một chỗ khác nhau)
  const allText = [reason, err?.info?.error?.message, err?.error?.message].filter(Boolean).join(' | ');

  if (err?.code === 'INSUFFICIENT_FUNDS' || /insufficient funds|enough funds/i.test(allText)) {
    return new MintError(
      'MINTER_NO_FUNDS',
      'Ví đúc huy hiệu của ban tổ chức đã hết ETH Sepolia để trả phí gas. Vui lòng báo ban tổ chức nạp thêm.',
      503
    );
  }
  if (/Su kien chua dang ky on-chain/.test(allText)) {
    return new MintError(
      'EVENT_NOT_ONCHAIN',
      'Sự kiện chưa được đăng ký trên blockchain. Vui lòng liên hệ ban tổ chức.',
      409
    );
  }
  if (/da nhan huy hieu/.test(allText)) {
    return new MintError('ALREADY_CLAIMED_ONCHAIN', 'Ví này đã nhận huy hiệu của sự kiện này trên blockchain rồi.', 409);
  }
  if (/du so luong tham du/.test(allText)) {
    return new MintError('EVENT_FULL', 'Sự kiện đã đủ số lượng người tham dự.', 400);
  }
  if (/Khong phai vi Admin/.test(allText)) {
    return new MintError(
      'MINTER_NOT_ADMIN',
      'Ví đúc huy hiệu chưa được cấp quyền Admin trên contract. Vui lòng báo ban tổ chức.',
      503
    );
  }
  if (err?.code === 'CALL_EXCEPTION') {
    return new MintError('MINT_REVERTED', `Giao dịch đúc huy hiệu bị từ chối trên blockchain${reason ? `: ${reason}` : '.'}`, 502);
  }
  if (isNetworkError(err)) {
    return new MintError('RPC_ERROR', 'Không kết nối được mạng Sepolia, vui lòng thử lại sau ít phút.', 502);
  }
  return new MintError('MINT_FAILED', 'Đúc huy hiệu thất bại, vui lòng thử lại.', 500);
}

/** Đọc trạng thái on-chain trước khi mint. */
async function getOnchainStatus(eventId, student) {
  const { contract } = getContext();
  try {
    const [info, alreadyClaimed] = await Promise.all([
      contract.events(eventId),
      student ? contract.claimed(eventId, student) : Promise.resolve(false)
    ]);
    return {
      exists: info.exists,
      capacity: Number(info.capacity),
      currentAttendees: Number(info.currentAttendees),
      claimed: alreadyClaimed
    };
  } catch (err) {
    throw translateError(err);
  }
}

// Hàng đợi gửi giao dịch: các lần mint được GỬI lần lượt (để nonce không đụng nhau),
// còn phần chờ xác nhận (tx.wait) chạy song song ngoài hàng đợi.
let sendQueue = Promise.resolve();
const enqueue = (fn) => {
  const run = sendQueue.then(fn, fn);
  sendQueue = run.catch(() => {});
  return run;
};

/** Gửi giao dịch mintBadge, trả về đối tượng tx (chưa chờ xác nhận). */
function sendMint(student, eventId, tokenURI) {
  const { contract, signer } = getContext();
  return enqueue(async () => {
    try {
      // estimateGas bên trong sẽ phát hiện revert trước khi tốn gas
      return await contract.mintBadge(student, eventId, tokenURI);
    } catch (err) {
      signer.reset(); // tránh nonce cục bộ bị lệch khi gửi lỗi
      throw translateError(err);
    }
  });
}

/** Lấy tokenId từ log BadgeClaimed trong receipt. */
function tokenIdFromReceipt(receipt) {
  const { contract, contractAddress } = getContext();
  for (const log of receipt?.logs || []) {
    if (String(log.address).toLowerCase() !== contractAddress.toLowerCase()) continue;
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === 'BadgeClaimed') return parsed.args.tokenId.toString();
    } catch {
      /* log khác */
    }
  }
  return null;
}

/**
 * Đối soát: ví đã có huy hiệu on-chain nhưng DB chưa ghi (server sập / timeout giữa chừng).
 * Tìm lại giao dịch qua log BadgeClaimed(student indexed). Trả về { txHash, tokenId } hoặc null.
 */
async function findClaimTx(eventId, student) {
  const { contract, provider } = getContext();
  const latest = await provider.getBlockNumber();
  const deployBlock = Number(process.env.CONTRACT_DEPLOY_BLOCK) || Math.max(0, latest - 500_000);
  const CHUNK = 40_000; // RPC công cộng thường giới hạn khoảng block của eth_getLogs

  const filter = contract.filters.BadgeClaimed(null, student);
  for (let to = latest; to >= deployBlock; to -= CHUNK) {
    const from = Math.max(deployBlock, to - CHUNK + 1);
    const logs = await contract.queryFilter(filter, from, to);
    const match = logs.reverse().find((l) => l.args?.eventId === eventId);
    if (match) return { txHash: match.transactionHash, tokenId: match.args.tokenId.toString() };
  }
  return null;
}

const waitTimeoutMs = () => Number(process.env.MINT_WAIT_TIMEOUT_MS) || 90_000;

/** Ghi log cấu hình ví minter khi server khởi động (không log private key). */
async function logMinterStatus() {
  // Log dành cho người chạy server: chỉ rõ biến nào còn thiếu trong backend/.env
  const missing = ['MINTER_PRIVATE_KEY', 'CONTRACT_ADDRESS'].filter((k) => !String(process.env[k] || '').trim());
  if (missing.length) {
    console.warn(`⚠️  Thiếu ${missing.join(' / ')} trong backend/.env -> chưa mint hộ được (xem HUONG_DAN_MINT_HO.md).`);
    return;
  }
  if (!process.env.SEPOLIA_RPC_URL) {
    console.warn(`⚠️  Chưa đặt SEPOLIA_RPC_URL trong backend/.env -> đang dùng RPC công cộng ${DEFAULT_RPC}.`);
  }
  try {
    const { provider, contract, minterAddress, contractAddress } = getContext();
    const [network, balance, admin] = await Promise.all([
      provider.getNetwork(),
      provider.getBalance(minterAddress),
      contract.isAdmin(minterAddress)
    ]);
    console.log(`🪙  Ví minter: ${minterAddress} | contract: ${contractAddress}`);
    console.log(`    Số dư: ${ethers.formatEther(balance)} ETH | quyền Admin: ${admin ? 'CÓ' : 'CHƯA'}`);
    if (network.chainId !== SEPOLIA_CHAIN_ID) console.warn(`⚠️  RPC không phải Sepolia (chainId ${network.chainId})`);
    if (!admin) console.warn('⚠️  Ví minter chưa có quyền Admin -> chạy scripts/setAdmin.js trong thư mục blockchain.');
    if (balance < ethers.parseEther('0.01')) console.warn('⚠️  Ví minter sắp hết ETH Sepolia, hãy xin thêm từ faucet.');
  } catch (err) {
    console.warn(`⚠️  Chưa kiểm tra được ví minter: ${translateError(err).message}`);
  }
}

module.exports = {
  MintError,
  translateError,
  getOnchainStatus,
  sendMint,
  tokenIdFromReceipt,
  findClaimTx,
  waitTimeoutMs,
  logMinterStatus
};
