# SC-690 r4: scoped re-review of the r3 fix (`43574bfe..a84fa7a5`)

**Executive summary**
- **Verdict: LAND-READY.** All six r2 findings and both nits are closed, each with evidence I gathered myself. O6 is implemented and holds.
- r2 findings: HIGH-1 closed · MED-1 closed · LOW-1 closed · LOW-2 closed · LOW-3 closed · LOW-4 closed · nit (census title) closed · nit (D06 cited for Cancel) closed.
- New findings: CRITICAL 0 · HIGH 0 · MED 0 · LOW 0 · INFO 3, none blocking.
- e2e full at `a84fa7a5` (my run): `OBSIDIAN-E2E done: 817/828 ok, 0 failed, 11 known-bug, coverage: 486/486 pairs`, `e2e exit 0`, and no `coverage gate FAILED` line (grep count 0).
- tsc + `tsc -p e2e` + lint: exit 0, 0, 0. jest: `Tests: 1 skipped, 14480 passed, 14481 total`, exit 0. Shots: 592 `ok`, exit 0. Freeze: `freeze OK (280/280 …)`, exit 0.
- Lifecycle 64/64 and parity 0/0/24, read from the tails of the r3 logs; every log ends `npm exit 0`.
- Mutants: M5 (r2 MED-1) is now KILLED. All 9 new mutants on the delta are killed (index, name re-check, O6 text and label, line placement and visibility).
- My r2 probe spec, re-run at the new head: 20/20 ok. My unit probes: 22/22, including 3 new roster-index re-check cases.

## r2 findings: status with evidence

| r2 finding | status | evidence |
|---|---|---|
| HIGH-1 coverage gate | **closed** | `e2e/manifest/montage-remove-hero-modal.ts:14` now carries `press:Escape` (cites D02, D03, D05, D06, D17, D18). My full run ends as below, and the log contains no `gate FAILED` line. MONT-D17 and MONT-D18 both pass. |
| MED-1 exact-name match not pinned | **closed** | New unit test "actions are matched the way the board matches them…" (`test/unit/model/montage-remove-hero.test.ts`). My M5 mutant (`model.ts:747` and `:775` changed to trim and lower-case) is **KILLED**: 1 failed, 194 passed, and the failing test is exactly that one. |
| LOW-1 same-name chip | **closed** | `removeMontageHero(m, name, rosterIndex?)` (`model.ts:763-768`). The modal passes the chip's index (`ConfigModals.ts:125`), and the view re-checks against the live model (`view.ts:645`). Real Obsidian: my R2P-05 presses the second of two Kiras ([Nature], [Climb]), and the note keeps Kira [Nature], so the second one went. The re-check refuses in all three cases the brief lists, with unit probes I wrote: the picked index now holds Bram (`false`); the roster is shorter than the index (`false`); the picked Kira moved because the first Kira was removed (`false`). The implementer's DOM test covers an outside reorder (no write). Mutants L1a (index ignored), L1b (no name check at the index), L1c (modal always sends index 0) and L1d (view drops the index) are all killed. |
| LOW-2 docs overclaim | **closed** | The plugin `CHANGELOG.md:27-29`, superproject `CHANGELOG.md:12-14` and `docs/gm-trackers.md:111-119` now say "success or failure limit" (true; r2 R2P-11b), "Removing a hero cannot be undone. Cancel or Escape closes the window and changes nothing", and "keys you added … are kept, written after the montage's own keys as with every save" (true; R2P-01). I found no new overclaim, apart from INFO-2. |
| LOW-3 line scrolled away, two scrollbars | **closed** | The line moved to `contentEl`, between the body and the footer (`ConfigModals.ts:110`). The list is the only scroller (`styles-source.css`, `.dse-mt__sheet-herolist { max-height: min(70vh, calc(85vh - 12em)); overflow-y: auto }`). My R2P-06 at a 1440×560 window (`setWindowSize` from the driver), 12 heroes, long name picked: dialog 70–490, body scroll 0 (300/300), list scroll 426 > 296, line 417–433, footer 449–473. Everything is on screen with **one** scrollbar (`evidence-r4/p06-twelve-short-window-viewport.png`). The implementer's regenerated 620px PNG shows the same. MONT-D17 pins it, and mutant L3 (line back inside the body) is killed. |
| LOW-4 status line hidden until pick | **closed** | The line has `role="status"`, `aria-live="polite"` and `aria-atomic="true"`, and is never `hidden`. It is empty at open (`ConfigModals.ts:110-113`; CSS uses `:empty` for its margin only). The DOM test asserts it is present and not hidden at open. MONT-D01 asserts its text is empty at open. Mutant L4 (hidden at open) is killed. |
| nit: census describe title | **closed** | `test/dom/e2eCensus.test.ts:470` now reads "its four modals". |
| nit: D06 cited for Cancel | **closed** | The manifest Cancel row now cites `['D04']` only. |

## O6: "Remove <name>" after a pick
- Before a pick the button reads "Remove", aria-label "Remove", disabled. After a pick both read "Remove Bram". Picking another hero changes both, and the control id is unchanged. Real Obsidian geometry (`p06-geometry-open.json`, `p16-geometry.json`): `btnText`, `btnLabel` and `btnDisabled` match, at 66px wide when disabled and 102px for "Remove Bram".
- Long name: a 59-character name gives a 221px button cut with an ellipsis, inside the dialog (`p06-twelve-short-window-viewport.png`: "Remove Ser Thaddeus-Alaric M…"). The accessible name holds the whole name. The implementer's MONT-D17 covers 80 characters at 620px, with the button inside the dialog and the text cut.
- Mutants O6a (text not updated) and O6b (label not updated) are both killed.
- **Did the new button text break anything I probed in r2?** No. At `a84fa7a5` my r2 probe spec (R2P-01…17) passes 20/20 with the same results as in r2:
  - Keyboard focus: open puts it on the first chip with a ring; the Tab order is the chips, then Cancel, then wrap; Enter twice on a chip writes nothing; Escape returns focus to the ⋯ item with a ring; keyboard Remove leaves focus on the rebuilt item with a ring.
  - Mouse: open then Remove, Escape or Cancel leaves focus on Obsidian's `.markdown-preview-view`, as in r2.
  - Remove pressed twice in one tick gives 1 write and 1 Notice.
  - SC-650: an outside rename while the window is open closes it with 1 Notice and writes nothing over the edit (R2P-13).
  - Two panes, the embed and the pinned sidebar copy all still work.
  - File integrity holds: text outside the block and the other block are byte-identical, and the odd-name removals match r2.

## INFO (new, non-blocking)
1. **The roster-index re-check compares names only.** If an outside edit **inserted another hero of the same name** before the picked one, the picked index would then hold a different same-named hero, and that hero is the one removed. My unit probe: Kira [Insight] inserted at the front, index 1 picked (meant [Climb]), and Kira [Nature] goes. In real Obsidian this cannot happen through the window: any outside change to the block closes the window first (SC-650; R2P-13 and MONT-D16), and the modal blocks this view's own writes. No action needed. A future change that lets the window survive outside edits would need to compare object identity, not names.
2. **Docs wording.** "Keys you added to the block are kept" is true for the rest of the block, but the removed hero's own keys (`player:`) and its actions' keys (`dc:`) go with the hero. This is the intended behaviour, and MONT-D11 pins it. The superproject `CHANGELOG.md:12` writes `**Remove <name>**` raw. On GitHub the `<name>` may be dropped as an HTML tag, so it would render "Remove". The same file already does this with `<note>` (lines 468, 495, 512), so it is house style. Optional: write "Remove Kira".
3. **Delta hygiene.** Nothing changed that no finding or O6 asked for. No test was weakened: the DOM `line().hidden === true` and e2e `not.toBeDisplayed()` assertions were replaced by stronger "present, empty, not hidden, outside the body" checks. Every pair the new D17 and D18 drive (hero click, submit click) is already in the manifest, and the full run's coverage gate is green at 486/486. Lifecycle was not re-run. The r3 logs carry no head sha, but no lifecycle scenario opens this window, and `a84fa7a5` changes only `remove-hero-modal.e2e.ts` relative to `1d9803a5`.

## Gates (I ran these at plugin `a84fa7a5`, superproject `980ac82c`)
- tsc / `tsc -p e2e` / lint: `tsc exit 0`, `tsc-e2e exit 0`, `lint exit 0` (only the pre-existing `.eslintignore` warning).
- jest: `Test Suites: 1 skipped, 313 passed, 313 of 314 total` · `Tests: 1 skipped, 14480 passed, 14481 total` · `jest exit 0`.
- e2e full, last 5 lines of `r4-e2e-full.log`:
  ```
  OBSIDIAN-E2E RECOV-R09 ok (518 ms)
  OBSIDIAN-E2E RECOV-R08 ok (443 ms)
  OBSIDIAN-E2E done: 817/828 ok, 0 failed, 11 known-bug, coverage: 486/486 pairs
  OBSIDIAN-E2E coverage driven: 499 (control, kind) pair(s) -> /home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/draw-steel-elements/e2e/.out/coverage.json
  e2e exit 0
  ```
  `grep -c "gate FAILED"` gives 0.
- Shots: 592 `^  ok ` lines, `shots exit 0`, modal button host-leak OK. Freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, `freeze exit 0`.
- Lifecycle, from the tails of `sc690-r3-logs/r3-life1..7.log`: `done: 21/21`, `16/16`, `9/9`, `4/4`, `7/7`, `4/4`, `3/3`, each `0 failed` and `npm exit 0`, so 64/64.
- Parity, from the tail of `sc690-r3-logs/r3-parity.log`: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**` and `npm exit 0`.
- I used the scratch clone (`git worktree add` at `a84fa7a5`) only for mutants and probes, then removed it. The worktree is as I found it: plugin clean at `a84fa7a5`, superproject ` M draw-steel-elements` as before, at `980ac82c`.

## Mutants at `a84fa7a5` (the three SC-690 suites, 195 tests)

| id | mutant | result |
|---|---|---|
| M5 | entries matched trimmed / case-insensitive (`model.ts:747`, `:775`) | KILLED (1 fail: the new near-miss test) |
| L1a | roster index ignored (first same-name hero goes) | KILLED (5) |
| L1b | no name re-check at the index | KILLED (3) |
| L1c | modal always passes index 0 | KILLED (3) |
| L1d | view drops the index | KILLED (2) |
| O6a | button text not updated | KILLED (2) |
| O6b | accessible name not updated | KILLED (2) |
| L3 | line back inside the scrolling body | KILLED (1) |
| L4 | line hidden at open | KILLED (2) |

## Artifacts
- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r4-rereview-report.md`
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc690-review-r4/`
  - logs: `r4-e2e-full.log`, `r4-jest-full.log`, `r4-tsc.log`, `r4-tsc-e2e.log`, `r4-lint.log`, `r4-shots.log`, `r4-freeze.log`, `r4-probe-e2e.log`, `r4-probe-unit.log`, `r4-mutants.log`, `r4-mut-*.log`, `r4-mut-*.diff`
  - probe sources: `probe-src/r2-probe.e2e.ts`, `probe-src/r2-probe.test.ts` (vault notes unchanged from `.../sc690-review-r2/probe-src/`)
  - evidence: `evidence-r4/` (PNGs incl. `p06-twelve-short-window-viewport.png`, `p16-mid-bram-picked-modal.png`, `p05-dupes-second-picked-modal.png`; geometry and focus JSON; before/after notes)
