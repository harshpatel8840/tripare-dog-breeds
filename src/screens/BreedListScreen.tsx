import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useBreeds } from '../hooks/useBreeds';
import { useFilterStore } from '../store/filterStore';
import { useSync } from '../hooks/useSync';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { borderRadius, spacing } from '../theme/spacing';
import { BreedListItem, BreedSection } from '../types/domain';
import { BreedListItemComponent } from '../components/breeds/BreedListItemComponent';
import { BreedSectionHeader } from '../components/breeds/BreedSectionHeader';
import { BreedFilterChips } from '../components/breeds/BreedFilterChips';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { BreedCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export const BreedListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDark, mode, setMode } = useTheme();
  const { sections, totalMatchingBreeds, groups, isLoading, debouncedSearchQuery } = useBreeds();

  const searchQuery = useFilterStore((s) => s.searchQuery);
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery);
  const resetFilters = useFilterStore((s) => s.resetFilters);
  const hasActiveFilters = useFilterStore((s) => s.hasActiveFilters());

  const { isSyncing, syncNow } = useSync();

  const handleBreedPress = useCallback(
    (item: BreedListItem) => {
      navigation.navigate('BreedDetails', {
        breedId: item.id,
        breedName: item.name,
      });
    },
    [navigation],
  );

  const handleOpenFilters = useCallback(() => {
    navigation.navigate('FilterModal');
  }, [navigation]);

  const toggleThemeMode = useCallback(() => {
    if (mode === 'light') setMode('dark');
    else if (mode === 'dark') setMode('light');
    else setMode(isDark ? 'light' : 'dark');
  }, [mode, isDark, setMode]);

  const renderItem = useCallback(
    ({ item }: { item: BreedListItem }) => (
      <BreedListItemComponent item={item} onPress={handleBreedPress} />
    ),
    [handleBreedPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: BreedSection }) => (
      <BreedSectionHeader title={section.title} count={section.data.length} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: BreedListItem) => item.id, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* App Bar / Header */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle },
        ]}
      >
        <View>
          <Text style={[styles.appTitle, { color: colors.textPrimary }]}>Tripare Dog Breeds</Text>
          <Text style={[styles.catalogMeta, { color: colors.textSecondary }]}>
            {totalMatchingBreeds} breeds available
          </Text>
        </View>

        {/* Theme Toggle Button */}
        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: colors.surfaceSubtle }]}
          onPress={toggleThemeMode}
          accessibilityRole="button"
          accessibilityLabel={`Toggle theme mode. Current theme: ${isDark ? 'Dark' : 'Light'}`}
        >
          <Text style={styles.themeBtnText}>{isDark ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Offline & Sync Status Banner */}
      <OfflineBanner />

      {/* Search Input Bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search by breed or alternate names..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
          accessibilityLabel="Search breeds by name or alternate names"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchBtn}
            accessibilityLabel="Clear search query"
          >
            <Text style={[styles.clearSearchText, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips Bar */}
      <BreedFilterChips groups={groups} onOpenFilterModal={handleOpenFilters} />

      {/* Main List wrapped in Error Boundary */}
      <ErrorBoundary fallbackTitle="Could not load breed catalogue">
        {isLoading && sections.length === 0 ? (
          <View style={styles.loadingContainer}>
            <BreedCardSkeleton />
            <BreedCardSkeleton />
            <BreedCardSkeleton />
            <BreedCardSkeleton />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={
              sections.length === 0 ? styles.emptyListContent : styles.listContent
            }
            refreshControl={
              <RefreshControl
                refreshing={isSyncing}
                onRefresh={() => syncNow()}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon={debouncedSearchQuery || hasActiveFilters ? '🔍' : '🐕'}
                title={
                  debouncedSearchQuery || hasActiveFilters
                    ? 'No matching breeds'
                    : 'Catalogue is empty'
                }
                message={
                  debouncedSearchQuery || hasActiveFilters
                    ? 'No dog breeds match your search and filter criteria. Try broadening your filters.'
                    : 'Pull to refresh to download the latest dog breed catalogue.'
                }
                actionLabel={
                  debouncedSearchQuery || hasActiveFilters ? 'Reset All Filters' : 'Download Breeds'
                }
                onAction={debouncedSearchQuery || hasActiveFilters ? resetFilters : () => syncNow()}
              />
            }
          />
        )}
      </ErrorBoundary>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  appTitle: {
    ...typography.h1,
  },
  catalogMeta: {
    ...typography.caption,
  },
  themeBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.round,
  },
  themeBtnText: {
    fontSize: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    height: '100%',
  },
  clearSearchBtn: {
    padding: spacing.xs,
  },
  clearSearchText: {
    ...typography.captionBold,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingTop: spacing.md,
  },
});
