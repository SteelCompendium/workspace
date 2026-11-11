# SC-566 r1 — implementer brief

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc566-pool-modal-overkill/decisions.md`
  (it quotes the ticket verbatim; it is your only spec). **You never call the tracker** (Linear) —
  not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc566-pool-modal-overkill`, branch
  `sc566-pool-modal-overkill`. The plugin is `…/draw-steel-elements` inside it. Verify the path
  before any write. Never edit under `/home/scott/code/steelCompendium/workspace/` except your
  report files in the ledger dir.
- First: `git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is still
  `a339e7b3` (if it moved, rebase onto it and say so in your report).
- Read `/home/scott/code/steelCompendium/workspace/draw-steel-elements/AGENTS.md` (or the
  worktree copy) and the dse-verify skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Prior art: SC-427 (stamina edit modal: Apply label clamped to the change actually applied; see
  commit `d58cf6a7` and its neighbours, the `appliedStaminaChange` helper). SC-435 wrote the jsdom
  matrix `test/dom/views/minion-stamina-pool-modal-matrix.test.ts` and the e2e pool driver
  `e2e/driver/pool.ts`; ledgers under the worktree's
  `docs/superpowers/dse-overhaul/build-ledgers/sc435-e2e-minion-pool/` and
  `…/sc572-pool-modal-condition-keyboard/`.

## 2. Task

Ticket SC-566, verbatim from the ledger:

> **Repro:** a squad of 5 minions with a pool of 20 (4 each). Enter damage 99 and tick all 5
> minions. The pool stepper shows 0, but the Apply button reads "Deal 495 damage, kill 5
> minion(s)" and the info line reads "495 damage will kill 5…". Apply writes pool 0, which is
> correct.
>
> **Expected:** the button and info line state the change that will actually happen (20
> damage), the way the stamina edit modal has since SC-427. The preview bar showing the full
> damage is intentional and stays.

Code pointers (at dse 6270e84a; re-locate at a339e7b3): `src/views/MinionStaminaPoolModal.ts`
pending damage kept unclamped near `:199`, label near `:458`, info line near `:427`.

Do:
1. Make the Apply button label and the info line state the clamped amount (what the pool
   actually loses: never more than the pool holds). Follow the SC-427 stamina modal's wording
   shape. Leave the preview bar unclamped. Apply's written result must not change. Prefer one
   helper that both the label and info line read (as SC-427 did), not two separate clamps.
2. Flip the `test.failing('SC-566: …')` marker in
   `test/dom/views/minion-stamina-pool-modal-matrix.test.ts` (~line 715) to a plain `test`, and
   where the matrix leaves the overkill row's label out "because SC-566 owns it" (~lines 293,
   307), assert the label now. Remove the now-stale "SC-566 owns it" comments.
3. Owner ruling (ledger): "If the heal direction of the same label/info builders has the same
   unclamped defect (healing past the pool max), fold the fix in with its own test — same
   principle, same code. If it is a different code path, report it as a Follow-up." Check it
   by test first.
4. If the e2e pool spec (`e2e/specs/**`, driver `e2e/driver/pool.ts`) has an overkill test that
   deliberately skips the label, add the label assertion there (no new `[ID]` pair needed; keep
   coverage at Y/Y). Do not add a new e2e test otherwise.
5. Out of scope (ledger): SC-567, SC-573, SC-574, SC-591, SC-592. Their `test.failing` markers
   must stay failing. Report anything else you find as `Follow-ups:`; do not fix it.

TDD: write/flip the failing assertion first, see it fail for the right reason, then fix.
Commit after every coherent step, in the dse submodule, on branch `sc566-pool-modal-overkill`.
Commit messages: `fix(pool-modal): … (SC-566)`. No AI attribution lines, no co-author trailers.
Never tag, never push.

## 3. Gates — the full dse-verify battery, in the skill's order

Expected baseline at a339e7b3 (yours should match except where your change explains a delta):
- tsc clean, lint clean.
- jest: **7082 passed / 1 skipped** once shots has cached `visual-harness/dist/obsidian-app.css`
  (before a shots run: one fewer passed, 2 skipped). Flipping `test.failing` to `test` keeps the
  count; new tests add to it. SC-568 load timeouts can happen under load: re-run a timed-out
  suite alone and report both.
- lifecycle: **53/53 ok, 0 failed**, run as FIVE `--only` parts (one Bash call each, foreground):
  `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16);
  `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4);
  `G-S59 G-S49 G-S73` (3). Take the exact id lists and command shape from the skill. G-S56 stays
  LAST in SCENARIOS order. Never set `DSE_LIFECYCLE_PORT`.
- e2e: **`254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs`**.
- shots: **592** shots, host-leak **163/978**, modal host-leak **39 kinds / 234 comparisons**,
  capture clip **147**. Shots may run in the background (the only allowed background gate) —
  then poll its own log for its final line; never wait for a notification.
- freeze: **280/280**. If a frozen hash moves, do NOT touch the baseline: ship
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc566-pool-modal-overkill/rebaseline.txt`
  plus before/after crops and report it.
- parity: **0/0/24**.

## 4. Footguns (every one has cost real time)

- No compound `cd`. Use `git -C <abs path>` for every git command and
  `devbox run -c <abs path to draw-steel-elements in the worktree> -- …` for every tool.
- Devbox eats `$?`: record exit codes from a script FILE run as `devbox run -c <path> -- bash <script>`,
  and read each gate's own summary line. Never pipe a gate into `tail`.
- One gate per Bash call, in the foreground; no background gates except shots (poll its log).
  Redirect long output to a file rather than streaming it (600 s stream watchdog).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches. Read the process's own output or a per-run
  unique path.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc566-r1-impl-<yourAgentId>/`;
  uniquely named scripts and logs inside it. Write scratch files with the Write tool.
- Give each lifecycle/e2e run its own private `DSE_CAMERA_TMP` (under your scratch subfolder).
- Never `rm` with a variable target; never a glob `rm`, especially under `/tmp` (other efforts'
  lifecycle vaults match). Never `rm -rf` anything under `.superpowers/`.
- Kill processes only by literal PID, and only a PID you confirmed is yours
  (`readlink /proc/<pid>/cwd` inside your worktree). Never `pkill`/`killall` by pattern —
  SC-575 and SC-584 are running the same gates in other worktrees right now.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's live vault and expected. Do not touch it or report it.
- Do not edit the dse-verify SKILL.md. If its numbers move, say so in the report.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
  reaches the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT`
  and the question. If you ever message anyway, its FIRST WORD must be `SC-566:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc566-pool-modal-overkill/sc566-r1-implementer-report.md`.
It must open with a ≤10-line executive summary: verdict, branch head sha, every gate's
measured line vs the expected one above, the new label and info-line text for the 99 × 5 / pool
20 repro (quote them), and whether the heal direction was folded in.
Then: commit list, files touched, `Drive-by fixes:` and `Follow-ups:` sections.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured
numbers), no prose, plus the absolute path of every evidence artifact you produced (report,
gate logs, any screenshots).
