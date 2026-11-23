# SC-442 round 1 — implementer brief

You implement SC-442: the ds-counter top-up of the real-Obsidian e2e + jsdom functional coverage.
Your final text goes to the SC-442 ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/decisions.md`.
  It holds the ticket scope verbatim, Scott's rulings verbatim, the state at cut and the owner
  rulings. It is your only source of ticket history. **Workers never call the tracker** (Linear) —
  not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup`, branch
  `sc442-e2e-counter-topup` in `draw-steel-elements/`. Verify with `git -C` before every write.
  Never edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared main
  checkout) except your report file in the ledger dir. Its dse dirt (modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's
  live vault — expected, not yours, don't flag it.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `bab0dbb2`. If it moved, `git rebase origin/develop` and
  say so in the report. **The worktree is fresh and has no `node_modules`: run `npm ci` once in
  its `draw-steel-elements/`** (through `devbox run -c <abs plugin dir> -- bash <script>`, output
  to a log) before the first gate.
- Read `draw-steel-elements/e2e/README.md` first — it is the model. Then the prior art: the landed
  SC-440 settings-tab rollout and SC-438 montage rollout (ids, censuses, manifest, jsdom matrix,
  bug survey), at
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc440-e2e-settings-tab/`
  and `.../sc438-e2e-montage/` (read each `decisions.md`, the r1 report's executive summary, and
  the r2 review report's findings list — it shows what the reviewer will look for: vacuous drives
  that start at the default value, ids built from template strings the runner can't see, pairs
  driven but undeclared, assertions that only check the screen and not the note). Also the
  SC-652 ledger (`.../sc652-wrapper-keys-kept/`) for CTR-K01.
- Code prior art: `e2e/manifest/counter.ts` (the pilot stub), `e2e/manifest/surface.ts`,
  `e2e/manifest/stamina-bar.ts` (the SC-408 pilot), `e2e/specs/counter/*.e2e.ts`,
  `e2e/specs/stamina-bar/`, `e2e/driver/dse.ts`, `src/framework/kit/controlId.ts`, the kit
  `stepper` (`src/framework/kit/`), `src/elements/counter/{view,model,definition}.ts`, jsdom
  `test/dom/elements/counter.test.ts`, and the census files `test/dom/e2eCensus.test.ts` and
  `e2e/specs/_census.e2e.ts`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — it is
  ~490 KB with very long lines: do NOT read it whole. Read the battery table (lines ~20-135, cut
  long lines with `cut -c1-1500`), "Jest timeouts under load" (line ~158), "Lifecycle and e2e
  notes" (line ~197), and "Current expected numbers" (grep `^## Current expected`, read only the
  CURRENT paragraph). Don't edit it.

## 2. The task

Scope and Done-bar: quoted verbatim in the ledger's "Ticket scope" section — read it there. The
owner rulings in the ledger bind you; the ones that shape the work, quoted:

> **Surface boundary.** In scope: every interactive node `ds-counter` draws
> (`src/elements/counter/view.ts` on the kit `stepper`): the `-` / `+` buttons, the value input
> (editable) or value span (read-only), and any chrome item the counter card itself contributes
> that is not already in `e2e/manifest/chrome.ts`. Do NOT re-manifest shared chrome (edit button,
> pin, collapse) that `chrome.ts` already owns; say in the phase A report which chrome the counter
> card shows and where it is already covered. Keep the existing `counter.*` id prefix and the
> existing `counter.dec` / `counter.inc` ids. Not in scope: the block edit form, the sidebar host,
> hover-preview twin logic (lifecycle owns it).

> **Pairs to fill** (from the ticket): steppers (click, keyboard), typed value (type + commit by
> Enter and by blur, Escape if the stepper handles it, invalid / out-of-range input, empty input),
> keyboard (Enter / Space on the buttons; ArrowUp / ArrowDown in the input if the stepper or the
> browser number input reaches our onChange), and min / max edges (a button disables at its limit;
> typed values past a limit clamp or refuse — whichever the product does is what the test pins,
> and a behavior that looks wrong is a bug candidate, not a test change). Each e2e drive asserts
> BOTH the note file (the block's YAML values) and the screen (shown value, disabled state). Per
> dse-verify (SC-480 note): compare the counter's values and the text outside the fence, never
> the fence's text to a fixture — the plugin re-serializes key order.

> **Matrix.** The combinatorial logic (values × min/max present or absent × at-limit × editable /
> read-only × typed input shapes) goes in a jsdom matrix test
> (`test/dom/elements/counter-matrix.test.ts`, mirroring `montage-matrix` / `settings-matrix`).

> **Bug flow** (same as SC-438..440). Workers never touch the tracker. A worker that finds a
> product bug commits its coherent work, finishes the survey, and returns `STATUS: NEEDS_CONTEXT`
> ONCE with every bug's title, repro, file:line and severity. The owner files the Backlog ticket
> (DSE 7.0.0, Bug + DSE Plugin, related to SC-442) and resumes the worker with the key, which the
> worker then cites in `knownBug('SC-…')` / `test.failing`. No product fixes in this ticket;
> product source may change ONLY to add `data-dse-control` attributes (and census plumbing) — no
> behavior change.

> **Scenario ids.** New e2e ids use the `CTR-` prefix with a letter group not yet used (taken:
> CTR-F01..02, CTR-L01..05, CTR-K01) — e.g. `CTR-S01` steppers, `CTR-T01` typed value, `CTR-E01`
> edges. Census ids start at `[CENSUS-18]`. Scenario ids are global: grep develop AND the parallel
> branches (read-only) `/home/scott/code/steelCompendium/worktrees/sc662-sidebar-pending-saves` and
> `/home/scott/code/steelCompendium/worktrees/sc656-negotiation-outside-edit-focus` before choosing
> (checked at cut: neither adds CTR or CENSUS ids). Never a bracketed ticket id in a test title
> (SC-436 / SC-577).

> **Overlap with parallel owners** SC-662 (pinned sidebar pending saves) and SC-656 (negotiation
> outside-edit focus) are both in `src/`. If a stamp or id needs a `src/` change in a file they
> touch (`src/framework/sidebar/*`, `src/framework/view.ts`, `src/framework/kit/managedModal.ts`,
> `windowHandoff.ts`), STOP and return NEEDS_CONTEXT — the owner tells the dispatcher. Shared test
> files (`e2eCensus.test.ts`, `_census.e2e.ts`, `e2e/driver/*`, `e2e/README.md`): small, additive
> edits only.

Known open tickets on this surface (cite, don't report as new) and fixed bugs that must stay fixed:
see the ledger's "Known open tickets" ruling (open: SC-670, SC-633, SC-550, SC-508, SC-475,
SC-507; fixed — a regression is a NEW bug, report it: SC-495, SC-602, SC-652, SC-290, SC-457,
SC-476, SC-493).

Ids must be literal strings in test titles (`[CTR-S01]`, never `[CTR-${x}]`): the runner reads
titles statically. Where a test loops, give each generated test a literal id via a table of
literal ids. A duplicate scenario id across files makes the runner exit 2 at start.

### Phase A (this round) — then STOP

1. `data-dse-control` on every interactive node the counter renders (both the editable input and
   the read-only value node if it is eventful; anything else). The kit stepper stamps the counter's
   `-` / `+` already — find how and extend it the same way (via `controlId.ts`), don't hand-roll.
   If the stamp belongs in shared kit code used by other surfaces (stamina bar, etc.), keep the
   change additive and check those surfaces' censuses and manifests still pass.
2. Both censuses cover the counter by CONTAINER scoping (the counter block's root), not by CSS
   class (the SC-437/SC-438 census pattern): any eventful node inside a counter must carry an id
   from the counter manifest or an allowlisted id. Prove it catches a regression: a jsdom test that
   injects an un-id'd button into a rendered counter and expects a census finding. Cover editable
   and read-only variants.
3. The manifest `e2e/manifest/counter.ts`: grow the pilot stub to every (control, interaction) pair
   (click, `press:<Key>` for each key that reaches our handlers, type / commit / blur on the input),
   with the same comment style as the other manifests, keeping the existing pairs and their ticket
   references. Add any fixture notes the e2e drives need under the e2e vault (counters with and
   without min/max, at a limit, read-only if that variant exists) and add their rows to the fixture
   table in `e2e/README.md`.
4. jsdom matrix tests for the combinatorial logic (the "Matrix" ruling above), each case asserting
   the persisted block values and the DOM (shown value, disabled state of each button).
5. The bug survey: probe the surface (jsdom probes are cheap) for real defects. Integrity probes
   are mandatory because the counter writes into the user's note: content above and below the
   block survives a write; unknown keys in the block survive (SC-652 — must stay fixed); two
   counters in one note don't cross-talk; a hand-edited value outside [min, max], a non-number
   value, or min > max renders sanely and isn't silently rewritten by an unrelated press; typed
   input of a decimal, a negative, an exponent (`1e3`), whitespace, and an empty box. Batch the
   bugs.
6. List, in the report, which manifest pairs the EXISTING specs (CTR-F/L/K) already drive and which
   need new phase B specs.
7. Commit inside `draw-steel-elements/` after every coherent step. Messages `test(SC-442): …` /
   `feat(SC-442): …`; no Claude/AI attribution or co-author trailers. **Do not push.** Do not touch
   the superproject pointer or commit anything in the superproject.
8. Gates for phase A only: tsc, lint, jest (full run), and the jsdom census. No
   e2e/lifecycle/shots yet. Then write the report and return `STATUS: NEEDS_CONTEXT` — **even with
   zero bugs** — with the pair list and the bug list.

### Phase B (after the owner resumes you; for reference only now)

e2e specs under `e2e/specs/counter/` driving every manifest pair through real input, asserting the
note and the screen (at least one plain driver per pair); the real-Obsidian census extended;
markers citing the keys the owner gives you; then the full battery.

## 3. Gates (dse-verify battery, against the worktree)

Baseline at `bab0dbb2`: jest 13607 passed / 1 skipped WITH the shots cache (a fresh worktree may
read slightly different — measure and report your own fresh figure on base before your first
commit, or say why you couldn't) · lifecycle 63/64 (G-S61 only, base too — SC-668) · e2e
`627/636 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163/978, modal
host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

Phase A expected: tsc and lint clean; jest higher pass count, 0 failed (every `test.failing`
counted as passing). Jest's default timeout is 30 s since SC-568: an "Exceeded timeout" is a real
hang until proven otherwise — re-run the suite alone first, don't blame load. Before `npx jest`,
`rm -f main.js styles.css` in the plugin root ONLY (literal path inside your worktree — that is the
one permitted rm; see dse-verify "Stale main.js").

Phase B (later): lifecycle 63/64 or 64/64 (G-S61 only); e2e `N/M ok, 0 failed, K known-bug,
coverage: Y/Y` with Y > 417; shots 0 FAIL, 592; freeze 280/280 (attribute-only changes must not
move print bytes — if one moves, stop and report, never touch the baseline); parity 0/0/24 (report
any move in host-leak or DOM numbers). Parity runs LAST. The lifecycle parts are listed in the
ledger's battery section (`--only=` with an EQUALS sign; check the log's first lines show only that
part's ids).

Command shapes — all from devbox with an explicit project dir:
`devbox run -c /home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup/draw-steel-elements -- bash <your-script-file>`
where the script file `cd`s into the dse dir and runs ONE gate with output redirected to a unique
log and the exit code written to a unique rc file. Read each gate's summary line.

## 4. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs path> -- …` for every devbox call. Write scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc442-impl-r1/`
  (exists) — every script and log inside it uniquely named. Never a generic `gate.sh`.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in `/tmp` or the scratchpad** — two workers
  this wave hung on a permission prompt doing that. Leave throwaway files in place; use fresh names
  or overwrite with `>`. Never `rm` with a shell-variable target, never a glob `rm`, never touch
  `.superpowers/` outside your report file.
- The Bash tool moves any call over 180 s to the background. Run each gate as one foreground call
  with output to a log; if it is backgrounded, wait with
  `timeout 175 tail --pid=<your own node pid> -f /dev/null` (pick the pid whose
  `readlink /proc/<pid>/cwd` is inside your worktree), repeating until it exits, then read the
  log's summary line and rc file. Never wait for a completion notice that may not come; never a
  Monitor.
- Never set `DSE_LIFECYCLE_PORT`. Give each lifecycle/e2e/shots run a private `DSE_CAMERA_TMP`
  under your scratch folder.
- Never key a wait-loop on a scratch filename or its contents from before your run — the scratch
  dir is pre-populated across sessions and branches. Use per-run unique paths.
- Redirect long-running output to a file rather than streaming it (the 600 s stream watchdog kills
  silent agents). `devbox`'s `sh` wrapper eats `$?`/`$PIPESTATUS` and `| tail` eats failures:
  capture exit codes inside a script file.
- Kill scratch processes only by literal PID, and only a PID whose command line contains
  `worktrees/sc442-e2e-counter-topup/` (or whose `readlink /proc/<pid>/cwd` is inside it). Never
  `pkill`/`killall` by pattern — SC-662 and SC-656 run the same gates concurrently.
- Token-map phantom red: if `token-coverage.test.ts` fails on a missing `--dse-*` row, compare the
  worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's before
  believing it; clear with `DSE_TOKEN_MAP_PATH` pointed at the main checkout copy.
- `e2e/vaults/plugin-data.shipped.json` is a tracked source file: never let a test write back into it.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner (`to: "main"` reaches the dispatcher, not me). If you
  need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report;
  I will resume you. If you ever do send a message anyway, its first word must be `SC-442:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/sc442-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (status, branch head sha, gate numbers vs baseline,
control count, pair count (new / existing), bug count). Then: commits (sha + subject); controls
added (id list); manifest pairs (count + full list, marking which existing specs drive which);
the census changes (what changed in each census, the regression test); jsdom matrix tests added
(file + what they cover); fixtures added; integrity probes (each, result); bugs found (title,
repro, file:line, severity, and whether it matches a known open ticket — or "none");
`Drive-by fixes:` and `Follow-ups:` sections; and every gate's log path and summary line. Phase B
will append to this same file under a `## Phase B` heading.

## 6. Return contract

Final text: raw facts, no prose — `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, branch head sha, each
gate's summary numbers, control count, pair count, bug list (title + severity + file:line), report
path, and the filesystem path of every evidence artifact you produced (logs, reports).
