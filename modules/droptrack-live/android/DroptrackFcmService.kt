package com.droptrack.live

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.util.Log

class DroptrackFcmService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        Log.i(DeliveryNotifier.TAG, "[DropTrack] FCM token: $token")
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val d = message.data
        val activityId = d["activityId"] ?: return
        val event = d["event"] ?: "update"
        DeliveryNotifier.ensureChannel(this)
        DeliveryNotifier.post(
            ctx = this,
            activityId = activityId,
            orderId = d["orderId"] ?: "",
            status = d["status"] ?: "",
            progress = d["progress"]?.toDoubleOrNull() ?: 0.0,
            etaEpochMillis = d["etaEpochMillis"]?.toDoubleOrNull() ?: 0.0,
            stopsRemaining = d["stopsRemaining"]?.toIntOrNull() ?: 0,
            courierName = d["courierName"] ?: "",
            riderReassigned = d["riderReassigned"]?.toBoolean() ?: false,
            ongoing = event != "end"
        )
    }
}
