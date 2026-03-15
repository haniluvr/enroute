import tw from '@/lib/tailwind';
import {
    View, Text, TouchableOpacity, SafeAreaView, Image, Dimensions, StyleSheet
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withSpring,
    runOnJS, interpolate, Extrapolation, SharedValue
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { AnimatedGradient } from '@/components/AnimatedGradient';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        image: require('@/assets/onboarding-cards/onboarding-1.webp'),
        title: "Your personalized\ncareer journey",
    },
    {
        id: '2',
        image: require('@/assets/onboarding-cards/onboarding-2.webp'),
        title: "Voice powered\ncareer assistant",
    },
    {
        id: '3',
        image: require('@/assets/onboarding-cards/onboarding-3.webp'),
        title: "Curated resources\n& Roadmaps",
    },
];

// Stacking visual config
const VISIBLE_CARDS = 3;
// How much the card behind drops down (vertical peeking) - increased to show more
const Y_OFFSET_PER_CARD = 32;
// How much the card behind shrinks horizontally - decreased so 3rd card isn't tiny
const SCALE_DOWN_PER_CARD = 0.05;

// The threshold distance for a swipe to be considered "completed"
const SWIPE_THRESHOLD = width * 0.35;
const OnboardingCard = ({
    slide,
    index,
    globalActiveIndex,
    isLastSlide,
    onSwipeComplete,
}: {
    slide: typeof SLIDES[0];
    index: number;
    globalActiveIndex: SharedValue<number>;
    isLastSlide: boolean;
    onSwipeComplete: () => void;
}) => {
    const localTranslateX = useSharedValue(0);
    const localTranslateY = useSharedValue(0);
    const isInteracting = useSharedValue(false);

    const gesture = Gesture.Pan()
        .enabled(!isLastSlide)
        .onStart(() => {
            // Only allow interaction if this is the current top card
            const currentFloatIndex = Math.abs(globalActiveIndex.value - index);
            if (currentFloatIndex < 0.1) {
                isInteracting.value = true;
            }
        })
        .onUpdate((event) => {
            if (!isInteracting.value) return;
            localTranslateX.value = event.translationX;
            localTranslateY.value = event.translationY;
            
            // Advance the background cards as we drag
            const progress = Math.abs(event.translationX) / SWIPE_THRESHOLD;
            globalActiveIndex.value = index + Math.min(progress, 1);
        })
        .onEnd((event) => {
            if (!isInteracting.value) return;
            isInteracting.value = false;

            if (Math.abs(event.translationX) > SWIPE_THRESHOLD || Math.abs(event.velocityX) > 800) {
                const direction = Math.sign(event.translationX);
                // Animate to the next card globally
                localTranslateX.value = withTiming(direction * (width + 100), { duration: 250 });
                globalActiveIndex.value = withTiming(index + 1, { duration: 250 }, () => {
                    runOnJS(onSwipeComplete)();
                });
            } else {
                // Snap back
                localTranslateX.value = withSpring(0);
                localTranslateY.value = withSpring(0);
                globalActiveIndex.value = withSpring(index);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const floatIndex = index - globalActiveIndex.value;

        // Swiped away card
        if (floatIndex < 0) {
            const rotateZ = interpolate(
                localTranslateX.value,
                [-width / 2, width / 2],
                [-8, 8],
                Extrapolation.CLAMP
            );
            return {
                transform: [
                    { translateX: localTranslateX.value },
                    { translateY: localTranslateY.value },
                    { rotateZ: `${rotateZ}deg` }
                ],
                zIndex: 100,
                opacity: interpolate(floatIndex, [-1, 0], [0, 1])
            };
        }

        // Stacked card
        return {
            transform: [
                { scale: Math.max(0, 1 - (floatIndex * SCALE_DOWN_PER_CARD)) },
                { translateY: floatIndex * Y_OFFSET_PER_CARD }
            ],
            zIndex: 100 - index,
            opacity: floatIndex >= VISIBLE_CARDS ? 0 : 1
        };
    });

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.cardContainer, animatedStyle]}>
                <View style={styles.card}>
                    <AnimatedGradient
                        colors={['#6d3659', '#af88ad', '#2b4e50', '#111111']}
                        style={StyleSheet.absoluteFill}
                    />
                    <Image source={slide.image} style={styles.cardImage} resizeMode="contain" />
                    <View style={styles.cardTextContainer}>
                        <Text style={tw`text-4xl text-white font-[InterTight] font-semibold text-left leading-10`}>
                            {slide.title}
                        </Text>
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};

export default function OnboardingScreen() {
    const [progressIndex, setProgressIndex] = useState(0);
    const globalActiveIndex = useSharedValue(0);

    const isLastSlide = progressIndex >= SLIDES.length - 1;

    const handleSwipeComplete = useCallback(() => {
        setProgressIndex(prev => prev + 1);
    }, []);

    const handleContinue = () => {
        if (isLastSlide) {
            router.push('/auth-selection');
            return;
        }

        // Animate promotion via the global index
        globalActiveIndex.value = withTiming(progressIndex + 1, { duration: 300 }, () => {
            runOnJS(handleSwipeComplete)();
        });
    };

    const handleSkip = () => {
        router.push('/auth-selection');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#111111' }}>
            <SafeAreaView style={tw`flex-1`}>

                {/* Progress bar + header */}
                <View style={tw`px-6 pt-1 pb-10`}>
                    <View style={tw`flex-row gap-2 mb-5`}>
                        {SLIDES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    tw`h-[3px] rounded-full flex-1`,
                                    index <= progressIndex ? tw`bg-white` : tw`bg-white/25`
                                ]}
                            />
                        ))}
                    </View>
                    <View style={tw`flex-row items-center`}>
                        <Image source={require('@/assets/logo.png')} style={tw`w-7 h-7 mr-2`} resizeMode="contain" />
                        <Text style={tw`text-white font-[InterTight] font-bold italic text-2xl`}>enroute</Text>
                    </View>
                </View>

                {/* Card Deck Area */}
                <View style={styles.deckWrapper}>
                    {SLIDES.map((slide, i) => {
                        // Only render the window of visible cards
                        if (i < progressIndex - 1 || i > progressIndex + VISIBLE_CARDS) return null;
                        
                        return (
                            <OnboardingCard
                                key={slide.id}
                                slide={slide}
                                index={i}
                                globalActiveIndex={globalActiveIndex}
                                isLastSlide={isLastSlide}
                                onSwipeComplete={handleSwipeComplete}
                            />
                        );
                    }).reverse()}
                </View>

                {/* Buttons */}
                <View style={tw`px-6 pb-8 pt-20`}>
                    <TouchableOpacity
                        onPress={handleContinue}
                        activeOpacity={0.85}
                        style={tw`w-full bg-white py-4 rounded-full items-center justify-center mb-4`}
                    >
                        <Text style={tw`text-black text-lg font-[InterTight] font-semibold`}>
                            {isLastSlide ? 'Get started' : 'Continue'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSkip}
                        activeOpacity={0.7}
                        style={tw`w-full py-2 items-center justify-center opacity-60`}
                    >
                        <Text style={tw`text-white text-base font-[InterTight] font-medium`}>Skip</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    deckWrapper: {
        flex: 1,
        marginHorizontal: 20,
        marginBottom: 8,
    },
    cardContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    card: {
        flex: 1,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: '#050505', // Solid base to prevent seeing cards behind it
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '50%',
        marginTop: 80,
    },
    cardTextContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 40,
        paddingBottom: 40,
    },
});
