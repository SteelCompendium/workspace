# SC-479 r7 scoped re-review report (reviewer a49fb648658e70991)

## Executive summary
- **Verdict: APPROVE.** 0 HIGH, 0 MEDIUM, 0 LOW. Reviewed dse `71437da` on develop `ed368f6`; superproject `e30728a`. r5 MEDIUM-1 is fixed as ruled (`previewScrollPin.ts:270`, `:365`, `:381`).
- Probe table: on-screen text shift, scrollTop in brackets.

  | probe | base | head |
  |---|---|---|
  | r3host + r3hostP end, 5 writers | 2887 -> 0 (r3/r5 bundle bytes) | held 10/10 |
  | INSIDE +150/+500 add/remove | 0 px (r5 measured) | 0 px (scrollTop compensates) |
  | BELOW+100 add/remove | +110 / -109 (r5 measured) | 0 px |
  | owner probe: INSIDE on a host whose estimate runs short | 0 px, 7/7 | 0 px, 7/7 (identical rows) |

  - The base bundle is byte-identical to the one r5 measured.
  - In the owner probe the sizer inline min-height was 3040/3744 against a real 4256, and scrollTop 2871 is past the estimate max of about 2787.
- **Re-pin spot-check:** an existing stop is never downgraded (same pin id, stop kept). A pin taken without the stop is upgraded when a re-pin's gate wants it.
- **Phase (f):** anti-vacuity is complete and no timed delay decides an outcome. The control "embed stop with no geometry gate" FAILs (f) only: text 26 -> 136, scrollTop held at 4031.
- **Range-diff:** commits 1-6 are `=`. `aabb828` and `71437da` are the only delta.
- **Jest:** r6's G2 is killed (6 tests fail) and G4 is killed (1 test fails); unmutated 51/51.
- **Gates on 71437da:**
  - tsc rc 0, lint rc 0.
  - jest 6127 passed / 1 skipped / 247 of 248.
  - `--only=G-S8,G-S15,G-S18,G-S42`: 4/4 ok, 2/2 runs. (e) held 36, (f) held 26.
  - Lifecycle **40/40** as 20/20 + 20/20. The first lc2 attempt was an exit-2 environment failure at start-up (see Info), and the re-run was 20/20.
- Bundles: head `e487253342d0` and base `b5a41fccfff5` (both = r6), my no-gate control `ffbfdb60fcb9`, styles `ae45354b6369`.
- dse tree clean at `71437da` at exit. Superproject ` M draw-steel-elements` as found.

## Evidence by brief item
1. **Range-diff** (`r7-rangediff.txt`):
   - `88d200a..e6b02ca` -> `4cdb306..ed9a632`: all six commits are `=`.
   - New: `aabb828` (gate + 5 jest tests + header) and `71437da` (phase (f)). They touch only `previewScrollPin.ts`, its test and `obsidian-lifecycle.mjs`.
2. **MEDIUM-1 as ruled** (`previewScrollPin.ts:270-278`, `embedStopWanted`):
   - (i) returns true if any `.internal-embed [data-dse-element]` intersects the scroller's viewport.
   - Otherwise it returns true only if no DSE-bearing `.internal-embed` intersects it: (ii) applies the stop and (iii) withholds it. This matches the ruling's wording.
   - It is applied once at pin time on a new pin (`:381`) and on the own->host upgrade path (`:365`). It never downgrades: `host` is only ever set.
   - **Probes** (`probe-k1-head.log`, `probe-k3-head.log`):
     - R5-INSIDE +150/+500 add/remove: 0 px; scrollTop 4031 -> 4141 / 3922, 4381 -> 4491 / 4272.
     - BELOW+100 add/remove: 0 px; scrollTop 4981 -> 5091 / 4872.
     - R3-END r3host x {process, nodefs, own-off, own-on, pane}: held 2887 / 3574. r3hostP x 5: held. Embed heights were unchanged in every row.
   - **Re-pin** (`R7-REPIN`, on r5host):
     - Tracker on screen -> pin id 39 with the stop. The reader moved inside the embed below the tracker, then a re-pin: id 39, stop **kept**.
     - Reader inside -> pin id 41 **without** the stop. Moved to the tracker, then a re-pin: id 41, stop **added**.
     - 0 styles after release in both.
3. **Phase (f)** (`obsidian-lifecycle.mjs:3121`):
   - Waits: the reset, then `waitFor` 20 portrait toggles (this beats the stale-embed effect), then a 200 ms seek loop and 450 ms x3 parking. These are settle waits; none decides an outcome.
   - Anti-vacuity: the reader is inside the embed and below the tracker, the root was redrawn, the embed grew >= 50 px, and the pin was present at the redraw and was released.
   - Control `ctl-nogate` (`disc-ctl-nogate-run1.log`, shot `sc479-r7-ctl-nogate-G-S42-FAIL.png`): FAIL, (f) only: "I-POST filler 4." 26 -> 136, embed 3602 -> 3712, scrollTop held at 4031. Phases (a)-(e) passed.
4. **Owner probe** (`R7-EST`; `probe-k1-head.log` vs `probe-k2-base.log`):
   - Host `r7host` = `PRE`, `![[r5trk]]`, `POST`. Obsidian's sizer inline min-height is 3040 (3744 after a render) against an on-screen sizer of 4256. INSIDE +150 gives scrollTop 2871, which is above the estimate's max (3744 + 64 - 1021 = 2787).
   - Results:
     - `process` (no height change) at +150 x2 and +500 x1: base 0 px, head 0 px; scrollTop unchanged on both.
     - addHero at +150 x2 and +500 x1: base and head both 0 px, with scrollTop 2871 -> 2981 and 3221 -> 3331 on both.
     - removeHero at +150: both 0 px, scrollTop 2871 -> 2762.
   - Head's gate chose no stop in every row (embed-stop frames 0), as expected for (iii). Head is not worse than base, so no finding.
5. **Jest** (`mut-summary.log`):
   - G2 (branch (ii) -> `return false`): 6 failed / 51.
   - G4 (gate dropped on the upgrade path): 1 failed / 51 ("an own pin that meets a host pin the gate refuses does not gain the stop either").
6. **Gates:** `gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-lc1.log` (20/20), `gate-lc2.log` (20/20; G-S42 ok incl. (f) 26 held), `disc-head-run{1,2}.log` (4/4 each). e2e, shots, freeze and parity were not re-run (no reason: the delta is the gate function plus lifecycle).

## Info (not a finding)
- The first lc2 attempt exited 2 at start-up, before any scenario ran, in the harness's own trust-dialog observer: `page eval failed: TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'`. This was right after `waitFor('!!document.body')` passed (`gate-lc2-attempt1-env.log`). It is a start-up race in `AUTO_DISMISS_TRUST_DIALOG` (`obsidian-lifecycle.mjs`, `main()`), not in SC-479 code. The re-run was clean. A Backlog candidate for the owner if it recurs.

## Hygiene
- Bundles were built from `git archive` copies in `.../scratchpad/sc479-r7-a49fb648/`, and probes ran from a scratch harness copy.
- FAIL temp dir `kqqEdS` was deleted by literal path. No process of mine remains.
- dse `git status --porcelain` is empty at `71437da`.

## Artifacts
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r7-evidence/`:
  - **Range-diff and bundles:** `r7-rangediff.txt`, `bundles.sums`.
  - **Discrimination:** `disc-{head-run1,head-run2,ctl-nogate-run1}.log`, `disc-summary.log`.
  - **Gates:** `gate-{tsc,lint,jest,lc-build,lc1,lc2,lc2-attempt1-env}.log`.
  - **Probes:** `probe-k1-head.log` (R5-INSIDE, R7-EST, R7-REPIN), `probe-k2-base.log` (R7-EST), `probe-k3-head.log` (R3-END).
  - **Mutations:** `mut-summary.log`, `jest-mut-{none,G2,G4}.log`.
  - **Per-frame JSON:** `out/*.json`.
  - **Scripts:** `*.txt`.
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r7-ctl-nogate-G-S42-FAIL.png`
