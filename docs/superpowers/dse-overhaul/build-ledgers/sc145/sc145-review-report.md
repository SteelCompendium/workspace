# SC-145 — Independent review report

Worktree: `/home/scott/code/steelCompendium/worktrees/sc145-edit-button/draw-steel-elements`
(branch `sc145-edit-button`, commit `21d51b7`, base `e141582`)

## Verdict: **LAND**

The claim matches the diff, the diff matches the tests, and the tests match reality — verified
independently with a full-registry sweep and a can-fail run against the pre-fix base, not just
the report's 3 samples.

## Battery (reproduced, all match the report)

| Gate | Result |
|---|---|
| tsc | clean, exit 0 |
| lint | clean, exit 0 |
| jest | `1 skipped, 160 passed, 160 of 161 total` suites / `1 skipped, 2546 passed, 2547 total` tests / 3 snapshots — the 3 pre-existing skips (`migrationCensus`, `compendiumMigration`, `token-coverage`) are unrelated to this change |
| shots | 334 total (314 baseline + 20 new `*-edit-btn--*`), all `ok`, exit 0 |
| freeze | `freeze OK (188/188 legacy+print PNGs byte-identical)` |
| parity | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 (composition unchanged — this branch touches no CSS/parity-sampled selector) |

Diff scope verified against the report line-for-line: exactly 9 files
(`CHANGELOG.md`, `horizontal-rule/definition.ts`, `shared/CardLayout.ts`,
`shared/RefUnwrapView.ts`, `statblock/view.ts`, `framework/pipeline.ts`, `framework/view.ts`,
`test/dom/framework/authoringAnchor.test.ts`, `visual-harness/entry.ts`). Worktree clean before
and after review (no collateral left behind; my own temp probe files were deleted before
finishing).

## Placement sweep (independent, full registry — not the report's 3 samples)

Built a standalone jest sweep (temp file, deleted after use) that mounts every one of the 32
registered elements through the real `ElementPipeline` with `authoringControls` on, and asserts
DOM placement against the actual "card ground" CSS rule (`styles-source.css` ~:4068), not
against the implementation's own `authoringAnchor()` output (an independent oracle, not a
tautology).

| Bucket | Elements | Expected | Result on `21d51b7` | Result on base `e141582` |
|---|---|---|---|---|
| Root-is-card (9) | initiative, encounter, negotiation, montage, project, party, counter, feature, featureblock | pencil = direct child of root | **pass** (9/9) | pass (9/9 — never broken) |
| Nested-card (12) | statblock (`.dse-sb`) + 11 display-family (`.dse-card`: kit, condition, treasure, ancestry, culture, career, class, title, perk, complication, rule) | pencil = descendant of the card node, not a root sibling | **pass** (12/12) | **fail (12/12)** — pencil is a root-level sibling in every case, exactly the reported bug |
| Plain-root (9) | skills, stamina-bar, values-row, characteristics, roll, conditions, heroic-resource, surges, hero-tokens | pencil = direct child of root (no forged card either way) | **pass** (9/9) | pass (9/9) |
| No-button (2) | horizontal-rule, hero | no pencil renders | **pass** (2/2) | horizontal-rule **fails** (no opt-out yet); hero unaffected either way (own opt-out predates this ticket) |

33/33 assertions pass on `21d51b7`; the same test file run against base `e141582` reproduces
17 failures (all 12 nested-card elements + horizontal-rule + the report's own
`authoringAnchor.test.ts` "wide card" case), and 0 false failures on the 9+9 unaffected
families. This independently confirms both halves of the claim: the bug was real and
comprehensive across the full 12-element family (not just the report's kit/complication/
statblock samples), and the fix closes it without touching the already-correct 18.

Also probed `RefUnwrapView` delegation directly: the report's own `authoringAnchor.test.ts`
"wide card" test (a `DisplayCardView` def wrapped in `withReference()`, exercising
`RefUnwrapView.authoringAnchor()`) fails against base `e141582` — confirmed by running that
exact test file against a throwaway worktree pinned to the base commit. This substantiates the
report's claim that the delegation gap was actually caught by a real failing test, not asserted
after the fact.

## Read-only / canvas and print

- **Read-only/canvas:** the pencil is gated on `cx.host.canPersist` (`pipeline.ts`), a condition
  this diff does not touch — only the mount target argument changed
  (`iconButton(root, …)` → `iconButton(view.authoringAnchor(), …)`). Confirmed empirically: a
  `kit` mount with `host.canPersist: false` (readonly) and `authoringControls` on renders zero
  edit buttons, identical to base behavior.
- **Print:** `styles-source.css` has zero diff in this branch (`git diff … -- styles-source.css`
  is empty). The existing rule `[data-dse-print="on"] .dse-btn { display: none; }` (line ~9181)
  still hides every `.dse-btn` including the pencil, regardless of DOM anchor — unaffected by
  construction, not just by inspection.

## Horizontal-rule opt-out

Confirmed `noAuthoringButton: true` added to `horizontal-rule/definition.ts`; shot
`horizontal-rule-edit-btn--steel-dark.png` eyeballed — no pencil, `authoringControls` on.
Matches base-`e141582` can-fail run above (fails without the flag).

## Harness boolean-coercion fix

`mountFromParams`'s new coercion (`visual-harness/entry.ts`):
```ts
const value: unknown = rawValue === 'true' ? true : rawValue === 'false' ? false : rawValue;
```
This can only change behavior for the two literal strings `'true'`/`'false'`. No existing
string-enum pref value (`'text'`, `'grid'`, `'two'`, `'ledger'`, `'flat'`, `'wide'`, `'on'`,
`'onword'`, `'inline'`, `'banded'`, …) equals either literal, so every existing `PREF_SHOTS`
entry passes through byte-identical to before — confirmed both by the code (equality on two
specific literals only) and empirically (the pre-existing 314 shots are unchanged, freeze stays
188/188 with the same file set). No dedicated unit test exercises the coercion directly, but the
4 new `authoringControls` shots are a de facto regression check: the pipeline's gate is a strict
`=== true`, so if coercion silently failed the `*-edit-btn` shots would render pencil-less —
they don't (visually confirmed below). Flagged as a minor gap, not a blocker (see Findings).

## Visual eyeball (steel-dark + a light/steel-light pass)

- `complication-edit-btn--steel-dark.png` / `--legacy-light.png`: pencil bottom-left, clearly
  inside the card/content block, matches Scott's "Chosen One" fix target. Both themes sane.
- `statblock-edit-btn--steel-dark.png` / `--steel-light.png`: pencil bottom-left inside `.dse-sb`'s
  border in both themes.
- `counter-edit-btn--steel-dark.png`: pencil inside the card, unchanged "good" placement.
- `horizontal-rule-edit-btn--steel-dark.png`: no pencil, confirmed.

## Freeze widening (12 lines, verified)

Confirmed via `wc -l`/`grep -c "edit-btn"` that the current shared baseline (188 lines) does not
yet contain any `edit-btn` fixture names (0 matches) — the widening is purely additive, no
existing line collides. Regenerated the 4 new fixtures' frozen-class shots
(`legacy-dark`/`legacy-light`/`steel-print` × `complication-edit-btn`, `counter-edit-btn`,
`statblock-edit-btn`, `horizontal-rule-edit-btn`), sha256'd all 12, and wrote them verbatim (same
`<hash>  <filename>` format as the baseline) to:

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc145/sc145-freeze-widening-12.txt`

Shared `freeze-baseline.sha256` itself is untouched by this branch (still 188 lines, confirmed).

## Findings

**No blocking findings.**

- *(Info, not a defect)* `feature` and `featureblock` are also `withReference()`-wrapped
  (`RefUnwrapView`), not just the 12 the report calls out — but since their card is root itself,
  `RefUnwrapView.authoringAnchor()`'s delegation resolves to the same root either way, so this
  is a distinction without a behavioral difference. Worth knowing if a future element adds a
  nested card AND isn't display-family/statblock-shaped: it would need its own
  `authoringAnchor()` override, same as the two existing overrides.
- *(Low)* The harness boolean-coercion fix (`visual-harness/entry.ts`) has no direct unit test
  asserting a `'true'` query-string value round-trips to the boolean `true` in the pref store —
  coverage is indirect (the 4 new shots rendering a pencil at all is the proof). Harness-only
  code (not shipped plugin code), so low severity; a one-line `mountFromParams` unit test would
  close it cheaply if the orchestrator wants belt-and-suspenders.
- *(Nit)* `RefUnwrapView.authoringAnchor()`'s degrade-ladder fallback (`?? this.rootEl` when
  `mountedChild` is unset) is correctly flagged by the report itself as pre-existing/out-of-scope
  behavior, not a regression — confirmed by reading `pipeline.ts`: the pencil already rendered
  unconditionally after any successful `mount()` before this fix, regardless of card shape.

## Recommendation

**LAND.** All battery numbers reproduce exactly. The placement fix is verified correct across
the full 32-element registry (not just the 3 report samples), independently against the actual
CSS card-ground contract. The can-fail check confirms the bug was real, comprehensive, and that
the `RefUnwrapView` regression test genuinely exercises the delegation path it claims to guard.
No collateral, no shared-baseline mutation. The one artifact the orchestrator needs at landing —
the 12-line freeze widening — is verified and written to
`sc145-freeze-widening-12.txt`.
