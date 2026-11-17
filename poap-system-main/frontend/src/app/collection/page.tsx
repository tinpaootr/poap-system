'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Lock, Wallet } from 'lucide-react';
import { useConnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import StudentProfileHeader from '@/components/collection/StudentProfileHeader';
import FilterToolbar from '@/components/collection/FilterToolbar';
import BadgeCard, { BadgeItem } from '@/components/collection/BadgeCard';
import CredentialModal from '@/components/collection/CredentialModal';
import { useCollection } from '@/hooks/useCollection';
import { toBadgeItem } from '@/lib/collectionMapper';

const BASE_STATS = {
  fullName: 'Sinh viên',
  cohort: 'Khoá 2021 - 2025',
  studentId: '—',
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
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('all');
  const [organizer, setOrganizer] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const { connect } = useConnect();
  const { address, isConnected, badges: apiBadges, loading, error, refresh } = useCollection();

  useEffect(() => {
    setMounted(true);
  }, []);

  const allBadges: BadgeItem[] = useMemo(() => apiBadges.map(toBadgeItem), [apiBadges]);

  const stats = useMemo(() => {
    const latest = apiBadges[0]; // backend đã sort mới nhất trước
    const badgeWithClass = apiBadges.find((b) => b.className && b.className.trim() !== '');
    const currentSemester = allBadges[0]?.semester;

    return {
      ...BASE_STATS,
      fullName: latest?.fullName || BASE_STATS.fullName,
      studentId: latest?.studentId || BASE_STATS.studentId,
      // Nếu có dữ liệu Lớp từ backend thì hiển thị "Lớp: ...", nếu chưa có mới dùng mặc định
      major: badgeWithClass?.className
        ? `Lớp: ${badgeWithClass.className}`
        : BASE_STATS.major,
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
          title: `${stats.fullName} - Portfolio Chứng Chỉ`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép liên kết vào clipboard!');
    }
  };

  if (!mounted) return null;

  // Chặn toàn trang nếu chưa kết nối ví (giống trang Admin)
  if (!isConnected) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#0b0e17] flex items-center justify-center p-4">
        <div className="bg-[#131b2e] border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Khu Vực Đã Khóa</h1>
          <p className="text-slate-400 text-sm mb-6">
            Bạn cần kết nối ví MetaMask để xem hồ sơ năng lực và bộ sưu tập huy hiệu Soulbound của mình.
          </p>
          <button
            onClick={() => connect({ connector: metaMask() })}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-semibold transition cursor-pointer"
          >
            <Wallet className="w-5 h-5" />
            Kết Nối MetaMask
          </button>
        </div>
      </main>
    );
  }

  const renderBody = () => {
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
            Thử lại
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
          <p className="text-xs text-[#c7c4d7] mt-1">Vui lòng thử từ khóa khác hoặc xóa bộ lọc.</p>
          <button
            onClick={() => {
              setSearch('');
              setSemester('all');
              setOrganizer('all');
              setSort('newest');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#c0c1ff] text-xs font-medium transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
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