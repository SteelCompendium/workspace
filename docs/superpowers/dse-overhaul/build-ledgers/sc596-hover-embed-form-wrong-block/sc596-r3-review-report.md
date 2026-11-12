# SC-596 r3 review report (independent reviewer; dse c02598c1 on 5f7c5336)

**Executive summary**
- **Verdict: LAND.** CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 3 · INFO 9. No form or card write lands in an identical twin in any real-Obsidian-producible shape I probed (73 probe records + 4 Q4 cells + the 2915-test file). The one twin write I found is the documented SC-594 block-hover residual, which jest can produce and a real pointer cannot (LOW-3).
- Gates re-run at c02598c1: jest **10600 passed / 2 skipped** (77 s) · tsc / tsc -p e2e / lint 0/0/0 · lifecycle part 6 `G-S92,G-S96` **2/2, 174 s** · e2e **`278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`** (SC-257, SC-355, SC-384, SC-580), 141 s · bundle main.js `7786a78e…`, styles.css `5e5ff488…dc2b27` (same as the implementer's). Parts 1-5 carry from the r2 logs (same sha).
- Red on base re-run: new test file **1179 failed / 1736 passed** (392 `not "TWIN"`, 720 `"pin"`), pin test file **9 failed** — both match r2. **G-S96 on my own 5f7c5336 build (main.js `a5245070…`): 7/7 pane cells wrote the TWIN, no Notice; control passed** (71 s). Head: all 8 green, and not vacuous (form open before Save, stale part at open, nothing written, exactly one Notice, form still open, 9 kept).
- G-S64 `(zh)` re-target: correct (the `^id` link names exactly that block, checked by `cardLinkLine`, same rule as G-S92 (d)). Has teeth: on a mutant bundle with no partial pin / no rebase (k25), (zh) FAILS and the note shows the block ABOVE written.
- Q4 checked on my own 4 cells: base wrote the twin in **4/4** (incl. a heading-embed callout shape not in r2's list); head refuses 4/4. The fold was right.
- Mutants (my own k-series, not r2's): **14, 11 killed, 3 survived.** k8 and k15 are equivalent. **k6 is a real gap (LOW-1):** if the `embedded ?` guard at `ReadingModeBlockHost.ts:835` is dropped, a card in a callout of a normal note (not an embed) loses a + with a Notice, and no test fails.
- Q2 CONDITION holds: in an embed, `takePin` can no longer return null, and every refusing pin is refused at `ReadingModeBlockHost.ts:1121`, before anything places the write. I passed one without `pinOnly`, as a form and as a card: refused both times. A form kept open with one cannot write.
- Integrity: the text above and below the block survives both a refused and an accepted Save (probe `intact: true`). Two embeds of the same block: the first Save lands, the second is refused. Embeds of `^a` and `^b`: each lands in its own block. The deleted functions have no callers in src, test, visual-harness, e2e or docs. Worktree clean before and after; none of my Obsidian processes are left running.

## Gates (this review, HEAD c02598c1)
| gate | result | log |
|---|---|---|
| jest (fresh rm of main.js/styles.css first) | 10600 passed / 2 skipped, 265 suites + 1 skipped, rc 0, 77 s, load 3.4 | `sc596-r3-gate-jest.log` |
| tsc, tsc -p e2e, lint | 0 / 0 / 0 | `sc596-r3-gate-tsc-lint.log` |
| lifecycle part 6 `--only=G-S92,G-S96` | 2/2 ok, lc_rc 0, 174 s | `sc596-r3-gate-lifecycle-part6.log` |
| G-S96 on base bundle (my build of 5f7c5336) | 0/1: 7 pane cells TWIN, no Notice; control ok; 71 s | `sc596-r3-lifecycle-gs96-on-base.log` |
| G-S64 on mutant k25 bundle | FAIL incl. (zh): upper block written | `sc596-r3-lifecycle-gs64-k25-mutant.log` |
| e2e | 278/282 ok, 0 failed, 4 known-bug, 171/171, rc 0, 141 s | `sc596-r3-gate-e2e.log` |
| styles.css | `5e5ff488…dc2b27`: shots / freeze / parity carry | (in the lifecycle and e2e logs) |
Lifecycle parts 1-5 carry from `sc596-r2-gate-lifecycle-part{1..5}.log` (same HEAD sha; code last changed in a65207fc).

## Findings

### LOW-1 — the "non-embedded hosts unchanged" claim for the no-own-fence branch is not pinned by any test (surviving mutant k6)
- `src/framework/host/ReadingModeBlockHost.ts:835` `return embedded ? (this.pinFromLastWrite() ?? this.refusingPin()) : null;`
- Mutant k6 (`return this.pinFromLastWrite() ?? this.refusingPin();`, i.e. the guard dropped) passes all 3725 host / hover / form tests.
- It is not equivalent. Probe `sc596-r3-k6-probe.test.ts.txt` (log `sc596-r3-k6-probe.log`) uses a card in a callout of the note itself, not an embed:
  - a + lands;
  - while the callout window is still the one drawn before that + (no own fence), a second + is made;
  - the window is fresh again by the time the write runs.
  - At HEAD there is no pin and the second + lands (`values ["7"]`).
  - Under k6 the pin is refusing, the click is lost, and the "can't tell where" Notice shows (`values ["6"]`).
- Scenario: a later edit drops the `embedded ?` (for example while "unifying" the card and form paths again). Every non-embedded callout, quote, list or footnote card then refuses its second click inside the stale window. Non-embedded list-item forms also start staying open past their card. Nothing in jest catches it.
- Fix: add the k6 probe as a jest test, in `reading-mode-host-form-pin.test.ts` beside the card control at line ~455. Also assert `pinPosition()` is null for a non-embedded list-item host. Fold it into the planned rebase round onto 7866426e.

### LOW-2 — some refusals that used to be saves are not named in the report or the CHANGELOG (refusing pins when the body is unique)
- `ReadingModeBlockHost.ts:828` and `:835` (refusing pin), with the refusal at `:1121`. CHANGELOG: `worktrees/sc596-hover-embed-form-wrong-block/CHANGELOG.md:11`.
- Probe `sc596-r3-probe.test.ts.txt` (logs `sc596-r3-probe-{base,head}.log`). Each line is base -> head:
  - `CARD stale callout no twin` (a card + on a `^cal` embed, block written by another pane, no record, no identical block anywhere): base wrote the right block (`3,7`); head refuses with "can't tell where".
  - `CARD section gone no twin`: base wrote the right block; head refuses.
  - `FORM stale callout no twin`: base saved into the right block; head refuses.
  - `NESTED two same-name subheadings` (`![[note#P2#Tracker]]`; `## Tracker` under both P1 and P2, with identical counters): base saved into P2's (right); head refuses. This is a variant of the ruled Q1 class: the nested link actually names one place, but `cardLinkLine` counts every `## Tracker` in the text. Cards have done the same since SC-594.
- All are safe (nothing is written, one Notice). All fall under Scott's 2026-11-10 ruling and the "when unsure, refuse" invariant. All need the same rare moments: a click within ~20-45 ms of an outside write, or a transient section loss.
- The r2 report's Q4 and Q2 tables only list the shapes where a twin is present. The CHANGELOG says the card is refused "instead of being written into an identical counter". It is also refused when no identical counter exists.
- Fix (docs only): one clause in the CHANGELOG bullet and the dse-verify proposal §1 "Saved -> refused by design". For example: "a stale callout with no record of this window's own save, or a block whose section is gone at the click, is refused even when no identical counter exists; a nested heading link (`#Parent#Heading`) of a note with two headings of that name and identical counters is refused like two `## Tracker` sections". No code change.

### LOW-3 — forms now inherit the SC-594 block-hover residual (jest-only)
- `ReadingModeBlockHost.ts:862` (forms now ask `hoverLinkOf`) and `src/framework/host/hoverLinks.ts` `popoverShows` (it cannot tell two block previews apart).
- Probe `WRONG BLOCK LINK`: a block hover showing A, bound to `Note#^b` (both draw `data-type=block`), with the identical counter B carrying `^b`.
  - Head: Save writes **B (the twin)**, no Notice.
  - Base: refused, because base forms never used the hover link, and the text search found two runs.
- Cards have done exactly this since SC-594. dse-verify documents it: "It does NOT tell two BLOCK previews apart … a real pointer cannot produce that in 1.15.1 (r3), jest can". The bind-at-first-lookup / bind-at-next-event rule applies to forms the same way, so real-Obsidian reachability does not change.
- Fix: document in the dse-verify proposal (§3/§4) that a form's hover pin shares this residual. Optional follow-up for the owner, not this ticket: render-side evidence of the block id, or a refusal while the body occurs twice and the bound link is a `^id` without a matching DOM id. I do not recommend the refusal: it would re-refuse the 36 hover cells.

### INFO
- **I-1 Q2 CONDITION verified against the code.** In an embed, `takePin` returns null only on the non-embedded branches (`:828`, `:835`), so every embedded form has a pin. The shapes that newly stay open past their card (with a second pane) are exactly the null -> refusing ones. That covers the implementer's list (list item, footnote, stale non-plain window with no record, section null at the pencil, never-resolved section). It also covers a non-plain window where `locateInSection` returns `'ambiguous'` (no own fence), which the r2 table does not name. A refusing pin is a fixed object with no `pinRebased` entry, so it is never rebased or replaced. `replaceSource` refuses it first (`:1121`), whatever `pinOnly` / `fromView` say (probe `REFUSING without pinOnly`: r1 false, r2 false, nothing written). So none of these kept-open forms can write. Mutants k1, k3 and k13 (the refusal turned partial-only, silent, or limited to pin-only callers) are all killed.
- **I-2 Q4 independently confirmed.** `sc596-r3-q4-probe-{base,head}.log`: base `ok:true` and the UPPER (twin) block written in Q4a (P13 shape), Q4b (heading-embed callout, stale, no record — not in r2's list), Q4c (block hover callout) and Q4d (section gone at the click). Head: `ok:false`, one Notice, all four. On my base run all 5 of r2's card tests fail with `Expected: false, Received: true` (the write happened).
- **I-3 G-S64 (zh).** The re-target is correct: `[[note#^id]]` names the lower block; `cardLinkLine` needs exactly one `^id` marker line while the body occurs twice, the part equal to the note at the cache's block line, the fence holding the known body and the `^id` right after it. The new assertion `now === before` with only the lower `name:` replaced, plus `noNotices`, fails on k25: `name: Edited` lands in the upper block.
- **I-4 G-S96 not vacuous.** Each pane cell asserts `staleAtOpen`, `formOpenBeforeSave`, note == the outside edit, exactly one `…changed on disk first.` Notice, `formOpenAfterSave`, and 9 kept. On base all 7 reach Save and write the twin. The control cell is vacuous by design and labelled so.
- **I-5 Surviving mutants that are equivalent.** k8 (the hanging-heading branch allowed for `^id` links) is safe because a block link still needs its `^id` marker right after the found fence and, with a twin, exactly one marker line. k15 (`pinFromLastWrite` without its body check) is equivalent: `knownBody` and `lastWrite.body` are only ever set together (`:703-704`, `:1166-1170`). The other 11 are killed: k1 729, k2 492, k3 809, k4 3, k5 604, k7 14, k9 51, k13 5, k14 1, k20 128, k24 1140 failing tests. k9 (always the strict one-place check) is killed by J7 / J11, so the tests do pin the unique-body relaxation.
- **I-6 Probe shapes that are safe or improved** (`sc596-r3-probe-*.log`):
  - Alias in `src` / linktext (`#^a|x`, `#Tracker|x`): always refused at head, never a twin. At base, `ALIAS block embed edited` wrote the TWIN. Obsidian should strip aliases (unverified, same as cards).
  - Trailing spaces and punctuation in a heading: saves A when nothing was edited, refused when A was edited. At base the hover variants wrote the TWIN when A was edited.
  - Edit while open (A edited, A deleted, identical counter inserted above, B deleted): never a twin, text outside the block intact.
  - One + then the pencil, two + then the pencil (plain and callout, heading hover and embed): saves A; with an outside edit after the +es, refused.
  - A + from a second (pane) host, then the embed's form: refused.
  - `cachedRead` lagging the note (both cache states): refused. Base saved A there; that case is not realistic.
  - Callout DOM ordinal in a heading hover: the lower counter.
  - Plain non-embedded forms: identical on base and head.
- **I-7 Probe artifact (not a finding):** the `## Tracker ##` row refuses at head only because my cache mock keeps the closing `##` in the heading name. `atxHeadings` strips it (`headingNames.ts`).
- **I-8 Card round pinning:** a card round's FIRST persist intent takes the pin (`:715`, `!this.pendingPin`). A transient missing section at that first click now pins the whole round to a refusing pin; before, a later intent in the round could still pin it. This is the existing SC-552 first-intent rule and needs a section loss in an embed. Noted, no fix.
- **I-9 Deleted code:** `rebasePin`, `verifiedPinLine`, `embedStartLine` and `searchedPinLine` have no hits in dse src, test, visual-harness, e2e or docs. The only references left are in the workspace dse-verify SKILL, which the proposal already rewrites.

## Probe artifacts (all in this directory)
- Jest probe (73 records): `sc596-r3-probe.test.ts.txt` -> `sc596-r3-probe-head.log`, `sc596-r3-probe-base.log` (runner `sc596-r3-run-probe.sh.txt`; base = `git checkout 5f7c5336 -- src/framework/host/ReadingModeBlockHost.ts`, restored with `git checkout HEAD --`).
- Q4 cells: `sc596-r3-q4-probe.test.ts.txt` -> `sc596-r3-q4-probe-{head,base}.log`.
- k6 probe: `sc596-r3-k6-probe.test.ts.txt` -> `sc596-r3-k6-probe.log`.
- Mutants: `sc596-r3-mutate.py.txt`, `sc596-r3-run-mutants.sh.txt` -> `sc596-r3-mutants.log`.
- Red on base: `sc596-r3-jest-red-on-base.log`.
- Bundles: `sc596-r3-build-bundles.sh.txt` (git archive exports in my scratch folder: base-tree main.js `a5245070…`, k25-tree main.js `7aa49a5f…`), lifecycle runner `sc596-r3-lc.sh.txt`.
- I deleted my kept lifecycle FAIL dirs `/tmp/dse-obsidian-lifecycle-x8L5M4` and `/tmp/dse-obsidian-lifecycle-FyD9wb` by literal path.
