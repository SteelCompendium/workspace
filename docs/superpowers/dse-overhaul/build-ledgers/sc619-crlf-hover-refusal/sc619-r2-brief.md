# SC-619 r2 brief: implement the CRLF heading-hover fix, G-S112, full battery

You are the r2 implementer on SC-619 (draw-steel-elements, Obsidian plugin). Your final text
goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger (read first, all of it): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/decisions.md`
- r1 diagnosis (read the executive summary, sections on the fix design, probe cells, G-S112
  and §7 risks): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/sc619-r1-diagnosis.md`
- r1 prototype and real-Obsidian harness (starting points, not gospel):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc619-r1-reviewer/`
  (`r1-fix-prototype.diff`, `r1-scenario.mjs`, `r1-obsidian-lifecycle-r619.mjs.txt`).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc619-crlf-hover-refusal`; plugin at
  `.../draw-steel-elements`, branch `sc619-crlf-hover-refusal`, currently at `7ef96b18` (r1's
  failing tests on top of develop `1f1ae442`). First: `git -C <plugin path> fetch origin` and
  check whether `origin/develop` moved past `1f1ae442`; if it did, rebase onto it (and
  `npm ci` if package.json's obsidian version changed) and say so in your report. Verify
  `pwd` / use absolute paths before any write. `git -C <absolute path>` for every git
  command, never `cd X; git ...`.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared state: never edit
  code there. Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault - expected, not yours.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (~430 KB; read in parts). It owns the battery, the order, the devbox shapes, the
  lifecycle/e2e notes ("Lifecycle and e2e notes (SC-480)"), freeze and parity rules. Owners
  and workers do NOT edit SKILL.md.
- Workers never call the tracker (Linear) - not to read, not to post.

## 2. The task

Ticket: a note saved with Windows line endings (CRLF), a hover preview of a heading link to a
counter; + (or a block edit form Save) in that preview writes nothing and shows the "changed
on disk first" Notice although nothing changed. Expected: saved into the hovered counter.

Scott's standing ruling (2026-11-10, verbatim): "Save nothing with a notice is fine." A fix
must never turn a safe refusal into a possible wrong-counter write.

Owner ruling (ledger, r1 result): adopt r1's fix design - in `cardLinkLine`
(`src/framework/host/ReadingModeBlockHost.ts`), for a HOVER of a HEADING link (no blockId),
when the part starts with `\n` and the note's heading line (`start`) ends in `\r\n`, drop that
one LF and use `relLine - 1` everywhere `relLine` is used after it. LF behaviour must stay
byte-identical; every write keeps the note's line endings (SC-453).

Do:

1. Implement the fix (r1's prototype is +10/-4; you may read the terminator by offset
   instead of a second `splitWithEols` if cleaner). Keep the explaining comment short and
   literal. r1's 7 red tests in `test/dom/framework/reading-mode-host-crlf-hover.test.ts`
   must go green; do not weaken them.
2. Add CRLF mirrors of the refusal cells r1 lists as probe cells, if not already in r1's file:
   at least names swapped from outside (RV, LP, form), the hovered one of two identical
   sections deleted, the upper of two adjacent identical sections deleted - each must REFUSE
   in CRLF exactly as in LF (nothing written, one Notice). Plus: no blank line under the
   heading; a trailing-space heading; a CRLF note whose counter is unique. Jest titles may
   say "SC-619: ..." but never a bracketed ticket id.
3. Add real-Obsidian lifecycle scenario **G-S112** (lifecycle part 7, after G-S108 in
   SCENARIOS order; G-S56 must stay LAST in SCENARIOS order overall - check how part 4 relies
   on that and do not break it). Phases per r1: (a) Reading-view heading hover + saves,
   (b) Live Preview +, (c) `#Other` hover +, (d) block edit form Save in the hover - all
   saved into the hovered counter, note stays all-CRLF, the twin untouched; (e) names swapped
   from outside -> refused, nothing written; (f) upper of two adjacent identical sections
   deleted -> refused; (g) no blank line under the heading -> saved. Target ~60-70 s. Never
   put a bracketed ticket id in a lifecycle/e2e test title (the e2e runner reads titles for
   scenario ids).
4. CHANGELOG: one bullet under `## Unreleased` in YOUR worktree's superproject file
   `/home/scott/code/steelCompendium/worktrees/sc619-crlf-hover-refusal/CHANGELOG.md` - never
   under `/home/scott/code/steelCompendium/workspace/`. Plain user words, e.g. "A + / - or a
   form Save in a hover preview of a heading, in a note saved with Windows line endings, is
   saved again (it showed the 'changed on disk first' Notice) (SC-619)." Commit it in the
   superproject worktree as `docs: changelog, ... (SC-619)`. Do NOT commit a submodule
   pointer bump - the owner does that once at the end.
5. SKILL.md proposal: write
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/sc619-skill-proposal.md`
   with the exact text to add (the CRLF heading-hover slice fact, new jest suite, G-S112,
   lifecycle part 7 now 2 scenarios / 63 total, new current numbers). Do not edit SKILL.md.

Out of scope (do not fix, do not expand into): SC-621 (one-sided-edit gap in
`rebaseCardPin` for part-of-note pins), SC-616 (G-S91 flake), SC-585. If you find another
bug, report it under `Follow-ups:`; do not fix it.

## 3. Gates (dse-verify battery, in its order)

Expected at `1f1ae442` + your change:
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest: baseline 11788 passed / 2 skipped (fresh: `rm -f main.js styles.css` in the plugin
  root first); with r1's 19 tests + yours: 11807 + N passed / 2 skipped / 0 failed.
- lifecycle 63/63 in SEVEN `--only` parts (`--only=` takes comma-separated ids):
  1. `G-S7a ... G-S9a` (21) - copy the exact id lists from the skill / ledger
  2. `G-S9b ... G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4)
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7) - G-S91 known flake (SC-616): if it
     fails, re-run part 5 alone before blaming the change, and report both runs.
  6. `G-S92,G-S96,G-S97,G-S99` (4) - SC-622: if G-S97 fails, check/restore
     `demo-vault/.obsidian/appearance.json` (`git -C <plugin path> checkout -- demo-vault/.obsidian/appearance.json`) and re-run.
  7. `G-S108,G-S112` (2)
- e2e: `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (known bugs SC-257,
  SC-355, SC-384); the line must end `0 failed` with `coverage: Y/Y pairs`.
- shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147.
- freeze 280/280 (the baseline is machine-local; never touch it).
- parity 0/0/24 (last).
Any number that moves: say which, by how much, and why.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/sc619-r2-impl-report.md`,
opening with a <=10-line executive summary (verdict, dse sha, superproject changelog sha,
each gate's number). Body: the diff summary, the test list, G-S112 phases with timings, any
moved number, `Drive-by fixes:` and `Follow-ups:`.

## 5. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: private subfolder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc619-r2-impl/`
  with uniquely named scripts/logs (`sc619-r2-*.sh`, `.log`). Write scratch files with the
  Write tool. Never key a wait-loop on a scratch filename or its contents; read the process's
  own output or a per-run unique path.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc619-crlf-hover-refusal/draw-steel-elements -- bash <script file>`.
  Devbox eats `$?`/`$PIPESTATUS` and `| tail` eats failures: run each gate from a script file
  that records its own exit code; redirect output to a file; read each gate's summary line.
  Never `cd` inside a compound command.
- Run each gate as ONE blocking foreground call (split lifecycle into its seven parts, e2e,
  shots into separate calls, each under 10 min). No `run_in_background`, no Monitor. Calls
  over 180 s may be auto-backgrounded by the Bash tool; if that happens, poll the gate's own
  log / exit-code file - never wait for a notice. The 600 s stream watchdog kills silent agents.
- Never `rm -rf` a `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*` belongs to every
  concurrent effort) or the shared `.superpowers/` dir; delete only exact paths you created
  and recorded. No `rm` with a shell-variable target (it hangs on a permission prompt).
- Never `pkill`/`killall` by pattern (other efforts run the same gates). Kill only a PID whose
  command line or `readlink /proc/<pid>/cwd` is inside YOUR worktree.
- Commit after every coherent step. Do not push. No tags, ever.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the
  question. If you ever message anyway, the first word must be `SC-619:`.

## 6. Return contract

Final text: raw facts - verdict, dse branch sha, superproject changelog commit sha, every
gate's measured number, moved numbers, Follow-ups - plus the absolute path of every artifact
(report, gate logs, skill proposal). No prose.
