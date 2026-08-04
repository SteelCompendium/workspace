# SC-112 Legacy font-slot gate ledger (Task 5)

Plan: `docs/superpowers/dse-overhaul/plans/2026-08-02-plan-23-sc112-font-settings.md` Task 5.
Brief: `.superpowers/sdd/2026-08-02-plan-23-sc112-font-settings/task-5-brief.md`.
Worktree: `/home/scott/code/steelCompendium/worktrees/font-settings/draw-steel-elements`
(branch `font-settings`, dse base `42086e9`, Task 4's end state). Load-bearing input: Task
3's appendix — the entire `:root` `--dse-font-*` slot set is invalid-at-computed-value-time
(IACVT) everywhere except where the Steel block re-declares a slot on the Steel root itself;
Legacy renders today purely via `font-family`'s inherit fallback, never a resolving token.

**Verdict: SHIP.** Five of the six font-slot consumer rules (Title/Body/Card-body/Label/
Controls) widened from Steel-only to theme-agnostic. Mono untouched (already theme-agnostic
before this task, for an unrelated reason — see "Mono" below).

## Step 1: the current Legacy surface (re-grepped, Task 4 HEAD `42086e9`)

`grep -n "font-family: var(--dse-font-" styles-source.css` found exactly 11 consumer sites,
all Steel-scoped except Mono:

| Slot | Site(s) | Selector shape | Bundled with (non-font-family) |
|---|---|---|---|
| Title | `.dse-head__primary--left` (`:3459`) | `[data-dse-theme='steel']:not(print) X` | `font-weight:700; text-transform:uppercase` |
| Title | card-head chip (`:3729`) | same | `background:none; border:none; font-size; line-height; text-transform; font-variant; letter-spacing; color` |
| Title | `.dse-card__title` (`:3888`) | same | `font-weight:700; text-transform:uppercase; letter-spacing` |
| Title | `.dse-hero__name` (`:4459`) | same | same as above |
| Title | initiative-family `h3-h6` + `.dse-modal__title` (`:4620`) | same (2 selector arms) | same as above |
| Body | bare-root + `.dse-sb`/`.dse-card` (`:3522`) | `[data-dse-theme='steel']:not(print)[data-dse-element]:not(err), ... .dse-sb, ... .dse-card` | `color: var(--dse-fg)` |
| Card-body | `.dse-sb`/`.dse-card` + feature/featureblock root-compound (`:3547`) | 2 arms, one compound-on-root one descendant | `color: var(--dse-fg)` |
| Label | 9-selector list (`:3570`) | `[data-dse-theme='steel']:not(print) :is(9 selectors)` | **nothing else — single-property** |
| Label | `.dse-hero__region-title` (`:4482`) | same | `font-weight; text-transform; letter-spacing; margin; padding; background; border` |
| Controls | 6-selector list (`:3667`) | `[data-dse-theme='steel']:not(print) X` ×6 | **nothing else — single-property** |
| Mono | `.dse-rollcard__breakdown` (`:5179`) | `[data-dse-element] .dse-rollcard__breakdown` — **no theme qualifier at all, ever** | `font-size; color` |

Confirmed via `visual-harness/vars.css:24,26`: Obsidian defines both `--font-text` and
`--font-monospace` on `body`, not `:root`/`<html>` — so `--dse-font-mono` (`:root`-only,
no Steel-block re-declaration, unlike the other five) is IACVT-dead under **both** themes
today, not just Legacy. Its consumer rule was never Steel-gated in the first place — nothing
to widen, and nothing this gate can fix (a separate pre-existing Steel-wiring gap, flagged
below, not fixed here — out of scope for a *Legacy* gate).

Legacy has zero explicit `font-family` for any of the other five slots — confirmed via
`grep -n "font-family\|font:" styles-source.css`: the only non-`--dse-font-*` hits are
`.error-message`/`.dse-error-card-*` (unrelated monospace error chrome) and five kit-base
`font: inherit` rules (`.dse-btn`, `.dse-stepper__input`, `.dse-stepper__value`,
`.dse-collapse__header`, `.dse-tabs__tab`, `button.dse-pr__row`) — these are exactly the
Controls slot's targets and are analyzed below.

## Step 2: the prototype, and why "just drop the qualifier" isn't literally correct

The brief's Step 2 text ("drop `[data-dse-theme='steel']`, keep `:not(print)`") undersold
the real shape: **8 of the 11 sites bundle `font-family` together with a Steel-only VISUAL
property** (weight/uppercase/letter-spacing/color/background/border) that is NOT part of
font *choice* and must stay Steel-only regardless of verdict (widening the WHOLE rule would
put uppercase title case and cooler body ink into Legacy, which is obviously not "default
Obsidian vault fonts" and would trivially break freeze even at defaults). The actual
prototype: **split** `font-family` out of each bundled rule into a new theme-agnostic rule,
leaving the visual-only properties Steel-scoped at their original rule. Only Label's
9-selector list and Controls' 6-selector list were already single-property and widened
in place with no split needed.

Implementation: one consolidated block (`styles-source.css`, after the Controls rule,
~:3678) holds all five widened font-family rules; each original Steel-scoped rule had its
`font-family` line replaced with a one-line pointer comment. Mono untouched.

## Step 3: proving (and disproving, then re-proving) the no-op

**First pass FAILED the freeze**: 22/22 `*--steel-print.png` shots broke (byte-diff
confirmed via `compare`/`cmp` against a HEAD-`42086e9` regen — `title--steel-print.png`
diff attached below). Root cause: `:not([data-dse-print="on"]) X` (descendant form, no
element before the `:not()`) does **not** mean "X's real element root lacks print" — it
means "X has *some* ancestor lacking that attribute," which `<html>`/`<body>`/the harness
mount div trivially satisfy regardless of the actual print-stamped root's state. The
ORIGINAL Steel-scoped rules never hit this because `[data-dse-theme='steel']:not(print)` is
a **compound on the theme root itself** (the exact element the harness stamps
`data-dse-print="on"` on via `entry.ts:243`, `querySelectorAll('[data-dse-element]')`) —
narrow and correct. Dropping `[data-dse-theme='steel']` removed the only thing anchoring the
check to the right node, for every arm written as a space-separated descendant selector.

**Fix**: anchor every such arm to `:is([data-dse-element], .dse-modal):not([data-dse-print="on"])`
— the same root-or-modal union already used for the token *value* blocks
(`token-coverage.test.ts`'s `:is([data-dse-element], .dse-modal)[data-dse-theme="steel"]`
pattern, SC-104/FOLLOWUPS #31) — this is the exact element the harness stamps, whether or
not it also carries `[data-dse-theme]`. Three arms were already compound-on-root (Body's
bare-root arm, Card-body's feature/featureblock arm, Title's initiative-family `h3-h6` arm)
and needed no change. Re-ran the full battery after the fix:

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npx jest` | **2056/144** green (was 2049/144 at Task 4's HEAD; +7 net) |
| `npm run shots` | 169 harness PNGs |
| freeze check | **`freeze OK (101/101 legacy+print PNGs byte-identical)`** |
| `npm run parity` | **0 gap(s), 10 warning(s)**, exit 0 — identical WARN set to baseline (4× featureblock margin, 6× section-head/pr-head, FOLLOWUPS #39/#40) |

**Exclusion list for this SHIP: exactly one class of fix (the print-anchor), applied to
every descendant-form arm (15 of 18 selector arms across the 5 widened slots — Title 5/6,
Body 2/3, Card-body 1/2, Label 1/1, Controls 6/6; the remaining 3 were already
compound-on-the-root and needed no change), discovered
in one freeze run and not requiring iteration.** This is what makes it CONTAINED per
Scott's bar ("easy add-in") rather than sprawling: one root cause, one fix pattern, applied
uniformly, verified once, held. No further exclusions were needed after the anchor fix —
freeze passed clean on the very next run.

**Other risk categories from the brief, checked and cleared:**
- *Nested contexts*: Card-body's feature/featureblock root-compound arm (Task 4) already
  proved nested `ds-feature`-in-`ds-kit` roots carry `data-dse-theme`/`data-dse-print` on
  themselves, not just the outer root — the same print stamp (`querySelectorAll` finds
  every `[data-dse-element]`, nested or not) applies uniformly, so no extra nested-case
  exclusion was needed.
- *Mono/code spans*: Mono's own consumer rule (`.dse-rollcard__breakdown`) was never
  Steel-gated and is untouched by this task; no interaction with the widened rules (they
  target disjoint class names).
- *Legacy-side rule that already sets its own font-family and would lose to the widened
  rule*: none exist for any of the five slots' target selectors (full-file grep, Step 1) —
  the only pre-existing Legacy font-family declarations anywhere are unrelated
  (`.error-message`, `.dse-error-card-*`). The five Controls kit-base `font: inherit` rules
  are the closest case; the widened Controls rule out-specificities them
  (`(0,2,0)` vs `(0,1,0)`) but resolves to `inherit` at defaults regardless (token stays
  IACVT-dead under Legacy — no Legacy-scoped re-declaration was added), so the visible
  result is identical either way — verified by freeze (these are all Legacy/unfrozen-Steel
  shots, and freeze covers the Legacy half).
- *Popout windows / per-root stamping*: not specific to this change — CSS custom
  properties and the harness's per-root attribute stamping are per-document already;
  nothing in the widened rules references cross-document state.

## Live-probe evidence: the no-op AND the payoff, both confirmed at the token/computed-style level

Playwright probe (`feature` fixture, throwaway, deleted after use — not committed) via
`getComputedStyle` on `.dse-head__primary--left`:

| Theme | Override | `--dse-font-title` (computed) | `.dse-head__primary--left` computed `font-family` |
|---|---|---|---|
| Legacy | none | `''` (still IACVT-dead) | Obsidian's `--font-text` stack (ambient sans) — **unchanged from before this task** |
| Legacy | inline `--dse-font-title: "Courier New", monospace` on the element root (Task 2's `reflect()` mechanism) | `"Courier New", monospace` | `"Courier New", monospace` — **the override took effect under Legacy** |
| Steel | none | full serif stack | serif — unchanged |
| Steel | same override | `"Courier New", monospace` | `"Courier New", monospace` — unchanged behavior |

This is the mechanism-level proof of both halves of the claim: (1) the widened rules are a
genuine no-op at default prefs under Legacy (row 1 unchanged), and (2) the whole reason to
ship this — once Task 6's `reflect()` writes a real per-root inline override, Legacy
actually responds (row 2), which it would NOT have before this task (the old Steel-scoped
rule simply never matched a Legacy-themed root at all).

## Step 4: the gate

**SHIP.** Freeze holds 101/101 with the widened rules live; the one real issue Step 3
surfaced (the print-anchor footgun) was a single root cause with a single, mechanical fix
applied uniformly across every affected arm — not a sprawl, not an open-ended exclusion
list. Guard tests extended in `test/dom/theme/steelTypography.test.ts`:
- Existing "body type identity" tests (`routes the ... font ... to var(--dse-font-body|
  card-body)`) updated to look up the now-theme-agnostic rule (new `blocksFor` helper,
  no `STEEL_SCOPE` filter) instead of `steelBlocksFor`.
- The Task 4 "slot independence" describe block's `cardBodyRule`/`labelRule` lookups
  dropped their `STEEL_SCOPE` requirement (the rules moved); shape assertions (root-compound
  arm, descendant coverage, selectors pinned) are otherwise unchanged.
- New describe block "Legacy font-slot gate (SC-112 Task 5 — SHIP)": asserts all five
  widened slots' font-family consumer(s) carry no `[data-dse-theme]` qualifier, stay
  print-excluded, that the Steel-only visual properties (title weight/uppercase, body/
  card-body ink) remain in their original Steel-scoped rule and no longer declare
  `font-family` themselves (the regression this gate exists to catch — a future edit that
  re-adds `font-family` to the Steel-scoped rule would silently re-narrow Legacy support
  without any other test catching it), and that Mono's rule is untouched (still no
  `[data-dse-theme]` qualifier, same as before this task).
- **Can-fail evidence for the new contract**: reverting the Title-display test's target
  lookup to the naive `r.selector.includes(...)` form (dropping the `font-weight` filter)
  reproduces the exact false-positive this ledger's Step 3 fix avoided (matches the
  text-shadow sibling rule instead) — confirms the test's specificity is load-bearing, not
  decorative. (Verified interactively during authoring; not left in the diff.)

## Mono — flagged, not fixed

`--dse-font-mono` has no Steel-block re-declaration (unlike the other five slots), so it
stays IACVT-dead under **both** themes, not just Legacy — a pre-existing Steel-rendering
gap unrelated to this gate's question (Legacy already matches Steel here: both silently
inherit). Recorded for FOLLOWUPS by the orchestrator; not fixed in this task (out of scope
— this gate answers "does Legacy diverge from Steel," and for Mono it currently does not).

## What SKIP would have cost (for the record, since SHIP was chosen)

Had the print-anchor bug NOT converged in one fix (i.e., had freeze kept breaking after the
anchor fix, or had the anchor fix needed per-arm special-casing instead of one uniform
pattern), SKIP would have meant: revert to Task 4's end state (zero CSS diff), pickers stay
Steel-only for non-default choices, and Task 6/8's help text states Legacy always uses the
vault fonts regardless of picker selection. That path was not needed — the one root cause
converged cleanly on the first re-test.

## Files touched

- `/home/scott/code/steelCompendium/worktrees/font-settings/draw-steel-elements/styles-source.css`
- `/home/scott/code/steelCompendium/worktrees/font-settings/draw-steel-elements/test/dom/theme/steelTypography.test.ts`

## Commit

Submodule (draw-steel-elements): see task report for sha. Workspace repo: this ledger,
committed on branch `font-settings`.
