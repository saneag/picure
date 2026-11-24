import { useEffect } from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { CollageCell } from './CollageCell';
import {
  CANVAS_ASPECT,
  computeCells,
  MARGIN_FRACTION,
  computeLayout,
  getLayout,
  MAX_RATIO,
  MIN_RATIO,
  resolveRatios,
  type Node,
  type Split,
} from './layouts';
import type { CollageImage, SlotCount } from './types';

interface CollageCanvasProps {
  layoutId: string;
  slots: (CollageImage | null)[];
  ratios?: number[];
  showMargins?: boolean;
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
export function CollageCanvas(props: CollageCanvasProps) {
  const layout = getLayout(props.layoutId, props.slots.length as SlotCount);
  // Remount per layout so the live ratios always match the layout tree.
  return <CanvasBody key={layout.id} {...props} layoutId={layout.id} />;
}

function CanvasBody({
  layoutId,
  slots,
  ratios,
  showMargins = false,
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
  const resolved = resolveRatios(layout, ratios);
  const gap = showMargins ? width * MARGIN_FRACTION : 0;
  const cells = computeCells(layout, width, height, gap, resolved);
  const { splits } = computeLayout(layout.tree, resolved);

  // Dragging a divider only changes this shared value (UI thread); the draft is saved once on release.
  const live = useSharedValue(resolved);
  useEffect(() => {
    live.value = resolved;
  }, [resolved]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ width, height }} className="overflow-hidden bg-white" collapsable={false}>
      {cells.map((rect, index) => (
        <CollageCell
          key={index}
          rect={rect}
          tree={layout.tree}
          ratios={live}
          index={index}
          canvasHeight={height}
          image={slots[index] ?? null}
          canvasWidth={width}
          gap={gap}
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
              tree={layout.tree}
              ratios={live}
              index={index}
              dir={split.dir}
              staticSplit={split}
              width={width}
              height={height}
              onEnd={(ratio) => onRatioChange(index, ratio)}
            />
          ))
        : null}
    </View>
  );
}

const HANDLE_THICKNESS = 36;

function handleFrame(split: Split, width: number, height: number) {
  'worklet';
  return split.dir === 'row'
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
}

/** Draggable divider between two parts of the layout; runs entirely on the UI thread. */
function SplitHandle({
  tree,
  ratios,
  index,
  dir,
  staticSplit,
  width,
  height,
  onEnd,
}: {
  tree: Node;
  ratios: SharedValue<number[]>;
  index: number;
  dir: 'row' | 'col';
  staticSplit: Split;
  width: number;
  height: number;
  onEnd: (ratio: number) => void;
}) {
  const startRatio = useSharedValue(0);
  const horizontal = dir === 'row';

  const ratioAt = (translation: number) => {
    'worklet';
    const split = computeLayout(tree, ratios.value).splits[index];
    const area = (horizontal ? split.rect.width * width : split.rect.height * height) || 1;
    return Math.min(MAX_RATIO, Math.max(MIN_RATIO, startRatio.value + translation / area));
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      startRatio.value = ratios.value[index];
    })
    .onUpdate((e) => {
      const next = ratioAt(horizontal ? e.translationX : e.translationY);
      ratios.value = ratios.value.map((r, i) => (i === index ? next : r));
    })
    .onEnd((e) => {
      scheduleOnRN(onEnd, ratioAt(horizontal ? e.translationX : e.translationY));
    });

  const animated = useAnimatedStyle(() =>
    handleFrame(computeLayout(tree, ratios.value).splits[index], width, height),
  );

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
          handleFrame(staticSplit, width, height),
          animated,
        ]}
      >
        <View
          className={`rounded-full bg-white/90 shadow ${horizontal ? 'h-10 w-1.5' : 'h-1.5 w-10'}`}
        />
      </Animated.View>
    </GestureDetector>
  );
}
