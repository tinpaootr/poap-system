// Trạng thái khớp với backend: 'upcoming', 'open', 'closed'
export type EventStatus = "upcoming" | "open" | "closed";

export interface ClubEvent {
  _id: string;                 // MongoDB tự tạo _id
  name: string;                // Tên sự kiện
  time: string;                // Thời gian diễn ra
  capacity: number;            // Số lượng sinh viên tối đa
  status: EventStatus;
  ipfsImageHash: string;       // Link ảnh gốc ipfs://...
  ipfsMetadataHash?: string;   // Link JSON Metadata chuẩn ERC-721 (tokenURI)
  qrSecret: string;            // Khóa bí mật tạo QR động
  refreshInterval?: number;    // Chu kỳ làm mới mã QR (giây)
  createdAt?: string;

  // Các trường đồng bộ với Smart Contract & Backend
  currentAttendees?: number;
  contractAddress?: string;
}