import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

export interface DialogAction {
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Bold, like the default action of an iOS alert. */
  emphasized?: boolean;
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  actions: DialogAction[];
  onClose: () => void;
}

/** iOS-style alert: centered card, hairline-separated actions at the bottom. */
export function ConfirmDialog({ open, title, message, actions, onClose }: ConfirmDialogProps) {
  const stacked = actions.length > 2;
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="absolute inset-0 items-center justify-center bg-black/40 px-10">
          <AlertDialogPrimitive.Content className="w-full max-w-[300px] overflow-hidden rounded-[14px] bg-card">
            <View className="items-center gap-1 px-4 pb-4 pt-5">
              <AlertDialogPrimitive.Title asChild>
                <Text variant="headline" className="text-center">
                  {title}
                </Text>
              </AlertDialogPrimitive.Title>
              {message ? (
                <AlertDialogPrimitive.Description asChild>
                  <Text className="text-center text-[13px]">{message}</Text>
                </AlertDialogPrimitive.Description>
              ) : null}
            </View>
            <View
              className={cn('border-hairline border-t border-separator', !stacked && 'flex-row')}
            >
              {actions.map((action, index) => (
                <AlertDialogPrimitive.Action
                  key={action.label}
                  onPress={() => {
                    onClose();
                    action.onPress?.();
                  }}
                  className={cn(
                    'min-h-[44px] flex-1 items-center justify-center active:bg-secondary',
                    index > 0 &&
                      (stacked ? 'border-t' : 'border-l') + ' border-hairline border-separator',
                  )}
                >
                  <Text
                    className={cn(
                      'text-[17px] text-primary',
                      action.destructive && 'text-destructive',
                      action.emphasized && 'font-semibold',
                    )}
                  >
                    {action.label}
                  </Text>
                </AlertDialogPrimitive.Action>
              ))}
            </View>
          </AlertDialogPrimitive.Content>
        </AlertDialogPrimitive.Overlay>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
