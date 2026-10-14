import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'neutral';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style, textStyle }) => {
  const { colors } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primaryLight, text: colors.primary };
      case 'success':
        return { bg: colors.successLight, text: colors.success };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'info':
        return { bg: colors.infoLight, text: colors.info };
      case 'neutral':
      default:
        return { bg: colors.badgeBg, text: colors.badgeText };
    }
  };

  const { bg, text } = getVariantStyles();

  return (
    <View
      style={[styles.badge, { backgroundColor: bg }, style]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text style={[styles.text, { color: text }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.captionBold,
    textTransform: 'capitalize',
  },
});
