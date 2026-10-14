import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFilterStore } from '../store/filterStore';
import { useBreeds } from '../hooks/useBreeds';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { borderRadius, spacing } from '../theme/spacing';
import { COAT_LENGTH_OPTIONS, HYPOALLERGENIC_OPTIONS, SIZE_BAND_OPTIONS } from '../types/filters';
import { MultiSelectPill } from '../components/filters/MultiSelectPill';
import { TraitThresholdPicker } from '../components/filters/TraitThresholdPicker';

export const FilterScreen: React.FC = () => {
  const navigation = useNavigation();
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

  const { groups, totalMatchingBreeds } = useBreeds();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Filter Breeds</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close filter screen"
        >
          <Text style={[styles.closeBtnText, { color: colors.primary }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Breed Groups */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Breed Group ({groups.length})
          </Text>
          <View style={styles.pillsWrap}>
            {groups.map((g) => (
              <MultiSelectPill
                key={g.id}
                label={g.name}
                isSelected={groupIds.includes(g.id)}
                onPress={() => toggleGroupId(g.id)}
              />
            ))}
          </View>
        </View>

        {/* 2. Size Band */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Size Category</Text>
          <View style={styles.pillsWrap}>
            {SIZE_BAND_OPTIONS.map((opt) => (
              <MultiSelectPill
                key={opt.id}
                label={opt.label}
                isSelected={sizeBands.includes(opt.id)}
                onPress={() => toggleSizeBand(opt.id)}
              />
            ))}
          </View>
        </View>

        {/* 3. Coat Length */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Coat Length & Type
          </Text>
          <View style={styles.pillsWrap}>
            {COAT_LENGTH_OPTIONS.map((opt) => (
              <MultiSelectPill
                key={opt.id}
                label={opt.label}
                isSelected={coatLengths.includes(opt.id)}
                onPress={() => toggleCoatLength(opt.id)}
              />
            ))}
          </View>
        </View>

        {/* 4. Hypoallergenic */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hypoallergenic</Text>
          <View style={styles.pillsWrap}>
            {HYPOALLERGENIC_OPTIONS.map((opt) => (
              <MultiSelectPill
                key={opt.id}
                label={opt.label}
                isSelected={hypoallergenic === opt.id}
                onPress={() => setHypoallergenic(opt.id)}
              />
            ))}
          </View>
        </View>

        {/* 5. Trait Thresholds */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Trait Thresholds (Minimum Score)
          </Text>
          <TraitThresholdPicker
            label="Good with Children"
            currentValue={minChildrenScore}
            onSelect={setMinChildrenScore}
          />
          <TraitThresholdPicker
            label="Good with Other Dogs"
            currentValue={minDogsScore}
            onSelect={setMinDogsScore}
          />
          <TraitThresholdPicker
            label="Good with Strangers"
            currentValue={minStrangersScore}
            onSelect={setMinStrangersScore}
          />
        </View>
      </ScrollView>

      {/* Footer bar with live count & clear */}
      <View
        style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
      >
        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: colors.border }]}
          onPress={resetFilters}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Reset all filters"
        >
          <Text style={[styles.resetBtnText, { color: colors.danger }]}>Clear All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Apply filters, ${totalMatchingBreeds} breeds match`}
        >
          <Text style={[styles.applyBtnText, { color: colors.textInverse }]}>
            Show {totalMatchingBreeds} Breeds
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.h2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    ...typography.button,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  resetBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  resetBtnText: {
    ...typography.button,
  },
  applyBtn: {
    flex: 1,
    marginLeft: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  applyBtnText: {
    ...typography.button,
  },
});
