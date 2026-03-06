import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPlus } from 'lucide-react-native';

export default function RoadmapScreen() {
    const router = useRouter();

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            {/* Header */}
            <View style={tw`px-6 pt-16 pb-4 flex-row items-center`}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={tw`bg-white/10 p-2 rounded-full mr-4`}
                >
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={tw`text-white font-[InterTight-Bold] text-2xl`}>Roadmap</Text>
            </View>

            <View style={tw`flex-1 items-center justify-center p-6`}>
                <View style={tw`bg-accent-emerald/20 w-24 h-24 rounded-full items-center justify-center mb-8`}>
                    <MapPlus color="#10b981" size={40} />
                </View>

                <Text style={tw`text-white font-[InterTight-Medium] text-[17px] mb-2`}>Generate learning plan</Text>
                <Text style={tw`text-gray-400 font-[InterTight] text-center`}>
                    A step-by-step guide to achieving your next career milestone.
                </Text>

                {/* IA Placeholder list */}
                <View style={tw`w-full bg-white/5 rounded-2xl p-5 mt-10`}>
                    <Text style={tw`text-white font-[InterTight-SemiBold] mb-3`}>Next Steps (IA Flow):</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>1. Input skill goal & current skills</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>2. AI generates roadmap steps</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>3. View est. time, salary, job demand</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>4. Save to Library</Text>
                    <Text style={tw`text-gray-400 text-sm`}>5. Download plan</Text>
                </View>
            </View>
        </GlassBackground>
    );
}
