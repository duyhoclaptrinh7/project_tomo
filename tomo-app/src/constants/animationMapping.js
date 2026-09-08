export const DEFAULT_ANIMATION_STATE = 'idle';

// Key nội bộ dùng ASCII để mapping không phụ thuộc dấu tiếng Việt trong asset pipeline.
export const EMOTION_TO_ANIMATION = {
  vui: 'happy',
  buồn: 'comfort',
  stress: 'comfort',
  trung_lập: 'idle',
};

export function resolveAnimationState(emotionLabel) {
  return EMOTION_TO_ANIMATION[emotionLabel] ?? DEFAULT_ANIMATION_STATE;
}
