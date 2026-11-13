# SC-608 r4 — fix round (implementer, resumed or fresh)

Final text goes to the ticket-owner: raw facts, no prose padding.

## Context

- Ledger (binding; read the "Owner rulings on r3" section): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/decisions.md`
- Review findings (verbatim source, §LOW and I7): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/sc608-r3-review-report.md` lines ~41-71. Reviewer probe specs you may borrow (never commit them; copy what you need): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r3-review/zr-probe608.e2e.ts.txt`, `zr-extra608.e2e.ts.txt`.
- Your r2 report: `sc608-r2-impl-report.md` (same dir).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc608-outside-edit-tracker-window`; dse branch HEAD `9761eceb` on `d984b115` (bases unchanged: dse origin/develop `d984b115`, workspace origin/main `298a4ef9` — `git -C … fetch origin` and confirm; if either moved, rebase and say so). Superproject `21aa20e4`. **You never call the tracker.**

## Fixes (owner rulings, quoted from the ledger)

- **L1:** "FOLD — reviewer's fix (compare against last loaded/written disk content, not the live model) + jest S08."
- **L2:** "FOLD — reviewer's safe fallback (tracker count in scope changed → Notice, no focus move) + jest case."
- **L3:** "FOLD, bounded — keep the claim alive for a short settle period after first success (SC-505 `SETTLE_MS` pattern), re-claiming only while focus is on BODY or the dead root. If it needs > ~40 source lines or edits SC-505's code, stop and report instead; owner then files it."
- **L4:** "FOLD — the window closed because of an outside edit, so per the Notice ruling it gets the Notice AND the focus hand-off. Decouple focus from the content check; decide "outside vs own write" by raw block text vs what the tracker last loaded/wrote (may share L1's disk-content record). Sidebar keeps its L1 rule (stays open when the model is unchanged)."
- **L5:** "FOLD — jest O18."
- **I7:** "FOLD — register the cancel so plugin unload cancels it."

Out of scope: SC-384 (LP own-save closes the Conditions window, review I4) — do not chase it. Do not edit `model.ts`, `ConditionsModal.ts`, `src/framework/view.ts`, `pipeline.ts`, `livePreviewFocusCarry.ts` (SC-605 is running on the last three); keep `src/elements/initiative/view.ts` hunks out of SC-605's regions (type guard ~line 127; `carryState`/`receiveCarriedState` between `captureQuickAddDraft()` and `onMount()`).

Each fix: a jest case red without it (show it), and an e2e spec where the reviewer reproduced it in real Obsidian (L1 sidebar ZR-28 "out", L2 ZX-01, L3 ZR-22, L4 ZR-26) — fold into `e2e/specs/initiative/outside-edit-window.e2e.ts`. Never a bracketed ticket id in a test title. Commit per fix. Update the CHANGELOG bullets only if the user-visible statement changes.

## Gates (dse-verify, `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`)

Full battery on the final HEAD: tsc, lint, jest (11617 + your tests fresh / 2 skipped; warm 1 skipped), lifecycle 61/61 in SIX separate foreground `--only=` parts (`G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` 9; `G-S57,G-S62,G-S61,G-S56` 4; `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` 7; `G-S92,G-S96,G-S97,G-S99` 4; parts 1–2 id lists from the skill; G-S91 known flake SC-616 — re-run that part once if it alone fails), e2e `N/N+3 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (or Y/Y if you add pairs), shots 592 / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze 280/280, parity 0/0/24 (or carry on byte-identical styles.css if the skill allows — give both sha256s). After any rebase, re-run everything the rebase could touch.

Superproject must end on current workspace origin/main with ONE pointer bump commit (amend/redo `21aa20e4` to point at the new dse HEAD; one CHANGELOG + bump commit).

## Rules (all footguns from your r2 brief still apply)

`git -C <abs>` only; `devbox run -c <abs dse path> -- …`, no `cd` in compound commands; exit codes from a script file; private scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r4-fix/` (Write tool, unique names); never `rm -rf` a glob, no `rm` with a variable target; never `pkill` by pattern (PID with `readlink /proc/<pid>/cwd` in your worktree only); each gate ONE blocking foreground call, output to a log file, no background jobs/Monitor; never key a wait on a scratch filename; never edit the main checkout (its dse vault dirt is Scott's); never push/tag/deploy/wt-finish/wt-rm. You cannot SendMessage me: return `STATUS: NEEDS_CONTEXT` with the question; any stray message starts `SC-608:`.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/sc608-r4-fix-report.md`, opening with a ≤10-line executive summary (verdict, per-fix commit shas, dse HEAD, superproject sha + its origin/main parent, every gate number, red-without-fix proof per fix, L3 line count). Then `Drive-by fixes:` / `Follow-ups:`. If the write is blocked, return it inline. Final text: STATUS, summary, absolute paths of every artifact.
