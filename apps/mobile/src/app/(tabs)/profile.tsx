import tw from '@/lib/tailwind';
import { View, Text } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { router } from 'expo-router';

export default function ProfileScreen() {
    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`flex-1 items-center justify-center px-6`}>
                {/* Profile Placeholder Header */}
                <View style={tw`w-24 h-24 rounded-full bg-white/10 mb-6 border border-white/20 items-center justify-center`}>
                    <Text style={tw`text-white text-3xl font-[InterTight-Bold]`}>IS</Text>
                </View>

                <Text style={tw`text-3xl text-white font-[InterTight-Bold] mb-2`}>Isabella S.</Text>
                <Text style={tw`text-accent-cyan font-[InterTight] font-medium mb-10`}>BS Information Technology, Year 3</Text>

                <GlassButton
                    title="Sign Out"
                    variant="danger"
                    onPress={() => router.replace('/(auth)/sign-in')}
                />
            </View>
        </GlassBackground>
    );
}
