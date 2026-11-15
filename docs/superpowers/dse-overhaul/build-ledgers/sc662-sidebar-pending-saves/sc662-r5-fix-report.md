# SC-662 r5 fix report (implementer I1)

**Executive summary**
- Verdict: DONE. OOS-4 and LOW-5 are folded. origin/develop is still `bab0dbb2` (fetched before and after), so no rebase.
- Final dse head `5774613e` (15 commits above `bab0dbb2`; r5 added `5c2cecfb` fix, `b76e1e0b` tests, `0b053f1f` docs, `5774613e` a one-line test type fix). Nothing pushed; `pipeline.ts`, `collapsedKey.ts`, `prefOverrides.ts` untouched (the strip is in `FormModal.ts`, which imports only `ANCHOR_KEY` from `sidebar/anchor.ts`).
- Battery at `0b053f1f`: lifecycle 64/64 in seven parts (G-S61 green, no re-run needed; load average about 15 to 20); e2e **`639/648 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`** (bab0dbb2 numbers 637/646 + 2 new, no new pair); shots 592, host-leak 163/978, modal host-leak 40/240, clip 147; freeze 280/280; parity 0 / 0 / 24; jest 13667 passed / 1 skipped (13653 + 14 new).
- `tsc` failed once in that battery (rc 2): `FormHandle` in `formSaveRedraw.test.ts` lacked `canSave` (my new SF03 calls it; jest does not type-check). Fixed in `5774613e` (type annotation only). Final head `5774613e`: tsc rc 0, lint rc 0, jest 13667 passed / 1 skipped. The lifecycle / e2e / shots / freeze / parity numbers were not re-run for that commit: it changes no source, no e2e spec and no style (the e2e `main.js` and `styles.css` are byte-identical).
- Red on `944fda6a` (the r3 head) for the new tests: jest 8 (six formModal anchor cases, SF03, SF04), e2e 2 of 2 (SIDE-OE11 sidebar, SIDE-OE12 Reading view).
- Mutants: 3 new, all killed by a named test (table below).

## OOS-4: the form validated the sidebar's `_dse_anchor` line

- Cause as ruled: `FormModal.normalise()` validates a clone of `working` that includes `_dse_anchor`; an element whose schema has `additionalProperties: false` refused it, so Save stayed disabled for every block that had ever been pinned (hero, conditions, resource, surges, tokens, roll), in the sidebar and in Reading view.
- Fix, `src/authoring/FormModal.ts` `normalise()`: the anchor key is taken out of the validator's pass and put back afterwards (not a shallow copy, so the validator's own transforms still land on `checked`). It stays in `working`, so what Save writes keeps it. `ANCHOR_KEY` comes from `src/framework/sidebar/anchor.ts` (not one of SC-652's files). It only ever takes out that one key: a real unknown key beside it still disables Save.
- Tests: `formModal.test.ts`, "the form of a block that carries the sidebar's `_dse_anchor` line": for hero, conditions, heroic-resource, surges, hero-tokens and roll, Save is enabled and the written body keeps `_dse_anchor: abc123` (6 cases); and a real unknown key beside the anchor still disables Save (6 cases). e2e `SIDE-OE11` (pinned ds-resource, fixture `Sidebar/pending-resource.md`: the Edit form's Save is enabled and lands, the anchor line stays, the panel is not the degrade card and the redrawn card shows the saved value) and `SIDE-OE12` (the same block in Reading view).

## LOW-5: the strict Save's `expectBody` for the hero's Edit definition

- `FormModal` now takes `expectBody` from the host's `currentBody()` at open (the sidebar host's cached note text of the block, the disk body), falling back to the seed `source` for a host with no `currentBody` (Reading view has the pin and ignores it). The hero's Edit definition is seeded with its normalising `serializeStateSplice()`, which a hand-written block never equals.
- Tests, `formSaveRedraw.test.ts`: `SF03` (the hero example, which is hand-written: flow-style `stamina: { current: 31, temp: 0 }`, comments in `state:`): its Edit definition form in the sidebar is saveable, Save raises no "not saved" Notice, the form closes, the note keeps the anchor and the panel is live; `SF04` (the control): the same form after an outside edit to the block (`surges: 1` to `surges: 4`) is still refused, the outside edit stays and the form stays open.

## Mutants (jest: sidebarPendingSave, montage / initiative outside-edit, sidebarInitiative, sidebarBlockHost, formSaveRedraw, persistedAnchorPassthrough, formModal)

| mutant | killed by |
|---|---|
| S1 no anchor strip in `normalise()` | the six formModal "Save is enabled" cases, SF03, SF04 |
| S2 the strip also removes the anchor from `working` (Save drops it) | the six formModal "writes the anchor back" cases, SF03 |
| S3 `expectBody` is the seed again (the LOW-5 behaviour) | SF03 |

Logs: `mut-S1-no-anchor-strip.log`, `mut-S2-anchor-dropped-from-write.log`, `mut-S3-expectBody-is-seed.log`; summaries `mutants-r5-batch1.out` (S1-S3 first run, without formModal in the file list) and `mutants.out` (S1, S2 with formModal).

## Battery detail

| gate | before the r5 fix (r3, rebased, `944fda6a`) | after (`0b053f1f`) |
|---|---|---|
| tsc | rc 0 | rc 2 (test type error), rc 0 at `5774613e` |
| lint | rc 0 | rc 0 |
| jest | 13653 passed / 1 skipped | 13667 passed / 1 skipped (also at `5774613e`) |
| lifecycle | 64/64 | 64/64 (21+16+9+4+7+4+3) |
| e2e | `637/646 ok, 0 failed, 9 known-bug, coverage: 418/418` | `639/648 ok, 0 failed, 9 known-bug, coverage: 418/418` |
| shots / freeze / parity | 592, 163/978, 40/240, 147 / 280/280 / 0-0-24 | the same |

The r3 battery logs under `r3bat-*` in the scratch dir were overwritten by this run (same script); the r3 report holds those numbers.

## Shared-file hunks (for SC-656)

No new `windowHandoff.ts` or `src/framework/sidebar/*` hunk in r5. (`FormModal.ts` imports `ANCHOR_KEY` from `sidebar/anchor.ts`; nothing in that file changed.)

## Drive-by fixes:
None.

## Follow-ups:
- `ds-roll` is also schema-strict and now accepts an anchor in its form; it is not persisted and cannot be pinned meaningfully, so no e2e (the formModal case covers it).
- No marker file was removed this round (the new mutant and battery markers were overwritten in place).

## Artifacts (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc662-r1-I1/`)

- Battery at `0b053f1f`: `r3bat-*.log`, `r3bat-*.rc`, `r3battery.progress`, `r3bat-head.txt`.
- Final head checks: `fin-tsc.log`, `fin-lint.log`, `fin-jest.log`, `fin-head.txt`.
- Red on `944fda6a`: `jest-r5red.log`, `e2e-r5red.log`.
- e2e iteration: `e2e-r5a.log`, `e2e-r5b.log`; jest iteration `jest-r5a.log`, `jest-r5b.log`.
- Mutants: `mut-S*.log`, `mutants-r5-batch1.out`, `mutants.out`.
