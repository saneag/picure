import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Row, Section } from '@/components/ui/grouped-list';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';

export interface SaveOptions {
  inApp: boolean;
  toGallery: boolean;
  /** Only meaningful when editing an existing collage. */
  mode: 'override' | 'copy';
}

interface SaveSheetProps {
  visible: boolean;
  isExisting: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (options: SaveOptions) => void;
}

/** Choose where to save (app, gallery, or both) and, for existing collages, copy vs override. */
export function SaveSheet({ visible, isExisting, busy, onClose, onSave }: SaveSheetProps) {
  const { t } = useTranslation();
  const [inApp, setInApp] = useState(true);
  const [toGallery, setToGallery] = useState(false);
  const [mode, setMode] = useState<SaveOptions['mode']>('copy');
  const nothingChosen = !inApp && !toGallery;

  return (
    <BottomSheet
      visible={visible}
      title={t('save.title')}
      closeLabel={t('common.cancel')}
      onClose={onClose}
    >
      <Section footer={isExisting ? undefined : t('save.inAppFooter')}>
        <Row
          label={t('save.inApp')}
          right={
            <Switch value={inApp} onValueChange={setInApp} accessibilityLabel={t('save.inApp')} />
          }
        />
        <Row
          label={t('save.toGallery')}
          right={
            <Switch
              value={toGallery}
              onValueChange={setToGallery}
              accessibilityLabel={t('save.toGallery')}
            />
          }
        />
      </Section>

      {isExisting && inApp ? (
        <View className="mb-6">
          <Text variant="caption" className="mb-1.5 px-4">
            {t('save.mode')}
          </Text>
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={[
              { value: 'copy', label: t('save.copy') },
              { value: 'override', label: t('save.override') },
            ]}
          />
          <Text variant="footnote" className="mt-1.5 px-4">
            {mode === 'copy' ? t('save.modeFooterCopy') : t('save.modeFooterOverride')}
          </Text>
        </View>
      ) : null}

      {nothingChosen ? (
        <Text variant="footnote" className="mb-3 px-4 text-destructive">
          {t('save.chooseOne')}
        </Text>
      ) : null}

      <Button
        label={t('save.confirm')}
        disabled={nothingChosen || busy}
        variant={isExisting && inApp && mode === 'override' ? 'destructive' : 'filled'}
        onPress={() => onSave({ inApp, toGallery, mode })}
        className="mb-2"
      />
    </BottomSheet>
  );
}
