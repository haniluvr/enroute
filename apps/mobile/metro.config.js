const { getDefaultConfig } = require("expo/metro-config");

// Windows has an open issue with NativeWind v4 metro plugin path generation.
// Removing it temporarily to allow bundler to start.
const config = getDefaultConfig(__dirname);

module.exports = config;
