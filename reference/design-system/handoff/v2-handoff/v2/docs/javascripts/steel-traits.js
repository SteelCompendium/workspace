/* ============================================================
   Steel Compendium — steel-traits.js
   Renders a TRAIT / FEATURE into the illuminated codex niche styled
   by steel-traits.css, recursing into nested abilities (via
   window.SCAbility) and nested sub-traits.

   Two ways to use it (same as steel-ability-cards.js):
   1) Build-time (preferred): have steel-etl emit the `.sc-trait`
      HTML directly (see TRAITS.md for the target shape). No runtime JS.
   2) Runtime: drop a JSON island on the page and let this script
      replace it on load:
         <script type="application/json" class="sc-trait-data">
           { …trait json… }
         </script>
      Load AFTER steel-ability-cards.js (it calls SCAbility.render
      for nested ability blocks).

   window.SCTrait.render(data)        -> HTML string
   window.SCTrait.mount(target, data)
   ============================================================ */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  // inline emphasis in rules prose: **bold** and *italic*
  function rich(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
  }

  var DIA = '<span class="sc-trait__dia"></span>';

  // tag may be a string ("Signature", "Level 1", "1 Renown") or {value, unit}
  function renderTag(tag) {
    if (tag == null || tag === "") return "";
    var num = "", rest = "";
    if (typeof tag === "object") { num = tag.value != null ? String(tag.value) : ""; rest = tag.unit || ""; }
    else {
      var m = String(tag).match(/^\s*(\d+)\s+(.*)$/);
      if (m) { num = m[1]; rest = m[2]; } else { rest = String(tag); }
    }
    var inner = (num ? '<span class="num">' + esc(num) + "</span> " : "") + esc(rest);
    return '<div class="sc-trait__tag">' + inner + "</div>";
  }

  // body is an ordered array of blocks; render each, wrapping runs of
  // nested ability/trait blocks in a single .sc-trait__nest rail.
  function renderBody(blocks) {
    blocks = blocks || [];
    var out = "", i = 0;
    while (i < blocks.length) {
      var b = blocks[i] || {};
      var kind = (b.kind || "text").toLowerCase();

      if (kind === "ability" || kind === "trait") {
        // greedily collect a contiguous run of nestable blocks into one rail
        var nest = "";
        while (i < blocks.length) {
          var nb = blocks[i] || {};
          var nk = (nb.kind || "").toLowerCase();
          if (nk === "ability") {
            nest += (global.SCAbility
              ? global.SCAbility.render(Object.assign({ ops: false }, nb.data || nb))
              : '<div class="sc-ability">[ability]</div>');
          } else if (nk === "trait") {
            nest += render(nb.data || nb);
          } else break;
          i++;
        }
        out += '<div class="sc-trait__nest">' + nest + "</div>";
        continue;
      }

      switch (kind) {
        case "leadin":
          out += '<p class="sc-trait__leadin">' + DIA + rich(b.text) + "</p>";
          break;
        case "list":
          out += "<ul>" + (b.items || []).map(function (it) {
            return "<li>" + rich(it) + "</li>";
          }).join("") + "</ul>";
          break;
        case "segment":
        case "section": {
          var tone = b.tone ? ' data-tone="' + esc(b.tone) + '"' : "";
          out += '<div class="sc-trait__seg"' + tone + ">" +
                   '<div class="sc-trait__seg-head">' + DIA + '<span class="tag">' + esc(b.label) + "</span></div>" +
                   '<div class="sc-trait__seg-body"><p>' + rich(b.text) + "</p></div>" +
                 "</div>";
          break;
        }
        case "text":
        default:
          out += "<p>" + rich(b.text) + "</p>";
      }
      i++;
    }
    return out;
  }

  function render(data) {
    data = data || {};
    var act = (data.actionType || data.action || "trait").toLowerCase();
    var mods = "sc-trait" + (data.dropcap ? " sc-trait--lead" : "");

    var html = "";
    html += '<section class="' + mods + '" data-action="' + esc(act) + '">';

    html += '<header class="sc-trait__head">';
    html +=   '<div class="sc-trait__titles">';
    html +=     '<div class="sc-trait__eyebrow">' + DIA + esc(data.featureType || "Trait") + "</div>";
    html +=     '<h3 class="sc-trait__name">' + esc(data.name || "Unnamed Trait") + "</h3>";
    html +=   "</div>";
    html +=   renderTag(data.tag != null ? data.tag : data.cost);
    html += "</header>";

    html += '<div class="sc-trait__body">';
    if (data.flavor) html += '<p class="sc-trait__flavor">' + rich(data.flavor) + "</p>";
    // accept either `body` (array of blocks) or a plain `text` string
    if (data.body && data.body.length) html += renderBody(data.body);
    else if (data.text) html += "<p>" + rich(data.text) + "</p>";
    html += "</div>";

    html += "</section>";
    return html;
  }

  function mount(target, data) {
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return null;
    var tmp = document.createElement("div");
    tmp.innerHTML = render(data);
    var node = tmp.firstElementChild;
    el.replaceWith(node);
    return node;
  }

  function init() {
    var islands = document.querySelectorAll('script[type="application/json"].sc-trait-data');
    islands.forEach(function (s) {
      try { mount(s, JSON.parse(s.textContent)); }
      catch (err) { if (global.console) console.warn("[steel-trait] bad JSON island", err); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  global.SCTrait = { render: render, mount: mount };
})(window);
