"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Copy,
  Check,
  Maximize2,
  X,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ClubEvent } from "./types";

interface LiveQrStageProps {
  activeEvent: ClubEvent;
  isFullscreen: boolean;
  setIsFullscreen: (val: boolean) => void;
}

const MAX_TIME = 20; // Tự động đổi mã QR mỗi 20 giây

export default function LiveQrStage({
  activeEvent,
  isFullscreen,
  setIsFullscreen,
}: LiveQrStageProps) {
  const [timeLeft, setTimeLeft] = useState<number>(MAX_TIME);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [dynamicToken, setDynamicToken] = useState<string>("889201");
  const [fallbackCode, setFallbackCode] = useState<string>("#POAP-8892");
  const [copied, setCopied] = useState<boolean>(false);
  const [originUrl, setOriginUrl] = useState<string>("http://localhost:3000");

  // Lấy domain hiện tại (localhost:3000 hoặc link devtunnels)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // Hàm sinh mã Token mới và Mã nhập tay dự phòng mới
  const generateNewQrToken = useCallback(() => {
    const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
    setDynamicToken(randomNum);
    setFallbackCode(`#POAP-${randomNum.substring(0, 4)}`);
    setTimeLeft(MAX_TIME);
  }, []);

  // Đổi mã ngay khi chuyển sang sự kiện khác
  useEffect(() => {
    generateNewQrToken();
  }, [activeEvent.id, generateNewQrToken]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (isPaused || activeEvent.status !== "live") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateNewQrToken();
          return MAX_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, activeEvent.status, generateNewQrToken]);

  // Chuỗi URL thực tế nằm trong mã QR để Người 2 (Check-in) quét
  const qrValue = `${originUrl}/checkin?eventId=${encodeURIComponent(
    activeEvent.id
  )}&token=${dynamicToken}&code=${encodeURIComponent(fallbackCode)}`;

  const progressPercent = (timeLeft / MAX_TIME) * 100;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fallbackCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* KHUNG TRÌNH CHIẾU BÊN PHẢI */}
      <div className="bg-[#131b2e] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between h-full">
        {/* Thanh trạng thái trên cùng */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-bold text-white text-base">
                Trình Chiếu Mã QR Động
              </span>
            </div>

            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Phóng to Máy chiếu</span>
            </button>
          </div>

          {/* Tên sự kiện đang chiếu */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-indigo-400">
                Mã SK: {activeEvent.id}
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                ● Đang mở điểm danh
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 line-clamp-1">
              {activeEvent.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mã QR tự động đổi mỗi {MAX_TIME}s chống chụp màn hình gửi ra ngoài.
            </p>
          </div>
        </div>

        {/* Khung chứa Mã QR Động */}
        <div className="my-4 p-6 rounded-2xl bg-[#070c18] border border-slate-800/80 flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-2xl shadow-2xl relative">
            <QRCodeSVG
              value={qrValue}
              size={210}
              level="H"
              includeMargin={false}
              fgColor="#0b1326"
            />
            {isPaused && (
              <div className="absolute inset-0 bg-slate-950/85 rounded-2xl flex flex-col items-center justify-center text-white p-4 text-center">
                <PauseCircle className="w-10 h-10 text-amber-400 mb-2" />
                <span className="text-sm font-bold">Đã tạm dừng cấp mã</span>
              </div>
            )}
          </div>

          {/* Thanh đếm ngược thời gian */}
          <div className="w-full max-w-xs mt-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Tự động đổi mã sau:</span>
              <span className="text-cyan-400 font-bold text-sm">
                {isPaused ? "Tạm dừng" : `${timeLeft} giây`}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mã dự phòng nhập tay + Nút điều khiển */}
        <div className="flex flex-col gap-3">
          <div className="p-3.5 rounded-xl bg-[#0b1326] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">
                MÃ DỰ PHÒNG (NHẬP TAY):
              </span>
              <span className="text-lg font-mono font-bold text-indigo-400 tracking-wider">
                {fallbackCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              {isPaused ? (
                <>
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  <span>Tiếp Tục Chiếu</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-4 h-4 text-rose-400" />
                  <span>Tạm Dừng Cấp Mã</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={generateNewQrToken}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Đổi Mã Ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL PHÓNG TO TOÀN MÀN HÌNH (DÀNH CHO MÁY CHIẾU HỘI TRƯỜNG) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#070c18]/98 backdrop-blur-2xl flex flex-col justify-between p-6 md:p-10">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                TRỰC TIẾP TRÊN MÁY CHIẾU HỘI TRƯỜNG
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white">
                {activeEvent.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={generateNewQrToken}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-sm font-semibold transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Đổi Mã Ngay</span>
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-sm font-semibold transition"
              >
                <X className="w-5 h-5" />
                <span>Thu nhỏ</span>
              </button>
            </div>
          </div>

          {/* Center Mega QR */}
          <div className="flex flex-col items-center justify-center my-auto py-4">
            <div className="p-8 bg-white rounded-3xl shadow-2xl flex flex-col items-center">
              <QRCodeSVG
                value={qrValue}
                size={320}
                level="H"
                includeMargin={false}
                fgColor="#0b1326"
              />
              <div className="mt-4 flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Chứng Chỉ Soulbound Token (Sepolia Testnet)</span>
              </div>
            </div>

            {/* Countdown & Fallback Code */}
            <div className="w-full max-w-md mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full text-base">
                <span className="text-slate-300">Mã QR tự động làm mới sau:</span>
                <span className="text-cyan-400 font-bold text-2xl">
                  {timeLeft} giây
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="mt-3 px-8 py-3 rounded-2xl bg-slate-900 border border-slate-700 flex items-center gap-4">
                <span className="text-sm text-slate-400">MÃ NHẬP TAY DỰ PHÒNG:</span>
                <span className="text-2xl font-mono font-bold text-emerald-400 tracking-widest">
                  {fallbackCode}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#131b2e] border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-white">
                Đã điểm danh: {activeEvent.currentAttendees} /{" "}
                {activeEvent.maxAttendees} sinh viên
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Smart Contract: {activeEvent.contractAddress} (Sepolia)
            </div>
          </div>
        </div>
      )}
    </>
  );
}