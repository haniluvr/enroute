import tw from '@/lib/tailwind';
import {
    View, Text, TouchableOpacity, SafeAreaView, Image, Dimensions, StyleSheet
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withSpring,
    runOnJS, interpolate, Extrapolation
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { AnimatedGradient } from '@/components/AnimatedGradient';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        image: require('@/assets/onboarding-cards/onboarding-1.png'),
        title: "Your personalized\ncareer journey",
    },
    {
        id: '2',
        image: require('@/assets/onboarding-cards/onboarding-2.png'),
        title: "Voice powered\ncareer assistant",
    },
    {
        id: '3',
        image: require('@/assets/onboarding-cards/onboarding-3.png'),
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

export default function OnboardingScreen() {
    // We maintain a sliding window of the slides array
    const [cardOrder, setCardOrder] = useState<typeof SLIDES>([...SLIDES]);
    // The total "progress" through the deck (for the progress indicator)
    const [progressIndex, setProgressIndex] = useState(0);

    const isLastCard = progressIndex >= SLIDES.length - 1;

    // The shared values track the pan gesture of the TOP card
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);

    // Moves the top card to the back of the deck (infinite loop)
    const cycleTopCard = useCallback(() => {
        setCardOrder((prev) => {
            const next = [...prev];
            const topCard = next.shift();
            if (topCard) next.push(topCard);
            return next;
        });

        if (progressIndex < SLIDES.length - 1) {
            setProgressIndex(prev => prev + 1);
        }

        // Instantly reset the pan values since the physical top card component has changed
        translationX.value = 0;
        translationY.value = 0;
    }, [progressIndex, translationX, translationY]);

    const handleContinue = () => {
        if (progressIndex >= SLIDES.length - 1) {
            router.push('/auth-selection');
            return;
        }

        // Programmatic swipe right
        translationX.value = withTiming(width + 100, { duration: 300 }, () => {
            runOnJS(cycleTopCard)();
        });
    };

    const handleSkip = () => {
        router.push('/auth-selection');
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translationX.value = event.translationX;
            translationY.value = event.translationY;
        })
        .onEnd((event) => {
            // Check if swiped far enough left or right AND we are not on the last card
            if (!isLastCard && (Math.abs(event.translationX) > SWIPE_THRESHOLD || Math.abs(event.velocityX) > 800)) {
                // Fling off screen
                const direction = Math.sign(event.translationX) || (event.velocityX > 0 ? 1 : -1);
                translationX.value = withTiming(direction * (width + 100), { duration: 250 }, () => {
                    runOnJS(cycleTopCard)();
                });
            } else {
                // Spring back to center (always happens on the last card)
                translationX.value = withSpring(0, { damping: 15 });
                translationY.value = withSpring(0, { damping: 15 });
            }
        });

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
                    {/* Render from back to front */}
                    {cardOrder.map((slide, i) => {
                        // Only render the top VISIBLE_CARDS
                        if (i >= VISIBLE_CARDS) return null;

                        // Is this the top card actively being interacted with?
                        const isTopCard = i === 0;

                        // Calculate dynamic styles based on stack order
                        const animatedStyle = useAnimatedStyle(() => {
                            // If this is the top card, use the raw pan gesture
                            if (isTopCard) {
                                // Add a slight tilt based on X translation (10 degrees max)
                                const rotateZ = interpolate(
                                    translationX.value,
                                    [-width / 2, width / 2],
                                    [-8, 8],
                                    Extrapolation.CLAMP
                                );
                                return {
                                    transform: [
                                        { translateX: translationX.value },
                                        { translateY: translationY.value },
                                        { rotateZ: `${rotateZ}deg` }
                                    ],
                                    zIndex: 100 - i
                                };
                            }

                            // If this is a background card, it moves upward into the next slot 
                            // as the top card is dragged horizontally away from center
                            // If we are on the last card, we don't animate background cards up
                            const dragDistance = isLastCard ? 0 : Math.abs(translationX.value);
                            const animationProgress = Math.min(dragDistance / SWIPE_THRESHOLD, 1);

                            // The card's "virtual" index floats between its actual index `i` 
                            // and the next index up `i - 1` as the user drags
                            const floatIndex = i - animationProgress;

                            return {
                                transform: [
                                    { scale: Math.max(0, 1 - (floatIndex * SCALE_DOWN_PER_CARD)) },
                                    { translateY: floatIndex * Y_OFFSET_PER_CARD }
                                ],
                                zIndex: 100 - i,
                                // Only hide the card if it's strictly beyond the visible count
                                opacity: floatIndex >= VISIBLE_CARDS ? 0 : 1
                            };
                        });

                        return (
                            <GestureDetector key={slide.id} gesture={isTopCard ? panGesture : Gesture.Native()}>
                                <Animated.View style={[styles.cardContainer, animatedStyle]}>
                                    <View style={styles.card}>
                                        <AnimatedGradient
                                            colors={['#750080', '#2b6e6e', '#0e0e0e']}
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
                            {isLastCard ? 'Get started' : 'Continue'}
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
