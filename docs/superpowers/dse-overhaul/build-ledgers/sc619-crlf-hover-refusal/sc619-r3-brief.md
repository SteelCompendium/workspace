# SC-619 r3 brief: independent adversarial review of the CRLF heading-hover fix

You are the r3 independent reviewer on SC-619 (draw-steel-elements, Obsidian plugin). You did
not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger (read first): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/decisions.md`
- r1 diagnosis (exec summary + §7 risks): `.../sc619-crlf-hover-refusal/sc619-r1-diagnosis.md`
- r2 implementation report (exec summary first): `.../sc619-crlf-hover-refusal/sc619-r2-impl-report.md`
  (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/`).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc619-crlf-hover-refusal`; plugin at
  `.../draw-steel-elements`, branch `sc619-crlf-hover-refusal` at `19942fe6`; base develop
  `3a5986d3`. Review `git -C <plugin path> diff 3a5986d3..HEAD` and the superproject's
  CHANGELOG commit. Do not commit to this branch; if you need to try a change, do it in a
  scratch `git worktree add` at an absolute path under your scratch dir and remove that
  worktree (by exact path) when done.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (~430 KB, read in parts). Relevant: "Block edit form Save and embeds (SC-556)" (~line 337):
  "Hover card writes (SC-594)", "What `cardLinkLine` checks (r4)", "The drawn-from rule
  (SC-607)" with residuals and new refusals, the "Two identical blocks separated only by blank
  lines" bullet (SC-612 rule P). The main checkout's dse dirt (`demo-vault/Welcome.md`,
  untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault - expected.
- Workers never call the tracker (Linear).

## 2. The task

Scott's standing ruling (2026-11-10, verbatim): "Save nothing with a notice is fine." The
review question is: does the fix make every CRLF heading-hover + / form Save that LF saves
also save in CRLF, into the HOVERED counter, keeping all-CRLF line endings - and does it open
ANY path to a write into a different (identical) counter, or change any LF behaviour?

Execute and probe, don't just read:
- Re-run r1's / r2's real-Obsidian cells yourself (harness in
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc619-r1-reviewer/`)
  and add your own adversarial cells: CRLF notes with twins where the fix's `\n`-drop could
  misalign onto the twin (heading name swaps, a section moved, a heading hover whose part
  legitimately starts with an empty line in LF, mixed line endings - some lines CRLF some LF
  (does the condition read the right line's terminator?), CR-only notes (SC-460), setext
  headings, a heading at the very end of the note, frontmatter, nested headings with the same
  name, a heading inside a callout).
- Mutation-check the new tests (does each new assertion fail when the fix is reverted /
  weakened?).
- Re-run jest fully and lifecycle part 7 (`G-S108,G-S112`); spot-check that G-S112's refusal
  phases actually assert "nothing written" (byte-compare) and its save phases assert the
  TWIN is untouched and the note stays all-CRLF.
- Check the CHANGELOG bullet is user-facing plain words and in the worktree's file.
- Check the skill proposal file `sc619-skill-proposal.md` is accurate.

Out of scope: SC-621 (one-sided-edit gap for part-of-note pins in `rebaseCardPin`), SC-616,
SC-585. Report anything else as a finding; don't fix it.

## 3. Expected numbers

r2 measured on 19942fe6 (develop 3a5986d3 + 3 commits): tsc/lint clean; jest fresh
11814 passed / 2 skipped / 0 failed (rm -f main.js styles.css first); lifecycle 63/63 (part 7
= `G-S108,G-S112` 2/2); e2e `331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`;
shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze 280/280;
parity 0/0/24. You must re-run at least jest (full) and lifecycle part 7 yourself; the full
battery is not required unless your probes suggest a regression elsewhere.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/sc619-r3-review-report.md`,
opening with a <=10-line executive summary (verdict LAND / FIX, findings count by severity).
Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario and
prescribed fix. Measured cells table.

## 5. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: private subfolder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc619-r3-reviewer/`
  with uniquely named scripts/logs. Write scratch files with the Write tool. Never key a
  wait-loop on a scratch filename or its contents.
- Devbox: `devbox run -c <abs plugin path> -- bash <script file>`; devbox eats exit codes and
  `| tail` eats failures - scripts record their own exit code, output to files. Never `cd`
  inside a compound command; `git -C <abs path>` for every git command.
- One blocking foreground call per gate step, each under 10 min; no `run_in_background`, no
  Monitor; if a call is auto-backgrounded, poll the step's own log / exit-code file. The
  600 s stream watchdog kills silent agents.
- Never `rm -rf` a `/tmp` glob or the shared `.superpowers/` dir; delete only exact paths you
  created. No `rm` with a shell-variable target. Never `pkill`/`killall` by pattern; kill only
  PIDs whose command line or cwd is inside your worktree/scratch.
- SC-622: restore `demo-vault/.obsidian/appearance.json` if the camera dirtied it.
- No tags, no push.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT`. If you
  ever message anyway, the first word must be `SC-619:`.

## 6. Return contract

Final text: verdict, findings by severity with file:line, measured numbers, plus the absolute
path of every artifact. No prose.
