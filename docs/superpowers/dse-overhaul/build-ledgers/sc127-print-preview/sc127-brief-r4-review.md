# SC-127 round 4 — independent adversarial review of the print-preview paper fix

You are an `orchestration:reviewer` worker (independent review — you did NOT write this
code). Execute and probe; do not just read. Findings by severity with `file:line`, a
failure scenario for each, and a prescribed fix. Your final text goes to the SC-127
ticket-owner (an agent): raw facts, no prose, plus artifact paths. **Never call the tracker.**

## Context loading (in order)
1. Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-decisions.md`
   (Scott's ruling verbatim; option A adopted; SC-348 out of scope; the open frame question).
2. Round-3 implementation report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r3-impl-report.md`
   (executive summary first) and the round-2 design report
   `sc127-r2-design-report.md` §2, §3 (option A), §5 (guards and the gate hole).
3. Worktree `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`,
   branch `sc127-print-preview`; the diff under review is `git diff e4bcd0f..HEAD`
   (or the base the r3 report names). Verify `pwd` before any write. Never write under
   `/home/scott/code/steelCompendium/workspace/`.
4. Skills: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
   (battery, devbox wrapping, exit-code footgun, stale `main.js`, in-run gates, freeze
   semantics), `/home/scott/code/steelCompendium/workspace/draw-steel-elements/AGENTS.md`.
5. Devbox: `cd /home/scott/code/steelCompendium/worktrees/sc127-print-preview && devbox run -- bash -c 'cd draw-steel-elements && <cmd>'`;
   the sh wrapper eats `$?`; never pipe a gate into `tail`; redirect to files under
   `.superpowers/sdd/sc127/` with prefix `sc127-r4-`.

## What must be true (probe each; report measured evidence)
1. **Dark-vault print preview is readable.** Re-run the harness twin for
   `statblock-charline-two`, `feature`, `featureblock`, `hero`, `initiative`, `montage`,
   `negotiation`, `encounter`, `party`, `project`, `kit`, `condition`, `treasure` and any
   fixture with native controls; sample text-node contrast (the r2 `probe.mjs` in
   `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3a3267bf-ca7b-4859-a161-38ee3f6c31da/scratchpad/sc127r2/`
   may be reusable). Expect 0 nodes under 4.5:1 apart from the SC-348 role chips. Look at
   the PNGs yourself; name colours in prose.
2. **Real print did not move.** All 130 `*--steel-realprint.png` sha256 equal the baseline
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`
   lines (read-only; never edit it). Verify from your OWN sweep, not the implementer's log.
3. **The rebaseline file is honest.** `sc127-rebaseline.txt` has exactly 130 lines, all
   `*--steel-print.png`; its hashes equal your sweep; a second clean sweep (delete
   `visual-harness/shots/*` first) reproduces them; and it contains no realprint line.
4. **Light vault is unchanged except ink.** Under `bg=light&print=1&sheet=1` the only
   computed-style difference vs base should be `color` `#222`→`#000` (r2 §3). Probe it.
5. **The gate tightening is real and can fail.** With the SC-127 root exemption removed,
   the run must FAIL; with `nativeControlAdjacent` reverted to the old walk, the hole must
   re-open (prove, restore). Check the new in-run checks (host-block-vs-pin equality;
   paper-exemption self-test) each have a can-fail and print OK lines on the clean tree.
   Check `printTwinDeltaAllowedSet.test.ts`'s floor was updated deliberately, not loosened.
6. **The host block is scoped correctly.** `.theme-dark` scope only; does not match in a
   light vault; does not match in real print (`body.theme-light` forced); a root INSIDE
   another root (nested `ds-feature` in a statblock, by-SCC `ds-scc` card) does not
   double-apply anything visible; `color-scheme: light` does not leak outside the root.
   Probe with a popout-style second window if cheap; otherwise reason from the selector.
7. **Per-block override** `prefs: { printPreview: on }` on ONE block in a dark note gives
   that block its own paper and leaves its neighbours dark (render it).
8. **No leak into screen combos.** `*--steel-dark.png` and `*--steel-light.png` hashes
   equal base for every capture id (0 moved).
9. **Docs**: plugin `docs/settings.md`, `docs/styling-statblocks.md`, `docs/advanced-usage.md`
   say what the preview now does in plain user language; the worktree superproject's
   `CHANGELOG.md` `## Unreleased` bullet exists; `.claude/skills/dse-verify/SKILL.md`'s
   plan-25 note carries the supersession sentence; docs image regenerated or a follow-up
   stated. All in the WORKTREE superproject, none in the main checkout.
10. **Full battery** yourself: tsc, lint, jest (`rm -f main.js styles.css` first), shots
    (all in-run gate OK lines), freeze (expect exactly 130 FAILED twin / 0 realprint),
    parity last (0 / 0 / 16 DECLARED). Report numbers vs the r3 report's.
11. **Commit hygiene**: no co-author/AI trailers; two-commit rule (dse commits +
    superproject pointer bump); nothing uncommitted.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r4-review-report.md`
— ≤10-line executive summary first: verdict (APPROVE / FIX ROUND), finding counts by
severity, battery numbers, realprint-moved count, rebaseline verification result. Then
findings by severity with file:line, failure scenario, prescribed fix. PNGs/logs under
`.../sc127/r4/`.

## Footguns
- Report-file write blocked → return inline. Never key a wait-loop on a scratch filename.
  Redirect long output to files; run gates in the FOREGROUND (never background + wait).
- You cannot `SendMessage` me; `to:'main'` is the dispatcher. Need input → end with
  `STATUS: NEEDS_CONTEXT`. If you ever message, FIRST WORD `SC-127:`.
- Never `rm -rf` under `.superpowers/`; never edit `freeze-baseline.sha256`/`check-freeze.sh`.
- Restore every probe mutation; leave the worktree clean (`git status` empty apart from
  ignored build output). Do not commit.

## Return contract
Verdict; findings (severity, file:line, one line each); battery numbers; realprint moved;
rebaseline verified (y/n, both sweeps); artifact paths. No prose beyond that.
