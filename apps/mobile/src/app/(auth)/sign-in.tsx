import tw from '@/lib/tailwind';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { useState } from 'react';
import { Link, router } from 'expo-router';

export default function SignInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailSignIn = () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter all fields');
            return;
        }
        setIsLoading(true);
        // Simulate networking
        setTimeout(() => {
            setIsLoading(false);
            router.replace('/(tabs)/home');
        }, 1500);
    };

    return (
        <GlassBackground>
            <View style={tw`flex-1 justify-center px-6`}>
                <View style={tw`items-center mb-10`}>
                    <Text style={tw`text-4xl text-white font-[InterTight-Bold] mb-2`}>Welcome Back</Text>
                    <Text style={tw`text-gray-400 font-[InterTight-Regular] text-base`}>Sign in to continue your journey</Text>
                </View>

                <GlassCard style={tw`p-2 mb-6`}>
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-2 ml-1`}>Email</Text>
                        <TextInput
                            style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-[InterTight-Regular]`}
                            placeholder="student@university.edu"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={tw`mb-6`}>
                        <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-2 ml-1`}>Password</Text>
                        <TextInput
                            style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-[InterTight-Regular]`}
                            placeholder="••••••••"
                            placeholderTextColor="#666"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <GlassButton
                        title="Sign In"
                        onPress={handleEmailSignIn}
                        isLoading={isLoading}
                    />
                </GlassCard>

                <View style={tw`flex-row justify-center mt-4`}>
                    <Text style={tw`text-gray-400 font-[InterTight-Regular]`}>Don't have an account? </Text>
                    <Link href="/(auth)/sign-up" asChild>
                        <TouchableOpacity>
                            <Text style={tw`text-accent-cyan font-[InterTight-SemiBold]`}>Create one</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </GlassBackground>
    );
}
