import React, { ReactNode, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { databaseClient } from '../../services/database/sqliteClient';
import { breedRepository } from '../../services/repositories/breedRepository';
import { syncCoordinator } from '../../services/sync/syncCoordinator';
import { networkMonitor } from '../../services/network/networkMonitor';
import { useTheme } from '../../theme/useTheme';
import { logger } from '../../utils/logger';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

interface Props {
  children: ReactNode;
}

export const AppProviders: React.FC<Props> = ({ children }) => {
  const { colors, isDark } = useTheme();
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initApp() {
      try {
        // Step 1: Initialize database schema
        await databaseClient.initialize();

        // Step 2: Check cached breeds count & sync status
        const cachedCount = await breedRepository.getBreedCount();
        const meta = await breedRepository.getSyncMetadata();
        logger.info(
          `[AppProviders] DB ready. Cached breeds: ${cachedCount}. Sync status: ${meta.syncStatus}`,
        );

        if (isMounted) setIsDbReady(true);

        // Step 3: Trigger background sync if empty or stale
        const isOnline = await networkMonitor.checkConnectivity();
        const ONE_HOUR = 60 * 60 * 1000;
        const isStale =
          !meta.lastSuccessfulAt ||
          Date.now() - meta.lastSuccessfulAt > ONE_HOUR ||
          cachedCount === 0;

        if (isOnline && isStale) {
          logger.info('[AppProviders] Starting background catalogue sync...');
          syncCoordinator.syncAll({ isBackground: true }).catch((syncErr) => {
            logger.warn('[AppProviders] Initial background sync error:', syncErr);
          });
        }
      } catch (err) {
        logger.error('[AppProviders] App initialization failed:', err);
        if (isMounted) setIsDbReady(true); // Allow app to open with error boundary
      }
    }

    initApp();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isDbReady) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '900' as const },
    },
  };

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer theme={navigationTheme}>{children}</NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
