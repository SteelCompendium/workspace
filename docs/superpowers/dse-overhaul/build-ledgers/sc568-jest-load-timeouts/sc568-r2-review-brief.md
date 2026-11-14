# SC-568 r2 brief — independent reviewer

## 1. Context loading

- Ledger (your spec): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc568-jest-load-timeouts/decisions.md`
  (ticket text verbatim + owner decisions D1–D4).
- Implementer report: `.../sc568-jest-load-timeouts/sc568-r1-report.md` (same dir). Treat its
  claims as claims; re-measure what matters.
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  lines 1–220 only (it is ~430 KB) plus the first paragraph after `## Current expected numbers`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc568-jest-load-timeouts`, plugin
  `.../draw-steel-elements`, branch `sc568-jest-load-timeouts` @ ed4044aa on dse develop
  `df92a3f6`. Do NOT commit to that branch. For base comparisons make your own scratch worktree:
  `git -C <plugin> worktree add /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r2-rev/base df92a3f6`
  (needs its own `npm ci`, or symlink `node_modules` from the branch plugin), and remove it with
  `git worktree remove` when done.
- **Workers never call the tracker.** Never touch the main checkout.

## 2. The task — execute and probe, not just read

Review the branch diff `df92a3f6..ed4044aa` against D1–D4. At minimum:

1. **Does the 30 s default actually apply to both jest projects (`unit`, `dom`)?** Prove with a
   throwaway slow test in each (not committed), on the branch, and show it fails on base.
2. **Clock-independence conversions keep their teeth.** For each test changed from real time to
   fake timers / injected clock (at least `chromeFocusHandoff` "SC-505 r3 LOW-A"): apply mutants to
   the product code it guards (e.g. break the `SETTLE_MS` / `REQUEST_TTL_MS` window logic in
   `chrome/focusHandoff.ts`: TTL never expires, settle window ignored, off-by-one on the boundary)
   in a scratch copy, and show the converted test goes red where the original would. Revert every
   mutant; `git status` clean at the end.
3. **No vacuous waits**: fake timers that never advance, `await` on something that resolves
   immediately, assertions moved before the thing they check, tests turned into `test.skip` /
   `.failing` / removed. Count tests: base vs branch, by file, for every changed test file.
4. **Contention repro**: re-run the implementer's contention recipe `taskset -c 0 npx jest -w 11` (the `-w 11` is required; without it jest runs in band and stays green; the implementer's base repro was at 1cc54eac, so measure base at df92a3f6 yourself)
   on base and branch — base should show timeout reds, branch none. 2 runs each minimum. Record
   `/proc/loadavg` at each run.
5. **D1**: bundle `main.js` / `styles.css` sha256 byte-identical to a build of `df92a3f6`; any
   `src/` diff justified as a pure test seam.
6. **Other suites near the limit**: from a `--json` run, are there tests that still sit close to
   the new limit or depend on real elapsed time that the branch missed?
7. **Macrotask-hop waits** (`reading-mode-host-pin`, `reading-mode-host-crlf-hover`): the branch
   replaced `setTimeout(25)` with waiting N macrotask hops. Is N coupled to an implementation
   detail so a harmless refactor (one more `await` in the mock vault or host) silently makes the
   wait too short and the test vacuous or red? Prefer a wait on the observable condition; say
   which is right.
8. For finding 6, list the remaining fixed real-time sleeps used as "async is done" proxies with a
   risk rank (file:line), so the owner can scope a follow-up ticket; do not fix them.
9. Read `sc568-skill-proposal.md` in the ledger dir: accurate and short?

Lifecycle/e2e: do NOT re-run them if the bundle is byte-identical and the implementer reported
them green; say so.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc568-jest-load-timeouts/sc568-r2-review.md`
— opens with a ≤10-line executive summary: verdict LAND-READY / FIX-ROUND, then findings by
severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix. Raw logs in a
private folder `.../scratchpad/sc568-r2-rev/` with unique filenames.

## 4. Return contract

Final text goes to the ticket-owner: verdict, findings list (severity, file:line, one line each),
measured numbers, absolute paths of every evidence artifact. No prose.

## Footguns (all apply)

- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or contents; per-run unique paths.
- Redirect long output to files.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` + question if blocked. If you
  ever message anyway, first word `SC-568:`.
- Devbox: `devbox run -c <abs plugin path> -- bash /abs/script.sh`; no `cd X && …` compounds;
  `git -C <abs path>` always; devbox eats `$?` — capture exit codes inside a script file written
  with the Write tool, and read each gate's own summary line. `rm -f main.js styles.css` in the
  plugin root before jest (stale bundle shadows `main.ts`).
- Blocking foreground calls; the Bash tool backgrounds calls over 180 s and notifies you; no
  `Monitor`, no self-started background jobs you then wait on. Keep each call under 10 min (split
  `--selectProjects unit|dom` under taskset if needed).
- Never `pkill`/`killall` by pattern; kill only PIDs whose `/proc/<pid>/cwd` is yours. Never
  `rm -rf`/`rm -f` a glob; no `rm` with a shell-variable path; delete only literal paths you
  created. Never touch other efforts' dirs or `.superpowers/` beyond your report.
- Never put a bracketed ticket id in a test title.
