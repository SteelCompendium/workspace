# SC-436 round 1 — implementer brief

You implement SC-436: real-Obsidian e2e + jsdom functional coverage of the ConditionsModal.
Your final text goes to the SC-436 ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc436-e2e-conditions-modal/decisions.md`.
  It holds the ticket scope verbatim, Scott's rulings verbatim and the owner rulings. It is
  your only source of ticket history. **Workers never call the tracker** (Linear) — not to
  read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc436-e2e-conditions-modal`, branch
  `sc436-e2e-conditions-modal` in `draw-steel-elements/`. Verify with `git -C` before every
  write. Never edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared
  main checkout) except your report file in the ledger dir. Its dse dirt (modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is
  Scott's live vault — expected, not yours, don't flag it.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc436-e2e-conditions-modal/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `2ee2e405`. If it moved, `git rebase origin/develop`
  and say so in the report (then `npm ci` if `package.json`'s obsidian version changed).
  Run `npm ci` once in the worktree's dse dir if `node_modules` is missing.
- Read `draw-steel-elements/e2e/README.md` first — it is the model. Then the prior rollout,
  SC-435 (minion pool modal), which is the closest template: its ledger
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc435-e2e-minion-pool/`
  — read `sc435-r1-implementer-report.md` section "Reuse for SC-436 / SC-437" and skim
  `sc435-r2-review-report.md` for the review findings (they are what the next reviewer will
  check you for: e.g. wrap staging AND cancel in one `expectNoWrite`, keyboard pairs, page-side
  reads of repeated nodes). Then in the worktree: `e2e/manifest/conditions-modal.ts` (the
  existing narrow pilot — you EXTEND it), `e2e/manifest/minion-pool-modal.ts`,
  `e2e/manifest/surface.ts`, `e2e/driver/dse.ts`, `e2e/driver/pool.ts`,
  `e2e/specs/initiative/conditions-*.e2e.ts`, `e2e/specs/minion-pool/`,
  `test/dom/e2eCensus.test.ts`, `e2e/specs/_census.e2e.ts`. Then
  `src/views/ConditionsModal.ts` (742 lines) and how `src/elements/initiative/view.ts`
  (~line 2041-2090) opens it.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (battery, command shapes, footguns). Read it from the main checkout path; don't edit it.

## 2. The task

Scope and Done-bar, quoted from the ledger (ticket description, verbatim):

> **Scope:** the ConditionsModal, opened from the initiative tracker for heroes and creatures.
> It has about 40 interactions: condition toggles, end-of-turn / save-ends choices, custom
> conditions, removal, and close paths. It applies live, so every click writes the note.
> Include note-integrity probes: content around the block survives, and a second block in the
> same note is untouched.
>
> **Done means** (the same bar as the SC-408 stamina pilot; start from
> `draw-steel-elements/e2e/README.md`):
> * Every interactive node on the surface carries a `data-dse-control` id. Both censuses cover
>   the surface: jsdom `test/dom/e2eCensus.test.ts` and real-Obsidian `e2e/specs/_census.e2e.ts`.
> * A manifest in `e2e/manifest/` lists every (control, interaction) pair. A full `npm run e2e`
>   drives each pair at least once through real input, asserting the note file and the screen.
>   At least one driver per pair is a plain test, not a known-bug test.
> * The combinatorial logic (values × states × variants) lives in jsdom matrix tests.
> * Every bug found gets a Backlog ticket in the DSE 7.0.0 project, labelled Bug + DSE Plugin.
>   The ticket gets a `knownBug('SC-…')` (e2e) or `test.failing` (jest) marker citing it. No
>   product fixes in the test ticket.
> * The full dse-verify battery is green, including `npm run e2e` with 0 failed and full
>   coverage.

Owner rulings (quoted from the ledger):

> **Existing pilot manifest.** `e2e/manifest/conditions-modal.ts` already exists
> (SC-431/468/474 pilot, deliberately narrow: `cond.add`, `cond.input`, `cond.edit`,
> `cond.duration`, `cond.swatch`, `cond.effect`, `cond.icon-search`, reach row
> `init.cond.add`). EXTEND it to the whole modal; keep the existing ids and the existing specs
> (`e2e/specs/initiative/conditions-*.e2e.ts`) green. Rename an existing id only if it is
> genuinely wrong, and then say why in the report.

> **Hosts.** In scope: the modal opened from the initiative tracker, on a hero row AND a
> creature row (both reach paths driven). The ConditionsPanel host
> (`src/elements/conditions/panel.ts`, hero sheet / ds-conditions) opens the same modal but is
> not this ticket's host: no reach rows for it here; list it in the report's reuse section.

> **Bug flow.** Workers never touch the tracker. A worker that finds a product bug commits its
> coherent work, finishes the survey, and returns `STATUS: NEEDS_CONTEXT` ONCE with every bug's
> title, repro, file:line and severity. The owner files the Backlog ticket and resumes the
> worker with the key, which the worker then cites in `knownBug('SC-…')` / `test.failing`. No
> product fixes in this ticket; product source may change ONLY to add `data-dse-control`
> attributes (and census plumbing) — no behavior change.

> **Known open tickets touching this surface — cite, don't refile:** SC-257 (non-Latin
> custom-condition names slug to empty — silent no-op), SC-355 (DSE dialogs expose role
> "generic"), SC-384 (Live Preview: modal closes when a pending write lands), SC-555
> (docs-shots GIF expects a "Done" button). If one reproduces, mark it with that key; tell the
> owner which.

> **Overlap with SC-437 (initiative tracker)** follows this ticket on the same suite. Keep new
> shared helpers small and generic; the report lists what SC-437 should reuse. Don't pre-build
> the tracker's surface (only the reach rows this modal needs).

What "the whole modal" means in practice — inventory it from the source and confirm against
the real DOM, but expect at least: the condition toggles (each standard condition), the
end-of-turn / save-ends / other duration choices, the custom-condition flow (Add input,
Enter, colour swatches incl. the custom colour input, icon search and pick, effect), the row
cog/editor, removal, and every close path (close button, Escape at modal level vs inside the
dropdown/editor, click outside). Because the modal applies live, every write-producing pair
asserts the note file; every non-writing pair (open, close, focus moves) asserts
`expectNoWrite` around the WHOLE action. Note-integrity probes (ticket text): prose above and
below the block survives byte-for-byte, and a second initiative block in the same note is
untouched — add a fixture for that if none exists, and list it in the e2e README fixture table.

Combinatorics (conditions × durations × hero/creature × string-vs-object condition forms ×
custom vs standard) go in a jsdom matrix file under `test/dom/views/`, not e2e.

Batch bugs: finish the whole survey of the surface first (jsdom probes are cheap), then return
NEEDS_CONTEXT once with every bug found. If you find none, finish and return DONE.

Commit inside `draw-steel-elements/` after every coherent step (attributes, census, jsdom
matrix, manifest + specs). Never leave work uncommitted through a gate. Commit messages:
`test(SC-436): …` / `feat(SC-436): …`; no Claude/AI attribution or co-author trailers. Do not
push. Do not touch the superproject pointer.

## 3. Gates (dse-verify battery, in order, against the worktree)

Baseline at `2ee2e405`: jest 6584 passed / 1 skipped · lifecycle 52/52 ·
e2e `163/164 ok, 0 failed, 1 known-bug (SC-572), coverage: 113/113 pairs` · shots 592, 0 FAIL,
host-leak 163/978, capture clip OK (147 …) · freeze 280/280 · parity 0/0/24.

Expected after your work: tsc and lint clean; jest higher pass count, 0 failed (any
`test.failing` counted) — ledger jest rule: a full run green, or only the two SC-568 timeouts
(`twin-reuse`, `initiative-default-keys`) AND both suites green alone; lifecycle 52/52; e2e
`N/M ok, 0 failed, K known-bug, coverage: Y/Y` with Y > 113; shots 0 FAIL; freeze 280/280
(attribute-only changes must not move print bytes — if one moves, stop and report, never touch
the baseline); parity 0/0/24 (report any move in host-leak or DOM numbers). Parity runs LAST.

Command shapes — all from devbox with an explicit project dir:
`devbox run -c /home/scott/code/steelCompendium/worktrees/sc436-e2e-conditions-modal/draw-steel-elements -- bash <your-script-file>`
where the script file `cd`s into the dse dir and runs one gate with output redirected to a
unique log and the exit code written to a unique rc file. Read each gate's summary line.

Lifecycle runs in FIVE `--only` parts, each its own foreground call
(`npm run obsidian-lifecycle -- --only=<ids>`), and you report the union:
1. `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21)
2. `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16)
3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
4. `G-S57 G-S62 G-S61 G-S56` (4) — G-S56 stays LAST in SCENARIOS order
5. `G-S59 G-S49` (2)
Never set `DSE_LIFECYCLE_PORT`. Give each lifecycle/e2e/shots run a private
`DSE_CAMERA_TMP` under your scratch folder. You should not need a new lifecycle scenario; if
you do, its id is G-S71.

Load: SC-556 and SC-558 run the same batteries concurrently. Check `/proc/loadavg` before
e2e/lifecycle; a red that names "environment" or a timeout at load > 15 gets one re-run at
lower load before you believe it. SC-517 (RECOV-R07 under load) is a known e2e load flake.

## 4. Footguns (each cost real time once)

- No compound `cd X && …`. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs path> -- …` for every devbox call. Write scratch files with the Write
  tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc436-impl-r1-<yourAgentId>/`
  — every script and log inside it uniquely named. Never a generic `gate.sh`.
- Never `rm` with a shell-variable target; never a glob `rm`; never `rm -rf` under `/tmp` by
  pattern; never `rm -rf` `.superpowers/`. Overwrite logs with `>` or use fresh names.
- One gate per Bash call, in the FOREGROUND. No `run_in_background`, no Monitor, for any gate
  except shots: if shots must go past 600 s, start it in the background with output to a
  unique log + rc file and **poll that log/rc file** — never wait for a completion notice; it
  never comes.
- Never key a wait-loop on a scratch filename or its contents from before your run — the
  scratch dir is pre-populated across sessions. Use per-run unique paths.
- Redirect long-running output to a file rather than streaming it (the 600 s stream watchdog
  kills silent agents). `devbox`'s `sh` wrapper eats `$?`/`$PIPESTATUS` and `| tail` eats
  failures: capture exit codes inside a script file.
- Kill scratch processes only by literal PID, and only a PID whose command line contains
  `worktrees/sc436-e2e-conditions-modal/` (or whose `readlink /proc/<pid>/cwd` is inside it).
  Never `pkill`/`killall` by pattern — SC-556 and SC-558 run the same gates concurrently.
- Token-map phantom red: if `token-coverage.test.ts` fails on a missing `--dse-*` row, compare
  the worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's
  before believing it; clear with `DSE_TOKEN_MAP_PATH` pointed at the main checkout copy.
- On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has
  cached `visual-harness/dist/obsidian-app.css` — compare jest to baseline after a shots run.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do
  send a message anyway, its first word must be `SC-436:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc436-e2e-conditions-modal/sc436-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (status, branch head sha, battery numbers vs
baseline, bug count). Then: commits (sha + subject); controls added (id list); manifest pairs
added (count + list); jsdom matrix tests added (file + what they cover); note-integrity probes
(fixture + what they assert); bugs found (title, repro, file:line, severity — or "none");
`Drive-by fixes:` and `Follow-ups:` sections; **"Reuse for SC-437"** (helper names + paths,
plus the ConditionsPanel host note); and every gate's log path and summary line.

## 6. Return contract

Final text: raw facts, no prose — `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, branch head sha,
each gate's summary numbers, bug list (if NEEDS_CONTEXT), report path, and the filesystem path
of every evidence artifact you produced (logs, reports).
