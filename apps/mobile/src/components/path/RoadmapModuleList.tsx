import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, UIManager } from 'react-native';
import { ChevronDown, CheckCircle, PlayCircle } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withTiming, 
    interpolate,
} from 'react-native-reanimated';

const AnimatedGlassCard = Animated.createAnimatedComponent(GlassCard);

interface RoadmapModuleListProps {
    data: {
        nodes: any[];
        edges: any[];
    };
    onNodePress: (node: any) => void;
    completedNodes?: string[]; // IDs of completed nodes
}

interface Module {
    id: string;
    title: string;
    description?: string;
    topics: any[];
    isSection: boolean;
}

function ModuleItem({ 
    module, 
    index, 
    isExpanded, 
    onToggle, 
    completedNodes, 
    onNodePress 
}: { 
    module: Module; 
    index: number; 
    isExpanded: boolean; 
    onToggle: () => void;
    completedNodes: string[];
    onNodePress: (node: any) => void;
}) {
    const [measuredHeight, setMeasuredHeight] = useState(0);
    const progress = useSharedValue(isExpanded ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(isExpanded ? 1 : 0, { duration: 350 });
    }, [isExpanded]);

    const animatedBodyStyle = useAnimatedStyle(() => {
        return {
            height: interpolate(progress.value, [0, 1], [0, measuredHeight]),
            opacity: interpolate(progress.value, [0, 0.8, 1], [0, 0, 1]),
        };
    }, [measuredHeight]);

    const chevronStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }
            ]
        };
    });

    const headerStyle = useAnimatedStyle(() => {
        const radius = interpolate(progress.value, [0, 1], [24, 0]);
        const bgOpacity = interpolate(progress.value, [0, 1], [0.1, 0.15]);
        return {
            borderBottomLeftRadius: radius,
            borderBottomRightRadius: radius,
            backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
            borderBottomWidth: interpolate(progress.value, [0, 1], [1, 0]),
        };
    });

    const completedCount = module.topics.filter(t => completedNodes.includes(t.id)).length;
    const totalTopics = module.topics.length;
    const isFullyCompleted = completedCount === totalTopics && totalTopics > 0;

    return (
        <View style={tw`mb-4`}>
            {/* Module Header */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onToggle}
                style={tw`z-10`}
            >
                <AnimatedGlassCard
                    style={[
                        tw`p-4 border border-white/10 flex-row items-center justify-between`,
                        headerStyle
                    ]}
                    noPadding
                >
                    <View style={tw`flex-row items-center flex-1`}>
                        <View style={[
                            tw`w-10 h-10 rounded-xl items-center justify-center mr-4`,
                            isFullyCompleted ? tw`bg-green-500/20` : tw`bg-white/10`
                        ]}>
                            {isFullyCompleted ? (
                                <CheckCircle color="#22c55e" size={20} />
                            ) : (
                                <Text style={tw`text-white/60 font-bold text-lg`}>{index + 1}</Text>
                            )}
                        </View>
                        <View style={tw`flex-1 mr-2`}>
                            <Text style={tw`text-white font-[InterTight-SemiBold] text-lg`} numberOfLines={1}>
                                {module.title}
                            </Text>
                            <Text style={tw`text-gray-400 font-[InterTight] text-xs`}>
                                {totalTopics} steps {completedCount > 0 ? `• ${completedCount} done` : ''}
                            </Text>
                        </View>
                    </View>
                    <Animated.View style={chevronStyle}>
                        <ChevronDown color="#888" size={20} />
                    </Animated.View>
                </AnimatedGlassCard>
            </TouchableOpacity>

            {/* Module Body Wrapper (Accordion Container) */}
            <Animated.View 
                style={[
                    tw`bg-white/5 border-x border-b border-white/10 rounded-b-2xl overflow-hidden`,
                    animatedBodyStyle
                ]}
            >
                {/* Measuring Container */}
                <View 
                    style={tw`p-2 pt-0`}
                    onLayout={(event) => {
                        const height = event.nativeEvent.layout.height;
                        if (height > 0 && Math.abs(measuredHeight - height) > 1) {
                            setMeasuredHeight(height);
                        }
                    }}
                >
                    {module.topics.map((topic, tIdx) => {
                        const isDone = completedNodes.includes(topic.id);
                        return (
                            <TouchableOpacity
                                key={topic.id}
                                activeOpacity={0.7}
                                onPress={() => onNodePress(topic)}
                                style={tw`flex-row items-center p-3 mb-1 rounded-xl ${tIdx % 2 === 0 ? 'bg-white/5' : ''}`}
                            >
                                <View style={tw`relative items-center mr-4`}>
                                    <View style={[
                                        tw`w-6 h-6 rounded-full border-2 items-center justify-center z-10`,
                                        isDone ? tw`bg-white border-white` : tw`border-white/30`
                                    ]}>
                                        {isDone && <CheckCircle color="#000" size={12} />}
                                    </View>
                                    {tIdx < module.topics.length - 1 && (
                                        <View 
                                            style={[
                                                tw`absolute bg-white/20`, 
                                                { 
                                                    top: 24, 
                                                    height: 28, 
                                                    width: 2, 
                                                    left: '50%', 
                                                    marginLeft: -1,
                                                    zIndex: -1 
                                                }
                                            ]} 
                                        />
                                    )}
                                </View>
                                
                                <View style={tw`flex-1`}>
                                    <Text 
                                        style={[
                                            tw`text-base font-[InterTight-Medium]`,
                                            isDone ? tw`text-white/60 line-through` : tw`text-white`
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {topic.data?.label || topic.label}
                                    </Text>
                                </View>
                                
                                <PlayCircle color={isDone ? "#ffffff40" : "#ffffff80"} size={16} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Animated.View>
        </View>
    );
}

export function RoadmapModuleList({ data, onNodePress, completedNodes = [] }: RoadmapModuleListProps) {
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({ '0': true });

    const modules = useMemo(() => {
        if (!data.nodes || data.nodes.length === 0) return [];

        const sectionNodes = data.nodes.filter(n => n.type === 'section' || n.data?.type === 'section');
        const regularNodes = data.nodes.filter(n => n.type !== 'section' && n.data?.type !== 'section');

        if (sectionNodes.length > 0) {
            const groups: Module[] = sectionNodes.map((section, index) => {
                const sectionTopics = regularNodes.filter(node => {
                    if (node.parentId === section.id || node.data?.parentId === section.id) return true;
                    return (
                        (node.position?.x || 0) >= (section.position?.x || 0) && 
                        (node.position?.x || 0) <= (section.position?.x || 0) + (section.width || 0) && 
                        (node.position?.y || 0) >= (section.position?.y || 0) && 
                        (node.position?.y || 0) <= (section.position?.y || 0) + (section.height || 0)
                    );
                });

                const moduleTitle = section.data?.label || section.data?.text || section.label || section.text;
                const topics = sectionTopics.sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));
                
                let fallbackTitle = `Module ${index + 1}`;
                if (topics.length > 0) {
                    const firstTopic = topics[0];
                    fallbackTitle = firstTopic.data?.label || firstTopic.label || firstTopic.data?.text || firstTopic.text || fallbackTitle;
                }

                return {
                    id: section.id,
                    title: moduleTitle || fallbackTitle,
                    description: section.data?.description,
                    topics: topics,
                    isSection: true
                };
            }).filter(m => m.topics.length > 0);

            return groups.sort((a, b) => {
                const nodeA = sectionNodes.find(n => n.id === a.id);
                const nodeB = sectionNodes.find(n => n.id === b.id);
                return (nodeA?.position?.y || 0) - (nodeB?.position?.y || 0);
            });
        }

        const sortedNodes = [...regularNodes].sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));
        const grouped: Module[] = [];
        let currentModule: Module | null = null;
        let lastY = -Infinity;

        sortedNodes.forEach((node) => {
            const y = node.position?.y || 0;
            if (!currentModule || (y - lastY > 250)) {
                currentModule = {
                    id: `mod-${grouped.length}`,
                    title: `Phase ${grouped.length + 1}`,
                    topics: [],
                    isSection: false
                };
                grouped.push(currentModule);
            }
            currentModule.topics.push(node);
            lastY = y;
        });

        return grouped;
    }, [data]);

    const toggleModule = (id: string) => {
        setExpandedModules(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (modules.length === 0) {
        return (
            <View style={tw`p-8 items-center bg-white/5 rounded-2xl border border-white/10`}>
                <Text style={tw`text-white/40 font-[InterTight]`}>No structured roadmap modules found.</Text>
            </View>
        );
    }

    return (
        <View style={tw`mt-4 px-1`}>
            {modules.map((module, index) => (
                <ModuleItem 
                    key={module.id}
                    module={module}
                    index={index}
                    isExpanded={!!expandedModules[module.id]}
                    onToggle={() => toggleModule(module.id)}
                    completedNodes={completedNodes}
                    onNodePress={onNodePress}
                />
            ))}
        </View>
    );
}
