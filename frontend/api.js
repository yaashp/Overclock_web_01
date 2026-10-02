/* NEXORA API client + session helpers. Load before auth.js / portal.js. */
(function (w) {
  'use strict';
  var h = location.hostname;
  // Same-origin when served by FastAPI (http://localhost:8000). Otherwise (file:// or a static dev server) call the API directly.
  var BASE = (location.protocol === 'file:' || ((h === 'localhost' || h === '127.0.0.1') && location.port !== '8000')) ? 'http://localhost:8000' : '';
  var KEYS = ['isAuthenticated', 'userRole', 'userEmail', 'nxExp', 'nxToken', 'nxName', 'nxStatus'];
  var NX = w.NX = { BASE: BASE };

  function msg(d, fallback) {
    if (!d) return fallback;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map(function (x) { return (x.loc && x.loc.length ? x.loc[x.loc.length - 1] + ': ' : '') + String(x.msg || '').replace(/^Value error, /, ''); }).join(' ');
    return d.message || fallback;
  }
  NX.token = function () { try { return localStorage.getItem('nxToken'); } catch (x) { return null; } };
  NX.clear = function () { try { KEYS.forEach(function (k) { localStorage.removeItem(k); }); } catch (x) {} };
  NX.save = function (res) {
    var u = res.user;
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', u.role.toLowerCase());   // frontend uses user | ngo | admin
    localStorage.setItem('userEmail', u.email);
    localStorage.setItem('nxName', u.name);
    localStorage.setItem('nxStatus', u.account_status);
    localStorage.setItem('nxToken', res.access_token);
    localStorage.setItem('nxExp', new Date(res.expires_at).getTime());
  };
  NX.HOME = { user: 'feed.html', ngo: 'ngo-dashboard.html', admin: 'admin-dashboard.html' };

  /* NX.api(path, {method, json, form}) -> Promise<data>. Rejects with Error{status, detail, message}. */
  NX.api = function (path, o) {
    o = o || {};
    var headers = {}, body;
    if (NX.token()) headers.Authorization = 'Bearer ' + NX.token();
    if (o.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(o.json); }
    if (o.form) body = o.form;
    return fetch(BASE + path, { method: o.method || (body ? 'POST' : 'GET'), headers: headers, body: body }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (d) {
        if (r.ok) return d;
        var detail = d && d.detail, er = new Error(msg(detail, 'Request failed (' + r.status + ').'));
        er.status = r.status; er.detail = detail;
        if (r.status === 401 && !o.noRedirect) { NX.clear(); location.replace('login.html'); }
        if (r.status === 403 && detail && typeof detail.code === 'string' && detail.code.indexOf('ORGANIZER_') === 0 && !/ngo-dashboard/.test(location.pathname)) location.replace('ngo-dashboard.html');
        throw er;
      });
    }, function () { var er = new Error('Cannot reach the NEXORA server. Is the backend running on ' + (BASE || location.origin) + '?'); er.status = 0; throw er; });
  };
})(window);
