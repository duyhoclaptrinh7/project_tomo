package com.tomo.app

import android.animation.ValueAnimator
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Point
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import kotlin.math.abs
import kotlin.math.hypot

/**
 * Foreground Service hiển thị chat-head nổi trên các ứng dụng khác.
 * Hỗ trợ kéo thả, hút vào cạnh màn hình, vùng hủy "×" và tap để mở OverlayChatActivity.
 */
class OverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var chatHeadView: FrameLayout? = null
    private var closeTargetView: FrameLayout? = null
    private var mascotImageView: ImageView? = null
    private var reminderView: TextView? = null
    private var mascotAnimator: ValueAnimator? = null
    private var speaking = false
    private var focused = false

    private lateinit var chatHeadParams: WindowManager.LayoutParams
    private lateinit var closeTargetParams: WindowManager.LayoutParams

    private var screenWidth = 0
    private var screenHeight = 0
    private var chatHeadSize = 0
    private var closeTargetSize = 0

    companion object {
        private const val NOTIFICATION_CHANNEL_ID = "tomo_overlay_service_channel"
        private const val NOTIFICATION_ID = 2001
        private const val SNAP_MARGIN_DP = 12
        @Volatile private var activeInstance: OverlayService? = null

        fun setSpeakingState(isSpeaking: Boolean): Boolean {
            val service = activeInstance ?: return false
            Handler(Looper.getMainLooper()).post {
                service.updateSpeakingAnimation(isSpeaking)
            }
            return true
        }

        fun setFocusedState(isFocused: Boolean): Boolean {
            val service = activeInstance ?: return false
            Handler(Looper.getMainLooper()).post { service.updateFocusedState(isFocused) }
            return true
        }

        fun showFocusReminder(message: String): Boolean {
            val service = activeInstance ?: return false
            Handler(Looper.getMainLooper()).post { service.showReminderBubble(message) }
            return true
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        activeInstance = this
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        updateScreenDimensions()

        val density = resources.displayMetrics.density
        chatHeadSize = (60 * density).toInt()
        closeTargetSize = (70 * density).toInt()

        startAsForeground()
        createCloseTargetView()
        createChatHeadView()
    }

    private fun updateScreenDimensions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowMetrics = windowManager.currentWindowMetrics
            val insets = windowMetrics.windowInsets.getInsetsIgnoringVisibility(
                android.view.WindowInsets.Type.systemBars()
            )
            screenWidth = windowMetrics.bounds.width()
            screenHeight = windowMetrics.bounds.height() - insets.top - insets.bottom
        } else {
            val size = Point()
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getSize(size)
            screenWidth = size.x
            screenHeight = size.y
        }
    }

    private fun startAsForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Tomo Overlay Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Thông báo duy trì bong bóng nổi Tomo"
                setShowBadge(false)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, NOTIFICATION_CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        val notification = builder
            .setContentTitle("Tomo đang đồng hành")
            .setContentText("Chạm vào bong bóng để trò chuyện cùng Tomo")
            .setSmallIcon(R.mipmap.ic_launcher_round)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    private fun createCloseTargetView() {
        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        closeTargetParams = WindowManager.LayoutParams(
            closeTargetSize,
            closeTargetSize,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            y = (40 * resources.displayMetrics.density).toInt()
        }

        closeTargetView = FrameLayout(this).apply {
            val bg = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#D963406E"))
                setStroke((2 * resources.displayMetrics.density).toInt(), Color.WHITE)
            }
            background = bg

            val textView = TextView(this@OverlayService).apply {
                text = "✕"
                textSize = 24f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
            }
            addView(
                textView,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    Gravity.CENTER
                )
            )
            visibility = View.GONE
        }

        try {
            windowManager.addView(closeTargetView, closeTargetParams)
        } catch (e: Exception) {
            // Log fallback
        }
    }

    private fun createChatHeadView() {
        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        chatHeadParams = WindowManager.LayoutParams(
            chatHeadSize,
            chatHeadSize,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = (SNAP_MARGIN_DP * resources.displayMetrics.density).toInt()
            y = (screenHeight * 0.35).toInt()
        }

        val density = resources.displayMetrics.density
        chatHeadView = FrameLayout(this).apply {
            elevation = 12 * density

            val imageView = ImageView(this@OverlayService).apply {
                try {
                    setImageResource(R.drawable.tomo_mascot_idle)
                } catch (e: Exception) {
                    setImageResource(R.mipmap.ic_launcher_round)
                }
                scaleType = ImageView.ScaleType.FIT_CENTER
            }
            mascotImageView = imageView
            addView(
                imageView,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )
        }

        setupTouchListener()

        try {
            windowManager.addView(chatHeadView, chatHeadParams)
        } catch (e: Exception) {
            stopSelf()
        }
    }

    private fun setupTouchListener() {
        val touchSlop = ViewConfiguration.get(this).scaledTouchSlop
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var isDragging = false
        var touchStartTime = 0L

        chatHeadView?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    updateScreenDimensions()
                    initialX = chatHeadParams.x
                    initialY = chatHeadParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    touchStartTime = System.currentTimeMillis()
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - initialTouchX
                    val dy = event.rawY - initialTouchY

                    if (!isDragging && (abs(dx) > touchSlop || abs(dy) > touchSlop)) {
                        isDragging = true
                        closeTargetView?.visibility = View.VISIBLE
                    }

                    if (isDragging) {
                        chatHeadParams.x = (initialX + dx).toInt()
                        chatHeadParams.y = (initialY + dy).toInt()

                        // Kiểm tra khoảng cách đến vùng close target
                        checkCloseTargetProximity(event.rawX, event.rawY)

                        try {
                            windowManager.updateViewLayout(chatHeadView, chatHeadParams)
                        } catch (e: Exception) {
                            // Ignored
                        }
                    }
                    true
                }

                MotionEvent.ACTION_UP -> {
                    closeTargetView?.visibility = View.GONE

                    if (isDragging) {
                        // Kiểm tra xem người dùng có thả vào vùng hủy "✕" không
                        if (isInCloseTarget(event.rawX, event.rawY)) {
                            stopSelf()
                            return@setOnTouchListener true
                        }

                        // Tự động hút vào cạnh gần nhất (Snap to edge)
                        snapToEdge()
                    } else {
                        // Nhận diện Tap: mở OverlayChatActivity
                        val clickDuration = System.currentTimeMillis() - touchStartTime
                        if (clickDuration < 300) {
                            openOverlayChat()
                        }
                    }
                    true
                }

                else -> false
            }
        }
    }

    private fun checkCloseTargetProximity(rawX: Float, rawY: Float) {
        val closeTargetCenterX = screenWidth / 2f
        val closeTargetCenterY = screenHeight - closeTargetParams.y - (closeTargetSize / 2f)
        val distance = hypot(rawX - closeTargetCenterX, rawY - closeTargetCenterY)

        val threshold = closeTargetSize * 1.2f
        if (distance < threshold) {
            closeTargetView?.scaleX = 1.2f
            closeTargetView?.scaleY = 1.2f
        } else {
            closeTargetView?.scaleX = 1.0f
            closeTargetView?.scaleY = 1.0f
        }
    }

    private fun isInCloseTarget(rawX: Float, rawY: Float): Boolean {
        val closeTargetCenterX = screenWidth / 2f
        val closeTargetCenterY = screenHeight - closeTargetParams.y - (closeTargetSize / 2f)
        val distance = hypot(rawX - closeTargetCenterX, rawY - closeTargetCenterY)
        return distance < closeTargetSize
    }

    private fun snapToEdge() {
        val density = resources.displayMetrics.density
        val margin = (SNAP_MARGIN_DP * density).toInt()

        val currentX = chatHeadParams.x
        val targetX = if (currentX + chatHeadSize / 2 < screenWidth / 2) {
            margin
        } else {
            screenWidth - chatHeadSize - margin
        }

        // Giới hạn Y trong màn hình
        val minY = (20 * density).toInt()
        val maxY = screenHeight - chatHeadSize - (40 * density).toInt()
        chatHeadParams.y = chatHeadParams.y.coerceIn(minY, maxY)

        val animator = ValueAnimator.ofInt(currentX, targetX).apply {
            duration = 200
            interpolator = DecelerateInterpolator()
            addUpdateListener { animation ->
                chatHeadParams.x = animation.animatedValue as Int
                try {
                    windowManager.updateViewLayout(chatHeadView, chatHeadParams)
                } catch (e: Exception) {
                    // Ignored
                }
            }
        }
        animator.start()
    }

    private fun openOverlayChat() {
        val intent = Intent(this, OverlayChatActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_MULTIPLE_TASK or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            )
        }
        startActivity(intent)
    }

    private fun updateSpeakingAnimation(isSpeaking: Boolean) {
        speaking = isSpeaking
        mascotAnimator?.cancel()
        mascotAnimator = null
        mascotImageView?.scaleX = 1f
        mascotImageView?.scaleY = 1f
        updateMascotImage()

        if (!isSpeaking) {
            return
        }

        mascotAnimator = ValueAnimator.ofFloat(0.94f, 1f).apply {
            duration = 180
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.REVERSE
            addUpdateListener { animation ->
                val scale = animation.animatedValue as Float
                mascotImageView?.scaleX = scale
                mascotImageView?.scaleY = scale
            }
            start()
        }
    }

    private fun updateFocusedState(isFocused: Boolean) {
        focused = isFocused
        updateMascotImage()
    }

    private fun updateMascotImage() {
        val drawable = when {
            speaking -> R.drawable.tomo_mascot_laugh
            focused -> R.drawable.tomo_mascot_angry
            else -> R.drawable.tomo_mascot_idle
        }
        mascotImageView?.setImageResource(drawable)
    }

    private fun showReminderBubble(message: String) {
        reminderView?.let {
            try { windowManager.removeView(it) } catch (_: Exception) {}
        }
        val density = resources.displayMetrics.density
        val bubble = TextView(this).apply {
            text = message
            textSize = 14f
            setTextColor(Color.parseColor("#4D3545"))
            setPadding((14 * density).toInt(), (9 * density).toInt(), (14 * density).toInt(), (9 * density).toInt())
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 16 * density
                setColor(Color.parseColor("#FFF9F0"))
                setStroke((1 * density).toInt(), Color.parseColor("#F4B28F"))
            }
        }
        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE
        }
        val params = WindowManager.LayoutParams(
            (260 * density).toInt(),
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = (90 * density).toInt()
        }
        reminderView = bubble
        try {
            windowManager.addView(bubble, params)
            Handler(Looper.getMainLooper()).postDelayed({
                if (reminderView === bubble) {
                    try { windowManager.removeView(bubble) } catch (_: Exception) {}
                    reminderView = null
                }
            }, 4500)
        } catch (_: Exception) {
            reminderView = null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (activeInstance === this) activeInstance = null
        mascotAnimator?.cancel()
        mascotAnimator = null
        mascotImageView = null
        reminderView?.let {
            try { windowManager.removeView(it) } catch (_: Exception) {}
        }
        reminderView = null
        chatHeadView?.let {
            try {
                windowManager.removeView(it)
            } catch (e: Exception) {
                // Ignored
            }
            chatHeadView = null
        }
        closeTargetView?.let {
            try {
                windowManager.removeView(it)
            } catch (e: Exception) {
                // Ignored
            }
            closeTargetView = null
        }
    }
}
