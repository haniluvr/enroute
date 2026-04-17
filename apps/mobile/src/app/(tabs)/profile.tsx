import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Settings, Pencil, Trophy, BookOpen, Map, Send, Star, Briefcase, Target, GraduationCap, Route, Mail, RefreshCw, ChevronRight, FileText } from 'lucide-react-native';

import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useRouter, Link } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as Linking from 'expo-linking';

// Mock Data for things not yet in Supabase
const STATS = [
    { label: 'Top Match', icon: Target, value: '92%' },
    { label: 'Courses', icon: GraduationCap, value: '75%' },
    { label: 'Roadmap', icon: Route, value: '88%' },
];

const SKILLS = [
    { id: '1', name: 'UI/UX Design', progress: 85 },
    { id: '2', name: 'React Native', progress: 70 },
    { id: '3', name: 'Problem Solving', progress: 95 },
    { id: '4', name: 'Strategic Planning', progress: 60 },
    { id: '5', name: 'Python', progress: 40 },
].sort((a, b) => b.progress - a.progress);

const ACHIEVEMENTS = [
    { id: 'first_match', title: 'First Match', icon: Trophy, color: '#FCD34D' },
    { id: 'learner', title: 'Learner', icon: BookOpen, color: '#60A5FA' },
    { id: 'roadmap_set', title: 'Roadmap Set', icon: Map, color: '#34D399' },
    { id: 'applied', title: 'Applied', icon: Send, color: '#F87171' },
    { id: 'top_10', title: 'Top 10%', icon: Star, color: '#A78BFA' },
    { id: 'hired', title: 'Hired!', icon: Briefcase, color: '#F472B6' },
];


const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#fcfcfccc'; // cyan
    if (progress >= 60) return '#fcfcfc99'; // violet
    if (progress >= 40) return '#fcfcfc66'; // pink
    return '#444';
};

export default function ProfileScreen() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [displayName, setDisplayName] = useState('Loading...');
    const [levelBadge, setLevelBadge] = useState('New User');
    const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isResending, setIsResending] = useState(false);
    
    // Real dynamic data states
    const [stats, setStats] = useState(STATS);
    const [skills, setSkills] = useState<any[]>([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    const [isLoadingSkills, setIsLoadingSkills] = useState(true);


    const isVerified = user?.email_confirmed_at != null;

    const handleResendVerification = async () => {
        if (!user?.email || isResending) return;

        setIsResending(true);
        const redirectUrl = Linking.createURL('/profile');
        console.log('[Profile] Attempting to resend verification email to:', user.email, 'with redirect:', redirectUrl);
        
        try {
            // First try with the redirect URL
            const { data, error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
                options: {
                    emailRedirectTo: redirectUrl,
                }
            });

            console.log('[Profile] Resend response:', { data, error });

            if (error) {
                // If the redirect URL is the problem (often due to Supabase allow-list), try without it
                if (error.message.includes('redirect_uri') || error.message.includes('URL')) {
                    console.log('[Profile] Redirect URL rejected, trying without it...');
                    const { error: secondError } = await supabase.auth.resend({
                        type: 'signup',
                        email: user.email,
                    });
                    if (secondError) throw secondError;
                    Alert.alert('Success', `Verification email resent to ${user.email}! (Please check your inbox)`);
                } else if (error.status === 429) {
                    Alert.alert('Too Many Requests', 'Please wait a minute before trying to resend the email again.');
                } else {
                    Alert.alert('Error', error.message);
                }
            } else {
                Alert.alert('Success', `Verification email resent to ${user.email}! Please check your inbox (and spam folder).`);
            }
        } catch (err: any) {
            console.error('[Profile] Resend Exception:', err);
            Alert.alert('Error', err.message || 'An error occurred while resending the email.');
        } finally {
            setIsResending(false);
        }
    };

    useEffect(() => {
        const handleUrl = (url: string) => {
            const { queryParams } = Linking.parse(url);
            const fragment = url.includes('#') ? url.split('#')[1] : '';
            const hashParams = fragment ? Linking.parse('?' + fragment).queryParams : {};
            const allParams = { ...queryParams, ...hashParams };

            if (allParams.error_code === 'otp_expired') {
                Alert.alert(
                    'Link Expired',
                    'Your verification link has expired. Would you like us to send a new one?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Resend Email', onPress: handleResendVerification }
                    ]
                );
            }
        };

        const subscription = Linking.addEventListener('url', (event) => {
            handleUrl(event.url);
        });

        Linking.getInitialURL().then(url => {
            if (url) handleUrl(url);
        });

        return () => subscription.remove();
    }, [user?.email, isResending]);

    useEffect(() => {
        if (user) {
            const metadata = user.user_metadata || {};
            const firstName = metadata.first_name || '';
            const lastName = metadata.last_name || '';

            // Priority: First + Last name, then nickname, then 'User'
            if (firstName || lastName) {
                setDisplayName(`${firstName} ${lastName}`.trim());
            } else if (metadata.nickname) {
                setDisplayName(metadata.nickname);
            } else {
                setDisplayName('User');
            }

            setLevelBadge(metadata.current_level || 'New User');
            if (metadata.avatar_url) {
                setAvatar(metadata.avatar_url);
            }
            fetchRealProfileData();
        } else {
            setDisplayName('Guest');
        }
    }, [user]);

    const fetchRealProfileData = async () => {
        if (!user || user.id === 'pending') return;
        
        try {
            // 1. Fetch Latest Career Assessment for Top Match
            const { data: assessments } = await supabase
                .from('career_assessments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);
            
            // 2. Fetch Skills from Roadmaps
            const { data: roadmaps } = await supabase
                .from('roadmaps')
                .select('target_role, steps')
                .eq('user_id', user.id);


            // 3. Fetch Achievements & Ranking
            const { count: swipeCount } = await supabase
                .from('job_swipes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: matchRightCount } = await supabase
                .from('job_swipes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_interested', true);

            const { count: completedModulesCount } = await supabase
                .from('user_module_completions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: applicationCount } = await supabase
                .from('job_applications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: hiredCount } = await supabase
                .from('job_applications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'hired');

            // Top 10% Ranking Logic
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { data: rankings } = await supabase
                .rpc('get_user_match_rankings');

            let isTop10 = false;
            if (rankings && totalUsers) {
                const myRankEntry = rankings.find((r: any) => r.user_id === user.id);
                if (myRankEntry) {
                    const threshold = Math.max(1, Math.ceil(totalUsers * 0.10));
                    isTop10 = myRankEntry.rank <= threshold;
                }
            } else {
                // Final fallback to metadata if RPC/totalUsers fail
                isTop10 = user.user_metadata?.is_top_percentile || false;
            }

            const unlocked = [];
            if (swipeCount && swipeCount > 0) unlocked.push('first_match');
            if (completedModulesCount && completedModulesCount > 0) unlocked.push('learner');
            if (roadmaps && roadmaps.length > 0) unlocked.push('roadmap_set');
            if (applicationCount && applicationCount > 0) unlocked.push('applied');
            if (isTop10) unlocked.push('top_10');
            if (hiredCount && hiredCount > 0) unlocked.push('hired');

            setUnlockedAchievements(unlocked);

            setIsLoadingSkills(true);
            const baseSkills = new Set<string>();
            
            roadmaps?.forEach(r => {
                if (r.target_role) baseSkills.add(r.target_role);
                // Extract skills from roadmap steps if they exist
                if (Array.isArray(r.steps)) {
                    r.steps.forEach((step: any) => {
                        if (step.label) baseSkills.add(step.label);
                    });
                }
            });

            // Calculate Roadmap Completion %
            // (Sum of all completed modules for roadmap skills / Sum of all modules for those skills)
            let overallProgress = 0;
            const { data: moduleStats } = await supabase
                .from('learning_modules')
                .select('skill_name, id');
            
            const { data: userCompletions } = await supabase
                .from('user_module_completions')
                .select('module_id')
                .eq('user_id', user.id);

            const completedIds = new Set(userCompletions?.map(c => c.module_id) || []);

            if (baseSkills.size > 0) {
                let totalModulesCount = 0;
                let totalCompletedCount = 0;

                baseSkills.forEach(skillName => {
                    const skillModules = moduleStats?.filter(m => m.skill_name === skillName) || [];
                    totalModulesCount += skillModules.length;
                    totalCompletedCount += skillModules.filter(m => completedIds.has(m.id)).length;
                });

                overallProgress = totalModulesCount > 0 ? Math.round((totalCompletedCount / totalModulesCount) * 100) : 0;
            }

            // Update Stats
            setStats(prev => {
                const newStats = [...prev];
                // 1. Top Match (Career Assessment Score)
                if (assessments && assessments.length > 0) {
                    newStats[0] = { ...newStats[0], value: `${assessments[0].match_percentage}%` };
                }

                // 2. Active Courses (Count of unique path titles in Roadmaps)
                const activePaths = new Set(roadmaps?.map(r => r.target_role) || []);
                newStats[1] = { ...newStats[1], label: 'Courses', value: `${activePaths.size}` };

                // 3. Roadmap Completion %
                newStats[2] = { ...newStats[2], label: 'Roadmap', value: `${overallProgress}%` };
                
                return newStats;
            });


            if (baseSkills.size > 0) {
                const skillProgress = Array.from(baseSkills).map((skillName, idx) => {
                    const skillModules = moduleStats?.filter(m => m.skill_name === skillName) || [];
                    const total = skillModules.length;
                    const completed = skillModules.filter(m => completedIds.has(m.id)).length;
                    
                    return {
                        id: String(idx + 1),
                        name: skillName,
                        progress: total > 0 ? Math.round((completed / total) * 100) : 0
                    };
                }).sort((a, b) => b.progress - a.progress);

                setSkills(skillProgress);
            } else {
                setSkills([]);
            }

        } catch (err) {
            console.error('Error fetching real profile data:', err);
        } finally {
            setIsLoadingSkills(false);
        }
    };


    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshUser();
        setIsRefreshing(false);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/sign-in');
    };

    const hasMoreSkills = skills.length > 4;

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`flex-1`}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={tw`pt-12 pb-24 px-6`}
                >
                    {/* Header */}
                    <View style={tw`flex-row items-center justify-between mt-4 mb-8`}>
                        <Text style={tw`text-white text-3xl font-[InterTight] font-semibold`}>Profile</Text>
                        <Link href="/settings" asChild>
                            <TouchableOpacity
                                style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10`}
                                activeOpacity={0.7}
                            >
                                <Settings color="#aaa" size={24} />
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Refined Profile Card */}
                    <GlassCard noPadding style={tw`mb-6 p-6 bg-white/5`}>
                        {/* Profile Info Header (3 Columns Vertically Centered) */}
                        <View style={tw`flex-row items-center w-full mb-6`}>
                            {/* Column 1: Photo */}
                            <View style={[tw`flex-none rounded-full bg-white/5`, {
                                shadowColor: '#fcfcfc80',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.8,
                                shadowRadius: 12,
                                elevation: 8
                            }]}>
                                <Image
                                    source={{ uri: avatar }}
                                    style={tw`w-18 h-18 rounded-full`}
                                />
                            </View>

                            {/* Column 2: Name & Level */}
                            <View style={tw`flex-1 ml-4`}>
                                <Text
                                    style={[tw`text-white text-xl font-[InterTight-Bold] mb-1`, { flexShrink: 1 }]}
                                    adjustsFontSizeToFit={true}
                                    numberOfLines={1}
                                    minimumFontScale={0.5}
                                >
                                    {displayName}
                                </Text>
                                <View style={tw`self-start bg-white/10 px-3 py-1 rounded-full border border-white/10`}>
                                    <Text style={tw`text-gray-400 text-xs font-[InterTight-SemiBold]`}>
                                        {levelBadge}
                                    </Text>
                                </View>
                            </View>

                            {/* Column 3: Edit Button */}
                            <TouchableOpacity
                                style={tw`flex-none bg-white/10 p-3 rounded-2xl border border-white/10`}
                                onPress={() => router.push('/edit-profile')}
                            >
                                <Pencil size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* 80% Horizontal Divider */}
                        <View style={tw`h-[1px] bg-white/10 w-[80%] self-center mb-6`} />

                        {/* Stats Row (3 equal columns) */}
                        <View style={tw`flex-row justify-between w-full`}>
                            {stats.map((stat, idx) => (
                                <View key={idx} style={tw`items-center flex-1`}>
                                    <View style={tw`flex-row items-center mb-1`}>
                                        <stat.icon size={16} color="#fff" style={tw`mr-1.5 opacity-60`} />
                                        <Text style={tw`text-white text-lg font-[InterTight-Bold]`}>{stat.value}</Text>
                                    </View>
                                    <Text style={tw`text-white/40 text-[10px] font-[InterTight-Medium] uppercase tracking-wider`}>
                                        {stat.label}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </GlassCard>

                    {/* Email Verification Card - Only shown if not verified */}
                    {!isVerified && (
                        <GlassCard style={tw`mb-6 p-5 bg-red-500/10 border border-red-500/20`} noPadding>
                            <View style={tw`flex-row items-start`}>
                                <View style={tw`bg-red-500/20 p-2.5 rounded-xl mr-4`}>
                                    <Mail color="#ef4444" size={24} />
                                </View>
                                <View style={tw`flex-1`}>
                                    <Text style={tw`text-white font-[InterTight-Bold] text-base mb-1`}>Verify your email</Text>
                                    <Text style={tw`text-gray-400 font-[InterTight] text-sm leading-5 mb-4`}>
                                        Please verify your email address to access all features. Check your inbox for the verification link.
                                    </Text>
                                    <View style={tw`flex-row gap-3`}>
                                        <TouchableOpacity
                                            onPress={handleResendVerification}
                                            disabled={isResending}
                                            style={tw`bg-white/10 px-4 py-2 rounded-lg border border-white/10 flex-row items-center`}
                                        >
                                            {isResending && <RefreshCw color="#fff" size={12} style={[tw`mr-2`, { transform: [{ rotate: '45deg' }] }]} />}
                                            <Text style={tw`text-white font-[InterTight-Medium] text-xs`}>
                                                {isResending ? 'Resending...' : 'Resend Email'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleRefresh}
                                            disabled={isRefreshing}
                                            style={tw`bg-white/10 px-4 py-2 rounded-lg border border-white/10 flex-row items-center`}
                                        >
                                            <RefreshCw color="#fff" size={12} style={[tw`mr-2`, isRefreshing && { transform: [{ rotate: '45deg' }] }]} />
                                            <Text style={tw`text-white font-[InterTight-Medium] text-xs`}>
                                                {isRefreshing ? 'Checking...' : 'I\'ve Verified'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </GlassCard>
                    )}

                    {/* Career Swipe Matches Button */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push('/job-matches')}
                        style={tw`mb-6 bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex-row items-center px-6 py-5`}
                    >
                        <View style={tw`w-12 h-12 rounded-2xl bg-[#22d3ee20] items-center justify-center mr-4`}>
                            <Briefcase color="#22d3ee" size={24} />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-white font-[InterTight-Bold] text-[17px]`}>Career Swipe Matches</Text>
                            <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>Manage your job interests & applications</Text>
                        </View>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>

                    {/* Create CV Button */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push('/create-cv')}
                        style={tw`mb-6 bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex-row items-center px-6 py-5`}
                    >
                        <View style={tw`w-12 h-12 rounded-2xl bg-[#a78bfa20] items-center justify-center mr-4`}>
                            <FileText color="#a78bfa" size={24} />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-white font-[InterTight-Bold] text-[17px]`}>Create CV</Text>
                            <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>Build a professional resume with Dahlia AI</Text>
                        </View>
                        <ChevronRight color="#888" size={20} />
                    </TouchableOpacity>


                    {/* Top Skills */}
                    <GlassCard noPadding style={tw`mb-6 p-6 bg-white/5`}>
                        <View style={tw`flex-row items-center justify-between mb-6`}>
                            <Text style={tw`text-white text-lg font-[InterTight-Bold]`}>Top Skills</Text>
                            {skills.length > 0 && (
                                <TouchableOpacity onPress={() => router.push('/skills-progress')}>
                                    <Text style={tw`text-white text-sm font-[InterTight-Medium]`}>View all</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {isLoadingSkills ? (
                            <View style={tw`py-4 items-center`}>
                                <RefreshCw color="#666" size={20} style={tw`opacity-50`} />
                            </View>
                        ) : skills.length > 0 ? (
                            skills.slice(0, 4).map((skill, index) => (
                                <View key={skill.id} style={tw`${index !== 0 ? 'mt-6' : ''}`}>
                                    <View style={tw`flex-row justify-between items-center mb-2.5`}>
                                        <Text style={tw`text-white/90 text-base font-[InterTight-Medium]`}>{skill.name}</Text>
                                        <Text style={tw`text-white/50 text-sm font-[InterTight]`}>{skill.progress}%</Text>
                                    </View>
                                    <View style={tw`h-1.5 w-full bg-white/10 rounded-full overflow-hidden`}>
                                        <View
                                            style={[
                                                tw`h-full rounded-full`,
                                                {
                                                    width: `${skill.progress}%`,
                                                    backgroundColor: getProgressColor(skill.progress),
                                                }
                                            ]}
                                        />
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={tw`py-4`}>
                                <Text style={tw`text-gray-400 font-[InterTight] text-sm leading-5 mb-4`}>
                                    Please choose skills from Path or build a Roadmap to track your growth!
                                </Text>
                                <View style={tw`flex-row gap-3`}>
                                    <TouchableOpacity
                                        onPress={() => router.push('/(tabs)/path')}
                                        style={tw`bg-white/10 px-4 py-2.5 rounded-xl border border-white/10`}
                                    >
                                        <Text style={tw`text-white font-[InterTight-Medium] text-xs`}>Explore Path</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => router.push('/roadmap')}
                                        style={tw`bg-white/10 px-4 py-2.5 rounded-xl border border-white/10`}
                                    >
                                        <Text style={tw`text-white font-[InterTight-Medium] text-xs`}>Build Roadmap</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}


                    </GlassCard>

                    {/* Achievements */}
                    <GlassCard noPadding style={tw`mb-8 p-6 pb-0 bg-white/5`}>
                        <View style={tw`flex-row items-center justify-between mb-3`}>
                            <Text style={tw`text-white text-lg font-[InterTight-Bold]`}>Achievements</Text>
                            <Text style={tw`text-white/30 text-sm font-[InterTight]`}>
                                {unlockedAchievements.length}/{ACHIEVEMENTS.length}
                            </Text>
                        </View>


                        <View style={tw`flex-row flex-wrap justify-between`}>
                            {ACHIEVEMENTS.map((achievement, idx) => {
                                const isUnlocked = unlockedAchievements.includes(achievement.id);
                                return (
                                    <View
                                        key={idx}
                                        style={tw`w-[31%] aspect-square bg-white/5 border border-white/5 rounded-2xl items-center justify-center mt-3 ${!isUnlocked ? 'opacity-20' : ''}`}
                                    >
                                        <View style={[tw`w-10 h-10 rounded-full items-center justify-center mb-2`, { backgroundColor: isUnlocked ? `${achievement.color}15` : 'rgba(255,255,255,0.1)' }]}>
                                            <achievement.icon size={20} color={isUnlocked ? achievement.color : '#fff'} />
                                        </View>
                                        <Text style={tw`${isUnlocked ? 'text-white/80' : 'text-white/40'} text-[10px] font-[InterTight-Medium] text-center px-1`} numberOfLines={1}>
                                            {achievement.title}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                    </GlassCard>


                    {/* Footer branding */}
                    <View style={tw`items-center opacity-40 mb-4`}>
                        <Text style={tw`text-white text-sm font-[InterTight]`}>
                            Enroute v1.1.5
                        </Text>
                        <Text style={tw`text-white text-xs font-[InterTight] mt-1`}>
                            Powered by Dahlia AI
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </GlassBackground>
    );
}
