# SC-457 scoped re-review brief — after fix round 1

You did the r1 review. This is a SCOPED re-review of the fix-round delta only — not a fresh full pass. Final text goes to the ticket-owner.

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc457-fence-space-lang/decisions.md` — read the "Review r1" rulings section (LOW-1/2/3 folded; MEDIUM-1 rebase; INFO items filed as SC-480/481, out of scope).
- Implementer report: `…/sc457-impl-report.md` — read the updated executive summary and the "Fix round 1" section.
- Heads: see that report (dse expected on `develop` `aaa88b7` (or newer); superproject on current `origin/main`, ONE commit, CHANGELOG only).
- Never call the tracker. Never touch the main checkout. `git -C <abs>` only. No commits, pushes, or leftover probe files (status before == after).

Check:
1. **Rebase correctness.** dse branch sits on `aaa88b7` (or newer); the delta vs your reviewed `bf3a3b4` is only the folded fixes (use `git range-diff c03db7a..bf3a3b4 aaa88b7..<new head>`). Superproject: one commit, diff vs `origin/main` = `CHANGELOG.md` only (no dse-verify SKILL.md).
2. **LOW-1.** Leading-whitespace skip is `[ \t]` only for language identity in `fenceLanguage` and in `anchor.ts` `matchFenceLine`. Confirm no consumer of `rest` changed trailing-whitespace / `info` behaviour (SC-290 round-trip). Re-run your real-Obsidian NBSP / U+3000 / FF / VT probe: none is claimed as `ds-counter`; the NBSP-twin race no longer writes into the NBSP fence. Re-run one space / tab / callout variants: still saves. e2e `noteFences.ts` `typeOf` follows the same rule and `e2eIntegrity` pins it, nothing else in `e2e/` changed beyond that.
3. **LOW-2.** Both CHANGELOG bullets describe the measured trigger correctly.
4. **O10.** `src/authoring/fenceScan.ts` no longer defines its own `fenceLanguage`; it imports the one from `src/framework/host/blockPrefix.ts` (grep: exactly one definition in `src/`). The SC-476 autocomplete tests still pass, and NBSP before the name gives no autocomplete type.
4b. **LOW-3.** "(29 total)" gone; header follows the no-fixed-totals rule on main.
5. Battery at the new head. Run tsc (incl. `-p e2e`), lint, jest, lifecycle, e2e yourself; take shots/freeze/parity from the implementer's run4 logs unless the delta touches rendering code (then re-run them too). Expected: jest 5399 + branch tests / 1 skipped / 232 of 233 · lifecycle 29/29 · e2e `88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` · shots 572 / 0 FAIL · freeze 276/276 · parity 0/0/24.

Footguns: devbox wrapping (`devbox run -c <dse abs> -- bash -c 'cd <dse abs> && …'`), gates via wrapper script FILES logging output + rc to files; `rm -f main.js styles.css` before jest; own `DSE_LIFECYCLE_PORT` 9400–9499; scratch ONLY `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-r2-<yourAgentId>/` with unique names; never `pkill` by pattern (PID with `worktrees/sc457-fence-space-lang/` only); never `rm -rf` a shared `/tmp` glob or `.superpowers/`; never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match; run gates in the foreground with output redirected to files (600s stream watchdog); if the report-file write is blocked, return inline.

Report: `…/sc457-fence-space-lang/sc457-rereview-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX-FIRST, shas, findings by severity, gate numbers). Return raw facts + absolute paths of every evidence artifact. You cannot SendMessage me; if you need input end with STATUS: NEEDS_CONTEXT. If you ever message anyway, first word `SC-457:`.
