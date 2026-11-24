import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { newId } from '@/lib/id';
import { getDefaultLayoutId, getLayout } from './layouts';
import {
  DEFAULT_LABEL,
  EMPTY_PATIENT,
  type CollageDraft,
  type CollageImage,
  type ImageLabel,
  type ImageSource,
  type PatientInfo,
  type SavedCollage,
  type SlotCount,
} from './types';

export interface NewImage {
  uri: string;
  assetId: string | null;
  source: ImageSource;
  width: number;
  height: number;
}

const MAX_SLOTS = 4;
const DEFAULT_SLOT_COUNT: SlotCount = 2;

function blankDraft(): CollageDraft {
  return {
    id: null,
    patient: { ...EMPTY_PATIENT },
    layoutId: getDefaultLayoutId(DEFAULT_SLOT_COUNT),
    slots: Array.from({ length: DEFAULT_SLOT_COUNT }, () => null),
  };
}

function createImage(source: NewImage, label: ImageLabel = DEFAULT_LABEL): CollageImage {
  return { id: newId(), ...source, scale: 1, offsetX: 0, offsetY: 0, label };
}

interface DraftContextValue {
  draft: CollageDraft | null;
  /** True when the draft differs from what was last loaded or saved. */
  isDirty: boolean;
  startNew: () => void;
  startFrom: (saved: SavedCollage) => void;
  clear: () => void;
  markSaved: () => void;
  setSlotCount: (count: SlotCount) => void;
  setLayout: (layoutId: string) => void;
  setPatient: (patient: PatientInfo) => void;
  /**
   * With `slot`: puts the first image into that slot (replacing it).
   * Without: fills empty slots in order, adding slots (up to 4) when needed.
   * Returns how many images were placed.
   */
  placeImages: (images: NewImage[], slot?: number) => number;
  clearSlot: (slot: number) => void;
  updateImage: (
    slot: number,
    patch: Partial<Pick<CollageImage, 'scale' | 'offsetX' | 'offsetY'>>,
  ) => void;
  updateLabel: (slot: number, label: ImageLabel) => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

/**
 * Holds the collage currently being edited. Lives above all screens so the gallery
 * picker and the camera can add photos to the open collage and then go back.
 */
export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CollageDraft | null>(null);
  const baseline = useRef('');

  const begin = useCallback((next: CollageDraft) => {
    baseline.current = JSON.stringify(next);
    setDraft(next);
  }, []);

  const update = useCallback((fn: (current: CollageDraft) => CollageDraft) => {
    setDraft((current) => (current ? fn(current) : current));
  }, []);

  const value = useMemo<DraftContextValue>(
    () => ({
      draft,
      isDirty: draft ? JSON.stringify(draft) !== baseline.current : false,
      startNew: () => begin(blankDraft()),
      startFrom: (saved) =>
        begin({
          id: saved.id,
          patient: saved.patient,
          layoutId: saved.layoutId,
          slots: saved.slots,
        }),
      clear: () => setDraft(null),
      markSaved: () => {
        if (draft) baseline.current = JSON.stringify(draft);
      },

      setSlotCount: (count) =>
        update((current) => {
          const slots = Array.from({ length: count }, (_, i) => current.slots[i] ?? null);
          return { ...current, slots, layoutId: getLayout(current.layoutId, count).id };
        }),

      setLayout: (layoutId) => update((current) => ({ ...current, layoutId })),
      setPatient: (patient) => update((current) => ({ ...current, patient })),

      placeImages: (images, slot) => {
        if (!draft || images.length === 0) return 0;
        const slots = [...draft.slots];
        let placed = 0;
        if (slot !== undefined) {
          slots[slot] = createImage(images[0], slots[slot]?.label);
          placed = 1;
        } else {
          for (const image of images) {
            let target = slots.findIndex((s) => s === null);
            if (target === -1 && slots.length < MAX_SLOTS) {
              slots.push(null);
              target = slots.length - 1;
            }
            if (target === -1) break;
            slots[target] = createImage(image);
            placed++;
          }
        }
        const layoutId = getLayout(draft.layoutId, slots.length as SlotCount).id;
        setDraft({ ...draft, slots, layoutId });
        return placed;
      },

      clearSlot: (slot) =>
        update((current) => ({
          ...current,
          slots: current.slots.map((image, i) => (i === slot ? null : image)),
        })),

      updateImage: (slot, patch) =>
        update((current) => ({
          ...current,
          slots: current.slots.map((image, i) =>
            i === slot && image ? { ...image, ...patch } : image,
          ),
        })),

      updateLabel: (slot, label) =>
        update((current) => ({
          ...current,
          slots: current.slots.map((image, i) =>
            i === slot && image ? { ...image, label } : image,
          ),
        })),
    }),
    [draft, begin, update],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const context = useContext(DraftContext);
  if (!context) throw new Error('useDraft must be used inside DraftProvider');
  return context;
}
