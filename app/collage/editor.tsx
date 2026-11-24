import { useNavigation, usePreventRemove, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Camera,
  Expand,
  Images,
  LayoutGrid,
  Save,
  SlidersHorizontal,
  Tag,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, type DialogAction } from '@/components/ui/confirm-dialog';
import { Icon } from '@/components/ui/icon';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { CollageCanvas } from '@/features/collage/CollageCanvas';
import { useDraft } from '@/features/collage/draft-context';
import { ImageViewer } from '@/features/collage/ImageViewer';
import { LabelSheet } from '@/features/collage/LabelSheet';
import { LayoutPicker } from '@/features/collage/LayoutPicker';
import {
  CANVAS_ASPECT,
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
  getLayoutsForCount,
} from '@/features/collage/layouts';
import { SaveSheet, type SaveOptions } from '@/features/collage/SaveSheet';
import type { SlotCount } from '@/features/collage/types';
import { PatientForm } from '@/features/patients/PatientForm';
import { saveAsDraft, saveDraft } from '@/services/collage-service';
import { saveToGalleryAlbum } from '@/services/gallery';

interface DialogState {
  title: string;
  message?: string;
  actions: DialogAction[];
}

/** Width the hidden export canvas is laid out at; view-shot scales it to EXPORT_WIDTH. */
const EXPORT_LAYOUT_WIDTH = EXPORT_WIDTH / 2;

export default function EditorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const api = useDraft();
  const { draft } = api;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [selected, setSelected] = useState<number>(0);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [labelOpen, setLabelOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [busy, setBusy] = useState(false);
  const exportRef = useRef<ComponentRef<typeof View>>(null);
  const leaving = useRef(false);

  useEffect(() => {
    if (!draft && !leaving.current) router.replace('/');
  }, [draft, router]);

  usePreventRemove(api.isDirty && !leaving.current && !busy, ({ data }) => {
    const leave = () => {
      leaving.current = true;
      api.clear();
      navigation.dispatch(data.action);
    };
    setDialog({
      title: t('editor.discardTitle'),
      message: t('editor.discardMessage'),
      actions: [
        { label: t('editor.keepEditing'), emphasized: true },
        {
          label: t('editor.saveDraft'),
          onPress: async () => {
            if (!draft) return;
            try {
              await saveAsDraft(db, draft);
              leave();
            } catch {
              setDialog({
                title: t('save.failed'),
                actions: [{ label: t('common.ok'), emphasized: true }],
              });
            }
          },
        },
        { label: t('editor.discard'), destructive: true, onPress: leave },
      ],
    });
  });

  if (!draft) return null;

  const count = draft.slots.length as SlotCount;
  const slot = Math.min(selected, count - 1);
  const image = draft.slots[slot];
  const hasAnyImage = draft.slots.some((s) => s !== null);
  const canvasWidth = Math.max(0, Math.min(area.width, area.height * CANVAS_ASPECT));

  const changeCount = (next: SlotCount) => {
    const removed = draft.slots.slice(next).some((s) => s !== null);
    const apply = () => api.setSlotCount(next);
    if (!removed) return apply();
    setDialog({
      title: t('editor.reduceTitle'),
      message: t('editor.reduceMessage'),
      actions: [
        { label: t('common.cancel') },
        { label: t('editor.reduceConfirm'), destructive: true, emphasized: true, onPress: apply },
      ],
    });
  };

  // Replace targets one cell; adding to empty cells lets the picker fill several at once.
  const openGallery = () =>
    router.push({ pathname: '/gallery-picker', params: image ? { slot: String(slot) } : {} });
  const openCamera = () => router.push({ pathname: '/camera', params: { slot: String(slot) } });

  const isSavedCollage = !!draft.id && !draft.isDraft;

  const requestSave = (options: SaveOptions) => {
    const overriding = isSavedCollage && options.inApp && options.mode === 'override';
    if (!overriding) return runSave(options);
    setSaveOpen(false);
    setDialog({
      title: t('save.overrideTitle'),
      message: t('save.overrideMessage'),
      actions: [
        { label: t('common.cancel') },
        {
          label: t('save.overrideConfirm'),
          destructive: true,
          emphasized: true,
          onPress: () => runSave(options),
        },
      ],
    });
  };

  const runSave = async (options: SaveOptions) => {
    setBusy(true);
    setSaveOpen(false);
    try {
      const tempUri = await captureRef(exportRef, {
        format: 'jpg',
        quality: 0.95,
        result: 'tmpfile',
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
      });
      let finalUri = tempUri;
      if (options.inApp) {
        const mode = !draft.id ? 'new' : draft.isDraft ? 'override' : options.mode;
        const saved = await saveDraft(db, draft, tempUri, mode);
        finalUri = saved.renderedUri;
      }
      if (options.toGallery) await saveToGalleryAlbum(finalUri);

      if (options.inApp) {
        leaving.current = true;
        api.markSaved();
        api.clear();
        router.dismissTo('/');
      } else {
        api.markSaved();
        setDialog({
          title: t('detail.savedToGallery'),
          actions: [{ label: t('common.ok'), emphasized: true }],
        });
      }
    } catch (error) {
      const denied = error instanceof Error && error.message === 'gallery-permission-denied';
      setDialog({
        title: denied ? t('save.galleryDenied') : t('save.failed'),
        actions: [{ label: t('common.ok'), emphasized: true }],
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-grouped">
      <ScreenHeader
        title={isSavedCollage ? t('editor.editTitle') : t('editor.newTitle')}
        backLabel=""
        right={
          <>
            {getLayoutsForCount(count).length > 1 ? (
              <Button
                variant="plain"
                size="icon"
                accessibilityLabel={t('editor.layout')}
                onPress={() => setLayoutOpen(true)}
              >
                <Icon as={LayoutGrid} size={22} />
              </Button>
            ) : null}
            <Button
              variant="plain"
              size="icon"
              accessibilityLabel={t('editor.tabDetails')}
              onPress={() => setDetailsOpen(true)}
            >
              <Icon as={SlidersHorizontal} size={22} />
            </Button>
            <Button
              variant="plain"
              size="icon"
              accessibilityLabel={t('common.save')}
              disabled={!hasAnyImage || busy}
              onPress={() => setSaveOpen(true)}
            >
              <Icon as={Save} size={22} />
            </Button>
          </>
        }
      />

      <View className="flex-1">
        <View
          className="flex-1 items-center justify-center"
          onLayout={(e) => setArea(e.nativeEvent.layout)}
        >
          {canvasWidth > 0 ? (
            <View className="overflow-hidden">
              <CollageCanvas
                layoutId={draft.layoutId}
                slots={draft.slots}
                ratios={draft.ratios}
                width={canvasWidth}
                interactive
                selectedSlot={slot}
                addLabel={t('editor.addPhoto')}
                missingLabel={t('editor.missingImage')}
                onSelect={setSelected}
                onRatioChange={api.setRatio}
                onTransformEnd={(index, transform) => api.updateImage(index, transform)}
              />
            </View>
          ) : null}
        </View>

        <View className="flex-row justify-around px-2 pb-6 pt-2">
          <ToolButton
            icon={Images}
            label={image ? t('editor.replace') : t('editor.fromGallery')}
            onPress={openGallery}
          />
          <ToolButton icon={Camera} label={t('editor.fromCamera')} onPress={openCamera} />
          {image ? (
            <>
              <ToolButton icon={Tag} label={t('editor.label')} onPress={() => setLabelOpen(true)} />
              <ToolButton
                icon={Expand}
                label={t('editor.expand')}
                onPress={() => setViewerUri(image.uri)}
              />
              <ToolButton
                icon={Trash2}
                label={t('editor.removePhoto')}
                destructive
                onPress={() => api.clearSlot(slot)}
              />
            </>
          ) : null}
        </View>
      </View>

      <BottomSheet
        visible={layoutOpen}
        title={t('editor.layout')}
        closeLabel={t('common.done')}
        onClose={() => setLayoutOpen(false)}
      >
        <LayoutPicker count={count} value={draft.layoutId} onChange={api.setLayout} />
      </BottomSheet>
      <BottomSheet
        visible={detailsOpen}
        title={t('editor.tabDetails')}
        closeLabel={t('common.done')}
        onClose={() => setDetailsOpen(false)}
      >
        <View className="mb-4 flex-row items-center justify-between gap-4">
          <Text variant="subhead">{t('editor.images')}</Text>
          <SegmentedControl<number>
            className="w-44"
            value={count}
            onChange={(value) => changeCount(value as SlotCount)}
            options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
          />
        </View>
        <PatientForm value={draft.patient} onChange={api.setPatient} />
      </BottomSheet>

      {/* Rendered off-screen at a fixed size so the saved picture never depends on the phone's layout. */}
      <View pointerEvents="none" style={{ position: 'absolute', left: -10000, top: 0 }}>
        <View ref={exportRef} collapsable={false}>
          <CollageCanvas
            layoutId={draft.layoutId}
            slots={draft.slots}
            ratios={draft.ratios}
            width={EXPORT_LAYOUT_WIDTH}
          />
        </View>
      </View>

      <LabelSheet
        visible={labelOpen}
        label={image?.label ?? null}
        onChange={(label) => api.updateLabel(slot, label)}
        onClose={() => setLabelOpen(false)}
      />
      <SaveSheet
        visible={saveOpen}
        isExisting={isSavedCollage}
        busy={busy}
        onClose={() => setSaveOpen(false)}
        onSave={requestSave}
      />
      <ImageViewer
        uri={viewerUri}
        closeLabel={t('common.done')}
        onClose={() => setViewerUri(null)}
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

function ToolButton({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-w-[60px] items-center gap-1 active:opacity-50"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-card">
        <Icon as={icon} size={22} className={destructive ? 'text-destructive' : 'text-primary'} />
      </View>
      <Text variant="footnote" className={destructive ? 'text-destructive' : 'text-primary'}>
        {label}
      </Text>
    </Pressable>
  );
}
