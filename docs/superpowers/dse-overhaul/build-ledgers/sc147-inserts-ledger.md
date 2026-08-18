# SC-147 / SC-148 / SC-156 (report)

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc147-inserts` (branch `sc147-inserts`)
**Base:** dse main `221acc9`
**Commits**

| sha | what |
|---|---|
| `a428c58` | test(authoring): pin both reported insert-command failures (SC-147, SC-148) |
| `8d64109` | fix(hero): ship a starter example whose ability codes exist (SC-156) |
| `9d20137` | docs: refresh the screenshots the hero example and SC-123 moved (SC-156) |
| `9cdb8e5` | fix(harness): docs mode must refuse to run on the developer's display |

---

## Verdicts

| Ticket | Verdict |
|---|---|
| **SC-148** — reference insert emits `ds-rule`, then error-cards | **Already fixed at main. No code change needed.** Now pinned by 2 tests. |
| **SC-147** — snapshot insert double-wraps a `ds-feature` block inside `ds-rule` | **Already fixed at main. No code change needed.** Now pinned by 2 tests. Snapshot *body quality* is a separate, still-open gap — see below. |
| **SC-156** — hero example ships two invalid ability codes | **Was real. Fixed here**, plus a test that resolves every code the example ships. |

### Root cause, and which landed change killed it

Both reports are the same defect seen twice, on the same entry (`Coat the Blade`, a
`type: ability` file): **no TYPE_ADAPTER claimed `ability`**, so

- the fence came from the old `typeToAlias` fallback → ```ds-rule (SC-148's paste), and
- `entity.model()` returned `undefined`, so `insertFullBlock` fell through to its raw-body
  path — and the raw md-dse body *contains its own* ```ds-feature fence, producing SC-147's
  double-wrapped block.

Two independently landed changes each kill it:

- **SC-141** (04:19, ~2h after the reports) widened `FEATURE_TYPE_RE` to
  `/^(feature|ability|trait)($|\.)/`, restoring both the typed fence and the model.
- **SC-149** (04:38) replaced `typeToAlias` with
  `referenceAliasForType`/`snapshotAliasForType`, deleting the `ds-rule` fallback entirely.

Verified by reverting: with `FEATURE_TYPE_RE` back at its pre-SC-141 scope, all four new
tests fail — and the fence falls back to `ds-scc`, **not** `ds-rule`, confirming SC-149 alone
would also have prevented the exact pasted output.

### What the tests pin (`test/dom/authoring/compendiumInsertScenarios.test.ts`)

End to end over the real corpus bytes (`test/fixtures/md-dse/.../coat-the-blade.md`), driving
the actual `insertReferenceBlock` / `insertFullBlock` with a capturing Editor. They assert the
**user-visible outcome**, not the mechanism, so neither symptom can return by another route:

- reference → exactly 2 fence lines, ```ds-feature, body is the bare code, no `ds-rule`;
- the inserted code resolves to a real typed model (SC-148's *second* half — the error card);
- snapshot → exactly 2 fence lines (the regression produced four), no `ds-rule`;
- snapshot body parses as YAML with `name`/`type`/`feature_type`, contains no `---`, no nested
  fence, no top-level `scc:`.

---

## Snapshot body quality — the honest judgment

**Verdict: structurally fixed, still noisy. One real trap, one cosmetic annoyance.** What
"Insert compendium block (snapshot)" writes for Coat the Blade today:

```yaml
type: feature
feature_type: ability
name: Coat the Blade
flavor: A little poison goes a long way.
keywords: []
usage: "[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)"
distance: Self
target: Self
metadata:
  action_type: "[Maneuver](scc.v1:mcdm.heroes.v1/rule.combat/turn)"
  class: shadow
  distance: Self
  effects: …            # the whole effects list, again
  flavor: A little poison goes a long way.
  keywords: []
  level: "1"
  name: Coat the Blade
  scc: mcdm.heroes.v1/feature.ability.shadow.level-1/coat-the-blade
  subclass: caustic-alchemy
  target: Self
  type: ability
effects:
  - name: Effect
    effect: You gain 2 [surges](scc.v1:mcdm.heroes.v1/rule.resource/surge). …
```

1. **`metadata:` is a near-complete duplicate of the entry — and it is a trap, not just
   bulk.** Roughly half the block is a second copy of fields that already exist at the top
   level (`flavor`, `keywords`, `distance`, `target`, `effects`), plus transport-only keys
   (`scc`, `class`, `subclass`, `level`, `action_type`, `type: ability`). The renderer reads
   the top-level ones, so a user who edits `flavor:` *inside* `metadata:` sees no change and
   has no way to know why. Worse, the embedded `scc:` still points at the official entry the
   copy has deliberately diverged from. This is the homebrew starting point — it should open
   as the thing you edit, not as the thing you edit twice.
   **Recommendation:** drop `metadata` from the snapshot DTO only (keep parsing it, so
   existing blocks are unaffected). It is transport, it is reconstructible, and nobody
   hand-authors it. Small and well-bounded; a ticket of its own, not a drive-by here, since
   it changes shipped output beyond what these two tickets reported.
2. **`scc.v1:` link markup runs through the prose** (`[surges](scc.v1:…)`). Not broken —
   those are real, working links — but for someone editing text it is noise, and a snapshot
   pasted into a vault without the compendium keeps link text pointing nowhere. Lower
   severity; worth deciding deliberately rather than by default.

Neither is a regression and neither is what SC-147 reported, so nothing here was changed. The
tests deliberately do **not** pin `metadata`'s presence — pinning it would freeze the noise as
correct.

---

## SC-156 — the fix, and the freeze delta

`src/elements/hero/example.yaml` shipped `.../brute-strike` and `.../into-the-fray` — literal
ellipses where the type segment belongs — so every inserted `ds-hero` began with two
permanently broken ability rows. Replaced with two real, name-unique Fury level-1 entries:
**`brutal-slam`** (signature) and **`thunder-roar`** (heroic, 5 Ferocity). `heroSparse` in the
visual harness carried the same pair, and its own comment requires it to track `heroDefault`,
so it changed identically.

**Why nothing caught it:** the browser harness has **no `cx.compendium`** (`entry.ts` says so),
so hero ability rows degrade the same way whether the code is real or nonsense — the shots
looked identical either way. `test/dom/elements/heroExampleCodes.test.ts` closes that: it reads
the *shipped* example, extracts every `scc.v1:` code, and resolves each against a real
`CompendiumIndex` over real corpus bytes (both ability fixtures copied verbatim from
data-unified). Can-fail proven by reinstating one placeholder → all 3 fail.

`test/unit/model/hero-serialize.test.ts` asserted the example's literal contents and was
updated to the new codes (its job is parse fidelity, not code validity — that now has its own
test, and the comment says so).

### Freeze: **3 lines, not 9**

`check-freeze.sh` reports exactly `hero--steel-print.png`, `hero-sparse--steel-print.png`,
`hero-narrow--steel-print.png`. SC-156's description predicted 9 using pre-SC-144 arithmetic,
when `legacy-dark`/`legacy-light` were frozen too; only `*--steel-print.png` is frozen now, so
each fixture contributes one line. The six changed `steel-{dark,light}` shots are unfrozen by
design.

The change is **text-only**: same image dimensions before and after, pixel-diff bounding box
`(385,1288)–(967,1441)` in a 1520×1524 image — the two ability row titles. Both rows still read
'run "Sync compendium" to resolve this ability' before *and* after, because the browser harness
has no compendium; only the code text differs.

Ready-to-apply hashes, before/after crops and the full rationale:
`.superpowers/sdd/sc147/sc156-rebaseline.txt`. **The shared baseline was not touched.**

---

## Docs screenshots refreshed

`npm run docs-shots` (40/40, exit 0, on Xvfb): `hero.png` and `sample.png` (the hero card's
ability rows), `settings-statblock.png` (the settings preview picked up **SC-123**'s new
default characteristics/villain shapes, which landed at this base but after that image was
last generated), and `initiative-tracker-stamina-modal.png` — see below.

**Pipeline fix:** the stamina modal focuses an input on open, so the capture caught a
**blinking caret** and the same modal shot differed by a 2×30px bar run to run — the docs image
churned on every regeneration for no reason. The docs camera now blurs the focused element
before a modal capture; two consecutive runs are byte-identical.

---

## Process failure I need to flag

**I ran the Obsidian camera on `:1` — Scott's own display — once**, while capturing the SC-148
evidence screenshot. I invoked `obsidian-camera.mjs --docs` directly instead of going through
`npm run docs-shots`, and `DSE_CAMERA_DISPLAY` defaults to `:1`. A real Obsidian window opened
on his desktop for ~30 seconds and quit cleanly. Nothing outside the scratch `--user-data-dir`
was touched (the camera's own safety checks cover that), but the rule is "virtual display only,
never `:1`", and I broke it.

Fixed so it cannot recur (`9cdb8e5`): **docs mode now hard-aborts on `:1`** and names the fix
in the error. `DSE_DOCS_NO_XVFB=1` still opts in deliberately, so the documented fallback is
intact and only the accident is gone. The evidence shot was then re-captured on Xvfb `:97`.

---

## Battery (verbatim)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` | `Test Suites: 1 skipped, 167 passed, 167 of 168 total` / `Tests: 1 skipped, 2709 passed, 2710 total` / `Snapshots: 3 passed` |
| `npm run shots` | 203, 0 FAIL |
| `check-freeze.sh` | `FREEZE VIOLATED: hero-narrow--steel-print.png, hero--steel-print.png, hero-sparse--steel-print.png` — **exactly the 3 enumerated lines, sanction pending** |
| `npm run parity` | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).` exit 0 |
| `npm run docs-shots` | 40/40, exit 0 (Xvfb) |

Jest delta vs the `221acc9` baseline (2702 + 1 skip / 165 suites): **+7 tests, +2 suites** —
`compendiumInsertScenarios` (4) and `heroExampleCodes` (3). Shots unchanged at 203.

---

## Concerns

1. **Snapshot `metadata:` duplication** (above) — the one substantive UX gap left in the
   homebrew loop. Wants its own ticket.
2. **The 3-line rebaseline is pending Scott's sanction**; until applied, this branch reports
   `FREEZE VIOLATED` on exactly those three, which is the ask showing through, not a leak.
3. **The browser harness has no compendium**, so no shot anywhere proves a hero ability row
   *renders*. The jsdom suite covers it (`heroAbilitiesScc.test.ts`, and now
   `heroExampleCodes.test.ts`), but if anyone wants visual proof of the flagship element's
   ability cards, that needs the Obsidian camera, not the browser one.
4. **SC-147's title says "reference"** but its body is unambiguously the snapshot command's
   output. Treated as the snapshot command throughout; worth a word from Scott if he meant
   otherwise.
