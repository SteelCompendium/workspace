# SC-191 slice 1 report — model, entries, tallies, tests

## Executive summary

STATUS: DONE. Base sha `69eb5f7` (rebased; origin/develop moved from the expected `778a341`
during dispatch — 10 SC-184 commits, no `package.json` change, no `npm ci` needed). Commit
`d154b9f2b866e73fb836eb5e8bfac20e490d6d2f` on `sc191-montage-overhaul`, not pushed. Scope:
spec §B schema (`description?`, `entries?`/`MontageEntry`, fixed key order, omit-when-default,
§B.3/§B.4/§B.5), two pure helpers `montageTallies(m)`/`montageBandCopy(m)`, tests per §G rows
1–2. No UI/CSS/fixture touched — `example.yaml` deliberately left untouched (confirmed
necessary for pixel-neutrality, see below). All new tests shown red before the code that
makes them green (18 failed pre-implementation). Full battery green: tsc/lint clean, jest
3537/1 skipped/192 suites (+23 over the 3514/191 pre-slice baseline on this same rebased
tip), shots 478 PNGs/0 FAIL/byte-identical ×2, freeze 210/210 with the two montage print
lines byte-identical to baseline (zero movement), parity 0/0/16. `montageOutcome`'s known
0/0 "pending"-band bug is intentionally NOT fixed here (spec §I assigns it to slice 2).

## Base / commit

- Dispatch-expected base: `778a341` (`origin/develop`)
- Actual `origin/develop` at fetch time: `69eb5f7` (10 commits ahead — SC-184 sidebar work:
  panel removal/headers/empty-state/restart persistence, pin/unpin chrome items, a fix
  round, doc cleanup). `package.json` unchanged between the two → no `npm ci` needed.
- Rebased branch tip before this slice: `a8a42c1` → after `git rebase origin/develop`.
- Slice 1 commit: `d154b9f2b866e73fb836eb5e8bfac20e490d6d2f` — "SC-191 slice 1 — model,
  entries, tallies, tests". Not pushed. No tag/release created. Superproject pointer
  untouched.

## Scope delivered

`src/elements/montage/model.ts`:
- `MontageModel` gains `description?: string` and `entries?: MontageEntry[]`; new
  `MontageResult`/`MontageEntry` types (`hero`, `round`, `result`, `skill?`, `note?`).
- `parse()`: fixed key-order assignment now covers `title, description, rounds,
  success_limit, failure_limit, successes, failures, participants, entries, current_round,
  _dse_anchor` (unchanged existing keys keep their exact pre-SC-191 defaulting/omission
  behavior — untouched). `description` and `entries` are omit-when-empty (never `''`/`[]`).
  New `sanitizeEntry`/`sanitizeEntries` defensively drop a malformed whole entry (bad/missing
  `hero`/`round`/`result`) or a malformed optional field (`skill`/`note` null or wrong type) —
  ds-montage carries no AJV schema, so this parse is the only line of defense; never throws.
- `serialize()`: unchanged (`stringifyYaml(model).trim()`) — correct key order falls out of
  `parse()`'s fixed assignment order, the pre-existing technique.
- `montageOutcome()`: **unchanged**, including its documented 0/0 → `'failure'` bug (a new
  code comment marks it explicitly deferred to slice 2, per spec §I).
- New `montageTallies(m)`: reads `successes`/`failures` straight off the model's own scalars
  (never `entries.length` or a filter over `entries` — §B.3's testable invariant), plus
  derived `toTotal`/`failuresSpare` spare-counts and a `complete` flag.
- New `montageBandCopy(m)`: the outcome band's at-a-glance tail phrasing, quoted verbatim
  from the settled mock (`visual-harness/sc191/mock6.js`'s `outcome()`) — tensed live
  (`"1 from Total Success"`, `"1 more ends it"`) vs. complete (`"the success limit,
  reached"`, `"1 under the failure limit"`).

`example.yaml` intentionally **not** changed: §B doesn't require it, and it currently doubles
as the visual harness's sole `{ default }` montage fixture (spec §F) — adding
`description`/`entries` to it would render new content and move `montage--steel-print.png`,
violating this slice's "provably pixel-neutral" acceptance criterion. Confirmed by the
freeze result below (both montage print lines byte-identical to the frozen baseline).

## Tests

- `test/unit/model/montage-serialize.test.ts` (extended, 15 → 25 tests): §B.4 backward
  compatibility (old-shape YAML parses with `description`/`entries` undefined and serializes
  back byte-identical — the compatibility proof); §B.5 new-shape round-trip identity and
  `parse(serialize(parse(x))) ≡ parse(x)` stability; top-level key order incl. `entries`;
  entry key order (`hero, round, result, skill, note`); omit-when-default for
  `description`/`entries`/`skill`/`note`; a null/wrong-type entry field dropped, never
  crashes (one malformed field dropped from an otherwise-valid entry, one entry dropped
  wholesale for a wrong-type `hero`, one dropped for an invalid `result`, in the same input).
- `test/unit/model/montage-tally.test.ts` (**new**, 13 tests): `montageTallies` never
  substitutes `entries.length` for the stored scalar (direct case + a deliberately
  disagreeing block); a delta-only write replicating §C integrity probe 5 (old-shape block,
  successes 4→5 with a one-item `entries` list, not `successes: 1`); paired-delta correction
  (success→failure); delta-only removal; `montageBandCopy`'s at-a-glance phrasing for every
  literal string spec §G row 2 names (`"2 from Total Success"`, `"1 from Total Success"`,
  `"1 more ends it"`, the two tensed-complete forms `"the success limit, reached"` / `"1
  under the failure limit"`), plus the two vacuous-limit edge cases that produce the
  remaining literal strings (`"Total Success reached"`, `"the limit is reached"` — both
  reachable only when the corresponding limit is unset/0, since a set limit reaching 0
  spare always implies `complete: true` by construction — documented in the test names); and
  a documentation test pinning today's (buggy) 0/0 `'failure'` band as a red-to-green marker
  for slice 2.

**Red-before-green, shown explicitly:** stashed `model.ts` back to its pre-slice state, ran
both test files against it — **18 failed / 20 passed** (log:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-slice1/jest-montage-red.log`).
Representative failures: `TypeError: Cannot read properties of undefined (reading 'split')`
(no `entries:` key emitted, since `montageTallies`/`montageBandCopy` didn't exist and
`entries` wasn't parsed), key-order mismatch (`description`/`entries` missing from expected
array), and `model.entries` `undefined` where the malformed-entry-drop test expected a
sanitized one-item array. Popped the stash to restore the implementation; re-run green (log:
`.../scratchpad/sc191-slice1/jest-montage-only.log`, 38/38 passed).

## Gates — full `dse-verify` battery, in order

| Gate | Expected (dispatch, `778a341`) | Measured (`d154b9f`, base `69eb5f7`) | Log |
|---|---|---|---|
| `npm run tsc` | clean | **clean** | `1-tsc.log` |
| `npm run lint` | clean, exit 0 | **clean, exit 0** | `2-lint.log` |
| `rm -f main.js styles.css && npx jest` | 3491 passed / 1 skipped / 189 suites, **plus new tests** | **3537 passed / 1 skipped / 192 suites** (191 passed + 1 skipped; +23 tests over the 3514/191 pre-slice baseline measured on this same rebased tip — `0-jest-baseline.log`) | `3-jest.log` |
| `npm run shots` ×2 | 478 PNGs (+ any new capture ids), 0 FAIL, byte-identical | **478 PNGs, 0 FAIL both runs; `sha256sum` of all 478 files identical across the two runs (0-line diff)** — slice 1 adds no capture ids | `4-shots-run1.log`, `5-shots-run2.log`, `shots-run1.sha256`, `shots-run2.sha256`, `shots-diff.txt` (empty) |
| `check-freeze.sh` | 210/210, 0 mismatches | **`freeze OK (210/210 frozen print PNGs byte-identical)`, exit 0** | `6-freeze.log` |
| `npm run parity` (last) | 0 GAPs / 0 undeclared / 16 declared | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0** | `7-parity.log` |

The jest baseline moved from the dispatch-quoted 3491/189 because origin/develop moved
(SC-184 landed between dispatch and fetch) — the delta attributable to this slice alone is
the **+23** measured directly against the pre-slice tip on the same rebased base, isolating
the rebase's effect from the slice's effect.

**Freeze — zero montage movement, verified directly, not just via the aggregate count:**

```
baseline:  8e5cc6ae8362160692d9705c6cf765889d397c044cfbe22b458f988c79264123  montage--steel-print.png
live:      8e5cc6ae8362160692d9705c6cf765889d397c044cfbe22b458f988c79264123  montage--steel-print.png
baseline:  8e5cc6ae8362160692d9705c6cf765889d397c044cfbe22b458f988c79264123  montage--steel-realprint.png
live:      8e5cc6ae8362160692d9705c6cf765889d397c044cfbe22b458f988c79264123  montage--steel-realprint.png
```

**Freeze FAIL lines: none.** `rebaseline.txt`: not applicable — nothing moved.

## Integrity probes (spec §C / brief §4)

Slice 1 touches **only** `model.ts` (pure `parse`/`serialize`/helpers) — no host, view, or
persistence-path code. Probes that exercise the write PATH itself are therefore inherited
unchanged and are marked N/A-this-slice below (their coverage is the untouched `host/
*.test.ts` and `framework/*.test.ts` suites staying green inside the 3537-passed jest run);
probes that exercise the model contract are demonstrated directly by the new tests.

1. **Content above/below the block survives a write** — N/A this slice; `ElementView.persist()`
   / `replaceSource()` (`src/framework/view.ts`, `host/*BlockHost.ts`) are unmodified.
2. **Two `ds-montage` blocks in one note don't cross-talk** — N/A this slice; no session/host
   code touched.
3. **A hand-edited YAML value survives a re-trigger and the next write** — demonstrated at
   the model level: `montage-tally.test.ts` "a block whose entries disagree with its scalars
   renders the scalars truthfully, not a recount" proves `montageTallies` never overwrites a
   hand-edited stored total with a count derived from `entries`.
4. **A user-deleted block regenerates cleanly from a fresh paste of the example** —
   unaffected: `example.yaml` is untouched, and the pre-existing "parses the shipped
   example.yaml into the full schema" test stays green unmodified.
5. **An old-shape block upgraded on write loses nothing** — demonstrated on both sides of the
   contract: `montage-tally.test.ts`'s delta-only-write test (`successes: 4` → `5` with a
   one-item `entries` list, never `successes: 1`) is the tally-level proof;
   `montage-serialize.test.ts`'s §B.4 describe block is the parse/serialize-level proof
   (old-shape YAML in, byte-identical semantic YAML out, `description`/`entries` stay
   `undefined`).

(Spec §C lists 8 probes total; probes 6–8 — stale-scalars-kept, read-only-host zero-writes,
rapid-click coalescing — are UI/write-path behavior with no surface in this slice; nothing
in `model.ts` changes their coverage.)

## Drive-by fixes

None. Nothing in the touched files met all four bars (obviously correct, local, no gate-
baseline risk, worth calling out) — `model.ts`'s header comment was rewritten in full as
required documentation for the schema change itself, not a fix to something unrelated.

## Follow-ups

None beyond what the spec already tracks for slice 2: `montageOutcome`'s 0/0 → `'failure'`
"pending"-band bug (spec §I explicitly assigns the fix to slice 2 alongside the UI that
reads it; a new test in `montage-tally.test.ts` documents today's behavior as a red-to-green
marker rather than re-filing it here).

## Scope notes (interpretation calls made, not spec inconsistencies)

The brief named the two helpers by name but not by signature; the following design choices
were made to satisfy every literal test string spec §G row 2 names, and are recorded here for
the reviewer rather than left implicit:

- `montageTallies`/`montageBandCopy` derive a `complete` flag from the model's own scalars
  (`success_limit`/`successes`/`failure_limit`/`failures`/`current_round`/`rounds` — no
  schema field for it, matching `montageOutcome`'s own precedent of re-deriving "exhausted"
  every call). Reaching the success limit or exhausting failures/rounds always implies
  `complete: true` by construction, which makes the *untensed* `"Total Success reached"` /
  `"the limit is reached"` strings reachable only when the corresponding limit is left
  unset (0) — the same vacuous-`Math.max(0, …)` arithmetic the mock itself uses. Tests for
  those two strings are named to say so explicitly.
- Malformed `entries[]` handling: a required field (`hero`/`round`/`result`) that is
  missing or the wrong type drops the **whole entry**; an optional field (`skill`/`note`)
  that is `null` or the wrong type is dropped **field-by-field**, keeping the rest of the
  entry. Both never throw.

## Artifacts

- Commit: `d154b9f2b866e73fb836eb5e8bfac20e490d6d2f` (branch `sc191-montage-overhaul`,
  worktree `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`)
- This report:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-slice1-report.md`
- Gate logs (all under
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-slice1/`):
  `1-tsc.log`, `2-lint.log`, `3-jest.log`, `0-jest-baseline.log`, `4-shots-run1.log`,
  `5-shots-run2.log`, `shots-run1.sha256`, `shots-run2.sha256`, `shots-diff.txt`,
  `6-freeze.log`, `7-parity.log`, `jest-montage-red.log` (red-before-green proof),
  `jest-montage-only.log` (green confirmation), `commit-msg.txt`
- No PNG crops produced — no rebaseline needed (zero montage movement).
