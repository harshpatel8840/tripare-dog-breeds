import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';

interface ScaleBarProps {
  label: string;
  value?: number | null;
  maxScore?: number;
  unit?: string;
  interpretation?: string;
  accessibilityHint?: string;
}

export const ScaleBar: React.FC<ScaleBarProps> = ({
  label,
  value,
  maxScore = 5,
  unit,
  interpretation,
  accessibilityHint,
}) => {
  const { colors } = useTheme();

  const isProvided = value !== undefined && value !== null && !isNaN(value) && value > 0;
  const percentage = isProvided ? Math.min(100, Math.max(0, (value / maxScore) * 100)) : 0;

  const displayValue = isProvided
    ? unit
      ? `${value} ${unit}`
      : `${value} / ${maxScore}`
    : 'Not provided';

  const accessibleLabel = `${label}: ${displayValue}${interpretation ? `, ${interpretation}` : ''}`;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibleLabel}
      accessibilityHint={accessibilityHint}
      accessibilityValue={{
        min: 0,
        max: maxScore,
        now: isProvided ? value : 0,
      }}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        <View style={styles.valueContainer}>
          <Text
            style={[
              styles.valueText,
              { color: isProvided ? colors.textPrimary : colors.textMuted },
            ]}
          >
            {displayValue}
          </Text>
          {interpretation && isProvided && (
            <Text style={[styles.interpretationText, { color: colors.primary }]}>
              {' '}
              ({interpretation})
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: colors.surfaceSubtle }]}>
        {isProvided ? (
          <View
            style={[
              styles.fill,
              {
                width: `${percentage}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        ) : (
          <View style={[styles.naFill, { backgroundColor: colors.border }]} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.bodyBold,
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    ...typography.captionBold,
  },
  interpretationText: {
    ...typography.captionBold,
  },
  track: {
    height: 8,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.round,
  },
  naFill: {
    height: '100%',
    width: '100%',
    opacity: 0.3,
  },
});
