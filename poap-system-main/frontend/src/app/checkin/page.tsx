'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import ScannerPanel from '@/components/checkin/ScannerPanel';
import EventDetailsPanel from '@/components/checkin/EventDetailsPanel';

export default function CheckinPage() {
  const [isScanned, setIsScanned] = useState(false);
  const [mintState, setMintState] = useState<'idle' | 'processing' | 'success'>('idle');

  // State lưu dữ liệu thực tế từ mã QR / mã dự phòng
  const [scannedEventId, setScannedEventId] = useState('');
  const [scannedToken, setScannedToken] = useState('');
  const [eventData, setEventData] = useState<any>(null);

  // Trạng thái tải thông tin sự kiện sau khi quét
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [scanError, setScanError] = useState('');

  // Nhận dữ liệu truyền lên từ ScannerPanel (camera / tải ảnh / nhập mã)
  // -> hỏi backend mã có hợp lệ không + lấy thông tin sự kiện thật để hiển thị
  const handleScanSuccess = async (eventId?: string, token?: string) => {
    if (!token) return; // không có mã thật thì bỏ qua

    setIsScanned(false);
    setMintState('idle');
    setEventData(null);
    setScanError('');
    setLoadingEvent(true);

    try {
      const res = await axios.post('http://localhost:5000/api/events/student-preview', {
        eventId: eventId || null, // rỗng -> backend tự dò sự kiện đang mở
        qrToken: token
      });
      const event = res.data?.event;
      setScannedEventId(String(event?._id || eventId || ''));
      setScannedToken(token);
      setEventData(event || null);
      setIsScanned(true);
    } catch (error: any) {
      const msg = axios.isAxiosError(error) && error.response
        ? error.response.data?.error || 'Mã check-in không hợp lệ.'
        : 'Không kết nối được server (localhost:5000). Backend đã chạy chưa?';
      console.warn('[checkin] preview lỗi:', error); // warn để Next.js không bật overlay đỏ
      setScanError(msg);
    } finally {
      setLoadingEvent(false);
    }
  };

  // Sinh viên quét QR bằng camera mặc định của điện thoại
  // -> trình duyệt mở thẳng /checkin?eventId=...&token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = (params.get('token') || '').replace(/\D/g, '');
    if (token.length === 6) {
      handleScanSuccess(params.get('eventId') || '', token);
      // Xóa query khỏi thanh địa chỉ để F5 không dùng lại mã cũ
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backend xác thực OK -> bật hiệu ứng "Đang ký giao dịch"
  const handleMintProcess = () => {
    setMintState('processing');
  };

  // Ghi nhận thành công -> hiện thẻ "Điểm Danh Thành Công!"
  const handleMintSuccess = (data?: any) => {
    if (data) setEventData((prev: any) => ({ ...(prev || {}), ...data }));
    setMintState('success');
  };

  // Có lỗi -> quay về trạng thái ban đầu để bấm lại được
  const handleMintError = () => {
    setMintState('idle');
  };

  return (
    <div className="w-full pt-20 bg-[#0b1326] min-h-screen text-white">
      <div className="flex flex-col w-full bg-[#0b1326]">
        <div className="relative w-full overflow-hidden bg-[#0b1326]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
              <ScannerPanel onScanSuccess={handleScanSuccess} />
              <EventDetailsPanel
                isScanned={isScanned}
                mintState={mintState}
                onMint={handleMintProcess}
                onMintSuccess={handleMintSuccess}
                onMintError={handleMintError}
                scannedEventId={scannedEventId}
                scannedTokenOrCode={scannedToken}
                eventData={eventData}
                loadingEvent={loadingEvent}
                scanError={scanError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}