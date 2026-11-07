"use client";

import React, { useState } from "react";
import {
  Search,
  QrCode,
  Play,
  CheckCircle,
  StopCircle,
  Users,
  X,
  Download,
  ExternalLink,
  Eye,
} from "lucide-react";
import { ClubEvent, EventStatus } from "./types";

interface EventTableProps {
  events: ClubEvent[];
  activeEventId: string;
  onSelectForQr: (event: ClubEvent, openModal: boolean) => void;
  onUpdateStatus: (eventId: string, newStatus: EventStatus) => void;
}

interface AttendeeRecord {
  _id: string;
  eventId: string;
  walletAddress: string;
  studentId: string;
  fullName: string;
  className?: string;
  claimedAt: string;
  txHash?: string;
}

const formatDateTime = (raw?: string) => {
  if (!raw) return "Chưa cập nhật";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function EventTable({
  events,
  activeEventId,
  onSelectForQr,
  onUpdateStatus,
}: EventTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [selectedEventForList, setSelectedEventForList] = useState<ClubEvent | null>(null);
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ? true : ev.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAttendeeModal = async (ev: ClubEvent) => {
    setSelectedEventForList(ev);
    setStudentSearch("");
    setLoadingAttendees(true);
    try {
      const res = await fetch(`http://localhost:5000/api/events/${ev._id}/attendees`);
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.attendees || []);
      } else {
        setAttendees([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách sinh viên:", error);
      setAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedEventForList || attendees.length === 0) return;

    const headers = [
      "STT",
      "MSSV",
      "Họ và Tên",
      "Lớp",
      "Địa chỉ Ví MetaMask",
      "Thời gian điểm danh",
      "Mã giao dịch (TxHash)",
    ];
    const rows = attendees.map((att, idx) => [
      idx + 1,
      `"${att.studentId}"`,
      `"${att.fullName}"`,
      `"${att.className || ""}"`,
      att.walletAddress,
      `"${new Date(att.claimedAt).toLocaleString("vi-VN")}"`,
      att.txHash || "",
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `DiemDanh_${selectedEventForList.name.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAttendees = attendees.filter(
    (a) =>
      a.studentId.toLowerCase().includes(studentSearch.toLowerCase()) ||
      a.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (a.className || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
      a.walletAddress.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <>
      <div className="bg-[#131b2e] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
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
                const isFull =
                  ev.capacity > 0 && (ev.currentAttendees ?? 0) >= ev.capacity;

                return (
                  <tr
                    key={ev._id}
                    className={`transition-colors ${
                      isSelected ? "bg-indigo-500/10" : "hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={ev.ipfsImageHash?.replace(
                            "ipfs://",
                            "https://gateway.pinata.cloud/ipfs/"
                          )}
                          alt={ev.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white line-clamp-1">
                              {ev.name}
                            </p>
                            {ev.organizer && (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[10px] font-medium shrink-0">
                                {ev.organizer}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            ID: {ev._id} • Contract:{" "}
                            {ev.contractAddress || "Chưa triển khai"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-300 text-xs">
                      {formatDateTime(ev.time)}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenAttendeeModal(ev)}
                        title="Bấm để xem danh sách sinh viên đã điểm danh"
                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-indigo-500/20 border border-slate-700/60 hover:border-indigo-500/40 transition cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-white group-hover:text-indigo-300">
                          {ev.currentAttendees ?? 0}
                        </span>
                        <span className="text-slate-400 text-xs">
                          / {ev.capacity} SV
                        </span>
                      </button>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {ev.status === "open" && !isFull && (
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
                      {(ev.status === "closed" || isFull) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          {isFull ? "Đã đủ số lượng" : "Đã kết thúc"}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {ev.status === "open" && !isFull && (
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

                        {(ev.status === "closed" || isFull) && (
                          isFull ? (
                            <button
                              onClick={() => onSelectForQr(ev, false)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Xem trạng thái</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onUpdateStatus(ev._id, "open");
                                onSelectForQr({ ...ev, status: "open" }, false);
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                            >
                              Mở lại QR
                            </button>
                          )
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

      {selectedEventForList && (
        <div
          onClick={(e) =>
            e.target === e.currentTarget && setSelectedEventForList(null)
          }
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#131b2e] border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Danh Sách Sinh Viên Đã Điểm Danh
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedEventForList.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tổng cộng:{" "}
                  <span className="text-emerald-400 font-semibold">
                    {attendees.length}
                  </span>{" "}
                  / {selectedEventForList.capacity} sinh viên
                </p>
              </div>

              <div className="flex items-center gap-2">
                {attendees.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất CSV (Excel)</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedEventForList(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-[#0b1326]/60 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Tìm theo MSSV, Họ tên, Lớp hoặc địa chỉ ví..."
                  className="w-full bg-[#131b2e] border border-slate-800 focus:border-indigo-500 text-white pl-9 pr-4 py-1.5 rounded-lg text-xs focus:outline-none"
                />
              </div>
              <span className="text-xs text-slate-400">
                Hiển thị {filteredAttendees.length} sinh viên
              </span>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingAttendees ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Đang tải danh sách sinh viên...
                </div>
              ) : filteredAttendees.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Chưa có sinh viên nào điểm danh hoặc không tìm thấy kết quả phù hợp.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0b1326] text-slate-400 uppercase">
                        <th className="py-3 px-3 rounded-l-lg">#</th>
                        <th className="py-3 px-3">MSSV</th>
                        <th className="py-3 px-3">Họ và Tên</th>
                        <th className="py-3 px-3">Lớp</th>
                        <th className="py-3 px-3">Địa chỉ Ví</th>
                        <th className="py-3 px-3">Thời gian</th>
                        <th className="py-3 px-3 text-right rounded-r-lg">
                          Giao dịch On-chain
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-slate-200">
                      {filteredAttendees.map((att, index) => {
                        const isRealTx =
                          att.txHash && /^0x[a-fA-F0-9]{64}$/.test(att.txHash);
                        return (
                          <tr key={att._id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-3 text-slate-500 font-mono">
                              {index + 1}
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-cyan-400">
                              {att.studentId}
                            </td>
                            <td className="py-3 px-3 font-medium text-white">
                              {att.fullName}
                            </td>
                            <td className="py-3 px-3 font-semibold text-amber-300">
                              {att.className || "—"}
                            </td>
                            <td className="py-3 px-3 font-mono text-indigo-300">
                              {att.walletAddress.slice(0, 6)}...
                              {att.walletAddress.slice(-4)}
                            </td>
                            <td className="py-3 px-3 text-slate-400">
                              {new Date(att.claimedAt).toLocaleString("vi-VN")}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isRealTx ? (
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${att.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-mono"
                                >
                                  <span>{att.txHash!.slice(0, 8)}...</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-500 font-mono">
                                  {att.txHash ? "Mock Tx" : "—"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}