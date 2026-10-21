# SC-366 stripe-removal review, round 1 (dse e025dd2 + superproject 82382a2)

## Executive summary
- **Verdict: APPROVE.** Findings: 0 HIGH, 0 MED, 1 LOW (optional), 3 INFO.
- **Scope:** dse `772c3cd..e025dd2` touches only `styles-source.css` (−1 declaration, comment rewrite) and `test/dom/theme/notInstalledLinkColour.test.ts` (+2 tests). The superproject commit `82382a2` touches only CHANGELOG.md.
- **Check 1, borders.** I ran 96 probe combos: 2 Obsidian sheets × dark/light × screen/print × 3 ancestor shapes × 2 cards × before/after, each card built with RefUnwrapView's own calls.
  - In every AFTER combo all four sides are identical: dark `1px solid rgb(51,51,51)`, light and print `1px solid rgb(228,228,228)`.
  - `box-shadow` is none, and `::before`/`::after` are none.
  - BEFORE, the left side was `3px solid rgb(2,122,255)` in dark and `3px solid rgb(8,109,221)` in light.
  - No host rule in either Obsidian sheet sets a border, shadow, outline or background-image on either card. The only matching rule is the plugin's own `.dse-ref-notice`.
  - The SC-366 link is unchanged and equals the `.dse-card a` family colour: rgb(77,184,199) in dark, rgb(42,123,136) in light. Both are teal-cyan.
- **Check 2, layout.** The text inset from the card edge moves from 15px to 13px on the left. It now equals the top inset (13px = 1px border + 12px padding), so the frame is symmetric. The hint lines up with the message. Card padding and background are unchanged.
- **Check 3, tests.** I reproduced the bite in the worktree through jest.
  - Restored `border-left: 3px solid var(--color-blue)`: 1 failed / 4 passed.
  - Restored byte-clean (sha256 `ce47b9b7…` = HEAD), and `git status --porcelain` is empty.
  - The tests miss `box-shadow: inset`, a `::before` bar, a 4-value `border-width`, and a gradient stripe (LOW-1).
- **Check 4, CHANGELOG.** The sentence is appended verbatim to the existing SC-366 bullet and is accurate (INFO-2).
- **Check 5, crops.** The labels carry the difference in words (3px stripe on the LEFT edge vs plain 1px border on all four sides) plus measured values, so they do not rely on colour.
- **Gates.** Per the owner's resume message, the full battery is deferred to the rebase onto develop `8d075db`. Before the scope change I had already run jest (5538 / 1 skipped / 233 of 234, RC 0, load 14) and lifecycle on port 9369 (31/31 ok, 0 failed). I did not run e2e or parity.

## 1. Computed borders, both cards, both real sheets
- **Probe:** `sc366-stripe-review-r1-probe.mjs`, results in `…-probe.json`.
- **How it works:**
  - It runs on the visual-harness page with `sheet=1`, at device scale 2.
  - The sheets are the pinned 1.13.7 `obsidian-app.css` and the 1.14.4 `app.css` extracted from `~/.config/obsidian/obsidian-1.14.4.asar`.
  - The ancestor shapes are a bare root, Reading view (`.markdown-preview-view.markdown-rendered … .block-language-ds-scc`), and Live Preview (`.markdown-source-view.mod-cm6.is-live-preview … .cm-preview-code-block.cm-embed-block.markdown-rendered`).
  - The two cards are built with `webCard`'s and `renderRefNotice`'s exact `createDiv`/`createEl` calls (RefUnwrapView.ts).
  - AFTER is the harness as built at e025dd2.
  - BEFORE re-inserts the single deleted declaration into the `.dse-ref-notice` rule through CSSOM. The probe asserts that the AFTER rule has no `border-left` and that exactly 1 rule was patched. That one declaration is the whole CSS delta.

| state | left | top / right / bottom | box-shadow | text inset L / T |
|---|---|---|---|---|
| BEFORE dark (screen) | 3px solid rgb(2,122,255) | 1px solid rgb(51,51,51) | none | 15 / 13 |
| AFTER dark (screen) | 1px solid rgb(51,51,51) | 1px solid rgb(51,51,51) | none | 13 / 13 |
| BEFORE light, and print in both schemes | 3px solid rgb(8,109,221) | 1px solid rgb(228,228,228) | none | 15 / 13 |
| AFTER light, and print in both schemes | 1px solid rgb(228,228,228) | 1px solid rgb(228,228,228) | none | 13 / 13 |

- **Identical across conditions:** the values are the same for both cards, both sheets and all three ancestor shapes.
- **No host rule re-adds a left accent:** I walked every enabled sheet for rules that match the card element and set `border*`, `box-shadow`, `outline` or `background-image`. Across all 96 combos the only hit is the plugin's own `.dse-ref-notice` (harness.css).
- **Link colour:** in all screen AFTER combos the not-installed link equals the `.dse-card a` family link, rgb(77,184,199) in dark and rgb(42,123,136) in light. Print stays at the host's purple-blue rgb(138,92,245), same as the family link, unchanged from r2.
- **Print loses the stripe too:** the rule is unscoped, so print matches the rest of this table. That is consistent with the ruling, and freeze is unaffected because no fixture renders these cards.

## 2. Padding and layout
- Padding is unchanged: 12px (`--size-4-3`) on all sides.
- Losing the 2 extra stripe pixels moves the content box 2px left. The text now sits 13px from every edge instead of 15px on the left and 13px elsewhere. The frame is now symmetric, which is an improvement.
- The message and the hint share one left edge, before and after.
- Background `--background-secondary` and the radius are unchanged.
- Visual check: `sc366-stripe-review-r1-labelled-{dark,light}.png` (1.14.4 sheet, Reading view, both cards, BEFORE/AFTER rows labelled in words with the measured insets). Nothing looks misaligned.

## 3. The new tests

### Bite, in the worktree, through jest (`sc366-stripe-review-r1-bite.log`)

| mutation | result |
|---|---|
| none | 5 passed (RC 0) |
| restore `border-left: 3px solid var(--color-blue)` | **1 failed**, 4 passed (RC 1) |
| `box-shadow: inset 3px 0 0 var(--color-blue)` | 5 passed (RC 0). The miss is confirmed in real jest, not just in my port. |

After each mutation the file was restored from a scratch copy and `cmp` reported it byte-clean. The final `git status --porcelain` was empty, and sha256 is `ce47b9b777abda42…`, identical to `git show HEAD:styles-source.css`.

### Coverage and brittleness
`sc366-stripe-review-r1-brittle.mjs` / `.log` is a faithful JS port of the two tests, run against mutated copies of the CSS.

| mutation | root-rule test | no-stripe test |
|---|---|---|
| BITE (declaration restored) | pass | **FAIL** |
| `border-left-width` + `border-left-color` | pass | **FAIL** |
| `border-inline-start` | pass | **FAIL** |
| stripe in a scoped rule (`[steel] .dse-ref-notice`) | pass | **FAIL** |
| stripe on `.dse-ref-web-card` only, inside `@media` | pass | **FAIL** |
| `box-shadow: inset 3px 0 0 blue` | pass | pass (missed) |
| `::before` 3px absolute bar | pass | pass (missed) |
| `border-width: 1px 1px 1px 3px` + 4-value `border-color` | pass | pass (missed) |
| `background-image` gradient stripe | pass | pass (missed) |
| stripe on a child (`.dse-ref-notice__msg { border-left }`) | pass | pass (missed, excluded by design) |
| harmless: `border-left: none` | pass | FAIL (over-strict) |
| harmless: declarations reordered | pass | pass |
| harmless: double space, or `solid 1px` order, in the root border | FAIL (over-strict) | pass |
| harmless: root selector `:is(.dse-ref-notice)` | FAIL (over-strict) | pass |
| sibling class `.dse-ref-notice-x` / child `__hint` with a border-left | pass | pass (correctly ignored) |

The tests are **not vacuous**. They pin the exact regression, plus its longhand, logical-property, scoped and `@media` variants. They are mildly over-strict on the formatting of the root rule (`r.sel === '.dse-ref-notice'` exactly, single-space `1px solid`). Every such failure is loud and easy to understand, and the strictness matches the file's other contract tests. No change is needed for that.

## Findings

### LOW-1 (optional): the stripe test misses non-border stripe devices
- **Where:** test/dom/theme/notInstalledLinkColour.test.ts, around :77-80, the `not.toMatch(/border-(left|inline-start)\b/)` loop.
- **Failure scenario:** someone restyles the card with `box-shadow: inset 3px 0 0 <colour>`, a 3px `::before` bar, `border-width: 1px 1px 1px 3px`, or a gradient. The banned spine comes back and the test stays green. No harness fixture exists to catch it visually (SC-469).
- **Why only LOW:**
  - The realistic regression, reverting or copying the old declaration or the `.dse-error-card` grammar, is caught.
  - Each missed device is a deliberate new design act, which DESIGN.md:415-421 rule 7 already bans in review. The test's docblock does not claim more than "left border".
- **Fix, if the owner wants it** (≈5 lines, no new harness):
  - For every rule in `cardRules`, also assert `not.toMatch(/box-shadow:[^;]*\binset\b/)`.
  - Assert `not.toMatch(/border-(width|color|style):\s*\S+\s+\S+\s+\S+\s+\S+/)` (a 4-value form).
  - Assert that no `cardRules` selector contains `::?(before|after)`.
  - Either way, SC-469's fixture is the real guard.

### INFO-1: an illustrative hint in the notice-card crop
The notice-card crops use the hint text "Check the code, or run 'Sync compendium'.". The real `Unknown SCC code` path calls `errorCard(root, msg)` with no hint (RefUnwrapView.ts:185). The implementer labelled it illustrative, and it does not affect the border evidence.

### INFO-2: the CHANGELOG sentence is accurate, with two small nits
- **What is correct:**
  - The commit is `82382a2`, superproject, CHANGELOG.md only, with no trailers. The pointer is left unstaged (` M draw-steel-elements`).
  - The sentence is appended verbatim to the end of the SC-366 bullet's last line, after "Print is unchanged.", with one space.
  - "from this card and from the other compendium-reference notice card; both now have a plain border all round" is true for both cards.
- **Nits, neither blocking:**
  - "Print is unchanged." now sits right before a change that also applies to print, because the stripe is gone on paper too. A reader could read the stripe removal as screen-only. A possible reword: "Print keeps its link colour."
  - The appended line runs ~230 chars, while the bullet's other lines wrap at ~100.

### INFO-3: other comments and the `--color-blue` reference
The SC-149 comment rewrite is accurate. It drops "informational blue accent (matching the 'reference' stage accent above)", and the cite of DESIGN rule 7 / SC-366 is correct.

The remaining `--color-blue` uses are out of scope:
- styles-source.css:464, the `.dse-error-card` "reference" stage accent, which is one of the other stripes named for Scott.
- The token definitions at :15976-15977.

No src/ or test/ code asserted the old stripe.

## 5. Crops
- I looked at all 8 of the implementer's crops: before and after, both cards, dark and light.
- Each has a dashed banner. BEFORE reads "3px blue stripe on the LEFT edge, 1px border on the other three sides" plus `left=3px solid rgb(...)`. AFTER reads "plain 1px border on all four sides, no stripe" plus `left=1px solid rgb(...)`.
- Width and position carry the difference in words, so colour is not needed.
- The stripe is visible in BEFORE and absent in AFTER in both schemes.
- My `sc366-stripe-review-r1-labelled-{dark,light}.png` stack all four rows for one scheme with the insets (15px → 13px) in each label, if a single image is easier to post.

## Gates
Deferred per the owner's resume message: the implementer rebases onto `8d075db` and runs the full battery, then a scoped confirmation follows. Measured before that scope change, at e025dd2:
- jest: `Tests: 1 skipped, 5538 passed, 5539 total`, `233 of 234` suites, RC 0, 1-minute load 14.3.
- lifecycle (port 9369): `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed`, RC 0.

## Tree hygiene
- dse `git status --porcelain` is empty, HEAD is e025dd2, and `styles-source.css` is byte-identical to HEAD.
- The superproject shows ` M draw-steel-elements` (the unstaged pointer, by design).
- No processes containing `worktrees/sc366-stripe-remove/` are running.
- My jest/bite runs removed the plugin-root `main.js` and `styles.css` (gitignored build artifacts that were present at the start), per the dse-verify protocol. Lifecycle then rebuilt both, so both are present again, as they were at the start.
- Gitignored `visual-harness/dist` was rebuilt at e025dd2.

## Scoped confirm on 8d890f9

**Verdict: APPROVE.** dse `sc366-stripe-remove` @ `8d890f9` sits on develop `95981f1`, which is origin/develop at fetch time. Superproject HEAD `76c24a2` sits on origin/main `383ec3f`. Findings: 0 HIGH, 0 MED, 0 LOW, 1 INFO.

1. **The rebase left the approved commit unchanged.** `git range-diff 772c3cd..e025dd2 95981f1..89087cf` prints `1: e025dd2 = 1: 89087cf`, meaning the patch is identical, CSS and test alike.
2. **The new checks in `8d890f9` bite.** That commit is +7 lines in test/dom/theme/notInstalledLinkColour.test.ts:82-87: a new test asserts that no card-root rule has `box-shadow:[^;]*\binset\b` in its body or `::?(before|after)` in its selector. I ran jest on that file in the worktree, restoring byte-clean from a copy of `git show HEAD:styles-source.css` after each mutation:

   | mutation | result |
   |---|---|
   | none | 6 passed |
   | `box-shadow: inset 3px 0 0 var(--color-blue)` on `.dse-ref-notice` | **1 failed**, 5 passed |
   | `.dse-ref-notice::before` 3px absolute bar | **1 failed**, 5 passed |
   | `.dse-ref-web-card::after` 3px bar | **1 failed**, 5 passed |

   After each mutation `cmp` reported RESTORED_BYTE_CLEAN. The final `git status --porcelain` is empty, and the sha256 of `styles-source.css` (`b7d8ee2f…`) equals HEAD's. Log: `sc366-stripe-review-r1-confirm-bite.log`.

   **Not over-broad.** The checks only see `cardRules`, which are the rules whose selector names `.dse-ref-notice` or `.dse-ref-web-card` as a whole class. Pseudo-elements or inset shadows on any other selector cannot trip them, and the whole sheet passes at HEAD.
3. **The superproject change is CHANGELOG-only.**
   - `git diff origin/main..HEAD` touches only `CHANGELOG.md` (+2/−1) through two commits, `284e5e4` and `76c24a2`. The draw-steel-elements pointer stays unstaged (` M`).
   - The SC-366 bullet appears exactly once (line 58). Its tail now reads "…matches every other plugin link (print keeps its link colour). The card's blue left stripe is also gone, from this card and from the other compendium-reference notice card; both now have a plain border all round." The new lines are wrapped to the bullet's width. This closes the r1 INFO-2 nits.
   - The diff has no other hunk, so every other Unreleased bullet from origin/main is intact.
4. **Gates (reviewer-run at 8d890f9, exit codes read through a script file):**
   - jest: `Tests: 1 skipped, 5585 passed, 5586 total`, `234 of 235` suites, RC 0, 1-minute load 9.9.
   - parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, RC 0.

**INFO-4: the pseudo-element check is slightly broader than "the card root".** It also fails on a rule that names the card and then a DESCENDANT's pseudo-element, e.g. `.dse-ref-web-card .external-link::after { … }`. I measured this: 1 failed, restored clean. That would be a harmless styling of the SC-317 glyph scoped to this card. No such rule exists today. The failure is loud, and its title ("card roots") makes the cause clear. No change is needed. If it ever bites, test only the last compound of the selector.

Tree after the run: dse is clean at `8d890f9`, the superproject shows only the unstaged pointer, and no processes containing `worktrees/sc366-stripe-remove/` are running.
