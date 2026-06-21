// Portal — Auto-link contact on signup
// POST { first_name, last_name, email, phone, portal_user_id, liquidity, legal_name, terms_signed_name, invite_contact_id? }
// If invite_contact_id present: UPDATE that contact's portal_user_id + has_portal_access.
// Else: INSERT a new contact with portal_user_id set, contact_type=["buyer"], has_portal_access=true.
// Returns: { contact_id, created: boolean }
// Auth: x-dom-internal-token header must match env DOM_INTERNAL_TOKEN (same token CRM uses).
// Uses native fetch (Node 18+) — no npm dependencies required.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://spvuknwwppqsbyrfduvw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DOM_INTERNAL_TOKEN = process.env.DOM_INTERNAL_TOKEN || '3byyhnlM7IDnAMtvi4cAYQpApbbGCeco_9-KMZ8la0I';

exports.handler = async function(event) {
  // CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Auth
  const token = event.headers['x-dom-internal-token'] || event.headers['X-Dom-Internal-Token'] || '';
  if (!token || token !== DOM_INTERNAL_TOKEN) {
    return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (_) { return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const {
    first_name, last_name, email, phone, portal_user_id,
    liquidity, legal_name, terms_signed_name,
    invite_contact_id,
  } = body;

  if (!portal_user_id || !email) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'portal_user_id and email are required' }) };
  }

  const sbHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
  };

  try {
    // Path A — invite flow: link existing contact, return its id
    if (invite_contact_id) {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/contacts?id=eq.' + encodeURIComponent(invite_contact_id),
        {
          method: 'PATCH',
          headers: sbHeaders,
          body: JSON.stringify({ portal_user_id, has_portal_access: true, portal_email: email }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        console.error('[portal-signup-link-contact] invite update failed:', errText);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Contact update failed: ' + errText }) };
      }
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ contact_id: invite_contact_id, created: false }) };
    }

    // Path B — self-signup: insert a new contact
    // Note: contact_type is a Postgres text[] — send as a JS array, NOT a stringified JSON literal
    const insertPayload = {
      first_name: first_name || null,
      last_name: last_name || null,
      email,
      phone: phone || null,
      contact_type: ['buyer'], // proper JS array — PostgREST translates to Postgres text[]
      has_portal_access: true,
      portal_email: email,
      portal_user_id,
      custom_fields: {
        estimated_liquidity: liquidity || null,
        terms_agreed_at: new Date().toISOString(),
        terms_signed_name: terms_signed_name || legal_name || null,
        terms_version: 'DOM-v1.0-2026',
      },
    };

    const insRes = await fetch(
      SUPABASE_URL + '/rest/v1/contacts',
      {
        method: 'POST',
        headers: Object.assign({}, sbHeaders, { 'Prefer': 'return=representation' }),
        body: JSON.stringify(insertPayload),
      }
    );

    if (!insRes.ok) {
      const errText = await insRes.text();
      console.error('[portal-signup-link-contact] insert failed:', errText);
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Contact insert failed: ' + errText }) };
    }

    const rows = await insRes.json();
    const newId = rows && rows[0] && rows[0].id;
    if (!newId) {
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Insert succeeded but no id returned' }) };
    }

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ contact_id: newId, created: true }) };
  } catch (err) {
    console.error('[portal-signup-link-contact] unexpected error:', err);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: err.message || String(err) }) };
  }
};

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-dom-internal-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
