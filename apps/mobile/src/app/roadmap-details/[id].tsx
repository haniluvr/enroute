import tw from '@/lib/tailwind';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, GraduationCap, Calendar, Download, FileText, Video, Wrench, Star, ChevronRight, Lightbulb } from 'lucide-react-native';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { careerDetailsMap } from '@/data/pathMockData';
import { pathIconMap } from '@/components/path/pathIconMap';
import { RoadmapCanvas } from '@/components/path/RoadmapCanvas';
import { NodeDetailsSheet } from '@/components/path/NodeDetailsSheet';
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import type { CareerDetails, ResourceItem } from '@/types/path';
import { parseModuleTitle, parsePathMeta, formatPathTitle } from '@/utils/pathUtils';

export default function RoadmapDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
    const [selectedNode, setSelectedNode] = useState<any>(null);

    const careerMock = id ? careerDetailsMap[id as keyof typeof careerDetailsMap] : null;

    const [dbStep, setDbStep] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id || (careerMock && id.length < 5)) { // If it's a mock ID like '1', '2'
            setIsLoading(false);
            return;
        }

        const fetchFullStepData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch the Roadmap Step
                const { data: stepData, error: stepError } = await supabase
                    .from('roadmap_steps')
                    .select('id, title, description, roadmap_id, roadmaps(id, target_role, salary_range, demand_level, estimated_duration)')
                    .eq('id', id)
                    .single();

                if (stepError) throw stepError;

                const roadmapMeta = Array.isArray(stepData.roadmaps) ? stepData.roadmaps[0] : stepData.roadmaps;
                const stepTitle = (stepData.title || '').trim().toLowerCase();
                const targetRole = (roadmapMeta?.target_role || '').trim().toLowerCase();

                // 2. SEARCH FOR MATCHING CAREER PATH (THE CORE FIX)
                // We try to match the specific step first, then the overall roadmap role as fallback
                const cleanStepSearch = stepTitle.replace(/^step \d+: /i, '').replace(/^phase \d+: /i, '');
                
                const { data: pathData } = await supabase
                    .from('learning_paths')
                    .select('*')
                    .or(`title.ilike.%${cleanStepSearch}%,title.ilike.%${targetRole}%,overview.ilike.%${targetRole}%`)
                    .limit(1)
                    .maybeSingle();

                let allModules: any[] = [];
                if (pathData) {
                    const { data: modules } = await supabase
                        .from('learning_modules')
                        .select('*')
                        .eq('path_id', pathData.id);
                    if (modules) allModules = modules;
                }

                // 3. APPLY RESOURCES LOGIC FROM CAREER-DETAILS (Exact Mirror)
                const videos: ResourceItem[] = allModules
                    .filter((m: any) => m.content_type === 'video')
                    .map((m: any) => ({
                        id: m.id,
                        name: m.title,
                        url: m.content_url,
                        duration: Math.floor(Math.random() * 15) + 5
                    }));

                const pdfs: ResourceItem[] = allModules.slice(0, 3).map((m: any) => {
                    const { cleanTitle } = parseModuleTitle(m.title);
                    return {
                        id: m.id + '-pdf',
                        name: `Comprehensive Guide to ${cleanTitle}`,
                        url: '',
                        fileSize: `${(Math.random() * 3 + 1).toFixed(1)} MB`
                    };
                });

                const articles: ResourceItem[] = allModules.slice(3, 7).map((m: any) => {
                    const { cleanTitle } = parseModuleTitle(m.title);
                    return {
                        id: m.id + '-article',
                        name: `Best Practices in ${cleanTitle}`,
                        url: `https://www.google.com/search?q=${encodeURIComponent('best practices ' + cleanTitle)}`
                    };
                });

                // 4. PARSE ROADMAP GRAPH
                let roadmapGraph = { nodes: [], edges: [] };
                const overview = pathData?.overview || '';
                const roadmapMatch = overview.match(/\[ROADMAP\]([\s\S]*?)\[\/ROADMAP\]/);
                if (roadmapMatch) {
                    try { roadmapGraph = JSON.parse(roadmapMatch[1]); } catch (e) {}
                }

                const meta = parsePathMeta(overview);

                setDbStep({
                    ...pathData, // Inherit path data if found
                    id: stepData.id,
                    title: stepData.title,
                    description: stepData.description,
                    overview: overview,
                    learnItems: allModules.map((m: any) => m.title),
                    jobDemand: roadmapMeta?.demand_level || 'High',
                    avgSalary: roadmapMeta?.salary_range || 'Competitive',
                    estTimeToComplete: roadmapMeta?.estimated_duration || '6-12 months',
                    pdfs: pdfs.length > 0 ? pdfs : [],
                    videos: videos.length > 0 ? videos : [],
                    articles: articles.length > 0 ? articles : [],
                    reviews: [],
                    icon: 'GraduationCap',
                    roadmapGraph: roadmapGraph,
                    meta: meta
                });

            } catch (err) {
                console.error('Fetch Error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFullStepData();
    }, [id, careerMock]);

    const displayData = careerMock || dbStep;

    if (isLoading) {
        return (
            <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
                <SafeAreaView style={tw`flex-1 items-center justify-center`}>
                    <ActivityIndicator color="#fff" size="large" />
                </SafeAreaView>
            </GlassBackground>
        );
    }

    if (!displayData) return null;

    const IconComponent = pathIconMap[displayData.meta?.icon] ?? pathIconMap.GraduationCap;

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <ScrollView style={tw`flex-1`} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View style={tw`px-6 pt-16 pb-20`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center mb-6`}>
                        <ChevronLeft color="#ffffff" size={24} />
                    </TouchableOpacity>

                    {/* Matching Headers from Career-Details with minor variations */}
                    <Text style={tw`text-white font-[InterTight] font-semibold text-3xl mb-2`}>Your learning roadmap</Text>
                    <Text style={tw`text-gray-400 font-[InterTight] text-lg mb-4`}>Learn, practice, and grow with resources tailored for this role</Text>
                    <Text style={tw`text-white/80 font-[InterTight-Medium] text-xl mb-8`}>{displayData.title} path</Text>

                    {/* Card 1: Course Overview (Equivalent to Role Overview) */}
                    <GlassCard style={tw`p-5 bg-white/10 border-t border-white/20 mb-4`} noPadding>
                        <View style={tw`flex-row items-center mb-4`}>
                            <View style={tw`bg-[#f43f5e]/20 px-3 py-1.5 rounded-full flex-row items-center border border-[#f43f5e]/60 mr-2`}>
                                <GraduationCap color="#f43f5e" size={14} style={tw`mr-1.5`} />
                                <Text style={tw`text-[#f43f5e] font-[InterTight-Medium] text-sm`}>Course overview</Text>
                            </View>
                        </View>
                        
                        <Text style={tw`text-gray-400 font-[InterTight-SemiBold] text-lg mb-2`}>Interactive roadmap:</Text>
                        
                        {displayData.roadmapGraph?.nodes?.length > 0 ? (
                            <RoadmapCanvas data={displayData.roadmapGraph} onNodePress={setSelectedNode} />
                        ) : (
                            <View style={tw`mb-4 mt-2 px-2 py-8 items-center bg-black/10 rounded-2xl`}>
                                <Text style={tw`text-white/30 font-[InterTight]`}>Generating visual graph data...</Text>
                            </View>
                        )}

                        <View style={tw`bg-white/5 rounded-xl p-4 mt-4`}>
                            <View style={tw`flex-row items-center mb-3`}>
                                <Lightbulb color="#fcfcfc80" size={16} style={tw`mr-3`} />
                                <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>Market Demand: <Text style={tw`text-white`}>{displayData.jobDemand}</Text></Text>
                            </View>
                            <View style={tw`flex-row items-center mb-3`}>
                                <IconComponent color="#fcfcfc80" size={16} style={tw`mr-3`} />
                                <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>Avg Salary: <Text style={tw`text-white`}>{displayData.avgSalary}</Text></Text>
                            </View>
                            <View style={tw`flex-row items-center`}>
                                <Calendar color="#fcfcfc80" size={16} style={tw`mr-3`} />
                                <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>Est time for path: <Text style={tw`text-white`}>{displayData.estTimeToComplete}</Text></Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Card 2: Learning Materials (Exact Mirror of Career-Details Layout) */}
                    <GlassCard style={tw`p-5 bg-white/10 border-t border-white/20 mb-4`} noPadding>
                        <View style={tw`flex-row items-center mb-4`}>
                            <View style={tw`bg-[#EAB308]/20 px-3 py-1.5 rounded-full flex-row items-center border border-[#EAB308]/60 mr-2`}>
                                <FileText color="#EAB308" size={14} style={tw`mr-1.5`} />
                                <Text style={tw`text-[#EAB308] font-[InterTight-Medium] text-sm`}>Learning materials</Text>
                            </View>
                        </View>

                        {/* PDFs */}
                        {displayData.pdfs?.length > 0 && (
                            <View style={tw`mb-6`}>
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-lg mb-3`}>PDFs</Text>
                                {displayData.pdfs.map((pdf: any, i: number) => (
                                    <View key={pdf.id}>
                                        <View style={tw`flex-row justify-between items-center`}>
                                            <Text style={tw`text-gray-300 font-[InterTight] text-base flex-1 mr-4`}>{pdf.name}</Text>
                                            <TouchableOpacity style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center`}>
                                                <Download color="#fff" size={16} />
                                            </TouchableOpacity>
                                        </View>
                                        {pdf.fileSize && <Text style={tw`text-gray-500 font-[InterTight] text-sm mb-3`}>{pdf.fileSize}</Text>}
                                        {i < displayData.pdfs.length - 1 && <View style={[tw`h-px bg-white/10 mb-3`, { width: '80%' }]} />}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Videos (with the same thumbnail logic) */}
                        {displayData.videos?.length > 0 && (
                            <View style={tw`mb-6`}>
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-lg mb-3`}>Videos</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {displayData.videos.map((video: any) => {
                                        const { cleanTitle } = parseModuleTitle(video.name);
                                        const videoId = video.url?.split('v=')[1]?.split('&')[0];
                                        const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

                                        return (
                                            <TouchableOpacity key={video.id} style={tw`mr-3`}>
                                                <ImageBackground source={thumbnailUrl ? { uri: thumbnailUrl } : undefined} style={tw`w-62 h-35 bg-white/10 rounded-xl overflow-hidden justify-end`} imageStyle={tw`opacity-60`}>
                                                    <View style={tw`p-3 bg-black/40`}>
                                                        <Text style={tw`text-white font-[InterTight-Medium] text-sm`} numberOfLines={1}>{cleanTitle}</Text>
                                                        <Text style={tw`text-gray-300 font-[InterTight] text-[10px]`}>Tutorial Resource</Text>
                                                    </View>
                                                </ImageBackground>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        {/* Articles */}
                        {displayData.articles?.length > 0 && (
                            <View style={tw`mb-6`}>
                                <Text style={tw`text-white font-[InterTight-SemiBold] text-lg mb-3`}>Articles & Tools</Text>
                                {displayData.articles.map((article: any, i: number) => (
                                    <View key={article.id}>
                                        <View style={tw`flex-row justify-between items-center mb-1`}>
                                            <Text style={tw`text-gray-300 font-[InterTight] text-base flex-1 mr-4`}>{article.name}</Text>
                                            <TouchableOpacity style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center`}>
                                                <Download color="#fff" size={16} />
                                            </TouchableOpacity>
                                        </View>
                                        {i < displayData.articles.length - 1 && <View style={[tw`h-px bg-white/10 mb-3`, { width: '80%' }]} />}
                                    </View>
                                ))}
                            </View>
                        )}
                    </GlassCard>

                    {/* Action Buttons */}
                    <View style={tw`mt-6`}>
                        <TouchableOpacity style={tw`w-full bg-white py-4 rounded-full items-center justify-center mb-4`}>
                            <Text style={tw`text-black text-lg font-bold`}>START LEARNING</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={tw`w-full py-4 rounded-full items-center justify-center border border-white/20 bg-transparent`}>
                            <Text style={tw`text-white text-lg font-semibold`}>Save module</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <NodeDetailsSheet visible={!!selectedNode} node={selectedNode} onClose={() => setSelectedNode(null)} />
        </GlassBackground>
    );
}
