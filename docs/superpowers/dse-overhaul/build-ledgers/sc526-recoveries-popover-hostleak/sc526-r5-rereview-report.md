# SC-526 r5 scoped re-review report (r4 delta)

## Executive summary
1. VERDICT: LAND-READY. dse `6270e84a` on `origin/develop` `69b5c0d4`; superproject `f99741d0` on `origin/main` `e642f51b`. Both bases were re-fetched at the end of the review and had not moved. 0 BLOCKER, 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO.
2. Range-diff `248e202b..d40197c4` vs `69b5c0d4..6270e84a`: `1: 179389d5 = 190d1d49`, `2: d40197c4 = 1901b894`, plus the new `6270e84a`. The rebase carries identical patches. `6270e84a` changes 2 comment lines only (LOW-1 at `styles-source.css:15597`, INFO-5 at `:17613`).
3. SC-520 touch-point: the diff against `69b5c0d4` is purely additive (245+/13-, the same stat as r3). There are no `-` lines in `styles-source.css`, so SC-520's callout-chrome rules (~:16986) are untouched. The hunks sit at :15593 (ring list), :17488 (section B) and :17606 (block G).
4. Superproject: `ef4e60c3` puts the bullet first under `## Unreleased` (CHANGELOG.md:11). `f99741d0` changes "font" to "font size" (LOW-2). The diff against `origin/main` is CHANGELOG +7 only. No attribution trailers, no tags, nothing pushed.
5. My runs: jest **6492 passed / 1 skipped / 257 of 258** (rc 0). Shots on head: rc 0, 0 FAIL, `button host-leak OK (163 … 978 …)`, the same 34-record boundary with no popover kind, and `capture clip OK (147 …)`. All 592 PNGs are sha256-identical to my own `69b5c0d4` run, which is itself identical to r4's base. Freeze `280/280` on both runs.
6. Base vs head log diff: only the button line (161/966 → 163/978) and the harness.css size. The delta touches no `src/`, so lifecycle and e2e were not re-run. r4's logs read 21+16+9+4+2 = 52/52 and e2e `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`; tsc, lint and parity rc 0.

## Findings
- INFO-1 — `CHANGELOG.md:15` (worktree) still says "in the card's font". That is accurate: the family is the card's. In r3 I offered it only as an optional extra to LOW-2, and the owner folded only "font size". No action.

## Delta checks
- `6270e84a` (`styles-source.css`): ":15597 `popover and the ds-stamina-bar element's)`" and ":17613 `setting on, so until SC-526 the gallery sweep never mounted them`". Both match the r3 prescriptions verbatim.
- `f99741d0` (`CHANGELOG.md:14`): "text colour and font size". The bullet is in `## Unreleased` (heading at :9, bullet at :11), in the worktree superproject only.
- SC-349 changed `shoot.mjs` (+145). The SC-526 hunks there applied unchanged (range-diff `=`). The new `capture clip OK` gate is green on head.

## Tree state
dse is clean, on branch `sc526-recoveries-popover-hostleak` at `6270e84a`. I detached to `69b5c0d4` for the base run and restored the branch afterwards. The superproject worktree shows ` M draw-steel-elements` (the unstaged pointer, as found). The main checkout was not touched, and Scott's Obsidian was not touched.

## Artifacts (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc526-r5-rev-m4kd/`)
`jest.log`/`.rc`; `base.log`/`.rc`/`.sha256`/`.freeze.log` (69b5c0d4); `head.log`/`.rc`/`.sha256`/`.freeze.log` (6270e84a); `gate.sh`, `bgshots.sh`.
