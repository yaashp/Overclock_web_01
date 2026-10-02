/* NEXORA login: authenticates against the FastAPI backend. The role comes from the server, never from the browser. */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  try {
    var r = localStorage.getItem('userRole');
    if (localStorage.getItem('isAuthenticated') === 'true' && NX.token() && NX.HOME[r] && +localStorage.getItem('nxExp') > Date.now()) { location.replace(NX.HOME[r]); return; }
  } catch (e) {}
  function err(f, e, m) { $(f).classList.toggle('has-error', !!m); $(e).textContent = m || ''; }
  function msg(m) { var t = $('toast'); t.textContent = m; t.classList.remove('hidden'); setTimeout(function () { t.classList.add('hidden'); }, 3500); }
  if (location.hash === '#signup') { location.replace('register.html'); return; }
  $('tg').onclick = function () {
    var s = $('pw').type === 'password'; $('pw').type = s ? 'text' : 'password';
    this.textContent = s ? 'Hide' : 'Show'; this.setAttribute('aria-pressed', s); this.setAttribute('aria-label', s ? 'Hide password' : 'Show password');
  };
  $('fp').onclick = function (e) { e.preventDefault(); msg('Password reset is not available yet. Contact a NEXORA admin.'); };
  Array.prototype.forEach.call(document.querySelectorAll('[data-u]'), function (b) {
    b.onclick = function () { $('email').value = b.dataset.u; $('pw').value = b.dataset.p; err('f-email', 'e-email'); err('f-pw', 'e-pw'); $('ferr').classList.remove('show'); $('lb').focus(); };
  });
  $('lf').onsubmit = function (e) {
    e.preventDefault();
    var em = $('email').value.trim().toLowerCase(), pw = $('pw').value, ok = true;
    $('ferr').classList.remove('show');
    if (!em) { err('f-email', 'e-email', 'Email is required.'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { err('f-email', 'e-email', 'Enter a valid email address.'); ok = false; } else err('f-email', 'e-email');
    if (!pw) { err('f-pw', 'e-pw', 'Password is required.'); ok = false; } else err('f-pw', 'e-pw');
    if (!ok) return;
    $('lb').disabled = true;
    NX.api('/api/auth/login', { json: { email: em, password: pw }, noRedirect: true }).then(function (res) {
      try { NX.save(res); } catch (x) { throw new Error('Browser storage is blocked, so sign-in cannot be saved.'); }
      location.href = NX.HOME[res.user.role.toLowerCase()];
    }).catch(function (x) {
      $('ferr').textContent = x.message; $('ferr').classList.add('show'); $('lb').disabled = false;
    });
  };
})();
