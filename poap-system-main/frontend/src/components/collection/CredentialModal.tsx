'use client';

import React, { useEffect } from 'react';
import { BadgeItem } from './BadgeCard';

interface ModalProps {
  badge: BadgeItem | null;
  walletAddress: string;
  studentName: string;
  studentId: string;
  onClose: () => void;
  onCopy: () => void;
}

export default function CredentialModal({
  badge,
  walletAddress,
  studentName,
  studentId,
  onClose,
  onCopy,
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (badge) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [badge, onClose]);

  if (!badge) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      {/* Khung Modal chính */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#171f33] text-[#dae2fd] p-6 sm:p-8 shadow-2xl border border-[#2d3449] max-h-[90vh] overflow-y-auto">
        
        {/* Nút đóng (X) căn góc chuẩn, không đè nội dung */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#131b2e] hover:bg-[#222a3d] text-[#c7c4d7] hover:text-white transition-colors cursor-pointer z-10 border border-[#222a3d]"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="flex flex-col gap-6">
          {/* Header Banner: Tách biệt rõ 2 cột Badge và Nội dung */}
          <div className="w-full rounded-xl bg-[#0b1326] p-6 flex flex-col sm:flex-row items-center gap-6 border border-[#222a3d]">
            
            {/* Cột hiển thị SVG Huy hiệu */}
            <div className="relative flex-shrink-0 w-28 h-28 flex items-center justify-center rounded-xl bg-[#131b2e] p-3 border border-[#222a3d]">
              <svg
                className="w-20 h-20"
                viewBox="0 0 100 100"
                dangerouslySetInnerHTML={{ __html: badge.svgInner }}
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#222a3d] text-[#4cd7f6] text-[10px] font-semibold border border-[#2d3449]">
                ERC-5192
              </span>
            </div>

            {/* Cột hiển thị Tiêu đề và Thông tin */}
            <div className="flex-1 flex flex-col text-center sm:text-left min-w-0 pr-2">
              <span className="text-xs text-[#4edea3] font-medium flex items-center justify-center sm:justify-start gap-1 mb-1">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                Chứng Thư Kỹ Thuật Số Đã Xác Thực
              </span>
              <h2 className="text-xl font-bold text-white leading-snug">
                {badge.title}
              </h2>
              <p className="text-xs text-[#c7c4d7] mt-1 line-clamp-2">
                {badge.issuer}
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="px-2.5 py-1 rounded bg-[#171f33] text-[#dae2fd] text-xs font-mono border border-[#222a3d]">
                  {badge.tokenId}
                </span>
                <span className="px-2.5 py-1 rounded bg-[#171f33] text-[#4cd7f6] text-xs font-medium border border-[#222a3d]">
                  +{badge.points} Điểm Rèn Luyện
                </span>
              </div>
            </div>
          </div>

          {/* Bảng chi tiết thuộc tính On-Chain */}
          <div className="flex flex-col divide-y divide-[#222a3d] rounded-xl bg-[#0b1326] px-5 py-2 text-xs border border-[#222a3d]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1">
              <span className="text-[#908fa0]">Chủ sở hữu thụ hưởng:</span>
              <span className="font-semibold text-white">
                {studentName} (MSSV: {studentId})
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1">
              <span className="text-[#908fa0]">Địa chỉ ví định danh:</span>
              <span className="font-mono text-[#4cd7f6] break-all">
                {walletAddress}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1">
              <span className="text-[#908fa0]">Thời gian tạo khối:</span>
              <span className="text-[#dae2fd] font-medium">
                {badge.timestamp}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1">
              <span className="text-[#908fa0]">Thuộc tính khóa:</span>
              <span className="text-[#4edea3] font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">lock_clock</span>
                Locked vĩnh viễn (Non-transferable)
              </span>
            </div>
          </div>

          {/* Hàng nút bấm hành động */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <a
              href={`https://sepolia.etherscan.io/tx/${badge.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#131b2e] hover:bg-[#222a3d] text-[#4cd7f6] border border-[#222a3d] transition-colors text-xs font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Kiểm Tra Trên Sepolia Etherscan
            </a>

            <div className="flex items-center gap-2">
              <button
                onClick={onCopy}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#131b2e] hover:bg-[#222a3d] text-[#dae2fd] border border-[#222a3d] transition-colors text-xs font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#c0c1ff]">link</span>
                Sao Chép Liên Kết
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}