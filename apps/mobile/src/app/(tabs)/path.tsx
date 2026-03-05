import tw from '@/lib/tailwind';
import { View, Text } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';

export default function PathScreen() {
    return (
        <GlassBackground>
            <View style={tw`flex-1 items-center justify-center p-6`}>
                <Text style={tw`text-white font-[InterTight-Bold] text-3xl mb-4`}>Paths</Text>
                <Text style={tw`text-gray-400 font-[InterTight] text-center`}>
                    Search roles, view roadmaps, and track your skill progression. Coming soon.
                </Text>
            </View>
        </GlassBackground>
    );
}
