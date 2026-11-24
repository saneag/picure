import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Row, Section } from '@/components/ui/grouped-list';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import type { LanguageSetting, ThemeSetting } from '@/db/settings-repo';
import { useSettings } from '@/features/settings/settings-context';
import { exportBackup } from '@/services/backup';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { settings, setLanguage, setTheme, setAppLock } = useSettings();
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const toggleLock = async (enabled: boolean) => {
    if (!(await setAppLock(enabled))) setMessage(t('settings.appLockUnavailable'));
  };

  const runExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportBackup(db);
    } catch {
      setMessage(t('settings.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <View className="flex-1 bg-grouped">
      <ScreenHeader large title={t('settings.title')} />
      <ScrollView contentContainerClassName="px-4 pb-32 pt-2">
        <Section title={t('settings.language')}>
          <View className="p-2">
            <SegmentedControl<LanguageSetting>
              value={settings.language}
              onChange={setLanguage}
              options={[
                { value: 'system', label: t('settings.languageSystem') },
                { value: 'en', label: 'English' },
                { value: 'ru', label: 'Русский' },
              ]}
            />
          </View>
        </Section>

        <Section title={t('settings.theme')}>
          <View className="p-2">
            <SegmentedControl<ThemeSetting>
              value={settings.theme}
              onChange={setTheme}
              options={[
                { value: 'system', label: t('settings.languageSystem') },
                { value: 'light', label: t('settings.themeLight') },
                { value: 'dark', label: t('settings.themeDark') },
              ]}
            />
          </View>
        </Section>

        <Section title={t('settings.security')} footer={t('settings.appLockFooter')}>
          <Row
            label={t('settings.appLock')}
            right={
              <Switch
                value={settings.appLock}
                onValueChange={toggleLock}
                accessibilityLabel={t('settings.appLock')}
              />
            }
          />
        </Section>

        <Section title={t('settings.backup')} footer={t('settings.exportFooter')}>
          <Row label={t('settings.export')} onPress={runExport} chevron />
        </Section>

        <Section title={t('settings.about')} footer={t('settings.offlineFooter')}>
          <Row label={t('settings.offline')} />
          <Row label={t('settings.version')} value={Constants.expoConfig?.version ?? ''} />
        </Section>
        <Text variant="footnote" className="text-center">
          Picure
        </Text>
      </ScrollView>
      <ConfirmDialog
        open={message !== null}
        title={message ?? ''}
        actions={[{ label: t('common.ok'), emphasized: true }]}
        onClose={() => setMessage(null)}
      />
    </View>
  );
}
