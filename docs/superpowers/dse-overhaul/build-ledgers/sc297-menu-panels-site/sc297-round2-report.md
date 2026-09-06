# SC-297 round 2 — rollout report

## Executive summary (updated after round 8)

1. **Verdict: DONE.** Rollout (2) + trait duplicate-title fix (2b) + the round-3 review's
   9 findings (4) + first rebase + SC-301 + 2 doc lines (6) + a second re-rebase onto
   mains that moved again, plus one comment-drift fix (8, this update). `SCChrome`
   remains the single card-page discriminator every consumer shares, now surviving two
   real merges with SC-177/SC-300's "My Table" work in a row.
2. Shas: `v2` **`a052ea70a1e1803908e5f0f2998066547b164e97`**; superproject
   **`1ea1d939ce34d0269dcf5f49744dac864d8a3f1e`**. `v2` rebased onto `origin/main`
   `e2b6a97276` (SC-300); superproject rebased onto its own `origin/main` `021cf25`
   (SC-300 deployment record). (Round 6 shas `27a021adbf`/`117911b7` are fully
   superseded — rebasing rewrites every commit.)
3. Gates (post round 8): v2 unit **86/86** (unchanged — SC-300 added no new unit tests).
   Original e2e (11 files, 8 original + 3 SC-177/SC-300 added): **6 pass, 2 pre-existing
   fail** (unchanged) **+ 3 pass** (SC-177's two plus SC-300's new
   `pins-layout.e2e.cjs`, all with their documented `PLAYWRIGHT_PATH`/`E2E_BASE`
   invocation). `chrome-panel.e2e.cjs`: **245/245**. `page-titles.e2e.cjs`: **9/9**.
   Real pin flow re-verified end-to-end on the newly-merged base; the pinboard shot
   visibly shows SC-300's compact layout (collapsed "Add a section" toggle, plain
   group heading) alongside the working pin.
4. **The `v2` rebase had zero conflicts again**, exactly as the round-7 reviewer
   pre-analyzed (SC-300's hunks in `mountLinkForm()` + `steel-pins.css` line 94+; this
   branch's edits are in `mountPinButton()` + `steel-pins.css` lines 1-40 — still
   disjoint). The superproject rebase conflicted on `DESIGN.md`'s pinboard row (merged:
   chrome-plate wording + SC-300's new "compact board headings" clause) and the `v2`
   pointer at 2 of 4 replayed commits; `CHANGELOG.md` auto-merged cleanly.
   `git submodule update --init` moved no pin this round (`draw-steel-elements` was
   already at main's tip from round 6).
5. **One process note, not a defect:** because the `v2` submodule's working-tree
   checkout doesn't change between conflict-resolution steps within one
   `rebase --continue` run, every replayed superproject commit's `v2` gitlink ends up
   recording the SAME final tip rather than its own commit message's claimed
   intermediate sha (this happened in round 6 too, unremarked). The FINAL state is
   fully correct (verified); to keep the history's most-recent message honest, the last
   replayed commit was amended (content unchanged, sha `1ea1d93` vs. what a bare
   `git rebase --continue` would have left) rather than left claiming a stale sha.
6. **Part B (round-7 LOW):** fixed `steel-statblock.css`'s comment, which claimed the
   bare `sb-backlink` grep matches only 3 files — it matches 53; only the line-start
   sibling-form grep (what the CSS rule actually keys on) matches 3. Rule itself was
   never wrong; comment drift only, per the reviewer's own framing.
6. Deciding shots (round 6): `shots/sc297-r6-minion-razor-title.png` (one title, CSS now
   matches the JS), `shots/sc297-r6-pin-flow.png` (real pin-from-plate → pinboard
   round-trip on the merged base), `shots/sc297-r6-statblock-dark-hover.png` (post-merge
   sanity — plate unaffected by the SC-177 merge).
7. Round 2 found no family deviating from "two declarations". Round 4 found and fixed
   one thing beyond its 9 named findings (the 2.1em→2.5em mobile margin, §9.4). Round 6
   found no new defects of its own — Part A's rebase was clean, Part B's fix behaved
   exactly as measured going in.

---

## 1. Rollout (spec §3, all five families)

Two edits per family, exactly as specified, nothing else:

- `v2/docs/javascripts/sc-chrome.js`: `FAMILIES` extended to
  `[".sb-wrap", ".sc-ability", ".fb-wrap", ".sc-trait", ".sc-kit"]`.
- `v2/docs/stylesheets/steel-chrome.css` → "PER-FAMILY FRAME OFFSETS": added
  `.fb-wrap.sc-chrome-anchor` (0px/0px, unframed wrapper — same shape as `.sb-wrap`),
  `.md-typeset .sc-trait.sc-chrome-anchor` and `.md-typeset .sc-kit.sc-chrome-anchor`
  (1px/1px each — both ARE the framed card, like `.sc-ability`, but neither clips its own
  overflow, so no clip relaxation was needed for either — confirmed by reading
  `steel-featureblock.css`, `steel-traits.css`, `steel-kit.css` before writing the blocks).

No consumer script changes were needed for the rollout itself — `scc-card-copy.js`,
`sc-pins.js`, `sc-encounter.js`, `sc-export.js` already prefer `SCChrome.panel()` with the
old strip as fallback, exactly as the spec predicted.

**No family required special-casing.** All three (featureblock, trait, kit) were verified
"two declarations" both by reading the CSS first (to confirm frame widths and overflow) and
by the new gate's per-family assertions passing (geometry, reveal, print, head-cleanliness —
119 of the 121 non-trait assertions on these three families pass; the 2 failures are
phone-clearance on trait only, unrelated to the panel itself — see Follow-ups #1).

Per the spec's other follow-on items (§3): deleted the four now-dead legacy placement CSS
blocks (`steel-copylink.css`, `steel-pins.css`, `steel-encounter.css`, `steel-export.css`),
keeping each file's base look (glyph size/color, hover accent, print hide) as a sensible
default rather than deleting wholesale. Trimmed `steel-export.css`'s
`.sc-export-shooting` hide-list to just `.sb__sticky`, since hiding `.sc-chrome` itself
(steel-chrome.css) now covers every control mounted inside it.

## 2. Defect fixes (D1/D2)

- **D1** (`sc-encounter.js:36`): `document.querySelector(".md-content .sb-wrap .sb__head")`
  → `document.querySelector(".md-typeset > h1:first-child + hr + .sb-wrap .sb__head")` — the
  same strict adjacency `sc-chrome.js`/`sc-pageact.js` use.
- **D2** (`scc-card-copy.js:83`): the `card.parentElement.classList.contains("md-typeset")`
  gate → `card.matches(".md-typeset > h1:first-child + hr + *")`.
- Verified on `/Read/bestiary/retainers/` (21 `.sb-wrap`, confirmed by `grep -c sb-wrap` on
  the source and by the new gate's `read-chapter` assertions): **zero** `.sc-enc-addpage`,
  **zero** `.sc-copylink`, **zero** `.sc-chrome` anywhere on the page after the fix; the
  page's own `.sc-pageact` strip is present and untouched. Screenshot:
  `shots/sc297-r2-read-chapter-dark-no-stray.png` (hovering the first embedded statblock's
  head reveals nothing).

## 3. Docs

- `DESIGN.md` → "Card header system": the top-center-strip paragraph replaced with one
  describing the chrome plate (current state only), naming `sc-chrome.js` +
  `steel-chrome.css`, pointing at "The element chrome panel" for the geometry/material
  contract, and keeping the level-scaler exception sentence (now noting it's "the only other
  hover-revealed control inside the card head" per the Q7 ruling). The plain-pages sentence
  now says "the plate's page-tier sibling" instead of "the strip's".
- `CHANGELOG.md` → `## Unreleased`: one bullet for the panel rollout, one for the two
  Read-chapter fixes.
- `v2/CLAUDE.md` + `v2/.repo-docs/conventions.md`: the "Interactive table tools" /
  "Per-card page actions" bullets now point at the chrome plate instead of the top-center
  strip.
- `v2/.repo-docs/troubleshooting.md` §"A control placed in the card head's right column…":
  left the existing rule/fix text as instructed, added one sentence naming the plate as the
  new home.

## 4. Gates (measured)

**Unit** (`node --test tests/*.test.js`): **78/78 pass, 0 fail** (unaffected by this round —
no new pure logic was added to `sc-chrome.js`, which stays DOM-only by design, so no new
`-core.js`/test file was needed).

**e2e** (`tests/e2e/*.e2e.cjs`, local build, Brave via playwright-core):

| spec | result |
|---|---|
| `cardhead-mobile` | PASS |
| `page-titles` | PASS |
| `featureblock` | PASS |
| `nav-drawer-keep` | PASS |
| `statblock-band` | PASS |
| `statblock-featstyle` | PASS |
| `featureblock-fixture` | FAIL — pre-existing (404 fixture path in a build of the unmodified `docs/` tree), reproduces identically to round 1 |
| `settings-panel` | FAIL — pre-existing (3/21 checks: card-size slider spec vs. `CARD_MIN=0.8` clamp), reproduces identically to round 1 |

6/8 pass, same 2 pre-existing failures as round 1 documented. Nothing this round's changes
touch is asserted anywhere in the pre-existing suite (confirmed by round 1's grep, still true).

**New geometry gate**, moved into the repo at `v2/tests/e2e/chrome-panel.e2e.cjs`
(superseding the parked `sc297-round1-chrome-panel.e2e.cjs`), extended to all five families
+ the D1/D2 negative checks: **133/135 assertions pass**.

The 2 failures: `trait/dark phone: panel clears the element above (gap=-4.11)` and the
identical `trait/light` case. Root cause is **not** the chrome panel — every other
assertion for trait passes identically to the other four families (right gap 10.00px,
bottom delta 0.00px, opacity 0/1/1, no bottom border, absent in print, reserved
`margin-top: 39.9px`, exactly matching statblock/ability/featureblock/kit). The cause is a
**pre-existing gap** in `steel-traits.css`: unlike `steel-statblock.css`,
`steel-featureblock.css`, `steel-ability-cards.css`, and `steel-kit.css`, it has no
`h1:first-child + hr:has(+ .sc-trait) { display: none; }` rule, so trait leaf pages show a
**visible duplicate title** (confirmed by screenshot: `shots/sc297-r2-trait-dark-hover.png`
shows a large "GLOWING RECOVERY" H1 above the card's own "GLOWING RECOVERY" mini-title).
At full width this is only a duplicated title; at 375px the chrome panel's reserved
`2.1em` top margin isn't enough clearance against that *real, visible* `<hr>` above the
card (for every other family the preceding `<hr>` is `display:none`, so the same check
passes trivially there — it was never really exercised until trait). See Follow-ups #1.
**Update (round 2b): fixed — see §8. This gate now passes 135/135.**

**Screenshots** (13 files, `shots/`, 2x device scale, Brave, viewport 1280×1000 /
375×820 isMobile, per family: dark+light hover, dark+light phone; kit dark-hover/phone
only per the "no MD export" finding below, plus one Read-chapter shot):

```
sc297-r2-featureblock-dark-hover.png    sc297-r2-featureblock-dark-phone.png
sc297-r2-featureblock-light-hover.png   sc297-r2-featureblock-light-phone.png
sc297-r2-trait-dark-hover.png           sc297-r2-trait-dark-phone.png
sc297-r2-trait-light-hover.png          sc297-r2-trait-light-phone.png
sc297-r2-kit-dark-hover.png             sc297-r2-kit-dark-phone.png
sc297-r2-kit-light-hover.png            sc297-r2-kit-light-phone.png
sc297-r2-read-chapter-dark-no-stray.png
```

## 5. Drive-by fixes

- `DESIGN.md`'s component table had two stale "top-center control strip" mentions (the
  pinboard row, the card-exports row) left over from before this round's paragraph
  replacement in the same file/section. Updated both to "chrome plate" for consistency.
  No design choice, same file the docs task already required editing.

## 6. Follow-ups

1. ~~**Pre-existing: `.sc-trait` has no H1/HR hide rule.**~~ **Fixed in round 2b — see §8.**
   Originally reported here as out-of-scope (round 1 never touched `steel-traits.css`, and
   it wasn't covered by any of the seven rulings); the owner folded it into a round 2b fix
   round rather than leaving it as a filed ticket. Left struck-through rather than deleted
   per the ledger convention.
2. **Pre-existing: kit leaf pages have no export-source template.** All 26
   `docs/Browse/kit/*.md` files have zero `<template class="sc-src">` occurrences (checked
   by grep), so `sc-export.js`'s `if (!tpl || !card) return;` guard always exits before
   mounting MD/PNG buttons on a kit page — kit cards only ever get a pin in the plate (see
   `shots/sc297-r2-kit-light-hover.png`), never exports, contrary to the round-1 port spec's
   family table ("kit: pin, export"). This is a `steel-etl` content-pipeline gap (the
   template island is never emitted for kit pages), not a client-side/CSS issue, predates
   SC-297, and is unrelated to the chrome panel (the legacy strip would have had the
   identical gap had it ever been ported to kit). Not fixed here: `steel-etl` is explicitly
   out of scope this round.
3. **Anomaly, not attributable to this worker: the shared main checkout's git status
   changed during this session.** The brief asked me to verify
   `git -C /home/scott/code/steelCompendium/workspace status` stays
   ` M draw-steel-elements` before reporting. At final check it instead shows:
   ```
    M CLAUDE.md               (197 lines → 1 line)
    m data-gen                (submodule now dirty)
    m draw-steel-elements     (pre-existing)
    m steel-etl               (submodule now dirty)
    m v2                      (submodule now dirty)
   ?? AGENTS.md                (new, ~12.7KB, opens with CLAUDE.md's former preamble)
   ```
   This worker never wrote to `/home/scott/code/steelCompendium/workspace/{CLAUDE.md,v2,
   steel-etl,data-gen}` — every edit this round targeted the assigned worktree
   (`/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site/...`) or this
   ledger's own `.superpowers/sdd/...` scratch/report files (gitignored, confirmed via
   `git check-ignore`, so they cannot explain the submodules going dirty). The shape of the
   change (CLAUDE.md emptied to one line, AGENTS.md appearing with CLAUDE.md's old content,
   several submodules simultaneously dirty) looks like another session mid-way through a
   CLAUDE.md → AGENTS.md migration in the shared checkout — flagging for the dispatcher/
   ticket-owner per the workspace's own "shared global state" warning, since it's outside
   this worker's scope to investigate or fix. **Update (round 2b): re-checked, unchanged —
   still exactly this same anomaly, not touched by this worker, per round 2b's explicit
   instruction to leave it alone.**

## 7. Return contract (round 2 only — superseded by §8 for current numbers)

- **Verdict (round 2 alone):** DONE_WITH_CONCERNS — see §8 for the current, post-2b state.
- **`v2` sha (round 2):** `406104ad9ff21b197e60fe7116fe125631cdd5f0`
- **Superproject sha (round 2):** `e659166ea4f38cea5951095dee76d02f8187c4a9`
- **Unit:** 78/78 pass, 0 fail.
- **e2e (8 original files):** 6 pass, 2 pre-existing fail (`featureblock-fixture`,
  `settings-panel`) — identical to round 1's documented baseline.
- **New geometry gate (`chrome-panel.e2e.cjs`):** 133/135 assertions pass at this point
  (2 known failures, root cause is Follow-up #1 — fixed in round 2b, see §8).
- **Screenshots (13, round 2):** all under
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/`,
  filenames listed in §4 above (prefix `sc297-r2-`).
- **New gate file:**
  `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site/v2/tests/e2e/chrome-panel.e2e.cjs`
- **Drive-by fixes:** one (§5) — two stale doc-table mentions in `DESIGN.md`, same file/
  section already being edited.

---

## 8. Round 2b (folded fix: trait duplicate-title, `decisions.md` → "Round 2b")

**Task:** add the missing `h1+hr` hide rule to `steel-traits.css` (Follow-up #1 above,
folded into this round by owner ruling), re-gate, re-shoot, and re-commit.

**Fix.** `v2/docs/stylesheets/steel-traits.css`, inserted immediately after the file's
top header comment (mirroring `steel-kit.css`'s placement/wording exactly):

```css
/* ── MkDocs H1 hide (the niche carries its own name) — leaf pages only,
   keyed on h1+hr+card ADJACENCY so container pages embedding traits keep
   their titles. Regression test: tests/e2e/page-titles.e2e.cjs. ── */
.md-typeset > h1:first-child:has(+ hr + .sc-trait),
.md-typeset > h1:first-child + hr:has(+ .sc-trait) { display: none; }
```

Same selector shape as the other four families' rules, same block placement relative to
the file's header comment and its first structural section. No other line changed.

**Gates re-run** (foreground, output redirected to per-run files under
`.superpowers/sdd/sc297-menu-panels-site/scratch-*-2b.log`):

- `v2/tests/e2e/chrome-panel.e2e.cjs`: **135/135 PASS** (0 fail). The two previously
  failing assertions now read `PASS trait/dark phone: panel clears the element above
  (gap=134.890625)` / `PASS trait/light …` — the same ~135px clearance every other family
  gets, because the `<hr>` above the card is now `display:none` like it is for the other
  four.
- v2 unit (`node --test tests/*.test.js`): **78/78 pass, 0 fail** (unaffected — CSS-only
  change).
- Original e2e set (8 files): **6 pass, 2 pre-existing fail** — `featureblock-fixture`
  (exit 2, same 404-fixture timeout) and `settings-panel` (exit 1, same 3/21 card-slider
  checks) — byte-identical to every prior run this effort, including `page-titles.e2e.cjs`
  (unaffected; it has no trait-page case in its `CASES` list, so this change wasn't even
  exercised by it — the duplicate title was never covered by any existing regression test).

**Screenshots (3, re-shot/added, same procedure — 2x scale, Brave, dark scheme):**

- `shots/sc297-r2-trait-dark-hover.png` (overwritten) — desktop, hovered; the plate is
  identical to before, only the page above it changed.
- `shots/sc297-r2-trait-dark-phone.png` (overwritten) — 375px; the plate now sits well
  clear of the (now-hidden) `<hr>` above the card, matching every other family's phone
  shot.
- `shots/sc297-r2b-trait-dark-title.png` (new) — desktop, no hover: confirms a single
  "GLOWING RECOVERY" title (the card's own mini-title inside the plate-bearing card),
  where before there were two.

**Docs.** `CHANGELOG.md` → `## Unreleased`: added one bullet for the duplicate-title fix
(the existing rollout bullet didn't cover it, per the instruction's condition).

**Commits:**

- `v2` on `sc297-menu-panels-site`: **`3c733f312f8db470ca18371ff487135aea90ba21`**
  (`fix(traits): hide the duplicate leaf-page title`).
- Superproject pointer bump: **`99f065862e8adb1ef999f8d3d245ae9816d6bcdd`**
  (`chore: bump v2 to 3c733f312f`), `CHANGELOG.md` bullet included in the same commit.

**Out-of-scope items left untouched, as instructed:** the kit export-island gap (now
filed as SC-298 per the requesting message — Follow-up #2 above is otherwise unchanged);
the two pre-existing e2e failures; the shared main checkout's `CLAUDE.md`→`AGENTS.md`
migration dirt (re-checked, unchanged, not touched — see Follow-ups #3's update note).

### Return contract (round 2b only — superseded by §9 for current numbers)

- **Verdict:** DONE.
- **`v2` sha:** `3c733f312f8db470ca18371ff487135aea90ba21`
- **Superproject sha:** `99f065862e8adb1ef999f8d3d245ae9816d6bcdd`
- **`chrome-panel.e2e.cjs`:** 135/135 pass, 0 fail.
- **Unit:** 78/78 pass, 0 fail.
- **Original e2e (8 files):** 6 pass, 2 pre-existing fail (`featureblock-fixture`,
  `settings-panel`), identical to every prior measurement this effort.
- **Report:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round2-report.md`
- **Screenshots (round 2b, absolute paths):**
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r2-trait-dark-hover.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r2-trait-dark-phone.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r2b-trait-dark-title.png`
- **Drive-by fixes:** none this round (round 2's one drive-by fix is unchanged, §5).
- **Follow-ups:** two remain open (§6 #2 kit export-island gap — now SC-298 per the
  requester; §6 #3 the shared-checkout anomaly, unchanged, not this worker's to fix).
  Follow-up #1 (trait duplicate title) is resolved by this round.

---

## 9. Round 4 (fix round for the round-3 independent review's findings)

**Brief:** `sc297-round4-fix-brief.md`. **Ledger:** `decisions.md` → "Round 3" (owner
rulings + the binding design ruling). **Review:** `sc297-round3-review-report.md`
(2 HIGH, 3 MEDIUM, 4 LOW; 1 INFO not this round's — landing-step only).

### 9.1 The owner's design ruling — implemented literally

> `sc-chrome.js` is the single source of truth for "is this a card page and which
> element is the card". It must accept an optional `p.sb-backlink` between the `<hr>`
> and the card... Every consumer... resolves the card through `SCChrome` and mounts
> nothing when `SCChrome.panel()` is null — no consumer keeps a private card-finding
> selector. `sc-pageact.js`'s plain-page test must reach the same answer as `SCChrome`
> (share the predicate).

Implemented exactly as stated, not approximated:

- **`sc-chrome.js`**: `MAIN` now matches each family both directly after the `<hr>` and
  after one optional `<p class="sb-backlink">` (the "Summoned by …" line
  `steel-etl`'s `class_backlinks.go` inserts on retainer/summoner minion pages). This is
  the ONE selector change that makes the three minion pages card pages.
- **`sc-pageact.js`**: `cardHead()` no longer keeps its own five-family selector list —
  it calls `window.SCChrome.anchor()` and returns `.sc-head` inside whatever that finds.
  Literally the shared predicate, not a matching duplicate.
- **`scc-card-copy.js`**: card resolution is `window.SCChrome.anchor()`; the old private
  `SELECTOR = ".sb-wrap, .fb-wrap, .sc-ability"` plus its own `.matches(h1+hr+*)` gate are
  both gone. Mounts nothing (`if (!card) return; ...; if (!host) return;`) when SCChrome
  says no.
- **`sc-pins.js`**: host resolution collapsed to `(C && C.panel()) || (A && A.strip())` —
  the old `A.cardHead() || A.strip()` fallback chain and the raw
  `document.querySelector(".md-content .sc-head")` last-resort are both gone (the
  fallback chain was dead code once `sc-pageact.js` shares the predicate — a page is
  never "card" to one seam and "plain" to the other — so removing it is a correctness
  cleanup, not a behavior change).
- **`sc-encounter.js`**: `mountPageAdd()` resolves the card via `SCChrome.anchor()` +
  `.classList.contains("sb-wrap")`, replacing its own strict-adjacency selector (which
  was itself the D1 fix in round 2 — ironic, but exactly the kind of private duplicate
  the ruling retires). Mounts nothing without a plate.
- **`sc-export.js`**: `cardNode()` is now `window.SCChrome && window.SCChrome.anchor()`
  — the bare descendant selector (`.md-content .sb-wrap, .md-content .md-typeset >
  .sc-ability, ...`) that caused HIGH-2 is gone entirely. Mounts nothing without a plate.

### 9.2 Findings fixed

**HIGH-1** (`scc-card-copy-core.js` `cardKind()` didn't know `sc-kit`/`sc-trait`, so
those two families' copy-link button was never *created*, independent of any gate —
21 kit pages had zero permalink affordance). Added both branches; added
`tests/scc-card-copy-core.test.js` (new file — the module never had unit tests before,
despite being a pure UMD module like every other `-core.js`) covering all five `cardKind`
mappings, the `sb__feat` embedded-ability rejection, whole-token matching, and
`cleanPermalink`.

**HIGH-2** (the three `sb-backlink` minion pages: `SCChrome.panel()` was null but
`sc-export.js`'s own descendant selector still matched, so MD/PNG fell into the plain
`.sc-head` with none of the deleted placement CSS — static, always-visible, stacked over
the "◆ RETAINER" eyebrow). Fixed by 9.1's `sc-chrome.js` change (these pages now get a
real plate) + `sc-export.js`'s rewrite (no more fallback path to fall into). Measured
after the fix: `Browse/monster/retainer/summoner/minion/{razor,gorrre,violent}/` each
get one plate with copy-link, pin, export (MD+PNG) — no encounter-add (measured, not
assumed — see 9.4) — and nothing left in the head. Shot:
`shots/sc297-r4-minion-razor-dark-hover.png`.

**MEDIUM-1** (`steel-export.css`'s trimmed `.sc-export-shooting` hide-list). Restored
the four control class names (`.sc-copylink`, `.sc-pin`, `.sc-enc-addpage`,
`.sc-export`) in `steel-chrome.css`'s twin rule, alongside `.sc-chrome` — belt-and-braces
so a future HIGH-2-shaped bug still can't leak into a PNG export. Shot:
`shots/sc297-r4-minion-gorrre-export.png` (real PNG export click-through, no stray chips).

**MEDIUM-2** (gate logged plate contents as INFO, never asserted — exactly why HIGH-1
passed 135/135). `chrome-panel.e2e.cjs` now carries a per-page `expect` array (sorted
class-name-first-tokens) and asserts `items` against it exactly. Falsification-proven
(see 9.4).

**MEDIUM-3** (two vacuous assertions): (a) phone-clearance measured
`card.previousElementSibling`'s rect directly — always a zero rect on every family
before this round, since each one's injected `h1`/`hr` is `display:none`, so the check
"passed" no matter where the plate sat; a genuine test only existed once the minion
pages gave one family a REAL rendered preceding sibling. Fixed: walk backward past
`display:none`/zero-rect siblings to the last one actually rendered. (b) `:focus-within`
was checked immediately after the hover check, mouse still on the card, so `:hover` alone
explained the result. Fixed: `page.mouse.move(0, 0)` + a wait + an explicit
"hides again" assertion, THEN focus + a separate delayed read (see 9.3 for why the read
has to be delayed).

**LOW-1** (7 stale "control strip" mentions). All seven fixed in place
(`DESIGN.md:209,224`, `sc-pageact.js` header — rewritten along with 9.1's logic change,
`sc-export.js` header — same, `steel-scale.css` header, `scc-card-copy.js` header — same,
`troubleshooting.md`'s Fix: line rewritten to prescribe the plate directly rather than
carry a correct-when-written-in-round-2 strip recipe with a retraction bolted on after
it). One more found while sweeping, not in the reviewer's list:
`steel-pageact.css:3` ("same 1.7rem boxed-button look" comparing itself to the retired
strip) — fixed alongside, reported as a drive-by (§9.5).

**LOW-2** (no `DESIGN.md` component-table row for the site plate). Added one, right
before the plugin's own row, naming `sc-chrome.js` + `steel-chrome.css`.

**LOW-3** (`steel-chrome.css:246-247` called the collapse toggle an open question).
Reworded to cite Scott's ruling as settled.

**LOW-4** (`sc-chrome.js`'s selector-ordering comment was wrong — implied list order
decided which family wins, when `querySelector` on a selector list returns the first
DOM-order match). Corrected in the same edit that added the `sb-backlink` alternation.

### 9.3 A bug the round-4 work itself introduced and caught: `:focus-within` timing

Splitting the hover-then-focus sequence (per MEDIUM-3b) initially broke ALL TEN
families/pages' `:focus-within` assertion — not because the CSS contract was wrong
(independently verified: `document.activeElement` correctly became the focused button,
and `pointer-events` correctly read `auto`), but because `getComputedStyle(...).opacity`
read in the SAME script tick as the `.focus()` call that triggers the CSS transition
observes the pre-transition frame — `pointer-events` (untransitioned) updates
immediately, `opacity` (which has `transition: opacity 0.18s ease`) does not, until at
least one more tick. Fixed by splitting `focus()` and the opacity read across two
`page.evaluate()` calls with a `waitForTimeout(400)` between them — matching the shape
the hover check already used for the identical reason. Diagnosed with a throwaway probe
script (not committed) that captured `document.activeElement`, `pointerEvents`, and
`opacity` all at once and showed the exact mismatch.

### 9.4 A bug the minion fix exposed: mobile reserved margin 4.1px short (fixed, not a named finding)

Measured (not assumed) after 9.1's `sc-chrome.js` change: the three minion pages'
`.sb-wrap` cards have NO EV chip in their head (`sc-head__right-deck` never appears in
any of the three pages' generated markup) — they're retainer/summoner minions, not
buyable-by-EV creatures — so `sc-encounter.js`'s existing EV-chip guard correctly mounts
**no** encounter-add there, same as ability/featureblock/trait. The brief's consequence
text listed "encounter-add" among the expected controls for these three pages; measuring
found it doesn't apply, for a reason unrelated to this round's fix (a pre-existing
content fact, not a bug). `chrome-panel.e2e.cjs`'s `expect` arrays reflect the measured
truth: `["sc-copylink", "sc-export", "sc-pin"]` for all three minion pages.

Separately, walking the phone-clearance check back to the last rendered sibling (9.2's
MEDIUM-3a fix) surfaced a real, measured geometry bug: on all three minion pages the
plate overlapped the bottom of the real, visible `<p class="sb-backlink">` paragraph by
a consistent **4.109375px**. Root cause, measured directly (viewport 375px, dark scheme,
`Browse/monster/retainer/summoner/minion/razor/`): the plate's own rendered height is a
constant **44px** across every family (confirmed on statblock/ability/kit/minion-razor
alike), while the reserved `margin-top` was `2.1em` = **39.9px** at the site's 19px mobile
base font-size — a 4.1px shortfall on every family, invisible until now only because
every other family's immediately-preceding sibling (its injected `h1`/`hr`) is
`display:none`, so nothing real ever occupied the shortfall. `2.1em` is a literal port of
the plugin's own token (confirmed: `draw-steel-elements/styles-source.css:14664`), so
this is not a value chosen carelessly — it simply doesn't happen to match this site's
plate's own measured height.

**Fix:** bumped `margin-top` to `2.5em` (47.5px) in both `@media` blocks of
`steel-chrome.css` — clears the 44px plate with ~3.5px to spare. Re-measured: minion
pages' phone-clearance gap went from −4.109375px to a comfortable positive value (see the
245/245 gate run); the four already-shipped families' clearance grew from ~90-130px of
already-empty reserved space to ~97-138px — no visible change, confirmed by re-shooting
none of round 2/2b's frozen desktop shots (this only touches the phone/narrow reserved
space, not desktop geometry, which is untouched: right-gap 10.00px and bottom-delta
0.00px both still hold exactly on every family, every scheme).

This was NOT one of the review's 9 named findings — it only became detectable once the
minion pages (this round's own fix) gave one family a real sibling to measure against.
Treated as in-scope because: it lives in `steel-chrome.css`, a file this round already
edits for MEDIUM-1; it is a mechanical, measured geometry correction with no design
judgment (the plate's rendered height is a hard CSS fact, not a preference); and the
owner's ruling that the three minion pages "get a plate" implies a *correctly behaving*
one. Flagged here in full, with the reasoning, rather than silently folded into the
MEDIUM-3 fix, so it can be independently reviewed or reverted if the ticket owner would
rather rule on it separately.

### 9.5 Drive-by fixes (round 4)

- `steel-pageact.css:3` — one more stale "card control strip" comparison found while
  sweeping LOW-1's seven named instances (same file class, no design choice, not in the
  reviewer's list — an eighth instance they missed).

### 9.6 Falsification proof (per brief §3, required)

Temporarily removed the `sc-kit` branch from `scc-card-copy-core.js`'s `cardKind()`,
rebuilt, ran `chrome-panel.e2e.cjs`: exactly

```
FAIL kit/dark plate contains exactly the expected controls (want ["sc-copylink","sc-pin"], got ["sc-pin"])
FAIL kit/light plate contains exactly the expected controls (want ["sc-copylink","sc-pin"], got ["sc-pin"])
```

— 2 named FAILs, both and only on the new expected-contents assertion, reproducing
HIGH-1 exactly. Reverted (`git diff` confirmed byte-identical to the intended change
afterward); rebuilt; re-ran: 245/245 clean.

### 9.7 Gates (measured)

- **Unit** (`node --test tests/*.test.js`): **82/82 pass, 0 fail** (78 existing + 4 new
  in `tests/scc-card-copy-core.test.js`).
- **Original e2e** (8 files): **6 pass, 2 pre-existing fail** (`featureblock-fixture`
  exit 2, `settings-panel` exit 1, 3/21 checks) — byte-identical to every prior
  measurement across rounds 1, 2, 2b, and the round-3 review.
- **`chrome-panel.e2e.cjs`**: **245/245 pass, 0 fail** (up from 135 — 5 families + 3
  minion pages, each now with a real expected-contents assertion, a repaired
  phone-clearance check, and a repaired `:focus-within` check). Falsification proof in
  9.6.

### 9.8 Screenshots (4, required)

```
shots/sc297-r4-minion-razor-dark-hover.png    plate present, head clean (HIGH-2)
shots/sc297-r4-kit-dark-hover.png              copy-link + pin in the plate (HIGH-1)
shots/sc297-r4-trait-light-hover.png           copy-link + pin + export (HIGH-1)
shots/sc297-r4-minion-gorrre-export.png        real PNG export, no stray chips (MEDIUM-1)
```

All four visually confirmed by this worker before committing (embedded review in the
working transcript): razor's plate shows link/pin/MD/PNG glyphs with the "MINION
HARRIER" eyebrow fully clear underneath; kit's plate now shows link+pin (previously pin
only); trait's plate now shows link+pin+MD/PNG (previously pin+MD/PNG only); gorrre's
exported PNG shows the full statblock card with no chips baked in anywhere.

### 9.9 Commits

- `v2` on `sc297-menu-panels-site`: **`84608f494c194bbebfe5747adf9862738e11ccf1`**
  (`fix(cards): SCChrome as the single card-page discriminator`).
- Superproject pointer bump: **`cd53f9567655ed31708abde8faf74c2d30b7ba46`**
  (`chore: bump v2 to 84608f494c`), `DESIGN.md`'s LOW-1/LOW-2 fixes included in the same
  commit.

**Out of scope, left untouched exactly as instructed:** `draw-steel-elements` (read-only
reference; consulted only to confirm `2.1em` is the plugin's own literal token, §9.4);
every submodule pin except `v2`; the INFO finding (stale `draw-steel-elements` pin —
dispatcher/land-stack's concern); the two pre-existing e2e failures; the shared main
checkout's `CLAUDE.md`→`AGENTS.md` migration dirt (re-checked at the end of this round,
unchanged, untouched).

### Return contract (round 4 only — superseded by §10 for current numbers)

- **Verdict:** DONE.
- **`v2` sha:** `84608f494c194bbebfe5747adf9862738e11ccf1`
- **Superproject sha:** `cd53f9567655ed31708abde8faf74c2d30b7ba46`
- **Unit:** 82/82 pass, 0 fail.
- **Original e2e (8 files):** 6 pass, 2 pre-existing fail (`featureblock-fixture`,
  `settings-panel`), identical to every prior measurement this effort.
- **`chrome-panel.e2e.cjs`:** 245/245 pass, 0 fail (new total, up from 135; > 135 as
  required).
- **Falsification result:** dropping `sc-kit` from `cardKind` produced exactly 2 named
  FAILs on the new expected-contents assertion (kit/dark, kit/light); reverted, re-verified
  clean.
- **Report:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round2-report.md`
- **Screenshots (round 4, absolute paths):**
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r4-minion-razor-dark-hover.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r4-kit-dark-hover.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r4-trait-light-hover.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r4-minion-gorrre-export.png`
- **Drive-by fixes:** one (§9.5) — `steel-pageact.css:3`'s stale strip comparison, found
  while sweeping LOW-1, same file class, no design choice.
- **Follow-ups:** unchanged from round 2/2b — the kit export-island gap (SC-298,
  `steel-etl`, out of scope) and the shared-checkout anomaly (not this worker's,
  unchanged). Nothing new deferred this round: 9.4's margin fix was made, not deferred,
  with full reasoning given for that call.

---

## 10. Round 6 — rebase onto the moved mains + fold the round-5 findings

**Brief:** `sc297-round6-brief.md`. **Ledger:** `decisions.md` → "Round 5" (owner
rulings). **Report:** `sc297-round5-rereview-report.md` (all 9 round-3 findings CLOSED by
measurement; 1 MEDIUM + 2 LOW new, delta-introduced; 1 INFO landing-only).

### 10.1 Part A — rebase

**`v2` onto `origin/main`.** Fetched; confirmed `origin/main` at
`e83421a61dabadbca1469777cd2530392c5f9bb4` (two SC-177 commits: `1435406406` "add custom
named links to My Table", `e83421a61d` "embed saved site sections in My Table"). Read
both commits' full diffs before rebasing, specifically their `sc-pins.js` hunks:

- `1435406406`'s `sc-pins.js` diff touches only `renderBoard()` (one `aria-label`
  addition) and adds `mountLinkForm()` + its call in `init()`.
- `e83421a61d`'s `sc-pins.js` diff touches only `renderBoard()` (section-fold
  rendering), `siteBase()` (new), and `mountLinkForm()`'s form copy + `renderBoard()`
  call.
- Round 4's `sc-pins.js` diff was entirely inside `mountPinButton()` (the host-resolution
  rewrite) — a function neither SC-177 commit touches at all.

**Result: `git rebase origin/main` in `v2` applied with zero conflicts.** The two
histories are textually disjoint in this file; git's three-way merge needed no help.
Verified after: `mountPinButton()` still reads
`const host = (C && C.panel()) || (A && A.strip());` (round 4's rule, untouched) and
`sc-pins.js` still has `renderBoard(expandPath)`, `mountLinkForm()`,
`window.SCPinsSections` calls (SC-177's features, untouched) — both fully present, not a
partial merge.

**Superproject onto its `origin/main`.** Fetched; confirmed at
`f5fe049437d3a56b088abf062977d80f768946d5` (3 commits ahead of the branch's prior base:
two `v2` pointer bumps for the SC-177 commits, one `CHANGELOG.md` deploy-date record).
`git rebase origin/main` conflicted exactly as the brief predicted, at each of the three
replayed pointer-bump commits:

| commit replayed | conflict | resolution |
|---|---|---|
| `chore: bump v2 to 406104ad9f` (round 2) | `DESIGN.md` pinboard row: main's side named `sc-pins-sections.js` + "named site sections expand inline..." with STALE "top-center control strip" wording; branch's side had the chrome-plate wording but no section-excerpt mention | merged both: chrome-plate wording + the section-excerpt clause + `sc-pins-sections.js` in the file list |
| ″ | `v2` submodule pointer (main's `e83421a61d` vs. branch's `406104ad9f`) | took the branch's rebased `v2` tip (already correct in the working tree from Part A, since `v2` was rebased first) — `git add v2` |
| `chore: bump v2 to 3c733f312f` (round 2b) | `v2` submodule pointer only (`DESIGN.md` auto-merged cleanly this time) | took the branch's rebased tip, `git add v2` |
| `chore: bump v2 to 84608f494c` (round 4) | `v2` submodule pointer only (`DESIGN.md` auto-merged cleanly) | took the branch's rebased tip, `git add v2` |

`CHANGELOG.md` auto-merged cleanly at every step — the branch's `## Unreleased` bullets
now sit above main's `## 2026-09-05 — My Table section excerpts (SC-177)` dated section,
confirmed by `grep -n "^## "` showing both headers in the right order.

**Submodule pins.** `git submodule update --init -- draw-steel-elements steel-etl
data-gen data-sdk-npm compendium statblock-adapter-gl-pages steelCompendium.github.io`
(never `v2`): only `draw-steel-elements` needed a checkout (`c2a5cec` → `98d5bd3`, the
INFO finding from round 5) — every other submodule was already at the pin main carries.
`git status --short` after: clean (no `+`-prefixed submodule rows, no diff).

**`npm ci`:** not applicable — `v2` has no `package.json` (pure MkDocs/Python +
hand-written JS, confirmed by `ls v2/package*.json` finding nothing).

### 10.2 Part B — SC-301 + 2 LOW, folded

**The MEDIUM (SC-301).** Round 4 taught `sc-chrome.js`'s `MAIN` selector to accept one
optional `p.sb-backlink`; the CSS H1-hide rules (one per family, in 5 separate files —
confirmed by grep, not "one shared rule") never got the same alternation. Per the
ruling ("mirror exactly if they are five... only `.sb-wrap` has the back-link today; do
not speculatively add the alternation for other families"), added the alternation to
`steel-statblock.css` only:

```css
.md-typeset > h1:first-child:has(+ hr + p.sb-backlink + .sb-wrap),
.md-typeset > h1:first-child + hr:has(+ p.sb-backlink + .sb-wrap) { display: none; }
```

**Verified the "only `.sb-wrap`" premise directly, and found it needed a sharper reading.**
`grep -rl "sb-backlink" docs/Browse/` matches **54 files** — not 3 — including dozens of
beastheart companions, summoner rivals across all four echelons, and two fixtures. But
`grep -rlE '^<p class="sb-backlink">'` (a backlink on its OWN line — the true preceding
SIBLING form the broken adjacency requires) matches **exactly the 3 named pages**
(`razor.md`, `gorrre.md`, `violent.md`). Every other hit has `<p class="sb-backlink">`
inline as the FIRST CHILD immediately inside `<div class="sb-wrap">…">` (or
`<div class="fb-wrap">…">`) on the same line — e.g. `wolf.md`:
`<div class="sb-wrap" data-role="leader" data-creature="wolf"><p class="sb-backlink">A
<a>Beastheart</a> companion</p><div class="sb__sticky"…` — a DESCENDANT, not a sibling,
which never broke the `h1+hr+card` adjacency and needs no fix. The CSS `+` combinator in
the rule above only matches the sibling form, so it is correctly scoped to the 3 pages
without over-matching the other 51 — confirmed by the `page-titles.e2e.cjs` regression
(9/9, only the 3 minion pages assert `visible: false` for this reason; the others were
never broken and aren't asserted here).

**Added the three pages to `page-titles.e2e.cjs`'s `CASES`** (`visible: false` each) as
the brief specified, so the CSS/JS predicates can't drift apart again undetected.

**The two LOW doc lines**, re-located by content post-rebase:
- `DESIGN.md` (was line 186, "the strict `h1+hr+card` adjacency"): reworded to name
  `SCChrome`/`sc-chrome.js` as the shared predicate and state the one optional
  `p.sb-backlink` exception.
- `DESIGN.md` (was line 214, the copy-link component-table row): "statblock / featureblock
  / ability card pages" → "the chrome plate on all five card families (statblock,
  featureblock, ability, trait, kit)".

**CHANGELOG bullet added** (`## Unreleased`): the three retainer-minion pages (named:
Razor, Gorrre, Violent, each "Summoned by a Devil Detective") no longer show their title
twice.

### 10.3 Gates (measured, on the rebased + fixed branch)

- **Unit** (`node --test tests/*.test.js`): **86 tests, 86 pass, 0 fail** (82 + 4 new —
  SC-177's own `sc-pins-core.test.js` additions for `addLink`).
- **Original e2e, 8 files:** 6 pass, 2 pre-existing fail (`featureblock-fixture` exit 2,
  `settings-panel` exit 1) — byte-identical to every measurement across rounds 1–5.
- **SC-177's 2 added e2e files** (`pins-custom-links.e2e.cjs`, `pins-sections.e2e.cjs`):
  both **initially failed** with `Cannot find module 'playwright-core'` under this repo's
  usual invocation — not a defect, a different documented convention (confirmed in
  `.repo-docs/development.md`'s SC-177 addition: "set `E2E_BASE` and optionally
  `PLAYWRIGHT_PATH` to your installed playwright-core module"). Re-run with
  `PLAYWRIGHT_PATH=<resolved playwright-core dir>`, `CHROMIUM_PATH=/opt/brave.com/brave/brave`,
  `E2E_BASE=http://127.0.0.1:8124/` (this repo's already-running server, port substituted
  for their own default 8177): **both pass** — "Custom-link browser checks passed…" and
  "Section browser checks passed: minions, encounter table, quick encounters, SCC
  redirect, missing heading, nested boundaries, persistence, mobile."
- **`chrome-panel.e2e.cjs`:** **245/245 pass, 0 fail** — unaffected by the rebase or the
  statblock CSS fix (that gate doesn't touch H1 visibility).
- **`page-titles.e2e.cjs`:** **9/9 pass** (6 original + the 3 new minion-page cases, all
  `h1 hidden (want hidden)`).

### 10.4 Real pin flow, end to end, on the merged base

Scripted through a real Brave instance (not simulated): cleared `localStorage["sc-pins"]`,
reloaded `/Browse/monster/minotaur/minotaur-sunderer/`, hovered to reveal the plate,
read `.sc-chrome .sc-pin[aria-pressed]` = `false`, clicked it → `aria-pressed` = `true`,
`localStorage["sc-pins"]` = `{"v":1,"items":[{"path":"/Browse/monster/minotaur/
minotaur-sunderer/","title":"Minotaur Sunderer","kind":"Monsters & Terrain","ts":…}]}`.
Navigated to `/pins/`: the "Monsters & Terrain" group lists "Minotaur Sunderer",
confirmed by both a DOM query and the shot below. Clicked its `.sc-pins__rm` button:
removed from the board, confirmed by a second DOM query returning `false`.

**SC-177's own section-excerpt feature**, exercised separately (not simulated): cleared
pins, submitted `.sc-pins__form` with a name and `/scc/mcdm.heroes.v1/kit/
cloak-and-dagger/` (a `/scc/` URL — the form's own eligibility rule requires a URL hash
or a `/scc/` path; a bare page URL is correctly NOT treated as a section, confirmed by a
first attempt with a plain URL producing no fold at all). Result: a
`.sc-pins__section-fold` rendered, `open` by default, its body populated with real fetched
content — `"Martial KitCloak and Dagger\nProviding throwable light weapons and light
armor easily concealed by a cloak to confuse…"` — i.e., the feature fetches and renders
the actual kit card, not a placeholder. Both features (existing pin toggle, new
section-excerpt) work correctly side by side after the merge.

### 10.5 Screenshots (3, required)

```
shots/sc297-r6-minion-razor-title.png   one title (h1 display:none, confirmed programmatically too)
shots/sc297-r6-pin-flow.png             pinboard showing "Minotaur Sunderer" pinned from the plate
shots/sc297-r6-statblock-dark-hover.png post-merge sanity: plate unaffected (link/pin/+/MD/PNG, level scaler intact)
```

All three visually confirmed by this worker before committing.

### 10.6 Commits

- `v2` on `sc297-menu-panels-site`: **`27a021adbf47279c3882492d6e7fbc823efb5eb3`**
  (`fix(statblock): hide the duplicate title on sb-backlink minion pages`), on top of the
  rebase (`origin/main..HEAD` = 5 commits: the 4 rewritten round 1/2/2b/4 commits plus
  this one).
- Superproject: **`117911b70706060a770f9cbe003a7fe8912b041e`**
  (`chore: bump v2 to 27a021adbf`), on top of the rebase (`origin/main..HEAD` = 4
  commits: the 3 rewritten round 2/2b/4 pointer-bump commits plus this one).
- Neither pushed, per the brief (landing is not this worker's).

**Left untouched exactly as instructed:** every submodule pin except `v2` and
`draw-steel-elements` (the latter only via `submodule update --init` following main, never
hand-re-pinned); the two pre-existing e2e failures; the shared main checkout's
`CLAUDE.md`→`AGENTS.md` migration dirt (re-checked at the end of this round, unchanged).

### Return contract (round 6 only — superseded by §11 for current numbers)

- **Verdict:** DONE.
- **`v2` sha:** `27a021adbf47279c3882492d6e7fbc823efb5eb3`
- **Superproject sha:** `117911b70706060a770f9cbe003a7fe8912b041e`
- **Rebased onto:** `v2` → `origin/main` `e83421a61dabadbca1469777cd2530392c5f9bb4`;
  superproject → its `origin/main` `f5fe049437d3a56b088abf062977d80f768946d5`.
- **Conflicts:** `v2` — none. Superproject — `DESIGN.md` (pinboard row, merged both
  sides) once, `v2` submodule pointer (took this branch's rebased tip) three times;
  `CHANGELOG.md` auto-merged cleanly all three times. Full table in §10.1.
- **Unit:** 86/86 pass, 0 fail.
- **Original e2e (8 files):** 6 pass, 2 pre-existing fail, unchanged.
- **SC-177's e2e (2 files):** both pass with their documented `PLAYWRIGHT_PATH`/
  `E2E_BASE` invocation.
- **`chrome-panel.e2e.cjs`:** 245/245 pass, 0 fail.
- **`page-titles.e2e.cjs`:** 9/9 pass (3 new minion-page cases added).
- **Pin-flow result:** pin-from-plate → pinboard → unpin all confirmed working on the
  merged base; SC-177's section-excerpt feature confirmed working independently. Full
  detail in §10.4.
- **Report:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round2-report.md`
- **Screenshots (round 6, absolute paths):**
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r6-minion-razor-title.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r6-pin-flow.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r6-statblock-dark-hover.png`
- **Drive-by fixes:** none this round.
- **Follow-ups:** unchanged from round 2/2b/4 — the kit export-island gap (SC-298,
  `steel-etl`, out of scope) and the shared-checkout anomaly (not this worker's,
  unchanged, re-checked).

---

## 11. Round 8 — re-rebase onto the moved mains + one comment fix + full gates

**Brief:** `sc297-round8-brief.md`. **Ledger:** `decisions.md` → "Round 7" (verdict
APPROVE; the LOW; the INFO that mains moved again).

### 11.1 The round-7 LOW (comment drift), fixed first

`steel-statblock.css`'s comment claimed `grep -rl 'sb-backlink' docs/Browse/` "matches
only the three minion pages." Re-measured before touching anything: **it matches 53
files.** Only the line-start sibling-form grep (`grep -rlE '^<p class="sb-backlink">'`)
matches exactly 3 — which is what the CSS rule's `+` combinator actually keys on, so the
rule itself was always correctly scoped (the round-6 commit MESSAGE already stated this
distinction correctly; only the CSS comment drifted). Fixed the comment to state both
numbers and the sibling-vs-nested distinction plainly. Committed in `v2` alone before
touching the rebase, per the brief's ordering.

### 11.2 Re-rebase

**`v2` onto `origin/main`.** Fetched; confirmed at `e2b6a97276` ("feat: make My Table
controls and headings compact (SC-300)"), at or beyond the brief's expected
`e2b6a9727621`. `git rebase origin/main`: **zero conflicts**, exactly as the round-7
reviewer pre-analyzed (SC-300's `sc-pins.js` hunks are in `mountLinkForm()`; its
`steel-pins.css` change appends at line 94+; this branch's edits are in
`mountPinButton()` and `steel-pins.css` lines 1-40 — still disjoint from SC-300, same
as they were from SC-177 in round 6). Verified after: `mountPinButton()`'s
`SCChrome`-only host resolution intact; `mountLinkForm()`/SC-300's compact-layout code
present and unmodified.

**Superproject onto its `origin/main`.** Fetched; confirmed at `021cf25` ("docs: record
SC-300 deployment"), at or beyond the brief's expected `021cf25ac702`. `git rebase
origin/main` conflicted at 2 of the 4 replayed commits:

| commit replayed | conflict | resolution |
|---|---|---|
| `chore: bump v2 to 406104ad9f` (round 2) | `DESIGN.md` pinboard row: main's side had SC-300's new "compact board headings and an on-demand add-section form" clause with stale "top-center control strip" wording; branch's side had chrome-plate wording but no SC-300 clause | merged: chrome-plate wording + the SC-300 clause, one row |
| ″ | `v2` submodule pointer | took the branch's rebased tip (`git add v2`) |
| `chore: bump v2 to 27a021adbf` (round 6's own commit) | `v2` submodule pointer only (`DESIGN.md` auto-merged cleanly this time) | took the branch's rebased tip (`git add v2`) |

The two middle commits (round 2b's and round 4's pointer bumps) applied automatically
with no conflict reported. `CHANGELOG.md` auto-merged cleanly at every step.

**Submodule pins.** `git submodule update --init` for all 7 non-`v2` submodules: **no
pin moved** (`draw-steel-elements` was already at main's `98d5bd3` from round 6's
rebase; every other submodule was already correct). `git status --short` clean
throughout — no submodule ever added by hand, only `v2`.

### 11.3 A process note, not a defect: intermediate commits' `v2` gitlinks

Discovered while double-checking the resolved history: because `v2`'s working-tree
checkout never changes between conflict-resolution steps within one `git rebase
--continue` sequence, `git add v2` at each conflict stages whatever `v2` is CURRENTLY
checked out to — which was already the final rebased tip throughout. Concretely: `git
ls-tree <commit> v2` for all four replayed superproject commits (`36a529e`, `28ae61d`,
`2babdee`, and the final one) all report the SAME gitlink
(`a052ea70a1e1803908e5f0f2998066547b164e97`), even though three of those commits'
MESSAGES individually claim to bump to `406104ad9f`/`3c733f312f`/`84608f494c`. This is
not new to round 8 — the identical mechanism must have applied in round 6's rebase too
(unremarked there). The FINAL committed state is unaffected and fully correct (verified
via `git submodule status`); only the three older commits' messages are now
retroactively inaccurate about their own intermediate content, on a private branch
nobody reads commit-by-commit. Not fixed (rewriting each intermediate commit's
submodule pointer to its historically-intended value would need real rebase surgery for
a purely cosmetic, non-functional mismatch on unpushed history) — but to keep the
CURRENT-STATE-describing commit (the one at `HEAD`, which is what matters) accurate,
its message was amended to correctly describe carrying round 8's tip rather than
round 6's, before landing.

### 11.4 Gates (measured, on the re-rebased + fixed branch)

- **Unit:** `node --test tests/*.test.js` → **86 tests, 86 pass, 0 fail** (unchanged
  from round 6 — SC-300 added no unit tests, only e2e).
- **Original e2e, 8 files:** 6 pass, 2 pre-existing fail (`featureblock-fixture` exit
  2, `settings-panel` exit 1) — byte-identical to every measurement across all eight
  rounds so far.
- **SC-177's 2 + SC-300's 1 new e2e files** (`pins-custom-links.e2e.cjs`,
  `pins-sections.e2e.cjs`, `pins-layout.e2e.cjs`): all three require the same
  documented convention (`.repo-docs/development.md`: set `E2E_BASE` and
  `PLAYWRIGHT_PATH`) rather than this repo's `resolvePlaywrightCore()` helper. Run with
  `PLAYWRIGHT_PATH=<resolved dir>`, `CHROMIUM_PATH=/opt/brave.com/brave/brave`,
  `E2E_BASE=http://127.0.0.1:8124/`: **all three pass** — "Custom-link browser checks
  passed…", "Section browser checks passed…", and (new) "Layout checks passed: compact
  board, disclosure, focus, Escape, Cancel, validation, save, reload, mobile."
- **`chrome-panel.e2e.cjs`:** **245/245 pass, 0 fail.**
- **`page-titles.e2e.cjs`:** **9/9 pass** (unchanged from round 6 — 6 original + 3
  minion-page cases).

### 11.5 Pin flow, once more, on the newly-merged base

Same script shape as round 6: cleared `localStorage["sc-pins"]`, reloaded
`/Browse/monster/minotaur/minotaur-sunderer/`, hovered to reveal the plate, read
`aria-pressed` = `false`, clicked → `true`. Navigated to `/pins/`: "Minotaur Sunderer"
present under "Monsters & Terrain" (confirmed by DOM query and the shot below). Clicked
its remove button: confirmed gone by a second DOM query. The pinboard shot additionally
shows SC-300's compact layout rendering correctly alongside the pin: "Add a section" is
now a collapsed toggle button (not the always-open form round 6's shot showed), and the
group heading reads as a plain, smaller label rather than the earlier bold heading —
both confirming SC-300's own change is live and unbroken by this branch's merge.

### 11.6 Screenshot (1, required)

```
shots/sc297-r8-pinboard.png   pinned "Minotaur Sunderer" + SC-300's compact layout, both correct
```

Visually confirmed by this worker before committing.

### 11.7 Commits

- `v2` on `sc297-menu-panels-site`: **`a052ea70a1e1803908e5f0f2998066547b164e97`**
  (`docs(statblock): fix the sb-backlink grep comment`), on top of the re-rebase.
  `git log --oneline origin/main..HEAD` = 6 commits (the 5 rewritten round 1/2/2b/4/6
  commits plus this one).
- Superproject: **`1ea1d939ce34d0269dcf5f49744dac864d8a3f1e`**
  (`chore: bump v2 to a052ea70a1`, amended per §11.3), on top of the re-rebase.
  `git log --oneline origin/main..HEAD` = 4 commits (the 3 rewritten round 2/2b/4
  pointer-bump commits plus this one).
- Neither pushed (confirmed: no `origin/sc297-menu-panels-site` remote branch exists at
  all in either repo).

**Left untouched exactly as instructed:** every submodule pin except `v2` and
`draw-steel-elements` (unchanged this round, already correct); the two pre-existing e2e
failures; the shared main checkout's `CLAUDE.md`→`AGENTS.md` migration dirt (re-checked,
unchanged).

### Return contract (current)

- **Verdict:** DONE.
- **`v2` sha:** `a052ea70a1e1803908e5f0f2998066547b164e97`
- **Superproject sha:** `1ea1d939ce34d0269dcf5f49744dac864d8a3f1e`
- **Rebased onto:** `v2` → `origin/main` `e2b6a97276` (SC-300); superproject → its
  `origin/main` `021cf25` (SC-300 deployment record).
- **Conflicts:** `v2` — none. Superproject — `DESIGN.md` pinboard row once (merged both
  sides), `v2` submodule pointer twice (took this branch's rebased tip); `CHANGELOG.md`
  auto-merged cleanly throughout. Full table in §11.2.
- **Unit:** 86/86 pass, 0 fail.
- **Original e2e (8 files):** 6 pass, 2 pre-existing fail, unchanged.
- **SC-177/SC-300 e2e (3 files):** all pass with their documented invocation.
- **`chrome-panel.e2e.cjs`:** 245/245 pass, 0 fail.
- **`page-titles.e2e.cjs`:** 9/9 pass.
- **Pins moved this round:** none (`git submodule update --init` was a no-op — every
  non-`v2` pin already matched main).
- **Pin-flow result:** pin-from-plate → pinboard → unpin confirmed working again on the
  newly-merged base; SC-300's compact layout visibly correct in the same shot.
- **Report:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round2-report.md`
- **Screenshot (round 8, absolute path):**
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/sc297-r8-pinboard.png`
- **Drive-by fixes:** none this round.
- **Follow-ups:** unchanged from round 2/2b/4 — the kit export-island gap (SC-298,
  `steel-etl`, out of scope) and the shared-checkout anomaly (not this worker's,
  unchanged, re-checked). §11.3's commit-message note is informational, not a deferred
  fix — nothing is broken, nothing needs owner action.
