# SC-534 r2 — simplify CHR-L01 (single hover, default click), rebase onto dabfb518, full battery

You are the implementer for ticket SC-534. Your final text goes to the ticket-owner, not a human. **Workers never call
the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc534-e2e-chrl01-flake/decisions.md` — read it
  all; "r1 verdict" and "Owner rulings on r1" are your task. r1's evidence: the executive summary of
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc534-e2e-chrl01-flake/sc534-r1-report.md`.
- Worktree: plugin `/home/scott/code/steelCompendium/worktrees/sc534-e2e-chrl01-flake/draw-steel-elements`, branch
  `sc534-e2e-chrl01-flake`, currently at `97284051` with no commits of its own. Verify `pwd`/`git -C … log --oneline -1`
  before any write.
- **Rebase first:** `git -C <plugin> fetch origin` then `git -C <plugin> rebase origin/develop`; HEAD must sit on
  **`dabfb518`** (SC-537 landed; no e2e harness change). If `origin/develop` is not `dabfb518`, stop and report
  NEEDS_CONTEXT. Run `npm ci` only if `package.json`/`package-lock.json` changed between `97284051` and `dabfb518`.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery order, command
  shapes, e2e section incl. the SC-539 pointer-park bullet).
- The main checkout (`/home/scott/code/steelCompendium/workspace`) shows dse dirt (`demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) — Scott's live vault, expected; ignore it. Never write in the main
  checkout except your report files in the ledger dir.

## 2. The task (owner rulings, quoted from the ledger)

> - **Adopt B2**: replace `chrome-live-preview.e2e.ts:43-48` with a single `await dse.hover(root.root)` followed by the
>   existing reveal `waitFor`. Delete what becomes unused (`waitStable` :19-34, `browser` from the :7 import if unused;
>   `panelRevealed` :16-17 either deleted or reused as the predicate of the two reveal `waitFor`s — implementer's choice,
>   whichever reads plainer). Rewrite the :43-44 comment: say the hover must reveal the panel on the first try, and that
>   earlier flakes here were the shared-Xvfb pointer crossing fixed by SC-539 (not Live Preview layout).
> - **Fold D (in scope, owner ruling)**: restore the driver's default `dse.click(collapse)` at :54. Reason: it is the
>   same SC-502 r3 workaround, added for the same misdiagnosed "full-run load" cause as the loop, in the same 20-line
>   test; the default click's pre-click hit-test is the STRONGER check (a covered Collapse fails loudly as "element click
>   intercepted"), so this tightens what CHR-L01 proves rather than weakening it. Evidence 25/25 under churn and CPU x20.
>   Rewrite the :51-53 comment accordingly.

Constraints: the diff touches ONLY `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`. Every assertion that stays
(reveal on hover, stays revealed with the pointer on Collapse, collapses after the click, cursor line 0 three times,
expand after the click) stays. Comments: plain, literal sentences; no "SC-502 r3"-style round references.
Commit (one commit, message `test(SC-534): CHR-L01 hovers once and clicks Collapse with the default click (the SC-539 pointer park removed the cause of the old retries)` or similar).

Out of scope (ruled): the driver's `waitStable(el)` / `click({ stable: true })` in `e2e/driver/dse.ts`; `e2e/run.mjs`
(SC-546 owns `startXvfb`). Drive-by fixes only inside the one spec file.

## 3. Proof at the new head (temporary instrumentation, never committed)

Re-apply r1's probe diff
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc534-r1-a1/sc534-r1-probe-instrumentation.diff.txt`
— ONLY its `e2e/driver/session.ts` and `e2e/run.mjs` hunks (churn generator, `SC539-XING` counter, `SC534_CPU`,
`SC534_NOPARK`); NOT its spec hunks (your committed spec is the one under test). r1's runner script
`…/sc534-r1-a1/batch.sh` is a model; copy it into your own scratch folder, don't run it in place. Then, on your commit:
- `--only=CHR-L01`, `SC539_CHURN_MS=150`, park on: **10 runs** → expect 10/10 ok, 0 leaves.
- `SC534_CPU=20`, park on: **5 runs** → expect 5/5.
- Control `SC534_NOPARK=1` + churn 150: **2 runs** → expect 0/2 (fails at the reveal wait).
Revert the instrumentation (`git -C <plugin> checkout -- e2e/driver/session.ts e2e/run.mjs`), confirm
`git -C <plugin> status --short` prints nothing, before the battery.

## 4. Gates (dse-verify battery, on the clean committed tree) — expected numbers at `dabfb518`

1. tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
2. jest: **6262 passed / 1 skipped / 249 of 250 suites** (fresh worktree without a shots cache: 6261 / 2 is the same
   result). Follow dse-verify's `rm -f main.js styles.css` before jest.
3. lifecycle **46/46**, as THREE `--only` parts, each its own foreground call:
   `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S56` (9) —
   take the exact id lists for parts 1 and 2 from dse-verify's lifecycle row. Set your own `DSE_LIFECYCLE_PORT`.
4. e2e full, **twice**: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, each preceded by
   `OBSIDIAN-E2E pointer parked at 0,0 on :2xx (outside every window)`.
5. Shots / freeze / parity are NOT run: instead prove `main.js` and `styles.css` built from your HEAD are byte-identical
   (sha256) to a build of `dabfb518` (the change is spec-only), so the dabfb518 shots 592 / freeze 280/280 / parity
   0/0/24 carry. Record both sha pairs.

If anything is off baseline, stop and report with the failure line + bundle path; do not "fix" outside the spec.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc534-e2e-chrl01-flake/sc534-r2-impl-report.md`,
opening with a **≤10-line executive summary** (HEAD sha + parent, diff stat, proof k/n per condition, every gate's
summary line, sha256 match yes/no). Copy gate logs into the ledger dir as `sc534-r2-gate-<name>.log` and the proof
batch summaries as `sc534-r2-proof-<label>.txt`. Put the final spec diff in `sc534-r2-spec.diff.txt`.

## 6. Return contract

Final text: raw facts only — HEAD sha, parent sha, gate summary lines, proof k/n, sha256 pairs — plus the **absolute path
of every evidence artifact**. `Drive-by fixes:` (made) and `Follow-ups:` (left alone) as separate lists. No prose padding.

## 7. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc534-r2-<yourAgentId>/`;
  every script and log there, uniquely named. Use the Write tool for scratch files — **no heredocs**.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Each gate / batch is ONE blocking foreground Bash call under 10 minutes. No `run_in_background`, no Monitor, no
  background jobs.
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc534-e2e-chrl01-flake/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command; no `cd X && …`. Devbox eats `$?`: record exit codes inside the script file and
  read each gate's summary line.
- Every git command as `git -C <absolute path> …`.
- Never `rm` with a shell-variable target, never a glob `rm`, never `rm -rf` a shared `/tmp` glob (e.g.
  `/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/` dir. Use literal absolute paths or fresh filenames.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains
  `worktrees/sc534-e2e-chrl01-flake/` (or whose `readlink /proc/<pid>/cwd` is inside it).
- e2e and lifecycle use their own Xvfb; never `:1`, never `--headed`.
- Copy any e2e failure bundle (`e2e/.out/<run>/<test-id>/`) to your scratch folder right after the run.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question
  in your report; I will resume you. If you ever do send a message anyway, its first word must be `SC-534:`.
