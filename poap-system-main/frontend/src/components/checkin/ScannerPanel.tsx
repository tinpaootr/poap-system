'use client';
import React, { useState } from 'react';

export default function ScannerPanel({ onScanSuccess }: { onScanSuccess: () => void }) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');

  return (
    <div className="lg:col-span-7 flex flex-col gap-6">
      <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-8 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quét Mã Điểm Danh</h2>
              <p className="text-xs text-slate-400">Chọn 1 trong 3 phương thức xác nhận</p>
            </div>
          </div>
          
          <div className="flex items-center p-1 bg-[#0b1326] border border-slate-800 rounded-xl gap-1 self-start sm:self-auto text-xs">
            <button 
              onClick={() => setActiveTab('camera')}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${activeTab === 'camera' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              Camera
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Tải Ảnh
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${activeTab === 'manual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              <span className="material-symbols-outlined text-[18px]">pin</span>
              Nhập Mã
            </button>
          </div>
        </div>

        {activeTab === 'camera' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="relative w-full aspect-video rounded-xl bg-[#0b1326] border border-slate-800/50 overflow-hidden flex items-center justify-center shadow-inner">
              <img className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Auditorium scanner preview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDldVVdXPVTjgRGiEJOBrxo-L_HFHg-w9xMUZVT0wvEoGUayvBPtyCdDdfsL8pi5lOo_qzscw-5FOL4WiKgC85LxW_SWWsqTM9JUu9F88bdzGuzfWzVWHgaDVa7zRLEn64fNR6H0ktgm6CsWT6mzfUGidEyighYn-7RBivaEX7dqYDEZ2AaTWSL-Hj1mn_tfj9iCQvodvNUOHrZcnhtITmaYf62Scw_kBhEJy2KYWcjnT2F7uV_Ke4VsA" />
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-xl flex items-center justify-center">
                <div className="absolute top-0 left-0 w-7 h-7 rounded-tl-xl border-t-2 border-l-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]"></div>
                <div className="absolute top-0 right-0 w-7 h-7 rounded-tr-xl border-t-2 border-r-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]"></div>
                <div className="absolute bottom-0 left-0 w-7 h-7 rounded-bl-xl border-b-2 border-l-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]"></div>
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-br-xl border-b-2 border-r-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]"></div>
                <div className="w-full h-full rounded-xl bg-[#0b1326]/60 backdrop-blur-sm m-2 flex flex-col items-center justify-center p-4 text-center">
                  <span className="material-symbols-outlined text-cyan-400 text-[36px] animate-pulse">center_focus_strong</span>
                  <p className="text-[11px] font-semibold text-white mt-2">Hướng camera vào mã QR tại hội trường</p>
                </div>
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce shadow-[0_0_16px_rgba(34,211,238,0.9)]"></div>
              </div>
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#131b2e]/80 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] font-semibold text-white">Webcam sẵn sàng</span>
                </div>
              </div>
              <div className="absolute bottom-4 flex justify-center">
                <button onClick={onScanSuccess} className="px-4 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-cyan-400 text-[11px] font-semibold shadow-md transition-all flex items-center gap-1.5 border border-cyan-400/30">
                  <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                  Thử quét thành công
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div onClick={onScanSuccess} className="w-full aspect-video rounded-xl bg-[#0b1326] border-2 border-dashed border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-colors">
              <div className="w-14 h-14 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
              </div>
              <span className="text-base font-semibold text-white">Tải ảnh chụp mã QR</span>
              <p className="text-xs text-slate-400 mt-1">Hỗ trợ PNG, JPG, WEBP</p>
              <button className="mt-4 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs transition-colors">Chọn tệp từ thiết bị</button>
            </div>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="w-full aspect-video rounded-xl bg-[#0b1326] border border-slate-800/50 flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-sm flex flex-col gap-4">
                <div className="text-center">
                  <label className="text-base font-semibold text-white">Nhập Mã Check-in Dự Phòng</label>
                  <p className="text-xs text-slate-400 mt-1">Mã ký tự hiển thị cạnh mã QR</p>
                </div>
                <div className="relative">
                  <input className="w-full px-4 py-3 rounded-lg bg-[#131b2e] text-white text-lg tracking-widest text-center uppercase focus:outline-none focus:bg-slate-800 border border-slate-700 focus:border-indigo-500" placeholder="VD: W3EDU-8892" type="text" defaultValue="W3EDU-8892" />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 text-[20px]">vpn_key</span>
                </div>
                <button onClick={onScanSuccess} className="w-full py-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 shadow-md">
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  Xác Nhận Mã
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-[#131b2e] border border-slate-800 flex items-start gap-4">
        <span className="material-symbols-outlined text-cyan-400 text-[24px] mt-0.5">shield</span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">Bảo mật chống gian lận</span>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mỗi mã QR có chữ ký số động với thời gian hiệu lực 60 giây. Hệ thống tự động kiểm tra đối chiếu địa chỉ MAC, tọa độ GPS.
          </p>
        </div>
      </div>
    </div>
  );
}