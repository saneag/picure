import { Pressable, ScrollView, View } from 'react-native';
import { cn } from '@/lib/cn';
import { CANVAS_ASPECT, getLayoutsForCount } from './layouts';
import type { SlotCount } from './types';

const THUMB_WIDTH = 48;
const THUMB_HEIGHT = THUMB_WIDTH / CANVAS_ASPECT;

interface LayoutPickerProps {
  count: SlotCount;
  value: string;
  onChange: (layoutId: string) => void;
}

/** Row of small layout previews for the current image count. */
export function LayoutPicker({ count, value, onChange }: LayoutPickerProps) {
  const layouts = getLayoutsForCount(count);
  if (layouts.length < 2) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="grow-0"
      contentContainerClassName="gap-3 px-4 py-1"
    >
      {layouts.map((layout) => {
        const selected = layout.id === value;
        return (
          <Pressable
            key={layout.id}
            accessibilityRole="button"
            accessibilityLabel={layout.id}
            accessibilityState={{ selected }}
            onPress={() => onChange(layout.id)}
            className={cn(
              'rounded-lg border-2 p-1',
              selected ? 'border-primary' : 'border-transparent',
            )}
          >
            <View
              style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
              className="overflow-hidden rounded-[4px] bg-card"
            >
              {layout.cells.map((cell, index) => (
                <View
                  key={index}
                  style={{
                    position: 'absolute',
                    left: cell.x * THUMB_WIDTH + 1,
                    top: cell.y * THUMB_HEIGHT + 1,
                    width: cell.width * THUMB_WIDTH - 2,
                    height: cell.height * THUMB_HEIGHT - 2,
                  }}
                  className={selected ? 'bg-primary' : 'bg-muted-foreground/50'}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
