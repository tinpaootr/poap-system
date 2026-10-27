"use client";

import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  ClubEvent,
  EventStatus,
  INITIAL_EVENTS,
} from "@/components/admin/types";
import CreateEventForm from "@/components/admin/CreateEventForm";
import LiveQrStage from "@/components/admin/LiveQrStage";
import EventTable from "@/components/admin/EventTable";

export default function AdminPage() {
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [activeEvent, setActiveEvent] = useState<ClubEvent>(INITIAL_EVENTS[0]);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);

  // Khi tạo sự kiện mới từ Form
  const handleCreateEvent = (newEvent: ClubEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    setActiveEvent(newEvent);
  };

  // Khi bấm chọn sự kiện để chiếu QR từ Bảng
  const handleSelectForQr = (event: ClubEvent, openModal: boolean) => {
    setActiveEvent(event);
    if (openModal) {
      setIsFullscreenModal(true);
    }
  };

  // Khi đổi trạng thái sự kiện (Sắp diễn ra -> Đang mở -> Đã kết thúc)
  const handleUpdateStatus = (eventId: string, newStatus: EventStatus) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus } : ev))
    );
    if (activeEvent.id === eventId) {
      setActiveEvent((prev) => ({ ...prev, status: newStatus }));
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0e17] text-slate-100 py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* TIÊU ĐỀ TRANG ADMIN */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Ban Tổ Chức • Quản Trị Điểm Danh On-Chain</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Quản Trị Sự Kiện & Cấp Phát Huy Hiệu
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Khởi tạo hội thảo, trình chiếu mã QR động chống gian lận và quản lý trạng thái tham dự.
            </p>
          </div>
        </div>

        {/* KHU VỰC 2 CỘT: BÊN TRÁI (FORM TẠO) + BÊN PHẢI (TRÌNH CHIẾU QR ĐỘNG) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-7">
            <CreateEventForm onCreateEvent={handleCreateEvent} />
          </div>
          <div className="xl:col-span-5">
            <LiveQrStage
              activeEvent={activeEvent}
              isFullscreen={isFullscreenModal}
              setIsFullscreen={setIsFullscreenModal}
            />
          </div>
        </div>

        {/* KHU VỰC BẢNG QUẢN LÝ DANH SÁCH SỰ KIỆN */}
        <EventTable
          events={events}
          activeEventId={activeEvent.id}
          onSelectForQr={handleSelectForQr}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </main>
  );
}