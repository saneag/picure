import * as LocalAuthentication from 'expo-local-authentication';
import { Lock } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useSettings } from './settings-context';

/** Short grace period so system dialogs (permissions, share sheet) don't re-lock the app. */
const RELOCK_AFTER_MS = 30_000;

/** Covers the app with a lock screen until the user passes biometrics or the screen lock. */
export function AppLockGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { settings, loaded } = useSettings();
  const [locked, setLocked] = useState(true);
  const leftAt = useRef<number | null>(null);
  const prompting = useRef(false);

  const unlock = useCallback(async () => {
    if (prompting.current) return;
    prompting.current = true;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('settings.unlockPrompt'),
      });
      if (result.success) setLocked(false);
    } finally {
      prompting.current = false;
    }
  }, [t]);

  useEffect(() => {
    if (!loaded) return;
    if (settings.appLock) unlock();
    else setLocked(false);
  }, [loaded, settings.appLock, unlock]);

  useEffect(() => {
    if (!settings.appLock) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') leftAt.current = Date.now();
      if (state === 'active' && leftAt.current && Date.now() - leftAt.current > RELOCK_AFTER_MS) {
        leftAt.current = null;
        setLocked(true);
        unlock();
      }
    });
    return () => subscription.remove();
  }, [settings.appLock, unlock]);

  if (!loaded) return <View className="flex-1 bg-grouped" />;
  if (settings.appLock && locked) {
    return (
      <View className="flex-1 items-center justify-center gap-6 bg-grouped px-8">
        <Icon as={Lock} size={48} />
        <Text variant="heading">Picure</Text>
        <Button
          label={t('settings.unlockButton')}
          onPress={unlock}
          className="w-full max-w-[280px]"
        />
      </View>
    );
  }
  return <>{children}</>;
}
