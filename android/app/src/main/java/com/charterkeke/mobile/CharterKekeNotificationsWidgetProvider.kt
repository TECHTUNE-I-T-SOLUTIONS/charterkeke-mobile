package com.charterkeke.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject

class CharterKekeNotificationsWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    appWidgetIds.forEach { appWidgetId ->
      updateWidget(context, appWidgetManager, appWidgetId)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action == ACTION_REFRESH_WIDGET) {
      val manager = AppWidgetManager.getInstance(context)
      val componentName = android.content.ComponentName(context, CharterKekeNotificationsWidgetProvider::class.java)
      manager.getAppWidgetIds(componentName)?.forEach {
        updateWidget(context, manager, it)
      }
    }
  }

  private fun updateWidget(context: Context, manager: AppWidgetManager, appWidgetId: Int) {
    val views = RemoteViews(context.packageName, R.layout.charter_keke_notifications_widget)
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_NOTIFICATIONS, null)
    val notifications = raw?.let { runCatching { JSONArray(it) }.getOrNull() }

    val hasItems = notifications != null && notifications.length() > 0
    views.setTextViewText(
      R.id.notifications_widget_title,
      if (hasItems) "Live notifications" else "Notifications"
    )
    views.setTextViewText(
      R.id.notifications_widget_subtitle,
      if (hasItems) "Tap to open the latest updates" else "Your latest alerts will appear here"
    )

    val slots = intArrayOf(
      R.id.notifications_row_1,
      R.id.notifications_row_2,
      R.id.notifications_row_3
    )
    val titleIds = intArrayOf(
      R.id.notifications_title_1,
      R.id.notifications_title_2,
      R.id.notifications_title_3
    )
    val bodyIds = intArrayOf(
      R.id.notifications_body_1,
      R.id.notifications_body_2,
      R.id.notifications_body_3
    )

    slots.forEachIndexed { index, rowId ->
      val item = notifications?.optJSONObject(index)
      if (item == null) {
        views.setViewVisibility(rowId, android.view.View.GONE)
        return@forEachIndexed
      }

      views.setViewVisibility(rowId, android.view.View.VISIBLE)
      views.setTextViewText(titleIds[index], item.optString("title").ifBlank { "Notification" })
      views.setTextViewText(bodyIds[index], item.optString("body").ifBlank { item.optString("message") })

      val route = item.optString("route").ifBlank { item.optString("deeplink") }
      if (route.isNotBlank()) {
        views.setOnClickPendingIntent(
          rowId,
          pendingIntent(
            context,
            500 + index,
            Intent(Intent.ACTION_VIEW, Uri.parse(route)).apply {
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
              setPackage(context.packageName)
            }
          )
        )
      }
    }

    views.setOnClickPendingIntent(
      R.id.notifications_widget_open,
      pendingIntent(
        context,
        599,
        Intent(Intent.ACTION_VIEW, Uri.parse("charterkeke://rider/booking")).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
          setPackage(context.packageName)
        }
      )
    )

    manager.updateAppWidget(appWidgetId, views)
  }

  private fun pendingIntent(context: Context, requestCode: Int, intent: Intent): PendingIntent {
    return PendingIntent.getActivity(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  companion object {
    private const val ACTION_REFRESH_WIDGET = "com.charterkeke.mobile.REFRESH_WIDGET"
    private const val PREFS_NAME = "charter_keke_widget_store"
    private const val KEY_NOTIFICATIONS = "widget_notifications_data"
  }
}
