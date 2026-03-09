import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Camera, ChevronLeft, User, Mail, Phone } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { router } from 'expo-router';

// Mock Initial Data (In a real app, this would come from a hook or state management)
const INITIAL_USER = {
    firstName: 'Hana',
    lastName: 'Marquis',
    email: 'hana.marquis@example.com',
    phone: '+1 234 567 890',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop',
};

interface EditFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: any;
    secureTextEntry?: boolean;
}

const EditField = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon: Icon,
    secureTextEntry = false
}: EditFieldProps) => (
    <View style={tw`mb-6`}>
        <Text style={tw`text-white/60 text-sm font-[InterTight] font-medium mb-2 ml-1`}>{label}</Text>
        <View style={tw`flex-row items-center bg-white/5 rounded-2xl border border-white/10 px-4 h-[54px]`}>
            <Icon size={20} color="rgba(255,255,255,0.4)" style={tw`mr-3`} />
            <TextInput
                style={[tw`flex-1 text-white text-base font-[InterTight] p-0`, { lineHeight: undefined }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={secureTextEntry}
                textAlignVertical="center"
            />
        </View>
    </View>
);

export default function EditProfileScreen() {
    const [firstName, setFirstName] = useState(INITIAL_USER.firstName);
    const [lastName, setLastName] = useState(INITIAL_USER.lastName);
    const [phone, setPhone] = useState(INITIAL_USER.phone);
    const [email, setEmail] = useState(INITIAL_USER.email);

    const handleSave = () => {
        // Handle saving logic here
        router.back();
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <SafeAreaView style={tw`flex-1`}>
                <View style={tw`p-6 flex-1`}>
                    {/* Header */}
                    <View style={tw`flex-row items-center`}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mr-4`}
                        >
                            <ChevronLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={tw`text-white text-3xl font-inter-bold`}>Edit Profile</Text>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={tw`flex-1`}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={tw`flex-grow justify-center pb-8`}
                        >
                            {/* Avatar Edit */}
                            <View style={tw`items-center mb-10 mt-10`}>
                                <View style={tw`relative`}>
                                    <Image
                                        source={{ uri: INITIAL_USER.avatar }}
                                        style={tw`w-28 h-28 rounded-full border-2 border-white/20`}
                                    />
                                    <TouchableOpacity
                                        style={tw`absolute bottom-0 right-0 bg-white/20 p-2.5 rounded-full border border-white/20 backdrop-blur-md`}
                                    >
                                        <Camera size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={tw`text-white/40 text-xs font-inter mt-3`}>Tap to change photo</Text>
                            </View>

                            <GlassCard noPadding style={tw`bg-white/5 border-white/5 mb-8 pt-5 px-5`}>
                                <EditField
                                    label="First Name"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Enter first name"
                                    icon={User}
                                />
                                <EditField
                                    label="Last Name"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Enter last name"
                                    icon={User}
                                />
                                <EditField
                                    label="Phone Number"
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Enter phone number"
                                    icon={Phone}
                                />
                                <EditField
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter email address"
                                    icon={Mail}
                                />
                            </GlassCard>

                            <TouchableOpacity
                                onPress={handleSave}
                                style={tw`bg-white/5 py-5 rounded-2xl border border-white/10 items-center`}
                            >
                                <Text style={tw`text-white text-xl font-inter-bold`}>Save Changes</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}
