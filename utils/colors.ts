// Charter Keke Color Palette
// Primary Brand Color: #FF9101 (Orange)

export const COLORS = {
  light: {
    background: '#FFFFFF', // Pure White
    foreground: '#000000', // Pure Black
    text: '#1A1A1A',       // Soft Black for better readability
    textSecondary: '#4B4B4B', // Dark Gray for secondary text
    
    // Brand Colors
    primary: '#FF9101',    // The Charter Keke Orange
    primaryForeground: '#000000', // Black text on Orange button (High contrast)
    
    secondary: '#000000',  // Black accents
    secondaryForeground: '#FFFFFF',
    
    // UI Elements
    card: '#FFFFFF',
    profile: '#A05C0385', // Custom profile color for light mode
    cardForeground: '#000000',
    border: '#E5E5E5',
    input: '#F5F5F5',      // Light gray input background
    inputBorder: '#E0E0E0',
    
    // Status
    muted: '#71717A',
    mutedForeground: '#52525B',
    destructive: '#EF4444',
    
    // Gradients
    start: '#FF9101',
    end: '#FFFFFF',
    overlay: 'rgba(255, 255, 255, 0.9)',
  },
  dark: {
    background: '#000000', // Pure Black
    foreground: '#FFFFFF', // Pure White
    text: '#FFFFFF',
    textSecondary: '#E6A653', // Light gray for secondary text in dark mode
    // Brand Colors
    primary: '#FF9101',
    primaryForeground: '#000000',
    
    secondary: '#FFFFFF',
    secondaryForeground: '#000000',
    
    // UI Elements
    card: '#121212',       // Dark Gray card
    profile: '#3D23026B', // Custom profile color for dark mode
    cardForeground: '#FFFFFF',
    border: '#333333',
    input: '#1A1A1A',      // Dark gray input background
    inputBorder: '#333333',
    
    // Status
    muted: '#A1A1AA',
    mutedForeground: '#D4D4D8',
    destructive: '#EF4444',
    
    // Gradients
    start: '#FF9101',
    end: '#AF6505',
    overlay: 'rgba(0, 0, 0, 0.9)',
  },
};

// Brand Constants
export const BRAND = {
  primary: '#FF9101',
  secondary: '#000000',
  white: '#FFFFFF',
  black: '#000000',
};

// Status Colors
export const STATUS_COLORS = {
  success: '#22C55E', // Green
  error: '#EF4444',   // Red
  warning: '#F59E0B', // Amber
  info: '#3B82F6',    // Blue
};

export const GRADIENTS = {
  // Light Mode Gradients
  light: {
    primary: ['#FF9101', '#FFAD33'],
    button: ['#FF9101', '#FF9101'], // Flat look is more modern, or subtle gradient
    background: ['#FFFFFF', '#FFF8F0', '#FFF0E0'],
  },
  // Dark Mode Gradients
  dark: {
    primary: ['#FF9101', '#CC7400'],
    button: ['#FF9101', '#E68200'],
    background: ['#000000', '#1A1100', '#000000'],
  }
};

// Get color based on theme
export const getColor = (colorName: keyof typeof COLORS.light, isDark: boolean = false) => {
  return isDark ? COLORS.dark[colorName] : COLORS.light[colorName];
};
