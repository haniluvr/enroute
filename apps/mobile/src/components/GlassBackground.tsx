import { View, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

// A single large soft blob with a BlurView on top — simulates the Bloom style
function GlowBlob({ color, style }: { color: string; style?: object }) {
    return (
        <View style={[styles.blobWrapper, style]}>
            {/* Dense center */}
            <View style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: color, opacity: 0.6, position: 'absolute' }} />
            {/* Soft mid */}
            <View style={{ width: 380, height: 380, borderRadius: 190, backgroundColor: color, opacity: 0.35, position: 'absolute' }} />
            {/* Wide outer feather */}
            <View style={{ width: 540, height: 540, borderRadius: 270, backgroundColor: color, opacity: 0.18, position: 'absolute' }} />
            {/* Massive far feather */}
            <View style={{ width: 700, height: 700, borderRadius: 350, backgroundColor: color, opacity: 0.07, position: 'absolute' }} />

            {/* Local blur on this blob only */}
            <BlurView
                intensity={100}
                tint="dark"
                style={[StyleSheet.absoluteFill, { borderRadius: 350 }]}
            />
        </View>
    );
}

export function GlassBackground({ children }: { children: React.ReactNode }) {
    return (
        <View style={styles.container}>
            {/* Charcoal black base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0e0e0e' }]} />
            
            {/* Blob 2 — Deep Teal top-right */}
            <GlowBlob
                color="#FCFCFC"
                style={{ top: -300, right: -(width * 0.25) }}
            />

            {/* Blob 1 — Vibrant Purple top-left */}
            <GlowBlob
                color="#111111"
                style={{ top: -10, left: -(width * 0.50) }}
            />

            {/* Blob 2 — Deep Teal top-right */}
            <GlowBlob
                color="#750080"
                style={{ top: -550, right: -(width * 0.25) }}
            />

            {/* Blob 1 — Vibrant Purple top-left */}
            <GlowBlob
                color="#ff00ff"
                style={{ top: -280, left: -(width * 0.25) }}
            />

            {/* Blob 2 — Deep Teal top-right */}
            <GlowBlob
                color="#2b6e6e"
                style={{ top: -220, right: -(width * 0.15) }}
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
    blobWrapper: {
        position: 'absolute',
        width: 700,
        height: 1400,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
