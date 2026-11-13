# SC-612 r1 — design / survey round (probe only, NO commits)

## Context loading (read first)
1. The ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/decisions.md (ticket text and rulings, verbatim).
2. The common brief (gates, footguns, return contract; binding): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/sc612-brief-common-gates-footguns.md
3. Prior art, the SC-607 design report that found this ticket, §C (the rule) and §D (last bullet "Follow-up (not widened)"):
   /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc607-open-preview-stale-card-write/sc607-r1-design-report.md
   Its probe scripts there (`sc607-r1-*.txt`: instrument / sweep / mutate / obsidian scenario) are reusable templates.
4. dse-verify SKILL "Block edit form Save and embeds (SC-556)", in particular the bullet "Two identical blocks separated only by blank lines" and "The drawn-from rule (SC-607)" (residual 6: "Whole-note pins keep the head-trim bias (SC-612, not touched)").
5. Code: `src/framework/host/ReadingModeBlockHost.ts` (`pinnedTarget` ~1163, `twinned`, `landsOnOtherBlock`, the write-target choice in `replaceSource` ~1267-1281, `strictPins`), `src/framework/host/lineMap.ts` (`mapLine`, `mapLineFromTail`, `mapLineStrict`). Jest: `test/**/reading-mode-host-form-pin.test.ts`, `reading-mode-host-drawn-pin.test.ts`, the SC-480 / SC-552 twin tests.

Worktree: /home/scott/code/steelCompendium/worktrees/sc612-twin-deleted-wholenote-pin, dse at 63e00d7e on branch sc612-twin-deleted-wholenote-pin. `git -C <dse> fetch origin` first; report whether origin/develop moved (do not rebase in this round; probe on 63e00d7e).
Workers never call the tracker.

## The task
The ticket (verbatim, from the ledger):
> Expected: Save writes nothing and shows the "changed on disk first" Notice. It must never go into a different block.
> This is a note open in its own pane, not an embed or a hover preview.

Standing ruling (Scott, 2026-11-10): "Save nothing with a notice is fine."

Deliver, in this order:

A. **Reproduce at 63e00d7e in real Obsidian** (scratch vault, the SC-607 r1 obsidian-scenario pattern), a note open in its own pane, two identical counters separated only by blank lines (and prose above/below):
   - (A1) block edit form open on the UPPER counter, upper block deleted by an outside write (`vault.process` / `vault.modify`), Save -> base writes the lower counter, no Notice (expected per the ticket).
   - (A2) a card + / - whose write is pinned to the upper block (SC-552 pending pin: click, outside deletion of the upper inside the round, the debounced write) -> base writes the lower.
   - Both Reading view and Live Preview. Also the mirror (form / card on the LOWER, lower deleted) as a control: base refuses it today.
   Record what the note ends as and whether a Notice showed.

B. **The rule.** Probe the ticket's fix idea: make whole-note pins strict in `pinnedTarget` (the head-first and tail-first maps must agree, `mapLineStrict`), with a strict miss handled as a miss today (form: refused with the Notice; card: `twinned` -> 'miss', else today's `resolveWriteTarget` fallback + `landsOnOtherBlock`). Say whether a whole-note strict miss must ALSO skip the `resolveWriteTarget` fallback for cards (it does for part pins) — find a shape where the fallback would write a different identical block after a strict miss, or show there is none (the twin check should already catch it).
   Consider and measure at least one narrower variant, e.g. refuse only when the two maps disagree AND the known body is twinned (in `pin.text` or now), so a non-twin note never pays for the second diff or a new refusal. Recommend one, with reasons.
   Keep the probe as a diff file; restore the tree after each probe run (`git -C <dse> checkout -- <literal files>`).

C. **Weigh the cost (the ticket asks for this explicitly).** Base vs probe, list every outcome flip:
   - saved -> refused (new refusals): name each shape. Expected one: an identical block added right next to the pinned one while the form is open / inside the card's click round. Find the others, especially any refusal that happens with NO outside edit (the user's own typing in Live Preview, the plugin's own writes of a sibling block, two quick clicks on one card, a card in a note with two identical counters where the user clicks the upper twice) or that persists after the form is closed and reopened / the next click round. Any of those is a regression I must take to Scott — flag it loudly.
   - refused -> saved: name each, and prove none writes a different block.
   - wrote block X -> wrote block Y: must be zero.
   Method: a jest sweep over generated shapes (the SC-607 r1 sweep / instrument pattern: twin and non-twin notes, form and card pins, upper/lower, delete / insert identical block above / below / adjacent / non-adjacent, unrelated edits above / below / in between, prose vs blank-line separation, >400-line edits (LINE_MAP_MAX_EDITS give-up)), outcome per cell base vs probe, plus the full jest suite on the probe (which existing tests flip and why). Real Obsidian: the A cells on the probe bundle.
   Cost of the second diff: measure `mapLineStrict` time on a large note (e.g. 2000 lines, 400 edits) vs `mapLine`; it runs inside `vault.process`.

D. **Test plan for r2**: the jest cells to add (and existing ones to re-model, with reasons), and whether a lifecycle scenario is warranted (id G-S108, own part 7, ~seconds estimate) or whether existing e2e/lifecycle cover a real-Obsidian check. Say which A cells are red on 63e00d7e and must be green on the fix.

E. **Open questions for the owner**, each with a recommendation (the SC-607 r1 §D format).

## Gates
Probe round: no full battery. Run full jest once on your recommended probe (report passed/failed/skipped vs base 11648 / 2) and the lifecycle parts that touch forms and twins if you judge them relevant (name them, report walls). Restore the tree; `git -C <dse> status --porcelain` must be empty at the end (report it).

## Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/sc612-r1-design-report.md (<=10-line executive summary first), plus probe diff(s), sweep tables and logs in the same dir, all `sc612-r1-` prefixed. Scripts in your private scratch folder `.../scratchpad/sc612-r1-designer/`; copy the ones worth keeping into the ledger dir as `.txt`.

## Return contract
Final text: verdict (recommended rule), the flip counts (saved->refused, refused->saved, X->Y) base vs probe, the A cells' base outcomes, any NEW refusal outside "an identical block involved and an outside edit inside the form / click round" (or "none"), full-jest numbers, `git status` at end, and the absolute path of every artifact. Raw facts, no prose. `Drive-by fixes:` (should be none in a probe round) / `Follow-ups:`.
