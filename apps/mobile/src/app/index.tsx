import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
    return (
        <View className="flex-1 items-center justify-center bg-[#0A0A1A] px-6">
            <Text className="text-4xl font-bold text-white mb-2 font-[InterTight-Bold]">Enroute</Text>
            <Text className="text-lg text-gray-400 text-center mb-8 font-[InterTight-Regular]">
                AI-Powered Career Navigation
            </Text>

            {/* Temporary Navigation Links */}
            <Link href="/(auth)/sign-in" className="bg-[#5900ff] px-6 py-3 rounded-xl mb-4">
                <Text className="text-white font-[InterTight-SemiBold] text-lg">Get Started</Text>
            </Link>
        </View>
    );
}
