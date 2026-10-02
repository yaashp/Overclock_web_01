/* NEXORA shell: public header on the landing page, app header + auth guard on logged-in pages. */
(function () {
  'use strict';
  var page = location.pathname.split('/').pop() || 'index.html';
  var PUBLIC = page === 'index.html';
  var HOME = { user: 'feed.html', ngo: 'ngo-dashboard.html', admin: 'admin-dashboard.html' };
  var role = null, email = '';
  try {
    if (localStorage.getItem('isAuthenticated') === 'true' && +localStorage.getItem('nxExp') > Date.now() && localStorage.getItem('nxToken')) { role = localStorage.getItem('userRole'); email = localStorage.getItem('userEmail') || ''; }
  } catch (x) {}
  if (!HOME[role]) role = null;
  if (!PUBLIC) {
    if (!role) { location.replace('login.html'); return; }
    if (role !== 'user') { location.replace(HOME[role]); return; }
  }
  var logo = '<a class="nx-logo" href="' + (PUBLIC ? 'index.html' : 'feed.html') + '"><svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="' + (PUBLIC ? '#285943' : '#F7F1E3') + '"/><path d="M9 23V9l14 14V9" fill="none" stroke="' + (PUBLIC ? '#F7F1E3' : '#285943') + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23" cy="9" r="2.4" fill="#C87552"/></svg><span>NEXORA</span></a>';
  var header, footer = '';
  if (PUBLIC) {
    header = '<header class="nx-nav"><div class="nx-wrap nx-nav-in">' + logo + '<div class="nx-links"><a href="#ngo-how">How it works</a><a href="#ngo-map">NGO map</a><a href="#ngo-about">About</a></div><div class="nx-actions">' +
      (role ? '<a class="nx-donate" style="text-decoration:none" href="' + HOME[role] + '">Go to dashboard</a>' : '<a class="nx-mylink" href="login.html">Log in</a><a class="nx-donate" style="text-decoration:none" href="register.html">Sign up</a>') + '</div></div></header>';
    footer = '<footer class="nx-footer"><div class="nx-wrap nx-foot-grid"><div><div class="nx-logo nx-logo-f"><span>NEXORA</span></div><p>Transparent giving. Meaningful impact.</p></div><div><h4>Explore</h4><a href="#ngo-how">How it works</a><a href="#ngo-map">NGO map</a><a href="login.html">Log in</a></div><div><h4>For NGOs</h4><a href="login.html">NGO login</a></div><div><h4>Support</h4><a href="#">Help Center</a><a href="#">Privacy</a><a href="#">Terms</a></div></div><div class="nx-wrap nx-copy">&copy; 2026 NEXORA. Demo platform: no real payments, verification data is sample data.</div></footer>';
  } else {
    var L = [['Impact Feed', 'feed.html'], ['Campaigns', 'campaigns.html'], ['My Impact', 'impact.html']];
    var cur = page === 'campaign.html' || page === 'ngoprofile.html' ? 'campaigns.html' : page;
    var nav = L.map(function (l) { return '<a href="' + l[1] + '"' + (l[1] === cur ? ' aria-current="page"' : '') + '>' + l[0] + '</a>'; }).join('');
    var ini = (email.charAt(0) || 'U').toUpperCase();
    header = '<header class="ap-bar"><div class="ap-in">' + logo + '<nav class="ap-links" aria-label="Dashboard">' + nav + '</nav><div class="ap-user"><button class="ap-av" id="ap-av" aria-haspopup="true" aria-expanded="false" aria-label="Profile menu">' + ini + '</button><div class="ap-menu" id="ap-menu" hidden><b>' + (function () { try { return (localStorage.getItem('nxName') || 'Account').replace(/</g, ''); } catch (x) { return 'Account'; } })() + '</b><small>' + email.replace(/</g, '') + '</small><button id="ap-out" type="button">Logout</button></div></div></div></header>';
  }
  function mount() {
    document.querySelectorAll('.ngo-navbar,.ngo-footer,.campaign-topbar,#ngo-side-menu,#ngo-menu-overlay,.nx-nav,.ap-bar').forEach(function (n) { n.remove(); });
    document.body.insertAdjacentHTML('afterbegin', header);
    if (footer && !document.querySelector('.nx-footer')) document.body.insertAdjacentHTML('beforeend', footer);
    if (PUBLIC) return;
    var av = document.getElementById('ap-av'), mn = document.getElementById('ap-menu');
    av.onclick = function () { mn.hidden = !mn.hidden; av.setAttribute('aria-expanded', String(!mn.hidden)); };
    document.addEventListener('click', function (e) { if (!mn.hidden && !e.target.closest('.ap-user')) { mn.hidden = true; av.setAttribute('aria-expanded', 'false'); } });
    document.getElementById('ap-out').onclick = function () {
      try { ['isAuthenticated', 'userRole', 'userEmail', 'nxExp', 'nxToken', 'nxName', 'nxStatus'].forEach(function (k) { localStorage.removeItem(k); }); } catch (x) {}
      location.href = 'index.html';
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
