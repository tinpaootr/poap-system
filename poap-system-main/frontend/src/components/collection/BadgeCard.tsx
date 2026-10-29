'use client';

import React from 'react';

export interface BadgeItem {
  id: number;
  title: string;
  organizer: string;
  organizerKey: string;
  semester: string;
  date: string;
  points: number;
  tokenId: string;
  issuer: string;
  timestamp: string;
  txHash: string;
  svgInner: string;
}

export default function BadgeCard({
  badge,
  onSelect,
}: {
  badge: BadgeItem;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className="group relative flex flex-col justify-between rounded-xl bg-[#131b2e]/70 hover:bg-[#222a3d] transition-all duration-300 p-6 shadow-md hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden border border-[#222a3d]/60"
    >
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#c0c1ff]/10 rounded-full blur-2xl group-hover:bg-[#c0c1ff]/20 transition-all pointer-events-none" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="px-2 py-0.5 rounded bg-[#171f33] text-[#4edea3] text-xs font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">lock</span> Soulbound ERC-5192
          </span>
          <span className="text-xs text-[#908fa0] font-mono">{badge.tokenId}</span>
        </div>

        <div className="relative w-full aspect-square max-h-48 my-2 rounded-lg bg-[#060e20]/80 flex items-center justify-center p-4 overflow-hidden border border-[#171f33]">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#8083ff]/15 via-transparent to-[#03b5d3]/10 opacity-70 group-hover:opacity-100 transition-opacity" />
          <svg
            className="w-28 h-28 transform group-hover:scale-110 transition-transform duration-500"
            viewBox="0 0 100 100"
            dangerouslySetInnerHTML={{ __html: badge.svgInner }}
          />
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#2d3449]/90 text-[11px] text-[#dae2fd] flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-[#4edea3]">check_circle</span>
            Đã chứng thực
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-4">
          <h3 className="text-base font-semibold text-[#dae2fd] group-hover:text-[#c0c1ff] transition-colors line-clamp-1">
            {badge.title}
          </h3>
          <p className="text-xs text-[#c7c4d7] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">apartment</span>
            {badge.organizer}
          </p>
          <div className="flex items-center justify-between text-[#908fa0] text-xs mt-2">
            <span>Cấp ngày {new Date(badge.date).toLocaleDateString('vi-VN')}</span>
            <span className="text-[#4cd7f6] font-semibold">+{badge.points} ĐRL</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-3 flex items-center justify-between border-t border-[#171f33]">
        <span className="text-xs text-[#c0c1ff] flex items-center gap-1">
          Xem Chi Tiết Chứng Nhận
          <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </span>
        <span className="material-symbols-outlined text-[18px] text-[#908fa0] group-hover:text-[#c0c1ff]">
          visibility
        </span>
      </div>
    </div>
  );
}