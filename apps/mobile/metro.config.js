const { getDefaultConfig } = require("expo/metro-config");

// Windows has an open issue with NativeWind v4 metro plugin path generation.
// Removing it temporarily to allow bundler to start. NativeWind v4 styling must
// manually be compiled via Tailwind CLI or we must downgrade to NativeWind v2.
const config = getDefaultConfig(__dirname);

const { assetExts, sourceExts } = config.resolver;

// Configure SVG transformer
config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer/expo")
};

config.resolver = {
    ...config.resolver,
    assetExts: assetExts.filter((ext) => ext !== "svg").concat('webm'),
    sourceExts: [...sourceExts, "svg"]
};

module.exports = config;
