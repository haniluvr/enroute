import tw from '@/lib/tailwind';
import { View, Text } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { Sparkles, Mic } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';

export default function DiscoverScreen() {
    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`flex-1 items-center justify-center px-6`}>

                {/* Placeholder for actual Card Swiper */}
                <View style={tw`items-center mb-10 w-full`}>
                    <Text style={tw`text-3xl text-white font-[InterTight-Bold] text-center mb-4`}>Career Swipe</Text>

                    <GlassCard style={tw`w-full h-80 items-center justify-center border-accent-cyan/30`}>
                        <Sparkles color="#00e5ff" size={48} style={tw`mb-4`} />
                        <Text style={tw`text-gray-300 text-center font-[InterTight] font-medium px-6`}>
                            AI is generating new opportunities for you based on your major and skills. Swipe right to apply.
                        </Text>
                    </GlassCard>
                </View>

                {/* Dahlia Quick Voice Link Placeholder */}
                <View style={tw`absolute bottom-32 bg-accent-violet/20 p-6 rounded-full border border-accent-violet/50 shadow-2xl`}>
                    <Mic color="#fff" size={32} />
                </View>
                <Text style={tw`absolute bottom-24 text-gray-400 font-[InterTight-SemiBold]`}>Tap to speak with Dahlia</Text>

            </View>
        </GlassBackground>
    );
}
