import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { User, ChevronLeft } from 'lucide-react-native';

export default function PersonaScreen() {
    const router = useRouter();
    const [selected, setSelected] = useState<'Male' | 'Female' | 'Neutral' | null>(null);

    const handleContinue = () => {
        if (!selected) return;
        router.push('/(auth)/personalize');
    };

    return (
        <GlassBackground>
            <SafeAreaView style={tw`flex-1`}>
                {/* Back Button */}
                <View style={tw`px-4 pt-4`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`bg-white/10 p-2 rounded-full self-start`}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={tw`flex-1 px-6 pt-4`}>
                    <View style={tw`mb-10`}>
                        <Text style={tw`text-3xl text-white font-[InterTight-Bold] mb-2`}>Setup AI persona</Text>
                        <Text style={tw`text-gray-400 font-[InterTight] text-base`}>
                            Choose an avatar or voice you'd like to hear speak
                        </Text>
                    </View>

                    <View style={tw`flex-row justify-between mb-6`}>
                        <TouchableOpacity onPress={() => setSelected('Male')} activeOpacity={0.8} style={tw`flex-1 mr-2`}>
                            <GlassCard style={tw`items-center justify-center p-6 border ${selected === 'Male' ? 'border-accent-violet' : 'border-white/10'}`}>
                                <View style={tw`bg-white/10 p-4 rounded-full mb-4`}>
                                    <User color="#fff" size={32} />
                                </View>
                                <Text style={tw`text-white font-[InterTight] font-medium`}>Male</Text>
                            </GlassCard>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setSelected('Female')} activeOpacity={0.8} style={tw`flex-1 ml-2`}>
                            <GlassCard style={tw`items-center justify-center p-6 border ${selected === 'Female' ? 'border-accent-pink' : 'border-white/10'}`}>
                                <View style={tw`bg-white/10 p-4 rounded-full mb-4`}>
                                    <User color="#fff" size={32} />
                                </View>
                                <Text style={tw`text-white font-[InterTight] font-medium`}>Female</Text>
                            </GlassCard>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => setSelected('Neutral')} activeOpacity={0.8} style={tw`mb-10`}>
                        <GlassCard style={tw`items-center justify-center p-6 w-1/2 border ${selected === 'Neutral' ? 'border-accent-cyan' : 'border-white/10'}`}>
                            <View style={tw`bg-white/10 p-4 rounded-full mb-4`}>
                                <User color="#fff" size={32} />
                            </View>
                            <Text style={tw`text-white font-[InterTight] font-medium`}>Neutral</Text>
                        </GlassCard>
                    </TouchableOpacity>

                    <View style={tw`mt-auto pb-10`}>
                        <GlassButton
                            title="Continue"
                            onPress={handleContinue}
                            variant={selected ? 'primary' : 'secondary'}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}
