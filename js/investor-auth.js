const _sb = window.supabase.createClient(
  'https://spvuknwwppqsbyrfduvw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdnVrbnd3cHBxc2J5cmZkdXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzE0ODUsImV4cCI6MjA5MTI0NzQ4NX0.sQ2aadeoio-zx5ttbEXMP_TKkvVgerwk6AjJ2tC2Mh0'
);

window.Portal = {
  supabase: _sb,

  async getSession() {
    const { data } = await _sb.auth.getSession();
    return data?.session || null;
  },

  async requireAuth() {
    const session = await this.getSession();
    if (!session) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
      return null;
    }
    return session;
  },

  async getProfile(userId) {
    // Try portal_users first (has avatar_url), fallback to contacts
    const { data: pu } = await _sb.from('portal_users')
      .select('id, first_name, last_name, email, phone, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();
    if (pu) return pu;
    const { data } = await _sb.from('contacts')
      .select('id, first_name, last_name, email, phone, custom_fields, portal_user_id')
      .eq('portal_user_id', userId)
      .maybeSingle();
    return data;
  },

  fc(n) {
    if (n == null || isNaN(n)) return '—';
    return '$' + Math.round(n).toLocaleString('en-US');
  },

  initTheme() {
    // Default: light mode on every new browser session.
    // User's saved preference (set in profile settings) persists via localStorage.
    // If they haven't explicitly chosen a theme this session, start fresh with light.
    const savedPref = localStorage.getItem('dom_portal_theme');
    const sessionSet = sessionStorage.getItem('dom_theme_session');
    let t;
    if (sessionSet) {
      // Already set this session (e.g. user toggled mid-session) — honor it
      t = document.documentElement.getAttribute('data-theme') || savedPref || 'light';
    } else {
      // New session: use saved preference if it exists, otherwise default to light
      t = savedPref || 'light';
      sessionStorage.setItem('dom_theme_session', '1');
    }
    document.documentElement.setAttribute('data-theme', t);
    this.updateThemeBtn();
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dom_portal_theme', next);
    sessionStorage.setItem('dom_theme_session', '1');
    this.updateThemeBtn();
    // Auto-switch map style: dark = satellite, light = custom
    if (typeof window._applyThemeMapStyle === 'function') window._applyThemeMapStyle();
  },

  updateThemeBtn() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    document.querySelectorAll('.theme-toggle').forEach(b => {
      b.textContent = isDark ? '☀️' : '🌙';
      b.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
    // Update pin menu theme button label if open
    const pinBtn = document.getElementById('pinThemeBtn');
    if (pinBtn) pinBtn.textContent = isDark ? '\u2600\uFE0F Switch to Light Mode' : '\uD83C\uDF19 Switch to Dark Mode';
  },

  async renderNav(opts) {
    opts = opts || {};
    const nav = document.getElementById('investorNav');
    if (!nav) return;
    const session = await this.getSession();
    let right = '';
    const navRight = document.getElementById('navRight');
    if (session && !opts.publicOnly) {
      const profile = await this.getProfile(session.user.id);
      const fname = profile ? (profile.first_name || '') : '';
      const lname = profile ? (profile.last_name || '') : '';
      const email = (profile && profile.email) || session.user.email;
      const fullName = [fname, lname].filter(Boolean).join(' ') || email.split('@')[0];
      const initials = ((fname[0] || '') + (lname[0] || '')).toUpperCase() || email[0].toUpperCase();
      const avatarUrl = profile ? profile.avatar_url : null;
      window._portalMenuUser = { name: fullName, email: email };
      if (navRight) {
        var inner = avatarUrl
          ? '<img src="' + avatarUrl + '" style="width:34px;height:34px;border-radius:50%;object-fit:cover;" alt="Profile">'
          : '<span style="font-size:13px;font-weight:800;color:#1a2744;">' + initials + '</span>';
        navRight.innerHTML = '<div id="navAvatarBtn" onclick="Portal.openProfileMenu()" style="width:36px;height:36px;border-radius:50%;background:#4fc3f7;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid rgba(79,195,247,0.4);">' + inner + '</div>';
      }
    } else {
      if (navRight) navRight.innerHTML = '<a href="/login.html" style="color:#4fc3f7;font-size:13px;font-weight:600;text-decoration:none;margin-right:8px;">Sign In</a><a href="/signup.html" style="background:#4fc3f7;color:#1a2744;font-size:13px;font-weight:700;padding:7px 16px;border-radius:8px;text-decoration:none;">Get Access</a>';
    }
    this.updateThemeBtn();
  },

  openPinMenu() {
    const existing = document.getElementById('domPinMenu');
    if (existing) { existing.remove(); return; }

    const u = window._portalMenuUser || { name: 'Investor', email: '' };
    const path = window.location.pathname;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    const overlay = document.createElement('div');
    overlay.id = 'domPinMenu';
    overlay.className = 'pin-menu-overlay';
    overlay.addEventListener('click', function(e) { if (e.target === overlay) Portal.closePinMenu(); });

    const links = [
      { href: '/marketplace.html', svg: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', label: 'Marketplace' },
      { href: '/dashboard.html', svg: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>', label: 'Dashboard' },
      { href: '/preferred-partners.html', svg: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', label: 'Preferred Partners' },
      { href: '/faq.html', svg: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2.5"/></svg>', label: 'FAQ' },
      { href: '/contact.html', svg: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', label: 'Contact' },
      { href: '/homepage.html', svg: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', label: 'Home' }
    ];

    const gridHTML = links.map(function(l) {
      const isActive = path === l.href || path === l.href.replace('.html', '') ;
      return '<a href="' + l.href + '" class="pin-menu-link' + (isActive ? ' active' : '') + '">' +
        '<span class="pin-menu-link-icon">' + l.svg + '</span>' +
        '<span class="pin-menu-link-label">' + l.label + '</span>' +
      '</a>';
    }).join('');

    var themeIcon = isDark ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    var themeLabel = isDark ? 'Light Mode' : 'Dark Mode';
    var themeHTML = '<button onclick="event.stopPropagation();Portal.toggleTheme();" class="pin-menu-link">' +
      '<span class="pin-menu-link-icon">' + themeIcon + '</span>' +
      '<span class="pin-menu-link-label">' + themeLabel + '</span>' +
    '</button>';
    var signOutHTML = '<button onclick="Portal.logout()" class="pin-menu-link pin-menu-signout">' +
      '<span class="pin-menu-link-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>' +
      '<span class="pin-menu-link-label">Sign Out</span>' +
    '</button>';

    overlay.innerHTML =
      '<div class="pin-menu-shape">' +
        '<div class="pin-menu-body">' +
          '<button class="pin-menu-close" onclick="Portal.closePinMenu()">&times;</button>' +
          '<div class="pin-menu-dot">' +
            '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2C7 2 3 6 3 11c0 7 9 13 9 13s9-6 9-13c0-5-4-9-9-9zm0 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="#1a2744"/></svg>' +
          '</div>' +
          '<div style="text-align:center;padding:10px 16px 14px;">' +
            '<div style="font-size:13px;font-weight:700;color:#f0f4ff;">' + u.name + '</div>' +
            (u.email ? '<div style="font-size:11px;color:#8a9bbf;margin-top:2px;">' + u.email + '</div>' : '') +
          '</div>' +
          '<div class="pin-menu-grid">' + gridHTML + '</div>' +
          '<div class="pin-menu-grid pin-menu-bottom-row">' + themeHTML + signOutHTML + '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('open'); });
  },

  closePinMenu() {
    const m = document.getElementById('domPinMenu');
    if (m) m.remove();
  },

  openProfileMenu() {
    const ex = document.getElementById('domProfileMenu');
    if (ex) { ex.remove(); return; }
    const u = window._portalMenuUser || { name: 'Investor', email: '' };
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    const themeLabel = dark ? 'Light Mode' : 'Dark Mode';
    const m = document.createElement('div');
    m.id = 'domProfileMenu';
    m.setAttribute('style', [
      'position:fixed', 'top:60px', 'right:16px', 'z-index:20000',
      'background:var(--surface,#1e2340)',
      'border:1.5px solid var(--border,rgba(255,255,255,0.1))',
      'border-radius:14px',
      'box-shadow:0 12px 40px rgba(0,0,0,0.45)',
      'min-width:220px', 'overflow:hidden',
      'font-family:Barlow,Inter,sans-serif'
    ].join(';'));

    var themeIcon = dark ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    m.innerHTML =
      '<style>.pm-item{display:flex;align-items:center;gap:12px;padding:10px 16px;font-size:13px;font-weight:600;text-decoration:none;background:none;border:none;width:100%;text-align:left;font-family:inherit;cursor:pointer;color:var(--text,#f0f4ff);border-left:3px solid transparent;transition:background .15s,border-color .15s;}.pm-item svg{transition:stroke .15s;flex-shrink:0;stroke:var(--text,#f0f4ff);}.pm-item:hover{background:rgba(79,195,247,0.08);border-left-color:#4fc3f7;color:#4fc3f7;}.pm-item:hover svg{stroke:#4fc3f7;}.pm-sep{height:1px;background:var(--border,rgba(255,255,255,0.08));margin:2px 0;}.pm-item-so{color:#e57373!important;}.pm-item-so svg{stroke:#e57373!important;}.pm-item-so:hover{background:rgba(229,115,115,0.08)!important;border-left-color:#e57373!important;color:#e57373!important;}.pm-item-so:hover svg{stroke:#e57373!important;}[data-theme="light"] .pm-item{color:#1a2332;}[data-theme="light"] .pm-item svg{stroke:#1a2332;}[data-theme="light"] .pm-item:hover{color:#4fc3f7;}[data-theme="light"] .pm-item:hover svg{stroke:#4fc3f7;}[data-theme="light"] #domProfileMenu{background:#fff!important;}</style>'
      + '<div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);">'
      + '<div style="font-size:14px;font-weight:800;color:var(--text,#f0f4ff);">' + u.name + '</div>'
      + '<div style="font-size:12px;color:var(--text-muted,#8a9bbf);margin-top:2px;">' + u.email + '</div></div>'
      + '<div style="padding:4px 0;">'
      + '<a href="/dashboard.html" class="pm-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> My Dashboard</a>'
      + '<a href="/dashboard.html?tab=settings" class="pm-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> My Settings</a>'
      + '<button onclick="var d=document.getElementById(\'domProfileMenu\');if(d)d.remove();Portal.toggleTheme();" class="pm-item">' + themeIcon + ' ' + themeLabel + '</button>'
      + '<div class="pm-sep"></div>'
      + '<button onclick="Portal.logout();" class="pm-item pm-item-so"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Sign Out</button>'
      + '</div>';
    document.body.appendChild(m);
    setTimeout(function() {
      document.addEventListener('click', function h(e) {
        var d = document.getElementById('domProfileMenu');
        var b = document.getElementById('navAvatarBtn');
        if (d && !d.contains(e.target) && b && !b.contains(e.target)) {
          d.remove();
          document.removeEventListener('click', h);
        }
      });
    }, 10);
  },

  async logout() {
    await _sb.auth.signOut();
    window.location.href = '/homepage.html';
  },

  openMobileMenu() {
    // Always recreate so theme state is fresh
    const existing = document.getElementById('portalMobileMenuOverlay');
    if (existing) existing.remove();

    const u = window._portalMenuUser || { name: 'Investor', email: '' };
    const path = window.location.pathname;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    const overlay = document.createElement('div');
    overlay.id = 'portalMobileMenuOverlay';
    overlay.className = 'portal-menu-overlay';

    const panel = document.createElement('div');
    panel.className = 'portal-menu-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'portal-menu-header';
    header.innerHTML =
      '<div><div class="portal-menu-user-name">' + u.name + '</div><div class="portal-menu-user-email">' + u.email + '</div></div>' +
      '<button class="portal-menu-close" onclick="Portal.closeMobileMenu()">&times;</button>';
    panel.appendChild(header);

    // Nav tiles grid
    const grid = document.createElement('div');
    grid.className = 'portal-menu-grid';
    const tiles = [
      { href: '/marketplace.html', icon: '&#127968;', label: 'Marketplace', sub: 'Browse deals' },
      { href: '/dashboard.html', icon: '&#128202;', label: 'Dashboard', sub: 'Your account' },
      { href: '/preferred-partners.html', icon: '&#129309;', label: 'Preferred Partners', sub: 'Partners' },
      { href: '/faq.html', icon: '&#10067;', label: 'FAQ', sub: 'Questions' },
      { href: '/contact.html', icon: '&#9993;', label: 'Contact', sub: 'Get in touch' },
      { href: '/homepage.html', icon: '&#127760;', label: 'Home', sub: 'Back to start' }
    ];
    tiles.forEach(function(t) {
      const isActive = path.includes(t.href.replace('.html','').replace('/','')) && t.href !== '/homepage.html';
      grid.innerHTML += '<a href="' + t.href + '" class="portal-menu-tile' + (isActive ? ' active' : '') + '">' +
        '<div class="portal-menu-tile-icon">' + t.icon + '</div>' +
        '<div class="portal-menu-tile-label">' + t.label + '</div>' +
        '<div class="portal-menu-tile-sub">' + t.sub + '</div>' +
        '</a>';
    });
    panel.appendChild(grid);

    // Footer: theme toggle + sign out
    const footer = document.createElement('div');
    footer.className = 'portal-menu-footer';

    // Theme toggle row — visual toggle switch
    const themeRow = document.createElement('div');
    themeRow.className = 'portal-menu-theme-row';
    themeRow.style.cursor = 'pointer';
    themeRow.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span id="mth_ic" style="font-size:18px;">' + (isDark ? '&#127769;' : '&#9728;') + '</span>' +
        '<span id="mth_lb" class="portal-menu-theme-label">' + (isDark ? 'Dark Mode' : 'Light Mode') + '</span>' +
      '</div>' +
      '<div style="width:44px;height:26px;background:#4fc3f7;border-radius:13px;position:relative;flex-shrink:0;">' +
        '<span id="mth_sw" style="position:absolute;top:3px;left:3px;width:20px;height:20px;background:#fff;border-radius:50%;display:block;transition:transform .2s;transform:' + (isDark ? 'translateX(18px)' : 'translateX(0)') + ';"></span>' +
      '</div>';
    themeRow.addEventListener('click', function() {
      Portal.toggleTheme();
      var nowDark = document.documentElement.getAttribute('data-theme') !== 'light';
      var ic = document.getElementById('mth_ic');
      var lb = document.getElementById('mth_lb');
      var sw = document.getElementById('mth_sw');
      if (ic) ic.innerHTML = nowDark ? '&#127769;' : '&#9728;';
      if (lb) lb.textContent = nowDark ? 'Dark Mode' : 'Light Mode';
      if (sw) sw.style.transform = nowDark ? 'translateX(18px)' : 'translateX(0)';
    });
    footer.appendChild(themeRow);

    const signOut = document.createElement('button');
    signOut.className = 'portal-menu-signout';
    signOut.textContent = 'Sign Out';
    signOut.onclick = function() { Portal.logout(); };
    footer.appendChild(signOut);

    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) Portal.closeMobileMenu();
    });

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeMobileMenu() {
    const overlay = document.getElementById('portalMobileMenuOverlay');
    if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
  },

  toast(msg, type) {
    type = type || 'info';
    let t = document.getElementById('portalToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'portalToast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;max-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.4);transition:opacity 0.3s;opacity:0';
      document.body.appendChild(t);
    }
    const colors = { success: '#22c55e', error: '#ef4444', info: '#4fc3f7', warning: '#f59e0b' };
    t.style.background = colors[type] || colors.info;
    t.style.color = (type === 'info' || type === 'warning') ? '#0f1a2e' : '#fff';
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3000);
  }
};

(function() { 
  Portal.initTheme();
  // On page load: show hamburger if logged in, sign-in button if not
  Portal.getSession().then(function(session) {
    var btn = document.querySelector('.pin-menu-btn');
    if (!session && btn) {
      btn.outerHTML = '<a href="/login.html" class="btn-secondary btn-sm" style="font-size:13px;padding:7px 16px;white-space:nowrap;">Sign In</a>';
    } else if (session) {
      window._portalMenuUser = { name: session.user.email.split('@')[0], email: session.user.email };
    }
  });
})();
