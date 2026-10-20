# SC-360 r2 brief — independent reviewer: flaky sidebar jest test fix

## 1. Context loading
- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc360-flaky-undo/decisions.md`, the implementer brief `sc360-brief-r1-implement.md` and its report `sc360-r1-impl-report.md` (same dir).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc360-flaky-undo/draw-steel-elements`, branch `sc360-flaky-undo`, rebased onto dse `origin/develop` @ `6bcf9c8` (SC-453 CRLF landed). Review the diff `origin/develop..HEAD` at head `0a8ac82` (8 commits). Baselines at 6bcf9c8: jest 4908 passed / 1 skipped / 229 of 230 suites (+ this branch's new tests), lifecycle 26/26, e2e 68/76 ok, 0 failed, 8 known-bug, 51/51 pairs. `git -C <abs path>` for every git command. Do NOT commit to the branch; probes go in scratch copies or are reverted before you finish (`git -C … status` must be clean at the end).
- You never call Linear/the tracker.

## 2. The task — execute and probe, not just read
Scope changed after r1 (see ledger "r1 ruling"): the sidebarInitiative undo flake is a PRODUCTION bug — `generateAnchorId()` (src/framework/sidebar/anchor.ts) minted random 6-hex ids, ~3% of which YAML reads as numbers, so the first sidebar write's parseYaml/stringifyYaml round trip rewrote the anchor and `findAnchoredBlock` lost the block. The ruling (verbatim): "Option A — fix it in `src/` so a newly minted id can never parse as a non-string YAML scalar; add a pinned-id regression test that fails first at base."

Check, with runtime evidence:
1. **Is the root cause real and complete?** Re-derive it yourself at base: pin a numeric-looking id and reproduce `Received: "true"`. Check the impl's simulation claim (~3%).
2. **Does the fix close EVERY non-string-scalar case** for the YAML parser actually used in production (Obsidian's parseYaml / the mock's backing lib — check which, and whether they differ): ints, octal/hex forms, floats, exponents, `.inf`/`.nan`, bools (`true`/`yes`/`on` style per the YAML version), null/`~`. Exhaustively enumerate or reason over the new generator's output space — not a sample.
3. **Compatibility:** every consumer of anchor ids (regexes validating anchor shape, matchers, writers, existing ids in users' notes). Do existing well-formed ids still match? Does anything else mint anchors through a different path that still has the bug?
4. **Do the tests guard?** Revert the src fix in a scratch state and confirm the new regression tests go red; confirm they go green with it. A vacuous test is HIGH. Check Math.random stubs are restored (no cross-test leak).
5. **Stress:** both files ≥ 30 runs under synthetic load after the fix; fails/N.
6. **Already-damaged notes:** read the impl report's investigation; judge whether its account of what a user sees is correct (probe it) and whether recovery is needed. Report — do not implement.
7. **Scope additions (ledger "r1b rulings"):** (i) the encounter builder (`src/elements/encounter/view.ts`) now uses the shared generator — confirm no other minting path remains (grep every `Math.random`/id-minting in src/). (ii) The widened anchor regexes in `readAnchor`/`ensureAnchor` (and any `_dse_from` reader): probe adversarially — trailing content, inline `#` comments, adjacent keys, quoted forms, indentation, CRLF line endings (SC-453 is a concurrent CRLF effort), a value from a different key, multiple anchors. A re-pin of a damaged note must yield exactly ONE `_dse_anchor:` line. Any way the widening can mis-read or corrupt a user's block is HIGH.
8. CHANGELOG bullet present and accurate. Re-run tsc, lint, full `npx jest` (after `rm -f main.js styles.css`). Lifecycle/e2e/shots/freeze/parity: trust the impl's numbers unless the diff touches rendering/first paint; spot-check `npm run e2e` once.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc360-flaky-undo/sc360-r2-review-report.md`, opening with a ≤10-line executive summary (verdict: LAND / FIX-THEN-LAND / REJECT; counts by severity). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 4. Return contract
Final text goes to the ticket-owner: verdict, finding counts, reviewed sha, measured stress numbers, absolute paths of every artifact.

## Footguns
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or use a per-run unique path.
- Redirect long output to files; run gates in the FOREGROUND (the 600s stream watchdog kills silent agents; a backgrounded job never wakes you).
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc360-flaky-undo/draw-steel-elements -- bash -c 'cd … && <cmd> > <log> 2>&1; echo exit=$? >> <log>'`. Never pipe a gate.
- Never `pkill`/`killall` by pattern; kill only PIDs you started. Never `rm -rf` a shared `/tmp` glob or anything in `.superpowers/` except your own `sc360-*` files.
- The main checkout's dse dirt (demo-vault files) is Scott's live vault — ignore it.
- You cannot `SendMessage` me. If you need input, end with STATUS: NEEDS_CONTEXT and the question. Any message you do send must start with `SC-360:`.
