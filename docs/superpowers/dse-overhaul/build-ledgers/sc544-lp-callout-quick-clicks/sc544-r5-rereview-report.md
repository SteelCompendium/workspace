# SC-544 r5: scoped re-review of the r4 delta (plugin af73981b on eafe76e1, superproject edba2fb5 on 55588e9a)

## Executive summary
1. **Verdict: LAND-READY.** HIGH 0 · MEDIUM 0 · LOW 3 (tests and docs only) · INFO 4. Every r3 fold is in and correct.
2. **Rebase.** The range-diff of `423e798d..d3e426dd` against `eafe76e1..ee1a01ea` shows all four r2 commits as `=`, so they are unchanged. The four new commits are the guard test, the guard, the docs with the header counts, and the spy typing.
3. **Gates on af73981b**, run by me, with `DSE_LIFECYCLE_PORT=9546` on every lifecycle call:
   - tsc and lint clean.
   - jest 6295 passed / 1 skipped / 251 of 252.
   - lifecycle 47/47, as 21 (186 s) + 16 (327 s) + 10 (452 s).
   - e2e 128/128, 0 failed, 0 known-bug, coverage 89/89, pointer parked.
4. **Red/green and mutants.**
   - G-S61 FAILs (a)-(i) on my own eafe76e1 bundle (ed429587) with the r1 numbers: (a) [6,5,6] with 8 frames, (e) [5,5,6] with 15 frames.
   - G-S57 and G-S61 run together on HEAD: 2/2 ok, 0 pending-on-another-block frames.
   - jest m1: 5 tests red. G-S61 M1: fails (a)-(i).
   - My guard mutant "never reset" (MG1): G-S61 fails (b)-(i), and my scratch jest probe has 2 tests red. The focused jest suites pass it (LOW-2).
5. **The guard jest case is asserting the right thing.** Its green state is ['upper','lower'] flushed, the writer still pending, and disk [6,5,6]. That disk means the upper's +1 landed in the upper, the lower's +1 in the lower, and the middle holds the form's own write. I checked this by adding a names check to a scratch copy: the names read [Twin,Edited,Twin], and the test still passes. There is no wrong-block write. The test checks the values only, though (LOW-1).
6. **The r4 delta touches no CSS** (styles.css 93be34af is the same on eafe76e1 and HEAD), **no shots harness** (only two header comments in `obsidian-lifecycle.mjs`), **no SC-472 file and no `pipeline.ts`**. So I trust r4's shots, freeze and parity results.
7. **Tree.** `git status --short` reads the same before and after: superproject ` M draw-steel-elements`, plugin clean. I committed nothing.

## 1. Range-diff and the new commits
- `git range-diff 423e798d..d3e426dd eafe76e1..ee1a01ea` shows 1:1 `=` for every commit (f7b8626e, 09680191, 9e6940c9, ee1a01ea). The rebase needed no resolution. Log: `sc544-r5-range-diff.log`.
- What `ee1a01ea..af73981b` changes:
  - `viewRegistry.ts`: the guard field (:70-71) and `flushPendingWrites` with the guard, try and finally (:100-121).
  - The call-site comment in `ReadingModeBlockHost.ts` (:700-701).
  - The jest case in `twin-reuse.test.ts` (:814-832).
  - The `architecture.md` paragraph (:643).
  - The header counts in `obsidian-lifecycle.mjs` (:103 and :111 back to 46; :116 still says 47).
- Superproject edba2fb5 changes CHANGELOG only. The SC-544 bullet sits above SC-511's, with the reworded form sentence.

## 2. The folds
- **Re-entrancy guard (INFO-1).**
  - **Exception-safe: yes.** The flag is reset in `finally`. My scratch jest probe (`guard-probe.test.ts`, run in an archive copy) shows it:
    - a second round on the same registry flushes again;
    - after a sibling throws, the next round reaches every sibling.
  - **`except` holds now.** In the real-Obsidian `formC-lp-scriptonly` probe, the writer's own waiting view is no longer flushed by a nested call. The sequence is: form `rs(d0)`, then the upper `rs(d1)`; the middle view writes later, on its own.
  - **Order.** With 10 waiting views (`cost30-rv`/`-lp`), the siblings are written block 1, 2, …, 9, and the writer (block 0) is written last. Depth is at most 2 (it was 10 in r2).
  - Correctness is unchanged on HEAD for `quad4-lp`/`-rv`, `tri4-lp`, `xytri-rv`, `panes-rvlp`, `gap200-lp` and `formB-rv`.
- **MEDIUM-1 docs.**
  - The CHANGELOG now reads "…when a block edit form on one block is saved right after a click on another block". Accurate.
  - `architecture.md:643` lists the form-open case as not covered, with SC-552. Accurate.
- **LOW-1 docs.** The sentence about undoing two quick clicks as one step in Live Preview is present and accurate.
- **LOW-2.** Restored: :103 and :111 say 46 again, :116 says 47.
- **Proposal.** The M4 control and the red bundle's bytes are added. There is one stale pointer (LOW-3).

## Findings

### LOW-1: the guard jest case checks values only (`test/dom/framework/twin-reuse.test.ts:831`)
- `expect(t.values()).toEqual([6, 5, 6])` is the intended state: the upper's +1, the form's `Edited 5` in the middle, the lower's +1.
- But [6,5,6] is also exactly the SC-544 misroute signature, and also what a dropped form write would leave. A values-only check cannot tell these apart.
- **Measured** in a scratch copy with one extra line: `t.names()` is `['Twin','Edited','Twin']` and the test passes on HEAD.
- **Fix.** Add `expect(t.names()).toEqual(['Twin', 'Edited', 'Twin']);` after :831.

### LOW-2: no committed test catches a guard that is never reset
- The MG1 mutant (the `finally` reset removed) passes all 53 focused jest tests: the one test that calls the registry twice expects "not called", which a stuck guard also satisfies.
- Only G-S61 catches it, in real Obsidian: (a) passes, then (b)-(i) fail, because the guard sticks after the plugin's first flush.
- The throw path (the main reason for the `finally`) is not tested at all.
- **Fix (optional, a few lines).** Add a `view-registry.test.ts` case: two rounds on one registry both flush, and a sibling that throws does not leave the guard on. My scratch file `guard-probe.test.ts` has both cases. It is green on HEAD, and MG1 turns 2 tests red.

### LOW-3: the proposal names the wrong CURRENT block to replace (`sc544-dse-verify-proposal.md` §2 header)
- The proposal says "replace the `eaf64ba6` CURRENT block". SKILL.md's CURRENT is now `eafe76e1` (SC-511, SKILL.md:1258).
- **Fix.** Change it to "replace the `eafe76e1` CURRENT block; keep it as PREVIOUS".
- Optionally add to the G-S61 clause: "also red on an `eafe76e1` bundle (r5, the same numbers)".

### INFO
1. **What the guard changes in the script-only case.** In `formC-lp-scriptonly` the form's edit is now erased by the middle card's own later write: [6,6,5], names all Twin. That is the base result. r2 lost the click instead.
   - The guard jest case shows the same after its debounce: values [6,6,6], names all Twin (probe line `R5PROBE after-debounce`).
   - A real user cannot reach this (the form is modal), and it belongs to SC-519 and SC-552. No action.
2. **The order wording.** `architecture.md:643` says the siblings are written in "registry (document) order". The registry order is the order the views were owned. That matches document order at first draw, but a view rebuilt fresh is owned again at the end of the set.
   - The writer itself is written after its siblings.
   - Nothing correct depends on the order. Optional wording: "registry (mount) order, the writer last".
3. **A sibling that throws** stops that round: the remaining siblings are not flushed, and the throw reaches the writer's `replaceSource` before its own section read. That write is then rejected, and `flushPersist`'s `.catch` logs it.
   - This was the same before r4 (r2 had no try either), and serialize does not throw in practice. A per-sibling try/catch would isolate it if wanted.
4. **G-S61 cannot tell guard from no guard** (MG2, the r2 behaviour, passes). The new jest case does (MG2 turns 1 test red). That is enough.

## Evidence (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/`)
- **Gates:** `sc544-r5-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-part1.log`, `-part2.log`, `-part3.log`, `-e2e.log`.
- **G-S61 and G-S57:** `sc544-r5-g61-red-base-eafe76e1.log`, `sc544-r5-g57-g61-head.log`, `sc544-r5-g61-mutant-M1.log`, `sc544-r5-g61-mutant-MG1-guard-never-reset.log`, `sc544-r5-g61-mutant-MG2-no-guard.log`.
- **Probes and jest:** `sc544-r5-probes.log`, `sc544-r5-jest-mutants.log`, `sc544-r5-range-diff.log`.
- **Scratch** (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r5-review-af6d13a061fdaf760/`):
  - `guard-probe.test.ts`, `gcase.py` (the names-check patch, applied only to scratch copies), `mut.py`;
  - bundles `bundle-{base,head,m1,mg1,mg2}`, sources `src-*`, run `runs/P-head`;
  - `status-start.txt` / `status-end.txt`.
- **FAIL temp dirs the harness kept** (red and mutant runs): `/tmp/dse-obsidian-lifecycle-HvFrqO`, `-zqGcZO`, `-OvrZFM`.
