# Task: Build Photo Gallery for deal.html

Replace the current simple photo hero on deal.html with a full-featured gallery component.

## What to build

### 1. In investor.css - add these styles:

```css
.photo-gallery { position: relative; border-radius: 12px; overflow: hidden; background: #111; margin-bottom: 24px; }
.gallery-main { position: relative; height: 420px; overflow: hidden; cursor: pointer; }
.gallery-main img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gallery-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 42px; height: 42px; border-radius: 50%; background: rgba(0,0,0,0.55); color: white; border: none; font-size: 22px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.gallery-btn:hover { background: rgba(0,0,0,0.8); }
.gallery-prev { left: 12px; }
.gallery-next { right: 12px; }
.gallery-counter { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.6); color: white; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 20px; pointer-events: none; }
.gallery-expand { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.55); color: white; font-size: 12px; padding: 5px 14px; border-radius: 20px; cursor: pointer; }
.gallery-thumbs { display: flex; gap: 6px; padding: 8px 0 0; overflow-x: auto; scrollbar-width: none; }
.gallery-thumbs::-webkit-scrollbar { display: none; }
.gallery-thumb { width: 80px; height: 60px; flex-shrink: 0; border-radius: 6px; overflow: hidden; cursor: pointer; opacity: 0.65; transition: opacity 0.15s; border: 2px solid transparent; }
.gallery-thumb.active { opacity: 1; border-color: var(--accent); }
.gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
.gallery-more { width: 80px; height: 60px; flex-shrink: 0; border-radius: 6px; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 15px; cursor: pointer; }
.gallery-modal { display: none; position: fixed; inset: 0; z-index: 9998; background: rgba(0,0,0,0.95); align-items: center; justify-content: center; }
.gallery-modal.open { display: flex; }
.gallery-modal-img { max-height: 88vh; max-width: 88vw; object-fit: contain; border-radius: 4px; }
.gallery-modal-prev, .gallery-modal-next { position: fixed; top: 50%; transform: translateY(-50%); width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.15); color: white; border: none; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.gallery-modal-prev { left: 16px; }
.gallery-modal-next { right: 16px; }
.gallery-modal-close { position: fixed; top: 16px; right: 16px; background: rgba(255,255,255,0.15); border: none; color: white; font-size: 22px; width: 42px; height: 42px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.gallery-modal-counter { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); color: white; font-size: 14px; font-weight: 600; background: rgba(0,0,0,0.4); padding: 4px 14px; border-radius: 20px; }
@media (max-width: 768px) { .gallery-main { height: 240px; } }
```

### 2. In deal.html - replace the photo section

Find where `<div id="photoHero"` is defined (in the Overview tab or above tabs). Replace it with:

```html
<div class="photo-gallery" id="photoGallery" style="display:none;">
  <div class="gallery-main" id="galleryMain" onclick="openGalleryModal(galleryIdx)">
    <img id="galleryHeroImg" src="" alt="Property photo">
    <button class="gallery-btn gallery-prev" onclick="event.stopPropagation();galleryPrev()">&#8249;</button>
    <button class="gallery-btn gallery-next" onclick="event.stopPropagation();galleryNext()">&#8250;</button>
    <div class="gallery-counter" id="galleryCounter">1 / 1</div>
    <div class="gallery-expand">&#128269; Click to expand</div>
  </div>
  <div class="gallery-thumbs" id="galleryThumbs"></div>
</div>

<!-- Fullscreen gallery modal -->
<div class="gallery-modal" id="galleryModal" onclick="if(event.target===this)closeGalleryModal()">
  <img class="gallery-modal-img" id="galleryModalImg" src="" alt="">
  <button class="gallery-modal-prev" onclick="galleryModalNav(-1)">&#8249;</button>
  <button class="gallery-modal-next" onclick="galleryModalNav(1)">&#8250;</button>
  <button class="gallery-modal-close" onclick="closeGalleryModal()">&#215;</button>
  <div class="gallery-modal-counter" id="galleryModalCounter">1 / 1</div>
</div>
```

### 3. In deal.html - add gallery JS (add near the top of the script, after variable declarations)

```js
var galleryPhotos = [];
var galleryIdx = 0;

function initGallery(photos) {
  if (!photos || photos.length === 0) return;
  galleryPhotos = photos;
  galleryIdx = 0;
  var el = document.getElementById('photoGallery');
  if (el) el.style.display = '';
  renderGalleryMain();
  renderGalleryThumbs();
}

function renderGalleryMain() {
  var img = document.getElementById('galleryHeroImg');
  var ctr = document.getElementById('galleryCounter');
  if (img) img.src = galleryPhotos[galleryIdx].url;
  if (ctr) ctr.textContent = (galleryIdx + 1) + ' / ' + galleryPhotos.length;
  document.querySelectorAll('.gallery-thumb').forEach(function(t, i) {
    t.classList.toggle('active', i === galleryIdx);
  });
}

function renderGalleryThumbs() {
  var el = document.getElementById('galleryThumbs');
  if (!el) return;
  var visible = galleryPhotos.slice(0, 4);
  var extra = galleryPhotos.length - 4;
  el.innerHTML = visible.map(function(p, i) {
    return '<div class="gallery-thumb' + (i === 0 ? ' active' : '') + '" onclick="setGalleryIdx(' + i + ')"><img src="' + p.url + '" loading="lazy"></div>';
  }).join('') + (extra > 0 ? '<div class="gallery-more" onclick="openGalleryModal(' + galleryIdx + ')">+' + extra + '</div>' : '');
}

function setGalleryIdx(i) { galleryIdx = i; renderGalleryMain(); }
function galleryPrev() { galleryIdx = (galleryIdx - 1 + galleryPhotos.length) % galleryPhotos.length; renderGalleryMain(); }
function galleryNext() { galleryIdx = (galleryIdx + 1) % galleryPhotos.length; renderGalleryMain(); }

function openGalleryModal(startIdx) {
  galleryIdx = startIdx || 0;
  var modal = document.getElementById('galleryModal');
  var img = document.getElementById('galleryModalImg');
  var ctr = document.getElementById('galleryModalCounter');
  if (!modal || !img) return;
  img.src = galleryPhotos[galleryIdx].url;
  if (ctr) ctr.textContent = (galleryIdx + 1) + ' / ' + galleryPhotos.length;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGalleryModal() {
  var modal = document.getElementById('galleryModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

function galleryModalNav(dir) {
  galleryIdx = (galleryIdx + dir + galleryPhotos.length) % galleryPhotos.length;
  var img = document.getElementById('galleryModalImg');
  var ctr = document.getElementById('galleryModalCounter');
  if (img) img.src = galleryPhotos[galleryIdx].url;
  if (ctr) ctr.textContent = (galleryIdx + 1) + ' / ' + galleryPhotos.length;
}

// Keyboard nav
document.addEventListener('keydown', function(e) {
  var modal = document.getElementById('galleryModal');
  if (!modal || !modal.classList.contains('open')) return;
  if (e.key === 'ArrowLeft') galleryModalNav(-1);
  else if (e.key === 'ArrowRight') galleryModalNav(1);
  else if (e.key === 'Escape') closeGalleryModal();
});

// Touch swipe for modal
(function() {
  var tx = 0;
  document.addEventListener('touchstart', function(e) { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function(e) {
    var modal = document.getElementById('galleryModal');
    if (!modal || !modal.classList.contains('open')) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) galleryModalNav(dx < 0 ? 1 : -1);
  }, { passive: true });
})();
```

### 4. Update loadPhotos() in deal.html

Find the existing loadPhotos() function. After fetching photos, replace the current renderGallery() or photoHero rendering with:
```js
initGallery(photos);
```

Also update the Photos tab (tab-photos) to call openGalleryModal(0) or show the same gallery there.

Keep ALL other code in deal.html unchanged. Do not touch the tabs, pro forma, offer, map, or auth sections.
