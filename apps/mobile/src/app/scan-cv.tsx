import tw from '@/lib/tailwind';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Pressable,
    Modal,
    Alert
} from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ScanText,
    MoreVertical,
    Sparkles,
    Check,
    X,
    Zap,
    ZapOff,
    SwitchCamera,
    Image as ImageIcon,
    FileText,
    Camera,
    RefreshCw
} from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    FadeIn,
    SlideInDown,
    FadeOut
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type FlowState = 'INTRO' | 'CAMERA' | 'UPLOADING' | 'ANALYZING' | 'RESULT';
type PickerType = 'UPLOAD' | 'ACTIONS' | null;

interface MenuItemProps {
    label: string;
    icon: any;
    onPress: () => void;
    isLast?: boolean;
    isDestructive?: boolean;
}

const MenuItem = ({ label, icon: Icon, onPress, isLast, isDestructive }: MenuItemProps) => (
    <TouchableOpacity
        onPress={onPress}
        style={tw`flex-row items-center justify-between py-4 ${!isLast ? 'border-b border-white/5' : ''}`}
    >
        <Text style={tw`text-[17px] font-[InterTight-Medium] ${isDestructive ? 'text-[#ff4444]' : 'text-white'}`}>
            {label}
        </Text>
        <Icon color={isDestructive ? "#ff4444" : "#fff"} size={22} />
    </TouchableOpacity>
);

export default function ScanCVScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const cameraRef = useRef<CameraView>(null);
    const [state, setState] = useState<FlowState>('INTRO');
    const [pickerType, setPickerType] = useState<PickerType>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [permission, requestPermission] = useCameraPermissions();
    const [libraryPermission, requestLibraryPermission] = ImagePicker.useMediaLibraryPermissions();

    const [torch, setTorch] = useState(false);
    const [facing, setFacing] = useState<'back' | 'front'>('back');
    const [zoom, setZoom] = useState(0.1); // Default: Zoomed in slightly (label 0.5)
    const [isAnalyzed, setIsAnalyzed] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [sourceType, setSourceType] = useState<'CAMERA' | 'GALLERY' | 'FILE' | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; isPdf: boolean } | null>(null);

    // Animation values
    const scanY = useSharedValue(0);
    const uploadProgress = useSharedValue(0);

    // Mock scanning animation
    useEffect(() => {
        if (state === 'ANALYZING') {
            scanY.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
                ),
                -1
            );

            const timer = setTimeout(() => {
                setIsAnalyzed(true);
            }, 5000);
            return () => clearTimeout(timer);
        } else {
            scanY.value = 0;
            setIsAnalyzed(false);
        }
    }, [state]);

    // Mock upload progress
    useEffect(() => {
        if (state === 'UPLOADING') {
            uploadProgress.value = withTiming(1, { duration: 2400 });
            const timer = setTimeout(() => {
                setState('ANALYZING');
            }, 2800);
            return () => clearTimeout(timer);
        } else {
            uploadProgress.value = 0;
        }
    }, [state]);

    const animatedScanStyle = useAnimatedStyle(() => ({
        left: `${scanY.value * 100}%`,
    }));

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${uploadProgress.value * 100}%`,
    }));

    const handleTakePhotoClick = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) return;
        }
        setState('CAMERA');
    };

    const takePicture = async () => {
        // In a real app: const photo = await cameraRef.current?.takePictureAsync();
        setCapturedImage('https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070');
        setSourceType('CAMERA');
        setSelectedFile(null);
        setState('ANALYZING');
    };

    const uploadCV = async (uri: string, name: string, type: string) => {
        if (!user || user.id === 'pending') return;
        setIsUploading(true);
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const fileName = `${user.id}/${Date.now()}_${name}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('cv_uploads')
                .upload(fileName, blob, { contentType: type });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('cv_uploads')
                .getPublicUrl(fileName);

            // Mock skills for now
            const detected_skills = ['Javascript dev', 'API Integration', 'React framework', 'UI/UX Design'];
            const suggested_skills = ['Version control', 'SEO', 'Technical writing', 'Git & Github'];

            const { data: scanData, error: scanError } = await supabase
                .from('cv_scans')
                .insert({
                    user_id: user.id,
                    file_url: publicUrl,
                    detected_skills,
                    suggested_skills,
                    analysis_result: {
                        score: 85,
                        feedback: "Great experience in frontend technologies."
                    }
                })
                .select()
                .single();

            if (scanError) throw scanError;

            setState('RESULT');
        } catch (err) {
            console.error('CV Upload Error:', err);
            Alert.alert("Error", "Failed to upload and analyze CV.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = async (source: 'photos' | 'camera' | 'files') => {
        setPickerType(null);
        if (!user) return;

        setTimeout(async () => {
            try {
                let result: any;
                if (source === 'camera') {
                    handleTakePhotoClick();
                    return;
                } else if (source === 'photos') {
                    result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        allowsEditing: true,
                        aspect: [5, 7],
                        quality: 0.8,
                    });
                } else if (source === 'files') {
                    result = await DocumentPicker.getDocumentAsync({
                        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                        copyToCacheDirectory: true,
                    });
                }

                if (result && !result.canceled && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    setState('UPLOADING');
                    await uploadCV(asset.uri, asset.name || `cv_${Date.now()}`, asset.mimeType || 'application/octet-stream');
                }
            } catch (err) {
                console.error(err);
                Alert.alert("Error", "Could not select file.");
            }
        }, 800);
    };

    const handleContinue = () => {
        const isUnclear = Math.random() < 0.15;
        if (isUnclear) {
            Alert.alert(
                "Photo cannot be identified",
                "The image appears to be blurry or not a valid document. Please try again with a clearer photo.",
                [
                    { text: "Take photo again", onPress: () => setState('CAMERA') },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        } else {
            setState('RESULT');
        }
    };

    const toggleSkill = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    const renderHeader = (title: string, subtitle: string) => (
        <View style={tw`px-6 pt-16 pb-6`}>
            <TouchableOpacity
                onPress={() => state === 'INTRO' ? router.back() : setState('INTRO')}
                style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mb-6`}
            >
                <ChevronLeft color="#ffffff" size={24} />
            </TouchableOpacity>
            <Text style={tw`text-white font-[InterTight] font-semibold text-3xl mb-1`}>{title}</Text>
            <Text style={tw`text-gray-400 font-[InterTight] text-lg`}>{subtitle}</Text>
        </View>
    );

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <ScrollView
                style={tw`flex-1`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-40`}
            >
                {state === 'INTRO' && renderHeader("Scan document", "Add your resume to enhance your career path")}
                {state === 'UPLOADING' && renderHeader("Upload document", "Analyze your CV for insights.")}
                {state === 'CAMERA' && renderHeader("Take a photo", "Scan and extract key skills.")}
                {state === 'ANALYZING' && renderHeader("Analyzing document", "Add your resume to enhance your career path")}
                {state === 'RESULT' && renderHeader("AI analysis result", "Here's what we found in your CV")}

                <View style={tw`px-6`}>
                    <View style={state === 'INTRO' ? tw`h-[276px] bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-8 justify-center items-center` : tw`h-[420px] bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-8 justify-center items-center`}>
                        {state === 'INTRO' ? (
                            <View style={tw`items-center justify-center p-6`}>
                                <View style={tw`w-20 h-20 rounded-full bg-white/10 items-center justify-center mb-6`}>
                                    <ScanText color="#fff" size={40} />
                                </View>
                                <Text style={tw`text-white font-[InterTight] font-semibold text-2xl text-center mb-2`}>
                                    Upload your Resume or CV
                                </Text>
                                <Text style={tw`text-gray-400 font-[InterTight] text-lg text-center px-4`}>
                                    We'll analyse your experience to personalize your career path.
                                </Text>
                            </View>
                        ) : state === 'CAMERA' ? (
                            <View style={tw`w-full h-full`}>
                                <CameraView
                                    ref={cameraRef}
                                    style={StyleSheet.absoluteFill}
                                    facing={facing}
                                    enableTorch={torch}
                                    zoom={zoom}
                                />
                                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                    <View style={tw`flex-1 items-center justify-center`}>
                                        <View style={[styles.viewfinder, { width: width * 0.7, height: height * 0.35 }]}>
                                            <View style={[styles.corner, styles.topLeft]} />
                                            <View style={[styles.corner, styles.topRight]} />
                                            <View style={[styles.corner, styles.bottomLeft]} />
                                            <View style={[styles.corner, styles.bottomRight]} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View style={tw`w-full h-full bg-white/5`}>
                                {capturedImage ? (
                                    <View style={tw`flex-1 w-full h-full bg-[#1a1a1a] items-center justify-center`}>
                                        <Image
                                            key={capturedImage}
                                            source={{ uri: capturedImage }}
                                            style={StyleSheet.absoluteFill}
                                            resizeMode="contain"
                                        />
                                        {selectedFile?.isPdf && (
                                            <View style={tw`absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex-row items-center`}>
                                                <View style={tw`w-10 h-10 bg-red-500 rounded-lg items-center justify-center mr-3`}>
                                                    <FileText color="#fff" size={20} />
                                                </View>
                                                <View style={tw`flex-1`}>
                                                    <Text style={tw`text-white font-[InterTight-SemiBold] text-sm`} numberOfLines={1}>
                                                        {selectedFile.name}
                                                    </Text>
                                                    <Text style={tw`text-gray-400 font-[InterTight] text-xs`}>
                                                        PDF Preview
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                ) : selectedFile?.isPdf ? (
                                    <View style={tw`flex-1 items-center justify-center p-8 bg-[#1a1a1a]`}>
                                        <View style={tw`w-32 h-44 bg-white rounded-xl shadow-2xl items-center justify-center mb-6 overflow-hidden`}>
                                            <View style={tw`flex-1 items-center justify-center w-full`}>
                                                <FileText color="#ff4444" size={64} />
                                            </View>
                                            <View style={tw`h-10 bg-[#ff4444] w-full items-center justify-center`}>
                                                <Text style={tw`text-white font-bold text-xs`}>PDF DOCUMENT</Text>
                                            </View>
                                        </View>
                                        <Text style={tw`text-white font-[InterTight-SemiBold] text-lg text-center px-4`} numberOfLines={2}>
                                            {selectedFile.name}
                                        </Text>
                                        <View style={tw`flex-row items-center mt-3 bg-white/10 px-3 py-1.5 rounded-full`}>
                                            <Check color="#44ff44" size={14} style={tw`mr-2`} />
                                            <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>
                                                Ready for Analysis
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <Image
                                        key="fallback"
                                        source={{ uri: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070' }}
                                        style={StyleSheet.absoluteFill}
                                        resizeMode="cover"
                                    />
                                )}
                                {(state === 'ANALYZING' || state === 'RESULT') && (
                                    <TouchableOpacity
                                        onPress={() => setPickerType('ACTIONS')}
                                        style={tw`absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 items-center justify-center border border-white/10`}
                                    >
                                        <MoreVertical color="#fff" size={20} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    {state === 'UPLOADING' && (
                        <Animated.View entering={FadeIn} style={tw`bg-white/5 border border-white/10 rounded-3xl p-5 flex-row items-center`}>
                            <View style={tw`w-12 h-12 rounded-xl bg-white/10 items-center justify-center border border-white/20`}>
                                <View style={[tw`w-8 h-8 rounded-lg items-center justify-center shadow-lg`, { shadowColor: '#fff', shadowOpacity: 0.5, shadowRadius: 10 }]}>
                                    <Image source={require('@/assets/logo.png')} style={tw`w-5 h-5`} resizeMode="cover" />
                                </View>
                            </View>
                            <View style={tw`ml-4 flex-1`}>
                                <Text style={tw`text-white font-[InterTight-Medium] mb-2`}>Uploading your document..</Text>
                                <View style={tw`h-1.5 bg-white/10 rounded-full overflow-hidden`}>
                                    <Animated.View style={[tw`h-full bg-white`, animatedProgressStyle]} />
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    {state === 'ANALYZING' && (
                        <Text style={tw`text-gray-500 text-center font-[InterTight] text-base`}>
                            This only takes a few seconds..
                        </Text>
                    )}

                    {state === 'RESULT' && (
                        <Animated.View entering={FadeIn}>
                            <Text style={tw`text-white/60 font-[InterTight] font-medium text-xl mb-4`}>Skills detected in your resume</Text>
                            <View style={tw`flex-row flex-wrap gap-2 mb-8`}>
                                {['Javascript dev', 'API Integration', 'React framework', 'UI/UX Design'].map(skill => (
                                    <View key={skill} style={tw`bg-white/5 border border-white/10 px-4 py-3 rounded-xl`}>
                                        <Text style={tw`text-white font-[InterTight] text-[15px]`}>{skill}</Text>
                                    </View>
                                ))}
                            </View>

                            <Text style={tw`text-white/60 font-[InterTight] font-medium text-xl mb-4`}>Missing or suggested skills</Text>
                            <View style={tw`flex-row flex-wrap gap-2 mb-8`}>
                                {['Version control', 'SEO', 'Technical writing', 'Git & Github'].map(skill => (
                                    <TouchableOpacity
                                        key={skill}
                                        onPress={() => toggleSkill(skill)}
                                        style={tw`flex-row items-center bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl ${selectedSkills.includes(skill) ? 'border-accent-pink bg-accent-pink/10' : ''}`}
                                    >
                                        <View style={tw`w-5 h-5 rounded bg-white/10 mr-2 items-center justify-center border border-white/20 ${selectedSkills.includes(skill) ? 'bg-accent-pink border-accent-pink' : ''}`}>
                                            {selectedSkills.includes(skill) && <Check color="#fff" size={12} />}
                                        </View>
                                        <Text style={tw`text-white font-[InterTight] text-[15px]`}>{skill}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={tw`bg-white/5 p-4 rounded-2xl flex-row items-start mb-10`}>
                                <Sparkles color="#ffffffb3" size={18} style={tw`mr-3 mt-1`} />
                                <Text style={tw`text-gray-300 font-[InterTight] flex-1 leading-5 text-base`}>
                                    To improve your career readiness, consider adding these skills.
                                </Text>
                            </View>
                        </Animated.View>
                    )}
                </View>
            </ScrollView>

            <View style={tw`absolute bottom-0 left-0 right-0 px-6 pb-12 pt-4 bg-transparent`}>
                {state === 'INTRO' && (
                    <View style={tw`gap-4`}>
                        <TouchableOpacity
                            onPress={() => setPickerType('UPLOAD')}
                            style={tw`w-full bg-white py-4 rounded-full items-center justify-center shadow-lg`}
                        >
                            <Text style={tw`text-black text-lg font-[InterTight-SemiBold]`}>Upload file</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleTakePhotoClick}
                            style={tw`w-full bg-white/10 border border-white/20 py-4 rounded-full items-center justify-center`}
                        >
                            <Text style={tw`text-white text-lg font-[InterTight-SemiBold]`}>Take photo</Text>
                        </TouchableOpacity>
                        <Text style={tw`text-gray-500 text-center font-[InterTight] text-sm mt-2`}>
                            Supports PDF, Docs or clear photos
                        </Text>
                    </View>
                )}

                {state === 'CAMERA' && (
                    <View style={tw`bg-white/10 backdrop-blur-md rounded-full px-6 py-4 flex-row items-center justify-between border border-white/20`}>
                        <TouchableOpacity
                            onPress={() => setZoom(zoom === 0.1 ? 0 : 0.1)}
                            style={tw`w-10 h-10 rounded-full bg-white/10 items-center justify-center`}
                        >
                            <Text style={tw`text-white font-bold text-xs`}>{zoom === 0.1 ? '0.5' : '1.0'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setTorch(!torch)}>
                            {torch ? <Zap color="#fff" size={24} fill="#fff" /> : <ZapOff color="#fff" size={24} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={takePicture}
                            style={tw`w-16 h-16 rounded-full border-4 border-white items-center justify-center bg-transparent`}
                        >
                            <View style={tw`w-12 h-12 rounded-full bg-white`} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
                            <SwitchCamera color="#fff" size={24} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setState('INTRO')}>
                            <X color="#fff" size={24} />
                        </TouchableOpacity>
                    </View>
                )}

                {state === 'ANALYZING' && (
                    <TouchableOpacity
                        onPress={handleContinue}
                        disabled={!isAnalyzed}
                        style={tw`w-full py-4 rounded-full items-center justify-center ${isAnalyzed ? 'bg-white' : 'bg-white/10'}`}
                    >
                        {isAnalyzed ? (
                            <Text style={tw`text-black text-lg font-[InterTight-SemiBold]`}>Continue</Text>
                        ) : (
                            <ActivityIndicator color="#fff" />
                        )}
                    </TouchableOpacity>
                )}

                {state === 'RESULT' && (
                    <TouchableOpacity
                        onPress={() => router.push('/roadmap')}
                        style={tw`w-full bg-white py-4 rounded-full items-center justify-center shadow-xl`}
                    >
                        <Text style={tw`text-black text-lg font-[InterTight-SemiBold]`}>Generate roadmap</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Modal
                transparent
                visible={pickerType !== null}
                animationType="fade"
                onRequestClose={() => setPickerType(null)}
            >
                <Pressable
                    onPress={() => setPickerType(null)}
                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                />
                <View style={tw`flex-1 justify-end px-6 pb-12`}>
                    <Animated.View
                        entering={SlideInDown}
                        exiting={FadeOut}
                        style={tw`bg-[#1c1c1e] border border-white/10 rounded-3xl p-2 shadow-2xl overflow-hidden`}
                    >
                        <View style={tw`px-4`}>
                            {pickerType === 'UPLOAD' ? (
                                <>
                                    <MenuItem label="Photos" icon={ImageIcon} onPress={() => handleFileUpload('photos')} />
                                    <MenuItem label="Files" icon={FileText} onPress={() => handleFileUpload('files')} />
                                    <MenuItem label="Cancel" icon={X} onPress={() => setPickerType(null)} isLast isDestructive />
                                </>
                            ) : (
                                <>
                                    <MenuItem label="Photos" icon={ImageIcon} onPress={() => handleFileUpload('photos')} />
                                    <MenuItem label="Camera" icon={Camera} onPress={() => handleFileUpload('camera')} />
                                    <MenuItem label="Files" icon={FileText} onPress={() => handleFileUpload('files')} />
                                    <MenuItem label="Cancel" icon={X} onPress={() => setPickerType(null)} isLast isDestructive />
                                </>
                            )}
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </GlassBackground>
    );
}

const styles = StyleSheet.create({
    viewfinder: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#fff',
    },
    topLeft: {
        top: -1,
        left: -1,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 24,
    },
    topRight: {
        top: -1,
        right: -1,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 24,
    },
    bottomLeft: {
        bottom: -1,
        left: -1,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 24,
    },
    bottomRight: {
        bottom: -1,
        right: -1,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 24,
    },
    scanLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        zIndex: 10,
    }
});
