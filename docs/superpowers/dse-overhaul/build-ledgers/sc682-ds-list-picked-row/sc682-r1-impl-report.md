# SC-682 r1 implementer report

**Executive summary**
- STATUS: DONE. Plugin `sc682-ds-list-picked-row` head `8b32ac9b` (base `bb3a3d10`, unmoved); superproject head `f67003ad` (CHANGELOG only, no pointer bump).
- Fix: `DsElementSuggest.selectSuggestion` now calls `this.close()` after every pick (written or refused). `close()` alone gave O1 in real Obsidian 1.14.4 in every case measured; no second change was needed.
- Gates: tsc clean (incl. `-p e2e`), lint clean, jest 14682 passed / 2 skipped (base 14674, +8), lifecycle 64/64 (seven parts, union; part 2 had 4 sidebar reds on its first run under a concurrent effort's load, 16/16 on re-run), e2e `818/828 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` (base 810/820, +8 = AUTH-S10..S17).
- styles.css sha256 identical on head and clean `bb3a3d10` (`18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`): carry shots 592, freeze 280/280, parity 0/0/24.
- Finding the ticket did not know: on `bb3a3d10`, under a list item, a second Enter sent right after the pick writes a SECOND scaffold into the first block (data damage). The ticket's "Not data loss" holds only for the settled case. Fixed by the same `close()`.
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/evidence/` (`sc682-before.png`, `sc682-after.png`, logs, probe data).

## Commits (plugin repo, `git -C .../draw-steel-elements`)
- `da9dcd82` test(SC-682): red tests
- `0cf2b35f` fix(SC-682): close the /ds list after every pick
- `ee8be81b` docs(SC-682): plugin CHANGELOG
- `8b32ac9b` docs(SC-682): e2e README
- superproject `f67003ad` docs(SC-682): workspace CHANGELOG (worktree superproject, branch `sc682-ds-list-picked-row`; submodule pointer left unstaged)

## 2.1 Measurement on the unfixed `bb3a3d10` build (real Obsidian 1.14.4)

Rows are on screen 1.5 s after the pick, no Escape sent. Raw data: `evidence/probe-before.jsonl`, timeline `evidence/probe2-before.jsonl` (sampled at ~20, 100, 250, 500, 1000, 1500 ms, with Obsidian's `editorSuggest.currentSuggest.context`).

| Case | On screen at 1.5 s | Second Enter (after settle, no Escape) |
|---|---|---|
| `/dsstam` + Enter, Live Preview and Source | the `/ds` list, one row "Stamina bar ds-stam", id `authoring.ds.item` (NOT a key list) | nothing: note unchanged, cursor unchanged, no Notice |
| `/dsstam` + click, Live Preview and Source | same row, same id (the ticket says a click closes it: not so for Stamina bar) | nothing, no Notice |
| `/dsskills` + Enter, LP | same: "Skills ds-skills", `authoring.ds.item` | nothing |
| the other eleven elements (hr, nt, it, ft, fb, sb, ct, vr, char, scc, montage), Enter, LP; `/dsfb` click, LP | no list (closed by itself within 100 ms) | a normal new line |
| `- /dsstam` (list item) and `> /dsstam` (callout), LP and Source | no list | a normal new line |
| `/dsstam` + Enter, then Enter with NO wait (first ~20 ms, context still set) | list gone after the second key | top level (LP, Source) and callout: second pick refused, Notice "The cursor is inside another block, so nothing was inserted..." and no new line. List item: the second Enter picks again and WRITES a second scaffold into the first block (see below) |

- Which list: always the `/ds` list (`authoring.ds.item`). At no sample did an in-block key list (`authoring.schema.key`) open over the fresh block, for Stamina bar (has a key list) or Horizontal rule (none). So `closeList()`'s comment about a key list opening over a fresh block did not match what is measured. After the fix `evidence/probe2-after.jsonl` shows no rows at any sample for all 16 timelines.
- Why "nothing": from ~100 ms on the suggest's `context` is already null while the popup stays open, so `selectSuggestion` returns at `if (!this.context) return`.
- The ticket's "does nothing" at `bb3a3d10`: true for Stamina bar and Skills once settled (no Notice since SC-687). Within the first ~20 ms a second Enter re-picks with the old token range.
- List-item double Enter on the unfixed build (from the red run of AUTH-S16, `evidence/e2e-red-unfixed.log`): note ended
  `- \n  ```ds-stam\n  max_stamina: 20\n  current_stamina: 15\n  temp_stamina: 5\n  ```s-stam\n  max_stamina: 20\n ...` (a second scaffold pasted into the first, closing fence mangled).

## O2 oracle texts (unfixed `bb3a3d10`, "pick, Escape, Enter"; byte-exact, `evidence/probe-before.jsonl` rows `then: escape-enter`)
- Top level, LP and Source, Enter and click: `Intro line above\n\n```ds-stam\n\nmax_stamina: 20\ncurrent_stamina: 15\ntemp_stamina: 5\n```\nOutro line below\n`, cursor line 4 ch 0.
- List item (`- ` + token): `Intro line above\n\n- first item\n- \n  ```ds-stam\n  \n  max_stamina: 20\n  current_stamina: 15\n  temp_stamina: 5\n  ```\n\nOutro line below\n`, cursor line 6 ch 2 (LP and Source identical).
- Callout (`> ` + token): `Intro line above\n\n> [!note] Callout title\n> first line\n> ```ds-stam\n> \n> max_stamina: 20\n> current_stamina: 15\n> temp_stamina: 5\n> ```\n\nOutro line below\n`, cursor line 6 ch 2.
After the fix `evidence/probe-after.jsonl` gives the same text for "pick, Enter at once" in all of these shapes (the new tests assert it byte-exact).

## Red-run proof
Log: `evidence/e2e-red-unfixed.log` (tests only, unfixed `src/`): `OBSIDIAN-E2E done: 0/12 ok, 12 failed`. The 12 = the 8 new tests + AUTH-S02, S04, S09, G09 (the `closeList()` replacements). Failing lines:
- S02 / S04 / S09 / G09, S13, S14, S15: `a suggestion list is on screen: [["authoring.ds.item","Stamina bards-stam"]]` (S04: all 13 rows still up; S09: the Featureblock row; G09: the Roll row)
- S10 / S11 / S17: Notice expected `[]`, received `["The cursor is inside another block, so nothing was inserted. ..."]`
- S12: `listRows()` expected `[]`, received the Stamina bar row after 1.5 s
- S16: note text diff, a second scaffold written into the first (above)
jsdom red: `evidence/jest-sub-red.log` (6 failed: the 5 "pick that writes" cases of the new describe + the rewritten insertRefusal pin).

## Tests added / changed
- e2e, new ids (all in `e2e/specs/authoring/ds-suggest.e2e.ts`): AUTH-S10 (LP, Enter Enter at once, one new line, no Notice, no list, block draws), S11 (Source), S12 (settled 1.5 s, `listRows()` empty, then Enter), S13 (click then Enter), S14 (no list over the new block for Stamina bar and Horizontal rule; typing `rec` on a body line of the Stamina block still opens the key list), S15 (second `/ds` pick after the first; both blocks intact via `existingBlocksIntactProblem`, byte-exact), S16 (list item), S17 (callout, Source). The second Enter is the very next command after `pressList('Enter')`.
- Coverage pairs added: none (`authoring.ds.trigger x type`, `authoring.ds.item x click`/`press:Enter`/`press:Escape`, `authoring.schema.trigger x type` already exist). 476/476.
- New driver helper `expectNoList(settleMs = 500)` in `e2e/driver/authoring.ts` (reads rows now and every 100 ms; sends no key; fails if any row shows). `closeList()` doc comment updated (no longer names the `/ds` pick as a reason).
- `closeList()` calls replaced by `expectNoList()` after a `/ds` pick (no Escape sent): `ds-suggest.e2e.ts` AUTH-S02, AUTH-S04, AUTH-S09; `gate-on.e2e.ts` AUTH-G09. Left alone (not a `/ds` pick): insert-commands AUTH-I35 (typed char), gate-on AUTH-G10, G11, G12 (schema picks and typed text), schema-suggest K01..K03, census CENSUS-30/31/34.
- AUTH-S03 (click, Source, `/dsfb`) already used `waitNoList`; unchanged. AUTH-I40 (refused pick in properties: one Notice, no row) already asserts both; unchanged and green.
- jsdom: `test/dom/authoring/dsSuggestMatrix.test.ts`, new describe at the end (existing tests untouched, still green): `close()` called once for 5 written shapes, once for 2 refused shapes (properties; block under a list item that the fence scan does not see), zero times with no context. `insertRefusal.test.ts`: the line that pinned the bug (`pick(...).closed` toBe(0) for a written pick) rewritten to toBe(1).
- Jest: 14674 -> 14682 (+8: 5 + 2 + 1).

## Gates (measured)
- `npm run tsc` (incl. `tsc -p e2e`): clean, `evidence/gate-tsc.log`. `npm run lint`: clean, `evidence/gate-lint.log`.
- jest full: `Tests: 2 skipped, 14682 passed, 14684 total`, `Test Suites: 1 skipped, 313 passed` (`evidence/gate-jest.log`). Fresh worktree, no shots cache, so comparable to the 14674 baseline.
- lifecycle, seven `--only=` parts (each log starts with its own ids): p1 21/21, p2 16/16 (re-run), p3 9/9, p4 4/4, p5 7/7, p6 4/4, p7 3/3 = `OBSIDIAN-LIFECYCLE done: 64/64 ok, 0 failed` as a union. Part 2 first run: `12/16 ok, 4 failed` (G-S11 `getMostRecentLeaf()` undefined, G-S12 sidebar write timeout, G-S33 panel anchors, G-S40 sidebar catch-up), run while another effort's lifecycle was running (load average ~5); the same part alone, nothing else of mine running, was 16/16 (`evidence/lc-p2-run1-4fail.log` vs `evidence/lc-p2.log`). These are sidebar scenarios; this change touches only the `/ds` suggester. Not named in the skill's flake list; reported as seen.
- e2e full: `OBSIDIAN-E2E done: 818/828 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` (`evidence/gate-e2e-full.log`). Known-bug count unchanged (10).
- shots / freeze / parity (O6): `styles.css` built on head and on a clean `bb3a3d10` checkout (scratch `git worktree`, `node esbuild.config.mjs production`, removed afterwards): both `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`. Files changed touch no CSS or rendering code. Carry: shots 592, freeze 280/280, parity 0/0/24. `freeze-baseline.sha256` not touched.

## Docs
- Plugin `CHANGELOG.md` (7.0.0 unreleased) and workspace `CHANGELOG.md` (Unreleased) each got one SC-682 bullet above the SC-687 one. e2e `README.md` "The editor insert paths": the sentence that said `closeList()` dismisses a re-opened list after an accept was made untrue for a `/ds` pick; rewritten. `docs/writing-blocks.md`: no sentence made false; untouched.

## Anything `close()` alone did not fix
Nothing. No second change. Measured after the fix (`evidence/probe2-after.jsonl`): no rows at any sample for Enter and click, LP and Source, all 13 elements tried.

## Evidence artifacts
- PNGs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc682-ds-list-picked-row/evidence/sc682-before.png` (row "Stamina bar ds-stam" over the new block), `.../sc682-after.png` (block, no list). Live Preview, default theme, empty note, 1.5 s after Enter, no Escape.
- Logs/data in the same `evidence/` dir; scratch probe specs (not committed) `zz-sc682-probe.e2e.ts.txt`, `zz-sc682-probe2.e2e.ts.txt`.

## Drive-by fixes
- None.

## Follow-ups (left alone)
- The unfixed `/ds` double-Enter-under-a-list-item data damage shows the stale-context pattern (a pick written with an old token range into moved text). `selectSuggestion` could also guard that the token text is still at `[start, end)`; out of scope (O7: `insertBlock` untouched).
- AUTH-I40 uses `waitNoList` (waits up to 6 s for the list to go) for the refused-pick close; with `close()` now unconditional it could use `expectNoList()`. Not changed (it already asserts the Notice and the closed list).
- `closeList()` still waits up to 1 s for a list that does not open in most cases (K-specs, census); its key-list premise was not measurable here for `/ds` picks. Left.
- The probe's `/dsnt`, `/dsit` style short queries match other elements' names first (`nt` matches "Horizontal"): irrelevant to the product, noted only because the first probe picked Horizontal rule for `/dsnt`.
