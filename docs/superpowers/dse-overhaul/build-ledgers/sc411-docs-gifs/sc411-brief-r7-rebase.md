# SC-411 round 7 — rebase onto develop + re-gate (implementer tier)

Your final text goes to the ticket-owner, not a human. **Workers never call the tracker (Linear).**

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc411-docs-gifs/decisions.md`
  (Scott approved landing 2026-10-18: "land it.").
- Last gate numbers: `…/sc411-docs-gifs/sc411-r4-report.md` (r6 section).
- Gate skill: `/home/scott/code/steelCompendium/worktrees/sc411-docs-gifs/.claude/skills/dse-verify/SKILL.md`.
- Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc411-docs-gifs/draw-steel-elements`,
  branch `sc411-docs-gifs` @ `b3be096`, currently based on develop `be4f002`.

## 2. Task

`origin/develop` moved to `135716d` (SC-390: statblock Skills cell / companion via ds-scc, 9
commits; touches `src/elements/statblock/*`, tests, `visual-harness/entry.ts`, `README.md`,
`CHANGELOG.md`, docs). An owner dry-run merge shows **0 conflict markers**.

1. `git -C <plugin> fetch origin` and confirm `origin/develop` is still `135716d` (if it moved
   further, rebase onto the new tip and report it).
2. `git -C <plugin> rebase origin/develop` on `sc411-docs-gifs`. If any conflict appears:
   CHANGELOG = keep both sides' bullets; anything else → stop, `git rebase --abort`, return
   `STATUS: NEEDS_CONTEXT` with the conflict.
3. Read the merged `CHANGELOG.md` 7.0.0 section, `README.md` GIF/docs-images passages, and
   `visual-harness/entry.ts` param-handling block; confirm SC-390's and SC-411's additions both
   survive and read sanely.
4. Re-run the full gate battery (dse-verify): tsc, lint, jest (`rm -f main.js styles.css`
   first), shots, freeze, parity. Lifecycle: our diff vs develop does not touch `src/`/`main.ts`
   → skip unless that's no longer true.
5. `npm run docs-shots -- --only=<each of the 7 gifs> --check-stable` → all stable; then a full
   `npm run docs-shots` → `git status --porcelain docs/Media` must be empty (all 7 GIFs and every
   PNG byte-identical to committed); nothing new under `visual-harness/shots/`.
   - If a **PNG** drifts and it is a statblock/companion still (SC-390's area): do NOT commit it;
     restore it, and report the file names under `Follow-ups:`.
   - If a **GIF** drifts: do NOT commit; report which and by how much.
6. **Do not push. Do not tag. Do not commit anything except what the rebase produces.**

## 3. Expected numbers

Before the rebase: jest 4493 total / 4492 pass / 1 skipped / 0 fail; shots 568 / 0 FAIL; freeze
274/274; parity 0 GAPs / 0 undeclared / 24 DECLARED. SC-390 added jest tests and a harness
fixture, so **jest and shots counts may rise**. Fail counts must stay 0, freeze must stay all
pass, parity 0 GAPs / 0 undeclared. Report the count deltas and attribute them (measure
`origin/develop`'s own jest/shots counts in a scratch clone ONLY if the delta is unexplained).

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc411-docs-gifs/sc411-r7-report.md`
— ≤10-line executive summary first: new branch tip sha, base sha, gate table, 7-GIF
stable/identical table, `Follow-ups:`.

## 5. Return contract

Raw facts: verdict, new tip sha, base sha, measured numbers, plus the absolute path of every
evidence artifact/log. Blocked → `STATUS: NEEDS_CONTEXT` + the question.

## Footguns

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc411-docs-gifs/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc411-docs-gifs/draw-steel-elements && <cmd>'`
  (devbox picks its project from the CALLER's cwd unless `-c`; the plugin devbox has
  `nodejs@24`); single quotes; the command whose result you need LAST — no `| tail`, no
  `; echo`; redirect long output to a per-run unique log under
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc411-docs-gifs/r7-evidence/`
  and read it separately.
- **Every git command uses `git -C <absolute path>`.**
- **Never `pkill`/`killall` by pattern.** Kill only by PID whose command line contains
  `worktrees/sc411-docs-gifs/`.
- Real Obsidian: private Xvfb, never `DISPLAY=:1`; pick your own CDP port if the default is busy.
- Stale `main.js` shadows `main.ts` for jest — `rm -f main.js styles.css` first.
- Obsidian self-updates its asar on warm-up; if existing PNGs drift, check the asar version
  before suspecting code.
- Never touch the main checkout (`/home/scott/code/steelCompendium/workspace/draw-steel-elements`).
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches
  match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file — the 600 s stream watchdog kills silent agents.
  **Do not background a gate and end your turn waiting for it** — a job you start does not wake
  you. Run in the foreground with a long timeout, or poll it yourself.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
  routes to the TOP-LEVEL session, not to me. Need input → end with `STATUS: NEEDS_CONTEXT`.
  If you ever do send a message anyway, its FIRST WORD must be `SC-411:`.
