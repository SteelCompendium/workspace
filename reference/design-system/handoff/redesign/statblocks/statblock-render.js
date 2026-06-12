/* ============================================================
   statblock-render.js — renders a creature into ONE semantic DOM.
   Feature internals use the site's .sc-ability grammar (crest /
   eyebrow / cost badge / rail / power-roll / sections / enhancement)
   so a statblock feature looks identical to a standalone ability.
   The statblock-specific zones (header, defenses, 2×2 secondary
   stats, characteristics, Malice + Villain bands, sticky) are sb__*
   and reflow between layouts via data-attributes on the container.
   ============================================================ */
(function (root) {
  "use strict";

  /* action → crest glyph (DrawSteelGlyphs; placeholders, same as the
     ability-card renderer) + eyebrow label */
  var ACT = {
    main:      { glyph: "l", label: "Main Action" },
    maneuver:  { glyph: "f", label: "Maneuver" },
    triggered: { glyph: ")", label: "Triggered Action" },
    move:      { glyph: "o", label: "Move Action" },
    passive:   { glyph: "*", label: "Trait" },
    villain:   { glyph: "*", label: "Villain Action" },
    malice:    { glyph: "*", label: "Malice" }
  };
  var TIER_GLYPH = { low: "!", mid: "@", high: "#" }; // ≤11 / 12–16 / 17+

  /* glossary terms → rules links (the augmentation). Longer phrases first. */
  var TERMS = [
    ["Presence test", "test", "Characteristic test — roll 2d10 + the characteristic."],
    ["damage weakness", "term", "Take that much extra damage of the listed type."],
    ["double bane", "term", "Two banes — drop the power roll two outcome bands."],
    ["free strike", "strike", "A signature-or-melee strike made outside your turn."],
    ["save ends", "save", "Repeat the saving throw at the end of each turn to end it."],
    ["charmed", "cond", "Condition — treats the source as an ally."],
    ["taunted", "cond", "Condition — a bane unless your strike targets the taunter."],
    ["hidden", "cond", "Out of sight of enemies — strikes against you take a bane."],
    ["teleport", "term", "Move to a space without crossing the intervening distance."],
    ["edge", "term", "A small bonus — raise the power roll one outcome band."],
    ["bane", "term", "A small penalty — drop the power roll one outcome band."],
    ["shift", "term", "Move without triggering free strikes."],
    ["Malice", "res", "The Director's shared resource, spent on villain powers."]
  ];
  var TERM_RE = new RegExp("(" + TERMS.map(function (t) {
    return t[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("|") + ")", "g");
  var TLOOK = {};
  TERMS.forEach(function (t) { TLOOK[t[0].toLowerCase()] = t; });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // esc + glossary links (first occurrence each) + **bold**
  function rich(text, seen) {
    seen = seen || {};
    var out = esc(text).replace(TERM_RE, function (m) {
      var def = TLOOK[m.toLowerCase()];
      if (!def || seen[m.toLowerCase()]) return m;
      seen[m.toLowerCase()] = true;
      return '<a class="sb-term" data-cat="' + def[1] + '" href="#" title="' +
        esc(def[2]) + '" onclick="return false">' + m + "</a>";
    });
    return out.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  }
  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // cost badge — number gets the mono .num treatment
  function costBadge(cost) {
    if (!cost) return "";
    var m = String(cost).match(/^\s*(\d+)\s+(.*)$/);
    var inner = m ? '<span class="num">' + esc(m[1]) + "</span> " + esc(m[2]) : esc(cost);
    return '<div class="sc-ability__cost">' + inner + "</div>";
  }

  /* a single spec field (keywords / usage / distance / target) — one DOM,
     CSS reflows it between text · grid · ledger · (chips for crest kw) */
  function specField(mod, label, valueHTML) {
    return '<div class="sb__field sb__field--' + mod + '">' +
      '<span class="sb__field-l">' + esc(label) + '</span>' +
      '<span class="sb__field-v">' + valueHTML + "</span></div>";
  }

  /* one feature → flattened steel feature article. The head shows EITHER a
     crest (data-sb-kwusage=crest) or an inline icon; the keyword+usage and
     distance+target blocks each reflow independently via data-sb-* attrs. */
  function renderFeature(f) {
    var seen = {};
    var a = ACT[f.action] || ACT.passive;
    var dia = '<span class="sc-ability__dia"></span>';
    var p = ['<article class="sc-ability sb__feat" data-action="' + esc(f.action) +
      '" data-kind="' + esc(f.kind) + '">'];

    // head: crest OR inline icon · (eyebrow=usage) name · cost
    p.push('<div class="sb__feat-head">');
    p.push('<span class="sc-crest sb__feat-crest"><span class="sb__feat-glyph">' + a.glyph + "</span></span>");
    p.push('<span class="sb__feat-icon"><span class="sb__feat-glyph">' + a.glyph + "</span></span>");
    p.push('<div class="sb__feat-titles">');
    if (f.usage) p.push('<div class="sb__feat-eyebrow">' + dia + esc(f.usage) + "</div>");
    p.push('<h3 class="sb__feat-name sc-ability__name">' + esc(f.name) + "</h3>");
    p.push("</div>");
    p.push('<div class="sb__feat-corner">' + costBadge(f.cost) + "</div>");
    p.push("</div>");

    // passive / malice → plain body paragraph, done
    if (f.body) {
      p.push('<p class="sb__feat-body">' + rich(f.body, seen) + "</p>");
      p.push("</article>");
      return p.join("");
    }

    // keyword + usage block (independent style: crest|text|grid|ledger)
    if ((f.keywords && f.keywords.length) || f.usage) {
      p.push('<div class="sb__ku">');
      if (f.keywords && f.keywords.length) {
        p.push(specField("kw", "Keywords", f.keywords.map(function (k) {
          return '<span class="sc-ability__chip">' + esc(k) + "</span>";
        }).join("")));
      }
      if (f.usage) p.push(specField("usage", "Action", esc(f.usage)));
      p.push("</div>");
    }

    // distance + target block (independent style: text|grid|ledger)
    if (f.distance || f.target) {
      p.push('<div class="sb__dt">');
      p.push(specField("dist", "Distance", rich(f.distance || "—", seen)));
      p.push(specField("tgt", "Target", rich(f.target || "—", seen)));
      p.push("</div>");
    }

    // power roll
    if (f.powerRoll) {
      var pr = f.powerRoll;
      p.push('<div class="sc-ability__pr">');
      if (pr.formula) {
        p.push('<div class="sc-ability__pr-head">' + dia +
          '<span class="pre">Power Roll</span><span class="chars">' + esc(pr.formula) + "</span></div>");
      }
      p.push('<div class="sc-ability__pr-rows">');
      ["low", "mid", "high"].forEach(function (t) {
        if (pr.tiers[t] != null) {
          p.push('<div class="sc-ability__tier" data-tier="' + t + '">' +
            '<span class="badge">' + TIER_GLYPH[t] + "</span>" +
            '<span class="res">' + rich(pr.tiers[t], seen) + "</span></div>");
        }
      });
      p.push("</div></div>");
    }

    // sections (Trigger / Effect)
    (f.sections || []).forEach(function (s) {
      p.push('<div class="sc-ability__section">' +
        '<div class="sc-ability__section-head">' + dia + '<span class="tag">' + esc(s.label) + "</span></div>" +
        '<div class="sc-ability__section-body"><p>' + rich(s.text, seen) + "</p></div></div>");
    });

    // trailing note (plain paragraph after the roll)
    if (f.trailing) p.push('<p class="sb__feat-trailing">' + rich(f.trailing, seen) + "</p>");

    // enhancements (dashed "spend X" rows)
    (f.enhancements || []).forEach(function (e) {
      p.push('<div class="sc-ability__enh"><span class="cost">' + esc(e.cost) + "</span>" +
        '<span class="txt">' + rich(e.text, seen) + "</span></div>");
    });

    p.push("</article>");
    return p.join("");
  }

  /* collapsible band (Villain Actions / Malice) */
  function band(kind, title, glyph, introHTML, featuresHTML) {
    return '<section class="sb__band sb__band--' + kind + '" data-open="true">' +
      '<button type="button" class="sb__band-head" aria-expanded="true">' +
        '<span class="sc-crest sb__band-crest"><span class="sb__band-glyph">' + glyph + "</span></span>" +
        '<span class="sb__band-title">' + esc(title) + "</span>" +
        '<span class="sb__band-chev" aria-hidden="true">▾</span>' +
      "</button>" +
      '<div class="sb__band-body">' + (introHTML || "") + featuresHTML + "</div>" +
    "</section>";
  }

  /* fixed 2×2 secondary stats: immunity | weakness ; movement | captain */
  function metaCell(label, value) {
    return '<div class="sb__field sb__field--meta"><span class="sb__field-l">' + esc(label) +
      '</span><span class="sb__field-v">' + rich(value, {}) + "</span></div>";
  }
  function renderMeta(m) {
    return '<div class="sb__meta">' +
      metaCell("Immunity", m.immunity, {}) +
      metaCell("Weakness", m.weakness, {}) +
      metaCell("Movement", m.movement, {}) +
      metaCell(m.captain.label, m.captain.value, {}) +
    "</div>";
  }

  function renderChars(list) {
    return '<div class="sb__chars">' + list.map(function (c) {
      return '<div class="sb__char">' +
        '<span class="sb__char-box">' + esc(c.k) + "</span>" +
        '<span class="sb__char-v">' + esc(c.v) + "</span>" +
        '<span class="sb__char-l">' + esc(c.l) + "</span>" +
      "</div>";
    }).join("") + "</div>";
  }

  function renderSticky(d) {
    var defs = d.defenses.map(function (x) {
      return '<span class="m"><b>' + esc(x.v) + "</b>" + esc(x.l) + "</span>";
    }).join("");
    var chars = d.characteristics.map(function (c) {
      return '<span class="c"><b>' + esc(c.v) + '</b><i>' + esc(c.k) + '</i></span>';
    }).join("");
    var meta = [
      ["Movement", d.meta.movement],
      [d.meta.captain.label, d.meta.captain.value],
      ["Immunity", d.meta.immunity],
      ["Weakness", d.meta.weakness]
    ].map(function (kv) {
      return '<span class="sm"><b>' + esc(kv[0]) + "</b>" + esc(kv[1]) + "</span>";
    }).join("");
    return '<div class="sb__sticky" aria-hidden="true">' +
      '<div class="sb__sticky-row1">' +
        '<span class="sb__sticky-id"><span class="sb__sticky-name">' + esc(d.name) + "</span>" +
          '<span class="sb__sticky-role" data-role="' + d.roleKey + '">' + esc(d.role) + "</span></span>" +
        '<span class="sb__sticky-stats"><span class="sb__sticky-defs">' + defs + "</span>" +
          '<span class="sb__sticky-chars">' + chars + "</span></span>" +
      "</div>" +
      '<div class="sb__sticky-row2">' + meta + "</div>" +
    "</div>";
  }

  function renderStatblock(data) {
    var defs = data.defenses.map(function (d) {
      return '<div class="sb__stat"><span class="v">' + esc(d.v) + '</span><span class="l">' + esc(d.l) + '</span></div>';
    }).join("");

    var normal = data.features.filter(function (f) { return f.kind !== "villain"; });
    var villains = data.features.filter(function (f) { return f.kind === "villain"; });

    var featHTML = normal.map(renderFeature).join("");

    var villainHTML = "";
    if (villains.length) {
      villainHTML = band("villain", "Villain Actions", ACT.villain.glyph, "",
        villains.map(renderFeature).join(""));
    }

    var maliceHTML = "";
    if (data.malice) {
      var intro = '<p class="sb__band-intro">' + rich(data.malice.intro, {}) +
        ' <span class="sb__band-source">' + esc(data.malice.sourceName) + "</span></p>";
      maliceHTML = band("malice", data.malice.name, ACT.malice.glyph, intro,
        data.malice.features.map(renderFeature).join(""));
    }

    var html =
      '<div class="sb-wrap" data-role="' + data.roleKey + '" data-creature="' + data.id + '">' +
        renderSticky(data) +
        '<article class="sb md-typeset" data-role="' + data.roleKey + '">' +
          '<header class="sb__head">' +
            '<div class="sb__head-row">' +
              '<div class="sb__identity">' +
                '<div class="sb__kw">' + esc(data.ancestry) + "</div>" +
                '<h2 class="sb__name">' + esc(data.name) + "</h2>" +
              "</div>" +
              '<div class="sb__class">' +
                '<div class="sb__level">Level ' + esc(data.level) + "</div>" +
                '<div class="sb__role" data-role="' + data.roleKey + '">' + esc(data.role) + "</div>" +
                '<div class="sb__ev">EV ' + esc(data.ev) + "</div>" +
              "</div>" +
            "</div>" +
          "</header>" +
          '<div class="sb__defenses">' + defs + "</div>" +
          renderMeta(data.meta) +
          renderChars(data.characteristics) +
          '<div class="sb__features">' + featHTML + villainHTML + maliceHTML + "</div>" +
        "</article>" +
      "</div>";

    var node = el(html);
    wire(node);
    return node;
  }

  function wire(wrap) {
    // collapsible bands
    wrap.querySelectorAll(".sb__band-head").forEach(function (h) {
      h.addEventListener("click", function () {
        var b = h.closest(".sb__band");
        var open = b.getAttribute("data-open") === "true";
        b.setAttribute("data-open", open ? "false" : "true");
        h.setAttribute("aria-expanded", open ? "false" : "true");
      });
    });
    // sticky mini-header reveal (rAF-throttled scroll)
    var head = wrap.querySelector(".sb__head");
    if (head) {
      var ticking = false;
      function update() {
        ticking = false;
        var hr = head.getBoundingClientRect();
        var wr = wrap.getBoundingClientRect();
        wrap.classList.toggle("is-stuck", hr.bottom < 96 && wr.bottom > 170);
      }
      function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      update();
    }
  }

  root.renderStatblock = renderStatblock;
})(window);
