# F2 — Data Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Status / Execution notes (2026-07-16 — read BEFORE your task)

**BUILD COMPLETE 2026-07-17 — PENDING SDK PUBLISH.** Tasks 1-13 + final fix wave landed on
branch `f2` (plugin `dbfef73`); opus whole-branch review: READY-TO-MERGE-PENDING-GATES.
Gates: tsc clean · jest 1292 · shots 64/64 · obsidian-shots 48/48. Remaining: Task 14 only
(swap `file:../data-sdk-npm` → `"3.2.0"` after Scott publishes, live-release sync smoke,
then `just wt-finish f2`). Task record: Linear SC-6. Originally: BUILD STARTED 2026-07-16 in worktree env `f2` (`/home/scott/code/steelCompendium/worktrees/f2`),
under Scott's autonomy window (no live review; self-verify everything). The plan below was
written 2026-07-01 against the pre-D2/D4 tree — **these deltas override the plan's stale
file references wherever they conflict:**

1. **Cross-repo gates are now OPEN** (were "INTEGRATION-GATED / not in scope"):
   - steel-etl emits `ds-sb`/`ds-fb` in md-dse (OD-1, steel-etl `33a84a8`); data-unified
     `f40b10b8` carries them.
   - data-unified publishes release zips (OD-2): **real release `v4.20260717013458`, asset
     `md-dse-unified-en.zip`** (content at zip root, 3,719 entries) — use it for Task 10/14
     integration verification.
   - SDK 3.2.0 is changelog-prepped + test-green on `v3` branch `057140c` but **NOT yet on
     npm** (needs Scott's `just release 3.2.0`). Therefore `<SDK_VERSION>` = the Task 1
     fallback: pin `"steel-compendium-sdk": "file:../data-sdk-npm"` (the worktree's
     submodule copy at `057140c`, run its `npm install && npm run build` first so `dist/`
     exists). Task 14 swaps to `"3.2.0"` once published — landing to main is gated on that.
2. **`StatblockProcessor.ts` no longer exists** (D2 element redesign). The B1 consumers are
   now `src/elements/statblock/view.ts` (with `const sb = model.statblock` at :70):
   `applyRoleTint(card, sb.roles?.join(', '))` (:79), `leftEyebrow: sb.ancestry?.join(', ')
   ?? 'Unknown Ancestry'` (:86), `rightPrimary: sb.roles?.join(', ') ?? 'No Role'` (:89).
   Task 1's `statblockHeaderParts` helper should be created in
   `src/elements/statblock/view.ts` (exported) and the three call sites migrated:
   role tint from `sb.role`, leftEyebrow from `sb.keywords?.join(', ')`, rightPrimary from
   `[sb.organization, sb.role].filter(Boolean).join(' ')` ("Horde Controller" style).
   Mind the plugin's golden-render pins — if `test/dom` statblock goldens encode the old
   eyebrow/primary text, update the goldens deliberately in the same commit and say so.
3. **Settings are D4-era** (`plan-13`): `DSESettings`/`DEFAULT_SETTINGS`/`migrateSettings`
   live in `src/model/Settings.ts` (`compendiumReleaseTag` :4, `compendiumDestinationDirectory`
   :5, `settingsVersion` :10). The tab (`src/views/SettingsTab.ts`, `DseSettingTab`) has a
   two-owner model: pref sections generate from `src/prefs/catalog.ts` descriptors;
   **operational sections are hand-written in `renderOperationalSections` (:198)** — the
   compendium section (currently "Draw Steel Compendium Downloader", :199-243) is what
   Task 11 rewrites in place. New *preferences* (e.g. OD-7 web fallback toggle) may fit the
   descriptor catalog instead — use `prefs` only if it's a render preference; sync settings
   stay operational (`DSESettings`).
4. **F1 seam is live and already reserves scc**: `src/framework/seams/refs.ts` exports
   `ReferenceService`/`RefProvider`/`RefKind` (includes `'scc'`), has `SCC_PREFIX_RE =
   /^scc(\.v\d+)?:/` (:78) and a placeholder scc provider (:7-12, :179). Task 7 replaces
   that placeholder — do NOT invent a parallel seam. Note the comment at :22: legacy
   `ReferenceResolver.ts` stays live for legacy elements (Task 6 still patches it).
5. **Framework wiring**: elements register via `registerFrameworkElementDefinitions` +
   `registerFrameworkElements(this, frameworkV2)` (`main.ts:221-234, :282`);
   `ElementFrameworkV2Services` is the service bundle (`main.ts:64-71`) — the resolver
   service belongs there (`refs` exists; sync service can hang off the plugin instance).
   `main.ts` repo constants at :247-248; download command at :296-300 (`download-data-md-dse`).
6. **Test layout**: `test/unit/**` (node) / `test/dom/**` (jsdom), `npx jest --selectProjects
   unit`; obsidian mock `test/mocks/obsidian.ts`; path aliases in `jest.config.ts`. Suite
   baseline at env start: **1191 passing**. Gates for every task: `npm run tsc` clean +
   full `npx jest` green. Whole-branch gates before landing: `npm run shots` (64) +
   `npm run obsidian-shots` (48) — counts may grow if fixtures are added deliberately.
7. **Env discipline**: all commands `devbox run -- bash -c 'cd draw-steel-elements && …'`
   from the worktree root. Commit per task (conventional commits, no AI attribution).
   Fable session caps can kill you mid-task — commit early, write findings to files, and
   if you inherit a half-done task, check `git log`/`git status` before redoing work.

**Goal:** Move the Draw Steel Elements (DSE) Obsidian plugin off the dead `data-md-dse` repo onto `data-unified` releases with a non-destructive, manifest-driven compendium sync; upgrade `steel-compendium-sdk` from 2.1.5 to the 3.x line (statblock `roles`/`ancestry` → `role`/`organization`/`keywords`); and make `scc.v1:` links resolve everywhere the plugin renders markdown.

**Architecture:** Three new subsystems, each unit-tested against local fixtures cut from the real `data-unified` tree: (1) `src/refs/` — a synchronous `SccResolver` (path derivation → frontmatter index → web fallback → unresolved) plus a pure DOM pass `rewriteSccAnchors` wired into a vault-wide markdown post-processor and into F1's `ReferenceService` as a `RefProvider {kind:"scc"}`; (2) `src/data/` — a `CompendiumSyncService` that diffs a downloaded release zip against a `compendium-manifest.json` and only ever creates/updates/trashes files *it* installed; (3) model-layer SDK 3.x migration with a one-cycle legacy-key shim for homebrew `ds-sb` YAML. Cross-repo prerequisites (SDK 3.2.0 npm release, steel-etl `ds-sb`/`ds-fb` emission, data-unified release assets) are **not** in scope; tasks that can only be verified against them are marked **INTEGRATION-GATED**.

**Tech Stack:** TypeScript (ES2018 output, CJS), Obsidian plugin API (`requestUrl`, `Vault`, `FileManager`, `MetadataCache`), `steel-compendium-sdk` 3.x, JSZip, Jest 30 + ts-jest (harness from Plan 1: `jest.config.ts` with `unit` (node) and `dom` (jsdom) projects, `test/mocks/obsidian.ts`).

## Global Constraints

Every task's requirements implicitly include this section.

- **SDK pinned to the 3.x release** — 3.2.0 per F2 OD-5. Treat the exact version as a parameter set at execution time (referred to below as `<SDK_VERSION>`). If it is not yet published on npm when you execute, pin `"steel-compendium-sdk": "file:../data-sdk-npm"` as a temporary local pin and swap to the exact npm version in Task 14 (INTEGRATION-GATED).
- **Network via `requestUrl`, NOT `fetch`** (and not Obsidian's legacy `request()`; migrate the existing metadata call). Never Node `http`/`https`.
- **Mobile-safe, no Node builtins** in `src/` or `main.ts` (`manifest.json` keeps `isDesktopOnly: false`). Hashing uses `crypto.subtle` (WebCrypto). Node APIs (`fs`, `path`) are allowed **in test files only**.
- **JSZip is already a dependency — no new runtime dependencies.**
- **Never delete user files.** Sync is manifest-driven: only files recorded in the manifest may be updated or removed; removal is always `FileManager.trashFile()` (recoverable), never `vault.delete()`. The "homebrew is never deleted" invariant is an explicit passing test (Task 9).
- **SCC link grammar:** `scc:` ≡ `scc.v1:` (implicit-v1 alias); any other version (`scc.v2:` …) is **refused** — rendered as plain display text, never bound to current content; an optional `#format` fragment is stripped before lookup.
- **DSE version → 6.0.0** (manifest.json, package.json, versions.json, CHANGELOG). The public release itself is gated on the cross-repo prerequisites; the version bump is not.
- **Environment:** node/npm are not on the system PATH. Run every command from the workspace root as `devbox run -- bash -c 'cd draw-steel-elements && <cmd>'`. Work in an isolated worktree (`just wt-new <name>`), never the shared main checkout.
- **Commits:** conventional-commit style inside the `draw-steel-elements` repo. No AI/co-author attribution trailers.
- **Assumed landed:** Plan 1 (test harness: `jest.config.ts`, `test/mocks/obsidian.ts` incl. `TFile`/`TFolder`/`Notice`/`Setting`/`Modal` classes and `parseYaml` via js-yaml, `test/setup/dom-setup.ts`, path-alias `moduleNameMapper`) and Plan 2 (framework core: `src/framework/seams/refs.ts` exporting `ReferenceService`, `RefProvider`, `RefRequest`, `ResolvedRef`, `RefKind` exactly as F1 spec §3.7). Task 1 verifies these assumptions before anything else.

## File Structure

```
draw-steel-elements/
  main.ts                                       MODIFY  repo pointer out; sync command, resolver wiring,
                                                        post-processor registration, settings migration
  manifest.json / package.json / versions.json  MODIFY  version 6.0.0; SDK dep bump
  src/
    data/
      manifest.ts                               NEW     CompendiumManifest type, ManifestStore, sha256Hex
      CompendiumSyncService.ts                  NEW     release fetch + zip read + manifest-diff sync engine
    refs/
      SccResolver.ts                            NEW     normalizeSccTarget, sccToFilePath, SccResolver
      rewriteSccAnchors.ts                      NEW     DOM anchor rewrite + sccPostProcessor factory
      SccRefProvider.ts                         NEW     RefProvider {kind:"scc"} for F1's ReferenceService
    model/
      StatblockConfig.ts                        MODIFY  parse via adapter + OD-4 legacy-key shim
      Settings.ts                               MODIFY  sccWebFallback, compendiumLocale, settingsVersion
    drawSteelAdmonition/statblock/
      StatblockProcessor.ts                     MODIFY  roles/ancestry → role/organization/keywords header
    utils/
      ReferenceResolver.ts                      MODIFY  scc branch + extractFirstDsBlock + better miss error
      CompendiumDownloader.ts                   DELETE  (Task 10)
      JsonSchemaValidator.ts                    MODIFY  one comment (B2 latent Ajv-2019-09 note)
    views/
      SettingsTab.ts                            MODIFY  full UX rework, sentence case, no WIPED-CLEAN
      LegacyCompendiumModal.ts                  NEW     OD-6 one-time first-sync offer
  test/
    fakes/fakeObsidian.ts                       NEW     fakeTFile/fakeTFolder/FakeVault/FakeFileManager/
                                                        FakeAdapter/FakeMetadataCache/makeFakeApp/loadFixture
    fixtures/statblock/goblin-stinker.yaml      NEW     real SDK-3.x DTO YAML (copied from data-unified)
    fixtures/md-dse/…                           NEW     3 real md-dse files (copied from data-unified)
    unit/model/statblockConfig.test.ts          NEW
    unit/model/statblockHeader.test.ts          NEW
    unit/refs/sccCode.test.ts                   NEW
    unit/refs/sccResolver.test.ts               NEW
    unit/utils/referenceResolverScc.test.ts     NEW
    unit/refs/sccRefProvider.test.ts            NEW
    unit/data/manifest.test.ts                  NEW
    unit/data/compendiumSync.test.ts            NEW     ← homebrew-never-deleted invariant lives here
    unit/data/compendiumSyncRelease.test.ts     NEW
    dom/rewriteSccAnchors.test.ts               NEW
    dom/legacyCompendiumModal.test.ts           NEW
    dom/settingsTab.test.ts                     NEW
  .repo-docs/
    integration.md                              MODIFY  dependency map: data-unified, SDK 3.x, asset contract
    decisions/2026-07-01-data-unified-and-scc-resolution.md  NEW  ADR
  CLAUDE.md                                     MODIFY  downloader constraint line
  CHANGELOG.md                                  MODIFY  6.0.0 entry
```

Dependency order: Task 1 → 2 (model layer), Task 3 → 4 → 5 → 6 → 7 (refs layer), Task 8 → 9 → 10 → 11 (data layer + UX), Task 12 (wiring), Task 13 (docs/version), Task 14 (gated verification). Task 3's fixture/fake groundwork is consumed by Tasks 4, 6, 7, 9.

---

### Task 1: Preflight + SDK 3.x pin + StatblockProcessor field rename

The SDK 3.0.0 breaking change B1 removed `Statblock.roles: string[]` and `Statblock.ancestry: string[]` in favor of `role: string`, `organization: string`, `keywords: string[]`. The only consumers are `StatblockProcessor.ts:41` and `:46`. We extract the header-string derivation into a pure, unit-testable function and migrate it.

**Files:**
- Modify: `package.json` (SDK dep)
- Modify: `src/drawSteelAdmonition/statblock/StatblockProcessor.ts:39-48`
- Modify: `src/utils/JsonSchemaValidator.ts` (one comment)
- Create: `test/fixtures/statblock/goblin-stinker.yaml`
- Test: `test/unit/model/statblockHeader.test.ts`

**Interfaces:**
- Consumes: `StatblockConfig.readYaml(text: string): StatblockConfig` (existing), SDK 3.x `Statblock` model (`role: string`, `organization: string`, `keywords: string[]`, `level?: number`, `ev: string`, `name: string`, `features: Feature[]`).
- Produces: `statblockHeaderParts(statblock: Statblock): { title: string; levelRole: string; keywords: string; ev: string }` exported from `StatblockProcessor.ts` — Task 2's tests reuse the golden fixture file created here.

- [ ] **Step 1: Verify the Plan-1/Plan-2 assumptions**

Run:
```bash
devbox run -- bash -c 'cd draw-steel-elements && ls jest.config.* test/mocks/obsidian.ts src/framework/seams/refs.ts && npm test -- --listTests | head'
```
Expected: all three paths exist and jest lists at least one test file. If `src/framework/seams/refs.ts` is missing, Plan 2 has not landed — Tasks 1–6 and 8–13 can still proceed; only Task 7 hard-requires it (re-check there). If the harness is missing, STOP: Plan 1 is a prerequisite.

- [ ] **Step 2: Copy the golden fixture from the real data tree**

The `yaml` format of data-unified is already SDK-3.x DTO-shaped (verified: `role`/`organization`/`keywords`). Copy it verbatim — it is a real pipeline output, not a hand-written approximation:

```bash
mkdir -p draw-steel-elements/test/fixtures/statblock
cp "/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified/yaml/monster/goblin/statblock/goblin-stinker.yaml" \
   draw-steel-elements/test/fixtures/statblock/goblin-stinker.yaml
```

Verify it contains `role: Controller`, `organization: Horde`, and a 2-entry `keywords:` list (`Goblin`, `Humanoid`).

- [ ] **Step 3: Pin the SDK**

In `draw-steel-elements/package.json` devDependencies, change:

```json
    "steel-compendium-sdk": "2.1.5",
```
to (exact-version pin, no caret):
```json
    "steel-compendium-sdk": "<SDK_VERSION>",
```
where `<SDK_VERSION>` is the released 3.x version (expected `3.2.0`). **If not yet on npm**, use `"steel-compendium-sdk": "file:../data-sdk-npm"` instead and record the swap in Task 14. Then:

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm install'
```

- [ ] **Step 4: Write the failing golden-fixture test**

Create `test/unit/model/statblockHeader.test.ts`:

```ts
import * as fs from "fs";
import * as path from "path";
import { StatblockConfig } from "@model/StatblockConfig";
import { statblockHeaderParts } from "@drawSteelAdmonition/statblock/StatblockProcessor";

const fixture = fs.readFileSync(
    path.join(__dirname, "../../fixtures/statblock/goblin-stinker.yaml"), "utf8");

describe("SDK 3.x statblock fields (F2 §2.1 B1)", () => {
    test("golden fixture parses with role/organization/keywords", () => {
        const config = StatblockConfig.readYaml(fixture);
        expect(config.statblock.name).toBe("Goblin Stinker");
        expect(config.statblock.level).toBe(1);
        expect(config.statblock.role).toBe("Controller");
        expect(config.statblock.organization).toBe("Horde");
        expect(config.statblock.keywords).toEqual(["Goblin", "Humanoid"]);
        expect(config.statblock.ev).toBe("3");
        expect(config.statblock.features).toHaveLength(3);
    });

    test("header parts render the 'Horde Controller' style line", () => {
        const config = StatblockConfig.readYaml(fixture);
        const parts = statblockHeaderParts(config.statblock);
        expect(parts.title).toBe("Goblin Stinker");
        expect(parts.levelRole).toBe("Level 1 Horde Controller");
        expect(parts.keywords).toBe("Goblin, Humanoid");
        expect(parts.ev).toBe("EV 3");
    });

    test("header parts degrade gracefully when fields are absent", () => {
        const parts = statblockHeaderParts(
            StatblockConfig.readYaml("name: Nameless Thing").statblock);
        expect(parts.levelRole).toBe("Level N/A No Role");
        expect(parts.keywords).toBe("");
        expect(parts.ev).toBe("EV N/A");
    });
});
```

- [ ] **Step 5: Run the test to verify it fails**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/statblockHeader.test.ts'
```
Expected: FAIL — `statblockHeaderParts` is not exported. (If ts-jest diagnostics are on, it fails at compile with that missing export; the old `roles`/`ancestry` reads in StatblockProcessor also no longer type-check against SDK 3.x.)

- [ ] **Step 6: Implement the rename**

In `src/drawSteelAdmonition/statblock/StatblockProcessor.ts`, add the import of `Statblock`, export the pure function, and rewrite `buildUI` to consume it. Replace lines 39–48 (the `buildUI` header block) with:

```ts
	private buildUI(container: HTMLElement, data: StatblockConfig, ctx: MarkdownPostProcessorContext): void {
		const header = statblockHeaderParts(data.statblock);
		new HeaderView(this.plugin,
			ctx,
			header.title,
			header.levelRole,
			header.keywords,
			header.ev
		).build(container);
```

and add at module level (bottom of the file), plus `import { Statblock } from "steel-compendium-sdk";` at the top:

```ts
/** Pure header-line derivation for the statblock element (SDK 3.x fields).
 *  "Horde Controller" style: organization then role, per the rendered book format. */
export function statblockHeaderParts(statblock: Statblock): {
	title: string; levelRole: string; keywords: string; ev: string;
} {
	const level = statblock.level !== undefined ? `Level ${statblock.level}` : "Level N/A";
	const orgRole = [statblock.organization, statblock.role]
		.filter((part) => typeof part === "string" && part.length > 0)
		.join(" ") || "No Role";
	return {
		title: statblock.name ?? "Unnamed Creature",
		levelRole: `${level} ${orgRole}`,
		keywords: (statblock.keywords ?? []).join(", "),
		ev: statblock.ev !== undefined ? `EV ${statblock.ev}` : "EV N/A",
	};
}
```

The rest of `buildUI` (StatsView, features) is unchanged.

- [ ] **Step 7: Run the test to verify it passes**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/statblockHeader.test.ts'
```
Expected: PASS (3 tests).

- [ ] **Step 8: Type-check sweep (B3 `FeatureDTO.name?` + any stragglers)**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm run tsc'
```
Expected: clean. F2 §2.1 predicts no other `roles`/`ancestry` consumers exist (grep-verified in the spec) and that `EffectView.ts`/feature views already `??`-guard optional names. If the sweep surfaces an unguarded `.name` read off a DTO, add a `?? ""` guard at the read site — do not change the SDK.

- [ ] **Step 9: Add the B2 latent-dependency comment**

In `src/utils/JsonSchemaValidator.ts`, directly above the class/registry declaration, add:

```ts
// NOTE (F2 §2.1 B2): steel-compendium-sdk 3.x schemas moved to JSON Schema draft 2019-09
// (`unevaluatedProperties`). This registry only loads *plugin* schemas today, so our Ajv
// stays draft-07 — but any future validation against SDK schemas must instantiate Ajv
// from "ajv/dist/2019".
```

- [ ] **Step 10: Run the full suite and commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm test && npm run tsc'
git -C draw-steel-elements add package.json package-lock.json src/drawSteelAdmonition/statblock/StatblockProcessor.ts src/utils/JsonSchemaValidator.ts test/fixtures/statblock/goblin-stinker.yaml test/unit/model/statblockHeader.test.ts
git -C draw-steel-elements commit -m "feat!: upgrade steel-compendium-sdk to 3.x; statblock role/organization/keywords"
```

---

### Task 2: OD-4 legacy-key shim for homebrew `ds-sb` YAML

Users' hand-written `ds-sb` blocks may still use `roles:`/`ancestry:`. Per OD-4 these keep parsing for the 6.x cycle with a console deprecation, classified exactly like SDK 3.0's `MarkdownStatblockReader`: entries matching the fixed organization-name set (MINION/HORDE/PLATOON/ELITE/SOLO/LEADER, case-insensitive) become `organization`, the rest become `role`; `ancestry` → `keywords`.

**Files:**
- Modify: `src/model/StatblockConfig.ts` (whole file)
- Test: `test/unit/model/statblockConfig.test.ts`

**Interfaces:**
- Consumes: SDK `Statblock.modelDTOAdapter: (source: Partial<StatblockDTO>) => Statblock`; Obsidian `parseYaml` (js-yaml in tests via the Plan-1 mock).
- Produces: `applyLegacyStatblockKeys(raw: Record<string, any>): Record<string, any>` and unchanged signature `StatblockConfig.readYaml(text: string): StatblockConfig` — everything downstream keeps calling `readYaml`.

- [ ] **Step 1: Write the failing tests**

Create `test/unit/model/statblockConfig.test.ts`:

```ts
import { StatblockConfig, applyLegacyStatblockKeys } from "@model/StatblockConfig";

describe("OD-4 legacy ds-sb key shim", () => {
    let warnSpy: jest.SpyInstance;
    beforeEach(() => { warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {}); });
    afterEach(() => { warnSpy.mockRestore(); });

    test("legacy roles/ancestry still parse, with a deprecation warning", () => {
        const legacyYaml = [
            "name: Old Homebrew Goblin",
            "level: 1",
            "roles:",
            "  - Horde",
            "  - Controller",
            "ancestry:",
            "  - Goblin",
            "  - Humanoid",
            "ev: \"3\"",
        ].join("\n");
        const config = StatblockConfig.readYaml(legacyYaml);
        expect(config.statblock.organization).toBe("Horde");
        expect(config.statblock.role).toBe("Controller");
        expect(config.statblock.keywords).toEqual(["Goblin", "Humanoid"]);
        expect((config.statblock as any).roles).toBeUndefined();
        expect((config.statblock as any).ancestry).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("deprecated"));
    });

    test("classification matches the SDK organization-name set", () => {
        expect(applyLegacyStatblockKeys({ roles: ["Solo"] }))
            .toMatchObject({ organization: "Solo", role: "" });
        expect(applyLegacyStatblockKeys({ roles: ["Ambusher"] }))
            .toMatchObject({ organization: "", role: "Ambusher" });
        expect(applyLegacyStatblockKeys({ roles: ["minion", "Hexer"] }))
            .toMatchObject({ organization: "minion", role: "Hexer" });
    });

    test("modern keys pass through untouched, no warning", () => {
        const modern = { name: "X", role: "Controller", organization: "Horde", keywords: ["Goblin"] };
        expect(applyLegacyStatblockKeys({ ...modern })).toEqual(modern);
        const config = StatblockConfig.readYaml(
            "name: X\nrole: Controller\norganization: Horde\nkeywords:\n  - Goblin");
        expect(config.statblock.role).toBe("Controller");
        expect(warnSpy).not.toHaveBeenCalled();
    });

    test("modern keys win when both are present (legacy key ignored per-axis)", () => {
        const out = applyLegacyStatblockKeys({ role: "Controller", roles: ["Solo"], ancestry: ["Goblin"] });
        expect(out.role).toBe("Controller");
        expect(out.roles).toBeUndefined();
        expect(out.keywords).toEqual(["Goblin"]);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/statblockConfig.test.ts'
```
Expected: FAIL — `applyLegacyStatblockKeys` is not exported.

- [ ] **Step 3: Implement the shim**

Replace the whole of `src/model/StatblockConfig.ts` with:

```ts
import { parseYaml } from "obsidian";
import { Statblock } from "steel-compendium-sdk";

/** SDK 3.0's MarkdownStatblockReader organization-name set (fixed, uppercase). */
const ORGANIZATIONS = new Set(["MINION", "HORDE", "PLATOON", "ELITE", "SOLO", "LEADER"]);

/**
 * OD-4 (F2 §2.1 B1): one-cycle compat shim for pre-6.0.0 homebrew `ds-sb` YAML.
 * `roles: string[]` → `organization` (entries in the organization-name set) + `role`
 * (the rest); `ancestry: string[]` → `keywords`. Modern keys always win per-axis.
 * DEPRECATED — remove in 7.0.0.
 */
export function applyLegacyStatblockKeys(raw: Record<string, any>): Record<string, any> {
    const shimRoles = Array.isArray(raw.roles)
        && raw.role === undefined && raw.organization === undefined;
    const shimAncestry = Array.isArray(raw.ancestry) && raw.keywords === undefined;
    const hasLegacyKeys = raw.roles !== undefined || raw.ancestry !== undefined;
    if (!hasLegacyKeys) return raw;

    const out: Record<string, any> = { ...raw };
    if (shimRoles) {
        const orgs: string[] = [];
        const roles: string[] = [];
        for (const entry of raw.roles as unknown[]) {
            const text = String(entry);
            (ORGANIZATIONS.has(text.toUpperCase()) ? orgs : roles).push(text);
        }
        out.organization = orgs.join(" ");
        out.role = roles.join(" ");
    }
    if (shimAncestry) {
        out.keywords = (raw.ancestry as unknown[]).map(String);
    }
    delete out.roles;
    delete out.ancestry;
    console.warn(
        "Draw Steel Elements: `roles:` / `ancestry:` in ds-sb/ds-statblock blocks are " +
        "deprecated since 6.0.0 — use `role:`, `organization:`, and `keywords:` instead. " +
        "Support will be removed in 7.0.0.");
    return out;
}

export class StatblockConfig {
    statblock: Statblock;

    public constructor(data: Statblock) {
        this.statblock = data;
    }

    public static readYaml(text: string): StatblockConfig {
        // Parse once with Obsidian's YAML (same parser the rest of the plugin uses),
        // shim legacy keys, then feed the SDK's DTO→model adapter directly. This
        // replaces the SDK YamlReader path (which parses with the `yaml` package)
        // so the shim sees the raw object before the DTO is constructed.
        const raw = (parseYaml(text) ?? {}) as Record<string, any>;
        return new StatblockConfig(Statblock.modelDTOAdapter(applyLegacyStatblockKeys(raw)));
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/statblockConfig.test.ts test/unit/model/statblockHeader.test.ts'
```
Expected: PASS — including Task 1's golden test (proves the reader swap didn't regress modern parsing).

- [ ] **Step 5: Full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm test && npm run tsc'
git -C draw-steel-elements add src/model/StatblockConfig.ts test/unit/model/statblockConfig.test.ts
git -C draw-steel-elements commit -m "feat: legacy roles/ancestry shim for homebrew ds-sb blocks (OD-4, deprecated)"
```

---

### Task 3: SCC code utilities + real md-dse fixtures + obsidian fakes

Pure functions first: prefix normalization and the steel-etl path-derivation mirror. Also lay the shared test groundwork (real fixture files, fake vault/app) that Tasks 4, 6, 7, and 9 consume.

**Files:**
- Create: `src/refs/SccResolver.ts` (utilities only in this task; the class arrives in Task 4)
- Create: `test/fakes/fakeObsidian.ts`
- Create: `test/fixtures/md-dse/` (3 real files)
- Test: `test/unit/refs/sccCode.test.ts`

**Interfaces:**
- Consumes: Obsidian mock's `TFile`/`TFolder` classes (for `instanceof`-compatible fakes).
- Produces:
  - `normalizeSccTarget(raw: string): string | null` — bare code, or `null` for non-scc / future-version / empty targets.
  - `sccToFilePath(code: string, ext?: string): string | null` — root-relative path (default ext `.md`).
  - `test/fakes/fakeObsidian.ts` exports: `fakeTFile(path: string): TFile`, `fakeTFolder(path: string): TFolder`, `class FakeVault`, `class FakeFileManager`, `class FakeAdapter`, `class FakeMetadataCache`, `makeFakeApp(): { app: App; vault: FakeVault; metadataCache: FakeMetadataCache; fileManager: FakeFileManager }`, `loadFixtureIntoVault(vault: FakeVault, metadataCache: FakeMetadataCache, fixtureAbsPath: string, vaultPath: string): void`.

- [ ] **Step 1: Copy real md-dse fixtures from the data tree**

These are byte-for-byte real pipeline outputs (frontmatter `scc:` identity, `scc.v1:` body links; growing-ferocity also carries a real ` ```ds-feature ` block):

```bash
cd draw-steel-elements
mkdir -p test/fixtures/md-dse/monster/goblin/statblock test/fixtures/md-dse/feature/fury/level-1 test/fixtures/md-dse/rule/combat
SRC=/home/scott/code/steelCompendium/workspace/data/data-unified/en/unified/md-dse
cp "$SRC/monster/goblin/statblock/goblin-stinker.md" test/fixtures/md-dse/monster/goblin/statblock/
cp "$SRC/feature/fury/level-1/growing-ferocity.md"  test/fixtures/md-dse/feature/fury/level-1/
cp "$SRC/rule/combat/turn.md"                        test/fixtures/md-dse/rule/combat/
grep -l "^scc:" test/fixtures/md-dse/monster/goblin/statblock/goblin-stinker.md test/fixtures/md-dse/feature/fury/level-1/growing-ferocity.md test/fixtures/md-dse/rule/combat/turn.md
```
Expected: all three paths print (each carries frontmatter `scc:`).

- [ ] **Step 2: Write the failing utility tests**

Create `test/unit/refs/sccCode.test.ts`:

```ts
import { normalizeSccTarget, sccToFilePath } from "@/refs/SccResolver";

describe("normalizeSccTarget (spec v1.1 grammar, F2 §4.1)", () => {
    const bare = "mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker";
    test("scc.v1: canonical form", () => {
        expect(normalizeSccTarget(`scc.v1:${bare}`)).toBe(bare);
    });
    test("bare scc: is the permanent implicit-v1 alias", () => {
        expect(normalizeSccTarget(`scc:${bare}`)).toBe(bare);
    });
    test("#format fragment is stripped before lookup", () => {
        expect(normalizeSccTarget(`scc.v1:${bare}#json`)).toBe(bare);
    });
    test("future scheme versions are refused — never bind to current content", () => {
        expect(normalizeSccTarget(`scc.v2:${bare}`)).toBeNull();
        expect(normalizeSccTarget(`scc.v99:${bare}`)).toBeNull();
    });
    test("non-scc strings and empty codes are refused", () => {
        expect(normalizeSccTarget("https://example.com")).toBeNull();
        expect(normalizeSccTarget("@Creatures/Goblin")).toBeNull();
        expect(normalizeSccTarget("scc:")).toBeNull();
        expect(normalizeSccTarget("scc.v1:#json")).toBeNull();
    });
    test("surrounding whitespace tolerated", () => {
        expect(normalizeSccTarget(`  scc:${bare}  `)).toBe(bare);
    });
});

describe("sccToFilePath (mirror of steel-etl generator.go SCCToFilePath)", () => {
    test("drops the source segment and expands dots", () => {
        expect(sccToFilePath("mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker"))
            .toBe("monster/goblin/statblock/goblin-stinker.md");
        expect(sccToFilePath("mcdm.heroes.v1/rule.combat/turn"))
            .toBe("rule/combat/turn.md");
        expect(sccToFilePath("mcdm.heroes.v1/feature.fury.level-1/growing-ferocity"))
            .toBe("feature/fury/level-1/growing-ferocity.md");
    });
    test("custom extension", () => {
        expect(sccToFilePath("mcdm.heroes.v1/class/shadow", ".yaml")).toBe("class/shadow.yaml");
    });
    test("degenerate codes return null", () => {
        expect(sccToFilePath("no-slashes")).toBeNull();
        expect(sccToFilePath("")).toBeNull();
    });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/refs/sccCode.test.ts'
```
Expected: FAIL — module `src/refs/SccResolver.ts` does not exist.

- [ ] **Step 4: Implement the utilities**

Create `src/refs/SccResolver.ts`:

```ts
import { App, Plugin, TAbstractFile, TFile, normalizePath } from "obsidian";
import { DSESettings } from "@model/Settings";

/** F2 §4.2 — result of resolving one SCC reference. */
export type SccResolution =
    | { kind: "vault"; file: TFile; linkpath: string }
    | { kind: "web"; url: string }
    | { kind: "unresolved"; code: string };

/**
 * Strip the `scc:`/`scc.v1:` prefix and any `#format` fragment (F2 §4.1).
 * Returns the bare code ("source/type/item"), or null when the target is not an
 * SCC reference this plugin may resolve — including any future `scc.vN:` version,
 * which must NEVER silently bind to current content (spec v1.1 mandate).
 */
export function normalizeSccTarget(raw: string): string | null {
    const match = /^scc(?:\.v(\d+))?:(.*)$/s.exec(raw.trim());
    if (!match) return null;
    if (match[1] !== undefined && match[1] !== "1") return null;
    const code = match[2].split("#")[0].trim();
    return code.length > 0 ? code : null;
}

/**
 * Mirror of steel-etl `internal/output/generator.go:SCCToFilePath`: drop the source
 * segment (first slash-separated part), expand dots to path separators in the rest,
 * append the extension. The unified Browse tree guarantees path ≡ this derivation.
 */
export function sccToFilePath(code: string, ext = ".md"): string | null {
    const parts = code.split("/");
    if (parts.length < 2) return null;
    const pathParts: string[] = [];
    for (const part of parts.slice(1)) {
        for (const segment of part.split(".")) pathParts.push(segment);
    }
    if (pathParts.length === 0) return null;
    return pathParts.join("/") + ext;
}

// (SccResolver class added in the next task — Task 4.)
```

(The `App`/`Plugin`/`TAbstractFile`/`normalizePath`/`DSESettings` imports are used by Task 4's class; if your lint config rejects unused imports mid-task, add them in Task 4 instead.)

- [ ] **Step 5: Run to verify pass**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/refs/sccCode.test.ts'
```
Expected: PASS.

- [ ] **Step 6: Build the shared obsidian fakes**

Create `test/fakes/fakeObsidian.ts`. These are deliberately self-contained (they do not depend on the internals of Plan 1's vault fake, only on the mock's `TFile`/`TFolder` classes so `instanceof` checks in production code hold). If Plan 1's mock already exports an equivalent richer fake, you may delegate to it — but keep these exported names stable, all refs/data tests import from here.

```ts
import * as fs from "fs";
import { App, TFile, TFolder } from "obsidian";
import * as yaml from "js-yaml";

/** instanceof-compatible TFile without knowing the mock's constructor signature. */
export function fakeTFile(path: string): TFile {
    const file = Object.create(TFile.prototype) as TFile;
    const name = path.split("/").pop() ?? path;
    const dot = name.lastIndexOf(".");
    Object.assign(file, {
        path,
        name,
        basename: dot > 0 ? name.slice(0, dot) : name,
        extension: dot > 0 ? name.slice(dot + 1) : "",
    });
    return file;
}

export function fakeTFolder(path: string): TFolder {
    const folder = Object.create(TFolder.prototype) as TFolder;
    Object.assign(folder, { path, name: path.split("/").pop() ?? path, children: [] });
    return folder;
}

/** Adapter over a Map — enough for ManifestStore (exists/read/write/remove/rename). */
export class FakeAdapter {
    store = new Map<string, string>();
    async exists(path: string): Promise<boolean> { return this.store.has(path); }
    async read(path: string): Promise<string> {
        const value = this.store.get(path);
        if (value === undefined) throw new Error(`ENOENT: ${path}`);
        return value;
    }
    async write(path: string, data: string): Promise<void> { this.store.set(path, data); }
    async remove(path: string): Promise<void> { this.store.delete(path); }
    async rename(from: string, to: string): Promise<void> {
        const value = this.store.get(from);
        if (value === undefined) throw new Error(`ENOENT: ${from}`);
        if (this.store.has(to)) throw new Error(`EEXIST: ${to}`);
        this.store.set(to, value);
        this.store.delete(from);
    }
}

/** In-memory vault: binary-content Map + implicit folders. */
export class FakeVault {
    files = new Map<string, Uint8Array>();
    folders = new Set<string>();
    configDir = ".obsidian";
    adapter = new FakeAdapter();

    getAbstractFileByPath(path: string): TFile | TFolder | null {
        if (this.files.has(path)) return fakeTFile(path);
        if (this.folders.has(path)) return fakeTFolder(path);
        return null;
    }
    getMarkdownFiles(): TFile[] {
        return [...this.files.keys()].filter((p) => p.endsWith(".md")).map(fakeTFile);
    }
    async read(file: TFile): Promise<string> {
        return new TextDecoder().decode(await this.bytes(file.path));
    }
    async readBinary(file: TFile): Promise<ArrayBuffer> {
        const bytes = await this.bytes(file.path);
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }
    async createBinary(path: string, data: ArrayBuffer): Promise<TFile> {
        if (this.files.has(path)) throw new Error(`File already exists: ${path}`);
        this.files.set(path, new Uint8Array(data));
        this.ensureParents(path);
        return fakeTFile(path);
    }
    async modifyBinary(file: TFile, data: ArrayBuffer): Promise<void> {
        if (!this.files.has(file.path)) throw new Error(`ENOENT: ${file.path}`);
        this.files.set(file.path, new Uint8Array(data));
    }
    async createFolder(path: string): Promise<void> {
        if (this.folders.has(path)) throw new Error(`Folder already exists: ${path}`);
        this.folders.add(path);
    }
    /** Test seeding helper. */
    setText(path: string, text: string): void {
        this.files.set(path, new TextEncoder().encode(text));
        this.ensureParents(path);
    }
    text(path: string): string | undefined {
        const bytes = this.files.get(path);
        return bytes === undefined ? undefined : new TextDecoder().decode(bytes);
    }
    private ensureParents(path: string): void {
        const parts = path.split("/").slice(0, -1);
        let current = "";
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            this.folders.add(current);
        }
    }
    private async bytes(path: string): Promise<Uint8Array> {
        const bytes = this.files.get(path);
        if (bytes === undefined) throw new Error(`ENOENT: ${path}`);
        return bytes;
    }
    on(): any { return { unsubscribe: () => {} }; } // EventRef stub
}

export class FakeFileManager {
    trashed: string[] = [];
    constructor(private vault: FakeVault) {}
    async trashFile(file: TFile | TFolder): Promise<void> {
        this.trashed.push(file.path);
        if (file instanceof TFolder) {
            for (const path of [...this.vault.files.keys()]) {
                if (path.startsWith(file.path + "/")) this.vault.files.delete(path);
            }
            this.vault.folders.delete(file.path);
        } else {
            this.vault.files.delete(file.path);
        }
    }
}

export class FakeMetadataCache {
    frontmatter = new Map<string, Record<string, any>>();
    getFileCache(file: TFile): { frontmatter?: Record<string, any> } | null {
        const fm = this.frontmatter.get(file.path);
        return fm === undefined ? null : { frontmatter: fm };
    }
    getFirstLinkpathDest(): TFile | null { return null; }
    on(): any { return { unsubscribe: () => {} }; } // EventRef stub
}

export function makeFakeApp(): {
    app: App; vault: FakeVault; metadataCache: FakeMetadataCache; fileManager: FakeFileManager;
} {
    const vault = new FakeVault();
    const metadataCache = new FakeMetadataCache();
    const fileManager = new FakeFileManager(vault);
    const app = { vault, metadataCache, fileManager } as unknown as App;
    return { app, vault, metadataCache, fileManager };
}

/** Load a real fixture file from disk into the fake vault + metadata cache,
 *  parsing its YAML frontmatter the way Obsidian would. */
export function loadFixtureIntoVault(
    vault: FakeVault, metadataCache: FakeMetadataCache,
    fixtureAbsPath: string, vaultPath: string,
): void {
    const content = fs.readFileSync(fixtureAbsPath, "utf8");
    vault.setText(vaultPath, content);
    const match = /^---\n([\s\S]*?)\n---/.exec(content);
    if (match) {
        metadataCache.frontmatter.set(vaultPath, yaml.load(match[1]) as Record<string, any>);
    }
}
```

(`js-yaml` is a devDependency per Plan 1 / F3 OD-8. If it is somehow absent: `devbox run -- bash -c 'cd draw-steel-elements && npm i -D js-yaml @types/js-yaml'`.)

- [ ] **Step 7: Type-check + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm run tsc && npm test'
git -C draw-steel-elements add src/refs/SccResolver.ts test/fakes/fakeObsidian.ts test/fixtures/md-dse test/unit/refs/sccCode.test.ts
git -C draw-steel-elements commit -m "feat: scc code normalization + steel-etl path-derivation mirror; test fakes + real md-dse fixtures"
```

---

### Task 4: `SccResolver` — resolution order against real fixtures

The injectable, synchronous resolver: (1) path derivation under the managed root, (2) lazily seeded frontmatter-`scc` index (code-vs-path principle: codes are forever, paths move), (3) web permalink behind a settings toggle, (4) unresolved. Adds the `sccWebFallback` setting.

**Files:**
- Modify: `src/refs/SccResolver.ts` (add the class)
- Modify: `src/model/Settings.ts`
- Test: `test/unit/refs/sccResolver.test.ts`

**Interfaces:**
- Consumes: `normalizeSccTarget`, `sccToFilePath` (Task 3); `DSESettings.compendiumDestinationDirectory` (existing) and new `DSESettings.sccWebFallback: boolean`.
- Produces: `class SccResolver { constructor(app: App, settings: DSESettings); resolve(rawTarget: string): SccResolution; registerWatchers(plugin: Plugin): void; handleChanged(file: TFile): void; handleRename(file: TAbstractFile, oldPath: string): void; handleDelete(file: TAbstractFile): void; }`. Tasks 5–7 and 12 consume `resolve`; Task 12 consumes `registerWatchers`.

- [ ] **Step 1: Add the settings field**

In `src/model/Settings.ts`, add to the interface and defaults (leave existing fields untouched):

```ts
export interface DSESettings {
	compendiumReleaseTag?: string; // Optional: if not set, fetch the latest release
	compendiumDestinationDirectory: string;
	defaultImagePath: string;
	/** OD-7: when an SCC code is not in the vault, link to steelcompendium.io (click-time only). */
	sccWebFallback: boolean;
}

export const DEFAULT_SETTINGS: DSESettings = {
	compendiumReleaseTag: '',
	compendiumDestinationDirectory: 'DS Compendium',
	defaultImagePath: 'Media/token_1.png',
	sccWebFallback: true,
};
```

- [ ] **Step 2: Write the failing tests**

Create `test/unit/refs/sccResolver.test.ts`:

```ts
import * as path from "path";
import { SccResolver } from "@/refs/SccResolver";
import { DEFAULT_SETTINGS, DSESettings } from "@model/Settings";
import { makeFakeApp, loadFixtureIntoVault, fakeTFile } from "../../fakes/fakeObsidian";

const FIXTURES = path.join(__dirname, "../../fixtures/md-dse");
const GOBLIN_CODE = "mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker";
const TURN_CODE = "mcdm.heroes.v1/rule.combat/turn";

function setup(settingsOverride: Partial<DSESettings> = {}) {
    const { app, vault, metadataCache } = makeFakeApp();
    const settings: DSESettings = { ...DEFAULT_SETTINGS, ...settingsOverride };
    loadFixtureIntoVault(vault, metadataCache,
        path.join(FIXTURES, "monster/goblin/statblock/goblin-stinker.md"),
        "DS Compendium/monster/goblin/statblock/goblin-stinker.md");
    loadFixtureIntoVault(vault, metadataCache,
        path.join(FIXTURES, "rule/combat/turn.md"),
        "DS Compendium/rule/combat/turn.md");
    return { app, vault, metadataCache, settings, resolver: new SccResolver(app, settings) };
}

describe("SccResolver resolution order (F2 §4.2)", () => {
    test("1. path derivation: freshly synced compendium resolves O(1)", () => {
        const { resolver } = setup();
        const result = resolver.resolve(`scc.v1:${GOBLIN_CODE}`);
        expect(result).toEqual({
            kind: "vault",
            file: expect.objectContaining({ path: "DS Compendium/monster/goblin/statblock/goblin-stinker.md" }),
            linkpath: "DS Compendium/monster/goblin/statblock/goblin-stinker.md",
        });
    });

    test("bare scc: prefix and #format fragment behave identically", () => {
        const { resolver } = setup();
        expect(resolver.resolve(`scc:${TURN_CODE}`).kind).toBe("vault");
        expect(resolver.resolve(`scc.v1:${TURN_CODE}#json`).kind).toBe("vault");
    });

    test("2. frontmatter index: a moved compendium file still resolves by code", () => {
        const { app, vault, metadataCache, settings } = setup();
        // Simulate the user moving the note out of the derived location.
        const content = vault.text("DS Compendium/rule/combat/turn.md")!;
        vault.files.delete("DS Compendium/rule/combat/turn.md");
        vault.setText("My Notes/moved-turn.md", content);
        metadataCache.frontmatter.delete("DS Compendium/rule/combat/turn.md");
        metadataCache.frontmatter.set("My Notes/moved-turn.md", { scc: TURN_CODE });
        const resolver = new SccResolver(app, settings);
        const result = resolver.resolve(`scc.v1:${TURN_CODE}`);
        expect(result.kind).toBe("vault");
        expect((result as any).linkpath).toBe("My Notes/moved-turn.md");
    });

    test("index also catches homebrew declaring an scc identity", () => {
        const { app, vault, metadataCache, settings } = setup();
        vault.setText("Homebrew/my-goblin.md", "---\nscc: homebrew.mine.v1/monster/my-goblin\n---\nhi");
        metadataCache.frontmatter.set("Homebrew/my-goblin.md", { scc: "homebrew.mine.v1/monster/my-goblin" });
        const resolver = new SccResolver(app, settings);
        expect(resolver.resolve("scc:homebrew.mine.v1/monster/my-goblin").kind).toBe("vault");
    });

    test("3. web fallback when code is locally missing (toggle on, default)", () => {
        const { resolver } = setup();
        expect(resolver.resolve("scc.v1:mcdm.heroes.v1/class/shadow")).toEqual({
            kind: "web",
            url: "https://steelcompendium.io/scc/mcdm.heroes.v1/class/shadow/",
        });
    });

    test("4. unresolved when web fallback is off", () => {
        const { resolver } = setup({ sccWebFallback: false });
        expect(resolver.resolve("scc.v1:mcdm.heroes.v1/class/shadow")).toEqual({
            kind: "unresolved", code: "mcdm.heroes.v1/class/shadow",
        });
    });

    test("future scheme version is unresolved even when the item exists locally", () => {
        const { resolver } = setup();
        expect(resolver.resolve(`scc.v2:${GOBLIN_CODE}`).kind).toBe("unresolved");
    });

    test("index maintenance: delete + rename handlers keep codes resolving", () => {
        const { app, vault, metadataCache, settings } = setup();
        const resolver = new SccResolver(app, settings);
        // Seed the index (first miss-path resolve touches it).
        resolver.resolve("scc:not.a.real.v1/thing/x");
        // Rename: move the goblin file, update the cache, notify the resolver.
        const oldPath = "DS Compendium/monster/goblin/statblock/goblin-stinker.md";
        const newPath = "Elsewhere/goblin.md";
        const content = vault.text(oldPath)!;
        vault.files.delete(oldPath);
        vault.setText(newPath, content);
        const fm = metadataCache.frontmatter.get(oldPath)!;
        metadataCache.frontmatter.delete(oldPath);
        metadataCache.frontmatter.set(newPath, fm);
        resolver.handleRename(fakeTFile(newPath), oldPath);
        const result = resolver.resolve(`scc.v1:${GOBLIN_CODE}`);
        expect(result.kind).toBe("vault");
        expect((result as any).linkpath).toBe(newPath);
        // Delete: notify, and the code now falls through to web.
        vault.files.delete(newPath);
        metadataCache.frontmatter.delete(newPath);
        resolver.handleDelete(fakeTFile(newPath));
        expect(resolver.resolve(`scc.v1:${GOBLIN_CODE}`).kind).toBe("web");
    });
});
```

- [ ] **Step 3: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/refs/sccResolver.test.ts'
```
Expected: FAIL — `SccResolver` is not exported.

- [ ] **Step 4: Implement the class**

Append to `src/refs/SccResolver.ts` (below the utilities from Task 3):

```ts
/**
 * F2 §4.2 — SCC reference resolution. Synchronous by design so the DOM pass and
 * F1's pipeline can call it mid-render; the frontmatter index seeds lazily on the
 * first resolve that needs it and is maintained incrementally via registerWatchers.
 */
export class SccResolver {
    /** bare code → vault path. null = not yet seeded. */
    private index: Map<string, string> | null = null;

    constructor(private app: App, private settings: DSESettings) {}

    public resolve(rawTarget: string): SccResolution {
        const code = normalizeSccTarget(rawTarget);
        if (code === null) return { kind: "unresolved", code: rawTarget.trim() };

        // 1. Path derivation against the managed root (covers a fresh sync, O(1)).
        const relative = sccToFilePath(code);
        if (relative !== null) {
            const derived = normalizePath(
                `${this.settings.compendiumDestinationDirectory}/${relative}`);
            const file = this.app.vault.getAbstractFileByPath(derived);
            if (file instanceof TFile) return { kind: "vault", file, linkpath: file.path };
        }

        // 2. Frontmatter-`scc` index (codes are forever; paths are not).
        const indexed = this.lookupIndex(code);
        if (indexed !== null) return { kind: "vault", file: indexed, linkpath: indexed.path };

        // 3. Web permalink — the spec's permanent redirect stub (OD-7, click-time only).
        if (this.settings.sccWebFallback) {
            return { kind: "web", url: `https://steelcompendium.io/scc/${code}/` };
        }

        // 4. Unresolved — caller renders display text as plain text.
        return { kind: "unresolved", code };
    }

    /** Wire incremental index maintenance to vault/metadata events (plugin lifetime). */
    public registerWatchers(plugin: Plugin): void {
        plugin.registerEvent(this.app.metadataCache.on("changed",
            (file: TFile) => this.handleChanged(file)));
        plugin.registerEvent(this.app.vault.on("rename",
            (file: TAbstractFile, oldPath: string) => this.handleRename(file, oldPath)));
        plugin.registerEvent(this.app.vault.on("delete",
            (file: TAbstractFile) => this.handleDelete(file)));
    }

    public handleChanged(file: TFile): void {
        if (this.index === null) return;
        this.removePath(file.path);
        this.indexFile(file);
    }

    public handleRename(file: TAbstractFile, oldPath: string): void {
        if (this.index === null) return;
        this.removePath(oldPath);
        if (file instanceof TFile) this.indexFile(file);
    }

    public handleDelete(file: TAbstractFile): void {
        if (this.index === null) return;
        this.removePath(file.path);
    }

    private lookupIndex(code: string): TFile | null {
        if (this.index === null) this.seedIndex();
        const indexedPath = this.index!.get(code);
        if (indexedPath === undefined) return null;
        const file = this.app.vault.getAbstractFileByPath(indexedPath);
        return file instanceof TFile ? file : null;
    }

    private seedIndex(): void {
        this.index = new Map();
        for (const file of this.app.vault.getMarkdownFiles()) this.indexFile(file);
    }

    private indexFile(file: TFile): void {
        const scc = this.app.metadataCache.getFileCache(file)?.frontmatter?.scc;
        if (typeof scc === "string" && scc.length > 0) this.index!.set(scc, file.path);
    }

    private removePath(path: string): void {
        for (const [code, indexedPath] of this.index!) {
            if (indexedPath === path) this.index!.delete(code);
        }
    }
}
```

- [ ] **Step 5: Run to verify pass, then full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/refs/sccResolver.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/refs/SccResolver.ts src/model/Settings.ts test/unit/refs/sccResolver.test.ts
git -C draw-steel-elements commit -m "feat: SccResolver — path derivation, frontmatter index, web fallback (F2 §4.2)"
```

---

### Task 5: `rewriteSccAnchors` DOM pass + post-processor factory

Pure DOM function (F2 §4.3a): rewrite every `a[href^="scc"]` per its resolution — vault → native internal link (hover preview + click handling for free), web → external anchor with `.ds-scc-web`, unresolved → `.ds-scc-unresolved` span. Plus the vault-wide post-processor factory with the `querySelector` early-exit (registered in Task 12).

**Files:**
- Create: `src/refs/rewriteSccAnchors.ts`
- Test: `test/dom/rewriteSccAnchors.test.ts` (jsdom project)

**Interfaces:**
- Consumes: `SccResolution` type (Task 3); anything with `resolve(rawTarget: string): SccResolution` (structural `SccAnchorResolver` — tests pass a stub, production passes `SccResolver`).
- Produces: `rewriteSccAnchors(root: HTMLElement, resolver: SccAnchorResolver): void` (the F1 §4.4 seam contract function) and `sccPostProcessor(resolver: SccAnchorResolver): (el: HTMLElement) => void`.

- [ ] **Step 1: Write the failing tests**

Create `test/dom/rewriteSccAnchors.test.ts`:

```ts
/** @jest-environment jsdom */
import { rewriteSccAnchors, sccPostProcessor, SccAnchorResolver } from "@/refs/rewriteSccAnchors";
import { SccResolution } from "@/refs/SccResolver";
import { fakeTFile } from "../fakes/fakeObsidian";

function stubResolver(map: Record<string, SccResolution>): SccAnchorResolver {
    return { resolve: jest.fn((raw: string) =>
        map[raw] ?? { kind: "unresolved", code: raw }) };
}

const VAULT_HREF = "scc.v1:mcdm.heroes.v1/rule.combat/turn";
const WEB_HREF = "scc.v1:mcdm.heroes.v1/class/shadow";
const V2_HREF = "scc.v2:mcdm.heroes.v1/rule.combat/turn";

function container(html: string): HTMLElement {
    const el = document.createElement("div");
    el.innerHTML = html;
    return el;
}

describe("rewriteSccAnchors (F2 §4.3a)", () => {
    const resolver = stubResolver({
        [VAULT_HREF]: {
            kind: "vault",
            file: fakeTFile("DS Compendium/rule/combat/turn.md"),
            linkpath: "DS Compendium/rule/combat/turn.md",
        },
        [WEB_HREF]: { kind: "web", url: "https://steelcompendium.io/scc/mcdm.heroes.v1/class/shadow/" },
    });

    test("vault resolution becomes a native internal link", () => {
        const el = container(`<p><a href="${VAULT_HREF}">turn</a></p>`);
        rewriteSccAnchors(el, resolver);
        const anchor = el.querySelector("a")!;
        expect(anchor.classList.contains("internal-link")).toBe(true);
        expect(anchor.getAttribute("data-href")).toBe("DS Compendium/rule/combat/turn.md");
        expect(anchor.getAttribute("href")).toBe("DS Compendium/rule/combat/turn.md");
        expect(anchor.textContent).toBe("turn");
    });

    test("web resolution becomes an external steelcompendium.io anchor", () => {
        const el = container(`<p><a href="${WEB_HREF}">Shadow</a></p>`);
        rewriteSccAnchors(el, resolver);
        const anchor = el.querySelector("a")!;
        expect(anchor.classList.contains("ds-scc-web")).toBe(true);
        expect(anchor.getAttribute("href"))
            .toBe("https://steelcompendium.io/scc/mcdm.heroes.v1/class/shadow/");
        expect(anchor.getAttribute("rel")).toBe("noopener");
    });

    test("unresolved (incl. scc.v2:) unwraps to a styled span with tooltip", () => {
        const el = container(`<p><a href="${V2_HREF}">turn</a></p>`);
        rewriteSccAnchors(el, resolver);
        expect(el.querySelector("a")).toBeNull();
        const span = el.querySelector("span.ds-scc-unresolved")!;
        expect(span.textContent).toBe("turn");
        expect(span.getAttribute("title")).toBe("Unknown SCC code");
    });

    test("non-scc anchors are untouched", () => {
        const el = container(`<p><a href="https://example.com">x</a><a href="sccschemes.md">y</a></p>`);
        rewriteSccAnchors(el, resolver);
        expect(el.querySelectorAll("a")).toHaveLength(2);
        expect((resolver.resolve as jest.Mock)).not.toHaveBeenCalled();
    });

    test("rewrites multiple anchors in one pass", () => {
        const el = container(
            `<p><a href="${VAULT_HREF}">a</a> and <a href="${WEB_HREF}">b</a></p>`);
        rewriteSccAnchors(el, resolver);
        expect(el.querySelectorAll("a.internal-link")).toHaveLength(1);
        expect(el.querySelectorAll("a.ds-scc-web")).toHaveLength(1);
    });
});

describe("sccPostProcessor early exit (F2 §4.3b cost control)", () => {
    test("elements without scc anchors never touch the resolver", () => {
        const resolver = stubResolver({});
        const process = sccPostProcessor(resolver);
        process(container(`<p><a href="https://example.com">x</a> plain text</p>`));
        expect(resolver.resolve as jest.Mock).not.toHaveBeenCalled();
    });

    test("elements with scc anchors are rewritten", () => {
        const resolver = stubResolver({});
        const process = sccPostProcessor(resolver);
        const el = container(`<p><a href="scc:x.v1/rule/y">y</a></p>`);
        process(el);
        expect(el.querySelector("span.ds-scc-unresolved")).not.toBeNull();
    });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/rewriteSccAnchors.test.ts'
```
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

Create `src/refs/rewriteSccAnchors.ts`:

```ts
import { SccResolution } from "./SccResolver";

/** Structural seam so F1's pipeline and tests can pass any resolver (F2 §4.4). */
export interface SccAnchorResolver {
    resolve(rawTarget: string): SccResolution;
}

const SCC_PREFIX = /^scc(\.v\d+)?:/;

/**
 * F2 §4.3(a) — post-render DOM pass. Obsidian's MarkdownRenderer emits `scc.v1:` hrefs
 * as inert external anchors; rewrite each according to its resolution:
 *  - vault      → native internal link (Obsidian click handling + hover preview)
 *  - web        → https://steelcompendium.io/scc/{code}/ external anchor (.ds-scc-web)
 *  - unresolved → plain-text span (.ds-scc-unresolved, tooltip)
 */
export function rewriteSccAnchors(root: HTMLElement, resolver: SccAnchorResolver): void {
    const anchors = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="scc"]'));
    for (const anchor of anchors) {
        const href = anchor.getAttribute("href");
        if (href === null || !SCC_PREFIX.test(href)) continue; // e.g. href="sccschemes.md"
        const resolution = resolver.resolve(href);
        if (resolution.kind === "vault") {
            anchor.classList.remove("external-link");
            anchor.classList.add("internal-link");
            anchor.setAttribute("href", resolution.linkpath);
            anchor.setAttribute("data-href", resolution.linkpath);
            anchor.setAttribute("rel", "noopener");
            anchor.removeAttribute("target");
        } else if (resolution.kind === "web") {
            anchor.classList.add("ds-scc-web");
            anchor.setAttribute("href", resolution.url);
            anchor.setAttribute("rel", "noopener");
            anchor.setAttribute("target", "_blank");
        } else {
            const span = anchor.ownerDocument.createElement("span");
            span.className = "ds-scc-unresolved";
            span.setAttribute("title", "Unknown SCC code");
            span.textContent = anchor.textContent ?? "";
            anchor.replaceWith(span);
        }
    }
}

/**
 * F2 §4.3(b) — vault-wide reading-mode post-processor body. First line is the
 * cost-control early exit: near-zero for the overwhelming majority of renders.
 * Registered in main.ts (Task 12); F1's pipeline may lift this without change.
 */
export function sccPostProcessor(resolver: SccAnchorResolver): (el: HTMLElement) => void {
    return (el: HTMLElement) => {
        if (!el.querySelector('a[href^="scc"]')) return;
        rewriteSccAnchors(el, resolver);
    };
}
```

- [ ] **Step 4: Run to verify pass, full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/rewriteSccAnchors.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/refs/rewriteSccAnchors.ts test/dom/rewriteSccAnchors.test.ts
git -C draw-steel-elements commit -m "feat: scc anchor rewrite DOM pass + vault-wide post-processor factory"
```

---

### Task 6: `ReferenceResolver` scc branch (initiative-tracker references)

F2 §4.3(c): a reference string starting `scc:`/`scc.v1:` (e.g. initiative tracker `statblock: scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker`) resolves via `SccResolver` to a `TFile`, then reuses the existing "extract first `ds-*` block" step. `@path`/`[[wikilink]]` behavior is retained verbatim. Improved miss error names the file and its frontmatter `type`.

Note: real md-dse statblock files carry **no `ds-sb` block until OD-1(A) lands in steel-etl** — the happy-path fixture below is hand-cut in the post-OD-1 shape (frontmatter + `ds-sb` block); the shape is pinned by F2 §3.3(A). End-to-end verification against real data is Task 14 (INTEGRATION-GATED).

**Files:**
- Modify: `src/utils/ReferenceResolver.ts`
- Test: `test/unit/utils/referenceResolverScc.test.ts`

**Interfaces:**
- Consumes: `SccResolver` (Task 4).
- Produces: `extractFirstDsBlock(app: App, file: TFile): Promise<any>` (module-level export — Task 7's provider reuses it); `ReferenceResolver` constructor gains an optional third parameter `sccResolver: SccResolver = new SccResolver(app, settings)` so the existing call site (`EncounterData.ts:92`, `new ReferenceResolver(app, settings)`) keeps compiling unchanged.

- [ ] **Step 1: Write the failing tests**

Create `test/unit/utils/referenceResolverScc.test.ts`:

```ts
import * as path from "path";
import { ReferenceResolver } from "@utils/ReferenceResolver";
import { DEFAULT_SETTINGS } from "@model/Settings";
import { makeFakeApp, loadFixtureIntoVault } from "../../fakes/fakeObsidian";

const FIXTURES = path.join(__dirname, "../../fixtures/md-dse");
const GOBLIN_CODE = "mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker";

/** Post-OD-1(A) md-dse statblock shape: frontmatter + ds-sb block (F2 §3.3). */
const DS_SB_FILE = `---
scc: ${GOBLIN_CODE}
type: statblock
---

\`\`\`ds-sb
name: Goblin Stinker
level: 1
role: Controller
organization: Horde
keywords:
  - Goblin
  - Humanoid
ev: "3"
\`\`\`
`;

function setup() {
    const { app, vault, metadataCache } = makeFakeApp();
    const settings = { ...DEFAULT_SETTINGS };
    return { app, vault, metadataCache, settings, resolver: new ReferenceResolver(app, settings) };
}

describe("ReferenceResolver scc branch (F2 §4.3c)", () => {
    test("scc.v1: reference resolves to the file's ds-* block YAML", async () => {
        const { vault, metadataCache, resolver } = setup();
        vault.setText("DS Compendium/monster/goblin/statblock/goblin-stinker.md", DS_SB_FILE);
        metadataCache.frontmatter.set(
            "DS Compendium/monster/goblin/statblock/goblin-stinker.md",
            { scc: GOBLIN_CODE, type: "statblock" });
        const data = await resolveString(resolver, `scc.v1:${GOBLIN_CODE}`);
        expect(data.name).toBe("Goblin Stinker");
        expect(data.role).toBe("Controller");
        expect(data.organization).toBe("Horde");
    });

    test("bare scc: prefix works identically", async () => {
        const { vault, resolver } = setup();
        vault.setText("DS Compendium/monster/goblin/statblock/goblin-stinker.md", DS_SB_FILE);
        const data = await resolveString(resolver, `scc:${GOBLIN_CODE}`);
        expect(data.name).toBe("Goblin Stinker");
    });

    test("scc miss throws an actionable error (not the legacy wall of text)", async () => {
        const { resolver } = setup();
        await expect(resolveString(resolver, "scc.v1:mcdm.monsters.v1/monster/nope"))
            .rejects.toThrow(/SCC reference .* could not be resolved .* Sync the compendium/s);
    });

    test("target file without a ds-* block names the file and its frontmatter type", async () => {
        const { vault, metadataCache, resolver } = setup();
        // Real, current-shape md-dse statblock file: plain rendered markdown, no ds-sb.
        loadFixtureIntoVault(vault, metadataCache,
            path.join(FIXTURES, "monster/goblin/statblock/goblin-stinker.md"),
            "DS Compendium/monster/goblin/statblock/goblin-stinker.md");
        await expect(resolveString(resolver, `scc.v1:${GOBLIN_CODE}`))
            .rejects.toThrow(/goblin-stinker\.md.*frontmatter type: statblock/s);
    });

    test("legacy @path and nested-object walking are unchanged", async () => {
        const { vault, resolver } = setup();
        vault.setText("Creatures/goblin.md", DS_SB_FILE);
        const resolved = await resolver.resolveReferences(
            { creature: { statblock: "@Creatures/goblin" } });
        expect(resolved.creature.statblock.name).toBe("Goblin Stinker");
    });
});

async function resolveString(resolver: ReferenceResolver, ref: string): Promise<any> {
    return await resolver.resolveReferences(ref);
}
```

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/utils/referenceResolverScc.test.ts'
```
Expected: FAIL — the scc string falls through to `resolvePath("scc.v1:…")` and throws the legacy "Reference file … not found" error; the ds-block-less test gets the generic message.

- [ ] **Step 3: Implement**

Replace the whole of `src/utils/ReferenceResolver.ts` with:

```ts
import { App, parseYaml, TFile } from "obsidian";
import { DSESettings } from "@model/Settings";
import { SccResolver } from "@/refs/SccResolver";

const SCC_PREFIX = /^scc(\.v\d+)?:/;

/**
 * Extract and parse the first `ds-*` fenced code block of a file.
 * Shared by ReferenceResolver (below) and SccRefProvider (F1 seam).
 * Requires the OD-1(A) md-dse shape for compendium statblocks (ds-sb blocks).
 */
export async function extractFirstDsBlock(app: App, file: TFile): Promise<any> {
    const content = await app.vault.read(file);
    // Matches ```ds-<something> ... ``` or ~~~ds-<something> ... ~~~
    const blockRegex = /^([`~]{3,})ds-[\w-]+\s*\n([\s\S]+?)\n^\1/m;
    const match = content.match(blockRegex);
    if (!match) {
        const type = app.metadataCache.getFileCache(file)?.frontmatter?.type;
        throw new Error(
            `No Draw Steel Elements code block (ds-*) found in ${file.path}` +
            (typeof type === "string" ? ` (frontmatter type: ${type})` : "") +
            `. If this is a compendium file, re-sync the compendium to get the latest format.`);
    }
    try {
        return parseYaml(match[2]);
    } catch (e) {
        throw new Error(`Failed to parse YAML in ${file.path}: ${e.message}`);
    }
}

export class ReferenceResolver {
    private app: App;
    private settings: DSESettings;
    private sccResolver: SccResolver;

    constructor(app: App, settings: DSESettings,
                sccResolver: SccResolver = new SccResolver(app, settings)) {
        this.app = app;
        this.settings = settings;
        this.sccResolver = sccResolver;
    }

    public async resolveReferences(data: any): Promise<any> {
        if (typeof data === 'string') {
            if (SCC_PREFIX.test(data.trim())) {
                return await this.resolveScc(data);
            }
            if (data.startsWith('@')) {
                return await this.resolvePath(data.substring(1));
            } else if (data.startsWith('[[') && data.endsWith(']]')) {
                return await this.resolvePath(data.substring(2, data.length - 2));
            }
            return await this.resolvePath(data);
        }

        if (Array.isArray(data)) {
            return await Promise.all(data.map(item => this.resolveReferences(item)));
        }

        if (typeof data === 'object' && data !== null) {
            const resolvedData: any = {};
            for (const key of Object.keys(data)) {
                resolvedData[key] = await this.resolveReferences(data[key]);
            }
            return resolvedData;
        }

        return data;
    }

    /** F2 §4.3(c): scc refs resolve to a TFile via SccResolver, then reuse the ds-* extraction. */
    private async resolveScc(target: string): Promise<any> {
        const resolution = this.sccResolver.resolve(target);
        if (resolution.kind !== "vault") {
            throw new Error(
                `SCC reference (${target.trim()}) could not be resolved to a file in this vault. ` +
                `Sync the compendium (Settings → Draw Steel Elements → Sync compendium), or check the code.`);
        }
        return await extractFirstDsBlock(this.app, resolution.file);
    }

    public async resolvePath(path: string): Promise<any> {
        const file = this.findFile(path);

        if (!file || !(file instanceof TFile)) {
            console.warn(`Draw Steel Elements: Reference file not found: ${path}`);
            throw new Error(`Reference file (${path}) not found in root, ${this.settings.compendiumDestinationDirectory}, or when searching the cache`);
        }

        return await extractFirstDsBlock(this.app, file);
    }

    private findFile(path: string): TFile | null {
        // 1. Try exact path from root
        let file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) return file;

        // 2. Try path from root with .md extension
        if (!path.endsWith('.md')) {
            file = this.app.vault.getAbstractFileByPath(path + '.md');
            if (file instanceof TFile) return file;
        }

        // 3. Try path relative to compendium directory
        const compendiumPath = `${this.settings.compendiumDestinationDirectory}/${path}`;
        file = this.app.vault.getAbstractFileByPath(compendiumPath);
        if (file instanceof TFile) return file;

        // 4. Try path relative to compendium directory with .md extension
        if (!path.endsWith('.md')) {
            file = this.app.vault.getAbstractFileByPath(compendiumPath + '.md');
            if (file instanceof TFile) return file;
        }

        // 5. Try resolving by name using Obsidian's metadata cache
        file = this.app.metadataCache.getFirstLinkpathDest(path, "");
        if (file instanceof TFile) return file;

        return null;
    }
}
```

(The legacy 5-step `findFile` chain and the `@`/`[[…]]`/bare-string handling are byte-identical to the previous implementation — only the scc branch and the shared `extractFirstDsBlock` are new.)

- [ ] **Step 4: Run to verify pass, full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/utils/referenceResolverScc.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/utils/ReferenceResolver.ts test/unit/utils/referenceResolverScc.test.ts
git -C draw-steel-elements commit -m "feat: scc branch in ReferenceResolver; shared ds-block extraction + better miss errors"
```

---

### Task 7: `RefProvider {kind:"scc"}` on F1's `ReferenceService`

F2's side of the F1 §3.7/§4.4 seam contract: a provider that claims `scc:`/`scc.vN:` strings and returns `ResolvedRef { data, file, scc }` with `scc` = bare identity (no prefix).

**Files:**
- Create: `src/refs/SccRefProvider.ts`
- Modify: `main.ts` (resolver singleton + provider registration)
- Test: `test/unit/refs/sccRefProvider.test.ts`

**Interfaces:**
- Consumes: `RefProvider`, `RefRequest`, `ResolvedRef` from `@/framework/seams/refs` (Plan 2); `SccResolver` (Task 4); `extractFirstDsBlock` (Task 6); `normalizeSccTarget` (Task 3).
- Produces: `class SccRefProvider implements RefProvider { readonly kind = "scc"; constructor(app: App, resolver: SccResolver); canResolve(raw: string): boolean; resolve(req: RefRequest): Promise<ResolvedRef>; }`; plugin fields `sccResolver: SccResolver` (Task 12 reuses it for the post-processor).

**⚠️ Adaptation note (resolve before Step 1):** this task assumes Plan 2 landed `src/framework/seams/refs.ts` with F1 §3.7's exact exports, and that the plugin instance exposes the framework's `ReferenceService` (grep for `ReferenceService` / `refs.register` in `main.ts` and `src/framework/` to find the actual handle — e.g. `this.framework.refs`). If the framework core has NOT landed yet, implement the provider + its unit test now (they only need the *types*, which you may import type-only) and defer only the `register(...)` line in main.ts with a `// TODO(plan-02): register SccRefProvider once ReferenceService lands` comment — everything else in this plan is independent of it.

- [ ] **Step 1: Write the failing tests**

Create `test/unit/refs/sccRefProvider.test.ts`:

```ts
import { SccRefProvider } from "@/refs/SccRefProvider";
import { SccResolver } from "@/refs/SccResolver";
import { DEFAULT_SETTINGS } from "@model/Settings";
import { makeFakeApp } from "../../fakes/fakeObsidian";

const GOBLIN_CODE = "mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker";
const DS_SB_FILE = `---
scc: ${GOBLIN_CODE}
type: statblock
---

\`\`\`ds-sb
name: Goblin Stinker
role: Controller
organization: Horde
\`\`\`
`;

function setup() {
    const { app, vault } = makeFakeApp();
    const settings = { ...DEFAULT_SETTINGS };
    const provider = new SccRefProvider(app, new SccResolver(app, settings));
    return { app, vault, provider };
}

describe("SccRefProvider (F1 §3.7 seam, F2 §4.4)", () => {
    test("kind and canResolve claim every scc-prefixed string (incl. future versions)", () => {
        const { provider } = setup();
        expect(provider.kind).toBe("scc");
        expect(provider.canResolve(`scc.v1:${GOBLIN_CODE}`)).toBe(true);
        expect(provider.canResolve(`scc:${GOBLIN_CODE}`)).toBe(true);
        expect(provider.canResolve(`scc.v2:${GOBLIN_CODE}`)).toBe(true); // claimed, then refused in resolve()
        expect(provider.canResolve("@Creatures/Goblin")).toBe(false);
        expect(provider.canResolve("[[Thorn Dragon]]")).toBe(false);
    });

    test("resolve returns data + file + bare scc identity", async () => {
        const { vault, provider } = setup();
        vault.setText("DS Compendium/monster/goblin/statblock/goblin-stinker.md", DS_SB_FILE);
        const resolved = await provider.resolve({
            raw: `scc.v1:${GOBLIN_CODE}`, kind: "scc", sourcePath: "Encounters/session1.md" });
        expect((resolved.data as any).name).toBe("Goblin Stinker");
        expect(resolved.file?.path).toBe("DS Compendium/monster/goblin/statblock/goblin-stinker.md");
        expect(resolved.scc).toBe(GOBLIN_CODE); // bare identity — prefix is reference form, not identity
    });

    test("non-vault resolutions throw (error card message upstream)", async () => {
        const { provider } = setup();
        await expect(provider.resolve({
            raw: "scc.v1:mcdm.heroes.v1/class/shadow", kind: "scc", sourcePath: "x.md" }))
            .rejects.toThrow(/not available in this vault/);
        await expect(provider.resolve({
            raw: `scc.v2:${GOBLIN_CODE}`, kind: "scc", sourcePath: "x.md" }))
            .rejects.toThrow(/scc\.v2/);
    });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/refs/sccRefProvider.test.ts'
```
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the provider**

Create `src/refs/SccRefProvider.ts`:

```ts
import { App } from "obsidian";
import type { RefProvider, RefRequest, ResolvedRef } from "@/framework/seams/refs";
import { SccResolver, normalizeSccTarget } from "./SccResolver";
import { extractFirstDsBlock } from "@utils/ReferenceResolver";

const SCC_PREFIX = /^scc(\.v\d+)?:/;

/**
 * F2's side of the F1 §3.7 reference seam: resolves `scc:`/`scc.v1:` references to
 * the first ds-* block of the target compendium file. Claims ALL scc-prefixed
 * strings (including future scheme versions) so they never fall through to the
 * path-based providers; unsupported versions then fail with a clear message.
 * Structured data requires a vault hit — web fallback is a link-only affordance.
 */
export class SccRefProvider implements RefProvider {
    readonly kind = "scc";

    constructor(private app: App, private resolver: SccResolver) {}

    canResolve(raw: string): boolean {
        return SCC_PREFIX.test(raw.trim());
    }

    async resolve(req: RefRequest): Promise<ResolvedRef> {
        const code = normalizeSccTarget(req.raw);
        if (code === null) {
            throw new Error(
                `SCC reference (${req.raw.trim()}) uses an unsupported scheme version or is ` +
                `malformed. Only scc: / scc.v1: references are supported.`);
        }
        const resolution = this.resolver.resolve(req.raw);
        if (resolution.kind !== "vault") {
            throw new Error(
                `SCC reference (${req.raw.trim()}) is not available in this vault. ` +
                `Sync the compendium (Settings → Draw Steel Elements → Sync compendium).`);
        }
        const data = await extractFirstDsBlock(this.app, resolution.file);
        return { data, file: resolution.file, scc: code };
    }
}
```

- [ ] **Step 4: Run to verify pass**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/refs/sccRefProvider.test.ts'
```
Expected: PASS.

- [ ] **Step 5: Wire the singleton + registration in main.ts**

In `main.ts`: add imports and a plugin field, construct the resolver in `onload()` (after `loadSettings()`), and register the provider with the framework's `ReferenceService` (adapt the handle name per the Adaptation note above):

```ts
import { SccResolver } from "@/refs/SccResolver";
import { SccRefProvider } from "@/refs/SccRefProvider";
```

```ts
    sccResolver: SccResolver;
```

```ts
        // --- inside onload(), after loadSettings() and framework init ---
        this.sccResolver = new SccResolver(this.app, this.settings);
        this.sccResolver.registerWatchers(this);
        // F1 §3.7 seam: scc refs in element YAML resolve through this provider.
        this.framework.refs.register(new SccRefProvider(this.app, this.sccResolver));
```

(The `this.framework.refs` handle is Plan 2's; use whatever name Plan 2 actually exposed. The unregister function returned by `register` is intentionally dropped — the provider lives for the plugin's lifetime and the framework is torn down with it.)

- [ ] **Step 6: Full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm test && npm run tsc'
git -C draw-steel-elements add src/refs/SccRefProvider.ts main.ts test/unit/refs/sccRefProvider.test.ts
git -C draw-steel-elements commit -m "feat: RefProvider kind=scc registered on the framework ReferenceService"
```

---

### Task 8: Manifest module — types, `sha256Hex`, `ManifestStore`

The manifest is the sync engine's memory of "what we installed": `compendium-manifest.json` in the plugin's own config-dir folder (NOT inside the compendium folder, where Obsidian hides dotfiles and sync tools mangle them). Written atomically (temp + rename). A missing/corrupt manifest fails SAFE: everything becomes "unmanaged", which the sync engine never deletes.

**Files:**
- Create: `src/data/manifest.ts`
- Test: `test/unit/data/manifest.test.ts`

**Interfaces:**
- Consumes: `FakeAdapter`/`makeFakeApp` (Task 3); Obsidian `App` (`vault.configDir`, `vault.adapter`), `normalizePath`.
- Produces:
  - `MANIFEST_SCHEMA_VERSION = 1`
  - `interface CompendiumManifest { schemaVersion: 1; source: string; releaseTag: string; locale: string; format: string; root: string; syncedAt: string; files: Record<string, string>; }` (`files`: root-relative path → sha256 hex)
  - `sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string>`
  - `class ManifestStore { constructor(app: App, pluginId: string); load(): Promise<CompendiumManifest | null>; save(manifest: CompendiumManifest): Promise<void>; }`

- [ ] **Step 1: Write the failing tests**

Create `test/unit/data/manifest.test.ts`:

```ts
import { CompendiumManifest, ManifestStore, MANIFEST_SCHEMA_VERSION, sha256Hex } from "@/data/manifest";
import { makeFakeApp } from "../../fakes/fakeObsidian";

const MANIFEST_PATH = ".obsidian/plugins/draw-steel-elements/compendium-manifest.json";

function sampleManifest(): CompendiumManifest {
    return {
        schemaVersion: MANIFEST_SCHEMA_VERSION,
        source: "SteelCompendium/data-unified",
        releaseTag: "v4.20260701T120000",
        locale: "en",
        format: "md-dse",
        root: "DS Compendium",
        syncedAt: "2026-07-01T12:00:00.000Z",
        files: { "class/shadow.md": "ab".repeat(32) },
    };
}

describe("sha256Hex", () => {
    test("matches a known SHA-256 vector", async () => {
        // sha256("abc")
        expect(await sha256Hex(new TextEncoder().encode("abc"))).toBe(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    });
    test("accepts ArrayBuffer and subarray views identically", async () => {
        const bytes = new TextEncoder().encode("xxabcxx").subarray(2, 5); // view onto "abc"
        expect(await sha256Hex(bytes)).toBe(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    });
});

describe("ManifestStore", () => {
    test("load returns null when no manifest exists", async () => {
        const { app } = makeFakeApp();
        expect(await new ManifestStore(app, "draw-steel-elements").load()).toBeNull();
    });

    test("save + load round-trips, atomically (no .tmp left behind)", async () => {
        const { app, vault } = makeFakeApp();
        const store = new ManifestStore(app, "draw-steel-elements");
        await store.save(sampleManifest());
        expect(await store.load()).toEqual(sampleManifest());
        expect(vault.adapter.store.has(MANIFEST_PATH)).toBe(true);
        expect(vault.adapter.store.has(MANIFEST_PATH + ".tmp")).toBe(false);
    });

    test("save overwrites an existing manifest", async () => {
        const { app } = makeFakeApp();
        const store = new ManifestStore(app, "draw-steel-elements");
        await store.save(sampleManifest());
        const second = { ...sampleManifest(), releaseTag: "v4.20260702T000000" };
        await store.save(second);
        expect((await store.load())!.releaseTag).toBe("v4.20260702T000000");
    });

    test("corrupt or wrong-schema manifests load as null (fail SAFE = unmanaged)", async () => {
        const { app, vault } = makeFakeApp();
        const store = new ManifestStore(app, "draw-steel-elements");
        vault.adapter.store.set(MANIFEST_PATH, "{not json");
        expect(await store.load()).toBeNull();
        vault.adapter.store.set(MANIFEST_PATH, JSON.stringify({ schemaVersion: 99 }));
        expect(await store.load()).toBeNull();
    });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/data/manifest.test.ts'
```
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

Create `src/data/manifest.ts`:

```ts
import { App, normalizePath } from "obsidian";

export const MANIFEST_SCHEMA_VERSION = 1 as const;

/**
 * F2 §3.4 — the sync engine's record of every file it installed.
 * Lives in the plugin's config-dir folder, NOT inside the compendium folder
 * (Obsidian hides dotfiles there and third-party sync can mangle them).
 * A missing/corrupt manifest fails SAFE: all files count as unmanaged, and
 * unmanaged files are never modified or deleted by the sync engine.
 */
export interface CompendiumManifest {
    schemaVersion: typeof MANIFEST_SCHEMA_VERSION;
    /** GitHub repo, e.g. "SteelCompendium/data-unified". */
    source: string;
    /** Release tag the files came from, e.g. "v4.20260701T120000". */
    releaseTag: string;
    locale: string;
    format: string;
    /** Vault folder the tree was synced into, e.g. "DS Compendium". */
    root: string;
    /** ISO-8601 timestamp of the last successful sync. */
    syncedAt: string;
    /** Root-relative file path → sha256 hex of the installed content. */
    files: Record<string, string>;
}

/** WebCrypto SHA-256 → lowercase hex. Mobile-safe (no Node builtins). */
export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
    const buffer: ArrayBuffer = data instanceof Uint8Array
        ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
        : data;
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const bytes = new Uint8Array(digest);
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
        const byteHex = bytes[i].toString(16);
        hex += byteHex.length === 1 ? "0" + byteHex : byteHex;
    }
    return hex;
}

export class ManifestStore {
    constructor(private app: App, private pluginId: string) {}

    private manifestPath(): string {
        return normalizePath(
            `${this.app.vault.configDir}/plugins/${this.pluginId}/compendium-manifest.json`);
    }

    public async load(): Promise<CompendiumManifest | null> {
        const path = this.manifestPath();
        try {
            if (!(await this.app.vault.adapter.exists(path))) return null;
            const parsed = JSON.parse(await this.app.vault.adapter.read(path));
            if (parsed?.schemaVersion !== MANIFEST_SCHEMA_VERSION
                || typeof parsed.files !== "object" || parsed.files === null) {
                console.warn("Draw Steel Elements: unrecognized compendium manifest — treating as absent (fail-safe: nothing will be deleted).");
                return null;
            }
            return parsed as CompendiumManifest;
        } catch (error) {
            console.warn("Draw Steel Elements: unreadable compendium manifest — treating as absent (fail-safe: nothing will be deleted).", error);
            return null;
        }
    }

    /** Atomic-ish write: temp file, then rename into place. Worst case on a crash
     *  is a stale/absent manifest — which fails safe (files become unmanaged). */
    public async save(manifest: CompendiumManifest): Promise<void> {
        const path = this.manifestPath();
        const tempPath = `${path}.tmp`;
        await this.app.vault.adapter.write(tempPath, JSON.stringify(manifest, null, 2));
        if (await this.app.vault.adapter.exists(path)) {
            await this.app.vault.adapter.remove(path);
        }
        await this.app.vault.adapter.rename(tempPath, path);
    }
}
```

- [ ] **Step 4: Run to verify pass, full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/data/manifest.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/data/manifest.ts test/unit/data/manifest.test.ts
git -C draw-steel-elements commit -m "feat: compendium manifest schema, sha256 helper, atomic ManifestStore"
```

---

### Task 9: `CompendiumSyncService.applySync` — the manifest-diff engine

The heart of F2 §3.4: given the incoming file set and the old manifest, create / update / skip / trash with the guarantees: **never touch a file we didn't put there; never hard-delete user modifications.** The "homebrew is never deleted" invariant is an explicit test here.

**Files:**
- Create: `src/data/CompendiumSyncService.ts` (diff engine + types; release fetch arrives in Task 10)
- Test: `test/unit/data/compendiumSync.test.ts`

**Interfaces:**
- Consumes: `CompendiumManifest`, `ManifestStore`, `MANIFEST_SCHEMA_VERSION`, `sha256Hex` (Task 8); `FakeVault`/`FakeFileManager`/`makeFakeApp` (Task 3).
- Produces:
  - `interface SyncOptions { root: string; releaseTag?: string; locale: string; }`
  - `interface SyncReport { releaseTag: string; created: string[]; updated: string[]; unchanged: string[]; skippedConflicts: string[]; trashed: string[]; keptModified: string[]; }`
  - `const COMPENDIUM_SOURCE = "SteelCompendium/data-unified"`, `const COMPENDIUM_FORMAT = "md-dse"`
  - `class CompendiumSyncService { constructor(app: App, store: ManifestStore, requestUrlFn?: RequestUrlFn); applySync(incoming: Map<string, Uint8Array>, oldManifest: CompendiumManifest | null, options: SyncOptions, releaseTag: string, onProgress?: (done: number, total: number) => void): Promise<{ report: SyncReport; manifest: CompendiumManifest }>; }` — Task 10 adds `sync`/`checkForUpdates`.

- [ ] **Step 1: Write the failing tests**

Create `test/unit/data/compendiumSync.test.ts`:

```ts
import { CompendiumSyncService, SyncOptions } from "@/data/CompendiumSyncService";
import { CompendiumManifest, ManifestStore, MANIFEST_SCHEMA_VERSION, sha256Hex } from "@/data/manifest";
import { makeFakeApp, FakeVault, FakeFileManager } from "../../fakes/fakeObsidian";

const OPTIONS: SyncOptions = { root: "DS Compendium", locale: "en" };

function bytes(text: string): Uint8Array { return new TextEncoder().encode(text); }

function incomingOf(entries: Record<string, string>): Map<string, Uint8Array> {
    return new Map(Object.entries(entries).map(([p, c]) => [p, bytes(c)]));
}

async function manifestOf(root: string, entries: Record<string, string>): Promise<CompendiumManifest> {
    const files: Record<string, string> = {};
    for (const [p, c] of Object.entries(entries)) files[p] = await sha256Hex(bytes(c));
    return {
        schemaVersion: MANIFEST_SCHEMA_VERSION, source: "SteelCompendium/data-unified",
        releaseTag: "v4.old", locale: "en", format: "md-dse", root,
        syncedAt: "2026-06-01T00:00:00.000Z", files,
    };
}

function setup() {
    const { app, vault, fileManager } = makeFakeApp();
    const store = new ManifestStore(app, "draw-steel-elements");
    const service = new CompendiumSyncService(app, store);
    return { app, vault, fileManager, store, service };
}

describe("CompendiumSyncService.applySync (F2 §3.4)", () => {
    test("fresh sync creates files + folders and writes the manifest", async () => {
        const { vault, store, service } = setup();
        const incoming = incomingOf({
            "monster/goblin/statblock/goblin-stinker.md": "goblin!",
            "rule/combat/turn.md": "turn!",
        });
        const { report } = await service.applySync(incoming, null, OPTIONS, "v4.new");
        expect(report.created.sort()).toEqual([
            "monster/goblin/statblock/goblin-stinker.md", "rule/combat/turn.md"]);
        expect(vault.text("DS Compendium/rule/combat/turn.md")).toBe("turn!");
        const manifest = (await store.load())!;
        expect(manifest.releaseTag).toBe("v4.new");
        expect(manifest.root).toBe("DS Compendium");
        expect(Object.keys(manifest.files).sort()).toEqual([
            "monster/goblin/statblock/goblin-stinker.md", "rule/combat/turn.md"]);
    });

    test("manifest-tracked files are updated in place; unchanged files are not rewritten", async () => {
        const { vault, service } = setup();
        vault.setText("DS Compendium/a.md", "old a");
        vault.setText("DS Compendium/b.md", "same b");
        const old = await manifestOf("DS Compendium", { "a.md": "old a", "b.md": "same b" });
        const modifySpy = jest.spyOn(vault, "modifyBinary");
        const { report } = await service.applySync(
            incomingOf({ "a.md": "new a", "b.md": "same b" }), old, OPTIONS, "v4.new");
        expect(report.updated).toEqual(["a.md"]);
        expect(report.unchanged).toEqual(["b.md"]);
        expect(vault.text("DS Compendium/a.md")).toBe("new a");
        expect(modifySpy).toHaveBeenCalledTimes(1); // b.md skipped — hash-identical
    });

    test("user file squatting on a compendium path is skipped, reported, and NOT adopted into the manifest", async () => {
        const { vault, store, service } = setup();
        vault.setText("DS Compendium/rule/combat/turn.md", "MY personal notes on turns");
        const { report } = await service.applySync(
            incomingOf({ "rule/combat/turn.md": "official turn text" }), null, OPTIONS, "v4.new");
        expect(report.skippedConflicts).toEqual(["rule/combat/turn.md"]);
        expect(vault.text("DS Compendium/rule/combat/turn.md")).toBe("MY personal notes on turns");
        expect((await store.load())!.files["rule/combat/turn.md"]).toBeUndefined();
    });

    test("upstream-removed + user-untouched → trashFile (recoverable), never vault.delete", async () => {
        const { vault, fileManager, service } = setup();
        vault.setText("DS Compendium/gone.md", "installed content");
        vault.setText("DS Compendium/stays.md", "stays");
        const old = await manifestOf("DS Compendium", { "gone.md": "installed content", "stays.md": "stays" });
        const { report } = await service.applySync(
            incomingOf({ "stays.md": "stays" }), old, OPTIONS, "v4.new");
        expect(report.trashed).toEqual(["gone.md"]);
        expect(fileManager.trashed).toEqual(["DS Compendium/gone.md"]);
        expect(vault.text("DS Compendium/gone.md")).toBeUndefined();
    });

    test("upstream-removed + user-MODIFIED → left in place and reported", async () => {
        const { vault, fileManager, service } = setup();
        vault.setText("DS Compendium/gone.md", "user edited this after install");
        const old = await manifestOf("DS Compendium", { "gone.md": "original installed content" });
        const { report } = await service.applySync(incomingOf({}), old, OPTIONS, "v4.new");
        expect(report.keptModified).toEqual(["gone.md"]);
        expect(fileManager.trashed).toEqual([]);
        expect(vault.text("DS Compendium/gone.md")).toBe("user edited this after install");
    });

    // ────────────────────────────────────────────────────────────────────────
    // THE INVARIANT (Global Constraints): homebrew inside the compendium root
    // is NEVER deleted, NEVER modified, NEVER trashed — across repeated syncs
    // that create, update, and remove managed files around it.
    // ────────────────────────────────────────────────────────────────────────
    test("INVARIANT: homebrew never touched across two full syncs", async () => {
        const { vault, fileManager, store, service } = setup();
        const homebrew = "# My homebrew monster\nNever in any manifest.";
        vault.setText("DS Compendium/homebrew/my-monster.md", homebrew);

        // Sync 1: fresh install around the homebrew.
        await service.applySync(incomingOf({
            "monster/a.md": "a v1", "monster/b.md": "b v1",
        }), null, OPTIONS, "v4.one");

        // Sync 2: update a, remove b — homebrew still not in the incoming set.
        const manifestAfterFirst = await store.load();
        await service.applySync(incomingOf({
            "monster/a.md": "a v2",
        }), manifestAfterFirst, OPTIONS, "v4.two");

        expect(vault.text("DS Compendium/homebrew/my-monster.md")).toBe(homebrew);
        expect(fileManager.trashed).not.toContain("DS Compendium/homebrew/my-monster.md");
        const finalManifest = (await store.load())!;
        expect(finalManifest.files["homebrew/my-monster.md"]).toBeUndefined();
        // And the managed churn worked as designed:
        expect(vault.text("DS Compendium/monster/a.md")).toBe("a v2");
        expect(vault.text("DS Compendium/monster/b.md")).toBeUndefined();
        expect(fileManager.trashed).toEqual(["DS Compendium/monster/b.md"]);
    });

    test("removals resolve against the OLD manifest's root (root renamed between syncs)", async () => {
        const { vault, fileManager, service } = setup();
        vault.setText("Old Root/gone.md", "installed content");
        const old = await manifestOf("Old Root", { "gone.md": "installed content" });
        const { report } = await service.applySync(
            incomingOf({ "new.md": "new" }), old, { ...OPTIONS, root: "New Root" }, "v4.new");
        expect(fileManager.trashed).toEqual(["Old Root/gone.md"]);
        expect(vault.text("New Root/new.md")).toBe("new");
        expect(report.created).toEqual(["new.md"]);
    });

    test("progress callback fires and covers the full set", async () => {
        const { service } = setup();
        const progress: Array<[number, number]> = [];
        await service.applySync(
            incomingOf(Object.fromEntries(
                Array.from({ length: 45 }, (_, i) => [`f${i}.md`, `c${i}`]))),
            null, OPTIONS, "v4.new",
            (done, total) => progress.push([done, total]));
        expect(progress[progress.length - 1]).toEqual([45, 45]);
        expect(progress.every(([, total]) => total === 45)).toBe(true);
    });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/data/compendiumSync.test.ts'
```
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the diff engine**

Create `src/data/CompendiumSyncService.ts`:

```ts
import {
    App, Notice, TFile, normalizePath, requestUrl, RequestUrlParam, RequestUrlResponse,
} from "obsidian";
import * as JSZip from "jszip";
import {
    CompendiumManifest, ManifestStore, MANIFEST_SCHEMA_VERSION, sha256Hex,
} from "./manifest";

export const COMPENDIUM_SOURCE = "SteelCompendium/data-unified";
export const COMPENDIUM_FORMAT = "md-dse";

export interface SyncOptions {
    /** Vault folder to sync into, e.g. "DS Compendium". */
    root: string;
    /** Release tag to pin; empty/undefined = latest. */
    releaseTag?: string;
    /** Data locale segment, e.g. "en". */
    locale: string;
}

export interface SyncReport {
    releaseTag: string;
    created: string[];
    updated: string[];
    unchanged: string[];
    /** User files squatting on compendium paths — never touched, surfaced to the user. */
    skippedConflicts: string[];
    /** Manifest-tracked files removed upstream, user never modified → moved to trash. */
    trashed: string[];
    /** Manifest-tracked files removed upstream but user-modified → left in place. */
    keptModified: string[];
}

export type RequestUrlFn = (params: RequestUrlParam) => Promise<RequestUrlResponse>;

const BATCH_SIZE = 20; // keep the pre-6.0 batch/yield pattern (mobile-friendly)

/**
 * F2 §3.4 — non-destructive, manifest-driven compendium sync.
 * Design principles: never touch a file we didn't put there; never hard-delete
 * user modifications; all removals go through FileManager.trashFile (recoverable).
 */
export class CompendiumSyncService {
    constructor(
        private app: App,
        private store: ManifestStore,
        private requestUrlFn: RequestUrlFn = requestUrl,
    ) {}

    /**
     * Diff `incoming` (root-relative path → content) against the old manifest and
     * apply it to the vault. Pure vault mechanics — no network. Saves the new manifest.
     */
    public async applySync(
        incoming: Map<string, Uint8Array>,
        oldManifest: CompendiumManifest | null,
        options: SyncOptions,
        releaseTag: string,
        onProgress?: (done: number, total: number) => void,
    ): Promise<{ report: SyncReport; manifest: CompendiumManifest }> {
        const report: SyncReport = {
            releaseTag, created: [], updated: [], unchanged: [],
            skippedConflicts: [], trashed: [], keptModified: [],
        };
        const newFiles: Record<string, string> = {};
        const entries = [...incoming.entries()];

        // Phase 1 — create / update / skip, batched with UI yields.
        for (let i = 0; i < entries.length; i += BATCH_SIZE) {
            const batch = entries.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async ([relativePath, content]) => {
                const vaultPath = normalizePath(`${options.root}/${relativePath}`);
                const incomingHash = await sha256Hex(content);
                const existing = this.app.vault.getAbstractFileByPath(vaultPath);

                if (existing === null) {
                    await this.ensureParentFolders(vaultPath);
                    await this.app.vault.createBinary(vaultPath, toArrayBuffer(content));
                    report.created.push(relativePath);
                    newFiles[relativePath] = incomingHash;
                    return;
                }
                if (!(existing instanceof TFile)) {
                    // A folder squats on a compendium file path — never touch it.
                    report.skippedConflicts.push(relativePath);
                    return;
                }
                const currentHash = await sha256Hex(await this.app.vault.readBinary(existing));
                if (currentHash === incomingHash) {
                    // Already identical (covers re-adopting an intact install) — no write churn.
                    report.unchanged.push(relativePath);
                    newFiles[relativePath] = incomingHash;
                } else if (oldManifest?.files[relativePath] !== undefined) {
                    // We installed it → safe to update in place (no delete/recreate churn).
                    await this.app.vault.modifyBinary(existing, toArrayBuffer(content));
                    report.updated.push(relativePath);
                    newFiles[relativePath] = incomingHash;
                } else {
                    // User content squatting on a compendium path — skip and report.
                    report.skippedConflicts.push(relativePath);
                }
            }));
            onProgress?.(Math.min(i + BATCH_SIZE, entries.length), entries.length);
            await new Promise((resolve) => setTimeout(resolve, 0)); // yield to the UI thread
        }

        // Phase 2 — old-manifest files absent upstream. Resolved against the OLD
        // manifest's root (the root setting may have changed between syncs).
        // Files never in any manifest are NEVER considered: homebrew is safe by construction.
        const oldRoot = oldManifest?.root ?? options.root;
        for (const relativePath of Object.keys(oldManifest?.files ?? {})) {
            if (incoming.has(relativePath)) continue;
            const vaultPath = normalizePath(`${oldRoot}/${relativePath}`);
            const existing = this.app.vault.getAbstractFileByPath(vaultPath);
            if (!(existing instanceof TFile)) continue; // already gone — nothing to do
            const currentHash = await sha256Hex(await this.app.vault.readBinary(existing));
            if (currentHash === oldManifest!.files[relativePath]) {
                await this.app.fileManager.trashFile(existing); // recoverable — never vault.delete
                report.trashed.push(relativePath);
            } else {
                report.keptModified.push(relativePath); // user modified it — leave in place
            }
        }

        const manifest: CompendiumManifest = {
            schemaVersion: MANIFEST_SCHEMA_VERSION,
            source: COMPENDIUM_SOURCE,
            releaseTag,
            locale: options.locale,
            format: COMPENDIUM_FORMAT,
            root: options.root,
            syncedAt: new Date().toISOString(),
            files: newFiles,
        };
        await this.store.save(manifest);
        return { report, manifest };
    }

    private async ensureParentFolders(vaultPath: string): Promise<void> {
        const parts = vaultPath.split("/").slice(0, -1);
        let current = "";
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            if (this.app.vault.getAbstractFileByPath(current) === null) {
                try {
                    await this.app.vault.createFolder(current);
                } catch (error) {
                    // Concurrent batch entries may race on the same folder.
                    if (!String(error?.message ?? error).includes("already exists")) throw error;
                }
            }
        }
    }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
```

- [ ] **Step 4: Run to verify pass — the invariant must be green**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/data/compendiumSync.test.ts'
```
Expected: PASS, 9 tests — explicitly confirm `INVARIANT: homebrew never touched across two full syncs` passed.

- [ ] **Step 5: Full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm test && npm run tsc'
git -C draw-steel-elements add src/data/CompendiumSyncService.ts test/unit/data/compendiumSync.test.ts
git -C draw-steel-elements commit -m "feat: manifest-diff sync engine — homebrew-safe by construction"
```

---

### Task 10: Release fetch + zip + orchestration; retire `CompendiumDownloader`

Adds the network half (GitHub Releases via `requestUrl`, asset `md-dse-unified-{locale}.zip`, JSZip read), the user-facing `sync()` orchestration with a single updating progress Notice, `checkForUpdates()`, the OD-6 first-sync legacy modal, settings migration (reset dead-repo release tags), main.ts commands — and deletes `CompendiumDownloader.ts`.

**INTEGRATION-GATED (partially):** unit tests use an in-memory zip served by a fake `requestUrl`. A live sync cannot succeed until data-unified publishes release assets (cross-repo OD-2); that end-to-end run is Task 14. Everything in this task is still fully implementable and unit-testable now.

**Files:**
- Modify: `src/data/CompendiumSyncService.ts` (add `sync`, `checkForUpdates`, private fetch/zip helpers)
- Create: `src/views/LegacyCompendiumModal.ts`
- Modify: `src/model/Settings.ts` (add `compendiumLocale`, `settingsVersion`)
- Modify: `main.ts` (commands, `syncCompendium()`, settings migration, drop repo fields)
- Modify: `src/views/SettingsTab.ts` (minimal: keep it compiling after the downloader is deleted — full rework is Task 11)
- Delete: `src/utils/CompendiumDownloader.ts`
- Test: `test/unit/data/compendiumSyncRelease.test.ts`, `test/dom/legacyCompendiumModal.test.ts`

**Interfaces:**
- Consumes: `applySync`, `SyncOptions`, `SyncReport`, `RequestUrlFn`, `COMPENDIUM_SOURCE`, `COMPENDIUM_FORMAT` (Task 9); `ManifestStore` (Task 8).
- Produces:
  - `CompendiumSyncService.sync(options: SyncOptions): Promise<SyncReport>`
  - `CompendiumSyncService.checkForUpdates(): Promise<{ installedTag: string | null; latestTag: string; upToDate: boolean }>`
  - `class LegacyCompendiumModal extends Modal { constructor(app: App, root: string, onChoice: (trashOldRoot: boolean) => void); }`
  - Plugin members Task 11 consumes: `manifestStore: ManifestStore`, `syncService: CompendiumSyncService`, `syncOptions(): SyncOptions`, `syncCompendium(): Promise<void>`
  - `DSESettings` gains `compendiumLocale: string` (default `'en'`) and `settingsVersion: number` (default `2`).

- [ ] **Step 1: Write the failing service tests**

Create `test/unit/data/compendiumSyncRelease.test.ts`:

```ts
import * as JSZip from "jszip";
import { CompendiumSyncService, SyncOptions } from "@/data/CompendiumSyncService";
import { ManifestStore } from "@/data/manifest";
import { makeFakeApp } from "../../fakes/fakeObsidian";

const OPTIONS: SyncOptions = { root: "DS Compendium", locale: "en" };

async function zipOf(entries: Record<string, string>): Promise<ArrayBuffer> {
    const zip = new JSZip();
    for (const [path, content] of Object.entries(entries)) zip.file(path, content);
    return await zip.generateAsync({ type: "arraybuffer" });
}

function githubFake(zipBuffer: ArrayBuffer, tag = "v4.20260701T120000") {
    const releaseJson = {
        tag_name: tag,
        assets: [
            { name: "md-dse-unified-en.zip", url: "https://api.github.com/assets/1" },
            { name: "other.zip", url: "https://api.github.com/assets/2" },
        ],
    };
    return jest.fn(async (params: any) => {
        if (params.url.includes("/releases/")) {
            return { status: 200, json: releaseJson, arrayBuffer: new ArrayBuffer(0), text: "" } as any;
        }
        if (params.url === "https://api.github.com/assets/1") {
            return { status: 200, json: null, arrayBuffer: zipBuffer, text: "" } as any;
        }
        return { status: 404, json: null, arrayBuffer: new ArrayBuffer(0), text: "" } as any;
    });
}

describe("CompendiumSyncService.sync (release download path)", () => {
    test("latest release: fetch → unzip → applySync → report + manifest", async () => {
        const { app, vault } = makeFakeApp();
        const zip = await zipOf({ "rule/combat/turn.md": "turn!", "class/shadow.md": "shadow!" });
        const fetchFake = githubFake(zip);
        const store = new ManifestStore(app, "draw-steel-elements");
        const service = new CompendiumSyncService(app, store, fetchFake);
        const report = await service.sync(OPTIONS);
        expect(report.releaseTag).toBe("v4.20260701T120000");
        expect(report.created.sort()).toEqual(["class/shadow.md", "rule/combat/turn.md"]);
        expect(vault.text("DS Compendium/class/shadow.md")).toBe("shadow!");
        // Latest endpoint was used (no tag configured):
        expect(fetchFake.mock.calls[0][0].url)
            .toBe("https://api.github.com/repos/SteelCompendium/data-unified/releases/latest");
        // Asset downloaded as a binary octet-stream:
        expect(fetchFake.mock.calls[1][0].headers.Accept).toBe("application/octet-stream");
    });

    test("pinned tag uses the /tags/ endpoint", async () => {
        const { app } = makeFakeApp();
        const fetchFake = githubFake(await zipOf({ "a.md": "a" }), "v4.pinned");
        const service = new CompendiumSyncService(
            app, new ManifestStore(app, "draw-steel-elements"), fetchFake);
        await service.sync({ ...OPTIONS, releaseTag: "v4.pinned" });
        expect(fetchFake.mock.calls[0][0].url)
            .toBe("https://api.github.com/repos/SteelCompendium/data-unified/releases/tags/v4.pinned");
    });

    test("missing locale asset produces an actionable error", async () => {
        const { app } = makeFakeApp();
        const fetchFake = githubFake(await zipOf({ "a.md": "a" }));
        const service = new CompendiumSyncService(
            app, new ManifestStore(app, "draw-steel-elements"), fetchFake);
        await expect(service.sync({ ...OPTIONS, locale: "fr" }))
            .rejects.toThrow(/md-dse-unified-fr\.zip/);
    });

    test("HTTP failure surfaces status and URL", async () => {
        const { app } = makeFakeApp();
        const fetchFake = jest.fn(async () =>
            ({ status: 403, json: null, arrayBuffer: new ArrayBuffer(0), text: "" } as any));
        const service = new CompendiumSyncService(
            app, new ManifestStore(app, "draw-steel-elements"), fetchFake);
        await expect(service.sync(OPTIONS)).rejects.toThrow(/HTTP 403/);
    });

    test("checkForUpdates compares latest tag against the manifest without downloading", async () => {
        const { app } = makeFakeApp();
        const fetchFake = githubFake(await zipOf({ "a.md": "a" }), "v4.two");
        const store = new ManifestStore(app, "draw-steel-elements");
        const service = new CompendiumSyncService(app, store, fetchFake);
        expect(await service.checkForUpdates())
            .toEqual({ installedTag: null, latestTag: "v4.two", upToDate: false });
        await service.sync(OPTIONS);
        fetchFake.mockClear();
        expect(await service.checkForUpdates())
            .toEqual({ installedTag: "v4.two", latestTag: "v4.two", upToDate: true });
        expect(fetchFake).toHaveBeenCalledTimes(1); // metadata only — no asset download
    });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/data/compendiumSyncRelease.test.ts'
```
Expected: FAIL — `sync` / `checkForUpdates` do not exist.

- [ ] **Step 3: Implement the network half**

Add to `CompendiumSyncService` (same class as Task 9):

```ts
    /** Full user-facing sync: resolve release → download asset → unzip → applySync. */
    public async sync(options: SyncOptions): Promise<SyncReport> {
        const notice = new Notice("Draw Steel Elements: resolving compendium release…", 0);
        try {
            const { tag, assetUrl } = await this.resolveRelease(options);
            notice.setMessage(`Draw Steel Elements: downloading ${tag}…`);
            const zipBuffer = await this.downloadAsset(assetUrl);
            notice.setMessage("Draw Steel Elements: reading archive…");
            const incoming = await this.readZip(zipBuffer);
            const oldManifest = await this.store.load();
            const { report } = await this.applySync(
                incoming, oldManifest, options, tag,
                (done, total) => notice.setMessage(
                    `Draw Steel Elements: syncing compendium… ${done}/${total}`));
            notice.hide();
            this.showSummary(report);
            return report;
        } catch (error) {
            notice.hide();
            console.error("Draw Steel Elements: compendium sync failed:", error);
            new Notice(`Draw Steel Elements: compendium sync failed — ${error.message}`, 8000);
            throw error;
        }
    }

    /** Metadata-only update check (1 API request; unauthenticated limit is 60/hr). */
    public async checkForUpdates(): Promise<{
        installedTag: string | null; latestTag: string; upToDate: boolean;
    }> {
        const { tag } = await this.resolveRelease({ root: "", locale: "en" });
        const manifest = await this.store.load();
        return {
            installedTag: manifest?.releaseTag ?? null,
            latestTag: tag,
            upToDate: manifest?.releaseTag === tag,
        };
    }

    private async resolveRelease(options: SyncOptions): Promise<{ tag: string; assetUrl: string }> {
        const base = `https://api.github.com/repos/${COMPENDIUM_SOURCE}/releases`;
        const url = options.releaseTag
            ? `${base}/tags/${encodeURIComponent(options.releaseTag)}`
            : `${base}/latest`;
        const response = await this.requestUrlFn({
            url, method: "GET",
            headers: { Accept: "application/vnd.github.v3+json" },
            throw: false,
        });
        if (response.status !== 200) {
            throw new Error(`GitHub release lookup failed (HTTP ${response.status}) for ${url}`);
        }
        const release = response.json;
        const assetName = `${COMPENDIUM_FORMAT}-unified-${options.locale}.zip`;
        const asset = (release.assets ?? []).find((a: any) => a.name === assetName);
        if (!asset) {
            throw new Error(
                `Release ${release.tag_name} has no asset named ${assetName}. ` +
                `The data-unified release pipeline may not have published this locale/format yet.`);
        }
        return { tag: release.tag_name, assetUrl: asset.url };
    }

    private async downloadAsset(assetUrl: string): Promise<ArrayBuffer> {
        const response = await this.requestUrlFn({
            url: assetUrl, method: "GET",
            headers: { Accept: "application/octet-stream" },
            throw: false,
        });
        if (response.status !== 200) {
            throw new Error(`Asset download failed (HTTP ${response.status})`);
        }
        if (!response.arrayBuffer || response.arrayBuffer.byteLength === 0) {
            throw new Error("Downloaded compendium asset is empty.");
        }
        return response.arrayBuffer;
    }

    /** Zip root is the format dir's content (class/…, monster/… at top level) — F2 §3.2. */
    private async readZip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
        const zip = await JSZip.loadAsync(buffer);
        const incoming = new Map<string, Uint8Array>();
        for (const [path, entry] of Object.entries(zip.files)) {
            if (entry.dir) continue;
            incoming.set(path, await entry.async("uint8array"));
        }
        if (incoming.size === 0) throw new Error("Downloaded archive contains no files.");
        return incoming;
    }

    private showSummary(report: SyncReport): void {
        new Notice(
            `Draw Steel Elements: compendium ${report.releaseTag} synced — ` +
            `${report.created.length} new, ${report.updated.length} updated, ` +
            `${report.trashed.length} removed.`);
        const skipped = report.skippedConflicts.length + report.keptModified.length;
        if (skipped > 0) {
            new Notice(
                `Draw Steel Elements: ${skipped} file(s) skipped to protect your changes — ` +
                `see the developer console for the list.`, 10000);
            console.warn("Draw Steel Elements: sync skipped these paths (user content is never overwritten):",
                { squattingOnCompendiumPaths: report.skippedConflicts, userModifiedRemovedUpstream: report.keptModified });
        }
    }
```

- [ ] **Step 4: Run service tests to verify pass**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/data/compendiumSyncRelease.test.ts'
```
Expected: PASS.

- [ ] **Step 5: Write the failing modal test**

Create `test/dom/legacyCompendiumModal.test.ts`:

```ts
/** @jest-environment jsdom */
import { LegacyCompendiumModal } from "@views/LegacyCompendiumModal";
import { makeFakeApp } from "../fakes/fakeObsidian";

function openModal(onChoice: (trash: boolean) => void): LegacyCompendiumModal {
    const { app } = makeFakeApp();
    const modal = new LegacyCompendiumModal(app, "DS Compendium", onChoice);
    modal.onOpen();
    return modal;
}

describe("LegacyCompendiumModal (OD-6)", () => {
    test("'Keep everything' is the safe default choice", () => {
        const onChoice = jest.fn();
        const modal = openModal(onChoice);
        const keep = Array.from(modal.contentEl.querySelectorAll("button"))
            .find((b) => b.textContent === "Keep everything")!;
        keep.click();
        expect(onChoice).toHaveBeenCalledWith(false);
    });

    test("'Move old compendium to trash' passes true", () => {
        const onChoice = jest.fn();
        const modal = openModal(onChoice);
        const trash = Array.from(modal.contentEl.querySelectorAll("button"))
            .find((b) => b.textContent === "Move old compendium to trash")!;
        trash.click();
        expect(onChoice).toHaveBeenCalledWith(true);
    });

    test("explains that nothing is deleted automatically", () => {
        const modal = openModal(jest.fn());
        expect(modal.contentEl.textContent).toContain("never");
    });
});
```

Run: `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/legacyCompendiumModal.test.ts'` — Expected: FAIL (module missing). (If the Plan-1 `Modal` mock lacks real `contentEl`/`titleEl` divs, extend `test/mocks/obsidian.ts` accordingly — F3 §4.2 specifies them as real jsdom divs.)

- [ ] **Step 6: Implement the modal**

Create `src/views/LegacyCompendiumModal.ts` (plain buttons, not `Setting`, so it stays trivially testable):

```ts
import { App, Modal } from "obsidian";

/**
 * OD-6: shown once, before the first sync, when the compendium root already has
 * files but no manifest exists (a pre-6.0.0 download, or any user folder).
 * Default is "do nothing automatically" — trashing is an explicit, confirmed choice.
 */
export class LegacyCompendiumModal extends Modal {
    constructor(app: App, private root: string, private onChoice: (trashOldRoot: boolean) => void) {
        super(app);
    }

    onOpen(): void {
        this.titleEl.setText("Existing compendium folder found");
        this.contentEl.createEl("p", {
            text: `"${this.root}" already contains files but no sync manifest — most likely ` +
                `a compendium downloaded by an older version of this plugin. You can move that ` +
                `folder to the trash before the first sync, or keep everything in place. ` +
                `Files you keep are never overwritten or deleted; any that collide with ` +
                `compendium paths are skipped and reported.`,
        });
        const buttonRow = this.contentEl.createEl("div", { cls: "modal-button-container" });
        const keep = buttonRow.createEl("button", { text: "Keep everything", cls: "mod-cta" });
        keep.addEventListener("click", () => { this.close(); this.onChoice(false); });
        const trash = buttonRow.createEl("button", { text: "Move old compendium to trash", cls: "mod-warning" });
        trash.addEventListener("click", () => { this.close(); this.onChoice(true); });
    }

    onClose(): void {
        this.contentEl.empty();
    }
}
```

Run the modal test again — Expected: PASS.

- [ ] **Step 7: Settings model + migration + main.ts wiring**

`src/model/Settings.ts` — final shape:

```ts
export interface DSESettings {
	/** Bumped when stored settings need migration. 2 = the 6.0.0 data-unified switch. */
	settingsVersion: number;
	compendiumReleaseTag?: string; // Optional: if not set, fetch the latest release
	compendiumDestinationDirectory: string;
	/** Data locale segment (only "en" is published today). */
	compendiumLocale: string;
	defaultImagePath: string;
	/** OD-7: when an SCC code is not in the vault, link to steelcompendium.io (click-time only). */
	sccWebFallback: boolean;
}

export const DEFAULT_SETTINGS: DSESettings = {
	settingsVersion: 2,
	compendiumReleaseTag: '',
	compendiumDestinationDirectory: 'DS Compendium',
	compendiumLocale: 'en',
	defaultImagePath: 'Media/token_1.png',
	sccWebFallback: true,
};
```

`main.ts` — full new content (replaces the old file; the framework-init and element-registration lines from Plans 2/3 must be preserved as they exist in your tree — merge, don't blind-overwrite):

```ts
import {Plugin, TFolder, normalizePath} from 'obsidian';
import {MyPluginSettingTab} from "@views/SettingsTab";
import {LegacyCompendiumModal} from "@views/LegacyCompendiumModal";
import {DEFAULT_SETTINGS, DSESettings} from "@model/Settings";
import {CompendiumSyncService, SyncOptions} from "@/data/CompendiumSyncService";
import {ManifestStore} from "@/data/manifest";
import {SccResolver} from "@/refs/SccResolver";
import {SccRefProvider} from "@/refs/SccRefProvider";
import { registerElements } from '@/utils/RegisterElements';
import { initializeSchemaRegistry, resetSchemaRegistry } from '@utils/JsonSchemaValidator';
import componentWrapperSchemaYaml from '@model/schemas/ComponentWrapperSchema.yaml';
import "./styles-source.css";


export default class DrawSteelAdmonitionPlugin extends Plugin {
    settings: DSESettings;
    manifestStore: ManifestStore;
    syncService: CompendiumSyncService;
    sccResolver: SccResolver;

    async onload() {
        console.log("Loading Draw Steel Elements Plugin.")

        this.initializeSchemas();

        await this.loadSettings();
        this.addSettingTab(new MyPluginSettingTab(this.app, this));

        this.manifestStore = new ManifestStore(this.app, this.manifest.id);
        this.syncService = new CompendiumSyncService(this.app, this.manifestStore);
        this.sccResolver = new SccResolver(this.app, this.settings);
        this.sccResolver.registerWatchers(this);
        // F1 §3.7 seam: scc refs in element YAML resolve through this provider.
        this.framework.refs.register(new SccRefProvider(this.app, this.sccResolver));

        registerElements(this);

        this.addCommand({
            id: 'sync-compendium',
            name: 'Sync compendium',
            callback: () => this.syncCompendium(),
        });
        // Legacy alias: removing a command id silently drops user hotkeys.
        // Keep for the 6.x cycle; remove in 7.0.0 (F2 §3.4).
        this.addCommand({
            id: 'download-data-md-dse',
            name: 'Sync compendium (legacy alias)',
            callback: () => this.syncCompendium(),
        });
    }

    private initializeSchemas() {
        const dependencySchemas = [
            {
                id: "https://steelcompendium.io/schemas/component-wrapper-1.0.0",
                schema: componentWrapperSchemaYaml
            }
        ];
        initializeSchemaRegistry(dependencySchemas);
    }

    onunload() {
        resetSchemaRegistry();
        console.log("Draw Steel Elements Plugin unloaded and schema registry reset");
    }

    syncOptions(): SyncOptions {
        return {
            root: this.settings.compendiumDestinationDirectory,
            releaseTag: this.settings.compendiumReleaseTag || undefined,
            locale: this.settings.compendiumLocale,
        };
    }

    async syncCompendium(): Promise<void> {
        const options = this.syncOptions();
        const manifest = await this.manifestStore.load();
        if (manifest === null) {
            // OD-6: first sync with pre-existing content under the root → confirmed offer.
            const root = this.app.vault.getAbstractFileByPath(normalizePath(options.root));
            if (root instanceof TFolder && root.children.length > 0) {
                new LegacyCompendiumModal(this.app, options.root, async (trashOldRoot) => {
                    if (trashOldRoot) {
                        await this.app.fileManager.trashFile(root);
                    }
                    await this.syncService.sync(this.syncOptions());
                }).open();
                return;
            }
        }
        await this.syncService.sync(options);
    }

    async loadSettings() {
        const loaded = (await this.loadData()) ?? {};
        if ((loaded.settingsVersion ?? 1) < 2) {
            // 6.0.0 migration: old v3.* tags belong to the dead data-md-dse repo and
            // must never be replayed against data-unified (F2 §6 step 1).
            loaded.compendiumReleaseTag = '';
            loaded.settingsVersion = 2;
        }
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
        await this.saveData(this.settings);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
```

(Note the removed `githubOwner`/`githubRepo` fields and `downloadAndExtractRelease()` — the repo pointer now lives in `COMPENDIUM_SOURCE`. `this.framework.refs` is the Plan-2 handle from Task 7 — keep whatever name you used there.)

- [ ] **Step 8: Delete the old downloader; keep SettingsTab compiling**

```bash
git -C draw-steel-elements rm src/utils/CompendiumDownloader.ts
```

In `src/views/SettingsTab.ts`, make the minimal edit so the build stays green (full rework is Task 11): delete the line `import {CompendiumDownloader} from "@utils/CompendiumDownloader";` and replace the download-button listener body (lines 49–52) with:

```ts
		downloadButton.addEventListener("click", () => {
			void this.plugin.syncCompendium();
		});
```

- [ ] **Step 9: Full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm test && npm run tsc'
git -C draw-steel-elements add -A
git -C draw-steel-elements commit -m "feat!: data-unified release sync replaces destructive data-md-dse downloader"
```

---

### Task 11: Settings UX rework

F2 §3.4 settings spec: sentence case throughout, `setHeading()` sections instead of raw `h3`s, the WIPED-CLEAN warning replaced by the safety sentence, a manifest-driven status line, Sync + Check-for-updates buttons, locale dropdown, and the OD-7 web-fallback toggle.

**Files:**
- Modify: `src/views/SettingsTab.ts` (full rewrite)
- Test: `test/dom/settingsTab.test.ts`

**Interfaces:**
- Consumes: plugin members from Task 10 (`settings`, `saveSettings()`, `syncCompendium()`, `syncOptions()`, `syncService.checkForUpdates()`, `manifestStore.load()`).
- Produces: no new exports — `MyPluginSettingTab` keeps its name (main.ts already references it).

- [ ] **Step 1: Write the failing smoke test**

Create `test/dom/settingsTab.test.ts`:

```ts
/** @jest-environment jsdom */
import { MyPluginSettingTab } from "@views/SettingsTab";
import { DEFAULT_SETTINGS } from "@model/Settings";
import { makeFakeApp } from "../fakes/fakeObsidian";

function makeTab() {
    const { app } = makeFakeApp();
    const plugin: any = {
        app,
        settings: { ...DEFAULT_SETTINGS },
        saveSettings: jest.fn(async () => {}),
        syncCompendium: jest.fn(async () => {}),
        syncOptions: () => ({ root: "DS Compendium", locale: "en" }),
        syncService: { checkForUpdates: jest.fn(async () =>
            ({ installedTag: null, latestTag: "v4.x", upToDate: false })) },
        manifestStore: { load: jest.fn(async () => null) },
    };
    const tab = new MyPluginSettingTab(app, plugin);
    (tab as any).containerEl = document.createElement("div");
    return { tab, plugin, containerEl: (tab as any).containerEl as HTMLElement };
}

describe("SettingsTab 6.0.0 rework (F2 §3.4)", () => {
    test("the WIPED-CLEAN warning is gone; the safety sentence is present", () => {
        const { tab, containerEl } = makeTab();
        tab.display();
        expect(containerEl.textContent).not.toMatch(/WIPED CLEAN/i);
        expect(containerEl.textContent).toContain(
            "Only files installed by the plugin are updated or removed.");
    });

    test("no-manifest status line", async () => {
        const { tab, containerEl } = makeTab();
        tab.display();
        await Promise.resolve(); // let the async status render settle
        await Promise.resolve();
        expect(containerEl.textContent).toContain("No compendium synced yet");
    });

    test("sync button invokes plugin.syncCompendium", () => {
        const { tab, plugin, containerEl } = makeTab();
        tab.display();
        const sync = Array.from(containerEl.querySelectorAll("button"))
            .find((b) => b.textContent === "Sync")!;
        sync.click();
        expect(plugin.syncCompendium).toHaveBeenCalled();
    });
});
```

(If the Plan-1 `Setting`/`PluginSettingTab` mocks don't create real buttons/labels in jsdom, extend `test/mocks/obsidian.ts` so `Setting.addButton` creates a real `<button>` with the given text inside `containerEl` — F3 §4.2 already calls for a chainable `Setting` mock; real elements are the natural implementation.)

Run: `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/settingsTab.test.ts'` — Expected: FAIL (old copy still present).

- [ ] **Step 2: Rewrite the tab**

Replace the whole of `src/views/SettingsTab.ts` with:

```ts
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import DrawSteelAdmonitionPlugin from "main";

export class MyPluginSettingTab extends PluginSettingTab {
	plugin: DrawSteelAdmonitionPlugin;

	constructor(app: App, plugin: DrawSteelAdmonitionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('Compendium').setHeading();
		containerEl.createEl('p', {
			text: 'Only files installed by the plugin are updated or removed. ' +
				'Your own notes in this folder are never touched.',
		});

		new Setting(containerEl)
			.setName('Compendium folder')
			.setDesc('Vault folder the compendium is synced into.')
			.addText(text =>
				text
					.setPlaceholder('DS Compendium')
					.setValue(this.plugin.settings.compendiumDestinationDirectory)
					.onChange(async value => {
						this.plugin.settings.compendiumDestinationDirectory = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Release')
			.setDesc('Specific data-unified release tag to sync. Leave empty for the latest release.')
			.addText(text =>
				text
					.setPlaceholder('Latest')
					.setValue(this.plugin.settings.compendiumReleaseTag ?? "")
					.onChange(async value => {
						this.plugin.settings.compendiumReleaseTag = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Locale')
			.setDesc('Compendium language. Only English data is published today.')
			.addDropdown(dropdown =>
				dropdown
					.addOption('en', 'English')
					.setValue(this.plugin.settings.compendiumLocale)
					.onChange(async value => {
						this.plugin.settings.compendiumLocale = value;
						await this.plugin.saveSettings();
					})
			);

		const statusEl = containerEl.createEl('p', { cls: 'ds-compendium-status', text: 'Loading sync status…' });
		void this.renderStatus(statusEl);

		new Setting(containerEl)
			.setName('Sync compendium')
			.setDesc('Download the selected release and update the files the plugin manages.')
			.addButton(button =>
				button
					.setButtonText('Sync')
					.setCta()
					.onClick(() => { void this.plugin.syncCompendium(); })
			)
			.addButton(button =>
				button
					.setButtonText('Check for updates')
					.onClick(async () => {
						try {
							const result = await this.plugin.syncService.checkForUpdates();
							new Notice(result.upToDate
								? `Compendium is up to date (${result.latestTag}).`
								: `Update available: ${result.latestTag} (installed: ${result.installedTag ?? 'none'}).`);
						} catch (error) {
							new Notice(`Update check failed — ${error.message}`);
						}
					})
			);

		new Setting(containerEl).setName('Links').setHeading();

		new Setting(containerEl)
			.setName('Fall back to steelcompendium.io links')
			.setDesc('When an SCC link is not in your vault, link to its steelcompendium.io page instead. Navigation happens only on click.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.sccWebFallback)
					.onChange(async value => {
						this.plugin.settings.sccWebFallback = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setName('Initiative tracker').setHeading();

		new Setting(containerEl)
			.setName('Default creature image path')
			.setDesc('Default image to use for creatures in the initiative tracker if not specified.')
			.addText(text =>
				text
					.setPlaceholder('path/to/image.png')
					.setValue(this.plugin.settings.defaultImagePath)
					.onChange(async value => {
						this.plugin.settings.defaultImagePath = value;
						await this.plugin.saveSettings();
					})
			);
	}

	private async renderStatus(el: HTMLElement): Promise<void> {
		const manifest = await this.plugin.manifestStore.load();
		el.setText(manifest
			? `${manifest.releaseTag} · ${Object.keys(manifest.files).length} files · synced ${manifest.syncedAt.slice(0, 10)}`
			: 'No compendium synced yet.');
	}
}
```

- [ ] **Step 3: Run to verify pass, full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/settingsTab.test.ts && npm test && npm run tsc'
git -C draw-steel-elements add src/views/SettingsTab.ts test/dom/settingsTab.test.ts
git -C draw-steel-elements commit -m "feat: settings UX rework — sync status, update check, safety copy (sentence case)"
```

---

### Task 12: Vault-wide markdown post-processor registration

The one genuinely new render surface (F2 §4.3b): md-dse note bodies carry `scc.v1:` links *outside* any `ds-*` block, so DSE registers a vault-wide reading-mode post-processor. The behavior and early-exit are already tested (Task 5); this task is the wiring plus a registration-level test.

**Note (F2 §4.4):** until F1's pipeline owns post-processor registration, main.ts registers it directly. The factory (`sccPostProcessor`) is the load-bearing seam — F1 can lift the registration without semantic change.

**Files:**
- Modify: `main.ts`
- Test: extend `test/dom/rewriteSccAnchors.test.ts`

**Interfaces:**
- Consumes: `sccPostProcessor` (Task 5), `sccResolver` plugin field (Task 10).
- Produces: nothing new — registration only.

- [ ] **Step 1: Add a registration-shape test**

Append to `test/dom/rewriteSccAnchors.test.ts`:

```ts
describe("post-processor as registered by main.ts", () => {
    test("the factory-produced processor is a plain (el) => void suitable for registerMarkdownPostProcessor", () => {
        const resolver = stubResolver({});
        const process = sccPostProcessor(resolver);
        expect(typeof process).toBe("function");
        expect(process.length).toBe(1);
        // And it is safe on a totally empty element:
        expect(() => process(document.createElement("div"))).not.toThrow();
    });
});
```

Run: `devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/rewriteSccAnchors.test.ts'` — Expected: PASS immediately (the factory exists since Task 5); this test pins the registration contract.

- [ ] **Step 2: Register in main.ts**

Add the import and one line in `onload()`, directly after the `SccRefProvider` registration block from Task 10:

```ts
import { sccPostProcessor } from "@/refs/rewriteSccAnchors";
```

```ts
        // F2 §4.3(b): vault-wide reading-mode pass rewriting scc.v1: anchors in
        // compendium note bodies. First line inside is a querySelector early-exit,
        // so non-compendium notes pay ~nothing. F1's pipeline may take ownership
        // of this registration later (F2 §4.4) — keep sccPostProcessor the seam.
        this.registerMarkdownPostProcessor(sccPostProcessor(this.sccResolver));
```

- [ ] **Step 3: Full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm test && npm run tsc'
git -C draw-steel-elements add main.ts test/dom/rewriteSccAnchors.test.ts
git -C draw-steel-elements commit -m "feat: vault-wide scc anchor post-processor (early-exit guarded)"
```

---

### Task 13: Version 6.0.0, CHANGELOG, docs-as-done

**Files:**
- Modify: `package.json`, `manifest.json`, `versions.json`, `CHANGELOG.md`, `CLAUDE.md`, `.repo-docs/integration.md`
- Create: `.repo-docs/decisions/2026-07-01-data-unified-and-scc-resolution.md`

**Interfaces:** none — documentation and version metadata only.

- [ ] **Step 1: Version bump**

- `package.json`: `"version": "5.1.1"` → `"version": "6.0.0"`.
- `manifest.json`: `"version": "5.1.1"` → `"version": "6.0.0"`.
- `versions.json`: add a `"6.0.0"` entry mapping to the same minAppVersion the latest existing entry uses (F3 owns the real minAppVersion floor — do not change it here).

- [ ] **Step 2: CHANGELOG entry**

Prepend to `CHANGELOG.md` under `# Changelog`:

```markdown
## 6.0.0

- [BREAKING] Compendium source moved from the retired `data-md-dse` repo to
  `data-unified` releases (unified Browse layout, `md-dse` format). Run
  "Sync compendium" after updating — your old release-tag setting is reset
  because old tags belong to the retired repo.
- [BREAKING] Statblock YAML follows SDK 3.x: `roles:` is now `role:` +
  `organization:`, and `ancestry:` is now `keywords:`. Legacy keys in your own
  `ds-sb` blocks keep working for the 6.x cycle with a console deprecation
  warning; support is removed in 7.0.0.
- Compendium sync is now non-destructive and manifest-driven: only files the
  plugin installed are updated or removed (removals go to the trash), and your
  own notes inside the compendium folder are never touched. The first sync
  offers — and never forces — moving a pre-6.0 compendium to the trash.
- New: `scc.v1:` links resolve everywhere — in compendium notes, inside element
  text, and as references (e.g. initiative tracker
  `statblock: scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker`).
  Links resolve to your local compendium first, then optionally to
  steelcompendium.io (toggle in settings).
- New commands: "Sync compendium" (the old command id remains as a hidden alias
  so hotkeys keep working; it will be removed in 7.0.0).
- Updates `steel-compendium-sdk` to 3.x.
```

- [ ] **Step 3: CLAUDE.md constraint line**

In `draw-steel-elements/CLAUDE.md` under "Important Constraints", replace:

```
- Compendium downloader deletes the destination directory before extracting -- don't store homebrew there
```
with:
```
- Compendium sync is manifest-driven and non-destructive (`src/data/CompendiumSyncService.ts`):
  only manifest-tracked files are updated/trashed; user files under the compendium root are
  never touched. Never reintroduce directory-wipe semantics.
```

- [ ] **Step 4: `.repo-docs/integration.md` dependency map**

Read the file first, then: (a) replace every `data-md-dse` reference with `data-unified`; (b) set the SDK version to the pinned 3.x; (c) add this subsection (adjust heading level to match the file):

```markdown
### Compendium data source (6.0.0+)

- **Repo:** `SteelCompendium/data-unified`, GitHub Releases (timestamp tags, `v4.<UTC>`).
- **Asset contract:** `{format}-unified-{locale}.zip` — the plugin downloads
  `md-dse-unified-en.zip`. The zip's internal root is the format directory's *content*
  (`class/…`, `monster/…` at top level).
- **Layout consumed:** `en/unified/md-dse` (Browse aggregate). File path ≡
  `sccToFilePath(code)` (drop source segment, expand dots) — the SCC resolver's primary
  lookup relies on this.
- **Sync:** manifest-driven (`compendium-manifest.json` in the plugin config folder);
  only manifest-tracked files are updated/trashed. See
  `.repo-docs/decisions/2026-07-01-data-unified-and-scc-resolution.md`.
- **SCC references:** `scc:`/`scc.v1:` links + reference strings resolve via
  `src/refs/SccResolver.ts` (vault path → frontmatter index → steelcompendium.io →
  unresolved). `scc.v2:`+ is refused by design.
```

- [ ] **Step 5: The ADR**

Create `.repo-docs/decisions/2026-07-01-data-unified-and-scc-resolution.md` (match the tone/format of the existing ADRs in that folder):

```markdown
# Adopt data-unified releases, manifest-driven sync, and scc.v1 resolution (6.0.0)

**Date:** 2026-07-01 · **Status:** accepted · **Spec:** workspace
`docs/superpowers/dse-overhaul/F2-data-unified-sdk-integration-spec.md`

## Context

The plugin downloaded compendium data from `SteelCompendium/data-md-dse`, whose last
release predates the pipeline's move to the consolidated `data-unified` repo — users
who "updated" got stale data. The downloader also deleted the entire destination
directory before extraction (`vault.delete(dir, true)`), destroying any homebrew
stored there. The new md-dse data carries `scc.v1:` links the plugin could not resolve,
and SDK 3.x renamed statblock `roles`/`ancestry` to `role`/`organization`/`keywords`.

## Decision

1. **Source:** `data-unified` GitHub Releases, asset `md-dse-unified-{locale}.zip`
   (Browse-unified layout, `md-dse` format with raw `scc.v1:` links — location-independent,
   robust to file moves; F2 OD-3).
2. **Sync (replaces download-and-wipe):** `CompendiumSyncService` diffs against a
   `compendium-manifest.json` (plugin config dir). Only manifest-tracked files are
   created/updated/trashed; removals use `FileManager.trashFile`; user files squatting on
   compendium paths are skipped and reported. A missing/corrupt manifest fails safe
   (everything unmanaged → nothing deleted).
3. **SCC resolution:** `SccResolver` — path derivation under the compendium root
   (mirrors steel-etl `SCCToFilePath`), then a frontmatter-`scc` index (codes are forever,
   paths are not), then `https://steelcompendium.io/scc/{code}/` (toggleable), else plain
   text. Applied by a vault-wide post-processor (querySelector early-exit), by the F1
   `RefProvider {kind:"scc"}`, and by the legacy `ReferenceResolver` scc branch.
4. **SDK 3.x + shim:** statblock field rename adopted; homebrew `roles:`/`ancestry:`
   keys are shimmed with a deprecation warning for the 6.x cycle only (F2 OD-4),
   classified against the SDK's organization-name set.

## Consequences

- 6.0.0 is breaking on the `ds-sb` YAML contract and the data source; users must re-sync.
- The first sync treats a pre-6.0 compendium as unmanaged: nothing is auto-deleted; a
  one-time modal offers trashing it (F2 OD-6).
- Cross-repo prerequisites before release: SDK 3.2.0 on npm, steel-etl `ds-sb`/`ds-fb`
  emission in md-dse, data-unified release publishing (workspace README "cross-repo
  critical path").
- The old command id `download-data-md-dse` survives as an alias until 7.0.0.
```

- [ ] **Step 6: Full suite + commit**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm test && npm run tsc'
git -C draw-steel-elements add package.json manifest.json versions.json CHANGELOG.md CLAUDE.md .repo-docs
git -C draw-steel-elements commit -m "chore!: version 6.0.0 — changelog, ADR, integration docs for the data-unified switch"
```

---

### Task 14: INTEGRATION-GATED verification (requires the cross-repo releases)

**Do not start this task until the cross-repo prerequisites exist** (workspace README "cross-repo critical path"): ① SDK 3.2.0 published on npm, ② steel-etl emits `ds-sb`/`ds-fb` blocks in md-dse + data regenerated, ③ data-unified publishes a release with the `md-dse-unified-en.zip` asset (a hand-cut release made with `cd <data-unified> && zip -r md-dse-unified-en.zip . -i '*'` from inside `en/unified/md-dse/` and `gh release create v4.<UTC-timestamp> md-dse-unified-en.zip` satisfies ③ for testing). None of these are DSE work — if they are missing, stop here and report; Tasks 1–13 stand alone as unit-verified.

**Files:**
- Modify: `package.json` (only if Step 1 applies)

**Interfaces:** none — verification only.

- [ ] **Step 1 (only if Task 1 used the local-path pin): swap to the npm release**

```bash
devbox run -- bash -c 'cd draw-steel-elements && npm pkg set "devDependencies.steel-compendium-sdk=3.2.0" && npm install && npm test && npm run tsc'
git -C draw-steel-elements add package.json package-lock.json
git -C draw-steel-elements commit -m "chore: pin steel-compendium-sdk to npm 3.2.0"
```

- [ ] **Step 2: Live sync smoke test (test vault)**

Build (`devbox run -- bash -c 'cd draw-steel-elements && npm run build'`), install into a scratch vault's `.obsidian/plugins/draw-steel-elements/` (main.js, manifest.json, styles.css), then verify by hand:

1. Seed `DS Compendium/homebrew/keep-me.md` in the vault BEFORE syncing.
2. Run "Sync compendium" → progress Notice counts up; summary Notice reports ~3,078 created; `compendium-manifest.json` appears under `.obsidian/plugins/draw-steel-elements/`.
3. **`keep-me.md` still exists, byte-identical.**
4. Open a compendium class/rule note in reading mode → `scc.v1:` links render as internal links; hover preview works; a link to something absent (temporarily toggle off web fallback) renders as plain styled text; toggled on, it links to `https://steelcompendium.io/scc/…`.
5. Open a compendium monster note → the `ds-sb` block renders as a styled statblock with the "Level 1 Horde Controller"-style header line (requires prerequisite ②).
6. Initiative tracker note with `statblock: scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker` → creature loads (requires ②).
7. Edit one compendium file, delete another, re-run sync → edited file skipped + reported ("N files skipped"), deleted file recreated, everything else untouched.
8. Re-run sync twice with no upstream change → "0 new, 0 updated, 0 removed", fast.
9. Pin an old tag in settings → that release syncs; "Check for updates" reports the newer tag.
10. First-sync legacy path: fresh vault with a pre-seeded non-empty `DS Compendium/` → modal appears; "Keep everything" syncs around it; (reset) "Move old compendium to trash" trashes then syncs.
11. Mobile sanity (or the closest available approximation, e.g. Obsidian mobile emulation): sync completes without OOM; UI stays responsive during extraction.

- [ ] **Step 3: Record results**

Append findings (incl. sync duration, memory notes, any skipped-file UX confusion) to the workspace `FOLLOWUPS.md` as new numbered items if defects are found. If all green, note "F2 integration verified against <release-tag>" in the final commit message:

```bash
git -C draw-steel-elements commit --allow-empty -m "test: F2 integration verified against data-unified <release-tag>"
```

---

## Self-review notes (already folded in)

- **Spec coverage check (F2 §2–§4):** §2.1 B1 → Tasks 1–2; B2 → Task 1 Step 9 (comment only, per spec "zero now"); B3 → Task 1 Step 8; §2.2 A1 (subtrait styling) is explicitly F1/D2 scope per the spec — not planned here; §2.3/OD-5 → Global Constraints + Tasks 1/14; §3.1–3.2 (md-dse unified, asset contract, locale plumb) → Tasks 9–11; §3.3/OD-1 is cross-repo (steel-etl) — consumed via the hand-cut fixture in Task 6 and verified in Task 14; §3.4 (manifest, algorithm steps 1–6, settings UX, command alias) → Tasks 8–11; §4.1 grammar → Task 3; §4.2 resolution order → Task 4; §4.3(a/b/c) → Tasks 5/12/6; §4.4 seam → Tasks 5+7; §6 migration (tag reset, OD-6 modal, version 6.0.0, docs) → Tasks 10/13; OD-7 toggle → Tasks 4/11.
- **Known deliberate divergences:** none from the spec's recommended defaults. The spec's "hidden alias" for the old command id is implemented as a visible "(legacy alias)" command — Obsidian has no hidden commands; keeping the id is what preserves hotkeys.
- **Type consistency:** `SccResolution`/`SccResolver.resolve`/`sccToFilePath`/`normalizeSccTarget` names are used identically in Tasks 3–7 and 12; `SyncOptions`/`SyncReport`/`applySync` identically in Tasks 9–11; `ManifestStore.load/save` identically in Tasks 8–11.
