# SC-522 r3: independent adversarial review (dse 86ab9a2 on develop 4deb8cf; superproject 4ebefdd on origin/main 49fc600)

## Executive summary
- **Verdict: APPROVE.** Findings: HIGH 0, MEDIUM 0, LOW 2, INFO 6. Nothing is worse than stock at the settled position in any geometry I measured. Reading view and SC-478's own-file hold are unchanged.
- **Gates re-run on head** (bundle `8ddcc02d751f`, the same as r2's; `styles.css` `ae45354b6369` in every bundle):
  - tsc rc 0, lint rc 0;
  - jest **6164 passed / 1 skipped / 248 of 249**;
  - lifecycle second half (G-S9b … G-S52) **21/21 ok**; `--only=G-S8,G-S15,G-S18,G-S42,G-S50,G-S52` **6/6 ok**.
- **G-S52 discrimination:** head ok. Base FAILs (a)-(e). ctl-noclick FAILs (e) only. ctl-norelease FAILs (a)-(d) ("hold outlived the remount by 93-115 frames").
- **Probes** (real Obsidian 1.15.0, CDP, base 4deb8cf vs head, 2 reps unless noted):

| probe | base 4deb8cf | head 86ab9a2 |
|---|---|---|
| Part 2: click / double-click on toggle or name in an LP-embedded card | 5420 -> 3916, embed selected | **5420 held**, selection unmoved; the write lands (double toggle = net 0, same as base) |
| Part 2: Mod+A in a card input / after a card click | input fully selected / whole doc selected (after a jump) | **same result, no jump** |
| Part 2: click embed text outside the card; open-link icon | selects the embed, no scroll; opens B | **identical** |
| Part 2: chrome Edit / Collapse-Expand / Pin by real mouse | all work; Obsidian steals focus from the opened form back to the editor | all work; **form keeps focus** |
| Form Save from LP embed (FU1): E end, S below, mouse and keyboard | 6800 -> 3745/3769/3795 (text lost); below +68 (once 7536 -> 10546) | **0 px every case**; keyboard Save puts focus on the pencil (+ring) on both |
| Risk 5: two blocks; two embeds; delete block; prose edit/shrink; close pane / popout mid-hold | two blocks 7047 -> 5416 | held; each embed released on its own remount; **delete / shrink: floor kept 2.5 s (x3 writes: 4.5 s)**, same settled as base; internals 0, no leftovers |
| Risk 1 frame painted? (trace screenshots) | +68 px painted, permanent | **yes**: +110 painted for one frame (add 2/2), −110 (del 1/2); settled 0 |
| FU4 stale embed (G-S52 exact sequence) | **reproduces 2/2** | reproduces 3/3; with the host closed: no on both |

## Findings

### LOW-1: the embed floor outlives a redraw that leaves fewer or the same roots, and rapid writes re-arm it
- **Where:** `src/framework/host/livePreviewScrollHold.ts:310-311` (release needs a fresh or re-added root **and** `roots.length >= roots0.size`) and `:275` (`px = Math.max(px, prev.px)` on a re-hold).
- **Scenario, measured on head (headx bundle):**
  - B with two trackers, embedded near the end of an LP host parked at its end. A write deletes one tracker block:
    - the embed is held at 3437 px while its content is 1806 px;
    - a 1631 px blank band shows for **2504 ms** (TTL);
    - then scrollTop clamps 7047 -> 5416.
  - Base clamps to the same 5416 at once.
  - The same happens for a prose-only shrink of B (12 paragraphs removed). Obsidian redraws only that section, so no DSE root is fresh. Result: 480 px blank for 2.5 s, then 6317 -> 5837 (base: 5837 at once).
  - Three such writes 1 s apart (another pane's autosave while someone deletes text in B): the floor is re-armed at 2707 px each time and never lowered. It is held **4.5 s** in all, until 2.5 s after the last write.
- **Impact:** the settled position is identical to base, so the owner's bar holds. This is a new visible transient (blank space, then a late jump) that stock does not have.
- **Header:** KNOWN LIMITS (3) says the floor "is invisible unless the embed would shrink within that window". Deleting a block or a paragraph in B is exactly that case. The re-arm extension is not documented.
- **Prescribed fix (implementer's call, re-run G-S52):**
  - (a) Also release on a mutation batch in which at least one `roots0` member is still connected and every root now in the embed is mounted. Obsidian then re-rendered around our roots, and nothing of ours is collapsing. A full re-render disconnects every `roots0` member, so it still waits for the fresh mount, as today.
  - (b) On a re-hold, do not `Math.max` with `prev.px` when the previous hold's roots were never removed.
  - Add a G-S52 phase "delete one of two blocks / shrink prose: the hold is released within N frames of the redraw".
  - Or, if this is accepted as is, reword KNOWN LIMITS (3) to name both cases and the re-arm.

### LOW-2: the header text contradicts measurement (Risk 1)
- **Where:** `livePreviewScrollHold.ts:127`, "the rAF sampler reads 0".
- **What I measured:**
  - My rAF sampler read the transient too in 3 of 4 head runs: add +109 at one rAF, del −110 at one rAF.
  - The trace screenshots show the frame **is painted**: `sc522-r3-risk1-trace-frames-head-del1-add0.png`.
  - In that strip:
    - panel 1 is the pre-write frame (top line "L-POST filler 8");
    - panel 2 is the painted −110 frame (top "filler 10"), at +848.8 ms;
    - panel 3 is the next painted frame, back at "filler 8", +865.5 ms (17 ms later);
    - panel 4 is the add run's painted +110 frame (top "filler 6"), at +843 ms; the next painted frame, back at 0, follows 50 ms later.
- **Fix:** reword to "one painted frame of +110 / −110 px before CodeMirror's next measure (rAF and post-paint samplers and trace screenshots see it; settled 0)". The ruling to ACCEPT stands; this is accuracy only.

### INFO
1. **Part 2 has no regression.**
   - Probe results:
     - double-click, Mod+A, click outside the card, the open-link icon and chrome clicks all match base, except that base jumps or steals focus;
     - B's source stays reachable: a click on embed text selects the embed (CM selection 1447-1464), and the open-link icon opens `lpembtracker.md`.
   - No dblclick handler exists on the LP embed widget. The only Obsidian `interactive-child` consumers that our scope can reach are `hookClickHandler` (via `Ah`, which also skips `detail > 1`) and the editor Mod+A keydown, whose input `select()` gives the same result as native.
   - Header lines 122-123 ("double-click and Mod+A … not measured (r3 probes them)") can now cite this probe.
   - Improvement over base: a stock pencil click in an LP embed moves focus from the opened form's textarea back to the editor (Obsidian `selectElement` → `e.focus()`); head keeps it in the form.
2. **Follow-up 1's root cause is the harness, not the plugin.**
   - `formKit.clickPencil` → `t.realClick` calls `scrollIntoView({block:'center'})`. That scrolls the host, the pointer leaves the card, and the panel hides.
   - Hover plus a press at the pencil (no scroll) opens the form on both shas.
   - SC-518 composes: a keyboard Save leaves focus on the redrawn pencil with the ring (base and head), and scrollTop is held on head.
3. **Follow-up 4 reproduces on base 4deb8cf** (2/2) as well as head (3/3), so it is out of scope (Backlog per the ruling).
   - Exact trigger: the host stays open in the same leaf while B is reset (G-S52's `openHost` goes Reading -> LP on the same file). The embed keeps B's old body (26 heroes vs 25 on disk), and a click is refused with "…the block changed on disk first."
   - With the host closed (another note in the leaf) and B reset in-app or on disk, the embed is fresh and the click lands on both shas.
4. **Scope and lifecycle verified live:**
   - Reading-view host: only SC-479's `data-dse-scroll-pin`, no embed hold.
   - Own-file LP view: only SC-478's `data-dse-lp-hold`.
   - A write to a non-DSE embedded note: no hold.
   - Host with two embeds of B (both drawn): both held at once, released independently at 70-87 ms and 756-955 ms, both 3190 px after, no inline min-height left.
   - Closing the host pane or a popout mid-hold: `embedHolds` 1 -> 0 and `holds` 1 -> 0, no leftover `min-height`, no page error.
   - Popout hold uses the popout's own window (held 3171).
   - `releaseAll` was checked by code reading only: embed releases share the `holds` map.
5. **Cost** (headx, 6 LP panes, all scrolled):
   - `captureViewsOf` per `modify` of an unrelated note: median 0.5 ms, max 1.1 ms; `holdEmbedsOf` 0.1 ms median per view.
   - Per write of B with 4 holding host views: 12 ms median, 14.2 ms max; 3 ms per holding view, which is the forced layout read.
   - Acceptable.
6. **G-S52 quality:**
   - No outcome-deciding timed delay. The sleeps only park, and the (e) disk poll and record caps are bounds.
   - Not vacuous: (a)-(d) assert `redrawn` and `holdAtRedraw`, and (e) is discriminated by ctl-noclick.
   - (d) replaces the per-frame checks with settled checks (`obsidian-lifecycle.mjs:3558`), as documented.
   - Residual flake direction is a false red, never a false green: if Obsidian redraws the embed later than `PIN_TTL_MS` under load, the TTL releases first and the phase FAILs. r1 saw second-pane redraws at up to 1.9 s.
   - Not covered: the LOW-1 cases.

## Method
- **Bundles:** git-archive of each sha into scratch, built there with the tree's `node_modules` symlinked. Shas are in `sc522-r3-bundles-summary.log`:

| bundle | main.js | how built |
|---|---|---|
| base | `9c3f3fcc3772` | |
| head | `8ddcc02d751f` | |
| ctl-norelease | `66abea0818f5` | r2's replacement |
| ctl-noclick | `02a062a18f5b` | r2's replacement |
| headx | `d889dff15ee8` | head plus `window.__dseLpHold = lpHold`, probe-only, for the internals |

- **Runs:** probes ran from a scratch harness copy with `sc522-r3-probe-r3.mjs.txt` injected (r1's `mkharness`). The gates used the in-tree harness unchanged, with `DSE_LIFECYCLE_BUNDLE`, port 9573.
- **Fixtures:** the harness's `lpembtracker` / `lpembhostend` / `lpembhosttall`, plus r3 fixtures: `R3/two.md` (two trackers), `hosttwo`, `hostdouble` (two embeds of B), `hostmixed` (a plain embed plus B), `prose` / `hostprose`.
- **Risk 1:** `Tracing` with `disabled-by-default-devtools.screenshot`, aligned to `performance.now` via a `console.timeStamp` mark, and inspected visually. The band matcher in `sc522-r3-shift.py.txt` is ambiguous on repeated filler lines, so the visual check decides.

## Evidence (all in this dir, prefix `sc522-r3-`)
- **Gates:**
  - `lc-disc-{head,base,noclick,norelease}-1.log`, `lc-six-head-1.log`, `lc-half2-head.log`;
  - `tsc.log`, `lint.log`, `jest.log`;
  - FAIL shots `disc-{base,noclick,norelease}-1-G-S52-FAIL.png`.
- **Probes:**
  - logs `probe-{p2,form,formkey,r5*,fu4*,risk1,cost}-*.log`;
  - rows `*-P2.json`, `*-FORM.json`, `*-R5.json`, `*-FU4.json`, `cost-headx-COST.json`;
  - `risk1-*-meta.json`, `risk1-trace-frames-head-del1-add0.png`.
- **Scripts:** `probe-r3.mjs.txt`, `shift.py.txt`, `{mkbundle,buildall,lc,probe,checks}.sh.txt`, `bundles-summary.log`.
- **Raw trace JPEGs:** scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r3-a79dd8ba57f5042f0/out/risk1-*/`.

## Tree hygiene
- dse HEAD `86ab9a2`, porcelain empty, as at start.
- Superproject worktree porcelain ` M draw-steel-elements`, as at start: r2's unstaged pointer.
- In-tree ignored `main.js` / `styles.css` untouched (`8ddcc02d751f` / `ae45354b6369`); nothing was built in-tree.
- The 3 `/tmp/dse-obsidian-lifecycle-*` dirs my FAIL runs kept were deleted by literal path after their shots were copied. No process of mine is running.
