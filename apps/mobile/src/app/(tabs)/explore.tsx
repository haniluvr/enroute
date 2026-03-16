import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { CareerCard, CareerCardData } from '@/components/explore/CareerCard';
import { SwipeableCard } from '@/components/explore/SwipeableCard';
import { X, Heart, Search, Loader } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ExploreScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<CareerCardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasTakenTest, setHasTakenTest] = useState(false);
    const bypassTest = true;

    const fetchJobs = useCallback(async () => {
        if (!user || user.id === 'pending') return;
        setIsLoading(true);
        try {
            // 1. Check if user has taken the test
            const { data: assessments } = await supabase
                .from('career_assessments')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);
            
            setHasTakenTest((assessments?.length || 0) > 0);

            // 2. Get swiped job IDs
            const { data: swipes } = await supabase
                .from('job_swipes')
                .select('job_id')
                .eq('user_id', user.id);
            
            const swipedIds = swipes?.map(s => s.job_id) || [];

            // 3. Fetch jobs
            let query = supabase
                .from('jobs')
                .select('*')
                .eq('is_active', true);
            
            if (swipedIds.length > 0) {
                query = query.not('id', 'in', `(${swipedIds.join(',')})`);
            }

            const { data: jobsData, error } = await query.limit(10);

            if (error) throw error;

            const formattedJobs: CareerCardData[] = (jobsData || []).map(j => ({
                id: j.id,
                company: j.company_name,
                location: j.location,
                role: j.role_title,
                description: j.description || '',
                matchPercentage: 0, 
                skills: j.required_skills || [],
                salary: j.salary_range || 'Competitive',
                color: '#a78bfa'
            }));

            setJobs(formattedJobs);
        } catch (err) {
            console.error('Fetch Jobs Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleSwipe = async (isInterested: boolean) => {
        const swipedJob = jobs[0];
        if (!swipedJob || !user) return;

        try {
            const { error } = await supabase.from('job_swipes').insert({
                user_id: user.id,
                job_id: swipedJob.id,
                is_interested: isInterested,
                ai_match_percentage: swipedJob.matchPercentage
            });

            if (error) throw error;

            setJobs((prev) => prev.slice(1));
        } catch (err) {
            console.error('Swipe Error:', err);
        }
    };

    const handleSwipeLeft = useCallback(() => {
        handleSwipe(false);
    }, [jobs, user]);

    const handleSwipeRight = useCallback(() => {
        handleSwipe(true);
    }, [jobs, user]);

    const renderEmptyState = () => (
        <View style={tw`flex-1 items-center justify-center p-8`}>
            <View style={tw`w-20 h-20 bg-white/10 rounded-full items-center justify-center mb-6`}>
                <Search color="#fff" size={40} />
            </View>
            <Text style={tw`text-white font-[InterTight] font-bold text-2xl mb-4 text-center`}>No more matches</Text>
            <Text style={tw`text-slate-400 font-[InterTight] text-center text-lg mb-8`}>
                We're searching for more roles tailored to your profile. Check back later!
            </Text>
            <TouchableOpacity
                style={tw`bg-white/10 px-8 py-3 rounded-full border border-white/10`}
                onPress={fetchJobs}
            >
                <Text style={tw`text-white font-[InterTight] font-semibold`}>Refresh Matches</Text>
            </TouchableOpacity>
        </View>
    );

    const renderTestPrompt = () => (
        <View style={tw`flex-1 items-center justify-center p-8`}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/career-interest-test')}
                style={tw`w-full bg-white/10 border border-white/15 rounded-[40px] p-8 items-center justify-center`}
            >
                <View style={tw`w-20 h-20 bg-cyan-500/20 rounded-full items-center justify-center mb-6`}>
                    <Search color="#22d3ee" size={40} />
                </View>
                <Text style={tw`text-white font-inter-bold text-2xl mb-4 text-center`}>
                    To explore Career Swipe, please take the Career Interest first.
                </Text>
                <View style={tw`bg-cyan-500 px-8 py-4 rounded-full shadow-lg shadow-cyan-500/40`}>
                    <Text style={tw`text-white font-inter-bold text-lg`}>Take the Test</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`flex-1 pt-16 px-6`}>
                {/* Header */}
                <View style={tw`mb-6`}>
                    <Text style={tw`text-white font-[InterTight] font-semibold text-3xl`}>Career Swipe</Text>
                </View>

                {/* Swiping Area */}
                <View style={tw`flex-1 mb-10 relative`}>
                    {!bypassTest && !hasTakenTest ? (
                        renderTestPrompt()
                    ) : isLoading ? (
                        <View style={tw`flex-1 items-center justify-center`}>
                            <Loader color="#fff" size={32} style={tw`mb-4`} />
                            <Text style={tw`text-gray-400 font-[InterTight]`}>Finding matches for you...</Text>
                        </View>
                    ) : jobs.length > 0 ? (
                        <View style={tw`flex-1`}>
                            {jobs.slice(0, 3).reverse().map((job, index, array) => {
                                const stackIndex = array.length - 1 - index;
                                return (
                                    <SwipeableCard
                                        key={job.id}
                                        stackIndex={stackIndex}
                                        onSwipeLeft={handleSwipeLeft}
                                        onSwipeRight={handleSwipeRight}
                                    >
                                        <CareerCard data={job} />
                                    </SwipeableCard>
                                );
                            })}
                        </View>
                    ) : (
                        renderEmptyState()
                    )}
                </View>

                {/* Footer Controls */}
                {jobs.length > 0 && (bypassTest || hasTakenTest) && (
                    <View style={tw`flex-row justify-center gap-6 mb-27`}>
                        <TouchableOpacity
                            onPress={handleSwipeLeft}
                            style={tw`w-18 h-18 bg-red-500/10 border border-red-500/30 rounded-full items-center justify-center`}
                        >
                            <X color="#ef4444" size={32} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSwipeRight}
                            style={tw`w-18 h-18 bg-emerald-500/10 border border-emerald-500/30 rounded-full items-center justify-center`}
                        >
                            <Heart color="#10b981" size={32} fill="#10b98120" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </GlassBackground>
    );
}
