# Follow-ups archived 2026-08-11

## (was #49) Legacy theme has no markdown-table styling at all, including the new scroll frame
**Status:** open
- **Identified:** 2026-08-04, SC-121 Batch 4 (batch-3 review L-5 fix) — dse `d94e025`
- **What:** Batch 3's C-6 table baseline and Batch 4's `.dse-md-table` scroll frame are both
  Steel-only + print-excluded, so under the Legacy theme (and in print/PDF export) a book
  pipe-table is still unstyled AND still overflows its card at narrow width — measured
  380px of table in a 300px leaf.
- **Why:** Legacy is still a shipping theme and the compendium's mini-statblocks are common.
  The overflow half of this is arguably a bug rather than a styling choice.
- **Context:** `styles-source.css` §7, `table:not([class])` + `.dse-md-table` rules. The
  wrapper ELEMENT is emitted in every theme (`src/framework/mdTableWrap.ts` runs from
  `ElementView.renderMarkdown`), so a Legacy fix is CSS-only — but any Legacy-scoped rule
  changes the frozen `*--legacy-*` bytes and needs a sanctioned rebaseline (see the
  `dse-verify` skill's freeze section). `perk-narrow--legacy-dark.png` is now a pinned
  fixture showing exactly this state.
- **Effort:** S (1–4 h)

> Closed by SC-144 (2026-08-11): the legacy theme was removed, so the unstyled-table
> surface no longer exists. Steel's own table styling (SC-121) is now the only rendering.
> Print/PDF export still shows the unstyled table — that half of the finding lives on in
> the SC-121 changelog entry, not here.


## (was #73) The `color-mix()` support-floor fallback idiom is inert wherever the enhanced declaration contains `var()` (SC-160, 2026-08-17)

**Identified:** SC-160 (statblock sticky mini-header), running the branch in a real Obsidian
on a scratch Xvfb display.

**What:** `styles-source.css`'s SUPPORT FLOOR doctrine (the note above `.dse-pr__row`,
~line 6123) says a `color-mix()` declaration is "invalid at parse time" on the Chromium 106
floor, so the static declaration authored immediately above it survives. That is true only
when the enhanced declaration contains **no `var()`**. A declaration containing `var()`
parses fine and fails later, at **computed-value time**, which happens *after* the cascade
has already discarded the static declaration beneath it — the property is then set to its
`unset` value, not to the fallback. **All 15 `color-mix()` declarations in the sheet contain
`var()`**, so on the floor engine every one of them yields `unset`, not the intended static
twin. `test/unit/build/cssSupportFloor.test.ts` cannot see this: it is a source-text
adjacency scan and the adjacency *is* authored.

**Why:** silent, and invisible to every gate — the visual harness runs a modern Chromium
where `color-mix()` resolves, so the static line is inert there too and the shots look right.
It only shows up in the app. SC-160 hit the worst instance of it (a `background` shorthand on
the sticky bar → fully transparent, pinned stats illegible over the scrolling card body);
the remaining instances are `background-image` washes on `.dse-pr__row` and friends, where
the failure is a missing tier wash rather than an unreadable surface — cosmetic, but real.

**Context (measured, not reasoned):** real Obsidian here is Chromium 106.0.5249.199 /
Electron 21.4.1 — the Obsidian *asar* self-updates, the Electron shell does not, which is
exactly why the floor is 106. Probed in-app:
`background: #1a1e21; background: linear-gradient(…color-mix(…)…)` with **literal** colours
keeps `rgb(26, 30, 33)`; the same pair with `var()` computes to `rgba(0, 0, 0, 0)` /
`background-image: none`. The shipped `.dse-pr__row` pair likewise computes to
`background-image: none`.

**Fix shape:** wrap the enhanced declarations in
`@supports (background: color-mix(in srgb, red 14%, blue))` — a floor engine never enters
the block, so the static declaration stands. SC-160 does this for the sticky bar (keeping the
pair *inside* the block so the existing adjacency guard still passes) and leaves the other
instances alone. Sweep the remaining 13 the same way, correct the doctrine note's
"invalid at parse time" claim, and teach `cssSupportFloor.test.ts` to require the
`@supports` gate whenever the enhanced declaration contains `var()`.

**Effort:** small-medium (mechanical sweep + one guard change + a re-shoot).

**Correction (SC-160 adversarial review, measured on the floor engine):** the count is **10**
declarations (8 pre-existing ungated + 2 new on the SC-160 branch, already gated there), not
15 — and the residue is not merely cosmetic: `.dse-sb > .dse-head` (the statblock header)
loses `background-image`, `background-color` AND `border-bottom` entirely.

Tracked as **SC-171** (7.0.0) — the sweep + a gate that can see it.

**Closed:** SC-171 landed to develop `8b6064d` (2026-08-17) — all 8 ungated declarations gated, guard hardened.
