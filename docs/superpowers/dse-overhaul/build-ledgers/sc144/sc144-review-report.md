# SC-144 — independent adversarial review

**Reviewer:** independent agent (no code changed, no Linear touched).
**Subject:** branch `sc144-legacy-removal` @ `eeb9ce6`, on dse main `20a78e2`.
**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc144-legacy-removal/draw-steel-elements` (clean at review time).
**Date:** 2026-08-11.

## Recommendation

**LAND.** Every load-bearing claim reproduced, and the primary correctness gate (Steel byte
invariance) was re-derived from scratch rather than trusted. One Medium finding (F1) is a
comment that contradicts its own code in the harness; it is a two-line fix and does not block.
The rest are doc touch-ups to fold into the landing commits.

---

## 1. Battery reproduction at `eeb9ce6`

All commands `devbox run -- bash -c 'cd <abs> && …'`, gate last, unpiped.

| Gate | Claimed | Measured | Verdict |
|---|---|---|---|
| `npm run tsc` | clean | clean, exit 0 | ✅ |
| `npm run lint` | clean | clean, exit 0 | ✅ |
| `npx jest` | 2682 passed / 1 skipped / 164 suites | **2682 passed / 1 skipped / 2683 total / 164 of 165 suites / 3 snapshots**, exit 0 | ✅ |
| `npm run shots` | 200, 0 FAIL, 0 files matching "legacy" | **200 PNGs, exit 0, `ls shots \| grep -ci legacy` = 0** | ✅ |
| `check-freeze.sh` vs `sc144-freeze-baseline-66.txt` | `freeze OK (66/66)`, exit 0 | **`freeze OK (66/66 …)`, exit 0** | ✅ |
| `npm run parity` | 0 / 0 / 16, exit 0 | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`, exit 0** | ✅ |

Shots were regenerated from an emptied `shots/` by me, not reused from the implementer's run.

**Cross-check of the between-phases state:** branch shots against the *current, untouched*
200-line shared baseline → `freeze OK (66/200 producible OK, 134 missing (not producible on
this branch), 0 checksum mismatches)`, exit 0 — exactly the state the plan predicts, and it
independently proves the 66 survivors are unmoved against the *old* file too.

### Methodology note that will bite the next reviewer (F10)

Jest counts are **location-sensitive**. `test/dom/framework/token-coverage.test.ts` resolves
the workspace D3 token map against a fixed list of known layouts (main checkout / worktrees
dir). Run the suite from any other path — e.g. a scratch checkout under `/tmp` — and it
silently skips 2 tests: **3 skipped / 2680 passed / 2683 total** instead of 1 / 2682 / 2683.
I hit this on my base-commit run and confirmed the offset is exactly those 2
(`npx jest token-coverage.test.ts` in the scratch tree → `2 skipped, 7 passed, 9 total`).
With the offset accounted for, base `20a78e2` = **2680 passed / 1 skipped / 2681 total**, so
the reported **+2** delta is correct.

---

## 2. Steel invariance — re-derived independently

I did **not** use the implementer's phase-0 capture. Method:

1. `git worktree add <scratch>/base20a78e2 20a78e2`, `node_modules` symlinked, `npm run shots`
   → **334 PNGs** (200 steel + 134 legacy).
2. Branch worktree, `rm -f shots/*.png`, `npm run shots` → **200 PNGs**, zero matching "legacy".
3. `sha256sum *--steel-*.png | sort -k2` in each, then `diff`.

**Result: the diff is empty.** 200/200 Steel hashes identical — 67 `steel-dark`, 67
`steel-light`, **66 `steel-print`** (counted, not assumed).

**Independent corroboration, stronger than the diff:** my freshly regenerated *base* shots
score `freeze OK (200/200 legacy+print PNGs byte-identical)` against the shared
`freeze-baseline.sha256`. So the base tree reproduces the committed baseline exactly, and the
branch reproduces all 66 survivors exactly. The invariance claim is proven end-to-end against
a third party (the committed baseline), not just branch-vs-branch.

**Verdict: CONFIRMED.** Removing the theme moved zero bytes of the theme that remains.

---

## 3. Claim-by-claim verdicts

| Claim | Verdict | Evidence |
|---|---|---|
| Legacy was the unscoped base CSS; **zero CSS deleted** | ✅ **True** | The whole `styles-source.css` diff is one hunk, `@@ -3357,21 +3357,44 @@`, entirely inside a `/* … */` block. No selector, declaration or rule changed. `data-dse-theme="legacy"` now appears exactly once in the sheet — inside that comment, saying it must never exist. |
| Removal is TS / harness / baseline / docs only | ✅ **True, with one honest behaviour change** | `CardLayout.computeBranch()` no longer consults the theme, so the kit card renders its Steel composition under *any* theme id. That moved exactly 4 shots, all in the retired legacy class (`kit--legacy-{dark,light}`, `gallery--legacy-{dark,light}`). Plan §2 item 5 called this out; it is disclosed, not hidden. |
| Steel rendering byte-invariant | ✅ **Confirmed by my own derivation** | §2 above. |
| Silent settings migration handles stored `'legacy'` | ✅ **True** (wording nit F7) | §4 below. |
| The 6.0.1 look is retired with no opt-out, stated plainly | ✅ **True** | `CHANGELOG.md` unreleased-7.0.0 entry now says "**This replaces the way Draw Steel elements looked in 6.0.1 and earlier, and there is no way back to it**", names the broken beta picker, and states the silent migration. Decision D4 honoured. |
| No user-facing doc still offers a theme choice | ✅ **True** | `docs/` + `README.md` grep: every surviving "legacy" is the *other* legacy (pre-7.0 keys, the retired data repo, migration docs). Zero theme-choice language anywhere. `docs/stamina-bar.md` reworded to print/PDF. |
| Parity unaffected | ✅ **True** | 0/0/16, exit 0; the one `why` string reworded ("Legacy base" → "unscoped base") doesn't change the declared set. |
| Shared baseline untouched, no collateral | ✅ **True** | `freeze-baseline.sha256` still 200 lines (67/67/66), mtime `2026-08-10 23:42` (SC-145 landing). Branch worktree `git status` clean. See F9 for pre-existing dirt in the *main* checkout. |

---

## 4. Settings migration — probed

- **v2 + `theme: 'legacy'` → silently steel.** `migrateSettings` deletes the key on
  `priorVersion < 3`; sparse storage resolves `prefs.get('theme')` to the descriptor default
  `'steel'`. No `Notice`, no `console.error`, no throw anywhere on the path.
- **Fresh install unaffected.** `migrateSettings(undefined)` → `prefs: {}`, no `theme` key
  invented, `settingsVersion: 3`.
- **Unknown/hand-set ids handled sanely.** The delete is unconditional, so any pre-v3 snippet
  id is normalised too. Post-v3 hand-set ids survive (their own test pins this) — the
  migration is one-time, not a policy. A live unknown id stamps `data-dse-theme="<id>"`,
  matches no rule, and renders the unscoped base: no crash, no error.
- **Falsification (mutation test).** I deleted the `if (priorVersion < 3) { … }` branch in a
  disposable worktree and re-ran `prefs-storage.test.ts`:
  **1 failed / 17 passed**, and the failure is exactly
  `v2 → v3: a stored theme: "legacy" is dropped, leaving every other pref intact`.
  The other three new cases correctly stay green — they pin non-regression (caller not
  mutated, fresh install, already-v3 passthrough), not the migration itself. **The migration
  test is a real guard.**
- **F7 (wording).** The impl report says the value is "persisted once". `main.ts:794
  loadSettings()` calls `migrateSettings` but never saves; the key is dropped in memory on
  *every* load and reaches disk on the next unrelated `saveSettings()`. Idempotent, silent,
  identical to the user, and consistent with the existing v1→v2 branch — but the sentence
  should say "normalised on every load, persisted on the next save".

---

## 5. Theme seam integrity

- `ThemeService` survives whole: `createThemeService`, `apply()`, `onChange`, `setActive`, the
  `WeakMap<App, ThemeService>` registry, the popout-safe per-root stamping.
- Every stamping site is untouched: `pipeline.ts:389 cx.theme.apply(root, view)`,
  `managedModal.ts:103 theme.apply(this.dialogEl(), this.lifecycle)`,
  `main.ts:215` construct + register. `theme.ts:95/99` remains the single writer of
  `data-dse-theme`; the descriptor still carries no `attr`, so no double-stamp.
- **`setActive('legacy')` from third-party or stale code:** compiles (the union stays open,
  `'steel' | (string & {})`), stamps `data-dse-theme="legacy"`, persists, matches no CSS →
  the unscoped base. **No crash.** Nothing in `src/` or the harness special-cases the string
  `'legacy'` any more (only comments and the migration's own doc/fixture values). This is
  deliberate and documented in `theme.ts:35-37`: the open union is the snippet-theme door.
- Consequence worth naming once: because `CardLayout` no longer consults the theme, an
  unknown id yields base tokens + the kit card's Steel DOM — a hybrid that exists nowhere
  else. Reachable only by hand-editing `data.json`. Disclosed in the plan (§2 item 5) and in
  `CardLayout.ts`'s header. Accepted.

---

## 6. Baseline retirement and the two patches

### `sc144-freeze-baseline-66.txt` — EXACT

| Check | Result |
|---|---|
| Line counts | old **200** → new **66** |
| Old class breakdown | 67 `legacy-dark` + 67 `legacy-light` + 66 `steel-print` |
| New class breakdown | 66 `steel-print`, nothing else |
| `comm -13` (added) | **0** |
| `comm -23` (removed) | **134** — all `legacy-{dark,light}` |
| `diff <(grep -- '--steel-print.png$' old) new` | **empty** → survivors byte-identical **and in the original order** |
| Live check | `freeze OK (66/66 …)`, exit 0, against shots I regenerated myself |

**Removals-only, verified. 0 hashes changed, 0 added, 134 removed, order preserved.**

### `sc144-check-freeze.patch` — clean, correct

`patch --dry-run -p1` from the workspace root: **applies clean**. Content: a dated RETIRED
header note (200 → 66, removals-only, sanction, backup filename) plus the success-message
literal `legacy+print` → `steel-print`. Both correct.

### `sc144-dse-verify-skill.patch` — clean, accurate, ledger intact

`patch --dry-run -p1`: **applies clean** against the current `.claude/skills/dse-verify/SKILL.md`.
Read in full. Judgment:

- **Freeze semantics rewritten correctly.** Baseline described as 66 lines,
  `*--steel-print.png` only. It also silently corrects a *pre-existing* staleness: the section
  claimed **107** lines while the real baseline was 200.
- **RETIREMENT is a well-formed fourth category.** Defined against widening / sanctioned
  rebaseline / capture-artifact correction, with the distinguishing property stated
  ("the shots are not wrong, they are no longer producible at all"), Scott's ruling quoted as
  the sanction, the 0-changed/0-added/134-removed proof recorded, the backup named, and the
  closing rule "a retirement is removals-only by definition — if a hash changes, stop".
  The old "a fourth case" capture-artifact bullet is correctly demoted to "the
  CAPTURE-ARTIFACT case", so there is no ordinal collision.
- **Historical sanction ledger intact.** Every dated entry survives verbatim — SC-108 (98→101),
  SC-121 Batch 4 (101→107), SC-117 Batch 6 (107→113), plan 25 / SC-102 (113→119), the SC-117 M1
  capture-artifact correction, the SC-100 / SC-121 C-5 / SC-145 rebaseline-and-widening
  sign-offs. No procedure is orphaned; the widening procedure, the mandatory `<shots-dir>`
  argument, and the "sha256sum -c only validates listed names" rule all still resolve.
- **Steel scoping rule** correctly split: `:not([data-dse-print="on"])` is now the whole freeze
  rule; the always-true `[data-dse-theme='steel']` prefix documented as deliberately retained
  with the specificity/cascade reason; plus the "where legacy went" reading rule.
- **Current expected numbers** block placed at the top and labelled CURRENT, with the three
  explanations. Its numbers match my measurements.

Gaps: **F4**, **F5** below.

---

## 7. Design-call judgments (implementer's Concerns 1-2)

### Concern 1 — converted invariants, jest +2 instead of the plan's −7 to −9: **APPROVE. Do not "fix" to the plan's number.**

I falsified all three conversions plus the deleted machinery, in a disposable worktree, by
re-introducing the exact regression each is supposed to catch:

| Mutation | Result |
|---|---|
| Re-add the `ui` block (with the `legacy` option) to the `theme` descriptor | **2 failures**: `carries NO ui — there is no theme picker` (seams) **and** `no theme row anywhere in the tab` (settings-tab) |
| Append `[data-dse-element][data-dse-theme="legacy"] { … }` to `styles-source.css` | **1 failure**: `the base is unscoped — 'steel' is the only [data-dse-theme] value in the sheet` |
| Re-add `this.register(this.cx.theme.onChange(() => {}))` to `DisplayCardView.onMount` | **2 failures**: both `registers NO theme subscription` guards |
| Delete the `priorVersion < 3` migration branch | **1 failure**, precisely the v2→v3 case |

All four mutations reverted; the tree is back at `eeb9ce6` and clean. These conversions are
strictly stronger than what they replaced — the old descriptor test pinned a specific option
list (a fixture), the new one pins the absence of a picker (the contract); the old CSS test
banned one literal string, the new one bans *any* second theme scope under any name. Deleting
them to hit a predicted count would trade a real guard for a tidy number.

### Concern 2 — the steel-less `baseKitLayout` clones: **APPROVE, with one optional hardening.**

- **They exercise LIVE code, not a fork.** `baseKitElement` goes through the real
  `displayFamily()` → `createView: (cx) => new DisplayCardView(cx, d.layout)` → the real
  `renderBase()`. The only synthetic object is the layout literal
  (`{ ...kitLayout, steel: undefined }`). Every assertion runs production view code.
- **The "no other fixture" claim is TRUE and load-bearing.** `grep '^\s*features:'
  src/elements/display/layouts.ts` returns exactly one hit — `kitLayout:147`. So
  `renderBase()`'s features slot (`CardLayout.ts:331-333`, which calls the real
  `renderFeatureList`) has no other fixture anywhere in the repo. Without the clone that path
  loses **all** coverage. Keeping the ten tests was the right call; deleting them would have
  been the quiet regression.
- **Base DOM for the other nine families is still covered — the coverage relocated, it wasn't
  lost.** The ten-family table's `cardTitleText()` helper accepts either branch's title node,
  so that table no longer pins *which* branch the nine take. But: (a) all eleven display
  families have a frozen `*--steel-print.png` line (verified against the 66-line baseline:
  ancestry, career, class, complication, condition, culture, kit, perk, rule, title, treasure
  all present), so a family silently gaining a composition moves a frozen hash and trips the
  gate; and (b) `kitSteel.test.ts` now asserts directly that ds-condition gets the base card
  frame and **none** of kit's grammar (`.dse-head`, `.dse-crest`, `.dse-card__band`,
  `.dse-tiles__cell`). Net: acceptable.
- **Optional hardening (not a blocker):** one cheap unit test asserting `kitLayout` is the only
  layout in `layouts.ts` with a `steel` slot would restore the shape guard in TS instead of
  relying on the byte gate.

### Concern 3 — ~200 "Legacy" comments left in the sheet: **APPROVE the decision, fix the rule (F2).**

Not sweeping them is right: high churn, zero behaviour, and a reviewer can't skim a 200-hunk
comment diff for correctness. The two pointer comments (`styles-source.css` contract block,
`seams/theme.ts`) are the correct substitute. The rule itself is *almost* right — see F2.

### Concerns 4-6: **fine.** The `check-freeze.sh` message is patched-not-applied (correct — the
main checkout is shared state); `parity-report.md` is gitignored and regenerates (confirmed);
`obsidian-shots` unrun is acceptable and its only change (`THEMES = ['steel']`) is coherent
with its consumers — header, usage line, README, and the bad-flag error at
`obsidian-camera.mjs:268` all derive from `THEMES`.

---

## 8. Camera / harness coherence

| Check | Result |
|---|---|
| `shoot.mjs` `COMBOS` | 3 entries — steel-dark, steel-light, steel-print ✅ |
| `--theme` flag + filter + `badParts` arm | removed; `--bg` kept ✅ |
| `obsidian-camera.mjs` `THEMES` | `['steel']` ✅, consumers coherent |
| `entry.ts` default | resolves to `'steel'` when the param is absent/empty ✅ (but see **F1**) |
| Dangling "legacy" in harness code | only `notes-gen.mjs:1` (the unrelated data-shape comment the plan explicitly excluded) and the gitignored `dist/harness.js` bundle ✅ |
| Live `setActive('legacy')` / `theme: 'legacy'` in src or test | none (comments + the migration's own fixture values only) ✅ |
| `data-dse-theme="legacy"` anywhere | one occurrence, inside the contract comment forbidding it ✅ |

---

## 9. Findings

### MEDIUM

**F1 — `entry.ts parseParams` does not do what its comment says, and the new tests don't
catch it.** The code is
`theme: ((q.get('theme') || 'steel') as DseThemeId)`, which passes **any non-empty value**
straight through. The comment above it claims *"anything that isn't a recognised id resolves
to 'steel'"* — false. `?theme=legacy` still yields `'legacy'`, and `entry.ts:707`
`theme.setActive(params.theme)` then stamps `data-dse-theme="legacy"`, rendering base tokens
with the kit card's Steel DOM. The two new `parseParams` tests only cover omitted / empty /
`'steel'`, i.e. exactly the cases where the code and the comment agree. This is the one file
whose stated purpose is preventing "silently shoot the wrong look", so the guard should hold
or the comment should stop claiming it does.
**Prescription (choose one, both ~2 lines):** (a) clamp — resolve to `'steel'` unless the
value is a recognised id — and add a `?theme=legacy → 'steel'` test; or (b) correct the
comment to "an absent/empty param defaults to steel; any other value passes through as an
open-union id" and add a test pinning that pass-through. No shot bytes are affected either way
(`shoot.mjs` only ever sends `theme=steel`).

### LOW

**F2 — the CSS reading rule is stated universally, but "legacy" is overloaded inside the same
file.** The new contract comment says *"what the older comments in this file call 'Legacy' IS
this base."* That is wrong for the *other* legacy, which also lives in `styles-source.css`:
`:30` ("the legacy `.ds-feature-*` block"), `:195` ("legacy `.ds-feature-inline-p` parity"),
`:1382` ("the legacy space-between"), `:1966` / `:2352` ("Legacy 'Immunity: …' / 'Stamina: 30'
wording") — all pre-7.0 markup/wording, not the theme. The plan itself flagged the overload as
the ticket's main footgun. **Prescription:** one clause — *"…except where 'legacy' names the
pre-7.0 `.ds-feature-*` markup or wording (e.g. ~:30, :195, :1382, :1966, :2352), which is an
unrelated sense."*

**F3 — stale describe title.** `test/dom/kit/tokens.test.ts:43` still reads
`describe('Plan 08 Task 1: --dse-* token vocabulary + Legacy defaults (D2 §6)')` while the
file header above it was rewritten to "its base defaults". Cosmetic, but it is the file that
now owns the steel-only scope invariant, so it should read consistently.

**F4 — the skill patch misses one "Legacy" the submodule already fixed.**
`SKILL.md:~353` (parity deferral summary) still says *"plugin 8px (Legacy-base `0.5em` on the
host)"*, while `parity/selector-map.json` and `parity/README.md:445` were reworded to
"unscoped base" in the same ticket. Add it to the patch for consistency.

**F5 — the skill doesn't restate the widening arithmetic for the new regime.** Every historical
widening entry reads "3 lines each (legacy-dark, legacy-light, steel-print)". Post-retirement a
widening is **one** line per new capture id. Inferable from the new "only print is frozen"
block, but a fresh agent will pattern-match the examples. Add a sentence to the widening bullet.

**F6 — `check-freeze.sh` keeps stale count prose below the new note.** `:15` still says
*"Baseline: 101 hashes (`*--legacy-{dark,light}.png` + `*--steel-print.png`)"* and `:65` says
*"Widened to 149"* — both already wrong before SC-144 (the real count was 200). The patch's new
top note supersedes them; a one-line "the counts below are historical" marker would stop the
next reader from trusting them.

**F7 — "persisted once" is imprecise.** See §4. The key is normalised in memory on every load
and hits disk on the next unrelated save. Reword in the impl report / Linear evidence.

**F8 — record why jest went +2, not −7.** Already itemised in the skill patch; flagged here so
it is never later read as a miscount. Verified deliberate and better (§7).

### INFO — not SC-144's doing, but it blocks the landing mechanics

**F9 — the shared main checkout's `draw-steel-elements` submodule is dirty.**
`M demo-vault/Welcome.md` (a `ds-initiative` block deleted) and `?? compendium-manifest.json`,
both mtime `2026-08-11 00:38` — live-Obsidian / manifest residue from an adjacent session, not
from this branch (the SC-144 worktree is clean and the implementer stayed out of the main
checkout). `just deploy*` / `wt-finish` hard-abort on a dirty tree, so this must be reverted or
committed before landing.

**F10 — jest counts are location-sensitive.** See §1. Worth one line in the skill's expected-
numbers section so the next person re-deriving a before/after from a scratch checkout doesn't
"discover" a −2 regression.

---

## 10. Landing punch list

Mechanically unchanged from the impl report; prerequisites re-verified by me:

1. `cp freeze-baseline.sha256 freeze-baseline.sha256.pre-sc144-bak` (both patches name this
   file — keep the name).
2. `cp sc144/sc144-freeze-baseline-66.txt freeze-baseline.sha256`.
3. Apply `sc144-check-freeze.patch` and `sc144-dse-verify-skill.patch` (both dry-run clean),
   folding in F4/F5/F6.
4. Re-run `check-freeze.sh <wt>/…/visual-harness/shots` → expect `freeze OK (66/66 …)`, exit 0.
5. Workspace docs — prerequisites confirmed live: `FOLLOWUPS.md` `<!-- next-id: 64 -->` is
   still 64, `## 49.` and `## 57.` both exist, `ROADMAP.md` lines ~220/229 still carry the
   stale LEGACY-FREEZE text (I found 2 of the plan's 3 line refs, not 235), and workspace
   `CHANGELOG.md` has a live `## Unreleased`. The proposed workspace CHANGELOG bullet's factual
   claim — *"all 200 Steel screenshots are identical before and after"* — is accurate; I
   derived it independently.
6. Clear F9 before running `wt-finish` / any `deploy*`.

## 11. Review hygiene

Two scratch git worktrees (`base20a78e2`, `mut`) were created for the invariance derivation and
the mutation tests; both were removed and `git worktree prune` run. All mutations were reverted
via `git checkout` before removal. The branch worktree is clean at `eeb9ce6`; the workspace
shows only the pre-existing `m draw-steel-elements` of F9; `freeze-baseline.sha256` is
byte-untouched (200 lines, `b265ab25…`, mtime 2026-08-10 23:42).
