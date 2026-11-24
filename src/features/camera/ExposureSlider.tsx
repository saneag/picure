import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from '@/components/ui/text';

interface ExposureSliderProps {
  min: number;
  max: number;
  /** EV per index step, only used for the label. */
  step: number;
  value: number;
  onChange: (index: number) => void;
}

const THUMB = 28;

/** Horizontal slider for exposure compensation. Tapping the EV label puts it back to 0. */
export function ExposureSlider({ min, max, step, value, onChange }: ExposureSliderProps) {
  const [width, setWidth] = useState(0);
  const span = Math.max(1, max - min);
  const travel = Math.max(1, width - THUMB);

  const setFromX = (x: number) => {
    const fraction = Math.min(1, Math.max(0, (x - THUMB / 2) / travel));
    onChange(Math.round(min + fraction * span));
  };

  const gesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => setFromX(e.x))
    .onUpdate((e) => setFromX(e.x));

  const ev = value * step;
  const left = ((value - min) / span) * travel;
  const zeroLeft = ((0 - min) / span) * travel + THUMB / 2;

  return (
    <View className="w-full flex-row items-center gap-3 rounded-full bg-black/40 px-4 py-2">
      <GestureDetector gesture={gesture}>
        <View
          className="h-10 flex-1 justify-center"
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          <View className="h-[3px] rounded-full bg-white/40" />
          <View
            className="absolute h-3 w-[2px] bg-white/70"
            style={{ left: zeroLeft - 1 }}
            pointerEvents="none"
          />
          <View
            pointerEvents="none"
            className="absolute rounded-full bg-white"
            style={{ left, width: THUMB, height: THUMB }}
          />
        </View>
      </GestureDetector>
      <Text numberOfLines={1} className="w-20 text-center text-white" onPress={() => onChange(0)}>
        {`${ev > 0 ? '+' : ''}${ev.toFixed(1)} EV`}
      </Text>
    </View>
  );
}
