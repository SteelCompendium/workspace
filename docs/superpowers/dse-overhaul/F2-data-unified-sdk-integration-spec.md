# F2 — Data-unified + SDK 3.x Integration Spec

**Program:** DSE Overhaul (see `README.md` in this directory) — Wave 1, planning only.
**Author:** Fable deep analysis, 2026-07-01.
**Status:** Draft for Scott's review. Zero code changes made; all file references verified
against the working trees on this date.

This spec retires the plugin's old data source (`data-md-dse` GitHub releases) in favor of
the consolidated **`data-unified`** repo, upgrades `steel-compendium-sdk` **2.1.5 → 3.1.0**
(a breaking bump), fixes the destructive compendium downloader, and defines the semantics of
**`scc.v1:` link resolution** inside the plugin. It owns the *semantics* of SCC resolution;
**F1 (Element Framework v2) owns the pipeline hook** that invokes it (§4.4).

Repos referenced (absolute paths):

| Repo | Path |
|---|---|
| DSE plugin | `/home/scott/code/steelCompendium/workspace/draw-steel-elements/` |
| SDK (target) | `/home/scott/code/steelCompendium/workspace/data-sdk-npm/` |
| Data output | `/home/scott/code/steelCompendium/workspace/data/data-unified/` |
| Workspace docs | `/home/scott/code/steelCompendium/workspace/` |

---

## 1. As-is analysis

### 1.1 The downloader (`src/utils/CompendiumDownloader.ts`, `main.ts`)

- `main.ts:14-15` hardcodes `githubOwner = "steelCompendium"`, `githubRepo = "data-md-dse"`.
  The command id is `download-data-md-dse` (`main.ts:29`) — the legacy repo name is baked
  into a user-visible identifier.
- Flow: GitHub Releases API (`/releases/latest` or `/releases/tags/{tag}`) via Obsidian's
  `request()`; finds the `repo.zip` asset; downloads it via `requestUrl()` (good — already
  CORS/mobile-safe); loads with JSZip; extracts in batches of 20 with a UI-thread yield.
- **Destructive delete (the bug we're fixing):** `CompendiumDownloader.ts:81-84` does
  `vault.delete(dir, true)` on the *entire destination directory* before extraction. Any
  user homebrew stored under `DS Compendium/` is silently destroyed. The settings tab
  (`src/views/SettingsTab.ts:37`) literally warns "THIS DIRECTORY WILL BE WIPED CLEAN!" —
  a warning standing in for a design. Also uses `Vault.delete` rather than
  `FileManager.trashFile()`, so the destruction isn't even recoverable from trash.
- No manifest, no record of the installed release tag, no update check, no progress
  reporting beyond three Notices, and errors are swallowed into a Notice.
- **The source repo is dead.** `data-md-dse`'s last release is `v3.20260403152914`
  (2026-04-03); the pipeline has emitted only to `data-unified` since. Users who "update"
  today get three-month-stale data.

### 1.2 SDK usage (pinned `steel-compendium-sdk@2.1.5`, bundled at build time)

Four import sites, all through the same pattern (`Model.read(new YamlReader(Model.modelDTOAdapter), text)`):

| File | Imports | Notes |
|---|---|---|
| `src/model/StatblockConfig.ts` | `Statblock`, `YamlReader` | thin wrapper |
| `src/model/FeatureConfig.ts` | `Feature`, `YamlReader` | thin wrapper (+ `indent` from raw YAML) |
| `src/model/FeatureblockConfig.ts` | `Featureblock`, `YamlReader` | thin wrapper |
| `src/drawSteelAdmonition/Features/EffectView.ts` | `Effect` (type only) | reads `name/cost/effect/roll/tier1-3/crit/…` |

Field consumers that the 3.x rename breaks (§2.1):
`src/drawSteelAdmonition/statblock/StatblockProcessor.ts:41` (`statblock.roles?.join(", ")`)
and `:46` (`statblock.ancestry?.join(", ")`). No other `roles`/`ancestry` consumers exist in
`src/` (grep-verified). DSE's own AJV validator (`src/utils/JsonSchemaValidator.ts`) only
registers *plugin* schemas (`src/model/schemas/*.yaml` — ComponentWrapper, Skills,
StaminaBar); it does not consume SDK schemas today, so the SDK's AJV draft migration (§2.2
item 2) is not a hard dependency — but becomes one if we adopt SDK-schema validation later.

### 1.3 Reference resolution (`src/utils/ReferenceResolver.ts`)

Resolves `@path`, `[[wikilink]]`, and bare strings through a 5-step lookup (exact path →
`+.md` → compendium-dir prefix → prefix `+.md` → `metadataCache.getFirstLinkpathDest`), then
**extracts the first `ds-*` fenced code block** from the target file and parses its YAML.
Sole consumer: `src/drawSteelAdmonition/EncounterData.ts` (initiative tracker
`hero.statblock` / `creature.statblock` string references).

Problems:
- **No `scc.v1:` awareness** — the new data's links and the natural cross-reference syntax
  are invisible to it.
- **Hard dependency on a `ds-*` block existing in the target file** — which collides with
  the new md-dse format (§1.4): monster files no longer contain one.
- Throws on miss with a wall-of-text error; no graceful fallback.

### 1.4 What the new data actually looks like (verified against `data/data-unified`)

`en/unified/md-dse/` = 3,078 files ≈ 17 MB (md-dse-linked identical count/size). Layout is
locale-first (`en/`), then `unified/<format>/` (Browse aggregate, one tree keyed by SCC
type path) and `books/<book>/<format>/` (Read, book-faithful; `en/books/` is ~108 MB across
all formats).

- Every file carries rich frontmatter: bare `scc:` identity, `source`, `type`, `item_id`,
  `item_name`, `file_basename`, `file_dpath`, plus type-specific structured fields
  (statblocks carry `role`/`organization`/`keywords`/`ev`/characteristics — already
  SDK-3.x-shaped).
- **`md-dse` vs `md-dse-linked` differ only in link encoding** (byte-compared on
  `monster/goblin/statblock/goblin-stinker.md` and
  `feature/fury/level-1/1st-level-aspect-features.md`):
  - `md-dse`: `[slide](scc.v1:mcdm.heroes.v1/movement/forced-movement)` — location-independent SCC URIs.
  - `md-dse-linked`: `[slide](../../../movement/forced-movement.md)` — pre-resolved
    file-relative paths (steel-etl `internal/output/dse_linked.go` rewrites via
    `SCCToFilePath`). The rewrite applies *inside `ds-feature` YAML blocks too*.
- **Only `feature/` (1,593) and `kit/` (25) files contain ` ```ds-feature ` blocks**
  (grep-counted: 1,618 of 3,078). All other types — including all **694 `monster/` files —
  are plain rendered markdown** (stat table + `> 🔳/⭐️` blockquote abilities, the SDK
  "sc-md" style), with **no `ds-sb` block**. Consequences:
  1. Compendium statblock pages render as plain markdown, not DSE's styled statblock element.
  2. `@`-referencing a compendium monster from the initiative tracker **breaks** (resolver
     finds no `ds-*` block). This is the single biggest integration gap; §3.3 resolves it.

### 1.5 Problem summary

| # | Problem | Where |
|---|---|---|
| P1 | Destructive dir delete destroys homebrew | `CompendiumDownloader.ts:81-84` |
| P2 | Points at dead `data-md-dse` repo | `main.ts:14-15` |
| P3 | SDK 2.1.5 vs 3.1.0 drift; statblock field rename unshipped | `package.json`, `StatblockProcessor.ts` |
| P4 | No `scc.v1:` link understanding anywhere | resolver + all rendered markdown |
| P5 | Resolver requires `ds-*` block; new statblock files have none | `ReferenceResolver.ts:50-54` + md-dse format |
| P6 | No install manifest / version stamp / update UX | downloader + settings |

---

## 2. SDK 2.1.5 → 3.1.0 migration

Derived from `data-sdk-npm` git history (2.1.5 = `f632a8e`; 3.0.0 = `59c552e` "Phase 4 sdk
updates"; 3.1.0 = `40ac2d4`) and `CHANGELOG.md`. **Note: the CHANGELOG has no 3.0.0 entry**
— the breaking changes below are enumerated from the source diff, not the changelog. The
public entry surface (`src/index.ts`, subpath exports `./model`, `./dto`, `./schema`) is
unchanged; all breakage is at the model/schema level.

### 2.1 Breaking changes (must-fix)

**B1 — Statblock field rename (3.0.0).** `Statblock`/`StatblockDTO`/statblock schema:
`roles: string[]` and `ancestry: string[]` are **removed**, replaced by `role: string`,
`organization: string`, `keywords: string[]`. Schema `$id` bumped to
`statblock.schema.json-3.0.0`; `required` grew to include `level`, `role`, `organization`,
`keywords`.

- Plugin impact: `StatblockProcessor.ts:41` becomes
  `[organization, role].filter(Boolean).join(" ")` (matching the rendered "Horde
  Controller" style); `:46` becomes `keywords.join(", ")`. Effort: **small** (one file),
  plus visual QA of the header line.
- **⚠️ Element YAML contract change:** every user-authored `ds-sb`/`ds-statblock` block
  using `roles:`/`ancestry:` stops parsing those fields. This is the change that forces the
  plugin **major version bump** and drives the homebrew-compat decision (OD-4, §7).

**B2 — Statblock schema draft + strictness (3.0.0).** Schema moved draft-07 →
**2019-09** and `additionalProperties: false` → `unevaluatedProperties: false`; the SDK's
own validator now instantiates `Ajv` from `ajv/dist/2019`. Plugin impact today: **none**
(DSE's AJV registry doesn't load SDK schemas). Latent impact: any future plugin-side
validation against SDK schemas must use a 2019-09-capable Ajv instance. Effort: zero now;
note in code comments.

**B3 — `FeatureDTO.name` is now optional (`name!: string` → `name?: string`).** Type-level
break for anything reading `.name` off the DTO without a guard. The plugin reads names off
the *model* (already optional since SDK 1.0.0) — `StatblockProcessor` and the feature views
already `??`-guard. Effort: **trivial**; `vue-tsc` will surface any misses at build time.

### 2.2 Additive changes (adopt / be aware)

**A1 — `FeatureType.Subtrait` (2.2.0).** `feature_type` may now be `"subtrait"`. The
feature views render off effects generically, so no crash — but the F1 render pipeline
should style subtraits (nested/indented trait). Flag for the F1/D2 specs. Effort: small,
in the feature view.

**A2 — Ten new model families (3.0.0):** `Ancestry`, `Career`, `Class`, `Complication`,
`Condition`, `Culture`, `Kit`, `Perk`, `Title`, `Treasure` — each with DTO + JSON schema +
validator registration. No existing code touched; this is the raw material for **D5 (new
elements)** — e.g. `ds-kit`, `ds-treasure` cards can parse via the SDK instead of bespoke
models.

**A3 — 3.1.0 card-data parity:** `Culture.flavor`, `Perk.flavor`, `Treasure.echelon`,
`Treasure.project_goal: string | number`. Only matters once D5 elements exist.

**A4 — `MarkdownStatblockReader` / `SteelCompendiumIdentifier` rework (3.0.0).** The sc-md
reader now derives `organization`/`role` from the header row (fixed organization-name set:
MINION/HORDE/PLATOON/ELITE/SOLO/LEADER). Not consumed by DSE today; relevant only if we
ever parse rendered statblock markdown (we deliberately do not — §3.3).

### 2.3 ⚠️ HEAD ≠ 3.1.0 — unreleased SDK drift

`data-sdk-npm` HEAD carries **post-3.1.0, unpublished** commits the generated data already
reflects: featureblock schema registered in exports/validator (`f7de66c`), featureblock
`intro` field (`90184c1`, in the "Unreleased" changelog section), statblock `cost` (summon
cost, `08c58ea`), statblock `flavor` (`a8b414c`), and fixture fields
(`statblock_kind: "fixture"`, `terrain_type`, `38496fe`). Summoner-book statblocks in
data-unified carry `cost:` in their YAML — **an npm-published 3.1.0 does not know these
fields** (harmless for parsing since the model is tolerant, but schema validation and typed
access lag). **Recommendation: publish SDK 3.2.0 from HEAD before DSE pins** (OD-5). DSE
then pins exactly `3.2.0`.

### 2.4 Migration work list (plugin side)

| Task | Files | Effort |
|---|---|---|
| Bump dep to 3.2.0 (or 3.1.0 per OD-5) | `package.json` | trivial |
| `roles`/`ancestry` → `role`/`organization`/`keywords` | `StatblockProcessor.ts` | small |
| Optional legacy-key shim for homebrew `ds-sb` YAML (OD-4) | `StatblockConfig.ts` pre-parse | small |
| Subtrait render styling | feature views (coordinate with F1/D2) | small |
| Type-check sweep for `FeatureDTO.name?` | build-time discovery | trivial |
| Update `.repo-docs/integration.md` dependency map + this decision's ADR | `.repo-docs/` | small |

Total: comfortably a single sitting once the SDK release exists. The *cost* of this bump is
not code — it's the user-facing YAML contract break (§6).

---

## 3. Consuming data-unified

### 3.1 Decision: ship **Browse-`unified` layout, `md-dse` format** (not `md-dse-linked`, not `books/`)

**Layout — `en/unified/<format>/` (Browse aggregate):**
- It is the SCC-shaped tree: file path ≡ `SCCToFilePath(code)` (drop the source segment,
  expand dots to `/`; e.g. `mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker` →
  `monster/goblin/statblock/goblin-stinker.md`). That property is exactly what the SCC
  resolver needs for O(1) code→path derivation (§4.2).
- One copy of everything, cross-book, 3,078 files / 17 MB. The `books/` layout is
  book-faithful reading (108 MB across formats, items duplicated relative to unified) —
  the wrong shape for a lookup/reference vault. Users who want book-order reading have the
  v2 website's Read tab.
- Per-book selection is **deferred** (non-goal §8): v1 ships the whole unified tree; a
  future "books to include" setting can filter by frontmatter `source:` at sync time
  without changing the layout.

**Format — `md-dse` (raw `scc.v1:` links) over `md-dse-linked` (pre-resolved relative links):**

`md-dse-linked` is tempting because its links work natively in Obsidian reading mode with
zero resolver work. It loses on three counts:

1. **Relative links break out of place.** DSE renders YAML-embedded markdown (effect text,
   tier lines) via `MarkdownRenderer` against the *consuming note's* `sourcePath`. A
   statblock referenced into an initiative-tracker note, a transcluded feature, or homebrew
   that copy-pastes a `ds-feature` block all render `../../../rule/...md` links relative to
   the wrong file — silently broken. `scc.v1:` URIs are location-independent.
2. **Relative links break on user file moves**; SCC resolution can fall back to a
   frontmatter index (§4.2) because *codes are forever, paths are not* (workspace SCC
   code-vs-path principle).
3. **One link grammar everywhere.** Homebrew authors write the same `scc.v1:` links the
   official data uses, and they resolve identically in any note.

Cost of choosing `md-dse`: DSE must resolve `scc.v1:` anchors in **all** rendered
compendium markdown, not just inside `ds-*` blocks — §4.3 specifies the vault-wide
post-processor. That work is core F2 scope regardless (the YAML-embedded links need it
even under md-dse-linked, per point 1), so the marginal cost is small. **Decision:
`md-dse`.** (Surfaced as OD-3 for sign-off because it commits us to the global
post-processor.)

**Locale:** settings gain `locale` (default `"en"`, hidden or single-option dropdown for
now). The downloader composes `{locale}/unified/md-dse` paths. No i18n work beyond keeping
the segment addressable.

### 3.2 Source repo + release shape

`data-unified` today has **no releases and no tags** — it is branch-committed by
`just deploy` (`chore: update generated data (steel-etl <sha>)`). Three options:

| Option | Mechanics | Verdict |
|---|---|---|
| **(a) Pipeline publishes GitHub Releases with per-format zip assets** | `just deploy` gains a step: zip `en/unified/md-dse` → asset `md-dse-unified.zip` on a release tagged with the existing timestamp convention (`v4.<UTC-timestamp>`), created via `gh release create` | **Recommended.** Pinnable versions (keeps DSE's release-tag setting meaningful), tiny download (17 MB tree → ~3–5 MB zip), same download flow the plugin already implements |
| (b) Codeload zipball of `main` (`/archive/refs/heads/main.zip`) | No pipeline change | Whole repo (~all formats, both layouts, >150 MB zipped) for 17 MB of need; no pinning; mobile-hostile |
| (c) Per-file raw fetch via Git tree API | No pipeline change | Thousands of requests; unauthenticated rate limit is 60/hr — dead on arrival |

**(a)** is a small, cross-repo coordination item (steel-etl/justfile change, not DSE code) —
**OD-2**. Until it lands, development can proceed against a hand-cut release on
`data-unified`. Asset naming contract: `{format}-unified-{locale}.zip` (v1 publishes only
`md-dse-unified-en.zip`; the name leaves room for others). The zip's internal root is the
format dir's *content* (i.e. `class/…`, `monster/…` at top level) so extraction lands
directly under the managed root.

### 3.3 The statblock gap — upstream `md-dse` format fix (OD-1, recommended option A)

Monster/featureblock files in md-dse are pre-rendered markdown with no `ds-*` block
(§1.4), so DSE can neither render them as styled elements nor resolve them as initiative-
tracker references. Options:

- **(A) — recommended: steel-etl emits `ds-sb` / `ds-fb` blocks in md-dse statblock and
  featureblock/dynamic-terrain files**, exactly as it already emits `ds-feature` for
  features/kits (`internal/output/dse.go` comment: "Abilities and traits use ```ds-feature
  YAML codeblocks"). The YAML payload already exists — it's what the `yaml/` format writes
  (verified: `yaml/monster/goblin/statblock/goblin-stinker.yaml` is SDK-3.x DTO shape,
  `role`/`organization`/`keywords`, features nested). The md-dse format exists *for* DSE;
  a DSE format whose statblocks DSE can't render is failing its one job. File body becomes
  frontmatter + `ds-sb` block (drop the duplicate rendered table — DSE renders it better;
  the plain-markdown rendering remains available in `md`/`md-linked` formats).
- (B) Plugin parses rendered sc-md back into a `Statblock` via the SDK's
  `MarkdownStatblockReader`. Works in principle (SDK round-trip-tests this format) but is
  the fragile direction — the Go-side rendered output embeds `scc.v1:` links inside table
  cells and ability blocks that the reader was never tested against, and we'd be coupling
  the plugin to cosmetic rendering choices. Reject.
- (C) Ship the `yaml/` tree alongside md-dse and teach the resolver to read
  `yaml/<path>.yaml` for structured data. Doubles the download and splits every entity
  across two files. Reject.

(A) is a steel-etl change + regeneration — no SCC codes change, no schema change; it slots
into the existing `buildDSEFile` switch. It must land (and data-unified re-release) before
DSE 6.0.0 ships; sequencing in §6.

### 3.4 Redesigned downloader — `CompendiumSyncService` (non-destructive)

Replaces `CompendiumDownloader`. Design principles: **manifest-driven sync; never touch a
file we didn't put there; never hard-delete user modifications.**

**Manifest.** `compendium-manifest.json` stored in the plugin's own data dir (via
`this.app.vault.adapter.write` under
`.obsidian/plugins/draw-steel-elements/compendium-manifest.json` — *not* inside the
compendium folder where Obsidian hides dotfiles and users can sync-mangle it):

```json
{
  "schemaVersion": 1,
  "source": "SteelCompendium/data-unified",
  "releaseTag": "v4.20260701T120000",
  "locale": "en",
  "format": "md-dse",
  "root": "DS Compendium",
  "files": { "class/shadow.md": "<sha256>", "...": "..." }
}
```

**Sync algorithm** (per release download):

1. Resolve release (latest or pinned tag) via `requestUrl` against the GitHub API; find the
   `md-dse-unified-en.zip` asset; download via `requestUrl` (binary). *(Migrate the current
   metadata call from `request()` to `requestUrl()` for uniform status handling. Both are
   Obsidian APIs — no `fetch`, no Node builtins; JSZip is pure JS and mobile-safe.
   `manifest.json` keeps `isDesktopOnly: false`.)*
2. Load zip; compute the **incoming set** (path → content) rooted at the managed root.
3. For each incoming file: create if absent (`vault.createBinary`, folders ensured with
   `normalizePath`); overwrite if present **and** either listed in the old manifest or
   hash-identical (`vault.modifyBinary` on the existing `TFile` — no delete/recreate churn).
   If a file exists, is *not* in the old manifest, and differs → it is **user content
   squatting on a compendium path**: skip it, record it, surface a post-sync summary Notice
   ("N files skipped — see console") rather than clobbering.
4. For each old-manifest file absent from the incoming set: if its current hash matches the
   manifest (user never touched it) → `FileManager.trashFile()` (recoverable); if modified →
   leave in place and report. Files never in any manifest are **never** considered —
   homebrew living inside `DS Compendium/` is now safe by construction.
5. Write the new manifest atomically (write temp, then rename via adapter).
6. Batched with UI yields (keep the existing batch-20 pattern); progress via a single
   updating Notice ("Syncing compendium… 1,240/3,078").

**Settings UX** (`SettingsTab.ts` rework; sentence case per plugin guidelines):

- "Compendium" section: destination folder (default stays `DS Compendium`); release —
  "Latest" or pinned tag; locale (en); **Sync compendium** button; status line rendered from
  the manifest ("v4.20260701 · 3,078 files · synced 2026-07-01"); **Check for updates**
  (compares latest release tag vs manifest, no download).
- Remove the "WIPED CLEAN" warning; replace with: "Only files installed by the plugin are
  updated or removed. Your own notes in this folder are never touched."
- Command: keep id `download-data-md-dse` as a hidden alias for one major cycle (removing
  an id silently drops user hotkeys) and add the properly named `sync-compendium` /
  "Sync compendium". Old id removal noted for 7.0.0.

---

## 4. SCC link resolution

### 4.1 Link grammar accepted (per `reference/scc-specification.md` §2.0/§3.2)

- `scc.v1:<source>/<type>/<item>` — canonical reference form.
- `scc:<code>` — permanent implicit-v1 alias; normalize to v1.
- Optional `#<format>` fragment (e.g. `#json`) — **stripped before lookup** (reserved
  format qualifier; one entity, different representation).
- Any *other* scheme version (`scc.v2:…`) is **not resolved** — rendered as plain display
  text (spec-mandated: a future-version reference must never silently bind to current
  content).

### 4.2 Resolution semantics — `SccResolverService`

Single service, injectable, exposed to F1's seam:

```ts
type SccResolution =
  | { kind: "vault"; file: TFile; linkpath: string }   // open in vault, hover-previewable
  | { kind: "web"; url: string }                        // https://steelcompendium.io/scc/{code}/
  | { kind: "unresolved"; code: string };               // render display text as plain text

interface SccResolver {
  resolve(rawTarget: string): SccResolution;  // accepts "scc.v1:…", "scc:…"; sync — see index note
}
```

Resolution order for a normalized code:

1. **Path derivation (primary, O(1)):** `managedRoot + "/" + sccToFilePath(code)` where
   `sccToFilePath` mirrors steel-etl `internal/output/generator.go:SCCToFilePath` — drop
   the source segment, split remaining segments on `.` into path parts, append `.md`,
   `normalizePath` the result, look up via `vault.getAbstractFileByPath`. Covers 100% of a
   freshly synced compendium. (Source-dropping is collision-free by the same argument the
   unified tree relies on; the ETL already guarantees uniqueness of `type/item` across
   books in the aggregate.)
2. **Frontmatter-`scc` index (fallback):** lazily built map of frontmatter `scc` →
   `TFile` from `metadataCache` (seeded on first resolve; incrementally maintained via
   `metadataCache.on("changed")` / `vault.on("rename"/"delete")`, all through
   `registerEvent`). Honors the workspace **code-vs-path principle** — users may move/
   rename compendium files, and future data releases may diverge path from code; the index
   keeps codes resolving. Also catches homebrew notes that *declare* an `scc:` frontmatter
   identity.
3. **Web permalink (fallback):** `https://steelcompendium.io/scc/{code}/` — the spec's
   permanent redirect stub. Used when no compendium is installed or the code is locally
   missing (older download, tombstoned code). Gated by a settings toggle "Fall back to
   steelcompendium.io links" (default **on**; navigation happens only on click, so no
   passive network traffic).
4. **Unresolved:** keep the display text, drop the anchor (add a CSS class,
   e.g. `.ds-scc-unresolved`, for subtle styling + tooltip "Unknown SCC code").

### 4.3 Where resolution applies

**(a) Inside DSE elements** — markdown fields (effect text, tiers, bonuses…) rendered via
`MarkdownRenderer`. Obsidian emits `scc.v1:…` hrefs as inert external anchors; a
post-render DOM pass rewrites every `a[href^="scc"]`:

- `vault` → convert to a native internal link: set `data-href`/`href` to the target
  linkpath, add `internal-link` class (native click handling + hover preview for free).
- `web` → `https://…` external anchor (`.ds-scc-web` class, external-link styling).
- `unresolved` → unwrap to text.

**(b) In compendium notes themselves** — md-dse note bodies (classes, rules, monsters)
carry `scc.v1:` links in ordinary markdown *outside* any `ds-*` block. DSE registers a
**vault-wide `registerMarkdownPostProcessor`** running the same DOM pass over every
reading-mode render. Cost control: first line is
`if (!el.querySelector('a[href^="scc"]')) return;` — near-zero for non-compendium notes.
This is the one genuinely new surface (today DSE only registers code-block processors) and
is required by the md-dse format choice (§3.1).

**(c) In element YAML references** — `ReferenceResolver` extension: a reference string
starting `scc:`/`scc.v1:` (e.g. initiative tracker
`statblock: scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker`) resolves via
`SccResolverService` to a `TFile` first, then reuses the existing "extract first `ds-*`
block" step (which works once §3.3(A) lands). `@path` and `[[wikilink]]` behavior is
unchanged — the legacy 5-step lookup is retained verbatim beneath the new scc branch.
Improved miss handling: if the target file exists but has no `ds-*` block, the error names
the file and its frontmatter `type` instead of the current generic wall of text.

### 4.4 F1 seam contract (dependency, not blocker)

F1's Element Framework v2 exposes an SCC-link-resolution seam in its render pipeline. F2's
side of the contract, stated so F1 can build against it:

- F2 **provides**: `SccResolver.resolve()` (§4.2) plus the anchor-rewrite DOM pass as a
  pure function `rewriteSccAnchors(root: HTMLElement, resolver: SccResolver): void`.
- F1 **provides**: the invocation points — its post-render hook per element, and (once the
  pipeline exists) ownership of the vault-wide post-processor registration so reading-mode
  and future Live-Preview paths share one implementation.
- **Until F1 lands**, F2's implementation plan registers the vault-wide post-processor
  directly in `main.ts` and calls `rewriteSccAnchors` from the existing per-element render
  code — a shape F1 can lift into its pipeline without semantic change. This interface is
  marked **provisional pending the finalized F1 spec**; only the two function signatures
  above are load-bearing.

`resolve()` is synchronous by design (path lookup + in-memory index) so F1 may call it
mid-DOM-pass without async plumbing; index seeding happens off the first render tick.

---

## 5. Data-flow diagram (end to end)

```
  steel-etl input/ (book sources, scc.v1: links)
        │  steel-etl gen --all
        ▼
  data/data-unified  ── en/unified/md-dse/**  (3,078 files; frontmatter scc: + ds-feature/
        │                                      ds-sb/ds-fb blocks after §3.3(A); scc.v1: links)
        │  just deploy: commit+push  +  NEW: zip en/unified/md-dse → GitHub Release
        ▼                                      asset md-dse-unified-en.zip  (OD-2)
  GitHub Release (SteelCompendium/data-unified, tag v4.<timestamp>)
        │
        │  requestUrl (release meta + asset)          ┌────────────────────────────┐
        ▼                                             │ compendium-manifest.json   │
  DSE CompendiumSyncService ──── manifest diff ─────► │ (.obsidian/plugins/…)      │
        │   create / modifyBinary / trashFile         └────────────────────────────┘
        │   (managed files only — homebrew untouched)
        ▼
  Vault: <managed root>/ (default "DS Compendium/")  path ≡ SCCToFilePath(code)
        │
        ├─ user opens compendium note (reading mode)
        │     Obsidian MarkdownRenderer
        │        ├─ plain body ──► vault-wide post-processor ─┐
        │        └─ ds-* block ──► element processor          │
        │              │  YAML ──► SDK 3.x models             │
        │              │  (Statblock/Feature/Featureblock)    │
        │              ▼                                      │
        │        F1 render pipeline ── post-render hook ──────┤
        │                                                     ▼
        │                                        rewriteSccAnchors(el, resolver)
        │                                                     │
        │                                          SccResolverService
        │                                       1) root + sccToFilePath(code)
        │                                       2) frontmatter-scc index (metadataCache)
        │                                       3) https://steelcompendium.io/scc/{code}/
        │                                       4) plain text
        │
        └─ initiative tracker note: statblock: scc.v1:<code> / @path / [[wikilink]]
              ReferenceResolver ──► SccResolver → TFile ──► extract ds-sb YAML ──► SDK model
```

---

## 6. Migration & compatibility

**Version bump:** DSE **5.1.1 → 6.0.0** (manifest.json, versions.json, CHANGELOG). Breaking
on two axes: the `ds-sb` YAML contract (B1) and the compendium source/format switch.

**Sequencing (cross-repo, before plugin release):**
1. SDK: publish **3.2.0** from HEAD (OD-5).
2. steel-etl: md-dse emits `ds-sb`/`ds-fb` blocks (OD-1/A); regenerate.
3. deploy pipeline: data-unified release publishing (OD-2); cut first release.
4. DSE 6.0.0: SDK bump + sync service + SCC resolver, pinned to the release asset contract.

**User-facing steps on upgrade:**
1. Update plugin. Settings migrate in place (`compendiumDestinationDirectory` and
   `defaultImagePath` carry over; `compendiumReleaseTag` is **reset to empty/latest** —
   old `v3.*` tags belong to the dead repo and must not be replayed against the new one).
2. **Re-download required** (communicated in release notes + a one-time in-app notice):
   run "Sync compendium". The first sync finds **no manifest**, so the old data-md-dse
   content is treated as unmanaged: nothing is deleted. The plugin detects legacy content
   (files under the root lacking manifest entries whose paths collide with incoming ones
   are reported per §3.4 step 3) and the notice offers **"Move old compendium to trash"**
   as an explicit, confirmed, one-time action (`FileManager.trashFile` on the old root
   before first sync) — default is *do nothing automatically* (OD-6).
3. Homebrew `ds-sb` blocks: with the compat shim (OD-4, recommended) legacy `roles:` /
   `ancestry:` keys keep rendering with a console deprecation warning for the 6.x cycle;
   without it, users hand-edit. Either way the CHANGELOG documents the rename
   (`roles`→`role`+`organization`, `ancestry`→`keywords`; the shim classifies `roles[]`
   entries against the organization-name set exactly as SDK 3.0's markdown reader does).
4. Old repo: `data-md-dse` gets a final README/release pointing at the new source, then
   archives (coordination item, outside DSE).

**Docs-as-done:** update `draw-steel-elements/CLAUDE.md` (downloader constraint line),
`.repo-docs/integration.md` (dependency map: data-md-dse → data-unified; SDK version; new
release-asset contract; SCC reference syntax), a new
`.repo-docs/decisions/` ADR for the source migration, and workspace `ARCHITECTURE.md`
(data-unified release step). If the md-dse format change (OD-1) lands, append to
`docs/scc-log.md` is *not* required (no scheme/registry change) but the format table in
`ARCHITECTURE.md` is.

---

## 7. Open Decisions — needs Scott

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **OD-1** | md-dse statblock format: files currently have no `ds-sb` block, breaking DSE rendering + tracker refs | (A) steel-etl emits `ds-sb`/`ds-fb` blocks in md-dse (drop the duplicate rendered table) · (B) plugin parses rendered sc-md via SDK reader · (C) ship `yaml/` tree alongside · (D) do nothing (statblocks stay plain markdown; tracker refs to compendium monsters unsupported) | **(A)** — md-dse exists for DSE; payload already exists in the `yaml` writer. Cross-repo change + regen |
| **OD-2** | data-unified has no releases; download needs an artifact | (a) pipeline publishes per-format zip release assets · (b) codeload zipball of main · (c) raw per-file fetch | **(a)** — `md-dse-unified-en.zip`, timestamp tags; small justfile/steel-etl deploy addition |
| **OD-3** | Format choice commits to a vault-wide markdown post-processor | `md-dse` (scc links + resolver, robust everywhere) vs `md-dse-linked` (native links, breaks when YAML renders in another note's context, breaks on file moves) | **`md-dse`** (§3.1) |
| **OD-4** | Homebrew `ds-sb` compat for the B1 rename | hard break (docs only) vs one-cycle legacy-key shim with deprecation warning | **Shim** — small, kind, self-expiring at 7.0.0 |
| **OD-5** | SDK pin: npm 3.1.0 lacks fields the data already emits (featureblock export/`intro`, statblock `cost`/`flavor`/fixture fields) | pin 3.1.0 and eat the gap vs publish 3.2.0 from HEAD first | **Publish 3.2.0**, pin exactly |
| **OD-6** | Legacy `DS Compendium` cleanup on first sync | manual-only vs one-time confirmed "move to trash" offer | **Confirmed offer**, default no-op |
| **OD-7** | Web-fallback links to `steelcompendium.io/scc/{code}/` | default on vs off | **On** (click-time navigation only; toggle provided) |

**New dependencies: none proposed.** JSZip is already a dependency; the resolver, sync
service, and post-processor are plain Obsidian APIs. (Per program decision #4, anything
that changes this — e.g. a streaming-unzip lib if mobile memory proves tight — comes back
as a fresh Open Decision.)

## 8. Risks & non-goals

### Risks

| Risk | Mitigation |
|---|---|
| SDK HEAD keeps drifting past whatever we pin (no release discipline; CHANGELOG already skipped 3.0.0) | OD-5 release before pin; DSE CI later (F3) can diff pinned schema `$id`s against data frontmatter |
| F1 seam interface changes under this spec | Only two provisional signatures exposed (§4.4); resolver semantics are seam-independent |
| Vault-wide post-processor perf on huge vaults | `querySelector` early-exit; measured in F3's harness before ship |
| Frontmatter-`scc` index cost on large vaults | Lazy seed off first resolve; incremental updates via registered events; index only stores code→path |
| Mobile memory: ~5 MB zip + 17 MB extracted churn | Existing batch/yield pattern retained; sync is user-initiated; if profiling fails on device, revisit with a streaming unzip (new OD) |
| Unauthenticated GitHub API rate limit (60/hr) | 2 requests per sync; "check for updates" is 1; acceptable. No token UX in v1 (the old `githubToken` param stays plumbed but unexposed) |
| Layout churn in data-unified (Browse tree reshuffles) | Resolver never hard-fails on path derivation — index + web fallbacks absorb divergence (code≠path principle) |
| Skipped-file conflicts (user note squatting on a compendium path) confuse users | Post-sync summary Notice + console table listing skipped paths |
| Tombstoned/removed codes (future) | Resolve to web permalink (the site will serve the tombstone page); no plugin work now |

### Non-goals (F2)

- **Live Preview** rendering (program decision #2 — F1 defines the seam; LP lands later).
- **Per-book / per-format selection UI** — v1 ships the full unified md-dse tree only.
- **Locales beyond `en`** — the segment is plumbed, nothing else.
- **Consuming `json`/`yaml` formats in-vault**, embedding the v2 site, or any SCC
  *minting/write-side* tooling.
- **Old-resolver removal** — `@path`/`[[wikilink]]` stay supported indefinitely; scc refs
  are additive.
- **Rendering compendium statblocks without OD-1(A)** — if (A) is rejected, statblock pages
  remain plain markdown and this spec's tracker-reference scope shrinks accordingly (noted,
  not designed for).
