/* NEXORA – Module 3: Impact. All functions prefixed "impact". Mock data only. */
(function () {
  'use strict';

  var impactContributions = [
    { id: 1, amount: 500, campaign: '500 School Kits for Children', ngo: 'Udaan Education Foundation', date: '10 Sept 2026', status: 'report', people: 500 },
    { id: 2, amount: 1000, campaign: 'Clean Water for 20 Villages', ngo: 'Jal Seva Trust', date: '28 Aug 2026', status: 'completed', people: 800 },
    { id: 3, amount: 750, campaign: 'Mobile Health Camps', ngo: 'Arogya Setu Foundation', date: '25 Sept 2026', status: 'active', people: 0 },
    { id: 4, amount: 250, campaign: 'Meals for Shelter Homes', ngo: 'Annapurna Seva', date: '30 Sept 2026', status: 'active', people: 0 }
  ];
  var impactStatusText = { report: 'Impact Report Published', completed: 'Campaign Completed', active: 'Campaign In Progress' };

  var impactFunds = [
    { label: 'School Kits', amount: 150000, color: '#14532d' },
    { label: 'Transport', amount: 37500, color: '#2e8b57' },
    { label: 'Learning Material', amount: 30000, color: '#7bc59a' },
    { label: 'Other', amount: 20000, color: '#c5e3d0' }
  ];

  var impactImg = function (id) { return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=600&q=60'; };
  var impactEvidence = [
    { caption: 'School kit distribution', date: '20 Sept 2026', type: 'Photo', src: impactImg('photo-1503676260728-1c00da094a0b') },
    { caption: 'Volunteer activity', date: '19 Sept 2026', type: 'Photo', src: impactImg('photo-1488521787991-ed7bbaae773c') },
    { caption: 'Purchase documentation', date: '14 Sept 2026', type: 'Document', src: impactImg('photo-1554224155-6726b3ff858f') },
    { caption: 'Beneficiary activity', date: '21 Sept 2026', type: 'Photo', src: impactImg('photo-1509062522246-3755977927d7') }
  ];

  var impactNotifications = [
    { id: 'n1', title: 'Impact report published', text: 'Udaan Education Foundation has published the completion report for the campaign you supported.', read: false },
    { id: 'n2', title: 'Campaign completed', text: '500 school kits campaign has been marked completed.', read: false }
  ];

  var impactState = { filter: 'all', liked: false, likes: 128, toastTimer: null };

  function impactById(id) { return document.getElementById(id); }
  function impactRupee(n) { return '₹' + n.toLocaleString('en-IN'); }

  function impactEl(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (html !== undefined) { e.innerHTML = html; }
    return e;
  }

  function impactShowToast(msg) {
    var t = impactById('impact-toast');
    t.textContent = msg;
    t.classList.add('impact-toast-show');
    clearTimeout(impactState.toastTimer);
    impactState.toastTimer = setTimeout(function () { t.classList.remove('impact-toast-show'); }, 2200);
  }

  /* ---------- Stats ---------- */
  function impactRenderStats() {
    var total = impactContributions.reduce(function (s, c) { return s + c.amount; }, 0);
    var ngos = {};
    impactContributions.forEach(function (c) { ngos[c.ngo] = true; });
    var people = impactContributions.reduce(function (s, c) { return s + c.people; }, 0);
    var items = [
      [impactRupee(total), 'Total contributed'],
      [impactContributions.length, 'Campaigns supported'],
      [Object.keys(ngos).length, 'NGOs supported'],
      [people.toLocaleString('en-IN'), 'People impacted']
    ];
    var wrap = impactById('impact-stats');
    wrap.innerHTML = '';
    items.forEach(function (it) {
      wrap.appendChild(impactEl('div', 'impact-stat-card', '<span class="impact-stat-value">' + it[0] + '</span><span class="impact-stat-label">' + it[1] + '</span>'));
    });
  }

  /* ---------- Contributions + filters ---------- */
  function impactFilterContributions(filter) {
    impactState.filter = filter;
    var buttons = document.querySelectorAll('[data-impact-filter]');
    Array.prototype.forEach.call(buttons, function (b) {
      b.classList.toggle('impact-filter-active', b.getAttribute('data-impact-filter') === filter);
    });
    var list = impactContributions.filter(function (c) {
      if (filter === 'all') { return true; }
      if (filter === 'completed') { return c.status === 'completed' || c.status === 'report'; }
      return c.status === filter;
    });
    var wrap = impactById('impact-contrib-list');
    wrap.innerHTML = '';
    if (!list.length) { wrap.appendChild(impactEl('p', 'impact-empty', 'No contributions in this view yet.')); return; }
    list.forEach(function (c) {
      var badge = c.status === 'active' ? 'impact-badge impact-badge-active' : (c.status === 'report' ? 'impact-badge impact-badge-done' : 'impact-badge');
      var row = impactEl('article', 'impact-contrib',
        '<span class="impact-contrib-amount">' + impactRupee(c.amount) + '</span>' +
        '<div><p class="impact-contrib-title">' + c.campaign + '</p><p class="impact-contrib-meta">' + c.ngo + ' · ' + c.date + '</p>' +
        '<span class="' + badge + '">Status: ' + impactStatusText[c.status] + '</span></div>');
      if (c.status === 'report') {
        var btn = impactEl('button', 'impact-btn impact-btn-primary', 'View report');
        btn.addEventListener('click', impactOpenReport);
        row.appendChild(btn);
      } else { row.appendChild(impactEl('span')); }
      wrap.appendChild(row);
    });
  }

  /* ---------- Scrolling / report ---------- */
  function impactScrollTo(id) {
    var t = impactById(id);
    if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  function impactOpenReport() {
    impactScrollTo('impact-report');
    var r = impactById('impact-report');
    r.classList.remove('impact-flash');
    void r.offsetWidth;
    r.classList.add('impact-flash');
  }

  /* ---------- Fund utilization ---------- */
  function impactRenderFunds() {
    var total = impactFunds.reduce(function (s, f) { return s + f.amount; }, 0);
    var acc = 0, stops = [], bars = impactById('impact-bars');
    bars.innerHTML = '';
    impactFunds.forEach(function (f) {
      var pct = f.amount / total * 100;
      stops.push(f.color + ' ' + acc.toFixed(2) + '% ' + (acc + pct).toFixed(2) + '%');
      acc += pct;
      var row = impactEl('div', 'impact-bar-row-wrap',
        '<div class="impact-bar-row"><span>' + f.label + '</span><strong>' + impactRupee(f.amount) + ' (' + pct.toFixed(1) + '%)</strong></div>' +
        '<div class="impact-bar-track"><div class="impact-bar-fill" data-impact-width="' + pct.toFixed(1) + '"></div></div>');
      row.querySelector('.impact-bar-fill').style.background = f.color;
      bars.appendChild(row);
    });
    impactById('impact-donut').style.background = 'conic-gradient(' + stops.join(',') + ')';
  }

  function impactAnimateBars() {
    Array.prototype.forEach.call(document.querySelectorAll('.impact-bar-fill'), function (b) {
      b.style.width = b.getAttribute('data-impact-width') + '%';
    });
  }

  /* ---------- Evidence ---------- */
  function impactRenderEvidence() {
    var grid = impactById('impact-evidence-grid');
    impactEvidence.forEach(function (e) {
      var card = impactEl('figure', 'impact-evidence-card',
        '<img class="impact-evidence-img" loading="lazy" alt="' + e.caption + '" src="' + e.src + '">' +
        '<figcaption class="impact-evidence-body"><p>' + e.caption + '</p><div class="impact-evidence-meta"><span>' + e.date + '</span><span class="impact-badge">' + e.type + '</span></div></figcaption>');
      card.style.margin = '0';
      grid.appendChild(card);
    });
    var photos = impactById('impact-post-photos');
    impactEvidence.slice(0, 3).forEach(function (e) {
      var img = impactEl('img');
      img.src = e.src; img.alt = e.caption; img.loading = 'lazy';
      photos.appendChild(img);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.impact-evidence-img, .impact-post-photos img'), function (img) {
      img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
    });
  }

  function impactToggleEvidence() {
    var grid = impactById('impact-evidence-grid');
    var btn = impactById('impact-evidence-toggle');
    var open = !grid.hidden;
    grid.hidden = open;
    btn.textContent = open ? 'Expand' : 'Collapse';
    btn.setAttribute('aria-expanded', String(!open));
  }

  /* ---------- Post actions ---------- */
  function impactLikePost() {
    impactState.liked = !impactState.liked;
    impactState.likes += impactState.liked ? 1 : -1;
    var b = impactById('impact-like-btn');
    b.setAttribute('aria-pressed', String(impactState.liked));
    b.firstChild.textContent = (impactState.liked ? 'Liked ' : 'Like ');
    impactById('impact-like-count').textContent = impactState.likes;
  }

  function impactShareReport() {
    var data = { title: 'NEXORA Impact Report', text: '500 school kits distributed — Udaan Education Foundation', url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(data.url).then(function () { impactShowToast('Report link copied'); }, function () { impactShowToast('Copy not available'); });
    } else { impactShowToast('Sharing not supported in this browser'); }
  }

  /* ---------- Notifications ---------- */
  function impactRenderNotifications() {
    var wrap = impactById('impact-notif-list');
    wrap.innerHTML = '';
    impactNotifications.forEach(function (n) {
      var card = impactEl('article', 'impact-notif' + (n.read ? ' impact-notif-read' : ''),
        '<h3>' + n.title + '</h3><p>' + n.text + '</p>');
      var actions = impactEl('div', 'impact-notif-actions');
      var mark = impactEl('button', 'impact-link-btn', n.read ? 'Read' : 'Mark as read');
      mark.disabled = n.read;
      mark.addEventListener('click', function () { impactMarkRead(n.id); });
      var view = impactEl('button', 'impact-link-btn', 'View report');
      view.addEventListener('click', impactOpenReport);
      actions.appendChild(mark); actions.appendChild(view);
      card.appendChild(actions);
      wrap.appendChild(card);
    });
    impactById('impact-bell-count').textContent = impactNotifications.filter(function (n) { return !n.read; }).length;
  }

  function impactMarkRead(id) {
    impactNotifications.forEach(function (n) { if (n.id === id) { n.read = true; } });
    impactRenderNotifications();
  }

  /* ---------- Timeline animation ---------- */
  function impactInitTimeline() {
    var steps = document.querySelectorAll('.impact-step');
    function reveal() {
      Array.prototype.forEach.call(steps, function (s, i) {
        setTimeout(function () { s.classList.add('impact-is-visible'); }, i * 300);
      });
    }
    if (!('IntersectionObserver' in window)) { reveal(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { reveal(); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(impactById('impact-timeline'));
  }

  /* ---------- Mobile nav ---------- */
  function impactToggleNav(force) {
    var nav = impactById('impact-nav');
    var open = typeof force === 'boolean' ? force : !nav.classList.contains('impact-nav-open');
    nav.classList.toggle('impact-nav-open', open);
    impactById('impact-menu-btn').setAttribute('aria-expanded', String(open));
  }

  /* ---------- Init ---------- */
  function impactInit() {
    impactRenderStats();
    impactFilterContributions('all');
    impactRenderFunds();
    impactRenderEvidence();
    impactRenderNotifications();
    impactInitTimeline();

    Array.prototype.forEach.call(document.querySelectorAll('[data-impact-filter]'), function (b) {
      b.addEventListener('click', function () { impactFilterContributions(b.getAttribute('data-impact-filter')); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-impact-target]'), function (b) {
      b.addEventListener('click', function () { impactScrollTo(b.getAttribute('data-impact-target')); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.impact-nav-link'), function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        impactScrollTo(a.getAttribute('href').slice(1));
        impactToggleNav(false);
      });
    });
    impactById('impact-menu-btn').addEventListener('click', function () { impactToggleNav(); });
    impactById('impact-evidence-toggle').addEventListener('click', impactToggleEvidence);
    impactById('impact-like-btn').addEventListener('click', impactLikePost);
    impactById('impact-share-btn').addEventListener('click', impactShareReport);

    var util = impactById('impact-utilization');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { impactAnimateBars(); io.disconnect(); } }, { threshold: 0.2 });
      io.observe(util);
    } else { impactAnimateBars(); }
  }

  document.addEventListener('DOMContentLoaded', impactInit);
})();
