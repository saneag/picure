import { X } from 'lucide-react-native';
import { useEffect } from 'react';
import { Image, Modal, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

interface ImageViewerProps {
  uri: string | null;
  closeLabel: string;
  onClose: () => void;
}

/** Full-screen look at the original photo, with pinch to zoom, drag, and double tap to reset. */
export function ImageViewer({ uri, closeLabel, onClose }: ImageViewerProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);

  useEffect(() => {
    scale.value = 1;
    tx.value = 0;
    ty.value = 0;
  }, [uri, scale, tx, ty]);

  const reset = () => {
    'worklet';
    scale.value = withTiming(1);
    tx.value = withTiming(0);
    ty.value = withTiming(0);
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(6, Math.max(1, startScale.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value <= 1) reset();
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      tx.value = startTx.value + e.translationX;
      ty.value = startTy.value + e.translationY;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) reset();
      else scale.value = withTiming(2.5);
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <Modal
      visible={!!uri}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView className="flex-1 bg-black">
        <GestureDetector gesture={gesture}>
          <Animated.View style={style} className="flex-1 items-center justify-center">
            {uri ? <Image source={{ uri }} style={{ width, height }} resizeMode="contain" /> : null}
          </Animated.View>
        </GestureDetector>
        <View className="absolute right-4" style={{ top: insets.top + 8 }}>
          <Button
            variant="gray"
            size="icon"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            className="bg-white/25"
          >
            <Icon as={X} className="text-white" />
          </Button>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
