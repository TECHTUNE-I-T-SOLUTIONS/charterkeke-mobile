package com.charterkeke.mobile

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetStorageModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "WidgetStorage"

  @ReactMethod
  fun setItem(key: String, value: String, promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      prefs.edit().putString(key, value).apply()
      refreshWidget()
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("WIDGET_STORAGE_SET_FAILED", error)
    }
  }

  @ReactMethod
  fun getItem(key: String, promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      promise.resolve(prefs.getString(key, null))
    } catch (error: Exception) {
      promise.reject("WIDGET_STORAGE_GET_FAILED", error)
    }
  }

  @ReactMethod
  fun refreshWidget(promise: Promise) {
    try {
      refreshWidget()
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("WIDGET_STORAGE_REFRESH_FAILED", error)
    }
  }

  private fun refreshWidget() {
    val manager = AppWidgetManager.getInstance(reactContext)
    val componentName = ComponentName(reactContext, CharterKekeWidgetProvider::class.java)
    val intent = Intent(reactContext, CharterKekeWidgetProvider::class.java).apply {
      action = "com.charterkeke.mobile.REFRESH_WIDGET"
    }
    reactContext.sendBroadcast(intent)
    manager.notifyAppWidgetViewDataChanged(manager.getAppWidgetIds(componentName), android.R.id.content)
  }

  companion object {
    private const val PREFS_NAME = "charter_keke_widget_store"
  }
}
