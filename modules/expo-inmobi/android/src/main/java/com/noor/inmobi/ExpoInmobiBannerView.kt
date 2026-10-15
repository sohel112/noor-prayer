package com.noor.inmobi

import android.content.Context
import android.util.Log
import android.view.ViewGroup
import com.inmobi.ads.AdMetaInfo
import com.inmobi.ads.InMobiAdRequestStatus
import com.inmobi.ads.InMobiBanner
import com.inmobi.ads.listeners.BannerAdEventListener
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Native banner view backed directly by InMobi's [InMobiBanner].
 * Standard 320x50 banner, centered. Loads once per placement ID.
 */
class ExpoInmobiBannerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  private var banner: InMobiBanner? = null
  private var loadedPlacementId: Long = -1L

  private var retryCount = 0

  fun loadBanner(placementId: Long) {
    if (placementId <= 0L) return
    // Already loaded (or loading) this placement — skip duplicates.
    if (placementId == loadedPlacementId) return

    // InMobi SDK must finish initializing before creating banner objects.
    // If not ready yet, retry a few times instead of crashing.
    if (!ExpoInmobiModule.isSdkReady) {
      if (retryCount < 10) {
        retryCount++
        postDelayed({ loadBanner(placementId) }, 1000)
      } else {
        Log.w(TAG, "InMobi SDK not ready after 10s, giving up (placement=$placementId)")
      }
      return
    }
    retryCount = 0
    loadedPlacementId = placementId

    // Clean up any previous banner for this view.
    banner?.let { removeView(it) }
    banner = null

    // Standard 320x50 banner size, centered horizontally.
    val density = resources.displayMetrics.density
    val widthPx = (320 * density).toInt()
    val heightPx = (50 * density).toInt()
    val params = LayoutParams(widthPx, heightPx)

    // InMobi SDK is not thread-safe — create the banner on the UI thread.
    post {
      val bannerAd = try {
        InMobiBanner(context, placementId)
      } catch (e: Exception) {
        Log.w(TAG, "InMobiBanner creation failed: ${e.message}")
        loadedPlacementId = -1L
        return@post
      }
      bannerAd.setListener(object : BannerAdEventListener() {
      override fun onAdLoadSucceeded(banner: InMobiBanner, adMetaInfo: AdMetaInfo) {
        Log.d(TAG, "InMobi banner loaded (placement=$placementId)")
        bannerAd.visibility = VISIBLE
      }

      override fun onAdLoadFailed(banner: InMobiBanner, status: InMobiAdRequestStatus) {
        Log.w(TAG, "InMobi banner failed (placement=$placementId): ${status.message}")
        bannerAd.visibility = GONE
      }

      override fun onAdClicked(banner: InMobiBanner, params: Map<Any, Any>) {
        Log.d(TAG, "InMobi banner clicked")
      }

      override fun onAdDisplayed(banner: InMobiBanner) {
        Log.d(TAG, "InMobi banner displayed")
      }

      override fun onAdDismissed(banner: InMobiBanner) {
        Log.d(TAG, "InMobi banner dismissed")
      }

      override fun onUserLeftApplication(banner: InMobiBanner) {
        Log.d(TAG, "InMobi banner: user left application")
      }

      override fun onRewardsUnlocked(banner: InMobiBanner, rewards: Map<Any, Any>) {
        // Banners don't use rewards; no-op.
      }

      override fun onAdImpression(banner: InMobiBanner) {
        Log.d(TAG, "InMobi banner impression")
      }
    })

      // Add with LayoutParams in one call (ensures proper measurement).
      addView(bannerAd, params)
      banner = bannerAd
      bannerAd.load()
    }
  }

  override fun onDetachedFromWindow() {
    try {
      banner?.destroy()
    } catch (_: Exception) {
      // destroy() may not exist on all SDK versions — safe to ignore.
    } finally {
      banner = null
      loadedPlacementId = -1L
    }
    super.onDetachedFromWindow()
  }

  companion object {
    private const val TAG = "ExpoInmobiBanner"
  }
}
