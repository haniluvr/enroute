import tw from '@/lib/tailwind';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Mic,
    Square,
    RotateCcw,
    Sparkles,
    Save,
    Clock,
    MoreVertical,
    Play
} from 'lucide-react-native';
import { useState, useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    FadeIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type FlowState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'REPLY';

export default function RecordIdeaScreen() {
    const router = useRouter();
    const [state, setState] = useState<FlowState>('IDLE');
    const [seconds, setSeconds] = useState(0);

    // Pulse animation for recording
    const pulse = useSharedValue(1);

    useEffect(() => {
        if (state === 'RECORDING') {
            pulse.value = withRepeat(
                withTiming(1.5, { duration: 1000 }),
                -1,
                true
            );

            const interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
            return () => {
                clearInterval(interval);
                pulse.value = 1;
            };
        }
    }, [state]);

    // Mock processing timer
    useEffect(() => {
        if (state === 'PROCESSING') {
            const timer = setTimeout(() => {
                setState('REPLY');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [state]);

    const animatedPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: 0.5 - (pulse.value - 1) * 0.5,
    }));

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderHeader = (title: string, subtitle: string) => (
        <View style={tw`px-6 pt-16 pb-6`}>
            <TouchableOpacity
                onPress={() => state === 'IDLE' ? router.back() : setState('IDLE')}
                style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mb-6`}
            >
                <ChevronLeft color="#ffffff" size={24} />
            </TouchableOpacity>
            <Text style={tw`text-white font-[InterTight-Bold] text-2xl mb-1`}>{title}</Text>
            <Text style={tw`text-gray-400 font-[InterTight] text-[15px]`}>{subtitle}</Text>
        </View>
    );

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <ScrollView
                style={tw`flex-1`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-32`}
            >
                {state === 'IDLE' && renderHeader("Record Idea", "Transcribe and summarize your thoughts.")}
                {state === 'RECORDING' && renderHeader("Recording...", "Capturing your career ideas.")}
                {state === 'PROCESSING' && renderHeader("Processing", "Generating AI summary...")}
                {state === 'REPLY' && renderHeader("AI Summary", "Here's the takeaway from your recording.")}

                <View style={tw`px-6 items-center`}>
                    {/* Interaction Visual Area */}
                    <View style={tw`h-80 w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-12 justify-center items-center`}>
                        {state === 'IDLE' && (
                            <TouchableOpacity
                                onPress={() => { setSeconds(0); setState('RECORDING'); }}
                                style={tw`w-24 h-24 rounded-full bg-accent-violet items-center justify-center shadow-2xl shadow-accent-violet`}
                            >
                                <Mic color="#fff" size={40} />
                            </TouchableOpacity>
                        )}

                        {state === 'RECORDING' && (
                            <View style={tw`items-center justify-center`}>
                                <Animated.View style={[tw`absolute w-32 h-32 rounded-full bg-accent-violet/30`, animatedPulseStyle]} />
                                <TouchableOpacity
                                    onPress={() => setState('PROCESSING')}
                                    style={tw`w-24 h-24 rounded-full bg-accent-violet items-center justify-center z-10`}
                                >
                                    <Square color="#fff" size={32} fill="#fff" />
                                </TouchableOpacity>
                                <Text style={tw`text-white font-[InterTight-Medium] text-2xl mt-8`}>{formatTime(seconds)}</Text>
                            </View>
                        )}

                        {state === 'PROCESSING' && (
                            <View style={tw`items-center`}>
                                <ActivityIndicator color="#8b5cf6" size="large" />
                                <Text style={tw`text-gray-400 font-[InterTight] mt-6`}>AI is analyzing your voice...</Text>
                            </View>
                        )}

                        {state === 'REPLY' && (
                            <View style={tw`w-full h-full p-6 justify-center`}>
                                <View style={tw`flex-row items-center mb-4`}>
                                    <View style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-3`}>
                                        <Play color="#fff" size={16} fill="#fff" />
                                    </View>
                                    <View style={tw`flex-1 h-1 bg-white/10 rounded-full overflow-hidden`}>
                                        <View style={tw`w-1/3 h-full bg-white`} />
                                    </View>
                                    <Text style={tw`text-gray-400 text-xs ml-3`}>{formatTime(seconds)}</Text>
                                </View>
                                <View style={tw`bg-white/5 border border-white/10 rounded-2xl p-4`}>
                                    <View style={tw`flex-row justify-between items-center mb-3`}>
                                        <View style={tw`flex-row items-center`}>
                                            <Sparkles color="#8b5cf6" size={16} style={tw`mr-2`} />
                                            <Text style={tw`text-accent-violet font-[InterTight-SemiBold]`}>Key Insights</Text>
                                        </View>
                                        <TouchableOpacity>
                                            <MoreVertical color="#fff" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={tw`text-white font-[InterTight] leading-5 text-[15px]`}>
                                        You discussed your interest in transitioning to UI engineering. Key points include your background in API integration and your goal to master Framer Motion for premium animations.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Footer State UI */}
                    {state === 'IDLE' && (
                        <View style={tw`items-center`}>
                            <Text style={tw`text-white font-[InterTight-Medium] text-lg mb-2`}>Tap to start recording</Text>
                            <Text style={tw`text-gray-400 font-[InterTight] text-center px-4`}>
                                Describe your career thoughts, interview answers, or random ideas. We'll transcribe and summarize it for your library.
                            </Text>
                        </View>
                    )}

                    {state === 'RECORDING' && (
                        <TouchableOpacity
                            onPress={() => { setState('IDLE'); setSeconds(0); }}
                            style={tw`flex-row items-center bg-white/5 border border-white/10 px-6 py-3 rounded-full`}
                        >
                            <RotateCcw color="#fff" size={18} style={tw`mr-2`} />
                            <Text style={tw`text-white font-[InterTight-Medium]`}>Reset & Restart</Text>
                        </TouchableOpacity>
                    )}

                    {state === 'REPLY' && (
                        <View style={tw`w-full gap-4`}>
                            <View style={tw`bg-white/5 border-l-4 border-accent-violet p-4 rounded-r-2xl`}>
                                <Text style={tw`text-gray-300 font-[InterTight] text-sm`}>
                                    "I want to focus more on mobile animations and premium UI interactions..."
                                </Text>
                            </View>

                            <View style={tw`flex-row space-x-3 mt-4`}>
                                <TouchableOpacity
                                    style={tw`flex-1 bg-white py-4 rounded-full items-center justify-center flex-row shadow-xl`}
                                >
                                    <Save color="#000" size={18} style={tw`mr-2`} />
                                    <Text style={tw`text-black text-lg font-[InterTight-SemiBold]`}>Save Note</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setState('IDLE')}
                                    style={tw`w-14 h-14 bg-white/10 border border-white/20 rounded-full items-center justify-center`}
                                >
                                    <RotateCcw color="#fff" size={24} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={tw`absolute bottom-0 left-0 right-0 px-6 pb-12 pt-4 bg-transparent`}>
                {state === 'IDLE' && (
                    <View style={tw`w-full h-1 bg-white/5 rounded-full`} />
                )}
            </View>
        </GlassBackground>
    );
}

const styles = StyleSheet.create({
    // Add specific styles if needed
});
