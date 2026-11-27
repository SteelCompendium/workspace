# SC-391 R2 — independent review brief (orchestration:reviewer)

## 1. Context loading
- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc391-scc-prose-renderers/decisions.md` ("Owner decisions" = the spec). Then the implementer's report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc391-scc-prose-renderers/sc391-r1-implement.md` (exec summary first). The survey `sc391-r0-survey.md` in the same dir has the code map if you need it.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc391-scc-prose-renderers`, dse branch `sc391-scc-prose-renderers` at head `9eb5ffa3` on base `4b233886` (origin/develop). Diff to review: `git -C /home/scott/code/steelCompendium/worktrees/sc391-scc-prose-renderers/draw-steel-elements diff 4b233886..9eb5ffa3`. `git -C <dse abs> fetch origin` first and say whether develop moved.
- Read `draw-steel-elements/AGENTS.md` and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery shapes + CURRENT numbers).
- You did not write this code. Do NOT edit the branch; probes go in a scratch folder or a throwaway `git worktree add` at an absolute path of your own under the scratch dir.
- Workers never call the tracker. The main checkout `/home/scott/code/steelCompendium/workspace` is shared: write only your report there. Its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.

## 2. The task
Adversarial review of R1 against the spec. **Execute and probe, not just read.** At minimum:
1. Each of the nine types (`skill`, `skill-group`, `monster`, `saint`, `god`, `chapter`, `project`, `movement`, `negotiation`) renders the prose card through `ds-scc` (by code), with the plain eyebrow; an unknown type still shows "has no renderer"; `type: statblock`, `rule`, `dynamic-terrain`, kit etc. resolve exactly as before (probe `adapterForType` / `baseForSccType` over the WHOLE md-dse corpus at `/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified/md-dse/` — before vs after — and report any entry whose resolution changed other than the 219).
2. `monster` matching is exact (no statblock / monster.* leaf captured).
3. Family id is not `negotiation` / `project` / `skills`; no tracker CSS lands on the card (check the rendered DOM's `data-dse-element`).
4. Chapter compact: first paragraph only; "Open chapter" link opens the right vault note (real Obsidian if the e2e harness allows), absent when the file is missing; empty-body chapters render title-only; 156 KB "for-the-director" does not render in full.
5. Inline `scc.v1:` links inside prose bodies work as in rule cards.
6. Tests are not vacuous: revert the src change in a throwaway copy and confirm the new tests fail.
7. Re-run the gates: tsc, lint, jest, the e2e ids R1 added (or the full e2e if cheap), shots + freeze (280/280 must hold) and parity. Lifecycle: the full seven parts only if R1 touched anything lifecycle-relevant (RefUnwrapView mount path, registry); otherwise say why you skipped.
8. Eyeball the per-type screenshots R1 listed (all of them) for: overflowing tables, heading sizes inside the card, missing eyebrow, crest, empty cards, a broken layout. Name colours in prose (Scott is colourblind).
9. Docs (`docs/compendium-sync.md`, `docs/index.md`, README, CHANGELOG) say truthfully what renders now.

Findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix.

## 3. Gates
As in dse-verify CURRENT @ `4b233886`: tsc + lint clean · jest 14730 / 2 fresh (+R1's new tests) · lifecycle 64/64 · e2e `0 failed`, coverage Y/Y (base 843/852 ok, 9 known-bug, 486/486) · shots 592 + new · freeze 280/280 · parity 0/0/24. Compare with R1's reported numbers.

Run each gate as one blocking foreground call via a script file: `devbox run -c <abs dse dir> -- bash <script>`, output to a uniquely named log; read the summary line. No pipes into tail, no background jobs, no Monitor.

## 4. Report path
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc391-scc-prose-renderers/sc391-r2-review.md`, opening with a ≤10-line executive summary (verdict, counts by severity, measured gate numbers). Scratch: private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc391-r2-rev-<random suffix>/`.

## 5. Return contract
Final text goes to the ticket-owner: verdict (LAND / FIX), findings list (severity, file:line, one-line fix), measured gate numbers, and absolute paths of every artifact. No prose.

## Footguns
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or a per-run unique path.
- Redirect long-running output to a file — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me; for input end with STATUS: NEEDS_CONTEXT. Any message you do send starts with `SC-391:`.
- `git -C <absolute path>` always; never `cd X; git …`.
- Never `pkill`/`killall` by pattern; kill only PIDs whose cmdline or `/proc/<pid>/cwd` is inside your own worktree/scratch path.
- No `rm` with variable targets, no glob `rm`, never `rm -rf` under `.superpowers/` or a shared `/tmp` glob. Use the Write tool for scratch files.
- Devbox eats `$?` in `bash -c` one-liners — record exit codes from script files.
- `token-coverage.test.ts` red on D3-token-map rows = stale superproject pin; compare copies, clear with `DSE_TOKEN_MAP_PATH` at the main checkout's copy.
