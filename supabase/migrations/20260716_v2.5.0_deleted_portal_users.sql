-- 2026-07-16 — v2.5.0 — Deleted portal users tombstone registry
-- Runs FIRST via pooler before any code deploy (Schema-Before-Code rule).
-- See: https://aws-1-us-west-2.pooler.supabase.com:6543
-- Portal v2.5.0 owns this migration (portal lands first; shared-DB).
-- CRM v2.10.28 (Jarvis) reads the table and contacts.portal_deleted_at column created here.

-- ── Tombstone registry ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.deleted_portal_users (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id  uuid         NOT NULL,
  email           text         NOT NULL,
  first_name      text,
  last_name       text,
  signed_up_at    timestamptz  NOT NULL,
  deleted_at      timestamptz  NOT NULL DEFAULT now(),
  unsubscribed    boolean      NOT NULL DEFAULT false,
  unsubscribed_at timestamptz,
  created_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deleted_portal_users_email
  ON public.deleted_portal_users(email);

CREATE INDEX IF NOT EXISTS idx_deleted_portal_users_deleted_at
  ON public.deleted_portal_users(deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_deleted_portal_users_unsubscribed
  ON public.deleted_portal_users(unsubscribed);

ALTER TABLE public.deleted_portal_users ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies → RLS blocks all non-service_role access.
-- Investor-facing surfaces never read this table.

-- ── CRM-side flag column (portal owns migration; both share this DB) ──────

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS portal_deleted_at timestamptz;

-- ── Comments ──────────────────────────────────────────────────────────────

COMMENT ON TABLE public.deleted_portal_users IS
  'Tombstone registry for deleted portal users. Used by CRM Deleted pill + win-back campaigns. Written before any destruction in the deletion function (v2.5.0).';

COMMENT ON COLUMN public.contacts.portal_deleted_at IS
  'Set when the linked portal user deletes their account (v2.5.0). Contact row retained for transactions.buyer_contact_id FK integrity.';
