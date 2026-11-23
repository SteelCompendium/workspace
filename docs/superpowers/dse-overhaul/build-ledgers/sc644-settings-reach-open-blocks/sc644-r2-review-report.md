# SC-644 r2 independent review report

## Executive summary
- Verdict: **FIX (one short round)**. Nothing HIGH; the core mechanism is right (chrome-only rebuild, body untouched, collapse state carried, block keys win, pencil gate unchanged, subscription view-owned, `watchPrefs` reusable for SC-645).
- Counts: HIGH 0 · MEDIUM 1 · LOW 6 · INFO 5. Mutants: 17 run on the author's suite, 13 killed, 4 survived (1 is a real test gap, LOW-4).
- Bases: dse `92940547` on `origin/develop` `620d5774` (3 commits); superproject `85869486` on `origin/main` `28ed9439` (changelog + ONE pointer bump to 92940547). Worktree clean before and after.
- Gates measured (r2): tsc clean · lint clean · jest **12935 passed / 1 skipped** (shots cache present) · e2e **`571/593 ok, 0 failed, 22 known-bug, coverage: 416/416 pairs`** · lifecycle **64/64** (parts 21+16+9+4+7+4+3, all 0 failed; the runner started Obsidian 1.15.1). Shots / freeze / parity NOT re-run: no CSS touched, first-render DOM identical (the new `removeAttribute`/`removeClass` calls are no-ops before the first `mountChrome`), author's run reports them unchanged.
- MEDIUM-1: the same setting still does not reach an open **hero sheet** ("Edit definition" button) — probe P12.
- LOW: nested-block chrome stripped on a flip (H-1 invisible block, order-dependent), throwing rebuild breaks the collapse invariant, O1 writes `false` into the session (overrides `collapsed: true` / Start collapsed on reopen), M11 test gap, F2 focus loss (measured in real Obsidian), F1 driver race (measured 3/3).
- F1 ruling: real, deterministic (3/3 in real Obsidian); FOLD a flush-and-wait in `setPrefs`, not a bare `flush()`. F2 ruling: reachable (measured), LOW, FOLD cheaply if the round happens, else Backlog.

## Findings

### MEDIUM-1 — "Show edit button on rendered blocks" still does not reach an open hero sheet
- `src/elements/hero/view.ts:226` (and `:243`): ds-hero opts out of the pipeline pencil (`noAuthoringButton`) and draws its own "Edit definition" header button gated on the same `authoringControls` pref, read only at render. The pipeline's new subscription rebuilds ds-hero's chrome, but the hero view's button is body DOM and nothing re-reads it.
- Scenario (probe P12, jsdom, real pipeline + real hero def): hero sheet open, flip ON → no "Edit definition" (`afterOn:false`); hero drawn with it ON, flip OFF → button stays (`afterOff:true`). With experimental on, a user flipping the setting sees every block change except hero sheets — the ticket's symptom, on the one element that carries its own edit control. The CHANGELOG bullet says the setting "now take[s] effect on blocks that are already open".
- Fix: in `HeroSheetView` (after the header is built) `watchPrefs(this.cx.prefs, this, ['authoringControls'], () => …)` that adds/removes just the "Edit definition" button in `.dse-hero__actions` (no sheet re-render — the view already notes a re-render is expensive). Add a jsdom test both directions. If the owner prefers, file it as a Backlog ticket next to SC-645 and narrow the CHANGELOG wording ("…on every block except a hero sheet's Edit definition button").

### LOW-1 — a flip strips a NESTED block's chrome when the inner block subscribed first (H-1 invisible block)
- `src/framework/pipeline.ts:629`: `root.querySelectorAll('.dse-chrome, .dse-chrome-summary').forEach((n) => n.remove())` is a descendant query, so it also removes the panel and one-line bar of any DSE block nested inside this card (SC-536 whole-block references render nested blocks inside the parent's root). Before SC-644 this ran only on (re)mount; now it runs on every flip.
- Scenario (probe P2b): inner block drawn and subscribed before the outer (an awaited nested `renderMarkdown`, e.g. `CardLayout.ts:503/528/552`), inner collapsed, flip "Show edit button" → inner rebuilds first, then the outer's rebuild deletes the inner's bar and panel: inner left `data-dse-collapsed="on"`, no bar, no panel — the zero-height unrecoverable block H-1 fixed. Outer-first order (fire-and-forget nested renders, e.g. ds-feature) is fine (P2a). Reachability in real Obsidian depends on whether `MarkdownRenderer.render` awaits the nested processor (unverified); the first-mount half of this is pre-existing.
- Fix (one line; precedent `focusHandoff.ts:261` already filters nested chrome the same way): `forEach((n) => { if (n.parentElement?.closest('[data-dse-element]') === root) n.remove(); })`. Verified: P2b green, author's 21 tests green.

### LOW-2 — a rebuild that throws on a collapsed block leaves it collapsed with no bar
- `src/framework/pipeline.ts:823-828`: the teardown (bar removed, panel removed) has already happened when `mountChromeFor` throws, and the catch only logs; `ensureCollapseInvariant(root)` (`:670`) never runs.
- Scenario (probe P5): a chrome whose `items()` throws on rebuild, block collapsed, flip → `collapsedAttr:"on", ownBar:false, panels:0` (invisible block). The author's own test (`chromeLivePrefs.test.ts:207`) covers "does not stop the others" but asserts nothing about the broken block (`toBeDefined()` is vacuous).
- Fix: `ensureCollapseInvariant(root);` in the catch (or a `try/finally` inside `mountPipelineChrome`). Verified: P5 green. Replace the vacuous assertion with `expect(broken.root.getAttribute('data-dse-collapsed')).toBeNull()` after collapsing it first.

### LOW-3 — O1 records the forced expand as a reader toggle (`false`), which then beats `collapsed: true` and Start collapsed on reopen
- `src/framework/pipeline.ts:663`: `session.set(host.blockKey(), CHROME_COLLAPSE_SLOT, false)`.
- Scenario (P3, P11): Start collapsed ON (or block key `collapsed: true`), block collapsed; Collapsible off → on; reopen the note in the same session → it opens EXPANDED (`collapsedAttr:null`), contradicting the CHANGELOG ("applies to blocks drawn afterwards, when you open or re-render a note") and the author's key, until plugin reload. The reader never toggled it.
- Fix: write `undefined` instead of `false` (`SessionStore` has no delete; `get` then returns undefined). O1's "ON again stays expanded" still holds through the carried state (`carriedCollapsedFor`). Verified: author's 21 tests green (incl. both O1 tests), P3 / P11 reopen collapsed.

### LOW-4 — test gap: clearing the session on ANY rebuild of a collapsed block is not caught (mutant M11 survives)
- `test/dom/framework/chromeLivePrefs.test.ts:263` does one rebuild after a hand collapse. Mutant M11 (`if (wasCollapsed === true)` without the `summaryEl === undefined` guard) makes the SECOND rebuild expand a block the reader collapsed; the suite stays 21/21.
- Fix: in that test flip `authoringControls` on AND off (two rebuilds) and add a rolling remount, then assert still collapsed (probe P10 does this and kills M11).

### LOW-5 (F2) — focus inside the rebuilt chrome falls to `<body>`; reachable in real Obsidian
- `src/framework/pipeline.ts:617-670`: teardown removes the focused button; nothing restores focus.
- Measured (e2e probe R2P-01, real Obsidian 1.14.4): focus on the open block's Collapse button in the main window; open settings (popout); `during1` = main window still `BUTTON|chrome.collapse` (focus is kept per window while the popout has it); after the off/on flip `during2` = `BODY`; after closing settings `after` = `BODY`. A keyboard user who pressed Ctrl+, from the panel comes back to the top of the document. No command / hotkey flips these prefs and the plugin has no `onExternalSettingsChange`, so the settings window is the only trigger.
- Ruling: LOW, worth a cheap fix in the same round (the jsdom "focus untouched" test only covers focus OUTSIDE the block; P7 shows the inside case → BODY). Fix: before teardown read `doc.activeElement`; if it is a `[data-dse-chrome-item]` owned by this root (`closest('[data-dse-element]') === root`) or the card-corner pencil, remember its item id; after the mount, if `focusIsFree(doc)`, `focusControl(<same item in the new panel> ?? <collapse/expand control> ?? <first focusable in root>, false)`. If not folded: Backlog ticket.

### LOW-6 (F1) — e2e `dse.setPrefs({})` loses to the previous scenario's debounced pref save
- `e2e/driver/dse.ts:536-544`: `saveData(data)` then `disablePlugin`; `main.ts:648` unload `flush()`es the pending 250 ms save of the OLD in-memory settings over it.
- Measured (R2P-02, real Obsidian): flip Collapsible off, close settings, `setPrefs({})`, reopen → 3/3 runs the plugin came back with `{"collapsibleDefault":false}` and no Collapse button. Deterministic, not a rare race; any scenario that starts with `setPrefs({})` right after a settings-window flip inherits it (green today only because the following scenarios don't depend on that key; SET-L05/L06 work around it with `shippedPrefs`).
- Proposed root fix checked (R2P-03): `prefsStorage.flush()` before `setPrefs` → 3/3 correct (`{}`, Collapse present). BUT a bare `flush()` immediately followed by `saveData` inside `setPrefs` puts two un-awaited writes of data.json in flight (`flush` → `saveSettings()` is fire-and-forget, `main.ts:174`), so ordering is not guaranteed. Prescribed: at the top of `setPrefs` (after `closeEverything`), flush AND wait until the file equals the plugin's in-memory settings — exactly `diskData()` (`e2e/driver/settings.ts:125`); then delete `shippedPrefs` from `live-behavioural.e2e.ts:12` and use `dse.setPrefs({})`. FOLD.

### INFO
- I-1 Mutant survivors M08 (`data-dse-chrome-mobile` not cleared: jsdom is never mobile), M13 (`chromeHandle = undefined` reset: only matters after a throw), M14 (reason not passed: only read when the O2 switch is true). Acceptable; M14 means the O2 "alternative" branch is unpinned while the switch is false — whoever flips it must add the test.
- I-2 Rapid flips (P1: 40 pencil flips + 41 collapsible flips, sync, no awaits): chrome Component count constant (2 → 2), one panel, collapse kept, O1 expand at the end. No accumulation.
- I-3 Pane + embed of the same block (P4, shared session key): both expand on OFF, both stay expanded on ON, pencil only on the persisting one. Unload-then-flip is a no-op (author test + M16 kill).
- I-4 A view unloaded by an EARLIER subscriber in the same `notify` pass would still be rebuilt once (the store iterates a snapshot, `seams/prefs.ts:228`); no subscriber of these two keys unloads views today, so unreachable. Note for SC-645 if its key has such a subscriber.
- I-5 e2e hygiene: SET-L01 / SET-G06 are plain `it(...)` (markers and `failsWith` gone; G06 asserts on AND off); SET-L05 / SET-L06 unique across `e2e/specs`; no bracketed ticket id in titles; no retries / settle-wait rescues added; SC-645/646/647/651 markers untouched.

## Mutants (author's suite `chromeLivePrefs.test.ts`, 21 tests; run on a private `git archive` copy of 92940547, restored after each)
| id | mutation | result |
|---|---|---|
| M01 | no `watchPrefs` call | KILLED 10 |
| M02 | `collapsibleDefault` not watched | KILLED 7 |
| M03 | `authoringControls` not watched | KILLED 4 |
| M04 | `carriedCollapsedFor` never carries | KILLED 2 |
| M05 | `collapsedDefault: carriedCollapsed ?? …` → `collapsedDefault` | KILLED 2 |
| M06 | O1 session clear removed | KILLED 1 |
| M07 | `data-dse-chrome` not cleared | KILLED 1 |
| M08 | `data-dse-chrome-mobile` not cleared | SURVIVED (I-1) |
| M09 | anchor `dse-chrome-anchor` not cleared | KILLED 1 |
| M10 | no catch around the rebuild | KILLED 1 |
| M11 | O1 clear on any rebuild of a collapsed block | SURVIVED (LOW-4; killed by probe P10) |
| M12 | O2 switch `true` | KILLED 4 |
| M13 | `chromeHandle = undefined` reset removed | SURVIVED (I-1) |
| M14 | rebuild not given its reason | SURVIVED (I-1) |
| M15 | `watchPrefs` without the described-key guard | KILLED 1 |
| M16 | `watchPrefs` binds to a never-unloaded owner | KILLED 2 |
| M17 | `watchPrefs` reports the wrong key | KILLED 1 |

Candidate fixes checked on the copy (author suite + probes, 32 tests): LOW-1 scope fix, LOW-3 `undefined`, LOW-2 invariant-in-catch each fix their probe; all three together 32/32 green.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc644-r2-rev/`)
- Gates: `r2-tsc.log`, `r2-lint.log`, `r2-jest-full.log` (+ `.rc`), `r2-e2e-full-run1.log` (+ `.rc`), `r2-lc-part1.log` … `r2-lc-part7.log` (+ `.rc`).
- Mutants: `mutants.py`, `r2-mutants-run1.out`, `r2-mutant-*.log`. Candidate fixes: `alts.py`, `r2-alts-run1.out`, `r2-alt-*.log`.
- Probes: `dse-copy/test/dom/framework/zz-r2-probes.test.ts` (P1-P11), `dse-copy/test/dom/elements/zz-r2-hero-probe.test.ts` (P12, log `r2-probe-1794675291188188950.log`), `dse-copy/e2e/specs/settings/zz-r2-probe.e2e.ts` (R2P-01..03, log `r2-e2e-probe-run1.log`, bundles `dse-copy/e2e/.out/20261114-165129-7480/`).
