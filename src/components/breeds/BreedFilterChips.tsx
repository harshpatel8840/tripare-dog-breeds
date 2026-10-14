import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFilterStore } from '../../store/filterStore';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';
import { BreedGroup } from '../../types/domain';

interface Props {
  groups: BreedGroup[];
  onOpenFilterModal: () => void;
}

export const BreedFilterChips: React.FC<Props> = ({ groups, onOpenFilterModal }) => {
  const { colors } = useTheme();
  const groupIds = useFilterStore((s) => s.groupIds);
  const sizeBands = useFilterStore((s) => s.sizeBands);
  const coatLengths = useFilterStore((s) => s.coatLengths);
  const hypoallergenic = useFilterStore((s) => s.hypoallergenic);
  const minChildrenScore = useFilterStore((s) => s.minChildrenScore);
  const minDogsScore = useFilterStore((s) => s.minDogsScore);
  const minStrangersScore = useFilterStore((s) => s.minStrangersScore);

  const toggleGroupId = useFilterStore((s) => s.toggleGroupId);
  const toggleSizeBand = useFilterStore((s) => s.toggleSizeBand);
  const toggleCoatLength = useFilterStore((s) => s.toggleCoatLength);
  const setHypoallergenic = useFilterStore((s) => s.setHypoallergenic);
  const setMinChildrenScore = useFilterStore((s) => s.setMinChildrenScore);
  const setMinDogsScore = useFilterStore((s) => s.setMinDogsScore);
  const setMinStrangersScore = useFilterStore((s) => s.setMinStrangersScore);
  const resetFilters = useFilterStore((s) => s.resetFilters);
  const hasActive = useFilterStore((s) => s.hasActiveFilters());
  const activeCount = useFilterStore((s) => s.getActiveFilterCount());

  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Main Filter Button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: hasActive ? colors.primary : colors.surface,
              borderColor: hasActive ? colors.primary : colors.border,
            },
          ]}
          onPress={onOpenFilterModal}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Open filters. ${activeCount} active filters.`}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: hasActive ? colors.textInverse : colors.textPrimary },
            ]}
          >
            ⚙️ Filters {hasActive ? `(${activeCount})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Clear All Chip */}
        {hasActive && (
          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: colors.dangerLight, borderColor: colors.danger },
            ]}
            onPress={resetFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <Text style={[styles.chipText, { color: colors.danger }]}>Clear All ✕</Text>
          </TouchableOpacity>
        )}

        {/* Hypoallergenic Chip */}
        {hypoallergenic !== 'all' && (
          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
            onPress={() => setHypoallergenic('all')}
            accessibilityRole="button"
            accessibilityLabel={`Remove hypoallergenic ${hypoallergenic} filter`}
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>
              Hypo: {hypoallergenic} ✕
            </Text>
          </TouchableOpacity>
        )}

        {/* Size Band Chips */}
        {sizeBands.map((size) => (
          <TouchableOpacity
            key={`size-${size}`}
            style={[
              styles.chip,
              { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
            onPress={() => toggleSizeBand(size)}
            accessibilityRole="button"
            accessibilityLabel={`Remove size ${size} filter`}
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>Size: {size} ✕</Text>
          </TouchableOpacity>
        ))}

        {/* Coat Length Chips */}
        {coatLengths.map((coat) => (
          <TouchableOpacity
            key={`coat-${coat}`}
            style={[
              styles.chip,
              { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
            onPress={() => toggleCoatLength(coat)}
            accessibilityRole="button"
            accessibilityLabel={`Remove coat ${coat} filter`}
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>Coat: {coat} ✕</Text>
          </TouchableOpacity>
        ))}

        {/* Group Chips */}
        {groupIds.map((gid) => {
          const groupName = groupMap.get(gid) || 'Group';
          return (
            <TouchableOpacity
              key={`group-${gid}`}
              style={[
                styles.chip,
                { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
              onPress={() => toggleGroupId(gid)}
              accessibilityRole="button"
              accessibilityLabel={`Remove group ${groupName} filter`}
            >
              <Text style={[styles.chipText, { color: colors.primary }]}>{groupName} ✕</Text>
            </TouchableOpacity>
          );
        })}

        {/* Trait Chips */}
        {minChildrenScore !== null && (
          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
            onPress={() => setMinChildrenScore(null)}
            accessibilityRole="button"
            accessibilityLabel="Remove good with children filter"
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>
              Kids ≥ {minChildrenScore} ✕
            </Text>
          </TouchableOpacity>
        )}

        {minDogsScore !== null && (
          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
            onPress={() => setMinDogsScore(null)}
            accessibilityRole="button"
            accessibilityLabel="Remove good with dogs filter"
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>
              Dogs ≥ {minDogsScore} ✕
            </Text>
          </TouchableOpacity>
        )}

        {minStrangersScore !== null && (
          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
            onPress={() => setMinStrangersScore(null)}
            accessibilityRole="button"
            accessibilityLabel="Remove good with strangers filter"
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>
              Strangers ≥ {minStrangersScore} ✕
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: spacing.xs,
  },
  container: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  filterButtonText: {
    ...typography.captionBold,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  chipText: {
    ...typography.captionBold,
    textTransform: 'capitalize',
  },
});
