# SC-536 r2 implementation report

## Executive summary
- Verdict: DONE. Base moved mid-round to dse `develop` 458abe3 (SC-481); rebased onto it. G-S56 conflict with G-S53 resolved by keeping both.
- Plugin head `432c50e2` on branch `sc536-ref-cycle-guard` (worktree draw-steel-elements). Commits over 458abe3: `36cd8edb` RED tests, `8c1269fb` the guard, `514946db` G-S56, `432c50e2` G-S56 fresh-leaf start. Superproject: `2f5eb7d1` (CHANGELOG + dse-verify; branch fast-forwarded to main 367015f3 first; dse pointer bump NOT staged).
- Jest: 6221 passed / 1 skipped / 249 of 250 (after shots), vs base 6201 / 1 / 249 of 250: +20 passed (+22 new tests, -2 deleted). One run read an unrelated 5 s timeout in initiative-default-keys under load 30; rerun green.
- Gates: tsc+lint clean · lifecycle 43/43 (A 21/21, B 22/22) · e2e 124/124 ok, 0 failed, 0 known-bug, coverage 87/87 · shots 592, 0 FAIL, button host-leak 157/942 · freeze OK 280/280 · parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Mutants (6): every one turns its named tests red; tree restored clean.
- RED on base: 23 of 93 tests fail on 458abe3 src (log below). G-S56 FAILs all 6 phases on 458abe3 src, passes on HEAD.
- `ReadingModeBlockHost.ts`: untouched.

## What changed
- `src/elements/shared/RefUnwrapView.ts`: `REF_CHAIN` WeakMap + `nearestChain` (parentElement walk), `MAX_REF_DEPTH = 5`, `REF_CHAIN.delete(root)` in `onMount` beside `resolveGen++`, cap check before any lookup, `claimChain` right before each `mountBase` after the last gen check. Targets: `file:<path>` / fallback `raw:<base.id>|<trimmed>`; SCC `scc:<code>` + `file:<entity.file.path>`. `IN_FLIGHT_REFS` and the try/finally removed (body dedented one tab, so the raw diff is large; `git diff -w` is 66+/56-). `resolveGen` unchanged.
- `src/framework/view.ts`: `isUnloaded()` removed (private `unloaded` kept for SC-519); `renderMarkdown` doc gained the "render into an element already inside the card" line (the `view.ts:291-298` block was the removed `isUnloaded` doc).
- Wording exactly as ruled: `Reference loop: <raw> is already shown by a card this one is inside.` / `Reference nesting too deep: more than 5 references inside one another.`
- Tests: `refUnwrapView.test.ts` (nested-host harness `setup`/`sccSetup`; SC-525 describe retitled; 2 cycle tests + the updated self-ref test rewritten; "two live views" and "superseded owner late finally" deleted; "earlier resolution settling" inverted; new describe.each awaited/fire-and-forget with 10 tests x 2, plus FIFO/LIFO Bug-2 test), `displayCardHybrid.test.ts` (d) rewritten (nested host inside outer `.dse-card__body`, asserts the exact loop message), `formModalStalePreview.test.ts` (matcher widened to also reject "Reference loop"; stale INFO-3 comment updated).
- `visual-harness/obsidian-lifecycle.mjs`: G-S56 (last scenario, after G-S53) with fixtures `Gs56*.md`, `gs56Kit` (hooks on `services.refs.resolve` and `app.vault.read/cachedRead`, settle = condition + 2 rAF). Phases (a) Reading view, (a') Live Preview in its own detached tab leaf, (cap) 7 distinct refs -> 5 lookups + cap card, (b) split + redraw, (c) plugin off/on two panes, (d) double redraw; each of b/c/d released FIFO then LIFO. All phases run and are reported together.
- Superproject worktree: `CHANGELOG.md` `## Unreleased` bullet; `.claude/skills/dse-verify/SKILL.md` row 4 (43/43, halves 21 + 22, G-S56 description). CURRENT block untouched.

## Mutant table (jest: refUnwrapView + displayCardHybrid + formModalStalePreview, 93 tests)
| Mutant | Failed | Named tests red? |
|---|---|---|
| M1 drop cycle check | 18 | yes (1-4 all variants, plus 3 SC-525 rewrites and displayCardHybrid d) |
| M2 drop cap | 2 | yes (cap test, both variants) |
| M3 drop `REF_CHAIN.delete` at onMount | 2 | yes (inline-body test) |
| M4 claimChain before the last gen check | 2 | yes (superseded-resolution test) |
| M5 key on raw text | 4 | yes (alias + SCC-file test; the trailing-space case stays green, as expected) |
| M6 walk one parent level | 20 | yes (also reds tests 1, 4, 5, 9 and displayCardHybrid, since the first parent is always the slot) |
Logs: `sc536-r2-mutant-M*.log`. Mutation script `sc536-r2-mutate.py.txt`; driver was a bash loop with `git checkout --` of the literal path after each; `git status` clean afterwards. (Run on 34f46cf base; `RefUnwrapView.ts` is byte-identical after the rebase, so not repeated.)

## Evidence
- RED on 34f46cf: `sc536-r2-jest-red.log` (23 failed / 70 passed of 93). RED on 458abe3 src (two src files restored from 458abe3, tests at HEAD): `sc536-r2-jest-red-on-458abe3.log` (23 failed / 70 passed). Passing on base by design: legitimate-nesting, inline-chain-clears (only the mutant breaks it), the 4 resolveGen-supersede tests.
- G-S56 on 34f46cf: `sc536-r2-lifecycle-gs56-base.log` (+ `…-base-FAIL.png`). On 458abe3: `sc536-r2-lifecycle-gs56-base-458abe3.log` (+ `sc536-r2-lifecycle-gs56-base-458abe3-FAIL.png`). Base-fail line (458abe3): `G-S56 FAIL: (a) cycle, Reading view: a lookup was still starting after 8 released (8 made … 9 card(s)): the chain does not stop | (a') … same in Live Preview | (cap) 7 lookups made (7 released), want 5 | (b) FIFO: 1 read(s) held at once, want 2 | (c) … 1 read(s) held at once, want 2 | (d) … 1 read(s) held at once, want 2`.
- G-S56 on HEAD alone: `sc536-r2-lifecycle-gs56-head-final.log` (pre-rebase); in the final halves: `sc536-r2-lifecycle-b.log` (`G-S56 ok`, 22/22).
- G-S56 order dependence found and fixed: after the 21 earlier scenarios, a leaf left in Live Preview keeps an editor beside its Reading view that draws and looks up the next note's blocks too (lookups doubled). G-S56 now opens one fresh leaf and detaches every other markdown/sidebar leaf first, and runs its Live Preview phase in its own tab leaf. First failing run kept as `sc536-r2-lifecycle-b-run1-gs56-order-dependent.log` and `…-run1-G-S56-FAIL.png`.

## Gate logs (all in the ledger dir)
`sc536-r2-gate-tsc.log`, `-lint.log`, `-jest1.log` (pre-shots: 6220 passed / 2 skipped / 6222), `-jest2.log` (one 5 s timeout, initiative-default-keys SC-485 test, load avg 32), `-jest3.log` (6221 passed / 1 skipped / 249 of 250, rc 0), `sc536-r2-lifecycle-a.log` (21/21), `sc536-r2-lifecycle-b.log` (22/22), `-gate-e2e.log` (124/124, 87/87, first run, no CHR-F02 flake), `-gate-shots.log` (took >600 s under load; ran to completion, rc 0, 592 PNGs, host-copy pin OK, button host-leak 157 kinds / 942 comparisons, modal 228), `-gate-freeze.log` (`freeze OK (280/280 …)`), `-gate-parity.log` (0 gap(s), 0 undeclared, 24 declared). Scripts: `sc536-r2-*.sh.txt`, `sc536-r2-fix.py.txt`, `sc536-r2-mutate.py.txt`.

## Drive-by fixes
None.

## Follow-ups
- Test-hygiene: any lifecycle scenario that opens notes in a leaf previously in Live Preview inherits the hidden editor's lookups; G-S56 works around it, others that count lookups would need the same.
- A self-cycle costs exactly one extra lookup (the check runs after the lookup, per ruling); a pre-lookup raw check was deliberately not added.
- Sidebar host not probed in real Obsidian (reasoned only) — for the r3 reviewer as the ledger says.
- dse-verify SKILL row 4 now says 43/43 and halves 21 + 22; the dispatcher's CURRENT block (still 42/42 for 458abe3) needs its own update at landing.
- Shots exceeded the 600 s tool timeout under load (already noted in SKILL row 5); it completed in the background and I read its own log.

## r4

### Summary
- Verdict: DONE. Rebased onto dse `develop` f81a277 (SC-533, G-S54): plugin head `fb24f8a2`, 5 commits over f81a277: `55cb698c` RED tests, `1f305e06` the guard, `1be1ebc7` G-S56, `effbb9d8` G-S56 fresh-leaf start, `fb24f8a2` INFO-3 + INFO-5 (the r4 delta).
- Conflict in `obsidian-lifecycle.mjs`: kept G-S54 then G-S56 (G-S56 last). No `package.json` change; no `npm ci`.
- INFO-3: G-S56 reads `calls` and `raws` in one `t.ev` (the two helpers it replaced are deleted). INFO-5: comment at G-S56 says it runs last, detaches other leaves, and a later scenario must set up its own.
- Superproject worktree: branch reset onto main `e0f5c76a`, head `5325f33b`; net file list vs `e0f5c76a`: `CHANGELOG.md` only (9 lines). The SKILL.md hunk is gone (`git diff main..HEAD -- .claude/skills/dse-verify/SKILL.md` is empty); proposal in `sc536-dse-verify-row4-proposal.md`. Pointer bump not staged.
- Gates: tsc/lint clean · jest 6228 passed / 1 skipped / 249 of 250 (6208 + 20, exact) · lifecycle 44/44 (22/22 in 198 s + 22/22 in 542 s; G-S56 last of the second half) · e2e 124/124 ok, 0 failed, 0 known-bug, 87/87 pairs · shots 592, 0 FAIL, host-leak 157/942 (passed the 600 s tool timeout under concurrent shots from other worktrees; read its own log, rc 0) · freeze 280/280 · parity 0/0/24.
- G-S56 on f81a277 src (RefUnwrapView.ts and view.ts restored): FAILs all 6 phases, and the lookup count now equals the list length (8 and 8).

### Notes
- `git diff f81a277..HEAD --stat` is the same 6 files as before (src: RefUnwrapView.ts, view.ts; tests: 3 files; lifecycle).
- Lifecycle half timing: second half 542 s of 600; if more scenarios land, move a few into the first half (proposal file section 1).
- Logs (`sc536-r4-*.log`): `gate-{tsc,lint,jest1,e2e,shots,freeze,parity}`, `lifecycle-a`, `lifecycle-b`, `lifecycle-gs56-base-f81a277` (+ `-FAIL.png`).
- Drive-by fixes: none. Follow-ups: none new.
