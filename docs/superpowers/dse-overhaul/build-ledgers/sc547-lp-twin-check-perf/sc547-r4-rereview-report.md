# SC-547 r4 scoped re-review — r3 fix round (delta cb56f128..ea78ebf8)

## Executive summary
- **Verdict: LAND-READY for the code.** One LOW must be handled at landing: superproject commit `1a5386a3` pins dse to the pre-amend commit `c5aca2b4`, which is on no branch. Reviewed dse `ea78ebf8` (on `cb56f128`, develop `0698550f`) and superproject `1a5386a3`.
- Findings: HIGH 0 · MEDIUM 0 · LOW 1 · INFO 2.
- **MEDIUM-1 is fixed.**
  - `collide` in real Obsidian: no `reused-by-twin`, and Mirror shows `Beta` (r2 HEAD showed the parse-error card).
  - Fuzz, 2000 notes / 47,605 lookups: every answer now equals the lookup with NO cache, the 57 mixed-alias notes included (r2 compared against develop's pass instead).
  - The cache still hits: 13,874 `listFences` scans for 95,210 cached asks.
- **The LOW-1 fold works in real Obsidian.** Fixture: two identical callouts, each holding 2× `ds-counter` + 2× `ds-ct` (the counter's second alias).
  - develop `0698550f`: Obsidian draws the `ds-ct` blocks first, so on develop it is the `ds-counter` alias that is never checked. In `mix-counter-0` the lower A card keeps the writer's 6, and its click writes the UPPER block: disk `[7,5,5,5,5,5,5,5]`, wanted `[6,5,5,5,6,5,5,5]`.
  - HEAD: `mix-ct-2`, `mix-ct-3`, `mix-counter-0` and `mixfar-ct` are all clean. In `mix-ct-2` the stale card is released and redrawn (`R1 reused-by-twin (C=6)`).
  - `mix-walk` (scroll down and up, cursor walk over 152 lines): 0 false remounts and 0 bad cards on both bundles. The scroll jumps are the same on HEAD and develop.
- **Mutants:** all 8 go red on TRACKED tests, including the r3 reverts `nolines` and `blocks-noalias`. `hoist-ends` and `nokey-lineend` now go red on purpose (INFO-1 folded).
- **Gates:**
  - tsc and lint: clean.
  - jest: `1 skipped, 6383 passed, 6384 total`, `253 of 254`.
  - lifecycle part 4: `4/4 ok` (G-S57, G-S62, G-S61, G-S56). Part 5: `1/1 ok` (G-S59).
  - `styles.css` is byte-identical (93be34af…), so shots, freeze and parity were not run.
  - cost-big on HEAD: typing pass 0.85 ms, scroll frame 18.6/26.5.
- Tree: same before and after (plugin clean; superproject ` M draw-steel-elements` only). No commits.

## Findings

### LOW-1 — superproject `1a5386a3` pins draw-steel-elements to a commit on no branch (`c5aca2b4`)
- **Where:**
  - `git -C <wt> show --stat 1a5386a3` lists `CHANGELOG.md | 3 ++-` AND `draw-steel-elements | 2 +-`, with pointer `0698550f -> c5aca2b4`.
  - In dse, `c5aca2b4` is the commit before the amend (`HEAD@{1}`); `ea78ebf8` amended it. `git branch -a --contains c5aca2b4` prints nothing, so no branch holds it and it is not on origin.
  - The only difference between the two: a type annotation at `ReadingModeBlockHost.ts:368`.
  - Before this commit, `04aaaafd` left the pointer unbumped, as r1 intended.
- **Failure scenario:** the superproject's history now holds a commit that needs `c5aca2b4` to check out.
  - Anyone who runs `git submodule update` at `1a5386a3` gets "not our ref"; so would a bisect that stops there.
  - Once the reflog expires, `git gc` in the worktree deletes the commit.
  - The normal landing still ends with the right pin: `wt-finish` aborts on ` M draw-steel-elements` until the bump is committed, and land-stack (a) bumps to the pushed tip. Only the history is wrong.
- **Fix (owner or dispatcher):** before landing, rewrite `1a5386a3` so it carries only `CHANGELOG.md`, leaving the pointer at `0698550f` as `04aaaafd` had it. Then do the normal `chore: bump draw-steel-elements to ea78ebf8` at landing. Or squash both superproject commits into the landing bump. Check with `git -C <wt> show --stat HEAD` that no commit before the bump touches `draw-steel-elements`.

### INFO-1 — the "each pass gets memory of its own" test is a check on `newPassMemo` only
- `twin-reuse.test.ts` ("each pass gets memory of its own") checks that two `newPassMemo()` results do not share Maps.
- It would not catch `reconcile` reusing one scope across passes.
- That case is still covered by the 40-block test's second `update()` (`4` scans), and by G-S57 in real Obsidian (r2: the hoist bundle makes G-S57 FAIL). No action.

### INFO-2 — CHANGELOG clause is accurate but vague; optional wording
- Current text: "…except that a callout holding two kinds of block (counters and another element, two or more of each) now has both kinds checked, not just the first."
- It is true, but:
  - "counters and another element" suggests one of the two must be a counter. Any two DSE kinds count, including the counter's own two fence names.
  - What the user notices is not stated. On develop, after a + on one of two identical callouts, the other callout's card of the unchecked kind showed the clicked value, and its next click wrote the first callout's block.
- Optional rewording: "…except that a callout holding two kinds of block, two or more of each, now has both kinds checked: before, the second kind could show the other callout's value after a click, and its next click wrote the other callout." Leave as is if the owner prefers it short.

## The delta, checked
- **`windowFences` (`ReadingModeBlockHost.ts:246-265`):**
  - Hit only when `cached.lines === lines` (:256); the entry stores `{ lines, spans }` (:264).
  - The remounter's `linesOf` (`remountReused.ts:48-54`) returns the same array for the same text, so every host in a normal pass gets hits; that is measured (cost-big 0.85 ms, fuzz scans).
  - Embed text interleaved with the editor text costs at most a re-split and a miss. Correct.
- **`quoteOrdinal` (:356-373):**
  - The cache is `Map<Element, Map<alias, Element[]>>`. The per-alias list is made on the first ask for that alias.
  - With no cache the code path is unchanged: `domOrdinal` (:624) passes none.
- **`PassMemo` docs (:315-321):** match the code. The `windowEnds` note (filled only from `scope.text`) is correct.
- **The four new or changed tests are meaningful.** Each goes red on the matching mutant:
  - "two blocks of each of two aliases": red on `blocks-noalias`, `nokey-lang` and `hoist(-fences)`.
  - "two sections of different text": red on `nolines`.
  - "keys a window by both its bounds": red on `nokey-lineend`.
  - "each pass gets memory of its own": red on `hoist`, `hoist-ends` and `hoist-fences`.
  - The r1 test's two-alias claim now holds, because it has two `ds-other` blocks.

## Mutants (full jest, each with my r4 probe file copied in and removed afterwards; source restored after each run)
| mutant | tracked tests red |
|---|---|
| `drop` (no fence cache) | SC-547 40-block scan count |
| `nolines` (r3 MEDIUM-1 fix reverted) | "two sections of different text…" |
| `blocks-noalias` (LOW-1 fold reverted) | "two blocks of each of two aliases…" |
| `hoist` (all caches across passes) | six-block read, 40-block scans, "two blocks of each…", "each pass gets memory…" |
| `hoist-fences` | 40-block scans (4 -> 2), "two blocks of each…", "each pass gets memory…" |
| `hoist-ends` | six-block, 40-block, "each pass gets memory…" |
| `nokey-lineend` | "keys a window by both its bounds" |
| `nokey-lang` | "two blocks of each of two aliases…" |
The unmutated run with the probe file: `1 skipped, 6387 passed` (6383 + 4 probe tests).

## Real Obsidian runs (bundles: HEAD built from `git archive ea78ebf8`; develop `0698550f` built in r2; harness `sc547-r4-mk.py`, which adds the `mix.md`/`mixfar.md` fixtures, the `mix-*` cases and `ds-ct` in the instrumentation's fence list)
- `sc547-r4-runs/m1-head`: `mix-ct-2`, `mix-ct-3`, `mix-counter-0`, `mixfar-ct`: clean. `mix-walk`: `reused []`, `nBad 0` (down, up, walk); jumps `down [[4,1000,973]]`, `up [[28,450,476],[31,-124,0]]`.
- `sc547-r4-runs/m1-dev`:
  - `mix-counter-0`: PROBLEMS (lower A card shows 6 then 7 while the disk holds 5; disk `[7,5,…]` against wanted `[6,5,5,5,6,5,5,5]`; no `reused-by-twin` release at all).
  - The other mix cases: clean, because the `ds-ct` alias is asked first on develop.
  - `mix-walk`: the same jumps as HEAD, no false remounts.
- `sc547-r4-runs/c1-head`:
  - collide: Mirror `Beta`, only a `render-child-unload` release, `mixedPasses 19` (the mixed text is still present and is now handled).
  - embed: `reused []`.
- `sc547-r4-runs/cost-head-a`: cost-big typing dispatch 2.09, pass 0.85/1.50, cursor 0.89, scroll 1.00, frame 18.6/26.5 (load 3.37).

## Artefacts (ledger dir)
`sc547-r4-gate-{tsc,lint,jest,lc4,lc5}.log`, `sc547-r4-jest-mut-*.log`, `sc547-r4-jest-equivalence-probe.log`, `sc547-r4-equivalence-probe.test.ts.txt`, `sc547-r4-mut.py`, `sc547-r4-mk.py`, `sc547-r4-r3-instr.js`, `sc547-r4-runs/{m1-head,m1-dev,c1-head,cost-head-a}/`. Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc547-r4-rereview-r2q7/`.
