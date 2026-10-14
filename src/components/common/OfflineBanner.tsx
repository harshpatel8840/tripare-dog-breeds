import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { useNetwork } from '../../hooks/useNetwork';
import { useSync } from '../../hooks/useSync';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatTimeAgo } from '../../utils/formatting';

export const OfflineBanner: React.FC = () => {
  const { colors } = useTheme();
  const isOnline = useNetwork();
  const { metadata, isSyncing, progress, syncNow } = useSync();

  const hasCache = metadata.persistedRecords > 0;
  const lastSyncedText = formatTimeAgo(metadata.lastSuccessfulAt);

  // 1. First sync required (no cache at all)
  if (!hasCache && !isSyncing) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.warningLight }]}
        accessibilityRole="alert"
      >
        <Text style={[styles.text, { color: colors.warning }]}>
          ⚠️ Initial catalogue download required.
        </Text>
        {isOnline && (
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.warning }]}
            onPress={() => syncNow()}
            activeOpacity={0.8}
            accessibilityLabel="Download catalogue"
          >
            <Text style={[styles.retryText, { color: colors.textInverse }]}>Download</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 2. Synchronizing
  if (isSyncing) {
    const progressText = progress
      ? `Page ${progress.currentPage} of ${progress.totalPages} (${progress.fetchedBreeds} breeds)`
      : 'Updating catalogue...';
    return (
      <View
        style={[styles.container, { backgroundColor: colors.infoLight }]}
        accessibilityRole="alert"
      >
        <ActivityIndicator size="small" color={colors.info} style={styles.spinner} />
        <Text style={[styles.text, { color: colors.info }]}>Synchronizing — {progressText}</Text>
      </View>
    );
  }

  // 3. Offline (with cached data)
  if (!isOnline) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.warningLight }]}
        accessibilityRole="alert"
      >
        <Text style={[styles.text, { color: colors.warning }]}>
          📶 Offline — showing saved data (Last synced: {lastSyncedText})
        </Text>
      </View>
    );
  }

  // 4. Partial sync or Sync Failed
  if (metadata.syncStatus === 'partial' || metadata.syncStatus === 'failed') {
    const isPartial = metadata.syncStatus === 'partial';
    return (
      <View
        style={[styles.container, { backgroundColor: colors.dangerLight }]}
        accessibilityRole="alert"
      >
        <Text style={[styles.text, { color: colors.danger }]} numberOfLines={1}>
          {isPartial
            ? '⚠️ Partial sync — some updates failed'
            : '⚠️ Sync failed — using cached data'}
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.danger }]}
          onPress={() => syncNow()}
          activeOpacity={0.8}
          accessibilityLabel="Retry synchronization"
        >
          <Text style={[styles.retryText, { color: colors.textInverse }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 5. Up to date (Subtle status bar)
  return (
    <View
      style={[styles.subtleContainer, { backgroundColor: colors.surfaceSubtle }]}
      accessibilityRole="text"
    >
      <Text style={[styles.subtleText, { color: colors.textMuted }]}>
        ✓ Up to date • Last synced {lastSyncedText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  subtleContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.captionBold,
    flex: 1,
  },
  subtleText: {
    ...typography.caption,
  },
  spinner: {
    marginRight: spacing.sm,
  },
  retryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  retryText: {
    ...typography.captionBold,
  },
});
