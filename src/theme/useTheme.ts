import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';
import { useThemeStore } from '../store/themeStore';

export interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  mode: 'system' | 'light' | 'dark';
  setMode: (mode: 'system' | 'light' | 'dark') => void;
}

export function useTheme(): ThemeContextValue {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors,
    mode,
    setMode,
  };
}
