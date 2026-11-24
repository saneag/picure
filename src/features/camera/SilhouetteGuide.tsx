import Svg, { Circle, Path } from 'react-native-svg';
import { View } from 'react-native';

/** Front-facing full-body outline that shows where to frame a person. Ignores touches. */
export function SilhouetteGuide() {
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center pb-28">
      <Svg width="62%" height="66%" viewBox="0 0 100 240" opacity={0.55}>
        <Circle cx="50" cy="20" r="15" {...stroke} />
        <Path
          d="M42 36 L42 44 C26 46 14 52 12 68 L6 116 L16 118 L24 80 L26 130 L28 232 L46 232 L50 150 L54 232 L72 232 L74 130 L76 80 L84 118 L94 116 L88 68 C86 52 74 46 58 44 L58 36"
          {...stroke}
        />
      </Svg>
    </View>
  );
}

const stroke = {
  fill: 'none',
  stroke: '#ffffff',
  strokeWidth: 2,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};
