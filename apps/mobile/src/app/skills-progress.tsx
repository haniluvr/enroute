import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { ChevronLeft, GraduationCap, Star, BookOpen, Route, Search } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { useRouter } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#fcfcfccc'; // cyan
    if (progress >= 60) return '#fcfcfc99'; // violet
    if (progress >= 40) return '#fcfcfc66'; // pink
    return '#444';
};

export default function SkillsProgressScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [skills, setSkills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSkillsData = async () => {
        if (!user || user.id === 'pending') return;
        
        setIsLoading(true);
        try {
            // 1. Fetch Roadmaps for base skills
            const { data: roadmaps } = await supabase
                .from('roadmaps')
                .select('target_role, steps')
                .eq('user_id', user.id);

            const baseSkills = new Set<string>();
            roadmaps?.forEach(r => {
                if (r.target_role) baseSkills.add(r.target_role);
                if (Array.isArray(r.steps)) {
                    r.steps.forEach((step: any) => {
                        if (step.label) baseSkills.add(step.label);
                    });
                }
            });


            if (baseSkills.size > 0) {
                // 2. Fetch Module Progress
                const { data: moduleStats } = await supabase
                    .from('learning_modules')
                    .select('skill_name, id');
                
                const { data: userCompletions } = await supabase
                    .from('user_module_completions')
                    .select('module_id')
                    .eq('user_id', user.id);

                const completedIds = new Set(userCompletions?.map(c => c.module_id) || []);

                const skillProgress = Array.from(baseSkills).map((skillName, idx) => {
                    const skillModules = moduleStats?.filter(m => m.skill_name === skillName) || [];
                    const total = skillModules.length;
                    const completed = skillModules.filter(m => completedIds.has(m.id)).length;
                    
                    return {
                        id: String(idx + 1),
                        name: skillName,
                        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
                        totalModules: total,
                        completedModules: completed
                    };
                }).sort((a, b) => b.progress - a.progress);

                setSkills(skillProgress);
            } else {
                setSkills([]);
            }
        } catch (err) {
            console.error('Error fetching skills progress:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSkillsData();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSkillsData();
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <SafeAreaView style={tw`flex-1`}>
                <View style={tw`flex-1 px-6`}>
                    {/* Header */}
                    <View style={tw`flex-row items-center pt-4 mb-8`}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10 mr-4`}
                        >
                            <ChevronLeft color="#fff" size={24} />
                        </TouchableOpacity>
                        <View>
                            <Text style={tw`text-white text-2xl font-[InterTight-Bold]`}>Skill Mastery</Text>
                            <Text style={tw`text-white/50 text-sm font-[InterTight]`}>Track your professional growth</Text>
                        </View>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={tw`pb-12`}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                        }
                    >
                        {isLoading && !refreshing ? (
                            <View style={tw`py-20 items-center justify-center`}>
                                <GraduationCap color="#fff" size={48} style={tw`opacity-20 mb-4`} />
                                <Text style={tw`text-white/40 font-[InterTight]`}>Loading your skills...</Text>
                            </View>
                        ) : skills.length > 0 ? (
                            skills.map((skill) => (
                                <GlassCard key={skill.id} noPadding style={tw`mb-4 p-5 bg-white/5`}>
                                    <View style={tw`flex-row justify-between items-start mb-4`}>
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`text-white text-lg font-[InterTight-Bold] mb-1`}>{skill.name}</Text>
                                            <View style={tw`flex-row items-center`}>
                                                <BookOpen size={14} color="#aaa" style={tw`mr-1.5`} />
                                                <Text style={tw`text-gray-400 text-xs font-[InterTight]`}>
                                                    {skill.completedModules} / {skill.totalModules} Modules
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={tw`items-end`}>
                                            <Text style={tw`text-white font-[InterTight-Bold] text-xl`}>{skill.progress}%</Text>
                                            <Text style={tw`text-white/30 text-[10px] font-bold uppercase tracking-wider`}>Mastery</Text>
                                        </View>
                                    </View>

                                    <View style={tw`h-2 w-full bg-white/10 rounded-full overflow-hidden`}>
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
                                    
                                    {skill.progress === 100 && (
                                        <View style={tw`flex-row items-center mt-4`}>
                                            <Star size={14} color="#FCD34D" style={tw`mr-1.5`} />
                                            <Text style={tw`text-[#FCD34D] text-xs font-[InterTight-SemiBold]`}>Skill Mastered!</Text>
                                        </View>
                                    )}
                                </GlassCard>
                            ))
                        ) : (
                            <View style={tw`py-20 items-center justify-center`}>
                                <Route color="#fff" size={48} style={tw`opacity-10 mb-6`} />
                                <Text style={tw`text-white text-lg font-[InterTight-Bold] text-center mb-2`}>No skills identified yet</Text>
                                <Text style={tw`text-white/40 font-[InterTight] text-center px-10 mb-8`}>
                                    Build a roadmap or scan your CV to identify the skills you need to achieve your career goals.
                                </Text>
                                
                                <TouchableOpacity
                                    onPress={() => router.push('/roadmap')}
                                    style={tw`bg-white px-8 py-3.5 rounded-2xl mb-4`}
                                >
                                    <Text style={tw`text-black font-[InterTight-Bold]`}>Build Roadmap</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    onPress={() => router.push('/scan-cv')}
                                    style={tw`border border-white/20 px-8 py-3.5 rounded-2xl`}
                                >
                                    <Text style={tw`text-white font-[InterTight-Medium]`}>Scan Career CV</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}
