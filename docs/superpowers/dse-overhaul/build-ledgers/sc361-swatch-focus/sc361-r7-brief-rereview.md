# SC-361 r7 brief: scoped re-review of the r6 reconcile delta (orchestration:reviewer, r3 identity)

SC-356 landed first, at dse develop `ea56712`. The r6 round rebased SC-361 onto it and did three things:
- kept both host re-grounding blocks in `styles-source.css`: SC-356's as "E." and SC-361's relabelled "F.";
- deleted the SC-361 entry from `HOSTLEAK_KNOWN_LEAKS`;
- rebased the superproject onto `origin/main`.

The scope is ONLY that reconcile.

Context:
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/decisions.md`.
- Implementer's report: `…/sc361-r2-impl-report.md`, section "## r6 reconcile round".
- Your earlier r3 and r5 sections: `…/sc361-r3-review-report.md`.

Branch: dse `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/draw-steel-elements`.
- Old head: `d7e83e2` on `54f8f88`.
- New head: `134c0de` on `ea56712`.
- Superproject worktree head: `c9bd011`.

Do not commit to or rebase either branch.

Check:
1. `git range-diff 54f8f88..d7e83e2 ea56712..134c0de`. The SC-361 commits should change only where they meet SC-356. Explain every hunk that differs.
2. **The "E."/"F." blocks.**
   - Both are intact, and nothing from SC-356 was dropped. Diff `ea56712`'s `styles-source.css` against the new head; only SC-361's hunks should appear.
   - No property is pinned twice with conflicting values on `.dse-swatch`.
   - The cascade order still gives the intended computed values. Probe the computed style of an idle, pressed, focused and custom-selected swatch, in dark and light, with and without host CSS.
3. **Allowlist removal.**
   - The shots modal host-leak line is green with no "ALLOWLISTED … SC-361".
   - Re-adding the entry makes the pass fail with "no longer leaks", which proves the pass still checks the swatch.
   - Removing one swatch pin makes the pass fail on the swatch.
4. **Superproject.**
   - The `CHANGELOG.md` commit keeps every bullet from main, including SC-356's.
   - Only `CHANGELOG.md` is in the commit.
5. **Full battery** at `134c0de`. Expected: jest 5614 / 1 skipped / 234 of 235 · lifecycle 31/31 · e2e `96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` · shots 580 / 0 FAIL with `modal button host-leak OK (10 … 9 … 38 … 228 …)` and NO ALLOWLISTED line, `pipette selected look OK`, pressed parity 96, `button host-leak OK (112 … 672)`, both text-scale lines · freeze 280/280 · parity 0/0/24. Also judge the implementer deviation: the ALLOWLISTED summary line is now printed only when the array is non-empty (shoot.mjs) — must not hide a non-empty allowlist..

Report: append "## r7 scoped re-review" to `…/sc361-r3-review-report.md`, opening with a summary of 10 lines or fewer and a verdict of LAND or FIX. Give findings by severity, with file:line and a prescribed fix for each.

Footguns: same as the r3 brief §5.
- Private scratch folder `sc361-r7-rereview-<unique>/`.
- `devbox run -c`; exit codes from a script file.
- Gates as blocking foreground calls. Shots runs longer than 600 s: run it detached, then wait on its PID with a blocking loop and read its own log.
- No glob `rm`, no pattern `pkill`, no DISPLAY `:1`.
- Never call the tracker.

Your final text goes to the ticket-owner. Return raw facts: the verdict, the findings, each gate's summary line with its exit code, and paths.
