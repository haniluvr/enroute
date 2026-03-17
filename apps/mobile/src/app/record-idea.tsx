import tw from '@/lib/tailwind';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Alert,
    Modal,
    Pressable
} from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Mic,
    Square,
    RotateCcw,
    Sparkles,
    Save,
    Send,
    Play,
    Pause,
    Circle,
    User,
    ArrowRight,
    Camera,
    Image as ImageIcon,
    FileText,
    X as CloseIcon,
    Paperclip
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { useState, useEffect, useRef } from 'react';
import { AI_API } from '@/config/backend';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSpring,
    FadeIn,
    FadeOut,
    SlideInDown,
    Layout
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

const { width, height } = Dimensions.get('window');

type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

type FlowState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'REFINE';

export default function RecordIdeaScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [state, setState] = useState<FlowState>('IDLE');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [transcription, setTranscription] = useState("I'm thinking about transitioning into UI Engineering. I have a strong background in backend development but I've always been more interested in the visual and interactive side of things. I want to build premium experiences.");
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    // Pulse animation for recording
    const pulse = useSharedValue(1);
    const micScale = useSharedValue(1);

    useEffect(() => {
        console.log('RecordIdeaScreen Auth State Change:', {
            id: user?.id,
            email: user?.email,
            isPending: user?.id === 'pending'
        });
    }, [user]);

    useEffect(() => {
        if (state === 'RECORDING') {
            pulse.value = withRepeat(
                withTiming(1.6, { duration: 1200 }),
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

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    // Start Conversation in Supabase
    const startIdeaConversation = async () => {
        console.log('Starting idea conversation. Local user state:', user?.id, user?.email);
        
        let currentUser = user;
        
        // If local user is missing or pending, try to get fresh session from Supabase directly
        if (!currentUser || currentUser.id === 'pending') {
            console.log('Local user state is incomplete. Attempting to fetch fresh user from Supabase...');
            const { data: { user: freshUser } } = await supabase.auth.getUser();
            if (freshUser) {
                console.log('Successfully fetched fresh user:', freshUser.id);
                currentUser = freshUser;
            }
        }

        if (!currentUser) {
            console.log('Conversation blocked: User is completely null');
            return 'AUTH_REQUIRED';
        }

        // We allow 'pending' users (registered but not verified) to save notes
        // If they have an ID (even 'pending'), we use it
        const finalUserId = currentUser.id === 'pending' ? 'anonymous' : currentUser.id;
        
        try {
            const insertData: any = {
                persona_name: 'IdeaBot',
                title: 'New Idea Record',
                status: 'active'
            };
            
            if (currentUser.id !== 'pending') {
                insertData.user_id = currentUser.id;
            }
            // If user is pending, it might fail insert if user_id is required
            // Let's check common behavior. Usually we'd use a temporary ID or allow null user_id
            
            const { data, error } = await supabase
                .from('conversations')
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;
            console.log('Conversation created:', data.id);
            setConversationId(data.id);
            return data.id;
        } catch (err: any) {
            console.error('Start Idea Error:', err);
            return err.message || 'DB_ERROR';
        }
    };

    /**
     * Start Audio Recording
     */
    async function startRecording() {
        try {
            if (permissionResponse?.status !== 'granted') {
                console.log('Requesting permissions..');
                await requestPermission();
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('Starting recording..');
            const { recording } = await Audio.Recording.createAsync( 
                Audio.RecordingOptionsPresets.HIGH_QUALITY 
            );
            setRecording(recording);
            setSeconds(0);
            setState('RECORDING');
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert("Error", "Could not start recording.");
        }
    }

    /**
     * Stop Audio Recording & Send to Backend
     */
    async function stopRecording() {
        console.log('Stopping recording..');
        if (!recording) return;

        setState('PROCESSING');
        setRecording(null);
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        
        const uri = recording.getURI(); 
        console.log('Recording stopped and stored at', uri);

        if (uri) {
            setAudioUri(uri);
            await transcribeAudio(uri);
        }
    }

    /**
     * Upload to Backend STT
     */
    async function transcribeAudio(uri: string) {
        try {
            const formData = new FormData();
            // @ts-ignore
            formData.append('audio', {
                uri,
                type: 'audio/m4a',
                name: 'recording.m4a',
            });

            const response = await fetch(AI_API.STT, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.transcription) {
                setTranscription(data.transcription);
                const result = await startIdeaConversation();
                setState('REFINE'); // Switch UI immediately
                
                // If result is a valid UUID
                if (typeof result === 'string' && result.includes('-') && result.length > 20) {
                    fetchInitialAIResponse(result, data.transcription); 
                } else if (result === 'AUTH_REQUIRED') {
                    Alert.alert("Note", "Sign in to save this idea and chat with Dahlia!");
                } else {
                    Alert.alert("Error", `We saved your thought but couldn't start a chat session: ${result}`);
                }
            } else {
                throw new Error('Transcription failed');
            }
        } catch (err) {
            console.error('Transcription Error:', err);
            Alert.alert("Error", "Failed to transcribe your thoughts. Please try again.");
            setState('IDLE');
        }
    }

    /**
     * Get first AI response based on transcribed idea
     */
    async function fetchInitialAIResponse(convId: string, transcribedText: string) {
        try {
            console.log('Fetching initial AI response for:', transcribedText);
            
            // Add a "Thinking" placeholder
            const thinkingMsg: Message = {
                role: 'assistant',
                content: 'Dahlia is analyzing your idea...',
                timestamp: new Date()
            };
            setMessages([thinkingMsg]);

            const response = await fetch(AI_API.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona: 'IdeaBot',
                    history: [{ role: 'user', content: `Here is my career idea: ${transcribedText}. Please analyze it and ask me 1-2 follow up questions.` }]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('AI Chat Error Response:', errorText);
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();
            console.log('AI Response data:', data);

            if (data.response) {
                const aiMessage: Message = {
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date()
                };
                // Replace thinking placeholder
                setMessages([aiMessage]);
                await supabase.from('conversation_messages').insert({
                    conversation_id: convId,
                    role: 'assistant',
                    content: data.response
                });
            } else {
                setMessages(prev => prev.filter(m => m.content !== 'Dahlia is analyzing your idea...'));
                console.warn('AI returned empty response');
            }
        } catch (err: any) {
            console.error('Initial AI Error:', err.message);
            Alert.alert("Dahlia is quiet", "The AI couldn't generate a response right now, but your idea is saved!");
        }
    }

    const animatedPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: withTiming(state === 'RECORDING' ? 0.3 : 0, { duration: 500 }),
    }));

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRestart = () => {
        if (state === 'REFINE') {
            Alert.alert(
                "Restart Recording",
                "Would you like to save the current conversation before restarting?",
                [
                    {
                        text: "Yes, Save",
                        onPress: () => {
                            handleSave();
                            setState('IDLE');
                        }
                    },
                    {
                        text: "No, Just Restart",
                        onPress: () => setState('IDLE'),
                        style: "destructive"
                    },
                    {
                        text: "Cancel",
                        style: "cancel"
                    }
                ]
            );
        } else {
            setState('IDLE');
        }
    };

    const handleSave = async () => {
        if (!user || !conversationId) return;
        setIsSaving(true);
        try {
            let recordingUrl = null;

            // Upload Audio if available
            if (audioUri) {
                const response = await fetch(audioUri);
                const blob = await response.blob();
                const fileName = `${user.id}/ideas/${Date.now()}.m4a`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('idea_recordings')
                    .upload(fileName, blob, { contentType: 'audio/m4a' });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('idea_recordings')
                        .getPublicUrl(fileName);
                    recordingUrl = publicUrl;
                }
            }

            // Save messages if any
            if (messages.length > 0) {
                const messagesToInsert = messages.map(msg => ({
                    conversation_id: conversationId,
                    role: msg.role,
                    content: msg.content
                }));
                await supabase.from('conversation_messages').insert(messagesToInsert);
            }

            // Mark as library item
            await supabase.from('library_saves').insert({
                user_id: user.id,
                item_type: 'idea',
                item_id: conversationId,
                title: transcription.substring(0, 50) + '...',
                metadata: {
                    audio_url: recordingUrl
                }
            });

            Alert.alert("Success", "Idea saved to your library.");
            router.replace('/library');
        } catch (err) {
            console.error('Save Idea Error:', err);
            Alert.alert("Error", "Failed to save idea.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (type: 'photos' | 'camera' | 'files') => {
        setShowUploadModal(false);
        try {
            if (type === 'photos') {
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
                if (!result.canceled) Alert.alert("Upload", "Image uploaded to chat.");
            } else if (type === 'camera') {
                const result = await ImagePicker.launchCameraAsync({ quality: 1 });
                if (!result.canceled) Alert.alert("Upload", "Photo uploaded to chat.");
            } else if (type === 'files') {
                const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
                if (!result.canceled) Alert.alert("Upload", "File uploaded to chat.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !conversationId) return;

        const newMessage: Message = {
            role: 'user',
            content: inputText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        const currentInput = inputText;
        setInputText('');
        Keyboard.dismiss();

        // Add thinking placeholder
        const thinkingMsg: Message = {
            role: 'assistant',
            content: 'Thinking...',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, thinkingMsg]);

        try {
            await supabase.from('conversation_messages').insert({
                conversation_id: conversationId,
                role: 'user',
                content: currentInput
            });

            // Call Backend AI
            const response = await fetch(AI_API.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona: 'IdeaBot',
                    history: messages.map(m => ({
                        role: m.role,
                        content: m.content
                    })).concat([{ role: 'user', content: currentInput }])
                })
            });

            const data = await response.json();
            
            if (data.response) {
                // Remove thinking message and add actual AI response
                setMessages(prev => {
                    const newMessages = prev.filter(msg => msg.content !== 'Thinking...');
                    const aiResponse: Message = {
                        role: 'assistant',
                        content: data.response,
                        timestamp: new Date()
                    };
                    return [...newMessages, aiResponse];
                });
                
                await supabase.from('conversation_messages').insert({
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: data.response
                });

                scrollViewRef.current?.scrollToEnd({ animated: true });
            }
        } catch (err) {
            console.error('Send Message Error:', err);
            Alert.alert("Error", "Failed to get AI response.");
        }
    };

    const renderHeader = () => (
        <View style={tw`px-6 pt-16 pb-4 flex-row items-center justify-between`}>
            <TouchableOpacity
                onPress={() => state === 'IDLE' ? router.back() : setState('IDLE')}
                style={tw`w-11 h-11 rounded-2xl bg-white/10 border border-white/10 items-center justify-center`}
                activeOpacity={0.7}
            >
                <ChevronLeft color="#fff" size={24} />
            </TouchableOpacity>

            <View style={tw`items-center`}>
                <Text style={tw`text-white font-[InterTight-Bold] text-lg`}>
                    {state === 'IDLE' ? "Record Idea" :
                        state === 'RECORDING' ? "Recording" :
                            state === 'PROCESSING' ? "Analyzing" : "Refine Idea"}
                </Text>
                {state === 'RECORDING' && (
                    <Text style={tw`text-accent-violet font-[InterTight-Medium] text-xs`}>{formatTime(seconds)}</Text>
                )}
            </View>

            <TouchableOpacity
                onPress={handleRestart}
                style={tw`w-11 h-11 rounded-2xl bg-white/10 border border-white/10 items-center justify-center`}
                activeOpacity={0.7}
            >
                <RotateCcw color="#fff" size={20} />
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1`}
        >
            <GlassBackground locations={[0.0, 0.1, 0.3, 0.7]}>
                {renderHeader()}

                {state !== 'REFINE' ? (
                    <View style={tw`flex-1 px-6 justify-center items-center`}>
                        {/* Recording Visualization Area */}
                        <View style={tw`w-full h-80 items-center justify-center`}>
                            {state === 'IDLE' && (
                                <Animated.View entering={FadeIn.duration(800)} style={tw`items-center`}>
                                    <TouchableOpacity
                                        onPress={startRecording}
                                        activeOpacity={0.8}
                                        onPressIn={() => micScale.value = withSpring(0.9)}
                                        onPressOut={() => micScale.value = withSpring(1)}
                                        style={tw`w-28 h-28 rounded-full bg-white/10 border border-white/20 items-center justify-center shadow-2xl`}
                                    >
                                        <View style={tw`w-20 h-20 rounded-full bg-accent-violet items-center justify-center`}>
                                            <Mic color="#fff" size={38} />
                                        </View>
                                    </TouchableOpacity>
                                    <Text style={tw`text-white font-[InterTight-SemiBold] text-2xl mt-8 mb-2`}>Tap to start</Text>
                                    <Text style={tw`text-gray-400 font-[InterTight] text-[15px] text-center px-8`}>
                                        Speak naturally about your goals, questions, or random career sparks.
                                    </Text>
                                </Animated.View>
                            )}
 
                            {state === 'RECORDING' && (
                                <View style={tw`items-center justify-center`}>
                                    <Animated.View style={[tw`absolute w-48 h-48 rounded-full bg-accent-violet/20`, animatedPulseStyle]} />
                                    <Animated.View style={[tw`absolute w-64 h-64 rounded-full bg-accent-violet/10`, animatedPulseStyle]} />
                                    <TouchableOpacity
                                        onPress={stopRecording}
                                        style={tw`w-28 h-28 rounded-full bg-white items-center justify-center z-10 shadow-xl shadow-accent-violet/50`}
                                    >
                                        <Square color="#8b5cf6" size={32} fill="#8b5cf6" />
                                    </TouchableOpacity>
                                    <Text style={tw`text-white font-[InterTight-Medium] text-[17px] mt-12 opacity-60`}>Listening to your thoughts...</Text>
                                </View>
                            )}

                            {state === 'PROCESSING' && (
                                <Animated.View entering={FadeIn} style={tw`items-center`}>
                                    <ActivityIndicator color="#8b5cf6" size="large" />
                                    <Text style={tw`text-white font-[InterTight-Medium] text-xl mt-8`}>Dahlia is thinking...</Text>
                                    <Text style={tw`text-gray-400 font-[InterTight] mt-2`}>Synthesizing your career insights</Text>
                                </Animated.View>
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={tw`flex-1`}>
                        <ScrollView
                            ref={scrollViewRef}
                            style={tw`flex-1`}
                            contentContainerStyle={tw`px-6 pb-32 pt-4`}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Transcription Header Card */}
                            <Animated.View entering={SlideInDown.duration(600)} style={tw`mb-8`}>
                                <GlassCard style={tw`bg-white/10 border-white/20 p-6`} noPadding>
                                    <View style={tw`flex-row items-center mb-4`}>
                                        <View style={tw`w-8 h-8 rounded-full bg-accent-violet/20 items-center justify-center mr-3`}>
                                            <Sparkles color="#8b5cf6" size={16} />
                                        </View>
                                        <Text style={tw`text-white font-[InterTight-SemiBold] text-base`}>Original Thought</Text>
                                    </View>
                                    <Text style={tw`text-gray-200 font-[InterTight] text-[15px] leading-6 italic`}>
                                        "{transcription}"
                                    </Text>
                                </GlassCard>
                            </Animated.View>

                            {/* Chat Messages */}
                            {messages.map((msg, index) => (
                                <Animated.View
                                    key={index}
                                    entering={FadeIn.delay(index * 100)}
                                    layout={Layout.springify()}
                                    style={tw`mb-6 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <View style={tw`flex-row ${msg.role === 'user' ? 'flex-row-reverse' : ''} max-w-[85%]`}>
                                        <View style={tw`w-8 h-8 rounded-full items-center justify-center ${msg.role === 'user' ? 'bg-white/20 ml-3' : 'bg-accent-violet mt-1 mr-3'}`}>
                                            {msg.role === 'user' ? <User color="#fff" size={16} /> : <Sparkles color="#fff" size={16} />}
                                        </View>
                                        <View style={tw`p-4 rounded-2xl ${msg.role === 'assistant' ? 'bg-white/5 border border-white/10 rounded-tl-none' : 'bg-accent-violet rounded-tr-none'}`}>
                                            <Text style={tw`text-white font-[InterTight] text-[15px] leading-5`}>
                                                {msg.content}
                                            </Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            ))}
                        </ScrollView>

                        {/* Input Area */}
                        <BlurView intensity={30} tint="dark" style={tw`absolute bottom-0 left-0 right-0 p-6 pt-4 border-t border-white/10`}>
                            {/* Debug Info */}
                            <Text style={tw`text-[10px] text-white/20 text-center mb-2`}>
                                ID: {user?.id} | State: {state}
                            </Text>
                            <View style={tw`flex-row items-center gap-3`}>
                                <View style={tw`flex-1 flex-row items-center bg-white/5 border border-white/10 rounded-full p-2`}>
                                    <TouchableOpacity 
                                        onPress={() => setShowUploadModal(true)} 
                                        style={tw`p-2`}
                                    >
                                        <Paperclip color="#aaa" size={20} />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={tw`flex-1 text-white font-[InterTight] text-[15px] px-2 py-3`}
                                        placeholder="Add more details..."
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        value={inputText}
                                        onChangeText={setInputText}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        onPress={handleSendMessage}
                                        disabled={!inputText.trim()}
                                        style={tw`w-10 h-10 rounded-full bg-white items-center justify-center ml-2 ${!inputText.trim() ? 'opacity-50' : ''}`}
                                    >
                                        <Send color="#000" size={18} />
                                    </TouchableOpacity>
                                </View>
                                
                                <TouchableOpacity
                                    onPress={handleSave}
                                    style={tw`w-14 h-14 rounded-full bg-accent-violet items-center justify-center shadow-lg shadow-accent-violet/30`}
                                >
                                    <Save color="#fff" size={24} />
                                </TouchableOpacity>
                            </View>
                        </BlurView>

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
                    </View>
                )}
            </GlassBackground>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({});
