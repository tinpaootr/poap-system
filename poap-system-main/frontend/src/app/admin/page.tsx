"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, AlertOctagon, Wallet } from "lucide-react";
import { useAccount, useConnect } from "wagmi"; // THÊM THƯ VIỆN WAGMI ĐỂ KIỂM TRA VÍ
import { metaMask } from "wagmi/connectors"; // Để gọi nút kết nối ví

import { ClubEvent, EventStatus } from "@/components/admin/types";
import CreateEventForm from "@/components/admin/CreateEventForm";
import LiveQrStage from "@/components/admin/LiveQrStage";
import EventTable from "@/components/admin/EventTable";

// ==========================================
// 🚨 CẤU HÌNH DANH SÁCH VÍ BAN TỔ CHỨC (ADMIN)
// ==========================================
// BÀ HÃY COPY ĐỊA CHỈ VÍ METAMASK CỦA BÀ VÀO ĐÂY NHÉ (Nhớ viết thường toàn bộ chữ cái để dễ so sánh)
const ADMIN_WALLETS = [
  "0x4da3b2e88A9930907b1F94922b648EE289235656", // Ví Tuyen
  "0xfaa155cd28f66c84eb186dac13faf8c095cf1fd9", // Ví Tram
].map((addr) => addr.toLowerCase());

export default function AdminPage() {
  // 1. Hook của Wagmi để lấy thông tin ví đang kết nối
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<ClubEvent | null>(null);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);

  // Fix lỗi Hydration của Next.js khi dùng Wagmi
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. G i API lấy danh s ch khi load trang
  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/events");
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) setActiveEvent(data[0]);
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  useEffect(() => {
    if (mounted && isConnected) {
      fetchEvents();
    }
  }, [mounted, isConnected]);

  const handleCreateEvent = (newEvent: ClubEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    setActiveEvent(newEvent);
  };

  const handleSelectForQr = (event: ClubEvent, openModal: boolean) => {
    setActiveEvent(event);
    if (openModal) setIsFullscreenModal(true);
  };

  const handleUpdateStatus = async (eventId: string, newStatus: EventStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((ev) => (ev._id === eventId ? { ...ev, status: newStatus } : ev))
        );
        if (activeEvent?._id === eventId) {
          setActiveEvent((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
    }
  };

  // ==========================================
  // 🛡️ LỚP BẢO VỆ 1: CHƯA KẾT NỐI VÍ
  // ==========================================
  if (!mounted) return null; // Đợi render xong UI để tránh lỗi

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0b0e17] flex items-center justify-center p-4">
        <div className="bg-[#131b2e] border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Khu Vực Bị Khóa</h1>
          <p className="text-slate-400 text-sm mb-6">
            Bạn cần kết nối ví MetaMask có thẩm quyền của Ban Tổ Chức để truy cập phân hệ quản trị.
          </p>
          <button
            onClick={() => connect({ connector: metaMask() })}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-semibold transition"
          >
            <Wallet className="w-5 h-5" />
            Kết Nối Ví MetaMask
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // 🛡️ LỚP BẢO VỆ 2: VÍ KHÔNG PHẢI LÀ ADMIN
  // ==========================================
  const isAdmin = address && ADMIN_WALLETS.includes(address.toLowerCase());

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#0b0e17] flex items-center justify-center p-4">
        <div className="bg-[#131b2e] border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Truy Cập Bị Từ Chối</h1>
          <p className="text-slate-400 text-sm mb-4">
            Địa chỉ ví hiện tại của bạn không có quyền Ban Tổ Chức. Phân hệ này chỉ dành riêng cho Admin tạo mã QR điểm danh.
          </p>
          <div className="bg-[#0b1326] border border-slate-800 rounded-xl p-3 mb-6">
            <p className="text-xs text-slate-500 font-mono break-all">{address}</p>
          </div>
          <p className="text-xs text-indigo-400">
            Hãy đổi sang ví Admin trên MetaMask và tải lại trang.
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // ✅ RENDER GIAO DIỆN ADMIN CHÍNH THỨC
  // ==========================================
  return (
    <main className="min-h-screen bg-[#0b0e17] text-slate-100 py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Ban Tổ Chức • Quản Trị Điểm Danh On-Chain</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Quản Trị Sự Kiện & Cấp Phát Huy Hiệu
            </h1>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-7">
            <CreateEventForm onCreateEvent={handleCreateEvent} />
          </div>
          <div className="xl:col-span-5">
            {activeEvent && (
              <LiveQrStage
                activeEvent={activeEvent}
                isFullscreen={isFullscreenModal}
                setIsFullscreen={setIsFullscreenModal}
              />
            )}
          </div>
        </div>
        
        <EventTable
          events={events}
          activeEventId={activeEvent?._id || ""}
          onSelectForQr={handleSelectForQr}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </main>
  );
}