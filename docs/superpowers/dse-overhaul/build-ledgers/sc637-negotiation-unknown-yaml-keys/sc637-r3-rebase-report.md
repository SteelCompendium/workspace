# SC-637 r3 rebase report

**Executive summary**
- Verdict: DONE. Branch moved onto the new bases and re-gated; nothing deviates from the expected numbers.
- New dse head `620d5774` on `origin/develop` `941b814f` (SC-440). Superproject `git log --oneline origin/main..HEAD` (origin/main `016b1cdd`, fetched twice; it had moved from `91896adf` mid-run, I rebased again):
  `41480b27 chore: bump draw-steel-elements to 620d5774 (SC-637: negotiation writes keep keys the negotiation does not use)` and `28040aaa docs: CHANGELOG bullet for SC-637 (negotiation keeps keys it does not use)`. Exactly 2. Gitlink = `620d57749bcd47901485579280a6f0141eb0aa18` = dse branch head. Nothing pushed. Tree clean.
- Conflicts: none (the dse `e2e/README.md` change auto-merged; the superproject CHANGELOG auto-merged both times).
- Gates on `620d5774`: tsc clean, lint clean, jest fresh **12913 passed / 2 skipped** (base 12874 + 39), lifecycle **64/64** (21+16+9+4+7+4+3, all rc=0), e2e **`567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs`** (base 560/586, 26 known-bug: +7 ok, +5 total, -2 known-bug).
- `styles.css` sha256: branch = clean `941b814f` build = `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`.
- Scenario ids: no duplicate `[ID]` in `e2e/specs`; no bracketed ticket id in any test title; NEGO-X09..X13 do not collide with SC-440's `SET-*` ids.
- Skill proposal updated to these numbers: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/sc637-skill-proposal.md`.

## dse commits on `941b814f`
`508efc27` fix + unit tests, `7ef2710f` jsdom tests, `907bcfee` e2e flip + X09..X13 + README, `a154ffed` wrapperDefaultKeys test, `3df1813b` NEGO-X13 escape, `620d5774` currentArgument fold. `package.json` / lockfile unchanged across the move, so no `npm ci`.

## Logs (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc637-r1-impl/`)
`r3-tsc.log`, `r3-lint.log`, `r3-jest.log`, `lc-s1.log`..`lc-s7.log` (+ `.rc`), `r3-e2e.log`, `r3.rc` (rcs and styles.css hash), `basebuild3.log` (clean `941b814f` archive built with `node esbuild.config.mjs production`, then both hashes).

## Drive-by fixes:
None.

## Follow-ups:
None.
