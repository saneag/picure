import { View } from 'react-native';
import { CollageCell } from './CollageCell';
import { CANVAS_ASPECT, computeCells, getLayout } from './layouts';
import type { CollageImage, SlotCount } from './types';

interface CollageCanvasProps {
  layoutId: string;
  slots: (CollageImage | null)[];
  width: number;
  interactive?: boolean;
  selectedSlot?: number | null;
  addLabel?: string;
  missingLabel?: string;
  onSelect?: (slot: number) => void;
  onTransformEnd?: (
    slot: number,
    transform: { scale: number; offsetX: number; offsetY: number },
  ) => void;
}

/** Draws the collage at any size. The same component renders the editor preview and the export. */
export function CollageCanvas({
  layoutId,
  slots,
  width,
  interactive = false,
  selectedSlot = null,
  addLabel,
  missingLabel,
  onSelect,
  onTransformEnd,
}: CollageCanvasProps) {
  const height = width / CANVAS_ASPECT;
  const layout = getLayout(layoutId, slots.length as SlotCount);
  const cells = computeCells(layout, width, height, width * 0.008);

  return (
    <View style={{ width, height }} className="overflow-hidden bg-white" collapsable={false}>
      {cells.map((rect, index) => (
        <CollageCell
          key={index}
          rect={rect}
          image={slots[index] ?? null}
          canvasWidth={width}
          interactive={interactive}
          selected={interactive && selectedSlot === index}
          addLabel={addLabel}
          missingLabel={missingLabel}
          onPress={() => onSelect?.(index)}
          onTransformEnd={(transform) => onTransformEnd?.(index, transform)}
        />
      ))}
    </View>
  );
}
