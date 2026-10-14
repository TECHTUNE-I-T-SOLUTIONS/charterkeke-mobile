package com.droptrack.live

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.graphics.Color
import androidx.core.app.NotificationCompat
import androidx.core.graphics.drawable.IconCompat

object DeliveryNotifier {
    const val CHANNEL_ID = "live-tracking"
    const val TAG = "DropTrack"

    fun ensureChannel(ctx: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Live Tracking", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Ride status updates"
            }
            val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    fun notificationIdFor(activityId: String): Int {
        return activityId.hashCode().let { if (it < 0) -it else it }
    }

    fun post(ctx: Context, activityId: String, orderId: String, status: String, progress: Double, etaEpochMillis: Double, stopsRemaining: Int, courierName: String, riderReassigned: Boolean, ongoing: Boolean) {
        val progressPercent = ((progress.coerceIn(0.0, 1.0)) * 100).toInt()
        val builder = NotificationCompat.Builder(ctx, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(status)
            .setContentText("Order $orderId · $courierName")
            .setSubText("${stopsRemaining} stops away")
            .setOngoing(ongoing)
            .setOnlyAlertOnce(true)
            .setColor(Color.parseColor("#FF6B00"))
            .setShortCriticalText("$progressPercent%")
            .setRequestPromotedOngoing(ongoing)

        if (etaEpochMillis > System.currentTimeMillis()) {
            builder.setWhen(etaEpochMillis.toLong()).setShowWhen(true)
        }

        if (android.os.Build.VERSION.SDK_INT >= 36) {
            val style = NotificationCompat.ProgressStyle()
                .setStyledByProgress(true)
                .setProgress(progressPercent)
                .setProgressTrackerIcon(IconCompat.createWithResource(ctx, android.R.drawable.ic_dialog_info))
                .setProgressSegments(listOf(NotificationCompat.ProgressStyle.Segment(100).setColor(Color.parseColor("#FF6B00"))))
                .setProgressPoints(listOf(NotificationCompat.ProgressStyle.Point(35).setColor(Color.WHITE)))
            builder.setStyle(style)
        } else {
            builder.setProgress(100, progressPercent, false)
        }

        val notification = builder.build()
        val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(notificationIdFor(activityId), notification)
    }

    fun cancel(ctx: Context, activityId: String) {
        val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(notificationIdFor(activityId))
    }
}
