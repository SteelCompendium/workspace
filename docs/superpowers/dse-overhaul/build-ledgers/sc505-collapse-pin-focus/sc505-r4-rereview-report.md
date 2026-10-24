# SC-505 r4 scoped re-review (reviewer B)

## Executive summary
- **Verdict: LAND-READY.** Counts: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 0 / INFO 3. LOW-C, LOW-D and LOW-E are all closed.
- **Shas reviewed:** dse a0365a4 on 38f94f4; superproject b18b254 on 2bb85df.
- **Range-diff** (7046eb0..d686d97 vs 38f94f4..a0365a4): commits 3-7 and 9-13 are `=`. Commits 1, 2 and 8 differ only by the four owner-approved hand-merges, which I checked line by line (see "Hand-merges").
- **Gates on a0365a4:**
  - tsc rc 0
  - lint rc 0, silent (only the `.eslintignore` deprecation notice)
  - jest 6052 passed / 1 skipped, 244 of 245 suites
  - e2e full run 123/123 ok, 0 failed, 0 known-bug, coverage 87/87
  - lifecycle 36/36
  - shots, freeze and parity not run: the r4 delta is `focusHandoff.ts` and tests only, with no CSS, rendering or harness changes.
- **LOW-C closed.** RV-P19 (keyboard Pin on bar 1, focus jumps to bar 2's Pin, outside edit to bar 2) no longer moves focus to bar 1: bar 2's Pin → `<body>` at 19 ms, which is the ordinary rebuild of bar 2. Putting the r3 guard back (L1) brings the jump back (bar 1's Pin at 28 ms) and turns the new jest test red.
- **LOW-D closed.** Mutations K9 and K10 now each turn 1 jest test red. The K2 simplification is behaviour-neutral: putting `isConnected` back leaves jest 78/78 and all 17 e2e checks green.
- **No regressions** in real Obsidian:
  - A real Pin's rebuild sequence: pin → body 48 ms → pin 91 → body 203 → pin 219, final copy live.
  - RV-P07B, RV-P13, RV-P16, RV-P17A and RV-P17B all hold.
  - All 19 elements, Live Preview and the sidebar copy hand off correctly; pointer behaviour unchanged.
  - SC-500's initiative chrome item keeps its id.

## Hand-merges (all match the owner's approved resolutions)
- **`src/framework/chrome/types.ts` `ChromeMenuItem`:** one `control?: string` (SC-500's doc comment) plus our `onClick: (evt?: MouseEvent) => void`. No duplicate field.
- **`src/framework/chrome/mountChrome.ts:234-242` `pushItem`:** `{ icon, label, variant: 'ghost', control: item.control, onClick: item.onClick }`. `iconButton` registers `(evt) => opts.onClick(evt)`, so the click event, and with it `MouseEvent.detail`, reaches the Pin handler; CHR-F04/F05/F06/F08/F09 are green. SC-500's ids survive in real Obsidian (RV-P20, initiative block): `initiative-reset-encounter` → `init.reset-encounter`, `pin` → `chrome.pin`, `collapse`/`expand` → `chrome.*`. `initiative-reset-turns` has no id, as at base: SC-500 stamps only reset-encounter.
- **`test/dom/e2eCensus.test.ts`:** all three imports kept (`initiativeManifest`, `ResetEncounterModal`, `chromeManifest`). The initiative id set is the union, `chromeIds` included.
- **`e2e/specs/_census.e2e.ts`:** `ALL_IDS` = bar ∪ modal ∪ conditions ∪ initiative ∪ chrome.
- **`e2e/driver/dse.ts`:** SC-500's `hover(el)` (`waitForDisplayed` + `moveTo`) is a superset of the removed local `hoverBlock` (`moveTo` only). Our two callers now use `dse.hover(root.root)`; the unused `Scope` import is removed. Our `setPrefs(…, { experimental })` and `embeddedTarget` are intact.

## Mutation table (throwaway detached worktree at a0365a4; jest = chromeFocusHandoff + registration, 78 tests; e2e = CHR-F01..F09 + RV-P02, P07, P07B, P13, P16, P17A, P17B, P19)
| id | mutation | jest | e2e (committed / probes) |
|---|---|---|---|
| K9 | drop the request after a Pin that wrote nothing (`else disarmChromeFocus`) | **1 red** | — |
| K10 | drop the 3 s shorten after a Pin that wrote | **1 red** | — |
| K2r | put `!btn?.isConnected` back | 78 green | 17/17 green, probes unchanged (neutral) |
| L1 | r3 guard (any `pin` item in scope counts as ours) instead of the `ours` set | **1 red** (LOW-C test) | committed 17/17 green; **RV-P19 regresses**: bar 2's Pin → bar 1's Pin at 28 ms |
| L2 | drop `req.ours.add(btn)` before the claim's focus call | 2 red | — |
| L3 | drop `ours.add(pressed)` at arm | 78 green | — (INFO-1) |

## INFO
- **INFO-1:** seeding the pressed button into `ours` (`focusHandoff.ts:75`) survives removal (L3). The pressed button already holds focus when the request is armed, so no `focusin` reaches it while the request is live. The only refocus of it, in `settleChromeFocus` after a no-write, runs after the request has been dropped. Defensive and harmless; keep or drop as the owner prefers.
- **INFO-2:** LOW-C is proven at the jest layer only. With the r3 guard restored, every committed e2e stays green; only reviewer probe RV-P19 shows the jump in real Obsidian. A real user reaches it only by a direct focus jump to another block's Pin (screen-reader quick-nav, programmatic focus). Tab cannot reach it (it passes other controls first) and a mouse click does not move focus (RV-P18), so jest-only coverage is proportionate.
- **INFO-3:** RV-P11X still fails only on my probe note's own ds-encounter `_computed` write tripping the e2e integrity check, as in every earlier round. Not a product finding.

## Probes on a0365a4 (real Obsidian 1.14.4; spec `.../sc505-r4-rereview-h2v6/probe.e2e.ts`)
| probe | result |
|---|---|
| P01 RV Collapse / Expand | → Expand fv 21 ms; → Collapse fv 12 ms |
| P02 real Pin | pin → body 48 → pin 91 → body 203 → pin 219 ms; live, connected, visible. Tab → Collapse, then outside edit → body |
| P03 pointer | nothing focused, no ring |
| P04 Live Preview / P05 sidebar | both hand-offs fv |
| P06 two bars | stays on the activated bar |
| P07 / P07B two panes | pressed pane's new Pin |
| P10 second Pin (no write) + blank click + outside edit | no write, no steal |
| P13 / P16 Tab → Collapse, then outside edit | → body (341 / 334 ms) |
| P17A / P17B double embed | the pressed embed's Pin (0 / 1) |
| P18 mouse Pin on bar 2 after keyboard Pin on bar 1 | stays on bar 1's Pin |
| **P19** | bar 2's Pin → body at 19 ms (**fixed**; r3: → bar 1's Pin) |
| P09 Tab order | unchanged |
| P11 (11) / P11X (19) | all hand-offs fv |
| P15 counter / scc | Pin kept; scc writes nothing |
| P20 initiative chrome ids | reset-encounter = `init.reset-encounter`; chrome ids present |

## Gate summary lines (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r4-rereview-h2v6/`)
- `g4-tsc.log` rc=0
- `g4-lint.log` rc=0 (no problems listed)
- `g4-jest.log`: `Test Suites: 1 skipped, 244 passed, 244 of 245 total` / `Tests: 1 skipped, 6052 passed, 6053 total`, rc=0
- `g4-e2e.log`: `OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, rc=0
- `g4-lc.log`: `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed`, rc=0

## Tree
- dse branch at a0365a4, clean.
- Superproject b18b254 (` M draw-steel-elements`, pointer not bumped, as before).
- Throwaway worktree removed; `git worktree list` shows only the branch.
