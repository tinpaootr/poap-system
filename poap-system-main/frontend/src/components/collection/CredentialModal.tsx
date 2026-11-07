'use client';

import React, { useEffect, useState } from 'react';
import { BadgeItem } from './BadgeCard';
import {
  useOnchainVerify,
  CONTRACT_ADDRESS,
  ETHERSCAN_BASE,
  VerifyStatus,
} from '@/hooks/useOnchainVerify';

interface ModalProps {
  badge: BadgeItem | null;
  walletAddress: string;
  studentName: string;
  studentId: string;
  onClose: () => void;
  onCopy: () => void;
}

const STATUS_UI: Record<VerifyStatus, { icon: string; label: string; color: string }> = {
  idle: { icon: 'hourglass_empty', label: 'Chưa kiểm tra', color: 'text-[#908fa0]' },
  checking: { icon: 'progress_activity', label: 'Đang xác minh trên Blockchain...', color: 'text-[#c0c1ff]' },
  verified: { icon: 'verified', label: 'Đã xác minh on-chain', color: 'text-[#4edea3]' },
  mismatch: { icon: 'gpp_bad', label: 'Xác minh thất bại', color: 'text-[#ffb4ab]' },
  error: { icon: 'error', label: 'Không thể xác minh', color: 'text-[#ffb4ab]' },
};

const shorten = (s?: string, head = 6, tail = 4) =>
  s && s.length > head + tail + 2 ? `${s.slice(0, head)}...${s.slice(-tail)}` : s || '—';

export default function CredentialModal({
  badge,
  walletAddress,
  studentName,
  studentId,
  onClose,
  onCopy,
}: ModalProps) {
  const [copied, setCopied] = useState(false);

  // Hook phải gọi trước mọi early return. Không có badge -> hook tự tắt (enabled = false)
  const verify = useOnchainVerify(badge?.txHash, walletAddress);

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

  const ui = STATUS_UI[verify.status];
  const txUrl = `${ETHERSCAN_BASE}/tx/${badge.txHash}`;
  const contractUrl = `${ETHERSCAN_BASE}/address/${CONTRACT_ADDRESS}`;
  const tokenUrl = verify.tokenId
    ? `${ETHERSCAN_BASE}/token/${CONTRACT_ADDRESS}?a=${verify.tokenId}`
    : null;

  const copyContract = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const linkClass =
    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#131b2e] hover:bg-[#222a3d] text-[#4cd7f6] border border-[#222a3d] transition-colors text-xs font-medium';

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      {/* Khung Modal chính */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#171f33] text-[#dae2fd] p-6 sm:p-8 shadow-2xl border border-[#2d3449] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#131b2e] hover:bg-[#222a3d] text-[#c7c4d7] hover:text-white transition-colors cursor-pointer z-10 border border-[#222a3d]"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="flex flex-col gap-6">
          {/* Header Banner */}
          <div className="w-full rounded-xl bg-[#0b1326] p-6 flex flex-col sm:flex-row items-center gap-6 border border-[#222a3d]">
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

            <div className="flex-1 flex flex-col text-center sm:text-left min-w-0 pr-2">
              {/* Nhãn trạng thái phản ánh kết quả xác minh thật */}
              <span className={`text-xs font-medium flex items-center justify-center sm:justify-start gap-1 mb-1 ${ui.color}`}>
                <span className={`material-symbols-outlined text-[15px] ${verify.status === 'checking' ? 'animate-spin' : ''}`}>
                  {ui.icon}
                </span>
                {verify.status === 'verified' ? 'Chứng Thư Kỹ Thuật Số Đã Xác Thực On-Chain' : ui.label}
              </span>
              <h2 className="text-xl font-bold text-white leading-snug">{badge.title}</h2>
              <p className="text-xs text-[#c7c4d7] mt-1 line-clamp-2">{badge.issuer}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="px-2.5 py-1 rounded bg-[#171f33] text-[#dae2fd] text-xs font-mono border border-[#222a3d]">
                  {verify.tokenId ? `Token #${verify.tokenId}` : badge.tokenId}
                </span>
                <span className="px-2.5 py-1 rounded bg-[#171f33] text-[#4cd7f6] text-xs font-medium border border-[#222a3d]">
                  +{badge.points} Điểm Rèn Luyện
                </span>
              </div>
            </div>
          </div>

          {/* Bảng chi tiết thuộc tính */}
          <div className="flex flex-col divide-y divide-[#222a3d] rounded-xl bg-[#0b1326] px-5 py-2 text-xs border border-[#222a3d]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1">
              <span className="text-[#908fa0]">Chủ sở hữu thụ hưởng:</span>
              <span className="font-semibold text-white">
                {studentName} (MSSV: {studentId})
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1">
              <span className="text-[#908fa0]">Địa chỉ ví định danh:</span>
              <span className="font-mono text-[#4cd7f6] break-all">{walletAddress}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1">
              <span className="text-[#908fa0]">Thời gian tạo khối:</span>
              <span className="text-[#dae2fd] font-medium">{badge.timestamp}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1">
              <span className="text-[#908fa0]">Thuộc tính khóa:</span>
              {verify.locked === undefined ? (
                <span className="text-[#c7c4d7]">
                  {verify.status === 'checking' ? 'Đang đọc từ contract...' : '—'}
                </span>
              ) : verify.locked ? (
                <span className="text-[#4edea3] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">lock_clock</span>
                  Locked vĩnh viễn (Non-transferable)
                </span>
              ) : (
                <span className="text-[#ffb4ab] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">lock_open</span>
                  Chưa khóa (có thể chuyển nhượng)
                </span>
              )}
            </div>
          </div>

          {/* Khối xác minh on-chain */}
          <div className="rounded-xl bg-[#0b1326] px-5 py-4 text-xs border border-[#222a3d] flex flex-col gap-3">
            <div className={`flex items-center gap-2 font-semibold ${ui.color}`}>
              <span className={`material-symbols-outlined text-[18px] ${verify.status === 'checking' ? 'animate-spin' : ''}`}>
                {ui.icon}
              </span>
              {ui.label}
            </div>
            {verify.message && <p className="text-[#c7c4d7]">{verify.message}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-[#908fa0]">ownerOf(tokenId):</span>
                <span className="font-mono text-[#dae2fd]" title={verify.owner}>
                  {shorten(verify.owner)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#908fa0]">balanceOf(ví):</span>
                <span className="font-mono text-[#dae2fd]">{verify.balance ?? '—'} huy hiệu</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#908fa0]">Khối mint:</span>
                <span className="font-mono text-[#dae2fd]">{verify.blockNumber ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-[#908fa0]">Smart Contract:</span>
                <span className="flex items-center gap-1.5">
                  <a
                    href={contractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#4cd7f6] hover:underline"
                    title={CONTRACT_ADDRESS}
                  >
                    {shorten(CONTRACT_ADDRESS)}
                  </a>
                  <button
                    onClick={copyContract}
                    aria-label="Sao chép địa chỉ contract"
                    className="text-[#c0c1ff] hover:text-white cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Hàng nút bấm hành động */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <a href={txUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Xem Giao Dịch Trên Sepolia Etherscan
              </a>
              {tokenUrl && (
                <a href={tokenUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  <span className="material-symbols-outlined text-[16px]">token</span>
                  Xem Token
                </a>
              )}
            </div>

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
  );
}