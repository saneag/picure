import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cn } from '@/lib/cn';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** iOS-style toggle: 51x31 pill with a sliding knob. */
export function Switch({ value, onValueChange, disabled, accessibilityLabel }: SwitchProps) {
  const position = useSharedValue(value ? 20 : 0);

  useEffect(() => {
    position.value = withSpring(value ? 20 : 0, { damping: 18, stiffness: 220 });
  }, [value, position]);

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onValueChange(!value);
      }}
      className={cn(
        'h-[31px] w-[51px] justify-center rounded-full px-[2px]',
        value ? 'bg-[#34C759]' : 'bg-secondary',
        disabled && 'opacity-40',
      )}
    >
      <Animated.View
        style={knobStyle}
        className="h-[27px] w-[27px] rounded-full bg-white shadow-md"
      />
    </Pressable>
  );
}
