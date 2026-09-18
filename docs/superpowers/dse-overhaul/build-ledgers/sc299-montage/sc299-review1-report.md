# SC-299 review 1 — independent adversarial review report

## Executive summary

- **Verdict: FIX ROUND NEEDED** — 0 HIGH · **2 MED** · 4 LOW · 9 INFO. R-1/R-2/R-3 are
  functionally correct and faithful to the mock; both MEDs are a11y/touch-target defects,
  not behaviour bugs, and both fold into the rebase round the ledger already plans.
- Re-ran the full battery at dse `1762555` / ws `cf5f7da`; every gate reproduces round 1's
  numbers exactly:
  - tsc: clean, exit 0 · lint: clean, exit 0
  - jest: `Test Suites: 1 skipped, 201 passed, 201 of 202 total` / `Tests: 1 skipped, 3844 passed, 3845 total`
  - shots: `host-copy pin OK (…the host model is verbatim Obsidian 1.14.2…)` · `button host-leak OK (114 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 684 comparisons…)`
  - freeze: `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` — **all 16 montage print lines unmoved, R-3 holds**
  - parity: `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, exit 0
- 12/12 runtime probes PASS (no double-log, exactly one vault write per tap, exact
  `{hero, round, result}` keys, `skills_used` untouched, note bytes intact, no cross-talk).
- Working tree left pristine (`git status --porcelain` empty in both submodule and
  superproject, before and after); the `sc299-probe` file was deleted.

---

## Findings

### MED-1 — the quick trio defeats the plugin's coarse-pointer touch-target escalation

**`styles-source.css:3815-3827`** (`.dse-mt__quick { width/height/min-width/min-height: 1.45em }`)

The kit declares the touch contract at `styles-source.css:10702-10713`:

```css
[data-dse-theme='steel']:not([data-dse-print="on"]) { --dse-control-min: 1.75em; }
@media (pointer: coarse) {
  [data-dse-theme='steel']:not([data-dse-print="on"]) { --dse-control-min: var(--dse-touch-min); }  /* 44px */
}
[data-dse-theme='steel']:not([data-dse-print="on"]) :where(.dse-btn) {
  min-width: var(--dse-control-min, var(--dse-touch-min));
  min-height: var(--dse-control-min, var(--dse-touch-min));
}
```

`:where(.dse-btn)` makes that rule `(0,2,0)`. The SC-299 rule compiles (verified in the
built sheet, `visual-harness/dist/harness.css:2363`) under the ancestor
`[data-dse-element="montage"] .dse-mt`, i.e. `(0,3,0)`, and sets `min-width`/`min-height`
**explicitly** — so it wins in *both* media, and the coarse-pointer escalation never
reaches the trio.

Measured from the real capture (`montage-mid--steel-dark.png`, row scan at y=611,
deviceScaleFactor 2): each button's border box is **40 device px = 20 CSS px**, with **6
device px = 3 CSS px** gaps — centre-to-centre **23 CSS px**.

Failure scenario: Obsidian mobile/tablet — the `pointer: coarse` surface, and precisely
the "one tap records the common case whole" use case R-1 exists for — renders three 20×20
CSS px targets 3 px apart, each one adjacent to a differently-signed sibling (✓ next to ✕)
and all three inside a parent cell whose own click opens a modal. A fat-finger miss either
logs the **opposite result** or opens the sheet. This also fails WCAG 2.2 AA SC 2.5.8
(24×24 CSS px; the spacing exception needs ≥24 px between target centres, and we have 23).

The codebase already has the exact remedy pattern, twice: the chrome panel's own
shrunk buttons carry a coarse twin at `styles-source.css:14845-14850`
(`min-width: var(--dse-touch-min)`), and this very montage block carries a coarse twin at
`styles-source.css:4336-4341` for `.dse-mt__board-rowact`. The settled mock itself states
the convention for the sibling control — `mock6.js:1823-1826`: the pip is "1.5em square (a
24px target at default scale, **growing to 1.9em on a coarse pointer**)". The trio is the
one control that got neither.

**Prescribed fix.** Add a coarse twin inside the montage structural block (next to the
existing `.dse-mt__board-rowact` one at `:4336`):

```css
@media (pointer: coarse) {
  .dse-mt__quick {
    width: var(--dse-control-min, var(--dse-touch-min));
    height: var(--dse-control-min, var(--dse-touch-min));
    min-width: var(--dse-control-min, var(--dse-touch-min));
    min-height: var(--dse-control-min, var(--dse-touch-min));
  }
  .dse-mt__cell-quick { gap: 0.3em; }
}
```

This is screen-only (structural tier, `[data-dse-print="on"]` never matches `pointer:
coarse` in the print capture, and the trio is `display:none` under print anyway), so the
frozen print bytes cannot move — re-run freeze to confirm. The fine-pointer 1.45em square
Scott approved in the mock screenshots is untouched. Add a jest assertion that the rule
exists (the shots harness does not emulate `pointer: coarse`, so nothing else catches a
regression here).

### MED-2 — three real `<button>`s inside `div[role="button"]`: ARIA children-presentational

**`src/elements/montage/BoardView.ts:328-355`** (the trio) vs. the cell's role at
**`BoardView.ts:257-258`**.

`role="button"` is one of the ARIA roles with **Children Presentational: True** (ARIA 1.2
§5.2.7). Every descendant of the cell is therefore pruned from the accessibility tree: the
`role="group"`, its `aria-label="Quick log for <hero>, round <r>"`, and all three
`aria-label`led buttons. A screen-reader user hears one control — *"Bram, round 2: nothing
logged — log an action, button"* — and is never told the quick trio exists; focusing into
a presentational-children subtree is undefined behaviour across AT. The keyboard *mechanics*
are fine (verified: probe P8's tab order reaches cell → three buttons; Enter and Space on a
quick button log without opening the sheet; the `closest('.dse-mt__cell-quick')` guard at
`BoardView.ts:281` and the `evt.stopPropagation()` at `:347` both work) — the loss is
purely in what AT is allowed to announce.

This file already ruled on exactly this question and ruled the other way. `BoardView.ts:296-301`:

> the whole cell is ALREADY the edit trigger (fix-round-1 M-1, above), so nesting a real
> `<button>` inside a `div[role=button]` would be an invalid, double-firing
> interactive-in-interactive mapping.

— which is why the pencil editmark is an `aria-hidden` span and not a button. SC-299 then
does the thing that comment forbids, 30 lines further down, and the new comment at `:346`
re-reads "interactive-in-interactive resolution" as if `stopPropagation` resolved it. It
resolves the *double-fire* half only; the invalid-mapping half is untouched.

Provenance note for the owner: the nesting is inherited from the settled mock
(`mock6.js:1775-1785` puts `role: 'button', tabindex: '0'` on the cell, and `:1849` puts
real `<button>`s inside it), so this is a defect in the settled design, not one SC-299
invented. It still needs a ruling, because the plugin already deviated from the mock on the
identical question for the pip.

**Prescribed fix (minimal, needs an owner ruling — spec §D says "the cell itself
role='button' tabindex='0'").** For the **empty current-round** cell only, drop
`role="button"` and `tabindex="0"` and keep the plain `click` listener (mouse convenience
stays; a div with a click handler is not announced as a control, so nothing is falsely
promised). Nothing is lost for keyboard/AT: the sheet in `new` mode for that exact
`{hero, current_round}` is already reachable from the row's own real button
(`BoardView.ts:170-187`, `Log an action for <hero>`) and from the bar's `Log an action…`.
The three quick buttons then become genuine, announced, first-class controls, and the
`role="group"` label starts doing work. Recorded / past-empty / future cells keep
`role="button"` exactly as today. Adjust the R-1 test that asserts the cell opens the sheet
on click (it tests the click, not the role, so it still passes) and add one asserting the
empty current cell carries **no** `role`.

If the owner prefers to keep the cell's role, the alternative is the mock-faithful-but-AT-
correct shape: keep `role="button"` off the cell and add a fourth `iconButton` inside it
for "open the sheet". Do **not** resolve it by making the trio `aria-hidden` spans — that
would violate the file-header "every button rides kit/iconButton" rule and remove the only
keyboard path to the quick log.

### LOW-1 — the CSS comment justifies the override with a precedent that does not exist

**`styles-source.css:3805-3806`**: "the same 'iconButton plus a second class' gesture
`.dse-mt__board-rowact` uses, ~:3768 — **overriding the kit's generic touch-target box**
down to the mock's flat 1.45em square".

`.dse-mt__board-rowact` (`styles-source.css:3769-3778`) sets only `margin-left`, `flex`,
`padding: 0` and the svg size. It never touches `min-width`/`min-height`, so it keeps the
full kit box *including* the coarse escalation — and it has its own coarse twin at `:4336`.
The comment presents an override that was never made as precedent for the one MED-1 flags.
**Fix:** correct the comment when MED-1's twin lands; say the sizing is a deliberate
fine-pointer override with a coarse twin, and name `.dse-chrome .dse-btn` (`:14845`) as the
real precedent.

### LOW-2 — the narrow-rule comment misstates the DOM order

**`styles-source.css:4157-4160`**: "without this the trio would sit right after the hint
text instead of hugging the row's trailing edge."

The trio is created **before** the hint (`BoardView.ts:328` then `:357`). Without
`margin-left: auto` the trio would sit immediately after `RD n` at the row's **leading**
edge, and the hint would follow it. Verified against `montage-narrow--steel-dark.png`: with
the rule, the trio is pushed right and `TO ACT` trails it at the extreme edge — which is
what the mock's own `round2.css:1750` produces too, so the *rule* is right and only the
*comment* is wrong. **Fix:** reword to "the trio would sit immediately after the round
label at the row's leading edge".

### LOW-3 — `docs/gm-trackers.md` overstates the past-round edit target

**`docs/gm-trackers.md:117-119`**: "An empty cell from an earlier round works the same way —
click it to add a test you forgot to log at the time."

It does not, once the montage is complete: `BoardView.ts:244`'s `(state === 'past' &&
!complete)` closes the path, and `buildCell:222` forces every cell to `state='past'` on a
complete montage, so *no* empty cell is clickable then (verified — probe P5b, and the
`montage-done` capture). A Director reading this sentence, finishing a montage, then
noticing a missed round-1 test will click a cell that does nothing and has no visible
affordance. **Fix:** append "— until the montage is finished; reopen it first, or use
**Log an action…**." (Whether `Log an action…` is even available on a complete montage is
worth checking in the same breath — the bar stands down to `Undo` / `Reopen` / `Clear all`.)

### LOW-4 — a read-only trio keeps live result colours

**`styles-source.css:4395-4408`** vs. `styles-source.css:15178-15180`.

`.dse-mt__quick[data-kind='success'|'failure']` sits at `(0,5,0)` in the Steel tier and
beats the kit's disabled-ink rule `:where(.dse-btn[disabled]) { color: var(--dse-fg-muted) }`
at `(0,2,0)`. On a read-only host the three buttons therefore render in full
`--dse-turn-done` green / `--dse-danger` red at `opacity: 0.5` (from `.dse-btn[disabled]`,
`:13147`), rather than the muted grey every other disabled control in the plugin uses.
Functionally correct (probe P7: 0 writes, real `disabled`), just off-vocabulary. **Fix:**
add `.dse-mt__quick[disabled] { color: var(--dse-fg-muted); }` after the two `data-kind`
rules, or accept and note it.

---

## Probe table

All probes run in jsdom through the REAL `ElementPipeline` (and, for P1, a real
`ReadingModeBlockHost` + FakeVault), from a throwaway
`test/dom/elements/sc299-probe.test.ts` — **12 tests, 12 passed**, file deleted afterwards.

| # | Probe | Result | Evidence |
|---|---|---|---|
| P1a | One tap writes exactly `{hero, round, result}` — no `skill`/`note` keys — and produces exactly ONE `vault.modify` | **PASS** | `P1 modifyCalls = 1`; `P1 new entry keys = [{"hero":"Bram","round":2,"result":"success"}]`; `Object.keys().sort() === ['hero','result','round']` |
| P1b | Note bytes above/below the block survive byte-for-byte | **PASS** | note still `starts# Session\n\nBefore text.\n\n```ds-montage\n` and ends `\n```\n\nAfter text.` |
| P1c | Skill-reuse: the quick path leaves `skills_used` untouched | **PASS** | Bram `skills_used: []`, Kira `['Nature']` unchanged after a quick log (`addSkillOccurrence` early-returns on `!skill`, `model.ts:330`) |
| P1d | Two montage blocks in one note do not cross-talk | **PASS** | 1 modify; block B byte-identical to `montageDoneYaml.trimEnd()`; block A `failures: 1` |
| P2 | Quick log by the LAST hero in the LAST round | **PASS** (see INFO-7) | 1 write; cell → `data-kind=failure`; tally 1; band `failure` / "If it ended now"; bar stays LIVE with `End round 2` — the montage does **not** auto-complete on round exhaustion, only `End round N` advances. Identical through the sheet path; pre-existing, not an SC-299 regression |
| P3a | Double activation *before* the rebuild (synchronous double click) | **PASS — cannot double-log** | after two back-to-back `btn.click()`: `entries` has exactly ONE Bram round-2 entry, 1 write, visible tally `1`. Mechanism (not luck): `ElementView.update()` (`framework/view.ts:206-214`) runs `unloadOwnedChildren()` + `rootEl.empty()` **synchronously before its first await**, inside the first click's own call stack, so the trio's `registerDomEvent` listener is gone and the node detached before the second click can reach it |
| P3b | Realistic double click (one macrotask gap) | **PASS** | cell is already `data-kind=success`, trio absent |
| P3c | Same, on a montage WITH a `description` (async `renderMarkdown` in the rebuild path) | **PASS** | same result on `fixture-mid` — the async brief render does not widen the window |
| P4 | Quick log one short of `success_limit` | **PASS** | band `total` / "Final result" / **Total Success**; head chip `Complete`; bar stands down to `["Undo","Clear all"]`; exactly 1 write; every remaining empty cell now inert (no `role`, no trio, no editmark) |
| P5a | Past-round empty cell → sheet `{kind:'new', hero, round:<past>}`; lands `round: <past>`; `nextHeroToAct` undisturbed | **PASS** | pre-pressed chips `["Bram","1","Success"]`; written entry `{hero:Bram, round:1}`, `current_round: 2` unchanged, `nextHeroToAct` still `Bram` |
| P5b | Future-round and complete-montage empty cells carry NO `role` | **PASS** | rounds 3/4 and `montage-done` Yenna/3: no `role`, no `tabindex`, no editmark, no trio |
| P7 | Read-only host (`canPersist=false`) | **PASS** | 3 buttons present, all `disabled === true`; clicking each (both `.click()` and a dispatched bubbling `MouseEvent`), clicking the cell, and Enter on the cell → **0 writes**; cell `aria-disabled="true"` |
| P8a | Tab order / DOM shape | **PASS** (see MED-2) | order: `…rowact[Log an action for Bram]` → `DIV.dse-mt__cell[Bram, round 1…]` → `DIV.dse-mt__cell[Bram, round 2…]` → the three `dse-mt__quick` buttons → the bar. Cell `role=button`, group `role=group`, label `Quick log for Bram, round 2` |
| P8b | Enter/Space on a quick button logs without opening the sheet; Enter/Space on the cell opens the sheet only | **PASS** | `space-on-button opened sheet = false`; Space on the cell → `.dse-mt__sheet` |

## Visual review (I opened and looked at every one)

- **`montage-mid--steel-dark`** — the trio is faithful to `round2.css:307-333`: flat 2px-
  radius squares on `--dse-chip-bg` inside a `--dse-metal-line` hairline, ✓ green / ✕ red /
  ⊕ metal, 0.18em gaps, centred above `TO ACT`. Glyph shapes are the same
  check/x/circle-plus vocabulary the recorded seal uses (colourblind rule satisfied — shape
  is the primary channel).
- **`montage-mid--steel-light`** — same geometry; the ✓ and ✕ read faint against the light
  chip. Same token pairing the tally chips already use, so consistent rather than new — and
  it self-resolves on rebase, see INFO-5.
- **`montage-narrow--steel-dark`** — `margin-left: auto` pushes the trio toward the trailing
  edge with `TO ACT` after it, matching what `round2.css:1750` produces on the same DOM
  order. (Comment wrong, rule right — LOW-2.)
- **`montage-mid--steel-print`** / **`montage--steel-realprint`** — round 3 cells show
  `to act` and **nothing else**; no buttons, no group box. R-3 confirmed visually as well as
  byte-wise.
- **`montage-old-shape--steel-dark`** — Round 1 (past, empty) shows `— NO ACTION` with the
  faint plus editmark top-left; Round 2 (in play) shows the live trio. Both R-1 and R-2 in
  one existing capture.
- **`montage-done--steel-dark`** — every empty cell plain `— NO ACTION`, no plus, no trio.

**Nesting placement (the SC-191 review-2 H-1 trap):** I resolved the ancestor stack of every
new rule by brace-walking the source. All four land in the correct block —
`:3809/:3815` under `[data-dse-element="montage"] .dse-mt` (structural tier); `:4161` under
that block's `@container dse-mt (max-width: 420px)` at `:4113`; `:4395` under
`[data-dse-theme='steel'][data-dse-element="montage"]:not([data-dse-print="on"]) .dse-mt`
(Steel tier, correctly print-excluded); `:5119` at top level alongside the existing
`.dse-mt__cell-editmark` print rule. No "H-1's dedup half" style misplacement.

## Docs / changelog / commits

- `docs/gm-trackers.md:110-113` (quick trio) — plain-language and true. `:117-119`
  (past-round) — see LOW-3.
- dse `CHANGELOG.md:33-37` — present, accurate, extends the existing 7.0.0 Montage bullet
  rather than adding a new one, as the brief asked.
- Workspace `CHANGELOG.md` `## Unreleased` — present (superproject `cf5f7da`), accurate.
  Nit (INFO-8): it is inserted with no blank line before the following `- **DSE conditions`
  bullet, while every neighbouring entry is blank-line separated.
- **No attribution trailers** in any of the five commits (`8cff4ff`, `c94a979`, `df69b9e`,
  `1762555`, `cf5f7da`) — checked with `git log e12c6bd..HEAD --format=%B` and
  `git log -1 --format=%B cf5f7da`.

## INFO

1. Every gate number is identical to the round-1 report's. Six montage captures
   (`montage-{mid-dark,mid-light,mid-print,narrow-dark,old-shape-dark,done-dark}`) are
   **byte-identical** to the round-1 evidence PNGs (`cmp` clean) — the branch is
   shot-deterministic across sessions and machines-state.
2. `npm run shots` prints `OBSIDIAN APP.CSS PIN DRIFT — installed Obsidian is 1.14.2 …
   pinned 1.13.7`. Round 1 printed the same line at 1.14.1 — Obsidian self-updated between
   the two runs. Expected per the harness README; the host-copy pin still reports OK and
   freeze is unaffected because print renders against the pinned sheet. Not an SC-299 issue.
3. The button host-leak kind count is 114 (was 111 at SC-205) — the three new quick kinds,
   exactly as the round-1 report said and as the ledger already ruled (2026-09-17, dropped).
4. **The impl's hover cascade deliberately differs from the mock, and is better.** In
   `round2.css` the `[data-kind]` colour rules come *after* `&:hover`, and both are
   `(0,2,0)`, so hovering a success button in the mock never changes its ink. The impl's
   `:hover:not([disabled])` is `(0,3,0)` and wins, so all three go `--dse-accent` on hover
   as the file's own ghost vocabulary requires. Worth keeping; worth *noting* as a knowing
   divergence rather than a porting slip.
5. **Rebase preview.** `origin/develop` `96e2238` (SC-196) touches `CHANGELOG.md` and
   `styles-source.css`, but `git merge-tree` reports **0 conflict markers** — the rebase
   auto-merges. SC-196 darkens the light-scheme state palette (`--dse-turn-done: #147c40`,
   `--dse-danger: #bb2d1f`), which is exactly the pair the trio tints with, so the faint
   light-mode glyphs noted above improve for free. **Re-take `montage-mid--steel-light`
   after the rebase** — and note SC-196 also lands `test/dom/framework/lightContrast.test.ts`,
   which pins those token values but does **not** cover the new `.dse-mt__quick` surface;
   consider adding the trio's ground/ink pair to it in the same round.
6. SC-196 also changes `src/framework/kit/iconButton.ts` (tooltip ≡ aria-label, SC-324 gap).
   The trio passes no `tooltip`, so it is unaffected — but re-run the R-1 aria-label test
   after the rebase rather than assuming.
7. P2's "does the montage complete?" answer: **no, and that is correct today.** A montage
   only completes on a limit or on `endMontageRound()` pushing `current_round` past
   `rounds`; the last hero acting in the last round leaves the bar LIVE with `End round N`.
   Identical through the sheet, so SC-299 changes nothing here. Flagging only because the
   brief asked.
8. Workspace CHANGELOG blank-line nit (above).
9. `variant: 'ghost'` on the trio is load-bearing, not decorative: the Steel chip-chrome
   rule at `styles-source.css:10441` excludes `.dse-btn--ghost`, which is what keeps the
   trio the mock's flat square instead of a sheened, bevelled chip. Correct choice; the
   Steel tier then re-adds exactly the background/border the mock draws.

## Reproduction

```
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements && npm run lint'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements && npm run shots'
bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements/visual-harness/shots
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements && npm run parity'
```

Gate logs: `sc299-rv1-{tsc,lint,jest,shots,freeze,parity}.log` in this directory.
Evidence PNGs: `sc299-rv1-montage-{mid--steel-dark,mid--steel-light,mid--steel-print,narrow--steel-dark,old-shape--steel-dark,done--steel-dark}.png` and
`sc299-rv1-montage--steel-realprint.png` in this directory.
