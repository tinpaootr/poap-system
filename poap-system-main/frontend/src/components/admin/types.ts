// Trạng thái khớp với backend: 'upcoming', 'open', 'closed'
export type EventStatus = "upcoming" | "open" | "closed";

export interface ClubEvent {
  _id: string;             // MongoDB tự tạo _id
  name: string;            // Đổi title thành name cho khớp Backend
  time: string;            // Đổi datetime thành time
  capacity: number;        // Đổi maxAttendees thành capacity
  status: EventStatus;
  ipfsImageHash: string;   // Lưu link ipfs://...
  qrSecret: string;        // Khóa bí mật tạo QR động
  createdAt?: string;
  
  // Các trường sẽ dùng khi ghép Smart Contract (tạm giữ)
  currentAttendees?: number; 
  contractAddress?: string;
}
