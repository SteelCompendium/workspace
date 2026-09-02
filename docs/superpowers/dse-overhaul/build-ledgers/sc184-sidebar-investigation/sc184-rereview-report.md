# SC-184 fix round — scoped re-review (delta only)

**Reviewer:** same independent reviewer as `sc184-review-report.md`. **Scope:** the delta
`5b1149a..44158f7` (5 commits) only — not a fresh full pass.

**Verdict: LAND-READY.** All three blocking findings (HIGH-1, MEDIUM-1, MEDIUM-2) and all
five recommended findings are genuinely closed, verified by re-probe and by eye, not taken
on the fixer's word. Every gate number the fixer claimed reproduced exactly. Eight new
observations, **none blocking** — one (N-1) is a pre-existing hole the LOW-1 fix does not
reach and is worth a Backlog ticket, not a fix round.

Base unchanged and correct: `git merge-base HEAD origin/develop` == `origin/develop` ==
`1619396`. dse worktree clean; superproject still carries only the expected unstaged
` M draw-steel-elements` pointer bump.

## Gates — measured by me on `44158f7`

| Gate | Measured | Fixer claimed | Match |
|---|---|---|---|
| `npm run tsc` | clean, no diagnostics | clean | ✅ |
| `npm run lint` | clean (only the standing `.eslintignore` deprecation warning) | clean | ✅ |
| `npx jest` (after `rm -f main.js styles.css`) | **Test Suites: 1 skipped, 190 passed, 190 of 191 · Tests: 1 skipped, 3417 passed, 3418 · Snapshots: 3 passed** · zero `✕` | 3417/1 skipped/190 suites | ✅ |
| `npm run shots` | **474 browser PNGs** (identical count to the implementation round), 0 `--ERROR`, 0 FAIL. In-run gates all OK: chrome placement (7 families), chrome host-leak (18 combos), host-copy pin (Obsidian 1.13.7 verbatim), button host-leak (111×3×2 = 666), print-twin parity (118 ids), nested corner-radius | 0 ERROR / 0 FAIL | ✅ |
| `check-freeze.sh` | **`freeze OK (210/210 frozen print PNGs byte-identical)`**, 0 mismatches, 0 missing | 210/210, 0 mismatches | ✅ |
| `npm run parity` (run LAST) | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`** | 0/0/16 | ✅ |
| `npm run obsidian-shots` | **`all 59 shots written`**, 59 `ok` lines, zero FAIL/Error — the camera edit did **not** perturb the other 58 | 59/59, 0 FAIL | ✅ |

Load at battery start 9.05 (elevated, other agents active) — no timeout-shaped reds in the
load-sensitive `settings-tab`/`settings-preview` suites; not needed.

The 479 files in `visual-harness/shots/` break down as 474 `--steel-*` browser captures + 5
leftover `sc184-evidence-*.png` from the ad-hoc camera (see N-8) — the browser capture count
is unchanged from the implementation round, i.e. this delta added no captures.

---

# Per-finding verification

## HIGH-1 (blocking) — **CLOSED**

`test/dom/framework/sidebarChrome.test.ts` (new, 339 lines, 15 tests, 6 describe blocks) plus
4 new tests in `registration.test.ts` and 3 in `anchor.test.ts`. Net +22 tests / +1 suite,
which reconciles exactly with the measured 3395 → 3417 / 189 → 190.

All six prescribed points are covered, and none are vacuous — every one drives the real
`initializeElementFrameworkV2` registry/pipeline and asserts an observable outcome:

1. **`requestSaveLayoutCalls` is now read** — 4 tests, 8 assertions: 1 after the first add,
   2 after the second, 3 after a remove, unchanged across a two-panel `setState` restore,
   unchanged on a dedupe-hit re-pin, unchanged on a double-remove. The dead-scaffolding
   complaint is fully answered.
2. **`collapsed` migration** — asserts the panel mounts, `not.toHaveProperty('collapsed')`,
   **and** an exact `toEqual` on the normalized object (so a future field leak fails too).
3. **Deleted panel-identity coverage restored** — "a re-pin carrying a stray field is still
   the SAME panel" asserts `second === first` and one panel in the DOM. This is a better
   test than the one it replaces: it is written against "an extra field", not against
   `collapsed` specifically, so it survives the field being gone.
4. **Empty-state lifecycle** — onOpen → add → remove-last → re-add → re-remove →
   `setState([])`, asserting the count is exactly 1 or 0 at each step (the "never
   duplicated" property, not just presence) plus the title text.
5. **Degrade cards** — `test.each` over all three cases, asserting
   `data-dse-sidebar-unavailable === 'true'`, the `[aria-label="Remove panel"]` button
   exists, the click removes the panel, **and** the empty state returns.
6. **Header** — label == registry `def.name`, note == basename, `title` == full path, and
   `openLinkTextCalls[0]` deep-equals `{linktext, sourcePath:'', newLeaf:false}` (not merely
   "was called"); plus the torn-down-listener case asserting 0 calls after `removePanel`.
7. **Chrome gating** — a real sidebar-mounted panel has `unpin` and not `pin`; clicking
   unpin on A leaves `remaining[0] === panelB` **by identity**, with B's header text and
   `getState()` both asserted; and a `canPersist:false` reading host yields no `pin`.

Two small quality notes, neither a defect: the "backing block gone" `test.each` row and the
"unknown element" row both point at a `Note.md` containing no fence, which is fine but means
the three rows share one fixture; and the `canPersist:false` case rebuilds a host literal
rather than reusing `chrome.test.ts`'s `makeHost` — deliberate and documented in a comment
("so this one file is a self-contained record").

## MEDIUM-1 (blocking) — **CLOSED**

I opened `docs/Media/sidebar.png`: it now shows **two stacked panels** — "Counter · counter"
and "Surges · surges" — each with its own header, with the separator between them visible.
All three captions now match the image:

- `docs/advanced-usage.md:88` and `docs/writing-blocks.md:101` — "Two blocks pinned to the
  Draw Steel sidebar, each with its own header" ✅
- `docs/running-an-encounter.md:123` — "Blocks pinned to the Draw Steel sidebar, each with
  its own header" ✅ (a third consumer of the shared image that my round-1 review missed;
  the fixer found it — good catch, and the generic wording is the right call for a shared
  asset)

**The pipeline edits are sane.** `docs-manifest.mjs`'s `kind:'sidebar'` grew an optional
`panels: [{note, element}]` array; `obsidian-camera.mjs`'s handler is
`entry.panels ?? [{ note: entry.note ?? noteName, element: entry.element ?? 'initiative' }]`
— strictly backward compatible, and the pre-existing single-panel shape still resolves
identically. `firstElSel` is used for `setPluginTheme` and the capture rect; the comment
correctly justifies it (every panel's `.workspace-leaf` ancestor is the same leaf). I checked
the one thing that could have broken: `noteName` is derived at line 1554 as
`entry.body || entry.canvas ? docsNoteName(entry) : entry.note` — `undefined` for this
`panels`-only entry, but it is referenced in the sidebar branch **only** inside the fallback
that `entry.panels` short-circuits. Safe.

**No collateral.** `git diff --stat` shows exactly one binary docs image changed
(`docs/Media/sidebar.png`) — the targeted `--only=sidebar.png` run did not touch the other
docs images. And my own `npm run obsidian-shots` re-run wrote all 59 ground-truth shots with
zero failures, confirming the shared camera edit did not perturb the other 58 (the
ground-truth sidebar specials go through a different code path, which the diff leaves
untouched).

## MEDIUM-2 (blocking) — **CLOSED, both halves**

Re-ran my original probes against the fixed tree (14/14 green):

- **B5 (was: silent no-op).** `​```ds-counter extra` with prose above and below, pinned via
  `requestPinToSidebar('Note.md','ds-counter', 2)`: **0 Notices**, one mounted panel, and the
  note comes back
  `Intro\n\n```ds-counter extra\ncurrent_value: 1\n_dse_anchor: e064f1\n```\n\nTrailing` —
  content above and below preserved, **the info string preserved by the stamp**, exactly one
  anchor. Closed.
- **B6 (was: zero feedback).** A pin against a note with no matching fence now posts
  `"Draw Steel Elements: couldn't find that block in Note.md."` and mounts nothing. Closed.
  A pin against a **nonexistent note** notices identically (the other `false` branch).

**The reconciliation is correct and does not regress the older path.** `fenceAlias(rest)` =
first whitespace-delimited token; I probed it as identity for a plain alias and for the empty
rest, and correct across a tab separator. Critically, the two properties the round-1
`anchor.ts` scanner was built to guarantee still hold under the change:

- **R2** — a bare close fence is still a close; two plain `ds-counter` blocks still resolve
  as two.
- **R3** — a nested `​```md` example fence **inside** an open region is still opaque body
  content, not a spurious re-open: `listFences` returns exactly one fence,
  `{lineStart:0, lineEnd:4}`. The finding-#4 CRITICAL bracket-matching property survives
  (the change is confined to `open.alias`; `isFenceClose` still tests the raw untrimmed rest).
- **R4** — the older `send-block-to-sidebar` command on a **plain** fence behaves exactly as
  before: 0 Notices, one panel.
- **R5 — SC-153 dedupe holds.** Re-pinning the same block: one panel, note byte-identical to
  the first pin's result, exactly one `_dse_anchor`, **0 Notices** (no spurious ambiguity
  notice).
- **R6** — two same-kind blocks: pinning the second still stamps only the second, lines 0–2
  byte-identical, 0 Notices.
- **R7** — `ds-scc` (strictBody) still byte-identical after a pin.

`encounter/view.ts`'s `SidebarHandoff` type follow is a pure type-level change; `tsc` is
clean and `handleOpenInSidebar` still just awaits the call for its `catch`.

## MEDIUM-3 — **CLOSED**

I opened the regenerated `sc184-evidence-note-not-found.png`: the ✕ now sits as a distinct
button at the **card's top-right**, and the title ("Draw Steel: panel unavailable") wraps to
two lines **without** running underneath it. The 24px→64px widening the fixer describes was
evidently necessary and is now correct. Scoping is right: both rules are behind
`.dse-sidebar__panel`, so the broadly-used, harness-reachable `.dse-error-card` gains no new
positioning — and freeze re-verified 210/210 confirms it.

## MEDIUM-4 — **CLOSED**

`sc184-chrome-panel-before.png` vs `-after.png`: before = pencil + collapse chevron; after =
pencil + **pin** + collapse chevron. One button wider, same panel geometry, no other visible
change. Exactly the evidence the finding asked for.

## LOW-1 — **partially closed** (see N-1)

Verified closed for the two sites I prescribed: `mount()`'s success path leaves no stale
attribute (probe Y1), and the full-remount branch of `handleExternalChange` clears it. The
third path is not covered — new finding N-1 below.

## LOW-2 — **CLOSED** (with a measured side effect, N-3)

`padding-right: 88px` on `.dse-sidebar__panel-header`, documented as a deliberate
non-computed estimate. The overlap is gone.

## LOW-3 — **CLOSED**

`removePanel` now early-returns after `removeChild` when `index < 0`, so a double-remove
fires no second `requestSaveLayout`/`updateEmptyState`. Covered by a real test.

## LOW-4 / LOW-5 — **CLOSED**

`docs/writing-blocks.md`: "hover the block (any element that shows a **⋯** menu)".
`visual-harness/README.md` gains a "Pieces" entry naming both `settings-evidence.mjs` and
`sc184-evidence.mjs` as intentional hand-run evidence cameras wired into no gate.

## INFO-1 rider — **CLOSED** (with one wording nit, N-2)

All four comments reworded, prose-only, no behavior change. The canvas-quarantine wording
**survives in all four** (`BlockHost.ts` "canvas … Only the canvas quarantine
(`sourcePath === ''`)"; `stamina-bar/view.ts` "unresolvable canvas nodes";
`statblock/view.ts` "a canvas card"; `ReadingModeBlockHost.ts` "canvas / hover / print").
None now claims embeds are read-only. Nothing newly false except the nit in N-2.

## Scope — clean

The delta touches only files implicated by the findings plus the one declared docs tangent
(`running-an-encounter.md`). Nothing touches panel reordering (**SC-281**), vault
rename/delete listeners (**SC-282** — no new vault event registration anywhere in the diff),
session-key unification (**SC-283** — `blockKey` changes are comment-only), or tabs.

---

# New observations from the delta (none blocking)

## N-1 — MEDIUM — LOW-1's fix misses the third path: a degraded panel taking the in-place fast path never recovers

**Pre-existing, not a regression from this delta**, and outside my round-1 prescription
(which named exactly the two sites the fixer patched) — but it is the scenario LOW-1's own
wording described ("even after it recovers"), so the fix reads as complete when it isn't.

**Where:** `src/framework/sidebar/SidebarPanel.ts` — `handleExternalChange`'s fast path
(`if (previous instanceof ElementView) { … await previous.update(model); return; }`) returns
before both the `bodyEl.empty()` + pipeline remount **and** the new `removeAttribute` call.
`handleAnchorLost` calls `removeChild(previous)` but never clears
`host.lastMountedChild`, so the stale view still satisfies `instanceof ElementView`.

**Verified, under production-shaped services** (`refs`/`validation`/`prefs` all threaded in
exactly as `main.ts` does — probe printed `fast-path armed? true true true`):

```
lastMountedChild before degrade: CounterElementView
after degrade      — attr: true | card: true | lastMountedChild: CounterElementView
after external chg — attr: true | card still there: true | counter mounted: false
```

**Failure scenario.** A pinned block is deleted (or its anchor lost) → the panel degrades to
"Backing block not found". The user undoes the deletion, or re-adds the block. The vault
`modify` fires, `handleExternalChange` runs with a perfectly valid body, takes the fast path,
calls `update()` on a detached, unloaded view, and returns. The degrade card stays on screen
forever and the element never re-mounts — the panel is permanently dead despite the block
being right there. (The round-1 tree behaved the same way; nothing regressed.)

**Fix (one line, either form):** null the handle in `handleAnchorLost`
(`this.host.lastMountedChild = null`, if the field allows it), or gate the fast path on
`!this.panelEl?.hasAttribute('data-dse-sidebar-unavailable')` so a degraded panel always
takes the full remount branch that already clears the attribute and rebuilds `bodyEl`.

**Recommendation:** a Backlog ticket, not a fix round on SC-184 — it predates this effort and
is not one of the seven approved items.

## N-2 — LOW — `BlockHost.ts`'s new "Only the canvas quarantine … is real" reads as denying the print/export and hover cases the same comment lists

**Where:** `src/framework/host/BlockHost.ts:45-56`. The comment opens
"(false: print/export, hover popovers, canvas, or any other non-addressable context)" and
closes, three sentences later, "Only the canvas quarantine (`sourcePath === ''`,
ReadingModeBlockHost's `canPersist` getter) is real."

**Failure scenario.** A reader arriving cold takes the closing sentence at face value and
concludes an export render or a hover popover *can* persist — which contradicts both the
list at the top of the same comment and `statblock/view.ts`'s freshly reworded comment
("any other host that can't persist, e.g. an export render"). This is a comment whose entire
purpose is to stop a false claim propagating, so ambiguity here is worth a clause.

**Fix:** "Only the canvas quarantine is an *explicitly coded* exclusion; the rest fall out of
`getSectionInfo()` returning null."

## N-3 — LOW — the 88px header reserve costs visible note-name characters at real sidebar width

**Where:** `styles-source.css` `.dse-sidebar__panel-header { padding-right: 88px }`.

The reserve is unconditional, but the chrome panel it clears is hover-only. Visible in the
regenerated `sc184-evidence-note-not-found.png`: the header note now reads
`does-not-...` where the round-1 shot showed the full `does-not-exist`. Not a defect — the
`title` attribute still carries the full path, `.dse-sidebar__panel-note` was always
ellipsizing, and 88px is honestly sized for the worst case (edit + unpin + collapse = 3
buttons, all reachable on a sidebar panel with `authoringControls` on). Recording the
tradeoff so nobody rediscovers it as a bug: **a permanent ~88px dead zone in every panel
header buys removal of a transient hover-only overlap.** A hover-only reserve would be worse
(layout shift on hover). Leave as is unless Scott dislikes the truncation.

## N-4 — LOW — `running-an-encounter.md`'s prose no longer matches the image it embeds

**Where:** `docs/running-an-encounter.md:114-123`. The fixer correctly generalised the
caption, but the surrounding paragraph is specifically about the **initiative tracker**
("Put your cursor in the tracker block and **Send block to sidebar** … It moves to a panel on
the right"), and the shared image now shows a Counter and a Surges panel — no tracker at all.
Separately, that page still documents **only** the old cursor-driven command, while every
other page now leads with the ⋯ **Pin to sidebar** path.

**Fix (either):** give that page its own single-panel initiative-tracker sidebar entry in
`docs-manifest.mjs` (the new `panels` array makes this a two-line entry), or reword the
paragraph to match the generic image and mention the ⋯ path first, as the other three docs do.

## N-5 — LOW — residual silent path in MEDIUM-2a: a stamped note with no leaf to open

**Where:** `src/framework/sidebar/registration.ts` — `sendToSidebar` returns `true` after
`view?.addPanel(...)`, where `view` is `null` when `openSidebarView` cannot get a right leaf.

Verified (probe X1): with `getRightLeaf` returning null, `sendToSidebar` resolves **`true`**,
the note **is** stamped with a fresh `_dse_anchor`, no panel exists, and
`requestPinToSidebar` posts **no Notice**. Vastly narrower than the pre-fix behavior (which
was every not-found case) and hard to hit on desktop, but "bound" now means "the block was
found and anchored", not "a panel exists". **Fix if wanted:** return
`view !== null` rather than a bare `true`, or notice separately when the leaf could not open.

## N-6 — INFO — info-string fences lose their info string on write-back; **verified pre-existing**, not caused by the reconciliation

I probed this rather than assume it. Writing to a `​```ds-counter extra` block rewrites the
fence line to `​```ds-counter` — dropping ` extra` — from **both**
`SidebarBlockHost.replaceSource` and `ReadingModeBlockHost.replaceSource` (both re-emit
`${fence}${language}` from an `OPEN_FENCE = /^([`~]{3,})(\S*)/` first-token parse). The
reading-mode probe confirms it happens today with no sidebar involved, so this is a
long-standing CB-5-adjacent gap, **not** something the alias reconciliation introduced. What
the delta changes is only that such a block is now also reachable from the sidebar. Worth a
Backlog note at most; the fix (preserve the full info string in both `replaceSource`
re-emits) is unrelated to SC-184.

## N-7 — INFO — one overlong line in `docs/writing-blocks.md`

Line 95 is now ~115 characters where the rest of the file wraps at ~90 (an artifact of the
LOW-4 insertion). Renders identically; cosmetic only.

## N-8 — INFO — 5 stale `sc184-evidence-*.png` sit in `visual-harness/shots/`

Left over from the ad-hoc camera. The directory is gitignored, the names appear nowhere in
`freeze-baseline.sha256`, and `sha256sum -c` only validates listed names, so they are
invisible to every gate (confirmed: freeze 210/210, and the browser capture count is
unchanged at 474). Delete them if you want the dir clean; nothing depends on them.

---

# Verdict

**LAND-READY.** No blocking findings.

- Round-1 blocking findings **HIGH-1, MEDIUM-1, MEDIUM-2**: all closed, verified by re-probe
  and by eye.
- Round-1 recommended findings **MEDIUM-3, MEDIUM-4, LOW-2, LOW-3, LOW-4, LOW-5** and the
  **INFO-1 rider**: all closed. **LOW-1** closed for the two paths I prescribed; the third is
  N-1.
- All seven gates reproduce the fixer's claimed numbers exactly; zero frozen bytes moved;
  no scope creep into SC-281/282/283/tabs.

**Suggested Backlog follow-ups (ticket-owner's call, none gate this landing):** N-1 (degraded
panel never recovers via the in-place fast path — the one with a real user-visible failure),
N-6 (info-string fences lose their info string on write-back, both hosts), N-4 (encounter doc
prose vs. its image), N-2 (one comment clause).
