import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { X, CheckCircle, Video, FileText } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';

interface NodeDetailsSheetProps {
    visible: boolean;
    node: any;
    onClose: () => void;
}

const { height } = Dimensions.get('window');

export function NodeDetailsSheet({ visible, node, onClose }: NodeDetailsSheetProps) {
    const translateY = useSharedValue(height);
    const [isVisible, setIsVisible] = useState(visible);
    const [localNode, setLocalNode] = useState(node);

    useEffect(() => {
        if (node) {
            setLocalNode(node);
        }
    }, [node]);

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
        onClose(); // Parent sets visible=false, triggering the effect above
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    // Still need to conditionally render null for initial unmounted state
    if (!localNode && !isVisible) return null;

    const activeNode = localNode || node; // Fallback mapping
    const title = activeNode?.data?.label || 'Node Details';
    const description = activeNode?.data?.description || `Explore detailed resources, best practices, and practical examples for understanding ${title}.`;

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
                <TouchableOpacity activeOpacity={1}>
                    <Animated.View style={[
                        tw`bg-[#161616] w-full border-t border-white/20 rounded-t-3xl pt-2 pb-10 px-6`,
                        { maxHeight: height * 0.8 },
                        animatedStyle
                    ]}>
                        {/* Drag indicator */}
                        <View style={tw`items-center mb-4`}>
                            <View style={tw`w-12 h-1.5 bg-white/20 rounded-full`} />
                        </View>

                        <View style={tw`flex-row justify-between items-start mb-6`}>
                            <View style={tw`flex-1 pr-4`}>
                                <Text style={tw`text-white font-[InterTight-Bold] text-2xl mb-2`}>
                                    {title}
                                </Text>
                                <Text style={tw`text-gray-400 font-[InterTight] text-base leading-6`}>
                                    {description}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                onPress={handleClose}
                                style={tw`w-8 h-8 rounded-full bg-white/10 items-center justify-center`}
                            >
                                <X color="#FFF" size={18} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-10`}>
                            <TouchableOpacity 
                                style={tw`w-full bg-white rounded-2xl py-4 flex-row justify-center items-center mb-6 shadow-md`}
                                onPress={() => {}}
                            >
                                <CheckCircle color="#000" size={20} style={tw`mr-2`} />
                                <Text style={tw`text-black font-[InterTight-SemiBold] text-lg`}>
                                    Mark as Done
                                </Text>
                            </TouchableOpacity>

                            <Text style={tw`text-white font-[InterTight-SemiBold] text-lg mb-4`}>
                                Free Resources
                            </Text>

                            <GlassCard style={tw`bg-white/5 border border-white/10 p-4 mb-3`} noPadding>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <Video color="#fcfcfc80" size={18} style={tw`mr-2`} />
                                    <Text style={tw`text-gray-300 font-[InterTight-Medium] text-base`} numberOfLines={1}>
                                        {title} Crash Course (YouTube)
                                    </Text>
                                </View>
                                <Text style={tw`text-gray-500 font-[InterTight] text-sm`}>
                                    Watch a curated 30-minute overview.
                                </Text>
                            </GlassCard>

                            <GlassCard style={tw`bg-white/5 border border-white/10 p-4 mb-3`} noPadding>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <FileText color="#fcfcfc80" size={18} style={tw`mr-2`} />
                                    <Text style={tw`text-gray-300 font-[InterTight-Medium] text-base`} numberOfLines={1}>
                                        Official Documentation
                                    </Text>
                                </View>
                                <Text style={tw`text-gray-500 font-[InterTight] text-sm`}>
                                    In-depth written guides and best practices.
                                </Text>
                            </GlassCard>

                        </ScrollView>
                    </Animated.View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}
