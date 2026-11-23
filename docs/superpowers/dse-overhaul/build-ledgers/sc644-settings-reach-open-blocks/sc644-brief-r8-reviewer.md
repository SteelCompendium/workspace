# SC-644 r8 reviewer brief — scoped re-review of the r7 rebase delta ONLY

Your final text goes to the SC-644 ticket-owner, not a human. Raw facts only (verdict, shas, measured numbers).
**Workers never call the tracker** (Linear) — not to read history, not to post. You did not author any of this work.

## 0. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc644-settings-reach-open-blocks/decisions.md`
  (read the tail from "PARKED on Scott (2026-11-14)" onward; the O1/O2 owner rulings near the top; Scott's ruling S1).
- Scott's ruling, verbatim: **S1 (2026-11-22): "Go with recommendation"** — "Start collapsed" does not touch blocks already
  open; it applies to blocks drawn afterwards. `START_COLLAPSED_REACHES_OPEN_BLOCKS` stays `false`.
- The rebase round's report (read the executive summary first):
  `…/sc644-settings-reach-open-blocks/sc644-r7-impl-report.md`
- Earlier full reviews (for what was already probed — do not redo them): `sc644-r2-review-report.md`,
  `sc644-r4-rereview-report.md`, `sc644-r6-check-report.md` in the same dir. Summaries only.

Worktree (read/probe; do NOT commit to the branch — you are a reviewer):
- plugin: `/home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks/draw-steel-elements`
  branch `sc644-settings-reach-open-blocks`; head and base shas are in §1 below.
- superproject: `/home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks`
- If you need to mutate source for a probe, do it in a private copy: `git -C <plugin> worktree add <abs scratch path> <head sha>`
  into your own scratch folder (never re-point remotes, never probe-edit the branch worktree in place while a gate could
  read it). Remove only the worktree you created, by its literal path (`git -C <plugin> worktree remove <abs path>`).

## 1. What changed since the last LAND verdict (r6, head `2762beb5` on `10c271fe`)

Only a rebase: dse onto develop `3b47e55b` (92 commits later), head now `76644e80`; superproject head
`e10f4e5c` on origin/main `1c877748`. r7 reported: no conflicts; commits 1-7 range-diff identical; commit 8 (`76644e80`, r7b) is NEW and comment-only (2 files: the doc comment above `START_COLLAPSED_REACHES_OPEN_BLOCKS` in `src/framework/pipeline.ts` and one comment line in `e2e/specs/settings/live-behavioural.e2e.ts`), built `main.js` sha256 identical before/after it (verify: build at `2302b561` and at `76644e80` in private copies, or trust-but-check the diff is comments only); full battery green on `2302b561` (logs in `…/scratchpad/sc644-r7-impl/`).

## 2. Your task — the delta only, not a fresh full pass

1. **Range-diff.** Run `git -C <plugin> range-diff 10c271fe..2762beb5 3b47e55b..76644e80` yourself. Every commit
   should be `=` (identical) or differ only by context lines. For each non-identical commit, read the inter-diff and judge
   it. Any r7-added commit: review it fully.
2. **Interaction with what develop gained** — this is where a clean textual rebase can still be wrong. Develop commits
   since `10c271fe` that touch our area: SC-652 (`src/framework/pipeline.ts` passthrough of `prefs:` / non-boolean
   `collapsed:` lines on write), SC-662 (pinned sidebar: pending saves / outside changes; `src/elements/hero/view.ts`
   `undoIsStale`), SC-650/SC-656/SC-608 (`src/framework/chrome/windowHandoff.ts`, `host/livePreviewFocusCarry.ts` focus
   hand-off after outside changes), SC-639 (focus after Reset). Probe, by EXECUTING (jsdom probe tests in your private
   copy and/or `npm run e2e -- --only=<id>` scenarios), at least:
   - a block with an author `prefs:` line and a block with a non-boolean `collapsed:` line (SC-652 shapes): flipping
     "Collapsible by default" / "Show edit button" on the open block rebuilds its chrome correctly, and a following
     write still keeps those lines byte-for-byte (our chrome rebuild must not disturb SC-652's passthrough);
   - our O1 path (setting switched off while the block is collapsed → it expands, session toggle cleared to `undefined`)
     on a block whose `collapsed:` key is non-boolean / passthrough;
   - a block in the **pinned sidebar** (SC-662 changed that host): does a pinned card follow the two settings live, and
     does our chrome rebuild + focus restore coexist with the sidebar's own re-render on an outside change (no duplicate
     chrome, no lost pending save, no focus theft from an open window)? If pinned cards do NOT follow the settings, that
     is a finding to report with its severity — say whether it is a regression from this branch, pre-existing, or new
     surface from SC-662;
   - our focus restore after a chrome rebuild vs the newer focus hand-offs (windowHandoff / livePreviewFocusCarry): when
     a setting flips while one of those hand-offs is pending or a window is open over the block, we must not steal focus
     ("only if nothing else holds focus" — ledger r2 LOW-5).
3. **Markers / driver.** Confirm no `knownBug('SC-644'` remains; confirm no spec added on develop since `10c271fe`
   depends on the old `setPrefs` timing (r7 lists what it found — verify, don't trust).
4. **Gates — spot re-run, not the whole battery** (r7 ran it; you check it is real): tsc + lint + jest (full) on the
   head, `npm run e2e -- --element=settings`, and the full lifecycle. Compare with §3. Do not run shots/freeze/parity
   unless a finding needs it.

## 3. Expected numbers on `76644e80`

jest **13897 passed / 1 skipped** with the shots cache (13896 / 2 without) · lifecycle 64/64 (63/64 tolerated only with
G-S61 torn-read = SC-668, red on base) · full e2e (r7) `662/669 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs` ·
known e2e flakes SET-X03/X04 (SC-657), INIT-W10 (SC-654).

## 4. Mechanics (each cost real time once)

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks/draw-steel-elements -- bash <script file>`;
  for a private copy, `-c <that copy>` (and `npm ci` there first). Never `cd X && devbox …`. Exit codes only from inside
  a script file; read each gate's own summary line; never pipe a gate into `tail`.
- Gate command shapes: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, "The battery, in
  order" (lines ~20-250) only — do not read the whole file.
- Each gate is ONE blocking foreground call with output redirected to a uniquely named log (600 s stream watchdog;
  10-minute tool timeout — split by part). No `run_in_background`, no Monitor, no waiting for a notification.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Scratch: ONLY `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc644-r8-rev/`,
  uniquely named files, written with the Write tool.
- No `rm` with a glob or shell variable; nothing under `/tmp` by pattern; never touch `.superpowers/` except writing your report.
- Never `pkill`/`killall` by pattern; kill only your own PID after checking `readlink /proc/<pid>/cwd`.
- Every git command is `git -C <absolute path> …`. Push nothing. No commits on the branch.
- The main checkout's dse dirt (`demo-vault/…`, `compendium-manifest.json`) is Scott's live vault — ignore it.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc644-settings-reach-open-blocks/sc644-r8-review-report.md`,
opening with a ≤10-line executive summary: verdict (LAND / FIX), counts by severity, range-diff result, each gate's
measured line. Then findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, the failure scenario, how you measured
it, and the prescribed fix; for each say: regression from this branch / pre-existing on develop / new surface. Then
`Follow-ups:` (things outside this ticket).

Final text to me: the executive summary plus absolute paths of every artifact (report, logs, probe files).
If the report-file write is blocked by your harness, return the report inline.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and
the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-644:`.
