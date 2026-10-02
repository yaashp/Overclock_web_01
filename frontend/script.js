/* =========================================================
   NEXORA - Module 1 script
   All function names start with "ngo".
   Everything runs on mock data. Replace the data functions
   (ngoGetPosts, ngoGetProfile, ngoGetStats) with backend
   calls later; the rendering code can stay as it is.
   ========================================================= */

/* ---------- 1. MOCK DATA ---------- */

const NGO_STATS = [
  { value: "128", label: "Verified NGOs" },
  { value: "54", label: "Active campaigns" },
  { value: "2,300", label: "Volunteers signed up" },
  { value: "9,800", label: "Contributions tracked" }
];

// Demo verification statuses. status: "verified" | "pending"
const NGO_PROFILES = {
  udaan: {
    name: "Udaan Education Foundation", initials: "UE", color: "#1f6f8b", verified: true,
    description: "Runs after-school classes and supplies school kits to children in Mumbai's low-income neighbourhoods.",
    location: "Mumbai, Maharashtra",
    darpan: { id: "MH/2019/0123456", status: "verified" },
    reg12a: { status: "verified" }, reg80g: { status: "verified" },
    totalCampaigns: 14, peopleImpacted: 6200
  },
  greenroots: {
    name: "GreenRoots Foundation", initials: "GR", color: "#2e7d4f", verified: true,
    description: "Plants and maintains native trees in city neighbourhoods. Volunteers water them for three years.",
    location: "Pune, Maharashtra",
    darpan: { id: "MH/2020/0234567", status: "verified" },
    reg12a: { status: "verified" }, reg80g: { status: "pending" },
    totalCampaigns: 9, peopleImpacted: 3100
  },
  swasthya: {
    name: "Swasthya Seva Trust", initials: "SS", color: "#a1443c", verified: true,
    description: "Organises free health camps and basic check-ups in villages around Nashik.",
    location: "Nashik, Maharashtra",
    darpan: { id: "MH/2017/0345678", status: "verified" },
    reg12a: { status: "verified" }, reg80g: { status: "verified" },
    totalCampaigns: 21, peopleImpacted: 15400
  },
  annapurna: {
    name: "Annapurna Meals Collective", initials: "AM", color: "#b4690e", verified: true,
    description: "Cooks and delivers daily meals to hospital waiting areas and shelters.",
    location: "Mumbai, Maharashtra",
    darpan: { id: "MH/2018/0456789", status: "verified" },
    reg12a: { status: "verified" }, reg80g: { status: "verified" },
    totalCampaigns: 17, peopleImpacted: 48000
  },
  jaldhara: {
    name: "Jaldhara Water Project", initials: "JW", color: "#0f5c3a", verified: false,
    description: "Builds small check dams and repairs hand pumps in drought-hit villages.",
    location: "Nashik, Maharashtra",
    darpan: { id: "Not submitted", status: "pending" },
    reg12a: { status: "pending" }, reg80g: { status: "pending" },
    totalCampaigns: 3, peopleImpacted: 900
  },
  sakhi: {
    name: "Sakhi Skills Centre", initials: "SK", color: "#7a4a8c", verified: true,
    description: "Teaches tailoring and basic accounting to women so they can earn their own income.",
    location: "Pune, Maharashtra",
    darpan: { id: "MH/2021/0567890", status: "verified" },
    reg12a: { status: "verified" }, reg80g: { status: "pending" },
    totalCampaigns: 6, peopleImpacted: 1250
  }
};

// urgency: "high" | "medium" | "low". hoursAgo is used for "Newest first".
const NGO_POSTS = [
  { id: 1, ngoId: "udaan", hoursAgo: 3, tone: 1, urgency: "high", cause: "Education",
    imageText: "500 school kits for children",
    caption: "Term starts in two weeks. 340 kits are packed. 160 children still have no bag, books or pencils.",
    impact: "Helps 500 children in 12 Mumbai schools", raised: 170000, goal: 250000 },
  { id: 2, ngoId: "greenroots", hoursAgo: 8, tone: 2, urgency: "medium", cause: "Environment",
    imageText: "Urban tree plantation",
    caption: "We planted 800 saplings along the Baner roadside last weekend. 1,200 more are waiting for volunteers and funds.",
    impact: "2,000 native trees across 6 Pune wards", raised: 96000, goal: 200000 },
  { id: 3, ngoId: "swasthya", hoursAgo: 20, tone: 6, urgency: "high", cause: "Healthcare",
    imageText: "Free health camp",
    caption: "Free check-ups for eyes, blood pressure and diabetes. Doctors are booked. We need money for medicines and tests.",
    impact: "Expected to reach 1,500 villagers", raised: 54000, goal: 120000 },
  { id: 4, ngoId: "annapurna", hoursAgo: 30, tone: 3, urgency: "low", cause: "Food",
    imageText: "Daily meals for families",
    caption: "₹60 pays for one hot meal. This month's kitchen crew served 11,400 of them. Help keep the stove on.",
    impact: "400 meals a day at 5 hospitals", raised: 310000, goal: 400000 },
  { id: 5, ngoId: "jaldhara", hoursAgo: 52, tone: 5, urgency: "medium", cause: "Water",
    imageText: "Hand pump repair drive",
    caption: "Eleven hand pumps in Dindori stopped working. A repair costs ₹8,000 each. Villagers walk 4 km for water.",
    impact: "Restores water for about 900 people", raised: 22000, goal: 88000 },
  { id: 6, ngoId: "sakhi", hoursAgo: 75, tone: 4, urgency: "low", cause: "Livelihood",
    imageText: "Sewing machines for 30 women",
    caption: "Our 3-month tailoring course ends soon. Graduates need a machine each to start earning at home.",
    impact: "30 women, each earning from home", raised: 105000, goal: 150000 }
];

/* ---------- 2. DATA ACCESS (swap with backend later) ---------- */

function ngoGetPosts() { return NGO_POSTS; }
function ngoGetProfile(ngoId) { return NGO_PROFILES[ngoId]; }
function ngoGetStats() { return NGO_STATS; }

/* ---------- 3. SMALL HELPERS ---------- */

// Tracks which posts the user liked/saved (in memory only)
const ngoUserState = { liked: new Set(), saved: new Set() };

function ngoEl(id) { return document.getElementById(id); }

function ngoFormatMoney(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

function ngoFormatTime(hoursAgo) {
  if (hoursAgo < 24) return hoursAgo + "h ago";
  return Math.floor(hoursAgo / 24) + "d ago";
}

function ngoUrgencyLabel(urgency) {
  return { high: "Urgent", medium: "Moderate", low: "Ongoing" }[urgency];
}

function ngoShowToast(message) {
  const toast = ngoEl("ngo-toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(ngoShowToast.timer);
  ngoShowToast.timer = setTimeout(function () { toast.hidden = true; }, 2200);
}

/* ---------- 4. RENDERING ---------- */

function ngoRenderStats() {
  if (!ngoEl("ngo-stats-grid")) return;
  ngoEl("ngo-stats-grid").innerHTML = ngoGetStats().map(function (stat) {
    return '<div class="ngo-stat"><span class="ngo-stat-value">' + stat.value +
           '</span><span class="ngo-stat-label">' + stat.label + "</span></div>";
  }).join("");
}

function ngoBuildPostHtml(post) {
  const ngo = ngoGetProfile(post.ngoId);
  const percent = Math.round((post.raised / post.goal) * 100);
  const liked = ngoUserState.liked.has(post.id);
  const saved = ngoUserState.saved.has(post.id);
  const badge = ngo.verified
    ? '<span class="ngo-verified">Verified</span>'
    : '<span class="ngo-verified ngo-unverified">Unverified</span>';

  return '' +
  '<article class="ngo-card ngo-post" data-ngo-post-id="' + post.id + '">' +
    '<div class="ngo-post-head">' +
      '<button class="ngo-open-profile" data-ngo-action="profile" data-ngo-id="' + post.ngoId + '" aria-label="Open profile of ' + ngo.name + '">' +
        '<span class="ngo-avatar ngo-avatar-' + post.ngoId + '">' + ngo.initials + '</span>' +
        '<span class="ngo-post-who">' +
          '<span class="ngo-post-name">' + ngo.name + ' ' + badge + '</span>' +
          '<span class="ngo-post-meta">' + ngo.location.split(",")[0] + ' - ' + ngoFormatTime(post.hoursAgo) + '</span>' +
        '</span>' +
      '</button>' +
    '</div>' +
    '<div class="ngo-post-image ngo-tone-' + post.tone + '">' +
      '<span class="ngo-urgency-tag">' + ngoUrgencyLabel(post.urgency) + '</span>' +
      '<span class="ngo-post-image-text">' + post.imageText + '</span>' +
    '</div>' +
    '<div class="ngo-post-body">' +
      '<span class="ngo-cause-tag">' + post.cause + '</span>' +
      '<p class="ngo-post-caption">' + post.caption + '</p>' +
      '<p class="ngo-impact-line">' + post.impact + '</p>' +
      '<div>' +
        '<div class="ngo-progress" role="progressbar" aria-valuenow="' + percent + '" aria-valuemin="0" aria-valuemax="100">' +
          '<div class="ngo-progress-fill" data-ngo-width="' + percent + '"></div>' +
        '</div>' +
        '<div class="ngo-progress-meta"><span>' + ngoFormatMoney(post.raised) + ' raised</span><span>' + percent + '% of ' + ngoFormatMoney(post.goal) + '</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="ngo-post-actions">' +
      '<button class="ngo-icon-btn' + (liked ? ' ngo-is-active' : '') + '" data-ngo-action="like" aria-pressed="' + liked + '">' + (liked ? 'Liked' : 'Like') + '</button>' +
      '<button class="ngo-icon-btn" data-ngo-action="share">Share</button>' +
      '<button class="ngo-icon-btn ngo-icon-btn-save' + (saved ? ' ngo-is-active' : '') + '" data-ngo-action="save" aria-pressed="' + saved + '">' + (saved ? 'Saved' : 'Save') + '</button>' +
    '</div>' +
    '<div class="ngo-post-cta">' +
      '<button class="ngo-btn ngo-btn-primary" data-ngo-action="donate">Donate</button>' +
      '<button class="ngo-btn ngo-btn-outline" data-ngo-action="volunteer">Volunteer</button>' +
    '</div>' +
  '</article>';
}

// Draws the posts it is given, then sets progress bar widths from data attributes
function ngoRenderPosts(posts) {
  const feed = ngoEl("ngo-feed");
  feed.innerHTML = posts.map(ngoBuildPostHtml).join("");
  feed.querySelectorAll("[data-ngo-width]").forEach(function (bar) {
    bar.style.width = bar.getAttribute("data-ngo-width") + "%";
  });
  ngoEl("ngo-empty").hidden = posts.length > 0;
  ngoEl("ngo-feed-count").textContent = posts.length + (posts.length === 1 ? " campaign" : " campaigns") + " shown";
}

// Fills the location and cause dropdowns from the data
function ngoFillFilterOptions() {
  const locations = new Set();
  const causes = new Set();
  ngoGetPosts().forEach(function (post) {
    locations.add(ngoGetProfile(post.ngoId).location.split(",")[0]);
    causes.add(post.cause);
  });
  function addOptions(selectId, values) {
    const select = ngoEl(selectId);
    Array.from(values).sort().forEach(function (value) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }
  addOptions("ngo-location-filter", locations);
  addOptions("ngo-cause-filter", causes);
}

/* ---------- 5. FILTERING + SORTING ---------- */

function ngoFilterPosts() {
  const query = ngoEl("ngo-search-input").value.trim().toLowerCase();
  const location = ngoEl("ngo-location-filter").value;
  const cause = ngoEl("ngo-cause-filter").value;
  const urgency = ngoEl("ngo-urgency-filter").value;
  const verifiedOnly = ngoEl("ngo-verified-toggle").checked;
  const sortBy = ngoEl("ngo-sort-select").value;

  const results = ngoGetPosts().filter(function (post) {
    const ngo = ngoGetProfile(post.ngoId);
    const searchable = (ngo.name + " " + post.cause + " " + post.caption + " " + post.imageText + " " + ngo.location).toLowerCase();
    if (query && searchable.indexOf(query) === -1) return false;
    if (location !== "all" && ngo.location.split(",")[0] !== location) return false;
    if (cause !== "all" && post.cause !== cause) return false;
    if (urgency !== "all" && post.urgency !== urgency) return false;
    if (verifiedOnly && !ngo.verified) return false;
    return true;
  });

  ngoSortPosts(results, sortBy);
  ngoRenderPosts(results);
}

function ngoSortPosts(posts, sortBy) {
  const urgencyRank = { high: 0, medium: 1, low: 2 };
  posts.sort(function (a, b) {
    if (sortBy === "funded") return (b.raised / b.goal) - (a.raised / a.goal);
    if (sortBy === "urgent") return urgencyRank[a.urgency] - urgencyRank[b.urgency];
    return a.hoursAgo - b.hoursAgo; // newest first
  });
}

/* ---------- 6. POST INTERACTIONS ---------- */

function ngoToggleInSet(set, id) {
  if (set.has(id)) { set.delete(id); } else { set.add(id); }
}

function ngoToggleLike(postId, button) {
  ngoToggleInSet(ngoUserState.liked, postId);
  const on = ngoUserState.liked.has(postId);
  button.classList.toggle("ngo-is-active", on);
  button.setAttribute("aria-pressed", String(on));
  button.textContent = on ? "Liked" : "Like";
}

function ngoToggleSave(postId, button) {
  ngoToggleInSet(ngoUserState.saved, postId);
  const on = ngoUserState.saved.has(postId);
  button.classList.toggle("ngo-is-active", on);
  button.setAttribute("aria-pressed", String(on));
  button.textContent = on ? "Saved" : "Save";
  ngoShowToast(on ? "Saved to your list" : "Removed from your list");
}

function ngoSharePost(postId) {
  const post = ngoGetPosts().find(function (p) { return p.id === postId; });
  const text = ngoGetProfile(post.ngoId).name + ": " + post.imageText;
  if (navigator.share) {
    navigator.share({ title: "NEXORA", text: text }).catch(function () {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function () { ngoShowToast("Copied to clipboard"); });
  } else {
    ngoShowToast("Sharing is not supported in this browser");
  }
}

// One click listener for every button in the feed (event delegation)
function ngoHandleFeedClick(event) {
  const button = event.target.closest("[data-ngo-action]");
  if (!button) return;
  const postEl = button.closest("[data-ngo-post-id]");
  const postId = postEl ? Number(postEl.getAttribute("data-ngo-post-id")) : null;
  const action = button.getAttribute("data-ngo-action");

  if (action === "like") ngoToggleLike(postId, button);
  else if (action === "save") ngoToggleSave(postId, button);
  else if (action === "share") ngoSharePost(postId);
  else if (action === "donate") ngoOpenModal("ngo-donate-modal");
  else if (action === "volunteer") ngoOpenModal("ngo-volunteer-modal");
  else if (action === "profile") ngoOpenProfile(button.getAttribute("data-ngo-id"));
}

/* ---------- 7. MODALS ---------- */

let ngoLastFocused = null;

function ngoOpenModal(modalId) {
  ngoLastFocused = document.activeElement;
  const modal = ngoEl(modalId);
  modal.hidden = false;
  const close = modal.querySelector(".ngo-modal-close");
  if (close) close.focus();
}

function ngoCloseModal(modal) {
  modal.hidden = true;
  if (ngoLastFocused) ngoLastFocused.focus();
}

function ngoCloseAllModals() {
  document.querySelectorAll(".ngo-modal").forEach(function (modal) { modal.hidden = true; });
}

function ngoStatusRow(label, text, status) {
  const cls = status === "verified" ? "ngo-status-ok" : "ngo-status-pending";
  const word = status === "verified" ? "Verified (demo)" : "Pending (demo)";
  return '<li><span>' + label + (text ? " - " + text : "") + '</span><span class="' + cls + '">' + word + '</span></li>';
}

function ngoOpenProfile(ngoId) {
  const ngo = ngoGetProfile(ngoId);
  const avatar = ngoEl("ngo-profile-avatar");
  avatar.textContent = ngo.initials;
  avatar.className = "ngo-avatar ngo-avatar-lg ngo-avatar-" + ngoId;
  ngoEl("ngo-profile-name").textContent = ngo.name;
  const badge = ngoEl("ngo-profile-badge");
  badge.textContent = ngo.verified ? "Verified" : "Unverified";
  badge.classList.toggle("ngo-unverified", !ngo.verified);
  ngoEl("ngo-profile-desc").textContent = ngo.description;
  ngoEl("ngo-profile-location").textContent = ngo.location;
  ngoEl("ngo-profile-statuses").innerHTML =
    ngoStatusRow("Darpan ID", ngo.darpan.id, ngo.darpan.status) +
    ngoStatusRow("12A", "", ngo.reg12a.status) +
    ngoStatusRow("80G", "", ngo.reg80g.status);
  ngoEl("ngo-profile-campaigns").textContent = ngo.totalCampaigns;
  ngoEl("ngo-profile-impacted").textContent = ngo.peopleImpacted.toLocaleString("en-IN");
  ngoEl("ngo-view-full-profile").setAttribute("data-ngo-id", ngoId);
  ngoOpenModal("ngo-profile-modal");
}

function ngoInitModals() {
  // Any element with data-ngo-close closes the modal it sits in
  document.addEventListener("click", function (event) {
    const closer = event.target.closest("[data-ngo-close]");
    if (closer) ngoCloseModal(closer.closest(".ngo-modal"));
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") ngoCloseAllModals();
  });
  // The full profile page belongs to another module, so this is a placeholder
  ngoEl("ngo-view-full-profile").addEventListener("click", function () {
    location.href = "ngoprofile.html?id=" + ngoEl("ngo-view-full-profile").getAttribute("data-ngo-id");
  });
}

/* ---------- 8. NAVIGATION ---------- */

function ngoInitMobileNav() {
  const toggle = ngoEl("ngo-nav-toggle");
  const sideMenu = ngoEl("ngo-side-menu");
  const overlay = ngoEl("ngo-menu-overlay");
  const close = ngoEl("ngo-side-menu-close");

  function setMenu(open) {
    sideMenu.classList.toggle("ngo-menu-open", open);
    overlay.classList.toggle("ngo-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }

  toggle.addEventListener("click", function () { setMenu(true); });
  close.addEventListener("click", function () { setMenu(false); });
  overlay.addEventListener("click", function () { setMenu(false); });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  sideMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });
}

function ngoInitSmoothScroll() {
  document.querySelectorAll("[data-ngo-scroll]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // close the mobile menu after choosing a link
      ngoEl("ngo-nav-panel").classList.remove("ngo-is-open");
      ngoEl("ngo-nav-toggle").setAttribute("aria-expanded", "false");
    });
  });
}

function ngoInitAuthButtons() {
  ngoEl("ngo-getstarted-btn").addEventListener("click", function () { location.href = "campaign.html"; });
  // Profile button: handled in shell.js (goes to login.html or the role dashboard)
}

/* ---------- 9. START-UP ---------- */

function ngoInitFilters() {
  ["ngo-search-input"].forEach(function (id) { ngoEl(id).addEventListener("input", ngoFilterPosts); });
  ["ngo-location-filter", "ngo-cause-filter", "ngo-urgency-filter", "ngo-sort-select", "ngo-verified-toggle"]
    .forEach(function (id) { ngoEl(id).addEventListener("change", ngoFilterPosts); });
}

function ngoInit() {
  ngoRenderStats();
  if (!ngoEl("ngo-feed")) return;
  ngoFillFilterOptions();
  ngoFilterPosts(); // first draw
  ngoInitFilters();
  ngoEl("ngo-feed").addEventListener("click", ngoHandleFeedClick);
  ngoInitModals();
}

document.addEventListener("DOMContentLoaded", function () { ngoInit(); });
