# SC-460 decisions ledger — stray carriage return above a block drops Reading-view writes

Effort: `sc460-stray-cr` · worktree `/home/scott/code/steelCompendium/worktrees/sc460-stray-cr` · dse branch `sc460-stray-cr` cut from dse `develop` @ `b6b08f3` (SC-455 landed); rebased onto `ab34293` (SC-431), then `71ac43a` (SC-454), then `188755b` (SC-364); develop now `ba20072` (SC-366, CSS link colour + one test; jest base 5260 / 1 skipped / 230 of 231, rest unchanged) — fix round rebases there; per dispatcher 2026-10-20; land-ready must be on the then-current develop.
Owner: ticket-owner (Opus 5.5) · started 2026-10-20.

## Ticket text (verbatim, Linear SC-460, 2026-10-20)

> Found in the SC-453 review. If a note has a lone `\r` (a carriage return without a following newline) anywhere above a DSE block, clicking a control in Reading view does nothing: the file is not changed and no Notice appears. A lone `\r` below the block is fine. Happens on LF and CRLF notes, and on code from before SC-453 (measured in real Obsidian 1.14.4).
>
> Likely cause: Obsidian's section numbering counts a lone `\r` as a line break, so the section's `lineStart` is one line off from DSE's `split('\n')`. `readSection` then can't parse the fence, and `resolveWriteTarget` aborts without a Notice.
>
> Where: `draw-steel-elements/src/framework/host/ReadingModeBlockHost.ts` (`readSection`, `resolveWriteTarget`). SC-453 corrected the code comments that claimed a lone `\r` never separates lines; the behaviour itself is unchanged.
>
> Context: `.superpowers/sdd/sc453-crlf/sc453-review-report.md` (INFO-2; probes P-R3, P-R5, P-R6).

## Scott rulings

(none yet)

## Owner rulings

- 2026-10-20 (owner): **Fix it so the write lands**, not merely add a Notice. The ticket is a defect with one obvious intent (a click must save). Scope:
  1. Measure first, in real Obsidian 1.14.4, on current `develop`: what `getSectionInfo` counts as a line break (lone `\r`, `\r\n`, `\n`; also U+2028/U+2029 / NEL if cheap to probe) in Reading view AND Live Preview, and whether the SC-455 Notice ("unsavable write shows one Notice") now fires for this case or it is still silent.
  2. Map Obsidian's section line numbers onto the file's text using Obsidian's own line-break rule, so `readSection` / `resolveWriteTarget` find the fence. One shared helper, not per-site patches; compose with SC-453 `lineEnding.ts` and SC-455's blockquote-prefix helper, don't duplicate them.
  3. Byte integrity: the lone `\r` itself and every byte outside the written block survive unchanged (LF note, CRLF note, mixed). A lone `\r` INSIDE the block body: decide and document; it must not lose content.
  4. Survey every other locate/write site (sidebar `SidebarBlockHost`, `sidebar/registration.ts` splice, `anchor.ts` find/stamp, Live Preview path) for the same off-by-N; fix in-scope ones with the same helper, report the rest.
  5. No silent failure may remain on this path: if a write still cannot land, the SC-455 one-Notice rule applies.
- Reviewer-ask Scott? No — no taste/decision content. Scott sees the result at land-ready.
- 2026-10-20 (owner), implementer follow-up "a note whose only line breaks are lone `\r` now saves, but the rewritten block uses LF (a lone `\r` casts no vote in `detectEol`)": **fold into the fix round** — small, same helper; a CR-only note must stay CR-only like SC-453's all-CRLF rule.
- Round 1 implementer (Sonnet) head `3045082` on base `188755b`; review → orchestration:reviewer (independent identity).
- 2026-10-20 (owner), implementer follow-up 2 (Obsidian's own editor rewrites lone CRs to LF on any edit): **drop** — Obsidian behaviour, not DSE; already noted in G-S10 comment.
- 2026-10-20 (owner), implementer follow-up 3 (`utils/CodeBlocks.ts` still uses `split('\n')`): **drop** — file deleted by SC-454 (dse `71ac43a`), moot after rebase.
- Workspace CHANGELOG bullet (for landing, dispatcher-applied): "Edits in Reading view now save in notes that contain a stray carriage-return character above the block (SC-460); the sidebar also pins the right block in such notes. Nothing outside the block is changed."
- 2026-10-21 (owner): the R1 review continues against `3045082` on `188755b` (SC-366 is CSS + a theme test, no overlap with host line handling). The fix round rebases onto `ba20072` (or then-current develop) and runs the full final battery there; the scoped re-review checks the rebased head.
- 2026-10-21 (owner), R1 review (Opus) of `3045082`: FIX-REQUIRED, 0C/0H/2M/1L/6I. Rulings: **MEDIUM-1 fix** (as prescribed), **MEDIUM-2 fix** (adopt the reviewer's 5 stale-section tests), **LOW-1 fold** (add a test for the encounter-append line hint), INFO-1..4,6 no action, **INFO-5 filed as SC-471** (Backlog; "Send block to sidebar" hotkey silent on the opening fence line) — out of scope for SC-460.
- 2026-10-21 (owner): fix round 1 (Sonnet implementer) head `84636a9` on `ba20072`; scoped re-review → R1 reviewer (Opus, not an author).
- 2026-10-21 (owner): scoped re-review LAND-READY (0C/0H/0M/0L/3I, no action) at dse `84636a9` on `develop` `ba20072`. Land-ready comment posted; reported land-ready to dispatcher. dse-verify CURRENT update for landing: jest 5329 / 1 skipped / 230 of 231 · lifecycle 28/28 (G-S12) · rest unchanged.
