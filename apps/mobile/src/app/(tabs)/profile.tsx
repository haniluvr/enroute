import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Settings, Pencil, Trophy, BookOpen, Map, Send, Star, Briefcase, Target, GraduationCap, Route } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useRouter, Link } from 'expo-router';
import { supabase } from '@/config/supabase';

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
    { title: 'First Match', icon: Trophy, color: '#FCD34D' },
    { title: 'Learner', icon: BookOpen, color: '#60A5FA' },
    { title: 'Roadmap Set', icon: Map, color: '#34D399' },
    { title: 'Applied', icon: Send, color: '#F87171' },
    { title: 'Top 10%', icon: Star, color: '#A78BFA' },
    { title: 'Hired!', icon: Briefcase, color: '#F472B6' },
];

const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#fcfcfccc'; // cyan
    if (progress >= 60) return '#fcfcfc99'; // violet
    if (progress >= 40) return '#fcfcfc66'; // pink
    return '#444';
};

export default function ProfileScreen() {
    const router = useRouter();
    const [userName, setUserName] = useState('Loading...');
    const [levelBadge, setLevelBadge] = useState('New User');
    const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop');

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.user_metadata) {
                const firstName = user.user_metadata.first_name || '';
                const lastName = user.user_metadata.last_name || '';
                const nickname = user.user_metadata.nickname || '';
                const emailPrefix = user.email ? user.email.split('@')[0] : 'User';

                const displayFirst = firstName || nickname || emailPrefix;
                const displayFull = lastName ? `${displayFirst} ${lastName}` : displayFirst;

                setUserName(displayFull);
                setLevelBadge(user.user_metadata.current_level || 'New User');
                if (user.user_metadata.avatar_url) {
                    setAvatar(user.user_metadata.avatar_url);
                }
            } else {
                setUserName('Guest');
            }
        };

        fetchUser();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/sign-in');
    };

    const displayedSkills = SKILLS.slice(0, 4);
    const hasMoreSkills = SKILLS.length > 4;

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
                                    {userName}
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
                            {STATS.map((stat, idx) => (
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

                    {/* Top Skills */}
                    <GlassCard noPadding style={tw`mb-6 p-6 bg-white/5`}>
                        <View style={tw`flex-row items-center justify-between mb-6`}>
                            <Text style={tw`text-white text-lg font-[InterTight-Bold]`}>Top Skills</Text>
                            {hasMoreSkills && (
                                <TouchableOpacity>
                                    <Text style={tw`text-white text-sm font-[InterTight-Medium]`}>View all</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {displayedSkills.map((skill, index) => (
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
                        ))}
                    </GlassCard>

                    {/* Achievements */}
                    <GlassCard noPadding style={tw`mb-8 p-6 pb-0 bg-white/5`}>
                        <View style={tw`flex-row items-center justify-between mb-3`}>
                            <Text style={tw`text-white text-lg font-[InterTight-Bold]`}>Achievements</Text>
                            <Text style={tw`text-white/30 text-sm font-[InterTight]`}>6/6</Text>
                        </View>

                        <View style={tw`flex-row flex-wrap justify-between`}>
                            {ACHIEVEMENTS.map((achievement, idx) => (
                                <View
                                    key={idx}
                                    style={tw`w-[31%] aspect-square bg-white/5 border border-white/5 rounded-2xl items-center justify-center mt-3`}
                                >
                                    <View style={[tw`w-10 h-10 rounded-full items-center justify-center mb-2`, { backgroundColor: `${achievement.color}15` }]}>
                                        <achievement.icon size={20} color={achievement.color} />
                                    </View>
                                    <Text style={tw`text-white/80 text-[10px] font-[InterTight-Medium] text-center px-1`} numberOfLines={1}>
                                        {achievement.title}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </GlassCard>

                    <GlassButton
                        title="Sign Out"
                        variant="danger"
                        onPress={handleSignOut}
                        style={tw`mb-8`}
                    />

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
