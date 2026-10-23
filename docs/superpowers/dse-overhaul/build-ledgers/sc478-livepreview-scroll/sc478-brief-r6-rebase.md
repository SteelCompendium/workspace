# SC-478 r6: rebase + full regate (implementer, resumed)

You are the SC-478 implementer, resumed for a rebase-and-regate round. Your final text goes to the ticket-owner. **Workers never call the tracker.**

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/decisions.md`. Read it from "r4 DONE" to the end, including the r5 verdict and any owner rulings on it.
- Your dse head is `24e9179` on `e4c5cf6`, and the superproject is at `e9d2e24` on `acaa6f4`.
- Since then, four commits have landed on develop:
  - SC-279 `c0e761b`: roll strip UX, `visual-harness/entry.ts` and `shoot.mjs`, 12 new shots, 2 roll print lines rebaselined.
  - SC-465 `e8f6a14`: Stamina modal focus.
  - SC-477 `d152ea4`: host write-back for unterminated trailing fences, plus **lifecycle G-S28 in `visual-harness/obsidian-lifecycle.mjs`**.
  (develop was still `d152ea4` at dispatch.)

## 2. Task

1. Commit first. Then run `git -C <dse abs> fetch origin` and rebase onto `origin/develop`. It is `d152ea4` at dispatch; use anything newer and report the sha.
   - **Expect a conflict in `obsidian-lifecycle.mjs`.** Keep SC-477's G-S28 and every other scenario whole. Re-apply only SC-478's G-S18 block and its header lines.
   - If `registerFrameworkElements.ts`, `previewScrollPin.ts` or any other SC-478 file conflicts, resolve it and list every hunk you touched.
   - Run `npm ci` if `package.json` or the lockfile changed.
2. Fetch the superproject and rebase onto the latest `origin/main`. If the CHANGELOG conflicts, keep everyone's bullets and re-add only SC-478's. Leave the `draw-steel-elements` pointer unstaged.
3. Apply any r5 fold the ledger lists for you, quoted there verbatim: "**N-L2** (over-widening the interval untested: mutation r5b survives) → FOLD into r6: one jest case with a second change far after the block; report the r5b mutation going red." (r5's mutation r5b = widen the interval over every change instead of only the changed range touching the old fence start; see `sc478-r5-rereview-report.md` and `sc478-r5-mutation-check.log`.) Commit it as `test(SC-478 r5): …`. **Out of scope (filed SC-496): N-M1 re-anchoring and N-L1 one-entry-per-widget matching — do not implement them.** The jest count becomes 5796 + 1 (or however many the N-L2 case adds).
4. **Discrimination** on the new base, `--only=G-S8,G-S15,G-S18`, 2/2 each:
   - base: G-S18 FAIL;
   - head: all three ok;
   - control "restore never dispatched": G-S18 FAIL;
   - control "no hold": G-S18 FAIL.
   The other two controls only need re-running if the rebase touched their code.
5. Run the **full battery** on the final head, in dse-verify order.

## 3. Expected (develop `d152ea4` + SC-478)

| gate | expected |
|---|---|
| tsc (incl. `-p e2e`) | clean |
| lint | clean |
| jest (`rm -f main.js styles.css` first) | 5769 + SC-478's 27 = **5796** passed / 1 skipped / **239 of 240** (more if r5 folds add tests; state the count) |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 33/33 ok, 0 failed` (32 + G-S18) |
| e2e | `OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` |
| shots | 592, 0 FAIL, still printing the modal host-leak and text-scale lines |
| freeze | `freeze OK (280/280 …)` (an older base reads 2 roll mismatches, so this only holds on `c0e761b` or newer) |
| parity | 0 / 0 / 24 |

If the base moved past `d152ea4`, use the numbers for that base and say where you got them.

## 4. Rules / footguns (unchanged)

- **Scratch:** use your private scratch subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r2-a8b4aaae43f31a06f/`. Give every run a new unique name (e.g. `*10`). Write scripts with the Write tool.
- **Commands:**
  - Run commands as `devbox run -c <dse abs> -- …`.
  - Never `cd` inside a compound command; use `git -C <abs>`.
  - Run one gate per Bash call.
- **Deleting:** no glob `rm`, and never `rm -rf` under `.superpowers/`.
- **Processes:** kill only by PID, and only a PID whose command line contains `worktrees/sc478-livepreview-scroll/`. Use your own `DSE_LIFECYCLE_PORT` and stay off `:1`.
- **Running gates:**
  - Record each run's rc via a wrapper file, and redirect output to a log; never stream it.
  - Run every gate in the foreground.
  - `shots` exceeds 10 min. Run it detached, then block in the foreground on its PID, then read its own log and rc. Never key the wait on a scratch filename.
- **Talking to me:** if you need input, return `STATUS: NEEDS_CONTEXT`. Start any message with `SC-478:`. If the report write is blocked, return the report inline.

## 5. Output and return

- **Report:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/sc478-r6-rebase-report.md`. It opens with a ≤10-line exec summary:
  - shas;
  - every conflict, file by file, with the hunks;
  - every gate number;
  - the discrimination table.
- **Logs:** prefix with `sc478-r6-`.
- **Final text:** raw facts, the porcelain of both trees, and the absolute path of every artifact.
