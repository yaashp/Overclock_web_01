/* NEXORA portal: NGO Organiser + Admin interfaces (demo only; data in localStorage). */
(function () {
  'use strict';
  var role = document.body.dataset.role, email = '', ok = false;
  try {
    var r = localStorage.getItem('userRole'); email = localStorage.getItem('userEmail') || '';
    ok = localStorage.getItem('isAuthenticated') === 'true' && +localStorage.getItem('nxExp') > Date.now() && !!localStorage.getItem('nxToken');
    if (ok && r !== role) { location.replace(r === 'admin' ? 'admin-dashboard.html' : r === 'ngo' ? 'ngo-dashboard.html' : 'login.html'); return; }
  } catch (e) {}
  if (!ok) { location.replace('login.html'); return; }
  document.documentElement.style.visibility = 'visible';

  var ST = { draft: ['Draft', '#6B6256', '#EFE6D5'], submitted: ['Submitted', '#2F5D8A', '#DCE8F3'], review: ['Under Review', '#8A6A12', '#F6E9BF'], verified: ['Verified', '#1E4534', '#D3DEC9'], rejected: ['Rejected', '#9B2C2C', '#F6D9D4'], changes: ['Changes Required', '#8E4A2E', '#F3DDD0'] };
  var DOCS = [['reg', 'NGO Registration Certificate', 1], ['darpan', 'DARPAN Certificate / Details', 1], ['pan', 'PAN Card', 1], ['12a', '12A Certificate', 0], ['80g', '80G Certificate', 0], ['trust', 'Trust / Society / Section 8 Document', 0], ['addr', 'Address Proof', 1], ['rep', 'Authorized Representative ID', 1], ['other', 'Other Supporting Documents', 0]];
  var REQ = 5;
  var FIELDS = [['name', 'NGO Name'], ['type', 'NGO Type'], ['reg', 'Registration Number'], ['darpan', 'DARPAN ID'], ['pan', 'PAN Number', 'password'], ['est', 'Date of Establishment', 'date'], ['email', 'NGO Email', 'email'], ['phone', 'Phone Number', 'tel'], ['web', 'Website'], ['addr', 'Full Address', 'w'], ['city', 'City'], ['state', 'State'], ['pin', 'PIN Code'], ['about', 'About the NGO', 'ta'], ['mission', 'Mission', 'ta'], ['vision', 'Vision', 'ta'], ['causes', 'Main causes / focus areas'], ['areas', 'Areas of operation'], ['vol', 'Number of volunteers', 'number'], ['ben', 'Number of beneficiaries', 'number'], ['prev', 'Previous projects', 'ta'], ['cur', 'Current projects', 'ta'], ['social', 'Social media links']];
  var blobs = {}, $ = function (s) { return document.querySelector(s); };
  var e = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var inr = function (n) { return '₹' + Number(n).toLocaleString('en-IN'); };

  function mk(a) {
    var s = a[1].split(' ')[0].toLowerCase(), thin = a[4] === 'draft', n = { id: a[0], name: a[1], type: a[2], darpan: a[3], status: a[4], city: a[5], vol: a[6], ben: a[7], don: a[8], docs: {}, proj: a[10].split(','), note: a[11] || null,
      reg: 'MAH/' + a[3].slice(-7), pan: 'AAATH' + a[3].slice(-4) + 'K', est: '2016-04-12', email: 'contact@' + s + '.org', phone: '+91 98200 0' + a[3].slice(-4), web: 'https://www.' + s + '.org', addr: 'Plot 12, Station Road, ' + a[5], state: 'Maharashtra', pin: '4000' + a[3].slice(-2),
      about: a[1] + ' works with local communities in ' + a[5] + '.', mission: thin ? '' : 'Create lasting change through community-led programmes.', vision: thin ? '' : 'A fair and healthy society for everyone.', causes: a[10].split(',')[0], areas: a[5] + ' district', prev: thin ? '' : 'Annual outreach drives since 2017.', cur: a[10].split(',')[0], social: '@' + s };
    a[9].split(',').forEach(function (k) { if (k) n.docs[k] = { n: k + '-' + s + '.pdf', t: 'PDF', d: '2026-07-14' }; });
    return n;
  }
  function seed() {
    return [
      mk(['hh', 'Helping Hands Foundation', 'Society', 'MH/2024/0012345', 'verified', 'Mumbai', 182, 12400, 2840000, 'reg,darpan,pan,12a,80g,trust,addr,rep', 'Meals for Mumbai,Winter Blanket Drive']),
      mk(['ge', 'Green Earth Initiative', 'Trust', 'MH/2025/0034567', 'review', 'Pune', 64, 5200, 640000, 'reg,darpan,pan,12a,addr,rep', 'Urban Tree Cover,River Clean-up']),
      mk(['sj', 'Shiksha Jyoti Foundation', 'Section 8 Company', 'MH/2025/0056789', 'changes', 'Nagpur', 41, 3100, 310000, 'reg,darpan,pan,addr', 'Evening Classes,Digital Literacy', { reason: 'Authorized representative ID is missing and the address proof is older than 3 months.', missing: ['Authorized Representative ID'], comments: 'Profile looks good. Please fix the documents below and resubmit.', fix: ['Upload a valid government ID of the authorised signatory', 'Replace address proof with a document dated in the last 3 months'] }]),
      mk(['ud', 'Udaan Community Trust', 'Trust', 'MH/2024/0078912', 'rejected', 'Nashik', 18, 900, 90000, 'reg,pan,addr,rep', 'Skill Training,Women Self-Help Group', { reason: 'DARPAN ID does not match the registration certificate.', missing: ['DARPAN Certificate / Details'], comments: 'The trust name and DARPAN record differ. Verify with the registrar.', fix: ['Correct the DARPAN ID', 'Upload the DARPAN certificate and resubmit'] }]),
      mk(['as', 'Arogya Seva Foundation', 'Trust', 'MH/2026/0011298', 'submitted', 'Thane', 33, 2700, 0, 'reg,darpan,pan,12a,80g,addr,rep', 'Rural Health Camps,Eye Care Camps']),
      mk(['jd', 'Jal Dhara Trust', 'Trust', 'MH/2026/0021876', 'draft', 'Aurangabad', 9, 0, 0, 'reg,pan', 'Village Water Tanks']),
      mk(['ns', 'Nari Shakti Mandal', 'Society', 'MH/2026/0029054', 'submitted', 'Kolhapur', 27, 1500, 45000, 'reg,darpan,pan,trust,addr,rep', 'Legal Aid Clinics,Livelihood Circles']),
      mk(['ad', 'Annadaan Sewa Samiti', 'Society', 'MH/2023/0004411', 'verified', 'Solapur', 96, 8800, 1260000, 'reg,darpan,pan,12a,80g,trust,addr,rep', 'Community Kitchens,Ration Kits'])
    ];
  }
  var D, LOG;
  try { D = JSON.parse(localStorage.getItem('nx_data')); LOG = JSON.parse(localStorage.getItem('nx_log')); } catch (x) {}
  if (!D || !D.length) D = seed(); if (!LOG) LOG = [];
  function save() { try { localStorage.setItem('nx_data', JSON.stringify(D)); localStorage.setItem('nx_log', JSON.stringify(LOG.slice(0, 20))); } catch (x) {} }
  var N = function (id) { return D.filter(function (x) { return x.id === id; })[0]; };
  var cur = D[0].id, view = role === 'admin' ? 'org' : 'dash', sel = null, filt = 'all';
  var missing = function (n) { return DOCS.filter(function (d) { return d[2] && !n.docs[d[0]]; }).map(function (d) { return d[1]; }); };
  var editable = function (n) { return ['draft', 'changes', 'rejected'].indexOf(n.status) > -1; };
  function pct(n) { var f = FIELDS.filter(function (x) { return String(n[x[0]] || '').trim(); }).length; return Math.round((f + REQ - missing(n).length) * 100 / (FIELDS.length + REQ)); }
  var badge = function (s) { return '<span class="badge" style="background:' + ST[s][2] + ';color:' + ST[s][1] + '">' + ST[s][0] + '</span>'; };
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.add('hidden'); }, 3000); }
  function mask(p) { return p ? p.slice(0, 5) + '••••' + p.slice(-1) : ''; }

  /* Only the allowed role may make each status change. */
  function setStatus(id, to, note) {
    var n = N(id), from = n.status, rules = role === 'ngo' ? { draft: ['submitted'], changes: ['submitted'], rejected: ['submitted'] } : { submitted: ['review'], review: ['verified', 'changes', 'rejected'] };
    if (!n || !rules[from] || rules[from].indexOf(to) < 0) { toast('That status change is not allowed.'); return false; }
    if (to === 'submitted' && missing(n).length) { toast('Upload all required documents first.'); return false; }
    n.status = to; n.note = (to === 'changes' || to === 'rejected') ? note : (to === 'verified' ? null : n.note);
    LOG.unshift(new Date().toLocaleDateString('en-IN') + ': ' + n.name + ' set to ' + ST[to][0] + ' by ' + (role === 'admin' ? 'admin' : 'NGO organiser')); save(); return true;
  }

  /* ---------- NGO views ---------- */
  var NAV = [['dash', 'Dashboard'], ['profile', 'NGO Profile'], ['verify', 'Verification'], ['docs', 'Documents'], ['proj', 'Projects'], ['vol', 'Volunteers'], ['ben', 'Beneficiaries'], ['don', 'Donations'], ['rep', 'Reports'], ['note', 'Notifications'], ['set', 'Settings']];
  var ANAV = [['org', 'NGO Organizers'], ['ov', 'Overview (sample data)'], ['list', 'NGO Applications (sample data)']];
  var stat = function (v, l) { return '<div class="stat"><b>' + e(v) + '</b><span>' + l + '</span></div>'; };
  function pending(n) { var p = missing(n); (n.note && n.note.missing || []).forEach(function (m) { if (p.indexOf(m) < 0) p.push(m); }); return p; }
  function noteBox(n) {
    if (!n.note || (n.status !== 'changes' && n.status !== 'rejected')) return '';
    var x = n.note;
    return '<div class="alert ' + (n.status === 'rejected' ? 'r' : '') + '"><b>' + (n.status === 'rejected' ? 'Application rejected' : 'Changes required') + '</b><p>Reason: ' + e(x.reason) + '</p>' +
      (x.missing && x.missing.length ? '<b>Missing documents</b><ul>' + x.missing.map(function (m) { return '<li>' + e(m) + '</li>'; }).join('') + '</ul>' : '') +
      (x.comments ? '<p><b>Admin comments:</b> ' + e(x.comments) + '</p>' : '') +
      (x.fix && x.fix.length ? '<b>Required corrections</b><ul>' + x.fix.map(function (m) { return '<li>' + e(m) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
  }
  function dash(n) {
    var p = pending(n), pc = pct(n);
    return '<h1>Dashboard</h1><p class="sub">' + e(n.name) + '</p>' +
      '<div class="card vcard" style="--c:' + ST[n.status][1] + '"><div><p class="sub" style="margin:0">Verification status</p><h2>' + ST[n.status][0] + '</h2></div>' + badge(n.status) + '<button class="b o" data-v="verify" style="margin-left:auto">View details</button></div>' +
      '<div class="grid">' + stat(pc + '%', 'Profile completion') + stat(n.proj.length, 'Total projects') + stat(n.status === 'verified' ? 1 : n.proj.length > 1 ? 1 : 0, 'Active projects') + stat(n.vol, 'Volunteers') + stat(n.ben.toLocaleString('en-IN'), 'Beneficiaries served') + stat(inr(n.don), 'Donations received') + '</div>' +
      '<div class="card"><h3>Profile completion</h3><div class="bar"><i style="width:' + pc + '%"></i></div></div>' +
      '<div class="card"><h3>Pending document requirements</h3>' + (p.length ? '<ul>' + p.map(function (m) { return '<li>' + e(m) + '</li>'; }).join('') + '</ul>' : '<p class="sub">Nothing pending.</p>') + '</div>';
  }
  function profile(n) {
    var ed = editable(n);
    return '<h1>NGO Profile</h1><p class="sub">' + (ed ? 'Keep this complete before submitting for verification.' : 'Locked while the application is ' + ST[n.status][0].toLowerCase() + '.') + '</p><form class="card fm" id="pf">' +
      FIELDS.map(function (f) {
        var v = e(n[f[0]]), w = (f[2] === 'ta' || f[2] === 'w') ? ' class="w"' : '', d = ed ? '' : ' disabled';
        return '<label' + w + '>' + f[1] + (f[2] === 'ta' ? '<textarea name="' + f[0] + '" rows="3"' + d + '>' + v + '</textarea>' : '<input name="' + f[0] + '" value="' + v + '" type="' + (f[2] && f[2] !== 'w' ? f[2] : 'text') + '"' + (f[0] === 'pan' ? ' autocomplete="off"' : '') + d + '>') + '</label>';
      }).join('') + (ed ? '<div class="w"><button class="b" type="submit">Save profile</button></div>' : '') + '</form>';
  }
  function verify(n) {
    var m = { draft: missing(n).length ? 1 : 2, submitted: 3, review: 4, changes: 5, rejected: 5, verified: 6 }[n.status];
    var names = ['NGO Profile Created', 'Documents Uploaded', 'Verification Submitted', 'Admin Review', 'Verification Decision', 'NGO Verified'];
    var li = names.map(function (t, i) {
      var c = i < m ? 'done' : i === m ? (n.status === 'draft' || n.status === 'submitted' || n.status === 'review' ? 'now' : 'todo') : 'todo';
      if (i === 4 && (n.status === 'changes' || n.status === 'rejected')) c = 'warn';
      var lab = i === 4 && n.status === 'changes' ? 'Verification Decision: changes required' : i === 4 && n.status === 'rejected' ? 'Verification Decision: rejected' : t;
      return '<li class="' + c + '"><span class="dot">' + (c === 'done' ? '✓' : c === 'warn' ? '!' : i + 1) + '</span><div><b>' + lab + '</b></div></li>';
    }).join('');
    var btn = editable(n) ? '<button class="b" data-a="submit"' + (missing(n).length ? ' disabled' : '') + '>' + (n.status === 'draft' ? 'Submit for verification' : 'Resubmit') + '</button>' + (missing(n).length ? '<p class="sub">Required documents missing: ' + e(missing(n).join(', ')) + '</p>' : '') : '<p class="sub">Only an NEXORA admin can verify an NGO.</p>';
    return '<h1>Verification</h1><p class="sub">' + e(n.name) + ' ' + badge(n.status) + '</p>' + noteBox(n) + '<div class="card"><ul class="tl">' + li + '</ul></div><div class="card">' + btn + '</div>';
  }
  function docs(n, ro) {
    return (ro ? '' : '<h1>Documents</h1><p class="sub">Required documents are marked. Files stay in this browser in the demo.</p>') + '<div class="card">' + DOCS.map(function (d) {
      var f = n.docs[d[0]], b = ro ? '' : editable(n) ? '<button class="b o s" data-a="up" data-k="' + d[0] + '">' + (f ? 'Replace' : 'Upload') + '</button>' + (f ? '<button class="b d s" data-a="del" data-k="' + d[0] + '">Delete</button>' : '') : '';
      return '<div class="row"><div class="g"><b>' + d[1] + (d[2] ? ' *' : '') + '</b><small>' + (f ? e(f.n) + ' · ' + e(f.t) + ' · uploaded ' + e(f.d) : 'Not uploaded') + '</small></div>' + (f ? '<button class="b o s" data-a="pv" data-k="' + d[0] + '">Preview / download</button>' : '') + b + '</div>';
    }).join('') + '</div>' + (ro ? '' : '<input type="file" id="fi" hidden>') + (ro ? '' : '<p class="sub">PAN on file: ' + e(mask(n.pan)) + '</p>');
  }
  function info(t, a, b) { return '<h1>' + t + '</h1><div class="card"><div class="grid">' + a + '</div><p class="sub">' + b + '</p></div>'; }
  function ngoView(n) {
    if (view === 'dash') return dash(n);
    if (view === 'profile') return profile(n);
    if (view === 'verify') return verify(n);
    if (view === 'docs') return docs(n);
    if (view === 'proj') return '<h1>Projects</h1><div class="card">' + n.proj.map(function (p, i) { return '<div class="row"><div class="g"><b>' + e(p) + '</b></div>' + (i === 0 || n.proj.length < 3 && i === 1 ? '<span class="badge" style="background:#D3DEC9;color:#1E4534">Active</span>' : '<span class="badge" style="background:#EFE6D5;color:#6B6256">Completed</span>') + '</div>'; }).join('') + '</div>';
    if (view === 'vol') return info('Volunteers', stat(n.vol, 'Registered volunteers'), 'Volunteer rosters and shifts will appear here.');
    if (view === 'ben') return info('Beneficiaries', stat(n.ben.toLocaleString('en-IN'), 'Beneficiaries served'), 'Beneficiary records are kept private and shown only in aggregate.');
    if (view === 'don') return info('Donations', stat(inr(n.don), 'Received to date'), n.status === 'verified' ? 'Donations flow to your campaigns on NEXORA.' : 'Donations open to the public once the NGO is verified.');
    if (view === 'rep') return '<h1>Reports</h1><div class="card">' + (n.status === 'verified' ? '<div class="row"><div class="g"><b>Impact report, Q2 2026</b><small>Ready to share with donors</small></div></div>' : '<p class="sub">Impact reports unlock after verification.</p>') + '</div>';
    if (view === 'note') {
      var l = ['Welcome to NEXORA, ' + n.name + '.']; if (n.status !== 'draft') l.unshift('Verification status: ' + ST[n.status][0] + '.'); if (n.note) l.unshift('Admin note: ' + n.note.reason);
      return '<h1>Notifications</h1><div class="card">' + l.map(function (x) { return '<div class="row"><div class="g">' + e(x) + '</div></div>'; }).join('') + '</div>';
    }
    return '<h1>Settings</h1><div class="card"><p>Signed in as <b>' + e(email) + '</b></p><p class="sub">Demo account. Password changes are unavailable.</p><button class="b o" data-a="out">Log out</button></div>';
  }

  /* ---------- Admin views ---------- */
  function adminView() {
    if (view === 'org') return orgView();
    if (view === 'ov') {
      var c = {}; D.forEach(function (n) { c[n.status] = (c[n.status] || 0) + 1; });
      return '<h1>Admin Overview</h1><p class="sub">Verification workload across all NGOs.</p><div class="grid">' + stat(D.length, 'Total NGOs') + Object.keys(ST).map(function (s) { return stat(c[s] || 0, ST[s][0]); }).join('') + '</div><div class="card"><h3>Recent activity</h3>' + (LOG.length ? LOG.map(function (x) { return '<div class="row">' + e(x) + '</div>'; }).join('') : '<p class="sub">No decisions yet this session.</p>') + '</div>';
    }
    if (sel) {
      var n = N(sel), act = '';
      if (n.status === 'submitted') act = '<button class="b" data-a="start">Start review</button>';
      else if (n.status === 'review') act = '<div class="rs"><textarea id="rr" placeholder="Reason (required for changes or rejection)"></textarea><textarea id="rf" placeholder="Required corrections, one per line"></textarea><div class="row" style="border:0"><button class="b" data-a="ok">Approve and verify</button><button class="b o" data-a="chg">Request changes</button><button class="b d" data-a="rej">Reject</button></div></div>';
      else act = '<p class="sub">No admin action available for this status.</p>';
      return '<button class="b o s" data-a="back">Back to list</button><h1 style="margin-top:12px">' + e(n.name) + '</h1><p class="sub">' + badge(n.status) + ' DARPAN ' + e(n.darpan) + ' · ' + e(n.type) + ' · ' + e(n.city) + '</p>' + noteBox(n) +
        '<div class="card"><h3>Decision</h3>' + act + '</div><h3>Submitted documents</h3>' + docs(n, true) + '<div class="card"><h3>Details</h3><p>Reg. no. ' + e(n.reg) + ' · PAN ' + e(mask(n.pan)) + '</p><p>' + e(n.about) + '</p><p>Profile ' + pct(n) + '% complete</p></div>';
    }
    return '<h1>NGO Applications</h1><p class="sub"><select class="fl" id="ft" style="width:auto"><option value="all">All statuses</option>' + Object.keys(ST).map(function (s) { return '<option value="' + s + '"' + (filt === s ? ' selected' : '') + '>' + ST[s][0] + '</option>'; }).join('') + '</select></p><div class="card"><table><tr><th>NGO</th><th>DARPAN ID</th><th>City</th><th>Status</th></tr>' +
      D.filter(function (n) { return filt === 'all' || n.status === filt; }).map(function (n) { return '<tr class="k" tabindex="0" data-id="' + n.id + '"><td><b>' + e(n.name) + '</b></td><td>' + e(n.darpan) + '</td><td>' + e(n.city) + '</td><td>' + badge(n.status) + '</td></tr>'; }).join('') + '</table></div>';
  }


  /* ---------- Admin: NGO Organizer Management (live API) ---------- */
  var OR = { stats: null, list: [], f: 'all', d: null, err: '' };
  var AS = { PENDING: ['⏳ Pending', '#8A6A12', '#F6E9BF'], ACTIVE: ['✓ Active', '#1E4534', '#D3DEC9'], REJECTED: ['❌ Rejected', '#9B2C2C', '#F6D9D4'], SUSPENDED: ['⚠ Suspended', '#8E4A2E', '#F3DDD0'], VERIFIED: ['✓ Verified', '#1E4534', '#D3DEC9'] };
  var ab = function (s) { var x = AS[s] || [s || '-', '#6B6256', '#EFE6D5']; return '<span class="badge" style="background:' + x[2] + ';color:' + x[1] + '">' + x[0] + '</span>'; };
  var fdate = function (d) { return d ? new Date(d).toLocaleString('en-IN') : ''; };
  function orgLoad() {
    var path = '/api/admin/organizers' + (OR.f === 'all' ? '' : '/' + OR.f);
    return Promise.all([NX.api('/api/admin/stats'), NX.api(path)]).then(function (r) { OR.stats = r[0]; OR.list = r[1]; OR.err = ''; }).catch(function (x) { OR.err = x.message; }).then(render);
  }
  function orgOpen(id) { NX.api('/api/admin/organizers/' + id).then(function (d) { OR.d = d; render(); }).catch(function (x) { toast(x.message); }); }
  function orgPost(path, body, done) {
    NX.api(path, { method: 'POST', json: body }).then(function (r) { toast(r.message); done(); }).catch(function (x) { toast(x.message); });
  }
  function orgDo(k) {
    var id = OR.d.organizer.id, rs = $('#or') ? $('#or').value.trim() : '';
    if ((k === 'reject' || k === 'suspend') && rs.length < 5) { toast('Please enter a reason (at least 5 characters).'); return; }
    orgPost('/api/admin/organizers/' + id + '/' + k, rs ? { reason: rs } : {}, function () { orgOpen(id); orgLoad(); });
  }
  function ngoDo(k) {
    var id = OR.d.organizer.id, rs = $('#ovr') ? $('#ovr').value.trim() : '';
    if (k === 'reject' && rs.length < 5) { toast('Please enter a reason (at least 5 characters).'); return; }
    orgPost('/api/admin/ngos/' + OR.d.ngo.id + '/' + k, k === 'reject' ? { reason: rs } : undefined, function () { orgOpen(id); orgLoad(); });
  }
  function orgDetail() {
    var d = OR.d, u = d.organizer, n = d.ngo || {}, A = d.available_actions, lab = { approve: 'Approve Account', reject: 'Reject Account', suspend: 'Suspend Account', reactivate: 'Reactivate Account' };
    var kv = function (a) { return a.map(function (x) { return '<p><b>' + x[0] + ':</b> ' + e(x[1] || '-') + '</p>'; }).join(''); };
    var ctl = A.length ? '<textarea id="or" placeholder="Reason (required to reject or suspend)"></textarea><div class="row" style="border:0">' + A.map(function (k) { return '<button class="b' + (k === 'reject' || k === 'suspend' ? ' d' : '') + '" data-a="oact" data-k="' + k + '">' + lab[k] + '</button>'; }).join('') + '</div>' : '<p class="sub">No account action is available for a ' + u.account_status.toLowerCase() + ' application.</p>';
    var vctl = n.verification_status === 'PENDING' ? '<textarea id="ovr" placeholder="Reason (required to reject verification)"></textarea><div class="row" style="border:0"><button class="b" data-a="ovf" data-k="verify">Verify NGO</button><button class="b d" data-a="ovf" data-k="reject">Reject Verification</button></div>' : '<p class="sub">Verification decision recorded.' + (n.rejection_reason ? ' Reason: ' + e(n.rejection_reason) : '') + '</p>';
    return '<button class="b o s" data-a="oback">Back to list</button><h1 style="margin-top:12px">' + e(u.name) + '</h1><p class="sub">' + e(n.name) + ' ' + ab(u.account_status) + '</p>' +
      '<div class="card"><h3>Organizer information</h3>' + kv([['Full name', u.name], ['Email', u.email], ['Phone', u.phone], ['Account created', fdate(u.created_at)]]) + '<p><b>Account status:</b> ' + ab(u.account_status) + '</p></div>' +
      '<div class="card"><h3>NGO information</h3>' + kv([['NGO name', n.name], ['Description', n.description], ['Location', n.location], ['Cause', n.cause], ['Website', n.website], ['NGO Darpan ID', n.ngo_darpan_id], ['12A', n.registration_12a], ['80G', n.registration_80g]]) + '<p><b>NGO verification:</b> ' + ab(n.verification_status) + '</p></div>' +
      '<div class="card"><h3>Organizer account controls</h3><div class="rs">' + ctl + '</div></div>' +
      '<div class="card"><h3>NGO verification controls</h3><div class="rs">' + vctl + '</div></div>' +
      '<div class="card"><h3>Status history</h3><table><tr><th>Date</th><th>Change</th><th>By</th><th>Reason</th></tr>' + d.history.map(function (h) { return '<tr><td>' + e(fdate(h.created_at)) + '</td><td>' + e((h.old_status || 'NEW') + ' → ' + h.new_status) + '</td><td>' + e(h.changed_by) + '</td><td>' + e(h.reason || '') + '</td></tr>'; }).join('') + '</table></div>';
  }
  function orgView() {
    if (OR.err) return '<h1>NGO Organizers</h1><div class="alert r"><b>Could not load data</b><p>' + e(OR.err) + '</p></div>';
    if (!OR.stats) return '<h1>NGO Organizers</h1><p class="sub">Loading…</p>';
    if (OR.d) return orgDetail();
    var s = OR.stats, opts = [['all', 'All accounts'], ['pending', 'Pending'], ['active', 'Active'], ['suspended', 'Suspended'], ['rejected', 'Rejected']];
    return '<h1>NGO Organizer Management</h1><p class="sub">Account status controls access to NGO tools. NGO verification controls public trust. They are managed separately.</p>' +
      '<div class="grid">' + stat(s.pending_organizers, 'Pending organizers') + stat(s.active_organizers, 'Active organizers') + stat(s.suspended_organizers, 'Suspended') + stat(s.rejected_organizers, 'Rejected organizers') + stat(s.pending_ngo_verifications, 'Pending NGO verification') + stat(s.verified_ngos, 'Verified NGOs') + stat(s.rejected_ngos, 'Rejected NGOs') + '</div>' +
      '<p class="sub"><select class="fl" id="of" style="width:auto">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (OR.f === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></p>' +
      '<div class="card"><table><tr><th>Organizer</th><th>NGO</th><th>Email</th><th>Account Status</th><th>NGO Verification</th><th>Actions</th></tr>' +
      (OR.list.length ? OR.list.map(function (o) { return '<tr><td><b>' + e(o.organizer) + '</b></td><td>' + e(o.ngo) + '</td><td>' + e(o.email) + '</td><td>' + ab(o.account_status) + '</td><td>' + ab(o.ngo_verification) + '</td><td><button class="b o s" data-a="oview" data-oid="' + o.user_id + '">View</button></td></tr>'; }).join('') : '<tr><td colspan="6" class="sub">No organizers in this view.</td></tr>') + '</table></div>';
  }
  function gate(m) {
    var st = m.user.account_status, r = m.user.status_reason;
    var tx = { PENDING: ['⏳ Pending Review', 'Your NGO Organizer account is waiting for Admin approval.'], REJECTED: ['❌ Rejected', 'Your NGO Organizer application was rejected.'], SUSPENDED: ['⚠ Suspended', '⚠ Your NGO Organizer account has been suspended.'] }[st];
    $('#app').innerHTML = '<div class="app"><aside class="side"><div class="brand">NEXORA</div><div class="who">NGO Organiser · ' + e(email) + '</div><nav><button class="nv" data-a="out">Logout</button></nav></aside><main><h1>Account Status</h1><div class="card"><h2>' + tx[0] + '</h2><p>' + tx[1] + '</p>' +
      (r && st !== 'PENDING' ? '<div class="alert ' + (st === 'REJECTED' ? 'r' : '') + '"><b>Reason</b><p>' + e(r) + '</p></div>' : '') +
      '<p class="sub">' + e(m.ngo.name) + ' · NGO verification: ' + e(m.ngo.verification_status) + '</p><button class="b o" data-a="refresh">Check status again</button></div></main></div>';
  }
  function boot() {
    if (role === 'admin') { if (view === 'org') orgLoad(); else render(); return; }
    NX.api('/api/ngo/me').then(function (m) { try { localStorage.setItem('nxStatus', m.user.account_status); } catch (x) {} if (m.can_manage) render(); else gate(m); }).catch(function (x) { $('#app').innerHTML = '<main style="padding:24px"><div class="alert r"><b>Could not load your account</b><p>' + e(x.message) + '</p></div></main>'; });
  }

  /* ---------- Shell ---------- */
  function render() {
    var nav = (role === 'admin' ? ANAV : NAV).map(function (x) { return '<button class="nv" data-v="' + x[0] + '"' + (view === x[0] ? ' aria-current="page"' : '') + '>' + x[1] + '</button>'; }).join('');
    var pick = role === 'ngo' ? '<select id="sw" aria-label="Switch NGO">' + D.map(function (n) { return '<option value="' + n.id + '"' + (n.id === cur ? ' selected' : '') + '>' + e(n.name) + '</option>'; }).join('') + '</select>' : '';
    $('#app').innerHTML = '<div class="app"><aside class="side"><div class="brand">NEXORA</div><div class="who">' + (role === 'admin' ? 'Admin' : 'NGO Organiser') + ' · ' + e(email) + '</div>' + pick + '<nav aria-label="Sections">' + nav + '<button class="nv" data-a="out">Logout</button></nav></aside><main>' + (role === 'admin' ? adminView() : ngoView(N(cur))) + '</main></div>';
  }
  function out() { try { ['isAuthenticated', 'userRole', 'userEmail', 'nxExp', 'nxToken', 'nxName', 'nxStatus'].forEach(function (k) { localStorage.removeItem(k); }); } catch (x) {} location.href = 'login.html'; }
  function adminAct(to) {
    var rs = $('#rr') ? $('#rr').value.trim() : '', fx = $('#rf') ? $('#rf').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean) : [];
    if ((to === 'changes' || to === 'rejected') && !rs) { toast('Please enter a reason.'); return; }
    var n = N(sel); if (setStatus(sel, to, { reason: rs, missing: missing(n), comments: '', fix: fx })) { toast('Status updated: ' + ST[to][0]); render(); }
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-v],[data-a],tr.k'); if (!t) return;
    if (t.dataset.v) { view = t.dataset.v; sel = null; OR.d = null; render(); if (role === 'admin' && view === 'org') orgLoad(); return; }
    if (t.dataset.id) { sel = t.dataset.id; render(); return; }
    var a = t.dataset.a, n = role === 'ngo' ? N(cur) : null;
    if (a === 'oview') orgOpen(t.dataset.oid);
    else if (a === 'oback') { OR.d = null; render(); }
    else if (a === 'oact') orgDo(t.dataset.k);
    else if (a === 'ovf') ngoDo(t.dataset.k);
    else if (a === 'refresh') boot();
    else if (a === 'out') out();
    else if (a === 'back') { sel = null; render(); }
    else if (a === 'submit') { if (setStatus(cur, 'submitted')) { toast('Submitted for verification.'); render(); } }
    else if (a === 'start') { if (setStatus(sel, 'review')) render(); }
    else if (a === 'ok') adminAct('verified'); else if (a === 'chg') adminAct('changes'); else if (a === 'rej') adminAct('rejected');
    else if (a === 'up') { var fi = $('#fi'); fi.onchange = function () { var f = fi.files[0]; if (!f) return; blobs[cur + t.dataset.k] = URL.createObjectURL(f); n.docs[t.dataset.k] = { n: f.name, t: (f.name.split('.').pop() || 'file').toUpperCase(), d: new Date().toISOString().slice(0, 10) }; save(); toast('Document saved.'); render(); }; fi.value = ''; fi.click(); }
    else if (a === 'del') { if (confirm('Delete this document?')) { delete n.docs[t.dataset.k]; save(); render(); } }
    else if (a === 'pv') { var u = blobs[(role === 'ngo' ? cur : sel) + t.dataset.k]; if (u) window.open(u, '_blank'); else toast('Demo file: no preview content. Upload a file to preview it.'); }
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'sw') { cur = ev.target.value; render(); }
    if (ev.target.id === 'ft') { filt = ev.target.value; render(); }
    if (ev.target.id === 'of') { OR.f = ev.target.value; orgLoad(); }
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('tr.k')) { sel = ev.target.dataset.id; render(); } });
  document.addEventListener('submit', function (ev) {
    if (ev.target.id !== 'pf') return; ev.preventDefault();
    var n = N(cur); if (!editable(n)) return;
    FIELDS.forEach(function (f) { var el = ev.target.elements[f[0]]; n[f[0]] = f[2] === 'number' ? Math.max(0, +el.value || 0) : el.value.trim(); });
    save(); toast('Profile saved.'); render();
  });
  boot();
})();
