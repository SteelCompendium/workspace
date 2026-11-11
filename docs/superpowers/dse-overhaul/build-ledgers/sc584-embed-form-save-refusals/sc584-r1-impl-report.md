# SC-584 r1 implementer report

**Executive summary**
- STATUS DONE_WITH_CONCERNS. Base dse `eeed5182` (origin/develop had not moved). dse HEAD `525115b0`, superproject branch HEAD `0c430d0d` (CHANGELOG only).
- Case 1 (hover + then pencil) and case 2 (`^id` callout embed) both save now, in real Obsidian 1.15.1: hover + pencil saved 10 of 10 (base refused 10 of 10); callout embed lands in the embedded callout (base refused).
- Deviation from the owner's preferred shape, needed: placing the pin by "exactly one block holds the body" alone turned an existing SC-556 test red (a block edited from outside BEFORE the form opened, a twin holding the old body: it writes the twin). I added a text-agreement check (part's lines before and after the block must match the note there, once).
- Race: the + write was on disk before the open-time read in 20 of 20 probe reads (the form's open waits for it); the race never refused (0 of 10) and a lagging read cannot place a pin (tests).
- Gates: tsc/lint clean; jest 7089 passed / 2 skipped (+13 over 7076, no SC-568 timeout); lifecycle 53/53 (21/21, 16/16, 9/9, 4/4, 3/3); e2e 251/260 ok, 0 failed, 9 known-bug, 161/161; styles.css `4295ca33…` = base build, shots/freeze/parity carry (skipped).
- Red on base: 5 jest tests fail, G-S64 FAILs (zk)(zl)(xc)(yc) on the eeed5182 bundle. Mutations: m1, m2, m3, m4, m6 each killed; m1b is an equivalent mutant.
- Concern: lifecycle part 3 took 485 s (about 25 s of it new phases); right at the ~480 s line, kept in G-S64.

## 1. Case-1 probe findings
Probe: scratch lifecycle scenarios (a copy of the harness, deleted), real Obsidian 1.15.1, Reading view, Ctrl-hover preview of `[[short note]]` and `[[long note#Tracker]]`, `+` and the Edit pencil in one tick, then Save. Fixtures: one counter, value 5.
- Which body is known: the form's `pinPosition()` runs AFTER the + write landed (`view.openAfterPendingWrite` waits for it). At that moment, in every run: `host.lastKnownBody` = the POST-+ body (`current_value: 6`, keys in the plugin's order), `ctx.getSectionInfo().text` = the PRE-+ note (value 5, whole note with absolute lines, no `src` on the card), `cachedRead` of the note = the POST-+ note (6). So text (section) and body (host, note) disagree only in the block's own body.
- Can the open-time read predate the + write? Not in the form flow: 20 of 20 reads (10 on base, 10 on head) already held the + (short note and long heading). A read that did predate it would equal the section's own text; the existing "the part IS the note" rule then makes a coherent whole-note pin (test "the open-time read predates the +"). A read that holds neither (older still) places nothing (test "holds another body than the host knows"). Refusal frequency in the probe: base refused 10 of 10, head 0 of 10.
- Whole LONG-note hover (`[[long note]]`): the card did not appear within 15 s in either bundle (Obsidian draws it lazily below the fold), so not measured.
- A hover popover hides itself about 0.5 s after the pointer leaves (3 samples in 750 ms) and its form closes with it. Phases hold it with `hp.hide = () => {}` (restored in cleanup).
- Callout `^id` (probe 2): the metadata cache's block position runs over the whole callout (start 15, end 22 for a callout that is 8 lines), the embedded part is 8 lines (`lineStart 0, lineEnd 7`), the `^id` stands on the first non-blank line after the part, after a blank line.

## 2. Design as built (`src/framework/host/ReadingModeBlockHost.ts`)
- `rebasePin`: after `verifiedPinLine` and `searchedPinLine` both give nothing, a third step `openTimeBodyLine(whole, sectionText, pin.lineStart, knownAtOpen)`. `knownAtOpen` is `this.knownBody` read before the `await` (the body when the form opens).
- `openTimeBodyLine` returns a line only when ALL hold: exactly one block of the language in the note read at open holds `known` (`countByBody`); the part's lines before the block's fence and after its end (trailing blanks dropped) equal the note's lines at one place, and the fence line is the same; that place's fence holds `known`. Then `pin.text = whole`, `pin.lineStart = line`, `partialPins.delete(pin)`: an ordinary whole-note pin of the open-time note, so Save's `mapLine` / `pinnedTarget` (pin-only, body check) judges every later outside edit. Otherwise the pin stays partial and Save refuses (existing Notice, form stays open).
- Deviation: the "agreement" check is mine. With the count alone the existing SC-556 test "a heading embed whose block was edited from outside BEFORE the form opened … a twin above holding the old body" goes red (count of the old body = 1, the twin). It is the same hazard at open instead of at Save. The check costs a false refusal when something else in the preview is stale too (rare). The brief's own tests (unique body lands; twin at open refuses; outside edit after open with the twin left refuses; identical block added after open lands in the original) are all met.
- Case 2: `verifiedPinLine`'s `^id` check now starts after `max(counter's closing fence, start + the part's last non-blank line)`. For a plain fenced block the two are the same line (unchanged).
- Not widened: non-embedded cards never reach `rebasePin`; a card (+/-) write with a twin at open still refuses (test); SC-480 fallback untouched (`twinned` / `landsOnOtherBlock` read `partialPins` as before).
- One existing test changed on purpose: "a cache that lags AND a section text that is stale, a long note" now lands (it is the same + then pencil shape in a heading embed; the only block with the known body, text around it agrees).

## 3. Commits
dse (branch sc584-embed-form-save-refusals):
- `5360dcd0` test: host tests, red on eeed5182 (5 new assertions fail)
- `0a1eceba` fix: open-time body rule + `^id` after the part (src only, 52 lines)
- `f9fe9ffc` test: hover helper stales only the + block (so the twin-at-open test fails without the count) + two open-time read tests
- `97a8d04b` test: G-S64 phases (zk) (zl) (zm) (zn) (xc) (yc) (zc), fixtures `gs584-*`
- `525115b0` docs: dse CHANGELOG.md Unreleased bullet
Superproject (branch sc584-embed-form-save-refusals): `0c430d0d` docs: CHANGELOG.md Unreleased bullet (only file committed; the dse pointer is left unbumped for the dispatcher).
`git status --porcelain`: dse clean; superproject ` M draw-steel-elements` (pointer only, expected).

## 4. Gate numbers (own summary lines)
- tsc: `TSC_RC=0` (incl. `-p e2e`). lint: `LINT_RC=0`.
- jest (fresh worktree, full): `Test Suites: 1 skipped, 260 passed, 260 of 261 total` · `Tests: 2 skipped, 7089 passed, 7091 total` (the ledger's 7076 non-skipped, so +13, all in `reading-mode-host-pin.test.ts` 74 → 87). No SC-568 timeout appeared.
- lifecycle (each `npm run obsidian-lifecycle -- --only=…`, own call): part 1 `21/21 ok` 187 s · part 2 `16/16 ok` 341 s · part 3 `9/9 ok` 485 s (G-S64 alone about 138 s) · part 4 `4/4 ok` 317 s · part 5 `3/3 ok` 284 s (loadavg 3-16) = 53/53. The harness moved calls over 180 s to the background; each was read to its end, none failed.
- e2e: `OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs` (256 s, loadavg 12).
- styles.css sha256 `4295ca33cd77d5c337035c332dcf635b82072693fcca44cf760725f0bcb40a01` = the clean eeed5182 build. Shots 592 / host-leak 163/978 / clip 147, freeze 280/280, parity 0/0/24 carry: NOT re-run.

## 5. Red on base
- jest: pin suite on the eeed5182 source with the final tests: `Tests: 5 failed, 82 passed, 87 total` (`sc584-r1-red-on-base-jest.log`). Red: the hover short-note lands, the long heading hover lands, identical block added after open lands, the stale-text + lagging-cache heading embed lands, the callout `^id` lands. The refusal tests pass on both (they guard the hazards).
- lifecycle: G-S64 on the unpatched eeed5182 bundle (`DSE_LIFECYCLE_BUNDLE`): `done: 0/1 ok, 1 failed`; FAILs (zk) (zl) (xc) (yc) ("the form closed after Save" timed out); (zm) (zn) (zc) controls pass (`sc584-r1-red-on-base-lifecycle-G-S64.log`). On the fixed bundle G-S64 is ok.

## 6. Mutations (jest, pin suite; `sc584-r1-mutations.log`)
- m1 skip the open-time count (place on first match): killed by 2 (twin at open, card write). It SURVIVED the first test version (its twin fixture was stale in the wrong block); fixed in `f9fe9ffc`.
- m1b (also take the first anchored match, never refuse two): equivalent, no test can tell it from the count (two anchored matches mean two blocks with the body).
- m2 count at Save time instead of open (no open-time placement, Save searches by unique body): killed by 4 (identical block added after open, own block edited after open with a twin the only match, edited-before-open twin, heading embed twin).
- m3 `^id` marker back after the counter's fence: killed by 1 (callout lands).
- m4 no text-agreement check: killed by 2 (the edited-before-open tests).
- m6 no `^id` marker check at all: killed by 5.

## 7. Evidence artifacts
Report, proposal, logs: see the paths in the return text. Scratch (not evidence): the probes were run from a copy of the lifecycle harness (deleted) and their output kept under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc584-r1-implementer/` (`probe-base1.log`, `probe-head1.log`, `probe-base2.log`, `probe-head2.log`, `probe-head6.log`, `probe-base6.log`).

## Drive-by fixes:
None.

## Follow-ups:
1. A hover over a heading link of a long note shows the card of a counter whose + is refused (SC-480 twin rule) when an identical counter exists elsewhere in the note: the + does nothing but a rate-limited Notice. Seen while building the (zl) fixture; pre-existing, a card write.
2. A hover popover closes itself ~0.5 s after the pointer leaves and takes an open form with it (also noted in (zh)); a form opened from a hover is easy to lose. Pre-existing.
3. Whole LONG-note hover (`[[long note]]`) draws no card for 15 s in the probe: not measured, so not covered.
4. The agreement check refuses where the preview is stale in a second place (note edited around the block before the form opened). Rare; a Notice, nothing lost.
5. Lifecycle part 3 is at ~480 s. Further phases for this area belong in G-S77 (part 5).
