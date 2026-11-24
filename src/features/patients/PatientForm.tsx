import { Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/grouped-list';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { PatientInfo } from '@/features/collage/types';

interface PatientFormProps {
  value: PatientInfo;
  onChange: (value: PatientInfo) => void;
}

/** All patient fields are optional. */
export function PatientForm({ value, onChange }: PatientFormProps) {
  const { t } = useTranslation();
  const set = <K extends keyof PatientInfo>(key: K, next: PatientInfo[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <>
      <Section title={t('patient.section')} footer={t('patient.optional')}>
        <View className="flex-row items-center px-4">
          <Input
            value={value.name}
            onChangeText={(v) => set('name', v)}
            placeholder={t('patient.name')}
            autoCapitalize="words"
          />
        </View>
        <View className="flex-row items-center px-4">
          <Input
            value={value.email}
            onChangeText={(v) => set('email', v)}
            placeholder={t('patient.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View className="flex-row items-center px-4">
          <Input
            value={value.phone}
            onChangeText={(v) => set('phone', v)}
            placeholder={t('patient.phone')}
            keyboardType="phone-pad"
          />
        </View>
      </Section>

      <Section>
        <View className="px-4 py-1">
          <Input
            value={value.description}
            onChangeText={(v) => set('description', v)}
            placeholder={t('patient.descriptionPlaceholder')}
            multiline
            textAlignVertical="top"
            className="min-h-[96px]"
          />
        </View>
      </Section>

      <Section>
        <View className="min-h-[48px] flex-row items-center justify-between px-4 py-1.5">
          <Text>{t('patient.procedures')}</Text>
          <View className="flex-row items-center gap-3">
            <Button
              variant="gray"
              size="icon"
              className="h-8 w-8"
              accessibilityLabel="-"
              disabled={value.procedureCount <= 0}
              onPress={() => set('procedureCount', Math.max(0, value.procedureCount - 1))}
            >
              <Icon as={Minus} size={18} />
            </Button>
            <Text className="min-w-[24px] text-center font-semibold">{value.procedureCount}</Text>
            <Button
              variant="gray"
              size="icon"
              className="h-8 w-8"
              accessibilityLabel="+"
              onPress={() => set('procedureCount', value.procedureCount + 1)}
            >
              <Icon as={Plus} size={18} />
            </Button>
          </View>
        </View>
      </Section>
    </>
  );
}
