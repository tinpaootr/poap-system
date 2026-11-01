// frontend/src/hooks/useCollection.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Badge, getCollection } from '@/lib/collectionApi';

/**
 * Tự động tải bộ sưu tập huy hiệu của ví MetaMask đang kết nối.
 *
 * Cách dùng trong app/collection/page.tsx:
 *   const { badges, loading, error, isConnected, refresh } = useCollection();
 */
export function useCollection(options: { search?: string; sort?: 'newest' | 'oldest' } = {}) {
  const { address, isConnected } = useAccount();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { search, sort } = options;

  const refresh = useCallback(async () => {
    if (!address) {
      setBadges([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getCollection(address, { search, sort });
      setBadges(data.badges);
    } catch (err) {
      setBadges([]);
      setError(err instanceof Error ? err.message : 'Không thể tải bộ sưu tập.');
    } finally {
      setLoading(false);
    }
  }, [address, search, sort]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { address, isConnected, badges, loading, error, refresh };
}