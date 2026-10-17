# SC-407 fix1 scoped re-review — dse `sc407-docs-prune` eef9c63..e7dbaa6

## Executive summary
- **Verdict: LAND-READY.** Nothing blocks. LOW-1, LOW-2, LOW-3(b), LOW-5, LOW-6 and I1 are fixed as prescribed. LOW-4 is mostly fixed but has a gap (NEW-LOW-A). LOW-3(a) is fixed but its new sentence is inaccurate (NEW-LOW-B). Both are one-line folds.
- Counts: CRIT 0 · HIGH 0 · MEDIUM 0 · LOW 2 (both new) · INFO 2.
- Gates on e7dbaa6: tsc clean. lint clean (rc=0). jest **4432 passed / 1 skipped / 219 of 220 suites**, which matches the expected numbers.
- Links: mkdocs `--strict` with anchor validation gives the same 8 pre-existing warnings as eef9c63 (diffed: identical), 0 new. README is untouched in the delta.
- Shots, freeze, parity and lifecycle were **not re-run**. Nothing in the delta touches `src/`, `main.ts`, styles, `visual-harness/entry.ts`, `shoot.mjs`, `parity/` or `obsidian-camera.mjs`. The new guard is loaded only by `docs-shots.mjs`, and `docs-manifest.mjs` is unchanged. None of those gates can move.
- Guard mutation probes:
  - Planting a browser `element: 'party'` or a `gallery: [..,'roll']` hard-errors docs-shots (exit 1) before any capture.
  - Breaking the scan regex errors with "scan has rotted" and turns both tests red.
  - Un-deferring `party` turns both tests red.
  - Dropping the gallery check turns one test red.
  - Checking obsidian entries too turns one test red.
  - **`gallery: true` passes the guard** (NEW-LOW-A).
- The goblin-runner example parses and resolves against real data-unified frontmatter: runner is `organization: Minion`, stamina 4, pool 6×4=24; the crucible dragon resolves to 450.

## Per finding
- **LOW-1 fixed.** Audit line 219 now says "**ten**".
- **LOW-2 fixed.** `CHANGELOG.md:70-71` now reads "— and the initiative tracker's group headers —". No "roster heading" text remains.
- **LOW-3(b) fixed.** The squad is `goblin-runner` (Minion). The code exists, and resolving it yields pool 24.
- **LOW-3(a) fixed, but see NEW-LOW-B.** The sync requirement is now stated plainly.
- **LOW-4 mostly fixed** (see NEW-LOW-A). The guard derives the deferred set from `deferred: true` in definitions (9 ids). It runs at docs-shots import time, before any capture. The README line is added.
- **LOW-5 fixed.** The `architecture.md` experimental.ts row and AGENTS.md:142-146 now carry the docs-shots exception. "§11a" is correct.
- **LOW-6 fixed.** `CHANGELOG.md:535` reads "regenerates them from the real plugin".
- **I1 fixed.** `index.md:21` reads "set up the fight, then run it".

## Findings

### NEW-LOW-A — The guard ignores `gallery: true`, so a full gallery including all 9 deferred elements gets through
`visual-harness/docs-deferred-guard.cjs:44`:
`[shot.element, ...(Array.isArray(shot.gallery) ? shot.gallery : [])]`.

`docs-shots.mjs:100-101` documents and supports `gallery: true` ("every element") and maps it to `gallery=1`. `entry.ts:2237-2238` then mounts `Object.keys(FIXTURES)`, which includes `encounter`, `hero`, `hero-tokens`, `party`, `roll` and the rest.

**Probe M3:** I planted `{ out: 'all.png', source: 'browser', gallery: true }` and the guard did not throw.

**Scenario:** someone adds a "full gallery" docs image (a form the runner already supports). The image publishes all nine deferred elements rendered with the switch ON, and the guard passes it silently. That is exactly the hole LOW-4 was meant to close.

**Fix:**
- In `assertNoDeferredBrowserShots`, treat any non-array truthy `gallery` as every element. Reject it outright, or expand it to the deferred set, e.g.:
  `if (shot.gallery && !Array.isArray(shot.gallery)) bad.push(`${shot.out} -> gallery: true (every element, incl. ${[...deferred].join('/')})`);`
- Add a third assertion to `docsDeferredGuard.test.ts` expecting a throw for `{ source: 'browser', gallery: true }`.

### NEW-LOW-B — running-an-encounter.md describes the unsynced failure wrongly
`docs/running-an-encounter.md:10-11` says: "Without a sync those creatures show a 'not available in this vault' card".

What actually happens: `SccRefProvider.ts:33-35` throws, and `resolveRefs.ts` (creature loop catch) re-throws "Failed to resolve creature statblock reference at index 0 (scc.v1:…): SCC reference (…) is not available in this vault. Sync the compendium…". The pipeline then replaces the **whole tracker** with one error card naming the first unresolved creature. There are no per-creature cards; the heroes don't render either. My own r1 wording ("both groups fail with the … error card") was loose and fed into this.

**Fix:** "Without a sync the tracker shows an error card saying the reference is not available in this vault; you can always type a creature out instead, with a `name` and `max_stamina`."

### INFO
- **I-a:** The deferred scan only matches literal `deferred: true` and single-quoted `id: '…'`. All 22 definitions use that form today, and probe M5 shows a broken scan fails loudly (it throws, and the tests go red). It is only fragile if someone changes the definition style. No action.
- **I-b:** AGENTS.md:142-152 now describes the docs-shots exception twice (once in the new parenthetical, once in the following sentence). Redundant but accurate. Optional trim.

## Evidence (`.superpowers/sdd/sc407-docs-prune/rereview-fix1/`)
- tsc.log, lint.log, jest.log
- mkdocs-e7dbaa6.log
- guard-probe.sh + guard-probe.log (M0–M8)
- probe-example-yaml.log (example resolved against real data-unified frontmatter)
- probe-npm-ci.log

Probes ran in a throwaway `worktrees/sc407-rereview-probe` at e7dbaa6; every mutation was reverted with `git checkout` and the worktree has been removed. The sc407 DSE tree is clean with HEAD e7dbaa6. The superproject's ` M draw-steel-elements` was already there.

---

## Re-review #2 — e7dbaa6..a337460 (one commit, a337460)

**Verdict: LAND-READY.** Counts: CRIT 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 0. NEW-LOW-A and NEW-LOW-B are both fixed as prescribed.

- **NEW-LOW-A fixed.** `docs-deferred-guard.cjs:45` now records `<out> -> gallery: <value> (every element)` for any non-array truthy `gallery`. The test gained a `{ gallery: true }` → throw assertion inside the existing test, so the test count is unchanged.
  - Probe M3: planting `{ out: 'all.png', source: 'browser', gallery: true }` makes docs-shots exit 1 with "all.png -> gallery: true (every element)". Nothing is captured; no `all.png` is written.
  - Probe M3b: the string form `gallery: '1'` is also caught (exit 1).
  - Probe M9: deleting the new check turns the guard test red (1 failed / 1 passed; "Received function did not throw").
- **NEW-LOW-B fixed.** `docs/running-an-encounter.md:10-12` now says "Without a sync the tracker shows an error card saying the reference is not available in this vault…". This matches `SccRefProvider.ts:33-35` → `resolveRefs.ts` re-throw → one block-level error card.
- **Gates.**
  - jest **4432 passed / 1 skipped / 219 of 220 suites**, rc=0.
  - mkdocs `--strict` with anchor validation: the same 8 pre-existing warnings as e7dbaa6 (diffed: identical).
  - tsc, lint, shots, freeze, parity and lifecycle were not re-run. The delta is one .cjs file that only docs-shots loads, one test assertion and one doc sentence. No `src/`, `main.ts`, styles or harness capture code changed.
- **Evidence** (`.superpowers/sdd/sc407-docs-prune/rereview-fix2/`): jest.log, guard-probe2.sh, guard-probe2.log, mkdocs-a337460.log, probe-npm-ci.log.
- **Cleanup.** Probes ran in a throwaway `worktrees/sc407-rereview2-probe` at a337460; mutations were reverted and the worktree removed. The sc407 DSE tree is clean with HEAD a337460.
