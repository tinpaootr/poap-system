"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { ClubEvent, EventStatus } from "@/components/admin/types";
import CreateEventForm from "@/components/admin/CreateEventForm";
import LiveQrStage from "@/components/admin/LiveQrStage";
import EventTable from "@/components/admin/EventTable";

export default function AdminPage() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<ClubEvent | null>(null);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);

  // 1. Gọi API lấy danh sách khi load trang
  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/events");
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) setActiveEvent(data[0]);
    } catch (error) {
      console.error("Lỗi tải sự kiện:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 2. Nhận sự kiện mới từ Form tạo
  const handleCreateEvent = (newEvent: ClubEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    setActiveEvent(newEvent);
  };

  const handleSelectForQr = (event: ClubEvent, openModal: boolean) => {
    setActiveEvent(event);
    if (openModal) setIsFullscreenModal(true);
  };

  // 3. Gọi API cập nhật trạng thái
  const handleUpdateStatus = async (eventId: string, newStatus: EventStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        setEvents((prev) => prev.map((ev) => (ev._id === eventId ? { ...ev, status: newStatus } : ev)));
        if (activeEvent?._id === eventId) {
          setActiveEvent((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
    }
  };

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