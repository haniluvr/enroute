import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { User, ChevronLeft, Volume2, Activity } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AI_API } from '@/config/backend';

export default function PersonaScreen() {
    const router = useRouter();
    const [selected, setSelected] = useState<'Male' | 'Female' | 'Neutral' | null>(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const soundRef = useRef<Audio.Sound | null>(null);

    const playVoicePreview = async (personaType: 'Male' | 'Female' | 'Neutral') => {
        try {
            // Stop existing sound
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            setIsPlayingPreview(true);

            // Select voice and text based on persona
            let voice = 'af_bella';
            let text = "Hi, I'm your neutral AI coach. I'm here to support your career journey.";
            
            if (personaType === 'Male') {
                voice = 'am_michael';
                text = "Hello, I'm Alex. I specialize in tech career growth and direct feedback.";
            } else if (personaType === 'Female') {
                voice = 'af_sarah';
                text = "Greetings, I'm Susan. I'll help you plan your career moves with strategic precision.";
            }

            console.log(`[Persona] Fetching TTS for: ${voice}`);
            const response = await fetch(AI_API.TTS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice })
            });

            if (!response.ok) throw new Error('TTS request failed');

            const data = await response.json();
            if (!data.audioUri) throw new Error('No audio returned');

            const base64Data = data.audioUri.replace(/^data:audio\/mpeg;base64,/, '');
            const tempPath = `${FileSystem.cacheDirectory}persona_preview_${Date.now()}.mp3`;
            await FileSystem.writeAsStringAsync(tempPath, base64Data, { encoding: FileSystem.EncodingType.Base64 });

            const { sound } = await Audio.Sound.createAsync(
                { uri: tempPath }, 
                { shouldPlay: true, playsInSilentModeIOS: true }
            );
            soundRef.current = sound;
            
            sound.setOnPlaybackStatusUpdate(async (status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlayingPreview(false);
                    await sound.unloadAsync();
                    soundRef.current = null;
                    await FileSystem.deleteAsync(tempPath, { idempotent: true });
                }
            });
        } catch (error) {
            console.error('TTS Preview Error:', error);
            setIsPlayingPreview(false);
        }
    };

    const handleSelect = (type: 'Male' | 'Female' | 'Neutral') => {
        setSelected(type);
        playVoicePreview(type);
    };

    const handleContinue = () => {
        if (!selected) return;
        router.push('/(auth)/personalize');
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
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
                        <TouchableOpacity onPress={() => handleSelect('Male')} activeOpacity={0.8} style={tw`flex-1 mr-2`}>
                            <GlassCard style={tw`items-center justify-center p-6 border ${selected === 'Male' ? 'border-accent-violet' : 'border-white/10'}`}>
                                <View style={tw`bg-white/10 p-4 rounded-full mb-4`}>
                                    {selected === 'Male' && isPlayingPreview ? (
                                        <Activity color="#fff" size={32} />
                                    ) : (
                                        <Volume2 color="#fff" size={32} />
                                    )}
                                </View>
                                <Text style={tw`text-white font-[InterTight] font-medium`}>Male</Text>
                            </GlassCard>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleSelect('Female')} activeOpacity={0.8} style={tw`flex-1 ml-2`}>
                            <GlassCard style={tw`items-center justify-center p-6 border ${selected === 'Female' ? 'border-accent-pink' : 'border-white/10'}`}>
                                <View style={tw`bg-white/10 p-4 rounded-full mb-4`}>
                                    {selected === 'Female' && isPlayingPreview ? (
                                        <Activity color="#fff" size={32} />
                                    ) : (
                                        <Volume2 color="#fff" size={32} />
                                    )}
                                </View>
                                <Text style={tw`text-white font-[InterTight] font-medium`}>Female</Text>
                            </GlassCard>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => handleSelect('Neutral')} activeOpacity={0.8} style={tw`mb-10`}>
                        <GlassCard style={tw`items-center justify-center p-6 w-1/2 border ${selected === 'Neutral' ? 'border-accent-cyan' : 'border-white/10'}`}>
                            <View style={tw`bg-white/10 p-4 rounded-full mb-4`}>
                                {selected === 'Neutral' && isPlayingPreview ? (
                                    <Activity color="#fff" size={32} />
                                ) : (
                                    <Volume2 color="#fff" size={32} />
                                )}
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
