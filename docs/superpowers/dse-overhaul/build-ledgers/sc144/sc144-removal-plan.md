# SC-144 — Remove the "legacy" theme: removal plan

**Status:** plan only (read-only analysis, no code changed).
**Analysed against:** `draw-steel-elements` @ `origin/main` = `23ed677` (2026-08-11).
**Implementation base:** NOT this commit. A parallel branch (`sc149-ds-scc`) lands imminently;
**start the worktree from post-SC-149 `origin/main`** and re-derive every count in §1 before
touching anything (the dse-verify skill's standing rule: confirm actual counts against the
commit you gate, never against a plan's prediction).

Scott's ruling (SC-144): *"The 'legacy' theme option is completely broken. I dont particularly
feel like fixing it. Instead lets just drop support for it."* That ruling is also the **sanction**
for the freeze-baseline surgery in Phase 5 — see §3.5.

---

## 0. The definitive mechanics answer (read this first — it sizes the whole ticket)

> **Is "legacy" the absence-of-Steel base CSS, or its own separately-scoped rule set?**
>
> **It is the absence of Steel. There is not one line of legacy-scoped CSS in the plugin.**

Proof, all from `styles-source.css` (9 394 lines):

| Probe | Result |
|---|---|
| `grep -c '\[data-dse-theme="legacy"\]'` | **0** |
| `grep -c ':not(\[data-dse-theme'` (an "everything but steel" scope) | **0** |
| `grep -o "data-dse-theme=[^]]*\]" \| sort \| uniq -c` | **399** `data-dse-theme='steel']` + **11** `data-dse-theme="steel"]` = **410 occurrences**, across **~297 rule blocks**. No other value appears. |
| The sheet's own contract comment, `styles-source.css:3331-3337` | *"Legacy = TODAY'S look, authored as the unscoped `:root` BASE so every element root inherits these by default. Steel is an OVERRIDE layer… **Do NOT add a `data-dse-theme="legacy"` scope: Legacy IS the base.**"* |
| The contract is unit-tested | `test/dom/kit/tokens.test.ts:64` — `test('Legacy is the BASE — no [data-dse-theme="legacy"] scope exists')`, asserting `expect(sheet).not.toMatch(/\[data-dse-theme="legacy"\]/)` |

### The three consequences that define this ticket

1. **Removal deletes ZERO CSS.** Every unscoped base rule is inherited by Steel roots (Steel is
   an override layer on top of it, not a replacement for it). Deleting "legacy CSS" would mean
   deleting the base, which would break Steel. **The CSS diff of this ticket is comments only.**
2. **Rescoping is possible but must not be done here.** With one theme, the
   `[data-dse-theme='steel']` prefix on ~297 rule blocks is always-true and could be stripped.
   **Do not.** Stripping it lowers specificity by one attribute selector at every site, which
   silently reorders the cascade against the unscoped base — it would put all 200 remaining
   frozen bytes and every Steel shot back in play for a pure-readability gain, and it closes the
   D3 §6 snippet-theme door. Recommendation: keep the prefix, replace the header comment that
   explains it. Filed as a decline-by-default follow-up (§6, F2).
3. **`steel-print` bytes must not move.** Print (`data-dse-print="on"` / `@media print`) is an
   *orthogonal* axis, not a legacy derivative: a neutral value block that applies under any
   theme, plus a `[data-dse-theme='steel']`-scoped arm for the role/act spines
   (`test/dom/framework/theme-print.test.ts:16-19` documents exactly this). The frozen
   `*--steel-print.png` shots are captured at `{theme:'steel', bg:'dark', print:true}` — a combo
   this ticket does not touch. **All 66 of them must come back byte-identical. That byte-identity
   IS the ticket's primary correctness gate.**

---

## 1. Inventory

### 1.1 Theme registry / seam — `src/framework/seams/theme.ts`

| Fact | Location |
|---|---|
| Value space | `theme.ts:22` — `export type DseThemeId = 'steel' \| 'legacy' \| (string & {});` (open union, D3 §2.3, "open for snippet ids") |
| Default | `theme.ts:48` — `export const DEFAULT_THEME_ID: DseThemeId = 'steel';` |
| Stamping | `theme.ts:79-87` `apply(rootEl, owner)` — `rootEl.dataset.dseTheme = this.active`, then an `onChange` re-stamp registered on the owner. **Single writer** of `data-dse-theme` (the `theme` PrefDescriptor deliberately carries no `attr`). Per-root, never `document.body` (popout safety, D3 §2.5). |
| Backing store | the persisted `theme` pref; one long-lived `prefs.subscribe('theme', …)` fans out (`theme.ts:68-72`) |
| Call sites | `src/framework/pipeline.ts:384` (`cx.theme.apply(root, view)` — every element root); `src/framework/kit/managedModal.ts` via the `WeakMap<App, ThemeService>` registry (`theme.ts:132-145`, SC-104/FOLLOWUPS #31); `main.ts:215/220` construct + register |
| Element ids in `main.ts` | 32 elements, all stamped through the pipeline |

**There is no `dse-cycle-theme` command** — `test/dom/views/settings-tab.test.ts:258` asserts its
absence. The picker is the only user-facing write path.

### 1.2 CSS — see §0. Summary line:

- legacy-scoped rules: **0**
- Steel-scoped selector occurrences: **410** (~297 rule blocks)
- print-scoped occurrences: **366** `[data-dse-print="on"]` + **342** `:not([data-dse-print="on"])`; **304** of the 366 also carry the Steel scope, **56** are theme-neutral
- everything else: unscoped base, **inherited by Steel**, **must stay**

### 1.3 Settings / preference

- **Descriptor:** `src/framework/seams/prefs.ts:103-122` — the `theme` entry in `BUILTIN_DESCRIPTORS`
  (not in `src/prefs/catalog.ts`; `catalog.ts:16-17` notes the deliberate split). Options at
  `prefs.ts:116-117`: `{ value: 'legacy', label: 'Match Obsidian (Legacy)' }`, `{ value: 'steel', label: 'Steel' }`.
  Group `'Appearance'`, `control: 'select'`.
- **Rendering:** `src/views/SettingsTab.ts` is descriptor-driven — deleting the `ui` block deletes
  the row with no SettingsTab change. `Appearance` survives: it also holds `reduceMotion`
  (`catalog.ts:155`), `printPreview` (`:162`) and `initiativePortraits` (`:169`).
- **Storage:** sparse — `DSESettings.prefs: Partial<DsePrefs>` (`src/model/Settings.ts:19-21`). A key
  is written only when it differs from the default, so `theme` is on disk **only** for someone
  who actively chose Legacy.
- **Per-block reach: none.** `src/framework/prefOverrides.ts:61-67` rejects every attr-less
  descriptor, and `theme` is attr-less by contract. A `prefs: { theme: … }` in YAML already warns
  and is ignored. **No YAML surface to clean up.**
- **Migration seam:** `src/model/Settings.ts:54-70` `migrateSettings(raw)`, currently
  `settingsVersion: 2` with one `if (priorVersion < 2)` branch. Adding a v3 branch is the
  established pattern and is a 2-line change.
- **Blast-radius mitigator — the picker has NEVER SHIPPED.** Latest git tag is **`6.0.1`**;
  `versions.json` lists `7.0.0` and the CHANGELOG heads it `## 7.0.0 (unreleased…)`. The theme
  picker is D3 work, entirely inside unreleased 7.0.0 (CHANGELOG:340-343 is the *unreleased* entry
  announcing it). **No released user can hold `theme: 'legacy'`** — only BRAT/beta vaults and
  Scott's own. (Scott's `data.json` on this checkout holds no `theme` key at all.)

### 1.4 Conditional DOM keyed on theme

**Exactly one site**, and it is not what the ticket brief assumed:

- `src/elements/shared/CardLayout.ts:314-315`
  `private computeBranch(): 'legacy' | 'steel' { return this.cx.theme.active === 'steel' && !!this.layout.steel ? 'steel' : 'legacy'; }`
  plus the machinery around it: `renderedBranch` (`:218`), `themeChangeRegistered` (`:236`), the
  `cx.theme.onChange` subscription (`:271`), `onThemeChange` (`:294`), `renderBranch` (`:306`),
  `renderLegacy` (`:~330`) / `renderSteel` (`:414`). Documented as the sanctioned pattern in
  `.repo-docs/architecture.md:158-196` ("the four invariants").
- **Only one layout has ever opted in:** `kitLayout.steel`, `src/elements/display/layouts.ts:160`.
  For the other 10 display families `renderLegacy` is simply *the* render path.

**SC-123's charline/villain conditional DOM is NOT theme-keyed** — verify this before planning any
"dead branch" work. `src/elements/statblock/view.ts:325` branches on
`prefs.get('sbCharLine') !== 'one' || prefs.get('sbCharBox') !== 'off'`, and `:355` on
`prefs.get('sbVillain') !== 'banded'`. These are *preference* branches, live under Steel, reachable
by any user. What legacy removal kills is not the branch but its **rationale**: the default
(merged text node / inline villains) was chosen specifically to hold
`statblock--legacy-*.png` / `statblock-villain-corpus--legacy-*.png` byte-identical
(`view.ts:268-295`, `:331-346`). With those shots retired, "which shape should be the default?"
becomes an open design question — **out of scope here, flagged as decision point D5 / follow-up F1.**

### 1.5 Harness & fixtures

| Surface | Today | After |
|---|---|---|
| `visual-harness/shoot.mjs:27-33` `COMBOS` | 5: `legacy-dark`, `legacy-light`, `steel-dark`, `steel-light`, `steel-print` | 3 |
| `shoot.mjs:6` / `:115` `--theme=<legacy\|steel>` flag | live filter | remove (single-valued) |
| `visual-harness/entry.ts:443` | `theme: (q.get('theme') === 'steel' ? 'steel' : 'legacy')` — **the harness's default is legacy** | always `'steel'` |
| Gallery (`shoot.mjs:200-203`) | 4 (non-print combos) | 2 |
| **Total browser shots** | **334** = 66 capture ids × 5 + 4 gallery | **200** = 66 × 3 + 2 |
| `visual-harness/obsidian-camera.mjs:78` `THEMES = ['legacy','steel']` | 2-way axis; README:99 says "44 PNGs: 11 elements × legacy/steel × dark/light"; last recorded run 145 PNGs | `['steel']` — axis halves |
| `visual-harness/README.md:10, 99, 109` | prose naming the legacy axis | rewrite |
| `visual-harness/aliases.json` | **element** aliases only — **no theme content, no change** | — |
| `test/dom/visual-harness/fixtures.test.ts:68,82,96,108` | 4 sites pass `theme: 'legacy'` | `'steel'` |
| `entry.ts:75, 272, 335` | comments justifying fixture choices by "would move the frozen `*--legacy-*` shots" | rewrite |
| `visual-harness/notes-gen.mjs:109` | word "legacy" in an unrelated data-shape comment | no change |

The **334 → 200** arithmetic is validated against history: at plan-25 landing the skill records
199 shots with a 119-line baseline (39 non-gallery ids → 39×5+4 = 199 ✓). Today's 200-line
baseline is 67/67/66, i.e. 66 non-gallery ids + gallery in the two legacy classes → 66×5+4 = **334**.

### 1.6 Freeze baseline — `.superpowers/sdd/freeze-baseline.sha256`

| Class | Lines | Fate |
|---|---|---|
| `*--legacy-dark.png` | **67** | **retire** |
| `*--legacy-light.png` | **67** | **retire** |
| `*--steel-print.png` | **66** | **keep, byte-for-byte unchanged** |
| **Total** | **200** | **→ 66** |

**134 of 200 lines (67%) are legacy-class.** The retirement is *removals-only*: not one surviving
hash may change. See §3.5 for the regime argument and the sanction record.

### 1.7 Parity gate

**Unaffected.** `visual-harness/parity/plugin-capture.mjs:33` already captures at
`&theme=steel`; nothing in `compare.cjs` / `diff.mjs` / `selector-map.json` reads a theme id.
The 8 `declaredDeferrals` (16 rows: FOLLOWUPS #39 ×4 entries, #51 ×3, #40 ×1) contain **zero
legacy-related deferrals** — but two carry the phrase "Legacy base" in their `why` prose
(`selector-map.json:29` and the sibling `featureblock-wrap`/`statblock-wrap` entries, plus
`parity/README.md:445`). The *finding* is still true (the plugin host's `0.5em` block margin is an
unscoped base rule that survives); only the word changes. **Expected result after this ticket:
0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0, unchanged.** Editing a `why` string does not
change the declared set, so `compare.test.ts`'s "exactly 8 entries" guard is untouched.

### 1.8 Tests

163 test files, ~2 320 `test(`/`it(` call sites statically (last recorded live jest run on a
landed branch: 2 289/155 at plan-25; the number has grown since — **record the real one at
Phase 0**).

| File | Tests | Legacy hits | Classification |
|---|---|---|---|
| `test/dom/elements/displayCardThemeBranch.test.ts` | 8 | 40 | **DELETE ~6, KEEP ~2** (rename file → `displayCardBranch.test.ts`). Contracts (a)/(b)/(c) and both re-render-lifecycle guards are about theme switching, which ceases to exist. Survivor: "a layout with `steel` renders the composition, one without renders the base DOM" + "no theme subscription is ever registered". |
| `test/dom/framework/seams.test.ts` | 35 (14 in the ThemeService block) | 32 | **RETARGET, net 0.** `'legacy'` is used purely as "a second theme value". Swap for a snippet id (`'parchment'` — already the idiom at `displayCardThemeBranch.test.ts:171`). Also `:305-318` pins the picker's OD-5 options → **delete that one test**. |
| `test/dom/kit/managedModal.test.ts` | 24 | 3 | **RETARGET, net 0** (`setActive('legacy')` ×2 → `'parchment'`). |
| `test/dom/framework/prefs-storage.test.ts` | 14 | 16 | **RETARGET, net 0** — `'legacy'` is an arbitrary pref value in ~10 places. |
| `test/dom/views/settings-tab.test.ts` | 48 | 7 | **DELETE 1-2, RETARGET 3.** `:129` theme-row test → delete. `:231` "Reset all preferences (incl. theme)" → retarget to another pref. `:923` `setControlValue('theme','legacy')` → delete/retarget. `:562` `'Steel and Legacy'` help assertion → update string. `:757` `not.toContain('Theme')` stays true trivially. |
| `test/dom/kit/tokens.test.ts` | 9 | 12 | **RETARGET, net 0.** Rename `:64` to "no per-theme scope other than `steel` exists" and widen the regex to any non-steel value — the invariant is *more* valuable after this ticket, not less. |
| `test/dom/framework/token-coverage.test.ts` | 9 | 23 | **RETARGET, net 0.** `LEGACY_MAP` → `BASE_MAP`, `legacyBase` → `unscopedBase`. It pins the `:root` token values, which survive verbatim. Does **not** change how it parses the workspace `D3-token-map.md` (first-column token names only). |
| `test/dom/framework/theme-steel.test.ts` | 16 | 16 | **RETARGET, net 0** — `baseValue()` prose only. |
| `test/dom/framework/theme-print.test.ts` | 12 | 14 | **RETARGET, net 0** — prose (`:16-19` "a Legacy print stays monochrome" is now vacuous; say the neutral/Steel-scoped split plainly). |
| `test/unit/prefs/catalog.test.ts` | 13 | 3 | **RETARGET, net 0** — `:105` asserts the help string `'applies under both the Steel and Legacy themes'`. |
| `test/dom/visual-harness/fixtures.test.ts` | 6 | 4 | **RETARGET, net 0** — `theme: 'legacy'` → `'steel'`. |

**Predicted jest delta: −7 to −9 tests, −0 suites** (`displayCardThemeBranch.test.ts` is renamed,
not removed). Every other "legacy" hit in the 163-file tree is the *other* legacy —
compendium-migration legacy paths, "legacy processor", "legacy keys". Do not touch them.

### 1.9 Docs / CHANGELOG / README

| File | What | Action |
|---|---|---|
| `README.md` | **zero** occurrences of "legacy" or "theme" | none |
| `CHANGELOG.md:340-343` (unreleased 7.0.0) | *"…the original look remains available as the **Legacy** style. Switch themes in Settings → Appearance."* | **edit in place** (7.0.0 is unreleased; a user upgrading 6.0.1 → 7.0.0 never saw a picker) |
| `CHANGELOG.md:77, 411, 454, 511, 543` | 5 more unreleased-7.0.0 lines naming Legacy | edit in place |
| `.repo-docs/architecture.md:158-196` | the theme-aware-DOM seam + "the four invariants" | rewrite: invariants 1-3 (theme-keyed) collapse; invariant 4 (print never branches) survives and is now the whole story |
| `.repo-docs/architecture.md:283-291` | "the ◆ divider cannot move in TS without breaking Legacy" | rewrite — the constraint is gone; **but do not act on it here** (that is a DOM change, its own ticket) |
| `src/prefs/catalog.ts` (6 help strings, `:183/191/199/207/215/223`) + `:240`, `:252` | *"A chosen font applies under both the Steel and Legacy themes"* / *"Applies under both the Steel and Legacy themes"* | reword |
| `docs/stamina-bar.md:72` | *"Under Legacy it is the badge beside the markers"* | reword |
| `styles-source.css:3328-3345` | the "Legacy IS the base" contract comment | **rewrite** — and add the standing note that no CSS was deleted and why the `[data-dse-theme='steel']` prefix stays |
| `visual-harness/README.md:10, 99, 109`; `parity/README.md:445`; `parity/selector-map.json:29`(+3 siblings) | prose | reword |
| `docs/statblock.md:195`, `docs/migrating-to-7.md`, `docs/compendium-migration-map.md` | the **other** legacy (pre-7.0 keys / the retired data repo) | **no change** |

**SC-65 ("Update the draw steel elements readme to remove legacy docs") is a DIFFERENT "legacy"
and must not be absorbed.** `README.md` contains neither "legacy" nor "theme"; SC-65 is about
pre-7.0 element/syntax documentation. Keep the tickets separate; note the disambiguation on
SC-65 so nobody re-conflates them.

**Workspace-level docs** (superproject, not the submodule):

| File | Action |
|---|---|
| `.claude/skills/dse-verify/SKILL.md` | **the big one** — new dated freeze entry, new expected numbers, rewritten "Steel scoping rule" (§3.5, Phase 5) |
| `FOLLOWUPS.md` **#49** "Legacy theme has no markdown-table styling at all" | **moot → archive** (as `(was #49)`) |
| `FOLLOWUPS.md` **#57** "`:root` tokens…the Legacy ◆ divider paints NOTHING" | **partially moot.** The screen arm dies (`styles-source.css:6367-6422` gives standalone `ds-hr` a real Steel-scoped treatment). The **print** arm survives: those Steel rules carry `:not([data-dse-print="on"])`, so in print the diamond still falls back to the invalid `:root` chain. Rewrite as a print-only finding; do **not** fix here. |
| `FOLLOWUPS.md` #45, #46, #47, #53, #54, #56, #39 | contain "Legacy"/"LEGACY-FREEZE" as rationale for a deferral. Re-read each; several lose their "can't, it'd move the frozen legacy bytes" blocker. **List the disposition; change no code.** |
| `ROADMAP.md:220, 229, 235` | "the Legacy theme … LEGACY-FREEZE byte-identity proof (98 legacy+print PNGs)" | reword |
| workspace `CHANGELOG.md` | one bullet under `## Unreleased` |
| `docs/superpowers/dse-overhaul/**` specs + build ledgers (~20 files) | **dated history — leave untouched** per the workspace CLAUDE.md routing rule |

### 1.10 `data-dse-print` interaction — settled

Print is **theme-independent by construction**, not legacy-derived. Two delivery surfaces share one
value block (`@media print` + the `[data-dse-print="on"]` on-screen twin, driven by the
`printPreview` pref, `catalog.ts:160`). The block has a **neutral** arm (surfaces → white, fg →
near-black, ornament off) that applies under any theme, plus a `[data-dse-theme='steel']`-scoped
arm for the role/act spines. Post-removal both arms always apply — which is *exactly* what
`*--steel-print.png` already captures. **Print looks the same after this ticket as before it.**
`theme-print.test.ts` keeps all 12 tests; only its header prose about "a Legacy print" changes.

### 1.11 Other multi-theme-keyed machinery

- `test/dom/framework/theme-steel.test.ts` (D3 token-map transcription pin) — parses the unscoped
  `:root` base *and* the Steel block and asserts both. Both survive. Prose only.
- `test/dom/framework/token-coverage.test.ts` `LEGACY_MAP` (D3) — the base token-value pin. Rename;
  it becomes the *only* token map, which is a clearer contract than before.
- Workspace `docs/superpowers/dse-overhaul/D3-token-map.md` has a "Legacy value" column that
  `token-coverage.test.ts` reads. The parser matches only the **first** column (backticked
  `--dse-<name>`), so a column heading rename is cosmetic and **cannot break the test**. Optional.
- `visual-harness/settings-evidence.mjs:380` already calls `setActive('steel')`. No change.
- `demo-vault/**` "legacy" hits are compendium flavour text. No change.
- `eslint.config.mjs`, `compendium-manifest.json`, `tools/gen-migration-map.mjs` — the *other*
  legacy. No change.

---

## 2. User-visible behaviour changes (each one needs to be in the Linear evidence)

1. **The Theme row disappears** from Settings → Appearance. (The group survives — it keeps Reduce
   motion / Print preview / Initiative portraits.)
2. **Anyone on Legacy is silently moved to Steel** on next load. This is the headline change and
   the one Scott's ruling authorises.
3. **The 6.0.1 look is retired with no opt-out.** For a user upgrading 6.0.1 → 7.0.0 this is the
   *real* story: their elements change appearance permanently and there is no longer an escape
   hatch. Unreleased-7.0.0 users briefly had one; released users never did. One honest CHANGELOG
   line, not a "removed a feature" line.
4. **"Reset all preferences" no longer resets a theme** (nothing to reset). Cosmetic.
5. **A hand-set snippet theme id in `data.json` (e.g. `theme: 'parchment'`) now renders the Steel
   DOM**, where it previously rendered the legacy DOM (`CardLayout.computeBranch` stops consulting
   the theme). Affects the kit card only — the sole layout with a `steel` composition. Reachable
   only by hand-editing `data.json`; call it out anyway.
6. **NOT changed:** print/PDF export output, every Steel screen surface, every parity-mapped
   surface, every YAML contract. Byte-proven, not asserted (Phases 3-4).

---

## 3. Phased execution plan

One implementer agent per phase. All work in an isolated worktree (`just wt-new sc144-legacy-drop`)
per the workspace CLAUDE.md rule 1. All commands wrapped per the `dse-verify` skill
(`devbox run -- bash -c 'cd /abs/path && …'`, gate command **last**, never piped).

### Phase 0 — Baseline capture (orchestrator, no edits)

Rebase the worktree onto post-SC-149 `origin/main`, then run the full battery and **record real
numbers**: `npm run tsc`, `npm run lint`, `npx jest` (N tests / M suites), `npm run shots` (expect
~334, 0 FAIL), `check-freeze.sh <wt>/draw-steel-elements/visual-harness/shots` (expect
`200/200 … 0 checksum mismatches`, exit 0), `npm run parity` (0/0/16/exit 0).

**Then archive the proof artifact this whole plan hinges on:**
`sha256sum visual-harness/shots/*--steel-*.png > /tmp/.../sc144-steel-before.txt` (all three Steel
classes: `steel-dark`, `steel-light`, `steel-print`). Every later phase diffs against this file.

*Gate:* all five green at the real numbers; `sc144-steel-before.txt` written.
*Deltas:* none.

### Phase 1 — Settings migration + pref/type removal

- `src/model/Settings.ts`: `settingsVersion: 2 → 3`; add
  `if (priorVersion < 3) { delete (s.prefs as Record<string, unknown>).theme; }`.
  Sparse storage means the deletion lands on the descriptor default (`steel`) — **silent, one-time,
  no error, no Notice** (decision D1). Extend the doc comment with the v2 → v3 paragraph, matching
  the existing v1 → v2 style.
- `src/framework/seams/prefs.ts:103-122`: drop the `ui` block from the `theme` descriptor (keep
  `key` + `default` so `prefs.get('theme')` still resolves). Rewrite the comment above it.
- `src/framework/seams/theme.ts:22`: `DseThemeId = 'steel' | (string & {})`.
- Tests: new `migrateSettings` case (v2 object carrying `prefs: { theme: 'legacy' }` → v3 with the
  key gone and `settingsVersion: 3`); delete `seams.test.ts:305-318` (the OD-5 options pin) and
  `settings-tab.test.ts:129` (the theme row); retarget the ~25 `'legacy'`-as-a-value sites in
  `seams.test.ts` / `managedModal.test.ts` / `prefs-storage.test.ts` to `'parchment'`.

*Gate:* `npm run tsc` clean, `npm run lint` clean, `npx jest` green.
*Deltas:* jest **−2 tests, +1 test ⇒ net −1**; suites unchanged.

### Phase 2 — De-branch `CardLayout` (the only theme-keyed DOM)

- `src/elements/shared/CardLayout.ts`: `computeBranch()` → `return !!this.layout.steel ? 'steel' : 'base';`
  (theme no longer consulted). Rename `renderLegacy` → `renderBase`, `'legacy' | 'steel'` →
  `'base' | 'steel'`. **Delete** `themeChangeRegistered` (`:236`), the `cx.theme.onChange`
  registration (`:264-277`), and `onThemeChange` (`:294-303`) — a branch that can no longer change
  at runtime needs no re-render path. Keep `renderBranch`/`cardEl` (still used by
  `authoringAnchor()`, SC-145).
- Rewrite the file header comment (`:38-60`).
- `test/dom/elements/displayCardThemeBranch.test.ts` → rename `displayCardBranch.test.ts`; keep two
  tests (composition-vs-base selection; no theme subscription is ever registered), delete the rest.
- `.repo-docs/architecture.md:158-196`: rewrite the seam section (four invariants → two).

*Gate:* tsc / lint / jest green; **then `npm run shots` and diff every `*--steel-*.png` hash
against `sc144-steel-before.txt` — must be 100% identical, including all 66 `steel-print`.** If any
Steel shot moves here, stop: the de-branching changed DOM and the premise is wrong.
*Deltas:* jest **−6 tests**; shots still ~334 (combos untouched); freeze still `200/200`.

### Phase 3 — Harness surgery

- `visual-harness/shoot.mjs`: `COMBOS` → the 3 Steel entries; drop the `--theme` flag and its
  filter (`:6`, `:115`) and the now-dead `badParts` arm for it; leave `--bg`.
- `visual-harness/entry.ts:443`: theme is always `'steel'`; drop the `theme` query param (or accept
  and ignore it). Rewrite the legacy-freeze rationale comments at `:75`, `:272`, `:335`.
- `visual-harness/obsidian-camera.mjs:78`: `THEMES = ['steel']`; update the usage/header comments
  (`:6`, `:37`).
- `visual-harness/README.md:10, 99, 109`: recount and reword.
- `test/dom/visual-harness/fixtures.test.ts`: 4 × `theme: 'legacy'` → `'steel'`.

*Gate:* tsc / lint / jest green; `npm run shots` → **exactly 200 files, 0 FAIL, and every one of
them hash-identical to its twin in `sc144-steel-before.txt`** (200 of the before-file's 200 Steel
lines matched, 134 legacy files simply no longer produced). `check-freeze.sh` at this point
**correctly reports 134 missing / 66 producible OK / 0 mismatches, exit 0** — the fixed script
(SC-117 M3) distinguishes `FAILED open or read` from `FAILED`. That is the expected, non-red state
between Phase 3 and Phase 4; do not "fix" it by editing the baseline early.
*Deltas:* shots **334 → 200**; obsidian-shots axis halves (last recorded 145 → verify).

### Phase 4 — Freeze-baseline retirement (workspace repo, `.superpowers/sdd/`)

- Back up: `cp freeze-baseline.sha256 freeze-baseline.sha256.pre-sc144-legacy-retirement-bak` (keep forever).
- Delete the **134** `*--legacy-{dark,light}.png` lines. **Touch nothing else** — the 66
  `steel-print` hashes must be byte-identical to the backup's.
- Prove it: `diff <(grep 'steel-print' …bak) <(cat freeze-baseline.sha256)` is empty, and
  `wc -l` is 66. **0 hashes changed, 134 lines removed, 0 added.** This is a *retirement*, a fourth
  baseline-operation category alongside widening / sanctioned rebaseline / capture-artifact
  correction — document it as such.
- Verify: `check-freeze.sh <wt>/draw-steel-elements/visual-harness/shots` →
  `freeze OK (66/66 …)`, exit **0**.

*Gate:* the diff proof + `freeze OK (66/66)`, exit 0.
*Deltas:* freeze **200 → 66**.

### Phase 5 — The verification regime: rewrite `dse-verify/SKILL.md`

The freeze system exists largely to protect the legacy theme; retiring legacy restructures it. Do
this deliberately, not as a footnote.

1. **New dated entry** under "Baseline corrections", as its own category:
   *2026-08-11, SC-144 — mass sanctioned RETIREMENT, 200 → 66, removals-only.* Record: Scott's
   ruling on SC-144 **is** the sanction (quote it); the 134 retired lines; the 0-hashes-changed
   proof; the backup filename; `freeze OK (66/66)`.
2. **Rewrite "Freeze semantics"** — the baseline is now `*--steel-print.png` only.
3. **Rewrite "Steel scoping rule"** — today it reads *"every new Steel rule must carry
   `[data-dse-theme='steel']:not([data-dse-print="on"])` — otherwise it leaks into the frozen
   legacy/print shots."* The legacy half is gone; the **print** half is the whole rule now, and it
   is still load-bearing. Also state the new standing fact: the `[data-dse-theme='steel']` prefix
   is retained deliberately (§0 consequence 2) even though it is always true.
4. **Update "Current expected numbers"** with Phase 6's measured battery.
5. **Answer the regime question explicitly** (decision D3, recommendation below).

*Gate:* skill reads correctly to a fresh agent; the numbers in it match Phase 6.
*Deltas:* n/a.

### Phase 6 — Docs, CHANGELOG, prose

Everything in §1.9 plus the workspace items. Split into two commits (submodule / superproject).
Notable non-mechanical ones:

- `styles-source.css:3328-3345` — the contract comment must now *teach the successor*: the base is
  the only value layer, Steel overrides it, no CSS was deleted by SC-144, and the always-true
  `[data-dse-theme='steel']` prefix stays on purpose.
- `CHANGELOG.md:340-343` — edit the unreleased Steel entry; add one line for user-visible change
  #3 (§2).
- `.repo-docs/architecture.md:283-291` — note the ◆-divider constraint is lifted **without acting
  on it**.
- Workspace `FOLLOWUPS.md`: archive #49 as `(was #49)`; rewrite #57 as print-only; add one new
  numbered item (take **#64** from `<!-- next-id: 64 -->`, then bump to 65) recording the
  disposition sweep of #39/#45/#46/#47/#53/#54/#56 whose "would move the frozen legacy bytes"
  blocker just evaporated.
- Workspace `CHANGELOG.md` `## Unreleased`: one bullet.
- Comment on **SC-65** that its "legacy" is a different one (README has zero theme content), so the
  two tickets stay separate.

*Gate:* tsc / lint / jest green (help-string assertions in `catalog.test.ts:105` and
`settings-tab.test.ts:562` move in the same commit as the strings).
*Deltas:* jest 0.

### Phase 7 — Full battery + Linear evidence

Run the whole battery in order at the landing commit (re-run after any rebase — the plan-25 lesson:
a sibling branch's fixture can enlarge your ask):

| Gate | Expected |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` | Phase-0 count **−7 to −9**, suites unchanged |
| `npm run shots` | **200**, 0 FAIL, all hash-identical to `sc144-steel-before.txt`'s Steel subset |
| `check-freeze.sh` | `freeze OK (66/66 …)`, exit 0 |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0** — unchanged |
| `npm run obsidian-shots` | only if a display is free; count roughly halves from 145 |

Post to SC-144: the six user-visible items from §2 (each explicitly confirmed or waived), the
before/after battery table, the 0-hashes-changed freeze proof, and a Steel screenshot pair (main-pane
width, **both** colour schemes — Scott's 2026-08-03 rule) showing the Appearance settings page
without the Theme row.

---

## 4. Follow-up simplification phase (explicitly OUT of scope — file, do not do)

| # | Item | Recommendation |
|---|---|---|
| F1 | **SC-123 defaults.** `sbCharLine:'one'` / `sbCharBox:'off'` / `sbVillain:'inline'` were chosen to hold legacy bytes frozen (`statblock/view.ts:268-295`, `:331-346`). That reason is gone; the site-faithful split/banded shapes may now deserve to be the defaults. | **Own ticket** — a real user-visible design decision, not a cleanup. |
| F2 | **Strip `[data-dse-theme='steel']` from ~297 rule blocks.** | **Decline by default** (§0 consequence 2). File so the question is answered once. |
| F3 | **Delete the ThemeService seam entirely** and hard-stamp `data-dse-theme="steel"`. | **Decline for now** (decision D2). Revisit only if snippet themes are formally abandoned. |
| F4 | **Freeze steel-light/dark** once Steel stops moving (post-7.0.0). | File on ROADMAP; see D3. |
| F5 | **The ◆ divider can now move in TS** (`.repo-docs/architecture.md:283-291`). | Own ticket. |
| F6 | **FOLLOWUPS #57's print arm** — the `:root` invalid-var chain still kills the print diamond. | Rewrite #57; fix separately. |

---

## 5. Risks

| Risk | Mitigation |
|---|---|
| A Steel shot moves during Phase 2's de-branching | The Phase-0 `sc144-steel-before.txt` hash file is diffed at **every** phase gate. Any movement halts the phase. |
| The baseline edit accidentally reflows a surviving hash | Retirement is removals-only and proved by `diff` against the backup; the backup is kept forever. |
| SC-149 lands mid-flight and adds fixtures | Rebase, then **re-run** shots + freeze and recount before Phase 4. Never carry Phase-0 numbers across a rebase (plan-25 lesson, `dse-verify` skill). |
| "legacy" is heavily overloaded in this repo (~180 files) — an over-eager find/replace breaks the compendium migration | Every edit in this plan is enumerated by `file:line`. The theme sense is identifiable by three markers only: the quoted id `'legacy'`, the `--legacy-{dark,light}` shot suffix, and prose adjacent to `data-dse-theme`. **No repo-wide sed.** |
| The freeze gate becomes weaker | Quantified, not hand-waved: `steel-print` renders the same DOM as the screen themes, so theme-agnostic DOM/content regressions (the class the SC-121 treasure fix tripped) are **still** caught — at 1 capture class instead of 3. What is genuinely lost is coverage of *screen-only, base-layer* CSS regressions. State this openly in the skill. |

---

## 6. Decision points for Scott (all have a recommended default — proceeding on the defaults is fine)

**D1 — Migration UX: silent, or a one-time Notice?**
→ **Recommend silent.** The theme picker has never shipped: latest tag is `6.0.1`, 7.0.0 is
unreleased. Only BRAT/beta vaults (and Scott's own) can hold `theme: 'legacy'`. A modal/Notice about
a preference that never reached a released user is noise. Implementation: `settingsVersion` 2 → 3,
`delete s.prefs.theme`, done.

**D2 — Delete the *option*, or the whole theme *seam*?**
→ **Recommend: option only.** Keep `ThemeService`, `data-dse-theme` stamping, and the open union
minus `'legacy'` (`'steel' | (string & {})`). Deleting the seam means touching ~14 ThemeService
tests, modal theming (SC-104's `WeakMap<App, ThemeService>`), the pipeline, and the premise of 410
CSS selectors — for zero user-visible gain, and it permanently closes the D3 §6 snippet-theme door.
Filed as F3 if he wants it later.

**D3 — What replaces legacy's anti-drift role in the freeze?**
→ **Recommend: keep `steel-print` (66 lines) as the sole frozen class; do NOT freeze
steel-light/dark yet.** Reasoning both ways:
- *For freezing Steel:* it is now the only look; an unfrozen look has no byte-level net.
- *Against (decisive):* Steel is under active design (SC-120's remaining family compositions,
  SC-117's token work). A frozen Steel would go red on every *intended* change and demand a
  sanctioned rebaseline each time — precisely the "a gate that always reads red trains people to
  skim it" failure the SC-117 M3 fix was written to eliminate.
- *Why `steel-print` is the right survivor:* print is stable, is never the direct target of design
  work, renders the same DOM (so it still catches theme-agnostic DOM/content regressions), and is
  reached *indirectly* — a structure-tier Steel rule leaking into print is exactly the accident
  worth a byte gate. Revisit freezing steel-{light,dark} once 7.0.0 ships (F4).

**D4 — The 6.0.1 look is now permanently unreachable.**
→ Confirm the 7.0.0 changelog should say so plainly (one line). Recommend yes: for a released user
this, not "an option was removed", is the actual change.

**D5 — SC-123's conditional-DOM defaults.**
→ **Recommend: not in this ticket.** Their "keep the legacy bytes frozen" rationale dies here, but
changing them is a visible design call. File as F1.

**D6 — SC-65.**
→ **Recommend: keep separate.** `README.md` has zero "legacy" and zero "theme" occurrences; SC-65's
"legacy docs" means pre-7.0 syntax documentation. Comment the disambiguation on SC-65 rather than
folding it in.
