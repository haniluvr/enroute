import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function GlassBackground({ children }: { children: React.ReactNode }) {
    return (
        <View style={styles.container}>
            {/* Deep Dark Base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0A1A' }]} />

            {/* Neon Orbs in Background */}
            <View style={[styles.orb, styles.orb1]} />
            <View style={[styles.orb, styles.orb2]} />
            <View style={[styles.orb, styles.orb3]} />

            {/* Overlay to blur the orbs */}
            <LinearGradient
                colors={['rgba(10,10,26,0.3)', 'rgba(10,10,26,0.9)']}
                style={StyleSheet.absoluteFill}
            />

            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    orb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.15,
    },
    orb1: {
        top: -100,
        left: -100,
        backgroundColor: '#5900ff', // Electric Violet
    },
    orb2: {
        top: 200,
        right: -150,
        backgroundColor: '#ff007f', // Neon Pink
    },
    orb3: {
        bottom: -100,
        left: 50,
        backgroundColor: '#00e5ff', // Cyber Cyan
    }
});
