import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { ChevronLeft, Lock, Eye, EyeOff, Check } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { router } from 'expo-router';

interface PasswordFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
}

const PasswordField = ({
    label,
    value,
    onChangeText,
    placeholder
}: PasswordFieldProps) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View style={tw`mb-6`}>
            <Text style={tw`text-white/60 text-sm font-[InterTight] font-medium mb-2 ml-1`}>{label}</Text>
            <View style={tw`flex-row items-center bg-white/10 rounded-2xl border border-white/10 px-4 h-[54px]`}>
                <Lock size={20} color="rgba(255,255,255,0.4)" style={tw`mr-3`} />
                <TextInput
                    style={[tw`flex-1 text-white text-base font-[InterTight] p-0`, { lineHeight: undefined }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPassword}
                    textAlignVertical="center"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                        <EyeOff size={20} color="rgba(255,255,255,0.4)" />
                    ) : (
                        <Eye size={20} color="rgba(255,255,255,0.4)" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function ChangePasswordScreen() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSave = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }
        // Handle password change logic here
        Alert.alert('Success', 'Password changed successfully.');
        router.back();
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <SafeAreaView style={tw`flex-1`}>
                <View style={tw`p-6 flex-1`}>
                    {/* Header */}
                    <View style={tw`flex-row items-center mb-8`}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mr-4`}
                        >
                            <ChevronLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={tw`text-white text-3xl font-inter-bold`}>Change Password</Text>
                    </View>

                    <ScrollView
                        scrollEnabled={false}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={tw`flex-grow pb-8`}
                    >
                        <GlassCard noPadding style={tw`bg-white/5 border-white/5 mb-8 pt-5 px-5`}>
                            <PasswordField
                                label="Current Password"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                            />

                            <View style={tw`h-[1px] bg-white/5 w-full mb-6`} />

                            <PasswordField
                                label="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                            />
                            <PasswordField
                                label="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                            />
                        </GlassCard>

                        <TouchableOpacity
                            onPress={() => Alert.alert('Reset Password', 'A reset link has been sent to your email.')}
                            style={tw`mb-8 self-center`}
                        >
                            <Text style={tw`text-white/60 text-base font-inter-medium`}>Forgot password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            style={tw`bg-white/5 py-5 rounded-2xl border border-white/10 items-center`}
                        >
                            <Text style={tw`text-white text-xl font-inter-bold`}>Save Changes</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}
