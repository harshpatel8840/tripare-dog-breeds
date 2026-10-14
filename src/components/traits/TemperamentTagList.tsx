import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';
import { Badge } from '../common/Badge';

interface Props {
  temperaments?: string[];
}

export const TemperamentTagList: React.FC<Props> = ({ temperaments }) => {
  const { colors } = useTheme();

  if (!temperaments || temperaments.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Temperament</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Not provided</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Temperament</Text>
      <View style={styles.tagGrid}>
        {temperaments.map((tag) => (
          <Badge key={tag} label={tag} variant="primary" style={styles.tag} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    fontStyle: 'italic',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
