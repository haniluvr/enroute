import tw from '@/lib/tailwind';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Lightbulb, Calendar, Download, FileText, Video, Wrench, Star, ChevronRight } from 'lucide-react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { careerDetailsMap } from '@/data/pathMockData';
import { pathIconMap } from '@/components/path/pathIconMap';
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import type { CareerDetails, ResourceItem } from '@/types/path';
import { parsePathMeta, parseModuleTitle } from '@/utils/pathUtils';

export default function CareerDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
    const [career, setCareer] = useState<CareerDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) fetchCareerData();
    }, [id]);

    const fetchCareerData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Path
            const { data: pathData, error: pathError } = await supabase
                .from('learning_paths')
                .select('*')
                .eq('id', id)
                .single();

            if (pathError) throw pathError;

            // 2. Fetch Modules
            const { data: modulesData, error: modulesError } = await supabase
                .from('learning_modules')
                .select('*')
                .eq('path_id', id);

            if (modulesError) throw modulesError;

            // 3. Parse Overview for stats
            const overview = pathData.overview || '';
            const salaryMatch = overview.match(/Average Market Salary: (.*)/);
            const demandMatch = overview.match(/Market Demand: (.*)/);

            const allModules = modulesData || [];
            
            const videos: ResourceItem[] = allModules
                .filter(m => m.content_type === 'video')
                .map(m => ({
                    id: m.id,
                    name: m.title,
                    url: m.content_url,
                    duration: Math.floor(Math.random() * 15) + 5
                }));

            const pdfs: ResourceItem[] = allModules.slice(0, 3).map(m => {
                const { cleanTitle } = parseModuleTitle(m.title);
                return {
                    id: m.id + '-pdf',
                    name: `Comprehensive Guide to ${cleanTitle}`,
                    url: '',
                    fileSize: `${(Math.random() * 3 + 1).toFixed(1)} MB`
                };
            });

            const articles: ResourceItem[] = allModules.slice(3, 7).map(m => {
                const { cleanTitle } = parseModuleTitle(m.title);
                return {
                    id: m.id + '-article',
                    name: `Best Practices in ${cleanTitle}`,
                    url: `https://www.google.com/search?q=${encodeURIComponent('best practices ' + cleanTitle)}`
                };
            });

            const mappedCareer: CareerDetails = {
                id: pathData.id,
                title: pathData.title,
                description: overview.split('\n')[0],
                icon: 'Palette', // Placeholder icon
                lastUpdated: new Date(pathData.created_at).toLocaleDateString(),
                learnItems: allModules.map(m => m.title),
                jobDemand: demandMatch ? demandMatch[1].trim() : 'High',
                avgSalary: salaryMatch ? salaryMatch[1].trim() : 'Competitive',
                estTimeToComplete: '6-12 months',
                pdfs: pdfs,
                videos: videos,
                articles: articles,
                reviews: [],
                overview: overview
            };

            setCareer(mappedCareer);
        } catch (err) {
            console.error('Fetch Career Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleReviewExpanded = (reviewId: string) => {
        setExpandedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
    };

    if (isLoading) {
        return (
            <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
                <SafeAreaView style={tw`flex-1 items-center justify-center`}>
                    <Text style={tw`text-white font-[InterTight]`}>Loading career path...</Text>
                </SafeAreaView>
            </GlassBackground>
        );
    }

    if (!career) {
        return (
            <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
                <SafeAreaView style={tw`flex-1`}>
                    <View style={tw`px-6 pt-4`}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mb-8`}
                        >
                            <ChevronLeft color="#ffffff" size={24} />
                        </TouchableOpacity>
                        <Text style={tw`text-gray-400 font-[InterTight]`}>Career not found.</Text>
                    </View>
                </SafeAreaView>
            </GlassBackground>
        );
    }

    const meta = parsePathMeta(career.overview || '');
    const cleanTitle = career.title.charAt(0).toUpperCase() + career.title.slice(1).replace(/-/g, ' ');
    const titlePrefix = meta.type === 'skill' ? 'Learning' : 'Becoming a';
    const IconComponent = pathIconMap[meta.icon] ?? pathIconMap.Palette;

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <ScrollView style={tw`flex-1`} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View style={tw`px-6 pt-16 pb-20`}>
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mb-6`}
                    >
                        <ChevronLeft color="#ffffff" size={24} />
                    </TouchableOpacity>

                    {/* Header */}
                    <Text style={tw`text-white font-[InterTight] font-semibold text-3xl mb-2`}>
                        Career details
                    </Text>
                    
                    <Text style={tw`text-gray-400 font-[InterTight] text-lg mb-4`}>
                        {meta.type === 'skill' 
                            ? 'Master a specific technology or tool.' 
                            : 'Learn, practice, and grow with resources tailored for this role.'}
                    </Text>

                    <Text style={tw`text-white font-[InterTight] font-medium text-lg mb-2`}>
                        {titlePrefix} {cleanTitle}
                    </Text>

                    {/* Card 1: Role Overview */}
                    <GlassCard style={tw`p-5 bg-white/10 border-t border-white/20 mb-4`} noPadding>
                        <View style={tw`flex-row items-center mb-4`}>
                            <View style={tw`bg-[#FF9500]/20 px-3 py-1.5 rounded-full flex-row items-center border border-[#FF9500]/60 mr-2`}>
                                <Lightbulb color="#FF9500" size={14} style={tw`mr-1.5`} />
                                <Text style={tw`text-[#FF9500] font-[InterTight-Medium] text-sm`}>
                                    {meta.type === 'skill' ? 'Skill overview' : 'Role overview'}
                                </Text>
                            </View>
                        </View>
                        <Text style={tw`text-gray-400 font-[InterTight-SemiBold] text-lg mb-2`}>
                            What you need to learn:
                        </Text>
                        <View style={tw`mb-4 pl-2`}>
                            {career.learnItems.map((item, i) => {
                                const { cleanTitle } = parseModuleTitle(item);
                                return (
                                    <Text key={i} style={tw`text-white font-[InterTight] text-lg mb-2`}>
                                        • {cleanTitle}
                                    </Text>
                                );
                            })}
                        </View>
                        <View style={tw`bg-white/5 rounded-xl p-4`}>
                            <View style={tw`flex-row items-center mb-2`}>
                                <Lightbulb color="#fcfcfc80" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-400 font-[InterTight] text-base`}>
                                    Job Demand: {career.jobDemand}
                                </Text>
                            </View>
                            <View style={tw`flex-row items-center mb-2`}>
                                <IconComponent color="#fcfcfc80" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-400 font-[InterTight] text-base`}>
                                    Avg Salary: {career.avgSalary}
                                </Text>
                            </View>
                            <View style={tw`flex-row items-center`}>
                                <Calendar color="#fcfcfc80" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-400 font-[InterTight] text-base`}>
                                    Est time to complete: {career.estTimeToComplete}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Card 2: Learning Materials */}
                    <GlassCard style={tw`p-5 bg-white/10 border-t border-white/20 mb-4`} noPadding>
                        <View style={tw`flex-row items-center mb-4`}>
                            <View style={tw`bg-[#EAB308]/20 px-3 py-1.5 rounded-full flex-row items-center border border-[#EAB308]/60 mr-2`}>
                                <FileText color="#EAB308" size={14} style={tw`mr-1.5`} />
                                <Text style={tw`text-[#EAB308] font-[InterTight-Medium] text-sm`}>
                                    Learning materials
                                </Text>
                            </View>
                        </View>

                        {/* PDFs */}
                        {career.pdfs.length > 0 && (
                            <>
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-lg mb-3`}>PDFs</Text>
                                {career.pdfs.map((pdf, i) => (
                                    <View key={pdf.id}>
                                        <View style={tw`flex-row justify-between items-center`}>
                                            <Text style={tw`text-gray-300 font-[InterTight] text-base`}>
                                                {pdf.name}
                                            </Text>
                                            <TouchableOpacity style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center`}>
                                                <Download color="#fff" size={16} />
                                            </TouchableOpacity>
                                        </View>
                                        {pdf.fileSize && (
                                            <Text style={tw`text-gray-500 font-[InterTight] text-sm mb-3`}>
                                                {pdf.fileSize}
                                            </Text>
                                        )}
                                        {i < career.pdfs.length - 1 && (
                                            <View style={[tw`h-px bg-white/10 mb-3`, { width: '80%' }]} />
                                        )}
                                    </View>
                                ))}
                                <View style={[tw`h-px bg-white/10 mb-4`, { width: '80%' }]} />
                            </>
                        )}

                        {/* Videos */}
                        {career.videos.length > 0 && (
                            <>
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-lg mb-3`}>Videos</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
                                    {career.videos.map((video) => {
                                        const { cleanTitle } = parseModuleTitle(video.name);
                                        const videoId = video.url?.split('v=')[1]?.split('&')[0];
                                        const thumbnailUrl = videoId 
                                            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                                            : null;

                                        return (
                                            <TouchableOpacity 
                                                key={video.id}
                                                activeOpacity={0.9}
                                                onPress={() => {/* Open URL */}}
                                            >
                                                <ImageBackground
                                                    source={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
                                                    style={tw`w-62 h-35 bg-white/10 rounded-xl mr-3 overflow-hidden justify-end`}
                                                    imageStyle={tw`opacity-60`}
                                                >
                                                    <View style={tw`p-3 bg-black/40`}>
                                                        <Text style={tw`text-white font-[InterTight-Medium] text-sm`} numberOfLines={1}>
                                                            {cleanTitle}
                                                        </Text>
                                                        <Text style={tw`text-gray-300 font-[InterTight] text-[10px]`}>
                                                            Tutorial Resource
                                                        </Text>
                                                    </View>
                                                </ImageBackground>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                                <View style={[tw`h-px bg-white/10 mb-4`, { width: '80%' }]} />
                            </>
                        )}

                        {/* Articles & Tools */}
                        {career.articles.length > 0 && (
                            <>
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-lg mb-3`}>Articles & Tools</Text>
                                {career.articles.map((article, i) => (
                                    <View key={article.id}>
                                        <View style={tw`flex-row justify-between items-center mb-1`}>
                                            <Text style={tw`text-gray-300 font-[InterTight] text-base`}>
                                                {article.name}
                                            </Text>
                                            <TouchableOpacity style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center`}>
                                                <Download color="#fff" size={16} />
                                            </TouchableOpacity>
                                        </View>
                                        {i < career.articles.length - 1 && (
                                            <View style={[tw`h-px bg-white/10 mb-3`, { width: '80%' }]} />
                                        )}
                                    </View>
                                ))}
                                <View style={[tw`h-px bg-white/10 mb-4`, { width: '80%' }]} />
                            </>
                        )}

                        {/* Counts */}
                        <View style={tw`bg-white/5 rounded-xl p-4`}>
                            <View style={tw`flex-row items-center mb-2`}>
                                <FileText color="#fcfcfc80" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>
                                    PDFs: {career.pdfs.length}
                                </Text>
                            </View>
                            <View style={tw`flex-row items-center mb-2`}>
                                <Video color="#fcfcfc80" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>
                                    Videos: {career.videos.length}
                                </Text>
                            </View>
                            <View style={tw`flex-row items-center`}>
                                <Wrench color="#fcfcfc80" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>
                                    Articles & Tools: {career.articles.length}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Reviews */}
                    {career.reviews.length > 0 && (
                        <View style={tw`mb-6`}>
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-lg`}>
                                    Reviews ({career.reviews.length})
                                </Text>
                                <TouchableOpacity style={tw`flex-row items-center`}>
                                    <Text style={tw`text-gray-300 font-[InterTight] text-base`}>See all</Text>
                                    <ChevronRight color="#888" size={18} style={tw`ml-1`} />
                                </TouchableOpacity>
                            </View>

                            {career.reviews.map((review) => {
                                const isExpanded = expandedReviews[review.id];
                                return (
                                    <View key={review.id} style={tw`mb-4`}>
                                        <GlassCard style={tw`p-4 bg-white/10 border-t border-white/10`} noPadding>
                                            <View style={tw`flex-row justify-between items-start`}>
                                                <View style={tw`flex-row`}>
                                                    <View style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3`}>
                                                        <Text style={tw`text-white font-[InterTight-SemiBold] text-base`}>
                                                            {review.authorName.charAt(0)}
                                                        </Text>
                                                    </View>
                                                    <View>
                                                        <Text style={tw`text-white font-[InterTight-Medium] text-base`}>
                                                            {review.authorName}
                                                        </Text>
                                                        <View style={tw`flex-row items-center mt-1`}>
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    color="#EEDF7A"
                                                                    size={14}
                                                                    fill={star <= review.rating ? '#EEDF7A' : 'transparent'}
                                                                    style={tw`mr-0.5`}
                                                                />
                                                            ))}
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                            <Text
                                                style={tw`text-gray-400 font-[InterTight] text-sm mt-3`}
                                                numberOfLines={isExpanded ? undefined : 3}
                                            >
                                                {review.text}
                                            </Text>
                                            {review.text.length > 100 && (
                                                <TouchableOpacity
                                                    onPress={() => toggleReviewExpanded(review.id)}
                                                    style={tw`mt-2`}
                                                >
                                                    <Text style={tw`text-[#EEDF7A] font-[InterTight-Medium] text-sm`}>
                                                        {isExpanded ? 'Read less' : 'Read more'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </GlassCard>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Action Buttons - scrollable with content */}
                    <View style={tw`mt-6`}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={tw`w-full bg-white py-4 rounded-full items-center justify-center mb-4`}
                        >
                            <Text style={tw`text-black text-lg font-[InterTight] font-semibold`}>
                                Download resources
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.75}
                            style={tw`w-full py-4 rounded-full items-center justify-center border border-white/25 bg-transparent`}
                        >
                            <Text style={tw`text-white text-lg font-[InterTight] font-semibold`}>
                                Save path
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </GlassBackground>
    );
}
