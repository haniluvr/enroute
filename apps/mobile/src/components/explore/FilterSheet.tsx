import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Animated, PanResponder, Dimensions, TextInput } from 'react-native';
import { X, MapPin, Briefcase, GraduationCap, RotateCcw, Check, Search } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { COMMON_PH_LOCATIONS } from '@/data/locations';

export type EmploymentType = 'FULLTIME' | 'CONTRACTOR' | 'PARTTIME' | 'INTERN';
export type JobRequirement = 'under_3_years_experience' | 'more_than_3_years_experience' | 'no_experience' | 'no_degree';

export interface Filters {
    location: string;
    employmentTypes: EmploymentType[];
    requirements: JobRequirement[];
}

interface FilterSheetProps {
    isVisible: boolean;
    onClose: () => void;
    currentFilters: Filters;
    onApply: (filters: Filters) => void;
}

const EMPLOYMENT_TYPES: { label: string; value: EmploymentType }[] = [
    { label: 'Full-time', value: 'FULLTIME' },
    { label: 'Contractor', value: 'CONTRACTOR' },
    { label: 'Part-time', value: 'PARTTIME' },
    { label: 'Internship', value: 'INTERN' },
];

const JOB_REQUIREMENTS: { label: string; value: JobRequirement }[] = [
    { label: 'No Experience', value: 'no_experience' },
    { label: 'Under 3 Years', value: 'under_3_years_experience' },
    { label: '3+ Years Exp', value: 'more_than_3_years_experience' },
    { label: 'No Degree', value: 'no_degree' },
];

export function FilterSheet({ isVisible, onClose, currentFilters, onApply }: FilterSheetProps) {
    const windowHeight = Dimensions.get('window').height;
    const [localFilters, setLocalFilters] = useState<Filters>(currentFilters);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    // Filter suggestions based on input
    const handleLocationChange = (text: string) => {
        setLocalFilters(prev => ({ ...prev, location: text }));
        if (text.length > 1) {
            const filtered = COMMON_PH_LOCATIONS.filter(loc => 
                loc.toLowerCase().includes(text.toLowerCase()) && loc !== text
            ).slice(0, 5);
            setSuggestions(filtered);
            setIsTyping(true);
        } else {
            setSuggestions([]);
            setIsTyping(false);
        }
    };

    const selectSuggestion = (loc: string) => {
        setLocalFilters(prev => ({ ...prev, location: loc }));
        setSuggestions([]);
        setIsTyping(false);
    };

    // Sheet Animations
    const sheetTranslateY = useRef(new Animated.Value(windowHeight)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
            setLocalFilters(currentFilters);
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1, // Keep it 1 but style is transparent
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(sheetTranslateY, {
                    toValue: 0,
                    tension: 50,
                    friction: 12,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isVisible]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(sheetTranslateY, {
                toValue: windowHeight,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    const panY = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) panY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    handleClose();
                } else {
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

    const toggleEmploymentType = (type: EmploymentType) => {
        setLocalFilters(prev => ({
            ...prev,
            employmentTypes: prev.employmentTypes.includes(type)
                ? prev.employmentTypes.filter(t => t !== type)
                : [...prev.employmentTypes, type]
        }));
    };

    const toggleRequirement = (req: JobRequirement) => {
        setLocalFilters(prev => ({
            ...prev,
            requirements: prev.requirements.includes(req)
                ? prev.requirements.filter(r => r !== req)
                : [...prev.requirements, req]
        }));
    };

    const clearFilters = () => {
        const reset: Filters = { location: '', employmentTypes: [], requirements: [] };
        setLocalFilters(reset);
    };

    const handleApply = () => {
        onApply(localFilters);
        handleClose();
    };

    return (
        <Modal visible={isVisible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={tw`flex-1 justify-end`}>
                {/* Transparent Backdrop but detects clicks */}
                <Animated.View style={[tw`absolute inset-0 bg-transparent`, { opacity: backdropOpacity }]}>
                    <TouchableOpacity style={tw`flex-1`} activeOpacity={1} onPress={handleClose} />
                </Animated.View>

                <Animated.View 
                    style={[
                        tw`bg-[#1C1C1E] rounded-t-[40px] border-t border-white/10 overflow-hidden pb-10`, 
                        { 
                            maxHeight: '90%', 
                            transform: [{ translateY: sheetTranslateY }, { translateY: panY }] 
                        }
                    ]}
                >
                    {/* Drag Handle */}
                    <View {...panResponder.panHandlers} style={tw`items-center py-4`}>
                        <View style={tw`w-12 h-1 bg-white/20 rounded-full`} />
                    </View>

                    {/* Header */}
                    <View style={tw`flex-row justify-between items-center px-8 mb-6`}>
                        <Text style={tw`text-white text-2xl font-[InterTight] font-bold`}>Filters</Text>
                        <TouchableOpacity onPress={clearFilters} style={tw`flex-row items-center`}>
                            <RotateCcw size={16} color="#94a3b8" />
                            <Text style={tw`text-slate-400 text-sm font-inter-medium ml-1.5`}>Clear All</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-8 pb-6`}>
                        {/* Location */}
                        <View style={tw`mb-8`}>
                            <View style={tw`flex-row items-center mb-4`}>
                                <MapPin size={18} color="#22d3ee" />
                                <Text style={tw`text-white text-lg font-inter-bold ml-2`}>Location</Text>
                            </View>
                            <View style={tw`bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-4`}>
                                <TextInput
                                    style={tw`flex-1 py-4 text-white font-inter`}
                                    placeholder="Enter city or region"
                                    placeholderTextColor="#64748b"
                                    value={localFilters.location}
                                    onChangeText={handleLocationChange}
                                    onBlur={() => setTimeout(() => setIsTyping(false), 200)}
                                />
                                {localFilters.location.length > 0 && (
                                    <TouchableOpacity onPress={() => handleLocationChange('')}>
                                        <X size={16} color="#64748b" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Autocomplete Suggestions */}
                            {suggestions.length > 0 && (
                                <View style={tw`mt-2 bg-[#2C2C2E] rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50`}>
                                    {suggestions.map((loc, idx) => (
                                        <TouchableOpacity 
                                            key={idx}
                                            onPress={() => selectSuggestion(loc)}
                                            style={tw`flex-row items-center px-4 py-3.5 ${idx !== suggestions.length - 1 ? 'border-b border-white/5' : ''}`}
                                        >
                                            <Search size={14} color="#64748b" style={tw`mr-3`} />
                                            <Text style={tw`text-white text-sm font-inter`}>{loc}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Employment Type */}
                        <View style={tw`mb-8`}>
                            <View style={tw`flex-row items-center mb-4`}>
                                <Briefcase size={18} color="#a78bfa" />
                                <Text style={tw`text-white text-lg font-inter-bold ml-2`}>Employment Type</Text>
                            </View>
                            <View style={tw`flex-row flex-wrap`}>
                                {EMPLOYMENT_TYPES.map((type) => {
                                    const isSelected = localFilters.employmentTypes.includes(type.value);
                                    return (
                                        <TouchableOpacity
                                            key={type.value}
                                            onPress={() => toggleEmploymentType(type.value)}
                                            style={[
                                                tw`px-4 py-2.5 rounded-full mr-2 mb-2 border`,
                                                isSelected ? tw`bg-violet-500/20 border-violet-500/50` : tw`bg-white/5 border-white/10`
                                            ]}
                                        >
                                            <View style={tw`flex-row items-center`}>
                                                <Text style={[tw`text-sm font-inter-medium`, isSelected ? tw`text-violet-400` : tw`text-slate-400`]}>
                                                    {type.label}
                                                </Text>
                                                {isSelected && <Check size={14} color="#a78bfa" style={tw`ml-1.5`} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Requirements */}
                        <View style={tw`mb-10`}>
                            <View style={tw`flex-row items-center mb-4`}>
                                <GraduationCap size={18} color="#34d399" />
                                <Text style={tw`text-white text-lg font-inter-bold ml-2`}>Requirements</Text>
                            </View>
                            <View style={tw`flex-row flex-wrap`}>
                                {JOB_REQUIREMENTS.map((req) => {
                                    const isSelected = localFilters.requirements.includes(req.value);
                                    return (
                                        <TouchableOpacity
                                            key={req.value}
                                            onPress={() => toggleRequirement(req.value)}
                                            style={[
                                                tw`px-4 py-2.5 rounded-full mr-2 mb-2 border`,
                                                isSelected ? tw`bg-emerald-500/20 border-emerald-500/50` : tw`bg-white/5 border-white/10`
                                            ]}
                                        >
                                            <View style={tw`flex-row items-center`}>
                                                <Text style={[tw`text-sm font-inter-medium`, isSelected ? tw`text-emerald-400` : tw`text-slate-400`]}>
                                                    {req.label}
                                                </Text>
                                                {isSelected && <Check size={14} color="#10b981" style={tw`ml-1.5`} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Apply Button */}
                        <TouchableOpacity 
                            onPress={handleApply}
                            style={tw`bg-white rounded-2xl py-5 items-center justify-center shadow-lg shadow-white/10`}
                        >
                            <Text style={tw`text-black text-lg font-inter-bold`}>Apply Filters</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}
