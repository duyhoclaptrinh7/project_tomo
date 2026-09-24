import { useCallback, useEffect, useRef, useState } from 'react';

import {
  endFocusSession,
  setOverlayFocused,
  startFocusSession,
} from '../services/native/overlayBridge.js';
import { useAppStore } from '../store/useAppStore.js';

/** Đồng hồ focus dùng được khi native service có hoặc không khả dụng. */
export function useFocusTimer(defaultMinutes = 25) {
  const recordFocusSession = useAppStore((state) => state.recordFocusSession);
  const patchState = useAppStore((state) => state.patchState);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');
  const completedRef = useRef(false);

  const complete = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsRunning(false);
    await endFocusSession();
    await setOverlayFocused(false);
    await patchState({ isFocusSessionActive: false, isFocusRemindersEnabled: false });
    await recordFocusSession(defaultMinutes);
    setMessage('Bạn đã hoàn thành một phiên tập trung. Tomo ghi nhận cả nỗ lực lẫn lúc nghỉ.');
  }, [defaultMinutes, patchState, recordFocusSession]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          complete();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [complete, isRunning]);

  const start = useCallback(async () => {
    completedRef.current = false;
    setRemainingSeconds(defaultMinutes * 60);
    setIsRunning(true);
    setMessage(`Tomo sẽ ở cạnh bạn trong ${defaultMinutes} phút.`);
    const nativeStarted = await startFocusSession(defaultMinutes, []);
    if (nativeStarted) await setOverlayFocused(true);
    await patchState({
      isFocusSessionActive: true,
      isFocusRemindersEnabled: nativeStarted,
    });
  }, [defaultMinutes, patchState]);

  const stop = useCallback(async () => {
    setIsRunning(false);
    setRemainingSeconds(defaultMinutes * 60);
    await endFocusSession();
    await setOverlayFocused(false);
    await patchState({ isFocusSessionActive: false, isFocusRemindersEnabled: false });
    setMessage('Đã dừng phiên focus. Nghỉ đúng lúc không làm mất đi tiến bộ của bạn.');
  }, [defaultMinutes, patchState]);

  return { remainingSeconds, isRunning, message, start, stop, complete };
}
