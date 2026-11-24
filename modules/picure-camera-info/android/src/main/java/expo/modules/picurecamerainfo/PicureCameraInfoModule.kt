package expo.modules.picurecamerainfo

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Range
import android.util.Rational
import android.view.View
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.hypot
import kotlin.math.round

/**
 * Reads the back camera's zoom range and the zoom ratio of each physical lens
 * (ultra wide, wide, telephoto...) from Android's Camera2 API. No permission needed.
 */
class PicureCameraInfoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PicureCameraInfo")

    Function("getBackCameraInfo") {
      val context = appContext.reactContext ?: return@Function null
      readBackCamera(context)
    }

    // expo-camera ships precompiled, so its CameraX objects are reached by reflection.
    Function("getExposureRange") { viewTag: Int ->
      val state = cameraCall(viewTag, "getCameraInfo")?.let { call(it, "getExposureState") }
        ?: return@Function null
      @Suppress("UNCHECKED_CAST")
      val range = call(state, "getExposureCompensationRange") as Range<Int>
      val step = call(state, "getExposureCompensationStep") as Rational
      mapOf(
        "min" to range.lower,
        "max" to range.upper,
        "step" to step.toDouble(),
        "supported" to (call(state, "isExposureCompensationSupported") as Boolean),
      )
    }

    Function("setExposure") { viewTag: Int, index: Int ->
      val control = cameraCall(viewTag, "getCameraControl") ?: return@Function false
      control.javaClass.getMethod("setExposureCompensationIndex", Int::class.java)
        .invoke(control, index)
      true
    }
  }

  private fun call(target: Any, method: String): Any? =
    target.javaClass.getMethod(method).invoke(target)

  private fun cameraCall(viewTag: Int, method: String): Any? {
    val view = appContext.findView<View>(viewTag) ?: return null
    val camera = call(view, "getCamera") ?: return null
    return call(camera, method)
  }

  private fun readBackCamera(context: Context): Map<String, Any>? {
    val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    val logicalId = manager.cameraIdList.firstOrNull {
      manager.getCameraCharacteristics(it).get(CameraCharacteristics.LENS_FACING) ==
        CameraCharacteristics.LENS_FACING_BACK
    } ?: return null
    val logical = manager.getCameraCharacteristics(logicalId)

    var minZoom = 1.0
    var maxZoom = 1.0
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      logical.get(CameraCharacteristics.CONTROL_ZOOM_RATIO_RANGE)?.let {
        minZoom = it.lower.toDouble()
        maxZoom = it.upper.toDouble()
      }
    }
    if (maxZoom <= 1.0) {
      maxZoom = logical.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM)?.toDouble() ?: 1.0
    }

    // Each lens's field of view, relative to the main camera's, gives its zoom ratio.
    val mainEquivalent = equivalentFocalLength(logical)
    val lensRatios = mutableListOf<Double>()
    if (mainEquivalent != null) {
      for (id in logical.physicalCameraIds) {
        val equivalent = equivalentFocalLength(manager.getCameraCharacteristics(id)) ?: continue
        lensRatios.add(round(equivalent / mainEquivalent * 10) / 10)
      }
    }

    return mapOf(
      "minZoom" to minZoom,
      "maxZoom" to maxZoom,
      "lensRatios" to lensRatios.distinct().sorted(),
    )
  }

  /** Focal length converted to its full-frame (35 mm) equivalent so different sensors compare. */
  private fun equivalentFocalLength(characteristics: CameraCharacteristics): Double? {
    val focal = characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)
      ?.firstOrNull() ?: return null
    val sensor = characteristics.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE) ?: return null
    val diagonal = hypot(sensor.width.toDouble(), sensor.height.toDouble())
    return focal * FULL_FRAME_DIAGONAL_MM / diagonal
  }

  private companion object {
    const val FULL_FRAME_DIAGONAL_MM = 43.27
  }
}
