import { Children, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { Icon } from './icon';
import { Text } from './text';

interface SectionProps {
  title?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
}

/** Inset grouped list section, like iOS Settings. Rows are separated by hairlines. */
export function Section({ title, footer, children, className }: SectionProps) {
  const rows = Children.toArray(children);
  return (
    <View className={cn('mb-6', className)}>
      {title ? (
        <Text variant="caption" className="mb-1.5 px-4">
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-ios-lg bg-card">
        {rows.map((row, index) => (
          <View key={index}>
            {index > 0 ? <View className="h-hairline ml-4 bg-separator" /> : null}
            {row}
          </View>
        ))}
      </View>
      {footer ? (
        <Text variant="footnote" className="mt-1.5 px-4">
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

interface RowProps {
  label: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
}

export function Row({ label, value, right, onPress, destructive, chevron }: RowProps) {
  const content = (
    <View className="min-h-[48px] flex-row items-center justify-between gap-3 px-4 py-2">
      <Text className={cn('flex-shrink', destructive && 'text-destructive')}>{label}</Text>
      <View className="flex-row items-center gap-1.5">
        {value ? <Text variant="subhead">{value}</Text> : null}
        {right}
        {chevron ? <Icon as={ChevronRight} size={18} className="text-muted-foreground" /> : null}
      </View>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:bg-secondary">
      {content}
    </Pressable>
  );
}
