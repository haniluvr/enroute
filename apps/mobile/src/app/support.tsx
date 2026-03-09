import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Linking, Alert } from 'react-native';
import { HelpCircle, ChevronLeft, Mail, MessageCircle, FileText, ExternalLink, ChevronRight } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { router } from 'expo-router';

interface SupportOptionProps {
    icon: any;
    title: string;
    onPress?: () => void;
    showDivider?: boolean;
}

const SupportOption = ({
    icon: Icon,
    title,
    onPress,
    showDivider = true
}: SupportOptionProps) => (
    <View style={tw`w-full`}>
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={tw`flex-row items-center py-4`}
        >
            <View style={tw`w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-4`}>
                <Icon size={20} color="#FFFFFF" />
            </View>
            <Text style={tw`flex-1 text-white text-lg font-inter-semibold`}>{title}</Text>
            <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
        {showDivider && <View style={tw`h-[1px] bg-white/10 w-full`} />}
    </View>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
    <View style={tw`mb-6`}>
        <Text style={tw`text-white text-lg font-inter-semibold mb-2`}>{question}</Text>
        <Text style={tw`text-white/60 text-base font-inter leading-6`}>{answer}</Text>
    </View>
);

export default function SupportScreen() {
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
                        <Text style={tw`text-white text-3xl font-inter-bold`}>Help & Support</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={tw`text-white/40 text-xs font-inter-bold uppercase tracking-widest mb-4 ml-1`}>Contact Us</Text>
                        <GlassCard noPadding style={tw`bg-white/5 border-white/5 px-5 py-1 mb-8`}>
                            <SupportOption
                                icon={Mail}
                                title="Email Support"
                                onPress={() => Linking.openURL('mailto:support@enroute.ai')}
                            />
                            <SupportOption
                                icon={MessageCircle}
                                title="Live Chat"
                                showDivider={false}
                                onPress={() => Alert.alert('Coming Soon', 'Live chat support is currently under development.')}
                            />
                        </GlassCard>

                        <Text style={tw`text-white/40 text-xs font-inter-bold uppercase tracking-widest mb-4 ml-1`}>FAQs</Text>
                        <GlassCard style={tw`bg-white/5 border-white/5 mb-8 px-5 pt-5`} noPadding>
                            <FAQItem
                                question="What is Dahlia AI?"
                                answer="Dahlia is your personalized career agent that helps you find the best career paths and skills to learn."
                            />
                            <FAQItem
                                question="How doesEnroute match me with jobs?"
                                answer="We use advanced AI to analyze your skills, interests, and preferences to find the most compatible career opportunities."
                            />
                            <FAQItem
                                question="Is my data safe?"
                                answer="Yes, we take privacy seriously. Your data is encrypted and never sold to third parties."
                            />
                        </GlassCard>

                        <Text style={tw`text-white/40 text-xs font-inter-bold uppercase tracking-widest mb-4 ml-1`}>Legal</Text>
                        <GlassCard noPadding style={tw`bg-white/5 border-white/5 px-5 py-1 mb-10`}>
                            <SupportOption
                                icon={FileText}
                                title="Privacy Policy"
                            />
                            <SupportOption
                                icon={FileText}
                                title="Terms of Service"
                            />
                            <SupportOption
                                icon={ExternalLink}
                                title="Website"
                                showDivider={false}
                                onPress={() => Linking.openURL('https://enroute.ai')}
                            />
                        </GlassCard>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </GlassBackground>
    );
}
