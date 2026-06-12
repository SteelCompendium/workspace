/* ============================================================
   Steel Compendium — steel-feature-browser.js
   Client-side SEARCH · SORT · FILTER for the feature tree, plus the
   shared PREVIEW-CARD renderer used by the leaf index pages.

   Styling lives in steel-indexes.css (.sc-prev / .sc-browse …).

   TWO exports on window.SCBrowse:
     • card(item, opts)  → HTML string for one .sc-prev card.
                           Build-time (steel-etl) emits this exact markup
                           on leaf index pages; pass {context:false} there.
     • mount(rootEl)     → turns a container that holds a
                           <script type="application/json" class="sc-browse-data">
                           data island into a live filter surface.

   Item shape:
     { kind:"trait"|"ability", name, klass, level, href,
       flavor,                                  // 1-line summary / atmosphere
       // trait:
       action?, grants?, benefits?, tag?,        // action accents the spine
       // ability:
       action, cost, keywords?, distance?, targets? }
   ============================================================ */
(function () {
  "use strict";

  // action type → crest glyph (DrawSteelGlyphs) + eyebrow label. PLACEHOLDER
  // glyphs, same set as steel-ability-cards.js — swap in one place when the
  // official action glyphs arrive.
  var ACTIONS = {
    main:      { glyph: "l", label: "Main Action" },
    maneuver:  { glyph: "f", label: "Maneuver" },
    triggered: { glyph: ")", label: "Triggered Action" },
    move:      { glyph: "o", label: "Move Action" },
    none:      { glyph: "*", label: "No Action" },
    trait:     { glyph: "*", label: "Trait" }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // minimal **bold** for distance values ("Melee **1**")
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
  function ordinal(n) { return n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th"); }

  function metaCell(l, v, raw) {
    return '<span class="sc-prev__meta"><span class="l">' + esc(l) + '</span>' +
      '<span class="v">' + (raw ? v : esc(v)) + '</span></span>';
  }

  function traitCard(it, ctx) {
    var act = it.action || "trait";
    var eyebrow = ctx ? esc(it.klass) + " · Level " + it.level : esc(it.klass);
    var tag = it.tag
      ? '<div class="sc-prev__tag">' + esc(it.tag) + '</div>'
      : '<div class="sc-prev__tag">Level <span class="num">' + esc(it.level) + '</span></div>';
    var foot = "";
    var bits = [];
    if (it.grants) bits.push('<span class="sc-prev__grant"><span class="dot"></span>Grants ' + esc(it.grants) + '</span>');
    else if (it.benefits) bits.push(metaCell("benefits", String(it.benefits)));
    if (bits.length) foot = '<div class="sc-prev__foot">' + bits.join("") + "</div>";
    return '<a class="sc-prev sc-prev--trait sc-fil" data-action="' + esc(act) + '" href="' + esc(it.href || "#") + '">' +
      '<div class="sc-prev__head"><div class="sc-prev__titles">' +
        '<div class="sc-prev__eyebrow"><span class="sc-prev__dia"></span>' + eyebrow + '</div>' +
        '<h3 class="sc-prev__name">' + esc(it.name) + '</h3></div>' + tag + '</div>' +
      (it.flavor ? '<div class="sc-prev__flavor">' + esc(it.flavor) + '</div>' : "") +
      foot + '</a>';
  }

  function abilityCard(it, ctx) {
    var act = it.action || "main";
    var a = ACTIONS[act] || ACTIONS.main;
    var cost = it.cost || "";
    var costHTML = /^\d/.test(cost)
      ? cost.replace(/^(\d+)\s*/, '<span class="num">$1</span> ')
      : esc(cost);
    var tag = cost ? '<div class="sc-prev__tag">' + costHTML + '</div>' : "";
    var kw = (it.keywords && it.keywords.length)
      ? '<div class="sc-prev__kw">' + it.keywords.map(function (k) {
          return '<span class="sc-prev__chip">' + esc(k) + '</span>'; }).join("") + '</div>'
      : "";
    var foot = [];
    if (ctx) foot.push(metaCell("from", esc(it.klass) + " · Lv " + it.level, true));
    if (it.distance) foot.push(metaCell("distance", md(it.distance), true));
    if (it.targets) foot.push(metaCell("targets", it.targets));
    var footHTML = foot.length ? '<div class="sc-prev__foot">' + foot.join("") + "</div>" : "";
    return '<a class="sc-prev sc-prev--ability sc-fil" data-action="' + esc(act) + '" href="' + esc(it.href || "#") + '">' +
      '<div class="sc-prev__head">' +
        '<span class="sc-crest sc-prev__crest"><span class="sc-prev__glyph">' + esc(a.glyph) + '</span></span>' +
        '<div class="sc-prev__titles">' +
          '<div class="sc-prev__eyebrow"><span class="sc-prev__dia"></span>' + esc(a.label) + '</div>' +
          '<h3 class="sc-prev__name">' + esc(it.name) + '</h3></div>' + tag + '</div>' +
      (it.flavor ? '<div class="sc-prev__flavor">' + esc(it.flavor) + '</div>' : "") +
      kw + footHTML + '</a>';
  }

  function card(it, opts) {
    var ctx = !opts || opts.context !== false;       // default: show class·level context
    return it.kind === "ability" ? abilityCard(it, ctx) : traitCard(it, ctx);
  }

  /* ── facet definitions: which fields become chip rows ───────────────────── */
  function uniqueSorted(arr, items, key, num) {
    var seen = {};
    items.forEach(function (it) {
      var v = it[key];
      if (v == null) return;
      (Array.isArray(v) ? v : [v]).forEach(function (x) { seen[x] = true; });
    });
    var out = Object.keys(seen);
    out.sort(num ? function (a, b) { return a - b; } : function (a, b) { return a.localeCompare(b); });
    return out;
  }

  function mount(root) {
    var island = root.querySelector("script.sc-browse-data");
    if (!island) return;
    var items;
    try { items = JSON.parse(island.textContent); } catch (e) { return; }

    var facets = [
      { key: "kind",     label: "Type",    values: ["trait", "ability"], display: cap },
      { key: "klass",    label: "Class",   values: uniqueSorted(null, items, "klass") },
      { key: "level",    label: "Level",   values: uniqueSorted(null, items, "level", true), display: function (v) { return "Lv " + v; } },
      { key: "action",   label: "Action",  values: uniqueSorted(null, items, "action"), display: function (v) { return (ACTIONS[v] || {}).label || cap(v); }, dot: actionColor },
      { key: "keywords", label: "Keyword", values: uniqueSorted(null, items, "keywords") }
    ].filter(function (f) { return f.values.length > 1; });

    var state = { q: "", sort: "name", sel: {} };
    facets.forEach(function (f) { state.sel[f.key] = {}; });

    root.innerHTML =
      '<div class="sc-browse">' +
        '<div class="sc-browse__bar">' +
          '<div class="sc-browse__search">' + searchSvg() +
            '<input type="search" placeholder="Search features by name…" aria-label="Search features"></div>' +
          '<div class="sc-browse__sort"><label for="scbsort">Sort</label>' +
            '<select id="scbsort">' +
              '<option value="name">Name A–Z</option>' +
              '<option value="level">Level ↑</option>' +
              '<option value="level-desc">Level ↓</option>' +
              '<option value="class">Class</option>' +
            '</select></div>' +
        '</div>' +
        '<div class="sc-browse__facets">' + facets.map(facetRow).join("") + '</div>' +
        '<div class="sc-browse__head">' +
          '<span class="sc-browse__count"></span>' +
          '<button class="sc-browse__clear" hidden>Clear filters</button>' +
        '</div>' +
        '<div class="sc-browse__results"></div>' +
      '</div>';

    var elSearch = root.querySelector(".sc-browse__search input");
    var elSort = root.querySelector("#scbsort");
    var elCount = root.querySelector(".sc-browse__count");
    var elClear = root.querySelector(".sc-browse__clear");
    var elResults = root.querySelector(".sc-browse__results");

    elSearch.addEventListener("input", function () { state.q = this.value.trim().toLowerCase(); render(); });
    elSort.addEventListener("change", function () { state.sort = this.value; render(); });
    elClear.addEventListener("click", function () {
      state.q = ""; elSearch.value = "";
      facets.forEach(function (f) { state.sel[f.key] = {}; });
      root.querySelectorAll(".sc-chip.is-on").forEach(function (c) { c.classList.remove("is-on"); c.setAttribute("aria-pressed", "false"); });
      render();
    });
    root.querySelectorAll(".sc-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var k = chip.dataset.facet, v = chip.dataset.value;
        if (state.sel[k][v]) { delete state.sel[k][v]; chip.classList.remove("is-on"); chip.setAttribute("aria-pressed", "false"); }
        else { state.sel[k][v] = true; chip.classList.add("is-on"); chip.setAttribute("aria-pressed", "true"); }
        render();
      });
    });

    function matches(it) {
      if (state.q) {
        var hay = (it.name + " " + (it.flavor || "") + " " + (it.keywords || []).join(" ")).toLowerCase();
        if (hay.indexOf(state.q) === -1) return false;
      }
      for (var k in state.sel) {
        var picks = Object.keys(state.sel[k]);
        if (!picks.length) continue;
        var v = it[k];
        var has = Array.isArray(v)
          ? v.some(function (x) { return state.sel[k][x]; })
          : state.sel[k][String(v)];
        if (!has) return false;
      }
      return true;
    }

    function sortFn(a, b) {
      switch (state.sort) {
        case "level":      return (a.level - b.level) || a.name.localeCompare(b.name);
        case "level-desc": return (b.level - a.level) || a.name.localeCompare(b.name);
        case "class":      return (a.klass || "").localeCompare(b.klass || "") || (a.level - b.level) || a.name.localeCompare(b.name);
        default:           return a.name.localeCompare(b.name);
      }
    }

    function render() {
      var list = items.filter(matches).sort(sortFn);
      var any = facets.some(function (f) { return Object.keys(state.sel[f.key]).length; }) || state.q;
      elClear.hidden = !any;
      elCount.innerHTML = "<b>" + list.length + "</b> of " + items.length + " features";
      elResults.innerHTML = list.length
        ? '<div class="sc-prevs">' + list.map(function (it) { return card(it, { context: true }); }).join("") + "</div>"
        : '<div class="sc-browse__empty">No features match these filters.</div>';
    }
    render();
  }

  /* helpers for facet rendering */
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function actionColor(v) {
    return { main: "var(--sc-act-main)", maneuver: "var(--sc-act-maneuver)", triggered: "var(--sc-act-triggered)",
      move: "var(--sc-act-move)", none: "var(--sc-act-none)", trait: "var(--sc-act-trait)" }[v] || "var(--fx-metal)";
  }
  function facetRow(f) {
    var chips = f.values.map(function (v) {
      var dot = f.dot ? '<span class="sc-chip__dot" style="color:' + f.dot(v) + '"></span>' : "";
      var label = f.display ? f.display(v) : v;
      return '<button type="button" class="sc-chip" role="button" aria-pressed="false" data-facet="' + f.key + '" data-value="' + esc(v) + '">' +
        dot + esc(label) + '</button>';
    }).join("");
    return '<div class="sc-browse__facet"><span class="lbl">' + esc(f.label) + '</span>' + chips + '</div>';
  }
  function searchSvg() {
    return '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';
  }

  window.SCBrowse = { card: card, mount: mount, ACTIONS: ACTIONS };

  // auto-mount any data island on load
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  function init() {
    document.querySelectorAll(".sc-browse-mount").forEach(mount);
  }
})();
