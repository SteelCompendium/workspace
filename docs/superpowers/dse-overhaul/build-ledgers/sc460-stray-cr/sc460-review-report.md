# SC-460 independent review — round 1 (dse `sc460-stray-cr` @ 3045082, base `188755b`)

**Executive summary**
- VERDICT: **FIX-REQUIRED**. Findings: 0 CRITICAL / 0 HIGH / 2 MEDIUM / 1 LOW / 6 INFO.
- MEDIUM-1: the owner's fold-in ruling is not implemented. A note whose only line breaks are lone CRs still gets its rewritten block in LF, so the note becomes mixed. This was measured in real Obsidian on the Reading view, Live Preview and sidebar paths. The fix is three lines in `lineEnding.ts` (prescribed below). I trialled it in scratch: tsc clean, jest 1 expected red (the row that pins the old rule), fuzz 27,000/0 under the ruling, and real Obsidian keeps a CR-only note CR-only.
- MEDIUM-2: the tests miss three call-site reverts in `ReadingModeBlockHost`: `parseOpenFence`, `resolveWriteTarget`'s `lines`, and `locateInSection`. Each one passes the whole jest suite (0 failed). With the `resolveWriteTarget` revert, a write after the section has gone stale silently deletes fence lines. Five ready-made test cases close this gap.
- The fix itself holds. Real Obsidian 1.14.4, head bundle: Reading view 30/30 fixtures byte-exact against my own oracle, Live Preview 14/14, multi-step 20/20, sidebar 13/13 (pure-CR is exact only under the implementer's LF policy, which is MEDIUM-1). On the base bundle, Reading view landed only 7/30, Live Preview 10/14, and the sidebar pinned the wrong block in 4 cases. `\r\r\n` is two breaks, measured directly.
- Gates on head, all re-run: tsc rc 0 · lint rc 0 · jest **5307 passed / 1 skipped / 229 of 230** · lifecycle **28/28** (G-S12 FAILS on the base bundle, ok on head) · e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` · shots 572, 0 FAIL, `pressed toggle parity OK (96 …)`, button host-leak 112/672 · freeze `276/276` · parity 0 gap / 0 undeclared / 24 declared.
- FAIL-on-base: 31 of 49 SC-460-titled tests fail on base src, which confirms the implementer's 31. The `lastWritten` drive-by is correct: SC-453's self-echo cases (extBetween, abort, noop, crlfSrc, loneCr, rapid, staleEcho, rejected) give identical results on base and head for LF, CRLF and lone-CR-above notes.
- Tree: `git status --porcelain` is identical before and after (dse empty; superproject ` M draw-steel-elements`). Head is still 3045082, nothing was committed, and the scratch worktrees are removed.

## Findings

### MEDIUM-1 — a CR-only note gets an LF block (owner ruling "fold into the fix round" not done)
- **Where:**
  - `src/framework/host/lineEnding.ts:22` (`Eol = '\r\n' | '\n'`)
  - `:28-40` (`detectEol`: lone CRs cast no vote, so a note with no CRLF/LF returns `'\n'`)
  - `:83-84` (`toEol` knows only CRLF)
  - Consumers: `fenceLine.ts:100-108` (`replaceFenceBlock`), `:128` (`replaceFenceBody`, the anchor stamp), and `elements/encounter/view.ts:498-499` (tracker append).
  - The test that pins the current behaviour is `test/unit/framework/lineEnding.test.ts:29` (`'a\rb\rc' -> '\n'`).
- **Failure (real Obsidian, head bundle, fixture `# t\r\rA\r\r<block in CR>\r\rBELOW\r`):**
  - A Reading view click writes ``` ```ds-counter\nmax_value: 20\n…\n``` ``` between untouched CRs. The note is now mixed. Live Preview does the same.
  - A sidebar pin stamps ``` ```ds-counter\rname: Health\ncurrent_value: 10\n…\n_dse_anchor: d5b05a\n``` ```. The open fence keeps its CR and the body lines are LF.
  - A no-op host write (`replaceSource(lastKnownBody)`) is not a byte no-op either: it fires 1 `modify` and changes bytes.
  - After this first write, LF has votes, so every later write stays LF.
- **Prescribed fix (trialled in scratch; logs below):**
  1. `export type Eol = '\r\n' | '\n' | '\r';`
  2. In `detectEol`, before the tie check: `if (crlf === 0 && lf === 0) return text.includes('\r') ? '\r' : '\n';`. This is exactly "only lone-CR breaks → CR". A stray CR in an LF or CRLF note still casts no vote, so the implementer's concern stays covered.
  3. `toEol`: `return eol === '\n' ? text : text.replace(/\r?\n/g, eol);`
  4. `fenceLine.ts` needs no change: its `stripCr(newSource)` branch and the close-terminator rule already work for `'\r'`.
  5. Rewrite the test row at `lineEnding.test.ts:29` to expect `'\r'`. Add jest cases for a pure-CR note (Reading host, the `replaceFenceBody` stamp, encounter append). Ideally add a `straycr-purecr.md` fixture to G-S12.
- **Trial result:**
  - tsc clean.
  - Full jest: 5303 passed / 1 failed. The one failure is that row, as expected.
  - My fuzz under the ruling oracle: 27,000 cases, 0 mismatches. On head, before the fix, 1,052 of them differ from the ruling.
  - Real Obsidian with the trial bundle: pure-CR Reading view, Live Preview, sidebar stamp and panel write are all byte-exact CR. LF, CRLF and mixed fixtures are unchanged.
- **Judgment call for the owner (no action needed unless you want it):** the rule above keeps a mostly-CR note that has a single LF on LF. If you prefer "CR when lone CRs are a strict majority of all breaks" (`cr > crlf + lf`), that is also safe against strays. It is not what the ruling literally says.

### MEDIUM-2 — three call-site reverts in `ReadingModeBlockHost` survive the whole suite; one corrupts silently
- **Where:**
  - `src/framework/host/ReadingModeBlockHost.ts:80` (`parseOpenFence`)
  - `:636` (`resolveWriteTarget`'s `lines`)
  - `:215` (`locateInSection`)
- **Evidence:**
  - Reverting each one to `split('\n')` (mutants M2, M3, M5) leaves the full jest suite green: 5304 passed / 0 failed each.
  - The SC-455 locate-in-section and durable fallbacks hide them in the fresh-section cases the tests use.
  - They only show when the section hint is stale, which is the SC-343 durable path: a click, then an external edit inside the debounce. My stale-section fuzz kills them (M2 16, M3 2, M5 9 of 300).
- **Failure with M3:**
  - A write after lines were inserted above the block is spliced across the wrong range.
  - Seen output: `…\`\`\`\r\ncurrent_value: 902\r\nname: N2\r\nmin_value: 0\r\n\`\`\`\r\nmax_value: 20\r\n\`\`\`…`. The block's open fence and `name:` line are gone and a stray `max_value`/fence remains.
  - It returns `true` and shows no Notice.
- **Prescribed fix:** add the stale-section cases in `logs/sc460-review-1792551164/zz-sc460-review-stale.test.ts` to `test/dom/framework/reading-mode-host-durable.test.ts`. Cases B and C are hand-written; D and E are fuzz-derived literal notes.
  - Measured: all 5 pass on head.
  - B and C kill M5, D kills M3, E kills M2, and all five kill M4 and M15.
- Head itself is correct here. In real Obsidian, durable-relocate with lone CRs inserted above lands byte-exact in Reading view and Live Preview, with 0 Notices. The jest fuzz `stale` mode gives 3,000/0.

### LOW-1 — the encounter-append line hint (`elements/encounter/view.ts:496`) is untested
- **Evidence:** mutant M17 (`trimmed.split('\n').length + 1`) passes all tests.
- **Consequence if it regresses:** in a note with a lone CR above, "Open in sidebar" hands `sendToSidebar` a cursor line one short. `findFenceAtLine` then misses the new tracker and falls back to the nearest/first block with a "multiple blocks" Notice when there are several.
- **Fix:** one jest case (encounter "Open in sidebar" in a note with `a\rb` above) asserting the returned `lineStart` equals the Obsidian-numbered fence line of the appended block.

### INFO
1. **`lastWritten` drive-by (§7): correct, no detection change.**
   - The SC-453 re-review race probe was extended to LF, CRLF, LF and CRLF with a lone CR above, and pure-CR, with 80 cases each on base and head.
   - Every LF, CRLF and lone-CR-above record is identical between base and head: extBetween reports the external edit and the write lands; abort gives `lost=1` and then reports the return; noop, crlfSrc and loneCr give `ext=[]`; rapid async gives `[]`; staleEcho gives `[]`; rejected behaves as SC-453 INFO-2.
   - Pure-CR records differ only because base refused every pure-CR write and head lands them, with the same self-echo outcomes as LF.
   - Fuzz: 3,000 anchored sidebar writes on random-terminator notes, 0 spurious `onExternalChange` and 0 `lost`.
   - Mutant M13 (the old counted range) is killed by the existing SC-453 lone-CR test, so the change is required as the implementer said.
2. **`\r\r\n` = two breaks: confirmed in real Obsidian.**
   - Fixtures `A\r\r\nB` in LF and CRLF notes: the reading-view section and the metadata cache code section are both `[6,11]`, and the editor line count is 15.
   - Obsidian's rule predicts 6 / 15; `\r?\n` would give 5 / 14.
   - Also measured: lone CR, several CRs, CR in a heading, CR in the body, fence directly after a CR, mixed notes and pure-CR all follow `/\r\n|\r|\n/`; U+2028 is not a break.
3. **Lone CR inside the block body (implementer's documented decision): it holds and loses nothing.**
   - `lf-crInBody` and `crlf-crInBody`: every field is kept, the body is re-emitted in the note's ending, and outside bytes are exact (Reading view and Live Preview).
   - Side effect: an "identical content" host write still rewrites that CR, so it is 1 `modify` and not a byte no-op. This is within the decision, not a defect.
4. **Equivalent / wording-only mutants:**
   - M6 (`livePreviewCalloutSection` splitting `editor.getValue()`): that text is LF-normalised editor text, so `splitLines` and `split('\n')` agree. The change is cosmetic.
   - M7 (`looksLikeList`) only words the Notice.
   - No action.
5. **Out of scope, pre-existing, not SC-460:** "Send block to sidebar" with the cursor on the OPEN fence line does nothing and shows no Notice. This was measured on head and base, with and without lone CRs. `aliasAtLine` scans only lines above the cursor (`registration.ts:32-45`). The palette hides the command there, but a hotkey press is silent. Owner's call whether to file it.
6. **Mutation coverage otherwise good** (5 touched files, 272 tests; M0 control 0 failed):

   | Mutant | Tests killed |
   |---|---|
   | M1 `splitLines` old rule | 31 |
   | M1b `splitWithEols` old rule | 26 |
   | M4 `locateByBody` | 1 |
   | M8 `replaceFenceBlock` old split | 35 |
   | M9 `replaceFenceBody` | 4 |
   | M10 close terminator off by one | 29 |
   | M11 close terminator always dominant | 1 |
   | M12 splice off by one | 65 |
   | M13 | 1 |
   | M14 sidebar `extractBody` | 1 |
   | M15 anchor `iterateFences` | 14 |
   | M16 registration | 3 |
   | M18 `detectEol` counts lone CR as LF | 1 |

   Survivors: M2, M3, M5 (MEDIUM-2), M17 (LOW-1), M6, M7 (INFO-4).

## Spec conformance (ledger owner rulings)
1. *"Measure first … what getSectionInfo counts as a line break … Reading view AND Live Preview, and whether the SC-455 Notice now fires"* — **PASS.**
   - The implementer's table was re-measured (INFO-2).
   - Base shows exactly one "can't tell where this block sits" Notice per dropped click. Base Reading view landed 7/30 and base Live Preview 10/14.
2. *"Map Obsidian's section line numbers … One shared helper … compose with SC-453 `lineEnding.ts` and SC-455's blockquote-prefix helper"* — **PASS.**
   - `splitLines` / `splitWithEols` live in `lineEnding.ts` and every locate/write site uses them.
   - `blockPrefix.ts` is untouched.
   - Callout fixtures with a lone CR inside the callout and above it land byte-exact (Reading view and Live Preview).
3. *"Byte integrity: the lone `\r` itself and every byte outside the written block survive unchanged (LF note, CRLF note, mixed). A lone `\r` INSIDE the block body: decide and document"* — **PASS for LF, CRLF and mixed** (real Obsidian oracle-exact; fuzz 27,000/0). The body-CR decision holds (INFO-3).
4. *"Survey every other locate/write site … fix in-scope ones with the same helper, report the rest"* — **PASS.**
   - My grep found the same sites as the implementer's survey.
   - Real-Obsidian lone-CR probes on each site: sidebar panel write, `anchor.ts` find (pin from the cursor on close/body lines, 2nd and 3rd blocks), `registration.ts` stamp splice (byte-exact), and the Live Preview path. All pass.
   - Base pinned the wrong block in 4 cases and stamped nothing in 3.
   - Test gaps: MEDIUM-2 and LOW-1.
5. *"No silent failure may remain on this path"* — **PASS.**
   - User-deleted block during the debounce: exactly 1 Notice ("changed on disk first"), and the edit is kept (Reading view and Live Preview).
   - Host no-op: 0 Notices, 0 `modify`, bytes unchanged (LF, CRLF, mixed).
   - Base dropped the deleted-block Reading-view case with no Notice.
- Follow-up ruling *"fold into the fix round — a CR-only note must stay CR-only"* — **NOT DONE** → MEDIUM-1.

## Probe results by brief item
- **§2.2 / §2.3 real Obsidian 1.14.4** (my own harness copy plus an independent byte oracle built from the fixture parts; base `42f1445c…` vs head `e002a3b9…` = the worktree's main.js):
  - **Reading view:** 30 fixtures. They cover:
    - lone CR above/below in LF and CRLF notes, and several CRs (one at byte 0)
    - `\r\r\n`
    - a CR in a callout above a callout block (prefixed and lazy)
    - two blocks in both orders (LF and CRLF), identical twins (#0 and #1), and three blocks written 2-0-1
    - a CR in the body, a CR on the open fence, a CR on the close fence (LF and CRLF), a fence directly after a CR
    - mixed notes (CRLF-dominant and LF-dominant), pure-CR, a CR in frontmatter, a CR in a heading, U+2028, EOF with no newline

    Head: 30/30 exact, 1 `modify` each, 0 Notices, 0 errors (pure-CR exact only under the LF policy). Base: 7/30.
  - **Live Preview:** 14 fixtures. Head 14/14 (same caveat). Base 10/14. Re-read after a 6 s settle: still exact, single `modify`.
  - **Multi-step:** durable relocate (lone-CR lines inserted above inside the debounce) is exact in Reading view and Live Preview for LF, CRLF and two-block notes. The deleted-block case shows 1 Notice. The no-op cases are covered under conformance item 5.
- **§2.3 fuzz:** `zz-sc460-review-fuzz.test.ts` generates random LF/CRLF/lone-CR terminators around 1-3 blocks. Modes: reading, Live Preview (LF-normalised text), twins, stale, sequential cross-block, pure-CR, anchored sidebar with self-echo, `replaceFenceBody`, and `listFences` numbering. 3,000 cases per mode.
  - Head: 0 mismatches under the LF policy.
  - Base: 1,551–2,998 mismatches per mode.
- **§2.5:** FAIL-on-base 31/49. Mutants: INFO-6.
- **§2.7 battery:** all gates were re-run on head (none reused), numbers in the summary.

## Evidence — `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/logs/sc460-review-1792551164/`
- **Gates:**
  - `gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-rc.txt`
  - `gate-lifecycle.log`, `gate2-rc.txt`
  - `gate-e2e.log`, `gate3-rc.txt`
  - `gate-shots.log`, `gate-freeze.log`, `gate4-rc.txt`
  - `gate-parity.log`, `gate5-rc.txt`
  - G-S12 base vs head: `gs12-base.log`, `gs12-head.log`
- **Real Obsidian:**
  - harness: `sc460-review-probe-scenarios.mjs`, `sc460-review-mkprobe.mjs`, `sc460-review-probe-run.sh`
  - Reading view: `rv-read-{head,base}.log`
  - Live Preview: `rv-lp-{head,base}.log`, `rv-lp-head-settle6s.log`
  - multi-step: `rv-multi-{head,base}.log`
  - sidebar: `rv-sb-{head,base}.log`, `rv-sb-head-open.log`
  - numbering measurement: `rv-measure-head.log`
- **Fuzz:** `zz-sc460-review-fuzz.test.ts`, `fuzz-{head,base}-3000.{json,log}`
- **Mutations:**
  - runner and summary: `sc460-review-mutate.py`, `mutation.log`, `mutation-summary.json`, `mut-*.json`
  - full-suite runs for the survivors: `mutfull.log`, `mutfull-*.json.gz`
  - stale-case kill matrix: `zz-sc460-review-stale.test.ts`, `stale.log`
- **FAIL-on-base:** `failonbase.json`, `failonbase.log`
- **Self-echo:** `zz-sc460-review-race.test.ts`, `race-{base,head}.json`
- **MEDIUM-1 fix trial:** `sc460-review-fixtrial.py`, `fixtrial.log`, `fixtrial-fuzz.json`, `fixtrial-jest.json.gz`, `fixtrial-obs.log`
- **Tree state:** `status-before-{dse,super}.txt`
