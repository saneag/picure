import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Modal, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { clampPan, clampScale, coverSize } from './geometry';
import type { CollageImage } from './types';

export interface PhotoTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface PhotoFitEditorProps {
  image: CollageImage | null;
  /** Width / height of the collage cell the photo has to fill. */
  aspect: number;
  title: string;
  resetLabel: string;
  doneLabel: string;
  cancelLabel: string;
  onApply: (transform: PhotoTransform) => void;
  onClose: () => void;
}

const FRAME_COLOR = '#0A84FF';

/** Full-screen editor: move and zoom the photo behind a frame shaped like its collage cell. */
export function PhotoFitEditor({
  image,
  aspect,
  title,
  resetLabel,
  doneLabel,
  cancelLabel,
  onApply,
  onClose,
}: PhotoFitEditorProps) {
  const insets = useSafeAreaInsets();
  // The frame is sized from the measured stage, so nothing shifts after the first layout.
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const maxWidth = Math.max(0, stage.width - 32);
  const maxHeight = Math.max(0, stage.height - 32);
  const frameW = Math.min(maxWidth, maxHeight * aspect);
  const frameH = frameW / aspect;

  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);

  useEffect(() => {
    if (!image) return;
    scale.value = image.scale;
    tx.value = image.offsetX;
    ty.value = image.offsetY;
  }, [image?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const imageWidth = image?.width ?? 1;
  const imageHeight = image?.height ?? 1;
  const cover = coverSize(
    { width: imageWidth, height: imageHeight },
    { width: frameW, height: frameH },
  );

  const pan = Gesture.Pan()
    .onStart(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value =
        clampPan(startTx.value * frameW + e.translationX, cover.width, frameW, scale.value) /
        frameW;
      ty.value =
        clampPan(startTy.value * frameH + e.translationY, cover.height, frameH, scale.value) /
        frameH;
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      const next = clampScale(startScale.value * e.scale);
      scale.value = next;
      tx.value = clampPan(tx.value * frameW, cover.width, frameW, next) / frameW;
      ty.value = clampPan(ty.value * frameH, cover.height, frameH, next) / frameH;
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: clampPan(tx.value * frameW, cover.width, frameW, scale.value) },
      { translateY: clampPan(ty.value * frameH, cover.height, frameH, scale.value) },
      { scale: scale.value },
    ],
  }));

  const reset = () => {
    scale.value = withTiming(1);
    tx.value = withTiming(0);
    ty.value = withTiming(0);
  };

  const photoBox = {
    position: 'absolute' as const,
    width: cover.width,
    height: cover.height,
    left: (frameW - cover.width) / 2,
    top: (frameH - cover.height) / 2,
  };

  return (
    <Modal
      visible={!!image}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <View
          className="flex-row items-center justify-between px-4"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Button
            variant="gray"
            size="icon"
            accessibilityLabel={cancelLabel}
            onPress={onClose}
            className="bg-white/25"
          >
            <Icon as={X} className="text-white" />
          </Button>
          <Text variant="headline" className="text-white">
            {title}
          </Text>
          <Button variant="plain" onPress={reset}>
            <Text className="text-white">{resetLabel}</Text>
          </Button>
        </View>

        <GestureDetector gesture={gesture}>
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            onLayout={(e) => setStage(e.nativeEvent.layout)}
          >
            {image && frameW > 0 ? (
              <View style={{ width: frameW, height: frameH }}>
                <Animated.View style={[photoBox, { opacity: 0.35 }, photoStyle]}>
                  <Image
                    fadeDuration={0}
                    source={{ uri: image.uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </Animated.View>
                <View style={{ width: frameW, height: frameH, overflow: 'hidden' }}>
                  <Animated.View style={[photoBox, photoStyle]}>
                    <Image
                      fadeDuration={0}
                      source={{ uri: image.uri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </Animated.View>
                </View>
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: frameW,
                    height: frameH,
                    borderWidth: 2,
                    borderColor: FRAME_COLOR,
                  }}
                />
              </View>
            ) : null}
          </View>
        </GestureDetector>

        <View className="items-center px-4" style={{ paddingBottom: insets.bottom + 16 }}>
          <Button
            className="w-full"
            onPress={() =>
              image && onApply({ scale: scale.value, offsetX: tx.value, offsetY: ty.value })
            }
          >
            <Text>{doneLabel}</Text>
          </Button>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
