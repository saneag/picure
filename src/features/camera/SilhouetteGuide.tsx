import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  SILHOUETTE_PATHS,
  SILHOUETTE_VIEWBOX,
  type Gender,
  type PoseView,
} from './silhouette-paths';

export interface Pose {
  gender: Gender;
  view: PoseView;
}

/** Outline that shows how to frame a person. Ignores touches. */
export function SilhouetteGuide({ gender, view }: Pose) {
  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center pb-28">
      <Svg height="72%" style={{ aspectRatio: 0.4 }} viewBox={SILHOUETTE_VIEWBOX} opacity={0.6}>
        <Path
          d={SILHOUETTE_PATHS[gender][view]}
          fill="none"
          stroke="#ffffff"
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
