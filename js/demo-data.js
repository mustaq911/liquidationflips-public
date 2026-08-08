/* =========================================================================
   demo-data.js — DEMO MODE for the product tour (/demo.html)
   -------------------------------------------------------------------------
   Completely inert on the live site. It only activates when the page URL
   carries ?demo=1 (or a demo flag was set earlier this session). When active
   it intercepts the backend calls the real pages make and returns a fixed
   DEMO PRODUCT, so the actual pages render exactly as they do live — but with
   sample data and no backend/login required.

   Load it right AFTER config.js and BEFORE any script that fetches:
     <script src="/js/config.js?v=4"></script>
     <script src="/js/demo-data.js?v=1"></script>
   ========================================================================= */
(function () {
  'use strict';

  // ---- activate only for the isolated demo copies --------------------------
  // Active when the page lives under /demo/ (the sandboxed copies the tour
  // iframes) or carries ?demo=1. It is NOT persisted anywhere, and the real
  // site pages don't even load this file — so live browsing is never affected.
  var isDemo = /\/demo\//.test(location.pathname) || /[?&]demo=1\b/.test(location.search);
  if (!isDemo) return;

  // Provide a signed-in demo session WITHOUT writing to storage. We only
  // intercept READS of these keys inside the demo pages, and never persist
  // anything — so the live site (same origin) can never pick up a bogus
  // session. This is what keeps the real website completely unaffected.
  var demoLS = { token: 'demo-token', userid: '42', email: 'demo@liquidationflips.ca' };
  try {
    var _get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k) {
      if (this === window.localStorage && Object.prototype.hasOwnProperty.call(demoLS, k)) return demoLS[k];
      return _get.call(this, k);
    };
  } catch (e) {}

  var API = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) || 'https://api.liquidationflips.ca';

  // ---- a tidy inline "photo" so the demo needs no network ------------------
  function photo(a, b, label) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/>' +
        '</linearGradient></defs>' +
        '<rect width="800" height="600" fill="url(#g)"/>' +
        '<g fill="none" stroke="rgba(255,255,255,.85)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="300" y="215" width="200" height="170" rx="16"/>' +
          '<path d="M300 340l55-50 45 40 60-55 40 35"/><circle cx="355" cy="262" r="16"/>' +
        '</g>' +
        '<text x="400" y="470" text-anchor="middle" font-family="Hanken Grotesk,Segoe UI,sans-serif" ' +
          'font-size="34" font-weight="800" fill="#ffffff" opacity=".95">' + label + '</text>' +
      '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  var OVEN_IMGS = [
    '/demo/Images/d475bab1-19e0-4d9a-b7ae-e435252e2c9c-large.webp', // LG stainless double wall oven
    '/demo/Images/2dece0c1-5321-405c-b576-15b062a1046a-large.webp', // LG microwave + wall oven combo
    '/demo/Images/e4feb8ab-2cb6-49a9-83d5-72d7457c5093-large.webp'  // GE Profile smart single wall oven
  ];
  var FRYER_IMGS = [
    '/demo/Images/61FrvAw250L._AC_SL1500_.jpg',   // hero — front, white background
    '/demo/Images/81CXwzivE5L._AC_SL1500_.jpg',   // 6-in-1 versatility lifestyle
    '/demo/Images/81%2BtMn-xwyL._AC_SL1500_.jpg', // XL 10-qt capacity ('+' encoded as %2B)
    '/demo/Images/81A631oh9jL._AC_SL1500_.jpg'    // DualZone in-kitchen lifestyle
  ];

  var nowMs = Date.now();
  var iso = function (ms) { return new Date(ms).toISOString(); };

  // ---- the DEMO PRODUCTS (shapes match what the real pages read) -----------
  var AUCTION = {
    id: 90001,
    title: 'Truckload of Wall Ovens, Compact Refrigerators, Microwave Wall Ovens & More by Insignia, Samsung, Frigidaire & More',
    shortDescription: 'Truckload • Mixed major appliances • Customer returns',
    subtitle: 'Truckload • ~24 units • Mixed condition',
    status: 'AUCTION',
    comingSoon: false,
    imageUrl: OVEN_IMGS[0],
    images: OVEN_IMGS,
    highestBid: 3200,
    basePrice: 2500,
    bidCount: 14,
    auctionStart: iso(nowMs - 36 * 3600 * 1000),
    auctionEnd: iso(nowMs + (2 * 3600 + 39 * 60) * 1000),
    category: { id: 5, name: 'Major Appliances' },
    categoryName: 'Major Appliances',
    description: 'One full truckload of brand-name major appliances — wall ovens, microwave wall ovens, compact and full-size refrigerators, ranges, ice makers and range hoods from Insignia, Samsung, Frigidaire, LG, GE Profile, Whirlpool and more. Customer returns and overstock in mixed condition; sold as-is by the truckload. See the full manifest tab for the itemized list, SKUs and estimated retail.',
    condition: 'Customer returns / overstock — mixed condition',
    brand: 'Mixed (Insignia · Samsung · Frigidaire · LG · GE & more)',
    model: 'Mixed truckload lot',
    sku: 'LF-90001',
    warehouseId: 1,
    quantity: 1,
    wonUserId: null,
    pickupLocation: 'Toronto Hub — 55 Commerce Way',
    pickupWindow: 'Mon–Fri, 9:00am–5:00pm'
  };

  var BUYNOW = {
    id: 90002,
    title: 'Ninja Foodi 10-Qt/9.5L DualZone Smart XL Air Fryer (6-in-1, DZ550, Black)',
    shortDescription: 'Brand new • Sealed • Black',
    subtitle: 'Brand new • Sealed • Black',
    status: 'BUYNOW',
    comingSoon: false,
    imageUrl: FRYER_IMGS[0],
    images: FRYER_IMGS,
    buyNowPrice: 129.99,
    basePrice: 129.99,
    highestBid: null,
    category: { id: 2, name: 'Home & Kitchen' },
    categoryName: 'Home & Kitchen',
    description: 'Brand-new, factory-sealed Ninja Foodi DualZone Smart XL air fryer with a 10-Qt (9.5L) capacity. Two independent XL zones and 6-in-1 versatility — air fry, roast, broil, bake, reheat and dehydrate. Includes the Smart Cook thermometer plus Match Cook and Smart Finish modes. Full manufacturer warranty.',
    condition: 'New',
    brand: 'Ninja',
    model: 'Foodi DZ550',
    sku: 'LF-90002',
    warehouseId: 1,
    quantity: 40,
    wonUserId: null,
    pickupLocation: 'Toronto Hub — 55 Commerce Way',
    pickupWindow: 'Mon–Fri, 9:00am–5:00pm'
  };

  var WAREHOUSES = [{
    id: 1, name: 'Toronto Hub',
    addressLine1: '55 Commerce Way', addressLine2: '',
    city: 'Toronto', province: 'ON', postalCode: 'M5V 2T6', country: 'CA'
  }];

  var CATEGORIES = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Home & Kitchen' },
    { id: 3, name: 'Tools' },
    { id: 4, name: 'Toys & Games' },
    { id: 5, name: 'Major Appliances' }
  ];

  // ---- the truckload MANIFEST (shape matches product-view.html's renderer) ----
  // itemTitle / quantity / brand / partNumber / upc / sku / estimatedMsrp / totalMsrp
  function mf(brand, partNumber, itemTitle, quantity, estimatedMsrp, sku, upc) {
    return {
      brand: brand, partNumber: partNumber, itemTitle: itemTitle,
      quantity: quantity, upc: upc, sku: sku,
      estimatedMsrp: estimatedMsrp,
      totalMsrp: Math.round(estimatedMsrp * quantity * 100) / 100
    };
  }
  var MANIFEST = [
    mf('Bertazzoni', 'PRO-HARM-30', 'PRO-HARM 30" Liberty Induction Range, Stainless',            1, 8399.00, '6543604', '0808234065436'),
    mf('LG',         'WDEP9423F',   '30" Built-In Electric Double Wall Oven, Stainless',           2, 2999.99, '6534257', '0195174065342'),
    mf('Samsung',    'NQ70CB700D12','30" Combination Double Wall Oven w/ Microwave',               1, 5110.00, '6607564', '0887276660752'),
    mf('Samsung',    'RF23BB8900MAA','Bespoke 36" 23 cu ft Counter-Depth 4-Door Refrigerator',     1, 4299.00, '6571434', '0887276657143'),
    mf('Monogram',   'ZDIC050WPP',  'Undercounter Ice Maker — Panel Ready',                        1, 3599.00, '6492793', '0084691849279'),
    mf('LG',         'WCEP6423F',   '30" Built-In Electric Wall Oven w/ Microwave, Stainless',     1, 3399.99, '6534259', '0195174065343'),
    mf('GE Profile', 'PTS700LSNSS', '30" Built-In Convection Single Wall Oven',                    1, 3221.99, '6449216', '0084691844492'),
    mf('Frigidaire', 'GCWS3067AF',  '30" Built-In Single Electric Wall Oven, Stainless',           1, 3199.00, '6678799', '0012505678879'),
    mf('Dacor',      'HWHP3618S',   '36" Pro Canopy Wall Hood, 780–1,200 CFM',                     1, 2799.00, '6501984', '0812391650198'),
    mf('Samsung',    'NQ70T5511DS', '30" Microwave Combination Wall Oven, Stainless',              1, 2699.00, '6512233', '0887276651223'),
    mf('Frigidaire', 'GCWG2438AF',  '24" Built-In Single Gas Wall Oven, Stainless',                1, 2399.00, '6530964', '0012505653096'),
    mf('Whirlpool',  'WOEC5030LZ',  '30" Smart Single Electric Wall Oven',                         1, 1799.00, '6470221', '0883049647022'),
    mf('Insignia',   'NS-RTM18WH7', '18 cu ft Top-Freezer Refrigerator, White',                    2,  549.99, '6420011', '0600603420115'),
    mf('Insignia',   'NS-CF26BK6',  '2.6 cu ft Compact Refrigerator, Black',                       4,  109.99, '6412345', '0600603412349')
  ];

  // Buy-now flow: the cart holds the air fryer the user just added.
  var CART = {
    userId: 42, subtotal: 259.98, tax: 0, fees: 0, totalAmount: 259.98,
    items: [
      { orderItemId: 1, productId: 90002, productTitle: 'Ninja Foodi 10-Qt/9.5L DualZone Smart XL Air Fryer (6-in-1, DZ550, Black)', productImageUrl: FRYER_IMGS[0], unitPrice: 129.99, lineTotal: 259.98, quantity: 2 }
    ]
  };

  var BUYNOW_ORDER = {
    id: 'LF-90421', orderId: 'LF-90421', status: 'PAID', currency: 'cad',
    createdAt: iso(nowMs), subtotal: 259.98, tax: 0, total: 259.98,
    items: CART.items
  };

  // Auction flow: the won truckload, invoiced and then paid.
  var AUCTION_ORDER = {
    id: 'LF-90420', orderId: 'LF-90420', status: 'PAID', currency: 'cad',
    createdAt: iso(nowMs), subtotal: 3500.00, tax: 0, total: 3500.00,
    items: [
      { orderItemId: 1, productId: 90001, productTitle: 'Truckload of Wall Ovens, Compact Refrigerators, Microwave Wall Ovens & More', productImageUrl: OVEN_IMGS[0], unitPrice: 3500.00, lineTotal: 3500.00, quantity: 1 }
    ]
  };

  // my-bids "Won" tab: the truckload won at $3,500, invoice ready to pay.
  var MYBIDS = [{
    paymentRequired: true,
    orderId: 'LF-90420',
    bids: [{ userId: 42, bidAmount: 3500, amount: 3500 }],
    product: {
      id: 90001, title: 'Truckload of Wall Ovens, Compact Refrigerators, Microwave Wall Ovens & More', imageUrl: OVEN_IMGS[0],
      category: { name: 'Major Appliances' }, categoryName: 'Major Appliances',
      status: 'ENDED', wonUserId: 42, highestBid: 3500,
      auctionEnd: iso(nowMs - 60 * 1000)
    }
  }];

  // ---- route the intercepted calls -----------------------------------------
  function route(pathname) {
    if (/\/products\/get\/allAuctionOngoin/.test(pathname)) return [AUCTION];
    if (/\/products\/buynow(\b|$)/.test(pathname))          return [BUYNOW];
    if (/\/products\/\d+\/stock/.test(pathname))            return { availableQty: 40, stock: 40, quantity: 40 };
    if (/\/products\/90002/.test(pathname))                 return BUYNOW;
    if (/\/products\/\d+/.test(pathname))                   return AUCTION;
    if (/\/category\//.test(pathname))                      return CATEGORIES;
    if (/\/warehouses/.test(pathname))                      return WAREHOUSES;
    if (/\/bids\/increment/.test(pathname))                 return 5;
    if (/\/bids\/product\/.*\/exists/.test(pathname))       return false;
    if (/\/bids\/my-bids/.test(pathname))                   return MYBIDS;
    if (/\/bids\b/.test(pathname))                          return {}; // POST /bids → success (no isAutoOutbid)
    if (/\/manifests\//.test(pathname))                     return MANIFEST;
    if (/\/orders\/cart\//.test(pathname))                  return CART;
    if (/\/orders\/LF-90420/.test(pathname))                return AUCTION_ORDER;
    if (/\/orders\//.test(pathname))                        return BUYNOW_ORDER;
    if (/\/banners\//.test(pathname))                       return [];
    if (/\/watchlist/.test(pathname))                       return [];
    return {}; // benign default so nothing the page awaits can throw
  }

  // Minimal Response-like object the pages' code understands.
  function fakeResponse(data) {
    var body = (typeof data === 'string') ? data : JSON.stringify(data);
    return {
      ok: true, status: 200, statusText: 'OK', redirected: false, type: 'basic',
      url: '', headers: { get: function (k) { return /content-type/i.test(k) ? 'application/json' : null; } },
      json: function () { return Promise.resolve(data); },
      text: function () { return Promise.resolve(body); },
      clone: function () { return fakeResponse(data); }
    };
  }

  var realFetch = window.fetch ? window.fetch.bind(window) : null;

  window.fetch = function (input, init) {
    var url = (typeof input === 'string') ? input : (input && input.url) || '';
    var sameOrigin = url.indexOf('http') !== 0 || url.indexOf(location.origin) === 0;
    if (sameOrigin) {
      // real local asset (topnav.html, images, etc.) — let it load normally
      return realFetch ? realFetch(input, init) : Promise.resolve(fakeResponse({}));
    }
    // any cross-origin fetch here is a backend/API call → serve demo data
    var pathname;
    try { pathname = new URL(url, location.href).pathname; } catch (e) { pathname = url; }
    return Promise.resolve(fakeResponse(route(pathname)));
  };
})();
