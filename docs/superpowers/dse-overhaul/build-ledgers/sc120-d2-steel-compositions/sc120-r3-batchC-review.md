# SC-120 §D2 Batch C — independent review (round 3)

Reviewer: independent Opus reviewer (did not write the code).
Review range: `16e25ff..0061287` in
`/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions/draw-steel-elements`
(branch `sc120-d2-steel-compositions`). Working tree verified clean before and after review
(`git status --porcelain` empty; HEAD still `0061287`).

**VERDICT: LAND-READY** — with one MEDIUM item that is a *design outcome*, not an
implementation defect, and which the owner/Scott should rule on in the evidence round
(it does not require a code fix to land). No CRITICAL or HIGH findings.

Counts: **0 CRITICAL · 0 HIGH · 1 MEDIUM · 4 LOW · 3 INFO**.

---

## Gates — re-executed by me, in dse-verify order

All commands devbox-wrapped with an absolute `cd`, gate command last in the `bash -c` string,
long output redirected to a file and read afterwards.

| Gate | My measurement | Implementer's claim | Match |
|---|---|---|---|
| `npm run tsc` | exit 0, no output | clean | ✅ |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` deprecation notice) | clean | ✅ |
| `npx jest` (after `rm -f main.js styles.css`) | Suites **186 passed + 1 skipped / 187**; Tests **3279 passed + 1 skipped / 3280**; 3 snapshots; **zero `✕`** | 3279+1sk/3280 | ✅ |
| `npm run shots` | **0 FAIL**, 474 shot lines; `print-twin parity OK (118 capture ids)`; nested-corner-radius OK | 0 FAIL | ✅ |
| freeze check | **exactly 10 checksum mismatches, 0 missing (200/210 OK)**, exit 1 | 10 mismatches | ✅ |
| determinism | my run is an independent **3rd** run: all 10 after-hashes are **byte-identical to the values in the r2 report** | 2-run identical | ✅ |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s), exit 0** | same | ✅ |

`/proc/loadavg` was 3.5 at the start of the battery — no timeout-shaped reds anywhere, no
re-runs needed.

### Freeze detail (verified myself, not taken from the report)

Mismatch set is exactly:

```
ancestry--steel-print.png        ancestry--steel-realprint.png
condition--steel-print.png       condition--steel-realprint.png
perk--steel-print.png            perk--steel-realprint.png
perk-narrow--steel-print.png     perk-narrow--steel-realprint.png
rule--steel-print.png            rule--steel-realprint.png
```

- **`kit--steel-print.png` and `kit--steel-realprint.png` both `: OK`** (explicit
  `sha256sum -c` against just those two baseline lines) — the §8 guard's negative regression
  proof holds.
- **0 missing** files (`No such file` count = 0), so the 10 are the complete frozen delta;
  nothing hid behind a missing-file line.
- **twin == realprint within every one of the 5 families** (hashes computed directly).
- `gallery--steel-*` is dark/light only and is not in the baseline, so it cannot mask an
  11th mismatch.
- **`perk-narrow` is legitimate, confirmed at source:** `visual-harness/entry.ts:972` —
  `{ id: 'perk-narrow', element: 'perk', fixture: 'default', width: 300 }`. Same element,
  same `perkLayout`, 300px viewport. The design doc's "exactly 8" simply didn't count it.
  Batch C's sanction ask is **5 capture ids / 10 lines**, hash-swaps only, baseline stays 210.

---

## A. Correctness against the spec

Verified line-by-line against `sc120-r1-design.md` §3.7–§3.10 and the owner rulings.

| Item | Spec | Code | Verdict |
|---|---|---|---|
| ancestry head | eyebrow `Ancestry`, crest `users` | `layouts.ts:379-380` | ✅ |
| ancestry bands | Signature Trait → flavor(dedup, headless) → body whole | `layouts.ts:381-411`, order proven by `displaySteelBatchC.test.ts:117-132` | ✅ |
| ancestry `**name.** desc` composition | keep legacy row's shape | `layouts.ts:387-390` | ✅ |
| perk head | `${titleCase(perk_group)} Perk` / `Perk`, crest `gem` | `layouts.ts:530-531` | ✅ |
| perk bands | flavor(dedup) → prerequisites(gated, inert) → body | `layouts.ts:532-566` | ✅ |
| condition head | eyebrow `Condition`, crest `zap` (owner ruling 3, follows `cards.go`) | `layouts.ts:294-295` | ✅ |
| condition bands | body only | `layouts.ts:296-305` | ✅ |
| rule | lives in `displayFamily.ts` `genericLayout` (owner ruling 7), eyebrow = last dot-segment humanized, crest `book-open`, body-only band | `displayFamily.ts:132-147` | ✅ |
| base branch untouched | `renderBase()` byte-identical | diff touches only `src/elements/display/{layouts,displayFamily}.ts`; `CardLayout.ts` not in the diff | ✅ |
| crest ids resolve | owner ruling 2, automated check preferred | `test/unit/kit/crestIconValidity.test.ts` | ✅ (see LOW-3) |

**The one non-obvious correctness question I chased and cleared:** the new
`resolvedBodyMd(bodyFromModel, source)` (`layouts.ts:103-105`) returns `source ? source.body
: bodyFromModel`. `renderBase()` computes `bodyMd = useSource ? this.source!.body :
this.layout.body?.(model)` where `useSource = hybrid && useSourceBody !== false`
(`CardLayout.ts:283-290`). ancestry/condition/perk all declare `useSourceBody: true`, so the
two expressions are **identical in every branch, including the "hybrid with an empty source
body" edge** (both yield `''` → no body band / no body div). The flavor-dedup expressions in
the new compositions are also character-for-character the same guard `renderBase()` runs
(`normalizedBody?.startsWith(normalizeForDuplicateCheck(flavor))`). No divergence.

Rule's `genericLayout` uses `m.body` directly, matching `useSourceBody: false` +
`body: (m) => m.body` on the base branch. ✅

`genericCard()` has exactly one adopter today (`src/elements/display/index.ts:136`,
`ruleElement`) — the shared-shape change owner ruling 7 sanctioned reaches nothing else.

---

## B. The §8 kit guard — probed, not just read

Code (`layouts.ts:265-277`) matches the design's prescribed shape exactly:
`stripKitBodySections` hoisted into the `bands()` closure and computed **once**; the
`render()` early-out (`if (!stripped.trim()) return undefined`) deleted; **`renderSteel()`
untouched** (no `CardLayout.ts` hunk in the diff).

**Can-fail probe (transient, fully reverted).** I reverted the guard to its pre-fix shape
(`if (hybrid || m.signature_ability)` + the in-`render()` early-out) and re-ran
`test/dom/elements/kitSteel.test.ts`:

```
● SC-120 Batch C §8 … › hybrid + empty stripped body ⇒ no .dse-card__band-head …
  Expected value: not "Signature Ability"
  Received array:     ["Equipment", "Kit Bonuses", "Signature Ability"]
Tests: 1 failed, 11 passed, 12 total
```

- **Empty-signature hybrid source** (`kitSteel.test.ts` synthetic `empty-sig` note whose whole
  body sits under a stripped `##### Equipment` heading): pre-fix mounts the
  `SIGNATURE ABILITY` band-head over nothing; post-fix mounts **no band-head at all**. The
  defect is real, the guard closes it, and the test is **non-vacuous**.
- **Hybrid source WITH content**: the other 11 kitSteel tests — including
  "Signature Ability band: the source body reaches renderMarkdown with the Equipment heading
  STRIPPED but the ```ds-feature fence KEPT" and the band-order test — pass **identically in
  both states**, i.e. the guard changes nothing when content exists. The frozen
  `kit--steel-{print,realprint}.png` being byte-identical is the third leg of the same proof.

Log: `…/scratchpad/probe1.log`. `src/elements/display/layouts.ts` restored via
`git checkout --`; tree verified clean.

---

## C. Base-branch integrity — the clone tests are NOT vacuous

SC-144 reality confirmed: `layout.steel` presence is the whole branch rule
(`CardLayout.ts:244`), so the real ancestry/perk/condition elements can no longer reach
`renderBase()`. The implementer moved the base-branch DOM assertions onto
`{...layout, steel: undefined}` clones (`displayFamily.test.ts:32-60`), which keep the real
layout data.

**Can-fail probe (transient, fully reverted).** I broke `renderBase()` itself
(`.dse-card__title` → `.dse-card__titleZ` and `.dse-card__rows` → `.dse-card__rowsZ` in
`CardLayout.ts`) and ran `displayFamily.test.ts`: **24 failed / 19 passed**, and the three
relocated tests are among the failures by name —

```
● base branch: ds-condition inline example.yaml renders title/badge/body
● base branch: ds-condition full scc.v1: code and bare slug both resolve, no error card
● base branch: ds-ancestry inline example.yaml renders title/signature-trait row/body …
● base branch: ds-perk inline example.yaml renders title/body, no flavor slot …
```

So the clones would fail if `renderBase()` output changed. Coverage is genuinely preserved,
not laundered. Log: `…/scratchpad/probe3.log`. `CardLayout.ts` restored; tree clean.

---

## D. Test quality

23 new tests, all reached by `npx jest`. Spot-checked for the project's known
vacuous-assertion failure mode; no vacuous assertions found. Notable strengths:

- The direct `bands()`-closure tests (`displaySteelBatchC.test.ts:117-138, 170-179`) pin band
  **order** and the Prerequisites gate with synthetic models — the only way to see a
  non-suppressed flavor band, since every real fixture dedupes it. The stated reason is
  accurate.
- `expect(bands).toEqual([])` for the empty models is a real assertion about the
  no-stray-empty-band-wrapper rule, not a smoke test.
- `kitSteel.test.ts`'s "never leaks into a sibling family" test correctly re-pointed from
  `ds-condition` (which now has its own composition, so it would have become a vacuous
  example) to `ds-culture`.

**Crest-icon validity can-fail probe (transient, fully reverted).** I changed perk's crest to
`gemmm-not-real`:

```
● … every layout.steel crestIcon resolves in the bundled Lucide set › perkLayout (gem)
Tests: 1 failed, 5 passed, 6 total
```

The test does fail on a bogus id. (Limitation → LOW-3.) Log: `…/scratchpad/probe2.log`;
`layouts.ts` restored; tree clean.

---

## E. Visual review (dark shots vs the `kit--steel-dark.png` quality bar)

Crops read at `…/scratchpad/v-*.png`, from
`…/draw-steel-elements/visual-harness/shots/`:

- **ancestry** — `users` crest renders as a real glyph inside the shield (not the empty
  crest a bad Lucide id degrades to), eyebrow `◆ ANCESTRY`, title `HUMAN`, one
  `SIGNATURE TRAIT` band-head with "Detect the Supernatural", then the lore body. Head
  separator, band-head small-caps + hairline, and plate gradient are indistinguishable from
  kit's. **The single biggest before/after delta of the batch** — SC-121's "bare title, no
  chip/box at all" is gone.
- **perk** — `gem` crest, `◆ PERK`, `FAMILIAR`, headless body band. No empty band-head.
- **perk-narrow (300px)** — crest and head lanes wrap correctly; no overflow.
- **condition** — `zap` crest, `◆ CONDITION`, `BLEEDING`, headless body. The old type-pill is
  gone, replaced by the eyebrow, as designed.
- **rule** — `book-open` crest, `◆ RULE`, title `RULE`. See MEDIUM-1.
- **No double-rendered content anywhere.** I checked the specific risk directly: does an
  ancestry body repeat the Signature Trait name that the new band renders? Across all 12 real
  `md-dse` ancestry files in `data-unified/en/unified/md-dse-linked/ancestry/`, **0 duplicate
  the trait name as body content** (the single hit, `polder.md`, is the word *shadowmeld* in
  running prose, not a repeat of the trait block). (A grep against `v2/docs/Browse/**` *does*
  hit 12/12, but that's the site format with its own "Signature Trait" section — not what the
  plugin resolves.)
- **Dark-mode materials sane.** Batch C adds zero CSS and mounts no sunken surface of its own
  (no `statTiles`, no boxed panel), so the translucent-black rule has no new consumer here;
  band surfaces inherit SC-100's block and read as the same translucent-black family as kit's.
  No light wash anywhere.
- **Print** (`ancestry--steel-print.png` vs `kit--steel-print.png`): the new families drop
  crest + Steel decoration in print exactly as the sanctioned kit print does — same grammar,
  no leak.

---

## Findings

### MEDIUM-1 — `ds-rule`'s eyebrow carries no information, and duplicates the title in inline mode

**Where:** `src/elements/display/displayFamily.ts:133-142` (eyebrow closure);
`src/services/typeAdapters.ts:171-188` (`genericNoteAdapter`, the field's only by-SCC source).
Visible in `visual-harness/shots/rule--steel-dark.png` and
`.superpowers/sdd/sc120-d2-steel-compositions/sc120-after-rule--steel-dark.png`: the card reads
`◆ RULE` over `RULE`.

**Status:** the implementation follows the design's formula exactly (last dot-segment of
`type`, humanized), and the r2 report discloses this as deviation 2. I verified the corpus
claim independently and it is stronger than "today it renders 'Rule'": **it can never render
anything else on the current data path.** 153/153 rule files under `v2/docs/Browse/rule/**`
carry the bare `type: rule`; the group (`combat`, `dice`, `keyword`, …) lives only in the
`scc:` frontmatter value and the directory, and `genericNoteAdapter` copies only
`fm.type` into `GenericNote.type`. So the site's `COMBAT / ADJACENT` eyebrow (design §3.10's
whole rationale for the port) is unreachable without a `typeAdapters` change.

**Failure scenario:** Scott opens the evidence shot and sees a Steel card whose eyebrow is a
verbatim copy of its title — the "degenerate RULE: Rule" case `chrome.summary` already guards
against elsewhere — and reasonably reads it as sloppiness introduced by this batch.

**Prescribed fix (owner's call, cheap either way):**
(a) *Suppress the redundancy* — `SteelCardComposition.eyebrow` may return `undefined` and
`cardHead`'s `leftEyebrow` is optional (`cardHead.ts:25`), so
`if (!m.type || humanized === m.name) return undefined;` is a one-line change that leaves the
crest carrying family identity, as it does on the site tile. Costs one more frozen-shot pair
(`rule--steel-{print,realprint}`) that is already moving in this batch anyway — **zero extra
sanction lines**.
(b) *Make the eyebrow real* — have `genericNoteAdapter` derive `type` from the `scc:` field's
middle segment when `fm.type` is the bare family name, yielding `Combat`. Touches
`src/services/typeAdapters.ts` and `GenericNote` semantics, so it belongs in its own Backlog
ticket linking SC-120, not in Batch C.
(c) *Accept as-is* and let the crest do the work; the eyebrow becomes correct for free if (b)
ever lands.

Recommend putting (a)-vs-(c) into the Batch C evidence-round ask alongside the band-head-label
question that owner ruling 5 already deferred there.

---

### LOW-1 — perk's Prerequisites band has no duplicate-vs-body guard (the base branch's row did)

**Where:** `src/elements/display/layouts.ts:552-559`.

`renderBase()` suppresses a `FieldRow` whose normalized value already appears in the body
(`CardLayout.ts:304-306`, `DUPLICATE_ROW_MIN_LENGTH`). The new Prerequisites *band* has no
such check, and perk's body policy is (C) — keep whole.

**Failure scenario:** inert today (`prerequisites` is 0/55), but the band exists precisely so
that "a future populated corpus renders it with no further code change". In that world, a perk
whose body leads with `**[Prerequisite](…):** …` — the exact shape §5.2 documents for the
other families — renders the prerequisite **twice**: once as a structural band, once in the
body. That is the same defect class as owner ruling 8's treasure double-render.

**Prescribed fix:** either gate the push on the same `normalizedBody.includes(normalizedValue)`
test the base row uses (three lines, reusing `normalizeForDuplicateCheck`, already imported),
or hand it to Batch B's `stripLabeledLines()` (§5.2) when that helper lands and downgrade
perk's body to policy (B). A code comment naming which one is coming is an acceptable minimum.

*Same shape, lower risk:* ancestry's Signature Trait band (`layouts.ts:386-395`) also has no
dedup against the body. I checked the real corpus (above): **0/12 duplicate**, so there is no
live defect — worth one sentence in the comment, not a code change.

---

### LOW-2 — `titleCase()` and `humanizeType()` are the same function in two files

**Where:** `src/elements/display/layouts.ts:86-92` (`split(/[\s_-]+/)`) vs
`src/elements/display/displayFamily.ts:106-112` (`split(/[._-]/)`).

Identical body, different split charset, and Batch C is what put a consumer of each in the same
review surface. **Failure scenario:** a later batch fixes a casing edge (acronyms, `d&d`-style
tokens) in one and not the other, so perk eyebrows and rule eyebrows humanize differently.
**Prescribed fix:** one shared helper (`split(/[\s._-]+/)`) in a shared module, called by both;
or, if that's out of scope here, a cross-reference comment in each. Cosmetic — fine to land as
is.

---

### LOW-3 — the crest-validity check can't catch the exact failure owner ruling 2 named

**Where:** `test/unit/kit/crestIconValidity.test.ts:36-38` (`toPascalCase(id) in lucide`).

The check resolves against the **npm `lucide` package's export names**, and that package keeps
deprecated aliases. I probed it directly against the bundled `lucide@1.24.0`:

```
octagon-alert  OctagonAlert  true
alert-octagon  AlertOctagon  true
```

Both resolve. So the ruling's own example — picking `alert-octagon` when Obsidian's registry
carries `octagon-alert` (or vice versa, depending on Obsidian's bundled Lucide version) —
would pass this gate. It does reliably catch invented ids and typos (proved above), which is
most of the real risk, and all four ids this batch adds (`users`, `gem`, `zap`, `book-open`)
are canonical, long-lived Lucide names, so **no action is needed for Batch C**.

**Failure scenario:** a future batch (treasure `package`, culture `map`, class `shield`,
career, title…) picks a renamed/aliased id, the test goes green, and the crest renders empty in
real Obsidian. **Prescribed fix:** soften the test's header claim (it currently asserts a 1:1
correspondence with Obsidian's registry, which is true only for canonical names), and/or pin
the check to Lucide's canonical `icons`/`iconNames` map rather than the module's export names.
A one-time manual check of each new id against real Obsidian at Batch A/B evidence time also
closes it.

---

### LOW-4 — floating promise in a new test

**Where:** `test/dom/elements/displaySteelBatchC.test.ts:128-130` — `bands[1].render(container,
async (md, el) => { el.setText(md); }, undefined as any);` is not awaited, and the test callback
is synchronous.

It passes because the fake `renderMarkdown` writes before its first suspension point.
**Failure scenario:** if that helper ever gains a real `await` before `setText`, the assertion
on the next line reads an empty container and the test fails for a reason unrelated to what it
tests. **Prescribed fix:** make the test `async` and `await bands[1].render(...)`.

---

### INFO-1 — body-policy letter mismatch in a comment

`src/elements/display/layouts.ts:369-372` labels ancestry's body "policy (A) keep whole"; the
design assigns ancestry **policy (C)** (§5.2 line: "ancestry/perk/condition/rule (policy (C))"),
while §3.7 itself writes "policy (C) keep whole". Behavior is correct either way (the body is
not stripped). Suggest dropping the letter and saying "keep whole (design §3.7)".

### INFO-2 — the freeze ask is 10 lines / 5 capture ids, and it is complete

Independently confirmed above: mismatch set is exactly those 10, 0 missing, kit pair `: OK`,
twin == realprint in every pair, and all 10 hashes reproduce the r2 report's values on a third
independent run. `perk-narrow` is `perkLayout` at 300px (`entry.ts:972`), not a leak into a
sibling family. Baseline stays 210; hash-swaps only. Per dse-verify, the rebaseline lines are
generated once from the completed tree at landing (owner ruling 9) — nothing to do in this
batch beyond the sanction ask.

### INFO-3 — `renderBase()` is now production-dead for four families

With `steel` present, ancestry/perk/condition/rule can never take the base branch in
production, so their `badges`/`rows`/`flavor` layout data is exercised only by the test clones.
That is exactly what the ticket asks for ("keep the legacy branch byte-identical" = don't edit
it), and the clones keep the code honest until Batch A/B finish the sweep. When every family
has a composition, the dead base data (and `renderBase()` itself) wants a cleanup ticket —
worth noting in the ledger now so it isn't rediscovered.

---

## Evidence produced

Durable (already in the ledger dir): the r2 after-shots, plus the worktree's regenerated
`draw-steel-elements/visual-harness/shots/` (my run, byte-identical to r2's).

Transient, this session's scratchpad
(`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5e4d5380-4ea7-4e51-8532-5a9ec6f5c860/scratchpad/`):

- `jest.log`, `shots.log`, `freeze1.log`, `parity.log` — my gate runs
- `probe1.log` — §8 guard reverted → the guard test fails (can-fail proof)
- `probe2.log` — bogus crest id → crest-validity test fails (can-fail proof)
- `probe3.log` — `renderBase()` broken → the base-branch clone tests fail (non-vacuity proof)
- `v-*.png` — the head crops I read for the visual pass

All three probes were reverted with `git checkout --`; `git status --porcelain` is empty and
HEAD is still `0061287`. Nothing was committed, pushed, or left modified.

---

# Delta re-review — fix round `0061287..8a47807` (scoped, 2026-08-28)

Scope: only the four findings the owner ruled on (rulings 10–13) plus scope-creep and
regression checks. Not a fresh full pass. Working tree clean throughout; branch not modified.

**VERDICT: CLEAN — no new findings.** All four fixes match their rulings, no scope creep, no
collateral behavior change. Batch C stays LAND-READY.

## Fix-by-fix

**1. MED-1 / ruling 10 — eyebrow suppressed when it would duplicate the title.**
`src/elements/display/displayFamily.ts:143-147`:
`const humanized = m.type ? titleCase(m.type.split('.').pop()!) : 'Rule';` then
`return humanized.toLowerCase() === m.name.toLowerCase() ? undefined : humanized;`.
Matches the ruling exactly — case-insensitive, crest untouched, `undefined` is legal
(`SteelCardComposition.eyebrow` returns `string | undefined`, `cardHead.ts:25` `leftEyebrow?`),
so `cardHead` mounts no left-eyebrow slot rather than an empty one. Suppression is correctly
scoped to the duplicate case only: the by-SCC card (title `Opportunity Attacks`, eyebrow
`Rule`) still renders its eyebrow, pinned by `ruleCard.test.ts:148` and by the new
direct-closure case `type: 'rule.combat'` → `'Combat'` (`ruleCard.test.ts:245-247`), which also
keeps the design's original intent testable for SC-272.

**2. LOW-1 / ruling 11 — perk Prerequisites dedup.** `layouts.ts:543-553` now gates the push on
`normalizedValue.length >= DUPLICATE_ROW_MIN_LENGTH && !!normalizedBody?.includes(normalizedValue)`,
reusing the closure's existing `normalizedBody` (the same `resolvedBodyMd`-derived value the
flavor guard uses). Semantically identical to `renderBase()`'s row guard
(`CardLayout.ts:326-328`) — same threshold, same normalizer, same `includes` direction.
**`DUPLICATE_ROW_MIN_LENGTH` export does not weaken CardLayout's own use:** the change is
`const` → `export const` on the same literal `20`, and line 328 still reads it unchanged.

**3. LOW-2 / ruling 12 — `titleCase` consolidation.** Single definition now at
`CardLayout.ts:210`, charset `[\s._-]+` (the union of the two old charsets); `humanizeType` is
deleted. I grepped every call site: the only consumers are `layouts.ts:519` (perk eyebrow) and
`displayFamily.ts:116` (`badges`) + `:144` (rule eyebrow). **No other call site's output can
change** — perk_group values carry no `.`, and `type` segments carry no whitespace, exactly as
the new doc comment claims. The one theoretical delta (a whitespace-bearing `type` would now
split where `humanizeType` did not) lands only in `genericLayout.badges`, which is base-branch
data that `renderSteel()` never reads, on the only `genericCard()` adopter — unreachable.
`titleCaseConditionKey` (`elements/conditionDisplay.ts:17`) and `titleCaseKey`
(`framework/kit/conditionIcons.ts:55`) are a different, pre-existing helper pair in the
conditions domain, deliberately duplicated per their own file headers — correctly left alone.

**4. LOW-4 / ruling 13 — floating promise.** `displaySteelBatchC.test.ts:117,132` — the test is
now `async` and the `bands[1].render(...)` call is awaited.

## Scope creep — none

`git diff --stat 0061287..8a47807` = 5 files: `displayFamily.ts`, `layouts.ts`,
`CardLayout.ts`, `displaySteelBatchC.test.ts`, `ruleCard.test.ts`. **`typeAdapters.ts` is not
touched** (SC-272's adapter work correctly deferred) and **`crestIconValidity.test.ts` is not
touched** (LOW-3 / ruling 14 correctly deferred to Batch B). Nothing under `visual-harness/`,
so parity's inputs are provably unchanged and re-running it was unnecessary.

## Gates I re-measured on `8a47807`

| Gate | My measurement | Report's claim | Match |
|---|---|---|---|
| `npm run tsc` / `npm run lint` | both exit 0, no output | clean | ✅ |
| `npx jest` | **3282 passed + 1 skipped / 3283**, 186 suites + 1 skipped, 3 snapshots, zero `✕` | 3282+1sk/3283 | ✅ |
| `npm run shots` | 0 FAIL, 474 shot lines, print-twin parity OK (118 ids) | same | ✅ |
| freeze | **same 10 mismatch names, 0 missing**, `kit--steel-{print,realprint}` `: OK`, twin==realprint in all 5 pairs | same | ✅ |
| rule-pair hash move | ancestry/condition/perk/perk-narrow hashes **byte-identical to round 2**; only `rule` moved `a369b4f1…` → **`bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b`** (both twins) | same values | ✅ |
| `npm run parity` | not re-run — diff contains no `visual-harness/` change | 0/0/16, exit 0 | n/a |

**Jest note (mine, not a regression):** my first full run showed one red —
`test/dom/framework/sidebarEncounterHandoff.test.ts` › "the encounter block persists the id it
minted" (`3281 passed + 1 failed + 1 skipped`). That is the same pre-existing flake the round-2
report documented. Proven, not assumed: it passes in isolation (10/10), and a second clean full
run is fully green at 3282+1sk/3283. Nothing in this diff touches the encounter/sidebar path.

**Visual spot-check** (`visual-harness/shots/rule--steel-dark.png`, regenerated by my own shots
run): the head now reads `book-open` crest + `RULE` title with **no eyebrow line** — the
`◆ RULE / RULE` duplicate is gone, the crest still renders a real glyph, and the card frame is
otherwise unchanged (still 1520×652). Crop: `…/scratchpad/v2-rule.png`.

**Amended r2 report** is internally consistent: its fix-round gate table, its before/after
rule-hash block and its full 10-hash set all agree with each other and with every number I
measured independently. Its `perk-narrow`/`ancestry`/`condition`/`perk` hashes are unchanged
from its own round-1 block, as it claims.

Post-review state: `git status --porcelain` empty, HEAD `8a47807`. Delta logs:
`…/scratchpad/{jest2,jest2b,jest3,shots2,freeze2}.log`, `delta-src.diff`, `v2-rule.png`.
