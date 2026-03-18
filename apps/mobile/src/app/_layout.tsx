import 'react-native-gesture-handler';
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, View, Text } from 'react-native';

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
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.location.href = 'http://localhost:5173/';
        }
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

    if (Platform.OS === 'web') {
        return (
            <View style={{ flex: 1, backgroundColor: '#0a0f1c', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white' }}>Redirecting to Admin Web Portal...</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <StatusBar style="light" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: 'transparent' }
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="career-interest-test" options={{ headerShown: false }} />
                </Stack>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}
