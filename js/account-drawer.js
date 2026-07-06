/* ============================================================
   Account drawer — shared right slide-out for Bids / Watchlist /
   Cart / Orders. Loaded by /js/auth.js after topnav.html (which
   holds the drawer markup) is injected. Responsive: a side panel
   on desktop/tablet, a full-width sheet on phone.
   The separate /my-bids.html, /orders.html, /watchlist.html and
   /cart.html pages stay as deep-link/fallback destinations and
   share these same endpoints. Data is loaded live per tab.
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
  function fmtDate(d) {
    if (!d) return '—';
    var t = new Date(d);
    return isNaN(t.getTime()) ? '—' : t.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  var overlay, panel, bodyEl, footerEl, searchInput, statusSel, closeBtn;
  var activeTab = 'bids';
  var RAW = {};        // tab -> raw array/object
  var seq = 0;         // guards against out-of-order async renders

  function els() {
    overlay = $('adOverlay'); panel = $('adPanel'); bodyEl = $('adBody');
    footerEl = $('adFooter'); searchInput = $('adSearch'); statusSel = $('adStatus');
    closeBtn = $('adClose');
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
    activeTab = tab;
    Array.prototype.forEach.call(panel.querySelectorAll('.ad-tab'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-adtab') === tab);
    });
    if (searchInput) searchInput.value = '';
    if (statusSel) statusSel.style.display = (tab === 'orders') ? '' : 'none';
    if (footerEl) footerEl.style.display = 'none';
    load(tab);
  }

  /* ---- shared row + state markup ---- */
  function loadingHTML() { return '<div class="ad-empty">Loading…</div>'; }
  function emptyHTML(msg) { return '<div class="ad-empty">' + esc(msg) + '</div>'; }
  function rowHTML(o) {
    var thumb = '<div class="ad-thumb"' + (o.photo ? ' style="background-image:url(\'' + esc(o.photo) + '\')"' : '') + '></div>';
    var right = '<div class="ad-rright"><div class="ad-rval">' + (o.right || '') + '</div>' +
      (o.status ? '<div class="ad-status ' + o.status.cls + '">' + esc(o.status.label) + '</div>' : '') + '</div>';
    var mid = '<div class="ad-rmid"><div class="ad-rtitle">' + esc(o.title) + '</div>' +
      (o.sub ? '<div class="ad-rsub">' + esc(o.sub) + '</div>' : '') + '</div>';
    var inner = thumb + mid + right;
    return o.href ? '<a class="ad-row" href="' + esc(o.href) + '">' + inner + '</a>'
                  : '<div class="ad-row">' + inner + '</div>';
  }
  function q() { return (searchInput && searchInput.value || '').trim().toLowerCase(); }

  /* ---- loaders ---- */
  function load(tab) {
    var my = ++seq;
    bodyEl.innerHTML = loadingHTML();
    if (tab === 'bids') return loadBids(my);
    if (tab === 'watch') return loadWatch(my);
    if (tab === 'cart') return loadCart(my);
    if (tab === 'orders') return loadOrders(my);
  }

  function fresh(my) { return my === seq && panel.classList.contains('open'); }

  // BIDS
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
  function renderBids() {
    var term = q();
    var rows = (RAW.bids || []).filter(function (e) {
      var p = e.product || {};
      if (!term) return true;
      return String((p.title || '') + ' ' + (p.id || '')).toLowerCase().indexOf(term) >= 0;
    });
    if (!rows.length) { bodyEl.innerHTML = emptyHTML("You haven't placed any bids yet."); return; }
    bodyEl.innerHTML = rows.map(function (e) {
      var p = e.product || {};
      var cat = (p.category && p.category.name) || p.categoryName || 'Lot';
      var mine = myMaxBid(e.bids);
      var ended = p.auctionEnd && new Date(p.auctionEnd).getTime() <= Date.now();
      var high = (p.wonUserId != null && String(p.wonUserId) === String(userId())) ||
                 (mine != null && p.highestBid != null && Number(mine) >= Number(p.highestBid));
      var st = ended ? (high ? { label: 'Won', cls: 'ok' } : { label: 'Lost', cls: 'mut' })
                     : (high ? { label: 'Winning', cls: 'ok' } : { label: 'Outbid', cls: 'bad' });
      return rowHTML({
        photo: p.imageUrl, title: p.title || 'Untitled',
        sub: cat + ' · Lot #' + (p.id != null ? p.id : '—'),
        right: money(p.highestBid), status: st,
        href: '/product-view.html?id=' + p.id
      });
    }).join('');
  }

  // WATCHLIST
  function loadWatch(my) {
    fetch(API + '/watchlist/user/' + userId(), { headers: authHeaders() })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (list) {
        list = Array.isArray(list) ? list : [];
        return Promise.all(list.map(function (w) {
          var pid = w.productId != null ? w.productId : w.product && w.product.id;
          if (w.product && w.product.title) return Promise.resolve(w.product);
          return fetch(API + '/products/' + pid, { headers: authHeaders() })
            .then(function (r) { return r.ok ? r.json() : { id: pid }; })
            .catch(function () { return { id: pid }; });
        }));
      })
      .then(function (products) { RAW.watch = products; if (fresh(my)) renderWatch(); })
      .catch(function () { if (fresh(my)) bodyEl.innerHTML = emptyHTML('Could not load your watchlist.'); });
  }
  function renderWatch() {
    var term = q();
    var rows = (RAW.watch || []).filter(function (p) {
      if (!term) return true;
      return String((p.title || '') + ' ' + (p.id || '')).toLowerCase().indexOf(term) >= 0;
    });
    if (!rows.length) { bodyEl.innerHTML = emptyHTML('Your watchlist is empty — tap the eye icon on any lot to save it.'); return; }
    bodyEl.innerHTML = rows.map(function (p) {
      var isAuction = !!p.auctionEnd;
      var price = (p.highestBid != null ? p.highestBid : p.basePrice);
      return rowHTML({
        photo: p.imageUrl, title: p.title || ('Product #' + p.id),
        sub: 'Lot #' + (p.id != null ? p.id : '—'),
        right: money(price),
        href: (isAuction ? '/product-view.html?id=' : '/product-buynow.html?id=') + p.id
      });
    }).join('');
  }

  // CART
  function loadCart(my) {
    fetch(API + '/orders/cart/' + userId(), { headers: authHeaders() })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (order) { RAW.cart = order || {}; if (fresh(my)) renderCart(); })
      .catch(function () { if (fresh(my)) bodyEl.innerHTML = emptyHTML('Could not load your cart.'); });
  }
  function renderCart() {
    var order = RAW.cart || {};
    var items = order.items || [];
    if (!items.length) { bodyEl.innerHTML = emptyHTML('Your cart is empty.'); if (footerEl) footerEl.style.display = 'none'; return; }
    bodyEl.innerHTML = items.map(function (it) {
      return rowHTML({
        photo: it.productImageUrl, title: it.productTitle || 'Product',
        sub: 'Qty ' + (it.quantity != null ? it.quantity : 1) + ' · ITEM ' + it.productId,
        right: money(it.lineTotal != null ? it.lineTotal : it.unitPrice)
      });
    }).join('');
    var subtotal = items.reduce(function (s, it) { return s + Number(it.lineTotal != null ? it.lineTotal : (it.unitPrice || 0) * (it.quantity || 1)); }, 0);
    if (footerEl) {
      footerEl.style.display = '';
      $('adSubtotal').textContent = money(subtotal);
    }
  }

  // ORDERS
  function normStatus(s) {
    s = String(s || '').toUpperCase();
    if (s === 'SUCCEEDED') return 'PAID';
    if (s === 'PENDING') return 'PENDING_PAYMENT';
    if (s === 'FAILED') return 'PAYMENT_FAILED';
    return s;
  }
  function statusPill(s) {
    var n = normStatus(s);
    if (n === 'PAID') return { label: 'Paid', cls: 'ok' };
    if (n === 'PENDING_PAYMENT') return { label: 'Pending', cls: 'warn' };
    if (n === 'CANCELLED' || n === 'PAYMENT_FAILED') return { label: n === 'CANCELLED' ? 'Cancelled' : 'Failed', cls: 'bad' };
    return { label: (s || '—'), cls: 'mut' };
  }
  function loadOrders(my) {
    fetch(API + '/orders/user/' + userId(), { headers: authHeaders() })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (data) { RAW.orders = Array.isArray(data) ? data : []; if (fresh(my)) renderOrders(); })
      .catch(function () { if (fresh(my)) bodyEl.innerHTML = emptyHTML('Could not load your orders.'); });
  }
  function renderOrders() {
    var term = q();
    var stf = (statusSel && statusSel.value) || 'ALL';
    var rows = (RAW.orders || []).filter(function (o) {
      var id = String(o.id != null ? o.id : o.orderId || '');
      var okQ = !term || id.toLowerCase().indexOf(term) >= 0;
      var okS = (stf === 'ALL') || normStatus(o.status) === stf;
      return okQ && okS;
    });
    if (!rows.length) { bodyEl.innerHTML = emptyHTML('No orders yet.'); return; }
    bodyEl.innerHTML = rows.map(function (o) {
      var id = o.id != null ? o.id : o.orderId;
      var total = o.totalAmount != null ? o.totalAmount : o.total;
      var needsPay = normStatus(o.status) === 'PENDING_PAYMENT';
      return rowHTML({
        photo: null, title: 'Order #' + id,
        sub: fmtDate(o.createdAt || o.created_at),
        right: money(total), status: statusPill(o.status),
        href: needsPay ? ('/checkout.html?orderId=' + id) : '/orders.html'
      });
    }).join('');
  }

  /* ---- wire ---- */
  function wire() {
    if (overlay) overlay.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel && panel.classList.contains('open')) close(); });
    Array.prototype.forEach.call(panel.querySelectorAll('.ad-tab'), function (b) {
      b.addEventListener('click', function () { setTab(b.getAttribute('data-adtab')); });
    });
    if (searchInput) searchInput.addEventListener('input', function () {
      if (activeTab === 'bids') renderBids();
      else if (activeTab === 'watch') renderWatch();
      else if (activeTab === 'cart') renderCart();
      else if (activeTab === 'orders') renderOrders();
    });
    if (statusSel) statusSel.addEventListener('change', renderOrders);
    var checkout = $('adCheckout');
    if (checkout) checkout.addEventListener('click', function () { window.location.href = '/cart.html'; });
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
