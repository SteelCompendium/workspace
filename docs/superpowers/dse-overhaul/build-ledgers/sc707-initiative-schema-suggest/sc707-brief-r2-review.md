# SC-707 round 2 — independent review brief

You are the independent reviewer for ticket SC-707 (draw-steel-elements, the DSE Obsidian plugin). You did not write this code. Your final text goes to the ticket-owner, not a human. **Workers never call the tracker.**

## 1. Context loading

- Ledger (the spec — owner rulings O1–O4): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc707-initiative-schema-suggest/decisions.md`
- Implementer brief: `…/sc707-brief-r1-impl.md`; implementer report: `…/sc707-r1-impl-report.md` (same dir). Read the report's summary and key lists; do not trust its claims — verify.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery table near the top; CURRENT block around line 1553).
- Worktree plugin: `/home/scott/code/steelCompendium/worktrees/sc707-initiative-schema-suggest/draw-steel-elements`, branch `sc707-initiative-schema-suggest`. Base: dse `develop` `e38f7838` (the implementer rebased onto it; confirm with `git -C <plugin> merge-base HEAD origin/develop`). Diff: `git -C <plugin> diff e38f7838..HEAD`. Head to review: `4da5ef69`. Do NOT commit to this branch; you review only. If you need scratch edits for probes, use a separate `git worktree add` into your private scratch folder, or revert them before finishing (`git -C <plugin> status` must be clean at the end, as you found it).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

## 2. The task

Adversarial review of the whole diff. **Execute and probe, not just read.** Specifically:

1. **O1 isolation.** Prove the new suggestions-only schema slot cannot reach validation, the form editor, or scaffold: grep every reader; probe by rendering an initiative block that the suggestions schema would "reject" (wrong type, extra key) and confirm it still renders exactly as at base (jest pipeline test or a real-Obsidian check).
2. **Nested completion correctness (O2).** Write throwaway probe cases (jest in scratch, or drive the real editor via the e2e harness) for: top-level keys unchanged vs base for every element with a schema; key on a `- ` line; key aligned under a `- ` item; two levels deep (creature inside enemy group); enum value on an indented line; a top-level key name typed inside a nested object (must not get top-level suggestions); flow style, block scalars, comments, tabs, odd/inconsistent indentation, blank lines between parent and cursor, a list of scalars; blocks inside callouts (`> `) — behavior must equal base; cursor mid-word (SC-688 accept/replace behavior and SC-678's key-side marker must be unchanged). Check every OTHER element that now gains nested suggestions: are the offered keys actually valid at that nesting level per that element's schema and parser? A wrong suggestion is worse than none.
3. **O3 key lists.** Check the initiative suggestions schema against `src/elements/initiative/model.ts` (key lists ~lines 228–254, `parse`), `resolveRefs.ts`, `example.yaml`. Missing author-facing key? A runtime-only key included? A key the parser does not read? Does the drift test actually fail if a bogus key is added (mutate and run it)?
4. **Tests are not vacuous.** Revert the `schemaSuggest.ts` change in a scratch copy and confirm the new jest tests fail; confirm the new e2e ids actually assert the offered list (not just "a list appeared").
5. **Gates.** Re-run tsc (incl. `tsc -p e2e`), lint, jest, lifecycle, and the full e2e yourself at the branch head. Expected: tsc/lint clean; jest 15044 passed / 2 skipped fresh at base plus the implementer's delta; lifecycle 64/64; e2e `0 failed`, known-bug **20** (unchanged), coverage Y/Y pairs (base 944/964 ok, coverage 540/540). Confirm built `styles.css` is byte-identical to a clean base build (then shots 636 / freeze 280/280 / parity 0/0/24 carry).
6. CHANGELOG bullet and the `docs/writing-blocks.md` edit (owner ruling O6): plain, user-facing, accurate against the behavior you measured.

**Out of scope (already filed or ruled — do not report as findings):** suggestion descriptions not rendered (SC-712); already-present keys offered again (SC-713); ds-hero `state.*` nested keys (O9, dropped); SC-678 key-side mid-word marker; the Roll `tiers` example in docs/writing-blocks.md (O11 — already ruled for removal in the fix round); docs/initiative-tracker.md, docs/yaml-basics.md, mkdocs.yml (SC-419 owns them).

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc707-initiative-schema-suggest/sc707-r2-review-report.md`, opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-ROUND; counts by severity). Findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) with file:line, the failure scenario, and a prescribed fix. Then your measured gate lines.

## 4. Return contract

Final text: raw facts — verdict, findings count by severity with one line each, head sha reviewed, measured gate numbers, absolute paths of the report and every log. No prose.

## Footguns (all mandatory)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run each gate as one blocking foreground call (split lifecycle / e2e into separate calls); no background jobs, no Monitor.
- You cannot `SendMessage` me. If you need input mid-task, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever send a message anyway, its first word must be `SC-707:`.
- Devbox: `devbox run -c <abs plugin dir> -- bash <script file>`; never `cd` inside a compound command; devbox eats `$?` — record exit codes from inside a script file; never pipe a gate into `tail`.
- Every git command as `git -C <absolute path>`.
- Scratch: private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r2-review/`, uniquely named files, created with the Write tool.
- No `rm` with a glob or a shell-variable path. Never `rm -rf` anything under `.superpowers/` or a `/tmp` glob.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains your worktree path or whose `readlink /proc/<pid>/cwd` is inside it.
- Never tag, release, push, deploy, or run `just wt-finish`.
