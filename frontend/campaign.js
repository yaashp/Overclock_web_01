/* NEXORA — Module 2 logic. Mock data only. All functions prefixed "campaign". */
(function () {
  'use strict';

  var campaignData = {
    ngo: 'Vidya Sahara Foundation',
    title: '500 School Kits for Children',
    target: 400000,
    raised: 288000,
    contributors: 412,
    daysLeft: 18,
    allocation: [
      { label: 'School kits', pct: 60 },
      { label: 'Transport', pct: 15 },
      { label: 'Learning material', pct: 15 },
      { label: 'Operations', pct: 10 }
    ]
  };

  var campaignState = {
    step: 1,
    amount: 250,
    method: 'UPI',
    donation: null,
    lastFocus: null,
    following: false
  };

  function campaignQs(sel, root) { return (root || document).querySelector(sel); }
  function campaignQsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function campaignFormatINR(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function campaignEscape(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function campaignToast(msg) {
    var t = campaignQs('#campaign-toast');
    t.textContent = msg;
    t.classList.add('campaign-toast-show');
    clearTimeout(campaignToast._t);
    campaignToast._t = setTimeout(function () { t.classList.remove('campaign-toast-show'); }, 2400);
  }

  /* ---------- views ---------- */
  function campaignShowView(name) {
    campaignQsa('[data-campaign-panel]').forEach(function (p) {
      p.classList.toggle('campaign-view-active', p.getAttribute('data-campaign-panel') === name);
    });
    campaignQsa('.campaign-tab').forEach(function (t) {
      t.classList.toggle('campaign-tab-active', t.getAttribute('data-campaign-view') === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'campaign') { campaignRenderCampaign(); }
    if (name === 'profile') { campaignAnimateCounters(); campaignAnimateBars(); }
    if (name === 'impact') { campaignRenderImpact(); }
  }

  /* ---------- counters & bars ---------- */
  function campaignAnimateCounters() {
    campaignQsa('[data-campaign-count]').forEach(function (el) {
      var end = Number(el.getAttribute('data-campaign-count'));
      var money = el.getAttribute('data-campaign-currency') === '1';
      var start = null, dur = 900;
      function frame(ts) {
        if (!start) { start = ts; }
        var p = Math.min((ts - start) / dur, 1);
        var v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        el.textContent = money ? campaignFormatINR(v) : v.toLocaleString('en-IN');
        if (p < 1) { requestAnimationFrame(frame); }
      }
      requestAnimationFrame(frame);
    });
  }

  function campaignAnimateBars() {
    campaignQsa('[data-campaign-width]').forEach(function (b) {
      b.style.width = '0%';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { b.style.width = b.getAttribute('data-campaign-width') + '%'; });
      });
    });
  }

  /* ---------- campaign render ---------- */
  function campaignPct() {
    return Math.min(100, Math.round((campaignData.raised / campaignData.target) * 100));
  }

  function campaignRenderAllocation() {
    var list = campaignQs('#campaign-alloc-list');
    if (list.children.length) { return; }
    campaignData.allocation.forEach(function (a) {
      var li = document.createElement('li');
      li.innerHTML = '<div class="campaign-alloc-head"><span>' + campaignEscape(a.label) + '</span><span>' + a.pct + '%</span></div>' +
        '<div class="campaign-progress"><div class="campaign-progress-bar" data-campaign-width="' + a.pct + '"></div></div>';
      list.appendChild(li);
    });
  }

  function campaignRenderCampaign() {
    campaignRenderAllocation();
    campaignQs('#campaign-raised-text').textContent = campaignFormatINR(campaignData.raised);
    campaignQs('#campaign-target-text').textContent = campaignFormatINR(campaignData.target);
    campaignQs('#campaign-pct-text').textContent = campaignPct() + '%';
    campaignQs('#campaign-contrib-text').textContent = campaignData.contributors.toLocaleString('en-IN');
    campaignQs('#campaign-days-text').textContent = campaignCountdown();
    var bar = campaignQs('#campaign-main-bar');
    bar.style.width = '0%';
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = campaignPct() + '%'; }); });
    campaignAnimateBars();
  }

  function campaignCountdown() {
    if (!campaignData.endDate) {
      campaignData.endDate = new Date(Date.now() + campaignData.daysLeft * 86400000);
    }
    var diff = campaignData.endDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  /* ---------- modal helpers ---------- */
  function campaignOpenOverlay(id) {
    var o = campaignQs(id);
    campaignState.lastFocus = document.activeElement;
    o.classList.add('campaign-overlay-open');
    o.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var f = campaignQs('button, input, textarea', o);
    if (f) { setTimeout(function () { f.focus(); }, 60); }
  }

  function campaignCloseOverlay(id) {
    var o = campaignQs(id);
    o.classList.remove('campaign-overlay-open');
    o.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (campaignState.lastFocus && campaignState.lastFocus.focus) { campaignState.lastFocus.focus(); }
  }

  /* ---------- donation ---------- */
  function campaignOpenDonation() {
    campaignResetDonation();
    campaignOpenOverlay('#campaign-donation-overlay');
  }

  function campaignCloseDonation() { campaignCloseOverlay('#campaign-donation-overlay'); }

  function campaignResetDonation() {
    campaignState.step = 1;
    campaignQs('#campaign-donation-flow').classList.remove('campaign-hidden');
    campaignQs('#campaign-donation-loading').classList.add('campaign-hidden');
    campaignQs('#campaign-donation-success').classList.add('campaign-hidden');
    campaignQs('#campaign-donation-error').textContent = '';
    campaignQs('#campaign-custom-wrap').classList.add('campaign-hidden');
    campaignQs('#campaign-custom-amount').value = '';
    campaignSelectAmount('250');
    campaignGoStep(1);
  }

  function campaignSelectAmount(val) {
    campaignQsa('.campaign-amount-btn').forEach(function (b) {
      b.classList.toggle('campaign-amount-selected', b.getAttribute('data-campaign-amount') === val);
    });
    var custom = val === 'custom';
    campaignQs('#campaign-custom-wrap').classList.toggle('campaign-hidden', !custom);
    if (custom) {
      campaignQs('#campaign-custom-amount').focus();
      campaignState.amount = Number(campaignQs('#campaign-custom-amount').value) || 0;
    } else {
      campaignState.amount = Number(val);
    }
  }

  function campaignGoStep(n) {
    campaignState.step = n;
    campaignQsa('.campaign-step-panel').forEach(function (p) {
      p.classList.toggle('campaign-step-panel-active', Number(p.getAttribute('data-campaign-step')) === n);
    });
    campaignQsa('.campaign-step').forEach(function (s, i) {
      s.classList.toggle('campaign-step-active', i + 1 === n);
      s.classList.toggle('campaign-step-done', i + 1 < n);
    });
    campaignQs('#campaign-step-back').classList.toggle('campaign-hidden', n === 1);
    campaignQs('#campaign-step-next').classList.toggle('campaign-hidden', n === 3);
    campaignQs('#campaign-proceed-btn').classList.toggle('campaign-hidden', n !== 3);
    campaignQs('#campaign-donation-error').textContent = '';
    if (n === 3) { campaignUpdateSummary(); }
  }

  function campaignUpdateSummary() {
    var m = campaignQs('input[name="campaign-pay-method"]:checked');
    campaignState.method = m ? m.value : 'UPI';
    campaignQs('#campaign-pay-summary').textContent =
      'You are donating ' + campaignFormatINR(campaignState.amount) + ' to “' + campaignData.title + '”.';
  }

  function campaignValidateStep(n) {
    var err = campaignQs('#campaign-donation-error');
    if (n === 1) {
      if (campaignQs('.campaign-amount-selected').getAttribute('data-campaign-amount') === 'custom') {
        campaignState.amount = Number(campaignQs('#campaign-custom-amount').value) || 0;
      }
      if (!campaignState.amount || campaignState.amount < 10) {
        err.textContent = 'Enter an amount of at least ₹10.';
        return false;
      }
    }
    if (n === 2) {
      var name = campaignQs('#campaign-donor-name').value.trim();
      var email = campaignQs('#campaign-donor-email').value.trim();
      var phone = campaignQs('#campaign-donor-phone').value.trim();
      if (!name) { err.textContent = 'Enter your full name.'; return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Enter a valid email address.'; return false; }
      if (!/^[0-9+\-\s]{10,15}$/.test(phone)) { err.textContent = 'Enter a valid phone number (10 digits or more).'; return false; }
    }
    err.textContent = '';
    return true;
  }

  function campaignNextStep() {
    if (campaignValidateStep(campaignState.step)) { campaignGoStep(campaignState.step + 1); }
  }

  function campaignPrevStep() {
    if (campaignState.step > 1) { campaignGoStep(campaignState.step - 1); }
  }

  function campaignGenerateTransaction() {
    var n = Math.floor(100000 + Math.random() * 900000);
    return 'NX-2026-' + n;
  }

  function campaignFormatDate(d) {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function campaignProcessDonation() {
    if (!campaignValidateStep(2)) { campaignGoStep(2); return; }
    campaignUpdateSummary();
    campaignQs('#campaign-donation-flow').classList.add('campaign-hidden');
    campaignQs('#campaign-donation-loading').classList.remove('campaign-hidden');

    setTimeout(function () {
      campaignState.donation = {
        donor: campaignQs('#campaign-donor-name').value.trim(),
        email: campaignQs('#campaign-donor-email').value.trim(),
        amount: campaignState.amount,
        method: campaignState.method,
        campaign: campaignData.title,
        ngo: campaignData.ngo,
        txn: campaignGenerateTransaction(),
        date: new Date()
      };
      campaignData.raised += campaignState.donation.amount;
      campaignData.contributors += 1;
      campaignShowSuccess();
    }, 1100);
  }

  function campaignRows(pairs) {
    return pairs.map(function (p) {
      return '<div><dt>' + campaignEscape(p[0]) + '</dt><dd>' + campaignEscape(p[1]) + '</dd></div>';
    }).join('');
  }

  function campaignShowSuccess() {
    var d = campaignState.donation;
    campaignQs('#campaign-donation-loading').classList.add('campaign-hidden');
    campaignQs('#campaign-donation-success').classList.remove('campaign-hidden');
    campaignQs('#campaign-success-details').innerHTML = campaignRows([
      ['Transaction ID', d.txn],
      ['Amount', campaignFormatINR(d.amount)],
      ['Campaign', d.campaign],
      ['Date', campaignFormatDate(d.date)]
    ]);
  }

  /* ---------- receipt & impact ---------- */
  function campaignRenderReceipt() {
    var d = campaignState.donation;
    var slot = campaignQs('#campaign-receipt-slot');
    if (!d) { slot.innerHTML = ''; return; }
    slot.innerHTML =
      '<div class="campaign-receipt">' +
        '<div class="campaign-receipt-brand">NEXORA</div>' +
        '<div class="campaign-receipt-title">Donation Acknowledgement</div>' +
        '<dl class="campaign-dl">' + campaignRows([
          ['Donor', d.donor],
          ['Campaign', d.campaign],
          ['NGO', d.ngo],
          ['Amount', campaignFormatINR(d.amount)],
          ['Transaction ID', d.txn],
          ['Date', campaignFormatDate(d.date)]
        ]) + '</dl>' +
        '<p class="campaign-receipt-note">Demo acknowledgement. Not an official tax certificate.</p>' +
        '<button class="campaign-btn campaign-btn-primary" type="button" id="campaign-download-btn">Download Acknowledgement</button>' +
        '<button class="campaign-btn campaign-btn-ghost" type="button" id="campaign-receipt-back">Back to Campaign</button>' +
      '</div>';
    campaignQs('#campaign-download-btn').addEventListener('click', campaignDownloadReceipt);
    campaignQs('#campaign-receipt-back').addEventListener('click', function () { campaignShowView('campaign'); });
  }

  function campaignRenderImpact() {
    var has = !!campaignState.donation;
    campaignQs('#campaign-impact-empty').classList.toggle('campaign-hidden', has);
    campaignQs('#campaign-impact-content').classList.toggle('campaign-hidden', !has);
    if (has) { campaignRenderReceipt(); }
  }

  function campaignDownloadReceipt() {
    var d = campaignState.donation;
    if (!d) { return; }
    var lines = [
      'NEXORA — Donation Acknowledgement',
      '=================================',
      'Donor:          ' + d.donor,
      'Campaign:       ' + d.campaign,
      'NGO:            ' + d.ngo,
      'Amount:         INR ' + d.amount,
      'Payment method: ' + d.method + ' (simulated)',
      'Transaction ID: ' + d.txn,
      'Date:           ' + campaignFormatDate(d.date),
      '',
      'Demo transaction — no real money was transferred.',
      'This is an acknowledgement only. It is NOT an official tax certificate.'
    ];
    var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'NEXORA-acknowledgement-' + d.txn + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
    campaignToast('Acknowledgement downloaded');
  }

  /* ---------- volunteer ---------- */
  function campaignOpenVolunteer() {
    campaignQs('#campaign-volunteer-form-wrap').classList.remove('campaign-hidden');
    campaignQs('#campaign-volunteer-success').classList.add('campaign-hidden');
    campaignQs('#campaign-volunteer-error').textContent = '';
    campaignOpenOverlay('#campaign-volunteer-overlay');
  }

  function campaignCloseVolunteer() { campaignCloseOverlay('#campaign-volunteer-overlay'); }

  function campaignRegisterVolunteer() {
    var err = campaignQs('#campaign-volunteer-error');
    var name = campaignQs('#campaign-vol-name').value.trim();
    var email = campaignQs('#campaign-vol-email').value.trim();
    var phone = campaignQs('#campaign-vol-phone').value.trim();
    var date = campaignQs('#campaign-vol-date').value;
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[0-9+\-\s]{10,15}$/.test(phone) || !date) {
      err.textContent = 'Fill in name, a valid email, a valid phone number and an available date.';
      return;
    }
    err.textContent = '';
    campaignQs('#campaign-volunteer-form-wrap').classList.add('campaign-hidden');
    campaignQs('#campaign-volunteer-success').classList.remove('campaign-hidden');
  }

  /* ---------- follow ---------- */
  function campaignToggleFollow() {
    var b = campaignQs('#campaign-follow-btn');
    campaignState.following = !campaignState.following;
    b.textContent = campaignState.following ? 'Following ✓' : 'Follow';
    b.classList.toggle('campaign-btn-following', campaignState.following);
    campaignToast(campaignState.following ? 'You are following ' + campaignData.ngo : 'Unfollowed');
  }

  /* ---------- init ---------- */
  function campaignInit() {
    campaignQsa('[data-campaign-view]').forEach(function (el) {
      el.addEventListener('click', function () { campaignShowView(el.getAttribute('data-campaign-view')); });
    });
    campaignQsa('[data-campaign-open-donation]').forEach(function (el) { el.addEventListener('click', campaignOpenDonation); });
    campaignQsa('[data-campaign-open-volunteer]').forEach(function (el) { el.addEventListener('click', campaignOpenVolunteer); });
    campaignQsa('[data-campaign-close="donation"]').forEach(function (el) { el.addEventListener('click', campaignCloseDonation); });
    campaignQsa('[data-campaign-close="volunteer"]').forEach(function (el) { el.addEventListener('click', campaignCloseVolunteer); });
    campaignQsa('.campaign-amount-btn').forEach(function (b) {
      b.addEventListener('click', function () { campaignSelectAmount(b.getAttribute('data-campaign-amount')); });
    });
    campaignQs('#campaign-custom-amount').addEventListener('input', function (e) {
      campaignState.amount = Number(e.target.value) || 0;
    });
    campaignQs('#campaign-step-next').addEventListener('click', campaignNextStep);
    campaignQs('#campaign-step-back').addEventListener('click', campaignPrevStep);
    campaignQs('#campaign-proceed-btn').addEventListener('click', campaignProcessDonation);
    campaignQsa('input[name="campaign-pay-method"]').forEach(function (r) { r.addEventListener('change', campaignUpdateSummary); });
    campaignQs('#campaign-view-impact-btn').addEventListener('click', function () {
      campaignCloseDonation();
      campaignShowView('impact');
    });
    campaignQs('#campaign-vol-submit').addEventListener('click', campaignRegisterVolunteer);
    campaignQs('#campaign-follow-btn').addEventListener('click', campaignToggleFollow);

    ['#campaign-donation-overlay', '#campaign-volunteer-overlay'].forEach(function (id) {
      campaignQs(id).addEventListener('click', function (e) {
        if (e.target === e.currentTarget) { campaignCloseOverlay(id); }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        campaignCloseOverlay('#campaign-donation-overlay');
        campaignCloseOverlay('#campaign-volunteer-overlay');
      }
    });

    campaignRenderCampaign();
    campaignAnimateCounters();
    campaignAnimateBars();
  }

  document.addEventListener('DOMContentLoaded', campaignInit);

  /* public hooks for merging */
  window.campaignOpenDonation = campaignOpenDonation;
  window.campaignProcessDonation = campaignProcessDonation;
  window.campaignGenerateTransaction = campaignGenerateTransaction;
  window.campaignRegisterVolunteer = campaignRegisterVolunteer;
  window.campaignShowView = campaignShowView;
})();
