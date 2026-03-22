import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
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

const CATEGORY_INFO: Record<string, { name: string; icon: any; type: string }> = {
    ideas: { name: 'Recorded Ideas', icon: Mic, type: 'idea' },
    roadmaps: { name: 'My Roadmaps', icon: MapPin, type: 'roadmap' },
    resources: { name: 'Resources', icon: Download, type: 'module' },
    conversations: { name: 'Conversations', icon: MessageSquare, type: 'conversation' }
};

export default function LibraryCategoryScreen() {
    const { user } = useAuth();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const categoryInfo = CATEGORY_INFO[id as string] || CATEGORY_INFO['ideas'];
    
    const [items, setItems] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchCategoryItems();
        }, [id, user])
    );

    const fetchCategoryItems = async () => {
        if (!user || !id) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('library_saves')
                .select('*')
                .eq('user_id', user.id)
                .eq('item_type', categoryInfo.type)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const transformedItems = data.map(item => ({
                id: item.id,
                itemId: item.item_id,
                title: item.title || `${categoryInfo.name.slice(0, -1)}`,
                subtitle: (item.item_type === 'idea' || item.item_type === 'conversation') 
                    ? `Last modified: ${new Date(item.created_at).toLocaleDateString()} at ${new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                    : `Saved ${new Date(item.created_at).toLocaleDateString()}`,
                type: item.item_type
            }));

            setItems(transformedItems);
        } catch (err) {
            console.error('Fetch Category Error:', err);
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
                            setItems(prev => prev.filter(item => item.id !== id));
                        } catch (err) {
                            console.error('Delete Item Error:', err);
                        }
                    },
                    style: "destructive" 
                }
            ]
        );
    };

    const renderItem = (item: any) => (
        <TouchableOpacity 
            activeOpacity={0.7} 
            style={tw`mb-4`} 
            key={item.id}
            onPress={() => {
                if (item.type === 'roadmap') router.push(`/roadmap-details/${item.itemId}`);
                else if (item.type === 'conversation' || item.type === 'idea') router.push({ pathname: '/record-idea', params: { id: item.itemId } });
                else Alert.alert("Coming soon", "This feature is being developed.");
            }}
        >
            <GlassCard style={tw`p-5 bg-white/5 border-t border-white/10`} noPadding>
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
                        <Text style={tw`text-white font-[InterTight] font-semibold text-2xl`}>{categoryInfo.name}</Text>
                        <Text style={tw`text-white/40 font-[InterTight] text-sm mt-0.5`}>{items.length} items</Text>
                    </View>
                </View>

                {/* Search */}
                <View style={tw`px-6 mb-8`}>
                    <View style={tw`bg-white/10 border border-white/15 rounded-full px-5 py-0 flex-row items-center`}>
                        <Search color="#fff" size={20} style={tw`mr-3 opacity-80`} />
                        <TextInput
                            style={[tw`flex-1 text-white font-[InterTight] text-[15px] py-3.5`, { lineHeight: undefined }]}
                            placeholder={`Search ${categoryInfo.name.toLowerCase()}...`}
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            textAlignVertical="center"
                        />
                    </View>
                </View>

                {/* Content */}
                <View style={tw`px-6`}>
                    {isLoading ? (
                        <View style={tw`py-20 items-center`}>
                            <ActivityIndicator color="#fff" />
                        </View>
                    ) : items.length === 0 ? (
                        <View style={tw`py-20 items-center`}>
                            <categoryInfo.icon color="rgba(255,255,255,0.1)" size={64} style={tw`mb-4`} />
                            <Text style={tw`text-gray-500 font-[InterTight] text-center`}>
                                No {categoryInfo.name.toLowerCase()} saved yet.
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
