import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface OnboardingSlideProps {
    title: string;
    subtitle: string;
    image?: any; // require path or uri
}

export const OnboardingSlide = ({ title, subtitle, image }: OnboardingSlideProps) => {
    return (
        <View style={styles.container}>
            {/* Placeholder or actual image */}
            <View style={styles.imageContainer}>
                {image ? (
                    <Image source={image} style={styles.image} resizeMode="contain" />
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    imageContainer: {
        flex: 0.6,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: 250,
        height: 250,
        backgroundColor: colors.surface,
        borderRadius: 20,
    },
    textContainer: {
        flex: 0.4,
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 32,
    },
    subtitle: {
        fontSize: typography.sizes.md,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
});
