const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Handle CSS files
config.resolver.assetExts = [...config.resolver.assetExts.filter(ext => ext !== 'css'), 'css'];

// Polyfill Node.js modules for React Native
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @ide/backoff's use of Node.js assert module
  if (moduleName === 'assert') {
    return {
      filePath: path.resolve(__dirname, 'assert-polyfill.js'),
      type: 'sourceFile',
    };
  }
  // Handle react-native-svg's use of Node.js buffer module
  if (moduleName === 'buffer') {
    return {
      filePath: path.resolve(__dirname, 'buffer-polyfill.js'),
      type: 'sourceFile',
    };
  }
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
