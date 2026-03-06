import tw from '@/lib/tailwind';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/hooks/useAuth';
import { FolderOpen, Sparkles, Mic, Telescope, MapPlus, ScanText, ChevronRight, GraduationCap } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const { user } = useAuth();
    const router = useRouter();

    // Fallback names for now since Firebase isn't live
    const displayName = user?.displayName || 'Akin';

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={tw`px-6 pt-16 pb-6 flex-row justify-between items-center`}>
                    <Text style={tw`text-white font-[InterTight] font-semibold text-3xl`}>Hi {displayName}! 👋</Text>

                    <TouchableOpacity
                        style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10`}
                        activeOpacity={0.7}
                    >
                        <FolderOpen color="#aaa" size={24} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar / Ask Dahlia */}
                <View style={tw`px-6 mb-8`}>
                    <TouchableOpacity
                        style={tw`bg-white/10 border border-white/15 rounded-full px-5 py-3.5 flex-row items-center justify-center`}
                        activeOpacity={0.8}
                        onPress={() => router.push('/(tabs)/dahlia')}
                    >
                        <Sparkles color="#fff" size={20} style={tw`mr-2 opacity-80`} />
                        <Text style={tw`text-white/80 font-[InterTight] text-[15px]`}>
                            Ask Dahlia anything related to your career path
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Start 2x2 Grid */}
                <View style={tw`px-6 mb-8`}>
                    <View style={tw`flex-row justify-between mb-4`}>
                        {/* Card 1: Record Idea */}
                        <TouchableOpacity
                            style={tw`w-[48%]`}
                            activeOpacity={0.8}
                            onPress={() => router.push('/record-idea')}
                        >
                            <GlassCard style={tw`h-[140px] p-5 justify-between bg-white/10 shadow-xl border-t border-white/20`} noPadding>
                                <View style={tw`bg-[#fcfcfc]/20 w-11 h-11 rounded-2xl items-center justify-center`}>
                                    <Mic color="#fff" size={22} />
                                </View>
                                <Text style={tw`text-white font-[InterTight-Medium] text-[15px]`}>Record Idea</Text>
                            </GlassCard>
                        </TouchableOpacity>

                        {/* Card 2: Explore Careers */}
                        <TouchableOpacity
                            style={tw`w-[48%]`}
                            activeOpacity={0.8}
                            onPress={() => router.push('/(tabs)/explore')}
                        >
                            <GlassCard style={tw`h-[140px] p-5 justify-between bg-white/10 shadow-xl border-t border-white/20`} noPadding>
                                <View style={tw`bg-[#fcfcfc]/20 w-11 h-11 rounded-2xl items-center justify-center`}>
                                    <Telescope color="#fff" size={22} />
                                </View>
                                <Text style={tw`text-white font-[InterTight-Medium] text-[15px]`}>Explore careers</Text>
                            </GlassCard>
                        </TouchableOpacity>
                    </View>

                    <View style={tw`flex-row justify-between`}>
                        {/* Card 3: View Roadmap */}
                        <TouchableOpacity
                            style={tw`w-[48%]`}
                            activeOpacity={0.8}
                            onPress={() => router.push('/roadmap')}
                        >
                            <GlassCard style={tw`h-[140px] p-5 justify-between bg-white/10 shadow-xl border-t border-white/20`} noPadding>
                                <View style={tw`bg-[#fcfcfc]/20 w-11 h-11 rounded-2xl items-center justify-center`}>
                                    <MapPlus color="#fff" size={22} />
                                </View>
                                <Text style={tw`text-white font-[InterTight-Medium] text-[15px]`}>View roadmap</Text>
                            </GlassCard>
                        </TouchableOpacity>

                        {/* Card 4: Scan CV */}
                        <TouchableOpacity
                            style={tw`w-[48%]`}
                            activeOpacity={0.8}
                            onPress={() => router.push('/scan-cv')}
                        >
                            <GlassCard style={tw`h-[140px] p-5 justify-between bg-white/10 shadow-xl border-t border-white/20`} noPadding>
                                <View style={tw`bg-[#fcfcfc]/20 w-11 h-11 rounded-2xl items-center justify-center`}>
                                    <ScanText color="#fff" size={22} />
                                </View>
                                <Text style={tw`text-white font-[InterTight-Medium] text-[15px]`}>Scan CV</Text>
                            </GlassCard>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* History Section */}
                <View style={tw`px-6`}>
                    <Text style={tw`text-gray-300 font-[InterTight-Medium] text-[17px] mb-5`}>History</Text>

                    {/* Placeholder History Card */}
                    <GlassCard style={tw`p-5 bg-[#1C1C1E]/80 border-t border-white/10 mb-4`} noPadding>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            <View style={tw`bg-[#3D3A2C] px-3 py-1.5 rounded-full flex-row items-center border border-[#6B6330]`}>
                                <GraduationCap color="#EEDF7A" size={14} style={tw`mr-1.5`} />
                                <Text style={tw`text-[#EEDF7A] font-[InterTight-Medium] text-sm`}>Course</Text>
                            </View>
                            <View style={tw`bg-white/10 w-8 h-8 rounded-full items-center justify-center`}>
                                <ChevronRight color="#888" size={18} />
                            </View>
                        </View>

                        <Text style={tw`text-gray-300 font-[InterTight] text-[15px] mb-2`} numberOfLines={1}>
                            <Text style={tw`text-white font-[InterTight-Medium]`}>Request:</Text> How get started with UI/UX
                        </Text>
                        <Text style={tw`text-gray-300 font-[InterTight] text-[15px] mb-4`} numberOfLines={1}>
                            <Text style={tw`text-white font-[InterTight-Medium]`}>Ai recap:</Text> Start with wireframes, UI
                        </Text>

                        {/* Progress Bar Placeholder */}
                        <View style={tw`w-full h-1 bg-white/10 rounded-full mt-2`}>
                            <View style={tw`w-1/4 h-1 bg-white rounded-full`} />
                            {/* Thumb */}
                            <View style={tw`w-3 h-3 bg-white rounded-full absolute -top-1 left-1/4 shadow`} />
                        </View>
                    </GlassCard>
                </View>

            </ScrollView>
        </GlassBackground>
    );
}
