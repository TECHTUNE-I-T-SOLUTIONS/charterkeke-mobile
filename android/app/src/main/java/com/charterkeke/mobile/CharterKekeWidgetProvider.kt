package com.charterkeke.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject

class CharterKekeWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    appWidgetIds.forEach { appWidgetId ->
      updateWidget(context, appWidgetManager, appWidgetId)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action == ACTION_REFRESH_WIDGET) {
      val manager = AppWidgetManager.getInstance(context)
      val componentName = ComponentName(context, CharterKekeWidgetProvider::class.java)
      manager.getAppWidgetIds(componentName)?.forEach {
        updateWidget(context, manager, it)
      }
    }
  }

  private fun updateWidget(context: Context, manager: AppWidgetManager, appWidgetId: Int) {
    val views = RemoteViews(context.packageName, R.layout.charter_keke_widget)
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val riderJson = prefs.getString(KEY_RIDER, null)
    val driverJson = prefs.getString(KEY_DRIVER, null)

    val riderState = riderJson?.let { runCatching { JSONObject(it) }.getOrNull() }
    val driverState = driverJson?.let { runCatching { JSONObject(it) }.getOrNull() }

    val recentRoutes = riderState?.optJSONArray("recentRoutes")
    val availableRides = driverState?.optJSONArray("availableRides")

    val title = when {
      hasItems(availableRides) -> "Driver Quick View"
      hasItems(recentRoutes) -> "Recent Rides"
      else -> "Charter Keke"
    }
    val subtitle = when {
      hasItems(availableRides) -> "Available rides and accepted jobs"
      hasItems(recentRoutes) -> "Recent routes and quick booking shortcuts"
      else -> "Quick rider and driver actions"
    }

    views.setTextViewText(R.id.widget_title, title)
    views.setTextViewText(R.id.widget_subtitle, subtitle)

    val primaryLabel = riderState?.optString("primaryAction") ?: "Book Ride"
    val secondaryLabel = driverState?.optString("primaryAction") ?: "Available Rides"
    views.setTextViewText(R.id.widget_primary_action, primaryLabel)
    views.setTextViewText(R.id.widget_secondary_action, secondaryLabel)

    val primaryIntent = when {
      hasItems(recentRoutes) -> {
        val route = recentRoutes?.optJSONObject(0)
        val payload = route?.optJSONObject("routeData")?.toString()
        makeDeepLinkIntent(context, "charterkeke://rider/booking${if (!payload.isNullOrBlank()) "?routeData=${Uri.encode(payload)}" else ""}")
      }
      else -> makeDeepLinkIntent(context, "charterkeke://rider/booking")
    }
    val secondaryIntent = when {
      hasItems(availableRides) -> {
        val ride = availableRides?.optJSONObject(0)
        val rideId = ride?.optString("id")
        makeDeepLinkIntent(context, if (!rideId.isNullOrBlank()) "charterkeke://driver/ride-details?rideId=$rideId" else "charterkeke://driver/available-rides")
      }
      else -> makeDeepLinkIntent(context, "charterkeke://driver/available-rides")
    }

    views.setOnClickPendingIntent(R.id.widget_primary_action, pendingIntent(context, 201, primaryIntent))
    views.setOnClickPendingIntent(R.id.widget_secondary_action, pendingIntent(context, 202, secondaryIntent))

    bindRoutesSection(context, views, recentRoutes, available = false)
    bindRoutesSection(context, views, availableRides, available = true)

    manager.updateAppWidget(appWidgetId, views)
  }

  private fun bindRoutesSection(
    context: Context,
    views: RemoteViews,
    items: JSONArray?,
    available: Boolean
  ) {
    val ids = if (available) DRIVER_ROWS else RIDER_ROWS
    val titleIds = if (available) DRIVER_ROW_TITLES else RIDER_ROW_TITLES
    val subtitleIds = if (available) DRIVER_ROW_SUBTITLES else RIDER_ROW_SUBTITLES
    val prefix = if (available) "charterkeke://driver/ride-details?rideId=" else "charterkeke://rider/booking?routeData="

    ids.forEachIndexed { index, rowId ->
      val item = items?.optJSONObject(index)
      val titleId = titleIds[index]
      val subtitleId = subtitleIds[index]

      if (item == null) {
        views.setViewVisibility(rowId, android.view.View.GONE)
        return@forEachIndexed
      }

      val title = if (available) {
        buildRideTitle(item)
      } else {
        buildRouteTitle(item)
      }
      val subtitle = if (available) {
        buildRideSubtitle(item)
      } else {
        buildRouteSubtitle(item)
      }

      views.setViewVisibility(rowId, android.view.View.VISIBLE)
      views.setTextViewText(titleId, title)
      views.setTextViewText(subtitleId, subtitle)

      val uri = if (available) {
        item.optString("id").takeIf { it.isNotBlank() }?.let { "$prefix${Uri.encode(it)}" }
      } else {
        item.optJSONObject("routeData")?.toString()?.takeIf { it.isNotBlank() }?.let { "$prefix${Uri.encode(it)}" }
      }

      if (!uri.isNullOrBlank()) {
        views.setOnClickPendingIntent(rowId, pendingIntent(context, 300 + index + if (available) 10 else 0, makeDeepLinkIntent(context, uri)))
      }
    }
  }

  private fun buildRouteTitle(item: JSONObject): String {
    val pickup = item.optString("pickup").ifBlank { "Recent route" }
    val dropoff = item.optString("dropoff").ifBlank { item.optString("destination") }
    return if (dropoff.isBlank()) pickup else "$pickup to $dropoff"
  }

  private fun buildRouteSubtitle(item: JSONObject): String {
    val routeType = item.optString("type").ifBlank { "Recent booking" }
    val savedAt = item.optString("savedAt")
    return listOf(routeType, savedAt).filter { it.isNotBlank() }.joinToString(" - ")
  }

  private fun buildRideTitle(item: JSONObject): String {
    val pickup = item.optString("pickup").ifBlank { "Available ride" }
    val dropoff = item.optString("dropoff").ifBlank { item.optString("destination") }
    return if (dropoff.isBlank()) pickup else "$pickup to $dropoff"
  }

  private fun buildRideSubtitle(item: JSONObject): String {
    val fare = item.optString("fare").ifBlank { item.optString("price") }
    val status = item.optString("status").ifBlank { "Open" }
    val fareLabel = fare.takeIf { it.isNotBlank() }?.let { "N$it" }
    return listOf(status, fareLabel).filterNotNull().joinToString(" - ")
  }

  private fun hasItems(array: JSONArray?): Boolean {
    return array != null && array.length() > 0
  }

  private fun makeDeepLinkIntent(context: Context, uri: String): Intent {
    return Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      setPackage(context.packageName)
    }
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
    private const val KEY_RIDER = "widget_rider_data"
    private const val KEY_DRIVER = "widget_driver_data"
    private val RIDER_ROWS = intArrayOf(R.id.widget_rider_row_1, R.id.widget_rider_row_2, R.id.widget_rider_row_3)
    private val RIDER_ROW_TITLES = intArrayOf(R.id.widget_rider_title_1, R.id.widget_rider_title_2, R.id.widget_rider_title_3)
    private val RIDER_ROW_SUBTITLES = intArrayOf(R.id.widget_rider_subtitle_1, R.id.widget_rider_subtitle_2, R.id.widget_rider_subtitle_3)
    private val DRIVER_ROWS = intArrayOf(R.id.widget_driver_row_1, R.id.widget_driver_row_2, R.id.widget_driver_row_3)
    private val DRIVER_ROW_TITLES = intArrayOf(R.id.widget_driver_title_1, R.id.widget_driver_title_2, R.id.widget_driver_title_3)
    private val DRIVER_ROW_SUBTITLES = intArrayOf(R.id.widget_driver_subtitle_1, R.id.widget_driver_subtitle_2, R.id.widget_driver_subtitle_3)
  }
}
