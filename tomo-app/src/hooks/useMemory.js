import { useState } from 'react';

/** Skeleton hook cho memory. Triển khai thật ở Phase 2. */
export function useMemory() {
  const [memoryMd, setMemoryMd] = useState('');
  return { memoryMd, setMemoryMd };
}
