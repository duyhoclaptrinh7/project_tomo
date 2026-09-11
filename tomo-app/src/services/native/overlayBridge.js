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
