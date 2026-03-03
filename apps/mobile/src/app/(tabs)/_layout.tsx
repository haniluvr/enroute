import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Compass, User } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#00e5ff',
                tabBarInactiveTintColor: '#rgba(255,255,255,0.5)',
                tabBarStyle: Platform.OS === 'ios' ? styles.iosTabBar : styles.androidTabBar,
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#14142B' }]} />
                    )
                ),
            }}>

            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="discover"
                options={{
                    title: 'Discover',
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
    );
}

const styles = StyleSheet.create({
    iosTabBar: {
        position: 'absolute',
        borderTopWidth: 0,
        elevation: 0,
        height: 90,
        backgroundColor: 'transparent',
    },
    androidTabBar: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        height: 70,
        elevation: 0,
        paddingBottom: 10,
        backgroundColor: '#14142B',
    }
});
