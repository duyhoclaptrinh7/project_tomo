import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { File } from 'expo-file-system';

function resolveAudioMime(uri) {
  const normalized = String(uri ?? '').toLowerCase();
  if (normalized.endsWith('.3gp')) return 'audio/3gpp';
  if (normalized.endsWith('.webm')) return 'audio/webm';
  return 'audio/mp4';
}

/** Ghi âm push-to-talk và giữ payload cuối để có thể gửi lại khi mất mạng. */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const isRecordingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [lastRecording, setLastRecording] = useState(null);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return true;

    setError(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('Tomo cần quyền microphone để nghe bạn nói.');
        return false;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        interruptionMode: 'doNotMix',
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      isRecordingRef.current = true;
      setIsRecording(true);
      return true;
    } catch (recordingError) {
      console.warn('Không thể bắt đầu ghi âm:', recordingError);
      setError('Không thể bắt đầu ghi âm. Hãy kiểm tra quyền microphone.');
      return false;
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) return null;

    try {
      await recorder.stop();
      isRecordingRef.current = false;
      setIsRecording(false);

      const uri = recorder.uri;
      if (!uri) throw new Error('Recorder không trả về file audio');

      const audioBase64 = await new File(uri).base64();
      if (!audioBase64) throw new Error('File ghi âm rỗng');

      const recording = {
        uri,
        audioBase64,
        audioMime: resolveAudioMime(uri),
      };
      setLastRecording(recording);
      setError(null);
      return recording;
    } catch (recordingError) {
      console.warn('Không thể hoàn tất ghi âm:', recordingError);
      setError('Không thể đọc bản ghi âm. Vui lòng thử lại.');
      return null;
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
      setAudioModeAsync({
        allowsRecording: false,
        interruptionMode: 'duckOthers',
        playsInSilentMode: true,
      }).catch(() => undefined);
    }
  }, [recorder]);

  const clearRecording = useCallback(() => setLastRecording(null), []);

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) recorder.stop().catch(() => undefined);
    };
  }, [recorder]);

  return {
    isRecording,
    error,
    lastRecording,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
