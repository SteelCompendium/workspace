# SC-605 r3 — independent adversarial review (reviewer role, identity R2)

## 0. Context loading (read first)
1. The ledger (spec verbatim, baseline, owner rulings — BINDING; you review against it):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/decisions.md
2. The common gates/footguns brief (binding; every footgun applies to you, including the off-limits files):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/sc605-brief-common-gates-footguns.md
3. Design (R1): `sc605-r1-design-report.md` (same dir). Implementation report (I1): `sc605-r2-impl-report.md` (same dir) —
   read their executive summaries; do NOT anchor on their conclusions. Probe harness you may reuse: `sc605-r1-probe.e2e.ts.txt`,
   `sc605-r1-run-probe.sh.txt`, `sc605-r1-summarize.py.txt`, `sc605-r1-fixture-zz605-*.md.txt` (park probe specs in `e2e/` only
   while running `--only`, remove after; never a full e2e with them in place).
4. Worktree: /home/scott/code/steelCompendium/worktrees/sc605-lp-quickadd-draft-on-save — dse branch
   `sc605-lp-quickadd-draft-on-save`, HEAD `54e37fed` on `dcc53f0f`; superproject `2ab866bc on workspace origin/main f108e5e9 (dse pointer unstaged)`. You are reviewing:
   do not commit to this branch. Any probe edits are uncommitted and reverted before you finish (prove porcelain is clean).
5. Workers never call the tracker (Linear) — not to read history, not to post.

## 1. Task
Review `dcc53f0f..54e37fed` (dse) and the superproject CHANGELOG commit. EXECUTE AND PROBE, do not just read:
1. Re-run the full battery yourself (numbers in the common brief; branch expected: jest ~10811/2 on dcc53f0f, lifecycle 60/60,
   e2e `313/316 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`, styles.css identical → shots/freeze/parity carry).
2. Real-Obsidian probes, Live Preview, against every guard in the ledger's owner rulings (outside edit, two trackers, twins, two
   panes, another note, one-shot after Add, typed-after-press, mouse never moves focus, Reading view + pinned sidebar unchanged).
   Plus what R1 did not measure: a popout window (R1 risk 5); the hidden `display:none` widget copy (R1 risk 2) if you can make
   Obsidian produce one; rapid repeated presses (two saves inside 1500 ms); a draft present while the note is closed and reopened
   within 1500 ms (must NOT resurrect — remount ruling); the stepper pressed by keyboard; Reset encounter → Yes in LP.
3. Integrity: the carry never writes the note (diff the note bytes before/after a carried save against a base build's save).
4. Code: the seam on `ElementView`, the capture/take ordering, expiry and one-shot, leaks (Maps/WeakSets cleared on unload; the
   module-level state across plugin reload), any element other than the initiative tracker accidentally opting in.
5. Tests: vacuity — revert the src change and confirm the new e2e/jest tests that claim to cover the bug go red; mutate the
   guards and confirm a test goes red; flag any test that passes on base for the wrong reason.
6. Docs: CHANGELOG wording true to what you measured (both CHANGELOGs), plain words; architecture.md note accurate.

## 2. Report
Write: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc605-lp-quickadd-draft-on-save/sc605-r3-review-report.md
Opens with a <=10-line executive summary: verdict (LAND-READY | FIX), counts by severity, your gate lines, probe pass/fail count.
Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix for each.
Private scratch folder: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc605-r3-review/

## 3. Return contract
Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, plus the absolute
path of every evidence artifact. STATUS: DONE | NEEDS_CONTEXT (with the question). Report `Follow-ups:` (left alone).
If the report-file write is blocked by your harness, return the report inline.
