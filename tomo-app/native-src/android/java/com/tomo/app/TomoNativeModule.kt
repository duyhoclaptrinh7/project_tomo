package com.tomo.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.AlarmClock
import android.provider.CalendarContract
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import java.io.File

/**
 * Bridge Native Module kết nối JavaScript với các API hệ thống Android.
 * Quản lý quyền overlay, khởi động/dừng OverlayService và mở OverlayChatActivity.
 */
class TomoNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "TomoNativeModule"

    /**
     * Kiểm tra xem ứng dụng đã được cấp quyền SYSTEM_ALERT_WINDOW chưa.
     */
    @ReactMethod
    fun isOverlayPermissionGranted(promise: Promise) {
        try {
            val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(reactApplicationContext)
            } else {
                true
            }
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("ERR_OVERLAY_PERMISSION", "Không thể kiểm tra quyền overlay: ${e.message}", e)
        }
    }

    /**
     * Mở màn hình Cài đặt hệ thống để người dùng cấp quyền hiển thị trên ứng dụng khác.
     */
    @ReactMethod
    fun openOverlaySettings(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${reactApplicationContext.packageName}")
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERR_OPEN_SETTINGS", "Không thể mở cài đặt overlay: ${e.message}", e)
        }
    }

    /**
     * Khởi động OverlayService để hiển thị chat-head nổi.
     * Bắt buộc người dùng phải hoàn thành onboarding trước khi bật overlay.
     */
    @ReactMethod
    fun startOverlay(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(reactApplicationContext)) {
                promise.resolve(false)
                return
            }

            // Kiểm tra trạng thái onboarded ở tầng native
            val stateFile = File(reactApplicationContext.filesDir, "app_state.json")
            if (stateFile.exists()) {
                val state = JSONObject(stateFile.readText())
                if (!state.optBoolean("onboarded", false)) {
                    promise.resolve(false)
                    return
                }
            }

            val intent = Intent(reactApplicationContext, OverlayService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_START_OVERLAY", "Không thể khởi động overlay service: ${e.message}", e)
        }
    }

    /**
     * Dừng OverlayService, đóng chat-head.
     */
    @ReactMethod
    fun stopOverlay(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java)
            val stopped = reactApplicationContext.stopService(intent)
            promise.resolve(stopped)
        } catch (e: Exception) {
            promise.reject("ERR_STOP_OVERLAY", "Không thể dừng overlay service: ${e.message}", e)
        }
    }

    /**
     * Mở màn hình chat nổi OverlayChatActivity khi người dùng chạm vào chat-head.
     */
    @ReactMethod
    fun openOverlayChat(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayChatActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_OPEN_CHAT", "Không thể mở overlay chat activity: ${e.message}", e)
        }
    }

    /** Đồng bộ trạng thái TTS với animation miệng của chat-head nếu overlay đang chạy. */
    @ReactMethod
    fun setOverlaySpeaking(isSpeaking: Boolean, promise: Promise) {
        try {
            promise.resolve(OverlayService.setSpeakingState(isSpeaking))
        } catch (e: Exception) {
            promise.reject("ERR_OVERLAY_ANIMATION", "Không thể cập nhật animation chat-head: ${e.message}", e)
        }
    }

    /** Hiển thị trạng thái focus trên chat-head nếu overlay đang chạy. */
    @ReactMethod
    fun setOverlayFocused(isFocused: Boolean, promise: Promise) {
        promise.resolve(OverlayService.setFocusedState(isFocused))
    }

    /** Mở Intent chuẩn của app Đồng hồ hoặc Lịch sau bước xác nhận phía JS. */
    @ReactMethod
    fun openScheduleIntent(type: String, title: String, datetimeMs: Double, promise: Promise) {
        try {
            val timestamp = datetimeMs.toLong()
            val calendar = java.util.Calendar.getInstance().apply { timeInMillis = timestamp }
            val intent = when (type) {
                "alarm" -> Intent(AlarmClock.ACTION_SET_ALARM).apply {
                    putExtra(AlarmClock.EXTRA_MESSAGE, title)
                    putExtra(AlarmClock.EXTRA_HOUR, calendar.get(java.util.Calendar.HOUR_OF_DAY))
                    putExtra(AlarmClock.EXTRA_MINUTES, calendar.get(java.util.Calendar.MINUTE))
                    putExtra(AlarmClock.EXTRA_SKIP_UI, false)
                }
                "calendar_event" -> Intent(Intent.ACTION_INSERT).apply {
                    data = CalendarContract.Events.CONTENT_URI
                    putExtra(CalendarContract.Events.TITLE, title)
                    putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, timestamp)
                    putExtra(CalendarContract.EXTRA_EVENT_END_TIME, timestamp + 60 * 60 * 1000L)
                }
                else -> {
                    promise.resolve(false)
                    return
                }
            }.apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_OPEN_SCHEDULE", "Không thể mở app Đồng hồ/Lịch: ${e.message}", e)
        }
    }

    /** Bắt đầu hoặc bật lại nhắc cho foreground focus service. */
    @ReactMethod
    fun startFocusSession(durationMinutes: Double?, reminders: ReadableArray, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FocusTrackingService::class.java).apply {
                action = FocusTrackingService.ACTION_START
                putExtra(FocusTrackingService.EXTRA_STARTED_AT, System.currentTimeMillis())
                durationMinutes?.let { putExtra(FocusTrackingService.EXTRA_DURATION_MINUTES, it) }
                putStringArrayListExtra(
                    FocusTrackingService.EXTRA_REMINDERS,
                    ArrayList((0 until reminders.size()).mapNotNull { reminders.getString(it) })
                )
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_START_FOCUS", "Không thể bắt đầu focus mode: ${e.message}", e)
        }
    }

    /** Tắt nhắc nhưng giữ foreground service và phiên focus. */
    @ReactMethod
    fun pauseFocusReminders(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, FocusTrackingService::class.java).apply {
                action = FocusTrackingService.ACTION_PAUSE_REMINDERS
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_PAUSE_FOCUS", "Không thể tạm dừng nhắc focus: ${e.message}", e)
        }
    }

    /** Dừng hẳn foreground focus service. */
    @ReactMethod
    fun endFocusSession(promise: Promise) {
        try {
            reactApplicationContext.stopService(
                Intent(reactApplicationContext, FocusTrackingService::class.java)
            )
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_END_FOCUS", "Không thể kết thúc focus mode: ${e.message}", e)
        }
    }

    /** Mở trang tối ưu pin chung, tránh yêu cầu quyền bỏ qua pin trực tiếp trong MVP. */
    @ReactMethod
    fun openBatteryOptimizationSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_BATTERY_SETTINGS", "Không thể mở cài đặt pin: ${e.message}", e)
        }
    }
}
