package com.tomo.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
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
}
