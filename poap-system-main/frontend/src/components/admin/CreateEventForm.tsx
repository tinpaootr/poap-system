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
  const [maxAttendees, setMaxAttendees] = useState<number | "">(150);
  const [description, setDescription] = useState("");
  
  const [badgePreview, setBadgePreview] = useState<string>(DEFAULT_BADGE_PREVIEW);
  const [fileName, setFileName] = useState<string>("Chưa chọn tệp (Đang dùng ảnh mẫu)");
  const [file, setFile] = useState<File | null>(null); 

  // Hàm duy nhất xử lý chọn ảnh
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
    formData.append("time", datetime.trim());
    formData.append("capacity", maxAttendees.toString());
    formData.append("badgeImage", file); 

    try {
      alert("Đang tải ảnh lên IPFS và tạo sự kiện...");
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onCreateEvent(data.event); 
        
        setTitle("");
        setDatetime("");
        setMaxAttendees(150);
        setBadgePreview(DEFAULT_BADGE_PREVIEW);
        setFile(null);
        setFileName("Chưa chọn tệp (Đang dùng ảnh mẫu)");
        alert("Tạo sự kiện thành công!");
      } else {
        const err = await res.json();
        alert("Lỗi: " + err.error);
      }
    } catch (error) {
      console.error("Lỗi:", error);
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
            <p className="text-xs text-slate-400">Đăng ký thông tin hội thảo và cấu hình huy hiệu</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">ERC-5192 Soulbound</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-200">Tên hội thảo / Sự kiện <span className="text-rose-400">*</span></label>
          <input
            type="text" required maxLength={120} value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#0b1326] border border-slate-800 focus:border-indigo-500 text-white text-sm rounded-xl px-4 py-3 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-slate-200">Thời gian diễn ra <span className="text-rose-400">*</span></label>
  <div className="flex items-center bg-[#0b1326] border border-slate-800 rounded-xl px-3.5 py-2.5">
    <Clock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
    <input 
      type="datetime-local" 
      required 
      value={datetime} 
      onChange={(e) => setDatetime(e.target.value)} 
      className="bg-transparent text-white text-sm w-full focus:outline-none [color-scheme:dark]" 
    />
  </div>
</div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">Số lượng sinh viên <span className="text-rose-400">*</span></label>
            <div className="flex items-center bg-[#0b1326] border border-slate-800 rounded-xl px-3.5 py-2.5">
              <Users className="w-4 h-4 text-slate-400 mr-2.5" />
              <input type="number" min={1} required value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value === "" ? "" : Number(e.target.value))}
              className="bg-transparent text-white text-sm w-full focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-200">Hình ảnh Huy hiệu</label>
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#0b1326] border border-slate-800 rounded-xl">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-900 border border-indigo-500/30 shrink-0 relative">
              <img src={badgePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <label className="flex-1 w-full cursor-pointer">
              <div className="p-4 rounded-xl bg-[#131b2e] hover:bg-slate-800/70 transition border border-dashed border-indigo-500/40 flex flex-col items-center justify-center">
                <UploadCloud className="w-6 h-6 text-indigo-400 mb-1" />
                <span className="text-sm font-semibold text-white">Bấm để tải ảnh huy hiệu (Bắt buộc)</span>
                <span className="text-xs text-slate-400 mt-1">{fileName}</span>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tạo Sự Kiện & Kích Hoạt QR</span>
          </button>
        </div>
      </form>
    </div>
  );
}