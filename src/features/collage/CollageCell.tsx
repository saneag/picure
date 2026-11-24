import { ImagePlus, ImageOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text as RNText, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { clampPan, clampScale, coverSize } from './geometry';
import type { Rect } from './layouts';
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
  rect: Rect;
  image: CollageImage | null;
  /** Width of the whole collage in px; label size scales with it so exports match the preview. */
  canvasWidth: number;
  interactive: boolean;
  selected?: boolean;
  addLabel?: string;
  missingLabel?: string;
  onPress?: () => void;
  onTransformEnd?: (transform: { scale: number; offsetX: number; offsetY: number }) => void;
}

export function CollageCell({
  rect,
  image,
  canvasWidth,
  interactive,
  selected,
  addLabel,
  missingLabel,
  onPress,
  onTransformEnd,
}: CollageCellProps) {
  const frame = { left: rect.x, top: rect.y, width: rect.width, height: rect.height };

  if (!image) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={addLabel}
        disabled={!interactive}
        onPress={onPress}
        style={frame}
        className="absolute items-center justify-center gap-1 bg-secondary"
      >
        {interactive ? (
          <>
            <Icon as={ImagePlus} size={28} className="text-muted-foreground" />
            <Text variant="footnote">{addLabel}</Text>
          </>
        ) : null}
        {selected ? <SelectionRing /> : null}
      </Pressable>
    );
  }

  return (
    <PhotoCell
      frame={frame}
      rect={rect}
      image={image}
      canvasWidth={canvasWidth}
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

interface PhotoCellProps extends Omit<CollageCellProps, 'image'> {
  image: CollageImage;
  frame: { left: number; top: number; width: number; height: number };
}

function PhotoCell({
  frame,
  rect,
  image,
  canvasWidth,
  interactive,
  selected,
  missingLabel,
  onPress,
  onTransformEnd,
}: PhotoCellProps) {
  const [failed, setFailed] = useState(false);
  const cover = coverSize(image, rect);

  const scale = useSharedValue(image.scale);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);

  // Re-sync when the collage changes (replace, undo, layout switch changes the cell size).
  useEffect(() => {
    setFailed(false);
    scale.value = image.scale;
    tx.value = clampPan(image.offsetX * rect.width, cover.width, rect.width, image.scale);
    ty.value = clampPan(image.offsetY * rect.height, cover.height, rect.height, image.scale);
  }, [image.uri, image.scale, image.offsetX, image.offsetY, rect.width, rect.height]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (nextScale: number, x: number, y: number) =>
    onTransformEnd?.({ scale: nextScale, offsetX: x / rect.width, offsetY: y / rect.height });

  const cw = cover.width;
  const ch = cover.height;
  const cellW = rect.width;
  const cellH = rect.height;

  const pan = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = clampPan(startTx.value + e.translationX, cw, cellW, scale.value);
      ty.value = clampPan(startTy.value + e.translationY, ch, cellH, scale.value);
    })
    .onEnd(() => {
      scheduleOnRN(commit, scale.value, tx.value, ty.value);
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      const next = clampScale(startScale.value * e.scale);
      scale.value = next;
      tx.value = clampPan(tx.value, cw, cellW, next);
      ty.value = clampPan(ty.value, ch, cellH, next);
    })
    .onEnd(() => {
      scheduleOnRN(commit, scale.value, tx.value, ty.value);
    });

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (success && onPress) scheduleOnRN(onPress);
  });

  const gesture = Gesture.Race(tap, Gesture.Simultaneous(pan, pinch));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const content = (
    <View style={frame} className="absolute overflow-hidden bg-secondary">
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
              width: cover.width,
              height: cover.height,
              left: (rect.width - cover.width) / 2,
              top: (rect.height - cover.height) / 2,
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
