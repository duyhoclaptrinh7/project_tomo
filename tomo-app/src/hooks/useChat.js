import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useMemory } from './useMemory.js';
import { sendChat } from '../services/api/chatApi.js';
import {
  appendHistoryMessage,
  readAllHistory,
  readRecentHistory,
} from '../services/storage/historyStorage.js';
import { readAppState } from '../services/storage/appStateStorage.js';
import { readMemory } from '../services/storage/memoryStorage.js';
import { useAppStore } from '../store/useAppStore.js';
import { runAction } from '../actions/actionExecutor.js';
import { resolveAnimationState } from '../constants/animationMapping.js';

/**
 * Hook quản lý luồng chat toàn diện.
 * Điều phối memory (qua useMemory), history, action/point (qua actionExecutor) và retry.
 * Tự động đồng bộ lịch sử khi app chuyển foreground/focus giữa main app và overlay.
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [animationState, setAnimationState] = useState('idle');
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const { memoryMd, mergeFacts } = useMemory();

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
    async (messageId, text) => {
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
          evolution_stage: storeState.evolutionStage ?? 1,
          evolution_points: storeState.evolutionPoints ?? 0,
        };

        const payload = {
          input: { type: 'text', text },
          memory_md: currentMemory,
          recent_history: recentHistory,
          session_context: sessionContext,
        };

        const response = await sendChat(payload);

        const userTs = new Date().toISOString();
        await appendHistoryMessage({ role: 'user', text, ts: userTs });
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
        if (nextAnimation) {
          setAnimationState(nextAnimation);
        }

        if (actionResult?.toast) {
          showToast(actionResult.toast);
        }

        setMessages((prev) => {
          const updated = prev.map((m) => (m.id === messageId ? { ...m, status: 'sent' } : m));
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
      } catch (err) {
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
    [memoryMd, mergeFacts, showToast],
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
      };

      setMessages((prev) => [...prev, userMessage]);
      await deliverMessage(id, trimmed);
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
      await deliverMessage(messageId, target.text);
    },
    [messages, deliverMessage],
  );

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
    sendMessage,
    retryMessage,
    dismissToast,
    inspectLocalFiles,
    reloadHistory,
  };
}
