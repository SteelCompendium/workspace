# SC-509 r4 brief — rebase onto 38f94f4 (+ fix round if any), battery (implementer B, resumed)

## 1. Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/decisions.md`; review report `sc509-r3-review-report.md` in the same dir.
- dse develop moved 7046eb0 → **38f94f4** (SC-500: initiative control ids plus the e2e manifest; test-only). Superproject `origin/main` has moved too.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh`. Workers never call the tracker.

## 2. Task
Reviewer C's verdict at a426882 was LAND-READY, with one finding folded into this round. LOW-2, verbatim from `sc509-r3-review-report.md`:

> `obsidian-lifecycle.mjs:2497-2518` and the sidebar phase: G-S40 never checks the note text outside the block, although the fixtures have ABOVE/BELOW. Fix: `t.expect(t.read(rel) === FIXTURES[rel].replace(old, new))` or `t.integrity(rel).ok`.

Owner ruling: in both the Reading phase and the sidebar phase, G-S40 asserts that the whole note equals the fixture with only the edited value changed. Commit this as one `test(SC-509): …` commit on top, before you rebase.

Out of scope, so do not touch them:
- SC-518 (focus after Save)
- SC-519 (form opened during the debounce)
- any `src/` change
- FormModal


Then rebase:
- `git -C /home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh/draw-steel-elements fetch origin`, then `git -C <same> rebase origin/develop`. Expected base: 38f94f4. If it conflicts in the lifecycle harness or the e2e manifest (SC-500 touched e2e), keep both sides. G-S40 stays G-S40.
- Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh fetch origin`, then `git -C <same> rebase origin/main`. Keep only your CHANGELOG commit, and keep both bullets on a conflict.
- If `package.json`'s obsidian version changed, run `npm ci`.
- Record `git -C <plugin> range-diff 7046eb0..a426882 38f94f4..HEAD` to `sc509-r4-range-diff.txt` in the ledger dir.

## 3. Gates — full dse-verify battery on the rebased HEAD
Expected at 38f94f4: tsc/lint clean · jest **6027 + your new / 1 skipped / 244 of 245** suites (after shots) · lifecycle **37/37** · e2e **`114/114 ok, 0 failed, 0 known-bug, coverage: 82/82 pairs`** · shots **592**, 0 FAIL · freeze **280/280** · parity **0/0/24**.

## 4/5. Report + return
Write `sc509-r4-rebase-report.md` in the ledger dir, opening with a summary of 10 lines or fewer. Final text: raw facts (new base, new shas, each gate's summary line, range-diff verdict) plus absolute artifact paths.

## Footguns
The same set as in your r2 brief (`sc509-brief-r2-impl.md`), all mandatory:
- Use your private scratch subfolder.
- Never key a wait-loop on a scratch filename or its contents.
- Redirect output to files.
- Run every gate as one blocking foreground call. For shots, run it as a script whose exit code you write to a unique file, and poll the gate's own log or rc file — never wait for a notification.
- Use `devbox run -c <abs>`, with no `cd` in a compound command.
- Use `git -C` only.
- Never `rm` a variable or glob target, and never `rm -rf` a shared `/tmp` glob.
- Kill processes by PID only, with an ownership check.
- If you need input, end with NEEDS_CONTEXT, and the first word of any message is `SC-509:`.
- If the report write is blocked, return the report inline.
