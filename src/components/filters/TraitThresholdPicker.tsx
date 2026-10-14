import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';

interface Props {
  label: string;
  currentValue: number | null;
  onSelect: (value: number | null) => void;
}

export const TraitThresholdPicker: React.FC<Props> = ({ label, currentValue, onSelect }) => {
  const { colors } = useTheme();

  const options: Array<{ label: string; value: number | null }> = [
    { label: 'Any', value: null },
    { label: '≥ 2', value: 2 },
    { label: '≥ 3', value: 3 },
    { label: '≥ 4', value: 4 },
    { label: '5', value: 5 },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.buttonRow}>
        {options.map((opt) => {
          const isSelected = currentValue === opt.value;
          return (
            <TouchableOpacity
              key={`${label}-${opt.label}`}
              style={[
                styles.button,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${opt.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isSelected ? colors.textInverse : colors.textPrimary },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginRight: spacing.sm,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.captionBold,
  },
});
