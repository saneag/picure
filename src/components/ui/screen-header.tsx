import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './button';
import { Icon } from './icon';
import { Text } from './text';

interface ScreenHeaderProps {
  title: string;
  /** Large left-aligned title (tab screens) instead of a centered inline title. */
  large?: boolean;
  backLabel?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function ScreenHeader({ title, large, backLabel, onBack, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const showBack = backLabel !== undefined;

  return (
    <View className="bg-grouped px-4 pb-2" style={{ paddingTop: insets.top + 4 }}>
      <View className="h-11 flex-row items-center justify-between">
        <View className="min-w-[80px] flex-row">
          {showBack ? (
            <Button
              variant="plain"
              size="compact"
              className="-ml-3 px-1"
              accessibilityLabel={backLabel || undefined}
              onPress={onBack ?? (() => router.back())}
            >
              <Icon as={ChevronLeft} size={28} />
              {backLabel ? <Text className="-ml-1 text-primary">{backLabel}</Text> : null}
            </Button>
          ) : null}
        </View>
        {!large ? (
          <Text variant="headline" numberOfLines={1} className="flex-1 text-center">
            {title}
          </Text>
        ) : null}
        <View className="min-w-[80px] flex-row items-center justify-end gap-1">{right}</View>
      </View>
      {large ? <Text variant="title">{title}</Text> : null}
    </View>
  );
}
