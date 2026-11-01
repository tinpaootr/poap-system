'use client';
import React, { useEffect, useRef, useState } from 'react';

type ScanSuccessHandler = (eventId?: string, token?: string, data?: any) => void;

const CAMERA_ELEMENT_ID = 'qr-camera-reader';
const FILE_ELEMENT_ID = 'qr-file-reader';

/**
 * Tách eventId + token từ mọi kiểu dữ liệu sinh viên đưa vào:
 *  - Link trong QR: http://.../checkin?eventId=...&token=123456&code=...
 *  - Mã dự phòng:   "#POAP-123456"
 *  - Chỉ 6 số:      "123456"
 */
export function parseCheckinInput(raw: string): { eventId: string; token: string } {
  const text = (raw || '').trim();
  let eventId = '';
  let token = '';

  if (text.includes('token=')) {
    try {
      const url = new URL(text);
      eventId = url.searchParams.get('eventId') || '';
      token = (url.searchParams.get('token') || '').replace(/\D/g, '');
    } catch {
      // Không phải URL hợp lệ -> xử lý như mã thường
    }
  }

  if (!token) token = text.replace(/\D/g, '');
  return { eventId, token };
}

export default function ScannerPanel({ onScanSuccess }: { onScanSuccess: ScanSuccessHandler }) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');

  // ===== Nhập tay =====
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');

  // ===== Camera =====
  const cameraRef = useRef<any>(null); // instance Html5Qrcode
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  // ===== Tải ảnh =====
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Gửi kết quả lên page nếu hợp lệ, trả về thông báo lỗi nếu không
  const submitParsed = (raw: string): string | null => {
    const { eventId, token } = parseCheckinInput(raw);
    if (token.length !== 6) {
      return 'Mã không hợp lệ. Mã check-in phải có 6 chữ số (VD: #POAP-123456).';
    }
    onScanSuccess(eventId, token);
    return null;
  };

  // ---------- Nhập tay ----------
  const handleManualSubmit = () => {
    setManualError('');
    const err = submitParsed(manualCode);
    if (err) setManualError(err);
  };

  // ---------- Camera ----------
  const stopCamera = async () => {
    const qr = cameraRef.current;
    if (!qr) return;
    try {
      if (qr.isScanning) await qr.stop();
      qr.clear();
    } catch {
      // bỏ qua lỗi khi camera đã tắt sẵn
    }
    cameraRef.current = null;
    setCameraOn(false);
  };

  // Chọn camera mặc định: camera sau (điện thoại) > camera thật > camera đầu tiên
  // Tránh camera ảo (OBS Virtual Camera, ...) vì hay chỉ ra màn hình đen
  const pickDefaultCamera = (list: { id: string; label: string }[]) => {
    const back = list.find((c) => /back|rear|environment|sau/i.test(c.label));
    if (back) return back.id;
    const real = list.find((c) => !/virtual|obs|snap|manycam|droidcam/i.test(c.label));
    return (real || list[0]).id;
  };

  const startCamera = async (cameraIdOverride?: string) => {
    setCameraError('');
    try {
      // Import động để tránh lỗi SSR của Next.js
      const { Html5Qrcode } = await import('html5-qrcode');

      // Lấy danh sách camera (lần đầu sẽ hỏi quyền truy cập)
      let cameraId = cameraIdOverride || selectedCameraId;
      if (!cameraId) {
        const list = await Html5Qrcode.getCameras();
        if (!list.length) throw new Error('Không tìm thấy camera nào');
        setCameras(list);
        cameraId = pickDefaultCamera(list);
        setSelectedCameraId(cameraId);
        console.log('[camera] danh sách:', list, '-> dùng', cameraId);
      }

      const qr = new Html5Qrcode(CAMERA_ELEMENT_ID);
      cameraRef.current = qr;

      await qr.start(
        cameraId,
        { fps: 10, qrbox: { width: 230, height: 230 } },
        async (decodedText: string) => {
          const err = submitParsed(decodedText);
          if (err) {
            setCameraError('Mã QR này không phải mã điểm danh Club POAP.');
            return; // tiếp tục quét
          }
          await stopCamera();
        },
        () => {
          // lỗi từng khung hình (chưa thấy QR) -> bỏ qua
        }
      );
      setCameraOn(true);
    } catch (e: any) {
      // html5-qrcode thường ném ra CHUỖI chứ không phải Error -> gom hết thành text để đọc
      const raw = String(e?.name || '') + ' ' + String(e?.message || e || '');
      console.warn('[camera] lỗi:', raw); // warn để Next.js không bật overlay lỗi đỏ

      // Dọn instance hỏng
      try { cameraRef.current?.clear(); } catch {}
      cameraRef.current = null;
      setCameraOn(false);

      let msg = 'Không mở được camera. Hãy thử chọn camera khác, hoặc dùng "Tải Ảnh" / "Nhập Mã".';
      if (/NotReadable|Could not start|TrackStart/i.test(raw)) {
        msg = 'Camera đang bị ứng dụng/tab khác sử dụng (Zoom, Meet, OBS, Python/OpenCV, tab khác...). Hãy tắt chúng rồi thử lại.';
      } else if (/NotAllowed|Permission|denied/i.test(raw)) {
        msg = 'Bạn đã chặn quyền camera. Bấm biểu tượng ổ khóa cạnh thanh địa chỉ để cho phép lại, rồi tải lại trang.';
      } else if (/NotFound|not found|Không tìm thấy camera|OverconstrainedError/i.test(raw)) {
        msg = 'Không tìm thấy camera phù hợp. Hãy kiểm tra webcam đã cắm/bật chưa, hoặc chọn camera khác.';
        setSelectedCameraId(''); // lần sau lấy lại danh sách camera
      }
      setCameraError(`${msg}\n(Chi tiết: ${raw.trim()})`);
    }
  };

  // Đổi camera khi đang bật -> tắt rồi bật lại bằng camera mới
  const handleChangeCamera = async (id: string) => {
    setSelectedCameraId(id);
    if (cameraOn) {
      await stopCamera();
      await startCamera(id);
    }
  };

  // Tắt camera khi đổi tab hoặc rời trang
  useEffect(() => {
    if (activeTab !== 'camera') stopCamera();
  }, [activeTab]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ---------- Tải ảnh ----------
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng 1 file
    if (!file) return;

    setUploadError('');
    setUploading(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const qr = new Html5Qrcode(FILE_ELEMENT_ID);
      const decodedText = await qr.scanFile(file, false);
      qr.clear();

      const err = submitParsed(decodedText);
      if (err) setUploadError('Ảnh có mã QR nhưng không phải mã điểm danh Club POAP.');
    } catch (err) {
      console.error('Lỗi đọc ảnh QR:', err);
      setUploadError('Không tìm thấy mã QR trong ảnh. Hãy chụp rõ, đủ sáng và không bị cắt mất góc.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="lg:col-span-7 flex flex-col gap-6">
      <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-8 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quét Mã Điểm Danh</h2>
              <p className="text-xs text-slate-400">Chọn 1 trong 3 phương thức xác nhận</p>
            </div>
          </div>

          <div className="flex items-center p-1 bg-[#0b1326] border border-slate-800 rounded-xl gap-1 self-start sm:self-auto text-xs">
            <button
              onClick={() => setActiveTab('camera')}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${activeTab === 'camera' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              Camera
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Tải Ảnh
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${activeTab === 'manual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              <span className="material-symbols-outlined text-[18px]">pin</span>
              Nhập Mã
            </button>
          </div>
        </div>

        {/* ================= CAMERA ================= */}
        {activeTab === 'camera' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="relative w-full aspect-video rounded-xl bg-[#0b1326] border border-slate-800/50 overflow-hidden flex items-center justify-center shadow-inner">
              {/* html5-qrcode sẽ chèn <video> vào div này */}
              <div
                id={CAMERA_ELEMENT_ID}
                className="absolute inset-0 !w-full !h-full [&_video]:!w-full [&_video]:!h-full [&_video]:object-cover [&_video]:block"
              />

              {!cameraOn && (
                <div className="relative flex flex-col items-center justify-center p-4 text-center gap-3">
                  <span className="material-symbols-outlined text-cyan-400 text-[40px]">center_focus_strong</span>
                  <p className="text-sm font-semibold text-white">Hướng camera vào mã QR trên máy chiếu</p>
                  <button
                    onClick={() => startCamera()}
                    className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">videocam</span>
                    Bật camera
                  </button>
                </div>
              )}

              {cameraOn && (
                <>
                  <div className="absolute top-2 left-2 flex items-center gap-2 px-3 py-1 rounded-full bg-[#131b2e]/80 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] font-semibold text-white">Đang quét...</span>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="absolute bottom-3 px-4 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-rose-300 text-[11px] font-semibold shadow-md transition-all flex items-center gap-1.5 border border-rose-400/30">
                    <span className="material-symbols-outlined text-[14px]">videocam_off</span>
                    Tắt camera
                  </button>
                </>
              )}
            </div>
            {cameras.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 shrink-0">Camera:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleChangeCamera(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0b1326] border border-slate-700 text-white focus:outline-none focus:border-indigo-500">
                  {cameras.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {cameraError && <p className="text-xs text-rose-400 text-center whitespace-pre-line">{cameraError}</p>}
          </div>
        )}

        {/* ================= TẢI ẢNH ================= */}
        {activeTab === 'upload' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="w-full aspect-video rounded-xl bg-[#0b1326] border-2 border-dashed border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-colors">
              <div className="w-14 h-14 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center mb-2">
                <span className={`material-symbols-outlined text-[28px] ${uploading ? 'animate-spin' : ''}`}>
                  {uploading ? 'progress_activity' : 'cloud_upload'}
                </span>
              </div>
              <span className="text-base font-semibold text-white">
                {uploading ? 'Đang đọc mã QR...' : 'Tải ảnh chụp mã QR'}
              </span>
              <p className="text-xs text-slate-400 mt-1">Hỗ trợ PNG, JPG, WEBP</p>
              <span className="mt-4 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs transition-colors">
                Chọn tệp từ thiết bị
              </span>
            </div>
            {uploadError && <p className="text-xs text-rose-400 text-center">{uploadError}</p>}
            {/* div ẩn bắt buộc cho html5-qrcode khi quét file */}
            <div id={FILE_ELEMENT_ID} className="hidden" />
          </div>
        )}

        {/* ================= NHẬP MÃ ================= */}
        {activeTab === 'manual' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="w-full aspect-video rounded-xl bg-[#0b1326] border border-slate-800/50 flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-sm flex flex-col gap-4">
                <div className="text-center">
                  <label className="text-base font-semibold text-white">Nhập Mã Check-in Dự Phòng</label>
                  <p className="text-xs text-slate-400 mt-1">Mã ký tự hiển thị cạnh mã QR</p>
                </div>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 rounded-lg bg-[#131b2e] text-white text-lg tracking-widest text-center uppercase focus:outline-none focus:bg-slate-800 border border-slate-700 focus:border-indigo-500"
                    placeholder="VD: #POAP-123456"
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 text-[20px]">vpn_key</span>
                </div>
                {manualError && <p className="text-xs text-rose-400 text-center">{manualError}</p>}
                <button onClick={handleManualSubmit} className="w-full py-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 shadow-md">
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  Xác Nhận Mã
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-[#131b2e] border border-slate-800 flex items-start gap-4">
        <span className="material-symbols-outlined text-cyan-400 text-[24px] mt-0.5">shield</span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">Bảo mật chống gian lận</span>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mỗi mã QR có chữ ký số động và chỉ có hiệu lực trong thời gian ngắn. Mỗi ví và mỗi MSSV chỉ được nhận 1 huy hiệu cho mỗi sự kiện.
          </p>
        </div>
      </div>
    </div>
  );
}