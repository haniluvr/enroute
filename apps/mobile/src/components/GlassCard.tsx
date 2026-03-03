import { View, ViewProps, StyleSheet } from 'react-native';

interface GlassCardProps extends ViewProps {
    intensity?: number;
}

export function GlassCard({ children, style, ...props }: GlassCardProps) {
    return (
        <View
            style={[styles.glassContainer, style]}
            className="bg-card/40 border border-white/10 rounded-3xl overflow-hidden shadow-xl"
            {...props}
        >
            <View className="p-5">
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    glassContainer: {
        // Backdrop blur support across devices when NativeWind fails to render blur properly
        backdropFilter: 'blur(20px)',
    }
});
