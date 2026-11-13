# SC-619 r1 brief: diagnose the CRLF hover refusal, write failing tests, design the fix

You are the r1 worker on SC-619 (draw-steel-elements, Obsidian plugin). Your final text goes
to the ticket-owner, not a human.

## 1. Context loading

- Ledger (read first): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/decisions.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc619-crlf-hover-refusal`, plugin at
  `.../draw-steel-elements` on branch `sc619-crlf-hover-refusal`, base dse develop `1f1ae442`.
  Verify `pwd` / use absolute paths before any write. Use `git -C <absolute path>` for every
  git command, never `cd X; git ...`. The main checkout
  `/home/scott/code/steelCompendium/workspace` is shared state: never edit code there (its
  dse dirt - `demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md` - is Scott's live vault, expected, not yours).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (~430 KB - read in parts with grep/sed). Directly relevant: section "Block edit form Save and
  embeds (SC-556)" (starts ~line 337), especially "Hover card writes (SC-594)" incl. "What
  `cardLinkLine` checks (r4)", "The drawn-from rule (SC-607)" (`snapshotDrawn`,
  `metaMatchesText`, `mapLineStrict`, R-Q2c `countByBody`, R-Q3 hover window guard via
  `hoverDrawnText` / `embed.data`) and the "Two identical blocks separated only by blank lines"
  bullet (SC-612 rule P, `placedUniquely`). Also "Lifecycle and e2e notes (SC-480)" and the
  devbox wrapping section.
- Prior art (landed; tracked ledgers):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`
  `sc607-open-preview-stale-card-write/` (the r3 review report found this bug: cell `crlf-ctl`,
  lines ~77 and ~223 of `sc607-r3-review-report.md`; look for the scratch harness it used for
  real-Obsidian cells), `sc612-twin-deleted-wholenote-pin/`, `sc594-hover-heading-card-write/`.
- SC-453 (2026-10-19) made every DSE write keep a CRLF note's line endings
  (`src/framework/host/lineEnding.ts`); lifecycle G-S10 covers CRLF notes staying all-CRLF.
- Workers never call the tracker (Linear) - not to read, not to post.

## 2. The task (diagnosis + failing tests + fix design; do NOT change `src/`)

Ticket statement: a note saved with Windows line endings (CRLF) has two identical counters. A
hover preview of a HEADING link to one of them is open. A + in that preview writes nothing and
shows the "changed on disk first" Notice although nothing changed. The same preview in an LF
note saves. Expected: the + is saved into the hovered counter. Nothing is ever written to the
wrong counter. Suspected (unverified): the part-text vs note-text compare in `cardLinkLine`
with `\r\n`.

Scott's standing ruling (2026-11-10, verbatim): "Save nothing with a notice is fine." - i.e. a
fix must never trade a safe refusal for a possible wrong-counter write.

Do:

1. **Find the exact refusing check** - in real Obsidian, not by reading alone. Reproduce
   `crlf-ctl` (CRLF note, two identical counters under two differently named headings, hover
   `[[note#Heading]]`, real + click, no outside edit) and instrument to name WHICH step
   refuses: `cardLinkLine` (part lines vs note lines; heading-line check; ^id marker check),
   `snapshotDrawn` / `metaMatchesText` (cache offsets vs CRLF text), the R-Q3 guard
   (`embed.data` vs snapshot - is one normalized to LF and the other not?), `mapLineStrict`,
   `countByBody`, `placedUniquely`, or `pinnedTarget` at write time. Record what each
   input actually holds (does the hover part / section text carry `\r`? does `cachedRead`?
   does `embed.data`? are cache `position.start.line` and offsets consistent?). Also check:
   a BLOCK (`^id`) hover, a heading EMBED `![[note#H]]` and a block embed in the same CRLF
   twin note, and a block edit FORM Save in the hover (SC-596 path) - do they refuse too?
   And a CRLF note WITHOUT twins (unique body) - saved? (Measure, don't assume.)
   Use a scratch vault/harness of your own (the SC-607 r3 scratch harness or the lifecycle
   harness's mechanics). Do not add a lifecycle scenario to the tracked SCENARIOS list in
   this round.
2. **Write failing jest tests** on the branch that model the real inputs you measured (the
   SKILL's notes on jest hover modelling apply: heading hover's part is the heading BODY,
   `hoverEl(link)` / `popoverEl(link)` DOM, cache mocks that lag). Commit them as a separate
   commit, marked so the test names do NOT contain a bracketed ticket id (the e2e runner reads
   titles for scenario ids; jest titles may say "SC-619:" plain). It is fine for them to fail
   on this commit; say exactly which fail and why.
3. **Design the fix**: the smallest change that saves the hovered counter in a CRLF note,
   keeps LF behaviour byte-identical, keeps every write's line endings (SC-453), and keeps
   every SC-594/607/612 refusal a refusal in CRLF notes as well (the same twin-deleted /
   swapped-heading / moved-section cells must still refuse, not write the twin). Name the
   function(s), the normalization point, and the probe cells the implementer must add (CRLF
   mirrors of the existing refusal tests). Say whether the SC-612 fuzz's CRLF notes already
   cover the whole-note path and why they missed this one. Propose whether a real-Obsidian
   lifecycle scenario G-S112 (part 7) is warranted and what its phases are.

## 3. Gates for this round

None required (no `src/` change). If you run jest, expected baseline at 1f1ae442:
11788 passed / 2 skipped (fresh: `rm -f main.js styles.css` in the plugin root first).
Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc619-crlf-hover-refusal/draw-steel-elements -- bash <script file>`;
devbox eats exit codes and `| tail` eats failures - run gates from script files that record
their own exit code, output redirected to files.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/sc619-r1-diagnosis.md`.
It must OPEN with a <=10-line executive summary: the refusing check (file:line), the measured
inputs that make it refuse, the failing test names, the proposed fix in one sentence, and
whether other shapes (block hover, embeds, form Save) are affected. Body: measurements table
per cell, the fix design, the probe-cell list, risks.

## 5. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: use a private subfolder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc619-r1-reviewer/`
  with uniquely named scripts and logs. Write scratch files with the Write tool. Never key a
  wait-loop on a scratch filename or its contents (stale logs from other branches exist);
  read the process's own output or a per-run unique path.
- Redirect long output to a file; the 600 s stream watchdog kills silent agents. Run each
  long step as ONE blocking foreground call (under 10 min); no `run_in_background`, no
  Monitor. Calls over 180 s may be auto-backgrounded by the Bash tool: if so, poll the step's
  own log / exit-code file, don't wait for a notice.
- Never `rm -rf` a `/tmp` glob or the shared `.superpowers/` dir; delete only exact paths you
  created and recorded. No `rm` with a shell-variable target (it hangs on a prompt). Never
  `pkill`/`killall` by pattern; kill only a PID whose cwd (`readlink /proc/<pid>/cwd`) or
  command line is inside YOUR worktree or scratch dir.
- `devbox run -c <abs path>`, never `cd` inside a compound command.
- SC-622: the Obsidian camera tool can leave `demo-vault/.obsidian/appearance.json` dirty;
  restore it with `git -C <plugin path> checkout -- demo-vault/.obsidian/appearance.json`.
- Commit after every coherent step. No tags, ever. Do not push.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the
  question. If you ever message anyway, the first word must be `SC-619:`.

## 6. Return contract

Final text: raw facts - verdict, the refusing check, branch sha(s) of your test commit,
measured numbers, failing test names - plus the absolute path of every artifact (report,
scratch logs, scripts). No prose.
