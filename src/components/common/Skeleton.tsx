import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { borderRadius, spacing } from '../../theme/spacing';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.sm,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.skeleton,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    />
  );
};

export const BreedCardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton width={64} height={64} borderRadius={borderRadius.md} />
      <View style={styles.cardContent}>
        <Skeleton width="60%" height={18} style={{ marginBottom: spacing.xs }} />
        <Skeleton width="40%" height={14} style={{ marginBottom: spacing.sm }} />
        <View style={styles.badgeRow}>
          <Skeleton
            width={50}
            height={20}
            borderRadius={borderRadius.round}
            style={{ marginRight: spacing.xs }}
          />
          <Skeleton width={60} height={20} borderRadius={borderRadius.round} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
  },
});
