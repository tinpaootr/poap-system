'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, LogOut, X, ExternalLink, ShieldCheck } from 'lucide-react';

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasMetaMask(!!(window as any).ethereum);
    }
  }, []);

  // Lọc lấy 1 connector MetaMask duy nhất
  const metaMaskConnector = connectors.find((c) => c.name.toLowerCase().includes('metamask')) || connectors[0];

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-sm font-mono text-indigo-300 shadow-inner">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition"
          title="Đăng xuất ví"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-indigo-500/25 active:scale-95"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-white">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-lg">Kết nối Ví Web3</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {hasMetaMask && metaMaskConnector ? (
                <button
                  onClick={() => {
                    connect({ connector: metaMaskConnector });
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 rounded-xl transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-bold text-orange-400 text-xl">
                      🦊
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm text-slate-200 group-hover:text-indigo-400 transition">
                        MetaMask Wallet
                      </div>
                      <div className="text-xs text-slate-400">Kết nối trực tiếp qua Extension</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    Sẵn sàng
                  </span>
                </button>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3 text-center">
                  <p className="text-amber-300 text-sm font-medium">
                    Chưa phát hiện tiện ích MetaMask trên trình duyệt!
                  </p>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition"
                  >
                    Tải & Cài đặt MetaMask ngay <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800/80">
              Chỉ kết nối với các trang web chính thức đáng tin cậy.
            </p>
          </div>
        </div>
      )}
    </>
  );
}