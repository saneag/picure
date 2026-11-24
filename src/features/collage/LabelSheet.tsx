import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Section } from '@/components/ui/grouped-list';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { LABEL_COLORS, type ImageLabel, type LabelPosition, type LabelSize } from './types';

const POSITIONS: LabelPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

interface LabelSheetProps {
  visible: boolean;
  label: ImageLabel | null;
  onChange: (label: ImageLabel) => void;
  onClose: () => void;
}

/** Edits the text drawn on one photo, e.g. "Before" or "After 2 sessions". Changes apply live. */
export function LabelSheet({ visible, label, onChange, onClose }: LabelSheetProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible && label) setText(label.text);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!label) return null;

  const apply = (patch: Partial<ImageLabel>) => onChange({ ...label, ...patch });
  const setLabelText = (next: string) => {
    setText(next);
    apply({ text: next });
  };

  const quick = [t('label.before'), t('label.after'), t('label.after2'), t('label.after3')];

  return (
    <BottomSheet
      visible={visible}
      title={t('label.title')}
      closeLabel={t('common.done')}
      onClose={onClose}
    >
      <Section>
        <View className="flex-row items-center px-4">
          <Input
            value={text}
            onChangeText={setLabelText}
            placeholder={t('label.placeholder')}
            autoFocus
            maxLength={40}
          />
        </View>
      </Section>

      <Text variant="caption" className="mb-1.5 px-4">
        {t('label.quick')}
      </Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {quick.map((value) => (
          <Button
            key={value}
            variant={text === value ? 'filled' : 'gray'}
            size="compact"
            label={value}
            onPress={() => setLabelText(value)}
          />
        ))}
        {text ? (
          <Button
            variant="destructive"
            size="compact"
            label={t('label.clear')}
            onPress={() => setLabelText('')}
          />
        ) : null}
      </View>

      <Text variant="caption" className="mb-1.5 px-4">
        {t('label.size')}
      </Text>
      <SegmentedControl<LabelSize>
        className="mb-6"
        value={label.size}
        onChange={(size) => apply({ size })}
        options={(['sm', 'md', 'lg'] as const).map((size) => ({
          value: size,
          label: t(`label.sizes.${size}`),
        }))}
      />

      <Text variant="caption" className="mb-2 px-4">
        {t('label.color')}
      </Text>
      <View className="mb-6 flex-row justify-between px-2">
        {LABEL_COLORS.map((color) => (
          <Pressable
            key={color}
            accessibilityRole="button"
            accessibilityLabel={color}
            onPress={() => apply({ color })}
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full border-2',
              label.color === color ? 'border-primary' : 'border-transparent',
            )}
          >
            <View
              style={{ backgroundColor: color }}
              className="h-8 w-8 rounded-full border border-hairline border-separator"
            />
          </Pressable>
        ))}
      </View>

      <Text variant="caption" className="mb-1.5 px-4">
        {t('label.position')}
      </Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {POSITIONS.map((position) => (
          <Button
            key={position}
            variant={label.position === position ? 'filled' : 'gray'}
            size="compact"
            label={t(`label.positions.${position}`)}
            onPress={() => apply({ position })}
          />
        ))}
      </View>
    </BottomSheet>
  );
}
