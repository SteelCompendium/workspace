# SC-205 — round 6 final scoped re-review (`c32bc35..c09cf6f`)

**Verdict: APPROVE — land-ready.**

All 6 R4 findings are **CLOSED**, each verified by re-running my own R4 scenario rather than
by reading the fix. Every number the R5 report claims reproduced exactly, twice. Two of the
three fixes I probed adversarially were tightened beyond what I asked for (the `unparsed`
classification and the static collapse-cascade assertion are both durable, loud mechanisms
rather than one-off corrections).

I found **2 LOW and 1 INFO**, all latent, none reachable on the current Obsidian or the current
sheet, and none of which I would hold a landing for. They are recorded for whoever next touches
the selector parser or the collapse rules.

Scope: delta only. Nothing from R2/R4 that I already cleared was re-audited.

---

## Gate numbers I re-ran myself, at `c09cf6f`

| Gate | Result |
|---|---|
| `npm run shots` (full) ×2 | **474 PNGs, 0 FAIL** both runs; the two gate blocks **byte-identical** (`diff` empty) |
| `host-copy pin` | `OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing … **21** further rules … excluded by documented ancestor scope, **0 unclassifiable**)` |
| `button host-leak` | `OK (111 button kinds × 3 states × dark/light = **666** comparisons)`, **12** exemptions (8× `focus-visible: disabled`, 2× `hover: no point … hit-tests`, 2× `focus-visible: visibility: hidden`), **0 diffs** |
| `check-freeze.sh` ×2 (incl. after all probes) | **`freeze OK (210/210 …)`, exit 0**, 0 mismatches |
| `npx jest` (after `rm -f main.js styles.css`) | **3257 passed / 1 skipped / 3258 · 184 passed + 1 skipped = 185 suites · 3 snapshots**, load 2.60 |
| `npm run tsc` | clean |
| print-twin parity | `OK (118 capture ids byte-identical)` |

**Harness-only round: independently confirmed.** `git diff c32bc35..c09cf6f -- styles-source.css`
is **empty**, and the sheet's sha256 is `608807cb1c3b254cad38845eb8a7e40303556e3103c4366342214e14bac3a023`
— identical to the value I captured myself at `c32bc35` in R4. So zero pixels and zero frozen
bytes are in play by construction, and freeze 210/210 is the second witness.

**On the gates I chose to run.** Jest and tsc had no input reason to move: the delta touches only
`visual-harness/shoot.mjs` and `visual-harness/obsidian-host-pin.mjs`, neither is imported by any
test (I grepped — all 10 hits in `test/` are prose in comments, never an import), neither is a
harness-bundle input (`shoot.mjs` is the *runner*, invoked after `harness:build`), and the sheet
that 20+ suites do read is byte-identical. I ran both anyway as cheap insurance on a
land-ready call. I did **not** re-run lint (covers `src main.ts` only — literally nothing in this
delta) or parity (sheet byte-identical to the already-parity-verified `c32bc35`, and neither
`.mjs` is a parity input).

---

## Per-finding disposition

| R4 finding | Disposition | How I verified it |
|---|---|---|
| **R4-M1** sheet-listing pin unreachable without a local Obsidian ≥1.13.7 | **CLOSED** | I re-ran **my own R4 world**: `findObsidianAsar`'s config dir pointed at a 1.9.0-only fake home **and** `(0,1,1)  button:focus-visible` deleted from the fence. At `c32bc35` that was exit 0 in silence. At `c09cf6f`: **exit 1**, `IN-REPO HOST-MODEL CHECK FAILED`, both lists printed, the missing rule named — and `button host-leak OK` appears **0 times** (sweep never ran) and `host-copy pin PARTIAL/SKIPPED` appears **0 times** (it exits before the asar gate is even reached). The check is genuinely first and genuinely unconditional. |
| **R4-M2** partition not exhaustive (comma inside `:is()`/`:not()`) | **CLOSED** | Real 1.13.7 app.css through the real exported functions: **reaching=6, excluded=21, unaccounted=0**, and my own independent recount of plain-button-subject fragments agrees (29 both ways). All four selectors that were INVISIBLE in R4 now classify: `:is(.markdown-rendered, .markdown-preview-view) button` → REACHING, `button:not(.clickable-icon, .mod-cta)` → REACHING, `button:not(:is(.mod-cta))` → REACHING, the real `@container … .setting-item-control button:not(.clickable-icon)` → EXCLUDED. The three controls still behave (`.markdown-rendered button`, `.view-content button`, `:is(.markdown-rendered) button` → REACHING). |
| **R4-M2 consequence** — the newly-visible settings rule | **CLOSED, exclusion is accurate and self-expiring** | The `/\.setting-item-control$/` entry matches the `@container` rule's scope exactly (`.setting-item:not(:is(.mod-toggle, .mod-navigable, .mod-action, .setting-item-heading)) .setting-item-control`), the `why` correctly describes it as settings-tab row chrome, it names **SC-202**, and the code comment says what to do when SC-202 takes it on ("this entry is the thing to delete"). Excluded went 20 → 21, reaching stayed 6 — no coverage was added, per ruling 6. |
| **R4-L1** drift remedy wrong for a sheet-listing drift | **CLOSED** | Observed verbatim in can-fail A: the in-repo block prints *"Obsidian is NOT involved in this one and nothing needs re-extracting: both operands are in the repo… Fix the sheet or the model so they match, in one commit."* The Obsidian-side block keeps the re-extract remedy and now adds the inverse instruction for an unclassifiable-selector line ("teach the parser, do not re-extract around it"). |
| **R4-L2** "three of the six rules only ever fire in the other two" | **CLOSED** | Now "TWO … (`button:hover`, `button:focus-visible`)", with the remaining four accounted for: three fire at rest (base, `:not(.clickable-icon)`, the `[disabled]` group — citing R1's can-fail measuring that group under `rest`) and forced-colors fires in no state this harness renders. Matches what I measured in R2. |
| **R4-L3** mount-superposition dependency unrecorded | **CLOSED, and enforced** | The dependency is now stated in the `CHROME_REVEAL_CSS` comment *and* asserted by `checkCollapseCascadeAssumption()`. **I proved the assertion fires**: appended `[data-dse-collapsed="on"] .dse-chrome-summary .dse-btn { --sc205-r6-probe: 1 }` to a working copy of the sheet → **exit 1**, the offender named verbatim with the remedy ("Drive the two collapse states as separate navigations, or scope the new rule off the button"), sweep never ran. |
| **R4-INFO** unguarded sheet read, non-greedy fence regex | **CLOSED** | Read is wrapped and returns a drift line instead of throwing. The exactly-one-fence assertion fires: I appended a second `[SC205-HOST-RULES]…[/SC205-HOST-RULES]` block → **exit 1**, *"must contain exactly one … found 2 opening and 2 closing markers"*. |

---

## New findings

### R6-L1 (LOW) — the `unaccounted` loudness contract covers subject-side parse failures only; a scope-side one is still silent

`visual-harness/obsidian-host-pin.mjs:250–271` (`classifySubject`), `:214–229`
(`splitSelectorList`), `:186–202` (`splitSubject`), consumed at `:359–405`.

The exhaustiveness comment promises: *"Every fragment that aims at the `button` type must end up
classified … Anything left over is returned in `unaccounted` and the caller FAILS the pin on
it."* `unaccounted` is only reachable through `classifySubject` returning `unparsed`, which
requires `/^button\b/` to match the **derived subject**. If the depth counter mis-derives the
subject — because `splitSelectorList` / `splitSubject` count `(`, `)`, `[`, `]` without string or
escape awareness — the fragment classifies as `not-button` and is dropped in silence, taking any
genuinely reaching selector in the same list with it.

Measured (`sc205r6-classifier.log`, §4), through the real exported functions:

| selector | outcome |
|---|---|
| `button[title="a,b"]` | REACHING (correct) |
| `button[title="a]b"]` | UNACCOUNTED → loud (acceptable) |
| `button[title="a(b"]` | REACHING (wrong but safe — over-inclusive is loud) |
| `button[title=a\,b]` | REACHING (correct) |
| `.some-new-scope button&.mod-x` | UNACCOUNTED → loud (the fixer's own can-fail II shape) |
| **`.x[title="a]b"] button, .y button`** | **SILENTLY DROPPED** — and `.y button`, a genuinely reaching selector, vanishes with it |
| **`.a:not(.b button`** (malformed / mid-paren) | **SILENTLY DROPPED** |

**Not live, and I checked rather than assumed.** Across all 3,755 rules in 1.13.7's app.css:
**0** selectors whose depth counter fails to return to 0, **0** that go negative, and **0** where
the shipped split differs from a string-aware reference split; plain-button-subject fragment
counts agree exactly (29 vs 29). So today's `6 / 21 / 0` partition is genuinely complete. The
shape class is nonetheless common in this stylesheet — 60 current selectors carry quoted
characters inside attribute selectors — so the counter is one Obsidian selector away from eating
a reaching rule quietly.

**Fix (cheap, and it mirrors what this round already did for subjects).** Make the scanners
string- and escape-aware, and — the durable half — report a fragment as `unaccounted` whenever
its depth counter does not return to 0, so a parse failure is loud regardless of which side of
the selector it happens on.

### R6-L2 (LOW) — the model's own `unaccounted` is never checked, so on a PARTIAL machine a malformed model selector shrinks the model silently

`visual-harness/shoot.mjs:749` (`const model = extractReachingButtonRules(OBSIDIAN_HOST_BUTTON_CSS)`)
and `:665–695` (`checkSheetHostRuleListing(model)`).

`extractReachingButtonRules` returns `partitionButtonRules(css).reaching` and discards
`unaccounted`. The Obsidian-side loop checks `unaccounted` for **app.css** but nothing ever
checks it for **`OBSIDIAN_HOST_BUTTON_CSS`**. On a machine with a usable Obsidian this is caught
indirectly (a silently-dropped model rule shows up as `Obsidian has a rule the copy does not
model`). On a `host-copy pin PARTIAL` machine — the CI/headless case this round went to some
trouble to serve — a malformed selector in the model would silently shrink `model`, and
`checkSheetHostRuleListing` would then merely require the sheet's fence to match the shrunken
list. Both in-repo copies would agree with each other and both would be wrong, which is the
exact failure shape R4-M1 was raised about.

**Fix.** One line in the unconditional in-repo block: fold
`partitionButtonRules(OBSIDIAN_HOST_BUTTON_CSS).unaccounted` into `sheetDrift`.

### R6-INFO — two small residues

- **`checkCollapseCascadeAssumption`'s pattern is narrower than the assumption it enforces**
  (`shoot.mjs:~700`). It flags `[data-dse-collapsed]`-keyed rules matching
  `/\.dse-btn|\bbutton\b/`, but three of the plugin's real `<button>` families — named in this
  sheet's own SC-203 block — match neither literal: `.dse-tabs__tab`, `.dse-collapse__header`,
  `.dse-pr__row`. **Demonstrated in the same can-fail run**: I appended *both*
  `[data-dse-collapsed="on"] .dse-chrome-summary .dse-btn` (flagged, gate failed) and
  `[data-dse-collapsed="on"] .dse-chrome-summary .dse-collapse__header` (**not flagged**, 0
  occurrences in the output). The existing `> *:not(.dse-chrome):not(.dse-chrome-summary)`
  collapse rule at `styles-source.css:12821` is the same blind spot in universal-selector form.
  Widening the pattern to the four family class names is a one-line change.
- **`CHROME_REVEAL_CSS`'s new comment ends "…starts testing the summary button in the wrong
  cascade and will not say so"** — which the same commit made false, since
  `checkCollapseCascadeAssumption()` now says exactly that. Worth a word change so the comment
  does not talk a future reader out of trusting the guard that sits ten lines below it.
- The `SKIPPED` → `PARTIAL` rename is the right call (it states which half ran) and preserves
  the ruling-1 contract (stdout, exit 0, never silent). It does change the string anyone would
  grep for; the fixer already flagged it for INFO-2, and the `dse-verify` SKILL.md entry should
  use the new word.

---

## No other new holes found

Specifically checked and cleared:

- **Classifier misfiling a reaching rule as `not-button`** — the only route I found is the
  scope-side depth mis-parse (R6-L1), which is not reachable on 1.13.7. The truth table is
  otherwise correct: `button.mod-cta` / `button.mod-loading::after` / `button#x` → `qualified`,
  `button:not(:is(.mod-cta))` / `button:not(.clickable-icon, .mod-cta)` → `plain`,
  `button&.mod-x` / `button[x` → `unparsed`. `button:is(.mod-cta)` classifies `plain` rather than
  `qualified` — over-inclusive, which is the safe direction (it would demand modelling, loudly).
- **The PARTIAL rename weakening loudness** — same stream, same exit code, more information.
- **The unconditional fence check misfiring where the sheet path differs** — the path is derived
  from `shoot.mjs`'s own directory, so it is always in-repo, and an unreadable sheet now produces
  a loud drift line instead of `FAIL sweep (exception)`.
- **`normalizeSelector`'s new top-level-comma split changing comparison semantics** — it changes
  the normalized text of a `:is(a, b)` selector, but both operands go through the same function,
  so the comparison stays consistent; no current reaching rule or model rule contains one.
- **Sweep drift** — 111 / 666 / 12 / 0 diffs is unchanged from `c32bc35`, as expected for a round
  that touched the pin's parser and ordering and not the sweep, and identical across my two full
  runs.

---

## Tree state

`git status --porcelain` empty, `git diff` empty,
`HEAD = c09cf6f1258311b43701a536042744fa325aa202`.

Every perturbation reverted **from sha-verified file backups, never `git checkout <path>`**.
Post-restore sha256, diffed against my pre-probe capture and identical:

```
a379501ab79b580eec3189b67544759ee0ff7d04bc1c4ff37b811697b5a8c510  visual-harness/obsidian-host-pin.mjs
05f72bffc2a66ded14f81c7dbe8363841525da8b89aab33714757c02ed4c153e  visual-harness/shoot.mjs
608807cb1c3b254cad38845eb8a7e40303556e3103c4366342214e14bac3a023  styles-source.css
```

No `SC205-R6-PROBE` marker survives anywhere. `visual-harness/shots/` was regenerated by a final
clean full run **after** all probes, and `check-freeze.sh` re-run against it → `freeze OK
(210/210 …)`, exit 0.

## Evidence artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5e4d5380-4ea7-4e51-8532-5a9ec6f5c860/scratchpad/`:

- `sc205r6-shots.log`, `sc205r6-shots-final.log` — two full runs, 474 PNGs / 0 FAIL, gate blocks byte-identical
- `sc205r6-jest.log` — 3257 passed / 1 skipped / 185 suites
- `sc205r6-classifier.mjs`, `sc205r6-classifier.log` — real 1.13.7 partition (6 / 21 / 0), the seven R4-M2 cases, the `classifySubject` truth table, nine adversarial shapes, the settings-rule exclusion text
- `sc205r6-balance.mjs`, `sc205r6-balance.log` — **R6-L1**: depth-counter audit over all 3,755 app.css rules (0 unbalanced, 0 negative, 0 split differences, 29 == 29 fragments)
- `sc205r6-canfail-A-inrepo-no-obsidian.log` — **R4-M1**: 1.9.0-only world + broken fence → exit 1, in-repo remedy, sweep never ran, asar gate never reached
- `sc205r6-canfail-B-collapse-and-fence.log` — **R4-L3 + R4-INFO**: duplicate fence and a `[data-dse-collapsed]`-keyed `.dse-btn` rule both flagged → exit 1; the `.dse-collapse__header` twin **not** flagged (R6-INFO)
- `r6-pin.GREEN`, `r6-shoot.GREEN`, `r6-sheet.GREEN`, `r6-green-shas.txt` — the sha-verified restore points

R2 (`sc205rev-*`) and R4 (`sc205r4-*`) artifacts are unchanged in the same directory.
