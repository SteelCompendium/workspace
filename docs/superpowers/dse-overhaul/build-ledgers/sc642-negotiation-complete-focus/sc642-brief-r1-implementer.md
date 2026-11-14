# SC-642 r1 implementer brief — negotiation keeps keyboard focus in the card after Complete Argument

## 1. Context loading (read first)

- Ledger (current-state rulings): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc642-negotiation-complete-focus/decisions.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc642-negotiation-complete-focus`
  - dse submodule: `/home/scott/code/steelCompendium/worktrees/sc642-negotiation-complete-focus/draw-steel-elements`,
    branch `sc642-negotiation-complete-focus`, at dse `develop` `12aaf5b5`.
  - Superproject at workspace `origin/main` `ea6b4582`. Do NOT commit to the superproject (no pointer bump, no
    CHANGELOG edit) — the owner handles that.
  - Verify `pwd` / use absolute paths for every write. **Every git command is `git -C <absolute path>`**, never `cd X; git ...`.
  - First: `git -C <dse path> fetch origin` and confirm `origin/develop` is still `12aaf5b5`; if it moved, rebase
    onto it and say so in the report.
  - **Fresh worktree: no `node_modules`.** Run `npm ci` once through devbox (script file, output to a log) before the
    first gate.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is here and in the ledger.
- Required reading: workspace `AGENTS.md` (worktree rule), `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8 footguns,
  and the `dse-verify` skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (about 470 KB with very long lines: read with `sed -n 'A,Bp' | cut -c1-600`, sections "The battery, in order",
  "Devbox wrapping", "Stale main.js", "Jest timeouts under load", "Lifecycle and e2e notes", "THE exit-code footgun",
  and the CURRENT block of "Current expected numbers" (line ~1531)).
- Prior art (landed), in `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`:
  - `sc626-montage-focus-after-write*` — **the closest precedent**: montage keeps focus after a write + redraw, via
    the shared kit helper `src/framework/kit/controlFocus.ts` (`captureControlFocus` / `restoreControlFocus` /
    `controlSuccessor`, `data-dse-focus-at`, per-family `fallbacks`) and the Live Preview carry
    `src/framework/host/livePreviewFocusCarry.ts` (reads the view's `controlFocusRules()`). Read its r1 report.
  - `sc615-*` (focus after a roster press from a text box), `sc439-e2e-negotiation*` (negotiation e2e and its bug
    survey; how NEGO-F02 / NEGO-L02 reproduce), `sc637-*` / `sc638-*` (the negotiation model).
- Scott's live vault dirt in the MAIN checkout (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`,
  `demo-vault/*.md`) is expected; ignore it. You do not work there anyway.

## 2. The task

The ticket requirement, verbatim (ledger):

> **What happens:** on a negotiation's Argument tab, Tab to Complete Argument and press Enter. The argument is
> recorded, but keyboard focus leaves the card: the next Tab does not continue inside the negotiation.
>
> It happens in both Reading view and Live Preview (focus ends on the page body in each).
>
> **Expected:** focus stays on the card (for example on the first control of the next argument, or on the button
> itself).
>
> A sibling of SC-639 (focus lost after Reset). The cause may differ: Complete Argument disables the button it was
> pressed on, and Chromium moves focus off a button that becomes disabled.

Owner decisions (ledger, 2026-11-14), verbatim:

> No decision needed from Scott up front — the ticket states the expected behaviour and offers two
> acceptable landing spots. The implementer picks the landing control (prefer one that continues the flow: the
> next argument's first usable control; else the nearest usable control in the Argument tab), documents it, and the
> closing comment names it so Scott can redirect. Same pattern as SC-626's mappings.

> Prior-art rule (SC-614 / SC-585 / SC-613 / SC-626): focus is moved only when it was inside the card
> before the action; a write with focus elsewhere (outside edit, re-render with focus outside) never pulls focus in.

> Reuse the shared kit helper `src/framework/kit/controlFocus.ts` (SC-626's capture/restore/fallbacks),
> and keep the fix reusable for SC-639 (Reset drops focus) which is queued next. Do NOT fix Reset here, and stay out
> of `src/model/NegotiationData.ts` and the Reset path (SC-641 is parked on Scott and will touch both). If SC-639's
> markers (`NEGO-F01`, `NEGO-L03`, jsdom `K05`) turn green as a side effect, stop and report (NEEDS_CONTEXT).

What to do:

1. **Diagnose first, in real Obsidian.** Establish the actual mechanism (disabled-button focus loss, a card redraw
   that detaches the button, or both — e.g. Reading view vs Live Preview may differ). Use the existing e2e markers
   (`--only=NEGO-F02,NEGO-L02`) and a temporary probe if needed. Record the mechanism with evidence in the report.
   Note: jsdom keeps a disabled button as `document.activeElement`, so a jsdom test alone cannot prove the fix; a
   jsdom test can still pin the focus-target logic (which control is chosen, and the negative rule).
2. **Survey the other negotiation controls that write or disable themselves** in `src/drawSteelAdmonition/negotiation/*.ts`
   (and the negotiation element view) — report a table: control → does focus survive Enter today (RV / LP) → after
   your fix. Fix only Complete Argument and any control that loses focus by the SAME mechanism and is cheap to cover
   with the same change; anything else (other mechanism, Reset) goes under `Follow-ups:` with evidence, unfixed.
3. **Fix** with the shared kit helper, not a negotiation-private copy. Extend the kit only if the need is genuinely
   general (SC-639 should be able to reuse it); keep any kit change small and keep montage / initiative / conditions
   behaviour identical (their jest + e2e must stay green).
4. **Landing control:** per the owner decision above. Document the choice in a code comment and in the report
   (`Mapping:` line), and list the alternatives you rejected with one line each.
5. **Live Preview:** cover it (`[NEGO-L02]`), via the SC-602 carry if it applies.
6. **Tests:**
   - Flip the markers to plain tests: e2e `[NEGO-F02]` in `e2e/specs/negotiation/focus.e2e.ts` and `[NEGO-L02]` in
     `e2e/specs/negotiation/live-preview.e2e.ts` (remove the `knownBug('SC-642', …)` wrapper and its `failsWith`).
     Read the existing marker bodies: they encode the expected behaviour as SC-439 wrote it — if your chosen landing
     control differs from what they assert, adjust them and say so.
   - Add e2e tests (real keys) asserting that the NEXT Tab after Complete Argument continues inside the card, plus one
     negative (focus outside the card before a write stays outside). New ids continue the `NEGO-F` / `NEGO-L` series;
     scenario ids are global: `command grep -rna "NEGO-F0\|NEGO-L0" e2e/` before using one. **Never put a bracketed
     ticket id in a test title** (the runner reads titles for scenario ids). Any new control needs its manifest row
     (coverage gate).
   - jsdom tests for the focus-target choice and the negative rule. Each new test (jsdom and e2e) must FAIL with your
     `src/` change reverted — check this and report the count.
   - Lifecycle: add a scenario only if a path is untestable in e2e; id `G-S134` is reserved for this ticket.
7. Commit after each coherent step inside the dse submodule (conventional message, `fix(SC-642): …` /
   `test(SC-642): …`). No co-author or AI attribution lines in commits. Do not edit SKILL.md — list any SKILL text
   that goes stale under `Skill notes:` in the report.

## 3. Gates (dse-verify, full battery, in order)

Baseline at `12aaf5b5` (CURRENT): tsc + lint clean · jest **13032 passed / 2 skipped** fresh (13033 / 1 with the
shots cache) — **measure and report your own fresh figure first, before changes** · lifecycle **64/64** · e2e
`OBSIDIAN-E2E done: 576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs` · shots **592**, host-leak 163/978,
modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**.

Expected after your change: jest base + your new tests, 0 failed; e2e `(578 + new)/(597 + new) ok, 0 failed,
19 known-bug, coverage: Y/Y pairs` (the 2 SC-642 known-bugs become ok); lifecycle 64/64 (65 if you add G-S134); shots
592 with unchanged host-leak / modal host-leak / clip unless you add controls (explain any move); freeze 280/280
(a moved frozen hash = STOP and report, never touch the baseline); parity 0 / 0 / 24.

Lifecycle runs in SEVEN parts with `--only=` — **use the equals sign; with a space the runner silently runs the whole
suite** (check the first lines of each log: a part prints only its own ids). Ids comma-separated. One part per Bash
call, output to a log in your private scratch folder, and poll the pid (part 7 takes ~200 s, over the 180 s
foreground limit):

1. `G-S7a … G-S9a` (21) — take the exact id list from the SCENARIOS array in `visual-harness/obsidian-lifecycle.mjs`
2. `G-S9b … G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST in SCENARIOS order
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
6. `G-S92,G-S96,G-S97,G-S99` (4)
7. `G-S108,G-S112,G-S115` (3)

Known signals: a G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 (g) suspected
flake (SC-633): ONE re-run of part 7 on a loaded host; a red on the re-run or in any other cell is real. INIT-W10 e2e
flaked once under heavy load (SC-654): re-run `--only=INIT-W10` once and report both. SC-622: the Obsidian camera tool
can leave `demo-vault/.obsidian/appearance.json` dirty in your worktree, which made G-S97 fail — restore it
(`git -C <dse path> checkout -- demo-vault/.obsidian/appearance.json`) before blaming your change. Jest timeout is
30 s since SC-568: an "Exceeded timeout" is a real hang until proven otherwise; time-dependent tests use a fake clock
with literal gaps. `rm -f main.js styles.css` in the plugin root before `npx jest` (literal absolute path, no variables;
this is inside your worktree, not /tmp).

## 4. Footguns (every one has cost real time)

- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (two workers this wave hung on a
  permission prompt doing that). Leave throwaway files in place. No `rm` with a shell-variable target anywhere.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc642-r1-impl/`
  (create it with `mkdir -p`); uniquely named scripts and logs inside it. Use the Write tool for scratch files, not heredocs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc642-negotiation-complete-focus/draw-steel-elements -- bash <script file>`;
  never `cd` inside a compound command. Exit codes: read each gate's own summary line; record rc only from inside a
  script file. Never pipe a gate into `tail`.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- The Bash tool backgrounds any call over 180 s and notifies on completion. Prefer: start the gate with output to a
  unique log + rc file, then poll with `timeout 175 tail --pid=<your pid> -f /dev/null` on YOUR OWN pid
  (pick it by `/proc/<pid>/cwd` inside your worktree). Never wait on a monitor or a background notice you started.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions
  and branches. Read the process's own output, or write to a per-run unique path.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` or command line is in YOUR worktree.
- Never `rm -rf` a shared `/tmp` glob (`/tmp/dse-obsidian-lifecycle-*` etc.).
- e2e: never `--headed` on `:1`. `grep` is ugrep and treats `e2e/run.mjs` as binary: use `command grep -a`.
  e2e page-side strings: in a TS template literal passed to `dse.externalEdit`, write `\\n` for a newline.
- Workspace-level files live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc642-negotiation-complete-focus/` —
  never under `/home/scott/code/steelCompendium/workspace/` (except the ledger dir for reports). You should not need to edit any.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher,
  not to me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report;
  I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-642:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc642-negotiation-complete-focus/sc642-r1-implementer-report.md`.
It must OPEN with a ≤10-line executive summary (verdict, final dse sha, gate numbers). Then: mechanism (with evidence),
survey table, `Mapping:` line + rejected alternatives, files changed, reverted-src red count for new tests,
`Drive-by fixes:`, `Follow-ups:`, `Open questions:`, `Skill notes:`, and the absolute path of every evidence artifact
(logs, failure bundles).

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / DONE_WITH_CONCERNS /
NEEDS_CONTEXT / BLOCKED), final dse sha, each gate's measured summary line, report path, evidence paths. No prose.
