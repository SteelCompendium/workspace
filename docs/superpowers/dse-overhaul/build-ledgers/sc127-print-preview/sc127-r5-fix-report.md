# SC-127 round 5 — fix round for the round-4 review findings

**Executive summary (supersedes the numbers below — see §10 Round 5b for the FINAL,
landing-ready state).** All 6 round-4 findings (2 Medium, 4 Low) fixed and verified.
**Final dse sha `b936efa`** on branch `sc127-print-preview`, rebased twice — first onto
`origin/develop` `f6fb208` (round 5, below), then onto `origin/develop` `c524fd2` (round
5b, §10, which folds in SC-328's sanctioned rebaseline of the 8 `skills`-family lines
this report's §3 originally flagged as unexplained). **Final superproject sha `b770e37`**.
Full battery green at the FINAL tip: tsc/lint clean; jest **4001 passed / 1 skipped / 205
of 206 suites** (base `c524fd2`: 3983/1/205-of-206 — net +18, unchanged: r3's own +10, r5's
own +8); shots **524, 0 FAIL**, deterministic across 2 clean sweeps; freeze **exactly 130
`*--steel-print.png` FAILED, 0 `*--steel-realprint.png` FAILED, 0 missing** (§10 — the
round-5 numbers below, with 8 extra realprint mismatches, are SUPERSEDED: those were
SC-328's own sanctioned rebaseline showing through against my round-5 base, not a defect);
parity **0/0/16, exit 0**. `sc127-rebaseline.txt` (130 lines, print only) is the FINAL,
round-5b version, deterministic across 2 clean sweeps at `c524fd2`. All 6 findings
can-fail proven; the census itself caught two further, previously-unknown gaps live while
it was being built (`--link-color-hover` chain, `--hr-color`), both fixed. One
self-introduced bug caught and fixed before commit: a CSS comment briefly quoting
`a:hover { color: ... }` verbatim truncated a `[^}]*`
extractor via its own `}`.

## 1. Findings fixed

- **MEDIUM-1** (hover/focus form fields go charcoal, ~1.3:1): added
  `--background-modifier-border-hover`, `--background-modifier-border-focus`,
  `--background-modifier-form-field-hover` to the host block.
- **MEDIUM-1's guard half / LOW-4** (owner's ruling): guard (b) widened from the 18
  hand-picked palette literals into a census — `assertSc127HostPaletteCensus`
  (`visual-harness/shoot.mjs`) — over every host `--*` custom property a rule (either the
  pinned Obsidian sheet or this plugin's own) actually consumes via `var(...)`, where that
  rule's selector reaches a node inside a `[data-dse-print="on"]` root on the real
  gallery; state pseudo-classes (`:hover`/`:focus`/`:focus-visible`/`:focus-within`/
  `:active`) are stripped before the match test. `assertSc127HostBlockPinned` (the
  18-literal pin) stays — most of those 18 are read only by the MAPPING declarations the
  census finds, not directly by a consuming rule, so the two guards check different
  halves of the same block. Prints `SC-127 host palette census OK (164 consumed tokens ×
  dark preview == theme-light)`.
- **MEDIUM-2** (self-test re-implements instead of calling the real exemption): moved the
  decision into one function, `paperExemptionExcuses(p, a, b)`, called by both
  `assertPrintTwinDelta`'s loop and `selfTestPrintPaperExemption`.
- **LOW-1** (`<th>` header borders stay dark, gate blind to border colour): added
  `--table-header-border-color`; `PRINT_DELTA_STYLE_PROPS` now samples the four
  `border*Color` longhands, excused only OUTSIDE an element root (mirroring the `color`
  exemption exactly — currentColor lockstep noise, same reasoning, same scope).
- **LOW-2** (caret/scrollbar stay dark-theme): added `--caret-color` (custom property AND
  the real property, since `caret-color`/`scrollbar-color` are inherited from `body` and
  nothing on the root would otherwise re-trigger that inheritance) and
  `--scrollbar-thumb-bg` / `--scrollbar-active-thumb-bg` plus a `scrollbar-color`
  restatement.
- **LOW-3** (stale comment): replaced the "nothing checks them… yet" parenthetical with a
  pointer to both guards.

**Two further gaps found live, past what round 4 named**, both from the SAME root cause
(a custom property's `var()` reference is substituted using the DECLARING element's own
environment, not the consuming element's — proven with a standalone probe, see §4.1 —
so restating only one link of a mapping chain is not enough if another link in the same
chain is still only inherited from `body`):
- `--text-accent-hover` / `--link-color-hover` / `--link-external-color-hover` (link hover
  colour stayed dark) — caught by the new census on the first full sweep.
- `--hr-color` (markdown `<hr>` border, `treasure-hr`) — the census's gallery walk does
  NOT render any `<hr>` at all (`document.querySelectorAll('hr')` on the real gallery page
  returns 0 elements, measured), so this one was invisible to the census by construction
  and was instead caught by LOW-1's own new border-colour sampling in the (separate,
  older) print-twin-delta gate — a real instance of the two guards' defense in depth
  working as intended. See §5 Follow-ups for the census's "on the gallery" scope limit.

**Self-introduced bug, caught before commit:** a comment drafted while fixing the
`--link-color-hover` chain briefly quoted `` `a:hover { color: var(--link-color-hover) }` ``
verbatim — the `}` inside a CSS `/* comment */` silently truncated
`extractSc127HostBlockBody`'s `[^}]*` regex (the exact footgun `theme-print.test.ts`'s own
header already documents), feeding a cut-short rule body into
`assertSc127HostBlockPinned`'s synthetic probe. Caught via a throwaway diagnostic script,
not the gate itself (the gate's own 18 literals all sit before the truncation point, so it
stayed accidentally green) — reworded to avoid literal braces; no other comment in the
diff contains one (checked).

## 2. Battery (full, in order) — measured numbers

| Gate | Result |
|---|---|
| `npm run tsc` | clean (`sc127-r5-tsc.log`) |
| `npm run lint` | clean, exit 0 (`sc127-r5-lint.log`) |
| `npx jest` (`rm -f main.js styles.css` first) | **3955 passed / 1 skipped / 202 of 203 suites / 3 snapshots**, exit 0 (`sc127-r5-jest-full.log`) |
| `npm run shots` | **524, 0 FAIL**, every in-run gate OK incl. `SC-127 host palette census OK (164 …)` and `print-twin delta OK (130 …)`, both clean sweeps (`sc127-r5-full-4.log` = sweep A, `sc127-r5-sweepB.log` = sweep B) |
| `check-freeze.sh` | **`FREEZE VIOLATED (138 checksum mismatches, 0 missing)` — 130 `*--steel-print.png` (SC-127's own, expected) + 8 `*--steel-realprint.png` (pre-existing, NOT SC-127 — see §3)** (`sc127-r5-freeze-1.log`, `sc127-r5-freeze-2.log`, both sweeps identical) |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0** (`sc127-r5-parity.log`) |

**Base-vs-branch jest**, rebase moved `0c132d8` → `f6fb208` (SC-240/241): base `f6fb208`
measures **3937 passed / 1 skipped / 202 of 203 suites** (`sc127-r5-jest-base-f6fb208.log`,
measured with `git checkout f6fb208 -- .` then restored with `git checkout HEAD -- .` —
verified `git status`/`git log` clean before and after). This branch's own total, 3955, is
**+18** over that base: **+10** are r3's own (already landed, unchanged this round), **+8**
are r5's own (`git diff af32490..HEAD -- test/unit/build/printTwinDeltaAllowedSet.test.ts`
adds exactly 8 `it(...)`). `theme-print.test.ts` was not touched in r5.

## 3. Round-5 finding, SUPERSEDED by round 5b — read §10 first

**Superseded, 2026-09-25 (round 5b):** the 8 `*--steel-realprint.png` mismatches below are
**not** an unexplained `develop`-drift regression. They are **SC-328's own sanctioned
freeze rebaseline** (backup `freeze-baseline.sha256.pre-sc328-bak`, applied the morning of
2026-09-25), landed on `origin/develop` at `c524fd2` — after my round-5 base `f6fb208` but
before my round-5b rebase. Confirmed directly: `diff` of `freeze-baseline.sha256.pre-sc328-bak`
against the live `freeze-baseline.sha256` shows exactly these 16 lines (8 pairs) changed,
nothing else. Once I rebased onto `c524fd2` (§10), the freeze check against my own shots
came back **exactly 130 twin FAILED / 0 realprint FAILED / 0 missing** — the correct,
final number. The investigation below (bare-`f6fb208` proof that SC-127 itself moved 0
realprint bytes) is kept for the record since it is still true and still useful evidence,
but it is no longer an open question — do not file or investigate it further.

## 3 (original, round 5). 8 `skills`-family realprint/print pairs moved on `develop`,
   unrelated to SC-127 — historical, see the supersession note directly above

`check-freeze.sh` against my branch's shots reports 138 mismatches, not 130. The extra 8
are `*--steel-realprint.png`: `chrome-skills-menu`, `skills`, `skills-chips`,
`skills-chips-narrow`, `skills-hero-picks`, `skills-ledger`, `skills-ledger-narrow`,
`skills-narrow`. Real print (`@media print`) is never touched by anything in SC-127's
`.theme-dark`-scoped host block, so this should not exist — and it doesn't, from SC-127.
**Proof it predates SC-127 entirely:** checked out `f6fb208` bare
(`git checkout f6fb208 -- .`, i.e. zero SC-127 changes applied — the r3/r5 fix does not
exist in this tree), ran a full clean `npm run shots` (`sc127-r5-base-f6fb208-shots.log`,
524 shots, 0 FAIL), and `check-freeze.sh` against THAT already reports the SAME 16-line
mismatch (8 print + 8 realprint pairs, `sc127-r5-freeze-base-f6fb208.log`) — identical to
the frozen baseline's own accounting for these files, i.e. this drift already exists on
`origin/develop` before my branch touches anything. Separately, `diff` of this bare-base
sweep's 130 realprint hashes against my branch's own realprint hashes (both sweeps) is
**empty** (`sc127-r5-base-f6fb208-realprint.sha256` vs `sc127-r5-sweep1-realprint.sha256`) —
proving SC-127 itself moved **0** realprint bytes, which is the actual claim this ticket
needs to stand behind. The r4 review's own I-4 note anticipated the rebase might move
*initiative* captures (`SC-240`/`SC-241` touch `src/elements/initiative/{view,resolveRefs}.ts`);
it did not anticipate `skills`, which likely shares `resolveRefs.ts`'s reference-resolution
path — not investigated further, out of this ticket's scope. **This is a separate,
pre-existing `develop`-branch issue for the owner/dispatcher to route (its own tiny
rebaseline or a Backlog ticket), not something to fold into SC-127's sanction ask.**

## 4. Can-fail proofs (per finding, all restored and re-verified clean afterward)

1. **The underlying mechanism, proven with a standalone probe** (not part of the shipped
   diff, `visual-harness/sc127-scratch-probe2.mjs`, deleted after use): a descendant
   redeclaring `--base: 2` never reaches an ancestor's `--foo: calc(var(--base) * 10)` —
   `getComputedStyle` on BOTH the ancestor and the descendant reports `calc(1 * 10)`,
   confirming var() substitution happens at the DECLARING element, not the consumer. This
   is why restating only `--text-accent-hover` (a dependency) did not fix
   `--link-color-hover` (the thing actually consumed) until `--link-color-hover` itself was
   also restated on the root.
2. **MEDIUM-1 / census — found live, not synthetically.** Sweep 1 (`sc127-r5-full-1.log`)
   failed with `SC-127 HOST PALETTE CENSUS DRIFTED — 1 of 163 …: --link-color-hover`; fixed
   (added the dependency `--text-accent-hover`), re-swept (`sc127-r5-full-2.log`) — SAME
   drift, because `--link-color-hover` itself was still unrestated (see #1); fixed (added
   `--link-color-hover`/`--link-external-color-hover` directly) after also fixing the
   `}`-in-comment truncation bug that was masking the fix in a standalone probe; re-swept
   (`sc127-r5-full-3.log`) — census now `OK (164 …)`, but `PRINT-TWIN DELTA VIOLATED` on
   `treasure-hr`'s `<hr>` border (`--hr-color`, a DIFFERENT gap); fixed; re-swept
   (`sc127-r5-full-4.log`) — fully clean, `524, 0 FAIL`, census OK, print-twin delta OK.
3. **MEDIUM-2 — the reviewer's own proof, re-run.** Dropped the white-check clause from
   `paperExemptionExcuses` (same mutation the r4 review made against the OLD, unshared
   condition) and ran `npm run shots -- --element=hero`
   (`sc127-r5-canfail-med2.log`): `PRINT-TWIN PAPER-EXEMPTION SELF-TEST FAILED —
   root-non-white-background WRONGLY EXCUSED …`, exit 1 — where r4 found this stayed green.
   Restored; `git diff --stat` matched exactly before/after.
4. **LOW-1 — caught for real by the new border-colour sampling**, `treasure-hr#21 <hr>`,
   4 problems (`borderTop/Right/Bottom/LeftColor`), before the `--hr-color` fix
   (`sc127-r5-full-3.log`); 0 residual on 2 full sweeps after.
5. **LOW-2 — dedicated proof.** Removed `caret-color: var(--caret-color);` from the host
   block, rebuilt, probed the dark-preview root's `caret-color` directly
   (`visual-harness/sc127-scratch-low2canfail.mjs`, deleted after use): reverted to
   `rgb(218, 218, 218)` (the pale dark-theme value). Restored; reprobed:
   `rgb(34, 34, 34)`, matching a light-vault probe of the same property exactly
   (`visual-harness/sc127-scratch-low2check{,2}.mjs`, deleted after use).
6. **LOW-3 / the extractor bug — caught in the act**, not by a deliberate mutation: a
   throwaway `visual-harness/sc127-scratch-quickcheck.mjs` (deleted after use) reading
   `extractSc127HostBlockBody`'s own regex showed the rule body silently cut off at 3284
   characters, right before the `--link-color-hover` block — diagnosed the `}` inside the
   comment, fixed, reran the same script: full body, all tokens present.
7. **All 13 new jest assertions** (8 new + the 5 already covered by r3, re-verified) pass
   against the final tree (`sc127-r5-jest-finalcheck.log`, 42/42 across both files).

## 5. Follow-ups

1. ~~The 8-pair `skills`-family realprint/print drift…~~ **RESOLVED, no action needed** —
   this was SC-328's own already-sanctioned rebaseline, landed on `develop` between my
   round-5 base and round-5b's rebase. See §3's supersession note and §10.
2. **The census is scoped to "the gallery," per the owner's own ruling wording, and that
   has a real coverage gap**: gallery mode renders 0 `<hr>` elements (measured,
   `document.querySelectorAll('hr')` → empty on the real gallery page), so no `<hr>`-only
   token (like `--hr-color`) can ever enter the census's consumed set, regardless of
   whether it's actually dark. This round's `--hr-color` gap was caught only because
   LOW-1 also widened the older, unrelated print-twin-delta gate's own property list in
   the same round — a coincidence of timing, not a structural guarantee. A more complete
   (but more expensive) census would run per-fixture rather than only against the gallery,
   or drive the full 130-id sweep's own DOM instead. Left as-is, matching the ruling's
   literal scope; worth a note for whoever next touches this guard.
3. **Round-3's carried-forward follow-ups** (the declined hover-rule print-guard on
   `.dse-feature__nested > .dse-feature:hover`; host-palette duplication under a custom,
   non-default dark theme; SC-348 role-chip contrast) are unchanged by this round — see
   the r3 report §3 for detail, still accurate.

## 6. Rebaseline deliverable

**Superseded by round 5b (§10)** — the file at the path below is now the round-5b
regeneration (at `c524fd2`/`b936efa`), not the round-5 one this section originally
described; the process and guarantees (deterministic, correct filename order) are
identical, only the base commit and byte content changed.

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-rebaseline.txt`
  — 130 `<sha256>  <filename>` lines, `*--steel-print.png` only, filename order identical
  to the frozen baseline's own print-line order (verified, `diff` empty).
- **Deterministic across 2 clean sweeps**: sweep A `sc127-r5-full-4.log` (shots dir was
  `rm -rf`'d immediately before it started — this run doubles as the first clean sweep,
  per the coordinating check-in's suggestion), sweep B `sc127-r5-sweepB.log` (shots dir
  `rm -rf`'d again first). `diff` of the two sweeps' 130-line print hash lists is empty,
  and of the two sweeps' 130-line realprint hash lists is also empty.
  (`sc127-r5-sweep1-{print,realprint}.sha256` vs `sc127-r5-sweepB-{print,realprint}.sha256`).
- **All 130 realprint hashes proven unchanged by SC-127** (§3) — NOT the same claim as
  "matches the old frozen baseline" (8 of them don't, for the unrelated `develop`-drift
  reason above); the claim that matters for THIS ticket — 0 realprint bytes moved by the
  SC-127 fix itself — is proven directly against a bare, no-SC-127 checkout of the same
  base commit.

## 7. After-crops (sanction ask)

Copied the real `visual-harness/shots/<id>--steel-print.png` at the final commit
(`c5e645d`) plus a top-1300px crop of each, for the same five fixtures as round 3:

- `sc127-r5-after-statblock-charline-two-dark-twin.png` / `-top.png`
- `sc127-r5-after-feature-dark-twin.png` / `-top.png`
- `sc127-r5-after-initiative-dark-twin.png` / `-top.png`
- `sc127-r5-after-negotiation-dark-twin.png` / `-top.png`
- `sc127-r5-after-hero-dark-twin.png` / `-top.png`

Round-3 befores/afters remain at `.../sc127/r2/sc127-r2-before-*` and
`.../sc127/sc127-r3-after-*` for comparison; visually these r5 crops are byte-identical in
overall composition to the r3 ones except for the specific fixed regions (hover states
aren't captured by a static `--steel-print` shot, so the visible delta from r3→r5 is
minimal by construction — the fixes were mostly about interaction states and the
`<hr>`/`<th>` border, not the resting-state appearance already fixed in r3).

## 8. Commits

**Historical (round 5, before the round-5b rebase onto `c524fd2` renumbered these two —
see §10 for the FINAL shas `1090af0`/`b936efa`):**

dse clone (`/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`,
branch `sc127-print-preview`, rebased onto `origin/develop` `f6fb208`):

1. `76ebe68` — `fix(print): SC-127 r5 — fold the round-4 review findings into the host block` (styles-source.css, +68/-6)
2. `c5e645d` — `test(print): SC-127 r5 — census-based host-token guard, shared paper-exemption predicate, border-colour sampling` (shoot.mjs + printTwinDeltaAllowedSet.test.ts, +307/-36)

(r3's four commits — `3c091a0`, `747ccd7`, `c3062cc`, `af32490` — are unchanged, just
carried forward by the rebase onto `f6fb208`.)

Superproject (`/home/scott/code/steelCompendium/worktrees/sc127-print-preview`):

3. `4f0df2b` — `chore: bump draw-steel-elements to c5e645d (SC-127 r5 review-fix round)`

No co-author or AI-attribution trailers in any commit message.

## 9. Artifact paths (all absolute, directory
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/`)

- Report (this file): `sc127-r5-fix-report.md`
- Rebaseline: `sc127-rebaseline.txt`
- Rebaseline sweep logs: `sc127-r5-full-4.log` (sweep A), `sc127-r5-sweepB.log` (sweep B)
- Rebaseline sweep hash sets: `sc127-r5-sweep1-{print,realprint}.sha256`,
  `sc127-r5-sweepB-{print,realprint}.sha256`
- Base-drift proof: `sc127-r5-base-f6fb208-shots.log`,
  `sc127-r5-base-f6fb208-realprint.sha256`, `sc127-r5-freeze-base-f6fb208.log`
- After-crops: `sc127-r5-after-{statblock-charline-two,feature,initiative,negotiation,hero}-dark-twin{,-top}.png`
- Battery logs: `sc127-r5-{tsc,lint,jest-full,jest-base-f6fb208,jest-finalcheck,freeze-1,freeze-2,parity}.log`
- Progressive full-sweep logs (the census/gap-finding sequence): `sc127-r5-full-{1,2,3,4}.log`
- Can-fail logs: `sc127-r5-canfail-med2.log`
- dse commits: `76ebe68`, `c5e645d` (on top of the r3 commits) on branch
  `sc127-print-preview` in `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`
- Superproject commit: `4f0df2b` on branch `sc127-print-preview` in
  `/home/scott/code/steelCompendium/worktrees/sc127-print-preview`

## 10. Round 5b — rebase onto `origin/develop` `c524fd2`, final landing-ready state

Between round 5's base (`f6fb208`) and this rebase, 40 commits landed on `origin/develop`,
including **SC-328** (JSZip → fflate, `package.json`/`package-lock.json` changed) and its
own **sanctioned freeze rebaseline** of the exact 16 lines (8 `skills`-family twin+realprint
pairs) round 5's §3 flagged as an unexplained, pre-existing drift — see §3's supersession
note. This section is the FINAL state; §1-§9 above (round 5 proper) are unchanged and still
accurate for the findings/fixes themselves, only the base/shas/freeze-count numbers moved.

**Rebase.** `git fetch origin && git rebase origin/develop` in the dse clone: **clean, 0
conflicts** (`sc127-r5b-rebase.log`), landing on `c524fd2`. `package.json` changed (2 lines:
`+"obsidian-lifecycle"` script, `fflate` replacing `jszip`/`jszip-utils`) → ran `npm ci`
(`sc127-r5b-npmci.log`), clean.

**Battery, final tip `b936efa`:**

| Gate | Result |
|---|---|
| `npm run tsc` | clean (`sc127-r5b-tsc.log`) |
| `npm run lint` | clean, exit 0 (`sc127-r5b-lint.log`) |
| `npx jest` | **4001 passed / 1 skipped / 205 of 206 suites / 3 snapshots**, exit 0 (`sc127-r5b-jest-full.log`) |
| `npm run shots` | **524, 0 FAIL**, census OK (164), print-twin delta OK (130), both clean sweeps (`sc127-r5b-sweepA.log`, `sc127-r5b-sweepB.log`) |
| `check-freeze.sh` | **`FREEZE VIOLATED (130 checksum mismatches, 0 missing)` — all 130 `*--steel-print.png`, ZERO `*--steel-realprint.png`** (`sc127-r5b-freeze-A.log`, `sc127-r5b-freeze-B.log`, both sweeps identical) — the correct, final number |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0** (`sc127-r5b-parity.log`) |

**Base-vs-branch jest.** Base `c524fd2` alone (`git checkout c524fd2 -- .` + `npm ci`,
restored after with `git checkout HEAD -- .` + `npm ci`; `git status`/`git log` verified
clean before and after both times): **3983 passed / 1 skipped / 205 of 206 suites**
(`sc127-r5b-jest-base-c524fd2.log`). This branch's 4001 is **+18** over that — the same +18
as round 5 (r3's own +10, r5's own +8), confirming the rebase moved no test count on its
own; SC-328 added its own new tests, already counted in both the base and branch totals.

**Rebaseline, regenerated at the final tip.** Two clean sweeps
(`rm -rf visual-harness/shots/*` between them): sweep A `sc127-r5b-sweepA.log` (hashed
immediately — `sc127-r5b-sweepA-{print,realprint}.sha256`), sweep B `sc127-r5b-sweepB.log`
(`sc127-r5b-sweepB-{print,realprint}.sha256`). `diff` of both sweeps' 130-line print hash
lists is empty, and of both sweeps' 130-line realprint hash lists is also empty —
deterministic. `sc127-rebaseline.txt` (the shared deliverable, overwritten) is sweep B's
130-line print hash list, filename order verified identical to the live
`freeze-baseline.sha256`'s own print-line order.

**After-crops**, same 5 fixtures as before, at the final commit `b936efa`:
`sc127-r5b-after-{statblock-charline-two,feature,initiative,negotiation,hero}-dark-twin{,-top}.png`.

**Superproject.** The worktree superproject branch (`/home/scott/code/steelCompendium/worktrees/sc127-print-preview`)
had never been pushed anywhere (confirmed: `git ls-remote origin refs/heads/sc127-print-preview`
empty) and its only 2 commits were both pure `draw-steel-elements`/`CHANGELOG.md`/SKILL.md
pointer-bump commits, now far behind `origin/main` (which had moved 66 commits, several
also bumping the `draw-steel-elements` gitlink — a REBASE of those 2 old commits would
conflict on the gitlink at every step). Instead: `git reset --hard origin/main` (safe, purely
local branch), then reapplied the exact same two edits (the CHANGELOG.md bullet, the
SKILL.md "Superseded 2026-09-23, SC-127" sentence) at their same anchor text, which was
unchanged on the new `origin/main` tip — verified before reapplying. SC-328's own SKILL.md
record (already on `origin/main`, untouched by my edits) confirmed present after. Committed
`draw-steel-elements` → `b936efa` + both doc edits as one commit: `b770e37`. Three other
submodules (`steel-etl`, `steelCompendium.github.io`, `v2`) show as locally modified in this
worktree — that is this worktree's own stale submodule checkouts vs. `origin/main`'s newer
pins for submodules SC-127 never touches, not something staged or committed here.

## Return contract

- **dse sha:** `b936efa` (branch `sc127-print-preview`, rebased onto `origin/develop` `c524fd2`)
- **superproject sha:** `b770e37` (branch `sc127-print-preview`, reset onto `origin/main` `9255a30` + 1 commit)
- **Base shas:** `f6fb208` (round 5) superseded by `c524fd2` (round 5b, final) — jest base at
  `c524fd2`: 3983 passed / 1 skipped / 205 of 206 suites
- **Battery (final, round 5b):** tsc clean; lint clean exit 0; jest 4001 passed / 1 skipped
  / 205 of 206 suites / 3 snapshots, exit 0; shots 524 / 0 FAIL exit 0 (2 clean sweeps,
  deterministic); parity 0 GAPs / 0 undeclared / 16 DECLARED, exit 0
- **Freeze counts (final):** twin (`*--steel-print.png`) **130 FAILED** (SC-127's own,
  expected/sanction-pending); realprint (`*--steel-realprint.png`) **0 FAILED**, 0 missing
- **Rebaseline:** `sc127-rebaseline.txt`, 130 lines, regenerated at the final tip,
  deterministic across 2 clean sweeps (round 5b)
- **Can-fail proofs:** all 6 round-4 findings independently proven (§4, unchanged by the
  rebase); the census caught two further real gaps live (`--link-color-hover` chain,
  `--hr-color`), both fixed and reverified; a self-introduced `}`-in-comment extractor bug
  was caught and fixed before commit
- **Census:** 164 consumed host tokens, dark preview == theme-light, 0 drift (unchanged by
  the rebase)
- **Superseded finding:** the round-5 "8 realprint pairs moved, unrelated to SC-127" note
  (§3 original) is SC-328's own already-sanctioned rebaseline — confirmed, no action needed,
  do not file or investigate further
- **Rebase conflicts:** none — dse clone rebase was clean (0 conflicts); superproject used
  reset+reapply instead of rebase (see §10) specifically to avoid gitlink conflicts across
  66 intervening main commits, several of which also bump the same submodule pointer
- **Skipped:** nothing required
- **Drive-by fixes:** none against pre-existing code; one self-introduced bug (the
  `}`-in-comment regex truncation) caught and fixed before commit — see §1
- **Follow-ups:** the census's gallery-scope limitation (§5.2) and r3's carried-forward
  items (§5.3) — the develop-drift item (§5.1, original) is resolved, no longer open
- **Artifacts:** §9 above, plus round-5b's own (all absolute, directory
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/`):
  `sc127-r5b-{rebase,npmci,npmci-base,npmci-restore,tsc,lint,jest-full,jest-base-c524fd2,parity}.log`,
  `sc127-r5b-sweep{A,B}.log`, `sc127-r5b-sweep{A,B}-{print,realprint}.sha256`,
  `sc127-r5b-freeze-{A,B}.log`,
  `sc127-r5b-after-{statblock-charline-two,feature,initiative,negotiation,hero}-dark-twin{,-top}.png`
- **Commits:** dse `1090af0`/`b936efa` (round 5, rebased twice — final shas after both
  rebases) on top of r3's four; superproject `b770e37`, both in
  `/home/scott/code/steelCompendium/worktrees/sc127-print-preview[/draw-steel-elements]`
