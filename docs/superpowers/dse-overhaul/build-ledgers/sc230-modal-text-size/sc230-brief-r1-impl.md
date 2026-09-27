# SC-230 round 1 — implement: text-size scale reaches DSE modal content

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/decisions.md`
  (it quotes the ticket; it is your spec). **You never call the tracker (Linear)** — not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc230-modal-text-size`. Repo you edit:
  `.../sc230-modal-text-size/draw-steel-elements`, branch `sc230-modal-text-size`.
  **Verify `pwd` and `git branch --show-current` before any write.** Never touch the main checkout
  (`/home/scott/code/steelCompendium/workspace/draw-steel-elements`) — it is shared state with live dirt.
- First: `git -C <worktree>/draw-steel-elements fetch origin && git -C ... rebase origin/develop`.
  Expected base: origin/develop `f6fb208` (if it has moved, rebase onto the new tip and say so).
- Read `draw-steel-elements/AGENTS.md` and the `dse-verify` skill
  (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) — especially the
  "Steel scoping rule", the stale-`main.js` protocol, and load-sensitive jest suites.
- Devbox: `devbox run -- bash -c 'cd /abs/path/draw-steel-elements && <cmd>'` (devbox ignores shell cd).

## 2. The task

Ticket (quoted from ledger):

> Of the two Task 7 scale prefs, card zoom applies inside DSE modals (the `.dse-modal` root is a
> Steel token-scope member and gets css-bearing prefs stamped via `reflectCss()` in
> `DseModal.open()`), but the text-size scale does not reach modal content — an asymmetry: the
> same modal honors one scale pref and ignores the other.
> ...likely the text-scale consumer selectors don't include the `.dse-modal` scope the card-zoom
> rules do. Decide whether modals SHOULD track text size (probably yes, for consistency) and
> widen the consumer scope accordingly; mind FOLLOWUPS #43's print-anchor shape concerns when
> touching those rules.

Owner rulings (quoted from ledger):

> - proceed on the ticket's "probably yes" — modals track the text-size scale exactly as rendered
>   blocks in notes do.
> - SC-229 (generalized print-anchor shape guard) is OUT OF SCOPE. Any new or widened
>   scale-consumer arm must still use the anchored idiom (exclusion compounded onto the stamped
>   node, e.g. `:is([data-dse-element], .dse-modal)`), and get an exact-selector pin test.
> - the freeze baseline (print only) must NOT move — default text scale is 100% and print is
>   excluded from scale prefs. Expected `freeze OK (260/260 …)`.

Steps:
1. **Diagnose before fixing.** Confirm (with a runtime probe — jsdom test or harness page, not just
   reading) WHY the text-size scale misses modal content: is the pref not stamped on `.dse-modal`,
   is the consumer rule not scoped to it, or does the consumer rule multiply a font-size that modal
   content never inherits? Record the root cause with file:line in your report.
2. **Write a failing test first** (TDD) that proves a modal's content does not scale with the
   text-size pref, then fix. Mirror how card zoom reaches modals. Keep the change minimal and local.
3. Things to check explicitly and report on:
   - No double-application: a rendered DSE block *inside* a modal (if any modal hosts one) must not
     get the text scale applied twice (e.g. 1.25 × 1.25). Probe it.
   - Print exclusion is preserved for the new/widened arm (anchored idiom, pinned).
   - Default (100%) text scale produces byte-identical output — no shot should move.
   - Card zoom in modals still works unchanged.
4. **Evidence for Scott** (he reviews visual changes from images): produce PNGs of one representative
   DSE modal (pick the most text-heavy one the harness or a jsdom-free browser render can show) at a
   non-default text size (e.g. the largest text-size option) — BEFORE (base `f6fb208`) and AFTER
   (your branch) — plus the AFTER at default 100% text size. If the visual harness has no modal
   fixture, build the smallest throwaway render you can (Playwright is in the repo's devDeps for
   shots) and do NOT add it to the frozen shot set. Name files `sc230-evidence-*.png` in the ledger
   dir. If producing images is genuinely infeasible, say exactly why in the report.
5. Commit after every coherent step on branch `sc230-modal-text-size` (conventional message,
   `fix(typography): SC-230 …`). Do not push. **No co-author trailers or AI attribution in commits.**
   Never tag. Never touch DSE `main`.

Out of scope: SC-229's generalized guard; any other typography change. Put anything else you notice
under `Follow-ups:` (left alone) or `Drive-by fixes:` (only obviously-correct, local, gate-neutral).

## 3. Gates (dse-verify battery, in order, each in the FOREGROUND, output redirected to a file)

`rm -f main.js styles.css` in the plugin root before jest and before shots.
Baselines at f6fb208: tsc clean; lint clean; jest **3937 passed / 1 skipped / 202 of 203 suites**;
shots **524 PNGs, 0 FAIL**; freeze **`freeze OK (260/260 …)`, exit 0**; parity (LAST)
**0 GAPs / 0 undeclared / 16 DECLARED, exit 0**. Expected after: jest = 3937 + your new tests,
0 failed; everything else identical. Freeze command:
`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots`.
Use extended Bash timeouts (up to 600000 ms) for shots/parity. On timeout-shaped jest reds in
settings-tab / settings-preview, check `/proc/loadavg` and re-run before believing them.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r1-impl-report.md`.
Logs as `sc230-r1-<gate>.log` in the same dir. It must OPEN with a ≤10-line executive summary
(verdict, root cause in one line, commit sha(s), gate numbers).
Never delete anything in `.superpowers/` outside your own `sc230-*` files — the dir is shared by every effort.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — STATUS (DONE / DONE_WITH_CONCERNS
/ NEEDS_CONTEXT / BLOCKED), branch + head sha, root cause file:line, measured gate numbers, and the
absolute path of EVERY artifact you produced (report, logs, evidence PNGs). No prose.

Footguns:
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the process's
  own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills
  silent agents. Never background a gate and wait for a notification — it will not come.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do
  send a message anyway, its FIRST WORD must be `SC-230:`.
