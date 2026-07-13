# D4 Preferences System Implementation Plan (Plan 13)

> **STATUS: BUILT + LANDED** (plugin main 0a00cb5, 2026-07-10; Opus-reviewed zero-findings; suite 993→1036). Linear SC-8 Done.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The D4 preference system, reconciled against what D2/D3 actually built: a real
`saveData`-backed, sparse, debounced `PrefsStorage`; the DSE preference catalog
(`DsePrefs` module augmentation + `PrefDescriptor`s); the descriptor-driven settings tab
(replacing the temporary `dse-cycle-theme` / `dse-toggle-print-preview` commands with real
UI); live CSS reflow on every mounted element root; per-block `prefs:` overrides; and a
live statblock preview inside settings.

**Architecture:** Everything rides the F1 seams that already exist. `main.ts` builds a
debounced `PrefsStorage` adapter over `plugin.saveData` (prefs live as a **sparse**
`prefs` sub-object on `DSESettings`, `settingsVersion: 1` migration marker) and injects it
into `initializeElementFrameworkV2`. A new `src/prefs/catalog.ts` augments `DsePrefs`,
registers ~13 descriptors via `prefs.describe(...)`, and owns the statblock preset
bundles. The pipeline's existing `cx.prefs.reflect(root, view)` (pipeline.ts:217) stamps
every attr-bearing pref on every element root — the settings tab's `onChange →
prefs.set()` is therefore live-apply for free. Statblock CSS is re-scoped from the
statically-stamped inner card to the reflected root attributes; two new statblock hooks
(`sb-columns`, `sb-stats`) and one cross-element hook (`reduce-motion`) get CSS built
alongside their prefs. A generic pipeline pass pops the reserved per-block `prefs:` map,
pins presentation overrides after `reflect()` (subscription order = override wins,
OD-D4-3a), and re-emits the map through a serializer wrapper so persisted elements never
drop it.

**Tech Stack:** vanilla TypeScript, Obsidian `Setting`/`PluginSettingTab` APIs, jest 30
(`unit` + `dom` projects), esbuild, the F4 browser harness (`npm run shots`) and
optionally the F5 Obsidian camera for ground-truth verification. **No new dependencies.**

**Spec:** `docs/superpowers/dse-overhaul/D4-preferences-spec.md` · **Base:** plugin `main`
@ `a9d4ec7`. The spec predates the D2/D3 build — reconciliation deltas below are part of
this plan's contract.

## Open-Decision resolutions (Scott can veto any line before execution)

| OD | Resolution taken |
|---|---|
| OD-D4-1 (roll prefs) | **(a)** — D4 catalogs + persists `rollerEngine`/`rollClickToRoll`; rows carry `ui.hidden: true` until D5 ships (no `consumerPresent()` machinery yet — D5 flips the flag). |
| OD-D4-2 (per-block syntax) | Reserved **`prefs:` map**, popped by the **pipeline** (not per-element `parse()`), presentation keys only; behavioral per-block override stays the existing `collapsible:`/`collapse_default:` block keys. |
| OD-D4-3 (override wins) | **(a)** — pin via `subscribe` registered after `reflect()` (listener registration order); no F1 `reflect` signature change. |
| OD-D4-4 (persistence granularity) | **Sparse** — only non-default keys hit disk; the store's current full-snapshot `persist()` is changed accordingly. |
| OD-D4-5 (boolean reflection) | **Value-mode** `="true"/"false"` for booleans — EXCEPT `printPreview`/`portraits`, which keep the already-built-and-test-pinned `'on'/'off'` attribute vocabulary (built CSS + `theme-print.test.ts` pins beat spec uniformity); their settings toggles map checked ⇔ `'on'`. |
| OD-D4-6 (statblock breadth) | Curated **4** now: `sbFeatureStyle`, `sbDensity` (both hooks already built), `sbColumns`, `sbStats` (hooks built by this plan). `sbChars` / `sbVillain` / `sbStickyMeta` **deferred** — the built statblock has no corresponding DOM duality (no villain-action grouping; chars render as one flex row; sticky needs Obsidian scroll-container research). Also deferred: `cardStyle` (needs a D2-grade compact design; overlaps `sbDensity`/`sbFeatureStyle`). |
| OD-D4-7 (theme options) | Moot for now — `ThemeService` has no member-list API and exactly two shippable themes; the builtin `theme` descriptor's static `options` (already built, OD-5 labels) are the list. `optionsFrom: "theme"` deferred until D3 grows themes. |
| OD-D4-8 (per-device layer) | **None** — per-vault `saveData` only. |
| OD-D4-9 (operational scalars) | **Keep top-level** on `DSESettings`; F2 owns them. |

## Spec-vs-built reconciliation deltas (the load-bearing facts)

1. **`PrefsStorage` today is a no-op stub** (`main.ts:117-120`: `get: async () =>
   undefined; set: async () => {}`) — nothing persists; a theme switch dies with the
   session. Task 1 replaces it with the real saveData adapter (and closes the D3
   follow-up: `void prefs.set(...)` swallowing storage rejections).
2. **The built statblock attr vocabulary differs from the spec**: `data-dse-density`
   with values `comfortable|compact` (not `data-dse-sb-density` / `cozy|compact`), and it
   is stamped **statically on the inner `.dse-sb` card** (`statblock/view.ts:62-63`), not
   reflected on the root. Built wins: the catalog uses `attr: 'density'` /
   `comfortable|compact`; Task 3 deletes the static stamps and re-scopes the CSS to the
   reflected root attribute.
3. **Two built pref hooks the spec doesn't have**: `data-dse-portraits` (`on|off`,
   initiative — view comment says "D4 owns the descriptor") and `data-dse-print`
   (`on|off`, the print-preview twin — `main.ts` says "the real picker (D4) will make it
   a persisted preference"). Both enter the catalog as `'on'|'off'` prefs.
4. **`def.parse(rawData, source)` has no `RenderContext`** — the spec's
   `cx.prefs.get(...)` inside `parse()` is impossible. Behavioral collapse defaults are
   resolved in the **view** (`this.cx.prefs`, `ElementView` exposes `protected cx`);
   `ComponentWrapper` stops hard-coding `?? true` / `?? false` so "unset" survives to the
   view.
5. **The store's built `persist()` writes a full snapshot including defaults** — Task 1
   makes it sparse (OD-D4-4) and makes `set()` notify subscribers before awaiting disk.
6. **`PreferenceStore` has no descriptor enumeration** — the spec's renderer calls
   `prefs.descriptors()`; Task 2 adds that (additive) method.
7. **The `ui` shape finalizes to the BUILT theme descriptor's conventions**: `control:
   'select'` (not `'dropdown'`), `options: { value, label }[]` (not tuples) — plus
   `group`/`help`/`inPreset`/`hidden`.
8. **Per-block unknown-key warnings go to `console.warn`**, not the error-card channel —
   F1 has no non-fatal error-card affordance; building one is out of D4 scope (deferred).
9. **Persisted elements + `prefs:`**: `replaceSource` rewrites the whole block body from
   `def.serialize(model)`, which would silently DROP an author's `prefs:` map on first
   interaction. Task 5 wraps the serializer to re-emit the map (re-stringified, so
   formatting may normalize — documented).

## Global Constraints

- **Repo/branch:** work happens in a NEW worktree `d4-prefs` (created via `just wt-new
  d4-prefs` from the workspace); all tasks run in
  `/home/scott/code/steelCompendium/worktrees/d4-prefs/draw-steel-elements` on branch
  **`d4-prefs`**; `npm ci` needed once (Task 1 Step 0). Never touch the main checkout at
  `workspace/draw-steel-elements`.
- **Node invocation:** node/npm/npx are NOT on PATH. Wrap every node/npm/npx/jest/tsc
  command:
  `devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/d4-prefs/draw-steel-elements && <cmd>"`
  run from `/home/scott/code/steelCompendium/workspace`. devbox eats `$?` in the inner
  shell — check exit codes INSIDE the inner command (`<cmd>; echo EXIT=$?`) and read the
  echoed value, not the outer status.
- **Gates after EVERY task:** `npx tsc --noEmit` → 0 errors; `npx jest` → all green
  (**993 tests before this plan; the count only goes up** — each task's expected total is
  stated; if you legitimately add more tests, adjust upward, never down). Do not commit
  red.
- **Commit hygiene:** NO Co-Authored-By / "Generated with" / any AI-attribution trailers.
  `git push origin d4-prefs` after each task's commit. Stray ts-node `package.json` /
  `package-lock.json` churn sometimes appears after jest runs — restore it before
  committing (`git checkout -- package.json package-lock.json`) unless the task
  intentionally changed deps (no task in this plan does).
- **Legacy visual fidelity:** pref DEFAULTS must render today's look — a fresh install
  (or an upgraded vault that never opens settings) changes NOTHING on screen except the
  settings tab existing. Every descriptor default below equals the current static value.
- **Settings-tab UI uses Obsidian's `Setting`/`PluginSettingTab` APIs.** The test mock
  (`test/mocks/obsidian-core.ts`) currently fakes `Setting` as an inert chainable proxy —
  Task 4 upgrades it to a recording fake (only `src/views/SettingsTab.ts` constructs
  `Setting`, and no existing test does, so the upgrade is low-risk). jsdom tests drive
  the REAL tab class against the mock. Remember: `tsc --noEmit` typechecks against the
  REAL `obsidian` typings — tab code must be API-correct, not just mock-compatible.
- **Verification bonus (optional, note results in task reports):** `npm run shots`
  (browser harness) for element-attr-driven pref effects;
  `npm run obsidian-shots` / `npm run shot-url` (F5 camera) can screenshot the real
  settings tab for ground-truth UI verification.

---

### Task 1: Real `saveData` preference storage — sparse, debounced, migrated, `.catch`-hardened

Closes the reconciliation deltas 1 and 5, plus the D3 follow-up (`REMAINING-TASKS.md`:
"`void prefs.set` `.catch` (once D4 wires real `saveData`)").

**Files:**
- Modify: `src/model/Settings.ts`, `main.ts`, `src/framework/seams/prefs.ts`,
  `src/framework/seams/theme.ts`
- Create: `test/dom/framework/prefs-storage.test.ts`
- Possibly touch: `test/dom/framework/seams.test.ts` (only if a persistence assertion
  pins default keys in the snapshot — see Step 6)

**Interfaces:**
- Consumes: `Plugin.loadData()/saveData()`, the existing `PrefsStorage` seam shape
  (unchanged), `DsePreferenceStore` internals.
- Produces: `DSESettings.prefs: Partial<DsePrefs>` + `settingsVersion: number`;
  `migrateSettings(raw)` (v0 → v1, additive/lossless); `createSaveDataPrefsStorage(plugin,
  debounceMs)` → `FlushablePrefsStorage` (250 ms trailing debounce, `flush()` on unload);
  `initializeElementFrameworkV2(..., prefsStorage?)` fifth param (defaults to the
  extracted `IN_MEMORY_PREFS_STORAGE` stub so every existing caller/test is unchanged);
  a store that persists **sparsely** and notifies subscribers **before** touching disk.

- [ ] **Step 0: Create the worktree + install + baseline**

From `/home/scott/code/steelCompendium/workspace`:

```bash
devbox run -- bash -c "just wt-new d4-prefs; echo EXIT=$?"
devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/d4-prefs/draw-steel-elements && npm ci && npx tsc --noEmit; echo EXIT=$?"
devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/d4-prefs/draw-steel-elements && npx jest 2>&1 | tail -3; echo EXIT=$?"
```

Expected: `EXIT=0` each; jest tail shows `Tests: 993 passed`. All subsequent steps run in
this worktree.

- [ ] **Step 1: Write the failing tests**

Create `test/dom/framework/prefs-storage.test.ts`:

```ts
// Plan 13 Task 1 (D4 §5) — real saveData-backed preference storage: the sparse
// prefs slice on DSESettings, the v0→v1 migration, the debounced storage adapter,
// and the store's sparse/notify-first behavior. Replaces the F1-era no-op
// PrefsStorage stub in initializeElementFrameworkV2 (main.ts).
import { DEFAULT_SETTINGS, migrateSettings } from '@model/Settings';
import type { DSESettings } from '@model/Settings';
import { createSaveDataPrefsStorage } from 'main';
import { createPreferenceStore, BUILTIN_DESCRIPTORS } from '../../../src/framework/seams/prefs';
import type { PrefsStorage, DsePrefs } from '../../../src/framework/seams/prefs';
import { Component } from '../../mocks/obsidian';
import { flushAsync } from '../../mocks/obsidian';

describe('D4 §5.3 — migrateSettings (v0 → v1, additive & lossless)', () => {
	test('a v0 on-disk object carries its three fields over and gains prefs {} + settingsVersion 1', () => {
		const v0 = {
			compendiumReleaseTag: 'v2.0.0',
			compendiumDestinationDirectory: 'My Compendium',
			defaultImagePath: 'img/tok.png',
		};
		const s = migrateSettings(v0);
		expect(s.compendiumReleaseTag).toBe('v2.0.0');
		expect(s.compendiumDestinationDirectory).toBe('My Compendium');
		expect(s.defaultImagePath).toBe('img/tok.png');
		expect(s.prefs).toEqual({});
		expect(s.settingsVersion).toBe(1);
	});

	test('null/undefined raw (fresh install) yields DEFAULT_SETTINGS shape', () => {
		const s = migrateSettings(undefined);
		expect(s).toEqual(DEFAULT_SETTINGS);
	});

	test('never shares DEFAULT_SETTINGS.prefs by reference (mutation safety)', () => {
		const a = migrateSettings(undefined);
		const b = migrateSettings(undefined);
		(a.prefs as Record<string, unknown>).theme = 'legacy';
		expect(b.prefs).toEqual({});
		expect(DEFAULT_SETTINGS.prefs).toEqual({});
	});

	test('an already-v1 object with stored prefs passes through (cloned, not shared)', () => {
		const v1 = { ...DEFAULT_SETTINGS, settingsVersion: 1, prefs: { theme: 'legacy' } };
		const s = migrateSettings(v1);
		expect(s.prefs).toEqual({ theme: 'legacy' });
		expect(s.prefs).not.toBe(v1.prefs);
	});
});

describe('D4 §5.2 — createSaveDataPrefsStorage (debounced saveData adapter)', () => {
	function makePlugin() {
		const settings: DSESettings = migrateSettings(undefined);
		return { settings, saveSettings: jest.fn(async () => {}) };
	}

	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	test('set() updates settings.prefs IMMEDIATELY but debounces the disk write (~250ms trailing)', async () => {
		const plugin = makePlugin();
		const storage = createSaveDataPrefsStorage(plugin);
		await storage.set({ theme: 'legacy' } as Partial<DsePrefs>);
		expect(plugin.settings.prefs).toEqual({ theme: 'legacy' });
		expect(plugin.saveSettings).not.toHaveBeenCalled();
		jest.advanceTimersByTime(250);
		expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
	});

	test('a burst of set() calls collapses into ONE saveSettings (preset batch-write contract)', async () => {
		const plugin = makePlugin();
		const storage = createSaveDataPrefsStorage(plugin);
		await storage.set({ theme: 'legacy' } as Partial<DsePrefs>);
		jest.advanceTimersByTime(100);
		await storage.set({} as Partial<DsePrefs>);
		jest.advanceTimersByTime(100);
		await storage.set({ theme: 'legacy' } as Partial<DsePrefs>);
		jest.advanceTimersByTime(250);
		expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
	});

	test('flush() writes a pending save NOW (onunload contract); no pending → no write', () => {
		const plugin = makePlugin();
		const storage = createSaveDataPrefsStorage(plugin);
		storage.flush();
		expect(plugin.saveSettings).not.toHaveBeenCalled();
		void storage.set({ theme: 'legacy' } as Partial<DsePrefs>);
		storage.flush();
		expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
		jest.advanceTimersByTime(500); // the flushed timer must not fire a second write
		expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
	});

	test('get() returns the live prefs slice', async () => {
		const plugin = makePlugin();
		plugin.settings.prefs = { theme: 'legacy' } as Partial<DsePrefs>;
		const storage = createSaveDataPrefsStorage(plugin);
		await expect(storage.get()).resolves.toEqual({ theme: 'legacy' });
	});
});

describe('D4 §5.2 / OD-D4-4 — the store persists SPARSELY and notifies before disk', () => {
	function makeRecordingStorage() {
		const writes: Partial<DsePrefs>[] = [];
		let release: () => void = () => {};
		const gate = new Promise<void>((resolve) => (release = resolve));
		const storage: PrefsStorage = {
			get: async () => undefined,
			set: async (prefs) => {
				writes.push(prefs);
				await gate; // holds the disk write open so notify-order is observable
			},
		};
		return { storage, writes, release };
	}

	test('set(key, non-default) persists ONLY that key; set(key, default) removes it from the snapshot', async () => {
		const { storage, writes, release } = makeRecordingStorage();
		release();
		const store = createPreferenceStore(storage);
		await store.set('theme', 'legacy');
		expect(writes.at(-1)).toEqual({ theme: 'legacy' });
		await store.set('theme', BUILTIN_DESCRIPTORS[0].default as DsePrefs['theme']);
		expect(writes.at(-1)).toEqual({}); // back to default ⇒ sparse snapshot drops it
	});

	test('subscribers are notified BEFORE the storage write resolves (UI never waits on disk)', async () => {
		const { storage } = makeRecordingStorage(); // gate never released — write hangs
		const store = createPreferenceStore(storage);
		const owner = new Component();
		owner.load();
		const seen: string[] = [];
		store.subscribe('theme', owner, (v) => seen.push(v as string));
		void store.set('theme', 'legacy');
		await flushAsync(1);
		expect(seen).toEqual(['legacy']); // notified while storage.set is still pending
	});
});
```

Run: `npx jest test/dom/framework/prefs-storage.test.ts` → FAIL (missing exports:
`migrateSettings`, `createSaveDataPrefsStorage`; sparse/notify-order assertions fail).

- [ ] **Step 2: Rewrite `src/model/Settings.ts`**

Replace the whole file with:

```ts
import type { DsePrefs } from '@/framework/seams/prefs';

export interface DSESettings {
	compendiumReleaseTag?: string; // Optional: if not set, fetch the latest release
	compendiumDestinationDirectory: string;
	defaultImagePath: string;
	/** D4 §5.3 — migration marker. Bump ONLY for structural pref changes (key
	 *  renames / option-set changes); sparse storage makes default changes and new
	 *  prefs migration-free. */
	settingsVersion: number;
	/** D4 §5.2 / OD-D4-4 — the SPARSE pref slice: only keys whose value differs
	 *  from the descriptor default are ever written here. */
	prefs: Partial<DsePrefs>;
}

export const DEFAULT_SETTINGS: DSESettings = {
	compendiumReleaseTag: '', // Leave empty to fetch the latest release
	compendiumDestinationDirectory: 'DS Compendium', // Default directory in the vault
	defaultImagePath: 'Media/token_1.png',
	settingsVersion: 1,
	prefs: {},
};

/**
 * D4 §5.3 — migrate whatever loadData() returned to the current shape. v0 → v1 is
 * purely additive and lossless: the three operational fields carry over verbatim;
 * `prefs` initializes empty (⇒ every pref resolves to its default ⇒ zero visual
 * change for existing vaults); `settingsVersion` stamps 1. Future structural
 * changes add `if (s.settingsVersion < N) { … }` branches here.
 */
export function migrateSettings(raw: unknown): DSESettings {
	const base =
		raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Partial<DSESettings>) : {};
	const s: DSESettings = Object.assign({}, DEFAULT_SETTINGS, base);
	// Always own a FRESH prefs object — never share DEFAULT_SETTINGS.prefs (or the
	// caller's raw object) by reference.
	s.prefs =
		base.prefs && typeof base.prefs === 'object' && !Array.isArray(base.prefs)
			? { ...base.prefs }
			: {};
	if (typeof s.settingsVersion !== 'number') s.settingsVersion = 1;
	return s;
}
```

- [ ] **Step 3: The store — sparse persist, notify-first, load-error `.catch`**

In `src/framework/seams/prefs.ts`, inside `DsePreferenceStore`:

Constructor — replace `void this.load();` with:

```ts
		// Fire-and-forget: get() must stay synchronous (§3.6), so persisted values
		// are applied (and subscribers notified) whenever the load resolves. D4:
		// a load failure must not vanish silently (Plan 10 follow-up).
		this.load().catch((error) => {
			console.error('Draw Steel Elements: failed to load preferences', error);
		});
```

`set()` — notify BEFORE persisting (in-memory truth is synchronous; the UI never waits on
disk):

```ts
	async set<K extends keyof DsePrefs>(key: K, value: DsePrefs[K]): Promise<void> {
		const k = key as string;
		this.descriptorFor(k);
		this.values.set(k, value);
		this.notify(k, value); // D4 §5.2: reflect/subscribers fire before the disk write
		await this.persist();
	}
```

`persist()` — sparse (OD-D4-4: only non-default values hit storage):

```ts
	private async persist(): Promise<void> {
		const snapshot: Record<string, unknown> = {};
		for (const [key, descriptor] of this.descriptors) {
			if (!this.values.has(key)) continue;
			const value = this.values.get(key);
			if (value === descriptor.default) continue; // sparse: defaults are implicit
			snapshot[key] = value;
		}
		this.persistedSnapshot = snapshot;
		await this.storage.set(snapshot as Partial<DsePrefs>);
	}
```

(Note: `this.descriptors` is the private Map field at this point; Task 2 renames it to
`descriptorMap` when it adds the public `descriptors()` accessor — don't pre-rename here.)

- [ ] **Step 4: `theme.ts` — the deferred `.catch`**

In `setActive()` replace `void this.prefs.set('theme', theme);` with:

```ts
		// Persist only — the upstream prefs.subscribe in the constructor drives the
		// listener fan-out. Notifying here as well would double-fire every listener.
		// D4 (Plan 10 FOLLOWUP): a storage rejection must not vanish silently.
		this.prefs.set('theme', theme).catch((error) => {
			console.error('Draw Steel Elements: failed to persist theme preference', error);
		});
```

- [ ] **Step 5: `main.ts` — the real storage adapter, wired**

(a) Extract the stub and add the adapter + interface, right above
`initializeElementFrameworkV2`:

```ts
/** F1's original in-memory PrefsStorage stub — still the DEFAULT for
 *  initializeElementFrameworkV2 so tests/harnesses that don't care about
 *  persistence are unchanged. Production onload injects the real adapter below. */
export const IN_MEMORY_PREFS_STORAGE: PrefsStorage = {
	get: async () => undefined,
	set: async () => {},
};

/** PrefsStorage with an unload-time escape hatch for the trailing debounce. */
export interface FlushablePrefsStorage extends PrefsStorage {
	/** Write any pending debounced save NOW (fire-and-forget; onunload calls this). */
	flush(): void;
}

/**
 * D4 §5.2 — the real PrefsStorage: the store's sparse snapshot lands on
 * `plugin.settings.prefs` synchronously; the actual `saveData` write is DEBOUNCED
 * (250 ms trailing) so a preset batch-write or a toggle flurry costs one disk write.
 * Structural param (settings + saveSettings) keeps it unit-testable without a Plugin.
 */
export function createSaveDataPrefsStorage(
	plugin: { settings: DSESettings; saveSettings(): Promise<void> },
	debounceMs = 250,
): FlushablePrefsStorage {
	let timer: ReturnType<typeof setTimeout> | null = null;
	const write = (): void => {
		timer = null;
		plugin.saveSettings().catch((error) => {
			console.error('Draw Steel Elements: failed to save preferences', error);
		});
	};
	return {
		get: async () => plugin.settings.prefs,
		set: async (prefs) => {
			plugin.settings.prefs = prefs;
			if (timer !== null) clearTimeout(timer);
			timer = setTimeout(write, debounceMs);
		},
		flush: () => {
			if (timer === null) return;
			clearTimeout(timer);
			write();
		},
	};
}
```

(b) `initializeElementFrameworkV2` gains a fifth parameter and uses it (replacing the
inline stub at lines 117-121):

```ts
export function initializeElementFrameworkV2(
	app: App,
	plugin: Plugin,
	settings: Readonly<DSESettings>,
	dependencySchemas: readonly DependencySchema[] = FRAMEWORK_V2_DEPENDENCY_SCHEMAS,
	prefsStorage: PrefsStorage = IN_MEMORY_PREFS_STORAGE,
): ElementFrameworkV2 {
	const validation = createValidationService();
	const session = createSessionStore();
	// D4 (Plan 13 Task 1): production injects the saveData-backed adapter
	// (createSaveDataPrefsStorage); the default stays in-memory for tests/harnesses.
	const prefs = createPreferenceStore(prefsStorage);
```

(c) Plugin class: add the field, wire onload/onunload/loadSettings:

```ts
    /** D4: the debounced saveData adapter behind the PreferenceStore; flushed on unload. */
    private prefsStorage?: FlushablePrefsStorage;
```

In `onload()`, replace the `initializeElementFrameworkV2(...)` call with:

```ts
        this.prefsStorage = createSaveDataPrefsStorage(this);
        const frameworkV2 = initializeElementFrameworkV2(
            this.app,
            this,
            this.settings,
            this.frameworkV2DependencySchemas(),
            this.prefsStorage,
        );
```

In `onunload()` (before `this.frameworkV2 = undefined;`):

```ts
        // D4: don't lose a pref change made in the last 250 ms before unload.
        this.prefsStorage?.flush();
        this.prefsStorage = undefined;
```

`loadSettings()` becomes:

```ts
    async loadSettings() {
        this.settings = migrateSettings(await this.loadData());
    }
```

Update the imports: add `migrateSettings` to the `@model/Settings` import (keep
`DEFAULT_SETTINGS` only if still referenced — after this change it may be unused in
main.ts; drop it if so).

- [ ] **Step 6: Gates**

Run: `npx jest test/dom/framework/prefs-storage.test.ts` → 10 PASS.
Run: `npx tsc --noEmit` → 0.
Run: `npx jest` → expected **1003** (993 + 10). If `test/dom/framework/seams.test.ts` or
`plugin-wiring.test.ts` fail, it will be a persistence assertion that pinned the old
full-snapshot write (a default key present in `storage.set`'s argument) or the old
`Object.assign` loadSettings — update those assertions to the sparse/migrated behavior
(never weaken an unrelated assertion).

- [ ] **Step 7: Commit + push**

```bash
git add src/model/Settings.ts main.ts src/framework/seams/prefs.ts src/framework/seams/theme.ts test/dom/framework/prefs-storage.test.ts test/dom/framework/seams.test.ts test/dom/framework/plugin-wiring.test.ts
git commit -m "feat(prefs): real saveData-backed preference storage — sparse, debounced, migrated (D4)"
git push origin d4-prefs
```

(Only add the two existing test files if Step 6 actually touched them.)

---

### Task 2: The preference catalog — `DsePrefs` augmentation, descriptors, presets

**Files:**
- Create: `src/prefs/catalog.ts`, `test/unit/prefs/catalog.test.ts`
- Modify: `src/framework/seams/prefs.ts` (`descriptors()` accessor + builtin `theme` ui
  gains `group`), `main.ts` (register the catalog), `test/dom/framework/seams.test.ts`
  (the OD-5 ui pin gains `group`)

**Interfaces:**
- Consumes: `PrefDescriptor` / `PreferenceStore.describe` (F1 §3.6, names exact).
- Produces: the augmented `DsePrefs` (12 new keys); `PrefUi` (the finalized shape of F1's
  `ui?: unknown`); `prefUi(descriptor)` typed accessor; `GROUP_ORDER`;
  `DSE_PREF_DESCRIPTORS` (registered inside `initializeElementFrameworkV2`, so every
  bundle — plugin, tests, harness — has the catalog); `SB_PRESETS` /
  `deriveSbPreset(prefs)` / `applySbPreset(prefs, id)`;
  `PreferenceStore.descriptors(): readonly PrefDescriptor[]`.
- Attr vocabulary this catalog owns (D2's CSS keys off these; all reflected by the
  existing `prefs.reflect`): `data-dse-reduce-motion` (`true|false`), `data-dse-print`
  (`on|off`), `data-dse-portraits` (`on|off`), `data-dse-sb-featstyle` (`card|flat`),
  `data-dse-density` (`comfortable|compact`), `data-dse-sb-columns` (`single|wide`),
  `data-dse-sb-stats` (`grid|ledger`).

- [ ] **Step 1: `descriptors()` on the store**

In `src/framework/seams/prefs.ts`:

(a) Add to the `PreferenceStore` interface, after `describe`:

```ts
	/** All registered descriptors, in registration order (D4: drives the settings
	 *  renderer and per-block `prefs:` validation). */
	descriptors(): readonly PrefDescriptor[];
```

(b) In `DsePreferenceStore`, rename the private field `descriptors` →
`descriptorMap` (5 references: the declaration, `describe`, `descriptorFor`, `persist`,
`reflect`) and add:

```ts
	descriptors(): readonly PrefDescriptor[] {
		return [...this.descriptorMap.values()];
	}
```

(c) In `BUILTIN_DESCRIPTORS`, the `theme` descriptor's `ui` gains the group (the full
`ui` object becomes):

```ts
		ui: {
			group: 'Appearance',
			label: 'Theme',
			control: 'select',
			options: [
				{ value: 'legacy', label: 'Match Obsidian (Legacy)' },
				{ value: 'steel', label: 'Steel' },
			],
		},
```

Then update the seams.test.ts pin `carries the D4 settings-picker ui (OD-5 labels)`
(around line 285) to expect the `group: 'Appearance'` member too.

- [ ] **Step 2: Write `src/prefs/catalog.ts` (complete)**

```ts
// src/prefs/catalog.ts — D4 §2: THE Draw Steel Elements preference catalog.
//
// One module owns: the DsePrefs augmentation (F1 §3.6 reserves it for D4), the
// PrefDescriptor list registered into every PreferenceStore, the finalized `ui`
// shape (PrefUi — F1 left it `unknown`), and the statblock preset bundles (§3.2).
// Adding a pref = adding a descriptor here; the settings tab renders from it.
//
// RECONCILIATION (spec → built, Plan 13): attr names/values follow what D2 BUILT,
// not the spec draft — `density`/`comfortable|compact` (statblock/view.ts shipped
// them statically; Task 3 moves them onto reflection), `sb-featstyle`/`card|flat`,
// `portraits`/`on|off` (initiative CSS), `print`/`on|off` (the print-preview twin,
// pinned by theme-print.test.ts — the reason these two stay 'on'|'off' strings
// instead of value-mode booleans, OD-D4-5). Defaults REPRODUCE TODAY'S LOOK —
// that is the compatibility bar, guarded by catalog.test.ts.
//
// theme is NOT here: it is the builtin descriptor in seams/prefs.ts (attr-omitted
// — ThemeService.apply is the single writer of data-dse-theme; D3 §7.1).
import type { PreferenceStore, PrefDescriptor, DsePrefs } from '../framework/seams/prefs';

declare module '../framework/seams/prefs' {
	interface DsePrefs {
		// —— Appearance (presentation) ——
		reduceMotion: boolean;
		printPreview: 'on' | 'off';
		portraits: 'on' | 'off';
		// —— Statblock display (presentation; OD-D4-6 curated four) ——
		sbFeatureStyle: 'card' | 'flat';
		sbDensity: 'comfortable' | 'compact';
		sbColumns: 'single' | 'wide';
		sbStats: 'grid' | 'ledger';
		// —— Element defaults (behavioral — no attr; views read cx.prefs.get) ——
		collapsibleDefault: boolean;
		collapseDefault: boolean;
		// —— Rolling (behavioral; D5 consumes — rows hidden until it ships) ——
		rollerEngine: 'native' | 'dice-roller';
		rollClickToRoll: boolean;
		// —— References (behavioral; F2 consumes — row hidden until it ships) ——
		webLinkFallback: boolean;
	}
}

export type PrefGroup =
	| 'Appearance'
	| 'Statblock display'
	| 'Element defaults'
	| 'Rolling'
	| 'References';

/** Section order in the settings tab. */
export const GROUP_ORDER: readonly PrefGroup[] = [
	'Appearance',
	'Statblock display',
	'Element defaults',
	'Rolling',
	'References',
];

/** D4 §4.1 — the finalized shape of PrefDescriptor.ui (F1 typed it `unknown`). */
export interface PrefUi {
	group: PrefGroup;
	label: string;
	help?: string;
	/** 'toggle' over a string-typed pref means the 'on'|'off' mapping (checked ⇔ 'on'). */
	control: 'toggle' | 'select' | 'text';
	options?: readonly { value: string; label: string }[];
	/** Statblock preset-bundle member (§3.2). */
	inPreset?: boolean;
	/** Row not rendered (consumer not shipped: D5 rolling, F2 references). */
	hidden?: boolean;
}

/** Typed accessor for the `unknown`-typed ui at the F1 seam. */
export function prefUi(descriptor: PrefDescriptor): PrefUi | undefined {
	return descriptor.ui as PrefUi | undefined;
}

/** Correlates key/default per entry (PrefDescriptor's K) while building a plain array. */
function d<K extends keyof DsePrefs>(
	descriptor: PrefDescriptor<K> & { ui: PrefUi },
): PrefDescriptor {
	return descriptor as PrefDescriptor;
}

export const DSE_PREF_DESCRIPTORS: readonly PrefDescriptor[] = [
	// —— Appearance ——
	d({
		key: 'reduceMotion', default: false, attr: 'reduce-motion',
		ui: {
			group: 'Appearance', label: 'Reduce motion', control: 'toggle',
			help: 'Disable transitions and animations inside Draw Steel elements. The system reduced-motion preference is honored regardless.',
		},
	}),
	d({
		key: 'printPreview', default: 'off', attr: 'print',
		ui: {
			group: 'Appearance', label: 'Print preview', control: 'toggle',
			help: 'Show every element in its print/export layout on screen.',
		},
	}),
	d({
		key: 'portraits', default: 'on', attr: 'portraits',
		ui: {
			group: 'Appearance', label: 'Initiative portraits', control: 'toggle',
			help: 'Show creature portraits in the initiative tracker.',
		},
	}),

	// —— Statblock display (§3 — the priority group) ——
	d({
		key: 'sbFeatureStyle', default: 'card', attr: 'sb-featstyle',
		ui: {
			group: 'Statblock display', inPreset: true, label: 'Feature style', control: 'select',
			options: [{ value: 'card', label: 'Cards' }, { value: 'flat', label: 'Flat list' }],
		},
	}),
	d({
		key: 'sbDensity', default: 'comfortable', attr: 'density',
		ui: {
			group: 'Statblock display', inPreset: true, label: 'Density', control: 'select',
			options: [{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }],
		},
	}),
	d({
		key: 'sbColumns', default: 'single', attr: 'sb-columns',
		ui: {
			group: 'Statblock display', inPreset: true, label: 'Feature columns', control: 'select',
			options: [{ value: 'single', label: 'Single column' }, { value: 'wide', label: 'Side-by-side (wide)' }],
		},
	}),
	d({
		key: 'sbStats', default: 'grid', attr: 'sb-stats',
		ui: {
			group: 'Statblock display', inPreset: true, label: 'Secondary stats', control: 'select',
			options: [{ value: 'grid', label: 'Grid' }, { value: 'ledger', label: 'Ledger' }],
		},
	}),

	// —— Element defaults (behavioral) ——
	d({
		key: 'collapsibleDefault', default: true,
		ui: {
			group: 'Element defaults', label: 'Collapsible by default', control: 'toggle',
			help: 'Blocks are collapsible unless the block sets collapsible: itself.',
		},
	}),
	d({
		key: 'collapseDefault', default: false,
		ui: {
			group: 'Element defaults', label: 'Start collapsed', control: 'toggle',
			help: 'Collapsible blocks start collapsed unless the block sets collapse_default: itself.',
		},
	}),

	// —— Rolling (OD-D4-1a: cataloged now, hidden until D5 ships and flips hidden) ——
	d({
		key: 'rollerEngine', default: 'native',
		ui: {
			group: 'Rolling', hidden: true, label: 'Roller', control: 'select',
			options: [{ value: 'native', label: 'Draw Steel native' }, { value: 'dice-roller', label: 'Dice Roller plugin' }],
		},
	}),
	d({
		key: 'rollClickToRoll', default: true,
		ui: { group: 'Rolling', hidden: true, label: 'Click ability to roll', control: 'toggle' },
	}),

	// —— References (hidden until F2 ships) ——
	d({
		key: 'webLinkFallback', default: true,
		ui: {
			group: 'References', hidden: true, label: 'Fall back to steelcompendium.io links', control: 'toggle',
			help: "When an SCC link isn't found in your vault, open it on the website (on click only).",
		},
	}),
];

// —— §3.2 statblock presets: NOT a stored pref — the label is DERIVED from the
// members, re-deriving 'custom' when any single member diverges (site parity). ——
export const SB_PRESETS = {
	steel:      { sbFeatureStyle: 'card', sbDensity: 'comfortable', sbColumns: 'single', sbStats: 'grid' },
	sourcebook: { sbFeatureStyle: 'card', sbDensity: 'comfortable', sbColumns: 'single', sbStats: 'ledger' },
	index:      { sbFeatureStyle: 'flat', sbDensity: 'compact', sbColumns: 'wide', sbStats: 'grid' },
} as const;
export type SbPresetId = keyof typeof SB_PRESETS;

const SB_PRESET_MEMBERS = ['sbFeatureStyle', 'sbDensity', 'sbColumns', 'sbStats'] as const;

/** The preset whose bundle equals the current member values, else 'custom'. */
export function deriveSbPreset(prefs: PreferenceStore): SbPresetId | 'custom' {
	for (const id of Object.keys(SB_PRESETS) as SbPresetId[]) {
		if (SB_PRESET_MEMBERS.every((k) => prefs.get(k) === SB_PRESETS[id][k])) return id;
	}
	return 'custom';
}

/** Writes every member of `preset` (sequential prefs.set; the debounced storage
 *  adapter collapses the batch into one disk write). */
export async function applySbPreset(prefs: PreferenceStore, preset: SbPresetId): Promise<void> {
	for (const k of SB_PRESET_MEMBERS) {
		await prefs.set(k, SB_PRESETS[preset][k]);
	}
}
```

- [ ] **Step 3: Register the catalog in `initializeElementFrameworkV2`**

In `main.ts`, add the import:

```ts
import { DSE_PREF_DESCRIPTORS } from '@/prefs/catalog';
```

and immediately after `const prefs = createPreferenceStore(prefsStorage);`:

```ts
	// D4 (Plan 13 Task 2): the full preference catalog — every bundle (plugin,
	// tests, visual harness) gets the same descriptor set. describe() is
	// idempotent-safe for late persisted loads (persistedSnapshot re-apply).
	prefs.describe(DSE_PREF_DESCRIPTORS);
```

- [ ] **Step 4: Write `test/unit/prefs/catalog.test.ts`**

```ts
// Plan 13 Task 2 (D4 §2) — the preference catalog: defaults REPRODUCE TODAY'S
// LOOK (the compatibility bar), the attr vocabulary matches what D2 built, and
// consumer-gated rows are hidden. Pure unit tests — no DOM.
import {
	DSE_PREF_DESCRIPTORS, SB_PRESETS, deriveSbPreset, applySbPreset, prefUi, GROUP_ORDER,
} from '../../../src/prefs/catalog';
import { createPreferenceStore, BUILTIN_DESCRIPTORS } from '../../../src/framework/seams/prefs';
import type { PreferenceStore, PrefsStorage } from '../../../src/framework/seams/prefs';

function makeStore(): PreferenceStore {
	const storage: PrefsStorage = { get: async () => undefined, set: async () => {} };
	const store = createPreferenceStore(storage);
	store.describe(DSE_PREF_DESCRIPTORS);
	return store;
}

test('every catalog key is unique and none shadows a builtin', () => {
	const keys = [...BUILTIN_DESCRIPTORS, ...DSE_PREF_DESCRIPTORS].map((d) => d.key as string);
	expect(new Set(keys).size).toBe(keys.length);
});

test('defaults reproduce today\'s look (the legacy-fidelity bar)', () => {
	const store = makeStore();
	expect(store.get('theme')).toBe('steel');
	expect(store.get('reduceMotion')).toBe(false);
	expect(store.get('printPreview')).toBe('off');
	expect(store.get('portraits')).toBe('on');
	expect(store.get('sbFeatureStyle')).toBe('card');       // statblock/view.ts static value
	expect(store.get('sbDensity')).toBe('comfortable');     // statblock/view.ts static value
	expect(store.get('sbColumns')).toBe('single');
	expect(store.get('sbStats')).toBe('grid');
	expect(store.get('collapsibleDefault')).toBe(true);     // old ComponentWrapper ?? true
	expect(store.get('collapseDefault')).toBe(false);       // old ComponentWrapper ?? false
});

test('presentation attrs pin the BUILT data-dse-* vocabulary; behavioral prefs have none', () => {
	const attrs = Object.fromEntries(
		DSE_PREF_DESCRIPTORS.map((d) => [d.key as string, d.attr ?? null]),
	);
	expect(attrs).toEqual({
		reduceMotion: 'reduce-motion',
		printPreview: 'print',        // theme-print.test.ts pins [data-dse-print="on"]
		portraits: 'portraits',       // initiative CSS pins [data-dse-portraits="off"]
		sbFeatureStyle: 'sb-featstyle',
		sbDensity: 'density',         // BUILT name (spec draft said sb-density; built wins)
		sbColumns: 'sb-columns',
		sbStats: 'sb-stats',
		collapsibleDefault: null,
		collapseDefault: null,
		rollerEngine: null,
		rollClickToRoll: null,
		webLinkFallback: null,
	});
});

test('every descriptor carries a PrefUi in a known group; D5/F2 rows are hidden', () => {
	for (const d of DSE_PREF_DESCRIPTORS) {
		const ui = prefUi(d);
		expect(ui).toBeDefined();
		expect(GROUP_ORDER).toContain(ui!.group);
	}
	for (const key of ['rollerEngine', 'rollClickToRoll', 'webLinkFallback']) {
		const d = DSE_PREF_DESCRIPTORS.find((x) => (x.key as string) === key)!;
		expect(prefUi(d)!.hidden).toBe(true);
	}
});

test('preset derivation: defaults = steel; one divergence = custom; applySbPreset round-trips', async () => {
	const store = makeStore();
	expect(deriveSbPreset(store)).toBe('steel');
	await store.set('sbStats', 'ledger');
	expect(deriveSbPreset(store)).toBe('sourcebook');
	await store.set('sbDensity', 'compact');
	expect(deriveSbPreset(store)).toBe('custom');
	await applySbPreset(store, 'index');
	expect(deriveSbPreset(store)).toBe('index');
	expect(store.get('sbFeatureStyle')).toBe('flat');
	expect(store.get('sbColumns')).toBe('wide');
	await applySbPreset(store, 'steel');
	expect(deriveSbPreset(store)).toBe('steel');
	expect(SB_PRESETS.steel.sbDensity).toBe('comfortable');
});
```

- [ ] **Step 5: Gates**

Run: `npx jest test/unit/prefs/catalog.test.ts` → 5 PASS.
Run: `npx tsc --noEmit` → 0. **Watch for**: the `DsePrefs` augmentation is program-wide —
if any existing test's fake descriptor now violates a narrowed value space without a
cast, fix the test's value to a legal member (do not widen the catalog).
Run: `npx jest` → expected **1008** (1003 + 5; the seams.test OD-5 ui pin update from
Step 1c counts as modified, not added).

- [ ] **Step 6: Commit + push**

```bash
git add src/prefs/catalog.ts src/framework/seams/prefs.ts main.ts test/unit/prefs/catalog.test.ts test/dom/framework/seams.test.ts
git commit -m "feat(prefs): D4 preference catalog — DsePrefs augmentation, descriptors, statblock presets"
git push origin d4-prefs
```

---

### Task 3: Presentation hooks — reflect-driven statblock attrs + new CSS (`sb-columns`, `sb-stats`, `reduce-motion`)

The statblock currently stamps `data-dse-density="comfortable"` /
`data-dse-sb-featstyle="card"` **statically on the inner `.dse-sb` card** — those static
values would permanently shadow the reflected root attributes. This task moves the
attribute authority to `prefs.reflect` (root) and builds the two missing statblock hooks
plus `reduce-motion`.

**Files:**
- Modify: `src/elements/statblock/view.ts`, `styles-source.css`,
  `test/dom/elements/statblock.test.ts`, `visual-harness/entry.ts` (only if it builds its
  own store — Step 5)
- Create: `test/dom/framework/pref-reflection.test.ts`

**Interfaces:**
- Consumes: the Task 2 catalog (attrs), `prefs.reflect` (pipeline.ts:217 — already called
  on every root; no pipeline change in this task).
- Produces: CSS that reflows on root-level `data-dse-density`, `data-dse-sb-featstyle`,
  `data-dse-sb-columns`, `data-dse-sb-stats` (statblock-scoped) and
  `data-dse-reduce-motion` (all elements). At catalog defaults the rendered output is
  pixel-identical to today.

- [ ] **Step 1: Remove the static stamps from the statblock view**

In `src/elements/statblock/view.ts` delete these two lines (and the "D4 pref hooks" 3-line
comment directly above them):

```ts
		card.setAttribute('data-dse-density', 'comfortable');
		card.setAttribute('data-dse-sb-featstyle', 'card');
```

Replace the deleted comment with:

```ts
		// D4 (Plan 13 Task 3): density/featstyle/columns/stats arrive on the ELEMENT
		// ROOT as data-dse-* via the pipeline's prefs.reflect() — nothing to stamp
		// here. CSS keys off [data-dse-element='statblock'][data-dse-…] descendants.
```

Also update the file-header comment lines that mention the static hooks (lines ~7 and
~28-29): the root, not the card, now carries the pref attrs.

- [ ] **Step 2: Re-scope + extend the statblock pref CSS**

In `styles-source.css`, replace the two existing pref blocks (the `/* -- density pref
… */` block through the end of the `/* -- feature-style pref … */` block, currently the
`.dse-sb[data-dse-density='compact']` / `.dse-sb[data-dse-sb-featstyle='flat']` rules at
~1552-1575) with:

```css
/* -- density pref (D4 Plan 13: reflected as data-dse-density on the ELEMENT ROOT
   by prefs.reflect(); 'comfortable' = default = the pre-D4 look, expressed by the
   base rules above — only 'compact' needs selectors) -- */
[data-dse-element='statblock'][data-dse-density='compact'] .dse-sb {
	padding: calc(var(--dse-pad) / 2);
	padding-top: 0.25rem;
}
[data-dse-element='statblock'][data-dse-density='compact'] .dse-sb__item-v {
	font-size: var(--font-ui-large);
}
[data-dse-element='statblock'][data-dse-density='compact'] .dse-sb__items {
	padding-bottom: 0.25rem;
}
[data-dse-element='statblock'][data-dse-density='compact'] .dse-sb__chars {
	padding: 0.25rem 0;
	margin-top: 0.25rem;
}

/* -- feature-style pref: 'card' = the shared .dse-feature card rhythm (default);
   'flat' tightens the list into a dense hoverless flat run -- */
[data-dse-element='statblock'][data-dse-sb-featstyle='flat'] .dse-feature__nested > .dse-feature {
	padding-top: 0.25rem;
	padding-bottom: 0.25rem;
}
[data-dse-element='statblock'][data-dse-sb-featstyle='flat'] .dse-feature__nested > .dse-feature:hover {
	background-color: transparent;
}

/* -- columns pref (D4 §3.1, the site data-sb-wide analogue): 'wide' lays the
   statblock's TOP-LEVEL feature list side-by-side on wide panes; nested feature
   groups keep single column. auto-fill so narrow panes degrade to one column. -- */
[data-dse-element='statblock'][data-dse-sb-columns='wide'] .dse-sb > .dse-feature__nested {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr));
	column-gap: 1rem;
	align-items: start;
}

/* -- secondary-stats pref (the site data-sb-meta analogue): 'grid' = the default
   evenly-spread item row; 'ledger' stacks Size/Speed/Stamina/Stability/Free Strike
   as hairline label-left / value-right rows -- */
[data-dse-element='statblock'][data-dse-sb-stats='ledger'] .dse-sb__items {
	display: block;
	padding-bottom: 0.25rem;
}
[data-dse-element='statblock'][data-dse-sb-stats='ledger'] .dse-sb__item {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	text-align: left;
	border-bottom: 1px solid var(--dse-rule);
	padding: 0.15rem 0;
}
[data-dse-element='statblock'][data-dse-sb-stats='ledger'] .dse-sb__item-v {
	font-size: var(--font-ui-medium);
	order: 2;
}
[data-dse-element='statblock'][data-dse-sb-stats='ledger'] .dse-sb__item-l {
	order: 1;
	font-size: inherit;
}
```

Then, directly after the `[data-dse-readonly]::after` badge block (~line 341-345), add:

```css
/* D4 (Plan 13) — reduce-motion pref: an EXPLICIT override on top of the OS
   prefers-reduced-motion media query (which component CSS honors regardless).
   Reflected value-mode: [data-dse-reduce-motion="true"|"false"] on every root. */
[data-dse-element][data-dse-reduce-motion='true'],
[data-dse-element][data-dse-reduce-motion='true'] *,
[data-dse-element][data-dse-reduce-motion='true'] *::before,
[data-dse-element][data-dse-reduce-motion='true'] *::after {
	transition: none !important;
	animation: none !important;
}
```

- [ ] **Step 3: Update the statblock test pins**

Run: `grep -n "data-dse-density\|data-dse-sb-featstyle" test/dom/elements/statblock.test.ts`
Every assertion that pins the static card attributes changes to: (a) the `.dse-sb` card
carries NO `data-dse-density`/`data-dse-sb-featstyle` attribute, and (b) the element ROOT
(`[data-dse-element='statblock']`) carries the reflected defaults
(`data-dse-density="comfortable"`, `data-dse-sb-featstyle="card"`,
`data-dse-sb-columns="single"`, `data-dse-sb-stats="grid"`). Note: those tests build
their own pipeline deps — make the test's store catalog-complete by adding
`store.describe(DSE_PREF_DESCRIPTORS)` (import from `../../../src/prefs/catalog`) where
the test constructs `createPreferenceStore(...)`, mirroring what
`initializeElementFrameworkV2` now does.

- [ ] **Step 4: Write `test/dom/framework/pref-reflection.test.ts`**

```ts
// Plan 13 Task 3 (D4 §1.1/§3) — presentation prefs are ATTRIBUTE-DRIVEN: the
// pipeline reflects catalog attrs onto every element root at first paint and
// re-stamps live on prefs.set — CSS reflows, no re-render. Also pins the CSS
// hooks themselves (grep-pins, theme-print.test.ts style) so a selector rename
// breaks CI, not a user's vault.
import * as fs from 'fs';
import * as path from 'path';
import { createPreferenceStore } from '../../../src/framework/seams/prefs';
import type { PrefsStorage } from '../../../src/framework/seams/prefs';
import { DSE_PREF_DESCRIPTORS } from '../../../src/prefs/catalog';
import { Component, flushAsync } from '../../mocks/obsidian';

const sheet = fs.readFileSync(path.join(__dirname, '../../../styles-source.css'), 'utf8');

function makeStore() {
	const storage: PrefsStorage = { get: async () => undefined, set: async () => {} };
	const store = createPreferenceStore(storage);
	store.describe(DSE_PREF_DESCRIPTORS);
	return store;
}

test('reflect() stamps every catalog presentation default on a root (first-paint contract)', () => {
	const store = makeStore();
	const owner = new Component();
	owner.load();
	const root = document.createElement('div');
	store.reflect(root, owner);
	expect(root.getAttribute('data-dse-density')).toBe('comfortable');
	expect(root.getAttribute('data-dse-sb-featstyle')).toBe('card');
	expect(root.getAttribute('data-dse-sb-columns')).toBe('single');
	expect(root.getAttribute('data-dse-sb-stats')).toBe('grid');
	expect(root.getAttribute('data-dse-reduce-motion')).toBe('false');
	expect(root.getAttribute('data-dse-print')).toBe('off');
	expect(root.getAttribute('data-dse-portraits')).toBe('on');
	expect(root.hasAttribute('data-dse-theme')).toBe(false); // ThemeService's attribute, never reflect's
});

test('a live prefs.set re-stamps every reflected root IN PLACE (reflow, not re-render)', async () => {
	const store = makeStore();
	const owner = new Component();
	owner.load();
	const a = document.createElement('div');
	const b = document.createElement('div');
	store.reflect(a, owner);
	store.reflect(b, owner);
	await store.set('sbDensity', 'compact');
	await flushAsync(1);
	expect(a.getAttribute('data-dse-density')).toBe('compact');
	expect(b.getAttribute('data-dse-density')).toBe('compact');
});

test('styles-source.css keys the statblock pref hooks off the ROOT attributes (built vocabulary)', () => {
	expect(sheet).toMatch(/\[data-dse-element='statblock'\]\[data-dse-density='compact'\] \.dse-sb/);
	expect(sheet).toMatch(/\[data-dse-element='statblock'\]\[data-dse-sb-featstyle='flat'\]/);
	expect(sheet).toMatch(/\[data-dse-element='statblock'\]\[data-dse-sb-columns='wide'\] \.dse-sb > \.dse-feature__nested/);
	expect(sheet).toMatch(/\[data-dse-element='statblock'\]\[data-dse-sb-stats='ledger'\] \.dse-sb__item/);
	expect(sheet).toMatch(/\[data-dse-element\]\[data-dse-reduce-motion='true'\]/);
	// the OLD card-scoped selectors must be gone (they'd shadow the reflected root):
	expect(sheet).not.toMatch(/\.dse-sb\[data-dse-density/);
	expect(sheet).not.toMatch(/\.dse-sb\[data-dse-sb-featstyle/);
});

test('defaults are CSS no-ops: no selector exists for any catalog default value (legacy fidelity)', () => {
	expect(sheet).not.toMatch(/data-dse-density='comfortable'/);
	expect(sheet).not.toMatch(/data-dse-sb-featstyle='card'/);
	expect(sheet).not.toMatch(/data-dse-sb-columns='single'/);
	expect(sheet).not.toMatch(/data-dse-sb-stats='grid'/);
});
```

- [ ] **Step 5: Harness store parity (conditional)**

Run: `grep -n "createPreferenceStore\|initializeElementFrameworkV2" visual-harness/entry.ts`
If the harness constructs its own `createPreferenceStore(...)` (rather than going through
`initializeElementFrameworkV2`), add `prefs.describe(DSE_PREF_DESCRIPTORS)` beside it
(same import) so `npm run shots` renders with the reflected defaults and can later drive
pref attrs. If it uses `initializeElementFrameworkV2`, nothing to do.

- [ ] **Step 6: Gates + visual check**

Run: `npx tsc --noEmit` → 0. Run: `npx jest` → expected **1012** (1008 + 4).
Visual (bonus but do it): `npm run shots -- --element=statblock` → Read
`visual-harness/shots/statblock--steel-dark.png` and confirm it matches the pre-task look
(defaults = today). Then temporarily eyeball a non-default: in the harness page or a
scratch note this is Task 4's job — skip if the harness can't set prefs yet; the jsdom
attr tests above carry the gate.

- [ ] **Step 7: Commit + push**

```bash
git add src/elements/statblock/view.ts styles-source.css test/dom/elements/statblock.test.ts test/dom/framework/pref-reflection.test.ts visual-harness/entry.ts
git commit -m "feat(prefs): root-reflected statblock pref attrs + sb-columns/sb-stats/reduce-motion CSS (D4)"
git push origin d4-prefs
```

(Drop `visual-harness/entry.ts` from the add if Step 5 was a no-op.)

---

### Task 4: The settings tab — descriptor-driven renderer, presets, resets; temporary commands deleted

**Files:**
- Rewrite: `src/views/SettingsTab.ts` (class `MyPluginSettingTab` → `DseSettingTab`)
- Modify: `main.ts` (new tab class; DELETE the `dse-cycle-theme` and
  `dse-toggle-print-preview` commands + their now-unused imports),
  `test/mocks/obsidian-core.ts` (recording `Setting` fakes)
- Delete: `test/dom/framework/review-commands.test.ts` (tests the deleted commands; −2)
- Create: `test/dom/views/settings-tab.test.ts`

**Interfaces:**
- Consumes: `prefs.descriptors()` + `prefUi` + `GROUP_ORDER` + preset helpers (Task 2);
  Obsidian `Setting`/`PluginSettingTab` (real typings at tsc; the upgraded mock in jsdom).
- Produces: the composed settings tab — descriptor-rendered pref sections (Appearance /
  Statblock display / Element defaults; Rolling+References hidden) with live apply
  (`onChange → prefs.set().catch`), the preset dropdown (derives `custom`), per-group +
  global reset; the operational Compendium/Initiative sections carried over verbatim
  (F2's territory, untouched behavior). The two temporary commands are GONE — the tab is
  their replacement (theme row; print-preview toggle, now persisted and auto-applied to
  future renders via reflect).

- [ ] **Step 1: Upgrade the `Setting` mock to a recording fake**

In `test/mocks/obsidian-core.ts`, replace the `chain` proxy + `Setting` class block
(currently the `// Infinitely-chainable stub …` comment through the end of `class
Setting`) with:

```ts
// Recording Setting fakes (Plan 13 Task 4): the settings tab is driven by REAL
// jsdom tests, so the fakes record names/options/values and expose trigger() to
// simulate user input. Only src/views/SettingsTab.ts constructs Setting.
class FakeSettingComponent {
	disabled = false;
	protected changeCb: ((value: any) => any) | null = null;
	onChange(cb: (value: any) => any): this {
		this.changeCb = cb;
		return this;
	}
	setDisabled(disabled: boolean): this {
		this.disabled = disabled;
		return this;
	}
	setTooltip(_tooltip: string): this {
		return this;
	}
}
export class FakeToggle extends FakeSettingComponent {
	value = false;
	setValue(value: boolean): this {
		this.value = value;
		return this;
	}
	/** Test helper: simulate a user flip (setValue + fire onChange). */
	trigger(value: boolean): void {
		this.value = value;
		this.changeCb?.(value);
	}
}
export class FakeDropdown extends FakeSettingComponent {
	value = '';
	readonly options: { value: string; label: string }[] = [];
	addOption(value: string, label: string): this {
		this.options.push({ value, label });
		return this;
	}
	addOptions(options: Record<string, string>): this {
		for (const [value, label] of Object.entries(options)) this.addOption(value, label);
		return this;
	}
	setValue(value: string): this {
		this.value = value;
		return this;
	}
	trigger(value: string): void {
		this.value = value;
		this.changeCb?.(value);
	}
}
export class FakeText extends FakeSettingComponent {
	value = '';
	placeholder = '';
	setPlaceholder(placeholder: string): this {
		this.placeholder = placeholder;
		return this;
	}
	setValue(value: string): this {
		this.value = value;
		return this;
	}
	trigger(value: string): void {
		this.value = value;
		this.changeCb?.(value);
	}
}
export class FakeButton {
	text = '';
	icon = '';
	cta = false;
	private clickCb: (() => any) | null = null;
	setButtonText(text: string): this {
		this.text = text;
		return this;
	}
	setIcon(icon: string): this {
		this.icon = icon;
		return this;
	}
	setCta(): this {
		this.cta = true;
		return this;
	}
	setTooltip(_tooltip: string): this {
		return this;
	}
	onClick(cb: () => any): this {
		this.clickCb = cb;
		return this;
	}
	click(): void {
		this.clickCb?.();
	}
}
export class Setting {
	/** All Settings constructed since the last reset — tests read rows from here
	 *  (reset with Setting.created.length = 0 in beforeEach). */
	static created: Setting[] = [];
	settingEl: HTMLElement | null;
	name = '';
	desc = '';
	heading = false;
	readonly toggles: FakeToggle[] = [];
	readonly dropdowns: FakeDropdown[] = [];
	readonly texts: FakeText[] = [];
	readonly buttons: FakeButton[] = [];
	readonly extraButtons: FakeButton[] = [];
	constructor(containerEl: any) {
		this.settingEl =
			typeof document !== 'undefined' && containerEl?.createDiv
				? containerEl.createDiv({ cls: 'setting-item' })
				: null;
		Setting.created.push(this);
	}
	setName(name: string): this {
		this.name = name;
		this.settingEl?.setAttribute('data-setting-name', name);
		return this;
	}
	setDesc(desc: string): this {
		this.desc = desc;
		return this;
	}
	setHeading(): this {
		this.heading = true;
		return this;
	}
	addText(cb?: (text: FakeText) => any): this {
		const c = new FakeText();
		this.texts.push(c);
		cb?.(c);
		return this;
	}
	addToggle(cb?: (toggle: FakeToggle) => any): this {
		const c = new FakeToggle();
		this.toggles.push(c);
		cb?.(c);
		return this;
	}
	addButton(cb?: (button: FakeButton) => any): this {
		const c = new FakeButton();
		this.buttons.push(c);
		cb?.(c);
		return this;
	}
	addExtraButton(cb?: (button: FakeButton) => any): this {
		const c = new FakeButton();
		this.extraButtons.push(c);
		cb?.(c);
		return this;
	}
	addDropdown(cb?: (dropdown: FakeDropdown) => any): this {
		const c = new FakeDropdown();
		this.dropdowns.push(c);
		cb?.(c);
		return this;
	}
}
```

Run the full suite now (`npx jest`) — must still be green (nothing else constructs
`Setting`); fix any surprise consumer by extending the fake, never by weakening it.

- [ ] **Step 2: Rewrite `src/views/SettingsTab.ts`**

Replace the whole file with:

```ts
// src/views/SettingsTab.ts — D4 §4 (Plan 13): the composed settings tab.
//
// Two owners, one tab: the PREF SECTIONS are GENERATED from the descriptor list
// (adding a pref = adding a descriptor in src/prefs/catalog.ts — no hand-wiring),
// then the OPERATIONAL sections (Compendium downloader, Initiative tracker) are
// hand-written carry-overs, F2's territory (F2 §3.4 reworks them; verbatim here).
//
// Live apply: every control's onChange calls prefs.set(); set() notifies
// subscribers synchronously (Task 1), so prefs.reflect() re-stamps every mounted
// element root and CSS reflows behind the open settings dialog — no Apply button,
// no re-render. This replaces the D3 temporary commands (dse-cycle-theme,
// dse-toggle-print-preview), deleted from main.ts in this same task.
import { App, Component, PluginSettingTab, Setting } from 'obsidian';
import DrawSteelAdmonitionPlugin from 'main';
import { CompendiumDownloader } from '@utils/CompendiumDownloader';
import type { PreferenceStore, PrefDescriptor, DsePrefs } from '@/framework/seams/prefs';
import {
	GROUP_ORDER,
	applySbPreset,
	deriveSbPreset,
	prefUi,
	type SbPresetId,
} from '@/prefs/catalog';

/** Structural slice of DropdownComponent the preset re-derivation needs. */
interface ValueControl {
	setValue(value: string): unknown;
}

export class DseSettingTab extends PluginSettingTab {
	plugin: DrawSteelAdmonitionPlugin;
	/** Owns per-display() mounted children (the Task 6 statblock preview);
	 *  recycled on every display(), unloaded on hide(). */
	private displayOwner: Component | null = null;
	private presetDropdown: ValueControl | null = null;

	constructor(app: App, plugin: DrawSteelAdmonitionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.presetDropdown = null;
		this.recycleOwner(true);
		const prefs = this.plugin.frameworkV2?.services.prefs;
		if (prefs) this.renderPrefSections(containerEl, prefs);
		this.renderOperationalSections(containerEl);
	}

	hide(): void {
		this.recycleOwner(false);
	}

	private recycleOwner(recreate: boolean): void {
		this.displayOwner?.unload();
		this.displayOwner = null;
		if (recreate) {
			this.displayOwner = new Component();
			this.displayOwner.load();
		}
	}

	// —— D4 §4.1: one loop drives the whole pref UI ——
	private renderPrefSections(containerEl: HTMLElement, prefs: PreferenceStore): void {
		const groups = new Map<string, PrefDescriptor[]>();
		for (const descriptor of prefs.descriptors()) {
			const ui = prefUi(descriptor);
			if (!ui || ui.hidden) continue; // hidden = consumer (D5/F2) not shipped
			let members = groups.get(ui.group);
			if (!members) groups.set(ui.group, (members = []));
			members.push(descriptor);
		}
		for (const groupName of GROUP_ORDER) {
			const members = groups.get(groupName);
			if (!members?.length) continue;
			new Setting(containerEl)
				.setName(groupName)
				.setHeading()
				.addExtraButton((button) =>
					button
						.setIcon('rotate-ccw')
						.setTooltip('Reset this section to defaults')
						.onClick(() => void this.resetDescriptors(prefs, members)),
				);
			if (groupName === 'Statblock display') this.renderPresetControl(containerEl, prefs);
			for (const descriptor of members) this.renderRow(containerEl, prefs, descriptor);
		}
		new Setting(containerEl).addButton((button) =>
			button
				.setButtonText('Reset all preferences')
				.onClick(() =>
					void this.resetDescriptors(
						prefs,
						prefs.descriptors().filter((descriptor) => prefUi(descriptor) !== undefined),
					),
				),
		);
	}

	private async resetDescriptors(
		prefs: PreferenceStore,
		descriptors: readonly PrefDescriptor[],
	): Promise<void> {
		try {
			for (const descriptor of descriptors) {
				await prefs.set(descriptor.key, descriptor.default);
			}
		} catch (error) {
			console.error('Draw Steel Elements: failed to reset preferences', error);
		}
		this.display();
	}

	// —— D4 §3.2: the preset bundle dropdown (derived label, never stored) ——
	private renderPresetControl(containerEl: HTMLElement, prefs: PreferenceStore): void {
		new Setting(containerEl)
			.setName('Preset')
			.setDesc('A bundle of the statblock options below. Adjusting any single option re-derives "Custom".')
			.addDropdown((dropdown) => {
				dropdown.addOption('steel', 'Steel Card');
				dropdown.addOption('sourcebook', 'Sourcebook');
				dropdown.addOption('index', 'Index Card');
				dropdown.addOption('custom', 'Custom');
				dropdown.setValue(deriveSbPreset(prefs));
				dropdown.onChange((value) => {
					if (value === 'custom') return; // derived label, not a settable state
					applySbPreset(prefs, value as SbPresetId)
						.then(() => this.display())
						.catch((error) =>
							console.error('Draw Steel Elements: failed to apply statblock preset', error),
						);
				});
				this.presetDropdown = dropdown;
			});
	}

	private renderRow(
		containerEl: HTMLElement,
		prefs: PreferenceStore,
		descriptor: PrefDescriptor,
	): void {
		const ui = prefUi(descriptor);
		if (!ui) return;
		const setting = new Setting(containerEl).setName(ui.label);
		if (ui.help) setting.setDesc(ui.help);
		const save = (value: DsePrefs[keyof DsePrefs]): void => {
			prefs
				.set(descriptor.key, value)
				.catch((error) =>
					console.error(
						`Draw Steel Elements: failed to save preference "${String(descriptor.key)}"`,
						error,
					),
				);
			if (ui.inPreset) this.presetDropdown?.setValue(deriveSbPreset(prefs));
		};
		switch (ui.control) {
			case 'toggle': {
				// A toggle over a string-typed pref is the 'on'|'off' mapping (PrefUi
				// doc): checked ⇔ 'on'. Boolean prefs map directly.
				const onOff = typeof descriptor.default === 'string';
				setting.addToggle((toggle) =>
					toggle
						.setValue(onOff ? prefs.get(descriptor.key) === 'on' : prefs.get(descriptor.key) === true)
						.onChange((value) =>
							save((onOff ? (value ? 'on' : 'off') : value) as DsePrefs[keyof DsePrefs]),
						),
				);
				break;
			}
			case 'select': {
				setting.addDropdown((dropdown) => {
					for (const option of ui.options ?? []) dropdown.addOption(option.value, option.label);
					dropdown
						.setValue(String(prefs.get(descriptor.key)))
						.onChange((value) => save(value as DsePrefs[keyof DsePrefs]));
				});
				break;
			}
			case 'text': {
				setting.addText((text) =>
					text
						.setValue(String(prefs.get(descriptor.key)))
						.onChange((value) => save(value as DsePrefs[keyof DsePrefs])),
				);
				break;
			}
		}
	}

	// —— Operational sections: verbatim carry-over of the pre-D4 tab (F2 reworks) ——
	private renderOperationalSections(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: 'Draw Steel Compendium Downloader' });
		containerEl.createEl('p', {
			text: 'Important: The Compendium will download to a specific directory in your vault and delete any files in that directory',
		});

		new Setting(containerEl)
			.setName('Release Tag (Optional)')
			.setDesc('Specific release tag to download. Leave empty to download the latest release.')
			.addText((text) =>
				text
					.setPlaceholder('v1.0.0')
					.setValue(this.plugin.settings.compendiumReleaseTag ?? '')
					.onChange(async (value) => {
						this.plugin.settings.compendiumReleaseTag = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Destination Directory')
			.setDesc('Directory within your vault to extract the Compendium contents to.  THIS DIRECTORY WILL BE WIPED CLEAN!')
			.addText((text) =>
				text
					.setPlaceholder('ImportedContent')
					.setValue(this.plugin.settings.compendiumDestinationDirectory)
					.onChange(async (value) => {
						this.plugin.settings.compendiumDestinationDirectory = value;
						await this.plugin.saveSettings();
					}),
			);

		const downloadButton = containerEl.createEl('button', {
			cls: 'settings-action-button',
			text: 'Download Compendium',
		});
		downloadButton.addEventListener('click', () => {
			return new CompendiumDownloader(
				this.app,
				this.plugin.githubOwner,
				this.plugin.githubRepo,
				undefined,
			).downloadAndExtractRelease(
				this.plugin.settings.compendiumReleaseTag,
				this.plugin.settings.compendiumDestinationDirectory,
			);
		});

		containerEl.createEl('h3', { text: 'Initiative Tracker' });

		new Setting(containerEl)
			.setName('Default Creature Image Path')
			.setDesc('Default image to use for creatures in the initiative tracker if not specified')
			.addText((text) =>
				text
					.setPlaceholder('path/to/image.png')
					.setValue(this.plugin.settings.defaultImagePath)
					.onChange(async (value) => {
						this.plugin.settings.defaultImagePath = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
```

- [ ] **Step 3: `main.ts` — swap the tab, delete the temporary commands**

- Change the import `import {MyPluginSettingTab} from "@views/SettingsTab";` →
  `import {DseSettingTab} from "@views/SettingsTab";` and the registration to
  `this.addSettingTab(new DseSettingTab(this.app, this));`.
- DELETE both temporary command registrations wholesale: the `dse-cycle-theme`
  `addCommand` block (with its 8-line "TEMPORARY review/dev affordance" comment) and the
  `dse-toggle-print-preview` block (with its comment) — the spec and both comments say D4
  replaces them; the tab's theme row and print-preview toggle are the replacements (and
  the toggle now persists AND auto-applies to later-rendered blocks via reflect, fixing
  the command's documented limitation).
- Remove the now-unused imports this leaves behind: `ThemeServiceInternal`, `DseThemeId`
  (keep `ThemeService` — still used by `ElementFrameworkV2Services`; keep `Notice` —
  still used in the schema catch).
- Delete the command test file: `git rm test/dom/framework/review-commands.test.ts`
  (its 2 tests covered only the deleted commands; the settings-tab suite below is the
  replacement coverage).

- [ ] **Step 4: Write `test/dom/views/settings-tab.test.ts`**

```ts
// Plan 13 Task 4 (D4 §4) — the descriptor-driven settings tab, driven as a REAL
// class against the recording Setting mock. Live-apply is exercised end-to-end:
// control trigger → prefs.set → reflect re-stamps a mounted root, no re-render.
// Replaces test/dom/framework/review-commands.test.ts (the D3 temporary commands
// this tab supersedes).
import DrawSteelAdmonitionPlugin from 'main';
import { DseSettingTab } from '@views/SettingsTab';
import { App, Plugin, Setting, Component, flushAsync } from '../../mocks/obsidian';
import { SB_PRESETS } from '../../../src/prefs/catalog';

function rowByName(name: string): Setting {
	const row = Setting.created.find((s) => s.name === name);
	if (!row) throw new Error(`no Setting row named "${name}" (have: ${Setting.created.map((s) => s.name).join(', ')})`);
	return row;
}

async function makeLoadedPlugin(): Promise<DrawSteelAdmonitionPlugin> {
	const app = new App();
	const plugin = new DrawSteelAdmonitionPlugin(app as never, { id: 'draw-steel-elements', version: 'test' } as never);
	await plugin.onload();
	return plugin;
}

describe('D4 §4 — DseSettingTab', () => {
	beforeEach(() => {
		Setting.created.length = 0;
	});

	test('renders the visible groups in order and NO hidden (D5/F2) rows', async () => {
		const plugin = await makeLoadedPlugin();
		const tab = new DseSettingTab(plugin.app as never, plugin);
		tab.display();
		const headings = Setting.created.filter((s) => s.heading).map((s) => s.name);
		expect(headings).toEqual(['Appearance', 'Statblock display', 'Element defaults']);
		const names = Setting.created.map((s) => s.name);
		expect(names).not.toContain('Roller');
		expect(names).not.toContain('Fall back to steelcompendium.io links');
		// operational carry-over intact:
		expect(names).toContain('Release Tag (Optional)');
		expect(names).toContain('Default Creature Image Path');
	});

	test('theme row: the builtin descriptor renders with OD-5 labels and live-applies to a mounted root', async () => {
		const plugin = await makeLoadedPlugin();
		const prefs = plugin.frameworkV2!.services.prefs;
		const owner = new Component();
		owner.load();
		const root = document.createElement('div');
		plugin.frameworkV2!.services.theme.apply(root, owner);
		const tab = new DseSettingTab(plugin.app as never, plugin);
		tab.display();
		const dd = rowByName('Theme').dropdowns[0];
		expect(dd.options).toEqual([
			{ value: 'legacy', label: 'Match Obsidian (Legacy)' },
			{ value: 'steel', label: 'Steel' },
		]);
		dd.trigger('legacy');
		await flushAsync(1);
		expect(prefs.get('theme')).toBe('legacy');
		expect(root.getAttribute('data-dse-theme')).toBe('legacy');
	});

	test('an on/off toggle row (print preview) maps checked ⇔ "on"', async () => {
		const plugin = await makeLoadedPlugin();
		const prefs = plugin.frameworkV2!.services.prefs;
		const tab = new DseSettingTab(plugin.app as never, plugin);
		tab.display();
		const toggle = rowByName('Print preview').toggles[0];
		expect(toggle.value).toBe(false); // default 'off'
		toggle.trigger(true);
		await flushAsync(1);
		expect(prefs.get('printPreview')).toBe('on');
	});

	test('a select row (Density) live-applies: a REFLECTED root re-stamps behind the tab', async () => {
		const plugin = await makeLoadedPlugin();
		const prefs = plugin.frameworkV2!.services.prefs;
		const owner = new Component();
		owner.load();
		const root = document.createElement('div');
		prefs.reflect(root, owner);
		const tab = new DseSettingTab(plugin.app as never, plugin);
		tab.display();
		rowByName('Density').dropdowns[0].trigger('compact');
		await flushAsync(1);
		expect(prefs.get('sbDensity')).toBe('compact');
		expect(root.getAttribute('data-dse-density')).toBe('compact');
	});

	test('preset dropdown: defaults derive "steel"; picking "index" writes the whole bundle', async () => {
		const plugin = await makeLoadedPlugin();
		const prefs = plugin.frameworkV2!.services.prefs;
		const tab = new DseSettingTab(plugin.app as never, plugin);
		tab.display();
		const preset = rowByName('Preset').dropdowns[0];
		expect(preset.value).toBe('steel');
		preset.trigger('index');
		await flushAsync(2);
		for (const [key, value] of Object.entries(SB_PRESETS.index)) {
			expect(prefs.get(key as never)).toBe(value);
		}
	});

	test('twiddling one preset member re-derives "custom" on the preset dropdown', async () => {
		const plugin = await makeLoadedPlugin();
		const tab = new DseSettingTab(plugin.app as never, plugin);
		tab.display();
		const preset = rowByName('Preset').dropdowns[0];
		rowByName('Secondary stats').dropdowns[0].trigger('ledger');
		await flushAsync(1);
		expect(preset.value).toBe('sourcebook'); // ledger alone = the sourcebook bundle
		rowByName('Density').dropdowns[0].trigger('compact');
		await flushAsync(1);
		expect(preset.value).toBe('custom');
	});

	test('per-group reset (heading extra-button) restores that group; sparse store empties', async () => {
		const plugin = await makeLoadedPlugin();
		const prefs = plugin.frameworkV2!.services.prefs;
		const tab = new DseSettingTab(plugin.app as never, plugin);
		tab.display();
		rowByName('Density').dropdowns[0].trigger('compact');
		await flushAsync(1);
		const heading = Setting.created.find((s) => s.heading && s.name === 'Statblock display')!;
		heading.extraButtons[0].click();
		await flushAsync(2);
		expect(prefs.get('sbDensity')).toBe('comfortable');
		expect(plugin.settings.prefs).toEqual({}); // OD-D4-4: default ⇒ deleted from disk shape
	});

	test('"Reset all preferences" returns every pref (incl. theme) to its default', async () => {
		const plugin = await makeLoadedPlugin();
		const prefs = plugin.frameworkV2!.services.prefs;
		const tab = new DseSettingTab(plugin.app as never, plugin);
		tab.display();
		rowByName('Theme').dropdowns[0].trigger('legacy');
		rowByName('Reduce motion').toggles[0].trigger(true);
		await flushAsync(1);
		const resetAll = Setting.created.find((s) => s.buttons.some((b) => b.text === 'Reset all preferences'))!;
		resetAll.buttons[0].click();
		await flushAsync(2);
		expect(prefs.get('theme')).toBe('steel');
		expect(prefs.get('reduceMotion')).toBe(false);
	});

	test('the D3 temporary commands are gone from onload', async () => {
		const plugin = await makeLoadedPlugin();
		const addCommand = jest.spyOn(plugin, 'addCommand' as never);
		// onload already ran in makeLoadedPlugin; re-run registration on a fresh plugin
		const app2 = new App();
		const plugin2 = new DrawSteelAdmonitionPlugin(app2 as never, { id: 'draw-steel-elements', version: 'test' } as never);
		const ids: string[] = [];
		jest.spyOn(plugin2, 'addCommand' as never).mockImplementation(((cmd: { id: string }) => {
			ids.push(cmd.id);
		}) as never);
		await plugin2.onload();
		expect(ids).toContain('download-data-md-dse');
		expect(ids).not.toContain('dse-cycle-theme');
		expect(ids).not.toContain('dse-toggle-print-preview');
		addCommand.mockRestore();
	});
});
```

(If `flushAsync` counts need one more round for the debounced storage in any assertion,
bump the rounds — the assertions above only read the in-memory store, which is
synchronous after Task 1, so `flushAsync(1)` is belt.)

- [ ] **Step 5: Gates**

Run: `npx tsc --noEmit` → 0 (the tab compiles against REAL obsidian typings — fix any API
misuse in the tab, not by widening the mock).
Run: `npx jest` → expected **1019** (1012 − 2 deleted + 9 new).

- [ ] **Step 6: Ground-truth check (optional bonus)**

If time permits: `npm run build-no-check`, then use the F5 camera's spawned Obsidian
(`visual-harness/obsidian-camera.mjs` mechanics) or a manual Obsidian session to open
Settings → Draw Steel Elements and screenshot the tab; confirm groups/rows/preset render
and a Density flip visibly reflows an open statblock note. Note the result (or that it
was skipped) in the task report.

- [ ] **Step 7: Commit + push**

```bash
git add src/views/SettingsTab.ts main.ts test/mocks/obsidian-core.ts test/dom/views/settings-tab.test.ts
git rm test/dom/framework/review-commands.test.ts
git commit -m "feat(prefs): descriptor-driven settings tab with presets + resets; delete D3 temp commands (D4)"
git push origin d4-prefs
```

---

### Task 5: Behavioral prefs (collapse defaults) + per-block `prefs:` overrides

**Files:**
- Modify: `src/model/ComponentWrapper.ts`, `src/model/Skills.ts` (constructor param
  widening only, if tsc requires), `src/model/StaminaBar.ts` (same),
  `src/elements/skills/view.ts`, `src/elements/stamina-bar/view.ts`,
  `src/prefs/catalog.ts` (the `resolveCollapsePrefs` helper), `src/framework/pipeline.ts`
- Create: `src/framework/prefOverrides.ts`, `test/dom/framework/pref-overrides.test.ts`
- Possibly touch: `test/dom/elements/skills.test.ts`, `test/dom/elements/stamina-bar.test.ts`
  (only if a pin assumed the hard-coded defaults — the defaults are unchanged, so
  failures here mean a real bug)

**Interfaces:**
- Consumes: `prefs.descriptors()` (validation), `prefs.subscribe` (the OD-D4-3a pin),
  `view.setSerializer` (the round-trip wrap), `ElementView`'s `protected cx`.
- Produces: `resolveCollapsePrefs(model, prefs)` — block key > global pref > default;
  `extractPrefOverrides(rawData, prefs)` (pops the reserved `prefs:` map BEFORE schema
  validation; unknown/behavioral keys `console.warn` + ignored — reconciliation delta 8);
  `applyPrefOverrides(root, owner, overrides, prefs)` (stamps + pins);
  `withPrefOverrides(serialize, overrides)` (re-emits the map so persisted elements never
  drop it — delta 9).

- [ ] **Step 1: `resolveCollapsePrefs` in the catalog**

Append to `src/prefs/catalog.ts`:

```ts
/**
 * D4 §1.3 behavioral precedence for the ComponentWrapper contract:
 * block key (`collapsible:` / `collapse_default:`) > global pref > built-in default.
 * The block keys ARE the per-block override for these two prefs — no `prefs:` map
 * entry exists for behavioral keys (extractPrefOverrides warns on them).
 */
export function resolveCollapsePrefs(
	model: { collapsible?: boolean; collapse_default?: boolean },
	prefs: PreferenceStore,
): { collapsible: boolean; collapseDefault: boolean } {
	return {
		collapsible: model.collapsible ?? prefs.get('collapsibleDefault'),
		collapseDefault: model.collapse_default ?? prefs.get('collapseDefault'),
	};
}
```

- [ ] **Step 2: `ComponentWrapper` stops hard-coding the defaults**

In `src/model/ComponentWrapper.ts`, the fields and constructor become:

```ts
    /** D4 §1.3 (Plan 13): undefined = "the block didn't say" — views resolve the
     *  fallback via resolveCollapsePrefs (global pref, then the old hard-coded
     *  true/false as the descriptor defaults). Pre-D4 this constructor forced
     *  `?? true` / `?? false`, which made the global pref unreachable. */
    collapsible?: boolean;
    collapse_default?: boolean;

    // …parseYaml/parse unchanged…

    constructor(collapsible?: boolean, collapse_default?: boolean) {
        this.collapsible = collapsible;
        this.collapse_default = collapse_default;
    }
```

Then run `npx tsc --noEmit` and fix every surfaced consumer by the SAME rule (resolve via
prefs in the view, never re-hard-code): widen `Skills` / `StaminaBar` constructor params
to `boolean | undefined` pass-throughs where needed.

- [ ] **Step 3: Views resolve through the pref**

`src/elements/skills/view.ts` — in `onMount`, replace the `if (!model.collapsible)` /
`open: !model.collapse_default` usages:

```ts
		// D4 §1.3: block key > global pref > default (true/false) — the existing
		// collapsible:/collapse_default: YAML keys ARE the per-block override.
		const { collapsible: isCollapsible, collapseDefault } = resolveCollapsePrefs(model, this.cx.prefs);
		if (!isCollapsible) {
			this.renderGroups(root, model);
			return;
		}
		const wrapper = collapsible(
			root,
			{
				title: WRAPPER_TITLE,
				open: !collapseDefault,
				persist: { session: this.cx.session, blockKey: this.blockKey, slot: WRAPPER_OPEN_SLOT },
			},
			this,
		);
```

(import: `import { resolveCollapsePrefs } from '@/prefs/catalog';`)

`src/elements/stamina-bar/view.ts` — the wrapper line becomes (the legacy quirk stays:
the `collapsible` FLAG is deliberately not honored, only the collapse seed is):

```ts
		const { collapseDefault } = resolveCollapsePrefs(model, this.cx.prefs);
		const wrapper = collapsible(root, { title: WRAPPER_TITLE, open: !collapseDefault }, this);
```

(same import; extend the existing "Legacy quirk preserved" comment with one line: the
`collapse_default` SEED now falls back to the `collapseDefault` pref when the block
doesn't set it.)

- [ ] **Step 4: Write `src/framework/prefOverrides.ts` (complete)**

```ts
// src/framework/prefOverrides.ts — D4 §1.3/§1.4 (Plan 13): the reserved per-block
// `prefs:` override map.
//
// Pipeline-generic (OD-D4-2): the map is popped from the parsed YAML BEFORE schema
// validation (schemas never see the reserved key) and BEFORE def.parse (it never
// enters any semantic model). Presentation keys only — behavioral keys have their
// own per-block spelling (collapsible:/collapse_default:) and are warned+ignored
// here, as are unknown keys (console.warn, NOT an error card — the block renders).
//
// Override-wins mechanics (OD-D4-3a): applyPrefOverrides runs AFTER the pipeline's
// cx.prefs.reflect(root, view), so its subscribe() callbacks register after
// reflect's. On any global change to a pinned key, reflect stamps the global value
// first, then the pin re-stamps the override — deterministic listener order, no F1
// signature change.
//
// Round-trip (persisted elements): replaceSource rewrites the whole block body from
// def.serialize(model), which would silently DROP the author's `prefs:` map on the
// first interaction. withPrefOverrides re-emits it (re-stringified via the same
// stringifyYaml the serializers use, so formatting may normalize — key order and
// values are preserved; blocks WITHOUT a prefs: map are byte-untouched because the
// wrapper is only installed when overrides exist).
import { stringifyYaml } from 'obsidian';
import type { Component } from 'obsidian';
import type { DsePrefs, PreferenceStore } from './seams/prefs';

/**
 * Pops the reserved `prefs:` key off the parsed block data (mutates rawData) and
 * returns the validated presentation-only override bag, or undefined when absent
 * or empty after validation.
 */
export function extractPrefOverrides(
	rawData: unknown,
	prefs: PreferenceStore,
): Partial<DsePrefs> | undefined {
	if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) return undefined;
	const record = rawData as Record<string, unknown>;
	if (!Object.prototype.hasOwnProperty.call(record, 'prefs')) return undefined;
	const bag = record.prefs;
	delete record.prefs;
	if (!bag || typeof bag !== 'object' || Array.isArray(bag)) {
		console.warn('Draw Steel Elements: the per-block `prefs:` key must be a map of preference keys — ignoring it.');
		return undefined;
	}
	const byKey = new Map(prefs.descriptors().map((d) => [d.key as string, d]));
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(bag)) {
		const descriptor = byKey.get(key);
		if (!descriptor) {
			console.warn(`Draw Steel Elements: ignoring unknown per-block pref "${key}".`);
			continue;
		}
		if (!descriptor.attr) {
			console.warn(
				`Draw Steel Elements: "${key}" is not a presentation preference — per-block prefs: only supports attribute-reflected keys (use the block's own keys, e.g. collapsible:, for behavioral overrides).`,
			);
			continue;
		}
		out[key] = value;
	}
	return Object.keys(out).length > 0 ? (out as Partial<DsePrefs>) : undefined;
}

/**
 * Stamps each override on the root and PINS it: a subscribe() registered after
 * reflect()'s re-stamps the override whenever the global value changes underneath
 * it. Auto-unsubscribed with `owner` (F1 §4.5).
 */
export function applyPrefOverrides(
	root: HTMLElement,
	owner: Component,
	overrides: Partial<DsePrefs> | undefined,
	prefs: PreferenceStore,
): void {
	if (!overrides) return;
	const byKey = new Map(prefs.descriptors().map((d) => [d.key as string, d]));
	for (const [key, value] of Object.entries(overrides)) {
		const descriptor = byKey.get(key);
		if (!descriptor?.attr) continue; // extractPrefOverrides already filtered; belt
		const attrName = `data-dse-${descriptor.attr}`;
		const pin = (): void => root.setAttribute(attrName, String(value));
		pin();
		prefs.subscribe(descriptor.key, owner, pin);
	}
}

/** Serializer wrapper: re-emit the author's `prefs:` map ahead of the element body. */
export function withPrefOverrides<M>(
	serialize: (model: M) => string,
	overrides: Partial<DsePrefs>,
): (model: M) => string {
	return (model) => stringifyYaml({ prefs: overrides }) + serialize(model);
}
```

- [ ] **Step 5: Pipeline integration**

In `src/framework/pipeline.ts`:

(a) Import: `import { extractPrefOverrides, applyPrefOverrides, withPrefOverrides } from './prefOverrides';`

(b) Right after `const rawData = runStage('parse', () => parseYaml(source));`:

```ts
			// D4 §1.3 (Plan 13): pop the reserved per-block `prefs:` map BEFORE schema
			// validation (schemas never see the reserved key) and before def.parse
			// (it never enters the semantic model).
			const prefOverrides = extractPrefOverrides(rawData, prefs);
```

(c) The step-6 block becomes:

```ts
			const view = runStage('render', () => def.createView(cx));
			cx.theme.apply(root, view);
			cx.prefs.reflect(root, view);
			// D4 §1.4: pinned AFTER reflect() — registration order makes the
			// override re-stamp last on any global change (OD-D4-3a).
			applyPrefOverrides(root, view, prefOverrides, cx.prefs);
			if (def.serialize) {
				const serialize = def.serialize;
				// D4: a block carrying prefs: must not lose it when replaceSource
				// rewrites the body from serialize(model).
				view.setSerializer(prefOverrides ? withPrefOverrides(serialize, prefOverrides) : serialize);
			}
```

- [ ] **Step 6: Write `test/dom/framework/pref-overrides.test.ts`**

Follow the established element-test convention (see the top of
`test/dom/elements/statblock.test.ts` for the pipeline/host/deps scaffolding — reuse its
`makeHost`/deps pattern verbatim, with the store catalog-described). Tests (9):

```ts
// Plan 13 Task 5 (D4 §1.3/§1.4) — per-block `prefs:` overrides + behavioral
// collapse-default prefs. Scaffolding mirrors test/dom/elements/statblock.test.ts.
```

1. `a statblock block with prefs: {sbDensity: compact} pins data-dse-density="compact"
   on its root while a sibling block shows the global "comfortable"` — mount two
   statblock blocks through the pipeline, one with the `prefs:` map.
2. `the pinned override survives a global prefs.set('sbDensity', …) (reflect stamps, pin
   re-stamps — override wins)` — set global to `compact` then back to `comfortable`;
   the overridden root stays `compact` throughout.
3. `non-overridden keys on the same root still track the global` — same block; set
   `sbStats` to `ledger`; the overridden block's root re-stamps `data-dse-sb-stats`.
4. `an unknown prefs: key warns (console.warn spy) and the block still renders (no
   .dse-error-card)`.
5. `a behavioral prefs: key (collapsibleDefault) warns and is ignored`.
6. `the prefs: key never reaches schema validation or the model` — a statblock with
   `prefs:` renders with no error card even though the statblock schema doesn't declare
   the key.
7. `a PERSISTED element (stamina-bar) with prefs: re-emits the map on write` — mount a
   `ds-stam` block carrying `prefs: {reduceMotion: true}` in the fake vault, trigger a
   persist (reuse the stamina test's click-driven write pattern), then assert the
   rewritten block body still contains `prefs:` and `reduceMotion: true`, plus the
   element's own fields.
8. `skills: collapsibleDefault=false global renders the list bare when the block omits
   collapsible:; the block key beats the pref` — two mounts: one omitting `collapsible`
   (bare), one with `collapsible: true` (wrapper) under the same `false` global.
9. `stamina-bar: collapseDefault=true global seeds the wrapper closed when the block
   omits collapse_default:` — assert `aria-expanded="false"` on the wrapper header.

Write each with concrete YAML fixtures inline (statblock: reuse the `NO_FEATURES`
minimal shape from statblock.test.ts with a `prefs:` map prepended; stamina: the minimal
`ds-stam` body used in stamina-bar.test.ts).

- [ ] **Step 7: Gates**

Run: `npx tsc --noEmit` → 0 (this is where every hard-coded `??` consumer surfaces —
resolve per Step 2's rule).
Run: `npx jest` → expected **1028** (1019 + 9). The existing skills/stamina suites must
stay green untouched — the pref defaults equal the old hard-coded values, so any failure
there is a real regression, not an expected pin-shift.

- [ ] **Step 8: Commit + push**

```bash
git add src/model/ComponentWrapper.ts src/model/Skills.ts src/model/StaminaBar.ts src/elements/skills/view.ts src/elements/stamina-bar/view.ts src/prefs/catalog.ts src/framework/prefOverrides.ts src/framework/pipeline.ts test/dom/framework/pref-overrides.test.ts
git commit -m "feat(prefs): behavioral collapse-default prefs + per-block prefs: overrides with round-trip (D4)"
git push origin d4-prefs
```

---

### Task 6: Live statblock preview in the settings tab

**Files:**
- Create: `src/views/SettingsPreview.ts`, `test/dom/views/settings-preview.test.ts`
- Modify: `src/views/SettingsTab.ts` (mount call), `styles-source.css` (preview container)

**Interfaces:**
- Consumes: `plugin.frameworkV2.registry/pipeline` (the REAL pipeline — reflect drives
  the preview like any note-mounted statblock), the tab's `displayOwner` Component
  (Task 4 built the lifecycle).
- Produces: `mountSettingsPreview(containerEl, plugin, owner)` — a real
  `[data-dse-element='statblock']` root under the Statblock display group that reflows
  live with every pref/preset change and unmounts with the tab.

- [ ] **Step 1: Write `src/views/SettingsPreview.ts`**

```ts
// src/views/SettingsPreview.ts — D4 §4.2 (Plan 13): the live mini-statblock under
// the "Statblock display" settings group. A REAL element root mounted through the
// REAL ElementPipeline, so prefs.reflect() drives it — every pref/preset change
// reflows it in place, exactly like a statblock in a note (no bespoke renderer).
//
// Inert host: canPersist TRUE (statblock is static and never writes; `false` would
// stamp data-dse-readonly and show a misleading "Read-only" badge on the preview),
// replaceSource resolves false, blockKey is unique so session state never collides
// with real blocks. Lifecycle: children attach to `owner` (the tab's per-display()
// Component) — closing/re-rendering the tab unloads the preview and its pref
// subscriptions (F1 §4.5).
import type { Component } from 'obsidian';
import type DrawSteelAdmonitionPlugin from 'main';
import type { BlockHost } from '@/framework/host/BlockHost';

/** The canned preview statblock. VERBATIM copy of the pinned known-good fixture
 *  test/fixtures/statblock/human-bandit-chief.yaml — do NOT hand-write a new
 *  statblock shape here; if the fixture moves, copy the new canonical one. */
export const PREVIEW_STATBLOCK_YAML = `<verbatim contents of test/fixtures/statblock/human-bandit-chief.yaml>`;

export function mountSettingsPreview(
	containerEl: HTMLElement,
	plugin: DrawSteelAdmonitionPlugin,
	owner: Component,
): void {
	const fw = plugin.frameworkV2;
	const def = fw?.registry.get('statblock');
	if (!fw || !def) return; // framework not constructed (never in practice): no preview
	const wrap = containerEl.createDiv({ cls: 'dse-settings-preview' });
	const host: BlockHost = {
		mode: 'reading',
		sourcePath: '',
		containerEl: wrap,
		canPersist: true,
		addChild: (child) => {
			owner.addChild(child);
			return child;
		},
		getBlockInfo: () => null,
		replaceSource: async () => false,
		blockKey: () => 'dse-settings-preview',
	};
	fw.pipeline.run(def, PREVIEW_STATBLOCK_YAML, host).catch((error) => {
		console.error('Draw Steel Elements: settings preview failed to render', error);
	});
}
```

**During implementation**, replace the `PREVIEW_STATBLOCK_YAML` placeholder string with
the literal file contents of `test/fixtures/statblock/human-bandit-chief.yaml` (backtick
template literal; escape any backticks/`${` if present in the fixture — check first with
`grep -c '`\|\${' test/fixtures/statblock/human-bandit-chief.yaml`, expected 0). This is
the ONE permitted transcription step in this plan; the acceptance test in Step 3 fails on
any transcription error (error card ⇒ no `.dse-sb`).

- [ ] **Step 2: Mount it from the tab + container CSS**

In `src/views/SettingsTab.ts` `renderPrefSections`, after the Statblock group's member
rows (inside the `for (const groupName of GROUP_ORDER)` loop, right after the
`for (const descriptor of members) this.renderRow(...)` line):

```ts
			if (groupName === 'Statblock display' && this.displayOwner) {
				mountSettingsPreview(containerEl, this.plugin, this.displayOwner);
			}
```

(import: `import { mountSettingsPreview } from '@views/SettingsPreview';`)

In `styles-source.css`, right after the Task 3 `reduce-motion` block:

```css
/* D4 §4.2 (Plan 13) — the settings-tab statblock preview container */
.dse-settings-preview {
	margin: 0.5rem 0 1rem;
	max-width: 40rem;
}
```

- [ ] **Step 3: Write `test/dom/views/settings-preview.test.ts`**

```ts
// Plan 13 Task 6 (D4 §4.2) — the settings statblock preview is a REAL pipeline
// mount: reflected at first paint, live-reflowed by pref changes, torn down with
// the tab (owner unload stops the re-stamping).
import DrawSteelAdmonitionPlugin from 'main';
import { DseSettingTab } from '@views/SettingsTab';
import { App, Setting, flushAsync } from '../../mocks/obsidian';

async function makeTabWithPreview() {
	const app = new App();
	const plugin = new DrawSteelAdmonitionPlugin(app as never, { id: 'draw-steel-elements', version: 'test' } as never);
	await plugin.onload();
	const tab = new DseSettingTab(plugin.app as never, plugin);
	tab.display();
	await flushAsync(3); // pipeline.run is async — let the mount land
	const root = (tab.containerEl as HTMLElement).querySelector<HTMLElement>(
		'.dse-settings-preview [data-dse-element="statblock"]',
	);
	return { plugin, tab, root };
}

beforeEach(() => {
	Setting.created.length = 0;
});

test('display() mounts a real statblock root (no error card, no read-only badge) with reflected defaults', async () => {
	const { root, tab } = await makeTabWithPreview();
	expect(root).not.toBeNull();
	expect(root!.querySelector('.dse-sb')).not.toBeNull(); // fixture parsed & rendered
	expect(root!.hasAttribute('data-dse-error-stage')).toBe(false);
	expect((tab.containerEl as HTMLElement).querySelector('.dse-error-card')).toBeNull();
	expect(root!.hasAttribute('data-dse-readonly')).toBe(false);
	expect(root!.getAttribute('data-dse-density')).toBe('comfortable');
});

test('a pref change live-reflows the preview root in place (same node, new attr)', async () => {
	const { plugin, root } = await makeTabWithPreview();
	await plugin.frameworkV2!.services.prefs.set('sbDensity', 'compact');
	await flushAsync(1);
	expect(root!.getAttribute('data-dse-density')).toBe('compact');
});

test('hide() unloads the preview owner: later pref changes no longer re-stamp the orphaned root', async () => {
	const { plugin, tab, root } = await makeTabWithPreview();
	tab.hide();
	await plugin.frameworkV2!.services.prefs.set('sbDensity', 'compact');
	await flushAsync(1);
	expect(root!.getAttribute('data-dse-density')).toBe('comfortable'); // dead subscription
});
```

- [ ] **Step 4: Gates**

Run: `npx tsc --noEmit` → 0. Run: `npx jest` → expected **1031** (1028 + 3).
Bonus: `npm run shots` full sweep — must stay clean (the preview module is plugin-only,
but the CSS touch is shared).

- [ ] **Step 5: Commit + push**

```bash
git add src/views/SettingsPreview.ts src/views/SettingsTab.ts styles-source.css test/dom/views/settings-preview.test.ts
git commit -m "feat(prefs): live statblock preview in the settings tab (D4)"
git push origin d4-prefs
```

---

### Task 7: Docs + full verification battery

**Files:**
- Modify: `CLAUDE.md` (plugin repo), `.repo-docs/architecture.md`, `README.md` (plugin
  repo — only if it documents settings/commands; check first)

**Interfaces:**
- Consumes: everything shipped in Tasks 1-6.
- Produces: docs a cold agent (or user) can operate the pref system from; the full green
  battery on the final tree.

- [ ] **Step 1: `CLAUDE.md` (plugin repo)**

In the "Key Architecture" section, add one bullet after the Framework v2 bullet:

```markdown
- **Preferences (D4)**: descriptor-driven — `src/prefs/catalog.ts` owns the `DsePrefs`
  augmentation, the `PrefDescriptor` list (attrs = the `data-dse-*` vocabulary CSS reflows
  on), and the statblock presets; storage is a SPARSE `prefs` slice on `DSESettings`
  (debounced `saveData`, `main.ts createSaveDataPrefsStorage`). The settings tab
  (`src/views/SettingsTab.ts`) renders FROM the descriptors — adding a pref = adding a
  descriptor. Per-block `prefs:` YAML overrides: `src/framework/prefOverrides.ts`.
  Defaults must always reproduce the current look (legacy-fidelity bar).
```

- [ ] **Step 2: `.repo-docs/architecture.md`**

Read its current framework/seams section and add a "Preferences" subsection in the file's
existing voice covering: the storage chain (`DsePreferenceStore` → `PrefsStorage` adapter
→ debounced `saveData`, sparse snapshot, `settingsVersion`), reflection (pipeline
reflects before mount; ThemeService owns `data-dse-theme` exclusively), the catalog
module + `PrefUi`, the per-block `prefs:` map (pipeline-popped, pinned after reflect,
serializer-wrapped for persisted elements), and the three deliberate deferrals
(`sbChars`/`sbVillain`/`sbStickyMeta`, `cardStyle`, dynamic theme options). Keep it under
~40 lines; link to the D4 spec path for rationale.

- [ ] **Step 3: `README.md` sweep**

Run: `grep -n "settings\|Settings\|command" README.md | head -20` — if the user-facing
README documents the settings tab or the temporary commands, update it (new pref
sections; the two dev commands are gone). If it doesn't mention either, no change.

- [ ] **Step 4: Full battery**

All from the worktree (wrap each in the devbox invocation; check echoed EXIT):

```bash
npx tsc --noEmit                       # → 0
npx jest                               # → 1031 passed (or your adjusted-up total)
npm run build                          # → production build green (type check + bundle)
npm run shots                          # → full harness sweep, zero --ERROR shots
git log --format='%b' a9d4ec7..HEAD | grep -iE 'co-authored|generated with' | wc -l   # → 0
git status --porcelain                 # → only intended files; restore any ts-node package.json churn
```

Optional ground truth (note in the report either way): `npm run obsidian-shots --
--element=statblock` for the real-Obsidian statblock, and a camera/manual screenshot of
the settings tab.

- [ ] **Step 5: Commit + push**

```bash
git add CLAUDE.md .repo-docs/architecture.md README.md
git commit -m "docs(prefs): preference system architecture + settings docs (D4)"
git push origin d4-prefs
```

(Drop `README.md` if Step 3 was a no-op.)

---

## Post-plan (orchestrator, workspace repo)

- `docs/superpowers/dse-overhaul/README.md`: D4 row → built.
- Build-ledger entries per task (`build-ledger-plans-01-12.md` successor file or its
  extension); Linear comment if the SC thread tracks D4.
- `REMAINING-TASKS.md`: strike the "`void prefs.set` `.catch` (once D4 wires real
  `saveData`)" item (done, Task 1); ADD the D4 deferrals with one-liners:
  `sbChars`/`sbVillain`/`sbStickyMeta` (no DOM duality in the built statblock — needs
  D2-level design), `cardStyle` (needs a designed compact card treatment), dynamic theme
  option list / hidden-theme filter (`optionsFrom` — waits on D3 growing themes), a
  non-fatal warning affordance for bad per-block `prefs:` keys (console.warn today),
  D5/F2 un-hiding their catalog rows when they ship.
- Land via `just wt-finish d4-prefs` after Scott's review gate (he reviews the rendered
  settings tab + a statblock note — get him in front of the preset dropdown early).
- Scott's veto pass over the Open-Decision resolutions table at the top of this plan.
