/**
 * In-app update checker — notifies users when a new version is on the Play Store.
 *
 * How it works:
 * 1. On app start (max once per day), fetch version.json from the repo.
 * 2. Compare `latestVersion` with the installed app version.
 * 3. If newer → show an update dialog with an "Update" button.
 * 4. If installed < `minVersion` → force update (dialog can't be dismissed).
 *
 * To publish an update: just edit version.json in the repo (bump latestVersion,
 * write changelog, set updateUrl to the Play Store link once live).
 * No app rebuild needed for the check itself — but the NEW version obviously
 * needs its own build + Play Store upload first.
 */
import * as Application from 'expo-application';
import { getJSON, setJSON } from './storage';

const VERSION_URL =
  'https://raw.githubusercontent.com/sohel112/noor-prayer/master/version.json';
const LAST_CHECK_KEY = 'updateCheck';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // once a day

export interface UpdateInfo {
  available: boolean;
  force: boolean;
  latestVersion: string;
  currentVersion: string;
  changelog: string;
  updateUrl: string;
}

/** Compare "1.2.3" style versions. Returns 1 if a>b, -1 if a<b, 0 if equal. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

interface RemoteVersion {
  latestVersion?: string;
  minVersion?: string;
  updateUrl?: string;
  changelog?: string;
  forceUpdate?: boolean;
}

/**
 * Check for an update. Returns null when no update (or check skipped/failed).
 * Never throws — update checks must never break the app.
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const last = await getJSON<number>(LAST_CHECK_KEY, 0);
    if (Date.now() - last < CHECK_INTERVAL_MS) return null;

    const current = Application.nativeApplicationVersion ?? '0.0.0';

    const res = await fetch(VERSION_URL, { cache: 'no-store' } as any);
    if (!res.ok) return null;
    const remote = (await res.json()) as RemoteVersion;
    if (!remote.latestVersion) return null;

    await setJSON(LAST_CHECK_KEY, Date.now());

    if (compareVersions(remote.latestVersion, current) <= 0) return null;

    const force =
      !!remote.forceUpdate ||
      (!!remote.minVersion && compareVersions(current, remote.minVersion) < 0);

    return {
      available: true,
      force,
      latestVersion: remote.latestVersion,
      currentVersion: current,
      changelog: remote.changelog ?? '',
      updateUrl:
        remote.updateUrl ?? 'https://github.com/sohel112/noor-prayer/releases',
    };
  } catch {
    return null; // offline or bad JSON — stay silent
  }
}
