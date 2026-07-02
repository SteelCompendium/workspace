# P8 — Encounter Builder (EV Budget Tray) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Bestiary Search & Filter into an encounter-building tool: a "+" on every result row adds the creature to a persistent tray showing picked monsters × counts, total EV against the party's encounter-strength budget (with the book's Trivial→Extreme difficulty bands), shareable via URL, exportable as markdown.

**Architecture:** v2-only, layered on the existing Bestiary machinery: `steel-bestiary-browser.js` gains one extra column ("+" buttons carrying `data-href`); a new `sc-encounter-core.js` (pure math: EV parsing incl. per-4 minion pricing, encounter-strength & difficulty bands per the Monsters book, share-string codec) + `sc-encounter.js` (tray panel on the Bestiary page, event delegation, localStorage, URL hydration). Creature data comes from the page's existing `.sc-browse-data` JSON island — no steel-etl change.

**Tech Stack:** Vanilla JS (`document$`), node:test, localStorage (`sc-encounter`), CSS.

**Rules math (verified against `v2/docs/Read/bestiary/monster-basics.md` Steps 3–5):**
- A hero's encounter strength: `ES(hero) = 4 + 2 × level`.
- Party ES = heroES × (heroCount + floor(avgVictories / 2)).
- Difficulty bands (heroES = one hero's ES): **Trivial** < partyES − heroES ≤ **Easy** < partyES ≤ **Standard** ≤ partyES + heroES < **Hard** ≤ partyES + 3·heroES < **Extreme**.
- Creatures cost their EV; **minions are bought 4 at a time** — an EV like `"10 for four minions"` prices a group of 4.
- Level guidance (advisory flag, not a block): creature level > heroes + 2 (solo: +1) gets a ⚠ marker.

## Global Constraints

- Isolated worktree: `just wt-new p8-encounter` / `just wt-finish p8-encounter`.
- `document$` registration, idempotent init, listener teardown (v2/CLAUDE.md instant-nav rules). The Bestiary re-renders its result table on every keystroke — the "+" handler MUST use event delegation on the mount, never per-button listeners.
- `bestiaryItem` JSON keys (`internal/site/bestiary_search.go:20-31`) are the data contract — read `name/level/ev/organization/href`, don't require new fields.
- localStorage key `sc-encounter`, schema `{"v":1,"party":{"n":5,"lvl":1,"vic":0},"picks":[{"href","name","ev","org","level","count"}]}`.
- Share URL param `enc` on `/Bestiary/`: `?enc=<slug>:<count>,…` where slug = last path segment of href.
- No commit-attribution trailers.

---

### Task 1: Core math module

**Files:**
- Create: `v2/docs/javascripts/sc-encounter-core.js`
- Test: `v2/tests/sc-encounter-core.test.js`

**Interfaces (produced; consumed by Task 3):**
- `parseEV(evStr)` → `{ev: number|null, perFour: bool}` — `"16"`→`{16,false}`, `"10 for four minions"`→`{10,true}`, `"-"`/`""`→`{null,false}`.
- `heroES(level)` → `4 + 2*level`.
- `partyES(n, level, victories)` → `heroES(level) * (n + Math.floor(victories/2))`.
- `bands(pES, hES)` → `{trivialMax, easyMax, standardMax, hardMax}` (= pES−hES, pES, pES+hES, pES+3·hES).
- `classify(total, bandsObj)` → `"Trivial"|"Easy"|"Standard"|"Hard"|"Extreme"` (0 total → `"Trivial"`).
- `pickCost(pick)` → EV × groups, where a `perFour` pick's `count` is minions (steps of 4): `Math.ceil(count/4) × ev`; others `count × ev`.
- `totalEV(picks)`.
- `levelWarn(pickLevel, heroLevel, org)` → bool (level > hero+2, or org "Solo" and level > hero+1).
- `addPick(picks, item)` / `setCount(picks, href, count)` (count ≤ 0 removes; minions snap to multiples of 4, minimum 4).
- `encodeShare(picks)` / `decodeShare(str, itemsByHrefSlug)` (unknown slugs dropped).

- [ ] **Step 1: Write the failing tests**

`v2/tests/sc-encounter-core.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const E = require("../docs/javascripts/sc-encounter-core.js");

test("parseEV handles plain, minion-group, and missing", () => {
  assert.deepStrictEqual(E.parseEV("16"), { ev: 16, perFour: false });
  assert.deepStrictEqual(E.parseEV("10 for four minions"), { ev: 10, perFour: true });
  assert.deepStrictEqual(E.parseEV("7 for four minions"), { ev: 7, perFour: true });
  assert.deepStrictEqual(E.parseEV("-"), { ev: null, perFour: false });
  assert.deepStrictEqual(E.parseEV(""), { ev: null, perFour: false });
});

test("encounter strength math matches the book table", () => {
  assert.strictEqual(E.heroES(1), 6);           // 1st-level hero = 6
  assert.strictEqual(E.heroES(3), 10);          // book: 4+2+2+2
  assert.strictEqual(E.partyES(5, 3, 0), 50);   // book: five 3rd-level heroes = 50
  assert.strictEqual(E.partyES(5, 3, 2), 60);   // +2 avg victories = +1 hero
});

test("bands + classify follow Step 4", () => {
  const b = E.bands(50, 10); // five 3rd-level heroes
  assert.deepStrictEqual(b, { trivialMax: 40, easyMax: 50, standardMax: 60, hardMax: 80 });
  assert.strictEqual(E.classify(35, b), "Trivial");
  assert.strictEqual(E.classify(45, b), "Easy");
  assert.strictEqual(E.classify(55, b), "Standard");
  assert.strictEqual(E.classify(60, b), "Standard"); // inclusive upper
  assert.strictEqual(E.classify(75, b), "Hard");
  assert.strictEqual(E.classify(81, b), "Extreme");
});

test("minions price by groups of four", () => {
  const minion = { href: "m", ev: "10 for four minions", count: 4 };
  assert.strictEqual(E.pickCost(minion), 10);
  assert.strictEqual(E.pickCost({ ...minion, count: 8 }), 20);
  assert.strictEqual(E.pickCost({ href: "x", ev: "16", count: 2 }), 32);
});

test("setCount snaps minions to multiples of 4 and removes at 0", () => {
  let picks = E.addPick([], { href: "m", name: "Mob", ev: "10 for four minions", organization: "Minion", level: 1 });
  assert.strictEqual(picks[0].count, 4);         // minions start at 4
  picks = E.setCount(picks, "m", 6);
  assert.strictEqual(picks[0].count, 8);         // snap up
  picks = E.setCount(picks, "m", 0);
  assert.strictEqual(picks.length, 0);
});

test("levelWarn flags over-level and solo-over-level", () => {
  assert.ok(E.levelWarn(4, 1, "Horde"));         // 4 > 1+2
  assert.ok(!E.levelWarn(3, 1, "Horde"));
  assert.ok(E.levelWarn(3, 1, "Solo"));          // solo: only +1 allowed
  assert.ok(!E.levelWarn(2, 1, "Solo"));
});

test("share codec round-trips and drops unknowns", () => {
  const picks = [
    { href: "../Browse/monster/goblin/goblin-warrior/", name: "Goblin Warrior", ev: "3", organization: "Horde", level: 1, count: 4 },
    { href: "../Browse/monster/goblin/war-spider/", name: "War Spider", ev: "8", organization: "Platoon", level: 1, count: 1 },
  ];
  const s = E.encodeShare(picks);
  assert.strictEqual(s, "goblin-warrior:4,war-spider:1");
  const byHrefSlug = { "goblin-warrior": picks[0], "war-spider": picks[1] };
  const back = E.decodeShare("goblin-warrior:2,nonsense:9,war-spider:1", byHrefSlug);
  assert.strictEqual(back.length, 2);
  assert.strictEqual(back[0].count, 2);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd v2 && devbox run -- node --test tests/sc-encounter-core.test.js
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`v2/docs/javascripts/sc-encounter-core.js`:

```js
/* sc-encounter-core.js — pure encounter-budget math. Sources:
 * Read/bestiary/monster-basics.md Steps 3–5 (encounter strength, difficulty
 * bands, minions-by-four). DOM/tray in sc-encounter.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SCEncounter = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function parseEV(s) {
    const m = /^(\d+)/.exec(String(s || "").trim());
    if (!m) return { ev: null, perFour: false };
    return { ev: parseInt(m[1], 10), perFour: /for four/i.test(s) };
  }

  function heroES(level) { return 4 + 2 * (parseInt(level, 10) || 1); }
  function partyES(n, level, victories) {
    return heroES(level) * ((parseInt(n, 10) || 0) + Math.floor((parseInt(victories, 10) || 0) / 2));
  }
  function bands(pES, hES) {
    return { trivialMax: pES - hES, easyMax: pES, standardMax: pES + hES, hardMax: pES + 3 * hES };
  }
  function classify(total, b) {
    if (total <= b.trivialMax) return "Trivial";
    if (total < b.easyMax) return "Easy";
    if (total <= b.standardMax) return "Standard";
    if (total <= b.hardMax) return "Hard";
    return "Extreme";
  }

  function isMinion(pick) { return parseEV(pick.ev).perFour || /minion/i.test(pick.organization || ""); }

  function pickCost(pick) {
    const p = parseEV(pick.ev);
    if (p.ev == null) return 0;
    if (p.perFour) return Math.ceil((pick.count || 0) / 4) * p.ev;
    return (pick.count || 0) * p.ev;
  }
  function totalEV(picks) { return picks.reduce((a, p) => a + pickCost(p), 0); }

  function levelWarn(pickLevel, heroLevel, org) {
    const cap = /solo/i.test(org || "") ? 1 : 2;
    return (parseInt(pickLevel, 10) || 0) > (parseInt(heroLevel, 10) || 1) + cap;
  }

  function addPick(picks, item) {
    const found = picks.find(p => p.href === item.href);
    if (found) return setCount(picks, item.href, found.count + (isMinion(found) ? 4 : 1));
    const pick = { href: item.href, name: item.name, ev: item.ev,
      organization: item.organization || "", level: item.level, count: 1 };
    if (isMinion(pick)) pick.count = 4;
    return picks.concat([pick]);
  }

  function setCount(picks, href, count) {
    return picks.map(function (p) {
      if (p.href !== href) return p;
      let c = count;
      if (isMinion(p)) c = Math.max(0, Math.ceil(c / 4) * 4);
      return Object.assign({}, p, { count: c });
    }).filter(p => p.count > 0);
  }

  function slug(href) {
    const parts = String(href || "").split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }
  function encodeShare(picks) {
    return picks.map(p => slug(p.href) + ":" + p.count).join(",");
  }
  function decodeShare(str, itemsBySlug) {
    const picks = [];
    String(str || "").split(",").forEach(function (part) {
      const m = /^([a-z0-9-]+):(\d+)$/.exec(part.trim());
      if (!m || !itemsBySlug[m[1]]) return;
      const it = itemsBySlug[m[1]];
      picks.push({ href: it.href, name: it.name, ev: it.ev,
        organization: it.organization || "", level: it.level,
        count: parseInt(m[2], 10) });
    });
    return picks;
  }

  return { parseEV, heroES, partyES, bands, classify, pickCost, totalEV,
    levelWarn, addPick, setCount, slug, encodeShare, decodeShare, isMinion };
});
```

- [ ] **Step 4: Run tests → PASS; commit**

```bash
cd v2 && devbox run -- node --test tests/sc-encounter-core.test.js
git -C v2 add docs/javascripts/sc-encounter-core.js tests/sc-encounter-core.test.js
git -C v2 commit -m "feat: encounter-budget core math (ES, bands, minion pricing, share codec)"
```

---

### Task 2: "+" column in the Bestiary results table

**Files:**
- Modify: `v2/docs/javascripts/steel-bestiary-browser.js` (`COLS` at line ~30, `rowHTML` at line ~174, `headHTML` needs no change — unsortable columns already render plain `<th>`)

- [ ] **Step 1: Add the column definition**

In the `COLS` array (line ~30, after the `size` entry… place LAST so it renders as the final column):

```js
    { key: "add", label: "" },   // encounter-builder "+" (sc-encounter.js)
```

- [ ] **Step 2: Emit the cell in rowHTML**

In `rowHTML` (line ~174), change the final keywords cell line from:

```js
        "<td>" + kw + "</td></tr>";
```
to:
```js
        "<td>" + kw + "</td>" +
        '<td class="sc-enc-cell"><button type="button" class="sc-enc-add" title="Add to encounter" data-href="' +
        esc(it.href) + '">+</button></td></tr>';
```

- [ ] **Step 3: Manual check**

Build + serve; `/Bestiary/` rows each end with a small "+" button (unstyled for now); sorting/filtering still work (the new column's `<th>` is unsortable and empty).

- [ ] **Step 4: Commit**

```bash
git -C v2 add docs/javascripts/steel-bestiary-browser.js
git -C v2 commit -m "feat: add-to-encounter button column in bestiary results"
```

---

### Task 3: The tray

**Files:**
- Create: `v2/docs/javascripts/sc-encounter.js`
- Create: `v2/docs/stylesheets/steel-encounter.css`
- Modify: `v2/mkdocs.yml` (extra_javascript after the bestiary browser; extra_css at the end)

**Interfaces:**
- Consumes: `window.SCEncounter` (Task 1), the `.sc-bestiary-mount` island JSON (`.sc-browse-data`), clicks on `.sc-enc-add[data-href]` (Task 2).
- Produces: `<aside class="sc-enc">` tray appended to `document.body` on `/Bestiary/` only.

- [ ] **Step 1: Write the mount script**

`v2/docs/javascripts/sc-encounter.js`:

```js
/* sc-encounter.js — encounter-builder tray on the Bestiary page. Math in
 * sc-encounter-core.js. Items come from the page's .sc-browse-data island;
 * "+" clicks arrive by delegation (the results table re-renders per filter).
 * instant-nav safe: document$-driven, idempotent, teardown on swap. */
(function () {
  "use strict";
  const KEY = "sc-encounter";
  let teardown = null;

  function load() {
    try {
      const o = JSON.parse(localStorage.getItem(KEY));
      if (o && o.v === 1) return o;
    } catch (_) {}
    return { v: 1, party: { n: 5, lvl: 1, vic: 0 }, picks: [] };
  }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
  function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function readItems(mount) {
    const el = mount.querySelector(".sc-browse-data");
    try { return JSON.parse(el.textContent) || []; } catch (_) { return []; }
  }

  function init() {
    if (teardown) { teardown(); teardown = null; }
    const mount = document.querySelector(".sc-bestiary-mount");
    document.querySelectorAll(".sc-enc").forEach(n => n.remove());
    if (!mount || !window.SCEncounter) return;
    const E = window.SCEncounter;
    const items = readItems(mount);
    const byHref = {}, bySlug = {};
    items.forEach(it => { byHref[it.href] = it; bySlug[E.slug(it.href)] = it; });

    let state = load();

    // hydrate from ?enc= share links (overrides stored picks)
    const share = new URLSearchParams(location.search).get("enc");
    if (share) state.picks = E.decodeShare(share, bySlug);

    const tray = document.createElement("aside");
    tray.className = "sc-enc";
    document.body.appendChild(tray);

    function render() {
      const p = state.party;
      const hES = E.heroES(p.lvl), pES = E.partyES(p.n, p.lvl, p.vic);
      const b = E.bands(pES, hES), total = E.totalEV(state.picks);
      const diff = E.classify(total, b);
      let rows = state.picks.map(function (pk) {
        const warn = E.levelWarn(pk.level, p.lvl, pk.organization) ? ' <span class="warn" title="Above recommended level">⚠</span>' : "";
        return '<div class="sc-enc__row" data-href="' + esc(pk.href) + '">' +
          '<a href="' + esc(pk.href) + '">' + esc(pk.name) + "</a>" + warn +
          '<span class="cost">' + E.pickCost(pk) + " EV</span>" +
          '<span class="ct"><button type="button" data-d="-1">−</button><b>' + pk.count +
          '</b><button type="button" data-d="1">+</button></span></div>';
      }).join("");
      if (!state.picks.length) rows = '<p class="sc-enc__empty">Press + on any creature row.</p>';
      tray.innerHTML =
        '<header class="sc-enc__head"><b>Encounter</b>' +
        '<span class="sc-enc__diff" data-diff="' + diff + '">' + total + " / " + pES + " EV · " + diff + "</span>" +
        '<button type="button" class="sc-enc__toggle">▾</button></header>' +
        '<div class="sc-enc__body">' +
        '<div class="sc-enc__party">' +
        lbl("Heroes", "n", p.n, 1, 8) + lbl("Level", "lvl", p.lvl, 1, 10) + lbl("Victories", "vic", p.vic, 0, 12) +
        "</div>" + rows +
        '<div class="sc-enc__bands">Trivial ≤ ' + b.trivialMax + " · Easy < " + b.easyMax +
        " · Standard ≤ " + b.standardMax + " · Hard ≤ " + b.hardMax + " · Extreme ></div>" +
        '<div class="sc-enc__actions">' +
        '<button type="button" class="sc-enc__share">Copy share link</button>' +
        '<button type="button" class="sc-enc__md">Copy as markdown</button>' +
        '<button type="button" class="sc-enc__clear">Clear</button></div></div>';
      tray.classList.toggle("is-empty", !state.picks.length);
    }
    function lbl(t, k, v, min, max) {
      return '<label>' + t + ' <input type="number" data-party="' + k + '" min="' + min +
        '" max="' + max + '" value="' + v + '"></label>';
    }

    function onClick(ev) {
      const add = ev.target.closest(".sc-enc-add");
      if (add && byHref[add.dataset.href]) {
        state.picks = E.addPick(state.picks, byHref[add.dataset.href]);
        save(state); render(); return;
      }
      if (!tray.contains(ev.target)) return;
      const step = ev.target.closest("[data-d]");
      if (step) {
        const row = step.closest(".sc-enc__row");
        const pk = state.picks.find(x => x.href === row.dataset.href);
        const d = parseInt(step.dataset.d, 10) * (E.isMinion(pk) ? 4 : 1);
        state.picks = E.setCount(state.picks, row.dataset.href, pk.count + d);
        save(state); render(); return;
      }
      if (ev.target.closest(".sc-enc__clear")) { state.picks = []; save(state); render(); return; }
      if (ev.target.closest(".sc-enc__toggle")) { tray.classList.toggle("is-min"); return; }
      if (ev.target.closest(".sc-enc__share")) {
        const url = location.origin + location.pathname + "?enc=" + E.encodeShare(state.picks);
        navigator.clipboard.writeText(url); return;
      }
      if (ev.target.closest(".sc-enc__md")) {
        const md = state.picks.map(p => "- " + p.count + "× " + p.name + " (" + E.pickCost(p) + " EV)").join("\n") +
          "\n\nTotal: " + E.totalEV(state.picks) + " EV";
        navigator.clipboard.writeText(md); return;
      }
    }
    function onInput(ev) {
      const f = ev.target.closest("[data-party]");
      if (!f) return;
      state.party[f.dataset.party] = parseInt(f.value, 10) || 0;
      save(state); render();
    }

    document.addEventListener("click", onClick);
    tray.addEventListener("input", onInput);
    teardown = function () {
      document.removeEventListener("click", onClick);
      tray.remove();
    };
    render();
  }
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init);
})();
```

- [ ] **Step 2: Stylesheet**

`v2/docs/stylesheets/steel-encounter.css`:

```css
/* steel-encounter.css — the encounter-builder tray (sc-encounter.js) + the
   "+" column in the bestiary results table. */
.sc-enc-cell { width: 2rem; text-align: center; }
.sc-enc-add {
  border: 1px solid var(--md-default-fg-color--lightest); border-radius: .3em;
  background: none; cursor: pointer; width: 1.5rem; height: 1.5rem; line-height: 1;
  color: var(--md-default-fg-color--light);
}
.sc-enc-add:hover { color: var(--md-accent-fg-color); border-color: currentColor; }

.sc-enc {
  position: fixed; right: 1rem; bottom: 1rem; z-index: 20; width: 21rem; max-width: 92vw;
  border: 1px solid var(--fx-metal-line); border-radius: .6rem;
  background: var(--md-default-bg-color); box-shadow: 0 4px 18px rgba(0,0,0,.35);
  font-size: .72rem;
}
.sc-enc.is-empty .sc-enc__body { display: none; }
.sc-enc.is-min .sc-enc__body { display: none; }
.sc-enc__head { display: flex; gap: .6rem; align-items: center; padding: .5rem .8rem; cursor: default; }
.sc-enc__head b { font-family: var(--md-small-header-font); }
.sc-enc__diff[data-diff="Standard"] { color: var(--md-accent-fg-color); }
.sc-enc__diff[data-diff="Hard"], .sc-enc__diff[data-diff="Extreme"] { color: #e06060; }
.sc-enc__toggle { margin-left: auto; background: none; border: 0; cursor: pointer; color: inherit; }
.sc-enc__body { padding: 0 .8rem .7rem; }
.sc-enc__party { display: flex; gap: .6rem; margin-bottom: .5rem; }
.sc-enc__party input { width: 3.2rem; }
.sc-enc__row { display: flex; gap: .5rem; align-items: baseline; padding: .15rem 0; }
.sc-enc__row .cost { margin-left: auto; color: var(--md-default-fg-color--light); }
.sc-enc__row .ct button { background: none; border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: .3em; cursor: pointer; width: 1.3rem; }
.sc-enc__row .ct b { margin: 0 .3rem; }
.sc-enc__row .warn { cursor: help; }
.sc-enc__bands { margin-top: .5rem; color: var(--md-default-fg-color--light); }
.sc-enc__actions { display: flex; gap: .4rem; margin-top: .5rem; }
.sc-enc__actions button { border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: .35em; background: none; cursor: pointer; padding: .2rem .5rem; color: inherit; }
.sc-enc__actions button:hover { color: var(--md-accent-fg-color); border-color: currentColor; }
@media (max-width: 45em) { .sc-enc { right: .5rem; bottom: .5rem; } }
```

- [ ] **Step 3: Register in mkdocs.yml**

extra_javascript, directly after `- javascripts/steel-bestiary-browser.js`:
```yaml
  - javascripts/sc-encounter-core.js
  - javascripts/sc-encounter.js
```
extra_css, at the end: `- stylesheets/steel-encounter.css`.

- [ ] **Step 4: Build + verify the whole flow**

Serve locally, open `/Bestiary/`:
1. Add 4× Goblin Warrior (click + on its row four times) → tray shows "Goblin Warrior 3 EV ×4" wait — EV 3 each, cost 12 EV total; header shows `12 / 30 EV · Trivial` at the default party (5 heroes, level 1 → pES 30, hES 6, trivial ≤ 24 — so 12 is Trivial).
2. Add a minion (e.g. Bugbear Mob, "7 for four minions") → lands at count 4, cost 7; +/− steps by 4.
3. Set party to 5 × level 1, add up to ~31 EV → badge flips Standard; ~37 → Hard (bands 24/30/36/48).
4. A level-4 creature at hero level 1 shows the ⚠ marker.
5. "Copy share link" → paste in a new tab → same picks appear (URL hydration).
6. "Copy as markdown" → clipboard has the list + total.
7. Reload → picks persist (localStorage).
8. Navigate to Browse and back → exactly one tray, no duplicate handlers (single add per click).

- [ ] **Step 5: Run all JS tests; commit**

```bash
cd v2 && devbox run -- node --test tests/
git -C v2 add docs/javascripts/sc-encounter.js docs/stylesheets/steel-encounter.css mkdocs.yml
git -C v2 commit -m "feat: encounter-builder tray (EV budget, difficulty bands, share links)"
```

---

### Task 4: "Add to encounter" from statblock pages (optional, do last)

**Files:**
- Modify: `v2/docs/javascripts/sc-encounter.js`

Statblock pages carry everything needed in the DOM: name (`.sb__head .sc-head__left-primary`), EV (`.sb__head .sc-head__right-deck`, text `EV 3`), level (`.sc-head__right-eyebrow`, `Level 1`), org/role in `.sc-head__right-primary` (e.g. "Horde Harrier" — organization is the first word). The tray itself only lives on `/Bestiary/`; on statblock pages we only append the pick to localStorage and show a brief confirmation.

- [ ] **Step 1: Extend `init` in sc-encounter.js**

Add after the early-return when there's no `.sc-bestiary-mount`:

```js
    // Statblock pages: a lightweight "Add to encounter" chip in the card head.
    const sb = document.querySelector(".sb-wrap .sb__head");
    if (sb && !document.querySelector(".sc-enc-addpage")) {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "sc-enc-add sc-enc-addpage";
      btn.title = "Add to encounter"; btn.textContent = "+";
      btn.addEventListener("click", function () {
        const name = (sb.querySelector(".sc-head__left-primary") || {}).textContent || document.title;
        const evM = /EV\s*(\S+)/.exec((sb.querySelector(".sc-head__right-deck") || {}).textContent || "");
        const lvM = /Level\s*(\d+)/i.exec((sb.querySelector(".sc-head__right-eyebrow") || {}).textContent || "");
        const org = ((sb.querySelector(".sc-head__right-primary") || {}).textContent || "").split(/\s+/)[0];
        const s = load();
        s.picks = window.SCEncounter.addPick(s.picks, {
          href: location.pathname, name: name.trim(),
          ev: evM ? evM[1] : "", organization: org, level: lvM ? lvM[1] : "1",
        });
        save(s);
        btn.textContent = "✓"; setTimeout(function () { btn.textContent = "+"; }, 1200);
      });
      sb.appendChild(btn);
    }
```

Caveat: picks added from a page use `location.pathname` as href while Bestiary picks use the island's relative href — normalize in `addPick` consumers by comparing `E.slug(href)` when deduping, or simpler: store `href: location.pathname` and accept that the same creature added from both places makes two rows (acceptable v1; note it in the commit).

- [ ] **Step 2: Verify**

On `/Browse/monster/goblin/goblin-warrior/` click the head "+" → "✓" flashes; open `/Bestiary/` → Goblin Warrior in the tray with correct EV.

- [ ] **Step 3: Commit + land**

```bash
git -C v2 add docs/javascripts/sc-encounter.js
git -C v2 commit -m "feat: add-to-encounter from statblock pages"
just wt-finish p8-encounter
```

**Post-deploy:** repeat the Task 3 Step 4 flow on the live site (instant-nav duplicate-handler check especially).
