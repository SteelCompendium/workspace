# SC-279 round 3 — independent adversarial review (reviewer)

## Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/decisions.md` (Scott's ruling + owner decisions — the requirement). Spec: `sc279-r1-survey.md` §4 as amended by the ledger. Implementation report: `sc279-r2-implement.md` (same dir).
- Code under review: DSE branch `sc279-roll-ux` in `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux/draw-steel-elements` — diff `origin/develop...sc279-roll-ux` (use `git -C`). Plus any superproject commits on `sc279-roll-ux` in `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux` (DESIGN.md / CHANGELOG).
- You NEVER call the tracker. You do NOT commit fixes — findings only. Probes/scratch go under the ledger dir, `sc279-r3-` prefix.

## Task — EXECUTE AND PROBE, don't just read
1. Re-run the full dse-verify battery yourself (skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`), parity last. Compare to the implementer's claimed numbers. Freeze must move EXACTLY the 2 lines `roll--steel-print.png` / `roll--steel-realprint.png`; verify `sc279-rebaseline.txt` matches your run's hashes byte-for-byte.
2. Runtime probes in the harness/jsdom: collapsed default on ds-roll and on a card after first click; summary text live-updates for each fact; Reset returns to AUTHORED seeds (ds-roll `edges: 1`) and is disabled at defaults; characteristic survives reset; flat mode omits edges/banes; `roll.modsOpen.<n>` survives an echo-rebuild and never writes the note (two rolling effects on one card must not cross-talk; hero-sheet rows namespaced); print (both `@media print` and `[data-dse-print="on"]`) shows no strip and no forced-open region; keyboard order Roll → Modifiers → fields → Reset; label-in-name; no hue-only state (Scott is colorblind).
3. Regression hunt: card launcher semantics unchanged (first click rolls; tier-row click with `rollClickToRoll`); `rollingEnabled` OFF renders zero roll UI on cards (frozen lines elsewhere must not move); Reroll still uses current bar state; Dice Roller engine path still works.
4. Eyeball the evidence set in `sc279-r2-evidence/` (all of it) for layout defects: ragged wrapping at ~300px, misaligned captions, clipped text, light theme contrast.
5. Scope check: nothing from the ledger's OUT OF SCOPE / DROPPED list was done; DESIGN.md edit is in the worktree superproject, not the main checkout (`git -C /home/scott/code/steelCompendium/workspace status --porcelain` must show no DESIGN.md/CHANGELOG change).

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r3-review.md` — ≤10-line exec summary first (verdict APPROVE / FIX-REQUIRED, counts by severity, your measured battery numbers). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

## Return contract
Final text to the ticket-owner: raw facts (verdict, finding counts, numbers) + absolute paths of every artifact.

## Footguns
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents (stale logs from other branches match). Per-run unique paths.
- Redirect long output to files; run gates in the FOREGROUND; never end your turn "waiting for" a background job.
- Devbox wrap: `devbox run -- bash -c 'cd <dse> && <cmd> > <log> 2>&1'`; devbox eats exit codes — read tool summaries.
- Never pkill/killall by pattern; kill only PIDs whose cmdline contains `worktrees/sc279-roll-ux/`.
- Never edit `freeze-baseline.sha256`; never rm -rf under `.superpowers/` beyond your own sc279-r3- files.
- You cannot SendMessage me; if you need input end with STATUS: NEEDS_CONTEXT. Any stray message's first word must be `SC-279:`.

## Owner additions after r2 (2026-10-16)
- Implementer head: DSE `24e5a1e` (gates run at `254b991`; later commits are comment/doc wording), superproject `218031b` (DESIGN.md only). Claimed: jest 4387/1 skipped/215 of 216 · lifecycle 25/25 · shots 580, 0 FAIL · freeze 2 mismatches (the two roll print lines) · parity 0/0/24.
- Implementer concern: the Steel checkbox draws no check glyph — checked = teal fill vs empty box. Assess for Scott (colorblind): is filled-vs-hollow enough, and what exact scoped rule would add a check glyph without moving other frozen lines? Owner leaning: a glyph is required (fold into fix round) — confirm or refute with evidence.
- Implementer follow-up: card shots show a white band below the card. Determine cause (harness capture vs real layout defect) — real defect = finding.
- Harness `thenClicks/prefs/width/fixedDice/screenOnly` additions: verify `fixedDice` cannot leak into other shots (Math.random pin scope) and that screen-only shots are truly excluded from freeze/print-twin gates.
