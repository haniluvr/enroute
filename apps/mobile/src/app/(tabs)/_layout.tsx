import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

export default function TabLayout() {
    const colorScheme = useColorScheme();

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
