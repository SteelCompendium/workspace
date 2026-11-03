# SC-547 r2 independent review — per-pass fence-list cache

## Executive summary
- **Verdict: FIX-NEEDED** (one MEDIUM, a one-line fix; I tried it in scratch and it works). Reviewed dse `cb56f128` on develop `0698550f`, superproject `04aaaafd`.
- Findings: HIGH 0 · MEDIUM 1 · LOW 1 (it was already on develop, not caused by this change) · INFO 3.
- MEDIUM-1: the fence cache key `lineStart:lineEnd:language` does not record which note text the fences were read from. In real Obsidian 1.15.0, `getSectionInfo` is NOT null for a block in a callout that embeds a section of its own note. When that callout's window has the same line numbers as an editor callout (`2:8`), the two hosts in one pass share an entry. I reproduced it: on HEAD the embedded card is redrawn as "Counter: failed to render (parse) Not a YAML token: ```ds-counter". On develop it shows "Beta". With the fix it shows "Beta".
- Equivalence otherwise holds. A fuzz of 47,605 block lookups (2000 random notes: tildes and backticks, whitespace before the language, nested quotes, non-DSE fences, unterminated fences, callouts back to back, windows sharing a first line, null sections) gives the same answers with the cache as develop's pass.
- Cache lifetime holds. A fresh memo is made in each `reconcile`. Mutant (b), the caches surviving across passes, goes red in jest (scan-count test 4 -> 2) AND in real Obsidian (G-S57 FAIL). Mutant (a), drop the cache, goes red (`Expected: 2, Received: 80`).
- cost-big, re-measured (typing pass mean, ms; dev 0698550f -> HEAD): run a 7.65 -> 0.93, run b 6.62 -> 1.12. Keystroke dispatch 9.15/7.83 -> 2.28/2.92. Scroll frame mean/p95: dev 21.6/33.5 and 22.0/37.9, HEAD 19.0/30.6 and 20.5/34.4. **Confirms r1's numbers** (r1: 6.57 -> 0.90; 21.3/32.8 -> 18.7/27.1).
- many-scroll: the scroll jumps are the same on HEAD and develop 0698550f (`down [[3,800,773],[36,7373,7330]]`, `up [[77,136,162],[78,-38,0]]`). Per the owner's ruling: DROP. No false remounts and no stale cards in far, far-form, raw-lower-100, many-scroll or many-write, on both bundles.
- Gates on HEAD: tsc and lint clean. jest 6380 passed / 1 skipped / 253 of 254. lifecycle 49/49 (21+16+7+4+1; G-S57, G-S61, G-S59 ok). e2e 128/128, 89/89. `styles.css` is byte-identical to 0698550f (sha256 93be34af…), so shots, freeze and parity were not run.
- Tree: same before and after. The plugin worktree is clean; the superproject shows only ` M draw-steel-elements`, the pointer that is deliberately not bumped. No commits.

## Findings

### MEDIUM-1 — fence cache hit across two different texts in one pass (wrong redraw of a self-embedded card)
**Where:**
- `src/framework/host/ReadingModeBlockHost.ts:250-259` (`windowFences`: the key is `${section.lineStart}:${section.lineEnd}:${language}`, and the hit check at :251 never compares the `lines` the entry was read from).
- The two text sources come together at `:680-687` (`reusedBlockBody`). The section is `ctx.getSectionInfo(this.el)`, which is Obsidian's text, and that can be an *embed's* text with the embed's own line numbers. Only when that is null does it fall back to `livePreviewCalloutSection` (the editor's `scope.text`). Both go to `fenceOnElement(…, scope)` with the same `memo.fences`.

**Reachability, measured in real Obsidian 1.15.0** (gsi probe in the `reusedBlockBody` wrapper, `sc547-r2-r3-instr.js`):
- `embed` case (`sc547-r2-runs/g1-head`), a callout that embeds `![[embed#Section]]` of its own note. The embedded copy (R2) is drawn inside the Mirror callout widget, so the scoped pass judges it (same `sourcePath`, inside `.cm-embed-block.cm-callout`). Its `getSectionInfo` is non-null in 23 of 36 scoped calls. Every time it is the embed's text (113 chars against the editor's 178), at embed-relative lines `2:8`. Directly drawn callout blocks had a null `getSectionInfo`, as SC-455 measured.
- `collide` case (fixture in `sc547-r2-mk.py`; runs `sc547-r2-runs/c2-head`, `c2-dev`, `c3-fix`):
  - Callout A sits at document lines 2-8, with its fence at 3-8.
  - Callout B is under `## Section`, at 2-8 of that section's text, with its fence at 4-8 (a `>` line comes first).
  - A Mirror callout holds `![[collide#Section]]`.
  - The probe saw the key `2:8` from both the editor's text and the embed's text in one pass (`mixedPasses` 19 on develop).
  - **HEAD:** event log `release R3 reason reused-by-twin` (the embedded Beta). The Mirror widget then reads `Mirror Section B Counter: failed to render (parse) Not a YAML token: ```ds-counter …`. A's fence span (3-8) was applied to B's embed lines, so the body starts with the fence line.
  - **develop 0698550f:** no release. Mirror shows `Beta`.
  - **Fix bundle:** no release. Mirror shows `Beta`.
- Jest version of the same mechanism: `sc547-r2-equivalence-probe.test.ts.txt`, test "ONE memo, two hosts…". The cached answer is `{lineStart:7,lineEnd:9,body:"> ```ds-counter"}`; the uncached one is `{lineStart:8,lineEnd:10,body:"name: B"}`.

**Failure scenario:**
- A note has a callout near its top. The same note embeds one of its own heading sections (`![[#Section]]`) inside another callout, and that embedded section holds a callout with the same relative line span but a different fence layout.
- Then every editor pass (keystroke, scroll, cursor move) can falsely remount whichever of the two hosts is judged second, from a wrong body. The card shows a parse error, or the wrong block's content.
- The precondition is rare, but it is a correctness regression against develop, and it breaks the cache's own contract ("changes no answer").

**Prescribed fix** (tried in scratch: `sc547-r2-mut.py` mutant `fixkey`, bundle built from `git archive cb56f128`):
- In `windowFences`, store the `lines` array with each entry and count a hit only for the same array. `linesOf` returns one array per text, so the normal pass, where every host reads `scope.text`, still hits every time:
  ```ts
  const hit = cache?.get(key);
  if (hit && hit.lines === lines) return hit.spans;
  …
  cache?.set(key, { lines, spans: fences });
  ```
  The type becomes `Map<string, { lines: readonly string[]; spans: readonly FenceSpan[] }>` (in `PassMemo.fences` and both signatures).
- An equivalent fix is to key by text. Keying by the `lines` array is cheaper.
- Measured with the fix: collide is clean, and cost-big's typing pass is 0.90 ms, scroll frame 20.1/30.7 (`sc547-r2-runs/cost-fix-a`). So no performance is lost.
- Add a jest test: one `newPassMemo()`, two `fenceOnElement` calls with the same window bounds and different `section.text` (the R2-MIXED case in the probe file), asserting the second equals its uncached answer.
- `windowEnds` needs no change. It is only filled and read inside `calloutWindow` from `linesOf(scope.text)`, which is one text per pass. The unscoped path passes `undefined`. A comment saying so would help.

### LOW-1 (already on develop, not caused by this diff) — SC-537 `blocks` cache keyed by the quote element only, not by alias
**Where:** `ReadingModeBlockHost.ts:357-361` (`quoteOrdinal`). `cache.get(top)` returns the block list of whichever alias asked first. A block of a second alias then gets `indexOf` = -1. With two or more blocks of that alias in the callout, `locateInSectionLines` returns `'ambiguous'`, so the lookup gives null. This is unchanged since SC-537: `memo?.blocks` is develop's `scope?.blocks`.

**Evidence:** probe test "pre-existing SC-537 blocks cache…". `quoteOrdinal`: first alias 0, second alias -1 with the cache and 1 without. Fence lookup over a callout of 2 ds-counter + 2 ds-other blocks: in a pass `[3,7,null,null]`, alone `[3,7,11,15]`. The fuzz counted 57 notes where develop's pass differs from a lookup with no cache for this reason, and the same 57 on HEAD.

**Failure scenario:** a Live Preview callout with two or more blocks each of two DSE aliases. The SC-537 twin check never judges the second alias's blocks, so a reused widget of that alias stays stale. That is the SC-537 bug, for that alias only.

**Fix (for a new Backlog ticket, not this one):** key the cache by top element and alias (`Map<Element, Map<string, Element[]>>`, or the key `top` plus `alias`). The r1 test "the pass cache changes no answer" only passes because its second alias has a single block. Its 2-alias claim should not be read as coverage of this case.

### INFO-1 — the windowEnds lifetime and the cache key have no direct test
- Mutant `hoist-ends` (only `windowEnds` kept across passes) does go red. But that is only because earlier tests in `twin-reuse.test.ts` leave state behind: the six-block test reads 11 against 1, the 40-block test 122 against 2. No test asserts it on purpose.
- Mutant `nokey-lineend` (key without `lineEnd`) survives every tracked test; only the r2 fuzz catches it. Inside one text a pass sees one window per `lineStart`, so this is not reachable today.
- Optional: once MEDIUM-1 is fixed, its new test can also cover these.

### INFO-2 — scope check: clean
- The diff touches only `ReadingModeBlockHost.ts` (hunks in `windowFences`, `locateInSectionLines`, `PassMemo` and `newPassMemo`, `calloutWindow`, `fenceOnElement`, `livePreviewCalloutSection`, `reusedBlockBody`), `remountReused.ts:24,108`, and the test.
- It does not touch `livePreviewReconcile.ts` (the set of updates that run a pass is unchanged), `replaceSource` (:730, SC-552), the LP click path (SC-545), or `previewScrollPin.ts` (SC-472).
- Callers of `fenceOnElement`:
  - `remountReused.ts:78` (`remountVacated`, no memo).
  - `reusedBlockBody`. Its memo is `scope`, and `scope` is undefined on the processor-time `reconcile`.
- So the uncached callers run exactly develop's code path (`cache` and `windowEnds` undefined, which means a full scan).

### INFO-3 — artefact from the G-S57 mutant run
The tracked lifecycle harness kept its failure temp dir `/tmp/dse-obsidian-lifecycle-zNmZ1a/` (with `G-S57-FAIL.png`) from my hoist-mutant run. I copied the screenshot to the ledger dir. I did not delete that dir: it is a shared `/tmp` path, so the brief's rm rules apply.

## Probes run (all on HEAD cb56f128 unless named)
1. **Equivalence** (jest, temporary file, since removed; copy in `sc547-r2-equivalence-probe.test.ts.txt`, log `sc547-r2-jest-equivalence-probe.log`):
   - Fuzz: 2000 seeds, `compared=47605 nonNull=17733`. HEAD's memo equals develop's pass (blocks cache only) on every block, in forward order and in reverse order.
   - Hand cases: tildes, `` ``` ds-counter ``, a ds line inside a js fence, a nested `> >` quote, a 4-backtick fence, an unterminated last fence. The cached and uncached answers are equal (`[[3,5],[7,9],[15,17],[19,22],null,null,null]`, with and without a nested blockquote).
2. **Lifetime:**
   - The pass memo is built in `reconcile` (`remountReused.ts:103-109`), once per call.
   - Temporary behaviour test (`sc547-r2-lifetime-test.py`, inserted into the `lp()` describe, then restored): an edit inside the callout between two passes that keeps the line count but moves Y's fence up one line. HEAD redraws correctly (`["X=5|false","Y=3|false"]`). The `hoist-fences` mutant shows broken cards (`["=|true","=|false"]`). Logs `sc547-r2-jest-lifetime-{head,hoist-fences}.log`.
   - Real Obsidian, cases where scrolling brings a new callout into view: far, far-form, many-scroll, many-write. All clean, no false remounts on either bundle (`sc547-r2-runs/p1-{head,dev}`). many-write's two `reused-by-twin` releases are the intended SC-537 redraws after a + click. HEAD and develop give the same pair.
3. **Real Obsidian:**
   - G-S57 and G-S61 ok in part 4 (`sc547-r2-gate-lc4.log`).
   - r5 cases far, far-form and raw-lower-100 clean. many-scroll: 0 bad cards, 0 false remounts. many-write: 0 bad cards.
   - many-scroll per-pass mean: HEAD 0.28 ms, dev 0.26 ms (433 passes of 4 entries on the post-SC-472 develop; r1's 1080/40 was the pre-SC-472 shape).
   - cost-big and cost-large: two runs per bundle, interleaved (`sc547-r2-cost-summary.txt`). cost-large is unchanged, as expected (typing pass about 1.1 ms on both).
4. **Mutants** (full jest each):
   - (a) `drop`: red, `Expected: 2, Received: 80`.
   - (b) `hoist` (both caches): 3 tracked tests red.
   - `hoist-fences`: red, `Expected: 4, Received: 2`.
   - `hoist-ends`: red, but only through state left by earlier tests (INFO-1).
   - `nokey-lang`: red (r1 test 2).
   - `nokey-lineend`: survives the tracked tests (INFO-1).
   - The `hoist` bundle in real Obsidian: **G-S57 FAIL** (cards show `[6,6,5,3]` while the blocks hold `[6,3,5,3]`; `sc547-r2-lc-hoist-G-S57.log`, `.png`).
   - The source file was restored after each mutant.
5. **Gates:** listed in the summary. Logs `sc547-r2-gate-{tsc,lint,jest,lc1..lc5,e2e}.log`.

## Artefacts (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc547-lp-twin-check-perf/`)
- Gates: `sc547-r2-gate-*.log`
- jest probes and mutants: `sc547-r2-jest-*.log`, `sc547-r2-equivalence-probe.test.ts.txt`, `sc547-r2-lifetime-test.py`, `sc547-r2-mut.py`
- Real-Obsidian harness: `sc547-r2-mk.py`, `sc547-r2-r3-instr.js`, `sc547-r2-probe.sh`; runs in `sc547-r2-runs/<run>/{r537.json,lifecycle.log,uptime-before.txt}`
- Measurement: `sc547-r2-cost-summary.txt`; G-S57 mutant run: `sc547-r2-lc-hoist-G-S57.{log,png}`
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc547-r2-review-r2q7/` (bundles head, dev, hoist, fix)
