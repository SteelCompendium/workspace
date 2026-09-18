# SC-299 round 1 — implementer brief (montage board: quick-entry trio + past-round cells)

You are an `orchestration:implementer` worker for the SC-299 ticket-owner. **Workers never
call the tracker (Linear)** — not to read history, not to post. Everything you need is in
files; your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger (read first, rulings are quoted below): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-decisions.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc299-montage`. The plugin repo is
  `/home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements`, branch
  `sc299-montage`, cut from `origin/develop` `e12c6bd`. **Verify `pwd` before any write.
  Never touch `/home/scott/code/steelCompendium/workspace/` (the shared main checkout).**
  Workspace-level files (e.g. `CHANGELOG.md`) live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc299-montage/CHANGELOG.md` — never under
  `/home/scott/code/steelCompendium/workspace/`.
- First: `git -C <dse> fetch origin` inside the worktree clone and confirm `git log -1
  origin/develop` is `e12c6bd` (if it moved, rebase onto it and say so in the report). Then
  `npm ci` — the worktree has no `node_modules` yet.
- Read before coding: `src/elements/montage/BoardView.ts` (whole file, it is 349 lines and
  its header comments are the rules), `src/elements/montage/view.ts:255-310` (`openSheet`,
  `commitSheetSubmit`), `src/elements/montage/model.ts:364-415` (`logMontageEntry` etc.),
  `src/elements/montage/LogActionModal.ts:1-60` (the `SheetMode` type), the montage CSS in
  `styles-source.css` (`.dse-mt__cell*` rules around lines 3779-3815, 4263-4415, print
  hide at ~5060), and `test/dom/elements/montage.test.ts`.
- Design source (the SETTLED mock Scott approved in SC-191): 
  `visual-harness/sc191/mock6.js:1841-1856` (the open-socket quick trio) and
  `visual-harness/sc191/round2.css:307-345` (its CSS) + `:1750` (narrow-layout rule).
  Read those ~60 lines; do not read the rest of the mock.
- Prior-effort ledger for background only (do not re-read whole reports):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc191-montage-overhaul/sc191-impl-spec.md` §D.

## 2. The task

Ticket SC-299 (Scott, verbatim):

> * quick-entry buttons in cells are missing
> * Unable to edit previous rounds (TODO)

Owner rulings, verbatim from the ledger:

> R-1 (2026-09-13): bullet 1 = implement the mock's open-socket quick trio faithfully
> (mock6.js + round2.css as the design source; `kit/iconButton` for the three buttons per
> the SC-191 "every button" rule). One tap records `{hero, round, result}` with no skill and
> no note; tapping the socket itself still opens the sheet.

> R-2 (2026-09-13): bullet 2 = an empty PAST-round cell becomes an edit target: it opens the
> sheet in `new` mode pre-filled `{hero, round}`. It keeps the `— no action` face (no quick
> trio there — the trio is the round-in-play affordance in the mock) and gains the same
> writable-host-only editmark the recorded cells carry, with a `plus` glyph instead of the
> pencil. FUTURE-round empty cells stay inert (ticket says "previous rounds").

> R-3 (2026-09-13): frozen print bytes must not move. The trio and the new editmark hide
> under print the way `.dse-mt__cell-editmark` already does
> (`styles-source.css:5060`). If any of the 16 `montage-*--steel-{print,realprint}` lines
> move anyway, the worker stops and reports — no rebaseline is shipped without an owner
> ruling and Scott's sanction.

### 2.1 Quick trio (R-1) — implementation notes

- In `BoardView.buildCell`, the branch `state === 'current' && entry === undefined` today
  renders only the `to act` hint. Add, BEFORE the hint, a `dse-mt__cell-quick` container
  holding three `kit/iconButton`s (`variant: 'ghost'` or whatever variant gives the mock's
  flat 1.45em square with a 1px `--dse-metal-line` border — layer a `dse-mt__quick` class on
  `handle.buttonEl` for the bespoke sizing, the same "iconButton plus a second class"
  gesture `.dse-mt__board-rowact` uses). Icons: the `RESULT_ICON` map already in the file
  (`check` / `x` / `circle-plus`). `data-kind` = `success|failure|assist` on each button.
  aria-labels exactly the mock's: `Log a success for Kira in round 2` / `Log a failure for …`
  / `Log an assist for …`.
- Colour (Scott is colourblind — glyph SHAPE is the primary channel; colour is secondary):
  success tinted `--dse-turn-done`, failure `--dse-danger`, assist stays metal, hover →
  `--dse-accent`. Mirror what the recorded-cell glyph rules at `styles-source.css:4331-4355`
  already do so the trio and the recorded glyphs agree.
- Click on a quick button: `evt.stopPropagation()` (the cell itself is `role=button` and
  opens the sheet), then call a NEW callback the constructor takes,
  `onQuickLog: (entry: MontageEntry) => void`, with `{ hero, round, result }` (no `skill`,
  no `note`). In `view.ts`, wire it to `logMontageEntry(this.model, entry)` + the same
  persist/rebuild path `commitSheetSubmit` uses (read it; do not duplicate its write logic —
  extract a shared private method if needed). Keyboard: the buttons are real `<button>`s so
  Enter/Space work natively; make sure the cell's own `keydown` handler does not ALSO fire
  when the event target is inside `.dse-mt__cell-quick` (check `evt.target`).
- Read-only host (`!canPersist`): the trio renders DISABLED via iconButton's `disabled`
  option (explicit read-only state, never hidden, never a dead end — same as every other
  control in this file).
- Nesting rule: the cell is `div[role=button]`. Real `<button>`s inside a `role=button` div
  is the interactive-in-interactive shape the file header warns about. Resolve it the way
  the mock does: when the trio is present, the socket's own click target is the cell
  surface OUTSIDE the trio. Keep `role=button`/`tabindex=0` on the cell (it remains the
  "open the sheet" control) but give the trio container `role="group"` with
  `aria-label="Quick log for <hero>, round <r>"`. State in your report which choice you made
  and why; if you find a cleaner shape that keeps every control keyboard-reachable, take it
  and say so.
- The `to act` hint stays, after the trio, exactly as the mock (`mt2-cell__hint`).
- Narrow layout (`styles-source.css` ~4116-4130 is the montage narrow block): the mock's
  narrow rule is `.mt2-cell__quick { margin-left: auto; }` inside the row-layout cell — port
  it.
- Print (R-3): add `.dse-mt__cell-quick` to the existing
  `[data-dse-print="on"][data-dse-element="montage"] .dse-mt__cell-editmark { … }` rule at
  ~5060 (display:none). The `to act` hint must still print exactly as today.

### 2.2 Past-round empty cells (R-2)

- `isInteractive = entry !== undefined || state === 'current'` → also `state === 'past'`.
  An empty past cell opens `{ kind: 'new', hero, round }` — the sheet already offers
  every round chip `1..rounds`, and `logMontageEntry` does not care which round; verify
  by test that logging round 1 while `current_round` is 3 lands
  `entries[]` with `round: 1` and bumps the tally, and that `nextHeroToAct` (which
  filters on `current_round`) is unaffected.
- Face stays the `minus` glyph + `no action` caption. Add the writable-host-only editmark
  span (`dse-mt__cell-editmark`) with icon `plus` (not `pencil`) — reuse the existing
  hover/focus reveal rules at ~4379-4395; no new CSS unless the plus needs it.
- aria-label for that cell: `Kira, round 1: nothing logged — log an action` (the string the
  code already builds for empty cells).
- A COMPLETE montage (`complete === true`) forces every cell to `'past'` today. Rule: on a
  complete montage, empty cells stay INERT (the bar has already stood down to
  Reopen/Clear all; do not reopen a write path the review-2 M-1 guard closed). So the
  condition is `state === 'past' && !complete`.
- FUTURE-round empty cells: unchanged, inert.

### 2.3 Tests (`test/dom/elements/montage.test.ts`, extend; jest, jsdom)

At minimum:
1. an empty current-round cell renders three `.dse-mt__quick` buttons with the exact
   aria-labels; clicking `[data-kind='success']` writes one entry `{hero, round, result:
   'success'}` with no `skill`/`note` key, bumps `successes` by 1, and does NOT open the
   sheet (assert no modal/`onOpenSheet` call);
2. clicking the cell surface outside the trio still opens the sheet in `new` mode;
3. read-only host: the three quick buttons exist and are `disabled`;
4. an empty PAST-round cell (fixture with `current_round: 3`, a hero with no round-1
   entry) has `role="button"`, opens the sheet with `{ kind: 'new', hero, round: 1 }`,
   and carries the plus editmark; a FUTURE-round empty cell has no `role`; an empty cell
   on a COMPLETE montage has no `role`;
5. keyboard: Enter on a focused quick button logs; Enter on the cell opens the sheet only.

### 2.4 Docs + changelog (part of "done")

- `docs/gm-trackers.md` § "Logging an action." — add one plain-language sentence pair:
  the three small buttons in an empty cell of the round in play log a success / failure /
  assist in one click (no skill, no note — click the cell itself or use Log an action…
  when you want those); and under "Correcting a mistake." that an empty cell from an
  earlier round can be clicked to add a test you forgot to log. Non-technical audience.
- dse repo `CHANGELOG.md` → under `## 7.0.0 (unreleased; previously numbered 6.0.0)`
  extend the existing Montage bullet (line ~18-36) with one sentence for each behaviour —
  do NOT add a new top-level bullet.
- Workspace `CHANGELOG.md` (in YOUR worktree superproject) → one bullet under `## Unreleased`
  tagged SC-299.
- Visual harness: if the montage fixtures (`fixture-mid.yaml` etc.) already show an empty
  current-round socket, the trio appears in the existing shots; otherwise adjust nothing —
  say in the report which screen shots now show the trio and produce the evidence crops
  below.

## 3. Gates (dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — read "The battery, in order", "THE exit-code footgun", the `main.js` note)

Run in order, each through devbox with an absolute path, output redirected to files under
the ledger dir (never piped, gate command LAST in the `bash -c` string):

```
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements && npm run tsc'   > .../sc299-r1-tsc.log 2>&1
… npm run lint   → sc299-r1-lint.log
… rm -f main.js styles.css && npx jest   → sc299-r1-jest.log
… npm run shots  → sc299-r1-shots.log
bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements/visual-harness/shots > sc299-r1-freeze.log 2>&1
… npm run parity → sc299-r1-parity.log   (LAST)
```

Run `devbox run` from `/home/scott/code/steelCompendium/workspace` (the devbox root), but
every `cd` inside the `bash -c` is the WORKTREE path. Expected: tsc clean; lint clean;
jest all green (last recorded 3257 passed / 1 skipped / 185 suites at SC-205 — it has
grown since; report the actual line, and on a timeout-shaped red in `settings-tab` /
`settings-preview` check `/proc/loadavg` and re-run before believing it); shots: read the
`host-copy pin OK|PARTIAL` and `button host-leak OK (N button kinds × 3 states …)` lines —
your three new quick buttons are a new button KIND so the kind count will rise; treat any
per-record failure as real; freeze: `freeze OK (260/260 …)` exit 0 — **any montage line
mismatch = STOP, report, do not touch the baseline**; parity: `0 GAPs / 0 undeclared /
16 DECLARED / exit 0`.

Skip `obsidian-shots` unless `DISPLAY` is set and works; do not fake it.

## 4. Evidence

Screenshots (from the harness shots dir, copy — do not move — into the ledger dir with the
`sc299-r1-` prefix): the `mid` fixture dark + light showing the trio in the open sockets;
a narrow-layout shot; a past-round empty cell with its plus editmark visible (hover/focus
state — use the harness's state capture if it has one, else a jsdom-free playwright
snippet, else describe). Also copy the `montage-mid--steel-print.png` after-shot so the
owner can confirm the trio does not print.

## 5. Commits

Commit inside `draw-steel-elements` after each coherent step (code; tests; CSS; docs) with
plain conventional messages (`feat(montage): SC-299 — …`). No attribution trailers of any
kind. Then commit the worktree superproject (`CHANGELOG.md` + the submodule pointer bump)
once at the end. Do not push. Do not create tags (standing order).

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-round1-report.md`.
It MUST open with a ≤10-line executive summary: verdict, dse sha, superproject sha, the six
gate lines verbatim (jest "Tests:" line, shots' two OK lines, freeze line, parity counts),
freeze status of the 16 montage print lines, and the list of evidence paths. Then sections:
what changed (file:line), the nesting/a11y choice you made, `Drive-by fixes:` and
`Follow-ups:` (things you left alone), and anything you could not do.

Return contract: your final text goes to the ticket-owner — raw facts only (verdict, shas,
measured numbers, report path, every evidence artifact path). No prose recap.

## 7. Footguns (every one has bitten)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — `.superpowers/sdd/` is
  pre-populated across sessions and branches; a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- Redirect long-running output (shots, jest, parity) to a file rather than streaming it —
  the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND and read the
  file when they exit; never background a gate and "wait for a notification" — it never
  comes.
- You cannot `SendMessage` the ticket-owner — a depth-2 agent cannot address its parent, and
  `to: 'main'` routes to the TOP-LEVEL dispatcher, not to the owner. If you need input
  mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; the
  owner sees your completion and resumes you. If you ever do send a message anyway, its
  FIRST WORD must be `SC-299:`.
- Devbox eats `$?`/`$PIPESTATUS` and `| tail` masks failures — read the tools' own summary
  lines from the log files.
- `git checkout -- .` in `v2` destroys hand-authored source — you should never be in `v2`
  on this ticket at all.
- Never `rm -rf` anything under `.superpowers/` — it is every effort's shared ledger.
- Never edit `.superpowers/sdd/freeze-baseline.sha256`.
