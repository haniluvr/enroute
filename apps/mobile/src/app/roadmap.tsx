import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Share } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check, Download, BookmarkPlus, Clock, DollarSign, TrendingUp, ChevronRight, Bookmark, Share2, Calendar, Loader, Award, ExternalLink } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { BlurView } from 'expo-blur';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AI_API } from '@/config/backend';

const COMMON_SKILLS = [
    'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker', 'UI/UX Design', 'Agile', 'Figma', 'TypeScript'
];

interface DetectedSkill {
    name: string;
    source: 'cv' | 'manual';
}

export default function RoadmapScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [goal, setGoal] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [roadmapData, setRoadmapData] = useState<any>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [roadmapId, setRoadmapId] = useState<string | null>(null);

    const toggleSkill = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    const { preSelectedSkills, autofill } = useLocalSearchParams<{ preSelectedSkills?: string, autofill?: string }>();

    useEffect(() => {
        if (!user || user.id === 'pending' || roadmapData) return;

        const prefillFromPersonalization = async () => {
            try {
                let currentGoal = goal;

                // If coming from Scan CV, use the skills passed via params
                if (preSelectedSkills) {
                    const paramsSkills = preSelectedSkills.split(',').filter(Boolean);
                    setSelectedSkills(prev => Array.from(new Set([...prev, ...paramsSkills])));
                }

                // 1. Fetch Skills from CV scans (for general pre-fill)
                const { data: scans } = await supabase
                    .from('cv_scans')
                    .select('extracted_skills')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                // 2. Fetch Goal suggestion from career assessment
                const { data: assessments } = await supabase
                    .from('career_assessments')
                    .select('ai_career_suggestion')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (scans && scans.length > 0) {
                    const allSkills = new Set<string>();
                    // Only use the most recent scan to avoid overwhelming the UI
                    const mostRecentScan = scans[0];
                    const skills = mostRecentScan.extracted_skills;
                    
                    if (Array.isArray(skills)) {
                        skills.forEach((skill: any) => allSkills.add(String(skill)));
                    } else if (skills && typeof skills === 'object') {
                        const tech = skills.technical || [];
                        const soft = skills.soft || [];
                        [...tech, ...soft].forEach(skill => allSkills.add(String(skill)));
                    }
                    
                    if (allSkills.size > 0) {
                        setSelectedSkills(prev => Array.from(new Set([...prev, ...Array.from(allSkills)])));
                    }
                }

                if (assessments && assessments.length > 0 && !currentGoal) {
                    currentGoal = assessments[0].ai_career_suggestion;
                    setGoal(currentGoal);
                }

                // FALLBACK GOAL if autofill is true but no goal exists
                if (autofill === 'true' && !currentGoal && preSelectedSkills) {
                    const firstSkill = preSelectedSkills.split(',')[0] || 'Professional';
                    currentGoal = `${firstSkill} Specialist`;
                    setGoal(currentGoal);
                }

                // AUTO-TRIGGER GENERATE if autofill is true
                if (autofill === 'true' && currentGoal && !isGenerating && !roadmapData) {
                    // Small delay to ensure state updates
                    setTimeout(() => handleGenerate(currentGoal), 500);
                }
            } catch (err) {
                console.error('Personalization pre-fill error:', err);
            }
        };

        prefillFromPersonalization();
    }, [user, roadmapData, preSelectedSkills, autofill]);

    const handleGenerate = async (overrideGoal?: string) => {
        const targetGoal = overrideGoal || goal;
        if (!targetGoal.trim() || !user || user.id === 'pending') {
            if (!overrideGoal) Alert.alert("Goal required", "Please tell us what you want to learn.");
            return;
        }
        setIsGenerating(true);
        
        try {
            // 1. Call Backend AI for Roadmap Generation
            const response = await fetch(AI_API.ROADMAP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal: targetGoal,
                    currentSkills: selectedSkills
                })
            });

            const data = await response.json();
            
            if (!data.roadmap || !Array.isArray(data.roadmap)) {
                throw new Error('Invalid roadmap data received');
            }

            const aiGeneratedSteps = data.roadmap;

            // 2. Save Roadmap to Supabase
            const { data: roadmap, error: roadmapError } = await supabase
                .from('roadmaps')
                .insert({
                    user_id: user.id,
                    goal: targetGoal,
                    estimated_duration: data.estimated_duration || '6-12 Months',
                    salary_range: data.salary || 'Competitive',
                    demand_level: data.demand || 'High',
                    current_skills: selectedSkills
                })
                .select()
                .single();

            if (roadmapError) throw roadmapError;

            // 3. Save Steps
            const stepsToInsert = aiGeneratedSteps.map((step: any, index: number) => ({
                roadmap_id: roadmap.id,
                title: step.title,
                description: step.description,
                is_completed: false,
                educational_platform: step.platform || 'General',
                has_certification: !!step.platform && step.platform.toLowerCase().includes('coursera'),
                is_professional_cert: false,
                order: index,
                learn_items: step.learnItems || []
            }));

            const { data: savedSteps, error: stepsError } = await supabase
                .from('roadmap_steps')
                .insert(stepsToInsert)
                .select();

            if (stepsError) throw stepsError;

            setRoadmapId(roadmap.id);
            setRoadmapData({
                time: roadmap.estimated_duration,
                salary: roadmap.salary_range,
                demand: roadmap.demand_level,
                id: roadmap.id,
                steps: savedSteps
            });

        } catch (err) {
            console.error('Generate Roadmap Error:', err);
            Alert.alert("Error", "Failed to generate roadmap. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!user || !roadmapId || !roadmapData) return;

        try {
            if (!isSaved) {
                const { error } = await supabase.from('library_saves').insert({
                    user_id: user.id,
                    item_type: 'roadmap',
                    item_id: roadmapId,
                    title: goal,
                    metadata: {
                        duration: roadmapData.time,
                        steps_count: roadmapData.steps.length
                    }
                });
                if (error) throw error;
                Alert.alert("Success", "Roadmap saved to library!");
                setIsSaved(true);
            } else {
                // Optionally handle unsave
                const { error } = await supabase
                    .from('library_saves')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('item_id', roadmapId);
                
                if (error) throw error;
                setIsSaved(false);
            }
        } catch (err) {
            console.error('Save Roadmap Error:', err);
            Alert.alert("Error", "Failed to save roadmap.");
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out my new learning roadmap for "${goal}"!`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleStartLearning = () => {
        if (!roadmapData || !roadmapData.steps) return;
        
        // Find the first step that is not completed. If all are completed, fallback to the last step.
        const nextStep = roadmapData.steps.find((step: any) => !step.completed) || roadmapData.steps[roadmapData.steps.length - 1];
        
        if (nextStep) {
            router.push(`/roadmap-details/${nextStep.id}`);
        }
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            {/* Header */}
            <View style={tw`px-6 pt-16 pb-4 flex-row items-center`}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mr-4`}
                >
                    <ChevronLeft color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={tw`flex-1`}
                contentContainerStyle={tw`px-6 pb-40`}
                showsVerticalScrollIndicator={false}
            >
                {!roadmapData ? (
                    <View>
                        <Text style={tw`text-white font-[InterTight] font-semibold text-3xl`}>Build your roadmap</Text>
                        <Text style={tw`text-gray-400 font-[InterTight] text-lg mb-7`}>Tell us what you want to learn</Text>
                        <TextInput
                            style={tw`bg-white/5 border border-white/10 text-white font-[InterTight] px-5 py-3 rounded-3xl text-lg min-h-[200px]`}
                            placeholder="e.g. Become a full stack developer"
                            placeholderTextColor="#9ca3af"
                            value={goal}
                            onChangeText={setGoal}
                            multiline
                            numberOfLines={8}
                            textAlignVertical="top"
                        />
                        <Text style={tw`text-gray-400 font-[InterTight] text-sm mt-2 mb-10 ml-1`}>
                            Be specific about your goals.
                        </Text>

                        <Text style={tw`text-white font-[InterTight-Medium] text-[17px] mb-4`}>
                            Select skills you currently have
                        </Text>
                        <View style={tw`flex-row flex-wrap gap-2`}>
                            {/* Only show generalized common skills for selection to keep UI clean */}
                            {COMMON_SKILLS.map(skill => (
                                <TouchableOpacity
                                    key={skill}
                                    onPress={() => toggleSkill(skill)}
                                    style={tw`flex-row items-center bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl ${selectedSkills.includes(skill) ? 'border-accent-pink bg-accent-pink/5' : ''}`}
                                >
                                    <View style={tw`w-5 h-5 rounded bg-white/10 mr-2 items-center justify-center border border-white/20 ${selectedSkills.includes(skill) ? 'bg-accent-pink border-accent-pink' : ''}`}>
                                        {selectedSkills.includes(skill) && <Check color="#fff" size={12} />}
                                    </View>
                                    <Text style={tw`text-white font-[InterTight] text-[15px]`}>{skill}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View>
                        {/* New Header */}
                        <Text style={tw`text-white font-[InterTight] font-semibold text-3xl mb-1`}>Your learning roadmap</Text>
                        <Text style={tw`text-gray-400 font-[InterTight] text-lg mb-6`}>Based on your skills and input</Text>
                        
                        <Text style={tw`text-white/70 font-[InterTight-Medium] text-xl leading-6 mb-5`} numberOfLines={3}>
                            {goal}
                        </Text>

                        {/* PathCard UI for Steps */}
                        <View>
                            {roadmapData.steps.map((step: any, index: number) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={tw`p-5 bg-white/10 border border-white/10 rounded-3xl mb-4 overflow-hidden`}
                                    onPress={() => router.push(`/roadmap-details/${step.id}`)}
                                >
                                    <View style={tw`flex-row justify-between items-start mb-3`}>
                                        <View style={tw`bg-[#2b4e50] px-3 py-1.5 rounded-full border border-white/10 flex-row items-center`}>
                                            <Loader color="#fff" size={14} style={tw`mr-1.5`} />
                                            <Text style={tw`text-white font-[InterTight-SemiBold] text-xs`}>Step {index + 1}</Text>
                                        </View>
                                        <View style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center`}>
                                            <ChevronRight color="#888" size={18} />
                                        </View>
                                    </View>

                                    <Text style={tw`text-white font-[InterTight] font-medium text-lg mb-1`} numberOfLines={1}>
                                        {step.title}
                                    </Text>
                                    <Text style={tw`text-gray-400 font-[InterTight] text-base mb-4`} numberOfLines={2}>
                                        {step.description}
                                    </Text>

                                    {/* Mock Progress Bar */}
                                    <View style={tw`mb-4`}>
                                        <View style={tw`flex-row justify-between mb-1.5`}>
                                            <Text style={tw`text-gray-400 font-[InterTight] text-xs`}>Progress</Text>
                                            <Text style={tw`text-gray-400 font-[InterTight] text-xs`}>{step.completed ? '100%' : '0%'}</Text>
                                        </View>
                                        <View style={tw`w-full h-1.5 bg-white/10 rounded-full overflow-hidden`}>
                                            <View style={tw`h-full bg-[#10b981] rounded-full ${step.completed ? 'w-full' : 'w-[0%]'}`} />
                                        </View>
                                    </View>

                                    <View style={tw`flex-row flex-wrap gap-2 mt-1`}>
                                        <View style={tw`bg-white/5 rounded-xl px-3 py-1.5 flex-row items-center border border-white/5`}>
                                            <Calendar color="#888" size={12} style={tw`mr-1.5`} />
                                            <Text style={tw`text-gray-400 font-[InterTight] text-[13px]`}>
                                                Est. {roadmapData.time}
                                            </Text>
                                        </View>
                                        
                                        {step.platform && (
                                            <View style={tw`bg-cyan-500/10 rounded-xl px-3 py-1.5 flex-row items-center border border-cyan-500/20`}>
                                                <ExternalLink color="#22d3ee" size={12} style={tw`mr-1.5`} />
                                                <Text style={tw`text-cyan-400 font-[InterTight-Medium] text-[13px]`}>
                                                    {step.platform}
                                                </Text>
                                            </View>
                                        )}

                                        {step.hasCertificate && (
                                            <View style={tw`bg-amber-500/10 rounded-xl px-3 py-1.5 flex-row items-center border border-amber-500/20`}>
                                                <Award color="#f59e0b" size={12} style={tw`mr-1.5`} />
                                                <Text style={tw`text-amber-400 font-[InterTight-Medium] text-[13px]`}>
                                                    {step.isCertification ? 'Professional Certificate' : 'Certificate Included'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Actions */}
            {!roadmapData ? (
                <View style={tw`absolute bottom-0 left-0 right-0 px-6 pb-12 pt-4 bg-transparent`}>
                     <TouchableOpacity
                        onPress={() => handleGenerate()}
                        disabled={isGenerating}
                        style={tw`w-full py-4 rounded-full items-center justify-center flex-row shadow-xl ${isGenerating ? 'bg-white/70' : 'bg-white'}`}
                    >
                        {isGenerating ? (
                            <>
                                <ActivityIndicator color="#000" style={tw`mr-2`} />
                                <Text style={tw`text-black text-lg font-[InterTight-SemiBold]`}>Generating...</Text>
                            </>
                        ) : (
                            <Text style={tw`text-black text-lg font-[InterTight] font-semibold`}>Generate roadmap</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={tw`absolute bottom-0 left-0 right-0 px-6 pb-12 pt-4 bg-transparent`}>
                    <View style={tw`flex-row items-center justify-between`}>
                        <TouchableOpacity
                            onPress={handleSave}
                            style={tw`w-14 h-14 rounded-full overflow-hidden bg-white/10`}
                        >
                            <BlurView intensity={30} tint="dark" style={tw`flex-1 items-center justify-center border border-white/20 rounded-full`}>
                                <Bookmark color="#fff" size={24} fill={isSaved ? "#fff" : "transparent"} />
                            </BlurView>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleShare}
                            style={tw`w-14 h-14 rounded-full overflow-hidden mx-3 bg-white/10`}
                        >
                            <BlurView intensity={30} tint="dark" style={tw`flex-1 items-center justify-center border border-white/20 rounded-full`}>
                                <Share2 color="#fff" size={24} />
                            </BlurView>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleStartLearning}
                            style={tw`flex-1 h-14 bg-white rounded-full items-center justify-center shadow-lg`}
                        >
                            <Text style={tw`text-black text-[17px] font-[InterTight] font-semibold`}>Start learning</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </GlassBackground>
    );
}
