# Noor — Prayer App

Islamic prayer app built with Expo SDK 57. Offline-first, privacy-first, 100% free.

## Cloud Backup Setup (Supabase) — optional

The app works fully without an account. To enable the optional **Backup & Sync**
(sign-in → prayer log, bookmarks, tasbih, settings backed up to the cloud):

### 1. Create a free Supabase project
1. Go to https://supabase.com → New project (free tier is enough).
2. In **SQL Editor**, run `supabase/migrations/001_init.sql` (creates tables + RLS policies).

### 2. Add credentials to the app
In `app.json` → `expo.extra`, replace the placeholders:
```json
"supabaseUrl": "https://YOUR_PROJECT.supabase.co",
"supabaseAnonKey": "YOUR_ANON_KEY"
```
(Find both in Supabase dashboard → Project Settings → API. The `anon` key is
safe to ship in the app — RLS policies restrict every user to their own rows.)

### 3. Auth settings (Supabase dashboard → Authentication)
- **Email**: enabled by default. Turn OFF "Confirm email" if you want instant sign-up,
  or leave it ON (the app tells users to check their inbox).
- **Google** (optional): enable Google provider, add Android OAuth client.
  - In Google Cloud Console, add the redirect URI Supabase shows you.
  - For Android, also add your app's SHA-1 (from the EAS keystore) to the OAuth client.

### 4. Rebuild
Run a new EAS build — login activates automatically once real credentials are present.
Until then the app shows "Cloud backup is not set up yet" and works fully offline.

## Privacy promise
User data is **never sold, never shared, never used for ads**. Cloud backup stores
only the user's own prayer log, bookmarks, tasbih counts and settings, protected by
Row Level Security (each user sees only their own rows).
