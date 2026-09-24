# SC-241 reviewer brief — independent adversarial review

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc241-minion-heal/decisions.md`
  (rulings — source of truth). Implementer report:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc241-minion-heal/sc241-impl-report.md`
  (read its summary; do not trust its claims — verify).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc241-minion-heal/draw-steel-elements`,
  branch `sc241-minion-heal`. Review the diff `origin/develop..HEAD` (`git fetch origin` first;
  base was `0c132d8`). **You never call the tracker (Linear).** Do not commit to the branch;
  probe edits must be reverted byte-clean (`git diff` empty) before you finish.

## 2. The task

Scott's ruling (verbatim from the ledger):

> `src/views/MinionStaminaPoolModal.ts:100-105` (`damageInput`, no `min`) and `:126-132`
> (`parseInt`, no magnitude clamp): "Apply Damage" with `-3` heals the minion pool — the
> same class of bug SC-133's RC-3 fixed in `StaminaEditModal`. Out of scope there (different
> modal/operation, and this one surfaces a "minions typically can't regain stamina" warning
> so it isn't fully silent). Apply the same parse-boundary `Math.max(0, …)` clamp + `min="0"`
> and a red-first test.

Owner ruling (verbatim): "The minion-count input is the same inversion (a negative count
times a positive damage also heals). … Fold it into this fix: clamp BOTH parsed values at the
parse boundary with `Math.max(0, …)`. Red-first test covers both."

Execute and probe, do not just read:
- **Red-first proof:** revert only the `src/` fix (keep the tests), run the new SC-241 tests,
  confirm they fail for the right reason; restore.
- **Vacuity check:** are the new tests actually exercising the Apply Damage path through the
  real DOM (click the button, read persisted/pending pool)? Would they pass if the clamp were
  on the wrong variable, or if `refresh()` never ran?
- **Remaining inversion paths** in this modal: any other input/stepper/onChange that can
  turn a damage op into a heal with a negative, `-0`, `1e3`, `3.7`, whitespace, or empty
  value? Does `pendingStaminaChange` accumulate correctly across repeated applies? Does the
  "can't regain stamina" warning still fire for a legitimate stepper increase?
- Does anything else in the codebase construct this modal or depend on the old behavior
  (e.g. `initiative/view.ts`, `EncounterData.ts`)?
- Changelog bullet: accurate, plain language, correct section of
  `draw-steel-elements/CHANGELOG.md`.
- Re-run `rm -f main.js styles.css && npx jest` (whole suite) and tsc + lint, foreground,
  output to per-run unique files. Shots/freeze/parity are optional for you (implementer ran
  them); run them only if you see anything that could move a pixel.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc241-minion-heal/sc241-review-report.md`,
opening with a ≤10-line executive summary: verdict (APPROVE / APPROVE-WITH-NITS / CHANGES
REQUIRED), then findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario,
and a prescribed fix.

## 4. Return contract

Final text goes to the ticket-owner: verdict, findings list (severity, file:line, one line
each), measured gate numbers, and absolute paths of every artifact. No prose.

## Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; use per-run unique paths.
- Redirect long-running output to a file; run every gate in the FOREGROUND.
- Devbox: `devbox run -- bash -c 'cd /abs/path && <gate> > /abs/log 2>&1'` — gate last, no
  pipes; read the tool's textual summary as truth (devbox eats `$?`).
- You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT. Any message
  you send anyway must start with `SC-241:`.
- Never `rm -rf` anything under `.superpowers/`.
