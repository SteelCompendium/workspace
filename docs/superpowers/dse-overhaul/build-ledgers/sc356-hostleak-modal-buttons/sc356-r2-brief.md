# SC-356 round 2 — implement Scott's A30 ruling, rebase, full battery

## 1. Context loading
- Read FIRST the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-decisions.md` (Scott's ruling + dispatcher context at the bottom), then your own `sc356-r1-impl-report.md` (Round 1 + 1b) in the same dir, and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons`; dse clone `…/draw-steel-elements`, branch `sc356-hostleak-modal-buttons`, head `9f1cf8e` on base `ba20072`.
- Use `git -C <absolute path>` for every git command. Never edit under `/home/scott/code/steelCompendium/workspace/` (shared main checkout) — except writing your report into the ledger dir. Workspace-level files you edit live in YOUR worktree's superproject (`/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons/...`).
- You never call the tracker.

## 2. Tasks, in order
1. **Rebase.** `git -C <dse> fetch origin`; confirm `origin/develop` is `772c3cd` (if it moved further, rebase onto the new tip and report it). Rebase the branch onto it. Since the base, SC-468 and SC-474 changed Conditions-modal focus and click handling (e2e COND-E02..E06) — re-check that every modal-pass scenario still opens the right modal and finds its expected controls; adapt the scenario drivers, not the product code. `npm ci` if package.json's obsidian version changed.
   Also fast-forward the worktree SUPERPROJECT so its docs are current: `git -C /home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons fetch origin` then `git -c submodule.recurse=false -C <wt superproject> merge --ff-only origin/main`. Do NOT run `git submodule update`. Afterwards verify the dse clone is still on branch `sc356-hostleak-modal-buttons` at your rebased head.
2. **Implement A30.** Scott's ruling, verbatim from the ledger: "A30". The option he picked read, verbatim:
   > **A30: plugin look, 30px tall (recommended).** Same fill and labels as A, but the chips keep today's 30px height. Nothing gets harder to tap. On a phone, today's chips are 40px tall; I would keep that by following Obsidian's control height rather than fixing 30px.
   So: start from `evidence-r1/sc356-protoA30.patch`, but the height must FOLLOW Obsidian's control height (find the variable Obsidian's `button` height uses — e.g. `--input-height` — in the pinned host copy / asar app.css, and how it becomes 40px on phones), with a fallback so the Playwright sweep's with-vs-without-host comparison stays invariant. No harness-only literals in product CSS beyond a var() fallback. All three chip kinds (`.dse-optchip` duration/effect, `.dse-cond-icons__choice`, `.dse-mt__sheet-resultchip`), idle and pressed, dark and light. Fill and idle ink = the plugin tokens prototype A used. Pressed ink and the teal-cyan selected outline unchanged. Follow the repo's token conventions (token-coverage test, D3-token-map) if you add a token. Add a jsdom/unit pin following the SC-205 / SC-338 / SC-366 precedent.
3. **Swatch allowlist** (`9f1cf8e`) stays as is. SC-361 (swatch focus ring, same modal) is in flight concurrently; whichever lands second reconciles. If I tell you SC-361 landed, rebase and remove/narrow the entry.
4. **Prove it.** The modal pass is green with the A30 fix, the allowlisted count still printed. Re-run your injected-regression proof against the final CSS (drop one pinned property → FAIL line → restore).
5. **Real-Obsidian evidence** (camera on a PRIVATE Xvfb + port, never `:1`; camera code edits stay uncommitted and reverted, as in r1b): Conditions modal (editor open) and Log-action form, dark and light, final CSS. Measure chip heights/fill/idle ink per kind and confirm they match r1b's A30 row (30px, fill rgb(26,30,33)/rgb(246,248,248), idle ink rgba(220,226,230,.62)/rgb(85,89,96)). Then prove the PHONE height: in real Obsidian with mobile emulation (e.g. `app.emulateMobile(true)`) or, if the camera cannot do that, by the resolved computed value under Obsidian's phone class in the real app — chips should be 40px there. Save one side-by-side PNG per modal × scheme ("r1b A30" vs "final"), native resolution, under `evidence-r2/` in the ledger dir, plus a phone crop if you got one.
6. **Docs, in YOUR worktree superproject:**
   - `.claude/skills/dse-verify/SKILL.md`: update the "Button host-leak sweep" bullet with the modal-pass expected line, the SC-361 allowlist boundary, and correct "12-record exemption boundary" to the measured number. Do NOT edit the CURRENT block.
   - `CHANGELOG.md` `## Unreleased`: one user-facing bullet (the option chips in the Conditions modal and Log-action form now use the plugin's own fill and text color, keeping their height).
   - `DESIGN.md`: if its component map covers option chips / `.dse-optchip`, update it; otherwise leave it.
   Commit these in the worktree superproject (no submodule pointer bump — landing does that).
7. Commit in the dse clone after every coherent step.

## 3. Gates — full dse-verify battery at your final head, in order
Expected at base `772c3cd`: tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5536 passed / 1 skipped / 233 of 234 suites** + your new tests · lifecycle **31/31** · e2e **89/93 ok, 0 failed, 4 known-bug, coverage 64/64** (COND-E02..E06 must pass) · shots **580**, 0 FAIL, gallery host-leak line + new modal host-leak line both OK · freeze **`freeze OK (280/280 …)`** (chips are screen-only; must not move) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Lifecycle and e2e are REQUIRED. If you add a lifecycle scenario, its id is G-S25.

## 4. Footguns (all apply — adapter §8 footguns 1, 9, 10, 11, 12, 13)
- Devbox: `devbox run -c <abs dse path> -- bash <script-file>`. Never `cd` inside a compound command. Record exit codes from a script FILE run through devbox, and read each gate's summary line; `bash -c '…; echo rc=$?'` under devbox always records 0. No `| tail` on gates.
- Scratch: shared session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/`. Use a NEW private subfolder `sc356-r2-impl-<random suffix>/`, uniquely named scripts/logs. Write scratch files with the Write tool, not heredocs. No glob `rm` anywhere — delete only exact paths you created.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (≤600000ms per call; split calls). Never background a gate and wait for a notification.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line contains `worktrees/sc356-hostleak-modal-buttons/`.
- Never `rm -rf` `/tmp/dse-obsidian-lifecycle-*` or `.superpowers/`; never touch `.superpowers/sdd/freeze-baseline.sha256`. If freeze moves, STOP and report.
- Main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected.
- Never tag/release/push; never `just wt-finish`/`deploy*`.
- You cannot `SendMessage` me — `to: 'main'` reaches the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, first word `SC-356:`.

## 5. Report
Write a NEW file `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-r2-impl-report.md`, opening with a ≤10-line executive summary. If the write is blocked by your harness, return the report inline.

## 6. Return contract
Final text to the ticket-owner, raw facts: STATUS, rebased dse head sha + commit list, superproject doc commit sha(s), every gate's summary line verbatim, the real-Obsidian measurement table (desktop + phone), the injected-regression FAIL line, `Drive-by fixes:` / `Follow-ups:`, absolute paths of every evidence artifact.
