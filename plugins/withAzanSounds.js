/**
 * Config plugin: bundles azan audio files as Android notification sounds.
 * Copies assets/audio/*.mp3 -> android/app/src/main/res/raw/
 * and creates keep.xml so the resource shrinker doesn't delete them.
 *
 * Runs DURING `npx expo prebuild` (via withDangerousMod), so the files
 * are generated as part of prebuild and never wiped by it.
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

      // 1. Raw folder path (where MP3 files go)
      const rawDir = path.join(platformRoot, 'app', 'src', 'main', 'res', 'raw');
      if (!fs.existsSync(rawDir)) {
        fs.mkdirSync(rawDir, { recursive: true });
      }

      // 2. Copy MP3 files
      const srcDir = path.join(projectRoot, 'assets', 'audio');
      const files = [
        ['azan.mp3', 'azan.mp3'],
        ['azan2.mp3', 'azan2.mp3'],
        ['azan-makkah.mp3', 'azan_makkah.mp3'],
      ];
      for (const [srcFile, destFile] of files) {
        const src = path.join(srcDir, srcFile);
        const dest = path.join(rawDir, destFile);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`[withAzanSounds] copied ${srcFile} to res/raw/${destFile}`);
        } else {
          console.warn(`[withAzanSounds] missing: ${src}`);
        }
      }

      // 3. keep.xml in res/raw/ so Gradle resource shrinker keeps the sounds
      const keepXmlPath = path.join(rawDir, 'keep.xml');
      const keepXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools"
    tools:keep="@raw/azan,@raw/azan2,@raw/azan_makkah" />
`;
      fs.writeFileSync(keepXmlPath, keepXmlContent);
      console.log('[withAzanSounds] created res/raw/keep.xml to prevent shrinking');

      return config;
    },
  ]);
};
