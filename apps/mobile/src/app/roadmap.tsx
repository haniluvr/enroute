import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Share } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check, ChevronRight, Bookmark, Share2, Calendar, Loader, Award, ExternalLink } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AI_API } from '@/config/backend';
import { suggestedPaths, careerDetailsMap } from '@/data/pathMockData';

const COMMON_SKILLS = [
    'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker', 'UI/UX Design', 'Agile', 'Figma', 'TypeScript'
];

export default function RoadmapScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { preSelectedSkills, autofill, roadmapId: paramRoadmapId } = useLocalSearchParams<{ preSelectedSkills?: string, autofill?: string, roadmapId?: string }>();

    const [goal, setGoal] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [roadmapData, setRoadmapData] = useState<any>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [roadmapId, setRoadmapId] = useState<string | null>(null);

    // 1. Data Fetching Effect
    useEffect(() => {
        if (!user || user.id === 'pending') return;

        const fetchExistingRoadmap = async () => {
            if (paramRoadmapId && !roadmapData) {
                setIsGenerating(true);
                try {
                    console.log(`[Roadmap] Fetching ID: ${paramRoadmapId}`);
                    const { data: roadmap, error } = await supabase
                        .from('roadmaps')
                        .select('goal, id, estimated_duration, salary_range, demand_level, roadmap_steps(id, title, description, order, educational_platform)')
                        .eq('id', paramRoadmapId)
                        .single();

                    if (roadmap && !error) {
                        setGoal(roadmap.goal);
                        setRoadmapId(roadmap.id);
                        
                        let stepsData = roadmap.roadmap_steps || [];
                        if (stepsData.length === 0) {
                            const { data: direct } = await supabase
                                .from('roadmap_steps')
                                .select('id, title, description, order, roadmap_id, educational_platform')
                                .eq('roadmap_id', paramRoadmapId);
                            if (direct) stepsData = direct;
                        }

                        const processedSteps = stepsData
                            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                            .map((s: any) => ({
                                id: s.id,
                                title: s.title || "Untitled Step",
                                description: s.description || "Learning module",
                                completed: s.is_completed || false,
                                platform: s.educational_platform || "General"
                            }));

                        setRoadmapData({
                            time: roadmap.estimated_duration,
                            salary: roadmap.salary_range,
                            demand: roadmap.demand_level,
                            id: roadmap.id,
                            steps: processedSteps
                        });
                    }
                } catch (err) {
                    console.error('Fetch error:', err);
                } finally {
                    setIsGenerating(false);
                }
            }
        };

        fetchExistingRoadmap();
    }, [user, paramRoadmapId, roadmapData]);

    // 2. Prefill Effect
    useEffect(() => {
        if (!user || user.id === 'pending' || roadmapData || paramRoadmapId) return;

        const prefill = async () => {
            if (preSelectedSkills) {
                const skills = preSelectedSkills.split(',').filter(Boolean);
                setSelectedSkills(prev => Array.from(new Set([...prev, ...skills])));
                
                if (autofill === 'true' && skills.length > 0) {
                    const fallbackGoal = `${skills[0]} Specialist`;
                    setGoal(fallbackGoal);
                    setTimeout(() => handleGenerate(fallbackGoal), 500);
                }
            }
        };
        prefill();
    }, [user, preSelectedSkills, autofill]);

    const handleGenerate = async (overrideGoal?: string) => {
        const targetGoal = overrideGoal || goal;
        if (!targetGoal.trim() || !user) return;
        
        setIsGenerating(true);
        try {
            const response = await fetch(AI_API.ROADMAP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal: targetGoal, currentSkills: selectedSkills })
            });
            const data = await response.json();
            
            if (!data.roadmap) throw new Error('Generation failed');

            const { data: roadmap, error: rError } = await supabase
                .from('roadmaps')
                .insert({
                    user_id: user.id,
                    goal: targetGoal,
                    target_role: targetGoal,
                    estimated_duration: data.estimated_duration || '6-12 Months',
                    salary_range: data.salary || 'Competitive',
                    demand_level: data.demand || 'High',
                    current_skills: selectedSkills
                }).select().single();

            if (rError) throw rError;

            const steps = data.roadmap.map((s: any, i: number) => ({
                roadmap_id: roadmap.id,
                title: s.title,
                description: s.description,
                order: i
            }));

            const { data: savedSteps } = await supabase.from('roadmap_steps').insert(steps).select();
            
            setRoadmapId(roadmap.id);
            setRoadmapData({
                time: roadmap.estimated_duration,
                salary: roadmap.salary_range,
                demand: roadmap.demand_level,
                id: roadmap.id,
                steps: savedSteps
            });
        } catch (err) {
            console.error('Generate error:', err);
            Alert.alert("Error", "Failed to build roadmap.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!user || !roadmapId) return;
        try {
            const { error } = await supabase.from('library_saves').insert({
                user_id: user.id,
                item_type: 'roadmap',
                item_id: roadmapId,
                title: goal
            });
            if (!error) setIsSaved(true);
        } catch (err) { console.error(err); }
    };

    const handleShare = async () => {
        try { await Share.share({ message: `My roadmap for ${goal}` }); } catch (e) {}
    };

    const handleStartLearning = () => {
        if (!roadmapData || !roadmapData.steps) return;
        const nextStep = roadmapData.steps.find((step: any) => !step.completed) || roadmapData.steps[roadmapData.steps.length - 1];
        if (nextStep) {
            router.push(`/roadmap-details/${nextStep.id}`);
        }
    };

    const toggleSkill = (skill: string) => {
        setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`px-6 pt-16 pb-4 flex-row items-center`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mr-4`}>
                    <ChevronLeft color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 pb-40`} showsVerticalScrollIndicator={false}>
                {!roadmapData ? (
                    <View>
                        {isGenerating ? (
                            <View style={tw`items-center justify-center py-20`}>
                                <ActivityIndicator color="#fff" size="large" />
                                <Text style={tw`text-white font-semibold text-2xl mt-4`}>Building your roadmap...</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={tw`text-white font-semibold text-3xl mb-1`}>Build your roadmap</Text>
                                <Text style={tw`text-gray-400 text-lg mb-7`}>What do you want to learn?</Text>
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 text-white px-5 py-4 rounded-3xl text-lg min-h-[150px]`}
                                    placeholder="e.g. Become a full stack developer"
                                    placeholderTextColor="#666"
                                    value={goal}
                                    onChangeText={setGoal}
                                    multiline
                                />
                                <Text style={tw`text-white mt-8 mb-4`}>Select core skills</Text>
                                <View style={tw`flex-row flex-wrap gap-2`}>
                                    {COMMON_SKILLS.map(skill => (
                                        <TouchableOpacity 
                                            key={skill} 
                                            onPress={() => toggleSkill(skill)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            style={tw`bg-white/5 border border-white/10 px-5 py-3 rounded-2xl ${selectedSkills.includes(skill) ? 'border-accent-pink bg-accent-pink/10' : ''}`}
                                        >
                                            <Text style={tw`text-white font-[InterTight-Medium]`}>{skill}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                ) : (
                    <View>
                        <Text style={tw`text-white font-semibold text-3xl mb-1`}>Your learning roadmap</Text>
                        <Text style={tw`text-gray-400 text-lg mb-6`}>{goal}</Text>
                        
                        {roadmapData.steps.map((step: any, index: number) => (
                            <TouchableOpacity key={index} style={tw`p-5 bg-white/10 border border-white/10 rounded-3xl mb-4`} onPress={() => router.push(`/roadmap-details/${step.id}`)}>
                                <View style={tw`flex-row justify-between mb-3`}>
                                    <View style={tw`bg-[#2b4e50] px-3 py-1 rounded-full`}><Text style={tw`text-white text-xs`}>Step {index + 1}</Text></View>
                                    <ChevronRight color="#888" size={18} />
                                </View>
                                <Text style={tw`text-white font-medium text-lg mb-1`}>{step.title}</Text>
                                <Text style={tw`text-gray-400 mb-2`}>{step.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={tw`absolute bottom-0 left-0 right-0 px-6 pb-12 pt-4`}>
                {!roadmapData ? (
                    <TouchableOpacity onPress={() => handleGenerate()} disabled={isGenerating} style={tw`w-full py-4 rounded-full items-center justify-center bg-white`}>
                        <Text style={tw`text-black font-semibold text-lg`}>{isGenerating ? 'Generating...' : 'Generate roadmap'}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={tw`flex-row items-center gap-3`}>
                       <TouchableOpacity onPress={handleSave} style={tw`w-14 h-14 rounded-full bg-white/10 items-center justify-center border border-white/20`}>
                            <Bookmark color="#fff" size={24} fill={isSaved ? "#fff" : "transparent"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShare} style={tw`w-14 h-14 rounded-full bg-white/10 items-center justify-center border border-white/20`}>
                            <Share2 color="#fff" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleStartLearning}
                            style={tw`flex-1 h-14 bg-white rounded-full items-center justify-center shadow-lg`}
                        >
                            <Text style={tw`text-black text-[17px] font-[InterTight] font-semibold`}>Start learning</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </GlassBackground>
    );
}
