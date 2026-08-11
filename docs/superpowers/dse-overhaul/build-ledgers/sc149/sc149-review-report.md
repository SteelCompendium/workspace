# SC-149 — independent adversarial review

**Verdict: FIX ROUND.** One HIGH (a real, measured visual regression on the exact surface
the feature advertises), one MEDIUM that will hard-fail `obsidian-shots` the next time it
runs, one MEDIUM release-notes inaccuracy, plus the `ds-rule` decision Scott still owes.
Nothing found in the core dispatch, the strict-body contract, the registry retirement, the
insert split or the demo vault — those are all correct and well-tested. The battery is
genuine (reproduced end to end).

Reviewer: independent, worktree `/home/scott/code/steelCompendium/worktrees/sc149-ds-scc`,
`e141582..8eaed2b`. No code modified; two temporary probe suites and one DOM-dump test were
added, run and deleted (worktree `git status` clean at `8eaed2b`).

---

## Battery — reproduced independently

All commands via `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && …'`, each gate
the last thing evaluated, output redirected to files (never piped).

| Gate | Result | Exit |
|---|---|---|
| `npm run tsc` | clean, no output | 0 |
| `npm run lint` | clean (only the pre-existing `.eslintignore` deprecation warning) | 0 |
| `npx jest` | **2586 passed / 1 skipped / 2587 total, 160 passed suites (1 skipped) of 161, 3 snapshots** | 0 |
| `npm run shots` | **314 shots, 0 FAIL** (314 `ok` lines, 314 files, 0 named `scc*`) | 0 |
| `check-freeze.sh <shots>` | **`freeze OK (188/188 legacy+print PNGs byte-identical)`** | 0 |
| `npm run parity` (last) | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`** | 0 |

`obsidian-shots` NOT run (no display) — per instruction. See **M-1**: it will fail when it is.

**Freeze baseline untouched by the implementer.**
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256` is
188 lines, `md5 bc475c5624d8b95f9929ab1e177a32ea`, mtime `2026-08-10 19:54` — the same
timestamp as `freeze-baseline.sha256.pre-sc123-landing-bak`, i.e. the SC-123 landing, which
predates all four SC-149 commits. No `*.pre-sc149*` backup exists. `check-freeze.sh` is
likewise unmodified (mtime 18:37, the SC-146 landing). Workspace `git status` shows only
`M draw-steel-elements`; the sc149 worktree superproject carries the unstaged pointer bump
`e141582 → 8eaed2b`, exactly as the impl report says.

---

## Verdict per claim

| # | Claim | Verdict |
|---|---|---|
| 1 | `ds-scc` renders any entry; display families via internal layouts, sb/feature/fb via their REAL views; unclaimed types → explicit no-renderer card | **PARTLY TRUE — see H-1.** The *DOM* is byte-identical to the typed element's; the *styling* is not, because the pipeline stamps `data-dse-element="scc"` and 84 CSS rules require `statblock`/`feature`/`featureblock`. Display families are unaffected (0 element-scoped rules). No-renderer card verified verbatim. |
| 2 | Strict body; six distinct pinned messages | **TRUE for the six named forms** (each verified in the *rendered DOM*, not just as a throw). **Incomplete** for bodies that aren't valid YAML — see M-3. |
| 3 | The ten aliases are gone from the public registry; ids/aliases unchanged internally | **TRUE.** All ten aliases *and* all ten ids are unregistered; `ds-sb`/`ds-statblock`/`ds-ft`/`ds-feat`/`ds-feature`/`ds-fb`/`ds-featureblock`/`ds-scc`/`ds-rule` all resolve; 23 registered elements; shots 314 and freeze 188/188 unmoved. |
| 4 | Insert commands split correctly | **TRUE.** Kit ref → ```` ```ds-scc ```` + full code; statblock ref → ```` ```ds-statblock ````; rule/unknown/empty type → `ds-scc`. Snapshot modal *filters* display families out of its result list (verified with an empty query *and* with `type:kit` — a user cannot type past it); `insertFullBlock` returns `false` + Notice for any other caller. Nit N-2. |
| 5 | Demo vault correct | **TRUE.** `notes-gen.mjs` re-run: 23 notes, 3 seeds, both specials, exit 0. No display Harness notes remain. `scc.md`, `scc-demo.md`, converted `by-scc-kit.md` all present; every code in them (`mcdm.heroes.v1/kit/panther`, `…/condition/bleeding`, `…/rule.combat/turn`) matches the seeded file's own `scc:` frontmatter byte for byte. No Harness note references a removed alias. |
| 6 | Battery numbers | **TRUE.** Every figure reproduced exactly (table above). |

---

## Findings

### H-1 (HIGH) — `ds-scc` renders statblock/feature/featureblock *unstyled*: the host is stamped `data-dse-element="scc"`, so 84 element-scoped CSS rules never match

**Where:** `src/framework/pipeline.ts:358` (`root.setAttribute('data-dse-element', def.id)`)
× `src/elements/shared/RefUnwrapView.ts:137-158` (`baseForType` picks a *different* base but
the root keeps `ds-scc`'s id) × `styles-source.css` (84 rules).

**Measured, in a real browser** (Chromium via Playwright, the built `visual-harness/dist/harness.css`
+ `vars.css`, steel/dark, identical inner DOM dumped from the real pipeline for both):

| property | `ds-ft` (feature) | `ds-scc` (same feature code) |
|---|---|---|
| host `background-image` | `linear-gradient(160deg, rgb(35,42,46), rgb(24,28,31))` | **`none`** |
| host `padding` | `24px` | **`0px`** |
| host `margin-top` / `-bottom` | `24px` / `24px` | **`0px` / `0px`** |
| host `position` | `relative` | **`static`** |
| host `::before` (the `.ds-container` hairline) | `content:""`, `192px × 1px`, gradient | **`content: none`** |
| inner `.dse-feature` `padding` | `0px` | **`0 0 0 11.8px`** |

That last row is the sharpest: `[data-dse-theme='steel'][data-dse-element='feature'] .dse-feature[data-dse-act]`
is plan 25's **standalone action-spine removal** — a Scott-approved change that required a
sanctioned five-line freeze rebaseline (2026-08-08). Through `ds-scc` it silently reverts:
a standalone feature renders with the *nested/embedded* spine indent.

| property | `ds-sb` (statblock) | `ds-scc` (same statblock code) |
|---|---|---|
| host `margin-top` / `-bottom` | `8px` / `8px` | **`0px` / `0px`** |
| `.dse-sb__grid` columns with `data-dse-density=compact` | `578.203px × 2` (pref applies) | **`587px × 2` (pref is a no-op)** |

The preference attributes *are* stamped on the `ds-scc` root — I confirmed all sixteen
(`data-dse-sb-stats`, `-density`, `-sb-charline`, `-sb-charbox`, `-sb-featstyle`,
`-sb-columns`, `-sb-villain`, `-kwusage`, `-disttarget`, `-fb-featstyle`, `-fb-stats`, …)
are identical between the two roots. They just have no selector to pair with.

**Rule counts (whole-stylesheet parse, comments stripped, rules whose selector *requires*
that element id):** statblock **40** (13 Steel-scoped), feature **22** (10 Steel-scoped),
featureblock **22** (16 Steel-scoped) = **84**. Display families (`kit`, `condition`,
`treasure`, `ancestry`, `culture`, `career`, `class`, `title`, `perk`, `complication`,
`rule`): **0** — which is why the kit/condition/rule screenshots in the Linear comment look
right and this slipped through.

**Failure scenario (the advertised one).** `CHANGELOG.md:18-21` and
`docs/compendium-sync.md` both promise "a kit, a condition, a rule, **a statblock**,
whatever the code points at." A user writes ```` ```ds-scc ```` with a monster code and
gets a statblock with no block rhythm and with **every one of the SC-123/SC-146 statblock
and featureblock preferences silently dead** — two blocks in the same note showing the same
monster (one `ds-sb`, one `ds-scc`) render differently, and the settings panel appears
broken for the `ds-scc` one. A feature code is worse: no panel, no gradient, no hairline,
wrong spine.

Secondary consequence: the parity gate's plugin selectors for the `statblock-wrap` /
`featureblock-wrap` / feature pairs are literally `[data-dse-element='statblock']` etc., so
`npm run parity` does not cover `ds-scc`'s output at all — its green result says nothing
about this surface.

**Prescription (preferred, one line).** In `RefUnwrapView.mountBase`, when `baseForType`
selected a base other than `this.base`, re-stamp the root:
`root.setAttribute('data-dse-element', base.id)` on the success path only (error cards must
stay `scc`). That makes "`ds-scc` renders the REAL view" true at the CSS layer too, and it
is the honest semantics — the element that rendered *is* the statblock view. Knock-ons, all
small: `test/dom/elements/sccElement.test.ts:122` asserts `'scc'`; `obsidian-camera.mjs`'s
`SPECIAL_NOTE.elementSel` goes back to `'kit'`; add regression tests asserting (a) the root
id equals the resolved family and (b) at least one preference-variant selector matches. No
frozen browser shot can move (there is no `scc` fixture; the ten keep their own roots).

Alternatives if that attribute must stay `scc`: stamp a parallel
`data-dse-rendered-as="<base.id>"` and widen the 84 selectors to
`:is([data-dse-element='X'], [data-dse-rendered-as='X'])` (large CSS churn, freeze risk); or
restrict `baseForSccType` to the display families and error-card sb/feature/fb codes with
"use `ds-sb`" (a scope reduction Scott would have to accept). I recommend the one-liner.

---

### M-1 (MEDIUM) — `npm run obsidian-shots` will hard-fail: `GENERIC_SIDEBAR_IDS` still contains `perk`, whose Harness note no longer exists

**Where:** `visual-harness/obsidian-camera.mjs:115`
(`const GENERIC_SIDEBAR_IDS = ['hero', 'statblock', 'perk', 'negotiation'];`), consumed at
`:1021` (`await openNote(id, 'source')`) and `:1023` (`const alias = aliases[id]`).

Removing the ten from `aliases.json` deleted `Harness/perk.md` (notes-gen generates the
element notes from `aliases.json`) — I confirmed it is absent after re-running notes-gen.
Step 3d therefore:
1. calls `openNote('perk', 'source')`, whose `waitFor` on
   `view.file.path === 'Harness/perk.md'` can never satisfy → throws;
2. would in any case search for a fence named ```` ```undefined ```` (`aliases['perk']` is
   now `undefined`).

The impl report enumerates only two changed camera inputs (the element sweep and the
by-scc-kit selector) and calls both "self-verifying"; this third one is neither. It also
silently drops the coverage the constant's own comment names: *"perk — the only markdown
pipe-table (batch-3 review L-5's exact scenario)."*

**Prescription:** replace `perk` in `GENERIC_SIDEBAR_IDS` with a still-generated note that
contains a markdown pipe table (or add a generated Harness note for the purpose), update the
comment at `:111` and the `--element=` table in `visual-harness/README.md:120`. Then run
`obsidian-shots` once on a machine with a display before landing, since three of its inputs
have now moved.

---

### M-2 (MEDIUM) — the 7.0.0 release notes still advertise the ten retired aliases

**Where:** `CHANGELOG.md:248-256` and `CHANGELOG.md:394`, both inside `## 7.0.0 (unreleased)`
(section spans lines 13-601).

Line 248-256 reads, verbatim, as a shipped 7.0.0 feature:

> New: compendium reference cards — `ds-kit`, `ds-condition`, `ds-treasure`, `ds-ancestry`,
> `ds-culture`, `ds-career`, `ds-class`, `ds-title`, `ds-perk`, `ds-complication`, and
> `ds-rule` … Each also accepts `ds-sb`/`ds-ft`/`ds-fb` … write `scc.v1:<code>`, `@<path>`,
> `[[wikilink]]`, or (for the 11 new cards) a bare slug like `panther` …

Every language in that list except `ds-rule` is now a plain code fence, and the `@path` /
`[[wikilink]]` / bare-slug forms it advertises are exactly what `ds-scc` refuses. Line 394
("The Steel theme's kit card (`ds-kit`) is rebuilt…") names a language that no longer
exists. The new `ds-scc` entry was *added* at the top of 7.0.0 (`:18-28`, accurate and
correctly thin) but the contradicting older entries were never reconciled — on a
release-bound branch the changelog is the user's primary surface.

**Prescription:** rewrite `:248-256` to describe `ds-scc` + `ds-rule` + `ds-sb`/`ds-ft`/`ds-fb`
only (or fold it into the new SC-149 entry), and reword `:394` to name the kit *card* rather
than `ds-kit`.

---

### M-3 (MEDIUM) — a body that is not valid YAML never reaches `parseSccBody`; the user sees a raw YAML parser error

**Where:** `src/framework/pipeline.ts:237-247`. `prepareModel` runs `parseYaml(source)`
*before* `def.parse`, and the whole-block-ref rescue only covers bodies starting with `@`.
Anything else that fails YAML parsing error-cards at stage `parse` with the parser's own
message, bypassing the strict-body contract entirely. Measured, as rendered:

| body | what the user sees |
|---|---|
| `` `mcdm.heroes.v1/kit/panther` `` (backticked — how the code appears in the docs/README) | `SCC reference: failed to render (parse)` **`Plain value cannot start with reserved character \` at line 1, column 1`** |
| `[Panther](scc.v1:mcdm.heroes.v1/kit/panther)` (the output of the plugin's own **Shift = insert inline link** action, pasted into a block) | `…(parse)` **`Unexpected scalar at node end at line 1, column 10`** |
| a tab-indented code | `…(parse)` **`Tabs are not allowed as indentation`** |
| `name: [Panther` | `…(parse)` **`Flow sequence in block collection must be sufficiently indented and end with a ]`** |
| ```` ```…``` ```` pasted inside the fence | `…(parse)` **`Plain value cannot start with reserved character \``** |

`parseSccBody` handles all of these correctly when called directly (verified) — it simply
never runs. The claim "every other body shape is a plain error card explaining the one
accepted form" is therefore false for a small but very plausible set, headed by the
markdown-link case (the plugin itself generates that string one keystroke away).

**Prescription:** widen the pipeline's rescue for `acceptsWholeBlockRef` defs, or — cleaner
and local — give `ds-scc` its own escape: since its `parse` ignores `data` entirely,
`sccBase` can carry a flag (or `ds-scc` can be registered with `acceptsWholeBlockRef` plus a
`parseYaml`-failure fallback to `rawData = source`) so `parseSccBody(raw)` always owns the
message. Pin the five bodies above in `sccElement.test.ts`.

---

### L-1 (LOW) — the error-card frame reads `SCC reference: failed to render (render)`

`src/framework/pipeline.ts:186` + `:279/283/285` (`def.parse` runs inside
`runStage('render', …)`). Every strict-body refusal is titled "failed to render (render)" —
developer-flavoured, and "render" is the wrong stage word for "your body isn't a code". The
implementer flagged this themselves as unpolished. The *message* is correct and does surface
in the DOM (verified for all six forms), so this is cosmetic — but `ds-scc` is the one public
element whose error card is a routine, expected user experience, so it is worth a nicer
"unresolved reference" treatment or at least a `parse`-stage tag. Not blocking on its own.

### L-2 (LOW) — `visual-harness/README.md:120` still says the recursion special proves a `ds-kit` card

Stale after the fence conversion; should read `ds-scc`. Dev-facing only. (Fix alongside M-1,
which touches the same table.)

### N-1 (NIT) — `SCC_CODE_RE` rejects a single-character non-leading segment

`src/elements/scc/definition.ts:63` — the char class after the leading char uses `+`, so
`mcdm.heroes.v1/kit/a` is refused as "not a full SCC code" while `…/kit/ab` passes. I checked
the real registry: **0 of 2975** `scc:` codes in `data/data-unified` have a segment shorter
than two characters, so this is theoretical today. Change `+` → `*` if touching the file
anyway.

### N-2 (NIT) — the reference insert emits the non-canonical `ds-statblock`/`ds-feature`/`ds-featureblock`

`src/services/typeAdapters.ts:151-163`'s `alias` field carries the long form, so
`insertReferenceBlock` writes ```` ```ds-statblock ```` where the definitions' canonical
alias (`aliases[0]`) is `ds-sb`. Both resolve, so nothing breaks; it is pre-existing (D6) and
merely verbose. Flagged only because the brief expected ```` ```ds-sb ````.

---

## `ds-rule` — status observation (the requested read)

`ds-rule` is **still registered and fully public** (`main.ts:303`), and it is now the only
other public reference block beside `ds-scc`. Driven directly, it behaves badly enough that
I would treat "leave it" as the wrong default rather than the safe one:

1. **It half-renders cross-type codes — the exact failure `ds-scc` was built to prevent.**
   It has no `baseForType`, so `RefUnwrapView.baseForType()` returns its own generic base for
   *any* code. Measured:
   - ```` ```ds-rule ```` + `mcdm.heroes.v1/kit/panther` → a card containing **only**
     `Panther` + a `Kit` badge. Every kit stat, bonus and body silently dropped. No error.
   - ```` ```ds-rule ```` + a goblin statblock code → **a completely empty card**
     (`textContent === ''`). No error, no message.
   - ```` ```ds-rule ```` + a condition code → `Bleeding` + `Condition` badge, body dropped.
2. **Its advertised inline mode is broken.** `genericCard`'s "the raw body IS the card body"
   path is unreachable for ordinary prose: `detectWholeBlockRef` treats any body that
   `parseYaml` folds to a single-line string as a *reference*. A single-paragraph body —
   however many source lines — error-cards with ``No compendium entry matches `Some **raw**
   markdown body` for this element.`` It only works by accident when the body has a blank
   line (which is why the harness's own `rule/example.yaml`, two paragraphs, looks fine).
3. **It accepts the forms `ds-scc` refuses.** ```` ```ds-rule ```` + `[[panther]]` resolves
   through the legacy provider and renders the target's **raw ds-block YAML** as card text
   (`distance: '[Melee](scc.v1:…) 1' effects: - effect: …`). So the wikilink/`@path` surface
   SC-151 deferred is still live, in the ugliest possible form, one alias over.
4. Everything else already treats rules as display-family: a `rule.*` reference inserts
   `ds-scc`, a rule cannot be snapshotted, and `ds-scc` renders `rule.*` through the same
   generic card correctly.

**Recommendation:** unregister `ds-rule` (delete `registry.register(ruleElement)` from
`main.ts`, move `ruleElement` into `INTERNAL_DISPLAY_ELEMENTS`, drop `"rule": "ds-rule"` from
`aliases.json`). That is one line plus two mechanical edits, and it makes the public
compendium-reference surface exactly one block, which is Scott's stated goal. It is Scott's
call, not the implementer's — but the evidence above should be in front of him when he makes
it, and "under-reach is safer" does not hold when the surface left behind renders empty cards.
If it stays, it needs at minimum a `baseForType` of its own and a fix for (2).

---

## What I could not verify

- **Obsidian ground truth.** `obsidian-shots` was not run (no display). Beyond M-1, the
  `scc` element sweep and the by-scc-kit `[data-dse-element="scc"]` assertion remain
  unverified against a real Obsidian, and H-1's prescription would change the latter back.
- **H-1's appearance in Obsidian's own theme chrome.** The measurement above uses the
  harness stylesheet, which is the same `styles-source.css` the plugin ships; the selector
  mismatch is theme-independent, but the *perceived* severity of the statblock case at
  default preferences is milder than the feature case.

---

## Recommendation

**FIX ROUND** — H-1, M-1, M-2, M-3, plus Scott's `ds-rule` ruling. L-1/L-2/N-1/N-2 are
optional riders. Everything else in this branch is sound: the dispatch design
(`baseForType` + `ReferenceElement.base`) is the right seam, the strict-body message set is
a genuine contract, the registry retirement is complete and clean, the insert split matches
the resolved rulings exactly, the demo vault is drift-proof, and the freeze/gallery
protection strategy (ids and aliases kept verbatim, no `scc` fixture) works — 314 shots and
188/188 byte-identical, independently reproduced.
