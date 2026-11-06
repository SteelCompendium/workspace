# SC-349 implementer brief, round 1

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/decisions.md`
  (the ledger — current state; quote it, never the tracker).
- Read the `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  — sections "The battery, in order", "Devbox wrapping", "THE exit-code footgun", "Freeze semantics"
  (first ~60 lines of it are enough: division of labor + capture-artifact case), "Current expected numbers"
  (the CURRENT block only).
- Read the workspace `AGENTS.md` and `draw-steel-elements/AGENTS.md` in your worktree.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc349-skills-print-clip`. The plugin is
  `/home/scott/code/steelCompendium/worktrees/sc349-skills-print-clip/draw-steel-elements`, branch
  `sc349-skills-print-clip`, currently at dse `develop` `aaa88b7`. First: `git -C <plugin> fetch origin`
  and confirm `origin/develop` is still `aaa88b7`; if it moved, rebase onto it and say so in the report.
  Verify `pwd`/paths before any write: NOTHING is ever written under
  `/home/scott/code/steelCompendium/workspace/draw-steel-elements` (the shared main checkout). The
  main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not touch or report it.
- Run `npm ci` in the plugin dir before the battery if `node_modules` is missing.

## 2. The task

Ticket (verbatim, from the ledger):

> The frozen `*--steel-print.png` captures of the Skills element never show the bottom of the skill
> list. Everything below device row 2400 is white (below row 2512 for `chrome-skills-menu`), but the
> page is 4,030–4,682 px tall. ... Fix: raise or remove the capture clip for the skills-family shots.

Owner ruling (verbatim, from the ledger):

> Fix the mechanism, not the skills family alone: no browser-camera capture may come out clipped.
> Hard constraint: every capture that is NOT clipped today must stay byte-identical (the fix only
> changes behaviour for captures taller than the viewport).

Known facts to start from (verify, do not trust):
- `visual-harness/shoot.mjs` ~line 5776: the sweep's browser context is
  `viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2` (1200 CSS px = 2400 device px).
- `snap()` ~line 538: non-gallery, non-fullPage captures use `page.locator('#mount').screenshot()`.
  The element screenshot comes out at full element height, but everything below the viewport's
  bottom edge is blank white.

Steps:

A. **Baseline measurement on the unmodified base.** Run `npm run shots`, then the freeze check
   (expect `freeze OK (276/276 …)`). Then, for every one of the 572 browser-camera PNGs (not only
   frozen ones), classify it as CLIPPED or not: CLIPPED = PNG taller than the viewport's device
   height measured from #mount's top, and the rows below that edge are blank while the element's
   real content extends there. Write a small measuring script (in your private scratch folder) —
   e.g. compare the PNG height to 2400 minus #mount's device top offset, and check whether the tail
   rows are uniformly the background colour. Produce the list of CLIPPED captures, with the frozen
   ones (names in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`)
   marked. Also state the root cause precisely (why Chromium paints blank below the viewport — e.g.
   paint is limited to the viewport for an element screenshot under this context).
   Copy the base-run frozen PNGs you will need for before/after crops into your private scratch
   folder BEFORE re-running shots.

B. **Fix** in `visual-harness/shoot.mjs` (and only the harness). Preferred shape: before a
   `#mount` screenshot, measure the capture's needed height; only if it exceeds the current viewport
   height, enlarge the viewport height to cover it (ceil, plus whatever margin is needed), take the
   shot, and restore the original viewport. Captures that fit are taken exactly as today. Check that
   enlarging the viewport does not change layout of the tall element in a way that matters (e.g.
   anything sized on `vh` or `100%` of the viewport) — report what you find. Apply the same rule to
   every other browser-camera screenshot path in the file that can clip the same way (search all
   `screenshot(` call sites; fullPage ones may already be fine — check). Add an in-run gate in the
   style of the file's existing ones ("In-run gates inside `npm run shots`" in dse-verify): after
   each capture, fail the run loudly if the captured element was taller than the viewport at
   capture time (so a future change cannot silently re-introduce the clip). Keep the comment style
   of the file: a short `SC-349:` comment explaining why.

C. **Tests.** If the harness has jest-tested pure helpers (look under `test/` for visual-harness
   tests), put the measurement/decision logic in a pure helper and test it. Do not invent a test
   framework for `shoot.mjs` if none exists — the in-run gate is the test then.

D. **Re-run and prove.** Run shots twice from clean (two runs, same branch head). Requirements:
   - Every capture that was NOT CLIPPED in step A is byte-identical to the base run (compare all 572
     sha256s, not only the frozen ones). Any non-clipped capture that moved is a defect — fix it.
   - Every capture that WAS CLIPPED is now complete (tail rows show the real content; eyeball at
     least `skills--steel-print.png` and `montage-narrow--steel-dark.png`).
   - The two runs are byte-identical to each other.
   - The freeze check reads FAILED for exactly the frozen lines in the CLIPPED set, nothing else.

E. **Deliverables in the ledger dir** (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/`):
   - `rebaseline.txt` — `<sha256>  <filename>` lines for EVERY frozen line that moves (all of them,
     skills and non-skills), same format as the baseline. Plus `rebaseline-skills-only.txt` — the
     subset whose filename starts `skills` or is `chrome-skills-menu--…`.
   - `sc349-clipped-list.txt` — every CLIPPED capture (all 572 considered), one per line, with
     base PNG height, the device row where content stopped, and FROZEN/unfrozen.
   - Before/after crops of the bottom region of `skills--steel-print.png` (before: blank tail;
     after: the real Lore group) and one non-skills frozen capture if any moved — PNGs named
     `sc349-r1-<id>-before.png` / `-after.png`, cropped to ~900 device px tall around the old
     2400 edge so they are readable on a ticket.
   - NEVER edit `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`
     or `check-freeze.sh`. Agents never touch the shared baseline.

F. Commit on the branch after each coherent step (`git -C <plugin> …`). Commit messages: no
   co-author trailers or AI attribution of any kind. Do NOT push.

## 3. Gates (run the full battery after the fix; one gate per Bash call)

Expected numbers at dispatch (dse-verify CURRENT, `aaa88b7`):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **5399 passed / 1 skipped / 231 of 232 suites** (plus any tests you add; a fresh worktree
  reads one fewer passed and 2 skipped until shots has run once)
- lifecycle **`OBSIDIAN-LIFECYCLE done: 28/28 ok, 0 failed`** — set your own `DSE_LIFECYCLE_PORT`
  (e.g. 9349) because other sessions run this gate concurrently
- e2e **`OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`**
- shots **572**, 0 FAIL (plus your new in-run gate line, passing)
- freeze: base reads `freeze OK (276/276 …)`; after the fix it reads FAILED for exactly the
  CLIPPED frozen set (that is expected and is what `rebaseline.txt` covers) — report the exact
  count. Also verify that a temporary COPY of the baseline with `rebaseline.txt` applied (in your
  scratch folder, never the shared file) reads OK on your fixed shots: run
  `check-freeze.sh` against the copy only if the script accepts a baseline path; otherwise use
  `sha256sum -c` on the copy from inside the shots dir via `bash -c` with absolute paths.
- parity (LAST) **0 GAPs / 0 undeclared / 24 DECLARED**

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/sc349-report-impl-r1.md`
— opens with a ≤10-line executive summary (verdict, branch head sha, number of CLIPPED captures,
number of frozen lines that move — total and skills-only, gate numbers). Then: root cause, the fix,
the clipped list summary, layout-effect findings, gate outputs (the literal result lines).

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers),
no prose, plus the absolute filesystem path of every evidence artifact you produced (report, lists,
rebaseline files, crops, logs). Separate `Drive-by fixes:` (already made) from `Follow-ups:` (left
alone).

## 6. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Private scratch: use ONLY `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-impl-r1/`
  (create it). The scratchpad is shared by every agent; never a generic script name outside it.
  Write scratch files with the Write tool, not heredocs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc349-skills-print-clip/draw-steel-elements -- bash -c '<cmd> > <abs log> 2>&1; echo rc=$? > <abs rc file>'`
  or a wrapper script file in your scratch folder that captures the exit code. Never pipe a gate
  into `tail`. Never `cd` inside a compound command; use absolute paths and `git -C <abs path>`.
  One gate per Bash call. Redirect long output to a file — the 600 s stream watchdog kills silent
  agents. Run long gates in the FOREGROUND with a generous timeout (up to 600000 ms); never start a
  gate in the background and wait for a notification — it will not come.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the process's
  own output, or write to a per-run unique path.
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose command line contains
  `worktrees/sc349-skills-print-clip/`.
- Never glob `rm` (`rm -rf /tmp/dse-obsidian-lifecycle-*` destroyed other runs' vaults). Delete only
  a path you created and recorded. Never `rm -rf` anything under `.superpowers/` except your own files.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I will
  resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-349:`.
