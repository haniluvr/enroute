import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import tw from '@/lib/tailwind';
import { GlassCard } from '@/components/GlassCard';
import { MapPin, Briefcase } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

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
    return (
        <GlassCard noPadding style={tw`w-full bg-[#181818]/98 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden`}>
            <View style={tw`p-8`}>
                {/* Header: Company & Match */}
                <View style={tw`flex-row justify-between items-start mb-7`}>
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
                        <View style={tw`ml-4`}>
                            <Text style={tw`text-white text-xl font-inter-bold`}>{data.company}</Text>
                            <View style={tw`flex-row items-center mt-1`}>
                                <MapPin size={12} color="#94a3b8" style={tw`mr-1`} />
                                <Text style={tw`text-slate-400 text-sm font-inter-medium`}>{data.location}</Text>
                            </View>
                        </View>
                    </View>
                    <MatchIndicator percentage={data.matchPercentage} />
                </View>

                {/* Divider */}
                <View style={tw`h-[1px] bg-white/10 w-full mb-7`} />

                {/* Role Section */}
                <View style={tw`mb-2`}>
                    <View style={tw`flex-row items-center mb-3`}>
                        <Briefcase size={16} color="#94a3b8" style={tw`mr-2`} />
                        <Text style={tw`text-slate-400 text-sm font-[InterTight] font-bold uppercase tracking-wider`}>Role</Text>
                    </View>
                    <Text style={tw`text-white text-3xl font-[InterTight] font-bold mb-4 leading-tight`}>{data.role}</Text>
                    <Text style={tw`text-slate-300 text-base font-[InterTight] leading-relaxed`} numberOfLines={4}>
                        {data.description}
                    </Text>
                </View>

                {/* Required Skills */}
                <View style={tw`mt-4`}>
                    <Text style={tw`text-slate-400 text-sm font-[InterTight] font-bold uppercase tracking-wider mb-1`}>Required Skills</Text>
                    <View style={tw`flex-row flex-wrap`}>
                        {data.skills.map((skill, index) => (
                            <View key={index} style={tw`bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mr-2 mt-2`}>
                                <Text style={tw`text-slate-200 text-xs font-[InterTight] font-medium`}>{skill}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Divider */}
                <View style={tw`h-[1px] bg-white/10 w-full mt-7 mb-5`} />

                {/* Footer: Salary */}
                <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-slate-400 text-sm font-[InterTight] font-bold uppercase tracking-wider`}>Salary</Text>
                    <Text style={tw`text-cyan-400 text-lg font-[InterTight] font-bold`}>{data.salary}</Text>
                </View>
            </View>
        </GlassCard>
    );
}
