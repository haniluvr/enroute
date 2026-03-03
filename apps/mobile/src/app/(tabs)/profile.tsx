import { View, Text } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { router } from 'expo-router';

export default function ProfileScreen() {
    return (
        <GlassBackground>
            <View className="flex-1 items-center justify-center px-6">

                <View className="w-24 h-24 rounded-full bg-white/10 mb-6 border border-white/20 items-center justify-center">
                    <Text className="text-white text-3xl font-inter-bold">IS</Text>
                </View>

                <Text className="text-3xl text-white font-inter-bold mb-2">Isabella S.</Text>
                <Text className="text-accent-cyan font-inter-medium mb-10">BS Information Technology, Year 3</Text>

                <GlassButton
                    title="Sign Out"
                    variant="secondary"
                    onPress={() => {
                        // Temporary routing
                        router.replace('/(auth)/sign-in');
                    }}
                />

            </View>
        </GlassBackground>
    );
}
