import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { ChevronLeft, Briefcase, MapPin, Send, CheckCircle2, MoreVertical, X, Sparkles } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { useRouter } from 'expo-router';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AI_API } from '@/config/backend';

export default function JobMatchesScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [matches, setMatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApplyingId, setIsApplyingId] = useState<string | null>(null);

    const fetchMatches = useCallback(async () => {
        if (!user || user.id === 'pending') return;
        setIsLoading(true);
        try {
            // Join job_swipes with jobs
            const { data, error } = await supabase
                .from('job_swipes')
                .select(`
                    id,
                    job_id,
                    ai_match_percentage,
                    jobs (
                        id,
                        company_name,
                        role_title,
                        location,
                        salary_range,
                        description,
                        required_skills
                    )
                `)
                .eq('user_id', user.id)
                .eq('is_interested', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch statuses from job_applications
            const { data: apps } = await supabase
                .from('job_applications')
                .select('job_id, status')
                .eq('user_id', user.id);

            const statusMap = new Map(apps?.map(a => [a.job_id, a.status]) || []);

            const formatted = (data || []).map(item => ({
                id: item.job_id,
                ...item.jobs,
                matchPercentage: item.ai_match_percentage,
                status: statusMap.get(item.job_id) || 'interested'
            }));

            setMatches(formatted);
        } catch (err) {
            console.error('Fetch Matches Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const handleApply = async (job: any) => {
        if (!user || user.id === 'pending') return;
        setIsApplyingId(job.id);
        
        try {
            // Check for CV first
            const { data: cvs } = await supabase
                .from('cv_scans')
                .select('file_url')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);
            
            const cvUrl = cvs?.[0]?.file_url;
            
            const response = await fetch(AI_API.APPLY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    jobId: job.id,
                    cvUrl: cvUrl || null
                })
            });

            if (!response.ok) throw new Error('Forwarding failed');

            Alert.alert(
                "Application Sent!", 
                `Your profile and CV have been forwarded to ${job.company_name}. They will contact you via email if they wish to proceed.`,
                [{ text: "Great!", onPress: fetchMatches }]
            );
        } catch (err) {
            console.error('Apply Error:', err);
            Alert.alert("Error", "Failed to forward application. Please try again.");
        } finally {
            setIsApplyingId(null);
        }
    };

    const updateManualStatus = async (jobId: string, newStatus: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('job_applications')
                .upsert({ 
                    user_id: user.id, 
                    job_id: jobId, 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,job_id' });
            
            if (error) throw error;
            fetchMatches();
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'applied': return { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Applied' };
            case 'interviewing': return { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Interviewing' };
            case 'hired': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Hired' };
            case 'rejected': return { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Rejected' };
            default: return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Interested' };
        }
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`flex-1`}>
                {/* Header */}
                <View style={tw`px-6 pt-16 pb-6 flex-row items-center justify-between`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center`}
                    >
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={tw`text-white font-[InterTight-Bold] text-2xl`}>Job Matches</Text>
                    <View style={tw`w-10`} />
                </View>

                {isLoading ? (
                    <View style={tw`flex-1 items-center justify-center`}>
                        <ActivityIndicator color="#fff" size="large" />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={tw`px-6 pb-32`} showsVerticalScrollIndicator={false}>
                        {matches.length === 0 ? (
                            <View style={tw`mt-20 items-center px-10`}>
                                <View style={tw`w-24 h-24 rounded-full bg-white/5 items-center justify-center mb-6`}>
                                    <Briefcase color="#444" size={48} />
                                </View>
                                <Text style={tw`text-white font-[InterTight-Bold] text-2xl mb-2 text-center`}>No matches yet</Text>
                                <Text style={tw`text-gray-500 font-[InterTight] text-[15px] text-center`}>
                                    Keep swiping in the Explore tab to find career opportunities that fit your profile.
                                </Text>
                            </View>
                        ) : (
                            matches.map((job) => {
                                const statusInfo = getStatusStyle(job.status);
                                return (
                                    <GlassCard key={job.id} style={tw`mb-6 p-6 bg-white/5`} noPadding={false}>
                                        <View style={tw`flex-row justify-between items-start mb-4`}>
                                            <View style={tw`flex-1 mr-2`}>
                                                <Text style={tw`text-white font-[InterTight-Bold] text-lg mb-1`}>{job.role_title}</Text>
                                                <Text style={tw`text-gray-400 font-[InterTight] text-sm`}>{job.company_name} • {job.location}</Text>
                                            </View>
                                            <View style={tw`items-end`}>
                                                <View style={tw`bg-[#2b4e50] px-2 py-1 rounded-lg border border-white/10 mb-2`}>
                                                    <Text style={tw`text-white font-[InterTight-Bold] text-[10px]`}>{job.matchPercentage}% MATCH</Text>
                                                </View>
                                                <View style={tw`${statusInfo.bg} px-3 py-1 rounded-full border border-white/10`}>
                                                    <Text style={tw`${statusInfo.text} text-[10px] font-bold uppercase tracking-wider`}>{statusInfo.label}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Action Row */}
                                        <View style={tw`flex-row gap-3 mt-4`}>
                                            {job.status === 'interested' ? (
                                                <TouchableOpacity
                                                    onPress={() => handleApply(job)}
                                                    disabled={isApplyingId === job.id}
                                                    style={tw`flex-1 bg-white h-12 rounded-2xl items-center justify-center flex-row`}
                                                >
                                                    {isApplyingId === job.id ? (
                                                        <ActivityIndicator color="#000" />
                                                    ) : (
                                                        <>
                                                            <Send color="#000" size={18} style={tw`mr-2`} />
                                                            <Text style={tw`text-black font-bold font-inter-medium`}>Forward Profile</Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={tw`flex-1 bg-white/10 h-12 rounded-2xl items-center justify-center border border-white/5 flex-row`}>
                                                    <CheckCircle2 color="#44ff4480" size={18} style={tw`mr-2`} />
                                                    <Text style={tw`text-gray-400 font-bold font-inter-medium`}>Application Forwarded</Text>
                                                </View>
                                            )}
                                            
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    Alert.alert(
                                                        "Update Tracker",
                                                        "If the company has contacted you via email, please update your progress manually:",
                                                        [
                                                            { text: "Interviewing", onPress: () => updateManualStatus(job.id, 'interviewing') },
                                                            { text: "Hired! 🎉", onPress: () => updateManualStatus(job.id, 'hired') },
                                                            { text: "Not interested", onPress: () => updateManualStatus(job.id, 'rejected') },
                                                            { text: "Keep as is", style: "cancel" }
                                                        ]
                                                    )
                                                }}
                                                style={tw`w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/10`}
                                            >
                                                <MoreVertical color="#fff" size={20} />
                                            </TouchableOpacity>
                                        </View>
                                    </GlassCard>
                                );
                            })
                        )}
                    </ScrollView>
                )}
            </View>
        </GlassBackground>
    );
}
