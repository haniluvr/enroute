import tw from '@/lib/tailwind';
import { View, Text } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';

export default function ExploreScreen() {
    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`flex-1 items-center justify-center p-6`}>
                <Text style={tw`text-white font-[InterTight-Bold] text-3xl mb-4`}>Explore Careers</Text>
                <Text style={tw`text-gray-400 font-[InterTight] text-center`}>
                    Swipe through customized career matches to discover your next role. Coming soon.
                </Text>
            </View>
        </GlassBackground>
    );
}
