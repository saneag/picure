import '../global.css';
import '@/i18n';

import { PortalHost } from '@rn-primitives/portal';
import { Stack, usePathname } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { migrateDatabase } from '@/db/migrations';
import { DraftProvider } from '@/features/collage/draft-context';
import { AppLockGate } from '@/features/settings/AppLockGate';
import { SettingsProvider } from '@/features/settings/settings-context';

/** Fills the system navigation bar area so buttons never sit on top of translucent content. */
function NavigationBarBackdrop() {
  const insets = useSafeAreaInsets();
  const onCamera = usePathname() === '/camera';
  const { colorScheme } = useColorScheme();
  const dark = onCamera || colorScheme === 'dark';

  useEffect(() => {
    NavigationBar.setStyle(dark ? 'light' : 'dark');
  }, [dark]);

  return (
    <View
      pointerEvents="none"
      className={`absolute inset-x-0 bottom-0 ${onCamera ? 'bg-black' : 'bg-grouped'}`}
      style={{ height: insets.bottom }}
    />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1 bg-grouped">
      <SafeAreaProvider>
        <SQLiteProvider databaseName="picure.db" onInit={migrateDatabase}>
          <SettingsProvider>
            <DraftProvider>
              <AppLockGate>
                <StatusBar style="auto" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="collage/editor" />
                  <Stack.Screen name="collage/[id]" />
                  <Stack.Screen name="gallery-picker" options={{ presentation: 'modal' }} />
                  <Stack.Screen
                    name="camera"
                    options={{ presentation: 'fullScreenModal', animation: 'fade' }}
                  />
                </Stack>
                <NavigationBarBackdrop />
              </AppLockGate>
            </DraftProvider>
          </SettingsProvider>
        </SQLiteProvider>
        <PortalHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
