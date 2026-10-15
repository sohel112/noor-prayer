-- Deen Analytics: privacy-first event tracking
-- Run this in Supabase SQL Editor (one time)

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  install_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast DAU/MAU queries
CREATE INDEX IF NOT EXISTS idx_analytics_install_date
  ON analytics_events (install_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_date
  ON analytics_events (event_name, created_at);

-- RLS: allow inserts from anon (app), reads only for service role (admin dashboard)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon inserts" ON analytics_events
  FOR INSERT TO anon WITH CHECK (true);

-- DAU query (run in dashboard):
-- SELECT COUNT(DISTINCT install_id) AS dau
-- FROM analytics_events
-- WHERE event_name = 'app_open'
--   AND created_at >= CURRENT_DATE;

-- MAU query:
-- SELECT COUNT(DISTINCT install_id) AS mau
-- FROM analytics_events
-- WHERE event_name = 'app_open'
--   AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Top screens:
-- SELECT properties->>'screen' AS screen, COUNT(*) AS views
-- FROM analytics_events
-- WHERE event_name = 'screen_view'
--   AND created_at >= CURRENT_DATE - INTERVAL '7 days'
-- GROUP BY 1 ORDER BY 2 DESC;
