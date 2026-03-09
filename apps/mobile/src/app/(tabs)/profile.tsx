import tw from '@/lib/tailwind';
import { View, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { GlassBackground } from '@/components/GlassBackground';
import { GlassButton } from '@/components/GlassButton';
import { router } from 'expo-router';
import { supabase } from '@/config/supabase';

export default function ProfileScreen() {
    const [userName, setUserName] = useState('Loading...');
    const [initials, setInitials] = useState('--');

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.user_metadata) {
                const firstName = user.user_metadata.first_name || '';
                const lastName = user.user_metadata.last_name || '';
                const nickname = user.user_metadata.nickname || '';
                const emailPrefix = user.email ? user.email.split('@')[0] : 'User';
                
                const displayFirst = firstName || nickname || emailPrefix;
                const displayFull = lastName ? `${displayFirst} ${lastName}` : displayFirst;
                
                setUserName(displayFull);
                
                if (firstName && lastName) {
                    setInitials(`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase());
                } else if (displayFirst) {
                    setInitials(displayFirst.substring(0, 2).toUpperCase());
                } else {
                    setInitials('U');
                }
            } else {
                setUserName('Guest');
                setInitials('G');
            }
        };

        fetchUser();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/sign-in');
    };

    return (
        <GlassBackground locations={[0.0, 0.08, 0.2, 0.55]}>
            <View style={tw`flex-1 items-center justify-center px-6`}>
                {/* Profile Placeholder Header */}
                <View style={tw`w-24 h-24 rounded-full bg-white/10 mb-6 border border-white/20 items-center justify-center`}>
                    <Text style={tw`text-white text-3xl font-[InterTight-Bold]`}>{initials}</Text>
                </View>

                <Text style={tw`text-3xl text-white font-[InterTight-Bold] mb-2`}>{userName}</Text>
                <Text style={tw`text-accent-cyan font-[InterTight] font-medium mb-10`}>BS Information Technology, Year 3</Text>

                <GlassButton
                    title="Sign Out"
                    variant="danger"
                    onPress={handleSignOut}
                />
            </View>
        </GlassBackground>
    );
}
