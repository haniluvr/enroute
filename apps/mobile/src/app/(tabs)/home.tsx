import tw from '@/lib/tailwind';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/hooks/useAuth';
import { FolderOpen, Sparkles, Mic, Telescope, MapPlus, ScanText, ChevronRight, GraduationCap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';

export default function HomeScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [historyItems, setHistoryItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [user]);

    const fetchHistory = async () => {
        if (!user) return;
        setIsLoading(true);
        // If pending, we might not have many saves, but we'll try
        const userId = user.id === 'pending' ? null : user.id;
        try {
            const query = supabase
                .from('library_saves')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(4);
            
            if (userId) {
                query.eq('user_id', userId);
            } else {
                // If pending, maybe we filter by session or just return empty for now
                // Actually if they are pending but somehow saved things locally, 
                // we'd need another way. For now, just let it fail gracefully or return nothing.
                setHistoryItems([]);
                setIsLoading(false);
                return;
            }

            const { data, error } = await query;

            if (error) throw error;

            const transformed = data.map(item => ({
                id: item.id,
                type: item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1),
                title: item.title || `${item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}`,
                detail: `Saved ${new Date(item.created_at).toLocaleDateString()}`,
                progress: 1.0,
                itemId: item.item_id
            }));

            setHistoryItems(transformed);
        } catch (err) {
            console.error('Fetch History Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Priority: nickname first, then first name, lastly User
    const displayName = user?.user_metadata?.nickname || user?.user_metadata?.first_name || 'User';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 18) return 'Afternoon';
        return 'Evening';
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={tw`px-6 pt-16 pb-6 flex-row justify-between items-center`}>
                    <Text style={tw`text-white font-[InterTight] font-semibold text-3xl`}>{getGreeting()}, {displayName}! 👋</Text>

                    <TouchableOpacity
                        style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10`}
                        activeOpacity={0.7}
                        onPress={() => router.push('/library')}
                    >
                        <FolderOpen color="#aaa" size={24} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar / Ask Dahlia */}
                <View style={tw`px-6 mb-8`}>
                    <View style={tw`bg-white/10 border border-white/15 rounded-full px-5 py-0 flex-row items-center`}>
                        <Sparkles color="#fff" size={20} style={tw`mr-3 opacity-80`} />
                        <TextInput
                            style={tw`flex-1 text-white font-[InterTight] text-[15px] py-3.5`}
                            placeholder="Ask Dahlia anything related to your career path"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            onChangeText={(text) => {
                                if (text.length > 0) {
                                    router.push({
                                        pathname: '/(tabs)/dahlia',
                                        params: { q: text }
                                    });
                                }
                            }}
                            returnKeyType="search"
                            onSubmitEditing={(e) => {
                                if (e.nativeEvent.text.length > 0) {
                                    router.push({
                                        pathname: '/(tabs)/dahlia',
                                        params: { q: e.nativeEvent.text }
                                    });
                                }
                            }}
                        />
                    </View>
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
                            onPress={() => router.push('/career-aptitude-test')}
                        >
                            <GlassCard style={tw`h-[140px] p-5 justify-between bg-white/10 shadow-xl border-t border-white/20`} noPadding>
                                <View style={tw`bg-[#fcfcfc]/20 w-11 h-11 rounded-2xl items-center justify-center`}>
                                    <Telescope color="#fff" size={22} />
                                </View>
                                <Text style={tw`text-white font-[InterTight-Medium] text-[15px]`}>Career Aptitude Test</Text>
                            </GlassCard>
                        </TouchableOpacity>
                    </View>

                    <View style={tw`flex-row justify-between`}>
                        {/* Card 3: Build Roadmap */}
                        <TouchableOpacity
                            style={tw`w-[48%]`}
                            activeOpacity={0.8}
                            onPress={() => router.push('/roadmap')}
                        >
                            <GlassCard style={tw`h-[140px] p-5 justify-between bg-white/10 shadow-xl border-t border-white/20`} noPadding>
                                <View style={tw`bg-[#fcfcfc]/20 w-11 h-11 rounded-2xl items-center justify-center`}>
                                    <MapPlus color="#fff" size={22} />
                                </View>
                                <Text style={tw`text-white font-[InterTight-Medium] text-[15px]`}>Build roadmap</Text>
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
                {!isLoading && historyItems.length > 0 && (
                    <View style={tw`px-6`}>
                        <Text style={tw`text-gray-300 font-[InterTight-Medium] text-[17px] mb-5`}>History</Text>
                        {historyItems.map((activity) => (
                            <TouchableOpacity 
                                key={activity.id}
                                activeOpacity={0.8}
                                onPress={() => {
                                    if (activity.type === 'Roadmap') router.push(`/roadmap-details/${activity.itemId}`);
                                    else if (activity.type === 'Conversation') router.push('/(tabs)/dahlia');
                                    else if (activity.type === 'Resource') router.push('/scan-cv');
                                    else if (activity.type === 'Idea') router.push('/record-idea');
                                    else router.push('/library');
                                }}
                            >
                                <GlassCard style={tw`p-5 bg-[#1C1C1E]/80 border-t border-white/10 mb-4`} noPadding>
                                    <View style={tw`flex-row justify-between items-center mb-4`}>
                                        <View style={tw`bg-[#2b4e50] px-3 py-1.5 rounded-full flex-row items-center border border-white/10`}>
                                            <Text style={tw`text-white font-[InterTight-Medium] text-xs`}>{activity.type}</Text>
                                        </View>
                                        <View style={tw`bg-white/10 w-8 h-8 rounded-full items-center justify-center`}>
                                            <ChevronRight color="#888" size={18} />
                                        </View>
                                    </View>

                                    <Text style={tw`text-white font-[InterTight-Medium] text-[16px] mb-1`}>
                                        {activity.title}
                                    </Text>
                                    <Text style={tw`text-gray-400 font-[InterTight] text-sm mb-4`}>
                                        {activity.detail}
                                    </Text>

                                    {/* Progress Bar */}
                                    <View style={tw`w-full h-1 bg-white/10 rounded-full overflow-hidden`}>
                                        <View style={[tw`h-full bg-white rounded-full`, { width: `${activity.progress * 100}%` }]} />
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {isLoading && (
                    <View style={tw`px-6 py-10 items-center`}>
                        <Text style={tw`text-gray-500 font-[InterTight]`}>Updating history...</Text>
                    </View>
                )}

            </ScrollView>
        </GlassBackground>
    );
}
