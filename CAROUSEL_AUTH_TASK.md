# Task: Featured Deals Carousel + Address Masking + Auth Gate

## FILE: homepage.html

### CHANGE 1: Address masking in loadFeatured()
The function already checks isLoggedIn. Update the card template:

If isLoggedIn is FALSE:
- Location line: show only city + state (no street address)
- Specs line: show only property type, hide beds/baths/sqft
- Price: show asking_price formatted
- Hide: ARV, equity, cap rate
- Button: text = "Sign In to View Deal →", href = "/login.html", class = "mini-view-btn" but with different style (secondary/outlined)
- Onclick: goes to /login.html

If isLoggedIn is TRUE (current behavior):
- Show full address, all specs, ARV, full "View Deal →" button

### CHANGE 2: Carousel for >3 featured deals
After loadFeatured() builds the cards array, if data.length > 3:
- Wrap cards in a carousel structure instead of a static grid
- Show perPage cards at a time (3 desktop, 2 tablet via JS, 1 mobile via JS)
- Auto-advance every 5000ms, pause on hover
- Left/right arrow buttons
- Dot indicators at bottom

Carousel HTML structure:
```html
<div class="carousel-wrapper" id="featCarousel">
  <button class="carousel-btn carousel-prev" id="featPrev">&#8249;</button>
  <div class="carousel-track-outer">
    <div class="carousel-track" id="featTrack">
      <!-- cards injected here -->
    </div>
  </div>
  <button class="carousel-btn carousel-next" id="featNext">&#8250;</button>
</div>
<div class="carousel-dots" id="featDots"></div>
```

Carousel CSS (add to investor.css):
```css
.carousel-wrapper { position: relative; display: flex; align-items: center; gap: 8px; }
.carousel-track-outer { overflow: hidden; flex: 1; }
.carousel-track { display: flex; gap: 20px; transition: transform 0.45s cubic-bezier(0.4,0,0.2,1); }
.carousel-track .mini-card { flex-shrink: 0; }
.carousel-btn { width: 40px; height: 40px; border-radius: 50%; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s; z-index: 2; }
.carousel-btn:hover { background: var(--accent); color: #1a1e38; }
.carousel-dots { display: flex; justify-content: center; gap: 8px; margin-top: 16px; }
.carousel-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); cursor: pointer; transition: background 0.2s; }
.carousel-dot.active { background: var(--accent); }
```

Carousel JS (add initCarousel function):
```js
function initCarousel(cards) {
  var perPage = window.innerWidth >= 900 ? 3 : window.innerWidth >= 560 ? 2 : 1;
  var totalPages = Math.ceil(cards.length / perPage);
  var currentPage = 0;
  var autoTimer = null;

  var track = document.getElementById('featTrack');
  var dots = document.getElementById('featDots');
  var wrapper = document.getElementById('featCarousel');

  // Set card widths
  var cardPct = (100 / perPage) - (20 * (perPage-1) / perPage / 10); // approx
  track.innerHTML = '';
  cards.forEach(function(cardHtml) {
    var div = document.createElement('div');
    div.innerHTML = cardHtml;
    var card = div.firstChild;
    card.style.width = 'calc(' + (100/perPage) + '% - ' + Math.ceil(20*(perPage-1)/perPage) + 'px)';
    track.appendChild(card);
  });

  // Build dots
  dots.innerHTML = '';
  for (var i = 0; i < totalPages; i++) {
    (function(idx) {
      var dot = document.createElement('div');
      dot.className = 'carousel-dot' + (idx === 0 ? ' active' : '');
      dot.onclick = function() { goTo(idx); };
      dots.appendChild(dot);
    })(i);
  }

  function goTo(page) {
    currentPage = (page + totalPages) % totalPages;
    var offset = currentPage * perPage;
    var cardWidth = track.firstChild ? track.firstChild.offsetWidth + 20 : 0;
    track.style.transform = 'translateX(-' + (offset * cardWidth) + 'px)';
    document.querySelectorAll('.carousel-dot').forEach(function(d, i) {
      d.classList.toggle('active', i === currentPage);
    });
  }

  document.getElementById('featPrev').onclick = function() { clearTimeout(autoTimer); goTo(currentPage - 1); startAuto(); };
  document.getElementById('featNext').onclick = function() { clearTimeout(autoTimer); goTo(currentPage + 1); startAuto(); };

  function startAuto() {
    clearTimeout(autoTimer);
    autoTimer = setTimeout(function() { goTo(currentPage + 1); startAuto(); }, 5000);
  }

  wrapper.addEventListener('mouseenter', function() { clearTimeout(autoTimer); });
  wrapper.addEventListener('mouseleave', function() { startAuto(); });

  startAuto();
}
```

In loadFeatured(), after building the cards array:
- If data.length <= 3: render as static featured-grid (current behavior, section.innerHTML = cards.join(''))
- If data.length > 3: set section.innerHTML to the carousel HTML, then call initCarousel(cards)

## FILE: investor-auth.js

### CHANGE 3: Auth gate for all protected pages
Update requireAuth() to show a message before redirecting:
```js
async requireAuth() {
  const session = await this.getSession();
  if (!session) {
    const current = window.location.pathname;
    const protectedPaths = ['/marketplace', '/deal', '/offer', '/dashboard', '/pro-forma'];
    const isProtected = protectedPaths.some(p => current.includes(p));
    if (isProtected) {
      // Store the intended URL
      sessionStorage.setItem('auth_redirect', window.location.href);
    }
    window.location.href = '/login.html?msg=signin_required&redirect=' + encodeURIComponent(window.location.href);
    return null;
  }
  return session;
},
```

### CHANGE 4: Show message on login page when redirected
In login.html, in the page init script, check for ?msg=signin_required and show a banner:
```js
var params = new URLSearchParams(window.location.search);
if (params.get('msg') === 'signin_required') {
  var box = document.getElementById('errorBox');
  if (box) { box.style.display = 'block'; box.style.background = 'rgba(79,195,247,0.1)'; box.style.borderColor = 'rgba(79,195,247,0.3)'; box.style.color = '#4fc3f7'; box.textContent = 'Sign in to access the investor portal.'; }
}
```

Also in login.html, on successful login, check for sessionStorage auth_redirect and redirect there instead of marketplace.html default:
```js
var intended = sessionStorage.getItem('auth_redirect');
if (intended) { sessionStorage.removeItem('auth_redirect'); window.location.href = intended; }
else { window.location.href = redirectUrl || '/marketplace.html'; }
```

Keep all existing logic in all files unchanged.
