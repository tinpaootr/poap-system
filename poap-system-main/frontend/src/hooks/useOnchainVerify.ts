'use client';

// frontend/src/hooks/useOnchainVerify.ts
// Xác minh huy hiệu ngay trên Blockchain (Sepolia), không phụ thuộc Backend:
//   1. Đọc receipt của txHash -> lấy tokenId thật từ event Transfer (mint)
//   2. ownerOf(tokenId)  -> phải trùng ví đang xem
//   3. balanceOf(ví)     -> số huy hiệu ví đang giữ
//   4. locked(tokenId)   -> ERC-5192: true = Soulbound, không chuyển nhượng

import { useMemo } from 'react';
import { isAddress, isAddressEqual, parseAbi, parseEventLogs } from 'viem';
import { sepolia } from 'wagmi/chains';
import { useReadContract, useWaitForTransactionReceipt } from 'wagmi';

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as `0x${string}`;
export const ETHERSCAN_BASE = 'https://sepolia.etherscan.io';

const verifyAbi = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
  'function locked(uint256 tokenId) view returns (bool)',
]);

export type VerifyStatus = 'idle' | 'checking' | 'verified' | 'mismatch' | 'error';

const TX_REGEX = /^0x[a-fA-F0-9]{64}$/;

export function useOnchainVerify(txHash?: string | null, wallet?: string | null) {
  const validTx = !!txHash && TX_REGEX.test(txHash);
  const validWallet = !!wallet && isAddress(wallet);
  const validContract = isAddress(CONTRACT_ADDRESS);
  const enabled = validTx && validWallet && validContract;

  // 1. Receipt giao dịch mint
  const receiptQ = useWaitForTransactionReceipt({
    hash: validTx ? (txHash as `0x${string}`) : undefined,
    chainId: sepolia.id,
    query: { enabled },
  });
  const receipt = receiptQ.data;

  // Lấy tokenId từ event Transfer (từ địa chỉ 0 -> ví) của đúng contract
  const tokenId = useMemo(() => {
    if (!receipt || !validWallet || !validContract) return undefined;
    try {
      const logs = parseEventLogs({ abi: verifyAbi, eventName: 'Transfer', logs: receipt.logs });
      const mint = logs.find(
        (l) =>
          isAddressEqual(l.address, CONTRACT_ADDRESS) &&
          isAddressEqual(l.args.to, wallet as `0x${string}`)
      );
      return mint?.args.tokenId;
    } catch {
      return undefined;
    }
  }, [receipt, wallet, validWallet, validContract]);

  const common = { address: CONTRACT_ADDRESS, abi: verifyAbi, chainId: sepolia.id } as const;
  const hasToken = tokenId !== undefined;

  // 2. Chủ sở hữu hiện tại
  const ownerQ = useReadContract({
    ...common,
    functionName: 'ownerOf',
    args: hasToken ? [tokenId] : undefined,
    query: { enabled: enabled && hasToken },
  });

  // 3. Số huy hiệu ví đang giữ
  const balanceQ = useReadContract({
    ...common,
    functionName: 'balanceOf',
    args: validWallet ? [wallet as `0x${string}`] : undefined,
    query: { enabled: enabled && hasToken },
  });

  // 4. Soulbound (ERC-5192)
  const lockedQ = useReadContract({
    ...common,
    functionName: 'locked',
    args: hasToken ? [tokenId] : undefined,
    query: { enabled: enabled && hasToken },
  });

  const owner = ownerQ.data as `0x${string}` | undefined;
  const ownerMatches = !!owner && validWallet && isAddressEqual(owner, wallet as `0x${string}`);
  const receiptOk = receipt ? receipt.status === 'success' : undefined;

  let status: VerifyStatus = 'idle';
  let message = '';

  if (!enabled) {
    status = 'error';
    message = !validContract
      ? 'Thiếu NEXT_PUBLIC_CONTRACT_ADDRESS trong .env.local.'
      : !validTx
        ? 'Huy hiệu chưa có mã giao dịch hợp lệ.'
        : 'Chưa có địa chỉ ví hợp lệ.';
  } else if (receiptQ.isError) {
    status = 'error';
    message = 'Không tìm thấy giao dịch trên Sepolia (RPC lỗi hoặc sai mạng).';
  } else if (receiptQ.isLoading || (receipt && hasToken && (ownerQ.isLoading || lockedQ.isLoading))) {
    status = 'checking';
  } else if (receipt && receiptOk === false) {
    status = 'mismatch';
    message = 'Giao dịch mint đã bị revert trên Blockchain.';
  } else if (receipt && !hasToken) {
    status = 'mismatch';
    message = 'Giao dịch này không mint huy hiệu nào cho ví đang xem.';
  } else if (ownerQ.isError) {
    status = 'mismatch';
    message = 'Không tra được chủ sở hữu của token (token không tồn tại hoặc đã bị hủy).';
  } else if (hasToken && owner && !ownerMatches) {
    status = 'mismatch';
    message = 'Chủ sở hữu on-chain KHÔNG khớp với ví đang xem.';
  } else if (ownerMatches) {
    status = 'verified';
    message = 'Chủ sở hữu on-chain khớp với ví. Huy hiệu là thật.';
  } else {
    status = 'checking';
  }

  return {
    status,
    message,
    tokenId: tokenId !== undefined ? tokenId.toString() : undefined,
    owner,
    balance: balanceQ.data !== undefined ? (balanceQ.data as bigint).toString() : undefined,
    locked: lockedQ.data as boolean | undefined,
    blockNumber: receipt ? receipt.blockNumber.toString() : undefined,
  };
}