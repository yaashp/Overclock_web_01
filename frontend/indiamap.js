/* =========================================================
   NEXORA - India NGO map (home page)
   Needs indiamap-shapes.js (NXMAP_SHAPES, NXMAP_VIEWBOX).
   Everything below runs on DEMO data. To go live, replace
   nxmapGetData() with a backend call that returns the same
   shape: { stateId: { verified, pending, campaigns } }.
   Totals match the "128 Verified NGOs / 54 Active campaigns"
   numbers shown in the stats strip on the home page.
   ========================================================= */

/* ---------- 1. DEMO DATA ---------- */

// [verified NGOs, pending verification, active campaigns]
const NXMAP_DEMO = {
  mh: [22, 4, 10], dl: [11, 2, 5], ka: [12, 2, 5], tn: [9, 1, 4], gj: [9, 2, 4],
  up: [8, 2, 3], wb: [6, 1, 3], rj: [6, 1, 3], kl: [5, 1, 3], tg: [6, 1, 3],
  ap: [4, 1, 2], mp: [4, 1, 2], pb: [3, 0, 1], hr: [3, 1, 1], br: [3, 1, 1],
  or: [3, 0, 1], jh: [2, 0, 1], ct: [2, 0, 0], as: [2, 1, 1], ut: [2, 0, 0],
  hp: [1, 0, 1], jk: [1, 0, 0], ga: [1, 0, 0], ch: [1, 0, 0], py: [1, 0, 0],
  sk: [1, 0, 0]
};

function nxmapGetData() {
  const data = {};
  NXMAP_SHAPES.forEach(function (s) {
    const row = NXMAP_DEMO[s.id] || [0, 0, 0];
    data[s.id] = { verified: row[0], pending: row[1], campaigns: row[2] };
  });
  return data;
}

/* ---------- 2. STATE ---------- */

const nxmap = {
  data: null, selected: "all", view: "map",
  fmt: new Intl.NumberFormat("en-IN")
};

function nxmapTotals(id) {
  if (id !== "all") return nxmap.data[id];
  return Object.keys(nxmap.data).reduce(function (t, k) {
    t.verified += nxmap.data[k].verified;
    t.pending += nxmap.data[k].pending;
    t.campaigns += nxmap.data[k].campaigns;
    return t;
  }, { verified: 0, pending: 0, campaigns: 0 });
}

// Type split is a demo estimate: about half Trusts, a third Societies, rest Section 8 companies
function nxmapTypes(total) {
  const trust = Math.round(total * 0.5), society = Math.round(total * 0.32);
  return [
    { label: "Trust", n: trust },
    { label: "Section 8 Company", n: Math.max(total - trust - society, 0) },
    { label: "Society", n: society }
  ];
}

function nxmapName(id) {
  if (id === "all") return "All India";
  return NXMAP_SHAPES.filter(function (s) { return s.id === id; })[0].name;
}

/* ---------- 3. HELPERS ---------- */

function nxmapEl(id) { return document.getElementById(id); }

// Shade by verified-NGO count: 0 is neutral, then light-to-dark green
function nxmapShade(n, max) {
  if (n === 0) return "#EFE6D5";
  const steps = ["#DCE6D2", "#BFD0B3", "#9DB790", "#78966F", "#4F7A5E", "#285943"];
  const i = Math.min(steps.length - 1, Math.floor((n / max) * steps.length));
  return steps[i];
}

function nxmapCountUp(el, to) {
  const from = parseInt(el.dataset.v || "0", 10);
  el.dataset.v = to;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || from === to) {
    el.textContent = nxmap.fmt.format(to); return;
  }
  const start = performance.now(), dur = 450;
  cancelAnimationFrame(el._raf);
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = nxmap.fmt.format(Math.round(from + (to - from) * e));
    if (p < 1) el._raf = requestAnimationFrame(tick);
  })(start);
}

/* ---------- 4. RENDERING ---------- */

function nxmapBuildMap() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = nxmapEl("nxmap-svg");
  svg.setAttribute("viewBox", NXMAP_VIEWBOX);
  const max = Math.max.apply(null, Object.keys(nxmap.data).map(function (k) { return nxmap.data[k].verified; }));
  NXMAP_SHAPES.forEach(function (s) {
    const p = document.createElementNS(ns, "path");
    const v = nxmap.data[s.id].verified;
    p.setAttribute("d", s.d);
    p.setAttribute("class", "nxmap-state");
    p.setAttribute("id", "nxmap-s-" + s.id);
    p.setAttribute("data-id", s.id);
    p.setAttribute("tabindex", "0");
    p.setAttribute("role", "button");
    p.setAttribute("aria-label", s.name + ": " + v + " verified NGOs");
    p.style.fill = nxmapShade(v, max);
    svg.appendChild(p);
  });
}

function nxmapRenderPanel() {
  const t = nxmapTotals(nxmap.selected);
  nxmapCountUp(nxmapEl("nxmap-verified"), t.verified);
  nxmapCountUp(nxmapEl("nxmap-campaigns"), t.campaigns);
  nxmapCountUp(nxmapEl("nxmap-pending"), t.pending);
  nxmapEl("nxmap-region").textContent = nxmapName(nxmap.selected);

  const total = t.verified + t.pending;
  nxmapEl("nxmap-types").innerHTML = nxmapTypes(total).map(function (x) {
    const pct = total ? (x.n / total * 100).toFixed(2) : "0.00";
    return '<div class="nxmap-type"><span class="nxmap-type-name">' + x.label + '</span>' +
           '<span class="nxmap-pill">' + nxmap.fmt.format(x.n) + '</span>' +
           '<span class="nxmap-pill">' + pct + ' %</span></div>';
  }).join("");
}

function nxmapRenderMapSelection() {
  const svg = nxmapEl("nxmap-svg");
  svg.querySelectorAll(".nxmap-state.is-selected").forEach(function (n) { n.classList.remove("is-selected"); });
  if (nxmap.selected !== "all") {
    const n = nxmapEl("nxmap-s-" + nxmap.selected);
    n.classList.add("is-selected");
    svg.appendChild(n); // draw on top so its outline is not hidden by neighbours
  }
}

function nxmapRenderTable() {
  const rows = NXMAP_SHAPES.slice().sort(function (a, b) {
    return nxmap.data[b.id].verified - nxmap.data[a.id].verified || a.name.localeCompare(b.name);
  });
  nxmapEl("nxmap-tbody").innerHTML = rows.map(function (s) {
    const d = nxmap.data[s.id];
    return '<tr data-id="' + s.id + '" tabindex="0"' + (s.id === nxmap.selected ? ' class="is-selected"' : '') + '>' +
      '<th scope="row">' + s.name + '</th><td>' + d.verified + '</td><td>' + d.pending + '</td><td>' + d.campaigns + '</td></tr>';
  }).join("");
}

function nxmapRenderAll() {
  nxmapRenderPanel();
  nxmapRenderMapSelection();
  nxmapRenderTable();
  nxmapEl("nxmap-select").value = nxmap.selected;
}

/* ---------- 5. INTERACTION ---------- */

function nxmapSelect(id) {
  nxmap.selected = (id === nxmap.selected && id !== "all") ? "all" : id; // click a selected state again to clear
  nxmapRenderAll();
}

function nxmapSetView(view) {
  nxmap.view = view;
  nxmapEl("nxmap-stage").hidden = view !== "map";
  nxmapEl("nxmap-tablewrap").hidden = view !== "table";
  nxmapEl("nxmap-show-map").setAttribute("aria-pressed", view === "map");
  nxmapEl("nxmap-show-table").setAttribute("aria-pressed", view === "table");
}

function nxmapTip(id, x, y) {
  const tip = nxmapEl("nxmap-tip"), stage = nxmapEl("nxmap-stage");
  const d = nxmap.data[id];
  tip.innerHTML = '<span class="nxmap-tip-k"><i></i>Indian States</span>' +
    nxmapName(id) + ": <b>" + d.verified + "</b> verified NGO" + (d.verified === 1 ? "" : "s");
  tip.hidden = false;
  const w = stage.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = Math.max(4, Math.min(x + 14, w - tw - 4)) + "px";
  tip.style.top = Math.max(4, y - th - 12) + "px";
}

function nxmapBind() {
  const svg = nxmapEl("nxmap-svg"), stage = nxmapEl("nxmap-stage"), tip = nxmapEl("nxmap-tip");
  const sel = nxmapEl("nxmap-select");

  sel.innerHTML = '<option value="all">All India</option>' + NXMAP_SHAPES.slice()
    .sort(function (a, b) { return a.name.localeCompare(b.name); })
    .map(function (s) { return '<option value="' + s.id + '">' + s.name + '</option>'; }).join("");
  sel.addEventListener("change", function () { nxmap.selected = sel.value; nxmapRenderAll(); });

  svg.addEventListener("mousemove", function (e) {
    const p = e.target.closest(".nxmap-state");
    if (!p) { tip.hidden = true; return; }
    const r = stage.getBoundingClientRect();
    nxmapTip(p.dataset.id, e.clientX - r.left, e.clientY - r.top);
  });
  svg.addEventListener("mouseleave", function () { tip.hidden = true; });
  svg.addEventListener("click", function (e) {
    const p = e.target.closest(".nxmap-state");
    if (p) nxmapSelect(p.dataset.id);
  });
  svg.addEventListener("focusin", function (e) {
    const p = e.target.closest(".nxmap-state");
    if (!p) return;
    const r = stage.getBoundingClientRect(), b = p.getBoundingClientRect();
    nxmapTip(p.dataset.id, b.left - r.left + b.width / 2, b.top - r.top + b.height / 2);
  });
  svg.addEventListener("focusout", function () { tip.hidden = true; });
  svg.addEventListener("keydown", function (e) {
    const p = e.target.closest(".nxmap-state");
    if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); nxmapSelect(p.dataset.id); }
  });

  nxmapEl("nxmap-show-map").addEventListener("click", function () { nxmapSetView("map"); });
  nxmapEl("nxmap-show-table").addEventListener("click", function () { nxmapSetView("table"); });
  nxmapEl("nxmap-reset").addEventListener("click", function () { nxmap.selected = "all"; nxmapRenderAll(); });

  const tb = nxmapEl("nxmap-tbody");
  tb.addEventListener("click", function (e) {
    const tr = e.target.closest("tr"); if (tr) nxmapSelect(tr.dataset.id);
  });
  tb.addEventListener("keydown", function (e) {
    const tr = e.target.closest("tr");
    if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); nxmapSelect(tr.dataset.id); }
  });
}

/* ---------- 6. START ---------- */

document.addEventListener("DOMContentLoaded", function () {
  if (!nxmapEl("nxmap-svg")) return;
  nxmap.data = nxmapGetData();
  nxmapBuildMap();
  nxmapBind();
  nxmapRenderAll();
});
