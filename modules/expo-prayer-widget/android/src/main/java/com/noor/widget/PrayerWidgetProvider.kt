package com.noor.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Build
import android.widget.RemoteViews
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Home-screen widget for the Deen app: next prayer name, live countdown,
 * and Hijri date.
 *
 * Data source: the JS side writes a snapshot JSON via `refreshWidgetData()`
 * (see src/lib/widgetData.ts) to AsyncStorage under key [SNAPSHOT_KEY].
 * On Android, @react-native-async-storage/async-storage persists into the
 * "RKStorage" store, so this provider reads it directly:
 *   1. SharedPreferences file "RKStorage" (legacy layout), then
 *   2. SQLite database "RKStorage", table "catalystLocalStorage" (current layout).
 *
 * The snapshot's `nextPrayerAt` ISO timestamp is used to compute a fresh
 * countdown at each update; `countdownText` is only a fallback.
 * If no snapshot exists yet, the widget prompts the user to open the app.
 */
class PrayerWidgetProvider : AppWidgetProvider() {

  /** Parsed widget snapshot. */
  private data class Snapshot(
    val nextPrayerName: String,
    val nextPrayerAt: String?,
    val countdownText: String?,
    val hijriDate: String?,
  )

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    for (appWidgetId in appWidgetIds) {
      updateWidget(context, appWidgetManager, appWidgetId)
    }
  }

  private fun updateWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
  ) {
    val views = RemoteViews(context.packageName, R.layout.widget_prayer)
    val snapshot = readSnapshot(context)

    if (snapshot == null) {
      views.setTextViewText(R.id.widget_prayer_name, "Deen")
      views.setTextViewText(R.id.widget_countdown, "--:--:--")
      views.setTextViewText(R.id.widget_hijri_date, "Open the app to set up prayer times")
    } else {
      views.setTextViewText(
        R.id.widget_prayer_name,
        "Next: ${snapshot.nextPrayerName.replaceFirstChar { it.uppercase() }}",
      )
      views.setTextViewText(R.id.widget_countdown, countdownFor(snapshot))
      views.setTextViewText(R.id.widget_hijri_date, snapshot.hijriDate ?: "")
    }

    // Tapping the widget opens the app.
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    val pendingIntent = PendingIntent.getActivity(context, 0, launchIntent, flags)
    views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

    appWidgetManager.updateAppWidget(appWidgetId, views)
  }

  /** Fresh HH:MM:SS countdown from `nextPrayerAt`; falls back to stored text. */
  private fun countdownFor(snapshot: Snapshot): String {
    val at = snapshot.nextPrayerAt?.let { parseIso(it) }
    if (at != null) {
      val remainingSec = ((at.time - System.currentTimeMillis()) / 1000).coerceAtLeast(0)
      val h = remainingSec / 3600
      val m = (remainingSec % 3600) / 60
      val s = remainingSec % 60
      return "%02d:%02d:%02d".format(h, m, s)
    }
    return snapshot.countdownText ?: "--:--:--"
  }

  private fun parseIso(iso: String): Date? {
    val formats = listOf(
      "yyyy-MM-dd'T'HH:mm:ss.SSSX",
      "yyyy-MM-dd'T'HH:mm:ssX",
    )
    for (pattern in formats) {
      try {
        return SimpleDateFormat(pattern, Locale.US).apply {
          timeZone = TimeZone.getTimeZone("UTC")
        }.parse(iso)
      } catch (_: Exception) {
        // try next pattern
      }
    }
    return null
  }

  companion object {
    /** AsyncStorage key written by JS `refreshWidgetData()`. */
    const val SNAPSHOT_KEY = "noor.widget.v1"

    /** AsyncStorage store name on Android. */
    private const val RK_STORAGE = "RKStorage"

    /**
     * Read the latest snapshot, trying SharedPreferences first (legacy
     * AsyncStorage layout) then the SQLite database (current layout).
     * Returns null when nothing has been written yet.
     */
    private fun readSnapshot(context: Context): Snapshot? {
      readFromSharedPrefs(context)?.let { return it }
      return readFromDatabase(context)
    }

    private fun readFromSharedPrefs(context: Context): Snapshot? {
      return try {
        val prefs = context.getSharedPreferences(RK_STORAGE, Context.MODE_PRIVATE)
        val raw = prefs.getString(SNAPSHOT_KEY, null) ?: return null
        parseSnapshot(raw)
      } catch (_: Exception) {
        null
      }
    }

    private fun readFromDatabase(context: Context): Snapshot? {
      var db: android.database.sqlite.SQLiteDatabase? = null
      return try {
        val dbFile = context.getDatabasePath(RK_STORAGE)
        if (!dbFile.exists()) return null
        db = android.database.sqlite.SQLiteDatabase.openDatabase(
          dbFile.absolutePath, null, android.database.sqlite.SQLiteDatabase.OPEN_READONLY,
        )
        db.rawQuery(
          "SELECT value FROM catalystLocalStorage WHERE key = ? LIMIT 1",
          arrayOf(SNAPSHOT_KEY),
        ).use { cursor ->
          if (cursor.moveToFirst()) parseSnapshot(cursor.getString(0)) else null
        }
      } catch (_: Exception) {
        null
      } finally {
        try { db?.close() } catch (_: Exception) { }
      }
    }

    private fun parseSnapshot(raw: String): Snapshot? {
      return try {
        val json = JSONObject(raw)
        Snapshot(
          nextPrayerName = json.optString("nextPrayerName", "prayer"),
          nextPrayerAt = json.optString("nextPrayerAt", null),
          countdownText = json.optString("countdownText", null),
          hijriDate = json.optString("hijriDate", null),
        )
      } catch (_: Exception) {
        null
      }
    }
  }
}
