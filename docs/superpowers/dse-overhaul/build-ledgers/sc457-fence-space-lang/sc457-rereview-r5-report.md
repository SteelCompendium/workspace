# SC-457 scoped re-review r5 (after fix round 4)

**Executive summary**
- **Verdict: LAND.** Option (a) is implemented as ruled. Fix round 4 introduces no regression against develop.
  - Every opener develop handles, HEAD handles the same way in real Obsidian. That includes the Live Preview pin of ```` ```ds-counter x ````.
  - A fuzz over 2,011,170 info strings finds no case where HEAD and develop disagree about the registered name, apart from the intended leading space/tab skip.
- **Heads:** dse `772c3cda70ad029a473c3331c5608d30bdc0ce08` (11 commits on `bc4a0c5` = current `origin/develop`); superproject `a61ad42` (1 commit, CHANGELOG only, on `72e548c`).
- **Superproject `origin/main` has moved to `9f37173`.** The 4 new commits are docs, handoffs and ledgers; `CHANGELOG.md` is untouched. The bullet applies at offset 0, so the rebase is trivial.
- **Findings:** HIGH 0 · MEDIUM 0 · LOW 0. The implementer's extra rule (a whitespace-only name returns '') is correct and matches develop.
- **Gates I ran at `772c3cd`:**
  - tsc (incl. `-p e2e`), lint: rc 0.
  - jest: **5536 passed / 1 skipped / 233 of 234** (base 5457 + 79; +1 suite = `reading-mode-host-spaced-fence.test.ts`).
  - lifecycle: **31/31** (G-S13, G-S14, G-S15 ok).
  - e2e: **`89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`**.
- **From the implementer's run11** (log times 13:27-13:48, after the 13:25 commit): shots 580 PNGs / 0 FAIL, `freeze OK (280/280 …)`, parity 0/0/24, all rc 0.

## What was verified
1. **Rebase.**
   - `git range-diff 1c271b5..c290e89 bc4a0c5..772c3cd`: commits 1-10 are `=`, and `772c3cd` is the only new commit.
   - Net `obsidian-lifecycle.mjs` diff against `bc4a0c5` is +80/-0, byte-identical to the r4 additions.
   - G-S13 and G-S15 scenario blocks have the same md5 at `origin/develop` and at HEAD.
   - Superproject: one CHANGELOG-only commit.
2. **The rule.** `fenceLanguage`: skip leading `[ \t]`, take the `[^ \t]` token, cut it at the first `\s` (`/^\s*\S*/`), and return '' when the result is whitespace only. The e2e `typeOf` is written separately to the same rule. `anchor.ts` `matchFenceLine` is unchanged.
   - **Fuzz** (`scripts/sc457-r5-fuzz.mjs`, `fuzz.txt`): 2,011,170 strings over a 13-character set (space, tab, NBSP, U+3000, FF, VT, U+FEFF, U+200B, U+2003, letters, `-`, CR).
     - Host and anchor give different languages: 0 cases.
     - HEAD and develop (develop's `\S*` after the intended `[ \t]` skip) disagree about whether the name is the alias: 0 cases.
     - HEAD claims the alias where develop does not, other than a leading space/tab: 0 cases.
   - **Whitespace-only addition: correct.** Without it, ```` ```\r ```` (the e2e scanner keeps CRs) and ```` ```  ```` would get a whitespace "language". Develop gives '' for both, and so does HEAD. A leading NBSP/U+3000/FF/VT followed by a name still keeps that character (` ds-x`), so it is never a registered alias.
3. **Real Obsidian 1.14.4.**
   - **r4 break set (8 openers × RV/LP × write/leave/pin), HEAD against develop `bc4a0c5`:** all 8 rows are **identical** (`probe-{head,dev}-break/break.json`).
     - `nbsp-x` Live Preview pin: anchored, panel mounted, `[11]`.
     - Em space, U+FEFF trailing, em space plus a word, and `~~~ds-counter  x` all render, write and pin.
     - Leading U+FEFF and the backtick-in-info opener are not rendered and not claimed.
     - The zero-width-space opener behaves the same as develop (SC-487).
   - **r3 render / write / race / pin sets on HEAD:**
     - Leading NBSP, U+3000, FF and VT: not rendered, not claimed.
     - Each opener develop handles behaves the same on HEAD. That covers trailing NBSP / U+3000 / FF, `  x`, `　 extra`, and `nbsp-x` in LP.
     - Each spaced opener (one space, tab, callout, leading space plus a trailing exotic space, CRLF) saves in RV, RV + leave, LP and LP + leave, all `[11]` with 0 notices.
     - Twin races `[5,6]`. Pin sets: 6/6.
4. **Expected-language table and pins.**
   - The table's `ds-x x`, `ds-x　x`, `ds-x  x` (etc.) rows expect `ds-x`, and every parse is asserted equal to the expected value.
   - The Live Preview pin-path tests exist (`registration.test.ts`, `sidebarBlockHost.test.ts`, for `ds-counter x`).
   - With `c290e89`'s `fenceLanguage` and `typeOf` put back, **9 tests fail across 6 suites** (`old/jest-old.log`): registration, sidebarBlockHost, e2eIntegrity, 4 blockPrefix rows, the reading-mode host, and scanFenceState. The pins are not vacuous.
5. **CHANGELOG.** Both bullets are unchanged since r3: they name the measured trigger and say "the space before the block name is kept".
6. **Worktree.** `git status --porcelain` (with `--ignored`) is identical before and after. The superproject was read only.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-r5-be71a0a9/`)
- Range-diff and lifecycle check: `range-diff.txt`, `lc-added-new.txt`.
- Fuzz: `fuzz.txt`, `scripts/sc457-r5-fuzz.mjs`.
- Gates: `head/{tsc,lint,jest,lifecycle,e2e}.log` with `.rc` files.
- Pins on round-3 code: `old/jest-old.log`.
- Probes: `probe-head/lifecycle.log` (r3 sets), `probe-head-break/break.json`, `probe-dev-break/break.json`.
- Probe sources: `scripts/sc457-r5-*.mjs`.
- Superproject CHANGELOG dry-run: `super-trial.patch`.
- Status snapshots: `status-*.txt`.
- Implementer logs used: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-impl-r1/run11/{shots,freeze,parity}.log`.
