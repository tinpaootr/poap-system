'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useSignMessage } from 'wagmi';
import axios from 'axios';

interface EventDetailsProps {
  isScanned: boolean;
  mintState: 'idle' | 'processing' | 'success';
  onMint: () => void;
  onMintSuccess?: (data?: any) => void; // gọi khi ghi nhận thành công
  onMintError?: () => void;             // gọi khi có lỗi -> quay về idle
  // Dữ liệu thật từ component cha / quá trình quét QR
  scannedEventId?: string;
  scannedTokenOrCode?: string;
  eventData?: any;
  loadingEvent?: boolean; // đang hỏi backend thông tin sự kiện sau khi quét
  scanError?: string;     // mã sai / hết hạn / sự kiện đóng
}

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

// "ipfs://Qm..." -> link ảnh xem được trên trình duyệt
const ipfsToHttp = (uri?: string) =>
  uri ? `${IPFS_GATEWAY}/${String(uri).replace(/^ipfs:\/\//, '')}` : '';

// Thời gian admin nhập (VD "2026-11-05T14:30") -> "14:30 05/11/2026"; không parse được thì giữ nguyên
const formatEventTime = (raw?: string) => {
  if (!raw) return 'Chưa cập nhật';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function EventDetailsPanel({
  isScanned,
  mintState,
  onMint,
  onMintSuccess,
  onMintError,
  scannedEventId,
  scannedTokenOrCode,
  eventData,
  loadingEvent = false,
  scanError = ''
}: EventDetailsProps) {
  // Lấy địa chỉ ví MetaMask thật của sinh viên bằng wagmi
  const { address } = useAccount();
  // Ký thông điệp bằng MetaMask (không tốn gas) để chứng minh sở hữu ví
  const { signMessageAsync } = useSignMessage();

  // State lưu thông tin nhập liệu của sinh viên
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [txHash, setTxHash] = useState('');
  const [statusText, setStatusText] = useState(''); // "Vui lòng ký trong MetaMask...", ...

  // Ví đã gắn với 1 sinh viên (lấy từ backend) -> khóa ô MSSV + họ tên
  const [isLocked, setIsLocked] = useState(false);
  const [checkingWallet, setCheckingWallet] = useState(false);

  // Mỗi khi đổi ví: hỏi backend xem ví này đã điểm danh với MSSV nào chưa
  useEffect(() => {
    setIsLocked(false);
    setStudentId('');
    setFullName('');
    if (!address) return;

    let cancelled = false;
    const loadBoundStudent = async () => {
      setCheckingWallet(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/collection/${address}`);
        const badges: any[] = res.data?.badges || [];
        // Lấy lượt điểm danh gần nhất có đủ MSSV + họ tên
        const bound = badges.find((b) => b.studentId && b.fullName);
        if (!cancelled && bound) {
          setStudentId(String(bound.studentId));
          setFullName(String(bound.fullName));
          setIsLocked(true);
        }
      } catch (e) {
        // Backend lỗi / chưa chạy -> vẫn cho nhập tay, backend sẽ chặn nếu sai
        console.warn('[checkin] không lấy được thông tin ví:', e);
      } finally {
        if (!cancelled) setCheckingWallet(false);
      }
    };
    loadBoundStudent();

    return () => {
      cancelled = true;
    };
  }, [address]);

  // Điểm danh thành công lần đầu -> khóa luôn theo thông tin vừa nhập
  const saveStudentInfo = () => {
    setStudentId((v) => v.trim());
    setFullName((v) => v.trim());
    setIsLocked(true);
  };

  // Hàm xử lý khi bấm nút "Nhận Huy Hiệu"
  const handleClaimProcess = async () => {
    setErrorMessage('');

    if (!address) {
      setErrorMessage('Vui lòng kết nối ví MetaMask trước!');
      return;
    }

    if (!studentId.trim() || !fullName.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ MSSV và Họ tên!');
      return;
    }
    if (!/^\d{6,12}$/.test(studentId.trim())) {
      setErrorMessage('MSSV không hợp lệ (chỉ gồm 6–12 chữ số).');
      return;
    }

    // Mã lấy từ camera / tải ảnh / nhập mã (ScannerPanel -> page -> đây)
    const tokenOrCodeToVerify = scannedTokenOrCode || '';
    if (!tokenOrCodeToVerify) {
      setErrorMessage('Vui lòng quét hoặc nhập mã check-in trước!');
      return;
    }

    let processingStarted = false;

    try {
      // 1. Xin thông điệp xác thực (có nonce dùng 1 lần) từ backend
      setStatusText('Đang tạo phiên xác thực...');
      const challengeRes = await axios.post('http://localhost:5000/api/events/student-challenge', {
        walletAddress: address,
        studentId: studentId.trim(),
        fullName: fullName.trim()
      });

      // 2. Ký bằng MetaMask -> chứng minh đang giữ private key của ví
      setStatusText('Vui lòng ký xác nhận trong MetaMask...');
      let signature: string;
      try {
        signature = await signMessageAsync({ message: challengeRes.data.message });
      } catch (signErr) {
        console.warn('[checkin] người dùng từ chối ký:', signErr);
        setStatusText('');
        setErrorMessage('Bạn đã từ chối ký trong MetaMask. Cần ký để chứng minh bạn là chủ ví.');
        return;
      }

      // 3. Gửi mã QR + chữ ký lên backend (MSSV/họ tên backend lấy từ thông điệp đã ký)
      setStatusText('Đang xác thực điểm danh...');
      const response = await axios.post('http://localhost:5000/api/events/student-checkin', {
        eventId: scannedEventId || null, // null -> Backend tự dò sự kiện theo token
        qrToken: tokenOrCodeToVerify,
        walletAddress: address,
        signature
      });

      const { tokenURI, claimTicket } = response.data;
      console.log('Xác thực Backend thành công, lấy được tokenURI:', tokenURI);

      // 4. Backend OK rồi mới bật hiệu ứng processing
      setStatusText('');
      onMint();
      processingStarted = true;

      // TODO: Tích hợp gọi Smart Contract đúc NFT trên Sepolia ở đây
      const mintedTxHash = '0x_mock_tx_hash_sepolia';

      // 5. Ghi nhận lịch sử: chỉ gửi vé dùng 1 lần + txHash
      await axios.post('http://localhost:5000/api/events/record-success', {
        claimTicket,
        txHash: mintedTxHash
      });

      // 6. Chuyển sang trạng thái thành công
      setTxHash(mintedTxHash);
      saveStudentInfo(); // khóa MSSV + họ tên theo ví này
      onMintSuccess?.(response.data.event);
    } catch (error: any) {
      let errorMsg = 'Lỗi kết nối server khi điểm danh!';

      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const serverMsg = error.response.data?.error || error.response.data?.message;

        if (status === 409) {
          errorMsg = serverMsg || 'Ví hoặc MSSV này đã điểm danh sự kiện này rồi!';
        } else if (status === 401) {
          errorMsg = serverMsg || 'Xác thực chữ ký ví thất bại, vui lòng thử lại!';
        } else if (status === 400 || status === 404) {
          errorMsg = serverMsg || 'Mã check-in không hợp lệ hoặc sự kiện không tồn tại!';
        } else {
          errorMsg = serverMsg || `Lỗi server (${status}), vui lòng thử lại!`;
        }
      } else if (axios.isAxiosError(error) && error.request) {
        errorMsg = 'Không kết nối được server (localhost:5000). Backend đã chạy chưa?';
      }

      // Dùng warn thay vì error để Next.js không bật màn hình lỗi đỏ
      console.warn('Lỗi khi claim:', error);
      setStatusText('');
      if (processingStarted) onMintError?.(); // tắt hiệu ứng "Đang ký giao dịch"
      setErrorMessage(errorMsg);
    }
  };

  const shortTx = txHash.length > 20 ? `${txHash.slice(0, 12)}...${txHash.slice(-6)}` : txHash;
  const isRealTx = /^0x[a-fA-F0-9]{64}$/.test(txHash);

  return (
    <div className="lg:col-span-5 flex flex-col gap-6">
      {!isScanned && (
        <div className={`bg-[#131b2e] rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center h-full border border-dashed ${scanError ? 'border-rose-500/40' : 'border-slate-700'}`}>
          {loadingEvent ? (
            <>
              <span className="material-symbols-outlined text-[48px] text-indigo-400 animate-spin">progress_activity</span>
              <p className="text-sm text-slate-400">Đang kiểm tra mã và tải thông tin sự kiện...</p>
            </>
          ) : scanError ? (
            <>
              <span className="material-symbols-outlined text-[48px] text-rose-400">error</span>
              <p className="text-sm text-rose-400">{scanError}</p>
              <p className="text-xs text-slate-500">Hãy quét lại mã QR mới nhất trên màn hình.</p>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[48px] text-slate-600">qr_code_scanner</span>
              <p className="text-sm text-slate-400">Vui lòng quét mã để hiển thị thông tin sự kiện</p>
            </>
          )}
        </div>
      )}

      {isScanned && (
        <div className="bg-[#131b2e] border border-slate-800 rounded-xl p-8 shadow-xl flex flex-col gap-6 relative overflow-hidden animate-fade-in">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">event_available</span>
              Đã nhận diện thành công
            </span>
            <span className="text-[11px] text-slate-500 font-mono">ID: …{String(eventData?._id || scannedEventId || '').slice(-6)}</span>
          </div>

          <div className="flex items-center gap-4">
            {eventData?.ipfsImageHash && (
              <img
                src={ipfsToHttp(eventData.ipfsImageHash)}
                alt="Huy hiệu sự kiện"
                className="w-16 h-16 rounded-lg object-cover border border-slate-800 shrink-0"
              />
            )}
            <h3 className="text-lg font-bold text-white leading-snug">
              {eventData?.name || 'Sự kiện chưa có tên'}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#0b1326] border border-slate-800/50 flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-[20px]">schedule</span>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Thời gian</span>
                <span className="text-xs text-white font-semibold">{formatEventTime(eventData?.time)}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1326] border border-slate-800/50 flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-[20px]">groups</span>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Đã điểm danh</span>
                <span className="text-xs text-white font-semibold">
                  {eventData?.currentAttendees ?? 0}
                  {eventData?.capacity ? ` / ${eventData.capacity}` : ''} người
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1326]/50 border border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] text-indigo-400 uppercase font-bold tracking-wider">Quyền lợi nhận được:</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                <span className="text-sm font-semibold text-white">01 Soulbound Badge</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[11px]">Bất biến (SBT)</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <span className="text-[11px] font-semibold text-slate-400">Thông tin định danh sinh viên:</span>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500">Địa chỉ ví MetaMask</label>
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0b1326] border border-slate-800 text-white font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${address ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Chưa kết nối ví'}
                </div>
                <span className={`text-[11px] flex items-center gap-0.5 ${address ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">{address ? 'lock' : 'lock_open'}</span>
                  {address ? 'Đã liên kết' : 'Chưa kết nối'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500">Mã số sinh viên (MSSV)</label>
                <input
                  className={`px-4 py-3 rounded-lg bg-[#0b1326] border text-white text-xs focus:outline-none ${isLocked ? 'border-emerald-500/30 text-slate-300 cursor-not-allowed' : 'border-slate-800'}`}
                  type="text"
                  inputMode="numeric"
                  placeholder={checkingWallet ? 'Đang kiểm tra ví...' : 'VD: 2311073'}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  readOnly={isLocked}
                  disabled={mintState !== 'idle' || checkingWallet}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500">Họ và Tên</label>
                <input
                  className={`px-4 py-3 rounded-lg bg-[#0b1326] border text-white text-xs focus:outline-none ${isLocked ? 'border-emerald-500/30 text-slate-300 cursor-not-allowed' : 'border-slate-800'}`}
                  type="text"
                  placeholder={checkingWallet ? 'Đang kiểm tra ví...' : 'VD: Nguyễn Văn A'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  readOnly={isLocked}
                  disabled={mintState !== 'idle' || checkingWallet}
                />
              </div>
            </div>
            {isLocked ? (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                Ví này đã được liên kết với sinh viên trên. Muốn dùng MSSV khác, hãy đổi sang ví khác.
              </p>
            ) : (
              address && !checkingWallet && (
                <p className="text-[11px] text-amber-400/80 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Lần điểm danh đầu tiên: MSSV và họ tên sẽ gắn cố định với ví này.
                </p>
              )
            )}
          </div>

          {statusText && (
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              {statusText}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleClaimProcess}
            disabled={mintState !== 'idle' || !!statusText}
            className={`w-full mt-2 py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-2 group ${mintState !== 'idle' || statusText ? 'opacity-50 pointer-events-none' : 'hover:shadow-2xl hover:scale-[1.01]'}`}>
            <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform">auto_awesome</span>
            <span>{mintState === 'success' ? 'Đã nhận huy hiệu' : 'Nhận Huy Hiệu (Claim POAP / SBT)'}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <span className="text-center text-[11px] text-slate-500">Phí mạng (Gas fee): Được nhà trường tài trợ 100%</span>
        </div>
      )}

      {mintState === 'processing' && (
        <div className="p-6 rounded-xl bg-[#131b2e]/95 border border-slate-800 shadow-xl flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <span className="material-symbols-outlined text-indigo-400 text-[20px] absolute">token</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Đang Ký Giao Dịch Sepolia...</span>
              <span className="text-[11px] text-cyan-400 animate-pulse">Vui lòng không đóng hoặc tải lại trang</span>
            </div>
          </div>
          <div className="w-full bg-[#0b1326] rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1.5 w-3/4 animate-pulse"></div>
          </div>
        </div>
      )}

      {mintState === 'success' && (
        <div className="p-6 rounded-xl bg-[#131b2e]/95 border border-emerald-500/30 shadow-2xl flex flex-col gap-4 relative overflow-hidden animate-fade-in">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">Điểm Danh Thành Công!</span>
              <span className="text-xs font-semibold text-emerald-400">Huy hiệu Soulbound đã được ghi nhận vào ví</span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0b1326] border border-slate-800">
            {eventData?.ipfsImageHash ? (
              <img className="w-16 h-16 rounded-lg object-cover shadow-md" alt="Huy hiệu" src={ipfsToHttp(eventData.ipfsImageHash)} />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-emerald-400 text-[28px]">military_tech</span>
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white truncate">{eventData?.name || 'Huy hiệu Soulbound'}</span>
              <span className="text-[11px] text-slate-400">Chuẩn ERC-5192 (Locked Soulbound)</span>
              <span className="text-[11px] text-indigo-400 font-mono truncate mt-0.5">Tx: {shortTx || '—'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {isRealTx ? (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs text-center transition-colors">
                Xem Sepolia Etherscan
              </a>
            ) : (
              <span
                title="Chưa có giao dịch thật trên Sepolia (đang dùng txHash giả)"
                className="flex-1 py-2.5 rounded-lg bg-slate-800/50 text-slate-500 text-xs text-center cursor-not-allowed">
                Xem Sepolia Etherscan
              </span>
            )}
            <Link
              href="/collection"
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">folder_open</span>
              Xem Bộ Sưu Tập
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}