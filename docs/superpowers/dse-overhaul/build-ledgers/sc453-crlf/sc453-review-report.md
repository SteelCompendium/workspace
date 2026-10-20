# SC-453 R1 independent review — dse `sc453-crlf` @ b3631f8 (base f818002)

**Executive summary**
- VERDICT: **FIX-REQUIRED** (one small fix: make G-S10 deterministic). The product change itself is correct: 0 LF regressions in 478 base-vs-head probe cases, every all-CRLF input stays all-CRLF, 0 changed bytes outside the block in 345 checked writes, nothing crashed or lost content.
- Counts: CRITICAL 0 · HIGH 0 · MEDIUM 1 · LOW 2 · INFO 7.
- MEDIUM-1: the new lifecycle scenario G-S10 is **flaky at about 3%** (it failed 1 of my 2 full runs; isolated reruns 3/3 ok). The cause is an older product bug that G-S10 is the first test to hit: `generateAnchorId` makes ids like `927e10` / `012345`, and the YAML round trip on the first write turns them into numbers. The anchor is lost and the panel shows "Backing block not found". This happens for 2.95% of ids (200k-id sample) and affects LF notes too.
- Gates measured on head: tsc clean · lint clean · jest **4867 passed / 1 skipped / 228 of 229 suites** · lifecycle **25/26 (G-S10 FAIL, the flake), then 26/26** on rerun · e2e `63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs` · shots **572**, 0 FAIL (button host-leak 112 kinds / 672) · freeze `freeze OK (276/276 …)` · parity **0 gap(s) / 0 undeclared / 24 declared**.
- FAIL-on-base confirmed: 24 failed / 80 passed / 104 across the 6 touched test files, with base src and head tests (the lineEnding suite cannot load on base). This matches the implementer's numbers exactly.
- Real Obsidian, base bundle vs head bundle: head keeps CRLF notes all-CRLF on the reading, sidebar and pin paths. On base the sidebar never finds the block. LF output is byte-identical between base and head.
- Working tree: `git status --porcelain` was empty before and after. Head is still b3631f8, and nothing was committed. The probes ran in scratch snapshots.

## Findings

### MEDIUM-1 — G-S10 is flaky (~3%) because of an older anchor-id bug
- Where: `src/framework/sidebar/anchor.ts:30-32` (`generateAnchorId`: `Math.random().toString(16).slice(2, 8)`), triggered by `visual-harness/obsidian-lifecycle.mjs:1411-1412` (G-S10 pins through the real command, which stamps a random id, then writes from the sidebar).
- What happens: the stamped id is a 6-char hex string. When it reads as a YAML number, the element's `stringifyYaml` round trip rewrites it on the first sidebar write:
  - `927e10` becomes `9270000000000`
  - `012345` becomes `12345`
  - `4e5678` becomes `.inf`
  - `000000` becomes `0`
  `findAnchoredBlock` then cannot find the id, `notifyAnchorLost` fires, and the panel degrades to "Backing block not found — re-link this panel from the note." The write itself landed.
- Measured:
  - My first full lifecycle run failed `G-S10 FAIL: the sidebar panel degraded to the not-found card`. The on-disk note held `_dse_anchor: 9270000000000\r\n`, which is 13 digits; the generator always emits 6 chars, so this is `927e10` after the round trip. The note bytes were otherwise all-CRLF and correct.
  - Isolated `--only=G-S10` passed 3/3, and a second full run passed 26/26.
  - The `yaml` package (Obsidian's parser) mangled 2.954% of 200,000 ids drawn the same way `generateAnchorId` draws them. Analytically: 500,000 bad ids out of 16^6 (leading-zero all-digit ids, and digits-e-digits ids).
- Scope: this predates SC-453 and is not CRLF-specific. About 3% of all "Send block to sidebar" pins in any note break after the first edit. SC-453 did not cause it, but its new mandatory-gate scenario now goes red about 1 run in 33. dse-verify says "No retries, ever: a flake is a bug in the test or the product."
- Fix, minimum for landing: make G-S10 deterministic. Either stub `Math.random` in the page around the `send-block-to-sidebar` call (e.g. `const r = Math.random; Math.random = () => 0.123456789; … ; Math.random = r`, which gives id `1f9add`), or assert the stamped id is YAML-safe before continuing.
- Fix, product (owner's call whether in scope; otherwise file a Backlog ticket linked to SC-453): give `generateAnchorId` a non-hex leading letter, e.g. `'x' + hex5`, so a parsed id is always a string. Note that ids already stamped and since mangled are already lost.

### LOW-1 — Sidebar self-echo now misses on LF notes when the new body ends in a lone `\r`
- Where: `src/framework/host/SidebarBlockHost.ts:297` (`this.lastWritten = stripCr(newSource)`) against `:56-57` (`extractBody` now `splitLines`) and the check at `:403`.
- What happens: on an LF-dominant note, `replaceFenceBlock` writes `newSource` as-is. A trailing lone `\r` then sits in front of the close fence's `\n`, so `extractBody` strips it on read-back. `stripCr(newSource)` keeps it, because nothing follows it. The two strings differ, so `onExternalChange` fires for our own write and the panel remounts.
- Measured: 12 probe cases, all `nsLoneCrEnd` on LF or LF-dominant notes, gave `ext=1` on head and `ext=0` on base. No other sidebar case changed `ext` or `lost`.
- Reachability: only if an element serializes a body ending in a lone `\r`. No shipped serializer is known to do that (counter and initiative use `stringifyYaml(...).trim()`).
- Fix: derive `lastWritten` from the bytes actually written. Inside the `vault.process` callback, after `next` is computed, set `this.lastWritten = extractBody(next, this.locate(next) ?? info)`. The `modify` event fires after the callback returns, so this is still in time. Add a jest case for it.

### LOW-2 — `stripCr(newSource)` in the sidebar's `replaceSource` is untested
- Where: `SidebarBlockHost.ts:297`.
- Evidence: mutation M4 (`lastWritten = newSource`) passes all 130 tests in the 6 touched files. No test feeds a CRLF `newSource` to the sidebar host and checks that the self-echo guard holds.
- Fix: add one case, a CRLF note plus `replaceSource('current_value: 5\r\n_dse_anchor: abc123')`, then expect `onExternalChange` not to have been called. It can share a test with LOW-1.

### INFO
1. **ReadingModeBlockHost line-index invariant (brief item 4): still sound.**
   - `splitLines` (`/\r?\n/`), `stripCr` (`\r(?=\n)` only) and `content.split('\n')` give identical line counts. `resolveWriteTarget` and `replaceFenceBlock` both index into `content.split('\n')`.
   - However, `stripCr` in `locateByBody` (`ReadingModeBlockHost.ts:151`) is now redundant: mutation M9 (`const lf = content`) passes everything. `OPEN_FENCE`'s `(\S*)` stops before `\r`, the close check uses `.trim()`, and `normalizeBody` folds CRLF.
   - The new comment saying it "stays because the lines … must be CR-free" is therefore inaccurate. Either drop the call or reword the comment.
2. **Older bug, out of scope: a lone `\r` ABOVE a block silently drops Reading-view writes in real Obsidian 1.14.4.**
   - Evidence: P-R3 (CRLF note) and P-R5 (LF note) both show click ok, file unchanged, **no Notice**, on base and head alike. P-R6 (lone `\r` BELOW the block) lands, and head keeps it all-CRLF.
   - Inference: Obsidian's section numbering counts a lone `\r` as a line break. The section `lineStart` is then off by one against `split('\n')`, `readSection`'s `parseOpenFence` fails, `knownLanguage` stays null, there is no durable identity, and `resolveWriteTarget` returns `'abort'` with no Notice.
   - This contradicts the comments at `lineEnding.ts:17-18` and `ReadingModeBlockHost.ts:146-148`, which say a lone `\r` never separates lines in Obsidian's numbering. Suggest a Backlog ticket and correcting both comments.
3. **Harness cleanup (brief §5): neither harness deletes with a shared glob.**
   - lifecycle `rmSync(work)` only removes its own `mkdtempSync('dse-obsidian-lifecycle-')` dir (`obsidian-lifecycle.mjs:50`, `:1576`). The e2e diff temp is also per-`mkdtemp` (`e2e/driver/artifacts.ts:67-74`).
   - The R1 incident was the implementer's manual command, not the harness.
   - I removed only my own kept dir `/tmp/dse-obsidian-lifecycle-UXUOxK`, by exact path, after copying its evidence.
4. **Putting the real-Obsidian test in lifecycle (G-S10) rather than e2e is correct per dse-verify.**
   - `npm run e2e` is mandatory and is green (run above).
   - e2e scenarios and coverage pairs are only required for controls on the stamina/initiative pilot surfaces, and SC-453 adds no control.
   - Host write-lifecycle checks in real Obsidian already live in lifecycle (G-S6u, G-S7a, …).
   - G-S10 does assert on-disk bytes: `t.read` is `fs.readFileSync(path.join(vault, rel))`.
5. **The new tests are not vacuous (brief item 5).**
   - Mutations against head src (130 tests in the 6 files):

     | Mutation | Tests killed |
     |---|---|
     | M1, always CR on the last line | 5 |
     | M2, no strip of `newSource` | 1 |
     | M3, a tie always picks LF | 1 |
     | M5, `extractBody` back to `split('\n')` | 2 |
     | M6, no EOL on the stamp | 4 |
     | M7, no EOL on the encounter append | 1 |
     | M8, `findFenceByBody` without stripping | 1 |
     | M10, `splitLines` as a plain split | 20 |
     | M4 | 0 (LOW-2) |
     | M9 | 0 (redundant code, INFO-1) |
     | M0, no-op control | 0 |

   - The sidebar "self-echo" test passes on base only because base never writes, but on head it is a real guard (M5 kills it).
6. **Older behaviour, unchanged: a write to an unterminated fence at EOF drops the note's final newline.** Seen in real Obsidian P-R2, LF and CRLF alike, base and head. Not SC-453.
7. **The dse-verify CURRENT row needs updating at landing:** jest 4867/1/228 of 229, lifecycle 26/26 (G-S10). e2e, shots, freeze and parity are unchanged.

## Probe results by brief item
1. **Write-site survey.** I ran an independent grep of `src/` + `main.ts` for `vault.process|modify|append|create|adapter`, `replaceRange|replaceSelection|setLine|transaction|dispatch|setValue`, `processFrontMatter` and `fileManager`.
   - Sites that write note text: SidebarBlockHost (:301), ReadingModeBlockHost (:378), sidebar/registration (:210, the anchor stamp) and encounter/view (:456, the tracker append). The fix changed all four.
   - Editor inserts in authoring/* go through CodeMirror, as the implementer measured: Obsidian saves the whole file as LF, so the note is never mixed.
   - `utils/CodeBlocks.ts` `vault.modify` is dead code (no src/main caller; only tests import `CodeBlocks`).
   - `LivePreviewBlockHost.replaceSource` is a stub. `data/*` only writes new files, binaries or JSON.
   - No `processFrontMatter` anywhere. No missed site.
2. **Integrity.**
   - jest probe: 478 cases on base and head, covering the 4 write sites × 12 note shapes × LF/CRLF, plus 6 mixed or CR-only notes × 5 `newSource` shapes, plus section and durable paths.
     - All-CRLF inputs: 0 bare LF in any head output.
     - Bytes outside the block: unchanged in all 345 writes checked.
     - Two same-kind blocks: no cross-talk.
     - Hand-edit followed by a re-trigger: lands.
     - Close fence at EOF with no newline: no `\r` is invented.
     - `\r` inside the body: survives.
     - Unterminated fence at EOF: closed, and stays all-CRLF.
     - Callout `> ` fences: no write, same as base.
     - Mixed notes: dominant ending used; a tie goes to the first break; no throws.
   - Real Obsidian, base bundle vs head bundle:
     - P-R1 (CRLF note, two blocks, last block at EOF, hand-edit then re-trigger): head all-CRLF; base mixed.
     - P-R4 (LF version of P-R1): byte-identical between base and head.
     - P-R2 (unterminated fence, CRLF): head all-CRLF.
     - P-S1 (pre-anchored CRLF pin): binds without a write; the sidebar write lands all-CRLF and the other block is untouched. When the user deletes the block, the panel degrades cleanly; when it is restored, the panel recovers and the next write lands all-CRLF. On base the panel never mounts.
3. **LF regression:** 0 of the LF-input cases differ between base and head across all four write sites, including `newSource` that carries CRLF, a trailing newline or a lone `\r`.
4. See INFO-1.
5. See INFO-5 and the FAIL-on-base numbers in the summary.
6. See the summary. The lifecycle flake is MEDIUM-1.

## Evidence (scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/`)
- Gate logs: `logs/tsc-1792436275.log`, `logs/lint-1792436275.log`, `logs/jest-1792436324.log`, `logs/lifecycle-1792436413.log` (25/26), `logs/lifecycle2-1792438227.log` (26/26), `logs/lc-gs10-r{1,2,3}-*.log`, `logs/e2e-1792436853.log`, `logs/shots-1792436896.log`, `logs/freeze-1792437462.log`, `logs/parity-1792437462.log`.
- G-S10 flake: `evidence/gs10-flake/G-S10-FAIL.png`, `evidence/gs10-flake/crlf.md`. YAML id probe: `yamlprobe.cjs`.
- FAIL-on-base: `logs/failonbase-1792437646.log`. Mutations: `mutate.sh`, `logs/mut-M*.log`.
- jest A/B probe: `zz-sc453-probe.test.ts`, `probe-head.json`, `probe-base.json`, `analyze.py`, `analyze2.py`, `logs/probe-{head,base}-1792437560.log`.
- Real-Obsidian probes: `probe-scenarios.mjs` (injected into the `headsnap/` harness copy), `rl-head/`, `rl-base/`, `rl-head2/`, `rl-base2/`, `logs/rl-*.log`.

## Re-review (fix round 1 + rebase) — dse `sc453-crlf` @ 6bcf9c8 on c616e22

**Summary**
- VERDICT: **LAND-READY**. Findings: 0 CRITICAL / 0 HIGH / 0 MEDIUM / 0 LOW / 5 INFO. MEDIUM-1, LOW-1 and LOW-2 from R1 are all closed.
- Replay is clean: `git range-diff f818002..52c9414 c616e22..995398d` shows all 8 commits as `=`. No patch changed during the rebase.
- LOW-1 (moving `lastWritten` into the callback) opens no race, and is an improvement:
  - An external edit landing between `replaceSource()` and its callback is still reported.
  - A stale echo of our own previous write, and rapid back-to-back writes, are no longer misread as external edits once `vault.process` is async, as it is in Obsidian.
  - Abort and no-op writes behave the same as pre-fix.
- Mutations: both the LOW-1 and LOW-2 mutations are killed by the 2 new tests, as are 4 further variants (6/6 killed, 0 survivors).
- G-S10 check:
  - `Math.random` is restored on the pass path, the command-failure path, and the bad-id path; each was measured in real Obsidian.
  - The YAML-string assertion can fail (`927e10` triggers it) and passes with the stub.
  - `yaml` is a declared devDependency (`^2.9.0`; 2.9.0 installed).
  - With SC-360's generator, the stub gives id `d5b05a`, and G-S10 passes on a trial merge of SC-453 and SC-360.
- Comments: the SC-460 lone-CR claim is now directly measured in real Obsidian. A section containing `A\rB` counts 3 lines against 2 for `AB`, the counter's section starts at line 5 while `split('\n')` puts the fence at index 4, and the Reading-view write is dropped with no Notice. The note that removing the redundant strip leaves every test green also holds (full jest, 0 failed).
- Gates on 6bcf9c8:

  | Gate | Result |
  |---|---|
  | tsc | rc 0 |
  | lint | rc 0 |
  | jest | **4908 passed / 1 skipped / 229 of 230 suites** |
  | lifecycle | **26/26** |
  | G-S10 solo | **5/5 ok** |
  | e2e | `68/76 ok, 0 failed, 8 known-bug, coverage: 51/51 pairs` |

  shots, freeze and parity were not re-run; the reason is under item 6.

### Findings (all INFO)
1. **Landing order with SC-360:** a trial merge of 6bcf9c8 with `sc360-flaky-undo` (8c39741) conflicts in two places, both trivial (keep both sides).
   - `src/elements/encounter/view.ts:20-21`: the import lines are adjacent. SC-360 adds `generateAnchorId` to the anchor import, and SC-453 adds the `lineEnding` import below it.
   - `CHANGELOG.md`: adjacent bullets.
   - After resolving both, the merged tree passes tsc (rc 0) and framework jest (882 passed / 2 skipped / 0 failed), and lifecycle G-S10 is ok with `stamped=d5b05a`. Whichever ticket lands second resolves the two conflicts this way.
2. **Behaviour change after a rejected write:** `SidebarBlockHost.ts:316` now records `lastWritten` only when the callback runs. Suppose `vault.process` rejects (the file is deleted mid-write) and the file is later re-created carrying the body we tried to write. Head now calls `onExternalChange` once, which remounts with identical content. Pre-fix (aa43bc0) and c616e22 kept the stale record and swallowed it. This is more correct, since only writes that happened are recorded, and harmless.
3. **Rapid writes with the synchronous jest fake:** two or three back-to-back writes still produce a spurious external change on every version (c616e22, aa43bc0 and 6bcf9c8 identical). The fake's `process()` and `read()` capture bytes synchronously, which Obsidian does not do. In the async model, which matches Obsidian, head has 0 spurious calls against 1-2 on pre-fix. Not a regression.
4. **Field doc is slightly stale:** `SidebarBlockHost.ts:68` still says "the exact body this host itself last wrote". It now holds the read-back form of that body; the callback comment at `:312-315` explains this. Cosmetic.
5. **R1 evidence paths are gone:** the session restart wiped the scratchpad, so the R1 section's evidence paths no longer exist. This re-review regenerated everything it relies on under `rr2-*`.

### Probe results by brief item
1. **Self-echo timing.** I ran 16 scenarios on c616e22, aa43bc0 (pre-fix) and 6bcf9c8, each in LF and CRLF notes (32 cases per version). `async` means `vault.process` awaits a macrotask before calling `fn`, as Obsidian awaits its disk read. Head differs from pre-fix in only five places, all improvements or the intended fix:
   - **loneCr** (sync and async): pre-fix ext=1, head ext=0. This is the LOW-1 fix.
   - **rapid2 and rapid3, async**: pre-fix ext=1-2 spurious, head 0.
   - **staleEcho**, our own B2 echo re-delivered while B3 is in flight: pre-fix ext=[B2], which would make the panel show B2 while the disk ends up at B3. Head ext=[].
   - **rejected**: see INFO-2.

   Identical across all three versions:
   - **extBetween**: an external edit landing just before the callback is detected, and our write still lands.
   - **abort**: the anchor removed just before the callback gives `lost=1`, and the later return of the block is reported.
   - **noop**: no external change reported.
   - **crlfSrc**: a CRLF `newSource` gives 0 spurious calls.

   The self-echo check cannot fire before the callback in a way that swallows a real change. Before the callback, `lastWritten` still holds the read-back of our previous write, which equals the disk body unless an external edit happened, and an external edit with a different body is reported (extBetween).
2. **Mutations** (132 tests in the 6 touched files; control 132/132):

   | Mutation | Failed tests |
   |---|---|
   | LOW-1 revert: `stripCr(newSource)` set before process | 1 (the lone-CR test) |
   | LOW-2 revert: raw `newSource` set before process | 2 (both new tests) |
   | raw `newSource` in the callback | 2 |
   | `stripCr(newSource)` in the callback | 1 |
   | `lineEnd` −1 | 4 |
   | `lineEnd` +1 | 4 |
   | assignment removed | 4 |
3. **G-S10, using an instrumented scratch copy of the harness.**
   - Stub forced to `0x927e10`: G-S10 FAILs with `YAML reads the stamped id "927e10" as a non-string`. The new assertion fires before the old "degraded" symptom would appear, and the follow-up `P-RND` check passes: `Math.random` is native again, with no leftover `window.__lcRandom`.
   - Command id broken: G-S10 FAILs with `the send-block-to-sidebar command did not run`, and `P-RND` passes, so the `finally` restore works on the failure path.
   - Default: ok with `stamped=abcdef`, and `P-RND` passes.
   - The `held[0] === stamped` assertion is close to tautological: `sendToSidebar` hands the panel the same id it stamps. It is still a valid consistency guard.
   - SC-360's generator is `LEADING_LETTERS='abcdf'` + 5 hex digits from `floor(r·5·16^5)`. With r = 0xabcdef/2^24 it gives `d5b05a`, both computed and measured on the merged build.
4. **Comments.**
   - `lineEnding.ts:16-21`: accurate.
   - `ReadingModeBlockHost.ts:143-152`: accurate. The redundancy claim was verified by a full jest run with the strip removed: 4905 passed / 4 skipped (the snapshot has no cached app.css) / 0 failed. The lone-CR claim was measured (P-SEC: section line counts `[0,2,3,7,1,0]` vs `[0,2,2,7,1,0]`, write dropped with 0 notices; the plain note writes).
   - `SidebarBlockHost.ts:312-315`: accurate.
5. **SC-428 / SC-450 interaction (f818002..c616e22, 16 commits).** None of SC-453's files are touched. No `replaceSource`, `vault.*` or line-splitting changes appear in the src diff. `adoptView.ts` only adds focus-visible restore, and `initiative/view.ts` only routes aria-pressed through `setPressedState`. SC-453 writes no aria-pressed, and the SC-450 guard suite passes inside the full 4908 run. No interaction.
6. **Gates.** I ran tsc, lint, jest, the full lifecycle, G-S10 solo ×5, and e2e, since e2e is required to land and the delta touches src. I did not re-run shots, freeze or parity:
   - The fix-round delta touches only the sidebar self-echo assignment, two comments, a jest file and the lifecycle harness, none of which the browser camera or parity bundle renders.
   - The rebase replayed identical patches (range-diff all `=`) onto c616e22 with 0 conflicts.
   - The implementer measured shots 572 + pressed-toggle line, freeze 276/276 and parity 0/0/24 on 6bcf9c8.
   - R1 measured shots, freeze and parity unchanged by SC-453's src.

### Evidence
All paths below are in the scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/`.
- Gate logs: `rr2-logs/tsc.log`, `rr2-logs/lint.log`, `rr2-logs/jest.log`, `rr2-logs/lifecycle.log`, `rr2-logs/gs10-solo-{1..5}.log`, `rr2-logs/e2e.log` (each with a `.rc` file).
- Race probe: `rr2-race.test.ts`, `rr2-race-{c616e22,aa43bc0,6bcf9c8}.json`, `rr2-logs/race-*.log`.
- Mutations: `rr2-mutate.sh`, `rr2-logs/mut-*.log`, `rr2-logs/mut-M9-fulljest.log`.
- G-S10 and stub probes: `rr2-logs/stub-{badid,break,default}.log`, `rr2-evidence/G-S10-FAIL-{badid,break}.png`.
- SC-360 trial merge: `rr2-mergetrial/` (a scratch clone), `rr2-logs/merge-{tsc,jest,build,gs10}.log`.
- Snapshots: `rr2-snap-{c616e22,aa43bc0,6bcf9c8}/`.
