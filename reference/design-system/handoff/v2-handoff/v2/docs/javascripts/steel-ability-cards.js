/* ============================================================
   Steel Compendium — steel-ability-cards.js
   Renders an ability/trait into the high-fantasy steel card
   styled by steel-ability-cards.css.

   Two ways to use it:
   1) Build-time (preferred, matches the index cards): have steel-etl
      emit the `.sc-ability` HTML directly (see ABILITY-CARDS.md).
      You then DON'T need this file at runtime — it's only the
      reference for the exact shape + the action/glyph mapping.
   2) Runtime: drop a JSON "island" in the page and let this script
      replace it on load:
         <script type="application/json" class="sc-ability-data">
           { …ability json… }
         </script>
      Add to mkdocs.yml `extra_javascript` AFTER the existing
      ability-cards.js (which only badges power-roll tiers — this
      file owns the whole card, so disable that on pages that use
      these cards to avoid double-badging).

   window.SCAbility.render(data)  -> HTML string
   window.SCAbility.mount(target, data)
   ============================================================ */
(function (global) {
  "use strict";

  /* ── ACTION TYPE → label · accent · crest glyph ──────────────
     glyph values are DrawSteelGlyphs codepoints. They are PLACEHOLDERS
     (the nearest sensible mark in the bundled font) until the official
     action glyphs land — swap them in ONE place, right here. */
  var ACTIONS = {
    main:      { label: "Main Action",      glyph: "l" }, // crossed swords  (PLACEHOLDER)
    maneuver:  { label: "Maneuver",         glyph: "f" }, // figure          (PLACEHOLDER)
    triggered: { label: "Triggered Action", glyph: ")" }, // alert           (PLACEHOLDER)
    move:      { label: "Move Action",      glyph: "o" }, // ruler           (PLACEHOLDER)
    none:      { label: "No Action",        glyph: "*" }, // star            (PLACEHOLDER)
    trait:     { label: "Trait",            glyph: "*" }  // star            (PLACEHOLDER)
  };

  var TIER_KEYS = ["low", "mid", "high"];
  var TIER_GLYPH = { low: "!", mid: "@", high: "#" }; // DrawSteelGlyphs ≤11 / 12–16 / 17+

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  // allow a tiny bit of inline emphasis in rules text: **bold**
  function rich(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  }

  // cost may be a string ("Signature", "3 Piety", "5 Insight") or {value, unit}
  function renderCost(cost) {
    if (!cost) return "";
    var num = "", rest = "";
    if (typeof cost === "object") { num = cost.value != null ? String(cost.value) : ""; rest = cost.unit || ""; }
    else {
      var m = String(cost).match(/^\s*(\d+)\s+(.*)$/);
      if (m) { num = m[1]; rest = m[2]; } else { rest = String(cost); }
    }
    var inner = (num ? '<span class="num">' + esc(num) + "</span> " : "") + esc(rest);
    return '<div class="sc-ability__cost">' + inner + "</div>";
  }

  var OPS_HTML =
    '<div class="sc-ability__ops">' +
      '<span class="sc-ability__op" title="Copy permalink"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></svg></span>' +
      '<span class="sc-ability__op" title="Save"><svg viewBox="0 0 24 24"><path d="M5 4h14v17l-7-4-7 4z"/></svg></span>' +
    "</div>";

  function render(data) {
    data = data || {};
    var actKey = (data.actionType || "main").toLowerCase();
    var act = ACTIONS[actKey] || ACTIONS.main;
    var dia = '<span class="sc-ability__dia"></span>';
    var html = "";

    html += '<article class="sc-ability sc-fil" data-action="' + esc(actKey) + '">';

    /* head: crest · titles · corner(cost + ops) */
    html += '<div class="sc-ability__head">';
    html +=   '<span class="sc-crest sc-ability__crest"><span class="sc-ability__glyph">' + esc(act.glyph) + "</span></span>";
    html +=   '<div class="sc-ability__titles">';
    html +=     '<div class="sc-ability__eyebrow">' + dia + esc(data.actionLabel || act.label) + "</div>";
    html +=     '<h3 class="sc-ability__name">' + esc(data.name || "Unnamed Ability") + "</h3>";
    html +=   "</div>";
    html +=   '<div class="sc-ability__corner">' + renderCost(data.cost) + (data.ops === false ? "" : OPS_HTML) + "</div>";
    html += "</div>";

    if (data.flavor) html += '<p class="sc-ability__flavor">' + esc(data.flavor) + "</p>";

    if (data.keywords && data.keywords.length) {
      html += '<div class="sc-ability__kw">' +
        data.keywords.map(function (k) { return '<span class="sc-ability__chip">' + esc(k) + "</span>"; }).join("") +
        "</div>";
    }

    if (data.distance || data.target || data.targets) {
      html += '<div class="sc-ability__rail">';
      html +=   '<div class="sc-ability__cell"><div class="l">Distance</div><div class="v">' + rich(data.distance || "—") + "</div></div>";
      html +=   '<div class="sc-ability__cell"><div class="l">Targets</div><div class="v">' + rich(data.targets || data.target || "—") + "</div></div>";
      html += "</div>";
    }

    var pr = data.powerRoll;
    if (pr) {
      html += '<div class="sc-ability__pr">';
      html +=   '<div class="sc-ability__pr-head">' + dia +
                  '<span class="pre">Power Roll +</span>' +
                  '<span class="chars">' + esc(pr.characteristic || pr.characteristics || "") + "</span></div>";
      html +=   '<div class="sc-ability__pr-rows">';
      TIER_KEYS.forEach(function (t) {
        if (pr.tiers && pr.tiers[t] != null) {
          html += '<div class="sc-ability__tier" data-tier="' + t + '">' +
                    '<span class="badge">' + TIER_GLYPH[t] + "</span>" +
                    '<span class="res">' + rich(pr.tiers[t]) + "</span></div>";
        }
      });
      html +=   "</div>";
      html += "</div>";
    }

    // sections: [{label:"Trigger"|"Effect"|…, text:"…"}]
    (data.sections || []).forEach(function (sec) {
      html += '<div class="sc-ability__section">' +
                '<div class="sc-ability__section-head">' + dia + '<span class="tag">' + esc(sec.label) + "</span></div>" +
                '<div class="sc-ability__section-body"><p>' + rich(sec.text) + "</p></div>" +
              "</div>";
    });

    // enhancements: [{cost:"2 Piety", text:"…"}]
    (data.enhancements || []).forEach(function (e) {
      html += '<div class="sc-ability__enh"><span class="cost">' + esc(e.cost) + '</span>' +
                '<span class="txt">' + rich(e.text) + "</span></div>";
    });

    html += "</article>";
    return html;
  }

  function mount(target, data) {
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return null;
    var tmp = document.createElement("div");
    tmp.innerHTML = render(data);
    var card = tmp.firstElementChild;
    el.replaceWith(card);
    return card;
  }

  // Auto-enhance JSON islands on load
  function init() {
    var islands = document.querySelectorAll('script[type="application/json"].sc-ability-data');
    islands.forEach(function (s) {
      try { mount(s, JSON.parse(s.textContent)); }
      catch (err) { if (global.console) console.warn("[steel-ability] bad JSON island", err); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  global.SCAbility = { render: render, mount: mount, ACTIONS: ACTIONS };
})(window);
