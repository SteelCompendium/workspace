# SC-651 r4 — rebase onto dse develop ad21dc87 + full battery + final superproject shape

Same worktree, same rules and footguns as `sc651-r1-brief.md` (re-read its §4 footguns: no `rm` in
/tmp or the scratchpad, no `cd` in compound commands, `git -C` everywhere, scripts via Write, no
background gates, poll your own pid, never push). Never call the tracker. Scratch subfolder:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc651-r4-impl/` (new; fresh log names).

Ledger: re-read `decisions.md` (r2 review LAND, r3 chore, new baseline entry).

## What changed since r1

- dse `develop` is now `ad21dc87` (SC-646 landed: it touched `main.ts` sync paths and the settings tab's
  Sync button handler — likely `src/views/SettingsTab.ts`, the file your fix is in).
- Workspace `origin/main` is at `63843336` or later (fetch and use the current tip).
- The r3 chore already put the superproject branch on `f7c064b0` with `aacf5adb` (CHANGELOG, reworded
  per review LOW-1 — keep that wording exactly) and `913984ab` (pointer bump to the OLD `031f6ca0`).

## Steps

1. Plugin: `git -C <plugin dir> fetch origin develop`; confirm FETCH_HEAD is `ad21dc87` (or later — say so);
   `git -C <plugin dir> rebase FETCH_HEAD`. Resolve conflicts in `SettingsTab.ts` keeping SC-646's change and
   our `renderPresetControl` change both intact; report any conflict and how you resolved it.
2. `npm ci` only if `package.json` / `package-lock.json` changed between `cefa9ca8` and `ad21dc87`.
3. Full battery on the rebased head. Expected:
   tsc (incl. `-p e2e`) and lint clean · jest **13406 passed / 2 skipped** fresh (13403 + your 3) ·
   lifecycle **64/64** in the SEVEN `--only=` parts (ids in r1 brief §3) · e2e full run
   **`613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`** (SC-646's flip took baseline to 612 / 10;
   ours adds +1 ok / −1 known-bug). Explain any difference.
   `styles.css`: compare sha256 to a clean `ad21dc87` build (git archive export in your scratch dir, node_modules
   symlinked). If identical and the src diff vs `ad21dc87` is still only the Preset handler, shots/freeze/parity
   carry (baseline shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze 280/280, parity 0/0/24).
   Flakes: as in r1 brief §3 (SET-X03/X04 re-run; G-S91, G-S115 (g), INIT-W10, G-S97 appearance.json).
4. Superproject, ONLY after the battery is green (one pointer bump, no interim pointer commits):
   - `git -C <superproject> fetch origin`.
   - No `reset --hard` (it could move the submodule). Instead:
     `git -C <superproject> reset --soft HEAD~1` (drops the old bump commit `913984ab`, keeps the tree),
     then `git -C <superproject> restore --staged draw-steel-elements`, confirm `git log -1` is the CHANGELOG commit,
     then `git -C <superproject> rebase origin/main` (resolve a CHANGELOG conflict by keeping every bullet under
     `## Unreleased`, SC-651's wording unchanged). The submodule's checked-out HEAD must be your rebased dse head.
   - `git -C <superproject> add draw-steel-elements` and commit:
     `chore: bump draw-steel-elements to <new short sha> (SC-651: picking Custom in the settings Preset dropdown snaps back to the preset the options match)`
     (no attribution lines).
   - Verify: `git -C <superproject> log --oneline origin/main..HEAD` is exactly 2 commits (CHANGELOG, bump);
     `ls-tree HEAD draw-steel-elements` = your dse head; `status --porcelain` empty.
5. Never push.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc651-preset-custom/sc651-r4-impl-report.md`, opening
with a ≤10-line summary: dse head sha(s), conflict notes, superproject 2 shas + the origin/main sha they sit on,
measured numbers (jest, 7 lifecycle part lines -> 64/64, e2e done line, styles.css shas). Return the same facts plus
every artifact path.
