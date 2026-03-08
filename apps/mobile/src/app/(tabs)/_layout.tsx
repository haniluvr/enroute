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
        <ThemeProvider value={DarkTheme}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#ffffff',
                    tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
                    tabBarShowLabel: true,
                    tabBarActiveBackgroundColor: 'transparent',
                    tabBarItemStyle: {
                        paddingVertical: 10,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        marginTop: 4,
                        fontWeight: '500',
                    },
                    tabBarStyle: {
                        position: 'absolute',
                        backgroundColor: 'transparent',
                        borderTopWidth: 0,
                        borderTopColor: 'transparent',
                        height: 70,
                        paddingBottom: 10,
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: 0,
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                    }}
                />
                <Tabs.Screen
                    name="path"
                    options={{
                        title: 'Path',
                        tabBarIcon: ({ color }) => <Map color={color} size={24} />,
                    }}
                />
                <Tabs.Screen
                    name="dahlia"
                    options={{
                        title: 'Dahlia',
                        tabBarIcon: ({ color }) => (
                            <LogoIcon width={24} height={24} fill={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="explore"
                    options={{
                        title: 'Explore',
                        tabBarIcon: ({ color }) => <Compass color={color} size={24} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color }) => <User color={color} size={24} />,
                    }}
                />
            </Tabs>
        </ThemeProvider>
    );
}
