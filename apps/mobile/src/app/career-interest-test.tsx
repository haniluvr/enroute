import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter } from 'expo-router';

export default function CareerInterestTestScreen() {
    const router = useRouter();

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <SafeAreaView style={tw`flex-1`}>
                <View style={tw`px-6 pt-4`}>
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mb-8`}
                    >
                        <ChevronLeft color="#ffffff" size={24} />
                    </TouchableOpacity>

                    <Text style={tw`text-white font-[InterTight-Bold] text-3xl mb-3`}>
                        Career Interest Test
                    </Text>
                    <Text style={tw`text-gray-400 font-[InterTight] text-base leading-6`}>
                        Discover careers that match your interests, skills, and goals. This assessment will help you find your perfect career path.
                    </Text>

                    <View style={tw`mt-12 p-6 bg-white/5 rounded-2xl border border-white/10`}>
                        <Text style={tw`text-gray-500 font-[InterTight] text-sm text-center`}>
                            Coming soon. The career interest test will be implemented here.
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}
