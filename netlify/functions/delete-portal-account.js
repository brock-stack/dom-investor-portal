// netlify/functions/delete-portal-account.js
// v2.5.1 — NULL contact_id guard (D8) + Rider C resume path (D10)
//
// Tombstone-first cascade (D3). Verifies caller can only delete themselves.
// Re-verifies password server-side. Idempotent on partial failure (re-submit resumes).
// Schema-Before-Code: requires deleted_portal_users table + contacts.portal_deleted_at
// column to be live before this function deploys.
//
// Env vars required (fail-closed at boot):
//   SUPABASE_URL              — e.g. https://spvuknwwppqsbyrfduvw.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service role JWT (bypasses RLS)

'use strict';

const SB_URL = process.env.SUPABASE_URL;
const SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Boot-time env check — module-level so it's evaluated once on cold start.
// Handler will return 500 if either is missing.
const BOOT_OK = !!(SB_URL && SVC);
if (!BOOT_OK) {
  console.error('[delete-portal-account] FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing at boot');
}

// ── Low-level REST helpers ────────────────────────────────────────────────

const SVC_HEADERS = () => ({
  apikey: SVC,
  Authorization: `Bearer ${SVC}`,
  'Content-Type': 'application/json',
});

async function sbSelect(table, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${SB_URL}/rest/v1/${table}${qs ? '?' + qs : ''}`;
  const r = await fetch(url, { headers: SVC_HEADERS() });
  const data = await r.json();
  if (!r.ok) throw Object.assign(new Error(data?.message || `sbSelect ${table} error`), { sbStatus: r.status, data });
  return data; // always an array
}

async function sbInsert(table, body) {
  const url = `${SB_URL}/rest/v1/${table}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { ...SVC_HEADERS(), Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw Object.assign(new Error(data?.message || `sbInsert ${table} error`), { sbStatus: r.status, data });
  return data; // array of inserted rows
}

async function sbPatch(table, filter, body) {
  const url = `${SB_URL}/rest/v1/${table}?${filter}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { ...SVC_HEADERS(), Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw Object.assign(new Error(data?.message || `sbPatch ${table} error`), { sbStatus: r.status, data });
  }
}

async function sbDelete(table, filter) {
  const url = `${SB_URL}/rest/v1/${table}?${filter}`;
  const r = await fetch(url, { method: 'DELETE', headers: SVC_HEADERS() });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw Object.assign(new Error(data?.message || `sbDelete ${table} error`), { sbStatus: r.status, data });
  }
}

async function sbDeleteOr(table, orExpr) {
  // For OR conditions: /rest/v1/table?or=(col1.eq.val1,col2.eq.val2)
  const url = `${SB_URL}/rest/v1/${table}?or=(${orExpr})`;
  const r = await fetch(url, { method: 'DELETE', headers: SVC_HEADERS() });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw Object.assign(new Error(data?.message || `sbDeleteOr ${table} error`), { sbStatus: r.status, data });
  }
}

// ── Auth helpers ──────────────────────────────────────────────────────────

async function getAuthUser(jwt) {
  const r = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SVC, Authorization: `Bearer ${jwt}` },
  });
  if (!r.ok) return null;
  return r.json();
}

async function reVerifyPassword(email, password) {
  // Fresh sign-in against auth endpoint — does NOT touch caller's session (server-side call).
  // Uses service role key as apikey; password verification is enforced regardless.
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SVC, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return r.ok; // 200 = valid credentials, non-200 = wrong password / user not found
}

async function deleteAuthUser(userId) {
  const r = await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
  });
  if (r.status === 404) return; // already deleted — idempotent
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw Object.assign(new Error(data?.message || 'auth.admin.deleteUser error'), { sbStatus: r.status });
  }
}

// ── Storage helpers ───────────────────────────────────────────────────────

function extractAvatarPath(avatarUrl) {
  if (!avatarUrl) return null;
  // URL pattern: .../storage/v1/object/public/avatars/<filename>
  const m = avatarUrl.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/);
  return m ? m[1] : null;
}

async function deleteStorageFiles(bucket, paths) {
  if (!paths || paths.length === 0) return;
  // Supabase Storage batch delete: DELETE /storage/v1/object with JSON body { prefixes: [...] }
  const r = await fetch(`${SB_URL}/storage/v1/object/${bucket}`, {
    method: 'DELETE',
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    // Non-fatal: log and continue — tombstone is already in place.
    console.warn(`[delete-portal-account] Storage delete warning (${bucket}):`, JSON.stringify(data));
  }
}

// ── Response helper ───────────────────────────────────────────────────────

function resp(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}

// ── Main handler ──────────────────────────────────────────────────────────

exports.handler = async function(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' }, body: '' };
  }

  // POST-only
  if (event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method not allowed' });
  }

  // Boot check
  if (!BOOT_OK) {
    return resp(500, { error: 'Service configuration error' });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let password;
  try {
    const body = JSON.parse(event.body || '{}');
    password = body.password;
  } catch (_) {
    return resp(400, { error: 'Invalid request body' });
  }
  if (!password) return resp(400, { error: 'Password required' });

  // ── Step 1: Verify JWT ───────────────────────────────────────────────────
  const rawAuth = event.headers.authorization || event.headers.Authorization || '';
  const jwt = rawAuth.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return resp(401, { error: 'Unauthorized' });

  const authUser = await getAuthUser(jwt);
  if (!authUser || !authUser.id) return resp(401, { error: 'Invalid session' });

  const AUTH_ID = authUser.id;
  const userEmail = authUser.email;

  // ── Step 1b: Re-verify password (server-side, session-preserving) ────────
  const pwOk = await reVerifyPassword(userEmail, password);
  if (!pwOk) return resp(401, { error: 'Incorrect password' });

  // ── Step 2: Load portal user context ────────────────────────────────────
  let portalRows;
  try {
    portalRows = await sbSelect('portal_users', {
      'user_id': `eq.${AUTH_ID}`,
      'select': 'id,contact_id,email,first_name,last_name,created_at,avatar_url',
    });
  } catch (e) {
    return resp(500, { error: 'Failed to load portal user', detail: e.message });
  }

  const portalUser = portalRows[0] || null;
  if (!portalUser) {
    // v2.5.1 (D10 / Rider C): resume from orphaned auth.users when a matching
    // tombstone already exists from a prior partial run (e.g. Step 4.21 failed).
    let tombstoneRows = [];
    try {
      tombstoneRows = await sbSelect('deleted_portal_users', {
        'email': `eq.${userEmail}`,
        'select': 'id,portal_user_id,deleted_at',
        'order': 'deleted_at.desc',
        'limit': '1',
      });
      // If exact-case match finds nothing, retry case-insensitively
      if (!tombstoneRows || tombstoneRows.length === 0) {
        tombstoneRows = await sbSelect('deleted_portal_users', {
          'email': `ilike.${userEmail}`,
          'select': 'id,portal_user_id,deleted_at',
          'order': 'deleted_at.desc',
          'limit': '1',
        });
      }
    } catch (_) { tombstoneRows = []; }
    if (tombstoneRows && tombstoneRows.length > 0) {
      const t = tombstoneRows[0];
      console.info(`[delete] v2.5.1 resume: tombstone found for ${userEmail}, resuming from Step 4.21`);
      try {
        await deleteAuthUser(AUTH_ID);
      } catch (e) {
        return resp(500, { error: 'Resume path failed at auth delete', detail: e.message, tombstone_id: t.id });
      }
      return resp(200, { ok: true, resumed: true, tombstone_id: t.id, resumed_at: new Date().toISOString() });
    }
    return resp(404, { error: 'No portal account for this user' });
  }

  const PID = portalUser.id;           // portal_users.id
  const CID = portalUser.contact_id;   // contacts.id
  const hasContact = !!CID; // v2.5.1 (D8): 3 live portal_users have contact_id=NULL; cascade must skip contact-keyed steps when hasContact === false.
  console.info(`[delete] v2.5.1: PID=${PID}, CID=${CID || 'null'}, hasContact=${hasContact}`);

  // ── Step 2b (D7): Load at-risk accepted offers with no linked transaction ─
  let atRiskOffers = [];
  try {
    const acceptedOffers = await sbSelect('investor_offers', {
      'user_id': `eq.${PID}`,
      'status': `eq.accepted`,
      'select': 'id,listing_id,property_address,offer_amount,status',
    });
    // Filter: exclude any offer that has a linked transaction (buyer_offer_id match)
    for (const offer of (acceptedOffers || [])) {
      try {
        const txns = await sbSelect('transactions', {
          'buyer_offer_id': `eq.${offer.id}`,
          'select': 'id',
          'limit': '1',
        });
        if (!txns || txns.length === 0) atRiskOffers.push(offer);
      } catch (_) {
        // If transactions check fails, conservatively treat as at-risk
        atRiskOffers.push(offer);
      }
    }
  } catch (e) {
    console.warn('[delete-portal-account] Step 2b at-risk offer check failed (non-fatal):', e.message);
  }

  // ── Pre-cache storage paths (must happen before 4.7 and 4.20 delete rows) ─
  const avatarPath = extractAvatarPath(portalUser.avatar_url);
  let agreementPaths = [];
  try {
    const agRows = await sbSelect('investor_agreements', {
      'user_id': `eq.${PID}`,
      'select': 'pdf_storage_path',
    });
    agreementPaths = (agRows || []).map(r => r.pdf_storage_path).filter(Boolean);
  } catch (e) {
    console.warn('[delete-portal-account] Agreement path cache failed (non-fatal):', e.message);
  }

  // ── Step 3a: Tombstone-first (D3) — idempotent ────────────────────────────
  let tombstoneId;
  try {
    const existing = await sbSelect('deleted_portal_users', {
      'portal_user_id': `eq.${PID}`,
      'email': `eq.${portalUser.email}`,
      'select': 'id',
    });
    if (existing && existing.length > 0) {
      // Previous partial run left a tombstone — resume cascade without re-inserting.
      tombstoneId = existing[0].id;
      console.log(`[delete-portal-account] Existing tombstone ${tombstoneId} found — resuming cascade`);
    } else {
      const inserted = await sbInsert('deleted_portal_users', {
        portal_user_id: PID,
        email: portalUser.email,
        first_name: portalUser.first_name || null,
        last_name: portalUser.last_name || null,
        signed_up_at: portalUser.created_at,
        deleted_at: new Date().toISOString(),
        unsubscribed: false,
      });
      tombstoneId = inserted[0]?.id;
    }
  } catch (e) {
    // Tombstone failed — D3 requires abort, nothing destroyed.
    return resp(500, { error: 'Deletion aborted: could not create audit record', detail: e.message });
  }

  // ── Step 3b (D7): Mid-deal CRM notification ───────────────────────────────
  if (atRiskOffers.length > 0) {
    try {
      const offerList = atRiskOffers
        .map(o => `${o.property_address || 'unknown address'} @ $${(o.offer_amount || 0).toLocaleString()}`)
        .join('; ');
      const notifBody = 'Investor deleted portal account with an accepted offer in flight — deal at risk, human follow-up required.';

      // 1. activity_events record — D9: use contact or portal_user fallback when CID is null
      const aeRecordType = hasContact ? 'contacts' : 'portal_user_deletion';
      const aeRecordId   = hasContact ? CID : PID;
      const aeEventData  = {
        portal_user_id: PID,
        email: portalUser.email,
        at_risk_offers: atRiskOffers.map(o => ({
          property_address: o.property_address,
          offer_amount: o.offer_amount,
        })),
        ...(!hasContact && {
          contact_id_at_deletion: null,
          note: 'No CRM contact linked at deletion time — flag applied to portal_user_id instead.',
        }),
      };
      await sbInsert('activity_events', {
        record_type: aeRecordType,
        record_id: aeRecordId,
        event_type: 'investor_deleted_mid_deal',
        event_data: aeEventData,
        body: notifBody,
        created_by: null,
        mentioned_users: null,
      });

      // 2. tasks row — same D9 fallback
      const fullName = [portalUser.first_name, portalUser.last_name].filter(Boolean).join(' ') || userEmail;
      await sbInsert('tasks', {
        title: `Deal at risk: ${fullName} deleted portal account with accepted offer in flight`,
        description: offerList,
        record_type: hasContact ? 'contacts' : 'portal_user_deletion',
        record_id: hasContact ? CID : PID,
        task_type: 'follow_up',
        status: 'open',
        source: 'system',
      });
    } catch (e) {
      // D7 notification is non-fatal — tombstone is already in place.
      console.error('[delete-portal-account] D7 notification failed (non-fatal):', e.message);
    }
  }

  // ── Step 4: Cascade WIPE (FK-safe order) ─────────────────────────────────
  // All deletes are idempotent (deleting 0 rows is fine).
  // contacts.custom_fields JSONB key removal requires a fetch-then-patch.

  const steps = [
    // 4.1
    { name: '4.1 investor_transactions',  fn: () => sbDelete('investor_transactions', `user_id=eq.${PID}`) },
    // 4.2
    { name: '4.2 investor_offers',        fn: () => sbDelete('investor_offers', `user_id=eq.${PID}`) },
    // 4.3
    { name: '4.3 investor_saved_proformas', fn: () => sbDelete('investor_saved_proformas', `user_id=eq.${PID}`) },
    // 4.4
    { name: '4.4 investor_saved_deals',   fn: () => sbDelete('investor_saved_deals', `user_id=eq.${PID}`) },
    // 4.5
    { name: '4.5 investor_saved_lenders', fn: () => sbDelete('investor_saved_lenders', `user_id=eq.${PID}`) },
    // 4.6
    { name: '4.6 investor_buy_box',       fn: () => sbDelete('investor_buy_box', `user_id=eq.${PID}`) },
    // 4.7
    { name: '4.7 investor_agreements',    fn: () => sbDelete('investor_agreements', `user_id=eq.${PID}`) },
    // 4.8 — D8: skip when contact_id is NULL
    {
      name: '4.8 favorites',
      fn: () => {
        if (!hasContact) { console.info('[delete] v2.5.1 step 4.8 skipped: no contact_id linked, PID=' + PID); return Promise.resolve(); }
        return sbDelete('favorites', `contact_id=eq.${CID}`);
      },
    },
    // 4.9 — D8: skip when contact_id is NULL
    {
      name: '4.9 cart_items',
      fn: () => {
        if (!hasContact) { console.info('[delete] v2.5.1 step 4.9 skipped: no contact_id linked, PID=' + PID); return Promise.resolve(); }
        return sbDelete('cart_items', `contact_id=eq.${CID}`);
      },
    },
    // 4.10
    { name: '4.10 deal_views',            fn: () => sbDelete('deal_views', `user_id=eq.${AUTH_ID}`) },
    // 4.11 — D8: OR-clause collapses to portal_user_id-only when no contact
    {
      name: '4.11 open_house_rsvps',
      fn: () => hasContact
        ? sbDeleteOr('open_house_rsvps', `portal_user_id.eq.${PID},contact_id.eq.${CID}`)
        : sbDelete('open_house_rsvps', `portal_user_id=eq.${PID}`),
    },
    // 4.12 — D8: skip when contact_id is NULL
    {
      name: '4.12 portal_activity',
      fn: () => {
        if (!hasContact) { console.info('[delete] v2.5.1 step 4.12 skipped: no contact_id linked, PID=' + PID); return Promise.resolve(); }
        return sbDelete('portal_activity', `contact_id=eq.${CID}`);
      },
    },
    // 4.13 — D8: skip when contact_id is NULL
    {
      name: '4.13 portal_invites',
      fn: () => {
        if (!hasContact) { console.info('[delete] v2.5.1 step 4.13 skipped: no contact_id linked, PID=' + PID); return Promise.resolve(); }
        return sbDelete('portal_invites', `contact_id=eq.${CID}`);
      },
    },
    // 4.14
    { name: '4.14 blast_recipients',      fn: () => sbDelete('blast_recipients', `portal_user_id=eq.${PID}`) },
    // 4.15
    { name: '4.15 push_subscriptions',    fn: () => sbDelete('push_subscriptions', `user_id=eq.${AUTH_ID}`) },
    // 4.16
    { name: '4.16 sms_reads',             fn: () => sbDelete('sms_reads', `user_id=eq.${AUTH_ID}`) },
    // 4.17
    { name: '4.17 mention_reads',         fn: () => sbDelete('mention_reads', `user_id=eq.${AUTH_ID}`) },
    // 4.18 Storage cleanup (avatar + agreements)
    {
      name: '4.18 storage',
      fn: async () => {
        if (avatarPath) await deleteStorageFiles('avatars', [avatarPath]);
        if (agreementPaths.length > 0) await deleteStorageFiles('agreements', agreementPaths);
      },
    },
    // 4.19 contacts: retain with flags (D5) — D8: skip entirely when no contact
    {
      name: '4.19 contacts_flag',
      fn: async () => {
        if (!hasContact) {
          console.info('[delete] v2.5.1 step 4.19 skipped: no contact_id linked, PID=' + PID);
          return;
        }
        // JSONB key removal: fetch current custom_fields, strip portal-specific keys, re-patch.
        let cf = {};
        try {
          const ctRows = await sbSelect('contacts', { 'id': `eq.${CID}`, 'select': 'custom_fields' });
          cf = (ctRows[0]?.custom_fields) || {};
        } catch (_) { /* safe to proceed with empty cf */ }

        // Strip portal-specific JSONB keys per spec
        delete cf.estimated_liquidity;
        delete cf.terms_agreed_at;
        delete cf.terms_signed_name;
        delete cf.legal_name;

        await sbPatch('contacts', `id=eq.${CID}`, {
          has_portal_access: false,
          portal_deleted_at: new Date().toISOString(),
          portal_user_id: null,
          portal_email: null,
          custom_fields: Object.keys(cf).length > 0 ? cf : null,
        });
      },
    },
    // 4.20 Delete portal_users row
    { name: '4.20 portal_users', fn: () => sbDelete('portal_users', `id=eq.${PID}`) },
    // 4.21 Delete auth.users (last — invalidates all sessions)
    { name: '4.21 auth.users', fn: () => deleteAuthUser(AUTH_ID) },
  ];

  for (const step of steps) {
    try {
      await step.fn();
    } catch (e) {
      console.error(`[delete-portal-account] Step ${step.name} failed:`, e.message, e.data || '');
      return resp(500, {
        error: `Deletion partially completed. Step ${step.name} failed.`,
        step: step.name,
        detail: e.message,
        tombstone_id: tombstoneId,
        retryable: true,
      });
    }
  }

  return resp(200, {
    ok: true,
    deleted_at: new Date().toISOString(),
    tombstone_id: tombstoneId,
  });
};
