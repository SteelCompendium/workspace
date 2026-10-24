# SC-479 r1: reproduce and measure (embedded tracker, host note in Reading view)

## Executive summary
- **Verdict: CLAMPS (Reading view), on c2758a2 and on 7046eb0, identical numbers.** Obsidian 1.15.0 (harness pick), Xvfb, CDP, 2 reps per case, view adoption on and off.
- **Only one geometry moves:** host A is mostly the embed, parked at its end (embed bottom + text under it in view). Then **scrollTop 2887 -> 0** (second pane: **3574 -> 0**), 2/2, on every write that redraws the embed: `vault.process`, a disk write through the watcher, another pane's DSE write (adoption on and off), and the embed's own write with adoption off. With adoption on, the embed's own write is adopted, so nothing is redrawn and A holds.
- **Every other case held to the pixel, 2/2, both shas, adoption on and off.** That is the tall host (80 paragraphs above and below the embed) parked above (control), in the embed, below it, and at the end. It also covers the tracker-only embed, the tall-B embed (capped at 4000px), `![[B#heading]]`, a nested A->N->B embed, the embed near the end of a tall host, and 6x CPU throttle.
- **Mechanism (measured, not the spec's guess):** A's own sizer never moves. Inside one task the embed's inner sizer collapses (3165 -> 110px, embed 3190 -> 135px) and is back before the next frame, so no rAF frame ever shows it. A layout inside that task lets Chrome scroll anchoring (anchor inside the embed) drive A to 0, and nothing restores it. With `overflow-anchor: none` A ends at 2375 instead: the passive clamp, because A's sizer min-height is Obsidian's estimate (3332px) under the real 3844px.
- **The spec's fix alone does NOT hold.** Pinning A's sizer still gives 2887 -> 0 (emulated, 4/4; the `ctl-noanchor` bundle, 3/3 runs x 4 phases). Pinning the sizer **plus `overflow-anchor: none` on A's scroller for the pin's life** holds.
- **Prototype:** `sc479-r1-prototype.patch` on c2758a2, +335/-15. It adds host pins from the `modify` listener (embeds resolved by `metadataCache.getFirstLinkpathDest`), makes the writer pin reach the outermost scroller, and adds the anchoring stop for host pins only.
- **G-S42 on c2758a2: stock FAIL 3/3, proto ok 3/3, ctl-noanchor FAIL 3/3, ctl-nohost FAIL 3/3**, with all 4 phases failing in every FAIL. `--only=G-S8,G-S15,G-S18,G-S42` ok 3/3. **Full lifecycle 38/38**, rc=0. tsc, lint 0; targeted jest 96/96; the 5 new positive jest tests FAIL on stock source.
- **Cost:** a host pin is 3-14 ms to set and 3-17 ms to clear, the same as an SC-470 pin. The embed scan runs per Reading view on every modify: median 0.1 ms, max 0.9 ms.
- **LP host (information only, both shas):** `.cm-scroller` jumps 6800 -> 3745 (topLine 163 -> 155) with the embed near the end of A, and 7510 -> 7441 when parked below. That is a separate Backlog candidate. In emulation, holding the embed's height fixed it.

## Environment and method
- Worktree `/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements`. Started at 7046eb0. Fast-forwarded to **c2758a2** (SC-509) on the owner's instruction mid-round; `package.json` was unchanged, so no new `npm ci`. `npm ci` was run once at the start because `node_modules` was missing.
- Port 9479, Xvfb :160-:163, `obsidian 1.15.0` (printed by the harness), window 1440x1100.
- **Probes ran from a SCRATCH copy of the harness**, never from the tree. `sc479-r1-mkharness.cjs.txt` copies `visual-harness/obsidian-lifecycle.mjs`, points `repo` at the worktree (`S479_REPO`), and injects the probe blocks before `main()`: `sc479-r1-probe-{common,dom,repro,cost}.mjs.txt`.
- **Recorder (`P479-REPRO`):** each rAF records A's scrollTop, scrollHeight, the outer sizer's inline min-height, the embed's height and top, the embed's inner sizer min-height, an anchor paragraph's offset, and the pin attribute.
  - A MutationObserver adds: the first disconnect of the tagged embed root, embed element, inner and outer sizer; the min sizer values; a scroll-event minimum; and a page `modify` listener snapshot.
  - Optional modes: forced layout per mutation (`MOLAYOUT`), a scrollTop setter / scrollTo / scrollIntoView / focus trace (`TRACESET`), a CPU throttle, `overflow-anchor` overrides, and emulated pins (host sizer / embed inner sizer / embed element).
- **Prep write:** before each case B gets a malice value no embed has shown, and the probe waits until A's embed shows it. Without this, a `1 -> 2` write right after a `2 -> 1` reset did not redraw the embed in the first matrix, which made those rows vacuous; they were rerun.
- **Fixtures:**
  - B = `EmbB` (G-S8/G-S15 tall shape: 30 fillers, 25-hero tracker, 30 fillers) or `EmbS` (the tracker alone).
  - Hosts: `EmbA`/`EmbAS` (80 paragraphs, embed, 80 paragraphs), `EmbAH` (`![[EmbS#EmbS]]`), `EmbAN` (A->N->S), `EmbAE` (80 paragraphs, embed, 3 lines), `EmbAC` (`C-TOP`, embed, `C-BOTTOM`: A is mostly the embed).
- **Park positions:**
  - `above` = embed top − clientHeight − 600 (control);
  - `in` = embed top + 1500;
  - `below` = embed bottom + 400;
  - `end` = max scrollTop.
- **Writers:**
  - `own` = click a portrait toggle inside A's embedded tracker;
  - `pane` = B open in a second Reading pane, which makes the DSE click;
  - `process` = `vault.process` of B;
  - `nodefs` = Node `fs.writeFileSync` (file watcher);
  - `lpprocess` = A in Live Preview with `vault.process`.

## DOM facts (`sc479-r1-DOM-stock.json`)
- The embed is `span.internal-embed.markdown-embed > .markdown-embed-content` (max-height 4000px, overflow auto) `> .markdown-preview-view > .markdown-preview-sizer` (inline min-height).
- From the DSE root, `closest('.markdown-preview-view')` is the embed's inner view: scrollTop 0, scrollHeight == clientHeight. So today's writer pin returns at `scrollTop <= 0` and pins nothing: 0 pin frames in every stock row.
- A's outer view is the next `.markdown-preview-view` up. Nested embeds add one inner view per level.
- Far from the viewport the embed section is virtualised out: no DOM, and nothing happens on a write (all `end` rows of the tall host).

## Per-case results (scrollTop start -> min, 2 reps each; identical on 7046eb0 and c2758a2 unless noted)
Full rows: `sc479-r1-frame-summary.tsv` (430 rows, every probe rep, both shas).

| case (host / B) | park | adoption on | adoption off |
|---|---|---|---|
| own (tall host, EmbS) | above / in / below | held 1658 / 4779 / 6869 (adopted, no redraw) | held 1658 / 4779 / 6869 (redrawn) |
| pane (tall host, EmbS) | above / in / below / end | held 1658 / 4779 / 7555 / 9894 | held, same |
| process + nodefs (tall host, EmbS) | above / in / below / end | held 1658 / 4779 / 6869 / 9207 | held, same |
| tall B (EmbA, embed capped 4000px), all writers | above / in / below | held 1658 / 4779 / 7703 | held, same |
| `![[B#heading]]`, nested A->N->B, embed near the end (EmbAE) | in / below / end | held 4779 / 6845 / 7020 / 6127 | held, same |
| 6x CPU throttle (process, own, pane; S and E) | below / end / in | n/a | held 6869 / 6127 / 7555 / 4779 |
| **scenario-C host (EmbAC), process** | **end** | **2887 -> 0** | **2887 -> 0** |
| **scenario-C host, nodefs (file watcher)** | **end** | **2887 -> 0** | **2887 -> 0** |
| **scenario-C host, pane** | **end** | **3574 -> 0** | **3574 -> 0** |
| scenario-C host, own | end | held 2887 (adopted) | **2887 -> 0** |
| scenario-C host, all writers | in (1619) / above (200) | held | held |
| LP host (info): lpprocess EmbAE / EmbS / EmbS / EmbA | end / below / in / below | **6800 -> 3745**, **7510 -> 7441**, held 5420, held 8344 | 7046eb0 only, same |

- **SC-509 (c2758a2) changed nothing here.** The portrait-toggle click is the view's own persist (`fromView: true`), so it still adopts. Every c2758a2 row equals its 7046eb0 row (`sc479-r1-matrix-c2758a2-*.log` vs `sc479-r1-matrix-7046eb0-*.log`).
- SC-509 does add one redraw path: the block edit form's Save no longer adopts. A form save from inside an embed behaves like the measured "own, adoption off" row, so it clamps in the scenario-C geometry. The form itself was not driven.

## Embed redraw on a `modify` of B (spec question 5)
- **The embed is redrawn on every content change of B**, 20-120 ms after `modify` for an outside write and about 430-490 ms after the click for an own write with adoption off.
  - The DSE root is replaced. The `.internal-embed` element, its inner `.markdown-preview-view`, and A's outer sizer stay connected at every frame.
  - The inner sizer's inline min-height dips to 110px (EmbS) or 2430px (EmbB) for exactly one frame sample, then returns.
  - **A's outer sizer min-height never changes** (MutationObserver min == start in every row).
  - With adoption on, the embed's own write is adopted: no root disconnect, nothing changes.
- **`modify` fires before the redraw in every row.** The A snapshot at `modify` has the root connected and the full inner sizer, so a pin taken from `modify` captures full heights. This matches SC-470.
- **The collapse is sub-frame.** No rAF sample ever saw the embed shorter. A forced layout per mutation (`sc479-r1-matrix-7046eb0-mechTL.log`) shows it: at +29 ms the embed is 135px, A's scrollHeight is 3396 and scrollTop is already 0. At +71 ms the embed is back to 3190.

## Mechanism (all measured on the scenario-C host at its end; `sc479-r1-matrix-7046eb0-mech*.log`)

| variant (probe emulation, adoption off) | process | own |
|---|---|---|
| stock | 2887 -> 0 | 2887 -> 0 |
| `overflow-anchor: none` on A's scroller | 2887 -> **2375** (= 3332 + 64 − 1021: the passive clamp) | -> 2375 |
| pin A's sizer at its scrollHeight (spec direction) | 2887 -> **0** | -> 0 |
| pin A's sizer + `overflow-anchor: none` on A | **held 2887** | **held** |
| pin the embed's inner sizer | -> 0 (LP host: held) | -> 0 |
| hold the `.internal-embed` height | -> 0 (LP host: held) | -> 0 |
| embed height hold + `overflow-anchor: none` on the embed element | held | held |
| `overflow-anchor: none` on the embed element only (no pin) | held (a forced-layout trace shows the clamp to 2375 and then anchoring restoring it) | not run |

- **No script scrolls A.** The setter/scrollTo/scrollIntoView/focus trace recorded zero calls on A's scroller or its descendants (`mechTrace`). The move is browser-driven.
- **Why the tall host holds.** Anchoring subtracts the collapsed height and adds it back when the embed regrows. In scenario C, scrollTop (2887) is smaller than the collapse (3055), so it floors at 0, the anchor is destroyed with the tracker, and nothing restores it.
- **Condition for a user-visible jump:** the embed's DSE content is redrawn while the viewport shows it partially at the top, and A's scrollTop is below the collapse height. Separately, a pure clamp happens when scrollTop exceeds Obsidian's sizer-estimate max.

## Prototype (`sc479-r1-prototype.patch`, generated on c2758a2, `git apply --check` clean there; 7046eb0 copy in scratch)
- **`src/framework/host/previewScrollPin.ts`**
  - The header gains an "EMBEDS: THE HOST NOTE'S SCROLLER (SC-479)" section with the numbers above. The old "A DSE block inside an embed is not covered (SC-479)" line is removed.
  - New exported `anchorRule(id)` and type `LinkResolver`.
  - New `ruleText(held)`: the SC-470 child-combinator sizer rule (unchanged text for a note's own pins, so the existing exact-text jest test is untouched), plus `.markdown-preview-view[data-dse-scroll-pin="id"] { overflow-anchor: none !important; }` for host pins.
  - `HeldPin.host` flag. It is only ever set: an own pin later re-pinned as a host pin gains the rule and keeps its id and px.
- **`pin(containerEl)`** walks up to the OUTERMOST `.markdown-preview-view`. It is a host pin when that differs from the innermost.
- **`pinReadingViewsOf(workspace, path, resolveLink?)`**: a Reading view of another note is pinned (as a host) when `embedsBlockOf(scroller, path, view.file.path, resolveLink)`.
  - It checks every `.internal-embed[src]`, nested ones included, that contains `[data-dse-element]`.
  - The subpath after `#` is dropped, so `![[B#Section]]` and `#^block` both count as B.
  - Links resolve with `app.metadataCache.getFirstLinkpathDest(linkpath, hostPath)`. Why: the rendered `src` is exactly the link text, and the resolver is Obsidian's own link resolution.
  - Limitation: a nested embed is resolved from the HOST's path. That only differs from Obsidian for an ambiguous basename or a relative link written in N.
  - Every fail-safe stays. `PIN_TTL_MS` is unchanged.
- **`registerFrameworkElements.ts`** passes the resolver.
- **Jest** (`test/dom/framework/previewScrollPin.test.ts`):
  - The wiring test now expects `(workspace, path, Function)` and checks the resolver.
  - A new `describe('SC-479: embeds pin the host note's scroller')` has 6 tests: host pin with the exact rule text; heading and nested embeds; negatives (another note's embed, a non-DSE embed, no resolver, host not scrolled); a note's own pin keeps anchoring on; the writer pin reaches the outermost scroller; own -> host upgrade then TTL release.
  - On stock source, 5 of these fail as they should (4 SC-479 tests + the wiring test; the two negative tests pass on stock by design): `sc479-r1-jest-tests-on-stock-src.log`.
- **`visual-harness/obsidian-lifecycle.mjs`**
  - Fixtures `Lifecycle/embtracker.md` (the tracker alone) and `Lifecycle/embhost.md` (`C-TOP`, `![[embtracker]]`, `C-BOTTOM`).
  - A header line, and **G-S42** appended after SC-509's G-S40. The rebase onto c2758a2 needed a 3-way merge of two pure-add hunks; G-S40 is kept whole.
- **G-S42 phases:** (a) `vault.process`, (b) a disk write (watcher), (c) the embed's own click with adoption OFF, (d) a second Reading pane showing B makes the click.
  - Phase (c) runs before (d) because a narrower split pane leaves the embed's inner sizer with a stale, taller min-height afterwards: blank space and no visible toggle.
- **G-S42 per-phase assertions:**
  1. The write landed.
  2. A tracker is drawn in the embed.
  3. Anti-vacuity: the tagged embedded root was replaced.
  4. A was parked at its max scroll.
  5. `data-dse-scroll-pin` was on A's scroller when the tagged root left the document (MutationObserver).
  6. scrollTop min == max == start over every frame until release + 10 frames (cap: first pin sighting + 4500 ms, 12 s; 5 s with no pin; G-S15's recorder).
  7. The pin was seen released.
  - Every phase runs even after one fails.
  - There is no timed delay deciding anything and no hold hook: the redraw follows `modify` within the recorder window, and parking sleeps are settle waits, as in G-S15.
- **G-S42 discrimination, c2758a2** (`sc479-r1-disc-summary.log`, `sc479-r1-disc1-c2758a2-*.log`; 7046eb0 numbers identical, also in the summary):

| bundle | runs | result |
|---|---|---|
| stock c2758a2 (`ad2fec1cb367`) | 3 | **FAIL 3/3**, all 4 phases: no pin at the redraw, 2887 -> 0 (d: 3574 -> 0) |
| proto (`e0d207884e68`) | 3 | **ok 3/3**: held 2887 / 2887 / 2887 / 3574, 56-108 pin frames |
| ctl-noanchor (host pins, no anchoring rule = the spec's literal fix) | 3 | **FAIL 3/3**, all 4 phases: "scrollTop moved: start 2887 min 0 … pin present at the redraw true" |
| ctl-nohost (embed branch off, writer pin innermost) | 3 | **FAIL 3/3**, all 4 phases: no pin at the redraw |

- **Further runs with the prototype:**
  - `--only=G-S8,G-S15,G-S18,G-S42`: 4/4 ok, 3/3 runs on c2758a2 (`sc479-r1-only4-c2758a2-run{1,2,3}-proto.log`), and 3/3 on 7046eb0.
  - Full `npm run obsidian-lifecycle` on c2758a2: **`OBSIDIAN-LIFECYCLE done: 38/38 ok, 0 failed`, rc=0**, 9 min 14 s (`sc479-r1-full-lifecycle-c2758a2.log`). On 7046eb0 it was 37/37.
  - tsc 0, lint 0, `node --check` 0, jest (previewScrollPin, register-framework-elements, view-adoption, livePreviewScrollHold) **96/96** (`sc479-r1-checks-c2758a2.rc`).
- **Probe matrix with the prototype (7046eb0 build; c2758a2 is source-identical in these paths):**
  - Every Reading row held: scenario-C end for process, nodefs, own and pane, with adoption on and off; tall S, B, H, N and E; 51-137 host pin frames.
  - LP rows are unchanged (out of scope). `sc479-r1-matrix-proto7046eb0-{on,off}.log`.
  - Not separately discriminated: the writer-pin change alone. The `modify` host pin also covers the embed's own write, as SC-470 found for its own writer pin.

## Cost (`sc479-r1-COST-proto.json`, P470-COST method, first forced layout after set / clear, 3 reps)
- EmbA host (2724 nodes): sizer rule 5.1-9.7 / 8.9-10.5 ms; host rule (with anchoring off) 6.1-13.9 / 9.3-17.2 ms. A first-rep clear of 332.8 ms for the sizer rule alone looks like a cold layout outlier.
- EmbAC host (2456 nodes): sizer 5.6-6.7 / 6.6-42 ms; host 4.9-11.5 / 7.9-10.8 ms.
- tall.md (2415 nodes): sizer 3-4.8 / 4.5-27.7 ms; host 2.9-6.4 / 3.3-7.1 ms.
- Computed checks while set: sizer min-height held, and `overflow-anchor` read `none` only under the host rule.
- Embed scan per Reading view per `modify` of any note (querySelectorAll + DSE check + resolve, 20 reps): median 0.1 ms, max 0.3-0.9 ms.

## Risks and notes for the owner
1. **Phantom space.** Any `modify` of B now pins every Reading view that shows B's DSE block in an embed for `PIN_TTL_MS`, including adopted own writes that redraw nothing (own:end:C, adoption on: 136 pin frames). This is the same trade SC-470 made for a note's own views.
2. **Anchoring stays off on a host scroller for up to 2.5 s.** In every measured case the collapse is sub-frame, so nothing paints in between. If a future Obsidian spread the embed remount across frames, text under the embed would visibly shift for those frames and then return; scrollTop would not move. A note's own pins keep anchoring (there the collapse spans frames).
3. **Alternative measured, not chosen:** `overflow-anchor: none` on embed elements alone held scenario C (2/2, process). It relies on anchoring restoring a clamp, does not cover a viewport fully inside an embed past Obsidian's sizer estimate, and changes anchoring for every embed permanently.
4. **Live Preview host (out of scope, Backlog candidate):** `.cm-scroller` 6800 -> 3745 (embed near the end of A) and 7510 -> 7441 (below), 2/2 each on both shas, with or without the prototype. In emulation, holding the embed's inner sizer or the embed element at its height fixed both.
5. **SC-472:** `PIN_TTL_MS` is untouched. G-S42's (d) phase redraws at about 0.8 s, inside the TTL.
6. **Docs for the implementer:** dse-verify lifecycle row 37/37 -> 38/38 with a G-S42 entry; CHANGELOG `## Unreleased` bullet.

## Tree hygiene
- dse HEAD **c2758a2**, `git status --porcelain` **empty**. The prototype was applied with `git apply --3way`, then the index was reset and all 4 files restored with `git checkout --`.
- Ignored leftovers: `node_modules/` (from `npm ci`) and `.devbox/`. `main.js`, `styles.css` and `main.css` were deleted by exact path.
- The superproject worktree shows ` M draw-steel-elements` because the submodule moved 7046eb0 -> c2758a2 at the owner's instruction. Nothing was committed.
- Every `/tmp/dse-obsidian-lifecycle-*` dir from my FAIL runs was deleted by literal path after copying one screenshot per variant. No process remains under the worktree path.
