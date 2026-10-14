import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';

interface Props {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export const MultiSelectPill: React.FC<Props> = ({
  label,
  isSelected,
  onPress,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.pill,
        {
          backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text style={[styles.text, { color: isSelected ? colors.textInverse : colors.textPrimary }]}>
        {isSelected ? `✓ ${label}` : label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.captionBold,
    textTransform: 'capitalize',
  },
});
