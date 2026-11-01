"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award } from "lucide-react";
// Dùng chain thay vì chainId để lấy thông tin chính xác nhất từ wagmi
import { useAccount, useDisconnect } from "wagmi"; 
import { useState, useEffect } from "react"; 

export default function Navbar() {
  const pathname = usePathname();
  
  const { address, isConnected, chain } = useAccount(); 
  const { disconnect } = useDisconnect();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === "/") return null;

  const isAdminPage = pathname.startsWith("/admin");
  const adminNavItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Ban Tổ Chức", href: "/admin" },
  ];
  const studentNavItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Sinh viên Điểm danh", href: "/checkin" },
    { name: "Bộ sưu tập", href: "/collection" },
  ];

  const currentNavItems = isAdminPage ? adminNavItems : studentNavItems;
  
  // So sánh trực tiếp với Chain ID chuẩn của Sepolia (11155111)
  const isSepolia = chain?.id === 11155111;

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="w-full border-b border-slate-800/80 bg-[#0b0e17]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-2.5 font-bold text-white text-lg">
          <Award className="h-8 w-8 text-indigo-500" />
          <span>Club POAP</span>
          {isAdminPage && (
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
              Admin Mode
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {currentNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === item.href
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {mounted ? (
            isConnected && address ? (
              <>
                {/* Chỉ hiển thị mạng, không gắn nút bấm đổi mạng để tránh lỗi MetaMask */}
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
                  {formatAddress(address)}
                </div>

                <button
                  onClick={() => disconnect()}
                  title="Đăng xuất ví"
                  className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition active:scale-95"
                >
                  ⇥
                </button>
              </>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-sm font-medium">
                Chưa kết nối ví
              </div>
            )
          ) : (
            <div className="w-32 h-9 rounded-xl bg-slate-800 animate-pulse"></div>
          )}
        </div>

      </div>
    </header>
  );
}