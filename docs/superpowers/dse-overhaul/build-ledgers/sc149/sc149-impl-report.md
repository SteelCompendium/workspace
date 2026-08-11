# SC-149 — `ds-scc`: one public catch-all reference codeblock

**Status:** DONE_WITH_CONCERNS (one deliberate under-reach flagged for Scott: `ds-rule`).
**Branch:** `sc149-ds-scc` in `draw-steel-elements` (worktree
`/home/scott/code/steelCompendium/worktrees/sc149-ds-scc`). Branch point: dse main
`e141582`. Superproject pointer left unstaged; nothing landed, no tags, no deploy.

## Commits

| sha | subject |
|---|---|
| `ca81762` | `feat(scc)`: ds-scc catch-all reference element; retire the ten typed display aliases |
| `6710d49` | `feat(authoring)`: reference inserts route through ds-scc; snapshots only for the three typed formats |
| `85052c9` | `test(harness)`: harness registers the ten internal display defs; demo vault moves to ds-scc |
| `8eaed2b` | `docs(scc)`: document ds-scc as the one compendium-reference block |

## Design decisions taken

### 1. Statblock/feature/featureblock codes inside `ds-scc` render their REAL views

The brief left this a judgement call ("render via their real views if the machinery allows
it cheaply, or a clear error card … do not half-render"). It turned out to be one map
entry each, so the real views won.

`RefUnwrapView` already resolves a code to a typed model through
`CompendiumIndex.getEntity().model()`, which dispatches through `TYPE_ADAPTERS`. For a
statblock code that model already IS a `StatblockConfig` — exactly what
`StatblockElementView` mounts. The only thing missing was a way to choose the view AFTER
resolution instead of at wrap time. Added:

- `WithReferenceOptions.baseForType?: (type) => ElementDefinition<unknown> | undefined` —
  absent for every typed element (they render one model shape, so their own base is always
  right), supplied only by `ds-scc`. `RefUnwrapView` consults it right before
  `entity.model()`; `undefined` → a "no renderer in this plugin" error card, never a
  half-render.
- `withReference()` now returns a `ReferenceElement<M>` = the wrapped def **plus** the
  `base` def it wraps. That is how `ds-scc` reaches the eleven inner defs without either
  re-exporting eleven consts by hand or re-declaring them.
- `baseForSccType` (`src/elements/scc/definition.ts`) maps SCC `type` → view by keying a
  small table on the alias `TYPE_ADAPTERS` **already** assigns each family. No second
  type-matching regex exists anywhere; `adapterForType` stays the single source of truth
  for "which family is this type".

Net effect: one element renders kits, conditions, treasures, ancestries, cultures,
careers, classes, titles, perks, complications, rules (model-less generic card),
statblocks, features and featureblocks. A `type` no adapter claims has no model either, so
it can never reach a view.

### 2. STRICT body, with the message set as the contract

`parseSccBody(raw)` accepts a bare SCC code or an `scc:`/`scc.v1:`-prefixed one and
nothing else. Every other shape throws a user-facing message the pipeline error-cards:

| body | message |
|---|---|
| multi-line (inline YAML) | "This block has more than one line. …must be a single SCC code, e.g. `mcdm.heroes.v1/kit/panther`." |
| single-line YAML / prose | "`name: Panther` is not a full SCC code. …" |
| `[[wikilink]]` / `@path` | "Wikilink and @path references are not supported here — … Use \"Draw Steel: Insert compendium reference\" to paste the code for an entry." |
| bare slug (`panther`) | "`panther` is not a full SCC code. …" |
| empty | "Empty block. …" |
| `scc.v2:…` | "…is not a supported SCC reference (only `scc:`/`scc.v1:` codes resolve)." |

Scott's open question ("should ds-scc also accept `[[wikilink]]`/`@path`?") is implemented
as the documented default: **strict**, with a message that points at the insert command.
Prefixed bodies go through `normalizeSccTarget` (the same canonical normalizer inline
`scc.v1:` links use), so version refusal and `#anchor` stripping are shared, not
reimplemented. The code regex requires 2+ slash-separated segments rather than exactly 3,
so a future deeper code isn't rejected by a regex nobody remembered to widen.

`ds-scc` replaces `withReference`'s ref-or-inline `parse` outright — there is no
inline branch to fall through to, which is what makes the strictness total.

### 3. `ds-rule` was left registered — flagged for Scott

The ticket and the brief both enumerate exactly ten aliases; `ds-rule` (the `genericCard()`
sibling) is in neither list. It is arguably the same class of thing, and `ds-scc` already
renders `rule.*` codes through the same generic card, so it is now redundant — but removing
a surface the ruling never named is over-reach, and restoring it is one line either way.
**Left public, raised as the top open question.** Everything else treats it as
display-family: a reference insert for a rule type produces `ds-scc`, and a rule cannot be
snapshotted.

### 4. Insert commands: reference vs. snapshot split by family

`typeToAlias` became two functions, because a reference and a snapshot no longer answer the
same question (`src/services/typeAdapters.ts`):

- `referenceAliasForType(type)` → `ds-statblock`/`ds-feature`/`ds-featureblock` for the
  three public typed families, `ds-scc` for everything else **including a type no adapter
  claims** (previously that fell back to `ds-rule`).
- `snapshotAliasForType(type)` → those three families or `null`.

The snapshot command's modal now filters non-snapshottable entries out of its results
(new `CompendiumSearchModal` `filter` option, applied AFTER the `type:`/`source:` query
filters so a user cannot type past it), its placeholder says what it searches, and
`insertFullBlock` returns `false` + a Notice for any other caller. Statblock/feature/
featureblock snapshots are untouched, pending Scott's separate ruling.

The `/ds` suggester and the per-element `insert-<id>` commands are pure registry loops, so
unregistering the ten deleted "Insert Draw Steel: Kit" and `/dskit` with no code change —
deliverable 7 falls out of the registration change. `ds-scc`'s starter body is
`mcdm.heroes.v1/kit/panther` (a real, resolvable code — also the harness/demo-vault
fixture), pinned by a test that the scaffold is exactly ```` ```ds-scc\n<code>\n``` ````.

### 5. Demo vault: the ten inline-YAML notes are gone, replaced by two ds-scc notes

`demo-vault/Harness/` is git-ignored and regenerated by `visual-harness/notes-gen.mjs` from
`aliases.json` (which `aliases.test.ts` pins to the public registry). So unregistering the
ten deletes their notes automatically. In their place:

- `Harness/scc.md` — generated like any element note, from the new
  `src/elements/scc/example.yaml`; resolves against the seeded `DS Compendium/kit/panther.md`.
- `Harness/by-scc-kit.md` — fence changed `ds-kit` → `ds-scc`. Same code, same file, same
  nested-`ds-feature` recursion proof; the Obsidian camera's assertion follows to
  `[data-dse-element="scc"]` (`SPECIAL_NOTE.elementSel`).
- `Harness/scc-demo.md` (new) — the one public element against every code the seeded
  compendium subtree actually contains (kit, condition, rule) plus two strict-body error
  cards. Codes are read from `COMPENDIUM_SEED_FILES`' own frontmatter at generation time,
  so the note cannot drift from the subtree.

Verified by running `node visual-harness/notes-gen.mjs`: 23 notes, 3 seeds, both specials
written, exit 0. The inline-YAML exercise for the ten lives on in the browser harness.

### 6. No `ds-scc` browser fixture — deliberate, and it protects the freeze

Two independent reasons, both hard:

1. The harness has no `cx.compendium`, so **any** `ds-scc` body renders an error card, and
   `mountFromParams` counts an error card as a failed shot. There is no non-error state to
   photograph without building a compendium into the browser harness (new infra the brief
   ruled out).
2. `gallery--legacy-{dark,light}.png` are FROZEN and the gallery sweeps
   `Object.keys(FIXTURES)` — adding a key would move those bytes.

`fixtures.test.ts` carries this as a documented `NO_FIXTURE_IDS = ['scc']` exclusion rather
than a silently weakened assertion, plus a new test that the ten internal defs are still
mountable in the harness registry. `ds-scc`'s coverage is
`test/dom/elements/sccElement.test.ts` (real `CompendiumIndex` over the md-dse fixtures).

### 7. Keeping the freeze green

The ten definitions keep their ids AND their aliases verbatim. The harness gallery prints
`<id> (<alias>)` into a frozen shot and the harness host reports the alias as the fence
language — renaming either would have been a freeze break. `visual-harness/entry.ts` gains
`registerHarnessElementDefinitions` (public registry + the ten internal defs), used by both
`mountFromParams` and `fixtures.test.ts`. Result: 314 shots, 0 FAIL, freeze 188/188
byte-identical, zero renames.

## Per-file summary

**New**
- `src/elements/scc/definition.ts` — `ds-scc`: `parseSccBody` (strict body), `baseForSccType`
  (type → view), the def itself.
- `src/elements/scc/example.yaml` — `mcdm.heroes.v1/kit/panther` (D9 starter body; also the
  notes-gen fixture body).
- `test/dom/elements/sccElement.test.ts` — 24 tests: the message set, the dispatch table,
  end-to-end renders of kit/condition/rule/statblock codes against real md-dse fixtures,
  both ends of the degrade ladder, and the inline-YAML refusal.

**Changed**
- `src/elements/shared/withReference.ts` — `ReferenceElement<M>` (exposes `.base`),
  `baseForType` option.
- `src/elements/shared/RefUnwrapView.ts` — resolve the base def from the resolved entity's
  type before building the model; `mountBase` takes the chosen base.
- `src/elements/display/displayFamily.ts` — return `ReferenceElement<M>` (type only).
- `src/elements/display/index.ts` — `displayElements` → `INTERNAL_DISPLAY_ELEMENTS` (the ten;
  `ruleElement` excluded), with the ruling written down at the top of the file.
- `main.ts` — registers `sccElement` + `ruleElement` in place of the eleven.
- `src/services/typeAdapters.ts` — `typeToAlias` → `referenceAliasForType` +
  `snapshotAliasForType`; `alias` field doc updated (internal names now).
- `src/authoring/compendiumInsert.ts` — reference alias routing; `insertFullBlock` refuses
  non-snapshottable types (returns boolean, Notice); snapshot modal filter + placeholder.
- `src/authoring/CompendiumSearchModal.ts` — `filter` option.
- `visual-harness/entry.ts` — `registerHarnessElementDefinitions`.
- `visual-harness/aliases.json` — ten removed, `scc: ds-scc` added (23 entries).
- `visual-harness/notes-gen.mjs` — by-scc-kit fence, new scc-demo note.
- `visual-harness/obsidian-camera.mjs` — `SPECIAL_NOTE.elementSel` `kit` → `scc` + comments.
- Tests retargeted: `plugin-wiring` (id list), `insert` (ds-scc present / ten absent +
  scaffold body), `suggest` (same, both directions), `compendiumSearchModal` (the two alias
  lookups, ds-scc reference block, snapshot refusals, modal filter), `fixtures`
  (harness registry + exclusion).
- Docs: `docs/compendium-sync.md` (new user section), `docs/index.md`, `README.md`,
  `CHANGELOG.md` (7.0.0 FEATURE), `.repo-docs/integration.md` (language table + the ruling +
  dispatch + insert split), `.repo-docs/architecture.md` (layouts still live),
  `CLAUDE.md` (element count, the ds-scc seam).

No schema/YAML-shape documentation was added anywhere (SC-142 requirement); the user-facing
section says explicitly that the rendered card is not a specified format.

## Battery (verbatim)

Baseline at branch point: tsc/lint clean · jest 2540 passed +1 skipped / 159 suites ·
shots 314 · freeze 188/188 · parity 0/0/16.

```
$ npm run tsc
exit 0 (no output)

$ npm run lint
exit 0 (no output beyond the pre-existing .eslintignore deprecation warning)

$ npx jest
Test Suites: 1 skipped, 160 passed, 160 of 161 total
Tests:       1 skipped, 2586 passed, 2587 total
Snapshots:   3 passed, 3 total
exit 0

$ npm run shots
all shots written to .../visual-harness/shots
314 shots, 0 FAIL

$ bash .superpowers/sdd/check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots
freeze OK (188/188 legacy+print PNGs byte-identical)
exit 0

$ npm run parity
**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**
exit 0
```

Deltas: jest **+46 tests, +1 suite** (2540 → 2586 passed; the new `sccElement` suite is 24,
the rest are retargeted/added cases in insert/suggest/compendiumSearchModal/fixtures).
Everything else unchanged: shots 314, freeze 188/188 with zero renames, parity composition
byte-identical.

`obsidian-shots` was NOT run (display `:1` off-limits per the brief). Two of its inputs
changed and are therefore unverified against a real Obsidian: the element sweep loses the
ten display notes and gains `scc` (`aliases.json`), and the by-scc-kit recursion special now
asserts `[data-dse-element="scc"]`. Both are mechanical and the assertions are
self-verifying when the camera next runs; `notes-gen.mjs` itself was run and is clean.

## Concerns / open items

1. **`ds-rule` (top question for Scott).** Left registered because the ruling names ten.
   With `ds-scc` rendering `rule.*` codes, it is now a redundant second public way to do
   the same thing, and its inline mode ("raw markdown in a card") is itself an unspecified
   UI commitment. One line in `main.ts` either way.
2. **Snapshot for statblock/feature/featureblock** is untouched, per the brief — Scott's
   open question is unanswered. The code is already shaped for it: delete the three entries
   from `DS_BLOCK_ALIASES`' snapshot use and the command has nothing to offer.
3. **Obsidian ground truth for `ds-scc` is uncaptured** (see battery note). The demo-vault
   notes are in place for whoever next has a display.
4. **Obsidian shot count will drop** (~145 → ~101 + 4 for `scc`): the ten display notes no
   longer exist to photograph. Expected, not a regression — those cards are still covered by
   the browser harness's frozen shots.
5. **`ds-scc` has no Steel-specific styling of its own.** It reuses each family's existing
   card, which is the point; but the error-card path is the plugin's generic one, so a
   user who fat-fingers a code sees a developer-flavoured card ("failed to render (render)").
   Worth a nicer "unresolved reference" treatment eventually — not filed, mentioning it here.

---

# FIX ROUND (2026-08-11) — review verdict addressed, then rebased

Review: `.superpowers/sdd/sc149/sc149-review-report.md` (FIX ROUND — 1 HIGH, 3 MEDIUM,
2 LOW, 2 NIT, plus the `ds-rule` ruling). All findings fixed; `ds-rule` unregistered by
orchestrator ruling. Branch then rebased onto `origin/main` **`5abfa62`** (SC-143, SC-140,
SC-145 had landed) — **no conflicts** — and one forward-looking reconciliation for SC-141
landed on top.

## Commits (post-rebase shas — the first four were replayed unchanged)

| sha | subject |
|---|---|
| `b439a3d` | feat(scc): ds-scc catch-all element; retire the ten typed display aliases |
| `2ecc1e4` | feat(authoring): reference inserts → ds-scc; snapshots for the three typed formats |
| `bebb754` | test(harness): harness registers the internal display defs; demo vault → ds-scc |
| `550c0a7` | docs(scc): document ds-scc |
| `bfe6404` | **fix round A** — H-1, M-3, L-1, N-1 |
| `169f2a6` | **fix round B** — ds-rule unregistered, M-1, M-2, N-2, L-2 |
| `388c25c` | **C3** — insert routing on the exported family regexes |

## Per finding

**H-1 (HIGH) — ds-scc rendered statblock/feature/featureblock unstyled.** `RefUnwrapView.
mountBase` now re-stamps `data-dse-element` to the base that actually rendered, success
path only (error/notice cards keep `scc`; `onUpdate` resets before re-resolving). The
reviewer's prescription, one line.

Regression coverage is `test/dom/elements/sccStyleParity.test.ts`, and it is stated in
terms of the CSS rather than the attribute: it parses the shipped `styles-source.css`
(brace-depth walk, at-rules flattened, selector lists split), keeps every selector that
requires `[data-dse-element='statblock'|'feature']`, renders the same code twice — once
through the typed element, once through `ds-scc` — and asserts the set of selectors
matching each is **equal**, with a non-vacuity guard on both sides. Plus the action-spine
rule by name (plan 25's sanctioned change, which was silently reverting) and three
preference variants (`sbDensity=compact`, `sbStats=ledger`, `sbColumns=wide`). **Can-fail
proof: with the one-line fix reverted, all 6 cases fail.** No featureblock case — no
md-dse fixture is a featureblock; the mechanism is shared and covered by the other two.

The knock-on the review predicted: `obsidian-camera.mjs`'s `SPECIAL_NOTE.elementSel` goes
back to `'kit'`, and `sccElement.test.ts`'s root-id assertion becomes a per-family table
(kit/condition/rule/statblock) plus "a refused body keeps `scc`".

**M-1 — obsidian-shots would hard-fail on `perk`.** `GENERIC_SIDEBAR_IDS` entries became
objects with an optional `element` (the id the MOUNTED root carries — `ds-scc` re-stamps
it), and `perk` is replaced by `{ id: 'scc', element: 'kit' }`. The markdown-pipe-table
coverage the constant exists for is **preserved, not dropped**: `Harness/scc.md` resolves
`kit/panther`, whose real compendium body carries the signature ability's pipe table — so
a table is still photographed at 300px, now through the hybrid render path. Every consumer
(`sidebarMatch`, `requireNote`, the loop, the shot-count total) updated; `--element=
sidebar-scc` still selects it.

**M-2 — the 7.0.0 notes still advertised the retired aliases.** The old D6 entry now
describes `ds-scc` + `ds-sb`/`ds-ft`/`ds-fb` and drops the bare-slug/`@path`/`[[wikilink]]`
claim for the display families; the kit-card entry names the card, not `ds-kit`; the
search+insert entry says snapshots are statblock/feature/featureblock only. `grep` for the
eleven aliases in CHANGELOG.md now returns nothing.

**M-3 — bodies that aren't valid YAML never reached `parseSccBody`.** New
`ElementDefinition.parseHandlesRawBody` (set only by `ds-scc`): when `parseYaml(source)`
throws, the pipeline calls `def.parse(undefined, source)` instead of error-carding with
the parser's words. Two new targeted messages — a pasted inline link (**the insert modal's
own Shift output**, which now names the code it already contains) and a backticked/fenced
code — and the whitespace rule became "any internal whitespace", so `name: [Panther` reads
as "not a full SCC code" rather than a flow-sequence parser error. A tab-indented code now
simply resolves. All five reviewer-listed bodies pinned, with an assertion that no
`line N, column N` text survives anywhere.

**L-1 — the developer-flavoured frame.** `ds-scc` refusals and unresolved references now
render `.dse-ref-notice` (message + a muted "what to do" line, informational blue left
bar), never `<name>: failed to render (<stage>)`. Opt-in via `WithReferenceOptions.
friendlyErrors`, so typed elements keep the developer frame; `.dse-ref-web-card` gained the
same classes so the two read as one family. A refusal is now RETURNED from `parse` (the new
`RefOrInline` `invalid` variant) rather than thrown, so the view owns presentation. The six
pinned messages are unchanged, and the test asserts the card contains neither "failed to
render" nor the element name.

**L-2** — `visual-harness/README.md`'s two stale rows (`ds-kit`, `sidebar-perk`).
**N-1** — `SCC_CODE_RE` accepts a one-character non-leading segment.
**N-2** — the statblock reference/snapshot insert writes the canonical `ds-sb`.

**`ds-rule` — UNREGISTERED** (orchestrator ruling; flagged for Scott's veto). Moved into
`INTERNAL_DISPLAY_ELEMENTS`, dropped from `aliases.json`, tests retargeted, its Harness
note is no longer generated. The review's probes are the reason: with no `baseForType` it
rendered ANY code through its own generic card — a kit code gave a title and a badge with
every stat dropped, a statblock code gave a **completely empty card**, no error either
time — and it still accepted the `[[wikilink]]`/`@path` forms `ds-scc` refuses. Public
registry is now 22 elements and exactly one reference block.

## Rebase + the SC-141 reconciliation (C1/C2/C3)

Rebased onto `origin/main` `5abfa62` — clean, no conflicts (including CHANGELOG).
**SC-141 had NOT landed** at rebase time (`origin/main`'s `typeAdapters.ts` still has the
narrow `/^feature($|\.)/` inline and exports no `FEATURE_TYPE_RE`), so its reconciliation
was implemented in the shape that makes its arrival a no-op here:

- **C3 (done).** `FEATURE_TYPE_RE` and `FEATUREBLOCK_TYPE_RE` are now extracted and
  exported alongside the existing `STATBLOCK_TYPE_RE` (the names SC-141's round exports),
  `TYPE_ADAPTERS` dispatches on them, and `referenceAliasForType`/`snapshotAliasForType`
  route on the SAME regexes instead of an alias set. So when SC-141 widens
  `FEATURE_TYPE_RE` to claim `ability`/`trait`, the whole feature family rides the typed
  `ds-feature` path for **both** commands automatically — reference and snapshot — which
  is the ruling: snapshots survive for the stable typed formats, and ability/trait YAML IS
  the documented `ds-feature` format. Same for any leaf a widened `FEATUREBLOCK_TYPE_RE`
  claims. A new test pins the *invariant* over twelve types ("the insert commands treat
  this as typed" ⟺ "TYPE_ADAPTERS renders it with a ds-block adapter") rather than today's
  list, so a leaf added to one branch and not the other fails.
- **C1 (done).** The `baseForSccType` doc no longer claims an unclaimed type "never reaches
  a view regardless" — it now says the no-renderer card is a real user-visible outcome,
  only as correct as the family scopes, and cites SC-141's 716 codes as the case in point.
  A feature code through `ds-scc` has its own end-to-end test asserting the REAL feature
  card mounts (`data-dse-element="feature"`, `.dse-feature`, the right title).
- **C2 (NOT APPLICABLE YET — carry forward).** SC-141's three `typeToAlias` assertions do
  not exist on `origin/main`, so there was nothing to port. **Whoever lands second owns
  it:** `typeToAlias` is deleted on this branch and replaced by `referenceAliasForType` /
  `snapshotAliasForType`. If SC-141 lands after SC-149, its rebase must convert those three
  assertions (`typeToAlias('ability') === 'ds-feature'` and friends) into
  `referenceAliasForType`/`snapshotAliasForType` equivalents — `tsc` will catch the stale
  import, but a silently dropped assertion it will not.

## Battery after the rebase (verbatim)

```
$ npm run tsc          → exit 0, no output
$ npm run lint         → exit 0, no output (only the pre-existing .eslintignore warning)

$ npx jest
Test Suites: 1 skipped, 162 passed, 162 of 163 total
Tests:       1 skipped, 2636 passed, 2637 total
Snapshots:   3 passed, 3 total
exit 0

$ npm run shots        → 334 shots, 0 FAIL, exit 0
$ check-freeze.sh …    → freeze OK (200/200 legacy+print PNGs byte-identical), exit 0
$ npm run parity       → **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**, exit 0
$ node visual-harness/notes-gen.mjs → 22 notes, 3 seeds, both specials, exit 0
```

Reading the numbers honestly:

- **Freeze went 188 → 200 lines while this branch was in flight** — the shared baseline was
  widened by the branches that landed under us. Mid-fix-round (pre-rebase) the check read
  `188/200 producible OK, 12 missing, 0 checksum mismatches`; after rebasing onto their
  landing the 12 became producible and it reads a clean **200/200**. **Zero existing lines
  mismatched at any point**, and this branch never touched the baseline or the script (no
  `*.pre-sc149*` backup exists because none was needed).
- **Shots 314 → 334** for the same reason (the landed branches' new fixtures). No `scc*`
  shot exists, by design.
- **Jest 2586 → 2636.** This branch's own fix round adds the 6-case style-parity suite and
  ~14 cases across `sccElement`/`compendiumSearchModal`; the rest came in with the rebase.
- `obsidian-shots` still not run (no display). Its three moved inputs are now four (the
  sidebar slot), all mechanical and self-asserting; the camera's own assertions fail loudly
  if any is wrong.

## Fix-round concerns

1. **`ds-rule`'s unregistration is the one thing Scott may want to veto** — flagged
   prominently in the Linear follow-up. Restoring it is one line, but the review's probes
   (empty card for a statblock code) argue strongly against.
2. **C2 is an unresolved cross-branch handoff**, not a defect here — see above. Whoever
   lands second must port SC-141's three assertions.
3. **The notice card's messages still contain markdown-style backticks** around code
   (`` `ds-scc` ``), rendered as literal characters in prose. Deliberate: the six messages
   are the pinned contract and this round was told to keep them. Cosmetic, easy to strip.
4. **Featureblock has no md-dse fixture**, so the style-parity suite covers statblock and
   feature only. Same mechanism, same one-line fix; a featureblock fixture would close it.

---

## FINAL REBASE — onto `23ed677` (SC-141 landed)

Superseded the "C2 not applicable yet" note above: SC-141 landed while this branch was in
review, so the reconciliation is now real rather than anticipatory. Rebased
`5abfa62 → 23ed677`. **Final tip: `20a78e2`.**

### Conflicts and how they were reconciled (2)

1. **`src/services/typeAdapters.ts`** — both sides exported `FEATURE_TYPE_RE` and
   `FEATUREBLOCK_TYPE_RE`. Resolved to **exactly one set of constants, SC-141's**, verbatim
   with its full doc comments; my narrower duplicates
   (`/^feature($|\.)/`, `/(^|\.)featureblock$/`) were deleted outright. SC-141's semantics
   are authoritative and strictly wider:
   - `FEATURE_TYPE_RE = /^(feature|ability|trait)($|\.)/`
   - `FEATUREBLOCK_TYPE_RE = /(^|\.)featureblock$|^dynamic-terrain($|\.)/`

   My `TYPED_FAMILIES` insert routing now consumes those landed constants unchanged — the
   whole point of C3 — so nothing in the routing needed editing. Both constants' doc
   comments gained a line naming the insert commands as a third consumer, so the next
   person widening a scope knows what else moves.
2. **`test/dom/authoring/compendiumSearchModal.test.ts`** (twice, once per replayed commit)
   — SC-141 added assertions to the `typeToAlias` suite this branch replaced. Resolved by
   **keeping both sides**: my `referenceAliasForType` suite, and SC-141's assertions ported
   (see C2 below).

Everything else replayed clean, including CHANGELOG (no overlap: SC-141's entries are
elsewhere in the 7.0.0 section).

### C2 — SC-141's assertions live on

`typeToAlias` is deleted on this branch, so its five landed test cases were **ported, not
dropped**, into `describe('SC-141 type scopes, on both insert lookups (SC-149 C2 port)')` —
and re-stated on **both** replacement lookups, because under SC-149's split "which fence"
and "may this be snapshotted" are two questions and SC-141's answer is the same for both
(this content IS the documented `ds-feature`/`ds-fb` format):

| SC-141's landed assertion | Ported to |
|---|---|
| `typeToAlias('ability') === 'ds-feature'` | `referenceAliasForType`/`snapshotAliasForType`, plus `ability.tactician` |
| `typeToAlias('trait') === 'ds-feature'` | same pair |
| `typeToAlias('featureblock') === 'ds-featureblock'` (featureblock wins over the widened feature scope) | same pair |
| `typeToAlias('dynamic-terrain'\|'dynamic-terrain.mechanisms') === 'ds-featureblock'` | same pair |
| `typeToAlias('nonsense.unknown-type') === 'ds-rule'` | `referenceAliasForType(...) === 'ds-scc'` — same intent (the generic destination), current answer, since `ds-rule` is no longer registered and `ds-scc` renders an unknown type through that same generic card. Comment records the substitution. |

The C3 invariant list also gained `ability`, `trait`, `dynamic-terrain`,
`dynamic-terrain.mechanisms` — the four types that changed family without either branch
being edited, i.e. exactly what the invariant exists to catch.

### Real-corpus coverage SC-141's landing makes reachable (commit `20a78e2`)

Before SC-141 an `ability`-typed file (621 in the corpus) and a `dynamic-terrain`-typed one
(35) were claimed by no adapter, so `ds-scc` would have shown "found but not renderable —
re-sync" against a perfectly good compendium. `ds-scc` is now the only public way to
reference either, so both are pinned through the public element on the real md-dse fixtures
(`feature/ability/fury/level-1/hit-and-run.md`, `dynamic-terrain/mechanisms/pillar.md`):

- end-to-end: the ability renders the REAL feature card ("Hit and Run"), the terrain file
  the REAL featureblock card ("Pillar"), each re-stamping the root to its resolved family;
- **the H-1 style-parity suite runs its feature rows twice** — hand-shaped `feature.*` code
  AND the real ability file — because the two reach the view down different paths (widened
  family regex vs. the original literal) and the CSS claim must hold for the shape users
  actually write. Same for the action-spine case.
- **Can-fail proof for the pairing:** narrowing `FEATURE_TYPE_RE` back to its pre-SC-141
  `/^feature($|\.)/` fails **10 cases** across the three suites — so these tests really do
  exercise the landed widened scope, in both the insert routing and the render path.

### Battery at `20a78e2` (verbatim)

```
$ npm run tsc          → exit 0, no output
$ npm run lint         → exit 0, no output

$ npx jest
Test Suites: 1 skipped, 164 passed, 164 of 165 total
Tests:       1 skipped, 2680 passed, 2681 total
Snapshots:   3 passed, 3 total
exit 0

$ npm run shots        → 334 shots, 0 FAIL, exit 0
$ check-freeze.sh …    → freeze OK (200/200 legacy+print PNGs byte-identical), exit 0
$ npm run parity       → **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**, exit 0
$ node visual-harness/notes-gen.mjs → 22 notes, 3 seeds, both specials, exit 0
```

Shots stay **334** across this rebase (SC-141 added no fixture) and freeze stays a clean
**200/200**, unchanged and untouched. Jest went 2636 → **2680**: SC-141's own landed cases
plus this branch's ~14 new ones (the C2 port, the two real-corpus renders, the doubled
style-parity rows, the widened dispatch table).

Nothing user-visible changed in this rebase — no new Linear comment. The two carried-over
concerns stand (`ds-rule`'s unregistration is Scott's to veto; featureblock style parity is
now covered by the real dynamic-terrain render but still not by a *frozen shot*), and the
C2 handoff listed above is **closed**.
