import tw from '@/lib/tailwind';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Modal, FlatList } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';

const CAREER_INTERESTS = [
    'Software Engineering', 'UI/UX Design', 'Data Science', 'Product Management', 'Marketing', 'Finance'
];

const CURRENT_LEVELS = [
    'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate Student', 'Professional'
];

export default function PersonalizeScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [careerInterest, setCareerInterest] = useState('');
    const [currentLevel, setCurrentLevel] = useState('');

    // Modal state for dropdowns
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [dropdownData, setDropdownData] = useState<string[]>([]);
    const [dropdownType, setDropdownType] = useState<'career' | 'level' | null>(null);

    const openDropdown = (type: 'career' | 'level') => {
        setDropdownType(type);
        setDropdownData(type === 'career' ? CAREER_INTERESTS : CURRENT_LEVELS);
        setDropdownVisible(true);
    };

    const handleSelect = (item: string) => {
        if (dropdownType === 'career') setCareerInterest(item);
        if (dropdownType === 'level') setCurrentLevel(item);
        setDropdownVisible(false);
    };

    const handleFinish = () => {
        router.replace('/(tabs)/home');
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <SafeAreaView style={tw`flex-1`}>
                <View style={tw`px-4 pt-4`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`bg-white/10 p-2 rounded-full self-start`}>
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} style={tw`px-6 pt-4`}>
                    <View style={tw`mb-8`}>
                        <Text style={tw`text-3xl text-white font-[InterTight-Bold] mb-2`}>Personalize your experience</Text>
                        <Text style={tw`text-gray-400 font-[InterTight]`}>
                            Personalize your profile and choose add a name you'd like to be called
                        </Text>
                    </View>

                    <GlassCard style={tw`p-2 mb-8 border-white/10`}>
                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-sm mb-2 ml-1`}>Add Name</Text>
                            <TextInput
                                style={tw`bg-[#12121A]/80 border border-white/10 rounded-xl px-4 py-4 text-white font-[InterTight]`}
                                placeholder="Enter name"
                                placeholderTextColor="#555"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-sm mb-2 ml-1`}>Career interest</Text>
                            <TouchableOpacity
                                onPress={() => openDropdown('career')}
                                style={tw`bg-[#12121A]/80 border border-white/10 rounded-xl px-4 py-4 flex-row justify-between items-center`}
                            >
                                <Text style={tw`font-[InterTight] ${careerInterest ? 'text-white' : 'text-[#555]'}`}>
                                    {careerInterest || 'Select'}
                                </Text>
                                <ChevronDown color="#555" size={20} />
                            </TouchableOpacity>
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-400 font-[InterTight] font-medium text-sm mb-2 ml-1`}>Current level</Text>
                            <TouchableOpacity
                                onPress={() => openDropdown('level')}
                                style={tw`bg-[#12121A]/80 border border-white/10 rounded-xl px-4 py-4 flex-row justify-between items-center`}
                            >
                                <Text style={tw`font-[InterTight] ${currentLevel ? 'text-white' : 'text-[#555]'}`}>
                                    {currentLevel || 'Select'}
                                </Text>
                                <ChevronDown color="#555" size={20} />
                            </TouchableOpacity>
                        </View>

                        <GlassButton
                            title="Continue"
                            onPress={handleFinish}
                            variant="primary"
                        />
                    </GlassCard>

                </ScrollView>
            </SafeAreaView>

            {/* Simulated Select Dropdown Modal */}
            <Modal visible={isDropdownVisible} transparent animationType="fade">
                <TouchableOpacity style={tw`flex-1 justify-end bg-black/60`} onPress={() => setDropdownVisible(false)}>
                    <View style={tw`bg-[#1A1A24] rounded-t-3xl p-6 h-1/2`}>
                        <Text style={tw`text-white text-xl font-[InterTight-Bold] mb-4`}>
                            {dropdownType === 'career' ? 'Select Career Interest' : 'Select Current Level'}
                        </Text>
                        <FlatList
                            data={dropdownData}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleSelect(item)} style={tw`py-4 border-b border-white/10`}>
                                    <Text style={tw`text-white font-[InterTight] font-medium text-lg`}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </GlassBackground>
    );
}
