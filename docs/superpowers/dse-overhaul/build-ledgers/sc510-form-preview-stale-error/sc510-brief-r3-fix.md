# SC-510 r3 brief — fix round (implementer A, author of r1)

Your final text goes to the ticket-owner, not a human. Shell rules, scratch rules, gate order, report format and return contract are exactly as in your r1 brief (`sc510-brief-r1-impl.md`, §4–§6) — reread §4 before running anything. Use scratch subfolder `.../scratchpad/sc510-r3-impl-<random suffix>/`. Name every gate log you write into the ledger dir `sc510-r3-*.log` (do not reuse r1's generic names). You never call the tracker.

## Context
- Ledger (read the r2 rulings): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-decisions.md`.
- Review report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-r2-review-report.md` (LOW-1, INFO-2; its candidate C2 log `sc510-r2-candprobe-C2.log`).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc510-form-preview-stale-error`, dse branch at be35c6a on 253aa5f, superproject dca5433 on 104dd85.

## Step 1 — rebase first
- dse: `git -C <dse path> fetch origin`, rebase onto **origin/develop f89f69f** (or newer — say which). Reviewer measured 0 conflicts. SC-512 changed `visual-harness/entry.ts` + `shoot.mjs` only; if `package.json`/lockfile changed, `npm ci`.
- superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc510-form-preview-stale-error fetch origin`, rebase the CHANGELOG commit onto **origin/main** (record its sha). If CHANGELOG conflicts, keep both bullets. Do not bump the dse pointer.

## Step 2 — fold (rulings quoted from the ledger)
- LOW-1: "FOLD. Reviewer's fix verbatim: \"one assertion in the test's `createView` wrapper that `cx.host.containerEl` is the mounted slot inside `.dse-form__preview`.\"" Confirm mutant M2 (host `containerEl` left as `previewEl`) now fails.
- INFO-2 / FU-2: "FOLD reviewer's C2 — the preview shows the same error card the real card shows for that body. Only the CURRENT slot's rejection may touch `.dse-form__preview` (badge); a stale slot's rejection draws only into its own detached slot. Prefer a pure-move extraction of `renderErrorCard` out of pipeline.ts (re-exported from pipeline so callers are unchanged) over a new pipeline<->FormModal import cycle, if it is a pure move; otherwise import from `@/framework/pipeline` and say why."
  - Reviewer's C2 shape: `.catch((error: unknown) => renderErrorCard(slot, this.def, error))`.
  - Badge: when the current slot rejects, decide from what the card shows — an error card in the preview must not have the Read-only badge covering its text (the SC-493 MEDIUM-1 lesson). Report what you chose and why.
  - Tests (red first against be35c6a's FormModal, then green): feature (`# only a comment` referenced block) and statblock (`features: {a: 1}`) previews show the same "failed to render" text the real card shows; still 0 unhandled rejections; a stale slot's rejection arriving after a newer valid preview leaves the newer preview untouched (badge included); badge state on the error preview as you chose.
- Out of scope (quoted): "INFO-1 / FU-1 … FILED SC-525 … OUT OF SCOPE." Do not touch `RefUnwrapView.ts` or `view.ts`.
- CHANGELOG: adjust the bullet only if it now under-describes (e.g. the preview shows the block's error instead of going blank).
- Commit per step (rebase, red, fix). No AI/co-author trailers.

## Step 3 — full battery on the rebased tip (dse-verify order)
Expected at f89f69f plus your branch: tsc/lint clean · jest **6078 + 17 + your new tests passed / 1 skipped / 246 of 247 suites** (after shots) · lifecycle **38/38** · e2e `123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` · shots **592**, 0 FAIL (button host-leak line now 114/684 per SC-512 — expected) · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. If shots exceed the tool timeout and get backgrounded, wait on the PID (`tail --pid=<pid> -f /dev/null`) then read its log.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-r3-fix-report.md`, ≤10-line executive summary first (STATUS, rebased shas, new shas, red/green, gate numbers), then extraction-vs-import decision, badge decision, diff stat, `Drive-by fixes:` / `Follow-ups:`. If the write is blocked, return it inline. Final text: raw facts + absolute paths of every artifact. If you need input: `STATUS: NEEDS_CONTEXT` and the question (you cannot message me; any stray message starts `SC-510:`).
