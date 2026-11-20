# SC-675 r5 fix report

**Executive summary**
- STATUS: DONE. MEDIUM-2 fixed (ruling O8 (a)): under a BULLET each leading tab counts as 2 columns (1 tab -> 4 spaces, 2 -> 6, 3 -> 8); ordered items keep 4 per tab; spaces only. LOW-3 CHANGELOG line replaced with the exact brief text.
- dse `804224ad` (fix), `d8fe4962` (tests), `3b47e55b` (docs); superproject `7df5aae8` (CHANGELOG). `origin/develop` still `129beb18` (the fetch only brought a new tag, `7.0.0-rc.1`).
- jest 13855 passed / 2 skipped, 300 suites + 1 skipped. r3 was 13836, delta +19 = 20 rows added (5 net rows x 4 paths) minus 1 case dropped from the `marked` oracle.
- tsc rc 0, lint rc 0, build rc 0. `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (unchanged). `git status --short` empty.
- Superseded r4 gates on `f94be393` had completed: lifecycle part 1 `21/21 ok, 0 failed`; part 2 `16/16 ok, 0 failed`; part 3 `9/9 ok, 0 failed`; part 4 `3/4 ok, 1 failed` (G-S61 red: "the recorder's disk read was torn in 9 frames in a row", the SC-668 load flake; G-S57, G-S62, G-S56 ok; not re-run, superseded; its kept temp dir `/tmp/dse-obsidian-lifecycle-YpyKo2` is left in place); parts 5-7 and e2e not started.

## Change
- `src/authoring/blockInsert.ts` `blockContextOf`, list branch (about :72-82): `leadColumns = /^\d/.test(marker) ? columnAfter(lead) : lead.replace(/\t/g, '  ').length`, then `markerEnd = columnAfter(marker, leadColumns)` as before. A comment at the rule says why (measured in Obsidian 1.14.4, SC-675 r4, rereview MEDIUM-2) and not to "correct" it to CommonMark. Header comment updated. The whitespace-only line rule is unchanged (tab = next multiple of 4).
- Tests `test/dom/authoring/insertOwnLines.test.ts` (exact text, all four paths): `- a⏎⇥- b|` 4 spaces; `- a⏎⇥- |` 4; `- a⏎⇥- b⏎⇥⇥- c|` 6; 3-tab bullet 8; `* a⏎⇥* b|` 4; `- [ ] a⏎⇥- [ ] b|` 4; `> - a⏎> ⇥- b|` `> ` + 4 spaces; `1. a⏎⇥1. b|` 7 (unchanged from r3: 4 + marker 2 + gap 1). `- a⏎⇥- b|` dropped from the `marked` oracle with a comment citing the measurement; `- item⏎⇥|` stays in it.
- Docs: `.repo-docs/architecture.md` tab-width wording. CHANGELOG: third line of the SC-675 bullet replaced.

## Before (r3) -> after (r5), spaces on the inserted lines
| spec | r3 | r5 |
|---|---|---|
| `- a⏎⇥- b\|` | 6 | 4 |
| `- a⏎⇥- b⏎⇥⇥- c\|` | 10 | 6 |
| 3 tabs `… ⇥⇥⇥- d\|` | 14 | 8 |
| `* a⏎⇥* b\|`, `- [ ] a⏎⇥- [ ] b\|` | 6 | 4 |
| `> - a⏎> ⇥- b\|` | `> ` + 6 | `> ` + 4 |
| `1. a⏎⇥1. b\|` | 7 | 7 |
| `- item⏎⇥\|` (whitespace-only) | 4 | 4 |

Not re-measured in real Obsidian this round (the widths are the ones measured in the r4 re-review).

## Gates and logs
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r5-fix/`: `tsc.log` / `tsc.rc`, `lint.log` / `lint.rc`, `build.log` / `build.rc`, `styles.sha`, `jest-full.log` / `jest-full.rc`, `jest-auth-a1.log` (focused run, 570 pass).
Superseded r4 logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r4-gates/lifecycle-p1-run1.log` ... `lifecycle-p4-run1.log` (with `.rc`).
