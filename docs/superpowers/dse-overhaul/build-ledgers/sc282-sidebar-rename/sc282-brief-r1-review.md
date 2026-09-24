# SC-282 round 1 — independent adversarial review brief

## 1. Context loading

- Ledger (your spec): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/decisions.md`
- Implementation report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/sc282-r1-impl-report.md`
  (and its `sc282-r1-*.log` gate logs) and the implementer brief `sc282-brief-r1-impl.md` in the same dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc282-sidebar-rename/draw-steel-elements`,
  branch `sc282-sidebar-rename`, head `72e9cdb`, based on `origin/develop` `c524fd2`.
  Review the diff `c524fd2..72e9cdb`. Verify `pwd` before any command. You may add scratch
  probe tests locally but **do not commit anything** and leave the tree clean when you finish
  (`git status` clean; `git stash`/delete your probe files).
- **You never call the tracker (Linear).**
- Gate mechanics: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## 2. The task

Adversarially review the SC-282 change: the DSE sidebar must follow a pinned note's rename and
drop panels whose note is deleted (owner decisions D1–D3 in the ledger, quote them against the
code). **Execute and probe, don't just read.** At minimum, probe with scratch jest tests or the
real-Obsidian lifecycle harness:

- Rename note; rename parent folder; nested folder; rename to a path in another folder; a sibling
  sharing a string prefix (`Foo/Bar` vs `Foo/BarBaz.md`) must be untouched; rename A→B then B→A.
- Delete note; delete parent folder; delete an unrelated file.
- Two panels on one note (two blocks, and the same block's dedup); two sidebar leaves.
- Panel with a live stateful block (e.g. encounter/combat) — does rename re-render destroy state
  a normal re-render wouldn't? Does anything write into the user's note? (It must not.)
- Listener teardown on plugin unload / view close — no leak, no double registration after
  re-opening the sidebar several times.
- Persistence: after rename, is the new path what a layout save serializes (restart survives)?
  Deferred (not-yet-loaded) sidebar leaves: what happens, and is the implementer's handling or
  follow-up claim correct?
- Race: rename while a panel is mid-render / mid-async bind.
- **Write-back after rename (key probe).** The implementer chose NOT to re-render on rename —
  it rewrites `SidebarPanelState.filePath`, the header link, and `SidebarBlockHost`'s backing
  `TFile` in place. Any element inside the panel that captured the old path at mount (e.g. a
  `sourcePath`, a `MarkdownPostProcessorContext`, a closure over the old path/TFile, an
  anchor lookup, the SC-343 stale-write guard) could now write to the old path (creating a
  ghost file), fail, or write to the wrong note. Probe: pin a persisting element (counter /
  encounter), rename the note, then trigger a state change in the panel — assert the write
  lands in the renamed note, no file appears at the old path, and content outside the block
  survives. Then edit the renamed note directly and confirm the panel still tracks it.
- **Deferred leaves (the implementer's one follow-up).** Assess how common the case is in
  practice (a DSE sidebar leaf that is a background tab in the right sidebar at startup — is
  it deferred until revealed?) and whether a cheap fix exists that doesn't force-load, e.g. a
  plugin-level listener keeping a rename/delete map that a deferred leaf applies in its
  `setState` when it later loads (same session), or `getViewState()`-based patching. Give a
  recommendation: fold into a fix round (with a sketch and size) or file separately.
- Re-run the gates yourself (at least tsc, lint, jest, freeze, parity) and compare with the
  implementer's numbers. Expected at base: jest = the implementer's measured c524fd2 base count
  (+ the new tests); freeze 260/260; parity 0 / 0 / 16 declared; lifecycle 6/6 (or +1 if added).
  Known flake: `sidebarEncounterHandoff.test.ts` (SC-352).

Also judge test quality: would the new tests fail if the listener were removed (mutate the code
locally, run them, restore)? A vacuous suite is a finding.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/sc282-r1-review-report.md`,
opening with a ≤10-line executive summary (verdict: LAND / FIX-FIRST). Findings by severity
(BLOCKER / HIGH / MEDIUM / LOW / INFO) each with file:line, a failure scenario, and a prescribed
fix. List the probes you ran and their results. Logs as `sc282-r1-review-*.log` in the same dir.

## 4. Return contract

Final text goes to the ticket-owner: verdict, finding count by severity, measured gate numbers,
paths of every artifact. No prose.

Footguns:
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents (stale logs from other branches
  match). Read the process's own output or use a per-run unique path.
- Redirect long output to files; run gates in the FOREGROUND — never background a gate and wait.
- Devbox eats exit codes: `devbox run -- bash -c 'cd /abs && <cmd>' > /abs/log 2>&1`, gate last,
  never piped to `tail`.
- lifecycle harness: private Xvfb only, never `:1`.
- You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT and the question.
  Any message you do send must start with `SC-282:`.
- Never delete anything in `.superpowers/` except your own `sc282-*` files.
