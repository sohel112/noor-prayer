/**
 * Config plugin: creates keep.xml so the resource shrinker
 * doesn't rename/delete azan notification sounds.
 * The MP3s themselves are bundled via expo-notifications sounds array.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAzanKeep(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;

      // 1. Disable resource name obfuscation in gradle.properties
      const gradlePropsPath = path.join(platformRoot, 'gradle.properties');
      if (fs.existsSync(gradlePropsPath)) {
        let props = fs.readFileSync(gradlePropsPath, 'utf8');
        if (!props.includes('android.enableResourceOptimizations')) {
          props += '\nandroid.enableResourceOptimizations=false\n';
          fs.writeFileSync(gradlePropsPath, props);
          console.log('[withAzanKeep] disabled resource optimizations');
        }
      }

      const rawDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'raw');
      if (!fs.existsSync(rawDir)) {
        fs.mkdirSync(rawDir, { recursive: true });
      }
      const keepXmlPath = path.join(rawDir, 'keep.xml');
      const keepXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools"
    tools:keep="@raw/azan, @raw/azan2, @raw/azan_makkah" />
`;
      fs.writeFileSync(keepXmlPath, keepXmlContent);
      console.log('[withAzanKeep] created res/raw/keep.xml');
      return config;
    },
  ]);
};
