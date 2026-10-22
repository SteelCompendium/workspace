# SC-477 scoped re-review, round 2

**Executive summary**
- Verdict: **LAND**. Reviewed dse `sc477-unterminated-newline` @ c692849 on `develop` e4c5cf6 (`origin/develop` is still e4c5cf6 after fetch). Superproject @ 376eb7a on 07f6e22, and its pointer equals c692849.
- Findings: HIGH 0 · MEDIUM 0 · LOW 0 · INFO 4. All five r1 findings (HIGH-1, MEDIUM-1, MEDIUM-2, LOW-1, LOW-2) are closed.
- Real-Obsidian 9-shape parity probe at c692849: **9/9 byte-identical** between in-place and durable, tail kept, 0 Notices, 0 errors. For an unterminated fence, Obsidian still reports `lineEnd` as the note's last line; the clamp brings it back to the last body line (for example 4..11 becomes 4..8).
- Range-diff: the 3 r1 commits are byte-identical after the rebase (`=`). No dse conflict hunks. The only superproject conflict was the submodule pointer line.
- Gates I re-ran on c692849:
  - jest `5737 passed / 1 skipped / 238 of 239 suites` (rc 0)
  - lifecycle `32/32 ok, 0 failed` (rc 0)
  - e2e `OBSIDIAN-E2E done: 101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs` (rc 0)
- Head tests fail on develop's src: host tests 28 failed / 119 passed; `G-S6u` and `G-S28` both FAIL ("got …```", no newline).
- Tree clean before and after (`git status --porcelain` empty in the superproject and dse). Scratch worktrees removed. The one kept lifecycle temp dir from my base run was deleted by exact path.

## Range-diff
- dse: `git range-diff 424f47b..53b11ac e4c5cf6..910a38b` → `fb927a8 = a77dd13`, `dca48c7 = 97f7473`, `53b11ac = 910a38b`. All three are identical, with no conflict hunks.
- superproject: `git range-diff 89bd345..2070c88 07f6e22..4ea76d1` → the one changed hunk is the submodule pointer (`424f47b→53b11ac` became `e4c5cf6→910a38b`). The CHANGELOG hunk is unchanged. Then 376eb7a re-points to c692849 and rewords the bullet.

## r1 findings: closure
- **HIGH-1 closed.** Fixed in `src/framework/host/ReadingModeBlockHost.ts:699-705`: when `unterminatedAtEof`, the code returns `lastNonBlankLine(lines, lineStart, lineEnd)`. The helper is at `:99-103` and is shared with `locateUnterminatedTrailingFence` (`:153`). The closed-fence return is unchanged.
  - Real Obsidian 1.14.4, tails `''`, `\n`, `\n\n\n`, `\n  \n`, `\n\t`, `\n\n  \n\t\n`, `\r\n`, `\r\n\r\n`, `\r\n  \r\n`: all 9 have in-place == durable, the note ends ```` ``` ```` plus the exact original tail, 0 Notices.
- **MEDIUM-1 closed.** `test/dom/framework/reading-mode-host-durable.test.ts:245, 260, 316, 521` now use `lineEnd = splitLines(live).length - 1`. A new table at `:358-365` also covers the short range (tolerance case).
- **MEDIUM-2 closed.** `visual-harness/obsidian-lifecycle.mjs` has `G-S28` (in place) and a widened `G-S6u` (durable). They share `unterminatedTailCase` over the `\n`, `\n\n\n` and CRLF fixtures, and the exact-tail assertion is `text.endsWith('```' + tail)`. Both pass at head and both FAIL on develop's src (I measured it).
- **LOW-1 closed.** Both bullets now say both saves keep the trailing newline: superproject `CHANGELOG.md:11-14` under `## Unreleased`, and dse `CHANGELOG.md:25-29` under the dse file's `## 7.0.0 (unreleased…)` heading.
- **LOW-2 closed.** The comments at `:115-120` and `:691-693` state the behaviour I measured on 1.14.4.

## New in-place integrity probes for the clamp
Jest probe, head vs develop src. Every row with section present uses Obsidian's measured range unless noted.
- **Terminated block, close followed by blank lines:**
  - Section ending at the close (LF and CRLF): output byte-identical to develop, tail kept. The clamp is never reached because `closeOk` is true.
  - Stale range running past the close into the blank lines: identical to develop. `hasCloseInRange` sends it to the durable relocate, and with no mount body it gives a Notice and no write.
- **SC-343 misread trap (`open, body, close, After, '', ''`):** ranges 0..4, 0..5 and 0..6, with and without a mount body. Every case is identical to develop and `After` survives. Variants also identical to develop: close fence with trailing spaces, and a `~~~` block whose body holds ```` ``` ````. An unterminated fence followed by a non-blank text line is never shrunk past that line. When the body matches, the text is replaced as body (same as develop) and only the tail is now kept. When it doesn't match, a Notice and no write.
- **Body the user ends with a whitespace-only line (`…current_value: 1\n   `, with or without EOL):** the `   ` line is kept byte-for-byte, now after the new close fence; in-place == durable. Also checked, all with in-place == durable and the tail kept:
  - the last body line carrying trailing spaces
  - a new body that itself ends in a whitespace-only line
  - an empty body
  - a last body line of the form ```` ``` x ```` (not a closer)
  - a lone-CR EOF
  - a CRLF whitespace tail
- **The clamp cannot widen data loss.** It runs only when `!closeOk && !hasCloseInRange` and every line after `lineEnd` is blank. It removes only whitespace-only lines from the replaced range. The body check (`bodyOk`) is computed before the clamp and is unchanged.

## INFO
1. **Superproject `origin/main` has moved again,** 07f6e22 → acaa6f4: one line in `docs/handoffs/HANDOFF.md`. It does not overlap this branch (CHANGELOG + pointer only), but the branch needs a rebase at landing. Not a regression.
2. **Whitespace-only tails in real Obsidian:** the implementer's follow-up said these are covered in jest only. My G-P477 probe adds real-Obsidian evidence for `\n  \n`, `\n\t`, mixed, and the CRLF whitespace tail, all kept. The gate fixtures need nothing more.
3. **Semantics, as ruled:** a whitespace-only line at EOF inside an unterminated block ends up after the new close fence. The bytes survive.
4. **Red-on-develop counts differ from the implementer's (17 failed)** because I ran the head tests against develop's src, without the r1 durable fix: 28 failed / 119 passed. Both counts show the tests are not vacuous.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc477-rereview-r2q7/`)
- Gates: `gate-jest.log`, `gate-jest-rc.txt`, `gate-lc.log`, `gate-lc-rc.txt`, `gate-e2e.log`, `gate-e2e-rc.txt`.
- Real-Obsidian parity at head: `p477-head.json`, `p477-head.log` (G-P477 + G-S6u + G-S28). G-S6u/G-S28 on develop src: `p477-basesrc.log`. Patched harness: `obsidian-lifecycle.patched-head.mjs`.
- In-place integrity probe: `zz-sc477-inplace-probe.test.ts`, `inplace-head.json`, `inplace-basesrc.json`. Host tests on develop src vs head: `hosttests-basesrc.log`, `hosttests-head.log`.
