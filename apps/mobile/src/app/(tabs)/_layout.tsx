import tw from '@/lib/tailwind';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Compass, User } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: '#5900ff',
                tabBarInactiveTintColor: '#888',
                tabBarStyle: {
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 24 : 16,
                    left: 20,
                    right: 20,
                    elevation: 0,
                    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(20,20,43,0.95)',
                    borderRadius: 30,
                    height: 64,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
                    paddingTop: 8
                },
                tabBarBackground: () =>
                    Platform.OS === 'ios' ? (
                        <BlurView
                            tint="dark"
                            intensity={80}
                            style={tw`absolute inset-0 rounded-[30px] overflow-hidden`}
                        />
                    ) : null,
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
                name="discover"
                options={{
                    title: 'Swipe',
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
    );
}
