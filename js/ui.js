/* =========================================================================
   Shared UI feedback helper — window.LF.busy()
   Standalone copy for pages that do NOT load js/auth.js (the registration,
   reset-password and standalone payment flows). auth.js defines the exact
   same helper for the rest of the site; the guard below makes it safe to
   have both present. Keep the two in sync.

   Usage:
     const stop = LF.busy(btn, 'Saving…');            // start
     try { ...await fetch... } finally { stop(); }     // always restore
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
