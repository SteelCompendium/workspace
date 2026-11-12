# SC-594 r2 implementation report (implementer aef741ab)

**Executive summary**
- STATUS: DONE_WITH_CONCERNS (one design deviation from the owner's memo ruling, with its measurement, below; all gates green).
- Rebased onto `origin/develop` = `e0e49d4d` (no newer). dse HEAD `0bf5989d` (6 commits), superproject branch HEAD `088a24fb` (CHANGELOG only, no pointer bump).
- Rule: r1 §B items 1-7 as built (`rebaseCardPin` / `cardLinkLine`, `hover-link` log in new `src/framework/host/hoverLinks.ts`, registered from `registerFrameworkElements` = `onload`).
- Memo measurement (real Obsidian 1.15.1): a card is built and mounted while its element is DETACHED, so it cannot look up its popover until the first click; a pass-over `hover-link` event on the same parent CAN come first (measured: the click then wrote the identical counter). Fix: the link is bound once per popover at the first lookup OR at the arrival of the next event, whichever is first (J17).
- Gates: tsc / lint clean; jest 7616 passed / 2 skipped (7304 + 312); lifecycle 57/57 (184 / 325 / 404 / 298 / 425 s); e2e 270/274 ok, 0 failed, 4 known-bug, 169/169 pairs; `styles.css` sha256 identical to a clean e0e49d4d build (shots / freeze / parity carry, not re-run).
- Red on e0e49d4d source: 119 new/changed jest tests (19 named + 100 sweep cells), and all 9 G-S92 trials.
- Mutants: 18 of 20 killed; survivors mM (equivalent, as in r1) and mL2 (the r7 guard for cards, defence in depth; no test I could build distinguishes it).
- Part 5 wall 425 s (target <= ~430 s, limit 600 s). No G-S64 phases added.

## Rebase
`git fetch origin`; develop moved `ce4937ef` -> `e0e49d4d` (SC-588). Rebased the (empty) branch; new base **e0e49d4d**. `npm ci` ran (rc=0). Superproject worktree HEAD before my commit `d85f7691`.

## The memo measurement (first lookup vs popover creation)
Method: temporary instrumentation in `hoverLinkOf` + a page-side `hover-link` / MutationObserver log, scratch scenario `P594M` (copy: `sc594-r2-measure-scenario.mjs.txt`), real Ctrl-hover and real clicks, a host note with two links (`[[src#Tracker]]`, `[[src#Other]]`, two headings each holding only the identical counter). Logs: `sc594-r2-measure-memo-lazy-first-lookup-only.log`, `sc594-r2-measure-memo-final.log`, `sc594-r2-measure-scripted-xy.log`.
- Timeline (RV and LP identical): `hover-link` event (parent has no popover yet) -> ~300 ms -> popover element added -> card constructed + `setMountedBody` (element **not yet inside `.hover-popover`**: `closest('.hover-popover')` null, `isConnected` false; 4-10 ms after the popover) -> card attached to the popover (+10-14 ms after the popover). So the host's constructor / `rebind` / `setMountedBody` cannot do the first lookup; the earliest lookup point is the first click (`takePin`).
- A lookup CAN come later than another event on the same parent: pass-over trial, Y's `hover-link` fired 656 ms after X's popover opened (`hoverParent.hoverPopover` was still X's popover), Y's popover never opened. With only the memo-at-first-lookup (the owner's ruling as worded) the first click was the first lookup, newest matching event = Y, and the + wrote **the identical counter under Y** (`current_value: 5,6`, log `...lazy-first-lookup-only.log`).
- Proposal, implemented (deviation, see below): bind at the first lookup OR at the arrival of the next `hover-link` event (before it is recorded, every popover that is open and not yet bound is bound to the newest event that names it: that is its own event, nothing newer exists). Final bundle: the same pass-over trial writes A (`6,5`, no Notice), normal RV and LP hovers write A (`...memo-final.log`).
- Not measured / residual: a Y event BEFORE X's popover is created while X's popover still opens and Y's does not (scripted X then Y 100 ms apart opened both popovers, `...scripted-xy.log`; a real quick pointer move to Y did not even fire Y's event). In that case the first lookup would bind Y's link to X's popover; the whole-part check still needs Y's part to equal X's part text exactly. Reported, not closed.

## Design as built (deviations from r1 §B)
Files: `src/framework/host/hoverLinks.ts` (new), `ReadingModeBlockHost.ts`, `registerFrameworkElements.ts`.
- §B1 hover-link record: `registerHoverLinks(plugin)` -> `plugin.registerEvent(workspace.on('hover-link', ...))`, called from `registerFrameworkElements` (which `onload` calls), plugin-scoped via `registerEvent`; log per app (`WeakMap<app, {events (newest 16), bound: WeakMap<popoverEl, link|null>}>`, so a jest app gets a fresh log). `hoverLinkOf(app, el)` identity-matches `hoverParent.hoverPopover.hoverEl === el.closest('.hover-popover')`.
- **Deviation 1 (owner change + measurement):** `bound` memo as the owner required, plus the bind-at-next-event step (the memo-at-first-lookup alone leaves the measured pass-over hole). A first lookup that finds no event memoizes null (a later event naming that popover does not bind it: J17 third test; mutant mN).
- §B2-B3 `takePin(false)`: card in an embed takes the own-write record when no own fence (`embedded ? pinFromLastWrite() : null`) and the r7 guard (`if (embedded)`); a hover whose recorded link has no `#` (whole-note hover) is not partial; `rebaseCardPin` (part IS the note -> link via `cardLinkLine` -> own last write if of the known body -> stays partial); never `searchedPinLine`.
- §B4 `cardLinkLine` as the probe (link, one-place check only while the known body occurs twice, `start` or `start + 1` for a heading link, whole-part equality with trailing blanks dropped, fence at the line holds the known body, `^id` marker). Small refactor: `embedSrc()` helper for the `src` lookup in `takePin` and `cardLinkLine` (`embedStartLine` left as is).
- §B5 `replaceSource`: the card pin's rebase is awaited conditionally (`const cardRebase = pin && !options?.pin ? pinRebased.get(pin) : undefined; if (cardRebase) await cardRebase;`, after `pin` is taken, as the probe), and `partialCard` -> `'miss'` (today's Notice). No unconditional await.
- §B6 second +: uses the record (J5, J6, J16, J18). §B7 unchanged: forms (`pinPosition` -> `takePin(true)` -> `rebasePin`), non-embedded cards, `pinnedTarget`, `twinned`, `landsOnOtherBlock`.
- Code comments cite SC-594 per rule, one sentence each.
- Registration placed in `registerFrameworkElements` (not `main.ts`): same call path as `onload`, beside the other workspace events; tested through the real `onload()` in `plugin-wiring.test.ts`.

## Commits (dse, branch sc594-hover-heading-card-write, on e0e49d4d)
- `b9e0f7aa` fix(host): card + / - placed through the hover link (hoverLinks.ts, host, registration)
- `0d02f083` test(host): new `reading-mode-host-hover-card.test.ts` (J1-J17, sweep), the 5+1 existing tests fixed/flipped, the onload test in `plugin-wiring.test.ts`
- `f37d9f00` test(host): J17 "no announced link", J18 two counters in one callout
- `9f1b1432` test(host): J18 also after a redraw
- `4250a2cb` test(lifecycle): G-S92 (fixtures, `gs92Trial`, scenario after G-S87 before G-S56, header comment)
- `0bf5989d` docs: dse CHANGELOG.md Unreleased bullet
Superproject worktree: `088a24fb` docs: CHANGELOG.md `## Unreleased` bullet (only file committed; `git status --porcelain` shows ` M draw-steel-elements`, the submodule HEAD, no pointer bump as ordered).

## Tests
- New file `test/dom/framework/reading-mode-host-hover-card.test.ts`: 311 tests = J1 (x2 long/short), J2, J3 (x3: P14, no record, own edited before click), J4, J5 (x2), J6 (x2), J7, J8, J9, J10, J11, J12, J13, J14, J15, J16, J17 (x3 + 3 hoverLinks unit tests), J18 (x4), and the 280-cell sweep `test.each` (7 constructs x 5 link shapes x RV/LP x 4 outside edits: asserts never TWIN / ADDED and A vs refused + one Notice per cell). `plugin-wiring.test.ts`: +1 (onload registers the `hover-link` listener that records the link of a card's popover). `reading-mode-host-pin.test.ts`: `hoverEl(link)` notes a `hover-link` record (via `embedded()`); the 5 hover tests use the heading BODY (lineStart 1) / block link; 1 renamed and flipped ("a card (+/-) write's pin uses the host's last write when the part is stale: a second + lands in the block the first + was pressed on"). No bracketed ids in titles.
- Delta: 7304 -> 7616 passed (+312 = 311 + 1); 2 skipped unchanged.
- Spot count of the sweep on e0e49d4d source: 100 of the 280 cells red (base writes the twin in 40, refuses in 60), 0 saved->refused.

## Gate numbers (own summary lines; logs in the ledger dir)
- tsc incl. `tsc -p e2e`: `rc=0`, `rc_e2e=0` (`sc594-r2-gate-tsc.log`). lint (`eslint src main.ts e2e`): `rc=0` (`sc594-r2-gate-lint.log`).
- jest full: `Test Suites: 1 skipped, 264 passed, 264 of 265 total` / `Tests: 2 skipped, 7616 passed, 7618 total` (66 s; `sc594-r2-gate-jest.log`). No load timeouts.
- lifecycle (`sc594-r2-gate-lifecycle-part{1..5}.log`): part 1 `done: 21/21 ok, 0 failed` wall 184 s; part 2 `16/16` 325 s; part 3 `9/9` 404 s; part 4 `4/4` 298 s; part 5 `7/7` (G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S92) 425 s. Union 57/57. Each call was moved to the background by the tool at 180 s and completed with its notification; I waited with `tail --pid` on the lifecycle process (read-only wait) between notifications.
- e2e: `OBSIDIAN-E2E done: 270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` rc=0 wall 132 s (`sc594-r2-gate-e2e.log`).
- styles.css: sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` for my build and for a build with the e0e49d4d versions of the two changed `src` files (main.js differs: `0867e634...` vs `607c7bd5...`) (`sc594-r2-gate-styles-css.log`). Identical -> shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147, freeze 280/280, parity 0/0/24 carry; not re-run.

## Red-on-base evidence
- jest: `sc594-r2-jest-red-on-base.log`: the three touched test files against the e0e49d4d versions of `ReadingModeBlockHost.ts` and `registerFrameworkElements.ts` (hoverLinks.ts present so they compile): `Tests: 119 failed, 354 passed, 473 total` = 19 named (J1 x2, J2, J3 x3, J4, J5 x2, J6 x2, J9, J12, J14, J16, J17 x2, the flipped pin test, the onload test) + 100 sweep cells. Green on base as controls: J7, J8, J10, J11, J13, J15 and the 5 fixed hover tests (base ignores the record).
- lifecycle: `sc594-r2-lifecycle-gs92-base-e0e49d4d.log`: G-S92 FAIL on the e0e49d4d bundle, `0/1 ok`: (a)-(f) values `[5,5]` + the dropped-write Notice (refused), (g) `[9,6]` and (h) `[9,6]` (the identical counter written, no Notice), (i) `[5,5]` + Notice. Green on the r2 bundle: `sc594-r2-gate-lifecycle-part5.log` and the solo run (85 s with build).

## Mutants (`sc594-r2-mutants.log`; runner `sc594-r2-mutate.py.txt` / `sc594-r2-mutants.sh.txt`)
Against the three suites (473 -> 478 tests as tests were added). mA 44 failed, mB 32, mC 43, mD 1 (J13), mE 1 (J8), mF 3, mG 3 (J10, 2 unit), mH 3, mI 21, mJ 1 (J14), mK 1 (J15), mL 1 (J16), mN 1 (J17 no-announced-link), mO 1 (J17 pass-over), mP 1 (onload registration), mQ 1 (bounded log), mR 26, mS 9: all killed. Survivors: **mM** (no known-body check in `cardLinkLine`: equivalent, `pinnedTarget` checks the body at write time, as in r1) and **mL2** (the r7 guard for cards removed): J18 (two counters in one callout, + then a second +, block and heading hover, stale and redrawn window) passes with and without it, because `rebaseCardPin`'s whole-part check falls through to the same own-write record; kept as defence in depth per §B2. mG (no popover identity in the lookup) is killed by J10, not by J9 (the bind-at-next-event step covers J9 even without the lookup identity).

## Other artifacts
`sc594-dse-verify-proposal.md` (footgun (3) replacement, "Hover card writes (SC-594)" bullet, CURRENT block, part 5 list and wall time). Measurement artifacts `sc594-r2-measure-*`. Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc594-r2-impl/`. The scratch harness copy `visual-harness/obsidian-lifecycle-scratch594.mjs` was deleted by literal path; the two kept-FAIL lifecycle temp dirs I created (`/tmp/dse-obsidian-lifecycle-9jYZgg`, `...-yjkkU7`) were deleted by literal path.

Drive-by fixes: none.

Follow-ups:
1. Both CHANGELOGs' SC-595 bullet ends "+ or - in a preview with an identical counter elsewhere is unchanged (SC-594)." That sentence is stale once SC-594 lands (both are `Unreleased`); left alone (not mine, a wording choice); the owner may reword it when promoting.
2. Residual (unmeasured): a `hover-link` event for another link arriving BEFORE a popover exists, when that popover still opens and the other one does not; its first lookup would then bind the other link (whole-part check still limits it to an identical part). Needs a real-Obsidian timing trial with a precise pointer path; not reachable by the scripted-trigger path (both popovers open).
3. mL2: a test that distinguishes the card r7 guard (or the owner may drop the guard for cards; it is behaviourally redundant behind `rebaseCardPin`).
4. The Bash tool backgrounds any call over 180 s even with a 590000 timeout; the dse-verify lifecycle instructions still say "foreground, one gate per call". Completion was announced by notification, nothing was lost, but the footgun text could say so.
5. SC-596 (forms in hovers / null-pin forms) and SC-524 (card shows the unsaved value after a refusal; still true after this change for a refused card write) unchanged, out of scope as briefed.
