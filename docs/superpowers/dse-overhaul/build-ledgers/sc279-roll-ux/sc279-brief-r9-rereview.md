# SC-279 r9 — scoped independent re-review of the r8 rebase

You are an independent reviewer for SC-279 (DSE roll strip UI/UX). You did not author this
code. Your final text goes to the ticket-owner, not a human. **Execute and probe, don't just read.**

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/decisions.md`
  (read all of it — it carries Scott's rulings and every prior finding).
- Prior reviews: `sc279-r5-rereview.md`, `sc279-r7-rebase-review.md` (both APPROVE). The r8 brief
  `sc279-brief-r8-rebase.md` and r8 report `sc279-r8-rebase.md` (read the exec summary, then the
  conflict list) — all in the ledger dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux`. DSE branch
  `sc279-roll-ux` @ f3a4476 on develop `54f8f88`; pre-rebase branch was `ae0efd8` on
  `05a6ff3`. Superproject branch `sc279-roll-ux` @ c139a7d on main `46ae296`.
- Do not modify the branches. Do not push. **Never call the tracker** (Linear).

## 2. Scope (the delta only — the feature itself was approved in r5/r7)
1. **Range-diff** `git -C <dse> range-diff 05a6ff3..ae0efd8 54f8f88..f3a4476`: every
   conflict resolution keeps develop's work AND ours; nothing of ours silently lost, nothing of
   develop's reverted. **Scrutinize r8 commit `f3a4476` ("fix(harness): text-scale-once gate loads interaction shots with their prefs/width and replays thenClicks") — it edits SC-422's text-scale gate: is it a necessary adaptation for our interaction shots, or does it weaken the gate for any other shot? Prove by running the gate with and without it.** (pay attention to `styles-source.css`, `visual-harness/entry.ts`,
   `visual-harness/shoot.mjs`, `src/elements/statblock/view.ts`, `CHANGELOG.md`).
2. **Docs / CHANGELOG** against Scott-approved scope and SC-407's prune: `docs/Roll.md` and
   `docs/Media/roll.png` must stay deleted (develop pruned them; ds-roll is deferred to SC-402).
   The SC-279 CHANGELOG bullet must describe the ability-card roller (r7 INFO-2 ruling: "reword
   the bullet to the ability-card roller (ds-roll inherits it via SC-402)") and sit in the
   `## 7.0.0 (unreleased…)` section. `docs/settings.md` accurate. SC-407's docs-shots guard passes.
3. **SC-372 text scale**: the strip's captions honor the per-root `--dse-fs-*` declaration and
   text-scale prefs (probe it: shots lines "text scale OK"/"text scale once OK", and a scaled
   render of the strip if you can).
4. **Gating still holds** (SC-406): experimental OFF → ds-roll inert, card roller works (collapsed
   strip after first dice click); experimental ON → ds-roll strip renders.
5. **Superproject**: DESIGN.md carve-out intact after rebase; DSE pointer = R8 DSE head; no
   other submodule pin reverted vs origin/main (`git submodule status` vs `git ls-tree origin/main`).
6. **Re-run the battery yourself** per the `dse-verify` skill
   (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) and compare
   to r8's numbers. Expected: tsc/lint clean · jest 5627 (r8 measured; develop 5601 + 26), 1 skipped,
   234 of 235 suites · lifecycle 31/31 · e2e `95/98 ok, 0 failed, 3 known-bug, coverage: 66/66
   pairs` · shots 592, 0 FAIL, text-scale lines OK (r8: `text scale OK (1626 …)`, `text scale once OK (107256 comparisons over 214 loads …)`) · freeze: exactly `roll--steel-print.png` + `roll--steel-realprint.png`
   mismatch of 280, nothing else · parity 0/0/24 last.
7. **Rebaseline**: verify `sc279-rebaseline.txt` byte-for-byte against your own shots run's two
   roll print PNGs, and that baseline-with-substitution gives 280/280 OK (on a COPY in your
   scratch folder — NEVER edit `.superpowers/sdd/freeze-baseline.sha256`). Eyeball the two
   print PNGs: the roll strip must not appear in print.

## 3. Rules / footguns
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc279-roll-ux/draw-steel-elements -- <cmd>`;
  never `cd` inside a compound command; every git command as `git -C <absolute path>`.
- Exit codes from a script FILE run as `devbox run -c <dse path> -- bash <script>` (the script
  redirects to a log and writes `$?` to `<log>.exit`); `bash -c '…; echo $?'` under devbox records
  0 always. One gate per call. Read each summary line.
- Private scratch folder:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc279-r9-review/`
  with uniquely named scripts/logs. Write tool for scratch files; no heredocs into scratch; **no
  glob `rm`**; never `rm -rf` shared globs (`/tmp/dse-obsidian-lifecycle-*`) or the shared
  `.superpowers/` dir. Logs worth keeping go to the ledger dir prefixed `sc279-r9-`.
- Never `pkill`/`killall` by pattern; kill only by PID whose command line contains
  `worktrees/sc279-roll-ux/` or whose `readlink /proc/<pid>/cwd` is inside the worktree.
- Gates run in the FOREGROUND (timeout up to 600000 ms), output redirected to files — the 600s
  stream watchdog kills silent agents. Never park waiting on a background job; it will not wake you.
- Never key a wait-loop on a scratch filename or contents (stale cross-session logs match).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's live vault — expected, ignore.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me (`to: 'main'` reaches the dispatcher). If you need input, end with
  `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, first word `SC-279:`.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r9-rereview.md`,
opening with a ≤10-line executive summary: verdict APPROVE / FIX-REQUIRED, then findings by
severity with file:line, failure scenario, prescribed fix.

## 5. Return contract
Raw facts: verdict, shas reviewed, each measured gate line vs expected, findings list
(severity · file:line · one line), absolute path of every artifact.
