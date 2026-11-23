# SC-671 r6 — scoped re-review of the fix-round delta (not a fresh full pass)

You reviewed plugin `16cbd05f` in r4 (LAND-READY, LOW-1..3, INFO-1..5). The owner folded LOW-1, LOW-2, LOW-3 and
INFO-3 into a fix round (r5, a different worker). Since r4 the branch was also rebased `bdf0255e` -> `fefd9029`
(SC-644 landed: `src/framework/pipeline.ts`, `livePrefs.ts`, `chrome/focusHandoff.ts`, `src/elements/hero/view.ts`,
settings e2e specs — no file this branch touches). You re-review ONLY the delta and one rebase interaction.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/decisions.md`
  (entries "r4 findings ruled" and "r5 result").
- Fix brief and report in the same directory: `sc671-r5-fix-brief.md` (what was asked), `sc671-r5-fix-report.md`
  (executive summary; treat claims as unverified).
- **You never call the tracker (Linear).** You do not change the branch.
- Plugin: `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements`, head
  **`d582e7ff`** on origin/develop **`fefd9029`**. Rebased r4-reviewed commits end at `f11459e9`
  (`git range-diff bdf0255e..16cbd05f fefd9029..f11459e9` should print four `=` — confirm). The delta under review is
  **`f11459e9..d582e7ff`** (commits `682b4b66`, `d582e7ff`; 4 files, +86/-4).
- Superproject: `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys`, head `06e1f3e4` (pointer
  bump) on `358b7fb0` (CHANGELOG clause) on `7b5eddbd` (CHANGELOG bullet). Review `git -C <worktree> diff
  origin/main HEAD -- CHANGELOG.md`.
- Probes go in a NEW scratch worktree: `git -C <plugin> worktree add --detach
  /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc671-r6-rereview/dse-probe d582e7ff`
  (your r4 probe is on the old base; leave it registered, do not reuse it for results). Private scratch dir:
  `…/scratchpad/sc671-r6-rereview/`, `r6-` prefixed scripts and logs.

## 2. What to check

1. **LOW-2 fix** (`src/elements/counter/model.ts`, `serialize`: `carried = extras.filter(own-key check)`;
   `KNOWN_KEYS` exported). Is it correct and inert today? Specifically:
   - a block with no unknown keys still takes the early return, byte-identical to `fefd9029`;
   - hostile keys (`__proto__`, `constructor`, `toString`, `hasOwnProperty`, `toJSON`, `valueOf`) are still carried
     and written once — `hasOwnProperty.call(model, key)` must be false for each on a `Counter` instance;
   - when every extra is filtered out (`carried` empty) the two-argument `stringifyOmittingUntouched(model, dto)`
     writes the same bytes as the one-argument form;
   - does exporting `KNOWN_KEYS` leak into anything (registry, barrel export, bundle surface)?
   - the two new unit tests: re-run your mutants M3 (a known key carried as unknown) and one new mutant (remove the
     filter line) — which tests go red? Is the "KNOWN_KEYS equals `Object.keys(Counter.parse({}))`" test sound, or can
     a field that `parse` sets only when present slip past it (check `_dse_anchor` and `max_value`)?
2. **LOW-1 fix** (`test/dom/elements/wrapperDefaultKeys.test.ts`): the three `title: Deaths` cases are back with the
   new expected bodies; the `{}` / `PREFS` cases are kept; nothing that pinned SC-482 / SC-652 was weakened or
   deleted. The fixer put the `collapsed: false` + `title: Deaths` case in place of a duplicate at the third site —
   say whether that is the right case.
3. **INFO-3 fix** (`test/dom/elements/counter-own-keys.test.ts` harness now calls `host.setMountedBody(body)`): r5
   says all 14 tests stayed green with no rewrite. Your r4 finding said the outside-edit-inside-the-debounce case
   behaves differently when seeded (write refused + Notice). Reconcile: does any of the 14 tests actually exercise
   that race, and if one does, does it now assert the production outcome or pass for the wrong reason?
4. **LOW-3 fix**: the CHANGELOG clause is accurate and plain; nothing else in the file changed against origin/main
   except the SC-671 bullet (first under `## Unreleased`).
5. **Rebase interaction with SC-644** (new since r4): `pipeline.ts` now pushes the "Collapsible by default" /
   "Start collapsed" / "Show edit button" settings into blocks that are already open. Probe, as a real jsdom test (and
   one real-Obsidian e2e probe if the jsdom path cannot reach it): a `ds-counter` with unknown keys is open; a
   live-prefs change reaches it (use whatever `test/dom/framework/chromeLivePrefs.test.ts` uses to trigger it); then
   press +. The unknown keys are still written, once, in place; reserved keys are written once; the block is
   byte-identical to what the same sequence writes without the settings change. Also the reverse order (+, then the
   settings change, then −).
6. Anything else in the delta you judge wrong. No fresh pass over the r4-reviewed commits beyond the range-diff.

## 3. Gates (scoped)

r5 measured the full battery on `d582e7ff`: tsc 0, lint 0, jest 13936 passed / 2 skipped, lifecycle 64/64, e2e
`668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`, styles.css `18730938…f1f9` = clean `fefd9029` build.
You re-run, in the worktree: tsc, and jest for the suites the delta touches plus the SC-644 one
(`test/unit/model/counter-serialize.test.ts`, `test/dom/elements/counter-own-keys.test.ts`,
`test/dom/elements/wrapperDefaultKeys.test.ts`, `test/dom/framework/chromeLivePrefs.test.ts`), and the counter e2e
specs only (`--element=counter`, as in r4). Report each summary line. Spot-check r5's logs for the full numbers
(`…/scratchpad/sc671-r5-fix/r5-jest.log`, `r5-e2e.log`, `r5-lc4.log`: read the summary lines, confirm they exist and
match) — do not re-run the full battery unless a finding requires it. Leave the worktree clean.

## 4. Footguns

Unchanged from your r4 brief (`sc671-r4-reviewer-brief.md` section 4): devbox script files for exit codes, no `cd`
in compound commands, `git -C <abs path>`, no `rm` in /tmp or the scratchpad (only the literal
`rm -f <plugin abs>/main.js <plugin abs>/styles.css` before jest), kill by own PID only, the Bash tool backgrounds a
call at about 120 s (poll your own pid with `timeout 100 tail --pid=<pid> -f /dev/null`), no Monitor, never wait on a
notice, unique per-run log names, never key a wait-loop on another run's scratch file, long output to files, no
push / tag / `just wt-finish` / `deploy*` / `sync`, no `git worktree prune`. If the report-file write is blocked,
return the report inline. You cannot `SendMessage` me: end with `STATUS: NEEDS_CONTEXT` and the question if blocked;
a message sent anyway must start with `SC-671:`.

## 5. Report and return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/sc671-r6-rereview-report.md`,
opening with a ≤10-line executive summary: verdict (LAND-READY / NOT LAND-READY), which r4 findings are closed,
new finding counts by severity, measured numbers. Then findings by severity with `file:line`, failure scenario and
prescribed fix; the item 1-5 results; log paths.

Final text goes to the ticket-owner, not a human: raw facts — verdict, one line per finding, measured numbers — no
prose, plus the absolute path of every evidence artifact.
