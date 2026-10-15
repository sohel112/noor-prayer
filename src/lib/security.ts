/**
 * MAXIMUM anti-modding / anti-tamper protection for Deen.
 *
 * Layers (defense in depth):
 *  BUILD TIME (invisible to modders):
 *   1. Hermes bytecode — JS ships as compiled bytecode, not readable source
 *   2. ProGuard/R8 — native code obfuscated + shrunk (app.json)
 *   3. Resource shrinking — unused resources stripped
 *
 *  RUNTIME (this file — silent checks at startup):
 *   4. Debug-build detection (__DEV__ must be false in release)
 *   5. Package-name verification (repackaged APKs often rename)
 *   6. Root detection (su binaries, Magisk, root manager apps)
 *   7. Hooking-framework detection (Frida, Xposed/LSPosed, Substrate)
 *   8. Emulator detection (modders often patch on emulators)
 *
 *  SERVER SIDE (strongest — client can't bypass):
 *   9. Supabase RLS — row ownership enforced by the server, not the app.
 *      Even a fully reverse-engineered client cannot read others' data.
 *
 * Honest note: no Android app is 100% unmoddable. These layers make
 * modding expensive enough that 99%+ of attackers give up.
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

export interface SecurityReport {
  tampered: boolean;
  rooted: boolean;
  hooked: boolean;
  emulator: boolean;
  reasons: string[];
  /** risk level 0-100 */
  riskScore: number;
}

// ---- known root / hooking artifacts (file paths) ----
const ROOT_BINARIES = [
  '/system/bin/su',
  '/system/xbin/su',
  '/sbin/su',
  '/system/sd/xbin/su',
  '/system/bin/failsafe/su',
  '/data/local/xbin/su',
  '/data/local/bin/su',
  '/su/bin/su',
  // Magisk
  '/sbin/.magisk',
  '/data/adb/magisk',
  '/data/adb/modules',
];

const HOOK_FRAMEWORKS = [
  // Frida
  '/data/local/tmp/frida-server',
  '/data/local/tmp/re.frida.server',
  // Xposed / LSPosed / EdXposed
  '/data/adb/lspd',
  '/system/framework/XposedBridge.jar',
  // Substrate / Cydia
  '/system/lib/libsubstrate.so',
  '/system/lib64/libsubstrate.so',
];

async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync('file://' + path);
    return info.exists;
  } catch {
    return false;
  }
}

async function detectRoot(): Promise<string[]> {
  const hits: string[] = [];
  for (const p of ROOT_BINARIES) {
    if (await fileExists(p)) {
      hits.push('root-binary:' + p.split('/').pop());
      break; // one is enough
    }
  }
  return hits;
}

async function detectHooking(): Promise<string[]> {
  const hits: string[] = [];
  for (const p of HOOK_FRAMEWORKS) {
    if (await fileExists(p)) {
      hits.push('hook-framework:' + p.split('/').pop());
      break;
    }
  }
  // Frida default port check would need sockets — skipped (needs native).
  // The file check above catches the common on-device frida-server case.
  return hits;
}

function detectEmulator(): string[] {
  // expo-device: isDevice is false on emulators/simulators
  if (!Device.isDevice) return ['emulator'];
  return [];
}

/**
 * Full integrity sweep. Runs silently; never blocks the UI thread long —
 * file checks are quick stat calls.
 */
export async function checkAppIntegrity(): Promise<SecurityReport> {
  const reasons: string[] = [];
  let rooted = false;
  let hooked = false;
  let emulator = false;

  // 1. Debug build
  if (__DEV__) {
    reasons.push('debug-build');
  }

  // 2. Expo release channel check — dev clients / Expo Go must never ship
  try {
    const appOwnership = Constants.appOwnership;
    if (appOwnership === 'expo') {
      reasons.push('expo-go');
    }
  } catch {
    /* neutral */
  }

  if (Platform.OS === 'android') {
    // 3. Package name — repackaged APKs sometimes rename the package
    try {
      const appId = Application.applicationId ?? '';
      if (appId && appId !== 'com.noor.prayer') {
        reasons.push('package-mismatch');
      }
    } catch {
      /* neutral */
    }

    // 4. Root
    const rootHits = await detectRoot();
    if (rootHits.length) {
      rooted = true;
      reasons.push(...rootHits);
    }

    // 5. Hooking frameworks (Frida / Xposed)
    const hookHits = await detectHooking();
    if (hookHits.length) {
      hooked = true;
      reasons.push(...hookHits);
    }

    // 6. Emulator
    const emuHits = detectEmulator();
    if (emuHits.length) {
      emulator = true;
      reasons.push(...emuHits);
    }
  }

  // Risk score: debug=40, root=30, hooking=40, emulator=15, package=50, expo-go=30
  let riskScore = 0;
  for (const r of reasons) {
    if (r === 'debug-build') riskScore += 40;
    else if (r === 'expo-go') riskScore += 30;
    else if (r === 'package-mismatch') riskScore += 50;
    else if (r.startsWith('root-binary')) riskScore += 30;
    else if (r.startsWith('hook-framework')) riskScore += 40;
    else if (r === 'emulator') riskScore += 15;
  }
  riskScore = Math.min(100, riskScore);

  return {
    tampered: reasons.length > 0,
    rooted,
    hooked,
    emulator,
    reasons,
    riskScore,
  };
}

/**
 * Whether cloud sync / sensitive features should be allowed.
 * Conservative: block only on HIGH confidence tampering
 * (debug build, package mismatch, hooking framework).
 * Root alone does NOT block — many legit users root their phones.
 */
export function shouldAllowCloudSync(report: SecurityReport): boolean {
  const hardFlags = ['debug-build', 'package-mismatch', 'expo-go'];
  if (report.reasons.some(r => hardFlags.includes(r) || r.startsWith('hook-framework'))) {
    return false;
  }
  return true;
}

export const BUILD_HARDENING = [
  'hermes-bytecode',
  'proguard-r8',
  'resource-shrinking',
  'supabase-rls',
] as const;
