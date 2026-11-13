# SC-619 r4 fix + rebase report

**Executive summary**
- Verdict: DONE. LOW-1 pinned (accepted residual, NOT persistent), LOW-2 closed, INFO-4 folded, rebased, full battery green.
- dse branch `sc619-crlf-hover-refusal` @ `df92a3f6` on develop `1cc54eac` (4 commits: `e1d9cdc8` r1 tests, `5aa9bf6f` fix, `94454bdb` G-S112, `df92a3f6` r4 tests + comment). The rebase had no conflict (G-S112 after G-S108, G-S56 last, `node --check` ok). Not pushed.
- Superproject changelog commit `b67e1a43` on workspace origin/main `26b92a8a` (rebased with autostash); no pointer bump (tree shows only ` M draw-steel-elements`).
- LOW-1: refused with one Notice and nothing written while the card keeps its CRLF snapshot (jest, same host, preview redrawn with the LF part); a preview reopened on the LF note (a new card) SAVES into the hovered counter. Not persistent, so the ruling stands (option a).
- LOW-2: mixed note (CRLF heading line over an LF blank line) test added; mutant `eols[start + 1]` now fails it (1 failed / 22 passed); at the pre-fix src it fails too.
- tsc + lint clean · jest **11817 passed / 2 skipped** (fresh, shots-cache css hidden; 11818 / 1 with the cache) · lifecycle **63/63** · e2e **331/334 ok, 0 failed, 3 known-bug, 176/176 pairs**.
- shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0/0/24**.

## What changed in r4
- `src/framework/host/ReadingModeBlockHost.ts`: only the comment, two added lines after "...exactly as the same LF note's part." naming the residual.
- `test/dom/framework/reading-mode-host-crlf-hover.test.ts` (+3 tests, now 23):
  1. `SC-619: a CRLF heading line over an LF-only blank line (the part starts "\n\n```" ...)`: part asserted to start `"\n\n```ds-counter\r\n"`; saved, bytes kept, no Notice.
  2. `SC-619 residual: the CRLF note converted to LF while its heading hover is open: + is refused ...`: nothing written, exactly the one dropped-write Notice.
  3. `SC-619 residual is not persistent: after the refusal the preview reopened on the LF note (a new card) saves ...`: new popover + new host on the LF note: saved into the hovered counter, all-LF, no Notice.
  Shared helper `convertedWhileOpen()` mounts on CRLF, converts to LF, sets the redrawn LF part, and does NOT call `rebind` (measured in jest: with `rebind` the host re-snapshots the LF note and saves; r3's real-Obsidian measurement is that the redrawn card keeps its mount snapshot, which only the no-rebind model reproduces).
- Skill proposal `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc619-crlf-hover-refusal/sc619-skill-proposal.md`: CR-only measured, LOW-1 residual (and the qualified "an LF note never takes the branch"), `eols[start]` note, new section 1b (CRLF heading hover `lineStart` 2, no callout heading hover card, hand-slice the raw note in jest), 23 tests, new CURRENT numbers.

## Mutant / base checks (jest file, logs `rb2-mut-eol1.log`, `rb2-base-src.log`)
- `eols[start + 1]` mutant: 1 failed (the mixed-note test), 22 passed.
- src of `1cc54eac` (no fix): 11 failed / 12 passed: the 8 r2 reds, the mixed-note test and both residual tests (at base the CRLF-to-LF + saves, so the "refused" pin fails there, as r3 measured).
- Source restored byte-equal after both (cmp).

## Gates on `df92a3f6` (logs in `.../scratchpad/sc619-r2-impl/`, prefix `rb2-`)
- tsc (incl. e2e) and lint: rc 0 (`rb2-tsclint.log`).
- jest: first run 11818 passed / 1 skipped, because `visual-harness/dist/obsidian-app.css` was cached by the previous shots run, so the normally-skipped `printTwinDeltaAllowedSet` test ran. With that file moved aside (and put back) and `main.js` / `styles.css` removed: **11817 passed / 2 skipped / 0 failed**, 276 suites passed + 1 skipped (`rb2-jest-fresh.log`). 11794 + 23 = 11817. (The owner's 11816 assumed 2 new tests; there are 3.)
- lifecycle, seven parts: 21/21 (185 s), 16/16 (323 s), 9/9 (404 s), 4/4 (296 s), 7/7 (394 s; G-S91 green first run), 4/4 (294 s; G-S97 green, appearance.json untouched), 2/2 (128 s) = **63/63**.
- e2e: `OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (172 s).
- shots (706 s): 592 ok, no FAIL; button host-leak 163 kinds / 978; modal button host-leak 40 kinds / 240; capture clip 147. freeze OK 280/280. parity 0 gaps / 0 undeclared / 24 declared.
- Moved numbers vs r2: none besides the new tests (jest 11814 -> 11817 = +3 here; base moved 11794 unchanged by the SC-616 rebase).

## Drive-by fixes
None.

## Follow-ups
- The LOW-1 pin is jest only; a real-Obsidian cell for "reopen after a conversion saves" was not run (the logic is a fresh mount reading the current note, so it is deterministic; r3 measured the conversion cell in real Obsidian).
- Nothing else.
