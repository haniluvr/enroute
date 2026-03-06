import tw from '@/lib/tailwind';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Lightbulb, Calendar, Download, FileText, Video, Wrench, Star, ChevronRight } from 'lucide-react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { careerDetailsMap } from '@/data/pathMockData';
import { pathIconMap } from '@/components/path/pathIconMap';
import { useState } from 'react';

export default function CareerDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

    const career = id ? careerDetailsMap[id] : null;

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

    const IconComponent = pathIconMap[career.icon] ?? pathIconMap.Palette;

    const toggleReviewExpanded = (reviewId: string) => {
        setExpandedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
    };

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
                    <Text style={tw`text-white font-[InterTight-Bold] text-2xl mb-2`}>
                        Career details
                    </Text>
                    <Text style={tw`text-gray-400 font-[InterTight] text-base mb-4`}>
                        Learn, practice, and grow with resources tailored for this role
                    </Text>
                    <Text style={tw`text-white font-[InterTight-SemiBold] text-lg mb-8`}>
                        Becoming a {career.title}
                    </Text>

                    {/* Card 1: Role Overview */}
                    <GlassCard style={tw`p-5 bg-white/10 border-t border-white/20 mb-4`} noPadding>
                        <View style={tw`flex-row items-center mb-4`}>
                            <View style={tw`bg-[#FF9500]/20 px-3 py-1.5 rounded-full flex-row items-center border border-[#FF9500]/60 mr-2`}>
                                <Lightbulb color="#FF9500" size={14} style={tw`mr-1.5`} />
                                <Text style={tw`text-[#FF9500] font-[InterTight-Medium] text-sm`}>
                                    Role overview
                                </Text>
                            </View>
                        </View>
                        <Text style={tw`text-white font-[InterTight-SemiBold] text-base mb-2`}>
                            What you need to learn:
                        </Text>
                        <View style={tw`mb-4`}>
                            {career.learnItems.map((item, i) => (
                                <Text key={i} style={tw`text-gray-400 font-[InterTight] text-sm mb-1`}>
                                    • {item}
                                </Text>
                            ))}
                        </View>
                        <View style={tw`bg-white/5 rounded-xl p-4`}>
                            <View style={tw`flex-row items-center mb-2`}>
                                <Lightbulb color="#FF9500" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-300 font-[InterTight] text-sm`}>
                                    Job Demand: {career.jobDemand}
                                </Text>
                            </View>
                            <View style={tw`flex-row items-center mb-2`}>
                                <IconComponent color="#FF9500" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-300 font-[InterTight] text-sm`}>
                                    Avg Salary: {career.avgSalary}
                                </Text>
                            </View>
                            <View style={tw`flex-row items-center`}>
                                <Calendar color="#FF9500" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-300 font-[InterTight] text-sm`}>
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
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-sm mb-3`}>PDFs</Text>
                                {career.pdfs.map((pdf, i) => (
                                    <View key={pdf.id}>
                                        <View style={tw`flex-row justify-between items-center mb-1`}>
                                            <Text style={tw`text-gray-300 font-[InterTight] text-sm`}>
                                                {pdf.name}
                                            </Text>
                                            <TouchableOpacity style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center`}>
                                                <Download color="#fff" size={16} />
                                            </TouchableOpacity>
                                        </View>
                                        {pdf.fileSize && (
                                            <Text style={tw`text-gray-500 font-[InterTight] text-xs mb-3`}>
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
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-sm mb-3`}>Videos</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
                                    {career.videos.map((video) => (
                                        <View
                                            key={video.id}
                                            style={tw`w-36 h-24 bg-white/10 rounded-xl mr-3 p-3 justify-end`}
                                        >
                                            <Text style={tw`text-white font-[InterTight-Medium] text-xs`} numberOfLines={1}>
                                                {video.name}
                                            </Text>
                                            <Text style={tw`text-gray-500 font-[InterTight] text-xs`}>
                                                {video.duration} mins
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                                <View style={[tw`h-px bg-white/10 mb-4`, { width: '80%' }]} />
                            </>
                        )}

                        {/* Articles & Tools */}
                        {career.articles.length > 0 && (
                            <>
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-sm mb-3`}>Articles & Tools</Text>
                                {career.articles.map((article, i) => (
                                    <View key={article.id}>
                                        <View style={tw`flex-row justify-between items-center mb-1`}>
                                            <Text style={tw`text-gray-300 font-[InterTight] text-sm`}>
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
                                <FileText color="#EAB308" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-300 font-[InterTight] text-sm`}>
                                    PDFs: {career.pdfs.length}
                                </Text>
                            </View>
                            <View style={tw`flex-row items-center mb-2`}>
                                <Video color="#EAB308" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-300 font-[InterTight] text-sm`}>
                                    Videos: {career.videos.length}
                                </Text>
                            </View>
                            <View style={tw`flex-row items-center`}>
                                <Wrench color="#EAB308" size={16} style={tw`mr-2`} />
                                <Text style={tw`text-gray-300 font-[InterTight] text-sm`}>
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
                                    <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>See all</Text>
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
                                                        <Text style={tw`text-white font-[InterTight-SemiBold] text-sm`}>
                                                            {review.authorName.charAt(0)}
                                                        </Text>
                                                    </View>
                                                    <View>
                                                        <Text style={tw`text-white font-[InterTight-Medium] text-sm`}>
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
