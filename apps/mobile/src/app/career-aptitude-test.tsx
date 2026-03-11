import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Animated } from 'react-native';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { CAREER_APTITUDE_QUESTIONS } from '@/data/career-aptitude-questions';

type ScreenState = 'intro' | 'quiz' | 'result';

export default function CareerAptitudeTestScreen() {
    const router = useRouter();
    const [screenState, setScreenState] = useState<ScreenState>('intro');
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    // Progress bar animation
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (screenState === 'quiz') {
            const progress = (currentStep + 1) / CAREER_APTITUDE_QUESTIONS.length;
            Animated.timing(progressAnim, {
                toValue: progress,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [currentStep, screenState]);

    const handleSelectOption = (questionId: number, option: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
    };

    const handleNext = () => {
        if (currentStep < CAREER_APTITUDE_QUESTIONS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setScreenState('result');
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            setScreenState('intro');
        }
    };

    const renderIntro = () => (
        <View style={tw`flex-1 px-6 justify-center items-center pb-20`}>
            <View style={tw`w-full max-w-sm`}>
                <View style={tw`items-center mb-10`}>
                    <Text style={tw`text-white font-[InterTight-Bold] text-4xl text-center mb-4 leading-[44px]`}>
                        Career Aptitude Test
                    </Text>
                    <Text style={tw`text-gray-400 font-[InterTight] text-lg text-center leading-7`}>
                        Discover your unique professional profile. This carefully designed assessment helps our AI match your work style, skills, and motivations with ideal career paths.
                    </Text>
                </View>

                <View style={tw`bg-white/5 border border-white/10 rounded-3xl p-6 mb-10`}>
                    <View style={tw`flex-row items-center mb-4`}>
                        <View style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-4`}>
                            <Text style={tw`text-white font-[InterTight-Bold]`}>20</Text>
                        </View>
                        <Text style={tw`text-white text-base font-[InterTight-Medium]`}>Detailed questions</Text>
                    </View>
                    <View style={tw`flex-row items-center mb-4`}>
                        <View style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-4`}>
                            <Text style={tw`text-white font-[InterTight-Bold]`}>4</Text>
                        </View>
                        <Text style={tw`text-white text-base font-[InterTight-Medium]`}>Core focus areas</Text>
                    </View>
                    <View style={tw`flex-row items-center`}>
                        <View style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-4`}>
                            <Text style={tw`text-white font-[InterTight-Bold]`}>5</Text>
                        </View>
                        <Text style={tw`text-white text-base font-[InterTight-Medium]`}>Minutes to complete</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={tw`w-full bg-white py-4 rounded-full items-center shadow-lg`}
                    activeOpacity={0.8}
                    onPress={() => setScreenState('quiz')}
                >
                    <Text style={tw`text-black text-lg font-[InterTight-Bold]`}>
                        Start Now
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderQuiz = () => {
        const question = CAREER_APTITUDE_QUESTIONS[currentStep];
        const isAnswered = !!answers[question.id];

        const progressWidth = progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%']
        });

        return (
            <View style={tw`flex-1`}>
                {/* Header & Progress */}
                <View style={tw`px-6 pt-2 pb-6`}>
                    <View style={tw`flex-row items-center justify-between mb-6`}>
                        <TouchableOpacity
                            onPress={handleBack}
                            style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center`}
                        >
                            <ChevronLeft color="#ffffff" size={24} />
                        </TouchableOpacity>
                        <Text style={tw`text-white/60 font-[InterTight-Medium] text-sm`}>
                            {currentStep + 1} of {CAREER_APTITUDE_QUESTIONS.length}
                        </Text>
                        {/* Placeholder for symmetry */}
                        <View style={tw`w-10 h-10`} />
                    </View>

                    <View style={tw`w-full h-1.5 bg-white/10 rounded-full overflow-hidden`}>
                        <Animated.View style={[tw`h-full bg-white rounded-full`, { width: progressWidth }]} />
                    </View>
                </View>

                {/* Content */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={tw`px-6 pb-32`}
                >
                    <View style={tw`mb-8`}>
                        <Text style={tw`text-accent-violet/80 font-[InterTight-Bold] text-sm tracking-widest uppercase mb-3`}>
                            {question.section}
                        </Text>
                        <Text style={tw`text-white font-[InterTight-Bold] text-2xl leading-9`}>
                            {question.question}
                        </Text>
                    </View>

                    <View style={tw`gap-3`}>
                        {question.options.map((option) => {
                            const isSelected = answers[question.id] === option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => handleSelectOption(question.id, option)}
                                    activeOpacity={0.7}
                                    style={[
                                        tw`flex-row items-center justify-between p-5 rounded-2xl border`,
                                        isSelected
                                            ? tw`bg-white/15 border-white/40 shadow-sm`
                                            : tw`bg-white/5 border-white/10`
                                    ]}
                                >
                                    <Text style={[
                                        tw`font-[InterTight] text-base flex-1 leading-6`,
                                        isSelected ? tw`text-white font-semibold` : tw`text-gray-300`
                                    ]}>
                                        {option}
                                    </Text>
                                    {isSelected && (
                                        <View style={tw`ml-3`}>
                                            <CheckCircle2 size={22} color="#ffffff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Footer fixed next button */}
                <View style={tw`absolute bottom-0 left-0 right-0 p-6 pt-4 border-t border-white/5 bg-[#0a0a0a]/90`}>
                    <TouchableOpacity
                        disabled={!isAnswered}
                        style={[
                            tw`w-full py-4 rounded-full items-center shadow-lg`,
                            isAnswered ? tw`bg-white` : tw`bg-white/10`
                        ]}
                        activeOpacity={0.8}
                        onPress={handleNext}
                    >
                        <Text style={[
                            tw`text-lg font-[InterTight-Bold]`,
                            isAnswered ? tw`text-black` : tw`text-white/30`
                        ]}>
                            {currentStep === CAREER_APTITUDE_QUESTIONS.length - 1 ? 'Complete Test' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderResult = () => (
        <View style={tw`flex-1 px-6 justify-center items-center pb-20`}>
            <View style={tw`w-20 h-20 rounded-full bg-white/10 items-center justify-center mb-8 border border-white/20`}>
                <CheckCircle2 size={40} color="#ffffff" />
            </View>
            <Text style={tw`text-white font-[InterTight-Bold] text-3xl text-center mb-4`}>
                Test Completed!
            </Text>
            <Text style={tw`text-gray-400 font-[InterTight] text-base text-center leading-6 mb-12 px-4`}>
                Our AI is currently analyzing your professional profile based on your answers to find the perfect career matches.
            </Text>

            <TouchableOpacity
                style={tw`w-full bg-white py-4 rounded-full items-center max-w-sm`}
                activeOpacity={0.8}
                onPress={() => router.replace('/(tabs)/home')}
            >
                <Text style={tw`text-black text-lg font-[InterTight-Bold]`}>
                    Return to Home
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <SafeAreaView style={tw`flex-1`}>
                {screenState === 'intro' && (
                    <View style={tw`px-6 pt-4`}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center`}
                        >
                            <ChevronLeft color="#ffffff" size={24} />
                        </TouchableOpacity>
                    </View>
                )}

                {screenState === 'intro' && renderIntro()}
                {screenState === 'quiz' && renderQuiz()}
                {screenState === 'result' && renderResult()}

            </SafeAreaView>
        </GlassBackground>
    );
}
