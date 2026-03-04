import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity, SafeAreaView, Linking, Image } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { Map, Navigation, Lightbulb } from 'lucide-react-native';
import { router } from 'expo-router';

export default function AuthSelectionScreen() {
    return (
        <GlassBackground>
            <SafeAreaView style={tw`flex-1 justify-between`}>

                {/* Logo */}
                <View style={tw`px-6 pt-12 flex-row items-center`}>
                    <Image source={require('@/assets/logo.png')} style={tw`w-6 h-6 mr-2`} resizeMode="contain" />
                    <Text style={tw`text-white font-[InterTight] font-bold italic text-lg`}>enroute</Text>
                </View>

                {/* Tagline Reiteration */}
                <View style={tw`px-6 flex-1 justify-end pb-10`}>
                    <Text style={tw`text-4xl text-white font-[InterTight] font-bold mb-2`}>
                        Enroute helps you <View style={{ transform: [{ translateY: 4 }] }}><Map color="#ffffff" size={30} style={tw`mx-1`} /></View>
                    </Text>

                    <Text style={tw`text-4xl text-white font-[InterTight] font-bold mb-2`}>
                        Plan smarter, <View style={{ transform: [{ translateY: 4 }] }}><Navigation color="#ffffff" size={30} style={tw`mx-1`} /></View> Find
                    </Text>

                    <Text style={tw`text-4xl text-white font-[InterTight] font-bold mb-2`}>
                        your path, and
                    </Text>

                    <Text style={tw`text-4xl text-white font-[InterTight] font-bold`}>
                        <View style={{ transform: [{ translateY: 4 }] }}><Lightbulb color="#ffffff" size={30} style={tw`mr-1`} /></View> Grow your future.
                    </Text>
                </View>

                {/* Bottom Actions */}
                <View style={tw`px-6 pb-12`}>
                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/sign-up')}
                        activeOpacity={0.8}
                        style={tw`w-full bg-white py-4 rounded-full items-center justify-center mb-4`}
                    >
                        <Text style={tw`text-black text-lg font-[InterTight-Bold]`}>Create new account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/sign-in')}
                        activeOpacity={0.8}
                        style={tw`w-full bg-white/10 border border-white/20 py-4 rounded-full items-center justify-center mb-10`}
                    >
                        <Text style={tw`text-white text-lg font-[InterTight-Bold]`}>Login</Text>
                    </TouchableOpacity>

                    {/* Terms & Conditions text */}
                    <Text style={tw`text-gray-500 font-[InterTight-Regular] text-xs text-center leading-5`}>
                        By continuing, you accept our{' '}
                        <Text
                            onPress={() => Linking.openURL('https://example.com/terms')}
                            style={tw`text-white font-[InterTight-Medium] underline`}
                        >
                            Terms & Conditions
                        </Text>
                        {' '}and{' '}
                        <Text
                            onPress={() => Linking.openURL('https://example.com/privacy')}
                            style={tw`text-white font-[InterTight-Medium] underline`}
                        >
                            Privacy Policy
                        </Text>.
                    </Text>
                </View>

            </SafeAreaView>
        </GlassBackground>
    );
}
