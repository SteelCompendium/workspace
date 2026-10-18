# SC-390 R2b review: draw-steel-elements `sc390-companion-ref` @ 5e4cdc2 (R1b)

## Executive summary
1. Verdict: **FIX ROUND NEEDED (small)**. 0 CRIT / 0 HIGH / 2 MED / 2 LOW / 6 INFO. The product code is correct. One test assertion is vacuous, and the branch is behind `origin/develop`.
2. Battery on the 3.1.0 tarball (sha256 953577d5…) reproduces every one of the author's numbers: tsc/lint clean; jest 4440 passed / 1 skipped / 219 of 220; shots 572, 0 FAIL, host-copy pin OK, button host-leak 112 kinds / 672; print-twin 142 ids; freeze `FREEZE VIOLATED (2 checksum mismatches, 0 missing)` = exactly `statblock-roleless-corpus--steel-{print,realprint}.png`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
3. Hashes: `rebaseline.txt` (2) and `widening.txt` (2) match **byte for byte**. My run1 and run2 are identical across all 572 PNGs, and all 284 print/realprint hashes equal the author's run4. Names go 274 -> 276: 0 removed, 2 added, 0 duplicates. No other frozen line moved (a baseline join shows only the 2 rebaseline names).
4. Committed tree on the 3.0.0 pin: tsc green. At runtime exactly **3 tests fail (not 2) in 3 suites**: statblock.test.ts "SC-390: the companion-corpus fixture renders end to end…", visual-harness/fixtures.test.ts "statblock/companion-corpus mounts with no error card", and sccElement.test.ts "a beastheart companion code renders the REAL statblock card (SC-390)". Totals: 4437 passed / 3 failed / 1 skipped. Exactly 4 shots error (`statblock-companion-corpus--steel-{dark,light,print,realprint}--ERROR.png`, `dto.isTrait is not a function`). The other 568 PNGs are byte-identical to the 3.1.0 run. Freeze reads the same 2-mismatch line.
5. **MED-1, a landing fact that changes what Scott is told:** dse `origin/develop` is now **0ecb90e**. Scott pushed it at 10:43 today: "steel-compendium-sdk 3.0.1; drop the featureblock feature_type shim (SC-155)". **SDK 3.0.1 is published on npm** (versions: 3.0.0, 3.0.1; 3.1.0 is NOT). With 3.0.1 installed, the committed branch is fully green: tsc clean, jest 4440/1, all 572 shots byte-identical to the 3.1.0 run. So the plugin branch does **not** have to wait for a 3.1.0 publish. It needs a rebase onto 0ecb90e (no file overlap) and a battery re-run. The bump to 3.1.0 becomes optional cleanup.
6. **MED-2:** the whitespace-EV sub-assertion is vacuous. It appends a second `ev:` key, `yaml` throws "Map keys must be unique", and no head renders. The mutant that drops `.trim()` survives.
7. Provenance-line ruling: **the trimmed state is the consistent one.** The untrimmed member `metadata` (class `beastheart`, `level: 1`, `type: feature/companion/…`) drove three head slots: a left-deck "Beastheart", a right-eyebrow "Level 1", and "Feature" instead of "Trait" on Mighty Spring. The site's statblock island has no origin or level field for features (`sbFeature`). No other embedded statblock feature (retainers, champions, all 513) carries `metadata`. So none of them show this line, and neither does the site.

## Findings

### MED-1: branch is behind origin/develop; the SDK premise is out of date
- Facts: the worktree's own `origin/develop` ref (a337460) is stale because it was never fetched. The main checkout's dse remote-tracking ref shows `origin/develop` = `0ecb90e`, which pins `steel-compendium-sdk` **3.0.1** and edits package.json, package-lock.json, src/authoring/compendiumInsert.ts, src/model/FeatureblockConfig.ts and test/unit/model/featureblockConfig.test.ts. None of those overlap the branch's 13 files. 3.0.1 already carries the SC-155 static `Feature.isTrait(dto)` fix that the companion features need. The companion fields (`skills`, text `free_strike`) pass through `Statblock.fromDTO`'s spread at runtime, and `companionFields.ts` covers the compile-time type. I measured this directly by installing 3.0.1 uncommitted on 5e4cdc2: `sc390-r2b-jest-3.0.1.txt` reads 4440/1/219 of 220, and `sc390-r2b-allhash-3.0.1.txt` is byte-identical to `sc390-r2b-allhash-run1.txt` (3.1.0) across all 572.
- Failure scenario: the owner tells Scott that "the plugin branch cannot land until 3.1.0 is published". That is no longer true. Or the branch lands on a stale base: its package.json still pins 3.0.0, and a merge would either conflict on the pin or revert it.
- Prescribed fix: rebase `sc390-companion-ref` onto `origin/develop` 0ecb90e. Expect a clean rebase: no shared files, and the pin becomes 3.0.1. Re-run the full battery on the rebased tree, parity last. Expect the same numbers, but confirm that freeze on 0ecb90e itself still reads 274/274 before the change. Optional, to keep Scott's item 2: bump to 3.1.0 after it is published. That is still a package.json + lock change only. The `companionFields.ts` docstring ("the plugin pins … 3.0.0") should then say 3.0.1. Owner's call whether 3.1.0 stays inside SC-390.

### MED-2: vacuous whitespace-EV assertion (test/dom/elements/statblock.test.ts, the `ev: "  "` case inside "SC-390: an empty `ev` omits the EV chip entirely")
- `renderStatblock(\`${COMPANION_BASE}ev: "  "\n\`)` appends a second `ev:` key to a block that already has `ev: ""`. Obsidian's parser (`yaml` v2, mocked verbatim in test/mocks/obsidian-core.ts:25) throws `Map keys must be unique`. The block becomes an error card, so `.dse-head__deck--right` is null whatever view.ts does. Probe: `sc390-r2b-probe-ev.txt`; `StatblockConfig.readYaml` throws /unique/.
- Mutation M3 (view.ts:179, drop `.trim()`): the 3 targeted suites stay **green, 198/198** (`sc390-r2b-mutations.txt`).
- The code itself is right. With a well-formed `ev: "  "`, `statblockHeaderParts(...).rightDeck` is `undefined` (probe).
- Fix: build the case with `COMPANION_BASE.replace('ev: ""', 'ev: "  "')`, and assert `.dse-error-card` is null and `.dse-sb > .dse-head` exists before checking the deck slot. Re-run M3 to confirm it goes red.

### LOW-1: `ev: null` / `ev: ~` / bare `ev:` prints "EV null" (view.ts:176-182, pre-existing)
- Probe results: `0` -> "EV 0", `"0"` -> "EV 0", `3` -> "EV 3", `""` and `"   "` -> omitted, absent -> "EV N/A" (owner-ruled), **`null`/`~` -> "EV null"**. The site (statblock_card.go:322-329) omits EV whenever `TrimSpace(EV) == ""`, and a YAML null decodes to "" in Go, so the site omits these too. `0` and `"0"` match the site ("EV 0").
- No real data emits null (steel-etl writes `ev: ""`), and the old code printed "EV null" too, so this is not a regression. A hand-author's bare `ev:` is still the likeliest way to write "no EV".
- Fix (optional): treat `statblock.ev === null` like empty and omit it, keeping `undefined` -> 'EV N/A'.

### LOW-2: Skills edge shapes (view.ts:246-248)
- `skills: Sneak` (a scalar) is silently dropped by the `Array.isArray` guard. `skills: [""]` renders a "Skills" cell with an empty value. Neither occurs in real data. The file's own precedent (`toLegacyList` in StatblockConfig.ts) coerces a bare scalar rather than dropping it.
- Fix (optional): `const skills = (Array.isArray(sb.skills) ? sb.skills : sb.skills != null ? [sb.skills] : []).map(String).map(s => s.trim()).filter(Boolean)`, and render only when non-empty.

### INFO
1. **Correction for the owner's note to Scott:** under 3.0.0 the committed tree has **3** failing tests in 3 suites, not "2 panther tests" (see summary item 4). The 3rd is the F4 harness-fixture mount test.
2. **Provenance ruling detail:** see `renderFeature.ts` `kindNounOf` (:356), `leftDeckOf` (:406), `levelOf` (:447), and the head assembly (~:640-655). The trimmed `metadata: {scc: [..]}` has no `class`, `level` or `type`, and `scc` is a list, so the `level-N` regex fallback (string only) does not fire. All three slots go empty, and the kind noun falls back to `isTrait()`, giving Pounce "Ability" and Mighty Spring "Trait". The author reported only the provenance line. The level eyebrow and the Feature->Trait noun also changed. All three now agree with the site and the house pattern, so no action.
3. **Site vs plugin content (panther):** both show the name, keywords "Animal, Companion", Level 1, role "Companion", Size 1M / Speed 7 / Stamina "= yours" / Stability 1 / Free Strike "1 + M", Immunity / Weakness / Movement Climb / Skills Sneak (same 4-slot order), M+2 A+2 R-1 I+2 P+1, Pounce (keywords, Maneuver, Melee 1, One enemy, flavor, Effect, Spend 1 Ferocity) and Mighty Spring, and no EV.
   - **Only on the site:**
     - (a) The Level 3/6/10 advancement section under the card. This is SC-392, and the docs honestly say "its level 1 abilities".
     - (b) Sneak links to the skill page. The plugin shows plain text because the data's `skills` is plain.
   - **Only on the plugin:** the "Signature" chip on Pounce. It comes from the data's `ability_type`; the site's section-parse has none.
   - **Shown differently:** empty Immunity/Weakness is "-" in the plugin and "—" on the site. That is the plugin's existing global fallback, not this change.
   - No action needed.
4. **Render path is clean:** `free_strike` and `stamina` reach the DOM only through template literals (view.ts:228,230). The only numeric coercions live in EncounterData.ts:701,779, resolveRefs.ts:122,158 and encounter/view.ts:367-405, which are SC-393 and out of scope.
5. **companionFields.ts typing:** against the tarball's `dist/model/Statblock.d.ts` (`freeStrike: number | string; skills?: string[]`), `Omit<Statblock,'freeStrike'> & {freeStrike: number|string; skills?: string[]}` is structurally identical. tsc is green on 3.0.0, 3.0.1 and 3.1.0, so bumping the pin needs no code edit.
6. **Fixture single-sourcing:**
   - `test/fixtures/statblock/companion-corpus.yaml` = a 21-line `#` comment header + a body **byte-identical** to the `ds-sb` block of `test/fixtures/md-dse/.../panther.md`.
   - That panther.md is byte-identical to `sc390-r3a-panther-mddse.md`.
   - The harness (entry.ts:106) and jest (statblock.test.ts:56) import the same file.

Not findings (verified OK):
- **Mutations:**
  - M1 (remove Skills push): red, 4 tests.
  - M2 (restore the dangling `EV ${ev}`): red, 3 tests.
  - M4 (drop 'skills' from the sticky order): red, 1 test.
  - All were reverted byte-clean (`git diff -- src` empty after each).
- **Docs:** all five files carry a consistent, plain-language "what renders / what doesn't yet" statement with no ticket keys in user docs.
  - The 9 non-rendering kinds (skills, skill groups, saints, gods, chapters, projects, movement, negotiation, monster-group lore) and the rendering list match the R0 md-dse type census exactly.
  - The command name "Insert Draw Steel: compendium reference" matches compendiumInsert.ts:358.
  - The CHANGELOG has two [FIX] bullets under 7.0.0 (unreleased).
- **Docs images:** none shows a dangling EV. The statblock images (statblock.png, statblock-side-by-side.png, the initiative images) come from fixtures with an `ev` set (goblin-stinker `ev: "6"`, default). scc-reference.png is a kit. No regeneration needed.
- **SC-406 switch OFF:** ds-scc panther and ds-sb companion-corpus both mount `data-dse-element="statblock"` with the Skills cell and no "not available" card (`sc390-r2b-probe-experimental-off.txt`).
- **Skills cell CSS:** the cell takes the generic `.dse-sb__kv` rules (no modifier-keyed CSS exists), and print puts the even child on the right, exactly like Weakness. Non-companion grids are unchanged (pinned by test and by all 568 non-companion PNGs being identical).
- **EV crops:** before/after match the shot visually. The crop is a downscaled header (1520 -> 1200 px wide), so it does not pixel-compare to the raw PNG. That is expected.
- **Shared main checkout:** the main checkout's `draw-steel-elements` is dirty: `demo-vault/Welcome.md`, `justfile`, untracked `compendium-manifest.json` and `demo-vault/montage 1.md`; reflog shows 11:04-11:06. This predates and is unrelated to this review. I never touched it. It is flagged because `deploy*` hard-aborts on a dirty tree.

## What I executed
- On 5e4cdc2 with the 3.0.0 pin:
  - jest -> `sc390-r2b-jest-3.0.0.txt`.
  - shots -> `sc390-r2b-shots-3.0.0.txt`, `sc390-r2b-allhash-3.0.0.txt`.
  - freeze -> `sc390-r2b-freeze-3.0.0.txt`.
- With the tarball (`npm install <tgz>`, uncommitted):
  - npm install -> `sc390-r2b-npminstall.txt`.
  - tsc -> `sc390-r2b-tsc.txt`; lint -> `sc390-r2b-lint.txt`; jest -> `sc390-r2b-jest.txt`.
  - shots x2 -> `sc390-r2b-shots-run{1,2}.txt`, `sc390-r2b-allhash-run{1,2}.txt`; freeze x2 -> `sc390-r2b-freeze-run{1,2}.txt`.
  - name diff -> `sc390-r2b-namediff.txt`, moved-line join -> `sc390-r2b-baseline-moved.txt`.
  - mutations -> `sc390-r2b-mutations.txt`.
  - probes (scratch test files, deleted) -> `sc390-r2b-probe-ev.txt`, `sc390-r2b-probe-experimental-off.txt`.
  - parity (last) -> `sc390-r2b-parity.txt`.
- With published 3.0.1 (uncommitted): `sc390-r2b-npminstall-3.0.1.txt`, `sc390-r2b-tsc-3.0.1.txt`, `sc390-r2b-jest-3.0.1.txt`, `sc390-r2b-shots-3.0.1.txt`, `sc390-r2b-allhash-3.0.1.txt`.
- Restored: `git checkout -- package.json package-lock.json && npm ci` (`sc390-r2b-npmci-3.0.0-final.txt`). tsc on 3.0.0 is clean (`sc390-r2b-tsc-3.0.0.txt`), `git status --porcelain` is empty, HEAD is 5e4cdc2, and the pin is 3.0.0.
- I eyeballed the companion-corpus light, dark and print shots: eyebrow "Companion", PANTHER, "Animal, Companion", Level 1 chip, role "Companion", no EV, the 5-stat row with "= yours" and "1 + M", Immunity -, Weakness -, Movement Climb, Skills Sneak, characteristics, Pounce (Ability, Signature, Companion/Melee/Weapon, Maneuver, Melee 1, One enemy, Effect, Spend 1 Ferocity) and Mighty Spring (Trait).
- The shared freeze baseline was not touched (md5 3810d542…, 274 lines). I did not run the lifecycle gate (view-only change, no block-lifecycle code).
