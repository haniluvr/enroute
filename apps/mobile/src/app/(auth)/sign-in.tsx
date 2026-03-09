import tw from '@/lib/tailwind';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, Animated, Dimensions } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Link, router } from 'expo-router';
import { supabase } from '@/config/supabase';
import { ChevronLeft, Eye, EyeOff, X } from 'lucide-react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import { useAuth } from '@/hooks/useAuth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SignInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userName, setUserName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // State to track if the login attempt failed
    const [hasLoginFailed, setHasLoginFailed] = useState(false);

    // Animated modal values
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const cardTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const { signIn } = useAuth();

    useEffect(() => {
        if (showSuccessModal) {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1, duration: 280, useNativeDriver: true,
                }),
                Animated.spring(cardTranslateY, {
                    toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 0, duration: 200, useNativeDriver: true,
                }),
                Animated.timing(cardTranslateY, {
                    toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true,
                }),
            ]).start();
        }
    }, [showSuccessModal]);

    const handleLogin = async () => {
        setIsLoading(true);
        setHasLoginFailed(false);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            setUserName(data.user?.user_metadata?.first_name || data.user?.user_metadata?.nickname || email.split('@')[0]);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Login error:', error);
            setHasLoginFailed(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalClose = async () => {
        setShowSuccessModal(false);
        await signIn(email || 'admin@enroute.dev');
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <SafeAreaView style={tw`flex-1 justify-between`}>

                <View style={tw`px-6 pt-4`}>
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mb-8`}
                    >
                        <ChevronLeft color="#ffffff" size={24} />
                    </TouchableOpacity>

                    {/* Headers */}
                    <Text style={tw`text-3xl text-white font-[InterTight] font-bold mb-3`}>
                        Login to your account 👋
                    </Text>
                    <Text style={tw`text-gray-400 font-[InterTight] font-medium text-base leading-6 mb-10`}>
                        Please fill in your details to log you back into your enroute account
                    </Text>

                    {/* Form Fields */}
                    <View style={tw`mb-5`}>
                        <Text style={tw`text-white font-[InterTight] font-medium text-sm mb-2`}>Email</Text>
                        <View style={tw`relative justify-center h-[54px]`}>
                            <TextInput
                                style={[tw`flex-1 bg-transparent border border-white/20 rounded-xl pl-4 text-white font-[InterTight] text-base`, { lineHeight: undefined }]}
                                placeholder="Enter email address"
                                placeholderTextColor="#666"
                                textAlignVertical='center'
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <View style={tw`mb-2`}>
                        <Text style={tw`text-white font-[InterTight] font-medium text-sm mb-2`}>Password</Text>
                        <View style={tw`relative justify-center h-[54px]`}>
                            <TextInput
                                style={[tw`flex-1 bg-transparent border border-white/20 rounded-xl pl-4 text-white font-[InterTight] text-base`, { lineHeight: undefined }]}
                                placeholder="Enter password"
                                placeholderTextColor="#666"
                                textAlignVertical='center'
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={tw`absolute right-4`}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                {showPassword ? (
                                    <EyeOff color="#666" size={20} />
                                ) : (
                                    <Eye color="#666" size={20} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Forgot Password */}
                    {hasLoginFailed && (
                        <TouchableOpacity style={tw`self-end mb-8`}>
                            <Text style={tw`text-[#FF453A] font-[InterTight] font-medium text-sm`}>
                                Forgot password?
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bottom Actions */}
                <View style={tw`px-6 pb-8`}>
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.85}
                        style={tw`w-full bg-white py-4 rounded-full items-center justify-center mb-6`}
                    >
                        <Text style={tw`text-black text-lg font-[InterTight] font-semibold`}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Text>
                    </TouchableOpacity>

                    <View style={tw`flex-row justify-center`}>
                        <Text style={tw`text-gray-400 font-[InterTight] font-medium text-base`}>
                            Don't have an account?{' '}
                        </Text>
                        <Link href="/(auth)/sign-up" asChild>
                            <TouchableOpacity>
                                <Text style={tw`text-white font-[InterTight] font-bold text-base`}>
                                    Signup
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

            </SafeAreaView>

            {/* Success Modal */}
            <Modal
                transparent
                visible={showSuccessModal}
                animationType="none"
                onRequestClose={handleModalClose}
                statusBarTranslucent
            >
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {/* Dissolving blurred backdrop */}
                    <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
                        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                    </Animated.View>

                    {/* Sliding card */}
                    <Animated.View
                        style={[
                            tw`absolute bottom-0 left-0 right-0 px-4 pb-4`,
                            { transform: [{ translateY: cardTranslateY }] },
                        ]}
                    >
                        <View style={tw`w-full bg-[#1C1C1E] rounded-3xl p-6 pt-10 border border-white/10 items-center shadow-2xl`}>
                            {/* Close Button */}
                            <TouchableOpacity
                                onPress={handleModalClose}
                                style={tw`absolute top-4 right-4 w-9 h-9 bg-white/10 rounded-xl items-center justify-center z-10`}
                            >
                                <X color="#999" size={20} />
                            </TouchableOpacity>

                            {/* Title and Text */}
                            <Text style={tw`text-3xl text-white font-[InterTight] font-medium mt-8 mb-2 text-center`}>
                                Welcome, {userName ? userName : 'admin'}!
                            </Text>
                            <Text style={tw`text-gray-400 font-[InterTight] text-lg text-center leading-5 mb-4 px-2`}>
                                Ask questions, get career roadmaps,{'\n'}and explore resources
                            </Text>

                            {/* Lottie Animation */}
                            <LottieView
                                source={require('@/assets/success.json')}
                                autoPlay
                                loop={false}
                                style={tw`w-30 h-30`}
                            />
                        </View>
                    </Animated.View>
                </View>
            </Modal>

        </GlassBackground>
    );
}
