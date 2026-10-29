"use client";

import React, { useState } from "react";
import { Search, QrCode, Play, CheckCircle, StopCircle } from "lucide-react";
import { ClubEvent, EventStatus } from "./types";

interface EventTableProps {
  events: ClubEvent[];
  activeEventId: string;
  onSelectForQr: (event: ClubEvent, openModal: boolean) => void;
  onUpdateStatus: (eventId: string, newStatus: EventStatus) => void;
}

export default function EventTable({
  events,
  activeEventId,
  onSelectForQr,
  onUpdateStatus,
}: EventTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ? true : ev.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-[#131b2e] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
      {/* Header & Thanh tìm kiếm / Bộ lọc */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Bảng Quản Trị Danh Sách Sự Kiện
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Giám sát các đợt phát hành Soulbound Token và điều khiển trạng thái điểm danh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bộ lọc trạng thái */}
          <div className="flex items-center bg-[#0b1326] p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: "all", label: "Tất cả" },
              { id: "open", label: "Đang mở" },
              { id: "upcoming", label: "Sắp diễn ra" },
              { id: "closed", label: "Đã kết thúc" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  filterStatus === tab.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên sự kiện..."
              className="bg-[#0b1326] border border-slate-800 focus:border-indigo-500 text-white pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none w-56"
            />
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0b1326] text-slate-400 text-xs uppercase">
              <th className="py-3.5 px-4 rounded-l-xl">Tên Sự Kiện</th>
              <th className="py-3.5 px-4">Thời Gian</th>
              <th className="py-3.5 px-4">Số Lượng Đã Nhận</th>
              <th className="py-3.5 px-4">Trạng Thái</th>
              <th className="py-3.5 px-4 text-right rounded-r-xl">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-sm">
            {filteredEvents.map((ev) => {
              const isSelected = ev._id === activeEventId;
              return (
                <tr
                  key={ev._id}
                  className={`transition-colors ${
                    isSelected
                      ? "bg-indigo-500/10"
                      : "hover:bg-slate-800/40"
                  }`}
                >
                  {/* Cột 1: Ảnh Badge + Tên sự kiện */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                  <img
                    src={ev.ipfsImageHash?.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
                    alt={ev.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                      <div>
                        <p className="font-semibold text-white line-clamp-1">
                          {ev.name}
                        </p>
                        <span className="text-xs font-mono text-slate-400">
                          ID: {ev._id} • Contract: {ev.contractAddress}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Thời gian */}
                  <td className="py-4 px-4 whitespace-nowrap text-slate-300 text-xs">
                    {ev.time}
                  </td>

                  {/* Cột 3: Số lượng */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-semibold text-white">
                      {ev.currentAttendees}
                    </span>
                    <span className="text-slate-400">
                      {" "}
                      / {ev.maxAttendees} SV
                    </span>
                  </td>

                  {/* Cột 4: Nhãn Trạng thái */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {ev.status === "open" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Đang mở điểm danh
                      </span>
                    )}
                    {ev.status === "upcoming" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-medium border border-cyan-500/20">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        Sắp diễn ra
                      </span>
                    )}
                    {ev.status === "closed" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đã kết thúc
                      </span>
                    )}
                  </td>

                  {/* Cột 5: Nút thao tác */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {ev.status === "open" && (
                        <>
                          <button
                            onClick={() => onSelectForQr(ev, true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Trình chiếu</span>
                          </button>
                          <button
                            onClick={() => onUpdateStatus(ev._id, "closed")}
                            title="Kết thúc điểm danh"
                            className="p-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-lg transition"
                          >
                            <StopCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {ev.status === "upcoming" && (
                        <button
                          onClick={() => {
                            onUpdateStatus(ev._id, "open");
                            onSelectForQr({ ...ev, status: "open" }, false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Mở điểm danh</span>
                        </button>
                      )}

                      {ev.status === "closed" && (
                        <button
                          onClick={() => {
                            onUpdateStatus(ev._id, "open");
                            onSelectForQr({ ...ev, status: "open" }, false);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                        >
                          Mở lại QR
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}