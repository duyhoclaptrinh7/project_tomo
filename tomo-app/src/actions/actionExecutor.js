import { DEFAULT_ANIMATION_STATE } from '../constants/animationMapping.js';
import { useAppStore } from '../store/useAppStore.js';

const PHASE2_ANIMATIONS = new Set([
  'idle',
  'happy',
  'comfort',
  'focused',
  'speaking',
  'celebrating',
]);

/**
 * Diễn giải action từ backend và xử lý điểm tiến hoá theo quy tắc Phase 2 / MVP.
 * Cộng +1 điểm tiến hoá và trả về toast khi point_event = "emotional_share" hoặc action.type = "end_focus_session".
 * @param {object} action - Action object theo API_SPEC mục 5.2.
 * @param {object|string} [options] - Tuỳ chọn thêm: { pointEvent } hoặc chuỗi pointEvent.
 * @returns {Promise<{animationState?: string, toast?: string, pointAwarded?: boolean}>} Kết quả executor trả về UI.
 */
export async function runAction(action, options = {}) {
  const pointEvent = typeof options === 'string' ? options : options?.pointEvent;
  let toast = null;
  let pointAwarded = false;

  if (pointEvent === 'emotional_share' || action?.type === 'end_focus_session') {
    await useAppStore.getState().addConnectionPoint();
    toast = '+1 kết nối 💙';
    pointAwarded = true;
  }

  const extra = toast ? { toast, pointAwarded } : {};

  if (!action?.type || action.type === 'none') {
    return extra;
  }

  switch (action.type) {
    case 'set_animation': {
      const requested = action.params?.animation_state;
      // Action khác emotion_label: backend đã gửi animation state nội bộ, chỉ validate giá trị Phase 2 hỗ trợ.
      const animationState = PHASE2_ANIMATIONS.has(requested) ? requested : DEFAULT_ANIMATION_STATE;
      return { animationState, ...extra };
    }
    default:
      // Các action Phase 3+ được chấp nhận nhưng cố ý no-op, tránh vượt phạm vi MVP hiện tại.
      return extra;
  }
}

/**
 * Xử lý độc lập point_event nếu cần gọi riêng ngoài luồng action.
 * @param {string|null} pointEvent
 * @returns {Promise<{toast: string|null, pointAwarded: boolean}>}
 */
export async function handlePointEvent(pointEvent) {
  if (pointEvent === 'emotional_share') {
    await useAppStore.getState().addConnectionPoint();
    return { toast: '+1 kết nối 💙', pointAwarded: true };
  }
  return { toast: null, pointAwarded: false };
}
