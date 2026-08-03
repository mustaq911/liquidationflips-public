/* ============================================================
   Account drawer — quick right slide-out for the two things a
   bidder acts on repeatedly: ONGOING bids (with Quick Bid) and
   the WATCHLIST (with an inline unwatch icon). Responsive: a side
   panel on desktop/tablet, a full-width sheet on phone.
   Cart and Orders are intentionally NOT here — they open their
   full pages (/cart.html, /orders.html) directly. The full
   /my-bids.html and /watchlist.html pages stay as the "Open full
   page" destinations and share these same endpoints.
   Loaded by /js/auth.js after topnav.html (which holds the drawer
   markup) is injected.
   ============================================================ */
(function () {
  if (window.__accountDrawerInit) return;
  window.__accountDrawerInit = true;

  // CONFIG is a top-level const from /js/config.js (shared script scope) — it is
  // NOT a window property, so reference it directly with a typeof guard.
  var API = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) || '';

  function $(id) { return document.getElementById(id); }
  function token() { return localStorage.getItem('token'); }
  function userId() { return localStorage.getItem('userid'); }
  function loggedIn() { return !!(token() && userId()); }
  function authHeaders() { var t = token(); return t ? { Authorization: 'Bearer ' + t } : {}; }

  function money(x) {
    if (x == null || x === '') return '$—';
    var n = Number(x);
    return isNaN(n) ? '$—' : '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var overlay, panel, bodyEl, searchInput, closeBtn, viewAll, wonLink;
  var activeTab = 'bids';

  // Full-page destination + label for each tab's "Open full page" link. Won has no
  // tab of its own — it's reached via the "View won auctions" link on the bids view.
  var FULL_PAGE = {
    bids:  { href: '/my-bids.html',          label: 'Open All Bids & Results' },
    watch: { href: '/watchlist.html',        label: 'Open full Watchlist page' }
  };
  var RAW = {};        // tab -> raw array/object
  var seq = 0;         // guards against out-of-order async renders

  function els() {
    overlay = $('acctOverlay'); panel = $('acctPanel'); bodyEl = $('acctBody');
    searchInput = $('acctSearch'); closeBtn = $('acctClose'); viewAll = $('acctViewAll');
    wonLink = $('acctWonLink');
  }

  /* ---- open / close ---- */
  function open(tab) {
    if (!panel) return;
    if (!loggedIn()) {
      if (typeof window.openLoginModal === 'function') window.openLoginModal();
      return;
    }
    overlay.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTab(tab || activeTab || 'bids');
  }
  function close() {
    if (!panel) return;
    overlay.classList.remove('open');
    panel.classList.remove('open');
    document.body.style.overflow = '';
  }

  function setTab(tab) {
    if (tab !== 'bids' && tab !== 'watch') tab = 'bids';
    activeTab = tab;
    Array.prototype.forEach.call(panel.querySelectorAll('.acct-tab'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-accttab') === tab);
    });
    // "View won auctions" only belongs on the Ongoing Bids view.
    if (wonLink) wonLink.classList.toggle('hidden', tab !== 'bids');
    if (searchInput) searchInput.value = '';
    if (viewAll) {
      var fp = FULL_PAGE[tab] || FULL_PAGE.bids;
      viewAll.setAttribute('href', fp.href);
      viewAll.firstChild.nodeValue = fp.label + ' ';
    }
    load(tab);
  }

  /* ---- shared row + state markup ---- */
  function loadingHTML() { return '<div class="acct-empty">Loading…</div>'; }
  function emptyHTML(msg) { return '<div class="acct-empty">' + esc(msg) + '</div>'; }
  function rowHTML(o) {
    var thumb = '<div class="acct-thumb"' + (o.photo ? ' style="background-image:url(\'' + esc(o.photo) + '\')"' : '') + '></div>';
    var right = '<div class="acct-rright"><div class="acct-rval">' + (o.right || '') + '</div>' +
      (o.status ? '<div class="acct-status ' + o.status.cls + '">' + esc(o.status.label) + '</div>' : '') +
      (o.action || '') + '</div>';
    var mid = '<div class="acct-rmid"><div class="acct-rtitle">' + esc(o.title) + '</div>' +
      (o.sub ? '<div class="acct-rsub">' + esc(o.sub) + '</div>' : '') + '</div>';
    var inner = thumb + mid + right;
    return o.href ? '<a class="acct-row" href="' + esc(o.href) + '">' + inner + '</a>'
                  : '<div class="acct-row">' + inner + '</div>';
  }
  function q() { return (searchInput && searchInput.value || '').trim().toLowerCase(); }

  function quickBidBtn(p) {
    return '<button type="button" class="acct-qb" data-qbid="' + p.id + '" data-high="' + p.highestBid + '">' +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="#1f8b57"><path d="M13 2L4 14h6l-1 8 9-12h-6z"></path></svg>' +
      '<span>Quick Bid</span></button>';
  }

  /* ---- loaders ---- */
  function load(tab) {
    var my = ++seq;
    bodyEl.innerHTML = loadingHTML();
    if (tab === 'bids') return loadBids(my);
    if (tab === 'watch') return loadWatch(my);
  }

  function fresh(my) { return my === seq && panel.classList.contains('open'); }

  // BIDS — only ONGOING (live) auctions the user is bidding on. Won/lost/ended
  // bids drop off here and live on the full My Bids page.
  function loadBids(my) {
    fetch(API + '/bids/my-bids/' + userId(), { headers: authHeaders() })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (data) { RAW.bids = Array.isArray(data) ? data : []; if (fresh(my)) renderBids(); })
      .catch(function () { if (fresh(my)) bodyEl.innerHTML = emptyHTML('Could not load your bids.'); });
  }
  function myMaxBid(bids) {
    var mine = (bids || []).map(function (b) { return Number(b.bidAmount || b.amount || 0); });
    return mine.length ? Math.max.apply(null, mine) : null;
  }
  function isOngoing(p) {
    return !!(p && p.auctionEnd) && new Date(p.auctionEnd).getTime() > Date.now();
  }
  function renderBids() {
    var term = q();
    var rows = (RAW.bids || []).filter(function (e) {
      var p = e.product || {};
      if (!isOngoing(p)) return false;   // ongoing only — ended/won/lost live on the full page
      if (!term) return true;
      return String((p.title || '') + ' ' + (p.id || '')).toLowerCase().indexOf(term) >= 0;
    });
    if (!rows.length) { bodyEl.innerHTML = emptyHTML('No ongoing bids right now.'); return; }
    bodyEl.innerHTML = rows.map(function (e) {
      var p = e.product || {};
      var cat = (p.category && p.category.name) || p.categoryName || 'Lot';
      var mine = myMaxBid(e.bids);
      var high = (mine != null && p.highestBid != null && Number(mine) >= Number(p.highestBid));
      var st = high ? { label: 'Winning', cls: 'ok' } : { label: 'Outbid', cls: 'bad' };
      var action = (!high && p.highestBid != null && p.id != null) ? quickBidBtn(p) : '';
      return rowHTML({
        photo: p.imageUrl, title: p.title || 'Untitled',
        sub: cat + ' · Lot #' + (p.id != null ? p.id : '—'),
        right: money(p.highestBid), status: st, action: action,
        href: '/product-view.html?id=' + p.id
      });
    }).join('');
    wireQuickBids();
  }

  // Next allowed bid = current highest + server increment (same endpoint the
  // homepage quick-bid uses). Cached by highest amount so re-renders (e.g. while
  // typing in search) don't refetch. Returns a Promise resolving to the amount.
  var INC_CACHE = {};
  function nextMinBid(highest) {
    var key = String(highest);
    if (INC_CACHE[key] != null) return Promise.resolve(INC_CACHE[key]);
    return fetch(API + '/bids/increment?amount=' + encodeURIComponent(highest), { headers: authHeaders() })
      .then(function (r) {
        if (!r.ok) throw 0;
        var ct = r.headers.get('content-type') || '';
        return ct.indexOf('json') >= 0 ? r.json() : r.text().then(parseFloat);
      })
      .then(function (inc) {
        inc = Number(inc);
        if (!isFinite(inc)) throw 0;
        var min = Number(highest) + inc;
        INC_CACHE[key] = min;
        return min;
      });
  }

  function placeBid(productId, amount) {
    return fetch(API + '/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
      body: JSON.stringify({ productId: parseInt(productId, 10), userId: parseInt(userId(), 10), bidAmount: Number(amount) })
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(t || 'bid_failed'); });
      return r.json();
    });
  }

  function toast(msg, type) { if (window.LF && typeof LF.toast === 'function') LF.toast(msg, type); }

  // Load each Quick Bid button's amount, and wire it to place the bid.
  function wireQuickBids() {
    Array.prototype.forEach.call(bodyEl.querySelectorAll('.acct-qb'), function (btn) {
      var high = Number(btn.getAttribute('data-high'));
      var labelEl = btn.querySelector('span');

      nextMinBid(high).then(function (min) {
        btn.dataset.amt = String(min);
        if (labelEl) labelEl.textContent = 'Quick Bid ' + money(min);
      }).catch(function () { /* keep the plain "Quick Bid" label */ });

      btn.addEventListener('click', function (ev) {
        ev.preventDefault();       // the row is a link — don't navigate
        ev.stopPropagation();
        var pid = btn.getAttribute('data-qbid');
        var amt = Number(btn.dataset.amt || 0);
        if (!amt) { toast('One moment — still loading the bid amount…', 'info'); return; }

        var stop = (window.LF && LF.busy) ? LF.busy(btn, 'Bidding…') : function () {};
        placeBid(pid, amt).then(function (prod) {
          if (prod && prod.isAutoOutbid && String(prod.isAutoOutbid).trim() !== '') toast(prod.isAutoOutbid, 'error');
          else toast('✅ Bid placed!', 'success');
          load(activeTab);          // refresh the active tab (re-renders the list)
        }).catch(function (err) {
          toast('❌ ' + ((err && err.message) || 'Bid failed'), 'error');
          stop();
        });
      });
    });
  }

  // WATCHLIST — watched lots with an inline unwatch icon (and Quick Bid on any
  // lot that's still a live auction).
  function loadWatch(my) {
    fetch(API + '/watchlist/user/' + userId(), { headers: authHeaders() })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (list) {
        list = Array.isArray(list) ? list : [];
        return Promise.all(list.map(function (w) {
          var pid = w.productId != null ? w.productId : w.product && w.product.id;
          if (w.product && w.product.title) return Promise.resolve(w.product);
          // A deleted/missing product returns non-OK (e.g. 500) — flag it so it
          // isn't rendered as a phantom "Product #N" row.
          return fetch(API + '/products/' + pid, { headers: authHeaders() })
            .then(function (r) { return r.ok ? r.json() : { id: pid, _missing: true }; })
            .catch(function () { return { id: pid, _missing: true }; });
        }));
      })
      .then(function (products) { RAW.watch = products; if (fresh(my)) renderWatch(); })
      .catch(function () { if (fresh(my)) bodyEl.innerHTML = emptyHTML('Could not load your watchlist.'); });
  }
  function unwatchBtn(p) {
    return '<button type="button" class="acct-unwatch" data-unwatch="' + p.id + '" aria-label="Remove from watchlist" title="Remove from watchlist">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>' +
      '</button>';
  }
  function renderWatch() {
    var term = q();
    var rows = (RAW.watch || []).filter(function (p) {
      if (p && p._missing) return false;   // skip lots that no longer exist
      if (!term) return true;
      return String((p.title || '') + ' ' + (p.id || '')).toLowerCase().indexOf(term) >= 0;
    });
    if (!rows.length) { bodyEl.innerHTML = emptyHTML('Your watchlist is empty — tap the eye icon on any lot to save it.'); return; }
    bodyEl.innerHTML = rows.map(function (p) {
      var isAuction = !!p.auctionEnd;
      var price = (p.highestBid != null ? p.highestBid : p.basePrice);
      var quick = (isOngoing(p) && p.highestBid != null && p.id != null) ? quickBidBtn(p) : '';
      return rowHTML({
        photo: p.imageUrl, title: p.title || ('Product #' + p.id),
        sub: 'Lot #' + (p.id != null ? p.id : '—'),
        right: money(price),
        action: quick + unwatchBtn(p),
        href: (isAuction ? '/product-view.html?id=' : '/product-buynow.html?id=') + p.id
      });
    }).join('');
    wireQuickBids();
    wireUnwatch();
  }
  function removeWatch(productId) {
    return fetch(API + '/watchlist?userId=' + encodeURIComponent(userId()) + '&productId=' + encodeURIComponent(productId),
      { method: 'DELETE', headers: authHeaders() })
      .then(function (r) { if (!r.ok) throw 0; });
  }
  function wireUnwatch() {
    Array.prototype.forEach.call(bodyEl.querySelectorAll('.acct-unwatch'), function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();       // the row is a link — don't navigate
        ev.stopPropagation();
        var pid = btn.getAttribute('data-unwatch');
        if (!pid) return;
        var stop = (window.LF && LF.busy) ? LF.busy(btn, '') : function () {};
        removeWatch(pid).then(function () {
          RAW.watch = (RAW.watch || []).filter(function (p) { return String(p.id) !== String(pid); });
          renderWatch();
          toast('Removed from watchlist', 'success');
        }).catch(function () {
          toast('Could not remove — try again', 'error');
          stop();
        });
      });
    });
  }

  /* ---- wire ---- */
  function wire() {
    if (overlay) overlay.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel && panel.classList.contains('open')) close(); });
    Array.prototype.forEach.call(panel.querySelectorAll('.acct-tab'), function (b) {
      b.addEventListener('click', function () { setTab(b.getAttribute('data-accttab')); });
    });
    if (searchInput) searchInput.addEventListener('input', function () {
      if (activeTab === 'bids') renderBids();
      else if (activeTab === 'watch') renderWatch();
    });
  }

  function init() {
    els();
    if (!panel) return;
    wire();
    window.openAccountDrawer = open;
    window.closeAccountDrawer = close;
    window.dispatchEvent(new Event('accountdrawer:ready'));
  }
  init();
})();
