# SC-379 slice 1 — implementation report

**Executive summary** (re-measured after rebasing onto `origin/develop` `1ac4e5a`, which carries SC-127)
- Final sha `1d98148` (dse branch `sc379-negotiation`), base `1ac4e5a`. 4 slice-1 commits (`82cd1d0`, `ea16960`, `73e2cc5`, `1d98148`); clean rebase, nothing pushed.
- Gates (logs `sc379-s1r-gate-*.log`): tsc clean; lint clean; jest 4292 passed / 1 skipped / 215 of 216 suites (base 4254, +38); lifecycle `19/19 ok, 0 failed`; shots 552 PNGs (544 + 8 new), 0 FAIL, host-copy pin OK, button host-leak OK (113 kinds, 678 comparisons), `SC-127 light island OK`, `print-twin delta OK (137 capture ids)`; parity 0 GAPs / 0 undeclared / 24 declared.
- Freeze: `FREEZE VIOLATED (6 checksum mismatches, 0 missing)`, all `negotiation*`: `negotiation--steel-{print,realprint}`, `negotiation-checked--steel-{print,realprint}`, `negotiation-pr-checked--steel-{print,realprint}`. The clean base `1ac4e5a` reads `freeze OK (262/262)` on this machine (`sc379-s1r-freeze-base.log`).
- Base-vs-branch byte comparison: the same 6 moved, 4 new ids' PNGs added (`negotiation-ended`, `negotiation-narrow`), nothing else moved.
- New: kit `track()`, `NegotiationData.ending/clampStanding/offerFor` (methods only), standing region, head crest, `data-ended` + end band, Complete disabled + over-hint + static roll when ended, 0..5 clamp, `fixture-ended.yaml`, `negotiation-narrow`.
- Drive-by fixes: none. Follow-ups: none open (the first-pass "freeze environment" note was wrong: SC-127's sanctioned print-twin rebaseline explains the 131 mismatches seen at the older base `8a256c5`; dropped. The 300px argument-tab wrap is folded into slice 2; the controlDensity D-2 retarget is accepted).

## What was built
- `src/framework/kit/track.ts` (+ barrel export, `kit-index.test.ts`): `track(parent, opts, owner)` per spec §1; attribute hooks `data-fill`, `data-current`, `data-edge="first|last"`; seam `--dse-track-fill`. Joined the shared `:focus-visible` ring list (the kit-index guard demands it).
- `NegotiationData`: `ending()`, `static clampStanding()`, plus `offerFor(n)` (a small third method for the band and the aria-labels). No fields; YAML unchanged.
- `PatienceInterestView` rewritten on two `track()` calls; `EndBandView.ts` new; `view.ts` has one `refreshStanding()` (data-ended, tracks, readouts, now-tag, band, argument ended-state) plus the crest in the head.
- `ArgumentView`: roll lives in `.dse-nt__roll-slot` under its own child Component and is rebuilt only on the ended transition (static while ended); Complete disabled with the over-hint in `.dse-nt__complete-hint`; `completeArgument` clamps and calls `refreshStanding()`. The chips, the immediate recompute, the chosen mark and the why-hints are untouched (slice 2).
- CSS: negotiation structure block rewritten (root hairlines + letter-spacing removed; container `dse-nt`; narrow `@container dse-nt (max-width: 420px)`), the D-2 steel block replaced by a Steel-scoped material block (sunken-over-surface layers, no rgba), kit `.dse-track*` base + Steel tiers beside `.dse-pr`. Sizes are role tokens only.
- Harness: `fixture-ended.yaml` registered as `ended`; `NARROW_SHOTS` `negotiation-narrow` (checked fixture, 300px).

## Deviations and choices worth a look
1. The vertical rail segments are on `.dse-track__slot::before` (row level), not `.dse-track__mark::before`. The mark's pseudo cannot know a wrapped row's height. Result is the same, the rail runs seal centre to seal centre and never overshoots, and the first/last rows stop at 50%.
2. Interest seals' aria-label is `Interest {n}: {offer}` rather than the default `Interest {n}`, so AT does not hear a bare number for a row that is an offer. Patience keeps the default.
3. The spec's clamp tests "Patience 0 + -1 tier", "Interest 5 + crit", "Interest 0 + pitfall" are unreachable through the UI: those standings are an ending and Complete is disabled. The tests instead cover `clampStanding` directly, a lie at Interest 1 (writes 0, not -1), a crit at Interest 4 (5) and a pitfall at Interest 1 (0), each asserting the written bytes are in range.
4. The footer keeps the class `dse-nt__argument-footer`; the hint span is inside it. Slice 2 may rename to `dse-nt__complete`.
5. `controlDensity.test.ts` D-2 block pinned the retired bubble ladder (3 tests). It was retargeted to the same contract on the seals (rail derived from `--dse-track-mark`, first/last edges, legacy rules gone).
6. `negotiation-narrow` is 300px but the sweep viewport is 900x1200, so it is truncated (as `montage-narrow` already is; owner ruling 1, SC-349). It pins the standing region and the top of the argument tab. The argument tab at 300px still looks cramped (slice 2 restyles it).

## Freeze
- At the clean base `1ac4e5a`: `freeze OK (262/262 …)`. On the branch: exactly 6 mismatches, all `negotiation*` (listed above). The first-pass run was against the older base `8a256c5`, which predates SC-127's sanctioned 131-line print-twin rebaseline, hence its 131 extra mismatches; superseded by this run.
- After-hashes of the 6 moved lines: `sc379-s1-moved-hashes.txt` (slice 2 changes them again; not a `rebaseline.txt`).

## Moved-lines table
| id | print | realprint |
|---|---|---|
| negotiation | moved | moved |
| negotiation-checked | moved | moved |
| negotiation-pr-checked | moved | moved |

## Tests (delta +38: 4254 -> 4292 passed)
- `test/dom/kit/track.test.ts` (new, 17): DOM/ARIA both orientations, descending order, edge hooks, fill seam, clamping, fill modes, setValue in place, roving tabindex, click, current-slot no-op, arrows/Home/End/wrap, DOM-order next, preventDefault, disabled = no listeners, style guard, owner unload.
- `negotiation.test.ts`: rewrote patience, interest, CSS contract, click persistence (x3), reset (x2), read-only, hygiene file list, end-to-end; new: keyboard (3), clamp (3), ended band x3 kinds + live + re-arm + live-complete + reset + read-only (8), YAML no-regression (3).
- `kit-index.test.ts`: barrel + focus-ring list; `controlDensity.test.ts`: D-2 retarget (3).

## Artifacts (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc379-negotiation/`)
PNG: `sc379-s1-negotiation-{dark,light}.png`, `sc379-s1-negotiation-{dark,light}-narrow.png`, `sc379-s1-ended-{dark,light}.png`, `sc379-s1-freeze-{negotiation,negotiation-checked,negotiation-pr-checked}-{before,after}.png` ("before" = print twin from the base `1ac4e5a` sweep; "after" = the branch's print twin).
Logs (rebased tip): `sc379-s1r-gate-{tsc,lint,jest,lifecycle,shots,freeze,parity}.log`, `sc379-s1r-freeze-base.log`, `sc379-s1r-shots-base.log`, `sc379-s1r-npmci.log`, `sc379-s1-moved-hashes.txt`. The older `sc379-s1-gate-*.log` are from the pre-rebase tip `046f340` (base `8a256c5`).

## Follow-ups
- Argument tab at 300px (checkbox column wrapping "Higher Authority" per letter): folded into slice 2 (ruled).
- `ElementView` read-only `status` role on the end band: announce-on-insert is not reliable across screen readers; harmless, left as is.
