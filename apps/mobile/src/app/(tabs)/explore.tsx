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
import * as Location from 'expo-location';
import { AI_API } from '@/config/backend';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ExploreScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<CareerCardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasTakenTest, setHasTakenTest] = useState(false);
    const [locationName, setLocationName] = useState<string | null>(null);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const bypassTest = true;

    const fetchJobs = useCallback(async () => {
        if (!user || user.id === 'pending') return;
        setIsLoading(true);
        try {
            // 1. Fetch Latest Career Assessment for Context
            const { data: assessments } = await supabase
                .from('career_assessments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);
            
            setHasTakenTest((assessments?.length || 0) > 0);
            const userSuggestion = assessments?.[0]?.ai_career_suggestion || 'Software Engineer';

            // 2. Refresh Location if not already set
            let currentCity = locationName;
            if (!currentCity) {
                setIsLocationLoading(true);
                try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                        const location = await Location.getCurrentPositionAsync({});
                        const reverse = await Location.reverseGeocodeAsync(location.coords);
                        if (reverse.length > 0) {
                            currentCity = reverse[0].city || reverse[0].region || null;
                            setLocationName(currentCity);
                        }
                    }
                } catch (locErr) {
                    console.warn('Location Error:', locErr);
                } finally {
                    setIsLocationLoading(false);
                }
            }

            // 3. Fetch live jobs from JSearch via Backend
            console.log(`[Explore] Fetching JSearch for: ${userSuggestion} in ${currentCity || 'Global'}`);
            const response = await fetch(`${AI_API.SEARCH_JOBS}?query=${encodeURIComponent(userSuggestion)}&location=${encodeURIComponent(currentCity || '')}`);
            const searchData = await response.json();

            if (!response.ok) throw new Error(searchData.error || 'Failed to fetch external jobs');
            
            const liveJobs = searchData.jobs || [];

            // 4. Get swiped job IDs to filter
            const { data: swipes } = await supabase
                .from('job_swipes')
                .select('job_id, jobs(external_id)')
                .eq('user_id', user.id);
            
            const swipedExternalIds = new Set(swipes?.map(s => (s.jobs as any)?.external_id).filter(Boolean) || []);

            // 5. Transform and filter
            const formattedJobs: CareerCardData[] = liveJobs
                .filter((j: any) => !swipedExternalIds.has(j.id))
                .map((j: any, index: number) => ({
                    id: j.id,
                    company: j.company_name,
                    location: j.location,
                    role: j.role_title,
                    description: j.description || '',
                    matchPercentage: 85 + Math.floor(Math.random() * 10), // Simulated match based on career suggestion
                    skills: j.required_skills?.slice(0, 5) || [],
                    salary: j.salary_range,
                    company_logo: j.company_logo,
                    color: ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24'][index % 4],
                    originalData: j // Keep original for syncing
                }));

            setJobs(formattedJobs);
        } catch (err) {
            console.error('Fetch Jobs Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, locationName]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleSwipe = async (isInterested: boolean) => {
        const swipedJob = jobs[0];
        if (!swipedJob || !user) return;

        try {
            // 1. Sync job to local DB first
            console.log(`[Swipe] Syncing job: ${swipedJob.role}`);
            const syncResponse = await fetch(AI_API.SYNC_JOB, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job: (swipedJob as any).originalData || swipedJob })
            });
            const syncData = await syncResponse.json();
            
            if (!syncResponse.ok) throw new Error('Failed to sync job to local database');

            const localJobId = syncData.id;

            // 2. Record Swipe
            const { error } = await supabase.from('job_swipes').insert({
                user_id: user.id,
                job_id: localJobId,
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
                    ) : isLoading || isLocationLoading ? (
                        <View style={tw`flex-1 items-center justify-center`}>
                            <Loader color="#fff" size={32} style={tw`mb-4`} />
                            <Text style={tw`text-gray-400 font-[InterTight]`}>
                                {isLocationLoading ? 'Getting your location...' : 'Finding matches for you...'}
                            </Text>
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
