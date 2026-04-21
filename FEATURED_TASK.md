# Task: Featured Deals Section Improvements on homepage.html

## 1. Section header update
Find the h2 with "Featured Deals" text. Replace the parent div with:
- Flex row: left side has h2 "Featured Deals" + subtitle "Hand-picked investment opportunities from our team", right side has "View All Deals →" link to /marketplace.html

## 2. CSS additions to investor.css
Add:
- .mini-card: transition transform + box-shadow, cursor pointer
- .mini-card:hover: translateY(-4px), increased shadow
- .mini-photo: position relative, padding-top 56.25% (16:9 aspect ratio locked), overflow hidden
- .mini-photo img and .mini-photo > div: position absolute, inset 0, width/height 100%, object-fit cover
- .featured-badge: position absolute top-10px left-10px, amber bg (#f59e0b), dark text, font-size 10px, font-weight 800, border-radius 4px
- .status-badge: position absolute top-10px right-10px, similar pill style
- .status-published: green bg rgba(34,197,94,0.9), white text
- .status-pending: amber bg rgba(245,158,11,0.9), dark text
- .status-under_contract: sky blue bg rgba(79,195,247,0.9), dark text
- .status-sold: gray bg rgba(100,116,139,0.9), white text
- .featured-grid: grid 3 cols desktop, 2 cols at 900px, 1 col at 560px, gap 20px
- .mini-view-btn: block, accent bg (#4fc3f7), navy text, centered, padding 9px 16px, border-radius 6px, font-weight 700, hover darken

## 3. Update loadFeatured() JS function in homepage.html

At the top of loadFeatured(), before the Supabase query, add:
```
var session = await Portal.getSession();
var isLoggedIn = !!session;
```

Update the select query to include: 'id, listing_id, asking_price, status, notes, property_id, properties(city, state, address, property_type, bedrooms, bathrooms, sqft, estimated_arv)'

Replace the card return HTML in data.map() with an improved version:
- Photo area uses 16:9 aspect ratio with absolute positioning. Photo img or placeholder (DOM logo at low opacity).
- Featured badge top-left: "★ Featured" amber pill
- Status badge top-right: dynamic class (status-published, status-pending, status-under_contract, status-sold). Labels: published=Available, pending=Pending, under_contract=Under Contract, sold=Sold
- Address line 1: p.address (street) or loc fallback, font-weight 700
- Address line 2: city + state, muted color, smaller
- Specs: propType (convert snake_case to Title Case) + beds (or --) + baths (or --) + sqft (toLocaleString or --)
- Price row: asking_price formatted with toLocaleString + "ARV: $X" on the right if estimated_arv exists
- View Deal button: .mini-view-btn class, href = /deal.html?id=X if logged in, else /login.html
- Whole card onclick: same URL as button
- All currency: Number(x).toLocaleString('en-US') for proper comma formatting

## 4. Placeholder for cards with no photo
If l._photo is null, show: div with DOM logo image at /img/dom-logo-white.png, height 40px, opacity 0.2, centered on dark surface-2 bg

## Rules
- Keep all other homepage code unchanged
- Keep the photos fetch logic (listing_id-based query) that was already fixed
- The card must work whether user is logged in or not
