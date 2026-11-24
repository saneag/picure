import { Text as RNText } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      body: 'text-[17px]',
      title: 'text-[34px] font-bold tracking-tight',
      heading: 'text-[22px] font-bold',
      headline: 'text-[17px] font-semibold',
      callout: 'text-base',
      subhead: 'text-[15px] text-muted-foreground',
      footnote: 'text-[13px] text-muted-foreground',
      caption: 'text-xs uppercase tracking-wide text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'body' },
});

type TextProps = ComponentProps<typeof RNText> & VariantProps<typeof textVariants>;

export function Text({ className, variant, ...props }: TextProps) {
  return <RNText className={cn(textVariants({ variant }), className)} {...props} />;
}
