# SC-594 r3 independent adversarial review (reviewer-r3), dse 0bf5989d (range e0e49d4d..0bf5989d), superproject 088a24fb

**Executive summary**
- **Verdict: FIX FIRST.** Counts: CRITICAL 0 · HIGH 1 · MEDIUM 1 · LOW 3 · INFO 5.
- **HIGH-1 (real Obsidian, RV and LP):** a heading hover whose metadata cache lags an outside edit (the same 17-44 ms window as P14 / G-S92 (h)) writes the WRONG counter with no Notice. `## Other` moved above `## Tracker`: HEAD writes Other, base refused. Identical `## Tracker` section pasted above (J8's shape): HEAD writes, base refused. The hovered section deleted: HEAD writes the identical counter under `## Other` (base did too, but the CHANGELOG says "removed from outside ... still not saved"). Cause: `cardLinkLine` trusts the cache's heading line and heading count, and never checks the heading line itself (the `start + 1` path).
- MEDIUM-1: both CHANGELOG bullets and the dse-verify proposal claim refusals that do not hold ("removed from outside", "a lagging metadata cache", "a link that names two places"; "already open when the plugin loaded" holds only because Obsidian closes the preview).
- LOW-1: **mL2 is NOT equivalent.** It is a test gap. r3 probe P1 kills it: a second + after an outside revert in a stale callout window writes the sibling counter without the guard. LOW-2: the memo/residual class (and a whole-note link bound to a heading preview) writes the twin in jest. It cannot be reached by pointer in Obsidian 1.15.1 (measured plus the app.js source), so the fix is cheap hardening. LOW-3: a heading whose name has `:` is refused (T6).
- Owner points: memo deviation ACCEPTABLE. The residual is unreachable by pointer (INFO-1), and r2's "the whole-part check still limits it" is false for a whole-note link (P2b/P3b). mL2 is a test gap (P1). The G-S92 control is not vacuous: it lands in the window (INFO-2).
- Gates on HEAD: tsc/lint clean · jest 7616 passed / 2 skipped · lifecycle p5 7/7 (426 s) · p3 9/9 (408 s) · e2e 270/274 ok, 0 failed, 4 known-bug, 169/169 pairs · styles.css 5e5ff488 = base (shots/freeze/parity carry).

## Findings

### HIGH-1: a heading hover whose metadata cache lags places the + by the cache. The wrong counter is written with no Notice (two shapes are regressions vs base)
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:980` (`start` from `resolveSubpath(meta, …)`), `:990` (the one-place check counts `meta.headings`, from the cache), `:999` (`partStart = start + 1`: the part of a heading hover is the heading's BODY, so the line `start` is never compared with anything), `:984` (the one-place check is skipped when the known body is unique).
- **Scenario (real Obsidian 1.15.1, scratch scenario P594R3 T7; a heading hover `[[src#Tracker]]`, `## Tracker` and `## Other` each holding the identical counter 5; an outside `vault.process` edit, then a scripted + on the old card in the SAME page task, exactly as G-S92 (h) does).** The cache at the click and in the next task still reads `Tracker@4, Other@13` (recorded):

  | edit | HEAD 0bf5989d (RV and LP) | base e0e49d4d |
  |---|---|---|
  | `## Other` section moved above `## Tracker` | **wrote Other** (`[6,5]`, Other first), no Notice | refused, 1 Notice |
  | identical `## Tracker` + counter pasted above (J8) | **wrote the top one** (`[6,5,5]`), no Notice | refused, 1 Notice |
  | `## Tracker` section deleted | **wrote the identical counter under `## Other`** (`[6]`), no Notice | same (pre-existing) |

  Mechanism: the stale `start` (4) now holds `## Other`. `lines[start + 1]` is the blank line that opens the identical body, the whole-part check passes there, and the fence holds the known body. In the delete shape the known body is now unique, so the one-place check is skipped (`:984`). Jest: P9a/b/c red on HEAD (stale cache = the cache of the pre-edit text). The suite never models a lagging cache for a heading hover: J15 does so only for a block, where the `^id` marker check refuses. The sweep has no "own deleted" or "sections moved" edit.
- **Reachability:** the same as P14, which the ticket's agent notes require to be refused: a click that lands after an outside write and before the preview redraws.
- **Fix:** in `cardLinkLine`, for a heading link, resolve the place from the note TEXT, not the cache:
  - (a) count the ATX heading lines in `whole` whose name matches the link, outside fences, with Obsidian's name normalization; this replaces `meta.headings` at `:990`.
  - (b) require the line the part hangs from (`start` when `partStart = start + 1`) to be that heading line in the text, or simply derive `start` from the text's unique heading of that name and refuse if the cache disagrees.
  - (c) keep the one-place requirement even when the body is unique, because the hovered block deleted with its twin left is the "unique" case.

  Tests: P9a/b/c as named jest tests. Add sweep edits "own deleted" and "sections swapped" with a lagging cache for the heading shapes. Add a G-S92 trial (j): swap by `vault.process`, then a scripted + in the same task: nothing written, one Notice. It is red on 0bf5989d per T7 and base refuses it.
- **Evidence:** `sc594-r3-probe-obsidian.txt` (sections "HEAD: T7" and "BASE … T7"), `sc594-r3-probe-jest.test.ts.txt` (P9a-c), `sc594-r3-probe-jest-head.txt`.

### MEDIUM-1: the docs claim refusals the code does not guarantee
- **Where:** dse `CHANGELOG.md:25-35`, superproject worktree `CHANGELOG.md:11-21`, and `sc594-dse-verify-proposal.md` §2 "Still refused".
- **The claims:**
  - "Still not saved, with the Notice: … a counter that was edited or **removed** from outside before the click": false for a heading hover with an identical counter elsewhere (HIGH-1 delete).
  - "a link that names two places … while the counter's contents also occur twice": false while the cache lags (HIGH-1 paste).
  - The proposal's "a lagging metadata cache" is listed as refused: false for heading hovers.
  - "a preview … that was already open when the plugin loaded": the code binds such a preview to the next pass-over's link (P2, writes the twin in jest). It holds in practice only because turning the plugin off and on closes the open preview (T5 `popOpenAfterReload: false`).
- **Fix:** after HIGH-1, re-check each listed refusal against a test. Otherwise drop "removed" and the lagging-cache item, and qualify the two-places item. (The stale SC-595 clause is already ruled FOLD and is not repeated here.)

### LOW-1: mL2 (the r7 guard for cards) is not equivalent. It is a test gap
- **Where:** `ReadingModeBlockHost.ts:836` (`if (embedded) {` … `pinFromLastWrite()`).
- **Scenario (jest P1, heading hover and block hover; two counters in one callout, upper 5 and lower 6):**
  1. + on the UPPER counter: it becomes 6 and now reads like the lower one.
  2. Before the redraw, an outside edit puts the upper counter back to 5, so the note equals the stale part again.
  3. Second +: the stale window holds the known body 6 only in the LOWER fence, so `findOwnFence` picks the sibling.
  4. With the guard, the own last write is taken; its fence now holds 5, so the + is refused (note unchanged). With mL2, the whole-part check passes and the fence at the lower line holds the known body, so the **lower counter is written** (`[5,7]`).
- **Evidence:** `sc594-r3-probe-mutants.txt` (`mL2 … 7 failed`: P1 heading + P1 block, plus the 5 probes that also fail on HEAD); P1 passes on HEAD.
- **Fix:** add P1 as a named test (J19) to `reading-mode-host-hover-card.test.ts`, and change the "defence in depth" wording in the r2 report and proposal to "load-bearing (P1)".

### LOW-2: the binding can name another link's place (memo residual, plugin-load claim). With a whole-note link this skips the whole-part check entirely
- **Where:** `src/framework/host/hoverLinks.ts:66` (`hoverLinkOf`: the newest event whose LIVE `hoverParent.hoverPopover.hoverEl` is the popover), `:49` (bind-at-next-event), `ReadingModeBlockHost.ts:851-852` (a hover link without `#` makes the pin NOT partial).
- **Scenarios (jest):**
  - P2: a preview open before the plugin loaded, then a pass-over of `[[Note#Other]]` (identical body) on the same parent: **writes Other**.
  - P3: the residual r2 names (Y's event before X's preview exists): **writes Y's counter**.
  - P2b / P3b: the same with a whole-note Y `[[Note]]` and the twin ABOVE: the pin is taken as a pin of the note although it is in the part's coordinates. `mapLine` of the part against the note writes the **twin above**. So r2's statement that "the whole-part check still needs Y's part to equal X's part" is false for a whole-note Y.
- **Reachability in Obsidian 1.15.1: not by pointer** (INFO-1), and a plugin reload closes the preview (T5). Hence LOW.
- **Fix (cheap hardening):**
  - (a) cross-check the bound link against the popover's own DOM. r1 measured `.markdown-embed[data-type=heading|block]` and the rendered heading's `data-heading`. A `#H` link needs `data-type=heading` and a matching first `data-heading`; a `#^id` link needs `data-type=block`; a link with no `#` needs neither (whole note). Otherwise refuse. This closes P2, P3, P2b and P3b for headings and every kind mismatch.
  - (b) in `registerHoverLinks`, bind every `.hover-popover` already in the document to null, so the CHANGELOG's plugin-load claim holds by construction.
  - Tests: P2, P2b, P3, P3b.

### LOW-3: a heading whose name has characters Obsidian drops from links is refused when the counter has a twin
- **Where:** `ReadingModeBlockHost.ts:990`. The name is compared exactly after lowercasing; Obsidian's `resolveSubpath` is laxer.
- **Scenario (real Obsidian, T6):** `## Tracker: one` linked as `[[src#Tracker one]]`. The preview shows the counter; + is refused with 1 Notice (`[5,5]`). It is safe and base also refused, but the CHANGELOG's "still not saved" list does not name it.
- **Fix:** fold into HIGH-1 (a), normalizing heading names the way Obsidian does, or list it.

### INFO
- **INFO-1, the memo deviation and its residual (owner point).** The deviation (bind at the first lookup OR at the next event) is sound, and the residual cannot be reached by pointer. Measured and read from the 1.15.1 `app.js`:
  - `hoverParent.hoverPopover` is set only in `HoverPopover.onShow` (after the 300 ms wait). At a second link's event the parent still holds the SHOWN popover: T1 RV and LP record `pop: p1`, X's own. So the next-event bind binds X to X. Y's preview then opens and its + writes Y's counter (`[5,6]`, as wanted).
  - A pending popover hides as soon as the pointer leaves its target (`transition()`: `state 0 && !shouldShow -> hide`). Re-entering the target fires a fresh `hover-link`, so the newest event is X again.
  - The one preview that opens without its own event: in LP, a no-Ctrl hover followed by the Ctrl key. Page-preview then calls `onLinkHover` directly (T4: no new event). It still gets the right link, because the newest event of that parent is the hovered link (`[6,5]`).
  - "Pass-over Y, then + in X" works on HEAD (r2's measurement; the J17 shape).
- **INFO-2, G-S92 has teeth (owner point).**
  - Base log: (g) and (h) wrote the identical counter `[9,6]`, so the scripted click lands inside the window.
  - HEAD: (g) and (h) give exactly one dropped-write Notice with the note unchanged. A click on a redrawn card would have written A = 10 and failed the trial.
  - T7 records `connected: true` for the old button at the scripted click and a still-stale cache in the next task.
  - (i) was refused on base and lands on HEAD.
- **INFO-3, mutants (`sc594-r3-probe-mutants.txt`).**
  - r2's 20 reproduce: mA-mL and mN-mS killed. mM survives (equivalent, agreed). mL2 is killed only by r3's P1 (LOW-1).
  - Reviewer mutants:
    - mX13 (unconditional `await` in `replaceSource`) is killed by the FULL suite: 3 SC-340 / SC-544 tests, which confirms r2's conditional-await claim.
    - mX11 (no heading count) is killed by J8.
    - Survivors:
      - mX6 (allow `start + 1` for block links): near-equivalent.
      - mX10 (no link-destination check): a test gap, e.g. a bound link to another note.
      - mX12 (no duplicate-`^id` count): a test gap, e.g. two `^a` markers with a twin body.
- **INFO-4, no regression seen in these probes.**
  - T3 (callout with two counters, + on the lower one, redraw): the view is adopted back onto its own block (`rootsAfterRedraw ["fresh","H"]`). A second + on the upper counter gives `[7,6]`; on the lower one, `[6,7]`. The `lastWrite` record is not carried onto a twin element in this shape.
  - P5: the twin BELOW the section (the sweep only places it above), plain and callout, with nothing edited / own edited / identical added below: correct.
  - P7: a closed X and then Y on the same parent: correct.
- **INFO-5, not covered.**
  - A preview switched to editing (`is-editing`): my click did not enter it (T8 `editing: false`; the + wrote correctly).
  - Nested previews and two panes: covered by jest only (J9 / J10 identity).
  - G-S92 has one hover per trial. T1 ("hover X, then Y opens, + in Y") is not in G-S92 (about 8 s if added; part 5 is at 426 s).

## Gates (HEAD 0bf5989d; logs in the ledger dir)
- tsc incl. `tsc -p e2e`: `rc=0`, `rc_e2e=0`. lint (`eslint src main.ts e2e`): `lint_rc=0` (`sc594-r3-gate-tsc-lint.log`).
- jest full: `Test Suites: 1 skipped, 264 passed, 264 of 265 total` / `Tests: 2 skipped, 7616 passed, 7618 total` (54 s; `sc594-r3-gate-jest.log`). This equals r2's number; no load timeouts.
- lifecycle part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S92`: `OBSIDIAN-LIFECYCLE done: 7/7 ok, 0 failed`, wall 426 s, loadavg 0.99 (`sc594-r3-gate-lifecycle-part5.log`).
- lifecycle part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64`: `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed`, wall 408 s, loadavg 3.65 (another effort, SC-589, ran its own part 3 at the same time) (`sc594-r3-gate-lifecycle-part3.log`).
- e2e: `OBSIDIAN-E2E done: 270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (known bugs SC-257, SC-384, SC-580, SC-355), rc=0, wall 141 s (`sc594-r3-gate-e2e.log`).
- styles.css: sha256 `5e5ff4884e05fb2a…` for HEAD's build and for a build of the e0e49d4d versions of the two changed `src` files (main.js `0867e634…` vs `607c7bd5…`, both equal to r2's), so shots / host-leak / freeze / parity carry (not re-run).
- Parts 1, 2 and 4 were not re-run (the brief asked for parts 5 and 3).

## Artifacts (ledger dir)
- `sc594-r3-probe-jest.test.ts.txt`: P1-P9; ran uncommitted as `test/dom/framework/sc594-r3-probe.test.ts`, now removed.
- `sc594-r3-probe-jest-head.txt`
- `sc594-r3-probe-mutants.txt`
- `sc594-r3-probe-mutate.py.txt`
- `sc594-r3-probe-lifecycle-scenario.mjs.txt` and `sc594-r3-probe-make-scratch.py.txt`: the scratch harness copy `visual-harness/obsidian-lifecycle-scratch594r3.mjs`, created and deleted per run.
- `sc594-r3-probe-obsidian.txt`: every real-Obsidian record, HEAD and base.
- `sc594-r3-gate-*.log`
