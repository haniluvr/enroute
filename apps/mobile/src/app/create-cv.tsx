import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Alert, 
    TextInput, 
    ActivityIndicator, 
    Dimensions,
    StyleSheet,
    Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
    ChevronLeft, 
    ChevronRight, 
    Sparkles, 
    Plus, 
    Trash2, 
    FileText, 
    Download, 
    Check, 
    User, 
    Briefcase, 
    GraduationCap, 
    Settings, 
    Globe, 
    Award,
    Search,
    Book,
    DollarSign,
    Users,
    Palette,
    Type
} from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useAuth } from '@/hooks/useAuth';
import { AIAssistantService } from '@/services/ai-assistant';
import { PDFService, ResumeData } from '@/services/pdf-service';
import { supabase } from '@/config/supabase';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    withSpring,
    FadeIn,
    FadeOut,
    SlideInDown
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type Phase = 'START' | 'FILL' | 'DESIGN' | 'DOWNLOAD';
type DocType = 'resume' | 'cv';

interface Section {
    id: string;
    label: string;
    icon: any;
    enabled: boolean;
}

export default function CreateCVScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [phase, setPhase] = useState<Phase>('START');
    const [docType, setDocType] = useState<DocType>('resume');
    const [isSaving, setIsSaving] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    // Initial Data State
    const [data, setData] = useState<ResumeData & { name: string }>({
        name: '',
        personal: { fullName: '', email: '', phone: '', location: '' },
        summary: '',
        skills: [],
        experience: [],
        education: [],
        design: {
            templateId: 'clean-modern',
            primaryColor: '#a78bfa',
            fontFamily: 'InterTight'
        }
    });

    const [sections, setSections] = useState<Section[]>([]);

    useEffect(() => {
        if (user) {
            setData(prev => ({
                ...prev,
                personal: {
                    ...prev.personal,
                    fullName: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
                    email: user.email || '',
                }
            }));
        }
    }, [user]);

    // Initialize sections based on docType
    useEffect(() => {
        if (docType === 'resume') {
            setSections([
                { id: 'personal', label: 'Personal Information', icon: User, enabled: true },
                { id: 'experience', label: 'Work Experience', icon: Briefcase, enabled: true },
                { id: 'education', label: 'Education', icon: GraduationCap, enabled: true },
                { id: 'skills', label: 'Skills', icon: Settings, enabled: true },
                { id: 'language', label: 'Language', icon: Globe, enabled: true },
                { id: 'courses', label: 'Courses & Certificates', icon: Award, enabled: true },
            ]);
        } else {
            setSections([
                { id: 'personal', label: 'Contact Info', icon: User, enabled: true },
                { id: 'research', label: 'Research Interests', icon: Search, enabled: true },
                { id: 'education', label: 'Education', icon: GraduationCap, enabled: true },
                { id: 'academic_exp', label: 'Academic/Research Experience', icon: Briefcase, enabled: true },
                { id: 'publications', label: 'Publications & Presentations', icon: Book, enabled: true },
                { id: 'certifications', label: 'Certifications & Trainings', icon: Award, enabled: true },
                { id: 'grants', label: 'Grants & Memberships', icon: DollarSign, enabled: true },
            ]);
        }
    }, [docType]);

    // Orb Animation
    const orbScale = useSharedValue(1);
    const orbOpacity = useSharedValue(0.8);

    useEffect(() => {
        if (phase === 'START') {
            orbScale.value = withRepeat(withTiming(1.15, { duration: 2500 }), -1, true);
            orbOpacity.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
        }
    }, [phase]);

    const animatedOrbStyle = useAnimatedStyle(() => ({
        transform: [{ scale: orbScale.value }],
        opacity: orbOpacity.value,
    }));

    const handleStartBuilding = (type: DocType) => {
        setDocType(type);
        setPhase('FILL');
    };

    const renderStartScreen = () => (
        <View style={tw`flex-1 items-center justify-center px-8`}>
            {/* Animated Orb */}
            <View style={tw`items-center justify-center mb-12`}>
                <Animated.View style={[
                    tw`w-48 h-48 rounded-full bg-cyan-400/20 items-center justify-center`,
                    animatedOrbStyle
                ]}>
                    <View style={tw`w-32 h-32 rounded-full bg-cyan-400/40 items-center justify-center shadow-lg`}>
                        <Sparkles color="#fff" size={64} />
                    </View>
                </Animated.View>
                {/* Glow shadows */}
                <View style={[StyleSheet.absoluteFill, tw`items-center justify-center -z-10`]}>
                    <View style={tw`w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full`} />
                </View>
            </View>

            <Text style={tw`text-white text-3xl font-[InterTight-Bold] mb-2 text-center`}>Create resume with AI</Text>
            <Text style={tw`text-gray-400 text-base font-[InterTight] mb-12 text-center px-4`}>
                Enter your name and target role, get a professional CV in seconds.
            </Text>

            <View style={tw`w-full gap-4 mb-12`}>
                <View style={tw`bg-white/5 border border-white/10 rounded-3xl p-6`}>
                    <Text style={tw`text-gray-400 text-xs uppercase font-bold mb-2`}>Full Name</Text>
                    <TextInput
                        style={tw`text-white text-lg font-[InterTight-Medium]`}
                        value={data.personal.fullName}
                        onChangeText={(v) => setData(p => ({ ...p, personal: { ...p.personal, fullName: v } }))}
                        placeholder="Rick Tang"
                        placeholderTextColor="#444"
                    />
                    <View style={tw`h-[1px] bg-white/10 my-4`} />
                    <Text style={tw`text-gray-400 text-xs uppercase font-bold mb-2`}>Job Role</Text>
                    <TextInput
                        style={tw`text-white text-lg font-[InterTight-Medium]`}
                        value={data.name}
                        onChangeText={(v) => setData(p => ({ ...p, name: v }))}
                        placeholder="Product Designer"
                        placeholderTextColor="#444"
                    />
                </View>
            </View>

            <View style={tw`w-full gap-4`}>
                <TouchableOpacity
                    onPress={() => handleStartBuilding('resume')}
                    style={tw`bg-white py-5 rounded-full items-center shadow-lg w-full`}
                >
                    <Text style={tw`text-black font-[InterTight-Bold] text-lg`}>Build Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleStartBuilding('cv')}
                    style={tw`bg-white/10 border border-white/10 py-5 rounded-full items-center w-full`}
                >
                    <Text style={tw`text-white font-[InterTight-Bold] text-lg`}>Build CV</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderFillPhase = () => (
        <View style={tw`flex-1`}>
            {/* Header */}
            <View style={tw`flex-row items-center justify-between px-6 pt-14 pb-4`}>
                <TouchableOpacity 
                    onPress={() => activeSectionId ? setActiveSectionId(null) : setPhase('START')} 
                    style={tw`bg-white/10 p-2.5 rounded-xl border border-white/10`}
                >
                    <ChevronLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={tw`text-white text-xl font-[InterTight-Bold]`}>
                    {activeSectionId ? sections.find(s => s.id === activeSectionId)?.label : `${docType === 'resume' ? 'Resume' : 'CV'} ${data.personal.fullName.split(' ')[0]}`}
                </Text>
                <View style={tw`w-10`} />
            </View>

            <ScrollView contentContainerStyle={tw`px-6 pt-6 pb-32`}>
                {!activeSectionId ? (
                    <>
                        {sections.filter(s => s.enabled).map((section) => (
                            <TouchableOpacity
                                key={section.id}
                                onPress={() => setActiveSectionId(section.id)}
                                style={tw`flex-row items-center bg-white/5 border border-white/10 p-5 rounded-3xl mb-4`}
                            >
                                <View style={tw`bg-white/10 p-3 rounded-2xl mr-4`}>
                                    <section.icon color="#fff" size={24} />
                                </View>
                                <Text style={tw`text-white text-lg font-[InterTight-Medium]`}>{section.label}</Text>
                                <ChevronRight color="#555" size={20} style={tw`ml-auto`} />
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            onPress={() => setShowSectionModal(true)}
                            style={tw`flex-row items-center justify-center bg-white/10 py-5 rounded-3xl border border-white/20 mt-4`}
                        >
                            <Plus color="#fff" size={20} style={tw`mr-2`} />
                            <Text style={tw`text-white font-[InterTight-Bold]`}>Add or remove sections</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    renderSectionForm()
                )}
            </ScrollView>
        </View>
    );

    function renderSectionForm() {
        switch (activeSectionId) {
            case 'personal':
                return (
                    <View style={tw`gap-6`}>
                        <View>
                            <Text style={tw`text-gray-400 text-xs uppercase mb-2 ml-1 font-bold`}>Full Name</Text>
                            <TextInput
                                style={tw`bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-[InterTight]`}
                                value={data.personal.fullName}
                                onChangeText={(v) => setData(p => ({ ...p, personal: { ...p.personal, fullName: v } }))}
                            />
                        </View>
                        <View style={tw`flex-row gap-4`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-gray-400 text-xs uppercase mb-2 ml-1 font-bold`}>Phone</Text>
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-[InterTight]`}
                                    value={data.personal.phone}
                                    onChangeText={(v) => setData(p => ({ ...p, personal: { ...p.personal, phone: v } }))}
                                />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-gray-400 text-xs uppercase mb-2 ml-1 font-bold`}>Location</Text>
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-[InterTight]`}
                                    value={data.personal.location}
                                    onChangeText={(v) => setData(p => ({ ...p, personal: { ...p.personal, location: v } }))}
                                />
                            </View>
                        </View>
                        <View>
                            <Text style={tw`text-gray-400 text-xs uppercase mb-2 ml-1 font-bold`}>Email</Text>
                            <TextInput
                                style={tw`bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-[InterTight]`}
                                value={data.personal.email}
                                onChangeText={(v) => setData(p => ({ ...p, personal: { ...p.personal, email: v } }))}
                            />
                        </View>
                        <View>
                            <View style={tw`flex-row items-center justify-between mb-2 ml-1`}>
                                <Text style={tw`text-gray-400 text-xs uppercase font-bold`}>Summary</Text>
                                <TouchableOpacity onPress={() => handleRefine()} style={tw`flex-row items-center`}>
                                    <Sparkles color="#A78BFA" size={14} style={tw`mr-1`} />
                                    <Text style={tw`text-[#A78BFA] text-xs font-bold`}>Refine with AI</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={tw`bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-[InterTight] h-40`}
                                multiline
                                textAlignVertical="top"
                                value={data.summary}
                                onChangeText={(v) => setData(p => ({ ...p, summary: v }))}
                            />
                        </View>
                        <GlassButton title="Done" onPress={() => setActiveSectionId(null)} />
                    </View>
                );
            case 'experience':
                return (
                    <View style={tw`gap-6`}>
                        {data.experience.map((exp, i) => (
                            <GlassCard key={i} style={tw`bg-white/5 p-6 mb-4`}>
                                <View style={tw`flex-row justify-between mb-4`}>
                                    <Text style={tw`text-cyan-400 text-xs font-bold uppercase`}>Experience #{i + 1}</Text>
                                    <TouchableOpacity onPress={() => setData(p => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }))}>
                                        <Trash2 color="#ef4444" size={18} />
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-3`}
                                    placeholder="Title"
                                    placeholderTextColor="#555"
                                    value={exp.title}
                                    onChangeText={(v) => {
                                        const newExp = [...data.experience];
                                        newExp[i].title = v;
                                        setData(p => ({ ...p, experience: newExp }));
                                    }}
                                />
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-3`}
                                    placeholder="Company"
                                    placeholderTextColor="#555"
                                    value={exp.company}
                                    onChangeText={(v) => {
                                        const newExp = [...data.experience];
                                        newExp[i].company = v;
                                        setData(p => ({ ...p, experience: newExp }));
                                    }}
                                />
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-3`}
                                    placeholder="Dates (e.g. 2021 - Present)"
                                    placeholderTextColor="#555"
                                    value={exp.dates}
                                    onChangeText={(v) => {
                                        const newExp = [...data.experience];
                                        newExp[i].dates = v;
                                        setData(p => ({ ...p, experience: newExp }));
                                    }}
                                />
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white h-32`}
                                    placeholder="Description or Bullet Points"
                                    placeholderTextColor="#555"
                                    multiline
                                    textAlignVertical="top"
                                    value={exp.description}
                                    onChangeText={(v) => {
                                        const newExp = [...data.experience];
                                        newExp[i].description = v;
                                        setData(p => ({ ...p, experience: newExp }));
                                    }}
                                />
                            </GlassCard>
                        ))}
                        <TouchableOpacity 
                            onPress={() => setData(p => ({ ...p, experience: [...p.experience, { title: '', company: '', dates: '', description: '', bullets: [] }] }))}
                            style={tw`flex-row items-center justify-center bg-white/10 py-4 rounded-2xl border border-white/10`}
                        >
                            <Plus color="#fff" size={18} style={tw`mr-2`} />
                            <Text style={tw`text-white font-bold`}>Add Experience</Text>
                        </TouchableOpacity>
                        <GlassButton title="Done" onPress={() => setActiveSectionId(null)} />
                    </View>
                );
            case 'education':
                return (
                    <View style={tw`gap-6`}>
                        {data.education.map((edu, i) => (
                            <GlassCard key={i} style={tw`bg-white/5 p-6 mb-4`}>
                                <View style={tw`flex-row justify-between mb-4`}>
                                    <Text style={tw`text-cyan-400 text-xs font-bold uppercase`}>Education #{i + 1}</Text>
                                    <TouchableOpacity onPress={() => setData(p => ({ ...p, education: p.education.filter((_, idx) => idx !== i) }))}>
                                        <Trash2 color="#ef4444" size={18} />
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-3`}
                                    placeholder="Degree / Course"
                                    placeholderTextColor="#555"
                                    value={edu.degree}
                                    onChangeText={(v) => {
                                        const newEdu = [...data.education];
                                        newEdu[i].degree = v;
                                        setData(p => ({ ...p, education: newEdu }));
                                    }}
                                />
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-3`}
                                    placeholder="School / University"
                                    placeholderTextColor="#555"
                                    value={edu.school}
                                    onChangeText={(v) => {
                                        const newEdu = [...data.education];
                                        newEdu[i].school = v;
                                        setData(p => ({ ...p, education: newEdu }));
                                    }}
                                />
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-3`}
                                    placeholder="Year"
                                    placeholderTextColor="#555"
                                    value={edu.year}
                                    onChangeText={(v) => {
                                        const newEdu = [...data.education];
                                        newEdu[i].year = v;
                                        setData(p => ({ ...p, education: newEdu }));
                                    }}
                                />
                                {docType === 'cv' && (
                                    <TextInput
                                        style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white h-24`}
                                        placeholder="Thesis, Awards, or details"
                                        placeholderTextColor="#555"
                                        multiline
                                        textAlignVertical="top"
                                        value={edu.description}
                                        onChangeText={(v) => {
                                            const newEdu = [...data.education];
                                            newEdu[i].description = v;
                                            setData(p => ({ ...p, education: newEdu }));
                                        }}
                                    />
                                )}
                            </GlassCard>
                        ))}
                        <TouchableOpacity 
                            onPress={() => setData(p => ({ ...p, education: [...p.education, { degree: '', school: '', year: '', description: '' }] }))}
                            style={tw`flex-row items-center justify-center bg-white/10 py-4 rounded-2xl border border-white/10`}
                        >
                            <Plus color="#fff" size={18} style={tw`mr-2`} />
                            <Text style={tw`text-white font-bold`}>Add Education</Text>
                        </TouchableOpacity>
                        <GlassButton title="Done" onPress={() => setActiveSectionId(null)} />
                    </View>
                );
            case 'skills':
            case 'language':
            case 'courses':
            case 'research':
            case 'publications':
            case 'certifications':
            case 'grants':
                const fieldName = activeSectionId === 'language' ? 'languages' : 
                                activeSectionId === 'courses' ? 'trainings' : 
                                activeSectionId === 'certifications' ? 'certifications' :
                                activeSectionId === 'research' ? 'researchInterests' :
                                activeSectionId === 'publications' ? 'publications' :
                                activeSectionId === 'grants' ? 'grants' : 'skills';
                return (
                    <View style={tw`gap-6`}>
                        <Text style={tw`text-gray-400 text-sm`}>Enter items separated by commas.</Text>
                        <TextInput
                            style={tw`bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-white font-[InterTight] h-64`}
                            multiline
                            textAlignVertical="top"
                            placeholder="Example item 1, Example item 2..."
                            placeholderTextColor="#444"
                            value={(data[fieldName as keyof ResumeData] as string[])?.join(', ') || ''}
                            onChangeText={(v) => setData(p => ({ ...p, [fieldName]: v.split(',').map(s => s.trim()).filter(s => s) }))}
                        />
                        <GlassButton title="Done" onPress={() => setActiveSectionId(null)} />
                    </View>
                );
            case 'academic_exp':
                return (
                    <View style={tw`gap-6`}>
                        {data.academicExperience?.map((exp, i) => (
                            <GlassCard key={i} style={tw`bg-white/5 p-6 mb-4`}>
                                <View style={tw`flex-row justify-between mb-4`}>
                                    <Text style={tw`text-cyan-400 text-xs font-bold uppercase`}>Entry #{i + 1}</Text>
                                    <TouchableOpacity onPress={() => setData(p => ({ ...p, academicExperience: p.academicExperience?.filter((_, idx) => idx !== i) }))}>
                                        <Trash2 color="#ef4444" size={18} />
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-3`}
                                    placeholder="Role"
                                    placeholderTextColor="#555"
                                    value={exp.role}
                                    onChangeText={(v) => {
                                        const newEx = [...(data.academicExperience || [])];
                                        newEx[i].role = v;
                                        setData(p => ({ ...p, academicExperience: newEx }));
                                    }}
                                />
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-3`}
                                    placeholder="Institution"
                                    placeholderTextColor="#555"
                                    value={exp.institution}
                                    onChangeText={(v) => {
                                        const newEx = [...(data.academicExperience || [])];
                                        newEx[i].institution = v;
                                        setData(p => ({ ...p, academicExperience: newEx }));
                                    }}
                                />
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-3`}
                                    placeholder="PI / Project"
                                    placeholderTextColor="#555"
                                    value={exp.project}
                                    onChangeText={(v) => {
                                        const newEx = [...(data.academicExperience || [])];
                                        newEx[i].project = v;
                                        setData(p => ({ ...p, academicExperience: newEx }));
                                    }}
                                />
                                <TextInput
                                    style={tw`bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white h-24`}
                                    placeholder="Details..."
                                    placeholderTextColor="#555"
                                    multiline
                                    textAlignVertical="top"
                                    value={exp.description}
                                    onChangeText={(v) => {
                                        const newEx = [...(data.academicExperience || [])];
                                        newEx[i].description = v;
                                        setData(p => ({ ...p, academicExperience: newEx }));
                                    }}
                                />
                            </GlassCard>
                        ))}
                        <TouchableOpacity 
                            onPress={() => setData(p => ({ ...p, academicExperience: [...(p.academicExperience || []), { role: '', institution: '', dates: '', description: '' }] }))}
                            style={tw`flex-row items-center justify-center bg-white/10 py-4 rounded-2xl border border-white/10`}
                        >
                            <Plus color="#fff" size={18} style={tw`mr-2`} />
                            <Text style={tw`text-white font-bold`}>Add Academic Experience</Text>
                        </TouchableOpacity>
                        <GlassButton title="Done" onPress={() => setActiveSectionId(null)} />
                    </View>
                );
            default:
                return null;
        }
    }

    const handleRefine = async () => {
        setIsThinking(true);
        try {
            const refined = await AIAssistantService.refineText(data.summary || '', docType);
            setData(prev => ({ ...prev, summary: refined }));
        } catch (err) {
            console.error('Refine error:', err);
        } finally {
            setIsThinking(false);
        }
    };

    const renderDesignPhase = () => (
        <View style={tw`flex-1 pt-14 px-6`}>
            <Text style={tw`text-white text-3xl font-[InterTight-Bold] mb-8`}>Design</Text>
            
            <Text style={tw`text-gray-400 text-sm font-bold uppercase mb-4 tracking-widest`}>Templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-10`}>
                <TouchableOpacity 
                    onPress={() => {
                        setData(p => ({ ...p, design: { ...p.design!, templateId: 'clean-modern' } }));
                        Alert.alert('Template Selected', 'Clean Modern template applied.');
                    }}
                    style={tw`mr-4`}
                >
                    <View style={tw`w-52 h-72 bg-white/5 border-2 ${data.design?.templateId === 'clean-modern' ? 'border-cyan-400' : 'border-white/10'} rounded-3xl items-center justify-center overflow-hidden`}>
                        <FileText color="#fff" size={48} opacity={0.3} />
                    </View>
                    <Text style={tw`text-white text-center mt-3 font-[InterTight-Medium]`}>Clean Modern</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => {
                        setData(p => ({ ...p, design: { ...p.design!, templateId: 'classic-minimal' } }));
                        Alert.alert('Template Selected', 'Classic Minimal template applied.');
                    }}
                    style={tw`mr-4`}
                >
                    <View style={tw`w-52 h-72 bg-white/5 border-2 ${data.design?.templateId === 'classic-minimal' ? 'border-cyan-400' : 'border-white/10'} rounded-3xl items-center justify-center overflow-hidden`}>
                        <FileText color="#fff" size={48} opacity={0.3} />
                    </View>
                    <Text style={tw`text-gray-400 text-center mt-3 font-[InterTight-Medium]`}>Classic Minimal</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={tw`gap-8`}>
                <View>
                    <Text style={tw`text-gray-400 text-sm font-bold uppercase mb-4 tracking-widest`}>Colors</Text>
                    <View style={tw`flex-row gap-4`}>
                        {['#a78bfa', '#ff007f', '#00e5ff', '#00ff7f'].map(c => (
                            <TouchableOpacity 
                                key={c} 
                                onPress={() => setData(p => ({ ...p, design: { ...p.design!, primaryColor: c } }))}
                                style={[tw`w-12 h-12 rounded-full border-2`, { backgroundColor: c, borderColor: data.design?.primaryColor === c ? '#fff' : 'transparent' }]} 
                            />
                        ))}
                    </View>
                </View>

                <View>
                    <Text style={tw`text-gray-400 text-sm font-bold uppercase mb-4 tracking-widest`}>Fonts</Text>
                    <View style={tw`flex-row gap-4`}>
                        <TouchableOpacity 
                            onPress={() => setData(p => ({ ...p, design: { ...p.design!, fontFamily: 'InterTight' } }))}
                            style={tw`bg-white/10 px-6 py-3 rounded-2xl border ${data.design?.fontFamily === 'InterTight' ? 'border-white' : 'border-white/10'}`}
                        >
                            <Text style={tw`text-white font-[InterTight]`}>Inter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setData(p => ({ ...p, design: { ...p.design!, fontFamily: 'Serif' } }))}
                            style={tw`bg-white/5 px-6 py-3 rounded-2xl border ${data.design?.fontFamily === 'Serif' ? 'border-white' : 'border-white/10'}`}
                        >
                            <Text style={tw`text-gray-400 font-serif`}>Serif</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderDownloadPhase = () => (
        <View style={tw`flex-1 items-center justify-center px-8`}>
            <View style={tw`w-full items-center mb-12`}>
                <View style={tw`w-64 h-96 bg-white rounded-3xl shadow-2xl p-6 items-center shadow-white/10`}>
                    <View style={[tw`w-12 h-12 rounded-full mb-4`, { backgroundColor: data.design?.primaryColor }]} />
                    <View style={tw`w-32 h-4 bg-gray-200 rounded mb-2`} />
                    <View style={tw`w-24 h-3 bg-gray-100 rounded mb-8`} />
                    <View style={tw`w-full h-[2px] bg-gray-50 mb-8`} />
                    <View style={tw`w-full gap-2`}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <View key={i} style={tw`w-full h-3 bg-gray-50 rounded`} />
                        ))}
                    </View>
                </View>
            </View>

            <Text style={tw`text-white text-2xl font-[InterTight-Bold] mb-2 text-center`}>Review & Export</Text>
            <Text style={tw`text-gray-400 text-base font-[InterTight] mb-12 text-center`}>Your {docType} is ready to be shared with the world.</Text>

            <View style={tw`w-full gap-4`}>
                <TouchableOpacity
                    onPress={() => PDFService.generateResumePDF(data, data.design?.templateId)}
                    style={tw`bg-white py-5 rounded-full items-center flex-row justify-center`}
                >
                    <Download color="#000" size={20} style={tw`mr-2`} />
                    <Text style={tw`text-black font-[InterTight-Bold] text-lg`}>Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={async () => {
                        if (!user) return;
                        setIsSaving(true);
                        try {
                            // Save to resumes table
                            const { data: resData, error: resError } = await supabase.from('resumes').insert({
                                user_id: user.id,
                                type: docType,
                                name: data.name || (docType === 'resume' ? 'My Resume' : 'My CV'),
                                content: data,
                            }).select().single();
                            
                            if (resError) throw resError;

                            // Also save to library_saves for unified library view
                            const { error: libError } = await supabase.from('library_saves').insert({
                                user_id: user.id,
                                item_type: docType,
                                item_id: resData.id,
                                title: data.name || (docType === 'resume' ? 'Professional Resume' : 'Academic CV'),
                                metadata: { docType, templateId: data.design?.templateId }
                            });

                            if (libError) throw libError;
                            
                            Alert.alert('Success', 'Saved to your profile library.');
                        } catch (err: any) {
                            Alert.alert('Error Saving', err.message);
                        } finally {
                            setIsSaving(false);
                        }
                    }}
                    style={tw`bg-white/10 border border-white/10 py-5 rounded-full items-center`}
                >
                    {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={tw`text-white font-[InterTight-Bold] text-lg`}>Save to Library</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPhaseNavigation = () => {
        if (phase === 'START') return null;

        return (
            <View style={tw`absolute bottom-0 left-0 right-0 h-24 bg-[#0a0a0a]/90 border-t border-white/5 flex-row items-center justify-around px-4`}>
                <TouchableOpacity onPress={() => setPhase('FILL')} style={tw`items-center`}>
                    <FileText color={phase === 'FILL' ? '#fff' : '#444'} size={24} />
                    <Text style={[tw`text-[10px] mt-1 uppercase font-bold`, { color: phase === 'FILL' ? '#fff' : '#444' }]}>Fill {docType}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPhase('DESIGN')} style={tw`items-center`}>
                    <Palette color={phase === 'DESIGN' ? '#fff' : '#444'} size={24} />
                    <Text style={[tw`text-[10px] mt-1 uppercase font-bold`, { color: phase === 'DESIGN' ? '#fff' : '#444' }]}>Design</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPhase('DOWNLOAD')} style={tw`items-center`}>
                    <Download color={phase === 'DOWNLOAD' ? '#fff' : '#444'} size={24} />
                    <Text style={[tw`text-[10px] mt-1 uppercase font-bold`, { color: phase === 'DOWNLOAD' ? '#fff' : '#444' }]}>Download</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderSectionModal = () => (
        <Modal
            visible={showSectionModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSectionModal(false)}
        >
            <View style={tw`flex-1 bg-black/80 justify-end`}>
                <GlassCard style={tw`h-[70%] rounded-t-[40px] shadow-2xl`} noPadding>
                    <View style={tw`p-8`}>
                        <View style={tw`flex-row items-center justify-between mb-8`}>
                            <Text style={tw`text-white text-2xl font-[InterTight-Bold]`}>Manage Sections</Text>
                            <TouchableOpacity onPress={() => setShowSectionModal(false)} style={tw`bg-white/10 p-2 rounded-full`}>
                                <Check color="#fff" size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {sections.map(s => (
                                <TouchableOpacity
                                    key={s.id}
                                    onPress={() => {
                                        setSections(prev => prev.map(item => item.id === s.id ? { ...item, enabled: !item.enabled } : item));
                                    }}
                                    style={tw`flex-row items-center py-4 border-b border-white/5`}
                                >
                                    <View style={tw`bg-white/5 p-3 rounded-xl mr-4`}>
                                        <s.icon color="#888" size={20} />
                                    </View>
                                    <Text style={tw`text-white text-lg flex-1`}>{s.label}</Text>
                                    <View style={[tw`w-6 h-6 rounded-full border-2 items-center justify-center`, { borderColor: s.enabled ? '#00e5ff' : '#444', backgroundColor: s.enabled ? '#00e5ff' : 'transparent' }]}>
                                        {s.enabled && <Check color="#000" size={14} />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </GlassCard>
            </View>
        </Modal>
    );

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`flex-1`}>
                {phase === 'START' && renderStartScreen()}
                {phase === 'FILL' && renderFillPhase()}
                {phase === 'DESIGN' && renderDesignPhase()}
                {phase === 'DOWNLOAD' && renderDownloadPhase()}
                
                {renderPhaseNavigation()}
                {renderSectionModal()}
            </View>
        </GlassBackground>
    );
}
