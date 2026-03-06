import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter } from 'expo-router';
import { ArrowLeft, ScanText } from 'lucide-react-native';

export default function ScanCVScreen() {
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
                <Text style={tw`text-white font-[InterTight-Bold] text-2xl`}>Scan CV</Text>
            </View>

            <View style={tw`flex-1 items-center justify-center p-6`}>
                <View style={tw`bg-white/10 w-24 h-24 rounded-3xl items-center justify-center border-2 border-dashed border-white/30 mb-8`}>
                    <ScanText color="#fff" size={40} />
                </View>

                <Text style={tw`text-white font-[InterTight-Medium] text-[17px] mb-2`}>Upload or capture your CV</Text>
                <Text style={tw`text-gray-400 font-[InterTight] text-center`}>
                    JPEG, PNG, WEBP, or HEIC formats supported.
                </Text>

                {/* IA Placeholder list */}
                <View style={tw`w-full bg-white/5 rounded-2xl p-5 mt-10`}>
                    <Text style={tw`text-white font-[InterTight-SemiBold] mb-3`}>Next Steps (IA Flow):</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>1. Select / Take Photo</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>2. Run AI CV Analysis</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>3. Extract recognized/suggested skills</Text>
                    <Text style={tw`text-gray-400 text-sm mb-1`}>4. Generate custom roadmap</Text>
                    <Text style={tw`text-gray-400 text-sm`}>5. Save/Download roadmap</Text>
                </View>
            </View>
        </GlassBackground>
    );
}
