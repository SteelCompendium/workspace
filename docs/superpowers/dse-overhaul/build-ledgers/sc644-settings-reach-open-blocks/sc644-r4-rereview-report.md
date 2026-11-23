# SC-644 r4 scoped re-review report

## Executive summary
- Verdict: **LAND**. Every r2 finding (MEDIUM-1, LOW-1..6) is closed as prescribed; my r2 probes that went red now pass on the final head. HIGH 0 · MEDIUM 0 · LOW 3 (gaps in the tests only; the code is right, probes prove it; optional tests-only fold, needs jest only) · INFO 4.
- Heads: dse `16737a8e` on `12aaf5b5` (range-diff: the 3 r1 commits are `=`, identical). Superproject `b6a33ee0` on `ea6b4582`: `bd44886f` changelog + ONE bump to `16737a8e`; diff = `CHANGELOG.md` + `draw-steel-elements` only. **Base moved DURING this review (SC-628 landed):** dse `origin/develop` is now `10c271fe` (7 montage commits), workspace `origin/main` is now `20004425`. The dse changes touch no file this branch touches (the file lists do not intersect); the superproject CHANGELOG `## Unreleased` will need a trivial merge. A rebase (dse onto 10c271fe; superproject onto 20004425, changelog + ONE bump) is needed before landing; re-gating on the new base is the dispatcher's/landing call.
- Gates on the final head (r4): tsc clean · lint clean · jest **13070 passed / 1 skipped** · e2e **`580/599 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs`** · lifecycle **64/64** (parts 21+16+9+4+7+4+3, all 0 failed; the runner started Obsidian 1.15.1). Author's two full e2e runs (on 3a0e79a3) both 580/599, 19 kb, 416/416 confirmed from their logs.
- Mutants on the delta: 19 run (M11 + R01-R18), 14 killed, 5 survived (R10, R12, R15, R16 = the 3 LOW test gaps; R11 has no observable effect, INFO). M11 now killed.
- Real Obsidian: R2P-02 (F1 race) now 3/3 correct with plain `setPrefs({})`; R2P-01 focus stays inside the block (`DIV|stamina.bar`, not BODY).
- Evidence shots (real Obsidian 1.14.4, final-head code): `sc644-shot-collapsible.png`, `sc644-shot-editbutton.png`, `sc644-shot-startcollapsed.png` in the ledger dir.

## Rebase / bases
- `git range-diff 620d5774..92940547 12aaf5b5..8d33d03c`: `1: 29167670 = cd4770cf`, `2: faabbbd4 = 87177e09`, `3: 92940547 = 8d33d03c` (no change).
- r3 `411e8a50`, `3a0e79a3`, r3b `16737a8e` on top. Worktree and superproject clean before/after.
- SC-638 interplay: `setPrefs` now imports `diskData` from `e2e/driver/settings.ts` (which imports only `./page`; no cycle). It does not touch `openNote`'s new `{ errorCard }` option. The full e2e is green.

## r2 findings: closure check
| r2 finding | code on final head | verified by |
|---|---|---|
| MEDIUM-1 hero "Edit definition" not live | `hero/view.ts` constructor `watchPrefs(…['authoringControls'], syncEditDefinition)`; per-button owner; r3b focus hand-back | P12 now `{afterOn:true, afterOff:false}`; P13 re-render keeps exactly one; real-Obsidian shot row 2 (0 → 1) |
| LOW-1 nested chrome stripped | `pipeline.ts` teardown filter `closest('[data-dse-element]') === root` | P2b green (inner keeps bar + panel) |
| LOW-2 throw skips invariant | catch calls `ensureCollapseInvariant(root)` | P5 green (`collapsedAttr:null`) |
| LOW-3 O1 writes `false` | `session.set<boolean \| undefined>(…, undefined)` | P3 / P11 reopen → collapsed |
| LOW-4 M11 test gap | new multi-rebuild test | M11 KILLED (1 red) |
| LOW-5 focus to BODY | `holdChromeFocus(root, pencilEl)` in `chrome/focusHandoff.ts`, `restoreFocus()` after the invariant | P7 → `BUTTON collapse`; R2P-01 real Obsidian → `DIV|stamina.bar` (see INFO-1) |
| LOW-6 setPrefs race | `e2e/driver/dse.ts` `await diskData()` after `closeEverything()`; `shippedPrefs` gone | R2P-02 3/3 `{collapse:1, mem:"{}"}`; full e2e green |

## Findings (new)

### LOW-1 (test gap): a hero sheet re-render with the setting ON is untested (mutant R16 survives)
- `src/elements/hero/view.ts` `renderHeader`: `if (this.editDefinitionBtn) this.removeChild(…); this.editDefinitionBtn = null;` before `syncEditDefinition()`. Delete those two lines and the suite stays 58/58. But the handle then points at the old, detached button, so after any re-render of the sheet (`update()`, e.g. after a write the view adopts), "Edit definition" is gone. Probe P13 under R16 gives `afterUpdate: 0`.
- The code is right today (P13 on HEAD: `afterUpdate: 1`).
- Fix: in `heroSheet.test.ts` add a test: setting ON, `await view.update(view.currentModel())`, expect exactly one "Edit definition" and that it opens the form.

### LOW-2 (test gap): a removed button's owner Component not being unloaded is not caught (mutant R15 survives)
- `hero/view.ts` `syncEditDefinition` OFF branch `this.removeChild(owner)`. Without it, each flip leaves one more Component under the view: P13 under R15 grows the view's children 5 → 10 over 10 flips, and their listeners stay attached until the sheet unloads.
- Fix: same test as LOW-1, plus 10 flips; assert the view's child count does not change.

### LOW-3 (test gap): focus restore with a nested block present is untested (mutants R10, R12 survive)
- `focusHandoff.ts` `holdChromeFocus`, the `mine` filter, and `firstControlOf`'s `closest('[data-dse-element]') === root`. Drop either filter and the suite stays green. Without it, the outer block's restore can pick the NESTED block's same-named control: the new outer panel is appended last, so the nested panel comes first in document order. Probe P14 under R10 sends focus to `INNER-collapse`; on HEAD it goes to `outer-collapse`.
- Fix: in `chromeLivePrefs.test.ts` "keyboard focus" add: outer Collapse focused, nested chrome block inside, flip `authoringControls` → focus is on the outer block's Collapse. A twin test covers the fallback: outer pencil focused, flip OFF, with a nested block → focus lands on an outer control.

### INFO
- I-1 R2P-01 in real Obsidian, off-then-on flip: focus ends on the block's stamina bar (`DIV|stamina.bar`), not the Collapse button. On OFF the Collapse button is gone, so the first control in the block takes focus. On ON focus is already on a non-chrome control and is left alone. This follows the ruled fallback order and never goes to BODY. Not a defect (my r2 probe asserted too strictly).
- I-2 R11 (`holdChromeFocus` also accepting focus outside the root): no observable effect. The only such focus is another block's control that still holds focus at restore time, and the `focusIsFree` guard then does nothing. No test possible; drop.
- I-3 The hero `watchPrefs` sits in the constructor. `pipeline.ts:534` creates the view before it is added to its host (`:812-814`), so an exception in between would leave the subscription on an owner that never loads. `applyPrefOverrides(root, view, …)` (`:539`) already does the same. Nothing that can throw there is known; drop.
- I-4 `setPrefs` now always waits for `diskData()`, which allows up to 800 ms grace when data.json was never written. The full run stays in its normal time; no flake seen.

## Mutants (delta; suites `chromeLivePrefs.test.ts` + `heroSheet.test.ts`, 58 tests; private copy of 16737a8e, restored after each)
M11 KILLED 1 · R01 nested filter removed KILLED 2 · R02 invariant in catch removed KILLED 1 · R03 O1 writes false KILLED 2 ·
R04 restoreFocus not called KILLED 5 · R05 no focusIsFree guard KILLED 2 · R06 pencil not recognised KILLED 1 · R07 no
Collapse fallback KILLED 1 · R08 no first-control fallback KILLED 1 · R09 same-item lookup dropped KILLED 3 · **R10 `mine`
filter dropped SURVIVED** (LOW-3) · **R11 outside-root focus accepted SURVIVED** (I-2) · **R12 firstControlOf nested filter
dropped SURVIVED** (LOW-3) · R13 hero no watchPrefs KILLED 4 · R14 hero no focus hand-back KILLED 1 · **R15 hero owner not
unloaded SURVIVED** (LOW-2) · **R16 hero stale handle on re-render SURVIVED** (LOW-1) · R17 hero button not removed KILLED 3
· R18 hero readOnly ignored KILLED 1. P13 kills R15 and R16; P14 kills R10.

## Evidence screenshots (real Obsidian 1.14.4, e2e driver, private copy of the final head; labels carry the meaning, not colour)
- `sc644-shot-collapsible.png`: left "Before": the open stamina bar with its Collapse (chevron) button. Right "After Collapsible by default OFF": same open block, no Collapse button, still expanded.
- `sc644-shot-editbutton.png`: row 1, an open stamina bar with the Pin and Collapse items, then after Show edit button ON the Edit pencil added to the same panel. Row 2, an open hero sheet header with only "Respite", then after the flip the "Edit definition" (gear) button beside Respite.
- `sc644-shot-startcollapsed.png`: three panels. Open block expanded; after Start collapsed ON still expanded (unchanged); after reopening the note, the one-line collapsed bar "STAMINA (15/20)".

## Evidence files (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc644-r4-rev/`)
- Gates: `r4-tsc.log`, `r4-lint.log`, `r4-jest-full.log`, `r4-e2e-full-run1.log`, `r4-lc-part1.log` … `r4-lc-part7.log` (each + `.rc`).
- Mutants: `mutants4.py`, `r4-mutants-run1.out`, `r4-mutant-*.log`.
- Probes: `dse-copy/test/dom/framework/zz-r2-probes.test.ts` (P1-P11, P14), `dse-copy/test/dom/elements/zz-r2-hero-probe.test.ts` (P12, P13), `dse-copy/e2e/specs/settings/zz-r2-probe.e2e.ts` (R2P-01..03; `r4-e2e-probe-run1.log`), `r4-probe-*.log`.
- Shots: `dse-copy/e2e/specs/settings/zz-r4-shots.e2e.ts` (R4S-01..03, `r4-e2e-shots-run1.log`; fixture `dse-copy/e2e/vaults/shipped/Settings/r4-hero.md` in the copy only), raw `shots-raw/`, composer `compose.py`.
