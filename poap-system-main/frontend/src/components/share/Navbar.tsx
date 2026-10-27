"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Award } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const SEPOLIA_CHAIN_ID = "0xaa36a7";

export default function Navbar() {
  const pathname = usePathname();
  
  // Ẩn hoàn toàn Navbar ở trang chủ
  if (pathname === "/") {
    return null;
  }

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isSepolia, setIsSepolia] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // PHÂN TÁCH MENU THEO VAI TRÒ (NGỮ CẢNH)
  const isAdminPage = pathname.startsWith("/admin");

  // Menu dành riêng cho Ban Tổ Chức
  const adminNavItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Ban Tổ Chức", href: "/admin" },
  ];

  // Menu dành riêng cho Sinh viên
  const studentNavItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Sinh viên Điểm danh", href: "/checkin" },
    { name: "Bộ sưu tập", href: "/collection" },
  ];

  // Quyết định render mảng Menu nào dựa trên trang hiện tại
  const currentNavItems = isAdminPage ? adminNavItems : studentNavItems;

  useEffect(() => {
    checkIfWalletIsConnected();
    checkNetwork();

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra ví:", error);
      }
    }
  };

  const checkNetwork = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      setIsSepolia(chainId === SEPOLIA_CHAIN_ID);
    }
  };

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        setIsConnecting(true);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
        checkNetwork();
      } catch (error) {
        console.error("Người dùng từ chối kết nối", error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("Vui lòng cài đặt tiện ích MetaMask trên trình duyệt!");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
    } else {
      setWalletAddress(null);
    }
  };

  const handleChainChanged = (chainId: string) => {
    setIsSepolia(chainId === SEPOLIA_CHAIN_ID);
    window.location.reload(); 
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header className="w-full border-b border-slate-800/80 bg-[#0b0e17]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-white text-lg">
          <Award className="h-8 w-8 text-indigo-500" />
          <span>Club POAP</span>
          {isAdminPage && (
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
              Admin Mode
            </span>
          )}
        </Link>

        {/* Menu thay đổi linh hoạt theo vai trò */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {currentNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Khung kết nối MetaMask */}
        <div className="flex items-center gap-3">
          {walletAddress ? (
            <>
              <div
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
                  isSepolia
                    ? "bg-slate-900 border-slate-800 text-slate-300"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSepolia ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                ></span>
                {isSepolia ? "Sepolia" : "Sai Mạng"}
              </div>

              <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-sm font-mono text-indigo-300">
                {formatAddress(walletAddress)}
              </div>

              <button
                onClick={disconnectWallet}
                title="Đăng xuất ví"
                className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition active:scale-95"
              >
                ⇥
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-medium transition active:scale-95 flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Đang nối...
                </>
              ) : (
                "Kết nối MetaMask"
              )}
            </button>
          )}
        </div>

      </div>
    </header>
  );
}