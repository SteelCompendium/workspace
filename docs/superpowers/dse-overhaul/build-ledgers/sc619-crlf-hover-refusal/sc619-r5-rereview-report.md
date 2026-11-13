# SC-619 r5: scoped re-review of the r4 delta (reviewer C)

## r5

**Executive summary**
- **Verdict: LAND.** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO.
- **Rebase:** `range-diff 3a5986d3..19942fe6 1cc54eac..df92a3f6` shows the 3 old commits as `=` (patch-identical) and one new commit (`df92a3f6`).
  - The lifecycle `.mjs` keeps SC-616's G-S91 change: the diff from `1cc54eac` does not touch G-S91.
  - Scenario order is G-S108, then G-S112, with G-S56 last.
- **Residual not persistent (real Obsidian 1.15.1, Reading view and Live Preview):**
  - A CRLF note converted to LF while its heading hover is open, then +: refused. The note stays byte-identical to the converted text, with 1 Notice.
  - Close the hover, reopen it with a real hover, then +: saved into the hovered counter, values [5,5] -> [6,5]. The note stays all-LF (0 CRLF / 25 LF), the text outside the fences is unchanged, and there is no Notice.
- **New jest tests** assert what they claim:
  - The mutant `eols[start + 1]` now fails 1 test (the mixC test).
  - The 1cc54eac src fails 11 tests and passes 12, the same as the "revert" mutant.
  - r3's option (b) fails exactly the 2 residual pins, so the pins really pin the residual.
- **Jest (fresh, branch):** 11818 passed / 1 skipped / 0 failed, total **11819 = 11817 + 2**. The cached `visual-harness/dist/obsidian-app.css` (from a shots run) is still present, so the normally-skipped `printTwinDeltaAllowedSet` test runs. This is exactly r4's cache-present number; I did not move the file aside.
- **Lifecycle part 7** `G-S108,G-S112`: **2/2, 129 s**. The `cardLinkLine` comment and the skill proposal are accurate.
- Nothing committed or pushed. The tree status is identical before and after.

### 1. Rebase (`r5-range-diff.txt`)
- `c42205cf = e1d9cdc8`, `c90638ca = 5aa9bf6f`, `19942fe6 = 94454bdb`.
- `df92a3f6` is new. It changes only the comment in `src/framework/host/ReadingModeBlockHost.ts` (+2/-1, lines 1115-1116) and adds 3 tests to `test/dom/framework/reading-mode-host-crlf-hover.test.ts` (+70).
- `git diff 1cc54eac df92a3f6 -- visual-harness/obsidian-lifecycle.mjs` is only the +151 SC-619 additions. It has 0 G-S91 hunks, so SC-616's change is intact.
- Scenario ids at `df92a3f6`: G-S108 (line 8695), G-S112 (8881), G-S56 (9006, last).
- Superproject: `b67e1a43` (CHANGELOG +6) on `26b92a8a`; the tree shows only ` M draw-steel-elements`, with no pointer bump.

### 2. New jest tests and mutants (`r5-mutants.log`; 23 tests)

| mutant | result |
|---|---|
| `eols[start + 1]` | 1 failed: "a CRLF heading line over an LF-only blank line ..." (LOW-2 closed) |
| `crlfHover = false` (revert) | 11 failed: the 8 r2 reds, the mixC test, both residual pins |
| `1cc54eac` src (base) | 11 failed / 12 passed (identical set) |
| r3 option (b) (`r3-alt-fix.diff` semantics) | 2 failed: the two residual pins |

Source restored byte-equal.

How each new test was read:
- **mixC test:** asserts the part's shape (`"\n\n```ds-counter\r\n"`), a save, the exact bytes after the write (`text.replace(5 -> 6)`), and no Notice. Correct.
- **Residual "refused" pin:** `convertedWhileOpen()` models the redraw without `rebind`, which matches r3's real-Obsidian measurement. The test asserts `replaceSource` is false, the note is byte-equal to the LF text, and the Notice equals exactly `[droppedWriteMessage('Note')]`. Correct.
- **Residual "not persistent" test:** removes the old popover, then a new popover and a new host on the LF note save into Tracker with exact all-LF bytes and no Notice. Correct.
  - INFO-1: this test also re-asserts the refusal first. If the residual is ever fixed, it fails together with the pin, and both must be rewritten. Acceptable; it is what a residual pin should do.

### 3. Real-Obsidian cells (`r5-cells.log`)
The r3 harness extended with a reopen step: `K.cleanup()`, reopen the host, real hover, real + (`r5-scenario.mjs`, `r5-fixtures.mjs`).

| cell | first + (preview open across the conversion) | second + (preview closed and reopened) |
|---|---|---|
| crlf2lf-reopen RV | refused; bytes == converted text, N1 | real hover; part `"\n```…"` (start 1); saved [6,5]; all-LF (0/25); outside the fences unchanged; N0 |
| crlf2lf-reopen-lp LP | refused; bytes ==, N1 | real hover; start 1; saved [6,5]; all-LF; unchanged; N0 |
| lf2crlf-reopen RV (refused at base too, r3) | refused; bytes ==, N1 | real hover; part `"\n\r\n```…"` (start 2); saved [6,5]; all-CRLF (25/0); unchanged; N0 |
| controls crlf2lf-hov / crlf-twin-hov / crlf-swap-hov | refused N1 / saved [6,5] N0 / refused N1 (as in r3) | — |

The ruling (a) stands: the residual is not persistent in real Obsidian, in Reading view or Live Preview.

### 4. Docs accuracy
- **`cardLinkLine` comment** (`ReadingModeBlockHost.ts:1115-1116`): "a CRLF note converted to LF from outside while its hover is open is read here from the card's CRLF snapshot, so + is refused with the Notice until the preview is reopened." Accurate, and it matches the measurement above.
- **`sc619-skill-proposal.md`**, checked claims:
  - 23 tests = 9 saves + 7 refusals + 4 controls + model + 2 pins.
  - "11 red at the pre-fix src, 12 pass there too".
  - CR-only measured.
  - The `eols[start]` note.
  - The qualified "an LF note never takes the branch".
  - The mirror case (LF to CRLF) refused at base and with the fix.
  - §1b: `lineStart` 2, and no callout heading hover card.
  - 11817 / 2 fresh, and 11818 / 1 with the css cache.
  - Part-7 timings (mine: 129 s).

  All accurate. Optional: the residual sentence "not persistent: a preview reopened ... saves" can now say it was measured in real Obsidian (r5, Reading view and Live Preview), not only in jest.

### 5. Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc619-r3-reviewer/`)
- jest full, fresh (`main.js` / `styles.css` removed), branch `df92a3f6`: 276 suites + 1 skipped; 11818 passed / 1 skipped / 0 failed (11819 total), 85 s, rc 0. Log `r5-jest-full.log`.
- lifecycle part 7: `OBSIDIAN-LIFECYCLE done: 2/2 ok, 0 failed`, 129 s, rc 0. Log `r5-lc-p7.log`.
- Hygiene:
  - The scratch worktree `r5wt` was removed by exact path, after its node_modules symlink was unlinked.
  - No lifecycle temp dir was kept.
  - `r5-status-before.txt` and `r5-status-after.txt` are identical: the plugin is at `df92a3f6` with ignored build files only; the superproject is at `b67e1a43` with ` M draw-steel-elements`; the main checkout's dse dirt is Scott's vault.
