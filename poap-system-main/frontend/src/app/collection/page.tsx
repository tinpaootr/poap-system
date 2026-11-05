'use client';

import React, { useState, useMemo } from 'react';
import StudentProfileHeader from '@/components/collection/StudentProfileHeader';
import FilterToolbar from '@/components/collection/FilterToolbar';
import BadgeCard, { BadgeItem } from '@/components/collection/BadgeCard';
import CredentialModal from '@/components/collection/CredentialModal';
import { useCollection } from '@/hooks/useCollection';
import { toBadgeItem } from '@/lib/collectionMapper';

// Thông tin chưa có trong backend (khóa, ngành, hạng, avatar) -> giữ giá trị mặc định.
// Họ tên, MSSV, số huy hiệu, điểm được tính từ dữ liệu thật bên dưới.
const BASE_STATS = {
  fullName: 'Sinh viên',
  cohort: 'Khoá 2021 - 2025',
  studentId: '',
  major: 'Khoa Học Máy Tính',
  rank: 'Hạng Vàng',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD-i7Y8oMoGESPTlqKL8VkUHhlVtmI-gKqUpiE-f0L7zuNB8G_M5N6UT2oi8fgea_Z4s-d7BZdc4OjXL9ReyNj9wYex6hwRoY7_3w7FeN5i5wwu0EdbLRTZcB0FC928IrPNTdfhDpQ6qyAz9LRhMydNSRKcqWNBAo0gVGXzdQ-SrpMgUqX2YMI_xwgcqlbPRDvs0RiMhok8fqHP4F0P7qCyaP5L1NyzqxMz5JHJxyhZc6kHEkul2WD0_Q',
  totalEvents: 0,
  semesterGain: 0,
  totalSoulbound: 0,
  activityPoints: 0,
  maxPoints: 100,
};

export default function CollectionPage() {
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('all');
  const [organizer, setOrganizer] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  // Dữ liệu thật: ví MetaMask đang kết nối + huy hiệu từ backend
  const { address, isConnected, badges: apiBadges, loading, error, refresh } = useCollection();

  const allBadges: BadgeItem[] = useMemo(() => apiBadges.map(toBadgeItem), [apiBadges]);

  const stats = useMemo(() => {
    const latest = apiBadges[0]; // backend đã sắp xếp mới nhất trước
    const currentSemester = allBadges[0]?.semester;
    return {
      ...BASE_STATS,
      fullName: latest?.fullName || BASE_STATS.fullName,
      studentId: latest?.studentId || BASE_STATS.studentId,
      totalEvents: allBadges.length,
      totalSoulbound: allBadges.length,
      semesterGain: allBadges.filter((b) => b.semester === currentSemester).length,
      activityPoints: Math.min(
        allBadges.reduce((sum, b) => sum + b.points, 0),
        BASE_STATS.maxPoints
      ),
    };
  }, [apiBadges, allBadges]);

  const filteredBadges = useMemo(() => {
    return allBadges
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
  }, [allBadges, search, semester, organizer, sort]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: `${stats.fullName} - Portfolio Chứng Chỉ Số`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép liên kết hồ sơ vào clipboard!');
    }
  };

  // ====== Các trạng thái hiển thị ======
  const renderBody = () => {
    if (!isConnected) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-[#131b2e]/50 rounded-xl text-center border border-[#222a3d]">
          <span className="material-symbols-outlined text-[48px] text-[#908fa0] mb-2 select-none">account_balance_wallet</span>
          <p className="text-lg font-semibold text-[#dae2fd]">Chưa kết nối ví</p>
          <p className="text-xs text-[#c7c4d7] mt-1">Vui lòng kết nối ví MetaMask để xem bộ sưu tập huy hiệu của bạn.</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <span className="material-symbols-outlined text-[40px] text-[#c0c1ff] animate-spin select-none">progress_activity</span>
          <p className="text-sm text-[#c7c4d7] mt-3">Đang tải bộ sưu tập...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-[#131b2e]/50 rounded-xl text-center border border-[#222a3d]">
          <span className="material-symbols-outlined text-[48px] text-[#ffb4ab] mb-2 select-none">error</span>
          <p className="text-lg font-semibold text-[#dae2fd]">Không tải được bộ sưu tập</p>
          <p className="text-xs text-[#c7c4d7] mt-1">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#c0c1ff] text-xs font-medium transition-colors cursor-pointer"
          >
            Thử Lại
          </button>
        </div>
      );
    }

    if (allBadges.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-[#131b2e]/50 rounded-xl text-center border border-[#222a3d]">
          <span className="material-symbols-outlined text-[48px] text-[#908fa0] mb-2 select-none">workspace_premium</span>
          <p className="text-lg font-semibold text-[#dae2fd]">Bạn chưa có huy hiệu nào</p>
          <p className="text-xs text-[#c7c4d7] mt-1">Hãy tham gia sự kiện và quét mã QR tại trang Điểm danh để nhận huy hiệu đầu tiên.</p>
        </div>
      );
    }

    if (filteredBadges.length === 0) {
      return (
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
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBadges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} onSelect={() => setSelectedBadge(badge)} />
        ))}
      </div>
    );
  };

  return (
    <main className="w-full min-h-[calc(100vh-80px)] bg-[#0b1326] text-[#dae2fd] py-8 px-4 md:px-8">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-8">
        <StudentProfileHeader stats={stats} onShare={handleShare} />

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

        {renderBody()}

        <CredentialModal
          badge={selectedBadge}
          walletAddress={address ?? ''}
          studentName={stats.fullName}
          studentId={stats.studentId}
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