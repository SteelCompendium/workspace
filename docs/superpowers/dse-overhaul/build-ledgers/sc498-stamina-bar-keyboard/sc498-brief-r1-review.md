# SC-498 r1 independent review brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc498-stamina-bar-keyboard/decisions.md` — read it first.
- The implementer's brief (what was asked): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc498-stamina-bar-keyboard/sc498-brief-r1-impl.md`.
- The implementer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc498-stamina-bar-keyboard/sc498-r1-impl-report.md`. Treat its claims as claims to verify.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc498-stamina-bar-keyboard`, plugin at `.../draw-steel-elements`, branch `sc498-stamina-bar-keyboard`, head `47449b6` on base `9f08f06`. Superproject branch head `874700a`. You review; you do not commit to the branch. Any probe edits are reverted (exact paths, `git -C <abs> checkout -- <file>`) before you finish; the worktree must be clean at the head above when you return.
- `git -C .../draw-steel-elements fetch origin`; report whether `origin/develop` moved past the base.
- Read `draw-steel-elements/AGENTS.md`, `DESIGN.md` (worktree copy), and the `dse-verify` skill before running gates.
- **You never call the tracker (Linear).**
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault. Expected; ignore it.

## 2. Task — execute and probe, don't just read

Ticket expectation, verbatim:

> **Expected:** the bar is one tab stop. Enter and Space open the Stamina modal, the same as a click. Focus has a visible ring.

> **Notes:** keyboard presses on chrome buttons inside the bar (the Edit pencil, the collapse button) must not also open the modal. SC-492 adds that guard for clicks; the keyboard path needs the same rule. Lifecycle G-S32 already drives the pencil by Enter and Space.

Probe at least:

1. **Tests are not vacuous.** Revert the fix (src only) and confirm the new jest tests and G-S36 fail; restore.
2. **Keyboard paths:** Enter, Space (no page scroll), key repeat / held key (does holding Enter open two modals?), Enter on each chrome item (pencil, collapse, pin to sidebar), Shift+Tab ordering, modifier keys (Ctrl+Enter etc. should not be hijacked if neighbours don't), IME composition (`isComposing`). Double-open: does click + keyup or keydown + click fire twice?
3. **A11y structure:** nested-interactive (role=button containing buttons)? accessible name sensible and updated when values change? Run axe or an equivalent check if available in the harness; otherwise inspect the DOM.
4. **Tab-stop modes:** is the element a tab stop in any mode where activation does nothing (read-only, collapsed, print, pinned sidebar copy, Live Preview vs Reading view)? Live Preview: does Tab/Enter on the bar get eaten by CodeMirror or move the cursor into the source? (Known pre-existing: SC-502 — the menu panel overhangs the block top in Live Preview; out of scope, don't re-report.)
5. **Focus ring:** matches the existing `:focus-visible` convention it claims to reuse (file:line); not shown on mouse click; not clipped; shape cue not hue alone; absent in print. Look at the implementer's screenshots (dark + light) yourself and say what you see.
6. **Focus after modal close** returns somewhere sensible.
7. **Scope fence held:** no edits to `src/framework/kit/stepper.ts`, `src/elements/counter/view.ts`, stepper CSS/tests (SC-495 in flight), `FormModal.ts`.
8. **Owner-requested checks:** (a) the initiative tracker's row bars opt out of the tab stop (`keyboard: false`) because each row has a numeric button opening the same modal — confirm that button is a real, visible tab stop in every row style, including the Steel rows where it is "visually stood down" (implementer follow-up 2). If it is an invisible tab stop or missing, say so as a finding. (b) The owner looked at `sc498-impl-r1/shots/stamina-bar-focused-dark.png`: the ring is a rectangle around a rounded plate and the chrome panel (pin, collapse) overlaps the ring's top-right edge when focus is inside the bar. Judge whether that overlap hides the ring or the buttons in either scheme.
9. Re-run the **full dse-verify battery** yourself. Expected at base `9f08f06`: tsc+lint clean; jest 5847/1/241 of 242 + the branch's added tests; lifecycle 35/35 with G-S36; e2e `108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` (or more); shots 592 / 0 FAIL with the CURRENT in-run lines; freeze `freeze OK (280/280 …)`; parity 0 GAPs / 0 undeclared / 24 DECLARED.

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a concrete failure scenario, and a prescribed fix. Verdict: LAND-READY or NOT LAND-READY.

## 3. Command footguns

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc498-stamina-bar-keyboard/draw-steel-elements -- <cmd>`. **Never `cd` inside a compound command.** `git -C <absolute path>` always.
- Exit codes: record via a **script file** run through `devbox run -c <path> -- bash <script>`; read each gate's summary line.
- Private scratch folder only: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc498-review-r1/` (create it); unique file names; Write tool for files, not heredocs.
- **No glob `rm`.** Delete only exact paths you created. Never touch `.superpowers/` outside `sc498-stamina-bar-keyboard/`.
- **Every gate one blocking foreground Bash call** (lifecycle, e2e, shots separately, each under 10 min). No `run_in_background`, no `Monitor`. Redirect long output to a log file; read the log.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc498-stamina-bar-keyboard/` or whose `/proc/<pid>/cwd` is inside it.
- Never key a wait-loop on a scratch filename or contents.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc498-stamina-bar-keyboard/sc498-r1-review-report.md`, opening with a **≤10-line executive summary** (verdict, counts by severity, gate numbers). If the write is blocked, return it inline.

## 5. Return contract

Final text goes to the ticket-owner, not a human: verdict, finding counts, measured gate numbers, sha reviewed, absolute paths of every artifact. No prose. You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT and the question. Any message you do send starts with `SC-498:`.
