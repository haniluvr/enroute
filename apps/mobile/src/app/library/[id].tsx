import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

const CATEGORY_MAP: Record<string, { name: string; icon: any; items: any[] }> = {
    ideas: {
        name: 'Recorded Ideas',
        icon: Mic,
        items: [
            { id: 101, title: "Voice Idea: App Concept", subtitle: "Recorded yesterday", type: "idea" },
            { id: 102, title: "Career Vision 2026", subtitle: "Recorded 3 days ago", type: "idea" },
            { id: 103, title: "Interview Prep Notes", subtitle: "Recorded last week", type: "idea" },
        ]
    },
    roadmaps: {
        name: 'My Roadmaps',
        icon: MapPin,
        items: [
            { id: 201, title: "UI/UX Design Roadmap", subtitle: "Updated 2 days ago", type: "roadmap" },
            { id: 202, title: "Frontend Mastery Path", subtitle: "Updated 1 week ago", type: "roadmap" },
            { id: 203, title: "Product Management Guide", subtitle: "Started 2 weeks ago", type: "roadmap" },
        ]
    },
    resources: {
        name: 'Resources',
        icon: Download,
        items: [
            { id: 301, title: "Product Management 101", subtitle: "Downloaded Resource", type: "resource" },
            { id: 302, title: "Resume Templates Pack", subtitle: "Saved Resource", type: "resource" },
            { id: 303, title: "System Design Cheat Sheet", subtitle: "Downloaded Resource", type: "resource" },
        ]
    },
    conversations: {
        name: 'Conversations',
        icon: MessageSquare,
        items: [
            { id: 401, title: "Dahlia Conversation", subtitle: "Career advice session", type: "conversation" },
            { id: 402, title: "Session with Marcus", subtitle: "Resume review", type: "conversation" },
            { id: 403, title: "Mock Interview #1", subtitle: "Technical round", type: "conversation" },
        ]
    }
};

export default function LibraryCategoryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const category = CATEGORY_MAP[id as string] || CATEGORY_MAP['ideas'];
    
    const [items, setItems] = React.useState(category.items);

    const handleDelete = (itemId: number) => {
        Alert.alert(
            "Delete Item",
            "Are you sure you want to remove this item from your library?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    onPress: () => setItems(prev => prev.filter(item => item.id !== itemId)),
                    style: "destructive" 
                }
            ]
        );
    };

    const renderItem = (item: any) => (
        <TouchableOpacity activeOpacity={0.7} style={tw`mb-4`} key={item.id}>
            <GlassCard style={tw`p-5 bg-[#1C1C1E]/80 border-t border-white/10`} noPadding>
                <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-white font-[InterTight-Medium] text-[15px] mb-1`}>{item.title}</Text>
                        <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>{item.subtitle}</Text>
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                        <TouchableOpacity 
                            onPress={() => handleDelete(item.id)}
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
                <View style={tw`px-6 pt-16 pb-6 flex-row items-center`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10 mr-4`}
                    >
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <View>
                        <Text style={tw`text-white font-[InterTight] font-semibold text-2xl`}>{category.name}</Text>
                        <Text style={tw`text-white/40 font-[InterTight] text-sm mt-0.5`}>{items.length} items</Text>
                    </View>
                </View>

                {/* Search */}
                <View style={tw`px-6 mb-8`}>
                    <View style={tw`bg-white/10 border border-white/15 rounded-full px-5 py-0 flex-row items-center`}>
                        <Search color="#fff" size={20} style={tw`mr-3 opacity-80`} />
                        <TextInput
                            style={[tw`flex-1 text-white font-[InterTight] text-[15px] py-3.5`, { lineHeight: undefined }]}
                            placeholder={`Search ${category.name.toLowerCase()}...`}
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            textAlignVertical="center"
                        />
                    </View>
                </View>

                {/* Content */}
                <View style={tw`px-6`}>
                    {items.length === 0 ? (
                        <View style={tw`py-20 items-center`}>
                            <category.icon color="rgba(255,255,255,0.1)" size={64} style={tw`mb-4`} />
                            <Text style={tw`text-gray-500 font-[InterTight] text-center`}>
                                No {category.name.toLowerCase()} saved yet.
                            </Text>
                        </View>
                    ) : (
                        items.map(renderItem)
                    )}
                </View>
            </ScrollView>
        </GlassBackground>
    );
}
