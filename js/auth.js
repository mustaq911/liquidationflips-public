/* ==== Auth + Topnav wiring ==== */

	/**  define new auth_API_BASE_URL 
		avoid conflict with parent page variables 
	*/
	const auth_API_BASE_URL = CONFIG.API_BASE_URL;
  	console.log("API Base URL:", auth_API_BASE_URL);
	
		// const qs = (s, r=document) => r.querySelector(s);
		const qsauth = (s, r=document) => r.querySelector(s);



	// --- Inject topnav => initTopnav() ---
	(async function initTopnav() {
	  
	  // 1st Step is to inject the Topnav ---
	  const container = document.getElementById('topnavContainer');
	  if (!container) return;
	
	  const res = await fetch('topnav.html');
	  container.innerHTML = await res.text();
	  
	  // Calling Lef-Panel
	  await initLeftPanel(); 	 // your existing function
	  await initFooter();      // ✅ add this line
	  
	  
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
			  }
			});
		
		  /* END OF LOGIN SUBMIT  */

		  function isLoggedIn() {
			return !!localStorage.getItem('token');
		  }
	
		
		  function updateTopnavUI() {
			  
			const username = localStorage.getItem('username') || 'User';
			
			
			const shortName = username;// username.split('@')[0]; // optiona
			
			if (isLoggedIn()) {
			  signInLink?.classList.add('hidden');
				  // greetUser?.classList.remove('hidden');
				  // bidsLink?.classList.remove('hidden');
				  // watchLink?.classList.remove('hidden');
		      userMenu?.classList.remove('hidden');        // 👈 show menu
			  
			  signOutLinkDrop?.classList.remove('hidden');
			  
			  if (greetUser && userEmailShort) {
				  userEmailShort.textContent = shortName;
			  }
			} else {
			  signInLink?.classList.remove('hidden');
			  userMenu?.classList.add('hidden');   // 👈 hide menu when logged out
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

			  } catch (e) {
				console.error('Failed to load cart', e);
			  }
		  }
		  
		  cartLink?.addEventListener('click', (e) => {
			  e.preventDefault();
			  // either open a modal or redirect:
			  window.location.href = '/cart.html';
		  });
		  
		  // Open modal on "SIGN IN / REGISTER"
		  signInLink?.addEventListener('click', (e) => { 
			qsauth('#authTitle').textContent = 'Welcome back!';
			e.preventDefault(); 
			openModal(); 
		  }); 
		  //====  End of signLink
	
		  
		  // Gate BIDS / WATCHLIST behind login
		  [bidsLink, watchLink].forEach(link => {
			link?.addEventListener('click', (e) => {
			  if (!isLoggedIn()) {
				e.preventDefault(); 
				openModal(); 
			  }
			});
		  });
		  //  End of Bids & WATCHLIST Link

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
  leftContainer.innerHTML = await res.text();
  
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
    // Load footer html
    const res = await fetch("/footer.html");
    const html = await res.text();

    // IMPORTANT: load Bootstrap *inside* shadow so it won't affect the page
    shadow.innerHTML = `
      <link rel="stylesheet" href="/css/bootstrap.min.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
      ${html}
    `;

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
  el.textContent = n;
  el.classList.toggle("hidden", n <= 0);
}

async function loadMenuCounts() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userid");
  if (!token || !userId) return;
  
  
  try {
    const [ongoingRes, wonRes] = await Promise.all([
      fetch(`${auth_API_BASE_URL}/bids/count/ongoing/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${auth_API_BASE_URL}/products/count/won/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const ongoing = ongoingRes.ok ? await ongoingRes.json() : 0;
    const won = wonRes.ok ? await wonRes.json() : 0;

    setBadge("ongoingBidCount", ongoing);
    setBadge("wonAuctionCount", won);
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