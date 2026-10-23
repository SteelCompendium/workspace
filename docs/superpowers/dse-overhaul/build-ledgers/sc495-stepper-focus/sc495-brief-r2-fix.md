# SC-495 r2 — fix round (implementer)

Context: same worktree, branch and footguns as `sc495-brief-r1-impl.md` (re-read its §6 footguns; they all still apply). Ledger `decisions.md` is current-state truth — re-read the amended FOCUS TARGET RULE and the 2026-10-23 r1-review rulings. Review report: `sc495-r1-review-report.md` (same dir). Never call the tracker.

Start: dse HEAD must be `247bd27` on origin/develop `9f08f06`; superproject `64464bf` on origin/main `6a176e6`. `git -C <path> fetch origin` in both; if either origin moved, rebase (both bullets kept on a CHANGELOG conflict, ours first) and report the new shas.

## Fixes (findings quoted verbatim from the review, then the owner ruling)

### 1. MEDIUM-1
> in the Stamina modal a MOUSE press that reaches a bound now puts focus in the number `<input>`. A mouse wheel over it then changes the pending value (measured 0 -> 2, Apply label "Lose 2 Temp Stamina"; base: unchanged). On mobile it may also raise the soft keyboard (not verified on a device).
> Fix (owner call): move focus into an editable `<input>` only for a keyboard press. When `visible === false`, either (a) do not move at all, which is the base behaviour … or (b) …

Owner ruling (verbatim from the ledger): "FOLD into r2 with option (a): pointer press moves nothing (base behaviour), for every stepper." The amended rule: "KEYBOARD press only (the button was `:focus-visible` before it disabled) -> move with `{ preventScroll: true, focusVisible: true }`. POINTER press (not `:focus-visible`) -> move NOTHING (base behaviour), for editable and read-only steppers alike."

Update `[STAM-SF03]` and the jest pointer-press tests to the new rule. SF03 adds the wheel check: after mouse clicks take Temp "−" to 0, wheel over the number input; the value and the Apply label must not change. Record that SF03 is red on 247bd27 and green after the fix. Update the code comment in stepper.ts to state why pointer presses do not move focus (wheel-on-input and mobile soft keyboard).

### 2. LOW-1 — CHANGELOG wording
> "A stepper that only displays its number (the initiative Malice, the roll controls) gets the same": Malice is created with no `min`/`max` … so its buttons never turn off. The real read-only steppers with bounds are the roll bar's Edges and Banes.
> "focus used to fall out of the page and the next Tab started again from the top": on base … the next Tab landed on … the next control. What users actually lost: focus sat on `<body>`, so Enter/Space did nothing …, the focus ring disappeared, and screen readers lost their place.

Reword the bullet in YOUR worktree's `/home/scott/code/steelCompendium/worktrees/sc495-stepper-focus/CHANGELOG.md` (never the main checkout's). Plain user words; say it is for keyboard use; name Edges and Banes for the display-only case; no Malice; do not claim the next Tab restarted at the top.

### 3. LOW-2 — real-Obsidian test for a read-only stepper
Owner ruling: FOLD. The reviewer drove it: `ds-feature` with the shipped "Enable rolling" preference (`rollingEnabled: true`), roll bar Edges and Banes steppers (`src/framework/kit/rollBar.ts:151`, `:159`, range 0..9). Needs: a feature fixture; `dse.setPrefs({ rollingEnabled: true })` before and `setPrefs({})` after; control ids `roll.edges` / `roll.banes` at rollBar.ts:151/159, plus whatever further ids the census / coverage gate requires on that surface (attributes only — `data-dse-control`, no pixels); a manifest `e2e/manifest/roll-bar.ts`. The reviewer's throwaway probe spec is a starting point: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc495-r1-review-b7q4/probe-src/probe.e2e.ts` (fixtures in `probe-src/Probe/`).

The test, with real keys: Edges "−" to 0 and Banes "+" to 9 → focus is the value span, `:focus-visible` ring shows with a real computed outline (catches dropping the CSS rule), the span is not a Tab stop (catches dropping `tabindex="-1"`) and Shift+Tab / Tab move to the expected neighbours. Prove it: with `tabindex="-1"` removed, and separately with the `.dse-stepper__value:focus-visible` rule removed, the new test goes red (revert both after).

Out of scope (owner DROPs, do not do): a held-Enter test, counter census registration, deduping the `:focus-visible` read, anything in StaminaEditModal beyond what the tests need, StaminaBarPanel.ts (SC-492), FormModal (SC-489).

Commit each fix separately in dse (`fix(SC-495): …`, `test(SC-495): …`) and the CHANGELOG in the superproject (`docs(SC-495): …`), dse pointer left unstaged. No AI attribution in commits. Never push.

## Gates — full battery on the final head (dse-verify skill)
Expected (dse develop `9f08f06` + r1): tsc/lint clean; jest 5859 ± your test changes / 1 skipped / 241 of 242 (compare after a shots run); lifecycle 34/34; e2e ≥113 ok, 0 failed, 0 known-bug, coverage Y/Y (73 + the new roll-bar pairs — report the new Y); shots 592, 0 FAIL; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED. rollBar.ts gains attributes only, so shots and freeze must not move; if a frozen line moves, STOP and report (do not touch the baseline).

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/sc495-r2-fix-report.md`, opening with a ≤10-line executive summary. New private scratch subfolder `sc495-r2-impl-<suffix>/`. If the report-file write is blocked, return it inline.

## Return contract
Raw facts: STATUS, dse head + base shas, superproject sha, each gate's numbers, red/green evidence for SF03 and the roll-bar test mutations, absolute paths of every artifact. You cannot SendMessage me; end with STATUS: NEEDS_CONTEXT if blocked; any stray message starts `SC-495:`.
