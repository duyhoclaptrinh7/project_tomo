import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useMemory } from './useMemory.js';
import { useTts } from './useTts.js';
import { sendChat } from '../services/api/chatApi.js';
import { setOverlaySpeaking } from '../services/native/overlayBridge.js';
import {
  appendHistoryMessage,
  readAllHistory,
  readRecentHistory,
} from '../services/storage/historyStorage.js';
import { readAppState } from '../services/storage/appStateStorage.js';
import { readMemory } from '../services/storage/memoryStorage.js';
import { useAppStore } from '../store/useAppStore.js';
import { confirmAction, runAction } from '../actions/actionExecutor.js';
import { resolveAnimationState } from '../constants/animationMapping.js';
import { getDeviceTimezone, toLocalIsoWithOffset } from '../utils/dateTime.js';

/**
 * Hook quản lý luồng chat toàn diện.
 * Điều phối memory (qua useMemory), history, action/point (qua actionExecutor) và retry.
 * Tự động đồng bộ lịch sử khi app chuyển foreground/focus giữa main app và overlay.
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [animationState, setAnimationState] = useState(() =>
    useAppStore.getState().isFocusSessionActive ? 'focused' : 'idle',
  );
  const [toast, setToast] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const toastTimeoutRef = useRef(null);

  const { memoryMd, mergeFacts } = useMemory();
  const { speak } = useTts();

  useEffect(() => {
    return () => {
      setOverlaySpeaking(false).catch(() => undefined);
    };
  }, []);

  const reloadHistory = useCallback(async () => {
    try {
      const records = await readRecentHistory(20);
      if (Array.isArray(records) && records.length > 0) {
        const loaded = records.map((m, idx) => ({
          id: `history-${m.ts || idx}-${idx}`,
          role: m.role,
          text: m.text,
          ts: m.ts ? new Date(m.ts).getTime() : Date.now(),
          status: 'sent',
        }));
        setMessages(loaded);
      }
    } catch {
      // Bỏ qua lỗi đọc file history
    }
  }, []);

  // Nạp 20 tin nhắn gần nhất từ chat_history.jsonl và đồng bộ khi app resume
  useEffect(() => {
    let isMounted = true;
    async function syncHistory() {
      try {
        const records = await readRecentHistory(20);
        if (isMounted && Array.isArray(records) && records.length > 0) {
          const loaded = records.map((m, idx) => ({
            id: `history-${m.ts || idx}-${idx}`,
            role: m.role,
            text: m.text,
            ts: m.ts ? new Date(m.ts).getTime() : Date.now(),
            status: 'sent',
          }));
          setMessages(loaded);
        }
      } catch {
        // Bỏ qua lỗi đọc file history
      }
    }

    syncHistory();
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncHistory();
      }
    });
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(null);
  }, []);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  const deliverMessage = useCallback(
    async (messageId, requestInput, displayText) => {
      setLoading(true);
      setError(null);

      try {
        const currentMemory = memoryMd || (await readMemory()) || '';
        const recentHistoryRecords = (await readRecentHistory(20)) ?? [];
        const recentHistory = recentHistoryRecords.map((m) => ({
          role: m.role,
          text: m.text,
          ts: m.ts || new Date().toISOString(),
        }));

        const storeState = useAppStore.getState();
        const sessionContext = {
          focus_session_active: Boolean(storeState.isFocusSessionActive),
          focus_reminders_enabled: Boolean(storeState.isFocusRemindersEnabled),
          evolution_stage: storeState.evolutionStage ?? 1,
          evolution_points: storeState.evolutionPoints ?? 0,
          current_time_iso: toLocalIsoWithOffset(),
          timezone: getDeviceTimezone(),
        };

        const payload = {
          input: requestInput,
          memory_md: currentMemory,
          recent_history: recentHistory,
          session_context: sessionContext,
        };

        const response = await sendChat(payload);

        const userTs = new Date().toISOString();
        await appendHistoryMessage({ role: 'user', text: displayText, ts: userTs });
        if (response?.reply_text) {
          await appendHistoryMessage({
            role: 'tomo',
            text: response.reply_text,
            ts: new Date().toISOString(),
          });
        }

        if (Array.isArray(response?.new_facts) && response.new_facts.length > 0) {
          await mergeFacts(response.new_facts);
        }

        const actionResult = await runAction(response?.action ?? { type: 'none' }, {
          pointEvent: response?.point_event,
        });

        const nextAnimation =
          actionResult?.animationState || resolveAnimationState(response?.emotion_label);

        if (actionResult?.toast) {
          showToast(actionResult.toast);
        }
        if (actionResult?.pendingAction) {
          setPendingAction(actionResult.pendingAction);
        }

        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === messageId ? { ...m, status: 'sent', requestInput: undefined } : m,
          );
          return [
            ...updated,
            {
              id: `${Date.now()}-tomo`,
              role: 'tomo',
              text: response?.reply_text ?? '',
              ts: Date.now(),
              status: 'sent',
            },
          ];
        });

        if (response?.should_speak && response?.reply_text) {
          setAnimationState('speaking');
          await setOverlaySpeaking(true);
          const spoken = await speak(response.reply_text);
          await setOverlaySpeaking(false);
          setAnimationState(nextAnimation || 'idle');
          if (!spoken) {
            setError('Tomo đã trả lời nhưng thiết bị không phát được giọng nói.');
          }
        } else if (nextAnimation) {
          setAnimationState(nextAnimation);
        }
      } catch (err) {
        await setOverlaySpeaking(false);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, status: 'failed' } : m)),
        );
        if (err?.response?.data?.error?.code === 'GEMINI_ERROR') {
          setError(err.response.data.error.message || 'Gemini API lỗi');
        } else {
          setError('Không thể kết nối đến Tomo. Vui lòng kiểm tra mạng.');
        }
      } finally {
        setLoading(false);
      }
    },
    [memoryMd, mergeFacts, showToast, speak],
  );

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const userMessage = {
        id,
        role: 'user',
        text: trimmed,
        ts: Date.now(),
        status: 'pending',
        requestInput: { type: 'text', text: trimmed },
      };

      setMessages((prev) => [...prev, userMessage]);
      await deliverMessage(id, userMessage.requestInput, trimmed);
    },
    [deliverMessage],
  );

  const sendVoiceMessage = useCallback(
    async (recording) => {
      if (!recording?.audioBase64 || !recording?.audioMime) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const displayText = '🎤 Tin nhắn thoại';
      const requestInput = {
        type: 'audio',
        audio_base64: recording.audioBase64,
        audio_mime: recording.audioMime,
      };
      const userMessage = {
        id,
        role: 'user',
        text: displayText,
        ts: Date.now(),
        status: 'pending',
        requestInput,
        audioUri: recording.uri,
      };

      setMessages((prev) => [...prev, userMessage]);
      await deliverMessage(id, requestInput, displayText);
    },
    [deliverMessage],
  );

  const retryMessage = useCallback(
    async (messageId) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'pending' } : m)),
      );
      const requestInput = target.requestInput ?? { type: 'text', text: target.text };
      await deliverMessage(messageId, requestInput, target.text);
    },
    [messages, deliverMessage],
  );

  const confirmPendingAction = useCallback(async () => {
    if (!pendingAction || isConfirmingAction) return;
    setIsConfirmingAction(true);
    setError(null);
    try {
      const result = await confirmAction(pendingAction);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (result.animationState) setAnimationState(result.animationState);
      if (result.toast) showToast(result.toast);
      setPendingAction(null);
    } finally {
      setIsConfirmingAction(false);
    }
  }, [isConfirmingAction, pendingAction, showToast]);

  const dismissPendingAction = useCallback(() => {
    if (!isConfirmingAction) setPendingAction(null);
  }, [isConfirmingAction]);

  const inspectLocalFiles = useCallback(async () => {
    try {
      const memory = await readMemory();
      const history = await readAllHistory();
      const appState = await readAppState();
      console.log(
        '\n================== 📁 NỘI DUNG 3 FILE LOCAL TRÊN ĐIỆN THOẠI ==================',
      );
      console.log('--- 1. [memory.md] ---');
      console.log(memory || '(Trống, chưa có fact nào được ghi)');
      console.log(`\n--- 2. [chat_history.jsonl] --- (Tổng cộng: ${history.length} tin nhắn)`);
      if (history.length === 0) {
        console.log('(Trống, chưa có tin nhắn nào)');
      } else {
        history.forEach((m, idx) => {
          console.log(`  [#${idx + 1}] [${m.role?.toUpperCase()}] (${m.ts}): ${m.text}`);
        });
      }
      console.log('\n--- 3. [app_state.json] ---');
      console.log(JSON.stringify(appState, null, 2));
      console.log(
        '===============================================================================\n',
      );
      showToast('Đã in 3 file local ra Terminal máy tính! 📄');
    } catch (err) {
      console.error('Lỗi khi đọc file local:', err);
    }
  }, [showToast]);

  return {
    messages,
    loading,
    error,
    animationState,
    toast,
    pendingAction,
    isConfirmingAction,
    sendMessage,
    sendVoiceMessage,
    retryMessage,
    dismissToast,
    confirmPendingAction,
    dismissPendingAction,
    inspectLocalFiles,
    reloadHistory,
  };
}
