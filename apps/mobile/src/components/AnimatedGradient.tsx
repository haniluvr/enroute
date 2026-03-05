import { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    SharedValue,
} from 'react-native-reanimated';

const CYCLE = 12000; // total loop duration ms

// Three gradient "angles" to blend between
const LAYERS = [
    { start: { x: 0.0, y: 0.0 }, end: { x: 1.0, y: 1.0 } }, // diagonal ↘
    { start: { x: 1.0, y: 0.0 }, end: { x: 0.0, y: 1.0 } }, // diagonal ↙
    { start: { x: 0.5, y: 0.0 }, end: { x: 0.5, y: 1.0 } }, // straight ↓
];

// Each layer pulses 0→1→0 once per cycle, offset by 1/3 so one is always cresting
function makeLayerStyle(progress: SharedValue<number>, offset: number) {
    return useAnimatedStyle(() => {
        const p = (progress.value + offset) % 1;
        // sin²(p·π): smooth bump from 0 → 1 → 0 over one cycle, always ≥ 0
        const opacity = Math.sin(p * Math.PI) ** 2;
        return { opacity };
    });
}

interface AnimatedGradientProps {
    colors: readonly [string, string, ...string[]];
    locations?: readonly [number, number, ...number[]];
    style?: StyleProp<ViewStyle>;
}

export function AnimatedGradient({ colors, locations, style }: AnimatedGradientProps) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: CYCLE, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const styleA = makeLayerStyle(progress, 0);
    const styleB = makeLayerStyle(progress, 1 / 3);
    const styleC = makeLayerStyle(progress, 2 / 3);

    return (
        <View style={style}>
            {LAYERS.map((layer, i) => {
                const layerStyle = [styleA, styleB, styleC][i];
                return (
                    <Animated.View key={i} style={[StyleSheet.absoluteFill, layerStyle]}>
                        <LinearGradient
                            colors={colors}
                            locations={locations}
                            style={StyleSheet.absoluteFill}
                            start={layer.start}
                            end={layer.end}
                        />
                    </Animated.View>
                );
            })}
        </View>
    );
}
