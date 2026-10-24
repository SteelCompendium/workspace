# SC-479 r5 scoped re-review report (r3 reviewer a49fb648658e70991)

## Executive summary
- **Verdict: REQUEST_CHANGES.** 0 HIGH, **1 MEDIUM**, 0 LOW. Delta reviewed: `84ba65a` -> `e6b02ca` (dse, develop `c558759`); superproject `f6661ad`.
- **MEDIUM-1, item 4 (owner-flagged).** A reader parked INSIDE a tall embed, below the hero list, sees the text jump when the tracker gains or loses a row (`previewScrollPin.ts:207`, `:320`).

  | measurement | base c558759 | head e6b02ca |
  |---|---|---|
  | text shift, add hero | **0 px** | **+110 px** |
  | text shift, remove hero | **0 px** | **-109 px** |
  | scrollTop, add hero | 4031 -> 4141 | held 4031 |
  | scrollTop, remove hero | 4031 -> 3922 | held 4031 |

  Head moves the text where base did not, at both 150 px and 500 px below the tracker, every rep. The header line `:105-110` ("nothing measured shows it") is now wrong.
- **HIGH-1 fixed and re-proved on e6b02ca.** Measured:

  | case | head text shift |
  |---|---|
  | embed 100 px above the viewport, add hero | 0 px (scrollTop 4981 -> 5091) |
  | same, remove hero | 0 px (4981 -> 4872) |
  | 200 px padding above the viewport during the pin | 0 px |

  Phase (e) on head: text held at 36. The scroller-rule control FAILs (e) with 36 -> 146.
- **LOW-1 and LOW-2 are folded.** The header text is rewritten, and `obsidian-lifecycle.mjs` now has a `waitFor` for the tracker in pane B. Phase (e) has no timed delay that decides an outcome.
- **Range-diff:** the four r2 commits differ only in conflict context (the lifecycle header and the SCENARIOS neighbours). The two r4 commits are the whole delta, and nothing else touches SC-479 files.
- **Gates on e6b02ca:**
  - tsc rc 0, lint rc 0.
  - jest 6115 passed / 1 skipped / 247 of 248.
  - `--only=G-S8,G-S15,G-S18,G-S42`: 4/4 ok, 2/2 runs.
  - Lifecycle **40/40**, run as 20/20 + 20/20 split with `--only` to stay under 600 s; rc 0 both halves.
  - Bundles are identical to r4's: head `ecefec922aad`, base `b5a41fccfff5`, ctl-scroller `e98674a6eb29`, styles `ae45354b6369`.
- **Measured fix candidate for MEDIUM-1 (`alt-geo`, `44a8ebff3b6f`).** It sets the embed anchoring stop only when a DSE root inside an embed intersects the viewport at pin time; otherwise the host gets the plain sizer pin. Results:
  - G-S42 (a)-(e) ok.
  - r3host end: 5/5 held.
  - INSIDE add/remove: 0 px.
  - BELOW+100: +110/-109 px, which equals base (stock does not compensate there either). So it is no regression against stock, but it loses head's improvement in that geometry.
  - The narrower `[data-dse-element]` stop (`alt-dseroot`) does NOT hold: G-S42 (a)-(d) all 2887 -> 0.
- dse tree clean at `e6b02ca` at exit. Superproject ` M draw-steel-elements` as found (r4's unstaged pointer).

## Findings

### MEDIUM-1: the embed anchoring stop moves on-screen text for a reader inside a tall embed
- **Where:**
  - `src/framework/host/previewScrollPin.ts:207`: `anchorRule` excludes every `.internal-embed` from anchor selection.
  - `:320`: every host pin takes it.
  - Header `:105-110` states the risk as unmeasured.
- **Scenario** (probe `R5-INSIDE`, `probe-q3-head.log` vs `probe-q6-base.log`):
  - B (`r5trk`) is a 20-hero tracker followed by 25 paragraphs. The embed is 3602 px, under the 4000 px cap.
  - A (`r5host`) is 30 paragraphs, `![[r5trk]]`, then 80 paragraphs.
  - The viewport top is parked 150 px (or 500 px) below the tracker's bottom, inside the embed, with the embed bottom on screen.
  - The write is `vault.process` adding or removing one hero. The tracked text is the first fully visible `I-POST` paragraph, found by its text in every frame (it was never lost).
- **Results:**
  - **base** (no host pin; Chrome anchoring compensates):
    - add: scrollTop 4031 -> 4141, text 26 -> 26
    - remove: 4031 -> 3922, 26 -> 26
    - at +500: add 4381 -> 4491, text 36 -> 36; remove 4381 -> 4272, 36 -> 36
    - 2 reps each, identical.
  - **head:**
    - add: scrollTop held at 4031, text 26 -> **136**
    - remove: held, 26 -> **-83**
    - at +500: 36 -> **146** and 36 -> **-73**
    - 2 reps, identical.
  - The process write (no height change) is 0 px on both.
- **Why:** the anchor that compensates in this geometry is a paragraph inside the embed, and the rule excludes the whole embed. With anchoring out of play, the sizer pin holds scrollTop, so the row's height change shows up as on-screen motion.
- **Prescribed fix, measured as candidate `alt-geo`.** Built from a scratch copy of e6b02ca with one guard at the top of `pinScroller`:

  ```ts
  if (host) host = [...scroller.querySelectorAll('.internal-embed [data-dse-element]')].some(r => r.bottom > sr.top && r.top < sr.bottom)
  ```

  This keeps the embed stop only when a DSE root inside an embed is on screen at pin time; otherwise the host gets the plain sizer pin.
  - G-S42 (`disc-alt-geo-run1.log`): (a)-(e) ok — 2887/2887/2887/3574 held, (e) text 36 held.
  - R3-END r3host end x {process, nodefs, own-off, own-on, pane}: all held.
  - R5-INSIDE add/remove at 150 and 500: 0 px, same as base.
  - BELOW+100 (embed bottom 100 px above the viewport): +110 / -109 px. This equals base, which also does not compensate at +100. Head's embed stop gave 0 there.
  - r3tall `in` rows were vacuous in that run (embed not drawn when parked); only the pane row (4779 held) counts.
- **Trade-off for the owner:** `alt-geo` = never worse than stock in the measured geometries. Head = better than stock just below the embed, worse than stock inside it.
  - A combined rule may get both: keep the embed stop when the reader is below the embed, drop it when the viewport is inside the embed and the tracker is above it. Not measured.
- **Whatever is chosen also needs:**
  - a header update (`:105-110`);
  - a G-S42 phase (f): reader inside a tall embed below the hero list, add a hero, the visible text must not move;
  - a control "embed stop with no geometry gate" (= e6b02ca), which must FAIL (f).

## Evidence by brief item
1. **Range-diff** (`r5-rangediff.txt`):
   - Commits 1/4 (`710e812`->`88d200a`) and 4/4 (`84ba65a`->`ca01a96`) differ only in the lifecycle header and SCENARIOS conflict context (SC-502 lines replacing the SC-519 lines as neighbours; the scenario count text 39 -> 40).
   - Commits 2/4 and 3/4 are `=` (identical).
   - The new commits are `5b3b778` and `e6b02ca`. The `diff --stat c558759..e6b02ca` touches only the 4 SC-479 files. No finding.
2. **HIGH-1:**
   - `anchorRule` is `.markdown-preview-view[data-dse-scroll-pin="id"] .internal-embed { overflow-anchor: none !important; }` (`:207`). It goes through `ruleText` for host pins only, and own pins keep the sizer rule alone.
   - The `<style>` removal on release, TTL, `releaseAll` and unload is unchanged from 84ba65a (measured live in r3); jest covers release and `releaseAll` with the new rule.
   - **Shift probes on head** (`probe-q3-head.log` BELOW+100):
     - add: 4981 -> 5091, text 36 -> 36
     - remove: 4981 -> 4872, text 36 -> 36
   - **Shift probes on head** (`probe-q1-head.log` R3-SHIFT): pad 200 px above during the pin gives scrollTop 6869 -> 7069, text 16 -> 16. The other r3 SHIFT tall rows were vacuous in this run (embed not drawn at park). The r5 BELOW rows and phase (e) replace them.
3. **LOW-1, LOW-2 and phase (e):**
   - Header `:84-110` rewritten (LOW-1).
   - `waitFor` the tracker in pane B (LOW-2).
   - **Phase (e)** (`obsidian-lifecycle.mjs:3078`):
     - Its waits are settle waits: a seek loop of 200 ms per step while the embed is undrawn, then 450 ms x3 parking.
     - Its anti-vacuity checks fail loudly: embed bottom < 0, a redrawn root, embed grew >= 50 px, pin at the redraw, pin released.
     - Recorder caps as G-S15.
     - No timed delay decides an outcome.
   - **Control `ctl-scroller`** (`disc-ctl-scroller-run1.log`): FAIL "(e) the text on screen moved: … 36 px … min 36 max 146; embed 3190 -> 3299 px, scrollTop 4569 -> 4569". Screenshot `sc479-r5-ctl-scroller-G-S42-FAIL.png`.
4. **MEDIUM-1:** above. The numbers are 2 reps per case on head, base and `alt-geo`.
5. **Gates:** `gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-lc1.log` (20/20), `gate-lc2.log` (20/20; G-S44 ok, G-S42 ok incl. (e) 36 held), `disc-head-run{1,2}.log` (4/4 each). e2e, shots, freeze and parity were not re-run (no reason: `src` changes are the rule text only).

## Hygiene
- Bundles were built from `git archive` copies in `.../scratchpad/sc479-r5-a49fb648/`, and probes ran from a scratch harness copy.
- FAIL temp dirs (`nWE22k`, `NhelqF`) were deleted by literal path.
- No process of mine remains.
- dse `git status --porcelain` is empty at `e6b02ca`.

## Artifacts
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r5-evidence/`:
  - **Range-diff and bundles:** `r5-rangediff.txt`, `bundles.sums`.
  - **Discrimination:** `disc-{head-run1,head-run2,ctl-scroller-run1,alt-dseroot-run1,alt-geo-run1}.log`, `disc-summary.log`.
  - **Gates:** `gate-{tsc,lint,jest,lc-build,lc1,lc2}.log`.
  - **Probes:** `probe-q1-head.log` (R3-SHIFT + first INSIDE), `probe-q2-base.log`, `probe-q3-head.log`, `probe-q4-alt-dseroot.log`, `probe-q5-alt-geo.log`, `probe-q6-base.log`.
  - **Per-frame JSON:** `out/*.json`.
  - **Scripts:** `*.txt`.
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/sc479-r5-ctl-scroller-G-S42-FAIL.png`
