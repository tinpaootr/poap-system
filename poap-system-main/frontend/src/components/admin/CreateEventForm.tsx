"use client";

import React, { useState } from "react";
import { CalendarPlus, Clock, Users, UploadCloud, CheckCircle2 } from "lucide-react";
import { ClubEvent } from "./types";

interface CreateEventFormProps {
  onCreateEvent: (newEvent: ClubEvent) => void;
}

const DEFAULT_BADGE_PREVIEW =
  "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400&auto=format&fit=crop&q=80";

export default function CreateEventForm({ onCreateEvent }: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [maxAttendees, setMaxAttendees] = useState<number>(150);
  const [description, setDescription] = useState("");
  const [badgePreview, setBadgePreview] = useState<string>(DEFAULT_BADGE_PREVIEW);
  const [fileName, setFileName] = useState<string>("Chưa chọn tệp (Đang dùng ảnh mẫu)");

  // Xử lý chọn file ảnh từ máy tính và tạo URL preview
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setBadgePreview(previewUrl);
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !datetime.trim()) return;

    const newEvent: ClubEvent = {
      id: `EVT-0${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      datetime: datetime.trim(),
      maxAttendees: Number(maxAttendees) || 100,
      currentAttendees: 0,
      description:
        description.trim() ||
        "Sinh viên tham dự và quét mã QR tại hội trường sẽ nhận 01 Soulbound Badge trên Sepolia.",
      badgeImage: badgePreview,
      status: "live", // Tạo xong kích hoạt mở điểm danh luôn
      contractAddress: `0x${Math.random().toString(16).substring(2, 6).toUpperCase()}...${Math.random()
        .toString(16)
        .substring(2, 6)
        .toUpperCase()}`,
    };

    onCreateEvent(newEvent);

    // Reset form
    setTitle("");
    setDatetime("");
    setMaxAttendees(150);
    setDescription("");
  };

  return (
    <div className="bg-[#131b2e] border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
      {/* Header Form */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Khởi Tạo Sự Kiện Mới</h2>
            <p className="text-xs text-slate-400">
              Đăng ký thông tin hội thảo và cấu hình huy hiệu Soulbound NFT
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          ERC-5192 Soulbound
        </span>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Tên sự kiện */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-200 flex items-center justify-between">
            <span>
              Tên hội thảo / Sự kiện <span className="text-rose-400">*</span>
            </span>
            <span className="text-xs text-slate-500">Tối đa 120 ký tự</span>
          </label>
          <input
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Hội thảo Ứng dụng Blockchain & Web3 2026"
            className="w-full bg-[#0b1326] border border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-500 text-sm rounded-xl px-4 py-3 focus:outline-none transition"
          />
        </div>

        {/* Thời gian & Số lượng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">
              Thời gian diễn ra <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center bg-[#0b1326] border border-slate-800 focus-within:border-indigo-500 rounded-xl px-3.5 py-2.5">
              <Clock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                required
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                placeholder="14:00 - 17:00, 30/10/2026"
                className="bg-transparent text-white placeholder:text-slate-500 text-sm w-full focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">
              Số lượng tham gia tối đa <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center bg-[#0b1326] border border-slate-800 focus-within:border-indigo-500 rounded-xl px-3.5 py-2.5">
              <Users className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="number"
                min={1}
                max={5000}
                required
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(Number(e.target.value))}
                className="bg-transparent text-white text-sm w-full focus:outline-none"
              />
              <span className="text-xs text-slate-400 ml-2 shrink-0">Sinh viên</span>
            </div>
          </div>
        </div>

        {/* Mô tả */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-200">Mô tả sự kiện</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả quyền lợi, điều kiện nhận chứng nhận NFT ngoại khóa..."
            className="w-full bg-[#0b1326] border border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-500 text-sm rounded-xl p-3.5 focus:outline-none transition resize-none"
          />
        </div>

        {/* Upload Hình ảnh Huy hiệu + Preview */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-200 flex items-center justify-between">
            <span>Hình ảnh Huy hiệu Soulbound (Badge Preview)</span>
            <span className="text-xs text-slate-400">PNG / JPG / SVG</span>
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#0b1326] border border-slate-800 rounded-xl">
            {/* Khung Preview Ảnh */}
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-900 border border-indigo-500/30 shrink-0 shadow-md relative group">
              <img
                src={badgePreview}
                alt="Badge Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-center text-indigo-300 py-0.5">
                Preview
              </div>
            </div>

            {/* Khung chọn file */}
            <label className="flex-1 w-full cursor-pointer">
              <div className="p-4 rounded-xl bg-[#131b2e] hover:bg-slate-800/70 transition border border-dashed border-indigo-500/40 flex flex-col items-center justify-center text-center">
                <UploadCloud className="w-6 h-6 text-indigo-400 mb-1" />
                <span className="text-sm font-semibold text-white">
                  Bấm để tải ảnh huy hiệu từ máy tính
                </span>
                <span className="text-xs text-slate-400 mt-0.5 truncate max-w-[260px]">
                  {fileName}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Nút Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 active:scale-95 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tạo Sự Kiện & Kích Hoạt QR</span>
          </button>
        </div>
      </form>
    </div>
  );
}