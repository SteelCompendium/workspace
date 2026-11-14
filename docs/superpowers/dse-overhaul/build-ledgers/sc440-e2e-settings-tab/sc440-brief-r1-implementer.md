# SC-440 round 1 — implementer brief

You implement SC-440: real-Obsidian e2e + jsdom functional coverage of the DSE plugin settings
tab. Your final text goes to the SC-440 ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc440-e2e-settings-tab/decisions.md`.
  It holds the ticket scope verbatim, Scott's rulings verbatim and the owner rulings. It is your
  only source of ticket history. **Workers never call the tracker** (Linear) — not to read, not
  to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc440-e2e-settings-tab`, branch
  `sc440-e2e-settings-tab` in `draw-steel-elements/`. Verify with `git -C` before every write.
  Never edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared main
  checkout) except your report file in the ledger dir. Its dse dirt (modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's
  live vault — expected, not yours, don't flag it.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc440-e2e-settings-tab/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `a5313f9d`. If it moved, `git rebase origin/develop` and
  say so in the report (then `npm ci` if `package.json`'s obsidian version changed). Run `npm ci`
  once in the worktree's `draw-steel-elements/` if `node_modules` is missing (through devbox).
- Read `draw-steel-elements/e2e/README.md` first — it is the model. Then the prior art: the
  landed SC-438 montage rollout (the current Tier 2 shape: ids, censuses, manifest, jsdom matrix,
  bug survey), ledger + brief + reports at
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc438-e2e-montage/`
  (read `decisions.md`; the r1 report's executive summary; the r2 review report's findings list —
  it shows what the reviewer will look for: vacuous drives that start at the default value, ids
  built from template strings the runner can't see, pairs driven but undeclared, assertions that
  only check a modal closed). Code prior art: `e2e/manifest/*.ts` (montage, initiative),
  `e2e/specs/montage/`, `e2e/driver/dse.ts`, `e2e/driver/montage.ts`, `e2e/driver/session.ts`
  (how the run reads `experimental`), `e2e/driver/env.ts`, `e2e/vaults/plugin-data.shipped.json`,
  `src/framework/kit/controlId.ts`, `src/framework/experimental.ts`.
- Then the surface: `src/views/SettingsTab.ts`, `src/views/settingsDeclarative.ts`,
  `src/prefs/catalog.ts` (the descriptor list: toggles, selects, fonts, sliders, `advanced`,
  `inPreset`), `src/model/Settings.ts`, the existing jest `test/dom/views/settings-tab.test.ts`,
  `test/dom/views/settings-preview.test.ts`, `test/dom/framework/experimentalGate.test.ts`,
  `test/dom/framework/syncCompendiumBusy.test.ts`, `test/dom/prefs/`, and the census files
  `test/dom/e2eCensus.test.ts` and `e2e/specs/_census.e2e.ts`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — it is
  ~460 KB with some 60 KB lines: do NOT read it whole. Read the battery table rows (lines ~20-35,
  cut long lines with `cut -c1-1500`), "Jest timeouts under load" (line ~156), "Lifecycle and e2e
  notes" (line ~195), and "Current expected numbers" (grep `^## Current expected`, read only the
  CURRENT paragraph). Don't edit it.

## 2. The task

Scope and Done-bar: quoted verbatim in the ledger's "Ticket scope" section — read it there. The
owner rulings in the ledger bind you; the ones that shape the work, quoted:

> **Surface boundary.** In scope: every interactive node the DSE settings tab renders
> (`src/views/SettingsTab.ts`, `src/views/settingsDeclarative.ts`, the descriptor-driven prefs from
> `src/prefs/catalog.ts`, and any preview / preset / reset / advanced-disclosure / extra-button
> chrome the tab draws). The Compendium section's **Sync** and **Check for updates** buttons are in
> scope as settings-tab controls (id, census, their busy state — label swap and disabled — and
> the Notice / status line they produce), but the windows and file moves that sync or a
> destination-folder change open are **SC-441's surface** (compendium sync and migration modals):
> drive this ticket's pairs up to the point such a window opens, then close it, and do not
> manifest its internals. No e2e test may reach the real network: if the Sync / Check pairs need a
> stubbed release source and the harness has none, say so in the phase A report (NEEDS_CONTEXT) —
> don't build a large stub without a ruling. Not in scope: the generic block edit form, the
> sidebar host, Obsidian's own settings chrome. Ids prefixed `settings.` (implementer may refine,
> say why).

> **"Re-renders live" means** an already-open note's DSE elements change without a reload or a
> note re-open, asserted on the screen (a DOM attribute, class, CSS variable or rendered text that
> the setting controls), not only in `data.json`. "Survives a plugin reload" means disable +
> enable the plugin (or the harness's existing reload path) and re-read both the control's shown
> value and `data.json`. Pick a representative fixture element per setting; say which in the
> manifest comment.

> **Experimental gate.** Shipped specs run with `experimental` OFF: assert the gated controls
> (`authoringControls`, `printPreview`, and any other descriptor the gate filters) are ABSENT from
> the tab. One separate scenario (or a small set) runs with the gate ON and drives the gated
> controls. If the harness cannot flip the gate for one scenario without disturbing others,
> report how you did it or why you could not (NEEDS_CONTEXT in phase A).

> **Bug flow** (same as SC-435..438). Workers never touch the tracker. A worker that finds a
> product bug commits its coherent work, finishes the survey, and returns `STATUS: NEEDS_CONTEXT`
> ONCE with every bug's title, repro, file:line and severity. The owner files the Backlog ticket
> (DSE 7.0.0, Bug + DSE Plugin, related to SC-440) and resumes the worker with the key, which the
> worker then cites in `knownBug('SC-…')` / `test.failing`. No product fixes in this ticket;
> product source may change ONLY to add `data-dse-control` attributes (and census plumbing) — no
> behavior change.

> **Scenario ids.** e2e ids `SET-*` (e.g. `SET-T01`). Scenario ids are global; check
> `grep -rn '\[SET-' e2e/` on develop AND the parallel SC-439 branch
> (`/home/scott/code/steelCompendium/worktrees/sc439-e2e-negotiation`, read-only). Census ids start
> at `[CENSUS-16]` (SC-438 used 10..12, SC-439 in flight uses 13..15). Never a bracketed ticket id
> in a test title (SC-577).

> **Overlap with parallel owners** SC-439 (ds-negotiation e2e, same Tier 2 shape) and SC-626
> (montage focus after a write). Both may touch `e2eCensus.test.ts`, `_census.e2e.ts`,
> `e2e/driver/*`, `e2e/README.md`. Keep edits to shared files small and additive so a rebase is
> mechanical; whichever lands second rebases and re-counts.

Known open tickets on this surface (cite, don't report as new) and fixed bugs that must stay
fixed: see the ledger's "Known open tickets" ruling (SC-217, SC-218, SC-405, SC-161, SC-359,
SC-458, SC-626/SC-615/SC-614; SC-228, SC-243, SC-372/SC-422, SC-140, SC-187 fixed — a regression
is a new bug, report it).

Ids must be literal strings in test titles (`[SET-T01]`, never `[SET-${x}]`): the runner reads
titles statically. Where a test loops over descriptors, give each generated test a literal id via
a table of literal ids.

### Phase A (this round) — then STOP

1. `data-dse-control` on every interactive node the settings tab renders (each toggle, dropdown,
   font picker, slider, text field, button, extra/reset button, preset control, advanced
   disclosure, preview control), using `controlId.ts` / the existing declarative plumbing so a
   descriptor's id comes from its key. Cover both gate states (OFF: the shipped set; ON: the
   gated descriptors appear). Add any fixture notes the live re-render assertions need under the
   e2e vault (e.g. `e2e/vaults/shipped/Settings/`), and add their rows to the fixture table in
   `e2e/README.md`.
2. Both censuses cover the settings tab by CONTAINER scoping (the DSE settings tab's root), not by
   CSS class (the SC-437/SC-438 census pattern): any eventful node inside the tab must carry an
   id from the settings manifest or an allowlisted id. Prove it catches a regression: a jsdom
   test that injects an un-id'd button into the tab and expects a census finding. The
   real-Obsidian census must open the settings tab to inspect it (find out how; say how).
3. The manifest (`e2e/manifest/settings-tab.ts`, or split if it reads better): every (control,
   interaction) pair (click, change/select, type, blur, drag/`press:<Key>` for sliders where
   functional, the extra/reset buttons) with the same comment style as existing manifests, and
   the representative fixture element per setting in the comment. The ticket says "about 45
   controls"; if your count differs a lot, say why.
4. jsdom matrix tests for the combinatorial logic: every descriptor × each of its values →
   persisted `data.json` shape + the DOM effect on a rendered element; gate OFF vs ON → which
   descriptors exist; reset/extra buttons → default restored; presets (`inPreset`) → which
   settings a preset changes and that it leaves the rest; advanced disclosure; sliders at min /
   max / step; text fields valid / empty / invalid (destination folder, locale, default creature
   image path); Sync / Check busy states. Put them under `test/dom/` next to the existing
   settings tests.
5. The bug survey: probe the surface (jsdom probes are cheap) for real defects. Integrity probes
   are mandatory because the tab writes `data.json`: unknown keys in `data.json` survive a
   settings change; a hand-edited `data.json` value the UI doesn't offer (out-of-range slider,
   unknown select value, wrong type) renders sanely and isn't silently rewritten by an unrelated
   change; changing one setting doesn't move another; two rendered elements in two open notes
   both re-render; `experimental` is never written to `data.json` by the tab. Batch the bugs.
6. Answer, in the report, the two open mechanics: (a) can the Sync / Check pairs be driven in
   e2e without the network, and how; (b) how the gate-ON scenario flips `experimental` for that
   scenario only (and how it restores OFF).
7. Commit inside `draw-steel-elements/` after every coherent step. Messages `test(SC-440): …` /
   `feat(SC-440): …`; no Claude/AI attribution or co-author trailers. Do not push. Do not touch
   the superproject pointer or commit anything in the superproject.
8. Gates for phase A only: tsc, lint, jest (full run), and the jsdom census. No
   e2e/lifecycle/shots yet. Then write the report and return `STATUS: NEEDS_CONTEXT` — **even
   with zero bugs** — with the pair list, the bug list and the answers to item 6.

### Phase B (after the owner resumes you; for reference only now)

e2e specs under `e2e/specs/settings/` driving every manifest pair through real input, asserting
`data.json`, the live re-render on screen, and survival across a plugin reload (at least one plain
driver per pair); the real-Obsidian census extended; the gate-ON scenario; markers citing the
keys the owner gives you; then the full battery.

## 3. Gates (dse-verify battery, against the worktree)

Baseline at `a5313f9d`: jest 12133 passed / 1 skipped WITH the shots cache (a fresh worktree reads
one fewer passed and 2 skipped — measure and report your own fresh figure) · lifecycle 64/64 ·
e2e `424/437 ok, 0 failed, 13 known-bug, coverage: 233/233 pairs` · shots 592, host-leak 163/978,
modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

Phase A expected: tsc and lint clean; jest higher pass count, 0 failed (every `test.failing`
counted as passing). Jest's default timeout is 30 s since SC-568: an "Exceeded timeout" is a real
hang until proven otherwise — re-run the suite alone first, don't blame load.

Phase B (later): lifecycle 64/64; e2e `N/M ok, 0 failed, K known-bug, coverage: Y/Y` with Y > 233;
shots 0 FAIL, 592; freeze 280/280 (attribute-only changes must not move print bytes — if one
moves, stop and report, never touch the baseline); parity 0/0/24 (report any move in host-leak or
DOM numbers). Parity runs LAST. Lifecycle runs in SEVEN `--only` parts
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
`devbox run -c /home/scott/code/steelCompendium/worktrees/sc440-e2e-settings-tab/draw-steel-elements -- bash <your-script-file>`
where the script file `cd`s into the dse dir and runs ONE gate with output redirected to a unique
log and the exit code written to a unique rc file. Read each gate's summary line.

## 4. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs path> -- …` for every devbox call. Write scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc440-impl-r1/`
  (exists) — every script and log inside it uniquely named. Never a generic `gate.sh`.
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
  `worktrees/sc440-e2e-settings-tab/` (or whose `readlink /proc/<pid>/cwd` is inside it). Never
  `pkill`/`killall` by pattern — SC-439 and SC-626 run the same gates concurrently.
- Token-map phantom red: if `token-coverage.test.ts` fails on a missing `--dse-*` row, compare the
  worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's before
  believing it; clear with `DSE_TOKEN_MAP_PATH` pointed at the main checkout copy.
- The e2e vault is a disposable copy, but `e2e/vaults/plugin-data.shipped.json` is a tracked
  source file: never let a test write back into it.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner (`to: "main"` reaches the dispatcher, not me). If you
  need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your
  report; I will resume you. If you ever do send a message anyway, its first word must be
  `SC-440:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc440-e2e-settings-tab/sc440-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (status, branch head sha, gate numbers vs
baseline, control count, pair count, bug count, the two mechanics answers in one line each).
Then: commits (sha + subject); controls added (id list, grouped by section); manifest pairs
(count + full list); the census changes (what changed in each census, the regression test);
jsdom matrix tests added (file + what they cover); fixtures added; integrity probes (each,
result); bugs found (title, repro, file:line, severity, and whether it matches a known open
ticket — or "none"); `Drive-by fixes:` and `Follow-ups:` sections; and every gate's log path and
summary line. Phase B will append to this same file under a `## Phase B` heading.

## 6. Return contract

Final text: raw facts, no prose — `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, branch head sha, each
gate's summary numbers, control count, pair count, bug list (title + severity + file:line), the
two mechanics answers, report path, and the filesystem path of every evidence artifact you
produced (logs, reports).
