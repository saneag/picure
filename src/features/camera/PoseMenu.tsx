import { Mars, Venus } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { GENDERS, POSE_VIEWS, type Gender } from './silhouette-paths';
import type { Pose } from './SilhouetteGuide';

const GENDER_ICON = { male: Mars, female: Venus };
const BUTTON = 'h-11 w-11 items-center justify-center rounded-full bg-black/40 active:opacity-70';

interface PoseMenuProps {
  pose: Pose | null;
  onChange: (pose: Pose | null) => void;
  top: number;
}

/** Male and female buttons; each opens a small list of views. Picking the active view hides it. */
export function PoseMenu({ pose, onChange, top }: PoseMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<Gender | null>(null);

  return (
    <>
      {GENDERS.map((gender, index) => {
        const active = pose?.gender === gender;
        const y = top + index * 56;
        return (
          <View key={gender} className="absolute right-4" style={{ top: y }}>
            <Pressable
              accessibilityLabel={t(`camera.${gender}`)}
              onPress={() => setOpen(open === gender ? null : gender)}
              className={BUTTON}
            >
              <Icon
                as={GENDER_ICON[gender]}
                className={active ? 'text-primary' : 'text-white'}
                size={24}
              />
            </Pressable>
            {open === gender ? (
              <View className="absolute right-14 top-0 w-28 overflow-hidden rounded-2xl bg-black/70">
                {POSE_VIEWS.map((view) => {
                  const selected = active && pose?.view === view;
                  return (
                    <Pressable
                      key={view}
                      onPress={() => {
                        onChange(selected ? null : { gender, view });
                        setOpen(null);
                      }}
                      className="px-4 py-3 active:bg-white/10"
                    >
                      <Text className={selected ? 'text-primary' : 'text-white'}>
                        {t(`camera.${view}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </>
  );
}
