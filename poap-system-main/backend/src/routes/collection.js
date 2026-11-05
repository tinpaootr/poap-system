// backend/src/routes/collection.js
// Người 3 - Bộ sưu tập huy hiệu cá nhân (/collection)
//
// Endpoints (mount tại /api/collection):
//   GET /api/collection/:wallet                    -> Danh sách huy hiệu của ví
//   GET /api/collection/:wallet/:eventId           -> Chi tiết 1 huy hiệu
//   GET /api/collection/verify/:eventId/:wallet    -> Xác minh công khai (Nhà trường / Nhà tuyển dụng)
//
// [SỬA] Dữ liệu điểm danh được route /api/events/record-success lưu vào collection
//       Attendance (models/Attendance.js), KHÔNG lưu vào mảng Event.attendees.
//       => Bộ sưu tập phải đọc từ Attendance rồi ghép với Event.

const express = require('express');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');

const router = express.Router();

// ====== CẤU HÌNH (đặt trong backend/.env) ======
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || ''; // điền sau khi deploy
const ETHERSCAN_BASE = process.env.ETHERSCAN_BASE || 'https://sepolia.etherscan.io';
const IPFS_GATEWAY = (process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs').replace(/\/$/, '');

// ====== HÀM TIỆN ÍCH ======
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const isValidWallet = (w) => typeof w === 'string' && WALLET_REGEX.test(w);

// events.js lưu hash dạng "ipfs://Qm..." -> bỏ tiền tố để ghép với gateway
const stripIpfs = (hash) => (hash ? String(hash).replace(/^ipfs:\/\//, '') : '');

const ipfsUrl = (hash) => (hash ? `${IPFS_GATEWAY}/${stripIpfs(hash)}` : null);

const ipfsUri = (hash) => (hash ? `ipfs://${stripIpfs(hash)}` : null);

const etherscanTx = (txHash) => (txHash ? `${ETHERSCAN_BASE}/tx/${txHash}` : null);

const etherscanContract = () =>
  CONTRACT_ADDRESS ? `${ETHERSCAN_BASE}/address/${CONTRACT_ADDRESS}` : null;

// Thời điểm nhận: ưu tiên claimedAt / createdAt, nếu schema không có timestamps thì lấy từ _id
const getClaimedAt = (att) => {
  if (att.claimedAt) return att.claimedAt;
  if (att.createdAt) return att.createdAt;
  try {
    return att._id && typeof att._id.getTimestamp === 'function' ? att._id.getTimestamp() : null;
  } catch {
    return null;
  }
};

/**
 * Chuyển (event + bản ghi điểm danh) thành object huy hiệu gửi cho Frontend.
 * Dùng fallback tên trường để tránh lỗi nếu schema Event.js đặt tên hơi khác.
 */
function toBadge(ev, att) {
  return {
    eventId: String(ev._id),
    eventName: ev.name || ev.title || ev.eventName || '',
    organizer: ev.organizer || ev.organization || '',
    eventTime: ev.time || ev.startTime || ev.startDate || ev.date || null,
    status: ev.status || null,

    // Hình ảnh & metadata (IPFS)
    imageUrl: ipfsUrl(ev.ipfsImageHash),
    tokenURI: ev.tokenURI || ipfsUri(ev.ipfsMetadataHash),
    metadataUrl: ipfsUrl(ev.ipfsMetadataHash),

    // Thông tin người nhận
    walletAddress: att.walletAddress,
    studentId: att.studentId,
    fullName: att.fullName,
    claimedAt: getClaimedAt(att),

    // Blockchain
    txHash: att.txHash || null,
    contractAddress: ev.contractAddress || CONTRACT_ADDRESS || null,
    etherscanTxUrl: etherscanTx(att.txHash),
    etherscanContractUrl: etherscanContract(),
  };
}

/**
 * Tìm các lượt điểm danh của ví trong collection Attendance, ghép với Event.
 * record-success luôn lưu ví dạng chữ thường -> so khớp bằng toLowerCase().
 * Trả về mảng { ev, att }.
 */
async function findAttendanceByWallet(wallet, eventId = null) {
  const query = { walletAddress: wallet.toLowerCase() };
  if (eventId) query.eventId = eventId;

  const attendances = await Attendance.find(query).lean();
  if (attendances.length === 0) return [];

  // Lấy thông tin các sự kiện liên quan (không bao giờ trả qrSecret ra ngoài)
  const eventIds = [...new Set(attendances.map((a) => String(a.eventId)))];
  const events = await Event.find({ _id: { $in: eventIds } }).select('-qrSecret').lean();
  const eventMap = new Map(events.map((ev) => [String(ev._id), ev]));

  const results = [];
  for (const att of attendances) {
    const ev = eventMap.get(String(att.eventId));
    if (ev) results.push({ ev, att }); // bỏ qua bản ghi mà sự kiện đã bị xóa
  }
  return results;
}

// ====== 1. XÁC MINH CÔNG KHAI ======
// GET /api/collection/verify/:eventId/:wallet
// Dành cho Nhà trường / Nhà tuyển dụng đối chiếu nhanh.
// (Khai báo TRƯỚC các route /:wallet để không bị nuốt)
router.get('/verify/:eventId/:wallet', async (req, res) => {
  try {
    const { eventId, wallet } = req.params;

    if (!isValidWallet(wallet)) {
      return res.status(400).json({ code: 'INVALID_WALLET', error: 'Địa chỉ ví không hợp lệ.' });
    }
    if (!OBJECT_ID_REGEX.test(eventId)) {
      return res.status(400).json({ code: 'INVALID_EVENT_ID', error: 'Mã sự kiện không hợp lệ.' });
    }

    const found = await findAttendanceByWallet(wallet, eventId);
    if (found.length === 0) {
      return res.status(404).json({
        valid: false,
        code: 'BADGE_NOT_FOUND',
        error: 'Không tìm thấy huy hiệu của ví này tại sự kiện.',
      });
    }

    const { ev, att } = found[0];
    const hasTx = Boolean(att.txHash);

    return res.json({
      valid: hasTx, // chỉ hợp lệ khi đã có giao dịch mint thành công
      badge: toBadge(ev, att),
      note: hasTx
        ? 'Đối chiếu txHash trên Sepolia Etherscan để xác nhận dữ liệu gốc trên Blockchain.'
        : 'Chưa có mã giao dịch (txHash) cho huy hiệu này.',
    });
  } catch (err) {
    console.error('[collection] verify error:', err);
    return res.status(500).json({ code: 'SERVER_ERROR', error: 'Lỗi máy chủ khi xác minh huy hiệu.' });
  }
});

// ====== 2. DANH SÁCH HUY HIỆU CỦA VÍ ======
// GET /api/collection/:wallet?sort=newest|oldest&search=...
router.get('/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const { sort = 'newest', search = '' } = req.query;

    if (!isValidWallet(wallet)) {
      return res.status(400).json({ code: 'INVALID_WALLET', error: 'Địa chỉ ví không hợp lệ.' });
    }

    const found = await findAttendanceByWallet(wallet);

    // Chỉ hiển thị huy hiệu đã mint thành công (có txHash)
    let badges = found.filter(({ att }) => att.txHash).map(({ ev, att }) => toBadge(ev, att));

    // Tìm kiếm theo tên sự kiện / đơn vị tổ chức
    const keyword = String(search).trim().toLowerCase();
    if (keyword) {
      badges = badges.filter(
        (b) =>
          b.eventName.toLowerCase().includes(keyword) ||
          b.organizer.toLowerCase().includes(keyword)
      );
    }

    // Sắp xếp theo thời điểm nhận
    badges.sort((a, b) => {
      const ta = a.claimedAt ? new Date(a.claimedAt).getTime() : 0;
      const tb = b.claimedAt ? new Date(b.claimedAt).getTime() : 0;
      return sort === 'oldest' ? ta - tb : tb - ta;
    });

    return res.json({
      walletAddress: wallet,
      total: badges.length,
      badges,
    });
  } catch (err) {
    console.error('[collection] list error:', err);
    return res.status(500).json({ code: 'SERVER_ERROR', error: 'Lỗi máy chủ khi tải bộ sưu tập.' });
  }
});

// ====== 3. CHI TIẾT 1 HUY HIỆU ======
// GET /api/collection/:wallet/:eventId
router.get('/:wallet/:eventId', async (req, res) => {
  try {
    const { wallet, eventId } = req.params;

    if (!isValidWallet(wallet)) {
      return res.status(400).json({ code: 'INVALID_WALLET', error: 'Địa chỉ ví không hợp lệ.' });
    }
    if (!OBJECT_ID_REGEX.test(eventId)) {
      return res.status(400).json({ code: 'INVALID_EVENT_ID', error: 'Mã sự kiện không hợp lệ.' });
    }

    const found = await findAttendanceByWallet(wallet, eventId);
    if (found.length === 0) {
      return res.status(404).json({
        code: 'BADGE_NOT_FOUND',
        error: 'Ví này chưa có huy hiệu của sự kiện.',
      });
    }

    const { ev, att } = found[0];
    return res.json({ badge: toBadge(ev, att) });
  } catch (err) {
    console.error('[collection] detail error:', err);
    return res.status(500).json({ code: 'SERVER_ERROR', error: 'Lỗi máy chủ khi tải chi tiết huy hiệu.' });
  }
});

module.exports = router;