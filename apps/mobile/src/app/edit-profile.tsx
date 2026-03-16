import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Camera, ChevronLeft, User, Mail, Phone, Tag } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import * as ImagePicker from 'expo-image-picker';


interface EditFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: any;
    secureTextEntry?: boolean;
    returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send';
    onSubmitEditing?: () => void;
    inputRef?: React.RefObject<TextInput | null>;
}

const EditField = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon: Icon,
    secureTextEntry = false,
    returnKeyType,
    onSubmitEditing,
    inputRef
}: EditFieldProps) => (
    <View style={tw`mb-6`}>
        <Text style={tw`text-white/60 text-sm font-[InterTight] font-medium mb-2 ml-1`}>{label}</Text>
        <View style={tw`flex-row items-center bg-white/5 rounded-2xl border border-white/10 px-4 h-[54px]`}>
            <Icon size={20} color="rgba(255,255,255,0.4)" style={tw`mr-3`} />
            <TextInput
                ref={inputRef}
                style={[tw`flex-1 text-white text-base font-[InterTight] p-0`, { lineHeight: undefined }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={secureTextEntry}
                textAlignVertical="center"
                returnKeyType={returnKeyType}
                onSubmitEditing={onSubmitEditing}
            />
        </View>
    </View>
);

export default function EditProfileScreen() {
    const { user, refreshUser } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [nickname, setNickname] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [newImageUri, setNewImageUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const firstNameRef = React.useRef<TextInput>(null);
    const lastNameRef = React.useRef<TextInput>(null);
    const phoneRef = React.useRef<TextInput>(null);
    const emailRef = React.useRef<TextInput>(null);
    const nicknameRef = React.useRef<TextInput>(null);

    useEffect(() => {
        if (user) {
            setFirstName(user.user_metadata?.first_name || '');
            setLastName(user.user_metadata?.last_name || '');
            setPhone(user.user_metadata?.phone || '');
            setEmail(user.email || '');
            setNickname(user.user_metadata?.nickname || '');
            setAvatarUrl(user.user_metadata?.avatar_url || '');
        }
    }, [user]);

    const handlePickImage = async () => {
        Alert.alert(
            "Change Profile Photo",
            "Choose a source",
            [
                {
                    text: "Camera",
                    onPress: handleCaptureImage
                },
                {
                    text: "Photo Gallery",
                    onPress: handleOpenGallery
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const handleOpenGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri);
        }
    };

    const handleCaptureImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (uri: string) => {
        if (!user || user.id === 'pending') return null;
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const fileExt = uri.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, { contentType: `image/${fileExt}`, upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Upload avatar error:', error);
            return null;
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            let currentAvatarUrl = avatarUrl;
            if (newImageUri) {
                const uploadedUrl = await uploadAvatar(newImageUri);
                if (uploadedUrl) currentAvatarUrl = uploadedUrl;
            }

            // 1. Update Auth Metadata
            const { error: authError } = await supabase.auth.updateUser({
                email: email,
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    nickname: nickname,
                    avatar_url: currentAvatarUrl
                }
            });

            if (authError) {
                Alert.alert('Error', authError.message);
                return;
            }

            // 2. Update Public Profile Table
            if (user?.id) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone,
                        nickname: nickname,
                        email: email,
                        avatar_url: currentAvatarUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);

                if (profileError) {
                    console.error('Profile Table Update Error:', profileError.message);
                    // We don't necessarily want to block the user if the profile table update fails 
                    // but auth metadata succeeded, though it depends on requirements.
                }
            }

            await refreshUser();
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred while saving profile');
        } finally {
            setIsLoading(false);
        }
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
                                        source={{ uri: newImageUri || avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop' }}
                                        style={tw`w-28 h-28 rounded-full border-2 border-white/20`}
                                    />
                                    <TouchableOpacity
                                        onPress={handlePickImage}
                                        style={tw`absolute bottom-0 right-0 bg-white/20 p-2.5 rounded-full border border-white/20 backdrop-blur-md`}
                                    >
                                        <Camera size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={tw`text-white/40 text-xs font-inter mt-3`}>Tap to change photo</Text>
                            </View>

                            <GlassCard noPadding style={tw`bg-white/5 border-white/5 mb-8 pt-5 px-5`}>
                                <EditField
                                    inputRef={firstNameRef}
                                    label="First Name"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Enter first name"
                                    icon={User}
                                    returnKeyType="next"
                                    onSubmitEditing={() => lastNameRef.current?.focus()}
                                />
                                <EditField
                                    inputRef={lastNameRef}
                                    label="Last Name"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Enter last name"
                                    icon={User}
                                    returnKeyType="next"
                                    onSubmitEditing={() => phoneRef.current?.focus()}
                                />
                                <EditField
                                    inputRef={phoneRef}
                                    label="Phone Number"
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Enter phone number"
                                    icon={Phone}
                                    returnKeyType="next"
                                    onSubmitEditing={() => emailRef.current?.focus()}
                                />
                                <EditField
                                    inputRef={emailRef}
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter email address"
                                    icon={Mail}
                                    returnKeyType="next"
                                    onSubmitEditing={() => nicknameRef.current?.focus()}
                                />
                                <EditField
                                    inputRef={nicknameRef}
                                    label="Nickname"
                                    value={nickname}
                                    onChangeText={setNickname}
                                    placeholder="Enter nickname"
                                    icon={Tag}
                                    returnKeyType="done"
                                    onSubmitEditing={() => Alert.alert('Action', 'Press Save Changes to update your profile')}
                                />
                            </GlassCard>

                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isLoading}
                                style={tw`bg-white/5 py-5 rounded-2xl border border-white/10 items-center mb-10`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={tw`text-white text-xl font-inter-bold`}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}
