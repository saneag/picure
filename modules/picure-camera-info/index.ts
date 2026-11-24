import { requireOptionalNativeModule } from 'expo';

export interface BackCameraInfo {
  minZoom: number;
  maxZoom: number;
  /** Zoom ratio of each physical lens relative to the main camera, e.g. [0.6, 1, 3, 5]. */
  lensRatios: number[];
}

export interface ExposureRange {
  min: number;
  max: number;
  /** EV per index step. */
  step: number;
  supported: boolean;
}

interface NativeModule {
  getBackCameraInfo(): BackCameraInfo | null;
  getExposureRange(viewTag: number): ExposureRange | null;
  setExposure(viewTag: number, index: number): boolean;
}

const native = requireOptionalNativeModule<NativeModule>('PicureCameraInfo');

/** Returns null when the phone doesn't report camera details. */
export function getBackCameraInfo(): BackCameraInfo | null {
  try {
    return native?.getBackCameraInfo() ?? null;
  } catch {
    return null;
  }
}

/** Exposure range of the running camera preview; null until the camera is ready. */
export function getExposureRange(viewTag: number): ExposureRange | null {
  try {
    return native?.getExposureRange(viewTag) ?? null;
  } catch {
    return null;
  }
}

/** Returns false when the camera isn't ready yet. */
export function setExposure(viewTag: number, index: number): boolean {
  try {
    return native?.setExposure(viewTag, index) ?? false;
  } catch {
    return false;
  }
}
