# SC-379 slice 1 — independent review brief

You are the independent reviewer for slice 1 of SC-379 (negotiation tracker → Steel). You
did not write this code. Your final text goes to the ticket-owner, not a human. **You never
call the tracker (Linear).** You cannot spawn agents. **Execute and probe; do not just read.**

## 1. Context (in order)

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc379-negotiation/sc379-decisions.md`
   — Scott's rulings verbatim (locked direction: "A1 gauges, buttons in the tab"; the ended
   band approved) and the owner's rulings (spec open questions 1–4; the s1 follow-up rulings).
2. Spec: `…/sc379-impl-spec.md` — §1 DOM contract, §3 ended state, §4 folded fixes, §5
   captures, §6 tests, §8 slice 1 scope. Slice 1 = §8 "Slice 1" only; slice 2 is NOT built
   yet (argument-tab chips restyle, dossier cards, docs, changelog, rebaseline package) — do
   not report slice-2 items as missing.
3. Implementer's report: `…/sc379-s1-impl-report.md` (executive summary first; dive in
   only where you need to). Gate logs `sc379-s1r-gate-*.log`.
4. Worktree: `/home/scott/code/steelCompendium/worktrees/sc379-negotiation`, plugin
   submodule `draw-steel-elements/` on branch `sc379-negotiation` @ `1d98148`, base
   `origin/develop` @ `1ac4e5a`. Review range: `1ac4e5a..1d98148` — four production
   commits (`82cd1d0`, `ea16960`, `73e2cc5`, `1d98148`); the two `design(negotiation)`
   commits before them are mock-only (`visual-harness/sc379/`) and out of scope.
5. Standards: `draw-steel-elements/AGENTS.md`, `.repo-docs/font-sizes.md`, the gate skill
   `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, and
   `docs/working-preferences.md` → "Scott is colorblind".

## 2. What to verify (probe each; cite file:line)

A. **Kit `track()`** (`src/framework/kit/track.ts`): API shape vs spec §1; horizontal and
   vertical; 0–N; filled vs hollow-dashed slots; current seal filled teal + ring; it is a
   real `role="radiogroup"` of `<button role="radio">` with `aria-checked` and roving
   `tabindex`; arrow keys move selection (both axes), Home/End if the kit's other radios do;
   disabled state; no hue-only state. Unit tests exist and actually assert these (open the
   test file; a vacuous suite is a finding).
B. **Standing region** (`PatienceInterestView` rewrite, `view.ts` `refreshStanding`):
   clicking a seal persists through the existing `persist()` path only; no new write paths;
   Interest seal `aria-label` = `Interest {n}: {offer}`; the rail is drawn per row
   (`.dse-track__slot::before`, a documented deviation) and does not overshoot at 300px —
   check `sc379-s1-negotiation-dark-narrow.png` and the DOM.
C. **Ended band + state** (spec §3): triggers at Patience 0, Interest 0, Interest 5; band
   text; `data-ended` on the root; Complete Argument disabled with the "over" hint; tier
   rows static (no live radios) when ended; ⋮ → Reset clears it; tabs still switch.
D. **Clamp** (`ArgumentView.ts`, fix 1 / `NegotiationData.clampStanding`): drive the
   reachable cases (lie, crit, pitfall at the edges) in jsdom and confirm no value outside
   0–5 is ever written; confirm the model gained methods only (`ending`, `clampStanding`,
   `offerFor`) and no YAML field — `example.yaml` round-trips byte-identical through
   parse → persist.
E. **Writes into user files — integrity probes** (anything that writes a note gets these):
   content above/below the block survives a seal click; two negotiation blocks in one note
   don't cross-talk; a hand-edited YAML value is honoured on re-render; the lifecycle gate
   (`19/19`) is the real-Obsidian backstop — re-run it on your own port
   (`DSE_LIFECYCLE_PORT=9293`) if any doubt.
F. **CSS**: every size via `--dse-fs-*` (run the font-size contract test); colors via
   `--dse-*` tokens only (grep the new rules for `rgba(`/`#` literals); Steel scoping rule —
   the freeze set is exactly the 6 `negotiation*` lines (re-run `npm run shots` +
   `check-freeze.sh` yourself; expected `FREEZE VIOLATED (6 checksum mismatches, 0
   missing)`, names in the report); parity `0 / 0 / 24`.
G. **Tests**: jest `4292 passed / 1 skipped` — re-run it (`rm -f main.js styles.css`
   first). Read the new/changed negotiation tests and `test/dom/theme/controlDensity.test.ts`
   (D-2 pins were retargeted from the retired bubble ladder to the track seals — confirm
   they still measure what D-2 meant: control hit-size/density, not a tautology).
H. **Captures**: `negotiation-ended` and `negotiation-narrow` exist in `entry.ts` per §5;
   the ended capture is truncated by the harness's 1200 px viewport below the tabs (owner
   ruling: accepted, SC-349 owns the viewport) — confirm the band and the disabled Complete
   are inside the captured region. Eyeball `sc379-s1-*.png`; name colors in prose.

Also: anything the owner's eye missed — look at the shots for clipped text, misaligned
seals, light-theme contrast, the Patience "0" seal when current (ended-dark shows it ringed
at 0).

## 3. Report

`…/sc379-negotiation/sc379-s1-review-report.md`, opening with a ≤10-line executive summary
(verdict: APPROVE / FIX ROUND NEEDED; counts by severity). Findings by severity
(HIGH/MEDIUM/LOW/INFO) with file:line, the failure scenario, and the prescribed fix. Then
the gate lines you measured yourself. If the write is blocked, return it inline.

## 4. Footguns

- devbox: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc379-negotiation/draw-steel-elements && <cmd>'`
  run from `/home/scott/code/steelCompendium/worktrees/sc379-negotiation`; the gate command
  LAST in the string; output to a per-run file (`sc379-s1-review-<name>.log` in the ledger
  dir); never pipe a gate. `git -C <abs path>` for every git command.
- Do not commit to the branch; do not edit production files. If you need a probe script,
  put it under the ledger dir or `/tmp`, not the repo.
- Never pkill by pattern; PID only, command line containing `worktrees/sc379-negotiation/`.
  Never `rm -rf` in `.superpowers/`; never touch `freeze-baseline.sha256`/`check-freeze.sh`.
- Foreground gates, redirected; never background-and-wait. Never key a wait on a scratch
  filename.
- You cannot `SendMessage` me; `to: 'main'` is the top-level session. If stuck, end with
  `STATUS: NEEDS_CONTEXT` + the question. A stray message's first word must be `SC-379:`.

## 5. Return contract

Raw facts: VERDICT, counts by severity, the report path, the gate lines you measured, the
absolute path of every log/PNG you produced.
