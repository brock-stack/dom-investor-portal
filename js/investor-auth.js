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
    const { data } = await _sb.from('contacts')
      .select('id, first_name, last_name, email, phone, contact_type, custom_fields')
      .eq('portal_user_id', userId)
      .maybeSingle();
    return data;
  },

  fc(n) {
    if (n == null || n === '') return '—';
    return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  },

  initTheme() {
    const saved = localStorage.getItem('dom_portal_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeBtn();
  },

  toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dom_portal_theme', next);
    this.updateThemeBtn();
  },

  updateThemeBtn() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    document.querySelectorAll('.theme-toggle').forEach(b => {
      b.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
  },

  async renderNav(opts) {
    opts = opts || {};
    const nav = document.getElementById('investorNav');
    if (!nav) return;
    const session = await this.getSession();
    let right = '';
    if (session && !opts.publicOnly) {
      const profile = await this.getProfile(session.user.id);
      const name = profile ? (profile.first_name || session.user.email.split('@')[0]) : 'Investor';
      const path = window.location.pathname;
      right = '<a href="/marketplace.html" class="nav-link' + (path.includes('marketplace') ? ' active' : '') + '">Marketplace</a>' +
              '<a href="/dashboard.html" class="nav-link' + (path.includes('dashboard') ? ' active' : '') + '">Dashboard</a>' +
              '<div class="nav-user"><span>' + name + '</span><button onclick="Portal.logout()" class="btn-logout">Sign Out</button></div>';
    } else {
      right = '<a href="/login.html" class="btn-secondary btn-sm">Sign In</a><a href="/signup.html" class="btn-primary btn-sm">Get Access</a>';
    }
    nav.innerHTML =
      '<a href="/homepage.html" class="nav-brand">' +
        '<img src="/img/dom-logo-white.png" alt="Direct Off Market" style="height:28px;width:auto;max-width:130px;object-fit:contain;vertical-align:middle;">' +
      '</a>' +
      '<div class="nav-right">' +
        right +
        '<button class="theme-toggle" onclick="Portal.toggleTheme()"></button>' +
      '</div>';
    this.updateThemeBtn();
  },

  async logout() {
    await _sb.auth.signOut();
    window.location.href = '/homepage.html';
  },

  async getPortalUserId(authUserId) {
    if (!authUserId) return null;
    const { data, error } = await _sb.from('portal_users')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();
    if (error) {
      console.error('getPortalUserId error:', error);
      return null;
    }
    if (!data) {
      console.warn('No portal_users row for auth user', authUserId);
      return null;
    }
    return data.id;
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
    const bg = { success: '#22c55e', error: '#ef4444', info: '#c9a84c' };
    t.style.background = bg[type] || bg.info;
    t.style.color = '#0f1a2e';
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.style.opacity = '0'; }, 3500);
  }
};

(function() { Portal.initTheme(); })();
