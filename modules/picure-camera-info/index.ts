import { requireOptionalNativeModule } from 'expo';

export interface BackCameraInfo {
  minZoom: number;
  maxZoom: number;
  /** Zoom ratio of each physical lens relative to the main camera, e.g. [0.6, 1, 3, 5]. */
  lensRatios: number[];
}

interface NativeModule {
  getBackCameraInfo(): BackCameraInfo | null;
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
