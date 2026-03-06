import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter } from 'expo-router';
import { Mic, ArrowLeft } from 'lucide-react-native';

export default function RecordIdeaScreen() {
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
                <Text style={tw`text-white font-[InterTight-Bold] text-2xl`}>Record Idea</Text>
            </View>

            <View style={tw`flex-1 items-center justify-center p-6`}>
                <TouchableOpacity style={tw`bg-accent-violet/20 w-32 h-32 rounded-full items-center justify-center border-4 border-accent-violet/50 mb-8`}>
                    <Mic color="#fff" size={48} />
                </TouchableOpacity>

                <Text style={tw`text-white font-[InterTight-Medium] text-[17px] mb-2`}>Tap to start recording</Text>
                <Text style={tw`text-gray-400 font-[InterTight] text-center`}>
                    Describe your career thoughts, interview answers, or random ideas. We'll transcribe and summarize it for your library.
                </Text>

                {/* IA Placeholder list */}
                <View style={tw`w-full bg-white/5 rounded-2xl p-5 mt-10`}>
                    <Text style={tw`text-white font-[InterTight-SemiBold] mb-3`}>Next Steps (IA Flow):</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>1. Record Audio</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>2. Transcribe (Speech-to-text)</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>3. AI Summary Generation</Text>
                    <Text style={tw`text-gray-400 text-sm`}>4. Save Note to Library</Text>
                </View>
            </View>
        </GlassBackground>
    );
}
