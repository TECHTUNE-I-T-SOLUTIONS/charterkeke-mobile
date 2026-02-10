/**
 * Theme definitions for light and dark modes
 * Light theme: Black text on white background
 * Dark theme: White text on black background
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Primary colors
  primary: string;
  secondary: string;
  accent: string;

  // Background
  background: string;
  surfaceLight: string;
  surfaceDark: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // Semantic
  success: string;
  error: string;
  warning: string;
  info: string;

  // Borders & Dividers
  border: string;
  divider: string;

  // Special
  placeholder: string;
  disabled: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // Primary colors - using black for primary in light mode
    primary: '#000000',
    secondary: '#333333',
    accent: '#FFFFFF',

    // Background
    background: '#FFFFFF',
    surfaceLight: '#F5F5F5',
    surfaceDark: '#EEEEEE',

    // Text
    textPrimary: '#000000',
    textSecondary: '#333333',
    textTertiary: '#666666',

    // Semantic
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',

    // Borders & Dividers
    border: '#CCCCCC',
    divider: '#EEEEEE',

    // Special
    placeholder: '#BDBDBD',
    disabled: '#F0F0F0',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // Primary colors - using white for primary in dark mode
    primary: '#FFFFFF',
    secondary: '#CCCCCC',
    accent: '#000000',

    // Background
    background: '#121212',
    surfaceLight: '#1E1E1E',
    surfaceDark: '#2A2A2A',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textTertiary: '#999999',

    // Semantic
    success: '#66BB6A',
    error: '#EF5350',
    warning: '#FFA726',
    info: '#42A5F5',

    // Borders & Dividers
    border: '#333333',
    divider: '#2A2A2A',

    // Special
    placeholder: '#666666',
    disabled: '#303030',
  },
};

export const getTheme = (mode: ThemeMode): Theme => {
  return mode === 'light' ? lightTheme : darkTheme;
};
