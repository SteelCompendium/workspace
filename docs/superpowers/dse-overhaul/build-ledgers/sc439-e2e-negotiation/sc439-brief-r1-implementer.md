# SC-439 round 1 — implementer brief

You implement SC-439: real-Obsidian e2e + jsdom functional coverage of the negotiation tracker
(`ds-negotiation`). Your final text goes to the SC-439 ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc439-e2e-negotiation/decisions.md`.
  It holds the ticket scope verbatim, Scott's rulings verbatim and the owner rulings. It is your
  only source of ticket history. **Workers never call the tracker** (Linear) — not to read, not
  to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc439-e2e-negotiation`, branch
  `sc439-e2e-negotiation` in `draw-steel-elements/`. Verify with `git -C` before every write. Never
  edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared main checkout)
  except your report file in the ledger dir. Its dse dirt (modified `demo-vault/Welcome.md`,
  untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected,
  not yours, don't flag it.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc439-e2e-negotiation/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `6785fa06`. If it moved, `git rebase origin/develop` and
  say so in the report (then `npm ci` if `package.json`'s obsidian version changed). Run `npm ci`
  once in the worktree's `draw-steel-elements/` if `node_modules` is missing (through devbox).
- Read `draw-steel-elements/e2e/README.md` first — it is the model. Then the prior art:
  - Landed: the SC-437 initiative rollout, ledger + brief + reports at
    `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc437-e2e-initiative-tracker/`
    (read the r1 report's executive summary and its reuse notes; the r2 review report's summary
    shows what the reviewer looks for).
  - In flight, the closest shape (read-only, grep/read only, never write there): SC-438 montage,
    ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc438-e2e-montage/`
    (`decisions.md` "Rounds" section and `sc438-r2-review-report.md` summary: the r2 reviewer's
    findings — vacuous default-state tests, tests that only assert a modal closed, ids built by
    template strings that the runner can't see, undeclared `press:Enter` pairs — are what you must
    not repeat), code at `/home/scott/code/steelCompendium/worktrees/sc438-e2e-montage/draw-steel-elements/`
    (`e2e/manifest/montage*.ts`, `e2e/specs/montage/`, `e2e/driver/montage.ts`).
  - Code prior art on develop: `e2e/manifest/initiative.ts`, `e2e/manifest/counter.ts`,
    `e2e/manifest/chrome.ts`, `e2e/specs/initiative/`, `e2e/specs/counter/`, `e2e/driver/dse.ts`,
    `e2e/driver/pool.ts` (copy its shape for a `negotiation.ts` driver, don't extend it),
    `src/framework/kit/controlId.ts`.
- Then the surface: `src/elements/negotiation/` (`view.ts`, `model.ts`, `definition.ts`,
  `example.yaml`, `fixture-ended.yaml`), `src/drawSteelAdmonition/negotiation/`
  (`PatienceInterestView.ts`, `EndBandView.ts`, `MotivationsPitfallsView.ts`, `ArgumentView.ts`,
  `LearnMoreView.ts`), `src/model/NegotiationData*`, the existing jest
  `test/dom/elements/negotiation.test.ts`, `test/unit/model/negotiation*.test.ts`, and the census
  files `test/dom/e2eCensus.test.ts` and `e2e/specs/_census.e2e.ts`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — it is
  ~450 KB with some 60 KB lines: do NOT read it whole. Read the battery table rows (lines ~20-80,
  cut long lines with `cut -c1-1500`), "Jest timeouts under load" (line ~156), "Lifecycle and e2e
  notes" (line ~195), and "Current expected numbers" (grep `^## Current expected`). Don't edit it.

## 2. The task

Scope and Done-bar: quoted verbatim in the ledger's "Ticket scope" section — read it there. The
owner rulings in the ledger bind you; the ones that shape the work, quoted:

> **Surface boundary.** In scope: every interactive node `ds-negotiation` renders —
> `src/elements/negotiation/view.ts` (card head, tabs, the reset menu button and its menu item)
> and the views it mounts from `src/drawSteelAdmonition/negotiation/`: `PatienceInterestView.ts`,
> `EndBandView.ts`, `MotivationsPitfallsView.ts`, `ArgumentView.ts`, `LearnMoreView.ts` — plus
> the negotiation's chrome-panel items. The reset menu is Obsidian's native `Menu`: drive it in
> real Obsidian; if a native menu item cannot carry `data-dse-control`, record the pair on the
> menu BUTTON (or follow whatever pattern an existing manifest already uses for a native Menu
> item) and say which. NOT in scope: the generic block edit form (`src/authoring/FormModal.ts`)
> except as a `reach` row if the negotiation's own chrome opens it and an existing manifest
> already lists it; the sidebar host. Ids prefixed `negotiation.` (implementer may refine, say
> why).

> **Bug flow** (same as SC-435/436/437/438). Workers never touch the tracker. A worker that finds
> a product bug commits its coherent work, finishes the survey, and returns
> `STATUS: NEEDS_CONTEXT` ONCE with every bug's title, repro, file:line and severity. The owner
> files the Backlog ticket (DSE 7.0.0, Bug + DSE Plugin, related to SC-439) and resumes the
> worker with the key, which the worker then cites in `knownBug('SC-…')` / `test.failing`. No
> product fixes in this ticket; product source may change ONLY to add `data-dse-control`
> attributes (and census plumbing) — no behavior change.

> **Scenario ids.** e2e ids `NEGO-*` (e.g. `NEGO-T01` tabs, `NEGO-P01` patience, `NEGO-I01`
> interest, `NEGO-M01` motivations, `NEGO-A01` arguments, `NEGO-R01` reset — implementer picks
> the letters). Scenario ids are global. Census ids: develop's highest is `[CENSUS-09]`; SC-438
> (in flight, landing soon) uses `[CENSUS-10..12]`; SC-615 adds none. Take `[CENSUS-13]` onward.
> Never a bracketed ticket id in a test title (SC-577).

Confirm `[NEGO-` is unused: `grep -rn '\[NEGO-' e2e/` in your worktree and in the SC-438 and
`/home/scott/code/steelCompendium/worktrees/sc615-initiative-quickadd-focus/` worktrees (read-only).
Every scenario id must appear LITERALLY in its test title (no template strings — SC-438 r2 L-4).

> **Overlap with parallel owners** SC-438 (montage e2e: touches `e2eCensus.test.ts`,
> `_census.e2e.ts`, `e2e/driver/dse.ts`, `e2e/README.md` fixture table) and SC-615 (initiative
> quick-add focus). Keep edits to shared files small and additive so a rebase is mechanical;
> whichever lands second rebases and re-counts. SC-438 is expected to land first.

Known open tickets on this surface (cite, don't report as new), the montage analogues (a
negotiation analogue is a NEW bug candidate — say which ticket it mirrors) and fixed bugs that
must stay fixed: see the ledger's "Known open tickets" ruling. In particular probe for the
negotiation analogues of SC-625 (a write deletes YAML keys the element doesn't know, top-level and
inside list items such as arguments/motivations), SC-626 (keyboard focus drops to the page after a
write — check in jsdom now, confirm in real Obsidian in phase B), SC-628 (hand-typed wrong-type
values: e.g. `patience: "3"`, `interest: 9`, `title: 2024`).

### Phase A (this round) — then STOP

1. `data-dse-control` on every interactive node the negotiation renders (use `controlId.ts` /
   the kit factories' `control` option, as the pilots did). Cover every variant: each tab, the
   interest and patience tracks at 0 / mid / max and past bounds, every motivation and pitfall
   chip (used / unused, revealed / hidden if that exists), argument checkboxes and the Complete
   Argument button (enabled / disabled), the end band (each outcome tier), Learn More, the reset
   menu, the negotiation's chrome-panel items, an empty / minimal block and the ended fixture.
   Add fixtures under the e2e vault (`e2e/vaults/shipped/Negotiation/`) that reach every variant,
   and add their rows to the fixture table in `e2e/README.md`.
2. Both censuses cover the negotiation surface by CONTAINER scoping (the negotiation root), not by
   CSS class (the SC-437 census fix is the pattern): any eventful node anywhere in the negotiation
   must carry an id from the negotiation manifest or an allowlisted other-surface / host id. Prove
   it catches a regression: a jsdom test that injects an un-id'd button into the negotiation and
   expects a census finding.
3. The manifest `e2e/manifest/negotiation.ts`: every (control, interaction) pair (click,
   click-disabled, dblclick, type, blur, `press:<Key>` where a real handler makes it functional —
   check every button for Enter / Space and every roving group for arrow keys; declare what is
   functional, nothing else), same comment style as the existing manifests. The ticket says
   "about 35 interactions"; if your count differs a lot, say why.
4. jsdom matrix tests for the combinatorial logic (e.g. interest × patience × outcome tier; each
   motivation / pitfall × used / unused × its effect on interest and patience; argument checkbox
   combinations × Complete Argument enabled / disabled and its write; tab switching × which panel
   shows; reset from every state; bounds clamping at 0 and max). Put them under `test/dom/`
   next to the existing negotiation tests.
5. The bug survey: probe the surface (jsdom probes are cheap) for real defects. Integrity probes
   are mandatory because the negotiation writes into user files: content above / below the block
   survives a write; two negotiation blocks in one note don't cross-talk; a hand-edited block
   survives a re-trigger; a write into a block whose YAML has unknown keys keeps them (top-level
   and inside list items). Batch the bugs.
6. Commit inside `draw-steel-elements/` after every coherent step. Messages `test(SC-439): …` /
   `feat(SC-439): …`; no Claude/AI attribution or co-author trailers. Do not push. Do not touch
   the superproject pointer or commit anything in the superproject.
7. Gates for phase A only: tsc, lint, jest (full run), and the jsdom census. No
   e2e/lifecycle/shots yet. Then write the report and return `STATUS: NEEDS_CONTEXT` — **even
   with zero bugs** — with the pair list and the bug list.

### Phase B (after the owner resumes you; for reference only now)

e2e specs under `e2e/specs/negotiation/` driving every manifest pair through real input,
asserting the note file and the screen (at least one plain driver per pair; a test of a default
state must start from a non-default state so it can fail; a test that opens and closes something
must assert the note and the card, not just the close); the real-Obsidian census extended;
markers citing the keys the owner gives you; then the full battery.

## 3. Gates (dse-verify battery, against the worktree)

Baseline at `6785fa06`: jest 11918 passed / 1 skipped with the shots cache (fresh worktree
without the cache: about 11917 / 2 — measure and report your own fresh figure) · lifecycle 64/64 ·
e2e `342/345 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (known bugs SC-257, SC-355,
SC-384) · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280
· parity 0/0/24.

Phase A expected: tsc and lint clean; jest higher pass count, 0 failed (every `test.failing`
counted as passing). On a fresh worktree jest reads 2 skipped until `npm run shots` has cached
`visual-harness/dist/obsidian-app.css` — expected in phase A; say so. Jest's default timeout is
30 s since SC-568: an "Exceeded timeout" is a real hang until proven otherwise — re-run the suite
alone first, don't blame load. Remove any stale `main.js` / `styles.css` in the plugin root
before jest only if dse-verify says so for this case (FOLLOWUPS #77 note).

Phase B (later): lifecycle 64/64; e2e `N/M ok, 0 failed, K known-bug, coverage: Y/Y` with
Y > 176; shots 0 FAIL, 592; freeze 280/280 (attribute-only changes must not move print bytes —
if one moves, stop and report, never touch the baseline); parity 0/0/24 (report any move in
host-leak or DOM numbers). Parity runs LAST. Lifecycle runs in SEVEN `--only` parts
(`npm run obsidian-lifecycle -- --only=<comma-separated ids>`), each its own call:
1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST in SCENARIOS order
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
6. `G-S92,G-S96,G-S97,G-S99` (4)
7. `G-S108,G-S112,G-S115` (3, about 200 s)
A G-S91 FAIL is a real signal unless it says the host was too slow after two re-runs. G-S115 (g)
suspected flake (SC-633): a (g) red that shows the "changed on disk first" Notice on a loaded host
gets one re-run of part 7; a red on the re-run, on a quiet host, or in any other G-S115 cell is
real. Before blaming a G-S97 FAIL on the change, check
`git -C <dse dir> status demo-vault/.obsidian/appearance.json` and restore it if dirty (SC-622).

Command shapes — all from devbox with an explicit project dir:
`devbox run -c /home/scott/code/steelCompendium/worktrees/sc439-e2e-negotiation/draw-steel-elements -- bash <your-script-file>`
where the script file `cd`s into the dse dir and runs ONE gate with output redirected to a unique
log and the exit code written to a unique rc file. Read each gate's summary line.

## 4. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs path> -- …` for every devbox call. Write scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc439-impl-r1/`
  — every script and log inside it uniquely named. Never a generic `gate.sh`.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in `/tmp` or the scratchpad** — two workers
  this wave hung on a permission prompt doing that. Leave throwaway files in place; use fresh
  names or overwrite with `>`. Never `rm` with a shell-variable target, never a glob `rm`, never
  touch `.superpowers/` outside your report file.
- The Bash tool moves any call over 180 s to the background and notifies on completion. For
  lifecycle part 7 and the full e2e run: run the gate with output to a log, then wait with
  `timeout 175 tail --pid=<your own node pid> -f /dev/null` (pick the pid whose
  `readlink /proc/<pid>/cwd` is inside your worktree), repeating until it exits, then read the
  log's summary line and rc file. Never wait for a completion notice that may not come; never a
  Monitor.
- Never set `DSE_LIFECYCLE_PORT`. Give each lifecycle/e2e/shots run a private `DSE_CAMERA_TMP`
  under your scratch folder.
- Never key a wait-loop on a scratch filename or its contents from before your run — the scratch
  dir is pre-populated across sessions and branches. Use per-run unique paths.
- Redirect long-running output to a file rather than streaming it (the 600 s stream watchdog
  kills silent agents). `devbox`'s `sh` wrapper eats `$?`/`$PIPESTATUS` and `| tail` eats
  failures: capture exit codes inside a script file.
- Kill scratch processes only by literal PID, and only a PID whose command line contains
  `worktrees/sc439-e2e-negotiation/` (or whose `readlink /proc/<pid>/cwd` is inside it). Never
  `pkill`/`killall` by pattern — SC-438 and SC-615 run the same gates concurrently.
- Token-map phantom red: if `token-coverage.test.ts` fails on a missing `--dse-*` row, compare the
  worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's before
  believing it; clear with `DSE_TOKEN_MAP_PATH` pointed at the main checkout copy.
- e2e test titles: the runner reads `[ID]` from titles; never a bracketed ticket id; ids global.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner (`to: "main"` reaches the dispatcher, not me). If you
  need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your
  report; I will resume you. If you ever do send a message anyway, its first word must be
  `SC-439:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc439-e2e-negotiation/sc439-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (status, branch head sha, gate numbers vs
baseline, control count, pair count, bug count). Then: commits (sha + subject); controls added
(id list, grouped by area); manifest pairs (count + full list); the census changes (what changed
in each census, the regression tests); jsdom matrix tests added (file + what they cover);
fixtures added; integrity probes (each, result); bugs found (title, repro, file:line, severity,
and whether it matches a known open ticket or mirrors a montage one — or "none"); `Drive-by
fixes:` and `Follow-ups:` sections; and every gate's log path and summary line. Phase B will
append to this same file under a `## Phase B` heading.

## 6. Return contract

Final text: raw facts, no prose — `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, branch head sha, each
gate's summary numbers, control count, pair count, bug list (title + severity + file:line), report
path, and the filesystem path of every evidence artifact you produced (logs, reports).
