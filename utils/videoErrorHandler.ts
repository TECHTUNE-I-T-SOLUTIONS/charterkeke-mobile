/**
 * Video Error Handler for Expo Video Component
 * Handles Android decoder issues gracefully
 */

export interface VideoErrorEvent {
  message?: string;
  isLoaded?: boolean;
  duration?: number;
}

/**
 * Parse video error details from Expo Video error event
 */
export const parseVideoError = (error: any): string => {
  if (!error) return 'Unknown video error';

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  return 'Failed to load video. Using fallback background.';
};

/**
 * Check if error is a decoder error (common on Android)
 */
export const isDecoderError = (error: any): boolean => {
  const errorString = JSON.stringify(error).toLowerCase();
  return errorString.includes('decoder') || 
         errorString.includes('codec') || 
         errorString.includes('mp3');
};

/**
 * Log video error with proper formatting
 */
export const logVideoError = (error: any, context: string = 'Video'): void => {
  const errorMessage = parseVideoError(error);
  const isDecoder = isDecoderError(error);

  if (isDecoder) {
    console.log(`🔴 ${context} - Decoder Error (using fallback): ${errorMessage}`);
  } else {
    console.log(`🔴 ${context} - Error: ${errorMessage}`);
  }
};

/**
 * Get fallback gradient colors based on theme
 */
export const getFallbackGradient = (theme: 'light' | 'dark'): string[] => {
  if (theme === 'light') {
    return [
      'rgba(241, 137, 2, 0.8)',   // Brand orange with opacity
      'rgba(230, 130, 0, 0.6)',
      'rgba(0, 0, 0, 0.4)',
    ];
  }

  return [
    'rgba(241, 137, 2, 0.6)',     // Lighter orange for dark theme
    'rgba(150, 80, 0, 0.5)',
    'rgba(0, 0, 0, 0.7)',
  ];
};
