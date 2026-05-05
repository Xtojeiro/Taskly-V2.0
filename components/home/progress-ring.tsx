import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, type TextStyle, type ViewStyle } from 'react-native';

import { useTasklyTheme } from '@/hooks/use-taskly-theme';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 12,
  color,
  backgroundColor,
  showPercentage = true,
  label,
}: ProgressRingProps) {
  const { colors } = useTasklyTheme();
  const [animatedProgress] = useState(new Animated.Value(0));
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const ringColor = color ?? colors.blue;
  const ringBackground = backgroundColor ?? colors.line;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: clampedProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress, animatedProgress]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.svgContainer}>
        <View
          style={[
            styles.backgroundRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: ringBackground,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.progressRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: ringColor,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              transform: [
                {
                  rotate: animatedProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['-90deg', '270deg'],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
      <View style={styles.labelContainer}>
        {showPercentage && (
          <Text style={[styles.percentage, { color: colors.ink }]}>{Math.round(clampedProgress)}%</Text>
        )}
        {label && <Text style={[styles.label, { color: colors.slate }]}>{label}</Text>}
      </View>
    </View>
  );
}

const styles: {
  container: ViewStyle;
  svgContainer: ViewStyle;
  backgroundRing: ViewStyle;
  progressRing: ViewStyle;
  labelContainer: ViewStyle;
  percentage: TextStyle;
  label: TextStyle;
} = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    position: 'absolute',
  },
  backgroundRing: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: 32,
    fontWeight: '900',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});
