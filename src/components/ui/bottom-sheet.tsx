import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { Button } from './button';
import { Text } from './text';

interface BottomSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}

/** iOS-style modal sheet: dimmed backdrop, rounded top, grabber, title and a "Done" button. */
export function BottomSheet({ visible, title, onClose, closeLabel, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/40">
        <Pressable accessibilityLabel={closeLabel} className="flex-1" onPress={onClose} />
        <View
          className="max-h-[85%] rounded-t-[24px] bg-grouped"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="items-center pt-2">
            <View className="h-1 w-9 rounded-full bg-separator" />
          </View>
          <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
            <Text variant="headline">{title}</Text>
            <Button variant="plain" size="compact" label={closeLabel} onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pt-2">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
