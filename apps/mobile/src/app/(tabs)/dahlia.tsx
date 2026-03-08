import tw from '@/lib/tailwind';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, Modal, Platform, PanResponder, Dimensions } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import {
    Sparkles,
    Search,
    ChevronLeft,
    ChevronUp,
    ChevronDown,
    Settings,
    Mic,
    Type,
    UserCheck,
    Edit3,
    Trash2,
    Calendar,
    Clock,
    FileText,
    MoreVertical,
    Paperclip,
    PhoneOff,
    RotateCcw,
    Send,
    Share2,
    X,
    Bookmark
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { PERSONAS, Persona, MOCK_INSIGHTS, MOCK_QUOTES, MOCK_TRANSCRIPTION } from '@/data/dahliaData';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

type ViewState = 'selection' | 'active_call' | 'summary';
type CallMode = 'voice' | 'text';

export default function DahliaScreen() {
    const { q } = useLocalSearchParams<{ q: string }>();
    const router = useRouter();
    const navigation = useNavigation();
    const [viewState, setViewState] = useState<ViewState>('selection');
    const [callMode, setCallMode] = useState<CallMode>('voice');
    const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
    const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [callDuration, setCallDuration] = useState(0); // in seconds
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showTranscriptionOptions, setShowTranscriptionOptions] = useState(false);
    const [showTextSettings, setShowTextSettings] = useState(false);
    const [transcriptionFont, setTranscriptionFont] = useState('InterTight');
    const [transcriptionFontSize, setTranscriptionFontSize] = useState(15);

    // Advanced UI States
    const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [notes, setNotes] = useState([
        { id: 1, title: 'Salary', content: 'Product managers are very high in demand in todays..', time: '2:31 PM' },
        { id: 2, title: 'Skills to learn', content: 'Focus on communication and technical understanding..', time: '2:32 PM' }
    ]);
    const [noteInput, setNoteInput] = useState('');
    const windowHeight = Dimensions.get('window').height;
    const notesHeight = useRef(new Animated.Value(windowHeight * 0.3)).current;
    const notesBaseHeight = useRef(windowHeight * 0.3);

    // Pulsing animation for voice mode
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const formatDurationLabel = (seconds: number) => {
        if (seconds >= 3600) {
            const hours = Math.floor(seconds / 3600);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
        } else if (seconds >= 60) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
        } else {
            return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
        }
    };

    useEffect(() => {
        if (viewState === 'active_call' && callMode === 'voice') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [viewState, callMode]);

    // Timer for call duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (viewState === 'active_call' && isTimerRunning) {
            interval = setInterval(() => {
                setCallDuration(prev => {
                    if (prev >= 7200) { // 2 hours limit
                        setIsTimerRunning(false);
                        setShowSaveModal(true);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [viewState, isTimerRunning]);

    useEffect(() => {
        if (viewState === 'active_call') {
            setIsTimerRunning(true);
        }
    }, [viewState]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const notesPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                const newHeight = Math.max(windowHeight * 0.2, Math.min(windowHeight * 0.8, notesBaseHeight.current - gestureState.dy));
                notesHeight.setValue(newHeight);
            },
            onPanResponderRelease: (_, gestureState) => {
                const finalHeight = notesBaseHeight.current - gestureState.dy;
                const snapPoints = [windowHeight * 0.3, windowHeight * 0.5, windowHeight * 0.7];
                const closest = snapPoints.reduce((prev, curr) =>
                    Math.abs(curr - finalHeight) < Math.abs(prev - finalHeight) ? curr : prev
                );

                Animated.spring(notesHeight, {
                    toValue: closest,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 7,
                }).start(() => {
                    notesBaseHeight.current = closest;
                });
            }
        })
    ).current;

    const renderPersonaIcon = (persona: Persona, size: number = 60) => {
        const color = persona.icon === 'neutral' ? '#FFD700' : persona.icon === 'male' ? '#4169E1' : '#FF69B4';
        return (
            <View style={[tw`rounded-full items-center justify-center bg-white/10`, { width: size, height: size }]}>
                <View style={[tw`rounded-full`, { width: size * 0.7, height: size * 0.7, backgroundColor: color }]} />
            </View>
        );
    };

    const renderCoachCard = (persona: Persona, isMain: boolean = false) => {
        const isSelected = selectedPersona.id === persona.id;
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPersona(persona)}
                style={isMain ? tw`mb-6` : tw`mr-4 w-64`}
            >
                <GlassCard style={tw`${isSelected ? 'border-accent-teal/50 bg-accent-teal/10' : 'border-white/10 bg-white/5'} p-5`} noPadding>
                    <View style={tw`flex-row justify-between items-start mb-4`}>
                        {renderPersonaIcon(persona, 50)}
                        <View style={tw`bg-[#3D3A2C] px-3 py-1.5 rounded-full border border-[#6B6330] self-start`}>
                            <Text style={tw`text-[#EEDF7A] font-[InterTight] font-medium text-xs`}>{persona.type}</Text>
                        </View>
                    </View>
                    <Text style={tw`text-white font-[InterTight] font-bold text-xl mb-1`}>{persona.name}</Text>
                    <Text style={tw`text-gray-300 font-[InterTight] text-lg mb-2`}>{persona.specialization}</Text>
                    {isMain && (
                        <Text style={tw`text-gray-400 font-[InterTight] text-base leading-4`} numberOfLines={2}>
                            {persona.description}
                        </Text>
                    )}
                    {isMain && isSelected && (
                        <View style={tw`flex-row items-center mt-4`}>
                            <UserCheck color="#2b4e50" size={14} style={tw`mr-1`} />
                            <Text style={tw`text-[#2b4e50] font-[InterTight] font-medium text-sm capitalize`}>Current coach</Text>
                        </View>
                    )}
                </GlassCard>
            </TouchableOpacity>
        );
    };

    const renderSelectionView = () => (
        <ScrollView style={tw`flex-1 pt-16`} scrollEnabled={false}>
            <View style={tw``}>
                <TouchableOpacity onPress={() => router.back()} style={tw`mb-6`}>
                    <View style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10 w-11 h-11 items-center justify-center ml-6`}>
                        <ChevronLeft color="#aaa" size={24} />
                    </View>
                </TouchableOpacity>

                <Text style={tw`text-white font-[InterTight] font-semibold text-3xl mb-1 px-6`}>Choose your career coach</Text>
                <Text style={tw`text-gray-400 font-[InterTight] text-lg mb-6 px-6`}>Who do you want to talk to today?</Text>

                <View style={tw`px-6`}>
                    {renderCoachCard(selectedPersona, true)}
                </View>

                <Text style={tw`text-gray-300 font-[InterTight] font-medium text-xl mb-4 px-6`}>Other coaches</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4 pl-6`}>
                    {PERSONAS.filter(p => p.id !== selectedPersona.id).map(persona => (
                        <View key={persona.id}>
                            {renderCoachCard(persona)}
                        </View>
                    ))}
                </ScrollView>
            </View>

            <View style={tw`px-6 mb-20`}>
                <TouchableOpacity
                    onPress={() => setViewState('active_call')}
                    style={tw`bg-white rounded-full py-4 items-center justify-center shadow-lg w-full`}
                >
                    <Text style={tw`text-black font-[InterTight] font-semibold text-lg`}>Start call with {selectedPersona.name}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderActiveCallView = () => (
        <View style={tw`flex-1 pt-12`}>
            {/* Header */}
            <View style={tw`flex-row justify-between items-center px-6 mb-8`}>
                <TouchableOpacity
                    onPress={() => {
                        if (callMode === 'voice') {
                            setTranscriptionEnabled(!transcriptionEnabled);
                        }
                    }}
                    style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10 ${callMode === 'text' ? 'opacity-30' : ''}`}
                    activeOpacity={0.7}
                    disabled={callMode === 'text'}
                >
                    <Sparkles color={transcriptionEnabled ? "#fcfcfc" : "#aaa"} size={22} />
                </TouchableOpacity>

                <View style={tw`items-center`}>
                    <Text style={tw`text-white font-[InterTight] font-bold text-xl`}>{selectedPersona.name}</Text>
                    <Text style={tw`text-gray-400 font-[InterTight] text-base`}>{formatDuration(callDuration)}</Text>
                </View>

                <TouchableOpacity
                    onPress={() => setShowSettings(true)}
                    style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10`}
                    activeOpacity={0.7}
                >
                    <Settings color="#aaa" size={22} />
                </TouchableOpacity>
            </View>

            {/* Toggle Switch */}
            <View style={tw`flex-row bg-white/5 rounded-2xl mx-6 mb-4 p-1`}>
                <TouchableOpacity
                    onPress={() => setCallMode('voice')}
                    style={tw`flex-1 py-3 rounded-xl items-center ${callMode === 'voice' ? 'bg-white/10 border border-white/10' : ''}`}
                >
                    <Text style={tw`text-white font-[InterTight] font-medium`}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        setCallMode('text');
                        setTranscriptionEnabled(false);
                    }}
                    style={tw`flex-1 py-3 rounded-xl items-center ${callMode === 'text' ? 'bg-white/10 border border-white/10' : ''}`}
                >
                    <Text style={tw`text-white font-[InterTight] font-medium`}>Text</Text>
                </TouchableOpacity>
            </View>

            {callMode === 'voice' ? (
                <View style={tw`flex-1 px-6`}>
                    <View style={tw`${transcriptionEnabled ? 'h-[46%]' : 'flex-1'} mb-5 items-center justify-center`}>
                        <GlassCard style={tw`w-full h-full rounded-[40px] bg-white/5 border-white/10 items-center justify-center`} noPadding>
                            <Animated.View style={[
                                tw`rounded-full bg-white/5 items-center justify-center`,
                                {
                                    width: 160,
                                    height: 160,
                                    transform: [{ scale: pulseAnim }],
                                    shadowColor: '#fff',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 15,
                                }
                            ]}>
                                {renderPersonaIcon(selectedPersona, 100)}
                            </Animated.View>
                        </GlassCard>
                    </View>

                    {transcriptionEnabled && (
                        <View style={tw`h-[47%] mb-5`}>
                            <GlassCard style={tw`flex-1 p-6 bg-white/5 border-t border-white/10 rounded-[40px]`} noPadding>
                                <View style={tw`flex-row justify-between items-center mb-4`}>
                                    <View style={tw`flex-row items-center`}>
                                        <Sparkles color="#fcfcfc" size={16} style={tw`mr-2`} />
                                        <Text style={tw`text-gray-300 font-[InterTight] font-medium text-sm`}>Transcription enabled</Text>
                                    </View>
                                    <View style={tw`items-center`}>
                                        <TouchableOpacity
                                            onPress={() => setShowTranscriptionOptions(!showTranscriptionOptions)}
                                            style={tw`w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10`}
                                        >
                                            <MoreVertical color={showTranscriptionOptions ? "#fff" : "#888"} size={18} />
                                        </TouchableOpacity>

                                        {showTranscriptionOptions && (
                                            <Animated.View style={tw`absolute top-12 items-center gap-2 z-50`}>
                                                <TouchableOpacity
                                                    style={tw`w-10 h-10 items-center justify-center rounded-full bg-[#1C1C1E] border border-white/10 shadow-2xl`}
                                                    onPress={() => {
                                                        setShowTextSettings(true);
                                                        setShowTranscriptionOptions(false);
                                                    }}
                                                >
                                                    <Type color="#fff" size={18} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={tw`w-10 h-10 items-center justify-center rounded-full bg-[#1C1C1E] border border-white/10 shadow-2xl`}
                                                    onPress={() => setShowTranscriptionOptions(false)}
                                                >
                                                    <X color="#fff" size={18} />
                                                </TouchableOpacity>
                                            </Animated.View>
                                        )}
                                    </View>
                                </View>
                                <Text style={tw`text-gray-400 font-[InterTight] font-bold text-xs mb-2 uppercase tracking-widest`}>YOU:</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <Text style={[
                                        tw`text-white leading-6`,
                                        { fontFamily: transcriptionFont, fontSize: transcriptionFontSize }
                                    ]}>
                                        {MOCK_TRANSCRIPTION}
                                    </Text>
                                </ScrollView>
                            </GlassCard>
                        </View>
                    )}
                </View>
            ) : (
                <View style={tw`flex-1 px-6 pb-6`}>
                    <GlassCard style={tw`flex-1 p-4 bg-white/5 border-white/10 rounded-[40px] overflow-hidden`} noPadding>
                        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-4`}>
                            <View style={tw`flex-row mb-6`}>
                                {renderPersonaIcon(selectedPersona, 36)}
                                <View style={tw`ml-3 flex-1`}>
                                    <View style={tw`bg-white/10 rounded-2xl p-4 self-start max-w-[90%] border border-white/5`}>
                                        <Text style={tw`text-white font-[InterTight] leading-5`}>
                                            Hello! I'm here to help you with your career goals. What would you like to discuss today?
                                        </Text>
                                    </View>
                                    <Text style={tw`text-gray-500 text-[10px] mt-1 ml-1`}>10:34 AM</Text>
                                </View>
                            </View>

                            <View style={tw`items-end mb-6`}>
                                <View style={tw`bg-[#2b4e50] rounded-2xl p-4 max-w-[80%]`}>
                                    <Text style={tw`text-white font-[InterTight] leading-5`}>
                                        {MOCK_TRANSCRIPTION}
                                    </Text>
                                </View>
                                <Text style={tw`text-gray-500 text-[10px] mt-1 mr-1`}>10:35 AM</Text>
                            </View>
                        </ScrollView>

                        {/* Chat Input Inside Card */}
                        <View style={tw`flex-row items-center bg-white/5 rounded-full p-2 border border-white/10`}>
                            <TouchableOpacity style={tw`p-2`}>
                                <Paperclip color="#aaa" size={20} />
                            </TouchableOpacity>
                            <TextInput
                                placeholder="Type a message..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                style={tw`flex-1 text-white font-[InterTight] px-2 py-3`}
                            />
                            <TouchableOpacity style={tw`bg-white w-10 h-10 rounded-full items-center justify-center ml-2`}>
                                <Send color="#000" size={18} />
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </View>
            )}

            {/* Bottom Nav */}
            <View style={tw`px-6 pb-10 items-center`}>
                <View style={tw`flex-row items-center bg-white/10 rounded-full border border-white/15 p-1.5 self-center`}>
                    <TouchableOpacity style={tw`flex-row items-center bg-white/5 pl-5 pr-4 py-3.5 rounded-full border border-white/10`}>
                        <Mic color="#fff" size={20} style={tw`mr-2.5`} />
                        <Text style={tw`text-white font-[InterTight] font-semibold text-base pr-2`}>Tap to speak</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowNotes(true)}
                        style={tw`w-11 h-11 rounded-full items-center justify-center ml-1`}
                    >
                        <FileText color="#fff" size={22} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setIsTimerRunning(false);
                            setShowSaveModal(true);
                        }}
                        style={tw`bg-red-500/90 w-11 h-11 rounded-full items-center justify-center shadow-lg shadow-red-500/30 ml-1`}
                    >
                        <PhoneOff color="#fff" size={18} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderSummaryView = () => (
        <ScrollView style={tw`flex-1 pt-16 px-6`} showsVerticalScrollIndicator={false}>
            <View style={tw`flex-row justify-between items-center mb-8`}>
                <TouchableOpacity onPress={() => setViewState('selection')}>
                    <View style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10 w-11 h-11 items-center justify-center`}>
                        <ChevronLeft color="#aaa" size={24} />
                    </View>
                </TouchableOpacity>
                <Text style={tw`text-white font-[InterTight-Bold] text-2xl`}>Call summary</Text>
                <TouchableOpacity style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10 w-11 h-11 items-center justify-center`}>
                    <FileText color="#aaa" size={22} />
                </TouchableOpacity>
            </View>

            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-[20px] mb-4`}>Key Insights</Text>
            <GlassCard style={tw`p-6 bg-white/5 border border-white/10 mb-8`} noPadding>
                <Text style={tw`text-gray-500 font-[InterTight] font-bold text-sm mb-4 uppercase tracking-widest`}>AI generated:</Text>
                {MOCK_INSIGHTS.map((insight, i) => (
                    <View key={i} style={tw`flex-row items-center mb-3`}>
                        <View style={tw`w-1.5 h-1.5 bg-white rounded-full mr-3`} />
                        <Text style={tw`text-gray-200 font-[InterTight] font-light text-base`}>{insight}</Text>
                    </View>
                ))}
            </GlassCard>

            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-[20px] mb-4`}>Key Quotes</Text>
            {MOCK_QUOTES.map((quote, i) => (
                <GlassCard key={i} style={tw`p-5 bg-white/5 border border-white/10 mb-4`} noPadding>
                    <View style={tw`flex-row`}>
                        <View style={tw`w-1.5 h-1.5 bg-white rounded-full mr-3 mt-2`} />
                        <Text style={tw`text-gray-200 font-[InterTight] font-light text-base leading-5 flex-1`}>
                            {quote}
                        </Text>
                    </View>
                </GlassCard>
            ))}

            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-[20px] mt-4 mb-4`}>Actions</Text>
            <View style={tw`mb-20`}>
                <TouchableOpacity style={tw`flex-row items-center justify-center border border-white/10 rounded-full py-4 px-6 mb-3`}>
                    <Bookmark color="#aaa" size={20} style={tw`mr-4`} />
                    <Text style={tw`text-gray-300 font-[InterTight] font-medium text-lg`}>See full transcript</Text>
                </TouchableOpacity>
                <TouchableOpacity style={tw`flex-row items-center justify-center border border-white/10 rounded-full py-4 px-6 mb-3`}>
                    <Share2 color="#aaa" size={20} style={tw`mr-4`} />
                    <Text style={tw`text-gray-300 font-[InterTight] font-medium text-lg`}>Export highlights</Text>
                </TouchableOpacity>
                <TouchableOpacity style={tw`flex-row items-center justify-center border border-white/10 rounded-full py-4 px-6 mb-3`}>
                    <RotateCcw color="#aaa" size={20} style={tw`mr-4`} />
                    <Text style={tw`text-gray-300 font-[InterTight] font-medium text-lg`}>Replay call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setViewState('selection')}
                    style={tw`bg-white rounded-full py-4 items-center justify-center shadow-lg w-full`}
                >
                    <Text style={tw`text-black font-[InterTight] font-bold text-lg`}>Done</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            {viewState === 'selection' && renderSelectionView()}

            <Modal visible={viewState !== 'selection'} animationType="fade" transparent={false}>
                <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
                    {viewState === 'active_call' && renderActiveCallView()}
                    {viewState === 'summary' && renderSummaryView()}

                    {/* Save Conversation Modal */}
                    <Modal visible={showSaveModal} transparent animationType="fade">
                        <View style={tw`flex-1 items-center justify-center px-8`}>
                            <BlurView intensity={30} tint="dark" style={tw`absolute inset-0`} />
                            <View style={tw`bg-[#1C1C1E] w-full p-8 rounded-[40px] border border-white/10 items-center`}>
                                <TouchableOpacity
                                    style={tw`absolute top-6 right-6`}
                                    onPress={() => {
                                        setShowSaveModal(false);
                                        setIsTimerRunning(true);
                                    }}
                                >
                                    <X color="#aaa" size={20} />
                                </TouchableOpacity>

                                <Text style={tw`text-white font-[InterTight-Bold] text-2xl text-center mb-2`}>
                                    Save this conversation?
                                </Text>
                                <Text style={tw`text-gray-400 font-[InterTight] text-center mb-8`}>
                                    We've transcribed {formatDurationLabel(callDuration)} of conversation
                                </Text>

                                <View style={tw`bg-accent-teal/20 p-6 rounded-full mb-8`}>
                                    <Sparkles color="#2b4e50" size={48} />
                                </View>

                                <TouchableOpacity
                                    onPress={() => {
                                        setIsTimerRunning(false);
                                        setShowSaveModal(false);
                                        setViewState('summary');
                                    }}
                                    style={tw`bg-white rounded-full py-4 items-center justify-center shadow-lg w-full mb-3`}
                                >
                                    <Text style={tw`text-black font-[InterTight-Bold] text-lg`}>Save and Exit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowSaveModal(false);
                                        setIsTimerRunning(true);
                                    }}
                                    style={tw`py-3`}
                                >
                                    <Text style={tw`text-gray-400 font-[InterTight-Bold]`}>Continue call</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Notes Modal (Resizable) */}
                    <Modal visible={showNotes} transparent animationType="slide">
                        <View style={tw`flex-1 justify-end`}>
                            <TouchableOpacity style={tw`flex-1`} onPress={() => setShowNotes(false)} />
                            <Animated.View style={[
                                tw`bg-[#1C1C1E]/95 rounded-t-[40px] border-t border-white/20 overflow-hidden`,
                                { height: notesHeight }
                            ]}>
                                <View
                                    {...notesPanResponder.panHandlers}
                                    style={tw`items-center py-4`}
                                >
                                    <View style={tw`w-12 h-1.5 bg-white/20 rounded-full`} />
                                </View>

                                <View style={tw`flex-row justify-between items-center mb-8 px-8`}>
                                    <Text style={tw`text-white font-[InterTight-Bold] text-2xl`}>Notes</Text>
                                    <TouchableOpacity onPress={() => setShowNotes(false)}>
                                        <X color="#aaa" size={24} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-36 px-8`}>
                                    {notes.map((note) => (
                                        <TouchableOpacity
                                            key={note.id}
                                            activeOpacity={0.9}
                                            onPress={() => {
                                                if (editingNoteId !== note.id) {
                                                    setExpandedNoteId(expandedNoteId === note.id ? null : note.id);
                                                }
                                            }}
                                        >
                                            <GlassCard style={[
                                                tw`p-5 bg-white/5 border border-white/10 mb-4`,
                                                expandedNoteId === note.id && tw`py-8`
                                            ]} noPadding>
                                                <View style={tw`flex-row justify-between items-center mb-2`}>
                                                    {expandedNoteId === note.id ? (
                                                        <Text style={tw`text-gray-500 font-[InterTight] text-[10px]`}>{note.time}</Text>
                                                    ) : (
                                                        <Text style={tw`text-white font-[InterTight-Bold] text-lg`}>{note.title}</Text>
                                                    )}

                                                    {expandedNoteId === note.id && !editingNoteId ? (
                                                        <View style={tw`flex-row`}>
                                                            <TouchableOpacity
                                                                style={tw`mr-3 bg-white/10 p-2 rounded-lg`}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingNoteId(note.id);
                                                                }}
                                                            >
                                                                <Edit3 color="#fff" size={14} />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={tw`bg-red-500/20 p-2 rounded-lg`}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    setNotes(notes.filter(n => n.id !== note.id));
                                                                }}
                                                            >
                                                                <Trash2 color="#ff4444" size={14} />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : expandedNoteId === note.id && editingNoteId === note.id ? (
                                                        <TouchableOpacity
                                                            style={tw`bg-accent-teal/20 p-2 rounded-lg`}
                                                            onPress={() => setEditingNoteId(null)}
                                                        >
                                                            <UserCheck color="#4fd1c5" size={14} />
                                                        </TouchableOpacity>
                                                    ) : (
                                                        <Text style={tw`text-gray-500 font-[InterTight] text-xs`}>{note.time}</Text>
                                                    )}
                                                </View>

                                                {(expandedNoteId === note.id || editingNoteId === note.id) && (
                                                    <View style={tw`mb-4`}>
                                                        {editingNoteId === note.id ? (
                                                            <TextInput
                                                                style={tw`text-white font-[InterTight-Bold] text-xl mb-1 p-0`}
                                                                value={note.title}
                                                                onChangeText={(text) => setNotes(notes.map(n => n.id === note.id ? { ...n, title: text } : n))}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <Text style={tw`text-white font-[InterTight-Bold] text-xl mb-1`}>{note.title}</Text>
                                                        )}
                                                    </View>
                                                )}

                                                {editingNoteId === note.id ? (
                                                    <TextInput
                                                        style={tw`text-gray-400 font-[InterTight] leading-5 p-0`}
                                                        value={note.content}
                                                        onChangeText={(text) => setNotes(notes.map(n => n.id === note.id ? { ...n, content: text } : n))}
                                                        multiline
                                                    />
                                                ) : (
                                                    <Text style={[
                                                        tw`text-gray-400 font-[InterTight] leading-5`,
                                                        expandedNoteId === note.id && tw`text-gray-300 text-base leading-6`
                                                    ]}>
                                                        {note.content}
                                                    </Text>
                                                )}
                                            </GlassCard>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <View style={tw`absolute bottom-0 left-0 right-0 bg-[#1C1C1E] px-8 pb-10`}>
                                    <View style={tw`h-px bg-white/10 w-full mb-6`} />
                                    <TextInput
                                        placeholder="Add a note..."
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        style={tw`bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-[InterTight]`}
                                        value={noteInput}
                                        onChangeText={setNoteInput}
                                        onSubmitEditing={() => {
                                            if (noteInput.trim()) {
                                                setNotes([...notes, {
                                                    id: Date.now(),
                                                    title: 'New Note',
                                                    content: noteInput,
                                                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                }]);
                                                setNoteInput('');
                                            }
                                        }}
                                    />
                                </View>
                            </Animated.View>
                        </View>
                    </Modal>

                    {/* Settings Modal (Fixed Height) */}
                    <Modal visible={showSettings} transparent animationType="slide">
                        <View style={tw`flex-1 justify-end`}>
                            <TouchableOpacity style={tw`flex-1`} onPress={() => setShowSettings(false)} />
                            <View style={[
                                tw`bg-[#1C1C1E]/95 rounded-t-[40px] border-t border-white/20 pt-10`,
                                { height: windowHeight * 0.35 }
                            ]}>
                                <View style={tw`flex-row justify-between items-center mb-8 px-8`}>
                                    <Text style={tw`text-white font-[InterTight-Bold] text-2xl`}>Switch Coach</Text>
                                    <TouchableOpacity onPress={() => setShowSettings(false)}>
                                        <X color="#aaa" size={24} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4 pl-8`}>
                                    {PERSONAS.map(persona => (
                                        <TouchableOpacity
                                            key={persona.id}
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                setSelectedPersona(persona);
                                                setShowSettings(false);
                                            }}
                                            style={tw`mr-4 w-64`}
                                        >
                                            <GlassCard style={tw`${selectedPersona.id === persona.id ? 'border-accent-teal/50 bg-accent-teal/10' : 'border-white/10 bg-white/5'} p-5`} noPadding>
                                                <View style={tw`flex-row justify-between items-start mb-4`}>
                                                    {renderPersonaIcon(persona, 40)}
                                                    <View style={tw`bg-[#3D3A2C] px-3 py-1.5 rounded-full border border-[#6B6330] self-start`}>
                                                        <Text style={tw`text-[#EEDF7A] font-[InterTight] font-medium text-[10px]`}>{persona.type}</Text>
                                                    </View>
                                                </View>
                                                <Text style={tw`text-white font-[InterTight-Bold] text-base mb-1`}>{persona.name}</Text>
                                                <Text style={tw`text-gray-300 font-[InterTight] font-medium text-xs mb-2`}>{persona.specialization}</Text>
                                            </GlassCard>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>

                    {/* Text Settings Modal */}
                    <Modal visible={showTextSettings} transparent animationType="fade">
                        <View style={tw`flex-1 justify-center items-center bg-black/60 px-6`}>
                            <View style={tw`bg-[#1C1C1E] border border-white/10 rounded-[32px] p-8 w-full max-w-sm`}>
                                <View style={tw`flex-row justify-between items-center mb-6`}>
                                    <Text style={tw`text-white font-[InterTight-Bold] text-xl`}>Text settings</Text>
                                    <TouchableOpacity onPress={() => setShowTextSettings(false)}>
                                        <X color="#aaa" size={24} />
                                    </TouchableOpacity>
                                </View>

                                <View style={tw`gap-4`}>
                                    {/* Font Selector */}
                                    <View style={tw`bg-white/5 rounded-2xl p-4 border border-white/10 flex-row justify-between items-center`}>
                                        <Text style={tw`text-white font-[InterTight]`}>Default</Text>
                                        <View>
                                            <ChevronUp color="#888" size={12} />
                                            <ChevronDown color="#888" size={12} />
                                        </View>
                                    </View>

                                    {/* Size Selector */}
                                    <View style={tw`bg-white/5 rounded-2xl p-4 border border-white/10 flex-row justify-between items-center px-8`}>
                                        <TouchableOpacity
                                            onPress={() => setTranscriptionFontSize(Math.max(12, transcriptionFontSize - 2))}
                                            style={transcriptionFontSize <= 12 ? tw`opacity-30` : tw`opacity-100`}
                                        >
                                            <Text style={tw`text-gray-500 font-[InterTight] text-base`}>A-</Text>
                                        </TouchableOpacity>
                                        <Text style={tw`text-white font-[InterTight-Bold] text-base`}>A</Text>
                                        <TouchableOpacity
                                            onPress={() => setTranscriptionFontSize(Math.min(24, transcriptionFontSize + 2))}
                                            style={transcriptionFontSize >= 24 ? tw`opacity-30` : tw`opacity-100`}
                                        >
                                            <Text style={tw`text-gray-300 font-[InterTight] text-base`}>A+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={tw`bg-white rounded-2xl py-4 items-center mt-8`}
                                    onPress={() => setShowTextSettings(false)}
                                >
                                    <Text style={tw`text-black font-[InterTight-Bold] text-base`}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </GlassBackground>
            </Modal>
        </GlassBackground>
    );
}
