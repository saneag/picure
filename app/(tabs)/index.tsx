import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Check, CheckSquare, Download, Pencil, Search, Trash2, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler, FlatList, Image, Pressable, useWindowDimensions, View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
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
import { navigateOnce } from '@/lib/navigate-once';
import { removeCollage } from '@/services/collage-service';
import { saveToGalleryAlbum } from '@/services/gallery';

export default function CollagesScreen() {
  const { t, i18n } = useTranslation();
  const db = useSQLiteContext();
  const router = useRouter();
  const { startFrom } = useDraft();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [collages, setCollages] = useState<SavedCollage[]>([]);
  const [menuItem, setMenuItem] = useState<SavedCollage | null>(null);
  const [toDelete, setToDelete] = useState<SavedCollage | null>(null);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [confirmMany, setConfirmMany] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const cardWidth = (width - 32 - 12) / 2;

  const reload = useCallback(() => listCollages(db, search).then(setCollages), [db, search]);

  const toggle = (id: string) =>
    setSelected((current) => {
      if (!current) return current;
      return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    });

  useEffect(() => {
    if (!selected) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelected(null);
      return true;
    });
    return () => sub.remove();
  }, [selected !== null]);

  const open = (item: SavedCollage) => {
    navigateOnce(() => {
      if (!item.isDraft) return router.push(`/collage/${item.id}`);
      startFrom(item);
      router.push('/collage/editor');
    });
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
      {selected ? (
        <ScreenHeader
          title={t('home.selectedCount', { count: selected.length })}
          left={
            <Button
              variant="plain"
              size="compact"
              className="-ml-3 px-1"
              accessibilityLabel={t('home.cancelSelection')}
              onPress={() => setSelected(null)}
            >
              <Icon as={X} size={26} />
            </Button>
          }
          right={
            <Button
              variant="plain"
              size="compact"
              disabled={selected.length === 0}
              accessibilityLabel={t('common.delete')}
              onPress={() => setConfirmMany(true)}
            >
              <Icon as={Trash2} size={22} className="text-destructive" />
            </Button>
          }
        />
      ) : (
        <ScreenHeader large title={t('home.title')} />
      )}
      <FlatList
        data={collages}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="gap-3 px-4"
        contentContainerClassName="gap-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
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
        extraData={selected}
        renderItem={({ item }) => {
          const isSelected = selected?.includes(item.id) ?? false;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => (selected ? toggle(item.id) : open(item))}
              onLongPress={() => !selected && setMenuItem(item)}
              style={{ width: cardWidth }}
              className={`overflow-hidden rounded-ios-lg bg-card active:opacity-70 ${isSelected ? 'border-2 border-primary' : 'border-2 border-transparent'}`}
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
                </View>
              ) : (
                <Image
                  source={{ uri: item.renderedUri }}
                  className="aspect-[4/5] w-full bg-secondary"
                />
              )}
              <View
                className={`absolute left-2 top-2 rounded-full px-2 py-0.5 ${item.isDraft ? 'bg-primary' : 'bg-black/60'}`}
              >
                <Text variant="footnote" className="text-white">
                  {item.isDraft ? t('home.draft') : t('home.saved')}
                </Text>
              </View>
              {selected ? (
                <View
                  className={`absolute right-2 top-2 size-6 items-center justify-center rounded-full border-2 ${isSelected ? 'border-primary bg-primary' : 'border-white bg-black/30'}`}
                >
                  {isSelected ? <Icon as={Check} size={14} className="text-white" /> : null}
                </View>
              ) : null}
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
          );
        }}
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
          <Row
            label={t('home.select')}
            right={<Icon as={CheckSquare} size={18} />}
            onPress={() => {
              const item = menuItem;
              setMenuItem(null);
              if (item) setSelected([item.id]);
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
        open={confirmMany}
        title={t('home.deleteManyTitle', { count: selected?.length ?? 0 })}
        message={t('home.deleteManyMessage')}
        actions={[
          { label: t('common.cancel') },
          {
            label: t('common.delete'),
            destructive: true,
            emphasized: true,
            onPress: async () => {
              for (const id of selected ?? []) await removeCollage(db, id);
              setSelected(null);
              reload();
            },
          },
        ]}
        onClose={() => setConfirmMany(false)}
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
