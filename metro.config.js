// Metro bundler config — ensure audio assets (ogg, mp3, wav) are bundled.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure audio extensions are treated as assets
const assetExts = config.resolver.assetExts || [];
for (const ext of ['ogg', 'mp3', 'wav', 'm4a']) {
  if (!assetExts.includes(ext)) assetExts.push(ext);
}
config.resolver.assetExts = assetExts;

module.exports = config;
