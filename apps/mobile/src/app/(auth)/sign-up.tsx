import tw from '@/lib/tailwind';
import { View, Text, TextInput, Alert, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function SignUpScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = () => {
        if (!email || !password || !firstName || !lastName || !phone || !confirmPassword) {
            Alert.alert('Error', 'Please enter all fields');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            router.push('/(auth)/persona');
        }, 1500);
    };

    return (
        <GlassBackground>
            <SafeAreaView style={tw`flex-1`}>
                {/* Back Button */}
                <View style={tw`px-4 pt-4`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`bg-white/10 p-2 rounded-full self-start`}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} style={tw`px-6 pt-4`}>

                    <View style={tw`mb-8`}>
                        <Text style={tw`text-3xl text-white font-[InterTight-Bold] mb-2`}>Create an account 👋</Text>
                        <Text style={tw`text-gray-400 font-[InterTight-Regular]`}>
                            Please fill in your details to log you back into your enroute account
                        </Text>
                    </View>

                    <GlassCard style={tw`p-2 mb-6 border-white/10`}>
                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-2 ml-1`}>First Name</Text>
                            <TextInput
                                style={tw`bg-[#12121A]/80 border border-white/10 rounded-xl px-4 py-4 text-white font-[InterTight-Regular]`}
                                placeholder="John"
                                placeholderTextColor="#555"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-2 ml-1`}>Last Name</Text>
                            <TextInput
                                style={tw`bg-[#12121A]/80 border border-white/10 rounded-xl px-4 py-4 text-white font-[InterTight-Regular]`}
                                placeholder="Doe"
                                placeholderTextColor="#555"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-2 ml-1`}>Email</Text>
                            <TextInput
                                style={tw`bg-[#12121A]/80 border border-white/10 rounded-xl px-4 py-4 text-white font-[InterTight-Regular]`}
                                placeholder="student@university.edu"
                                placeholderTextColor="#555"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-2 ml-1`}>Phone number</Text>
                            <TextInput
                                style={tw`bg-[#12121A]/80 border border-white/10 rounded-xl px-4 py-4 text-white font-[InterTight-Regular]`}
                                placeholder="+1 234 567 8900"
                                placeholderTextColor="#555"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-2 ml-1`}>Password</Text>
                            <TextInput
                                style={tw`bg-[#12121A]/80 border border-white/10 rounded-xl px-4 py-4 text-white font-[InterTight-Regular]`}
                                placeholder="Enter password"
                                placeholderTextColor="#555"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <View style={tw`mb-6`}>
                            <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-2 ml-1`}>Confirm password</Text>
                            <TextInput
                                style={tw`bg-[#12121A]/80 border border-white/10 rounded-xl px-4 py-4 text-white font-[InterTight-Regular]`}
                                placeholder="Enter password"
                                placeholderTextColor="#555"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </View>

                        <GlassButton
                            title="Get started"
                            onPress={handleSignUp}
                            isLoading={isLoading}
                        />
                    </GlassCard>
                </ScrollView>
            </SafeAreaView>
        </GlassBackground>
    );
}
