# SC-637 proposed dse-verify text (not applied; SKILL.md untouched)

**Summary**
- Four edits to `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`: the row 4b e2e "today" figure, the known-bug marker list, the CURRENT paragraph, and one new footgun.
- Numbers measured at the rebased dse head `620d5774` (on `941b814f`, r3): jest fresh **12913 passed / 2 skipped** (12874 at `941b814f` + 39), lifecycle **64/64**, e2e **`567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs`** (base `560/586 ok, 26 known-bug`: +7 ok, +5 total, -2 known-bug), `styles.css` `18730938...f1f9` unchanged.
- SC-637's 2 `knownBug` markers (NEGO-X06, NEGO-X07) and 2 jsdom `test.failing` ([K01], [K02]) are now plain tests. Known bugs left: SC-257, SC-355, SC-384, SC-627, SC-628 x2, SC-629 and, from SC-439, SC-638, SC-639, SC-640, SC-641, SC-642, SC-648, SC-649 (18 e2e markers).
- All numbers are from the r3 run on `620d5774` (jest, lifecycle, e2e, styles.css).

## 1. Row 4b (line 31), replace the leading `today ... since SC-625 (...)` clause

`today 567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs`, since SC-637 (+7 ok, +5 total: NEGO-X09..X13 new; the 2 SC-637 markers NEGO-X06 and NEGO-X07 are plain tests, no new pair); 560/586 since SC-440 (26 known-bug); 484/504 since SC-625 (+4: MONT-X11..X14, ...)` (keep the rest of the existing history unchanged after that).

In the same row, in the sentence "known bugs SC-257, SC-355, SC-384, and since SC-438 SC-627, SC-628 x2, SC-629 (SC-625 and SC-626 fixed), and since SC-439 SC-637, SC-638, ...": drop `SC-637` from the SC-439 list and add `SC-637` to the fixed list: `(SC-625, SC-626 and SC-637 fixed)`.

## 2. CURRENT paragraph (near line 1527): new CURRENT, demote the SC-643 one to PREVIOUS

**CURRENT — dse `develop` @ `<landing sha>` (2026-11-14; SC-637 landed on `941b814f`; any write of a `ds-negotiation` block kept only the keys the negotiation reads, deleting a Director's own top-level keys, the extra keys on a motivation or pitfall, and (folded in) the extra keys inside `currentArgument:`; `src/model/NegotiationData.ts` and `src/elements/negotiation/model.ts` only: the unknown pairs are kept in a module-private WeakMap keyed by the instance (NegotiationData, Motivation, Pitfall and CurrentArgument are classes, so own properties could shadow a method or field) and `serialize` writes them after the known keys in their original order; an argument's extra keys end with the argument (`CurrentArgument.resetData`, which Complete Argument and Reset call); the 2 e2e `knownBug('SC-637')` markers NEGO-X06/X07 and the 2 jsdom `test.failing` markers `[K01]`/`[K02]` are plain tests; new e2e NEGO-X09..X13, new jsdom rows (8 write paths, two blocks, a second write, the sidebar host, and the argument level), 22 new unit tests; one existing test changed: `wrapperDefaultKeys.test.ts` negotiation case now starts from `{}` instead of the unknown key `title: Frodo`; no lifecycle id used (G-S127 free)):**
tsc and lint clean · jest **12913 passed / 2 skipped** in a fresh worktree · lifecycle **64/64** · e2e **`OBSIDIAN-E2E done: 567/591 ok, 0 failed, 24 known-bug, coverage: 416/416 pairs`** · `styles.css` `18730938…f1f9` identical to a `941b814f` build, so shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry (not re-run by the implementer; the reviewer's full battery decides).

(Replace `<landing sha>` and any number the reviewer re-measures. With a shots cache jest reads one more passed and one fewer skipped: 12914 / 1. Known-bug list after SC-637: 24 e2e markers on the SC-440 base, 2 fewer than its 26.)

## 3. New footgun (battery section, after the "Run these against a worktree's `draw-steel-elements/`" paragraph)

**A fresh worktree has no `node_modules`.** `just wt-new` does not install them: run `npm ci` in `<worktree>/draw-steel-elements` (through `devbox run -c <abs plugin dir> -- bash <script>`, output to a log) before the first gate; `package.json` is unchanged between develop commits, so once per worktree. `node_modules` is git-ignored. A missing one shows as `command not found` / module-not-found from tsc, jest or esbuild.

## 4. Optional second footgun (e2e authoring)

In a TS template literal passed to `dse.externalEdit(note, `c.replace(...)`)`, write `\\n` (two backslashes) for a newline inside the page-side string: a single `\n` becomes a real newline in the evaluated page code and the scenario fails with `page eval failed: SyntaxError: Invalid or unexpected token`.
