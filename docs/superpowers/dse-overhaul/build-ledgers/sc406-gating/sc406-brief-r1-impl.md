# SC-406 round 1 — implementer brief

## 1. Context loading (read first)
- Ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/decisions.md — Scott's rulings verbatim. It is the spec. Read it in full.
- Audit doc (background): `docs/superpowers/dse-7.0.0-release-audit.md` §1, §9, §13 in the DSE repo.
- dse repo AGENTS.md / CLAUDE.md in your worktree's draw-steel-elements.
- Gate skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md — the battery, command shapes, freeze/parity rules. Read it before running anything.
- Workers NEVER call the tracker (Linear) — not to read history, not to post. Everything you need is in files.

Worktree: /home/scott/code/steelCompendium/worktrees/sc406-gating — repo you edit: `draw-steel-elements/` there, branch `sc406-gating`, cut from origin/develop `f8693b5`. Verify `pwd` before any write. Never write under /home/scott/code/steelCompendium/workspace/ (the shared main checkout) except your report files in the ledger dir. Any workspace-level file (e.g. a superproject doc) lives in YOUR worktree's superproject at /home/scott/code/steelCompendium/worktrees/sc406-gating/<file>, never under workspace/.
First: `git -C /home/scott/code/steelCompendium/worktrees/sc406-gating/draw-steel-elements fetch origin` and confirm origin/develop is still `f8693b5`; if it moved, rebase onto it and note the new sha.
Use `git -C <absolute path>` for EVERY git command — never `cd X; git …` (a failed cd once ran a hard reset in the shared main checkout).
Commit after every coherent step; nothing sits uncommitted through a gate.

## 2. The task
Implement SC-406 exactly as the ledger's "2026-10-16 — the ticket description" quote says. Quoted here verbatim from the ledger:

> One undocumented boolean in the plugin's `data.json`, `"experimental": true` (absent = off), read once at load like the existing `viewAdoption` kill switch. Not in the Settings UI, not in `DEFAULT_SETTINGS`. When off:
>
> * Deferred elements (`ds-encounter`, `ds-project`, `ds-party`, `ds-conditions`, `ds-resource`, `ds-surges`, `ds-tokens`, `ds-roll`, `ds-hero`) are `hidden: true` (already removes them from `/ds`, Insert commands and docs) **and** the pipeline renders a small inert "not available in this release" card for them instead of the element. Today `hidden` only hides discovery; the block still renders fully (SC-190).
> * The sidebar is not registered: no `ItemView`, ribbon icon, `open-dse-sidebar` / `send-block-to-sidebar` / `send-initiative-to-sidebar` commands, or "Pin/Unpin from sidebar" chrome items.
> * The `authoringControls` and `printPreview` descriptors are not in the catalog (the Authoring page disappears; the Appearance page loses the Print preview row; per-block `prefs:` overrides naming them are rejected with the existing console warning).
> * The legacy command alias `download-data-md-dse` ("Sync compendium (legacy alias)") is removed outright, not gated — Scott: a bound hotkey going silent is acceptable; keeping two sync entries is confusing. One line in `migrating-to-7.md`.
>
> When on: everything above is exactly as it is today. Tests and the visual harness set it on so no fixture or gate moves; add a unit test per gated surface for the off state.
>
> Explicitly NOT gated (ships in 7.0.0): `ds-scc`, `ds-montage`, rolling on ability cards (`rollingEnabled` / `rollerEngine` / `rollClickToRoll`), the three text-scale prefs (SC-372 is fixed for 7.0.0 instead), the `@media print` layout itself, all 6.0.2 elements.

Owner rulings (also in the ledger) that bind this round:
- The placeholder card must never write to the note (no write-back, no state mint, no anchor id). Note bytes must be unchanged after opening a deferred block with the switch off. Add a test that proves it.
- The Conditions manager modal reached from the initiative tracker is NOT gated. Gating `ds-conditions` must not touch it.
- Sidebar-adjacent settings rows or other leftovers the ticket does not name: do NOT gate them; list them under Follow-ups.

Design notes / things to find out and report (do not guess silently):
- Where `viewAdoption` is read, and mirror that pattern for `experimental` (read once at load; a single source of truth other modules query). No Settings UI row, not in DEFAULT_SETTINGS — make sure a settings save does not strip or add the key (round-trip it untouched).
- How `hidden` flows today to `/ds`, Insert commands, and any build-time docs. Build-time docs have no data.json, so they see the off state — confirm deferred elements are excluded there and report what changed.
- Placeholder card: small, inert, styled with existing tokens (no new hue meaning anything on its own — Scott is colorblind). Text names the block and says it is not available in this release, e.g. "`ds-encounter` is not available in this release." No buttons, no links. The original fenced source must stay untouched.
- Saved workspaces that contain a sidebar leaf (beta users who had it open) — find out what Obsidian shows when the view type is not registered, and report it. Don't build handling for it unless it is trivial and obviously correct; otherwise Follow-up.
- `send-initiative-to-sidebar` / Pin-Unpin chrome on initiative and other shipping blocks must vanish when off.
- Lifecycle harness (`npm run obsidian-lifecycle`) uses a scratch vault — it must run with `experimental: true` in that vault's data.json so its sidebar scenarios still pass. Visual harness and jest: experimental on by default; off-state tests opt out explicitly.
- `migrating-to-7.md`: one line about the removed legacy alias. If the dse repo keeps a CHANGELOG with an Unreleased section, add a bullet there per its convention (check the repo's AGENTS.md); do not touch the workspace CHANGELOG.

Evidence for Scott (outside the frozen set — do NOT add frozen shots, do NOT touch `.superpowers/sdd/freeze-baseline.sha256`):
- Screenshots of the placeholder card with the switch off, dark and light theme. Real Obsidian preferred (the lifecycle/obsidian tooling runs its own Xvfb, never `:1`); harness capture acceptable if real Obsidian is impractical — say which. Also one shot of the Settings Appearance page with the switch off (no Print preview row, no Authoring page). Save under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/evidence-r1/ with descriptive names.

## 3. Gates — full dse-verify battery, in order (tsc → lint → jest → lifecycle → shots → freeze → parity)
Expected numbers at dispatch (develop `9ad919d`/`f8693b5`, from dse-verify "Current expected numbers"):
- tsc / lint clean
- jest **4367 passed / 1 skipped / 215 of 216 suites** + your new off-state tests (report the new totals and the delta)
- lifecycle **25/25**
- shots **568**, 0 FAIL (in-run gates as listed in dse-verify)
- freeze **`freeze OK (274/274 …)`** — must not move. If any frozen byte moves, STOP and report it; do not rebaseline.
- parity **0 GAPs / 0 undeclared / 24 DECLARED**
Known flake: `sidebarInitiative` "SC-288 r2" ~3% (SC-383) — re-run once if it alone goes red; report it.
Devbox: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc406-gating/draw-steel-elements && <cmd> > <logfile> 2>&1; echo rc=$? >> <logfile>'`. Devbox eats `$?`/PIPESTATUS and piping (`| tail`) eats failures — run each gate with output redirected to a per-run unique log file, then read the file. `npm ci` first if node_modules is missing or package.json's obsidian version differs.
Never `pkill`/`killall` by pattern — other worktrees run the same gate commands. Kill only by PID whose command line contains `worktrees/sc406-gating/` (`pgrep -af "worktrees/sc406-gating/"`).
Never `rm -rf` anything under `.superpowers/` except your own `sc406-gating/` subpaths.

## 4. Report
Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc406-gating/sc406-r1-impl-report.md. It must OPEN with a ≤10-line executive summary (verdict, final sha, gate numbers). Then: files changed with one line each; per-gated-surface test names; the design findings asked for above; `Drive-by fixes:` and `Follow-ups:` lists. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts only — verdict, branch + final sha, measured gate numbers, plus the absolute path of every evidence artifact (screenshots, gate logs, the report). No prose.

Footguns:
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (Bash timeout up to 600000 ms; split if needed). Do not end your turn "waiting for a notification" — a job you started will not wake you.
- You cannot SendMessage me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you ever send a message anyway, its FIRST WORD must be `SC-406:`.
