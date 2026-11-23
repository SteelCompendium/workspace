# SC-443 round 1 — implementer brief

You implement SC-443: real-Obsidian e2e + jsdom functional coverage of the DSE editor insert
paths (insert commands, the `/ds` suggest, in-fence schema autocomplete, compendium search +
insert). Your final text goes to the SC-443 ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/decisions.md`.
  It holds the ticket scope verbatim, Scott's rulings verbatim and the owner rulings. It is your
  only source of ticket history. **Workers never call the tracker** (Linear) — not to read, not
  to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert`, branch
  `sc443-e2e-editor-insert` in `draw-steel-elements/`. Verify with `git -C` before every write.
  Never edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared main
  checkout) except your report file in the ledger dir. Its dse dirt (modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's
  live vault — expected, not yours, don't flag it.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `129beb18`. If it moved, `git rebase origin/develop` and
  say so in the report (then `npm ci` if `package.json` changed). The worktree is fresh and has
  no `node_modules`: run `npm ci` once in its `draw-steel-elements/` (through devbox, script file,
  output to a log) before the first gate.
- Read `draw-steel-elements/e2e/README.md` first — it is the model. Then the prior art: the
  landed SC-440 settings-tab rollout and SC-438 montage rollout, ledgers + briefs + reports at
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc440-e2e-settings-tab/`
  and `.../sc438-e2e-montage/` (read each `decisions.md`; each r1 report's executive summary; each
  r2 review report's findings list — it shows what the reviewer will look for: vacuous drives that
  start at the expected end state, ids built from template strings the runner can't see, pairs
  driven but undeclared, assertions that only check a window closed, tests that pass only after an
  earlier test, a handler deletion that turns nothing red). Code prior art: `e2e/manifest/*.ts`,
  `e2e/specs/settings/`, `e2e/driver/dse.ts`, `e2e/driver/settingsDrive.ts` (incl. the
  page-side `requestUrlFn` network guard), `e2e/driver/session.ts`, `e2e/driver/env.ts`,
  `e2e/driver/noteFences.ts`, `e2e/specs/callout/` (Live Preview / callout drives),
  `e2e/vaults/plugin-data.shipped.json`, `src/framework/kit/controlId.ts`,
  `src/framework/experimental.ts`.
- Then the surface: `src/authoring/insert.ts`, `scaffold.ts`, `suggest.ts`, `schemaSuggest.ts`,
  `schemaShape.ts`, `fenceScan.ts`, `compendiumInsert.ts`, `CompendiumSearchModal.ts`, the
  registration in `main.ts` (around lines 584-600), the compendium index the search reads
  (`compendiumIndex` in `main.ts`; find its class), the existing jest tests for these files
  (`grep -rln "authoring/" test/`), and the census files `test/dom/e2eCensus.test.ts` and
  `e2e/specs/_census.e2e.ts`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — it is
  ~495 KB with some 60 KB lines: do NOT read it whole. Read the battery table rows (lines ~20-35,
  cut long lines with `cut -c1-1500`), "Jest timeouts under load" (line ~158), "Lifecycle and e2e
  notes" (line ~197), and "Current expected numbers" (line ~1532, the CURRENT paragraph only).
  Don't edit it.

## 2. The task

Scope and Done-bar: quoted verbatim in the ledger's "Ticket scope" section — read it there. Every
owner ruling in the ledger binds you; the ones that shape the work, quoted:

> **Surface boundary.** In scope, all under `src/authoring/` plus their registration in
> `main.ts`:
> - the `insert-<id>` commands (`insert.ts` `registerInsertCommands` / `insertScaffold`, scaffolds
>   from `scaffold.ts`), for every element the palette advertises with `experimental` OFF;
> - the `/ds` EditorSuggest (`suggest.ts` `DsElementSuggest`), including its suppression inside
>   any fence (`fenceScan.ts`);
> - the in-fence key/enum EditorSuggest (`schemaSuggest.ts` `DsSchemaSuggest`, `schemaShape.ts`);
> - the two compendium insert commands `insert-compendium-reference` and `insert-compendium-block`
>   (`compendiumInsert.ts`), the search window (`CompendiumSearchModal.ts`: query, `type:` /
>   `source:` filters, result rows, keyboard and mouse pick, any modifier-key routing between
>   reference and snapshot, the empty / no-compendium state and its Sync affordance up to the
>   point a sync would start), and what each choice writes at the cursor.
> Not in scope: the generic block edit form (`FormModal.ts` / `formModel.ts`; deferred from 7.0.0
> as SC-404, behind the experimental gate), the sidebar, the sync and migration windows (SC-441's
> surface), and rendering of the inserted block beyond "it renders as a DSE element, not an error
> card". Obsidian's own suggestion-container chrome is not ours; the content our
> `renderSuggestion` draws is.

> **Round trip, both modes.** Every one of the four paths gets at least one real-editor round trip
> in BOTH Live Preview and Source mode: trigger, accept, then assert (a) the exact text inserted,
> (b) where it was inserted (the cursor line / column, or the replaced `/ds…` token only), (c) the
> cursor position after insert where the code sets one, and (d) every other byte of the note
> unchanged (compare the whole file before and after, minus the inserted span). Screen assertion:
> the inserted block renders as a DSE element (not an error card) once the cursor leaves it in
> Live Preview / on switching to Reading view.

> **Experimental gate.** Shipped specs run with `experimental` OFF: assert that hidden / deferred
> definitions (`isDefinitionHidden`: `ds-hero` per SC-190, and every deferred def per SC-406) have
> NO insert command in the palette and are NOT offered by `/ds`. One separate scenario (or a small
> set) runs with the gate ON and drives at least one deferred element's insert and `/ds` pick. Use
> the SC-440 mechanism (`dse.setPrefs({}, { experimental: true })` in before, `dse.setPrefs({})`
> in after) if it reaches command registration; if the commands are registered once at load and
> the gate needs a plugin reload, say how you did it.

> **No network, a fixture compendium.** No e2e test may reach the network. The compendium search
> and inserts run against a SMALL fixture compendium in the e2e vault: prefer an existing
> jest/visual-harness fixture set if one exists; otherwise a hand-picked handful of files — at
> least one per snapshottable family (statblock, feature, featureblock), one non-snapshottable
> type (e.g. a kit, to prove SC-149's filter), and two entries sharing a word so the fuzzy order is
> observable. If the index cannot be pointed at a fixture folder without a product change, or the
> fixture would be large, return NEEDS_CONTEXT in phase A — don't build it without a ruling. The
> empty-compendium state (no files) is also driven: its Sync affordance is driven only to the point
> a sync would start, with the SC-440 page-side `requestUrlFn` stub that throws unless a test
> installs its own.

> **Bug flow** (same as SC-438..440). Workers never touch the tracker. A worker that finds a
> product bug commits its coherent work, finishes the survey, and returns `STATUS: NEEDS_CONTEXT`
> ONCE with every bug's title, repro, file:line and severity. The owner files the Backlog ticket
> (DSE 7.0.0, Bug + DSE Plugin, related to SC-443) and resumes the worker with the key, which the
> worker then cites in `knownBug('SC-…')` / `test.failing`. No product fixes in this ticket;
> product source may change ONLY to add `data-dse-control` attributes (and census plumbing) — no
> behaviour change.

> **Shared e2e infrastructure.** `e2e/driver/*` changes are shared with SC-442 (in flight, counter
> top-up) — keep them small and additive (new driver files preferred over edits to existing
> ones). Any edit to an EXISTING `e2e/driver/*` file, or to editor focus code
> (`host/livePreviewFocusCarry.ts` — SC-667 is in it), must be listed in the phase A report so the
> owner can tell the dispatcher before phase B.

> **Scenario ids.** e2e ids `AUTH-*`: `AUTH-I*` insert commands, `AUTH-S*` `/ds` suggest,
> `AUTH-K*` in-fence autocomplete, `AUTH-C*` compendium search + insert, `AUTH-G*` gate-ON. Census
> ids start at `[CENSUS-30]` (SC-442 in flight uses 18+). Scenario ids are global: check
> `grep -rn '\[AUTH-' e2e/` on develop AND the parallel SC-442 worktree
> (`/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup`, read-only); a duplicate id
> makes the runner exit 2 at start (SC-436). Never a bracketed ticket id in a test title (SC-577).

Known open tickets on this surface (cite, don't report as new) and fixed bugs that must stay fixed:
see the ledger's "Known open tickets" ruling. In short: SC-462 (open — inserting inside a callout
drops `> `; the callout insert drive gets `knownBug('SC-462')`), SC-404, SC-391, SC-667 (in
flight); fixed: SC-476, SC-601, SC-159, SC-148, SC-147, SC-390, SC-165, SC-149, SC-190, SC-406,
SC-422, SC-156, SC-236 — a regression of a fixed one is a new bug, report it.

Ids must be literal strings in test titles (`[AUTH-I01]`, never `[AUTH-${x}]`): the runner reads
titles statically. Where a test loops over elements, give each generated test a literal id via a
table of literal ids.

### Phase A (this round) — then STOP

1. `data-dse-control` on every interactive node the surface draws: the `/ds` suggestion rows and
   the schema suggestion rows our `renderSuggestion` draws, the compendium search window (input
   if ours, result rows, any buttons — Sync / empty-state affordance, action hints if clickable).
   Commands have no DOM of their own: list each `insert-*` / `insert-compendium-*` command as a
   manifest control with the palette (or `app.commands.executeCommandById` — say which counts as
   "real input"; prefer the palette / a hotkey through real keyboard) as its interaction. Use
   `controlId.ts` / existing plumbing; ids prefixed `authoring.` (refine if a better prefix
   exists, say why).
2. Both censuses cover the surface by CONTAINER scoping (the suggestion container while our
   suggester is open; the compendium search modal root), not by CSS class (the SC-437/SC-438/
   SC-440 census pattern): any eventful node inside must carry an id from the manifest or an
   allowlisted id (Obsidian's own chrome allowlisted with a reason). Prove it catches a
   regression: a jsdom test that injects an un-id'd button and expects a census finding. Say how
   the real-Obsidian census opens each surface.
3. The manifest (`e2e/manifest/authoring.ts`, or split if it reads better): every (control,
   interaction) pair — command run; `/ds` type → filter, arrow keys, Enter, Tab if Obsidian accepts
   it, click, Escape; schema suggest: key list, `key:` enum list, accept by Enter and click; search
   window: type, filters, arrow + Enter, click, modifier pick (if the code routes on `evt`),
   Escape, empty-state Sync. Same comment style as existing manifests.
4. jsdom matrix tests for the combinatorial logic: every registered element × its scaffold (insert
   command and `/ds` give the same text; cursor offset lands on the first body character); hidden /
   deferred × gate OFF / ON → which elements are offered; `/ds` query filtering by name and alias,
   word-boundary (no trigger mid-word), suppression inside any fence (ds-* and non-ds, open and
   closed, tilde fences, indented / callout fences if `fenceScan` handles them); schema suggest:
   per element, offered keys and enum values, already-present keys, opening line with extra words
   (SC-476), allOf / $ref schemas; compendium: query × `type:` / `source:` filters, reference vs
   snapshot output per family, non-snapshottable types filtered from the block command (SC-149),
   snapshot carries no `metadata:` (SC-165), insert at line start / mid-line / end of file / with
   a selection / inside a callout (SC-462). Put them under `test/dom/` next to the existing
   authoring tests.
5. The bug survey: probe the surface (jsdom probes are cheap) for real defects. Integrity probes
   are mandatory because these paths write into the user's note: text above and below the
   insertion survives byte-for-byte (incl. CRLF line endings and a note with no trailing newline);
   a selection is replaced and nothing else; `/ds` replaces only its token, not the rest of the
   line; accepting a schema suggestion writes only the key / value and keeps indentation; two
   ds-* blocks in one note — autocomplete inside the second uses the second's language; inserting
   at the top / bottom of the file; undo (Ctrl+Z) restores the note in one step if the code
   intends it (report what it does; not a bug unless clearly wrong). Batch the bugs.
6. Answer, in the report, the open mechanics: (a) how the fixture compendium is wired (where the
   files live, how the index finds them, size); (b) how the gate-ON scenario flips `experimental`
   and whether the insert commands / `/ds` re-read it without a reload; (c) how e2e switches a
   note between Live Preview and Source mode and how it types into the CodeMirror editor through
   real input; (d) which existing `e2e/driver/*` files you need to edit, if any, and whether you
   touch `host/livePreviewFocusCarry.ts` (you should not need to).
7. Commit inside `draw-steel-elements/` after every coherent step. Messages `test(SC-443): …` /
   `feat(SC-443): …`; no Claude/AI attribution or co-author trailers. Do not push. Do not touch
   the superproject pointer or commit anything in the superproject.
8. Gates for phase A only: tsc (incl. `tsc -p e2e` if the battery runs it), lint, jest (full run),
   and the jsdom census. No e2e/lifecycle/shots yet. Then write the report and return
   `STATUS: NEEDS_CONTEXT` — **even with zero bugs** — with the pair list, the bug list and the
   answers to item 6.

### Phase B (after the owner resumes you; for reference only now)

e2e specs under `e2e/specs/authoring/` driving every manifest pair through real input in both
Live Preview and Source mode where the ticket asks, asserting the note file (exact inserted text,
position, rest unchanged) and the screen (at least one plain driver per pair); the real-Obsidian
census extended; the gate-ON scenario; markers citing the keys the owner gives you; then the full
battery.

## 3. Gates (dse-verify battery, against the worktree)

Baseline at `129beb18`: jest 13703 passed / 1 skipped WITH the shots cache (a fresh worktree may
read one fewer passed and 2 skipped — measure and report your own fresh figure) · lifecycle 64/64 ·
e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` · shots 592, host-leak 163/978,
modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

Phase A expected: tsc and lint clean; jest higher pass count, 0 failed (every `test.failing`
counted as passing). Jest's default timeout is 30 s since SC-568: an "Exceeded timeout" is a real
hang until proven otherwise — re-run the suite alone first, don't blame load.

Phase B (later): lifecycle 64/64 in seven `--only=` parts (see the ledger); e2e
`N/M ok, 0 failed, K known-bug, coverage: Y/Y` with Y > 418; shots 0 FAIL, 592; freeze 280/280
(attribute-only changes must not move print bytes — if one moves, stop and report, never touch the
baseline); parity 0/0/24, run LAST.

Command shapes — all from devbox with an explicit project dir:
`devbox run -c /home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements -- bash <your-script-file>`
where the script file `cd`s into the dse dir and runs ONE gate with output redirected to a unique
log and the exit code written to a unique rc file. Read each gate's summary line.

## 4. Footguns (each cost real time once)

- No compound `cd X && …` in a Bash call. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs path> -- …` for every devbox call. Write scratch files with the Write tool.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc443-impl-r1/`
  (exists) — every script and log inside it uniquely named. Never a generic `gate.sh`.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in `/tmp` or the scratchpad** — workers have
  hung on a permission prompt doing that. Leave throwaway files in place; use fresh names or
  overwrite with `>`. Never `rm` with a shell-variable target, never a glob `rm`, never touch
  `.superpowers/` outside your report file.
- The Bash tool moves any call over 180 s to the background. For long gates (full jest, lifecycle
  part 7, full e2e): run the gate with output to a log, then wait with
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
  `worktrees/sc443-e2e-editor-insert/` (or whose `readlink /proc/<pid>/cwd` is inside it). Never
  `pkill`/`killall` by pattern — other efforts run the same gates concurrently.
- Token-map phantom red: if `token-coverage.test.ts` fails on a missing `--dse-*` row, compare the
  worktree's `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's before
  believing it; clear with `DSE_TOKEN_MAP_PATH` pointed at the main checkout copy.
- The e2e vault is a disposable copy, but `e2e/vaults/plugin-data.shipped.json` and
  `e2e/vaults/shipped/**` are tracked sources: never let a test write back into them.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner (`to: "main"` reaches the dispatcher, not me). If you
  need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your
  report; I will resume you. If you ever do send a message anyway, its first word must be
  `SC-443:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/sc443-r1-implementer-report.md`.
It must open with a ≤10-line executive summary (status, branch head sha, gate numbers vs
baseline, control count, pair count, bug count, the four mechanics answers in one line each).
Then: commits (sha + subject); controls added (id list, grouped by path); manifest pairs (count +
full list); the census changes (what changed in each census, the regression test); jsdom matrix
tests added (file + what they cover); fixtures added; integrity probes (each, result); bugs found
(title, repro, file:line, severity, and whether it matches a known open ticket — or "none");
`Drive-by fixes:` and `Follow-ups:` sections; and every gate's log path and summary line. Phase B
will append to this same file under a `## Phase B` heading.

## 6. Return contract

Final text: raw facts, no prose — `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, branch head sha, each
gate's summary numbers, control count, pair count, bug list (title + severity + file:line), the
four mechanics answers, report path, and the filesystem path of every evidence artifact you
produced (logs, reports).
