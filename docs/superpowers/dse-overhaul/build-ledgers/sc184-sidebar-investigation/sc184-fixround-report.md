# SC-184 sidebar fix round — response to independent review

**Verdict: FIX ROUND COMPLETE.** All three blocking findings (HIGH-1, MEDIUM-1, MEDIUM-2)
and all five recommended findings (MEDIUM-3, MEDIUM-4, LOW-1 through LOW-5) are addressed.
Full gate battery green. Zero frozen bytes moved.

Branch: `sc184-sidebar-investigation`, dse repo, now at `44158f7` (5 new commits over the
implementation round's `5b1149a`, itself rebased onto `origin/develop` `1619396`).

```
44158f7 docs(comments): correct four stale "embeds are read-only" claims (SC-184 fix round)
825b19e docs(sidebar): two-panel screenshot, honest captions, wording fix (SC-184 fix round)
6009fa4 test(sidebar): behavioral coverage for the SC-184 fix round's seven approved items (HIGH-1)
26f8eb5 fix(sidebar): degrade-card recovery, dismiss placement, idempotent removal (SC-184 fix round)
d0de9d1 fix(sidebar): reconcile fence-alias derivation, surface a not-found pin (SC-184 fix round, MEDIUM-2)
```

Not pushed. `wt-finish`/landing not run (per standing orders) — the submodule pointer bump
is left for the ticket-owner's landing flow.

## Findings addressed

### HIGH-1 — seven approved items with one trivial test → `6009fa4`

New file `test/dom/framework/sidebarChrome.test.ts` (339 lines, 15 tests, 6 describe blocks
matching the review's own checklist):

1. `requestSaveLayoutCalls` — 2/3/0/0/0 across two-adds, a remove, a setState restore, a
   dedupe-hit re-pin, and a double-remove.
2. The legacy `collapsed` migration (mounts, `getState()` carries no `collapsed`) plus the
   restored "panel identity ignores extra fields" case the implementation round deleted with
   no replacement when the field itself was deleted.
3. Empty-state lifecycle: present on `onOpen`, gone/back around add/remove, present after
   `setState({panels:[]})`, never duplicated.
4. All three degrade cards (`test.each`) offer a working `aria-label="Remove panel"` button.
5. Header: label = registry `def.name`, note = basename, `title` = full path, click calls
   `openLinkText` once (and stops firing after `removePanel`).
6. Chrome gating: a real sidebar-mounted panel offers `unpin` never `pin`; clicking unpin on
   panel A removes exactly panel A, leaving panel B (and its header) intact; cross-referenced
   against `chrome.test.ts`'s existing `canPersist:false` → no-`pin` coverage.

All six drive the real framework (`initializeElementFrameworkV2` + the real registry/
pipeline), matching `dseSidebarView.test.ts`'s established harness style — zero product risk,
this is writing down behavior that already held.

### MEDIUM-1 — docs image showed one panel, captioned two → `825b19e`

Extended the docs pipeline rather than hand-editing a screenshot: `docs-manifest.mjs`'s
`kind: 'sidebar'` entry shape grew a `panels: [{note, element}, ...]` array (backward
compatible — the old single `note`/`element` shape is now sugar for a one-panel array), and
`obsidian-camera.mjs`'s handler loops it, pinning each panel via the same
`send-block-to-sidebar` mechanism before the one leaf-wide capture. Regenerated
`docs/Media/sidebar.png` pinning `counter` + `surges` — the same pair the SC-184 ad-hoc
evidence camera (`sc184-evidence-multi-panel.png`) already proved fits on-screen together,
showing the two headers + separator the prose describes. Captured via
`npm run docs-shots -- --only=sidebar.png` (the real pipeline, correct 2x retina scale + 12px
padding — not a copy of the ad-hoc evidence shot).

**Discovered while fixing:** a third doc, `docs/running-an-encounter.md`, shares this same
image under a caption the review never flagged ("The tracker pinned to the sidebar") —
accurate for the old single-initiative-tracker image, now false for the two-panel
counter+surges image. Reworded to the same honest, generic caption the other two docs use
("Blocks pinned to the Draw Steel sidebar, each with its own header").

### MEDIUM-2 — pin failure silent + alias derivations disagree → `d0de9d1`

**(a) Audible failure.** `sendToSidebar` now returns `Promise<boolean>` (bound or not);
`requestPinToSidebar` (the chrome pin item's caller) posts
`"Draw Steel Elements: couldn't find that block in <path>."` when it resolves `false`. Every
other caller (the generic command, the initiative command, the encounter builder's hand-off)
still just awaits/fire-and-forgets the call — unaffected. `encounter/view.ts`'s
`SidebarHandoff` type follows the new return type (pure type-level change, no behavior
change: the one caller already just awaits).

**(b) Alias reconciliation.** Root cause: `ReadingModeBlockHost`'s `OPEN_FENCE` (and the pin
item's `getBlockInfo().language`) derives an alias as the fence's info string's FIRST
whitespace-delimited token; `anchor.ts`'s `iterateFences` (and `registration.ts`'s
`aliasAtLine`, the older command's own scanner) compared against the FULL trimmed rest of the
line instead. Confirmed against the installed Obsidian app bundle that Obsidian's own
`language-<x>` class derivation is first-token-only, so the first-token reading is the
correct one. New exported `fenceAlias()` helper in `anchor.ts` (first token only); both
`iterateFences` and `aliasAtLine` now use it, so every alias derivation in the sidebar
subsystem agrees, closing the reachable case (a fence written
```` ```ds-counter extra ```` ) for both entry points identically.

Tests: `anchor.test.ts` covers `fenceAlias()` directly plus an info-string fence found by its
bare language token; `registration.test.ts` covers `sendToSidebar`'s true/false return, the
audible-Notice case, the exact reviewer-reported info-string-fence reproduction through the
chrome path, and the older command path pinning the same fence identically.

### MEDIUM-3 — dismiss button unlabeled square, overlapping title → `26f8eb5`

Gave the degrade card's dismiss button a `.dse-sidebar__panel-dismiss` hook and placed it at
the card's top-right (`.dse-sidebar__panel .dse-error-card { position: relative; }`). First
pass reserved too little `padding-right` (`var(--size-4-6)`, 24px) and the button — a real
44px touch target — still ran under the title text; widened to a fixed 64px after visually
confirming the overlap in the regenerated evidence shot, then re-verified clean. Scoped
through `.dse-sidebar__panel` so `.dse-error-card` itself (used broadly, including
harness-reachable element error cards) gains no new positioning behavior outside a sidebar
panel.

### MEDIUM-4 — no chrome-panel before/after in the evidence set → this report

Before/after crops of `chrome-hover-statblock--steel-dark.png` (the `authoringControls`-on
fixture, so the panel carries edit+pin+collapse — the widest case), captured from a scratch
worktree at the pre-SC-184 base `1619396` (symlinked `node_modules`, verified identical
`package-lock.json`) vs. this branch's tip. Confirms: before = pencil + collapse only; after
= pencil + **pin** + collapse, one button wider, no other visual change. Saved to:

- `.superpowers/sdd/sc184-sidebar-investigation/sc184-chrome-panel-before.png`
- `.superpowers/sdd/sc184-sidebar-investigation/sc184-chrome-panel-after.png`

No code change — evidence only, per the review's own framing ("not a correctness bug — a
review gap").

### LOW-1 — `data-dse-sidebar-unavailable` never cleared → `26f8eb5`

Cleared in `SidebarPanel.mount()`'s success path and in `handleExternalChange`'s full-remount
branch — the two places a panel can transition from degraded back to live.

### LOW-2 — hover chrome panel overlaps the header → `26f8eb5`

Fixed `padding-right: 88px` reserve on `.dse-sidebar__panel-header` (documented as a
generous, non-computed estimate — the panel's width depends on how many chrome items the
mounted element opted into, which the stylesheet has no selector-time way to know).

### LOW-3 — `removePanel` fires `requestSaveLayout()` on an untracked panel → `26f8eb5`

Guarded behind the same `index >= 0` check that gates the splice; `removeChild` stays
unconditional (already a no-op for an untracked child). Covered by
`sidebarChrome.test.ts`'s "double-remove fires 0 extra saves" test.

### LOW-4 — "hover the block" undocumented ds-hr/ds-roll exception → `825b19e`

`docs/writing-blocks.md`: "hover the block" → "hover the block (any element that shows a ⋯
menu)".

### LOW-5 — `sc184-evidence.mjs` undocumented in harness README → `825b19e`

One line in `visual-harness/README.md`'s "Pieces" list, alongside the existing
`settings-evidence.mjs` precedent, naming both as intentional hand-run evidence cameras (not
dead code, not wired into any gate).

### INFO-1 — embed reconciliation comments left uncorrected → `44158f7`

The four misleading "embeds are read-only" comments the implementation round flagged as a
discovered-but-out-of-scope tangent are now fixed (prose only, zero behavior change):
`src/framework/host/BlockHost.ts:45`, `src/elements/stamina-bar/view.ts:109`,
`src/elements/statblock/view.ts:318`, `src/framework/host/ReadingModeBlockHost.ts:145`.

## Gates — measured on this tree (base `1619396`, tip `44158f7`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean (no diagnostics) |
| `npm run lint` | clean, exit 0 (only the standing `.eslintignore` deprecation warning) |
| `npx jest` (after `rm -f main.js styles.css`) | **3417 passed / 1 skipped / 190 suites (191 total) / 3 snapshots**, exit 0 (net +22 tests / +1 suite over the implementation round's 3395/189 — the new `sidebarChrome.test.ts` file plus the `registration.test.ts`/`anchor.test.ts` additions) |
| `npm run shots` | **0 `--ERROR.png` files, 0 FAIL.** In-run gates: `chrome host-leak OK (18 combos)`, `host-copy pin OK`, `button host-leak OK (111 kinds × 3 states × dark/light = 666)`, `print-twin parity OK (118 capture ids)`, `nested corner-radius OK` |
| `check-freeze.sh` | **`freeze OK (210/210 frozen print PNGs byte-identical)`**, 0 mismatches — the new sidebar CSS (LOW-2/MEDIUM-3) stayed correctly scoped and moved zero frozen bytes |
| `npm run parity` (run last) | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`**, exit 0 |
| `npm run obsidian-shots` | **`all 59 shots written`**, 0 FAIL, incl. the 6 sidebar-leaf specials |

## Evidence

Copied to `.superpowers/sdd/sc184-sidebar-investigation/`:

- `sc184-evidence-note-not-found.png` — **regenerated**: dismiss button now sits cleanly at
  the card's top-right, title text no longer runs underneath it.
- `sc184-chrome-panel-before.png` / `sc184-chrome-panel-after.png` — **new** (MEDIUM-4): the
  reading-mode chrome panel before/after this round, cropped to the panel itself.
- `sc184-evidence-empty-state.png`, `sc184-evidence-multi-panel.png`,
  `sc184-evidence-chrome-pin.png`, `sc184-evidence-chrome-unpin.png` — unchanged from the
  implementation round (byte-verified identical); left in place for continuity.

`docs/Media/sidebar.png` (in-repo, committed) is the other visual artifact: now shows two
stacked panels (Counter + Surges) instead of one.

## Scope

No changes outside the review's findings and the one discovered docs-caption tangent
(`running-an-encounter.md`, a direct consequence of the MEDIUM-1 image swap). Deferred items
(SC-281 reorder, SC-282 vault listeners, SC-283 session-key unification, tabs) untouched.

## Report path

This file: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-fixround-report.md`
