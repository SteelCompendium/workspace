# SC-126 round 2 report (round 2b — resume, land-ready)

**Verdict: DONE.** dse commit `32670a7` implements owner decision D3 (the full `bg-color`
rule) exactly as specified in `sc126-r2-brief.md` §2 — verified item-by-item against the
uncommitted diff I inherited, no fixes needed. Superproject commit `d5a0adf` rewrites the
stale `dse-verify` SKILL.md paragraph and adds this round's battery numbers. Mid-round,
`origin/develop` moved (`e12c6bd` → `96e2238`, 6 unrelated SC-196 commits); I committed the
inherited work, rebased onto the new tip (one trivial `CHANGELOG.md` conflict — both sides'
bullets kept), and re-ran the full battery on the rebased tree. All gates green: tsc/lint
clean; jest 3879 passed / 1 skipped / 202 of 203 suites (net **+43** over the `e12c6bd`
baseline of 3836 — **+9** this round's `bg-color` tests, **+34** from the unrelated SC-196
rebase); shots 524 PNGs, 0 FAIL; freeze `260/260`, 0 mismatches; parity **0 GAPs / 0
undeclared / 16 DECLARED / exit 0**. **Frozen bytes moved: 0.** Live-hole proof (from the
inherited work, verified against the real `section` pair): reproduced `2 gap(s)` / exit 1,
quoted below. No submodule pointer bump committed; nothing pushed.

---

## 1. Diff review against the brief

Walked r2 brief §2 items 1–7 against the uncommitted diff before doing anything else:

1. **Rule slot/class** — `'bg-color'` inserted in `ALL_RULES` immediately after
   `'bg-polarity'`; `RULE_CLASS['bg-color'] = 'material'`. Comparison block (`1c`) slots
   directly after the `1b` block. Matches.
2. **Model** — `BG_ALPHA_TOL = 0.01`, `BG_DEPOSIT_TOL = 2` declared next to
   `BG_BLACK_MAX`/`BG_WHITE_MIN`; both sides parsed with `ink()`; `dA = round3(|Δalpha|)`;
   `dep = max` over R/G/B of premultiplied `|s.a·c_s − p.a·c_p|`; GAP on either axis;
   unparseable → WARN, never a crash. Derivation comment present in the `bgFamily`-comment
   style, citing the `styles-source.css` ladder for the alpha ceiling and `INK_RGB_TOL` for
   the deposit tolerance. Matches.
3. **`selector-map.json`** — `"bg-color"` added to `owns` on exactly `section-head`,
   `pr-head`, `featureblock`; NOT added to `section-tag`, `pr-chars`, `featureblock-wrap`;
   `ownsNote`/`declaredDeferralsNote` vocab updated; no declared deferral added for
   `bg-color` (0 rows fire on the real tree). Matches.
4. **Tests** — non-declarable arrays at the `NON_DECLARABLE_RULES` assertion and the
   `test.each` list both include `bg-color`. Can-fail: (a) same-family wrong alpha (Steel
   `.18` vs `:root` fallback `.2`, dA=0.020) — present; (b) tinted-vs-achromatic deposit
   miss — present; (c) wash-vanished using the real `section` values — present, and asserts
   `bg`/`bg-polarity`/etc. stay silent. Noise guards: zero-alpha opposite-hue, one-step
   alpha drift, byte-identical — all three present. Plus: declared-deferral rejection test,
   unparseable→WARN test, and the pre-existing `'selector-map.json passes every structural
   check'` test left untouched (still catches a missed `owns` entry). Matches.
5. **Live-hole proof** — done by the inherited work at `e12c6bd`; I additionally confirmed
   at `96e2238`/rebased that the underlying `styles-source.css` diff is 0 (see §3 below) and
   re-verified the can-fail tests are not vacuous (§2 below).
6. **No CSS/token/baseline change** — confirmed: `git diff` on `styles-source.css` is empty
   throughout; frozen bytes moved 0 (freeze `260/260` unchanged before/after).
7. **Out of scope (SC-321/SC-322)** — not touched; README and SKILL.md cite both by key as
   residuals, per spec.

`grep -rn "never compared" visual-harness/parity/ .claude/skills/dse-verify/SKILL.md` →
the only remaining hit is an unrelated `border-radius` sentence in the README
("`border-radius` is captured but never compared at all") — `background-color` is no
longer described that way anywhere. No fixes were needed against the brief; the inherited
diff was already correct and complete.

## 2. `test/unit/parity` run + can-fail proof

`npx jest test/unit/parity` (unpiped): **75 passed, 75 total, exit 0**
(`sc126-r2b-jest-parity-unit-20260917-221016.log`).

To confirm the new can-fail tests are load-bearing, not vacuous, I temporarily widened
`BG_ALPHA_TOL` from `0.01` to `0.5` in `compare.cjs` and re-ran the same suite: **2 failed,
73 passed, exit 1** (`sc126-r2b-canfail-break-20260917-221016.log`) — the "same-family
wrong alpha" test and the "wash vanished" live-hole test both failed, exactly the two cases
that tolerance change should break. Reverted with `git checkout -- visual-harness/parity/
compare.cjs`; `git status`/`git diff --stat` confirmed byte-clean before proceeding.

## 3. Rebase onto `origin/develop`, freeze check, final parity

`git fetch origin` showed `origin/develop` had moved `e12c6bd` → `96e2238` (6 commits, all
SC-196 — light-scheme state colors + hover tooltips, unrelated to this ticket; touches
`CHANGELOG.md`, `styles-source.css`, several `src/` files, and adds/extends several test
files). Per the r2 brief's rebase instruction: committed the inherited uncommitted work as
the final `feat(parity)` commit, then `git rebase origin/develop`. One conflict,
`CHANGELOG.md` (both sides inserted a bullet at the same spot) — resolved by keeping both
bullets (SC-196's first, since it landed on `develop` first, then this round's SC-126
bullet). No other files conflicted; `styles-source.css` had zero local changes to conflict.
Rebase completed clean; `git status` empty on the dse repo afterward.

Because the rebase pulled in unrelated commits, I re-ran the full battery rather than trust
the inherited (pre-rebase) numbers:

| Gate | `e12c6bd` baseline (measured by the previous worker) | This round, post-rebase to `96e2238` |
|---|---|---|
| `npm run tsc` | clean, exit 0 | clean, exit 0 |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` | 3836 passed / 1 skipped / 201 of 202 suites | **3879** passed / 1 skipped / **202 of 203 suites** (net **+43**: +9 this round's `bg-color` tests, +34 from the SC-196 rebase) |
| `npm run shots` | 524 PNGs, 0 FAIL | 524 PNGs, 0 FAIL (unchanged) |
| `check-freeze.sh` | `freeze OK (260/260 …)`, exit 0 | `freeze OK (260/260 …)`, exit 0 (unchanged — **not run by the previous worker**, run here) |
| `npm run parity` | 0 GAPs / 0 undeclared / 16 DECLARED / exit 0 | 0 GAPs / 0 undeclared / 16 DECLARED / exit 0 (unchanged composition) |

(Note: the r2 brief's stated baseline of "474 PNGs / 3257 jest / 185 suites" was stale per
the r2b brief; the real `e12c6bd` baseline the previous worker measured was 524 PNGs / 3836
jest / 201 of 202 suites, which is what the table above uses.)

**Frozen bytes moved: 0** at every measurement point.

**Live-hole proof** (from the inherited pre-rebase work; the underlying `styles-source.css`
change was never committed and the tree is confirmed clean of it now). Temporarily deleting
`background: var(--dse-surface-sunken)` from `.dse-section`, rebuilding, and running
`npm run parity` unpiped produced exactly:

```
- **GAP** `section` [dark] (.sc-ability__section → .dse-section): bg-color miss: site background-color=rgba(0, 0, 0, 0.18), plugin=rgba(0, 0, 0, 0) (alpha Δ0.180 > 0.01, deposit Δ0.0 > 2 — either fires)
- **GAP** `section` [light] (.sc-ability__section → .dse-section): bg-color miss: site background-color=rgba(0, 0, 0, 0.02), plugin=rgba(0, 0, 0, 0) (alpha Δ0.020 > 0.01, deposit Δ0.0 > 2 — either fires)
```

`**2 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, exit 1. Reverted;
`git diff` on `styles-source.css` was empty; re-run restored
`**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, exit 0
(`sc126-r2-parity-livehole-20260913-r2-hole.log`, `sc126-r2-parity-restored-20260913-r2-restored.log`
— both from the inherited work).

Final unpiped `npm run parity` on the rebased, committed tree (this round):
**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**, exit 0
(`sc126-r2b-parity-final-20260917-221016.log`).

## 4. Commits

- **dse** (`draw-steel-elements`, branch `sc126-parity-bg`, on top of `origin/develop`
  `96e2238`): `32670a7` — `feat(parity): compare background-color values with a
  premultiplied tolerance model (SC-126 step 2)`. Files: `CHANGELOG.md`,
  `test/unit/parity/compare.test.ts`, `visual-harness/parity/README.md`,
  `visual-harness/parity/compare.cjs`, `visual-harness/parity/selector-map.json`.
- **Superproject** (worktree `sc126-parity-bg`): `d5a0adf` — `docs(dse-verify): SC-126
  steps 1+2 — background-color is polarity- and value-compared`. File:
  `.claude/skills/dse-verify/SKILL.md` only (rewrote the stale "Known limitation (SC-117
  fix wave M4)" paragraph and its declarability table row, and updated the "Battery
  numbers at SC-126 step 2" paragraph to the post-rebase figures above). The submodule
  pointer bump (`draw-steel-elements` now at `32670a7`) is deliberately **left
  uncommitted** in the superproject, per instructions. **Not pushed.**

No attribution trailers in either commit message.

## Drive-by fixes

None. The inherited diff already matched the brief in full; no defects found to fix in
passing.

## Follow-ups

None new. SC-321 (`card` pair capture-order hazard) and SC-322 (`background-image`
gradient hue/tint) remain exactly as already ticketed and out of scope — named by key in
the rewritten README/SKILL.md limitation paragraphs, not touched.

## Artifacts / log paths

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc126-parity-bg/sc126-r2-report.md`

This round's logs (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc126-parity-bg/`):
- `sc126-r2b-tsc-20260917-221016.log` (clean, exit 0)
- `sc126-r2b-lint-20260917-221016.log` (clean, exit 0)
- `sc126-r2b-jest-20260917-221016.log` (3879 passed / 1 skipped / 202 of 203 suites, exit 0)
- `sc126-r2b-shots-20260917-221016.log` (524 PNGs, 0 FAIL, exit 0)
- `sc126-r2b-freeze-20260917-221016.log` (`freeze OK (260/260 …)`, exit 0)
- `sc126-r2b-parity-20260917-221016.log` / `sc126-r2b-parity-final-20260917-221016.log`
  (0 gap / 0 undeclared / 16 declared, exit 0)
- `sc126-r2b-jest-parity-unit-20260917-221016.log` (75/75, exit 0)
- `sc126-r2b-canfail-break-20260917-221016.log` (2 failed / 73 passed, exit 1 — can-fail
  proof; `compare.cjs` reverted immediately after)

Inherited logs from the previous (uncommitted-work) worker, still under the same
directory, referenced above: `sc126-r2-tsc-baseline-20260913-r2.log`,
`sc126-r2-lint-baseline-20260913-r2.log`, `sc126-r2-jest-baseline-20260913-r2.log`,
`sc126-r2-jest-after-20260913-r2-after.log`, `sc126-r2-shots-baseline-20260913-r2.log`,
`sc126-r2-shots-after-20260913-r2-after.log`, `sc126-r2-freeze-baseline-20260913-r2.log`
(freeze run BEFORE the edits only — the previous worker did not run freeze after; this
round's `sc126-r2b-freeze-20260917-221016.log` is the first freeze check after the edits),
`sc126-r2-parity-baseline-20260913-r2.log`, `sc126-r2-parity-livehole-20260913-r2-hole.log`,
`sc126-r2-parity-restored-20260913-r2-restored.log`.
