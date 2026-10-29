'use client';
import React from 'react';

interface EventDetailsProps {
  isScanned: boolean;
  mintState: 'idle' | 'processing' | 'success';
  onMint: () => void;
}

export default function EventDetailsPanel({ isScanned, mintState, onMint }: EventDetailsProps) {
  return (
    <div className="lg:col-span-5 flex flex-col gap-6">
      {!isScanned && (
        <div className="bg-[#131b2e] rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center h-full border border-dashed border-slate-700">
          <span className="material-symbols-outlined text-[48px] text-slate-600">qr_code_scanner</span>
          <p className="text-sm text-slate-400">Vui lòng quét mã để hiển thị thông tin sự kiện</p>
        </div>
      )}

      {isScanned && (
        <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-8 shadow-xl flex flex-col gap-6 relative overflow-hidden animate-fade-in">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">event_available</span>
              Đã nhận diện thành công
            </span>
            <span className="text-[11px] text-slate-500 font-mono">ID: #EVT-2025-04</span>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-white leading-snug">
              Hội thảo Ứng dụng Blockchain & Web3 trong Đời sống Sinh viên
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <span className="material-symbols-outlined text-[18px] text-indigo-400">record_voice_over</span>
              Diễn giả: TS. Lê Hoài Nam & Khách mời GDG
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#0b1326] border border-slate-800/50 flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-[20px]">schedule</span>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Thời gian</span>
                <span className="text-xs text-white font-semibold">14:30 - Hôm nay</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1326] border border-slate-800/50 flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-[20px]">location_on</span>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Địa điểm</span>
                <span className="text-xs text-white font-semibold">Hội trường A</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1326]/50 border border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] text-indigo-400 uppercase font-bold tracking-wider">Quyền lợi nhận được:</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                <span className="text-sm font-semibold text-white">01 Soulbound Badge</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[11px]">Bất biến (SBT)</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <span className="text-[11px] font-semibold text-slate-400">Thông tin định danh sinh viên:</span>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500">Địa chỉ ví MetaMask</label>
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0b1326] border border-slate-800 text-white font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  0x71C834b...4e89
                </div>
                <span className="text-[11px] text-emerald-400 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Đã liên kết
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500">Mã số sinh viên (MSSV)</label>
                <input className="px-4 py-3 rounded-lg bg-[#0b1326] border border-slate-800 text-white text-xs focus:outline-none" readOnly type="text" value="21120456" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500">Họ và Tên</label>
                <input className="px-4 py-3 rounded-lg bg-[#0b1326] border border-slate-800 text-white text-xs focus:outline-none" readOnly type="text" value="Nguyễn Thu Trang" />
              </div>
            </div>
          </div>

          <button 
            onClick={onMint}
            disabled={mintState !== 'idle'}
            className={`w-full mt-2 py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-2 group ${mintState !== 'idle' ? 'opacity-50 pointer-events-none' : 'hover:shadow-2xl hover:scale-[1.01]'}`}>
            <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform">auto_awesome</span>
            <span>Nhận Huy Hiệu (Claim POAP / SBT)</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <span className="text-center text-[11px] text-slate-500">Phí mạng (Gas fee): Được nhà trường tài trợ 100%</span>
        </div>
      )}

      {mintState === 'processing' && (
        <div className="p-6 rounded-xl bg-[#131b2e]/95 border border-slate-800 shadow-xl flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <span className="material-symbols-outlined text-indigo-400 text-[20px] absolute">token</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Đang Ký Giao Dịch Sepolia...</span>
              <span className="text-[11px] text-cyan-400 animate-pulse">Vui lòng không đóng hoặc tải lại trang</span>
            </div>
          </div>
          <div className="w-full bg-[#0b1326] rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1.5 w-3/4 animate-pulse"></div>
          </div>
        </div>
      )}

      {mintState === 'success' && (
        <div className="p-6 rounded-xl bg-[#131b2e]/95 border border-emerald-500/30 shadow-2xl flex flex-col gap-4 relative overflow-hidden animate-fade-in">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">Điểm Danh Thành Công!</span>
              <span className="text-xs font-semibold text-emerald-400">Huy hiệu Soulbound đã được đúc vào ví</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0b1326] border border-slate-800">
            <img className="w-16 h-16 rounded-lg object-cover shadow-md" alt="Preview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDe_vtX7LiwziPN7Anl_EIwEOtEfV1sx_j3dPkoKPqhAd7tK_pfspSOi7OOqs46c6SKHGRVKREjRjcnfv1Os7r4TymoG32DF-v0GBcEcaJvFQU_rBxx3CCOvqeY5BJ-WJ3ZUNGLFK5ANwpdYV1kNp6bEyRtsPyGNPUIjvSiYgNvTj285qRJAQf7kyf0dbTmyavsPUVnlws5AaaoaaDjYl5PziGlD9E9UcQQ6-bHPQ9OYzf0knf7LgOT5A" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white truncate">SBT-Blockchain-K21</span>
              <span className="text-[11px] text-slate-400">Chuẩn ERC-5192 (Locked Soulbound)</span>
              <span className="text-[11px] text-indigo-400 font-mono truncate mt-0.5">Tx: 0x9a3f81e6c4...7b12d8</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <button className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs text-center transition-colors">
              Xem Sepolia Etherscan
            </button>
            <button className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">folder_open</span>
              Xem Bộ Sưu Tập
            </button>
          </div>
        </div>
      )}
    </div>
  );
}