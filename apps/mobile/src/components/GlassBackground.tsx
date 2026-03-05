import { View, StyleSheet } from 'react-native';
import { AnimatedGradient } from './AnimatedGradient';

const COLORS: [string, string, string] = ['#750080', '#2b6e6e', '#0e0e0e'];

interface GlassBackgroundProps {
    children: React.ReactNode;
    locations?: readonly [number, number, ...number[]];
}

export function GlassBackground({
    children,
    locations = [0.15, 0.5, 0.85] // Default wide dark center
}: GlassBackgroundProps) {
    return (
        <View style={styles.container}>
            {/* Dark base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0e0e0e' }]} />

            <AnimatedGradient
                colors={COLORS}
                locations={locations}
                style={StyleSheet.absoluteFill}
            />

            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0e0e0e',
    },
});
