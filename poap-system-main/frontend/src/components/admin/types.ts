export type EventStatus = "live" | "upcoming" | "ended";

export interface ClubEvent {
  id: string;
  title: string;
  datetime: string;
  maxAttendees: number;
  currentAttendees: number;
  description: string;
  badgeImage: string;
  status: EventStatus;
  contractAddress: string;
}

export const INITIAL_EVENTS: ClubEvent[] = [
  {
    id: "EVT-01",
    title: "Workshop Web3 & Đổi Mới Sáng Tạo Học Đường",
    datetime: "14:00 - 17:00, 28/10/2026",
    maxAttendees: 150,
    currentAttendees: 118,
    description:
      "Sinh viên tham dự trọn vẹn và quét mã QR tại hội trường sẽ được cấp phát 01 Soulbound Badge chứng thực tham gia trên Sepolia Testnet.",
    badgeImage:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&auto=format&fit=crop&q=80",
    status: "live",
    contractAddress: "0x91F8...3A2B",
  },
  {
    id: "EVT-02",
    title: "Cuộc thi Hackathon AI & Smart Campus 2026",
    datetime: "08:00 - 18:00, 05/11/2026",
    maxAttendees: 200,
    currentAttendees: 45,
    description:
      "Chứng nhận tham gia cuộc thi lập trình AI & Blockchain cấp trường.",
    badgeImage:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    status: "upcoming",
    contractAddress: "0x72A1...9C4D",
  },
  {
    id: "EVT-03",
    title: "Tập huấn Kỹ năng Nghiên cứu Khoa học Sinh viên",
    datetime: "09:00 - 11:30, 20/10/2026",
    maxAttendees: 150,
    currentAttendees: 150,
    description:
      "Hội thảo hướng dẫn viết bài báo khoa học và công bố quốc tế.",
    badgeImage:
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&auto=format&fit=crop&q=80",
    status: "ended",
    contractAddress: "0x38B4...1F0E",
  },
];