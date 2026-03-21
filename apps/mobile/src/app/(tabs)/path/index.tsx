import tw from '@/lib/tailwind';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { Search, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { PathCard } from '@/components/path/PathCard';
import { PathCardResult } from '@/components/path/PathCardResult';
import { suggestedPaths } from '@/data/pathMockData';
import { parsePathMeta } from '@/utils/pathUtils';

export default function PathScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [paths, setPaths] = useState<any[]>([]);
    const [assessment, setAssessment] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filterMode, setFilterMode] = useState<'all' | 'role' | 'skill'>('all');

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data: pathsData, error: pathsError } = await supabase
                .from('learning_paths')
                .select('*')
                .order('created_at', { ascending: false });

            if (pathsError) throw pathsError;
            
            // Randomize paths array (requested by user 'for now')
            const shuffledPaths = (pathsData || []).sort(() => Math.random() - 0.5);
            setPaths(shuffledPaths);

            if (user && user.id !== 'pending') {
                const { data: assessmentData, error: assessmentError } = await supabase
                    .from('career_assessments')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                if (assessmentData) {
                    setAssessment(assessmentData);
                }
            }
        } catch (err) {
            console.error('Fetch Data Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPaths = useMemo(() => {
        let result = paths;

        if (filterMode !== 'all') {
            result = result.filter((p: any) => {
                const meta = parsePathMeta(p.overview || '');
                return meta.type === filterMode;
            });
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (p: any) =>
                    p.title.toLowerCase().includes(q) ||
                    (p.overview && p.overview.toLowerCase().includes(q))
            );
        }
        
        return result;
    }, [searchQuery, paths, filterMode]);

    const showSearchResults = searchQuery.trim().length > 0;

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={tw`px-6 pt-16 pb-6`}>
                    <Text style={tw`text-white font-[InterTight] font-semibold text-3xl`}>
                        Career Paths
                    </Text>
                </View>

                {/* Search Input */}
                <View style={tw`px-6 mb-6`}>
                    <View
                        style={tw`bg-white/10 border border-white/15 rounded-full px-5 py-3.5 flex-row items-center`}
                    >
                        <Sparkles color="#fff" size={20} style={tw`mr-3 opacity-80`} />
                        <TextInput
                            style={tw`flex-1 text-white/80 font-[InterTight] text-[15px]`}
                            placeholder="Search or choose a path you'd love to explore"
                            placeholderTextColor="#ffffffe0"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* 1:1 Career Test Card */}
                {!showSearchResults && !assessment && (
                    <View style={tw`px-6 mb-8`}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => router.push('/career-aptitude-test')}
                            style={tw`h-69 bg-white/10 border border-white/15 rounded-3xl p-6 justify-center items-center`}
                        >
                            <View style={tw`items-center justify-center mb-4`}>
                                <Search color="#fcfcfc33" size={100} />
                            </View>
                            <Text
                                style={tw`text-white font-[InterTight] font-semibold text-3xl text-center`}
                            >
                                Let's find your perfect career path
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* AI Suggestions Block */}
                {!showSearchResults && assessment && (
                    <View style={tw`px-6 mb-6`}>
                        <View style={tw`bg-white/10 border border-white/20 p-5 rounded-2xl mb-6 shadow-lg backdrop-blur-md`}>
                            <Text style={tw`text-white font-[InterTight-Bold] text-lg mb-2`}>✨ AI Career Match</Text>
                            <Text style={tw`text-gray-300 font-[InterTight] text-[15px] leading-6`}>
                                {assessment.ai_career_suggestion}
                            </Text>
                        </View>
                        <Text style={tw`text-gray-300 font-[InterTight-SemiBold] text-base uppercase mb-4`}>
                            Recommended roles
                        </Text>
                        {paths
                            .filter((p: any) => p.title.toLowerCase().includes('design') || p.title.toLowerCase().includes('ui') || p.title.toLowerCase().includes('architecture'))
                            .slice(0, 2)
                            .map((item: any) => (
                                <PathCardResult key={`rec-${item.id}`} item={item} />
                            ))}
                    </View>
                )}

                {/* Section Header and Filters */}
                <View style={tw`px-6 mb-4 flex-row items-center justify-between`}>
                    <Text style={tw`text-gray-300 font-[InterTight-SemiBold] text-base uppercase`}>
                        {showSearchResults ? 'Search results' : 'Paths & Roadmaps'}
                    </Text>
                    
                    {/* Badge Filters */}
                    {!showSearchResults && (
                        <View style={tw`flex-row items-center gap-2`}>
                            <TouchableOpacity 
                                onPress={() => setFilterMode('all')}
                                style={tw`px-3 py-1 rounded-full border ${filterMode === 'all' ? 'bg-white border-white' : 'bg-white/5 border-white/10'}`}
                            >
                                <Text style={tw`font-[InterTight-Medium] text-[13px] ${filterMode === 'all' ? 'text-black' : 'text-gray-400'}`}>All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setFilterMode('role')}
                                style={tw`px-3 py-1 rounded-full border ${filterMode === 'role' ? 'bg-blue-500/90 border-blue-500' : 'bg-white/5 border-white/10'}`}
                            >
                                <Text style={tw`font-[InterTight-Medium] text-[13px] ${filterMode === 'role' ? 'text-white' : 'text-gray-400'}`}>Roles</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setFilterMode('skill')}
                                style={tw`px-3 py-1 rounded-full border ${filterMode === 'skill' ? 'bg-teal-500/90 border-teal-500' : 'bg-white/5 border-white/10'}`}
                            >
                                <Text style={tw`font-[InterTight-Medium] text-[13px] ${filterMode === 'skill' ? 'text-white' : 'text-gray-400'}`}>Skills</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Cards */}
                <View style={tw`px-6`}>
                    {filteredPaths.length === 0 ? (
                        <Text style={tw`text-gray-500 font-[InterTight] text-center py-8`}>
                            No paths match your search.
                        </Text>
                    ) : showSearchResults ? (
                        filteredPaths.map((item: any) => (
                            <PathCardResult key={item.id} item={item} />
                        ))
                    ) : (
                        filteredPaths.map((item: any) => (
                            <PathCard key={item.id} item={item} />
                        ))
                    )}
                </View>
            </ScrollView>
        </GlassBackground>
    );
}
