package com.tomo.app

import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import org.json.JSONObject
import java.io.File

/**
 * Activity hiển thị màn hình chat nổi nền trong suốt khi người dùng chạm vào chat-head.
 * Kế thừa ReactActivity để tái sử dụng toàn bộ stack React Native (ChatScreen).
 */
class OverlayChatActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_App_Translucent)
        window.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        super.onCreate(null)

        // Nếu chưa hoàn thành onboarding, đóng màn chat nổi và đưa về MainActivity
        try {
            val stateFile = File(filesDir, "app_state.json")
            if (stateFile.exists()) {
                val state = JSONObject(stateFile.readText())
                if (!state.optBoolean("onboarded", false)) {
                    val mainIntent = Intent(this, MainActivity::class.java).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    }
                    startActivity(mainIntent)
                    finish()
                    return
                }
            }
        } catch (e: Exception) {
            // Ignored
        }
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                fabricEnabled
            ) {
                override fun createRootView(): com.facebook.react.ReactRootView {
                    return requireNotNull(super.createRootView()).apply {
                        setBackgroundColor(Color.TRANSPARENT)
                    }
                }

                override fun getLaunchOptions(): Bundle {
                    return Bundle().apply {
                        putBoolean("isOverlayMode", true)
                    }
                }
            }
        )
    }
}
