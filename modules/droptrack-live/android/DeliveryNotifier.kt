package com.droptrack.live

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.graphics.drawable.IconCompat

object DeliveryNotifier {
    const val CHANNEL_ID = "live-tracking"
    const val TAG = "DropTrack"

    // Brand — Charter Keke orange
    private val BRAND_ORANGE = Color.parseColor("#F5820B")
    private val BRAND_DARK = Color.parseColor("#AF6401")
    private val TRACK_BG = Color.parseColor("#E8DCC8")
    private val WHITE_DOT = Color.WHITE

    fun ensureChannel(ctx: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            // If channel already exists, keep it (importance is immutable until reinstall).
            // We create with HIGH — must NOT be IMPORTANCE_MIN per live-update spec.
            val existing = manager.getNotificationChannel(CHANNEL_ID)
            if (existing != null) return
            val channel = NotificationChannel(CHANNEL_ID, "Live Tracking", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Real-time ride status — promoted to lock screen and status-bar chip"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 200, 100, 200)
                setShowBadge(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            manager.createNotificationChannel(channel)
        }
    }

    fun notificationIdFor(activityId: String): Int {
        return activityId.hashCode().let { if (it < 0) -it else it }.takeIf { it != 0 } ?: activityId.length * 31
    }

    private fun trackerIconFor(ctx: Context, status: String): IconCompat {
        // Per docs "Use the tracker icon to visualize the state. This can be updated dynamically."
        // We map ride stage to a meaningful icon. These built-ins are available on every device;
        // the wrapper can overlay a custom vector (ic_tracker_keke) when present.
        val resId = try {
            // Prefer custom Charter Keke tracker if bundled via wrapper; fallback to platform icon
            val custom = ctx.resources.getIdentifier("ic_tracker_keke", "drawable", ctx.packageName)
            if (custom != 0) custom else pickFallbackIcon(status)
        } catch (_: Exception) {
            pickFallbackIcon(status)
        }
        return IconCompat.createWithResource(ctx, resId)
    }

    private fun pickFallbackIcon(status: String): Int {
        return when (status.lowercase()) {
            "rerouting", "thinking" -> android.R.drawable.ic_menu_compass
            "broadcasting", "searching", "pending", "dispatched" -> android.R.drawable.ic_search_category_default
            "driver on the way", "accepted" -> android.R.drawable.ic_menu_mylocation
            "en route", "in_progress", "in progress" -> android.R.drawable.ic_menu_directions
            "arriving", "almost-finished", "very-close", "very-close-to-finish" -> android.R.drawable.ic_menu_send
            "completed", "complete" -> android.R.drawable.ic_menu_compass
            else -> android.R.drawable.ic_dialog_info
        }
    }

    fun post(
        ctx: Context,
        activityId: String,
        orderId: String,
        status: String,
        progress: Double,
        etaEpochMillis: Double,
        stopsRemaining: Int,
        courierName: String,
        riderReassigned: Boolean,
        ongoing: Boolean
    ) {
        val progressPercent = ((progress.coerceIn(0.0, 1.0)) * 100).toInt()
        val lowerStatus = status.lowercase()
        val isRerouting = lowerStatus == "rerouting" || lowerStatus == "thinking" || (etaEpochMillis == 0.0 && progressPercent in 1..99 && ongoing)

        // ----- Short-critical chip text (status-bar) — keep <7 chars when possible per chip spec -----
        // Docs: "Use setShortCriticalText or setWhen to convey critical state" — chip max 96dp, truncates otherwise.
        val shortCritical: String? = when {
            isRerouting -> null // no chip text during rerouting — tracker alone per Figure 4
            lowerStatus in listOf("broadcasting", "searching", "pending", "dispatched") -> "Finding"
            lowerStatus == "accepted" || lowerStatus == "driver on the way" -> if (stopsRemaining > 0) "${stopsRemaining + 1} stops" else "On the way"
            lowerStatus == "en route" || lowerStatus == "in_progress" -> if (etaEpochMillis > System.currentTimeMillis()) {
                val mins = ((etaEpochMillis - System.currentTimeMillis()) / 60000).toInt().coerceAtLeast(1)
                "${mins} min"
            } else "En route"
            lowerStatus == "completed" -> "Done"
            else -> "$progressPercent%"
        }

        // ----- expanded content (promoted card: Expanded by default, Uncollapsible per spec) -----
        // Must be Standard/BigText/Progress/Metric style — we use ProgressStyle (best for rideshare).
        // Must have contentTitle, must be ongoing, must request promoted, no customContentView, not colorized.
        val title = when {
            isRerouting -> "Rerouting…"
            lowerStatus == "broadcasting" || lowerStatus == "pending" || lowerStatus == "dispatched" -> "Looking for a driver…"
            lowerStatus == "accepted" || lowerStatus == "driver on the way" -> "Driver is on the way"
            lowerStatus == "en route" || lowerStatus == "in_progress" -> "Ride in progress"
            lowerStatus == "completed" -> "Ride completed"
            else -> status
        }

        val body = when {
            isRerouting -> "Updating route…"
            riderReassigned && courierName.isNotBlank() -> "New driver $courierName • ${stopsRemaining} stop${if (stopsRemaining == 1) "" else "s"} away"
            courierName.isNotBlank() && !courierName.equals("Searching…", true) -> "$courierName • $orderId"
            else -> "Order $orderId"
        }

        val subText = when {
            isRerouting -> null
            etaEpochMillis > System.currentTimeMillis() -> {
                val fmt = android.text.format.DateFormat.getTimeFormat(ctx)
                "ETA ${fmt.format(java.util.Date(etaEpochMillis.toLong()))}"
            }
            progressPercent >= 100 -> "Arrived"
            else -> null
        }

        val builder = NotificationCompat.Builder(ctx, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // status-bar chip icon (indeterminate state per Figure 5)
            .setContentTitle(title) // REQUIRED for promotion
            .setContentText(body)
            .setOngoing(ongoing) // REQUIRED for promotion
            .setOnlyAlertOnce(true) // don't re-buzz on every progress tick
            .setAutoCancel(!ongoing) // keep until ride ends
            .setColor(BRAND_ORANGE) // not colorized (setColorized false is default)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

        try {
            builder.setRequestPromotedOngoing(ongoing)
        } catch (_: Throwable) {}

        if (shortCritical != null) {
            try {
                builder.setShortCriticalText(shortCritical)
            } catch (_: Throwable) {}
        }
        // "when" drives the chip countdown (Figure 6/7). Only set if ≥2 min in future per docs, else chip shows icon only.
        if (etaEpochMillis > System.currentTimeMillis() + 90_000 && !isRerouting) {
            builder.setWhen(etaEpochMillis.toLong()).setShowWhen(true)
            builder.setUsesChronometer(false)
        } else {
            builder.setShowWhen(false)
        }

        if (subText != null) builder.setSubText(subText)

        if (Build.VERSION.SDK_INT >= 36) {
            // 4-stage ride lifecycle as segmented bar — mirrors JetSnack reference (4 segments, 3 dividers)
            // Segments are spans; points are milestone dots at boundaries.
            val segments = listOf(
                NotificationCompat.ProgressStyle.Segment(25).setColor(BRAND_ORANGE),
                NotificationCompat.ProgressStyle.Segment(25).setColor(BRAND_ORANGE),
                NotificationCompat.ProgressStyle.Segment(25).setColor(BRAND_ORANGE),
                NotificationCompat.ProgressStyle.Segment(25).setColor(BRAND_DARK)
            )
            val points = listOf(
                NotificationCompat.ProgressStyle.Point(25).setColor(WHITE_DOT),
                NotificationCompat.ProgressStyle.Point(50).setColor(WHITE_DOT),
                NotificationCompat.ProgressStyle.Point(75).setColor(WHITE_DOT)
            )
            val style = NotificationCompat.ProgressStyle()
                .setStyledByProgress(true)
                .setProgress(if (isRerouting) 0 else progressPercent)
                .setProgressTrackerIcon(trackerIconFor(ctx, if (isRerouting) "rerouting" else status))
                .setProgressSegments(segments)
                .setProgressPoints(points)
            builder.setStyle(style)
            if (isRerouting) {
                builder.setContentText("Recalculating route. Your driver location is being updated.")
            }
        } else {
            // Pre-36 fallback: classic determinate progress bar (still gets high-priority heads-up)
            builder.setProgress(100, if (isRerouting) 0 else progressPercent, isRerouting)
        }

        val notification = builder.build()

        // Promotion diagnostics — only signal that matters per docs
        if (Build.VERSION.SDK_INT >= 36) {
            try {
                @Suppress("DEPRECATION")
                val hasPromotable = notification.hasPromotableCharacteristics()
                val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                val canPost = runCatching { manager.canPostPromotedNotifications() }.getOrDefault(false)
                val isPromoted = (notification.flags and Notification.FLAG_PROMOTED_ONGOING) != 0
                android.util.Log.d(
                    TAG,
                    "live-update id=${notificationIdFor(activityId)} title=$title p=$progressPercent% rerouting=$isRerouting " +
                        "hasPromotable=$hasPromotable canPost=$canPost isPromoted=$isPromoted ongoing=$ongoing chip=${shortCritical ?: "—"}"
                )
                if (!hasPromotable) {
                    android.util.Log.w(TAG, "hasPromotableCharacteristics=false — check: title/ongoing/promotionRequest/colorized/channelImportance")
                }
                if (hasPromotable && !canPost) {
                    android.util.Log.w(TAG, "canPostPromotedNotifications=false — user disabled Live Updates in Settings → Notifications → Charter Keke → Live updates")
                }
            } catch (e: Exception) {
                android.util.Log.w(TAG, "promotion check failed", e)
            }
        }

        val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(notificationIdFor(activityId), notification)
    }

    fun cancel(ctx: Context, activityId: String) {
        val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(notificationIdFor(activityId))
    }
}
