# SC-505 r3 scoped re-review (reviewer B)

## Executive summary
- **Verdict: APPROVE_WITH_FIXES (LOW only).** LOW-A, LOW-B and the rebase are closed. INFO-1 is not fully closed: 3 kept branches survive removal. Counts: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 3 / INFO 3.
- Shas: dse ec354f4 on 7046eb0; superproject cce808f on aa57411. The range-diff efc17de..3717849 vs 7046eb0.. shows all 7 earlier commits `=`. SC-494 does not touch the Pin path, which writes through `vault.process` + `ensureAnchor`; SC-494 only changed the view serializer (`withReservedKeys`).
- Gates on ec354f4:
  - tsc rc 0.
  - lint rc 0 with **1 warning** (LOW-E).
  - jest 6048 passed / 1 skipped, 244 of 245 suites.
  - e2e full run 123/123 ok, 0 failed, 0 known-bug, coverage 84/84.
  - lifecycle 36/36.
  - Not run: shots, freeze, parity. The r3 delta touches no CSS, rendering or harness code.
- Removing the claim-time disarm is safe in real Obsidian. A real Pin goes body (50 ms) → pin (83 ms) → body (212 ms) → pin (227 ms) and ends on the final live copy.
- Other probes:
  - Fixed: RV-P17A and RV-P17B (embed 0 / embed 1) now keep focus on the pressed embed's Pin.
  - Still passing: RV-P07B, RV-P13, RV-P16, all 19 elements, Live Preview, the sidebar copy, pointer clicks, and Tab order.
- New tests fail on the r2 source (c2ca7c8): the 2 LOW-A jest tests and CHR-F08. Removing the `focusin` listener now turns CHR-F07 red, so LOW-B is closed.
- Shared e2e driver change: it weakens no other spec's wait or write-target assertion (see "Driver review").

## Findings

### LOW-C: the guard treats ANY Pin button in the same pane as "ours", so focus can jump to a different block
- Where: `src/framework/chrome/focusHandoff.ts:96-97` (guard: `isItem && scopeOf(target) === req.scope`) and `:178` (claim: `!focusIsFree → return`, with no disarm since r3). Outside an embed, the scope is the pane, so every block's Pin button in that pane matches.
- Measured (RV-P19, `Stamina/two-blocks.md`):
  1. Keyboard Pin on bar 1.
  2. Within the window, focus moves directly to bar 2's Pin. The probe uses script focus to stand in for a screen reader's quick-nav or any programmatic jump.
  3. An outside edit rebuilds bar 2, and focus jumps to **bar 1's Pin** at 21 ms. That is a control in another block.
- How reachable it is:
  - Tab cannot reach it, because Tabbing passes other controls first and the guard cancels.
  - A mouse click on bar 2's Pin does not move focus at all (RV-P18: focus stays on bar 1's Pin).
  - So it is rare, and the same looseness existed in r2.
- Fix: track the exact buttons. Keep a per-request `ours: WeakSet<Element>` holding the pressed button plus every button the claim focused (add the button before `focusControl`). The guard keeps the request only when `target ∈ ours`, which makes its scope clause unnecessary. The claim-side scope check stays. Add a jest test: two blocks in one leaf, focus the other block's Pin, rebuild it, and expect no focus call.

### LOW-D: INFO-1 ruling not fully met: 3 kept branches survive removal at both layers
Jest suite `chromeFocusHandoff` + `registration` (75 tests), plus e2e where noted:

| mutation | jest | e2e |
|---|---|---|
| K2 `:172` drop `!btn?.isConnected` (keep `!btn`) | green | n/a |
| K9 `:134` drop `else disarmChromeFocus(blockKey)` (wrote=false) | green | n/a |
| K10 `:133` drop the 3 s shorten (wrote=true) | green | n/a |
| K3 drop the claim scope check `:175` | 4 red | CHR-F06, CHR-F08 red |
| K4 drop `if (!focusIsFree(doc)) return` `:178` | 1 red | green |
| K5 hidden copy refuses → disarm | 1 red | — |
| K6 drop the guard "ours" `continue` `:97` | 2 red | — |
| K7 guard scope clause → `isItem` only | 1 red | green |
| K8 no `focusin` listener `:86` | 2 red | CHR-F07 red |
| K11 drop refocus of the pressed button after a no-write `:136` | 1 red | — |
| K12 disarm on first success (no SETTLE extension) | 2 red | — |
| K13 `scopeOf` = pane only | 2 red | — |

- Why the three survive:
  - K2 is dead code: `focusControl` already refuses a disconnected node.
  - K9 is masked by the guard: the jest test Tabs to Collapse, and that cancels on its own.
  - K10 is masked by the TTL: the "lapses" test advances 6 s, past the 5 s TTL.
- The implementer's INFO-1 table lists K9 and K10 as covered; they are not.
- Fix:
  - K2: simplify to `if (!btn || doc.activeElement === btn) return;`.
  - K9: jest test. A Pin that wrote nothing, then `document.activeElement.blur()` (focus to body, which fires no `focusin`), then a rebuild → expect no focus call.
  - K10: jest test. A Pin that wrote, the rebuild not yet arrived, advance 3.5 s (inside the 5 s TTL, past the 3 s shorten), rebuild → expect no focus call.

### LOW-E: new lint warning (dse-verify expects lint "clean (no output)")
- `focusHandoff.ts:72:39 warning Use 'activeDocument' instead of 'document' for popout window compatibility (obsidianmd/prefer-active-doc)`.
- Introduced in r2 (line 71 then); I missed it in the r2 re-review. rc stays 0. The implementer reported "lint clean".
- Fix: `guardFocus(pressed?.ownerDocument ?? activeDocument)`.

### INFO
- INFO-1: CHR-F09 (press in embed 0) is green on the r2 source in the committed fixture. My RV-P17A on r2 code ended on `<body>`, so the result depends on timing. The jest twin test is the real red for that order (red on r2, green on head).
- INFO-2: SC-494 (efc17de..7046eb0) touches `FormModal.ts`, `collapsedKey.ts`, `pipeline.ts` (serializer → `withReservedKeys`) and `shoot.mjs`. It does not touch `registration.ts` or the Pin path.
  - Wrote-detection after the rebase: the registration jest test "resolves true only when it wrote" is green. The first press writes the anchor (CHR-F04/F05/F06/F08/F09, RV-P02, RV-P15 counter). A second press (RV-P10) and ds-scc (RV-P15) write nothing.
- INFO-3: the claim-time disarm and the "still on the pressed button" branch were really redundant **given the guard**. Every user focus move fires `focusin` in this document. The only moves that do not are a blur to body, a window switch, or focus going into a popout. Those leave focus free or invisible, and the r2 code would have claimed in those cases too. The two exceptions are LOW-C (another block's Pin counted as ours) and K9 above.

## Driver review (shared `e2e/driver/dse.ts`)
- `openNote` wait (`dse.ts:186-188`): `mine.length >= roots.length || roots.every((r) => all.some((e) => e.root === r))`.
  - The OR only adds passing cases.
  - In a note with no embeds, "every root has a live entry, matched by identity" implies the old count condition, so the wait cannot pass earlier than before. Entries are registered by the root's own pipeline.
  - The only shipped fixture with an embed is the new `Stamina/embed-twice.md`; before this change that note's wait would have timed out.
  - Nothing enumerates the vault besides `resetFixtures`, which handles the new file.
  - No weakening.
- `dse.embeddedTarget(rel, lang, n)` (`dse.ts:214-217`): opt-in, used only by CHR-F08/F09.
  - It adds `rel` to `touched` and declares one fence. The integrity check on the embedded note is stricter than before, since it was not checked at all.
  - `n` indexes blocks of the EMBEDDED file, not on-screen copies, which is correct for the twin case.
  - `declareTarget`'s new third parameter defaults to `state.currentNote`, so existing callers are unchanged.
- README fixture-table row: accurate.

## Probes on ec354f4 (real Obsidian 1.14.4; spec `.../sc505-r3-rereview-q9t3/probe.e2e.ts`)
| probe | result |
|---|---|
| P02 real Pin, 3 rebuilds | pin → body 50 → pin 83 → body 212 → pin 227 ms. Final copy is live, connected, visible. Tab → Collapse, then outside edit → body |
| P07 / P07B two panes | press in A → A's new Pin; press in B → B's new Pin |
| P10 second Pin (no write) + blank click + outside edit | no write; no steal |
| P13 second Pin, Tab → Collapse, outside edit | → body at 326 ms |
| P16 real Pin, Tab → Collapse, outside edit | → body at 331 ms |
| P17A / P17B double embed in one pane | embed 0 → embed 0's Pin; embed 1 → embed 1's Pin (both fixed) |
| P18 keyboard Pin on bar 1, mouse Pin on bar 2 | focus stays on bar 1's Pin (the mouse moves nothing) |
| **P19 keyboard Pin on bar 1, focus bar 2's Pin, outside edit to bar 2** | **bar 2's Pin → bar 1's Pin at 21 ms (LOW-C)** |
| P01 / P03 / P04 / P05 / P06 / P08 / P09 / P11 (11) / P11X (19) / P12 / P15 | unchanged from r2 (all hand-offs fv; pointer moves nothing; Tab order unchanged). P11X fails only on the probe note's own encounter `_computed` write, as before |

## Gate summary lines (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r3-rereview-q9t3/`)
- `g3-tsc.log` rc=0
- `g3-lint.log` rc=0, `✖ 1 problem (0 errors, 1 warning)` (LOW-E)
- `g3-jest.log`: `Test Suites: 1 skipped, 244 passed, 244 of 245 total` / `Tests: 1 skipped, 6048 passed, 6049 total`, rc=0
- `g3-e2e.log`: `OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 84/84 pairs`, rc=0
- `g3-lc.log`: `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed`, rc=0
- r3 tests against the r2 source: `r2src-jest.log` (2 red: LOW-A x2) and `r2src-e2e.log` (CHR-F08 red; F07 and F09 green, as expected)

## Tree
- dse branch at ec354f4, clean.
- Superproject cce808f (` M draw-steel-elements`, unbumped, as before).
- The throwaway worktree has been removed; `git worktree list` shows only the branch.
