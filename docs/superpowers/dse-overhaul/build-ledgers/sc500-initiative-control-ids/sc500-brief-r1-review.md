# SC-500 r1 independent review brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc500-initiative-control-ids/sc500-decisions.md`.
- Implementer report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc500-initiative-control-ids/sc500-r1-impl-report.md` (read its summary; verify its claims, do not trust them).
- Background: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc485-initiative-default-keys/sc485-r1-review-report.md` (~lines 60-75).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc500-initiative-control-ids`; plugin `draw-steel-elements/`, branch `sc500-initiative-control-ids`, base `7046eb0`, tip `4f7aba6` (commits 31c1778, 4f7aba6); superproject branch on origin/main `aa57411`, no commits. Review `git -C <plugin path> diff 7046eb0..4f7aba6`. Check `origin/develop` is still `7046eb0` (`git -C <plugin path> fetch origin`); if it moved, say so — do not rebase.
- You never call the tracker. You do not commit fixes; findings only. Leave the worktree clean (revert any probe edits with `git -C <path> checkout -- <file>`; list each probe you made).
- Main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's vault — ignore.

## 2. Task

Ticket text, verbatim:

> **Expected:** give these controls ids (kit `control` option) and `e2e/manifest/` rows, then switch INIT-DEF-E01/E03/E04 to `dse.click`.

Dispatcher scope: control ids + coverage only; **no behaviour change**.

Execute and probe, not just read. Specifically:
1. **No behaviour change**: does adding the `control` option change anything beyond the attribute (event wiring, classes, focus/keyboard handling, aria, the kit adding listeners or tabindex)? Read the kit code path the option takes. Compare rendered DOM before/after for the three controls if feasible.
2. **Ids follow the naming scheme** and any id registry/uniqueness test; no collision with existing ids.
3. **Manifest rows** match the shape and semantics of their neighbours.
4. **E01/E03/E04 still assert as strongly** as before (exact `toEqual` / whole-note `noteText`); `dse.click` truly drives the same element the wdio press did (not a sibling or a different overlay).
5. **The coverage gate actually counts them**: run your own mutant (drop one id or one manifest row) and show e2e/coverage fails; revert.
6. **Other controls left out**: are there sibling controls in the same initiative chrome menu / overlay that are pressed raw elsewhere in e2e and also lack ids? Report as Follow-ups only (do not expand scope).
7. Re-run at least: tsc (incl. `tsc -p e2e`), lint, jest, e2e (full), and shots (host-leak counts — check whether the sweeps enumerate by `data-dse-control` and whether the counts moved and why). Lifecycle/freeze/parity at your discretion; run freeze if shots ran.

Expected numbers (CURRENT @ 7046eb0): jest 6027 / 1 skipped / 243 of 244 (I1 measured; 6026 base + 1 new) · lifecycle 36/36 · e2e 114/114 ok, 0 failed, 0 known-bug, coverage 82/82 (I1 measured; was 79/79) · shots 592, 0 FAIL, button host-leak (113 … 678 …), modal host-leak (10 … 9 … 38 … 228 …), input 164, checkbox 60, expected APP.CSS PIN DRIFT warning · freeze 280/280 · parity 0/0/24.

## Footguns (mandatory)

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc500-initiative-control-ids/draw-steel-elements -- bash <script file>`; never `cd` in a compound command; `git -C <abs path>` always.
- Exit codes from a script FILE (`echo rc=$? > <unique file>` inside it); `bash -c '…; echo rc=$?'` always records 0.
- Each gate ONE blocking foreground Bash call, timeout 600000; lifecycle/e2e/shots separate calls. No `run_in_background`, no Monitor.
- Redirect long output to files; never pipe a gate into `tail`.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc500-review-r1-<your agentId>/`, unique names, create files with the Write tool.
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` shared `/tmp` globs or `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only a PID whose `readlink /proc/<pid>/cwd` is inside this worktree.
- Never key a wait-loop on a scratch filename/contents.
- No tags, releases, deploys, pushes.
- You cannot `SendMessage` me; for input end with `STATUS: NEEDS_CONTEXT`. Any stray message starts with `SC-500:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc500-initiative-control-ids/sc500-r1-review-report.md`, opening with a ≤10-line executive summary (verdict). If the write is blocked, return inline.

## 5. Return contract

Final text goes to the ticket-owner: raw facts — verdict (LAND-READY / FIX NEEDED), findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario and prescribed fix, gate summary lines + rc you measured, mutant result, probes made and reverted, Follow-ups, and absolute paths of every evidence artifact.

## Addendum (owner, after r1)

8. **INIT-DEF-E04 hover precondition.** I1 found E04 failed when run alone (the chrome panel is hover-revealed, opacity 0) and added `dse.hover(root.root)` before the click, plus a new `dse.hover` driver helper. Check: is the hover a legitimate user precondition (a real user must hover to see the chrome), or does it mask a regression? Did the pre-SC-500 raw-wdio E04 have the same order dependence (check out 7046eb0's spec in a scratch `git worktree add` under your private scratch folder and run `--only=INIT-DEF-E04`)? Does the `dse.hover` helper conflict with or duplicate an existing driver helper?
9. **Kit change**: `ChromeMenuItem.control` → `mountChrome` → `iconButton`. Confirm no other chrome consumer changes output when `control` is undefined (no empty `data-dse-control=""` attribute).

Out of scope (filed): SC-516, which covers the ResetEncounterModal Cancel id and the "Reset turns (this round)" id. Do not report these again as findings.
