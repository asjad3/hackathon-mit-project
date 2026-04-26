// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Bundle .gguf model files as assets so `require()` in modelConfig.ts works
// and `expo-asset` can copy them to the app's cache directory at first launch.
if (!config.resolver.assetExts.includes("gguf")) {
  config.resolver.assetExts.push("gguf");
}

module.exports = config;
