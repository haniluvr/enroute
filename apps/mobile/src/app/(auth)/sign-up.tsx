import tw from '@/lib/tailwind';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    Modal,
    FlatList,
    Animated,
    Dimensions,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, ChevronDown, Check, X } from 'lucide-react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const CAREER_INTERESTS = [
    'Software Engineering',
    'Data Science',
    'UX/UI Design',
    'Product Management',
    'Business Analysis',
    'Cybersecurity',
    'Project Management',
    'Digital Marketing',
];

const CURRENT_LEVELS = [
    'Student',
    'Entry',
    'Intermediate',
    'Experienced',
    'Advanced',
    'Expert',
];

const PERSONAS = [
    { id: 'male', label: 'Male', icon: '🧑', description: 'Deep & clear' },
    { id: 'female', label: 'Female', icon: '👩', description: 'Warm & expressive' },
    { id: 'neutral', label: 'Dahlia', icon: '🌸', description: 'Calm & balanced' },
];

const TOTAL_STEPS = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StepProgressBar({ currentStep }: { currentStep: number }) {
    return (
        <View style={tw`flex-row gap-2 mb-5`}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        tw`h-[3px] rounded-full flex-1`,
                        i < currentStep ? tw`bg-white` : tw`bg-white/25`,
                    ]}
                />
            ))}
        </View>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={tw`mb-5`}>
            <Text style={tw`text-white font-[InterTight] font-medium text-sm mb-2`}>{label}</Text>
            {children}
        </View>
    );
}

function DropdownSelector({
    value,
    placeholder,
    options,
    onSelect,
}: {
    value: string;
    placeholder: string;
    options: string[];
    onSelect: (val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOpen(true)}
                style={[
                    tw`flex-row items-center justify-between border rounded-xl px-4`,
                    { height: 54, borderColor: 'rgba(255,255,255,0.2)' },
                ]}
            >
                <Text style={value ? tw`text-white font-[InterTight] text-base` : tw`text-gray-400 font-[InterTight] text-base`}>
                    {value || placeholder}
                </Text>
                <ChevronDown color="#9ca3af" size={18} />
            </TouchableOpacity>

            <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)} />
                <View style={styles.dropdownSheet}>
                    <View style={tw`flex-row justify-between items-center px-6 pt-5 pb-3`}>
                        <Text style={tw`text-white font-[InterTight] font-bold text-lg`}>Select an option</Text>
                        <TouchableOpacity onPress={() => setOpen(false)}>
                            <X color="#999" size={22} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item}
                        contentContainerStyle={{ paddingBottom: 32 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => { onSelect(item); setOpen(false); }}
                                style={[
                                    tw`flex-row items-center justify-between px-6 py-4`,
                                    item === value && { backgroundColor: 'rgba(117,0,128,0.15)' },
                                ]}
                            >
                                <Text style={tw`text-white font-[InterTight] text-base`}>{item}</Text>
                                {item === value && <Check color="#6d3659" size={18} />}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </>
    );
}

// ─── Persona Card ─────────────────────────────────────────────────────────────

function PersonaCard({
    persona,
    isSelected,
    onPress,
    extraStyle,
}: {
    persona: typeof PERSONAS[number];
    isSelected: boolean;
    onPress: () => void;
    extraStyle?: object;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.personaCard,
                isSelected && styles.personaCardSelected,
                extraStyle,
            ]}
        >
            <Text style={{ fontSize: 36, marginBottom: 10 }}>{persona.icon}</Text>
            <Text style={tw`text-white font-[InterTight] font-bold text-base text-center mb-1`}>
                {persona.label}
            </Text>
            <Text style={tw`text-gray-400 font-[InterTight] text-xs text-center`}>
                {persona.description}
            </Text>
            {isSelected && (
                <View style={styles.personaCheckmark}>
                    <Check color="#ffffff" size={12} />
                </View>
            )}
        </TouchableOpacity>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignUpScreen() {
    const [step, setStep] = useState(1);

    // Step 1
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 2
    const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

    // Step 3
    const [nickname, setNickname] = useState('');
    const [careerInterest, setCareerInterest] = useState('');
    const [currentLevel, setCurrentLevel] = useState('');

    // Shared
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Animated modal
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const cardTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (showSuccessModal) {
            Animated.parallel([
                Animated.timing(backdropOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.spring(cardTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(cardTranslateY, { toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true }),
            ]).start();
        }
    }, [showSuccessModal]);

    const handleBack = () => {
        if (step === 1) router.back();
        else setStep((s) => s - 1);
    };

    const handleModalClose = () => {
        setShowSuccessModal(false);
        router.replace('/(tabs)/home');
    };

    const handlePersonaSelect = (id: string) => {
        setSelectedPersona(id);
        // TODO: Play voice preview for selected persona
    };

    const handleFinish = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setShowSuccessModal(true);
        }, 1500);
    };

    const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password;

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <SafeAreaView style={tw`flex-1`}>

                {/* ── Shared Header ── */}
                <View style={tw`px-6 pt-2 pb-2`}>
                    <StepProgressBar currentStep={step} />
                    <TouchableOpacity
                        onPress={handleBack}
                        style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center`}
                    >
                        <ChevronLeft color="#ffffff" size={24} />
                    </TouchableOpacity>
                </View>

                {/* ── Step 1: Account Details ── */}
                {step === 1 && (
                    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
                        <View style={tw`px-6 pt-6 flex-1`}>
                            <Text style={tw`text-3xl text-white font-[InterTight] font-bold mb-3`}>
                                Create an account
                            </Text>
                            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-base leading-6 mb-10`}>
                                Please fill in your details to log you back into your enroute account
                            </Text>

                            <FormField label="First Name">
                                <View style={styles.inputRow}>
                                    <TextInput style={styles.input} placeholder="Enter first name" placeholderTextColor="#666" value={firstName} onChangeText={setFirstName} />
                                </View>
                            </FormField>

                            <FormField label="Last Name">
                                <View style={styles.inputRow}>
                                    <TextInput style={styles.input} placeholder="Enter last name" placeholderTextColor="#666" value={lastName} onChangeText={setLastName} />
                                </View>
                            </FormField>

                            <FormField label="Phone Number">
                                <View style={styles.inputRow}>
                                    <TextInput style={styles.input} placeholder="Enter phone number" placeholderTextColor="#666" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                                </View>
                            </FormField>

                            <FormField label="Password">
                                <View style={[styles.inputRow, tw`relative justify-center`]}>
                                    <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor="#666" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={tw`absolute right-4`} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        {showPassword ? <EyeOff color="#666" size={20} /> : <Eye color="#666" size={20} />}
                                    </TouchableOpacity>
                                </View>
                            </FormField>

                            {/* Confirm Password — only shown when password has text */}
                            {password.length > 0 && (
                                <FormField label="Confirm Password">
                                    <View style={[styles.inputRow, tw`relative justify-center`, passwordMismatch && { borderColor: '#FF453A' }]}>
                                        <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor="#666" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
                                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={tw`absolute right-4`} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                            {showConfirmPassword ? <EyeOff color="#666" size={20} /> : <Eye color="#666" size={20} />}
                                        </TouchableOpacity>
                                    </View>
                                    {passwordMismatch && (
                                        <Text style={tw`text-[#FF453A] font-[InterTight] text-xs mt-2 ml-1`}>Passwords do not match</Text>
                                    )}
                                </FormField>
                            )}
                        </View>

                        <View style={tw`px-6 mt-4`}>
                            <TouchableOpacity onPress={() => setStep(2)} activeOpacity={0.85} style={tw`w-full bg-white py-4 rounded-full items-center justify-center`}>
                                <Text style={tw`text-black text-lg font-[InterTight] font-semibold`}>Get started</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}

                {/* ── Step 2: AI Persona ── */}
                {step === 2 && (
                    <View style={tw`flex-1 px-6 pt-6`}>
                        <Text style={tw`text-3xl text-white font-[InterTight] font-bold mb-3`}>Setup AI persona</Text>
                        <Text style={tw`text-gray-400 font-[InterTight] font-medium text-base leading-6 mb-10`}>
                            Choose an avatar or voice you'd like to hear speak.
                        </Text>

                        {/* Cards — aligned to center so Dahlia card below is naturally centered */}
                        <View style={{ gap: 12, marginBottom: 'auto', alignItems: 'center' }}>
                            {/* Row 1: Male + Female */}
                            <View style={{ flexDirection: 'row', gap: 12, alignSelf: 'stretch' }}>
                                {PERSONAS.slice(0, 2).map((persona) => (
                                    <PersonaCard
                                        key={persona.id}
                                        persona={persona}
                                        isSelected={selectedPersona === persona.id}
                                        onPress={() => handlePersonaSelect(persona.id)}
                                    />
                                ))}
                            </View>

                            {/* Row 2: Dahlia — centered */}
                            <PersonaCard
                                persona={PERSONAS[2]}
                                isSelected={selectedPersona === PERSONAS[2].id}
                                onPress={() => handlePersonaSelect(PERSONAS[2].id)}
                                extraStyle={{ flex: 0, width: '47%' }}
                            />
                        </View>

                        <View style={tw`pb-10 mt-8`}>
                            <TouchableOpacity onPress={() => setStep(3)} activeOpacity={0.85} style={tw`w-full bg-white py-4 rounded-full items-center justify-center`}>
                                <Text style={tw`text-black text-lg font-[InterTight] font-semibold`}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ── Step 3: Personalize ── */}
                {step === 3 && (
                    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
                        <View style={tw`px-6 pt-6 flex-1`}>
                            <Text style={tw`text-3xl text-white font-[InterTight] font-bold mb-3`}>
                                Personalize your experience
                            </Text>
                            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-base leading-6 mb-10`}>
                                Personalize your profile and choose a nickname you'd like to be called.
                            </Text>

                            <FormField label="Nickname">
                                <View style={styles.inputRow}>
                                    <TextInput style={styles.input} placeholder="Enter nickname" placeholderTextColor="#666" value={nickname} onChangeText={setNickname} />
                                </View>
                            </FormField>

                            <FormField label="Career Interest">
                                <DropdownSelector value={careerInterest} placeholder="Select career interest" options={CAREER_INTERESTS} onSelect={setCareerInterest} />
                            </FormField>

                            <FormField label="Current Level">
                                <DropdownSelector value={currentLevel} placeholder="Select current level" options={CURRENT_LEVELS} onSelect={setCurrentLevel} />
                            </FormField>
                        </View>

                        <View style={tw`px-6 mt-4`}>
                            <TouchableOpacity onPress={handleFinish} disabled={isLoading} activeOpacity={0.85} style={tw`w-full bg-white py-4 rounded-full items-center justify-center`}>
                                <Text style={tw`text-black text-lg font-[InterTight] font-semibold`}>
                                    {isLoading ? 'Setting up...' : 'Continue'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}

            </SafeAreaView>

            {/* ── Success Modal ── */}
            <Modal transparent visible={showSuccessModal} animationType="none" onRequestClose={handleModalClose} statusBarTranslucent>
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {/* Dissolving blurred backdrop */}
                    <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
                        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                    </Animated.View>

                    {/* Sliding card */}
                    <Animated.View style={[tw`absolute bottom-0 left-0 right-0 px-4 pb-4`, { transform: [{ translateY: cardTranslateY }] }]}>
                        <View style={tw`w-full bg-[#1C1C1E] rounded-3xl p-6 pt-10 border border-white/10 items-center shadow-2xl`}>
                            <TouchableOpacity onPress={handleModalClose} style={tw`absolute top-4 right-4 w-9 h-9 bg-white/10 rounded-xl items-center justify-center z-10`}>
                                <X color="#999" size={20} />
                            </TouchableOpacity>

                            <Text style={tw`text-3xl text-white font-[InterTight] font-medium mt-8 mb-2 text-center`}>
                                You're all set, {nickname || firstName}!
                            </Text>
                            <Text style={tw`text-gray-400 font-[InterTight] text-lg text-center leading-5 mb-4 px-2`}>
                                Ask questions, get career roadmaps,{'\n'}and explore resources
                            </Text>

                            <LottieView source={require('@/assets/success.json')} autoPlay loop={false} style={tw`w-30 h-30`} />
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </GlassBackground>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    inputRow: {
        height: 54,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 16,
        color: '#ffffff',
        fontFamily: 'InterTight',
        fontSize: 16,
    },
    personaCard: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingVertical: 24,
        paddingHorizontal: 8,
        alignItems: 'center',
        position: 'relative',
    },
    personaCardSelected: {
        borderColor: '#6d3659',
        backgroundColor: 'rgba(117,0,128,0.12)',
    },
    personaCheckmark: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#6d3659',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    dropdownSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        maxHeight: '60%',
    },
});
