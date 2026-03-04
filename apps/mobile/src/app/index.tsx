import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { Map, Navigation, Siren } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Simulate app loading/splash screen specifically for 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GlassBackground>
      {showSplash ? (
        // Splash Screen
        <Animated.View
          entering={FadeIn.duration(800)}
          exiting={FadeOut.duration(800)}
          style={tw`flex-1 items-center justify-center`}
        >
          <View style={tw`flex-row items-center justify-center mb-8`}>
            <Image source={require('@/assets/logo.png')} style={tw`w-12 h-12 mr-3`} resizeMode="contain" />
            <Text style={tw`text-5xl text-white font-[InterTight] font-bold italic`}>enroute</Text>
          </View>
          <Text style={tw`absolute bottom-10 text-gray-500 font-[InterTight-Regular] text-xs`}>
            v1.0.0
          </Text>
        </Animated.View>
      ) : (
        // Intro Screen
        <Animated.View
          entering={FadeIn.delay(300).duration(800)}
          style={tw`flex-1 px-6 justify-end pb-10`}
        >
          <View style={tw`mb-10 text-left`}>
            <Animated.Text entering={FadeIn.delay(400)} style={tw`text-4xl text-white font-[InterTight] font-bold mb-2 leading-10`}>
              Enroute helps you <View style={{ transform: [{ translateY: 12 }] }}><Map color="#ffffff" size={33} style={tw`mx-1`} /></View>
            </Animated.Text>

            <Animated.Text entering={FadeIn.delay(600)} style={tw`text-4xl text-white font-[InterTight] font-bold mb-2 leading-10`}>
              Plan smarter, <View style={{ transform: [{ translateY: 12 }] }}><Navigation color="#ffffff" size={33} style={tw`mx-1`} /></View> Find
            </Animated.Text>

            <Animated.Text entering={FadeIn.delay(800)} style={tw`text-4xl text-white font-[InterTight] font-bold mb-1`}>
              your path, and
            </Animated.Text>

            <Animated.Text entering={FadeIn.delay(1000)} style={tw`text-4xl text-white font-[InterTight] font-bold`}>
              <View style={{ transform: [{ translateY: 2 }] }}><Siren color="#ffffff" size={33} /></View> Grow your future.
            </Animated.Text>
          </View>

          <Animated.View entering={SlideInDown.delay(1200).springify()} style={tw`w-full items-center`}>
            <TouchableOpacity
              onPress={() => router.push('/onboarding')}
              activeOpacity={0.8}
              style={tw`w-full bg-white py-4 rounded-full items-center justify-center mb-6 shadow-lg shadow-white/20`}
            >
              <Text style={tw`text-black text-lg font-[InterTight-Bold]`}>Get started</Text>
            </TouchableOpacity>
            <Text style={tw`text-gray-500 font-[InterTight-Regular] text-xs`}>
              v1.0.0
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </GlassBackground>
  );
}
