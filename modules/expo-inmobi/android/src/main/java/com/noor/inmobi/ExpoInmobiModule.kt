package com.noor.inmobi

import com.inmobi.sdk.InMobiSdk
import com.inmobi.sdk.SdkInitializationListener
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Direct InMobi SDK module — no AdMob / Google Mobile Ads involved.
 * Call [initialize] once (e.g. at app start) with the InMobi Account ID,
 * then render [ExpoInmobiBannerView] with a placement ID.
 */
class ExpoInmobiModule : Module() {
  companion object {
    /** Set true when InMobi SDK init completes successfully. */
    @Volatile var isSdkReady: Boolean = false
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoInmobi")

    Function("initialize") { accountId: String ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("ExpoInmobi: React context not available")
      // Enable debug logging to surface init/load errors in logcat.
      try {
        com.inmobi.sdk.InMobiSdk.setLogLevel(com.inmobi.sdk.LogLevel.DEBUG)
      } catch (_: Exception) { /* older SDK — ignore */ }
      InMobiSdk.init(
        context,
        accountId,
        null,
        object : SdkInitializationListener {
          override fun onInitializationComplete(error: Error?) {
            // SDK ready — banners can load now. Error is null on success.
            isSdkReady = error == null
            if (error != null) {
              android.util.Log.e("ExpoInmobi", "SDK init failed: ${error.message}")
            } else {
              android.util.Log.d("ExpoInmobi", "SDK init success")
            }
          }
        }
      )
    }

    Function("isReady") { isSdkReady }

    View(ExpoInmobiBannerView::class) {
      Prop("placementId") { view: ExpoInmobiBannerView, placementId: Long ->
        view.loadBanner(placementId)
      }
    }
  }
}
