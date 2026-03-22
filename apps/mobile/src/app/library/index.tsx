import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Keyboard, ActivityIndicator } from 'react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { useRouter, useFocusEffect } from 'expo-router';
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
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES = [
    { id: 'ideas', name: 'Recorded Ideas', icon: Mic, color: '#FF9500' },
    { id: 'roadmaps', name: 'My Roadmaps', icon: MapPin, color: '#5856D6' },
    { id: 'resources', name: 'Resources', icon: Download, color: '#32ADE6' },
    { id: 'conversations', name: 'Conversations', icon: MessageSquare, color: '#AF52DE' },
];

export default function LibraryScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [recentItems, setRecentItems] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchLibraryItems();
        }, [user])
    );

    const fetchLibraryItems = async () => {
        if (!user) return;
        setIsLoading(true);
        if (user.id === 'pending') {
            setRecentItems([]);
            setIsLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('library_saves')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            
            const transformedItems = data.map(item => ({
                id: item.id,
                title: item.title || `${item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}`,
                subtitle: (item.item_type === 'idea' || item.item_type === 'conversation') 
                    ? `Last modified: ${new Date(item.created_at).toLocaleDateString()} at ${new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                    : `Saved ${new Date(item.created_at).toLocaleDateString()}`,
                type: item.item_type,
                itemId: item.item_id
            }));

            setRecentItems(transformedItems);
        } catch (err) {
            console.error('Fetch Library Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Delete Item",
            "Are you sure you want to remove this item from your library?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('library_saves')
                                .delete()
                                .eq('id', id);
                            
                            if (error) throw error;
                            setRecentItems(prev => prev.filter(item => item.id !== id));
                        } catch (err) {
                            console.error('Delete Library Item Error:', err);
                        }
                    },
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

    const renderItem = (id: string, title: string, subtitle: string, type: string, itemId: string) => (
        <TouchableOpacity 
            key={id}
            activeOpacity={0.7} 
            style={tw`mb-4`}
            onPress={() => {
                if (type === 'roadmap') router.push(`/roadmap-details/${itemId}`);
                else if (type === 'conversation' || type === 'idea') router.push({ pathname: '/record-idea', params: { id: itemId } });
                else Alert.alert("Coming soon", "This feature is being developed.");
            }}
        >
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
                {!isLoading && recentItems.length > 0 && (
                    <View style={tw`px-6`}>
                        <View style={tw`flex-row justify-between items-center mb-5`}>
                            <Text style={tw`text-gray-300 font-[InterTight-Medium] text-[17px]`}>Recent Activity</Text>
                            <TouchableOpacity onPress={handleClearAll}>
                                <Text style={tw`text-white/40 font-[InterTight] text-sm`}>Clear all</Text>
                            </TouchableOpacity>
                        </View>
                        {recentItems.map(item => renderItem(item.id, item.title, item.subtitle, item.type, item.itemId))}
                    </View>
                )}

                {isLoading && (
                    <View style={tw`py-10 items-center`}>
                        <ActivityIndicator color="#fff" />
                    </View>
                )}
            </ScrollView>
        </GlassBackground>
    );
}
