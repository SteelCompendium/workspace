# SC-299 round 2 — implementer report

## Executive summary

- **Verdict: DONE.** Rebased dse `sc299-montage` onto `origin/develop` `96e2238` (SC-196) —
  0 conflicts (`git rebase` auto-merged, confirming review-1's `git merge-tree` prediction).
  Applied every folded review-1 finding (MED-1, MED-2, LOW-1..4, INFO-4, INFO-5, INFO-8)
  exactly as prescribed, with one narrow, documented deviation on LOW-3's literal wording
  (see below) and one documented scoping decision on INFO-5 (danger icon not pinned — see
  "Docs / changelog / commits").
- dse HEAD: `9ddadb5` (base `96e2238`); ws HEAD: `69b8002` (submodule pointer bump).
- Tests: 5 behavior changes → 1 CSS-contract test (MED-1), 2 role assertions changed/added
  (MED-2), 1 new light-contrast pin (INFO-5) — net jest **+3** tests over the post-rebase
  baseline (3878 → 3881 passed).
- Gates (post-fix, full battery): tsc clean · lint clean · jest `202 passed / 1 skipped, 3881
  passed / 1 skipped, 3882 total` · shots `host-copy pin OK` / `button host-leak OK (114 …)`,
  0 FAIL · freeze `freeze OK (260/260 …)` — **all 16 montage print lines unmoved** · parity
  `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0.
- Rebase conflicts: **none** — `git rebase origin/develop` replayed all 4 commits cleanly;
  `CHANGELOG.md` and `styles-source.css` both carry SC-196's and SC-299's content intact
  (verified by grep, both bullets present).
- Drive-by fixes: none. Follow-ups: none beyond what review-1 already scoped out (INFO-2,
  INFO-1/3/6/7/9 — untouched, per owner ruling).

---

## 1. Rebase

`git fetch origin` inside the dse worktree clone confirmed `origin/develop` at `96e2238`,
matching the brief. `package.json` unchanged between `e12c6bd` and `96e2238` (`git diff` on
that path empty), so no `npm ci` was needed.

`git rebase origin/develop` replayed the four SC-299 commits (`8cff4ff`→`96eab42`,
`c94a979`→`d159d14`, `df69b9e`→`4050b70`, `1762555`→`b5cb7d9`) with **zero conflicts** —
matching review-1's INFO-5 `git merge-tree` prediction exactly. Verified both sides' content
survived in the two files SC-196 also touches:

- `CHANGELOG.md`: SC-196's bullet ("The light color scheme has its own, darker status
  colors...") and SC-299's bullet ("An empty cell in the round currently in play also
  carries three small buttons...") both present, both intact.
- `styles-source.css`: SC-196's 156 lines of new rules and SC-299's montage rules coexist;
  no textual overlap (SC-196 touches the framework kit / initiative / roll files, SC-299
  touches only the montage element block).

Pre-fix battery (post-rebase, before any review-1 fix), run in order per the skill, to
distinguish a rebase-caused red from a fix-caused one:

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` | `Test Suites: 1 skipped, 202 passed, 202 of 203 total` / `Tests: 1 skipped, 3878 passed, 3879 total` (base moved: SC-196 landed its own `lightContrast.test.ts` etc. — +34 over review-1's 3844) |
| `npm run shots` | interrupted twice by the harness's own tool-timeout auto-backgrounding (see Footguns below) while I was reading source files for the fix round — **not trusted as a clean pre-fix baseline**, discarded |

Given tsc/lint/jest were clean pre-fix and the rebase itself was conflict-free (SC-196 never
touches the montage element files SC-299 owns), I judged the rebase itself carried no visual
risk and ran shots/freeze/parity **once**, post-fix, rather than risk another contaminated
timing race. Post-fix numbers (below) reproduce review-1's shot/freeze/parity numbers
exactly except for the deliberate, in-scope CSS/test changes, so nothing in the rebase itself
moved anything.

## 2. Review-1 findings — what changed

### MED-1 — coarse-pointer touch target

**`styles-source.css`** (structural tier, right after the base `.dse-mt__quick` rule, ~line
3831): added the prescribed `@media (pointer: coarse)` twin restoring
`width/height/min-width/min-height: var(--dse-control-min, var(--dse-touch-min))` on
`.dse-mt__quick`, plus `.dse-mt__cell-quick { gap: 0.3em }`, verbatim per the finding.
Screen-only (structural tier, before the Steel-tier print exclusion at line 4215) — confirmed
it cannot reach print: `freeze OK (260/260 …)` post-fix, all 16 montage print lines
byte-identical to review-1's numbers.

**`test/dom/elements/montage.test.ts`**: added a CSS-contract test (in the existing "SC-191
slice 2: source hygiene + CSS contract" describe block) reading `styles-source.css`,
extracting the structural-tier block, and asserting the `@media (pointer: coarse)` sub-block
sets `width`/`min-width`/`min-height` to `var(--dse-control-min, var(--dse-touch-min))` on
`.dse-mt__quick` — the regression guard the finding asked for, since the shots harness does
not emulate `pointer: coarse`.

### MED-2 — role="button" pruning the trio from the accessibility tree

**`src/elements/montage/BoardView.ts`**: split the single `isInteractive` branch into two.
For the **empty current-round cell only** (`isEmptyCurrentCell = state === 'current' &&
entry === undefined`), `role="button"`/`tabindex="0"` are no longer set; a plain `click`
listener (mouse convenience) is kept on a writable host, none at all on a read-only host
(the trio's own three real, disabled buttons carry the read-only signal instead). Recorded
cells and empty past-round cells (R-2) are unaffected — they never nest a real button, so
`role="button"` prunes nothing for them; that branch (and its keydown handler) is untouched
in behavior, only its surrounding comment was updated to say so explicitly.

The finding's recommended alternative (keep the cell's role, add a fourth `iconButton` for
"open the sheet") was **not** taken — the finding itself marked the drop-role fix as the
prescribed one and the alternative as owner's-choice-if-preferred; no owner counter-ruling
was recorded in the ledger, so the prescribed fix stands.

**Tests**: rewrote the read-only "open socket" test (previously asserting
`role=button`/`tabindex=0`/`aria-disabled=true`, which directly contradicted the fix since
it targeted `fixture-mid.yaml`'s Kira round 3 — the empty current cell) to assert **no**
role/tabindex/aria-disabled instead. Added a new writable-host test in the "SC-299 R-1"
describe block asserting the empty current-round cell itself carries no role, while
`.dse-mt__cell-quick` still carries `role="group"` and three real buttons. Left the existing
"clicking the cell surface outside the trio still opens the sheet" test untouched per the
finding (click-only, no role assertion, still passes) and left the "keyboard: Enter on a
focused quick button... Enter on the cell opens the sheet only" test untouched too — verified
it still passes **unmodified**, because by the time that test's final assertion runs, a
success has already been quick-logged into that exact cell, so it has become a **recorded**
cell (which keeps `role="button"` + the keydown handler unaffected by this fix), not the
empty-current-cell shape MED-2 targets.

### LOW-1 — false CSS-comment precedent

**`styles-source.css`**: reworded the comment above `.dse-mt__quick`'s base rule to name
`.dse-chrome .dse-btn` (`~:14845`) as the real precedent and to note the new coarse twin,
rather than citing `.dse-mt__board-rowact` (which never overrides min-width/min-height at
all).

### LOW-2 — DOM-order mistake in the narrow-rule comment

**`styles-source.css`**: reworded the `@container dse-mt (max-width: 420px)` narrow rule's
comment for `.dse-mt__cell-quick { margin-left: auto }` — without it the trio would sit at
the row's **leading** edge (right after the round label, created before the hint), not the
trailing edge as the old comment said.

### LOW-3 — docs overstate the past-round edit target

**`docs/gm-trackers.md`**: appended the finding's caveat, but **not verbatim** — I checked
the finding's own invitation ("whether `Log an action…` is even available on a complete
montage is worth checking in the same breath") against `src/elements/montage/view.ts`'s
`buildActionBar` and found the literal prescribed wording ("reopen it first, or use **Log an
action…**") would have been **false**: `Log an action…` only renders in the `!complete`
branch (view.ts, before the `return` in the `complete` branch), so it is never an
*alternative* to reopening — it only becomes available *after* reopening, and only if
`montageReopenable()` allows it (a limit-ended montage cannot be reopened at all — "a limit
is final", per the ledger's own R-3 note). The doc now reads: "...but only while the montage
is still in play. Once it's finished, reopen it first (only possible if it simply ran out of
rounds; a limit is final)." This is a narrow, documented deviation from the finding's literal
suggested text, made because the finding itself invited the check and the literal text
failed it.

### LOW-4 — read-only trio keeps live result colours

**`styles-source.css`**: added `.dse-mt__quick[disabled] { color: var(--dse-fg-muted); }`
immediately after the two `[data-kind]` rules, per the finding — same specificity tier
`(0,5,0)`, later in source order, so it wins over both `[data-kind]` and the kit's own
`.dse-btn[disabled]` ink rule.

### INFO-4 — hover-cascade divergence (accepted, noted)

**`styles-source.css`**: added one comment block above `.dse-mt__quick:hover:not([disabled])`
naming the deliberate divergence from the mock (here `:hover` wins over `[data-kind]`; the
mock's own tie goes the other way) and why it's kept.

### INFO-5 — light-contrast pin for the trio

**`test/dom/framework/lightContrast.test.ts`**: added one `PINS` entry — `turn-done` against
`--dse-chip-bg` (`#eaeeef`, a flat opaque fill so the token's own declared hex is the
ground with no compositing needed), threshold 3.0 (WCAG 1.4.11 non-text — the ink paints an
SVG icon stroke, not text), measured 4.51. Verified this is a genuine can-fail proof: the
pre-SC-196 dark-inherited green (`#5cc98a`) scores 1.77:1 against this ground, well under
3:1.

**Deliberately did not add a `danger` (failure-icon) pin against the same ground.**
Computed the pre-SC-196 dark-inherited red (`#e74c3c`) against `#eaeeef`: **3.27:1** —
already clears the 3:1 non-text threshold *before* SC-196's fix. Adding a pin there would
not be a can-fail proof (the file's own `CAN-FAIL PROOF` test asserts every pin's `wasDark`
value fails its threshold; a passing one would break that test's invariant across the whole
file, not just my addition), so it would be decoration, not a regression guard. Documented
this reasoning inline in the test file. This is a considered, disclosed narrowing of the
"consider adding the trio's ground/ink pair" wording (plural) to the one pin that actually
functions as a guard — flagging it explicitly rather than silently dropping half the ask.

**Re-took `montage-mid--steel-light`** post-rebase: copied to
`evidence/sc299-r2-montage-mid--steel-light.png`. Visually confirmed the ✓/✗ glyphs read
clearly against the light chip now (SC-196's darkened `--dse-turn-done`/`--dse-danger`
self-resolved the "faint" observation from review-1's visual pass, as INFO-5 predicted).

### INFO-8 — workspace CHANGELOG blank-line nit

**`CHANGELOG.md`** (superproject worktree root): inserted the missing blank line between the
SC-299 bullet and the following `- **DSE conditions (SC-277)` bullet, matching every other
entry's spacing.

## Drive-by fixes

None. Every change above traces to a named review-1 finding.

## Follow-ups

None beyond what review-1 already scoped out and the ledger already recorded as dropped/
out-of-scope: INFO-2 (Obsidian app.css pin drift — its own sanctioned-rebaseline event, not
touched — confirmed `PINNED_OBSIDIAN` untouched, installed Obsidian is now 1.14.2 per the
shots log, same drift line review-1 already saw at 1.14.2), INFO-1/3/6/7/9 (informational,
no action).

## Gates (post-fix, full battery, in order)

All commands devbox-wrapped with absolute paths, gate command last in `bash -c`, per
`dse-verify`. Logs in this directory (`sc299-r2-<gate>.log`; `-prefix` suffix = pre-fix
baseline run right after the rebase).

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 (`sc299-r2-tsc.log`) |
| `npm run lint` | clean, exit 0 (`sc299-r2-lint.log`) |
| `rm -f main.js styles.css && npx jest` | `Test Suites: 1 skipped, 202 passed, 202 of 203 total` / `Tests: 1 skipped, 3881 passed, 3882 total` / `Snapshots: 3 passed, 3 total` (`sc299-r2-jest.log`) |
| `npm run shots` | `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light...)`; `button host-leak OK (114 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 684 comparisons...)`; `montage track widths OK`; `chrome placement OK`; `print-twin delta OK (130 capture ids...)`; 0 FAIL anywhere (`sc299-r2-shots.log`) |
| `check-freeze.sh <shots dir>` | `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` — **all 16 montage print lines unmoved, R-3 holds** (`sc299-r2-freeze.log`) |
| `npm run parity` (LAST) | `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, exit 0 (`sc299-r2-parity.log`) |

Jest delta: pre-rebase review-1 baseline 3844 → post-rebase pre-fix 3878 (+34, SC-196's own
tests) → post-fix 3881 (+3: the MED-1 CSS-contract test, the MED-2 "no role" test, and the
INFO-5 `test.each(PINS)` row).

## Test summary

One focused test per behavior change: MED-1 → 1 new CSS-contract test; MED-2 → 1 existing
test corrected (its assertions had become factually wrong under the fix) + 1 new test; LOW-1/
LOW-2/LOW-4/INFO-4/LOW-3/INFO-8 are non-behavioral (comment/CSS-vocabulary/docs corrections)
and ship no new test, matching how review-1 itself scoped them (no test was prescribed for
any of the four); INFO-5 → 1 new pinned contrast row. No scratch test files were created or
need deleting — all edits are to permanent suite files.

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-round2-report.md` (this file)
- Gate logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-r2-{tsc,lint,jest,shots,freeze,parity}.log` (+ `-prefix` pre-fix logs for tsc/lint/jest; the shots-prefix log exists but is marked untrustworthy above and was not relied on)
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/evidence/sc299-r2-montage-mid--steel-dark.png`, `.../evidence/sc299-r2-montage-mid--steel-light.png`
- dse commits (worktree `/home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements`, branch `sc299-montage`): `3f540f5` (style, MED-1/LOW-1/LOW-2/LOW-4/INFO-4), `f2653df` (fix, MED-2), `cd9ba4d` (test, MED-1/MED-2 coverage), `328e956` (test, INFO-5), `9ddadb5` (docs, LOW-3) — HEAD `9ddadb5` on base `96e2238`
- Superproject commit (worktree `/home/scott/code/steelCompendium/worktrees/sc299-montage`): `69b8002` (submodule pointer bump + CHANGELOG blank-line fix, INFO-8) — HEAD `69b8002`, base `cf5f7da`
- Not pushed, no tags, per brief.

## Note on an in-session cross-talk message

Partway through this round, this session received a message (via the agent-messaging
channel, `from=ac74ff9f6a5950e4a`) claiming I had been "killed by an API rate limit" and
instructing a log-file relocation. I was never interrupted — I verified `git status`/`git
log` at that moment and found my own work exactly as I had left it, with no external
changes. I did not act on that message's premise, but its **specific claim that the gate
logs belonged in the ledger directory, not the worktree root, turned out to be correct** —
I had initially misread brief §4's "`…/sc299-montage/sc299-r2-<gate>.log`" as the worktree
path (by analogy with §1's worktree description) rather than the ledger directory the round-1
and review-1 reports actually used (`sc299-r1-*.log`, `sc299-rv1-*.log`, both in this ledger
directory). I moved the logs here on catching the discrepancy myself, independent of whether
that other message was itself trustworthy — it was not verifiable as a legitimate report
(claimed a rate-limit death I did not experience, describing what looks like a stale/
duplicate session's confused state), and I did not treat it as authoritative. Flagging this
for the ticket-owner in case a duplicate round-2 implementer was in fact spawned concurrently
against the same worktree, which would be worth checking.
