/* NEXORA sign-up. role / account_status / verification are NEVER sent: the server decides them. */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); }, ngo = location.hash === '#ngo';
  var TXT = ['name', 'email', 'phone'];
  var NGOF = ['ngo_name', 'description', 'location', 'cause', 'website', 'ngo_darpan_id', 'registration_12a', 'registration_80g'];
  function mode(isNgo) {
    ngo = isNgo; $('ngo-part').hidden = !isNgo;
    $('t-user').setAttribute('aria-selected', String(!isNgo)); $('t-ngo').setAttribute('aria-selected', String(isNgo));
    $('h-org').textContent = isNgo ? 'Organizer information' : 'Account information';
    $('rb').textContent = isNgo ? 'Register NGO Organizer' : 'Create account';
  }
  $('t-user').onclick = function () { mode(false); }; $('t-ngo').onclick = function () { mode(true); }; mode(ngo);
  function fail(m) { $('ferr').textContent = m; $('ferr').classList.add('show'); $('rb').disabled = false; $('ferr').scrollIntoView({ block: 'nearest' }); }
  $('rf').onsubmit = function (ev) {
    ev.preventDefault(); $('ferr').classList.remove('show');
    var v = {}; TXT.concat(NGOF).forEach(function (k) { v[k] = $(k).value.trim(); });
    v.password = $('pw').value; v.confirm_password = $('pw2').value;
    if (!v.name || !v.email || !v.password) return fail('Name, email and password are required.');
    if (v.password !== v.confirm_password) return fail('Passwords do not match.');
    if (ngo && (!v.ngo_name || !v.description || !v.location || !v.cause || !v.ngo_darpan_id)) return fail('NGO name, description, location, cause and Darpan ID are required.');
    $('rb').disabled = true;
    var p;
    if (ngo) {
      var fd = new FormData();
      Object.keys(v).forEach(function (k) { if (v[k] !== '') fd.append(k, v[k]); });
      var f = $('profile_image').files[0]; if (f) fd.append('profile_image', f);
      p = NX.api('/api/auth/register/ngo', { form: fd, noRedirect: true });
    } else {
      var b = { name: v.name, email: v.email, password: v.password, confirm_password: v.confirm_password };
      if (v.phone) b.phone = v.phone;
      p = NX.api('/api/auth/register/user', { json: b, noRedirect: true });
    }
    p.then(function (res) { NX.save(res); location.href = NX.HOME[res.user.role.toLowerCase()]; }).catch(function (x) { fail(x.message); });
  };
})();
