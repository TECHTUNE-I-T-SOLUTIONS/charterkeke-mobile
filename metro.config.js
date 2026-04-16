const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Handle CSS files
config.resolver.assetExts = [...config.resolver.assetExts.filter(ext => ext !== 'css'), 'css'];

module.exports = config;
