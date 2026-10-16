package com.noor.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * JS bridge for the Deen home-screen widget.
 *
 * The widget itself is driven by [PrayerWidgetProvider], which reads the
 * snapshot JSON written by JS `refreshWidgetData()`. Call [updateWidget]
 * right after refreshing the snapshot to re-render every placed widget
 * instance immediately (instead of waiting for the periodic update).
 */
class ExpoPrayerWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoPrayerWidget")

    /**
     * Broadcast APPWIDGET_UPDATE to [PrayerWidgetProvider] so all widget
     * instances re-read the snapshot and redraw now.
     * Returns true when at least one widget instance exists.
     */
    Function("updateWidget") {
      val context = appContext.reactContext ?: return@Function false
      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, PrayerWidgetProvider::class.java)
      val ids = manager.getAppWidgetIds(component)
      if (ids.isEmpty()) return@Function false
      val intent = Intent(context, PrayerWidgetProvider::class.java).apply {
        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
      }
      context.sendBroadcast(intent)
      true
    }
  }
}
