# SC-120 §D2 Batch A — independent review (round 5)

Reviewer: independent Opus reviewer (authored none of Batch A; also reviewed Batch C in
rounds 3 and 4). Review range `8a47807..e66d2cf` in
`/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions/draw-steel-elements`.
Tree verified clean before and after (`git status --porcelain` empty, HEAD `e66d2cf`);
every probe reverted.

**VERDICT: FIX ROUND NEEDED — small, and needed BEFORE the sanction ask, not because
anything is broken.** All gates are green, every number in the r4 report reproduces, and I
found no correctness defect in the compositions or the shared machinery. But **both MEDIUM
findings change the exact pixels Scott would be sanctioning** (career's frozen body, class's
head rail), so asking for a sanction on the current shots would mean re-asking after the fix.
Fix first, re-shoot, then ask once.

Counts: **0 CRITICAL · 0 HIGH · 2 MEDIUM · 5 LOW · 4 INFO**.

---

## Gates — re-executed by me (foreground, devbox `bash -c`, gate last, per-run log files)

| Gate | My measurement | r4 report | Match |
|---|---|---|---|
| `npm run tsc` / `npm run lint` | both exit 0, no output (only the pre-existing `.eslintignore` notice) | same | ✅ |
| `npx jest` (after `rm -f main.js styles.css`) | **3312 passed + 1 skipped / 3313**, 188 suites + 1 skipped, 3 snapshots, **zero `✕`** (the `sidebarEncounterHandoff` flake did not reproduce) | 3312+1sk/3313 | ✅ |
| `npm run shots` | 0 FAIL, 474 shot lines, `print-twin parity OK (118 capture ids)` | same | ✅ |
| freeze | **exactly 14 mismatches**, 0 missing, `kit--steel-{print,realprint}` `: OK`, `class`/`career` twin==realprint | same 14 | ✅ |
| hashes | `class` `dd9650e6ed254b78…`, `career` `6511efb142ed1a70…` — identical to the r4 report; the other 10 byte-identical to Batch C's fix-round values (ancestry `b25047cd`, condition `63531ab6`, perk `1d0186e1`, perk-narrow `16e516fa`, rule `bcda9977`) | same | ✅ |
| determinism | I ran shots **twice** on the pristine tree (once at gate time, once after reverting my CSS probe) — both produced the same 14 hashes | 2-run identical | ✅ |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | same | ✅ |

`/proc/loadavg` 2.2 at the start of the battery; no timeout-shaped reds, no re-runs needed.

---

## A. The shared machinery (highest risk) — cleared, and cleared *by construction*, not only by measurement

**1. `rightPrimary`/`rightDeck` on `SteelCardComposition` (CardLayout.ts:133-143, wired at
:430-431).** `renderSteel()` now always passes both keys, with `composition.rightPrimary?.(…)`
yielding `undefined` for the five pre-Batch-A compositions. That is safe because
`cardHead()`'s `mountSlot` gates on the **value**, not key presence:
`cardHead.ts:81` — `if (text === undefined) return undefined; // an omitted slot is a GAP`.
So `{rightPrimary: undefined}` and omitting the key are indistinguishable. The kit pair's
byte-identity is the measurement; this is the reason.

**2. `statTiles()` writes `--dse-tiles-n` on every row (statTiles.ts:55).** `statTiles` is the
**only** creator of `.dse-tiles` anywhere in `src/` (verified by grep), and it has exactly five
call sites: kit ×2 (4-up), career ×1 (4-up), class ×2 (3-up). So no hand-built tiles row can
be left implicitly at the CSS default, and kit's rows write `4` — computing identically to the
old hardcoded `repeat(4, 1fr)`. Confirmed by `kit--steel-{print,realprint}` `: OK` in my own
freeze run and by the dedicated DOM test (which I proved can fail — probe P3).

**3. `.dse-tiles` column count (styles-source.css:11896-11908).** `repeat(var(--dse-tiles-n, 4), 1fr)`
in the **unscoped base geometry** — correct placement (the rule it replaces was unscoped, and
the count must apply in print too, which is how class's 3-up strip prints). The fallback `4`
preserves the old value for any consumer that somehow doesn't set the property.

**4. The right-deck caption rule (styles-source.css:5898-5902).** Probed on all three axes the
brief names:
- **Full Steel scope:** `[data-dse-theme='steel']:not([data-dse-print="on"])` — both halves
  present, verbatim.
- **No literal font-size:** `font-size: var(--dse-fs-micro)` (a real token,
  styles-source.css:4527); `--dse-fg-faint` is likewise real (:4321/:4676/:11187). This half is
  *gated*, not just eyeballed: `test/unit/build/fontSizeContract.test.ts` is an allowlist that
  fails any new bare literal, and it passes.
- **No leak into print — proved empirically (probe P1), because the freeze CANNOT prove it this
  batch.** class's print pair is moving anyway for DOM reasons, so a dropped print guard would
  hide inside the expected mismatch. I therefore removed `:not([data-dse-print="on"])` from the
  rule and re-ran `npm run shots`: `class--steel-print.png` moved `dd9650e6…` → `d5b24485…`.
  The guard is doing real work and the rule is genuinely print-excluded today. (Restored; a
  second shots run returned the committed hashes exactly.)
- **No leak into sibling families — by construction.** `.dse-card` is created in exactly two
  places, both inside `DisplayCardView` (`CardLayout.ts:319` `renderBase`, which never calls
  `cardHead`, and `:418` `renderSteel`). So `.dse-card > .dse-head` can only match a Steel
  display card. The other `.dse-head__deck--right` users — statblock's and featureblock's `EV`
  decks — mount under `.dse-sb`/`.dse-fb` and are untouched.

---

## B. `stripCareerBodyLabels()` — probed against the real corpus, no over-stripping

I wrote a transient probe suite driving `careerLayout.steel.bands()` over **real corpus bodies**
read from disk (deleted after the run; see Evidence). Results:

| Probe | Result |
|---|---|
| plugin md-dse fixture (`politician.md`) | 5 label lines gone; "think about the following questions" prose, the `\| d6 \| Inciting Incident` table and every incident row survive |
| site-format corpus (`artisan.md`, relative-path links) | `**[Project Points](…):** 240` stripped — link-text matching works on the site's link shape too |
| `sailor.md` | its bold-led **incident** lines (`**Alone:**`, `**Deserter:**`, `**Marooned:**`…) all survive — the label-set equality test is what saves them |
| **all 18 Browse careers** | no label line survives in any of them; every body still >200 chars and still carries its incident content |
| label appearing MID-paragraph | **not** stripped (design §5.2 mitigation (i) holds) |
| near-miss label (`**Skillset:**`) | not stripped |
| following paragraph after a stripped line | always survives (only one blank line is swallowed) |

**And policy (B) is lossless across the whole corpus** — the thing that would actually hurt a
reader. Every label the strip removes has a populated frontmatter field the composition renders
back: `skills:` 18/18, `perk:` 18/18; the 2 careers with no `language:` key (`disciple`,
`performer`) also have no `**Languages:**` body line; and there is no `**[Project Points]`,
`**[Renown]` or `**[Wealth]`  body line anywhere without its frontmatter twin. Nothing
disappears from a career card.

Two latent edges the probe did find are LOW-1/LOW-2 below.

---

## C. Composition conformance to §3.1 / §3.2

Checked line by line; everything matches, with one clarification in the design's favour.

**class (§3.1):** eyebrow `Class` ✓ · crest `shield` ✓ · `rightPrimary` = `primary_characteristics.join(' · ')`,
`rightDeck` = `'primary characteristics'`, gated as a pair on non-empty ✓ · band order
flavor(dedup) → `Basics` → `Potency` → `Skills` → body ✓ · Basics tiles
`starting_stamina` / `+${stamina_per_level}` / `recoveries` with the site's exact labels ✓
(the `+` prefix is present, `layouts.ts:676`) · Potency tiles run `plainText()` ✓, rendering
`Reason − 2` / `Reason − 1` / `Reason` in the shot — links stripped, case kept · dash-fill left
to the primitive ✓ (SC-100 ruling 2, the deliberate divergence §3.1 names) · body kept whole
(ruling 6) ✓ — the test pins that `### Basics` and the `Tactician Advancement Table` both
survive · no `subtitle`/`badges` read on this branch ✓.

**career (§3.2):** eyebrow `Career` ✓ · crest `briefcase` ✓ · band order flavor(dedup) →
`Career Benefits` → `Skills` → `Perk` → body(B) ✓ · 4 tiles `Languages` / `Project Pts` /
`Renown` / `Wealth`, dash-filled by the primitive ✓ · Skills/Perk band text is the **same
expression the legacy rows used** (`join('; ')` / `join(' · ')`) — verified against
`careerLayout.rows` ✓.

**`languageCount` — the design doc is what's imprecise, not the code (INFO-1).** §3.2 says
"port the first-word extraction". The implementation (`layouts.ts:87-95`) is a suffix-strip. I
checked the real site source: `steel-etl/internal/site/cards.go:1070-1079` `careerLanguageCount`
is *also* a suffix-strip (`" languages"`, then `" language"`, `TrimSpace`, else return the whole
string) — the port is line-for-line faithful, including the suffix order and the non-empty
fallback. Conformance is to the source of truth; no action.

---

## D. Test quality

30 new tests. No vacuous assertions found; three can-fail probes run (all reverted):

- **P2 — the strip test can fail.** Removing `'Project Points'` from `CAREER_BODY_LABELS`
  (`layouts.ts:475`) fails exactly one test, the artisan-shape Project-Points test
  (16 passed / 1 failed).
- **P3 — the `--dse-tiles-n` assertions can fail.** Changing `statTiles` to write
  `tiles.length + 1` fails **four** tests, including the "kit still writes 4" byte-identity
  proof (13 passed / 4 failed).
- **P1 — the caption rule's print exclusion is real** (see §A.4; the freeze cannot show this,
  a shots diff can, and did).
- The pre-existing **"appears exactly once"** duplication tests (`displayFamily.test.ts:512+`)
  were correctly left pointed at the REAL elements, and they are *not* vacuous under the Steel
  branch: `countOccurrences(text, 'Two skills from the interpersonal skill group') === 1` fails
  the moment the Skills line stops being stripped from the body. That is a second, independent
  guard on the strip.
- The steel-less base-branch clones for career/class follow the Batch C convention
  (`{...layout, steel: undefined}`); round 3 already proved that pattern non-vacuous by breaking
  `renderBase()` (24 failures, career/class among them), so I did not re-run that probe.

Two test nits are LOW-4 / LOW-5 below.

---

## E. Visual

Against `kit--steel-dark.png` as the bar and the ledger's site refs.

**career (`career--steel-dark.png`)** — briefcase crest renders a real glyph, `◆ CAREER` /
`POLITICIAN`, a 4-up strip reading `One` / `—` / `+1` / `+1` under `CAREER BENEFITS`, then
`SKILLS` and `PERK` bands, then the body. Cell material is the same translucent-black family as
kit's (`.dse-tiles__cell`'s existing `rgba(0,0,0,.25)`); no light wash. **No double-rendered
content** — the skills/perk sentences appear once each, in their bands. The d6 Inciting Incident
table renders in full further down. One defect: MEDIUM-1.

**class (`class--steel-dark.png`)** — shield crest renders, `◆ CLASS` / `TACTICIAN`, right rail
carries `MIGHT · REASON` over `PRIMARY CHARACTERISTICS`, then `BASICS` 3-up (`21` / `+9` / `10`)
and `POTENCY` 3-up (`Reason − 2` / `Reason − 1` / `Reason`), `SKILLS`, then the whole body. The
3-up strips are the single most visible win of the batch and they land. One defect: MEDIUM-2.

**print** — both families drop crest and Steel decoration exactly as the sanctioned kit print
does; nothing leaked.

---

## Findings

### MEDIUM-1 — career's body is left with an orphaned "You gain the following career benefits:" lead-in

**Where:** `src/elements/display/layouts.ts:473-498` (`CAREER_BODY_LABELS` /
`stripCareerBodyLabels`). Visible in `visual-harness/shots/career--steel-dark.png` and in the
sanction evidence `sc120-after-career--steel-dark.png`.

Policy (B) removes the five/six labeled lines but not the sentence that introduces them. The
body now reads:

```
…think about the following questions:
 - (four questions)

You gain the following career benefits:

| d6 | Inciting Incident |
```

I confirmed this is systematic, not fixture-specific: **18/18 careers carry that exact
lead-in**, and my probe printed the post-strip tail as
`"career benefits:\n\n| d6 | Inciting Incident…"` — a colon promising a list, immediately
followed by an unrelated table, on every career card.

**Failure scenario:** Scott opens the Batch A sanction shot and sees a dangling sentence that
the batch itself created — the kind of "obviously nobody looked" detail that costs a sanction
round. It also reads as a bug to any user of a career card.

**Prescribed fix:** the composition's own `Career Benefits` band head is now the structural
replacement for that sentence, so drop it with the lines it introduces: add a whole-line match
for the normalized text `you gain the following career benefits:` to `stripCareerBodyLabels`
(it is a fixed string in all 18 files), or generalize the helper's line test to "a line whose
normalized text equals one of LABELS **or** LEAD_INS". Costs no extra freeze lines — career's
print pair is already in this batch's rebaseline ask — but it **does** re-measure that pair, so
it must land before the sanction ask, not after.

---

### MEDIUM-2 — class's right rail is two outlined chips where the site (and §4.1 item 2) wants a boxless mini + caption

**Where:** `styles-source.css:5898-5902` (the new caption rule) and the chip surface it doesn't
override (`styles-source.css:5599-5610` Steel `--chip`: `border: 1px solid var(--dse-border)`;
base `:11605-11616`: padding + border + radius).

The design's §4.1 item 2 states the rule's purpose: make the deck "read as a caption rather than
a second chip" (porting `steel-class.css:21-24`). The implemented rule changes `font-size`,
`letter-spacing` and `color` only — so the deck keeps the chip's border/padding and still renders
as a pill, just a smaller one. Side by side with the ledger's own reference
(`sc120-ref-class-page--dark.png`), the site draws `MIGHT · REASON` as a boxless mini-title with
a boxless caption beneath it; the plugin draws two stacked outlined pills. The r4 report's
"design decision 2" states this deliberately ("without touching the chip's
padding/background/border") — that is the part I disagree with: it leaves the shared CSS item
short of its own stated goal.

**Failure scenario:** the head of the ticket's headline family diverges visibly from the site
reference the batch is porting, in exactly the element the batch added new shared CSS for; Scott
compares against the site shot in the evidence round and sends it back.

**Prescribed fix (cheap, precedent 40 lines below in the same file, and ZERO freeze cost because
both rules are screen-only):** add `background: none; border: none; padding: 0;` to the new
caption rule, mirroring the established un-chipping precedent
`[data-dse-theme='steel']:not([data-dse-print="on"]) :is(.dse-sb, .dse-fb) > .dse-head > .dse-head__primary--chip { background: none; border: none; … }`
(`styles-source.css:5939-5951`). If Scott also wants the site's boxless *mini* for
`rightPrimary`, add the sibling rule on
`[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-card > .dse-head > .dse-head__primary--right`
in the same shape. Screen-only, so no frozen print byte moves either way — but the class dark
evidence shot does, so this too belongs before the sanction ask.

---

### LOW-1 — a bold-led paragraph whose bold run equals a label, with no colon, is stripped whole

**Where:** `layouts.ts:476` — `const CAREER_LABEL_LINE_RE = /^\*\*(.+?)\*\*:?/;` (the `:` is
optional).

Probe result: `**Wealth** is a measure of your character's buying power…` is **removed
entirely** (`BOLDLED_SURVIVES: false`). No such line exists in today's 18-career corpus (I
scanned every bold-led body line), so this is latent, not live.

**Failure scenario:** Batch B lifts this helper into the general `stripLabeledLines(md, labels)`
over five more families' labels (`Effect`, `Benefit`, `Drawback`, `Project`, `Prerequisite`…).
Every added label widens the collision surface, and prose that opens with a bolded word — which
is exactly how these books write emphasis — silently loses a paragraph.

**Prescribed fix:** require the colon. Design §5.2's mitigation (ii) already assumes one
("trailing `:` allowed inside or outside the bold run"); make it mandatory rather than optional:
`/^\*\*(.+?):?\*\*:/` (or keep the current capture and reject a match whose line has no `:`
immediately after the bold run).

---

### LOW-2 — an indented label line is stripped because the match runs on the trimmed line

**Where:** `layouts.ts:481` — `const trimmed = line.trim();` then the `^\*\*` test runs against
`trimmed`.

Probe result: `- item\n    **Perk:** One perk.` loses the indented continuation line
(`INDENTED_STRIPPED: true`), which would silently gut a list item. Not present in today's corpus.
Same one-line neighbourhood as LOW-1.

**Prescribed fix:** run the label test against the **raw** line (keep `trim()` only for the
blank-line check), so a stripped label must start at column 0 — which is what "a bold-labeled
line" means in this corpus.

---

### LOW-3 — nothing pins the caption rule's Steel/print scope, and the freeze can't this batch

**Where:** `styles-source.css:5898`; no test references `.dse-head__deck--right` as a *rule*
(the existing hits are DOM assertions in statblock/featureblock tests).

I proved by probe that the guard is currently effective (§A.4), but the only automated thing
standing between a future edit and a print leak is `class--steel-print.png` — and this batch is
moving that file anyway, so the freeze is blind to it right now. It regains its teeth only once
the class hashes are rebaselined at landing.

**Prescribed fix:** a three-line sheet-scan assertion in the established
`chromeRound2.test.ts` style — `expect(CSS).toContain("[data-dse-theme='steel']:not([data-dse-print=\"on\"]) .dse-card > .dse-head .dse-head__deck--right {")`
— which fails the moment either half of the scope is dropped.

---

### LOW-4 — a new test picks the body band with `find(b => b.head === undefined)`

**Where:** `test/dom/elements/displaySteelBatchA.test.ts:266`.

career's **flavor** band is also headless, so `find` returns the flavor band for any model that
has a non-duplicating flavor. The test passes only because its synthetic model has no flavor.

**Failure scenario:** someone adds `flavor` to that fixture to cover something else and the test
silently starts asserting against the wrong band — passing while proving nothing about the
strip.

**Prescribed fix:** take the **last** band (the body band is always last by declaration order),
matching the `lastBodyDiv()` convention this same file already defines at :88-99.

---

### LOW-5 — the same floating-promise shape owner ruling 13 already fixed once

**Where:** `test/dom/elements/displaySteelBatchA.test.ts:267` — `void bodyBand.render(…)`.

Ruling 13 (Batch C) resolved the identical pattern by **awaiting** it; Batch A reintroduces it
with an explicit `void` (which satisfies lint but keeps the hazard: the assertion on the next
line reads the container before a genuinely async `renderMarkdown` would have written).

**Prescribed fix:** make the test `async` and `await` the render, per ruling 13.

---

### INFO-1 — `languageCount` follows the site source, not the design doc's paraphrase

Design §3.2 says "first-word extraction"; the real `careerLanguageCount`
(`steel-etl/internal/site/cards.go:1070-1079`) is a suffix-strip, and the implementation ports it
faithfully. The code is right and the doc's wording is the loose one. Worth a one-line correction
in the design doc so Batch B doesn't "fix" it back.

### INFO-2 — policy (B) is lossless across the entire career corpus

Measured, not assumed: `skills:` 18/18, `perk:` 18/18; the two careers lacking `language:`
(`disciple`, `performer`) carry no `**Languages:**` body line; and no `Project Points`/`Renown`/
`Wealth` body line exists without its frontmatter twin. Every stripped line is rendered back
structurally. This is the strongest single argument for the deviation owner ruling 15 accepted.

### INFO-3 — the `rightPrimary`/`rightDeck` addition is safe by construction

`cardHead.ts:81` gates on `text === undefined`, so passing the keys explicitly as `undefined`
is indistinguishable from omitting them. The kit byte-identity is confirmation, not the argument.

### INFO-4 — the batch's blast radius is provably narrow

`statTiles` is the only `.dse-tiles` creator (5 call sites: kit ×2, career ×1, class ×2);
`.dse-card` is created only by `DisplayCardView` (2 sites). Together these bound both shared
changes to the display-card families, which is why the freeze delta is exactly class+career and
`kit` is `: OK`.

---

## Evidence

Durable: the ledger's `sc120-after-{class,career}--steel-{dark,print}.png`, and the worktree's
regenerated `visual-harness/shots/` (my runs, byte-identical to the r4 report's hashes).

Transient, this session's scratchpad
(`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5e4d5380-4ea7-4e51-8532-5a9ec6f5c860/scratchpad/`):

- `bA-jest1.log`, `bA-shots1.log`, `bA-freeze1.log`, `bA-parity.log` — my gate runs
- `bA-probe-strip.log` — the corpus/over-stripping probe suite (9 tests, all passing; carries
  the `LEADIN_PRESENT` / `BOLDLED_SURVIVES` / `INDENTED_STRIPPED` readouts quoted above)
- `bA-probe-P2.log` — Project-Points label removed → the strip test fails
- `bA-probe-P3.log` — `--dse-tiles-n` value broken → 4 tests fail, incl. the kit-4 proof
- `bA-probe-P1-shots.log` + `class-print-before.png` — print-guard removed → `class--steel-print`
  moves `dd9650e6…` → `d5b24485…`
- `bA-shots-restore.log` — post-revert re-shoot returning the committed hashes
- `bA-src.diff`, `bA-test.diff`, `vA-*.png` — the diffs and crops I read

The probe test file (`test/dom/elements/__probeBatchA.test.ts`) was deleted after its run; all
source probes were reverted with `git checkout --`. Final state: `git status --porcelain` empty,
HEAD `e66d2cf`. Nothing committed, pushed, or left modified.

---

# Delta re-review (fresh reviewer) — 2026-08-29

Reviewer: a **fresh** Opus reviewer (the round-5 reviewer's session expired mid-pipeline; this
is a rebuilt-from-the-ledger scoped re-review, not a second full pass). Scope: the **delta only**
— `git diff e66d2cf..0d10e4e` — against owner rulings 16 (all seven findings) and 17 (the MED-2
`rightPrimary` addendum).

**VERDICT: CLEAN — Batch A is LAND-READY at dse `0d10e4e`.** All seven findings are closed;
ruling 17's addendum is implemented as specified; no scope creep; jest reproduces exactly; both
evidence shots are correct. Zero new findings. Two INFO notes for Batch B are below — neither
asks for a change to this branch.

Branch/HEAD verified: `sc120-d2-steel-compositions` @ `0d10e4eb95e5db8b6afad6e8ba3d4236fa4e94ef`,
tree `git status --porcelain` **empty before and after every probe** (the superproject's
` M draw-steel-elements` pointer line is the pre-existing unlanded-effort state, untouched by me).

## Gate — jest (the only battery gate this brief asked for)

`rm -f main.js styles.css && npx jest`, foreground, output redirected and read:

```
Test Suites: 1 skipped, 188 passed, 188 of 189 total
Tests:       1 skipped, 3318 passed, 3319 total
Snapshots:   3 passed, 3 total
```

**3318 passed + 1 skipped / 3319 — exactly the expected number, zero `✕`.** The
`sidebarEncounterHandoff` flake did not reproduce (`/proc/loadavg` 2.18 at start). `tsc`/`lint`
not re-run — out of this brief's scope, and this delta touches no new type surface.

## Finding-by-finding verification

| Finding | Where it landed | Verified how | Status |
|---|---|---|---|
| **MED-1** lead-in strip | `layouts.ts` `CAREER_LEAD_IN_LINES` + the new whole-line branch in `stripCareerBodyLabels` | corpus probe over **all 18** Browse careers + the dark shot | ✅ CLOSED |
| **MED-2** deck boxless | `styles-source.css:5908` | read the rule; scope-probe; shot | ✅ CLOSED |
| **ruling 17** primary boxless | `styles-source.css:5936` | read the rule; scope-probe; shot | ✅ CLOSED |
| **LOW-1** mandatory colon | `layouts.ts` `CAREER_LABEL_LINE_RE` | corpus probe + control | ✅ CLOSED |
| **LOW-2** raw-line match | `layouts.ts` (`exec(line)`, not `exec(trimmed)`) | corpus probe + control | ✅ CLOSED |
| **LOW-3** scope-pinning tests | `displaySteelBatchA.test.ts:359-411` | **can-fail probe** (below) | ✅ CLOSED |
| **LOW-4** band lookup | `displaySteelBatchA.test.ts` `bands[bands.length - 1]` ×3 | code read + failure-mode analysis | ✅ CLOSED (assessed robust — see below) |
| **LOW-5** floating promise | same file, tests now `async` + `await bodyBand.render(…)` | code read | ✅ CLOSED |

### MED-1 — verified against the real corpus, and it is exact

I drove `careerLayout.steel!.bands()` over the **raw bodies of all 18 real
`v2/docs/Browse/career/*.md` files** (transient probe `test/dom/elements/__probeDeltaA.test.ts`,
deleted after the run). Result for **18/18**:

- source carries the lead-in → output does **not** (`srcLeadIn=true outLeadIn=false`, all 18);
- the `think about the following questions` prose **survives** (all 18);
- `Inciting Incident` **survives** (all 18); every body still >3100 chars;
- no `**Skills:` / `**Languages:` / `**Perk:` / `**[Renown]` / `**[Wealth]` /
  `**[Project Points]` line survives in any of them.

And it strips **only** that. Three controls:

- `politician.md`'s post-strip transition is now
  `"…tear apart the entire system you worked within?\n\n| d6 | Inciting Incident"` — the questions
  list runs straight into the table, no orphan.
- `sailor.md`'s **bold-led incident labels** (`**Water Fear:** A catastrophic storm…`) all
  survive — they are column-0 bold-with-colon lines that the mandatory-colon regex now matches
  *shape*-wise, and only the label-set equality test keeps them. Confirmed present in the output
  tail.
- A **near-miss lead-in** — `You gain the following benefits:` (no "career") — **survives**. The
  match is exact-sentence, not fuzzy.

Visual confirmation in `career--steel-dark.png`: questions bullets → the `d6 / Inciting Incident`
table header, with row 1's own `**Diplomatic Immunity:**` bold label intact. No orphaned sentence.

### MED-2 + ruling 17 — both rules, both boxless, both fully scoped

Read verbatim from the sheet:

```css
/* :5908 */ [data-dse-theme='steel']:not([data-dse-print="on"]) .dse-card > .dse-head .dse-head__deck--right {
	background: none; border: none; padding: 0;
	font-size: var(--dse-fs-micro); letter-spacing: 0.07em; color: var(--dse-fg-faint);
}
/* :5936 */ [data-dse-theme='steel']:not([data-dse-print="on"]) .dse-card > .dse-head .dse-head__primary--right {
	background: none; border: none; padding: 0;
}
```

Both carry the **full** `[data-dse-theme='steel']:not([data-dse-print="on"])` scope; both carry
all three un-chip properties; **no literal font-size anywhere** (the deck's is the
`--dse-fs-micro` role token, the primary rule declares none at all, so
`fontSizeContract.test.ts` stays satisfied). Both are screen-only, which is why class's print
pair does not move.

### LOW-3 — the scope-pinning tests exist for BOTH rules and they have teeth

Can-fail probe (the one probe this review ran): I removed `:not([data-dse-print="on"])` from the
**rightPrimary** rule (`styles-source.css:5936`) and re-ran the suite:

```
Tests:       2 failed, 21 passed, 23 total
```

Both failures are the ruling-17 describe (`the selector carries BOTH halves of the Steel scope`
and `the block un-chips the mini-title`), the second failing inside `ruleBlock()`'s own
`expect(start).toBeGreaterThan(-1)` guard. The gate is real. **Note for future gate runs: the
devbox wrapper echoed `EXIT=0` on this red run** — the brief's warning is correct, the jest
summary lines are the truth, never the echoed exit code.

Probe reverted with `git checkout -- styles-source.css`; `git status --porcelain` empty, line
5936 restored verbatim, HEAD unchanged.

### LOW-4 — `bands[bands.length - 1]` is genuinely robust here (assessed, not assumed)

The brief asked whether this could silently pass if band order changed. **It could not**, and the
reason is structural rather than lucky: career's band order is flavor → `Career Benefits` →
`Skills` → `Perk` → body (`layouts.ts`, body pushed last and only when non-empty), and **all
three** tests that use this lookup carry a *positive* assertion that only the body band can
satisfy — `toContain('Inciting Incident')` + `toContain('Something happens')` in the
Project-Points test, `toContain('is a measure of your character')` in LOW-1's, and
`toContain('One perk described inline under the bullet')` in LOW-2's. If the lookup ever
retargeted (band order changed, or the body band suppressed because a strip emptied it), those
positives go **red**, not quietly green. That is strictly better than the old
`find(b => b.head === undefined)`, which could return the headless *flavor* band and still pass a
purely negative assertion set. Optional one-line hardening for a future touch —
`expect(bodyBand.head).toBeUndefined();` — but **not a finding**, and not worth a commit.

### LOW-5 — closed

All three body-band tests are `async` and `await bodyBand.render(…)`; no `void` render remains in
the file.

## Scope creep — none

`git diff --stat e66d2cf..0d10e4e` = **3 files**: `src/elements/display/layouts.ts`,
`styles-source.css`, `test/dom/elements/displaySteelBatchA.test.ts`. I read the full diff: every
hunk maps to one of the seven findings, ruling 17's rule, their tests, or the comment blocks
documenting them. No Batch B work, no `stripLabeledLines` generalization, no sizing/typography
change to `rightPrimary` (ruling 17 explicitly excluded it), no touch to the other five families.

## Hash claims — not merely sanity-checked, independently REPRODUCED

`visual-harness/shots/` held 21:28 captures; rather than trust the timestamps I re-ran
`npm run shots` myself (foreground, redirected): **0 FAIL, 474 shot lines, `print-twin parity OK
(118 capture ids)`**, and every regenerated PNG came back **byte-identical** to the committed
captures and to the ledger's `sc120-after-*` evidence copies (md5-matched) — so the shots on disk
are both fresh for `0d10e4e` and deterministic across an independent run.

Running `check-freeze.sh` against my own shots (a hash comparison, not a battery re-run):
**exactly 14 mismatches**, and exactly the reported names —
`{ancestry,career,class,condition,perk,perk-narrow,rule}--steel-{print,realprint}`. `kit` does
not appear (it matches baseline `50fb3245…`, confirmed directly) — the shared-machinery
regression proof still holds after **both** fix rounds. Every sha256 the r4 report cites
reproduces on my run:

- `class--steel-{print,realprint}` = `dd9650e6…` — **byte-identical across r4, fix round 1 and
  fix round 2**, and print==realprint. The report's central claim (both MED-2 and ruling 17 are
  screen-only) is true by measurement, not just by reading the selector.
- `career--steel-{print,realprint}` = `6fa077c0…` — moved **exactly once**, at fix round 1 (MED-1
  reaches the print render), and did not move again in fix round 2.
- `class--steel-dark` = `8d5afd18…` — the fix-round-2 value, i.e. the dark shot *did* move, so
  the addendum is real.
- ancestry `b25047cd…`, condition `63531ab6…`, perk `1d0186e1…`, perk-narrow `16e516fa…`, rule
  `bcda9977…` — all unchanged from Batch C.

The report's hash narrative is internally consistent **and externally correct**.

## Visual verdict — both shots PASS

**`class--steel-dark.png`** — the right rail now reads exactly as ruling 17 asked: `MIGHT ·
REASON` as **boxless** letter-spaced small-caps text, directly over a **boxless** smaller
`PRIMARY CHARACTERISTICS` caption. No border, no pill background, no chip padding on either line.
Structurally this is the same two-line boxless mini + caption the ledger's
`sc120-ref-class-page--dark.png` draws; the remaining difference is only *scale* (the site's mini
is a larger serif display size), which ruling 17 explicitly declined to port. The rest of the head
is unchanged and correct: shield crest, `◆ CLASS` / `TACTICIAN`, `BASICS` 3-up (`21` / `+9` /
`10`).

**`career--steel-dark.png`** — no orphaned "You gain the following career benefits:" anywhere. The
head reads `◆ CAREER` / `POLITICIAN` with the briefcase crest, `CAREER BENEFITS` 4-up (`One` /
`—` / `+1` / `+1` — the dash-fill is working), then `SKILLS`, `PERK`, then the body flowing
prose → questions list → `d6 | Inciting Incident` table with no gap sentence.

## INFO (for Batch B, no action on this branch)

- **INFO-A — the lead-in test is trim-insensitive while the label test is column-0-anchored.**
  `CAREER_LEAD_IN_LINES.has(normalizeForDuplicateCheck(line))` normalizes (which trims), so an
  *indented* lead-in would still be stripped — the asymmetry LOW-2 deliberately removed from the
  label path. Harmless today (exact full-sentence match; no indented instance in 18/18) but worth
  making consistent when Batch B lifts this into a general `stripLabeledLines(md, labels)`.
- **INFO-B — the two-alternative regex covers both real link shapes.** `**[Renown](…):**`
  (colon inside the bold, both the Browse relative-path and the md-dse `scc.v1:` forms) matches
  alternative 1; `**[X](scc.v1:y)**:` would match alternative 2. Lazy `.+?` cannot span a `**`
  boundary into a false positive — I checked `**Perk** and **Skills:** x`, which correctly does
  **not** strip, preserving §5.2's mid-paragraph mitigation.

## Evidence (this session's scratchpad, transient)

`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5e4d5380-4ea7-4e51-8532-5a9ec6f5c860/scratchpad/`:
`rr-jest1.log` (the 3318 gate), `rr-probe-low3.log` (the can-fail red), `rr-probe-corpus.log`
(the 18-career readout), `rr-shots.log`, `rr-freeze.log`, and the crops
`rr-class-head.png` / `rr-ref-class-head.png` / `rr-career-top.png` / `rr-career-mid.png` /
`rr-career-table.png`.

The probe file `test/dom/elements/__probeDeltaA.test.ts` was deleted after its run; the sheet
probe was reverted with `git checkout --`. **Final state: `git status --porcelain` empty, HEAD
`0d10e4e`, branch `sc120-d2-steel-compositions`. Nothing committed, pushed, or left modified.**
