import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Grid3x3, RotateCcw, Sun } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { findNodeHandle, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { GridGuide } from '@/features/camera/GridGuide';
import { ExposureSlider } from '@/features/camera/ExposureSlider';
import { PoseMenu } from '@/features/camera/PoseMenu';
import { SilhouetteGuide, type Pose } from '@/features/camera/SilhouetteGuide';
import {
  getBackCameraInfo,
  getExposureRange,
  setExposure,
  type ExposureRange,
} from '../modules/picure-camera-info';
import { useDraft } from '@/features/collage/draft-context';
import { newId } from '@/lib/id';
import { storeCameraPhoto } from '@/services/file-storage';

/**
 * Zoom buttons for this phone: 1x, each telephoto lens it really has, and the maximum digital zoom.
 * expo-camera cannot zoom out below 1x, so ultra-wide ratios are left out.
 */
function readZoomOptions() {
  const info = getBackCameraInfo();
  const maxRatio = Math.max(1, info?.maxZoom ?? 1);
  // Lenses are marketed as whole numbers (3x), but measured values are slightly off (2.9).
  const snap = (r: number) => (Math.abs(r - Math.round(r)) < 0.25 ? Math.round(r) : r);
  const lenses = (info?.lensRatios ?? []).map(snap).filter((r) => r > 1.05 && r <= maxRatio);
  const presets = [1, ...lenses];
  const last = presets[presets.length - 1];
  if (Math.floor(maxRatio) >= last * 2) presets.push(Math.floor(maxRatio));
  return { maxRatio, presets };
}

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
  const { maxRatio, presets } = useMemo(readZoomOptions, []);
  const [pose, setPose] = useState<Pose | null>(null);
  const [grid, setGrid] = useState(false);
  const [ratio, setRatio] = useState(1);
  const [exposureOpen, setExposureOpen] = useState(false);
  const [exposure, setExposureIndex] = useState(0);
  const [exposureRange, setExposureRange] = useState<ExposureRange | null>(null);
  const startRatio = useRef(1);

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      startRatio.current = ratio;
    })
    .onUpdate((e) => {
      setRatio(Math.min(maxRatio, Math.max(1, startRatio.current * e.scale)));
    });

  const cameraTag = () => (camera.current ? (findNodeHandle(camera.current) ?? null) : null);

  // The camera forgets exposure when it restarts, so it is read and applied on every ready event.
  const onCameraReady = () => {
    const tag = cameraTag();
    if (tag === null) return;
    const range = getExposureRange(tag);
    setExposureRange(range?.supported ? range : null);
    if (range?.supported) setExposure(tag, exposure);
  };

  useEffect(() => {
    const tag = cameraTag();
    if (tag !== null && exposureRange) setExposure(tag, exposure);
  }, [exposure]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <GestureDetector gesture={pinch}>
        <View className="flex-1">
          <CameraView
            ref={camera}
            facing={facing}
            zoom={Math.min(1, ratio / maxRatio)}
            onCameraReady={onCameraReady}
            style={{ flex: 1 }}
          />
        </View>
      </GestureDetector>
      {grid ? <GridGuide /> : null}
      {pose ? <SilhouetteGuide {...pose} /> : null}
      <Pressable
        accessibilityLabel={t('camera.cancel')}
        onPress={() => router.back()}
        className="absolute left-4 h-11 w-11 items-center justify-center rounded-full bg-black/40 active:opacity-70"
        style={{ top: insets.top + 8 }}
      >
        <Icon as={ChevronLeft} className="text-white" size={28} />
      </Pressable>
      <PoseMenu pose={pose} onChange={setPose} top={insets.top + 8} />
      <Pressable
        accessibilityLabel={t('camera.grid')}
        onPress={() => setGrid((on) => !on)}
        className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-black/40 active:opacity-70"
        style={{ top: insets.top + 120 }}
      >
        <Icon as={Grid3x3} className={grid ? 'text-primary' : 'text-white'} size={24} />
      </Pressable>
      {exposureRange ? (
        <Pressable
          accessibilityLabel={t('camera.exposure')}
          onPress={() => setExposureOpen((open) => !open)}
          className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-black/40 active:opacity-70"
          style={{ top: insets.top + 184 }}
        >
          <Icon
            as={Sun}
            className={exposure !== 0 || exposureOpen ? 'text-primary' : 'text-white'}
            size={24}
          />
        </Pressable>
      ) : null}
      <View
        className="absolute inset-x-0 bottom-0 items-center gap-5 px-4"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        {exposureOpen && exposureRange ? (
          <ExposureSlider
            min={exposureRange.min}
            max={exposureRange.max}
            step={exposureRange.step}
            value={exposure}
            onChange={setExposureIndex}
          />
        ) : null}
        <View className="flex-row gap-2 rounded-full bg-black/40 p-1">
          {presets.map((preset) => {
            const active = Math.abs(ratio - preset) < 0.05;
            return (
              <Pressable
                key={preset}
                onPress={() => setRatio(preset)}
                className={`h-10 min-w-10 items-center justify-center rounded-full px-3 ${active ? 'bg-white' : ''}`}
              >
                <Text className={active ? 'text-black' : 'text-white'}>{`${preset}x`}</Text>
              </Pressable>
            );
          })}
        </View>
        <View className="w-full flex-row items-center justify-center">
          <Pressable
            accessibilityLabel={t('camera.take')}
            disabled={busy}
            onPress={capture}
            className="h-20 w-20 items-center justify-center rounded-full border-4 border-white"
          >
            <View className="h-[62px] w-[62px] rounded-full bg-white" />
          </Pressable>
          <Button
            variant="gray"
            size="icon"
            accessibilityLabel="flip"
            className="absolute right-8 bg-white/25"
            onPress={() => {
              setExposureIndex(0);
              setFacing((f) => (f === 'back' ? 'front' : 'back'));
            }}
          >
            <Icon as={RotateCcw} className="text-white" />
          </Button>
        </View>
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
