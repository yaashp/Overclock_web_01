/* NEXORA Impact Feed. Demo data + localStorage today; each data function below maps to an API call later. */
(function () {
'use strict';

/* ================= 1. DEMO DATA (replace with API responses) ================= */
// Demo campaigns. raised/donors here are the base values; donations made in the feed are added on top.
const campaigns = {
  101: { id: 101, title: 'Urban Green Mumbai', goal: 250000, raised: 172000, donors: 420, meter: 'Supports native tree planting', stage: 2 },
  102: { id: 102, title: 'Back to School 2026', goal: 200000, raised: 115000, donors: 286, meter: 'Helps provide learning materials', stage: 2 },
  103: { id: 103, title: 'Rescue & Recovery Fund', goal: 150000, raised: 88000, donors: 311, meter: 'Supports treatment and vaccinations for rescued animals', stage: 2 },
  105: { id: 105, title: 'Community Kitchen Meals', goal: 300000, raised: 210000, donors: 533, meter: 'Supports meal distribution', stage: 2 },
  107: { id: 107, title: 'Digital Skills for Women', goal: 120000, raised: 72000, donors: 164, meter: 'Supports skills training for women', stage: 2 },
  108: { id: 108, title: 'Rural Water Harvesting', goal: 500000, raised: 400000, donors: 612, meter: 'Supports water harvesting systems', stage: 2 },
  109: { id: 109, title: 'Emergency Relief', goal: 500000, raised: 320000, donors: 478, meter: 'Supports food, blankets and essential supplies', stage: 2 },
  110: { id: 110, title: 'Keep 100 Students Learning', goal: 300000, raised: 184000, donors: 241, meter: 'Supports essential educational materials', stage: 2 },
  111: { id: 111, title: 'Wildlife Rescue Care', goal: 100000, raised: 47000, donors: 129, meter: 'Supports treatment and rehabilitation of injured wildlife', stage: 2 },
  113: { id: 113, title: 'School Kit Drive', goal: 250000, raised: 267500, donors: 740, meter: 'Provided school kits to students', stage: 5, completed: true }
};
const J_ACTIVE = ['Campaign Started', 'Funding Progress', 'Activity Underway', 'Completion', 'Impact Update'];
const J_DONE = ['Campaign Completed', 'Impact Published'];

// type: impact | story | milestone | fundraiser | campaign | event | volunteer | completed
// mins = minutes since posting (lightly randomised on load so the feed feels live)
const feedPosts = [
 { id: 1, ngoId: 1, ngoName: 'Green Mumbai Foundation', initials: 'GM', color: '#285943', verified: true, type: 'impact', label: 'Impact Update', cause: 'Environment', location: 'Borivali, Mumbai', title: '500 native trees planted this weekend', description: 'Our volunteers came together to restore a degraded urban patch in Borivali. The first phase of the project has now been completed.', tags: ['Environment', 'Mumbai', 'TreePlantation'], tone: 0, caption: 'Borivali plantation drive', likes: 428, comments: 37, campaignId: 101, cta: 'Donate to Campaign', mins: 2 },
 { id: 2, ngoId: 2, ngoName: 'Udaan Education Trust', initials: 'UE', color: '#1f6f8b', verified: true, type: 'campaign', label: 'Campaign Update', cause: 'Education', location: 'Pune, Maharashtra', title: 'School kits are reaching students this week!', description: 'The first batch of notebooks, bags and learning materials has reached 200 students. Our campaign is still open to help another 300 students.', tags: ['Education', 'SchoolKits', 'Pune'], tone: 1, caption: 'First batch delivered', likes: 356, comments: 24, campaignId: 102, cta: 'Donate Now', mins: 18 },
 { id: 3, ngoId: 3, ngoName: 'Paws & Care Foundation', initials: 'PC', color: '#a1443c', verified: true, type: 'impact', label: 'Impact Update', cause: 'Animal Welfare', location: 'Mumbai', title: '32 rescued animals received medical care this month.', description: 'From emergency treatment to vaccinations, our rescue team continues to support abandoned and injured animals.', tags: ['AnimalWelfare', 'Rescue', 'Mumbai'], tone: 2, caption: 'Rescue clinic, Mumbai', likes: 612, comments: 58, campaignId: 103, cta: 'Support Animal Care', mins: 55 },
 { id: 4, ngoId: 4, ngoName: 'Sehat For All', initials: 'SF', color: '#7a4a8c', verified: true, type: 'event', label: 'Event', cause: 'Healthcare', location: 'Nashik', title: 'Free Health Check-up Camp', description: 'Our volunteer doctors will provide free basic health screenings this Sunday.', tags: ['Healthcare', 'Nashik', 'FreeCamp'], tone: 3, caption: 'Open to all residents', likes: 203, comments: 19, info: ['Sunday, 18 October', '9:00 AM – 2:00 PM', '150 volunteer slots'], cta: 'Join as Volunteer', mins: 130 },
 { id: 5, ngoId: 5, ngoName: 'Annapurna Community Trust', initials: 'AC', color: '#b4690e', verified: true, type: 'impact', label: 'Impact Update', cause: 'Food & Hunger', location: 'Mumbai', title: '2,000 meals distributed this week', description: 'Our community kitchens provided meals to families experiencing food insecurity.', tags: ['FoodSecurity', 'Mumbai', 'CommunityKitchen'], tone: 4, caption: 'Community kitchen, Mumbai', likes: 781, comments: 71, campaignId: 105, cta: 'Support Meal Program', mins: 190 },
 { id: 6, ngoId: 6, ngoName: 'Clean Coast Initiative', initials: 'CC', color: '#3F6B5E', verified: true, type: 'volunteer', label: 'Volunteer Opportunity', cause: 'Environment', location: 'Versova Beach, Mumbai', title: 'Help us clean 2 km of coastline.', description: 'Join 100+ volunteers this weekend to remove plastic waste from the shoreline.', tags: ['BeachCleanup', 'Mumbai', 'Volunteer'], tone: 5, caption: 'Versova shoreline', likes: 167, comments: 22, info: ['Saturday', '100 volunteers needed'], cta: 'Join Cleanup', mins: 260 },
 { id: 7, ngoId: 7, ngoName: 'Sakhi Foundation', initials: 'SK', color: '#8E4A6E', verified: true, type: 'story', label: 'Impact Story', cause: 'Women & Children', location: 'Pune, Maharashtra', title: '48 women completed their digital skills program.', description: 'Participants learned:', bullets: ['Basic computer skills', 'Digital payments', 'Online job applications', 'Financial literacy'], tags: ['WomenEmpowerment', 'DigitalSkills'], tone: 1, caption: 'Graduation day', likes: 291, comments: 26, campaignId: 107, cta: "Support Women's Skills", mins: 420 },
 { id: 8, ngoId: 8, ngoName: 'Jal Jeevan Collective', initials: 'JJ', color: '#0f5c8b', verified: true, type: 'milestone', label: 'Campaign Milestone', cause: 'Water', location: 'Nashik district', title: '₹4 lakh milestone reached!', description: 'Your contributions are helping us install water harvesting systems in rural communities.', tags: ['Water', 'RuralDevelopment'], tone: 5, caption: '80% funded', stamp: '80% funded', likes: 334, comments: 31, campaignId: 108, cta: 'Complete the Campaign', mins: 720 },
 { id: 9, ngoId: 9, ngoName: 'Hope Shelter Network', initials: 'HS', color: '#765B45', verified: true, type: 'impact', label: 'Impact Update', cause: 'Disaster Relief', location: 'Thane', title: '120 families received emergency supplies.', description: 'Following heavy rainfall, our volunteers distributed food, blankets and essential supplies.', tags: ['DisasterRelief', 'Thane'], tone: 2, caption: 'Relief distribution, Thane', likes: 449, comments: 40, campaignId: 109, cta: 'Support Relief Work', mins: 1500 },
 { id: 10, ngoId: 10, ngoName: 'Bright Futures India', initials: 'BF', color: '#C87552', verified: true, type: 'fundraiser', label: 'Fundraiser', cause: 'Education', location: 'Mumbai', title: 'Help 100 students continue their education.', description: 'Many students in low-income communities struggle to afford essential educational materials.', tags: ['Education', 'Scholarship'], tone: 4, caption: 'Goal: ₹3,00,000', likes: 238, comments: 17, campaignId: 110, cta: 'Donate Now', mins: 1700 },
 { id: 11, ngoId: 11, ngoName: 'Wildlife Care India', initials: 'WC', color: '#4F7A5E', verified: true, type: 'impact', label: 'Rescue Update', cause: 'Animal Welfare', location: 'Mumbai', title: '17 injured birds rescued and treated this week.', description: 'Our rehabilitation team is caring for injured urban wildlife.', tags: ['Wildlife', 'Rescue'], tone: 3, caption: 'Rehabilitation centre', likes: 305, comments: 28, campaignId: 111, cta: 'Support Wildlife Rescue', mins: 2900 },
 { id: 12, ngoId: 12, ngoName: 'Green Roots Collective', initials: 'GR', color: '#2e7d4f', verified: true, type: 'volunteer', label: 'Volunteer Event', cause: 'Environment', location: 'Pune', title: 'Community Garden Day', description: 'Help us create a community garden with local residents.', tags: ['CommunityGarden', 'Pune'], tone: 0, caption: 'Open to local residents', likes: 142, comments: 12, info: ['Sunday', '50 volunteers required'], cta: 'Join Event', mins: 3300 },
 { id: 13, ngoId: 13, ngoName: 'Nayi Disha Foundation', initials: 'ND', color: '#285943', verified: true, type: 'completed', label: 'Campaign Completed ✓', cause: 'Education', location: 'Mumbai', title: 'School Kit Drive Completed', description: 'Thanks to our donors, the campaign crossed its goal and every kit has been delivered.', tags: ['Education', 'ImpactReport'], tone: 0, caption: '500 students received school kits', stamp: '✓ Completed', likes: 892, comments: 84, campaignId: 113, impactLine: '500 students received school kits.', cta: 'View Impact Report →', mins: 4400 },
 { id: 14, ngoId: 14, ngoName: 'Food For All Network', initials: 'FA', color: '#b4690e', verified: true, type: 'milestone', label: 'Milestone', cause: 'Food & Hunger', location: 'Maharashtra', title: '10,000 meals served!', description: 'Our community kitchen network has crossed the 10,000-meal milestone.', tags: ['Milestone', 'ZeroHunger'], tone: 4, caption: '10,000 meals and counting', stamp: '10,000', likes: 967, comments: 93, cta: 'View Impact', ctaHref: 'impact.html', mins: 5800 },
 { id: 15, ngoId: 15, ngoName: 'CareBridge Foundation', initials: 'CB', color: '#8E4A4A', verified: true, type: 'volunteer', label: 'Volunteer Opportunity', cause: 'Community', location: 'Mumbai', title: 'Volunteers needed for senior citizen support', description: 'Help elderly residents with:', bullets: ['Grocery support', 'Digital payments', 'Medicine pickup', 'Weekly visits'], tags: ['SeniorCare', 'Volunteer'], tone: 2, caption: 'Weekly visits, flexible hours', likes: 118, comments: 9, cta: 'Become a Volunteer', mins: 7200 }
];
const demoComments = [
  ['Aarav', 'Amazing work!'], ['Meera', 'Happy to support this initiative.'], ['Rahul', 'How can I volunteer?'],
  ['Sneha', 'This is what transparent giving looks like.'], ['Kabir', 'Proud to be a donor. Thank you for the update!'], ['Isha', 'Shared this with my college group.']
];
const urgentIds = [109, 111, 105];
const trending = ['Environment', 'Education', 'Animal Welfare', 'Healthcare', 'Food & Hunger'];
// light randomisation so every load feels a little different
feedPosts.forEach(function (p) { p.mins = Math.max(1, Math.round(p.mins * (0.9 + Math.random() * 0.2))); });

/* ================= 2. STORAGE ================= */
const K = { liked: 'nexora-liked-posts', saved: 'nexora-saved-posts', follow: 'nexora-followed-ngos', comments: 'nexora-comments', donations: 'nexora-feed-donations', vols: 'nexora-feed-volunteers' };
function read(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable: state lives for this session only */ } }
const mem = {}; // fallback copy so the UI still works if storage is blocked
function load(k, d) { if (!(k in mem)) mem[k] = read(k, d); return mem[k]; }
function save(k, v) { mem[k] = v; write(k, v); }

/* ================= 3. DATA LAYER (API-ready) ================= */
// GET /api/feed
function getFeedPosts() { return feedPosts.slice(); }
// POST /api/posts/{id}/like (and DELETE for unlike)
function likePost(id) { const l = load(K.liked, []); if (l.indexOf(id) < 0) { l.push(id); save(K.liked, l); } }
function unlikePost(id) { save(K.liked, load(K.liked, []).filter(function (x) { return x !== id; })); }
// POST /api/posts/{id}/comments
function addComment(id, text, name) { const c = load(K.comments, {}); (c[id] = c[id] || []).push({ name: name || 'You', text: text }); save(K.comments, c); }
function getComments(id) {
  const base = [0, 1, 2].map(function (i) { return demoComments[(id + i) % demoComments.length]; }).map(function (c) { return { name: c[0], text: c[1] }; });
  return base.concat(load(K.comments, {})[id] || []);
}
// POST /api/posts/{id}/save
function savePost(id) { const s = load(K.saved, []); if (s.indexOf(id) < 0) { s.push(id); save(K.saved, s); } }
function unsavePost(id) { save(K.saved, load(K.saved, []).filter(function (x) { return x !== id; })); }
// POST /api/ngos/{id}/follow
function followNGO(id) { const f = load(K.follow, []); if (f.indexOf(id) < 0) { f.push(id); save(K.follow, f); } }
function unfollowNGO(id) { save(K.follow, load(K.follow, []).filter(function (x) { return x !== id; })); }
function getFollowingPosts() { const f = load(K.follow, []); return getFeedPosts().filter(function (p) { return f.indexOf(p.ngoId) >= 0; }); }
function getSavedPosts() { const s = load(K.saved, []); return getFeedPosts().filter(function (p) { return s.indexOf(p.id) >= 0; }); }
// POST /api/donations
function donateToCampaign(campaignId, amount, donor) {
  const d = load(K.donations, []); d.push({ campaignId: campaignId, amount: amount, donor: donor || 'Anonymous', date: new Date().toISOString() }); save(K.donations, d);
  return getCampaign(campaignId);
}
function getCampaign(id) {
  const c = campaigns[id]; if (!c) return null;
  const mine = load(K.donations, []).filter(function (d) { return d.campaignId === id; });
  const raised = c.raised + mine.reduce(function (s, d) { return s + d.amount; }, 0);
  return Object.assign({}, c, { raised: raised, donors: c.donors + mine.length, pct: Math.min(100, Math.round(raised / c.goal * 100)) });
}
function registerVolunteer(postId, details) { const v = load(K.vols, []); v.push(Object.assign({ postId: postId, date: new Date().toISOString() }, details)); save(K.vols, v); }
function isRegistered(postId) { return load(K.vols, []).some(function (v) { return v.postId === postId; }); }

/* ================= 4. HELPERS ================= */
const $ = function (s, r) { return (r || document).querySelector(s); };
const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function ago(m) { if (m < 60) return m + 'm ago'; if (m < 1440) return Math.floor(m / 60) + 'h ago'; if (m < 2880) return 'Yesterday'; return Math.floor(m / 1440) + ' days ago'; }
function group(p) { return { impact: 'impact', story: 'impact', milestone: 'impact', fundraiser: 'fundraiser', campaign: 'fundraiser', event: 'event', volunteer: 'volunteer', completed: 'completed' }[p.type]; }
function isVol(p) { return p.type === 'event' || p.type === 'volunteer'; }
let toastT; function toast(m) { const t = $('#fd-toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 2200); }
function byId(id) { return feedPosts.filter(function (p) { return p.id === id; })[0]; }

/* ================= 5. STATE + FILTERING ================= */
const S = { view: 'foryou', type: 'all', cause: 'all', loc: 'all', sort: 'default', verified: false, q: '', openC: {}, openD: {} };
feedPosts.forEach(function (p) { if (p.type === 'completed' || p.id === 1) S.openD[p.id] = true; });

function visiblePosts() {
  let list = S.view === 'following' ? getFollowingPosts() : S.view === 'saved' ? getSavedPosts() : getFeedPosts();
  const q = S.q.trim().toLowerCase();
  list = list.filter(function (p) {
    const c = p.campaignId ? campaigns[p.campaignId].title : '';
    if (S.type !== 'all' && group(p) !== S.type) return false;
    if (S.cause !== 'all' && p.cause !== S.cause) return false;
    if (S.loc !== 'all' && p.location.split(',')[0] !== S.loc) return false;
    if (S.verified && !p.verified) return false;
    return !q || [p.ngoName, c, p.cause, p.location, p.title, p.description, p.tags.join(' ')].join(' ').toLowerCase().indexOf(q) >= 0;
  });
  const sort = S.view === 'latest' ? 'latest' : S.sort;
  if (sort === 'latest') list.sort(function (a, b) { return a.mins - b.mins; });
  if (sort === 'liked') list.sort(function (a, b) { return likeCount(b) - likeCount(a); });
  return list;
}
function liked(p) { return load(K.liked, []).indexOf(p.id) >= 0; }
function likeCount(p) { return p.likes + (liked(p) ? 1 : 0); }
function commentCount(p) { return p.comments + (load(K.comments, {})[p.id] || []).length; }

/* ================= 6. RENDERING ================= */
function progressHtml(p) {
  const c = getCampaign(p.campaignId), done = c.completed;
  return '<div class="fd-camp" data-camp="' + c.id + '"><h5>' + (done ? 'Campaign Result' : 'Campaign Progress') + '</h5><div class="fd-cname">' + esc(c.title) + '</div>' +
    '<div class="fd-bar' + (done ? ' done' : '') + '"><i style="width:' + c.pct + '%"></i></div>' +
    '<div class="fd-pm"><span>' + inr(c.raised) + ' / ' + inr(c.goal) + '</span><span>' + (done ? '✓ Goal reached' : c.pct + '% funded') + '</span></div>' +
    '<div class="fd-meter"><small>Impact Meter</small>' + esc(c.meter) + '</div>' +
    '<button class="fd-tg" data-act="det" aria-expanded="' + !!S.openD[p.id] + '">Transparency &amp; Journey ' + (S.openD[p.id] ? '▴' : '▾') + '</button>' +
    (S.openD[p.id] ? detailsHtml(c) : '') + '</div>';
}
function detailsHtml(c) {
  const steps = c.completed ? J_DONE : J_ACTIVE, done = c.completed ? 2 : c.stage;
  const journey = steps.map(function (s, i) { return '<li class="' + (i < done ? 'g' : i === done ? 'y' : 'w') + '">' + s + '</li>'; }).join('');
  return '<div class="fd-det"><h5 style="margin:0 0 10px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#765B45">Transparency</h5><div class="fd-tr">' +
    '<div><b>' + inr(c.goal) + '</b><span>Goal</span></div><div><b>' + inr(c.raised) + '</b><span>Raised</span></div><div><b>' + c.donors + '</b><span>Donors</span></div><div><b>' + c.pct + '%</b><span>Progress</span></div></div>' +
    '<a href="campaign.html">View Campaign Details →</a>' +
    '<h5 style="margin:10px 0 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#765B45">Campaign Journey</h5><ul class="fd-jr">' + journey + '</ul></div>';
}
function commentsHtml(p) {
  return '<div class="fd-cm">' + getComments(p.id).map(function (c) { return '<div class="fd-c"><i>' + esc(c.name[0]) + '</i><div><b>' + esc(c.name) + '</b>' + esc(c.text) + '</div></div>'; }).join('') +
    '<div class="fd-cform"><input type="text" maxlength="300" placeholder="Write a comment..." aria-label="Write a comment"><button class="fd-btn sm" data-act="post">Post</button></div></div>';
}
function ctaHtml(p) {
  if (p.ctaHref) return '<div class="fd-cta"><a class="fd-btn alt" style="display:block;text-align:center;text-decoration:none" href="' + p.ctaHref + '">' + esc(p.cta) + '</a></div>';
  if (p.type === 'completed') return '<div class="fd-cta"><a class="fd-btn" style="display:block;text-align:center;text-decoration:none" href="impact.html">' + esc(p.cta) + '</a></div>';
  if (isVol(p)) return '<div class="fd-cta"><button class="fd-btn" data-act="vol"' + (isRegistered(p.id) ? ' disabled>✓ You\'re registered!' : '>' + esc(p.cta)) + '</button></div>';
  if (p.campaignId) return '<div class="fd-cta"><button class="fd-btn" data-act="donate">' + esc(p.cta) + '</button></div>';
  return '';
}
function postHtml(p) {
  const f = load(K.follow, []).indexOf(p.ngoId) >= 0, sv = load(K.saved, []).indexOf(p.id) >= 0, lk = liked(p);
  const badge = p.type === 'completed' ? 'done' : isVol(p) ? 'vol' : '';
  return '<article class="fd-post" id="post-' + p.id + '" data-id="' + p.id + '">' +
    '<div class="fd-ph"><div class="fd-logo" style="background:' + p.color + '" aria-hidden="true">' + p.initials + '</div><div class="fd-who"><div class="fd-name">' + esc(p.ngoName) + ' <span class="fd-ver">✓ Verified</span>' +
    '<button class="fd-follow' + (f ? ' on' : '') + '" data-act="follow" aria-pressed="' + f + '">' + (f ? '✓ Following' : '+ Follow') + '</button></div><div class="fd-meta">' + esc(p.location) + '</div></div><div class="fd-time">• ' + ago(p.mins) + '</div></div>' +
    '<span class="fd-badge ' + badge + '">' + esc(p.label) + '</span><h2 class="fd-title">' + esc(p.title) + '</h2>' +
    '<div class="fd-img t' + p.tone + '" role="img" aria-label="' + esc(p.caption) + '">' + (p.stamp ? '<span class="stamp">' + esc(p.stamp) + '</span>' : '') + '<span class="cap">' + esc(p.caption) + '</span></div>' +
    '<p class="fd-desc">' + esc(p.description) + '</p>' + (p.bullets ? '<ul class="fd-bul">' + p.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '') +
    (p.info ? '<div class="fd-info">' + p.info.map(function (i) { return '<span>' + esc(i) + '</span>'; }).join('') + '</div>' : '') +
    (p.impactLine ? '<div class="fd-res"><div><small>IMPACT</small><br><b>' + esc(p.impactLine) + '</b></div><a class="fd-link" href="impact.html">View Impact Report →</a></div>' : '') +
    '<div class="fd-tags">' + p.tags.map(function (t) { return '<span>#' + esc(t) + '</span>'; }).join('') + '</div>' +
    '<div class="fd-counts"><span data-lc>' + likeCount(p) + ' likes</span><span data-cc>' + commentCount(p) + ' comments</span></div>' +
    '<div class="fd-acts"><button class="fd-like' + (lk ? ' on' : '') + '" data-act="like" aria-pressed="' + lk + '">' + (lk ? 'Liked' : 'Like') + '</button>' +
    '<button data-act="comment" aria-expanded="' + !!S.openC[p.id] + '">Comment</button><button data-act="share" aria-haspopup="true">Share</button>' +
    '<button class="fd-save' + (sv ? ' on' : '') + '" data-act="save" aria-pressed="' + sv + '" aria-label="' + (sv ? 'Remove from saved' : 'Save post') + '">' + (sv ? 'Saved' : 'Save') + '</button></div>' +
    '<div data-cm>' + (S.openC[p.id] ? commentsHtml(p) : '') + '</div>' +
    (p.campaignId ? progressHtml(p) : '') + ctaHtml(p) + '</article>';
}
function empty() {
  if (S.view === 'following') return '<div class="fd-empty"><b>You\'re not following any NGOs yet</b>Tap “+ Follow” on any NGO in For You and their posts will show up here.</div>';
  if (S.view === 'saved') return '<div class="fd-empty"><b>Nothing saved yet</b>Tap Save on a post to keep it here.</div>';
  return '<div class="fd-empty"><b>No posts match these filters</b>Try clearing a filter or searching for something else.</div>';
}
function render() {
  const list = visiblePosts();
  $('#fd-list').innerHTML = list.length ? list.map(postHtml).join('') : empty();
  $('#fd-count').textContent = list.length + (list.length === 1 ? ' post' : ' posts');
  $$('#fd-tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.view === S.view); });
  $$('#fd-chips button').forEach(function (b) { b.classList.toggle('on', b.dataset.type === S.type); });
  $$('#fd-menu button').forEach(function (b) {
    b.classList.toggle('on', b.dataset.view ? b.dataset.view === S.view : b.dataset.type ? b.dataset.type === S.type : b.dataset.cause === S.cause);
  });
  renderUrgent();
}
function renderUrgent() {
  $('#fd-urgent').innerHTML = urgentIds.map(function (id) {
    const c = getCampaign(id);
    return '<div class="fd-u"><b>' + esc(c.title) + '</b><div class="r"><span>' + inr(c.raised) + ' / ' + inr(c.goal) + '</span><span>' + c.pct + '%</span></div><div class="fd-bar"><i style="width:' + c.pct + '%"></i></div><button class="fd-btn sm" data-urgent="' + id + '">Donate</button></div>';
  }).join('');
}

/* ================= 7. MODALS ================= */
let lastFocus = null, amount = 500;
function openModal(html) { lastFocus = document.activeElement; $('#fd-mbody').innerHTML = html; $('#fd-modal').hidden = false; const f = $('#fd-mbody input,#fd-mbody button'); if (f) f.focus(); }
function closeModal() { $('#fd-modal').hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
function donateModal(campaignId) {
  const c = getCampaign(campaignId); amount = 500;
  openModal('<h3 id="fd-mt">' + esc(c.title) + '</h3><p class="sub">' + esc(c.meter) + '</p><div class="fd-amts">' +
    [100, 500, 1000].map(function (a) { return '<button data-amt="' + a + '"' + (a === 500 ? ' class="on"' : '') + '>' + inr(a) + '</button>'; }).join('') +
    '<button data-amt="custom">Custom</button></div><input type="number" id="fd-custom" min="1" max="1000000" placeholder="Enter custom amount (₹)" aria-label="Custom amount" hidden>' +
    '<p class="fd-err" id="fd-err"></p><button class="fd-btn full" data-pay="' + campaignId + '">Donate</button><p class="sub" style="margin:12px 0 0">Demo platform: no real payment is made.</p>');
}
function volModal(postId) {
  const p = byId(postId);
  openModal('<h3 id="fd-mt">Join as Volunteer</h3><p class="sub">' + esc(p.title) + ' · ' + esc(p.ngoName) + '</p><input type="text" id="fv-n" placeholder="Full name" aria-label="Full name"><input type="email" id="fv-e" placeholder="Email" aria-label="Email"><input type="tel" id="fv-p" placeholder="Phone" aria-label="Phone"><p class="fd-err" id="fd-err"></p><button class="fd-btn full" data-reg="' + postId + '">Register</button>');
}
function okModal(msg, sub) { $('#fd-mbody').innerHTML = '<div class="fd-ok"><div class="ck">✓</div><h3 id="fd-mt" style="margin:0 0 6px">' + msg + '</h3><p class="sub">' + (sub || '') + '</p><button class="fd-btn" data-close>Done</button></div>'; }

/* ================= 8. UPDATE-IN-PLACE (keeps scroll position & open panels) ================= */
function refreshCampaign(id) {
  $$('.fd-post').forEach(function (el) {
    const p = byId(Number(el.dataset.id)); if (p.campaignId !== id) return;
    const old = $('.fd-camp', el); if (old) old.outerHTML = progressHtml(p);
  });
  renderUrgent();
}
function sharePost(p, btn) {
  const old = $('.fd-share'); if (old) old.remove();
  const url = location.href.split('#')[0] + '#post-' + p.id, text = p.ngoName + ': ' + p.title.replace(/^[^\w₹]+/, '');
  const m = document.createElement('div'); m.className = 'fd-share'; m.setAttribute('role', 'menu');
  m.innerHTML = '<button data-copy>Copy Link</button><a target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(text + ' ' + url) + '">WhatsApp</a><a target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) + '">LinkedIn</a>';
  btn.parentNode.appendChild(m);
  m.querySelector('[data-copy]').onclick = function () {
    const done = function () { toast('Link copied!'); m.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fallback); else fallback();
    function fallback() { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Could not copy the link'); } t.remove(); }
  };
}

/* ================= 9. EVENTS ================= */
function onListClick(e) {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const el = b.closest('.fd-post'), p = byId(Number(el.dataset.id)), a = b.dataset.act;
  if (a !== 'share') { const s = $('.fd-share'); if (s) s.remove(); }
  if (a === 'like') {
    const on = !liked(p); if (on) likePost(p.id); else unlikePost(p.id);
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    b.innerHTML = (on ? 'Liked' : 'Like');
    $('[data-lc]', el).textContent = likeCount(p) + ' likes';
  } else if (a === 'comment') {
    S.openC[p.id] = !S.openC[p.id]; $('[data-cm]', el).innerHTML = S.openC[p.id] ? commentsHtml(p) : ''; b.setAttribute('aria-expanded', !!S.openC[p.id]);
    if (S.openC[p.id]) $('.fd-cform input', el).focus();
  } else if (a === 'post') {
    const i = $('.fd-cform input', el), t = i.value.trim(); if (!t) { i.focus(); return; }
    addComment(p.id, t); $('[data-cm]', el).innerHTML = commentsHtml(p); $('[data-cc]', el).textContent = commentCount(p) + ' comments'; $('.fd-cform input', el).focus();
  } else if (a === 'share') {
    if ($('.fd-share', el)) $('.fd-share', el).remove(); else sharePost(p, b);
  } else if (a === 'save') {
    const on = load(K.saved, []).indexOf(p.id) < 0; if (on) savePost(p.id); else unsavePost(p.id);
    if (S.view === 'saved' && !on) render(); else { b.classList.toggle('on', on); b.textContent = on ? 'Saved' : 'Save'; b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Remove from saved' : 'Save post'); }
    toast(on ? 'Saved to your list' : 'Removed from saved');
  } else if (a === 'follow') {
    const on = load(K.follow, []).indexOf(p.ngoId) < 0; if (on) followNGO(p.ngoId); else unfollowNGO(p.ngoId);
    if (S.view === 'following' && !on) render(); else $$('.fd-post').forEach(function (x) {
      if (byId(Number(x.dataset.id)).ngoId !== p.ngoId) return; const f = $('.fd-follow', x);
      f.classList.toggle('on', on); f.textContent = on ? '✓ Following' : '+ Follow'; f.setAttribute('aria-pressed', on);
    });
    toast(on ? 'Following ' + p.ngoName : 'Unfollowed ' + p.ngoName);
  } else if (a === 'det') {
    S.openD[p.id] = !S.openD[p.id]; $('.fd-camp', el).outerHTML = progressHtml(p);
  } else if (a === 'donate') donateModal(p.campaignId);
  else if (a === 'vol') volModal(p.id);
}
function onModalClick(e) {
  const t = e.target;
  if (t.closest('[data-close]')) return closeModal();
  const amt = t.closest('[data-amt]');
  if (amt) {
    $$('#fd-mbody [data-amt]').forEach(function (x) { x.classList.toggle('on', x === amt); });
    const c = $('#fd-custom'); c.hidden = amt.dataset.amt !== 'custom';
    if (amt.dataset.amt === 'custom') { amount = 0; c.focus(); } else amount = Number(amt.dataset.amt);
  }
  const pay = t.closest('[data-pay]');
  if (pay) {
    const c = $('#fd-custom'); if (!c.hidden) amount = Math.floor(Number(c.value));
    if (!(amount >= 1 && amount <= 1000000)) { $('#fd-err').textContent = 'Enter an amount between ₹1 and ₹10,00,000.'; return; }
    const id = Number(pay.dataset.pay), c2 = donateToCampaign(id, amount);
    refreshCampaign(id); okModal('✓ Contribution recorded', inr(amount) + ' added to ' + esc(c2.title) + '. Progress is now ' + c2.pct + '%.');
  }
  const reg = t.closest('[data-reg]');
  if (reg) {
    const n = $('#fv-n').value.trim(), m = $('#fv-e').value.trim(), ph = $('#fv-p').value.trim();
    if (!n || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m) || !/^[0-9+\-\s]{10,15}$/.test(ph)) { $('#fd-err').textContent = 'Enter your name, a valid email and a valid phone number.'; return; }
    const id = Number(reg.dataset.reg); registerVolunteer(id, { name: n, email: m, phone: ph });
    const btn = $('#post-' + id + ' [data-act="vol"]'); if (btn) { btn.disabled = true; btn.textContent = "✓ You're registered!"; }
    okModal("✓ You're registered!", 'The NGO will contact you with details.');
  }
}

function init() {
  const causes = {}, locs = {};
  feedPosts.forEach(function (p) { causes[p.cause] = 1; locs[p.location.split(',')[0]] = 1; });
  $('#fd-cause').insertAdjacentHTML('beforeend', Object.keys(causes).sort().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join(''));
  $('#fd-loc').insertAdjacentHTML('beforeend', Object.keys(locs).sort().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join(''));
  $('#fd-trending').innerHTML = trending.map(function (t) { return '<button data-cause="' + esc(t) + '">' + esc(t) + '</button>'; }).join('');
  $('#fd-list').addEventListener('click', onListClick);
  $('#fd-modal').addEventListener('click', onModalClick);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!$('#fd-modal').hidden) closeModal(); const s = $('.fd-share'); if (s) s.remove(); } });
  document.addEventListener('click', function (e) { if (!e.target.closest('.fd-share,[data-act="share"]')) { const s = $('.fd-share'); if (s) s.remove(); } });
  $('#fd-urgent').addEventListener('click', function (e) { const b = e.target.closest('[data-urgent]'); if (b) donateModal(Number(b.dataset.urgent)); });
  $('#fd-tabs').addEventListener('click', function (e) { const b = e.target.closest('[data-view]'); if (b) { S.view = b.dataset.view; render(); } });
  $('#fd-chips').addEventListener('click', function (e) { const b = e.target.closest('[data-type]'); if (b) { S.type = b.dataset.type; render(); } });
  $('#fd-menu').addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.view) S.view = b.dataset.view; else if (b.dataset.type) S.type = S.type === b.dataset.type ? 'all' : b.dataset.type; else if (b.dataset.cause) S.cause = S.cause === b.dataset.cause ? 'all' : b.dataset.cause;
    $('#fd-cause').value = S.cause; render();
  });
  $('#fd-trending').addEventListener('click', function (e) { const b = e.target.closest('[data-cause]'); if (b) { S.cause = b.dataset.cause; $('#fd-cause').value = S.cause; if (S.view !== 'foryou') S.view = 'foryou'; render(); $('#fd-main').scrollIntoView({ behavior: 'smooth' }); } });
  $('#fd-search').addEventListener('input', function (e) { S.q = e.target.value; render(); });
  $('#fd-cause').addEventListener('change', function (e) { S.cause = e.target.value; render(); });
  $('#fd-loc').addEventListener('change', function (e) { S.loc = e.target.value; render(); });
  $('#fd-sort').addEventListener('change', function (e) { S.sort = e.target.value; render(); });
  $('#fd-verified').addEventListener('change', function (e) { S.verified = e.target.checked; render(); });
  render();
  if (location.hash.indexOf('#post-') === 0) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
