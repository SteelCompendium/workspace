# F4 Visual Harness Implementation Plan (Plan 11)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Playwright harness that renders each DSE element through the real `ElementPipeline` in Chromium and writes deterministic PNGs per element × theme × background, so agents can *see* the plugin's output.

**Architecture:** A second tiny esbuild target bundles `visual-harness/entry.ts` (which reuses `main.ts`'s `registerFrameworkElementDefinitions` + the real framework seams, exactly like the `test/dom/elements/*.test.ts` mount convention) with the bare `obsidian` specifier aliased to a browser-grade shim built on a jest-free extraction of the existing test mock. A static `index.html` (works from `file://`, fixtures inlined as text by esbuild) is driven by `shoot.mjs` (Playwright) which sweeps the matrix and fails loudly on any `.dse-error-card`.

**Tech Stack:** TypeScript, esbuild 0.25.9 (already in repo), Playwright + `lucide` + `marked` (new devDependencies), jest 30 (existing suite guards the mock refactor).

**Spec:** `docs/superpowers/dse-overhaul/F4-visual-harness-spec.md` (workspace repo). Linear: SC-9.

## Global Constraints

- **Repo/branch:** ALL code changes go in the existing worktree
  `/home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements` on branch
  **`dse-framework`** (isolation already exists — do NOT create a new worktree, do NOT touch
  the main checkout at `workspace/draw-steel-elements`).
- **Node invocation:** node/npm/npx are NOT on PATH. Every command below that runs
  node/npm/npx/jest/tsc must be wrapped:
  `devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements && <cmd>"`
  run from the workspace root `/home/scott/code/steelCompendium/workspace`. (Bare
  `devbox run -- <cmd>` fails; the submodule's own devbox has no usable node.)
- **Gates after EVERY task:** `npx tsc --noEmit` → 0 errors; `npx jest` → all suites green
  (976 tests before this plan; counts only go up). Do not commit red.
- **Commit hygiene:** NO Co-Authored-By / "Generated with" / any AI-attribution trailers.
  After each task's commit: `git push origin dse-framework`.
- **Dev-only:** new dependencies are devDependencies; `manifest.json`, `versions.json`, the
  plugin bundle (`main.js`/`styles.css` build), and `esbuild.config.mjs` are untouched.
- **Generated outputs:** `visual-harness/dist/` and `visual-harness/shots/` are git-ignored
  (Task 3) — never commit them.

---

### Task 1: Extract the jest-free `obsidian-core` from the test mock

The browser shim (Task 2) must reuse the 511-line obsidian mock, but
`test/mocks/obsidian.ts` calls `jest.fn()` at module top level. Split it so the core is
importable outside jest. **The existing 976-test suite is this task's test** — no new tests.

**Files:**
- Create: `test/mocks/obsidian-core.ts`
- Modify: `test/mocks/obsidian.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `test/mocks/obsidian-core.ts` exporting **everything `test/mocks/obsidian.ts`
  exports today EXCEPT `request` and `requestUrl`** (classes `TAbstractFile`, `TFile`,
  `TFolder`, `FakeVault`, `FakeMetadataCache`, `App`, `Component`, `MarkdownRenderChild`,
  `Events`, `Plugin`, `Modal`, `Notice`, `MenuItem`, `Menu`, `Setting`, `PluginSettingTab`,
  `ItemView`, `MarkdownRenderer`; functions `parseYaml`, `stringifyYaml`, `setIcon`,
  `setTooltip`, `makeFakeContext`, `flushAsync`; interfaces/types
  `MarkdownSectionInformation`, `MarkdownPostProcessorContext`, `FakeContext`).
  `test/mocks/obsidian.ts` keeps its exact current export surface (Tasks 2–4 rely on both).

- [ ] **Step 1: Confirm the jest surface is only `request`/`requestUrl`**

Run: `grep -n 'jest' test/mocks/obsidian.ts`
Expected: hits only on the `export const request = jest.fn(…)` / `export const requestUrl = jest.fn(…)` lines (~428–436). If anything else references `jest`, it stays in `obsidian.ts` too — everything jest-free moves.

- [ ] **Step 2: Create `test/mocks/obsidian-core.ts`**

Move the ENTIRE contents of `test/mocks/obsidian.ts` into `test/mocks/obsidian-core.ts`
**verbatim**, then delete the two `jest.fn` exports (`request`, `requestUrl`) from the new
file. Add this header comment:

```ts
// test/mocks/obsidian-core.ts — the jest-FREE core of the obsidian mock. Everything the
// runtime mock provides except the jest.fn-wrapped network functions, so it is importable
// outside jest (the F4 visual harness's browser shim re-exports it).
// test/mocks/obsidian.ts re-exports this and adds the jest wrappers — tests are unchanged.
```

- [ ] **Step 3: Rewrite `test/mocks/obsidian.ts` as re-export + jest wrappers**

Replace the whole file with:

```ts
// test/mocks/obsidian.ts — jest-facing obsidian mock (moduleNameMapper ^obsidian$ points
// here). Re-exports the jest-free core (also consumed by visual-harness/shim/obsidian.ts)
// and adds the jest.fn-wrapped network functions. Split for F4 (Plan 11 Task 1).
export * from './obsidian-core';

export const request = jest.fn(async (_params: any): Promise<string> => '');
export const requestUrl = jest.fn(async (_params: any): Promise<any> => ({
	status: 200,
	text: '',
	json: {},
	arrayBuffer: new ArrayBuffer(0),
}));
```

(Local exports win over `export *`, and the core doesn't export these two names anyway.)

- [ ] **Step 4: Run the gates**

Run: `npx tsc --noEmit` → 0 errors.
Run: `npx jest` → `Test Suites: 60 passed`, `Tests: 976 passed` (identical to before).

- [ ] **Step 5: Commit + push**

```bash
git add test/mocks/obsidian-core.ts test/mocks/obsidian.ts
git commit -m "refactor(test): extract jest-free obsidian-core from the obsidian mock"
git push origin dse-framework
```

---

### Task 2: Browser-grade obsidian shim + new devDependencies

**Files:**
- Modify: `package.json` / `package-lock.json` (deps only)
- Create: `visual-harness/shim/obsidian.ts`

**Interfaces:**
- Consumes: `test/mocks/obsidian-core.ts` (Task 1).
- Produces: `visual-harness/shim/obsidian.ts` — same module surface as the test mock
  (star re-export of the core + `setIcon`, `MarkdownRenderer`, `Notice`, `request`,
  `requestUrl` shadows). Task 3's esbuild config aliases the bare `obsidian` specifier to
  this file. **Only esbuild ever loads this file with the alias; under jest, `obsidian`
  still maps to `test/mocks/obsidian.ts`.**

- [ ] **Step 1: Install the dev dependencies**

Run: `npm install --save-dev lucide marked playwright`
Expected: exit 0; `package.json` devDependencies gain the three entries.

- [ ] **Step 2: Write the shim**

```ts
// visual-harness/shim/obsidian.ts — the F4 harness's browser-grade `obsidian` module.
// esbuild (visual-harness/esbuild.mjs) aliases the bare `obsidian` specifier here for the
// harness bundle ONLY. Re-exports the jest-free mock core and shadows the visual-fidelity
// pieces: real Lucide SVG icons, real markdown rendering (marked), a visible Notice toast,
// and jest-free network stubs. Under jest, `obsidian` maps to test/mocks/obsidian.ts —
// this file is only typechecked there, never executed.
export * from '../../test/mocks/obsidian-core';
import type { Component } from '../../test/mocks/obsidian-core';
import { icons, createElement as lucideCreateElement } from 'lucide';
import { marked } from 'marked';

function pascal(iconId: string): string {
	return iconId
		.split('-')
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join('');
}

/** Real Lucide SVGs (Obsidian's icon set). Falls back to the core's data-icon stamp. */
export function setIcon(el: HTMLElement, iconId: string): void {
	const node = (icons as Record<string, unknown>)[pascal(iconId)];
	while (el.firstChild) el.removeChild(el.firstChild);
	if (node) {
		const svg = lucideCreateElement(node as never);
		svg.setAttribute('width', '16');
		svg.setAttribute('height', '16');
		el.appendChild(svg);
	}
	el.setAttribute('data-icon', iconId); // parity with the test mock, useful for debugging
}

export class MarkdownRenderer {
	static async render(
		_app: unknown,
		markdown: string,
		el: HTMLElement,
		_sourcePath: string,
		_component: Component,
	): Promise<void> {
		const html = await marked.parse(markdown);
		const tpl = el.ownerDocument.createElement('template');
		tpl.innerHTML = html;
		el.append(tpl.content);
	}
}

export class Notice {
	noticeEl: HTMLElement;
	constructor(message: string | DocumentFragment, _timeout?: number) {
		this.noticeEl = document.createElement('div');
		this.noticeEl.className = 'dse-harness-notice';
		if (typeof message === 'string') this.noticeEl.textContent = message;
		else this.noticeEl.append(message);
		document.body.appendChild(this.noticeEl);
	}
	hide(): void {
		this.noticeEl.remove();
	}
}

export const request = async (_params: unknown): Promise<string> => '';
export const requestUrl = async (
	_params: unknown,
): Promise<{ status: number; text: string; json: unknown; arrayBuffer: ArrayBuffer }> => ({
	status: 200,
	text: '',
	json: {},
	arrayBuffer: new ArrayBuffer(0),
});
```

Note: if `lucide`'s export shape differs at install time (e.g. no `createElement` export),
adapt to the installed major's documented vanilla API — the requirement is "real inline SVG
per kebab-case icon id, fallback to the `data-icon` stamp". Icon ids used by the code today:
alert-circle, chevron-right, cog, help-circle, message-circle, messages-square, minus,
more-vertical, plus, plus-circle, refresh-cw, rotate-ccw, skull, sword, syringe, undo.

- [ ] **Step 3: Run the gates**

Run: `npx tsc --noEmit` → 0 errors (the shim is typechecked via tsconfig's `**/*.ts`).
Run: `npx jest` → 976 passed (nothing imports the shim yet).

- [ ] **Step 4: Commit + push**

```bash
git add package.json package-lock.json visual-harness/shim/obsidian.ts
git commit -m "feat(harness): browser-grade obsidian shim (lucide icons, marked markdown)"
git push origin dse-framework
```

---

### Task 3: Harness page — entry, vars.css, index.html, esbuild target, first fixture

**Files:**
- Create: `visual-harness/entry.ts`, `visual-harness/md.d.ts`, `visual-harness/vars.css`,
  `visual-harness/index.html`, `visual-harness/esbuild.mjs`,
  `visual-harness/fixtures/feature/default.md`
- Modify: `jest.config.ts` (add `.md` transform), `package.json` (scripts), `.gitignore`
- Test: `test/dom/visual-harness/fixtures.test.ts`

**Interfaces:**
- Consumes: Task 2's shim; `registerFrameworkElementDefinitions(registry: ElementRegistry)`
  from `main.ts`; the framework factories exactly as `test/dom/elements/*.test.ts` use them.
- Produces (Tasks 4–5 rely on these exact names):
  - `FIXTURES: Record<string, Record<string, string>>` (elementId → fixtureName → source)
  - `parseParams(search: string): HarnessParams`
  - `interface HarnessParams { element?: string; fixture: string; theme: DseThemeId; bg: 'dark'|'light'; print: boolean; readonly: boolean; gallery: boolean }`
  - `makeHarnessDeps(): { deps: ElementPipelineDeps; theme: ThemeServiceInternal }`
  - `makeHarnessHost(containerEl: HTMLElement, opts: { readonly: boolean; language: string }): BlockHost`
  - `mountFromParams(doc: Document, params: HarnessParams): Promise<{ errors: string[] }>`
  - Browser globals: `window.__dseHarnessManifest = { elements: [{ id, fixtures: string[] }] }`
    (set on load), `window.__dseHarnessDone = { errors: string[] }` (set after mount settles).
  - npm scripts `harness:build`; URL params contract `?element=&fixture=&theme=&bg=&print=1&readonly=1&gallery=1`.

- [ ] **Step 1: Write the failing fixtures test**

```ts
// test/dom/visual-harness/fixtures.test.ts — F4 (Plan 11): every harness fixture mounts
// through the REAL pipeline with NO error card. This is the fixtures' validity gate (the
// Playwright camera is the visual gate; this one runs in CI with the suite). Importing the
// entry under jest is safe: `obsidian` maps to the test mock, `.md` imports go through
// rawTextTransformer, and the browser boot is guarded on a #mount element jsdom lacks.
import { ElementPipeline } from '../../../src/framework/pipeline';
import { createElementRegistry } from '../../../src/framework/registry';
import { registerFrameworkElementDefinitions } from 'main';
import { FIXTURES, makeHarnessDeps, makeHarnessHost } from '../../../visual-harness/entry';

const registry = createElementRegistry();
registerFrameworkElementDefinitions(registry);

describe('F4 visual-harness fixtures', () => {
	test('every FIXTURES key is a registered element id', () => {
		for (const id of Object.keys(FIXTURES)) {
			expect(registry.get(id)).toBeDefined();
		}
	});

	// Task 4 replaces this with the full 11-element equality assertion.
	test('FIXTURES covers feature (Task 3 scaffold)', () => {
		expect(Object.keys(FIXTURES)).toContain('feature');
	});

	for (const [id, fixtures] of Object.entries(FIXTURES)) {
		for (const [name, source] of Object.entries(fixtures)) {
			test(`${id}/${name} mounts with no error card`, async () => {
				const def = registry.get(id)!;
				const { deps } = makeHarnessDeps();
				const pipeline = new ElementPipeline(deps);
				const container = document.createElement('div');
				document.body.appendChild(container);
				const host = makeHarnessHost(container, { readonly: false, language: def.aliases[0] });
				await pipeline.run(def, source, host);
				expect(container.querySelector('.dse-error-card')).toBeNull();
				expect(container.firstElementChild).not.toBeNull();
				container.remove();
			});
		}
	}
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest test/dom/visual-harness/fixtures.test.ts`
Expected: FAIL — cannot resolve `../../../visual-harness/entry`.

- [ ] **Step 3: Add the `.md` transform to jest**

In `jest.config.ts`, in the `transform` map, directly below the existing
`'^.+\\.ya?ml$': '<rootDir>/test/mocks/rawTextTransformer.js',` line, add:

```ts
	// F4 (Plan 11): harness fixtures are .md-as-raw-text, same treatment as .yaml.
	'^.+\\.md$': '<rootDir>/test/mocks/rawTextTransformer.js',
```

- [ ] **Step 4: Create `visual-harness/md.d.ts`**

```ts
// F4 (Plan 11): fixture imports — esbuild loads .md as text; jest via rawTextTransformer.
declare module '*.md' {
	const text: string;
	export default text;
}
```

- [ ] **Step 5: Create the first fixture**

`visual-harness/fixtures/feature/default.md`: copy the **body of the `FULL` template
literal** from `test/dom/elements/feature.test.ts` (the `const FULL = \`type: feature …\``
declaration around line 68) — exact contents, no code fence, trailing newline preserved.

- [ ] **Step 6: Write `visual-harness/entry.ts`**

```ts
// visual-harness/entry.ts — F4 harness page logic (Plan 11). Mounts DSE elements through
// the REAL ElementPipeline, mirroring the test/dom/elements/*.test.ts makeDeps/makeHost
// convention, driven by URL params. Bundled by visual-harness/esbuild.mjs with `obsidian`
// aliased to ./shim/obsidian.ts; under jest `obsidian` maps to the test mock instead, so
// test/dom/visual-harness/fixtures.test.ts imports this module directly (the browser boot
// below is inert there — jsdom has no #mount).
import '../test/setup/polyfills';
import '../test/setup/dom-setup';

import { ElementPipeline } from '../src/framework/pipeline';
import type { ElementPipelineDeps } from '../src/framework/pipeline';
import type { BlockHost, RenderMode } from '../src/framework/host/BlockHost';
import { createElementRegistry } from '../src/framework/registry';
import type { ElementRegistry } from '../src/framework/registry';
import { createThemeService } from '../src/framework/seams/theme';
import type { ThemeServiceInternal, DseThemeId } from '../src/framework/seams/theme';
import { createPreferenceStore } from '../src/framework/seams/prefs';
import type { PrefsStorage } from '../src/framework/seams/prefs';
import { createReferenceService } from '../src/framework/seams/refs';
import { createValidationService } from '../src/framework/validation';
import { createSessionStore } from '../src/framework/session';
import { DEFAULT_SETTINGS } from '../src/model/Settings';
import { registerFrameworkElementDefinitions } from '../main';
import { App, Plugin } from '../test/mocks/obsidian-core';

// Fixtures — esbuild `.md` text loader / jest rawTextTransformer. Task 4 adds the rest.
import featureDefault from './fixtures/feature/default.md';

export const FIXTURES: Record<string, Record<string, string>> = {
	feature: { default: featureDefault },
};

export interface HarnessParams {
	element?: string;
	fixture: string;
	theme: DseThemeId;
	bg: 'dark' | 'light';
	print: boolean;
	readonly: boolean;
	gallery: boolean;
}

export function parseParams(search: string): HarnessParams {
	const q = new URLSearchParams(search);
	return {
		element: q.get('element') ?? undefined,
		fixture: q.get('fixture') ?? 'default',
		theme: (q.get('theme') === 'steel' ? 'steel' : 'legacy') as DseThemeId,
		bg: q.get('bg') === 'light' ? 'light' : 'dark',
		print: q.get('print') === '1',
		readonly: q.get('readonly') === '1',
		gallery: q.get('gallery') === '1',
	};
}

/** Real service instances — the same convention as the dom tests' makeDeps(). */
export function makeHarnessDeps(): { deps: ElementPipelineDeps; theme: ThemeServiceInternal } {
	const app = new App();
	const plugin = new Plugin(app);
	const storage: PrefsStorage = { get: async () => undefined, set: async () => {} };
	const prefs = createPreferenceStore(storage);
	const theme = createThemeService(prefs, plugin as any);
	const refs = createReferenceService(app as any, DEFAULT_SETTINGS);
	const validation = createValidationService();
	const session = createSessionStore();
	return {
		deps: {
			app: app as any,
			plugin: plugin as any,
			settings: DEFAULT_SETTINGS,
			theme,
			prefs,
			refs,
			validation,
			session,
		},
		theme,
	};
}

export function makeHarnessHost(
	containerEl: HTMLElement,
	opts: { readonly: boolean; language: string },
): BlockHost {
	return {
		mode: 'reading' as RenderMode,
		// sourcePath '' mirrors the canvas quarantine → the read-only affordance shows.
		sourcePath: opts.readonly ? '' : 'Harness.md',
		containerEl,
		canPersist: !opts.readonly,
		addChild: (child: unknown) => child,
		getBlockInfo: () => ({ language: opts.language, lineStart: 0, lineEnd: 0 }),
		replaceSource: async () => true,
		blockKey: () => `Harness.md::${opts.language}::0`,
	} as BlockHost;
}

async function mountOne(
	pipeline: ElementPipeline,
	registry: ElementRegistry,
	mount: HTMLElement,
	id: string,
	fixtureName: string,
	params: HarnessParams,
	errors: string[],
): Promise<void> {
	const def = registry.get(id);
	// Elements with a single fixture fall back to it in gallery sweeps.
	const fixtures = FIXTURES[id] ?? {};
	const source = fixtures[fixtureName] ?? fixtures['default'];
	if (!def || source === undefined) {
		errors.push(`unknown element/fixture: ${id}/${fixtureName}`);
		return;
	}
	const section = mount.createDiv({ cls: 'dse-harness-section' });
	if (params.gallery) section.createEl('h2', { text: `${id} (${def.aliases[0]})` });
	const container = section.createDiv();
	const host = makeHarnessHost(container, { readonly: params.readonly, language: def.aliases[0] });
	try {
		await pipeline.run(def, source, host);
	} catch (e) {
		errors.push(`${id}/${fixtureName}: ${String(e)}`);
	}
	if (params.print) {
		for (const el of Array.from(container.querySelectorAll<HTMLElement>('[data-dse-element]'))) {
			el.setAttribute('data-dse-print', 'on');
		}
	}
}

export async function mountFromParams(
	doc: Document,
	params: HarnessParams,
): Promise<{ errors: string[] }> {
	doc.body.classList.remove('theme-dark', 'theme-light');
	doc.body.classList.add(params.bg === 'light' ? 'theme-light' : 'theme-dark');
	const registry = createElementRegistry();
	registerFrameworkElementDefinitions(registry);
	const { deps, theme } = makeHarnessDeps();
	theme.setActive(params.theme);
	const pipeline = new ElementPipeline(deps);
	const mount = doc.getElementById('mount');
	const errors: string[] = [];
	if (!mount) return { errors: ['no #mount element'] };
	mount.empty();
	const ids = params.gallery ? Object.keys(FIXTURES) : [params.element ?? 'feature'];
	for (const id of ids) {
		await mountOne(pipeline, registry, mount, id, params.fixture, params, errors);
	}
	// Error cards the pipeline rendered (parse/schema/render failures) count as failures.
	for (const card of Array.from(mount.querySelectorAll('.dse-error-card'))) {
		errors.push(`error card: ${(card.textContent ?? '').slice(0, 160)}`);
	}
	return { errors };
}

declare global {
	interface Window {
		__dseHarnessManifest?: { elements: { id: string; fixtures: string[] }[] };
		__dseHarnessDone?: { errors: string[] };
	}
}

// Browser boot — inert under jest (jsdom's default document has no #mount).
if (typeof window !== 'undefined') {
	window.__dseHarnessManifest = {
		elements: Object.keys(FIXTURES).map((id) => ({ id, fixtures: Object.keys(FIXTURES[id]) })),
	};
	if (document.getElementById('mount')) {
		void mountFromParams(document, parseParams(window.location.search)).then(async (r) => {
			// Two rAF ticks so late theme re-stamps/layout settle before the camera fires.
			await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
			window.__dseHarnessDone = r;
		});
	}
}
```

Implementation note: if `theme.setActive` turns out to return a `Promise`, `await` it before
constructing the pipeline — the requirement is "active theme is set before any mount".

- [ ] **Step 7: Create `visual-harness/vars.css`**

```css
/* visual-harness/vars.css — vendored Obsidian DEFAULT-theme variables (F4, Plan 11).
   Close-enough fidelity by design (see the F4 spec): hand-vendored from Obsidian 1.x
   defaults, 2026-07-10. Covers ONLY the non---dse- vars styles-source.css references,
   plus page basics and harness chrome. NOT here on purpose: --sc-* (styles-source.css
   chains those with inline hex fallbacks — the v2-palette sync is a snippet concern). */

body {
	/* theme-independent */
	--radius-s: 4px;
	--radius-m: 8px;
	--size-2-1: 2px;
	--size-2-2: 4px;
	--size-2-3: 6px;
	--size-4-1: 4px;
	--size-4-2: 8px;
	--size-4-3: 12px;
	--size-4-4: 16px;
	--font-smallest: 0.8em;
	--font-smaller: 0.875em;
	--font-ui-small: 13px;
	--font-ui-large: 20px;
	--font-semibold: 600;
	--list-indent: 2em;
	--font-text: -apple-system, BlinkMacSystemFont, 'Segoe UI Variable', 'Segoe UI',
		Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
	--font-monospace: ui-monospace, SFMono-Regular, 'Cascadia Mono', 'Roboto Mono', Menlo,
		Monaco, monospace;
	--tag-size: var(--font-smaller);
	--tag-color: var(--interactive-accent);
	--tag-background: rgba(127, 109, 242, 0.1);
	--tag-border-color: transparent;
	--tag-border-width: 0;
	--tag-decoration: none;
	--tag-padding-x: 0.65em;
	--tag-padding-y: 0.25em;
	--tag-radius: 2em;
	--tag-weight: inherit;

	margin: 0;
	padding: 24px;
	font-family: var(--font-text);
	font-size: 16px;
	line-height: 1.5;
	background-color: var(--background-primary);
	color: var(--text-normal);
}

body.theme-dark {
	color-scheme: dark;
	--color-base-25: #2a2a2a;
	--color-base-30: #363636;
	--color-base-50: #666666;
	--color-base-100: #dadada;
	--background-primary: #1e1e1e;
	--background-primary-alt: #242424;
	--background-secondary: #262626;
	--background-modifier-border: #363636;
	--background-modifier-hover: rgba(255, 255, 255, 0.075);
	--code-background: #262626;
	--text-normal: #dadada;
	--text-muted: #b3b3b3;
	--text-faint: #666666;
	--text-error: #fb464c;
	--text-on-accent: #ffffff;
	--icon-color: #b3b3b3;
	--interactive-accent: #7f6df2;
	--color-blue: #086ddd;
	--color-orange: #e9973f;
}

body.theme-light {
	color-scheme: light;
	--color-base-25: #e6e6e6;
	--color-base-30: #dddddd;
	--color-base-50: #ababab;
	--color-base-100: #222222;
	--background-primary: #ffffff;
	--background-primary-alt: #fafafa;
	--background-secondary: #f6f6f6;
	--background-modifier-border: #dddddd;
	--background-modifier-hover: rgba(0, 0, 0, 0.05);
	--code-background: #f5f5f5;
	--text-normal: #222222;
	--text-muted: #5c5c5c;
	--text-faint: #999999;
	--text-error: #e93147;
	--text-on-accent: #ffffff;
	--icon-color: #5c5c5c;
	--interactive-accent: #7f6df2;
	--color-blue: #086ddd;
	--color-orange: #ec7500;
}

/* harness chrome */
#mount {
	max-width: 760px;
}
.dse-harness-section {
	margin: 0 0 32px;
}
.dse-harness-section > h2 {
	margin: 0 0 8px;
	font-size: 14px;
	font-weight: var(--font-semibold);
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--text-muted);
}
.dse-harness-notice {
	position: fixed;
	top: 12px;
	right: 12px;
	padding: 8px 12px;
	background: var(--background-secondary);
	border: 1px solid var(--background-modifier-border);
	border-radius: var(--radius-s);
}
```

- [ ] **Step 8: Create `visual-harness/index.html`**

```html
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>DSE visual harness</title>
<link rel="stylesheet" href="vars.css">
<link rel="stylesheet" href="dist/harness.css">
<style>
/* deterministic shots */
*, *::before, *::after { transition: none !important; animation: none !important; }
</style>
</head>
<body class="theme-dark">
<div id="mount"></div>
<script src="dist/harness.js"></script>
</body>
</html>
```

- [ ] **Step 9: Create `visual-harness/esbuild.mjs`**

```js
// visual-harness/esbuild.mjs — F4 harness build (Plan 11). Separate from the plugin's
// esbuild.config.mjs (which is watch/production oriented and must stay untouched):
// browser platform, bare `obsidian` aliased to the shim, fixtures inlined as text.
// entry.ts's import graph reaches main.ts, whose `import "./styles-source.css"` makes
// esbuild emit dist/harness.css alongside dist/harness.js — the page's plugin styles.
import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

await esbuild.build({
	entryPoints: [path.join(repoRoot, 'visual-harness/entry.ts')],
	bundle: true,
	outfile: path.join(repoRoot, 'visual-harness/dist/harness.js'),
	format: 'iife',
	platform: 'browser',
	target: 'es2018',
	alias: { obsidian: path.join(repoRoot, 'visual-harness/shim/obsidian.ts') },
	loader: { '.yaml': 'text', '.md': 'text' },
	logLevel: 'info',
});
```

(The `'.yaml': 'text'` loader matches the main build's yamlLoaderPlugin semantics — a
default-exported string.)

- [ ] **Step 10: Add the npm script and .gitignore entries**

In `package.json` scripts, after `"build-no-check"`:

```json
		"harness:build": "node visual-harness/esbuild.mjs",
```

Append to `.gitignore`:

```
# F4 visual harness (Plan 11) — build output + screenshots are generated
visual-harness/dist
visual-harness/shots
```

- [ ] **Step 11: Run the fixtures test + build + gates**

Run: `npx jest test/dom/visual-harness/fixtures.test.ts`
Expected: PASS (3 tests: registered-ids, scaffold-coverage, feature/default mounts clean).
Run: `npm run harness:build`
Expected: exit 0; `visual-harness/dist/harness.js` and `visual-harness/dist/harness.css` exist.
Run: `npx tsc --noEmit` → 0. Run: `npx jest` → all green (976 + 3 new).

- [ ] **Step 12: Commit + push**

```bash
git add visual-harness/ test/dom/visual-harness/ jest.config.ts package.json .gitignore
git commit -m "feat(harness): F4 harness page — entry, vendored vars, esbuild target, feature fixture"
git push origin dse-framework
```

---

### Task 4: Fixtures for all 11 elements + gallery coverage

**Files:**
- Create: `visual-harness/fixtures/<element>/default.md` for the other 10 elements
- Modify: `visual-harness/entry.ts` (imports + `FIXTURES`),
  `test/dom/visual-harness/fixtures.test.ts` (full-coverage assertion)

**Interfaces:**
- Consumes: Task 3's `FIXTURES` shape and fixture loading.
- Produces: `FIXTURES` keyed by ALL 11 element ids: `characteristics`, `counter`,
  `feature`, `featureblock`, `horizontal-rule`, `initiative`, `negotiation`, `skills`,
  `stamina-bar`, `statblock`, `values-row` — each with at least `default`. Task 5 sweeps
  `window.__dseHarnessManifest.elements`.

- [ ] **Step 1: Tighten the coverage test (fails first)**

In `test/dom/visual-harness/fixtures.test.ts`, replace the scaffold test with:

```ts
	test('FIXTURES covers every registered element (all 11)', () => {
		const registered = registry
			.all()
			.map((d) => d.id)
			.sort();
		expect(Object.keys(FIXTURES).sort()).toEqual(registered);
	});
```

Run: `npx jest test/dom/visual-harness/fixtures.test.ts` → FAIL (only `feature` present).

- [ ] **Step 2: Harvest the 10 fixture files**

Each file is the **code-fence BODY only** (no ``` fence lines). Realistic content, per the
spec. Primary source first; if the per-fixture mount test then fails (stale docs fields),
fall back to the named test constant and note the doc rot in the task report:

| Fixture file | Primary source | Fallback |
|---|---|---|
| `fixtures/horizontal-rule/default.md` | empty file (the element takes no body) | — |
| `fixtures/characteristics/default.md` | `SAMPLE` in `test/dom/elements/characteristics.test.ts` (~line 34) | — |
| `fixtures/values-row/default.md` | `SAMPLE` in `test/dom/elements/values-row.test.ts` (~line 34) | — |
| `fixtures/featureblock/default.md` | first fenced example in `docs/featureblock.md` | `WITH_STATS` in `test/dom/elements/featureblock.test.ts` (~line 42) |
| `fixtures/statblock/default.md` | first full fenced `ds-sb`/`ds-statblock` example in `docs/statblock.md` | `WITH_META` in `test/dom/elements/statblock.test.ts` (~line 53) |
| `fixtures/counter/default.md` | first fenced example in `docs/counter.md` | the counter source string used in `test/dom/elements/counter.test.ts` |
| `fixtures/stamina-bar/default.md` | first fenced example in `docs/stamina-bar.md` | the stamina source in `test/dom/elements/stamina-bar.test.ts` |
| `fixtures/skills/default.md` | first fenced example in `docs/skills-element.md` | the skills source in `test/dom/elements/skills.test.ts` |
| `fixtures/initiative/default.md` | first full fenced example in `docs/initiative-tracker.md` (a mid-encounter block with heroes + creatures is ideal) | the ds-it note body built in `test/dom/elements/initiative.test.ts` (~line 1071 context) |
| `fixtures/negotiation/default.md` | first fenced example in `docs/negotiation-tracker.md` | `frodoYaml` in `test/dom/elements/negotiation.test.ts` (~line 738 context) |

- [ ] **Step 3: Wire them into `entry.ts`**

Replace the fixtures block in `visual-harness/entry.ts` with:

```ts
// Fixtures — esbuild `.md` text loader / jest rawTextTransformer.
import characteristicsDefault from './fixtures/characteristics/default.md';
import counterDefault from './fixtures/counter/default.md';
import featureDefault from './fixtures/feature/default.md';
import featureblockDefault from './fixtures/featureblock/default.md';
import horizontalRuleDefault from './fixtures/horizontal-rule/default.md';
import initiativeDefault from './fixtures/initiative/default.md';
import negotiationDefault from './fixtures/negotiation/default.md';
import skillsDefault from './fixtures/skills/default.md';
import staminaBarDefault from './fixtures/stamina-bar/default.md';
import statblockDefault from './fixtures/statblock/default.md';
import valuesRowDefault from './fixtures/values-row/default.md';

export const FIXTURES: Record<string, Record<string, string>> = {
	characteristics: { default: characteristicsDefault },
	counter: { default: counterDefault },
	feature: { default: featureDefault },
	featureblock: { default: featureblockDefault },
	'horizontal-rule': { default: horizontalRuleDefault },
	initiative: { default: initiativeDefault },
	negotiation: { default: negotiationDefault },
	skills: { default: skillsDefault },
	'stamina-bar': { default: staminaBarDefault },
	statblock: { default: statblockDefault },
	'values-row': { default: valuesRowDefault },
};
```

- [ ] **Step 4: Run the gates**

Run: `npx jest test/dom/visual-harness/fixtures.test.ts`
Expected: PASS — 13 tests (registered-ids + 11-coverage + 11 per-fixture mounts).
Run: `npm run harness:build` → exit 0.
Run: `npx tsc --noEmit` → 0. Run: `npx jest` → all green.

- [ ] **Step 5: Commit + push**

```bash
git add visual-harness/fixtures/ visual-harness/entry.ts test/dom/visual-harness/fixtures.test.ts
git commit -m "feat(harness): fixtures for all 11 elements + full-coverage gate"
git push origin dse-framework
```

---

### Task 5: The camera — `shoot.mjs`, npm scripts, first full sweep

**Files:**
- Create: `visual-harness/shoot.mjs`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: the built page (`npm run harness:build`), `window.__dseHarnessManifest`,
  `window.__dseHarnessDone`, the URL-params contract (Task 3).
- Produces: `visual-harness/shots/<element>--<theme>-<bg>.png` (element clip),
  `<element>--steel-print.png`, `gallery--<theme>-<bg>.png` (full page); `--ERROR`-suffixed
  files + nonzero exit when a mount fails. npm scripts `shots`, flags
  `--element= --theme= --bg= --fixture= --readonly`.

- [ ] **Step 1: Install the Chromium binary (one-time)**

Run: `npx playwright install chromium`
Expected: download completes. If the later run fails on missing system libraries, run
`npx playwright install --with-deps chromium`; if that needs sudo, STOP and report to the
orchestrator instead of attempting privilege escalation.

- [ ] **Step 2: Write `visual-harness/shoot.mjs`**

```js
#!/usr/bin/env node
// visual-harness/shoot.mjs — the F4 camera (Plan 11). Sweeps element × theme × bg
// (+ steel print) through the built harness page and writes deterministic PNGs to
// visual-harness/shots/. Any mount error (error card, page error, unknown fixture)
// saves the shot with an --ERROR suffix and exits nonzero naming the failure.
// Flags: --element=<id> --theme=<legacy|steel> --bg=<dark|light> --fixture=<name> --readonly
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const pageUrl = 'file://' + path.join(dir, 'index.html');
const shotsDir = path.join(dir, 'shots');
fs.mkdirSync(shotsDir, { recursive: true });

const args = Object.fromEntries(
	process.argv
		.slice(2)
		.filter((a) => a.startsWith('--'))
		.map((a) => {
			const [k, v] = a.replace(/^--/, '').split('=');
			return [k, v ?? '1'];
		}),
);

const COMBOS = [
	{ theme: 'legacy', bg: 'dark' },
	{ theme: 'legacy', bg: 'light' },
	{ theme: 'steel', bg: 'dark' },
	{ theme: 'steel', bg: 'light' },
	{ theme: 'steel', bg: 'dark', print: true },
];
const comboName = (c) => (c.print ? `${c.theme}-print` : `${c.theme}-${c.bg}`);

const failures = [];

async function snap(page, params, outName) {
	const pageErrors = [];
	const onErr = (e) => pageErrors.push(String(e));
	page.on('pageerror', onErr);
	await page.goto(`${pageUrl}?${new URLSearchParams(params)}`);
	await page.waitForFunction(() => window.__dseHarnessDone !== undefined, null, {
		timeout: 15000,
	});
	const done = await page.evaluate(() => window.__dseHarnessDone);
	page.off('pageerror', onErr);
	const errors = [...done.errors, ...pageErrors];
	const file = path.join(shotsDir, `${outName}${errors.length ? '--ERROR' : ''}.png`);
	if (params.gallery) await page.screenshot({ path: file, fullPage: true });
	else await page.locator('#mount').screenshot({ path: file });
	if (errors.length) failures.push({ outName, errors });
	console.log(`${errors.length ? 'FAIL' : '  ok'} ${path.basename(file)}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({
	viewport: { width: 900, height: 1200 },
	deviceScaleFactor: 2,
});
const page = await context.newPage();

// Manifest drives the sweep — single source of truth is the page itself.
await page.goto(pageUrl);
await page.waitForFunction(() => window.__dseHarnessManifest !== undefined);
const manifest = await page.evaluate(() => window.__dseHarnessManifest);

let elements = manifest.elements.map((e) => e.id);
if (args.element) elements = elements.filter((id) => id === args.element);
if (args.element && elements.length === 0) {
	console.error(`unknown --element=${args.element}`);
	process.exit(2);
}
let combos = COMBOS;
if (args.theme) combos = combos.filter((c) => c.theme === args.theme && !c.print);
if (args.bg) combos = combos.filter((c) => c.bg === args.bg);

for (const id of elements) {
	for (const c of combos) {
		const params = { element: id, fixture: args.fixture ?? 'default', theme: c.theme, bg: c.bg };
		if (c.print) params.print = '1';
		if (args.readonly) params.readonly = '1';
		const suffix = args.readonly ? '--readonly' : '';
		await snap(page, params, `${id}--${comboName(c)}${suffix}`);
	}
}
if (!args.element) {
	for (const c of combos.filter((c) => !c.print)) {
		await snap(page, { gallery: '1', theme: c.theme, bg: c.bg }, `gallery--${comboName(c)}`);
	}
}
await browser.close();

if (failures.length) {
	console.error(`\n${failures.length} shot(s) had errors:`);
	for (const f of failures) console.error(`  ${f.outName}: ${f.errors.join(' | ')}`);
	process.exit(1);
}
console.log(`\nall shots written to ${shotsDir}`);
```

- [ ] **Step 3: Add the npm script**

In `package.json` scripts, after `"harness:build"`:

```json
		"shots": "npm run harness:build && node visual-harness/shoot.mjs",
```

- [ ] **Step 4: Run the full sweep**

Run: `npm run shots`
Expected: exit 0; `ls visual-harness/shots | wc -l` → **59** PNGs
(11 elements × 5 combos = 55, + 4 galleries), none `--ERROR`-suffixed.

- [ ] **Step 5: Narrowed re-run sanity**

Run: `npm run shots -- --element=statblock --theme=steel`
Expected: exit 0; exactly `statblock--steel-dark.png` and `statblock--steel-light.png`
rewritten (mtime), no gallery shots produced.

- [ ] **Step 6: Visual verification (orchestrator)**

The orchestrator (not the implementer subagent) Reads at least
`visual-harness/shots/feature--legacy-dark.png`,
`visual-harness/shots/statblock--steel-dark.png`, and
`visual-harness/shots/gallery--steel-dark.png` and confirms they show real rendered
elements (cards, icons, colors — not blank/unstyled dumps).

- [ ] **Step 7: Gates + commit + push**

Run: `npx tsc --noEmit` → 0. Run: `npx jest` → all green.

```bash
git add visual-harness/shoot.mjs package.json
git commit -m "feat(harness): playwright camera — element/theme sweep with error detection"
git push origin dse-framework
```

---

### Task 6: `shoot-url.mjs` bonus + docs

**Files:**
- Create: `visual-harness/shoot-url.mjs`, `visual-harness/README.md`
- Modify: `package.json` (script), `CLAUDE.md` (plugin repo — pointer section)

**Interfaces:**
- Consumes: the Playwright install (Task 5).
- Produces: `npm run shot-url -- <url> <out.png>`; the harness's consumption docs.

- [ ] **Step 1: Write `visual-harness/shoot-url.mjs`**

```js
#!/usr/bin/env node
// visual-harness/shoot-url.mjs — screenshot any URL (e.g. the live v2 site for design
// reference / SC-67). Usage: npm run shot-url -- <url> <out.png>
import { chromium } from 'playwright';

const [url, out] = process.argv.slice(2);
if (!url || !out) {
	console.error('usage: npm run shot-url -- <url> <out.png>');
	process.exit(2);
}
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1440, height: 1000 },
	deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`wrote ${out}`);
```

- [ ] **Step 2: Add the npm script**

In `package.json` scripts, after `"shots"`:

```json
		"shot-url": "node visual-harness/shoot-url.mjs",
```

- [ ] **Step 3: Verify it against the live v2 site**

Run: `npm run shot-url -- https://steelcompendium.io/v2/ visual-harness/shots/v2-home.png`
Expected: exit 0, PNG exists and is non-trivially sized (`ls -la`).

- [ ] **Step 4: Write `visual-harness/README.md`**

```markdown
# F4 visual harness

Renders each DSE element through the real `ElementPipeline` in Chromium and screenshots it,
so agents (and humans) can see the plugin without opening Obsidian. Close-enough fidelity
by design: Obsidian default-theme variables are vendored in `vars.css`; final visual QA is
still real Obsidian. Spec: workspace `docs/superpowers/dse-overhaul/F4-visual-harness-spec.md`.

## Use

    npm run shots                                  # full sweep: 11 elements × legacy/steel ×
                                                   # dark/light + steel-print + 4 galleries
    npm run shots -- --element=statblock --theme=steel   # narrowed
    npm run shots -- --readonly                    # read-only affordance variants
    npm run shot-url -- https://steelcompendium.io/v2/ visual-harness/shots/v2-home.png

(node via the workspace devbox: `devbox run -- bash -c "cd <this repo> && npm run shots"`.)

Output: `visual-harness/shots/<element>--<theme>-<bg>.png`, `<element>--steel-print.png`,
`gallery--<theme>-<bg>.png`. Deterministic names — diff before/after by filename. A failed
mount saves `…--ERROR.png` and exits nonzero: fix before trusting any shot.

One-time setup: `npx playwright install chromium`.

## Pieces

- `entry.ts` — mounts elements per URL params (`?element=&fixture=&theme=&bg=&print=1&readonly=1&gallery=1`)
  through the real pipeline + seams; element list comes from `main.ts`'s
  `registerFrameworkElementDefinitions` (can't drift).
- `shim/obsidian.ts` — browser `obsidian` module: jest-free mock core + real Lucide icons +
  `marked` markdown + toast Notice. Aliased in by `esbuild.mjs` for this bundle only.
- `vars.css` — vendored Obsidian default-theme variables (only what `styles-source.css` uses).
- `fixtures/<element>/default.md` — code-fence bodies; validity-gated by
  `test/dom/visual-harness/fixtures.test.ts`.
- `dist/`, `shots/` — generated, git-ignored.

## v1 limits (spec §"Out of scope")

Static states only — no modals/hover/focus scripting, no CI pixel gates, default Obsidian
theme only.
```

- [ ] **Step 5: Add a pointer in the plugin repo's `CLAUDE.md`**

Add a short section (match the file's existing tone/structure, near other tooling/testing
sections):

```markdown
## Visual harness (see it rendered)

`npm run shots` renders every element through the real pipeline in Chromium and writes
PNGs to `visual-harness/shots/` (`<element>--<theme>-<bg>.png` + galleries) — agents can
Read these to see the plugin. Narrow with `--element=/--theme=`. `npm run shot-url -- <url>
<out.png>` screenshots any URL. Details: `visual-harness/README.md`. Fidelity is
close-enough (vendored default-theme vars) — final QA is real Obsidian.
```

- [ ] **Step 6: Final full verification**

Run: `npx tsc --noEmit` → 0 errors.
Run: `npx jest` → all suites green (989 tests: the 976 pre-plan + the 13 harness-fixture tests).
Run: `npm run shots` → exit 0, 59 clean PNGs.
Run: `git log --format='%b' origin/dse-framework..HEAD | grep -iE 'co-authored|generated with'` → empty.

- [ ] **Step 7: Commit + push**

```bash
git add visual-harness/shoot-url.mjs visual-harness/README.md package.json CLAUDE.md
git commit -m "feat(harness): shot-url helper + harness docs"
git push origin dse-framework
```

---

## Post-plan (orchestrator, workspace repo — not the implementer)

- Update `docs/superpowers/dse-overhaul/README.md` F4 row: Build → `✅ built`.
- Append the SDD-ledger entries per task as usual
  (`worktrees/dse-framework/draw-steel-elements/.superpowers/sdd/progress.md`).
- Comment/close motion on Linear **SC-9** (and note the `shot-url` side-deliverable on
  **SC-67**).
- First real use: run the sweep and eyeball the HANDOFF "VISUAL-QA list" items, then start
  SC-10 (Steel design pass) with before/after shots.
