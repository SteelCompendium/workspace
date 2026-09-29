# SC-232 round 9 — independent review of the card-head SLOT work (rounds 8a + 8b)

You are an independent Opus reviewer; you did not write this code. Execute and probe, don't
just read. Final text goes to the ticket-owner: raw facts. Workers never call Linear.

## Context

- Ledger `.../sc232-cardname-scale/decisions.md`: "Scott ruling 1" (verbatim), "Owner rulings,
  round 7", "Round 8a result".
- Spec: `sc232-r7-slot-survey-report.md` §1–§3 (W1–W8; W6 is NOT in scope — SC-367).
- Implementer reports: `sc232-r8a-report.md`, `sc232-r8b-report.md` (exec summaries first).
- Freeze deliverables: `rebaseline.txt`, `rebaseline-map.md`; evidence in `r8-evidence/`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`; dse diff
  `git -C <wt>/draw-steel-elements log --oneline origin/develop..HEAD` (the name-size commits
  from earlier rounds were already reviewed — focus on the 8a/8b commits, but re-run the
  whole battery). `git fetch origin` first; report if `origin/develop` moved.
- Gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`,
  esp. "Freeze semantics" (sanctioned-rebaseline operation).

## Probes (minimum)

1. **Site fidelity.** For each W item, render the SAME real entity on both sides (survey
   `r7-survey/md-dse/` files through `ds-scc`; site DOM live) and compare slot text exactly:
   trait/ability/class-feature/kit-signature left-deck, level chip, usage chip, cost placement,
   "Signature", statblock kind-noun + keyword deck, featureblock kind-noun. Include edge cases
   the ported site rules branch on (subclass present/absent, kit trait, missing metadata,
   ability with no cost, villain/malice features, summoner entities).
2. **Missing-data safety.** Every new slot with its field absent: no empty wrappers, no
   "undefined"/"Level undefined", no layout gap vs develop. Hand-authored (non-synced) blocks
   must render exactly as on develop unless the spec says otherwise.
3. **compendiumInsert.ts change (`6828e11`)** — out of the original plan. Is narrowing the
   snapshot `metadata` to six keys correct and safe (inserted snapshots, round-trip, SC-165
   invariants, statblock/featureblock unaffected)? Any user-file write integrity risk?
4. **Freeze.** Re-run shots twice; confirm `rebaseline.txt` is deterministic, is exactly the
   FAILED set, every line is explained by `rebaseline-map.md`, and no id moves that the map
   doesn't justify. With `rebaseline.txt` applied to a SCRATCH copy of the baseline,
   `check-freeze.sh` reads clean. Eyeball the print before/after crops: does anything in print
   look broken (overlaps, clipped chips, collapsed rows)?
5. **Narrow (SC-284 landed).** Under 480px, does the re-placed right rail (rows 4–6) still work
   with the new chips (level, usage, cost-on-name-row)? The SC-232 name fallback still holds
   (wrap table base vs head).
6. **SC-231 meta band** (landed): W7's removal of the duplicated "Type" chip doesn't undo
   SC-231's keyword chips.
7. **Sticky statblock mini-header** shares header parts — correct after W4?
8. **Gates**: tsc, lint, jest (state count), lifecycle 19/19 (own port), shots, parity
   (0/0/26 unless justified).

## Rules

Kill processes only by PID and only ones whose command line contains
`worktrees/sc232-cardname-scale/` (or your own throwaway path); never `pkill`/`killall` by
pattern. Foreground gates, output to per-run unique logs; never key a wait loop on a scratch
filename. No commits on the branch. Never touch the shared main checkout's working tree, dse
`main`, or the shared freeze baseline. Never `rm -rf` the shared `.superpowers/`. If the report
write is blocked, return inline. You cannot SendMessage the owner: end with
`STATUS: NEEDS_CONTEXT` if blocked; any stray message starts with `SC-232:`.

## Report

`.../sc232-cardname-scale/sc232-r9-review-report.md`, ≤10-line executive summary first
(verdict LAND-READY-AS-PROPOSAL / FIX-FIRST, counts by severity, freeze verdict). Findings by
severity with file:line, failure scenario, prescribed fix. Final text: verdict + findings +
artifact paths.
