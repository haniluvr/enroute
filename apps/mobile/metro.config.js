const { getDefaultConfig } = require("expo/metro-config");

// Windows has an open issue with NativeWind v4 metro plugin path generation.
// Removing it temporarily to allow bundler to start. NativeWind v4 styling must
// manually be compiled via Tailwind CLI or we must downgrade to NativeWind v2.
const config = getDefaultConfig(__dirname);

// Add webm to the list of assets that the bundler will bundle
config.resolver.assetExts.push('webm');

module.exports = config;
