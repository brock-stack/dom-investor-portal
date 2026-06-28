# Portal Glass v4 — Sandbox

**Branch:** `kong/glass-v4-sandbox`
**Preview URL:** `https://kong-glass-v4-sandbox--dom-investor-portal.netlify.app/sandbox/glass-v4/_index.html`
**Status:** Phase A complete — Phase B1 in progress
**Production impact:** None. This branch never merges to main.

---

## What this is

A fully-themed sandbox clone of the DOM Investor Portal using the Gulf Liquid Glass design system (Andrew's `gulf-liquid-glass.css`, 2026-06-28).

Every production page gets a glass version here. Andrew iterates freely on this preview. Production stays frozen until Andrew explicitly approves a per-page sweep PR.

---

## How to navigate

Open `_index.html` — it lists all 21 sandbox pages with tier badges and links.

Open `_demo.html` — the design reference showing the Showcase vs. Work glass tiers side by side.

---

## Two glass tiers

| Tier | Class | Use |
|---|---|---|
| Showcase | `.lg` | Hero, marketplace, marketing — full liquid, translucent sea |
| Work | `.lg lg--work` | Pro-forma, dashboard, tables — calmer, more opaque, scene dims |

Default theme: **dark** (Night / deep sea). Toggle reads/writes `localStorage.dom_portal_theme`.

---

## Build phases

| Phase | Pages | Status |
|---|---|---|
| A | Foundation (demo, index, assets) | ✅ Complete |
| B1 | marketplace, deal, proforma | 🔄 In progress |
| B2 | dashboard, homepage, index, offer | ⏳ Awaiting B1 signoff |
| B3 | lender-marketplace, preferred-partners ×5, signup, login, contact, faq, privacy, terms, 404 | ⏳ Awaiting B2 signoff |

---

## Rules

- All files live under `sandbox/glass-v4/` — zero root changes
- No `site_versions` row, no PR to main
- When Andrew says "ship Page X" — that triggers a separate per-page PR off `main`, not off this sandbox
