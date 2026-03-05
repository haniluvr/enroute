import { View, StyleSheet } from 'react-native';
import { AnimatedGradient } from './AnimatedGradient';

const COLORS: [string, string, string, string] = ['#6d3659', '#af88ad', '#2b4e50', '#111111'];

interface GlassBackgroundProps {
    children: React.ReactNode;
    locations?: readonly [number, number, ...number[]];
}

export function GlassBackground({
    children,
    locations = [0.0, 0.2, 0.55, 0.9] // 4-color: lilac → rose → teal → dark
}: GlassBackgroundProps) {
    return (
        <View style={styles.container}>
            {/* Dark base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111111' }]} />

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
        backgroundColor: '#111111',
    },
});
