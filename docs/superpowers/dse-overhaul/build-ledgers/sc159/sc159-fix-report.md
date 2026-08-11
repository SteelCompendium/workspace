# SC-159 — compendium search modal rows: fix report

**Status:** complete, unlanded. Branch `sc159-modal-rows`, worktree
`/home/scott/code/steelCompendium/worktrees/sc159-modal-rows`.
**Base:** dse main `ecf7e06` (includes the SC-142 tutorials + docs-shots pipeline).
**Commit:** `ac8ef54` — `fix(authoring): give the compendium search rows a real layout (SC-159)`.
Superproject pointer left unstaged. No landing, no tags, no deploy.

---

## The bug, and where it actually was

A suggestion row read `Goblin Stinkerstatblockmcdm.monsters.v1`.

The obvious hypothesis — that `renderSuggestion` was concatenating strings — was **wrong**.
`src/authoring/CompendiumSearchModal.ts` already emitted name, type and source as three
separate `<span>`s plus a `<code>`. The real cause:

> **`grep -c 'dse-compendium-suggest' styles-source.css` → 0.**
> The class names were written and never styled. Four block-less inline spans laid out as
> one continuous run.

So the fix is mostly CSS, plus a DOM refinement to give the stylesheet something to work
with, plus a test that can actually tell the two apart.

## What changed

### `src/authoring/CompendiumSearchModal.ts`

`renderSuggestion` now builds a two-line row:

- `__head` (flex): `__name` (prominent) + `__meta` container holding the `__type` and
  `__source` chips, pushed right.
- `__code` as a sibling **line** beneath the head, not a trailing inline node.

Empty `type`/`source` are skipped — a hand-authored note can carry a blank one, and an
empty chip renders as a stray 2px pill rather than as nothing.

### `styles-source.css`

A new commented block beside the other modal chrome. Layout: flex head, name at
`font-weight: 600`, meta right-aligned and `flex-wrap`ping under the name on a narrow
modal, chips on the shared chip shape (padding, radius, border **all the way around** —
DESIGN.md rule 7, no colored left-edge spine), code as a muted monospace line.

### `test/dom/authoring/compendiumSearchModal.test.ts`

The pre-existing test asserted `el.textContent` contained each field. **That assertion is
equally true of a correct row and of the run-together bug** — which is exactly how this
shipped past a green suite. Replaced by:

1. **A structural test** — each field owns a node whose `textContent` is *exactly* its own
   field (no neighbour bleeding in); the four nodes are distinct; the chips are inside
   `__meta` and the name is not; the code is a sibling of the head row, not inside it.
2. **A cross-file guard** — every `dse-compendium-suggest*` class the row emits must appear
   as a selector in `styles-source.css`. The whole bug was markup without a stylesheet, and
   a rename on either side silently reinstates it.

**Can-fail proof:** restoring the original `renderSuggestion` body fails both
(`2 failed, 78 passed`). Reverted immediately.

---

## The trap: `--dse-*` tokens do not resolve in this modal

Recorded here and in the CSS comment because it will catch the next person styling
anything outside an element card.

`CompendiumSearchModal extends SuggestModal` **directly**, not the kit's `DseModal`. So the
row is neither inside a `[data-dse-element]` root nor a `.dse-modal`, and nothing stamps
`data-dse-theme` on it (`managedModal.ts`'s `WeakMap` lookup never runs).

The `:root` token block does **not** rescue it. Those tokens are authored as
`--dse-fg-muted: var(--text-muted)`, `--dse-border: var(--background-modifier-border)`,
`--dse-chip-bg: var(--tag-background)` — and Obsidian declares those on **`body`**. At
`:root` (= `<html>`) the references are undefined, so each token computes to the
**guaranteed-invalid value**, and inheriting an invalid value is still invalid.

My first pass used tokens. Measured result (computed styles, built stylesheet, theme class
on `<body>` exactly as Obsidian sets it):

| property | with `--dse-*` tokens | with Obsidian vars |
|---|---|---|
| chip `border-width` | **0px** (declaration invalid → no border) | 1px |
| chip `background-color` | **transparent** | `#262626` dark / `#f6f6f6` light |
| chip `color` | `#dadada` — inherited, **not muted** | `#b3b3b3` dark / `#5c5c5c` light |
| code `font-family` | **sans** — see below | `ui-monospace, …` |

The `font-family` row is the one that mattered: `font-family: var(--dse-font-mono)` was
invalid-at-computed-value, which per spec makes the property compute to `unset` — and for
an inherited property that means **inherit**. So it actively *replaced* the `<code>`
element's UA monospace default with the inherited sans face, i.e. the first pass made the
row **worse than the bug being fixed**. Confirmed in the real Obsidian capture, not just in
the browser probe.

Element cards never hit this because the Steel block re-declares every token under
`:is([data-dse-element], .dse-modal)[data-dse-theme='steel']`, inside `body`'s cascade.

**Resolution:** the rules use Obsidian's own variables (`--text-normal`, `--text-muted`,
`--background-secondary`, `--background-modifier-border`, `--radius-s`, `--font-monospace`).
That is also simply correct for the surface: a native suggester should look like the app's
own search, in whichever color scheme the vault is using.

### Both color schemes checked

Rendered the real markup against the **built** `styles.css` + the harness's vendored
`vars.css`, with the theme class on `<body>` (an earlier probe put it on a `div`, which is
itself the failure mode and produced misleading results — noted so nobody repeats it):

- **dark** — name `#dadada` @600; chips `#262626` ground, `#363636` hairline, `#b3b3b3`
  label; code `#b3b3b3` monospace.
- **light** — name `#222222` @600; chips `#f6f6f6` ground, `#dddddd` hairline, `#5c5c5c`
  label; code `#5c5c5c` monospace.

---

## Battery (verbatim, at `ac8ef54`)

```
npm run tsc     → clean, exit 0
npm run lint    → clean, exit 0
npx jest        → Test Suites: 1 skipped, 164 passed, 164 of 165 total
                  Tests:       1 skipped, 2687 passed, 2688 total
                  Snapshots:   3 passed, 3 total
npm run shots   → 200 PNGs, 0 FAIL, exit 0
check-freeze.sh → freeze OK (66/66 steel-print PNGs byte-identical), exit 0
npm run parity  → **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**, exit 0
npm run docs-shots → 17 docs images written, exit 0 (Xvfb :121)
```

Against the stated `ecf7e06` baselines: tsc/lint clean ✅ · jest 2686+1skip/164 → **2687**
(+1: two structural tests replace one textContent test) ✅ · shots **200** ✅ · freeze
**66/66 unmoved** ✅ · parity **0/0/16** ✅.

**Freeze did not move**, as predicted: these classes live in no `[data-dse-element]` root,
so no print rule and no frozen shot can reach them. Nothing to report under the STOP clause.

### Docs screenshot

`npm run docs-shots` on an **isolated Xvfb display `:121`** (`DSE_DOCS_DISPLAY=:121`;
`:1` never touched, and the script's own `freeDisplay()` picks around occupied numbers
anyway). Of the 17 regenerated images, **exactly one changed** —
`docs/Media/tutorial-compendium-search.png` — and the other 16 came back byte-identical
(`git status` shows only the one). That is a useful determinism signal for that pipeline.

## One incidental finding, fixed in passing

The first CSS draft pinned `font-family: var(--dse-font-label)` on the chips and broke
`test/dom/theme/steelTypography.test.ts` (4 failures). Not a flaky test — a real contract:
SC-112's font-slot gate requires **every** consumer of a widened slot to carry
`:not([data-dse-print="on"])`, and the suite locates "the Label rule" by taking the
**first** rule in the sheet whose body sets that slot. My rule sits earlier in the file than
`.dse-section__title`, so it silently hijacked the guard. The chips now declare no
`font-family` at all and inherit the app's UI font, which removes the violation at the root
rather than working around it. Both the reason and the trap are in the CSS comment.

## Concern

**The `--dse-*` tokens silently evaluate to nothing outside `[data-dse-element]` /
`.dse-modal`, and nothing warns you.** This ticket's first draft shipped four dead
declarations and one actively harmful one, and every gate stayed green — the freeze can't
see modal chrome, parity only maps element surfaces, and jest doesn't compute styles. Any
future plugin chrome outside an element root (a suggester, a native settings row, a status
bar item) will hit exactly this. Worth a short "styling outside an element root" note in the
repo docs, or a lint/test that flags `--dse-*` usage in unscoped rules; either is its own
ticket, and I have not filed one.
