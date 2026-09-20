import { DEFAULT_ANIMATION_STATE } from '../constants/animationMapping.js';
import {
  endFocusSession,
  openScheduleIntent,
  pauseFocusReminders,
  setOverlayFocused,
  startFocusSession,
} from '../services/native/overlayBridge.js';
import { useAppStore } from '../store/useAppStore.js';

const PHASE2_ANIMATIONS = new Set([
  'idle',
  'happy',
  'comfort',
  'focused',
  'speaking',
  'celebrating',
]);

export const FOCUS_REMINDERS = Object.freeze([
  'Đang tập trung mà, cố thêm một chút nhé!',
  'Tomo vẫn ở đây. Quay lại việc đang làm nào!',
  'Một bước nhỏ nữa thôi, đừng để điện thoại kéo mình đi nhé.',
  'Hít thở một nhịp rồi tiếp tục nhé, bạn làm được mà!',
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
    case 'propose_schedule':
    case 'start_focus_session':
      return { pendingAction: action, ...extra };
    case 'pause_focus_reminders': {
      await pauseFocusReminders();
      await useAppStore.getState().patchState({ isFocusRemindersEnabled: false });
      return { animationState: 'focused', toast: 'Đã tạm dừng nhắc focus', ...extra };
    }
    case 'end_focus_session': {
      await endFocusSession();
      await setOverlayFocused(false);
      await useAppStore.getState().patchState({
        isFocusSessionActive: false,
        isFocusRemindersEnabled: false,
      });
      return { animationState: 'celebrating', ...extra };
    }
    default:
      return extra;
  }
}

/** Thực thi action có ảnh hưởng hệ thống sau khi người dùng bấm xác nhận. */
export async function confirmAction(action) {
  if (action?.type === 'propose_schedule') {
    const datetime = Date.parse(action.params?.datetime_iso);
    if (!Number.isFinite(datetime) || datetime <= Date.now()) {
      return { success: false, error: 'Thời gian này đã qua hoặc không hợp lệ.' };
    }
    const opened = await openScheduleIntent(action.params);
    return opened
      ? { success: true, toast: 'Đã mở app hệ thống để bạn kiểm tra và lưu.' }
      : { success: false, error: 'Thiết bị không tìm thấy app Đồng hồ/Lịch phù hợp.' };
  }

  if (action?.type === 'start_focus_session') {
    const duration = action.params?.duration_minutes ?? null;
    const started = await startFocusSession(duration, FOCUS_REMINDERS);
    if (!started) {
      return { success: false, error: 'Focus mode cần bản development build Android.' };
    }
    await setOverlayFocused(true);
    await useAppStore.getState().patchState({
      isFocusSessionActive: true,
      isFocusRemindersEnabled: true,
    });
    return { success: true, animationState: 'focused', toast: 'Phiên focus đã bắt đầu 🎯' };
  }

  return { success: false, error: 'Hành động không hỗ trợ xác nhận.' };
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
