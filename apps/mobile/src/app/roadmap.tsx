import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Share } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Download, BookmarkPlus, Clock, DollarSign, TrendingUp, ChevronRight, Bookmark, Share2, Calendar, Loader, Award, ExternalLink } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

const COMMON_SKILLS = [
    'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker', 'UI/UX Design', 'Agile', 'Figma', 'TypeScript'
];

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

    const handleGenerate = async () => {
        if (!goal.trim() || !user || user.id === 'pending') {
            Alert.alert("Goal required", "Please tell us what you want to learn.");
            return;
        }
        setIsGenerating(true);
        
        try {
            // 1. Mock AI generation (Delay)
            await new Promise(resolve => setTimeout(resolve, 2000));

            let mockData: any;
            
            const lowerGoal = goal.toLowerCase();
            if (lowerGoal.includes('data') || lowerGoal.includes('python') || lowerGoal.includes('analysis')) {
                mockData = {
                    time: '8 Months',
                    salary: '$90k - $140k',
                    demand: 'Critical',
                    steps: [
                        { title: 'Google Data Analytics Professional Certificate', description: 'Master data cleaning, analysis, and visualization with SQL, R, and Tableau.', platform: 'Coursera', hasCertificate: true, isCertification: true, completed: false },
                        { title: 'IBM Data Science Professional Certificate', description: 'Learn Python, SQL, and Machine Learning. Build data-driven models.', platform: 'Coursera', hasCertificate: true, isCertification: true, completed: false },
                        { title: 'Applied Data Science with Python Specialization', description: 'Deep dive into data visualization, text mining, and social network analysis.', platform: 'Coursera', hasCertificate: true, isCertification: false, completed: false },
                        { title: 'Capstone: Real-world Business Analysis', description: 'Apply analytics to solve a real business problem and present your findings.', platform: 'Enroute AI', hasCertificate: false, isCertification: false, completed: false }
                    ]
                };
            } else if (lowerGoal.includes('web') || lowerGoal.includes('developer') || lowerGoal.includes('full stack')) {
                mockData = {
                    time: '9 Months',
                    salary: '$85k - $130k',
                    demand: 'Very High',
                    steps: [
                        { title: 'Meta Front-End Developer Professional Certificate', description: 'Master HTML, CSS, JavaScript, and React to build responsive web apps.', platform: 'Coursera', hasCertificate: true, isCertification: true, completed: false },
                        { title: 'Meta Back-End Developer Professional Certificate', description: 'Learn Python, Django, and database management for scalable back-ends.', platform: 'Coursera', hasCertificate: true, isCertification: true, completed: false },
                        { title: 'Full Stack Web Development (HKUST)', description: 'Implement complex server-side logic and integrate with front-end frameworks.', platform: 'Coursera', hasCertificate: true, isCertification: false, completed: false },
                        { title: 'Deployment & System Architecture', description: 'Deploy your applications using AWS/GCP and learn CI/CD best practices.', platform: 'Enroute AI', hasCertificate: false, isCertification: false, completed: false }
                    ]
                };
            } else {
                // Default UI/UX or general creative path
                mockData = {
                    time: '6 Months',
                    salary: '$80k - $120k',
                    demand: 'High',
                    steps: [
                        { title: 'Google UX Design Professional Certificate', description: 'Foundations of User Experience (UX) Design, wireframing, and user research.', platform: 'Coursera', hasCertificate: true, isCertification: true, completed: false },
                        { title: 'UI/UX Design Specialization (CalArts)', description: 'Visual elements, strategy, and design fundamentals. Learn visual hierarchies.', platform: 'Coursera', hasCertificate: true, isCertification: false, completed: false },
                        { title: 'Interaction Design Specialization', description: 'Deep dive into user research techniques, storyboarding, and rapid prototyping.', platform: 'Coursera', hasCertificate: true, isCertification: false, completed: false },
                        { title: 'Portfolio Development & Practice', description: 'Apply your skills to real-world projects and build a professional design portfolio.', platform: 'Enroute AI', hasCertificate: false, isCertification: false, completed: false }
                    ]
                };
            }

            // 2. Save Roadmap to Supabase
            const { data: roadmap, error: roadmapError } = await supabase
                .from('roadmaps')
                .insert({
                    user_id: user.id,
                    goal: goal,
                    estimated_duration: mockData.time,
                    salary_range: mockData.salary,
                    demand_level: mockData.demand,
                    current_skills: selectedSkills
                })
                .select()
                .single();

            if (roadmapError) throw roadmapError;

            // 3. Save Steps
            const stepsToInsert = mockData.steps.map((step: any, index: number) => ({
                roadmap_id: roadmap.id,
                title: step.title,
                description: step.description,
                is_completed: step.completed,
                educational_platform: step.platform,
                has_certification: step.hasCertificate,
                is_professional_cert: step.isCertification,
                order: index
            }));

            const { data: savedSteps, error: stepsError } = await supabase
                .from('roadmap_steps')
                .insert(stepsToInsert)
                .select();

            if (stepsError) throw stepsError;

            setRoadmapId(roadmap.id);
            setRoadmapData({
                ...mockData,
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
                            {COMMON_SKILLS.map(skill => (
                                <TouchableOpacity
                                    key={skill}
                                    onPress={() => toggleSkill(skill)}
                                    style={tw`flex-row items-center bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl ${selectedSkills.includes(skill) ? 'border-white/20' : ''}`}
                                >
                                    <View style={tw`w-5 h-5 rounded bg-white/10 mr-2 items-center justify-center border border-white/20 ${selectedSkills.includes(skill) ? 'border-white/10' : ''}`}>
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
                        onPress={handleGenerate}
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
