# SC-510 r4 brief — scoped re-review (reviewer B, not the author)

Your final text goes to the ticket-owner, not a human. Shell, scratch and return rules exactly as your r2 brief (`sc510-brief-r2-review.md` §3–§5). Scratch subfolder `.../scratchpad/sc510-r4-review-<random suffix>/`; logs in the ledger dir as `sc510-r4-*.log`. You never call the tracker. Do not commit; restore every probe; tree must end clean at 2d01bd8.

## Scope — the delta only
- Ledger r2 rulings + r3 entry: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-decisions.md`.
- Implementer report: `sc510-r3-fix-report.md` (same dir).
- dse branch now rebased: tip **2d01bd8** on **f89f69f** (7bab707 red, 8cda8a2 pure-move extraction, 2d01bd8 fix; the r1 commits rebased below). Superproject **088bbc9** on origin/main 27f4c8c.

Check:
1. **Rebase fidelity**: `git range-diff 253aa5f..be35c6a f89f69f..<rebased r1 fix sha>` — r1 commits unchanged (`=`).
2. **Pure move**: 8cda8a2 moves `renderErrorCard`, `ElementStageError`, `ErrorStage`, `isValidationResult` to `src/framework/errorCard.ts` byte-for-byte (compare moved bodies; `git diff --color-moved` or a normalized diff). Re-exports keep every existing import working; no import cycle introduced (check `errorCard.ts` imports). The dropped `ValidationResult` import is the only drive-by.
3. **Fix 2d01bd8**: only the current slot's rejection draws the error card and touches the badge; a stale rejection draws nothing. Ruling quoted: "the preview shows the same error card the real card shows for that body. Only the CURRENT slot's rejection may touch `.dse-form__preview` (badge); a stale slot's rejection draws only into its own detached slot." Mutants: drop the current-slot check; draw into `previewEl` instead of the slot; leave the badge on — each must go red.
4. **LOW-1**: the containerEl assertion kills M2 (re-run M2).
5. **Real Obsidian**: feature with a referenced block the element cannot read (`# only a comment`) — the form preview shows the same "Feature: failed to render (render) …" text as the card, no Read-only badge over it, 0 unhandled rejections; then type a valid body — badge returns. One screenshot of the error preview: `sc510-r4-shot-error-preview.png` in the ledger dir. Recheck the r2 `@Ref.md` real-key path still ends on Ref Strike.
6. **Battery**: re-run tsc, lint, jest (expect 6099 / 1 / 246 of 247) and e2e (123/123, 0 known-bug, 87/87) yourself on 2d01bd8; lifecycle/shots/freeze/parity may be taken from A's r3 logs if they are tied to 2d01bd8 by timestamp — say which you re-ran.

Findings by severity with file:line, failure scenario, prescribed fix. Verdict LAND-READY / NOT LAND-READY. Report `sc510-r4-rereview-report.md` with a ≤10-line executive summary first; inline if the write is blocked. Final text: raw facts + absolute paths of every artifact. Need input: `STATUS: NEEDS_CONTEXT` (stray messages start `SC-510:`).
