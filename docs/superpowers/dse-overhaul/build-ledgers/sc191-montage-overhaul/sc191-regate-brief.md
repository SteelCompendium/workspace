# SC-191 re-gate round — rebase onto the SC-202 tip, full battery, regenerate the freeze package

You are an `orchestration:implementer` (mechanical round; no design, no new code unless the
rebase conflicts). Final text goes to the SC-191 ticket-owner (an agent): raw facts, no
prose. **Never call the tracker (Linear).** You cannot message the ticket-owner; if you need
input, end with `STATUS: NEEDS_CONTEXT` and the question at the top of your report. A stray
message's FIRST WORD must be `SC-191:`.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
- Latest slice report: `sc191-slice4-report.md` (same dir) — its battery numbers are your
  "before" reference.
- Worktree (verify `pwd`; write nothing under `workspace/`):
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`,
  branch `sc191-montage-overhaul` @ `8cd9d30`, currently based on `origin/develop`
  `69eb5f7`.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## 2. Task, in order

1. `git fetch origin develop` inside the clone. Expected tip: `9227dd9` (SC-202 landed —
   carries the Obsidian 1.14.0 host-copy pin bump). If the tip is not at/after that sha,
   STOP: `STATUS: NEEDS_CONTEXT`.
2. `git rebase origin/develop`. If `package.json`'s obsidian version changed, `npm ci`. On a
   conflict: resolve ONLY if it is trivially mechanical (e.g. adjacent CHANGELOG bullets);
   anything in `src/`, `styles-source.css`, or `visual-harness/` → abort the rebase and
   `STATUS: NEEDS_CONTEXT` with the conflicting hunks.
3. Full `dse-verify` battery on the rebased tree, in order, output to files (plain
   bash/node for exit-code-sensitive steps — devbox swallows `$?`): tsc; lint;
   `rm -f main.js styles.css && npx jest`; `npm run shots` twice (sha256 across both, must
   be identical) — expected in-run lines now include `host-copy pin OK` against 1.14.0 AND
   the button host-leak sweep OK (it was behind the pin abort before); `check-freeze.sh`
   (expected: exactly the 2 montage print lines mismatch, 0 others — if SC-202 changed the
   baseline line count, read the new count from `dse-verify` SKILL.md and report it);
   `npm run parity` LAST (0 GAPs / 0 undeclared / the declared set the skill documents).
4. Regenerate the freeze package from THIS tree into the ledger dir:
   `rebaseline.txt` (the 2 montage lines, hashes from your runs), `widening.txt` (every
   NEW montage print capture, additions-only, `<sha256>  <filename>`, 0 collisions with the
   baseline's filenames), and the crops `sc191-freeze-montage--steel-{print,realprint}-{before,after}.png`
   plus any slice-3/4 print crops the slice-4 report produced. Verify each hash line
   against both shot runs. View the after-print crop; describe it in one line.
5. If the rebase produced no conflicts and the battery is green, there is NO new commit
   (the rebase rewrote the shas). Report the new tip sha and the new base sha. Never push,
   never tag, never edit the freeze baseline, never touch the pin/listings/asar.

## 3. Report + return

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-regate-report.md`
(≤10-line executive summary first). Return: `STATUS`, new base sha, new tip sha, whether
`npm ci` ran, each gate's numbers incl. the host-copy pin and host-leak lines verbatim,
the freeze FAIL lines, the paths + line counts of `rebaseline.txt` / `widening.txt`, crop
paths, the after-crop description, every log path (per-run unique dir under
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`),
`git status --short` (clean). If the report write is blocked, return it inline.

## 4. Footguns

Redirect long output to files; never background a gate and wait for a notification; no
scratch-filename wait loops; stale superproject pin diagnosis for `token-coverage`.
