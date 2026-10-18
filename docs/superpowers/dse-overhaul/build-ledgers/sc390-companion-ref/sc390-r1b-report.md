# SC-390 R5b (final rebase onto be4f002) — FINAL

- DONE. dse `sc390-companion-ref` @ **`135716d`** on `origin/develop` **`be4f002`** (SC-417 landed; clean rebase, lock unchanged, no `npm ci`). `git status` clean. `git log --oneline origin/develop..HEAD`: 135716d, 0904c37, cd56bb9, ee5a388, 42aa841, 4e72742, 14117c5, 1ce6ca7, c535fa0 (9 commits).
- tsc clean; lint clean; jest `Tests: 1 skipped, 4458 passed, 4459 total` / `Test Suites: 1 skipped, 220 passed, 220 of 221 total` (R3b 4440; +18 = SC-417's tests).
- shots 572 PNGs, 0 FAIL x2 runs, all print+realprint hashes identical run-to-run; host-copy pin OK; button host-leak OK (112 kinds, 672 comparisons); print-twin delta OK (142 ids).
- Freeze verbatim: `FREEZE VIOLATED (2 checksum mismatches, 0 missing)` = exactly `statblock-roleless-corpus--steel-print.png` + `statblock-roleless-corpus--steel-realprint.png`.
- Parity verbatim: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`
- Hash files `rebaseline.txt` / `widening.txt` regenerated and diffed: UNCHANGED (all 4 hashes identical). Shared freeze baseline untouched.
- Logs: `sc390-r5b-{tsc,lint,jest,freeze,parity}.txt`, `sc390-r5b-shots-run{1,2}.txt`, `sc390-r5b-hashes-run{1,2}.txt`, `sc390-r5b-allhash-run{1,2}.txt`.

---

# SC-390 R3b (fix round on R1b) — FINAL

## R3b executive summary
1. DONE. dse `sc390-companion-ref` @ **`39cf35a`** on `origin/develop` **`0ecb90e`** (pins SDK 3.0.1). Commits on top of 0ecb90e: 1d0ce9a, 61fe729, 8cc3465, 700caf1, 9671a8b, 0a0e35f, a89b640, 68e827f, 39cf35a. `git status` clean; no tarball, `package.json`/lock untouched (3.0.1 pin).
2. MED-1: rebased cleanly onto 0ecb90e; freeze on clean 0ecb90e (before my change): `freeze OK (274/274 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, 568 PNGs. The committed tree is fully green on 3.0.1 with no tarball.
3. MED-2: the whitespace-EV test now replaces the base's `ev: ""` (no duplicate key), asserts no `.dse-error-card` and that `.dse-sb > .dse-head` exists. Mutation M3 (drop `.trim()` in view.ts) -> RED (1 failed / 53 passed, `sc390-r3b-mutation-M3.txt`); reverted byte-clean (`git checkout -- src`, status empty).
4. LOW-1: `ev: null` (`ev: ~`, bare `ev:`) omits the chip; `undefined` keeps "EV N/A"; `ev: 0` prints "EV 0" (tested). LOW-2: skills coerced (scalar -> one entry, trim, drop blanks, cell only when non-empty); tests for `skills: Sneak`, `[""]`, `["", "  "]`, `~`, `""` and a mixed list. Both were red before the code (2 failed / 52 passed), green after. `companionFields.ts` docstring now says 3.0.1; 3.1.0 is optional cleanup (package.json + lock only).
5. Final battery (3.0.1, no tarball): tsc clean; lint clean (0 errors); jest **4440 passed / 1 skipped / 0 failed**, 219 of 220 suites; shots **572 PNGs, 0 FAIL** x2 runs, all 142 print+realprint hashes identical run-to-run; host-copy pin OK, button host-leak OK (112 kinds x 3 states = 672), print-twin delta OK across 142 ids.
6. Freeze verbatim: `FREEZE VIOLATED (2 checksum mismatches, 0 missing)` = exactly `statblock-roleless-corpus--steel-print.png` + `statblock-roleless-corpus--steel-realprint.png` (the sanctioned rebaseline). Parity verbatim: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`
7. Hash files: regenerated from the final tree; all 4 hashes UNCHANGED vs the previous `rebaseline.txt` / `widening.txt` (diff empty; also identical to the R1b final run 4). Name diff 274 -> 276: 0 removed, 2 added, 0 duplicates (`sc390-r3b-namediff.txt`). Shared freeze baseline never touched.
8. Pin step: nothing required before landing. Optional once SDK 3.1.0 is published: `steel-compendium-sdk` -> 3.1.0 in `package.json` + lock, re-run; no code edit.
9. Note: jest was not re-measured on a clean 0ecb90e (only freeze/shots were); the 4440 total includes the base's own changes.

Artifacts (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc390-companion-ref/`): `rebaseline.txt`, `widening.txt`, `sc390-r3b-{tsc,lint,jest,freeze,parity,namediff}.txt`, `sc390-r3b-shots-run{1,2}.txt`, `sc390-r3b-hashes-run{1,2}.txt`, `sc390-r3b-allhash-run{1,2}.txt`, `sc390-r3b-shots-base.txt`, `sc390-r3b-freeze-base.txt`, `sc390-r3b-jest-red.txt`, `sc390-r3b-jest-green.txt`, `sc390-r3b-mutation-M3.txt`, EV crops `sc390-r1b-ev-before.png` / `sc390-r1b-ev-after.png`.

---

# SC-390 R1b report (draw-steel-elements) — FINAL

## Executive summary
1. Verdict DONE. dse branch `sc390-companion-ref` @ **`5e4cdc2`** (8 commits on `origin/develop` a337460), worktree `/home/scott/code/steelCompendium/worktrees/sc390-companion-ref/draw-steel-elements`; `git status` clean; `package.json`/lock are back on the 3.0.0 pin (never committed).
2. Gates run against the rebased SDK tarball (3.1.0, installed uncommitted): tsc clean; lint clean; jest **4440 passed / 1 skipped / 0 failed**, 219 of 220 suites (before: 4431 / 2 skipped; +9 new tests, +1 passed from a host-css-cached test that un-skips once shots have run); shots **572 PNGs, 0 FAIL** (before 568), host-copy pin OK, button host-leak OK (112 kinds x 3 states = 672 comparisons, unchanged), print-twin delta OK across 142 ids (141 before).
3. Freeze, verbatim: `FREEZE VIOLATED (2 checksum mismatches, 0 missing)` = exactly `statblock-roleless-corpus--steel-print.png` + `statblock-roleless-corpus--steel-realprint.png` (the sanctioned rebaseline). Before my change on clean a337460: `freeze OK (274/274 …)`. The 2 new `statblock-companion-corpus--steel-{print,realprint}.png` names are absent from the baseline (widening).
4. Parity, verbatim: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**` (no new declared row).
5. Hashes (identical across 2 clean runs, all 142 print+realprint pairs identical run-to-run; only the 4 expected lines differ from the pre-change tree): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc390-companion-ref/rebaseline.txt` (2 lines), `…/widening.txt` (2 lines). Sorted-name diff `sc390-r1b-final-namediff.txt`: 274 -> 276, 0 removed, 2 added, 0 duplicates. The shared freeze baseline was never touched.
6. EV crops (1200x205, header of the roleless-corpus print shot): `…/sc390-r1b-ev-before.png`, `…/sc390-r1b-ev-after.png` — the dangling "EV" chip under "Champion" is gone; nothing else in the header moves.
7. Committed tree vs the pinned SDK: tsc is green on 3.0.0 types (`sc390-r1b-final-tsc-3.0.0.txt`). On 3.0.0 at RUNTIME the panther tests (sccElement panther test, statblock companion-corpus test) and the companion-corpus shots fail (`dto.isTrait is not a function`, SC-155 fix is in the tarball only) — expected, and why the pin bump is required.
8. PIN-BUMP STEP (last, after Scott publishes SDK 3.1.0): set `"steel-compendium-sdk": "3.1.0"` in `package.json`, `npm install` to refresh `package-lock.json`, re-run the battery. NO code edit: `src/elements/statblock/companionFields.ts` (`CompanionStatblock = Omit<Statblock,'freeStrike'> & {freeStrike: number|string; skills?: string[]}`) restates the SDK 3.1.0 shape and becomes redundant (may be deleted then, optional). Do not bump before the SDK is published.
9. Note for owner on the trimmed metadata (R3a): the companion card's ability heads no longer carry the provenance line the untrimmed members produced (renderFeature reads `metadata.class`/`type`), so the companion-corpus shot differs from my first-run shot (hashes in `sc390-r1b-hashes-run1-provisional.txt` are superseded). Cosmetic only; flag if the site shows that provenance for companion abilities.
10. Lifecycle (`obsidian-lifecycle`) not run: view-only change, no block-lifecycle code touched.

## What changed (draw-steel-elements)
- `src/elements/statblock/companionFields.ts` (new): the local typed extension (`CompanionStatFields`, `CompanionStatblock`).
- `src/elements/statblock/view.ts`: Skills kv cell (`.dse-sb__kv--skills`, label "Skills", comma-joined) in the 4th meta slot when `skills` is non-empty — the same slot the site uses (steel-etl `companion_statblock.go`, Captain slot relabelled); also in the sticky mini-header after Captain; an EMPTY/whitespace `ev` omits the EV chip (`rightDeck: undefined`), an ABSENT `ev` still reads `EV N/A` (owner-confirmed). Text `free_strike` ("1 + M") / `stamina` ("= yours") print verbatim; nothing coerces them.
- Tests: `statblock.test.ts` +5 (Skills present; Skills absent/empty + existing grids unchanged; sticky Skills; empty/whitespace EV omitted + set EV still prints; companion-corpus end to end + inline 1L/Poison/no-movement shape). `sccElement.test.ts` +2 (baseForSccType row; panther `ds-scc` end to end: `data-dse-element="statblock"`, "Companion", no EV text, Free Strike `1 + M`, Stamina `= yours`, Skills Sneak, 2 features Pounce (Signature) + Mighty Spring). Written red first (4 red for the right reasons).
- Fixtures: `test/fixtures/md-dse/monster/companion/beastheart/statblock/panther.md` (= `sc390-r3a-panther-mddse.md`); `test/fixtures/statblock/companion-corpus.yaml` (that file's `ds-sb` block, byte-for-byte); `visual-harness/entry.ts` registers `FIXTURES.statblock['companion-corpus']`. One companion per fixture (owner-confirmed: 274 -> 276).
- Docs/CHANGELOG: `docs/compendium-sync.md` (new "What renders, and what doesn't yet" section; quotes the real card wording "has no renderer in this plugin"; keeps "the code is stable, the card is not"), `docs/index.md` (3 spots), and per owner ruling `README.md` (table row + sync paragraph), `docs/migrating-to-7.md`, `docs/advanced-usage.md`. `CHANGELOG.md` 7.0.0 (unreleased): two [FIX] bullets. No docs image shows a dangling EV (docs statblocks all set `ev`), so docs/Media was not regenerated.
- Housekeeping: deleted `<worktree>/.devbox/`.
- History note: a feature_type shim I first added to `StatblockConfig` was reverted (9353f02) per instruction; net diff for that file is empty.

## Drive-by fixes
None.

## Follow-ups
1. SDK branch must carry 3.0.1's SC-155 fix before 3.1.0 is released (R3a's tarball does).
2. `authoring.sdkModel`/insert example for ds-sb has no `skills` field (deferred form editor; unaffected).

## Artifacts (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc390-companion-ref/`)
`rebaseline.txt`, `widening.txt`, `sc390-r1b-final-namediff.txt`, `sc390-r1b-ev-before.png`, `sc390-r1b-ev-after.png`, `sc390-r1b-final-{tsc,lint,jest,freeze,parity}.txt`, `sc390-r1b-final-shots-run{1..4}.txt` (runs 1-2: untrimmed fixture; runs 3-4: final), `sc390-r1b-final-hashes-run{1..4}.txt`, `sc390-r1b-final-allhash-run{1..4}.txt`, `sc390-r1b-final-tsc-3.0.0.txt`, `sc390-r1b-jest-before.txt`, `sc390-r1b-shots-before.txt`, `sc390-r1b-freeze-before.txt`.
(Final-gate caveat: lint and the first full jest ran on the first fixture revision; the final full jest, runs 3-4 shots, freeze and parity ran on the committed final fixture. `sc390-r1b-final-jest.txt` is the final-tree run.)
