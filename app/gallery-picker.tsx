import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppState, FlatList, Image, Pressable, useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { useDraft } from '@/features/collage/draft-context';
import {
  loadGalleryPage,
  onGalleryChange,
  requestGalleryAccess,
  type GalleryPhoto,
} from '@/services/gallery';

const COLUMNS = 3;

/**
 * In-app gallery grid. It lists photos straight from the phone's media library and stores only
 * their id and uri, so the photos are referenced and never copied.
 */
function uniqueById(photos: GalleryPhoto[]) {
  const seen = new Set<string>();
  return photos.filter((p) => !seen.has(p.id) && !!seen.add(p.id));
}

export default function GalleryPickerScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { draft, placeImages } = useDraft();
  const { slot } = useLocalSearchParams<{ slot?: string }>();
  const targetSlot = slot === undefined ? undefined : Number(slot);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [selected, setSelected] = useState<GalleryPhoto[]>([]);

  const emptySlots = draft ? draft.slots.filter((s) => s === null).length : 0;
  const limit =
    targetSlot !== undefined ? 1 : Math.max(1, emptySlots + (4 - (draft?.slots.length ?? 4)));
  const size = width / COLUMNS;

  const loading = useRef(false);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading.current) return;
    loading.current = true;
    try {
      const page = await loadGalleryPage(cursor);
      setPhotos((current) => {
        return uniqueById([...current, ...page.photos]);
      });
      setCursor(page.endCursor);
      setHasMore(page.hasNextPage);
    } finally {
      loading.current = false;
    }
  }, [cursor, hasMore]);

  /** Reloads the first page so photos added since the grid opened show up at the top. */
  const refresh = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const page = await loadGalleryPage();
      setPhotos(uniqueById(page.photos));
      setCursor(page.endCursor);
      setHasMore(page.hasNextPage);
    } finally {
      loading.current = false;
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    const stopGallery = onGalleryChange(refresh);
    const stopApp = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      stopGallery();
      stopApp.remove();
    };
  }, [allowed, refresh]);

  useEffect(() => {
    requestGalleryAccess().then(setAllowed);
  }, []);

  useEffect(() => {
    if (allowed) loadMore();
  }, [allowed]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (photo: GalleryPhoto) => {
    setSelected((current) => {
      if (current.some((p) => p.id === photo.id)) return current.filter((p) => p.id !== photo.id);
      if (limit === 1) return [photo];
      return current.length < limit ? [...current, photo] : current;
    });
  };

  const confirm = () => {
    placeImages(
      selected.map((photo) => ({
        uri: photo.uri,
        assetId: photo.id,
        source: 'gallery',
        width: photo.width,
        height: photo.height,
      })),
      targetSlot,
    );
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={t('picker.title')}
        backLabel=""
        right={
          <Button
            variant="plain"
            size="compact"
            disabled={selected.length === 0}
            label={t('picker.add', { count: selected.length })}
            onPress={confirm}
          />
        }
      />
      {allowed === false ? (
        <View className="flex-1 items-center justify-center gap-4 px-10">
          <Text className="text-center">{t('picker.denied')}</Text>
          <Button
            label={t('picker.grant')}
            onPress={() => requestGalleryAccess().then(setAllowed)}
          />
        </View>
      ) : (
        <FlatList
          data={photos}
          numColumns={COLUMNS}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
          keyExtractor={(item) => item.id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListEmptyComponent={
            allowed ? (
              <Text variant="subhead" className="p-8 text-center">
                {t('picker.empty')}
              </Text>
            ) : undefined
          }
          renderItem={({ item }) => {
            const index = selected.findIndex((p) => p.id === item.id);
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => toggle(item)}
                style={{ width: size, height: size }}
                className="p-[1px]"
              >
                <Image source={{ uri: item.uri }} className="h-full w-full bg-secondary" />
                {index >= 0 ? (
                  <View className="absolute inset-[1px] items-end bg-primary/30 p-1.5">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
                      {limit === 1 ? (
                        <Icon as={Check} size={14} className="text-white" />
                      ) : (
                        <Text className="text-xs font-bold text-white">{index + 1}</Text>
                      )}
                    </View>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
