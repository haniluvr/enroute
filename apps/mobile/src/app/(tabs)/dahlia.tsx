import tw from '@/lib/tailwind';
import { View, Text } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { Sparkles } from 'lucide-react-native';

export default function DahliaScreen() {
    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`flex-1 items-center justify-center p-6`}>
                <View style={tw`bg-accent-pink/20 p-4 rounded-full mb-6`}>
                    <Sparkles color="#ff007f" size={48} />
                </View>
                <Text style={tw`text-white font-[InterTight-Bold] text-3xl mb-4`}>Dahlia AI</Text>
                <Text style={tw`text-gray-400 font-[InterTight] text-center`}>
                    Your personal career mentor. Voice and text interactions coming soon.
                </Text>
            </View>
        </GlassBackground>
    );
}
