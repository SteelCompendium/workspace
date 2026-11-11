# SC-572 r2 independent reviewer brief — pool modal condition icons as buttons

You are the independent adversarial reviewer for SC-572. You did not write this code. Your final text goes
to the ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc572-pool-modal-condition-keyboard/decisions.md`
  (spec + owner rulings, quoted there verbatim). The implementer's report:
  `.../sc572-pool-modal-condition-keyboard/sc572-r1-implementer-report.md` (read its summary; judge the
  code, not the report).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc572-pool-modal-condition-keyboard`, plugin
  `draw-steel-elements`, branch `sc572-pool-modal-condition-keyboard`, head `1305e0b4`, base dse
  develop `97a9c93b`. `git -C <plugin> fetch origin` first; report if origin/develop moved. Review
  `git -C <plugin> diff 97a9c93b..1305e0b4`. Do NOT commit to the branch; probes go in your scratch.
- Gate reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- You never call the tracker.

## 2. What to probe (execute, don't just read)

1. Spec conformance: each pool-modal condition icon is a focusable button, accessible name "Remove
   <Condition>", Enter and Space each remove it, mouse click unchanged, a non-activation key does nothing.
   Does it match the initiative tracker's condition-icon model (element, classes, focus-visible ring,
   naming)? Cite both file:lines.
2. Keyboard behaviour in real Obsidian: run the e2e and look at the pool-conditions scenarios. Probe
   edge cases: removing the last condition — where does focus go (lost to body? modal closes?); removing
   one of several — does focus survive or reset; does Space scroll or Enter also submit/close the modal
   (keydown bubbling to the modal's own Enter handling — check!); repeat-press / double removal; does
   the note get the correct write (integrity: other conditions and the rest of the block survive, two
   squads/blocks don't cross-talk).
3. Visual: resting look unchanged (button chrome stripped); a visible focus indicator that is NOT
   colour-only (Scott is colourblind — a focus ring must be distinguishable by shape/outline, not hue
   alone). Look at a shot of the focused state if one can be produced cheaply; name colours in prose.
4. Tests are not vacuous: mutate the fix (revert to div, drop aria-label, drop Space) and confirm the
   jsdom matrix and e2e catch each mutant. Report mutants caught/total.
5. Markers: SC-572 markers flipped to plain tests; no other ticket's known-bug marker touched (SC-566,
   SC-567, SC-573, SC-574 are out of scope).
6. Re-run the battery yourself: tsc, lint, jest, lifecycle (FIVE `--only` parts), e2e, shots, freeze,
   parity. Expected: tsc/lint clean · jest ~7050+new / 1 skipped (with shots CSS cache) · lifecycle 52/52 ·
   e2e `0 failed`, **10 known-bug**, coverage Y/Y · shots 592 0 FAIL, capture clip 147, host-leak line
   (baseline `163 … 978 …`; verify any delta the implementer claims) · freeze 280/280 · parity 0/0/24.

## 3. Footguns (binding)

<same footgun block as the r1 brief, file sc572-brief-r1-implementer.md §4 — read and obey it>, with your
private scratch folder `<scratchpad>/sc572-r2-rev-<yourAgentId>/` where scratchpad is
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc572-pool-modal-condition-keyboard/sc572-r2-reviewer-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / FIX-NEEDED, counts by severity, measured
gate lines). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, and a
prescribed fix. If the write is blocked, return inline.

## 5. Return contract

Raw facts: verdict, head sha reviewed, findings list (severity + one line + file:line), measured gate
lines, mutants caught/total, absolute paths of every artifact. No prose.

## 6. Additional questions from the owner (answer each explicitly)

a. The implementer used a bare `<button type="button" class="condition-icon">` instead of the tracker's
   kit `iconButton`, citing sheen/bevel, 1.75em min size and hover plate. Is that justified, and is the
   focus ring the shared kit ring (not hue-only)?
b. Name "Remove <name>" vs the tracker's "Remove condition: <name>" — any inconsistency worth flagging?
c. `title` was dropped (hover tooltip now "Remove Bleeding" via aria-label). Confirm no double tooltip
   and no regression in any test/driver that read `title`.
d. The pool modal's shot fixture has no conditions, so the host-leak sweep never mounts the new button.
   Owner plans to fold "add a condition to that fixture" into the fix round. Probe: would it move any
   frozen print PNG (freeze 280/280) or change the shots count / host-leak numbers? Prescribe the exact change.
