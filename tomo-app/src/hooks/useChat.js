import { useCallback, useState } from 'react';

import { sendChat } from '../services/api/chatApi.js';

/**
 * Hook skeleton cho luồng chat. Logic memory/history/action ở Phase 2.
 * @returns {{messages: Array<object>, loading: boolean, error: string|null, sendMessage: Function}}
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sendChat({ input: { type: 'text', text } });
      setMessages((current) => [...current, { role: 'tomo', text: response.reply_text ?? '' }]);
    } catch {
      setError('Backend chưa sẵn sàng');
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, error, sendMessage };
}
