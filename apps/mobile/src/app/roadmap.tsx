import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Share } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Download, BookmarkPlus, Clock, DollarSign, TrendingUp, ChevronRight, Bookmark, Share2, Calendar, Loader } from 'lucide-react-native';
import { useState } from 'react';
import { BlurView } from 'expo-blur';

const COMMON_SKILLS = [
    'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker', 'UI/UX Design', 'Agile', 'Figma', 'TypeScript'
];

export default function RoadmapScreen() {
    const router = useRouter();
    const [goal, setGoal] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [roadmapData, setRoadmapData] = useState<any>(null);
    const [isSaved, setIsSaved] = useState(false);

    const toggleSkill = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    const handleGenerate = () => {
        if (!goal.trim()) {
            Alert.alert("Goal required", "Please tell us what you want to learn.");
            return;
        }
        setIsGenerating(true);
        // Mock generation
        setTimeout(() => {
            setIsGenerating(false);
            setRoadmapData({
                time: '6 Months',
                salary: '$80k - $120k',
                demand: 'High',
                steps: [
                    { id: '1', title: 'Frontend Fundamentals', description: 'Master HTML, CSS, JavaScript basics and advanced concepts.', completed: true },
                    { id: '2', title: 'React Framework', description: 'Build dynamic UIs with React, hooks, and state management.', completed: false },
                    { id: '3', title: 'Backend APIs', description: 'Learn Node.js, Express, and RESTful API design.', completed: false },
                    { id: '4', title: 'Database Construction', description: 'Understand SQL and NoSQL databases like PostgreSQL and MongoDB.', completed: false },
                    { id: '1', title: 'Deployment & CI/CD', description: 'Get familiar with Git, Docker, and AWS deploying workflows.', completed: false }
                ]
            });
        }, 2000);
    };

    const handleSave = () => {
        if (!isSaved) {
            Alert.alert("Success", "Roadmap saved to library!");
        }
        setIsSaved(!isSaved);
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

                                    <View style={tw`bg-white/5 rounded-xl px-4 py-2.5 mt-1 self-start`}>
                                        <View style={tw`flex-row items-center`}>
                                            <Calendar color="#888" size={14} style={tw`mr-1.5`} />
                                            <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>
                                                Est. {roadmapData.time}
                                            </Text>
                                        </View>
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
