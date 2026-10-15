// Cloud backup sync — pushes local user data to Supabase and pulls it back.
// Local-first: the phone is the source of truth; cloud is a backup copy.
// Login is optional; everything works without it.

import { getSupabase } from './supabase';
import { getJSON, setJSON } from './storage';
import type { Settings } from './settings';

export interface SyncMeta {
  lastSync: string | null; // ISO timestamp
  lastError: string | null;
}

const EMPTY_META: SyncMeta = { lastSync: null, lastError: null };

export async function getSyncMeta(): Promise<SyncMeta> {
  return getJSON<SyncMeta>('syncMeta', EMPTY_META);
}

async function saveMeta(patch: Partial<SyncMeta>) {
  const cur = await getSyncMeta();
  await setJSON('syncMeta', { ...cur, ...patch });
}

/** Upload all local data to the cloud. Returns error message or null. */
export async function pushAll(): Promise<string | null> {
  // Anti-tamper gate: refuse cloud sync on high-confidence tampered builds.
  // Defaults to allowed until the startup integrity sweep completes.
  if ((globalThis as any).__cloudSyncAllowed === false) {
    return 'Security check failed on this device. Cloud backup is disabled.';
  }
  const sb = getSupabase();
  if (!sb) return 'Cloud backup is not set up yet.';
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return 'Please sign in first.';

  try {
    const uid = user.id;

    // 1. Profile (upsert)
    await sb.from('profiles').upsert({ id: uid, email: user.email }, { onConflict: 'id' }).throwOnError();

    // 2. Prayer logs — one row per date
    const prayerLog = await getJSON<Record<string, Record<string, boolean>>>('prayerLog', {});
    const uzrDays = await getJSON<Record<string, boolean>>('uzrDays', {});
    const logRows = Object.entries(prayerLog).map(([date, prayers]) => ({
      user_id: uid,
      date,
      prayers,
      uzr: !!uzrDays[date],
    }));
    if (logRows.length) {
      await sb.from('prayer_logs').upsert(logRows, { onConflict: 'user_id,date' }).throwOnError();
    }

    // 3. Bookmarks — array of "surah:ayah"
    const bookmarks = await getJSON<string[]>('bookmarks', []);
    if (bookmarks.length) {
      const rows = bookmarks.map(b => {
        const [surah, ayah] = b.split(':').map(Number);
        return { user_id: uid, surah, ayah };
      });
      await sb.from('bookmarks').upsert(rows, { onConflict: 'user_id,surah,ayah' }).throwOnError();
    }

    // 4. Tasbih counts
    const tasbih = await getJSON<Record<string, number>>('tasbih', {});
    if (Object.keys(tasbih).length) {
      await sb.from('tasbih').upsert({ user_id: uid, counts: tasbih }, { onConflict: 'user_id' }).throwOnError();
    }

    // 5. Settings
    const settings = await getJSON<Settings | null>('settings', null);
    if (settings) {
      await sb.from('settings').upsert(
        { user_id: uid, data: settings, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      ).throwOnError();
    }

    await saveMeta({ lastSync: new Date().toISOString(), lastError: null });
    return null;
  } catch (e: any) {
    const msg = e?.message ?? 'Sync failed. Check your connection.';
    await saveMeta({ lastError: msg });
    return msg;
  }
}

/** Download cloud data and merge into local storage. Cloud + local union (nothing is lost). */
export async function pullAll(): Promise<string | null> {
  if ((globalThis as any).__cloudSyncAllowed === false) {
    return 'Security check failed on this device. Cloud backup is disabled.';
  }
  const sb = getSupabase();
  if (!sb) return 'Cloud backup is not set up yet.';
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return 'Please sign in first.';

  try {
    const uid = user.id;

    // Prayer logs — merge per date (prayer flags OR-ed together)
    const { data: logs } = await sb.from('prayer_logs').select('date,prayers,uzr').eq('user_id', uid).throwOnError();
    if (logs?.length) {
      const local = await getJSON<Record<string, Record<string, boolean>>>('prayerLog', {});
      const localUzr = await getJSON<Record<string, boolean>>('uzrDays', {});
      for (const row of logs as { date: string; prayers: Record<string, boolean>; uzr: boolean }[]) {
        local[row.date] = { ...(local[row.date] ?? {}), ...(row.prayers ?? {}) };
        if (row.uzr) localUzr[row.date] = true;
      }
      await setJSON('prayerLog', local);
      await setJSON('uzrDays', localUzr);
    }

    // Bookmarks — union
    const { data: bm } = await sb.from('bookmarks').select('surah,ayah').eq('user_id', uid).throwOnError();
    if (bm?.length) {
      const local = new Set(await getJSON<string[]>('bookmarks', []));
      for (const r of bm as { surah: number; ayah: number }[]) local.add(`${r.surah}:${r.ayah}`);
      await setJSON('bookmarks', [...local]);
    }

    // Tasbih — take max per counter (never lose counts)
    const { data: tb } = await sb.from('tasbih').select('counts').eq('user_id', uid).maybeSingle().throwOnError();
    if (tb?.counts) {
      const local = await getJSON<Record<string, number>>('tasbih', {});
      const merged: Record<string, number> = { ...local };
      for (const [k, v] of Object.entries(tb.counts as Record<string, number>)) {
        merged[k] = Math.max(merged[k] ?? 0, v);
      }
      await setJSON('tasbih', merged);
    }

    // Settings — cloud wins only if newer
    const { data: st } = await sb.from('settings').select('data,updated_at').eq('user_id', uid).maybeSingle().throwOnError();
    if (st?.data) {
      const meta = await getSyncMeta();
      const cloudTime = new Date(st.updated_at ?? 0).getTime();
      const lastSync = meta.lastSync ? new Date(meta.lastSync).getTime() : 0;
      if (cloudTime > lastSync) {
        const local = await getJSON<Settings | null>('settings', null);
        await setJSON('settings', { ...(local ?? {}), ...(st.data as object) });
      }
    }

    await saveMeta({ lastSync: new Date().toISOString(), lastError: null });
    return null;
  } catch (e: any) {
    const msg = e?.message ?? 'Sync failed. Check your connection.';
    await saveMeta({ lastError: msg });
    return msg;
  }
}

/** Full two-way sync: pull first (merge), then push. Used after sign-in. */
export async function syncAll(): Promise<string | null> {
  const err = await pullAll();
  if (err) return err;
  return pushAll();
}
