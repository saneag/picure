import { TextInput } from 'react-native';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export function Input({ className, ...props }: ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#8E8E93"
      textAlignVertical="center"
      className={cn('min-h-[44px] flex-1 py-0 text-[17px] text-foreground', className)}
      {...props}
    />
  );
}
