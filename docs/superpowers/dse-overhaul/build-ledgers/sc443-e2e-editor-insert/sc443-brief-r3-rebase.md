# SC-443 r3 — rebase onto develop `d582e7ff`, flip the SC-675 / SC-462 markers, full battery

You are an implementer on ticket SC-443 (e2e rollout, Tier 3: the editor insert paths of the
`draw-steel-elements` Obsidian plugin). The branch is test work plus `data-dse-control` attributes. Phases A and B
were written by an earlier worker in an earlier session; you are its replacement. Everything you need is in files.

**Workers never call the tracker (Linear)** — not to read history, not to post. Never push to origin. Never create a
tag.

## 1. Context loading (read first, in this order)

1. The ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/decisions.md`
   — read all of it; the section "Resume 2026-11-23" is the current state and carries this round's rulings R3-1..R3-5.
2. Prior report (read its executive summary; dive into the body only where you need a detail):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/sc443-r1-implementer-report.md`
3. The SC-675 ledger, for what the landed fix does and its notes for this branch (O3, the "Cross-effort note for
   SC-443", INFO-1):
   `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc675-insert-nonempty-line/decisions.md`
   and the product doc the fix added in the plugin repo (search `docs/` there for "where an insert lands").
4. The gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the battery order,
   devbox command shapes, the lifecycle `--only=` parts, the freeze and parity rules. It is 2400 lines; read the
   top (the gate table and command shapes) and the `CURRENT` paragraph (search `**CURRENT`), not the history.
5. `draw-steel-elements/e2e/README.md` and `draw-steel-elements/AGENTS.md` in the worktree.

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert` (superproject, already on workspace
`origin/main` `0ec2f4f9`; leave the superproject alone — do not commit there). The plugin repo is the submodule
`/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements`, branch
`sc443-e2e-editor-insert`, head `ae9025ea`, 6 commits on `129beb18`. **Verify the path before any write.** Never
write under `/home/scott/code/steelCompendium/workspace/` except your report file in the ledger dir. The main
checkout's own dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live
vault — not yours, not foreign, ignore it.

## 2. Task

### 2a. Rebase

`git -C <submodule path> fetch origin` (already fetched; `origin/develop` must be `d582e7ff` — if it is not, rebase
onto `d582e7ff` anyway and say so), then rebase the branch onto `d582e7ff`. Ruling, verbatim from the ledger:

> R3-1 — Rebase onto `d582e7ff`. Overlapping files: `src/authoring/suggest.ts` (keep develop's SC-675 behaviour;
> re-apply only the `data-dse-control` attributes), `test/dom/authoring/_cmEditor.ts` (develop's copy wins; additive
> changes only if a SC-443 test needs them), `e2e/README.md` (keep both).

`package.json` / `package-lock.json` did not change between `129beb18` and `d582e7ff`; run `npm ci` only if tsc shows
phantom errors. Keep the branch's commit structure (6 commits) through the rebase; put this round's work in new
commits on top (`test(SC-443): …`). Commit after every coherent step.

### 2b. Flip the markers of bugs that are now fixed

Rulings, verbatim:

> R3-2 — SC-675 / SC-462 markers become PLAIN tests that pin the exact bytes the landed fix writes (not only the
> neutral outcome): e2e AUTH-I21, AUTH-S09; jsdom `test.failing` x3 in `authoringKnownBugs.test.ts`; the SC-462
> `test.failing` in `compendiumInsertMatrix.test.ts`. The list-item jsdom case needs a list-aware assertion
> (`scanFences` does not see a fence indented in a list item). The three non-marker tests that pin the old output
> for an indented `/ds` token (`dsSuggestMatrix.test.ts` ~:133 and ~:143, e2e AUTH-S04) are rewritten to the landed
> behaviour (SC-675 ledger INFO-1: "The tests are wrong, not the fix").

Notes:
- "Exact bytes" means the whole note before and after, as the rest of the suite does: the inserted span is exactly
  what the fix writes (own lines, the cursor line's list / callout prefix, no blank lines added — SC-675 O4), the
  text before and after the cursor survives byte for byte.
- Keep the neutral-outcome helper if other tests use it; do not weaken any existing assertion to make a test pass.
- After the rebase, sweep every SC-443 test that inserts anywhere other than the start of an empty line (jsdom and
  e2e) — the three named above are the ones a reviewer found by merge, there may be more. Any test whose expectation
  encoded the old broken output is rewritten to the landed behaviour; list each one in the report with old and new
  expectation.
- Remove every `knownBug('SC-675')`, `knownBug('SC-462')` and matching `test.failing`. Comments that cite SC-675 /
  SC-462 as open are corrected (they are fixed; say "fixed by SC-675").

> R3-3 — Add real-Obsidian drives for the two insert shapes SC-675 fixed without an e2e test: an insert command with
> the cursor inside a callout line and inside a list item, each in Live Preview and Source mode, plain tests, exact
> note bytes asserted, the block renders as a DSE element (no error card). No write is driven on the list-item block
> (an indented fence cannot save: SC-461, known). No new manifest pair is needed (same control, same interaction).

Use the next free `AUTH-I*` ids. Real input only (the palette: Ctrl+P, type, Enter), as the existing AUTH-I tests do.
For the callout case in Live Preview, the "renders as a DSE element" check follows the existing pattern (cursor
leaves the block, or Reading view). If Obsidian's Reading view draws the list-item block as an error card or as plain
code, that is a finding: report what you see (see 2c), do not bend the assertion.

> R3-4 — A marker that now passes unexpectedly (SC-676 / 677 / 678 / 679), or any new product bug, is reported, not
> fixed (bug flow above unchanged).

SC-679 is being fixed in another worktree and has NOT landed: its markers (e2e AUTH-G13, AUTH-G14, AUTH-K09 and the
jsdom `test.failing`) stay exactly as they are.

### 2c. If you find a product bug

No product fixes in this ticket. Product source (`src/`) may change ONLY to add `data-dse-control` attributes — no
behaviour change. A new product bug: commit your coherent work, finish everything that does not depend on it, and
end your turn with `STATUS: NEEDS_CONTEXT` ONCE, listing every bug (title, repro, file:line, severity). The owner
files the ticket and resumes you with its key for the `knownBug('SC-…')` / `test.failing` marker.

### 2d. Scenario ids

Ids are global; a duplicate makes the e2e runner exit 2 at start. Before the battery, check your ids against
develop and, read-only, the two in-flight worktrees:
`/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup/draw-steel-elements/e2e` (uses CENSUS-18,
CENSUS-19) and `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/draw-steel-elements/e2e`.
This branch owns `AUTH-*` and `CENSUS-30..34`. Never a bracketed ticket id in a test title (SC-577).

## 3. Gates — the full dse-verify battery, in its order

Follow `dse-verify` for the command shapes. Expected numbers (baseline = develop `d582e7ff`):

| Gate | Baseline at `d582e7ff` | Expected on this branch |
|---|---|---|
| tsc (incl. `tsc -p e2e`), lint | clean | clean |
| jest (fresh worktree) | 13936 passed / 2 skipped | 0 failed; about 14188 passed / 2 skipped (+252 from the old branch) plus or minus what 2b changes — state the exact number and account for the delta. With the shots cache present it reads one more passed / 1 skipped |
| jsdom census (`test/dom/e2eCensus.test.ts`) | 82 | 88 |
| lifecycle (`npm run obsidian-lifecycle`, seven `--only=` parts) | 64/64 | 64/64 |
| e2e (`npm run e2e`, full) | `668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` | `0 failed`, `coverage: 464/464 pairs`; tests = 673 + 70 from the old branch + the R3-3 tests; known-bug = 5 + 3 (SC-679 only; the two SC-675 ones are now plain) = 8. State the exact line and account for every test added |
| shots | 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 | unchanged |
| freeze | 280/280 | 280/280 (attribute-only source changes must not move print bytes) |
| parity (last) | 0 / 0 / 24 | 0 / 0 / 24 |
| built `styles.css` | — | byte-identical to a clean `d582e7ff` build |

A full jest run must be green; an "Exceeded timeout" is a real hang until proven otherwise (re-run that suite alone
first). Known flakes on a loaded host, each allowed ONE re-run and reported as such: lifecycle G-S61 torn-read
(SC-668), G-S115 (g) (SC-633), e2e INIT-W09 / INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657), NEGO-R05. Any other
failure is real. If a doc-reading jest test (`token-coverage.test.ts`) is red, compare the worktree's copy of
`docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's before believing it.

The freeze baseline is `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256` (280
lines). **Never edit it.**

## 4. Mechanics and footguns (each one has cost a round before)

- Go / Node / npm are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements -- bash <script file>`.
  Never `cd X && …` inside a compound command. Devbox eats `$?` and pipes eat failures: run each gate from a script
  FILE (written with the Write tool) that redirects output to a log and writes the exit code to its own file, then
  read the gate's summary line from the log.
- Every git command is `git -C <absolute path> …`, never `cd X; git …`.
- Run each gate as ONE blocking foreground call (split lifecycle into its seven parts, and e2e / shots / parity into
  separate calls, each under the 10-minute tool timeout; if the full e2e run cannot fit in 10 minutes, start it with
  `nohup … &` writing to a per-run unique log and exit-code file, then poll THAT exit-code file with short blocking
  `sleep` loops). No `run_in_background`, no Monitor, never "I'll wait for the notification" — nothing will wake you.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents from another run — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the process's own output, or
  write to a per-run unique path.
- Your scratch folder is
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc443-r3-impl/`
  (create it; unique script and log names inside it). The scratchpad is shared by every agent: never a generic name
  outside your folder.
- **No `rm`, `rm -f`, `rm -rf` or `rmdir` anywhere in `/tmp` or the scratchpad**, and no `rm` with a shell-variable or
  glob target anywhere — leave throwaway files in place, overwrite with `>`. Never `rm -rf` anything under
  `.superpowers/`.
- Never `pkill` / `killall` by pattern. Kill only a PID you started, after checking `readlink /proc/<pid>/cwd` is
  inside your worktree. Other efforts run the same gates at the same time.
- Lifecycle and e2e vaults live under `/tmp`; delete none of them.
- `e2e/driver/*`: new files only where possible; list any edit to a driver file that exists on develop. Do not touch
  `src/framework/host/livePreviewFocusCarry.ts`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
  TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT
  and the question in your report — I see your completion notification and will resume you with the answer. If you
  ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-443:`) — the dispatcher routes strays by
  that key and cannot judge content to guess.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/sc443-r3-rebase-report.md`.
It must open with an executive summary of at most 10 lines: STATUS (DONE / NEEDS_CONTEXT / BLOCKED), branch head sha
and base sha, each gate's measured summary line, the count of tests rewritten / added / un-marked, any bug or
unexpected marker result. Body: the rebase conflicts and how each was resolved; every test changed in 2b with old
and new expectation; the R3-3 tests and what each asserts; the id-collision check; per-gate log paths; flake
re-runs; `Drive-by fixes:` and `Follow-ups:` sections (may be empty).

## 6. Return contract

Your final text goes to the ticket-owner, not a human — raw facts only: STATUS, head sha, base sha, each gate's
measured numbers, counts, bugs, plus the filesystem path of every artifact you produced (report, logs). No prose.
