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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPaths();
    }, []);

    const fetchPaths = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('learning_paths')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPaths(data || []);
        } catch (err) {
            console.error('Fetch Paths Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPaths = useMemo(() => {
        if (!searchQuery.trim()) return paths;
        const q = searchQuery.toLowerCase();
        return paths.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                (p.overview && p.overview.toLowerCase().includes(q))
        );
    }, [searchQuery, paths]);

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
                {!showSearchResults && (
                    <View style={tw`px-6 mb-8`}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => router.push('/career-interest-test')}
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
                            {/* <Text
                                style={tw`text-gray-400 font-[InterTight-SemiBold] text-lg text-center mt-3`}
                            >
                                Based on your select interest here's a good place to start!
                            </Text> */}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Section Header */}
                <View style={tw`px-6 mb-4`}>
                    <Text style={tw`text-gray-300 font-[InterTight-SemiBold] text-base uppercase`}>
                        {showSearchResults ? 'Search results' : 'All roadmaps'}
                    </Text>
                </View>

                {/* Cards */}
                <View style={tw`px-6`}>
                    {filteredPaths.length === 0 ? (
                        <Text style={tw`text-gray-500 font-[InterTight] text-center py-8`}>
                            No paths match your search.
                        </Text>
                    ) : showSearchResults ? (
                        filteredPaths.map((item) => (
                            <PathCardResult key={item.id} item={item} />
                        ))
                    ) : (
                        filteredPaths.map((item) => (
                            <PathCard key={item.id} item={item} />
                        ))
                    )}
                </View>
            </ScrollView>
        </GlassBackground>
    );
}
