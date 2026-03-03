import { View, Text } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { Sparkles, Mic } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';

export default function DiscoverScreen() {
    return (
        <GlassBackground>
            <View className="flex-1 items-center justify-center px-6">

                {/* Placeholder for the React Native Reanimated Swipe Cards */}
                <View className="items-center mb-10 w-full">
                    <Text className="text-3xl text-white font-inter-bold text-center mb-4">Career Swipe</Text>

                    <GlassCard className="w-full h-80 items-center justify-center border-accent-cyan/30">
                        <Sparkles color="#00e5ff" size={48} className="mb-4" />
                        <Text className="text-gray-300 text-center font-inter-medium">
                            (Swipe Gesture Logic placeholder)
                        </Text>
                    </GlassCard>
                </View>

                {/* Temporary Dahlia Voice interaction entry. Will be moved to a modal or floating action button later */}
                <View className="absolute bottom-32 bg-accent-violet/20 p-6 rounded-full border border-accent-violet/50 shadow-2xl">
                    <Mic color="#fff" size={36} />
                </View>
                <Text className="absolute bottom-24 text-gray-400 font-inter-semibold">Tap to speak with Dahlia</Text>

            </View>
        </GlassBackground>
    );
}
