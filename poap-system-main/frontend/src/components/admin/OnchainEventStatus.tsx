"use client";

// Hiển thị sự kiện đã được đăng ký trên contract ClubPOAP chưa.
// Nếu CHƯA (admin huỷ ký lúc tạo, hoặc sự kiện tạo trước khi deploy contract mới)
// thì hiện nút "Đăng ký lại on-chain" để admin gọi createEvent(eventId, capacity) bằng ví của mình.
// Backend chỉ mint được huy hiệu cho sự kiện đã đăng ký on-chain.

import { useState } from "react";
import { isAddress } from "viem";
import { sepolia } from "wagmi/chains";
import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import contractABI from "@/lib/contractABI.json";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

interface Props {
  eventId: string;
  capacity: number;
}

export default function OnchainEventStatus({ eventId, capacity }: Props) {
  const validContract = isAddress(CONTRACT_ADDRESS);
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { writeContractAsync } = useWriteContract();
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "events",
    args: [eventId],
    chainId: sepolia.id,
    query: { enabled: validContract && !!eventId },
  });

  if (!validContract || isLoading) return null;
  if (isError) {
    return <span className="text-[10px] text-slate-500">Không đọc được trạng thái on-chain</span>;
  }

  // events(eventId) trả về [capacity, currentAttendees, exists]
  const exists = Array.isArray(data) ? Boolean(data[2]) : false;
  if (exists) {
    return (
      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
        Đã đăng ký on-chain
      </span>
    );
  }

  const handleRegister = async () => {
    setError("");
    if (!capacity || capacity <= 0) {
      setError("Sức chứa sự kiện phải lớn hơn 0.");
      return;
    }
    setRegistering(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: "createEvent",
        args: [eventId, BigInt(capacity)],
        chainId: sepolia.id,
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      await refetch();
    } catch (err: unknown) {
      console.warn("[admin] Đăng ký on-chain thất bại:", err);
      const e = err as { shortMessage?: string; message?: string };
      const msg = String(e?.shortMessage || e?.message || "");
      setError(
        /user rejected|denied/i.test(msg)
          ? "Bạn đã huỷ ký giao dịch."
          : /Khong phai vi Admin/.test(msg)
            ? "Ví đang kết nối không có quyền Admin trên contract."
            : msg || "Đăng ký on-chain thất bại."
      );
    } finally {
      setRegistering(false);
    }
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-medium">
        Chưa có trên blockchain
      </span>
      <button
        type="button"
        onClick={handleRegister}
        disabled={registering}
        className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-semibold"
      >
        {registering ? "Đang đăng ký..." : "Đăng ký lại on-chain"}
      </button>
      {error && <span className="text-[10px] text-rose-400">{error}</span>}
    </span>
  );
}
