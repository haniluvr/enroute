import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Switch } from 'react-native';
import { Bell, ChevronLeft, Mail, MessageSquare, Briefcase, Zap } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { router } from 'expo-router';

interface NotificationSettingProps {
    icon: any;
    title: string;
    description: string;
    isEnabled: boolean;
    onToggle: (value: boolean) => void;
    showDivider?: boolean;
}

const NotificationSetting = ({
    icon: Icon,
    title,
    description,
    isEnabled,
    onToggle,
    showDivider = true
}: NotificationSettingProps) => (
    <View style={tw`w-full`}>
        <View style={tw`flex-row items-center py-4`}>
            <View style={tw`w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-4`}>
                <Icon size={20} color="#FFFFFF" />
            </View>
            <View style={tw`flex-1 mr-4`}>
                <Text style={tw`text-white text-lg font-inter-semibold`}>{title}</Text>
                <Text style={tw`text-white/60 text-sm font-inter`}>{description}</Text>
            </View>
            <Switch
                trackColor={{ false: '#3e3e3e', true: '#34C759' }}
                thumbColor={isEnabled ? '#ffffff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={onToggle}
                value={isEnabled}
            />
        </View>
        {showDivider && <View style={tw`h-[1px] bg-white/10 w-full`} />}
    </View>
);

export default function NotificationsScreen() {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [jobAlerts, setJobAlerts] = useState(true);
    const [appUpdates, setAppUpdates] = useState(true);

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
                        <Text style={tw`text-white text-3xl font-inter-bold`}>Notifications</Text>
                    </View>

                    <ScrollView scrollEnabled={false} showsVerticalScrollIndicator={false}>
                        <Text style={tw`text-white/40 text-xs font-inter-bold uppercase tracking-widest mb-4 ml-1`}>Channels</Text>
                        <GlassCard noPadding style={tw`bg-white/5 border-white/5 px-5 py-1 mb-8`}>
                            <NotificationSetting
                                icon={Bell}
                                title="Push Notifications"
                                description="Get instant alerts on your device"
                                isEnabled={pushEnabled}
                                onToggle={setPushEnabled}
                            />
                            <NotificationSetting
                                icon={Mail}
                                title="Email Notifications"
                                description="Receive updates via email"
                                isEnabled={emailEnabled}
                                onToggle={setEmailEnabled}
                                showDivider={false}
                            />
                        </GlassCard>

                        <Text style={tw`text-white/40 text-xs font-inter-bold uppercase tracking-widest mb-4 ml-1`}>Alert Categories</Text>
                        <GlassCard noPadding style={tw`bg-white/5 border-white/5 px-5 py-1`}>
                            <NotificationSetting
                                icon={Briefcase}
                                title="Job Opportunities"
                                description="New recommendations based on your profile"
                                isEnabled={jobAlerts}
                                onToggle={setJobAlerts}
                            />
                            <NotificationSetting
                                icon={Zap}
                                title="AI Insights"
                                description="Dahlia's tips and career guidance"
                                isEnabled={appUpdates}
                                onToggle={setAppUpdates}
                            />
                            <NotificationSetting
                                icon={MessageSquare}
                                title="App Updates"
                                description="News about features and fixes"
                                isEnabled={appUpdates}
                                onToggle={setAppUpdates}
                                showDivider={false}
                            />
                        </GlassCard>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}
