# SC-407 r1 independent review brief — DSE 7.0.0 docs prune

## 1. Context loading
- Ledger (authoritative): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc407-docs-prune/decisions.md` — Scott's rulings + owner rulings O1–O5. Read all of it.
- Implementer brief: `sc407-brief-r1-impl.md`; implementer report: `sc407-r1-impl-report.md` (same dir). Treat the report's claims as unverified.
- Ship/defer source of truth: `draw-steel-elements/docs/superpowers/dse-7.0.0-release-audit.md` §13 (and §2, §5–§11).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc407-docs-prune`, DSE repo inside it, branch `sc407-docs-prune`, base `05a6ff3` (origin/develop). Branch head to review: `eef9c63` (7 commits). Review `git -C <dse> log/diff 05a6ff3..eef9c63`. A fresh worktree/clone needs `npm ci` AND `npm run host-css` before jest matches the baseline (without host-css one print-twin test skips: 4429/2 skipped). Use `git -C <abs path>` for every git command. Do NOT commit to the branch; probes go in a throwaway `git worktree add` under `/home/scott/code/steelCompendium/worktrees/` (remove it after) or in the ledger dir.
- **Workers never call the tracker.**

## 2. Task — execute and probe, don't just read
Independent adversarial review of the SC-407 branch. Specifically:
1. **Completeness**: run your OWN deferred-surface grep over README.md, docs/**/*.md (excl. docs/superpowers/), mkdocs.yml, CHANGELOG 7.0.0 section — the nine deferred elements (`ds-encounter`, `ds-project`, `ds-party`, `ds-conditions`, `ds-resource`, `ds-surges`, `ds-tokens`, `ds-roll`, `ds-hero`) + every alias from the registry, sidebar, pin/send-to-sidebar, edit pencil / form editor / Authoring / authoringControls, printPreview / Print preview. Anything still documenting a deferred surface is a finding.
2. **Over-pruning**: anything removed that SHIPS is a finding (HIGH). Ships per §13: `ds-scc`, montage, rolling on ability cards (`rollingEnabled`/`rollerEngine`/`rollClickToRoll`), the text-scale trio, the `@media print` layout, the Conditions manager modal via the initiative tracker, `LegacyCompendiumModal`, all 6.0.2 elements. Diff each touched page against `05a6ff3` and check.
3. **CHANGELOG accuracy** (O4): every remaining 7.0.0 bullet describes something that ships; mixed bullets correctly re-worded; header still `(unreleased)`; no mention of the `experimental` switch.
4. **Owner rulings O1–O5** each honoured exactly (O1: no teasers, single placeholder-card note in migrating-to-7.md, no switch mention in user docs; O2: restore map present and accurate — spot-check paths exist at `05a6ff3`; O5: links/nav).
5. **Harness change (O3)**: read it, then PROVE: `docs-shots` captures with the switch OFF; `obsidian-shots`/gates still seed it ON; repo-root `data.json` byte-identical before/after a docs-shots run; no gate moves.
6. **Images**: open the regenerated `docs/Media` images that show settings pages or block menus/chrome and confirm no Authoring page, no Print preview row, no Pin/Send-to-sidebar, no pencil, no deferred element. Every image referenced by a doc exists; every `docs/Media` file has a manifest entry or is `negotiation.gif`; no orphaned images. `negotiation.gif` unchanged.
7. **Dev docs**: AGENTS.md / .repo-docs switch description is accurate against `experimental.ts`.
8. **Re-run the gates** yourself: dse-verify battery (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`). Expected (unchanged from base): tsc/lint clean; jest 4430 passed / 1 skipped / 218 of 219 suites (base 4429 + 1 new docs-mode test — check that test is not vacuous); lifecycle 25/25; shots 568, 0 FAIL; freeze `freeze OK (274/274 …)`; parity 0 GAPs / 0 undeclared / 24 DECLARED, exit 0 (last). Plus link check (mkdocs build --strict if runnable) and docs-shots rc=0.

9. **Specific questions from the owner** (answer each in the report):
   a. `docs/Media/sample.png` regenerated at 1400x6002, was ~3261 tall at 05a6ff3. Content growth (legit) or a capture defect (e.g. a placeholder card, an expanded section, a broken layout)? Open both versions.
   b. No doc references `negotiation.gif` now. Was it referenced at 05a6ff3? If the prune removed the reference, that is a finding.
   c. Audit §7 claims the settings index has 8 pages after gating; confirm the real count with the switch off (the implementer saw 10).
   d. Implementer drive-by fixes (settings.md `feature.md`→`Features.md`; CHANGELOG "New commands" legacy-alias contradiction; common-element-fields teaser reword) — correct?

Findings by severity (CRIT/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix. Verdict: LAND-READY or FIX-REQUIRED.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc407-docs-prune/sc407-r1-review.md`, opening with a ≤10-line executive summary (verdict, counts by severity, gate numbers). Logs/probe artifacts under `.../sc407-docs-prune/review-r1/`.

## 4. Return contract
Final text goes to the ticket-owner, not a human: raw facts (verdict, severity counts, measured gate numbers, sha reviewed), no prose, plus the path of every evidence artifact (report, logs, the 1–2 images that best show the pruned settings page / block menu).

## Footguns
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file; run gates in the FOREGROUND (Bash timeout up to 600000). Never background a gate and wait for a notification — it will not come.
- Devbox: `devbox run -- bash -c 'cd <abs path> && <cmd> > <abs log> 2>&1'`; its sh wrapper eats `$?`/`$PIPESTATUS` — capture exit codes via a wrapper script file.
- Never `pkill`/`killall` by pattern — other efforts run the same commands. Kill only by PID whose command line contains your own worktree path.
- Never `rm -rf` the shared `.superpowers/` dir. Never push, tag, release, or run `just deploy*`/`wt-finish`.
- Docs-shots/obsidian runs: use your own Xvfb display / CDP port if the tooling allows, so you don't collide with concurrent efforts.
- You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need input, end with STATUS: NEEDS_CONTEXT and the question. Any message you do send must start with `SC-407:`.
