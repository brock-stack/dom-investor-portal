# Claude Task: Build DOM Investor Portal

## TECH STACK
- Pure HTML/CSS/JS -- no frameworks, no build tools
- Supabase JS v2 via CDN
- Mapbox GL JS v3
- Netlify hosting

## SUPABASE
- URL: https://spvuknwwppqsbyrfduvw.supabase.co
- Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdnVrbnd3cHBxc2J5cmZkdXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzE0ODUsImV4cCI6MjA5MTI0NzQ4NX0.sQ2aadeoio-zx5ttbEXMP_TKkvVgerwk6AjJ2tC2Mh0

## MAPBOX
- Token: MAPBOX_TOKEN_PLACEHOLDER
- Custom style: mapbox://styles/brockchain8/cmho8hego005r01s5868kaoci

## BRAND
- Company: Direct Off Market, LLC (NEVER "My New Rental" in portal branding)
- Colors: Navy #1a2744, Gold #c9a84c, Dark bg #0f1a2e
- Font: Inter (Google Fonts)
- Dark + Light mode required (toggle in nav, localStorage key "dom_portal_theme")

## CRITICAL RULES
1. Instant access: signup + sign terms = immediate access. NO admin approval queue.
2. Address masking: Not logged in = city/state only. Logged in = full address visible.
3. Pro forma: loads with our default numbers from property record. Investor edits are live but NOT auto-saved. Page reload resets to defaults. Save Pro Forma = explicit action.
4. Direct Off Market LLC branding only. MNR only in PM contexts (vendor directory, offer form PM question).

## FILES TO BUILD

### css/investor.css
Complete CSS:
- CSS variables dark (default): --bg #0f1a2e, --surface #1a2744, --surface-2 #1e2d52, --border rgba(255,255,255,0.1), --text #e8edf5, --text-muted #8a9bbf, --gold #c9a84c, --green #22c55e, --red #ef4444, --amber #f59e0b
- Light mode via [data-theme="light"]: --bg #f8f9fc, --surface #ffffff, --surface-2 #f1f4fa, --border rgba(0,0,0,0.08), --text #1a2744, --text-muted #5a6e90
- .investor-nav: fixed top, 64px height, blur backdrop, flex between logo and right actions
- .btn-primary (gold bg, navy text), .btn-secondary (transparent gold border), .btn-sm variant
- .badge-available (green), .badge-pending (amber), .badge-sold (gray), .badge-coming-soon (blue)
- .deal-card: hover lift, photo top 200px cover, content below, status badge overlay top-right
- .tab-bar, .tab-btn (active state gold underline)
- .pro-forma-input: light blue bg (#dbeafe in dark, #eff6ff in light) to signal investor-editable
- .form-input, .form-label
- .theme-toggle: icon button, 36px circle
- .auth-page: centered card layout, max-width 460px
- .step-indicator: numbered steps with active/complete states
- Hero section: min 80vh, dark overlay, centered content
- Footer: dark bg, Equal Housing logo area, link columns
- Responsive: 768px (tablet), 480px (mobile)

### js/investor-auth.js
```javascript
const _sb = window.supabase.createClient(
  'https://spvuknwwppqsbyrfduvw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdnVrbnd3cHBxc2J5cmZkdXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzE0ODUsImV4cCI6MjA5MTI0NzQ4NX0.sQ2aadeoio-zx5ttbEXMP_TKkvVgerwk6AjJ2tC2Mh0'
);

window.Portal = {
  supabase: _sb,

  async getSession() {
    const { data } = await _sb.auth.getSession();
    return data?.session || null;
  },

  async requireAuth() {
    const session = await this.getSession();
    if (!session) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
      return null;
    }
    return session;
  },

  async getProfile(userId) {
    const { data } = await _sb.from('contacts')
      .select('id, first_name, last_name, email, phone, contact_type, custom_fields')
      .eq('portal_user_id', userId)
      .maybeSingle();
    return data;
  },

  fc(n) {
    if (n == null || n === '') return '—';
    return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  },

  initTheme() {
    const saved = localStorage.getItem('dom_portal_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeBtn();
  },

  toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dom_portal_theme', next);
    this.updateThemeBtn();
  },

  updateThemeBtn() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    document.querySelectorAll('.theme-toggle').forEach(b => {
      b.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
  },

  async renderNav(opts) {
    opts = opts || {};
    const nav = document.getElementById('investorNav');
    if (!nav) return;
    const session = await this.getSession();
    let right = '';
    if (session && !opts.publicOnly) {
      const profile = await this.getProfile(session.user.id);
      const name = profile ? (profile.first_name || session.user.email.split('@')[0]) : 'Investor';
      const path = window.location.pathname;
      right = '<a href="/marketplace.html" class="nav-link' + (path.includes('marketplace') ? ' active' : '') + '">Marketplace</a>' +
              '<a href="/dashboard.html" class="nav-link' + (path.includes('dashboard') ? ' active' : '') + '">Dashboard</a>' +
              '<div class="nav-user"><span>' + name + '</span><button onclick="Portal.logout()" class="btn-logout">Sign Out</button></div>';
    } else {
      right = '<a href="/login.html" class="btn-secondary btn-sm">Sign In</a><a href="/signup.html" class="btn-primary btn-sm">Get Access</a>';
    }
    nav.innerHTML = '<a href="/homepage.html" class="nav-brand"><span class="nav-logo">DIRECT OFF MARKET</span><span class="nav-sub">Investor Portal</span></a>' +
      '<div class="nav-right">' + right + '<button class="theme-toggle" onclick="Portal.toggleTheme()" title="Toggle theme"></button></div>';
    this.updateThemeBtn();
  },

  async logout() {
    await _sb.auth.signOut();
    window.location.href = '/homepage.html';
  },

  toast(msg, type) {
    type = type || 'info';
    let t = document.getElementById('portalToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'portalToast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;max-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.4);transition:opacity 0.3s;opacity:0';
      document.body.appendChild(t);
    }
    const bg = { success: '#22c55e', error: '#ef4444', info: '#c9a84c' };
    t.style.background = bg[type] || bg.info;
    t.style.color = '#0f1a2e';
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.style.opacity = '0'; }, 3500);
  }
};

(function() { Portal.initTheme(); })();
```

### index.html
Smart redirect. Check session. Logged in → marketplace.html. Not logged in → homepage.html.
Show minimal DOM-branded loading spinner while checking.

### homepage.html
Public landing page. Nav with publicOnly: true.

Structure:
1. Hero (min-height: 85vh): Navy/dark gradient bg. Center: "DIRECT OFF MARKET" small gold tag, then H1: "Off-Market Investment Deals.\nCurated. Verified. Ready." (line break in the H1). Subhead: "We're investors ourselves. We know what a good deal actually is." Two buttons: "Browse Inventory" (→ marketplace, but middleware redirects to login if not authed) and "Get Investor Access →" (→ signup.html). Below buttons: small text "Instant access · Sign terms · Start investing"

2. Featured Inventory strip: "Featured Deals" heading. Load portal_listings WHERE status='published' AND featured=true LIMIT 3. Each mini card: property photo (placeholder if none), city+state ONLY (not address), type/beds/baths, asking price (gold). "View Deal →" → login.html. Handle empty: "Check back soon for featured deals." Handle table missing: same empty state.

3. Three value props in card row: 
   - "Curated Inventory" icon 🏠, "Every deal is underwritten by our team before it hits the portal."
   - "Interactive Pro Forma" icon 📊, "Run your own numbers on every deal. Adjust assumptions, see returns in real time."  
   - "Flood Zone Maps" icon 🗺️, "FEMA flood zone data overlaid on every listing. Know your risk before you buy."

4. How It Works steps: 1. Create your account (2 min) 2. Sign the investor agreement 3. Browse & analyze deals 4. Submit your offer. Each step numbered in a gold circle.

5. Video placeholder section: "Hear from Brock" heading, a 16:9 dark placeholder box with play button icon and "Video coming soon" text.

6. Final CTA section: dark bg, "Ready to browse deals?" heading, "Get Investor Access" gold button.

7. Footer: Equal Housing Opportunity text, "© 2026 Direct Off Market, LLC. All rights reserved." Quick links: Marketplace, Lender Marketplace, Investor Tools, Contact Us. Legal disclaimer: "Direct Off Market, LLC is not a licensed real estate broker. All properties are sold as-is. Investors should perform their own due diligence."

### login.html
Auth page layout. No nav (just DOM logo at top).
- DOM logo text centered at top
- "Investor Portal" subtitle
- Email input, Password input
- "Sign In" button (full width, gold)
- Error display
- "Forgot password?" link → triggers Supabase resetPasswordForEmail, shows "Check your email" message
- "Don't have an account? Get Investor Access →" link to signup.html
- If already logged in → redirect to marketplace.html
- On success: check for ?redirect param, or go to marketplace.html

### signup.html
Two-phase. Show phase 1 on load, phase 2 after form submit.

PHASE 1 - Registration form:
- DOM logo at top
- "Create Your Investor Account" heading
- Fields: First Name, Last Name, Email, Phone, Password, Confirm Password
- Estimated Liquidity dropdown: "Under $50K", "$50K - $100K", "$100K - $250K", "$250K - $500K", "$500K+" 
- "Continue to Terms Agreement →" button
- Validate: passwords match, password 8+ chars, email format
- "Already have an account? Sign in" link

PHASE 2 - Terms Agreement (replace phase 1 content):
- "Investor Access Agreement" heading
- "Direct Off Market, LLC" subheading
- Scrollable agreement container (max-height 60vh, overflow-y scroll, border)
- 7 sections with checkboxes. Each section: section number + title as header, 2-3 sentences of placeholder legal text, checkbox "I have read and agree to Section N: [Title]"
  1. Confidentiality & Non-Circumvention - "Investor agrees to maintain strict confidentiality regarding all deal information, seller identities, and pricing provided through this platform. Circumvention of Direct Off Market, LLC in any transaction will result in liquidated damages of $75,000 per occurrence."
  2. Property Types & Transaction Terms - "Properties offered through this marketplace include wholesale assignments, turnkey rentals, and new construction opportunities. Investor understands that wholesale assignments transfer equitable interest only, not title, and that Investor must complete their own due diligence."
  3. Transaction Fees & Closing Costs - "A marketplace service fee of $1,495 and a document preparation fee of $450 apply to all closed transactions. Assignment fees are disclosed per transaction. Investor is responsible for all closing costs unless otherwise specified in writing."
  4. Communication Consent - "Investor consents to receive communications via email and SMS regarding new listings, deal updates, and portal notifications. Standard message and data rates may apply. Investor may opt out at any time."
  5. Electronic Signatures & Records - "Investor consents to the use of electronic signatures and agrees that this agreement executed electronically is legally binding. Records of this agreement including timestamp, IP address, and user agent will be stored securely."
  6. Governing Law - "This agreement shall be governed by the laws of the State of Florida. Any disputes shall be resolved in Sarasota County, Florida."
  7. Final Acknowledgment - "Investor acknowledges they have read, understood, and agree to all terms above, and that this platform provides investment opportunities only and does not constitute financial, legal, or tax advice."

- Type-to-sign field: "Type your full legal name to sign" input
- Date field: auto-filled with today's date (read-only)
- "I Agree & Get Instant Access" button (gold, full width)
- On submit:
  1. Validate all 7 checkboxes checked + legal name typed
  2. Create Supabase auth user with email/password
  3. Insert contact record: first_name, last_name, email, phone, contact_type: '["buyer"]', has_portal_access: true, portal_email: email, custom_fields: { estimated_liquidity: value, terms_agreed_at: ISO timestamp, terms_signed_name: typed name, terms_version: "DOM-v1.0-2026" }
  4. Sign in immediately
  5. Show "Welcome! Redirecting to marketplace..." then redirect to marketplace.html
  6. Handle errors: email already exists (show "Email already registered. Sign in instead."), other errors shown in error div

### marketplace.html
Requires auth. Full-height page layout.

```html
Structure:
<nav id="investorNav"></nav>
<div class="marketplace-layout"> <!-- display:flex, height: calc(100vh - 64px), margin-top: 64px -->
  <div class="marketplace-map" id="mapContainer"> <!-- flex:1, position:relative -->
    <!-- Mapbox renders here -->
    <div class="map-controls"> <!-- absolute top-right -->
      <button class="map-style-btn active" data-style="custom">Map</button>
      <button class="map-style-btn" data-style="satellite-streets-v12">Satellite</button>
      <button class="map-style-btn" data-style="dark-v11">Dark</button>
      <button class="map-style-btn" data-style="light-v11">Mono</button>
    </div>
    <div class="map-legend"> <!-- absolute bottom-left -->
      <span class="legend-dot orange"></span> Listing
      <span class="legend-dot red"></span> Sold Comp
      <span class="legend-dot purple"></span> Rental Comp
    </div>
    <button id="resetMapBtn" class="map-reset-btn">Reset Map</button>
    <button id="floodToggleBtn" class="map-flood-btn">💧 Flood Zones: OFF</button>
  </div>
  <div class="marketplace-panel"> <!-- width: 400px, display:flex, flex-direction:column -->
    <div class="panel-header">
      <div class="filter-bar">
        <button class="filter-pill active" data-status="all">All</button>
        <button class="filter-pill" data-status="published">Available</button>
        <button class="filter-pill" data-status="pending">Pending</button>
        <button class="filter-pill" data-status="coming_soon">Coming Soon</button>
      </div>
      <div class="panel-title-row">
        <span id="listingCount">Loading...</span>
        <div class="view-toggle">
          <button id="listViewBtn" class="view-btn active">≡</button>
          <button id="tileViewBtn" class="view-btn">⊞</button>
        </div>
      </div>
    </div>
    <div id="listingsPanel" class="listings-panel"> <!-- overflow-y: auto -->
      <!-- Cards rendered here -->
    </div>
  </div>
</div>
```

JS on load:
1. Require auth
2. Initialize Mapbox map at Florida coords zoom 7
3. Load portal_listings (LEFT JOIN properties on property_id) WHERE status IN ('published','pending','coming_soon')
4. Also load listing_photos for primary photos
5. Render markers on map + cards in panel
6. Map marker click: fly to location, show popup
7. Card hover: highlight marker
8. Filter pills: filter cards + markers by status
9. Flood zone toggle: show/hide flood layer (layer ID 'fema-flood-layer' from custom style)
10. Map style buttons: map.setStyle() with Mapbox style URLs, then re-add markers
11. Reset map: fitBounds to all marker coordinates
12. Graceful empty state if no listings or table missing

Card format (list view):
```html
<div class="deal-card list-card" onclick="window.location='/deal.html?id=ID'">
  <div class="card-photo-sm"><img/><span class="status-badge">Available</span></div>
  <div class="card-content">
    <div class="card-location">Hollywood, FL</div>
    <div class="card-specs">SFR · 3 Bd · 2 Ba · 1,850 sqft</div>
    <div class="card-price">$285,000</div>
  </div>
  <div class="card-arrow">→</div>
</div>
```

Tile view: 2-column grid, taller photo, more padding.

### deal.html
Requires auth. Load portal listing by id URL param.

Layout: sticky header with back link + address + status + action buttons.
Below: photo gallery hero.
Stats bar: asking price | beds | baths | sqft | year built.
Tab bar: Overview | Pro Forma | Property Details | Photos | Map & Comps.

Overview tab content:
- If listing has open_house_date: gold banner "🏠 Open House: [date] [time-window] | Offers due by [deadline]"
- Description/notes from portal_listing.notes or property description
- Two-column metrics: Asking Price vs Retail Value (ARV), Day 1 Equity (ARV - Asking Price), Property Type
- Express Interest section at bottom of tab

Pro Forma tab:
Interactive calculator. All inputs have class="pro-forma-input".
Default values loaded from: asking_price → Purchase Price, estimated_arv → ARV, estimated_repairs → Rehab Budget.
Calculated metrics update on every input event.
Key formula: Monthly Cash Flow = (Monthly Rent * (1 - Vacancy%)) - (Monthly Operating Expenses) - Monthly Mortgage Payment
Show: Cap Rate, Cash-on-Cash, Monthly Cash Flow, Annual Cash Flow, Total Return (at holding period).
"Reset Defaults" button. "Save Pro Forma" button. "Download PDF" button.

Property Details tab: table of all property specs from properties table.

Photos tab: masonry or grid gallery of all listing_photos. Click to expand to full screen.

Map & Comps tab:
- Mapbox map 420px height, centered on property lat/lng zoom 17
- FEMA flood layer visible by default
- Property pin (gold marker)
- If property has comps_data JSONB: show red pins for sold comps array, purple for rental comps array
- Comps table below map

Express Interest (shown on Overview tab):
- "I'm Interested" card: check if investor_interest record exists for this listing + investor. If not: button to submit. If yes: "✓ Interest noted [date]" state.
- "Make an Offer" card: button → /offer.html?listing=[portal_listing_id]
- Both write to investor_interest table

### offer.html (skeleton for now)
Requires auth. 3-step stepper.
Step 1: Property summary + disclaimer
Step 2: Offer details form (offer price, deed name, financing yes/no, PM interest yes/no, agent capture: "Working with an agent?" if yes: agent name/email/phone/brokerage)
Step 3: Confirmation
Write to investor_interest table on submit.
For now: build the UI shell, leave agent auto-create logic as TODO comment.

### dashboard.html (skeleton for now)
Requires auth. 5 tabs: Dashboard | Favorites | Offers | Pro Formas | Transactions.
Dashboard tab: Buy Box form (all fields map to contacts table custom_fields). Save button.
Other tabs: "Coming soon" placeholder with the tab structure in place.

### netlify.toml
```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
```

### 404.html
Simple branded 404 page.

## SHARED PATTERN (every page)
Head section:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/investor.css">
<script>
// Prevent flash of wrong theme
(function() {
  var t = localStorage.getItem('dom_portal_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();
</script>
```

Before </body>:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/investor-auth.js"></script>
<div id="portalToast"></div>
<script>
// page-specific code here
</script>
```

For pages needing Mapbox:
```html
<link href='https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css' rel='stylesheet'>
<script src='https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.js'></script>
```

When done, run: openclaw system event --text "Done: Investor portal core pages built" --mode now
