# SC-127 round 13 — landing rebase and final rebaseline (post-sanction)

You are the SC-127 implementer (resumed). Scott SANCTIONED the rebaseline on 2026-10-02
("approved"). Per the ledger, the sanction covers the visible change (every twin re-pinned
once to the paper fix; 0 realprint lines); the exact hashes must come from the REBASED
landing tree. Foreground only, `sc127-r13-*` files read on return; never wait on a
background job; no AI trailers; no tracker; commit per coherent step.

1. dse clone: `git fetch origin && git rebase origin/develop` (record the tip sha and the
   commit count); `npm ci` if package.json changed; resolve conflicts keeping SC-127's
   intent; list every conflicted file. Run the island generator `--check`; regenerate only
   if it reports stale (say so).
2. Full battery per dse-verify: tsc, lint, jest (`rm -f main.js styles.css` first; base vs
   branch counts), shots (every in-run OK line), freeze against the CURRENT shared baseline
   (read its line count first): expect exactly N `*--steel-print.png` FAILED / 0 realprint /
   0 missing where N = 131 + any twin ids newly added to the baseline since `9ded832`.
   **Diagnose each id beyond the 131 by name** (which ticket added it; confirm its realprint
   sibling is byte-identical to the baseline). **STOP CONDITION:** any realprint FAILED, or
   any twin mismatch that is not explained by the paper fix (e.g. a twin whose screen
   combos also moved vs develop) → report and stop; do not regenerate the rebaseline.
   Parity last (exit 0; report the DECLARED count).
3. Two CLEAN sweeps (delete `visual-harness/shots/*` between) → regenerate
   `sc127-rebaseline.txt` (N twin lines, baseline order; byte-identical sweeps; realprint ==
   baseline in both). Keep the previous file as `sc127-r9b-rebaseline.txt.bak`. Also list
   the capture ids present on the tree but absent from the baseline (the I-1 set) with
   their post-SC-127 twin + realprint hashes in `sc127-r13-unbaselined-ids.sha256`.
4. Superproject: `git fetch origin && git rebase origin/main` keeping CHANGELOG.md + dse-verify
   SKILL.md edits (all newer records intact); `git submodule update -- steel-etl v2
   steelCompendium.github.io`; pointer-bump commit; `git status --short` empty in both.
5. Append "Round 13 (landing rebase)" to `sc127-r9-fix-report.md` with the updated
   executive summary (final shas, base, conflicts, battery, freeze N/0/0, determinism,
   the I-1 list). Return contract: raw facts and paths.
