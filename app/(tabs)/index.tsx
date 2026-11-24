import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Search } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, Pressable, useWindowDimensions, View } from 'react-native';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { listCollages } from '@/db/collages-repo';
import { CollageCanvas } from '@/features/collage/CollageCanvas';
import { useDraft } from '@/features/collage/draft-context';
import type { SavedCollage } from '@/features/collage/types';
import { removeCollage } from '@/services/collage-service';

export default function CollagesScreen() {
  const { t, i18n } = useTranslation();
  const db = useSQLiteContext();
  const router = useRouter();
  const { startFrom } = useDraft();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [collages, setCollages] = useState<SavedCollage[]>([]);
  const [draftToDelete, setDraftToDelete] = useState<SavedCollage | null>(null);
  const cardWidth = (width - 32 - 12) / 2;

  const reload = useCallback(() => listCollages(db, search).then(setCollages), [db, search]);

  const open = (item: SavedCollage) => {
    if (!item.isDraft) return router.push(`/collage/${item.id}`);
    startFrom(item);
    router.push('/collage/editor');
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
            onLongPress={item.isDraft ? () => setDraftToDelete(item) : undefined}
            style={{ width: cardWidth }}
            className="overflow-hidden rounded-ios-lg bg-card active:opacity-70"
          >
            {item.isDraft ? (
              <View pointerEvents="none">
                <CollageCanvas
                  layoutId={item.layoutId}
                  ratios={item.ratios}
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
      <ConfirmDialog
        open={draftToDelete !== null}
        title={t('home.deleteDraftTitle')}
        message={t('home.deleteDraftMessage')}
        actions={[
          { label: t('common.cancel') },
          {
            label: t('common.delete'),
            destructive: true,
            emphasized: true,
            onPress: async () => {
              if (draftToDelete) await removeCollage(db, draftToDelete.id);
              reload();
            },
          },
        ]}
        onClose={() => setDraftToDelete(null)}
      />
    </View>
  );
}
