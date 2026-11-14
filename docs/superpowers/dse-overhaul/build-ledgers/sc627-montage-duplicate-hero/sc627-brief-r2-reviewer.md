# SC-627 r2 reviewer brief — independent adversarial review of the duplicate-hero fix

## 1. Context loading

- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc627-montage-duplicate-hero/decisions.md`
  (ticket text + owner rulings = the spec) and the implementer brief next to it
  (`sc627-brief-r1-implementer.md`) for gate shapes, footguns and baselines. Do NOT read the
  implementer's report before forming your own view of the diff; read it afterwards only to
  check its claimed numbers against yours.
- **You never call the tracker (Linear).**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc627-montage-duplicate-hero`,
  plugin `draw-steel-elements/` branch `sc627-montage-duplicate-hero`. Diff under review:
  `git -C <plugin> diff 7b9e82cf..HEAD` (head sha: da3c8009). `git -C <plugin> fetch origin`
  and confirm origin/develop is still `7b9e82cf`.
- You review; you do not fix. Do not commit to the branch. Probes go in throwaway edits you
  revert with `git -C <plugin> checkout -- <file>` (never `git checkout -- .` blindly, never
  `git stash drop`), or in a separate `git worktree add` of the branch into your scratch dir.

## 2. The task — execute and probe, don't just read

Find what is wrong. At minimum:

1. **Spec conformance** against the five owner rulings (quote them in your report where you
   find a deviation).
2. **Mutation probes**: break the fix (drop the case-folding; drop the trim; drop the view-side
   re-check; make the check use a snapshot instead of the live model) and confirm a test goes
   red for each. A mutant no test catches is a finding.
3. **Integrity probes** (this writes into user notes): with a duplicate refused, the note is
   byte-identical (no write at all); a successful add after a refusal writes exactly one new
   `- name:` entry and keeps every unknown key (SC-625) top-level and inside other entries;
   two montage blocks in one note don't cross-talk (a name on board A does not block it on
   board B); a board with a bare non-hero item or a nameless entry (SC-610 shapes) neither
   crashes nor counts that item; a hand-written board that already has two Kiras still renders
   as before (out of scope, must not regress).
4. **Live-model race**: a hero added to the note by an outside edit while the Add window is
   open — what happens? (SC-650 says an outside edit closes the window; confirm the view-side
   re-check still holds if it does not.)
5. **Accessibility/UX**: the message is announced (role="alert"), hidden when not shown, has
   the board's spelling, Add re-enables when the name becomes fresh; no layout change to the
   modal when no duplicate is typed (shots/freeze must not move); `styles.css` byte-identical.
6. **Re-run the gates yourself**: tsc, lint, jest, the e2e montage specs at least, and the full
   e2e (`npm run e2e`) — expected `(485+N)/(504+N) ok, 0 failed, 19 known-bug, coverage: Y/Y
   pairs`. Lifecycle: run part 3 and part 4 at least (montage-adjacent lifecycle scenarios live
   there? check which lifecycle scenarios touch montage via grep in
   `visual-harness/obsidian-lifecycle.mjs`, and run the parts that hold them). Shots + freeze
   (280/280) + parity (0/0/24, LAST) once.

Same gate shapes, flakes and safety rules as the implementer brief §3–§4 (lifecycle `--only=`
with an equals sign, part 7 over 180 s, G-S91/G-S115/INIT-W10 flake rules, SC-622
appearance.json, devbox script-file exit codes, `git -C` everywhere).

## 3. Scratch and safety

- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc627-r2-rev/`,
  uniquely named files, written with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, never `rm`
  with a variable path (only the literal `rm -f main.js styles.css` in the plugin root before
  jest). Never `pkill`/`killall` by pattern. One blocking foreground call per gate; no
  `run_in_background`, no `Monitor`; redirect output to per-run unique log files.

## 4. Report and return contract

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc627-montage-duplicate-hero/sc627-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-ROUND). Findings by
severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, and prescribed fix. If the
write is blocked, return the report inline.

Final text to the ticket-owner (not a human): verdict, finding count by severity, measured
gate summary lines, and absolute paths of every evidence artifact. If you need input, end
with `STATUS: NEEDS_CONTEXT` and the question; you cannot `SendMessage` me (a message to
`main` reaches the dispatcher; if you send one anyway, its first word must be `SC-627:`).
