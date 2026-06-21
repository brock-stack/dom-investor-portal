-- v2.3.9 — Drop deprecated portal_users notification columns
--
-- Per Portal Notification Catalog v1 (knowledge_doc row e935a69a-c3ae-48da-b91f-1d91c641b38c,
-- locked by Andrew 2026-06-21), portal members get exactly TWO channel opt-ins: `notif_email`
-- and `notif_sms`. The event-specific columns `notif_new_deals` and `notif_price_drop` are
-- deprecated and removed from production.
--
-- Prerequisites already on main before this migration runs:
-- - v2.3.7 (Kong, portal dashboard.html): stopped reading + writing both columns from the
--   Settings panel UI (shipped 2026-06-21 15:10 UTC).
-- - v2.10.2 (Jarvis, CRM netlify/functions/notify-marketplace-listing.js): dropped the
--   `.eq('notif_new_deals', true)` filter from the fan-out recipient query.
--
-- No live code reads or writes either column after both prerequisites are on main. This
-- migration is the final cleanup step.
--
-- Out of scope: `email_notifications` and `sms_notifications` (separate orphan columns,
-- audited separately).

ALTER TABLE public.portal_users DROP COLUMN IF EXISTS notif_new_deals;
ALTER TABLE public.portal_users DROP COLUMN IF EXISTS notif_price_drop;
