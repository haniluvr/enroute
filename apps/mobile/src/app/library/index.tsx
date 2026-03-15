import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Keyboard } from 'react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Search,
    Mic,
    MapPin,
    Download,
    MessageSquare,
    ChevronRight,
    Trash2
} from 'lucide-react-native';

const CATEGORIES = [
    { id: 'ideas', name: 'Recorded Ideas', icon: Mic, color: '#FF9500' },
    { id: 'roadmaps', name: 'My Roadmaps', icon: MapPin, color: '#5856D6' },
    { id: 'resources', name: 'Resources', icon: Download, color: '#32ADE6' },
    { id: 'conversations', name: 'Conversations', icon: MessageSquare, color: '#AF52DE' },
];

export default function LibraryScreen() {
    const router = useRouter();
    const [recentItems, setRecentItems] = React.useState([
        { id: 1, title: "UI/UX Design Roadmap", subtitle: "Updated 2 days ago", type: "roadmap" },
        { id: 2, title: "Voice Idea: App Concept", subtitle: "Recorded yesterday", type: "idea" },
        { id: 3, title: "Dahlia Conversation", subtitle: "Career advice session", type: "conversation" },
        { id: 4, title: "Product Management 101", subtitle: "Downloaded Resource", type: "resource" },
    ]);

    const handleDelete = (id: number) => {
        Alert.alert(
            "Delete Item",
            "Are you sure you want to remove this item from your library?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    onPress: () => setRecentItems(prev => prev.filter(item => item.id !== id)),
                    style: "destructive" 
                }
            ]
        );
    };

    const handleClearAll = () => {
        if (recentItems.length === 0) return;
        Alert.alert(
            "Clear Library",
            "Are you sure you want to clear all recent activity?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Clear All", 
                    onPress: () => setRecentItems([]),
                    style: "destructive" 
                }
            ]
        );
    };

    const renderItem = (id: number, title: string, subtitle: string, type: string) => (
        <TouchableOpacity activeOpacity={0.7} style={tw`mb-4`}>
            <GlassCard style={tw`p-5 bg-[#1C1C1E]/80 border-t border-white/10`} noPadding>
                <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-white font-[InterTight-Medium] text-[15px] mb-1`}>{title}</Text>
                        <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>{subtitle}</Text>
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                        <TouchableOpacity 
                            onPress={() => handleDelete(id)}
                            style={tw`bg-red-500/10 w-8 h-8 rounded-full items-center justify-center border border-red-500/20`}
                        >
                            <Trash2 color="#df4444" size={16} />
                        </TouchableOpacity>
                        <TouchableOpacity style={tw`bg-white/10 w-8 h-8 rounded-full items-center justify-center`}>
                            <ChevronRight color="#888" size={18} />
                        </TouchableOpacity>
                    </View>
                </View>
            </GlassCard>
        </TouchableOpacity>
    );

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={tw`px-6 pt-16 pb-6 flex-row justify-between items-center`}>
                    <View style={tw`flex-row items-center`}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10 mr-4`}
                        >
                            <ChevronLeft color="#fff" size={24} />
                        </TouchableOpacity>
                        <Text style={tw`text-white font-[InterTight] font-semibold text-3xl`}>Library</Text>
                    </View>
                </View>

                {/* Search */}
                <View style={tw`px-6 mb-8`}>
                    <View style={tw`bg-white/10 border border-white/15 rounded-full px-5 py-0 flex-row items-center`}>
                        <Search color="#fff" size={20} style={tw`mr-3 opacity-80`} />
                        <TextInput
                            style={[tw`flex-1 text-white font-[InterTight] text-[15px] py-3.5`, { lineHeight: undefined }]}
                            placeholder="Search library..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            textAlignVertical="center"
                            returnKeyType="search"
                            onSubmitEditing={() => Keyboard.dismiss()}
                        />
                    </View>
                </View>

                {/* Quick Categories */}
                <View style={tw`px-6 mb-8`}>
                    <View style={tw`flex-row justify-between mb-4`}>
                        {CATEGORIES.slice(0, 2).map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={tw`w-[48%]`}
                                activeOpacity={0.8}
                                onPress={() => router.push(`/library/${cat.id}`)}
                            >
                                <GlassCard style={tw`h-[140px] p-5 justify-between bg-white/10 shadow-xl border-t border-white/20`} noPadding>
                                    <View style={tw`bg-[#fcfcfc]/20 w-11 h-11 rounded-2xl items-center justify-center`}>
                                        <cat.icon color="#fff" size={22} />
                                    </View>
                                    <Text style={tw`text-white font-[InterTight-Medium] text-[15px]`}>{cat.name}</Text>
                                </GlassCard>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={tw`flex-row justify-between`}>
                        {CATEGORIES.slice(2, 4).map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={tw`w-[48%]`}
                                activeOpacity={0.8}
                                onPress={() => router.push(`/library/${cat.id}`)}
                            >
                                <GlassCard style={tw`h-[140px] p-5 justify-between bg-white/10 shadow-xl border-t border-white/20`} noPadding>
                                    <View style={tw`bg-[#fcfcfc]/20 w-11 h-11 rounded-2xl items-center justify-center`}>
                                        <cat.icon color="#fff" size={22} />
                                    </View>
                                    <Text style={tw`text-white font-[InterTight-Medium] text-[15px]`}>{cat.name}</Text>
                                </GlassCard>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Recent Items */}
                <View style={tw`px-6`}>
                    <View style={tw`flex-row justify-between items-center mb-5`}>
                        <Text style={tw`text-gray-300 font-[InterTight-Medium] text-[17px]`}>Recent Activity</Text>
                        <TouchableOpacity onPress={handleClearAll}>
                            <Text style={tw`text-white/40 font-[InterTight] text-sm`}>Clear all</Text>
                        </TouchableOpacity>
                    </View>

                    {recentItems.length === 0 ? (
                        <View style={tw`py-10 items-center`}>
                            <Text style={tw`text-gray-500 font-[InterTight]`}>No recent activity</Text>
                        </View>
                    ) : (
                        recentItems.map(item => renderItem(item.id, item.title, item.subtitle, item.type))
                    )}
                </View>
            </ScrollView>
        </GlassBackground>
    );
}
