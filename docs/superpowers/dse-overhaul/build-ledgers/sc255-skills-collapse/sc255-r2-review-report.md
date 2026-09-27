# SC-255 r2: independent adversarial review of the `ds-skills` header removal

## Executive summary
- **Verdict: APPROVE-WITH-FIXES.** Reviewed dse `cbbb190` (branch `sc255-skills-collapse`, 3 commits on `origin/develop` `6c4f6aa`; fetched, base unchanged). The code change is correct and minimal. Every fix below is to comments, docs or evidence. No runtime defect found.
- **Findings:** 0 HIGH / 1 MEDIUM / 6 LOW / 4 INFO.
- **Battery, my own runs, dse-verify order:** tsc clean; lint clean, exit 0; jest **3996 passed / 1 skipped / 206 of 207 suites / 3 snapshots**, exit 0 (base 3997: net −1, since 5 wrapper tests became 4); lifecycle **6/6 ok**, exit 0; shots **524 PNGs, 0 FAIL**; freeze **FREEZE VIOLATED (20 mismatches, 0 missing)**, exit 1, with **240/260 OK**; parity **0 GAPs / 0 undeclared / 16 DECLARED**, exit 0.
- **Freeze delta:** the 20 failing names are exactly the 20 names in `rebaseline.txt` (diff empty). My shots' hashes are byte-identical to all 20 `rebaseline.txt` hashes, so the result is deterministic across a separate run by a different agent. No frozen line outside Skills moved.
- **Pixels:** the print twin and realprint are a pure upward shift of 60 device px (30 CSS px, the "Skill List" band) with 0 other pixels above threshold. The screen shots shift by 54 device px. No lost border and no orphaned rule. On two screen shots the bottom has 1 CSS px less slack (INFO-2).
- **MEDIUM-1:** the new comments and one test title say the old wrapper "passed no SessionPersist" and that skills "IS session-tracked now". That is false: the base persisted the wrapper at slot `open`, and chrome persisted `chrome.collapsed` before this change too. It would feed a wrong line into Scott's behaviour-change list.
- **Behaviour changes a user would notice:** see §1. The real one: after chrome expand, the list shows at once. Before, the list stayed behind a closed "Skill List" header.

## 1. Behaviour-change list (verified with real tests, base vs branch)

My probes are in `sc255-r2-logs/zz-sc255-r2-probe.test.ts`. They pass 8/8 on the branch. With base `view.ts` restored they fail 3/8 (P1, P6, P8), and those 3 are the real deltas.

| Aspect | Before (base `6c4f6aa`) | After (`cbbb190`) | Changed? |
|---|---|---|---|
| "Skill List" header (screen + print) | Rendered as a kit disclosure band above the groups | Gone; the groups mount on root | YES (the intent) |
| `collapse_default: true` | Chrome starts collapsed. On expand, the list is **still hidden** behind a closed "Skill List" header, so a second click was needed (probe P1 fails on base) | Chrome starts collapsed. One expand shows the list | YES: the double-click is gone |
| `collapsed: false` + `collapse_default: true` | Chrome expanded, but the inner wrapper closed, so the list was hidden (P6/h3 fails on base) | Expanded, list visible | YES (edge case; inconsistency fixed) |
| Global pref `collapseDefault: true`, block undeclared | Chrome collapsed and wrapper closed (a second click again) | Chrome collapsed; one click opens | YES (same double-click fix) |
| `collapsible: false` | No chrome collapse control; list bare. Panel still shows eye + pin | Identical | NO |
| Global pref `collapsibleDefault: false` | No collapse control; list bare; a declared key beats the pref | Identical (P7 + pref-overrides test) | NO |
| Session persistence of the whole-element collapse | **Persisted.** Chrome at `(blockKey, 'chrome.collapsed')` **and** the wrapper at `(blockKey, 'open')` (base test "PERSISTS ACROSS A REMOUNT via SessionPersist") | Persisted via chrome only | NO (see MEDIUM-1) |
| Note writes | None (Skills has no `serialize`; every toggle is session-only) | None (P3: chrome collapse ×3, eye toggle, group toggle → `replaceSource` never called) | NO |
| Two blocks in one note | Separate per blockKey | Separate (P4: A collapsed + eye-toggled, B unaffected, both survive a remount) | NO |
| Hand-edited body re-trigger | n/a | Session collapse survives the re-trigger and the new skill renders (P5) | NO |
| Per-group collapsibles, tallies, `-hidden` forms, narrow | — | Unchanged (pixel analysis §3) | NO |
| Live-preview host | Wrapper rendered | No wrapper; chrome items `expand, skills-unowned, collapse` (P8) | YES (same change) |

Comparison with `ds-stamina` under `collapsible: false`: both keep a panel in reading mode. Stamina shows `["pin"]`; skills shows `["skills-unowned","pin"]`. Neither has a collapse control, a summary, or a collapsed attribute. Stamina is effectively the same shape.

**YAML round-trip.** It holds trivially: `ds-skills` has no write path at all (`serialize` is undefined, and every interaction is SessionStore-only). "Keys round-trip byte-identically after a skill toggle" cannot be exercised, because no skill toggle exists: marks are read-only. `collapseKeysOwnedByModel: true` keeps the keys un-popped (chromeRound2 ROUND 3 test).

## 2. Findings

### MEDIUM-1: false "no SessionPersist" claim in code comments and a test title
- `src/elements/skills/view.ts:11`: "...seeded from `collapse_default`/`collapsible`, with no SessionPersist."
- `test/dom/elements/skills.test.ts:183`: same claim.
- `test/dom/elements/skills.test.ts:245-248`: `test('IS session-tracked now: ...')` with the comment "The old wrapper passed no SessionPersist, so every reading-mode echo-rebuild threw the reader's collapse away".
- **Fact:** base `view.ts` passed `persist: { session: this.cx.session, blockKey: this.blockKey, slot: WRAPPER_OPEN_SLOT }`. That constant was removed by this diff, and base had a test "the whole-element collapse PERSISTS ACROSS A REMOUNT via SessionPersist". Chrome's own `chrome.collapsed` persistence also predates SC-255. This new test passes unchanged with base `view.ts` restored (revert probe), which proves it is not new behaviour.
- **Failure scenario:** the owner copies the implementer's framing into the Needs Review comment ("collapse is now remembered per session"), and Scott is told of a behaviour change that does not exist.
- **Fix:** in view.ts:11 and skills.test.ts:183, replace "with no SessionPersist" with "persisted per block in SessionStore slot `open`". Retitle the test to "the chrome collapse persists across a remount (same blockKey)". Rewrite the comment at :246-248 to say both mechanisms persisted before and chrome is now the only one.

### LOW-1: `resolveCollapsePrefs` and the `declaredCollapsePrefs` side channel are now dead production code
- `src/prefs/catalog.ts:740` (`resolveCollapsePrefs`) now has 0 production callers. SkillsView was the last one; stamina dropped it in SC-169. It is also not unit-tested directly.
- Its only input is `declaredCollapsePrefs`, the WeakMap side channel in `src/model/ComponentWrapper.ts:47-59,92`. That channel now has no consumer.
- Chrome derives declared-ness from the raw keys instead (`collapsedKey.ts` `extractCollapseKeys`).
- Stale references to the helper: `.repo-docs/architecture.md:396`; `test/dom/elements/skills.test.ts:74-77` ("SkillsView now resolves ... through resolveCollapsePrefs"); `test/dom/framework/kit-lifecycle.test.ts:58-61`; `test/dom/elements/stamina-bar.test.ts:67-70`; `test/dom/framework/pref-overrides.test.ts:7,428`.
- **Failure scenario:** a future contributor "fixes" collapse-pref behaviour inside `resolveCollapsePrefs`, and nothing changes at runtime.
- **Fix (owner's call):** delete `resolveCollapsePrefs` plus the ComponentWrapper side channel and repoint the comments in this ticket. Or, since the brief said "only what is genuinely dead" and this crosses into `ComponentWrapper`/`catalog.ts`, file a Backlog follow-up and at minimum fix skills.test.ts:74-77, which this diff made false.

### LOW-2: other stale comments still describe the wrapper
- `src/elements/skills/definition.ts:1-4` still says "collapse state (whole-element wrapper + per-group) lives in SessionStore".
- `test/dom/elements/skills.test.ts:1-4` still says "the whole-element wrapper AND each skill group are kit `collapsible` regions".
- `styles-source.css:3395` still says "Group headers (and the whole-element wrapper) are the kit collapsible".
- `test/dom/framework/chromeRound2.test.ts:460-463` says "the model still parses them for its own ComponentWrapper wrapper — which is only true while the pipeline leaves them in the body". The line-473 comment says "removes the collapse control and the inner wrapper".
- **Fix:** drop the wrapper mention in each. For chromeRound2:462, the reason keys stay un-popped is now only "popping would let ComponentWrapper substitute defaults".
- Pre-existing and INFO only: `collapsedKey.ts:40-42` still says ds-skills declares no chrome and names only `ds-stamina` for the flag.

### LOW-3: the CHANGELOG and docs call it the "Skills" header, but it read "Skill List"
- `CHANGELOG.md:25` and `docs/skills-element.md:38` both call it the "Skills" disclosure header.
- The rendered title was `WRAPPER_TITLE = 'Skill List'`. The before shots and crops show "Skill List". The code comments in this same diff say "Skill List".
- **Fix:** say "Skill List" in both places, so a user can recognise what went away.

### LOW-4: the CHANGELOG entry lacks the file's tag convention and understates the change
- Every neighbouring 7.0.0 entry is prefixed `[FIX]`/`[FEATURE]`/`[INTERNAL]`. This one has no tag.
- "neither behavior moves" holds for the initial state only. The user-visible improvement goes unsaid: after `collapse_default: true` (or the global pref), one expand now reveals the list, where before it took a second click.
- **Fix:** prefix `[FIX]` and add one clause: "expanding a collapsed Skills block now shows the list straight away instead of a second closed header".
- **Optional:** `docs/migrating-to-7.md:251-254` has the equivalent "One thing to know" note for stamina's header. Add "and the Skills element's 'Skill List' header" there for parity.

### LOW-5: one "before" evidence file is really an after shot
- `before/chrome-skills-menu--steel-dark.png` is byte-identical to `after/chrome-skills-menu--steel-dark.png`.
- The r1 before-dark set came from the filtered run `sc255-r1-logs/shots-before-narrow2.log` (22:33). That run shot only 9 ids ×4 = 36 images and did not include `chrome-skills-menu`, so that file was copied from the post-change shots dir.
- The print/realprint "before" files are genuine: all 20 hash-match the live baseline.
- **Fix:** delete that one file, or regenerate it on base, before anything cites it. None of the four crops uses it.

### LOW-6: coverage of the actual user-visible change is thin
- **Revert probe** (base `view.ts` restored, branch tests kept): skills + pref-overrides + all `test/dom/framework` → 1 failed / 589 passed. Only "mounts the groups straight onto root" distinguishes the change. The other 3 new skills tests and the re-pointed pref-overrides test pass on base. They are valid chrome-contract pins, not vacuous, but none pins the fixed behaviour.
- **Fix:** add probe P1 as a test. `collapse_default: true` → click `[data-dse-chrome-item="collapse"]` → `.dse-skills` has no `hidden` ancestor. It fails on base and passes on the branch. Optionally add P6/h3 (`collapsed: false` + `collapse_default: true` → list visible).

### INFO
- **INFO-1, SC-349:** yes, the removal changes what falls inside the 2400-device-px print capture window. Each Skills print twin now carries 60 more device rows (30 CSS px) of the list inside the window: the 91200 = 1520×60 above-threshold pixels are exactly those rows at y≈2340-2400. Realprint shows 0 pixels over threshold apart from the shift. The `-hidden` print pairs fit entirely and are a pure shift.
- **INFO-2:** on screen, `skills--steel-dark` and `skills-ledger-narrow--steel-dark` shrink 56 px against a 54 px content shift. The wrapper contributed 1 CSS px of slack below the last card, and the card's bottom border now sits flush with the element's bottom edge. The top card border is intact (2 device rows, same colours as before). Not frozen, not visible at normal zoom.
- **INFO-3:** `docs/superpowers/sc169-element-menu-panel-spec.md:543-546,599-603` still lists "`ds-skills` still has two collapse mechanisms" as open (FOLLOWUPS #76). It could be marked resolved by SC-255.
- **INFO-4:** `chrome-skills-menu--steel-dark` (hover capture) is byte-identical before and after. See LOW-5: the "before" file is not genuine, so this proves nothing either way.

## 3. Pixel analysis (before/ vs after/, all 30 pairs)
Script `scratchpad/shift2.py`; output in `sc255-r2-logs/pixel-shift-analysis.txt`.
- **Print twin (10):** d=60, best shift 60. The only above-threshold rows are the 60 newly revealed rows at the 2400 cap (INFO-1). The `-hidden` pairs are 0.
- **Realprint (10):** d=60, 0 pixels over threshold.
- **Dark (10):** shift 54, with anti-alias-level residue only (mean 0.2-4, mostly the same cap effect on tall shots).
- **Eyeballed:** the labelled crops (`crops/*-labeled.png`), plus my own pairs for chips-hidden dark, ledger dark top and bottom, and chrome-skills-menu dark. The only difference is the removed "Skill List" band and the upward shift. Group headers, tallies, chips, ledger cards and the chrome panel position are unchanged. Heading hierarchy is fine: group bands become the top-level heading.

## 4. Battery logs (`sc255-r2-logs/`)
- `tsc-1.log`, `lint-1.log`, `jest-1.log`, `lifecycle-1.log`, `shots-1.log`, `freeze-1.log`, `freeze-1-failing.txt`, `rebaseline-names.txt`, `r2-hashes-run1.txt`, `parity-1.log`
- Probes: `probe-revert-viewts.log`, `probe-1.log`, `probe-2.log`, `probe-2-reverted-view.log`, `zz-sc255-r2-probe.test.ts`, `pixel-shift-analysis.txt`
- **Working tree:** submodule clean at `cbbb190`. The probe file, reverted `view.ts`, `main.js` and `styles.css` were all removed or restored. The superproject shows ` M draw-steel-elements` both before and after my work: a pre-existing, uncommitted pointer. No processes left running.

## r3 delta re-review

- **Verdict: APPROVE.** Reviewed dse `4ff0b88` against the delta `cbbb190..4ff0b88` (4 commits: e9780d3, 20b188c, 5724710, 4ff0b88). Findings: 0 HIGH / 0 MEDIUM / 0 LOW / 3 INFO (nits, none blocking).
- Every folded finding is fixed and accurate. The delta touches no runtime code: 8 files, and the `src/` and `styles-source.css` changes are comment-only. The CSS lines sit inside the `/* … */` block that closes at `styles-source.css:3401`.
- The two new LOW-6 tests fail on base `view.ts` (3 failed / 22 passed in skills.test.ts; both new tests are among the 3) and pass on the branch.
- jest on the branch (full run, foreground): **3998 passed / 1 skipped / 206 of 207 suites / 3 snapshots**, exit 0.
- Shots and freeze were not re-run: no CSS change beyond comments (owner's rule). The fixer reports the 20 hashes are unchanged against `rebaseline.txt`.

### Per-finding verification
| r2 finding | Owner ruling | Status at 4ff0b88 |
|---|---|---|
| MEDIUM-1 | fold | FIXED. `view.ts:11-15` now says the wrapper persisted to slot `open` and chrome to `chrome.collapsed`. `skills.test.ts:184-186` has the same correction. The test was retitled "the chrome collapse persists across a remount (same blockKey)" with an accurate body comment (`:280-284`). |
| LOW-1 (partial) | only skills.test.ts:74-77; SC-364 out of scope | FIXED. `skills.test.ts:75-78` now attributes the prefs reads to the framework chrome layer. Verified: `pipeline.ts:593-596` calls `readCollapsePref(prefs, …)`, which calls `prefs.get` (`pipeline.ts:92-99`). `catalog.ts` and `ComponentWrapper.ts` are untouched, which is correct for SC-364. |
| LOW-2 | fold | FIXED: `definition.ts:2`, `skills.test.ts:1-6`, `styles-source.css:3395-3397` and `chromeRound2.test.ts:460-465,475` are all accurate now. |
| LOW-3 | fold | FIXED. CHANGELOG.md:25 and docs/skills-element.md:38 now say "Skill List". |
| LOW-4 | fold | FIXED. The entry is tagged `[FIX]` and states the one-click expand. |
| LOW-5 | delete the file | FIXED. `before/chrome-skills-menu--steel-dark.png` is gone. The print and realprint befores remain, and are genuine. |
| LOW-6 | fold P1 + P6/h3 | FIXED. `skills.test.ts:228` and `:244`. Revert probe: both fail on base. Log: `sc255-r2-logs/r4-revert-viewts.log`. |
| INFO-3 | fold | FIXED. `docs/superpowers/sc169-element-menu-panel-spec.md:543-549,603-608` are marked RESOLVED by SC-255. |

### New INFO (optional nits)
- **INFO-r4-1:** `docs/superpowers/sc169-element-menu-panel-spec.md:549` says the 20-line freeze delta "was sanctioned separately". Per the ledger, Scott's sanction is still pending. The line only becomes true at landing, and landing is gated on that sanction, so this is harmless. If the ask is declined or reshaped, reword it.
- **INFO-r4-2:** the title at `test/dom/elements/skills.test.ts:244` says "declared collapsed: false beats the model default". `collapse_default: true` is an authored key, not a model default. "beats collapse_default: true" would be exact.
- **INFO-r4-3:** `styles-source.css:3397` has a short line left over from the rewrap. Cosmetic only.

### r4 logs
`sc255-r2-logs/r4-revert-viewts.log` and `sc255-r2-logs/r4-jest-1.log`. The tree was left clean: submodule `git status --porcelain` is empty, `view.ts` was restored, and `main.js`/`styles.css` were removed. Nothing was committed.
