# DOM Investor Portal — Dev2 Handoff Document
**Date:** April 21, 2026  
**Agent:** Dev2  
**Status:** Active development

---

## LIVE SITE
- **URL:** https://deals.directoffmarket.com
- **Netlify site name:** dom-investor-portal
- **Netlify site ID:** 184099a7-4f10-453a-b9c8-0600abf821f8
- **Git tag:** v1.4.21 (last clean checkpoint)

## REPOSITORY
- **Local path:** `/Users/agent.fuego/.openclaw/workspace/projects/dom-investor/`
- **GitHub:** NOT pushed. Local git only. No remote set.
- **To push:** `cd /Users/agent.fuego/.openclaw/workspace/projects/dom-investor && git remote add origin https://ghp_***REDACTED***@github.com/brock-stack/dom-investor-portal.git && git push -u origin main`

---

## TECH STACK
- Pure HTML/CSS/JS (no frameworks, no build tools)
- Supabase JS v2 via CDN for auth + data
- Mapbox GL JS v3.9.0 for marketplace map
- Google Maps JS API (already loaded in deal.html for location teaser)
- Netlify hosting + functions
- Font: Barlow + Inter (Google Fonts)

---

## SUPABASE PROJECT
- **URL:** https://spvuknwwppqsbyrfduvw.supabase.co
- **Anon key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdnVrbnd3cHBxc2J5cmZkdXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzE0ODUsImV4cCI6MjA5MTI0NzQ4NX0.sQ2aadeoio-zx5ttbEXMP_TKkvVgerwk6AjJ2tC2Mh0
- **Service role key:** in DOM_CREDENTIALS.md

## NEW TABLES CREATED (for investor portal)

### portal_listings
```sql
id uuid PK, property_id uuid FK→properties, listing_id uuid FK→listings,
status text DEFAULT 'draft', featured boolean DEFAULT false,
published_at timestamptz, published_by uuid, visible_to text DEFAULT 'all',
asking_price numeric, assignment_fee numeric,
open_house_date timestamptz, open_house_end timestamptz, offer_deadline timestamptz,
notes text, created_at timestamptz, updated_at timestamptz
```
**RLS:** Anon key can SELECT where status='published'

### investor_interest
```sql
id uuid PK, portal_listing_id uuid FK→portal_listings, investor_id uuid FK→contacts,
type text, offer_amount numeric, offer_deed_name text, offer_financing boolean,
offer_pm_interest boolean, agent_name text, agent_email text, agent_phone text,
agent_brokerage text, notes text, meta jsonb, created_at timestamptz
```
**RLS:** Auth user can SELECT own rows + INSERT

### listing_photos (existed, RLS added)
**RLS added:** Anon key can SELECT all (needed for public photo display)

### newsletter_subscribers (needs to be created)
```sql
CREATE TABLE newsletter_subscribers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL, subscribed_at timestamptz DEFAULT now());
```
⚠️ This table does NOT exist yet. Newsletter signup will fail silently until created.

---

## PAGES BUILT

### `index.html` — Smart Redirect
Checks Supabase session → logged in = marketplace.html, not logged in = homepage.html

### `homepage.html` — Public Landing Page
**Sections (in order):**
1. Nav: static HTML, DOM logo left, Sign In + Get Access right, always dark #1a1e38
2. Hero: aerial Florida photo background (/img/hero-bg.jpg), trust badges eyebrow, 2-line headline, Browse Inventory (white btn) + Get Investor Access (blue btn)
3. Featured Deals: auth-aware cards, photos for logged-out users, address masking (city/state only when logged out), List Price + ARV shown, carousel if >3 featured listings
4. How It Works: 3 SVG icon cards, watermark step numbers, clickable, dotted connector line, "Create Your Free Account" CTA
5. DOM Difference: 6 benefit cards with SVG icons, orange top border accent, hover lift
6. Testimonials: 3 placeholder quote cards with initials avatars
7. Recent Closings: static Florida placeholder data (Cape Coral, North Port, Kissimmee)
8. FAQ: 7 accordion Q&As, toggleFaq() function
9. CTA Strip: orange "Get Investor Access" + ghost white "Browse Deals", auth-aware
10. Footer: newsletter signup bar, 4-col links + social icons, Equal Housing logo, dynamic year, ToS/Privacy links

### `login.html` — Auth Page
- Email + password login
- Forgot password (Supabase resetPasswordForEmail)
- Redirects to marketplace or ?redirect= param on success
- "Sign in required" message from ?msg=signin_required
- Logo swaps between dark/light mode (dom-logo-white.png vs dom-logo-dark.png)

### `signup.html` — 2-Phase Registration
- Phase 1: Registration form (name, email, phone, password, estimated liquidity)
- Phase 2: 7-section terms agreement with checkbox per section + type-to-sign field
- Creates Supabase auth user + contacts table record on submit
- Instant access (no approval queue)
- Stores: terms_agreed_at, terms_signed_name, terms_version in contact custom_fields

### `marketplace.html` — Deal Feed + Map
**Map:**
- Mapbox GL JS v3.9.0, custom style: mapbox://styles/brockchain8/cmho8hego005r01s5868kaoci
- Token: MAPBOX_TOKEN_PLACEHOLDER
- WebGL guard (checks availability before init so crashes don't block listings)
- Map controls: dark navy container, sky blue text -- Map/Satellite/Dark/Mono + Flood Zones + Reset Map
- Markers: sky blue #4fc3f7 fill, navy #1a2744 border
- Popup: white bg, status badge, full address 2 lines, List Price + ARV side by side, "View Deal" navy/sky blue
- Flood zone toggle (coming soon), Reset Map button

**Listing Panel (right side, 480px wide):**
- Filter pills: All / Available / Pending / Coming Soon
- List/Tile view toggle
- List view (LOCKED - do not change): 140x110px photo, 2-row address, 2-row specs, List Price 17px navy + ARV 14px slate, 6px gap between cards
- Tile view: 2-col grid, 150px photo, same spec rows, List Price + ARV side by side

**Auth:** requireAuth() -- redirects to login with message if no session
**Address:** always shows full address (logged in required to reach this page)

### `deal.html` — Deal Detail Page (RECENTLY REDESIGNED)
**Header:** Full white address 22px, inline status badge, white Make an Offer + Express Interest buttons
**Gallery:** 60/40 split -- main photo left, 2x2 thumbnail grid right, fullscreen modal with keyboard nav + swipe
**KPI Strip:** Asking Price (blue), Beds, Baths, Sqft, Year Built with SVG icons + dividers
**Tab Bar:** 14px, blue active underline, gray bottom border
**Overview Tab (5 sections):**
1. Property Summary (title, description, address, days on portal)
2. Financial Snapshot 2-col (stats grid left, CTAs right)
3. Key Features pills (beds/baths/sqft/pool/garage/lot)
4. Property Description
5. Location mini-map (Mapbox or placeholder)
**Other Tabs:** Pro Forma (live calculator, save + PDF), Property Details, Photos (gallery), Map & Comps
**Footer bar:** "Questions about this property? Contact Us →"
**All gold eliminated:** uses #3b82f6 blue + #64748b gray throughout
**Pro forma calculator:** fully functional with all metrics (CoC, cap rate, IRR, exit returns)

### `offer.html` — Make an Offer (3-step)
- Step 1: Property summary + disclaimer
- Step 2: Offer form (price, deed name, financing, PM interest, buyer's agent capture)
- Step 3: Confirmation
- Writes to investor_interest table

### `dashboard.html` — Investor Dashboard (SKELETON)
- 5 tabs: Dashboard | Favorites | Offers | Pro Formas | Transactions
- Dashboard tab: Buy Box form (maps to contacts table custom_fields)
- Other 4 tabs: "Coming soon" placeholder
- ⚠️ Not fully built yet

### `404.html` — Branded 404 page

---

## SHARED INFRASTRUCTURE

### `js/investor-auth.js`
- `Portal.supabase` -- Supabase client (anon key)
- `Portal.getSession()` -- get current auth session
- `Portal.requireAuth()` -- redirect to login if no session, stores intended URL in sessionStorage
- `Portal.getProfile(userId)` -- get contact record by portal_user_id
- `Portal.fc(n)` -- format currency $X,XXX
- `Portal.initTheme()` -- apply saved dark/light theme
- `Portal.toggleTheme()` -- switch and persist theme
- `Portal.updateThemeBtn()` -- sync theme toggle button icon
- `Portal.renderNav(opts)` -- NOT used on homepage (static HTML), used on auth pages
- `Portal.logout()` -- sign out + redirect homepage
- `Portal.toast(msg, type)` -- show toast notification

### `css/investor.css`
**CSS Variables (dark mode default):**
- --bg: #181c2e, --surface: #1e2340, --surface-2: #252c50
- --border: rgba(255,255,255,0.09), --text: #f0f4ff, --text-muted: #8a9bbf
- --accent: #4fc3f7 (sky blue -- DOM logo color)
- --navy: #2d3560, --navy-dark: #1a1e38
- --gold: #4fc3f7 (alias, same as accent)

**Light mode override:** Same --accent #4fc3f7 (intentional -- sky blue works on both)
**Nav:** always background #1a1e38 !important regardless of theme

### Images in /img/
- dom-logo-white.png -- full logo, white text on transparent (for dark backgrounds)
- dom-logo-dark.png -- partial logo (navy text, missing "DIRECT" -- only use for light cards)
- equal-housing.png -- white on transparent (official Equal Housing logo)
- hero-bg.jpg -- aerial Florida neighborhood photo (sunset, canals)
- favicon-32.png, favicon-16.png -- circular DOM pin icon

### Netlify functions in /netlify/functions/
- upload-attachment.js -- handles file uploads to Supabase storage (base64 JSON)

---

## COLOR SYSTEM (FINAL, DO NOT CHANGE)
- **Primary accent:** #4fc3f7 (sky blue from DOM logo)
- **Secondary accent:** #2d6a8f (muted slate blue for ARV values)
- **Primary CTA:** #f97316 (orange -- for "Get Investor Access" buttons)
- **Navy bg:** #1a2744 or #1a1e38
- **Green (available):** #22c55e
- **Red (negative):** #ef4444
- **ZERO gold anywhere** -- if you see any #c9a84c, #d4a853, #f59e0b, replace with above

---

## ARCHITECTURE DECISIONS

1. **Same Supabase project** as DOM AI admin site (spvuknwwppqsbyrfduvw). No separate backend.
2. **Instant access** -- sign up + sign terms = immediate portal access. No admin approval queue.
3. **Address masking** -- logged out = city/state only; logged in = full address visible
4. **Pro forma** -- loads with property defaults, investor edits are NOT auto-saved. Page reload resets.
5. **Publish to Portal** -- button added to DOM AI listings.html by Dom-Dev. Creates portal_listings record.
6. **MNR branding** -- NEVER on investor portal. DOM LLC only. MNR only in vendor directory.
7. **Dark/light theme** -- localStorage key: dom_portal_theme. Toggle in nav on every page.
8. **Auth gate** -- all pages except homepage require login. requireAuth() handles redirect + post-login redirect back to intended URL.
9. **Mapbox** -- custom style + FEMA flood zones. Token in js/investor-auth.js. WebGL guard prevents crashes.
10. **No frameworks** -- vanilla JS throughout. No React, Vue, etc.

---

## WHAT'S INCOMPLETE / TODO

### HIGH PRIORITY
- [ ] Dashboard tabs (Favorites, Offers, Pro Formas, Transactions) -- only skeletons exist
- [ ] newsletter_subscribers table -- needs to be created in Supabase
- [ ] Offer flow: buyer's agent auto-create (contact/org records) -- stubbed as TODO
- [ ] GitHub push -- repo is local only

### MEDIUM PRIORITY  
- [ ] Flood zone toggle on marketplace map (currently shows "coming soon")
- [ ] Real testimonials -- currently placeholder names
- [ ] Real recent closings data -- currently static placeholders
- [ ] Dashboard buy box saves to contacts table (form exists, save logic needs verification)
- [ ] Notification system (offer status updates, deal alerts)
- [ ] Lender Marketplace page (/lender-marketplace.html) -- not built
- [ ] Investor Tools page (/tools.html) -- not built
- [ ] Contact Us page (/contact.html) -- footer links to it but page doesn't exist
- [ ] Privacy Policy page (/privacy.html) -- not built
- [ ] Terms of Service page (/terms.html) -- not built
- [ ] FAQ page (/faq.html) -- not built

### LOW PRIORITY
- [ ] Share listing + referral tracking
- [ ] Deal alerts / notification preferences
- [ ] Transaction detail pages with document access
- [ ] Pro forma PDF export (currently shows info toast)
- [ ] Video embed on homepage (placeholder exists)
- [ ] Blog/articles section

---

## DEPLOY PROCESS
```bash
cd /Users/agent.fuego/.openclaw/workspace/projects/dom-investor
npx netlify-cli deploy --prod --dir=. --site=184099a7-4f10-453a-b9c8-0600abf821f8
```

## CRITICAL RULES
1. List view on marketplace -- DO NOT CHANGE unless Brock explicitly requests
2. No gold colors anywhere on the site
3. No deploying to production without Brock's approval
4. newsletter_subscribers table doesn't exist -- handle gracefully (currently does silent fail)
5. Dom-Dev owns the DOM AI admin site (ai.directoffmarket.com). Coordinate with him via Brock.
