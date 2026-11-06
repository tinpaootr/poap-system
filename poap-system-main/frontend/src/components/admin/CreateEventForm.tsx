"use client";

import React, { useState } from "react";
import {
  CalendarPlus,
  Clock,
  Users,
  UploadCloud,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { useWriteContract } from "wagmi";
import contractABI from "@/lib/contractABI.json";
import { ClubEvent } from "./types";

interface CreateEventFormProps {
  onCreateEvent: (newEvent: ClubEvent) => void;
}

const DEFAULT_BADGE_PREVIEW =
  "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400&auto=format&fit=crop&q=80";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const ORGANIZER_OPTIONS = [
  "Khoa CNTT",
  "CLB Tin Học",
  "Đoàn Thanh Niên",
  "Hội Sinh Viên",
];

export default function CreateEventForm({ onCreateEvent }: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("Khoa CNTT");
  const [datetime, setDatetime] = useState("");
  const [maxAttendees, setMaxAttendees] = useState<number | "">(150);
  const [refreshInterval, setRefreshInterval] = useState<number>(30);

  const [badgePreview, setBadgePreview] = useState<string>(DEFAULT_BADGE_PREVIEW);
  const [fileName, setFileName] = useState<string>("Chưa chọn tệp (Đang dùng ảnh mẫu)");
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const { writeContractAsync, isPending } = useWriteContract();
  const isBusy = isPending || Boolean(statusMessage);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setBadgePreview(URL.createObjectURL(selectedFile));
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !datetime.trim() || !file) {
      alert("Vui lòng nhập đủ thông tin và chọn ảnh huy hiệu!");
      return;
    }

    const formData = new FormData();
    formData.append("name", title.trim());
    formData.append("organizer", organizer);
    formData.append("time", datetime.trim());
    formData.append("capacity", maxAttendees.toString());
    formData.append("refreshInterval", refreshInterval.toString());
    formData.append("badgeImage", file);

    try {
      setStatusMessage("Đang tải ảnh lên IPFS & lưu Database...");
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newEvent = data.event;

        try {
          if (!CONTRACT_ADDRESS)
            throw new Error("Thiếu địa chỉ CONTRACT_ADDRESS trong .env.local");

          setStatusMessage("Vui lòng xác nhận giao dịch trong ví MetaMask...");
          const txHash = await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: contractABI,
            functionName: "createEvent",
            args: [newEvent._id, BigInt(newEvent.capacity)],
          });

          console.log("Giao dịch On-chain:", txHash);
        } catch (err: any) {
          console.error("Lỗi ký On-chain:", err);
          alert(
            "Sự kiện đã được lưu vào Database nhưng chưa ghi lên Blockchain (do hủy ký hoặc lỗi mạng Sepolia)."
          );
        }

        onCreateEvent(newEvent);

        setTitle("");
        setOrganizer("Khoa CNTT");
        setDatetime("");
        setMaxAttendees(150);
        setRefreshInterval(30);
        setBadgePreview(DEFAULT_BADGE_PREVIEW);
        setFile(null);
        setFileName("Chưa chọn tệp (Đang dùng ảnh mẫu)");
      } else {
        const err = await res.json();
        alert("Lỗi server: " + err.error);
      }
    } catch (error) {
      console.error("Lỗi ngoại lệ:", error);
      alert("Không thể kết nối đến server backend!");
    } finally {
      setStatusMessage("");
    }
  };

  return (
    <div className="bg-[#131b2e] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Khởi Tạo Sự Kiện Mới</h2>
            <p className="text-xs text-slate-400">
              Đăng ký thông tin hội thảo và cấu hình huy hiệu
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          ERC-5192 Soulbound
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">
              Tên hội thảo / Sự kiện <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="VD: Hội thảo AI & Ứng dụng Web3 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isBusy}
              className="w-full bg-[#0b1326] border border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-500 text-sm rounded-xl px-4 py-3 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-4 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">
              Đơn vị tổ chức <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center bg-[#0b1326] border border-slate-800 rounded-xl px-3.5 py-3">
              <Building2 className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <select
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                disabled={isBusy}
                className="bg-[#0b1326] text-white text-sm w-full focus:outline-none disabled:opacity-50"
              >
                {ORGANIZER_OPTIONS.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">
              Thời gian diễn ra <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center bg-[#0b1326] border border-slate-800 rounded-xl px-3.5 py-2.5">
              <Clock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="datetime-local"
                required
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                disabled={isBusy}
                className="bg-transparent text-white text-sm w-full focus:outline-none [color-scheme:dark] disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">
              Số lượng sinh viên <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center bg-[#0b1326] border border-slate-800 rounded-xl px-3.5 py-2.5">
              <Users className="w-4 h-4 text-slate-400 mr-2.5" />
              <input
                type="number"
                min={1}
                required
                value={maxAttendees}
                onChange={(e) =>
                  setMaxAttendees(e.target.value === "" ? "" : Number(e.target.value))
                }
                disabled={isBusy}
                className="bg-transparent text-white text-sm w-full focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">
              Đổi mã QR sau <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center bg-[#0b1326] border border-slate-800 rounded-xl px-3.5 py-2.5">
              <Clock className="w-4 h-4 text-slate-400 mr-2.5" />
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                disabled={isBusy}
                className="bg-[#0b1326] text-white text-sm w-full focus:outline-none disabled:opacity-50"
              >
                <option value={30}>30 Giây</option>
                <option value={45}>45 Giây</option>
                <option value={60}>60 Giây (1 Phút)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-200">Hình ảnh Huy hiệu</label>
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#0b1326] border border-slate-800 rounded-xl">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-900 border border-indigo-500/30 shrink-0 relative">
              <img src={badgePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <label className="flex-1 w-full cursor-pointer min-w-0">
              <div
                className={`w-full p-4 rounded-xl bg-[#131b2e] hover:bg-slate-800/70 transition border border-dashed border-indigo-500/40 flex flex-col items-center justify-center overflow-hidden text-center ${
                  isBusy ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <UploadCloud className="w-6 h-6 text-indigo-400 mb-1 shrink-0" />
                <span className="text-sm font-semibold text-white">
                  Bấm để tải ảnh huy hiệu (Bắt buộc)
                </span>
                <span
                  className="text-xs text-slate-400 mt-1 truncate max-w-full px-2"
                  title={fileName}
                >
                  {fileName}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isBusy}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isBusy}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition ${
              isBusy ? "bg-slate-700 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {isBusy ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  progress_activity
                </span>
                <span>{statusMessage || "Đang xử lý Blockchain..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Tạo Sự Kiện & Kích Hoạt QR</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}