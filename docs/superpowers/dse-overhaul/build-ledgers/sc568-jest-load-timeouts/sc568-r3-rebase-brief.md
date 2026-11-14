# SC-568 r3 brief — rebase onto dse develop 14521bf0 + re-verify (implementer)

## Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc568-jest-load-timeouts/decisions.md`
  (read "Baseline moves" and "Rounds"). Your own r1 report is `sc568-r1-report.md` in the same dir;
  the r2b review is `sc568-r2b-review.md`.
- Worktree plugin: `/home/scott/code/steelCompendium/worktrees/sc568-jest-load-timeouts/draw-steel-elements`,
  branch `sc568-jest-load-timeouts` @ `ed4044aa` on `df92a3f6`. **Workers never call the tracker.**
  Never touch the main checkout. Do not touch the superproject (the owner bumps the pointer).

## Task

1. FIX ITEMS (if any): apply, on the branch BEFORE rebasing, every finding the owner ruled
   FIX or FOLD in the ledger's "r2b review DONE" entry: MEDIUM-1, MEDIUM-2, LOW-3, LOW-4, INFO-5,
   INFO-7, INFO-8. The findings' text, file:line and prescribed fixes are in
   `sc568-r2b-review.md` (same dir) — read each finding there in full and implement its prescribed
   fix; quote of the rulings: "LOW-3 (hop-count waits) FIX — wait on the observable condition,
   bounded"; "INFO-5 ... FOLD — correct the comment"; INFO-6 is DROPPED (out of scope, do not
   touch the other fixed-sleep suites). For MEDIUM-1/-2 and LOW-3, re-run the reviewer's mutants
   (its scripts are in `.../scratchpad/sc568-r2b-rev/` — `mut.sh`, `mutall.sh`, `logs/mut-summary.txt`)
   and show each mutant the base catches is now caught by the branch too (mutants applied to a
   scratch copy or reverted with `git checkout -- <literal path>`; never committed). INFO-8: edit
   `sc568-skill-proposal.md` in the ledger dir. Commit per coherent step.
2. `git -C <plugin> fetch origin`; confirm `origin/develop` is `14521bf0` (SC-586 landed); rebase
   the branch onto it. Resolve conflicts keeping develop's product changes. Check whether SC-586's
   new jsdom tests (Conditions window colour chooser) use fixed real-time sleeps that the
   contention recipe reddens; if so, apply the same treatment as r1 (fake clock or hop count) and
   say so.
3. Re-verify on the rebased head:
   - tsc clean, lint clean.
   - quiet full jest (`git -C <plugin> clean -fqX -- main.js styles.css` first (they are gitignored, so `-X`); no shots cache):
     expected **11833 passed / 2 skipped** + your delta (state it).
   - contention: `taskset -c 0 npx jest -w 11` full run x3, 0 failed each; loadavg at each start.
   - bundle identity: sha256 of `main.js` and `styles.css` from a build of the rebased head vs a
     clean build of `14521bf0` (build that in a scratch `git worktree add` at a literal path in
     your private folder). Must be byte-identical.
   - `git -C <plugin> diff --stat 14521bf0..HEAD` must touch no file under `e2e/`,
     `visual-harness/`, `src/`, `main.ts`, `styles*`. If both this and bundle identity hold,
     do NOT run lifecycle/e2e/shots/freeze/parity (owner decision in the ledger). If either fails,
     STOP and report.
4. Final `git -C <plugin> status` clean; report the final head sha and `git log --oneline 14521bf0..HEAD`.

## Report

`.../sc568-jest-load-timeouts/sc568-r3-report.md`, opening with a ≤10-line executive summary;
logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r3-impl/`
(new folder, unique names). Final text to the owner: raw facts, shas, numbers, absolute paths.

## Footguns

- **No `rm` of any kind** this round (a prior worker hung on a permission prompt over `rm -f`).
  Use `git clean -fqX -- <literal paths>` for ignored build outputs; leave anything else in place.
  Do not remove scratch worktrees; the owner cleans up.
- If the report write is blocked, return it inline. Never key a wait on a scratch filename/contents.
  Redirect long output to files.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` + question if blocked. If you
  message anyway, first word `SC-568:`.
- `devbox run -c <abs plugin path> -- bash /abs/script.sh` (scripts written with the Write tool,
  uniquely named); no `cd X && …`; `git -C <abs>` always; devbox eats `$?` — capture rc inside the
  script and read jest's own `Tests:` line.
- Blocking foreground calls; the Bash tool backgrounds calls over 180 s and notifies you; no
  `Monitor`, no self-started background jobs you wait on. Keep each call under 10 min.
- Never `pkill`/`killall` by pattern; kill only PIDs whose `/proc/<pid>/cwd` is yours.
- Never put a bracketed ticket id in a test title.
