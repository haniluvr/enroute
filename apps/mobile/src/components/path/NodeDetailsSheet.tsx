import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, useWindowDimensions, ActivityIndicator, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { X, CheckCircle, Video, FileText, ExternalLink, Download, Book, Globe, PlayCircle } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import type { ResourceItem } from '@/types/path';
import { RoadmapService, RoadmapTopicContent } from '@/services/roadmapService';

interface NodeDetailsSheetProps {
    visible: boolean;
    node: any;
    onClose: () => void;
    roadmapTitle?: string;
    resources?: {
        videos: ResourceItem[];
        pdfs: ResourceItem[];
        articles: ResourceItem[];
    };
    isCompleted?: boolean;
    onToggleComplete?: (nodeId: string) => void;
}

export function NodeDetailsSheet({ 
    visible, 
    node, 
    onClose, 
    roadmapTitle,
    resources: mockResources,
    isCompleted,
    onToggleComplete
}: NodeDetailsSheetProps) {
    const { height } = useWindowDimensions();
    const translateY = useSharedValue(height);
    const [isVisible, setIsVisible] = useState(visible);
    const [localNode, setLocalNode] = useState(node);
    const [remoteContent, setRemoteContent] = useState<RoadmapTopicContent | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
 
    useEffect(() => {
        if (node) {
            setLocalNode(node);
            if (roadmapTitle) {
                fetchDetailedContent();
            }
        }
    }, [node, roadmapTitle]);

    const fetchDetailedContent = async () => {
        if (!node || !roadmapTitle) return;
        
        setIsLoadingContent(true);
        setRemoteContent(null);
        
        try {
            const slug = RoadmapService.getSlugFromTitle(roadmapTitle);
            if (slug) {
                const topicId = node.id;
                const topicLabel = node.data?.label || node.label;
                const content = await RoadmapService.getTopicContent(slug, topicId, topicLabel);
                if (content) {
                    setRemoteContent(content);
                }
            }
        } catch (error) {
            console.error('Error fetching node content:', error);
        } finally {
            setIsLoadingContent(false);
        }
    };

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
            translateY.value = withTiming(0, { duration: 250 });
        } else {
            translateY.value = withTiming(height, { duration: 250 }, (finished) => {
                if (finished) {
                    runOnJS(setIsVisible)(false);
                }
            });
        }
    }, [visible]);

    const handleClose = () => {
        onClose();
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    if (!localNode && !isVisible) return null;

    const activeNode = localNode || node;
    const title = remoteContent?.title || activeNode?.data?.label || 'Node Details';
    const description = remoteContent?.description || activeNode?.data?.description || `Explore detailed resources, best practices, and practical examples for understanding ${title}.`;

    const openLink = (url: string) => {
        if (url) Linking.openURL(url);
    };

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'video': return <PlayCircle color="#ef4444" size={20} />;
            case 'book': return <Book color="#8b5cf6" size={20} />;
            case 'official': return <Globe color="#3b82f6" size={20} />;
            default: return <FileText color="#f59e0b" size={20} />;
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <TouchableOpacity 
                activeOpacity={1} 
                onPress={handleClose}
                style={tw`flex-1 bg-black/60 justify-end`}
            >
                <TouchableOpacity activeOpacity={1} style={tw`w-full`}>
                    <Animated.View style={[
                        tw`bg-[#121212] w-full border-t border-white/20 rounded-t-[40px] pt-2 pb-10 px-6`,
                        { maxHeight: height * 0.85 },
                        animatedStyle
                    ]}>
                        {/* Drag indicator */}
                        <View style={tw`items-center mb-6`}>
                            <View style={tw`w-12 h-1.5 bg-white/10 rounded-full`} />
                        </View>

                        <View style={tw`flex-row justify-between items-start mb-6`}>
                            <View style={tw`flex-1 pr-4`}>
                                <Text style={tw`text-white font-[InterTight-Bold] text-2xl mb-2`}>
                                    {title}
                                </Text>
                                {isLoadingContent ? (
                                    <View style={tw`flex-row items-center mt-2`}>
                                        <ActivityIndicator size="small" color="#FFF" style={tw`mr-2`} />
                                        <Text style={tw`text-white/40 text-sm`}>Retrieving learning content...</Text>
                                    </View>
                                ) : (
                                    <Text style={tw`text-gray-400 font-[InterTight] text-base leading-6`}>
                                        {description}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity 
                                onPress={handleClose}
                                style={tw`w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center`}
                            >
                                <X color="#FFF" size={20} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-12`}>
                            <TouchableOpacity 
                                style={[
                                    tw`w-full rounded-2xl py-4 flex-row justify-center items-center mb-8 shadow-lg`,
                                    isCompleted ? tw`bg-green-500/20 border border-green-500/50` : tw`bg-white`
                                ]}
                                onPress={() => onToggleComplete?.(activeNode.id)}
                            >
                                <CheckCircle color={isCompleted ? "#22c55e" : "#000"} size={22} style={tw`mr-3`} />
                                <Text style={[
                                    tw`font-[InterTight-Bold] text-lg`,
                                    isCompleted ? tw`text-green-500` : tw`text-black`
                                ]}>
                                    {isCompleted ? 'Completed' : 'Mark as Done'}
                                </Text>
                            </TouchableOpacity>

                            <Text style={tw`text-white font-[InterTight-SemiBold] text-xl mb-4`}>
                                Learning Materials
                            </Text>

                            {/* Remote Content Resources */}
                            {remoteContent && remoteContent.resources.length > 0 ? (
                                <View style={tw`mb-6`}>
                                    {remoteContent.resources.map((res, idx) => (
                                        <GlassCard key={`${idx}-${res.url}`} style={tw`bg-white/5 border border-white/10 p-4 mb-3`} noPadding>
                                            <TouchableOpacity 
                                                style={tw`flex-row items-center`}
                                                onPress={() => openLink(res.url)}
                                            >
                                                <View style={tw`w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-4`}>
                                                    {getResourceIcon(res.type)}
                                                </View>
                                                <View style={tw`flex-1`}>
                                                    <Text style={tw`text-white font-[InterTight-Medium] text-base mb-0.5`} numberOfLines={1}>
                                                        {res.title}
                                                    </Text>
                                                    <Text style={tw`text-gray-500 font-[InterTight] text-sm uppercase tracking-tighter`}>
                                                        {res.type} Resource
                                                    </Text>
                                                </View>
                                                <ExternalLink color="#ffffff40" size={16} />
                                            </TouchableOpacity>
                                        </GlassCard>
                                    ))}
                                </View>
                            ) : null}

                            {!remoteContent && !isLoadingContent && (
                                <>
                                    <View style={tw`bg-white/5 p-4 rounded-xl mb-6 border border-dashed border-white/20`}>
                                        <Text style={tw`text-white/40 text-center`}>No detailed resources found via GitHub. Showing general materials.</Text>
                                    </View>
                                    
                                    {(mockResources?.videos?.length || 0) > 0 && (
                                        <View style={tw`mb-6`}>
                                            <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-3 uppercase tracking-wider`}>Video Tutorials</Text>
                                            {mockResources?.videos.slice(0, 2).map((video) => (
                                                <GlassCard key={video.id} style={tw`bg-white/5 border border-white/10 p-4 mb-3`} noPadding>
                                                    <TouchableOpacity style={tw`flex-row items-center`} onPress={() => openLink(video.url || '')}>
                                                        <View style={tw`w-10 h-10 rounded-full bg-red-500/10 items-center justify-center mr-4`}>
                                                            <Video color="#ef4444" size={20} />
                                                        </View>
                                                        <View style={tw`flex-1`}>
                                                            <Text style={tw`text-white font-[InterTight-Medium] text-base mb-0.5`} numberOfLines={1}>
                                                                {video.name}
                                                            </Text>
                                                            <Text style={tw`text-gray-500 font-[InterTight] text-sm`}>
                                                                {video.duration} min • Watch on YouTube
                                                            </Text>
                                                        </View>
                                                        <ExternalLink color="#ffffff40" size={16} />
                                                    </TouchableOpacity>
                                                </GlassCard>
                                            ))}
                                        </View>
                                    )}

                                    {(mockResources?.pdfs?.length || 0) > 0 && (
                                        <View style={tw`mb-6`}>
                                            <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-3 uppercase tracking-wider`}>PDF Guides</Text>
                                            {mockResources?.pdfs.slice(0, 1).map((pdf) => (
                                                <GlassCard key={pdf.id} style={tw`bg-white/5 border border-white/10 p-4 mb-3`} noPadding>
                                                    <TouchableOpacity style={tw`flex-row items-center`}>
                                                        <View style={tw`w-10 h-10 rounded-full bg-amber-500/10 items-center justify-center mr-4`}>
                                                            <FileText color="#f59e0b" size={20} />
                                                        </View>
                                                        <View style={tw`flex-1`}>
                                                            <Text style={tw`text-white font-[InterTight-Medium] text-base mb-0.5`} numberOfLines={1}>
                                                                {pdf.name}
                                                            </Text>
                                                            <Text style={tw`text-gray-500 font-[InterTight] text-sm`}>
                                                                {pdf.fileSize} • Download Guide
                                                            </Text>
                                                        </View>
                                                        <Download color="#ffffff40" size={16} />
                                                    </TouchableOpacity>
                                                </GlassCard>
                                            ))}
                                        </View>
                                    )}

                                    {(mockResources?.articles?.length || 0) > 0 && (
                                        <View style={tw`mb-6`}>
                                            <Text style={tw`text-gray-400 font-[InterTight-Medium] text-sm mb-3 uppercase tracking-wider`}>Articles & Tools</Text>
                                            {mockResources?.articles.slice(0, 2).map((article) => (
                                                <GlassCard key={article.id} style={tw`bg-white/5 border border-white/10 p-4 mb-3`} noPadding>
                                                    <TouchableOpacity style={tw`flex-row items-center`}>
                                                        <View style={tw`w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center mr-4`}>
                                                            <ExternalLink color="#3b82f6" size={20} />
                                                        </View>
                                                        <View style={tw`flex-1`}>
                                                            <Text style={tw`text-white font-[InterTight-Medium] text-base mb-0.5`} numberOfLines={1}>
                                                                {article.name}
                                                            </Text>
                                                            <Text style={tw`text-gray-500 font-[InterTight] text-sm`}>
                                                                Read Best Practices
                                                            </Text>
                                                        </View>
                                                        <ExternalLink color="#ffffff40" size={16} />
                                                    </TouchableOpacity>
                                                </GlassCard>
                                            ))}
                                        </View>
                                    )}

                                    {/* More Fallback mockResources here ... */}
                                </>
                            )}

                        </ScrollView>
                    </Animated.View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}
