# SC-127 — decisions ledger

Ticket: SC-127 (Linear, Steel Compendium). Owner: Fable ticket-owner, session
`3a3267bf-ca7b-4859-a161-38ee3f6c31da`. Worktree: `sc127-print-preview`
(`/home/scott/code/steelCompendium/worktrees/sc127-print-preview`). dse tracked branch:
`develop` (tip `e4bcd0f` at start, 2026-09-23).

Workers: read this file instead of the Linear thread. Workers never call the tracker.

## Rulings (verbatim, dated, newest last)

### 2026-09-23 — Rescope approved (terminal session, NOT on Linear)

Context: SC-127 as filed (2026-08-08) said the harness shoots `*--steel-print.png` as print
tokens over the DARK page scheme, giving dark-ink-on-dark-card shots, and proposed switching
the combo to `bg: 'light'` plus a full print-line rebaseline. The dispatcher investigated
(2026-09-23) and found: (1) `visual-harness/shoot.mjs:80` on `origin/develop` is still
`{ theme: 'steel', bg: 'dark', print: true }`; (2) today's twin shots still show the
problem (black labels on a near-black card; below ~1140 CSS px the background turns white
while body text stays light); (3) SC-170 + SC-202 r6c added `--steel-realprint` (real print
media, `body.theme-light` forced) which is clean, so the review-evidence motivation is
covered; (4) `data-dse-print="on"` is the user-facing `printPreview` preference
(`src/prefs/catalog.ts:212`, Settings → Appearance → "Print preview"), and since SC-202 r6c
the twin is a real reading-view capture under the real Obsidian sheet with `theme-dark` — so
a dark-theme user with Print preview ON very likely sees the same unreadable hybrid. That is
a product bug, not a capture artifact. Not yet verified in real Obsidian.

Dispatcher's recommendation to Scott, verbatim:

> "**My recommendation:** don't do the rebaseline as written. Switching the twin to
> `bg: 'light'` would hide what may be a real bug. Instead, rescope SC-127 to: confirm in
> Obsidian what dark theme plus `printPreview` looks like, then fix the plugin, most likely
> by making the preview draw its own light page. The freeze baseline would then move as a
> side effect of that fix. If the answer is "print preview in dark mode doesn't matter,"
> close SC-127 as superseded by SC-170."

**Scott's ruling, verbatim, 2026-09-23 (terminal session, not on Linear):**

> "I moved the ticket. Go ahead with your recommendation"

("I moved the ticket" = Scott moved SC-127 Todo → Awaiting.)

**Effect:** the original fix ("switch the twin combo to `bg: 'light'` and rebaseline") is
~~the plan~~ superseded by this ruling. New scope: (a) verify in real Obsidian (dark theme +
Print preview ON, light theme as control); (b) if confirmed, fix the plugin so the print
preview draws its own light "paper" regardless of Obsidian's theme — the realprint shot is
the target look; (c) keep the twin captured over the DARK scheme as the regression gate for
this bug; (d) the freeze twin lines move as a side effect (sanctioned rebaseline per
`dse-verify`; realprint lines must NOT move); (e) if real Obsidian does NOT show the
problem, stop and bring that to Scott.

### Prior ruling surfaced — SC-202 final ask item 7 (2026-09-14)

SC-202's final sanction ask (`.superpowers/sdd/sc202-visual-harness-obsidian/
sc202-comment-final-ask.md`, item 7) asked Scott: "The in-app print preview in a DARK vault
… paints its labels … in a dark grey on near-black that is close to invisible. That is the
plugin's own print-mode styling under a dark theme, unchanged by this ticket and now pinned
honestly. Should in-app print mode force the light palette the way Obsidian's export does?"
Scott's reply ("Lets land this thing") did not address item 7; the SC-202 owner read the
silence as "keep as is" (`decisions.md` line ~582: "(7) dark-twin contrast … → silence =
keep as is"). That was a silence-reading, not an explicit ruling. **Scott's explicit
2026-09-23 ruling above supersedes it**: ~~keep the dark-twin contrast as is~~ → fix it.
Item 8 of the same ask (light-vault twin not pinned, 78 % of nodes differ from the
dark-vault twin) is also affected: once the preview draws its own paper, dark- and
light-vault previews should converge, which is the intended side effect, not a new gap.

### 2026-09-24 — Frame question answered (Linear comment, 11:47 UTC)

**Scott's ruling, verbatim**, replying to the frame-or-no-frame ask:

> "option A is great, go ahead."

**Effect:** option A (white page, black ink, native controls light, NO frame) is explicitly
ruled, not a silence-reading. Option B / Bshadow are dropped. `Needs Review` cleared.

## Open questions for Scott

- ~~**2026-09-23, posted (In Progress + Needs Review):** frame or no frame around the print-preview paper (A vs B / Bshadow; margin size). Owner's recommendation: A, no frame; "if you say nothing, A ships".~~ ANSWERED — see the 2026-09-24 ruling below.

## Deferred findings / tickets filed

- **SC-348** (Backlog, 2026-09-23): role chips print light grey on white at 2.59:1 on every print surface — moves realprint, out of SC-127 scope.

## Log

- **2026-09-23** — Ledger opened; worktree `sc127-print-preview` created (dse `e4bcd0f`).
  Ticket retitled + description rewritten to the new scope; rescope comment posted quoting
  Scott's ruling. Prior-ruling check: SC-170 ledger
  (`docs/superpowers/dse-overhaul/build-ledgers/sc170-real-print-ledger.md`) treats the
  twin as a proxy for real print and notes "the frozen class is dark-only" as a fact, not a
  ruling; SC-202 item 7 silence-reading recorded above as superseded. Nothing else conflicts.
  Round 1 (verify in real Obsidian) dispatched to an implementer —
  `sc127-brief-r1-verify.md`.
- Note for landing: the MAIN checkout's dse clone is dirty (`demo-vault/Welcome.md`,
  `justfile` modified; `compendium-manifest.json`, `demo-vault/montage 1.md` untracked) —
  not mine, looks like camera-run residue from another session. Dispatcher's call at landing.
- **2026-09-23 — Round 1 DONE (implementer): bug CONFIRMED in real Obsidian, dark theme,
  Print preview ON.** Statblock: title `rgb(0,0,0)` on `rgb(28,28,28)` = 1.23:1; "Might"
  label `rgb(51,51,51)` on `rgb(28,28,28)` = 1.35:1; signature-ability box painted white
  with pale-grey text `rgb(218,218,218)` = 1.40:1. Light theme control: all pass (12.6–21:1).
  The harness twin's whole-page-white-below-~1140px is HARNESS-ONLY (real pane stays dark);
  the white signature-ability box is real. CDP `Page.printToPDF` unavailable on Obsidian's
  page target — realprint harness shot stands in. Report `sc127-r1-verify-report.md`, PNGs
  `r1/`. Owner eyeballed `sc127-r1-statblock-dark-preview-on.png`: matches. → Round 2
  (design, reviewer/Opus) dispatched: `sc127-brief-r2-design.md`.
- **2026-09-23 — Round 2 DONE (reviewer/Opus design round): option A recommended and
  adopted by the owner as the implementation base** (paper + ink on the element root;
  paper `@media screen` only so realprint stays byte-identical; `.theme-dark`-scoped block
  re-pointing Obsidian's consumed host tokens to the 1.13.7 light palette so native
  controls go light). Measured: realprint moved 0/130 for every option; twin moved 130/130;
  dark-twin text below 4.5:1 162 → 7 (the 7 = pre-existing role chip). Report
  `sc127-r2-design-report.md`, patches `sc127-r2-option-{A,B,C}.patch`, PNGs `r2/`,
  crops `r2crops/`. Owner eyeballed `A-statblock-charline-two-dark`: readable, correct.
  **Taste call sent to Scott (Needs Review): frame or no frame (A vs B / Bshadow),
  margin.** Owner's recommendation: A, no frame. Implementation of A proceeds in parallel
  (B = A + one paint-only rule; layers on if Scott wants it).
  **Deferred-finding rulings:** (6.1) role-chip 2.59:1 on all print surfaces → **filed
  SC-348** (Backlog, moves realprint, out of SC-127 scope); (6.2) white `:hover` on nested
  feature cards in print preview → fold into r3 as an optional drive-by (scope the hover
  rule out of print if trivial); §5 gate hole (`nativeControlAdjacent` counts hidden chrome
  buttons, 73/75 roots excused) → fold into r3 (fix + tighten the gate); harness-only
  white-below-the-fold → drop (after the paper fix the element covers the whole crop; not
  a plugin defect).
- **2026-09-24 — Round 3 interrupted by a 429 session-limit kill (~23:0x ET 2026-09-23)**,
  owner and implementer both. Dispatcher relayed: no processes alive; the implementer had
  rebased onto develop `0c132d8` (SC-278 landed; freeze baseline still 260 = 130 twin +
  130 realprint) and left seven files uncommitted (docs ×3, `styles-source.css`,
  `theme-print.test.ts`, `printTwinDeltaAllowedSet.test.ts`, `shoot.mjs`), no commits.
  Implementer RESUMED via SendMessage with: commit coherent parts now, foreground gates
  only, re-measure base numbers at `0c132d8`, finish the brief. No reply from Scott on the
  frame question yet → A ships (as the ask said).
- **2026-09-24 — Round 3 DONE (implementer, resumed twice: after the 429 kill, and after
  one more parked-on-background stall that the owner's watcher caught).** dse `6186261` on
  `sc127-print-preview` (base `0c132d8`), superproject `d768ccf`. Battery: tsc/lint clean;
  jest 3935 / 1 skipped / 202 of 203; shots 524, 0 FAIL; freeze exactly 130 twin FAILED /
  0 realprint FAILED; parity 0/0/16. `sc127-rebaseline.txt` 130 lines, deterministic across
  2 clean sweeps. Guards (a)(b)(c), gate-hole fix, both tightenings can-fail proven.
  docs-shots regenerated. Report `sc127-r3-impl-report.md`. → Round 4 independent review
  (reviewer/Opus) dispatched: `sc127-brief-r4-review.md`.
- **2026-09-24 — r3 follow-up rulings:** (1) hover-rule print guard → DROP (inert after the
  fix; other hover rules in the file are unguarded too); (2) host-palette duplication under
  a custom dark theme → DROP as an accepted cost of A (preview shows Obsidian's default
  light controls; documented in the sheet comment); (3) SC-348 already filed. Sanction-ask
  befores taken from `worktrees/sc240-scc-ref-error/.../shots/*--steel-print.png`, which
  hash-match the frozen baseline lines; afters hash-match `sc127-rebaseline.txt`.
- **2026-09-24 — Round 4 review (reviewer/Opus) DONE: FIX ROUND (small).** 0 Critical /
  0 High / 2 Medium / 4 Low / 5 Info; battery reproduced identically; realprint 0/130
  moved on both sweeps and on the base sweep; rebaseline verified (applied to a scratch
  baseline → `freeze OK (260/260)`); screen combos 0 moved. Report
  `sc127-r4-review-report.md`, evidence `r4/`. **Owner rulings:** MED-1 (hover/focus
  form-field tokens missing → charcoal field on hover, 1.3:1) → FIX, and guard (b) becomes
  census-based over every host token consumed by rules matching plugin DOM under the
  preview root, incl. `:hover`/`:focus(-visible)`/`:focus-within` rules (LOW-4 folds in);
  MED-2 (self-test re-implements the exemption) → FIX (shared function); LOW-1
  (`--table-header-border-color`; add `border*Color` to the gate + jest pin) → FIX; LOW-2
  (caret + scrollbar tokens) → FIX; LOW-3 (stale comment) → FIX; I-4 (develop now
  `f6fb208`) → rebase, re-sweep, regenerate `sc127-rebaseline.txt` + after-crops; I-1
  (stock light link accent 4.26:1, identical in realprint) → DROP, host palette not ours;
  I-3 (print-on/off nesting hybrids) → DROP, not a real usage; I-5 noted. Fix round →
  r3 implementer (resumed) `sc127-brief-r5-fix.md`; scoped re-review → r4 reviewer.
- **2026-09-24 — Round 5 (fix round) interrupted by a second 429 session-limit kill
  (~04:0x ET).** Dispatcher relayed: no SC-127 process alive; r5 sweep 1 finished RED —
  the new census guard caught a real miss: `--link-color-hover` on the dark preview root
  resolves to the dark-theme formula (`hsl(calc(258 - 5),calc(88% * 1.05),calc(66% * 1.29))`)
  vs the pinned `.theme-light` (`hsl(calc(258 - 3),calc(88% * 1.02),calc(66% * 1.15))`),
  consumed by `a` — fix = re-declare it in the `.theme-dark` host block. Branch has 4
  commits on `f6fb208` (`3c091a0`, `747ccd7`, `c3062cc`, `af32490`) + uncommitted edits in
  `styles-source.css` and `shoot.mjs`. Fixer resumed via SendMessage.
- **2026-09-24 — r5 fixer mid-round report:** census drift root cause is two-layered:
  (1) `--link-color-hover` / `--link-external-color-hover` were never re-declared (only
  their dependency `--text-accent-hover`); `var()` substitution is eager at the declaring
  element, so re-declaring the dependency alone does nothing — both added; (2) a literal
  `}` inside the fixer's own CSS comment truncated `extractSc127HostBlockBody`'s `[^}]*`
  regex, so the earlier fix attempt looked inert. Sweep 3 running in the foreground.
  → Re-review must check the extractor tolerates (or loudly rejects) a `}` in a comment.
- **2026-09-24 — r5 sweep 3 was NOT green** (owner's grep was case-sensitive and missed
  `PRINT-TWIN DELTA VIOLATED — 4 problem(s)`; the fixer caught it): `treasure-hr` `<hr>`
  `border*Color` `rgb(51,51,51)` twin vs `rgb(228,228,228)` realprint — `--hr-color:
  var(--background-modifier-border)` is another body-level mapping never restated on the
  host block. Caught by LOW-1's new border-colour sampling in the delta gate, NOT by the
  census → the census has a blind spot for this token/selector shape. Fixed
  (`--hr-color` added); sweep 4 running. → Re-review item: why the census missed
  `--hr-color` consumed by `hr`, and whether that blind spot class is closed.
- **2026-09-24 — Round 5 DONE (fixer, resumed by the dispatcher after a third 429).** dse
  `c5e645d` (base `f6fb208`), superproject `4f0df2b`. Battery: tsc/lint clean; jest 3955 /
  1 skipped / 202 of 203; shots 524, 0 FAIL, deterministic ×2; parity 0/0/16; all 6
  findings fixed + can-fail proven; `--link-color-hover` and `--hr-color` also fixed. The
  8 `*--steel-realprint.png` FAILED it saw are **SC-328's sanctioned rebaseline showing
  through** (landed on develop `c524fd2` today; applied to the shared baseline 08:01 ET,
  backup `freeze-baseline.sha256.pre-sc328-bak`) — not drift, NOT a ticket. Dispatcher's
  instruction: rebase onto `c524fd2` (40 commits), re-run the battery, regenerate
  `sc127-rebaseline.txt` + after shots across 2 clean sweeps (the 8 `skills*` twin
  after-hashes will change with SC-328's DOM underneath); expect 130 twin FAILED / 0
  realprint. → Round 5b (rebase) → fixer resumed; then r6 scoped re-review on the final sha.
- **2026-09-25 — Round 5b interrupted (owner killed by a network error EAI_AGAIN ~12:1x ET
  2026-09-24 while watching sweep A).** Dispatcher relayed: sweep A finished clean; sweep B
  never ran; dse rebased onto `c524fd2` with 6 SC-127 commits `ad4b265..b936efa`, clean
  tree; superproject pointer not yet bumped; nothing new from Scott. Resuming the fixer;
  fresh implementer if its transcript is gone.
- **2026-09-25 — Round 5b DONE (fixer):** dse `b936efa` on `c524fd2` (0 conflicts);
  superproject `b770e37` (reset onto `origin/main` `9255a30` + 1 commit re-applying the
  CHANGELOG/SKILL.md edits). Battery: tsc/lint clean; jest 4001 / 1 skipped / 205 of 206
  (base 3983, net +18); shots 524, 0 FAIL, deterministic ×2; freeze exactly 130 twin
  FAILED / 0 realprint / 0 missing; parity 0/0/16. `sc127-rebaseline.txt` 130 lines from
  the hash-identical A/B pair. After shots `sc127-r5b-after-*`. → Round 6 scoped re-review
  (r4 reviewer, resumed) `sc127-brief-r6-rereview.md`.
- **2026-09-25 — Sanction evidence prepared:** befores = `worktrees/sc230-modal-text-size/…/shots/*--steel-print.png`
  (hash-match the shared baseline lines; copied to `sanction/before/`); afters =
  `sc127-r5b-after-*` (hash-match `sc127-rebaseline.txt`). Pairs rebuilt in `sanction/`.
  Owner eyeballed `sc127-r5b-after-initiative-dark-twin-top.png`: correct.
  **Landing note for the dispatcher:** the worktree superproject's `steel-etl`, `v2` and
  `steelCompendium.github.io` checkouts are STALE SYNCS (checkout is an ancestor of the
  pin after the reset onto `origin/main` `9255a30`; 0 dirty files) — `git submodule update`
  / land-stack's stale-pin handling, not SC-127 content. Only `draw-steel-elements` moves.
- **2026-09-25 — Round 6 scoped re-review DONE: FIX ROUND (small), guard code only.** All
  six r4 findings closed in behaviour; battery reproduced (jest 4001/1/205 of 206; shots
  524; freeze 130/0/0; parity 0/0/16); realprint 0 moved; screen combos 0 moved;
  rebaseline verified both sweeps + scratch apply `freeze OK (260/260)`. New: HIGH-A
  (18-literal extractor `[^}]*` still truncates at a `}` in a comment — the r5 comment at
  `styles-source.css:14496` triggers it; sees 1264/6313 chars, 23/59 decls); MED-A (census
  blind spots: gallery DOM lacks `<hr>` etc. so 10 consumed tokens never checked; pseudo-
  element selectors drop silently); LOW-A (border-colour jest pin vacuous); LOW-B
  (`--input-placeholder-color`, `--list-marker-color` dark on the preview). **Owner
  rulings: FIX all four**; MED-A fix shape = make the census DOM-independent (textual
  var() scan of both sheets for consumed tokens; resolve on the preview root; no
  querySelectorAll gating) so dropping `--hr-color` / `--link-external-color-hover` →
  DRIFTED and pseudo-element tokens are counted, not skipped; rebase onto develop
  `619c4bd` (SC-340); regenerate rebaseline + afters (LOW-B moves twins). Fix round → r3
  implementer (resumed) `sc127-brief-r7-fix.md`; scoped re-review → r4 reviewer.
- **2026-09-25 — r7 sweep 1: DOM-independent census fires on 222 of 278 theme-differing
  tokens (1018 consumed), e.g. `--callout-fail` via `.callout[data-callout="failure"]`.
  Owner's ruling (amends the r6 MED-A fix shape):** consumption-scoped censuses always
  leave a blind-spot class, so drop the consumption axis. The `.theme-dark` host block
  restates EVERY token whose `.theme-dark` vs `.theme-light` resolution differs in the
  pinned 1.13.7 sheet (colours/shadows/accent formulas; theme-invariant layout tokens are
  not in the set by definition). The block is GENERATED from the pinned sheet by a script
  (beside `obsidian-app-css.pin.mjs`) between marker comments, never hand-copied; the
  census (guard b) asserts (1) the set is complete — every differing token is restated —
  and (2) each resolves to the `.theme-light` value on a dark preview root. The
  "consumed by" selector may stay as a diagnostic in the DRIFTED message. Internal
  mechanism, not visible → no Scott round-trip. Fix shape sent to the implementer.
- **2026-09-25 — Round 7 DONE (fixer, resumed once more after a 429):** dse `4c05379`
  (`4ab8fc8`, `be45cbe`, `4c05379`) on develop `619c4bd`; superproject `795c2ae` on
  `origin/main` `4e4c61b`. Battery: tsc/lint clean; jest 4060 / 1 skipped / 208 of 209
  (base 4056, +4; `sidebarEncounterHandoff.test.ts` is a pre-existing load flake, clean in
  isolation and on rerun); shots 524, 0 FAIL, deterministic ×2; freeze 130/0/0 both
  sweeps; parity 0/0/16. Generator `visual-harness/obsidian-light-island.mjs`: 1096 pinned
  tokens checked, 295 differing restated, no reachability filter; can-fails (delete a
  line / edit a value → DRIFTED naming the token). HIGH-A retired (extractor gone), LOW-B
  closed. Rebaseline 130 lines ×2; afters `sc127-r7-*`. → Round 8 scoped re-review (r4
  reviewer, resumed).
- **2026-09-25 — Round 8 scoped re-review DONE: FIX ROUND (small).** All four r6 findings
  closed; battery reproduced (jest 4060/1/208 of 209; shots 524; freeze 130/0/0; parity
  0/0/16); realprint 0; screen combos 0; rebaseline verified ×2 + scratch apply; island
  complete in practice (34,697 nodes, 0 value diffs dark twin vs light twin). New: MED-B
  (generator bakes the DEFAULT accent `258/88%/66%` into 34 tokens — with a custom accent
  the preview's checkboxes/tags/links are purple while the export is the user's colour; no
  gate sees it because gates run at the default accent); LOW-C (jest block-vs-generator
  test skips mapping-only tokens, never compares values, always skips in CI — comment
  overclaims); LOW-D (three worktree submodules still stale). **Owner rulings: FIX all
  three** — MED-B: resolve with sentinel accent values and rewrite back to
  `var(--accent-h/s/l)`; add an in-run correctness pass under a non-default accent, which
  must fail on today's block (can-fail) and pass after; LOW-C: compare values, include
  mapping-only tokens, fix the comment, state the CI skip honestly; LOW-D:
  `git submodule update -- steel-etl v2 steelCompendium.github.io`. → r9 fix (implementer,
  resumed); r10 scoped re-review (reviewer).
- **2026-09-25 — r9 sweep A DRIFTED 34/295 was a bug in the new guard, not a stale
  bundle:** the default-accent correctness pass compared the committed block's RESOLVED
  value against the generator's FORMULA text (`var(--accent-h)…`), so every accent token
  was doomed to mismatch. Fixed with a separate `lightDefault[t]` (the pinned sheet's
  `.theme-light` resolved at its own default accent). `--check` mode confirms the
  generated block itself was correct. Re-sweeping (`sc127-r9-sweepA2.log`). → r10
  re-review must confirm the guard's two passes each compare like with like and each
  can-fail independently.
- **2026-09-25 — r9 sweep A2 crashed inside the new guard** (`TypeError: Cannot read
  properties of undefined (reading '--background-modifier-active-hover')` — the new
  `lightDefault` map not threaded to the call site). Implementer told to fix, prove both
  passes on a narrow run first, add a jest unit test around the guard's comparison
  helpers, then the full sweeps. r10 re-review item: the guard's error handling — a
  missing/wrong-shaped map must fail in jest, and a guard exception must read as a guard
  failure, not a generic "sweep exception".
- **2026-09-29 — Round 9 DONE (fixer):** dse `ba0cd28` (r9 commits `2c4d199`, `87769c3`,
  `1396c74`, `ba0cd28`), superproject `dee6aad`. MED-B fixed (accent tokens kept as
  formulas; second in-run pass at a non-default accent; can-fail 1/295 on a baked
  literal); LOW-C fixed (manifest-based jest, never skips in CI); LOW-D synced. Two guard
  bugs found by the sweeps in the new code and fixed (`lightDefault` comparison target;
  map not returned → crash), comparison loops extracted to jest-tested helpers (+8
  tests). Battery: jest 4072/1/209 of 210; two sweeps 524, 0 FAIL, island OK at default +
  non-default accent, delta OK; parity 0/0/16. Twin hashes byte-identical to the r7
  rebaseline (0 moved). **Caveat: develop moved 77 commits (base `4c05379` → `dfb7395`),
  shared baseline now 262 lines; 171 mismatches on the un-rebased branch = base drift.**
  Owner's ruling: the sanction ask carries landing-tree hashes, so REBASE NOW (r9b), not
  at landing; then r10 scoped re-review on the rebased tree; then the ask.
- **2026-10-01 — Round 9b DONE (fixer):** dse rebased twice (develop moved mid-round:
  `dfb7395` → `9ded832`), 0 conflicts; final dse `5329c56`. Superproject rebased onto
  `origin/main` `43ea28a`: SKILL.md auto-merged (SC-127 supersession note + every newer
  rebaseline record intact); CHANGELOG conflict resolved keeping both; the two pointer-bump
  commits collapsed into one (`17e1291`, local-only amend). Battery: tsc/lint clean; jest
  4252 / 1 skipped / 214 of 215; shots 544, 0 FAIL ×2, island OK at both accents, delta OK
  across 135 ids; parity 0/0/**24 DECLARED** (grown by SC-232/235, exit 0); freeze exactly
  131 twin FAILED / 0 realprint / 0 missing both sweeps (the 131st = SC-318's
  `perk-headings`); 4 ids on the tree are not in the baseline (unrelated widenings
  pending). `sc127-rebaseline.txt` 131 lines, deterministic; r7 file kept as `.bak`.
  → Round 10 scoped re-review dispatched.
- **2026-10-01 — Round 10 scoped re-review: APPROVE** (dse `5329c56`, superproject
  `17e1291`). MED-B/LOW-C/LOW-D closed; battery reproduced (jest 4252/1/214 of 215; shots
  544; freeze 131/0/0; parity 0/0/24); realprint 0 moved (incl. the 4 unbaselined ids);
  screen combos 0 moved; 131-line rebaseline verified ×2 + scratch apply 262/262.
  **Owner rulings:** L1 (guard exception shows as generic sweep exception), L2 (no jest on
  the generator's return shape), L3 (tautological manifest-vs-sheet test) → FOLD into a
  small plumbing round r11 (shoot.mjs guard/jest only; stop condition: any twin or
  realprint byte moves → report, do not proceed) run in PARALLEL with the sanction ask;
  scoped re-review r12 of that delta. I-1 (4 unbaselined ids' twins move with SC-127;
  post-SC-127 hashes in `r10/sc127-r10-sweep1-all.sha256`) → landing note for the
  dispatcher. I-2 (installed Obsidian 1.14.3 → island would grow 295 → 320 after a pin
  bump) → Backlog ticket. **Sanction ask posted** (In Progress + Needs Review) with the
  three hash-verified pairs.

### 2026-10-02 — Rebaseline SANCTIONED (Linear comment `da76ab81`, 16:15 UTC)

**Scott's ruling, verbatim**, replying to the 2026-10-01 sanction ask ("Approve: re-pin all
131 dark-theme print-preview shots … 0 realprint … 'Sanctioned' is enough"):

> "approved"

**Effect:** the dispatcher applies `sc127-rebaseline.txt` at landing (dated backup +
dated record in `dse-verify`'s SKILL.md) and lands the branch. The sanction covers the
VISIBLE change (every `*--steel-print.png` twin re-pinned once to the paper fix; 0
`*--steel-realprint.png` lines) — the exact hashes come from the REBASED landing tree
(SC-156/SC-154 precedent). If the set ever changes beyond twin-only re-pins, it goes back
to the dispatcher before land-ready. `Needs Review` cleared 2026-10-08 (relayed by the
dispatcher; six days elapsed).
- **2026-10-08 — Plan to land-ready (dispatcher's instruction):** after r11 + its scoped
  re-review: rebase onto current `origin/develop`; full battery; regenerate
  `sc127-rebaseline.txt` across 2 clean sweeps; freeze must be exactly N twin FAILED / 0
  realprint, N = 131 + any newly baselined ids, each diagnosed. Then land-ready report with
  the I-1 note (4 unbaselined ids' twins move with SC-127; hashes in
  `r10/sc127-r10-sweep1-all.sha256`).
- **2026-10-09 — Round 11 DONE (fixer):** dse `3c2ca0b` (`79d43eb` L1, `3c2ca0b` L2+L3),
  superproject `89ef816`. L1 named guard failure + exit 1 (can-fail via a real sweep); L2
  return-shape jest pin (can-fail); L3 manifest-vs-sheet test derived independently from
  the cached sheet (can-fail on `--color-base-30`). jest 4253/1/214 of 215; one full sweep
  544, 0 FAIL, all OK lines; parity 0/0/24; **0 bytes moved** (131 twins == rebaseline,
  realprint == baseline). `origin/main` moved mid-round (`a65a429`, SC-378) — left for the
  landing rebase. → Round 12 scoped re-review (reviewer, resumed).
- **2026-10-09 — Round 12 scoped re-review: APPROVE** (dse `3c2ca0b`, superproject
  `89ef816`). 0 bytes moved (131 twins == rebaseline; realprint == baseline; all 544 PNGs
  == r10 sweep; scratch apply 262/262). L1/L2/L3 closed with the reviewer's own probes.
  Info: `origin/develop` now `8a256c5`, `origin/main` `a65a429`; Obsidian 1.14.4 installed
  (pin stays 1.13.7, SC-376). `sidebarEncounterHandoff.test.ts` flaky under load (known).
  → Round 13 landing rebase (implementer) `sc127-brief-r13-landing-rebase.md`.
- **2026-10-09 — Round 13 DONE (landing rebase): LAND-READY.** dse `1ac4e5a` on
  `origin/develop` `8a256c5` (0 conflicts; generator `--check` up to date); superproject
  `4836147` on `origin/main` `f549761` (SKILL.md + CHANGELOG auto-merged; gitlink resolved;
  stale local steel-etl checkout re-synced). Battery: tsc/lint clean; jest 4254 / 1 skipped
  / 214 of 215; shots 544, 0 FAIL ×2, all OK lines; freeze exactly 131 twin FAILED / 0
  realprint / 0 missing (baseline still 262); parity 0/0/24. `sc127-rebaseline.txt` 131
  lines regenerated from sweep B, byte-identical to the sanctioned file. I-1:
  `sc127-r13-unbaselined-ids.sha256` (4 ids × twin+realprint). Reported land-ready to the
  dispatcher.
- **2026-10-09 — LANDED by the dispatcher.** dse `origin/develop` `1ac4e5a`; workspace
  `origin/main` merge `11e8604` (+ dated rebaseline record `38174e1`); baseline re-pinned
  (131 twin / 0 realprint, backup `freeze-baseline.sha256.pre-sc127-bak`), `freeze OK
  (262/262)`; worktree removed; ledger preserved to `build-ledgers/sc127-print-preview/`
  (`8238c69`). Not deployed, not tagged. Landed note posted; SC-127 → Done.
