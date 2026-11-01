import React from 'react';

export default function CheckinHeader() {
  return (
    <section className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-[#131b2e]/80 backdrop-blur-xl p-8 rounded-xl shadow-xl border border-slate-800">
      <div className="flex flex-col gap-2 max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Cổng Điểm Danh Web3
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Giao Thức Soulbound Token
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Xác Thực Hiện Diện & Nhận Huy Hiệu SBT
        </h1>
        <p className="text-sm text-slate-400">
          Hoàn tất điểm danh sự kiện học thuật để nhận chứng chỉ số bất biến (Soulbound Token ERC-5192) lưu trực tiếp vào hồ sơ sinh viên on-chain.
        </p>
      </div>
      
      <div className="w-full lg:w-auto flex items-center gap-4 p-4 bg-[#0b1326] border border-slate-800 rounded-xl shadow-md min-w-[340px]">
        <div className="relative">
          <img className="w-14 h-14 rounded-full object-cover shadow-sm" alt="Portrait" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnT-qT4rQiqUDIvDlnQ3UUJXJmwYaHHpw0UQUPdN7wNdDjQkHkBmMPu9bwE8Iwxdo9keSNCAgKHw8MoMVk2rwsYY2i1UAHYv0VK8KhgHrgQ9d0HgFwNpr0Zb7x0NoSsR0Ivr2JSxV9askdzkm5Vch0WzKIMtLzzeKd22o292BJzQdkGAaCl5RTwljhD6kHlygEpoLEjcHSpnU5G2NKJKc_ikt1jYZ6TviGds0qXONAPAW4lm0_v9o4xA" />
          <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-semibold text-white truncate">Nguyễn Thu Trang</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 text-[11px] font-semibold uppercase">K21 CNTT</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">MSSV: 21120456</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-[11px] text-cyan-400 font-mono tracking-wider">0x71C834...4e89</span>
            <span className="text-[11px] text-slate-500">(Sepolia)</span>
          </div>
        </div>
      </div>
    </section>
  );
}