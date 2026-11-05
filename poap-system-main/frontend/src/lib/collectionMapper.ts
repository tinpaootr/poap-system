// frontend/src/lib/collectionMapper.ts
// Chuyển dữ liệu thật từ API (Badge) sang BadgeItem mà các component giao diện đang dùng.

import type { Badge } from '@/lib/collectionApi';
import type { BadgeItem } from '@/components/collection/BadgeCard';

// Điểm rèn luyện mặc định cho mỗi huy hiệu (backend chưa lưu điểm).
export const DEFAULT_POINTS = 10;

/** "Khoa CNTT - ĐH Công Nghệ" -> "khoa-cntt-dh-cong-nghe" */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Tính học kỳ từ ngày, dạng "hk1-24-25".
 * HK1: tháng 9 - 1 | HK2: tháng 2 - 8 (gồm cả hè)
 */
export function toSemester(date: Date): string {
  const m = date.getMonth() + 1; // 1..12
  const y = date.getFullYear();
  const yy = (n: number) => String(n % 100).padStart(2, '0');

  if (m >= 9) return `hk1-${yy(y)}-${yy(y + 1)}`;
  if (m === 1) return `hk1-${yy(y - 1)}-${yy(y)}`;
  return `hk2-${yy(y - 1)}-${yy(y)}`;
}

function formatVN(date: Date): string {
  return date.toLocaleString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Khung lục giác + ảnh huy hiệu thật (IPFS). Không có ảnh thì dùng icon mặc định. */
function buildSvg(b: Badge): string {
  const frame = `<polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" fill="#171f33" />`;

  if (!b.imageUrl) {
    return (
      frame +
      `<polygon points="50 12, 83 29, 83 71, 50 88, 17 71, 17 29" fill="#222a3d" />` +
      `<circle cx="50" cy="50" r="14" fill="#4cd7f6" fill-opacity="0.3" />` +
      `<path d="M44 50 L48 54 L58 44" stroke="#4edea3" stroke-width="3" fill="none" stroke-linecap="round" />`
    );
  }

  const clipId = `clip-${b.eventId}`;
  return (
    `<defs><clipPath id="${clipId}"><polygon points="50 12, 83 29, 83 71, 50 88, 17 71, 17 29" /></clipPath></defs>` +
    frame +
    `<image href="${b.imageUrl}" x="17" y="12" width="66" height="76" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />` +
    `<polygon points="50 12, 83 29, 83 71, 50 88, 17 71, 17 29" fill="none" stroke="#c0c1ff" stroke-width="2" />`
  );
}

export function toBadgeItem(b: Badge, index: number): BadgeItem {
  const rawDate = b.eventTime || b.claimedAt;
  const date = rawDate ? new Date(rawDate) : new Date();
  const claimed = b.claimedAt ? new Date(b.claimedAt) : date;

  const base = {
    id: index + 1,
    title: b.eventName,
    organizer: b.organizer || 'Ban Tổ Chức',
    organizerKey: slugify(b.organizer || 'ban-to-chuc'),
    semester: toSemester(date),
    date: date.toISOString().slice(0, 10),
    points: DEFAULT_POINTS,
    tokenId: '—', // sẽ có sau khi contract deploy và đọc được tokenId on-chain
    issuer: b.organizer || 'Ban Tổ Chức',
    timestamp: `Mạng Sepolia - ${formatVN(claimed)} GMT+7`,
    txHash: b.txHash || '',
    svgInner: buildSvg(b),
  };

  // etherscanUrl / contractAddress là trường bổ sung (xem hướng dẫn thêm vào BadgeItem)
  return {
    ...base,
    etherscanUrl: b.etherscanTxUrl,
    contractAddress: b.contractAddress,
  } as BadgeItem;
}