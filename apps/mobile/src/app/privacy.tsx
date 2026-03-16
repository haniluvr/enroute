import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Switch } from 'react-native';
import { Shield, ChevronLeft, Key, Eye, UserX, ChevronRight, Lock, MapPin } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { router } from 'expo-router';

interface SecurityOptionProps {
    icon: any;
    title: string;
    description: string;
    onPress?: () => void;
    showDivider?: boolean;
    isDestructive?: boolean;
}

const SecurityOption = ({
    icon: Icon,
    title,
    description,
    onPress,
    showDivider = true,
    isDestructive = false
}: SecurityOptionProps) => (
    <View style={tw`w-full`}>
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={tw`flex-row items-center py-4`}
        >
            <View style={tw`w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-4`}>
                <Icon size={20} color={isDestructive ? '#EF4444' : '#FFFFFF'} />
            </View>
            <View style={tw`flex-1 mr-2`}>
                <Text style={tw`text-white text-lg font-inter-semibold ${isDestructive ? 'text-red-500' : ''}`}>{title}</Text>
                <Text style={tw`text-white/60 text-sm font-inter`}>{description}</Text>
            </View>
            {!isDestructive && <ChevronRight size={18} color="rgba(255,255,255,0.3)" />}
        </TouchableOpacity>
        {showDivider && <View style={tw`h-[1px] bg-white/10 w-full`} />}
    </View>
);

export default function PrivacyScreen() {
    const [twoFactor, setTwoFactor] = useState(false);
    const [dataSharing, setDataSharing] = useState(true);
    const [shareLocation, setShareLocation] = useState(false);

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
                        <Text style={tw`text-white text-3xl font-inter-bold`}>Privacy & Security</Text>
                    </View>

                    <ScrollView scrollEnabled={false} showsVerticalScrollIndicator={false}>
                        <Text style={tw`text-white/40 text-xs font-inter-bold uppercase tracking-widest mb-4 ml-1`}>Security</Text>
                        <GlassCard noPadding style={tw`bg-white/5 border-white/5 px-5 py-1 mb-8`}>
                            <SecurityOption
                                icon={Key}
                                title="Change Password"
                                description="Update your account password"
                                onPress={() => router.push('/change-password')}
                            />
                            <View style={tw`flex-row items-center py-4`}>
                                <View style={tw`w-10 h-10 rounded-xl bg-white/5 items-center justify-center mr-4`}>
                                    <Lock size={20} color="#FFFFFF" />
                                </View>
                                <View style={tw`flex-1 mr-4`}>
                                    <Text style={tw`text-white text-lg font-inter-semibold`}>Two-Factor Auth</Text>
                                    <Text style={tw`text-white/60 text-sm font-inter`}>Add an extra layer of security</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: '#3e3e3e', true: '#34C759' }}
                                    thumbColor={twoFactor ? '#ffffff' : '#f4f3f4'}
                                    onValueChange={setTwoFactor}
                                    value={twoFactor}
                                />
                            </View>
                        </GlassCard>

                        <Text style={tw`text-white/40 text-xs font-inter-bold uppercase tracking-widest mb-4 ml-1`}>Privacy</Text>
                        <GlassCard noPadding style={tw`bg-white/5 border-white/5 px-5 py-1 mb-8`}>
                            <SecurityOption
                                icon={Eye}
                                title="Profile Visibility"
                                description="Control who can see your profile"
                            />
                            <View style={tw`flex-row items-center py-4`}>
                                <View style={tw`w-10 h-10 rounded-xl bg-white/5 items-center justify-center mr-4`}>
                                    <Shield size={20} color="#FFFFFF" />
                                </View>
                                <View style={tw`flex-1 mr-4`}>
                                    <Text style={tw`text-white text-lg font-inter-semibold`}>Data Sharing</Text>
                                    <Text style={tw`text-white/60 text-sm font-inter`}>Help us improve by sharing usage data</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: '#3e3e3e', true: '#34C759' }}
                                    thumbColor={dataSharing ? '#ffffff' : '#f4f3f4'}
                                    onValueChange={setDataSharing}
                                    value={dataSharing}
                                />
                            </View>
                            <View style={tw`h-[1px] bg-white/10 w-full`} />
                            <View style={tw`flex-row items-center py-4`}>
                                <View style={tw`w-10 h-10 rounded-xl bg-white/5 items-center justify-center mr-4`}>
                                    <MapPin size={20} color="#FFFFFF" />
                                </View>
                                <View style={tw`flex-1 mr-4`}>
                                    <Text style={tw`text-white text-lg font-inter-semibold`}>Share Location</Text>
                                    <Text style={tw`text-white/60 text-sm font-inter`}>Allow Enroute to access your location</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: '#3e3e3e', true: '#34C759' }}
                                    thumbColor={shareLocation ? '#ffffff' : '#f4f3f4'}
                                    onValueChange={setShareLocation}
                                    value={shareLocation}
                                />
                            </View>
                        </GlassCard>

                        <Text style={tw`text-white/40 text-xs font-inter-bold uppercase tracking-widest mb-4 ml-1`}>Danger Zone</Text>
                        <GlassCard noPadding style={tw`bg-white/5 border-white/5 px-5 py-1 mb-10`}>
                            <SecurityOption
                                icon={UserX}
                                title="Delete Account"
                                description="Permanently delete your Enroute account"
                                isDestructive={true}
                                showDivider={false}
                            />
                        </GlassCard>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}
