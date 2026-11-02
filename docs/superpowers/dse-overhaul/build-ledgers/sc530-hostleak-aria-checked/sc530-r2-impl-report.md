# SC-530 r2 implementation report

## Executive summary
1. Verdict DONE. dse branch `sc530-hostleak-aria-checked`, head **2388872d**, rebased onto origin/develop **ad018cda** (SC-522; owner message mid-run, after a full pass of the battery on fb24f8a2). Not pushed. Commits on top of ad018cda: `2831b6c6` (r1 proto d1ab0bd cherry-picked, clean), `a0000b88` (r2 vertical-track suffix + SC530_EXPECT), `2388872d` (jest seam tests).
2. Form (C) measured LIVE: button **161 kinds / 966 comparisons** (base 157 / 942), boundary **34 records, text identical to base** (32 focus-visible disabled + 2 hover no-hit), modal 228 (38 kinds), input 15/176, checkbox 7/116, prose 106 [212] + 9 img [18]. New kinds: 4 (listed below), 0 renamed, 0 lost, 0 moved.
3. 592 PNGs sha256-identical to the clean fb24f8a2 base on the fb24f8a2-based head AND on the ad018cda-rebased head (0 FAIL, rc 0).
4. tsc rc 0; lint rc 0; jest **6249 passed / 1 skipped / 249 of 250** (ad018cda baseline 6245 + my 4 tests); freeze **280/280**; parity **0 gaps / 0 undeclared / 24 declared**, rc 0 (run last).
5. Build identity: `main.js` a37fbb6f...c133c24 and `styles.css` ae45354b...ad5b0 at head2 == clean ad018cda (also dcbe5f58... / ae45354b... at fb24f8a2 head == clean fb24f8a2). Lifecycle (45/45) and e2e (124/124, 87/87) therefore CARRIED, not run.
6. Can-fail on the head (each reverted, tree clean, 592 PNGs identical each): (a) leakprobe rc **1**, 18 problems, all `negotiation|dse-pr__row|checked`; (b) noclick rc **1**, 8 named lines incl. `the sweep tagged no negotiation|dse-pr__row|checked button`; (c) vertprobe rc **1**, 18 problem lines, all `negotiation|dse-track__slot|checked|in:track--vertical`. These were run on the fb24f8a2-based head (shoot.mjs is byte-identical across the rebase; ad018cda does not touch it).

## Key and kinds
- `tagButtons` suffix (last in the key): `(n.closest('.dse-track--vertical') ? '|in:track--vertical' : '')`. Class from `src/framework/kit/track.ts:72` (`dse-track dse-track--${orientation}`). Comment cites SC-530 and why (own-box CSS `.dse-track--vertical .dse-track__slot[...]` differs from horizontal).
- `SC530_EXPECT` (4, named FAIL if untagged, one call site `assertSc530Tagged` after `assertSc527Tagged`):
  1. `negotiation|dse-pr__row|checked` (tier row, section 38)
  2. `negotiation|dse-track__slot|checked` (Patience 3)
  3. `negotiation|dse-track__slot|in:track--vertical` (Interest idle seal)
  4. `negotiation|dse-track__slot|checked|in:track--vertical` (Interest current seal)
- Renames: **none** (no existing key string changed; the first nodes of `negotiation|dse-pr__row` and `negotiation|dse-track__slot` are unchanged; boundary text identical).
- Comments: `tagButtons` comments (checked + vertical) and the SC-527 block header ("Known gap (SC-530)" replaced by "SC-530: ... `|checked` ... and a seal on a vertical track (`|in:track--vertical`) is apart from a horizontal one") both read correctly and mention (C); SC530_EXPECT doc updated to describe the 2 vertical kinds. No `entry.ts` change.

## Tests (test/dom/visual-harness/fixtures.test.ts, nested describe in the SC-527 block, +61 lines, 4 tests)
1. SC530_EXPECT literal = exactly the 4 keys, all prefixed `negotiation|`.
2. tagButtons (read from shoot.mjs source) on the gallery negotiation + SC-527 mount: at load `negotiation|dse-track__slot|checked` + both vertical kinds present, `negotiation|dse-pr__row|checked` absent; after clicking section 38's `.dse-pr__row` #0 it is present.
3. No rename: `negotiation|dse-pr__row` and `negotiation|dse-track__slot` still present, no key contains `aria-checked`, every `|in:track` key is a vertical track slot (regex).
4. `assertSc530Tagged(` appears exactly twice and its first occurrence in `assertBtnHostLeak` follows `assertSc527Tagged(`.

Break-proofs (one-line break on shoot.mjs, jest `-t SC-530` rc 1, reverted via `git checkout -- visual-harness/shoot.mjs`):
- B1 delete the 4th SC530_EXPECT line -> test 1 FAILS.
- B2 `aria-checked === 'true'` -> `'nope'` -> test 2 FAILS.
- B3 `closest('.dse-track--vertical')` -> `closest('.dse-track')` (renames horizontal seals) -> tests 2 and 3 FAIL.
- B4 swap the order of the 527/530 call lines -> test 4 FAILS (an earlier variant that deleted the 530 call also failed test 4).
- B5 `closest('.dse-nope')` (suffix never written) -> tests 2 and 3 FAIL.

## Gates (details)
| gate | result |
|---|---|
| fb24f8a2 clean base shots | rc 0, 592 PNGs, 0 FAIL, button 157/942, boundary 34, modal 228, input 15/176, checkbox 7/116 (98+...=116), prose 106 [212] |
| head shots (fb24f8a2-based, then ad018cda-based) | rc 0 both, 592 PNGs identical to base both times, 0 FAIL, **button host-leak OK (161 button kinds x 3 states (rest/hover/focus-visible) x dark/light = 966 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)**, modal 228, input 15/176, checkbox 7/116, prose 106 [212] |
| boundary | 34 records identical (diff of the base vs head log blocks: empty) |
| jest | fb24f8a2-based head 6232 / 1 / 249 of 250; ad018cda-based head **6249** / 1 / 249 of 250 |
| freeze | 280/280 both |
| parity (last) | 0 gaps, 0 undeclared, 24 declared, rc 0 |

Boundary, all 34 (same as base): 32x focus-visible disabled: featureblock/feature/hero/roll/statblock `dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled` x2 each; featureblock/feature/hero/party/roll/statblock `dse-btn.dse-btn--icon.dse-stepper__btn|disabled` x2 each; `hero|dse-btn|disabled` x2; `montage|dse-btn.dse-btn--accent|disabled` x2; `montage|dse-btn.dse-btn--icon.dse-mt__board-rowact|disabled` x2; `montage|dse-btn|disabled` x2; `negotiation|dse-btn|disabled` x2. 2x hover no hit point: `initiative|dse-btn.dse-init__stamina` x2. Modal boundary: 6x focus-visible `modal:(none)|dse-btn.dse-btn--accent|disabled` @MinionStaminaPoolModal / @MontageAddHeroModal / @StaminaEditModal x2 each.

Drive-by fixes: none.
Follow-ups: none new. (Note: the first background shots launch returns an immediate "completed" notice because the job re-backgrounds inside devbox; I polled the rc file instead.)

## Evidence (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc530-r2-impl/`)
- Base shots: `r2-shots-base.{log,sha256,count,rc}`; host-leak excerpts `r2-hostleak-lines-{base,head,head2}.txt`
- Head shots: `r2-shots-head.*` (fb24f8a2-based), `r2-shots-head2.*` (ad018cda-based)
- Probes: `r2-shots-{leakprobe,noclick,vertprobe}.{log,rc,sha256,count,diff}`
- Builds: `r2-build-{base,head,base2,head2}.sha256`
- Gates: `r2-tsc*.log`, `r2-lint*.log`, `r2-jest.log` (final), `r2-jest-fb24.log`, `r2-freeze*.log`, `r2-parity.log`
- Break proofs: `r2-brk{1,2,3,4,4b,5}.log`; first test run `r2-jestfix1.log`
- Runner scripts: `r2run.sh`, `r2shots.sh`, `r2build.sh`, `r2jest.sh`

---

# r4 (fix round + rebase)

## Summary
1. Verdict DONE. dse head **97284051** on origin/develop **88cb7db9** (SC-539; develop had not moved further). Commits over base: `c59c4882` (r1 proto), `f9bdb873` (vertical suffix + SC530_EXPECT), `13e5d0c2` (r2 jest tests), `97284051` (r4: LOW-1, LOW-2, INFO-2). Not pushed.
2. LOW-1: new jest test over every `[data-dse-hostleak]` node: `key.includes('|checked') === (aria-checked === 'true')`, `key.endsWith('|in:track--vertical') === !!closest('.dse-track--vertical')`, and the node tagged `negotiation|dse-track__slot` is inside `.dse-track--horizontal`. LOW-2: `assertSc530Tagged` extracted from shoot.mjs source (`[]` -> 4 problems each naming a key; `SC530_EXPECT` -> 0) + a test that SC-527's first negotiation section `reached` contains `button.dse-pr__row[role="radio"][aria-checked="true"]`. INFO-2: both comments reworded in shoot.mjs (comment-only diff, 4+/2-).
3. Break proofs (jest `-t "SC-530|SC-527"` rc 1 each, reverted, tree clean): K1 `aria-checked !== 'false'` -> per-node test fails; K8 suffix on `.dse-track--horizontal` -> per-node test fails; K7 `if (false && !keys.includes(want))` in `assertSc530Tagged` only -> extraction test fails; K5 delete the `reached` selector line -> reach test fails.
4. Gates on the final head: tsc 0; lint 0; jest **6252** passed / 1 skipped / 249 of 250 (88cb7db9 baseline 6245 + 7 SC-530 tests); shots rc 0, 592 PNGs identical to the fb24f8a2 base list, 0 FAIL; button 161/966; boundary 34 (block text identical to the earlier head runs and base); modal 228; input 15/176; checkbox 7/116; prose 106 [212] + 9 img [18]; freeze 280/280; parity (last) 0 gaps / 0 undeclared / 24 declared, rc 0.
5. Build identity: head and a clean 88cb7db9 build give identical `main.js` `a37fbb6f298698f797db60e7c1b7fcb63df3509d21a1717fee9ffdcfbe133c24` and `styles.css` `ae45354b6369168ebb3c80d26be6f0d665becdc3a34756d6f9e688af0a6ad5b0` -> lifecycle 45/45 and e2e 124/124 87/87 CARRIED, not run.
6. Can-fail (a)(b)(c) from r2 carry: shoot.mjs diff vs `2388872d` is comment-only (`r4-shoot-diffstat.txt`: 4 insertions/2 deletions, no non-comment +/- line).

## Details
- SC-530 tests are now 7 (r2's 4 + the per-node invariant, the `assertSc530Tagged` body test and the reach test). Test 3 ("no existing kind is renamed") is unchanged; the per-node test is separate.
- K7 first attempt matched `if (!keys.includes(want)) {` in `assertSc527Tagged` as well (4 lines changed); the test failed, but I re-ran it restricted to the SC-530 function only (`r2-r4k7b.log`, 1 changed line, rc 1) as the recorded proof.
- Drive-by fixes: none. Follow-ups: none.

## Evidence (same scratch dir as above)
- Break proofs: `r2-r4k1.log`, `r2-r4k8.log`, `r2-r4k7.log`, `r2-r4k7b.log`, `r2-r4k5.log` (+ `.rc`); first run `r2-r4jest1.log`
- Builds: `r2-build-r4head.sha256`, `r2-build-r4base.sha256`; diff stat `r4-shoot-diffstat.txt`
- Gates: `r2-tsc3.log`, `r2-lint3.log`, `r2-jest.log`, `r2-shots-head3.{log,sha256,count,rc}`, `r2-hostleak-lines-head3.txt`, `r2-freeze3.log`, `r2-parity3.log`
