# SC-478 r4: fix round + rebase (implementer, resumed)

You are the SC-478 implementer, resumed for a fix round. Your final text goes to the ticket-owner, not a human. **Workers never call the tracker (Linear).**

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/decisions.md`. Re-read it from "r3 DONE" to the end. **"Owner rulings on r3 findings" is your spec.**
- Review: `.../sc478-r3-review-report.md`. Each finding there has a failure scenario, measured numbers and a prescribed fix. r3's probe tooling is in the same dir (`sc478-r3-probe.mjs.txt`, `sc478-r3-{run,probe,disc,build,variants,mutate,gate}.sh`). Copy it into your scratch subfolder to reproduce M1/M2/L1 before and after your fix.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll`. Your dse head is `b17b3cd` on `54f8f88`; the superproject is at `f980513` on `46ae296`.

## 2. Task

1. **Rebase first.**
   - Fetch in the dse clone, then rebase onto `origin/develop`. That is `3973b56` at dispatch: SC-356 changed `visual-harness/shoot.mjs`, `styles-source.css` and the modal registry; SC-482 added `src/elements/shared/undeclaredDefaults.ts`. Use a newer sha if develop has moved, and report it.
   - Fetch in the superproject and rebase onto the latest `origin/main`. If the CHANGELOG conflicts, keep everyone's bullets and re-add only yours.
   - Run `npm ci` if `package.json` or the lockfile changed.
2. **Fix every finding per the ledger rulings.** Quoted verbatim:
   - "**MEDIUM-1** … → FOLD r3's fix: keep the capture current instead of dropping it — a ViewPlugin `eventObservers: { scroll }` that re-captures (`capture(view, cap.owner)`) while an un-consumed capture exists, so the restore lands where the user scrolled to; never refresh a consumed/pending entry or from the restore's own / the clamp's scroll; keep the 1 px check as fallback; if the user scrolls to the very top, drop the capture. Jest test + a G-S18 phase where pane B wheels during the gap (deterministic — force the gap, no timing luck; no retries)."
   - "**MEDIUM-2** … → FOLD: match a widget whose start lies in `[mapPos(p,-1), mapPos(p,1)]` (or map with `assoc 1` — implementer's choice, say which and why); make the jest `shift()` fake honour `assoc`; G-S18 phase "insert above the fence and change the tracker in one write". The insert-only 48 px offset (CodeMirror's own snapshot mapping) → measure after the fix; fix only if the same change resolves it, otherwise report."
   - "**LOW-1** … → FOLD: record the widget's `cm-lang-*` class at capture; hold only a replacement with the same class; jest test."
   - "**LOW-2** … → FOLD: a test that goes red for each; re-run the mutation check and report one line per mutation." The surviving mutations to cover:
     - the `plugin.register(() => lpHold.releaseAll())` registration;
     - the remap of a pending entry's positions on a later doc change;
     - `assoc -1 → +1`, or whatever your M2 fix makes the equivalent.
   - "**INFO-1** … → FOLD: correct the header wording. **INFO-2** … → FOLD: document in the header. **INFO-3** … → FOLD: header wording. **INFO-4** (stale `obsidian-lifecycle.mjs:45` "G-S14 is reserved for SC-457") → FOLD."
3. **Commit after each coherent step.** Message prefixes: `fix(SC-478 r3): …`, `test(SC-478 r3): …`, `docs(SC-478 r3): …`. Do not push. Leave the superproject `draw-steel-elements` pointer unstaged.
4. **Discrimination** runs `--only=G-S8,G-S15,G-S18` twice per bundle, with the new base as the base bundle. Expected results:

   | bundle | expected |
   |---|---|
   | base | G-S18 FAIL |
   | your head | all three ok |
   | control "restore never dispatched" | G-S18 FAIL |
   | control "no hold" | G-S18 FAIL |
   | M1 control: scroll refresh disabled | the new wheel phase FAILs |
   | M2 control: the old `assoc -1` equality match | the new insert phase FAILs |

   Revert every temporary edit after each control.
5. **Reproduce r3's M1, M2 and L1 scenarios live**, before and after the fix, with r3's probe. Report the numbers.

## 3. Gates: full battery on the final head, in dse-verify order

Expected on `3973b56` plus your change:

| gate | expected |
|---|---|
| tsc (incl. `-p e2e`) | clean |
| lint | clean |
| jest (`rm -f main.js styles.css` first) | 5696 + your tests passed / 1 skipped / 239 of 240 |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 32/32 ok, 0 failed` |
| e2e | `OBSIDIAN-E2E done: 95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` |
| shots | 580, 0 FAIL, and prints `modal button host-leak OK (10 … 228 …)`, `text scale OK (1626 …)` and `text scale once OK (104184 / 208 loads …)` |
| freeze | `freeze OK (280/280 …)` (`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree dse abs>/visual-harness/shots`) |
| parity (last) | 0 / 0 / 24 |

If any number differs, diagnose it before claiming green.

## 4. Rules / footguns (unchanged; each cost real time once)

- **Scratch:** use your private scratch subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r2-a8b4aaae43f31a06f/`, with unique per-run file names (e.g. `gate-*8`). Write scripts with the Write tool.
- **Commands:**
  - Use `devbox run -c <dse abs> -- …`.
  - Never `cd` inside a compound command; use `git -C <abs>` for every git command.
  - Run one gate per Bash call.
  - No glob `rm`. Never `rm -rf` under `.superpowers/`.
  - Kill only by PID, and only a PID whose command line contains `worktrees/sc478-livepreview-scroll/`.
  - Use your own `DSE_LIFECYCLE_PORT`, and stay off Xvfb `:1`.
- **Running gates:**
  - Record each gate's rc via a wrapper file and redirect its output to a log, never streamed.
  - Run gates in the FOREGROUND.
  - `npm run shots` exceeds the 10-minute foreground limit. Run it detached, then block in the foreground on its PID with a loop such as `while kill -0 <pid>; do sleep 15; done` (timeout 600000, repeated). Then read the shots process's OWN log and rc file. Never key the wait on a scratch filename.
- **Messages and report:**
  - You cannot `SendMessage` me. If you need input, return `STATUS: NEEDS_CONTEXT`. Any message you send anyway starts with `SC-478:`.
  - If the report write is blocked, return the report inline.
- **Out of scope:** SC-472, SC-479, SC-491, and `sidebar/registration.ts` (SC-471).

## 5. Outputs

- Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/sc478-r4-fix-report.md`. It opens with a ≤10-line executive summary covering:
  - the shas (dse head and base, superproject head and base);
  - per finding, what changed and the before and after numbers;
  - every gate number;
  - the discrimination table;
  - the mutation lines.
- Then give the updated proposed `dse-verify/SKILL.md` text for G-S18 (new phases and controls).
- Prefix logs with `sc478-r4-` and list every path.

## 6. Return contract

Raw facts only:
- the verdict;
- the shas;
- the numbers;
- the porcelain of both the dse and superproject trees;
- the absolute path of every artifact.
