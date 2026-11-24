import { ImagePlus, ImageOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, Text as RNText, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { clampPan, clampScale, coverSize } from './geometry';
import { computeLayout, insetCell, type Node, type Rect } from './layouts';
import type { CollageImage, ImageLabel, LabelPosition, LabelSize } from './types';

const LABEL_FONT_RATIO: Record<LabelSize, number> = { sm: 0.035, md: 0.05, lg: 0.07 };

const LABEL_POSITION_CLASS: Record<LabelPosition, string> = {
  'top-left': 'items-start justify-start',
  'top-center': 'items-center justify-start',
  'top-right': 'items-end justify-start',
  'bottom-left': 'items-start justify-end',
  'bottom-center': 'items-center justify-end',
  'bottom-right': 'items-end justify-end',
};

interface CollageCellProps {
  /** Static position, used for the first frame and for exports. */
  rect: Rect;
  /** Live split ratios (UI thread); the cell follows them while a divider is dragged. */
  tree: Node;
  ratios: SharedValue<number[]>;
  index: number;
  canvasHeight: number;
  image: CollageImage | null;
  /** Width of the whole collage in px; label size scales with it so exports match the preview. */
  canvasWidth: number;
  /** Space between images in px (0 = none). */
  gap: number;
  interactive: boolean;
  selected?: boolean;
  addLabel?: string;
  missingLabel?: string;
  onPress?: () => void;
  onTransformEnd?: (transform: { scale: number; offsetX: number; offsetY: number }) => void;
}

export function CollageCell({
  rect,
  tree,
  ratios,
  index,
  canvasHeight,
  image,
  canvasWidth,
  gap,
  interactive,
  selected,
  addLabel,
  missingLabel,
  onPress,
  onTransformEnd,
}: CollageCellProps) {
  const staticFrame = { left: rect.x, top: rect.y, width: rect.width, height: rect.height };
  const frame = useAnimatedStyle(() => {
    const r = insetCell(
      computeLayout(tree, ratios.value).cells[index],
      canvasWidth,
      canvasHeight,
      gap,
    );
    return { left: r.x, top: r.y, width: r.width, height: r.height };
  });
  const frameStyle = [
    { position: 'absolute' as const, overflow: 'hidden' as const },
    staticFrame,
    frame,
  ];

  if (!image) {
    return (
      <Animated.View style={frameStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          disabled={!interactive}
          onPress={onPress}
          style={{ flex: 1 }}
          className="items-center justify-center gap-1 bg-secondary"
        >
          {interactive ? (
            <>
              <Icon as={ImagePlus} size={28} className="text-muted-foreground" />
              <Text variant="footnote">{addLabel}</Text>
            </>
          ) : null}
          {selected ? <SelectionRing /> : null}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <PhotoCell
      frameStyle={frameStyle}
      tree={tree}
      ratios={ratios}
      index={index}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      gap={gap}
      rect={rect}
      image={image}
      interactive={interactive}
      selected={selected}
      missingLabel={missingLabel}
      onPress={onPress}
      onTransformEnd={onTransformEnd}
    />
  );
}

function SelectionRing() {
  return <View pointerEvents="none" className="absolute inset-0 border-[3px] border-primary" />;
}

interface PhotoCellProps extends CollageCellProps {
  image: CollageImage;
  frameStyle: unknown;
}

function PhotoCell({
  rect,
  frameStyle,
  tree,
  ratios,
  index,
  canvasHeight,
  image,
  canvasWidth,
  gap,
  interactive,
  selected,
  missingLabel,
  onPress,
  onTransformEnd,
}: PhotoCellProps) {
  const [failed, setFailed] = useState(false);

  // Pan is stored as a fraction of the cell size so it stays valid while the cell is resized.
  const scale = useSharedValue(image.scale);
  const tx = useSharedValue(image.offsetX);
  const ty = useSharedValue(image.offsetY);
  const startScale = useSharedValue(1);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);

  useEffect(() => {
    setFailed(false);
    scale.value = image.scale;
    tx.value = image.offsetX;
    ty.value = image.offsetY;
  }, [image.uri, image.scale, image.offsetX, image.offsetY]); // eslint-disable-line react-hooks/exhaustive-deps

  const imageWidth = image.width;
  const imageHeight = image.height;

  const metrics = () => {
    'worklet';
    const r = insetCell(
      computeLayout(tree, ratios.value).cells[index],
      canvasWidth,
      canvasHeight,
      gap,
    );
    const w = r.width;
    const h = r.height;
    const cover = coverSize({ width: imageWidth, height: imageHeight }, { width: w, height: h });
    return { w, h, cover };
  };

  const pan = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      const { w, h, cover } = metrics();
      tx.value = clampPan(startTx.value * w + e.translationX, cover.width, w, scale.value) / w;
      ty.value = clampPan(startTy.value * h + e.translationY, cover.height, h, scale.value) / h;
    })
    .onEnd(() => {
      scheduleOnRN(commit, scale.value, tx.value, ty.value);
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      const { w, h, cover } = metrics();
      const next = clampScale(startScale.value * e.scale);
      scale.value = next;
      tx.value = clampPan(tx.value * w, cover.width, w, next) / w;
      ty.value = clampPan(ty.value * h, cover.height, h, next) / h;
    })
    .onEnd(() => {
      scheduleOnRN(commit, scale.value, tx.value, ty.value);
    });

  const commit = (nextScale: number, x: number, y: number) =>
    onTransformEnd?.({ scale: nextScale, offsetX: x, offsetY: y });

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (success && onPress) scheduleOnRN(onPress);
  });

  const gesture = Gesture.Race(tap, Gesture.Simultaneous(pan, pinch));

  // The image view keeps the size it had when first shown and follows the cell via transforms.
  // The anchor only changes with the photo or canvas size, so releasing a divider causes no jump.
  const anchorKey = `${image.uri}|${canvasWidth}|${canvasHeight}|${gap}`;
  const anchorRef = useRef<{ key: string; rect: Rect } | null>(null);
  if (anchorRef.current?.key !== anchorKey) anchorRef.current = { key: anchorKey, rect };
  const anchor = anchorRef.current.rect;
  const base = coverSize(image, anchor);
  const imageStyle = useAnimatedStyle(() => {
    const { w, h, cover } = metrics();
    const fit = cover.width / base.width;
    return {
      transform: [
        {
          translateX: (w - anchor.width) / 2 + clampPan(tx.value * w, cover.width, w, scale.value),
        },
        {
          translateY:
            (h - anchor.height) / 2 + clampPan(ty.value * h, cover.height, h, scale.value),
        },
        { scale: scale.value * fit },
      ],
    };
  });

  const content = (
    <Animated.View style={frameStyle as never}>
      <View style={{ flex: 1 }} className="overflow-hidden bg-secondary">
        {failed ? (
          <View className="absolute inset-0 items-center justify-center gap-1 px-2">
            <Icon as={ImageOff} size={26} className="text-muted-foreground" />
            <Text variant="footnote" className="text-center">
              {missingLabel}
            </Text>
          </View>
        ) : (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: base.width,
                height: base.height,
                left: (anchor.width - base.width) / 2,
                top: (anchor.height - base.height) / 2,
              },
              imageStyle,
            ]}
          >
            <Image
              source={{ uri: image.uri }}
              style={{ width: '100%', height: '100%' }}
              onError={() => setFailed(true)}
            />
          </Animated.View>
        )}
        <LabelOverlay label={image.label} canvasWidth={canvasWidth} />
        {selected ? <SelectionRing /> : null}
      </View>
    </Animated.View>
  );

  if (!interactive) return content;
  return <GestureDetector gesture={gesture}>{content}</GestureDetector>;
}

function LabelOverlay({ label, canvasWidth }: { label: ImageLabel; canvasWidth: number }) {
  if (!label.text.trim()) return null;
  return (
    <View
      pointerEvents="none"
      style={{ padding: canvasWidth * 0.025 }}
      className={`absolute inset-0 ${LABEL_POSITION_CLASS[label.position]}`}
    >
      <RNText
        style={{
          color: label.color,
          fontSize: canvasWidth * LABEL_FONT_RATIO[label.size],
          fontWeight: '700',
          textShadowColor: label.color === '#000000' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }}
      >
        {label.text}
      </RNText>
    </View>
  );
}
