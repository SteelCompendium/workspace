# SC-324 round 2 — independent review brief

You are the independent adversarial reviewer for SC-324. You did not write this code. You
report to the SC-324 ticket-owner, not a human. **Execute and probe, do not just read.**

## 1. Context loading

- Ledger (source of truth for the contract): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/decisions.md`
- The implementer brief: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/sc324-brief-r1-impl.md`
- The implementer report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/sc324-r1-impl-report.md`
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc324-kit-tooltip`; repo
  `.../draw-steel-elements`, branch `sc324-kit-tooltip`, head `0afcb2f (fix 6f45472 + dse CHANGELOG 0afcb2f)` on
  `origin/develop` `0d69ec9`. Diff: `git -C <repo> diff origin/develop...HEAD`.
  Superproject CHANGELOG commit: `cfb7c00` in the worktree superproject.
- **Do not modify the branch.** Probes go in a scratch dir under your own session scratchpad or
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/sc324-r2-*`.
- **`git -C <absolute path>` for every git command.** Workers never call the tracker.

## 2. What to verify

Contract D1 (verbatim from the ledger):

> Chosen: **(b)** — drop the `tooltip` option and make every caller put its full text in `label`.
> Per-call-site string rule: the new `label` is the string BOTH a hovering user and a
> screen-reader user should get. Lead with the action/name, then any explanation. If the old
> tooltip already contains the label's information, use the tooltip text. If the old label is
> fuller, keep the label. Otherwise merge. Any later `setLabel(...)` on the same button must
> produce strings under the same rule.

Probe at least:
1. **Every caller found.** Independently enumerate every `iconButton(` caller on
   `origin/develop` that passed `tooltip:` (and any wrapper helper that forwarded a tooltip
   into iconButton — e.g. conditionIcons, chrome helpers). Confirm none was missed and none
   silently lost its explanatory string. Check `setLabel` call sites on those buttons for
   state flips that drop the explanation.
2. **Hover actually renders.** Confirm the Obsidian hover still shows on a kit icon button
   after the change (decompile the shipped Obsidian `app.js` setTooltip / global aria-label
   hover handler, or a real-Obsidian runtime probe — the lifecycle/e2e harness can drive one).
   If the implementer removed the `tooltip()` call, prove nothing setTooltip did is lost.
3. **Strings.** Judge each new label against the rule — readable as a hover, sensible as a
   screen-reader name, action first. Flag any that read badly or duplicate words.
4. **Tests are not vacuous.** Mutate the fix back (e.g. re-introduce a discard, or change one
   explanatory label) in a scratch copy and confirm the new tests go red. Check no test was
   weakened to pass (selector changes in jest/e2e).
5. **Battery.** Re-run at minimum tsc, lint, jest, e2e and freeze yourself; lifecycle and
   parity if time allows. Expected (dse-verify CURRENT at `0d69ec9`): jest 4732 passed /
   1 skipped / 227 of 228 suites + the branch's new tests; lifecycle 25/25; e2e
   `59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`; shots 572, 0 FAIL; freeze
   `freeze OK (276/276 …)`; parity 0 GAPs / 0 undeclared / 24 DECLARED.
6. Docs/JSDoc/CHANGELOG reflect the new contract; no stale "tooltip option" guidance remains.

Gate footguns: devbox shape `devbox run -c <repo> -- bash -c 'cd <repo> && <cmd>'`; devbox eats
exit codes — use a wrapper script file that records the code; redirect long output to a
per-run unique log path; run gates in the FOREGROUND (never background-and-wait); never
key a wait-loop on a scratch filename; **never pkill/killall by pattern** — only PIDs whose
command line contains `worktrees/sc324-kit-tooltip/`; set your own `DSE_LIFECYCLE_PORT`
(e.g. 9293); never rm the shared `.superpowers/`.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/sc324-r2-review.md`,
opening with a ≤10-line executive summary (verdict APPROVE / APPROVE-WITH-FIXES / REJECT,
counts by severity, gate numbers). Findings by severity (HIGH/MEDIUM/LOW/INFO) with
file:line, failure scenario, prescribed fix. If the write is blocked, return it inline.

## 4. Return contract

Final text to the ticket-owner: raw facts (verdict, shas, numbers, findings one line each), plus
the absolute path of every evidence artifact. You cannot `SendMessage` me; if you need input,
end with `STATUS: NEEDS_CONTEXT` and the question. Any message you do send starts `SC-324:`.

## 5. Additional items from the owner (ledger D2)

- Check `src/.../StaminaEditModal.ts` (~608-616): it calls `tooltip()` directly on an
  iconButton's `buttonEl`. Report whether that write ever differs from the label (which would
  overwrite the accessible name) — the fix round will route it through `setLabel` regardless.
- The Roll save merge (`Roll save vs {name} (6+ ends)`) is ACCEPTED by the owner (ledger D2);
  do not flag the merge itself, only the wording if it reads badly.
