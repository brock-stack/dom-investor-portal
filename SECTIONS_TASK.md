# Task: Add 4 new sections to homepage.html

Insert all 4 sections BETWEEN the .why-dom section and the .investor-cta-strip section.

## SECTION 1: Testimonials (after .why-dom closing tag)

```html
<section class="testimonials-section">
  <div class="section-container">
    <div class="section-eyebrow">INVESTOR STORIES</div>
    <h2 class="section-heading">What Our Investors Say</h2>
    <div class="testimonials-grid">
      <div class="testimonial-card">
        <div class="testimonial-quote">"I was skeptical at first, but the underwriting data and pro forma tools made it easy to run my own numbers. Closed on a Cape Coral SFR in under 30 days."</div>
        <div class="testimonial-author">
          <div class="testimonial-avatar">MR</div>
          <div>
            <div class="testimonial-name">Michael R.</div>
            <div class="testimonial-detail">Buy & Hold Investor · Cape Coral, FL</div>
          </div>
        </div>
      </div>
      <div class="testimonial-card">
        <div class="testimonial-quote">"The flood zone maps alone saved me from a bad deal. I could see FEMA data right on the listing before I even submitted an offer. That's not something you get anywhere else."</div>
        <div class="testimonial-author">
          <div class="testimonial-avatar">JL</div>
          <div>
            <div class="testimonial-name">Jennifer L.</div>
            <div class="testimonial-detail">Fix & Flip Investor · Tampa, FL</div>
          </div>
        </div>
      </div>
      <div class="testimonial-card">
        <div class="testimonial-quote">"I've bought properties from other wholesalers and the difference is the vetting. DOM actually underwrites their deals. I haven't seen numbers fabricated to look good — everything checks out."</div>
        <div class="testimonial-author">
          <div class="testimonial-avatar">DK</div>
          <div>
            <div class="testimonial-name">David K.</div>
            <div class="testimonial-detail">Portfolio Investor · Orlando, FL</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

CSS:
```css
.testimonials-section { background: var(--surface); padding: 80px 24px; }
.testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 40px; }
.testimonial-card { background: var(--surface-2); border-radius: 14px; padding: 28px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 20px; position: relative; }
.testimonial-card::before { content: '"'; position: absolute; top: 16px; right: 20px; font-size: 64px; line-height: 1; color: var(--accent); opacity: 0.2; font-family: Georgia, serif; }
.testimonial-quote { font-size: 15px; line-height: 1.75; color: var(--text); font-style: italic; flex: 1; }
.testimonial-author { display: flex; align-items: center; gap: 12px; }
.testimonial-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--accent); color: #1a1e38; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.testimonial-name { font-weight: 700; font-size: 14px; color: var(--text); }
.testimonial-detail { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
@media (max-width: 900px) { .testimonials-grid { grid-template-columns: 1fr; } }
@media (min-width: 560px) and (max-width: 900px) { .testimonials-grid { grid-template-columns: repeat(2, 1fr); } }
```

## SECTION 2: Recent Closings (after testimonials)

```html
<section class="closings-section">
  <div class="section-container">
    <div class="section-eyebrow">TRACK RECORD</div>
    <h2 class="section-heading">Recently Closed Deals</h2>
    <p class="section-sub">These deals are done. Proof that our inventory actually closes.</p>
    <div class="closings-grid" id="recentClosings">
      <!-- Loaded from Supabase or fallback static -->
    </div>
  </div>
</section>
```

CSS:
```css
.closings-section { background: var(--bg); padding: 80px 24px; }
.closings-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
.closing-card { background: var(--surface); border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
.closing-photo { height: 140px; overflow: hidden; background: var(--surface-2); position: relative; }
.closing-photo img { width: 100%; height: 100%; object-fit: cover; }
.closing-badge { position: absolute; top: 8px; left: 8px; background: rgba(100,116,139,0.9); color: white; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
.closing-content { padding: 16px; }
.closing-location { font-weight: 700; font-size: 14px; color: var(--text); margin-bottom: 4px; }
.closing-meta { font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
.closing-price { font-size: 18px; font-weight: 800; color: var(--accent); }
.closing-days { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
@media (max-width: 768px) { .closings-grid { grid-template-columns: 1fr; } }
@media (min-width: 560px) and (max-width: 768px) { .closings-grid { grid-template-columns: repeat(2, 1fr); } }
```

JS to load recent closings (add to page script):
```js
async function loadRecentClosings() {
  var el = document.getElementById('recentClosings');
  if (!el) return;
  try {
    var result = await Portal.supabase
      .from('portal_listings')
      .select('id, asking_price, status, listing_id, property_id, properties(city, state, property_type)')
      .eq('status', 'sold')
      .order('updated_at', { ascending: false })
      .limit(3);
    var data = (result.data || []);
    // Load photos
    var listingIds = data.map(function(l) { return l.listing_id; }).filter(Boolean);
    var photoMap = {};
    if (listingIds.length > 0) {
      var pr = await Portal.supabase.from('listing_photos').select('listing_id, url').in('listing_id', listingIds).eq('is_primary', true);
      (pr.data || []).forEach(function(p) { photoMap[p.listing_id] = p.url; });
    }
    if (data.length === 0) {
      // Fallback static placeholders
      el.innerHTML = [
        { city: 'Cape Coral', state: 'FL', type: 'Single Family', price: 285000, days: 18 },
        { city: 'North Port', state: 'FL', type: 'Single Family', price: 219000, days: 24 },
        { city: 'Kissimmee', state: 'FL', type: 'Single Family', price: 310000, days: 14 }
      ].map(function(c) {
        return '<div class="closing-card"><div class="closing-photo"><div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><img src="/img/dom-logo-white.png" style="height:32px;opacity:0.15;"></div><span class="closing-badge">Closed</span></div><div class="closing-content"><div class="closing-location">' + c.city + ', ' + c.state + '</div><div class="closing-meta">' + c.type + '</div><div class="closing-price">$' + c.price.toLocaleString('en-US') + '</div><div class="closing-days">Closed in ' + c.days + ' days</div></div></div>';
      }).join('');
      return;
    }
    el.innerHTML = data.map(function(l) {
      var p = l.properties || {};
      var photo = photoMap[l.listing_id];
      var photoHtml = photo ? '<img src="' + photo + '" alt="Closed deal">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><img src="/img/dom-logo-white.png" style="height:32px;opacity:0.15;"></div>';
      var type = p.property_type ? p.property_type.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}) : 'Property';
      return '<div class="closing-card"><div class="closing-photo">' + photoHtml + '<span class="closing-badge">Closed</span></div><div class="closing-content"><div class="closing-location">' + (p.city||'') + ', ' + (p.state||'FL') + '</div><div class="closing-meta">' + type + '</div><div class="closing-price">$' + Number(l.asking_price||0).toLocaleString('en-US') + '</div></div></div>';
    }).join('');
  } catch(e) { el.style.display = 'none'; }
}
loadRecentClosings();
```

## SECTION 3: FAQ (after recent closings)

```html
<section class="faq-section">
  <div class="section-container">
    <div class="section-eyebrow">INVESTOR FAQ</div>
    <h2 class="section-heading">Common Questions</h2>
    <p class="section-sub">Everything you need to know before you dive in.</p>
    <div class="faq-list">
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">Are these deals on the MLS? <span class="faq-icon">+</span></button>
        <div class="faq-a">No. Every deal on this platform is sourced off-market — directly from sellers before the property hits the MLS or goes to auction. That's the entire point: you get access before the general public does.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">What are the fees? <span class="faq-icon">+</span></button>
        <div class="faq-a">There is a $1,495 marketplace service fee and a $450 document preparation fee on all closed transactions. Assignment fees are disclosed on a per-deal basis. There are no monthly subscription fees to access the portal.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">Can I see the property before I buy? <span class="faq-icon">+</span></button>
        <div class="faq-a">Yes. Most deals include an open house date. All investors will be notified and can tour the property on the scheduled day. Virtual walkthroughs can also be arranged for out-of-state investors on select properties.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">How do I make an offer? <span class="faq-icon">+</span></button>
        <div class="faq-a">Create a free account, browse the marketplace, open any listing, and click "Make an Offer." The offer form captures your price, terms, and buyer information. You'll receive a confirmation email, and our team will follow up within 24 hours.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">Do you offer financing? <span class="faq-icon">+</span></button>
        <div class="faq-a">We don't lend directly, but we have a vetted network of investor-friendly lenders in our Lender Marketplace — hard money, DSCR, bridge loans, and conventional options. Access is available once you're registered.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">Are the deals in Florida only? <span class="faq-icon">+</span></button>
        <div class="faq-a">Yes, currently all deals are sourced across the state of Florida. We have active coverage in Cape Coral, North Port, Sarasota, Tampa, Orlando, Kissimmee, Miami, and expanding. We plan to cover additional Southeast markets in the future.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">What does "off-market" actually mean? <span class="faq-icon">+</span></button>
        <div class="faq-a">Off-market means the property is not publicly listed on any real estate platform (MLS, Zillow, Redfin, etc.). Direct Off Market sources deals through direct seller relationships, giving our investor network exclusive access before these properties become widely known.</div>
      </div>
    </div>
  </div>
</section>
```

CSS:
```css
.faq-section { background: var(--surface); padding: 80px 24px; }
.faq-list { margin-top: 40px; max-width: 800px; margin-left: auto; margin-right: auto; }
.faq-item { border-bottom: 1px solid var(--border); }
.faq-q { width: 100%; text-align: left; background: none; border: none; padding: 20px 0; font-size: 16px; font-weight: 600; color: var(--text); cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px; font-family: inherit; }
.faq-q:hover { color: var(--accent); }
.faq-icon { font-size: 20px; font-weight: 400; color: var(--accent); flex-shrink: 0; transition: transform 0.2s; }
.faq-q.open .faq-icon { transform: rotate(45deg); }
.faq-a { display: none; padding: 0 0 20px; font-size: 15px; color: var(--text-muted); line-height: 1.7; }
.faq-a.open { display: block; }
```

JS (add to page script):
```js
function toggleFaq(btn) {
  var answer = btn.nextElementSibling;
  var isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-a').forEach(function(a) { a.classList.remove('open'); });
  document.querySelectorAll('.faq-q').forEach(function(q) { q.classList.remove('open'); });
  if (!isOpen) { answer.classList.add('open'); btn.classList.add('open'); }
}
```

Keep all other homepage code unchanged. Place these 3 sections between .why-dom closing and .investor-cta-strip opening. Add all CSS to investor.css. Add JS to the page script block.
