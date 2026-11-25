import { navigateOnce } from '@/lib/navigate-once';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Download, Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, type DialogAction } from '@/components/ui/confirm-dialog';
import { Icon } from '@/components/ui/icon';
import { Row, Section } from '@/components/ui/grouped-list';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { getCollage } from '@/db/collages-repo';
import { useDraft } from '@/features/collage/draft-context';
import { ImageViewer } from '@/features/collage/ImageViewer';
import type { SavedCollage } from '@/features/collage/types';
import { removeCollage } from '@/services/collage-service';
import { saveToGalleryAlbum } from '@/services/gallery';

interface DialogState {
  title: string;
  message?: string;
  actions: DialogAction[];
}

export default function CollageDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const db = useSQLiteContext();
  const { startFrom } = useDraft();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [collage, setCollage] = useState<SavedCollage | null | undefined>(undefined);
  const [viewer, setViewer] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => {
    getCollage(db, id).then(setCollage);
  }, [db, id]);

  if (collage === undefined) return <View className="flex-1 bg-grouped" />;
  if (collage === null) {
    return (
      <View className="flex-1 bg-grouped">
        <ScreenHeader title={t('detail.title')} backLabel="" />
        <Text variant="subhead" className="p-8 text-center">
          {t('detail.loadFailed')}
        </Text>
      </View>
    );
  }

  const edit = () => {
    navigateOnce(() => {
      startFrom(collage);
      router.push('/collage/editor');
    });
  };

  const exportToGallery = async () => {
    try {
      await saveToGalleryAlbum(collage.renderedUri);
      setDialog({
        title: t('detail.savedToGallery'),
        actions: [{ label: t('common.ok'), emphasized: true }],
      });
    } catch (error) {
      const denied = error instanceof Error && error.message === 'gallery-permission-denied';
      setDialog({
        title: denied ? t('save.galleryDenied') : t('save.failed'),
        actions: [{ label: t('common.ok'), emphasized: true }],
      });
    }
  };

  const confirmDelete = () =>
    setDialog({
      title: t('detail.deleteTitle'),
      message: t('detail.deleteMessage'),
      actions: [
        { label: t('common.cancel') },
        {
          label: t('common.delete'),
          destructive: true,
          emphasized: true,
          onPress: async () => {
            await removeCollage(db, collage.id);
            router.back();
          },
        },
      ],
    });

  const { patient } = collage;

  return (
    <View className="flex-1 bg-grouped">
      <ScreenHeader
        title={patient.name || t('common.untitled')}
        backLabel=""
        right={
          <Button variant="plain" size="icon" accessibilityLabel={t('detail.edit')} onPress={edit}>
            <Icon as={Pencil} size={22} />
          </Button>
        }
      />
      <ScrollView
        contentContainerClassName="px-4 pt-2"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <Pressable
          accessibilityRole="imagebutton"
          onPress={() => setViewer(true)}
          className="mb-6 items-center"
        >
          <Image
            source={{ uri: collage.renderedUri }}
            className="aspect-[4/5] w-full max-w-[420px] rounded-ios-lg bg-secondary"
          />
        </Pressable>

        <Text variant="caption" className="mb-1.5 px-4">
          {t('detail.patient')}
        </Text>
        <View className="mb-6 gap-3">
          <Section className="mb-0">
            <Row label={t('detail.name')} value={patient.name || '—'} />
          </Section>
          <Section className="mb-0">
            <Row label={t('detail.email')} value={patient.email || '—'} />
          </Section>
          <Section className="mb-0">
            <Row label={t('detail.phone')} value={patient.phone || '—'} />
          </Section>
          <Section className="mb-0">
            <Row label={t('detail.procedures')} value={String(patient.procedureCount)} />
          </Section>
          {patient.description ? (
            <Section className="mb-0">
              <View className="gap-1 px-4 pb-3 pt-4">
                <Text variant="footnote">{t('detail.description')}</Text>
                <Text>{patient.description}</Text>
              </View>
            </Section>
          ) : null}
        </View>

        <Section>
          <Row label={t('detail.edit')} onPress={edit} right={<Icon as={Pencil} size={18} />} />
          <Row
            label={t('detail.saveToGallery')}
            onPress={exportToGallery}
            right={<Icon as={Download} size={18} />}
          />
          <Row
            label={t('detail.delete')}
            destructive
            onPress={confirmDelete}
            right={<Icon as={Trash2} size={18} className="text-destructive" />}
          />
        </Section>
      </ScrollView>
      <ImageViewer
        uri={viewer ? collage.renderedUri : null}
        closeLabel={t('common.done')}
        onClose={() => setViewer(false)}
      />
      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message}
        actions={dialog?.actions ?? []}
        onClose={() => setDialog(null)}
      />
    </View>
  );
}
