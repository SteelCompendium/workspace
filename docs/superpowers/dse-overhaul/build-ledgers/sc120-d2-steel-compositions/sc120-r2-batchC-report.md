# SC-120 §D2 Batch C — implementation report

Worktree: `/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions/draw-steel-elements`
Branch: `sc120-d2-steel-compositions`. Base: `16e25ff`. Commit: `0061287cfb02316b24fe6be32866953acb72b45a`
(not pushed; superproject pointer not touched).

## Scope implemented

Design doc `sc120-r1-design.md` §3.7 (ancestry), §3.8 (perk), §3.9 (condition), §3.10 (rule),
§8 (kit hybrid-mode empty-band-head guard). Zero new CSS (per §6 Batch C). Base (non-steel)
render branch and every out-of-scope family (class/career/culture/treasure/title/complication)
untouched.

## Files touched

- `src/elements/display/layouts.ts` — kit's §8 guard fix (bands() closure, was
  render()-time early-out); `titleCase()`/`resolvedBodyMd()` helpers; `ancestryLayout.steel`,
  `conditionLayout.steel`, `perkLayout.steel`.
- `src/elements/display/displayFamily.ts` — `genericLayout.steel` (rule composition);
  `genericLayout` exported (was module-private) so the crest-validity test can enumerate it.
- `test/dom/elements/displayFamily.test.ts` — added steel-less clones
  (`baseAncestryLayout`/`baseConditionLayout`/`basePerkLayout`, mirroring the pre-existing
  `baseKitLayout` convention) and repointed the base-branch-DOM assertions (rows/badges/
  `.dse-card__title`) at them, since the real ancestry/condition/perk elements now always
  take the Steel branch (SC-144: `layout.steel` presence is the whole branch rule).
- `test/dom/elements/kitSteel.test.ts` — added the §8 positive DOM test (synthetic hybrid
  fixture whose entire body lives under a stripped "Equipment" heading); the "kit's
  composition never leaks into a sibling family" test swapped its example from
  `conditionElement` (no longer a "no composition" example) to `cultureElement` (still
  base-branch-only in this batch).
- `test/dom/elements/ruleCard.test.ts`, `test/dom/elements/sccElement.test.ts` — updated
  title/badge assertions for `ds-rule`/`ds-condition` to the new cardHead DOM
  (`.dse-head__primary--left`/`.dse-head__eyebrow--left`) — `renderSteel()` never reads
  `layout.badges`, so the base branch's type-pill assertions no longer apply.
- `test/dom/elements/displaySteelBatchC.test.ts` (new) — end-to-end DOM coverage per family
  (cardHead crest/eyebrow, band presence/order, hybrid-mode smoke tests) plus direct
  `bands()`-closure checks (synthetic SDK model instances) proving Signature Trait renders
  above flavor and the Prerequisites gate — real corpus fixtures dedupe flavor against body
  almost everywhere, so the end-to-end tests alone can't show a non-suppressed flavor band.
- `test/unit/kit/crestIconValidity.test.ts` (new) — asserts every `layout.steel.crestIcon`
  across the codebase (kit/ancestry/condition/perk/rule) resolves against the bundled
  `lucide` package's export names (owner ruling 2).

## Gates (devbox-wrapped, dse-verify order)

| Gate | Base (pre-edit) | After | Verdict |
|---|---|---|---|
| `npx jest` | Suites: 183 passed + 1 flaky + 1 skipped / 185; Tests: 3255 passed + 1 flaky + 1 skipped / 3257 | Suites: 186 passed + 1 skipped / 187; Tests: 3279 passed + 1 skipped / 3280 | PASS — +23 new tests (16 + 6 + 1), all green, no regressions |
| `npm run tsc` | — | exit 0, no output | PASS |
| `npm run lint` | — | exit 0, no output | PASS |
| `npm run shots` | — | 0 FAIL (474 shot lines), print-twin parity OK (118 ids), nested-corner-radius OK | PASS |
| freeze check | — | see below | see below |
| determinism (2× shots) | — | all 10 affected hashes byte-identical across both runs | PASS |
| `npm run parity` | exit 0, 0 gap(s), 0 undeclared warning(s), 16 declared deferral(s) | exit 0, 0 gap(s), 0 undeclared warning(s), 16 declared deferral(s) | PASS — identical to base |

**Base jest note:** the one base-run failure
(`sidebarEncounterHandoff.test.ts` › "the encounter block persists the id it minted") is a
pre-existing load-sensitive flake, unrelated to this batch — `/proc/loadavg` was 15.31 at
that run; re-run in isolation immediately after, it passed. Not present in the after-run
(ran clean under lower load). Both jest runs preceded by `rm -f main.js styles.css`
(cssNesting.test.ts footgun).

### Freeze check — deviation from the stated "exactly 8" expectation

```
bash .superpowers/sdd/check-freeze.sh <this-worktree>/draw-steel-elements/visual-harness/shots
```

Result: **10 mismatches**, not 8 — `{ancestry,condition,perk,perk-narrow,rule}--steel-{print,realprint}.png`.
`kit--steel-print.png` / `kit--steel-realprint.png` confirmed **byte-identical** (`: OK`) in
both runs — the §8 guard's regression proof holds.

**Why 10, not 8:** `perk-narrow` (`visual-harness/entry.ts:972`,
`{ id: 'perk-narrow', element: 'perk', fixture: 'default', width: 300 }`) is a SECOND frozen
fixture of the same `ds-perk` element/layout at a 300px viewport (added SC-121 Batch 4, for
a markdown-table-at-narrow-width regression). Since it renders through the same
`perkLayout`, adding `perkLayout.steel` legitimately changes its bytes too — this is not a
leak into a sibling family. Verified: the mismatch set contains **exactly** these 10 names
and no others (`sha256sum -c ... | grep -v ': OK$'` — full list below); the design doc's
"exactly 8" in the worker brief didn't account for `perk-narrow` sharing `perk`'s layout.

Full mismatch list (identical across both shots runs):
```
ancestry--steel-print.png: FAILED
ancestry--steel-realprint.png: FAILED
condition--steel-print.png: FAILED
condition--steel-realprint.png: FAILED
perk--steel-print.png: FAILED
perk--steel-realprint.png: FAILED
perk-narrow--steel-print.png: FAILED
perk-narrow--steel-realprint.png: FAILED
rule--steel-print.png: FAILED
rule--steel-realprint.png: FAILED
```

Within each family, `steel-print.png` and `steel-realprint.png` are byte-identical to each
other (the twin invariant), confirmed in both runs.

## The 10 after-sha256s (informational — no rebaseline.txt written, per instructions)

```
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-print.png
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-realprint.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-print.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-realprint.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-print.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-realprint.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-print.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-realprint.png
a369b4f1a68926fa88bf654deb646008ad9e8dabf31c213fb9c9aad17e03d112  rule--steel-print.png
a369b4f1a68926fa88bf654deb646008ad9e8dabf31c213fb9c9aad17e03d112  rule--steel-realprint.png
```

## Crest icon validity (owner ruling 2)

All four new crest ids resolve in the bundled `lucide` package (verified both by direct
`node -e` probe and by `test/unit/kit/crestIconValidity.test.ts`, which now runs on every
`npx jest`): `users`, `gem`, `zap`, `book-open` — no substitution needed. kit's pre-existing
`backpack` included as a sanity control.

## Deviations from the design doc

1. **Freeze mismatch count (10, not 8)** — see above; `perk-narrow` is the same family/layout
   at a different viewport, not a leak.
2. **Rule eyebrow is 'Rule' in practice, both inline and by-SCC** — the design doc's
   example (`rule.combat` → eyebrow "Combat") assumes the `GenericNote.type` field can carry
   a namespaced value. In the real corpus, the `genericNoteAdapter`'s `noteType` is sourced
   from frontmatter's `type:` key, which is **always the bare `rule`**, never
   `rule.<subtype>` (verified: `grep -rhn '^type:' v2/docs/Browse/rule/*/*.md` — every hit is
   `type: rule`; the `rule.combat` segment lives only in the SCC code's own path, not in the
   `type:` frontmatter field). The implementation still does "last dot-segment of `type`,
   humanized" exactly as specified — forward-compatible if that field is ever namespaced —
   but today it renders 'Rule' in both inline and by-SCC modes (same fallback text). Not a
   bug; documented in the DOM test's own name and inline comments in
   `displayFamily.ts`/`displaySteelBatchC.test.ts`/`ruleCard.test.ts`/`sccElement.test.ts`.
3. **Extra evidence file** — added `sc120-after-perk-narrow--steel-print.png` beyond the
   requested four-family set, to document deviation 1.

## Evidence files (ledger dir)

- `sc120-after-ancestry--steel-dark.png`, `sc120-after-ancestry--steel-print.png`
- `sc120-after-perk--steel-dark.png`, `sc120-after-perk--steel-print.png`
- `sc120-after-condition--steel-dark.png`, `sc120-after-condition--steel-print.png`
- `sc120-after-rule--steel-dark.png`, `sc120-after-rule--steel-print.png`
- `sc120-after-perk-narrow--steel-print.png` (extra — deviation 1's evidence)

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc120-d2-steel-compositions/`.

## Commit (initial round)

`0061287cfb02316b24fe6be32866953acb72b45a` on branch `sc120-d2-steel-compositions`, inside
`draw-steel-elements/` only. Not pushed. Superproject pointer not touched. No co-author/AI
trailers.

---

# FIX ROUND (round-3 independent review response)

Review: `sc120-r3-batchC-review.md` — verdict LAND-READY (0 CRIT / 0 HIGH / 1 MED / 4 LOW /
3 INFO), all gates independently re-measured and matched, probes proved the §8 guard, the
crest-validity test, and the base-branch clone tests all genuinely can fail. Owner
dispositions: decisions.md rulings 10-14. Scope for this round: exactly the four items
rulings 10/11/12/13 mark "fix now" — nothing from Batches A/B, no `SC-272` adapter work, no
LOW-3 tightening (ruling 14 explicitly defers that to Batch B).

**New commit:** `8a4780773de0ac7f4313dc1582754e3acc1b8770` on branch
`sc120-d2-steel-compositions`, on top of `0061287`. Not pushed. No co-author/AI trailers.

## Fix-by-fix

1. **MED-1 / owner ruling 10** — `src/elements/display/displayFamily.ts:137-152`
   (`genericLayout.steel.eyebrow`). On the current data path
   (`GenericNote.type` is always the bare frontmatter `type:` value — round-2's own
   deviation 2, independently reconfirmed by the reviewer against all 153 real rule files),
   the eyebrow could only ever compute `'Rule'`, so inline mode duplicated the card title
   verbatim (`◆ RULE` over `RULE`). Fixed with the prescribed one-line guard: the eyebrow
   closure now suppresses itself (`return undefined`) whenever its computed text
   case-insensitively equals `m.name`; the crest (`book-open`) still renders regardless.
   The real fix (deriving a group from `scc:`) is explicitly out of scope — filed as its own
   Backlog ticket, SC-272 (not filed by this worker; the ticket-owner's job per the
   worker-vs-owner tracker split — noted here only because the ruling names it).
2. **LOW-1 / owner ruling 11** — `src/elements/display/layouts.ts` (perk's Prerequisites
   band, `perkLayout.steel.bands`). Added the same duplicate-vs-body guard
   `renderBase()`'s row check uses: `normalizeForDuplicateCheck(m.prerequisites)` compared
   against the already-computed `normalizedBody`, gated by the newly-exported
   `DUPLICATE_ROW_MIN_LENGTH` (`src/elements/shared/CardLayout.ts`, was a private constant,
   now `export const`). Inert today (`prerequisites` is 0/55 in the corpus — no shots
   change), correct once populated.
3. **LOW-2 / owner ruling 12** — consolidated `layouts.ts`'s `titleCase()` and
   `displayFamily.ts`'s `humanizeType()` (identical bodies, different split charsets: `[\s_-]+`
   vs `[._-]`) into one shared `export function titleCase()` in
   `src/elements/shared/CardLayout.ts`, using the UNION charset `[\s._-]+` — verified
   behavior-preserving for both real call sites (perk_group values never carry a literal
   `.`; `type` segments never carry whitespace). `displayFamily.ts`'s local `humanizeType`
   deleted; both its call sites (the `badges` closure and the rule eyebrow) now call the
   shared `titleCase`.
4. **LOW-4 / owner ruling 13** — `test/dom/elements/displaySteelBatchC.test.ts` (the
   ancestry direct band-order test): made the test `async` and added `await` in front of
   `bands[1].render(...)`, which was previously a floating promise that happened to pass
   only because the fake `renderMarkdown` writes before its first suspension point.

**Also updated (required by fix 1's behavior change, not a fifth fix):**
`test/dom/elements/ruleCard.test.ts`'s inline test now asserts
`head.querySelector('.dse-head__eyebrow--left')` is `null` (was asserting text `'Rule'`) and
its by-SCC test's comment corrected (`titleCase`, not `humanizeType`; explains why THAT case
does NOT suppress — title and eyebrow differ). Added a new direct-closure describe block in
`ruleCard.test.ts` calling `genericLayout.steel!.eyebrow(...)` against synthetic
`GenericNote` models to pin the guard itself: the inline-fallback suppression case, a
case-insensitive variant (`name: 'rule'`, lowercase), and — per this round's brief — a
**hypothetical non-equal case using a synthetic namespaced type**
(`type: 'rule.combat'`, `name: 'Opportunity Attacks'`) proving the guard only suppresses the
verbatim-duplicate case and the "Combat"-style eyebrow the design doc originally intended
still works correctly if `GenericNote.type` is ever namespaced (SC-272's job, not reachable
through real data today).

## Gates (fix round, same devbox-wrapped dse-verify order)

| Gate | Result |
|---|---|
| `npm run tsc` | exit 0, no output — PASS |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` deprecation notice) — PASS |
| `npx jest` (after `rm -f main.js styles.css`) | Suites: 186 passed + 1 skipped / 187; Tests: **3282 passed + 1 skipped / 3283** (+3 new tests: the eyebrow-guard direct-closure describe block); 0 failures — PASS |
| `npm run shots` (run 1) | 0 FAIL, 474 shot lines, print-twin parity OK (118 ids), nested-corner-radius OK — PASS |
| freeze check (run 1) | **exactly 10 mismatches**, same 5 capture ids as round 1 (`{ancestry,condition,perk,perk-narrow,rule}--steel-{print,realprint}`); `kit--steel-{print,realprint}` still `: OK` — PASS (expected violation) |
| `npm run shots` (run 2, determinism) | 0 FAIL, 474 shot lines — PASS |
| freeze check (run 2) | identical 10-name mismatch set — PASS |
| determinism | all 10 hashes byte-identical between the two fix-round shots runs; twin==realprint confirmed for all 5 pairs — PASS |
| `npm run parity` (LAST) | exit 0, **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** — identical to both the base and round-1 numbers — PASS |

Load was moderate-to-high during this round (`/proc/loadavg` 15.98 then 10.52 at the two
`npm run shots` starts — a sibling worktree's own shots run was concurrently active on the
host); no timeout-shaped reds anywhere, no re-runs needed.

## Rule-pair hashes: before/after this fix round

Only the `rule` pair's bytes changed (the eyebrow-suppression fix touches rule's DOM, and
nothing else in this round touches ancestry/condition/perk/perk-narrow's rendered output —
`prerequisites` is 0/55 in the corpus, so fix 2 is inert against every real shots fixture).
Confirmed by direct comparison: `ancestry`/`condition`/`perk`/`perk-narrow`'s hashes below
are byte-identical to the round-1 report's values above; `rule`'s changed.

```
BEFORE (round 1): a369b4f1a68926fa88bf654deb646008ad9e8dabf31c213fb9c9aad17e03d112  rule--steel-print.png
BEFORE (round 1): a369b4f1a68926fa88bf654deb646008ad9e8dabf31c213fb9c9aad17e03d112  rule--steel-realprint.png
AFTER  (fix round): bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-print.png
AFTER  (fix round): bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-realprint.png
```

Full fix-round 10-hash set (identical across both fix-round shots runs):

```
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-print.png
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-realprint.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-print.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-realprint.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-print.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-realprint.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-print.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-realprint.png
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-print.png
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-realprint.png
```

(Informational only, per instructions — no `rebaseline.txt` written; the final one is
generated once from the completed tree at landing, per owner ruling 9.)

## Evidence files updated this round

- `sc120-after-rule--steel-dark.png`, `sc120-after-rule--steel-print.png` — re-copied from
  the fix-round shots (overwrite of the round-1 files; the other 7 evidence files from
  round 1 are unchanged and left as-is, since nothing in this round touched their bytes).

## Out of scope, confirmed untouched

- LOW-3 (crest-validity test's Lucide-alias limitation) — owner ruling 14 defers to Batch B.
- `SC-272` (deriving a real rule group from `scc:` in `genericNoteAdapter`/`typeAdapters.ts`)
  — not touched; `git diff --stat` for this commit shows only the five files listed above.
- INFO-1/INFO-3 (comment wording, `renderBase()` production-dead note) — not addressed;
  no ruling asked for them.

## Commit (fix round)

`8a4780773de0ac7f4313dc1582754e3acc1b8770` on branch `sc120-d2-steel-compositions`, inside
`draw-steel-elements/` only. Not pushed. Superproject pointer not touched. No co-author/AI
trailers. Working tree verified clean after commit.
