import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { BreedListItem } from '../../types/domain';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing, layout } from '../../theme/spacing';
import { Badge } from '../common/Badge';

interface Props {
  item: BreedListItem;
  onPress: (item: BreedListItem) => void;
}

export const BreedListItemComponent: React.FC<Props> = memo(
  ({ item, onPress }) => {
    const { colors } = useTheme();

    const weightSummary =
      item.weightMin && item.weightMax
        ? `${item.weightMin}–${item.weightMax} kg`
        : item.weightMin
          ? `${item.weightMin} kg`
          : null;

    const lifeSummary = item.lifeMin && item.lifeMax ? `${item.lifeMin}–${item.lifeMax} yrs` : null;

    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.groupName}, ${item.sizeBand} size${
          item.hypoallergenic ? ', hypoallergenic' : ''
        }`}
        accessibilityHint="Navigates to breed details"
      >
        <Image
          source={{
            uri: item.thumbUrl || 'https://images.dogapi.dog/placeholder.jpg',
          }}
          style={[styles.thumbnail, { backgroundColor: colors.surfaceSubtle }]}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
          accessibilityLabel={`${item.name} thumbnail`}
        />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.hypoallergenic && <Badge label="Hypoallergenic" variant="success" />}
          </View>

          <Text style={[styles.groupName, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.groupName}
          </Text>

          <View style={styles.badgeRow}>
            <Badge label={item.sizeBand} variant="neutral" style={styles.badge} />
            {item.coatLength && (
              <Badge label={item.coatLength} variant="neutral" style={styles.badge} />
            )}
            {weightSummary && (
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{weightSummary}</Text>
            )}
            {lifeSummary && (
              <Text style={[styles.metaText, { color: colors.textMuted }]}>• {lifeSummary}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.name === next.item.name &&
    prev.item.thumbUrl === next.item.thumbUrl &&
    prev.item.hypoallergenic === next.item.hypoallergenic &&
    prev.item.sizeBand === next.item.sizeBand,
);

BreedListItemComponent.displayName = 'BreedListItemComponent';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  thumbnail: {
    width: layout.listImageSize,
    height: layout.listImageSize,
    borderRadius: borderRadius.sm,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  name: {
    ...typography.h3,
    flex: 1,
    marginRight: spacing.sm,
  },
  groupName: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    marginRight: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    marginRight: spacing.xs,
  },
});
