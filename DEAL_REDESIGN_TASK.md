# Task: Full Deal Detail Page Layout Redesign

File: deal.html

This is a comprehensive layout redesign. Read the existing deal.html carefully first, then implement all changes. Keep all existing JavaScript logic, Supabase queries, auth checks, pro forma calculator, and map code intact -- only change the HTML structure and CSS.

## CHANGE 1: Header Bar

Find the deal header section (the dark nav/header bar at the top of the deal page content, below the site nav). Redesign it:

Structure:
```
[ ← Back to Marketplace ]          [ ❤ Favorites | 📤 Share ]
[ FULL ADDRESS  ●AVAILABLE ]        [ Make an Offer | Express Interest ]
```

- "Back to Marketplace" link: top left, white text, 13px, "← Back to Marketplace". Remove any duplicate -- only ONE instance.
- Full address: white text, 22px font-weight:700. Show: street address + city + state + zip all on one line. 
- Status badge: inline AFTER the address on the same line. Small pill, solid green (#22c55e), white text, 8px 10px padding.
- Action buttons (Make an Offer, Express Interest): white fill with dark text (#1a1e38), font-weight:700. On hover: slight gray. These are the primary CTAs -- make them prominent.
- Secondary buttons (Favorites, Share): outlined in white, white text. Smaller.
- Header bg: keep dark navy.

## CHANGE 2: Photo Gallery -- Split Layout

Replace the current full-width hero carousel with a split gallery:

```html
<div class="deal-gallery">
  <div class="gallery-main-photo" id="galleryMainPhoto">
    <!-- Main large photo, clickable to open modal -->
  </div>
  <div class="gallery-side-grid" id="gallerySideGrid">
    <!-- 2x2 grid of thumbnails -->
    <!-- Bottom-right cell: "+N more" overlay -->
  </div>
</div>
```

CSS:
```css
.deal-gallery { display: grid; grid-template-columns: 60% 40%; gap: 4px; height: 360px; border-radius: 12px; overflow: hidden; }
.gallery-main-photo { position: relative; overflow: hidden; cursor: pointer; background: var(--surface-2); }
.gallery-main-photo img { width: 100%; height: 100%; object-fit: cover; }
.gallery-side-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 4px; }
.gallery-thumb { position: relative; overflow: hidden; cursor: pointer; background: var(--surface-2); }
.gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
.gallery-more-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 800; }
@media (max-width: 768px) { .deal-gallery { grid-template-columns: 1fr; } .gallery-side-grid { display: none; } }
```

JS: Update the gallery initialization. When photos load, put photo[0] in main-photo, photos[1-4] in the 4 side grid cells. Last cell shows "+N more" overlay. Clicking main photo or any thumbnail opens the existing fullscreen modal (already built). Remove the thumbnail strip below (gallery-thumbs div) -- no longer needed.

## CHANGE 3: KPI Strip

Find the stats bar below the gallery. Improve it:
- Add thin vertical dividers between stats
- Add inline SVG icons next to each label
- Add more stats: Lot Size (p.lot_size), Pool (p.has_pool), Garage (p.garage_type)
- Asking Price: color the dollar amount #3b82f6 (blue accent), slightly larger

Use these icons (inline SVG, 14px, var(--text-muted) stroke):
- Asking Price: $ sign text
- Beds: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9V4h20v5"/><path d="M2 9v11h20V9"/><path d="M9 9v11"/></svg>
- Baths: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6 L9 4 Q9 2 11 2 L13 2 Q15 2 15 4 L15 6"/><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 14h20"/></svg>
- Sqft: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
- Year: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>

## CHANGE 4: Tab bar styling

Add to tab bar container: border-bottom: 1px solid var(--border)
Tab font size: 14px minimum
Active tab: color #3b82f6, border-bottom: 2px solid #3b82f6

## CHANGE 5: Overview Tab -- Complete Redesign

Replace the current overview tab content with these 5 sections. Keep all the existing JS variable names (listing, property, etc.).

### Section 1: Property Summary
```html
<div class="deal-summary-section">
  <div id="dealTitle" class="deal-title"></div>
  <div id="dealDescription" class="deal-description"></div>
  <div id="dealMeta" class="deal-meta-row"></div>
</div>
```
JS render: 
- dealTitle: listing.name || (property.property_type ? slugLabel(property.property_type) + ' in ' + (property.city||'') : 'Investment Property')
- dealDescription: listing.notes || property.description || 'Off-market investment opportunity sourced and verified by the Direct Off Market team.'
- dealMeta: full address + "Days on portal: X" (calculate from listing.published_at)

CSS:
```css
.deal-summary-section { margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
.deal-title { font-size: 22px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
.deal-description { font-size: 15px; color: var(--text-muted); line-height: 1.7; margin-bottom: 12px; }
.deal-meta-row { display: flex; gap: 20px; flex-wrap: wrap; font-size: 13px; color: var(--text-muted); }
```

### Section 2: Financial Snapshot (2-column)
```html
<div class="financial-snapshot">
  <div class="financial-left" id="financialGrid"></div>
  <div class="financial-right" id="dealCTAs"></div>
</div>
```

Left (financialGrid): a table-like grid of 6 rows:
| Asking Price | $XXX,XXX (blue, bold) |
| Retail Value (ARV) | $XXX,XXX or "Pending Analysis" |
| Day 1 Equity | $XX,XXX or "TBD" |
| Est. Monthly Rent | $X,XXX or "—" |
| Est. Cap Rate | X.X% or "—" |
| Property Type | Single Family |

Right (dealCTAs): the Express Interest + Submit an Offer CTA cards (move them here from where they currently are). Keep the existing onclick handlers.

CSS:
```css
.financial-snapshot { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
.financial-row { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-bottom: 1px solid var(--border); }
.financial-row:last-child { border-bottom: none; }
.financial-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
.financial-value { font-size: 15px; font-weight: 700; color: var(--text); }
.financial-value.accent { color: #3b82f6; font-size: 18px; }
@media (max-width: 768px) { .financial-snapshot { grid-template-columns: 1fr; } }
```

### Section 3: Key Features
```html
<div class="key-features" id="keyFeatures"></div>
```
JS render: array of features from property -- show as pills:
beds, baths, sqft, year_built, has_pool (Pool: Yes/No), garage_type (if exists), lot_size (acres)

CSS:
```css
.key-features { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
.feature-pill { background: var(--surface-2); border: 1px solid var(--border); border-radius: 20px; padding: 5px 14px; font-size: 13px; font-weight: 600; color: var(--text); }
```

### Section 4: Property Description
```html
<div class="prop-description" id="propDescription"></div>
```
Show listing.notes if not already shown above, otherwise property address + details sentence. Only if there's content.

### Section 5: Location teaser
```html
<div class="location-section">
  <div class="section-label">Location</div>
  <div id="dealMapTeaser" style="height:200px;border-radius:8px;overflow:hidden;margin-top:8px;background:var(--surface-2);"></div>
  <a id="dealMapLink" href="#" target="_blank" style="font-size:12px;color:#3b82f6;margin-top:6px;display:inline-block;">Open in Google Maps ↗</a>
</div>
```
JS: if property has lat/lng, init a small Mapbox map at zoom 15 (reuse existing map logic pattern). Otherwise show a placeholder.

### Keep the open house banner, existing CTAs (they just move to Section 2 right column)

## CHANGE 6: Footer bar

Below the tab content, add:
```html
<div class="deal-footer-bar">
  <span>Questions about this property?</span>
  <a href="/contact.html" class="deal-footer-link">Contact Us →</a>
</div>
```

CSS:
```css
.deal-footer-bar { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; border-top: 1px solid var(--border); font-size: 14px; color: var(--text-muted); margin-top: 24px; }
.deal-footer-link { color: #3b82f6; font-weight: 600; text-decoration: none; }
.deal-footer-link:hover { text-decoration: underline; }
```

## IMPORTANT RULES:
- Keep ALL existing JavaScript (pro forma calculator, express interest handler, offer submit, map init, auth checks, loadPhotos, renderOverview, etc.)
- Keep all other tabs (Pro Forma, Property Details, Photos, Map & Comps) exactly as they are
- Only redesign the OVERVIEW tab content and the header/gallery/KPI strip
- Do not remove any Supabase queries
- If a section references data that may not exist, handle gracefully with fallbacks
