import 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useFonts } from 'expo-font';
import {
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold
} from '@expo-google-fonts/inter-tight';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

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

    useEffect(() => {
        if (isLoading || !fontsLoaded) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboarding = !segments[0] || segments[0] === 'onboarding' || segments[0] === 'index' || segments[0] === 'auth-selection';
        const isProtectedHeader = segments[0] === '(tabs)' || segments[0] === 'settings' || segments[0] === 'career-interest-test';

        if (!user && isProtectedHeader) {
            // If not logged in and trying to access protected routes, redirect to auth-selection
            router.replace('/auth-selection');
        } else if (user && (inAuthGroup || inOnboarding)) {
            // If logged in and on auth/onboarding pages, redirect to the app home
            router.replace('/(tabs)/home');
        }
    }, [user, isLoading, segments, fontsLoaded]);

    if (fontError) {
        console.error("Font Loading Error:", fontError);
    }

    if (!fontsLoaded && !fontError) {
        return null; // Wait for fonts to load
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                gestureEnabled: false // Globally disable root-level swipes
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="career-interest-test" options={{ headerShown: false }} />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <StatusBar style="light" />
                <InitialLayout />
            </AuthProvider>
        </GestureHandlerRootView>
    );
}
