// Charter Keke Color Palette (from web app)
export const COLORS = {
  light: {
    background: '#ffffff',
    foreground: '#052659',
    text: '#052659',
    textSecondary: '#666666',
    card: '#f8f9fa',
    cardForeground: '#052659',
    primary: '#052659', // Dark Blue
    primaryForeground: '#ffffff',
    secondary: '#4353a4', // Purple Blue
    secondaryForeground: '#ffffff',
    accent: '#C1E8FF', // Light Cyan
    accentForeground: '#052659',
    muted: '#f5f5f5',
    mutedForeground: '#666666',
    destructive: '#ef4444',
    destructiveForeground: '#fafafa',
    border: '#e0e0e0',
    input: '#f5f5f5',
    ring: '#4353a4',
  },
  dark: {
    background: '#0a1929',
    foreground: '#C1E8FF',
    card: '#122d5c',
    cardForeground: '#C1E8FF',
    primary: '#4353a4',
    primaryForeground: '#ffffff',
    secondary: '#C1E8FF',
    secondaryForeground: '#052659',
    accent: '#919DAFF',
    accentForeground: '#052659',
    muted: '#1e3a5f',
    mutedForeground: '#919DAFF',
    destructive: '#dc2626',
    destructiveForeground: '#fef2f2',
    border: '#2a4a7a',
    input: '#1e3a5f',
    ring: '#C1E8FF',
  },
};

// Status Colors
export const STATUS_COLORS = {
  success: '#16a34a',
  error: '#dc2626',
  warning: '#ea580c',
  info: '#4353a4',
  pending: '#d97706',
};

// Brand Colors
export const BRAND = {
  primary: '#052659',
  secondary: '#4353a4',
  accent: '#C1E8FF',
  dark: '#0a1929',
};

// Gradients
export const GRADIENTS = {
  primary: '#052659',
  secondary: '#4353a4',
  cardGradient: 'linear-gradient(135deg, #052659 0%, #4353a4 100%)',
  accentGradient: 'linear-gradient(135deg, #C1E8FF 0%, #919DAFF 100%)',
};

// Ride Status Colors
export const RIDE_STATUS_COLORS = {
  pending: STATUS_COLORS.warning,
  accepted: STATUS_COLORS.info,
  started: STATUS_COLORS.info,
  in_progress: STATUS_COLORS.info,
  completed: STATUS_COLORS.success,
  cancelled: STATUS_COLORS.error,
};

// Get color based on theme
export const getColor = (colorName: keyof typeof COLORS.light, isDark: boolean = false) => {
  return isDark ? COLORS.dark[colorName] : COLORS.light[colorName];
};

// Get contrast color for text
export const getContrastColor = (backgroundColor: string, isDark: boolean = false) => {
  if (isDark) {
    return COLORS.dark.foreground;
  }
  return COLORS.light.foreground;
};
