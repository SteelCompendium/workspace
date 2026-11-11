# SC-584 r2 independent review (reviewer-r2), dse eeed5182..525115b0, superproject 0c430d0d

**Executive summary**
- Verdict: **FIX FIRST**. Counts: CRITICAL 0, HIGH 1, MEDIUM 2, LOW 4, INFO 4 (3 of the INFO items are pre-existing wrong-block paths, not regressions).
- HIGH-1: `openTimeBodyLine` breaks the invariant at the host. Its "agreement" check proves nothing when the part is only the block: a `![[note#^id]]` embed, a `[[note#^id]]` hover, or a heading part whose heading occurs twice. If the form's own block changed between the + landing and the open-time read, and a twin holds the + body, Save writes the twin. Shown in jest, 5 of 5 shapes; eeed5182 refuses all 5. In real Obsidian I could not reach it end to end: in 4 of 4 forced-race cells the outside edit's redraw closed the form 16-80 ms after it opened, so nothing was written. The fix is cheap.
- F2 (real mouse, CDP): the popover and the form **survive** the pointer moving into the modal (2 s+, RV and LP). The **first mouse click inside the form** closes the popover and the form with it, so typed text is lost, on base and on HEAD alike. Keyboard-only edit then a Save click: HEAD **saved**, base refused. So case 1's fix is reachable only by keyboard.
- F3: a whole long-note hover draws its card about 255 ms after the preview is scrolled to it. + then the pencil, then Save: HEAD saved, base refused. No test covers this shape.
- Case 2 (`^id` after the part): correct in every attack I tried. LOW: one false-refusal regression when the part's text is stale and longer than the block now is.
- Gates on HEAD: tsc/lint clean · jest 7089 passed / 2 skipped · lifecycle part 3 9/9 (437 s, two other part-3 runs alongside) · part 5 3/3 (217 s) · e2e 251/260 ok, 0 failed, 9 known-bug, 161/161 · styles.css `4295ca33…` = the eeed5182 build (built both myself).
- The changed existing test (line 796) is the + then pencil shape, with the heading as context. It is not a hazard.

## Findings

### HIGH-1: the open-time body rule places the pin on a twin when the part has no context lines (regression; base refused)
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:918-940` (`openTimeBodyLine`), called at `:839-842`.
  - When the part is only the block, `before` (`:926`) is empty, and `after` (`:927-928`, trailing blanks dropped) is empty too. That covers `![[note#^id]]`, a `[[note#^id]]` hover, and a heading part that ends at the block.
  - The "agreement" then checks one thing: the opening fence line. Every identical block has that line. What is left is "exactly one block holds the known body".
  - That is the shape the owner said must NOT be used as-is. The count is taken at open, but the twin can already be the only holder AT open.
  - It also ignores the `^id` marker. That marker is the one identity a block embed has, and `verifiedPinLine` checks it (`:893-902`).
- **Scenario (jest, deterministic):**
  - Note: A (`^a`) holds 5, and its twin B already holds the + body 6. The card on A, from an embed or a hover, has a stale section (5); the host knows 6.
  - Between the + landing and the form's open-time read, ONE outside edit changes A to 9, or deletes A. Then Save.
  - HEAD writes `name: Edited` into **B**: `["Twin","Edited"]`, no Notice. eeed5182: refused, one Notice, nothing written.
  - Cells (probe file `sc584-r2-probe.test.ts.txt`):

    | id | shape | eeed5182 | HEAD |
    |---|---|---|---|
    | P1 | `[[Note#^a]]` hover, A edited to 9 | refused | **wrote B** |
    | P1d | the same, A deleted | refused | **wrote B** |
    | P2 | RV `![[Note#^a]]` (src, fresh cache), A edited | refused | **wrote B** |
    | P2n | the same, B has no id | refused | **wrote B** |
    | P3 | `[[Note#Tracker]]` hover, two `## Tracker` sections | refused | **wrote B** |
- **Real Obsidian 1.15.1 (forced race, HEAD bundle):**
  - Fixture `r2-blk.md`: A `^r2a` holds 5, B `^r2b` holds the + body in the plugin's key order.
  - + then the pencil in one page turn on A. The outside edit (A becomes 9) lands inside the form's own `pinPosition` → `cachedRead`.
  - Cells, all "nothing written":
    - hover, no source pane: form open at 39 ms, closed at 103 ms;
    - hover, source note open in a second pane: 36 ms, closed at 80 ms;
    - RV embed, no source pane: 39 ms, closed at 120 ms;
    - RV embed, source pane: 17 ms, closed at 33 ms.
  - The redraw the outside edit triggers unloads the view, and the form closes with it. `keepFormOpenOn` did not keep it, even with the source note shown.
  - Without the race, the edit comes too late. The section is fresh about 20 ms after the + write: hover sec 5 → 6 at 410 → 432 ms, embed at 427 ms. And an edit after open is judged by the pin, which refuses.
  - So in the product, today, the bad pin is placed and the form then dies. I rate it HIGH, not CRITICAL: the host-level guarantee SC-556 shipped ("a form's Save never writes an identical block") is regressed, and only the redraw stands between it and a wrong write. Any later change that keeps such a form open (SC-552's `keepFormOpenOn` widened, a hover editor, a slower redraw) turns it into a wrong-block write.
- **Fix (pick one):**
  - (a) Recommended, exact for the + then pencil shape:
    - record the host's own last write inside `Vault.process`: `{ text: next, lineStart: target.lineStart }`;
    - in `rebasePin`, when the part is stale and `knownAtOpen` equals the body of that write, rebase the pin onto that write's note text and line instead of counting;
    - `mapLine` / `pinnedTarget` then judge every outside edit since the +, including one before open. P1-P3 refuse, and the + then pencil cases still land.
  - (b) Minimal:
    - in `openTimeBodyLine`, return null unless `before` or `after` holds at least one non-blank line;
    - for a `#^id` link (src present), also require the `^id` marker after the found block, the same check as `:898-901`;
    - P3 (repeated heading) needs (a), or a rule that the run before the fence is unique in the note.
  - Either way, add P1, P1d, P2 and P3 as refusal tests. Today mutant mA (no after-check) survives all 87 tests.

### MEDIUM-1: the dse-verify proposal and CHANGELOG over-claim what still refuses
- **Where:** `sc584-dse-verify-proposal.md` §1 "Still refused … the note around the block was edited before the form opened"; dse `CHANGELOG.md:25-35` and superproject `CHANGELOG.md` (0c430d0d): "It still writes nothing … when the note around the block was edited before the form opened".
- **Scenario:** HIGH-1. The block itself, edited before the form opens (after the +), with a twin holding the + body, is not refused at the host. Neither text says so, and the invariant text ("never a Save into an identical block") is what readers take away.
- **Fix:** after HIGH-1 is fixed, re-word to what the code guarantees. If (b) is chosen without (a), list "a block embed or hover of a block whose own block was edited between the + and the pencil" under still refused, and make sure the code refuses it.

### MEDIUM-2: the proposal's hover-popover footgun is wrong for a real mouse (F2)
- **Where:** `sc584-dse-verify-proposal.md` §1 footgun (2): "A hover preview closes itself about 0.5 s after the pointer leaves it … and its form closes with it." Same note in the r1 report, case-1 §1. Evidence: `sc584-r2-probe-obsidian-head-f2.log`, `sc584-r2-probe-obsidian-base-f2-f3.log`.
- **Measured** (CDP `Input.dispatchMouseEvent` mouse path, real + and pencil clicks):

  | cell | base eeed5182 | HEAD |
  |---|---|---|
  | RV, pointer rests in the modal 2 s | popover + form open | popover + form open |
  | RV, then a mouse click in the raw box | **closed** (press: open; release +120 ms: popover and form gone) | **closed** |
  | LP (Ctrl-hover), same | **closed** | **closed** |
  | RV, keyboard (focus already in the raw box), Ctrl+End, type, real click on Save | Save refused (Notice), then popover + form closed: typed text lost | **saved** (`note: r2typed` on disk), then closed |
  | LP, keyboard, same | refused, then closed | **saved** |

  - RV timings, from the start of the run: popover at 3600 ms; + at 3921; pencil at 4128; form at 4186; pointer in the modal at 4444; still open at +2000 ms; mouse press at 6583 (open); release at 6819 (closed).
  - LP is within ±150 ms of RV.
  - Focus is in `textarea.dse-form__raw` when the form opens.
- **Meaning for the owner:**
  - Moving into the form does not lose it. The first mouse click inside it does.
  - Case 1's fix is reachable in real use only by a keyboard edit plus one Save click.
  - The refusal's "the form stays open" promise does not hold in a hover preview on base either: the Save click closes the popover.
  - Pre-existing (SC-556 era), not caused by SC-584.
- **Fix:** correct footgun (2) to the measured behaviour. The owner decides on a ticket: a form opened from a hover preview should keep the popover open, e.g. by pinning the hover popover while a modal it opened is up. If phases (zk)-(zn) keep `hp.hide = () => {}`, the proposal should say that the hold stands in for a click-free path.

### LOW-1: `^id` after `max(fence, part end)` refuses a plain fenced `^id` embed whose stale part is LONGER than the block now (regression; base landed)
- **Where:** `ReadingModeBlockHost.ts:898-899`.
- **Scenario (jest P5):**
  - A plain `![[Note#^a]]` block, a twin above with the same body.
  - The section text is one line longer than the block now: a field was removed and the embed has not redrawn.
  - `partEnd` lands on the `^a` line itself, so the marker is looked for on the line after it.
  - Base landed in the embedded block; HEAD refuses (Notice).
  - Narrow: it needs a stale, longer part and a twin.
- **Fix:** find the end of the part in `whole`, not by the section's length. For a callout, walk the `>` lines from `start` (or use `resolveSubpath(...).end.line` when it verifies). Then look for the marker after that.

### LOW-2: test gaps (surviving mutants beyond r1's m1-m6)
- Survivors (pin suite, 87 tests; `sc584-r2-mutants.log`):
  - **mA** no after-check: survives. No test exercises `after`.
  - **mD** fence-line compare dropped: survives. Near-equivalent: it differs only for a spaced or otherwise different info string.
  - **mE** first anchored match taken: survives. Equivalent, as r1 said for m1b.
  - **mF** marker after `partEnd` only, no `max`: survives. No test has a part that ends before the fence's end.
  - **mG** `knownAtOpen` read after the await: survives. The comment's "a write landing during the read must not change what is counted" is untested.
  - **mH** trailing blanks not trimmed from `after`: survives.
- Killed:
  - **mB** count on the part instead of the note: killed (2).
  - **mI** before-check dropped: killed (2).
  - **mJ** count ≥1 instead of ==1: killed (2).
- **Fix:** with HIGH-1, add:
  - P3 (repeated heading, A edited): kills mA once `after` differs;
  - a stale-shorter plain `^id` part: kills mF;
  - a part with Obsidian's extra trailing blank lines: kills mH;
  - a cachedRead that resolves after a concurrent host write: kills mG.

### LOW-3: test 1031 says "the rule is for a form's open", but the rule also runs for card writes
- **Where:** `test/dom/framework/reading-mode-host-pin.test.ts:1031`; `ReadingModeBlockHost.ts:694` (`notePersistIntent` → `pinPosition` → `rebasePin` → `openTimeBodyLine`).
- **Scenario:** a hover card's second + round, with a stale section and a unique body, is now placed by the open-time rule as a pinned card write. Before, it was a fallback (`resolveWriteTarget`). It lands in the same block; probe P14 behaves the same on base and HEAD. The test passes only because count = 2 refuses at the rule.
- **Fix:** reword the test name and the code comment. The rule applies to any pin taken in an embed or hover, card or form. Or limit it to the form's pin, if that is the intent.

### LOW-4: control phase (zc) is vacuous in practice
- **Where:** `visual-harness/obsidian-lifecycle.mjs:5436`. The r1 and r2 part-3 logs both read "(zc) … the form closed with its embed's redraw".
- **Scenario:** the outside edit's redraw closes the form, so "nothing is written into the identical callout" holds whatever the code does. (z) has the same property; it predates SC-584.
- **Fix:** note it in the proposal. For a control with teeth, use the jest P13-style test of the host, or keep the form open (source note in a second pane, if `keepFormOpenOn` applies).

### INFO-1 (pre-existing, eeed5182 too): `searchedPinLine` places a block-only part on a twin when the block was edited before open
- **Where:** `ReadingModeBlockHost.ts:947-961`.
- **Scenario (jest P4):** a `[[Note#^a]]` hover whose section equals the known body 6. A was edited to 9 from outside before the pencil; B is identical (6). The text search finds B's 4 lines exactly once, so Save writes B, on base and on HEAD.
- Same reachability caveat as HIGH-1: the redraw closes the form.
- **Fix:** together with HIGH-1, require context lines, or the `^id` marker for a `#^id` link, before the text search may place a block-only part. Follow-up ticket.

### INFO-2 (pre-existing): a card write (+/-) from a block-link hover writes the twin when the block was edited before the click (jest P14)
- **Where:** `ReadingModeBlockHost.ts:996-1019` (`twinned` counts the known body in `pin.text`, which is the stale part, so 0; `landsOnOtherBlock` is skipped for a partial pin).
- **Scenario:** P1's note. The card write lands `current_value: 7` in B, on base and on HEAD.
- Related to SC-594 / SC-480. Follow-up.

### INFO-3 (pre-existing): a callout in an embed or hover gets NO pin after + then the pencil
- **Where:** `findOwnFence` → `locateInSection(…, knownBody)` (`:611-619`, `:285-301`). The stale callout window holds the old body, so there is no match, `ownFence` is null and `pinPosition()` is null.
- `FormModal` then saves without a pin (`FormModal.ts:543-545`), "as before": no pinOnly, a fallback by section and body.
- Jest P13: a callout `^cal` embed, + then pencil, A then edited, the upper callout holding the + body: Save wrote the UPPER callout, on base and on HEAD.
- So case 1 never reaches the SC-584 rule for a counter inside a callout. Not measured in real Obsidian.
- Follow-up: give a form opened with a null pin `pinOnly` semantics, or find the own fence by DOM ordinal when the body misses.

### INFO-4: changed test 796 is the + then pencil shape (confirmed)
- `reading-mode-host-pin.test.ts:796`: the section (`## Tracker` with 5) is stale, the host knows 6, the Tracker block holds 6, and the cache lags by one line. The only other counter (value 5, above) is what the STALE text matches.
- The old assertion guarded writing into that block above, and the new rule does not write it: the agreement needs `## Tracker`, `` before the fence. HEAD lands in the Tracker block.
- It is not the hazard. It does show that the guard is the heading context, which is exactly what is missing in HIGH-1.

## Probe matrix (case 1 and case 2 attacks)

Jest (`sc584-r2-probe-jest-head.log` / `-base.log`; probe source `sc584-r2-probe.test.ts.txt`):

| probe | base | HEAD | verdict |
|---|---|---|---|
| P1 hover `[[^a]]`, A edited after +, B = + body | refused | wrote B | HIGH-1 |
| P1d same, A deleted | refused | wrote B | HIGH-1 |
| P2 RV `![[^a]]` (src), A edited | refused | wrote B | HIGH-1 |
| P2n same, twin has no id | refused | wrote B | HIGH-1 |
| P3 heading hover, duplicate `## Tracker` | refused | wrote B | HIGH-1 |
| P4 hover `[[^a]]`, section == known, A edited | wrote B | wrote B | INFO-1 (pre-existing) |
| P5 plain `^a`, stale part 1 line longer, twin above | landed | refused | LOW-1 |
| P6 CRLF short-note hover, + then pencil | refused | landed (CRLF kept) | ok |
| P7 three blocks hold the body at open | refused | refused | ok |
| P9 unterminated trailing fence, + then pencil | refused | landed, closing fence added (as SC-343 does) | ok |
| P10 + then pencil, block moved below after open | refused | landed in the moved block | ok |
| P11 callout: both callouts carry ids, cache points at the upper | refused | refused | ok |
| P12 `> ^cal` inside the callout (non-standard) | landed lower | landed lower | ok (never upper) |
| P13 callout embed + then pencil, A edited, upper holds + body | wrote upper | wrote upper | INFO-3 (pin is null; pre-existing) |
| P14 card write, P1's note | wrote B (7) | wrote B (7) | INFO-2 (pre-existing) |

Real Obsidian 1.15.1 (my bundles `head-bundle` 645f1ea4… / `base-bundle` 53ee2e64…, styles.css 4295ca33 both):
- STALE timing: after a +, the section text stays stale until the write lands, then is fresh within ~20 ms (hover: 410 ms sec=5 known=6 → 432 ms sec=6; RV embed: 427 ms fresh).
- CRIT-0 control: `[[r2-blk#^r2a]]` hover, + then pencil, no outside edit. The + makes A identical to B, so the count is 2. Save refused, one Notice, the form stayed open (pin held). Correct.
- CRIT-1..4: forced race (outside edit inside the form's open-time read): the form closed with the redraw in 16-80 ms, nothing written, base and HEAD alike (no Save is reachable).
- F2: see MEDIUM-2.
- F3: whole long-note hover `[[r2-long]]` (120 paragraphs above and below):
  - no card in 3 s (the Tracker heading is not rendered);
  - with the preview scrolled to the middle, a card in 254-257 ms;
  - + then the pencil, then Save: HEAD **saved** (no Notice); base **refused** (one Notice).

## Gates (HEAD 525115b0, my runs)
- tsc: `GATE=tsc RC=0` · lint: `GATE=lint RC=0` (only the eslintignore deprecation warning).
- jest: `Test Suites: 1 skipped, 260 passed, 260 of 261 total` · `Tests: 2 skipped, 7089 passed, 7091 total`, 115 s (no SC-568 timeout).
- lifecycle part 3: `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed`. Wall time 437 s (build included), loadavg 2-6, with SC-575 and SC-566 part-3 runs going at the same time. (zk)(zl)(xc)(yc) land; (zm) refuses; (zn) "the form stayed open"; (zc) "the form closed with its embed's redraw".
- lifecycle part 5: `OBSIDIAN-LIFECYCLE done: 3/3 ok, 0 failed` (G-S59, G-S49, G-S73), 217 s.
- e2e: `OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs` (212 s).
- styles.css: `4295ca33cd77d5c337035c332dcf635b82072693fcca44cf760725f0bcb40a01` on HEAD, and the same from a `git archive eeed5182` build. So shots, freeze and parity carry.

## dse-verify proposal accuracy
- Matches the code: the rule, the "count at open", the `^id` after the end of the part, the phase list, and the gate numbers I re-ran (jest 7089/2).
- Wrong or over-claimed: footgun (2) (MEDIUM-2), and "Still refused: the note around the block was edited before the form opened" (MEDIUM-1; a block-only part has no "around").
- Should add: (zc) and (z) are vacuous in practice (LOW-4). Part 3's wall time in my run: see the gate line, measured alongside two other part-3 runs (SC-575, SC-566).

## Working tree
`git -C …/draw-steel-elements status --porcelain`: empty before and after (probe and mutant edits restored with `git checkout HEAD -- src/framework/host/ReadingModeBlockHost.ts`, the probe test file removed). Superproject: ` M draw-steel-elements` (the pointer, as found).
