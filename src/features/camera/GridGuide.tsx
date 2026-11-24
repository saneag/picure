import { View } from 'react-native';

/** Rule-of-thirds grid (3x3 cells) drawn over the camera preview. Ignores touches. */
export function GridGuide() {
  const line = 'absolute bg-white/50';
  return (
    <View pointerEvents="none" className="absolute inset-0">
      <View className={`${line} inset-y-0 w-px`} style={{ left: '33.33%' }} />
      <View className={`${line} inset-y-0 w-px`} style={{ left: '66.67%' }} />
      <View className={`${line} inset-x-0 h-px`} style={{ top: '33.33%' }} />
      <View className={`${line} inset-x-0 h-px`} style={{ top: '66.67%' }} />
    </View>
  );
}
