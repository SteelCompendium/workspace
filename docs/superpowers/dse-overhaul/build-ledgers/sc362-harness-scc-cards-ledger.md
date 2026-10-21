# SC-362 decisions ledger

Ticket: SC-362 — DSE visual harness cannot render by-SCC display cards (no compendium in the
browser shots harness). Owner: ticket-owner (Opus 5.5). Worktree:
`/home/scott/code/steelCompendium/worktrees/sc362-harness-scc-cards` (branch
`sc362-harness-scc-cards` in every submodule). dse base: `develop` @ `0ce76dd`.

## Scope (from the ticket description, written by Scott 2026-09-24 — verbatim)

> Fix direction: give the harness a small fixture compendium (a handful of real `md-dse`
> files) and add by-SCC captures for at least the rule card, so these paths get shots and
> become eligible for the freeze set.

## Dispatcher constraints (2026-10-21, verbatim)

> SC-349 is in flight changing visual-harness/shoot.mjs capture sizing (tall-capture un-clip,
> freeze rebaseline pending) — keep your harness changes additive (new fixtures/shots), avoid
> moving existing frozen lines, and expect to rebase onto SC-349.

> Also see SC-469 (not in this project): the two ds-scc degrade cards have no harness
> fixture — related, note it in your ledger.

## Owner rulings

- 2026-10-21: **SC-469 stays out of scope.** It is a separate ticket outside this project.
  But it needs the same seam (a stub compendium plus an SCC resolver in
  `visual-harness/entry.ts`), so build that seam so SC-469 can reuse it — e.g. a resolver
  that could later be told to return "web"/not-installed — without adding the degrade-card
  fixtures here.
- 2026-10-21: **The freeze change is a widening (additions-only).** Per dse-verify, a
  widening needs no Scott sanction. Zero existing frozen lines may move: all 572 existing
  PNGs must stay byte-identical, and `freeze OK (276/276 …)` must hold before widening.
- 2026-10-21: **Edits to `shoot.mjs` are kept to additive registrations** (new capture
  entries / new fixture ids), no changes to sizing, timing or existing entries — SC-349 owns
  capture sizing.

## Scott rulings

(none yet)

### Owner rulings after round-0 survey (2026-10-21)

- **Plan accepted** as written in `sc362-r0-survey-report.md`: real `SccResolver` +
  `createCompendiumIndex` over the harness mock vault, seeded from `test/fixtures/md-dse`
  via the existing `.md` text loader; wiring is **per fixture** (mode `none | fixtures |
  anchors-only`, default `none`) so the 18 existing fixtures whose DOM would change under
  global wiring stay untouched. `anchors-only` (or equivalent) is the hook SC-469 will use;
  no degrade-card fixtures are added here.
- **Fixture set: `rule/by-scc` (opportunity-attack) and `condition/by-scc` (Bleeding).** Kit
  (nested ds-feature renders raw `<pre>`), class (too tall) and treasure (no twin) are
  excluded.
- **Widening is 2 lines per capture id** (`--steel-print` + `--steel-realprint`), so 4 lines,
  276 → 280. ~~one `*--steel-print.png` line per new capture id~~ superseded by the survey's
  measured finding (baseline carries print + realprint pairs; SC-390/SC-379 widened in pairs).
  Final hashes are taken on the final base (after any SC-349 rebase).
- **Folded into round 1:** fix the three stale comments the survey found
  (`entry.ts:1925-1928`, `fixtures.test.ts:24-27`, `entry.ts:362-366`), and add a guard so a
  by-SCC fixture that fails to resolve (renders `.dse-ref-notice` / `.dse-ref-web-card` /
  `.dse-error-card` instead of the resolved card) fails a gate — today a notice or web card
  passes green.
- **Note for SC-469:** its description says `mountFromParams` counts a notice card as a
  failed shot; the survey measured that it does not (only `.dse-error-card` fails). Record
  this when SC-469 is picked up.

### Round 1 (implementer) — 2026-10-21
- dse `1684455` on `0ce76dd`. Gates green; shots 580; freeze 276/276; widening 4 lines in `sc362-widening.txt`.
- Follow-up ruling: the new `.dse-ref-notice` guard in `mountFromParams` has no opt-out; SC-469's
  degrade-card fixtures will need an `expectNotice`-style opt-out. **No new ticket** — SC-469
  already owns that work and its description already lists the `mountFromParams` exception;
  mention it in the SC-362 closing comment. (Note: after this change SC-469's description
  is accurate again — the notice card now does fail a shot.)
- Follow-up: `npm run shots` ~12 min under load exceeds the 600 s foreground limit — dropped
  (known environment fact, not a defect of this ticket).

### Dispatcher heads-up (2026-10-21, SC-349)
> SC-362 must not move any of those print shots. Keep your harness change additive, and plan
> to rebase onto SC-349 if it lands first.
SC-349's rebaseline (40 steel-print lines) is in
`.superpowers/sdd/sc349-skills-print-clip/rebaseline.txt`. Round 1 held freeze 276/276
byte-identical (so none of the 40 moved here) and `shoot.mjs` has zero edits; no `by-scc` id
appears in SC-349's list. If SC-349 lands first: rebase, re-run shots, re-hash the 4 widening
lines on the new base.

### Dispatcher (2026-10-21): dse develop moved 0ce76dd → 1c271b5 (SC-470)
> New baselines: jest 5428 / 1 skipped / 231 of 232, lifecycle 30/30, e2e 88/92 with 4
> known-bug and 64/64, freeze 276/276, parity 0/0/24. Land-ready must be on 1c271b5 (or
> newer), with the superproject rebased onto origin/main.
Plan: after the round-2 review, the fix round (or a rebase round if review is clean) rebases
the dse branch onto 1c271b5 and the superproject onto origin/main, re-runs the full battery,
and re-hashes the 4 widening lines. Expected on the new base: jest 5428+11 = 5439 / 1 / 231 of
232; lifecycle 30/30; e2e 88/92, 0 failed, 4 known-bug, 64/64; shots 580; freeze 276/276;
parity 0/0/24.

### Round 2 (independent review) — 2026-10-21: APPROVE, 0 HIGH / 0 MEDIUM
Report: `sc362-r2-review-report.md`. Owner rulings on its findings:
- LOW-1 (`fixtures.test.ts:191-202` comment says no-compendium test exercises the notice
  guard; it renders an error card) — **fold**: reword comment, assert `'error card'`.
- LOW-2 (`entry.ts:372-375` heroSparse comment says "notice"; it renders
  `.dse-hero__ability-issue`) — **fold**: name the class.
- INFO-1 (SC-469 opt-out needed in two places: `mountFromParams` `entry.ts:2426` AND the
  per-fixture loop `fixtures.test.ts:76`) — **no ticket**; SC-469 owns it; name both places in
  the SC-362 closing comment.
- INFO-2 (`anchors-only` and `none` render the same ds-scc card) — **drop**: documented
  behavior, the compendium check precedes the resolver; mode stays as the SC-469 hook.
- INFO-3 (`entry.ts:1942` fallback comment omits `probeSource`) — **fold** (one comment line).
- INFO-4 (`entry.ts:1929` resolver built from `DEFAULT_SETTINGS`, not `deps.settings`) —
  **fold**: use `deps.settings` (same object today; correct by construction).
- INFO-5 (pre-existing: 2px print bottom rule, vault links tinted on realprint, lint does not
  cover visual-harness/ or test/) — **drop**: predates SC-362, unchanged by it, no frozen
  surface moved.

### Dispatcher (2026-10-21): dse develop moved 1c271b5 → 08206e3 (SC-466) — supersedes the 1c271b5 target
> New baselines: jest 5446 / 1 skipped / 232 of 233, lifecycle 30/30, e2e 89/93 with 4
> known-bug and 64/64, freeze 276/276, parity 0/0/24. Land-ready must be on 08206e3 (or
> newer), with the superproject rebased onto origin/main.
~~Land-ready on 1c271b5~~ superseded: land-ready on 08206e3 or newer. Fix-round implementer told
to rebase onto 08206e3 and run the battery there.

### Round 3 fix + round 4 scoped re-review — 2026-10-21: APPROVE, no findings
dse `bc4a0c5` (fixes) on `aff5034` (impl) on `08206e3`. Superproject `f029e59` = origin/main
(pointer bump left for landing). Battery on 08206e3: jest 5457/1/232 of 233, lifecycle 30/30,
e2e 89/93 0 failed 4 known-bug 64/64, shots 580 0 FAIL, freeze 276/276 x2, parity 0/0/24.
Widening `sc362-widening.txt` 4 lines (unchanged hashes), 276 → 280, additions-only.
LAND-READY. Ask to Scott: eyeball the two new by-SCC cards (they become frozen).
