# Task: Deal Detail Page Color & Style Overhaul

File: deal.html

## Color replacements (global search and replace):
- ALL gold/amber hex values → replace with context-appropriate blues/grays
- var(--gold) → var(--accent) or #3b82f6 depending on context
- var(--accent) on this page should render as #3b82f6 (already set in CSS vars, should be fine)
- Any literal gold hex (#d4a853, #c9a84c, #b8942e, #c9a84c, #f59e0b, #d97706) → replace with #3b82f6 or #64748b

## Specific fixes:

### 1. Active tab underline
Find CSS for .tab-btn.active or .detail-tab.active. Change border-bottom or border color from any gold to #3b82f6.

### 2. KPI strip labels (ASKING PRICE, BEDS, BATHS, SQ FT, YEAR BUILT)
Labels should be #64748b (muted gray uppercase). Find the KPI label elements and change color.

### 3. "ASKING PRICE" label in stats bar
Change from gold/accent to #64748b. The dollar amount below stays dark.

### 4. Overview tab cards
Card borders: change from any gold tint to #e2e8f0 (light gray border).
Label text inside cards: change from gold to #64748b.

### 5. "I'm Interested" button
Change fill from gold/amber to #3b82f6 blue, text to white.

### 6. "Submit an Offer" button  
Change outline from gold to #1e293b (dark navy). On hover: fill #3b82f6 blue.

### 7. Header action buttons ("Make an Offer", "Express Interest", "Add to Favorites", "Share")
These are on a dark header background. Keep outline style, change to white border + white text. On hover: fill white, text dark.

### 8. Property Type slug fix
Find where property_type is rendered on the overview tab. Apply slug-to-label conversion:
```js
function slugLabel(s) {
  if (!s) return 'N/A';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
```
Use slugLabel(property.property_type) wherever property_type is displayed as a value (not just in specs).

### 9. Missing data display
Change any "--" dash displays to '<span style="color:#94a3b8;">N/A</span>' for consistency.

### 10. Status badge
"AVAILABLE" badge: background #22c55e, color white, border-radius 6px. Keep green for available.

### 11. Pro forma tab
Any gold input highlights or borders → change to light blue (#dbeafe background for editable inputs, #3b82f6 border on focus).
Pro forma result positive values: keep green. Negative values: red. Labels: #64748b.

### 12. Global sweep
After targeted fixes, search for these and replace:
- color: var(--gold) → color: #3b82f6 (for accent text) or color: #64748b (for labels)
- background: var(--gold) → background: #3b82f6
- border-color: var(--gold) → border-color: #3b82f6
- Any #c9a84c, #d4a853, #b8942e, #f59e0b, #d97706 literals

## Rules:
- Do NOT touch any JavaScript logic, Supabase queries, or auth code
- Do NOT change any text content (only styling)
- Do NOT touch marketplace.html or any other file
- Keep dark navy header exactly as-is
- Keep green for "Available" status
- Keep red for negative values in pro forma
