# Task: "3 Steps to Your Next Deal" Section Improvements

## FILE: homepage.html — update the .how-it-works section

### CHANGE 1: Replace emoji icons with inline SVGs
Find the step-card divs in the how-it-works section. Replace each .step-icon div containing an emoji with an inline SVG.

Step 1 icon (shield-check):
```html
<div class="step-icon">
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
  </svg>
</div>
```

Step 2 icon (bar-chart-2):
```html
<div class="step-icon">
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
</div>
```

Step 3 icon (send/file-text):
```html
<div class="step-icon">
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
</div>
```

### CHANGE 2: Step number style
The .step-num currently shows "01" "02" "03" in small text top-right. Change to a large watermark:
- Remove the current .step-num element
- Add a new watermark div BEHIND the card content (first child of .step-card):
```html
<div class="step-watermark">01</div>
```
Add CSS for .step-watermark: position absolute, bottom -10px, right 16px, font-size 96px, font-weight 900, color var(--accent), opacity 0.07, line-height 1, pointer-events none, user-select none, z-index 0
Make .step-card position:relative and add z-index 1 to .step-icon, h3, p so they sit above the watermark.

### CHANGE 3: Make cards clickable with hover
Wrap each step-card content in an <a> tag or add onclick:
- Step 1: onclick="location.href='/signup.html'"
- Step 2: onclick="location.href='/marketplace.html'"
- Step 3: onclick="location.href='/signup.html'" (leads to signup → then offer flow)

Add to .step-card CSS: cursor pointer, transition transform 0.18s ease box-shadow 0.18s ease
Add .step-card:hover: transform translateY(-4px), box-shadow 0 12px 32px rgba(0,0,0,0.2)

### CHANGE 4: CTA button below cards
After the closing </div> of .steps-grid, add:
```html
<div style="text-align:center;margin-top:40px;">
  <a href="/signup.html" class="btn-primary" style="padding:14px 36px;font-size:16px;font-weight:700;">Create Your Free Account →</a>
</div>
```

### CHANGE 5: Copy tweak in Step 1
Find the Step 1 paragraph text. Find "instant access" in the text and wrap it:
`<strong style="color:var(--accent);">instant access</strong>`
So it reads: "...Sign up in 2 minutes. Review and sign our investor agreement — <strong style="color:var(--accent);">instant access</strong>, no waiting for approval."

### CHANGE 6: Visual connector between cards
Between the 3 step cards (after card 1 and card 2 in the steps-grid), add a connector element. Since it's a CSS grid, use a pseudo approach.

Add to .steps-grid CSS:
```css
.steps-grid { position: relative; }
.steps-grid::before {
  content: '';
  position: absolute;
  top: 48px;
  left: calc(33.33% + 12px);
  right: calc(33.33% + 12px);
  height: 2px;
  background: repeating-linear-gradient(90deg, var(--accent) 0, var(--accent) 6px, transparent 6px, transparent 14px);
  opacity: 0.3;
  pointer-events: none;
}
```
Also add z-index: 1 to .step-card so they appear above the connector line.
Hide the connector on mobile (max-width 768px): .steps-grid::before { display: none; }

### CHANGE 7: Section background improvement
In investor.css, update .how-it-works background:
```css
.how-it-works {
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%);
  padding: 80px 24px;
}
```
Also add a very subtle radial glow behind the section heading (cosmetic only):
The section already has .section-eyebrow and .section-heading -- no HTML change needed, just the CSS gradient above is enough.

## FILE: investor.css
Apply all CSS changes described above. Do not touch any other section styles.

Keep all other homepage and CSS code unchanged.
