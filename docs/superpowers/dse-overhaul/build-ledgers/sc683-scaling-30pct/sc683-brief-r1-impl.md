# SC-683 r1 — implementer brief: Card size slider minimum 80% -> 30%

You are an implementer worker for ticket SC-683. Your final text goes to the ticket-owner (an
agent), not a human. **You never call the tracker (Linear)** — not to read, not to post.

## 1. Context loading (do this first)

1. Read the decisions ledger:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc683-scaling-30pct/sc683-decisions.md`
   It is the whole spec. There are no prior-round reports.
2. Worktree: `/home/scott/code/steelCompendium/worktrees/sc683-scaling-30pct`
   Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc683-scaling-30pct/draw-steel-elements`,
   branch `sc683-scaling-30pct`, cut from `develop` @ `9be108c9`.
   **All implementation happens there. Verify `pwd` / the absolute path before every write.**
   Never write under `/home/scott/code/steelCompendium/workspace/` except your report file in
   the ledger dir (section 5) — that main checkout is shared global state. Its dirt in
   `draw-steel-elements` (`demo-vault/…`, `compendium-manifest.json`) is Scott's live vault:
   expected, not yours, do not report it.
3. Fetch and confirm the base first:
   `git -C /home/scott/code/steelCompendium/worktrees/sc683-scaling-30pct/draw-steel-elements fetch origin`
   then check `origin/develop` is still `9be108c9`. If it moved, rebase onto the new sha and say
   so in the report. **Every git command uses `git -C <absolute path>`, never `cd X; git …`.**
4. Read the plugin's `AGENTS.md` (in the plugin repo) and the gate skill
   `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
   **That file is ~490 KB — do NOT read it whole.** Read lines 1–266 (battery table, devbox
   wrapping, exit-code footgun) and lines 1551–1554 ("Current expected numbers", CURRENT), and
   grep it for anything else you need (e.g. the lifecycle `--only` parts, e2e notes at line 207).
5. Fresh worktree has no `node_modules`: run `npm ci` in the plugin dir once before any gate
   (through `devbox run -c <abs plugin dir> -- bash <script file>`, output to a log).

## 2. The task

Scott's ruling, verbatim (ticket title + description, 2026-11-20):

Title: "DSE Scaling: allow it to go to 30%"

> Currently scaling can go to 80%. Someone requested it to go smaller.  Lets go with 30% min

Owner calls O1–O3 in the ledger scope it: this is the **Card size** slider only.

**Code**

- `src/prefs/scale.ts`: `CARD_SCALE.min` 0.8 -> **0.3**. Max stays 1.2, step 0.05, default 1.
  `TEXT_SCALE` and `TYPE_SCALE` do not change.
- Fix every comment the change makes false. In `scale.ts`: the header says both ranges are the
  site's constants and "deliberately SYMMETRIC about the 1.0 default"; the `CARD_SCALE` doc says
  it is the site's `CARD_MIN/MAX`; the `TYPE_SCALE` doc says "Deliberately the SAME numbers as
  CARD_SCALE" and "all five Typography sliders' thumbs sit at the same centre track position".
  After this change: Card size is 0.3–1.2 (SC-683, Scott: "Lets go with 30% min"), it no longer
  mirrors the site's `CARD_MIN = 0.8` (v2 `settings-core.js:23` is unchanged, on purpose), and it
  is no longer symmetric — its thumb at 100% is off-centre; the other four stay centred.
  Also the styles-source.css comment near line 15497 that says card-scale was probed "at
  0.8x/1.2x": leave the historical probe statement true (it was probed at those values) — do not
  rewrite history, only fix statements about the CURRENT range.
- `src/prefs/catalog.ts`: the Card size help text says "(80%–120%)" -> "(30%–120%)". The three
  type-role help texts keep "(80%–120%)".
- Grep `src/` for any other place that hard-codes the card range or clamps `--dse-card-scale`
  (`prefOverrides.ts`, `tokens.ts`, `textScaleRoot.ts`, `SettingsPreview.ts`, the settings tab
  slider builder). Anything that still stops at 0.8 for the card scale is in scope.
- No data migration: stored values 0.8–1.2 are valid in the new range. Confirm, don't assume.

**Tests** (TDD: change the expectation first, watch it fail, then change the constant)

- `test/unit/prefs/scale.test.ts`: range pin, the symmetry assertion (keep it for `TEXT_SCALE`;
  add it for `TYPE_SCALE` if not already there; `CARD_SCALE` is now asymmetric — assert the new
  range), below-min clamp (`0.5` is now in range; clamp cases need new inputs such as `0.1` and
  `0.27`), and add: every step from 0.3 to 1.2 (19 values) snaps to itself as an exact
  two-decimal number (float drift check across the longer range).
- `test/unit/prefs/catalog.test.ts:118`, `test/dom/views/settings-integrity.test.ts:108-116`
  (`cardScale: 0.1` now stamps `0.3`), `test/dom/prefs/fontPrefs.smoke.test.ts:61`, and any other
  test that pins 0.8 as the card minimum. Do not weaken a test — move its number.
- `e2e/specs/settings/sliders.e2e.ts:40`: card-scale min `0.8` -> `0.3` (Home key reaches 30%,
  on disk, in the shown value, and as the inline custom property).
- Do not add e2e ids or coverage pairs unless you find a real gap; say so if you do.

**Docs** (docs are part of done)

- Plugin: `docs/settings.md:40` and `docs/styling-statblocks.md:58` — Card size is 30%–120%.
  Grep the plugin's `docs/*.md`, `README.md` for other statements of the card range.
  `docs/superpowers/**` is historical — leave it.
- Changelogs: the plugin has `draw-steel-elements/CHANGELOG.md` and the workspace has
  `CHANGELOG.md`. Follow each file's own convention for a user-facing bullet under
  `## Unreleased` (read the neighbouring bullets; plain words, what the user sees).
  **The workspace-level files live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc683-scaling-30pct/CHANGELOG.md` — never under
  `/home/scott/code/steelCompendium/workspace/`.** Commit the superproject doc change in the
  worktree's superproject (branch `sc683-scaling-30pct`); do NOT commit a submodule pointer bump
  — landing does that.
- If `DESIGN.md` in the worktree superproject states the card range, fix it there too.

**Commits**: commit inside the plugin repo after each coherent step (`fix(SC-683): …` /
`test(SC-683): …` / `docs(SC-683): …`). **No co-author trailers, no AI attribution of any kind
in commit messages.** Never push. Never tag. Never create a release.

## 3. Evidence (Scott reviews from images; the owner eyeballs them first)

Produce PNGs with a scratch script (NOT committed) — the visual harness (`visual-harness/`,
Chromium) is fine; use the real pref path (`cardScale` pref) where you can, otherwise stamp
`--dse-card-scale` on the element root and say which you did. Default (Steel) theme, the repo's
normal capture width.

- A. One monster statblock at Card size **100%, 80%, 50%, 30%** — one PNG per value, or one
  contact sheet with each value printed as a text label on the image.
- B. One ability/feature card (`feature` element) at **100% and 30%**.
- C. The settings tab Typography group with Card size at **100%** and at **30%** (shows the
  shown value and where the thumb sits next to the other four sliders). If the settings tab
  cannot be captured in the harness, say so and capture what the e2e real-Obsidian run can.

While capturing, **look at the 30% and 50% renders and probe**: horizontal overflow, clipped or
overlapping text, a nested card inside a statblock (the nested-reset rule near
styles-source.css:8440 must still zoom exactly once), a card inside a modal, and whether text
hits a browser minimum-font-size floor. Report facts with measurements (e.g. bounding-box
widths, computed `zoom`), not opinions. Do not "fix" layout at 30% — report it; the owner rules.

## 4. Gates — the full `dse-verify` battery, in order

Expected (CURRENT at dispatch, dse `develop` @ `9be108c9`):

- tsc (incl. `tsc -p e2e`) clean · lint clean
- jest: baseline **14438 passed / 1 skipped** (with the shots cache; a fresh worktree reads one
  fewer passed and 2 skipped until `npm run shots` has run). Report baseline + your delta.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 64/64 ok, 0 failed` (run as the seven `--only` parts in
  the skill, report the union)
- e2e: `OBSIDIAN-E2E done: 794/805 ok, 0 failed, 11 known-bug, coverage: 476/476 pairs`
- shots **592** · freeze **280/280**, 0 FAILED · parity **0 GAPs / 0 undeclared WARNs / 24
  declared deferrals**, run last.

A freeze FAIL means frozen print bytes moved: stop, do not touch the baseline
(`.superpowers/sdd/freeze-baseline.sha256` is never edited by agents), report it.
Print/export always use 100%, so no frozen shot should move.

Known flakes under load are named in the skill's CURRENT/PREVIOUS notes (e.g. INIT-W09,
NEGO-R05): a red there is re-run alone before it is believed, and reported either way.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc683-scaling-30pct/sc683-r1-impl-report.md`.
**It must open with a ≤10-line executive summary** (verdict, shas, gate numbers, evidence paths).
If the report-file write is blocked by your harness, return the report inline.

Copy the evidence PNGs to
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc683-scaling-30pct/evidence/`
with names starting `sc683-`.

## 6. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose:

- STATUS: DONE | NEEDS_CONTEXT | BLOCKED
- plugin branch + head sha; superproject branch + head sha; base sha
- every gate's measured summary line
- files changed (list)
- the 30%/50% probe measurements
- **the absolute filesystem path of every evidence artifact** (PNGs, logs, report)
- `Drive-by fixes:` (already made — obviously correct, local to a file you touched, cannot move
  a gate baseline) and `Follow-ups:` (left alone). Workers never file tickets.

## 7. Footguns (each has cost real time here)

- **You cannot `SendMessage` me** — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see
  your completion notification and will resume you with the answer. If you ever do send a
  message anyway, its FIRST WORD must be `SC-683:`.
- **Devbox**: node/npm are not on PATH. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc683-scaling-30pct/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command. An echoed `$?` inside `bash -c '…'` always reads 0 —
  record exit codes inside a script FILE, and read each gate's own summary line. Never pipe a
  gate (`| tail` eats the failure).
- **Scratch**: the session scratchpad is shared by every agent. Use a private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc683-impl-r1/`
  with uniquely named scripts and logs. Create scratch files with the Write tool, not heredocs.
- **Run each gate as one blocking foreground call** with output redirected to a log file (the
  600 s stream watchdog kills silent agents; lifecycle parts and e2e are split per the skill to
  fit the tool timeout). No `run_in_background`, no Monitor. If a gate must run in the
  background, poll its own log / exit-code file — never wait for a completion notice.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- **No `rm` with a shell-variable or glob target** (it prompts and hangs a background worker).
  Overwrite with `>`, or use fresh unique filenames. Never `rm -rf` a shared `/tmp` glob
  (`/tmp/dse-obsidian-lifecycle-*` belongs to every concurrent effort) and never touch
  `.superpowers/` outside `sc683-scaling-30pct/`.
- **Never `pkill`/`killall` by pattern.** Kill only by PID, and only a PID whose
  `readlink /proc/<pid>/cwd` is inside your worktree.
- **Stale superproject pin**: if `token-coverage.test.ts` goes red on a token-map row you did
  not touch, compare the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the
  main checkout's copy before believing it; clear with the test's `DSE_TOKEN_MAP_PATH` override.
- `npm ci` again after any rebase that changed `package.json`.
