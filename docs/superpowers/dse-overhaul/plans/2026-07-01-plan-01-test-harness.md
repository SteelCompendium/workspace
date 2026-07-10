# DSE Test Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Stand up the jest test harness for `draw-steel-elements` (BT-2) — jest config, a full `obsidian` module mock with an in-memory vault fake, and the F3 §4.3 "first 10 tests" (T-1…T-10), with known bugs CB-1/CB-2/CB-3/CB-5/DC-6 encoded as `test.failing` so their later fixes flip them green.

**Architecture:** A two-project jest setup (`unit` on node, `dom` on jsdom) over the untouched production source. The `obsidian` npm package is types-only, so a hand-written mock (`test/mocks/obsidian.ts`) supplies the runtime: `js-yaml`-backed `parseYaml`/`stringifyYaml`, minimal `Plugin`/`Modal`/`Component` classes, and an in-memory vault fake that makes the click → mutate → file-rewrite pipeline fully testable, including the CB-3 write race. No production file is modified by this plan except `package.json`/`package-lock.json` (test-only devDependencies) and one stale line in `CLAUDE.md`.

**Tech Stack:** jest 30 + ts-jest 29 (already installed), jest-environment-jsdom + js-yaml (new, dev-only, approved), TypeScript 5.9, steel-compendium-sdk 2.1.5 (existing devDependency, pinned by T-9 snapshots).

## Global Constraints

- **ES2018 target; CJS output; esbuild bundler** — the harness must compile tests the same way: ts-jest is configured with `target: 'ES2018'`, `module: 'commonjs'`.
- **`obsidian` / `electron` / CodeMirror packages are external (host-provided)** — `obsidian` has NO runtime in node_modules (types only); every import chain touching it must resolve to `test/mocks/obsidian.ts` via `moduleNameMapper`.
- **Vanilla TS + DOM, NO Vue** — no Vue component tests; `.vue` imports map to a stub module until D1 deletes them (F3 §4.5 de-scope).
- **Only test-only new deps: `js-yaml` + `jest-environment-jsdom` (F3 OD-8, approved).** `@types/js-yaml` rides along as the types-only companion of `js-yaml`. Nothing else gets installed.
- **jest 30 / ts-jest / @types/jest / identity-obj-proxy are already in `package.json`** — do not re-add or upgrade them.
- **tsconfig path aliases must map:** `@/*`, `@model/*`, `@utils/*`, `@views/*`, `@drawSteelAdmonition/*`, `@drawSteelComponents/*` → `src/…` (plus bare `main` → `main.ts`, from `baseUrl: "."`).
- **`.yaml` imports are raw text** (esbuild `yamlLoaderPlugin` emits `export default "<file text>"`); jest needs an equivalent transformer.
- **Obsidian extends `HTMLElement.prototype`** (`createEl`, `createDiv`, `createSpan`, `empty`, `setText`, `addClass`, `removeClass`, `toggleClass`, …), provides a **global `createEl`**, and **polyfills `Array.prototype.contains`** — the harness must install all of these (prototype extensions + globals under jsdom; the `contains` polyfill in both projects, since `src/model/NegotiationData.ts:47,55` uses it in pure node code).
- **The repo's type-check is failing today (F3 TS-1)** — ts-jest MUST run with `diagnostics: false` so tests execute against source files with known type errors (e.g. `ctx.el` in `src/utils/CodeBlocks.ts`). Do not "fix" type errors in src — that is F3 backlog work, not harness work.
- **Zero production-code changes.** Tests characterize today's behavior; known-bad behavior is encoded as `test.failing` (jest ≥28: passes while the assertions fail, fails once the bug is fixed — forcing promotion to a plain `test`).
- **Work in an isolated worktree** (workspace rule 1), commit inside the `draw-steel-elements` submodule with plain conventional-commit messages, **no AI/co-author attribution trailers**.
- **Node ≥ 22.15 (package.json engines).** The workspace devbox provides node v24.x, which jest 30 needs to load `jest.config.ts` natively (Node's built-in type stripping). Always run node/npm through the workspace devbox.

## Environment (read once, applies to every task)

The DSE repo is a **git submodule** of the Steel Compendium workspace. Do not edit the shared main checkout. One-time setup:

```bash
cd /home/scott/code/steelCompendium/workspace
devbox run -- just wt-new dse-test-harness
```

This creates `/home/scott/code/steelCompendium/worktrees/dse-test-harness` with every submodule on branch `dse-test-harness`. **All paths below are relative to that worktree root**, abbreviated `$WT`:

```bash
export WT=/home/scott/code/steelCompendium/worktrees/dse-test-harness
```

Node/npm are NOT on the system PATH and the DSE-local `devbox.json` does not include node. **Every node/npm/npx command must run through the workspace-root devbox**, from `$WT`:

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && <command>'
```

Verify once: `cd "$WT" && devbox run -- bash -c 'node --version'` → expected `v24.4.1` (any v24.x is fine). If jest later errors with `Jest: 'ts-node' is required to use TypeScript configuration`, you are on a node without native type stripping — you ran outside the workspace devbox; re-run through it.

Commits happen **inside `$WT/draw-steel-elements`**. Landing the superproject pointer bump at the very end (`just wt-finish dse-test-harness`) is the orchestrating session's call — not part of this plan.

## File Structure

All paths relative to `draw-steel-elements/`.

| File | Responsibility |
|---|---|
| `jest.config.ts` | Two projects: `unit` (node env, `test/unit/**`) + `dom` (jsdom env, `test/dom/**`); path-alias `moduleNameMapper`; ts-jest transform (`diagnostics: false`, CJS/ES2018); `.yaml` raw-text transform; `.vue`/`.css`/`obsidian`/`main` mappings |
| `test/mocks/rawTextTransformer.js` | Jest transformer: `.yaml`/`.yml` file → CJS module exporting the file's raw text as `default` (mirrors esbuild's `yamlLoaderPlugin`) |
| `test/mocks/vueStub.ts` | Empty default-export stub for `.vue` imports (only `RegisterElements.ts` imports them; out of scope until D1) |
| `test/mocks/obsidian.ts` | THE runtime mock for the `obsidian` module: `parseYaml`/`stringifyYaml` (js-yaml), `TFile`/`TFolder`, **`FakeVault`** (in-memory `Map`), `FakeMetadataCache`, `App` (fake), `Component`, `MarkdownRenderChild`, `Plugin`, `Modal`, `Notice` (recorder), `Menu`, `Setting`, `PluginSettingTab`, `ItemView`, `MarkdownRenderer` (text-appending recorder), `setIcon`/`setTooltip` (attribute recorders), `request`/`requestUrl` (`jest.fn`), plus test utilities `makeFakeContext()` and `flushAsync()` |
| `test/setup/polyfills.ts` | `Array.prototype.contains` polyfill (both projects — `NegotiationData` needs it in node) |
| `test/setup/dom-setup.ts` | Obsidian's `HTMLElement.prototype` extensions + global `createEl`/`createDiv`/`createSpan` (dom project only) |
| `test/fixtures/initiative/quick-start.yaml` | Docs quick-start encounter (2 heroes, 1 group, malice 5) — T-1, T-10 |
| `test/fixtures/initiative/squad.yaml` | Squad encounter (5×4-stamina minions + captain, hero with conditions) — T-1, T-4 |
| `test/fixtures/counter/health.yaml` | Docs counter example — T-3, T-10 |
| `test/fixtures/stamina/basic.yaml` | Docs stamina-bar example — T-6 |
| `test/fixtures/negotiation/frodo.yaml` | Docs negotiation example — T-7 |
| `test/fixtures/statblock/human-bandit-chief.yaml` | Full docs statblock — T-9 SDK snapshot |
| `test/fixtures/feature/magma-titan.yaml` | Full docs feature — T-9 SDK snapshot |
| `test/fixtures/featureblock/angulotl-malice.yaml` | Full docs featureblock — T-9 SDK snapshot |
| `test/unit/harness-smoke.test.ts` | Task 1 proof: aliases resolve, `.yaml` imports are raw text |
| `test/dom/harness-smoke.test.ts` | Task 1 proof: jsdom project runs |
| `test/unit/mocks/obsidian-mock.test.ts` | Task 2 proof: vault fake semantics, yaml round-trip, `getSectionInfo`, metadata cache, Notice recorder |
| `test/dom/mocks/dom-setup.test.ts` | Task 2 proof: prototype extensions, globals, `contains`, Modal lifecycle |
| `test/unit/model/encounter-data.test.ts` | T-1 + T-2: `parseEncounterData` happy path + error surface |
| `test/unit/utils/code-blocks.test.ts` | T-3: `updateMarkdownCodeBlock` round-trip; CB-5 + CB-3 as `test.failing` |
| `test/dom/views/minion-stamina-pool-modal.test.ts` | T-4: minion-pool math table; CB-1, CB-2, DC-6 as `test.failing` |
| `test/dom/views/stamina-edit-modal.test.ts` | T-5: clamp/death-floor/temp-absorbs-first math |
| `test/unit/model/stamina-bar.test.ts` | T-6: schema-validated parse, CB-15 default pinned, hero round-trip |
| `test/unit/model/negotiation.test.ts` | T-7: `ArgumentPowerRoll.build` matrix + `NegotiationData` motivation logic |
| `test/unit/utils/reference-resolver.test.ts` | T-8: 5-step `findFile` chain + ds-block extraction regex |
| `test/unit/model/sdk-boundary.test.ts` | T-9: SDK 2.1.5 parse snapshots (the F2 upgrade net) |
| `test/dom/elements/initiative-render.test.ts` | T-10a: `InitiativeProcessor.postProcess` render smoke + one-write-per-click — **the harness template for F1 element tests** |
| `test/dom/elements/counter-view.test.ts` | T-10b: `CounterView` inc/dec, min/max disable, persistence |
| `.github/workflows/plugin-ci.yml` | Plugin CI (F3 §4.6): install → tsc (informational) → jest → bundle build |
| `CLAUDE.md` (modify, 1 line) | Fix the now-stale "currently no test files" quick-start bullet |

---

### Task 1: Dependencies, jest config, and smoke tests

**Files:**
- Modify: `draw-steel-elements/package.json` (via `npm install --save-dev`; also creates `package-lock.json`)
- Create: `draw-steel-elements/jest.config.ts`
- Create: `draw-steel-elements/test/mocks/rawTextTransformer.js`
- Create: `draw-steel-elements/test/mocks/vueStub.ts`
- Test: `draw-steel-elements/test/unit/harness-smoke.test.ts`, `draw-steel-elements/test/dom/harness-smoke.test.ts`

**Interfaces:**
- Consumes: existing `tsconfig.json` path aliases; `src/types/yaml.d.ts` (already declares `*.yaml` modules as `{ default: string }`).
- Produces: a running `npm test` with two selectable projects (`--selectProjects unit|dom`); the `.yaml`-as-raw-text import convention every later task's fixtures rely on; the `aliases`/`transform` config objects Task 2 extends.

- [ ] **Step 1: Set up the worktree and install dependencies**

```bash
cd /home/scott/code/steelCompendium/workspace
devbox run -- just wt-new dse-test-harness
export WT=/home/scott/code/steelCompendium/worktrees/dse-test-harness
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npm install && npm install --save-dev js-yaml @types/js-yaml jest-environment-jsdom'
```

Expected: npm finishes without errors; `package.json` devDependencies now include `js-yaml`, `@types/js-yaml`, `jest-environment-jsdom`; a new `package-lock.json` exists. (If `wt-new` says the worktree already exists, just `export WT=…` and continue.)

- [ ] **Step 2: Write the failing smoke tests**

Create `test/unit/harness-smoke.test.ts`:

```typescript
// Proves the unit project runs: path aliases resolve and .yaml imports are raw text.
import { DEFAULT_SETTINGS } from '@model/Settings';
import staminaBarSchema from '@model/schemas/StaminaBarSchema.yaml';

describe('harness smoke (unit project)', () => {
	test('tsconfig path aliases resolve at runtime', () => {
		expect(DEFAULT_SETTINGS.compendiumDestinationDirectory).toBe('DS Compendium');
	});

	test('.yaml imports load as raw text (esbuild yamlLoaderPlugin parity)', () => {
		expect(typeof staminaBarSchema).toBe('string');
		expect(staminaBarSchema).toContain('max_stamina is required');
	});
});
```

Create `test/dom/harness-smoke.test.ts`:

```typescript
// Proves the dom project runs under jsdom.
describe('harness smoke (dom project)', () => {
	test('jsdom provides a document', () => {
		expect(typeof document).toBe('object');
		expect(document.createElement('div').tagName).toBe('DIV');
	});

	test('jsdom provides HTMLElement', () => {
		expect(document.createElement('span')).toBeInstanceOf(HTMLElement);
	});
});
```

- [ ] **Step 3: Run to confirm FAIL**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest'
```

Expected: FAIL — with no `jest.config.*`, jest cannot parse TypeScript test files (output contains `SyntaxError` / `Jest failed to parse a file` or `Cannot use import statement outside a module`).

- [ ] **Step 4: Write the config, yaml transformer, and vue stub**

Create `test/mocks/rawTextTransformer.js`:

```javascript
'use strict';
// Jest transformer mirroring esbuild.config.mjs's yamlLoaderPlugin:
// a .yaml/.yml file becomes a module whose default export is the file's raw text.
const crypto = require('crypto');

module.exports = {
	process(sourceText) {
		return {
			code: `module.exports = { __esModule: true, default: ${JSON.stringify(sourceText)} };`,
		};
	},
	getCacheKey(sourceText, sourcePath) {
		return crypto
			.createHash('sha256')
			.update(sourcePath)
			.update('\0')
			.update(sourceText)
			.digest('hex');
	},
};
```

Create `test/mocks/vueStub.ts`:

```typescript
// Stub for `.vue` imports (only src/utils/RegisterElements.ts imports SFCs).
// Vue component testing is explicitly de-scoped until D1 removes Vue (F3 §4.5).
export default {};
```

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest';

// Path aliases mirror tsconfig.json `paths` (+ baseUrl-resolved bare `main`).
// Longest-prefix entries must come before the catch-all `@/`.
const aliases: Record<string, string> = {
	'^@model/(.*)$': '<rootDir>/src/model/$1',
	'^@utils/(.*)$': '<rootDir>/src/utils/$1',
	'^@views/(.*)$': '<rootDir>/src/views/$1',
	'^@drawSteelAdmonition/(.*)$': '<rootDir>/src/drawSteelAdmonition/$1',
	'^@drawSteelComponents/(.*)$': '<rootDir>/src/drawSteelComponents/$1',
	'^@/(.*)$': '<rootDir>/src/$1',
	'^main$': '<rootDir>/main.ts',
	// Vue SFCs: out of scope until D1 (F3 §4.5) — stub them.
	'\\.vue$': '<rootDir>/test/mocks/vueStub.ts',
	// main.ts imports ./styles-source.css; identity-obj-proxy is already installed.
	'\\.css$': 'identity-obj-proxy',
};

const transform = {
	// diagnostics MUST stay off: the repo's type-check is failing today (F3 TS-1,
	// e.g. `ctx.el` in src/utils/CodeBlocks.ts). CI runs tsc separately.
	'^.+\\.ts$': [
		'ts-jest',
		{
			diagnostics: false,
			tsconfig: {
				module: 'commonjs',
				target: 'ES2018',
				lib: ['ES2018', 'DOM'],
				esModuleInterop: true,
			},
		},
	],
	// .yaml imports are raw text, matching esbuild's yamlLoaderPlugin.
	'^.+\\.ya?ml$': '<rootDir>/test/mocks/rawTextTransformer.js',
} as const;

const config: Config = {
	projects: [
		{
			displayName: 'unit',
			testEnvironment: 'node',
			testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
			moduleNameMapper: aliases,
			transform: transform as any,
		},
		{
			displayName: 'dom',
			testEnvironment: 'jsdom',
			testMatch: ['<rootDir>/test/dom/**/*.test.ts'],
			moduleNameMapper: aliases,
			transform: transform as any,
		},
	],
};

export default config;
```

- [ ] **Step 5: Run to confirm PASS**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest'
```

Expected: PASS — `Test Suites: 2 passed, 2 total` / `Tests: 4 passed, 4 total`, with both `unit` and `dom` displayNames visible.

Also verify project selection works:

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest --selectProjects unit'
```

Expected: `Tests: 2 passed` (only the unit smoke suite runs).

- [ ] **Step 6: Commit**

```bash
cd "$WT/draw-steel-elements" && git add package.json package-lock.json jest.config.ts test/mocks/rawTextTransformer.js test/mocks/vueStub.ts test/unit/harness-smoke.test.ts test/dom/harness-smoke.test.ts && git commit -m "test: bootstrap jest harness (two-project config, yaml raw-text transform, vue stub)"
```

---

### Task 2: The obsidian mock, setup files, and vault fake

**Files:**
- Create: `draw-steel-elements/test/mocks/obsidian.ts`
- Create: `draw-steel-elements/test/setup/polyfills.ts`
- Create: `draw-steel-elements/test/setup/dom-setup.ts`
- Modify: `draw-steel-elements/jest.config.ts` (add `^obsidian$` mapping + `setupFiles`)
- Test: `draw-steel-elements/test/unit/mocks/obsidian-mock.test.ts`, `draw-steel-elements/test/dom/mocks/dom-setup.test.ts`

**Interfaces:**
- Consumes: Task 1's jest config and yaml transformer.
- Produces (the mock surface every later task relies on — import from `'../../mocks/obsidian'` in tests; production code reaches the same module via the `^obsidian$` mapping, so state is shared):
  - `parseYaml(yaml: string): any` / `stringifyYaml(obj: any): string` — js-yaml `load`/`dump` (Obsidian bundles js-yaml, so behavior matches).
  - `class TFile { path; name; basename; extension }`, `class TFolder`, base `class TAbstractFile`.
  - `class FakeVault` — in-memory `Map<string, string>`:
    - `setFile(path: string, content: string): TFile` (test seeding helper),
    - `getContent(path: string): string | undefined` (test read helper),
    - `readonly modifyCalls: { path: string; content: string }[]` (write recorder),
    - `getAbstractFileByPath(path: string): TAbstractFile | null`,
    - `read(file: TFile): Promise<string>` — **snapshots content at call time, then yields one macrotask** (deterministically reproduces the CB-3 read-modify-write race),
    - `cachedRead(file: TFile): Promise<string>`,
    - `modify(file: TFile, content: string): Promise<void>`,
    - `process(file: TFile, fn: (data: string) => string): Promise<string>` (atomic),
    - `create(path: string, content: string): Promise<TFile>`, `createFolder(path: string): Promise<TFolder>`, `delete(file: TAbstractFile, force?: boolean): Promise<void>`,
    - `getResourcePath(file: TFile): string` → `app://vault/<path>`.
  - `class FakeMetadataCache { getFirstLinkpathDest(linkpath: string, sourcePath: string): TFile | null }` — resolves by basename against the vault.
  - `class App { vault: FakeVault; metadataCache: FakeMetadataCache; workspace: { getActiveViewOfType(t: any): null } }`.
  - `class Component { load(); unload(); addChild<T>(child: T): T; removeChild<T>(child: T): T; onload(); onunload(); register(); registerEvent(); registerDomEvent(el, type, cb); _children: Component[] }`.
  - `class MarkdownRenderChild extends Component { containerEl: HTMLElement; constructor(containerEl: HTMLElement) }`.
  - `class Plugin extends Component { app: App; manifest: any; registeredProcessors: Map<string, Function>; registerMarkdownCodeBlockProcessor(lang, handler); addCommand(); addSettingTab(); loadData(); saveData() }`.
  - `class Modal { app; containerEl; titleEl; contentEl: HTMLElement; open() → onOpen(); close() → onClose() }` (real jsdom divs; throws if constructed outside jsdom).
  - `class Notice { static notices: string[] }` (recorder), `class Menu`/`class MenuItem` (recorders; `Menu.lastMenu`), `class Setting` (chainable no-op), `class PluginSettingTab`, `class ItemView { getViewType(): string }`.
  - `class MarkdownRenderer { static calls: { markdown; sourcePath }[]; static render(app, markdown, el, sourcePath, component) }` — appends the raw markdown as a text node (assert on text, not HTML).
  - `setIcon(el, iconId)` → sets `data-icon` attribute; `setTooltip(el, tooltip)` → sets `data-tooltip`.
  - `request: jest.Mock`, `requestUrl: jest.Mock`.
  - `interface MarkdownSectionInformation { text; lineStart; lineEnd }`, `interface MarkdownPostProcessorContext { docId; sourcePath; frontmatter; addChild(c); getSectionInfo(el) }`.
  - `makeFakeContext(app: App, sourcePath: string, blockIndex = 0): MarkdownPostProcessorContext & { el: HTMLElement; addedChildren: MarkdownRenderChild[] }` — `getSectionInfo` **re-scans the file's current content** for the `blockIndex`-th ` ```ds-* `/`~~~ds-*` fenced block and returns `{ text: <whole file>, lineStart: <fence-open line>, lineEnd: <fence-close line> }` (matches how `CodeBlocks.updateMarkdownCodeBlock` splices lines `lineStart..lineEnd` inclusive).
  - `flushAsync(rounds = 3): Promise<void>` — drains the macrotask yields of un-awaited click→write pipelines.

- [ ] **Step 1: Write the failing mock self-tests**

Create `test/unit/mocks/obsidian-mock.test.ts`:

```typescript
import {
	App,
	FakeVault,
	Notice,
	TFile,
	TFolder,
	makeFakeContext,
	parseYaml,
	stringifyYaml,
} from '../../mocks/obsidian';

describe('obsidian mock: yaml', () => {
	test('parseYaml/stringifyYaml round-trip via js-yaml', () => {
		const obj = { name: 'Health', current_value: 10, nested: { list: [1, 2] } };
		expect(parseYaml(stringifyYaml(obj))).toEqual(obj);
	});

	test('parseYaml of a non-mapping returns the scalar (like Obsidian)', () => {
		expect(parseYaml('just a string')).toBe('just a string');
	});
});

describe('obsidian mock: FakeVault', () => {
	test('setFile + getAbstractFileByPath returns a real TFile instance', () => {
		const vault = new FakeVault();
		const created = vault.setFile('Folder/Note.md', '# hi');
		const found = vault.getAbstractFileByPath('Folder/Note.md');
		expect(found).toBe(created);
		expect(found).toBeInstanceOf(TFile);
		expect((found as TFile).basename).toBe('Note');
		expect((found as TFile).extension).toBe('md');
		expect(vault.getAbstractFileByPath('missing.md')).toBeNull();
	});

	test('read returns content; modify records and overwrites', async () => {
		const vault = new FakeVault();
		const file = vault.setFile('Note.md', 'v1');
		await expect(vault.read(file)).resolves.toBe('v1');
		await vault.modify(file, 'v2');
		expect(vault.getContent('Note.md')).toBe('v2');
		expect(vault.modifyCalls).toEqual([{ path: 'Note.md', content: 'v2' }]);
	});

	test('read snapshots content at call time (models the CB-3 race window)', async () => {
		const vault = new FakeVault();
		const file = vault.setFile('Note.md', 'old');
		const pendingRead = vault.read(file); // snapshot taken now
		await vault.modify(file, 'new');
		await expect(pendingRead).resolves.toBe('old');
	});

	test('process is atomic (no yield between read and write)', async () => {
		const vault = new FakeVault();
		const file = vault.setFile('Note.md', '1');
		await Promise.all([
			vault.process(file, (data) => String(Number(data) + 1)),
			vault.process(file, (data) => String(Number(data) + 1)),
		]);
		expect(vault.getContent('Note.md')).toBe('3');
	});

	test('create / createFolder / delete', async () => {
		const vault = new FakeVault();
		const file = await vault.create('New.md', 'x');
		expect(vault.getContent('New.md')).toBe('x');
		const folder = await vault.createFolder('Dir');
		expect(folder).toBeInstanceOf(TFolder);
		expect(vault.getAbstractFileByPath('Dir')).toBe(folder);
		await vault.delete(file);
		expect(vault.getAbstractFileByPath('New.md')).toBeNull();
	});
});

describe('obsidian mock: metadata cache + app', () => {
	test('getFirstLinkpathDest resolves by basename anywhere in the vault', () => {
		const app = new App();
		const file = app.vault.setFile('Folders/Thorn Dragon.md', 'x');
		expect(app.metadataCache.getFirstLinkpathDest('Thorn Dragon', '')).toBe(file);
		expect(app.metadataCache.getFirstLinkpathDest('Nope', '')).toBeNull();
	});
});

describe('obsidian mock: makeFakeContext.getSectionInfo', () => {
	const NOTE = [
		'# Title',
		'',
		'```ds-counter',
		'name: A',
		'```',
		'',
		'~~~ds-counter',
		'name: B',
		'~~~',
		'',
	].join('\n');

	test('locates the Nth ds-* fenced block (``` and ~~~), lines inclusive of fences', () => {
		const app = new App();
		app.vault.setFile('Note.md', NOTE);
		const ctx0 = makeFakeContext(app, 'Note.md', 0);
		expect(ctx0.getSectionInfo(ctx0.el)).toEqual({ text: NOTE, lineStart: 2, lineEnd: 4 });
		const ctx1 = makeFakeContext(app, 'Note.md', 1);
		expect(ctx1.getSectionInfo(ctx1.el)).toEqual({ text: NOTE, lineStart: 6, lineEnd: 8 });
	});

	test('returns null when no matching block exists', () => {
		const app = new App();
		app.vault.setFile('Note.md', '# no blocks');
		const ctx = makeFakeContext(app, 'Note.md');
		expect(ctx.getSectionInfo(ctx.el)).toBeNull();
	});

	test('re-scans current content on every call (models re-render after write)', async () => {
		const app = new App();
		const file = app.vault.setFile('Note.md', '```ds-counter\nname: A\n```');
		const ctx = makeFakeContext(app, 'Note.md');
		await app.vault.modify(file, 'intro line\n\n```ds-counter\nname: A\n```');
		expect(ctx.getSectionInfo(ctx.el)).toMatchObject({ lineStart: 2, lineEnd: 4 });
	});
});

describe('obsidian mock: Notice recorder', () => {
	test('records constructed notices', () => {
		Notice.notices.length = 0;
		new Notice('hello');
		expect(Notice.notices).toEqual(['hello']);
	});
});
```

Create `test/dom/mocks/dom-setup.test.ts`:

```typescript
import { App, Modal, setIcon, setTooltip } from '../../mocks/obsidian';

describe('dom-setup: HTMLElement prototype extensions', () => {
	test('createEl appends a child with cls/text/attr/title', () => {
		const parent = document.createElement('div');
		const child = parent.createEl('span', {
			cls: 'a b',
			text: 'hi',
			attr: { 'data-x': 1 },
			title: 'tip',
		});
		expect(child.parentElement).toBe(parent);
		expect(child.className).toBe('a b');
		expect(child.textContent).toBe('hi');
		expect(child.getAttribute('data-x')).toBe('1');
		expect(child.title).toBe('tip');
	});

	test('createEl supports input type/value and the callback arg', () => {
		const parent = document.createElement('div');
		let seen: HTMLElement | null = null;
		const input = parent.createEl('input', { type: 'number', value: '5' }, (el) => (seen = el));
		expect(input.type).toBe('number');
		expect(input.value).toBe('5');
		expect(seen).toBe(input);
	});

	test('createDiv / createSpan shorthands', () => {
		const parent = document.createElement('div');
		expect(parent.createDiv({ cls: 'd' }).tagName).toBe('DIV');
		expect(parent.createSpan({ cls: 's' }).tagName).toBe('SPAN');
	});

	test('empty / setText / addClass / removeClass / toggleClass / hasClass', () => {
		const el = document.createElement('div');
		el.createEl('span', { text: 'x' });
		el.empty();
		expect(el.childNodes).toHaveLength(0);
		el.setText('new text');
		expect(el.textContent).toBe('new text');
		el.addClass('one', 'two');
		expect(el.className).toBe('one two');
		el.removeClass('one');
		expect(el.hasClass('one')).toBe(false);
		el.toggleClass('flag', true);
		expect(el.hasClass('flag')).toBe(true);
		el.toggleClass('flag', false);
		expect(el.hasClass('flag')).toBe(false);
	});

	test('global createEl exists (CounterView.ts:107 uses it bare)', () => {
		const el = (globalThis as any).createEl('div', { cls: 'floating' });
		expect(el.parentElement).toBeNull();
		expect(el.className).toBe('floating');
	});

	test('Array.prototype.contains polyfill is installed', () => {
		expect((['a', 'b'] as any).contains('a')).toBe(true);
		expect((['a', 'b'] as any).contains('z')).toBe(false);
	});
});

describe('dom-setup: Modal + icon helpers', () => {
	test('Modal has real contentEl/titleEl; open/close drive onOpen/onClose', () => {
		const app = new App();
		const opened = jest.fn();
		const closed = jest.fn();
		class TestModal extends Modal {
			onOpen() { opened(); this.contentEl.createEl('p', { text: 'body' }); }
			onClose() { closed(); }
		}
		const modal = new TestModal(app as any);
		modal.open();
		expect(opened).toHaveBeenCalledTimes(1);
		expect(modal.contentEl.textContent).toBe('body');
		modal.close();
		expect(closed).toHaveBeenCalledTimes(1);
	});

	test('setIcon / setTooltip record onto attributes', () => {
		const el = document.createElement('div');
		setIcon(el, 'chevron-up');
		setTooltip(el, 'a tip');
		expect(el.getAttribute('data-icon')).toBe('chevron-up');
		expect(el.getAttribute('data-tooltip')).toBe('a tip');
	});
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/mocks test/dom/mocks'
```

Expected: FAIL with `Cannot find module '../../mocks/obsidian'` in both suites.

- [ ] **Step 3: Write the setup files and the mock**

Create `test/setup/polyfills.ts`:

```typescript
// Obsidian installs an Array.prototype.contains polyfill at runtime;
// src code relies on it (src/model/NegotiationData.ts:47,55).
// Needed in BOTH jest projects — NegotiationData is pure node code.
if (!(Array.prototype as any).contains) {
	Object.defineProperty(Array.prototype, 'contains', {
		value: function <T>(this: T[], target: T): boolean {
			return this.includes(target);
		},
		enumerable: false,
		writable: true,
		configurable: true,
	});
}

export {};
```

Create `test/setup/dom-setup.ts`:

```typescript
// Installs Obsidian's HTMLElement prototype extensions and DOM-building globals
// under jsdom. The `obsidian` package's type declarations already declare these
// shapes globally; this file supplies the runtime.

type DomElementInfo = {
	cls?: string | string[];
	text?: string;
	attr?: Record<string, string | number | boolean | null>;
	title?: string;
	value?: string;
	type?: string;
	placeholder?: string;
	href?: string;
};

function applyInfo(el: HTMLElement, info?: DomElementInfo | string): void {
	if (typeof info === 'string') {
		el.className = info;
		return;
	}
	if (!info) return;
	if (info.cls) el.className = Array.isArray(info.cls) ? info.cls.join(' ') : info.cls;
	if (info.text != null) el.textContent = info.text;
	if (info.attr) {
		for (const [key, value] of Object.entries(info.attr)) {
			if (value != null) el.setAttribute(key, String(value));
		}
	}
	if (info.title != null) el.title = info.title;
	if (info.type != null) (el as HTMLInputElement).type = info.type;
	if (info.value != null) (el as HTMLInputElement).value = info.value;
	if (info.placeholder != null) (el as HTMLInputElement).placeholder = info.placeholder;
	if (info.href != null) (el as HTMLAnchorElement).href = info.href;
}

const proto = HTMLElement.prototype as any;

proto.createEl = function (
	tag: string,
	info?: DomElementInfo | string,
	callback?: (el: HTMLElement) => void,
): HTMLElement {
	const el = this.ownerDocument.createElement(tag);
	applyInfo(el, info);
	this.appendChild(el);
	callback?.(el);
	return el;
};
proto.createDiv = function (info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) {
	return this.createEl('div', info, callback);
};
proto.createSpan = function (info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) {
	return this.createEl('span', info, callback);
};
proto.empty = function () {
	while (this.firstChild) this.removeChild(this.firstChild);
};
proto.setText = function (text: string) {
	this.textContent = text;
};
proto.appendText = function (text: string) {
	this.appendChild(this.ownerDocument.createTextNode(text));
};
proto.addClass = function (...classes: string[]) {
	this.classList.add(...classes);
};
proto.removeClass = function (...classes: string[]) {
	this.classList.remove(...classes);
};
proto.toggleClass = function (classes: string | string[], value: boolean) {
	const list = Array.isArray(classes) ? classes : [classes];
	for (const cls of list) this.classList.toggle(cls, value);
};
proto.hasClass = function (cls: string): boolean {
	return this.classList.contains(cls);
};

// Obsidian also provides bare globals (used by src/drawSteelAdmonition/Counter/CounterView.ts:107).
(globalThis as any).createEl = (
	tag: string,
	info?: DomElementInfo | string,
	callback?: (el: HTMLElement) => void,
): HTMLElement => {
	const el = document.createElement(tag);
	applyInfo(el, info);
	callback?.(el);
	return el;
};
(globalThis as any).createDiv = (info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) =>
	(globalThis as any).createEl('div', info, callback);
(globalThis as any).createSpan = (info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) =>
	(globalThis as any).createEl('span', info, callback);

export {};
```

Create `test/mocks/obsidian.ts`:

```typescript
// Runtime mock for the types-only `obsidian` package.
// jest.config.ts maps `^obsidian$` here, so production src files get this at
// runtime while keeping the REAL obsidian types at compile time (moduleNameMapper
// only affects module resolution, not type checking). Tests import the fakes
// directly from this path — jest resolves both specifiers to the same module
// instance, so recorders (modifyCalls, Notice.notices, …) are shared.
import * as jsYaml from 'js-yaml';

// ---------------------------------------------------------------- yaml
// Obsidian bundles js-yaml, so delegating gives matching behavior (F3 §4.2).
export function parseYaml(yaml: string): any {
	return jsYaml.load(yaml);
}
export function stringifyYaml(obj: any): string {
	return jsYaml.dump(obj);
}

// ---------------------------------------------------------------- files
export class TAbstractFile {
	path = '';
	name = '';
	parent: TFolder | null = null;
}

export class TFile extends TAbstractFile {
	basename = '';
	extension = '';
	stat = { ctime: 0, mtime: 0, size: 0 };

	constructor(path = '') {
		super();
		this.setPath(path);
	}

	setPath(path: string): void {
		this.path = path;
		this.name = path.split('/').pop() ?? path;
		const dot = this.name.lastIndexOf('.');
		this.basename = dot === -1 ? this.name : this.name.slice(0, dot);
		this.extension = dot === -1 ? '' : this.name.slice(dot + 1);
	}
}

export class TFolder extends TAbstractFile {
	children: TAbstractFile[] = [];

	constructor(path = '') {
		super();
		this.path = path;
		this.name = path.split('/').pop() ?? path;
	}
}

// ---------------------------------------------------------------- vault fake
const macrotask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

export class FakeVault {
	private contents = new Map<string, string>();
	private tfiles = new Map<string, TFile>();
	private folders = new Map<string, TFolder>();
	readonly modifyCalls: { path: string; content: string }[] = [];

	/** Test seeding helper (not part of the Obsidian API). */
	setFile(path: string, content: string): TFile {
		let file = this.tfiles.get(path);
		if (!file) {
			file = new TFile(path);
			this.tfiles.set(path, file);
		}
		this.contents.set(path, content);
		return file;
	}

	/** Test read helper (not part of the Obsidian API). */
	getContent(path: string): string | undefined {
		return this.contents.get(path);
	}

	getAbstractFileByPath(path: string): TAbstractFile | null {
		return this.tfiles.get(path) ?? this.folders.get(path) ?? null;
	}

	allFiles(): TFile[] {
		return [...this.tfiles.values()];
	}

	// Snapshot-then-yield: content is captured at call time, then one macrotask
	// elapses before it is returned. This deterministically reproduces the
	// CB-3 read-modify-write race (a second write can land inside the window).
	async read(file: TFile): Promise<string> {
		const content = this.contents.get(file.path);
		await macrotask();
		if (content == null) throw new Error(`File not found: ${file.path}`);
		return content;
	}

	async cachedRead(file: TFile): Promise<string> {
		return this.read(file);
	}

	async modify(file: TFile, content: string): Promise<void> {
		if (!this.tfiles.has(file.path)) throw new Error(`File not found: ${file.path}`);
		this.contents.set(file.path, content);
		this.modifyCalls.push({ path: file.path, content });
	}

	// Atomic by construction: no yield between read and write (obsidianmd rule 19).
	async process(file: TFile, fn: (data: string) => string): Promise<string> {
		const current = this.contents.get(file.path);
		if (current == null) throw new Error(`File not found: ${file.path}`);
		const next = fn(current);
		this.contents.set(file.path, next);
		this.modifyCalls.push({ path: file.path, content: next });
		return next;
	}

	async create(path: string, content: string): Promise<TFile> {
		if (this.tfiles.has(path)) throw new Error(`File already exists: ${path}`);
		return this.setFile(path, content);
	}

	async createFolder(path: string): Promise<TFolder> {
		const folder = new TFolder(path);
		this.folders.set(path, folder);
		return folder;
	}

	async delete(file: TAbstractFile, _force = false): Promise<void> {
		this.tfiles.delete(file.path);
		this.contents.delete(file.path);
		this.folders.delete(file.path);
	}

	getResourcePath(file: TFile): string {
		return `app://vault/${file.path}`;
	}
}

export class FakeMetadataCache {
	constructor(private vault: FakeVault) {}

	// Resolves "Thorn Dragon" → any vault file whose basename matches
	// (ReferenceResolver.findFile step 5).
	getFirstLinkpathDest(linkpath: string, _sourcePath: string): TFile | null {
		const wanted = linkpath.replace(/\.md$/, '');
		for (const file of this.vault.allFiles()) {
			if (file.basename === wanted) return file;
		}
		return null;
	}
}

export class App {
	vault = new FakeVault();
	metadataCache = new FakeMetadataCache(this.vault);
	workspace = {
		getActiveViewOfType: (_type: any): any => null,
	};
}

// ---------------------------------------------------------------- components
export class Component {
	_loaded = false;
	_children: Component[] = [];

	load(): void {
		this._loaded = true;
		this.onload();
		this._children.forEach((child) => child.load());
	}
	unload(): void {
		this._loaded = false;
		this._children.slice().forEach((child) => child.unload());
		this.onunload();
	}
	onload(): void {}
	onunload(): void {}
	addChild<T extends Component>(child: T): T {
		this._children.push(child);
		if (this._loaded) child.load();
		return child;
	}
	removeChild<T extends Component>(child: T): T {
		const index = this._children.indexOf(child);
		if (index >= 0) {
			this._children.splice(index, 1);
			child.unload();
		}
		return child;
	}
	register(_cb: () => any): void {}
	registerEvent(_ref: any): void {}
	registerDomEvent(el: any, type: string, callback: any): void {
		el.addEventListener(type, callback);
	}
	registerInterval(id: number): number {
		return id;
	}
}

export class MarkdownRenderChild extends Component {
	containerEl: HTMLElement;
	constructor(containerEl: HTMLElement) {
		super();
		this.containerEl = containerEl;
	}
}

export class Events {}

export class Plugin extends Component {
	app: App;
	manifest: any;
	readonly registeredProcessors = new Map<
		string,
		(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => any
	>();

	constructor(app?: App, manifest?: any) {
		super();
		this.app = app ?? new App();
		this.manifest = manifest ?? { id: 'draw-steel-elements', version: 'test' };
	}
	registerMarkdownCodeBlockProcessor(
		language: string,
		handler: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => any,
	): void {
		this.registeredProcessors.set(language, handler);
	}
	addCommand(_command: any): void {}
	addSettingTab(_tab: any): void {}
	async loadData(): Promise<any> {
		return {};
	}
	async saveData(_data: any): Promise<void> {}
}

// ---------------------------------------------------------------- UI classes
export class Modal {
	app: App;
	containerEl: HTMLElement;
	titleEl: HTMLElement;
	contentEl: HTMLElement;

	constructor(app: App) {
		this.app = app;
		if (typeof document === 'undefined') {
			throw new Error('Modal requires the jsdom test environment (put the test under test/dom/)');
		}
		this.containerEl = document.createElement('div');
		this.containerEl.className = 'modal-container';
		this.titleEl = (this.containerEl as any).createEl('div', { cls: 'modal-title' });
		this.contentEl = (this.containerEl as any).createEl('div', { cls: 'modal-content' });
	}
	open(): void {
		document.body.appendChild(this.containerEl);
		this.onOpen();
	}
	close(): void {
		this.containerEl.remove();
		this.onClose();
	}
	onOpen(): void {}
	onClose(): void {}
	setTitle(title: string): this {
		this.titleEl.textContent = title;
		return this;
	}
}

export class Notice {
	static readonly notices: string[] = [];
	constructor(message: string, _duration?: number) {
		Notice.notices.push(message);
	}
	setMessage(_message: string): this {
		return this;
	}
	hide(): void {}
}

export class MenuItem {
	title = '';
	icon = '';
	onClickCallback: ((evt?: any) => any) | null = null;
	setTitle(title: string): this {
		this.title = title;
		return this;
	}
	setIcon(icon: string): this {
		this.icon = icon;
		return this;
	}
	onClick(callback: (evt?: any) => any): this {
		this.onClickCallback = callback;
		return this;
	}
}

export class Menu {
	static lastMenu: Menu | null = null;
	readonly items: MenuItem[] = [];
	constructor() {
		Menu.lastMenu = this;
	}
	addItem(callback: (item: MenuItem) => any): this {
		const item = new MenuItem();
		callback(item);
		this.items.push(item);
		return this;
	}
	addSeparator(): this {
		return this;
	}
	showAtMouseEvent(_evt: any): this {
		return this;
	}
	showAtPosition(_pos: any): this {
		return this;
	}
}

// Infinitely-chainable stub for Setting's fluent sub-component callbacks
// (addText(cb) etc.). Any method returns the chain; good enough for code that
// only wires settings UI.
const chain: any = new Proxy(function () {}, {
	get: () => chain,
	apply: () => chain,
});

export class Setting {
	constructor(_containerEl: any) {}
	setName(_name: string): this {
		return this;
	}
	setDesc(_desc: string): this {
		return this;
	}
	setHeading(): this {
		return this;
	}
	addText(callback?: (text: any) => any): this {
		callback?.(chain);
		return this;
	}
	addToggle(callback?: (toggle: any) => any): this {
		callback?.(chain);
		return this;
	}
	addButton(callback?: (button: any) => any): this {
		callback?.(chain);
		return this;
	}
	addDropdown(callback?: (dropdown: any) => any): this {
		callback?.(chain);
		return this;
	}
}

export class PluginSettingTab {
	app: App;
	plugin: any;
	containerEl: any = typeof document !== 'undefined' ? document.createElement('div') : null;
	constructor(app: App, plugin: any) {
		this.app = app;
		this.plugin = plugin;
	}
	display(): void {}
	hide(): void {}
}

export class ItemView {
	getViewType(): string {
		return 'fake-item-view';
	}
}

export class MarkdownRenderer {
	static readonly calls: { markdown: string; sourcePath: string }[] = [];
	// Appends the raw markdown as a text node — tests assert on text content,
	// never on rendered markdown HTML (F3 §4.2).
	static async render(
		_app: any,
		markdown: string,
		el: HTMLElement,
		sourcePath: string,
		_component: Component,
	): Promise<void> {
		MarkdownRenderer.calls.push({ markdown, sourcePath });
		el.appendChild(el.ownerDocument.createTextNode(markdown));
	}
}

export function setIcon(el: HTMLElement, iconId: string): void {
	el.setAttribute('data-icon', iconId);
}
export function setTooltip(el: HTMLElement, tooltip: string, _options?: any): void {
	el.setAttribute('data-tooltip', tooltip);
}

export const request = jest.fn(async (_params: any): Promise<string> => '');
export const requestUrl = jest.fn(async (_params: any): Promise<any> => ({
	status: 200,
	text: '',
	json: {},
	arrayBuffer: new ArrayBuffer(0),
}));

// ---------------------------------------------------------------- ctx fake
export interface MarkdownSectionInformation {
	text: string;
	lineStart: number;
	lineEnd: number;
}

export interface MarkdownPostProcessorContext {
	docId: string;
	sourcePath: string;
	frontmatter: any | undefined;
	addChild(child: MarkdownRenderChild): void;
	getSectionInfo(el: HTMLElement): MarkdownSectionInformation | null;
}

export interface FakeContext extends MarkdownPostProcessorContext {
	el: HTMLElement;
	addedChildren: MarkdownRenderChild[];
}

/**
 * Fake MarkdownPostProcessorContext bound to a note in the vault fake.
 * getSectionInfo RE-SCANS the file's CURRENT content on every call for the
 * blockIndex-th ds-* fenced block (``` or ~~~) — modeling Obsidian re-rendering
 * after each write. Returns { text: <whole file>, lineStart, lineEnd } with the
 * fence lines inclusive, matching what CodeBlocks.updateMarkdownCodeBlock splices.
 */
export function makeFakeContext(app: App, sourcePath: string, blockIndex = 0): FakeContext {
	const el: HTMLElement =
		typeof document !== 'undefined' ? document.createElement('div') : ({} as HTMLElement);
	const addedChildren: MarkdownRenderChild[] = [];
	return {
		docId: `fake-doc-${sourcePath}`,
		sourcePath,
		frontmatter: undefined,
		el,
		addedChildren,
		addChild(child: MarkdownRenderChild): void {
			addedChildren.push(child);
		},
		getSectionInfo(_el: HTMLElement): MarkdownSectionInformation | null {
			const content = app.vault.getContent(sourcePath);
			if (content == null) return null;
			const lines = content.split('\n');
			let matchIndex = -1;
			let openLine = -1;
			let fence = '';
			for (let i = 0; i < lines.length; i++) {
				if (openLine === -1) {
					const open = lines[i].match(/^([`~]{3,})ds-[\w-]+\s*$/);
					if (open) {
						openLine = i;
						fence = open[1];
					}
				} else {
					const close = lines[i].match(/^([`~]{3,})\s*$/);
					if (close && close[1][0] === fence[0] && close[1].length >= fence.length) {
						matchIndex++;
						if (matchIndex === blockIndex) {
							return { text: content, lineStart: openLine, lineEnd: i };
						}
						openLine = -1;
					}
				}
			}
			return null;
		},
	};
}

/** Drains the macrotask yields of un-awaited click → vault-write pipelines. */
export async function flushAsync(rounds = 3): Promise<void> {
	for (let i = 0; i < rounds; i++) {
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
}
```

Update `jest.config.ts` — replace the whole file with:

```typescript
import type { Config } from 'jest';

// Path aliases mirror tsconfig.json `paths` (+ baseUrl-resolved bare `main`).
// Longest-prefix entries must come before the catch-all `@/`.
const aliases: Record<string, string> = {
	'^@model/(.*)$': '<rootDir>/src/model/$1',
	'^@utils/(.*)$': '<rootDir>/src/utils/$1',
	'^@views/(.*)$': '<rootDir>/src/views/$1',
	'^@drawSteelAdmonition/(.*)$': '<rootDir>/src/drawSteelAdmonition/$1',
	'^@drawSteelComponents/(.*)$': '<rootDir>/src/drawSteelComponents/$1',
	'^@/(.*)$': '<rootDir>/src/$1',
	'^main$': '<rootDir>/main.ts',
	// The obsidian npm package is types-only; all runtime goes to the mock.
	'^obsidian$': '<rootDir>/test/mocks/obsidian.ts',
	// Vue SFCs: out of scope until D1 (F3 §4.5) — stub them.
	'\\.vue$': '<rootDir>/test/mocks/vueStub.ts',
	// main.ts imports ./styles-source.css; identity-obj-proxy is already installed.
	'\\.css$': 'identity-obj-proxy',
};

const transform = {
	// diagnostics MUST stay off: the repo's type-check is failing today (F3 TS-1,
	// e.g. `ctx.el` in src/utils/CodeBlocks.ts). CI runs tsc separately.
	'^.+\\.ts$': [
		'ts-jest',
		{
			diagnostics: false,
			tsconfig: {
				module: 'commonjs',
				target: 'ES2018',
				lib: ['ES2018', 'DOM'],
				esModuleInterop: true,
			},
		},
	],
	// .yaml imports are raw text, matching esbuild's yamlLoaderPlugin.
	'^.+\\.ya?ml$': '<rootDir>/test/mocks/rawTextTransformer.js',
} as const;

const config: Config = {
	projects: [
		{
			displayName: 'unit',
			testEnvironment: 'node',
			testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
			moduleNameMapper: aliases,
			transform: transform as any,
			setupFiles: ['<rootDir>/test/setup/polyfills.ts'],
		},
		{
			displayName: 'dom',
			testEnvironment: 'jsdom',
			testMatch: ['<rootDir>/test/dom/**/*.test.ts'],
			moduleNameMapper: aliases,
			transform: transform as any,
			setupFiles: ['<rootDir>/test/setup/polyfills.ts', '<rootDir>/test/setup/dom-setup.ts'],
		},
	],
};

export default config;
```

- [ ] **Step 4: Run to confirm PASS**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest'
```

Expected: PASS — `Test Suites: 4 passed, 4 total` / `Tests: 22 passed, 22 total` (4 smoke + 11 unit-mock + 7 dom-mock... jest prints the authoritative count; all must pass, none skipped).

- [ ] **Step 5: Commit**

```bash
cd "$WT/draw-steel-elements" && git add jest.config.ts test/mocks/obsidian.ts test/setup/polyfills.ts test/setup/dom-setup.ts test/unit/mocks/obsidian-mock.test.ts test/dom/mocks/dom-setup.test.ts && git commit -m "test: obsidian module mock with in-memory vault fake, dom-setup, polyfills"
```

---

### Task 3: T-1 + T-2 — `parseEncounterData` happy path and error surface

**Files:**
- Create: `draw-steel-elements/test/fixtures/initiative/quick-start.yaml`
- Create: `draw-steel-elements/test/fixtures/initiative/squad.yaml`
- Test: `draw-steel-elements/test/unit/model/encounter-data.test.ts`

**Interfaces:**
- Consumes: `App` from the mock; `parseEncounterData(source: string, app: App, settings: DSESettings): Promise<EncounterData>` from `@drawSteelAdmonition/EncounterData`; `DEFAULT_SETTINGS` from `@model/Settings`.
- Produces: the two initiative fixtures reused by Tasks 5 and 11.

- [ ] **Step 1: Write the failing test (fixtures don't exist yet)**

Create `test/unit/model/encounter-data.test.ts`:

```typescript
import { parseEncounterData } from '@drawSteelAdmonition/EncounterData';
import { DEFAULT_SETTINGS } from '@model/Settings';
import { App } from '../../mocks/obsidian';
import quickStart from '../../fixtures/initiative/quick-start.yaml';
import squad from '../../fixtures/initiative/squad.yaml';

const parse = (source: string) => parseEncounterData(source, new App() as any, DEFAULT_SETTINGS);

describe('T-1: parseEncounterData — happy path', () => {
	test('heroes get defaults: current_stamina→max, temp→0, turn=false, isHero, [] conditions', async () => {
		const data = await parse(quickStart);
		const frodo = data.heroes[0];
		expect(frodo.name).toBe('Frodo Baggins');
		expect(frodo.max_stamina).toBe(80);
		expect(frodo.current_stamina).toBe(80);
		expect(frodo.temp_stamina).toBe(0);
		expect(frodo.has_taken_turn).toBe(false);
		expect(frodo.isHero).toBe(true);
		expect(frodo.conditions).toEqual([]);
	});

	test('string and object conditions normalize to Condition objects', async () => {
		const data = await parse(squad);
		expect(data.heroes[0].conditions).toEqual([
			{ key: 'grabbed', color: undefined, effect: undefined },
			{ key: 'bleeding', color: 'crimson', effect: undefined },
		]);
	});

	test('creature instances auto-created with 1-based ids and full stamina', async () => {
		const data = await parse(quickStart);
		const orc = data.enemy_groups[0].creatures[0];
		expect(orc.isHero).toBe(false);
		expect(orc.instances).toHaveLength(4);
		expect(orc.instances!.map((i) => i.id)).toEqual([1, 2, 3, 4]);
		expect(orc.instances![0]).toMatchObject({ current_stamina: 40, temp_stamina: 0, conditions: [] });
		const troll = data.enemy_groups[0].creatures[1];
		expect(troll.instances).toHaveLength(1);
	});

	test('squad minion pool initializes to max_stamina × amount; minion instances carry no stamina', async () => {
		const data = await parse(squad);
		const group = data.enemy_groups[0];
		expect(group.is_squad).toBe(true);
		expect(group.minion_stamina_pool).toBe(20); // 4 stamina × 5 minions
		const minion = group.creatures[0];
		expect(minion.instances).toHaveLength(5);
		expect(minion.instances![0].current_stamina).toBeUndefined();
		expect(minion.instances![0].conditions).toEqual([]);
		const captain = group.creatures[1];
		expect(captain.instances![0].current_stamina).toBe(40);
	});

	test('missing malice defaults to { value: 0 }; provided malice is kept', async () => {
		expect((await parse(squad)).malice).toEqual({ value: 0 });
		expect((await parse(quickStart)).malice.value).toBe(5);
	});
});

describe('T-2: parseEncounterData — error surface (user-facing message contract)', () => {
	test('non-object input', async () => {
		await expect(parse('just a string')).rejects.toThrow('The input must be a YAML object.');
	});

	test('missing heroes', async () => {
		await expect(parse('enemy_groups: []')).rejects.toThrow(
			"Invalid data: 'heroes' field is missing or is not a list.",
		);
	});

	test('missing enemy_groups', async () => {
		await expect(parse('heroes: []')).rejects.toThrow(
			"Invalid data: 'enemy_groups' field is missing or is not a list.",
		);
	});

	test('hero missing name', async () => {
		await expect(parse('heroes:\n  - max_stamina: 10\nenemy_groups: []')).rejects.toThrow(
			"Hero at index 0 is missing the 'name' field.",
		);
	});

	test('hero missing max_stamina', async () => {
		await expect(parse('heroes:\n  - name: Frodo\nenemy_groups: []')).rejects.toThrow(
			"Hero 'Frodo' is missing or has an invalid 'max_stamina' field.",
		);
	});

	test('invalid condition shape', async () => {
		const yaml = [
			'heroes:',
			'  - name: Frodo',
			'    max_stamina: 10',
			'    conditions:',
			'      - 5',
			'enemy_groups: []',
		].join('\n');
		await expect(parse(yaml)).rejects.toThrow("Invalid condition format for hero 'Frodo'.");
	});

	const squadYaml = (creatures: string) =>
		['heroes: []', 'enemy_groups:', '  - name: Squad', '    is_squad: true', '    creatures:', creatures].join('\n');

	test('squad with more than two creatures', async () => {
		const creatures = [
			'      - {name: A, max_stamina: 4, amount: 1, squad_role: minion}',
			'      - {name: B, max_stamina: 4, amount: 1, squad_role: minion}',
			'      - {name: C, max_stamina: 40, amount: 1, squad_role: captain}',
		].join('\n');
		await expect(parse(squadYaml(creatures))).rejects.toThrow(
			"Squad 'Squad' can have at most two creatures (minions and an optional captain).",
		);
	});

	test('squad creature missing squad_role', async () => {
		const creatures = '      - {name: A, max_stamina: 4, amount: 1}';
		await expect(parse(squadYaml(creatures))).rejects.toThrow(
			"Creature 'A' in squad 'Squad' must have a 'squad_role' of 'minion' or 'captain'.",
		);
	});

	test('squad creature with invalid squad_role value', async () => {
		const creatures = '      - {name: A, max_stamina: 4, amount: 1, squad_role: boss}';
		await expect(parse(squadYaml(creatures))).rejects.toThrow(
			"Creature 'A' in squad 'Squad' has an invalid 'squad_role' value.",
		);
	});

	test('squad with two minion creature types', async () => {
		const creatures = [
			'      - {name: A, max_stamina: 4, amount: 2, squad_role: minion}',
			'      - {name: B, max_stamina: 4, amount: 2, squad_role: minion}',
		].join('\n');
		await expect(parse(squadYaml(creatures))).rejects.toThrow(
			"Squad 'Squad' can have only one minion creature type.",
		);
	});

	test('squad without any minions', async () => {
		const creatures = '      - {name: Cap, max_stamina: 40, amount: 1, squad_role: captain}';
		await expect(parse(squadYaml(creatures))).rejects.toThrow(
			"Squad 'Squad' must have at least one minion creature.",
		);
	});

	test('non-numeric malice value', async () => {
		const yaml = ['heroes: []', 'enemy_groups: []', 'malice:', '  value: very high'].join('\n');
		await expect(parse(yaml)).rejects.toThrow("Invalid data: 'malice.value' must be a number.");
	});
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/encounter-data.test.ts'
```

Expected: FAIL with `Cannot find module '../../fixtures/initiative/quick-start.yaml'`.

- [ ] **Step 3: Create the fixtures**

Create `test/fixtures/initiative/quick-start.yaml` (the documented quick-start example, `docs/initiative-tracker.md`):

```yaml
heroes:
  - name: "Frodo Baggins"
    max_stamina: 80
    image: "images/frodo.png"
  - name: "Samwise Gamgee"
    max_stamina: 90
    image: "images/sam.png"
enemy_groups:
  - name: "Mordor Forces"
    creatures:
      - name: "Orc"
        max_stamina: 40
        amount: 4
        image: "images/orc.png"
      - name: "Troll"
        max_stamina: 150
        amount: 1
        image: "images/troll.png"
malice:
  value: 5
```

Create `test/fixtures/initiative/squad.yaml` (squad shape from `docs/initiative-tracker.md`'s field reference; numbers chosen so the pool math is easy: 5 minions × 4 stamina = pool 20):

```yaml
heroes:
  - name: "Aragorn"
    max_stamina: 120
    conditions:
      - grabbed
      - key: bleeding
        color: crimson
enemy_groups:
  - name: "Goblin Squad"
    is_squad: true
    creatures:
      - name: "Goblin"
        max_stamina: 4
        amount: 5
        squad_role: minion
      - name: "Goblin Captain"
        max_stamina: 40
        amount: 1
        squad_role: captain
```

- [ ] **Step 4: Run to confirm PASS**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/encounter-data.test.ts'
```

Expected: PASS — `Tests: 17 passed, 17 total` (5 happy-path + 12 error-surface).

- [ ] **Step 5: Commit**

```bash
cd "$WT/draw-steel-elements" && git add test/fixtures/initiative test/unit/model/encounter-data.test.ts && git commit -m "test: T-1/T-2 parseEncounterData happy path + error surface"
```

---

### Task 4: T-3 — `CodeBlocks.updateMarkdownCodeBlock` round-trip, CB-5 and CB-3 as failing tests

**Files:**
- Create: `draw-steel-elements/test/fixtures/counter/health.yaml`
- Test: `draw-steel-elements/test/unit/utils/code-blocks.test.ts`

**Interfaces:**
- Consumes: `App`, `makeFakeContext`, and `FakeVault.modifyCalls`/`getContent` from Task 2; `CodeBlocks.updateCodeBlock(app, data, ctx, language): Promise<void>` from `@utils/CodeBlocks`.
- Produces: the counter fixture reused by Task 11.

**Note on `test.failing`:** it *passes* while the assertions fail (bug present) and *fails* once the bug is fixed — the fixer must then promote it to a plain `test(...)`. This is how CB-3/CB-5 (and Task 5's CB-1/CB-2/DC-6) "flip green" later.

- [ ] **Step 1: Write the failing test**

Create `test/fixtures/counter/health.yaml` (the documented example, `docs/counter.md`):

```yaml
name: Health
current_value: 10
max_value: 20
min_value: 0
```

Create `test/unit/utils/code-blocks.test.ts`:

```typescript
import { CodeBlocks } from '@utils/CodeBlocks';
import { App, makeFakeContext } from '../../mocks/obsidian';

const NOTE = [
	'# Session notes',
	'',
	'Before text.',
	'',
	'```ds-counter',
	'name: Health',
	'current_value: 10',
	'min_value: 0',
	'```',
	'',
	'After text.',
].join('\n');

describe('T-3: CodeBlocks.updateMarkdownCodeBlock round-trip on the vault fake', () => {
	test('replaces only the target block lines; surrounding note intact', async () => {
		const app = new App();
		app.vault.setFile('Note.md', NOTE);
		const ctx = makeFakeContext(app, 'Note.md');
		await CodeBlocks.updateCodeBlock(
			app as any,
			{ name: 'Health', current_value: 11, min_value: 0 },
			ctx as any,
			'ds-counter',
		);
		const updated = app.vault.getContent('Note.md')!;
		const lines = updated.split('\n');
		expect(lines[0]).toBe('# Session notes');
		expect(lines[2]).toBe('Before text.');
		expect(lines[4]).toBe('```ds-counter');
		expect(updated).toContain('current_value: 11');
		expect(updated).not.toContain('current_value: 10');
		expect(lines[8]).toBe('```');
		expect(lines[10]).toBe('After text.');
		expect(app.vault.modifyCalls).toHaveLength(1);
	});

	test('no-op (no write, no throw) when the block cannot be located', async () => {
		const app = new App();
		app.vault.setFile('Note.md', '# No block here');
		const ctx = makeFakeContext(app, 'Note.md');
		await CodeBlocks.updateCodeBlock(app as any, { a: 1 }, ctx as any, 'ds-counter');
		expect(app.vault.getContent('Note.md')).toBe('# No block here');
		expect(app.vault.modifyCalls).toHaveLength(0);
	});

	test('no-op (console.warn path) when the source file does not exist', async () => {
		const app = new App();
		const ctx = makeFakeContext(app, 'Missing.md');
		await expect(
			CodeBlocks.updateCodeBlock(app as any, { a: 1 }, ctx as any, 'ds-counter'),
		).resolves.toBeUndefined();
		expect(app.vault.modifyCalls).toHaveLength(0);
	});

	// CB-5 (F3 §2.1): every save rewrites the fence language to the canonical
	// form. Correct behavior — preserving the alias the user wrote (OD-2 default)
	// — is encoded here; the fix flips this green (then promote to plain test).
	test.failing('CB-5: preserves the alias fence language the user wrote (ds-it stays ds-it)', async () => {
		const app = new App();
		app.vault.setFile('Note.md', ['```ds-it', 'heroes: []', 'enemy_groups: []', '```'].join('\n'));
		const ctx = makeFakeContext(app, 'Note.md');
		await CodeBlocks.updateCodeBlock(
			app as any,
			{ heroes: [], enemy_groups: [] },
			ctx as any,
			'ds-initiative',
		);
		expect(app.vault.getContent('Note.md')!.split('\n')[0]).toBe('```ds-it');
	});

	// CB-3 (F3 §2.1): vault.read → splice → vault.modify is non-atomic. The
	// vault fake's read() snapshots content then yields a macrotask, so two
	// in-flight updates deterministically interleave and the first write is
	// lost. Fixing CB-3 (Vault.process + per-file queue) flips this green.
	test.failing('CB-3: two concurrent updates to different blocks both survive', async () => {
		const app = new App();
		const note = [
			'```ds-counter',
			'name: A',
			'current_value: 1',
			'```',
			'',
			'```ds-counter',
			'name: B',
			'current_value: 1',
			'```',
		].join('\n');
		app.vault.setFile('Note.md', note);
		const ctxA = makeFakeContext(app, 'Note.md', 0);
		const ctxB = makeFakeContext(app, 'Note.md', 1);
		await Promise.all([
			CodeBlocks.updateCodeBlock(app as any, { name: 'A', current_value: 2 }, ctxA as any, 'ds-counter'),
			CodeBlocks.updateCodeBlock(app as any, { name: 'B', current_value: 2 }, ctxB as any, 'ds-counter'),
		]);
		const updated = app.vault.getContent('Note.md')!;
		expect(updated).toContain('name: A\ncurrent_value: 2');
		expect(updated).toContain('name: B\ncurrent_value: 2');
	});
});
```

- [ ] **Step 2: Run to confirm the red/green split**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/utils/code-blocks.test.ts'
```

Expected: PASS — `Tests: 5 passed, 5 total`. The two `test.failing` entries count as passed *because* today's code exhibits the bugs. If either reports as a failure with `Failing test passed even though it was supposed to fail`, the bug is unexpectedly absent — stop and investigate (systematic-debugging) before proceeding.

- [ ] **Step 3: Commit**

```bash
cd "$WT/draw-steel-elements" && git add test/fixtures/counter test/unit/utils/code-blocks.test.ts && git commit -m "test: T-3 CodeBlocks round-trip; encode CB-3 race and CB-5 alias rewrite as failing"
```

---

### Task 5: T-4 — Minion stamina pool math; CB-1, CB-2, DC-6 as failing tests

**Files:**
- Test: `draw-steel-elements/test/dom/views/minion-stamina-pool-modal.test.ts`

**Interfaces:**
- Consumes: `App`, `Plugin`, `makeFakeContext`, `flushAsync` from Task 2; `test/fixtures/initiative/squad.yaml` from Task 3; `MinionStaminaPoolModal` constructor `(app, group: EnemyGroup, creature: Creature, data: EncounterData, ctx, updateCallback: () => void)` from `@views/MinionStaminaPoolModal`; `CodeBlocks.updateInitiativeTracker(app, data, ctx)` from `@utils/CodeBlocks`.
- Produces: nothing downstream; final regression net for CB-1/CB-2/DC-6.

Math background (all derived from `max_stamina: 4` × `amount: 5` → pool max 20, pool current 20): `minionsToKill = floor((poolMax − newStamina)/max) − floor((poolMax − current)/max)`.

- [ ] **Step 1: Write the test**

Create `test/dom/views/minion-stamina-pool-modal.test.ts`:

```typescript
import { parseEncounterData, EncounterData, EnemyGroup, Creature } from '@drawSteelAdmonition/EncounterData';
import { MinionStaminaPoolModal } from '@views/MinionStaminaPoolModal';
import { CodeBlocks } from '@utils/CodeBlocks';
import { DEFAULT_SETTINGS } from '@model/Settings';
import { App, makeFakeContext, flushAsync, FakeContext } from '../../mocks/obsidian';
import squadYaml from '../../fixtures/initiative/squad.yaml';

interface Setup {
	app: App;
	ctx: FakeContext;
	data: EncounterData;
	group: EnemyGroup;
	minion: Creature;
	modal: MinionStaminaPoolModal;
	content: HTMLElement;
	updateCallback: jest.Mock;
}

// `persist: true` mirrors production: the initiative tracker's update callback
// writes the block back via CodeBlocks (needed for the CB-2/DC-6 scenarios).
async function setup(options: { condition?: boolean; persist?: boolean } = {}): Promise<Setup> {
	const app = new App();
	const note = '# Encounter\n\n```ds-initiative\n' + squadYaml.trimEnd() + '\n```\n';
	app.vault.setFile('Encounter.md', note);
	const ctx = makeFakeContext(app, 'Encounter.md');
	const data = await parseEncounterData(squadYaml, app as any, DEFAULT_SETTINGS);
	const group = data.enemy_groups[0];
	const minion = group.creatures[0];
	if (options.condition) {
		minion.instances![0].conditions = [{ key: 'grabbed', color: undefined, effect: undefined }];
	}
	const updateCallback = options.persist
		? (jest.fn(() => { CodeBlocks.updateInitiativeTracker(app as any, data, ctx as any); }) as jest.Mock)
		: jest.fn();
	const modal = new MinionStaminaPoolModal(app as any, group, minion, data, ctx as any, updateCallback);
	modal.open();
	const content = (modal as any).contentEl as HTMLElement;
	return { app, ctx, data, group, minion, modal, content, updateCallback };
}

function applyDamage(content: HTMLElement, damage: number, minions: number): void {
	const inputs = content.querySelectorAll<HTMLInputElement>('.apply-input');
	inputs[0].value = String(damage); // damage per minion
	inputs[1].value = String(minions); // number of minions hit
	(content.querySelector('.apply-btn') as HTMLElement).click();
}

describe('T-4: minion pool — minionsToKill math (via the modal info text)', () => {
	// pool 20, minion max 4: kills = floor(totalDamage / 4) while pool starts full
	test.each([
		[3, 1, 0], // 3 total damage → 0 kills
		[4, 1, 1], // 4 → 1
		[4, 2, 2], // 8 → 2
		[11, 1, 2], // 11 → 2
		[4, 5, 5], // 20 → 5 (pool empty)
	])('%i damage to %i minion(s) reports %i to kill', async (damage, minions, kills) => {
		const { content } = await setup();
		applyDamage(content, damage, minions);
		const info = content.querySelector('.info-text') as HTMLElement;
		expect(info.textContent).toContain(`will kill ${kills} minion(s)`);
	});

	test('kill flow: checked minion is marked dead and callback fires once', async () => {
		const { content, minion, updateCallback } = await setup();
		applyDamage(content, 4, 1); // exactly one minion's worth
		const checkbox = content.querySelector<HTMLInputElement>('.minion-checkbox')!;
		checkbox.checked = true;
		checkbox.dispatchEvent(new Event('change'));
		(content.querySelector('.action-button') as HTMLElement).click();
		expect(minion.instances![0].isDead).toBe(true);
		expect(updateCallback).toHaveBeenCalledTimes(1);
	});

	// CB-1 (crit, F3 §2.1): MinionStaminaPoolModal.ts:226 —
	// `len ?? 0 * max` parses as `len ?? (0 * max)`, so the pool is clamped to
	// the ALIVE-MINION COUNT on apply. Correct math (pool 20 − 3 = 17) is
	// encoded; today it saves Math.min(5, 17) = 5. Parenthesizing flips this
	// green (then promote to plain test).
	test.failing('CB-1: applying 3 damage to a full 20-point pool saves 17, not the minion count', async () => {
		const { content, group } = await setup();
		applyDamage(content, 3, 1);
		(content.querySelector('.action-button') as HTMLElement).click();
		expect(group.minion_stamina_pool).toBe(17);
	});

	// CB-2 (high, F3 §2.1): MinionStaminaPoolModal.ts:447 — condition removal
	// calls CodeBlocks.updateCodeBlock(app, data, ctx, "") and rewrites the
	// fence with an EMPTY language, killing the tracker. Correct behavior
	// (fence keeps a real language) is encoded.
	test.failing('CB-2: removing a condition keeps the ds-initiative fence language', async () => {
		const { app, content } = await setup({ condition: true });
		(content.querySelector('.condition-icon') as HTMLElement).click();
		await flushAsync();
		expect(app.vault.modifyCalls.length).toBeGreaterThan(0);
		expect(app.vault.getContent('Encounter.md')!).toContain('```ds-initiative');
	});

	// DC-6 (F3 §2.8): the commented-out TODO documents "saving condition changes
	// prevents damage from saving". Only green when CB-1 + CB-2 + the write
	// interaction are all fixed.
	test.failing('DC-6: condition removal AND damage in one modal session both persist', async () => {
		const { app, content } = await setup({ condition: true, persist: true });
		(content.querySelector('.condition-icon') as HTMLElement).click();
		await flushAsync();
		applyDamage(content, 3, 1);
		(content.querySelector('.action-button') as HTMLElement).click();
		await flushAsync();
		const updated = app.vault.getContent('Encounter.md')!;
		expect(updated).toContain('```ds-initiative'); // fence survived (CB-2)
		expect(updated).toContain('minion_stamina_pool: 17'); // damage saved correctly (CB-1)
		expect(updated).not.toContain('grabbed'); // condition removal saved
	});
});
```

- [ ] **Step 2: Run to confirm the red/green split**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/views/minion-stamina-pool-modal.test.ts'
```

Expected: PASS — `Tests: 9 passed, 9 total` (5 table cases + kill flow + 3 `test.failing` that pass because the bugs are present). Same rule as Task 4: a `Failing test passed even though it was supposed to fail` error means a bug is absent — investigate, don't paper over.

- [ ] **Step 3: Commit**

```bash
cd "$WT/draw-steel-elements" && git add test/dom/views/minion-stamina-pool-modal.test.ts && git commit -m "test: T-4 minion pool math; encode CB-1, CB-2, DC-6 as failing"
```

---

### Task 6: T-5 — `StaminaEditModal` HP bookkeeping math

**Files:**
- Test: `draw-steel-elements/test/dom/views/stamina-edit-modal.test.ts`

**Interfaces:**
- Consumes: `App` from Task 2; `StaminaBar` constructor `(collapsible: boolean, collapse_default: boolean, max_stamina: number, current_stamina: number, temp_stamina: number, height: number, style?: string)` from `@model/StaminaBar`; `StaminaEditModal` constructor `(app, staminaBar: StaminaBar, isHero: boolean, name: string, updateCallback: () => void)` from `@views/StaminaEditModal`. Private methods `clampStamina(stamina, negativeStaminaLimit, maxPossibleStamina)`, `amountToDeath(currentStamina, negativeStaminaLimit)`, `amountToMaxStamina(currentStamina, maxStamina)` are reached via an `as any` cast — acceptable for characterization tests; F1 later extracts them into pure functions.
- Produces: nothing downstream.

- [ ] **Step 1: Write the test**

Create `test/dom/views/stamina-edit-modal.test.ts`:

```typescript
import { StaminaBar } from '@model/StaminaBar';
import { StaminaEditModal } from '@views/StaminaEditModal';
import { App } from '../../mocks/obsidian';

function makeModal(max: number, current: number, temp: number, isHero = true) {
	const app = new App();
	const bar = new StaminaBar(false, false, max, current, temp, 1);
	const updateCallback = jest.fn();
	const modal = new StaminaEditModal(app as any, bar, isHero, 'Frodo', updateCallback);
	modal.open();
	const content = (modal as any).contentEl as HTMLElement;
	return { modal: modal as any, bar, content, updateCallback };
}

function clickDamage(content: HTMLElement, amount: number): void {
	(content.querySelector('.apply-input') as HTMLInputElement).value = String(amount);
	(content.querySelectorAll('.apply-btn')[0] as HTMLElement).click(); // [0]=Damage, [1]=Healing
}

function clickHealing(content: HTMLElement, amount: number): void {
	(content.querySelector('.apply-input') as HTMLInputElement).value = String(amount);
	(content.querySelectorAll('.apply-btn')[1] as HTMLElement).click();
}

function apply(content: HTMLElement): void {
	(content.querySelector('.action-button') as HTMLElement).click();
}

describe('T-5: StaminaEditModal — pure math helpers', () => {
	test('clampStamina clamps to [negativeLimit, max]', () => {
		const { modal } = makeModal(20, 10, 0);
		expect(modal.clampStamina(25, -10, 20)).toBe(20);
		expect(modal.clampStamina(-15, -10, 20)).toBe(-10);
		expect(modal.clampStamina(7, -10, 20)).toBe(7);
	});

	test('amountToDeath / amountToMaxStamina account for pending change', () => {
		const { modal } = makeModal(20, 10, 0);
		expect(modal.amountToDeath(10, -10)).toBe(20);
		expect(modal.amountToMaxStamina(10, 20)).toBe(10);
		modal.pendingStaminaChange = -3;
		expect(modal.amountToDeath(10, -10)).toBe(17);
		expect(modal.amountToMaxStamina(10, 20)).toBe(13);
	});
});

describe('T-5: StaminaEditModal — hero negative floor ceil(-0.5 × max)', () => {
	test('hero with max 15: Kill floors at -7 (ceil(-7.5))', () => {
		const { content, bar } = makeModal(15, 10, 0, true);
		(content.querySelectorAll('.quick-mod-btn')[0] as HTMLElement).click(); // Kill
		apply(content);
		expect(bar.current_stamina).toBe(-7);
	});

	test('non-hero: Kill floors at 0', () => {
		const { content, bar } = makeModal(15, 10, 0, false);
		(content.querySelectorAll('.quick-mod-btn')[0] as HTMLElement).click(); // Kill
		apply(content);
		expect(bar.current_stamina).toBe(0);
	});

	test('damage cannot push a hero past the death floor', () => {
		const { content, bar } = makeModal(20, -8, 0, true); // floor is -10
		clickDamage(content, 100);
		apply(content);
		expect(bar.current_stamina).toBe(-10);
	});
});

describe('T-5: StaminaEditModal — temp stamina absorbs damage first', () => {
	test('8 damage against 5 temp: temp → 0, stamina 10 → 7', () => {
		const { modal, content, bar, updateCallback } = makeModal(20, 10, 5);
		clickDamage(content, 8);
		expect(modal.pendingTempStaminaChange).toBe(-5);
		expect(modal.pendingStaminaChange).toBe(-3);
		apply(content);
		expect(bar.current_stamina).toBe(7);
		expect(bar.temp_stamina).toBe(0);
		expect(updateCallback).toHaveBeenCalledTimes(1);
	});

	test('3 damage against 5 temp: only temp is consumed', () => {
		const { modal, content, bar } = makeModal(20, 10, 5);
		clickDamage(content, 3);
		expect(modal.pendingTempStaminaChange).toBe(-3);
		expect(modal.pendingStaminaChange).toBe(0);
		apply(content);
		expect(bar.current_stamina).toBe(10);
		expect(bar.temp_stamina).toBe(2);
	});

	test('healing clamps at max stamina', () => {
		const { content, bar } = makeModal(20, 18, 0);
		clickHealing(content, 10);
		apply(content);
		expect(bar.current_stamina).toBe(20);
	});

	test('Full Heal restores max and zeroes temp', () => {
		const { content, bar } = makeModal(20, 3, 4);
		(content.querySelectorAll('.quick-mod-btn')[1] as HTMLElement).click(); // Full Heal
		apply(content);
		expect(bar.current_stamina).toBe(20);
		expect(bar.temp_stamina).toBe(0);
	});

	test('Spend Recovery heals floor(max/3)', () => {
		const { content, bar } = makeModal(21, 10, 0);
		(content.querySelectorAll('.quick-mod-btn')[2] as HTMLElement).click(); // Spend Recovery
		apply(content);
		expect(bar.current_stamina).toBe(17); // 10 + floor(21/3)
	});
});
```

- [ ] **Step 2: Run to confirm PASS**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/views/stamina-edit-modal.test.ts'
```

Expected: PASS — `Tests: 10 passed, 10 total`. These characterize believed-correct behavior; if one fails, first re-derive the arithmetic by hand against `src/views/StaminaEditModal.ts:72-87,268-280` — if the source really disagrees with the DS rules, convert that case to `test.failing` with a comment citing the discrepancy and file it as a follow-up (do NOT change src).

- [ ] **Step 3: Commit**

```bash
cd "$WT/draw-steel-elements" && git add test/dom/views/stamina-edit-modal.test.ts && git commit -m "test: T-5 StaminaEditModal clamp/death-floor/temp-first math"
```

---

### Task 7: T-6 — `StaminaBar` model: schema validation, defaults (CB-15 pinned), hero round-trip

**Files:**
- Create: `draw-steel-elements/test/fixtures/stamina/basic.yaml`
- Test: `draw-steel-elements/test/unit/model/stamina-bar.test.ts`

**Interfaces:**
- Consumes: `StaminaBar.parseYaml(source: string): StaminaBar`, `StaminaBar.fromHero(hero: Hero)`, `staminaBar.updateHero(hero: Hero)` from `@model/StaminaBar`; `initializeSchemaRegistry(schemas: Array<{id: string, schema: object | string}>)` / `resetSchemaRegistry()` from `@utils/JsonSchemaValidator`; raw-text yaml import of `@model/schemas/ComponentWrapperSchema.yaml` (the dependency schema `main.ts` registers at startup — the test must do the same).
- Produces: the stamina fixture; the schema-registry setup pattern any future schema-validated element test copies.

- [ ] **Step 1: Write the failing test (fixture missing)**

Create `test/unit/model/stamina-bar.test.ts`:

```typescript
import { StaminaBar } from '@model/StaminaBar';
import { Hero } from '@drawSteelAdmonition/EncounterData';
import { initializeSchemaRegistry, resetSchemaRegistry } from '@utils/JsonSchemaValidator';
import componentWrapperSchema from '@model/schemas/ComponentWrapperSchema.yaml';
import basic from '../../fixtures/stamina/basic.yaml';

// main.ts registers this dependency schema at plugin startup; StaminaBarSchema
// $refs it, so the test must register it too.
beforeAll(() => {
	initializeSchemaRegistry([
		{ id: 'https://steelcompendium.io/schemas/component-wrapper-1.0.0', schema: componentWrapperSchema },
	]);
});
afterAll(() => resetSchemaRegistry());

describe('T-6: StaminaBar.parseYaml', () => {
	test('valid input parses with all fields', () => {
		const bar = StaminaBar.parseYaml(basic);
		expect(bar.max_stamina).toBe(20);
		expect(bar.current_stamina).toBe(15);
		expect(bar.temp_stamina).toBe(5);
		expect(bar.height).toBe(1);
		expect(bar.style).toBe('default');
	});

	test('missing max_stamina throws the composed schema error', () => {
		expect(() => StaminaBar.parseYaml('current_stamina: 5')).toThrow(/max_stamina is required/);
		expect(() => StaminaBar.parseYaml('current_stamina: 5')).toThrow(/^Invalid YAML format: /);
	});

	test('non-integer max_stamina throws its custom errorMessage', () => {
		expect(() => StaminaBar.parseYaml('max_stamina: "a lot"')).toThrow(
			/max_stamina must be a whole, positive number/,
		);
	});

	test('invalid style enum is rejected', () => {
		expect(() => StaminaBar.parseYaml('max_stamina: 10\nstyle: neon')).toThrow(/Schema validation failed/);
	});

	// CB-15 (F3 §2.1, "suspected — verify intent"): a standalone bar with
	// current_stamina omitted defaults to 0 (an empty bar) — INCONSISTENT with
	// the initiative tracker's default-to-max (EncounterData.ts:158). Pinned
	// here as today's behavior; if CB-15 is resolved as "default to max",
	// update this expectation in the same commit as the fix.
	test('CB-15 pinned: omitted current_stamina defaults to 0, not max', () => {
		const bar = StaminaBar.parseYaml('max_stamina: 30');
		expect(bar.current_stamina).toBe(0);
		expect(bar.temp_stamina).toBe(0);
		expect(bar.height).toBe(1);
	});
});

describe('T-6: StaminaBar hero round-trip', () => {
	test('fromHero → mutate → updateHero writes back stamina fields', () => {
		const hero = {
			name: 'Frodo',
			max_stamina: 80,
			current_stamina: 42,
			temp_stamina: 3,
			isHero: true,
			conditions: [],
		} as unknown as Hero;
		const bar = StaminaBar.fromHero(hero);
		expect(bar.max_stamina).toBe(80);
		expect(bar.current_stamina).toBe(42);
		expect(bar.temp_stamina).toBe(3);
		bar.current_stamina = 50;
		bar.temp_stamina = 0;
		bar.updateHero(hero);
		expect(hero.current_stamina).toBe(50);
		expect(hero.temp_stamina).toBe(0);
		expect(hero.max_stamina).toBe(80);
	});
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/stamina-bar.test.ts'
```

Expected: FAIL with `Cannot find module '../../fixtures/stamina/basic.yaml'`.

- [ ] **Step 3: Create the fixture**

Create `test/fixtures/stamina/basic.yaml` (the documented example, `docs/stamina-bar.md`):

```yaml
max_stamina: 20
current_stamina: 15
temp_stamina: 5
```

- [ ] **Step 4: Run to confirm PASS**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/stamina-bar.test.ts'
```

Expected: PASS — `Tests: 6 passed, 6 total`.

- [ ] **Step 5: Commit**

```bash
cd "$WT/draw-steel-elements" && git add test/fixtures/stamina test/unit/model/stamina-bar.test.ts && git commit -m "test: T-6 StaminaBar schema validation, CB-15 default pinned, hero round-trip"
```

---

### Task 8: T-7 — Negotiation logic: `ArgumentPowerRoll.build` matrix + `NegotiationData` motivation truth table

**Files:**
- Create: `draw-steel-elements/test/fixtures/negotiation/frodo.yaml`
- Test: `draw-steel-elements/test/unit/model/negotiation.test.ts`

**Interfaces:**
- Consumes: `ArgumentPowerRoll.build(usedMotivation: boolean, usedPitfall: boolean, caughtLying: boolean, reusedMotivation: boolean, sameArgument: boolean): ArgumentPowerRoll` (fields `t1/t2/t3/crit: ArgumentResult{interest, patience, other}`) and `ArgumentResult` from `@model/ArgumentPowerRolls`; `parseNegotiationData(source): NegotiationData`, `NegotiationData.setMotivationUsed(name, used)`, `.argumentReusesMotivation()`, `.resetData()` from `@model/NegotiationData`. Exercises the `Array.prototype.contains` polyfill in the **node** project.
- Produces: the negotiation fixture.

- [ ] **Step 1: Write the failing test (fixture missing)**

Create `test/unit/model/negotiation.test.ts`:

```typescript
import { ArgumentPowerRoll, ArgumentResult } from '@model/ArgumentPowerRolls';
import { NegotiationData, parseNegotiationData } from '@model/NegotiationData';
import frodoYaml from '../../fixtures/negotiation/frodo.yaml';

const tiers = (roll: ArgumentPowerRoll): number[][] =>
	[roll.t1, roll.t2, roll.t3, roll.crit].map((t) => [t.interest, t.patience]);

describe('T-7: ArgumentPowerRoll.build outcome matrix', () => {
	// build(usedMotivation, usedPitfall, caughtLying, reusedMotivation, sameArgument)
	test('normal argument', () => {
		expect(tiers(ArgumentPowerRoll.build(false, false, false, false, false))).toEqual([
			[-1, -1], [0, -1], [1, -1], [1, 0],
		]);
	});

	test('used motivation', () => {
		expect(tiers(ArgumentPowerRoll.build(true, false, false, false, false))).toEqual([
			[0, -1], [1, -1], [1, 0], [1, 0],
		]);
	});

	test('pitfall trumps motivation', () => {
		expect(tiers(ArgumentPowerRoll.build(true, true, false, false, false))).toEqual([
			[-1, -1], [-1, -1], [-1, -1], [-1, -1],
		]);
	});

	test('reused motivation flattens to 0 interest / -1 patience', () => {
		expect(tiers(ArgumentPowerRoll.build(true, false, false, true, false))).toEqual([
			[0, -1], [0, -1], [0, -1], [0, -1],
		]);
	});

	test('same argument without motivation is all-negative', () => {
		expect(tiers(ArgumentPowerRoll.build(false, false, false, false, true))).toEqual([
			[-1, -1], [-1, -1], [-1, -1], [-1, -1],
		]);
	});

	test('caught lying: -1 interest only on tiers with interest <= 0 (normal)', () => {
		expect(tiers(ArgumentPowerRoll.build(false, false, true, false, false))).toEqual([
			[-2, -1], [-1, -1], [1, -1], [1, 0],
		]);
	});

	test('caught lying: used motivation only t1 drops', () => {
		expect(tiers(ArgumentPowerRoll.build(true, false, true, false, false))).toEqual([
			[-1, -1], [1, -1], [1, 0], [1, 0],
		]);
	});

	test('caught lying: reused motivation drops all tiers', () => {
		expect(tiers(ArgumentPowerRoll.build(true, false, true, true, false))).toEqual([
			[-1, -1], [-1, -1], [-1, -1], [-1, -1],
		]);
	});
});

describe('T-7: ArgumentResult.toString', () => {
	test('formats interest and patience with signs', () => {
		expect(new ArgumentResult(1, -1).toString()).toBe('+1 Interest, -1 Patience');
		expect(new ArgumentResult(-1, 0).toString()).toBe('-1 Interest');
		expect(new ArgumentResult(0, -1).toString()).toBe('-1 Patience');
	});

	test('zero effect renders "No effect"; other text is appended', () => {
		expect(new ArgumentResult(0, 0).toString()).toBe('No effect');
		expect(new ArgumentResult(0, 0, 'mark the target').toString()).toBe('mark the target');
	});
});

describe('T-7: NegotiationData parsing and defaults', () => {
	test('fixture parses with nested Motivation/Pitfall/CurrentArgument instances', () => {
		const data = parseNegotiationData(frodoYaml);
		expect(data.name).toBe('Convincing Frodo to remember the taste of strawberries');
		expect(data.current_patience).toBe(3);
		expect(data.current_interest).toBe(3);
		expect(data.motivations.map((m) => m.name)).toEqual(['Higher Authority', 'Peace']);
		expect(data.motivations[0].hasBeenAppealedTo).toBe(false);
		expect(data.pitfalls.map((p) => p.name)).toEqual(['Power']);
		expect(data.currentArgument.motivationsUsed).toEqual([]);
		expect(data.i0).toBe("Thinks you're after the ring; becomes hostile");
	});

	test('defaults when fields are omitted: patience 5, interest 0, i5..i0 placeholders', () => {
		const data = parseNegotiationData('name: Quick');
		expect(data.current_patience).toBe(5);
		expect(data.current_interest).toBe(0);
		expect(data.i5).toBe('Interest 5 result');
	});
});

describe('T-7: setMotivationUsed / argumentReusesMotivation truth table', () => {
	const fresh = (): NegotiationData => parseNegotiationData(frodoYaml);

	test('marking used sets hasBeenAppealedTo; flags reuse if current argument uses it', () => {
		const data = fresh();
		data.currentArgument.motivationsUsed = ['Peace'];
		data.setMotivationUsed('Peace', true);
		expect(data.motivations[1].hasBeenAppealedTo).toBe(true);
		expect(data.currentArgument.reusedMotivation).toBe(true);
	});

	test('marking used does NOT flag reuse when the argument does not use it', () => {
		const data = fresh();
		data.currentArgument.motivationsUsed = ['Higher Authority'];
		data.setMotivationUsed('Peace', true);
		expect(data.currentArgument.reusedMotivation).toBe(false);
	});

	test('unmarking clears reuse when no other used motivation remains in the argument', () => {
		const data = fresh();
		data.currentArgument.motivationsUsed = ['Peace'];
		data.setMotivationUsed('Peace', true);
		data.setMotivationUsed('Peace', false);
		expect(data.currentArgument.reusedMotivation).toBe(false);
	});

	test('unmarking keeps reuse when another motivation in the argument is still used', () => {
		const data = fresh();
		data.currentArgument.motivationsUsed = ['Peace', 'Higher Authority'];
		data.setMotivationUsed('Peace', true);
		data.setMotivationUsed('Higher Authority', true);
		data.setMotivationUsed('Peace', false);
		expect(data.currentArgument.reusedMotivation).toBe(true);
	});

	test('argumentReusesMotivation reflects hasBeenAppealedTo of used motivations', () => {
		const data = fresh();
		data.currentArgument.motivationsUsed = ['Peace'];
		expect(data.argumentReusesMotivation()).toBe(false);
		data.motivations[1].hasBeenAppealedTo = true; // Peace
		expect(data.argumentReusesMotivation()).toBe(true);
	});

	test('resetData restores patience/interest and clears all flags', () => {
		const data = fresh();
		data.current_patience = 0;
		data.current_interest = 5;
		data.motivations[0].hasBeenAppealedTo = true;
		data.currentArgument.motivationsUsed = ['Peace'];
		data.currentArgument.reusedMotivation = true;
		data.resetData();
		expect(data.current_patience).toBe(3); // initial_patience from fixture
		expect(data.current_interest).toBe(3);
		expect(data.motivations[0].hasBeenAppealedTo).toBe(false);
		expect(data.currentArgument.motivationsUsed).toEqual([]);
		expect(data.currentArgument.reusedMotivation).toBe(false);
	});
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/negotiation.test.ts'
```

Expected: FAIL with `Cannot find module '../../fixtures/negotiation/frodo.yaml'`.

- [ ] **Step 3: Create the fixture**

Create `test/fixtures/negotiation/frodo.yaml` (the documented example, `docs/negotiation-tracker.md`):

```yaml
name: "Convincing Frodo to remember the taste of strawberries"
initial_interest: 3
initial_patience: 3
motivations:
  - name: "Higher Authority"
    reason: "It's Frodo's duty to destroy the ring"
  - name: "Peace"
    reason: "The Shire is life"
pitfalls:
  - name: "Power"
    reason: "The ring is too powerful to ignore"
i5: "Remembers the taste of strawberries and cream!"
i4: "Remembers the taste of strawberries"
i3: "Remembers the taste of unripe strawberries"
i2: "Remembers the smell of strawberries"
i1: "Doesn't remember the taste of strawberries"
i0: "Thinks you're after the ring; becomes hostile"
```

- [ ] **Step 4: Run to confirm PASS**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/negotiation.test.ts'
```

Expected: PASS — `Tests: 18 passed, 18 total`.

- [ ] **Step 5: Commit**

```bash
cd "$WT/draw-steel-elements" && git add test/fixtures/negotiation test/unit/model/negotiation.test.ts && git commit -m "test: T-7 ArgumentPowerRoll matrix + NegotiationData motivation truth table"
```

---

### Task 9: T-8 — `ReferenceResolver`: 5-step findFile chain + ds-block extraction

**Files:**
- Test: `draw-steel-elements/test/unit/utils/reference-resolver.test.ts`

**Interfaces:**
- Consumes: `App` (whose `metadataCache.getFirstLinkpathDest` resolves by basename — Task 2); `new ReferenceResolver(app, settings)` with `resolvePath(path: string): Promise<any>` and `resolveReferences(data: any): Promise<any>` from `@utils/ReferenceResolver`; `DEFAULT_SETTINGS` (`compendiumDestinationDirectory: 'DS Compendium'`).
- Produces: nothing downstream.

- [ ] **Step 1: Write the test**

Create `test/unit/utils/reference-resolver.test.ts`:

```typescript
import { ReferenceResolver } from '@utils/ReferenceResolver';
import { DEFAULT_SETTINGS } from '@model/Settings';
import { App } from '../../mocks/obsidian';

const GOBLIN_NOTE = ['# Goblin', '', '```ds-sb', 'name: Goblin', 'stamina: "20"', '```'].join('\n');

function makeResolver() {
	const app = new App();
	const resolver = new ReferenceResolver(app as any, DEFAULT_SETTINGS);
	return { app, resolver };
}

describe('T-8: ReferenceResolver.findFile 5-step fallback chain (via resolvePath)', () => {
	test('step 1: exact path from vault root', async () => {
		const { app, resolver } = makeResolver();
		app.vault.setFile('Goblin.md', GOBLIN_NOTE);
		await expect(resolver.resolvePath('Goblin.md')).resolves.toEqual({ name: 'Goblin', stamina: '20' });
	});

	test('step 2: root path with .md appended', async () => {
		const { app, resolver } = makeResolver();
		app.vault.setFile('Goblin.md', GOBLIN_NOTE);
		await expect(resolver.resolvePath('Goblin')).resolves.toEqual({ name: 'Goblin', stamina: '20' });
	});

	test('step 3: path under the compendium directory', async () => {
		const { app, resolver } = makeResolver();
		app.vault.setFile('DS Compendium/Bestiary/Goblin.md', GOBLIN_NOTE);
		await expect(resolver.resolvePath('Bestiary/Goblin.md')).resolves.toMatchObject({ name: 'Goblin' });
	});

	test('step 4: compendium path with .md appended', async () => {
		const { app, resolver } = makeResolver();
		app.vault.setFile('DS Compendium/Bestiary/Goblin.md', GOBLIN_NOTE);
		await expect(resolver.resolvePath('Bestiary/Goblin')).resolves.toMatchObject({ name: 'Goblin' });
	});

	test('step 5: metadata-cache lookup by bare name anywhere in the vault', async () => {
		const { app, resolver } = makeResolver();
		app.vault.setFile('Deep/Folders/Thorn Dragon.md', GOBLIN_NOTE);
		await expect(resolver.resolvePath('Thorn Dragon')).resolves.toMatchObject({ name: 'Goblin' });
	});

	test('not found: error names all searched locations', async () => {
		const { resolver } = makeResolver();
		await expect(resolver.resolvePath('Nope')).rejects.toThrow(
			'Reference file (Nope) not found in root, DS Compendium, or when searching the cache',
		);
	});
});

describe('T-8: first-ds-block extraction', () => {
	test('extracts the FIRST ds-* block only', async () => {
		const { app, resolver } = makeResolver();
		const note = ['```ds-sb', 'name: First', '```', '', '```ds-sb', 'name: Second', '```'].join('\n');
		app.vault.setFile('Two.md', note);
		await expect(resolver.resolvePath('Two')).resolves.toEqual({ name: 'First' });
	});

	test('~~~ fences are matched too', async () => {
		const { app, resolver } = makeResolver();
		app.vault.setFile('Tilde.md', ['~~~ds-sb', 'name: Orc', '~~~'].join('\n'));
		await expect(resolver.resolvePath('Tilde')).resolves.toEqual({ name: 'Orc' });
	});

	test('file without any ds-* block throws the contract message', async () => {
		const { app, resolver } = makeResolver();
		app.vault.setFile('Empty.md', '# nothing here');
		await expect(resolver.resolvePath('Empty')).rejects.toThrow(
			'No Draw Steel Elements code block (ds-*) found in Empty.md',
		);
	});
});

describe('T-8: resolveReferences reference syntaxes', () => {
	test('strips @ prefix and [[ ]] wrapping; plain strings resolve as paths', async () => {
		const { app, resolver } = makeResolver();
		app.vault.setFile('Goblin.md', GOBLIN_NOTE);
		await expect(resolver.resolveReferences('@Goblin')).resolves.toMatchObject({ name: 'Goblin' });
		await expect(resolver.resolveReferences('[[Goblin]]')).resolves.toMatchObject({ name: 'Goblin' });
		await expect(resolver.resolveReferences('Goblin')).resolves.toMatchObject({ name: 'Goblin' });
	});

	test('non-string data passes through untouched', async () => {
		const { resolver } = makeResolver();
		await expect(resolver.resolveReferences(42)).resolves.toBe(42);
		await expect(resolver.resolveReferences(null)).resolves.toBeNull();
	});
});
```

- [ ] **Step 2: Run to confirm PASS**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/utils/reference-resolver.test.ts'
```

Expected: PASS — `Tests: 11 passed, 11 total`. A `console.warn "Reference file not found"` line appearing in the output for the not-found test is expected noise.

- [ ] **Step 3: Commit**

```bash
cd "$WT/draw-steel-elements" && git add test/unit/utils/reference-resolver.test.ts && git commit -m "test: T-8 ReferenceResolver fallback chain and ds-block extraction"
```

---

### Task 10: T-9 — SDK boundary snapshots (the F2 upgrade net)

**Files:**
- Create: `draw-steel-elements/test/fixtures/statblock/human-bandit-chief.yaml`
- Create: `draw-steel-elements/test/fixtures/feature/magma-titan.yaml`
- Create: `draw-steel-elements/test/fixtures/featureblock/angulotl-malice.yaml`
- Test: `draw-steel-elements/test/unit/model/sdk-boundary.test.ts` (+ generated `test/unit/model/__snapshots__/sdk-boundary.test.ts.snap`)

**Interfaces:**
- Consumes: `StatblockConfig.readYaml(text: string): StatblockConfig` (field `.statblock`), `FeatureConfig.readYaml(text): FeatureConfig` (fields `.feature`, `.indent?`), `FeatureblockConfig.readYaml(text): FeatureblockConfig` (field `.featureblock`) — all wrapping `steel-compendium-sdk@2.1.5`'s `X.read(new YamlReader(X.modelDTOAdapter), text)`.
- Produces: committed snapshots that pin SDK 2.1.5's parse output. **This is the F2 upgrade net:** when F2 moves to SDK 3.x, the diff surfaces as snapshot changes reviewed in a PR, not as user bug reports. Note: SDK 2.1.5 predates some fields the current data emits (e.g. ability `cost` — F2 OD-5); the snapshot records exactly what 2.1.5 does with them, which is the point.

- [ ] **Step 1: Write the failing test (fixtures missing)**

Create `test/unit/model/sdk-boundary.test.ts`:

```typescript
import { StatblockConfig } from '@model/StatblockConfig';
import { FeatureConfig } from '@model/FeatureConfig';
import { FeatureblockConfig } from '@model/FeatureblockConfig';
import statblockYaml from '../../fixtures/statblock/human-bandit-chief.yaml';
import featureYaml from '../../fixtures/feature/magma-titan.yaml';
import featureblockYaml from '../../fixtures/featureblock/angulotl-malice.yaml';

// Golden inputs are the documented examples (docs/statblock.md, docs/Features.md,
// docs/featureblock.md) — real user inputs. Snapshots pin steel-compendium-sdk
// 2.1.5's parse output; the SDK 3.x upgrade (F2) must review these diffs.
// If a spot-check below fails because 2.1.5 exposes a different property name,
// inspect the written snapshot and correct the property access — the snapshot
// is the contract, the spot-check is a convenience.
describe('T-9: SDK boundary fixtures', () => {
	test('StatblockConfig.readYaml parses the documented statblock', () => {
		const config = StatblockConfig.readYaml(statblockYaml);
		expect(config.statblock.name).toBe('Human Bandit Chief');
		expect(config.statblock).toMatchSnapshot();
	});

	test('FeatureConfig.readYaml parses the documented feature', () => {
		const config = FeatureConfig.readYaml(featureYaml);
		expect(config.feature.name).toBe('Magma Titan');
		expect(config.indent).toBeUndefined();
		expect(config.feature).toMatchSnapshot();
	});

	test('FeatureblockConfig.readYaml parses the documented featureblock', () => {
		const config = FeatureblockConfig.readYaml(featureblockYaml);
		expect(config.featureblock.name).toBe('Angulotl Malice');
		expect(config.featureblock).toMatchSnapshot();
	});
});
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/sdk-boundary.test.ts'
```

Expected: FAIL with `Cannot find module '../../fixtures/statblock/human-bandit-chief.yaml'`.

(Contingency: if after Step 3 the suite instead fails with `Cannot use import statement outside a module` or `ERR_REQUIRE_ESM` pointing into `node_modules/steel-compendium-sdk`, the SDK ships untransformed ESM — add `transformIgnorePatterns: ['/node_modules/(?!steel-compendium-sdk/)']` to BOTH project configs in `jest.config.ts` and re-run.)

- [ ] **Step 3: Create the fixtures**

Create `test/fixtures/statblock/human-bandit-chief.yaml` — the complete documented example from `docs/statblock.md` (content between the `~~~ds-statblock` fences, verbatim):

```yaml
type: statblock
name: Human Bandit Chief
level: 3
roles:
  - Leader
ancestry:
  - Human
  - Humanoid
ev: "20"
stamina: "120"
immunities:
  - Corruption 4
  - psychic 4
speed: 5
size: 1M
stability: 2
free_strike: 5
might: 2
agility: 3
reason: 2
intuition: 3
presence: 2
features:
  - type: feature
    feature_type: ability
    name: Whip and Magic Longsword
    icon: 🗡
    ability_type: Signature Ability
    keywords:
      - Magic
      - Melee
      - Strike
      - Weapon
    usage: Main action
    distance: Melee 2
    target: Two enemies or objects
    effects:
      - roll: Power Roll + 2
        tier1: 8 damage; pull 1
        tier2: 12 damage; pull 2
        tier3: 15 damage; pull 3
      - name: Effect
        effect: Any target who is adjacent to the bandit chief after the power roll is
          resolved takes 3 corruption damage.
      - cost: 2 Malice
        effect: This ability targets one additional target.
  - type: feature
    feature_type: ability
    name: Kneel, Peasant!
    icon: 🗡
    keywords:
      - Melee
    usage: Maneuver
    distance: Melee 1
    target: One enemy
    effects:
      - roll: Power Roll + 2
        tier1: Push 1; M < 1 prone
        tier2: Push 2; M < 2 prone
        tier3: Push 4; M < 3 prone
      - cost: 2 Malice
        effect: The ability takes the Area keyword, loses the Melee keyword, and is a 1
          burst that targets each enemy in the area.
  - type: feature
    feature_type: ability
    name: Bloodstones
    icon: ❗️
    keywords:
      - Magic
    usage: Triggered action
    distance: Self
    target: Self
    trigger: The bandit chief makes a power roll.
    effects:
      - name: Effect
        effect: The bandit chief takes 5 corruption damage and increases the outcome of
          the power roll by one tier. This damage can't be reduced in any way.
  - type: feature
    feature_type: trait
    name: End Effect
    icon: ⭐️
    effects:
      - effect: At the end of each of their turns, the bandit chief can take 5 damage to
          end one effect on them that can be ended by a saving throw. This
          damage can't be reduced in any way.
  - type: feature
    feature_type: trait
    name: Supernatural Insight
    icon: ⭐️
    effects:
      - effect: The bandit chief ignores concealment if it's granted by a supernatural
          effect.
  - type: feature
    feature_type: ability
    name: Shoot!
    icon: ☠️
    ability_type: Villain Action 1
    keywords:
      - Area
    usage: "-"
    distance: 10 burst
    target: Each artillery ally in the area
    effects:
      - name: Effect
        effect: Each target makes a ranged free strike.
  - type: feature
    feature_type: ability
    name: Form Up!
    icon: ☠️
    ability_type: Villain Action 2
    keywords:
      - Area
    usage: "-"
    distance: 10 burst
    target: Each ally in the area
    effects:
      - name: Effect
        effect: Each target shifts up to their speed. Additionally, until the end of the
          encounter, while the bandit chief or any ally is adjacent to a target,
          they have damage immunity 2.
  - type: feature
    feature_type: ability
    name: Lead From the Front
    icon: ☠️
    ability_type: Villain Action 3
    keywords:
      - "-"
    usage: "-"
    distance: Self
    target: Self
    effects:
      - name: Effect
        effect: The bandit chief shifts up to 10 squares regardless of their speed.
          During or after this movement, they can use their Whip and Magic
          Longsword against up to four targets. Additionally, one ally adjacent
          to each target can make a free strike against that target.
```

Create `test/fixtures/feature/magma-titan.yaml` — the complete documented example from `docs/Features.md`:

```yaml
type: feature
feature_type: ability
name: Magma Titan
cost: 9 Essence
flavor: Their body swells with lava, mud, and might, towering over their enemies.
keywords:
  - Earth
  - Fire
  - Magic
  - Ranged
  - Void
usage: Main action
distance: Ranged 10
target: One creature or object
effects:
  - name: Effect
    effect: >-
      Until the start of your next turn, the target has the following benefits:

      - Their size and stability increase by 2, with any size 1 target becoming
      size 3. Each creature who is within the target's new space slides to the
      nearest unoccupied space, ignoring stability. If the target doesn't have
      space to grow, they grow as much as they can and become restrained until
      the effect ends.

      - They have fire immunity 10.

      - Their strikes deal extra fire damage equal to twice your Reason score.

      - When the target force moves a creature or object, the forced movement
      distance gains a +2 bonus.

      - They can use their highest characteristic instead of Might for Might
      power rolls.
  - roll: Power Roll + Reason
    tier1: You teleport the target up to 4 squares.
    tier2: You teleport the target up to 6 squares.
    tier3: You teleport the target up to 8 squares.
  - name: Persistent 2
    effect: The effect lasts until the start of your next turn. Additionally, at the
      start of your turn, the target can spend 2 Recoveries.
```

Create `test/fixtures/featureblock/angulotl-malice.yaml` — the complete documented example from `docs/featureblock.md`:

```yaml
type: featureblock
featureblock_type: Malice Features
name: Angulotl Malice
flavor: At the start of any angulotl's turn, you can spend Malice to activate
  one of the following features.
features:
  - type: feature
    feature_type: trait
    name: Leapfrog
    icon: ⭐️
    cost: 3 Malice
    effects:
      - effect: Until the end of the round, when an angulotl moves through an inactive
          angulotl's space, the inactive angulotl can use a free triggered
          action to jump 3 squares.
  - type: feature
    feature_type: trait
    name: Resonating Croak
    icon: ❇️
    cost: 5 Malice
    effects:
      - effect: Each angulotl in the encounter puffs out their throat and starts loudly
          droning. Any non-angulotl adjacent to an angulotl makes an **Intuition
          test.**
        tier1: 5 sonic damage; slowed (EoT)
        tier2: 4 sonic damage
        tier3: No effect.
  - type: feature
    feature_type: trait
    name: Rainfall
    icon: 🌀
    cost: 7 Malice
    effects:
      - effect: An angulotl calls clouds to cover the encounter map and unleash rain
          until the end of the round. Any creature or object that is exposed to
          the sky is wet until the end of the encounter.
```

- [ ] **Step 4: Run to write snapshots, review, run again to confirm PASS**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/sdk-boundary.test.ts'
```

Expected first run: PASS with `Snapshots: 3 written`. **Open `test/unit/model/__snapshots__/sdk-boundary.test.ts.snap` and sanity-check** it contains real parsed structure (e.g. `Human Bandit Chief`, tier strings) and not empty objects — an empty snapshot means the SDK silently dropped everything and the test is worthless; investigate before committing.

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/unit/model/sdk-boundary.test.ts'
```

Expected second run: PASS with `Snapshots: 3 passed`.

- [ ] **Step 5: Commit (snapshots included)**

```bash
cd "$WT/draw-steel-elements" && git add test/fixtures/statblock test/fixtures/feature test/fixtures/featureblock test/unit/model/sdk-boundary.test.ts test/unit/model/__snapshots__ && git commit -m "test: T-9 SDK 2.1.5 boundary snapshots over documented golden inputs"
```

---

### Task 11: T-10 — DOM render smoke: `InitiativeProcessor` + `CounterView` (the F1 template)

**Files:**
- Test: `draw-steel-elements/test/dom/elements/initiative-render.test.ts`
- Test: `draw-steel-elements/test/dom/elements/counter-view.test.ts`

**Interfaces:**
- Consumes: `App`, `Plugin`, `makeFakeContext`, `flushAsync` from Task 2; fixtures from Tasks 3 and 4; `new InitiativeProcessor(plugin)` with `postProcess(source: string, el: HTMLElement, ctx): Promise<void>` from `@drawSteelAdmonition/initiativeProcessor` (plugin needs `.app` and `.settings`); `new CounterView(plugin, data: Counter, ctx)` with `build(parent: HTMLElement): void` from `@drawSteelAdmonition/Counter/CounterView`; `Counter.parseYaml(source)` from `@model/Counter`.
- Produces: **the harness template for F1 element tests.** This depends on F1 only in spirit: F1's conformance suite (F1 spec §"testable by construction" / F3 §4.4) will parameterize exactly this shape — parse fixture → render into an extended `div` → assert DOM → simulate click → assert exactly one persisted write. When F1 lands, new elements copy this file's structure with their own fixtures; the `test/mocks/obsidian.ts` built here carries forward unchanged.

- [ ] **Step 1: Write the initiative render test**

Create `test/dom/elements/initiative-render.test.ts`:

```typescript
/**
 * T-10a: DOM render smoke for the biggest element (initiative tracker).
 *
 * ── F1 NOTE ─────────────────────────────────────────────────────────────
 * This file is the HARNESS TEMPLATE for F1 element tests (F3 §4.4): parse a
 * golden fixture → render into an extended jsdom div → assert structure →
 * simulate one interaction → assert exactly one vault write. F1's per-element
 * conformance suite parameterizes this shape; the obsidian mock carries
 * forward unchanged.
 * ────────────────────────────────────────────────────────────────────────
 */
import { InitiativeProcessor } from '@drawSteelAdmonition/initiativeProcessor';
import { DEFAULT_SETTINGS } from '@model/Settings';
import { App, Plugin, makeFakeContext, flushAsync } from '../../mocks/obsidian';
import quickStart from '../../fixtures/initiative/quick-start.yaml';

async function renderTracker(source: string = quickStart) {
	const app = new App();
	// Seed the default token image so Images.resolveImageSourceOrDefault's
	// fallback resolves (avoids CB-14 unhandled rejections during render).
	app.vault.setFile('Media/token_1.png', '');
	const note = '# Encounter\n\n```ds-initiative\n' + source.trimEnd() + '\n```\n';
	app.vault.setFile('Encounter.md', note);
	const plugin = new Plugin(app) as any;
	plugin.settings = { ...DEFAULT_SETTINGS };
	const ctx = makeFakeContext(app, 'Encounter.md');
	const el = document.createElement('div');
	const processor = new InitiativeProcessor(plugin);
	await processor.postProcess(source, el, ctx as any);
	return { app, ctx, el };
}

describe('T-10a: InitiativeProcessor render smoke', () => {
	test('renders a hero row per hero and a group container per enemy group', async () => {
		const { el } = await renderTracker();
		expect(el.querySelector('.ds-init-container')).not.toBeNull();
		expect(el.querySelectorAll('.hero-container')).toHaveLength(2);
		const names = [...el.querySelectorAll('.character-name')].map((n) => n.textContent);
		expect(names).toEqual(['Frodo Baggins', 'Samwise Gamgee']);
		expect(el.querySelectorAll('.enemy-group-container')).toHaveLength(1);
		expect(el.querySelector('.group-header h4')!.textContent).toBe('Mordor Forces');
	});

	test('renders the malice counter with the fixture value', async () => {
		const { el } = await renderTracker();
		expect(el.querySelector('.malice-text')!.textContent).toBe('Malice: 5');
	});

	test('clicking a hero turn indicator toggles state and fires exactly one vault write', async () => {
		const { app, el } = await renderTracker();
		expect(app.vault.modifyCalls).toHaveLength(0);
		const indicator = el.querySelector('.heroes-container .turn-indicator') as HTMLElement;
		indicator.click();
		await flushAsync();
		expect(app.vault.modifyCalls).toHaveLength(1);
		expect(app.vault.getContent('Encounter.md')).toContain('has_taken_turn: true');
	});

	test('a parse error renders the friendly error message instead of throwing', async () => {
		const { el } = await renderTracker('heroes: 5');
		const error = el.querySelector('.error-message');
		expect(error).not.toBeNull();
		expect(error!.textContent).toContain('failed to process the input config');
		expect(error!.textContent).toContain("'heroes' field is missing or is not a list");
	});
});
```

- [ ] **Step 2: Write the counter view test**

Create `test/dom/elements/counter-view.test.ts`:

```typescript
// T-10b: CounterView — the smallest interactive element, same template shape
// as initiative-render.test.ts (see the F1 NOTE there).
import { CounterView } from '@drawSteelAdmonition/Counter/CounterView';
import { Counter } from '@model/Counter';
import { App, Plugin, makeFakeContext, flushAsync } from '../../mocks/obsidian';
import counterYaml from '../../fixtures/counter/health.yaml';

function renderCounter(yaml: string = counterYaml) {
	const app = new App();
	app.vault.setFile('Note.md', '```ds-counter\n' + yaml.trimEnd() + '\n```\n');
	const ctx = makeFakeContext(app, 'Note.md');
	const plugin = new Plugin(app) as any;
	const data = Counter.parseYaml(yaml);
	const view = new CounterView(plugin, data, ctx as any);
	const parent = document.createElement('div');
	view.build(parent);
	return { app, data, parent };
}

const value = (parent: HTMLElement) => parent.querySelector('.ds-counter-value')!.textContent;
const buttons = (parent: HTMLElement) => parent.querySelectorAll<HTMLButtonElement>('.ds-counter-button');

describe('T-10b: CounterView render and interaction', () => {
	test('renders name and current value from the fixture', () => {
		const { parent } = renderCounter();
		expect(value(parent)).toBe('10');
		expect(parent.querySelector('.ds-counter-name')!.textContent).toBe('Health');
	});

	test('increment updates the display, the model, and writes the block once', async () => {
		const { app, data, parent } = renderCounter();
		buttons(parent)[0].click(); // [0]=increment (chevron-up), [1]=decrement
		await flushAsync();
		expect(data.current_value).toBe(11);
		expect(value(parent)).toBe('11');
		expect(app.vault.modifyCalls).toHaveLength(1);
		expect(app.vault.getContent('Note.md')).toContain('current_value: 11');
	});

	test('decrement respects min_value: at 0 the button is disabled and value holds', async () => {
		const { data, parent } = renderCounter('name: Health\ncurrent_value: 0\nmin_value: 0');
		expect(buttons(parent)[1].hasAttribute('disabled')).toBe(true);
		buttons(parent)[1].click();
		await flushAsync();
		expect(data.current_value).toBe(0);
		expect(value(parent)).toBe('0');
	});

	test('increment respects max_value: at max the button is disabled and value holds', async () => {
		const { data, parent } = renderCounter('name: Health\ncurrent_value: 20\nmax_value: 20');
		expect(buttons(parent)[0].hasAttribute('disabled')).toBe(true);
		buttons(parent)[0].click();
		await flushAsync();
		expect(data.current_value).toBe(20);
		expect(value(parent)).toBe('20');
	});
});
```

- [ ] **Step 3: Run to confirm PASS**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx jest test/dom/elements'
```

Expected: PASS — `Test Suites: 2 passed` / `Tests: 8 passed, 8 total`. (If the initiative suite logs unhandled-rejection warnings about image resolution, the `Media/token_1.png` seeding in `renderTracker` is missing — that seed is the CB-14 guard.)

- [ ] **Step 4: Commit**

```bash
cd "$WT/draw-steel-elements" && git add test/dom/elements/initiative-render.test.ts test/dom/elements/counter-view.test.ts && git commit -m "test: T-10 DOM render smoke for initiative tracker and counter (F1 template)"
```

---

### Task 12: Plugin CI workflow + full-suite verification + doc sync

**Files:**
- Create: `draw-steel-elements/.github/workflows/plugin-ci.yml`
- Modify: `draw-steel-elements/CLAUDE.md` (one stale line)

**Interfaces:**
- Consumes: the complete suite from Tasks 1–11; existing scripts `npm run tsc` (vue-tsc, expected to fail — informational) and `npm run build-no-check` (esbuild bundle).
- Produces: CI per F3 §4.6. The tag-triggered `release.yml` with artifact attestation (BT-4/SC-8) is **deliberately out of scope** here — it belongs to the F3 quick-win/release-engineering wave, not the harness. The existing mkdocs workflow (`.github/workflows/ci.yml`) is left untouched.

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/plugin-ci.yml`:

```yaml
name: Plugin CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          # engines requires >=22.15; 24 also gives jest native TS-config loading.
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      # Informational until TS-1 (failing type-check) is fixed; flip to a hard
      # gate by deleting continue-on-error once `npm run tsc` is green (F3 OD-6).
      - name: Type check (informational)
        run: npm run tsc
        continue-on-error: true

      # NOTE: no lint step yet — eslint is not installable in this repo (F3 BT-3).
      # Add `npm run lint` here when BT-3 lands.

      - name: Test
        run: npm test -- --ci

      - name: Bundle must build
        run: npm run build-no-check
```

- [ ] **Step 2: Validate the workflow YAML parses**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npx js-yaml .github/workflows/plugin-ci.yml > /dev/null && echo YAML-OK'
```

Expected: `YAML-OK`.

- [ ] **Step 3: Fix the stale CLAUDE.md line**

In `draw-steel-elements/CLAUDE.md`, Quick Start section, replace:

```markdown
- `npm test` -- run tests (Jest, currently no test files)
```

with:

```markdown
- `npm test` -- run tests (Jest: `unit` node project + `dom` jsdom project; `npx jest --selectProjects unit|dom` to run one)
```

- [ ] **Step 4: Run the FULL suite in CI mode and verify the final tally**

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npm test -- --ci'
```

Expected: PASS —

```
Test Suites: 14 passed, 14 total
Tests:       106 passed, 106 total
Snapshots:   3 passed, 3 total
```

(14 suites = 2 smoke + 2 mock + encounter-data + code-blocks + minion-modal + stamina-edit + stamina-bar + negotiation + reference-resolver + sdk-boundary + initiative-render + counter-view. The 106 total includes the **5 `test.failing` bug encodings** — CB-1, CB-2, CB-3, CB-5, DC-6 — which count as passed while the bugs exist. If jest's tally differs slightly from 106, recount against the per-task expectations above; every suite must show 0 failures, 0 skipped.)

Also confirm the build still works (CI's last step, run locally once):

```bash
cd "$WT" && devbox run -- bash -c 'cd draw-steel-elements && npm run build-no-check && ls -la main.js'
```

Expected: esbuild completes; `main.js` exists. Do NOT commit `main.js`/`main.css`/`styles.css` build artifacts.

- [ ] **Step 5: Commit**

```bash
cd "$WT/draw-steel-elements" && git add .github/workflows/plugin-ci.yml CLAUDE.md && git commit -m "ci: add plugin CI (install, informational tsc, jest, bundle build)"
```

- [ ] **Step 6: Hand off**

Report to the orchestrating session: branch `dse-test-harness` in the worktree has 9 commits in `draw-steel-elements`; landing via `just wt-finish dse-test-harness` (which pushes the submodule and bumps the superproject pointer) is its decision. Known follow-ups already tracked in the F3 backlog, not this plan: the 5 `test.failing` encodings flip green with the M-A hotfix wave (CB-1/CB-2/CB-3) and OD-2 (CB-5); `.repo-docs/development.md`/`ci-cd.md` staleness is DS-3.

---

## De-scoped (per F3 §4.5 — do not add)

- **Vue component tests** — D1 deletes the components; `.vue` maps to a stub.
- **Visual/CSS regression** — D2/D3 concern.
- **Live-Preview behavior** — M2-deferred.
- **`release.yml` + artifact attestation** — BT-4/SC-8, release-engineering wave.

## Self-review record (spec §4 coverage)

- §4.1 blockers: types-only `obsidian` → Task 2 mock; `HTMLElement.prototype` extensions + global `createEl` → `dom-setup.ts`; `Array.prototype.contains` → `polyfills.ts` (both projects); path aliases → `moduleNameMapper`; `.yaml` raw text → `rawTextTransformer.js`; `.vue` → `vueStub.ts`. ✓
- §4.2 structure: `jest.config.ts` two projects ✓; mock surface (`parseYaml`/`stringifyYaml` via js-yaml, minimal classes, `setIcon`/`setTooltip` recorders, `MarkdownRenderer` text-append, `request`/`requestUrl` jest.fn, in-memory vault fake incl. `process`, ctx fake with `getSectionInfo`) ✓; fixtures seeded from docs ✓; "what NOT to mock" honored (models/ConditionManager/ArgumentPowerRolls tested directly) ✓.
- §4.3: T-1→Task 3, T-2→Task 3, T-3→Task 4 (CB-5+CB-3 `.failing`), T-4→Task 5 (CB-1+CB-2 `.failing`, DC-6 scenario), T-5→Task 6, T-6→Task 7 (CB-15 pinned), T-7→Task 8, T-8→Task 9, T-9→Task 10, T-10→Task 11 (marked as F1 template per §4.4). ✓
- §4.6 CI → Task 12 (setup-node, install, tsc `continue-on-error`, `npm test -- --ci`, `build-no-check`; lint deferred to BT-3; release.yml explicitly descoped; mkdocs workflow untouched). ✓
- OD-8: only `js-yaml` (+types) and `jest-environment-jsdom` added, dev-only. ✓
