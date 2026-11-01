// backend/src/routes/collection.js
// Người 3 - Bộ sưu tập huy hiệu cá nhân (/collection)
//
// Endpoints (mount tại /api/collection):
//   GET /api/collection/:wallet                    -> Danh sách huy hiệu của ví
//   GET /api/collection/:wallet/:eventId           -> Chi tiết 1 huy hiệu
//   GET /api/collection/verify/:eventId/:wallet    -> Xác minh công khai (Nhà trường / Nhà tuyển dụng)

const express = require('express');
const Event = require('../models/Event');

const router = express.Router();

// ====== CẤU HÌNH (đặt trong backend/.env) ======
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || ''; // điền sau khi deploy
const ETHERSCAN_BASE = process.env.ETHERSCAN_BASE || 'https://sepolia.etherscan.io';
const IPFS_GATEWAY = (process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs').replace(/\/$/, '');

// ====== HÀM TIỆN ÍCH ======
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const isValidWallet = (w) => typeof w === 'string' && WALLET_REGEX.test(w);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ipfsUrl = (hash) => (hash ? `${IPFS_GATEWAY}/${hash}` : null);

const etherscanTx = (txHash) => (txHash ? `${ETHERSCAN_BASE}/tx/${txHash}` : null);

const etherscanContract = () =>
  CONTRACT_ADDRESS ? `${ETHERSCAN_BASE}/address/${CONTRACT_ADDRESS}` : null;

/**
 * Chuyển (event + bản ghi điểm danh) thành object huy hiệu gửi cho Frontend.
 * Dùng fallback tên trường để tránh lỗi nếu schema Event.js đặt tên hơi khác.
 */
function toBadge(ev, att) {
  return {
    eventId: String(ev._id),
    eventName: ev.name || ev.title || ev.eventName || '',
    organizer: ev.organizer || ev.organization || '',
    eventTime: ev.startTime || ev.startDate || ev.time || ev.date || null,
    status: ev.status || null,

    // Hình ảnh & metadata (IPFS)
    imageUrl: ipfsUrl(ev.ipfsImageHash),
    tokenURI: ev.tokenURI || (ev.ipfsMetadataHash ? `ipfs://${ev.ipfsMetadataHash}` : null),
    metadataUrl: ipfsUrl(ev.ipfsMetadataHash),

    // Thông tin người nhận
    walletAddress: att.walletAddress,
    studentId: att.studentId,
    fullName: att.fullName,
    claimedAt: att.claimedAt || att.createdAt || null,

    // Blockchain
    txHash: att.txHash || null,
    contractAddress: CONTRACT_ADDRESS || null,
    etherscanTxUrl: etherscanTx(att.txHash),
    etherscanContractUrl: etherscanContract(),
  };
}

/**
 * Tìm các sự kiện mà ví đã điểm danh (không phân biệt hoa/thường địa chỉ ví).
 * Trả về mảng { ev, att }.
 */
async function findAttendanceByWallet(wallet, eventId = null) {
  const query = {
    'attendees.walletAddress': new RegExp(`^${escapeRegex(wallet)}$`, 'i'),
  };
  if (eventId) query._id = eventId;

  // Không bao giờ trả qrSecret ra ngoài
  const events = await Event.find(query).select('-qrSecret').lean();

  const results = [];
  for (const ev of events) {
    for (const att of ev.attendees || []) {
      if (att.walletAddress && att.walletAddress.toLowerCase() === wallet.toLowerCase()) {
        results.push({ ev, att });
      }
    }
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
    if (!/^[a-fA-F0-9]{24}$/.test(eventId)) {
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
    if (!/^[a-fA-F0-9]{24}$/.test(eventId)) {
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