# SC-144 — Remove the "legacy" theme: implementation report

**Status:** complete, unlanded, review punch list applied. Branch `sc144-legacy-removal`, worktree
`/home/scott/code/steelCompendium/worktrees/sc144-legacy-removal`.
**Base:** dse main `20a78e2` (post-SC-149 / SC-141). Superproject pointer left unstaged.
**Battery at the landing commit:** all green. No tags, releases, deploys, or landing performed.

## Commits (in order)

| sha | phase | subject |
|---|---|---|
| `9671be4` | 1 | `feat(prefs)!: drop the "legacy" theme option (SC-144, phase 1)` |
| `c2cb4b3` | 2 | `refactor(display): de-branch CardLayout — the layout picks the branch, not the theme (SC-144, phase 2)` |
| `5b9fc25` | 3 | `test(harness): retire the theme axis from both cameras (SC-144, phase 3)` |
| `eeb9ce6` | 6 | `docs: purge the legacy theme from the plugin's prose (SC-144, phase 6)` |
| `73b156d` | review | `fix(harness): make the theme param clamp match its comment (SC-144 review F1-F3, F7)` |

Phases 4, 5 and 7 produced no submodule commits by design: 4 and 5 are workspace-level
artifacts (delivered as files/patches, below) and 7 is verification.

---

## Phase-by-phase

### Phase 0 — baseline capture (no edits)

`npm ci` was required (worktree had no `node_modules`). Real numbers at base `20a78e2`:

```
npm run tsc     → clean, exit 0
npm run lint    → clean, exit 0
npx jest        → Test Suites: 1 skipped, 164 passed, 164 of 165 total
                  Tests:       1 skipped, 2680 passed, 2681 total
                  Snapshots:   3 passed, 3 total
npm run shots   → 334 PNGs, 0 FAIL, exit 0
check-freeze.sh → freeze OK (200/200 legacy+print PNGs byte-identical), exit 0
npm run parity  → 0 gap(s), 0 undeclared warning(s), 16 declared deferral(s), exit 0
```

Proof artifact: `sha256sum visual-harness/shots/*--steel-*.png` → **200 lines**
(67 steel-dark + 67 steel-light + 66 steel-print), kept at
`<scratch>/sc144-steel-before.txt` and re-diffed at every later phase gate.

### Phase 1 — settings migration + pref/type removal (`9671be4`)

- `src/model/Settings.ts` — `settingsVersion` 2 → 3; new
  `if (priorVersion < 3) { delete (s.prefs as Record<string, unknown>).theme; }`; the doc
  comment gains a v2 → v3 paragraph in the existing style, stating the silence is
  deliberate and why (the picker never shipped). **Timing, stated precisely (review F7):**
  `main.ts loadSettings()` calls `migrateSettings` and does **not** save, so the key is
  dropped from the in-memory settings on *every* load and only reaches disk on the next
  unrelated `saveSettings()`. Idempotent, indistinguishable to the user (the pref resolves
  to `steel` from the first load either way), and the same shape as the existing v1 → v2
  branch. It is **not** a one-shot write — earlier drafts of this report said "persisted
  once", which was wrong.
- `src/framework/seams/prefs.ts` — the `theme` descriptor's `ui` block is deleted; `key` +
  `default` stay so `prefs.get('theme')` still resolves. SettingsTab is descriptor-driven,
  so this alone removes the row.
- `src/framework/seams/theme.ts` — `DseThemeId = 'steel' | (string & {})`; header comment
  rewritten, including a standing "how to read older 'Legacy' comments" note.
- Tests: 4 new `migrateSettings` cases (legacy value dropped / caller's object not mutated /
  fresh install untouched / an already-v3 hand-set id preserved); the settings-tab theme-row
  test becomes a **no**-theme-row test; the descriptor's OD-5 options pin becomes a
  "carries NO `ui`" pin; ~30 `'legacy'`-as-an-arbitrary-value sites in
  `seams.test.ts` / `managedModal.test.ts` / `prefs-storage.test.ts` retargeted to
  `'parchment'`; two reset-all cases retargeted onto other prefs; the v1-passthrough
  migration case retargeted onto `sbDensity` (its `theme` key would now be deleted).

Gate: tsc clean · lint clean · jest **2684** passed / 1 skipped / 164 suites (+4).

### Phase 2 — de-branch `CardLayout` (`c2cb4b3`)

`computeBranch()` is now `layout.steel ? 'steel' : 'base'`. Deleted: `renderedBranch`,
`themeChangeRegistered`, the `cx.theme.onChange` registration, and `onThemeChange()`.
Kept: `renderBranch()` + `cardEl` (SC-145's `authoringAnchor()`). `renderLegacy` →
`renderBase`. File header rewritten to keep the history that explains the code's shape.

`displayCardThemeBranch.test.ts` → `displayCardBranch.test.ts`, 8 tests → 4: branch
selection follows the layout not the theme (×2, including an arbitrary snippet id) and
**no theme subscription is ever registered** for either layout kind across mount +
repeated `update()` (×2).

**Drift the plan did not anticipate** (it predates SC-149 and did not enumerate these):
ten tests reached kit's base row-list DOM by pinning `setActive('legacy')`. That branch is
now unreachable for kit. Treatment, per file:

| file | treatment |
|---|---|
| `displayFamily.test.ts` | two base-branch row/feature tests moved onto `baseKitElement`, a steel-less clone of `kitLayout` (keeps the assertions verbatim, keeps them on live code — `renderBase` is the path for the other ten families, and its `features` slot has no other fixture anywhere). The ds-kit by-SCC test and the ten-family table read the title via a new `cardTitleText()` helper that accepts either branch's title node. |
| `displayCardHybrid.test.ts` | claims (a) and (c) — both row-shaped — move onto a steel-less clone; (b), (d), (e) are branch-agnostic and stay on the real `kitElement` with the same title helper. |
| `sccElement.test.ts` | the `theme?: 'legacy'` render param is dropped; the one kit title assertion moves to the Steel head selector. |
| `kitSteel.test.ts` | the legacy-vs-steel byte-identity test was vacuous with one theme; it becomes a direct assertion that a composition-less family (ds-condition) gets none of kit's grammar (no `.dse-head`, `.dse-crest`, `.dse-card__band`, `.dse-tiles__cell`). |

Gate: tsc / lint / jest green (**2680**, −4). Shots regenerated: **334**, and
`diff sc144-steel-before.txt sc144-steel-p2.txt` → **empty**. Freeze at this point
reported exactly 4 mismatches — `kit--legacy-{dark,light}.png`,
`gallery--legacy-{dark,light}.png` — because the kit card now renders its composition in
the harness's legacy combo. All four are in the retired set; **zero Steel lines moved.**

### Phase 3 — harness surgery (`5b9fc25`)

- `shoot.mjs`: `COMBOS` 5 → 3 (the Steel entries only); `--theme` flag and its filter
  removed along with the now-dead `badParts` arm; `--bg` kept. Header rewritten.
- `entry.ts`: `parseParams` defaulted `theme` to `'legacy'` — post-removal that would
  silently shoot the wrong look. It now resolves anything unrecognised to `'steel'`; the
  `theme=` param is still accepted. Three legacy-freeze rationale comments reworded.
- `obsidian-camera.mjs`: `THEMES = ['steel']`; header + usage line updated.
- `visual-harness/README.md`: recounted and reworded, with an explicit "there is no theme
  axis" note explaining why filenames keep the `steel-` prefix.
- `fixtures.test.ts`: 4 × `theme: 'legacy'` → `'steel'`, plus **2 new `parseParams` cases**
  pinning the Steel default (the exact regression the entry.ts change guards).

Gate: tsc / lint / jest green (**2682**). `npm run shots` after `rm -f shots/*.png`:
**exactly 200 PNGs, 0 FAIL, 0 files matching `legacy`**, and the Steel diff against
phase 0 is **empty**. `check-freeze.sh` →
`freeze OK (66/200 producible OK, 134 missing (not producible on this branch), 0 checksum mismatches)`,
exit 0 — the expected between-phases state the plan describes.

### Phase 4 — freeze-baseline retirement (delivered as a file, not applied)

**Not applied.** `.superpowers/sdd/freeze-baseline.sha256` is untouched, as instructed.

New content written to
**`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc144/sc144-freeze-baseline-66.txt`**
— produced by deleting only the lines ending `--legacy-dark.png` / `--legacy-light.png`.

Removals-only proof (run against the live 200-line baseline):

```
wc -l  old = 200   (67 legacy-dark + 67 legacy-light + 66 steel-print)
wc -l  new =  66
diff <(sort old) <(sort new) | grep -c '^>'   →   0      (0 lines added)
diff <(sort old) <(sort new) | grep -c '^<'   →   134    (134 lines removed)
diff <(grep -- '--steel-print.png$' old) new  →   empty  (survivors byte-identical, same order)
```

Verified live against a fresh `npm run shots` on the branch (`check-freeze.sh` with `BASE`
pointed at the new file): **`freeze OK (66/66 legacy+print PNGs byte-identical)`, exit 0.**

Cross-check against the OLD baseline: `sha256sum -c` of just its 66 `steel-print` lines,
run in the branch's shots dir → **0 `: FAILED` lines**. No surviving hash changed.

**Landing steps for the orchestrator:**
1. `cp .superpowers/sdd/freeze-baseline.sha256 .superpowers/sdd/freeze-baseline.sha256.pre-sc144-bak` (keep forever).
2. `cp .superpowers/sdd/sc144/sc144-freeze-baseline-66.txt .superpowers/sdd/freeze-baseline.sha256`.
3. Apply `sc144-check-freeze.patch` (below) so the success message stops saying "legacy+print".
4. Re-run `check-freeze.sh <wt>/draw-steel-elements/visual-harness/shots` → expect `freeze OK (66/66 …)`, exit 0.

### Phase 5 — the verification regime (delivered as a patch, not applied)

**`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc144/sc144-dse-verify-skill.patch`**
— unified diff against the current `.claude/skills/dse-verify/SKILL.md`.
`patch --dry-run -p1 --directory=<workspace>` **applies clean.** It contains four edits:

1. **Freeze semantics rewritten** — the baseline is 66 lines, `*--steel-print.png` only,
   with an explicit what-it-still-catches / what-was-lost / why-Steel-is-not-frozen block
   (decision D3 answered in place, not by reference).
2. **A new fourth baseline-operation category: RETIREMENT** — dated 2026-08-11, quoting
   Scott's SC-144 ruling as the sanction, recording 200 → 66, the 0-changed/0-added/134-removed
   proof, the backup filename, and `freeze OK (66/66)`. Defined against the other three
   (widening / sanctioned rebaseline / capture-artifact correction) and closed with "a
   retirement is removals-only by definition — if a hash changes, stop and diagnose".
3. **"Steel scoping rule" rewritten** — the print exclusion is now the whole freeze rule;
   the always-true `[data-dse-theme='steel']` prefix is documented as deliberately retained,
   with the specificity/cascade reason; plus a "where legacy went" paragraph telling a
   future reader to read older "must not leak into legacy" as "into print".
4. **A new leading "Current expected numbers" block** with the measured before/after table
   and three explanations (why shots halved, why jest went up rather than down, and the
   Steel byte-identity result).

The mismatch bullet's "leaked into the legacy or print scheme" is narrowed to "print".

### Phase 6 — docs, CHANGELOG, prose (`eeb9ce6`)

- **`styles-source.css`** — the theming-contract comment (the sheet's only CSS change) is
  rewritten as a contract for the successor: one unscoped base value layer, Steel overrides
  it, **zero CSS deleted and why**, **the `[data-dse-theme='steel']` prefix stays and why**,
  and the reading rule for the ~200 historical "Legacy" comments elsewhere in the file.
  `seams/theme.ts` carries the same reading rule for the TS side. Chasing all ~200 comments
  individually was deliberately declined as high-churn / low-value; the two pointers cover it.
- **`CHANGELOG.md`** — the unreleased 7.0.0 Steel entry no longer advertises a picker. It now
  states plainly that the 6.0.1 look is replaced with no way back, that the beta picker's
  broken Legacy option was removed rather than fixed, and that a beta vault holding it is
  migrated silently (decision D4). Nine other unreleased entries lose freeze-era
  "Legacy is unchanged" clauses; where the real limit was print/export they now say so.
- **`.repo-docs/architecture.md`** — the seam section is rewritten around the two surviving
  invariants, keeps the history that explains the code's shape, and records that the SC-103
  ◆-divider constraint is lifted **without acting on it**. The `--dse-act-villain` and
  SC-123-defaults paragraphs are restated.
- **`test/dom/kit/tokens.test.ts`** — the "no `[data-dse-theme="legacy"]` scope" invariant is
  widened to "`steel` is the only `[data-dse-theme]` value in the sheet". Stronger than what
  it replaces: it now catches any re-introduction of per-theme value forking under any name.
- **`token-coverage.test.ts` / `theme-steel.test.ts` / `theme-print.test.ts`** — prose and
  identifier retargets (`LEGACY_MAP` → `BASE_MAP`, `legacyBase` → `unscopedBase`, and in
  theme-print the neutral-twin test's local `legacy` → `unthemed` with a title that states
  what it actually proves). No assertion semantics changed.
- **`src/prefs/catalog.ts`** — the six font help strings and two scale help strings drop
  "under both the Steel and Legacy themes"; the SC-123 default-shape rationale is restated
  as history plus an explicitly-open design question. Both asserting tests moved in the same
  commit (`catalog.test.ts:105`, `settings-tab.test.ts:561`).
- **`src/elements/statblock/view.ts`**, **`renderFeature.ts`**, **`fontStacks.ts`**,
  **`docs/stamina-bar.md`**, **`CLAUDE.md`** — the same class of rationale reword.
- **Parity** — `selector-map.json`'s one "Legacy base" `why` string and
  `parity/README.md:445` become "unscoped base". (The plan expected two `why` strings; only
  one actually carried the phrase — the featureblock sibling refers back to it by name.) The
  declared set is unchanged at 16 rows; `parity-report.md` is gitignored and regenerates.

`README.md` needed no change (zero occurrences of "legacy" or "theme"), matching the plan.

### Phase 7 — full battery

Regenerated from an emptied shots dir. Numbers below are the FINAL ones, at `73b156d`
(the review punch list added 4 tests; everything else is unchanged from `eeb9ce6`):

```
npm run tsc     → clean, exit 0
npm run lint    → clean, exit 0
npx jest        → Test Suites: 1 skipped, 164 passed, 164 of 165 total
                  Tests:       1 skipped, 2686 passed, 2687 total
                  Snapshots:   3 passed, 3 total
npm run shots   → 200 PNGs, 0 FAIL, exit 0   (0 files matching "legacy")
check-freeze.sh (against sc144-freeze-baseline-66.txt)
                → freeze OK (66/66 legacy+print PNGs byte-identical), exit 0
                  ("legacy+print" is the script's stale literal — see the patch)
npm run parity  → **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**, exit 0
npm run obsidian-shots → NOT RUN (display :1 is owned by a live Obsidian session; out of scope)
```

`git status --short` in the submodule: clean.

---

## Review punch list (independent review `sc144-review-report.md` → LAND after fixes)

Applied in `73b156d` (code) plus regenerated patch/report artifacts. One line per item:

| # | Sev | Disposition |
|---|---|---|
| **F1** | Medium | **Fixed, the only behavioral change.** `parseParams` read `(q.get('theme') \|\| 'steel')` — any non-empty value passed through, so `?theme=legacy` still stamped a legacy root while the comment claimed it clamped. Replaced with `coerceTheme()` against a `RENDERABLE_THEMES` list (`['steel']`), falling back to `DEFAULT_THEME_ID`. Four new guards cover the *disagreeing* cases the original tests missed: `?theme=legacy` and `?theme=garbage`, at the parse level and again through `mountFromParams` asserting the rendered root's `data-dse-theme`. **Can-fail proven:** restoring the pass-through fails all four (`4 failed, 55 passed`). No shot bytes affected — `shoot.mjs` only ever sends `theme=steel`. |
| **F2** | Low | **Fixed.** The `styles-source.css` reading rule claimed universally that "Legacy" means the unscoped base; wrong for the pre-7.0 `.ds-feature-*` markup/wording sense living in the same file. Now scoped by sense, naming the reviewer's five example sites (~:30, :195, :1382, :1966, :2352) and giving a read-by-context heuristic (a "Legacy" beside a token/`--dse-*`/`data-dse-theme` is the base; a "legacy" beside a `.ds-*` class or a wording note is the old markup). Same qualifier added to `seams/theme.ts`. |
| **F3** | Low | **Fixed.** `tokens.test.ts:43` describe title → "its unscoped base defaults", consistent with the rewritten file header and the steel-only scope invariant the file now owns. |
| **F4** | Low | **Fixed in the regenerated skill patch.** `SKILL.md:~353`'s "plugin 8px (Legacy-base `0.5em` on the host)" → "the unscoped base's `0.5em`", matching the submodule's own rewording of `selector-map.json` / `parity/README.md`, with a note that the finding itself is unchanged. |
| **F5** | Low | **Fixed in the regenerated skill patch.** A sub-bullet on the widening procedure: post-SC-144 a widening is **one** line per new capture id, not three — every historical example reads "3 lines each" and a fresh agent would pattern-match it and hunt two hashes that no longer exist. |
| **F6** | Low | **Fixed in the regenerated check-freeze patch.** A `>>> EVERY LINE COUNT BELOW THIS POINT IS HISTORICAL <<<` marker under the new top note, naming the two already-stale figures (`:15` says 101, `:65` says 149; the file had reached 200) and pointing at the skill + the computed success message as the live sources. |
| **F7** | Low | **Fixed in code and report.** "Persisted once" was imprecise. `loadSettings()` never saves; the key is dropped in memory on every load and hits disk on the next unrelated save. Now stated exactly in the `migrateSettings` doc comment and in the Phase 1 section above. |
| **F8** | Low | **Recorded.** Full jest arithmetic in Concerns 1 below and in the skill patch's expected-numbers block, explicitly framed as "not a miscount". |
| **F9** | Info | **Not mine, not touched.** The shared main checkout's `draw-steel-elements` submodule is dirty (`M demo-vault/Welcome.md`, `?? compendium-manifest.json` — live-Obsidian/manifest residue from an adjacent session). My worktree is clean and I stayed out of the main checkout. `wt-finish` / `deploy*` hard-abort on a dirty tree, so **the orchestrator must clear this before landing.** |
| **F10** | Info | **Folded into the skill patch.** Jest counts are location-sensitive: `token-coverage.test.ts` resolves the workspace D3 token map against a fixed layout list, so running from a scratch checkout silently skips 2 tests and manufactures a phantom −2. Now warned about in the expected-numbers block. |
| review §7 optional | — | **Declined, deliberately.** A unit test asserting `kitLayout` is the only layout with a `steel` slot. It would be a shape guard in TS instead of relying on the byte gate — but it also pins a fact SC-120 is actively about to change (each new family composition would have to edit it), so it would read as a speed bump rather than a guard. The freeze already catches a family silently gaining a composition (all eleven have a `steel-print` line). Noted here so the decision is on the record rather than forgotten. |

---

## Steel-shot invariance proof (the ticket's primary correctness gate)

`sha256sum visual-harness/shots/*--steel-*.png` — 200 lines, all three Steel classes —
captured at phase 0 and re-diffed at every later gate:

| checkpoint | `diff` vs phase 0 | result |
|---|---|---|
| after phase 2 (de-branching) | 0 lines | **identical** |
| after phase 3 (harness surgery) | 0 lines | **identical** |
| at `eeb9ce6`, phase 7 | 0 lines | **identical** |
| at `73b156d`, after the review punch list | 0 lines | **identical** |

All 66 `*--steel-print.png` included, every time. **No Steel shot changed bytes at any
point in this ticket.** Independently corroborated by running `sha256sum -c` against the
old 200-line baseline's 66 `steel-print` lines in the branch's shots dir: **0 `: FAILED`.**

Legacy-class movement, for the record: exactly 4 lines moved during phase 2 —
`kit--legacy-{dark,light}.png` and `gallery--legacy-{dark,light}.png` — because the kit card
stopped consulting the theme and renders its composition in what was the legacy combo. All
four are inside the retired 134.

---

## Deliverable files

| path | what |
|---|---|
| `.superpowers/sdd/sc144/sc144-freeze-baseline-66.txt` | the exact new 66-line baseline; survivors verbatim, removals only |
| `.superpowers/sdd/sc144/sc144-dse-verify-skill.patch` | unified diff for `.claude/skills/dse-verify/SKILL.md`; `patch --dry-run -p1` clean |
| `.superpowers/sdd/sc144/sc144-check-freeze.patch` | unified diff for `.superpowers/sdd/check-freeze.sh` — header retirement note + success message "legacy+print" → "steel-print"; `patch --dry-run -p1` clean |
| `.superpowers/sdd/sc144/sc144-impl-report.md` | this file |

Linear: one comment on SC-144 (`a82262ea`) plus an inline attachment,
"Settings → Appearance after the removal". Issue state and labels untouched.

**Screenshot caveat, stated on the ticket too:** no real-Obsidian capture was possible —
display `:1` is owned by a live session and is out of bounds, and no Xvfb is installed. The
image is the Appearance page's row list read out of the **real** `DseSettingTab`
`getSettingDefinitions()` on the branch and drawn as a before/after panel, labelled on its
face as not a photograph of Obsidian. If you want the genuine article, run
`node visual-harness/settings-evidence.mjs --out=<dir>` when a display is free.

---

## Workspace-file edits to apply at landing (NOT made — main checkout untouched)

### `FOLLOWUPS.md` #49 — archive it

*"Legacy theme has no markdown-table styling at all"* is **moot**: there is no legacy theme.
Move the whole item to `docs/followups-archive/`, keeping its number as a `(was #49)` handle,
with a closing line:

> Closed by SC-144 (2026-08-11): the legacy theme was removed, so the unstyled-table
> surface no longer exists. Steel's own table styling (SC-121) is now the only rendering.
> Print/PDF export still shows the unstyled table — that half of the finding lives on in
> the SC-121 changelog entry, not here.

### `FOLLOWUPS.md` #57 — rewrite as print-only, do NOT fix

The screen arm dies (`styles-source.css:~6367-6422` gives standalone `ds-hr` a real
Steel-scoped treatment). The **print** arm survives: those Steel rules carry
`:not([data-dse-print="on"])`, so in print the diamond still falls back to the invalid
`:root` var chain and paints nothing. Suggested replacement body — keep the number:

> **#57. In PRINT, the ◆ divider paints nothing.** The standalone `ds-hr` diamond resolves
> its fill through a `:root` var chain that is invalid at computed-value time, so it renders
> empty. On screen this is moot — Steel gives standalone `ds-hr` a real treatment
> (`styles-source.css` ~6367-6422) — but those rules carry `:not([data-dse-print="on"])`,
> so print still falls through to the broken chain. Narrowed from a two-arm finding to a
> print-only one by SC-144 (2026-08-11), which removed the legacy theme that owned the other
> arm. Not fixed there: any fix moves `*--steel-print.png` bytes, which is the only frozen
> class left and needs its own sanctioned rebaseline.

### `FOLLOWUPS.md` — new item, take `#64` from `<!-- next-id: 64 -->` then bump to 65

> **#64. Disposition sweep: deferrals whose "it would move the frozen legacy bytes" blocker
> evaporated (SC-144, 2026-08-11).** The freeze went 200 → 66 lines, `*--steel-print.png`
> only, so any deferral justified by legacy-shot byte-identity needs re-reading. Items to
> re-read: **#39** (statblock/featureblock host margin — unaffected, it was always a pixel
> decision for Scott, not a freeze blocker), **#45**, **#46**, **#47**, **#53**, **#54**,
> **#56**. For each, the question is now only "does this move a *print* shot?" — if not, the
> blocker is gone and it is a plain design/priority call. No code was changed by SC-144 for
> any of them. Also in this class, filed separately in the SC-144 plan: the SC-123
> conditional-DOM defaults (`sbCharLine`/`sbCharBox`/`sbVillain`) and the SC-103 ◆-divider
> TS constraint, both of which now *could* change and deliberately did not.

### `ROADMAP.md` lines ~220 / 229 / 235

Replace *"the Legacy theme … LEGACY-FREEZE byte-identity proof (98 legacy+print PNGs)"* with
the current regime: the freeze is **66 `*--steel-print.png` lines** and there is no legacy
theme. Where a roadmap item's evidence bar was "prove the legacy shots didn't move", the bar
is now "prove the print shots didn't move".

Optional (cosmetic, cannot break anything — `token-coverage.test.ts`'s parser reads only the
first backticked `--dse-<name>` column): rename the "Legacy value" column heading in
`docs/superpowers/dse-overhaul/D3-token-map.md` to "Base value".

### Workspace `CHANGELOG.md`, under `## Unreleased`

> - **DSE plugin: the "legacy" theme is gone (SC-144).** The Steel look is now the only look.
>   The Theme row leaves Settings → Appearance, and a beta vault that had chosen Legacy is
>   moved to Steel silently on next load. No released user is affected — the picker only ever
>   existed in unreleased 7.0.0. Print and PDF export are byte-for-byte unchanged, as is
>   every Steel surface: all 200 Steel screenshots are identical before and after. The visual
>   freeze baseline retires from 200 to 66 lines (print only), removals-only, with no hash
>   changed.

### `docs/superpowers/dse-overhaul/**`

Dated history — **left untouched**, per the workspace CLAUDE.md routing rule.

### Blocker to clear first (review F9 — NOT caused by this branch)

The shared main checkout's `draw-steel-elements` submodule is dirty: `M demo-vault/Welcome.md`
(a `ds-initiative` block deleted) and `?? compendium-manifest.json`, both live-Obsidian /
manifest residue from an adjacent session. `just wt-finish` and every `deploy*` recipe
hard-abort on a dirty tree, so revert or commit it before landing. My worktree is clean and
the main checkout was never touched from here.

---

## Concerns / judgement calls for review

1. **Jest went +6, not −7 to −9 — this is not a miscount (review F8).** Full arithmetic, so
   it can never be re-read as one: **−4** (the four theme-switching contracts in
   `displayCardThemeBranch.test.ts`, which tested behaviour that no longer exists);
   **+4** new `migrateSettings` cases; **+6** harness cases pinning the theme-param clamp
   (`parseParams` ×4 plus two rendered-root cases, added by the review's F1); and **0** for
   the tests the plan expected me to DELETE, because they were converted into stronger
   invariants instead of removed. Net 2680 → 2686. The conversions are the part that
   swallows the plan's predicted deletions: the descriptor's "carries the OD-5 options" pin
   (a fixture) became "carries NO `ui`" (the contract), and tokens.test.ts's "no
   `[data-dse-theme="legacy"]` scope" (one banned literal) became "`steel` is the only
   `[data-dse-theme]` value in the sheet" (any second theme scope, under any name). The
   independent review falsified all of them by re-introducing the exact regression each
   catches. Deleting them to hit the predicted figure would trade a real guard for a tidy
   number. Also recorded in the dse-verify skill patch's expected-numbers block.
2. **The steel-less-clone technique** (`baseKitElement`) is the one real design decision I
   made beyond the plan. The alternative was deleting ~10 tests. I kept them because
   `renderBase` is live code for ten families and its `features` slot has no other fixture
   anywhere — but it does mean two files now test the seam through a synthetic layout rather
   than a shipped element. Each is documented at its definition site.
3. **~200 "Legacy" comments remain in `styles-source.css`**, plus a long tail in the element
   views. I rewrote the contract comment to give the reading rule and left the rest as
   historical rationale. Sweeping them all is a large, error-prone diff for no behavioural
   gain; if you want it, it should be its own comment-only commit that a reviewer can skim.
4. **`check-freeze.sh`'s success message** still says "legacy+print PNGs". Patched, not
   applied — the file is workspace scratch and I stayed out of the main checkout.
5. **The `parity-report.md`** regenerated with the reworded `why` string; it is gitignored,
   so nothing was committed for it.
6. **`obsidian-shots` was not run.** The Obsidian-camera theme axis halved (`THEMES` 2 → 1),
   so its output should roughly halve from the last recorded 145. Unverified.
