import { useState } from 'react';

/** Skeleton hook cho push-to-talk. Triển khai thật ở Phase 4. */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  return { isRecording, setIsRecording };
}
