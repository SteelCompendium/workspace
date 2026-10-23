# SC-495 r2 — scoped re-review (reviewer B, resumed)

Review ONLY the r2 delta: dse `247bd27..c4b51ce` and superproject `64464bf..4cd1e12` (superproject rebased onto origin/main 3c7f392 — use range-diff) (if either was rebased, use `git range-diff` to isolate the delta). Context: the ledger's 2026-10-23 r1-review rulings and the amended FOCUS TARGET RULE in `decisions.md`; the brief `sc495-brief-r2-fix.md`; the implementer's `sc495-r2-fix-report.md` (executive summary first). Never call the tracker. All footguns from `sc495-brief-r1-review.md` §5 apply (new private scratch subfolder `sc495-r2-review-<suffix>/`).

Check, by executing:
1. MEDIUM-1: re-run your PRB-12 (mouse clicks Temp "−" to 0, wheel over the input) on the new head — value and Apply label unchanged; a keyboard press still moves focus with the ring. Read-only pointer path moves nothing.
2. The new roll-bar e2e: it really goes red with `tabindex="-1"` removed and, separately, with the `.dse-stepper__value:focus-visible` rule removed (re-run both mutations yourself). The new control ids are attributes only (shots/freeze unchanged). `setPrefs({})` restores prefs even when the test fails (no leak into later specs).
3. CHANGELOG wording matches LOW-1 (no Malice, no "Tab restarted at the top", Edges/Banes named, plain words).
4. No scope creep beyond the three fixes.
5. Gates: jest and a full e2e run on the new head (coverage Y/Y); shots + freeze only if anything outside tests/attributes changed.

Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/sc495-r2-rereview-report.md` with a ≤10-line executive summary (verdict, severity counts, measured numbers), findings with file:line + prescribed fix. Return raw facts and artifact paths.

6. Owner question: the implementer reports `roll.launch` is stamped on every effect's launch button, so a feature with several rolls repeats the id, and `ds-roll`'s bar now carries the new ids too. Does a duplicated `data-dse-control` id break any e2e helper, the census tests, or the coverage gate's assumptions? Rate it and prescribe (drop, or stamp only where unique).
