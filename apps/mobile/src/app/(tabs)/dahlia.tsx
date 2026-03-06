import tw from '@/lib/tailwind';
import { View, Text, TextInput } from 'react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { Sparkles, Search } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';

export default function DahliaScreen() {
    const { q } = useLocalSearchParams<{ q: string }>();
    const [searchQuery, setSearchQuery] = useState(q || '');

    useEffect(() => {
        if (q) setSearchQuery(q);
    }, [q]);

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`flex-1 pt-16 px-6`}>
                <View style={tw`flex-row items-center mb-8`}>
                    <View style={tw`bg-accent-pink/20 p-2 rounded-xl mr-3`}>
                        <Sparkles color="#ff007f" size={24} />
                    </View>
                    <Text style={tw`text-white font-[InterTight-Bold] text-2xl`}>Dahlia AI</Text>
                </View>

                {/* Dahlia Input */}
                <View style={tw`bg-white/10 border border-white/15 rounded-3xl p-5 mb-8`}>
                    <View style={tw`flex-row items-center mb-4`}>
                        <Search color="#ff007f" size={20} style={tw`mr-2`} />
                        <Text style={tw`text-accent-pink font-[InterTight-Medium]`}>How can I help you today?</Text>
                    </View>
                    <TextInput
                        style={tw`text-white font-[InterTight] text-lg`}
                        placeholder="Ask me anything..."
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        multiline
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={!!q}
                    />
                </View>

                <View style={tw`flex-1 items-center justify-center opacity-50`}>
                    <Text style={tw`text-gray-400 font-[InterTight] text-center`}>
                        Voice and text interactions coming soon.
                    </Text>
                </View>
            </View>
        </GlassBackground>
    );
}
