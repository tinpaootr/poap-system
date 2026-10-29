'use client';

import React from 'react';

interface StatsProps {
  fullName: string;
  cohort: string;
  studentId: string;
  major: string;
  rank: string;
  avatarUrl: string;
  totalEvents: number;
  semesterGain: number;
  totalSoulbound: number;
  activityPoints: number;
  maxPoints: number;
}

export default function StudentProfileHeader({
  stats,
  onShare,
}: {
  stats: StatsProps;
  onShare: () => void;
}) {
  return (
    <section className="relative w-full rounded-xl bg-[#131b2e]/80 backdrop-blur-xl p-6 md:p-8 shadow-xl border border-[#222a3d]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <img
              alt={stats.fullName}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-[#c0c1ff]/40"
              src={stats.avatarUrl}
            />
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#171f33] flex items-center justify-center text-[#4edea3] shadow-sm">
              <span className="material-symbols-outlined text-[16px]">verified</span>
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#dae2fd]">{stats.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#171f33] text-[#4cd7f6] text-xs font-semibold">
                {stats.cohort}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[#c7c4d7] text-xs">
              <span>MSSV: {stats.studentId}</span>
              <span className="w-1 h-1 rounded-full bg-[#908fa0]"></span>
              <span>{stats.major}</span>
              <span className="w-1 h-1 rounded-full bg-[#908fa0]"></span>
              <span className="text-[#4edea3] font-medium">{stats.rank}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] transition-colors text-xs font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">picture_as_pdf</span>
            Xuất Bảng Điểm
          </button>
          <button
            onClick={onShare}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#c0c1ff] text-[#1000a9] hover:opacity-90 transition-opacity font-semibold text-xs shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            Chia Sẻ Hồ Sơ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#171f33]">
        <div className="flex flex-col">
          <span className="text-xs text-[#c7c4d7]">Sự kiện tham gia</span>
          <span className="text-xl font-bold text-[#dae2fd] mt-1">
            {stats.totalEvents}{' '}
            <span className="text-xs font-normal text-[#4edea3]">(+{stats.semesterGain} HK này)</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-[#c7c4d7]">Huy hiệu Soulbound</span>
          <span className="text-xl font-bold text-[#4cd7f6] mt-1">
            {stats.totalSoulbound} <span className="text-xs font-normal text-[#c7c4d7]">ERC-5192</span>
          </span>
        </div>
        <div className="flex flex-col col-span-2 sm:col-span-1">
          <span className="text-xs text-[#c7c4d7]">Điểm rèn luyện tích lũy</span>
          <span className="text-xl font-bold text-[#4edea3] mt-1">
            {stats.activityPoints}
            <span className="text-xs font-normal text-[#c7c4d7]"> / {stats.maxPoints}</span>
          </span>
        </div>
      </div>
    </section>
  );
}