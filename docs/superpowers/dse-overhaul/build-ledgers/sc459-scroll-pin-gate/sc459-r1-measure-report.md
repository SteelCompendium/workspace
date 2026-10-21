# SC-459 r1: measuring the SC-198 clamp on Obsidian 1.14.4

## Executive summary
- **Verdict: CLAMPS.** The clamp still happens on 1.14.4, but only when the changed DSE block is drawn fresh. With view adoption ON (the default), a DSE write by the writer itself never reaches the clamp.
- M1, bare one-character `vault.process` on a scenario-C note (one 45-hero tracker): changing the tracker's own text gives **scrollTop 2416 -> 0 and 4831 -> 0**, with sizer inline min-height **5276px -> 93px**. Edits elsewhere in the note (heading, EOF) never collapse the sizer. A huge code fence (260 lines), a huge table (220 rows) and 220 paragraphs **never clamp**, even when the tall element itself is edited (24/24 held).
- M2, DSE write, adoption ON (today's G-S8 path): the tracker DOM is adopted and min-height holds at 5276px or 5501px. scrollTop held **8/8 with the pin disabled in JS, 8/8 with the CSS rule deleted, 8/8 stock**.
- M2b, DSE write, adoption OFF (SC-340 kill switch): unpinned, **2416 -> 0, 4831 -> 0, 2779 -> 2001 (G-S8's own note and scroll position), 2272 -> 1529**. Stock (pinned) held in **8/8**.
- M3: today's G-S8 passes unpinned because SC-340 adoption keeps the tracker DOM, so nothing rebuilds and the sizer never collapses. The note shape is not the cause: the same tall.md clamps 2779 -> 2001 once adoption is off.
- M4 prototype: G-S8 keeps its adoption-on phase and gains an adoption-off phase. That phase asserts the tracker was rebuilt, the sizer's inline min-height fell below scrollTop, `data-dse-scroll-pin` was present at that moment, and scrollTop held. **Discrimination: pin disabled in JS FAIL 3/3, CSS rule deleted FAIL 3/3, stock ok 3/3.** Full lifecycle with the prototype: **27/27 ok**.
- New gap (MEDIUM, outside the pin's reach): a **second pane** showing the same note clamps **3020 -> 0 on every DSE write, with adoption ON, stock** (2/2). The same happens to any external or sync edit of a tracker's body. The pin only covers the writer's own scroller.
- Judgment for the owner or Scott: on default settings the pin is now only a backstop for adoption misses. Option (a) is to land the prototype; option (b) is to retire the pin (a Scott decision). Either way, the second-pane gap is a separate Backlog item.

## Environment
- The harness launches **Obsidian 1.14.4** (`OBSIDIAN-LIFECYCLE start: obsidian 1.14.4` in every log; asar `~/.config/obsidian/obsidian-1.14.4.asar`). Window 1440x1100, scroller clientHeight 1021.
- dse worktree `/home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate/draw-steel-elements` at `188755b`. `npm ci` was run there (it had no node_modules). Port 9341, display :160 or :161.
- I built three bundles once into scratch with `sc459-r1-build-bundles.sh`. Each mutation was reverted right after its build. The markers are in `sc459-r1-bundle-markers.log`:
  - **stock**: `a&&l)try{…pin(this.containerEl)`. main.js sha `42f1445cb451`, styles.css `698d2d07cf15`.
  - **nopin-js**: the SC-260 reviewer's guard. Confirmed in the built main.js as `a&&l&&Date.now()<0)try{…pin(this.containerEl)`. main.js `bba9314a99c6`, same CSS as stock.
  - **nopin-css**: the SC-198 rule `.markdown-preview-view[data-dse-scroll-pin] .markdown-preview-sizer{min-height:var(--dse-scroll-pin)!important}` is deleted, which is the SC-198 commit's own control. CSS `43bec22bd394`, main.js the same as stock.
- How the probes ran: `sc459-r1-probe-block.mjs.txt` adds probe scenarios `P-M1`, `P-M2`, `P-M2b` and `P-M2c` plus four fixtures. `sc459-r1-run.sh` injects it temporarily before `main()` in `obsidian-lifecycle.mjs`, runs it with `DSE_LIFECYCLE_BUNDLE=<bundle>`, and reverts with `git checkout`.
  - Each frame (rAF) records scrollTop, scrollHeight, clientHeight, the sizer's inline min-height, the pin attribute, whether the sizer or scroller was replaced, whether the DSE root survived (tagged), and the scroll-event count.
  - Full per-frame series are in the `sc459-r1-M*.json` files.

## M1: bare one-character write, plugin not writing (stock bundle; log `sc459-r1-m1-stock.log`, data `sc459-r1-M1.json`)
Shapes:
- **one-tracker**: `# one` plus a single 45-hero `ds-initiative`.
- **one-code**: a 260-line code fence.
- **one-table**: 220 rows.
- **paras**: 220 paragraphs.
- **tall**: G-S8's own note, which is 30 filler lines, a 25-hero tracker, then 30 filler lines.

Edits:
- **eof**: `c + 'x'`.
- **head**: one character of the H1.
- **inside**: one character inside the tall element. For the trackers this is `value: 1 -> 2`, an external edit, so the tracker rebuilds fresh.

Each edit was run at two positions: **mid** (50% of max) and **max** (the bottom).

| shape | edit | mid: st start -> end | max: st start -> end | sizer inline min-height |
|---|---|---|---|---|
| one-tracker | eof / head | 2416 -> 2416 | 4831 -> 4831 | 5276px, held |
| one-tracker | **inside** | **2416 -> 0** | **4831 -> 0** | **5276px -> 93px** |
| one-code | eof / head / inside | 2941 -> 2941 | 5881 -> 5881 | 6326px, held |
| one-table | eof / head / inside | 3102 -> 3102 | 6203 -> 6203 | 6648–6664px, held |
| paras | eof / head / inside | 3945 -> 3945 | 8401 -> 8401 | 8846px, held |
| tall | eof / head | 2272 -> 2272 | 5056 -> 5056 | 5501px, held |
| tall | **inside** | **2272 -> 1529** | **5056 -> 1489** | **5501px -> 2486px** |

How the collapse looks frame by frame (one-tracker/inside/mid):
- Frame t=0: st 2416, min-height 5276px.
- Next distinct frame, t=841ms: st already **0**, min-height **93px**, 1 scroll event, DSE root new.
- t=904ms: min-height is back to 5276px, but st stays 0.

The collapse and clamp happen between two rAF samples, and the browser never restores the position. This is the SC-198 mechanism.

Conclusions:
- On 1.14.4, unchanged sections are kept: head and eof edits never collapse the sizer.
- A changed non-DSE section is re-rendered synchronously, so there is no short frame.
- A changed DSE block that is drawn fresh empties its section for a moment while its view mounts asynchronously. That is when the sizer collapses and the clamp happens.

## M2: DSE write (G-S8's portrait toggle, `has_taken_turn`), adoption ON (logs `sc459-r1-m2-{stock,nopin-js,nopin-css}.log`, data `sc459-r1-M2-*.json`)

| note / position | nopin-js | nopin-css | stock | pin frames (stock) | DSE root |
|---|---|---|---|---|---|
| one-tracker mid (2416), x2 | held | held | held | 59 / 61 | same (adopted) |
| one-tracker max (4831), x2 | held | held | held | 84 / 81 | same |
| tall gs8 (2779), x2 | held | held | held | 90 / 82 | same |
| tall mid (2272), x2 | held | held | held | 72 / 90 | same |

- Sizer inline min-height never moved: 5276px or 5501px in every run.
- `tall max` (5056, x2) is excluded. No toggle was inside the viewport band there, so the write did not land; this is a probe artifact.
- The pin attribute **is** applied on stock and nopin-css. It first appears about 410ms after the click, which is the debounced write. It is applied, but it has nothing to do.

## M2b: the same DSE write with adoption OFF (`viewRegistry.enabled = false` at runtime; `claim()` reads it on every call) (logs `sc459-r1-m2bc-*.log`, data `sc459-r1-M2b-*.json`)

| note / position | nopin-js | nopin-css | stock |
|---|---|---|---|
| one-tracker mid, x2 | **2416 -> 0** | **2416 -> 0** | held 2416 |
| one-tracker max, x2 | **4831 -> 0** | **4831 -> 0** | held 4831 |
| tall gs8, x2 | **2779 -> 2001** | **2779 -> 2001** | held 2779 |
| tall mid, x2 | **2272 -> 1529** | **2272 -> 1529** | held 2272 |

- The DSE root was new (rebuilt) in every run, and every write landed.
- Inline min-height minimum: 93px for one-tracker and 2486px for tall in the unpinned runs. Stock shows **46px** and **2446px**: the inline value still collapses, but the `!important` rule outranks it.
- With nopin-css the pin attribute is present (49–99 frames) but has no effect, which confirms the CSS rule is the part that works.
- When the collapse lands, it is visible in exactly **1** rAF frame. That is why the prototype detects it with a MutationObserver rather than rAF sampling.

## M2c: adoption ON, the same note in two panes, write from pane A (data `sc459-r1-M2c-*.json`)
- Every variant, 2/2: **pane A (the writer) holds at 3020. Pane B goes 3020 -> 0, with min-height falling to 93px.**
- Pane B's pin frames are 0, even on stock.
- This is a residual SC-198 bug that the pin cannot fix as designed. It only pins `containerEl.closest('.markdown-preview-view')` of the writer.
- External edits of a tracker body (M1 one-tracker/inside: Sync, git, another device, another plugin) clamp the same way. See Finding F1.

## M3: why today's G-S8 passes unpinned
- G-S8 (`visual-harness/obsidian-lifecycle.mjs:1175-1192` at `188755b`) opens `Lifecycle/tall.md`, scrolls to the tracker top + 1500 (that is 2779 of max 4544), clicks a visible portrait toggle, and samples scrollTop for 2.2s.
- **The cause is SC-340 view adoption.** The writer's own write is claimed and the tracker DOM is kept (DSE root "same" in 8/8). The sizer's inline min-height never collapses (5501px -> 5501px), so the scroller never gets short and there is no clamp for the pin to prevent. Pin disabled or rule deleted, it is held 8/8 (M2), which matches SC-260's `G-S8 ok (scrollTop held at 2779 …)`.
- The note shape is **not** the cause. tall.md at G-S8's exact position clamps **2779 -> 2001** as soon as the rebuild happens (M2b). It only clamps to 2001 and not to 0 because of the 30 POST filler paragraphs, but that is still well over the 0-tolerance assertion.

## M4: verdict and design
**Verdict: CLAMPS.** It happens whenever a DSE block is drawn fresh by a write's rebuild. On 1.14.4 the writer's own write reaches that path only when adoption misses: the `viewAdoption:false` kill switch, a claim miss, or a collision. The SC-198 user scenario (a click in a tall tracker in the default configuration) no longer depends on the pin.

**Prototype** (`sc459-r1-gs8-prototype.patch`):
- It changes only the G-S8 scenario object: +43/-12 lines in `visual-harness/obsidian-lifecycle.mjs`. There is no FIXTURES change and no shared helper change, so the SC-460 conflict surface is only those lines.
- `git apply --check` is clean on `188755b`.
- **Phase 1 (adoption ON, default)** is the existing assertion: the write landed and scrollTop min == max == start.
- **Phase 2 (adoption OFF)** first saves `viewRegistry.enabled`, sets it false, does the same write, and restores it in `finally`. Then:
  1. **Recording.** It tags the tracker root before the click. A MutationObserver on the scroller (style attribute and childList, subtree) records the lowest sizer inline `min-height`, and whether `data-dse-scroll-pin` was on the scroller when that value first fell below the starting scrollTop. A scroll listener and per-frame samples record scrollTop.
  2. **Assertions**, in this order:
     - The write landed.
     - The tracker was rebuilt (the tagged root is gone). This guards against the phase becoming vacuous.
     - The sizer's inline min-height fell below the starting scrollTop. This is a tripwire: if a future Obsidian stops collapsing the sizer, the pin is untested, and the message says to re-measure.
     - `data-dse-scroll-pin` was present at the collapse.
     - scrollTop min == max == start.

**Discrimination** (`--only=G-S8`, prebuilt bundles; logs `sc459-r1-disc{1,2,3}-{stock,nopin-js,nopin-css}.log`):

| variant | run 1 | run 2 | run 3 |
|---|---|---|---|
| stock | ok, rc=0 | ok, rc=0 | ok, rc=0 |
| nopin-js | FAIL, rc=1: `adoption off: data-dse-scroll-pin was not on the scroller when the sizer collapsed to 2446px (pin frames 0)` | same | same |
| nopin-css | FAIL, rc=1: `adoption off: scrollTop moved: start 2779 min 2001 max 2779 (sizer inline min-height fell to 2446px, pin present true)` | same | same |

- The stock ok line is `adoption on: scrollTop held at 2779 over 110 frames; adoption off: tracker rebuilt, sizer min-height fell to 2446px under the pin, scrollTop held at 2779 over 109 frames`.
- The full lifecycle with the prototype, stock, built by `npm run obsidian-lifecycle`, gives `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed`, rc=0 (`sc459-r1-full-lifecycle.log`).
- `visual-harness/` is eslint-ignored (`sc459-r1-eslint-harness.log`).
- G-S8 now does two writes, which adds about 5s.

Judgment calls for the implementer and owner:
- The prototype keeps `Lifecycle/tall.md`, which clamps to 2001. Switching to a scenario-C fixture (`# one` plus a 45-hero tracker, which clamps to 0) would need a FIXTURES entry. That is the shared object SC-460 may also touch. It is not needed for discrimination.
- The header comment at `obsidian-lifecycle.mjs:24` still reads "G-S8 (scrollTop pin across a tracker's own write)". I left it alone to keep the diff inside the scenario.
- The collapse tripwire can be made softer, for example a note instead of a FAIL, if the owner does not want an Obsidian behaviour change to fail the gate.

If the pin were retired (option b, a Scott decision; nothing removed):
- `src/framework/host/previewScrollPin.ts`
- The `scrollPin` constructor parameter and its call site in `src/framework/host/ReadingModeBlockHost.ts` (`:289-291`, the `section && changedContent` try/pin block at about `:588-603`)
- `src/framework/registerFrameworkElements.ts:24,53-54,76` (construction, `releaseAll` registration, passing it to the host)
- The `styles-source.css:1-18` rule and its comment block
- `test/dom/framework/previewScrollPin.test.ts`
- The G-S8 scenario, which would need to be retired or re-scoped to "adoption keeps scrollTop"
- The CHANGELOG entries for SC-198 and SC-260 are history and stay

The cost of retiring it is that adoption-miss writes clamp again, as measured in M2b.

## Findings
- **F1 (MEDIUM, new, out of scope; Backlog candidate for the owner to file): SC-198 still clamps for every non-writer reading view of the note.**
  - Scenario 1: the same note open in two panes, both scrolled. A click in pane A sends pane B 3020 -> 0, with adoption on and the pin on, 2/2.
  - Scenario 2: an external change to a tracker's body (Sync, git, another device) sends the open view 2416 -> 0 or 4831 -> 0.
  - Cause: `PreviewScrollPin.pin` only pins `containerEl.closest('.markdown-preview-view')` of the writing host (`previewScrollPin.ts:76`). The other views rebuild fresh (writer-only adoption, SC-340 G-S4) or rebuild on an external edit (G-S5).
  - Possible fix (to be designed, not prescribed here): pin every open reading-view scroller showing `file`, from a `vault.on('modify')` hook or from `ReadingModeBlockHost` before the rebuild. An external `modify` arrives after the write, so it may need a pre-render hook. Needs its own measurement.
- **F2 (INFO): SC-198's mechanism statement is partly stale on 1.14.4.** The header in `previewScrollPin.ts:6-13` says any write tears all sections down and collapses the sizer. On 1.14.4, writes that do not touch a fresh-rendered DSE block (H1 edit, EOF append, edits inside a code fence or table) never collapse it in 24/24 runs. The collapse comes from an async DSE mount in a re-rendered section. Whether 1.13.7 behaved differently cannot be checked, because the SC-198 root-cause doc is not on this machine. Comment-accuracy follow-up for the implementer if the pin is kept.
- **F3 (INFO): with `enabled = false`, `claim()` returns before `stats.misses++`** (`viewRegistry.ts:138`). This is why the kill-switch phase shows claims 0 and misses 0. That is expected; the gate does not rely on stats.

## Tree hygiene
- Before: `git status --porcelain` was empty in both the dse worktree and the superproject worktree. dse HEAD was `188755b`.
- After: both are empty. dse HEAD is `188755b`.
- I deleted the ignored build outputs I created (`main.js`, `main.css`, `styles.css`). `node_modules/` (from `npm ci`) and `.devbox/` remain, both ignored.
- FAIL runs kept six `/tmp/dse-obsidian-lifecycle-*` dirs. I deleted exactly those six by exact path, after copying two screenshots. One other effort's `/tmp/dse-obsidian-lifecycle-*` dir is untouched.
- No commits.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/`)
| What | Files |
|---|---|
| Prototype | `sc459-r1-gs8-prototype.patch` |
| Probe and scripts | `sc459-r1-probe-block.mjs.txt`, `sc459-r1-run.sh`, `sc459-r1-build-bundles.sh`, `sc459-r1-full.sh` |
| Build and marker logs | `sc459-r1-bundle-markers.log`, `sc459-r1-build-{stock,nopin-js,nopin-css}.log`, `sc459-r1-npmci.log` |
| M1 | `sc459-r1-m1-stock.log`, `sc459-r1-M1.json` |
| M2 | `sc459-r1-m2-{stock,nopin-js,nopin-css}.log`, `sc459-r1-M2-*-m2.json` |
| M2b and M2c | `sc459-r1-m2bc-{stock,nopin-js,nopin-css}.log`, `sc459-r1-M2b-*-m2bc.json`, `sc459-r1-M2c-*-m2bc.json` |
| Discrimination | `sc459-r1-disc{1,2,3}-{stock,nopin-js,nopin-css}.log`, `sc459-r1-disc1-nopin-js-G-S8-FAIL.png`, `sc459-r1-disc1-nopin-css-G-S8-FAIL.png` |
| Full lifecycle and lint | `sc459-r1-full-lifecycle.log`, `sc459-r1-eslint-harness.log` |
