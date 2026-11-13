# SC-616 r2: implementation report (implementer afb42389)

## Executive summary
- STATUS: DONE. dse branch `sc616-gs91-hover-flake` at `33dd0a1b` (rebased on dse develop `1516f894`, SC-563; `package.json` unchanged, no `npm ci`). Commits: `c7e15725` (press + `gapEnd` gate), `33dd0a1b` (retry). Pre-rebase twins `ce03e0e7`, `5decbc4c` on `c0995beb`. Only `visual-harness/obsidian-lifecycle.mjs` changed (59+/33-). dse tree clean; superproject shows only the unstaged `draw-steel-elements` pointer.
- Gates on `33dd0a1b`: tsc, lint clean; jest 11692 passed / 2 skipped; lifecycle 61/61 (21/16/9/4/7/4, 185/326/406/297/391/296 s); e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`.
- `main.js` `338e7315f502248a6c3ab034a844baaa3ca25f6dc5cf4aeaf9bc257f665ad34c` and `styles.css` `a6c57131ab692a3c0d13135369fbe67cbbff6081385d0009d0c6bb4203405167` are byte-identical to a build of `1516f894`; shots/freeze/parity carry.
- G-S91 head: 10/10 alone on `33dd0a1b` plus 1 full part-5 run; 4 more green runs on the pre-rebase twin (3 alone, 1 part 5); no retry fired in any of the 15 natural runs; `gapEnd` 23-69 ms.
- Red on the SC-598-reverted bundle: 2/2 runs, 6/6 trials each (title, apply, dblq: preview gone; reopen: source editor + focus in preview); no retry fired.
- Retry exercised with a forced gate: threshold 10 ms: every non-dblq trial re-run twice then FAIL naming the re-runs; threshold 40 ms: title lp passed on its third attempt, outcome line named it.
- Fresh-state finding: every `gs91Trial` call starts from fresh state, so a re-run is provably equivalent to a first run (details in section 2).
- SKILL proposal: `sc616-dse-verify-proposal.md` (same dir).

## 1. What changed
- r1's prototype applied as is: the second press (title / apply / reopen) is `mousePressed`, an in-page 11 ms `setTimeout` promise, `mouseReleased`. The opening click's dispatch end is recorded by a window-bubble `click` listener (`end: true`), and `gapEnd` is the second click's capture minus it. `gap` (from the start) stays for the messages.
- Gate: `gap === null || (target !== 'dblq' && (gapEnd === null || gapEnd >= 140))`. dblq has no gate, as before.
- Comments updated: file header (a new SC-616 paragraph after SC-598's), the `gs91Trial` JSDoc (press shape, `gapEnd`, fresh state), the comment at the press (the unmeasured "16 of 20 / 2 of 17" figures reworded to "2 of 17 plain runs"), the G-S91 scenario comment.
- Retry (the loop in the scenario's `run`, `for (;;)` per trial): re-run when `!r.error && target !== 'dblq' && r.gap !== null && r.gapEnd !== null && r.gapEnd >= 140 && bad.length === 1 && retries < 2`. The gate message is pushed before any other, so `bad.length === 1` means it is the only problem. On any other outcome the trial is judged as before. Retries show as `<label> (re-run Nx, the host was too slow to prove anything: <gapEnd list> ms from the end of the opening dispatch)` in the outcome line and in a FAIL line.
- No bracketed ticket id anywhere in a title; G-S91 stays in part 5 before G-S56; no new scenario id.

## 2. Is a re-run fresh? (O2 precondition)
Yes, so the retry is not restricted to some trials. Each `gs91Trial` call begins with `t.reset(src)` and `t.reset(host)` (both fixtures rewritten from `FIXTURES`, so the `apply` trial's `current_stamina: 18` is undone), `K.openHost` (detaches every markdown leaf but the first, reopens `other.md`, then the host, in the trial's mode), `K.hover` (starts with a pointer move to 5,5 and a fresh Ctrl-hover) and the in-page `window.__gs91 = []`. Its `finally` runs `K.cleanup` (pointer parked, every `.modal-container` closed, every hover popover hidden and removed). The `reopen` trial redoes its own first open. The only state kept across calls is the install-once click listener (`window.__gs91l`), which only appends to the array that the call resets. The scenario's own setup (the notice-hiding style, the `authoringControls` pref) is set once outside the loop and is trial-independent.

## 3. Gates
| Gate | Result | Time | Log |
|---|---|---|---|
| tsc | clean, rc 0 | 12 s | `sc616-r2-tsc.log` |
| lint | clean, rc 0 | 16 s | `sc616-r2-lint.log` |
| jest | `Tests: 2 skipped, 11692 passed`, 272 suites passed + 1 skipped | 85 s | `sc616-r2-jest.log` |
| lifecycle part 1 | `done: 21/21 ok, 0 failed` | 185 s | `sc616-r2-lc1.log` |
| part 2 | `16/16 ok` | 326 s | `sc616-r2-lc2.log` |
| part 3 | `9/9 ok` | 406 s | `sc616-r2-lc3.log` |
| part 4 | `4/4 ok` | 297 s | `sc616-r2-lc4.log` |
| part 5 | `7/7 ok` | 391 s | `sc616-r2-lc5.log` |
| part 6 | `4/4 ok` (G-S97 passed; no appearance.json problem) | 296 s | `sc616-r2-lc6.log` |
| e2e | `OBSIDIAN-E2E done: 328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` | 163 s | `sc616-r2-e2e.log` |

Lifecycle union: 21 + 16 + 9 + 4 + 7 + 4 = 61/61. Load average during the gates was 1-11 (another effort's lifecycle was running at times).

Supporting evidence on `c0995beb` (pre-rebase, this worktree before SC-563; same harness diff at `5decbc4c`): tsc, lint clean; jest 11682 passed / 2 skipped (`sc616-r2-c0995beb-jest.log`); lifecycle 21/21, 16/16, 9/9, 4/4, 7/7 (part 5 389 s, `sc616-r2-c0995beb-lc5.log`), 4/4; e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (`sc616-r2-c0995beb-e2e.log`). Both hashes there: `main.js` `4c802419f4878e3c9bea2aa8503951004171688c29e3dc4a5f131064728ab6fc`, `styles.css` `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, identical to a build of `c0995beb` (`sc616-r2-c0995beb-build.log`).

### Byte identity on the rebased head
`git archive 1516f894` built in scratch with `node esbuild.config.mjs production` (node_modules symlinked), against `npm run build-no-check` on `33dd0a1b` (`sc616-r2-build-1516.log`):
- `main.js`: head `338e7315f502248a6c3ab034a844baaa3ca25f6dc5cf4aeaf9bc257f665ad34c` = base `338e7315f502248a6c3ab034a844baaa3ca25f6dc5cf4aeaf9bc257f665ad34c`.
- `styles.css`: head `a6c57131ab692a3c0d13135369fbe67cbbff6081385d0009d0c6bb4203405167` = base `a6c57131ab692a3c0d13135369fbe67cbbff6081385d0009d0c6bb4203405167`.
Shots / freeze / parity are therefore carried from the dispatcher's baseline for `1516f894` (not re-run; harness-only, SC-557 precedent).

## 4. G-S91 evidence
Natural runs (table: `sc616-r2-g-s91-gaps-table.txt`; one log per run `sc616-r2-headA-1..5.log`, `sc616-r2-headB-1..5.log`):
- `33dd0a1b`: 10 of 10 alone green (headA-1..5, headB-1..5), plus part 5 (`lc5`) green. Each run 50-51 s.
- Pre-rebase `5decbc4c`: 3 of 3 alone green, plus part 5 green (`c0995beb-lc5`). A 4th run was killed on purpose (SIGTERM) when the course correction arrived; it has no result.
- No `re-run` text in any of the 15. Per trial: `gap` (from the opening click's start) title rv 51-106, title lp 61-106, apply 43-81, reopen 44-79; `gapEnd` title rv 25-48, title lp 38-69, apply 23-44, reopen 23-33 (max 69 against the 140 gate). dblq has no `gapEnd`.
- Before (r1, c0995beb harness): 2 of 17 plain runs red (title rv, gaps 75 and 77), 1 of 52 in-session repeats, 16 of 20 red in the worst-case straddle; after: 0 of 15 here, 12 of 12 and 20 of 20 worst-case in r1.

Red on base (`DSE_LIFECYCLE_BUNDLE` = r1's SC-598-reverted bundle, `.../sc616-r1-add63411/base598rev`, built from `c0995beb`; SC-563 does not touch `managedModal.ts`): `sc616-r2-baseRed-1.log`, `-2.log`, 42 s each, both `done: 0/1 ok`:
- title rv, title lp, dblq rv, dblq lp, apply rv: "700 ms after the second press the preview was gone" (second click 47-132 ms after the opening click's start).
- reopen rv: "the preview turned into a source editor" + "the keyboard focus moved into the preview behind the open modal".
- None is the gate message, and neither log contains `re-run`: product failures were not retried.

Retry mechanics, forced (scratch copy of the harness with the gate threshold lowered; copy kept as `sc616-r2-forced-gate-scratch-harness-gate40.mjs.txt`, deleted from the worktree, not committed):
- threshold 10 ms (`sc616-r2-forcedgate10.log`): title rv, title lp, apply rv, reopen rv each `re-run 2x` then FAIL with the gate message; dblq not retried and passed. The run took longer by two extra trials per non-dblq trial.
- threshold 40 ms (`sc616-r2-forcedgate40.log`): `title lp (re-run 2x, ... 40, 51 ms ...)` passed on its third attempt, outcome line names the re-runs; `done: 1/1 ok`.

## 5. SKILL.md proposal
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/sc616-dse-verify-proposal.md`: replacement text for the line-182 bullet, a sentence for the SC-598 bullet (line 475), footgun (12) (it is affected: it says cutting the lead makes the trial red and that the gate stays at 140 from the start; both are now wrong), battery row 4 (part 5 timing unmoved: 389-391 s; optional data point), and a CURRENT block draft (dse sha TBD).

## 6. Artifacts (all in this directory, prefix `sc616-r2-`)
Gate logs: `tsc`, `lint`, `jest`, `lc1`..`lc6`, `e2e`, `build-1516`; c0995beb logs `c0995beb-jest`, `c0995beb-e2e`, `c0995beb-lc5`, `c0995beb-build`; G-S91 logs `headA-1..5`, `headB-1..5`, `baseRed-1..2`, `forcedgate10`, `forcedgate40` (all `.log`); `g-s91-gaps-table.txt`; scripts `gate.sh.txt`, `rep.sh.txt`, `gaps.py.txt`, `forced-gate-scratch-harness-gate40.mjs.txt`. Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r2-afb42389/`.

Drive-by fixes: none.

Follow-ups:
- The retry's "sole problem" test is `bad.length === 1`. On a host so slow that the gate trips AND the preview was lost, the trial FAILs with both messages and is not re-run (as O2 asks); if that ever happens in practice the failure line will show a large `gapEnd` next to the product failure.
- r1's O4 point (both plain failures were the session's first trial) was not pursued; none of the 15 natural runs failed, so there is nothing more to say about it.
- Three `/tmp/dse-obsidian-lifecycle-*` dirs that these runs kept for FAIL screenshots (the two base-red runs and the forced gate-10 run) were deleted by literal path.
