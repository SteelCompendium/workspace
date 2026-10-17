# SC-407 r1 implementer brief — prune DSE 7.0.0 docs/CHANGELOG/README to the shipped set

## 1. Context loading (read first)
- Ledger (authoritative, current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc407-docs-prune/decisions.md`. Read ALL of it — Scott's rulings and the owner rulings O1–O5 define the task.
- Ship/defer source of truth: `draw-steel-elements/docs/superpowers/dse-7.0.0-release-audit.md` (in YOUR worktree), esp. §1, §2, §5–§11, §13.
- How the gate works (code, for accuracy): SC-406 landed it; `src/**/experimental.ts` and `.repo-docs/architecture.md` → `experimental.ts`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc407-docs-prune`. DSE repo: `/home/scott/code/steelCompendium/worktrees/sc407-docs-prune/draw-steel-elements`, branch `sc407-docs-prune`, HEAD must be `05a6ff3` (= origin/develop). Before any write: `git -C <dse> fetch origin` and confirm `git -C <dse> rev-parse origin/develop` is still `05a6ff3e02729636436f55132d1160058f9dc0ab`; if it moved, rebase onto it and note it.
- Verify `pwd`/paths before every write. NEVER write under `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir. Every workspace-level or DSE file you edit lives under `/home/scott/code/steelCompendium/worktrees/sc407-docs-prune/`.
- Use `git -C <absolute path>` for every git command — never `cd X; git …`.
- **Workers never call the tracker** (Linear) — not to read history, not to post.

## 2. Task
Scott's ticket, verbatim (from the ledger):

> Every deferred item in `draw-steel-elements/docs/superpowers/dse-7.0.0-release-audit.md` has a docs footprint that must go (or read "coming in a later release") before the release:
>
> * `docs/index.md` element catalog, `README.md`, `docs/getting-started.md`
> * `docs/migrating-to-7.md` "What's new at a glance" (hero trackers, Director's trackers, sidebar, edit pencil)
> * `docs/gm-trackers.md` → becomes a montage-only page (encounter/project/party out; montage's "pin to the sidebar" prose out)
> * `docs/hero-suite.md` → Stamina pointer only (conditions/resource/surges/tokens out)
> * `docs/Roll.md` out; `docs/Features.md` § "Rolling on ability cards" stays
> * sidebar sections in `initiative-tracker.md`, `running-an-encounter.md`, `writing-blocks.md`, `advanced-usage.md`; `common-element-fields.md` § menu loses the pencil bullet
> * `docs/settings.md`: Authoring page, Print preview row, and the per-block override table rows for `printPreview`
> * `docs/canvas-character-sheet.md` stays
> * `CHANGELOG.md` `## 7.0.0 (unreleased)`: pull or re-word the FEATURE bullets for deferred items (hero trackers, Director's trackers other than montage, sidebar, ds-roll, form editor, print preview), then date the header at release
> * `npm run docs-shots` after the prune; SC-388 negotiation.gif is the one hand-recorded asset; `visual-harness/docs-manifest.mjs` entries for removed images go too
> * `AGENTS.md` / `.repo-docs/` "22 registered elements" wording → describe the experimental switch

Apply owner rulings O1–O5 from the ledger exactly (quoted there; do not reinterpret). In short-form pointers only: O1 remove, no teasers, one placeholder-card note in migrating-to-7.md; O2 restore map in audit §11; O3 docs-shots captures with the switch OFF; O4 CHANGELOG pull/re-word, header stays unreleased; O5 no broken links/nav.

Also in scope:
- The list above is a floor, not a ceiling: grep the whole user-facing doc set (`README.md`, `docs/**/*.md` excluding `docs/superpowers/`, `mkdocs.yml` nav, `CHANGELOG.md` 7.0.0 section) for every deferred surface: the nine deferred element names and their aliases (find aliases in the registry), "sidebar", "Pin to sidebar"/"send to sidebar", the edit pencil / form editor / Authoring / `authoringControls`, `printPreview` / "Print preview", `ds-roll`. Prune every hit that documents a deferred surface. Do NOT remove: rolling on ability cards, montage, `ds-scc`, text-scale prefs, the print layout itself (printing works; only the preview toggle is hidden), the Conditions manager modal reached from the initiative tracker, the 6.0.2 elements.
- Images: remove from `docs/Media` and from `visual-harness/docs-manifest.mjs` every image that only depicts a deferred surface (the SC-406 reviewer named at least: `encounter.png`, `party.png`, `roll.png`, `surges.png`, sidebar.png, `tutorial-print-preview.png`, and the Authoring page in `settings-index.png` — that last one is regenerated, not removed). Never touch `negotiation.gif` (hand-recorded, SC-388).
- O3 harness change: smallest change so `npm run docs-shots` captures Obsidian docs images with the `experimental` switch off; `obsidian-shots` and every gate keep it ON exactly as today. Then run `npm run docs-shots` and commit the regenerated `docs/Media`. Afterwards look at `settings-index.png` and any regenerated image showing a block menu: no Authoring page, no Pin-to-sidebar item, no pencil. Note in the report which images changed.
- After docs-shots, confirm the main/your repo-root `data.json` is byte-identical to before (SC-406 MEDIUM-3 fixed this; verify, do not assume).
- `AGENTS.md` / `.repo-docs/`: replace "22 registered elements"-style wording with an accurate description of the switch (what it gates, where it is read, that it is undocumented for users and absent = off). Developer docs only.
- Commit after every coherent step (one commit per area is fine: pages, CHANGELOG, README/index, harness, Media, dev docs, audit restore map). Conventional commit messages with `(SC-407)`. No co-author or AI attribution trailers.

Report as `Drive-by fixes:` anything obviously correct and local you fixed in a file you were already touching; report as `Follow-ups:` anything you left alone.

## 3. Gates (dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — read it for command shapes)
Run the full battery in order on your final commit. Expected (SC-406 landed baseline on `05a6ff3`; a docs change should move NONE of them):
- tsc clean, lint clean
- jest **4429 passed / 1 skipped / 218 of 219 suites** (if a test reads docs — e.g. catalogs pages per element — and goes red because a page was removed, STOP and report it as NEEDS_CONTEXT rather than editing the test)
- lifecycle **25/25**
- shots **568 PNGs, 0 FAIL**
- freeze **`freeze OK (274/274 …)`**
- parity **0 GAPs / 0 undeclared / 24 DECLARED**, exit 0 (last)
Plus:
- `npm run docs-shots` rc=0 (state image count; SC-406 reviewer saw 22 browser + 18 obsidian = 40 before the prune).
- Link check: `mkdocs build --strict` if mkdocs is runnable (try devbox); otherwise a script that resolves every relative `.md`/anchor/image link in `README.md` + `docs/**/*.md` (excluding `docs/superpowers/`) and reports 0 broken. Also confirm `mkdocs.yml` nav lists no removed page.
- Final residual grep (the deferred-surface grep above) with its output in the report, each remaining hit justified.

## 4. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc407-docs-prune/sc407-r1-impl-report.md`. It must open with a ≤10-line executive summary (verdict, final sha, gate numbers). Then: commits list, files removed, files edited (one line each), images removed/regenerated, harness diff summary, residual grep, Drive-by fixes, Follow-ups. Logs go under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc407-docs-prune/r1-logs/`.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts (STATUS: DONE | NEEDS_CONTEXT | BLOCKED, final sha, measured gate numbers), no prose, plus the filesystem path of every evidence artifact (report, logs, the 1–2 images that best show the settings page and a block menu after the prune).

## Footguns
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (Bash timeout up to 600000); never background a gate and wait for a notification — it will not come.
- Devbox: `devbox run -- bash -c 'cd <abs dse path> && <cmd> > <abs log> 2>&1'`; devbox's sh wrapper eats `$?`/`$PIPESTATUS` and `| tail` eats failures — capture exit codes via a wrapper script file that echoes `rc=$?` into the log.
- Never `pkill`/`killall` by a command pattern; other efforts run the same shots/parity/obsidian commands concurrently. Kill only by PID whose command line contains `worktrees/sc407-docs-prune/` (`pgrep -af "worktrees/sc407-docs-prune/"`).
- Never `rm -rf` the shared `.superpowers/` dir; only write inside `.superpowers/sdd/sc407-docs-prune/`.
- Never create a tag or release on draw-steel-elements. Never push. Never run `just deploy*`, `just wt-finish`, or `just release`.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-407:`.
