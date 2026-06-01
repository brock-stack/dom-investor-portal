-- v2.2.15 — Canonical metro mapping for investor_buy_box.markets
-- Replaces 23-entry coast-nickname list with 19 U.S. Census MSA-aligned labels.
-- Idempotent: re-running on already-migrated data is a no-op (canonical strings pass through,
-- non-canonical strings that aren't in the mapping table are dropped).

DO $$ BEGIN RAISE NOTICE 'v2.2.15 canonical metro migration starting'; END $$;

-- Step 1: explicit mapping for every legacy string currently in prod.
-- canonical = NULL means DROP the string (no clean MSA fit).
WITH mapping(legacy, canonical) AS (
  VALUES
    ('Tampa Bay (Tampa-St. Pete-Clearwater)', ARRAY['Tampa','St. Petersburg']),
    ('Greater Orlando',                        ARRAY['Orlando-Kissimmee-Sanford']),
    ('Gold Coast (Miami-Fort Lauderdale-WPB)', ARRAY['Miami','Fort Lauderdale','West Palm Beach']),
    ('Sarasota-Bradenton',                     ARRAY['North Port-Sarasota-Bradenton']),
    ('Fort Lauderdale',                        ARRAY['Fort Lauderdale']),
    ('Naples',                                 ARRAY['Naples-Marco Island']),
    ('Sarasota',                               ARRAY['North Port-Sarasota-Bradenton']),
    ('Jacksonville Metro',                     ARRAY['Jacksonville']),
    ('Fort Myers-Cape Coral',                  ARRAY['Cape Coral-Fort Myers']),
    ('Space Coast (Brevard)',                  ARRAY['Palm Bay-Melbourne-Titusville']),
    ('Gainesville Area',                       ARRAY['Gainesville']),
    ('Naples (Paradise Coast)',                ARRAY['Naples-Marco Island']),
    ('Pensacola Bay Area',                     ARRAY['Pensacola-Ferry Pass-Brent']),
    ('Emerald Coast',                          ARRAY['Crestview-Fort Walton Beach-Destin']),
    ('Tallahassee / Big Bend',                 ARRAY['Tallahassee']),
    ('First Coast (St. Augustine / Amelia Island)', ARRAY['Jacksonville']),
    ('Lakeland-Winter Haven',                  ARRAY['Lakeland-Winter Haven']),
    ('Sun Coast',                              ARRAY['North Port-Sarasota-Bradenton']),
    ('Palm Beaches',                           ARRAY['West Palm Beach']),
    ('Treasure Coast (Martin/St. Lucie/Indian River)', ARRAY['Port St. Lucie']),
    -- The following strings DROP (no canonical MSA fit):
    ('Forgotten Coast',               NULL),
    ('Lake Okeechobee Region',        NULL),
    ('Other',                         NULL),
    ('Nature Coast',                  NULL),
    ('Glades / Agricultural Heartland', NULL),
    ('The Everglades',                NULL),
    ('Florida Keys (Monroe)',         NULL)
),
-- Canonical set for pass-through of already-migrated strings
canonical_set(label) AS (
  VALUES
    ('Miami'),('Fort Lauderdale'),('West Palm Beach'),
    ('Tampa'),('St. Petersburg'),
    ('Orlando-Kissimmee-Sanford'),
    ('Jacksonville'),
    ('North Port-Sarasota-Bradenton'),('Cape Coral-Fort Myers'),('Naples-Marco Island'),
    ('Lakeland-Winter Haven'),
    ('Deltona-Daytona Beach-Ormond'),('Palm Bay-Melbourne-Titusville'),
    ('Pensacola-Ferry Pass-Brent'),('Crestview-Fort Walton Beach-Destin'),('Tallahassee'),
    ('Ocala'),('Gainesville'),
    ('Port St. Lucie')
)
-- Step 2: walk every row, build the new array.
-- For each element in the existing markets array:
--   a) If it is already a canonical label → pass it through.
--   b) If it has a mapping entry with canonical != NULL → expand to mapped labels.
--   c) Otherwise → drop it.
-- Result is deduped via DISTINCT.
UPDATE investor_buy_box bb
SET markets = (
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT new_label
      FROM UNNEST(bb.markets) AS m(legacy)
      LEFT JOIN mapping ON mapping.legacy = m.legacy
      LEFT JOIN canonical_set cs ON cs.label = m.legacy
      CROSS JOIN LATERAL (
        SELECT unnested
        FROM UNNEST(
          CASE
            -- Already canonical: pass through as single-element array
            WHEN cs.label IS NOT NULL THEN ARRAY[m.legacy]
            -- Has a mapping with non-null canonical: use mapped labels
            WHEN mapping.canonical IS NOT NULL THEN mapping.canonical
            -- Everything else (no mapping or mapping.canonical IS NULL): drop
            ELSE ARRAY[]::text[]
          END
        ) AS unnested
      ) expanded
      WHERE expanded.unnested IS NOT NULL
        AND expanded.unnested <> ''
    ),
    ARRAY[]::text[]
  )
)
WHERE bb.markets IS NOT NULL
  AND array_length(bb.markets, 1) > 0;

-- Step 3: reload PostgREST schema cache.
NOTIFY pgrst, 'reload schema';

DO $$ BEGIN RAISE NOTICE 'v2.2.15 canonical metro migration complete'; END $$;
