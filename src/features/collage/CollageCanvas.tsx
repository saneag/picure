import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { CollageCell } from './CollageCell';
import {
  CANVAS_ASPECT,
  computeCells,
  computeLayout,
  getLayout,
  MAX_RATIO,
  MIN_RATIO,
  resolveRatios,
  type Split,
} from './layouts';
import type { CollageImage, SlotCount } from './types';

interface CollageCanvasProps {
  layoutId: string;
  slots: (CollageImage | null)[];
  ratios?: number[];
  width: number;
  interactive?: boolean;
  selectedSlot?: number | null;
  addLabel?: string;
  missingLabel?: string;
  onSelect?: (slot: number) => void;
  onRatioChange?: (index: number, ratio: number) => void;
  onTransformEnd?: (
    slot: number,
    transform: { scale: number; offsetX: number; offsetY: number },
  ) => void;
}

/** Draws the collage at any size. The same component renders the editor preview and the export. */
export function CollageCanvas({
  layoutId,
  slots,
  ratios,
  width,
  interactive = false,
  selectedSlot = null,
  addLabel,
  missingLabel,
  onSelect,
  onRatioChange,
  onTransformEnd,
}: CollageCanvasProps) {
  const height = width / CANVAS_ASPECT;
  const layout = getLayout(layoutId, slots.length as SlotCount);
  // While dragging, only this canvas re-renders; the draft is updated once when the drag ends.
  const [live, setLive] = useState<number[] | null>(null);
  const activeRatios = live ?? resolveRatios(layout, ratios);
  const cells = computeCells(layout, width, height, width * 0.008, activeRatios);
  const { splits } = computeLayout(layout.tree, activeRatios);

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
      {interactive && onRatioChange
        ? splits.map((split, index) => (
            <SplitHandle
              key={`split-${index}`}
              split={split}
              width={width}
              height={height}
              onChange={(ratio) => setLive(activeRatios.map((r, i) => (i === index ? ratio : r)))}
              onEnd={(ratio) => {
                onRatioChange(index, ratio);
                setLive(null);
              }}
            />
          ))
        : null}
    </View>
  );
}

const HANDLE_THICKNESS = 36;

/** Draggable divider between two parts of the layout. */
function SplitHandle({
  split,
  width,
  height,
  onChange,
  onEnd,
}: {
  split: Split;
  width: number;
  height: number;
  onChange: (ratio: number) => void;
  onEnd: (ratio: number) => void;
}) {
  const startRatio = useRef(split.ratio);
  const horizontal = split.dir === 'row';
  const areaSize = (horizontal ? split.rect.width * width : split.rect.height * height) || 1;

  const ratioAt = (e: { translationX: number; translationY: number }) => {
    const delta = (horizontal ? e.translationX : e.translationY) / areaSize;
    return Math.min(MAX_RATIO, Math.max(MIN_RATIO, startRatio.current + delta));
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      startRatio.current = split.ratio;
    })
    .onUpdate((e) => onChange(ratioAt(e)))
    .onEnd((e) => onEnd(ratioAt(e)));

  const position = horizontal
    ? {
        left: (split.rect.x + split.rect.width * split.ratio) * width - HANDLE_THICKNESS / 2,
        top: split.rect.y * height,
        width: HANDLE_THICKNESS,
        height: split.rect.height * height,
      }
    : {
        left: split.rect.x * width,
        top: (split.rect.y + split.rect.height * split.ratio) * height - HANDLE_THICKNESS / 2,
        width: split.rect.width * width,
        height: HANDLE_THICKNESS,
      };

  return (
    <GestureDetector gesture={pan}>
      <View style={position} className="absolute items-center justify-center">
        <View
          className={`rounded-full bg-white/90 shadow ${horizontal ? 'h-10 w-1.5' : 'h-1.5 w-10'}`}
        />
      </View>
    </GestureDetector>
  );
}
