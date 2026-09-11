package com.tomo.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import org.json.JSONObject
import java.io.File

/**
 * BroadcastReceiver nhận sự kiện BOOT_COMPLETED sau khi thiết bị khởi động lại.
 * Tự động khôi phục OverlayService nếu người dùng đã bật overlay và đã hoàn tất onboarding.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action != Intent.ACTION_BOOT_COMPLETED && action != "android.intent.action.QUICKBOOT_POWERON") {
            return
        }

        try {
            // Kiểm tra quyền SYSTEM_ALERT_WINDOW
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
                return
            }

            // Đọc trạng thái từ app_state.json
            val stateFile = File(context.filesDir, "app_state.json")
            if (!stateFile.exists()) return

            val jsonContent = stateFile.readText()
            val state = JSONObject(jsonContent)
            val onboarded = state.optBoolean("onboarded", false)
            val isOverlayEnabled = state.optBoolean("isOverlayEnabled", false)

            // Chỉ tự động bật lại nếu đã hoàn tất onboarding và người dùng đang bật overlay
            if (onboarded && isOverlayEnabled) {
                val serviceIntent = Intent(context, OverlayService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            }
        } catch (e: Exception) {
            // Bắt ngoại lệ để tránh crash ứng dụng khi nhận broadcast hệ thống
        }
    }
}
