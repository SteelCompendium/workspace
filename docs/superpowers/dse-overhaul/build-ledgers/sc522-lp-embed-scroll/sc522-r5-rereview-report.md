# SC-522 r5: scoped re-review of the r4 fix round (dse 64e176f on develop 34f46cf; superproject d82709b on origin/main 8174d81)

## Executive summary
- **Verdict: APPROVE.** HIGH 0, MEDIUM 0, LOW 0, INFO 3. LOW-1 is fixed and measured, with no premature release (iii). LOW-2 and INFO-1 wording is accurate.
- **Gates on head:** bundle `5da60bd0a90e` (= r4 and in-tree); `styles.css` `ae45354b6369`.
  - tsc rc 0, lint rc 0; jest **6201 passed / 1 skipped / 248 of 249**.
  - `--only=G-S8,G-S15,G-S18,G-S42,G-S50,G-S52` **6/6 ok**.
- **G-S52:** head ok, with (f) released 0 frames after the redraw. Base 34f46cf FAILs (a)-(f). ctl-fresh FAILs (f) only ("hold stayed on for 149 frames after the redraw").
- **(i)-(v), host parked at its end, 2 reps** (hold off = ms after the write; "after" = rAF frames held after the redraw):

| case | base 34f46cf | head 64e176f |
|---|---|---|
| (i) delete one of two blocks | 7047 -> 5416 | 7047 -> **5416 at once**; off 21-24 ms; **0 frames** after |
| (ii) prose-only shrink | 6317 -> 5837 | -> **5837 at once**; off 18-23 ms; 0 frames |
| (iii) write to tracker 1 of two | **7047 -> 5416** (max back 7047) | **held 7047, 0 px**; off 39-47 ms, after the mount (37-46 ms); 0 frames |
| (iv) 3 prose shrinks 1 s apart | 6317 -> 5837 | 5837; each hold off 15-28 ms after its write; last off 2027-2038 ms |
| (v) two embeds of B (both drawn) | held (not parked at end) | held 6591 0 px; each released at its own remount (67-74 / 676-680 ms) |
| FU1, 2nd write fired at the 1st redraw | same height 6800 -> 3745; shrink 6317 -> 4905 | same height **held 6800**; shrink **5837** (= the new end); hold off 22-61 ms after the 2nd modify |

## Findings

### INFO-1: r4 Follow-up 1 cannot be reached by a real write here; the code path waits for its timer only when no further redraw follows
- **Real writes:**
  - I fired the second `vault.process` from a MutationObserver at Obsidian's first redraw batch, when the new root was in and still empty (`rootEmptyAtSecond: true`, at 28-33 ms).
  - Its `modify` arrived only at 324-665 ms, after our mount. The main thread is busy with the tracker mount (SC-533).
  - So no re-hold saw an empty root. Both shapes measured clean (table, FU1 row).
  - Back-to-back writes 3-7 ms apart (both before the first redraw) are coalesced by Obsidian into one redraw: held, off at 39-64 ms.
- **The code path itself** (`fu1-synth`, headx bundle):
  - `holdEmbedsOf` was called directly at the redraw batch with the root empty.
  - That hold waited for its timer: off at 2547-2548 ms, 62-85 frames after the redraw.
  - The floor equalled the content (3190), so it was invisible and scrollTop held 6800.
- **Why a shrink cannot show a 2.5 s band here:** a real second write that changes B redraws again. That brings either a fresh root (the fresh-root path) or a removal outside our roots (the new path), and both release.
- **Conclusion:** not a finding under the owner's rule (no blank band on the shrink case). Optional: one clause in KNOWN LIMITS (3).

### INFO-2: the re-hold condition at `livePreviewScrollHold.ts:287` has no effect in a real browser
- `px` is read at `:282` (`getBoundingClientRect().height - edges`) while the previous hold's `min-height` is still applied. `prev.release()` only runs at `:288`.
- So `px >= prev.px` already, and "keep the larger floor only if a held root was removed" behaves the same as the old unconditional `Math.max`.
- jest kills the mutation only because jsdom's rect is mocked.
- **No measured impact:**
  - a re-hold with every held root still connected needs a second `modify` while a hold is still on;
  - with the new release rule, holds end 15-72 ms after the write, so (iv) never re-holds (each hold was off before the next write).
- **Fix if wanted:** when no `prev.roots0` member is disconnected, call `prev.release()` before reading `px`. Otherwise, reword the 7612b48 claim and the comment at `:285-286`.

### INFO-3: the redraw evidence is "any removal outside our roots"
- **Where:** `:333`.
- **Scenario:** an unrelated removal inside the embed between `modify` and Obsidian's redraw, about a 20-30 ms window. Examples: another plugin's block in B re-rendering, or a lazily loaded nested embed or image.
- **What happens:** the release fires one task later, if every root is mounted. That write then behaves like stock (the clamp).
- This is the same class as r4 FU2, which the owner accepted: never worse than stock. Not probed; found by reading the code.

## Checks
- **(f), the frame bound:**
  - `heldAfterRedraw <= 5` counts rAF frames after the tagged root left the document. A slower frame rate only loosens the bound, never decides it by time.
  - No timer decides the outcome. The record cap is the old 4.5 s/12 s cap after the hold is first seen.
  - Anti-vacuity: tagged root removed; host parked at its end; embed shrank 3437 -> 1806; `holdAtRedraw === true`. Base FAILs (f) on "hold not on", so a build without the hold cannot pass.
  - ctl-fresh (rebuilt here from 64e176f with r4's replacement) FAILs (f) only, as designed.
- **Header:**
  - The LOW-2 text ("+110 / -110px for one PAINTED frame (rAF and post-paint samplers and trace screenshots see it; settled 0)") matches r3's trace.
  - The INFO-1 citation at `:122-127` matches r3's Part 2 probe.
  - The new release description and KNOWN LIMITS (3) match the measured batch shapes (rewrite: removal plus an empty root in one batch; delete/prose: removal only).
- **Proposed dse-verify text:** matches G-S52 as written.
  - Phase (f) at a <= 5-frame bound; base FAILs (a)-(f); ctl-fresh FAILs (f) only, as measured here.
  - The nohold/norelease (f) lines are r4's numbers; I did not re-run them.
  - It includes the INFO-6 false-red sentence.
- **CHANGELOG delta:** rebased only. The SC-522 bullet and the SC-479 "(Live Preview: see SC-522 above.)" edit are byte-identical to r3's review.
- **No regression of r3 probes on head (2 reps):**
  - Part 2 (click/double-click toggle, double-click name, Mod+A in an input and after a card click, card-then-outside, open-link, pencil, Collapse/Expand): identical to r3's head numbers. 5420 / 3720 / 6413 held; the form keeps focus; outside-card selects the embed; open-link opens B.
  - Form Save from an LP embed: E end and S below, mouse and keyboard, 0 px in all 8 runs; the keyboard Save puts focus on the pencil with the ring.
  - Close pane and popout mid-hold: internals 1 -> 0, no leftover, no errors.

## Evidence (this dir, prefix `sc522-r5-`)
- **Gates:** `lc-disc-{head,base,ctlfresh}.log`, `lc-six-head.log`, `tsc.log`, `lint.log`, `jest.log`; FAIL shots `disc-{base,ctlfresh}-G-S52-FAIL.png`.
- **Probes:**

| file | contents |
|---|---|
| `probe-r5a-headx.log` | (i)-(v) on head |
| `probe-r5b-headx.log` | FU1 with a 15 ms gap (it landed after the mount), edit-prose, close-mid, popout-close |
| `probe-r5c-headx.log` | back-to-back writes |
| `probe-r5d-headx.log` | FU1 fired at the redraw batch |
| `probe-r5e-headx.log` | `fu1-synth` |
| `probe-r5-base.log` | base |
| `probe-p2-head.log`, `probe-form-head.log` | r3 probe regression |

- JSON rows for every probe log: `*-R5.json`, `p2-head-P2.json`, `form-head-FORM.json`.
- **Scripts:** `probe-r5.mjs.txt`, `{mkbundle,buildall,lc,probe,checks}.sh.txt`, `bundles-summary.log`.
- **Bundles:**

| bundle | main.js |
|---|---|
| base 34f46cf | `613f6f466a67` |
| head | `5da60bd0a90e` |
| ctl-fresh | `6504791ad31a` |
| headx (head plus `window.__dseLpHold`, probe-only) | `2c2e4b35b827` |

## Tree hygiene
- dse HEAD `64e176f`, porcelain empty, as found.
- Superproject worktree ` M draw-steel-elements`, as found.
- In-tree `main.js` `5da60bd0a90e` untouched.
- The 2 FAIL temp dirs were deleted by literal path after their shots were copied. No process of mine is running.
