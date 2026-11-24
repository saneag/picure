import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { Camera, Images, PlusCircle, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useDraft } from '@/features/collage/draft-context';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { startNew } = useDraft();

  const createNew = () => {
    startNew();
    router.push('/collage/editor');
  };
  const takePhoto = () => {
    startNew();
    router.push({ pathname: '/camera', params: { from: 'home' } });
  };
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
        name="action-camera"
        options={{
          title: t('home.camera'),
          tabBarIcon: ({ color, size }) => <Camera color={color} size={size} />,
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            takePhoto();
          },
        }}
      />
      <Tabs.Screen
        name="action-new"
        options={{
          title: t('home.newCollage'),
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            createNew();
          },
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
