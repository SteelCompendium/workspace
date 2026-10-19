# SC-372 — round 1 brief (implementer): make the three text-size prefs actually scale the --dse-fs-* tokens

## 1. Context loading (read first)

- Ledger (current-state decisions — read it, it beats anything else): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/decisions.md
- Origin finding: /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc318-card-headings/sc318-r3-review-report.md lines 81-85 (INFO-1). The probe it mentions (`probe-scale.mjs`) no longer exists; write your own.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc372-textscale — the plugin is at /home/scott/code/steelCompendium/worktrees/sc372-textscale/draw-steel-elements on branch `sc372-textscale`, cut from origin/develop **f8693b5**. Before any write: `git -C <that dse path> fetch origin && git -C <that dse path> rebase origin/develop`; if origin/develop has moved past f8693b5, say so in your report.
- Verify `pwd`/paths before every write. **Never touch /home/scott/code/steelCompendium/workspace/** except the ledger dir above (your report + evidence). Workspace-level docs you might edit (e.g. `docs/superpowers/dse-overhaul/D3-token-map.md`) live in YOUR worktree's superproject at /home/scott/code/steelCompendium/worktrees/sc372-textscale/… — never under /home/scott/code/steelCompendium/workspace/.
- Read draw-steel-elements' AGENTS.md / CLAUDE.md and the `dse-verify` skill (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md) before running anything.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is in files.

## 2. The task

The bug (ticket text, verbatim):

> The large-text preference writes `--dse-fs-large-scale` onto the element root. The `--dse-fs-*` tokens are declared on `:root` as `calc(<r>em * var(--dse-fs-large-scale))`. A `var()` inside a custom property resolves where that property is declared, at `:root`, so every descendant inherits the `* 1` value. As a result, the card name stays at 20px and an h3 stays at 21.088px when the preference is set to 1.2. Stamping the value on `<html>` makes it work (card name 24px).
>
> The small-scale and control-scale knobs follow the same pattern and are probably affected too. That has not been measured.

Owner decisions O1–O5 in the ledger are binding (quote: "Do NOT fix by stamping on <html>/document root"; "At default prefs, zero frozen bytes should move").

Pointers: token block in `styles-source.css` `:root {` at ~6353, scale vars ~6556-6605; prefs catalog `src/prefs/catalog.ts` ~325-370 (`smallTextScale`, `largeTextScale`, `controlTextScale`); applier `src/framework/seams/prefs.ts` (`reflectCss`, `rootEl.style.setProperty`). The harness accepts `prefs=largeTextScale:1.2`-style query params.

Steps:

a. **Measure BEFORE (on the unmodified branch).** In the harness (real Chromium via the existing Playwright tooling), for each knob at 0.8, 1.0 and 1.2, record computed font-size of at least one consumer per token: large → card name (`--dse-fs-heading`), a subheading, a numeral, an in-card h3; small → one each of secondary/label/caption/micro; control → a button / stepper / tab. Do it on an element root AND inside a modal (DseModal — modals receive the vars via `reflectCss` too). Confirm or refute "all three knobs inert".

b. **Enumerate every root `reflectCss` stamps onto** (element roots, modals, sidebar views, settings preview, anything else) and what selector/class each carries.

c. **Fix** so the scale-dependent tokens resolve against the root that carries the scale var. Preferred: re-declare ONLY the scale-dependent `--dse-fs-*` declarations on a selector matching every stamped root (keep `:root` too, so unstamped contexts keep their defaults). Keep one source of truth — if CSS forces duplicating the declarations, add a jest test that fails when the two blocks diverge. A different mechanism is acceptable if you show it is better; stamping on `<html>` is not.

d. **Audit every direct consumer** of `var(--dse-fs-small-scale|large-scale|control-scale)` outside the token block (e.g. `styles-source.css` ~17396: `calc(var(--dse-fs-label) / 1.462 / var(--dse-fs-large-scale))`) and any rule that compensated for, or depended on, the inert behavior. One line per consumer with a verdict (correct after fix / needed change / changed).

e. **Print.** Per catalog help text: small + large apply in print/export; control is screen-only. Verify the branch matches this, in print emulation.

f. **Regression gate.** Add a measured in-run gate to `npm run shots` (follow the style of the existing in-run gates, e.g. `title line stable OK (52 comparisons)`), printing a line like `text scale OK (<n> comparisons)` and failing the run otherwise. It must cover all three knobs at a non-default value, element root AND modal, and the print rule from (e). Prove it is not vacuous: run it once against the unfixed CSS (stash or a scratch revert) and record that it fails.

g. **Docs.** Update the comments at the token block / catalog if they describe the mechanism; add a CHANGELOG entry per the DSE repo's convention (find it); if `D3-token-map.md` describes the scale knobs' mechanism, update it in your worktree's superproject copy.

Commit after every coherent step (fixup commits are fine) — nothing sits uncommitted through a gate or build.

## 3. Gates — run the full dse-verify battery, in its order, and report each number

Expected at dispatch (dse `develop` @ 9ad919d/f8693b5, from dse-verify "Current expected numbers"):
- tsc / lint clean
- jest **4367 passed / 1 skipped / 215 of 216 suites** (+ your new tests; known flake `sidebarInitiative` "SC-288 r2" ~3% — SC-383; re-run once if it alone is red)
- lifecycle **25/25** (`DSE_LIFECYCLE_PORT=<pick a free port, e.g. 9291>`)
- shots **568** + any you add, 0 FAIL, all existing in-run gate lines OK, plus your new `text scale OK` line
- freeze **`freeze OK (274/274 …)`**. Default prefs must not move frozen bytes (O5). If any frozen line moves, do NOT rebaseline: stop, write `.superpowers/sdd/sc372-textscale/sc372-rebaseline.txt` (ready-to-apply hash lines) + before/after crops, explain the cause, and report.
- parity **0 GAPs / 0 undeclared / 24 DECLARED**, run LAST.

## 4. Evidence (for Scott — he reviews visually and is colorblind; label by text, never color)

For each knob at 120%: one before (develop build) / after (branch) side-by-side PNG of a real card (statblock or ability card for large+small, a tracker with buttons/steppers for control), with a text caption baked in naming the knob, value, and BEFORE/AFTER. Also one composite at 80% for the large knob. Keep to ~4 images, cropped to the card. Save under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/evidence/ with `sc372-` prefixed names.

## 5. Report

Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/sc372-r1-implement-report.md. It must OPEN with a ≤10-line executive summary (verdict, dse sha, gate numbers, frozen bytes moved y/n). Then: before/after measurement table (step a), stamped-root list (b), fix description (c), consumer audit (d), print (e), gate proof incl. the vacuity run (f), docs (g), `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — verdict, branch + sha, each measured gate number, frozen bytes moved (y/n, count), and the absolute path of EVERY artifact (report, evidence PNGs, logs, any rebaseline file). No prose.

## 7. Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms; split if needed). Do not end your turn "waiting for a notification" from a job you started — it will never come.
- Devbox: `devbox run -- bash -c 'cd /abs/path && cmd > /abs/log 2>&1'`; devbox's sh wrapper eats `$?`/`$PIPESTATUS`, and `| tail` masks failures — read each tool's own summary line as truth.
- Every git command as `git -C <absolute path> …` — never `cd X; git …` (a failed cd once ran git in the shared main checkout).
- Never `pkill`/`killall` by pattern — concurrent efforts run the same gate commands. Kill only by PID whose command line contains `worktrees/sc372-textscale/` (`pgrep -af "worktrees/sc372-textscale/"`).
- Never touch the shared freeze baseline `.superpowers/sdd/freeze-baseline.sha256`; never `rm -rf` anything in `.superpowers/` except your own `sc372-textscale/` files.
- `rm -f main.js styles.css` in the plugin root before `npx jest` if a stale build is present (dse-verify §"Stale main.js").
- You cannot SendMessage me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever send a message anyway, its FIRST WORD must be `SC-372:`.
