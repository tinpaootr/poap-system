'use client';

import { useEffect, useState } from 'react';
import ScannerPanel from '@/components/checkin/ScannerPanel';
import EventDetailsPanel from '@/components/checkin/EventDetailsPanel';

export default function CheckinPage() {
  const [isScanned, setIsScanned] = useState(false);
  const [mintState, setMintState] = useState<'idle' | 'processing' | 'success'>('idle');

  // State lưu dữ liệu thực tế từ mã QR / mã dự phòng
  const [scannedEventId, setScannedEventId] = useState('');
  const [scannedToken, setScannedToken] = useState('');
  const [eventData, setEventData] = useState<any>(null);

  // Nhận dữ liệu truyền lên từ ScannerPanel (camera / tải ảnh / nhập mã)
  const handleScanSuccess = (eventId?: string, token?: string, data?: any) => {
    if (!token) return; // không có mã thật thì bỏ qua
    setScannedEventId(eventId || ''); // eventId rỗng -> backend tự dò sự kiện đang mở
    setScannedToken(token);
    setEventData(data ?? null);
    setIsScanned(true);
    setMintState('idle');
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
  }, []);

  const handleMintProcess = () => {
    setMintState('processing');
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
                scannedEventId={scannedEventId}
                scannedTokenOrCode={scannedToken}
                eventData={eventData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}