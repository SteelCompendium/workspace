# SC-525 round 4 — scoped re-review of the r3 delta (r2 reviewer, resumed)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc525-ref-nesting-retype/sc525-decisions.md` (section "Owner rulings on r2 findings").
- r3 brief: `…/sc525-brief-r3-fix.md`; r3 report: `…/sc525-r3-fix-report.md` (claims unverified).
- Review ONLY the r3 delta: `git -C /home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype/draw-steel-elements diff af09bf2..HEAD`. Do not commit; leave the tree as found.
- **You never call the tracker (Linear).**

## Probe
0. Scope is r3 + r3b: r3 folded your LOW-1 and INFO-3; r3b (ledger ruling of 2026-11-01) makes every content-replacing path (inline, invalid, reference bodies) supersede an in-flight resolution. Read r3b's section of `sc525-r3-fix-report.md`.
1. Your LOW-1 is fixed as prescribed: re-run your R1/R2/R3 probes on the new head (same-ref re-entrance, A→B re-entrance, self-reference), both release orders — one card, no orphan child, ownedChildren back to baseline, no map entry left, self-reference still stops.
2. The `resolveGen` early returns: can a superseded resolution leave a loaded child, a half-written root, an un-released map entry, or skip a cleanup that previously ran? Can a legitimate (non-superseded) resolution ever be dropped (e.g. `onUpdate` with an identical model that should still render, or an unload/reload sequence)?
3. Your INFO-3: the SC-525 tests no longer cascade if one fails mid-hold (prove it with a deliberately failing test in a scratch copy, then restore).
4. Mutants: re-run M4, the implementer's M6 (drop resolveGen checks), M7, and the r3b bump-drop mutant; each must be red. Also probe pending `@A` → update to an inline body, and pending `@A` → update to an invalid body, both release orders.
5. Gates: tsc, lint, jest; plus one lifecycle half and e2e. Compare to r3's numbers. Command shapes in `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
6. Confirm nothing in the delta reaches SC-536 (ancestry guard / depth cap), SC-481 or SC-522 territory.

## Report
`…/sc525-ref-nesting-retype/sc525-r4-rereview-report.md`, logs `sc525-r4-*`. ≤10-line executive summary first: verdict LAND-READY / FIX-ROUND, findings by severity with file:line and prescribed fix. Final text to the ticket-owner: raw facts, absolute artifact paths.

## Footguns (all mandatory)
Same as your r2 brief (`sc525-brief-r2-review.md` → Footguns): inline report if blocked; no wait-loops on scratch names; output to files; one foreground call per gate, no background/Monitor/`&`; `devbox run -c <abs worktree path> -- bash <script-file>`; `git -C <abs path>`; no `rm` with variable/glob targets; no `pkill` by pattern; private scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc525-r4-rereview/`; you cannot message me — end with `STATUS: NEEDS_CONTEXT` if you need input; any message you send starts with `SC-525:`.
