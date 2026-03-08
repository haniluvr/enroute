import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

interface SwipeableCardProps {
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    stackIndex: number; // 0 = top, 1 = second, 2 = third
}

export function SwipeableCard({ children, onSwipeLeft, onSwipeRight, stackIndex }: SwipeableCardProps) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // Internal shared value to animate stack position changes
    const animatedStackIndex = useSharedValue(stackIndex);

    useEffect(() => {
        animatedStackIndex.value = withSpring(stackIndex, { damping: 15, stiffness: 100 });
    }, [stackIndex]);

    const gesture = Gesture.Pan()
        .enabled(stackIndex === 0)
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                const direction = event.translationX > 0 ? 1 : -1;
                translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
                    if (direction === 1) {
                        onSwipeRight && runOnJS(onSwipeRight)();
                    } else {
                        onSwipeLeft && runOnJS(onSwipeLeft)();
                    }
                });
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const isTop = stackIndex === 0;

        // Base stack transformations
        const scale = interpolate(
            animatedStackIndex.value,
            [0, 1, 2],
            [1, 0.94, 0.88],
            Extrapolation.CLAMP
        );

        const stackTranslateY = interpolate(
            animatedStackIndex.value,
            [0, 1, 2],
            [0, -14, -28],
            Extrapolation.CLAMP
        );

        const stackOpacity = interpolate(
            animatedStackIndex.value,
            [0, 1, 2],
            [1, 0.9, 0.8],
            Extrapolation.CLAMP
        );

        // Swiping transformations (only for top card)
        const rotate = isTop
            ? interpolate(
                translateX.value,
                [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
                [-10, 0, 10],
                Extrapolation.CLAMP
            )
            : 0;

        const swipeOpacity = isTop
            ? interpolate(
                translateX.value,
                [-SCREEN_WIDTH / 2, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, SCREEN_WIDTH / 2],
                [0.5, 0.8, 1, 0.8, 0.5],
                Extrapolation.CLAMP
            )
            : stackOpacity;

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value + stackTranslateY },
                { scale },
                { rotate: `${rotate}deg` },
            ],
            opacity: isTop ? swipeOpacity : stackOpacity,
            zIndex: 1000 - stackIndex,
        };
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <GestureDetector gesture={gesture}>
                <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
                    {children}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}
