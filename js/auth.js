/* ==== Auth + Topnav wiring ==== */

/* =========================================================================
   Shared UI feedback helper — window.LF.busy()
   Gives every button/link a consistent "working…" state so the user knows a
   backend request is in flight (some calls are a touch slow). Minimal: a small
   inline spinner + optional label, the control is disabled to block double
   taps, and the original content is restored on completion.

   Usage:
     const stop = LF.busy(btn, 'Saving…');   // start
     try { ...await fetch... } finally { stop(); }   // always restore
   It is idempotent (calling busy twice is a no-op) and width-locked so the
   button doesn't jump. Defined at top level so it exists on every page that
   loads auth.js, even pages without a topnav.
   ========================================================================= */
(function () {
  window.LF = window.LF || {};
  if (window.LF.busy) return;

  if (!document.getElementById('lf-ui-feedback-css')) {
    var css = document.createElement('style');
    css.id = 'lf-ui-feedback-css';
    css.textContent =
      '@keyframes lf-spin{to{transform:rotate(360deg)}}' +
      '.lf-spinner{display:inline-block;width:1em;height:1em;border:2px solid currentColor;' +
        'border-right-color:transparent;border-radius:50%;animation:lf-spin .6s linear infinite;' +
        'box-sizing:border-box;flex:0 0 auto}' +
      '.lf-is-loading{display:inline-flex!important;align-items:center;justify-content:center;' +
        'gap:.5em;cursor:progress!important;opacity:.85}' +
      '#lf-toast-wrap{position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;' +
        'gap:10px;max-width:min(360px,92vw);pointer-events:none}' +
      '.lf-toast{pointer-events:auto;background:#fff;color:#16202e;font:600 13.5px/1.45 "Hanken Grotesk",' +
        '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:12px 14px;border-radius:11px;' +
        'border:1px solid #e6e8ec;border-left:4px solid #6b7480;box-shadow:0 12px 30px -12px rgba(22,32,46,.4);' +
        'opacity:0;transform:translateY(-8px);transition:opacity .22s ease,transform .22s ease;cursor:pointer}' +
      '.lf-toast.lf-toast-in{opacity:1;transform:none}' +
      '.lf-toast-error{border-left-color:#c0453f}' +
      '.lf-toast-success{border-left-color:#1f8b57}' +
      '.lf-toast-info{border-left-color:#16202e}';
    (document.head || document.documentElement).appendChild(css);
  }

  // Site favicon = the brand logo (green LF mark). Set here so every page that
  // loads auth.js shows it, including the ~20 pages that have no <link rel=icon>.
  // Any stale icon link (e.g. the old /img/logo-small.jpg) is replaced.
  try {
    var favHref = '/img/favicon.svg';
    document.querySelectorAll('link[rel~="icon"]').forEach(function (l) {
      if (l.parentNode) l.parentNode.removeChild(l);
    });
    var favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = favHref;
    (document.head || document.documentElement).appendChild(favicon);
  } catch (e) {}

  // Put a spinner (+ optional label) in a button/link and disable it.
  // Returns stop() which restores the original content and state.
  window.LF.busy = function (btn, label) {
    if (!btn || btn.__lfBusy) return (btn && btn.__lfStop) || function () {};
    btn.__lfBusy = true;

    var canDisable = ('disabled' in btn);
    var prevHtml = btn.innerHTML;
    var prevDisabled = !!btn.disabled;
    var prevPointer = btn.style.pointerEvents;
    var prevMinW = btn.style.minWidth;

    // Freeze current width so the label→spinner swap doesn't shrink the button.
    var w = btn.getBoundingClientRect().width;
    if (w) btn.style.minWidth = Math.ceil(w) + 'px';

    btn.setAttribute('aria-busy', 'true');
    btn.classList.add('lf-is-loading');
    if (canDisable) btn.disabled = true; else btn.style.pointerEvents = 'none';

    btn.innerHTML = '<span class="lf-spinner"></span>' +
      (label ? '<span>' + label + '</span>' : '');

    var stop = function () {
      if (!btn.__lfBusy) return;
      btn.__lfBusy = false;
      btn.innerHTML = prevHtml;
      btn.removeAttribute('aria-busy');
      btn.classList.remove('lf-is-loading');
      btn.style.minWidth = prevMinW;
      if (canDisable) btn.disabled = prevDisabled; else btn.style.pointerEvents = prevPointer;
    };
    btn.__lfStop = stop;
    return stop;
  };

  // Non-blocking toast notification (replaces alert()). type: 'error'|'success'|'info'.
  window.LF.toast = function (message, type) {
    var wrap = document.getElementById('lf-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'lf-toast-wrap';
      (document.body || document.documentElement).appendChild(wrap);
    }
    var t = document.createElement('div');
    t.className = 'lf-toast lf-toast-' + (type || 'info');
    t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    t.textContent = (message == null ? '' : String(message));
    wrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('lf-toast-in'); });
    var hide = function () {
      t.classList.remove('lf-toast-in');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    };
    var timer = setTimeout(hide, type === 'error' ? 5200 : 3400);
    t.addEventListener('click', function () { clearTimeout(timer); hide(); });
    return t;
  };
})();

	/**  define new auth_API_BASE_URL
		avoid conflict with parent page variables
	*/
	const auth_API_BASE_URL = CONFIG.API_BASE_URL;
  	console.log("API Base URL:", auth_API_BASE_URL);

	/**
	 * Dev servers like VS Code "Live Server" inject a websocket live-reload
	 * <script> into every .html they serve. topnav/footer/leftpanel are HTML
	 * *fragments* (no <body>), so that script gets inserted inside elements
	 * (e.g. <svg>) and corrupts the markup — which was collapsing the nav and
	 * hiding the Sign in / Register actions. These fragments contain no real
	 * <script> of their own, so strip any injected scripts before using them.
	 */
	function stripInjectedScripts(html) {
	  // These fragments (topnav/footer/leftpanel) contain NO real <script> of
	  // their own — verified — so removing every <script> block is safe and
	  // reliably kills any dev-server (Live Server) injection, wherever it lands
	  // (it otherwise nests inside an <svg> and breaks the parser, dropping the
	  // Sign in / Register actions). Also drop the Live Server marker comment.
	  return String(html || '')
	    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
	    .replace(/<script\b[^>]*\/?>/gi, '')
	    .replace(/<!--\s*Code injected by live-server[\s\S]*?-->/gi, '');
	}
	
		// const qs = (s, r=document) => r.querySelector(s);
		const qsauth = (s, r=document) => r.querySelector(s);



	// --- Inject topnav => initTopnav() ---
	(async function initTopnav() {
	  
	  // 1st Step is to inject the Topnav ---
	  const container = document.getElementById('topnavContainer');
	  if (!container) return;
	
	  // Absolute path so injection works from any page depth.
	  const res = await fetch('/topnav.html');
	  container.innerHTML = stripInjectedScripts(await res.text());
	  
	  // Calling Lef-Panel
	  await initLeftPanel(); 	 // your existing function
	  await initFooter();      // ✅ add this line

	  // Load the shared account drawer (Bids / Watchlist / Cart / Orders) once.
	  if (!document.querySelector('script[data-account-drawer]')) {
		const ad = document.createElement('script');
		ad.src = '/js/account-drawer.js?v=3';
		ad.defer = true;
		ad.setAttribute('data-account-drawer', '1');
		document.body.appendChild(ad);
	  }
	  
	  
	  // 🔁 Re-query modal & nav elements AFTER topnav is injected
	  const overlay   = document.getElementById('authOverlay');
	  const modal     = document.getElementById('authModal');
	  const closeBtn  = document.getElementById('authClose');
	  const form      = document.getElementById('authForm');
	  const emailEl   = document.getElementById('authEmail');
	  const passEl    = document.getElementById('authPassword');
	  const msgEl     = document.getElementById('authMsg');
	  const pwToggle  = document.getElementById('pwToggle');
	  
	  
	
	  // 🔐 Topnav controls (sign in/out)
	  const signInLink  = document.getElementById('signInLink');
	  const signOutLinkDrop = document.getElementById('signOutLinkDrop');
	  const greetUser   = document.getElementById('greetUser');
	  const bidsLink    = document.getElementById('bidsLink');
	  const watchLink   = document.getElementById('watchLink');
	  
	  const userMenu     = document.getElementById('userMenu');
	  const userDropdown = document.getElementById('userDropdown');
	  const userEmailShort = document.getElementById('userEmailShort');

	  // Display-only nav elements (new design): Register button + dropdown header
	  const registerLink = document.getElementById('registerLink');
	  const udName       = document.getElementById('udName');
	  const udEmail      = document.getElementById('udEmail');
	  
	  // 🔐 Topnav Forget Pasword UI
	  const fpOverlay = document.getElementById('fpOverlay');
	  const fpModal   = document.getElementById('fpModal');
	  const fpClose   = document.getElementById('fpClose');
	  const fpForm    = document.getElementById('fpForm');
	  const fpEmailEl = document.getElementById('fpEmail');
	  const fpMsgEl   = document.getElementById('fpMsg');
	  const forgotLink= document.getElementById('forgotLink');
	  const fpBackToLogin = document.getElementById('fpBackToLogin');


	  const caret = userMenu?.querySelector('.fa-caret-down');

		userMenu?.addEventListener('click', () => {
		  userDropdown?.classList.toggle('hidden');
		});
		
		caret?.addEventListener('click', (e) => {
		  e.stopPropagation();
		  userDropdown?.classList.toggle('hidden');
		});

		// Close the account dropdown when clicking anywhere outside it.
		document.addEventListener('click', (e) => {
		  if (!userMenu || !userDropdown || userDropdown.classList.contains('hidden')) return;
		  if (!userMenu.contains(e.target)) userDropdown.classList.add('hidden');
		});

		
		// 🔐 Show & Clear ==> Auth-Message-Erro => Forget-Message-Error
			function clearAuthMessage() {
			  if (!msgEl) return;
			  msgEl.innerHTML = '';
			  msgEl.classList.add('hidden');
			  msgEl.classList.remove('error', 'success');
			}

			function showAuthError(messageHtml) {
			  if (!msgEl) return;
			  msgEl.classList.remove('hidden', 'success');
			  msgEl.classList.add('error');
			  msgEl.innerHTML = `<div class="auth-msg-text">${messageHtml}</div>`;
			}

			function showAuthSuccess(messageHtml) {
			  if (!msgEl) return;
			  msgEl.classList.remove('hidden', 'error');
			  msgEl.classList.add('success');
			  msgEl.innerHTML = `<div class="auth-msg-text">${messageHtml}</div>`;
			}

			function clearForgotMessage() {
			  if (!fpMsgEl) return;
			  fpMsgEl.innerHTML = '';
			  fpMsgEl.classList.add('hidden');
			  fpMsgEl.classList.remove('error', 'success');
			}

			function showForgotError(messageHtml) {
			  if (!fpMsgEl) return;
			  fpMsgEl.classList.remove('hidden', 'success');
			  fpMsgEl.classList.add('error');
			  fpMsgEl.innerHTML = `<div class="auth-msg-text">${messageHtml}</div>`;
			}

			function showForgotSuccess(messageHtml) {
			  if (!fpMsgEl) return;
			  fpMsgEl.classList.remove('hidden', 'error');
			  fpMsgEl.classList.add('success');
			  fpMsgEl.innerHTML = `<div class="auth-msg-text">${messageHtml}</div>`;
			}
		  // 🔐 END-of === Show & Clear ==> Auth-Message-Erro => Forget-Message-Error
		  
		  
		  // 🔐 Auth modal functions
		    function openModal() {
			  clearAuthMessage();
			  overlay?.classList.remove('hidden');
			  modal?.classList.remove('hidden');
			}

			function closeModal() {
			  overlay?.classList.add('hidden');
			  modal?.classList.add('hidden');
			  clearAuthMessage();
			  form?.reset();
			}
		  
		  // --- Modal chrome (works regardless of nav) ---
		  overlay?.addEventListener('click', closeModal);
		  closeBtn?.addEventListener('click', closeModal);
		  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
		  pwToggle?.addEventListener('click', () => {
		    if (!passEl) return;
		    passEl.type = passEl.type === 'password' ? 'text' : 'password';
		  });

		  
		  // ===  Forget Password modal helpers
			function openForgotModal() {
			  clearForgotMessage();
			  fpOverlay?.classList.remove('hidden');
			  fpModal?.classList.remove('hidden');
			}

			function closeForgotModal() {
			  fpOverlay?.classList.add('hidden');
			  fpModal?.classList.add('hidden');
			  clearForgotMessage();
			  fpForm?.reset();
			}
			
			
		  
		  // ===  Forget Password Wire Buttons 
			forgotLink?.addEventListener('click', (e) => {
			  e.preventDefault();
			  closeModal();          // close login modal
			  openForgotModal();     // open forgot modal
			});

			fpBackToLogin?.addEventListener('click', (e) => {
			  e.preventDefault();
			  closeForgotModal();
			  openModal();
			});

			fpOverlay?.addEventListener('click', closeForgotModal);
			fpClose?.addEventListener('click', closeForgotModal);
			document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeForgotModal(); });

		  
		  
		  // Forget Password Handle submit:  ==>
		  
			fpForm?.addEventListener('submit', async (e) => {
			  e.preventDefault();
			  clearForgotMessage();

			  const email = (fpEmailEl?.value || '').trim();
			  if (!email) {
				showForgotError('Please enter your email.');
				return;
			  }

			  const stopFp = window.LF.busy(document.getElementById('fpSubmit'), 'Sending…');
			  try {
				const res = await fetch(`${auth_API_BASE_URL}/auth/password/forgot`, {
				  method: 'POST',
				  headers: { "Content-Type": "application/json" },
				  body: JSON.stringify({ email })
				});

				const data = await res.json().catch(() => ({}));

				if (!res.ok) {
				  showForgotError(data.message || 'Failed to send reset link.');
				  return;
				}

				showForgotSuccess(data.message || 'If the email exists, we sent a reset link.');
			  } catch (err) {
				showForgotError('Network error. Please try again.');
			  } finally {
				stopFp();
			  }
			});

		
		  // =====   Login submit -> matches your @RequestParam controller =====
		  
		  form?.addEventListener('submit', async (e) => {
			  e.preventDefault();
			  clearAuthMessage();

			  const username = (emailEl?.value || '').trim();
			  const password = passEl?.value || '';
			  const role = 'CUSTOMER';
			
			  if (!username || !password) {
				showAuthError('Please enter your email and password.');
				return;
			  }

			  const stopBusy = window.LF.busy(document.getElementById('authSubmit'), 'Signing in…');
			  try {
				const res = await fetch(`${auth_API_BASE_URL}/user/login`, {
				  method: 'POST',
				  headers: {
					"Content-Type": "application/json"
				  },
				  body: JSON.stringify({ username, password, role })
				});

				
				if (!res.ok) {
					
				  const t = await res.text();
				  let data = {};
				  let msg = t || "Login failed.";

				  try {
					data = JSON.parse(t);
					msg = data.message || msg;
				  } catch {}
					
					
				  if (data.errorCode  === 'USER_NOT_ACTIVE' && data.status) {
					 
					if (data.status === 'PENDING_EMAIL_VERIFICATION') {
					  if (msgEl) {
						msgEl.classList.remove('hidden', 'success');
						msgEl.classList.add('error');

						msgEl.innerHTML = `
						  <div class="auth-msg-text">
							Your email is not verified yet. Please check your inbox for the verification link.
						  </div>
						  <a href="#" id="resendVerifyLink" class="auth-action-link">Resend verification email</a>
						`;
					  }

					  const resendLink = document.getElementById('resendVerifyLink');
					  resendLink?.addEventListener('click', async (ev) => {
						ev.preventDefault();

						const stopResend = window.LF.busy(ev.currentTarget, 'Sending…');
						try {
						  const resendRes = await fetch(`${auth_API_BASE_URL}/user/resend-verification`, {
							method: 'POST',
							headers: {
							  'Content-Type': 'application/x-www-form-urlencoded'
							},
							body: new URLSearchParams({ email: username }).toString()
						  });

						  const result = await resendRes.json().catch(() => ({}));

						  if (!resendRes.ok) {
							showAuthError(result.message || 'Failed to resend verification email.');
							return;
						  }

						  showAuthSuccess(result.message || 'Verification email sent successfully.');
						} catch (err) {
						  showAuthError('Failed to resend verification email.');
						} finally {
						  stopResend();
						}
					  }, { once: true });

					  return;
					}

					if (data.status === 'PENDING_PHONE_VERIFICATION') {
					  window.location.href = `/registration.html?resume=profile&email=${encodeURIComponent(username)}`;
					  return;
					}

					if (data.status === 'PENDING_CARD_HOLD') {
					  window.location.href = `/registration.html?resume=payment&email=${encodeURIComponent(username)}`;
					  return;
					}
				  }

				  showAuthError(msg);
				  return;
				}

				const data = await res.json();

				localStorage.setItem('token', data.token || '');
				localStorage.setItem('userid', String(data.userId ?? ''));
				localStorage.setItem('username', data.username || username);

				closeModal();
				window.location.reload();

			  } catch (err) {
				showAuthError('Network error. Please try again.');
			  } finally {
				stopBusy();
			  }
			});

		  /* END OF LOGIN SUBMIT  */

		  // Decode a JWT and return true only if it carries an `exp` claim that is
		  // already in the past. Non-JWT / unparseable tokens are treated as NOT
		  // expired so we never wrongly log someone out.
		  function tokenExpired(tok) {
			try {
			  const part = (tok || '').split('.')[1];
			  if (!part) return false;
			  const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
			  if (!json || typeof json.exp !== 'number') return false;
			  return (json.exp * 1000) <= Date.now();
			} catch (e) { return false; }
		  }

		  // Clears a stale/expired session so the signed-out nav (Sign in / Register)
		  // shows again instead of being masked by a dead token.
		  function purgeExpiredSession() {
			const tok = localStorage.getItem('token');
			if (tok && tokenExpired(tok)) {
			  localStorage.removeItem('token');
			  localStorage.removeItem('userid');
			  localStorage.removeItem('username');
			  return true;
			}
			return false;
		  }

		  function isLoggedIn() {
			const tok = localStorage.getItem('token');
			const uid = localStorage.getItem('userid');
			// Require a token AND a user id, and the token must not be expired.
			// A token with no userid is a broken half-session → treat as logged out.
			return !!tok && !!uid && !tokenExpired(tok);
		  }
	
		
		  function updateTopnavUI() {

			// Escape hatch: /any-page?logout=1 clears the session (handy when a
			// stale token from testing is masking the Sign in / Register buttons).
			try {
			  if (new URLSearchParams(window.location.search).get('logout') === '1') {
				localStorage.removeItem('token');
				localStorage.removeItem('userid');
				localStorage.removeItem('username');
			  }
			} catch (e) {}

			// Drop a dead/expired token first so Sign in / Register reappear.
			purgeExpiredSession();

			const username = localStorage.getItem('username') || 'User';
			
			
			const shortName = username;// username.split('@')[0]; // optiona
			
			if (isLoggedIn()) {
			  signInLink?.classList.add('hidden');
			  registerLink?.classList.add('hidden');       // 👈 hide Register when signed in
				  // greetUser?.classList.remove('hidden');
				  // bidsLink?.classList.remove('hidden');
				  // watchLink?.classList.remove('hidden');
		      userMenu?.classList.remove('hidden');
			      cartLink?.classList.remove('hidden');        // show cart when signed in        // 👈 show menu

			  signOutLinkDrop?.classList.remove('hidden');

			  if (greetUser && userEmailShort) {
				  userEmailShort.textContent = shortName;
			  }
			  // Dropdown header (display only)
			  if (udName)  udName.textContent  = shortName;
			  if (udEmail) udEmail.textContent = localStorage.getItem('email') || localStorage.getItem('userEmail') || shortName;
			} else {
			  signInLink?.classList.remove('hidden');
			  registerLink?.classList.remove('hidden');     // 👈 show Register when signed out
			  userMenu?.classList.add('hidden');   // 👈 hide menu when logged out
			  cartLink?.classList.add('hidden');   // 👈 hide cart when logged out
			  signOutLinkDrop?.classList.add('hidden');
			}
			
			// call inside updateTopnavUI() after login state changes
			refreshCartCount();
			
			
		  }  //==== End of updateTopnavUI() 

		  
		  const cartLink  = document.getElementById('cartLink');
		  const cartCount = document.getElementById('cartCount');

		  async function refreshCartCount() {
			  
			  if (!isLoggedIn()) {
				if (cartCount) cartCount.textContent = '0';
				setBadge('cartMenuCount', 0);
				return;
			  }

			  const userId = localStorage.getItem('userid');
			  const token  = localStorage.getItem('token');

			  if (!userId || !token) return;

			  try {
				const res = await fetch(`${auth_API_BASE_URL}/orders/cart/${userId}`, {
				  headers: { 'Authorization': `Bearer ${token}` }
				});
				if (!res.ok) return;

				const data = await res.json();
				if (cartCount) cartCount.textContent = String(data.itemCount || 0);
				setBadge('cartMenuCount', data.itemCount || 0);

			  } catch (e) {
				console.error('Failed to load cart', e);
			  }
		  }
		  
		  cartLink?.addEventListener('click', (e) => {
			  e.preventDefault();
			  if (!isLoggedIn()) { openModal(); return; }
			  if (typeof window.openAccountDrawer === 'function') window.openAccountDrawer('cart');
			  else window.location.href = '/cart.html';
		  });
		  
		  // Open modal on "SIGN IN / REGISTER"
		  signInLink?.addEventListener('click', (e) => { 
			qsauth('#authTitle').textContent = 'Welcome back!';
			e.preventDefault(); 
			openModal(); 
		  }); 
		  //====  End of signLink
	
		  
		  // Account dropdown items open the shared account drawer.
		  // The href on each link is kept as a deep-link / no-JS fallback.
		  const ordersLink   = document.getElementById('ordersLink');
		  const cartMenuLink = document.getElementById('cartMenuLink');
		  function openDrawerOr(tab) {
			if (!isLoggedIn()) { openModal(); return; }
			if (typeof window.openAccountDrawer === 'function') window.openAccountDrawer(tab);
			// else: allow the href to navigate to the full page (fallback)
		  }
		  [[bidsLink, 'bids'], [watchLink, 'watch'], [ordersLink, 'orders'], [cartMenuLink, 'cart']].forEach(pair => {
			const link = pair[0], tab = pair[1];
			link?.addEventListener('click', (e) => {
			  if (!isLoggedIn() || typeof window.openAccountDrawer === 'function') e.preventDefault();
			  openDrawerOr(tab);
			});
		  });
		  //  End of account dropdown → drawer

		  // Sign out
		  signOutLinkDrop?.addEventListener('click', (e) => {
			e.preventDefault();
			localStorage.removeItem('token');
			localStorage.removeItem('userid');
			localStorage.removeItem('username');
			updateTopnavUI();
			
			// 🔥 Always redirect to home page
			window.location.href = "/index.html";
			
		  });

		  // Initial paint
		  updateTopnavUI();
		  
		  // After: container.innerHTML = await res.text();
		  wireMobileNavToggle();

		  // After updateTopnavUI() runs (or inside it when logged in)
		  loadMenuCounts();

			const pageParams = new URLSearchParams(window.location.search);
			const shouldOpenLogin = pageParams.get('login') === '1';
			const justRegistered = pageParams.get('registered') === '1';

			if (shouldOpenLogin) {
			  openModal();

			  if (justRegistered) {
				showAuthSuccess('Registration completed successfully. Please log in.');
			  }
			} else if (justRegistered && isLoggedIn()) {
			  // Registration finished and the user is already signed in — welcome
			  // them instead of asking them to log in again.
			  if (window.LF && typeof LF.toast === 'function')
				LF.toast('🎉 Registration complete — welcome to Liquidation Flips!', 'success');
			}
			
		  /* === Public API + ready signal === */
		  window.openLoginModal  = () => openModal();
		  window.closeLoginModal = () => closeModal();
		  window.__updateTopnavUI = updateTopnavUI;

		  // Fire once the nav + modal are wired
		  window.dispatchEvent(new Event('auth:ready'));
		  
		  
	})();
	
	// =========== End of ==  initTopnav()  =====
	
	
	
// --- Inject leftpanel + wire burger toggle ---
async function initLeftPanel() {
	
	// 1️⃣ Base global styles   "style.css"
    if (!document.querySelector('link[data-global-css="1"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/css/style.css";
      link.setAttribute("data-global-css", "1");
      document.head.appendChild(link);
    }
  
	/*  Can enable later 
		// 1) Ensure CSS is loaded once
		if (!document.querySelector('link[data-leftpanel-css="1"]')) {
		  const link = document.createElement('link');
		  link.rel = 'stylesheet';
		  link.href = '/css/leftpanel.css';
		  link.setAttribute('data-leftpanel-css', '1');
		  document.head.appendChild(link);
		}
	*/

  // 1) Ensure CSS is loaded IF(buyNow==leftpanel-3.css || other==leftpanel.css)
	const path = location.pathname.toLowerCase();
	let cssFile = "/css/leftpanel.css"; // default


	
	let cssLink = document.querySelector('link[data-leftpanel-css="1"]');

	if (!cssLink) {
	  cssLink = document.createElement("link");
	  cssLink.rel = "stylesheet";
	  cssLink.setAttribute("data-leftpanel-css", "1");
	  document.head.appendChild(cssLink);
	}

	cssLink.href = cssFile;
	// End of Leftpanel.css or leftpanel-3 css loading 

  // 2) Ensure container exists (auto-inject so you don’t add it on every page)
  let leftContainer = document.getElementById('leftpanelContainer');
  if (!leftContainer) {
    leftContainer = document.createElement('div');
    leftContainer.id = 'leftpanelContainer';
    document.body.appendChild(leftContainer);
  }

  // 3) Load HTML
  const res = await fetch('/leftpanel.html');
  leftContainer.innerHTML = stripInjectedScripts(await res.text());
  
   // ✅ after "leftpanel.html" is injected
  await loadLeftPanelWarehouses();

  // 4) Wire elements
  const panel   = document.getElementById("sidePanel");
  const overlay = document.getElementById("sideOverlay");
  const closeBtn= document.getElementById("sideCloseBtn");

  function openPanel() {
    if (!panel || !overlay) return;
    panel.classList.add("open");
    overlay.classList.add("show");
    panel.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePanel() {
    if (!panel || !overlay) return;
    panel.classList.remove("open");
    overlay.classList.remove("show");
    panel.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // Burger is in topnav.html, so query AFTER topnav injection
  const burger = document.querySelector(".burger");

  // OPTIONAL: show/hide burger based on login
  //  Shor burger leftpanel regardless of login
  /* 
  const isLoggedIn = !!localStorage.getItem('token');
  if (!isLoggedIn) {
    // hide burger + make sure panel is closed
    if (burger) burger.style.display = 'none';
    closePanel();
  } else {
    if (burger) burger.style.display = '';
    burger?.addEventListener("click", openPanel);
  } */

	burger?.addEventListener("click", openPanel);
	
  closeBtn?.addEventListener("click", closePanel);
  overlay?.addEventListener("click", closePanel);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });

  // Expose helpers
  window.openLeftPanel = openPanel;
  window.closeLeftPanel = closePanel;

  // Ready signal
  window.dispatchEvent(new Event("leftpanel:ready"));
}


// =========== End of ==  initTopnav()  =====


	// =========== LOAD WAREHOUSE LIST  =====

	async function loadLeftPanelWarehouses() {
		
	  const ddl = document.getElementById("lp_warehouseSelect");
	  if (!ddl) return; // means this page doesn't have leftpanel or id changed

	  try {
		const token = localStorage.getItem("token");

		const res = await fetch(`${auth_API_BASE_URL}/warehouses`, {
		  headers: {
			...(token ? { "Authorization": `Bearer ${token}` } : {})
		  }
		});

		if (!res.ok) {
		  console.warn("Warehouses API failed:", await res.text());
		  ddl.innerHTML = `<option value="all" selected>All locations</option>`;
		  return;
		}

		const list = await res.json();
		const warehouses = Array.isArray(list) ? list.filter(w => w.active !== false) : [];

		ddl.innerHTML =
		  `<option value="all" selected>All locations</option>` +
		  warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join("");

	  } catch (err) {
		console.error("Warehouse dropdown load error:", err);
		ddl.innerHTML = `<option value="all" selected>All locations</option>`;
	  }
	}


// ===== Footer will be injected here ====

async function initFooter() {
  // Create footer host automatically if not present
  let host = document.getElementById("footerHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "footerHost";
    document.body.appendChild(host);
  }

  // Attach Shadow DOM (isolates CSS)
  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });

  try {
    // Load footer html (strip any dev-server injected live-reload script)
    const res = await fetch("/footer.html");
    const html = stripInjectedScripts(await res.text());

    // IMPORTANT: load Bootstrap *inside* shadow so it won't affect the page
    shadow.innerHTML = `
      <link rel="stylesheet" href="/css/bootstrap.min.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
      ${html}
    `;

    // Wire the newsletter subscribe form (client-side confirmation for now).
    // TODO(backend): POST the email to a real subscribe endpoint.
    try {
      const form = shadow.querySelector('.lf-newsform');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          const input = form.querySelector('input');
          const email = (input && input.value || '').trim();
          if (!email || email.indexOf('@') < 0) { if (input) input.focus(); return; }
          const wrap = form.parentElement;
          form.style.display = 'none';
          const ok = document.createElement('div');
          ok.style.cssText = 'font-size:13.5px;font-weight:700;color:#1f8b57;padding:9px 2px;';
          ok.textContent = "✓ You're subscribed — watch your inbox.";
          if (wrap) wrap.insertBefore(ok, form.nextSibling);
        });
      }
    } catch (e) { /* non-fatal */ }

    window.dispatchEvent(new Event("footer:ready"));
  } catch (err) {
    console.error("Footer load failed:", err);
  }
}

//  =======  End Footer ======= 

// ======== Load Top-Right Menu Count ========
function setBadge(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const n = Number(value || 0);
  // Show the exact count for 1–9, then cap at "9+" so the pill never overflows.
  el.textContent = n > 9 ? "9+" : String(n);
  el.classList.toggle("hidden", n <= 0);
}

async function loadMenuCounts() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userid");
  if (!token || !userId) return;
  
  
  const authHeader = { Authorization: `Bearer ${token}` };
  const len = (arr) => (Array.isArray(arr) ? arr.length : 0);

  try {
    const [ongoingRes, wonRes, watchRes, ordersRes] = await Promise.all([
      fetch(`${auth_API_BASE_URL}/bids/count/ongoing/${userId}`, { headers: authHeader }),
      fetch(`${auth_API_BASE_URL}/products/count/won/${userId}`, { headers: authHeader }),
      fetch(`${auth_API_BASE_URL}/watchlist/user/${userId}`, { headers: authHeader }).catch(() => null),
      fetch(`${auth_API_BASE_URL}/orders/user/${userId}`, { headers: authHeader }).catch(() => null)
    ]);

    const ongoing = ongoingRes.ok ? await ongoingRes.json() : 0;
    const won = wonRes.ok ? await wonRes.json() : 0;
    const watch = (watchRes && watchRes.ok) ? len(await watchRes.json()) : 0;
    const orders = (ordersRes && ordersRes.ok) ? len(await ordersRes.json()) : 0;

    setBadge("ongoingBidCount", ongoing);
    setBadge("wonAuctionCount", won);
    setBadge("watchCount", watch);
    setBadge("ordersCount", orders);
    // The cart badge is refreshed separately by refreshCartCount().
  } catch (e) {
    console.error("Count load failed", e);
  }
}
// ======== End-of Top-Right Menu Count ========

// ======= Top-Right Menu => Mobile-Wire 

	function wireMobileNavToggle() {
	  const toggle = document.getElementById("navToggle");
	  const navRight = document.getElementById("navRight");
	  if (!toggle || !navRight) return;

	  const doToggle = () => navRight.classList.toggle("open");

	  toggle.addEventListener("click", doToggle);
	  toggle.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") {
		  e.preventDefault();
		  doToggle();
		}
	  });

	  document.addEventListener("click", (e) => {
		if (!navRight.classList.contains("open")) return;
		const clickedInside = navRight.contains(e.target) || toggle.contains(e.target);
		if (!clickedInside) navRight.classList.remove("open");
	  });
	}

// ======= End of Top-Right Menu => Mobile-Wire 