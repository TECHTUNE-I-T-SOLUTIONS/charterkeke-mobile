/**
 * Theme definitions for light and dark modes
 * Strictly adheres to #FF9101 (Orange), Black, and White
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Core
  primary: string;
  onPrimary: string; // Text color on primary background
  background: string;
  surface: string; // Cards, modals
  card: string; // Cards, modals
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  moving: string; // For text that indicates movement or action (e.g., "Moving to Trash")

  // Form Elements
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;

  // Borders & Dividers
  border: string;
  divider: string;

  // Status
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Accents
  icon: string;
  badge: string;
  sheet: string; // Custom sheet color for dark mode
}


export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#FF9101',
    onPrimary: '#000000',
    background: '#FFFFFF',
    sheet: '#DF9638', // Custom sheet color for light mode
    surface: '#FFFFFF',
    card: '#F18902AD',


    textPrimary: '#000000',
    textSecondary: '#814D08',
    textTertiary: '#999999',
    moving: '#F18902AD', // Red color for "Moving to Trash" text

    inputBackground: '#FAFAFA',
    inputBorder: '#E5E5E5',
    inputPlaceholder: '#A3A3A3',

    border: '#F0F0F0',
    divider: '#F5F5F5',

    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    icon: '#000000',
    badge: '#F2F2F2',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#FF9101',
    onPrimary: '#000000',
    background: '#000000',
    sheet: '#DF8108EC', // Custom sheet color for dark mode
    surface: '#121212',
    card: '#573202D2',

    textPrimary: '#FFFFFF',
    textSecondary: '#E6A653',
    textTertiary: '#52525B',
    moving: '#C27107D2', // Red color for "Moving to Trash" text
    
    inputBackground: '#18181B', // Zinc 900
    inputBorder: '#27272A',     // Zinc 800
    inputPlaceholder: '#52525B',

    border: '#27272A',
    divider: '#1F1F1F',

    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',

    icon: '#FFFFFF',
    badge: '#27272A',
  },
};

export const getTheme = (mode: ThemeMode): Theme => {
  return mode === 'light' ? lightTheme : darkTheme;
};
