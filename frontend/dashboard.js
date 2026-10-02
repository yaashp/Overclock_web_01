/* Role guard + logout for placeholder dashboards (demo only). */
(function () {
  'use strict';
  var DASHBOARDS = { admin: 'admin-dashboard.html', ngo: 'ngo-dashboard.html', user: 'user-dashboard.html' };
  var expected = document.body.dataset.role;
  var authed = false, role = null, email = '';
  try {
    authed = localStorage.getItem('isAuthenticated') === 'true';
    role = localStorage.getItem('userRole');
    email = localStorage.getItem('userEmail') || '';
  } catch (e) {}

  if (!authed || !DASHBOARDS[role]) { location.replace('login.html'); return; }
  if (role !== expected) { location.replace(DASHBOARDS[role]); return; }

  document.documentElement.style.visibility = 'visible';
  var who = document.getElementById('dash-email');
  if (who) who.textContent = email;
  document.getElementById('logout-btn').addEventListener('click', function () {
    try {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
    } catch (e) {}
    location.href = 'login.html';
  });
})();
