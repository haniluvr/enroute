import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface GlassButtonProps {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    fullWidth?: boolean;
}

export function GlassButton({
    title,
    onPress,
    isLoading = false,
    variant = 'primary',
    fullWidth = true
}: GlassButtonProps) {

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return 'bg-accent-violet/80 border-accent-violet/40 text-white';
            case 'secondary':
                return 'bg-white/10 border-white/20 text-white';
            case 'danger':
                return 'bg-accent-pink/80 border-accent-pink/40 text-white';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isLoading}
            activeOpacity={0.7}
            className={`
        ${fullWidth ? 'w-full' : 'self-start'} 
        rounded-2xl py-4 px-6 border backdrop-blur-md 
        items-center justify-center flex-row shadow-lg
        ${getVariantStyles()}
      `}
        >
            {isLoading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text className="text-white text-lg font-inter-semibold">
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}
