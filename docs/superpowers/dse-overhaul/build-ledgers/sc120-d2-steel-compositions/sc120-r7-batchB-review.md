# SC-120 §D2 Batch B — independent review (round 7)

Reviewer: fresh Opus agent, did not write any of this code.
Scope: dse commits `3ab9d45` (Batch B) + `a78845a` (fix round 1, ruling 19) + the folded
Batch A ruling-18 `languageCount` delta from `05a09d7`/`eadacc7`.
Worktree: `/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions/draw-steel-elements`,
branch `sc120-d2-steel-compositions`, tip `a78845a` (verified), base `origin/develop` `c09cf6f`.

---

## VERDICT: **FIX ROUND NEEDED**

2 HIGH / 1 MED / 4 LOW / 7 INFO. Zero CRIT.

Every gate is green-or-expected and independently re-measured; all 24 freeze hashes are
byte-identical to the ones the round-6/fix-round-1 report recorded (cross-machine
determinism confirmation). The crest tightening (ruling 14) is correct and provably
can-fail. The two HIGH findings are **content deletion**: `stripLabeledLines` removes body
lines that the composition does not render anywhere, and it removes more of a line than the
label it matched. One is demonstrated on real published corpus data; the other is
demonstrated in the shipped `treasure` fixture and is therefore **already baked into the
`treasure--steel-print` shot Scott is being asked to sanction**. Both close with one
value-aware change to the same helper.

Ruling 21 ("fixture-yaml gaps accepted; reviewer may still weigh in") is where HIGH-2
lands: the gap itself is harmless, but the *strip* turns it into deletion, which the ruling
did not have on the record.

---

## Findings

### HIGH-1 — `stripLabeledLines` deletes everything else on a matched line; real corpus loses a whole rules paragraph

**Where.** `src/elements/shared/CardLayout.ts:272` (`LABELED_LINE_RE`) and
`:295-317` (`stripLabeledLines` — `continue` drops the entire `line`). Consumers:
`src/elements/display/layouts.ts:551-568` (treasure), `:1084-1092` (title),
`:1219-1227` (complication), `:710-717` (culture).

**Failure scenario (real, shipped data — not synthetic).**
`v2/docs/Browse/treasure/1st-echelon/consumable/portable-cloud.md` carries **three**
`**[Item Prerequisite](…):**` lines, and the second one packs an entire treasure variant
onto the same physical line:

```
**[Item Prerequisite](…/item-prerequisite.md):** An ounce of undead flesh. **Thunderhead Cloud:** Small lightning bolts arc around the black cloud in this sphere, which creates a 3 [cube](…) of cloud and lightning when broken. Each creature who enters the cloud for the first time in a [combat round](…) or starts their turn there takes 5 lightning damage. Additionally, any creature is [slowed](…) while in the cloud.
```

`LABELED_LINE_RE` matches the leading bold run (`[Item Prerequisite](…)` → normalizes to
`item prerequisite`, in treasure's label list), so the **whole line is dropped**. The
Prerequisite band renders only `m.item_prerequisite` (the *primary* prerequisite from
frontmatter), so on the Steel branch the Portable Cloud card loses the entire **Thunderhead
Cloud** variant — its name, its ~330-character rules paragraph, and both secondary
prerequisites. The base branch renders all of it. The design's §5.2 mitigation ("strip that
line and any immediately following blank line, never a following paragraph") assumed
one label ⇒ one line ⇒ one value; the corpus violates that.

Same mechanism, currently benign, in three more treasures where **both** labels on the
shared line happen to be band-covered:
`treasure/leveled/weapon/longclaw.md`, `treasure/leveled/armor/pack-harness.md`,
`treasure/leveled/armor/telekinetic-bulwark.md` — e.g.
`**Keywords:** Magic, Medium Weapon **Item Prerequisite:** The claws of a dragon`.
Nothing is lost there today only by luck of which fields are populated.

**Prescribed fix (shared with HIGH-2).** Make the strip **value-aware** instead of
label-aware: pass `{label, value}` pairs (the value the band actually renders) and strip the
line only when the line's post-label remainder `normalizeForDuplicateCheck`-equals (or
starts with) that value. A line carrying anything beyond the band's own value is then left
alone by construction, and a label with no band value is never stripped (HIGH-2). Minimum
acceptable alternative: refuse to strip any line that contains a second bold run after the
matched label.

---

### HIGH-2 — the strip label list is unconditional while the bands that replace it are conditional: content deleted with no structural replacement, visible in the sanction shot

**Where.** `src/elements/display/layouts.ts:553-561` (treasure's `labels` array is built
unconditionally) vs `:486-521` (Project/Prerequisite/Source/Effect bands each gated on their
own field). Same shape at `:1086` vs `:1064-1077` (title) and `:1221` vs `:1202-1215`
(complication).

**Failure scenario (the plugin's own shipped fixture).**
`src/elements/display/treasure/example.yaml` has `content` carrying

```
**[Item Prerequisite](scc.v1:…):** A pint of blue ichor, soul chalk
**[Project Source](scc.v1:…):** Licensing agreements in Anjali
```

but **no** `item_prerequisite` / `project_source` frontmatter keys. Result:
- `if (prereq)` / `if (projectSource)` are false ⇒ no Prerequisite band, no Source band;
- `'Item Prerequisite'` and `'Project Source'` are in the strip list unconditionally ⇒ both
  body lines are removed.

Both facts are visible in the evidence PNG I eyeballed
(`sc120-after-treasure--steel-dark.png`): the card goes crest/eyebrow → keyword chips →
PROJECT tiles → EFFECT → body, and the strings "A pint of blue ichor" and "Licensing
agreements in Anjali" appear nowhere. The **base branch renders both lines** (the rows are
absent because the fields are, so `renderBase()` prints the body whole). So this is an
information regression against the base branch for that input — and it is baked into
`treasure--steel-{print,realprint}.png`, i.e. into the bytes Scott is being asked to sanction.

Latent, same code shape:
- title strips `'Echelon'` unconditionally, but the echelon only reaches the head via
  `eyebrow: m.echelon ? … : 'Title'` — a title whose body carries `**Echelon:** 3rd` with no
  `echelon` frontmatter loses the echelon entirely;
- complication strips `'Benefit'`/`'Drawback'` unconditionally against bands gated on
  `m.benefit`/`m.drawback`.

The real *generated* corpus never triggers this (I verified frontmatter-vs-body consistency
across all 127 treasures, 66 titles, 100 complications, 13 cultures — 0 mismatches, see the
probe table below), which is why this is HIGH and not CRIT. It is reachable today via the
shipped example shape, and hand-authored `ds-treasure` / `ds-title` fences copied from that
example are the ordinary user path.

**Prescribed fix.** The HIGH-1 fix subsumes this: with `{label, value}` pairs, a label whose
band was not pushed carries no value, so its line is never stripped. Cheap interim: build
`labels` from the same conditions the bands use (`if (prereq) labels.push('Item
Prerequisite')`, etc.). Culture already has the right shape — its band is *sourced from* the
body line via `bodyLabeledLine`, so strip and render can never disagree.

---

### MED-1 — the flavor band never fires on real data; the flavor text is displaced to the bottom of the card, splitting treasure's Effect from its rider

**Where.** `src/elements/display/layouts.ts:468-477` (treasure), `:1050-1059` (title),
`:1189-1198` (complication), `:683-692` (culture) — the `flavorDuplicatesBody` guard —
against the design's band orders (§3.3 band 2, §3.4 band 1, §3.5 band 1, §3.6 band 1).

**Failure scenario.** `flavor` is, corpus-wide, an extraction of the body's *lead paragraph*,
so `normalizedBody.startsWith(normalizeForDuplicateCheck(flavor))` is true for essentially
every real card. The flavor band is therefore suppressed **always**, and the flavor prose
instead reaches the reader inside the trailing body band — which policy (B) now places
*below* every structural band. Confirmed in three of the four evidence shots:

- `sc120-after-title--steel-dark.png`: "*Hi! Remember me?*" renders **below** the EFFECT
  band. On the base branch it was the first line of the card body.
- `sc120-after-complication--steel-dark.png`: "Perhaps the stars marked you out at birth…"
  renders **below** DRAWBACK.
- `sc120-after-treasure--steel-dark.png`: worse — the flavor line lands **between** the
  Effect band's sentence and the "Additionally, when you are targeted…" rider that
  continues it. §3.3 explicitly required the rider to survive; it survives but is now
  separated from its referent by an unrelated italic paragraph.

The design intended flavor near the top for all four families. As shipped, no real card ever
shows it there.

**Prescribed fix.** When `flavorDuplicatesBody` is true in a policy-(B) family, render the
flavor band **and** remove the duplicated lead paragraph from the stripped body (rather than
suppressing the band and leaving the paragraph in place). Alternatively the owner may
consciously accept the new order — but it should be a ruling, not a side effect, since it is
in three of the four sanction shots. Note the same pattern exists for ancestry (Batch C,
already LAND-READY); flagging, not re-opening.

---

### LOW-1 — `bodyLabeledLine` and `stripLabeledLines` disagree on indentation, so an indented culture label can double-render

`src/elements/display/layouts.ts:162-173` trims each line before the prefix test
(`const t = raw.trim(); if (t.startsWith(prefix))`), while
`src/elements/shared/CardLayout.ts:305` deliberately matches the **raw** line at column 0
(Batch A round-5 LOW-2). A culture body with `    **Skill Options:** …` nested under a list
item would therefore populate the Skill Options band *and* keep the same line in the body.
Corpus-safe today: I verified all 13 cultures carry the label at column 0. Fix: give
`bodyLabeledLine` the same column-0 requirement.

### LOW-2 — the label set is lower-cased but compared against a fully normalized bold run

`src/elements/shared/CardLayout.ts:296` builds `wanted` with `labels.map(l => l.toLowerCase())`
but line `:307` compares `normalizeForDuplicateCheck(captured)`, which additionally strips
markdown and collapses whitespace. A label carrying a double space or an emphasis marker
would silently never match itself. Today's literals are safe, but treasure's per-tier labels
are **data-derived** (`layouts.ts:560`, `${key} Level` from `level_effects` keys), so a key
with stray whitespace would produce a label that can never match. Fix: run the labels
through `normalizeForDuplicateCheck` too.

### LOW-3 — a label alone on its own line orphans (and then double-renders) its value

Probed: `stripLabeledLines("**Effect:**\n\nThe effect text…", ['Effect'])` returns
`"The effect text…"` — the label line goes, the value paragraph stays, and the Effect band
renders the same text from `m.effect`, so the card shows it twice. Not present in today's
corpus (0 occurrences across the four families), and the HIGH-1 value-aware fix removes the
class. Recording it so the fix round covers it deliberately.

### LOW-4 — the test suite pins the lossy behavior instead of guarding against it

`test/dom/elements/displaySteelBatchB.test.ts:128` asserts
`bandHeadTexts(card)).toEqual(['Project', 'Effect'])` and `:151-167` asserts what the body
keeps — neither asserts that the fixture's own `A pint of blue ichor` / `Licensing
agreements in Anjali` survive somewhere. There is also no test for (a) a labeled body line
whose model field is absent, or (b) a line carrying two labels / trailing content. Add both
as regression tests with the HIGH fix (they are the exact cases §5.2 named as the batch's
risk).

---

## INFO (no action)

1. **No CSS was touched at all.** `git diff --name-only 05a09d7..a78845a` returns 7 files,
   none a stylesheet. §4.2's dark-mode material rule is vacuously satisfied — no sunken
   surface was added, so no `--dse-surface-sunken` question arises inside Steel card scope.
   The report's "zero new CSS" claim is accurate.
2. **`rightEyebrow` is genuinely additive.** `rightEyebrow` already existed as a `cardHead`
   option (`src/framework/kit/cardHead.ts:31,46,97`) and `mountSlot` returns early on
   `text === undefined` ("an omitted slot is a GAP", `:83`). Batch B only wired the
   composition seam (`CardLayout.ts:141`, `:501`). Confirmed empirically: `kit` and
   `kit-collapsed` print+realprint hashes are byte-identical to the shared baseline (checked
   directly — `check-freeze.sh` only prints failures), and all 14 Batch A/C hashes are
   unchanged.
3. **Base-branch integrity holds (ruling 8).** The only deletions in `layouts.ts` between
   `05a09d7` and `a78845a` are the career stripper's own internals (refactored onto
   `stripLabeledLines`) plus one import line. No `title`/`subtitle`/`badges`/`rows`/`body`/
   `useSourceBody` line of treasure/title/complication/culture changed. Culture's legacy
   `rows` (Environment/Organization/Upbringing/Language/Quick-build/Skill options,
   `layouts.ts:652-662`) are intact per §3.6. The four `base*Layout` steel-less clones in
   `displayFamily.test.ts` and the culture clone in `kitSteel.test.ts` keep base-branch DOM
   coverage alive.
4. **Ruling 19 landed correctly.** `treasureLayout.steel.eyebrow` (`layouts.ts:433-438`)
   prefers echelon, falls back to level, then bare type; the shot reads
   "◆ TRINKET · ECHELON 1". Title's grammar matches (`Echelon 3`). Crests render:
   `package` / `crown` / `octagon-alert` / `map`. Band order per family matches §3.3-§3.6.
   No duplicated content between bands and body — the treasure double-render defect the
   ticket named is **gone** (verified in the shot: Project values and the Effect sentence
   each appear exactly once).
5. **Combined-label complications are handled correctly by accident-free logic.** 8 of 100
   complications carry a single `**Benefit and Drawback:**` line and have **no**
   `benefit`/`drawback` frontmatter (`feytouched`, `misunderstood`, `curse-of-poverty`,
   `self-taught`, `medium`, `shared-spirit`, `curse-of-misfortune`, `advanced-studies`) —
   no bands, no strip, the line renders in the body. The other 92 carry both fields and both
   labels. No double render either way.
6. **Culture's three-way fallback is exercised on 13/13 real cultures** via
   `bodyLabeledLine` (`skill_options`/`quick_build_skill` are frontmatter-empty corpus-wide,
   as §1.3 predicted). Band renders, label line strips, no dupe, no loss.
7. **Ruling 18's `languageCount` delta is correct.** `layouts.ts:89-132`: `COUNT_WORD_TO_DIGIT`
   covers one..ten, the suffix strip runs before the lookup (`' languages'` tried before
   `' language'`, so "Two languages" → "2"), and the fallback preserves the suffix-stripped
   string rather than emptying it. Both properties are test-guarded and both proved can-fail
   (see probes c / c2). `statTiles()` still owns the `''` → `—` dash, so an absent field is
   unaffected.

---

## Independently measured gates

Run in dse-verify order, all foreground, devbox-wrapped with the gate command LAST inside
`bash -c` and output redirected to files (exit codes captured in a wrapper script, never
echoed through double quotes). `rm -f main.js styles.css` before jest. `/proc/loadavg` at
start: 1.29 — no load-sensitive-timeout risk.

| # | Gate | Exit | Result |
|---|---|---|---|
| 1 | `npm run tsc` | 0 | clean, no output |
| 2 | `npm run lint` | 0 | clean (only the pre-existing `.eslintignore` deprecation notice) |
| 3 | `npx jest` | 0 | **Suites 189 passed + 1 skipped / 190; Tests 3375 passed + 1 skipped / 3376**; snapshots 3/3 |
| 4 | `npm run shots` | 0 | **474 PNGs, 0 FAIL**; `host-copy pin OK` (verbatim Obsidian 1.13.7 — not PARTIAL on this host); `button host-leak OK (111 kinds × 3 states × dark/light = 666 comparisons)`; `print-twin parity OK (118 capture ids)` |
| 5 | freeze (`check-freeze.sh <shots>`) | 1 | **exactly 24 checksum mismatches, 0 missing** — expected violation |
| 6 | `npm run parity` (LAST) | 0 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** |

**Freeze mismatch set — exactly the expected 24 names, nothing else:**
`{ancestry, career, class, complication, complication-edit-btn, condition, culture, perk,
perk-narrow, rule, title, treasure} × {--steel-print, --steel-realprint}`.

`kit--steel-print`, `kit--steel-realprint`, `kit-collapsed--steel-print`,
`kit-collapsed--steel-realprint` verified `OK` by **direct hash comparison against
`.superpowers/sdd/freeze-baseline.sha256`** (the script prints only failures, so absence
from its output is not proof). Baseline is 210 lines; count unchanged, hash swaps only.

**Batch B family hashes I measured (twin == realprint in every pair):**

```
395c8bdf98497f1decb0ecbffd25aeec9dbb3b83680357668996ab61d95dd08f  treasure--steel-print.png
395c8bdf98497f1decb0ecbffd25aeec9dbb3b83680357668996ab61d95dd08f  treasure--steel-realprint.png
8c701e289ef91b5ee6a89814d5427bceaf97ef9d1f6190fcff7f502575398fa0  title--steel-print.png
8c701e289ef91b5ee6a89814d5427bceaf97ef9d1f6190fcff7f502575398fa0  title--steel-realprint.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication--steel-print.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication--steel-realprint.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication-edit-btn--steel-print.png
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication-edit-btn--steel-realprint.png
4dc71e9191544262fa963c8b0744c1ea20b96a3716cf311ac3a8b0dec5fc6ede  culture--steel-print.png
4dc71e9191544262fa963c8b0744c1ea20b96a3716cf311ac3a8b0dec5fc6ede  culture--steel-realprint.png
```

All ten are **byte-identical to the values recorded in `sc120-r6-batchB-report.md`** (the
post-ruling-19 treasure hash `395c8bdf…`, not round 6's `9c775a76…`), and
`complication == complication-edit-btn` reproduces on this machine too — confirming ruling
20's "the authoring pencil is print-inert". This is an independent cross-machine
determinism check on top of the implementer's three same-machine runs; I did not re-run
`shots` a second time locally.

`token-coverage.test.ts` was green, so the stale-superproject-pin footgun did not apply.

---

## What I probed

**Can-fail proofs.** Each mutation applied, the target suite run, then `git checkout --`;
`git status --porcelain` empty at the end (verified twice — once after the mutation sweep,
once after deleting the probe file).

| # | Mutation | Suite | Result |
|---|---|---|---|
| a1 | `complicationLayout.crestIcon` → `'alert-octagon'` (the deprecated alias ruling 14 names) | `crestIconValidity` | **RED** — 1 failed / 13 |
| a2 | `complicationLayout.crestIcon` → `'not-an-icon-zz'` | `crestIconValidity` | **RED** — 1 failed / 13 |
| b1 | `LABELED_LINE_RE` colon made OPTIONAL again (`/^\*\*(.+?):?\*\*:?/`) | `cardLayoutHelpers` | **RED** — 1 failed / 29 (the `**Wealth** is a measure…` guard) |
| b2 | drop link-text matching (`wanted.has(captured.toLowerCase())`) | `cardLayoutHelpers` | **RED** — 4 failed / 29 |
| b3 | match against `line.trim()` (allow indented lines) | `cardLayoutHelpers` | **RED** — 1 failed / 29 |
| b4′ | swallow everything after a stripped label until the next label/heading (eat the following paragraph) | `cardLayoutHelpers` / `displaySteelBatchB` | **RED** — 3/29 and 2/33; the two DOM failures are exactly the `"Additionally, …" rider` and `marshal.md bullet-list benefits survive` tests |
| c | `languageCount` fallback → `''` for an unrecognized word | `cardLayoutHelpers` | **RED** — 2 failed / 29 |
| c2 | `languageCount` reverted to the count WORD (pre-ruling-18) | `cardLayoutHelpers` | **RED** — 4 failed / 29 |

An earlier b4 attempt (swallow consecutive blanks) was a semantic no-op and passed; I
discarded it and re-ran the real paragraph-eating mutation as b4′. Reported so the "b4
passed" line is not mistaken for a gap.

**Real-corpus strip probe.** A temporary jest file (deleted; tree verified clean) ran the
real `stripLabeledLines` / `bodyLabeledLine` over every `v2/docs/Browse/{treasure,title,
complication,culture}/**.md` in this worktree, with each family's actual label set
(treasure's per-tier labels derived from each file's own `level_effects` keys), diffing
before/after line sets:

| family | files | over-strip of an unlabeled line | label stripped with no model field | rider/table/paragraph lost | indented line stripped |
|---|---|---|---|---|---|
| treasure | 127 | 0 | 0 | 0 (3 flagged lines were probe artifacts — trailing whitespace trimmed by the helper's final `.trim()`, content intact) | 0 |
| title | 66 | 0 | 0 | 0 | 0 |
| complication | 100 | 0 | 0 | 0 | 0 |
| culture | 13 | 0 | 13, all benign (band is sourced *from* the stripped line via `bodyLabeledLine`) | 0 | 0 |

Additional corpus facts the probe established:

- Bold-label census across the four families: the only labels stripped are the intended
  ones. Untouched survivors include `**Special:**` (6 treasure, 7 title, 2 complication),
  `**Benefit and Drawback:**` (8 complication), the 14 named treasure-variant labels
  (`**Noxious Cloud:**`, `**Turn the Tide:**`, …), and 4 treasure-shaped labels that appear
  inside a complication body.
- **1 file with duplicate labels: `portable-cloud.md`, `item prerequisite` × 3** — the
  HIGH-1 case.
- Frontmatter-vs-body consistency: treasure `item_prerequisite` 124/124, `project_source`
  124 fm vs 119 body, `project_goal` 124/124, `effect` 78/78, `keywords` 127/127,
  `level_effects` 47; title `prerequisite`/`effect`/`echelon` 65 each with 65 matching body
  labels; complication `benefit`/`drawback` 92 each. **Zero body-label-without-field cases
  in the generated corpus** — which is why HIGH-2 is fixture/hand-authoring-reachable rather
  than corpus-reachable.

**Synthetic mitigation probes** (real helper, direct calls):

| input | result | verdict |
|---|---|---|
| `**Wealth** is a measure of…` + following paragraph | untouched | colon-mandatory mitigation holds |
| `- item` / `    **Perk:** something` / `After.` | untouched | indented-continuation rule holds (Batch A inherited) |
| `**Effect:** one` / blank / `**Effect:** two` / `Tail.` | both stripped, `Tail.` kept | no cross-talk; both lines treated identically |
| `**Effect:** eff.` + `Additionally, …` + a markdown table | label line only removed; rider and table survive | §3.3's stated requirement holds |
| `**Effect:**` alone + value on the next paragraph | label removed, value paragraph kept | LOW-3 |

**Evidence shots eyeballed** against the design's per-family band specs:
`sc120-after-{treasure,title,complication,culture}--steel-dark.png`. Bands present and
ordered per §3.3-§3.6; dash semantics correct (treasure's 2-up Project tiles both populated,
`plainText()` link-stripped to "Reason or Intuition"); eyebrows correct
("TRINKET · ECHELON 1", "ECHELON 3", "COMPLICATION", "CULTURE"); crests correct; the
treasure double-render defect is gone. Deviations found are MED-1 (flavor at the bottom)
and HIGH-2 (two fixture lines missing entirely).

---

## Housekeeping

- Nothing under `/home/scott/code/steelCompendium/workspace/` was written except this file.
- No branch code was edited: every mutation was reverted with `git checkout --`, the
  temporary probe test was deleted, and `git status --porcelain` in
  `draw-steel-elements/` is **empty**.
- Linear was never contacted.
- Scratch scripts and logs live under the session scratchpad, not the ledger dir.

---

# Delta re-review (fix round 2, fresh reviewer)

Reviewer: fresh Opus agent, wrote none of this code; r7's transcript expired, context rebuilt
from `decisions.md` (rulings 22–25), the r7 review above, the fix-round-2 section of
`sc120-r6-batchB-report.md`, and the `dse-verify` skill.
Scope: commit `6fb65b8` ALONE, against the r7 findings and rulings 22–24. Not a fresh full pass.
Worktree verified: `/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions/draw-steel-elements`,
branch `sc120-d2-steel-compositions`, tip `6fb65b8` on `a78845a`, base `origin/develop` `c09cf6f`,
`git status --porcelain` empty at start and at end.

## VERDICT: **CLEAN — Batch B is land-ready at `6fb65b8`**

0 CRIT / 0 HIGH / 0 MED **in the delta**. Every in-scope r7 finding is closed and provably
can-fail-guarded; all six gates independently re-measured; the ruling 22(iv) class/career
byte-identity invariant holds by direct `sha256sum`.

Carried out of scope, reported not fixed: **1 MED NOTED** on `career` (r7's HIGH-2 shape
survives there — ruling 22(iv) put career's bytes off-limits this round; prescribed as a
Backlog ticket, see "Judgment call 2"), plus **3 INFO**.

## Per-finding disposition (verified, not taken on the fixer's word)

| r7 finding | Verified closed? | How I proved it |
|---|---|---|
| **HIGH-1** packed line loses the Thunderhead Cloud variant | **YES** | Ran the production `treasureLayout.steel.bands()` closure over the REAL `v2/docs/Browse/treasure/1st-echelon/consumable/portable-cloud.md` (frontmatter parsed with `js-yaml`, body verbatim). Rendered output contains `Thunderhead Cloud`, `Small lightning bolts arc around the black cloud`, `Noxious Cloud`, `An ounce of undead flesh`, `A spool of copper wire`, `Enterprising mages`. The model's own (first) Item Prerequisite value `A cup of rainwater` is correctly gone (the Prerequisite band renders it). Mutation M1 (drop the `consumed` guard) and M2 (whole-line strip) both turn this RED. |
| **HIGH-2** unconditional strip vs conditional bands | **YES** | Ran the closure over the shipped `treasure/example.yaml` (`yaml.load`ed — note the jest `.yaml` transform yields a raw STRING, so a naive `new Treasure(import)` silently yields an empty model; I hit and corrected that in my own probe). Band heads are `["Project","Effect"]` — no Prerequisite, no Source — and the trailing body carries **`A pint of blue ichor, soul chalk`** and **`Licensing agreements in Anjali`**. Confirmed visually in the regenerated `treasure--steel-dark.png` (both lines now render at the card foot). Mutation M2 (revert the gated `labels` array to the unconditional list) turns the DOM regression test RED. |
| **MED-1(a)** Effect/rider coherence (ruling 23(a)) | **YES** | `extractLabeledLineAndRider` verified by reading + by census: over all 127 corpus treasures, 25 have a non-empty absorbed rider; every one stops at the next column-0 bold-labeled line or a heading, so nothing crosses a structural boundary. Fallback verified: when `m.effect` is absent, `'Effect'` is never in `labels` and the line + rider stay in the body untouched (title HIGH-2 regression test covers the same shape). Mutation M3 (rider absorption neutered) turns 2 DOM tests RED. |
| **LOW-1** `bodyLabeledLine` trim-vs-raw | **YES** | `bodyLabeledLine('- item\n    **Skill Options:** …')` → `undefined`, and `stripLabeledLines` returns the input unchanged — the two helpers now agree at column 0. Mutation M4 (restore the trim) turns the LOW-1 test RED. |
| **LOW-2** label-set normalization | **YES** | `stripLabeledLines('**1st Level:** v', ['1st  Level'])` → `''` and `stripLabeledLines('**[9th](x) Level:** v', ['9th Level'])` → `''`. Both sides now run `normalizeForDuplicateCheck`. |
| **LOW-3** orphaned label-only line | **YES (no code change, correctly)** | Confirmed the shape produces duplication, never deletion — ruling 22(iii)'s preferred failure mode — and is pinned by a dedicated regression test. |
| **LOW-4** tests pin the corrected behavior | **YES** | +10 tests (jest 3375→3385). The Thunderhead Cloud case is asserted at BOTH the shared-helper level and the full-composition level, as ruling 24 asked. |
| **MED-1(b)** / 7 INFO | out of scope, confirmed untouched | No flavor band moved, no dedup guard inverted — SC-280 remains the owner of the global flavor position. |

## Independently measured gates

Run in dse-verify order, all FOREGROUND, devbox-wrapped via wrapper script files with the gate
command LAST and output redirected to log files (exit codes captured in the script, never echoed
through double quotes). `rm -f main.js styles.css` before jest. `/proc/loadavg` at start: 0.29 —
no load-sensitive-timeout risk.

| # | Gate | Exit | Result |
|---|---|---|---|
| 1 | `npm run tsc` | 0 | clean, no output |
| 2 | `npm run lint` | 0 | clean (only the pre-existing `.eslintignore` deprecation notice) |
| 3 | `npx jest` | 0 | **Suites 189 passed + 1 skipped / 190; Tests 3385 passed + 1 skipped / 3386**; snapshots 3/3 — matches the fixer's claim exactly (+10 over r7's 3375) |
| 4 | `npm run shots` (×1) | 0 | **474 PNGs, 0 FAIL**; `host-copy pin OK` (verbatim Obsidian 1.13.7 — not PARTIAL on this host); `button host-leak OK (111 kinds × 3 states × dark/light = 666 comparisons)`; `chrome host-leak OK (18 combos)`; `print-twin parity OK (118 capture ids)`; `nested corner-radius OK` |
| 5 | freeze (`check-freeze.sh <shots>`) | 1 | **exactly 24 checksum mismatches, 0 missing** — expected violation, same 24 NAMES as r7 |
| 6 | `npm run parity` (LAST) | 0 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** |

**Freeze mismatch set — exactly the expected 24, nothing else:**
`{ancestry, career, class, complication, complication-edit-btn, condition, culture, perk,
perk-narrow, rule, title, treasure} × {--steel-print, --steel-realprint}`.

**Hashes I measured myself (`sha256sum` on the regenerated shots):**

```
4d464d4260ce903f1a1141564eef17b75cf62282d1eb502725740c04c495c24f  treasure--steel-print.png      MOVED (was 395c8bdf…)
4d464d4260ce903f1a1141564eef17b75cf62282d1eb502725740c04c495c24f  treasure--steel-realprint.png  print == realprint ✓
8c701e289ef91b5ee6a89814d5427bceaf97ef9d1f6190fcff7f502575398fa0  title--steel-{print,realprint}.png              unchanged
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication--steel-{print,realprint}.png        unchanged
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication-edit-btn--steel-{print,realprint}.png unchanged (== complication, ruling 20 reproduced)
4dc71e9191544262fa963c8b0744c1ea20b96a3716cf311ac3a8b0dec5fc6ede  culture--steel-{print,realprint}.png             unchanged
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-{print,realprint}.png    RULING 22(iv) INVARIANT HELD
681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d  career--steel-{print,realprint}.png   RULING 22(iv) INVARIANT HELD
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-print.png    unchanged
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-print.png   unchanged
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-print.png        unchanged
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-print.png unchanged
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-print.png        unchanged
```

Every one matches the fixer's per-family table and (for the 22 unmoved) r7's own recorded values —
a third independent confirmation of determinism. `kit--steel-{print,realprint}` and
`kit-collapsed--steel-{print,realprint}` verified **`: OK` by direct `sha256sum -c` against
`.superpowers/sdd/freeze-baseline.sha256`** (the script prints only failures, so absence is not
proof). Baseline is **210 lines**, unchanged; hash swaps only. I did not run `shots` a second
time — the fixer's two-run determinism plus this third cross-session reproduction of all 24
hashes is stronger evidence than a fourth same-session run.

**Evidence-file freshness (sanction-ask integrity):** `sc120-after-treasure--steel-dark.png` and
`sc120-after-treasure--steel-print.png` in this ledger dir are **byte-identical** to my freshly
regenerated `treasure--steel-{dark,print}.png` (`73d55834…` / `4d464d42…`). The Batch B ask
shows current bytes.

## What I probed

**Can-fail proofs (4 mutations, each applied → target suites run → `git checkout --` → tree
re-verified clean).**

| # | Mutation | Suites | Result |
|---|---|---|---|
| M1 | drop the first-occurrence-only guard (`&& !consumed.has(...)`) in `CardLayout.ts:stripLabeledLines` | `cardLayoutHelpers` + `displaySteelBatchB` | **RED — 2 failed / 72**: the unit `portable-cloud.md` corpus regression AND the DOM end-to-end Thunderhead Cloud test |
| M2 | revert treasure's `labels` to the unconditional r7-era list (+ `levelKeys` for `presentLevelKeys`) | same | **RED — 1 failed / 72**: `HIGH-2 regression: a labeled body line whose model field is ABSENT is never stripped` |
| M3 | neuter `extractLabeledLineAndRider` (always return the body unchanged, rider undefined) | same | **RED — 2 failed / 72**: the Effect-rider DOM test AND the portable-cloud composition test |
| M4 | restore `bodyLabeledLine`'s trim-then-match | same | **RED — 1 failed / 72**: the LOW-1 indented-label test |

**Independent real-corpus content-preservation scan** (temporary jest file, deleted; tree
verified clean afterward). Real frontmatter + real body from every `v2/docs/Browse/**` file in
this worktree, fed through the ACTUAL production `*Layout.steel.bands()` closures (not a
reimplementation); every source paragraph, segment-split on column-0 bold labels, must survive
somewhere in the rendered output under `normalizeForDuplicateCheck`, with keyword chips checked
token-by-token (they render as undelimited sibling spans) and career's `languageCount` numeral
transform allowed:

| family | files | content losses |
|---|---|---|
| treasure | 127 | **0** |
| title | 66 | **0** |
| complication | 100 | **0** |
| culture | 13 | **0** |
| **career** (added by me — r7 never scanned it) | 18 | **0** |

**Rider-absorption census (treasure, 127 files).** 25 treasures have a non-empty absorbed rider.
Every rider terminates at the next column-0 labeled line or a markdown heading, so nothing
crosses a structural boundary. Two shapes: (a) a `- **≤11:** / - **12-16:** …` power-roll tier
list (`black-ash-dart`, `lachomp-tooth`, `timesplitter`, `telemagnet`, `stop-n-go-coin`) — these
bullets are not column-0 labeled, so they are absorbed, and the result is a coherence WIN (the
tier list now sits under EFFECT instead of stranded below the flavor); (b) an
"Additionally, …"/continuation paragraph (`color-cloak-{blue,red,yellow}`, `giants-blood-flame`,
`pocket-homunculus`, `scroll-of-resurrection`, `thunder-chariot`, `anamorphic-larva`,
`flameshade-gloves`). Zero corpus treasures carry both an `**Effect:**` line and `level_effects`,
so the rider can never eat a tier band's text. Largest absorption: 686 chars (`stop-n-go-coin`) —
all of it genuinely continuation prose for that effect.

**Synthetic edge probes (real helper, direct calls).**

| input | result | verdict |
|---|---|---|
| `**Special:** foo. **Effect:** bar baz.` with `labels: ['Effect']` | returned unchanged | leading label not wanted ⇒ whole line kept ⇒ DUPLICATION, never deletion (ruling 22(iii)) — INFO 1 |
| `**Item Prerequisite:** VARIANT\n\n**Item Prerequisite:** CANONICAL` | keeps only the SECOND | first-occurrence-only strips by position, not value — INFO 2 |
| `**Effect:**` alone + value paragraph below | label line strips, value survives | LOW-3 preserved as duplication |

## Judgment call 1 — the first-occurrence-only extension (beyond ruling 22's text): **CORRECT, keep it**

For `portable-cloud.md` keeping the later repeats is **right**, and deleting them would be
HIGH-1 under a different name:

- The Prerequisite band renders `m.item_prerequisite` = *"A cup of rainwater from a sacred fey
  grove, plus an optional prerequisite (see below)"* — the FIRST occurrence only.
- The 2nd and 3rd `**[Item Prerequisite](…):**` lines carry *"An ounce of undead flesh"* and
  *"A spool of copper wire"* — the **secondary** prerequisites belonging to the Thunderhead Cloud
  and (implicitly) the third variant. Nothing structural renders them. Stripping them for merely
  sharing a label is exactly the "content deleted with no replacement" class ruling 22 was
  written to end.
- It reintroduces **no** duplication the band covers: the one occurrence the band does render is
  the one that strips. Verified end-to-end — the rendered card shows *"A cup of rainwater"* once
  (in the band) and never in the body.
- Corpus cost is zero: `portable-cloud.md` is the only file in 306 with a repeated label
  (r7's census; my preservation scan found 0 losses and no duplication complaints anywhere).

**INFO 2 (residual window, not a blocker).** The rule assumes the band's value is always the
FIRST occurrence in reading order. Probed: with `VARIANT` before `CANONICAL`, the VARIANT line's
value is the one deleted. Corpus-safe today (canonical always leads), and strictly better than
the pre-fix behavior (which deleted all occurrences). Closing this properly needs the value
comparison ruling 22(ii) explicitly declined, so it is a future-ticket note, not a fix-round item.

## Judgment call 2 — career's latent HIGH-2 shape: **IT SURVIVES.** MED, NOTED, Backlog

The gate is **not** trivially satisfied. Two distinct sub-cases, both proven by running the real
`careerLayout.steel.bands()` closure:

1. **`Skills` and `Perk`: no band renders at all, and the line is still deleted.**
   `CAREER_BODY_LABELS` (`layouts.ts:840`) lists all six labels unconditionally, but the Skills
   band is gated `if (skillsText)` (`layouts.ts:959`) and the Perk band `if (perkText)`
   (`:966`). A `Career` with `content` carrying `**Skills:** Criminal Underworld, Sneak` and no
   `skills`/`skill_group` renders **no Skills band and no body line** — measured:
   `survives=false`. Same for `**Perk:** Shadowmeld` → `survives=false`. This is r7's HIGH-2
   verbatim, on career.
2. **`Languages`/`Renown`/`Wealth`/`Project Points`: the band renders, but not the value.**
   The `Career Benefits` band IS pushed unconditionally (`layouts.ts:944-954`) with `statTiles`
   dash-fill semantics — so on a literal reading of ruling 22(i) ("the replacing band actually
   renders") the gate passes. But measured: `**Renown:** 1` with no `m.renown` renders the tile
   as **`—`** and deletes `1` from the body (`survives=false`); likewise Wealth `3`, Languages
   `Two languages`, Project Points `21`. The band renders a dash where the body had data. That
   satisfies 22(i)'s letter and violates 22(iii)'s spirit (duplication over deletion).

**Reachability.** My 18-file career corpus scan found **0 losses** — every real generated career
carries the field whenever the body carries the label, exactly as r7 found for the Batch B
families. So this is fixture/hand-authoring-reachable, not corpus-reachable, and it is **not** in
any sanction shot: the harness `career/example.yaml` populates `skills`/`language`/`renown`/
`wealth`/`perk` and carries no `**Project Points:**` body line, so `career--steel-*` is unaffected.

**Severity: MED.** Same defect class r7 rated HIGH for treasure, one step down because (a) it is
absent from the evidence bytes Scott is being asked to sanction, and (b) it is unreachable in the
generated corpus.

**Prescribed disposition — a Backlog ticket linking SC-120, not a code change in this delta.**
Ruling 22(iv) put career's bytes under Scott's live Batch A sanction ask, and the fixer was right
to leave them alone. For the owner's convenience I verified the eventual fix would be
**byte-neutral**: gating each career label on the model field its surface actually shows
(`m.skills||m.skill_group` → `'Skills'`, `m.perk||m.perk_group` → `'Perk'`, `m.language` →
`'Languages'`, `m.project_points` → `'Project Points'`, `m.renown` → `'Renown'`, `m.wealth` →
`'Wealth'`) produces an identical strip list for `career/example.yaml`, so `career--steel-print`
would not move. The owner may therefore choose to fold it in now or file it; either is
byte-safe. **I am not filing anything — workers never touch the tracker.**

## INFO (no action)

1. **A wanted label that is NOT the line's leading segment is never stripped.** `stripLabeledLines`
   only enters the segment path when the LEADING label is wanted (`CardLayout.ts:367-370`), so
   `**Special:** foo. **Effect:** bar` keeps the Effect segment while the Effect band also renders
   it — duplication. This is the correct side of ruling 22(iii) and matches r7's own "minimum
   acceptable alternative"; recording it so it isn't rediscovered as a defect.
2. First-occurrence-only strips by position, not value — see Judgment call 1.
3. **Rider absorption slightly REORDERS `portable-cloud`.** The absorbed rider ("Enterprising
   mages … variations …") now sits inside the EFFECT band, above the flavor line, while the
   variants it introduces (Noxious/Thunderhead) stay in the trailing body below the flavor — so
   the intro is separated from its own list by the flavor paragraph. No content moves or is lost,
   and the cause is MED-1(b)'s flavor position, not this fix: once **SC-280** puts flavor back on
   top, the rider and the variants become adjacent again and this resolves itself. For every
   other treasure the absorption is a strict coherence improvement. Not a finding.
4. **`matchAll` reuse of the global `LABELED_SEGMENT_RE` is safe** — `String.prototype.matchAll`
   clones the regex via the species constructor and never mutates the original's `lastIndex`.
   The code comment asserting this is correct; verified against the spec and empirically (no
   cross-line/cross-call bleed in 306 corpus files).
5. **`extractLabeledLineAndRider`'s new `body.replace(/\n{3,}/g,'\n\n')`** normalizes blank runs
   in treasure's body whenever `m.effect` is present. Reached only on that path, and treasure's
   frozen pair is the one that legitimately moved. No leak elsewhere (freeze proves it).

## Housekeeping

- Nothing under `/home/scott/code/steelCompendium/workspace/` was written except this file.
- No branch code was edited: all four mutations reverted with `git checkout --`, the temporary
  probe test (`test/dom/elements/zzrr-probe.test.ts`) deleted, and `git status --porcelain` in
  `draw-steel-elements/` is **empty** at tip `6fb65b8`.
- The freeze baseline was read, never written. No `rebaseline.txt` produced.
- Linear was never contacted.
- Scratch scripts and logs live in the session scratchpad, not the ledger dir.

# Delta re-review (fix round 3, fresh reviewer)

Scope: commit `ea786ed` ONLY (2 files, +134/−6). Worktree
`/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions/draw-steel-elements`,
branch `sc120-d2-steel-compositions`, tip verified `ea786ed` on top of `6fb65b8`. Context
rebuilt from `decisions.md` (rulings 22–27), this file's fix-round-2 section (Judgment call
2), `sc120-r6-batchB-report.md` FIX ROUND 3, and the `dse-verify` skill. No branch code was
edited (all seven probe mutations reverted; `git status --porcelain` empty at the end).

## VERDICT: **CLEAN — ruling 26 is correctly and completely discharged; the full SC-120 stack is land-ready at `ea786ed`**

0 CRIT / 0 HIGH / 0 MED. **1 LOW (test-strength only, optional) + 2 INFO.** No shipped
behavior defect found in the delta. The r7 HIGH-2 gate/surface mismatch is **not**
reintroduced anywhere — every one of the six gates was checked against the code of the
surface it claims to gate, and against the SDK's `Career` field types.

## Gate-vs-surface verification (the thing this round exists to check)

`layouts.ts:1005-1012` (labels) vs `:960-987` (the surfaces), `Career.d.ts` field types:

| Label | Gate (`:1005-1012`) | Surface that renders it | Verdict |
|---|---|---|---|
| `Skills` | `skillsText` | Skills band `if (skillsText)` `:975` — **same variable**, computed once at `:974` | exact |
| `Perk` | `perkText` | Perk band `if (perkText)` `:982` — **same variable**, `:981` | exact |
| `Languages` | `m.language` | tile `languageCount(m.language)` `:964` | equivalent — `languageCount` (`:121-133`) returns `''` **iff** its input trims to empty, so a truthy non-blank `m.language` always yields a non-dash tile (INFO 1 covers the blank-string corner) |
| `Project Points` | `m.project_points != null` | tile `m.project_points != null ? String(...) : ''` `:965` | **character-identical** predicate; `project_points: 0` renders `"0"` and strips — no truthiness trap |
| `Renown` | `m.renown != null` | tile `m.renown != null ? String(...) : ''` `:966` | **character-identical**; `renown: 0` → `"0"`, strips |
| `Wealth` | `m.wealth` | tile `m.wealth ?? ''` `:967` | safe direction. `wealth?: string` (SDK `Career.d.ts:17`), so the only falsy non-nullish value is `''`, which `statTiles` (`statTiles.ts:60-61`, `tile.value?.trim()` → `DASH`) renders as `—` anyway. A hypothetical numeric `0` would fail truthiness while the tile shows `0` → **duplication, never deletion** (and `statTiles` would throw on a number before that, pre-existing and untouched here) |

All **six** labels of ruling 15's set are covered and correctly paired; the tile face reads
`Project Pts` while the body label is `Project Points` — the strip list correctly matches the
BODY label, not the tile caption. `CAREER_BODY_LABELS` is gone (grep: 0 hits in `src/`,
`test/`); `stripCareerBodyLabels` has exactly one caller (`:1013`); `stripCareerLeadIn`,
`CAREER_LEAD_IN_LINES`, `stripLabeledLines`, `matchLabeledLine`,
`extractLabeledLineAndRider`, `normalizeForDuplicateCheck`, `careerLayout.rows` and every
other family are untouched (confirmed by `git show --stat` + full-file read).

**Monotonicity argument (why this delta cannot create a new deletion anywhere):** for every
model, `labels_new ⊆ labels_old` (the old list was the fixed six; the new one is a gated
subset of the same six). The change can therefore only ever *reduce* stripping — the
deletion direction is closed by construction, and the only possible regression is an
unwanted duplication, which the corpus scan below rules out for all generated content.

## Findings

### LOW-1 — gap-direction regression coverage exists for only 3 of the 6 labels (`layouts.ts:1005-1012`, `test/dom/elements/displaySteelBatchA.test.ts:335-418`)

Not a shipped defect — the code is right. But the new tests pin the *gap* direction (label
present, field absent → line survives) only for `Skills`, `Perk` and `Renown`. Proven by
mutation, not asserted:

- **M4** — reintroduce the exact fixed bug for Wealth (`m.wealth ? ['Wealth'] : []` →
  `'Wealth',`): suite **GREEN** (27/27). The Wealth gate can be regressed silently.
- **M5** — mispair Languages onto the wrong field (`m.language` → `m.wealth`): suite
  **GREEN** (27/27). A gate/field swap between two tile labels is invisible to the suite,
  because the only "populated" test sets all six fields and the only dash-fill test sets none.

Failure scenario: a future refactor (or a merge) drops or mispairs the `Languages`/`Wealth`/
`Project Points` gate and reintroduces ruling 26's data loss for those labels with a fully
green `npx jest`. Prescribed fix (test-only, byte-neutral, ~10 lines): parameterize the
existing dash-fill test over the four tile labels — for each of
`{Languages: 'One language', Renown: '+1', Wealth: '+1', 'Project Points': '21'}`, build a
`Career` whose body carries only that label, assert the tile slot reads `—` **and** the body
band still contains the value. Owner's call whether this is worth a fix round; it changes no
rendered byte and blocks nothing.

## INFO (no action)

1. **Residual truthiness window: a whitespace-only string field.** `m.language = '   '` (or
   `m.wealth = '   '`) is truthy → the label is gated in and the body line is deleted, while
   the tile dash-fills (`languageCount` trims to `''`; `statTiles` does `value?.trim()`).
   Reachability is far below the case ruling 26 fixed: it needs a hand-authored note that
   deliberately quotes a blank (`wealth: " "`) — an unquoted empty YAML value is `null`/`''`
   and lands on the safe side. If the owner ever wants it closed, gate on the *rendered*
   value instead of the field (`languageCount(m.language)`, `m.wealth?.trim()`) — one line
   each, still byte-neutral for `career/example.yaml`. Recording it so it isn't rediscovered
   as a defect; ruling 26 said "model field", and this delta does exactly that.
2. **The repaired "artisan.md shape" test really was passing by accident, and now isn't.**
   Probe M7 (revert the four model fields the fix added to that test, keep the fix): suite
   goes **RED** on exactly that test. The repair is load-bearing, not cosmetic.
3. **Ruling 27's ordering residual is untouched** by this delta (`stripLabeledLines` unchanged) —
   still the accepted design boundary, not re-opened here.

## Independently measured gates

dse-verify order, all FOREGROUND, devbox-wrapped through wrapper script files with the gate
command LAST and output redirected to log files (no `| tail`, no echoed `$?`).
`/proc/loadavg` at start **0.27** (12 cores) — no load-sensitive-timeout risk.
`rm -f main.js styles.css` before every jest invocation.

| # | Gate | Exit | Measured |
|---|---|---|---|
| 1 | `npm run tsc` | 0 | clean, no output |
| 2 | `npm run lint` | 0 | clean (only the pre-existing `.eslintignore` deprecation notice) |
| 3 | `npx jest` | 0 | **Suites 189 passed + 1 skipped / 190; Tests 3389 passed + 1 skipped / 3390**; snapshots 3/3 — matches the fixer's claim exactly (+4 over `6fb65b8`'s 3385) |
| 4 | `npm run shots` | 0 | **474 PNGs on disk, 0 FAIL**; `host-copy pin OK` (verbatim Obsidian 1.13.7, not PARTIAL); `button host-leak OK (111 kinds × 3 states × dark/light = 666 comparisons)`; `print-twin parity OK (118 capture ids)` |
| 5 | freeze (`check-freeze.sh <shots>`) | 1 | **exactly 24 checksum mismatches, 0 missing** — the expected unrebaselined set, no new names, none disappeared |
| 6 | `npm run parity` (LAST) | 0 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** |

`sha256sum -c` against the full shared baseline: **186 OK + 24 FAILED + 0 missing = 210**
(baseline is 210 lines) — identical to the pre-fix accounting; no widening, no narrowing.

**Freeze mismatch set — exactly the expected 24:** `{ancestry, career, class, complication,
complication-edit-btn, condition, culture, perk, perk-narrow, rule, title, treasure} ×
{--steel-print, --steel-realprint}`.

### HARD GATE (ruling 26) — byte-neutrality, independently proven

I hashed all 24 files myself and compared them to the **fix-round-2 fresh reviewer's own
independently measured values at `6fb65b8`** (recorded above in this file, lines 431-443) —
a cross-session comparison that needs no stash/rebuild and does not depend on the fixer's
numbers:

```
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-{print,realprint}
681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d  career--steel-{print,realprint}    ← ruling 26 HARD GATE, HELD
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-{print,realprint}     ← ruling 26 HARD GATE, HELD
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication--steel-{print,realprint}
325df3f94e99d36475717a9fe9c4ace538b2bc4e4d4d13b97f8ae4072083efc6  complication-edit-btn--steel-{print,realprint}
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-{print,realprint}
4dc71e9191544262fa963c8b0744c1ea20b96a3716cf311ac3a8b0dec5fc6ede  culture--steel-{print,realprint}
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-{print,realprint}
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-{print,realprint}
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-{print,realprint}
8c701e289ef91b5ee6a89814d5427bceaf97ef9d1f6190fcff7f502575398fa0  title--steel-{print,realprint}
4d464d4260ce903f1a1141564eef17b75cf62282d1eb502725740c04c495c24f  treasure--steel-{print,realprint}
```

**All 24 byte-identical to `6fb65b8`; twin == realprint in all 12 pairs.** The two lines under
Scott's live Batch A ask are exactly the values ruling 26 named. `kit--steel-{print,realprint}`
and `kit-collapsed--steel-{print,realprint}` verified **`: OK`** by direct `sha256sum -c`
against the shared baseline (both `50fb3245bb4098fee6676e275722264b1561411eb5d0f87aeda7bc3444db3700`).
The baseline file was read, never written; no `rebaseline.txt` produced (correctly — this
round moves nothing).

## What I probed

**Can-fail mutations (7; each applied → target suite run → `git checkout --` → tree re-verified clean).**

| # | Mutation | Result | Reads |
|---|---|---|---|
| M1 | `...(skillsText ? ['Skills'] : [])` → `'Skills',` (reintroduce the bug) | **RED** 1 failed / 27 | fails exactly the ruling-26a Skills test |
| M2 | `...(m.renown != null ? ['Renown'] : [])` → `'Renown',` | **RED** 1 failed / 27 | fails exactly the ruling-26b Renown dash-fill test |
| M3 | `...(perkText ? ['Perk'] : [])` → `'Perk',` | **RED** 1 failed / 27 | fails exactly the ruling-26a Perk test |
| M4 | `...(m.wealth ? ['Wealth'] : [])` → `'Wealth',` | **GREEN** 27/27 | LOW-1 evidence |
| M5 | `m.language` gate → `m.wealth` (mispair) | **GREEN** 27/27 | LOW-1 evidence |
| M6 | delete the `Project Points` entry entirely | **RED** 2 failed / 27 | the sixth label IS covered in the populated direction (artisan test + ruling-26c test) |
| M7 | revert the artisan test's four added model fields (test-file mutation, fix intact) | **RED** 1 failed / 27 | INFO 2 — the "passed by accident" repair is real |

**Real-corpus scan (independent of the fixer's and of r7's).** All **18** generated career
files (`data-unified/en/unified/md-dse/career/*.md`), frontmatter parsed and body scanned for
bold-led label lines among the six: **67 label occurrences** (`Skills` 18, `Perk` 18,
`Languages` 16, `Project Points` 7, `Renown` 6, `Wealth` 2) and **0** occurrences of a label
whose gate is now false. So the delta changes **no generated career's render at all** —
consistent with the byte-identical `career--steel-*` pair, and with the monotonicity argument
above (which additionally proves no OTHER family or hand-authored note can lose content to
this change).

**Read, not assumed:** the whole `careerLayout` (`layouts.ts:897-1024`), `languageCount`
(`:84-133`), `statTiles` (`src/framework/kit/statTiles.ts:47-65`), the SDK's `Career`
declaration (`node_modules/steel-compendium-sdk/dist/model/Career.d.ts`), the full test diff,
and a repo-wide grep for `CAREER_BODY_LABELS` / `stripCareerBodyLabels` callers.

## Housekeeping

- Nothing under `/home/scott/code/steelCompendium/workspace/` was written except this file.
- No branch code edited: all seven mutations reverted with `git checkout --`; no probe file
  was ever created inside the repo (all scripts live in the session scratchpad);
  `git status --porcelain` in `draw-steel-elements/` is **empty** at tip `ea786ed`.
- The freeze baseline was read, never written. Linear was never contacted.
