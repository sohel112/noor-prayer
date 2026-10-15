/**
 * Config plugin: bundles azan audio files as Android notification sounds.
 * Copies assets/audio/azan.ogg -> android/app/src/main/res/raw/azan.ogg
 * so notifications can use `sound: 'azan'` for auto-playing azan.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAzanSounds(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      const srcDir = path.join(projectRoot, 'assets', 'audio');
      const destDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'raw');

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      for (const file of ['azan.mp3', 'azan2.mp3']) {
        const src = path.join(srcDir, file);
        const dest = path.join(destDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`[withAzanSounds] copied ${file} to res/raw`);
        } else {
          console.warn(`[withAzanSounds] missing: ${src}`);
        }
      }
      return config;
    },
  ]);
};
