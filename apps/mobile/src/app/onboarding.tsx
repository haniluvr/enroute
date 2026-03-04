import tw from '@/lib/tailwind';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, SafeAreaView, NativeSyntheticEvent, NativeScrollEvent, Image } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { Map, Mic, LayoutDashboard } from 'lucide-react-native';
import { router } from 'expo-router';
import { useRef, useState } from 'react';

const { width } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        icon: <Map color="#00e5ff" size={80} />,
        title: "Your personalized\ncareer journey",
    },
    {
        id: '2',
        icon: <Mic color="#6834F5" size={80} />,
        title: "Voice powered\ncareer assistant",
    },
    {
        id: '3',
        icon: <LayoutDashboard color="#FF2A85" size={80} />,
        title: "Curated resources\n& Roadmaps",
    }
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        if (slideIndex !== currentIndex) {
            setCurrentIndex(slideIndex);
        }
    };

    const handleContinue = () => {
        if (currentIndex < slides.length - 1) {
            scrollRef.current?.scrollTo({ x: width * (currentIndex + 1), animated: true });
        } else {
            router.push('/auth-selection');
        }
    };

    const handleSkip = () => {
        router.push('/auth-selection');
    };

    return (
        <GlassBackground>
            <SafeAreaView style={tw`flex-1`}>

                {/* Header indicators and Logo */}
                <View style={tw`px-6 pt-12 pb-6`}>
                    <View style={tw`flex-row justify-center space-x-2 mb-6 gap-2`}>
                        {slides.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    tw`h-1 rounded-full flex-1`,
                                    index === currentIndex ? tw`bg-white` : tw`bg-white/20`
                                ]}
                            />
                        ))}
                    </View>

                    <View style={tw`flex-row items-center`}>
                        <Image source={require('@/assets/logo.png')} style={tw`w-6 h-6 mr-2`} resizeMode="contain" />
                        <Text style={tw`text-white font-[InterTight] font-bold italic text-lg`}>enroute</Text>
                    </View>
                </View>

                {/* Swipeable Cards Area */}
                <View style={tw`flex-1 justify-center`}>
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={onScroll}
                        scrollEventThrottle={16}
                    >
                        {slides.map((slide) => (
                            <View key={slide.id} style={{ width, paddingHorizontal: 24, justifyContent: 'center' }}>
                                <GlassCard style={tw`h-[65%] flex-col p-8 border-white/20`}>

                                    <View style={tw`flex-1 items-center justify-center`}>
                                        {slide.icon}
                                    </View>

                                    <View style={tw`mt-auto`}>
                                        <Text style={tw`text-3xl text-white font-[InterTight-SemiBold] text-left leading-10`}>
                                            {slide.title}
                                        </Text>
                                    </View>
                                </GlassCard>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Bottom Actions */}
                <View style={tw`px-6 pb-12 pt-6`}>
                    <TouchableOpacity
                        onPress={handleContinue}
                        activeOpacity={0.8}
                        style={tw`w-full bg-white py-4 rounded-full items-center justify-center mb-4`}
                    >
                        <Text style={tw`text-black text-lg font-[InterTight-Bold]`}>Continue</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSkip}
                        activeOpacity={0.8}
                        style={tw`w-full py-2 items-center justify-center opacity-60`}
                    >
                        <Text style={tw`text-white text-md font-[InterTight-Medium]`}>Skip</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </GlassBackground>
    );
}
