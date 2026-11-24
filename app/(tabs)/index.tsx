import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Camera, Plus, Search } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { listCollages } from '@/db/collages-repo';
import { useDraft } from '@/features/collage/draft-context';
import type { SavedCollage } from '@/features/collage/types';

export default function CollagesScreen() {
  const { t, i18n } = useTranslation();
  const db = useSQLiteContext();
  const router = useRouter();
  const { startNew } = useDraft();
  const [search, setSearch] = useState('');
  const [collages, setCollages] = useState<SavedCollage[]>([]);

  useFocusEffect(
    useCallback(() => {
      listCollages(db, search).then(setCollages);
    }, [db, search]),
  );

  const createNew = () => {
    startNew();
    router.push('/collage/editor');
  };
  const takePhoto = () => {
    startNew();
    router.push({ pathname: '/camera', params: { from: 'home' } });
  };

  return (
    <View className="flex-1 bg-grouped">
      <ScreenHeader
        large
        title={t('home.title')}
        right={
          <>
            <Button
              variant="tinted"
              size="icon"
              accessibilityLabel={t('home.camera')}
              onPress={takePhoto}
            >
              <Icon as={Camera} size={20} />
            </Button>
            <Button
              variant="tinted"
              size="icon"
              accessibilityLabel={t('home.newCollage')}
              onPress={createNew}
            >
              <Icon as={Plus} size={22} />
            </Button>
          </>
        }
      />
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
            onPress={() => router.push(`/collage/${item.id}`)}
            className="flex-1 overflow-hidden rounded-ios-lg bg-card active:opacity-70"
          >
            <Image
              source={{ uri: item.renderedUri }}
              className="aspect-[4/5] w-full bg-secondary"
            />
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
    </View>
  );
}
