// DOM Investor Portal — Onboarding Wizard
// Called after login if portal_users.onboarding_complete is false/null

window.DOMOnboarding = (function() {

  var _session = null;
  var _portalUserId = null;
  var _currentStep = 1;
  var _totalSteps = 4;
  var _data = { step1: {}, step2: {}, step3: {}, step4: {} };

  // ── Check if onboarding needed ──────────────────────────────
  async function checkAndShow(session) {
    _session = session;
    try {
      var res = await Portal.supabase
        .from('portal_users')
        .select('id, onboarding_complete, first_name')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!res.data) return; // no portal_users row yet
      _portalUserId = res.data.id;
      if (res.data.onboarding_complete) return; // already done

      showWizard(res.data.first_name || '');
    } catch(e) { console.warn('[Onboarding] check failed:', e); }
  }

  // ── Show wizard overlay ─────────────────────────────────────
  function showWizard(firstName) {
    var overlay = document.createElement('div');
    overlay.id = 'onboardingOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;padding:16px;';

    overlay.innerHTML =
      '<div id="onboardingCard" style="background:var(--surface,#1a2744);border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:16px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;position:relative;">' +
        // Progress bar
        '<div style="padding:24px 28px 0;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
            '<span id="ob_stepLabel" style="font-size:12px;font-weight:600;color:var(--text-muted,#8a9bbf);text-transform:uppercase;letter-spacing:.05em;">Step 1 of 4</span>' +
            '<button onclick="DOMOnboarding.skip()" style="background:none;border:none;font-size:13px;color:var(--text-muted,#8a9bbf);cursor:pointer;text-decoration:underline;">Skip for now →</button>' +
          '</div>' +
          '<div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">' +
            '<div id="ob_progress" style="height:100%;background:#4fc3f7;border-radius:2px;transition:width .3s;width:25%;"></div>' +
          '</div>' +
        '</div>' +
        // Step container
        '<div id="ob_stepContainer" style="padding:28px;">' +
        '</div>' +
        // Nav buttons
        '<div style="display:flex;justify-content:space-between;padding:0 28px 24px;gap:12px;">' +
          '<button id="ob_backBtn" onclick="DOMOnboarding.prev()" style="padding:10px 24px;border:1px solid var(--border,rgba(255,255,255,0.1));border-radius:8px;background:none;color:var(--text,#f0f4ff);cursor:pointer;font-size:14px;font-weight:600;display:none;">← Back</button>' +
          '<div style="flex:1;"></div>' +
          '<button id="ob_nextBtn" onclick="DOMOnboarding.next()" style="padding:12px 32px;border:none;border-radius:8px;background:#4fc3f7;color:#0f172a;cursor:pointer;font-size:15px;font-weight:800;">Continue →</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    renderStep(1, firstName);
  }

  // ── Render steps ────────────────────────────────────────────
  function renderStep(step, hint) {
    _currentStep = step;
    var container = document.getElementById('ob_stepContainer');
    var progressPct = (step / _totalSteps * 100) + '%';
    document.getElementById('ob_progress').style.width = progressPct;
    document.getElementById('ob_stepLabel').textContent = 'Step ' + step + ' of ' + _totalSteps;
    document.getElementById('ob_backBtn').style.display = step > 1 ? '' : 'none';
    document.getElementById('ob_nextBtn').textContent = step === _totalSteps ? 'Complete Setup ✓' : 'Continue →';

    var html = '';
    if (step === 1) {
      html = step1HTML(hint);
    } else if (step === 2) {
      html = step2HTML();
    } else if (step === 3) {
      html = step3HTML();
    } else if (step === 4) {
      html = step4HTML();
    }

    container.innerHTML = html;
    attachPillHandlers(container);
    // Init flatpickr on birthdate if available
    if (step === 1 && typeof flatpickr !== 'undefined') {
      setTimeout(function() {
        var el = document.getElementById('ob_birthdate');
        if (el) flatpickr(el, { dateFormat: 'Y-m-d', maxDate: 'today', disableMobile: true, allowInput: true });
      }, 50);
    }
    if (step === 4) renderSummary();
  }

  function pillCSS(selected) {
    var base = 'min-width:80px;padding:7px 14px;border-radius:20px;font-size:13px;cursor:pointer;font-family:inherit;transition:background .15s,color .15s;box-sizing:border-box;text-align:center;';
    return selected
      ? base + 'border:1.5px solid #4fc3f7;background:#4fc3f7;color:#0f172a;font-weight:700;'
      : base + 'border:1.5px solid var(--border,rgba(255,255,255,0.15));background:none;color:var(--text-muted,#8a9bbf);font-weight:600;';
  }

  function pillGroup(id, options, multi) {
    return '<div id="' + id + '" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">' +
      options.map(function(o) {
        return '<button type="button" class="ob-pill" data-group="' + id + '" data-val="' + o + '" data-multi="' + (multi?'1':'0') + '" style="' + pillCSS(false) + '">' + o + '</button>';
      }).join('') +
    '</div>';
  }

  function field(label, inputHtml) {
    return '<div style="margin-bottom:18px;">' +
      '<label style="display:block;font-size:12px;font-weight:700;color:var(--text-muted,#8a9bbf);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">' + label + '</label>' +
      inputHtml +
      '</div>';
  }

  var inputStyle = 'width:100%;padding:10px 12px;border:1px solid var(--border,rgba(255,255,255,0.15));border-radius:8px;background:var(--surface-2,rgba(255,255,255,0.05));color:var(--text,#f0f4ff);font-size:14px;box-sizing:border-box;font-family:inherit;';

  function step1HTML(firstName) {
    var greeting = firstName ? 'Welcome, ' + firstName + '!' : 'Welcome!';
    return '<h2 style="font-size:22px;font-weight:800;margin:0 0 4px;">' + greeting + '</h2>' +
      '<p style="font-size:14px;color:var(--text-muted,#8a9bbf);margin:0 0 24px;">Tell us a bit about yourself to personalize your experience.</p>' +
      field('Company / Entity Name', '<input id="ob_company" type="text" placeholder="e.g. ABC Investments LLC" style="' + inputStyle + '">') +
      field('Entity Type', pillGroup('ob_entityType', ['Individual','LLC','Corp','Trust'], false)) +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        field('Street Address', '<input id="ob_street" type="text" placeholder="123 Main St" style="' + inputStyle + '">') +
        field('City', '<input id="ob_city" type="text" placeholder="Tampa" style="' + inputStyle + '">') +
        '<div id="ob_stateWrapper">' + field('State', '<select id="ob_state" style="' + inputStyle + '"><option value="">State</option><option value="AL">AL</option><option value="AK">AK</option><option value="AZ">AZ</option><option value="AR">AR</option><option value="CA">CA</option><option value="CO">CO</option><option value="CT">CT</option><option value="DE">DE</option><option value="DC">DC</option><option value="FL">FL</option><option value="GA">GA</option><option value="HI">HI</option><option value="ID">ID</option><option value="IL">IL</option><option value="IN">IN</option><option value="IA">IA</option><option value="KS">KS</option><option value="KY">KY</option><option value="LA">LA</option><option value="ME">ME</option><option value="MD">MD</option><option value="MA">MA</option><option value="MI">MI</option><option value="MN">MN</option><option value="MS">MS</option><option value="MO">MO</option><option value="MT">MT</option><option value="NE">NE</option><option value="NV">NV</option><option value="NH">NH</option><option value="NJ">NJ</option><option value="NM">NM</option><option value="NY">NY</option><option value="NC">NC</option><option value="ND">ND</option><option value="OH">OH</option><option value="OK">OK</option><option value="OR">OR</option><option value="PA">PA</option><option value="RI">RI</option><option value="SC">SC</option><option value="SD">SD</option><option value="TN">TN</option><option value="TX">TX</option><option value="UT">UT</option><option value="VT">VT</option><option value="VA">VA</option><option value="WA">WA</option><option value="WV">WV</option><option value="WI">WI</option><option value="WY">WY</option></select>') + '</div>' +

        field('ZIP', '<input id="ob_zip" type="text" placeholder="33601" style="' + inputStyle + '">') +
      '</div>' +
      '<div style="margin-bottom:12px;">' +
        '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text-muted,#8a9bbf);">' +
          '<input type="checkbox" id="ob_intl" onchange="DOMOnboarding._toggleIntl(this.checked)"> International address' +
        '</label>' +
      '</div>' +
      '<div id="ob_intlRow" style="display:none;margin-bottom:18px;">' +
        '<label style="display:block;font-size:12px;font-weight:700;color:var(--text-muted,#8a9bbf);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Country</label>' +
        '<input id="ob_country" type="text" placeholder="Country" style="' + inputStyle + '">' +
        '<label style="display:block;font-size:12px;font-weight:700;color:var(--text-muted,#8a9bbf);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;margin-top:12px;">Province / Region</label>' +
        '<input id="ob_province" type="text" placeholder="Province or Region" style="' + inputStyle + '">' +
      '</div>' +
      field('Birthdate', '<input id="ob_birthdate" type="date" style="' + inputStyle + '">') +
      field('Working with a Realtor?', pillGroup('ob_realtor', ['Yes','No'], false)) +
      '<div id="ob_realtorFields" style="overflow:hidden;max-height:0;transition:max-height .3s ease;">' +
        '<div style="padding-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
          field('Realtor Name', '<input id="ob_realtorName" type="text" placeholder="Jane Doe" style="' + inputStyle + '">') +
          field('Brokerage', '<input id="ob_realtorCompany" type="text" placeholder="Keller Williams" style="' + inputStyle + '">') +
          field('Realtor Phone', '<input id="ob_realtorPhone" type="tel" placeholder="(813) 555-0100" style="' + inputStyle + '" oninput="var x=this.value.replace(/\\D/g,\'\').substring(0,10),f=\'\';if(x.length>0)f=\'(\'+x.substring(0,3);if(x.length>=3)f+=\') \'+x.substring(3,6);if(x.length>=6)f+=\'-\'+x.substring(6,10);this.value=f">') +
          field('Realtor Email', '<input id="ob_realtorEmail" type="email" placeholder="realtor@example.com" style="' + inputStyle + '">') +
        '</div>' +
      '</div>';
  }

  function step2HTML() {
    return '<h2 style="font-size:22px;font-weight:800;margin:0 0 4px;">Investment Profile</h2>' +
      '<p style="font-size:14px;color:var(--text-muted,#8a9bbf);margin:0 0 24px;">Help us match you with the right deals.</p>' +
      field('Accredited Investor?', pillGroup('ob_accredited', ['Yes','No','Not Sure'], false)) +
      field('Properties Currently Owned', '<input id="ob_propsOwned" type="number" min="0" placeholder="0" style="' + inputStyle + 'max-width:120px;">') +
      field('Estimated Liquidity', '<select id="ob_liquidity" style="' + inputStyle + '"><option value="">Select range...</option><option value="0-50k">$0 – $50K</option><option value="50k-250k">$50K – $250K</option><option value="250k-1m">$250K – $1M</option><option value="1m+">$1M+</option></select>') +
      field('Experience Level', pillGroup('ob_experience', ['First-Time Buyer','1-5 Deals','6-20 Deals','20+ Deals'], false));
  }

  function step3HTML() {
    return '<h2 style="font-size:22px;font-weight:800;margin:0 0 4px;">Your Buy Box</h2>' +
      '<p style="font-size:14px;color:var(--text-muted,#8a9bbf);margin:0 0 24px;">What kind of deals are you looking for?</p>' +
      field('Target Markets', pillGroup('ob_markets', ['Tampa','Orlando','Sarasota','North Port','Cape Coral','Fort Myers','Jacksonville','Miami','Fort Lauderdale','Gainesville','Space Coast','Other'], true) + '<input id="ob_otherMarkets" type="text" placeholder="Enter additional markets (comma separated)" style="display:none;margin-top:10px;' + inputStyle + '">') +
      field('Property Types', pillGroup('ob_propTypes', ['Single Family','Multi-Family','Townhouse','Condo'], true)) +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div>' +
          '<label style="display:block;font-size:12px;font-weight:700;color:var(--text-muted,#8a9bbf);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Min Price</label>' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<input id="ob_minPrice" type="text" inputmode="numeric" placeholder="$100,000" style="' + inputStyle + 'flex:1;" oninput="var v=this.value.replace(/[^\\d]/g,\'\');this.value=v?\'$\'+parseInt(v).toLocaleString():this.value=\'\'">' +
            '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text-muted,#8a9bbf);white-space:nowrap;cursor:pointer;"><input type="checkbox" id="ob_noMin" onchange="var i=document.getElementById(\'ob_minPrice\');i.disabled=this.checked;if(this.checked)i.value=\'\'"> No min</label>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<label style="display:block;font-size:12px;font-weight:700;color:var(--text-muted,#8a9bbf);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Max Price</label>' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<input id="ob_maxPrice" type="text" inputmode="numeric" placeholder="$500,000" style="' + inputStyle + 'flex:1;" oninput="var v=this.value.replace(/[^\\d]/g,\'\');this.value=v?\'$\'+parseInt(v).toLocaleString():this.value=\'\'">' +
            '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text-muted,#8a9bbf);white-space:nowrap;cursor:pointer;"><input type="checkbox" id="ob_noMax" onchange="var i=document.getElementById(\'ob_maxPrice\');i.disabled=this.checked;if(this.checked)i.value=\'\'"> No max</label>' +
          '</div>' +
        '</div>' +
      '</div>' +
      field('Strategy', pillGroup('ob_strategy', ['Fix & Flip','Buy & Hold','BRRRR','Wholesale','New Construction'], true)) +
      field('Financing', pillGroup('ob_financing', ['Cash','Conventional','DSCR','Hard Money','FHA/VA'], true));
  }

  function step4HTML() {
    return '<h2 style="font-size:22px;font-weight:800;margin:0 0 4px;">Almost Done! 🎉</h2>' +
      '<p style="font-size:14px;color:var(--text-muted,#8a9bbf);margin:0 0 20px;">Review your profile summary before completing setup.</p>' +
      '<div id="ob_summary" style="background:var(--surface-2,rgba(255,255,255,0.05));border-radius:10px;padding:16px;font-size:13px;line-height:1.8;margin-bottom:20px;"></div>' +
      '<div style="margin-bottom:18px;">' +
        '<label style="display:block;font-size:12px;font-weight:700;color:var(--text-muted,#8a9bbf);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Profile Photo (optional)</label>' +
        '<div style="display:flex;align-items:center;gap:20px;">' +
          '<div id="ob_photoCircle" onclick="DOMOnboarding._triggerPhoto()" style="width:120px;height:120px;border-radius:50%;border:2px dashed var(--border,rgba(255,255,255,0.2));background:var(--surface-2,rgba(255,255,255,0.05));display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;flex-shrink:0;">' +
            '<span id="ob_photoIcon" style="font-size:28px;margin-bottom:4px;">📷</span>' +
            '<span id="ob_photoLabel" style="font-size:11px;color:var(--text-muted,#8a9bbf);text-align:center;">Click to upload</span>' +
            '<img id="ob_photoPreview" src="" style="display:none;width:100%;height:100%;object-fit:cover;">' +
          '</div>' +
          '<div style="font-size:13px;color:var(--text-muted,#8a9bbf);line-height:1.6;">Square or portrait photo works best.<br>JPG, PNG, or GIF. Max 5MB.</div>' +
        '</div>' +
        '<input id="ob_photo" type="file" accept="image/*" style="display:none;" onchange="DOMOnboarding._previewPhoto(this)">' +
      '</div>';
  }

  function renderSummary() {
    var s = _data;
    var lines = [];
    if (s.step1.company) lines.push('<strong>Company:</strong> ' + s.step1.company);
    if (s.step1.entityType) lines.push('<strong>Entity:</strong> ' + s.step1.entityType);
    if (s.step1.city) lines.push('<strong>Location:</strong> ' + [s.step1.city, s.step1.state].filter(Boolean).join(', '));
    if (s.step2.accredited) lines.push('<strong>Accredited:</strong> ' + s.step2.accredited);
    if (s.step2.liquidity) lines.push('<strong>Liquidity:</strong> ' + s.step2.liquidity);
    if (s.step2.experience) lines.push('<strong>Experience:</strong> ' + s.step2.experience);
    if (s.step3.markets && s.step3.markets.length) lines.push('<strong>Markets:</strong> ' + s.step3.markets.join(', '));
    if (s.step3.propTypes && s.step3.propTypes.length) lines.push('<strong>Property Types:</strong> ' + s.step3.propTypes.join(', '));
    if (s.step3.strategy && s.step3.strategy.length) lines.push('<strong>Strategy:</strong> ' + s.step3.strategy.join(', '));
    if (s.step3.financing && s.step3.financing.length) lines.push('<strong>Financing:</strong> ' + s.step3.financing.join(', '));
    var el = document.getElementById('ob_summary');
    if (el) el.innerHTML = lines.length ? lines.join('<br>') : '<span style="color:var(--text-muted)">No information entered — you can fill this in from your profile later.</span>';
  }

  function attachPillHandlers(container) {
    container.querySelectorAll('.ob-pill').forEach(function(pill) {
      pill.addEventListener('click', function() {
        var group = pill.dataset.group;
        var multi = pill.dataset.multi === '1';
        if (!multi) {
          container.querySelectorAll('.ob-pill[data-group="' + group + '"]').forEach(function(p) {
            p.style.cssText = pillCSS(false);
            p.dataset.selected = '';
          });
        }
        var sel = pill.dataset.selected === '1';
        pill.dataset.selected = sel ? '' : '1';
        pill.style.cssText = pillCSS(!sel);
        // Realtor reveal
        if (group === 'ob_realtor') {
          var rf = document.getElementById('ob_realtorFields');
          if (rf) rf.style.maxHeight = (pill.dataset.val === 'Yes' && !sel) ? '400px' : '0';
        }
        // Other market text input reveal
        if (group === 'ob_markets' && pill.dataset.val === 'Other') {
          var oi = document.getElementById('ob_otherMarkets');
          if (oi) oi.style.display = (!sel) ? '' : 'none';
        }
      });
    });
  }

  function collectStep(step) {
    var container = document.getElementById('ob_stepContainer');
    function pills(id) {
      return Array.from(container.querySelectorAll('.ob-pill[data-group="' + id + '"][data-selected="1"]')).map(function(p){return p.dataset.val;});
    }
    function pill1(id) { var r = pills(id); return r.length ? r[0] : ''; }
    function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

    if (step === 1) {
      _data.step1 = { company: val('ob_company'), entityType: pill1('ob_entityType'), street: val('ob_street'), city: val('ob_city'), state: val('ob_state'), zip: val('ob_zip'), birthdate: val('ob_birthdate'), realtor: pill1('ob_realtor'), realtorName: val('ob_realtorName'), realtorCompany: val('ob_realtorCompany'), realtorPhone: val('ob_realtorPhone'), realtorEmail: val('ob_realtorEmail') };
    } else if (step === 2) {
      _data.step2 = { accredited: pill1('ob_accredited'), propsOwned: val('ob_propsOwned'), liquidity: val('ob_liquidity'), experience: pill1('ob_experience') };
    } else if (step === 3) {
      var mkts = pills('ob_markets');
      var otherMkt = val('ob_otherMarkets');
      if (otherMkt) otherMkt.split(',').forEach(function(m){ var t=m.trim(); if(t && mkts.indexOf(t)<0) mkts.push(t); });
      function priceInt(id, noCheckId) { if (noCheckId && document.getElementById(noCheckId) && document.getElementById(noCheckId).checked) return null; var v = val(id).replace(/[^\d]/g,''); return v ? parseInt(v) : null; }
      _data.step3 = { markets: mkts, propTypes: pills('ob_propTypes'), minPrice: priceInt('ob_minPrice','ob_noMin'), maxPrice: priceInt('ob_maxPrice','ob_noMax'), strategy: pills('ob_strategy'), financing: pills('ob_financing') };
    }
  }

  // ── Navigation ──────────────────────────────────────────────
  function next() {
    collectStep(_currentStep);
    if (_currentStep < _totalSteps) {
      renderStep(_currentStep + 1);
    } else {
      complete();
    }
  }

  function prev() {
    collectStep(_currentStep);
    if (_currentStep > 1) renderStep(_currentStep - 1);
  }

  async function skip() {
    if (!_portalUserId) { dismiss(); return; }
    try {
      var authId = _session && _session.user ? _session.user.id : null;
      await Portal.supabase.from('portal_users').update({onboarding_complete: true}).eq('user_id', authId);
    } catch(e) {}
    dismiss();
  }

  function dismiss() {
    var el = document.getElementById('onboardingOverlay');
    if (el) el.remove();
  }

  function showCompletionModal() {
    var firstName = (_data.step1 && _data.step1.company) ? '' : '';
    try { firstName = _session.user.user_metadata.first_name || ''; } catch(e) {}
    var modal = document.createElement('div');
    modal.id = 'ob_completeModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML =
      '<div style="background:#ffffff;border-radius:16px;padding:40px 32px;width:100%;max-width:400px;text-align:center;">' +
        '<div style="font-size:48px;margin-bottom:16px;">🎉</div>' +
        '<h2 style="font-size:24px;font-weight:900;color:#1a2744;margin:0 0 8px;">You\'re all set!</h2>' +
        (firstName ? '<p style="font-size:16px;color:#374151;margin:0 0 4px;">Welcome to Direct Off Market, ' + firstName + '.</p>' : '<p style="font-size:16px;color:#374151;margin:0 0 4px;">Welcome to Direct Off Market.</p>') +
        '<p style="font-size:14px;color:#6b7280;margin:0 0 28px;">Your investor profile is ready.</p>' +
        '<button onclick="document.getElementById(\'ob_completeModal\').remove();window.location.href=\'/marketplace.html\'" style="background:#1a2744;color:white;border:none;border-radius:10px;padding:14px 32px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;">Browse Deals →</button>' +
      '</div>';
    document.body.appendChild(modal);
    setTimeout(function() {
      var el = document.getElementById('ob_completeModal');
      if (el) { el.remove(); window.location.href = '/dashboard.html'; }
    }, 4000);
  }

  async function complete() {
    collectStep(4);
    var btn = document.getElementById('ob_nextBtn');
    if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }

    try {
      // Build portal_users update
      var pu = {
        onboarding_complete: true,
        company: _data.step1.company || null,
        entity_type: _data.step1.entityType || null, // v2.4.10 §A: was collected in step1 but never persisted
        accredited_investor: _data.step2.accredited ? (_data.step2.accredited.toLowerCase() === 'yes') : null, // v2.4.10 §B: was going only to investor_buy_box
        investor_type: (_data.step2.experience ? [_data.step2.experience] : null),
        mailing_street: _data.step1.street || null,
        mailing_city: _data.step1.city || null,
        mailing_state: _data.step1.state || null,
        mailing_zip: _data.step1.zip || null,
        mailing_country: _data.step1.country || null,
        birthdate: _data.step1.birthdate || null,
        working_with_realtor: _data.step1.realtor || null,
        realtor_name: _data.step1.realtorName || null,
        realtor_company: _data.step1.realtorCompany || null,
        realtor_phone: _data.step1.realtorPhone || null,
        realtor_email: _data.step1.realtorEmail || null,
        properties_owned: _data.step2.propsOwned ? parseInt(_data.step2.propsOwned) : null,
        est_liquidity: _data.step2.liquidity || null
      };
      // Get auth user_id — fetch fresh if _session is stale
      var authUserId = _session && _session.user ? _session.user.id : null;
      if (!authUserId) {
        try { var freshSess = await Portal.getSession(); authUserId = freshSess && freshSess.user ? freshSess.user.id : null; } catch(e) {}
      }
      console.log('[Onboarding] Saving profile, portalUserId:', _portalUserId, 'authUserId:', authUserId, 'data:', pu);
      var puRes = await Portal.supabase.from('portal_users').update(pu).eq('user_id', authUserId);
      console.log('[Onboarding] portal_users update:', puRes.error ? 'ERROR: ' + puRes.error.message + ' code:' + puRes.error.code : 'OK rows:' + (puRes.count || 'unknown'));

      // Upsert investor_buy_box
      var bb = {
        user_id: _portalUserId,
        markets: _data.step3.markets || [],
        property_types: _data.step3.propTypes || [],
        min_price: _data.step3.minPrice || null,
        max_price: _data.step3.maxPrice || null,
        strategy: _data.step3.strategy || [],
        financing_type: _data.step3.financing || [],
        updated_at: new Date().toISOString()
      };
      console.log('[Onboarding] Saving buy box:', bb);
      // Safe insert-or-update (no unique constraint on user_id yet)
      var existBB = await Portal.supabase.from('investor_buy_box').select('id').eq('user_id', _portalUserId).maybeSingle();
      var bbRes;
      if (existBB.data && existBB.data.id) {
        bbRes = await Portal.supabase.from('investor_buy_box').update(bb).eq('id', existBB.data.id);
      } else {
        bbRes = await Portal.supabase.from('investor_buy_box').insert(bb);
      }
      console.log('[Onboarding] investor_buy_box save:', bbRes.error ? 'ERROR: ' + bbRes.error.message : 'OK');
      // Verify the save actually took effect
      var verify = await Portal.supabase.from('portal_users').select('onboarding_complete').eq('user_id', authUserId).maybeSingle();
      console.log('[Onboarding] verify after save:', verify.data, verify.error ? 'ERR:'+verify.error.message : '');

      // Realtor CRM record creation (non-blocking)
      if (_data.step1.realtor === 'Yes' && _data.step1.realtorName) {
        try {
          var rNameParts = _data.step1.realtorName.trim().split(' ');
          var rFirst = rNameParts[0] || '';
          var rLast = rNameParts.slice(1).join(' ') || '';
          // Create realtor contact
          var realtorInsert = await Portal.supabase.from('contacts').insert({
            first_name: rFirst, last_name: rLast,
            email: _data.step1.realtorEmail || null,
            phone: _data.step1.realtorPhone || null,
            record_type: 'realtor',
            contact_type: '["realtor"]',
            notes: 'Auto-created from investor onboarding'
          }).select('id').maybeSingle();
          var realtorContactId = realtorInsert.data ? realtorInsert.data.id : null;
          // Create brokerage organization if name provided
          if (_data.step1.realtorCompany && realtorContactId) {
            await Portal.supabase.from('contacts').insert({
              first_name: _data.step1.realtorCompany, last_name: '',
              record_type: 'organization',
              contact_type: '["organization"]',
              notes: 'Brokerage — auto-created from investor onboarding'
            });
          }
        } catch(e) { console.warn('[Onboarding] realtor CRM:', e); }
      }

      // Photo upload (optional)
      var photoInput = document.getElementById('ob_photo');
      if (photoInput && photoInput.files && photoInput.files[0]) {
        try {
          var file = photoInput.files[0];
          var fname = 'avatar-' + _portalUserId + '.' + file.name.split('.').pop();
          var up = await Portal.supabase.storage.from('avatars').upload(fname, file, {upsert: true, contentType: file.type});
          if (!up.error) {
            var url = Portal.supabase.storage.from('avatars').getPublicUrl(fname).data.publicUrl;
            await Portal.supabase.from('portal_users').update({avatar_url: url}).eq('id', _portalUserId);
          }
        } catch(e) { console.warn('Photo upload:', e); }
      }

    } catch(e) {
      console.warn('[Onboarding] save error:', e);
    }

    dismiss();
    showCompletionModal();
  }

  function _toggleIntl(on) {
    var row = document.getElementById('ob_intlRow');
    var stateField = document.querySelector('select#ob_state');
    if (row) row.style.display = on ? '' : 'none';
    var stateWrap = document.getElementById('ob_stateWrapper'); if (stateWrap) stateWrap.style.display = on ? 'none' : '';
  }

  function _previewPhoto(input) {
    if (!input.files || !input.files[0]) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var icon = document.getElementById('ob_photoIcon');
      var label = document.getElementById('ob_photoLabel');
      var preview = document.getElementById('ob_photoPreview');
      if (icon) icon.style.display = 'none';
      if (label) label.style.display = 'none';
      if (preview) { preview.src = e.target.result; preview.style.display = ''; }
    };
    reader.readAsDataURL(input.files[0]);
  }

  function _triggerPhoto() { var el = document.getElementById('ob_photo'); if (el) el.click(); }

  return { checkAndShow: checkAndShow, next: next, prev: prev, skip: skip, _toggleIntl: _toggleIntl, _previewPhoto: _previewPhoto, _triggerPhoto: _triggerPhoto };
})();
