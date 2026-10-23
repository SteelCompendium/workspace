# SC-487 scoped re-review r3 (dse `4ec83ea` on develop `9f08f06`; superproject `101bfdd` on main `6a176e6`)

**Executive summary**
- **Verdict: FIX-FIRST, on one MEDIUM.** It is a regression against develop, and my own r2 prescription caused it: I said "both fence kinds" without measuring tilde fences in Reading view.
- **MEDIUM-1 (measured on Obsidian 1.14.4):**
  - **What Obsidian renders:** Reading view renders ```` ~~~ds-counter `x` ```` and ```` ~~~ds-counter x`y ```` as the counter, and so does the tab form ```` ~~~ds-counter<TAB>`x` ````. Live Preview renders none of them.
  - **Base `d152ea4`:** language `ds-counter`. The in-note write lands and the Reading view pin works (anchor stamped, panel mounted, `[11]`).
  - **Head `4ec83ea`:** language `ds-counter `x``. The write still lands in place and by the navigate-away path, but the pin is refused with the "can't pin" Notice, and SC-476's key completion in that fence is gone.
- **Prescribed fix, validated in my private clone:** apply the backtick rule only to backtick fences; for a tilde fence, use Reading view's first word, split on space or tab only.
  - Real Obsidian with this bundle: the 3 rendered tilde forms pin (`[11]`, no Notice, prefix and suffix kept); the 7 unrendered forms are not claimed. A non-breaking space after the name does not separate the word in Reading view (`~~~ds-counter<NBSP>`x`` does not render).
  - Jest on the 65 affected suites: the only failure is SC-476's changed row in `schemaSuggest.test.ts`. That row should revert to `'ds-counter'`.
- **Rebase:** clean. Commits 1, 2 and 4 are `=`. G-S33 differs only by SC-492's header line ("35 scenarios in all with SC-487's G-S33") and the end of G-S32. The r1 src/e2e/test diff and G-S33's added lines are identical. `9f08f06..4ec83ea` touches only SC-487 files plus SC-476's test row. The superproject touches only `CHANGELOG.md` and the dse-verify row (35/35).
- **LOW-R2 fix is applied exactly** (`blockPrefix.ts:67`), with its rows.
- **Gates at 4ec83ea (my runs):** tsc + lint rc 0 · jest 5899 / 3 skipped / 241 of 242 (= 5901 / 1 plus the 2 doc-sync skips) · lifecycle `35/35 ok, 0 failed` (1.15.0; G-S32 and G-S33 ok) · e2e `108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`.
- **From the implementer's r3 logs:** shots rc 0 to the end (host-copy pin 1.15.0, host-leak 678 / 228, text scale 1626 / 107256; 0 FAIL; 592 PNGs). Freeze `280/280`; parity `0 gap(s), 0 undeclared, 24 declared`.

## 1. Rebase integrity

- **dse range-diff `2c61511..97a8bfe` vs `9f08f06..4ec83ea`:**
  - `3469fed = bd66aa4`, `b559be9 = dae541f` and `97a8bfe = 8b8e55c`.
  - `57efd05 ! a247c94`, by context only: the SC-492 header line now reads "(35 scenarios in all with SC-487's G-S33)", and the hunk anchors on G-S32's return line.
  - `diff` of the r1 src/e2e/test diffs is empty. Commit 3's added lines differ only by that header sentence.
  - `4ec83ea` is new.
- **Nothing from SC-488, SC-485 or SC-492 is altered.** `git diff --stat 9f08f06..4ec83ea` lists the 7 SC-487 files plus `test/dom/authoring/schemaSuggest.test.ts`, which is SC-476's row changed by r3 (MEDIUM-1).
- **Superproject:** `merge-base 101bfdd` = `6a176e6`. `6a176e6..101bfdd` touches `CHANGELOG.md` (+12) and the dse-verify row (+1/−1, `35/35`, G-S32 and G-S33 both present).

## 2. LOW-R2 fix

`src/framework/host/blockPrefix.ts:67` is `if (info.includes('`')) return info.replace(/^[ \t]+/, '').replace(/\s+$/, '');`, exactly as ruled. Rows were added:
- e2eIntegrity table (`test/unit/e2eIntegrity.test.ts:196`, 5 rows);
- blockPrefix tests (+4);
- the registration pin-refusal test (+1).

For BACKTICK fences this is right. Real Obsidian on head: ```` ```ds-counter `x ```` renders in neither mode, and DSE does not claim it.

## 3. The open question, measured (Obsidian 1.14.4)

Probe: `R-MEAS` (Reading view, Live Preview, in-note write, chrome pin in each mode where rendered) plus `R-DUR` (Reading view: 8 lines shifted above, click, navigate away 30 ms later). Fixtures are built with `String.fromCharCode`.

| Opener | RV renders | LP renders | d152ea4: RV write / RV pin | 4ec83ea: RV write / RV pin | Candidate fix: RV pin |
|---|---|---|---|---|---|
| ```` ~~~ds-counter `x` ```` | **yes** | no | `[11]` / anchored, panel, `[11]` | `[11]` (durable `[11]`) / **refused: Notice `("ds-counter<U+0020>`x`")`** | anchored, panel, `[11]`, 0 Notices |
| ```` ~~~ds-counter`x ```` | no (`language-ds-counter`x`) | no | — | — | not claimed |
| ```` ~~~ds-counter x`y ```` | **yes** | no | `[11]` / works | `[11]` (durable `[11]`) / **refused** | works |
| ```` ~~~ `ds-counter ```` | no | no | — | — | not claimed |
| ```` ~~~ds-counter<TAB>`x` ```` | **yes** | no | not measured | not measured (refused by the same rule: derived, not measured) | works |
| ```` ~~~ds-counter<NBSP>`x` ```` | **no** (RV does not split on NBSP) | no | — | — | not claimed (with the space/tab split) |
| ```` ~~~ds-counter<U+200B> `x` ```` | no | no | — | — | not claimed |
| ```` ~~~ds-counter.x `y` ```` | no | no | — | — | not claimed |
| control ```` ```ds-counter `x ```` | no | no | — | — | not claimed |
| control ```` ~~~ds-counter x ```` | yes | yes | works / works | works / works | works |

Evidence: `tilde-base-114/`, `tilde-head-114/`, `dur-base-114/`, `dur-head-114/` (writes kept on both builds), `tilde-cand2-114/` (candidate).

## Findings

### MEDIUM-1: the r3 backtick rule refuses tilde fences that Reading view renders, a regression against develop

**Where:**
- `src/framework/host/blockPrefix.ts:64-67`: one rule for both fence kinds; `fenceLanguage` never learns the fence character.
- `test/dom/authoring/schemaSuggest.test.ts:213`: SC-476's correct expectation was changed to match.
- `CHANGELOG.md:35` (superproject): "A fence with a backtick on its opening line is not a block in either view", which is wrong for tilde fences.

**Why it happens:**
- CommonMark allows a backtick in a tilde fence's info string. Obsidian's Reading view renders the block when the first word is a registered language.
- Live Preview's regex (`[^\n`]*$`) rejects every backtick, so Live Preview renders nothing for either kind.
- O2 says to claim what either mode renders as the block. r3 refuses it.

**Effect** (head, measured; see section 3):
- The Reading view block draws and its own writes land.
- "Pin to sidebar" refuses with a Notice.
- The "Send block to sidebar" command would refuse it too (same alias path).
- Authoring key completion inside it is gone (SC-476).

**Fix (validated):** pass the fence character to `fenceLanguage`. For a backtick fence with a backtick, keep r3's trimmed info (CommonMark and Live Preview: no opener). For a tilde fence with a backtick, return Reading view's first word, split on space or tab only:
```ts
export function fenceLanguage(info: string, fenceChar: string): string {
	if (info.includes('`')) {
		const trimmed = info.replace(/^[ \t]+/, '').replace(/\s+$/, '');
		if (fenceChar !== '~') return trimmed;   // ``` fence: no opener in either mode (CommonMark; LP `[^\n`]*$`)
		return /^[^ \t]*/.exec(trimmed)![0];      // ~~~ fence: LP rejects it, Reading view reads the first word (space/tab split)
	}
	// … r2 rule unchanged …
}
```
Call sites, each passing `marker[0]`:
- `fenceLine.ts:43` (`match.marker[0]`)
- `fenceScan.ts:60` (`marker[0]`)
- `anchor.ts:270` (`fenceAlias(rest, fenceChar)`) and `anchor.ts:328` (`openMatch.marker[0]`)
- `registration.ts:39` (`match.marker[0]`)
- `e2e/driver/noteFences.ts:43,71` (`typeOf(m.rest, m.marker[0])`)

Make the parameter required, so tsc lists every caller, including the 23 test call sites. My validation clone used a default of `` '`' `` (patch in `candidate-fix.patch`). With it, the 65 affected suites (`e2eIntegrity`, `test/unit/framework`, `test/dom/authoring`, `test/dom/framework`) run 1710 passed and 1 failed, the SC-476 row, which should revert.

Table rows to add (e2eIntegrity and blockPrefix):

| Opener | Expected language |
|---|---|
| `` ~~~ds-x `x` `` | `ds-x` |
| ``~~~ds-x x`y`` | `ds-x` |
| `` ~~~ds-x<TAB>`x` `` | `ds-x` |
| `` > ~~~ds-x `x` `` | `ds-x` |
| ``~~~ds-x<NBSP>`x` `` | ``ds-x<NBSP>`x` `` |
| `` ~~~ds-x<U+200B> `x` `` | `ds-x<U+200B>` |
| `` ~~~ds-x.y `z` `` | `ds-x.y` |
| `` ~~~ `ds-x `` | `` `ds-x `` |

The r3 row ``['~~~ds-x`x', 'ds-x`x']`` keeps its value under the fix, as do all backtick-fence rows.

Also:
- **Revert** `schemaSuggest.test.ts:213` to SC-476's ``['a tilde fence may carry a backtick in its info string', '~~~ds-counter `x`', 'ds-counter']``.
- **Reword the CHANGELOG clause:** "A ```` ``` ```` fence with a backtick on its opening line is not a block in either view and is now left alone too."
- **Optional:** a pin-path row in `registration.test.ts` for ```` ~~~ds-counter `x` ```` that binds.

### INFO

1. **A jest log line.** My jest run printed one `fatal error: all goroutines are asleep - deadlock!` from esbuild's service teardown (`esbuild/internal/helpers/waitgroup.go`), presumably from a suite that spawns esbuild. All suites still passed, and the line is absent from my r2 log and the implementer's r3 log. It looks like build-host noise; not a finding.
2. **Workspace tidy.** The validation clone was removed. The reviewed worktree and superproject `git status` are identical before and after (`status-{before,after}-*.txt`). Port 9289 is free, and no lifecycle temp dirs were kept.

## Evidence

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-rev-r3/`:

- **Gates:** `rv-gate-tsc.log`, `rv-gate-lint.log`, `rv-gate-jest.log`, `rv-gate-lifecycle.log`, `rv-gate-e2e.log`.
- **Rebase:** `range-diff-dse.txt`.
- **Tilde measurement:**
  - head and base: `tilde-head-114/`, `tilde-base-114/`;
  - Reading view durable path: `dur-head-114/`, `dur-base-114/`;
  - first candidate (split on `\S`): `tilde-cand-114/`;
  - final candidate (split on space/tab): `tilde-cand2-114/`.
- **Candidate fix:** `candidate-fix.patch`, `candidate2-jest.log`, `bundle-cand2/`.
- **Bundles:** `bundle-head/`, plus the d152ea4 base bundle at `../sc487-rev-r1/bundle-base/`.
- **Probe sources:** `rv-fixtures.mjs`, `rv-scenarios.mjs` (incl. `R-DUR`), `rv-inject.mjs`, `rv-probe-run.sh`, `rv-tilde-pair.sh`, `rv-dur-pair.sh`, `rv-cand.sh`.
- **Tree state:** `status-{before,after}-{dse,super}.txt`.
