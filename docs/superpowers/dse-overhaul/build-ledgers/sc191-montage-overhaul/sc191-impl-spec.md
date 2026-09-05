# SC-191 — montage element: implementation spec

**Executive summary.** Turns the six-round mock corpus into the shipped `ds-montage`.
**Badge (measured):** `round6.css:193`'s `width:100%; max-width:4.6em` renders a **74.30 px**
box where the shipped Power Roll badge is **51.25 px** — a 45 % stretch; padding was never
wrong. Delete the override, keep the shipped `width: 3em`, size the key track to the badge's
border box (`3.21em` / `2.85em` narrow) → measured 51.25 × 22.14 px, padding `4.608/4.032`,
the shipped box exactly. **Pip (final, one option):** a small forged tab — **gold** fill
(`--dse-vp` #e0b050, one value dark and light), a faint top-down sheen, a 1 px **steel-grey**
rim (`--dse-metal-line`); ▲/▼ alone still carries reward-vs-consequence.
**Schema is purely additive** (`description`, `entries[]`): old blocks parse, render and keep
their tallies, no migration. **4 slices, 0 open questions**, 2 montage print lines rebaselined.

---

## A. Design freeze

**The design is:** `visual-harness/sc191/mock6.html` + `mock6.js` + `round2→round6.css`, at
its **default** query state (`?state=mid`), with the round-6 fixes in §J. Nothing else.

| Axis | Winner | Fixed by |
|---|---|---|
| composition `data-treat` | `roster` | 2026-08-26 (round-2 ruling) |
| add-a-hero | **row deleted**, `+` in the Heroes header cell | 2026-08-26 (universal, not a variant) |
| `data-crest` | `none` | 2026-08-28 |
| `data-seal` | `ink` | 2026-08-28 assumed → confirmed twice by silence (08-29, 08-30) |
| `data-space` | `centre` | same |
| `data-dedupe` | `merged` (one outcome band, tracks kept) | 2026-08-29 |
| track widths | **equal**, failure slots wider | 2026-08-29 |
| per-test notes | in the sheet, mark in the cell's **top-right**, listed in the band | 2026-08-28 / 08-29 |
| rules guidance | collapsible foot panel, **collapsed by default** | 2026-08-28 |
| `+` ghost lane left of Tally | **removed from the DOM** | 2026-08-29 |
| cheat-sheet toggle | `handle` (`data-place='handle'`) | 2026-08-29 |
| `Record…` | renamed **`Log an action…`** on every surface | 2026-08-29 |
| strip orientation | tiers-as-rows × difficulty-as-columns, adopting Power Roll | 2026-08-30 |
| `data-tierstyle` | `edge` (wash fades at 12 %, not 60 %) | 2026-08-30 (no veto) |
| crit row | **kept** — the strip carries the whole book table | 2026-08-30 (no veto) |
| `data-r6treat` | `pip` (solid ▲/▼ on the seal's bottom-right) | 2026-08-30 |
| badge padding | must match shipped `.dse-pr__badge` | 2026-08-30 (§J1) |
| pip treatment | richer, chosen by us, no approval round | 2026-08-30 (§J2) |

**What dies and must not reach `src/`:**

- Every losing composition (`tray`, `set`, `stages`, `plate`, `ledger`), crest (`dark`,
  `mono`, `rule`), seal (`struck`, `bare`), spacing (`pad`), and `data-dedupe` value other
  than `merged` (`before` = round 3, `bars-off`).
- Every `?param` gate: `dedupe`, `r5`, `r6`, `treat`, `tier`, `cheat`, `only`, `gray`,
  `hover`, `sheet`, `menu`, `state`, `bg`, `width`. In the shipped element there are no
  variant attributes at all — the winners are the only code path.
- `candidates.css`, `mock.*`, `mock2.*`–`mock5.*`, `round2→round6.css`, all six cameras.
  **They stay on the design branch as the record; not one line is imported by `main.ts`.**
- The `chip` cheat-sheet toggle, `.mt5-headtoggle`, the `ring`/`double` rider treatments and
  their glyphs (`checkcheck`, `dagger`), the round-5 one-letter `c`/`r` narrow rider marks
  (round 6 shows the pip at every width), and the `?only=vocab` / `?only=pr` pages.
- `round2.css`'s viewport `@media (max-width: 420px)` blocks: production uses
  **`@container`** (the mock pins `#mount` to a fixed width, which the real element never
  does). Declare `container-type: inline-size; container-name: dse-mt` on `.dse-mt` and query
  `@container dse-mt (max-width: 420px)` — the named form, per `styles-source.css:931/1005`
  (initiative) and `:9511/9622` (recoveries); `container-type` is Chromium 105, under the 106
  floor. Carry SC-121 D-7's lesson (`:4139`): put `container-type` on the node whose width
  actually changes, or the query silently resolves against the wrong box.

**Warning carried from round 6 (`sc191-round6-report.md` §0): the mock's attribute plumbing
has a live collision.** `buildCard` writes `data-treat='roster'` (round 2's composition axis,
selector for a ~1,500-line block) on the same root the rider treatment wanted; writing both
into `data-treat` silently unmatched the roster block and dropped 55 px of card height with no
error. The shipped element has **no** variant attributes, which removes the class of bug —
but it is why §I's slices each demand shot evidence, not just a green battery.

---

## B. Data model / YAML schema

### B.1 Today (`src/elements/montage/example.yaml`, `model.ts`)

`title?`, `rounds` (2), `success_limit` (0), `failure_limit` (0), `successes` (0),
`failures` (0), `participants?[{name, skills_used[]}]`, `current_round` (1), `_dse_anchor?`.
`parse` materialises defaults **only** for `rounds/success_limit/failure_limit/successes/
failures/current_round`; `serialize` is `stringifyYaml(model).trim()` in fixed key order, so
`serialize(parse(x)) === x` whenever `x` already carries the full field set in that order
(`test/unit/model/montage-serialize.test.ts`'s oracle).

### B.2 Shipped schema

Two new optional keys. **Nothing is renamed, retyped, removed or reordered.**

```yaml
title: Cross the Ashfall Wastes     # string?   — head name (unchanged)
description: |                       # string?   NEW — the Director's brief, above the board
  Forty miles of volcanic waste…             rendered through ElementView.renderMarkdown
rounds: 3                            # int, default 2
success_limit: 6                     # int, default 0
failure_limit: 3                     # int, default 0
successes: 4                         # int, default 0  — AUTHORITATIVE running total
failures: 2                          # int, default 0  — AUTHORITATIVE running total
participants:                        # {name, skills_used[]}[] ?  (unchanged)
  - name: Kira
    skills_used: [Nature, Alertness]
entries:                             # NEW, optional — the board's per-cell records
  - hero: Kira                       #   string, must match a participants[].name
    round: 1                         #   int >= 1
    result: success                  #   'success' | 'failure' | 'assist'
    skill: Nature                    #   string?  omitted when empty
    note: Turned an ankle…           #   string?  omitted when empty
current_round: 3                     # int, default 1
_dse_anchor: 4c19ff                  # framework-owned, never authored
```

**Which UI region reads/writes what** — head: `title`, `current_round`, `rounds`. Brief:
`description` (read-only; authored). Board: `participants`, `entries`, `rounds`,
`current_round`. Tally column: `entries`. Outcome band: `successes`, `failures`,
`success_limit`, `failure_limit`, `rounds`, `current_round`, plus `entries[].note`. Sheet:
writes one `entries[]` item + the matching `successes`/`failures` delta + the hero's
`skills_used`. Strip and foot guide: **read nothing from the model** — they are rules text.

**No `rider` field, and that is a finding, not an omission.** Checked in `mock6.js`: riders
(`with a reward` / `with a consequence`) exist only in `STRIP6`/`CHEAT`, the cheat-sheet's
rules vocabulary. The board's `HISTORY` records carry `result` + `skill` + `note` and nothing
else. **The board does not record riders; the cheat sheet only displays them.** A Director who
wants to remember a consequence uses the note field — which is exactly what round 4 built it
for. Do not add a rider key.

### B.3 Tallies: stored, never recomputed

`successes`/`failures` stay the authoritative totals; `entries[]` is the detail layer.

- **Writes are deltas only.** Logging a success does `entries.push(e); successes += 1`.
  Correcting success→failure does `successes -= 1; failures += 1`. Removing does `-= 1`.
  **The element must never assign `successes = count(entries)`** — that would zero an old
  block's tallies on its first write. This is a testable invariant (§G).
- Same rule for `skills_used`: logging with a skill appends it, removing an entry removes one
  occurrence. The reuse warning keeps reading `skills_used`, unchanged.
- A block whose `entries` disagree with its scalars (an old block, or a hand-edit) renders
  **both truthfully**: the band's tracks fill from the scalars, the board shows the entries it
  has. That is the honest reading of "4 successes, provenance unknown".
- No "recount from the board" affordance ships. Deliberate: silent recomputation is the one
  way to lose a Director's hand-kept totals.

### B.4 Backward compatibility — there is no destructive migration

An existing block has no `description` and no `entries`. It parses into the same model with
those two fields `undefined`, renders (empty board, correct tallies, correct outcome band),
and **serialises byte-identically to today** because absent optional keys are never
materialised — the same rule `title`/`participants`/`_dse_anchor` already follow. The first
write that touches the board materialises `entries: [...]`; a write that only moves a tally or
the round produces today's bytes with one scalar changed. The existing serialize oracle test
therefore stays green unmodified, which is the compatibility proof.

### B.5 Serialization contract

- **Key order (fixed):** `title, description, rounds, success_limit, failure_limit,
  successes, failures, participants, entries, current_round, _dse_anchor`.
- **Entry key order (fixed):** `hero, round, result, skill, note`.
- **Omit when absent:** `title`, `description`, `participants`, `entries`, `_dse_anchor`,
  and per entry `skill`, `note`. Never emit `null`, `''` or `[]` for these.
- **Materialise defaults for:** `rounds`, `success_limit`, `failure_limit`, `successes`,
  `failures`, `current_round` — the existing list, unchanged.
- **Round-trip identity:** `parse(serialize(parse(x))) ≡ parse(x)` for every input, and
  `serialize(parse(x)) === x` for any `x` already in canonical order. Entries preserve their
  authored array order (the board sorts for display; it never re-sorts the model).
- Unknown keys are dropped, as today. `_dse_anchor` is excluded from schema validation by
  `pipeline.ts` and passes through untouched.

---

## C. Persistence and integrity

**The path today, confirmed in source:** `ElementView.persist()` (`src/framework/view.ts:249`)
debounces ~400 ms, then calls the injected serializer (wired at `pipeline.ts:511-524` from
`def.serialize`) and hands the string to `host.replaceSource()`. Reading mode and sidebar hosts
use `Vault.process` (atomic read-modify-write — `host/ReadingModeBlockHost.ts:105`,
`SidebarBlockHost.ts:233`); live preview dispatches one CM6 transaction
(`LivePreviewBlockHost.ts:59`). `_dse_anchor` is stamped by `sidebar/anchor.ts` and popped
before schema validation (`pipeline.ts:120-142`).

**What changes: nothing structural.** The montage keeps `shape: 'persisted'` and the same
`parse`/`serialize` pair; the new fields ride the existing write path. Two rules bind the new
write sites: (1) **rendering never writes** — every mutation runs from a click handler, as
`ParticipantsView.record()` already does; (2) UI state (strip pinned, guide open) goes to
`cx.session` keyed by `(host.blockKey(), slot)` and **never** to the note (§D).

**Integrity probe list — the reviewer runs all eight:**

1. Content above and below the block survives a write (headings, other blocks, frontmatter).
2. **Two `ds-montage` blocks in one note do not cross-talk** — log into A, B's YAML is
   untouched byte-for-byte and B's session state (pinned strip) is independent.
3. A hand-edited YAML value (`success_limit: 9`) survives a re-trigger and the next write.
4. A user-deleted block regenerates cleanly from a fresh paste of the example.
5. **An old-shape block loses nothing**: `successes: 4 / failures: 2`, no `entries`; render,
   log one action, and assert the file now reads `successes: 5` with a one-item `entries`
   list — not `successes: 1`.
6. A block with `entries` but stale scalars keeps the scalars (no silent recount).
7. Read-only hosts (canvas, export, embeds) render the board with **zero** write affordances
   and perform zero writes (`canPersist === false`, the F1 §4.4 contract the element already
   honours).
8. Rapid clicks coalesce into one debounced write; the file never lands mid-model.

---

## D. Component mapping

| Mock region | Ships as |
|---|---|
| head (crest, eyebrow, name, deck, round chip) | `kit/cardHead` + `.dse-crest` — **already** what `view.ts:52` does; add the deck line and the round chip |
| the ⋯ overflow (add a round / add a hero / set limits… / Clear all / Reset progress) | the **SC-169 chrome panel** (`ElementChrome.items`, `docs/superpowers/sc169-element-menu-panel-spec.md` §2). **Delete** `view.ts`'s hand-rolled `iconButton`+`Menu` — the mock's `.mt2-menu` is a drawing of the panel, not a second menu |
| description | `ElementView.renderMarkdown` into a `.dse-mt__brief` paragraph |
| cheat-sheet handle + strip | `kit/collapsible` (`persist: {session, blockKey, slot: 'montage.strip'}`) + a montage-local grid |
| strip row **badges** | the **shipped** `.dse-pr__badge .dse-pr__badge--{t1,t2,t3,crit}` classes, verbatim, with the exact strings `powerRollPanel.ts` writes (`≤11`, `12-16`, `17+`, `crit`). **No local width/padding override** (§J1) |
| strip row **wash + tier edge** | a montage-local `.dse-mt__tier-row`, **copying** the three declarations from `styles-source.css:7206` (`--t`, `border-left: 3px solid var(--t)`, `background-image: linear-gradient(90deg, var(--tw), transparent 12%)`) with the same static per-tier `--tw` literals and light twins. **Do not put `.dse-pr__row` on this node** — the shipped rule carries `:first-child`, `aria-checked` and `@supports` siblings and a parity-map pair; sharing the class couples two unrelated surfaces. `color-mix()` is forbidden here (Chromium 106 floor, SC-160/SC-171): the static `--tw` twins are the whole implementation |
| board (Heroes column + `+`, round columns, Tally) | montage-local CSS grid; the expanded track list arrives as **one** `setProperty('--dse-mt-cols', …)` — the sanctioned geometry seam (D2 §5). Never `display:none` a grid item (it still consumes a track and shears the row) |
| cell | a real `<button>` per socket; the cell itself `role="button" tabindex="0"` with the full aria label (`"Kira, round 3: nothing logged — log an action"`) |
| cell edit chip + note mark | `kit/iconButton` (`variant: 'ghost'`) inset from the top-right; the note mark is a permanent dog-eared-page glyph in `--dse-metal`, never hover-revealed |
| outcome band (verdict / tracks / rule line / notes / brink) | montage-local. The tracks reuse the recoveries-strip gesture round 2 already cites (`styles-source.css` ~9273): outline states the limit, fill states progress |
| foot rules panel | `kit/collapsible`, `slot: 'montage.guide'`, **closed by default**, and **expanded in print** (a rules panel on a printed card) |
| `Log an action…` sheet (new + correct) | `kit/managedModal` → `openManagedModal(owner, …)`, the SC-186 `ConditionsModal` precedent. Footer `iconButton`s: `Remove` (danger, edit only) · `Cancel` (ghost) · `Log`/`Save` (accent) |
| every button | `kit/iconButton` — never a bare `<button>` (its UA padding is what falsified round 4's control) |

**Class namespace.** The new block owns `.dse-mt__*` wholesale: today's
`.dse-mt__round-track`, `.dse-mt__tallies`, `.dse-mt__tally*`, `.dse-mt__outcome`,
`.dse-mt__participants*`, `.dse-mt__record`, `.dse-mt__skill*`, `.dse-mt__char-input` are all
deleted with the UI they style. Mock prefixes (`mt2-`/`mt4-`/`mt5-`/`mt6-`) never ship.

**The roll row.** `ParticipantsView.rollTest()` (the optional `RollService` row) has no home in
the new board. Keep the capability by wiring the sheet's Result field to it: when
`cx.roll` exists, the sheet gains a "Roll" affordance that resolves a test and preselects the
resulting chip. Do not silently drop `cx.roll` — it is a shipped seam with tests
(`montage.test.ts:311`).

---

## E. CSS migration

**Where.** One block in `src/styles-source.css`, replacing the current
`[data-dse-element="montage"] .dse-mt` block (line 3546-~3690, ~145 lines). Every rule carries
`[data-dse-theme='steel']:not([data-dse-print="on"])` **except** the structural ones that must
also print (the board grid, the outcome band's layout, the guide panel expanded) — those go in
the base tier, which is the reason the two montage print lines move (§F).

**Size.** The five mock sheets hold **3,078** non-comment lines (round2 1,590 · round3 361 ·
round4 462 · round5 375 · round6 290). Removing the losing axes and flattening the layered
overrides (round 5 restates round 4's narrow re-lay; round 6 zeroes round 5's strip body)
lands the shipped block at **~1,700–2,000 non-comment lines**, ~2,800–3,500 with this sheet's
comment convention. Budget accordingly: this is why the CSS lands across two slices.

**Hard rules (all already obeyed by the mocks — keep them obeyed):**

- Every colour is a `--dse-*` token; compose, never invent (DESIGN.md rule 3). Tokens used are
  all existing rows in `docs/superpowers/dse-overhaul/D3-token-map.md`: `--dse-tier-{low,mid,
  high,crit}` (:194), `--dse-turn-done` (:236), `--dse-danger`, `--dse-vp` (:238),
  `--dse-metal`, `--dse-metal-bright`, `--dse-metal-line` (:161), `--dse-metal-faint`,
  `--dse-sheen-soft` (:166), `--dse-surface-sunken`, `--dse-chip-bg`, `--dse-fg{,-muted,
  -faint}`, `--dse-accent`, `--dse-radius`, `--dse-bevel`. **No new token, so
  `token-coverage.test.ts` (which path-searches the workspace D3 map — the stale-worktree-pin
  footgun) is inert for this work.**
- Every font-size is a `--dse-fs-*` role token. `fontSizeContract.test.ts`'s ALLOWLIST holds
  **no** `.dse-mt` entry today — adding one is forbidden, and if the rewrite deletes a
  selector that is on the list, its line dies in the same commit (the no-dead-entries guard).
- Every translucent wash states its light twin (SC-117/SC-126 bg-polarity).
- **No bright white.** The largest remaining offender is the current pip's
  `--dse-metal-bright` (#d9dee1 in dark) — §J2 replaces it.
- Colourblind rule: shape + words carry every state, colour only reinforces. Outcome =
  ring-vs-pressed-disc + check-vs-X + the word. Rider = ▲-vs-▼ + the word. Band = tier text in
  the badge. The greyscale shot is the proof, and it stays a required capture (§F).
- No decorative coloured left border **invented** (DESIGN.md rule 7 / SC-132). The strip's 3 px
  tier edge is the Power Roll row's own structural signature, quoted with a citation comment.

**What does NOT migrate:** every `?param`-scoped rule; `.mt5-headtoggle` and
`[data-place='chip']`; `[data-r6treat='ring'|'double']`; the `data-dedupe='before'|'bars-off'`
blocks; the `.mt6-vocab*` page; the viewport `@media (max-width: 420px)` form (re-authored as
`@container`); `.mt6-row__key .dse-pr__badge { width: 100%; max-width: 4.6em }` (§J1).

---

## F. Harness + freeze

**Fixtures** (`src/elements/montage/*.yaml` + `visual-harness/entry.ts:813`) — replace the
single `{ default }` with:

| Fixture | State |
|---|---|
| `default` | the authored starting block: roster, limits, no entries → **empty board, "Not started"** |
| `mid` | the mock's `?state=mid`: 3 rounds, 10 entries, 2 notes, round 3 in play, brink alert on |
| `done` | `?state=done`: total success, tensed tails, bar stood down to Reopen + Clear all |
| `failed` | failures at the limit, successes not leading by 2 → Total Failure |
| `old-shape` | the pre-SC-191 YAML verbatim (scalars, no `entries`) — the migration's shot |

**Capture ids.** `montage`, `montage-mid`, `montage-done`, `montage-failed`,
`montage-old-shape` from the fixture table; plus
`montage-narrow` (`NARROW_SHOTS`, width 300, fixture `mid`),
`montage-guide-open` / `montage-strip-pinned` / `montage-sheet-log`
(`INTERACTION_SHOTS`, one real click on the disclosure / handle / bar button — the pattern
`negotiation-pr-checked` established). Each id ships in 4 combos; each contributes **two**
freeze lines (twin + realprint).

**`docs-manifest.mjs:253`** currently reads `{ out: 'montage.png', source: 'browser',
element: 'montage' }` — repoint it at `fixture: 'mid'`, so `docs/Media/montage.png` shows a
board with play on it instead of an empty grid.

**Freeze — state it plainly.** The baseline
(`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`, 210
lines) holds exactly two montage lines, both hash `8e5cc6ae…`:
`montage--steel-print.png` (:23) and `montage--steel-realprint.png` (:102). **They WILL move
by design** — the element's DOM is replaced. That is a **sanctioned rebaseline**: the
implementer ships `.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt` (`<sha256>  <name>`
for both, verified byte-identical across two clean `npm run shots` runs, twin hash ==
realprint hash) plus before/after crops, and the ticket-owner takes the sanction ask to Scott.
The new capture ids are a **widening** (additions-only, no sanction). **Nobody edits the
baseline** — not the worker, not the reviewer; the dispatcher applies it at landing
(`dse-verify` SKILL.md → "Division of labor").

---

## G. Tests

| File | Adds |
|---|---|
| `test/unit/model/montage-serialize.test.ts` (extend) | old-shape byte-identical round-trip (the compatibility proof); new-shape round-trip identity; fixed key order incl. entries; omit-when-default for `description`/`entries`/`skill`/`note`; a `null`/wrong-type entry field is dropped, never crashes |
| `test/unit/model/montage-tally.test.ts` (**new**) | delta-only writes (log/correct/remove) never assign `successes = entries.length`; an old-shape model keeps its scalars through a log; `montageOutcome` incl. the **`pending`** band at 0/0 (today it returns `'failure'` for an un-started montage — a bug carried since round 2, fixed in slice 2); the at-a-glance phrasing exactly as the mock writes it: `1 from Total Success` / `2 from Total Success` / `Total Success reached` / `1 more ends it` / `the limit is reached`, and the tensed complete forms (`the success limit, reached` / `1 under the failure limit`) |
| `test/dom/elements/montage.test.ts` (extend) | board renders one row per participant × `rounds` columns; a socket click logs and persists; the cell edit chip opens the sheet pre-filled; a note round-trips into the outcome band's list; equal-width tracks (`getBoundingClientRect().width` of the success track === the failure track, and the failure slot ≈ 2.2× the success slot at 6/3); read-only renders no sockets, no chips, no bar; the chrome menu carries the five items; `cx.roll` still reachable |
| `test/dom/elements/montage-strip.test.ts` (**new**) | strip + guide toggle and **session** persistence (`(blockKey, 'montage.strip')`), never a note write; two blocks in one note keep independent state; the strip's four badges carry `.dse-pr__badge--{t1,t2,t3,crit}` and the shipped strings; the pip renders on exactly the six rider cells; keyboard/a11y — every control has an accessible name and is tab-reachable, the disclosure sets `aria-expanded`, the sheet is `role="dialog"` with `aria-label` |

---

## H. Docs

- **`docs/gm-trackers.md`** § "Montage Test tracker" — new YAML example (with `description`
  and `entries`), what the board/strip/guide/sheet do, `Log an action…`, and the ⋯ items.
  The **Reset** paragraph moves to the chrome panel's wording.
- **`docs/Media/montage.png`** — regenerated by the docs camera off the `mid` fixture (§F).
- **`CHANGELOG.md`** → `## 7.0.0 (unreleased)`, one `[FEATURE]` bullet in the repo's existing
  voice (see the SC-195 entry at the top of the file for the shape), naming the new keys.
- **`docs/migrating-to-7.md`** — **no migration note is warranted** (§B.4: purely additive,
  nothing breaks). Add the montage to the feature list at :222 instead.
- **`docs/common-element-fields.md`** — mention `description` if that file grows a per-element
  field table; today it only lists the elements at :107, so no edit.
- No workspace-level doc changes. If one is ever needed it lives at
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/<file>` — **never** under
  `workspace/`.

---

## I. Work breakdown

Every slice ends with the **full `dse-verify` battery in order** — `npm run tsc`,
`npm run lint`, `rm -f main.js styles.css && npx jest`, `npm run shots` ×2 (byte-identical),
`check-freeze.sh <clone>/visual-harness/shots`, `npm run parity` **last** — each command LAST
in its own `devbox run -- bash -c 'cd <abs> && …'`, output redirected to a log and the log read
(no pipes, no `; echo`). Baseline numbers on `origin/develop` `778a341`: **jest 3491 passed /
1 skipped / 189 suites · shots 478 PNGs 0 FAIL byte-identical ×2 · freeze 210/210 0 mismatches
· parity 0 GAPs / 0 undeclared / 16 declared.** The worktree's superproject pin may be stale;
it does not matter here (no new token → `token-coverage.test.ts` is inert), but run jest from
the worktree, never a scratch tree, or it silently skips 2 tests.

**Slice 1 — model, migration, tests. No UI, no CSS, no fixture.**
`model.ts`: add `description?`, `entries?` (+ `MontageEntry`), the fixed key order, the
omit-when-default rules, and pure helpers `montageTallies(m)` / `montageBandCopy(m)` that
nothing renders yet. Tests per §G rows 1–2.
*Acceptance:* jest **> 3491**, and **shots byte-identical to the base run and freeze
210/210 with zero montage movement** — slice 1 is provably pixel-neutral, which is what makes
it independently landable.

**Slice 2 — the instrument: head, brief, board, outcome band.**
Replaces `RoundTrackView`/`ParticipantsView` with `HeadView`/`BoardView`/`OutcomeBandView`;
lands the `pending` outcome band; the `.dse-mt__*` CSS for those regions; the five fixtures and
their capture ids; the docs image repoint.
*Acceptance:* the two montage freeze lines move and **only** those two (`check-freeze.sh`
reports exactly 2 mismatches, 0 others); `rebaseline.txt` + before/after crops produced;
shots byte-identical across two runs; parity unchanged at 0/0/16.

**Slice 3 — the reference surfaces: cheat-sheet strip + foot guide.**
`kit/collapsible` × 2 with session persistence; the flipped strip with the shipped badges
(§J1) and the gold pip (§J2); the foot panel and its pinned-stub dedup; the
`montage-strip-pinned` / `montage-guide-open` interaction captures.
*Acceptance:* the badge's measured box is 51.25 × 22.14 px with padding `4.608px 4.032px`,
identical to a Power Roll badge measured in the same run; greyscale capture still legible;
300 px capture does not side-scroll; freeze shows only the slice-2 pair.

**Slice 4 — the controls: chrome menu, sheet, per-cell edit/note, docs.**
SC-169 chrome items replace the hand-rolled menu; `openManagedModal` sheet (new + correct)
with the tier hint, the skill-reuse warning, the Note field and the roll affordance; the
`montage-sheet-log` capture; §H docs and CHANGELOG.
*Acceptance:* the eight §C integrity probes pass in a real vault; a11y tests green; battery
green; the rebaseline package still matches the final bytes (regenerate it here — hashes must
come from the landing tree, not from slice 2).

---

## J. The two round-6 deliverables

### J1. Badge padding — diagnosed and fixed

**Cause.** `round6.css:193-196`:

```css
.mt6-row__key .dse-pr__badge { width: 100%; max-width: 4.6em; }
```

`.mt6-row__key` is a grid item in a `var(--mt6-key, 5.4em)` track, so `width: 100%` inflates
the badge to the whole key column, capped at `4.6em` **of the badge's own font-size**
(`--dse-fs-secondary` = 0.9em = 14.4px) = 66.24 px content + 8.06 px padding. Nothing to do
with grid stretch or `justify-self`; the shipped rules were never the problem.

**Measured, live, at 820 px** (probe script, `addStyleTag` only, no file edited):

| | mock today | shipped Power Roll badge | after the fix |
|---|---|---|---|
| border box | **74.30 × 22.14 px** | **51.25 × 22.14 px** | **51.25 × 22.14 px** |
| content `width` | 66.24 px | **43.19 px** (`3em` @ 14.4px) | 43.19 px |
| `padding` | 4.608px 4.032px | 4.608px 4.032px | 4.608px 4.032px |

The mock's badge is **45 % wider** than the component it is quoting. Padding was never wrong;
`width` was.

**Fix.** Delete the override and shrink the key track to the badge's **border box**
(`3em + 2×0.28em = 3.56em` at 0.9em = `3.21em` of the row; at narrow the badge drops to
`--dse-fs-caption` 0.8em ⇒ `2.85em`):

```css
.dse-mt__tier-row { grid-template-columns: var(--dse-mt-key, 3.21em) repeat(3, minmax(0, 1fr)); }
/* no width/max-width on .dse-pr__badge — the shipped 3em box is the point */
@container dse-mt (max-width: 420px) { .dse-mt__tier-row { --dse-mt-key: 2.85em; } }
```

Verified: key track 160.55 px vs badge right edge 160.44 px (fits, no overflow), the full
0.7em column gap preserved, and the head row's difficulty labels stay on the same x as the
cells (`headLeft === cellLeft` at both widths). Shipped rules cited: base
`styles-source.css:11809` (`flex: 0 0 auto; width: 3em; font-size: var(--dse-fs-caption)`) and
Steel `:7342` (`line-height: 1; max-height: none; font-size: var(--dse-fs-secondary);
padding: 0.32em 0.28em` — SC-121 SEED2's breathing room, which is the padding Scott is asking
to match). Evidence: `sc191-r7-badge-before-dark.png` → `sc191-r7-pip-gold-dark.png`.

### J2. The pip — final treatment, one option

**The pick: a forged gold tab.** The ▲/▼ stops being a flat glyph and becomes a small clipped
object with a fill, a gradient and a rim — all three of the things Scott floated:

- **fill: gold** — `--dse-vp` (#e0b050; the same value as `--dse-tier-crit`, **one value in
  both dark and light**, #8a6a00 in print, D3 map :238/:194). Named in prose because Scott is
  colourblind: *a warm gold triangle.*
- **gradient:** `background-image: var(--dse-sheen-soft)` over the fill — the sheet's own
  ~3.5 % white top-down ramp (D3 map :166; no light override by design), so the apex catches
  light and the base sits darker. Real material, invisible as colour.
- **rim: steel grey** — a 1 px `--dse-metal-line` outline, drawn as an outer clipped box with
  the fill box `inset: 1px`, the same outline-plus-fill idea the shipped badge's clip-path
  polygons use.
- geometry: `0.82em × 0.68em`, `right: -0.34em; bottom: -0.26em` on the seal;
  `clip-path: polygon(50% 0, 100% 100%, 0 100%)` for ▲ (reward),
  `polygon(0 0, 100% 0, 50% 100%)` for ▼ (consequence), keyed off `data-rider` on the seal; at
  narrow it holds its size (`0.8 × 0.66em`) while the seal shrinks, exactly as round 6 argued.
  The `<svg>` goes away — the shape is CSS, so fill/gradient/rim are one rule.

**Rationale.** Three candidates were built and shot (`r7-{gold,seal,steel}-*.png`). *Forged
steel* (`--dse-metal-grad` + rim) is materially honest and still reads as "a small grey
triangle" — it does not answer "I dont love how basic they are". *Seal-hue* (green on a
success, red on a failure) gives the same rider two colours, and gives Scott nothing he can
see. **The rider is one channel, so it gets one identity colour, and the direction carries its
two values** — which is exactly the two-channel factoring the round-6 ruling picked `pip` for.
Gold is the only hue on this card that is neither of the outcome pair, so it can never
contradict the seal it rides: a gold ▼ on a green success ring cannot be misread as a failure
the way a red one could. It is also the card's existing "there is more here than the plain
state" colour (the Total-Success band, the brink alert) and the riders live **only** in the
rules strip, never on the board or in the band, so the two golds are never on screen in the
same band. Greyscale-checked: the gold goes to a mid grey that separates cleanly from the ring
stroke and the steel rim (`r7-gold-grey-dark.png`), so shape still carries everything. And it
retires the last near-white mark on the card — the current pip is `--dse-metal-bright`
(#d9dee1), which is what Scott objected to in round 2.

**Evidence:** `sc191-r7-pip-gold-dark.png` · `sc191-r7-pip-gold-light.png` ·
`sc191-r7-pip-gold-grey-dark.png` (the colourblind proof) · scratch:
`.../scratchpad/r7-probe/out2/r7b-final-narrow.png` (300 px).

---

## K. Open questions

**None.** Every call the mocks and the ledger could not answer was decided here and written
down: the board records no riders (§B.2), tallies are stored and delta-written rather than
recomputed (§B.3), the strip's badges are reused and its rows are copied (§D), UI state is
session-only (§C), the pip is gold (§J2), and the two montage print lines move under a
sanctioned rebaseline the ticket-owner asks for at review (§F). The one thing the implementer
must **not** decide alone is that rebaseline — it needs Scott's word on the ticket.
