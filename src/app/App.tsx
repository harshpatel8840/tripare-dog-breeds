import React from 'react';
import { AppProviders } from './providers/AppProviders';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application encountered a critical error">
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </ErrorBoundary>
  );
}
