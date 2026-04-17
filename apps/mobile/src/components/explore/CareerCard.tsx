import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Modal, TouchableOpacity, ScrollView, SafeAreaView, Animated, PanResponder, Dimensions } from 'react-native';
import { X, MapPin, Briefcase, Clock, GraduationCap, ListChecks, Shield } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '@/config/supabase';


export interface CareerCardData {
    id: string;
    company: string;
    location: string;
    role: string;
    description: string;
    matchPercentage: number;
    skills: string[];
    salary: string;
    color?: string;
    company_logo?: string;
    full_details?: {
        employment_type?: string;
        experience?: string;
        qualifications?: string[];
        responsibilities?: string[];
        benefits?: string[];
    };
}

interface CareerCardProps {
    data: CareerCardData;
}

const MatchIndicator = ({ percentage }: { percentage: number }) => {
    const radius = 30;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <View style={tw`items-center justify-center`}>
            <View style={tw`relative items-center justify-center`}>
                <Svg height={radius * 2} width={radius * 2} style={tw`rotate-[-90deg]`}>
                    <Circle
                        stroke="rgba(255, 255, 255, 0.1)"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <Circle
                        stroke="#22d3ee"
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </Svg>
                <View style={tw`absolute items-center justify-center`}>
                    <Text style={tw`text-white font-inter-bold text-base`}>{percentage}%</Text>
                </View>
            </View>
            <Text style={tw`text-white/40 text-[10px] font-inter-bold uppercase tracking-widest mt-1`}>Match</Text>
        </View>
    );
};

export function CareerCard({ data }: CareerCardProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const windowHeight = Dimensions.get('window').height;


    // Manual Sheet & Backdrop Animations
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const sheetTranslateY = useRef(new Animated.Value(windowHeight)).current;

    // Trigger animations when modalVisible changes
    useEffect(() => {
        if (modalVisible) {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(sheetTranslateY, {
                    toValue: 0,
                    tension: 40,
                    friction: 10,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // No hide animation needed for closing inside Modal (it hides instantly), 
            // but we reset for the next open.
            sheetTranslateY.setValue(windowHeight);
            backdropOpacity.setValue(0);
        }
    }, [modalVisible]);

    // Reset pan position and handle close animation
    const closeModal = () => {
        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(sheetTranslateY, {
                toValue: windowHeight,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setModalVisible(false);
        });
    };

    // PanResponder for Draggable Bottom Sheet
    const panY = useRef(new Animated.Value(0)).current;
    
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    // Close if dragged down far enough or fast enough
                    closeModal();
                } else {
                    // Reset position
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 10
                    }).start();
                }
            },
        })
    ).current;

    // Reset pan position when modal closes
    useEffect(() => {
        if (!modalVisible) {
            panY.setValue(0);
        }
    }, [modalVisible]);

    const renderModalSection = (title: string, icon: React.ReactNode, items: string[] | undefined) => {
        if (!items || items.length === 0) return null;
        return (
            <View style={tw`mb-6`}>
                <View style={tw`flex-row items-center mb-3`}>
                    {icon}
                    <Text style={tw`text-white text-lg font-inter-bold ml-2`}>{title}</Text>
                </View>
                {items.map((item, idx) => (
                    <View key={idx} style={tw`flex-row mb-2 pr-4`}>
                        <Text style={tw`text-cyan-400 mr-2`}>•</Text>
                        <Text style={tw`text-slate-300 text-sm leading-relaxed`}>{item}</Text>
                    </View>
                ))}
            </View>
        );
    };

    // Debug: Check if skills are present
    console.log(`[CareerCard] Skills for ${data.role}:`, data.skills);

    return (
        <GlassCard noPadding style={tw`w-full bg-[#181818]/98 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden p-1`}>
            <View style={tw`p-5`}>
                {/* Header: Company & Match */}
                <View style={tw`flex-row justify-between items-start mb-4`}>
                    <View style={tw`flex-row items-center flex-1 mr-4`}>
                        <View style={[tw`w-14 h-14 rounded-2xl bg-[#a78bfa20] items-center justify-center border border-violet-500/20 overflow-hidden`, { backgroundColor: data.color ? `${data.color}20` : '#a78bfa20' }]}>
                            {data.company_logo ? (
                                <Image 
                                    source={{ uri: data.company_logo }} 
                                    style={tw`w-full h-full`}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text style={[tw`text-violet-400 text-2xl font-inter-bold`, { color: data.color || '#a78bfa' }]}>{data.company.charAt(0)}</Text>
                            )}
                        </View>
                        <View style={tw`ml-4 flex-1`}>
                            <Text 
                                style={tw`text-white text-xl font-inter-bold`} 
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.7}
                            >
                                {data.company}
                            </Text>
                            <View style={tw`flex-row items-center mt-1`}>
                                <MapPin size={12} color="#94a3b8" style={tw`mr-1`} />
                                <Text style={tw`text-slate-400 text-sm font-inter-medium`}>{data.location}</Text>
                            </View>
                        </View>
                    </View>
                    <MatchIndicator percentage={data.matchPercentage} />
                </View>

                {/* Divider */}
                <View style={tw`h-[1px] bg-white/10 w-full mb-4`} />

                {/* Role Section */}
                <View style={tw`mb-2`}>
                    <View style={tw`flex-row items-center mb-3`}>
                        <Briefcase size={16} color="#94a3b8" style={tw`mr-2`} />
                        <Text style={tw`text-slate-400 text-sm font-[InterTight] font-bold uppercase tracking-wider`}>Role</Text>
                    </View>
                    <Text 
                        style={tw`text-white text-2xl font-[InterTight] font-bold mb-3 leading-tight`} 
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                    >
                        {data.role}
                    </Text>
                    <View style={tw`mb-2`}>
                        <Text style={tw`text-slate-300 text-base font-[InterTight] leading-relaxed`} numberOfLines={4}>
                            {data.description}
                        </Text>
                        <TouchableOpacity 
                            onPress={() => setModalVisible(true)}
                            style={tw`mt-1`}
                        >
                            <Text style={tw`text-cyan-400 text-xs font-inter-bold`}>See more...</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Required Skills */}
                    <View style={tw`mt-2`}>
                        <Text style={tw`text-slate-400 text-sm font-[InterTight] font-bold uppercase tracking-wider mb-1`}>Required Skills</Text>
                        <View style={tw`flex-row flex-wrap`}>
                            {data.skills && data.skills.slice(0, 4).map((skill, index) => (
                                <View key={index} style={tw`bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mr-2 mt-2`}>
                                    <Text style={tw`text-slate-200 text-xs font-[InterTight] font-medium`}>{skill}</Text>
                                </View>
                            ))}
                            {data.skills && data.skills.length > 4 && (
                                <View style={tw`bg-white/10 border border-white/20 px-3 py-1.5 rounded-full mt-2`}>
                                    <Text style={tw`text-white text-xs font-[InterTight-Bold]`}>+{data.skills.length - 4}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Divider */}
                <View style={tw`h-[1px] bg-white/10 w-full mt-4 mb-4`} />

                {/* Footer: Salary */}
                <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-slate-400 text-sm font-[InterTight] font-bold uppercase tracking-wider`}>Salary</Text>
                    <Text style={tw`text-cyan-400 text-lg font-[InterTight] font-bold`}>{data.salary}</Text>
                </View>
            </View>

            {/* Detailed Job Sheet (Dahlia Notes Style) */}
            <Modal 
                visible={modalVisible} 
                transparent 
                animationType="none"
                onRequestClose={closeModal}
            >
                <View style={tw`flex-1 justify-end`}>
                    {/* Backdrop (Fades In) */}
                    <Animated.View 
                        style={[
                            tw`absolute inset-0 bg-black/40`,
                            { opacity: backdropOpacity }
                        ]}
                    >
                        <TouchableOpacity 
                            style={tw`flex-1`} 
                            activeOpacity={1}
                            onPress={closeModal} 
                        />
                    </Animated.View>
                    
                    <Animated.View 
                        style={[
                            tw`bg-[#1C1C1E]/98 rounded-t-[40px] border-t border-white/10 overflow-hidden`, 
                            { 
                                height: '88%',
                                transform: [
                                    { translateY: sheetTranslateY },
                                    { translateY: panY }
                                ]
                            }
                        ]}
                    >
                        {/* Drag Handle Area (Captures gestures) */}
                        <View 
                            {...panResponder.panHandlers}
                            style={tw`items-center py-4`}
                        >
                            <View style={tw`w-12 h-1 bg-white/20 rounded-full`} />
                        </View>

                        {/* Top Navigation */}
                        <View style={tw`flex-row justify-between items-center px-8 mb-6`}>
                            <View style={tw`flex-1 mr-4`}>
                                <Text style={tw`text-white text-xl font-inter-bold`} numberOfLines={1}>
                                    {data.role}
                                </Text>
                                <Text style={tw`text-slate-400 text-sm font-inter`}>{data.company}</Text>
                            </View>
                        </View>

                        <ScrollView 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={tw`px-8 pb-20`}
                        >
                            {/* Summary Metadata */}
                            <View style={tw`flex-row flex-wrap mb-8`}>
                                {data.salary && (
                                    <View style={tw`bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-full mr-2 mb-2`}>
                                        <Text style={tw`text-cyan-400 text-sm font-inter-bold`}>{data.salary}</Text>
                                    </View>
                                )}
                                <View style={tw`bg-white/5 border border-white/10 px-4 py-2 rounded-full mr-2 mb-2`}>
                                    <Text style={tw`text-slate-300 text-sm font-inter`}>{data.full_details?.employment_type || 'Full-time'}</Text>
                                </View>
                                <View style={tw`bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-2`}>
                                    <Text style={tw`text-slate-300 text-sm font-inter`}>{data.full_details?.experience || 'Experience'}</Text>
                                </View>
                            </View>

                            {/* Core Skills (Dahlia Style Section) */}
                            {data.skills && data.skills.length > 0 && (
                                <View style={tw`mb-10`}>
                                    <View style={tw`flex-row items-center mb-4`}>
                                        <GraduationCap size={20} color="#a78bfa" />
                                        <Text style={tw`text-white text-lg font-inter-bold ml-2`}>Target Skills</Text>
                                    </View>
                                    <View style={tw`flex-row flex-wrap`}>
                                        {data.skills.map((skill, idx) => (
                                            <View key={idx} style={tw`bg-[#a78bfa]/10 border border-[#a78bfa]/20 px-4 py-2 rounded-full mr-2 mb-2`}>
                                                <Text style={tw`text-[#a78bfa] text-sm font-inter-medium`}>{skill}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Full Description */}
                            <View style={tw`mb-10`}>
                                <Text style={tw`text-slate-400 text-[10px] font-inter-bold uppercase tracking-widest mb-4`}>The Opportunity</Text>
                                <Text style={tw`text-slate-200 text-base leading-relaxed font-inter`}>
                                    {data.description}
                                </Text>
                            </View>

                            {/* Detailed Highlights */}
                            {renderModalSection("Qualifications", <GraduationCap size={20} color="#34d399" />, data.full_details?.qualifications)}
                            {renderModalSection("Responsibilities", <ListChecks size={20} color="#fbbf24" />, data.full_details?.responsibilities)}
                            {renderModalSection("Benefits", <Shield size={20} color="#f472b6" />, data.full_details?.benefits)}

                            {/* Apply Button */}
                            <TouchableOpacity 
                                style={[tw`bg-white rounded-2xl py-5 items-center justify-center mt-6 shadow-lg shadow-white/10`, isApplying && tw`opacity-50`]}
                                onPress={async () => {
                                    if (isApplying) return;
                                    setIsApplying(true);
                                    try {
                                        const { data: { user } } = await supabase.auth.getUser();
                                        if (!user) {
                                            alert('Please sign in to apply');
                                            return;
                                        }

                                        const { error } = await supabase
                                            .from('job_applications')
                                            .insert({
                                                user_id: user.id,
                                                job_id: data.id,
                                                status: 'applied'
                                            });

                                        if (error) {
                                            if (error.code === '23505') {
                                                alert('You have already applied for this role!');
                                            } else {
                                                throw error;
                                            }
                                        } else {
                                            alert('Application sent successfully!');
                                            closeModal();
                                        }
                                    } catch (err: any) {
                                        console.error('Error applying:', err);
                                        alert('Failed to send application. Please try again.');
                                    } finally {
                                        setIsApplying(false);
                                    }
                                }}
                                disabled={isApplying}
                            >
                                <Text style={tw`text-black text-lg font-inter-bold`}>
                                    {isApplying ? 'Applying...' : 'Quick Apply'}
                                </Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
        </GlassCard>
    );
}
