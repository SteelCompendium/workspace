# SC-455 scoped re-review: fix round 1 and rebase onto 7817133

**Executive summary**
- VERDICT: **LAND-READY**. dse head `b6b08f3` (on `7817133`). Superproject worktree commit `5cbae52` (CHANGELOG). No commits by me; worktree `git status` was the same before and after.
- Findings: CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 4 (none blocking).
- Rebase: `git range-diff` shows 5 of 6 commits identical (`=`). The only changed commit is `f9f7eb1` (the src commit), with exactly the expected `anchor.ts` resolution and `registration.ts` re-homing.
  - SC-360's `SCALAR_TOKEN`, `ANCHOR_LINE`, `GENERATED_FROM_LINE`, `LEADING_LETTERS`, exported `generateAnchorId`, `parseYaml`-backed `ensureAnchor` and the `id === null` → `unreadable-anchor` refusal are all intact.
  - `FENCE_LINE` is gone from `src/` (one stale comment remains; see INFO-4).
- Every R1 finding is fixed and verified by my probes, which now pass on head: HIGH-1, LOW-1, LOW-2, LOW-3, INFO-1, follow-up 6 and the workspace CHANGELOG bullet.
  - The sidebar with a `>` prefix and nested YAML works in real Obsidian: two panel writes landed, the panel root was kept, and no Notice appeared.
- New tests fail on the old src (e404566, which is e4f60eb rebased): **42 of 297** in the 5 changed files (blockPrefix 31, durable 6, notice 2, sidebar 2, formModal 1). This matches the implementer.
  - Mutation checks: each fix, when reverted on its own, is caught by at least 1 test. Undoing the HIGH-1 fix fails 35 tests.
- Gates I re-ran on b6b08f3: tsc + lint rc 0 · jest **5242 passed / 1 skipped / 230 of 231** · lifecycle **27/27** · e2e **`80/85 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`** · freeze **`276/276`** (on the existing 572 shots).
  - Shots (572, pressed-toggle line) and parity (0/0/24) are taken from the implementer's logs.
  - The jest count is plausible: 5013 + 229. The R1 work added +74; the fix round adds blockPrefix +145 (23→168, mostly `test.each` rows), durable +7, sidebar +2, formModal +1.

## Findings
- **INFO-1: the missing-note Notice gives the wrong reason.**
  - Where: `ReadingModeBlockHost.ts` `replaceSource`, the `!(abstractFile instanceof TFile)` branch.
  - What happens: it shows the generic unsavable text, "the plugin can't tell where this block sits in the note". The real cause is that the note was deleted or renamed mid-write. Not silent, which is what the ruling requires, but the reason is not accurate.
  - Optional fix: a "the note was moved or deleted" message.
- **INFO-2: a form save within 5 s of an unsavable Notice on the same note shows no new Notice.**
  - Probe F4: the host's Notice is rate-limited, so `lastWriteReported` is true and FormModal stays quiet. The modal stays open.
  - This follows from the accepted rate limit: the user saw the same message under 5 s earlier.
- **INFO-3: the tab case in the HIGH-1 fix is not exercised by any test.**
  - Where: `blockPrefix.ts:90`, the `text[0] === '\t'` clause.
  - With or without it, `>` plus `\tx` strips back to `\tx`, because only a space is taken as the marker's own. Dropping it changes no test result. It is harmless.
- **INFO-4: stale comment.** `ReadingModeBlockHost.ts:154` still says "anchor.ts's FENCE_LINE is a plain `.` match"; that export no longer exists.

## Verification by brief item
1. **Rebase** (`range-diff.txt`; `git diff 7817133 HEAD -- src/framework/sidebar/anchor.ts`).
   - In `anchor.ts`, the only changes against 7817133 are SC-455's: the `blockPrefix`/`fenceLine` imports, removal of `FENCE_LINE`, prefix-aware `matchFenceLine`/`isFenceClose`/`iterateFences`, and the `blockBodyLines` body.
   - `readAnchor`, `findAnchoredBlock`, `findFenceByBody`, `findGeneratedBlock` and `ensureAnchor` all read the prefix-free body that `iterateFences` yields.
   - `registration.ts` `bindBlockToSidebar` uses `blockBodyLines` and `replaceFenceBody` and keeps the SC-360 refusal (`registration.ts:249-267`).
2. **Folded findings.** All 24 of my probes pass on head; 8 fail on e404566 (`probe-head.log`, `probe-prev.log`, `probe-head-verbose.log`).
   - HIGH-1:
     - P1: the write/read round trip holds for `>`, `>>`, `> >`.
     - P2: two writes on one host land with no Notice (disk `>   - x`).
     - P2b and F1: an unedited raw-mode form save under `>` with nested YAML leaves the note byte-identical, twice, through a REAL `ReadingModeBlockHost`.
     - Real-Obsidian sidebar (`rrprobe-head.log`): `ds-initiative` in `>[!note]` with nested heroes. The pin stamped `>_dse_anchor: a9ad87`. The panel body has full 2-space indentation. Two round-advance writes landed (round 2, then 3) and the nested lines stayed `>   - name: Alice` / `>     max_stamina: 30`. The panel root was the same after each write, the panel did not degrade, and there were 0 Notices and 0 errors. The `> ` control case behaved identically.
   - LOW-1 (P6): identical twins in Live Preview, written before attach, are now refused with the unsavable Notice. The upper twin is untouched.
   - LOW-2: F2 (list-item fence via the form editor, real host) gives exactly 1 Notice, with the list hint. F3 (missing note via the form editor) gives exactly 1 Notice.
   - LOW-3: the e2e N01/N02 checks were tightened: they now require the exact unsavable text and exactly 1 Notice starting `Draw Steel Elements:`. Both passed in my e2e run.
   - INFO-1 (R1): an unclosed fence inside a callout now gets the generic text without the list hint (P4a).
   - Follow-up 6: a Notice is shown (F3, plus the mutation check).
   - CHANGELOG: the worktree `CHANGELOG.md:11` bullet is under `## Unreleased` and is accurate.
3. **Gates.** All logs are under the scratch dir. I ran jest with the implementer's `main.js` present; the result matched exactly, and lifecycle and e2e rebuild `main.js` themselves.

## Mutation checks (`mut-*.log`; the 5 changed test files, 297 tests)
| Fix reverted | Tests that fail |
|---|---|
| HIGH-1, whole fix (`if (false …`) | 35 |
| HIGH-1, space check removed (tab only) | 35 |
| LOW-1, `'ambiguous'` return removed | 1 |
| LOW-2, FormModal always adds its Notice | 1 |
| LOW-2, host `reported` never set | 1 |
| INFO-1, list hint always shown | 1 |
| Follow-up 6, missing-note Notice removed | 1 |

Each scratch source file was restored and checked with `cmp` after its mutation.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc455-callout-write/sc455-rereview-20261020-114124/`)
- `range-diff.txt`
- `gate-{tsc,lint,jest,lifecycle,e2e}.log` + `.rc`, and `gate-freeze-existing-shots.log`
- `prev-newtests.log` / `.json` (42 failures on the old src)
- `probe/zz-sc455-review-probe.test.ts`, `probe/zz-sc455-rereview-form.test.ts`, `probe-head.log`, `probe-prev.log`, `probe-head-verbose.log`
- `probe/scenarios.mjs`, `head/visual-harness/zz-sc455-rereview-probe.mjs`, `rrprobe-head.log`
- `mutate.sh`, `mut-*.log`
- `status-{before,after}-{dse,super}.txt`
- Scratch source copies: `head/` (b6b08f3) and `prev/` (e404566 src + head tests), both with `node_modules` symlinked
