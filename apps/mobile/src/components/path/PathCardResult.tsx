import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Calendar, Star } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { Link } from 'expo-router';
import type { PathCard as PathCardType } from '@/types/path';
import { pathIconMap } from './pathIconMap';

interface PathCardResultProps {
    item: PathCardType;
}

function AvatarPlaceholder({ index }: { index: number }) {
    return (
        <View
            style={[
                tw`w-6 h-6 rounded-full bg-white/20 border-2 border-[#1C1C1E] items-center justify-center`,
                index > 0 && { marginLeft: -5 },
            ]}
        >
            <Text style={tw`text-white text-[10px] font-[InterTight-SemiBold]`}>
                {String.fromCharCode(65 + (index % 26))}
            </Text>
        </View>
    );
}

export function PathCardResult({ item }: PathCardResultProps) {
    const IconComponent = pathIconMap[item.icon] ?? pathIconMap.Palette;
    const rating = item.rating ?? 0;
    const reviewCount = item.reviewCount ?? 0;
    const avatarUrls = item.avatarUrls ?? [];

    return (
        <Link href={`/(tabs)/path/career-details/${item.id}`} asChild>
            <TouchableOpacity activeOpacity={0.8}>
            <GlassCard style={tw`p-5 bg-white/10 border-t border-white/20 mb-4`} noPadding>
                <View style={tw`flex-row justify-between items-start mb-3`}>
                    <View
                        style={[
                            tw`w-12 h-12 rounded-2xl items-center justify-center bg-white/10`,
                            {
                                shadowColor: 'rgba(255,255,255,0.3)',
                                shadowOffset: { width: 0, height: 0 },
                                shadowRadius: 4,
                                shadowOpacity: 0.5,
                            },
                        ]}
                    >
                        <IconComponent color="#fff" size={24} />
                    </View>
                    <View style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center`}>
                        <ChevronRight color="#888" size={18} />
                    </View>
                </View>

                <Text style={tw`text-white font-[InterTight-SemiBold] text-base mb-1`} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={tw`text-gray-400 font-[InterTight] text-sm mb-3`} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={tw`flex-row items-center mb-2`}>
                    {avatarUrls.slice(0, 4).map((_, i) => (
                        <AvatarPlaceholder key={i} index={i} />
                    ))}
                    <View style={tw`flex-row items-center ml-2`}>
                        <Star color="#EEDF7A" size={14} fill="#EEDF7A" style={tw`mr-1`} />
                        <Text style={tw`text-white font-[InterTight-Medium] text-sm`}>
                            {rating.toFixed(1)}
                        </Text>
                        <Text style={tw`text-gray-500 font-[InterTight] text-xs ml-1`}>
                            ({reviewCount} reviews)
                        </Text>
                    </View>
                </View>

                <View style={tw`bg-white/5 rounded-xl px-4 py-2.5 mt-1`}>
                    <View style={tw`flex-row items-center`}>
                        <Calendar color="#888" size={14} style={tw`mr-1.5`} />
                        <Text style={tw`text-gray-500 font-[InterTight] text-xs`}>
                            Last updated: {item.lastUpdated}
                        </Text>
                    </View>
                </View>
            </GlassCard>
            </TouchableOpacity>
        </Link>
    );
}
