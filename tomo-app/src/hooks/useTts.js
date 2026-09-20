import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

/** Phát TTS bằng giọng hệ thống và expose trạng thái để đồng bộ animation nói. */
export function useTts() {
  const mountedRef = useRef(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);

  const stop = useCallback(async () => {
    await Speech.stop();
    if (mountedRef.current) setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text) => {
    const content = String(text ?? '').trim();
    if (!content) return false;

    setError(null);
    await Speech.stop();

    return new Promise((resolve) => {
      const finish = (success, speechError) => {
        if (mountedRef.current) {
          setIsSpeaking(false);
          if (speechError) setError('Không thể phát giọng nói trên thiết bị này.');
        }
        resolve(success);
      };

      try {
        Speech.speak(content, {
          language: 'vi-VN',
          pitch: 1,
          rate: 0.95,
          onStart: () => {
            if (mountedRef.current) setIsSpeaking(true);
          },
          onDone: () => finish(true),
          onStopped: () => finish(false),
          onError: (speechError) => finish(false, speechError),
        });
      } catch (speechError) {
        console.warn('Không thể phát TTS:', speechError);
        finish(false, speechError);
      }
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      Speech.stop().catch(() => undefined);
    };
  }, []);

  return { isSpeaking, error, speak, stop };
}
