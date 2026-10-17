'use client';

import Link from 'next/link';
import { Calendar, QrCode, Award } from 'lucide-react';
import { ConnectWalletButton } from './components/ConnectWalletButton';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 p-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Award className="h-8 w-8 text-indigo-500" />
          <span className="font-bold text-xl tracking-wide">Club POAP</span>
        </div>
        <ConnectWalletButton />
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Hệ thống Điểm danh & Cấp Chứng nhận NFT
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Lưu giữ minh chứng tham gia các hội thảo, seminar học thuật vĩnh viễn trên Blockchain dưới dạng Soulbound Badge.
        </p>

        {/* 3 Lựa chọn điều hướng */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 text-left">
          <Link href="/admin" className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500 transition">
            <Calendar className="h-8 w-8 text-indigo-400 mb-4" />
            <h3 className="font-bold text-xl mb-2">Ban Tổ Chức (Admin)</h3>
            <p className="text-slate-400 text-sm">Tạo sự kiện, upload hình ảnh huy hiệu và xuất mã QR điểm danh động.</p>
          </Link>

          <Link href="/claim/demo-event" className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500 transition">
            <QrCode className="h-8 w-8 text-purple-400 mb-4" />
            <h3 className="font-bold text-xl mb-2">Sinh Viên Điểm Danh</h3>
            <p className="text-slate-400 text-sm">Quét mã QR tại hội thảo, kết nối MetaMask để nhận huy hiệu NFT.</p>
          </Link>

          <Link href="/profile" className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500 transition">
            <Award className="h-8 w-8 text-pink-400 mb-4" />
            <h3 className="font-bold text-xl mb-2">Bộ Sưu Tập Cá Nhân</h3>
            <p className="text-slate-400 text-sm">Xem lại toàn bộ các huy hiệu chứng nhận ngoại khóa đã tích lũy.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}