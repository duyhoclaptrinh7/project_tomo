import { useCallback, useEffect, useRef, useState } from 'react';

import { appendFacts, readMemory } from '../services/storage/memoryStorage.js';

/**
 * Quản lý memory.md qua storage service, không truy cập file trực tiếp từ UI.
 * @returns {{memoryMd: string, loading: boolean, error: string|null, refresh: Function, mergeFacts: Function}}
 */
export function useMemory() {
  const [memoryMd, setMemoryMd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loaded = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMemoryMd(await readMemory());
    } catch {
      setError('Không đọc được ký ức của Tomo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Chỉ đồng bộ file một lần khi mount; các thao tác kế tiếp dùng refresh/merge tường minh.
    if (!loaded.current) {
      loaded.current = true;
      refresh();
    }
  }, [refresh]);

  const mergeFacts = useCallback(async (facts) => {
    const next = await appendFacts(facts);
    setMemoryMd(next);
    return next;
  }, []);

  return { memoryMd, loading, error, refresh, mergeFacts };
}
