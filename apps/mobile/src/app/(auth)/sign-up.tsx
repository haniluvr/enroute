import { View, Text, TextInput, Alert, ScrollView } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { useState } from 'react';
import { Link, router } from 'expo-router';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !name) {
            Alert.alert('Error', 'Please fill out all fields');
            return;
        }

        setLoading(true);
        // Simulate register network request
        setTimeout(() => {
            setLoading(false);
            // We will replace this with actual firebase logic later
            router.replace('/(tabs)/home');
        }, 1500);
    };

    return (
        <GlassBackground>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6 py-10">
                <View className="items-center mb-8">
                    <Text className="text-4xl text-white font-inter-bold mb-2">Join Enroute</Text>
                    <Text className="text-gray-300 text-base font-inter-medium text-center">
                        Your personalized career roadmap starts here.
                    </Text>
                </View>

                <GlassCard>
                    <Text className="text-white text-2xl font-inter-semibold mb-6">Create Profile</Text>

                    <View className="space-y-4">
                        <View className="mb-4">
                            <Text className="text-gray-400 mb-2 font-inter ml-1">Full Name</Text>
                            <TextInput
                                className="bg-white/5 border border-white/10 rounded-xl p-4 text-white font-inter"
                                placeholder="Juan Dela Cruz"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-400 mb-2 font-inter ml-1">Student Email</Text>
                            <TextInput
                                className="bg-white/5 border border-white/10 rounded-xl p-4 text-white font-inter"
                                placeholder="juan@university.edu.ph"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View className="mb-8">
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

                        <GlassButton title="Register" onPress={handleRegister} isLoading={loading} />

                        <View className="flex-row justify-center mt-6">
                            <Text className="text-gray-400 font-inter">Already have an account? </Text>
                            <Link href="/(auth)/sign-in">
                                <Text className="text-accent-violet font-inter-semibold">Sign In</Text>
                            </Link>
                        </View>
                    </View>
                </GlassCard>
            </ScrollView>
        </GlassBackground>
    );
}
