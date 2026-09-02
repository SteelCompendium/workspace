# SC-184 sidebar fix round — independent review

**Reviewer:** independent (did not write this code). **Reviewed:** dse branch
`sc184-sidebar-investigation` @ `5b1149a` (4 commits over `origin/develop` @ `1619396`,
verified: `git merge-base HEAD origin/develop` == `1619396` == `origin/develop` tip) plus
superproject commit `4c2035c`. dse worktree is clean; the superproject shows the expected
unstaged ` M draw-steel-elements` pointer bump (left for landing).

**Verdict: FIX ROUND REQUIRED.** Blocking: **HIGH-1**, **MEDIUM-1**, **MEDIUM-2**.
Everything the implementer claims to have built, works — I proved each item by runtime
probe (26/27 probes green; the 1 red was my own wrong selector). Every gate number in the
implementation report reproduced exactly. What blocks is (a) seven approved items shipping
with one trivial test, (b) two small accuracy/UX defects on the shipped surface.

## Finding count

CRITICAL 0 · HIGH 1 · MEDIUM 4 · LOW 5 · INFO 5

## Gates — measured by me, on this tree

| Gate | Measured | Claimed | Match |
|---|---|---|---|
| `npm run tsc` | clean (no diagnostics) | clean | ✅ |
| `npm run lint` | clean — only the standing `.eslintignore` deprecation warning, no rule output | clean | ✅ |
| `npx jest` (after `rm -f main.js styles.css`) | **Test Suites: 1 skipped, 189 passed, 189 of 190 total · Tests: 1 skipped, 3395 passed, 3396 total · Snapshots: 3 passed** · zero `✕` lines | 3395/1 skipped/189 suites | ✅ |
| `npm run shots` | **474 browser PNGs, 0 FAIL.** In-run gates all OK: `chrome placement OK (7 element families)`, `chrome host-leak OK (18 combos)`, `host-copy pin OK (… verbatim Obsidian 1.13.7 …)`, `button host-leak OK (111 kinds × 3 states × dark/light = 666)`, `print-twin parity OK (118 capture ids)`, `nested corner-radius OK` | 474 PNGs, 0 FAIL | ✅ |
| `check-freeze.sh` | **`freeze OK (210/210 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, 0 mismatches, 0 missing | 210/210, 0 mismatches | ✅ |
| `npm run parity` (run LAST) | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`** | 0/0/16 | ✅ |
| `npm run obsidian-shots` (DISPLAY :1 available) | **`all 59 shots written`**, every line `ok`, incl. the 6 sidebar-leaf specials and the canvas `data-dse-readonly` assertion | 59/59 | ✅ |

Load at the start of the battery: `/proc/loadavg` 1.29 — no load-sensitive-timeout risk;
no timeout-shaped reds appeared in `settings-tab`/`settings-preview`.

## Runtime probes I ran (out-of-tree, `/tmp` jest config; nothing added to the repo)

27 probes against the built code through `test/mocks/obsidian-core.ts`. **26 passed**; the
single failure was my own probe asserting the wrong counter-value selector, not a product
defect. Results that matter:

- **Pin gating.** Present on `mode:'reading' && canPersist`; **absent** on the canvas
  quarantine (`sourcePath:''`/`canPersist:false`), absent on an export-shaped host
  (`canPersist:false`, `getBlockInfo()→null`), absent in `live-preview` mode, absent on a
  sidebar host. **Unpin gating.** Present only on `mode:'sidebar'` **and** a host exposing
  `requestRemoval`; a sidebar host without it gets none; clicking it fires the callback once.
- **Pin write integrity** (`Intro text` / fence / `Trailing text`): after a pin the note
  still starts `Intro text\n\n` and ends `\n\nTrailing text`, and carries **exactly one**
  `_dse_anchor:`. Re-pinning the same block: still one panel, still one stamp, note
  **byte-identical** to the first pin's result.
- **No cross-talk.** Two `ds-counter` blocks in one note; pinning the second (fence line 4)
  leaves lines 0–2 byte-identical and stamps only the second block. No spurious "multiple
  blocks" Notice.
- **`ds-scc` (strictBody, SC-158's old corruption case).** Note **byte-identical** after a
  pin; panel mounts.
- **Unpin end-to-end through a real sidebar panel.** Chrome items per mounted sidebar panel
  are `['unpin','collapse','expand']`; clicking panel A's unpin leaves exactly panel B, with
  panel B's own header intact and `getState()` reduced to B's single entry.
- **Empty state.** Present on first open; removed when a panel mounts; back when the last
  panel is removed; idempotent under a double-remove and under two consecutive `setState`s.
- **`requestSaveLayout`.** 2 adds → **2** calls; +1 on remove → **3**; **0** during a
  two-panel `setState` restore. A dedupe-hit re-pin correctly fires **0**. Exactly the
  claimed semantics.
- **`collapsed` migration.** `setState({panels:[{…, collapsed:true}]})` restores without
  error and `getState()` comes back **without** the key. A `strictBody` panel's `body`
  survives the same normalize.
- **Degrade cards.** All three cases (unknown element, note not found, backing block gone)
  render header + card + an icon button whose accessible name is `Remove panel`; clicking it
  removes that panel and restores the empty state.
- **Header.** Label = registry `def.name` ("Counter"), note = basename ("Session 3"),
  `title` = full path; click calls `workspace.openLinkText(<path>, '', false)` once. After
  `removePanel`, clicking the detached link calls it **0** times — the
  `Component.registerDomEvent` listener is torn down.
- **Late-binding seam.** With no sidebar registered, `requestPinToSidebar` **resolves** and
  posts one Notice ("sidebar not available in this build") — no throw. After
  `unregisterDseSidebar()`, a pin writes nothing and posts the same Notice.

---

# Findings

## HIGH-1 — Seven approved items ship with one trivial test; the round also deleted coverage and left dead test scaffolding

**Where:** `test/dom/framework/sidebarBlockHost.test.ts:141-149` (the only new test);
`test/mocks/obsidian-core.ts:337-345`; `test/dom/framework/dseSidebarView.test.ts` (−10
lines).

The only test added for this round asserts that `SidebarBlockHost.requestRemoval()` calls
its injected callback. Grepping the whole `test/` tree finds **zero** references to:
`dse-sidebar__empty` / "No pinned blocks" (item 9), `dse-sidebar__panel-header` /
`-label` / `-note` / `-body` (item 3), `normalizePanelState` or the `collapsed` migration
(item 10), `"Remove panel"` (item 7), `requestPinToSidebar` / `unregisterDseSidebar` /
`'pin'`-item `onClick` (item 2), the `'unpin'` chrome item (item 1), or `requestSaveLayout`
anywhere outside the mock's own definition (item 4).

The mock gained `requestSaveLayoutCalls = 0` with a doc comment saying "tracked as a call
count **so tests can assert it fired**" — **no test reads it.** That is dead scaffolding
shipped as if it were coverage.

The round also *removed* the `dseSidebarView.test.ts` case that pinned "two panel states
differing only in `collapsed` are the same panel", with no replacement — so the migration
that made deleting the field safe (`normalizePanelState`) went in completely unpinned.

**Failure scenario.** Every one of these paths is currently correct (I proved it), and
nothing in the repo will notice when it stops being. Concretely: a future refactor of
`setState` that drops the `normalizePanelState` call, or of `removePanel` that drops the
`updateEmptyState()`/`requestSaveLayout()` calls, is green on all seven gates. Item 4's
whole point is *silent* data survival across restart — its failure mode is a user losing
pinned panels with no error anywhere, and it now has no regression gate at all.

**Fix.** Add one suite (extend `dseSidebarView.test.ts`, or a new
`test/dom/framework/sidebarChrome.test.ts`) with, at minimum:
1. `requestSaveLayoutCalls` — 2 after two `addPanel`s, 3 after a `removePanel`, 0 across a
   two-panel `setState` restore, 0 on a dedupe-hit re-pin.
2. `setState` with a legacy `{…, collapsed:true}` panel → mounts, and `getState()` has no
   `collapsed`.
3. Empty state: present on `onOpen`, gone after `addPanel`, back after removing the last,
   present after `setState({panels:[]})`, never duplicated.
4. Each of the three degrade messages → a button with `aria-label="Remove panel"` whose
   click removes the panel.
5. Header: `.dse-sidebar__panel-label` text == `def.name`, `.dse-sidebar__panel-note` text
   == basename and `title` == full path, click calls `openLinkText`.
6. Chrome gating: `canPersist:false` reading host → no `pin`; `mode:'sidebar'` +
   `requestRemoval` → `unpin`, and clicking it removes exactly that panel.

All six are five-line asserts against harnesses that already exist in
`dseSidebarView.test.ts` and `chrome.test.ts`; my probe file demonstrates each one working.
**Zero product risk — this is purely writing down what already holds.**

## MEDIUM-1 — The regenerated docs image shows ONE panel; both docs caption it as TWO

**Where:** `docs/advanced-usage.md:88` and `docs/writing-blocks.md:101` —
`![Two blocks pinned to the Draw Steel sidebar, each with its own header](Media/sidebar.png)`.
The regenerated `docs/Media/sidebar.png` (I opened it) shows a **single** panel: header
"Initiative tracker · initiative" over one initiative tracker.

**Failure scenario.** The surrounding prose is the round's central pitch — "Pin blocks from
as many different notes as you like — they stack in the same panel, each with its own
header" — and the image directly beneath it shows exactly one block from one note, actively
undercutting the reframe. A screen-reader user gets an alt description of an image that
does not exist.

**Fix.** Either regenerate with two panels — the evidence camera already produced exactly
that shot (`sc184-evidence-multi-panel.png`: counter + surges stacked with a separator) — or
reword both alt texts to describe one panel with its new header. Regenerating is the better
fix: it makes the image carry the pitch.

## MEDIUM-2 — "Pin to sidebar" fails **completely silently** when the block can't be bound, and one reachable authoring shape triggers it

**Where:** `src/framework/pipeline.ts:631-643` (the item) →
`src/framework/sidebar/registration.ts:192-206` (`requestPinToSidebar`) →
`registration.ts:129-152` (`sendToSidebar`).

`sendToSidebar` returns early on `fences.length === 0` and on `!bound`. `requestPinToSidebar`
only posts a Notice for "no sidebar registered" or a *thrown* error. So a pin that finds
nothing produces **no Notice, no leaf, no panel, nothing on screen** (probe B6: 0 notices,
0 leaves).

That is reachable today, not hypothetical. The two alias derivations disagree:

- `ReadingModeBlockHost.getBlockInfo()` (`src/framework/host/ReadingModeBlockHost.ts:41,96-104`)
  derives `language` with `OPEN_FENCE = /^([`~]{3,})(\S*)/` — **the first token only**.
- `anchor.ts`'s `iterateFences` (`src/framework/sidebar/anchor.ts:234-257`) matches
  `open.alias === alias`, where `open.alias` is `FENCE_LINE`'s `(.*)` **trimmed whole rest**
  of the line.

So for a fence written ```` ```ds-counter extra ````, the pin item hands `sendToSidebar` the
alias `ds-counter`, which `listFences` can never match against the stored alias
`ds-counter extra` → silent no-op. Probe B5 confirms: nothing written, no leaf, no notice.
The *older* command path is unaffected — `registration.ts`'s `aliasAtLine` uses the full
rest, so the two entry points now behave differently on the same block.

**Failure scenario.** A user with an info-string fence (or, more generally, any case where
the click's freshly-read section info doesn't resolve to a matching fence) clicks "Pin to
sidebar" and the product does absolutely nothing — no error, no explanation, no way to tell
whether the click registered.

**Fix.** Both halves are small:
(a) make the failure audible — have `sendToSidebar` report whether it bound (return
`boolean`, or take the `!bound` branch to a Notice) and have `requestPinToSidebar` surface
`Draw Steel Elements: couldn't find that block in <note>`;
(b) reconcile the alias derivations — either pass the fence's full info string from the pin
item, or have `iterateFences` compare only the first whitespace-delimited token of
`open.alias`. (b) alone closes the reachable case; (a) alone makes every other cause
diagnosable. Prefer both; (a) is the one that matters for the shipped UX.

## MEDIUM-3 — The degrade card's dismiss button renders as an unlabeled square block with no placement CSS

**Where:** `src/framework/sidebar/SidebarPanel.ts:263-272`; the new CSS section
(`styles-source.css:12439-12525`) deliberately adds no rule for it
(`styles-source.css:12504-12507`: "No extra rule needed").

`sc184-evidence-note-not-found.png` shows the result: a large square ghost button carrying a
bare ✕, sitting alone on its own line under the message, left-aligned inside the red-spined
error card. It reads as an empty box, not as "dismiss this panel". Its only human-readable
name is the `aria-label` (verified present: `Remove panel`).

**Failure scenario.** Item 7 exists so a broken panel stops being permanent debris. A user
looking at a broken panel sees an unexplained empty square and has to guess — or hover for
a tooltip — before they discover it is the fix. In a 300px sidebar this is the most visually
prominent thing on the card after the error text.

**Fix.** Give it a class (e.g. `.dse-sidebar__panel-dismiss`) and one rule in the new
section placing it at the card's top-right, or switch it to a labelled button reading
"Remove panel". Either is a ~6-line change confined to the new CSS section (still
harness-unreachable, still frozen-byte-neutral).

## MEDIUM-4 — The pin item silently changes the ⋯ panel's *presence* rule product-wide, and no before/after of a chrome panel is in the evidence set

**Where:** `src/framework/pipeline.ts:631`.

Because `pin` is now an unconditional `pipelineItems` member on every reading-mode
persistable render, elements that previously mounted **no** chrome panel at all (the
`collapsible:false`-and-nothing-else case) now mount one. The implementer correctly
detected this and re-pointed two `chromeRound2.test.ts` scenarios at a `canPersist:false`
host to keep the "no panel when it would be empty" rule provable — that is the right call,
not a fudge. But the consequence is a real, product-wide visual delta: every reading-mode
chrome panel is one button wider, and some blocks that never had a hover panel now have one.

The harness host is `mode:'reading'`, `canPersist: !opts.readonly`
(`visual-harness/entry.ts:1525,1529`), so all the `chrome-*` **screen** captures changed
pixels in this round. Nothing gates those (only print is frozen; chrome is print-absent —
freeze correctly reads 210/210), and the evidence set contains no chrome-panel before/after.

**Failure scenario.** Not a correctness bug — a review gap. If the extra button crowds the
panel at narrow/sidebar widths, or if the new-panel-on-a-previously-panel-less-element case
is unwanted, nobody in this round would have seen it.

**Fix.** One before/after crop of a chrome panel (any `chrome-hover-*` screen shot, old vs.
new) added to the evidence set for the ticket-owner's/Scott's eye. No code change implied.

## LOW-1 — `data-dse-sidebar-unavailable` is set but never cleared

`src/framework/sidebar/SidebarPanel.ts:259` sets it; nothing removes it. Probe E4 confirms
it still reads `true` on a panel that later recovers through `handleExternalChange`'s full
remount. Pre-existing, but this round changed the attribute's meaning (it is now on the
outer panel while the card lives in `bodyEl`) and the new CSS comment reasons about it, so
it is fair game. **Fix:** `this.panelEl?.removeAttribute('data-dse-sidebar-unavailable')` at
the top of `handleExternalChange`'s remount branch and on `mount()`'s success path.

## LOW-2 — The hover chrome panel overlaps the new panel header

`sc184-evidence-chrome-unpin.png`: the revealed `.dse-chrome` panel is painted over the
right end of `.dse-sidebar__panel-header`. `.dse-sidebar__panel-note` ellipsizes
(`styles-source.css:12490-12497`), so with a long note name the ellipsis sits under the
panel while hovering. Hover-only and transient. **Fix (optional):** a `padding-right`
reserve on `.dse-sidebar__panel-header`.

## LOW-3 — `removePanel` fires `requestSaveLayout()` even for a panel that isn't in `panels[]`

`src/framework/sidebar/DseSidebarView.ts:219-227`. Probe C2's double-remove bumps the
counter a second time. Harmless (Obsidian debounces layout saves), but the guard is one
line: move the `requestSaveLayout()` + `updateEmptyState()` inside `if (index >= 0)`.

## LOW-4 — `ds-hr` / `ds-roll` can never get a pin item (no `chrome` slot)

`src/framework/pipeline.ts` mounts `pipelineItems` only inside `if (def.chrome)`; probe A4
confirms `ds-hr` emits zero chrome DOM. Matches the implementer's own disclosure. Neither is
a plausible tracker, so no code fix — but `docs/writing-blocks.md:93` says "hover the block,
open its ⋯ menu" without qualification. **Fix (optional):** "hover the block" → "hover the
block (any element that shows a ⋯ menu)".

## LOW-5 — `visual-harness/sc184-evidence.mjs` (429 lines) committed as one-off diagnostic code

Verified harmless, exactly as claimed: **0** hits for `sc184` in `package.json`; not covered
by `npm run lint` (`eslint src main.ts`); writes only into the gitignored
`visual-harness/shots/` under `sc184-evidence-*` names that appear nowhere in
`freeze-baseline.sha256`; freeze re-verified 210/210 after my own `shots` run. Its header
documents both the usage and the genuinely useful CDP finding (a `clip` region silently
drops a synthetic `:hover`). **Keep-or-drop is the ticket-owner's call.** If kept, it is
worth one line in the harness docs so a future reader doesn't take it for dead code.

## INFO-1 — Embed reconciliation: claim upheld

All four cited comment sites exist verbatim and are **unchanged by this diff**:
`src/framework/host/BlockHost.ts:45`, `src/elements/stamina-bar/view.ts:109`,
`src/elements/statblock/view.ts:318`, `src/framework/host/ReadingModeBlockHost.ts:145`.
`ReadingModeBlockHost.canPersist` (`:84-87`) is the two lines quoted in the report and
contains no embed branch. Nothing in the diff *newly* asserts embeds are read-only, and a
grep across `docs/*.md` for embed + read-only/inert/"can't edit" returns nothing — the
shipped docs make no such claim. The four misleading comments remain (correctly flagged as
a discovered tangent, not fixed in-scope).

## INFO-2 — CSS scoping and harness-unreachability: claims upheld

`dse-sidebar` appears **0 times** in `visual-harness/entry.ts`, `shoot.mjs` or the
manifests, and **9 times** in `obsidian-camera.mjs` — so the new rules genuinely cannot
reach a frozen `*--steel-print.png` (independently confirmed: freeze 210/210 after my own
regeneration). The unscoped-by-theme convention matches the existing `.dse-error-card`
precedent (`styles-source.css:404`, likewise unscoped). Every custom property used resolves
outside a Steel scope — `--dse-fs-label` is defined on bare `:root`
(`styles-source.css:4525`); everything else is an Obsidian theme var
(`--background-modifier-border`, `--text-muted`, `--text-normal`, `--font-semibold`,
`--size-4-*`, `--link-color`/`--interactive-accent`). No hard-coded colors.

## INFO-3 — Colorblind check: no hue-only state found

The header's note link is the only accent-colored element; it is *also* distinguished by
weight (`--font-semibold` label vs. normal-weight link) and gains an underline on hover, so
its identity is not carried by hue alone. Pin vs. unpin differ by **glyph** (`pin` vs.
`pin-off`'s slash), verified legible in `sc184-evidence-chrome-pin.png` vs.
`sc184-evidence-chrome-unpin.png`. The degrade card carries a red spine **and** the literal
text "Draw Steel: panel unavailable". Nothing found where hue is the sole carrier.

## INFO-4 — Scope: clean, no creep into the deferred areas

Nothing in `1619396..5b1149a` touches panel reordering (**SC-281**), vault rename/delete
listeners (**SC-282** — `SidebarBlockHost`'s listener registration is untouched apart from
the added constructor parameter), session-key unification (**SC-283**), or tabs of any kind
(rejected). All seven approved items and both doc pushes are present. The pitch reframe uses
the ledger's approved wording essentially verbatim ("a GM dashboard assembled from blocks
that live in **different** notes") and the pinned-note-tab paragraph is present in all three
docs plus its own `### One note instead?` section. Both CHANGELOGs are accurate about what
shipped.

## INFO-5 — Late-binding seam and reload hygiene: verified

`registration.ts:44` module-scoped `dseSidebarPinTarget`, set at `:50`, cleared at `:179`
(`unregisterDseSidebar`), called unconditionally from `main.ts` `onunload`. Probe B1: with
no sidebar registered, `requestPinToSidebar` resolves, posts one Notice, does not throw.
Probe B7: after `unregisterDseSidebar()` a pin writes nothing and posts a Notice — no stale
bundle. The header link listener goes through `Component.registerDomEvent`, and probe F2
confirms it is gone after `removePanel` (0 calls on the detached node). The
`DseSidebarView.mountPanel` removal closure (`let panel!: SidebarPanel; … () =>
this.removePanel(panel)`) creates a view↔panel cycle, but both are torn down by the same
`Component` cascade, so it is not a leak.

---

# Verdict

**FIX ROUND REQUIRED.**

**Blocking:**
- **HIGH-1** — six of seven approved items have no behavioral test; a mock counter was added
  for assertions nobody wrote; deleted coverage was not replaced. Zero product risk to fix.
- **MEDIUM-1** — `docs/Media/sidebar.png` shows one panel under alt text claiming two, in
  both docs, directly under the round's central pitch.
- **MEDIUM-2** — "Pin to sidebar" can fail with no feedback whatsoever, and one reachable
  fence shape (an info string past the language token) triggers exactly that because the pin
  path's alias derivation disagrees with `anchor.ts`'s.

**Recommended, ticket-owner's call (not blocking):** MEDIUM-3 (dismiss-button placement —
the only new UI on the degrade path), MEDIUM-4 (one chrome-panel before/after crop for the
evidence set), LOW-1 through LOW-5.

**Not at issue:** every gate reproduced exactly; zero frozen bytes moved; no scope creep;
the embed reconciliation, the CSS scoping/unreachability argument, the late-binding seam,
and the `requestSaveLayout` / `collapsed`-migration semantics all hold under direct runtime
probe.
