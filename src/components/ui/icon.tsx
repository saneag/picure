import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { cssInterop } from 'nativewind';

type IconProps = LucideProps & { as: LucideIcon };

function IconImpl({ as: IconComponent, ...props }: IconProps) {
  return <IconComponent {...props} />;
}

// Lets `className="text-primary"` set the icon color.
cssInterop(IconImpl, {
  className: { target: 'style', nativeStyleToProp: { color: 'color', opacity: true } },
});

export function Icon({ className = 'text-primary', size = 22, ...props }: IconProps) {
  return <IconImpl className={className} size={size} {...props} />;
}
