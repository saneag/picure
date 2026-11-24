export type ImageSource = 'gallery' | 'camera';

export type LabelPosition =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type LabelSize = 'sm' | 'md' | 'lg';

/** Text drawn on top of one image, e.g. "Before" or "After 2 sessions". */
export interface ImageLabel {
  text: string;
  color: string;
  size: LabelSize;
  position: LabelPosition;
}

export interface CollageImage {
  id: string;
  /** gallery: the original gallery URI (never copied). camera: private app storage URI. */
  uri: string;
  /** MediaStore id for gallery images, null for camera photos. */
  assetId: string | null;
  source: ImageSource;
  width: number;
  height: number;
  /** Zoom on top of the "cover" fit. 1 = image just covers its cell. */
  scale: number;
  /** Pan, as a fraction of the cell size (resolution independent). */
  offsetX: number;
  offsetY: number;
  label: ImageLabel;
}

export interface PatientInfo {
  name: string;
  email: string;
  phone: string;
  description: string;
  procedureCount: number;
}

export type SlotCount = 1 | 2 | 3 | 4;

/** A collage being edited. `id` is null until it is saved for the first time. */
export interface CollageDraft {
  id: string | null;
  patient: PatientInfo;
  layoutId: string;
  /** One entry per slot; null means the slot is still empty. */
  slots: (CollageImage | null)[];
}

export interface SavedCollage {
  id: string;
  patient: PatientInfo;
  layoutId: string;
  slots: (CollageImage | null)[];
  /** Rendered collage image in private app storage. */
  renderedUri: string;
  createdAt: number;
  updatedAt: number;
}

export const EMPTY_PATIENT: PatientInfo = {
  name: '',
  email: '',
  phone: '',
  description: '',
  procedureCount: 1,
};

export const LABEL_COLORS = ['#FFFFFF', '#000000', '#0A84FF', '#FF453A', '#30D158', '#FFD60A'];

export const DEFAULT_LABEL: ImageLabel = {
  text: '',
  color: '#FFFFFF',
  size: 'md',
  position: 'bottom-left',
};
