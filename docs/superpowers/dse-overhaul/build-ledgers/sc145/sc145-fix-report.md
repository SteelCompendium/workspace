# SC-145 — Correct edit button placement — fix report

Worktree: `/home/scott/code/steelCompendium/worktrees/sc145-edit-button/draw-steel-elements`
(branch `sc145-edit-button`, dse main base `e141582`)
Commit: `21d51b7` — `fix(framework): anchor the authoring pencil to the card frame, not root (SC-145)`

## Root cause

The pipeline's generic reading-mode "Edit \<element\>" pencil (the `authoringControls`
pref, "Show edit button on rendered blocks") was appended unconditionally to the
element's `root` container right after `view.mount()` (`pipeline.ts`). That is correct
only for elements whose visible card frame (border/background) is CSS-painted directly
on `root` itself — the shared "card plate" rule in `styles-source.css` (~:4068) targets
`[data-dse-element='<id>']` directly for counter, initiative, encounter, negotiation,
montage, project, party, feature, and featureblock. For those, `root` **is** the box, so
a button appended as `root`'s own child is naturally inside it, regardless of whatever
nested wrapper div (`.dse-counter`, `.dse-init`, …) the view renders its own content
into.

Twelve elements don't follow that shape: the 11 D6 display-family cards
(`ds-kit`/`ds-condition`/`ds-treasure`/`ds-ancestry`/`ds-culture`/`ds-career`/`ds-class`/
`ds-title`/`ds-perk`/`ds-complication`/`ds-rule`, all driven by `DisplayCardView`) and
`ds-statblock`. Their visible card is a **nested child div** instead —
`.dse-card` for the display family, `.dse-sb` for statblock — while `root` itself carries
no border at all. Appending the pencil as `root`'s child there put it as a sibling
**after** that nested card, which rendered it as a stray line below/outside the visible
box — exactly Scott's "complication" screenshot on the ticket.

A second, easy-to-miss piece completes the story: **every one of those 12 elements is
wrapped in `withReference()`** (`shared/withReference.ts`), so `def.createView()` never
returns `DisplayCardView`/`StatblockElementView` directly — it returns `RefUnwrapView`,
which mounts the real view as an internal child (`this.mountedChild`) against the same
`root`. The pipeline only ever calls the anchor method on the view `def.createView()`
returned, i.e. `RefUnwrapView`. An anchor override placed only on `DisplayCardView`/
`StatblockElementView` is therefore unreachable in production unless `RefUnwrapView`
itself delegates to its mounted child. This was caught by the regression test: a
hand-built `DisplayCardView` def *not* wrapped in `withReference()` passed against a
naive first version of the fix, but the identical def wrapped in `withReference()` (the
way every real element is) failed until `RefUnwrapView.authoringAnchor()` was added.

## The unified placement rule (framework-level, one rule)

New method on the `ElementView` base class (`src/framework/view.ts`):

```ts
/** The DOM node the pipeline's generic reading-mode pencil should be mounted INTO. */
authoringAnchor(): HTMLElement {
    return this.rootEl;
}
```

- **Default** (`rootEl`) — correct, unchanged behavior for every view that renders
  straight onto root: counter, initiative, encounter, negotiation, montage, project,
  party, feature, featureblock, and every other non-carded element.
- **`DisplayCardView`** (`src/elements/shared/CardLayout.ts`) overrides it to return the
  `.dse-card` node it tracks as `this.cardEl` (already tracked for the theme-change
  re-render machinery).
- **`StatblockElementView`** (`src/elements/statblock/view.ts`) gained the same tracked
  `cardEl` field (previously a local-only `const card`) and the matching override,
  returning `.dse-sb`.
- **`RefUnwrapView`** (`src/elements/shared/RefUnwrapView.ts`) overrides it to delegate:
  `this.mountedChild?.authoringAnchor() ?? this.rootEl` — this is the piece that actually
  carries the two overrides above out to the pipeline, since every element that needs
  them is `withReference()`-wrapped.
- `pipeline.ts` changed exactly one call site: `iconButton(root, …)` →
  `iconButton(view.authoringAnchor(), …)`.

No per-element patches — every element's placement now follows from one method with two
overrides plus one delegation, not from special-casing 12 element ids anywhere.

## Buttonless audit (per-element opt-out)

The existing `noAuthoringButton` flag (`ElementDefinition`, already used by `ds-hero` for
a different reason — it mounts its own "Edit definition" affordance) is the sanctioned
opt-out. Audited all 32 registered elements against "is there meaningful YAML a user
would edit":

| Element | Meaningful editable YAML? | Verdict |
|---|---|---|
| `horizontal-rule` | **None** — `parse: () => undefined`, "Static, zero-config: there is nothing to configure" (the element's own file header) | **`noAuthoringButton: true`** (this fix) |
| skills, stamina-bar, negotiation, initiative, feature, featureblock, statblock, counter, values-row, characteristics, roll | Yes (values/text/dice expr the block author wrote) | keep button |
| kit, condition, treasure, ancestry, culture, career, class, title, perk, complication, rule | Yes (name/description/benefit/drawback/reference — even a whole-block reference is a meaningful string to edit) | keep button |
| encounter, montage, project, party | Yes (persisted tracker state) | keep button |
| conditions, resource, surges, tokens | Yes (persisted values) | keep button |
| hero | Yes, but already opts out (own header affordance, unrelated to this ticket) | unchanged |

**Only `horizontal-rule` was flagged buttonless.** Everything else — including every
display-family card and statblock, the elements this ticket is *about* — keeps the
button; the bug was purely placement, not "should this button exist." Scott: please veto
if any of the "keep button" calls above look wrong to you.

## Visual evidence

The `authoringControls` pref had **no harness shot coverage at all** before this fix
(the default sweep always renders with it off). Added four new `PREF_SHOTS` entries in
`visual-harness/entry.ts` (`complication-edit-btn`, `counter-edit-btn`,
`statblock-edit-btn`, `horizontal-rule-edit-btn`, ×5 combos each = 20 new shots). While
wiring these up, found and fixed a latent bug in the harness's own pref-shot plumbing:
query-param prefs always arrive as strings (`parsePrefParam`), and the pipeline's
`authoringControls` gate is a strict `=== true` — every PREF_SHOTS entry before this
ticket varied a string-enum pref, so the bug was invisible until `authoringControls`
(the first *boolean* pref shot) tried to pass the literal string `'true'`, which would
have silently rendered an authoringControls-**off** shot with no error. Fixed by
coercing the two literal boolean spellings in `mountFromParams` before calling
`prefs.set`; every existing string-enum value is untouched.

`complication-edit-btn--steel-dark.png` is a byte-for-byte visual match to Scott's
"Chosen One" screenshot on the ticket, now with the pencil inside the border.
`counter-edit-btn--steel-dark.png` matches his "good" counter screenshot, unchanged.
`statblock-edit-btn--steel-dark.png` shows the pencil inside `.dse-sb`'s bottom border
(the other previously-broken family, not in the ticket's own screenshots but the same
bug — found during the audit). `horizontal-rule-edit-btn--steel-dark.png` confirms no
pencil renders at all with `authoringControls` on.

These 20 new shots are **new filenames**, invisible to the freeze baseline by
construction (`sha256sum -c` only checks names literally listed in
`freeze-baseline.sha256`) — freeze stayed clean at 188/188 both before and after adding
them. **Reporting for the orchestrator to widen at landing**: 12 new frozen-class lines
(`legacy-{dark,light}` + `steel-print`, ×4 fixtures) should be added to
`freeze-baseline.sha256` per the standard widening procedure (dse-verify skill →
"Widening the baseline is additions-only"). The other 8 shots
(`steel-{dark,light}` ×4) are outside the frozen class, same as every other fixture.

## Regression tests

`test/dom/framework/authoringAnchor.test.ts` (new file, 6 tests), through the REAL
`ElementPipeline` against real production views:

1. **Wide card** (a `DisplayCardView` def wrapped in `withReference()`, the
   kit/complication shape): pencil is a DOM descendant of `.dse-card`, not a `root`-level
   sibling — this is the test that caught the `RefUnwrapView` delegation gap.
2. **Narrow card** (`counterElement`, root-is-the-card, the already-correct family):
   pencil stays a direct child of `root` — non-regression guard.
3. **Statblock** (the other previously-broken family, different anchor class): pencil is
   a DOM descendant of `.dse-sb`.
4. **`noAuthoringButton` flag test**: `horizontalRuleElement.noAuthoringButton === true`,
   plus an end-to-end pipeline run confirming no `[aria-label^="Edit "]` button renders.
5. **Setting-off test**: `authoringControls` left at its default (false) — zero
   `[aria-label^="Edit "]` buttons render for either the wide-card def or counter.

## Battery (verbatim)

- **tsc**: clean, exit 0.
- **lint**: clean, exit 0.
- **jest**: `Test Suites: 1 skipped, 160 passed, 160 of 161 total` / `Tests: 1 skipped,
  2546 passed, 2547 total` / `Snapshots: 3 passed, 3 total` (baseline was 2540+1skip/159
  suites; +6 tests, +1 suite — exactly the new `authoringAnchor.test.ts` file, no other
  suite moved).
- **shots**: 314 browser shots (matches baseline) + 20 new `*-edit-btn--*` shots, all
  `ok`, exit 0.
- **freeze**: `freeze OK (188/188 legacy+print PNGs byte-identical)` before and after —
  no frozen shot changed. 12 new frozen-class lines reported above for the orchestrator
  to widen at landing.
- **parity**: `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 —
  composition identical to baseline (this change touches no CSS/parity-sampled selector).

## Concerns / notes for the orchestrator

- 12-line freeze-baseline widening needed at landing (additions-only, see above) — this
  branch does not touch the shared baseline file itself, per the skill's instructions.
- `RefUnwrapView.authoringAnchor()`'s fallback (`this.rootEl` when `mountedChild` is
  unset) covers the degrade-ladder cards (unresolved ref / web card / "found but not
  renderable") — those don't override `authoringAnchor`, so the pencil would land on
  `root` for them if `authoringControls` is on and the ref fails to resolve. That matches
  pre-existing pipeline behavior (the pencil already rendered unconditionally after a
  successful `mount()` regardless of which card the view drew) and is out of scope for
  this ticket — flagging only so it isn't mistaken for something this fix should have
  covered.
