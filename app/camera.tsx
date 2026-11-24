import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RotateCcw } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useDraft } from '@/features/collage/draft-context';
import { newId } from '@/lib/id';
import { storeCameraPhoto } from '@/services/file-storage';

/**
 * In-app camera. Photos go to private app storage (never the gallery).
 * - Opened from a collage: the photo is added to that collage, then we go back.
 * - Opened from Home (`from=home`): a blank collage was already started, so the photo lands in it
 *   and we continue to the editor.
 */
export default function CameraScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from, slot } = useLocalSearchParams<{ from?: string; slot?: string }>();
  const { placeImages } = useDraft();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const camera = useRef<CameraView>(null);

  const capture = async () => {
    if (busy || !camera.current) return;
    setBusy(true);
    try {
      const picture = await camera.current.takePictureAsync({
        quality: 0.95,
        skipProcessing: false,
      });
      const uri = await storeCameraPhoto(picture.uri, newId());
      placeImages(
        [{ uri, assetId: null, source: 'camera', width: picture.width, height: picture.height }],
        slot === undefined ? undefined : Number(slot),
      );
      if (from === 'home') router.replace('/collage/editor');
      else router.back();
    } catch {
      setError(t('camera.failed'));
      setBusy(false);
    }
  };

  if (!permission) return <View className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-black px-10">
        <Text className="text-center text-white">{t('camera.denied')}</Text>
        <Button label={t('camera.grant')} onPress={requestPermission} />
        <Button variant="plain" label={t('camera.cancel')} onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={camera} facing={facing} style={{ flex: 1 }} />
      <View
        className="absolute inset-x-0 bottom-0 flex-row items-center justify-between px-8"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Button
          variant="plain"
          label={t('camera.cancel')}
          labelClassName="text-white"
          onPress={() => router.back()}
        />
        <Button
          accessibilityLabel={t('camera.take')}
          disabled={busy}
          onPress={capture}
          className="h-[76px] w-[76px] rounded-full border-4 border-white/60 bg-white active:bg-white/70"
        />
        <Button
          variant="gray"
          size="icon"
          accessibilityLabel="flip"
          className="bg-white/25"
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
        >
          <Icon as={RotateCcw} className="text-white" />
        </Button>
      </View>
      <ConfirmDialog
        open={error !== null}
        title={error ?? ''}
        actions={[{ label: t('common.ok'), emphasized: true }]}
        onClose={() => setError(null)}
      />
    </View>
  );
}
