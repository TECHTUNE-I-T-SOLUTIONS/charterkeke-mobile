// app.config.js — Dynamic Expo config
// Reads from environment (EAS secrets or local .env.local) and bakes
// values into the app bundle so they're available at runtime via Constants.expoConfig.extra

/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  return {
    ...config,
    name: 'Charter Keke',
    slug: 'charter-keke-mobile',
    version: '2.2.5',
    // Bare workflow: runtimeVersion must be a string. Set it to the app
    // version so every version bump forces EAS to do a fresh native build
    // (and the native version field updates) instead of reusing the cached
    // native bundle from the previous build.
    runtimeVersion: '2.2.5',
    orientation: 'portrait',
    icon: './assets/charter keke.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/charter keke.png',
      resizeMode: 'contain',
      backgroundColor: '#1a1a1a',
    },
    plugins: [
      ['expo-router', {}],
      './plugins/with-androidx-support-excludes.js',
      './plugins/droptrack-live-wrapper.js',
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsVersion: '11.24.2',
          RNMapboxMapsDownloadToken:
            (process.env.MAPBOX_SECRET_TOKEN && !process.env.MAPBOX_SECRET_TOKEN.startsWith('$')
              ? process.env.MAPBOX_SECRET_TOKEN
              : null) ||
            (process.env.MAPBOX_DOWNLOADS_TOKEN && !process.env.MAPBOX_DOWNLOADS_TOKEN.startsWith('$')
              ? process.env.MAPBOX_DOWNLOADS_TOKEN
              : null) ||
            '',
          RNMapboxMapsDownloadsToken:
            (process.env.MAPBOX_SECRET_TOKEN && !process.env.MAPBOX_SECRET_TOKEN.startsWith('$')
              ? process.env.MAPBOX_SECRET_TOKEN
              : null) ||
            (process.env.MAPBOX_DOWNLOADS_TOKEN && !process.env.MAPBOX_DOWNLOADS_TOKEN.startsWith('$')
              ? process.env.MAPBOX_DOWNLOADS_TOKEN
              : null) ||
            '',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermissions:
            "Allow Charter Keke to access your location even when you aren't using the app",
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/charter keke.png',
          color: '#1a1a1a',
          modes: ['production'],
        },
      ],
      [
        'expo-camera',
        { cameraPermission: 'Allow Charter Keke to access your camera' },
      ],
    ],
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/charter keke.png',
    },
    scheme: 'charterkeke',
    assetBundlePatterns: ['assets/**'],
    ios: {
      icon: './assets/ios-app-icon-1024.png',
      bundleIdentifier: 'com.charterkeke.mobile',
      buildNumber: '234',
      googleServicesFile: './GoogleService-Info.plist',
      config: { usesNonExemptEncryption: false },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ['location'],
        NSLocationWhenInUseUsageDescription:
          'Charter Keke needs your location to match you with nearby rides',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Charter Keke needs your location for live tracking',
        NSLocationAlwaysUsageDescription:
          'Charter Keke needs your location during active rides to support trip tracking and safety.',
        NSCameraUsageDescription:
          'Charter Keke needs camera access for profile pictures and KYC',
        NSMicrophoneUsageDescription:
          'Charter Keke uses your microphone when you choose voice location search.',
        NSSpeechRecognitionUsageDescription:
          'Charter Keke uses speech recognition to turn your spoken pickup or destination into a location search.',
        NSPhotoLibraryUsageDescription:
          'Charter Keke uses your photo library only when you choose an image, such as selecting a profile picture or uploading driver vehicle and license photos for account verification.',
        NSPhotoLibraryAddUsageDescription:
          'Charter Keke saves files to your photo library only when you choose to export ride details, such as saving a ride receipt image for your records.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/charter keke.png',
        backgroundColor: '#1a1a1a',
      },
      package: 'com.charterkeke.mobile',
      googleServicesFile: './google-services.json',
      versionCode: 233,
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.INTERNET',
        'android.permission.RECORD_AUDIO',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.POST_PROMOTED_NOTIFICATIONS',
        'android.permission.USE_EXACT_ALARM',
      ],
      softwareKeyboardLayoutMode: 'pan',
    },
    extra: {
      ...config.extra,
      router: {},
      eas: {
        projectId: '9966caa5-2d6e-4192-a97c-0eb0f3108fa0',
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://www.charterkeke.com/api',
      mapboxPublicToken: process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN || '',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
    },
    updates: {
      url: 'https://u.expo.dev/9966caa5-2d6e-4192-a97c-0eb0f3108fa0',
    },
  };
};
