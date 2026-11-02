# SC-525 chore — add the CHANGELOG bullet (worktree superproject)

**Work ONLY in the worktree superproject:** `/home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype/CHANGELOG.md`.
NEVER edit `/home/scott/code/steelCompendium/workspace/CHANGELOG.md` (the shared main checkout). Never call Linear.

1. `git -C /home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype status --short` — note the state (submodule pointer dirt for `draw-steel-elements` is expected; leave it alone, do NOT stage it).
2. In that worktree `CHANGELOG.md`, insert the bullet below as the FIRST bullet directly under the line `## Unreleased` (one blank line after the heading, one blank line after the bullet, matching neighbouring bullets' indentation exactly — two-space continuation indent):

```
- **DSE plugin: retyping a reference in the block edit form no longer shows "Reference nesting too deep" (SC-525).**
  With experimental authoring controls on, a feature or statblock whose YAML box holds a reference such as `@Ref.md`
  could show "Reference nesting too deep" in the preview if you typed another key (a trailing space, a paste) while
  the reference was still being looked up, and kept showing it until the next key. The preview now shows the
  referenced card. A card in the sidebar that redraws while its lookup is running also shows one card, not the
  card under a stale error.
```

3. Commit only that file: `git -C /home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype add CHANGELOG.md` then `git -C /home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype commit -m "docs(changelog): SC-525 retyping a reference in the block edit form no longer shows 'Reference nesting too deep'"`. Do NOT add a Co-Authored-By trailer or any AI attribution. Do NOT push. Do NOT stage the submodule pointer.
4. Verify with `git -C … show --stat HEAD` (exactly 1 file, CHANGELOG.md) and `sed -n 9,20p` of that file.

Footguns: every git command is `git -C <absolute path>`, never `cd`; use the Edit tool for the insertion; if you need input, end your turn with `STATUS: NEEDS_CONTEXT`.

Return: commit sha, the `show --stat` output line, and the absolute path of the edited file.
