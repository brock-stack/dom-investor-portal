-- ============================================================
-- v2.2.13 — investor_buy_box schema additions + market migration
-- ============================================================
-- Ask 1: Add 4 new columns (idempotent via IF NOT EXISTS)
-- Ask 2: Migrate legacy market strings to new Florida region names
-- ============================================================
-- IMPORTANT — Apply path:
--   The Sandbox gate merges this file to main but does NOT auto-apply it.
--   After approval + merge, Einstein (or Andrew via `supabase db push`)
--   must hand-apply this migration via the Supabase pooler.
--   Until applied, the 4 new columns do NOT exist in the live DB.
-- ============================================================

BEGIN;

-- ── Ask 1: Add 4 columns ─────────────────────────────────────────────────────

ALTER TABLE public.investor_buy_box
  ADD COLUMN IF NOT EXISTS water_source TEXT;

ALTER TABLE public.investor_buy_box
  ADD COLUMN IF NOT EXISTS sewer_type TEXT;

ALTER TABLE public.investor_buy_box
  ADD COLUMN IF NOT EXISTS no_flood_zone BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.investor_buy_box
  ADD COLUMN IF NOT EXISTS no_hoa BOOLEAN NOT NULL DEFAULT FALSE;

-- Signal PostgREST to reload its schema cache so the new columns
-- are visible to the API within ~30s (avoids PGRST204 on v2.2.14 INSERTs).
NOTIFY pgrst, 'reload schema';

-- ── Ask 2: Migrate legacy market strings to new region names ─────────────────
-- Idempotent: rows that already contain new-name strings are untouched
-- (COALESCE(mm.new_name, m) passes through any string not in the map).
-- "Other" is intentionally absent from the map and is preserved as-is.
-- DISTINCT dedupes Miami + Fort Lauderdale → single "Gold Coast" entry.

WITH market_map (legacy, new_name) AS (
  VALUES
    ('Tampa',           'Tampa Bay (Tampa-St. Pete-Clearwater)'),
    ('Orlando',         'Greater Orlando'),
    ('Jacksonville',    'Jacksonville Metro'),
    ('Miami',           'Gold Coast (Miami-Fort Lauderdale-WPB)'),
    ('Fort Lauderdale', 'Gold Coast (Miami-Fort Lauderdale-WPB)'),
    ('Naples',          'Naples (Paradise Coast)'),
    ('Sarasota',        'Sarasota-Bradenton'),
    ('Cape Coral',      'Fort Myers-Cape Coral'),
    ('Fort Myers',      'Fort Myers-Cape Coral'),
    ('North Port',      'Sarasota-Bradenton'),
    ('Gainesville',     'Gainesville Area'),
    ('Space Coast',     'Space Coast (Brevard)'),
    ('Tallahassee',     'Tallahassee / Big Bend'),
    ('Pensacola',       'Pensacola Bay Area'),
    ('The Keys',        'Florida Keys (Monroe)')
    -- "Other" intentionally omitted — preserved as-is
)
UPDATE public.investor_buy_box ibb
SET markets = (
  SELECT ARRAY(
    SELECT DISTINCT COALESCE(mm.new_name, m)
    FROM unnest(ibb.markets) AS m
    LEFT JOIN market_map mm ON mm.legacy = m
  )
)
WHERE markets IS NOT NULL AND array_length(markets, 1) > 0;

COMMIT;
