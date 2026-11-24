import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { Button } from './button';
import { Text } from './text';

interface BottomSheetProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}

/** iOS-style modal sheet: dimmed backdrop, rounded top, grabber, title and a "Done" button. */
export function BottomSheet({ visible, title, onClose, closeLabel, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      progress.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height * 0.6 }],
  }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onShow={() => {
        progress.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
      }}
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
            },
            backdropStyle,
          ]}
        />
        <Pressable accessibilityLabel={closeLabel} className="flex-1" onPress={onClose} />
        <Animated.View style={[{ maxHeight: '85%' }, sheetStyle]}>
          <View
            className="rounded-t-[24px] bg-grouped"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <View className="items-center pt-2">
              <View className="h-1 w-9 rounded-full bg-separator" />
            </View>
            <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
              {title ? <Text variant="headline">{title}</Text> : <View />}
              <Button variant="plain" size="compact" label={closeLabel} onPress={onClose} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pt-2">
              {children}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
