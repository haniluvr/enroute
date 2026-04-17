import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { CareerCard, CareerCardData } from '@/components/explore/CareerCard';
import { SwipeableCard } from '@/components/explore/SwipeableCard';
import { X, Heart, Search, Loader, Sliders } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as Location from 'expo-location';
import { AI_API } from '@/config/backend';
import { FilterSheet, Filters } from '@/components/explore/FilterSheet';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ExploreScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<CareerCardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasTakenTest, setHasTakenTest] = useState(false);
    const [locationName, setLocationName] = useState<string | null>(null);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
    const [filters, setFilters] = useState<Filters>({
        location: '',
        employmentTypes: [],
        requirements: []
    });
    const bypassTest = true;
    const abortControllerRef = useRef<AbortController | null>(null);

    // 1. Initial Location Detection
    useEffect(() => {
        const detectLocation = async () => {
            // Don't auto-detect if we already have a location or if user has a manual filter
            if (locationName || filters.location) return;

            console.log('[Explore] Detecting initial location...');
            setIsLocationLoading(true);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({});
                    const reverse = await Location.reverseGeocodeAsync(loc.coords);
                    if (reverse.length > 0) {
                        const city = reverse[0].city || reverse[0].region || null;
                        console.log(`[Explore] Detected location: ${city}`);
                        setLocationName(city);
                    }
                }
            } catch (err) {
                console.warn('[Explore] Location detection failed:', err);
            } finally {
                setIsLocationLoading(false);
            }
        };
        detectLocation();
    }, []); // Only run once on mount

    const fetchJobs = useCallback(async (isInitial = false) => {
        if (!user || user.id === 'pending') return;
        
        // Prevent re-fetching if we already have jobs and this isn't a manual refresh/filter change
        if (!isInitial && jobs.length > 0 && !filters.location && filters.employmentTypes.length === 0) return;

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

            // 2. Determine Location: Priority is Manual Filter > Detected Location > Default
            const currentCity = filters.location || locationName || '';
            
            console.log(`[Explore] Fetching jobs for: ${userSuggestion} in "${currentCity || 'Global'}"`);
            
            const empTypes = filters.employmentTypes.join(',');
            const reqs = filters.requirements.join(',');
            
            const url = `${AI_API.SEARCH_JOBS}?query=${encodeURIComponent(userSuggestion)}&location=${encodeURIComponent(currentCity)}${empTypes ? `&employment_types=${empTypes}` : ''}${reqs ? `&job_requirements=${reqs}` : ''}`;
            
            // Abort previous request if any
            if (abortControllerRef.current) {
                console.log('[Explore] Aborting previous fetch...');
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
            
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const searchData = await response.json();

            if (!response.ok) {
                // If we hit the daily limit, we don't throw but just use mock data quietly
                if (searchData.error?.includes('limit reached')) {
                    console.log('[Explore] Daily search limit reached, using mock data.');
                } else {
                    throw new Error(searchData.error || 'Failed to fetch external jobs');
                }
            }
            
            const liveJobs = searchData.jobs || [];

            if (liveJobs.length > 0) {
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
                        description: j.description || j.job_description || '',
                        matchPercentage: 85 + Math.floor(Math.random() * 10),
                        skills: j.required_skills?.slice(0, 5) || [],
                        salary: j.salary_range,
                        company_logo: j.company_logo,
                        color: ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24'][index % 4],
                        originalData: j 
                    }));

                if (formattedJobs.length > 0) {
                    setJobs(formattedJobs);
                    return;
                }
            }

            // Fallback to mock data if no live jobs found
            throw new Error('No jobs found');

        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.log('[Explore] Fetch aborted (new request started or timed out).');
                return;
            }
            if (err instanceof Error && !err.message.includes('No jobs found')) {
                console.error('Fetch Jobs Error:', err);
            }
            
            // Believable Mock Data (PH-Focused Market)
            const mockJobs: CareerCardData[] = [
                {
                    id: 'mock-ai-1',
                    company: 'MindAI Labs',
                    location: 'Makati, Metro Manila (Hybrid)',
                    role: 'Junior AI Engineer',
                    description: 'Implement and fine-tune LLM-based features for local enterprise applications. Work with Python, LangChain, and OpenAI APIs to build smart business tools.',
                    matchPercentage: 96,
                    skills: ['Python', 'LLMs', 'Prompt Engineering'],
                    salary: '₱75,000 - ₱110,000',
                    color: '#a78bfa'
                },
                {
                    id: 'mock-fintech-1',
                    company: 'PesoPay Digital',
                    location: 'BGC, Taguig (Remote Friendly)',
                    role: 'Product Designer (UX/UI)',
                    description: 'Design the future of digital banking in the Philippines. Create seamless user experiences for millions of users using Figma and modern design systems.',
                    matchPercentage: 92,
                    skills: ['Figma', 'User Research', 'Design Systems'],
                    salary: '₱65,000 - ₱95,000',
                    color: '#22d3ee'
                },
                {
                    id: 'mock-dev-1',
                    company: 'CloudArch Solutions',
                    location: 'Quezon City, PH (Remote)',
                    role: 'Full Stack React Native Developer',
                    description: 'Build and scale high-performance mobile applications using React Native and Supabase. Participate in end-to-end development from UI to database architecture.',
                    matchPercentage: 89,
                    skills: ['React Native', 'Supabase', 'TypeScript'],
                    salary: '₱55,000 - ₱85,000',
                    color: '#f472b6'
                },
                {
                    id: 'mock-data-1',
                    company: 'InsightFlow Analytics',
                    location: 'Pasig, Metro Manila',
                    role: 'Data Analyst',
                    description: 'Turn complex data into actionable insights for retail partners. Master SQL and PowerBI to tell stories with data and drive business Growth.',
                    matchPercentage: 85,
                    skills: ['SQL', 'PowerBI', 'Data Visualization'],
                    salary: '₱45,000 - ₱70,000',
                    color: '#fbbf24'
                }
            ];
            // Filter mock jobs based on swipes
            const { data: swipes } = await supabase
                .from('job_swipes')
                .select('jobs(external_id)')
                .eq('user_id', user.id);
            
            const swipedExternalIds = new Set(swipes?.map(s => (s.jobs as any)?.external_id).filter(Boolean) || []);
            const filteredMockJobs = mockJobs.filter(j => !swipedExternalIds.has(j.id));

            setJobs(filteredMockJobs);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, locationName, filters]);

    useEffect(() => {
        if (!isLocationLoading) {
            fetchJobs(true);
        }
    }, [user?.id, locationName, isLocationLoading, filters]);

    const handleSwipe = async (isInterested: boolean) => {
        const swipedJob = jobs[0];
        if (!swipedJob || !user) return;

        // Optimistically remove the job from the stack
        setJobs((prev) => prev.slice(1));

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

            if (error) {
                // Ignore duplicate swipes (already recorded)
                if (error.code === '23505') {
                    console.log('[Swipe] Already recorded, ignoring duplicate.');
                    return;
                }
                throw error;
            }
        } catch (err) {
            console.error('Swipe Error:', err);
            // Optional: You could add logic here to put the job back in the stack if it was a critical failure,
            // but for swipes, it's usually better to just keep going.
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
                onPress={() => fetchJobs(true)}
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
                <View style={tw`mb-6 flex-row justify-between items-center`}>
                    <Text style={tw`text-white font-[InterTight] font-semibold text-3xl`}>Career Swipe</Text>
                    <TouchableOpacity 
                        onPress={() => setIsFilterSheetVisible(true)}
                        style={tw`w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/10`}
                    >
                        <Sliders color="#fff" size={24} />
                    </TouchableOpacity>
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

            <FilterSheet
                isVisible={isFilterSheetVisible}
                onClose={() => setIsFilterSheetVisible(false)}
                currentFilters={filters}
                onApply={(newFilters) => setFilters(newFilters)}
            />
        </GlassBackground>
    );
}
