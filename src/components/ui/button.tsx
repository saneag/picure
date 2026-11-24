import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { Text } from './text';

const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-ios active:opacity-60',
  {
    variants: {
      variant: {
        filled: 'bg-primary',
        tinted: 'bg-primary/15',
        gray: 'bg-secondary',
        plain: '',
        destructive: 'bg-destructive/15',
      },
      size: {
        default: 'h-[50px] px-5',
        compact: 'h-9 px-3.5',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: { variant: 'filled', size: 'default' },
  },
);

const labelVariants = cva('font-semibold', {
  variants: {
    variant: {
      filled: 'text-primary-foreground',
      tinted: 'text-primary',
      gray: 'text-foreground',
      plain: 'text-primary',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: { variant: 'filled' },
});

type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> &
  VariantProps<typeof buttonVariants> & {
    label?: string;
    children?: React.ReactNode;
    labelClassName?: string;
  };

export function Button({
  variant,
  size,
  label,
  children,
  className,
  labelClassName,
  onPress,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={(event) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      className={cn(buttonVariants({ variant, size }), disabled && 'opacity-40', className)}
      {...props}
    >
      {children}
      {label ? (
        <Text className={cn(labelVariants({ variant }), labelClassName)}>{label}</Text>
      ) : null}
    </Pressable>
  );
}
