# SC-534 r5: scoped re-review of the r4 delta (`fe44be1d..eaf64ba6`)

**Executive summary**
- **Verdict: LAND.** 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO.
- **LOW-1 and LOW-2:** both comments match the r3 wording ruled in the ledger word for word, and both are literally true. r3's probes measured the two failure modes: "not displayed" and "element click intercepted" at the click line, and a CDP press that landed on the editor at cursor line 3.
- **LOW-3:** `ClickOptions.cdp` is gone, and so are its field, branch, doc line and every caller. `git grep` finds no `cdp:`, `cdp?`, `opts.cdp` or `{ cdp` in `e2e/`, `src/`, `test/`, `docs/` or any `*.md`. The un-nested `try` is line for line the old `else` body, so the default, `inset`, `stable` and fallback paths behave the same.
- `npm run tsc` (root + `-p e2e`): rc 0. `npm run lint`: rc 0.
- e2e once each on the clean tree: `--only=CHR-L01,STAM-S13,STAM-S07,RECOV-R06,STAM-Q13X` gave `5/5 ok, 0 failed, 0 known-bug`, rc 0, with the pointer parked at 0,0 on :200.
- Final state: `git status --short` is empty, HEAD is `eaf64ba6`, and `main.js`/`styles.css` sha256 are unchanged (`aa4efdf6…`, `ae45354b…`).

## Scope and state

- Plugin worktree `/home/scott/code/steelCompendium/worktrees/sc534-e2e-chrl01-flake/draw-steel-elements`, HEAD `eaf64ba6`, parent `fe44be1d`, on `dabfb518`. Status was clean before and after. No commit was made.
- `git diff fe44be1d..eaf64ba6` is byte-identical to the ledger's `sc534-r4-delta.diff.txt` (checked with `cmp`). It touches two files, +15/−17: `e2e/driver/dse.ts` and `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc534-r5-a4d7580444f87a38b/`.

## (1) Comments (`chrome-live-preview.e2e.ts`)

- **`:23-25` (LOW-1).** The text is "…Earlier flakes here were the shared Xvfb's real pointer, which sat at the screen centre inside every window: another shard mapping or unmapping its window there sent this one a Leave/Enter that dropped the hover (fixed by parking the pointer at 0,0, SC-539), not Live Preview layout or load."
  - It matches the ruling and the mechanism in `e2e/x11-pointer.mjs:5-10` and dse-verify.
  - The first sentence ("One hover … no retry") is kept and is still true: the code is a single `dse.hover(root.root)` at `:27`.
- **`:31-32` (LOW-2).** The text is "The driver's default click: it waits for Collapse to be displayed and hit-tests it before pressing, so a hidden or covered Collapse fails here (not displayed / "element click intercepted") instead of the press landing on the editor line."
  - It matches the ruling.
  - "waits for … displayed" is `dse.ts:320` `waitForDisplayed({ timeout: 8000 })`. "hit-tests" is chromedriver's element click.
  - Both failure modes were measured at this line in r3 §2b.

## (2) `ClickOptions.cdp` removal (`e2e/driver/dse.ts`)

- **Removed:** the field `cdp?: boolean` (old `:276`), the doc fragment "`{ cdp: true }` forces the CDP path;" (old `:318`) and the branch `if (opts.cdp) await cdpClick(el, opts); else {` (old `:325`).
- **Kept:** `cdpClick` (`:301`, the definition) and its one caller, the fallback at `:332`.
- **No remaining mention.** `git grep -n -E "cdp *[:?]|opts\.cdp|cdp: *true|\{ *cdp" HEAD -- e2e src test docs '*.md'` prints nothing. The only other `cdp` hits are census.ts's own unrelated `cdp()` helper and prose about CDP. The ledger's `sc534-dse-verify-proposal.md` already says "`ClickOptions.cdp` was removed".
- **Line-by-line, new `:319-335` against old `:320-340`:**
  - Unchanged before the `try`: `waitForDisplayed`, then `isEnabled`, then `beforeAction`, then `if (opts.stable) await waitStable(el)`.
  - The `try` body is the same: when `inset` is set, `getSize` and then `el.click({ x: round(inset − width/2), y: 0 })`; otherwise `el.click()`.
  - The `catch` is the same: `msg`, then rethrow if `/intercepted/` or not `/not interactable|out of bounds/`, otherwise `cdpClick(el, opts)`. `cdpClick` still receives `opts`, so `inset` is still honoured on the fallback.
  - `recordDrive` is unchanged after the block.
  - The only change is the indentation level. With `cdp` absent, which was the only state any caller could reach, the old code always took the `else`. Behaviour is identical.
- **Callers that pass options** (`git grep`; no multi-line calls; no other `ClickOptions` user):

  | Option | File:line | Test |
  |---|---|---|
  | `{ inset: 3 }` | `stamina-modal-stepper.e2e.ts:95`, `:112` | STAM-S13 |
  | `{ inset: 5 }` | `stamina-modal-stepper.e2e.ts:186` | STAM-S07 |
  | `{ stable: true }` | `stamina-recoveries.e2e.ts:80` | RECOV-R06 |
  | `{ inset: 5 }` | `stamina-recoveries.e2e.ts:313` | STAM-Q13X |

## (3) tsc and lint

- `npm run tsc` (`tsc --noEmit && tsc --noEmit -p e2e`): `TSC_RC=0`.
- `npm run lint` (`eslint src main.ts e2e`): `LINT_RC=0`. Its only output is the existing `.eslintignore` deprecation notice.
- Log: `r5-tsclint.log`.

## (4) e2e on the clean tree

- Run `20261102-142507-0838`, rc 0. Loadavg was about 14 at the end, from other agents' runs.
- Each test passed once:

  | Test | Result |
  |---|---|
  | CHR-L01 | ok, 1951 ms |
  | STAM-S13 | ok, 2775 ms |
  | STAM-S07 | ok, 1422 ms |
  | RECOV-R06 | ok, 2878 ms |
  | STAM-Q13X | ok, 4133 ms |

- Summary: `OBSIDIAN-E2E done: 5/5 ok, 0 failed, 0 known-bug, coverage: 14/87 pairs (partial run: gate skipped)`.
- Pointer: `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)`.
- Log: `logs/r5-opt-callers-1793629506846389182.log`.
- I did not repeat the full run. r4's gate logs show 124/124 87/87 twice.

## Findings

- **INFO-1:** the class doc at `dse.ts:313-317` still describes the fallback correctly. A cosmetic nit, not a finding: the one-line doc for `cdpClick` at `:300`, "Click through the CDP mouse path (pseudo-elements, odd hit areas)", still describes a forced-use case that no longer exists. Its only use now is the not-interactable fallback. No action needed.

## Verdict

**LAND.**
