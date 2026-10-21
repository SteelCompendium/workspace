# SC-457 scoped re-review (after fix round 1)

**Executive summary**
- Verdict: **FIX-FIRST.** The fix round introduced a regression against develop: a block whose language is followed by a no-break space or U+3000 (```` ```ds-counter  ````) loses its write again (HIGH-1). The fix is one line.
- Reviewed: dse `24b27037ebe395a1f3485540fd4ab8b98468ffe2` (8 commits on `aaa88b7`); superproject `e9c51ce` (1 commit, CHANGELOG only, on `e0d3f47`).
- Range-diff against r1: commits 1-5 are identical (`=`). The new commits are `7f32b1a` (LOW-1, LOW-3), `52f10d8` (LOW-2) and `24b2703` (O10).
- Findings: HIGH 1 · MEDIUM 1 (base moved again) · LOW 0 · INFO 1 (pre-existing).
- Gates run by me at `24b2703`:
  - tsc (incl. `-p e2e`) and lint: rc 0.
  - jest: **5447 passed / 1 skipped / 232 of 233 suites**.
  - lifecycle: **29/29** on the first attempt, at load 13.7. I saw no MutationObserver start-up error in this run or in my 2 probe runs.
  - e2e: **`88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`**.
- Taken from the implementer's `run5`, since the delta touches no rendering code: shots 572 / 0 FAIL, `freeze OK (276/276 …)`, parity 0/0/24.
- LOW-1 (leading NBSP, U+3000, FF and VT are no longer claimed; the NBSP-twin race is fixed), LOW-2, LOW-3 and O10 are correctly folded.

## HIGH-1: a trailing no-break space or U+3000 after the language drops the write
**Location:** `src/framework/host/blockPrefix.ts:56`, `fenceLanguage` = `/^[ \t]*([^ \t\r\n]*)/.exec(info)![1]`. The token now ends only at a space, tab or line end. It used to end at any `\s`. Both the r1 and base versions ended the token at a Unicode space.

**There are two definitions again.**
- The host reads the untrimmed `match.rest`: `parseOpenFenceLine` (`fenceLine.ts:43`) → `fenceLanguage`.
- The anchor path trims the end first: `matchFenceLine` (`anchor.ts:249`) applies `.trimEnd()`, then `fenceAlias` runs.
- For `ds-counter ` the host returns `'ds-counter '` and `listFences` / `iterateFences` return `'ds-counter'`.

**Measured in real Obsidian 1.14.4** (my probes R2-RENDER and R2-WRITE, HEAD vs base `c03db7a`):

| opener | Obsidian renders as block (RV / LP) | HEAD language | base language | HEAD: RV click, then leave note | base: RV click, then leave note |
|---|---|---|---|---|---|
| ```` ```ds-counter  ```` | yes / yes | `ds-counter ` | `ds-counter` | **dropped, `[10]`, 1 "not saved" notice** | lands, `[11]`, 0 notices |
| ```` ```ds-counter　 ```` | yes / yes | `ds-counter　` | `ds-counter` | **dropped, 1 notice** | lands |
| ```` ``` ds-counter  ```` | yes / yes | `ds-counter ` | `''` | **dropped, 1 notice** | dropped (the original SC-457 bug) |

How the drop happens:
1. The host's durable identity is `knownLanguage = 'ds-counter '`.
2. `locateByBody` → `listFences(content, 'ds-counter ')` never matches, because `iterateFences` names the same fence `'ds-counter'`.
3. Result: a miss and the SC-455 notice. This is exactly the defect class SC-457 fixes, and it now hits a fence Obsidian renders.

Other effects of the same change:
- `getBlockInfo().language`, `blockKey` and the chrome "Pin to sidebar" alias carry the NBSP. `requestPinToSidebar` → `bindBlockToSidebar` with alias `ds-counter ` → "couldn't find that block". I did not probe this path; it is inferred from the code.
- `fenceScan.ts` (O10) now gives `lang = 'ds-counter '`, so autocomplete stops working in a block Obsidian renders. At `aaa88b7` SC-476 gave `ds-counter`.

**The pins miss it.** The `e2eIntegrity` table has no trailing-exotic-space opener. Adding `'```ds-x '` and `'```ds-x　'` to the table at HEAD fails `open-line recognition`: `Expected: "ds-x"`, `Received: "ds-x "` (`probe-head/jest-trailing-nbsp.log`).

**Prescribed fix.** Trim the end before taking the token, matching the measured Obsidian rule:
- `fenceLanguage = (info) => /^[ \t]*([^ \t]*)/.exec(info.trimEnd())![1]`.
  - `ds-counter ` → `ds-counter` (rendered ✓).
  - ` ds-counter` → ` ds-counter` (not rendered ✓).
  - `ds-counter x` → unchanged (Reading view does not render it; Live Preview does; INFO-4 was dropped).
- Make the e2e `typeOf` (`e2e/driver/noteFences.ts:42`) use the same rule.
- Add `'```ds-x '`, `'```ds-x　'` and `'``` ds-x '` to the e2eIntegrity table.
- Add jest pins: a reading-mode host durable write for ```` ```ds-counter  ````, and a `scanFenceState` case.

## MEDIUM-1: the base moved again
- dse `origin/develop` = `0ce76dd` (SC-326: montage, plus lifecycle G-S13 in `visual-harness/obsidian-lifecycle.mjs` and CHANGELOG). A dry-run `patch` of `aaa88b7..24b2703` onto it **fails 2 of 4 hunks in `obsidian-lifecycle.mjs`**: the header comment at :39 and the fixtures at :175. The CHANGELOG applies at offset +6, and everything else applies.
  - The conflict is mechanical: keep both G-S13 and G-S14.
  - The expected lifecycle total after the rebase is **30/30**.
- Superproject `origin/main` = `c4ff5cc`, past `e0d3f47`. The CHANGELOG-only commit applies at offset +7.

## INFO-1 (pre-existing, outside the delta): a section write strips a trailing no-break space or U+3000 from the opening line
`fenceLine.ts` `info: match.rest.trimEnd()` removes Unicode spaces, not just `[ \t]`.
- Base does the same: R2-WRITE `open=false` on both HEAD and base, for `trail-nbsp`, `trail-ideo` and `sp-trail-nbsp`.
- So "the opening line is left exactly as written" (both CHANGELOG bullets) does not hold for those openers.
- Low impact. Fold `trimEnd` → `replace(/[ \t]+$/, '')` only if the owner wants it; otherwise file it.

## What was verified
1. **Rebase.**
   - The dse branch is on `aaa88b7`. `git range-diff c03db7a..bf3a3b4 aaa88b7..24b2703`: commits 1-5 `=`, plus 3 new commits.
   - The superproject is one commit (`e9c51ce`); its diff against its base is `CHANGELOG.md` only, with no SKILL.md.
   - Both bases have since moved (MEDIUM-1).
2. **LOW-1.**
   - Leading skip is `[ \t]` only, in `fenceLanguage` and in `matchFenceLine` (`replace(/^[ \t]+/, '')`).
   - `matchFenceLine`'s tail keeps `trimEnd()`, so `isFenceClose`'s `rest === ''` is unchanged. `info` is unchanged (`fenceLine.ts`).
   - Real Obsidian, HEAD: NBSP, U+3000, FF and VT before the language are not rendered (RV and LP), and DSE claims none of them.
   - The NBSP-twin race now writes the real block: `claim-nbsp` `[5,6]` and `claim-ideo` `[5,6]`, 0 notices (base `[6,5]`).
   - One space, a tab and a callout still save, staying or leaving, in RV and LP. All 12 cases give `[11]`, 0 notices, opening line kept. On base, every RV-leave case drops, and so do callout LP and LP-leave.
   - `e2e/` change: `noteFences.ts` `typeOf` plus its comment only. The `e2eIntegrity` table gained 6 openers. It has the hole described in HIGH-1.
3. **LOW-2.** Both bullets (dse `CHANGELOG.md` and superproject `e9c51ce`) name the measured trigger: "a click made just before leaving the note (switching notes or closing the tab)". Correct.
4. **O10.**
   - `fenceScan.ts` imports `fenceLanguage` from `blockPrefix.ts`.
   - grep finds exactly one definition (`src/framework/host/blockPrefix.ts:56`) across `src/` and `e2e/`.
   - The SC-476 tests pass in the full jest run, and `schemaSuggest.test.ts` pins NBSP and U+3000 before the name → no type.
   - The trailing-NBSP case regressed (HIGH-1).
   - **LOW-3:** the `obsidian-lifecycle.mjs` header now reads "SC-457 appends G-S14:" with no total.
5. **Battery.** Numbers are in the summary. The jest count is 5447 (5399 + 48). The implementer's run5 lifecycle first-attempt exit 2 (`MutationObserver.observe … not of type 'Node'`) did not reproduce for me: 1 gate run and 2 probe runs at load 12-14, all started clean.
6. **Worktree.** `git status --porcelain` (with `--ignored`) is identical before and after. The superproject was read only.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-r2-be71a0a9/`)
- Range-diff: `range-diff.txt`.
- Gates: `head/{tsc,lint,jest,lifecycle,e2e}.log` with `.rc` files.
- Probes on HEAD: `probe-head/` (`render.json`, `write.json`, `race.json`, `lifecycle.log`, `jest-trailing-nbsp.log`).
- Probes on base: `probe-base/` (`render.json`, `write.json`, `race.json`, `lifecycle.log`).
- Probe sources: `scripts/sc457-r2-{fixtures,scenarios}.mjs`, `scripts/sc457-r2-probe-harness-injected.mjs`, `scripts/sc457-r2-e2eIntegrity-with-trailing-nbsp.test.ts`.
- Rebase dry-runs: `rebase-trial.patch` (dse onto `0ce76dd`), `super-trial.patch`.
- Status snapshots: `status-before*.txt`, `status-after*.txt`.
- Implementer logs used for shots, freeze and parity: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-impl-r1/run5/{shots,freeze,parity}.log`.
