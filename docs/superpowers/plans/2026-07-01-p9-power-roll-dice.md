# P9 — Click-to-Roll Power Rolls Implementation Plan

> **Status: EXECUTED — shipped & live 2026-07-02.** All tasks completed and verified on production; kept for reference.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking any power-roll header on an ability card or statblock rolls 2d10, applies edges/banes with the real Draw Steel semantics (single = ±2, double = tier shift, natural 19–20 = crit), and highlights the matching tier band on the card.

**Architecture:** v2-only. `sc-dice-core.js` (pure: roll math, tier/crit/edge-bane resolution — node:test) + `sc-dice.js` (delegated click handler on `.sc-ability__pr-head`, small result popover, tier highlight via a CSS class). Cards already render tier rows as `.sc-ability__tier[data-tier="low|mid|high"]` and the roll header as `.sc-ability__pr-head` with the modifier in `.chars` (numeric for monsters — `+ 2` — or a characteristic name for hero abilities — `+ Might`).

**Tech Stack:** Vanilla JS (`document$`), node:test, CSS.

**Rules (verified):** Power roll = 2d10 + modifier; tiers ≤11 / 12–16 / 17+; edge +2 / bane −2; **double** edge/bane shifts the resulting tier ±1 instead of a flat modifier; edge+bane cancel; a **natural** (unmodified 2d10) 19–20 is a critical: tier 3. Sources: `Browse/rule/dice/{edge,bane,tier-outcome,natural-19-20}` pages — re-verify each one-liner against those pages during Task 1 and correct the core if any semantics differ.

## Global Constraints

- Isolated worktree: `just wt-new p9-dice` / `just wt-finish p9-dice`.
- `document$` registration; **event delegation** (cards exist in embedded/transcluded copies; statblock feature cards re-use `.sc-ability`); idempotent; teardown on swap.
- The roll is a table aid, not a character sheet: when the modifier is a characteristic *name* (hero abilities), the popover shows the unmodified total with ± steppers — we do not know the hero's score.
- No commit-attribution trailers.

---

### Task 1: Core module

**Files:**
- Create: `v2/docs/javascripts/sc-dice-core.js`
- Test: `v2/tests/sc-dice-core.test.js`

**Interfaces:**
- `roll(rng)` → `{d1, d2}` (rng: `() => [0,1)`, injectable for tests).
- `parseModifier(charsText)` → `{bonus: number|null, label: string}` — `"+ 2"`→`{2,"+2"}`, `"+ Might"`→`{null,"+ Might"}`, `"+ 2"` with link markup already stripped by textContent.
- `resolve({d1, d2, bonus, edges, banes})` → `{total, tier: 1|2|3, crit: bool, shifted: -1|0|1, flat: number}` implementing: net = edges−banes (each capped at 2 before netting is WRONG — verify: two edges + one bane = one edge; net counts. Use net = clamp(edges,0,2) − clamp(banes,0,2), then |net|==1 → flat ±2; |net|==2 → tier shift). Natural 19–20 (d1+d2 ≥ 19) → crit, tier 3 regardless (after shifts, floor at 3).
- `tierOf(total)` → 1|2|3 (≤11, 12–16, ≥17).
- `tierKey(tier)` → `"low"|"mid"|"high"` (matches `data-tier`).

- [ ] **Step 1: Write the failing tests**

```js
const test = require("node:test");
const assert = require("node:assert");
const D = require("../docs/javascripts/sc-dice-core.js");

test("roll uses injected rng and yields 1..10 each", () => {
  assert.deepStrictEqual(D.roll(() => 0), { d1: 1, d2: 1 });
  assert.deepStrictEqual(D.roll(() => 0.999), { d1: 10, d2: 10 });
});

test("parseModifier: numeric vs characteristic", () => {
  assert.deepStrictEqual(D.parseModifier("+ 2"), { bonus: 2, label: "+2" });
  assert.deepStrictEqual(D.parseModifier("+ Might"), { bonus: null, label: "+ Might" });
  assert.deepStrictEqual(D.parseModifier(""), { bonus: 0, label: "" });
});

test("tierOf boundaries", () => {
  assert.strictEqual(D.tierOf(11), 1);
  assert.strictEqual(D.tierOf(12), 2);
  assert.strictEqual(D.tierOf(16), 2);
  assert.strictEqual(D.tierOf(17), 3);
});

test("resolve: single edge is +2, double edge shifts tier", () => {
  // d1=5 d2=5 bonus 0 → 10 → tier 1
  const base = { d1: 5, d2: 5, bonus: 0, edges: 0, banes: 0 };
  assert.strictEqual(D.resolve(base).tier, 1);
  const oneEdge = D.resolve({ ...base, edges: 1 });      // 12 → tier 2
  assert.strictEqual(oneEdge.total, 12);
  assert.strictEqual(oneEdge.tier, 2);
  const twoEdge = D.resolve({ ...base, edges: 2 });      // 10 stays, tier 1→2
  assert.strictEqual(twoEdge.total, 10);
  assert.strictEqual(twoEdge.tier, 2);
  assert.strictEqual(twoEdge.shifted, 1);
});

test("resolve: banes mirror edges; edge+bane cancel", () => {
  const base = { d1: 8, d2: 8, bonus: 0, edges: 0, banes: 0 }; // 16 tier 2
  assert.strictEqual(D.resolve({ ...base, banes: 1 }).total, 14);
  assert.strictEqual(D.resolve({ ...base, banes: 2 }).tier, 1);
  assert.strictEqual(D.resolve({ ...base, edges: 1, banes: 1 }).total, 16);
});

test("resolve: natural 19-20 is a crit at tier 3", () => {
  const r = D.resolve({ d1: 10, d2: 9, bonus: 0, edges: 0, banes: 2 });
  assert.ok(r.crit);
  assert.strictEqual(r.tier, 3); // crit overrides shifts
});

test("tier shift clamps to 1..3", () => {
  assert.strictEqual(D.resolve({ d1: 10, d2: 8, bonus: 0, edges: 2, banes: 0 }).tier, 3);
  assert.strictEqual(D.resolve({ d1: 2, d2: 2, bonus: 0, edges: 0, banes: 2 }).tier, 1);
});
```

- [ ] **Step 2: Run → FAIL (module not found)**

```bash
cd v2 && devbox run -- node --test tests/sc-dice-core.test.js
```

- [ ] **Step 3: Implement**

```js
/* sc-dice-core.js — power-roll math (2d10, tiers, edges/banes, crits).
 * Semantics per Browse/rule/dice/*: single edge/bane = ±2; double = ±1 tier;
 * natural 19–20 = critical (tier 3). DOM in sc-dice.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SCDice = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function roll(rng) {
    rng = rng || Math.random;
    return { d1: 1 + Math.floor(rng() * 10), d2: 1 + Math.floor(rng() * 10) };
  }
  function parseModifier(text) {
    const t = String(text || "").trim();
    if (!t) return { bonus: 0, label: "" };
    const m = /^\+?\s*(-?\d+)$/.exec(t.replace(/^\+/, "").trim());
    if (m) { const n = parseInt(m[1], 10); return { bonus: n, label: (n >= 0 ? "+" : "") + n }; }
    return { bonus: null, label: t };
  }
  function tierOf(total) { return total <= 11 ? 1 : total <= 16 ? 2 : 3; }
  function tierKey(t) { return t === 1 ? "low" : t === 2 ? "mid" : "high"; }
  function resolve(o) {
    const edges = Math.min(2, Math.max(0, o.edges | 0));
    const banes = Math.min(2, Math.max(0, o.banes | 0));
    const net = edges - banes;
    let flat = 0, shift = 0;
    if (net === 1) flat = 2; else if (net === -1) flat = -2;
    else if (net >= 2) shift = 1; else if (net <= -2) shift = -1;
    const natural = o.d1 + o.d2;
    const total = natural + (o.bonus || 0) + flat;
    const crit = natural >= 19;
    let tier = Math.min(3, Math.max(1, tierOf(total) + shift));
    if (crit) tier = 3;
    return { total: total, tier: tier, crit: crit, shifted: shift, flat: flat };
  }
  return { roll, parseModifier, tierOf, tierKey, resolve };
});
```

- [ ] **Step 4: Run tests → PASS; commit**

```bash
cd v2 && devbox run -- node --test tests/sc-dice-core.test.js
git -C v2 add docs/javascripts/sc-dice-core.js tests/sc-dice-core.test.js
git -C v2 commit -m "feat: power-roll dice core (tiers, edges/banes, crits)"
```

---

### Task 2: Mount script, popover, tier highlight

**Files:**
- Create: `v2/docs/javascripts/sc-dice.js`
- Create: `v2/docs/stylesheets/steel-dice.css`
- Modify: `v2/mkdocs.yml` (extra_javascript + extra_css)

- [ ] **Step 1: Write the mount script**

```js
/* sc-dice.js — click a power-roll header to roll it. One delegated listener;
 * popover shows dice + edge/bane steppers; matching tier row highlights.
 * Math in sc-dice-core.js. instant-nav safe. */
(function () {
  "use strict";
  let teardown = null;

  function init() {
    if (teardown) { teardown(); teardown = null; }
    document.querySelectorAll(".sc-dice-pop").forEach(n => n.remove());
    if (!window.SCDice) return;
    const D = window.SCDice;

    function onClick(ev) {
      const head = ev.target.closest(".sc-ability__pr-head");
      if (!head) {
        if (!ev.target.closest(".sc-dice-pop")) document.querySelectorAll(".sc-dice-pop").forEach(n => n.remove());
        return;
      }
      document.querySelectorAll(".sc-dice-pop").forEach(n => n.remove());
      const card = head.closest(".sc-ability") || head.closest(".sb__feat") || head.parentElement;
      const mod = D.parseModifier((head.querySelector(".chars") || {}).textContent);
      const state = { dice: D.roll(), edges: 0, banes: 0, bonus: mod.bonus };

      const pop = document.createElement("div");
      pop.className = "sc-dice-pop";
      head.style.position = "relative";
      head.appendChild(pop);

      function paint() {
        const r = D.resolve({ d1: state.dice.d1, d2: state.dice.d2, bonus: state.bonus || 0, edges: state.edges, banes: state.banes });
        card.querySelectorAll(".sc-ability__tier").forEach(function (row) {
          row.classList.toggle("is-rolled", row.dataset.tier === D.tierKey(r.tier));
        });
        pop.innerHTML =
          '<span class="dice">' + state.dice.d1 + " + " + state.dice.d2 + "</span>" +
          (state.bonus != null ? ' <span class="mod">' + (state.bonus >= 0 ? "+" + state.bonus : state.bonus) + "</span>" : ' <span class="mod">' + esc(mod.label) + "</span>") +
          ' <b class="total">= ' + r.total + "</b>" +
          (r.crit ? ' <span class="crit">CRIT!</span>' : "") +
          (r.shifted ? ' <span class="shift">tier ' + (r.shifted > 0 ? "+1" : "−1") + "</span>" : "") +
          '<span class="ctl"><button type="button" data-k="edges">Edge ' + state.edges + "</button>" +
          '<button type="button" data-k="banes">Bane ' + state.banes + "</button>" +
          '<button type="button" data-k="reroll">↻</button></span>';
      }
      function esc(s) { return String(s).replace(/</g, "&lt;"); }
      pop.addEventListener("click", function (e) {
        const b = e.target.closest("button[data-k]");
        if (!b) return;
        e.stopPropagation();
        if (b.dataset.k === "reroll") state.dice = D.roll();
        else state[b.dataset.k] = (state[b.dataset.k] + 1) % 3;
        paint();
      });
      paint();
    }
    document.addEventListener("click", onClick);
    teardown = function () { document.removeEventListener("click", onClick); };
  }
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init);
})();
```

- [ ] **Step 2: Stylesheet**

`v2/docs/stylesheets/steel-dice.css`:

```css
/* steel-dice.css — power-roll popover + rolled-tier highlight (sc-dice.js) */
.sc-ability__pr-head { cursor: pointer; }
.sc-ability__pr-head:hover .pre { color: var(--md-accent-fg-color); }
.sc-dice-pop {
  position: absolute; right: 0; top: 100%; z-index: 15; white-space: nowrap;
  border: 1px solid var(--fx-metal-line); border-radius: .45rem;
  background: var(--md-default-bg-color); box-shadow: 0 3px 12px rgba(0,0,0,.3);
  padding: .35rem .6rem; font-size: .72rem;
}
.sc-dice-pop .total { margin: 0 .25rem; }
.sc-dice-pop .crit { color: #e0b050; font-weight: 700; }
.sc-dice-pop .ctl { margin-left: .5rem; }
.sc-dice-pop .ctl button {
  border: 1px solid var(--md-default-fg-color--lightest); border-radius: .3em;
  background: none; cursor: pointer; color: inherit; padding: .05rem .35rem; margin-left: .2rem;
}
.sc-ability__tier.is-rolled {
  outline: 2px solid var(--md-accent-fg-color); outline-offset: -2px; border-radius: .25rem;
}
```

- [ ] **Step 3: Register both in mkdocs.yml**

extra_javascript (after `steel-ability-cards.js`): `- javascripts/sc-dice-core.js`, `- javascripts/sc-dice.js`. extra_css: `- stylesheets/steel-dice.css`.

- [ ] **Step 4: Build + verify**

Serve; on `/Browse/feature/ability/fury/level-1/brutal-slam/` click "POWER ROLL + Might": popover shows `d1 + d2 (+ Might) = N`, one tier row outlined. Click "Edge" once → total +2; twice → "tier +1" and highlight moves; ↻ rerolls. On `/Browse/monster/goblin/goblin-warrior/`, Spear Charge's "POWER ROLL +2" resolves numerically. Clicking elsewhere dismisses. Roll on an embedded card inside a class page too (delegation covers it).

- [ ] **Step 5: Full tests, commit, land**

```bash
cd v2 && devbox run -- node --test tests/
git -C v2 add docs/javascripts/sc-dice.js docs/stylesheets/steel-dice.css mkdocs.yml
git -C v2 commit -m "feat: click-to-roll power rolls with edge/bane + tier highlight"
just wt-finish p9-dice
```

**Post-deploy:** roll on two pages back-to-back via instant nav — exactly one popover, one roll per click (no duplicated listeners).
