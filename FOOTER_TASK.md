# Task: Footer Improvements on homepage.html

## 1. Social icons after footer logo/tagline
After the footer-tagline p tag, add social icons div with inline SVG icons for Instagram, YouTube, Facebook, LinkedIn, TikTok. Icons: stroke="currentColor" white, opacity 0.65 on parent, 1 on hover.

CSS to add:
.footer-social { display: flex; gap: 14px; margin-top: 16px; }
.social-icon { color: rgba(255,255,255,0.6); transition: color 0.2s; display: flex; text-decoration: none; }
.social-icon:hover { color: white; }

Icons use Feather-style SVG (stroke, no fill), width/height 20px each.

## 2. Add "Pro Forma Calculator" to Platform column
In the Platform footer-col, add after Marketplace link:
<a href="/marketplace.html">Pro Forma Calculator</a>

## 3. Add FAQ, Privacy Policy, Terms of Service to Company column
After existing links add:
<a href="/faq.html">FAQ</a>
<a href="/privacy.html">Privacy Policy</a>
<a href="/terms.html">Terms of Service</a>

## 4. Bigger DOM logo in footer
Change footer logo height from 40px to 48px.

## 5. More padding between footer-top and footer-bottom
Add padding-top: 24px to the footer-bottom div OR increase margin-top.

## 6. Copyright line with dynamic year and ToS/Privacy links
Replace the static copyright p tag text with:
- span id="footerYear" for dynamic year
- "Direct Off Market, LLC. All rights reserved."
- Separator " | "
- Terms of Service link (href="/terms.html", subtle underline, 0.6 opacity)
- Separator " | "
- Privacy Policy link (href="/privacy.html", same style)

Add at end of script: document.getElementById('footerYear') && (document.getElementById('footerYear').textContent = 'Copyright ' + new Date().getFullYear());

## 7. Newsletter signup bar ABOVE footer-top columns
Inside footer-inner, BEFORE footer-top div, insert:

```html
<div class="footer-newsletter">
  <div>
    <div class="footer-newsletter-title">Get deal alerts straight to your inbox</div>
    <div class="footer-newsletter-sub">New listings, open houses, and market updates.</div>
  </div>
  <form class="footer-newsletter-form" id="footerNewsForm">
    <input type="email" id="footerEmail" placeholder="your@email.com" class="footer-email-input" required>
    <button type="submit" class="btn-orange" style="padding:10px 20px;white-space:nowrap;font-size:14px;font-weight:700;border-radius:6px;">Subscribe</button>
  </form>
</div>
```

Add JS at end of script:
```js
var newsForm = document.getElementById('footerNewsForm');
if (newsForm) {
  newsForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    var email = document.getElementById('footerEmail').value.trim();
    if (!email) return;
    try {
      await Portal.supabase.from('newsletter_subscribers').upsert({ email: email, subscribed_at: new Date().toISOString() }, { onConflict: 'email' });
    } catch(err) {}
    Portal.toast('Subscribed! Deal alerts coming your way.', 'success');
    document.getElementById('footerEmail').value = '';
  });
}
```

Add CSS:
.footer-newsletter { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 24px 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 32px; flex-wrap: wrap; }
.footer-newsletter-title { font-size: 16px; font-weight: 700; color: white; margin-bottom: 4px; }
.footer-newsletter-sub { font-size: 13px; color: rgba(255,255,255,0.5); }
.footer-newsletter-form { display: flex; gap: 8px; flex-shrink: 0; }
.footer-email-input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 10px 16px; border-radius: 6px; font-size: 14px; min-width: 220px; outline: none; }
.footer-email-input::placeholder { color: rgba(255,255,255,0.4); }
.footer-email-input:focus { border-color: var(--accent); }
@media (max-width: 640px) { .footer-newsletter { flex-direction: column; align-items: flex-start; } .footer-email-input { min-width: 0; width: 100%; } .footer-newsletter-form { width: 100%; } }

Keep all other footer content exactly unchanged.
