// frontend/src/lib/collectionApi.ts
// Người 3 - Gọi API Bộ sưu tập huy hiệu cá nhân

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Badge {
  eventId: string;
  eventName: string;
  organizer: string;
  eventTime: string | null;
  status: string | null;

  imageUrl: string | null;
  tokenURI: string | null;
  metadataUrl: string | null;

  walletAddress: string;
  studentId: string;
  fullName: string;
  claimedAt: string | null;

  txHash: string | null;
  contractAddress: string | null;
  etherscanTxUrl: string | null;
  etherscanContractUrl: string | null;
}

export interface CollectionResponse {
  walletAddress: string;
  total: number;
  badges: Badge[];
}

export interface VerifyResponse {
  valid: boolean;
  badge: Badge;
  note: string;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `Lỗi ${res.status} khi gọi máy chủ.`);
  }
  return data as T;
}

/** Danh sách huy hiệu của ví */
export function getCollection(
  wallet: string,
  options: { search?: string; sort?: 'newest' | 'oldest' } = {}
): Promise<CollectionResponse> {
  const params = new URLSearchParams();
  if (options.search) params.set('search', options.search);
  if (options.sort) params.set('sort', options.sort);
  const qs = params.toString();
  return request<CollectionResponse>(`/collection/${wallet}${qs ? `?${qs}` : ''}`);
}

/** Chi tiết 1 huy hiệu */
export async function getBadgeDetail(wallet: string, eventId: string): Promise<Badge> {
  const data = await request<{ badge: Badge }>(`/collection/${wallet}/${eventId}`);
  return data.badge;
}

/** Xác minh công khai (nhà trường / nhà tuyển dụng) */
export function verifyBadge(eventId: string, wallet: string): Promise<VerifyResponse> {
  return request<VerifyResponse>(`/collection/verify/${eventId}/${wallet}`);
}