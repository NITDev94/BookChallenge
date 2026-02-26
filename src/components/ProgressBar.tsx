import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ProgressBarProps {
    progress: number; // 0 to 100
    style?: ViewStyle;
    color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, style, color = '#d97706' }) => {
    return (
        <View style={[styles.container, style]}>
            <View
                style={[
                    styles.fill,
                    {
                        width: `${Math.min(100, Math.max(0, progress))}%`,
                        backgroundColor: color
                    }
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#e7e5e4', // stone-200
        borderRadius: 999,
        height: 10,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 999,
    },
});
