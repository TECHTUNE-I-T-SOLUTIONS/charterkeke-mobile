package com.droptrack.live

import android.content.Context
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DroptrackLiveModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("DroptrackLive")

        Function("isSupported") {
            Build.VERSION.SDK_INT >= 36
        }

        AsyncFunction("startDelivery") { info: Map<String, Any>, state: Map<String, Any> ->
            val activityId = info["orderId"] as? String ?: ""
            DeliveryNotifier.ensureChannel(context)
            DeliveryNotifier.post(
                ctx = context,
                activityId = activityId,
                orderId = info["orderId"] as? String ?: "",
                status = state["status"] as? String ?: "Broadcasting",
                progress = (state["progress"] as? Double ?: 0.0),
                etaEpochMillis = (state["etaEpochMillis"] as? Double ?: 0.0),
                stopsRemaining = (state["stopsRemaining"] as? Int ?: 0),
                courierName = state["courierName"] as? String ?: "",
                riderReassigned = (state["riderReassigned"] as? Boolean ?: false),
                ongoing = true
            )
            activityId
        }

        AsyncFunction("updateDelivery") { id: String, state: Map<String, Any> ->
            DeliveryNotifier.post(
                ctx = context,
                activityId = id,
                orderId = id,
                status = state["status"] as? String ?: "",
                progress = (state["progress"] as? Double ?: 0.0),
                etaEpochMillis = (state["etaEpochMillis"] as? Double ?: 0.0),
                stopsRemaining = (state["stopsRemaining"] as? Int ?: 0),
                courierName = state["courierName"] as? String ?: "",
                riderReassigned = (state["riderReassigned"] as? Boolean ?: false),
                ongoing = true
            )
        }

        AsyncFunction("endDelivery") { id: String, state: Map<String, Any>, dismissAfterSeconds: Double ->
            DeliveryNotifier.post(
                ctx = context,
                activityId = id,
                orderId = id,
                status = state["status"] as? String ?: "Completed",
                progress = (state["progress"] as? Double ?: 1.0),
                etaEpochMillis = (state["etaEpochMillis"] as? Double ?: 0.0),
                stopsRemaining = 0,
                courierName = state["courierName"] as? String ?: "",
                riderReassigned = false,
                ongoing = false
            )
            if (dismissAfterSeconds > 0) {
                android.os.Handler().postDelayed({
                    DeliveryNotifier.cancel(context, id)
                }, (dismissAfterSeconds * 1000).toLong())
            }
        }

        Function("areActivitiesEnabled") {
            if (Build.VERSION.SDK_INT >= 36) {
                val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
                try {
                    manager.canPostPromotedNotifications()
                } catch (e: Exception) {
                    false
                }
            } else false
        }

        AsyncFunction("requestPromotedPermission") {
            if (Build.VERSION.SDK_INT < 36) return false
            // Check if already granted
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            try {
                if (manager.canPostPromotedNotifications()) return true
            } catch (e: Exception) {}
            // Not granted — open the system Promoted Notifications settings so user can toggle it.
            // We cannot directly request it as a runtime dialog; it is a Settings toggle on Android 16.
            try {
                val intent = android.content.Intent("android.settings.MANAGE_APP_PROMOTED_NOTIFICATIONS").apply {
                    putExtra("android.provider.extra.APP_PACKAGE", context.packageName)
                    addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            } catch (e: Exception) {
                // Fallback: open app notification settings
                try {
                    val fallback = android.content.Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                        putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, context.packageName)
                        addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(fallback)
                } catch (_: Exception) {}
            }
            return false
        }

        Function("hasPromotableCharacteristics") { notificationId: Int ->
            false
        }
    }
}
