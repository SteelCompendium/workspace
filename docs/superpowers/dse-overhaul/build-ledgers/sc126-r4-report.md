# SC-126 round 4 report — fix round for r3 review findings (HIGH-1/MEDIUM-1/LOW-1/LOW-2)

**Verdict: DONE.** dse commit `b5dd4c8` folds HIGH-1, MEDIUM-1, and LOW-1 into
`sc126-parity-bg` (base `96e2238`, on top of round-2b's `32670a7`); superproject commit
`58d9949` folds LOW-2. LOW-3 dropped per owner ruling; SC-321/SC-322 untouched. **HIGH-1
probe, before → after:** the reviewer's runtime probe (`.dse-section`'s wash deleted +
`excludes: [{rule:"bg-color", ...}]` on the `section` pair) used to make `npm run parity`
report `0 gap(s) … exit 0` over a live regression; it now dies at validation —
`selector-map.json is not a valid parity contract: … rule "bg-color" is class "material"
and can NEVER be excluded …`, exit 1 — quoted in full below. Both probe edits reverted;
`git diff` on `styles-source.css` is empty. Gates: tsc/lint clean; jest **3879 → 3887**
passed / 1 skipped / 202 of 203 suites (+8: 6 `excluding-is-error` cases, 1 excludes
runtime-probe can-fail test, 1 LOW-1 rounding-edge test); `npm run parity`
**0 gap(s) / 0 undeclared warning(s) / 16 declared deferral(s), exit 0**, unchanged
composition. **No CSS/fixture change; shots/freeze not re-run**, per the brief (not
required this round). Nothing pushed; no submodule pointer bump committed.

---

## 1. HIGH-1 — `excludes` obeyed no material-class gate

**Fix** (`visual-harness/parity/compare.cjs`, inside the `excludes` validation loop,
right after `seenX.add(rule)`): a `NON_DECLARABLE_RULES.includes(rule)` check that
rejects excluding any material rule, in the same voice as the existing declared-deferral
rejection:

```
pair "section": excludes "bg-color": rule "bg-color" is class "material" and can NEVER be
excluded (non-declarable: bg, bg-polarity, bg-color, shadow, hairline-top,
hairline-bottom). Fix the CSS, or move the rule to the sibling pair that measures it
honestly.
```

**Docs updated to match:** `selector-map.json`'s `ownsNote` (one added clause) and the
README's `excludes` contract section (`visual-harness/parity/README.md`) now both state
the class gate in prose.

**Tests added** (`test/unit/parity/compare.test.ts`):
- `test.each(['bg','bg-polarity','bg-color','shadow','hairline-top','hairline-bottom'])`
  `'excluding "%s" is a hard contract error (HIGH-1)'` — mirrors the existing declared-
  deferral `test.each`.
- `'excluding \`bg-color\` cannot hide the wash-vanished regression (HIGH-1 runtime
  probe)'` — reproduces the reviewer's exact scenario as a unit test: `validateMap`
  rejects a map that excludes `bg-color` (asserting `'can NEVER be excluded'`), and
  separately (on the honest, non-malicious map) `compare()` on the same real `section`
  inventories still reports `dark:GAP` / `light:GAP` — proving both that the exclude is
  rejected before `compare()` would ever run in the real pipeline (`diff.mjs` calls
  `validateMap` first and dies on any error) and that the regression it was hiding is
  real.

**Pre-existing test fixed:** `'excludes is the ONLY drop, and it must cite a FOLLOWUPS
number or ticket'` was itself excluding every material rule (`complement(['margin-top',
'margin-bottom'])` includes `bg`, `bg-polarity`, `bg-color`, `shadow`, `hairline-top`,
`hairline-bottom`) and asserted `validateMap(...) === []` for the valid case — which the
new gate would now correctly reject. Narrowed its `owns`/`excludes` split
(`kept = ['margin-top', 'margin-bottom', ...NON_DECLARABLE_RULES]`) so material rules
stay owned and only declarable rules are exercised through `excludes`, preserving the
test's original intent (the citation requirement) without asserting something now false.

**Runtime probe, reproduced exactly as the reviewer's** (temporarily deleted
`background: var(--dse-surface-sunken)` from `.dse-section` at `styles-source.css:8758`,
added `"owns": [...16 other rules], "excludes": [{"rule":"bg-color","why":"SC-126 --
r3 probe..."}]` to the `section` pair in `selector-map.json`, rebuilt, ran `npm run
parity` unpiped):

```
selector-map.json is not a valid parity contract:
  - pair "section": excludes "bg-color": rule "bg-color" is class "material" and can
    NEVER be excluded (non-declarable: bg, bg-polarity, bg-color, shadow, hairline-top,
    hairline-bottom). Fix the CSS, or move the rule to the sibling pair that measures it
    honestly.
```
`exit 1` (`sc126-r4-probe-excludes-20260917-231500.log`) — **before** the fix this same
scenario reported `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s), exit 0`
(the reviewer's own log, `sc126-r3-probe-excludes-20260917-r3.log`, cited in the r4
brief). Both probe edits reverted: `git checkout -- styles-source.css`, and the
`section` pair's `owns`/`excludes` addition removed from `selector-map.json` (the
`ownsNote` prose fix was kept). `git diff --stat` post-revert shows no `styles-source.css`
hunk and only the intended documentation/test/rule files.

## 2. MEDIUM-1 — stale "separately-scoped, larger work" comments

Both prescribed replacements applied verbatim in `compare.cjs`:
- Above `bgFamily` (was `:125`): now points at "rule 1c / `bgColorMiss` below (SC-126
  step 2)" and the README's renamed "Known limitation" heading.
- Above the `bg-polarity` block (was `:419`, now `:425` after HIGH-1's insertion): now
  reads "The full value comparison is rule 1c below."

No behavior change; comments only.

## 3. LOW-1 — GAP message printed a false comparison on the silent axis

**Fix:** each axis now computes and prints its own true comparator and a `FIRES` marker
only when it actually fired, at 3 decimals on both deltas (was `toFixed(1)` on deposit):

```
bg-color miss: site background-color=…, plugin=… (alpha Δ0.180 > 0.01 FIRES; deposit
Δ0.000 ≤ 2)
```

vs. the previous unconditional `(alpha Δ0.180 > 0.01, deposit Δ0.0 > 2 — either fires)`,
which claimed `deposit Δ0.0 > 2` on a row where deposit never fired.

**Tests updated:** the two existing `bg-color` message-text assertions now check the
axis-specific clause (`FIRES` on the firing axis, `≤` — not a false `>` — on the silent
one) instead of only the raw delta number. **Test added:** the reviewer's own rounding-
edge case, `rgb(20,20,20)` vs `rgb(22.01,22.01,22.01)` (deposit = 2.01, fires), asserts
the message prints `deposit Δ2.010 > 2 FIRES` and never the old rounded `Δ2.0 > 2`.

**Left alone (per the finding's own mitigating note and the brief's "otherwise leave
both and take this as INFO"):** rule 7 (`ink`, `compare.cjs:563`) still uses the old
`— either fires` shape. Not touched this round — see Follow-ups.

## 4. LOW-2 — SKILL.md's false "landed 2026-09-13" date

Verified via `git log origin/develop -- visual-harness/parity/compare.cjs`: step 1
(`bg-polarity`) landed **2026-08-25**, dse `1cef8ec` (`fix(parity): add bg-polarity check
for translucent-black/white wash mismatches (SC-126 step 1)`). Step 2 (`bg-color`) is
this branch, `sc126-parity-bg`, unmerged.

`.claude/skills/dse-verify/SKILL.md:733` corrected from *"SC-126 steps 1+2, landed
2026-09-13"* to *"SC-126 step 1 landed 2026-08-25 `1cef8ec`; step 2 is this branch,
`sc126-parity-bg`, unlanded as of this writing"* — now consistent with the "land-ready"
framing already used ~600 lines above (the brief's own `find`ing).

## Drive-by fixes

- `visual-harness/parity/README.md`'s "Known limitation" bullet heading also asserted
  *"(SC-126 steps 1+2, landed)"* — the same false-landing-status defect as LOW-2, in a
  file this round already touches (the `excludes` contract section, for HIGH-1).
  Corrected to *"(SC-126 step 1 landed; step 2 this branch, unlanded)"*. Doc-only, no
  design choice, no baseline moved.

## Follow-ups

- LOW-1's mitigating note suggests applying the same per-axis-verdict message shape to
  rule 7 (`ink`, `compare.cjs:563`, `— either fires`) for uniformity across the two
  multi-axis rules. Not done this round (out of the prescribed fix list; the brief says
  "otherwise leave both and take this as INFO"). Left for the owner to ticket if wanted.
- HIGH-1's finding notes the same un-gated-`excludes` hole applies to every other
  material rule (`bg`, `bg-polarity`, `shadow`, `hairline-top`, `hairline-bottom`), not
  just `bg-color` — the fix in this round closes it for all of them at once (the check is
  on `RULE_CLASS`, not rule-specific), so no further ticket is needed for that half. The
  brief separately flagged whether the finding itself belongs on a Backlog ticket
  ("parity `excludes` can drop a material rule — the class gate covers only
  `declaredDeferrals`") as the owner's call, not mine to file (workers never touch the
  tracker).

## Gate numbers

| Gate | Before this round (r2b land-ready state) | After (r4) |
|---|---|---|
| `npm run tsc` | clean, exit 0 | clean, exit 0 |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` | 3879 passed / 1 skipped / 202 of 203 suites | **3887** passed / 1 skipped / 202 of 203 suites (net **+8**) |
| `npm run parity` | 0 gap / 0 undeclared / 16 declared / exit 0 | 0 gap / 0 undeclared / 16 declared / exit 0 (unchanged) |
| `npm run shots` / `check-freeze.sh` | 524 PNGs, 0 FAIL / `260/260` | **not re-run** — no CSS/fixture change this round, per brief §"Deliverables" item 5 |

**Frozen bytes moved: 0** (no shots run this round; `styles-source.css` diff empty at
every checkpoint).

## Commits

- **dse** (`draw-steel-elements`, branch `sc126-parity-bg`): `b5dd4c8` — `fix(parity):
  SC-126 review fixes — excludes cannot drop a material rule; message + comment
  hygiene`. Files: `test/unit/parity/compare.test.ts`, `visual-harness/parity/README.md`,
  `visual-harness/parity/compare.cjs`, `visual-harness/parity/selector-map.json`.
- **Superproject** (worktree `sc126-parity-bg`): `58d9949` — `docs(dse-verify): SC-126
  LOW-2 — correct the false 'landed 2026-09-13' date`. File:
  `.claude/skills/dse-verify/SKILL.md` only. Submodule pointer bump left **uncommitted**
  (superproject `git status`: ` M draw-steel-elements`). **Not pushed.**

No attribution trailers in either commit message.

## Artifacts / log paths

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc126-parity-bg/sc126-r4-report.md`

This round's logs (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc126-parity-bg/`):
- `sc126-r4-probe-excludes-20260917-231500.log` (HIGH-1 runtime probe, quoted above; exit 1)
- `sc126-r4-tsc-20260917-231500.log` (clean, exit 0)
- `sc126-r4-lint-20260917-231500.log` (clean, exit 0)
- `sc126-r4-jest-20260917-231500.log` (3887 passed / 1 skipped / 202 of 203 suites, exit 0)
- `sc126-r4-parity-20260917-231500.log` (0 gap / 0 undeclared / 16 declared, exit 0)

Referenced from the r4 brief (the reviewer's own logs, not produced by me):
`sc126-r3-probe-excludes-20260917-r3.log`, `sc126-r3-probe-declare-20260917-r3.log`,
`sc126-r3-probe-ownsdrop-20260917-r3.log`, `sc126-r3-parity-canfail-20260917-r3.log`,
`sc126-r3-probe-tolerance-20260917-r3.log`, `sc126-r3-review.md`.
