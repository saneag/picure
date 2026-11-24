import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

interface SegmentedControlProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** iOS segmented picker. The selected segment is a raised white pill. */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <View className={cn('flex-row rounded-[9px] bg-secondary p-[2px]', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync();
              onChange(option.value);
            }}
            className={cn(
              'h-8 flex-1 items-center justify-center rounded-[7px]',
              selected ? 'bg-card' : 'bg-transparent',
            )}
          >
            <Text className={cn('text-[13px]', selected ? 'font-semibold' : 'font-medium')}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
