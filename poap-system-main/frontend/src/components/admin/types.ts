export type EventStatus = "upcoming" | "open" | "closed";

export interface ClubEvent {
  _id: string;
  name: string;
  organizer?: string;          // Đơn vị tổ chức / CLB
  time: string;
  capacity: number;
  status: EventStatus;
  ipfsImageHash: string;
  ipfsMetadataHash?: string;
  qrSecret: string;
  refreshInterval?: number;
  createdAt?: string;
  currentAttendees?: number;
  contractAddress?: string;
}