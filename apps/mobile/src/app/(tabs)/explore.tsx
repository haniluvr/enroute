import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { CareerCard, CareerCardData } from '@/components/explore/CareerCard';
import { SwipeableCard } from '@/components/explore/SwipeableCard';
import { X, Heart, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOCK_JOBS: CareerCardData[] = [
    {
        id: '1',
        company: 'Figma',
        location: 'San Francisco, CA',
        role: 'Senior UX Designer',
        description: 'Shape the future of collaborative design tools. Lead end-to-end product experiences for millions of designers...',
        matchPercentage: 94,
        skills: ['Figma', 'Prototyping', 'User Research', 'Design Systems'],
        salary: '$140k – $180k / yr',
        color: '#a78bfa'
    },
    {
        id: '2',
        company: 'Vercel',
        location: 'Remote',
        role: 'Frontend Engineer',
        description: 'Join the team building the frontend cloud. Experience with React, Next.js, and performance optimization is key.',
        matchPercentage: 88,
        skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
        salary: '$130k – $170k / yr',
        color: '#ffffff'
    },
    {
        id: '3',
        company: 'Airbnb',
        location: 'San Francisco, CA',
        role: 'Product Designer',
        description: 'Design world-class travel experiences. We value craft, simplicity, and a deep understanding of user needs.',
        matchPercentage: 91,
        skills: ['Visual Design', 'Interaction Design', 'Storytelling'],
        salary: '$150k – $200k / yr',
        color: '#ff5a5f'
    }
];

export default function ExploreScreen() {
    const router = useRouter();
    const [jobs, setJobs] = useState<CareerCardData[]>(MOCK_JOBS);
    const [hasTakenTest, setHasTakenTest] = useState(false); // Set to false to show the card
    const bypassTest = true; // Bypassing for testing as requested

    const handleSwipeLeft = useCallback(() => {
        console.log('Skipped:', jobs[0]?.role);
        setJobs((prev) => prev.slice(1));
    }, [jobs]);

    const handleSwipeRight = useCallback(() => {
        console.log('Interested in:', jobs[0]?.role);
        setJobs((prev) => prev.slice(1));
    }, [jobs]);

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
                onPress={() => setJobs(MOCK_JOBS)}
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
