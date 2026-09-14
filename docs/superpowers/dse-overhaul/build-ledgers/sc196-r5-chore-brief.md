# SC-196 round 5 — docs-only chore (Haiku)

Worktree (your ONLY write location; verify `pwd` before every write):
`/home/scott/code/steelCompendium/worktrees/sc196-light-contrast` — dse clone at
`.../draw-steel-elements`, branch `sc196-light-contrast`, tip `638c657`. Never touch
`/home/scott/code/steelCompendium/workspace/` except to write logs under
`.superpowers/sdd/sc196-light-contrast/`. No tracker, no push, no tag, no other files.

## Three edits, exactly

1. `draw-steel-elements/src/framework/kit/iconButton.ts` line ~40, the JSDoc on the `tooltip?:`
   option. Append one sentence to that comment (keep the existing text):
   `Known gap (SC-324): when \`tooltip\` differs from \`label\`, the mount path restores \`label\` into aria-label afterwards and the tooltip string is discarded — Obsidian's setTooltip writes only aria-label, so the two cannot differ today.`
2. `draw-steel-elements/CHANGELOG.md`, the `[FIX]` bullet for SC-196 (under `## 7.0.0`):
   - replace `the power-roll tier badges including the critical-hit gold` with
     `the critical-hit power-roll badge (gold)`
   - replace `its own darker version of all ten` with `its own darker version of all eleven`
   - after `and the initiative tracker's selection ring (red)` insert `, plus the turn-done and danger accents that share those colors`
3. `CHANGELOG.md` at the WORKTREE root (`/home/scott/code/steelCompendium/worktrees/sc196-light-contrast/CHANGELOG.md`), the `- **DSE plugin: the light color scheme …(SC-196).**` bullet under `## Unreleased`: apply the same three replacements.

Read each file section before editing; make no other change. Show `git diff` of each file in your
final text.

## Commit + gates
- dse: `git add src/framework/kit/iconButton.ts CHANGELOG.md && git commit -m "docs: SC-196 round 5 — SC-324 warning on the tooltip option, changelog wording"`.
- Gates in the dse clone, foreground, via devbox from the workspace root
  (`cd /home/scott/code/steelCompendium/workspace && devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc196-light-contrast/draw-steel-elements && <cmd>'`),
  each with output redirected to a per-run file under
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc196-light-contrast/sc196-r5-<gate>.log`
  and exit code captured to `…-<gate>.code` (devbox eats `$?` — use a wrapper script file that
  `echo $? > file`): `npm run tsc` (expect clean, 0), `npm run lint` (clean, 0),
  `rm -f main.js styles.css` then `npx jest` (expect 3870 passed / 1 skipped / 202 of 203 suites, 0).
  Never background these; never pipe to tail.
- Superproject (worktree root): `git add CHANGELOG.md draw-steel-elements && git commit -m "chore: bump draw-steel-elements to <new sha> (SC-196 round 5 docs) + changelog wording"`.
  Do NOT `git add` the other modified submodules (data-gen, data-sdk-npm, steel-etl, steelCompendium.github.io, v2) — leave them as they are.

## Return
Final text: dse sha, superproject sha, the three diffs, the three gate exit codes + jest totals,
log paths. No prose. If blocked, end with `STATUS: NEEDS_CONTEXT` and the question; you cannot
message the ticket-owner (a depth-2 agent's `to: 'main'` reaches the top-level session). If you
send a message anyway, its first word must be `SC-196:`.
