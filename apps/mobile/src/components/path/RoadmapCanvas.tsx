import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import tw from '@/lib/tailwind';

interface RoadmapCanvasProps {
    data: {
        nodes: any[];
        edges: any[];
    };
    onNodePress: (node: any) => void;
}

export function RoadmapCanvas({ data, onNodePress }: RoadmapCanvasProps) {
    if (!data.nodes || data.nodes.length === 0) {
        return (
            <View style={tw`h-[380px] items-center justify-center bg-black/10 rounded-2xl border border-white/10`}>
                <Text style={tw`text-white/50 font-[InterTight]`}>Roadmap visualization loading...</Text>
            </View>
        );
    }

    const { SCREEN_WIDTH } = useMemo(() => ({ SCREEN_WIDTH: Dimensions.get('window').width }), []);

    // Calculate bounds first to dictate initial zoom and pan states
    const bounds = useMemo(() => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasPositions = false;
        data.nodes.forEach(node => {
            if (node?.position && typeof node.position.x !== 'undefined') {
                const px = Number(node.position.x);
                const py = Number(node.position.y);
                const nw = Number(node.width) || 150;
                const nh = Number(node.height) || 45;
                
                if (!isNaN(px) && !isNaN(py)) {
                    hasPositions = true;
                    if (px < minX) minX = px;
                    if (py < minY) minY = py;
                    if (px + nw > maxX) maxX = px + nw;
                    if (py + nh > maxY) maxY = py + nh;
                }
            }
        });
        if (!hasPositions) {
            minX = 0; minY = 0; maxX = 1000; maxY = 1000;
        }

        const safeW = (maxX - minX) + 80;
        const safeH = (maxY - minY) + 80;

        return { 
            minX, minY, maxX, maxY, 
            width: isNaN(safeW) || safeW <= 0 ? 1000 : safeW,
            height: isNaN(safeH) || safeH <= 0 ? 1000 : safeH,
            offsetX: minX - 40,
            offsetY: minY - 40
        };
    }, [data]);

    const SVG_WIDTH = bounds.width;
    const SVG_HEIGHT = bounds.height;
    
    // Exact dimensions of the container view
    const CONTAINER_WIDTH = SCREEN_WIDTH - 48; // screen minus px-6 padding
    const CONTAINER_HEIGHT = 380; // matching h-[380px]
    
    // Fit to exact screen width AND exact screen height to see ENTIRE map
    const initialScale = Math.min((CONTAINER_WIDTH) / SVG_WIDTH, (CONTAINER_HEIGHT) / SVG_HEIGHT, 1);
    const MIN_SCALE = initialScale;
    
    // Helper to calculate bound clamps and offsets
    const getBounds = (tx: number, ty: number, s: number) => {
        'worklet';
        const maxTx = -((CONTAINER_WIDTH / 2) * (1 - s));
        const minTx = CONTAINER_WIDTH - ((CONTAINER_WIDTH / 2) * (1 - s) + SVG_WIDTH * s);
        let clampedX = tx;
        if (minTx > maxTx) clampedX = (minTx + maxTx) / 2;
        else clampedX = Math.max(minTx, Math.min(tx, maxTx));

        const maxTy = -((CONTAINER_HEIGHT / 2) * (1 - s));
        const minTy = CONTAINER_HEIGHT - ((CONTAINER_HEIGHT / 2) * (1 - s) + SVG_HEIGHT * s);
        let clampedY = ty;
        if (minTy > maxTy) clampedY = (minTy + maxTy) / 2;
        else clampedY = Math.max(minTy, Math.min(ty, maxTy));

        return { x: clampedX, y: clampedY };
    };

    const initialPos = getBounds(0, 0, initialScale);
    const initialTranslateX = initialPos.x;
    const initialTranslateY = initialPos.y;

    const scale = useSharedValue(initialScale);
    const savedScale = useSharedValue(initialScale);
    const translateX = useSharedValue(initialTranslateX);
    const translateY = useSharedValue(initialTranslateY);
    const savedTranslateX = useSharedValue(initialTranslateX);
    const savedTranslateY = useSharedValue(initialTranslateY);

    // If data changes (user opens a different path), reset zoom
    useEffect(() => {
        scale.value = initialScale;
        savedScale.value = initialScale;
        translateY.value = initialTranslateY;
        savedTranslateY.value = initialTranslateY;
        translateX.value = initialTranslateX;
        savedTranslateX.value = initialTranslateX;
    }, [data, initialScale, initialTranslateY, initialTranslateX]);

    const clampBounds = (tx: number, ty: number, s: number) => {
        'worklet';
        const maxTx = -((CONTAINER_WIDTH / 2) * (1 - s));
        const minTx = CONTAINER_WIDTH - ((CONTAINER_WIDTH / 2) * (1 - s) + SVG_WIDTH * s);
        let clampedX = tx;
        if (minTx > maxTx) clampedX = (minTx + maxTx) / 2;
        else clampedX = Math.max(minTx, Math.min(tx, maxTx));

        const maxTy = -((CONTAINER_HEIGHT / 2) * (1 - s));
        const minTy = CONTAINER_HEIGHT - ((CONTAINER_HEIGHT / 2) * (1 - s) + SVG_HEIGHT * s);
        let clampedY = ty;
        if (minTy > maxTy) clampedY = (minTy + maxTy) / 2;
        else clampedY = Math.max(minTy, Math.min(ty, maxTy));

        return { x: clampedX, y: clampedY };
    };

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            const nextScale = Math.max(MIN_SCALE, Math.min(savedScale.value * e.scale, 2.5));
            scale.value = nextScale;
            const clamped = clampBounds(translateX.value, translateY.value, nextScale);
            translateX.value = clamped.x;
            translateY.value = clamped.y;
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            const nextX = savedTranslateX.value + e.translationX;
            const nextY = savedTranslateY.value + e.translationY;
            const clamped = clampBounds(nextX, nextY, scale.value);
            translateX.value = clamped.x;
            translateY.value = clamped.y;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const composed = Gesture.Simultaneous(pinchGesture, panGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <View style={tw`h-[380px] w-full bg-black/5 rounded-2xl overflow-hidden border border-white/20 mt-4`}>
            <GestureDetector gesture={composed}>
                <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
                    <Svg width={SVG_WIDTH} height={SVG_HEIGHT} style={StyleSheet.absoluteFill}>
                        {data.edges?.map((edge: any, index: number) => {
                            if (!edge) return null;
                            const sourceNode = data.nodes.find(n => n.id === edge.source);
                            const targetNode = data.nodes.find(n => n.id === edge.target);
                            if (!sourceNode || !targetNode || !sourceNode.position || !targetNode.position) return null;
                            
                            const spx = Number(sourceNode.position.x) || 0;
                            const spy = Number(sourceNode.position.y) || 0;
                            const tpx = Number(targetNode.position.x) || 0;
                            const tpy = Number(targetNode.position.y) || 0;

                            const sW = Number(sourceNode.width) || 150;
                            const sH = Number(sourceNode.height) || 45;
                            const tW = Number(targetNode.width) || 150;
                            const tH = Number(targetNode.height) || 45;

                            const sx = spx - bounds.offsetX + sW / 2;
                            const sy = spy - bounds.offsetY + sH / 2;
                            const tx = tpx - bounds.offsetX + tW / 2;
                            const ty = tpy - bounds.offsetY + tH / 2;
                            
                            if (isNaN(sx) || isNaN(sy) || isNaN(tx) || isNaN(ty)) return null;

                            return (
                                <Path
                                    key={edge.id || `edge-${index}`}
                                    d={`M ${sx} ${sy} L ${tx} ${ty}`}
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth={2}
                                    fill="none"
                                />
                            );
                        })}
                    </Svg>

                    {data.nodes.map((node: any, index: number) => {
                        if (!node || !node.position) return null;
                        
                        const isSection = node.type === 'section';
                        const w = Number(node.width) || 150;
                        const h = Number(node.height) || 45;
                        const px = Number(node.position.x) || 0;
                        const py = Number(node.position.y) || 0;

                        const x = px - bounds.offsetX;
                        const y = py - bounds.offsetY;
                        
                        if (isNaN(x) || isNaN(y)) return null;
                        
                        return (
                            <GestureDetector key={node.id || `node-${index}`} gesture={Gesture.Tap().onEnd(() => {
                                'worklet';
                                // Need JS execution for callback
                            })}>
                                <View
                                    key={node.id}
                                    style={[
                                        tw`absolute justify-center items-center`,
                                        isSection ? tw`bg-transparent border border-dashed border-white/30 rounded-xl` : tw`bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20`,
                                        {
                                            left: x,
                                            top: y,
                                            width: w,
                                            height: h,
                                        }
                                    ]}
                                    onTouchEnd={() => {
                                        if (!isSection && node.data?.label) {
                                            onNodePress(node);
                                        }
                                    }}
                                >
                                    <Text style={tw`${isSection ? 'text-white/40' : 'text-white font-[InterTight-Medium]'} text-[12px] text-center px-1`} adjustsFontSizeToFit numberOfLines={2}>
                                        {node.data?.label || ''}
                                    </Text>
                                </View>
                            </GestureDetector>
                        );
                    })}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}
