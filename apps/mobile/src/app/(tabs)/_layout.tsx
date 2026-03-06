import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Home, Map, Compass, User } from 'lucide-react-native';
import LogoIcon from '@/assets/logo.svg';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    if (Platform.OS === 'ios') {
        return (
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <NativeTabs>
                    <NativeTabs.Trigger name="home">
                        <Label>Home</Label>
                        <Icon sf="house.fill" />
                    </NativeTabs.Trigger>

                    <NativeTabs.Trigger name="path">
                        <Label>Path</Label>
                        <Icon sf="map.fill" />
                    </NativeTabs.Trigger>

                    <NativeTabs.Trigger name="dahlia">
                        <Label>Dahlia</Label>
                        <Icon sf="waveform.and.mic" />
                    </NativeTabs.Trigger>

                    <NativeTabs.Trigger name="explore">
                        <Label>Explore</Label>
                        <Icon sf="safari.fill" />
                    </NativeTabs.Trigger>

                    <NativeTabs.Trigger name="profile">
                        <Label>Profile</Label>
                        <Icon sf="person.fill" />
                    </NativeTabs.Trigger>
                </NativeTabs>
            </ThemeProvider>
        );
    }

    // Android / Regular Tabs
    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
                    tabBarStyle: {
                        backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
                        borderTopColor: 'rgba(255,255,255,0.05)',
                        paddingBottom: 8,
                        paddingTop: 8,
                        height: 64,
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="path"
                    options={{
                        title: 'Path',
                        tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="dahlia"
                    options={{
                        title: 'Dahlia',
                        tabBarIcon: ({ color, size }) => (
                            <LogoIcon width={size} height={size} fill={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="explore"
                    options={{
                        title: 'Explore',
                        tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                    }}
                />
            </Tabs>
        </ThemeProvider>
    );
}
