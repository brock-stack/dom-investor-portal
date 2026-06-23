-- v2.3.11 — Pro forma autosave dedupe
-- Author: Kong 🦍 | 2026-06-23

-- 1. Backfill: collapse Ann Pabst's 4 "Hollywood FL" rows to 1 by archiving the older 3.
-- Keep id=689e159a (latest created_at 19:04:13.829) as canonical; archive the other three.
UPDATE public.investor_saved_proformas
SET archived = true, updated_at = now()
WHERE id IN (
  '3888be12-cf3b-45ff-b5b3-b066df4ec831',
  '6b4f084a-73bb-4eae-9ca5-80b4296d59e0',
  '0832098e-fd69-46a0-be0e-04f371dab590'
);

-- 2. Partial unique index supporting the client-side UPSERT for untethered pro formas.
-- Only enforces uniqueness on active, untethered rows. Archived rows and listing-attached rows are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_proforma_untethered_user_name
  ON public.investor_saved_proformas (user_id, name)
  WHERE listing_id IS NULL AND archived = false;
