# SC-545 r4 fix report

## Executive summary
- **DONE.** MEDIUM-1 and LOW-1..4 folded. Rebased onto dse `develop` `0698550f` (SC-472), after 367a2f1d (the course correction came mid-battery; the 367a2f1d part 1-2 logs are kept as `sc545-r4-onbase-367a2f1d-*`).
- Plugin HEAD **`c0ce04cf`** (14 commits over `0698550f`); superproject **`586c82ef`** (CHANGELOG only; pointer not bumped).
- Gates on `0698550f`-based HEAD: tsc, `tsc -p e2e`, lint clean; jest **6408 passed / 1 skipped / 254 of 255 suites** (after shots; fresh 6407 / 2; +30 tests); lifecycle **50/50 = 21 + 16 + 8 + 4 + 1** (184, 320, **302**, 296, 188 s; part 3 stays under 540 s with phase (h); G-S6e ok, G-S63 (e) scroll 2519 -> 2519 and 522 -> 522 with SC-472's backstop); e2e **128/128, 0 failed, 89/89**; shots 592, 0 FAIL, 161/966; freeze 280/280; parity 0/0/24.
- Phase (h) red/green: FAILS on a `0698550f` bundle (and (a)-(f)), FAILS on the pre-fix bundle (`34f1a426`, = 1d655b8f's source rebased; (h) only), PASSES on HEAD (all 8 phases).
- Mutants for the new code: 6 (9-14), all caught by jest (3, 5, 2, 1, 1, 1 failures); 9, 10, 13 also fail G-S63 (h) only.
- Per-update cost of the off-page check: one `querySelector` on the editor DOM, 4-7 us per call (about 150 nodes); 300 typed characters 2.6-3.3 ms/dispatch with the fix vs 2.7-2.9 on the base bundle (noise); scroll steps 0.16-0.22 ms vs 0.16-0.21.
- **Found and fixed in the gate (not in r3's list):** G-S63 (b) was flaky (3 of 5 runs failed): Obsidian re-renders an LP embed's content at the toggle on about two runs in three (raw fence while off, nothing redrawn after enable), and the fallback then legitimately rebuilds once. Phase (b) now allows at most 1 rebuild; the "fallback must not run" assertion stays for every other phase. Six consecutive green runs after the change (65-72 s).
- Deviations from rulings: none. Follow-ups: 2 (below).

## Per finding
- **MEDIUM-1 (off-page card).** `src/framework/host/replugRemount.ts` `inStickyWidget` (about :60): a root that is not connected is judged by `closest('.cm-embed-block.cm-callout, .internal-embed')` alone (no `.markdown-source-view` above a detached subtree); `stashForReplug` no longer requires `isConnected`. New `ReplugRemounter.remountReattached(scope)` (about :215): `if (disposed) return; if (scope.querySelector('[data-dse-replug]') === null) return;` then the shared `remountWithin(scope)`. `src/framework/host/livePreviewReconcile.ts` (about :30): `livePreviewReconcileExtension(remounter, replug?)` calls `replug?.remountReattached(update.view.dom)` in the existing update listener (docChanged / viewportChanged / selectionSet). `src/framework/registerFrameworkElements.ts` (about :76-90): the `ReplugRemounter` is built before the editor extension and passed to it. G-S63 phase (h) (`visual-harness/obsidian-lifecycle.mjs`, new fixture `Lifecycle/replug-far.md`): callout + 200 paragraphs; scroll to the end until the tagged root is detached and still held by the registry (measured scrollTop 8909), toggle, scroll back: fresh root owned, real + writes [6] -> [7], 0 rebuilds. Corollary (update from a pre-fix build with an off-page card): documented as a limit, no code.
- **LOW-1.** `remountWithin` wraps each element in try/catch (log, drop the mark, `inFlight.delete`, continue); `rebuildUndrawn` wraps `hasUndrawnBlocks` in the same try; `registerFrameworkElements.ts` `replug.run().catch(console.error)`. Tests: throwing-getter stash (other card still drawn), synchronously throwing mount, rejecting `run`.
- **LOW-2.** Jest: `dispose()` during a slow remount with a raw DSE fence in an embed widget: `rebuilt: []` and no `setViewData` (mutant 12 fails it).
- **LOW-3.** CHANGELOG (superproject `586c82ef`): the off-page redraw, the whole-note redraw that clears undo history, the one-time update (off-page card stays dead until reopening), "Not covered: cards on a canvas and in hover previews". `.repo-docs/architecture.md`: same limits plus the off-page row text and the embed case. Proposal: "Not covered" clause in the G-S63 text.
- **LOW-4.** Header comment now names `ReplugRemounter.rebuildUndrawn`.
- INFO-1..5: no action, as ruled.

## Red / green for (h)
| Bundle | Result |
|---|---|
| `0698550f` (no fix) | FAIL: (a)-(f), (h) ("the card on screen is not a redrawn, owned card", + wrote nothing); (g) passes; `sc545-r4-red-gs63-0698550f.log` |
| `34f1a426` (pre-MEDIUM-1 source) | FAIL: (h) only, same message; `sc545-r4-red-gs63-34f1a426-pre-medium1.log` |
| `367a2f1d` and `503056ea` (same two on the earlier base) | same results (`sc545-r4-red-gs63-367a2f1d.log`, `...503056ea-pre-medium1.log`) |
| HEAD | PASS 8/8; (h): "card out of the page [true], held by the registry [true], scrollTop 8909 ... scrolled back: cards 1, old root on screen [false], owned [true], + wrote [7], rebuilds 0" |

## Mutants (new code), `sc545-r4-mut-<n>-jest.log` / `-gs63.log`
| # | Mutant | jest | G-S63 |
|---|---|---|---|
| 9 | no remount on reattach | 3 fail | (h) |
| 10 | detached card not stashed | 5 fail | (h) |
| 11 | no per-element try/catch (LOW-1) | 2 fail | - |
| 12 | no `disposed` check after the await (LOW-2) | 1 fail | - |
| 13 | update listener does not call the remounter | 1 fail | (h) |
| 14 | `run()` without `.catch` | 1 fail | - |

## Cost per update (`sc545-r4-perf-green.json` vs `sc545-r4-perf-base367.json`; scratch runs perfG1-3, perfR1-2)
Probe in real Obsidian (1.15.0), a 150-node viewport: `contentDOM.querySelector('[data-dse-replug]')` x20000: 3.9-7.1 us per call. 300 `cm.dispatch` typing steps: mean 2.6-3.3 ms (fix) vs 2.7-2.9 ms (base without the call); p95 3.8-5.7 vs 4.1-4.4 ms; 200 scroll steps 0.16-0.22 ms vs 0.16-0.21 ms. No measurable difference.

## Embed flake (new finding), evidence `sc545-r4-embed-flake-*.log`, `sc545-r4-flake-b-part3-before-b-fix.log`
Sampler on the embed at the toggle: passing run: the embed keeps its old (unowned) card at disable, the remount draws the new one (0 rebuilds). Failing run: at disable (t = 110 ms) the embed content is replaced by raw code (`raw 1, roots 0`) and stays raw after enable (1009 ms); the fallback rebuilds the note at about 1.5 s and the card is owned afterwards. I first tried a 400 ms wait before the fallback judges (the raw fence persisted past it, so that did not help) and reverted it; the correct behaviour is the fallback, so phase (b) allows 1 rebuild (about 4 of 6 runs use it). Stability after the change: `sc545-r4-stability-green-run1..6.log`, 6/6 ok.

## Follow-ups:
1. An embed that Obsidian re-renders at the toggle always costs a note rebuild (undo history); avoiding it would need a redraw of the embed from outside Obsidian's renderer. Left alone.
2. Canvas file-node cards and hover-popover cards still stay dead after an off/on (ruled DROP; documented under "Not covered").

## Drive-by fixes:
None.

## Evidence (this dir, `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/`)
- Gates: `sc545-r4-gate-{tsc,lint,jest,jest-after-shots,lifecycle-part1..5,e2e,shots,freeze,parity}.log`.
- Red/green: `sc545-r4-red-gs63-*.log`, `sc545-r4-green-gs63.log` (367a2f1d base, 65 s), part 3 log above (HEAD).
- Mutants: `sc545-r4-mut-{9..14}-jest.log`, `sc545-r4-mut-{9,10,13}-gs63.log`.
- Perf: `sc545-r4-perf-green.json`, `sc545-r4-perf-base367.json`.
- Proposal: `sc545-dse-verify-proposal.md` (five parts, 49 -> 50, part 3 = 8 ids at 302 s, "Not covered" clause, CURRENT block on `0698550f`).
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc545-r2-impl-w1/` (bundles `bundle-r4*`, probes in `probe/`).
- Kept FAIL dirs under `/tmp/dse-obsidian-lifecycle-*` that my own runs created were removed one by one by explicit path.
