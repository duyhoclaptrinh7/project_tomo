package com.tomo.app

import android.app.ActivityManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.IBinder

/** Foreground service nhẹ: chỉ nghe SCREEN_ON trong một phiên focus và không gọi mạng. */
class FocusTrackingService : Service() {
    private var remindersEnabled = true
    private var reminders = DEFAULT_REMINDERS
    private var nextReminderIndex = 0
    private var lastReminderAt = 0L
    private var sessionStartedAt = 0L
    private var durationMinutes: Double? = null

    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_SCREEN_ON) handleScreenOn()
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        startForeground(FOREGROUND_NOTIFICATION_ID, buildForegroundNotification())
        val filter = IntentFilter(Intent.ACTION_SCREEN_ON)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(screenReceiver, filter)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_PAUSE_REMINDERS -> remindersEnabled = false
            ACTION_START -> {
                remindersEnabled = true
                sessionStartedAt = intent.getLongExtra(EXTRA_STARTED_AT, System.currentTimeMillis())
                val suppliedDuration = intent.getDoubleExtra(EXTRA_DURATION_MINUTES, -1.0)
                durationMinutes = suppliedDuration.takeIf { it > 0 }
                val supplied = intent.getStringArrayListExtra(EXTRA_REMINDERS).orEmpty()
                reminders = supplied.filter { it.isNotBlank() }.ifEmpty { DEFAULT_REMINDERS }
            }
        }
        return START_STICKY
    }

    private fun handleScreenOn() {
        val now = System.currentTimeMillis()
        val duration = durationMinutes
        if (!remindersEnabled || isTomoInForeground() || now - lastReminderAt < REMINDER_INTERVAL_MS) {
            return
        }

        val openEndedCheckIn = duration == null && now - sessionStartedAt >= OPEN_SESSION_CHECK_IN_MS
        val message = if (openEndedCheckIn && nextReminderIndex % 6 == 5) {
            "Bạn vẫn đang làm chứ? Tomo vẫn đồng hành cùng bạn đây."
        } else {
            reminders[nextReminderIndex % reminders.size]
        }
        nextReminderIndex += 1
        lastReminderAt = now

        if (!OverlayService.showFocusReminder(message)) {
            val manager = getSystemService(NotificationManager::class.java)
            manager?.notify(REMINDER_NOTIFICATION_ID, buildReminderNotification(message))
        }
    }

    private fun isTomoInForeground(): Boolean {
        val manager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return manager.runningAppProcesses.orEmpty().any {
            it.processName == packageName &&
                it.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java) ?: return
        manager.createNotificationChannel(
            NotificationChannel(
                FOREGROUND_CHANNEL_ID,
                "Phiên focus của Tomo",
                NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Giữ phiên đồng hành làm việc đang hoạt động" }
        )
        manager.createNotificationChannel(
            NotificationChannel(
                REMINDER_CHANNEL_ID,
                "Nhắc tập trung",
                NotificationManager.IMPORTANCE_HIGH
            ).apply { description = "Nhắc nhẹ khi bật màn hình trong phiên focus" }
        )
    }

    private fun mainPendingIntent(): PendingIntent {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        return PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )
    }

    private fun notificationBuilder(channel: String): Notification.Builder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(this, channel)
        else @Suppress("DEPRECATION") Notification.Builder(this)

    private fun buildForegroundNotification(): Notification = notificationBuilder(FOREGROUND_CHANNEL_ID)
        .setContentTitle("Tomo đang focus cùng bạn")
        .setContentText("Bật màn hình quá thường xuyên thì Tomo sẽ nhắc nhẹ nhé")
        .setSmallIcon(R.mipmap.ic_launcher_round)
        .setContentIntent(mainPendingIntent())
        .setOngoing(true)
        .build()

    private fun buildReminderNotification(message: String): Notification =
        notificationBuilder(REMINDER_CHANNEL_ID)
            .setContentTitle("Tomo nhắc nhẹ")
            .setContentText(message)
            .setStyle(Notification.BigTextStyle().bigText(message))
            .setSmallIcon(R.mipmap.ic_launcher_round)
            .setContentIntent(mainPendingIntent())
            .setAutoCancel(true)
            .build()

    override fun onDestroy() {
        try {
            unregisterReceiver(screenReceiver)
        } catch (_: Exception) {
            // Receiver có thể chưa đăng ký nếu service bị hệ thống dừng rất sớm.
        }
        super.onDestroy()
    }

    companion object {
        const val ACTION_START = "com.tomo.app.action.START_FOCUS"
        const val ACTION_PAUSE_REMINDERS = "com.tomo.app.action.PAUSE_FOCUS_REMINDERS"
        const val EXTRA_DURATION_MINUTES = "duration_minutes"
        const val EXTRA_REMINDERS = "reminders"
        const val EXTRA_STARTED_AT = "started_at"

        private const val FOREGROUND_CHANNEL_ID = "tomo_focus_service"
        private const val REMINDER_CHANNEL_ID = "tomo_focus_reminders"
        private const val FOREGROUND_NOTIFICATION_ID = 2101
        private const val REMINDER_NOTIFICATION_ID = 2102
        private const val REMINDER_INTERVAL_MS = 5 * 60 * 1000L
        private const val OPEN_SESSION_CHECK_IN_MS = 30 * 60 * 1000L
        private val DEFAULT_REMINDERS = listOf(
            "Đang tập trung mà, cố thêm một chút nhé!",
            "Tomo vẫn ở đây. Quay lại việc đang làm nào!",
            "Đừng để điện thoại kéo mình đi nhé, bạn làm được mà!"
        )
    }
}
