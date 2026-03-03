import { View, Text, TextInput, Alert } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { useState } from 'react';
import { Link, router } from 'expo-router';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        // Simulate login network request
        setTimeout(() => {
            setLoading(false);
            // We will replace this with actual firebase logic and the auth context provider routing
            router.replace('/(tabs)/home');
        }, 1500);
    };

    return (
        <GlassBackground>
            <View className="flex-1 justify-center px-6">
                <View className="items-center mb-10">
                    <Text className="text-5xl text-white font-inter-bold mb-2">Enroute</Text>
                    <Text className="text-gray-300 text-lg font-inter-medium">Find your path, instantly.</Text>
                </View>

                <GlassCard>
                    <Text className="text-white text-2xl font-inter-semibold mb-6">Sign In</Text>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-400 mb-2 font-inter ml-1">Student Email</Text>
                            <TextInput
                                className="bg-white/5 border border-white/10 rounded-xl p-4 text-white font-inter"
                                placeholder="student@university.edu.ph"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View className="mb-6 mt-4">
                            <Text className="text-gray-400 mb-2 font-inter ml-1">Password</Text>
                            <TextInput
                                className="bg-white/5 border border-white/10 rounded-xl p-4 text-white font-inter"
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <GlassButton title="Login" onPress={handleLogin} isLoading={loading} />

                        <View className="flex-row justify-center mt-6">
                            <Text className="text-gray-400 font-inter">New here? </Text>
                            <Link href="/(auth)/sign-up">
                                <Text className="text-accent-cyan font-inter-semibold">Create Profile</Text>
                            </Link>
                        </View>
                    </View>
                </GlassCard>
            </View>
        </GlassBackground>
    );
}
