import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Images, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          position: 'absolute',
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
          borderTopWidth: StyleSheet.hairlineWidth,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            tint={colorScheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
            intensity={90}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.collages'),
          tabBarIcon: ({ color, size }) => <Images color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
