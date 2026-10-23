# SC-478 r5: scoped re-review (reviewer, resumed)

You are the SC-478 reviewer, resumed for a re-review of **the fix-round delta only**, not a fresh full pass. Your final text goes to the ticket-owner. **Workers never call the tracker.** Commit nothing. Revert every temporary edit.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/decisions.md`. Read from "Owner rulings on r3 findings" to the end.
- Fix report: `.../sc478-r4-fix-report.md`. Read its exec summary first.
- The dse branch is `sc478-livepreview-scroll` at **`24e9179`**, on develop **`e4c5cf6`**. The rebase moved the r2 work to `5815380`/`64e982d`/`a57cfb5`. The delta to review is `a57cfb5..24e9179`: b3a5764, c570d3c and the test commits. The superproject is at `e9d2e24` on `acaa6f4`, with ` M draw-steel-elements` as the expected unstaged pointer.
- Run `git fetch origin` in the dse clone. If develop has moved past `e4c5cf6`, report the sha. Do not rebase.
- Your r3 tooling is in the ledger dir (`sc478-r3-*.sh`, `sc478-r3-probe.mjs.txt`), and your bundles are in your scratch subfolder `sc478-r3-a486fa043b5abce34/`. Rebuild the bundles for the new head and base, and use new per-run log names (e.g. `*-r5-*`).

## 2. Task

1. **Each r3 finding is fixed**, proved live with your own probe on the new head versus base `e4c5cf6`:
   - M1: your natural second-pane wheel flow and the forced gap;
   - M2: insert above the fence and change the tracker;
   - L1: a callout in the deleted tracker's slot.
   Then re-run your three LOW-2 surviving mutations, and two of r4's new mutations of your choosing.
2. **The new G-S18 phases are realistic and non-vacuous.**
   - Phase (d) holds pane B's `setViewData` back until the wheel lands. Check that this models a real late transaction and does not create a path real Obsidian never takes.
   - The hold sighting now counts any `data-dse-lp-hold` mutation record. Check that it cannot pass without a real hold.
   - Run the six-bundle discrimination yourself, `--only=G-S8,G-S15,G-S18`, 2/2 each: base, head, no-restore, no-hold, no-refresh, old-match. Expected: base FAIL; head ok; the four controls FAIL. no-refresh fails only phase (d), and old-match fails only phase (e).
3. **No regressions from the new code.**
   - The scroll observer must never refresh from the restore's own scroll or the clamp's scroll, and must never refresh a consumed entry. Probe this live: no snap-back, and no restore to a clamped position.
   - Scrolling to the top drops the capture.
   - The widened interval cannot hold the wrong block. Test two DSE blocks next to each other, one edit spanning both, and a non-DSE block between two trackers.
   - The `cm-lang` filter must not break a legitimate hold, including two different DSE languages in one note.
   - Cost: is the scroll observer measurable while the user scrolls normally with no capture, and with a capture?
4. **Gates on `24e9179`.**
   - Run tsc, lint and jest (expect 5738 / 1 / 239 of 240).
   - Run lifecycle (expect `32/32 ok, 0 failed`).
   - Run e2e (expect `101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`).
   - Shots, freeze and parity: carry r4's numbers (580 / 280/280 / 0/0/24) if the delta touches no CSS or render code, and say so.

## 3. Rules / footguns (unchanged)

- **Scratch and files**
  - Use your private scratch subfolder, with unique per-run names.
  - Use the Write tool for scripts.
  - No glob `rm`. Never `rm -rf` under `.superpowers/`.
- **Commands**
  - Run commands as `devbox run -c <dse abs> -- …`.
  - Never `cd` inside a compound command. Use `git -C <abs>`.
  - Run one gate per Bash call.
- **Processes**
  - Kill only by PID, and only PIDs whose command line contains `worktrees/sc478-livepreview-scroll/`.
  - Use your own `DSE_LIFECYCLE_PORT`. Stay off `:1`.
- **Running gates**
  - Record each run's rc via a wrapper file. Redirect output to a log; never stream it.
  - Run in the foreground.
  - Never key a wait on a scratch filename.
- **Reporting**
  - If you need input, return `STATUS: NEEDS_CONTEXT`. Any message you send must start with `SC-478:`.
  - If the report write is blocked, return the report inline.
- **Out of scope:** SC-472, SC-479 and SC-491. The insert-only 48 px offset was DROPPED by the owner (CodeMirror's own mapping), so do not re-report it.

## 4. Output and return

- Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/sc478-r5-rereview-report.md`. It opens with a ≤10-line exec summary: verdict (APPROVE / REQUEST_CHANGES), new findings by severity, and gate lines.
- Findings use the r3 format: file:line, the measured failure, and the prescribed fix.
- Prefix evidence with `sc478-r5-`.
- Final text: raw facts, the porcelain state (it must be unchanged), and the absolute path of every artifact.
