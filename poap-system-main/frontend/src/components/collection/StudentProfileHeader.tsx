'use client';

import React, { useState, useEffect, useRef } from 'react';

interface StatsProps {
  fullName: string;
  cohort: string;
  studentId: string;
  major: string;
  rank: string;
  avatarUrl?: string;
  totalEvents: number;
  semesterGain: number;
  totalSoulbound: number;
  activityPoints: number;
  maxPoints: number;
}

const STORAGE_KEY_PREFIX = 'poap_student_avatar_';

// Kiểm tra xem URL có phải là ảnh mặt người mặc định cũ không để tự động bỏ qua
function isLegacyFaceUrl(url?: string): boolean {
  if (!url) return true;
  return url.includes('lh3.googleusercontent.com/aida-public/');
}

// Nén ảnh tải lên về kích thước gọn (256x256) trước khi lưu vào localStorage
function resizeImageToDataUrl(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StudentProfileHeader({
  stats,
  walletAddress,
  onShare,
}: {
  stats: StatsProps;
  walletAddress?: string;
  onShare: () => void;
}) {
  const storageKey = `${STORAGE_KEY_PREFIX}${(walletAddress || 'default').toLowerCase()}`;
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setCustomAvatar(saved || null);
    } catch {
      setCustomAvatar(null);
    }
  }, [storageKey]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP...).');
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setCustomAvatar(dataUrl);
      localStorage.setItem(storageKey, dataUrl);
    } catch {
      alert('Không thể xử lý ảnh này, vui lòng thử ảnh khác.');
    } finally {
      e.target.value = '';
    }
  };

  const handleResetAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomAvatar(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore storage errors
    }
  };

  const activeAvatarUrl =
    customAvatar || (!isLegacyFaceUrl(stats.avatarUrl) ? stats.avatarUrl : null);

  return (
    <section className="relative w-full rounded-xl bg-[#131b2e]/80 backdrop-blur-xl p-6 md:p-8 shadow-xl border border-[#222a3d]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0 group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Nhấn để đổi ảnh đại diện"
              className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-[#c0c1ff]/40 bg-gradient-to-br from-[#1b2642] via-[#171f33] to-[#0f172a] flex items-center justify-center cursor-pointer focus:outline-none focus:ring-[#4cd7f6]"
            >
              {activeAvatarUrl ? (
                <img
                  alt={stats.fullName}
                  className="w-full h-full object-cover"
                  src={activeAvatarUrl}
                />
              ) : (
                /* Avatar ẩn danh không hiện mặt (Silhouette) */
                <svg
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                  aria-label="Avatar ẩn danh"
                >
                  <circle cx="40" cy="40" r="40" fill="url(#anonGrad)" />
                  <circle
                    cx="40"
                    cy="29"
                    r="13"
                    fill="#c0c1ff"
                    fillOpacity="0.85"
                  />
                  <path
                    d="M16 69C16 55.7452 26.7452 45 40 45C53.2548 45 64 55.7452 64 69V80H16V69Z"
                    fill="#c0c1ff"
                    fillOpacity="0.85"
                  />
                  <defs>
                    <linearGradient
                      id="anonGrad"
                      x1="0"
                      y1="0"
                      x2="80"
                      y2="80"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#222a3d" />
                      <stop offset="1" stopColor="#131b2e" />
                    </linearGradient>
                  </defs>
                </svg>
              )}

              {/* Lớp phủ khi rê chuột để đổi ảnh */}
              <div className="absolute inset-0 bg-[#0b1326]/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[#dae2fd]">
                <span className="material-symbols-outlined text-[20px] text-[#4cd7f6]">
                  photo_camera
                </span>
                <span className="text-[10px] font-semibold mt-0.5">Đổi ảnh</span>
              </div>
            </button>

            {/* Nút khôi phục về avatar ẩn danh mặc định khi đang dùng ảnh tự tải lên */}
            {customAvatar && (
              <button
                type="button"
                onClick={handleResetAvatar}
                title="Đặt lại về avatar ẩn danh"
                className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-[#222a3d] hover:bg-rose-500/90 text-[#c7c4d7] hover:text-white border border-[#31394d] flex items-center justify-center shadow-sm transition-colors cursor-pointer z-10"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}

            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#171f33] flex items-center justify-center text-[#4edea3] shadow-sm pointer-events-none">
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