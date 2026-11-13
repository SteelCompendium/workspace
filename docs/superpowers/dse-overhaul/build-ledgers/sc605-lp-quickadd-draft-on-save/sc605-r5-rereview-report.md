# SC-605 r5 scoped re-review (reviewer R2)

**Executive summary**
- **Verdict: LAND-READY.** dse `17a1c047` on develop `d984b115`; superproject `723f4170` on workspace origin/main `298a4ef9` (both bases checked with a fresh fetch).
- **Findings:** HIGH 0 · MEDIUM 0 · LOW 1 (a test gap: nothing pins "the sweep never drops an unexpired carry") · INFO 0. All r3 folds are correct.
- **Gates (my runs on 17a1c047):**
  - tsc (incl. `-p e2e`) and lint clean.
  - jest, 7 touched suites: `Tests: 326 passed, 326 total`.
  - e2e `--only` for INIT-L09..L17, INIT-M10/M11, INIT-L01..L08, CTR-L01..L05, CALL-L04, INIT-AMT-E01/E02: all 27 ok.
- **Spot probes (r3 set, rebased build):** all 4 held: ZZR3-01 (mouse Advance round; note bytes as in r3), ZZR3-07 / 07b (two trackers saving inside one debounce) and ZZR3-15 (two panes, typed in the inactive pane).
- **Range-diff:** the 5 r2 commits are unchanged (`=`), except the e2e README row now sits beside SC-600's `amount-edit.md` row.
- **Superproject:** CHANGELOG only (2 commits), the dangling "In" is gone, no pointer commit, the dse pointer is unstaged.
- **Full battery:** not re-run by me. The implementer reports jest 11647/2, lifecycle 61/61 and e2e `315/318 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`.

## 1. Range-diff (`git range-diff dcc53f0f..54e37fed d984b115..dd4f2aa9`)

| Commit | r2 → rebased | Range-diff |
|---|---|---|
| feat | `46163756` → `0d8f4fc0` | `=` |
| jest | `5500d93b` → `e13bc454` | `=` |
| e2e | `9d652765` → `3c699229` | `!`: only the e2e/README.md context; the `twins.md` row now sits after SC-600's `Initiative/amount-edit.md` row. Spec and fixture identical. |
| docs | `b2042b82` → `0679d277` | `=` |
| pipeline/wiring | `54e37fed` → `dd4f2aa9` | `=` |

Confirmed.

## 2. Fold commits

**`0b8769c8`** (src and jest)
- **LOW-3 sweep** (`livePreviewStateCarry.ts`, inside `carryOwnSaveState`, after the ticket check):
  - The new line is `for (const [k, c] of carries) if (c.expires <= now) carries.delete(k);`. It uses the same predicate as `live()`, so it deletes only carries that `takeCarriedState` would already refuse. It can never drop a live, unexpired carry. It runs only on an own-save capture, so it costs nothing on ordinary mounts. **Correct.**
  - Mutation check:
    - `nosweep`: S16 goes red.
    - `sweepall` (delete every entry): **no jest test red**. **No e2e test red** either (INIT-L09/L12/L13/L17 ok). Yet my probe ZZR3-07 / 07b shows the real loss under that mutation: tracker 1's draft comes back `""/""`, tracker 2's `2/Beta`.
    - `sweeplt` (sweep expires up to 1 s early): no test red.
  - So the requirement "the sweep never drops an unexpired carry" holds in the code but nothing pins it. That is LOW-1 below.
- **Unload clear:** `plugin.register(() => clearCarriedState())` in `registerFrameworkElements.ts`.
  - It clears the module Map at plugin unload.
  - A reload loads a fresh module instance with its own empty Map, so clearing the old one cannot break a reload.
  - A carry across a disable/enable would never be wanted anyway: the new instance's views are new and the old tickets belong to released entries.
  - `noclear` turns the wiring case "plugin unload forgets every armed carry" red. **Correct.**
  - The rename `resetCarriedStateForTests` → `clearCarriedState` is fine; the jest import is updated.
- **INFO-1 header sentence:** accurate to ZZR3-11 (fresh ticket, release inside the ~10 ms `modify` window, back within `CARRY_TTL_MS`, base empty; debounce navigation and close/reopen start empty). Plain words.
- **INFO-3:**
  - `beforeRelease` now wraps each carry in its own try/catch, each warning with its own message.
  - The jest case throws from each carry in turn; it asserts the other still runs and that 2 warnings were logged.
  - It matches the prescription. `ViewRegistry.release`'s outer catch still stands behind it.

**`17a1c047`** (e2e)
- INIT-L17 is retitled `[INIT-L17] the same note in two panes: the saving pane gets the draft back and the other pane starts empty`. The id is kept, there is no bracketed ticket id in the title (grep: no `[SC-…]`), and the body is unchanged.
- A comment says it proves the mount order and that jest S09 pins the scope guard.
- This matches the prescription.

## 3. Superproject (`298a4ef9..723f4170`)
- 2 commits, `f92d2f1a` and `723f4170`, touching `CHANGELOG.md` only (+11 / −4). No pointer commit.
- `CHANGELOG.md:127-128` now reads "…never written to the note. / Since SC-605 this holds in Live Preview too.", so the dangling "In" is gone.
- `git status --porcelain` shows ` M draw-steel-elements` only (unstaged).

## 4. Gates and probes (17a1c047, devbox, foreground, logs in `…/scratchpad/sc605-r3-review/r5/`)
- `tsc.log`: rc 0, clean. `lint.log`: rc 0, clean.
- `jest-touched.log`, with main.js and styles.css removed first: `Test Suites: 7 passed, 7 total`, `Tests: 326 passed, 326 total`. The suites are livePreviewStateCarry, register-framework-elements, initiative-matrix, view-registry (dom), pipeline (dom and unit) and livePreviewFocusCarry.
- `e2e-head.log`: CALL-L04, CTR-L01..L05, INIT-AMT-E01/E02, INIT-L01..L17, INIT-M10 and INIT-M11 are all ok (27/27).
- Probes `probe-head-1794567838.jsonl`:
  - ZZR3-01: `2/Feytouched`, Round 2, focus body. The note text is identical to r3's (`round: 2`, no draft).
  - ZZR3-07: `1/Alpha` and `2/Beta` kept, 2 writes.
  - ZZR3-07b: both kept, Round 2.
  - ZZR3-15: left pane `1/Left`, right pane `""/""`.
  - ZZR3-15's FAIL line is the driver's after-test fence invariant (the probe clicks by script). It also showed in r3 and is not a product failure.
- Sweep mutations: `jest-mutations.txt` / `jm-*.log` (jest) and `../e2e-sweepall.log` + its jsonl (e2e).

## 5. Finding

### LOW-1: nothing pins "the sweep never drops an unexpired carry" (`test/dom/framework/livePreviewStateCarry.test.ts`, S16)
S16 checks only that an expired carry is swept and that the NEW capture survives. A future edit could widen the predicate, to `carries.clear()` or an early margin. Measured with `sweepall`: in real Obsidian, when two trackers in one note save inside one debounce (SC-544 flush: one capture at release, the other from the editor update), the earlier capture is swept before its redraw mounts, and that tracker's draft is lost. All shipped tests stay green under it.

**Fix (small, jest only):** S17. Capture block A, then capture block B at `now + 1` (A not yet expired), then assert that both `takeCarriedState(A)` and `takeCarriedState(B)` return their drafts. It goes red under `sweepall` and `sweeplt`. Optionally, an e2e INIT-L18 in the ZZR3-07 shape: two trackers, + in each inside 400 ms, both drafts kept. That one also pins the two-capture-path interplay end to end.

This is not a land blocker: the code is correct as written.

## 6. Working tree
- During the review I parked `e2e/specs/zzr3/probe.e2e.ts` (untracked). Mutations were applied and restored from HEAD inside their scripts.
- After:
  - The parked file was removed (literal path).
  - dse porcelain is empty, `git diff --quiet HEAD` holds and HEAD is `17a1c047`.
  - The superproject shows ` M draw-steel-elements` only, at HEAD `723f4170`.
- Nothing was committed.

Follow-ups (left alone): optional e2e INIT-L18 (two trackers saving in one debounce); see LOW-1.
