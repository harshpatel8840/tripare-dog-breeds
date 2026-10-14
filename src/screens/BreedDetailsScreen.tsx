import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useBreedDetails } from '../hooks/useBreedDetails';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { borderRadius, spacing } from '../theme/spacing';
import { Badge } from '../components/common/Badge';
import { TraitScaleCard } from '../components/traits/TraitScaleCard';
import { TemperamentTagList } from '../components/traits/TemperamentTagList';
import { GalleryViewer } from '../components/gallery/GalleryViewer';
import { formatRange, formatStringList } from '../utils/formatting';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

type TabType = 'overview' | 'traits' | 'gallery';

export const BreedDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'BreedDetails'>>();
  const { breedId, breedName } = route.params;

  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { breed, isLoading, isRefreshing } = useBreedDetails(breedId);

  if (isLoading && !breed) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{breedName}</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'traits', label: 'Traits', icon: '📊' },
    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back to breed list"
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {breed?.name || breedName}
        </Text>
        {isRefreshing ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.headerSpinner} />
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Detail Tab Selector */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle },
        ]}
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                isSelected && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
              ]}
              onPress={() => setActiveTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: isSelected ? colors.primary : colors.textSecondary },
                  isSelected && typography.bodyBold,
                ]}
              >
                {tab.icon} {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content wrapped in Error Boundary */}
      <ErrorBoundary fallbackTitle="Could not display breed details">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <View testID="overview-tab-content">
              {/* Group & Badges */}
              <View style={styles.badgeRow}>
                {breed?.groupName && (
                  <Badge label={breed.groupName} variant="primary" style={styles.badge} />
                )}
                {breed?.sizeBand && (
                  <Badge label={`Size: ${breed.sizeBand}`} variant="neutral" style={styles.badge} />
                )}
                {breed?.hypoallergenic && (
                  <Badge label="Hypoallergenic" variant="success" style={styles.badge} />
                )}
              </View>

              {/* Description */}
              {breed?.description && (
                <View
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    About the Breed
                  </Text>
                  <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                    {breed.description}
                  </Text>
                </View>
              )}

              {/* Physical Specifications */}
              <View
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Physical Characteristics
                </Text>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Life Expectancy:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {formatRange(breed?.life, 'years')}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Male Weight:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {formatRange(breed?.maleWeight, 'kg')}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Female Weight:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {formatRange(breed?.femaleWeight, 'kg')}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Male Height:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {formatRange(breed?.maleHeight, 'cm')}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Female Height:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {formatRange(breed?.femaleHeight, 'cm')}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Coat Type:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {breed?.coat?.type || 'Not provided'}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Coat Length:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {breed?.coat?.length || 'Not provided'}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Coat Colors:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {formatStringList(breed?.coat?.colors)}
                  </Text>
                </View>
              </View>

              {/* Origin & Lineage */}
              <View
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Origin & Lineage
                </Text>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Country:</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {breed?.origin?.country || 'Not provided'}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Region:</Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {breed?.origin?.region || 'Not provided'}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Historical Era:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {breed?.origin?.era || 'Not provided'}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Other Names:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {formatStringList(breed?.otherNames)}
                  </Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                    Recognized Clubs:
                  </Text>
                  <Text style={[styles.specValue, { color: colors.textPrimary }]}>
                    {formatStringList(breed?.recognizedBy)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: TRAITS */}
          {activeTab === 'traits' && (
            <View testID="traits-tab-content">
              <TemperamentTagList temperaments={breed?.traits?.temperament} />
              <TraitScaleCard traits={breed?.traits} />
            </View>
          )}

          {/* TAB 3: GALLERY */}
          {activeTab === 'gallery' && (
            <View testID="gallery-tab-content">
              <GalleryViewer images={breed?.images} breedName={breed?.name || breedName} />
            </View>
          )}
        </ScrollView>
      </ErrorBoundary>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: spacing.sm,
  },
  backBtnText: {
    ...typography.button,
  },
  headerTitle: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  headerSpinner: {
    width: 44,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    ...typography.body,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  badge: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  descriptionText: {
    ...typography.body,
    lineHeight: 22,
  },
  specRow: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    alignItems: 'flex-start',
  },
  specLabel: {
    ...typography.bodyBold,
    width: 140,
  },
  specValue: {
    ...typography.body,
    flex: 1,
  },
});
