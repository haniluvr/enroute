import { View, ViewProps, StyleSheet } from 'react-native';
import tw from '@/lib/tailwind';

interface GlassCardProps extends ViewProps {
    intensity?: number;
}

export function GlassCard({ children, style, ...props }: GlassCardProps) {
    return (
        <View
            style={[styles.glassContainer, tw`bg-card/40 border border-white/10 rounded-3xl overflow-hidden shadow-xl`, style]}
            {...props}
        >
            <View style={tw`p-5`}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    glassContainer: {
        // Backdrop blur support across devices when NativeWind fails to render blur properly
        // @ts-ignore - Valid on web/expo blur polyfills
        backdropFilter: 'blur(20px)',
    }
});
