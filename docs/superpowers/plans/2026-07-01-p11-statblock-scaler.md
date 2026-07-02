# P11 — Dynamic Statblock Scaler (Level Slider) Implementation Plan

> **Status: EXECUTED — shipped & live 2026-07-02.** All tasks completed and verified on production; kept for reference.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Scale to level" stepper on monster statblock pages that adjusts Stamina, EV, damage tiers, potencies, and free strike using the Monsters book's own formulas ("Adjusting Monster Levels", `Read/bestiary/monster-basics.md:1261-1355`), clearly labeled as an approximation.

**Architecture:** v2-only, DOM-rewriting. `sc-scale-core.js` holds the book math as **delta functions** — `newValue = originalValue + (formula(newLevel) − formula(origLevel))` — so the hand-tuned printed numbers stay the baseline and formula error cancels (the book itself warns absolute formula outputs drift a few points high). `sc-scale.js` injects the control on `.sb-wrap` pages, rewrites the visible numbers (main card + sticky mini-header), and restores originals on reset (originals cached in data attributes on first scale).

**Verified book math (all from monster-basics.md):**
- EV = ⌈(2·Level + 4) × OrgMod⌉ — OrgMod: minion .5 (per 4), horde .5, platoon 1, leader 2, elite 2, solo 6. Cross-check: Goblin Warrior (L1 horde) → ⌈6×.5⌉ = **3 EV** ✓ (matches the printed block).
- Stamina = ⌈(10·Level + RoleMod) × StamOrgMod⌉ — RoleMod: ambusher/harrier/mount/support +20, artillery/controller/hexer +10, brute/defender/leader/solo +30, elite +0; StamOrgMod: minion .125, horde .5, platoon 1, leader/elite 2, solo 5. Cross-check: Goblin Warrior (harrier +20, horde ×.5) → ⌈30×.5⌉ = **15** ✓.
- Damage(t) = (4 + Level + DmgMod) × TierMod (t1 .6, t2 1.1, t3 1.4), ÷2 for horde/minion, + highest characteristic if the ability is a Strike. DmgMod: ambusher/artillery/brute/elite/leader +1, solo +2, others +0.
- Highest characteristic (and potency anchor) = 1 + echelon, echelon = ⌈Level/3⌉; leader/solo +1 (cap +5 char, 6 potency).

## Global Constraints

- Isolated worktree: `just wt-new p11-scaler` / `just wt-finish p11-scaler`.
- **House-rule banner is mandatory**: scaled output shows "≈ scaled from level N — approximation via 'Adjusting Monster Levels', not a published statblock" linking to `Read/bestiary/monster-basics/#adjusting-monster-levels`. The book explicitly recommends reskinning over adjusting; we surface the tool anyway but never present output as RAW.
- Scale only pages where role/org/level/EV parse cleanly from the head; otherwise don't inject the control (fixtures/companions/retainers with EV "—" are excluded).
- `document$` registration, idempotent, teardown (v2/CLAUDE.md).
- No persistence — scaling is per-visit (deliberate: a scaled block should not silently masquerade as the real one on the next visit).
- No commit-attribution trailers.

---

### Task 1: Core math (delta functions)

**Files:**
- Create: `v2/docs/javascripts/sc-scale-core.js`
- Test: `v2/tests/sc-scale-core.test.js`

**Interfaces:**
- `mods(role, org)` → `{roleMod, dmgMod, evOrgMod, stamOrgMod, halveDamage, isLeaderOrSolo}` (case-insensitive lookup; unknown role → nulls → caller aborts).
- `echelon(level)` → `⌈level/3⌉`; `charBonus(level, isLeaderOrSolo)` → `min(5, 1 + echelon ± 1)`.
- `staminaDelta(ol, nl, m)`, `evDelta(ol, nl, m)` — difference of the ⌈…⌉ formulas above.
- `damageDelta(ol, nl, tier, m, isStrike)` — `(nl−ol)×tierMod` (÷2 if `halveDamage`) + charDelta if `isStrike`, `Math.round`ed.
- `potencyDelta(ol, nl, m)` — `charBonus(nl)−charBonus(ol)`.
- `applyTierText(text, dmgDelta, potDelta)` — rewrites a tier string: leading `"N damage"` → `N+dmgDelta` (floor 1), every `"X < N"` potency (X ∈ M A R I P) → `N+potDelta` clamped 0–6. `"5 damage; M < 1 bleeding (save ends)"` + (2, 1) → `"7 damage; M < 2 bleeding (save ends)"`.

- [ ] **Step 1: Write the failing tests**

```js
const test = require("node:test");
const assert = require("node:assert");
const S = require("../docs/javascripts/sc-scale-core.js");

test("mods lookup (goblin warrior: horde harrier)", () => {
  const m = S.mods("Harrier", "Horde");
  assert.strictEqual(m.roleMod, 20);
  assert.strictEqual(m.dmgMod, 0);
  assert.strictEqual(m.evOrgMod, 0.5);
  assert.strictEqual(m.stamOrgMod, 0.5);
  assert.ok(m.halveDamage);
  assert.ok(!m.isLeaderOrSolo);
});

test("book cross-checks at level 1 (absolute formula = printed block)", () => {
  const m = S.mods("Harrier", "Horde");
  // formula EV(1)=3, Stamina(1)=15 — deltas from level 1 land on formula values
  assert.strictEqual(3 + S.evDelta(1, 3, m), 5);        // EV(3)=⌈10×.5⌉=5
  assert.strictEqual(15 + S.staminaDelta(1, 3, m), 25); // Stam(3)=⌈50×.5⌉=25
});

test("solo stamina uses ×5, ev ×6", () => {
  const m = S.mods("Solo", "Solo");
  assert.strictEqual(S.staminaDelta(1, 2, m), 50);  // ⌈(20+30)×5⌉−⌈(10+30)×5⌉ = 250−200
  assert.strictEqual(S.evDelta(1, 2, m), 12);       // ⌈8×6⌉−⌈6×6⌉ = 48−36
});

test("damageDelta: tier mods, horde halving, strike char bump", () => {
  const m = S.mods("Harrier", "Horde");
  // L1→L3, tier 1, horde, non-strike: 2×0.6/2 = 0.6 → 1
  assert.strictEqual(S.damageDelta(1, 3, 1, m, false), 1);
  // same but strike: echelon unchanged (1→1) → still 1
  assert.strictEqual(S.damageDelta(1, 3, 1, m, true), 1);
  // L1→L4 strike: char +1 (echelon 1→2): 3×0.6/2=0.9→1, +1 = 2
  assert.strictEqual(S.damageDelta(1, 4, 1, m, true), 2);
  // platoon (no halving) L1→L3 tier 3: 2×1.4 = 2.8 → 3
  const p = S.mods("Brute", "Platoon");
  assert.strictEqual(S.damageDelta(1, 3, 3, p, false), 3);
});

test("potencyDelta follows echelon, applyTierText rewrites", () => {
  const m = S.mods("Harrier", "Horde");
  assert.strictEqual(S.potencyDelta(1, 4, m), 1);
  assert.strictEqual(
    S.applyTierText("5 damage; M < 1 bleeding (save ends)", 2, 1),
    "7 damage; M < 2 bleeding (save ends)");
  assert.strictEqual(S.applyTierText("3 damage", -5, 0), "1 damage"); // floor 1
  assert.strictEqual(S.applyTierText("7 damage; A < 6 dazed", 0, 3), "7 damage; A < 6 dazed"); // potency cap 6
});

test("unknown role yields null mods", () => {
  assert.strictEqual(S.mods("Companion", "—"), null);
});
```

- [ ] **Step 2: Run → FAIL**

```bash
cd v2 && devbox run -- node --test tests/sc-scale-core.test.js
```

- [ ] **Step 3: Implement**

```js
/* sc-scale-core.js — "Adjusting Monster Levels" math (Draw Steel: Monsters,
 * Read/bestiary/monster-basics.md) as DELTA functions: we adjust the printed
 * numbers by formula(new)−formula(old) so hand-tuned baselines survive.
 * DOM in sc-scale.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SCScale = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const ROLE = { ambusher: [20, 1], artillery: [10, 1], brute: [30, 1], controller: [10, 0],
    defender: [30, 0], harrier: [20, 0], hexer: [10, 0], mount: [20, 0], support: [20, 0] };
  const TIER = { 1: 0.6, 2: 1.1, 3: 1.4 };

  function mods(role, org) {
    const r = String(role || "").toLowerCase(), o = String(org || "").toLowerCase();
    let roleMod, dmgMod;
    if (ROLE[r]) { roleMod = ROLE[r][0]; dmgMod = ROLE[r][1]; }
    else if (r === "leader" || o === "leader") { roleMod = 30; dmgMod = 1; }
    else if (r === "solo" || o === "solo") { roleMod = 30; dmgMod = 2; }
    else if (o === "elite") { roleMod = 0; dmgMod = 1; }
    else return null;
    if (o === "elite" && ROLE[r]) dmgMod = ROLE[r][1] + 1;     // elite stacks +1
    const evOrg = { minion: 0.5, horde: 0.5, platoon: 1, leader: 2, elite: 2, solo: 6 }[o];
    const stamOrg = { minion: 0.125, horde: 0.5, platoon: 1, leader: 2, elite: 2, solo: 5 }[o];
    if (evOrg == null || stamOrg == null) return null;
    return { roleMod, dmgMod, evOrgMod: evOrg, stamOrgMod: stamOrg,
      halveDamage: o === "horde" || o === "minion",
      isLeaderOrSolo: o === "leader" || o === "solo" };
  }

  function echelon(l) { return Math.ceil(l / 3); }
  function charBonus(l, leaderOrSolo) { return Math.min(5, 1 + echelon(l) + (leaderOrSolo ? 1 : 0)); }

  const ceil = Math.ceil;
  function evAt(l, m) { return ceil((2 * l + 4) * m.evOrgMod); }
  function stamAt(l, m) { return ceil((10 * l + m.roleMod) * m.stamOrgMod); }

  function evDelta(ol, nl, m) { return evAt(nl, m) - evAt(ol, m); }
  function staminaDelta(ol, nl, m) { return stamAt(nl, m) - stamAt(ol, m); }
  function potencyDelta(ol, nl, m) { return charBonus(nl, m.isLeaderOrSolo) - charBonus(ol, m.isLeaderOrSolo); }

  function damageDelta(ol, nl, tier, m, isStrike) {
    let d = (nl - ol) * TIER[tier];
    if (m.halveDamage) d /= 2;
    if (isStrike) d += potencyDelta(ol, nl, m);
    return Math.round(d);
  }

  function applyTierText(text, dmgDelta, potDelta) {
    let out = String(text).replace(/^(\d+)(\s+(?:\w+\s+)?damage)/, function (_, n, rest) {
      return Math.max(1, parseInt(n, 10) + dmgDelta) + rest;
    });
    out = out.replace(/([MARIP])\s*<\s*(\d)/g, function (_, c, n) {
      return c + " < " + Math.min(6, Math.max(0, parseInt(n, 10) + potDelta));
    });
    return out;
  }

  return { mods, echelon, charBonus, evDelta, staminaDelta, potencyDelta, damageDelta, applyTierText };
});
```

- [ ] **Step 4: Run tests → PASS; commit**

```bash
cd v2 && devbox run -- node --test tests/sc-scale-core.test.js
git -C v2 add docs/javascripts/sc-scale-core.js tests/sc-scale-core.test.js
git -C v2 commit -m "feat: statblock scaling core (book formulas as deltas)"
```

---

### Task 2: The control + DOM rewriting

**Files:**
- Create: `v2/docs/javascripts/sc-scale.js`
- Create: `v2/docs/stylesheets/steel-scale.css`
- Modify: `v2/mkdocs.yml` (extra_javascript + extra_css)

**DOM contract (from the generated statblock — see `v2/docs/Browse/monster/goblin/goblin-warrior.md`):**
- Level chip: `.sb__head .sc-head__right-eyebrow` (`Level 1`); EV chip: `.sb__head .sc-head__right-deck` (`EV 3`).
- Role/org words: `.sb__head .sc-head__right-primary` (`Horde Harrier` — first word org, second role).
- Stamina + Free Strike: `.sb__defenses .sb__stat` cells (`.l` label / `.v` value); duplicated in the sticky header (`.sb__sticky-defs .m` — `<b>15</b>Stamina`).
- Tier rows: `.sc-ability__tier[data-tier] .res`; an ability's Strike-ness: its card (`.sb__feat`) has an `.sc-ability__chip` with text `Strike`.

- [ ] **Step 1: Write the mount script**

```js
/* sc-scale.js — "Scale to level" control on monster statblock pages.
 * Rewrites Stamina/EV/level/damage/potencies/free strike by the book's
 * adjustment formulas (sc-scale-core.js), always relative to the printed
 * originals (cached in data-orig on first use). NEVER persists. */
(function () {
  "use strict";
  function txt(el) { return el ? el.textContent.trim() : ""; }

  function init() {
    document.querySelectorAll(".sc-scale").forEach(function (n) { n.remove(); });
    const S = window.SCScale;
    const wrap = document.querySelector(".md-content .sb-wrap");
    if (!S || !wrap) return;
    const head = wrap.querySelector(".sb__head");
    if (!head) return;

    const lvlM = /Level\s*(\d+)/i.exec(txt(head.querySelector(".sc-head__right-eyebrow")));
    const evM = /EV\s*(\d+)/i.exec(txt(head.querySelector(".sc-head__right-deck")));
    const words = txt(head.querySelector(".sc-head__right-primary")).split(/\s+/);
    if (!lvlM || !evM || words.length < 1) return;
    const org = words.length > 1 ? words[0] : words[0];
    const role = words.length > 1 ? words[1] : words[0];
    const m = S.mods(role, org);
    if (!m) return;
    const origLevel = parseInt(lvlM[1], 10);

    // originals cache: [selector match, attr] pairs written on first scale
    function cacheOrig(el) { if (el && el.dataset.orig == null) el.dataset.orig = el.textContent; }
    function setNum(el, v) { if (el) el.textContent = String(v); }

    function statCell(label) {
      let hit = null;
      wrap.querySelectorAll(".sb__defenses .sb__stat").forEach(function (c) {
        if (txt(c.querySelector(".l")).toLowerCase() === label) hit = c.querySelector(".v");
      });
      return hit;
    }
    function stickyCell(label) {
      let hit = null;
      wrap.querySelectorAll(".sb__sticky-defs .m").forEach(function (c) {
        if (c.textContent.toLowerCase().indexOf(label) >= 0) hit = c.querySelector("b");
      });
      return hit;
    }

    const ctl = document.createElement("div");
    ctl.className = "sc-scale";
    ctl.innerHTML = '<label>Scale to level <input type="number" min="1" max="12" value="' + origLevel + '"></label>' +
      '<span class="sc-scale__note" hidden>≈ scaled from level ' + origLevel +
      ' — <a href="' + relBestiaryHref() + '">approximation, not a published statblock</a></span>';
    wrap.parentNode.insertBefore(ctl, wrap);
    const input = ctl.querySelector("input");
    const note = ctl.querySelector(".sc-scale__note");

    function relBestiaryHref() {
      // statblock pages live at Browse/monster/<group>[/<sub>]/<id>/ — hop to Read.
      const depth = location.pathname.split("/").filter(Boolean).length;
      return "../".repeat(Math.max(0, depth - 2)) + "Read/bestiary/monster-basics/#adjusting-monster-levels";
    }

    function apply(nl) {
      const scaled = nl !== origLevel;
      note.hidden = !scaled;
      wrap.classList.toggle("is-scaled", scaled);

      // level + EV chips
      const lvlEl = head.querySelector(".sc-head__right-eyebrow");
      const evEl = head.querySelector(".sc-head__right-deck");
      cacheOrig(lvlEl); cacheOrig(evEl);
      lvlEl.textContent = scaled ? "Level " + nl : lvlEl.dataset.orig;
      evEl.textContent = scaled ? "EV " + (parseInt(evM[1], 10) + S.evDelta(origLevel, nl, m)) : evEl.dataset.orig;

      // stamina + free strike (main + sticky)
      [["stamina", S.staminaDelta(origLevel, nl, m)],
       ["free strike", S.damageDelta(origLevel, nl, 1, m, true)]].forEach(function (pair) {
        [statCell(pair[0]), stickyCell(pair[0])].forEach(function (el) {
          if (!el) return;
          cacheOrig(el);
          const orig = parseInt(el.dataset.orig, 10);
          if (!isFinite(orig)) return;
          el.textContent = scaled ? String(Math.max(1, orig + pair[1])) : el.dataset.orig;
        });
      });

      // tier rows per feature card (strike-ness from keyword chips)
      wrap.querySelectorAll(".sb__feat").forEach(function (feat) {
        let strike = false;
        feat.querySelectorAll(".sc-ability__chip").forEach(function (ch) {
          if (txt(ch).toLowerCase() === "strike") strike = true;
        });
        feat.querySelectorAll(".sc-ability__tier").forEach(function (row) {
          const res = row.querySelector(".res");
          if (!res) return;
          cacheOrig(res);
          if (!scaled) { res.textContent = res.dataset.orig; return; }
          const tier = { low: 1, mid: 2, high: 3 }[row.dataset.tier] || 2;
          res.textContent = S.applyTierText(res.dataset.orig,
            S.damageDelta(origLevel, nl, tier, m, strike),
            S.potencyDelta(origLevel, nl, m));
        });
      });
    }
    input.addEventListener("input", function () {
      const nl = Math.min(12, Math.max(1, parseInt(input.value, 10) || origLevel));
      apply(nl);
    });
  }
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init);
})();
```

Known simplification (accept for v1, note in the commit): rewriting `.res` via `textContent` of `dataset.orig` **drops inline links** inside tier rows (condition links like `bleeding`). Preserve them instead by operating on `innerHTML` with the same regexes if the visual QA finds it jarring — `applyTierText`'s patterns don't overlap `<a>` markup for the damage number, but the potency pattern could sit inside a link's text; test both variants on Bury the Point and pick the one that keeps links intact.

- [ ] **Step 2: Stylesheet**

`v2/docs/stylesheets/steel-scale.css`:

```css
/* steel-scale.css — statblock level-scaling control (sc-scale.js) */
.sc-scale { max-width: 47rem; margin: 1rem auto -0.6rem; font-size: .72rem;
  display: flex; gap: .8rem; align-items: baseline; flex-wrap: wrap; }
.sc-scale input { width: 3.4rem; }
.sc-scale__note { color: #e0b050; }
.sb-wrap.is-scaled { outline: 2px dashed #e0b05066; outline-offset: 4px; border-radius: .4rem; }
```

- [ ] **Step 3: Register in mkdocs.yml**

extra_javascript (after `statblock-preview.js`): `- javascripts/sc-scale-core.js`, `- javascripts/sc-scale.js`; extra_css: `- stylesheets/steel-scale.css`.

- [ ] **Step 4: Build + verify against the book's own example**

Serve; `/Browse/monster/goblin/goblin-warrior/` (L1 horde harrier, EV 3, Stamina 15):
- Scale to 3 → EV 5, Stamina 25 (matches the Task 1 cross-check), Spear Charge t1 3→4, level chip "Level 3", dashed amber outline + banner appear; banner links to the Adjusting Monster Levels section.
- Back to 1 → every number returns to the printed original, banner gone.
- A solo (e.g. `/Browse/monster/basilisk/…` or Lord Syuul) scales with the ×5/×6 organization mods.
- A companion/fixture page (no parsable role) shows **no** control.
- Sticky mini-header shows the scaled Stamina while scrolled.

- [ ] **Step 5: Full tests, commit, land**

```bash
cd v2 && devbox run -- node --test tests/
git -C v2 add docs/javascripts/sc-scale.js docs/stylesheets/steel-scale.css mkdocs.yml
git -C v2 commit -m "feat: statblock level scaler (book-formula deltas, house-rule banner)"
just wt-finish p11-scaler
```

**Post-deploy:** scale, navigate away via instant nav, come back — control re-injects once and the block shows printed values (no persistence, no duplicate controls).
