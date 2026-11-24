import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Download, Pencil, Search, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, Pressable, useWindowDimensions, View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Row, Section } from '@/components/ui/grouped-list';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { listCollages } from '@/db/collages-repo';
import { CollageCanvas } from '@/features/collage/CollageCanvas';
import { useDraft } from '@/features/collage/draft-context';
import type { SavedCollage } from '@/features/collage/types';
import { removeCollage } from '@/services/collage-service';
import { saveToGalleryAlbum } from '@/services/gallery';

export default function CollagesScreen() {
  const { t, i18n } = useTranslation();
  const db = useSQLiteContext();
  const router = useRouter();
  const { startFrom } = useDraft();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [collages, setCollages] = useState<SavedCollage[]>([]);
  const [menuItem, setMenuItem] = useState<SavedCollage | null>(null);
  const [toDelete, setToDelete] = useState<SavedCollage | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const cardWidth = (width - 32 - 12) / 2;

  const reload = useCallback(() => listCollages(db, search).then(setCollages), [db, search]);

  const open = (item: SavedCollage) => {
    if (!item.isDraft) return router.push(`/collage/${item.id}`);
    startFrom(item);
    router.push('/collage/editor');
  };

  const exportToGallery = async (item: SavedCollage) => {
    try {
      await saveToGalleryAlbum(item.renderedUri);
      setNotice(t('detail.savedToGallery'));
    } catch (error) {
      const denied = error instanceof Error && error.message === 'gallery-permission-denied';
      setNotice(denied ? t('save.galleryDenied') : t('save.failed'));
    }
  };

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <View className="flex-1 bg-grouped">
      <ScreenHeader large title={t('home.title')} />
      <FlatList
        data={collages}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="gap-3 px-4"
        contentContainerClassName="gap-3 pb-28"
        ListHeaderComponent={
          <View className="mx-4 mb-2 h-10 flex-row items-center gap-2 rounded-[10px] bg-secondary px-3">
            <Icon as={Search} size={18} className="text-muted-foreground" />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder={t('home.search')}
              className="min-h-0"
              clearButtonMode="while-editing"
            />
          </View>
        }
        ListEmptyComponent={
          <View className="items-center gap-2 px-10 pt-24">
            <Text variant="headline">{search ? t('home.emptySearch') : t('home.emptyTitle')}</Text>
            {search ? null : (
              <Text variant="subhead" className="text-center">
                {t('home.emptyMessage')}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => open(item)}
            onLongPress={() => setMenuItem(item)}
            style={{ width: cardWidth }}
            className="overflow-hidden rounded-ios-lg bg-card active:opacity-70"
          >
            {item.isDraft ? (
              <View pointerEvents="none">
                <CollageCanvas
                  layoutId={item.layoutId}
                  ratios={item.ratios}
                  showMargins={item.showMargins}
                  slots={item.slots}
                  width={cardWidth}
                />
                <View className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5">
                  <Text variant="footnote" className="text-primary-foreground">
                    {t('home.draft')}
                  </Text>
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: item.renderedUri }}
                className="aspect-[4/5] w-full bg-secondary"
              />
            )}
            <View className="gap-0.5 p-3">
              <Text variant="headline" numberOfLines={1}>
                {item.patient.name || t('common.untitled')}
              </Text>
              <Text variant="footnote">
                {t('home.procedures', { count: item.patient.procedureCount })}
              </Text>
              <Text variant="footnote">
                {new Date(item.updatedAt).toLocaleDateString(i18n.language)}
              </Text>
            </View>
          </Pressable>
        )}
      />
      <BottomSheet
        visible={menuItem !== null}
        title={menuItem?.patient.name || t('common.untitled')}
        closeLabel={t('common.done')}
        onClose={() => setMenuItem(null)}
      >
        <Section>
          <Row
            label={t('detail.edit')}
            right={<Icon as={Pencil} size={18} />}
            onPress={() => {
              const item = menuItem;
              setMenuItem(null);
              if (item) open(item);
            }}
          />
          {menuItem?.isDraft ? null : (
            <Row
              label={t('detail.saveToGallery')}
              right={<Icon as={Download} size={18} />}
              onPress={() => {
                const item = menuItem;
                setMenuItem(null);
                if (item) exportToGallery(item);
              }}
            />
          )}
          <Row
            label={t('detail.delete')}
            destructive
            right={<Icon as={Trash2} size={18} className="text-destructive" />}
            onPress={() => {
              const item = menuItem;
              setMenuItem(null);
              setToDelete(item);
            }}
          />
        </Section>
      </BottomSheet>
      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete?.isDraft ? t('home.deleteDraftTitle') : t('detail.deleteTitle')}
        message={toDelete?.isDraft ? t('home.deleteDraftMessage') : t('detail.deleteMessage')}
        actions={[
          { label: t('common.cancel') },
          {
            label: t('common.delete'),
            destructive: true,
            emphasized: true,
            onPress: async () => {
              if (toDelete) await removeCollage(db, toDelete.id);
              reload();
            },
          },
        ]}
        onClose={() => setToDelete(null)}
      />
      <ConfirmDialog
        open={notice !== null}
        title={notice ?? ''}
        actions={[{ label: t('common.ok'), emphasized: true }]}
        onClose={() => setNotice(null)}
      />
    </View>
  );
}
