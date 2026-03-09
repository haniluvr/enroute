import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Bell, Shield, HelpCircle, LogOut, ChevronRight, ChevronLeft, LucideIcon, User } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

interface SettingsOptionProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    showDivider?: boolean;
    isDestructive?: boolean;
    onPress?: () => void;
}

const SettingsOption = ({
    icon: Icon,
    title,
    subtitle,
    showDivider = true,
    isDestructive = false,
    onPress
}: SettingsOptionProps) => (
    <View style={tw`w-full`}>
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={tw`flex-row items-center py-4`}
        >
            <View style={tw`w-12 h-12 rounded-2xl bg-white/10 items-center justify-center mr-4 shadow-sm`}>
                <Icon size={24} color={isDestructive ? '#e7000b' : '#FFFFFF'} />
            </View>

            <View style={tw`flex-1`}>
                <Text style={tw`text-white text-xl font-inter-semibold ${isDestructive ? 'text-red-600' : ''}`}>
                    {title}
                </Text>
                <Text style={tw`text-white/60 text-lg font-inter`}>
                    {subtitle}
                </Text>
            </View>

            {!isDestructive && (
                <ChevronRight size={20} color="rgba(255,255,255,0.4)" />
            )}
        </TouchableOpacity>

        {showDivider && (
            <View style={tw`h-[1px] bg-white/10 w-[95%] self-center`} />
        )}
    </View>
);

export default function SettingsScreen() {
    const { signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
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
                        <Text style={tw`text-white text-3xl font-inter-bold`}>Settings</Text>
                    </View>

                    <ScrollView scrollEnabled={false} showsVerticalScrollIndicator={false}>
                        <GlassCard noPadding style={tw`bg-white/5 border-white/5 px-5 py-1`}>
                            <SettingsOption
                                icon={Bell}
                                title="Notifications"
                                subtitle="Manage alerts & reminders"
                                onPress={() => router.push('/notifications')}
                            />
                            <SettingsOption
                                icon={Shield}
                                title="Privacy & Security"
                                subtitle="Data & account settings"
                                onPress={() => router.push('/privacy')}
                            />
                            <SettingsOption
                                icon={HelpCircle}
                                title="Help & Support"
                                subtitle="FAQs, contact support"
                                onPress={() => router.push('/support')}
                            />
                            <SettingsOption
                                icon={LogOut}
                                title="Sign Out"
                                subtitle="Log out of your account"
                                showDivider={false}
                                isDestructive={true}
                                onPress={handleSignOut}
                            />
                        </GlassCard>

                        <View style={tw`mt-10 items-center opacity-40 pb-10`}>
                            <Text style={tw`text-white text-sm font-inter`}>
                                Enroute v1.0.0
                            </Text>
                            <Text style={tw`text-white text-xs font-inter mt-1`}>
                                Powered by Dahlia AI
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}
