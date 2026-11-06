"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, AlertOctagon, Wallet, QrCode } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { ClubEvent, EventStatus } from "@/components/admin/types";
import CreateEventForm from "@/components/admin/CreateEventForm";
import LiveQrStage from "@/components/admin/LiveQrStage";
import EventTable from "@/components/admin/EventTable";

const ADMIN_WALLETS = [
  "0x4da3b2e88A9930907b1F94922b648EE289235656", // Ví Tuyen
  "0xfaa155cd28f66c84eb186dac13faf8c095cf1fd9", // Ví Tram
].map((addr) => addr.toLowerCase());

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  // Mặc định là null: Mới vào trang chưa chọn sự kiện nào thì không hiện QR cũ
  const [activeEvent, setActiveEvent] = useState<ClubEvent | null>(null);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/events");
      const data = await res.json();
      setEvents(data);

      // Chỉ cập nhật dữ liệu mới cho sự kiện ĐANG ĐƯỢC CHỌN (nếu có)
      setActiveEvent((prev) => {
        if (!prev) return null;
        const updated = data.find((e: ClubEvent) => e._id === prev._id);
        return updated || prev;
      });
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  useEffect(() => {
    if (mounted && isConnected) {
      fetchEvents();
      const interval = setInterval(fetchEvents, 3000);
      return () => clearInterval(interval);
    }
  }, [mounted, isConnected]);

  const handleCreateEvent = (newEvent: ClubEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    setActiveEvent(newEvent); // Tạo xong thì hiển thị sự kiện vừa tạo bên khung phải
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
        const updatedEvent = await res.json();
        setEvents((prev) =>
          prev.map((ev) => (ev._id === eventId ? updatedEvent : ev))
        );
        if (activeEvent?._id === eventId) {
          setActiveEvent(updatedEvent);
        }
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
    }
  };

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0b0e17] flex items-center justify-center p-4">
        <div className="bg-[#131b2e] border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Khu Vực Đã Khóa</h1>
          <p className="text-slate-400 text-sm mb-6">
            Bạn cần kết nối ví MetaMask có thẩm quyền của Ban Tổ Chức để truy cập phần quản trị.
          </p>
          <button
            onClick={() => connect({ connector: metaMask() })}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-semibold transition"
          >
            <Wallet className="w-5 h-5" />
            Kết Nối MetaMask
          </button>
        </div>
      </main>
    );
  }

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
            Địa chỉ ví của bạn không có quyền Ban Tổ Chức. Phân hệ này chỉ dành riêng cho Admin tạo mã QR điểm danh.
          </p>
          <div className="bg-[#0b1326] border border-slate-800 rounded-xl p-3 mb-6">
            <p className="text-xs text-slate-500 font-mono break-all">{address}</p>
          </div>
          <p className="text-xs text-indigo-400">
            Hãy chuyển đổi sang ví Admin trên MetaMask và tải lại trang.
          </p>
        </div>
      </main>
    );
  }

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
            {activeEvent ? (
              <LiveQrStage
                activeEvent={activeEvent}
                isFullscreen={isFullscreenModal}
                setIsFullscreen={setIsFullscreenModal}
                onCloseStage={() => setActiveEvent(null)}
              />
            ) : (
              /* Trạng thái chờ thân thiện khi mới vào trang (chưa chọn sự kiện nào) */
              <div className="bg-[#131b2e] border border-slate-800/80 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center text-center h-full min-h-[460px]">
                <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 shadow-inner">
                  <QrCode className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Sân Khấu Mã QR Đang Chờ
                </h3>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  Hãy khởi tạo một sự kiện mới ở biểu mẫu bên trái, hoặc bấm vào một sự kiện trong bảng bên dưới để kiểm tra trạng thái & trình chiếu mã QR.
                </p>
                <div className="mt-6 px-4 py-2 rounded-full bg-[#0b1326] border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Tự động khóa khi đủ số lượng sinh viên</span>
                </div>
              </div>
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