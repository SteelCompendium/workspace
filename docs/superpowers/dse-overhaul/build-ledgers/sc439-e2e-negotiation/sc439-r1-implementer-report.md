# SC-439 r1 (phase A) — implementer report

## Executive summary

- STATUS: NEEDS_CONTEXT (phase A done; stop for the owner). Branch `sc439-e2e-negotiation`, dse head `bf4caebf`, on `origin/develop` `6785fa06` (fetched: unmoved, no rebase). Nothing pushed; superproject untouched.
- Controls: 18 negotiation ids (every interactive node of the card, both tabs, tracks, chips, modifiers, tier rows, Complete, Spent chips, options button, native Reset menu item). Pairs: **45** (ticket said "about 35": +10 is the arrow-key / Home / End pairs of the three radiogroups and the tablist, plus 2 click-disabled).
- Both censuses cover the negotiation by root-container scope (jsdom: 15 new tests incl. the injected-button regression; real Obsidian: CENSUS-13..15 written, not run: phase B).
- New jsdom matrix file: 355 tests (tabs, Patience and Interest click/key grids of 36 + 36 each, 36 standings -> ending, Spent chips x argument, 64 argument combinations x tier, reset from 8 states, note integrity for 8 actions x 2 blocks).
- Gates: tsc clean, lint clean, jest full **12287 passed / 2 skipped / 0 failed** (280 suites passed, 1 skipped; fresh worktree, no shots cache; = baseline fresh 11917 + 370 new). Baseline with cache is 11918/1.
- Bugs for the owner: **6 candidates** (1 Medium, 5 Low): unknown YAML keys deleted (mirrors SC-625), wrong-type values -> error card (mirrors SC-628), Reset drops focus (mirrors SC-626; jsdom-confirmed, real Obsidian pending), Reset on an untouched block rewrites the note (new), duplicate/missing motivation names break the chips (new), fractional/junk standing drawn on a seal that disagrees with the ending (new, SC-628 family).
- Product-source change: attributes only (+ optional `control` options on three kit factories). Drive-by fixes: none.

## Commits (dse repo, branch `sc439-e2e-negotiation`)

| sha | subject |
|---|---|
| `8a0ddfc0` | feat(SC-439): data-dse-control ids on every interactive node of ds-negotiation |
| `0a39ca8f` | test(SC-439): negotiation e2e manifest (45 pairs) and fixture notes |
| `2c9bd1b6` | test(SC-439): jsdom and real-Obsidian census over the negotiation root (CENSUS-13..15) |
| `bf4caebf` | test(SC-439): negotiation jsdom matrix (tabs, tracks, endings, Spent chips, argument combinations, reset, note integrity) |

No attribution trailers (user's global rule).

## Controls added (18 own ids; all `negotiation.`-prefixed)

Kit (additive, attribute only, no effect unless the option is passed): `tabs()` gets `control` (tablist) + `TabSpec.control` (per tab); `track()` gets `control` (radiogroup) + `slotControl` (every seal); `powerRollPanel()` gets `control` + `rowControl` (selectable mode only).

- Card head: `negotiation.menu` (options icon button, `view.ts`); `negotiation.menu.reset` (the native Menu item, stamped on `MenuItem.dom`, see "Native menu" below).
- Tabs: `negotiation.tablist`, `negotiation.tab.argument`, `negotiation.tab.learn-more`.
- Standing: `negotiation.patience` (radiogroup) / `negotiation.patience.seal` (x6, DOM order 0..5); `negotiation.interest` / `negotiation.interest.seal` (x6, DOM order 5..0; `nth` 0 is value 5).
- Motivation cards: `negotiation.spent` (one per motivation).
- Argument tab: `negotiation.appeal.motivation`, `negotiation.appeal.pitfall` (one per item), `negotiation.mod.reuse|lie|same` (checkboxes), `negotiation.tier` (radiogroup), `negotiation.tier.row` (x4; absent while ended: the panel is static), `negotiation.complete`.
- Not interactive, so no id (verified by the census): card head, end band (`role=status`), the Learn Motivation/Pitfall panel (rules text + a static panel), tooltips.
- Chrome panel: the negotiation has NO items of its own. It carries the framework's `chrome.collapse` / `chrome.expand` (already in `manifest/chrome.ts`; allowlisted in both censuses); `chrome.pin|unpin` only under experimental. The pipeline's edit pencil (only with the `authoringControls` pref on) has no id on any element; see Follow-ups.

### Native menu (decision, as the ruling asked me to say which)

The Reset menu is Obsidian's native `Menu`. Its items CAN carry an id: Obsidian 1.14.4's `MenuItem` has a runtime `dom` field (the `.menu-item` div with its own click listener; checked in the pinned app.js, absent from `obsidian.d.ts`). `view.ts` stamps it (`negotiation.menu.reset`) through a typed cast, guarded (no-op if the field is ever absent). The manifest therefore lists BOTH the button (`negotiation.menu`: click, press:Enter) and the item (`negotiation.menu.reset`: click only; focus never moves onto a menu item, so Enter on it cannot be credited by the driver's focus rule). If phase B finds the stamp is not on the real node, [CENSUS-14] fails and I fall back to recording the item's pair on the button. The jsdom `Menu` mock's `MenuItem` gained a `dom` div (small additive change to `test/mocks/obsidian-core.ts`).

## Manifest pairs (`e2e/manifest/negotiation.ts`, 45)

| control | kinds | rows |
|---|---|---|
| `negotiation.menu` | click, press:Enter | R01 R02 |
| `negotiation.menu.reset` | click | R01 R02 R03 |
| `negotiation.tablist` | press:ArrowRight, press:ArrowLeft, press:Home, press:End | T02 |
| `negotiation.tab.argument` | click | T01 |
| `negotiation.tab.learn-more` | click | T01 T03 |
| `negotiation.patience` | press:ArrowRight, ArrowLeft, ArrowDown, ArrowUp, Home, End (6) | P02 |
| `negotiation.patience.seal` | click | P01 P03 |
| `negotiation.interest` | the same 6 keys | I02 |
| `negotiation.interest.seal` | click | I01 I03 |
| `negotiation.spent` | click, press:Enter | M01 M02 |
| `negotiation.appeal.motivation` | click, press:Enter | A01 A03 |
| `negotiation.appeal.pitfall` | click, press:Enter | A02 A03 |
| `negotiation.mod.reuse` | click, click-disabled | A04 A05 |
| `negotiation.mod.lie` | click | A04 |
| `negotiation.mod.same` | click, click-disabled | A04 A05 |
| `negotiation.tier` | the same 6 keys | A07 |
| `negotiation.tier.row` | click, press:Enter | A06 A08 |
| `negotiation.complete` | click, click-disabled, press:Enter | A09 A10 A11 |

Declared only where a real handler makes it functional: a seal gets no `press:Enter` (the only tab stop is the checked seal, so Enter re-selects it: nothing happens); a tab gets none (an unselected tab is not a tab stop; the selected one is a no-op); a tier row does (the first row is the tab stop while none is chosen, and Enter chooses it); checkboxes click only (Space is the browser's); a key pressed with focus on a seal / row / tab is credited to the radiogroup / tablist id (the driver's `press` needs focus WITHIN the control). `click-disabled`: Complete (no tier / ended) and the two modifiers that grey out. Seals are only disabled on a read-only host (not reachable in the e2e vault), so they list no click-disabled.

Rows cite the phase-B scenario groups (T tabs, P patience, I interest, M Spent chips, A argument, R reset). Phase B plan for ids: `NEGO-T01..T03`, `P01..P03`, `I01..I03`, `M01..M02`, `A01..A11`, `R01..R03`, plus `NEGO-X*` integrity, `NEGO-F*` focus, `NEGO-W*` wrong values (and a `NEGO-C*` collapse/expand-on-a-negotiation test that drives `chrome.collapse|expand`, which the chrome manifest already requires).

Expected coverage after phase B: 176 + 45 = 221/221 (on top of SC-438 if it lands first).

## Census changes

- `test/dom/e2eCensus.test.ts`: new `describe('SC-439 census: the negotiation tracker, scoped by container')`, 15 tests (file 26 -> 41). The scope is the negotiation ROOT (head, both tabs including the hidden one, standing region, cards, framework chrome panel), `censusProblems(root, manifestIds + chromeIds, INTERACTIVE, skipChrome=false)`; no CSS-class lookup. Tests: the census bites (an un-id'd button injected into head / patience / interest / argument / learn-more / a card column / the `.dse-nt` root is a finding, as is a stray tabindex div on the HIDDEN tab and an id outside the manifest); the chrome panel is in scope (+ a rogue item is a finding); 7 variants clean (basic, spent, ended, deal, hostile, minimal, unknown-keys); the Learn More tab showing; per-id counts and the seal `data-value` order (`nth` the specs will rely on); the name-only block; no dead manifest row (every declared id is stamped by some variant, the native menu item included); the Reset item carries `negotiation.menu.reset`; read-only host (no menu/Complete, seals/chips disabled, tier rows static). Imports and the describe are appended (additive; mechanical for a rebase over SC-438).
- `e2e/specs/_census.e2e.ts` (real Obsidian; written and type-checked/linted, NOT run): `[CENSUS-13]` the whole tracker on `Negotiation/spent.md` scoped by `.markdown-reading-view [data-dse-element="negotiation"] *` with `excludeInside = null`, plus a sanity list of ids the probe must see; `[CENSUS-14]` the open native Menu (`.menu *`): the Reset item is an identified control; `[CENSUS-15]` the ended fixture and the Learn tab. The checkboxes listen only for `change`, so the browser census cannot see them (jsdom owns them, noted in the spec). Own `NEGO_IDS` set; `ALL_IDS` untouched. IDs 13..15 free in this worktree, SC-438 (`10..12` present there) and SC-615; `[NEGO-` unused in all three.

## jsdom matrix tests (`test/dom/elements/negotiation-matrix.test.ts`, 355 tests, ~13 s)

Expected values are worked out from the book's argument table inside the file, not from `ArgumentPowerRoll`.
- T (14), P (76), I (77), E (36), M (7), A (117), R (10), X (18) = 355.
- T (14): 4 start x target tab clicks; 8 key rows (arrows wrap, Home/End), focus follows, zero writes; Learn panel offers nothing to press; tab remembered per block key across a rebuild.
- P (36 + 36 + 4): click from every start value to every value (checked seal, readout, fill grammar, no-op on the checked seal writes nothing, one write otherwise, `data-ended`); 6 keys x 6 starts (wrap, Home/End, focus follows); 4 hand-typed past-bounds / quoted / fractional values (display clamp, rendering writes nothing).
- I (36 + 36 + 4 + 1): same for Interest with the DESCENDING key order (Down = a lower interest, Home = 5, End = 0), the now-tag, past-bounds / quoted values, every row's authored offer.
- E (36): all Interest x Patience standings: `data-ended`, band kind/label/offer text, now-tag words, tier rows present only while live, hint, Complete disabled.
- M (7): Spent chip x spent/unspent x argument uses it x reuse flag (6 rows incl. "leave the flag alone while another reused motivation remains"), card glyph/strike/open count and the argument tab's chip + reuse line follow; pitfalls have no chip.
- A (117 = 64 + 6 + 6 + 31 + 10): every legal combination of {no appeal / Higher Authority / spent Peace} x pitfall x lie x same-argument x 4 tiers through UI to the written Interest/Patience, motivations spent, argument cleared, card repainted; the four tier-row texts per appeal set; clamping at the edges; Complete enabled/disabled by tier / ending and a disabled press writes nothing; tier radiogroup keys (4 starts x 6 keys); roving tab stop; a chosen tier survives appeal changes and is dropped when the negotiation ends; chips x modifier lines x why-hints for the 8 subsets; chip toggled twice (key omitted: SC-482); the three modifier flags.
- R (10): Reset from 8 states (moved, final, deal, hostile, spent, argument under way, hand-typed, already initial) back to the initial standing, spent flags, cleared argument, no band, one write; the tab survives; menu absent on a read-only host.
- X (18): 8 write actions x 2 blocks in ONE note (prose with markup + a rule, a ```` ```js ```` fence, two negotiations, a list below) through a REAL `ReadingModeBlockHost` + FakeVault: everything outside the acted block byte-identical, the other block's body byte-identical; a hand-edited note drawn afresh keeps the hand edit and the prose edit; two writes in a row.

## Fixtures added (`e2e/vaults/shipped/Negotiation/`, rows in `e2e/README.md`)

`basic.md` (Frodo 3/3, two motivations, one pitfall), `spent.md` (Higher Authority spent, 3/3 of 4), `ended.md` (Patience 0 at Interest 3, both spent), `deal.md` (Interest 5), `hostile.md` (Interest 0), `minimal.md` (`name:` only), `two-blocks.md` (two different blocks, prose above/between/below), `unknown-keys.md` (`note_to_self` top-level + `gm_note` in a motivation and a pitfall). Not added yet (decide after the owner's bug filing): a wrong-values note, a past-bounds note.

## Integrity probes (jsdom; probe file kept at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc439-impl-r1/sc439-scratch-probe.test.ts.txt`, outputs `sc439-probe1.out`, `sc439-probe2.out`, `sc439-probe3.out` in the same dir)

| probe | result |
|---|---|
| content above / below the block survives a write | OK (committed as X tests, 8 actions) |
| two negotiation blocks in one note don't cross-talk | OK (block 0 and 1 each; 8 actions) |
| hand-edited block / prose, drawn afresh then written | OK (committed). (A view drawn BEFORE an outside edit and written without a re-draw overwrites the edit: that is the host layer, shared by every element; lifecycle G-S5 covers it, not a negotiation defect) |
| write into a block with unknown keys keeps them (top-level) | **FAILS** -> B1 |
| ... and inside list items (motivation / pitfall) | **FAILS** -> B1 |
| SC-482 (no default keys written): chip on/off, reset | OK (key omitted when back to the parser default) |
| SC-493 (emptied raw-YAML box) | not touched (FormModal out of scope; the existing tests cover it) |
| keyboard focus after a seal arrow / chip / Spent toggle | kept (in-place repaint) |
| keyboard focus after Reset | **DROPS to `<body>`** -> B3 |
| keyboard focus after Complete | button stays `activeElement` while disabled in jsdom; real Chrome may drop it: check in phase B |
| wrong-type values | -> B2, B6 |

## Bugs found (candidates; the owner files them)

**B1 — A write deletes YAML keys the element does not know (top-level and inside motivations/pitfalls). Medium. MIRRORS SC-625 (montage).**
Repro (jsdom; same in real Obsidian by construction): `Negotiation/unknown-keys.md`, click Patience seal 1 (or any chip, Complete, Reset). The written block has no `note_to_self`, no `gm_note` on "Legacy" or on the pitfall "Pride". Cause: the model copies only known keys (`src/model/NegotiationData.ts:29-36` the constructor, `:185-186` Motivation, `:196-197` Pitfall) and `serialize` writes from the model (`src/elements/negotiation/model.ts:85-88`). Also: the first write re-orders the user's keys into class order (initial_patience before initial_interest, current_* beside them) — same family, mentioned for the ticket.

**B2 — Wrong-type hand-typed values turn the card into an error card with a raw JS message. Low. MIRRORS SC-628 (montage `title: 2024`).**
Repro: each as a block: `name: 2024` ("failed to render (render)_a.trim is not a function", `src/elements/negotiation/view.ts:112` `model.name?.trim()`); a motivation or pitfall `name: 5` / `reason: 42` (`NegotiationData.ts:185-186`, `196-197`); `motivations: "foo"` (`.map is not a function`, `NegotiationData.ts:34`; `pitfalls` likewise, `:35`); a blank list item `-` (`Cannot read properties of null (reading 'name')`, `:34`); `currentArgument: { motivationsUsed: "Peace" }` (`.some is not a function`, `NegotiationData.ts:147` + `argumentReusesMotivation`). Contained (an error card, nothing written), but the text is the raw JS error. Note the quoted numbers (`current_patience: "3"`) and past-scale numbers are handled (SC-379).

**B3 — Reset negotiation drops keyboard focus to the page. Low-Medium. MIRRORS SC-626 (montage focus drops after a write); family of SC-614/615.**
Repro (jsdom): focus the options button, open the menu, choose Reset: `document.activeElement` is `<body>`; the whole view rebuilds (`view.ts:164-170`, `resetNegotiation` -> `update()`), destroying the focused button. Real Obsidian: pending phase B (Obsidian may restore focus to the opener, which is detached). Seal / chip / Spent writes are in-place and keep focus.

**B4 — Reset on a negotiation already in its initial state still rewrites the note. Low. NEW (violates the SC-340 "an action that changes nothing writes nothing" rule the initiative suite pins as INIT-NOOP).**
Repro (jsdom, real host + FakeVault): Reset twice in a row: `vault.modify` runs on the second Reset too (the first one legitimately rewrites hand formatting). `view.ts:164-170` always persists. (Compare: clicking the already-checked seal writes nothing.)

**B5 — A duplicate or missing motivation name breaks its chips. Low. NEW (loosely like montage SC-627, a duplicate hero).**
Repro: two motivations both named "Higher Authority": the argument tab's FIRST chip renders EMPTY (no glyph label, nothing but a bare button) and the card's first Spent chip is blank; only the second works; clicking the first chip toggles the shared name. A motivation with no `name:` draws a chip "◆" with `aria-label="Appeal to "`. Cause: the chip and row registries are `Map<name, …>` (`ArgumentView.ts:62,133,148`, `MotivationsPitfallsView.ts:27,93`), so the second entry overwrites the first and only that one is ever repainted.

**B6 — A fractional or junk standing is drawn on a seal that disagrees with the ending. Low. NEW (SC-628 family; SC-379 pinned the clamp-for-display deliberately, not this disagreement).**
Repro: `current_interest: 0.4` -> seal 0 is checked with the "now" tag but the negotiation is live (not hostile); `4.5` -> seal 5 checked, not a deal; `current_patience: banana` -> Patience 0 shown, not a final offer. The track rounds (`kit/track.ts` `clamp` uses `Math.round`) while `NegotiationData.ending()` (`NegotiationData.ts:96`) tests the raw number.

Not filed as bugs, reported as questions (owner decides): a block with no `initial_interest` / `current_interest` opens already over ("Negotiation over: Interest fell to 0"), because the default Interest is 0 (`NegotiationData.ts:19`, fixture `minimal.md`); and Reset on a block that declares only `current_*` sets Patience 5 / Interest 0 (the defaults) — hostile, over.

## Drive-by fixes:

None.

## Follow-ups:

- The pipeline's edit pencil (`data-dse-chrome-item="edit"`, only with the `authoringControls` pref on) carries no `data-dse-control` on ANY element (it opens the FormModal, out of scope here). Both censuses run with the pref off, so they cannot see it. A separate ticket could give it an id + manifest row.
- `chrome.collapse|expand` are only driven on the stamina bar in the chrome manifest. Phase B can add one negotiation collapse/expand scenario (state is session-only, never the note).
- Phase B needs a driver way to address the native menu item (the id is page-wide, outside any block scope): `dse.block(...).control(...)` will not find it; a small `dse` helper or a page-level control lookup. I will add it additively in `e2e/driver/` (a `negotiation.ts` driver, as `pool.ts`) rather than touching `dse.ts` unless you say otherwise.
- Same-key reorder on first write and SC-599 (comments/quotes) apply to the negotiation as everywhere (cited, not refiled).

## Gates (phase A) — all against `/home/scott/code/steelCompendium/worktrees/sc439-e2e-negotiation/draw-steel-elements`, logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc439-impl-r1/`

- `npm run tsc` (root + `-p e2e`): clean, rc 0 — `sc439-tsc-1.log` / `sc439-tsc-1.rc`.
- `npm run lint`: clean, rc 0 — `sc439-lint-1.log` / `sc439-lint-1.rc`.
- `npx jest` full: `Test Suites: 1 skipped, 280 passed, 280 of 281 total; Tests: 2 skipped, 12287 passed, 12289 total; Snapshots: 3 passed` (99.9 s), rc 0 — `sc439-jest-full-1.log` / `.rc`. Fresh worktree, no shots cache, so 2 skipped as expected (baseline fresh 11917 + 370 new = 12287; with the cache 11918/1 + 370 would be 12288/1). The log's `TypeError: findDriftedTokens ...` lines are expected child-process output of existing negative tests (0 FAIL lines).
- Census suite alone: 41 passed — `sc439-jest-census-1.log`. Matrix alone: 355 passed — `sc439-jest-matrix-1.log`.
- Not run in phase A (as briefed): lifecycle, e2e, shots, freeze, parity.

## Phase B (2026-11-14)

### Summary

- STATUS: DONE. Rebased onto `origin/develop` `f6e504c7` (SC-438 landed); head `1b514494`, 5 commits, nothing pushed, superproject untouched. Battery run entirely on the rebased tree.
- e2e full run, TWICE: `451/474 ok, 0 failed, 23 known-bug, coverage: 278/278 pairs` both times (233 + 45; known-bug 13 + my 10).
- jest `12503 passed / 2 skipped / 0 failed` (fresh, no shots cache; 12124 + 379 new); tsc clean; lint clean.
- lifecycle 64/64 in the seven parts (21 + 16 + 9 + 4 + 7 + 4 + 3), all 0 failed. shots 592 `ok`, 0 FAIL, host-leak 163 kinds / 978, modal 40 kinds (10 scenarios, 240), clip 147; freeze 280/280; parity `0 gaps, 0 undeclared, 24 declared`.
- Real-Obsidian findings: [CENSUS-14] passes, so the `MenuItem.dom` stamp IS on the real native item (no fallback). Reset on an untouched negotiation writes nothing (B4 confirmed not a bug). SC-639 reproduces after Reset (focus leaves the card). NEW candidate B7: focus also leaves the card after Complete Argument pressed with Enter in real Obsidian (jsdom keeps it).
- B7 is keyed provisionally to SC-639 (`[NEGO-F02]`): the owner files a ticket and I swap the key in one line.

### Rebase (old -> new)

`8a0ddfc0` -> `c85a91b1` feat ids; `0a39ca8f` -> `513df3a7` manifest + fixtures; `2c9bd1b6` -> `c7a75f98` census; `bf4caebf` -> `cb3a50a8` matrix; `b63401cf` -> `1b514494` e2e specs + markers + driver + jsdom `test.failing`. Conflicts: `e2e/README.md` (kept both fixture-row sets), `test/dom/e2eCensus.test.ts` and `e2e/specs/_census.e2e.ts` (kept SC-438's CENSUS-10..12 / montage block and appended mine, imports from both). `e2e/driver/dse.ts` did not conflict (I never touched it). No `package.json` change, so no `npm ci`. CENSUS-13..15 and every `NEGO-*` id are unique across `e2e/specs`.

### Files added in phase B

`e2e/driver/negotiation.ts` (fixture constants, `openNego`, `blockOf`, seal helpers, `shown` / `tierTexts` / `mods` / `dossier` / `focusState` page reads, `openMenu` / `chooseReset`; the native menu item is reached with `dse.control('negotiation.menu.reset')`, so `dse.ts` is untouched); `e2e/specs/negotiation/{tabs,tracks,cards,argument,reset,integrity,focus,wrong-values,chrome}.e2e.ts` (43 tests); six more fixtures (`wrong-name`, `fraction`, `dup-names`, `nameless`, `current-only`, `quoted`) with README rows; `test/dom/elements/negotiation-bugs.test.ts` (9 `test.failing`).

### Scenario map (plain driver per pair; every id literal in its title)

T01 tab clicks; T02 tablist keys; T03 tab survives a write; P01 seal click (+ checked seal no-op); P02 six keys; P03 final offer; I01 row click; I02 six keys; I03 deal / hostile; M01 Spent chip click; M02 Enter on it; A01/A02 appeal and mention chips; A03 Enter on chips; A04 the three modifiers; A05 click-disabled modifiers; A06 tier click; A07 tier keys; A08 Enter on a tier; A09 Complete click; A10 click-disabled Complete (no tier, ended); A11 Enter on Complete; R01 menu button + item; R02 Enter on the button, Escape; R03 reset from an ended block; R04 Reset on an untouched negotiation `expectNoWrite`; X01..X05 integrity (second block, reset in second block, prose around, hand edit, no default keys written); C01 collapse / expand (no write); W01 quoted numbers; CENSUS-13..15.

### Marker -> test map

| ticket | e2e `knownBug` | jsdom `test.failing` (negotiation-bugs.test.ts) |
|---|---|---|
| SC-637 top-level key | NEGO-X06 | K01 |
| SC-637 list-item key (motivation + pitfall) | NEGO-X07 | K02 |
| SC-638 case 1 (raw JS error text, `name: 2024`) | NEGO-W02 | K03 |
| SC-638 case 2 (seal vs ending, `current_interest: 0.4`) | NEGO-W03 | K04 |
| SC-639 Reset focus | NEGO-F01 | K05 |
| SC-639 (provisional) Complete focus, real Obsidian only | NEGO-F02 | none (jsdom keeps focus) |
| SC-640 duplicate names | NEGO-W04 | K06 |
| SC-640 nameless | NEGO-W05 | K07 |
| SC-641 no-Interest block opens ended | NEGO-W06 | K08 |
| SC-641 Reset of a current-only block | NEGO-W07 | K09 |

Every marker asserts only what its ticket rules. Every manifest pair has a plain (non-marker) driver, so the coverage gate's "knownBug-only" rule does not bite.

### Gates (phase B, rebased tree; logs in the scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc439-impl-r1/`)

- tsc `sc439-tsc-b2.log`; lint `sc439-lint-b2.log`; jest `sc439-jest-b2.log` (`12503 passed, 2 skipped`).
- lifecycle `sc439-life-r1.log` .. `sc439-life-r7.log` (21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3; the pre-rebase run, `sc439-life-p1..p4.log`, was also green).
- e2e `sc439-e2e-full1.log`, `sc439-e2e-full2.log`; shots `sc439-shots.log`; freeze `sc439-freeze.log` (`280/280`); parity `sc439-parity.log`.

## Phase B rebase (a5313f9d)

- Rebased onto `origin/develop` `a5313f9d` (SC-615 landed; supersedes f6e504c7). Clean rebase, no conflicts, no `package.json` change. Head `99fa593a`.
- Old -> new: `c85a91b1` -> `07f91eaf` (ids); `513df3a7` -> `37228e4e` (manifest, fixtures); `c7a75f98` -> `37f1ca45` (census); `cb3a50a8` -> `f2821898` (matrix); `1b514494` -> `48b9b79a` (e2e specs, markers, driver, jsdom test.failing); new `99fa593a` test(SC-439): NEGO-F02 cites SC-642 (B7 filed as SC-642; the key swap from SC-639 only).
- tsc clean, lint clean, jest `12512 passed / 1 skipped / 0 failed` (282 suites passed, 1 skipped; the shots cache from the earlier run exists in this worktree, so 1 skipped rather than 2; 12132 + 379 new + 1).
- lifecycle 64/64 in the seven parts (21 + 16 + 9 + 4 + 7 + 4 + 3), 0 failed.
- full e2e once: `460/483 ok, 0 failed, 23 known-bug, coverage: 278/278 pairs` (451/474 + SC-615's 9). `NEGO-F02` reads `known-bug SC-642`.
- shots / freeze / parity not re-run (owner's instruction: SC-615 touched only initiative focus code; the f6e504c7 run had 592 ok / 0 FAIL, freeze 280/280, parity 0/0/24).
- Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc439-impl-r1/`: `sc439-tsc-b4.log`, `sc439-lint-b4.log`, `sc439-jest-b4.log`, `sc439-life-s1.log` .. `sc439-life-s7.log`, `sc439-e2e-fulls1.log`.

## r3

- STATUS: DONE. dse head `1615843e` on `origin/develop` `11fbded6` (SC-626 landed; rebased twice this round, clean, no conflicts); superproject `6030e7cd` = one gitlink commit on workspace origin/main `b45a5f24` (ff-only; `git log origin/main..HEAD` is exactly that commit; status clean; nothing pushed).
- Folded: M-1 (`dse.aimedAt('negotiation.menu.reset')`, `press:Enter` declared, NEGO-R05; F01 and L03 use the aimed Enter), L-1 (every marker has `failsWith`), L-2 (census test no longer pins the ended block), L-3 (SC-640 markers assert every drawn chip, never a count), L-4 (NEGO-X08 + twins fixture + matrix twin case x2), L-5 (NEGO-L01 Live Preview, passes: focus on seal 4), I-1 (Space on the three checkboxes A12, label ids + clicks A13), I-3 (jsdom K10, two same-named pitfalls), I-4 (NEGO-L02 SC-642 in Live Preview; NEGO-L03 SC-639 in Live Preview: REPRODUCES), I-6 nits. New: NEGO-R06 `knownBug('SC-648')` (menu opened with Enter appears beside the button), jsdom K11..K13 `test.failing` for SC-649.
- Pairs: 45 -> 52 (+1 reset Enter, +3 Space, +3 label clicks): coverage 287/287 (235 + 52). The label ids are an attribute-only src change (`ArgumentView.ts`), so shots/freeze/parity were run.
- After the SC-626 rebase every focus test is unchanged: F01 (SC-639), F02 and L02 (SC-642), L03 (SC-639) still `known-bug`; L01 still passes on seal 4.
- Gates on `1615843e`: tsc/lint clean; jest `12552 passed / 1 skipped / 0 failed` (shots cache present); lifecycle 64/64 (21+16+9+4+7+4+3); e2e twice `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`; shots 592 ok / 0 FAIL, host-leak 163/978, modal 40 kinds (10 scenarios), clip 147; freeze 280/280; parity `0 gaps, 0 undeclared, 24 declared`.

Marker delta: e2e `knownBug`: +NEGO-R06 (SC-648), +NEGO-L02 (SC-642, Live Preview), +NEGO-L03 (SC-639, Live Preview) => 13 SC-439 markers (X06 X07 SC-637; W02 W03 SC-638; F01 L03 SC-639; F02 L02 SC-642; W04 W05 SC-640; W06 W07 SC-641; R06 SC-648), 9 develop markers, 22 total. jsdom `test.failing`: K01..K13 (K10 SC-640 pitfalls; K11 K12 K13 SC-649: removed motivation, removed pitfall, hand-typed Reuse).

dse commits above `11fbded6`:
- `1615843e` test(SC-439): jsdom: SC-649 and pitfall-name markers, identical-twin write, census test no longer pins the ended minimal block
- `14557c10` test(SC-439): keyboard Reset (R05), SC-648 marker, modifier Space and label clicks, identical twins, Live Preview focus (SC-642, SC-639), pinned markers
- `f03c6af0` feat(SC-439): ids on the modifier labels, press:Enter on the native Reset item (aimedAt), Space on the checkboxes
- `03f956cc` test(SC-439): NEGO-F02 (focus after Complete Argument) cites SC-642
- `73c4eb22` test(SC-439): negotiation e2e specs driving every manifest pair, markers SC-637..SC-641, fixtures and driver
- `08912c4e` test(SC-439): negotiation jsdom matrix (tabs, tracks, endings, Spent chips, argument combinations, reset, note integrity)
- `a5291cb1` test(SC-439): jsdom and real-Obsidian census over the negotiation root (CENSUS-13..15)
- `67279391` test(SC-439): negotiation e2e manifest (45 pairs) and fixture notes
- `e14ce440` feat(SC-439): data-dse-control ids on every interactive node of ds-negotiation

Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc439-impl-r1/`: `sc439-tsc-u1.log`, `sc439-lint-u1.log`, `sc439-jest-u1.log`, `sc439-life-u1.log` .. `sc439-life-u7.log`, `sc439-e2e-fullu1.log`, `sc439-e2e-fullu2.log`, `sc439-shotsu.log`, `sc439-freezeu.log`, `sc439-parityu.log`.

## r5

- STATUS: DONE. dse head `8a81c5a7` (one commit `test(SC-439): SC-649 markers compare the tiers with what the card shows (both fix shapes flip them); W03 and R06 pin their reason`, on develop `11fbded6`, unmoved). Superproject `c66f631c` (amended; parent `b45a5f24` = current workspace origin/main, unmoved; ONE commit over it, only the gitlink; status clean; nothing pushed).
- r4-L1: K11/K12/K13 no longer assert `pressed` length 0 or `reuse.checked`. Each mounts the stray block, reads its tiers and what the card SHOWS (pressed chips by name, the lie / same / reuse boxes), mounts a reference block holding exactly that argument and asserts the two tiers match. All three fail today.
- Proof in a scratch worktree (`git worktree add` at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc439-impl-r1/wt-r5-proof`, removed with `git worktree remove --force <literal path>`): with the reviewer's `r4-fixes.diff` (drop the stray entries from the roll, shape a) K11, K12 and K13 flip (plus K10, which that diff's chip-list change also fixes); with `r4-altB.diff` (the Reuse box paints the typed flag, shape b) K13 flips and K11/K12 stay red as they should (that diff does not touch them). Logs `sc439-proof-a.log`, `sc439-proof-b.log`.
- r4-INFO-1: one line each. W03 throws `the seal shown disagrees with the ending: seal S, ending E` (pinned `/the seal shown disagrees with the ending/`); R06 throws `the options menu opened away from the button` (pinned `/opened away from the button/`).
- Gates: tsc, lint clean; jest `12552 passed / 1 skipped / 0 failed`; full e2e once (W03 and R06 touched): `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`. Logs `sc439-tsc-v1.log`, `sc439-lint-v1.log`, `sc439-jest-v1.log`, `sc439-e2e-fullv1.log` in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc439-impl-r1/`.
