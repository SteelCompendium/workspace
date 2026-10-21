# SC-457 scoped re-review r4 (after fix round 3)

**Executive summary**
- **Verdict: FIX-FIRST, owner ruling needed (MEDIUM-1).** Fix round 3 does what r3 asked; MEDIUM-1 is closed in real Obsidian. The break attempt found one opener where the expected value in the new table is wrong for Live Preview. Pinning ```` ```ds-counter x ```` from Live Preview works on develop and breaks on HEAD: an anchor is stamped, the panel shows "unavailable", and the write is lost.
- **Heads:** dse `c290e892cbb7c7ac36acb1c088646b8c8fe2f00d` (10 commits on `1c271b5`); superproject `cf1a60e` (1 commit, CHANGELOG only, on `7e48d25`).
- **Both bases have moved again:**
  - dse `origin/develop` = `08206e3` (SC-466). A dry-run patch of the branch applies cleanly. The e2e baseline becomes 89/93.
  - Superproject `origin/main` = `5cc6196`. The CHANGELOG applies at offset +6.
- **Findings:** HIGH 0 · MEDIUM 1 · INFO 2 (both pre-existing).
- **Gates I ran at `c290e89`:**
  - tsc (incl. `-p e2e`), lint: rc 0.
  - jest: **5495 passed / 1 skipped / 232 of 233**.
  - lifecycle: **31/31** (G-S13, G-S14, G-S15 ok).
  - e2e: **`88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`**.
- **From the implementer's run9:** shots 572 / 0 FAIL, `freeze OK (276/276)`, parity 0/0/24. I used run9, not run8: run8 is the superseded old-base partial run, and its `shots.log:623` reads `FAIL sweep (exception)`.

## MEDIUM-1: ```` ```ds-counter x ```` (no-break space INSIDE the info word): Live Preview pin regresses against develop
Obsidian's two modes disagree on this opener: Reading view shows plain code, Live Preview renders the block. Develop's language is `ds-counter` (`\S*` stops at the NBSP). Since fix round 1 (`d81c3a2`), HEAD's language is `ds-counter x`. The table now pins that value as the expected one: `test/unit/e2eIntegrity.test.ts`, row `['```ds-x x', 'ds-x x']`.

Measured in real Obsidian 1.14.4 (R4-BREAK, `P4/nbsp-x.md`):

| | develop `1c271b5` | HEAD `c290e89` |
|---|---|---|
| Reading view rendered | no | no |
| Live Preview rendered | yes | yes |
| Live Preview write (stay / leave the note) | `[11]` / `[11]` | `[11]` / `[11]` |
| Live Preview "Pin to sidebar" | anchored, panel mounted, panel write `[11]` | **anchor stamped into the note, panel `data-dse-sidebar-unavailable`, panel write `[10]`** |

This is the same kind of failure as r3's MEDIUM-1, in the one mode where Obsidian draws the block.

The owner dropped INFO-4 in r1 because "DSE unchanged". That stopped being true at fix round 1, and my r2 and r3 reviews only probed writes for this opener, not pinning.

There is no answer that agrees with both modes, so the owner has to pick one:
- **(a) Restore develop's behaviour for an exotic space INSIDE the word**, and keep the leading `[ \t]`-only rule:
  ```js
  const tok = /^[ \t]*([^ \t]*)/.exec(info)![1];
  return /^\s*\S*/.exec(tok)![0];
  ```
  - ` ds-counter` → unchanged, not claimed ✓
  - `ds-counter `, `ds-counter　 extra` → `ds-counter` ✓
  - `ds-counter x` → `ds-counter`: matches Live Preview and develop; claims a fence that Reading view does not draw, as develop already does.
  - Table rows `ds-x x` and `ds-x  x` change to `ds-x`. Apply the same rule to e2e `typeOf`, and add a Live Preview pin test.
- **(b) Accept the regression and file it** (Live Preview only, rare opener). Even then the pin should not stamp an anchor it cannot use. A follow-up could make `requestPinToSidebar` refuse an alias that is not registered.

My recommendation is (a): it matches develop for every opener where develop already worked.

## INFO (pre-existing on develop, not caused by this branch)
- **INFO-1:** ```` ```ds-counter​ ```` (zero-width space, which is not whitespace in JS). Reading view shows plain code; Live Preview renders the block. Both develop and HEAD give the language `ds-counter​`, and the Live Preview pin is broken the same way on both.
- **INFO-2:** ```` ```ds-counter `x` ````. A backtick in a backtick fence's info string makes it not a fence (CommonMark), and Obsidian does not render it in either mode. DSE's `matchFenceMarker` still parses it as a `ds-counter` fence, on develop and HEAD alike. It is never rendered, so the only exposure is the body-locate claim (SC-480 territory).

## What was verified
1. **Rebase.**
   - `git range-diff 0ce76dd..690c783 1c271b5..c290e89`:
     - Commit 1 is `!`: the lifecycle merge.
     - Old commit 3 is `<`: dropped as empty.
     - Commits 2 and 4-10 are `=`.
     - New: `c290e89`.
   - Net `obsidian-lifecycle.mjs` diff against `1c271b5` is +80/-0. Its added lines are byte-identical to the r3 net additions (`lc-added-{old,new}.txt`).
   - G-S13 and G-S15 scenario blocks have the same md5 at `origin/develop` and at HEAD. Ids sit at :1756 (G-S13), :1812 (G-S15) and :1897 (G-S14).
   - Superproject: one CHANGELOG-only commit.
2. **MEDIUM-1 (r3) fixed.**
   - `fenceLanguage = /^[ \t]*([^ \t]*)/.exec(info)![1].trimEnd()`, and the same rule in `typeOf`.
   - R3-PIN2: ```` ```ds-counter  x ```` and ```` ```ds-counter　 extra ```` anchor, mount the panel and land `[11]` with no notice.
   - R3-WRITE2: every case lands, and the language is `ds-counter`.
   - The full r3 `write.json` set (36 cases) is unchanged from r3: one space, tab, callout, trailing NBSP / U+3000 / FF, CRLF all land in RV, RV + leave, LP and LP + leave.
   - The NBSP and U+3000 twin races give `[5,6]`. R3-PIN: 4/4 ok.
   - Further openers tried (HEAD equals develop on all of them): em space U+2003 trailing, U+FEFF trailing, `ds-counter  extra`, `~~~ds-counter  x`. All render, get `ds-counter`, write, and pin ok. `﻿ds-counter` is not rendered and not claimed.
3. **Expected-language table.** It exists, and every parse (host, anchor, e2e) is asserted equal to the expected value. The wrong row is `ds-x x` (MEDIUM-1). Every other row agrees with what I measured.
4. **The pin-path tests fail on round-2 code.** I put `blockPrefix.ts` and `noteFences.ts` from `c1eab2a` (the rebased `690c783`) into a copy of `c290e89`. Result: 6 failures across 4 suites: `registration` ×2, `sidebarBlockHost` ×2, `e2eIntegrity` open-line, `schemaSuggest` U+3000 (`old/jest-old.log`).
5. **Worktree.** `git status --porcelain` (with `--ignored`) is identical before and after. The superproject was read only.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-r4-be71a0a9/`)
- Range-diff and lifecycle check: `range-diff.txt`, `lc-added-old.txt`, `lc-added-new.txt`.
- Gates: `head/{tsc,lint,jest,lifecycle,e2e}.log` with `.rc` files.
- Pins on round-2 code: `old/jest-old.log`.
- r3 probe set on HEAD: `probe-head/` (lifecycle log with R3-WRITE, R3-RACE, R3-PIN, R3-WRITE2, R3-PIN2).
- Break attempts: `probe-head-break/break.json` (HEAD), `probe-dev-break/break.json` (develop).
- Probe sources: `scripts/sc457-r4-*.mjs`, `scripts/sc457-r4-probe-harness-injected.mjs`.
- Rebase dry-runs: `rebase-trial.patch`, `super-trial.patch`.
- Status snapshots: `status-*.txt`.
- Implementer logs used: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-impl-r1/run9/{shots,freeze,parity}.log`.
