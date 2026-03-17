import tw from '@/lib/tailwind';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, Modal, Platform, PanResponder, Dimensions, Share, KeyboardAvoidingView, Alert, Pressable, ActivityIndicator } from 'react-native';
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
    Bookmark,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Camera,
    Image as ImageIcon,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { AI_API } from '@/config/backend';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PERSONAS, Persona, MOCK_INSIGHTS, MOCK_QUOTES, MOCK_TRANSCRIPTION } from '@/data/dahliaData';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

type ViewState = 'selection' | 'active_call' | 'summary';
type CallMode = 'voice' | 'text';

export default function DahliaScreen() {
    const { user } = useAuth();
    const { q, id: existingConvId } = useLocalSearchParams<{ q: string, id: string }>();
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
    const [inputText, setInputText] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(existingConvId || null);
    const [isLoading, setIsLoading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

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
    const chatScrollViewRef = useRef<ScrollView>(null);

    // Pulsing animation for voice mode
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Voice Recording States
    const [voiceRecording, setVoiceRecording] = useState<Audio.Recording | null>(null);
    const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

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
                // Send transcribed text to chat
                await handleSendMessageFromVoice(data.transcription);
            }
        } catch (err) {
            console.error('Voice processing error:', err);
        } finally {
            setIsVoiceProcessing(false);
        }
    }

    /**
     * Wrapper for handleSendMessage to use transcribed text
     */
    async function handleSendMessageFromVoice(text: string) {
        // We'll adapt the existing send message logic
        setInputText(text);
        // Call existing send message
        setTimeout(() => {
            handleSendMessage();
        }, 100);
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

    // Removed old useEffects for these animations to avoid double triggers

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
<path d="M37.8438 165.647C38.4667 165.627 39.1089 165.578 39.7689 165.5C40.3163 165.219 40.8543 164.927 41.3828 164.625C39.9792 165.33 39.2219 165.533 37.8438 165.647Z" fill="#2b4e50"/>
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
                .order('created_at', { ascending: true });
            
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
        }
    }, [existingConvId, fetchMessages, fetchNotes]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user) return;
        
        let currentConvId = conversationId;
        if (!currentConvId) {
            currentConvId = await startConversation(selectedPersona);
        }

        if (!currentConvId) return;

        const text = inputText;
        setInputText('');

        const newUserMsg = { 
            conversation_id: currentConvId,
            speaker: 'user' as const, 
            message_text: text,
            created_at: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, newUserMsg]);

        try {
            const { error: insertError } = await supabase.from('conversation_messages').insert(newUserMsg);
            if (insertError) throw insertError;

            // Call Backend AI
            const response = await fetch(AI_API.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona: selectedPersona.name,
                    history: chatMessages.map(m => ({
                        role: m.speaker === 'user' ? 'user' : 'assistant',
                        content: m.message_text
                    })).concat([{ role: 'user', content: text }])
                })
            });

            const data = await response.json();
            
            if (data.response) {
                const aiResponse = {
                    conversation_id: currentConvId,
                    speaker: 'ai' as const,
                    message_text: data.response,
                    created_at: new Date().toISOString()
                };
                setChatMessages(prev => [...prev, aiResponse]);
                await supabase.from('conversation_messages').insert(aiResponse);

                // Voice Response if in voice mode
                if (callMode === 'voice') {
                    Speech.speak(data.response, {
                        pitch: 1.0,
                        rate: 1.0,
                    });
                }
            }

        } catch (err) {
            console.error('AI Send Message Error:', err);
            // Fallback for demo if backend is down
            setTimeout(async () => {
                const aiResponse = {
                    conversation_id: currentConvId,
                    speaker: 'ai' as const,
                    message_text: `I understand you're interested in ${text}. Let's explore that further. (Demo Mode)`,
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
                        speaker: 'user' as const,
                        message_text: `[File: ${fileName}]`,
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
                        setCallDuration(0);
                        await startConversation(selectedPersona);
                        setViewState('active_call');
                    }}
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
                                        {MOCK_TRANSCRIPTION[MOCK_TRANSCRIPTION.length - 1].text}
                                    </Text>
                                </ScrollView>
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
                                    <View key={idx} style={tw`mb-6 ${msg.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                                        <View style={tw`flex-row ${msg.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
                                            {renderPersonaIcon(msg.speaker === 'user' ? { icon: 'male' } as any : selectedPersona, 36)}
                                            <View style={tw`ml-3 mr-3 flex-1 ${msg.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                                                <View style={tw`rounded-2xl p-4 self-start max-w-[90%] border border-white/5 ${msg.speaker === 'user' ? 'bg-[#2b4e50]' : 'bg-white/5'}`}>
                                                    <Text style={tw`text-white font-[InterTight] leading-5`}>
                                                        {msg.message_text}
                                                    </Text>
                                                </View>
                                                <Text style={tw`text-gray-500 text-[10px] mt-1 ${msg.speaker === 'user' ? 'mr-1' : 'ml-1'}`}>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</Text>
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
                                    onSubmitEditing={handleSendMessage}
                                />
                                <TouchableOpacity 
                                    onPress={handleSendMessage}
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
                <TouchableOpacity
                    onPress={() => setShowNotes(true)}
                    style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10 w-11 h-11 items-center justify-center`}
                >
                    <FileText color="#aaa" size={22} />
                </TouchableOpacity>
            </View>

            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-[20px] mb-4`}>Key Insights</Text>
            <GlassCard style={tw`px-6 pt-6 pb-2 bg-white/5 border border-white/10 mb-8`} noPadding>
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
                                    onPress={async () => {
                                        setIsTimerRunning(false);
                                        if (conversationId) {
                                            await supabase.from('conversations').update({ 
                                                status: 'completed',
                                                metadata: {
                                                    duration: callDuration,
                                                    insights: MOCK_INSIGHTS,
                                                    quotes: MOCK_QUOTES,
                                                    summary: `Coaching session with ${selectedPersona.name}`
                                                }
                                            }).eq('id', conversationId);
                                        }
                                        setShowSaveModal(false);
                                        setViewState('summary');
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
                            </View>
                        </View>
                    </Modal>

                    {/* Notes Modal (Resizable) */}
                    <Modal visible={showNotes} transparent animationType="slide">
                        <View style={tw`flex-1 justify-end`}>
                            <TouchableOpacity style={tw`flex-1`} onPress={() => setShowNotes(false)} />
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                style={tw`flex-1 justify-end`}
                            >
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
                                                        setNotes([...notes, data]);
                                                    }
                                                    setNoteInput('');
                                                }
                                            }}
                                        />
                                    </View>
                                </Animated.View>
                            </KeyboardAvoidingView>
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

                    {/* Full Transcript View */}
                    {showFullTranscript && (
                        <Animated.View style={[
                            tw`absolute inset-0 z-50`,
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
                                        {MOCK_TRANSCRIPTION.map((item: any, idx: number) => (
                                            <View key={idx} style={tw`mb-6`}>
                                                <Text style={tw`text-accent-teal font-[InterTight-Bold] text-sm mb-1`}>
                                                    {item.speaker === 'user' ? 'You' : selectedPersona.name}
                                                </Text>
                                                <Text style={tw`text-gray-200 font-[InterTight] text-[15px] leading-6`}>
                                                    {item.text}
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
                            tw`absolute inset-0 z-50 items-center justify-center px-8`,
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
        </GlassBackground>
    );
}
