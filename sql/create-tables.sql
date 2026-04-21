-- DOM Investor Portal Tables
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/spvuknwwppqsbyrfduvw/sql/new

CREATE TABLE IF NOT EXISTS portal_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  featured boolean DEFAULT false,
  published_at timestamptz,
  published_by uuid,
  visible_to text DEFAULT 'all',
  asking_price numeric,
  assignment_fee numeric,
  open_house_date timestamptz,
  open_house_end timestamptz,
  offer_deadline timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investor_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_listing_id uuid REFERENCES portal_listings(id) ON DELETE CASCADE,
  investor_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  type text,
  offer_amount numeric,
  offer_deed_name text,
  offer_financing boolean,
  offer_pm_interest boolean,
  agent_name text,
  agent_email text,
  agent_phone text,
  agent_brokerage text,
  notes text,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);
