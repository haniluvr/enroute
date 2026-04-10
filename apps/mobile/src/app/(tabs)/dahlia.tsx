import tw from '@/lib/tailwind';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, Modal, Platform, PanResponder, Dimensions, Share, KeyboardAvoidingView, Alert, Pressable, ActivityIndicator, Image, Keyboard, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import Markdown from 'react-native-markdown-display';
import axios from 'axios';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeIn, Layout } from 'react-native-reanimated';
import AnimatedReanimated from 'react-native-reanimated';
import {
    Sparkles,
    Users,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
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
    Phone,
    PhoneOff,
    RotateCcw,
    Send,
    Share2,
    X,
    Bookmark,
    Check,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Camera,
    Image as ImageIcon,
    Video,
    Plus,
    ChevronRight,
    ArrowUpRight,
    Volume2,
    Volume1,
    AudioLines,
    Activity,
    TrendingUp,
    Globe,
    Search,
    Square,
    Copy,
    ThumbsUp,
    ThumbsDown,
    RotateCw,
    User,
} from 'lucide-react-native';
import LogoSVG from '@/assets/logo.svg';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AI_API } from '@/config/backend';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PERSONAS, Persona, MOCK_INSIGHTS, MOCK_QUOTES, MOCK_TRANSCRIPTION } from '@/data/dahliaData';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

type ViewState = 'selection' | 'active_call' | 'summary' | 'chat';
type CallMode = 'voice' | 'text';

export default function DahliaScreen() {
    const { user } = useAuth();
    const { q, id: existingConvId } = useLocalSearchParams<{ q: string, id: string }>();
    const router = useRouter();
    const navigation = useNavigation();
    const [viewState, setViewState] = useState<ViewState>('chat');
    const [callMode, setCallMode] = useState<CallMode>('voice');
    const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);

    useEffect(() => {
        if (user?.user_metadata?.persona) {
            const persona = PERSONAS.find(p => p.id === user.user_metadata.persona);
            if (persona) {
                setSelectedPersona(persona);
            }
        }
    }, [user]);
    const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [callDuration, setCallDuration] = useState(0); // in seconds
    const [summaryInsights, setSummaryInsights] = useState<string[]>([]);
    const [summaryQuotes, setSummaryQuotes] = useState<string[]>([]);
    const [summaryOverview, setSummaryOverview] = useState<string>('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const windowHeight = Dimensions.get('window').height;
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showTranscriptionOptions, setShowTranscriptionOptions] = useState(false);
    const [showTextSettings, setShowTextSettings] = useState(false);
    const [transcriptionFont, setTranscriptionFont] = useState('InterTight');
    const [transcriptionFontSize, setTranscriptionFontSize] = useState(15);
    const [inputText, setInputText] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(existingConvId || null);
    const [isLoading, setIsLoading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    
    // Auto-generate AI notes during the call
    useEffect(() => {
        if (viewState === 'active_call' && chatMessages.length > 0 && chatMessages.length % 4 === 0) {
            console.log('Background AI note generation triggered at', chatMessages.length, 'messages');
            fetchAISummary();
        }
    }, [chatMessages.length, viewState]);

    // Hide Tab Bar during calls
    useEffect(() => {
        navigation.setOptions({
            tabBarStyle: (viewState === 'active_call' || viewState === 'summary') 
                ? { display: 'none' } 
                : {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    borderTopColor: 'transparent',
                    height: 70,
                    paddingBottom: 10,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 0,
                }
        });
    }, [viewState, navigation]);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(showEvent as any, () => setKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener(hideEvent as any, () => setKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    // Advanced UI States
    const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [notes, setNotes] = useState<any[]>([]);
    const [noteInput, setNoteInput] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const notesTranslateY = useRef(new Animated.Value(windowHeight)).current;
    const notesCurrentOffset = useRef(windowHeight);
    const chatScrollViewRef = useRef<ScrollView>(null);

    // Keyboard listener for manual offset in Notes
    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    // Pulsing animation for voice mode
    const pulseAnim = useRef(new Animated.Value(1)).current;

    /**
     * Animation States for Sub-Modals
     */
    const [notesRendered, setNotesRendered] = useState(false);
    const notesOpacity = useRef(new Animated.Value(0)).current;
    
    const [settingsRendered, setSettingsRendered] = useState(false);
    const settingsOpacity = useRef(new Animated.Value(0)).current;

    const [saveModalRendered, setSaveModalRendered] = useState(false);
    const saveModalOpacity = useRef(new Animated.Value(0)).current;

    const [textSettingsRendered, setTextSettingsRendered] = useState(false);
    const textSettingsOpacity = useRef(new Animated.Value(0)).current;

    // Effect for Notes Animation
    useEffect(() => {
        if (showNotes) {
            setNotesRendered(true);
            Animated.parallel([
                Animated.timing(notesOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(notesTranslateY, { toValue: windowHeight * 0.55, tension: 50, friction: 10, useNativeDriver: true })
            ]).start(() => {
                notesCurrentOffset.current = windowHeight * 0.55;
            });
        } else {
            Animated.parallel([
                Animated.timing(notesOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
                Animated.timing(notesTranslateY, { toValue: windowHeight, duration: 300, useNativeDriver: true })
            ]).start(() => {
                setNotesRendered(false);
                notesCurrentOffset.current = windowHeight;
            });
        }
    }, [showNotes]);

    // Effect for Settings Animation
    useEffect(() => {
        if (showSettings) {
            setSettingsRendered(true);
            Animated.timing(settingsOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(settingsOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start(() => setSettingsRendered(false));
        }
    }, [showSettings]);

    // Effect for Save Modal Animation
    useEffect(() => {
        if (showSaveModal) {
            setSaveModalRendered(true);
            Animated.timing(saveModalOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(saveModalOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start(() => setSaveModalRendered(false));
        }
    }, [showSaveModal]);

    // Effect for Text Settings Animation
    useEffect(() => {
        if (showTextSettings) {
            setTextSettingsRendered(true);
            Animated.timing(textSettingsOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(textSettingsOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start(() => setTextSettingsRendered(false));
        }
    }, [showTextSettings]);

    // Voice Recording States
    const [voiceRecording, setVoiceRecording] = useState<Audio.Recording | null>(null);
    const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
    const isFetchingTTSRef = useRef<string | null>(null);
    const currentSoundRef = useRef<Audio.Sound | null>(null);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 18) return 'Afternoon';
        return 'Evening';
    };

    /**
     * Start recording user's voice
     */
    async function startVoiceRecording() {
        try {
            if (permissionResponse?.status !== 'granted') {
                await requestPermission();
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setVoiceRecording(recording);
            console.log('Voice recording started');
        } catch (err) {
            console.error('Failed to start voice recording', err);
        }
    }

    /**
     * Stop voice recording and process it
     */
    async function stopVoiceRecording() {
        if (!voiceRecording) return;
        
        setIsVoiceProcessing(true);
        setVoiceRecording(null);
        await voiceRecording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        
        const uri = voiceRecording.getURI();
        if (uri) {
            await processVoiceTranscription(uri);
        } else {
            setIsVoiceProcessing(false);
        }
    }

    /**
     * Send voice to backend and then to AI chat
     */
    async function processVoiceTranscription(uri: string) {
        try {
            const formData = new FormData();
            // @ts-ignore
            formData.append('audio', {
                uri,
                type: 'audio/m4a',
                name: 'dahlia_call.m4a',
            });

            const response = await fetch(AI_API.STT, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.transcription) {
                // In Call View, we trigger S2S immediate response
                if (viewState === 'active_call') {
                    await handleSendMessage(data.transcription, true);
                } else {
                    await handleSendMessageFromVoice(data.transcription);
                }
            }
        } catch (err) {
            console.error('Voice processing error:', err);
        } finally {
            setIsVoiceProcessing(false);
        }
    }

    /**
     * Logic for Pulse Animation in Voice Mode
     */
    useEffect(() => {
        let pulse: Animated.CompositeAnimation | null = null;
        if (voiceRecording || isSpeaking || isVoiceProcessing) {
            pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
        } else {
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
        return () => pulse?.stop();
    }, [voiceRecording, isSpeaking, isVoiceProcessing]);

    /**
     * Wrapper for handleSendMessage to use transcribed text
     */
    async function handleSendMessageFromVoice(text: string) {
        setInputText(text);
        // We do NOT auto-send in chat, just populate the input 
        // unless specified, but let's follow record-idea which just sets it
    }

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

    const [showFullTranscript, setShowFullTranscript] = useState(false);
    const [showReplay, setShowReplay] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackProgress, setPlaybackProgress] = useState(0);

    const transcriptAnim = useRef(new Animated.Value(windowHeight)).current;
    const replayScale = useRef(new Animated.Value(0.9)).current;
    const replayOpacity = useRef(new Animated.Value(0)).current;

    const openFullTranscript = () => {
        setShowFullTranscript(true);
        Animated.spring(transcriptAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8
        }).start();
    };

    const closeFullTranscript = () => {
        Animated.timing(transcriptAnim, {
            toValue: windowHeight,
            duration: 300,
            useNativeDriver: true
        }).start(() => {
            setShowFullTranscript(false);
        });
    };

    const openReplay = () => {
        setShowReplay(true);
        Animated.parallel([
            Animated.spring(replayScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 8
            }),
            Animated.timing(replayOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            })
        ]).start();
    };

    const closeReplay = () => {
        Animated.parallel([
            Animated.timing(replayScale, {
                toValue: 0.9,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(replayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            })
        ]).start(() => {
            setShowReplay(false);
            setIsPlaying(false);
        });
    };

    const handleExportHighlights = async () => {
        try {
            const logoSvg = `<svg width="30" height="30" viewBox="0 0 195 185" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M78.2694 62.5C61.7337 34.9913 19.2689 34.5002 5.26887 62.5C-7.68848 90.5754 5.26887 111.5 22.3244 120.5C22.7806 119.921 23.2451 119.337 23.7175 118.749C27.0238 114.637 30.7133 110.344 34.6181 106C25.2688 103 11.9572 88.354 22.3244 70.0002C32.3326 56.4065 50.9833 54.0728 64.2689 75.5744C69.3673 70.6764 74.1529 66.2245 78.2694 62.5Z" fill="#2b4e50"/>
<path d="M64.2689 101.5C123.057 50.3295 127.838 30.2531 127.769 0H126.269C128.333 29.0548 122.98 50.0574 64.2689 101.5Z" fill="#2b4e50"/>
<path d="M8.61774 145.5C8.62273 143.688 9.21779 141.495 10.3036 139C8.12663 144.006 7.642 146.716 7.17195 151.5C7.39523 149.42 7.87162 147.401 8.61774 145.5Z" fill="#2b4e50"/>
<path d="M55.2695 179C85.2544 157.254 91.2688 111 86.7689 85.5002C88.7392 118.374 87.7379 148.683 55.2695 179Z" fill="#2b4e50"/>
<path d="M34.381 165.5C35.0558 165.595 35.7631 165.647 36.5 165.656C36.7771 165.659 37.5584 165.656 37.8438 165.647C39.2219 165.533 39.9792 165.33 41.3828 164.625C41.7124 164.436 42.0384 164.243 42.3608 164.047C38.6432 165.604 36.7556 165.812 33.4749 165.342C33.7697 165.404 34.0718 165.457 34.381 165.5Z" fill="#2b4e50"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M36.5 165.656C35.7631 165.647 35.0558 165.595 34.381 165.5C35.1645 165.643 35.626 165.687 36.5 165.656Z" fill="#2b4e50"/>
<path d="M86.7689 85.5002L69.2689 101.5C69.7504 115.5 65.8834 144.2 48.214 159.731C46.4102 161.317 44.4624 162.765 42.3608 164.047C42.0384 164.243 41.7124 164.436 41.3828 164.625C40.8543 164.927 40.3163 165.219 39.7689 165.5C39.1089 165.578 38.4667 165.627 37.8438 165.647C37.5584 165.656 36.7771 165.659 36.5 165.656C35.626 165.687 35.1645 165.643 34.381 165.5C34.0718 165.457 33.7697 165.404 33.4749 165.342C20.8801 162.71 21.6739 143.595 55.9025 109.501C58.4939 106.919 61.2796 104.252 64.2689 101.5C122.98 50.0574 128.333 29.0548 126.269 0H108.769C107.422 28.2875 100.834 36.0109 84.296 55.3965C82.4177 57.5982 80.4112 59.9503 78.2694 62.5C74.1529 66.2245 69.3673 70.6764 64.2689 75.5744C54.7023 84.765 44.0342 95.5263 34.6181 106C30.7133 110.344 27.0238 114.637 23.7175 118.749C23.2451 119.337 22.7806 119.921 22.3244 120.5C16.8239 127.488 12.5311 133.881 10.3036 139C9.21779 141.495 8.62273 143.688 8.61774 145.5C7.87162 147.401 7.39523 149.42 7.17195 151.5C5.04647 171.3 25.8585 196.646 55.2695 179C87.7379 148.683 88.7392 118.374 86.7689 85.5002Z" fill="#2b4e50"/>
<path d="M37.8438 165.647C38.4667 165.627 39.1089 165.578 39.7689 165.5C40.3163 165.219 40.8543 164.927 41.3828 164.625C39.9792 165.533 39.2219 165.533 37.8438 165.647Z" fill="#2b4e50"/>
<path d="M116.5 62.5C133.036 34.9913 175.501 34.5002 189.501 62.5C202.458 90.5754 189.501 111.5 172.445 120.5C171.989 119.921 171.524 119.337 171.052 118.749C167.746 114.637 164.056 110.344 160.151 106C169.501 103 182.812 88.354 172.445 70.0002C162.437 56.4065 143.786 54.0728 130.501 75.5744C125.402 70.6764 120.617 66.2245 116.5 62.5Z" fill="#2b4e50"/>
<path d="M130.501 101.5C71.7126 50.3295 66.932 30.2531 67.0007 0H68.5001C66.4363 29.0548 71.7899 50.0574 130.501 101.5Z" fill="#2b4e50"/>
<path d="M186.152 145.5C186.147 143.688 185.552 141.495 184.466 139C186.643 144.006 187.128 146.716 187.598 151.5C187.374 149.42 186.898 147.401 186.152 145.5Z" fill="#2b4e50"/>
<path d="M139.5 179C109.515 157.254 103.501 111 108.001 85.5002C106.03 118.374 107.032 148.683 139.5 179Z" fill="#2b4e50"/>
<path d="M160.389 165.5C159.714 165.595 159.006 165.647 158.27 165.656C157.992 165.659 157.211 165.656 156.926 165.647C155.548 165.533 154.79 165.33 153.387 164.625C153.057 164.436 152.731 164.243 152.409 164.047C156.126 165.604 158.014 165.812 161.295 165.342C161 165.404 160.698 165.457 160.389 165.5Z" fill="#2b4e50"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M158.27 165.656C159.006 165.647 159.714 165.595 160.389 165.5C159.605 165.643 159.144 165.687 158.27 165.656Z" fill="#2b4e50"/>
<path d="M108.001 85.5002L125.501 101.5C125.019 115.5 128.886 144.2 146.555 159.731C148.359 161.317 150.307 162.765 152.409 164.047C152.731 164.243 153.057 164.436 153.387 164.625C153.915 164.927 154.453 165.219 155.001 165.5C155.661 165.578 156.303 165.627 156.926 165.647C157.211 165.656 157.992 165.659 158.27 165.656C159.144 165.687 159.605 165.643 160.389 165.5C160.698 165.457 161 165.404 161.295 165.342C173.889 162.71 173.096 143.595 138.867 109.501C136.276 106.919 133.49 104.252 130.501 101.5C71.7899 50.0574 66.4363 29.0548 68.5001 0H86.0001C87.3471 28.2875 93.9359 36.0109 110.474 55.3965C112.352 57.5982 114.358 59.9503 116.5 62.5C120.617 66.2245 125.402 70.6764 130.501 75.5744C140.067 84.765 150.735 95.5263 160.151 106C164.056 110.344 167.746 114.637 171.052 118.749C171.524 119.337 171.989 119.337 172.445 120.5C177.946 127.488 182.238 133.881 184.466 139C185.552 141.495 186.147 143.688 186.152 145.5C186.898 147.401 187.374 149.42 187.598 151.5C189.723 171.3 168.911 196.646 139.5 179C107.032 148.683 106.03 118.374 108.001 85.5002Z" fill="#2b4e50"/>
<path d="M156.926 165.647C156.303 165.627 155.661 165.578 155.001 165.5C154.453 165.219 153.915 164.927 153.387 164.625C154.79 165.33 155.548 165.533 156.926 165.647Z" fill="#2b4e50"/>
</svg>`;

            const html = `
                <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
                            body { 
                                font-family: 'Inter', sans-serif; 
                                padding: 30px; 
                                background-color: #fdfaf6; 
                                color: #333; 
                                line-height: 1.4;
                            }
                            .header { 
                                display: flex; 
                                justify-content: space-between; 
                                align-items: center; 
                                border-bottom: 1px solid #ddd; 
                                padding-bottom: 15px; 
                                margin-bottom: 30px; 
                            }
                            .brand { display: flex; align-items: center; gap: 10px; }
                            .brand-name { font-weight: 700; font-size: 14px; color: #333; }
                            .date-label { font-size: 12px; font-weight: 700; color: #333; }
                            
                            .content-grid { 
                                display: grid; 
                                grid-template-columns: 1fr 1fr; 
                                gap: 30px; 
                                margin-bottom: 40px;
                            }

                            .section-header { 
                                font-size: 16px; 
                                font-weight: 700; 
                                color: #2b4e50; 
                                margin-bottom: 15px; 
                                display: block;
                            }

                            .column-text { font-size: 13px; color: #555; margin-bottom: 15px; }
                            
                            .list-item { 
                                display: flex; 
                                gap: 10px; 
                                margin-bottom: 10px; 
                                align-items: flex-start;
                                font-size: 13px;
                                color: #333;
                            }
                            .bullet { width: 6px; height: 6px; background: #2b4e50; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }

                            .step-card { margin-bottom: 35px; }
                            .step-number { font-size: 28px; font-weight: 700; color: #2b4e50; margin-bottom: 5px; line-height: 1; }
                            .step-title { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 8px; }
                            .step-desc { font-size: 13px; color: #555; line-height: 1.5; }

                            .table-container { border-top: 1px solid #eee; }
                            .table-row { display: flex; border-bottom: 1px solid #eee; padding: 12px 0; font-size: 13px; }
                            .table-label { width: 40%; font-weight: 700; color: #111; }
                            .table-value { width: 60%; color: #555; }

                            .transcript-section { margin-top: 50px; border-top: 2px solid #111; padding-top: 30px; }
                            .speaker-tag { font-size: 10px; font-weight: 700; color: #2b4e50; text-transform: uppercase; margin-bottom: 5px; display: block; }
                            .msg-box { margin-bottom: 15px; background: white; padding: 15px 20px; border-radius: 10px; border: 1px solid #eee; page-break-inside: avoid; }
                            .msg-user { border-left: 3px solid #2b4e50; }

                            .footer { 
                                margin-top: 60px; 
                                border-top: 1px solid #ddd; 
                                padding-top: 20px; 
                                display: flex; 
                                justify-content: space-between; 
                                font-size: 11px; 
                                color: #2b4e50;
                                font-weight: 600;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="brand">
                                ${logoSvg}
                                <span class="brand-name">Enroute Career Dev</span>
                            </div>
                            <div class="date-label">${new Date().toLocaleDateString()}</div>
                        </div>

                        <div class="content-grid">
                            <div>
                                <div class="section-header">Session Overview</div>
                                <div class="column-text">
                                    Strategic coaching session conducted with <strong>Hana Marquis</strong> and <strong>${selectedPersona.name}</strong>.
                                </div>
                                <div class="column-text" style="font-weight: 600; color: #111;">
                                    Highlights:
                                </div>
                                ${MOCK_QUOTES.map(quote => `<div class="list-item"><div class="bullet"></div><div>${quote}</div></div>`).join('')}
                            </div>
                            
                            <div>
                                <div class="section-header">Recommendations</div>
                                ${MOCK_INSIGHTS.map(insight => `
                                    <div class="list-item">
                                        <div class="bullet"></div>
                                        <div>${insight}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="content-grid">
                            <div>
                                <div class="section-header">Session Notes</div>
                                ${notes.map((note, idx) => `
                                    <div class="step-card">
                                        <div class="step-number">0${idx + 1}</div>
                                        <div class="step-title">${note.title}</div>
                                        <div class="step-desc">${note.content}</div>
                                    </div>
                                `).join('')}
                                ${notes.length === 0 ? '<div class="column-text">No personal notes recorded.</div>' : ''}
                            </div>
                            
                            <div>
                                <div class="section-header">Metadata</div>
                                <div class="table-container">
                                    <div class="table-row">
                                        <div class="table-label">Coach</div>
                                        <div class="table-value">${selectedPersona.name}</div>
                                    </div>
                                    <div class="table-row">
                                        <div class="table-label">Focus Area</div>
                                        <div class="table-value">${selectedPersona.type} Strategy</div>
                                    </div>
                                    <div class="table-row">
                                        <div class="table-label">Duration</div>
                                        <div class="table-value">${formatDurationLabel(callDuration)}</div>
                                    </div>
                                    <div class="table-row">
                                        <div class="table-label">Platform</div>
                                        <div class="table-value">Enroute Mobile</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="transcript-section">
                            <div class="section-header">Dialogue Log</div>
                            ${MOCK_TRANSCRIPTION.map(item => `
                                <div class="msg-box ${item.speaker === 'user' ? 'msg-user' : ''}">
                                    <span class="speaker-tag">${item.speaker === 'user' ? 'User' : 'Coach'}</span>
                                    <div style="font-size: 13px; color: #444; line-height: 1.5;">${item.text}</div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="footer">
                            <div>@enroutecareer</div>
                            <div style="font-style: italic;">Enroute v1.0.0</div>
                        </div>
                    </body>
                </html>
            `;

            const today = new Date().toISOString().split('T')[0];
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showReplay && isPlaying) {
            interval = setInterval(() => {
                setPlaybackProgress(prev => {
                    if (prev >= 100) {
                        setIsPlaying(false);
                        return 100;
                    }
                    return prev + 1;
                });
            }, 500);
        }
        return () => clearInterval(interval);
    }, [showReplay, isPlaying]);

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

    const [playbackBarWidth, setPlaybackBarWidth] = useState(0);
    const scrubberPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const touchX = evt.nativeEvent.locationX;
                const newProgress = Math.max(0, Math.min(100, (touchX / playbackBarWidth) * 100));
                setPlaybackProgress(newProgress);
            },
            onPanResponderMove: (evt) => {
                const touchX = evt.nativeEvent.locationX;
                const newProgress = Math.max(0, Math.min(100, (touchX / playbackBarWidth) * 100));
                setPlaybackProgress(newProgress);
            }
        })
    ).current;

    const startConversation = async (persona: Persona) => {
        if (!user || conversationId) return;
        try {
            const insertData: any = {
                persona_name: persona.name,
                persona_type: persona.type,
                status: 'active',
            };

            if (user.id !== 'pending') {
                insertData.user_id = user.id;
            }

            const { data, error } = await supabase
                .from('conversations')
                .insert(insertData)
                .select()
                .single();
            
            if (error) throw error;
            setConversationId(data.id);
            return data.id;
        } catch (err) {
            console.error('Start Conversation Error:', err);
        }
    };

    const fetchMessages = useCallback(async (convId: string) => {
        try {
            const { data, error } = await supabase
                .from('conversation_messages')
                .select('*')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            setChatMessages(data || []);
        } catch (err) {
            console.error('Fetch Messages Error:', err);
        }
    }, []);

    const fetchNotes = useCallback(async (convId: string) => {
        try {
            const { data, error } = await supabase
                .from('conversation_notes')
                .select('*')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setNotes(data || []);
        } catch (err) {
            console.error('Fetch Notes Error:', err);
        }
    }, []);

    useEffect(() => {
        if (existingConvId) {
            setViewState('active_call');
            fetchMessages(existingConvId);
            fetchNotes(existingConvId);
        } else if (showNotes && conversationId) {
            fetchNotes(conversationId);
        }
    }, [existingConvId, showNotes, conversationId, fetchMessages, fetchNotes]);

    const handleNewChat = async () => {
        if (!user || user.id === 'pending') return;
        
        // If there's an active conversation with messages, we'll mark it as saved or keep it organized
        if (conversationId && chatMessages.length > 0) {
            try {
                // Save reference to library_saves
                const { error: saveError } = await supabase.from('library_saves').insert({
                    user_id: user.id,
                    item_type: 'conversation',
                    item_id: conversationId,
                    title: `Session with ${selectedPersona?.name || 'AI'}`,
                    summary: summaryInsights?.[0] || 'Coaching Reflection' // Store the top insight as snippet
                });
                
                if (saveError) console.error("Error saving to library:", saveError);
            } catch (err) {
                console.error("New Chat Save error:", err);
            }
        }
        
        // Reset state for a fresh chat session
        setConversationId(null);
        setChatMessages([]);
        setInputText('');
    };


    const fetchAISummary = async () => {
        if (chatMessages.length === 0) return;
        
        setIsSummarizing(true);
        try {
            console.log('Fetching AI summary for history:', chatMessages.length);
            const response = await axios.post(AI_API.SUMMARIZE, {
                history: chatMessages.map(m => ({ role: m.role, content: m.content }))
            });
            
            if (response.data) {
                const { overview, insights, quotes, notes: aiNotes } = response.data;
                setSummaryOverview(overview || '');
                setSummaryInsights(insights || []);
                setSummaryQuotes(quotes || []);
                
                // Also convert aiNotes to our Note format and add to notes
                if (aiNotes && Array.isArray(aiNotes) && aiNotes.length > 0 && conversationId) {
                    const mappedNotes = aiNotes.map((content: string, i: number) => ({
                        id: `ai-${Date.now()}-${i}`,
                        conversation_id: conversationId,
                        title: '💡 Key Takeaway',
                        content: content,
                        time: formatDuration(callDuration),
                        created_at: new Date().toISOString()
                    }));
                    
                    // Filter out old automated "Key Takeaway" notes to avoid duplication
                    setNotes(prev => [
                        ...mappedNotes, 
                        ...prev.filter(n => n.title !== '💡 Key Takeaway')
                    ]);
                    
                    // Persist AI notes to DB, clear out old automated ones first
                    await supabase
                        .from('conversation_notes')
                        .delete()
                        .eq('conversation_id', conversationId)
                        .eq('title', '💡 Key Takeaway');
                        
                    await supabase.from('conversation_notes').insert(
                        aiNotes.map(content => ({
                            conversation_id: conversationId,
                            title: '💡 Key Takeaway',
                            content: content
                        }))
                    );
                }

                // Update conversation metadata with real data
                if (conversationId) {
                    await supabase.from('conversations').update({ 
                        metadata: {
                            duration: callDuration,
                            insights: insights || [],
                            quotes: quotes || [],
                            summary: overview || `Coaching session with ${selectedPersona.name}`
                        }
                    }).eq('id', conversationId);
                }
            }
        } catch (error) {
            console.error('Error fetching AI summary:', error);
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleSendMessage = async (customText?: string, isS2S = false) => {
        const text = customText || inputText;
        if (!text.trim() || !user) return;
        
        let currentConvId = conversationId;
        if (!currentConvId) {
            currentConvId = await startConversation(selectedPersona);
        }

        if (!currentConvId) return;

        if (!customText) setInputText('');

        const newUserMsg = { 
            id: Math.random().toString(36).substr(2, 9),
            conversation_id: currentConvId,
            role: 'user', 
            content: text,
            created_at: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, newUserMsg]);

        // Add thinking placeholder only if NOT S2S
        let thinkingId = '';
        if (!isS2S) {
            thinkingId = 'thinking-' + Date.now();
            const thinkingMsg = {
                id: thinkingId,
                conversation_id: currentConvId,
                role: 'assistant',
                content: '...',
                created_at: new Date().toISOString(),
                isUpdating: true
            };
            setChatMessages(prev => [...prev, thinkingMsg]);
        }

        try {
            // Remove 'id' so Supabase generates a proper UUID
            const { id: _, ...msgToInsert } = newUserMsg;
            const { error: insertError } = await supabase.from('conversation_messages').insert(msgToInsert);
            if (insertError) throw insertError;

            // Call Backend AI
            const response = await fetch(AI_API.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona: selectedPersona.name,
                    isCall: isS2S,
                    history: chatMessages.map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.content
                    })).concat([{ role: 'user', content: text }])
                })
            });

            const data = await response.json();
            
            if (data.response) {
                const aiResponse = {
                    id: Math.random().toString(36).substr(2, 9),
                    conversation_id: currentConvId,
                    role: 'assistant',
                    content: data.response,
                    created_at: new Date().toISOString(),
                    versions: [data.response],
                    currentVersion: 0,
                    isUpdating: false
                };
                
                // Replace thinking placeholder or just add to list
                if (!isS2S) {
                    setChatMessages(prev => prev.map(m => m.id?.includes('thinking-') ? aiResponse : m));
                } else {
                    setChatMessages(prev => [...prev, aiResponse]);
                }
                
                // Remove 'id' and 'versions/currentVersion' for DB insert
                const { id: aiId, versions, currentVersion, isUpdating, ...aiMsgToInsert } = aiResponse;
                await supabase.from('conversation_messages').insert(aiMsgToInsert);

                // Automated Voice playback for S2S
                if (isS2S) {
                    await handleSpeak(data.response, aiResponse.id);
                }

                // Removed automatic TTS playback on receive
            }

        } catch (err) {
            console.error('AI Send Message Error:', err);
            // Fallback for demo if backend is down
            setTimeout(async () => {
                const aiResponse = {
                    conversation_id: currentConvId,
                    role: 'assistant',
                    content: `I understand you're interested in ${text}. Let's explore that further. (Demo Mode)`,
                    created_at: new Date().toISOString()
                };
                setChatMessages(prev => [...prev, aiResponse]);
            }, 1000);
        }
    };

    const uploadToSupabase = async (uri: string, name: string, type: string) => {
        if (!user || !conversationId) return;
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            // Use 'pending' or user id for the path
            const filePath = `${user.id}/${conversationId}/${Date.now()}_${name}`;

            const { data, error } = await supabase.storage
                .from('chat_attachments')
                .upload(filePath, blob, {
                    contentType: type
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('chat_attachments')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Upload Error:', error);
            return null;
        }
    };

    const handleFileUpload = async (type: 'photos' | 'camera' | 'files') => {
        setShowUploadModal(false);
        if (!conversationId) {
            const newId = await startConversation(selectedPersona);
            if (!newId) return;
        }

        try {
            let result: any;
            if (type === 'photos') {
                result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
            } else if (type === 'camera') {
                result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
            } else if (type === 'files') {
                result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
            }

            if (result && !result.canceled) {
                const asset = result.assets ? result.assets[0] : result;
                const fileUri = asset.uri;
                const fileName = asset.name || `file_${Date.now()}`;
                const fileType = asset.mimeType || 'application/octet-stream';

                setIsLoading(true);
                const publicUrl = await uploadToSupabase(fileUri, fileName, fileType);
                setIsLoading(false);

                if (publicUrl) {
                    const fileMsg = {
                        conversation_id: conversationId,
                        role: 'user',
                        content: `[File: ${fileName}]`,
                        attachment_url: publicUrl,
                        attachment_type: type,
                        created_at: new Date().toISOString()
                    };
                    setChatMessages(prev => [...prev, fileMsg]);
                    await supabase.from('conversation_messages').insert(fileMsg);
                }
            }
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    const notesPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
            onPanResponderMove: (_, gestureState) => {
                // Drag relative to current offset
                const targetY = Math.max(-50, notesCurrentOffset.current + gestureState.dy);
                notesTranslateY.setValue(targetY);
            },
            onPanResponderRelease: (_, gestureState) => {
                const finalY = notesCurrentOffset.current + gestureState.dy;
                // Target levels (30%, 50%, 85% height)
                const snapPoints = [0, windowHeight * 0.35, windowHeight * 0.55];
                
                // Allow flick-heavy movement
                const projectedY = finalY + (gestureState.vy * 120);
                
                // Find the closest level
                const closestPoint = snapPoints.reduce((prev, curr) =>
                    Math.abs(curr - projectedY) < Math.abs(prev - projectedY) ? curr : prev
                );

                // Only close if dragged substantially past the lowest 30% point
                if (projectedY > windowHeight * 0.65) {
                    setShowNotes(false);
                } else {
                    notesCurrentOffset.current = closestPoint;
                    Animated.spring(notesTranslateY, {
                        toValue: closestPoint,
                        useNativeDriver: true,
                        speed: 12,
                        bounciness: 5
                    }).start();
                }
            }
        })
    ).current;

    const renderPersonaIcon = (persona: Persona, size: number = 60) => {
        if (persona.avatar) {
            return (
                <Image 
                    source={persona.avatar} 
                    style={[tw`rounded-full bg-white/5`, { width: size, height: size }]} 
                />
            );
        }
        const color = persona.icon === 'neutral' ? '#FFD700' : persona.icon === 'male' ? '#4169E1' : '#FF69B4';
        return (
            <View style={[tw`rounded-full items-center justify-center bg-white/10`, { width: size, height: size }]}>
                <View style={[tw`rounded-full`, { width: size * 0.7, height: size * 0.7, backgroundColor: color }]} />
            </View>
        );
    };

    const navigateVersion = (messageId: string, direction: 'prev' | 'next') => {
        setChatMessages((prev: any[]) => prev.map((m: any) => {
            if (m.id === messageId && m.versions) {
                const newVersion = direction === 'prev' 
                    ? Math.max(0, (m.currentVersion || 0) - 1)
                    : Math.min(m.versions.length - 1, (m.currentVersion || 0) + 1);
                
                return {
                    ...m,
                    content: m.versions[newVersion],
                    currentVersion: newVersion
                };
            }
            return m;
        }));
    };

    const handleCopy = async (text: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert("Copied", "Message copied to clipboard.");
    };

    const handleFeedback = (messageId: string, type: 'positive' | 'negative') => {
        setChatMessages((prev: any[]) => prev.map((m: any) => {
            if (m.id === messageId) {
                return { ...m, feedback: m.feedback === type ? null : type };
            }
            return m;
        }));
    };

    const handleSpeak = async (text: string, messageId: string) => {
        if (isFetchingTTSRef.current) return;
        
        if (currentSoundRef.current) {
            await currentSoundRef.current.stopAsync();
            await currentSoundRef.current.unloadAsync();
            currentSoundRef.current = null;
        }

        if (isSpeaking === messageId) {
            setIsSpeaking(null);
            return;
        }

        try {
            isFetchingTTSRef.current = messageId;
            setIsSpeaking(messageId);

            // Select voice based on persona
            let voice = 'af_heart';
            if (selectedPersona?.name.includes('Alex')) voice = 'am_michael';
            else if (selectedPersona?.name.includes('Susan')) voice = 'af_sarah';
            else if (selectedPersona?.name.includes('Dahlia')) voice = 'af_bella';

            const response = await fetch(AI_API.TTS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice })
            });

            if (!response.ok) throw new Error('TTS request failed');

            const data = await response.json();
            if (!data.audioUri) throw new Error('No audio returned');

            const base64Data = data.audioUri.replace(/^data:audio\/mpeg;base64,/, '');
            const tempPath = `${FileSystem.cacheDirectory}dahlia_tts_${Date.now()}.mp3`;
            await FileSystem.writeAsStringAsync(tempPath, base64Data, { encoding: FileSystem.EncodingType.Base64 });

            const { sound } = await Audio.Sound.createAsync({ uri: tempPath }, { shouldPlay: true });
            currentSoundRef.current = sound;

            sound.setOnPlaybackStatusUpdate(async (status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsSpeaking(null);
                    await sound.unloadAsync();
                    currentSoundRef.current = null;
                    await FileSystem.deleteAsync(tempPath, { idempotent: true });
                }
            });

        } catch (error) {
            console.error('TTS Error:', error);
            setIsSpeaking(null);
            Speech.speak(text, {
                onDone: () => setIsSpeaking(null),
                onError: () => setIsSpeaking(null)
            });
        } finally {
            isFetchingTTSRef.current = null;
        }
    };

    const handleRegenerate = async (messageId: string) => {
        const messageIndex = chatMessages.findIndex((m: any) => m.id === messageId);
        if (messageIndex === -1) return;

        const history = chatMessages.slice(0, messageIndex).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        setChatMessages((prev: any[]) => prev.map((m: any) => 
            m.id === messageId ? { ...m, isUpdating: true } : m
        ));

        try {
            const response = await fetch(AI_API.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona: selectedPersona.name,
                    isCall: viewState === 'active_call',
                    history
                })
            });

            if (!response.ok) throw new Error('Regeneration failed');
            const data = await response.json();

            setChatMessages((prev: any[]) => prev.map((m: any) => {
                if (m.id === messageId) {
                    const newVersions = [...(m.versions || [m.content]), data.response];
                    return {
                        ...m,
                        content: data.response,
                        versions: newVersions,
                        currentVersion: newVersions.length - 1,
                        isUpdating: false
                    };
                }
                return m;
            }));
        } catch (error) {
            console.error('Regeneration Error:', error);
            setChatMessages((prev: any[]) => prev.map((m: any) => 
                m.id === messageId ? { ...m, isUpdating: false } : m
            ));
        }
    };

    const renderCoachCard = (persona: Persona, isMain: boolean = false) => {
        const isSelected = selectedPersona.id === persona.id;
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPersona(persona)}
                style={isMain ? tw`mb-6` : tw`mr-4 w-64`}
            >
                <GlassCard style={tw`${isSelected ? 'border-accent-teal/50 bg-accent-teal/10' : 'border-white/10 bg-white/10'} p-5`} noPadding>
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

    const handleSuggestionSelect = (suggestion: string) => {
        setInputText(suggestion);
        setTimeout(() => {
            handleSendMessage();
        }, 100);
    };

    const renderChatView = () => (
        <View style={tw`flex-1 bg-transparent`}>
            {/* Redesigned Top Bar - Transparent Blur */}
            <View style={tw`pt-14 pb-4 px-6`}>
                <View style={tw`flex-row justify-between items-center`}>
                    {/* Left: Brand Lockup */}
                    <View style={tw`flex-row items-center`}>
                        <View style={tw`mr-3`}>
                            {LogoSVG ? (
                                <LogoSVG width={32} height={24} color="#fff" />
                            ) : (
                                <View style={tw`w-6 h-6 bg-white/20 rounded-full`} />
                            )}
                        </View>
                        <Text style={tw`text-white font-[InterTight] font-semibold text-3xl`}>Enroute</Text>
                    </View>

                    {/* Right: Persona Picker & Call Toggle */}
                    <View style={tw`flex-row items-center gap-3`}>
                        <TouchableOpacity
                            onPress={() => setViewState('selection')}
                            style={tw`flex-row items-center bg-white/10 px-3 py-2 rounded-full border border-white/10`}
                        >
                            <Text style={tw`text-white font-[InterTight] font-medium text-lg mr-1`}>
                                {selectedPersona?.name || 'Coach'}
                            </Text>
                            <ChevronDown color="#fff" size={14} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => {
                                setCallDuration(0);
                                setViewState('active_call');
                            }}
                            style={tw`w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10`}
                        >
                            <Phone color="#fff" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView 
                ref={chatScrollViewRef}
                style={tw`flex-1 px-6 bg-transparent`}
                contentContainerStyle={[tw`pb-10 pt-8`, { flexGrow: 1, justifyContent: 'flex-end' }]}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => chatScrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {chatMessages.length === 0 ? (
                    <View style={tw`pt-10`}>
                        {/* Greeting */}
                        <View style={tw`mb-12`}>
                            <Text style={tw`text-white font-[InterTight] font-semibold text-4xl mb-2`}>
                                {getGreeting()}, I'm {selectedPersona?.name || 'your coach'}
                            </Text>
                            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-xl`}>
                                Your AI career coach
                            </Text>
                        </View>

                        {/* Suggestions Grid */}
                        <View style={tw`gap-4`}>
                            {/* Main Card */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleSuggestionSelect("Analyze my resume")}
                            >
                                <GlassCard style={tw`bg-white/5 border-white/10 p-6 flex-row justify-between items-center`} noPadding>
                                    <View style={tw`flex-1 mr-4`}>
                                        <Text style={tw`text-white font-[InterTight] font-semibold text-lg mb-1`}>Analyze my resume</Text>
                                        <Text style={tw`text-gray-400 font-[InterTight] text-base leading-6`}>
                                            Upload your resume for AI-powered feedback on how to improve.
                                        </Text>
                                    </View>
                                    <View style={tw`w-10 h-10 rounded-full bg-white/10 items-center justify-center`}>
                                        <ArrowUpRight color="#fff" size={20} />
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>

                            <View style={tw`flex-row gap-4`}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={tw`flex-1`}
                                    onPress={() => handleSuggestionSelect("Mock Interview")}
                                >
                                    <GlassCard style={tw`bg-white/5 border-white/10 p-5 h-40 justify-between`} noPadding>
                                        <View style={tw`w-10 h-10 rounded-xl bg-white/5 items-center justify-center mb-3`}>
                                            <Users color="#fff" size={20} />
                                        </View>
                                        <View>
                                            <Text style={tw`text-white font-[InterTight] font-semibold text-base mb-1`}>Mock Interview</Text>
                                            <Text style={tw`text-gray-500 font-[InterTight] text-base leading-6`}>
                                                Practice for your dream role.
                                            </Text>
                                        </View>
                                        <View style={tw`absolute bottom-4 right-4 w-7 h-7 rounded-full bg-white/5 items-center justify-center`}>
                                            <ArrowUpRight color="#666" size={14} />
                                        </View>
                                    </GlassCard>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={tw`flex-1`}
                                    onPress={() => handleSuggestionSelect("Career Roadmap")}
                                >
                                    <GlassCard style={tw`bg-white/5 border-white/10 p-5 h-40 justify-between`} noPadding>
                                        <View style={tw`w-10 h-10 rounded-xl bg-white/5 items-center justify-center mb-3`}>
                                            <TrendingUp color="#fff" size={20} />
                                        </View>
                                        <View>
                                            <Text style={tw`text-white font-[InterTight] font-semibold text-base mb-1`}>Career Roadmap</Text>
                                            <Text style={tw`text-gray-500 font-[InterTight] text-base leading-6`}>
                                               Plan your next big move.
                                            </Text>
                                        </View>
                                        <View style={tw`absolute bottom-4 right-4 w-7 h-7 rounded-full bg-white/5 items-center justify-center`}>
                                            <ArrowUpRight color="#666" size={14} />
                                        </View>
                                    </GlassCard>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    chatMessages.map((msg, idx) => (
                        <AnimatedReanimated.View
                            key={msg.id || idx}
                            entering={FadeIn.delay(idx * 50)}
                            layout={Layout.springify()}
                            style={tw`mb-6 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <View style={tw`w-full ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}>
                                {msg.role === 'user' ? (
                                    <View style={tw`flex-row flex-row-reverse max-w-[90%]`}>
                                        <View style={tw`p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tr-none`}>
                                            <Text style={tw`text-white font-[InterTight] text-[16px] leading-6`}>
                                                {msg.content}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={tw`w-full pr-4`}>
                                        {msg.isUpdating ? (
                                            <View style={tw`py-4 flex-row items-center`}>
                                                <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" style={tw`mr-3`} />
                                                <Text style={tw`text-white/40 font-[InterTight] italic text-base`}>
                                                    {selectedPersona.name} is thinking...
                                                </Text>
                                            </View>
                                        ) : (
                                            <View>
                                                <Markdown
                                                    style={{
                                                        body: { color: '#f3f4f6', fontFamily: 'InterTight', fontSize: 18, lineHeight: 28 },
                                                        paragraph: { marginBottom: 16 },
                                                        strong: { fontWeight: '700', color: '#fff' },
                                                        em: { fontStyle: 'italic' },
                                                        link: { color: '#8b5cf6' },
                                                        bullet_list: { marginBottom: 12 },
                                                        list_item: { marginBottom: 8 }
                                                    }}
                                                >
                                                    {msg.content}
                                                </Markdown>

                                                {/* AI Actions Row */}
                                                <View style={tw`flex-row items-center justify-between mt-2 pt-2 -ml-2`}>
                                                    <View style={tw`flex-row items-center gap-4`}>
                                                        <TouchableOpacity onPress={() => handleCopy(msg.content)} style={tw`p-2`}>
                                                            <Copy color="#ffffff" opacity={0.4} size={18} />
                                                        </TouchableOpacity>
                                                        
                                                        <TouchableOpacity onPress={() => handleFeedback(msg.id, 'positive')} style={tw`p-2`}>
                                                            <ThumbsUp 
                                                                color={msg.feedback === 'positive' ? '#ffffff' : '#ffffff'} 
                                                                fill={msg.feedback === 'positive' ? '#ffffff' : 'transparent'}
                                                                opacity={msg.feedback === 'positive' ? 1 : 0.4} 
                                                                size={18} 
                                                            />
                                                        </TouchableOpacity>
                
                                                        <TouchableOpacity onPress={() => handleFeedback(msg.id, 'negative')} style={tw`p-2`}>
                                                            <ThumbsDown 
                                                                color={msg.feedback === 'negative' ? '#ffffff' : '#ffffff'} 
                                                                fill={msg.feedback === 'negative' ? '#ffffff' : 'transparent'}
                                                                opacity={msg.feedback === 'negative' ? 1 : 0.4} 
                                                                size={18} 
                                                            />
                                                        </TouchableOpacity>
                
                                                        <TouchableOpacity onPress={() => handleRegenerate(msg.id)} style={tw`p-2`}>
                                                            <RotateCw color="#ffffff" opacity={0.4} size={18} />
                                                        </TouchableOpacity>
                
                                                        <TouchableOpacity onPress={() => handleSpeak(msg.content, msg.id || `${idx}`)} style={tw`p-2`}>
                                                            <Volume1 color={isSpeaking === (msg.id || `${idx}`) ? '#ffffff' : '#ffffff'} opacity={isSpeaking === (msg.id || `${idx}`) ? 1 : 0.4} size={18} />
                                                        </TouchableOpacity>
                                                    </View>
                
                                                    {/* Regeneration Version Nav */}
                                                    {(msg.versions && msg.versions.length > 1) && (
                                                        <View style={tw`flex-row items-center gap-2 pr-2`}>
                                                            <TouchableOpacity onPress={() => navigateVersion(msg.id, 'prev')} disabled={msg.currentVersion === 0} style={tw`${msg.currentVersion === 0 ? 'opacity-20' : 'opacity-60'}`}>
                                                                <ChevronLeft color="#fff" size={18} />
                                                            </TouchableOpacity>
                                                            <Text style={tw`text-white/60 text-xs font-[InterTight]`}>
                                                                {(msg.currentVersion || 0) + 1}/{msg.versions.length}
                                                            </Text>
                                                            <TouchableOpacity onPress={() => navigateVersion(msg.id, 'next')} disabled={msg.currentVersion === msg.versions.length - 1} style={tw`${msg.currentVersion === msg.versions.length - 1 ? 'opacity-20' : 'opacity-60'}`}>
                                                                <ChevronRight color="#fff" size={18} />
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        </AnimatedReanimated.View>
                    ))
                )}
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                style={tw`bg-transparent`}
            >
                <View style={[tw`px-4 pt-2 bg-transparent`, { paddingBottom: isKeyboardVisible ? 0 : 60 }]}>
                    <GlassCard style={tw`bg-white/10 border-white/10 rounded-[32px] p-4 shadow-2xl`} noPadding>
                        <View style={tw`w-full`}>
                            {/* TOP: Message [Persona] Input */}
                            <View style={tw`mb-5`}>
                                <TextInput
                                    style={tw`text-white font-[InterTight] text-[17px] leading-6 p-0 ${isVoiceProcessing ? 'opacity-50' : ''}`}
                                    placeholder={isVoiceProcessing ? "Transcribing..." : `Message ${selectedPersona?.name || 'Enroute AI'}...`}
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    editable={!isVoiceProcessing}
                                    multiline
                                    maxLength={2000}
                                />
                            </View>

                            {/* BOTTOM ROW: Actions */}
                            <View style={tw`flex-row items-center justify-between`}>
                                <View style={tw`flex-row items-center gap-3`}>
                                    {/* Circular Plus Button (Upload) */}
                                    <TouchableOpacity 
                                        onPress={() => setShowUploadModal(true)}
                                        style={tw`w-11 h-11 rounded-full bg-white/5 items-center justify-center border border-white/10`}
                                    >
                                        <Plus color="#fff" size={22} />
                                    </TouchableOpacity>

                                    {/* + New Chat Button (Pill Styled like image) */}
                                    <TouchableOpacity 
                                        onPress={handleNewChat}
                                        style={tw`bg-white/5 border border-white/10 rounded-full px-5 py-2.5 flex-row items-center`}
                                    >
                                        <Text style={tw`text-white font-[InterTight-Medium] text-[15px]`}>+ New Chat</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={tw`flex-row items-center gap-3`}>
                                    {/* Mic Button */}
                                    <TouchableOpacity 
                                        onPress={voiceRecording ? stopVoiceRecording : startVoiceRecording}
                                        style={tw`w-11 h-11 rounded-full bg-white/5 items-center justify-center border border-white/10`}
                                    >
                                        {voiceRecording ? (
                                            <Square color="#fb923c" size={20} fill="#fb923c" />
                                        ) : (
                                            <Mic color={isVoiceProcessing ? "#555" : "#fff"} size={22} />
                                        )}
                                    </TouchableOpacity>

                                    {/* Action/Submit Button (Purple Gradient like image) */}
                                    <TouchableOpacity
                                        onPress={() => handleSendMessage()}
                                        disabled={!inputText.trim() || isVoiceProcessing}
                                        style={tw`${(!inputText.trim() || isVoiceProcessing) ? 'opacity-40' : ''}`}
                                    >
                                        <LinearGradient
                                            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                                            style={tw`w-11 h-11 rounded-full items-center justify-center shadow-lg shadow-purple-500/20`}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <LinearGradient
                                                colors={['#ec4899', '#8b5cf6']}
                                                style={tw`absolute inset-0 rounded-full opacity-30`}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            />
                                            <Send color="#fff" size={20} strokeWidth={2.5} />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </GlassCard>
                </View>
            </KeyboardAvoidingView>

            {/* Upload Modal */}
            <Modal visible={showUploadModal} transparent animationType="fade" onRequestClose={() => setShowUploadModal(false)}>
                <Pressable style={tw`flex-1 bg-black/50 justify-end`} onPress={() => setShowUploadModal(false)}>
                    <View style={tw`bg-[#1c1c1e] p-6 rounded-t-[40px] border-t border-white/10`}>
                        <Text style={tw`text-white font-[InterTight-Bold] text-xl mb-6`}>Upload to chat</Text>
                        
                        <TouchableOpacity onPress={() => handleFileUpload('photos')} style={tw`flex-row items-center py-4 border-b border-white/5`}>
                            <ImageIcon color="#fff" size={24} style={tw`mr-4`} />
                            <Text style={tw`text-white text-lg font-[InterTight]`}>Photos</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => handleFileUpload('camera')} style={tw`flex-row items-center py-4 border-b border-white/5`}>
                            <Camera color="#fff" size={24} style={tw`mr-4`} />
                            <Text style={tw`text-white text-lg font-[InterTight]`}>Camera</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => handleFileUpload('files')} style={tw`flex-row items-center py-4 border-b border-white/5`}>
                            <FileText color="#fff" size={24} style={tw`mr-4`} />
                            <Text style={tw`text-white text-lg font-[InterTight]`}>Files</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => setShowUploadModal(false)} style={tw`flex-row items-center py-4 mt-4 justify-center`}>
                            <Text style={tw`text-red-500 font-[InterTight-Bold] text-lg`}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );

    const renderSelectionView = () => (
        <ScrollView style={tw`flex-1 pt-10`}>
            <View style={tw`pt-6`}>
                <Text style={tw`text-white font-[InterTight] font-semibold text-3xl mb-1 px-6`}>Choose your career coach</Text>
                <Text style={tw`text-gray-400 font-[InterTight] text-lg mb-12 px-6`}>Who do you want to talk to today?</Text>

                <View style={tw`px-6`}>
                    {renderCoachCard(selectedPersona, true)}
                </View>

                <Text style={tw`text-gray-300 font-[InterTight] font-medium text-xl mb-4 px-6`}>Other coaches</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-8 pl-6`}>
                    {PERSONAS.filter(p => p.id !== selectedPersona.id).map(persona => (
                        <View key={persona.id}>
                            {renderCoachCard(persona)}
                        </View>
                    ))}
                </ScrollView>
            </View>

            <View style={tw`px-6 mb-20`}>
                <TouchableOpacity
                    onPress={async () => {
                        // Change persona and return to chat
                        const { error } = await supabase.auth.updateUser({ 
                            data: { persona: selectedPersona.id } 
                        });
                        if (error) {
                            Alert.alert('Error', 'Failed to update persona choice');
                        }
                        setViewState('chat');
                    }}
                    style={tw`bg-white rounded-full py-4 items-center justify-center shadow-lg w-full`}
                >
                    <Text style={tw`text-black font-[InterTight] font-semibold text-lg`}>Change to {selectedPersona.name}</Text>
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
                                <View style={tw`flex-1`}>
                                    <ScrollView 
                                        showsVerticalScrollIndicator={false}
                                        ref={chatScrollViewRef}
                                        onContentSizeChange={() => chatScrollViewRef.current?.scrollToEnd({ animated: true })}
                                    >
                                        {chatMessages.length === 0 ? (
                                            <Text style={tw`text-gray-500 italic font-[InterTight] mt-2`}>No transcription yet...</Text>
                                        ) : (
                                            chatMessages.map((msg, idx) => (
                                                <View key={idx} style={tw`mb-4`}>
                                                    <Text style={tw`text-gray-400 font-[InterTight] font-bold text-[10px] mb-1 uppercase tracking-widest`}>
                                                        {msg.role === 'user' ? 'YOU' : selectedPersona.name.toUpperCase()}:
                                                    </Text>
                                                    <Text style={[
                                                        { color: msg.role === 'user' ? '#fff' : '#3b82f6' },
                                                        { fontFamily: transcriptionFont, fontSize: transcriptionFontSize, lineHeight: transcriptionFontSize * 1.5 }
                                                    ]}>
                                                        {msg.content}
                                                    </Text>
                                                </View>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            </GlassCard>
                        </View>
                    )}
                </View>
            ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={tw`flex-1`}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={tw`flex-1 px-6 pb-6`}>
                        <GlassCard style={tw`flex-1 p-4 bg-white/10 border-white/10 rounded-[40px] overflow-hidden`} noPadding>
                            <ScrollView
                                ref={chatScrollViewRef}
                                style={tw`flex-1`}
                                contentContainerStyle={tw`pb-4`}
                                onContentSizeChange={() => chatScrollViewRef.current?.scrollToEnd({ animated: true })}
                            >
                                {chatMessages.map((msg, idx) => (
                                    <View key={idx} style={tw`mb-6 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <View style={tw`flex-row ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            {msg.role !== 'user' && renderPersonaIcon(selectedPersona, 36)}
                                            <View style={tw`${msg.role === 'user' ? 'mr-0' : 'ml-3'} mr-3 flex-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                <View style={tw`rounded-2xl p-4 ${msg.role === 'user' ? 'self-end bg-[#2b4e50]' : 'self-start bg-white/5'} max-w-[90%] border border-white/5`}>
                                                    <Text style={tw`text-white font-[InterTight] leading-5`}>
                                                        {msg.content}
                                                    </Text>
                                                </View>
                                                <Text style={tw`text-gray-500 text-[10px] mt-1 ${msg.role === 'user' ? 'mr-1' : 'ml-1'}`}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>

                            {/* Chat Input Inside Card */}
                            <View style={tw`flex-row items-center bg-white/5 rounded-full p-2 border border-white/10`}>
                                <TouchableOpacity onPress={() => setShowUploadModal(true)} style={tw`p-2`}>
                                    <Paperclip color="#aaa" size={20} />
                                </TouchableOpacity>
                                <TextInput
                                    placeholder="Type a message..."
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    style={tw`flex-1 text-white font-[InterTight] px-2 py-3`}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    onSubmitEditing={() => handleSendMessage()}
                                />
                                <TouchableOpacity 
                                    onPress={() => handleSendMessage()}
                                    disabled={!inputText.trim()}
                                    style={tw`bg-white w-10 h-10 rounded-full items-center justify-center ml-2 ${!inputText.trim() ? 'opacity-50' : ''}`}
                                >
                                    <Send color="#000" size={18} />
                                </TouchableOpacity>
                            </View>

                            {/* Upload Modal */}
                            <Modal visible={showUploadModal} transparent animationType="fade">
                                <Pressable style={tw`flex-1 bg-black/50 justify-end`} onPress={() => setShowUploadModal(false)}>
                                    <View style={tw`bg-[#1c1c1e] p-6 rounded-t-[40px] border-t border-white/10`}>
                                        <Text style={tw`text-white font-[InterTight-Bold] text-xl mb-6`}>Upload to chat</Text>
                                        <TouchableOpacity onPress={() => handleFileUpload('photos')} style={tw`flex-row items-center py-4 border-b border-white/5`}>
                                            <ImageIcon color="#fff" size={24} style={tw`mr-4`} />
                                            <Text style={tw`text-white text-lg`}>Photos</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleFileUpload('camera')} style={tw`flex-row items-center py-4 border-b border-white/5`}>
                                            <Camera color="#fff" size={24} style={tw`mr-4`} />
                                            <Text style={tw`text-white text-lg`}>Camera</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleFileUpload('files')} style={tw`flex-row items-center py-4 border-b border-white/5`}>
                                            <FileText color="#fff" size={24} style={tw`mr-4`} />
                                            <Text style={tw`text-white text-lg`}>Files</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setShowUploadModal(false)} style={tw`flex-row items-center py-4 mt-2 justify-center`}>
                                            <Text style={tw`text-red-500 font-bold text-lg`}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </Pressable>
                            </Modal>
                        </GlassCard>
                    </View>
                </KeyboardAvoidingView>
            )}

            {/* Bottom Nav */}
            <View style={tw`px-6 pb-10 items-center`}>
                <View style={tw`flex-row items-center bg-white/10 rounded-full border border-white/15 p-1.5 self-center`}>
                    <TouchableOpacity 
                        onPress={voiceRecording ? stopVoiceRecording : startVoiceRecording}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 10 }}
                        style={tw`flex-row items-center ${voiceRecording ? 'bg-red-500/20 border-red-500/50' : 'bg-white/5 border-white/10'} pl-5 pr-4 py-3.5 rounded-full border`}
                    >
                        {isVoiceProcessing ? (
                            <ActivityIndicator size="small" color="#fff" style={tw`mr-2.5`} />
                        ) : (
                            <Mic color={voiceRecording ? "#ff4444" : "#fff"} size={20} style={tw`mr-2.5`} />
                        )}
                        <Text style={tw`text-white font-[InterTight] font-semibold text-base pr-2`}>
                            {isVoiceProcessing ? 'Processing...' : voiceRecording ? 'Recording...' : 'Tap to speak'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowNotes(true)}
                        hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
                        style={tw`w-11 h-11 rounded-full items-center justify-center ml-1`}
                    >
                        <FileText color="#fff" size={22} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            // Cleanup: stop any active voice/sounds when ending call
                            setIsTimerRunning(false);
                            if (voiceRecording) stopVoiceRecording();
                            if (currentSoundRef.current) {
                                try {
                                    currentSoundRef.current.stopAsync();
                                    currentSoundRef.current.unloadAsync();
                                    currentSoundRef.current = null;
                                } catch (e) {}
                                setIsSpeaking(null);
                            }
                            setShowSaveModal(true);
                        }}
                        hitSlop={{ top: 15, bottom: 15, left: 10, right: 15 }}
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
                <TouchableOpacity onPress={async () => {
                    await handleNewChat();
                    setViewState('selection');
                }}>
                    <View style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10 w-11 h-11 items-center justify-center`}>
                        <ChevronLeft color="#aaa" size={24} />
                    </View>
                </TouchableOpacity>
                <Text style={tw`text-white font-[InterTight-Bold] text-2xl`}>Call summary</Text>
                <TouchableOpacity
                    onPress={() => setShowNotes(true)}
                    style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10 w-11 h-11 items-center justify-center`}
                >
                    <FileText color="#aaa" size={22} />
                </TouchableOpacity>
            </View>

            {summaryOverview ? (
                <View style={tw`mb-8`}>
                    <Text style={tw`text-gray-400 font-[InterTight] font-medium text-[20px] mb-4`}>Conversation Overview</Text>
                    <GlassCard style={tw`p-6 bg-white/5 border border-white/10`} noPadding>
                        <Text style={tw`text-gray-200 font-[InterTight] text-[15px] leading-6`}>
                            {summaryOverview}
                        </Text>
                    </GlassCard>
                </View>
            ) : null}

            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-[20px] mb-4`}>Key Insights</Text>
            <GlassCard style={tw`px-6 pt-6 pb-2 bg-white/5 border border-white/10 mb-8`} noPadding>
                <Text style={tw`text-gray-500 font-[InterTight] font-bold text-sm mb-4 uppercase tracking-widest`}>
                    {isSummarizing ? 'Analyzing conversation...' : 'AI generated:'}
                </Text>
                {isSummarizing ? (
                    <View style={tw`pb-4`}>
                        <ActivityIndicator color="#4fd1c5" />
                    </View>
                ) : (
                    summaryInsights.map((insight, i) => (
                        <View key={i} style={tw`flex-row items-center mb-3`}>
                            <View style={tw`w-1.5 h-1.5 bg-accent-teal rounded-full mr-3`} />
                            <Text style={tw`text-gray-200 font-[InterTight] font-light text-base flex-1`}>{insight}</Text>
                        </View>
                    ))
                )}
            </GlassCard>
 
            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-[20px] mb-4`}>Key Quotes</Text>
            {isSummarizing ? (
                <ActivityIndicator color="#4fd1c5" style={tw`mb-8`} />
            ) : (
                summaryQuotes.map((quote, i) => (
                    <GlassCard key={i} style={tw`p-5 bg-white/5 border border-white/10 mb-4`} noPadding>
                        <View style={tw`flex-row`}>
                            <View style={tw`w-1.5 h-1.5 bg-white/30 rounded-full mr-3 mt-2`} />
                            <Text style={tw`text-gray-200 font-[InterTight] font-light italic text-base leading-5 flex-1`}>
                                "{quote}"
                            </Text>
                        </View>
                    </GlassCard>
                ))
            )}

            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-[20px] mt-4 mb-4`}>Actions</Text>
            <View style={tw`mb-20`}>
                <TouchableOpacity
                    onPress={openFullTranscript}
                    style={tw`flex-row items-center justify-center border border-white/10 rounded-full py-4 px-6 mb-3`}
                >
                    <Bookmark color="#aaa" size={20} style={tw`mr-4`} />
                    <Text style={tw`text-gray-300 font-[InterTight] font-medium text-lg`}>See full transcript</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleExportHighlights}
                    style={tw`flex-row items-center justify-center border border-white/10 rounded-full py-4 px-6 mb-3`}
                >
                    <Share2 color="#aaa" size={20} style={tw`mr-4`} />
                    <Text style={tw`text-gray-300 font-[InterTight] font-medium text-lg`}>Export highlights</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={openReplay}
                    style={tw`flex-row items-center justify-center border border-white/10 rounded-full py-4 px-6 mb-3`}
                >
                    <RotateCcw color="#aaa" size={20} style={tw`mr-4`} />
                    <Text style={tw`text-gray-300 font-[InterTight] font-medium text-lg`}>Replay call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={async () => {
                        await handleNewChat();
                        setViewState('chat');
                    }}
                    style={tw`bg-white rounded-full py-4 items-center justify-center shadow-lg w-full`}
                >
                    <Text style={tw`text-black font-[InterTight] font-bold text-lg`}>Done</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <SafeAreaView style={tw`flex-1 bg-transparent`} edges={['bottom']}>
                {viewState === 'chat' && renderChatView()}
                {viewState === 'selection' && renderSelectionView()}
 
                {(viewState === 'active_call' || viewState === 'summary') && (
                    <Modal
                        visible={true}
                        animationType="slide"
                        presentationStyle="fullScreen"
                        statusBarTranslucent
                        onRequestClose={() => {
                            if (viewState === 'active_call') setShowSaveModal(true);
                            else setViewState('chat');
                        }}
                    >
                        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
                            {viewState === 'active_call' && renderActiveCallView()}
                            {viewState === 'summary' && renderSummaryView()}

                            {/* Save Conversation Modal (Refactored to Modal) */}
                            <Modal visible={saveModalRendered} transparent animationType="fade" statusBarTranslucent>
                                <Animated.View style={[tw`absolute inset-0 z-[60] items-center justify-center px-8`, { opacity: saveModalOpacity }]}>
                                    <TouchableOpacity 
                                        style={tw`absolute inset-0 bg-black/60`} 
                                        activeOpacity={1}
                                        onPress={() => {
                                            setShowSaveModal(false);
                                            setIsTimerRunning(true);
                                        }}
                                    />
                                    <BlurView intensity={30} tint="dark" style={tw`absolute inset-0 -z-10`} />
                                    <Animated.View style={[
                                        tw`bg-[#1C1C1E] w-full p-8 rounded-[40px] border border-white/10 items-center`,
                                        {
                                            transform: [{
                                                translateY: saveModalOpacity.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [50, 0]
                                                })
                                            }]
                                        }
                                    ]}>
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
                                            onPress={async () => {
                                                setIsTimerRunning(false);
                                                if (conversationId) {
                                                    await supabase.from('conversations').update({ 
                                                        status: 'completed'
                                                    }).eq('id', conversationId);
                                                }
                                                setShowSaveModal(false);
                                                setViewState('summary');
                                                fetchAISummary(); // Trigger AI summary generation
                                            }}
                                            style={tw`bg-white rounded-full py-4 items-center justify-center shadow-lg w-full mb-3`}
                                        >
                                            <Text style={tw`text-black font-[InterTight] font-medium text-lg`}>Save and Exit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowSaveModal(false);
                                                setIsTimerRunning(true);
                                            }}
                                            style={tw`w-full items-center justify-center border border-white/10 rounded-full py-4`}
                                        >
                                            <Text style={tw`text-gray-400 text-lg font-[InterTight] font-medium`}>Continue call</Text>
                                        </TouchableOpacity>
                                    </Animated.View>
                                </Animated.View>
                            </Modal>

                            {/* Notes Modal (Refactored to Modal) */}
                            <Modal visible={notesRendered} transparent animationType="none" statusBarTranslucent>
                                <Animated.View style={[tw`absolute inset-0 z-50 justify-end`, { opacity: notesOpacity }]}>
                                    <TouchableOpacity 
                                        style={tw`absolute inset-0 bg-black/60`} 
                                        activeOpacity={1}
                                        onPress={() => setShowNotes(false)} 
                                    />
                                    <Animated.View style={[
                                        tw`bg-[#1C1C1E]/80 rounded-t-[40px] border-t border-white/20 overflow-hidden`,
                                        { 
                                            height: windowHeight * 0.85,
                                            transform: [{ translateY: notesTranslateY }]
                                        }
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
                                                    onPress={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                                                    activeOpacity={0.7}
                                                    style={tw`mb-4`}
                                                >
                                                    <GlassCard style={[
                                                        tw`bg-white/5 border-white/10`,
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
                                                                    style={tw`bg-green-500/20 p-2 rounded-lg`}
                                                                    onPress={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingNoteId(null);
                                                                    }}
                                                                >
                                                                    <Check color="#44ff44" size={14} />
                                                                </TouchableOpacity>
                                                            ) : null}
                                                        </View>

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

                                        <Animated.View style={[
                                            tw`absolute bottom-0 left-0 right-0 bg-[#1C1C1E] px-8 pb-10`,
                                            { 
                                                marginBottom: keyboardHeight,
                                                transform: [{
                                                    translateY: notesTranslateY.interpolate({
                                                        inputRange: [0, windowHeight],
                                                        outputRange: [0, -windowHeight]
                                                    })
                                                }]
                                            }
                                        ]}>
                                            <View style={tw`h-px bg-white/10 w-full mb-6`} />
                                            <TextInput
                                                placeholder="Add a note..."
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                style={tw`bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-[InterTight] mb-2`}
                                                value={noteInput}
                                                onChangeText={setNoteInput}
                                                onSubmitEditing={async () => {
                                                    if (noteInput.trim() && user && conversationId) {
                                                        const newNote = {
                                                            conversation_id: conversationId,
                                                            title: 'New Note',
                                                            content: noteInput,
                                                            created_at: new Date().toISOString()
                                                        };
                                                        
                                                        const { data, error } = await supabase
                                                            .from('conversation_notes')
                                                            .insert(newNote)
                                                            .select()
                                                            .single();

                                                        if (!error && data) {
                                                            setNotes(prev => [data, ...prev]);
                                                        }
                                                        setNoteInput('');
                                                    }
                                                }}
                                            />
                                        </Animated.View>
                                    </Animated.View>
                                </Animated.View>
                            </Modal>

                            {/* Settings Modal (Refactored to Absolute View) */}
                            {settingsRendered && (
                                <Animated.View style={[tw`absolute inset-0 z-50 justify-end`, { opacity: settingsOpacity }]}>
                                    <TouchableOpacity 
                                        style={tw`absolute inset-0 bg-black/60`} 
                                        activeOpacity={1}
                                        onPress={() => setShowSettings(false)} 
                                    />
                                    <Animated.View style={[
                                        tw`bg-[#1C1C1E]/95 rounded-t-[40px] border-t border-white/20 pt-10`,
                                        { 
                                            height: windowHeight * 0.35,
                                            transform: [{
                                                translateY: settingsOpacity.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [windowHeight * 0.35, 0]
                                                })
                                            }]
                                        }
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
                                    </Animated.View>
                                </Animated.View>
                            )}

                            {/* Text Settings Modal (Refactored to Absolute View) */}
                            {textSettingsRendered && (
                                <Animated.View style={[tw`absolute inset-0 z-[100] justify-center items-center`, { opacity: textSettingsOpacity }]}>
                                    <TouchableOpacity 
                                        style={tw`absolute inset-0 bg-black/60`} 
                                        activeOpacity={1}
                                        onPress={() => setShowTextSettings(false)} 
                                    />
                                    <Animated.View style={[
                                        tw`bg-[#1C1C1E] border border-white/10 rounded-[32px] p-8 w-full max-w-sm m-6`,
                                        {
                                            transform: [{
                                                scale: textSettingsOpacity.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.95, 1]
                                                })
                                            }]
                                        }
                                    ]}>
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
                                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                                >
                                                    <Text style={tw`text-gray-500 font-[InterTight] text-base`}>A-</Text>
                                                </TouchableOpacity>
                                                <Text style={tw`text-white font-[InterTight-Bold] text-base`}>A</Text>
                                                <TouchableOpacity
                                                    onPress={() => setTranscriptionFontSize(Math.min(24, transcriptionFontSize + 2))}
                                                    style={transcriptionFontSize >= 24 ? tw`opacity-30` : tw`opacity-100`}
                                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
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
                                    </Animated.View>
                                </Animated.View>
                            )}

                            {/* Full Transcript View */}
                            {showFullTranscript && (
                                <Animated.View style={[
                                    tw`absolute inset-0 z-[70]`,
                                    { transform: [{ translateY: transcriptAnim }] }
                                ]}>
                                    <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
                                        <View style={tw`flex-1 pt-16 px-6`}>
                                            <View style={tw`flex-row justify-between items-center mb-8`}>
                                                <TouchableOpacity onPress={closeFullTranscript}>
                                                    <View style={tw`bg-white/5 p-2.5 rounded-xl border border-white/10 w-11 h-11 items-center justify-center`}>
                                                        <ChevronLeft color="#aaa" size={24} />
                                                    </View>
                                                </TouchableOpacity>
                                                <Text style={tw`text-white font-[InterTight-Bold] text-2xl`}>Full Transcript</Text>
                                                <View style={tw`w-11`} />
                                            </View>

                                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-20`}>
                                                {chatMessages.map((item: any, idx: number) => (
                                                    <View key={idx} style={tw`mb-6`}>
                                                        <Text style={tw`text-accent-teal font-[InterTight-Bold] text-sm mb-1`}>
                                                            {item.role === 'user' ? 'You' : selectedPersona.name}
                                                        </Text>
                                                        <Text style={tw`text-gray-200 font-[InterTight] text-[15px] leading-6`}>
                                                            {item.content}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    </GlassBackground>
                                </Animated.View>
                            )}

                            {/* Replay Call View */}
                            {showReplay && (
                                <Animated.View style={[
                                    tw`absolute inset-0 z-[70] items-center justify-center px-8`,
                                    { opacity: replayOpacity }
                                ]}>
                                    <BlurView intensity={40} tint="dark" style={tw`absolute inset-0`} />
                                    <Animated.View style={[
                                        tw`bg-[#1C1C1E] w-full p-8 rounded-[40px] border border-white/10 items-center shadow-2xl`,
                                        { transform: [{ scale: replayScale }] }
                                    ]}>
                                        <TouchableOpacity
                                            style={tw`absolute top-6 right-6`}
                                            onPress={closeReplay}
                                        >
                                            <X color="#aaa" size={20} />
                                        </TouchableOpacity>

                                        <View style={tw`bg-white/5 p-6 rounded-full mb-8`}>
                                            {renderPersonaIcon(selectedPersona, 80)}
                                        </View>

                                        <Text style={tw`text-white font-[InterTight-Bold] text-2xl text-center mb-2`}>
                                            {selectedPersona.name}
                                        </Text>
                                        <Text style={tw`text-gray-400 font-[InterTight] text-center mb-8`}>
                                            Playback Session
                                        </Text>

                                        {/* Progress Bar Container */}
                                        <View style={tw`w-full mb-8`}>
                                            <View
                                                onLayout={(e) => setPlaybackBarWidth(e.nativeEvent.layout.width)}
                                                {...scrubberPanResponder.panHandlers}
                                                style={tw`h-3 justify-center w-full`}
                                            >
                                                <View style={tw`h-1.5 bg-white/5 rounded-full w-full overflow-hidden`}>
                                                    <View style={[tw`h-full bg-accent-teal rounded-full`, { width: `${playbackProgress}%` }]} />
                                                </View>
                                                {/* Scrubber handle */}
                                                <View style={[
                                                    tw`absolute w-4 h-4 bg-white rounded-full shadow-lg`,
                                                    { left: `${playbackProgress}%`, marginLeft: -8 }
                                                ]} />
                                            </View>
                                            <View style={tw`flex-row justify-between mt-2`}>
                                                <Text style={tw`text-gray-500 font-[InterTight] text-xs`}>
                                                    {formatDuration(Math.floor((playbackProgress / 100) * callDuration))}
                                                </Text>
                                                <Text style={tw`text-gray-500 font-[InterTight] text-xs`}>{formatDuration(callDuration)}</Text>
                                            </View>
                                        </View>

                                        {/* Controls */}
                                        <View style={tw`flex-row items-center gap-8 mb-4`}>
                                            <TouchableOpacity onPress={() => setPlaybackProgress(Math.max(0, playbackProgress - 10))}>
                                                <SkipBack color="#fff" size={24} />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => setIsPlaying(!isPlaying)}
                                                style={tw`bg-white w-16 h-16 rounded-full items-center justify-center`}
                                            >
                                                {isPlaying ? (
                                                    <Pause color="#000" size={28} fill="#000" />
                                                ) : (
                                                    <Play color="#000" size={28} fill="#000" style={tw`ml-1`} />
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity onPress={() => setPlaybackProgress(Math.min(100, playbackProgress + 10))}>
                                                <SkipForward color="#fff" size={24} />
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                </Animated.View>
                            )}
                        </GlassBackground>
                    </Modal>
                )}
            </SafeAreaView>
        </GlassBackground>
    );
}
