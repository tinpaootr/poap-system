'use client';
import { API_BASE } from '@/lib/apiBase';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Lock, Wallet } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import ScannerPanel from '@/components/checkin/ScannerPanel';
import EventDetailsPanel from '@/components/checkin/EventDetailsPanel';

export default function CheckinPage() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const [mounted, setMounted] = useState(false);

  const [isScanned, setIsScanned] = useState(false);
  const [mintState, setMintState] = useState<'idle' | 'processing' | 'success'>('idle');

  // State lưu thông tin sự kiện từ QR / mã dự phòng
  const [scannedEventId, setScannedEventId] = useState('');
  const [scannedToken, setScannedToken] = useState('');
  const [eventData, setEventData] = useState<any>(null);

  // Trạng thái tải thông tin sự kiện sau khi quét
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Nhận dữ liệu truyền lên từ ScannerPanel (camera / tải ảnh / nhập mã)
  // -> hỏi backend mã có đúng không + lấy thông tin sự kiện thật để hiển thị
  const handleScanSuccess = async (eventId?: string, token?: string) => {
    if (!token) return; // không có mã 6 số thì bỏ qua

    setIsScanned(false);
    setMintState('idle');
    setEventData(null);
    setScanError('');
    setLoadingEvent(true);

    try {
      const res = await axios.post(`${API_BASE}/events/student-preview`, {
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
        ? error.response.data?.error || 'Mã check-in không hợp lệ hoặc đã hết hạn.'
        : 'Không kết nối được server. Backend đã chạy chưa?';
      console.warn('[checkin] preview lỗi:', error);
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

  const handleMintProcess = () => {
    setMintState('processing');
  };

  const handleMintSuccess = (data?: any) => {
    if (data) setEventData((prev: any) => ({ ...(prev || {}), ...data }));
    setMintState('success');
  };

  const handleMintError = () => {
    setMintState('idle');
  };

  if (!mounted) return null;

  // Chặn truy cập nếu chưa kết nối ví (giống trang Admin)
  if (!isConnected) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#0b0e17] flex items-center justify-center p-4">
        <div className="bg-[#131b2e] border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Khu Vực Đã Khóa</h1>
          <p className="text-slate-400 text-sm mb-6">
            Bạn cần kết nối ví MetaMask của Sinh viên để truy cập cổng điểm danh và nhận huy hiệu Soulbound NFT.
          </p>
          <button
            onClick={() => connect({ connector: metaMask() })}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-semibold transition cursor-pointer"
          >
            <Wallet className="w-5 h-5" />
            Kết Nối MetaMask
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="w-full pt-8 bg-[#0b1326] min-h-[calc(100vh-64px)] text-white">
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