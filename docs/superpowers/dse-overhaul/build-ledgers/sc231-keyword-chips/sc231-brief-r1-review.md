# SC-231 round 1 — independent adversarial review brief

## 1. Context loading
- Ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/decisions.md
- Implementer's brief: …/sc231-brief-r1-impl.md; implementer's report: …/sc231-r1-impl-report.md (same dir). Read the report's summary, then verify everything yourself — do not trust its numbers.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc231-keyword-chips/draw-steel-elements, branch `sc231-keyword-chips`. Diff = `git log --oneline origin/develop..HEAD` / `git diff origin/develop...HEAD`. Verify `pwd` before any write. You are a reviewer: do NOT modify the branch's source; scratch probes go in a throwaway copy or are reverted byte-clean (`git diff` empty) and stated so.
- You NEVER call the tracker (Linear).

## 2. The task — execute and probe, not just read
Review the SC-231 change (one chip per keyword in the steel screen Keywords meta band; Legacy text run and all print output must stay byte-identical). Probe at least:
- The owner ruling of 2026-09-25 in the ledger (render once, split the rendered DOM, every link exactly once, no duplicate/visually-hidden copy). Verify it holds in the DOM: count <a> per keyword link, Tab order has no invisible stops, no aria-hidden subtree contains a focusable element.
- Splitting correctness: keywords containing markdown/links/`<`/`&`, commas inside link text, extra whitespace, trailing comma, empty value, single keyword, duplicate keywords. Does textContent / copy-paste / screen-reader text stay "A, B, C"?
- Theme-agnosticism: Legacy screen text run unchanged (render a legacy card before/after and compare DOM textContent and pixels); print (steel-print, steel-realprint) unchanged — run the freeze gate yourself.
- Every surface that renders a Keywords cell (feature/ability blocks, statblock abilities, compendium embeds, sidebar previews, reading view vs live preview) — anything missed or broken?
- CSS: scoping stays inside `[data-dse-theme='steel']:not([data-dse-print="on"])`, no hex literals, tokens only, no bleed into `.dse-optchip` (SC-338's area) or other chips, wrapping behaviour at narrow widths (does a long list wrap cleanly; do separators leak visibly).
- Tests: are the new tests non-vacuous (would they fail with the change reverted? try it).
- Re-run the full dse-verify battery yourself (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md). Expected: tsc/lint clean; jest ~3919+ / 1 skipped / 202 of 203 suites (+ new tests); obsidian-lifecycle 6/6 ok; shots 524+ 0 FAIL; freeze (see FREEZE bullet below); parity 0 GAPs / 0 undeclared / 16 DECLARED, exit 0 (parity LAST).
- FREEZE: the implementer reports `FREEZE VIOLATED (55 checksum mismatches, 0 missing)`, deterministic across two sweeps, diagnosed as sub-pixel kerning from splitting the text run into sibling spans; it shipped `rebaseline.txt` (55 lines, NOT applied). Verify independently: (a) re-run shots + freeze yourself and confirm the exact same 55-filename set and that rebaseline.txt's hashes match your real bytes; (b) confirm every moved capture actually contains a Keywords band and that pixel diffs are confined to the keyword text row (bounding boxes of diff regions); (c) test whether a different span-boundary placement (e.g. comma kept inside the preceding keyword span so the boundary falls at the space) eliminates or shrinks the movement while still allowing the steel-screen chip look — scratch probe only, revert byte-clean. Report whether the 55-line movement is avoidable.
- Eyeball the implementer's evidence crops in …/evidence-r1/ vs the site's `.sc-ability__chip` (v2/docs/stylesheets/steel-ability-cards.css in the worktree): do the chips actually match the site's per-keyword chip (gap, padding, border, radius, type)?

## 3. Report
…/sc231-keyword-chips/sc231-r1-review-report.md, opening with a ≤10-line executive summary: verdict (LAND-READY / FIX-ROUND), then findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) each with file:line, failure scenario, prescribed fix. Gate numbers you measured, verbatim freeze + parity lines, paths of every log/probe artifact. Final text to the ticket-owner: raw facts, no prose.

## Footguns
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path (prefix `sc231-r1rev-`).
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run every gate in the FOREGROUND; never background a gate and wait for a notification.
- NEVER `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc231-keyword-chips/` (`pgrep -af "worktrees/sc231-keyword-chips/"`, read each line first).
- devbox: `devbox run -- bash -c 'cd <abs path> && … > log 2>&1; echo rc=$? >> log'`; never pipe a gate into tail.
- Never `rm -rf` the shared `.superpowers/` dir; only delete inside `.superpowers/sdd/sc231-keyword-chips/`. Never edit the freeze baseline.
- You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever send a message anyway, its FIRST WORD must be `SC-231:`.
- Commit nothing to the branch.
