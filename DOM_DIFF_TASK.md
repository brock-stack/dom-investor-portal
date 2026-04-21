# Task: "Why DOM" Section Improvements on homepage.html

## FILE: homepage.html — update .why-dom section

### CHANGE 1: Replace emoji icons with SVGs
Find the 4 benefit-card divs in .why-dom. Replace each .benefit-icon div:

Card 1 (Curated Inventory) — award/shield icon:
```html
<div class="benefit-icon">
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
</div>
```

Card 2 (Interactive Pro Forma) — sliders icon:
```html
<div class="benefit-icon">
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
</div>
```

Card 3 (Flood Zone & Comp Maps — change "+" to "&") — layers icon:
```html
<div class="benefit-icon">
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
</div>
```

Card 4 (Instant Access) — zap icon:
```html
<div class="benefit-icon">
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
</div>
```

Also fix "Flood Zone + Comp Maps" → "Flood Zone & Comp Maps" in the h3 text.

### CHANGE 2: Add 2 more benefit cards
After the 4th benefit-card, add:

```html
<div class="benefit-card" onclick="location.href='/login.html'">
  <div class="benefit-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  </div>
  <h3>Preferred Lender Network</h3>
  <p>Access our vetted investor-friendly lenders directly from the portal. Hard money, DSCR, bridge loans, and conventional financing — all in one place.</p>
</div>
<div class="benefit-card" onclick="location.href='/signup.html'">
  <div class="benefit-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  </div>
  <h3>Open House Alerts</h3>
  <p>Get notified about upcoming open houses and offer deadlines before anyone else. First in, best positioned.</p>
</div>
```

### CHANGE 3: Make existing cards clickable
- Card 1 (Curated Inventory): add onclick="location.href='/marketplace.html'"
- Card 2 (Interactive Pro Forma): add onclick="location.href='/marketplace.html'"  
- Card 3 (Flood Zone & Comp Maps): add onclick="location.href='/marketplace.html'"
- Card 4 (Instant Access): add onclick="location.href='/signup.html'"

### CHANGE 4: Subtitle max-width
Find the section-sub paragraph. Change max-width from 620px to 780px.

## FILE: investor.css

### CHANGE 5: Benefit card visual improvements
Update .benefit-card styles:
- Add: border-top: 3px solid var(--accent); (accent line at top)
- Add: cursor: pointer;
- Add hover: transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.18); border-top-color: var(--accent);
- Change transition to include border-color

Update .benefit-card h3:
- font-size: 17px → 19px
- font-weight: 700 stays

Add spacing between icon and title:
- .benefit-icon: margin-bottom: 16px (increase from whatever it is)

Update benefit-grid to 3 cols for 6 cards:
```css
.benefit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
@media (max-width: 900px) { .benefit-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .benefit-grid { grid-template-columns: 1fr; } }
```

### CHANGE 6: Section background differentiation
Update .why-dom background to plain white (alternating with surface sections):
```css
.why-dom { background: var(--bg); padding: 80px 24px; }
```
This alternates: hero (photo) → featured (surface) → steps (surface-2 gradient) → why-dom (bg = plain background) → CTA (navy). Clear visual rhythm.

Keep all other code unchanged.
