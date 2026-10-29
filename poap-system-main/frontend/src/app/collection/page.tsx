'use client';

import React, { useState, useMemo, useEffect } from 'react';
import StudentProfileHeader from '@/components/collection/StudentProfileHeader';
import FilterToolbar from '@/components/collection/FilterToolbar';
import BadgeCard, { BadgeItem } from '@/components/collection/BadgeCard';
import CredentialModal from '@/components/collection/CredentialModal';

const MOCK_STATS = {
  fullName: 'Nguyễn Thu Trang',
  cohort: 'Khoá 2021 - 2025',
  studentId: '21120456',
  major: 'Khoa Học Máy Tính',
  rank: 'Hạng Vàng',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD-i7Y8oMoGESPTlqKL8VkUHhlVtmI-gKqUpiE-f0L7zuNB8G_M5N6UT2oi8fgea_Z4s-d7BZdc4OjXL9ReyNj9wYex6hwRoY7_3w7FeN5i5wwu0EdbLRTZcB0FC928IrPNTdfhDpQ6qyAz9LRhMydNSRKcqWNBAo0gVGXzdQ-SrpMgUqX2YMI_xwgcqlbPRDvs0RiMhok8fqHP4F0P7qCyaP5L1NyzqxMz5JHJxyhZc6kHEkul2WD0_Q',
  totalEvents: 14,
  semesterGain: 3,
  totalSoulbound: 14,
  activityPoints: 85,
  maxPoints: 100,
};

const ALL_6_BADGES: BadgeItem[] = [
  {
    id: 1,
    title: 'Workshop Web3 & AI Ethics',
    organizer: 'Khoa CNTT - ĐH Công Nghệ',
    organizerKey: 'khoa-cntt',
    semester: 'hk1-24-25',
    date: '2025-10-28',
    points: 10,
    tokenId: 'Token #0042',
    issuer: 'Khoa CNTT - ĐH Công Nghệ x EduBadge Protocol',
    timestamp: 'Block #6,482,910 (Mạng Sepolia - 28/10/2025 16:45:12 GMT+7)',
    txHash: '0x39a1c890...4f82',
    svgInner: `<polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" fill="#171f33" /><polygon points="50 10, 85 28, 85 72, 50 90, 15 72, 15 28" fill="#222a3d" /><polygon points="50 20, 78 35, 78 65, 50 80, 22 65, 22 35" fill="none" stroke="#c0c1ff" stroke-width="2" /><circle cx="50" cy="50" r="14" fill="#4cd7f6" fill-opacity="0.3" /><path d="M44 50 L48 54 L58 44" stroke="#4edea3" stroke-width="3" fill="none" stroke-linecap="round" />`,
  },
  {
    id: 2,
    title: 'Hackathon Đại Học Mở Rộng 2025 - Giải Nhì',
    organizer: 'CLB Tin Học & Hội Sinh Viên',
    organizerKey: 'clb-tin-hoc',
    semester: 'hk1-24-25',
    date: '2025-09-15',
    points: 20,
    tokenId: 'Token #0018',
    issuer: 'CLB Tin Học & Hội Sinh Viên ĐHQG',
    timestamp: 'Block #6,190,442 (Mạng Sepolia - 15/09/2025 11:20:04 GMT+7)',
    txHash: '0x82ab11cd...90fe',
    svgInner: `<polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" fill="#171f33" /><polygon points="50 12, 83 29, 83 71, 50 88, 17 71, 17 29" fill="#222a3d" /><path d="M50 25 L56 38 L70 40 L60 50 L63 64 L50 57 L37 64 L40 50 L30 40 L44 38 Z" fill="#4cd7f6" fill-opacity="0.3" stroke="#4cd7f6" stroke-width="2" /><circle cx="50" cy="48" r="8" fill="#acedff" />`,
  },
  {
    id: 3,
    title: 'Ngày Hội Việc Làm IT Job Fair 2025',
    organizer: 'Đoàn Thanh Niên & Trung Tâm Hỗ Trợ SV',
    organizerKey: 'doan-thanh-nien',
    semester: 'hk2-23-24',
    date: '2025-05-20',
    points: 10,
    tokenId: 'Token #0105',
    issuer: 'Đoàn Thanh Niên & Trung Tâm Hỗ Trợ SV',
    timestamp: 'Block #5,834,102 (Mạng Sepolia - 20/05/2025 15:30:19 GMT+7)',
    txHash: '0x12fa90bd...1911',
    svgInner: `<polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" fill="#171f33" /><polygon points="50 12, 83 29, 83 71, 50 88, 17 71, 17 29" fill="#222a3d" /><rect x="35" y="40" width="30" height="24" rx="4" fill="none" stroke="#4edea3" stroke-width="2.5" /><path d="M43 40 V34 C43 32 45 30 47 30 H53 C55 30 57 32 57 34 V40" stroke="#4edea3" stroke-width="2.5" fill="none" />`,
  },
  {
    id: 4,
    title: 'Tình Nguyện Mùa Hè Xanh 2025',
    organizer: 'Đoàn Trường ĐH Công Nghệ',
    organizerKey: 'doan-thanh-nien',
    semester: 'hk2-23-24',
    date: '2025-08-10',
    points: 15,
    tokenId: 'Token #0077',
    issuer: 'Đoàn Trường Đại Học Công Nghệ',
    timestamp: 'Block #6,001,894 (Mạng Sepolia - 10/08/2025 09:12:45 GMT+7)',
    txHash: '0x78df63ca...33a2',
    svgInner: `<polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" fill="#171f33" /><polygon points="50 12, 83 29, 83 71, 50 88, 17 71, 17 29" fill="#222a3d" /><path d="M50 30 C40 20 25 35 35 50 C45 65 50 72 50 72 C50 72 55 65 65 50 C75 35 60 20 50 30 Z" fill="#4edea3" fill-opacity="0.3" stroke="#4edea3" stroke-width="2.5" />`,
  },
  {
    id: 5,
    title: 'Tọa Đàm Khởi Nghiệp Đổi Mới Sáng Tạo',
    organizer: 'Hội Sinh Viên & Innovation Hub',
    organizerKey: 'hoi-sinh-vien',
    semester: 'hk1-23-24',
    date: '2025-03-12',
    points: 10,
    tokenId: 'Token #0063',
    issuer: 'Hội Sinh Viên & Innovation Hub',
    timestamp: 'Block #5,612,409 (Mạng Sepolia - 12/03/2025 14:05:00 GMT+7)',
    txHash: '0x51bb87cd...7701',
    svgInner: `<polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" fill="#171f33" /><polygon points="50 12, 83 29, 83 71, 50 88, 17 71, 17 29" fill="#222a3d" /><path d="M50 30 C42 30 36 36 36 44 C36 49 39 53 43 56 L43 62 L57 62 L57 56 C61 53 64 49 64 44 C64 36 58 30 50 30 Z" fill="#8083ff" fill-opacity="0.25" stroke="#c0c1ff" stroke-width="2" /><line x1="46" y1="66" x2="54" y2="66" stroke="#c0c1ff" stroke-width="2" />`,
  },
  {
    id: 6,
    title: 'Seminar An Toàn Thông Tin & Zero Trust',
    organizer: 'Khoa CNTT - ĐH Công Nghệ',
    organizerKey: 'khoa-cntt',
    semester: 'hk1-23-24',
    date: '2025-01-05',
    points: 10,
    tokenId: 'Token #0031',
    issuer: 'Khoa CNTT - ĐH Công Nghệ',
    timestamp: 'Block #5,389,011 (Mạng Sepolia - 05/01/2025 10:00:34 GMT+7)',
    txHash: '0x20ae34ba...091c',
    svgInner: `<polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" fill="#171f33" /><polygon points="50 12, 83 29, 83 71, 50 88, 17 71, 17 29" fill="#222a3d" /><path d="M50 28 L68 36 V52 C68 64 50 74 50 74 C50 74 32 64 32 52 V36 Z" fill="none" stroke="#4cd7f6" stroke-width="2.5" /><path d="M44 50 L48 54 L56 46" fill="none" stroke="#4edea3" stroke-width="2.5" stroke-linecap="round" />`,
  },
];

export default function CollectionPage() {
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('all');
  const [organizer, setOrganizer] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [walletAddress, setWalletAddress] = useState('0x71C834C15aE28D2B9F3b2E7f2A3A4E894e89');

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        })
        .catch(() => {});
    }
  }, []);

  const filteredBadges = useMemo(() => {
    return ALL_6_BADGES
      .filter((b) => {
        const matchSearch = b.title.toLowerCase().includes(search.toLowerCase().trim());
        const matchSemester = semester === 'all' || b.semester === semester;
        const matchOrg = organizer === 'all' || b.organizerKey === organizer;
        return matchSearch && matchSemester && matchOrg;
      })
      .sort((a, b) => {
        if (sort === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sort === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sort === 'points') return b.points - a.points;
        return 0;
      });
  }, [search, semester, organizer, sort]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${MOCK_STATS.fullName} - Portfolio Chứng Chỉ Số`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép liên kết hồ sơ vào clipboard!');
    }
  };

  return (
    <main className="w-full min-h-[calc(100vh-80px)] bg-[#0b1326] text-[#dae2fd] py-8 px-4 md:px-8">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-8">
        <StudentProfileHeader stats={MOCK_STATS} onShare={handleShare} />

        <FilterToolbar
          search={search}
          setSearch={setSearch}
          semester={semester}
          setSemester={setSemester}
          organizer={organizer}
          setOrganizer={setOrganizer}
          sort={sort}
          setSort={setSort}
          totalVisible={filteredBadges.length}
        />

        {filteredBadges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} onSelect={() => setSelectedBadge(badge)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-[#131b2e]/50 rounded-xl text-center border border-[#222a3d]">
            <span className="material-symbols-outlined text-[48px] text-[#908fa0] mb-2 select-none">search_off</span>
            <p className="text-lg font-semibold text-[#dae2fd]">Không tìm thấy huy hiệu phù hợp</p>
            <p className="text-xs text-[#c7c4d7] mt-1">Vui lòng thử lại với từ khóa khác hoặc đặt lại bộ lọc.</p>
            <button
              onClick={() => {
                setSearch('');
                setSemester('all');
                setOrganizer('all');
                setSort('newest');
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#c0c1ff] text-xs font-medium transition-colors cursor-pointer"
            >
              Đặt Lại Bộ Lọc
            </button>
          </div>
        )}

        <CredentialModal
          badge={selectedBadge}
          walletAddress={walletAddress}
          studentName={MOCK_STATS.fullName}
          studentId={MOCK_STATS.studentId}
          onClose={() => setSelectedBadge(null)}
          onCopy={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Đã sao chép liên kết chứng thực Web3!');
          }}
        />
      </div>
    </main>
  );
}