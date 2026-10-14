import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';

interface Props {
  title: string;
  count: number;
}

export const BreedSectionHeader: React.FC<Props> = ({ title, count }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderBottomColor: colors.borderSubtle },
      ]}
      accessibilityRole="header"
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <View style={[styles.countBadge, { backgroundColor: colors.surfaceSubtle }]}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>{count}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.h3,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.round,
  },
  countText: {
    ...typography.captionBold,
  },
});
