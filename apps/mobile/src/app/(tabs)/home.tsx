import { View, Text, ScrollView } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useAuth } from '@/hooks/useAuth';
import { Bell, MapPin, Sparkles } from 'lucide-react-native';
import { mockJobs } from '@/config/dummyData';
import { Link } from 'expo-router';

export default function HomeScreen() {
    const { user } = useAuth();
    // Using dummy name for now since auth state is a placeholder
    const displayName = "Isabella";

    return (
        <GlassBackground>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

                {/* Header Section */}
                <View className="px-6 pt-16 pb-6 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-400 font-inter-medium text-sm">Welcome back,</Text>
                        <Text className="text-white font-inter-bold text-3xl">{displayName}</Text>
                    </View>
                    <View className="bg-white/10 p-3 rounded-full border border-white/20">
                        <Bell color="#fff" size={24} />
                    </View>
                </View>

                {/* Dahlia Mentor Quick Action */}
                <View className="px-6 mb-8">
                    <GlassCard style={{ borderColor: 'rgba(255, 0, 127, 0.4)' }}>
                        <View className="flex-row items-center mb-4">
                            <View className="bg-accent-pink/20 p-2 rounded-full mr-3">
                                <Sparkles color="#ff007f" size={22} />
                            </View>
                            <Text className="text-white font-inter-bold text-xl">Ask Dahlia</Text>
                        </View>
                        <Text className="text-gray-300 font-inter mb-4 leading-5">
                            I noticed you completed an AWS networking course yesterday. Should we look for Cloud roles to match?
                        </Text>
                        <Link href="/(tabs)/discover" asChild>
                            <GlassButton title="Start Voice Chat" onPress={() => { }} fullWidth={false} />
                        </Link>
                    </GlassCard>
                </View>

                {/* Current Job Matches Preview */}
                <View className="px-6 mb-6">
                    <Text className="text-white font-inter-semibold text-lg mb-4">Top Matches Today</Text>

                    {mockJobs.slice(0, 2).map((job) => (
                        <GlassCard key={job.id} className="mb-4">
                            <View className="flex-row justify-between items-start mb-2">
                                <Text className="text-white font-inter-bold text-lg flex-1 mr-2">{job.title}</Text>
                                <View className="bg-accent-emerald/20 px-2 py-1 rounded-md">
                                    <Text className="text-accent-emerald font-inter-bold text-xs">{job.matchScore}% Match</Text>
                                </View>
                            </View>

                            <Text className="text-accent-cyan font-inter-medium text-sm mb-3">{job.company}</Text>

                            <View className="flex-row items-center mb-4">
                                <MapPin color="#aaa" size={14} className="mr-1" />
                                <Text className="text-gray-400 font-inter text-sm">{job.distance} away</Text>
                                <Text className="text-gray-500 mx-2">•</Text>
                                <Text className="text-white font-inter-semibold text-sm">{job.salary}</Text>
                            </View>

                            <View className="flex-row flex-wrap">
                                {job.skills.map((skill, idx) => (
                                    <View key={idx} className="bg-white/10 px-3 py-1 rounded-full mr-2 mb-2">
                                        <Text className="text-gray-300 text-xs font-inter">{skill}</Text>
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
