import tw from '@/lib/tailwind';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Calendar, Star } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { Link } from 'expo-router';
import type { PathCard as PathCardType } from '@/types/path';
import { pathIconMap } from './pathIconMap';
import { parsePathMeta } from '@/utils/pathUtils';

interface PathCardResultProps {
    item: any;
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
    const meta = parsePathMeta(item.overview || '');
    const IconComponent = pathIconMap[meta.icon] ?? pathIconMap.Palette;
    const rating = parseFloat(item.reviews_avg) || 0;
    const reviewCount = Math.floor(Math.random() * 200) + 50; // Dynamic mock count
    const avatarUrls = [1, 2, 3];

    return (
        <Link href={`/(tabs)/path/career-details/${item.id}`} asChild>
            <TouchableOpacity activeOpacity={0.8}>
            <GlassCard style={tw`p-5 bg-white/10 border-t border-white/20 mb-4`} noPadding>
                <View style={tw`flex-row items-center mb-4`}>
                    <View
                        style={[
                            tw`w-14 h-14 rounded-2xl items-center justify-center bg-white/10 mr-4`,
                            {
                                shadowColor: 'rgba(255,255,255,0.3)',
                                shadowOffset: { width: 0, height: 0 },
                                shadowRadius: 4,
                                shadowOpacity: 0.5,
                            },
                        ]}
                    >
                        <IconComponent color="#fff" size={28} />
                    </View>
                    
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-white font-[InterTight-SemiBold] text-base mb-1`} numberOfLines={1}>
                            {item.title.charAt(0).toUpperCase() + item.title.slice(1).replace(/-/g, ' ')}
                        </Text>
                        <View style={tw`flex-row`}>
                            <View style={tw`${meta.type === 'role' ? 'bg-blue-500/20' : 'bg-teal-500/20'} px-2 py-0.5 rounded-full border ${meta.type === 'role' ? 'border-blue-500/40' : 'border-teal-500/40'}`}>
                                <Text style={tw`${meta.type === 'role' ? 'text-blue-400' : 'text-teal-400'} text-[9px] uppercase font-bold tracking-wider`}>
                                    {meta.type}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <Text style={tw`text-gray-400 font-[InterTight] text-sm mb-4`} numberOfLines={2}>
                    {meta.short_description || item.description || item.overview || ''}
                </Text>

                <View style={tw`flex-row items-center mb-4`}>
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

                <View style={tw`bg-white/5 rounded-xl px-4 py-2.5 mt-4`}>
                    <View style={tw`flex-row items-center`}>
                        <Calendar color="#888" size={14} style={tw`mr-1.5`} />
                        <Text style={tw`text-gray-500 font-[InterTight] text-xs`}>
                             Updated: {meta.last_updated}
                        </Text>
                    </View>
                </View>
            </GlassCard>
            </TouchableOpacity>
        </Link>
    );
}
