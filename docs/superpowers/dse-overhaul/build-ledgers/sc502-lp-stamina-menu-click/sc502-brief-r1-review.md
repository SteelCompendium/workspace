# SC-502 r1 independent review brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc502-lp-stamina-menu-click/decisions.md` — the spec and every ruling. Source of truth.
- Implementer brief: `.../sc502-lp-stamina-menu-click/sc502-brief-r1-impl.md` (sections 4 "Command footguns" apply to you in full — read them; use your own scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc502-r1-review-<4 random chars>/` and lifecycle port 9295).
- Implementer reports: `.../sc502-lp-stamina-menu-click/sc502-r1-impl-report.md` and `sc502-r2-fix-report.md` (r2 folded in the owner rulings of 2026-10-24 — Expand under Obsidian's `</>` button, hover kept across `</>`, docs, clip-path inset).
- Precedent: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc492-stamina-pencil/sc492-r1-review-report.md` INFO-2 (how the bug was first measured in real Obsidian).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc502-lp-stamina-menu-click`, plugin branch `sc502-lp-stamina-menu-click` at `84c903b`, base dse `develop` `c2758a2`. Superproject branch at `b08fbfd`. Review the diff `c2758a2..84c903b` plus the superproject CHANGELOG bullet.
- **Read-only on the branch**: do not commit to it. Probes, temporary bundle variants and base-bundle builds go in your scratch folder or a separate `git worktree add` at an absolute path under your scratch folder.
- **You never call the tracker (Linear).**

## 2. Task — execute and probe, do not just read

1. In real Obsidian Live Preview (headless Xvfb per dse-verify, never `:1`), with real CDP mouse events (`Input.dispatchMouseEvent`, hover then press/release at button centres — not `.click()`):
   - Base `c2758a2` vs branch: stamina-bar pencil (experimental + authoringControls) and Collapse. Branch: pencil opens only the edit form (SC-492 guard intact), Collapse collapses, editor cursor not moved to the line above.
   - At least two other chrome-panel elements the implementer's survey lists, including one it says was NOT affected.
   - The four layout cases in the ledger's SURVEY ruling.
   - Hidden-panel regression: with the panel not revealed, a click on the text of the line above, at the x of each button, still places the CodeMirror cursor there. Also text selection by drag across that line.
   - Reading view: unchanged behaviour.
   - Popout window if cheap.
2. Pixel neutrality: confirm shots and freeze are unchanged (re-run shots + freeze yourself), and check by screenshot in real Obsidian Live Preview that nothing moved (block height, line above, panel position relative to the plate). Expected and ruled in scope: the panel is now VISIBLE on hover in Live Preview (it was clipped invisible on base); the Expand control may have moved in Live Preview only if r2 says so.
3. Test validity: run the new real-mouse test against a base bundle and confirm it FAILs for the right reason; build one control variant with the fix removed and confirm it FAILs. Check the test does not pass vacuously (e.g. panel never revealed, wrong element hit).
4. Owner rulings of 2026-10-24 (ledger): with real mouse in Live Preview, the collapsed one-liner's Expand expands the block; Obsidian's `</>` button still enters the source; moving straight up from below across `</>` to Collapse keeps the panel revealed and Collapse works. Reading-view reveal rule unchanged. Check the `clip-path` inset value against the tallest panel incl. focus ring and any tooltip, and that nothing inside the block that used to be clipped (wide content, scrollers, overflowing tables, statblocks) now spills out of the widget in Live Preview.
5. Re-run the full dse-verify battery on the branch and compare with the implementer's numbers.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc502-lp-stamina-menu-click/sc502-r1-review-report.md`, opening with a **≤10-line executive summary** (verdict LAND / FIX, finding counts by severity, battery numbers). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. If the report-file write is blocked, return the report inline.

## 4. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, finding list (one line each), measured gate numbers — plus the absolute path of every evidence artifact (report, logs, screenshots). You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the first word must be `SC-502:`.
