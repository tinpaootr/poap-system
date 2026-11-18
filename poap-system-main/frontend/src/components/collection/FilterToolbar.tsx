'use client';

import React from 'react';

export interface OrganizerOption {
  key: string;
  label: string;
}

interface FilterToolbarProps {
  search: string;
  setSearch: (v: string) => void;
  semester: string;
  setSemester: (v: string) => void;
  organizer: string;
  setOrganizer: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  totalVisible: number;
  customOrganizers?: OrganizerOption[];
}

const DEFAULT_ORGANIZERS: OrganizerOption[] = [
  { key: 'khoa-cntt', label: 'Khoa CNTT' },
  { key: 'clb-tin-hoc', label: 'CLB Tin Học' },
  { key: 'doan-thanh-nien', label: 'Đoàn Thanh Niên' },
  { key: 'hoi-sinh-vien', label: 'Hội Sinh Viên' },
];

export default function FilterToolbar({
  search,
  setSearch,
  semester,
  setSemester,
  organizer,
  setOrganizer,
  sort,
  setSort,
  totalVisible,
  customOrganizers = [],
}: FilterToolbarProps) {
  // Gộp 4 đơn vị mặc định với các đơn vị tự nhập mới (không trùng lặp)
  const mergedOrganizers = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const item of DEFAULT_ORGANIZERS) {
      map.set(item.key, item.label);
    }
    for (const item of customOrganizers) {
      if (item.key && !map.has(item.key)) {
        map.set(item.key, item.label);
      }
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [customOrganizers]);

  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#c7c4d7] pointer-events-none select-none">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm huy hiệu, sự kiện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 rounded-lg bg-[#131b2e] text-[#dae2fd] placeholder:text-[#908fa0] focus:outline-none focus:bg-[#171f33] border border-[#222a3d] text-sm transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative">
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="appearance-none bg-[#131b2e] border border-[#222a3d] text-[#dae2fd] text-xs py-2 pl-3 pr-8 rounded-lg focus:outline-none cursor-pointer hover:bg-[#171f33] transition-colors"
            >
              <option value="all">Tất cả học kỳ</option>
              <option value="hk1-26-27">HK1 (2026-2027)</option>
              <option value="hk2-25-26">HK2 (2025-2026)</option>
              <option value="hk1-25-26">HK1 (2025-2026)</option>
              <option value="hk2-24-25">HK2 (2024-2025)</option>
              <option value="hk1-24-25">HK1 (2024-2025)</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#c7c4d7]">
              expand_more
            </span>
          </div>

          <div className="relative">
            <select
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              className="appearance-none bg-[#131b2e] border border-[#222a3d] text-[#dae2fd] text-xs py-2 pl-3 pr-8 rounded-lg focus:outline-none cursor-pointer hover:bg-[#171f33] transition-colors"
            >
              <option value="all">Tất cả đơn vị / CLB</option>
              {mergedOrganizers.map((org) => (
                <option key={org.key} value={org.key}>
                  {org.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#c7c4d7]">
              expand_more
            </span>
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-[#131b2e] border border-[#222a3d] text-[#dae2fd] text-xs py-2 pl-3 pr-8 rounded-lg focus:outline-none cursor-pointer hover:bg-[#171f33] transition-colors"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="points">Điểm cao nhất</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#c7c4d7]">
              sort
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-[#c7c4d7] text-xs">
        <div>
          <span>Hiển thị </span>
          <span className="font-semibold text-[#dae2fd]">{totalVisible}</span>
          <span> huy hiệu đã tích lũy</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#4edea3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
          <span>Đã xác thực On-chain</span>
        </div>
      </div>
    </section>
  );
}