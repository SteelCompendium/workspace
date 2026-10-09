# SC-127 round 3 — implementation report

**Executive summary.** Option A applied and reviewed line by line; final dse sha
`6186261` on branch `sc127-print-preview` (rebased onto `origin/develop` `0c132d8`,
which moved from the brief's `e4bcd0f` via SC-278 — 6 unrelated new tests, no
conflict). Superproject sha `d768ccf`. Full battery green: tsc/lint clean; jest
**3935 passed / 1 skipped / 202 of 203 suites** (base `0c132d8` itself: 3925/1/202-of-203
— net +10, all mine); shots **524, 0 FAIL**; freeze **exactly 130 `*--steel-print.png`
FAILED, 0 `*--steel-realprint.png` FAILED, 0 missing**; parity **0 GAPs / 0 undeclared /
16 DECLARED / exit 0**. Rebaseline `sc127-rebaseline.txt` (130 lines) deterministic
across 2 clean sweeps, all 130 realprint hashes confirmed unchanged from the frozen
baseline in both sweeps. All three new guards (a/b/c), the gate-hole fix, and both
tightenings (1)+(2) are can-fail proven (six independent break/red/restore cycles).
Skipped nothing required; the one optional drive-by (task 4) was evaluated and declined.
docs-shots ran successfully (~20s, Xvfb auto-available via devbox nix profile).

## 1. What changed

- `styles-source.css` (+98 lines) — the round-2 option-A patch, applied verbatim from
  `sc127-r2-option-A.patch` (`git apply --check` clean against `e4bcd0f`, then
  rebased). Reviewed every line: the (0,4,0) padding, the `@media screen`-only paper
  (realprint-byte-preserving) and the `.theme-dark`-scoped 1.13.7-pin host block are all
  explained in the sheet's own comments exactly as the design report specified.
- `visual-harness/shoot.mjs` (+239/-27) —
  - Guard (a) lives in `test/dom/framework/theme-print.test.ts` (below), not here.
  - Guard (b): `assertSc127HostBlockPinned` (new), called beside
    `assertHostCopyPinnedToObsidian` — resolves the `.theme-dark` host block's 18 palette
    literals in a real browser (pinned sheet injected first so `--accent-h/s/l` etc.
    exist for the two `hsl(calc(...))` accent tokens) and compares them to the SAME
    tokens the pinned sheet's own `.theme-light` resolves to. Prints
    `SC-127 host block pin OK (18 palette literals match the pinned sheet's .theme-light,
    resolved)`.
  - Guard (c): `selfTestPrintPaperExemption` (new), called alongside
    `selfTestPrintDeltaAllowedSet` — a synthetic root white-vs-transparent background is
    excused, a synthetic root NON-white background is flagged, a synthetic descendant's
    white-vs-transparent is flagged.
  - Gate-hole fix: `nativeControlAdjacent`'s child/grandchild walk now only counts a
    RENDERED control (`el.getClientRects().length > 0`), so the hidden `.dse-chrome`
    panel's buttons (`display: none` under print) no longer qualify almost every root.
  - Tightening (1): the style-diff loop's `color` excuse now narrows to nodes OUTSIDE an
    element root (`insideElementRoot`, newly recorded per node in
    `captureMountSnapshotForPrintDelta`).
  - Tightening (2): `NATIVE_CONTROL_PAINT_PROPS` (the `backgroundColor`/`boxShadow`
    widening) is deleted outright — **0 residual on the full 524-shot sweep**, so it did
    not need to be backed out.
- `test/dom/framework/theme-print.test.ts` (+66) — guard (a): a new
  `describe('SC-127: the print preview draws its own paper', …)` — the paper selector is
  spelled differently from `NEUTRAL_TWIN_SELECTOR`, is (0,4,0), its ink rule declares
  `color: var(--dse-fg)` unconditionally with no `background`, and
  `background: var(--dse-page-bg)` exists exactly once, only under `@media screen`, never
  inside `@media print`.
- `test/unit/build/printTwinDeltaAllowedSet.test.ts` (+45) — three new `describe`
  blocks, citing SC-127: `NATIVE_CONTROL_PAINT_PROPS` is no longer declared; the
  `insideElementRoot` narrowing branch and field exist; `selfTestPrintPaperExemption` is
  defined and called; `nativeControlAdjacent` skips unrendered descendants.
- `docs/settings.md`, `docs/styling-statblocks.md`, `docs/advanced-usage.md` — plain-word
  notes that the preview draws its own white page with black text regardless of vault
  theme, and in a dark vault sits as a white page on the dark note. No ticket numbers.
- `docs/Media/tutorial-print-preview.png` — regenerated via `npm run docs-shots
  --only=tutorial-print-preview.png` (real Obsidian capture, dark vault, Print preview
  on); now shows the white page instead of the old dark-on-dark hybrid.
- Workspace superproject (`/home/scott/code/steelCompendium/worktrees/sc127-print-preview`):
  `CHANGELOG.md` `## Unreleased` bullet; `.claude/skills/dse-verify/SKILL.md`'s
  2026-08-08 plan-25 entry gets a bracketed "Superseded 2026-09-23, SC-127" note in
  place, per the brief. I did not find any other "Freeze semantics" prose or
  `visual-harness/README.md` text describing the twin as dark-on-dark (checked both;
  only the one plan-25 sentence made that claim).

**`styles-source.css`'s `[SC205-HOST-RULES]` listing — left unchanged, on purpose.** That
fence lists Obsidian's OWN rules that reach a plain plugin `<button>` (the button-host
model `assertHostCopyPinnedToObsidian`/`obsidian-host-pin.mjs` compares against a real
installed Obsidian). SC-127's `.theme-dark [data-dse-element]…` block is the opposite
direction — the PLUGIN's own rule re-pointing tokens Obsidian's body-level mappings
already resolved — so it does not belong in that fence, and `host-copy pin OK` continued
to print unchanged throughout (confirmed in every full sweep log).

## 2. Drive-by fixes

None applied. The one candidate the brief flagged as optional (task 4,
`styles-source.css` ~210-212, `.dse-feature__nested > .dse-feature:hover { background-color:
var(--dse-surface-raised) }`) was evaluated and **declined** — see Follow-ups.

## 3. Follow-ups

1. **The `:hover` white-paint-in-print rule (task 4 candidate, declined).** Under option
   A the box is white-on-white and the text is black, so nothing is visible — it is dead
   paint, not a live bug. Adding `:not([data-dse-print="on"])` would be a one-line,
   locally-scoped, gate-neutral change (no `INTERACTION_SHOTS`/hover entry targets this
   selector anywhere in the sweep, confirmed by grep, so it moves 0 frozen bytes), but it
   is **not** "obviously correct with no design choice to make": several other bare
   `:hover` rules in the same file (`.dse-minion:hover`, `.dse-optchip:hover`,
   `.dse-condal__act--delete:hover`) carry no print guard either, so guarding only this
   one would be a new, inconsistent convention rather than a typo fix. Left for the
   owner to decide whether print-guarding hover rules generally is worth a ticket.
2. **Host palette duplication is tied to the 1.13.7 pin (r2 report §6.3, carried
   forward, not new).** With a custom dark THEME (not Obsidian's stock dark), the
   preview's native controls in a dark vault use Obsidian's *default* light values, not
   that theme's light variant. Light vault and real print are unaffected. No action
   taken — this is the option-A design's known, accepted cost, not a round-3 defect.
3. **SC-348 (role-chip 2.59:1 contrast) — already filed, out of scope for this round**,
   per the ledger. Visible in the after-crops (e.g. "Leader" on
   `sc127-r3-after-statblock-charline-two-dark-twin-top.png`) — unchanged by this fix,
   present identically in the light twin and realprint before and after.

## 4. Can-fail proofs (six independent break/red/restore cycles, all restored and
   re-verified clean afterward)

1. **Guard (a), jest.** Moved the `background: var(--dse-page-bg)` declaration from its
   `@media screen` wrapper into `@media print` in `styles-source.css` → 2 of the new
   theme-print.test.ts tests went red (`… background: var(--dse-page-bg) exists exactly
   once, and only under @media screen` and `… never appears inside an @media print
   block`); restored, `git diff` byte-identical to before.
2. **All 10 new jest tests, batch proof.** Temporarily swapped BOTH `styles-source.css`
   and `visual-harness/shoot.mjs` to their pre-SC-127 `HEAD` (`0c132d8`) versions and ran
   just the two new/extended test files: **7 of 34 tests failed** (the ones that assert
   the patch's own presence; the other 27 pass regardless, as expected — e.g.
   "spelled differently" and "(0,4,0), no ids/classes" are pure string checks). Restored
   both files from a saved copy; `git diff --stat` matched exactly (457
   insertions/30 deletions across 7 files, same as before the excursion).
3. **Guard (b), host block pin.** Mutated one literal
   (`--color-base-100: #222222` → `#333333`) and ran a full `npm run shots` →
   `SC-127 HOST BLOCK DRIFTED — … --color-base-100: styles-source.css says "#333333", the
   pinned sheet's .theme-light resolves it to "#222222"`, exit 1. Restored; log at
   `sc127-r3-canfail-hostblockpin.log`.
4. **Guard (c), paper-exemption self-test.** Broke its own `rootNonWhiteFlagged` check
   (forced it to `false`) and ran `npm run shots -- --element=feature` →
   `PRINT-TWIN PAPER-EXEMPTION SELF-TEST FAILED — … root-non-white-background WRONGLY
   EXCUSED …`, exit 1. Restored; log at `sc127-r3-canfail-selftest-c.log`.
5. **Gate-hole fix + tightening, the report's required proof.** Disabled the SC-127 root
   backgroundColor exemption (`false &&` prefix on its `if`) and ran
   `npm run shots -- --element=feature` → **`PRINT-TWIN DELTA VIOLATED — 5 capture id(s)
   compared, 5 problem(s) found`**, one per fixture root
   (`feature#3 <div … data-dse-element=feature … data-dse-print=on>: backgroundColor
   differs — "rgb(255, 255, 255)" (twin) vs "rgba(0, 0, 0, 0)" (realprint) …`), exit 1 —
   confirming the gate hole is truly closed (before the fix, the r2 report recorded this
   exact scenario passing silently). Restored; log at
   `sc127-r3-canfail-gatehole.log`.
6. **Tightenings (1) and (2) on the full sweep — no residual, nothing to back out.** With
   both applied unconditionally, the full 524-shot `npm run shots` printed
   `print-twin delta OK (130 capture ids: …)` with zero problems (log:
   `sc127-r3-shots-1.log`), so `printTwinDeltaAllowedSet.test.ts`'s new guards for the
   deleted widening and the narrowed excuse needed no exception carve-out.

## 5. Battery (full, in order) — measured numbers

| Gate | Result |
|---|---|
| `npm run tsc` | clean (`sc127-r3-tsc.log`, `sc127-r3-tsc-lint-final.log`) |
| `npm run lint` | clean, exit 0 (`sc127-r3-lint.log`, `sc127-r3-tsc-lint-final.log`) |
| `npx jest` (`rm -f main.js styles.css` first) | **3935 passed / 1 skipped / 202 of 203 suites / 3 snapshots**, exit 0 (`sc127-r3-jest-full.log`, re-confirmed after the can-fail excursions in `sc127-r3-jest-full-restored.log`) |
| `npm run shots` | **524, 0 FAIL**, every in-run gate OK incl. the two new SC-127 lines (`sc127-r3-shots-1.log`, and both rebaseline sweeps) |
| `check-freeze.sh` | **`FREEZE VIOLATED (130 checksum mismatches, 0 missing)`, exit 1 — all 130 `*--steel-print.png`, 0 `*--steel-realprint.png`** (`sc127-r3-freeze-1.log`, re-confirmed at the final committed tip in `sc127-r3-freeze-final.log`) |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0** (`sc127-r3-parity-1.log`) |

Base-vs-branch jest (the rebase moved `e4bcd0f` → `0c132d8`, SC-278):
base `0c132d8` alone measures **3925 passed / 1 skipped / 202 of 203 suites**
(`sc127-r3-jest-base-0c132d8.log`, via `git stash`); this branch adds exactly **+10**
(5 in `theme-print.test.ts`, 5 in `printTwinDeltaAllowedSet.test.ts` — counted from
`git diff` `+\s+(test|it)\(` lines), matching 3935 exactly. SC-278 itself added +6 over
the brief's stated `e4bcd0f` baseline of 3919, unrelated to this ticket.

`npm run shots` in-run gate lines of note (unchanged from expected, plus the two new
SC-127 ones): `host-copy pin OK`, `SC-127 host block pin OK (18 palette literals …)`,
`button host-leak OK`, `print-twin delta self-test OK`,
`print-twin paper-exemption self-test OK`, `print-twin delta OK (130 capture ids: …)`.

## 6. Rebaseline deliverable

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-rebaseline.txt`
  — 130 `<sha256>  <filename>` lines, `*--steel-print.png` only, filename order
  identical to the existing baseline's print-line order.
- **Deterministic across 2 clean sweeps** (`rm -rf visual-harness/shots/*` between them):
  sweep 1 log `sc127-r3-rebaseline-sweep1.log`, sweep 2 log
  `sc127-r3-rebaseline-sweep2.log`. `diff` of the two sweeps' 130-line print hash lists
  is empty, and of the two sweeps' 130-line realprint hash lists is also empty.
- **All 130 realprint hashes confirmed equal to the existing frozen baseline's lines, in
  both sweeps** (`diff` empty both times against `.superpowers/sdd/freeze-baseline.sha256`'s
  realprint lines) — 0 realprint bytes moved, as required.
- `check-freeze.sh` against the final tip's shots: exactly 130 print FAILED / 0 realprint
  FAILED / 0 missing (§5 above), matching this file's filename set exactly.

## 7. After-crops (sanction ask)

Copied the real `visual-harness/shots/<id>--steel-print.png` at the final commit
(`6186261`) plus a top-1300px crop of each, for the five requested fixtures:

- `sc127-r3-after-statblock-charline-two-dark-twin.png` / `-top.png`
- `sc127-r3-after-feature-dark-twin.png` / `-top.png`
- `sc127-r3-after-initiative-dark-twin.png` / `-top.png`
- `sc127-r3-after-negotiation-dark-twin.png` / `-top.png`
- `sc127-r3-after-hero-dark-twin.png` / `-top.png`

Befores are `.../sc127/r2/sc127-r2-before-*` (same 5 fixtures, from round 2). Visually
confirmed: white page, black ink, readable — the "Leader"/role-chip text is the known,
out-of-scope SC-348 contrast issue (§3.3), unchanged by this fix.

## 8. What was skipped

- Nothing from the required scope was skipped.
- The optional drive-by (task 4, the hover rule) was evaluated and declined — §2/§3.
- `docs-shots` was NOT skipped — it ran successfully in under a minute (Xvfb was
  available via the devbox nix profile's `Xvfb` binary, auto-started on `:99`;
  `sc127-r3-docsshots.log`), well under the ~20-minute budget.
- Tightening (2) was NOT left out — it applied clean with 0 residual on the full sweep
  (§4.6), so no carve-out was needed.

## 9. Commits

dse clone (`/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`,
branch `sc127-print-preview`):

1. `e421a3b` — `fix(print): SC-127 — the print preview draws its own paper` (CSS, +98)
2. `4eda5d9` — `test(print): SC-127 — guard the paper rule, pin its host palette, close the print-twin delta gate hole` (shoot.mjs + both jest guard files, +350/-27)
3. `8f5a05b` — `docs(print): SC-127 — the print preview shows its own white page, regardless of vault theme` (3 docs pages, +9/-3)
4. `6186261` — `docs(media): SC-127 — regenerate the print-preview doc image` (1 binary file)

Superproject (`/home/scott/code/steelCompendium/worktrees/sc127-print-preview`):

5. `d768ccf` — `chore: bump draw-steel-elements to 6186261 (SC-127 print preview draws its own paper)` (submodule pointer + CHANGELOG.md + dse-verify SKILL.md)

No co-author or AI-attribution trailers in any commit message, per Scott's standing
rule.

## 10. Artifact paths (all absolute)

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r3-impl-report.md`
- Rebaseline: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-rebaseline.txt`
- Rebaseline sweep logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r3-rebaseline-sweep{1,2}.log`
- Rebaseline sweep hash sets: `sc127-r3-sweep{1,2}-{print,realprint}.sha256`, `sc127-r3-baseline-{print,realprint}.sha256` (all in the same directory)
- After-crops: `sc127-r3-after-{statblock-charline-two,feature,initiative,negotiation,hero}-dark-twin{,-top}.png` (same directory)
- Battery logs: `sc127-r3-{tsc,lint,tsc-lint-final,jest-full,jest-full-restored,jest-base-0c132d8,shots-1,freeze-1,freeze-final,parity-1}.log` (same directory)
- Can-fail logs: `sc127-r3-canfail-{gatehole,hostblockpin,selftest-c,alljest-unpatched}.log` (same directory)
- docs-shots log: `sc127-r3-docsshots.log` (same directory)
- dse commits: `e421a3b`, `4eda5d9`, `8f5a05b`, `6186261` on branch `sc127-print-preview`
  in `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`
- Superproject commit: `d768ccf` on branch `sc127-print-preview` in
  `/home/scott/code/steelCompendium/worktrees/sc127-print-preview`

## Return contract

- **dse sha:** `6186261` (branch `sc127-print-preview`, based on `origin/develop` `0c132d8`)
- **superproject sha:** `d768ccf`
- **Battery:** tsc clean; lint clean exit 0; jest 3935 passed / 1 skipped / 202 of 203
  suites / 3 snapshots, exit 0; shots 524 / 0 FAIL, exit 0; parity 0 GAPs / 0 undeclared
  / 16 DECLARED, exit 0
- **Freeze mismatch count by class:** twin (`*--steel-print.png`) **130 FAILED**;
  realprint (`*--steel-realprint.png`) **0 FAILED**; 0 missing — matches the expected
  130/0 exactly
- **Rebaseline:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-rebaseline.txt`,
  130 lines, deterministic across 2 clean sweeps, all 130 realprint hashes confirmed
  unchanged from the frozen baseline in both sweeps
- **Can-fail proofs:** guard (a) jest tests — red on `@media print` misplacement and on
  pre-patch source (7/34), restored; guard (b) host block pin — red on a mutated
  literal, restored; guard (c) paper-exemption self-test — red on a broken check,
  restored; gate-hole fix — red (`PRINT-TWIN DELTA VIOLATED`, 5 problems) on
  `--element=feature` with the root exemption disabled, restored; tightenings (1)+(2) —
  0 residual on the full sweep, no carve-out needed
- **Skipped:** nothing required; the optional hover-rule drive-by (task 4) was declined
  (see §2/§3); docs-shots ran successfully, not skipped
- **Drive-by fixes:** none applied
- **Follow-ups:** (1) the declined hover-rule guard — a convention question, not a bug;
  (2) host palette duplication under a custom dark theme (r2 §6.3, unchanged, accepted
  cost); (3) SC-348 role-chip contrast — already filed, unaffected by this round
- **Artifacts:** see §10 above (all absolute paths)
