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

      for (const [srcFile, destFile] of [['azan.mp3', 'azan.mp3'], ['azan2.mp3', 'azan2.mp3'], ['azan-makkah.mp3', 'azan_makkah.mp3']]) {
        const src = path.join(srcDir, srcFile);
        const dest = path.join(destDir, destFile);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`[withAzanSounds] copied ${srcFile} to res/raw/${destFile}`);
        } else {
          console.warn(`[withAzanSounds] missing: ${src}`);
        }
      }
      // keep.xml stops resource shrinker deleting raw azan files
      const valuesDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'values');
      const keepXml = '<?xml version="1.0" encoding="utf-8"?>\n<resources xmlns:tools="http://schemas.android.com/tools"\n    tools:keep="@raw/azan,@raw/azan2,@raw/azan_makkah" />\n';
      if (!fs.existsSync(valuesDir)) { fs.mkdirSync(valuesDir, { recursive: true }); }
      fs.writeFileSync(path.join(valuesDir, 'azan_keep.xml'), keepXml);
      return config;
    },
  ]);
};
