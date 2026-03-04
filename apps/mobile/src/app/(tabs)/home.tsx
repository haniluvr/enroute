import tw from '@/lib/tailwind';
import { View, Text, ScrollView } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useAuth } from '@/hooks/useAuth';
import { Bell, MapPin, Sparkles } from 'lucide-react-native';
import { Link } from 'expo-router';

// Dummy data for visual execution
const mockJobs = [
    { id: '1', title: 'Frontend Developer Intern', company: 'TechNova', matchScore: 94, salary: '$24/hr', distance: '10 miles', skills: ['React', 'TypeScript'] },
    { id: '2', title: 'UI/UX Design Intern', company: 'CreativePulse', matchScore: 88, salary: '$20/hr', distance: 'Remote', skills: ['Figma', 'Prototyping'] }
];

export default function HomeScreen() {
    const { user, isCounselor } = useAuth();

    // Fallback names for now since Firebase isn't live
    const displayName = user?.displayName || 'Isabella';

    return (
        <GlassBackground>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={tw`px-6 pt-16 pb-6 flex-row justify-between items-center`}>
                    <View>
                        <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm`}>Welcome back,</Text>
                        <Text style={tw`text-white font-[InterTight-Bold] text-3xl`}>{displayName}</Text>
                    </View>
                    <View style={tw`bg-white/10 p-3 rounded-full border border-white/20`}>
                        <Bell color="#fff" size={24} />
                    </View>
                </View>

                {/* Dahlia AI Quick Launch */}
                <View style={tw`px-6 mb-8`}>
                    <GlassCard intensity={80}>
                        <View style={tw`flex-row items-center mb-4`}>
                            <View style={tw`bg-accent-pink/20 p-2 rounded-full mr-3`}>
                                <Sparkles color="#ff007f" size={24} />
                            </View>
                            <Text style={tw`text-white font-[InterTight-Bold] text-xl`}>Ask Dahlia</Text>
                        </View>
                        <Text style={tw`text-gray-300 font-[InterTight-Regular] mb-4 leading-5`}>
                            Your AI mentor is ready. Review your latest mock-interview feedback or ask about the TechNova internship.
                        </Text>
                        <GlassButton
                            title="Chat with Dahlia"
                            onPress={() => console.log('Launch Dahlia')}
                            variant="primary"
                        />
                    </GlassCard>
                </View>

                {/* Top Matches Feed */}
                <View style={tw`px-6 mb-6`}>
                    <Text style={tw`text-white font-[InterTight-SemiBold] text-lg mb-4`}>Top Matches Today</Text>

                    {mockJobs.map((job) => (
                        <GlassCard key={job.id} style={tw`mb-4`}>
                            <View style={tw`flex-row justify-between items-start mb-2`}>
                                <Text style={tw`text-white font-[InterTight-Bold] text-lg flex-1 mr-2`}>{job.title}</Text>
                                <View style={tw`bg-accent-emerald/20 px-2 py-1 rounded-md`}>
                                    <Text style={tw`text-accent-emerald font-[InterTight-Bold] text-xs`}>{job.matchScore}% Match</Text>
                                </View>
                            </View>

                            <Text style={tw`text-accent-cyan font-[InterTight-Medium] text-sm mb-3`}>{job.company}</Text>

                            <View style={tw`flex-row items-center mb-4`}>
                                <MapPin color="#aaa" size={14} style={tw`mr-1`} />
                                <Text style={tw`text-gray-400 font-[InterTight-Regular] text-sm`}>{job.distance} away</Text>
                                <Text style={tw`text-gray-500 mx-2`}>•</Text>
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-sm`}>{job.salary}</Text>
                            </View>

                            <View style={tw`flex-row flex-wrap`}>
                                {job.skills.map((skill, idx) => (
                                    <View key={idx} style={tw`bg-white/10 px-3 py-1 rounded-full mr-2 mb-2`}>
                                        <Text style={tw`text-gray-300 text-xs font-[InterTight-Regular]`}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </GlassCard>
                    ))}
                </View>
            </ScrollView>
        </GlassBackground>
    );
}
