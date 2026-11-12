# SC-596 r5 scoped re-review (r4 delta only; dse c6077860 on 7866426e; r3 reviewed c02598c1)

**Executive summary**
- **Verdict: LAND.** CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 3 (doc nits, optional).
- range-diff `5f7c5336..c02598c1` vs `7866426e..c6077860`: all 7 commits `=` (identical patches). One new commit, `c6077860`, which is tests only. `git diff c02598c1 c6077860 -- src/framework` is empty. The whole tree diff is the SC-606 montage diff plus 34 lines in `reading-mode-host-form-pin.test.ts`.
- The 2 new tests have teeth. Mutant k6 fails 2 of 3727 (both new tests). My sibling k6b (non-embedded no-own-fence gets a refusing pin) also fails 2. The r4 implementer's k6b (no-section branch, my r3 k4) was already killed. My r3 k6 probe at c6077860: HEAD lands (`values ["7"]`, no Notice); under k6 the click is lost (`values ["6"]`, "can't tell where"). The new card test asserts the same landing, so it is not vacuous.
- jest at c6077860: **10624 passed / 2 skipped** (265 suites + 1 skipped, rc 0, 62 s), as expected.
- CHANGELOG (bb622f86) and the proposal's §1, §3, §4 and CURRENT agree with the code:
  - Notice texts, the per-message rate limit and the no-Notice case (N3: FormModal's "couldn't save") match `droppedWriteNotice.ts`.
  - The sweep counts 1752 / 720 recompute from the oracle.
  - The newly refusing shapes (unique-body refusing pin, nested same-name heading) are named.
  - The block-hover residual is named in §3 and §4.
- r4 lifecycle (59/59: 185 / 323 / 409 / 294 / 390 / 175 s) and e2e (278/282, 0 failed, 171/171) **carry**. The logs do not print a sha themselves, but they belong to c6077860:
  - the reflog shows HEAD = c6077860 from 00:36:14 with no later move, and every r4 gate log has an mtime of 00:37-01:16;
  - my build of c6077860 gives main.js `7f619bd0…` and styles.css `5e5ff488…dc2b27`, which equal the r4 "branch" build in `sc596-r4-gate-styles-sha.log`.
- dse worktree clean before and after (the superproject shows only the expected ` M draw-steel-elements`). No commits. Nothing of mine left running.

## 1. Product code identity
- `sc596-r5-range-diff.log`: `1: 83417942 = 1: 5a0c912f` … `7: c02598c1 = 7: d93fe5a7`, then `-: -------- > 8: c6077860`.
- `git diff --stat c02598c1 c6077860`: montage model plus 3 montage test files (= `git diff --stat 5f7c5336 7866426e`), plus `reading-mode-host-form-pin.test.ts | 34`. The host code (`src/framework`) is byte-identical.

## 2. New tests (c6077860) and mutants (`sc596-r5-mutants.log`, runner `sc596-r3-run-mutants.sh.txt`, mutants `sc596-r5-mutate.py.txt`)
| mutant | change | result |
|---|---|---|
| k6 | `:835` `return this.pinFromLastWrite() ?? this.refusingPin();` (guard dropped) | 2 failed / 3725 passed (both new tests) — killed |
| k6b (mine) | `:835` non-embedded branch `: this.refusingPin()` (embedded unchanged) | 2 failed — killed |
- The failing line in the card test is `pendingPin` toBeNull (`Received: {"lineStart": -1, "text": ""}`). Its later assertions (`replaceSource` true, `values ['7']`, no Notice) are the same ones my k6 probe shows failing under k6 (`sc596-r5-k6-probe.log`), so the test is not vacuous.
- The list-item test asserts `pinPosition()` null for a non-embedded list host. That is exactly what k6 / k6b change.

## 3. Docs vs code
- Notice texts (`src/framework/host/droppedWriteNotice.ts:17-23`):
  - `droppedWriteMessage` = "…was not saved — the block changed on disk first."
  - `unsavableWriteMessage` = "…the plugin can't tell where this block sits in the note", plus " (blocks inside lists can't be edited yet)" when `listShape` is set.
  - Separate rate-limit maps (`lastShownAt`, `lastUnsavableAt`, 5 s), forced for forms. That matches "once per note per 5 s per message".
- Which Notice shows where (`ReadingModeBlockHost.ts`):
  - A refusing pin goes to `unplaceable` (`:1121`), with `listShape = looksLikeList(content, section)`. When `section` is null (N3b) that is false, so the plain wording.
  - A partial pin that is never placed, or a pinned miss, goes to 'miss', so the dropped Notice.
  - N3: `canPersist` false makes `replaceSource` return false before any Notice, so FormModal's own "couldn't save". This matches proposal §1 and the r4 report's table.
- Sweep counts recomputed from the oracle:
  - Non-list refusals per construct: 2 layouts × 6 shapes × 2 hosts × 12 edited/deleted cells = 288, plus 4 same-name heading cells = 292. Times 6 constructs = **1752** ✓.
  - List / footnote: 2 × 360 = **720** ✓. The 492 / 228 split is asserted per cell by `listWindow`.
- CHANGELOG bb622f86 (`worktrees/.../CHANGELOG.md:11-16`):
  - Both Notices are named.
  - The unique-body refusals are named: "even with no identical counter: a stale callout or a section gone at the click (also for + / -)".
  - "a heading link whose name occurs twice with identical counters" covers both two `## Tracker` sections and nested `#P2#Tracker`.
  - The block-hover residual is left out of the CHANGELOG, which is right: jest-only, no user-reachable change.
- Proposal: §1 (Notice table, the r3 LOW-2 shapes), §3 and §4 (block-hover residual for forms, why it is not widened) and CURRENT all agree with the code.

## INFO (optional, doc nits)
- **I-1** Proposal §6 CURRENT says "2880 sweep cells + 31 named + 6 card/non-embedded controls". The 2 new tests sit inside the card `describe` (c6077860 diff, before its closing `});`). So it is 29 named + 8 card / non-embedded. The total 2917 is right.
- **I-2** The shortened CHANGELOG no longer names two by-design refusals the r2 bullet had: a form opened while the metadata cache lags, and a paragraph inside the embedded section edited from outside before the pencil (X1). Both need the same tens-of-ms window and both are in proposal §1. Optional clause: "or the note around it changed in that moment".
- **I-3** The r4 gate logs do not record the dse sha in their own text. They are tied to c6077860 only by reflog, mtimes and bundle sha (summary above). Future gate scripts should echo `git rev-parse HEAD` into each log (as `sc596-r3-lc.sh.txt` does).

## Artifacts (this directory)
`sc596-r5-rereview-report.md`, `sc596-r5-range-diff.log`, `sc596-r5-gate-jest.log`, `sc596-r5-mutants.log`, `sc596-r5-mutate.py.txt`, `sc596-r5-k6-probe.log`, `sc596-r5-build-sha.log` (probe source `sc596-r3-k6-probe.test.ts.txt`, runner `sc596-r3-run-mutants.sh.txt`).
