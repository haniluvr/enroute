import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/hooks/useAuth';
import { useFonts } from 'expo-font';
import {
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold
} from '@expo-google-fonts/inter-tight';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        'InterTight-Regular': InterTight_400Regular,
        'InterTight-Medium': InterTight_500Medium,
        'InterTight-SemiBold': InterTight_600SemiBold,
        'InterTight-Bold': InterTight_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (fontError) {
        console.error("Font Loading Error:", fontError);
    }

    if (!fontsLoaded && !fontError) {
        return null; // Wait for fonts to load
    }

    return (
        <AuthProvider>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false, // We'll build custom Glass Headers
                    contentStyle: { backgroundColor: 'transparent' }
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
        </AuthProvider>
    );
}
