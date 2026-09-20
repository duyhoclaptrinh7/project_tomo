import { NativeModules } from 'react-native';

const { TomoNativeModule } = NativeModules || {};

/**
 * Lớp bridge duy nhất giữa JS và native module Android.
 * Bọc các method native với fallback an toàn khi chạy test hoặc môi trường chưa build native.
 */

/**
 * Kiểm tra xem app đã được cấp quyền overlay (SYSTEM_ALERT_WINDOW) chưa.
 * @returns {Promise<boolean>}
 */
export async function isOverlayPermissionGranted() {
  if (!TomoNativeModule || typeof TomoNativeModule.isOverlayPermissionGranted !== 'function') {
    return false;
  }
  try {
    return Boolean(await TomoNativeModule.isOverlayPermissionGranted());
  } catch (err) {
    console.warn('Lỗi khi kiểm tra overlay permission:', err);
    return false;
  }
}

/**
 * Mở màn hình Cài đặt hệ thống để người dùng cấp quyền overlay cho Tomo.
 * @returns {Promise<boolean>} true nếu mở thành công Intent, ngược lại false.
 */
export async function openOverlaySettings() {
  if (!TomoNativeModule || typeof TomoNativeModule.openOverlaySettings !== 'function') {
    return false;
  }
  try {
    return Boolean(await TomoNativeModule.openOverlaySettings());
  } catch (err) {
    console.warn('Lỗi khi mở cài đặt overlay:', err);
    return false;
  }
}

/**
 * Khởi động foreground service hiển thị chat-head overlay.
 * @returns {Promise<boolean>} true nếu khởi động thành công.
 */
export async function startOverlay() {
  if (!TomoNativeModule || typeof TomoNativeModule.startOverlay !== 'function') {
    return false;
  }
  try {
    return Boolean(await TomoNativeModule.startOverlay());
  } catch (err) {
    console.warn('Lỗi khi khởi động overlay service:', err);
    return false;
  }
}

/**
 * Dừng service chat-head overlay.
 * @returns {Promise<boolean>} true nếu dừng thành công.
 */
export async function stopOverlay() {
  if (!TomoNativeModule || typeof TomoNativeModule.stopOverlay !== 'function') {
    return false;
  }
  try {
    return Boolean(await TomoNativeModule.stopOverlay());
  } catch (err) {
    console.warn('Lỗi khi dừng overlay service:', err);
    return false;
  }
}

/**
 * Mở màn hình chat nổi OverlayChatActivity khi tap chat-head.
 * @returns {Promise<boolean>}
 */
export async function openOverlayChat() {
  if (!TomoNativeModule || typeof TomoNativeModule.openOverlayChat !== 'function') {
    return false;
  }
  try {
    return Boolean(await TomoNativeModule.openOverlayChat());
  } catch (err) {
    console.warn('Lỗi khi mở overlay chat activity:', err);
    return false;
  }
}

/**
 * Đồng bộ animation mở/đóng miệng của chat-head với trạng thái TTS.
 * @param {boolean} isSpeaking
 * @returns {Promise<boolean>}
 */
export async function setOverlaySpeaking(isSpeaking) {
  if (!TomoNativeModule || typeof TomoNativeModule.setOverlaySpeaking !== 'function') {
    return false;
  }
  try {
    return Boolean(await TomoNativeModule.setOverlaySpeaking(Boolean(isSpeaking)));
  } catch (err) {
    console.warn('Lỗi khi cập nhật animation chat-head:', err);
    return false;
  }
}

/** Mở app Đồng hồ/Lịch với dữ liệu đã được người dùng xác nhận. */
export async function openScheduleIntent(schedule) {
  if (!TomoNativeModule || typeof TomoNativeModule.openScheduleIntent !== 'function') return false;
  try {
    const timestamp = Date.parse(schedule?.datetime_iso);
    if (!Number.isFinite(timestamp)) return false;
    return Boolean(
      await TomoNativeModule.openScheduleIntent(schedule.type, schedule.title, timestamp),
    );
  } catch (err) {
    console.warn('Lỗi khi mở app Đồng hồ/Lịch:', err);
    return false;
  }
}

/** Khởi động foreground service theo dõi SCREEN_ON cho phiên focus. */
export async function startFocusSession(durationMinutes, reminders) {
  if (!TomoNativeModule || typeof TomoNativeModule.startFocusSession !== 'function') return false;
  try {
    return Boolean(await TomoNativeModule.startFocusSession(durationMinutes, reminders));
  } catch (err) {
    console.warn('Lỗi khi bắt đầu focus mode:', err);
    return false;
  }
}

/** Dừng hẳn phiên focus và foreground service. */
export async function endFocusSession() {
  if (!TomoNativeModule || typeof TomoNativeModule.endFocusSession !== 'function') return false;
  try {
    return Boolean(await TomoNativeModule.endFocusSession());
  } catch (err) {
    console.warn('Lỗi khi kết thúc focus mode:', err);
    return false;
  }
}

/** Tắt nhắc SCREEN_ON nhưng giữ phiên focus đang hoạt động. */
export async function pauseFocusReminders() {
  if (!TomoNativeModule || typeof TomoNativeModule.pauseFocusReminders !== 'function') return false;
  try {
    return Boolean(await TomoNativeModule.pauseFocusReminders());
  } catch (err) {
    console.warn('Lỗi khi tạm dừng nhắc focus:', err);
    return false;
  }
}

/** Đồng bộ trạng thái focused của chat-head. */
export async function setOverlayFocused(isFocused) {
  if (!TomoNativeModule || typeof TomoNativeModule.setOverlayFocused !== 'function') return false;
  try {
    return Boolean(await TomoNativeModule.setOverlayFocused(Boolean(isFocused)));
  } catch (err) {
    console.warn('Lỗi khi cập nhật trạng thái focus của chat-head:', err);
    return false;
  }
}

/** Mở cài đặt tối ưu pin để người dùng cho phép service chạy ổn định hơn. */
export async function openBatteryOptimizationSettings() {
  if (!TomoNativeModule || typeof TomoNativeModule.openBatteryOptimizationSettings !== 'function') {
    return false;
  }
  try {
    return Boolean(await TomoNativeModule.openBatteryOptimizationSettings());
  } catch (err) {
    console.warn('Lỗi khi mở cài đặt pin:', err);
    return false;
  }
}
