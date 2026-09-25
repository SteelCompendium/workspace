# SC-340 — View adoption: a block keeps its live view across its own save — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a reading-mode block's own write makes Obsidian re-draw its section, the new section takes over the existing live view (same DOM, same open dialogs, same focus and typed text) instead of building a fresh one; every other rebuild still gets a fresh view, and every teardown path flushes the view's pending write.

**Architecture:** A plugin-scoped `ViewRegistry` (a `Component`) owns every reading-mode `ElementView` from the moment it mounts — never the block's `MarkdownRenderChild` — so a view can outlive its section. `ReadingModeBlockHost.replaceSource` records a claim ticket (the body it is writing) before `Vault.process`; the code-block processor first asks the registry to `claim(ctx.docId, ctx.sourcePath, source)`; on a hit it rebinds the same host object to the new section and moves the view's root into the new `el` synchronously (restoring focus once the section is inserted). The old render child's unload is then a no-op; the CURRENT render child's unload releases the view (flush, then unload). A hidden `viewAdoption` data.json key is the kill switch.

**Tech Stack:** TypeScript (Obsidian plugin API), jest + jsdom with the in-repo obsidian mock, Node ≥ 22 + raw CDP for the real-Obsidian gate (`visual-harness/obsidian-lifecycle.mjs`, created by SC-343).

**Spec:** `/home/scott/code/steelCompendium/worktrees/sc340-view-adoption/docs/superpowers/dse-overhaul/SC-340-view-adoption-spec.md` @ `2428179` (APPROVED). Depends on SC-343 having landed on dse `origin/develop` — its plan (`/home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/docs/superpowers/dse-overhaul/plans/2026-09-23-sc343-stale-write-guard.md`) defines every SC-343 name used here. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-decisions.md`. Spike evidence (reference only, never paste — written against `e4bcd0f`): `…/sc340-view-adoption/sc340-spike-r2-report.md`, `sc340-spike-r2.patch`, `sc340-probe-r2.mjs`.

## Global Constraints

- Worktree: dse = `/home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements` (branch `sc340-view-adoption`, rebased in Task 0 onto dse `origin/develop` containing SC-343); superproject = `/home/scott/code/steelCompendium/worktrees/sc340-view-adoption` (branch `sc340-view-adoption`). Verify `pwd` before every write. NEVER write under `/home/scott/code/steelCompendium/workspace/draw-steel-elements`; workspace-level files (dse-verify skill, F1 spec) are edited in the worktree SUPERPROJECT, never under `/home/scott/code/steelCompendium/workspace/`. The local branch `sc340-spike` is throwaway — never merge or cherry-pick from it.
- Commands: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && <cmd>'`. devbox eats `$?`/`$PIPESTATUS`: gate command LAST, no pipes, read the tool's own summary line. `rm -f main.js styles.css` before EVERY jest run.
- Gates per the dse-verify skill (in the superproject after SC-343: tsc → lint → jest → obsidian-lifecycle → shots → freeze → parity). Expected: 0 frozen bytes moved; parity `0 GAPs / 0 undeclared / 16 DECLARED`; lifecycle all ok.
- Commit messages `feat|fix|test|docs(<area>): SC-340 — …`. **No `Co-Authored-By` or any AI-attribution line.** Never push, merge, or tag; never tag or release draw-steel-elements.
- Real-Obsidian runs: headless Xvfb `:160–:199`, own CDP port, own user-data-dir, scratch vault copy; never display `:1`, never the worktree's `demo-vault/`.
- Spec numbers, verbatim: claim window **3000 ms**; claim key `(ctx.docId, sourcePath, body)` with bodies compared by SC-343's `normalizeBody`; focus-restore backstop **5000 ms**; kill switch = hidden `viewAdoption` key in `data.json`, default ON (`settings.viewAdoption !== false`), not shown in the Settings UI.
- Invariant (spec §6.1): nothing an adopted view depends on may be a child of the old render child. `host.addChild(view)` is used ONLY for non-reading hosts.
- Out of scope: Live Preview; `SidebarBlockHost`; removing `previewScrollPin`; ds-conditions' close-deferral (`conditions/panel.ts`, follow-up SC-344); fixing Obsidian's leaked embed copies.

## Review Focus

- **Two panes (or a pane + an embed) of the same note, write from either**: only the writer's instance keeps its view; the other shows the new data in a fresh view; exactly one file write per click. Pinned in Task 4 (jest, docId) and Task 8 (`G-S4`).
- **A pending write when the note is navigated away, the leaf closed, the mode toggled to Source, or the plugin disabled**: the write lands in the right block of the right note, and the registry ends with no view for a block no longer rendered. Pinned in Task 2 (jest) and Task 8 (`G-S6c`…`G-S6i`).
- **Typing in a focused input inside the block while an earlier click's write lands**: text, focus and caret survive; an editable stepper's half-typed draft is NOT committed by the adoption blur. Pinned in Task 4 (focus) / Task 6 (stepper) / Task 8 (`G-S3`).
- **A write that arrives within 3 s but whose rebuild never comes** (off-screen, hidden in Source mode > 3 s, a leaked embed copy): no view is adopted by the wrong section; the ticket simply expires; nothing leaks. Pinned in Task 4 (ticket expiry, never-loaded view) and Task 5 (collision).
- **The Edit (pencil) form opened after one or more adopted writes**: the form shows the CURRENT block body, and saving it cannot revert newer changes. Pinned in Task 6.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `test/mocks/obsidian-core.ts` | `Component.load/unload` match Obsidian 1.14 exactly (SC-337) | 1 |
| `src/framework/host/viewRegistry.ts` (new) | `ViewRegistry`: own / noteWrite / claim / finishClaim / release; tickets; stats; collision guard | 2, 4, 5 |
| `src/framework/host/ReadingModeBlockHost.ts` | registry param, `attachEntry`, render-child-unload → release, mutable binding, `rebind`, `docId`, ticket in `replaceSource` | 2, 3 |
| `src/framework/host/adoptView.ts` (new) | `adoptView`, `captureFocus`, `restoreFocusWhenConnected` | 4 |
| `src/framework/pipeline.ts` | registry ownership instead of `host.addChild`; form editor gets the current body | 2, 6 |
| `src/framework/registerFrameworkElements.ts` | creates + returns the registry; claim → adopt before `pipeline.run` | 2, 4 |
| `main.ts`, `src/model/Settings.ts` | `viewRegistry` field; `viewAdoption` hidden key read | 2, 7 |
| `src/framework/kit/stepper.ts` | ignore a blur on a disconnected input | 6 |
| `visual-harness/obsidian-lifecycle.mjs` | SC-340 fixtures + scenarios appended | 8 |
| Tests: `test/dom/framework/view-registry.test.ts` (new), `test/dom/framework/view-adoption.test.ts` (new), `test/dom/kit/stepper.test.ts`, `test/dom/elements/initiative.test.ts`, `test/dom/views/minion-stamina-pool-modal.test.ts` | | 2–6 |
| Docs: superproject F1 spec, `.claude/skills/dse-verify/SKILL.md`; dse `.repo-docs/architecture.md`, `.repo-docs/integration.md`, `CHANGELOG.md` | | 8 |

Spec gaps this plan resolves (recorded for the reviewer):
1. Spec §11 lists "registry and ownership" (step 2) before "release" (step 5). Ownership without release would leave every view loaded forever, so **Task 2 ships ownership AND release together** (adoption still off).
2. Spec §6.4 lists "flush" (step 3) before "other registered callbacks, e.g. `activeModal.close()`" (step 4). Obsidian runs registered callbacks **LIFO**: `ElementView` registers its flush first (constructor), so it runs LAST — after the modal closes. That is the better order (a persist scheduled by a modal's `onClose` still lands) and Task 2 pins it.
3. Spec §6.2's collision guard compares "preview containers" recorded at `own()` — but at `own()` time the root is often detached (processor `el` is detached, B6), so the container is unknowable. **Task 5 detects a collision by position instead**: two live entries with the same `docId` + `sourcePath` + `lastKnownLineStart` are the same block rendered twice under one `docId`.

---

### Task 0: Rebase onto develop-with-SC-343 and measure the baseline

**Files:** none modified (branch rebase only).

**Interfaces:**
- Consumes: dse `origin/develop` containing SC-343's commits (`droppedWriteNotice.ts`, `normalizeBody`, `locateByBody`, `setMountedBody`, `notePersistIntent`, `lastKnownBody`, `lastKnownLineStart`, `visual-harness/obsidian-lifecycle.mjs`).
- Produces: the baseline numbers (record them in the task report).

- [ ] **Step 1: Confirm SC-343 is on develop**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && pwd && git status --porcelain && git fetch origin && git log --oneline origin/develop -8 && git show origin/develop:src/framework/host/droppedWriteNotice.ts | head -5
```
Expected: clean tree; `origin/develop` log shows SC-343 commits; the file prints. If `droppedWriteNotice.ts` is missing, STOP (NEEDS_CONTEXT: "SC-343 not landed on origin/develop").

- [ ] **Step 2: Rebase** (the branch has no commits of its own yet; `sc340-spike` is left untouched)

```bash
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && git branch --show-current && git rebase origin/develop && git log --oneline -1 && git status --porcelain
```
Expected: branch `sc340-view-adoption`, HEAD = `origin/develop`, clean.

- [ ] **Step 3: Dependencies** — `node_modules/` exists from the spike; re-sync it to the rebased lockfile:

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm ci'
```

- [ ] **Step 4: Baseline battery (record every summary line)**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run lint'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run obsidian-lifecycle'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js main.css styles.css && npm run shots'
devbox run -- bash -c 'bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements/visual-harness/shots'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run parity'
```
Expected: all green; lifecycle `done: 5/5 ok, 0 failed`. Then `rm -f main.js main.css styles.css` and confirm `git status --porcelain` is empty. No commit.

---

### Task 1: Obsidian-faithful `Component` load/unload in the test mock (closes SC-337)

**Files:**
- Modify: `test/mocks/obsidian-core.ts` (`class Component`, `load()` and `unload()`)
- Modify: whatever existing tests fail because they relied on the wrong order or on unloading a never-loaded component (fix each in this same commit)
- Test: `test/dom/mocks/obsidian-core.selftest.test.ts` (append a `describe`)

**Interfaces:**
- Consumes: nothing.
- Produces: mock semantics identical to Obsidian 1.14.2 `app.js` —
  `load(){ if(!_loaded){ _loaded=true; onload(); for (child of _children.slice()) child.load(); } }`
  `unload(){ if(_loaded){ _loaded=false; while(_children.length) _children.pop().unload(); while(_events.length) _events.pop()(); onunload(); } }`
  i.e. load/unload are idempotent guards; children unload LIFO and are REMOVED; registered callbacks run LIFO and are cleared; `onunload()` runs LAST. Every later task's tests rely on this.

- [ ] **Step 1: Write the failing self-test**

```ts
// append to test/dom/mocks/obsidian-core.selftest.test.ts
import { Component } from '../../mocks/obsidian';

describe('SC-337: Component load/unload match Obsidian 1.14 (children LIFO, callbacks LIFO, onunload last)', () => {
	test('unload order: children LIFO, then registered callbacks LIFO, then onunload', () => {
		const order: string[] = [];
		class Probe extends Component {
			constructor(private readonly name: string) {
				super();
			}
			onunload(): void {
				order.push(`${this.name}.onunload`);
			}
		}
		const parent = new Probe('parent');
		parent.addChild(new Probe('childA'));
		parent.addChild(new Probe('childB'));
		parent.register(() => order.push('cb1'));
		parent.register(() => order.push('cb2'));
		parent.load();
		parent.unload();
		expect(order).toEqual(['childB.onunload', 'childA.onunload', 'cb2', 'cb1', 'parent.onunload']);
	});

	test('unload of a never-loaded component does nothing; unload is idempotent', () => {
		const cb = jest.fn();
		const c = new Component();
		c.register(cb);
		c.unload();
		expect(cb).not.toHaveBeenCalled();
		c.load();
		c.unload();
		c.unload();
		expect(cb).toHaveBeenCalledTimes(1);
	});

	test('load is idempotent and loads children after onload', () => {
		const order: string[] = [];
		class Probe extends Component {
			constructor(private readonly name: string) {
				super();
			}
			onload(): void {
				order.push(this.name);
			}
		}
		const parent = new Probe('parent');
		parent.addChild(new Probe('child'));
		parent.load();
		parent.load();
		expect(order).toEqual(['parent', 'child']);
	});

	test('unload removes the children (a later load does not resurrect them)', () => {
		const parent = new Component();
		const child = new Component();
		parent.addChild(child);
		parent.load();
		parent.unload();
		expect(parent._children).toHaveLength(0);
	});
});
```

- [ ] **Step 2: Run — expect FAIL** (FIFO order, no guard)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/mocks/obsidian-core.selftest.test.ts'
```

- [ ] **Step 3: Implement** — replace `load()` and `unload()` in the mock's `class Component`:

```ts
	// SC-337: identical to Obsidian 1.14.2 app.js (Component.prototype.load / unload).
	load(): void {
		if (this._loaded) return;
		this._loaded = true;
		this.onload();
		for (const child of this._children.slice()) child.load();
	}
	unload(): void {
		if (!this._loaded) return;
		this._loaded = false;
		while (this._children.length > 0) this._children.pop()!.unload();
		while (this._registeredCallbacks.length > 0) this._registeredCallbacks.pop()!();
		this.onunload();
	}
```

- [ ] **Step 4: Run the FULL jest suite and fix every newly failing test in this commit**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest'
```
For each failure, decide which of two causes it is and fix the TEST (never the mock back):
- *Unloading a component that was never loaded* (e.g. `pipeline.run(def, src, makeHost({ addChild: jest.fn(c => c) }))` then `view.unload()`): load it first — `(view as unknown as Component).load()` before the interaction, or make the fake host's `addChild` load the child (`addChild: jest.fn((c) => { (c as Component).load(); return c; })`). Real Obsidian loads a view when it is added under a loaded render child, so a loaded view is the faithful fixture.
- *Asserting FIFO order* (children or callbacks): change the expected order to LIFO and fix any comment that describes the old order (e.g. the SC-331-era comment in `initiative.test.ts` if present).
Record in the task report: the number of tests fixed, and per file one line saying which cause. If a failure fits neither cause, STOP and report it (NEEDS_CONTEXT) with the test name and assertion.

- [ ] **Step 5: Full jest green, tsc, lint; commit**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run lint'
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && git add test && git commit -m "test(mocks): SC-340 — Component load/unload match Obsidian (children and callbacks LIFO, onunload last; closes SC-337)"
```

---

### Task 2: `ViewRegistry` — ownership outside the render child, and release (adoption still off)

**Files:**
- Create: `src/framework/host/viewRegistry.ts`
- Modify: `src/framework/host/ReadingModeBlockHost.ts` (constructor param, `attachEntry`, render-child unload → release)
- Modify: `src/framework/pipeline.ts` (the single `host.addChild(view)` call, currently ~:682)
- Modify: `src/framework/registerFrameworkElements.ts` (create + return the registry; pass it to each host)
- Modify: `main.ts` (field `viewRegistry`; pass `{ viewAdoption: false }` for now)
- Test: `test/dom/framework/view-registry.test.ts` (new), `test/dom/framework/_adoptionEnv.ts` (new, shared env — no tests)

**Interfaces:**
- Consumes: SC-343's `ReadingModeBlockHost` (`setMountedBody`, `lastKnownBody`, `lastKnownLineStart`, `normalizeBody`); Task 1 mock semantics.
- Produces (exact; Tasks 3–7 use these names):
  ```ts
  // src/framework/host/viewRegistry.ts
  export const CLAIM_WINDOW_MS = 3000;
  export interface ViewRegistryEntry {
    readonly view: Component; readonly host: ReadingModeBlockHost; readonly root: HTMLElement;
    tickets: Array<{ body: string; at: number }>; claiming: boolean; released: boolean;
    releasedBy: string | null;
  }
  export interface ViewRegistryStats { claims: number; misses: number; releases: number; ambiguous: number; collisions: number }
  export class ViewRegistry extends Component {
    enabled: boolean; readonly stats: ViewRegistryStats;
    constructor(options: { enabled: boolean; now?: () => number });
    get size(): number; liveEntries(): readonly ViewRegistryEntry[];
    own(view: Component, host: ReadingModeBlockHost, root: HTMLElement): ViewRegistryEntry;
    noteWrite(entry: ViewRegistryEntry, body: string): void;          // Task 3 calls it
    claim(docId: string, sourcePath: string, body: string): ViewRegistryEntry | null; // returns null until Task 4
    finishClaim(entry: ViewRegistryEntry): void;
    release(entry: ViewRegistryEntry, reason: string): void;
  }
  ```
  - `ReadingModeBlockHost` constructor gains a 6th optional param `registry: ViewRegistry | null = null` exposed as `readonly registry`; new method `attachEntry(entry: ViewRegistryEntry): void`.
  - `registerFrameworkElements(plugin, framework, options?: { viewAdoption?: boolean }): ViewRegistry` (default `viewAdoption: false`).
  - `DrawSteelAdmonitionPlugin.viewRegistry: ViewRegistry | null` (the gate reads it via `app.plugins.plugins['draw-steel-elements'].viewRegistry`).

- [ ] **Step 1: Write the failing tests**

```ts
// test/dom/framework/_adoptionEnv.ts — shared, test-free env for the SC-340 suites (the
// leading underscore keeps it out of jest's *.test.ts match).
import type { ElementPipelineDeps } from '../../../src/framework/pipeline';
import { createThemeService } from '../../../src/framework/seams/theme';
import { createPreferenceStore } from '../../../src/framework/seams/prefs';
import type { PrefsStorage } from '../../../src/framework/seams/prefs';
import { DSE_PREF_DESCRIPTORS } from '../../../src/prefs/catalog';
import { createRollService } from '../../../src/framework/roll/service';
import { createReferenceService } from '../../../src/framework/seams/refs';
import { createValidationService } from '../../../src/framework/validation';
import { createSessionStore } from '../../../src/framework/session';
import { DEFAULT_SETTINGS } from '@model/Settings';
import { App, Plugin } from '../../mocks/obsidian';

export function makeEnv(): { deps: ElementPipelineDeps; app: App; plugin: Plugin } {
	const app = new App();
	app.vault.setFile('Media/token_1.png', '');
	const plugin = new Plugin(app);
	const storage: PrefsStorage = { get: async () => undefined, set: async () => {} };
	const prefs = createPreferenceStore(storage);
	prefs.describe(DSE_PREF_DESCRIPTORS);
	return {
		deps: {
			app: app as any,
			plugin: plugin as any,
			settings: DEFAULT_SETTINGS,
			theme: createThemeService(prefs, plugin as any),
			prefs,
			refs: createReferenceService(app as any, DEFAULT_SETTINGS),
			validation: createValidationService(),
			session: createSessionStore(),
			roll: createRollService(prefs),
		},
		app,
		plugin,
	};
}
```

```ts
// test/dom/framework/view-registry.test.ts
// SC-340 (spec §6.1, §6.4): the ViewRegistry owns reading-mode views; the CURRENT render
// child's unload releases the view (flush, then unload).
import { ViewRegistry } from '../../../src/framework/host/viewRegistry';
import { ReadingModeBlockHost } from '../../../src/framework/host/ReadingModeBlockHost';
import { ElementPipeline } from '../../../src/framework/pipeline';
import { counterElement } from '../../../src/elements/counter/definition';
import { PERSIST_DEBOUNCE_MS } from '../../../src/framework/view';
import { Component, makeFakeContext } from '../../mocks/obsidian';
import { makeEnv } from './_adoptionEnv';

const COUNTER_BODY = 'name: Health\ncurrent_value: 10\nmax_value: 20\nmin_value: 0';
const NOTE = `# N\n\n\`\`\`ds-counter\n${COUNTER_BODY}\n\`\`\`\n`;

async function mountCounter(enabled = false) {
	const { deps, app, plugin } = makeEnv();
	app.vault.setFile('Note.md', NOTE);
	const registry = new ViewRegistry({ enabled });
	registry.load();
	const ctx = makeFakeContext(app, 'Note.md');
	const host = new ReadingModeBlockHost(plugin as any, ctx.el, ctx as any, 'ds-counter', null, registry);
	host.setMountedBody(COUNTER_BODY);
	await new ElementPipeline(deps).run(counterElement, COUNTER_BODY, host);
	const renderChild = ctx.addedChildren[0];
	renderChild.load();
	const root = ctx.el.firstElementChild as HTMLElement;
	return { app, registry, host, ctx, renderChild, root };
}

describe('SC-340 Task 2: ViewRegistry ownership and release', () => {
	test('the pipeline hands a reading-mode view to the registry, never to host.addChild', async () => {
		const spy = jest.spyOn(ReadingModeBlockHost.prototype, 'addChild');
		const { registry, renderChild } = await mountCounter();
		expect(registry.size).toBe(1);
		expect(spy).not.toHaveBeenCalled();
		expect(renderChild._children).toHaveLength(0); // the view is not a render-child child
		const [entry] = registry.liveEntries();
		expect((entry.view as any)._loaded).toBe(true);
		spy.mockRestore();
	});

	test('the CURRENT render child unloading releases (unloads) the view', async () => {
		const { registry, renderChild } = await mountCounter();
		const [entry] = registry.liveEntries();
		renderChild.unload();
		expect(registry.size).toBe(0);
		expect(entry.released).toBe(true);
		expect(entry.releasedBy).toBe('render-child-unload');
		expect((entry.view as any)._loaded).toBe(false);
	});

	test('release flushes the pending write: a click then an unload within the debounce still writes', async () => {
		jest.useFakeTimers();
		const { app, renderChild, root } = await mountCounter();
		(root.querySelector('button[aria-label^="Increase"]') as HTMLElement).click();
		renderChild.unload(); // before PERSIST_DEBOUNCE_MS
		await jest.advanceTimersByTimeAsync(0);
		expect(app.vault.getContent('Note.md')).toContain('current_value: 11');
		await jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS);
		expect(app.vault.modifyCalls).toHaveLength(1);
		jest.useRealTimers();
	});

	test('registered callbacks run LIFO on release: a modal close registered after the flush runs before it', async () => {
		const registry = new ViewRegistry({ enabled: false });
		registry.load();
		const { app, plugin } = makeEnv();
		app.vault.setFile('Note.md', NOTE);
		const ctx = makeFakeContext(app, 'Note.md');
		const host = new ReadingModeBlockHost(plugin as any, ctx.el, ctx as any, 'ds-counter', null, registry);
		const order: string[] = [];
		const view = new Component();
		view.register(() => order.push('flush')); // ElementView registers its flush first
		view.register(() => order.push('close-modal')); // then a view registers its modal close
		const entry = registry.own(view, host, document.createElement('div'));
		registry.release(entry, 'test');
		expect(order).toEqual(['close-modal', 'flush']);
	});

	test('release is idempotent; a released entry is never released twice', () => {
		const registry = new ViewRegistry({ enabled: false });
		registry.load();
		const { app, plugin } = makeEnv();
		app.vault.setFile('Note.md', NOTE);
		const ctx = makeFakeContext(app, 'Note.md');
		const host = new ReadingModeBlockHost(plugin as any, ctx.el, ctx as any, 'ds-counter', null, registry);
		const entry = registry.own(new Component(), host, document.createElement('div'));
		registry.release(entry, 'first');
		registry.release(entry, 'second');
		expect(registry.stats.releases).toBe(1);
		expect(entry.releasedBy).toBe('first');
	});

	test('plugin unload (the registry unloads) unloads every owned view', async () => {
		const { registry } = await mountCounter();
		const [entry] = registry.liveEntries();
		registry.unload();
		expect((entry.view as any)._loaded).toBe(false);
		expect(registry.size).toBe(0);
	});

	test('with adoption off, claim() always misses', async () => {
		const { registry } = await mountCounter(false);
		expect(registry.claim('fake-doc-Note.md', 'Note.md', COUNTER_BODY)).toBeNull();
	});
});
```

- [ ] **Step 2: Run — expect FAIL** (`Cannot find module '…/viewRegistry'`)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/view-registry.test.ts'
```

- [ ] **Step 3: Create `src/framework/host/viewRegistry.ts`**

```ts
// SC-340 (spec §6.1–§6.4) — the ViewRegistry: a plugin-scoped Component that OWNS every
// reading-mode ElementView, so a view can outlive the section it was drawn in.
//
// Why ownership lives here from the start: Obsidian's Component.removeChild always unloads
// (B8), so a view that was ever a child of the block's MarkdownRenderChild could never be
// rescued. The render child now only SIGNALS: when the host's CURRENT render child unloads,
// the host calls release(), which unloads the view (its registered flush-on-unload writes
// any pending body first — LIFO: it was registered first, so it runs last).
//
// Adoption (Task 4) adds claim tickets: host.replaceSource records the body it is about to
// write (noteWrite) BEFORE Vault.process, because Obsidian fires `modify` and runs the new
// section's code-block processor inside/just after it (B1, B2). The processor then asks
// claim(docId, sourcePath, source) whether a live view wrote exactly this body.
import { Component } from 'obsidian';
import type { ReadingModeBlockHost } from './ReadingModeBlockHost';
import { normalizeBody } from './ReadingModeBlockHost';

/** A write's claim ticket is valid this long (spec §6.2; the rebuild arrives ~5 ms after modify). */
export const CLAIM_WINDOW_MS = 3000;

export interface ViewRegistryEntry {
	readonly view: Component;
	readonly host: ReadingModeBlockHost;
	readonly root: HTMLElement;
	/** Bodies this view wrote, oldest first; each one is a ticket for one rebuild. */
	tickets: Array<{ body: string; at: number }>;
	/** True between a successful claim() and finishClaim(). */
	claiming: boolean;
	released: boolean;
	/** Why the entry was released (diagnostics; the gate reads it). */
	releasedBy: string | null;
}

export interface ViewRegistryStats {
	claims: number;
	misses: number;
	releases: number;
	ambiguous: number;
	collisions: number;
}

export class ViewRegistry extends Component {
	/** Kill switch (spec §6.6): false = claim() always misses = today's behaviour. */
	enabled: boolean;
	readonly stats: ViewRegistryStats = { claims: 0, misses: 0, releases: 0, ambiguous: 0, collisions: 0 };
	private readonly entries = new Set<ViewRegistryEntry>();
	private readonly now: () => number;

	constructor(options: { enabled: boolean; now?: () => number }) {
		super();
		this.enabled = options.enabled;
		this.now = options.now ?? (() => Date.now());
	}

	get size(): number {
		return this.entries.size;
	}

	liveEntries(): readonly ViewRegistryEntry[] {
		return [...this.entries];
	}

	/** Take ownership of a freshly mounted reading-mode view. */
	own(view: Component, host: ReadingModeBlockHost, root: HTMLElement): ViewRegistryEntry {
		const entry: ViewRegistryEntry = { view, host, root, tickets: [], claiming: false, released: false, releasedBy: null };
		this.entries.add(entry);
		host.attachEntry(entry);
		this.addChild(view);
		return entry;
	}

	/** Record a claim ticket for `body` (called by the host BEFORE Vault.process). */
	noteWrite(entry: ViewRegistryEntry, body: string): void {
		if (entry.released) return;
		const at = this.now();
		entry.tickets = entry.tickets.filter((ticket) => at - ticket.at < CLAIM_WINDOW_MS);
		entry.tickets.push({ body, at });
	}

	/** Task 4 implements adoption; until then every rebuild gets a fresh view. */
	claim(_docId: string, _sourcePath: string, _body: string): ViewRegistryEntry | null {
		if (!this.enabled) return null;
		this.stats.misses++;
		return null;
	}

	finishClaim(entry: ViewRegistryEntry): void {
		entry.claiming = false;
	}

	/** Unload a view for real. Idempotent. Its registered flush-on-unload writes first. */
	release(entry: ViewRegistryEntry, reason: string): void {
		if (entry.released) return;
		entry.released = true;
		entry.releasedBy = reason;
		entry.claiming = false;
		this.entries.delete(entry);
		this.stats.releases++;
		this.removeChild(entry.view);
	}

	onunload(): void {
		// The children (views) were already unloaded, LIFO, before this runs.
		for (const entry of this.entries) {
			entry.released = true;
			entry.releasedBy = 'registry-unload';
		}
		this.entries.clear();
	}
}
```

- [ ] **Step 4: Modify `ReadingModeBlockHost`** (on top of SC-343's version)

Add `import type { ViewRegistry, ViewRegistryEntry } from './viewRegistry';`. Add the constructor parameter after `scrollPin`:

```ts
		/** SC-340: the plugin-scoped owner of this host's view; null in unit tests / non-owned use. */
		readonly registry: ViewRegistry | null = null,
```

Add a field and method:

```ts
	/** SC-340: this host's registry entry (set by ViewRegistry.own). */
	private entry: ViewRegistryEntry | null = null;

	attachEntry(entry: ViewRegistryEntry): void {
		this.entry = entry;
	}
```

Replace the construction of the render child (the lines that do `new MarkdownRenderChild(el)` and `ctx.addChild(...)`) with a factory, and route its unload:

```ts
		this.renderChild = this.makeRenderChild(el, ctx);
```
```ts
	private makeRenderChild(el: HTMLElement, ctx: MarkdownPostProcessorContext): MarkdownRenderChild {
		const renderChild = new MarkdownRenderChild(el);
		renderChild.register(() => this.onRenderChildUnload(renderChild));
		ctx.addChild(renderChild);
		return renderChild;
	}

	/**
	 * SC-340 §6.4: only the host's CURRENT render child releases the view. A render child the
	 * host was rebound away from (Task 3) is superseded: its unload is a no-op.
	 */
	private onRenderChildUnload(renderChild: MarkdownRenderChild): void {
		if (renderChild !== this.renderChild) return;
		this.readSection(); // last chance to refresh the durable position while it may resolve
		if (this.entry && this.registry) this.registry.release(this.entry, 'render-child-unload');
	}
```
(`renderChild` stays `private readonly` in this task; Task 3 makes it mutable.)

- [ ] **Step 5: Modify the pipeline** — replace the single `host.addChild(view);` (in `ElementPipeline.run`, right after `registerAfterRender(root, …)`) with:

```ts
			if (host instanceof ReadingModeBlockHost && host.registry) {
				// SC-340 §6.1: a reading-mode view is owned by the plugin-scoped ViewRegistry —
				// never by the block's render child — so it can outlive its section (adoption).
				host.registry.own(view, host, root);
			} else {
				host.addChild(view);
			}
```
and add `import { ReadingModeBlockHost } from './host/ReadingModeBlockHost';` to pipeline.ts's imports.

- [ ] **Step 6: Modify `registerFrameworkElements.ts`**

```ts
import { ViewRegistry } from './host/viewRegistry';
```
Change the signature and body:

```ts
export function registerFrameworkElements(
	plugin: Plugin,
	framework: FrameworkElementsBundle,
	options: { viewAdoption?: boolean } = {},
): ViewRegistry {
	// SC-198: one pin per plugin, shared by every host …(keep the existing comment)
	const scrollPin = new PreviewScrollPin();
	plugin.register(() => scrollPin.releaseAll());
	// SC-340 §6.1: the plugin-scoped owner of every reading-mode view.
	const registry = plugin.addChild(new ViewRegistry({ enabled: options.viewAdoption ?? false }));

	for (const def of framework.registry.all()) {
		for (const alias of def.aliases) {
			plugin.registerMarkdownCodeBlockProcessor(
				alias,
				(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
					const host = new ReadingModeBlockHost(plugin, el, ctx, alias, scrollPin, registry);
					host.setMountedBody(source);
					return framework.pipeline.run(def, source, host);
				},
			);
		}
	}
	return registry;
}
```

- [ ] **Step 7: Modify `main.ts`** — add the field next to the other plugin fields (`import type { ViewRegistry } from 'src/framework/host/viewRegistry';` — match main.ts's existing import path style for framework files):

```ts
    /** SC-340: the owner of every reading-mode view (read by the real-Obsidian lifecycle gate). */
    viewRegistry: ViewRegistry | null = null;
```
and change the call to:

```ts
        this.viewRegistry = registerFrameworkElements(this, frameworkV2, { viewAdoption: false });
```

- [ ] **Step 8: Run the new file + host/registration/pipeline/sidebar suites — expect PASS; then full jest, tsc, lint**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/view-registry.test.ts test/dom/framework/reading-mode-host.test.ts test/dom/framework/register-framework-elements.test.ts test/dom/framework/pipeline.test.ts'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run lint'
```
If an existing test asserted that the view is a render-child child (e.g. `host.addChild` called with the view for a real `ReadingModeBlockHost`), update it to assert registry ownership instead and note it in the report.

- [ ] **Step 9: Real-Obsidian regression check (nothing adopts yet, teardown must still flush)**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run obsidian-lifecycle'
```
Expected: `done: 5/5 ok, 0 failed` (SC-343's scenarios — they exercise release on navigate-away, leaf close and external edit). Then `rm -f main.js main.css styles.css`.

- [ ] **Step 10: Commit**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && git add src/framework/host/viewRegistry.ts src/framework/host/ReadingModeBlockHost.ts src/framework/pipeline.ts src/framework/registerFrameworkElements.ts main.ts test && git commit -m "feat(framework): SC-340 — ViewRegistry owns reading-mode views; the current render child releases them"
```

---

### Task 3: Host rebind + claim ticket on write

**Files:**
- Modify: `src/framework/host/ReadingModeBlockHost.ts`
- Test: `test/dom/framework/view-registry.test.ts` (append a `describe`)

**Interfaces:**
- Consumes: Task 2 (`registry`, `entry`, `makeRenderChild`, `onRenderChildUnload`, `ViewRegistry.noteWrite`).
- Produces:
  - `rebind(el: HTMLElement, ctx: MarkdownPostProcessorContext): void` — sets the element and context, creates a NEW render child on the new ctx, refreshes the durable position. The previous render child becomes superseded (its unload is a no-op).
  - `get docId(): string` (= `ctx.docId` of the current binding).
  - `get containerEl(): HTMLElement` — now a getter over a private field (`BlockHost.containerEl` is `readonly`, which a getter satisfies).
  - `replaceSource` calls `this.registry.noteWrite(this.entry, newSource)` synchronously, immediately before `await …vault.process(…)`, when both exist.

- [ ] **Step 1: Write the failing tests** (append to `view-registry.test.ts`; reuse `mountCounter`, `COUNTER_BODY`, `NOTE` from that file and `makeEnv` from `_adoptionEnv.ts`)

```ts
describe('SC-340 Task 3: rebind and claim tickets', () => {
	test('rebind re-points containerEl, docId and position; the OLD render child unload is then a no-op', async () => {
		const { app, registry, host, renderChild } = await mountCounter();
		const ctx2 = makeFakeContext(app, 'Note.md');
		(ctx2 as any).docId = 'doc-2';
		host.rebind(ctx2.el, ctx2 as any);
		expect(host.containerEl).toBe(ctx2.el);
		expect(host.docId).toBe('doc-2');
		expect(ctx2.addedChildren).toHaveLength(1);

		renderChild.unload(); // superseded
		expect(registry.size).toBe(1);

		const renderChild2 = ctx2.addedChildren[0];
		renderChild2.load();
		renderChild2.unload(); // current
		expect(registry.size).toBe(0);
	});

	test('replaceSource records a claim ticket BEFORE Vault.process runs', async () => {
		const { app, registry, host } = await mountCounter();
		const [entry] = registry.liveEntries();
		let ticketsSeenInsideProcess = -1;
		const original = app.vault.process.bind(app.vault);
		app.vault.process = (async (file: any, fn: any) => {
			ticketsSeenInsideProcess = entry.tickets.length;
			return original(file, fn);
		}) as any;
		await host.replaceSource('name: Health\ncurrent_value: 11\nmax_value: 20\nmin_value: 0');
		expect(ticketsSeenInsideProcess).toBe(1);
		expect(entry.tickets[0].body).toBe('name: Health\ncurrent_value: 11\nmax_value: 20\nmin_value: 0');
	});

	test('tickets older than CLAIM_WINDOW_MS are dropped on the next write', () => {
		let now = 1_000;
		const registry = new ViewRegistry({ enabled: true, now: () => now });
		registry.load();
		const { app, plugin } = makeEnv();
		app.vault.setFile('Note.md', NOTE);
		const ctx = makeFakeContext(app, 'Note.md');
		const host = new ReadingModeBlockHost(plugin as any, ctx.el, ctx as any, 'ds-counter', null, registry);
		const entry = registry.own(new Component(), host, document.createElement('div'));
		registry.noteWrite(entry, 'a: 1');
		now += CLAIM_WINDOW_MS;
		registry.noteWrite(entry, 'a: 2');
		expect(entry.tickets.map((t) => t.body)).toEqual(['a: 2']);
	});
});
```
Add `CLAIM_WINDOW_MS` to the `viewRegistry` import at the top of the file.

- [ ] **Step 2: Run — expect FAIL** (`rebind`/`docId` undefined; no ticket)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/view-registry.test.ts'
```

- [ ] **Step 3: Implement** in `ReadingModeBlockHost`:

1. Replace `readonly containerEl: HTMLElement;` with `private el: HTMLElement;` plus
```ts
	/** SC-340: a getter — rebind() re-points the host at the adopting section. */
	get containerEl(): HTMLElement {
		return this.el;
	}
```
and in the constructor `this.el = el;` (where it used to assign `this.containerEl`).
2. Change the constructor parameter `private readonly ctx: MarkdownPostProcessorContext` to a plain `ctx: MarkdownPostProcessorContext`, add the field `private ctx: MarkdownPostProcessorContext;` and assign `this.ctx = ctx;` first in the constructor body.
3. Change `private readonly renderChild` to `private renderChild`.
4. Add:
```ts
	get docId(): string {
		return this.ctx.docId;
	}

	/**
	 * SC-340 §6.3: re-point this SAME host (so every closure holding cx.host stays valid) at a
	 * new section. The previous render child is left to Obsidian; its unload is a no-op.
	 */
	rebind(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
		this.el = el;
		this.ctx = ctx;
		this.renderChild = this.makeRenderChild(el, ctx);
		this.readSection();
	}
```
5. In `replaceSource`, immediately before `await this.plugin.app.vault.process(`, add:
```ts
		// SC-340 §6.2: the claim ticket must exist before Vault.process — Obsidian fires
		// `modify` inside it and runs the new section's processor right after.
		if (this.entry && this.registry) this.registry.noteWrite(this.entry, newSource);
```

- [ ] **Step 4: Run — expect PASS; full jest, tsc, lint**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/view-registry.test.ts test/dom/framework/reading-mode-host.test.ts test/dom/framework/reading-mode-host-durable.test.ts'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run lint'
```

- [ ] **Step 5: Commit**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && git add src/framework/host/ReadingModeBlockHost.ts test/dom/framework/view-registry.test.ts && git commit -m "feat(framework): SC-340 — host rebind and a claim ticket per write"
```

---

### Task 4: Claim at processor time + adopt (synchronous move, focus carry) + SC-331 pins

**Files:**
- Modify: `src/framework/host/viewRegistry.ts` (`claim`)
- Create: `src/framework/host/adoptView.ts`
- Modify: `src/framework/registerFrameworkElements.ts` (claim → adopt before building a host)
- Test: `test/dom/framework/view-adoption.test.ts` (new), `test/dom/elements/initiative.test.ts` (carry-over), `test/dom/views/minion-stamina-pool-modal.test.ts` (carry-over)

**Interfaces:**
- Consumes: Task 2/3 (`ViewRegistry`, `CLAIM_WINDOW_MS`, `finishClaim`, `release`, `host.rebind`, `host.docId`), SC-343 `normalizeBody`.
- Produces:
  - `ViewRegistry.claim(docId, sourcePath, body)` — candidates: not released, not claiming, `view._loaded`, same `docId` and `sourcePath`, a ticket younger than `CLAIM_WINDOW_MS` whose `normalizeBody(ticket.body) === normalizeBody(body)`. Several candidates → newest ticket wins, `stats.ambiguous++`. Hit → consume that ticket and all older, `claiming = true`, `stats.claims++`. No hit → `stats.misses++`, `null`. (Task 5 inserts the collision check just before consuming the ticket.)
  - `adoptView(registry: ViewRegistry, entry: ViewRegistryEntry, el: HTMLElement, ctx: MarkdownPostProcessorContext): void` — rebind, capture focus, `el.appendChild(entry.root)` synchronously, restore focus once `el` is connected (5000 ms backstop), always `finishClaim`.
  - `captureFocus(root: HTMLElement): FocusState | null`; `restoreFocusWhenConnected(el: HTMLElement, state: FocusState, timeoutMs?: number): void`; `interface FocusState { el: HTMLElement; start: number | null; end: number | null }`.
  - Processor: claim → adopt → `return Promise.resolve()`; on an adoption exception: `console.error`, remove the root from `el` if it landed there, `registry.release(entry, 'adopt-failed')`, then build a fresh host as usual.

- [ ] **Step 1: Write the failing tests**

```ts
// test/dom/framework/view-adoption.test.ts
// SC-340 (spec §6.2): a rebuild caused by the view's OWN write adopts the live view.
// Simulates Obsidian's order (r1 E1, B1): write -> NEW section's processor (same docId,
// detached el) -> OLD render child unloads.
import { registerFrameworkElements } from '../../../src/framework/registerFrameworkElements';
import { ElementPipeline } from '../../../src/framework/pipeline';
import { createElementRegistry } from '../../../src/framework/registry';
import { counterElement } from '../../../src/elements/counter/definition';
import { initiativeElement } from '../../../src/elements/initiative/definition';
import { ViewRegistry, CLAIM_WINDOW_MS } from '../../../src/framework/host/viewRegistry';
import { captureFocus, restoreFocusWhenConnected } from '../../../src/framework/host/adoptView';
import { PERSIST_DEBOUNCE_MS } from '../../../src/framework/view';
import { makeFakeContext } from '../../mocks/obsidian';
import { makeEnv } from './_adoptionEnv';
import quickStart from '../../fixtures/initiative/quick-start.yaml';

function bodyOf(text: string, index = 0): string {
	const blocks = [...text.matchAll(/^```(ds-[\w-]+)\n([\s\S]*?)\n```$/gm)];
	return blocks[index][2];
}

async function setup(note: string, defs = [counterElement, initiativeElement], enabled = true, authoring = false) {
	const { deps, app, plugin } = makeEnv();
	if (authoring) await deps.prefs.set('authoringControls', true); // the Edit pencil (Task 6)
	app.vault.setFile('Note.md', note);
	plugin.load();
	const elements = createElementRegistry();
	for (const d of defs) elements.register(d);
	const registry = registerFrameworkElements(plugin as any, { registry: elements, pipeline: new ElementPipeline(deps) }, { viewAdoption: enabled });
	/** Render the i-th block of Note.md as a fresh section (optionally under another docId). */
	async function render(alias: string, index = 0, docId?: string) {
		const ctx = makeFakeContext(app, 'Note.md', index);
		if (docId) (ctx as any).docId = docId;
		await plugin.registeredProcessors.get(alias)!(bodyOf(app.vault.getContent('Note.md')!, index), ctx.el, ctx as any);
		ctx.addedChildren.forEach((c) => c.load());
		return ctx;
	}
	return { app, plugin, registry, render };
}

const COUNTER_NOTE = '# N\n\n```ds-counter\nname: Health\ncurrent_value: 10\nmax_value: 20\nmin_value: 0\n```\n';

describe('SC-340 Task 4: claim and adopt', () => {
	afterEach(() => jest.useRealTimers());

	test('own write -> new section adopts the SAME root and view; old render child unload is a no-op', async () => {
		jest.useFakeTimers();
		const { app, registry, render } = await setup(COUNTER_NOTE);
		const ctx1 = await render('ds-counter');
		const root = ctx1.el.firstElementChild as HTMLElement;
		(root.querySelector('button[aria-label^="Increase"]') as HTMLElement).click();
		await jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS);
		expect(app.vault.getContent('Note.md')).toContain('current_value: 11');

		const ctx2 = await render('ds-counter'); // Obsidian's rebuild of the changed section
		expect(ctx2.el.firstElementChild).toBe(root); // adopted: same DOM node
		expect(registry.stats.claims).toBe(1);
		ctx1.addedChildren[0].unload(); // old section removed after the new mount
		expect(registry.size).toBe(1);
		const [entry] = registry.liveEntries();
		expect((entry.view as any)._loaded).toBe(true);
		expect(entry.host.containerEl).toBe(ctx2.el);
	});

	test('another instance of the note (different docId) gets a FRESH view; the writer keeps its own', async () => {
		jest.useFakeTimers();
		const { registry, render } = await setup(COUNTER_NOTE);
		const pane = await render('ds-counter', 0, 'doc-pane');
		const embed = await render('ds-counter', 0, 'doc-embed');
		const embedRoot = embed.el.firstElementChild as HTMLElement;
		const paneRoot = pane.el.firstElementChild as HTMLElement;
		(pane.el.querySelector('button[aria-label^="Increase"]') as HTMLElement).click();
		await jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS);

		const embed2 = await render('ds-counter', 0, 'doc-embed'); // non-writer rebuilds FIRST (r1 E4)
		expect(embed2.el.firstElementChild).not.toBe(embedRoot);
		const pane2 = await render('ds-counter', 0, 'doc-pane');
		expect(pane2.el.firstElementChild).toBe(paneRoot); // the writer's own instance adopted
		expect(registry.stats.claims).toBe(1);
		expect(registry.stats.misses).toBeGreaterThanOrEqual(1);
	});

	test('a rebuild whose body we did not write (external edit) misses and builds a fresh view', async () => {
		const { app, registry, render } = await setup(COUNTER_NOTE);
		const ctx1 = await render('ds-counter');
		app.vault.setFile('Note.md', COUNTER_NOTE.replace('current_value: 10', 'current_value: 15'));
		const ctx2 = await render('ds-counter');
		expect(ctx2.el.firstElementChild).not.toBe(ctx1.el.firstElementChild);
		expect(registry.stats.claims).toBe(0);
	});

	test('a ticket older than CLAIM_WINDOW_MS no longer claims', async () => {
		jest.useFakeTimers();
		const { registry, render } = await setup(COUNTER_NOTE);
		const ctx1 = await render('ds-counter');
		(ctx1.el.querySelector('button[aria-label^="Increase"]') as HTMLElement).click();
		await jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS);
		jest.setSystemTime(Date.now() + CLAIM_WINDOW_MS + 1);
		const ctx2 = await render('ds-counter');
		expect(ctx2.el.firstElementChild).not.toBe(ctx1.el.firstElementChild);
		expect(registry.stats.claims).toBe(0);
	});

	test('with adoption disabled (kill switch) every rebuild is fresh', async () => {
		jest.useFakeTimers();
		const { registry, render } = await setup(COUNTER_NOTE, [counterElement, initiativeElement], false);
		const ctx1 = await render('ds-counter');
		(ctx1.el.querySelector('button[aria-label^="Increase"]') as HTMLElement).click();
		await jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS);
		const ctx2 = await render('ds-counter');
		expect(ctx2.el.firstElementChild).not.toBe(ctx1.el.firstElementChild);
		expect(registry.stats.claims).toBe(0);
	});

	test('SC-331 pin: the tracker ConditionsModal stays open across its own live write, and each change writes', async () => {
		jest.useFakeTimers();
		const note = '# E\n\n```ds-initiative\n' + quickStart.trimEnd() + '\n```\n';
		const { app, render } = await setup(note);
		const ctx1 = await render('ds-initiative');
		const root = ctx1.el.firstElementChild as HTMLElement;
		(root.querySelector('.dse-init__group--heroes .dse-cond--add') as HTMLElement).click();
		const modalEl = document.body.lastElementChild as HTMLElement;
		(modalEl.querySelector('button[aria-label="Add condition"]') as HTMLElement).click();
		const input = modalEl.querySelector('.dse-condal__input') as HTMLInputElement;
		input.value = 'Bleeding';
		input.dispatchEvent(new Event('input'));
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
		await jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS);
		expect(app.vault.modifyCalls).toHaveLength(1);
		expect(app.vault.getContent('Note.md')).toContain('bleeding');

		const ctx2 = await render('ds-initiative');
		ctx1.addedChildren[0].unload();
		expect(ctx2.el.firstElementChild).toBe(root);
		expect(document.body.contains(modalEl)).toBe(true); // the dialog survived its own save
	});

	test('focus: a focused input moved by the adoption is refocused with its caret once the section is inserted', async () => {
		const outer = document.body.createDiv();
		const root = outer.createDiv();
		const input = root.createEl('input', { type: 'text' });
		input.value = 'Feytouched';
		input.focus();
		input.setSelectionRange(4, 4);
		const state = captureFocus(root)!;
		expect(state.el).toBe(input);

		const el = document.createElement('div'); // detached, like the processor's el
		el.appendChild(root);
		input.blur(); // Chromium blurs a focused node that leaves the document
		restoreFocusWhenConnected(el, state);
		document.body.appendChild(el);
		await Promise.resolve(); // MutationObserver delivery
		await Promise.resolve();
		expect(document.activeElement).toBe(input);
		expect(input.selectionStart).toBe(4);
		el.remove();
		outer.remove();
	});
});
```

Carry-over pins (spec §10.1). Append to `test/dom/elements/initiative.test.ts` (it already has `renderInit`, `quickStart`, `PERSIST_DEBOUNCE_MS`):

```ts
describe('SC-340 (carried over from SC-331): no change, no write', () => {
	test('opening and closing the ConditionsModal with NO change persists nothing', async () => {
		jest.useFakeTimers();
		const { root, host } = await renderInit(quickStart);
		(root.querySelector('.dse-init__group--heroes .dse-cond--add') as HTMLElement).click();
		const modalEl = document.body.lastElementChild as HTMLElement;
		(modalEl.querySelector('.dse-modal__footer button[aria-label="Done"]') as HTMLElement).click();
		await jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS * 2);
		expect(host.replaceSource).not.toHaveBeenCalled();
		jest.useRealTimers();
	});
});
```

Append to `test/dom/views/minion-stamina-pool-modal.test.ts` (it already has `setup`, `flushAsync`):

```ts
describe('SC-340 (carried over from SC-331): pool modal, no change, no write', () => {
	test('closing with no condition edit at all persists nothing', async () => {
		const { modal, updateCallback } = await setup({ condition: true, persist: true });
		modal.close();
		await flushAsync();
		expect(updateCallback).not.toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run — expect the adoption tests to FAIL** (claim always misses; `adoptView` module missing)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/view-adoption.test.ts'
```

- [ ] **Step 3: Implement `claim`** in `viewRegistry.ts` (replace the Task 2 stub):

```ts
	/**
	 * SC-340 §6.2: the ONE live, unclaimed view in this rendered document (docId) and file
	 * whose recent own write produced exactly `body`. Consumes that ticket and older ones.
	 */
	claim(docId: string, sourcePath: string, body: string): ViewRegistryEntry | null {
		if (!this.enabled) return null;
		const at = this.now();
		const wanted = normalizeBody(body);
		const hits: Array<{ entry: ViewRegistryEntry; index: number }> = [];
		for (const entry of this.entries) {
			if (entry.released || entry.claiming) continue;
			if (!(entry.view as unknown as { _loaded: boolean })._loaded) continue;
			if (entry.host.docId !== docId || entry.host.sourcePath !== sourcePath) continue;
			const index = entry.tickets.findIndex((t) => at - t.at < CLAIM_WINDOW_MS && normalizeBody(t.body) === wanted);
			if (index >= 0) hits.push({ entry, index });
		}
		if (hits.length === 0) {
			this.stats.misses++;
			return null;
		}
		if (hits.length > 1) this.stats.ambiguous++;
		hits.sort((a, b) => b.entry.tickets[b.index].at - a.entry.tickets[a.index].at);
		const { entry, index } = hits[0];
		entry.tickets.splice(0, index + 1);
		entry.claiming = true;
		this.stats.claims++;
		return entry;
	}
```

- [ ] **Step 4: Create `src/framework/host/adoptView.ts`**

```ts
// SC-340 §6.2 — adopt: re-point the writer's host at the new section and move the view's
// root into the new (still detached, B6) `el` SYNCHRONOUSLY, so Obsidian measures and
// inserts the section with its real content (the spike's wait-for-insert variant stalled at
// its backstop in 2/71 adoptions). Obsidian takes the section out of the document during
// its render (B7/B11), so a focused input blurs; focus and caret are restored once `el` is
// inserted. Popout-safe: every window access goes through el.ownerDocument.
import type { MarkdownPostProcessorContext } from 'obsidian';
import type { ViewRegistry, ViewRegistryEntry } from './viewRegistry';

export interface FocusState {
	el: HTMLElement;
	start: number | null;
	end: number | null;
}

/** The focused element inside `root` (and its text selection), or null. */
export function captureFocus(root: HTMLElement): FocusState | null {
	const active = root.ownerDocument.activeElement as HTMLElement | null;
	if (!active || !root.contains(active)) return null;
	let start: number | null = null;
	let end: number | null = null;
	try {
		start = (active as HTMLInputElement).selectionStart ?? null;
		end = (active as HTMLInputElement).selectionEnd ?? null;
	} catch {
		// number/checkbox inputs throw on selectionStart: focus only
	}
	return { el: active, start, end };
}

/** Refocus `state.el` (and its caret) once `el` is in the document; give up after `timeoutMs`. */
export function restoreFocusWhenConnected(el: HTMLElement, state: FocusState, timeoutMs = 5000): void {
	const doc = el.ownerDocument;
	const win = doc.defaultView;
	const restore = (): void => {
		if (!state.el.isConnected || doc.activeElement === state.el) return;
		state.el.focus({ preventScroll: true });
		if (state.start !== null) {
			try {
				(state.el as HTMLInputElement).setSelectionRange(state.start, state.end ?? state.start);
			} catch {
				// not a text control
			}
		}
	};
	if (el.isConnected || !win) {
		restore();
		return;
	}
	const observer = new win.MutationObserver(() => {
		if (!el.isConnected) return;
		observer.disconnect();
		win.clearTimeout(timer);
		restore();
	});
	observer.observe(doc.body, { childList: true, subtree: true });
	const timer = win.setTimeout(() => observer.disconnect(), timeoutMs);
}

/** Adopt `entry`'s live view into the new section `el`. Always ends the claim. */
export function adoptView(
	registry: ViewRegistry,
	entry: ViewRegistryEntry,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
): void {
	try {
		entry.host.rebind(el, ctx);
		const focus = captureFocus(entry.root);
		el.appendChild(entry.root);
		if (focus) restoreFocusWhenConnected(el, focus);
	} finally {
		registry.finishClaim(entry);
	}
}
```

- [ ] **Step 5: Wire the processor** in `registerFrameworkElements.ts` — import `import { adoptView } from './host/adoptView';` and replace the processor lambda body with:

```ts
				(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
					// SC-340 §6.2: a rebuild caused by one of OUR writes adopts the live view.
					const claimed = registry.claim(ctx.docId, ctx.sourcePath, source);
					if (claimed) {
						try {
							adoptView(registry, claimed, el, ctx);
							return Promise.resolve();
						} catch (error) {
							// §8: never leave the block blank — release and render fresh.
							console.error('Draw Steel Elements: view adoption failed; rendering a fresh view.', error);
							if (claimed.root.parentElement === el) claimed.root.remove();
							registry.release(claimed, 'adopt-failed');
						}
					}
					const host = new ReadingModeBlockHost(plugin, el, ctx, alias, scrollPin, registry);
					host.setMountedBody(source);
					return framework.pipeline.run(def, source, host);
				},
```

- [ ] **Step 6: Run the new + carry-over tests — expect PASS; then full jest, tsc, lint**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/view-adoption.test.ts test/dom/elements/initiative.test.ts test/dom/views/minion-stamina-pool-modal.test.ts'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run lint'
```

- [ ] **Step 7: Commit**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && git add src/framework/host/viewRegistry.ts src/framework/host/adoptView.ts src/framework/registerFrameworkElements.ts test && git commit -m "feat(framework): SC-340 — claim at processor time and adopt the live view (focus carried)"
```

---

### Task 5: `docId` collision guard

**Files:**
- Modify: `src/framework/host/viewRegistry.ts` (`claim`, just before consuming the ticket)
- Test: `test/dom/framework/view-adoption.test.ts` (append)

**Interfaces:**
- Consumes: Task 4 `claim`; SC-343 `host.lastKnownLineStart`.
- Produces: `claim` returns `null` and increments `stats.collisions` when any OTHER live, unreleased entry has the same `docId` AND `sourcePath` AND `host.lastKnownLineStart` as the winner (the same block rendered twice under one `docId` — Obsidian behaviour B4 says this never happens; if it does, adoption falls back to fresh views rather than risk giving the view to the wrong instance).

- [ ] **Step 1: Write the failing test** (append to `view-adoption.test.ts`)

```ts
describe('SC-340 Task 5: docId collision guard', () => {
	test('the same block rendered twice under ONE docId refuses to claim (fresh view instead)', async () => {
		jest.useFakeTimers();
		const { registry, render } = await setup(COUNTER_NOTE);
		const a = await render('ds-counter', 0, 'doc-same');
		const b = await render('ds-counter', 0, 'doc-same'); // collision: same docId, same block
		(a.el.querySelector('button[aria-label^="Increase"]') as HTMLElement).click();
		await jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS);
		const c = await render('ds-counter', 0, 'doc-same');
		expect(c.el.firstElementChild).not.toBe(a.el.firstElementChild);
		expect(c.el.firstElementChild).not.toBe(b.el.firstElementChild);
		expect(registry.stats.collisions).toBe(1);
		expect(registry.stats.claims).toBe(0);
		jest.useRealTimers();
	});

	test('two DIFFERENT blocks in one document (same docId, different lines) still adopt normally', async () => {
		jest.useFakeTimers();
		const note = COUNTER_NOTE + '\nMID\n\n```ds-counter\nname: Other\ncurrent_value: 1\nmax_value: 20\nmin_value: 0\n```\n';
		const { registry, render } = await setup(note);
		const first = await render('ds-counter', 0, 'doc-one');
		const firstRoot = first.el.firstElementChild as HTMLElement;
		await render('ds-counter', 1, 'doc-one');
		(first.el.querySelector('button[aria-label^="Increase"]') as HTMLElement).click();
		await jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS);
		const again = await render('ds-counter', 0, 'doc-one');
		expect(again.el.firstElementChild).toBe(firstRoot);
		expect(registry.stats.claims).toBe(1);
		expect(registry.stats.collisions).toBe(0);
		jest.useRealTimers();
	});
});
```

- [ ] **Step 2: Run — expect the first test to FAIL** (it claims)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/view-adoption.test.ts'
```

- [ ] **Step 3: Implement** — in `claim`, after `const { entry, index } = hits[0];` and before `entry.tickets.splice(…)`:

```ts
		// Spec §4 B4 / §6.2: two live views of the SAME block under ONE docId means docId no
		// longer tells instances apart — refuse, so the view can never go to the wrong one.
		for (const other of this.entries) {
			if (other === entry || other.released) continue;
			if (
				other.host.docId === docId &&
				other.host.sourcePath === sourcePath &&
				other.host.lastKnownLineStart !== null &&
				other.host.lastKnownLineStart === entry.host.lastKnownLineStart
			) {
				this.stats.collisions++;
				return null;
			}
		}
```

- [ ] **Step 4: Run — PASS; full jest, tsc, lint; commit**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run lint'
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && git add src/framework/host/viewRegistry.ts test/dom/framework/view-adoption.test.ts && git commit -m "feat(framework): SC-340 — refuse adoption when one docId renders the same block twice"
```

---

### Task 6: Follow-through audits — stepper blur guard, form editor current body

**Files:**
- Modify: `src/framework/kit/stepper.ts` (the `'blur'` handler, currently `:187`)
- Modify: `src/framework/pipeline.ts` (the two `openFormEditor(view, cx, def, source, …)` calls, currently ~:620 and ~:670)
- Test: `test/dom/kit/stepper.test.ts` (append), `test/dom/framework/view-adoption.test.ts` (append)

**Interfaces:**
- Consumes: SC-343 `ReadingModeBlockHost.lastKnownBody`.
- Produces: an editable stepper ignores a `blur` while its input is disconnected (the adoption blur, B11); both pipeline form-editor entry points pass `currentBody()` = `host.lastKnownBody ?? source` for a `ReadingModeBlockHost`, `source` otherwise.

- [ ] **Step 1: Write the failing tests**

Append to `test/dom/kit/stepper.test.ts` (it imports `stepper` and `Component`):

```ts
describe('SC-340 §9.1: the adoption blur does not commit a half-typed draft', () => {
	test('blur while the input is out of the document is ignored; a real blur commits', () => {
		const owner = new Component();
		owner.load();
		const parent = document.body.createDiv();
		const onChange = jest.fn();
		stepper(parent, { value: 3, min: 0, max: 10, editable: true, label: 'Hero tokens', onChange }, owner);
		const input = parent.querySelector('input.dse-stepper__input') as HTMLInputElement;
		input.value = '7';

		parent.remove(); // the section left the document (adoption)
		input.dispatchEvent(new FocusEvent('blur'));
		expect(onChange).not.toHaveBeenCalled();

		document.body.appendChild(parent);
		input.dispatchEvent(new FocusEvent('blur'));
		expect(onChange).toHaveBeenCalledWith(7);
		parent.remove();
	});
});
```

Append to `test/dom/framework/view-adoption.test.ts`:

```ts
import * as FormModal from '../../../src/authoring/FormModal';

describe('SC-340 §9.2: the form editor opens with the CURRENT body after adopted writes', () => {
	test('pencil after a write passes the written body, not the mount-time source', async () => {
		jest.useFakeTimers();
		const spy = jest.spyOn(FormModal, 'openFormEditor').mockImplementation(() => ({}) as any);
		const { app, render } = await setup(COUNTER_NOTE, undefined, true, true);
		const ctx1 = await render('ds-counter');
		const root = ctx1.el.firstElementChild as HTMLElement;
		(root.querySelector('button[aria-label^="Increase"]') as HTMLElement).click();
		await jest.advanceTimersByTimeAsync(PERSIST_DEBOUNCE_MS);
		const ctx2 = await render('ds-counter'); // adopted
		expect(ctx2.el.firstElementChild).toBe(root);
		const pencil = root.querySelector<HTMLElement>('.dse-btn[aria-label^="Edit "]'); // the counter's chrome-panel pencil (authoringAnchor.test.ts)
		expect(pencil).not.toBeNull();
		pencil!.click();
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][3]).toBe(bodyOf(app.vault.getContent('Note.md')!));
		expect(spy.mock.calls[0][3]).toContain('current_value: 11');
		spy.mockRestore();
		jest.useRealTimers();
	});
});
```
Move the `import * as FormModal …` line into the file's import block at the top.

- [ ] **Step 2: Run — expect both new tests to FAIL**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/kit/stepper.test.ts test/dom/framework/view-adoption.test.ts'
```

- [ ] **Step 3: Implement**

`src/framework/kit/stepper.ts` — replace `owner.registerDomEvent(el, 'blur', () => commitDraft());` with:

```ts
		// SC-340 §9.1: when the block is adopted after its own write, Obsidian takes the
		// section out of the document and a focused input blurs (B11) — then focus comes back.
		// That blur is not the user leaving the field: never commit a half-typed draft on it.
		owner.registerDomEvent(el, 'blur', () => {
			if (!el.isConnected) return;
			commitDraft();
		});
```

`src/framework/pipeline.ts` — inside `run()`, next to where `host` is in scope (before `mountPipelineChrome` is defined), add:

```ts
			// SC-340 §9.2: an adopted view outlives the pipeline run that captured `source`;
			// the form editor must start from the body on disk NOW (SC-343's lastKnownBody).
			const currentBody = (): string =>
				(host instanceof ReadingModeBlockHost ? host.lastKnownBody : null) ?? source;
```
and change BOTH `openFormEditor(view, cx, def, source, this.deps.validation)` calls to `openFormEditor(view, cx, def, currentBody(), this.deps.validation)`.

- [ ] **Step 4: Run — PASS; full jest, tsc, lint; commit**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run lint'
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && git add src/framework/kit/stepper.ts src/framework/pipeline.ts test && git commit -m "fix(framework): SC-340 — no draft commit on the adoption blur; form editor opens with the current body"
```
Also re-run the audit grep and paste its output in the report (spec §9.1 asks for it at build time):

```bash
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && grep -rnE "registerDomEvent\([^,]+, *'(change|blur|focusout)'|addEventListener\('(change|blur|focusout)'" src
```
Any handler on a control INSIDE a view root that commits on `change`/`blur`/`focusout` (other than stepper.ts, fixed above) gets the same `isConnected` guard in this task; handlers inside modals are exempt (modals are outside the root).

---

### Task 7: Turn adoption on (hidden `viewAdoption` kill switch)

**Files:**
- Modify: `src/model/Settings.ts` (optional `viewAdoption?: boolean` on `DSESettings`, NOT in `DEFAULT_SETTINGS`)
- Modify: `main.ts` (`{ viewAdoption: this.settings.viewAdoption !== false }`)
- Test: `test/dom/framework/view-adoption.test.ts` (append a kill-switch wiring test via `migrateSettings`)

**Interfaces:**
- Consumes: everything above.
- Produces: adoption ON by default; `"viewAdoption": false` in the vault's `data.json` + reload turns it off.

- [ ] **Step 1: Write the failing test** (append to `test/dom/framework/view-adoption.test.ts`; move the import to the top)

```ts
import { migrateSettings } from '@model/Settings';

describe('SC-340 §6.6: the hidden viewAdoption key', () => {
	test('absent -> on; explicit false -> off; never added to the saved settings by default', () => {
		expect(migrateSettings({}).viewAdoption !== false).toBe(true);
		expect(migrateSettings({ viewAdoption: false }).viewAdoption !== false).toBe(false);
		expect('viewAdoption' in migrateSettings({})).toBe(false);
	});
});
```

- [ ] **Step 2: Run tsc — expect FAIL** with `Property 'viewAdoption' does not exist on type 'DSESettings'` (jest alone would pass: `migrateSettings` copies unknown keys; the type is what is missing)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run tsc'
```

- [ ] **Step 3: Implement**

`src/model/Settings.ts`, in `interface DSESettings`:

```ts
	/** SC-340 §6.6 — hidden kill switch for view adoption (not in the Settings UI, not in
	 *  DEFAULT_SETTINGS). Absent = ON. `"viewAdoption": false` in data.json + reload turns
	 *  adoption off: every rebuild builds a fresh view, exactly the pre-SC-340 behaviour. */
	viewAdoption?: boolean;
```

`main.ts`:

```ts
        this.viewRegistry = registerFrameworkElements(this, frameworkV2, {
            viewAdoption: this.settings.viewAdoption !== false,
        });
```

- [ ] **Step 4: Full jest, tsc, lint; commit**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run lint'
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && git add src/model/Settings.ts main.ts test/dom/framework/view-adoption.test.ts && git commit -m "feat(framework): SC-340 — view adoption on by default (hidden viewAdoption kill switch)"
```

---

### Task 8: Real-Obsidian gate — the adoption scenarios; full battery; docs

**Files:**
- Modify: `visual-harness/obsidian-lifecycle.mjs` (append to `FIXTURES`, add helpers to `makeHarness`, append to `SCENARIOS`; update the header comment)
- Docs (superproject): `docs/superpowers/dse-overhaul/F1-element-framework-v2-spec.md`, `.claude/skills/dse-verify/SKILL.md`
- Docs (dse): `.repo-docs/architecture.md`, `.repo-docs/integration.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: SC-343's gate (`FIXTURES`, `SCENARIOS`, the `t` harness, the ok/FAIL/done protocol); the plugin's `viewRegistry` field (Task 2) with `liveEntries()`, `stats`, `enabled`.
- Produces: 13 more scenarios; the gate's expected final line becomes `OBSIDIAN-LIFECYCLE done: 18/18 ok, 0 failed`.

- [ ] **Step 1: Append fixtures** to `FIXTURES`:

```js
const HERO = (name) => [`  - name: "${name}"`, '    max_stamina: 30'];
const INIT = (name) => fence('ds-initiative', ['heroes:', ...HERO(name), 'enemy_groups: []', 'malice:', '  value: 1']);
Object.assign(FIXTURES, {
	'Lifecycle/tracker.md': `# tracker\n\nABOVE\n\n${fence('ds-initiative', [
		'heroes:', ...HERO('Alice Alpha'), ...HERO('Bob Beta'),
		'enemy_groups:', '  - name: "Goblin Squad"', '    is_squad: true', '    creatures:',
		'      - name: "Goblin"', '        max_stamina: 4', '        amount: 3', '        squad_role: minion',
		'        instances:', '          - id: 1', '            conditions: [bleeding, dazed, slowed]',
		'          - id: 2', '            conditions: [frightened, grabbed]', '          - id: 3', '            conditions: []',
		'      - name: "Goblin Captain"', '        max_stamina: 40', '        amount: 1', '        squad_role: captain',
		'malice:', '  value: 3',
	])}\n\nBELOW\n`,
	'Lifecycle/ogres.md': `# ogres\n\nABOVE\n\n${fence('ds-initiative', [
		'heroes:', ...HERO('Alice Alpha'), 'enemy_groups:', '  - name: "Ogres"', '    creatures:',
		'      - name: "Ogre"', '        max_stamina: 60', '        amount: 3', 'malice:', '  value: 3',
	])}\n\nBELOW\n`,
	'Lifecycle/B.md': `# B\n\nB-TOP\n\n${INIT('Embed Eve')}\n\nB-BOTTOM\n`,
	'Lifecycle/A.md': '# A\n\nA-TOP\n\n![[B]]\n\nA-BOTTOM\n',
	'Lifecycle/tall.md': `# tall\n\n${Array.from({ length: 30 }, (_, i) => `PRE filler ${i}.`).join('\n\n')}\n\n${fence('ds-initiative', ['heroes:', ...Array.from({ length: 25 }, (_, i) => HERO(`Hero ${String(i + 1).padStart(2, '0')}`)).flat(), 'enemy_groups: []', 'malice:', '  value: 1'])}\n\n${Array.from({ length: 30 }, (_, i) => `POST filler ${i}.`).join('\n\n')}\n`,
	'Lifecycle/party.md': `# party\n\n${fence('ds-party', ['members:', '  - name: Kira', '    level: 3', '    hero_ref: "```ds-counter\\nname: Nested\\ncurrent_value: 1\\nmax_value: 5\\nmin_value: 0\\n```"', 'party:', '  hero_tokens: 2'])}\n`,
	'Lifecycle/hoverhost.md': '# hover host\n\nSee [[counter]] here.\n',
});
```
(`fence`, `COUNTER`, `FIXTURES` are SC-343's. The integrity check treats lines outside fences; `A.md`'s `![[B]]` is one of them.)

- [ ] **Step 2: Add harness helpers** — inside the object `makeHarness` returns, add:

```js
		reg: `app.plugins.plugins['draw-steel-elements'].viewRegistry`,
		/** Live registry entries, optionally for one note: { path, docId, connected, loaded, el }. */
		async entries(rel) {
			return t.ev(`${t.reg}.liveEntries().filter((e) => ${JSON.stringify(rel ?? null)} === null || e.host.sourcePath === ${JSON.stringify(rel ?? null)}).map((e) => ({ path: e.host.sourcePath, docId: e.host.docId, connected: e.root.isConnected, loaded: !!e.view._loaded, el: e.root.getAttribute('data-dse-element') }))`);
		},
		/** Top-level DSE roots actually in the document. */
		rendered: () => t.ev(`Array.from(document.querySelectorAll('[data-dse-element]')).filter((r) => !r.parentElement.closest('[data-dse-element]')).length`),
		stats: () => t.ev(`Object.assign({}, ${t.reg}.stats)`),
		/** Tag the first connected root of `sel` in the given leaf; later `sameRoot` checks it. */
		async tag(sel, tagName, leafExpr = 'app.workspace.getMostRecentLeaf()') {
			const ok = await t.ev(`(() => { const r = Array.from((${leafExpr}).view.containerEl.querySelectorAll('${sel}')).find((x) => x.isConnected); if (!r) return false; r.__lcTag = '${tagName}'; return true; })()`);
			t.expect(ok, `no ${sel} to tag`);
		},
		sameRoot: (sel, tagName, leafExpr = 'app.workspace.getMostRecentLeaf()') =>
			t.ev(`Array.from((${leafExpr}).view.containerEl.querySelectorAll('${sel}')).some((x) => x.isConnected && x.__lcTag === '${tagName}')`),
		root: (sel, leafExpr = 'app.workspace.getMostRecentLeaf()') =>
			`Array.from((${leafExpr}).view.containerEl.querySelectorAll('${sel}')).find((x) => x.isConnected)`,
		/** ConditionsModal: pick the first menu condition not already on the list. */
		async pickCondition() {
			if (!(await t.ev(`!!document.querySelector('.dse-condal-modal .dse-condal__menu-item')`))) {
				await t.ev(`document.querySelector('.dse-condal-modal .dse-condal__add').click()`);
				await t.waitFor(`!!document.querySelector('.dse-condal-modal .dse-condal__menu-item')`, 'condition menu');
			}
			return t.ev(`(() => { const have = new Set(Array.from(document.querySelectorAll('.dse-condal-modal .dse-condal__row .dse-condal__name')).map((n) => n.textContent)); const it = Array.from(document.querySelectorAll('.dse-condal-modal .dse-condal__menu-item')).find((i) => !have.has(i.querySelector('.dse-condal__menu-name')?.textContent)); const name = it.querySelector('.dse-condal__menu-name')?.textContent; it.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 })); return name; })()`);
		},
		async key(k, code, vk) {
			await t.cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
			await t.cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
		},
```
Because `reg` is read inside other members through `t.reg`, keep `t` as the object's name (SC-343 declares `const t = { … }`).

- [ ] **Step 3: Append the scenarios** to `SCENARIOS`:

```js
const TRACKER = '[data-dse-element="initiative"]';
const conditionsModalOpen = (t) => t.ev(`!!document.querySelector('.dse-condal-modal')`);
SCENARIOS.push(
	{
		// Spec G-S1 (SC-331): the ConditionsModal stays open across 5 live writes; row follows.
		id: 'G-S1',
		async run(t) {
			const rel = 'Lifecycle/tracker.md';
			await t.open(rel);
			await t.reset(rel);
			await t.tag(TRACKER, 's1');
			const m = await t.mark();
			await t.ev(`${t.root(TRACKER)}.querySelectorAll('.dse-cond--add')[0].click()`);
			await t.waitFor(`!!document.querySelector('.dse-condal-modal')`, 'conditions modal');
			const steps = [];
			const probe = async (label, expectIcons) => {
				await t.sleep(900);
				const open = await conditionsModalOpen(t);
				const same = await t.sameRoot(TRACKER, 's1');
				const icons = await t.ev(`${t.root(TRACKER)}.querySelectorAll('.dse-init__conditions')[0].querySelectorAll('.dse-cond:not(.dse-cond--add)').length`);
				t.expect(open && same && icons === expectIcons, `${label}: modalOpen=${open} sameRoot=${same} icons=${icons} (want ${expectIcons})`);
				steps.push(label);
			};
			for (let i = 1; i <= 3; i++) {
				await t.pickCondition();
				await probe(`add#${i}`, i);
			}
			await t.ev(`document.querySelectorAll('.dse-condal-modal .dse-condal__row')[0].querySelector('.dse-condal__act:not(.dse-condal__act--delete)').click()`);
			await t.waitFor(`!!document.querySelector('.dse-condal-modal .dse-condal__editor')`, 'customize editor');
			await t.ev(`document.querySelector('.dse-condal-modal .dse-cond-icons__choice[aria-label="Icon: skull"]').click()`);
			await probe('icon=skull', 3);
			await t.ev(`document.querySelectorAll('.dse-condal-modal .dse-condal__row')[2].querySelector('.dse-condal__act--delete').click()`);
			await probe('delete#3', 2);
			const writes = await t.modsSince(m, rel);
			t.expect(writes === 5, `expected 5 writes, got ${writes}`);
			await t.ev(`document.querySelector('.dse-condal-modal .dse-modal__footer button').click()`);
			await t.sleep(600);
			t.expect(!(await conditionsModalOpen(t)), 'Done did not close the modal');
			t.expect(t.integrity(rel).ok, 'note integrity');
			// Done, then open the next combatant's modal 30..600 ms later (SC-331 MED-1)
			for (const gap of [30, 150, 300, 420, 600]) {
				await t.reset(rel);
				await t.ev(`${t.root(TRACKER)}.querySelectorAll('.dse-cond--add')[0].click()`);
				await t.waitFor(`!!document.querySelector('.dse-condal-modal')`, 'modal');
				await t.pickCondition();
				await t.sleep(150);
				await t.ev(`document.querySelector('.dse-condal-modal .dse-modal__footer button').click()`);
				await t.sleep(gap);
				await t.ev(`${t.root(TRACKER)}.querySelectorAll('.dse-cond--add')[1].click()`);
				await t.sleep(1300);
				t.expect(await conditionsModalOpen(t), `second modal closed at gap ${gap} ms`);
				await t.key('Escape', 'Escape', 27);
				await t.sleep(400);
			}
			// pool modal condition removal, grid and detail call sites
			for (const site of ['grid', 'detail']) {
				await t.reset(rel);
				await t.tag(TRACKER, `pool-${site}`);
				if (site === 'grid') await t.ev(`${t.root(TRACKER)}.querySelector('.dse-init__group--enemies .dse-init__cell').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))`);
				else await t.ev(`${t.root(TRACKER)}.querySelector('.dse-init__group--enemies .dse-init__detail .dse-init__stamina').click()`);
				await t.waitFor(`!!document.querySelector('.modal-container .dse-sedit__minions')`, 'pool modal');
				for (let i = 0; i < 2; i++) {
					await t.ev(`document.querySelector('.modal-container .dse-minion__conditions .condition-icon').click()`);
					await t.sleep(1100);
					t.expect(await t.ev(`!!document.querySelector('.modal-container .dse-sedit__minions')`), `pool modal (${site}) closed after removal ${i + 1}`);
				}
				t.expect(await t.sameRoot(TRACKER, `pool-${site}`), `pool (${site}): tracker root replaced`);
				await t.key('Escape', 'Escape', 27);
				await t.sleep(500);
			}
			await t.reset(rel);
			return `modal open across 5 writes; Done→reopen 5/5; pool 2 sites × 2 removals`;
		},
	},
	{
		// Spec G-S2 (SC-339): select a creature, open its stamina modal 150/380 ms later.
		id: 'G-S2',
		async run(t) {
			const rel = 'Lifecycle/ogres.md';
			await t.open(rel);
			for (const gap of [150, 380]) {
				await t.reset(rel);
				await t.ev(`${t.root(TRACKER)}.querySelectorAll('.dse-init__group--enemies .dse-init__cell')[1].click()`);
				await t.sleep(gap);
				await t.ev(`${t.root(TRACKER)}.querySelector('.dse-init__group--enemies .dse-init__detail .dse-init__stamina').click()`);
				await t.sleep(1500);
				t.expect(await t.ev(`!!document.querySelector('.modal-container .dse-modal')`), `stamina modal closed (gap ${gap})`);
				t.expect(/selectedInstanceKey: 0-2/.test(t.read(rel)), `selection write did not land (gap ${gap})`);
				await t.key('Escape', 'Escape', 27);
				await t.sleep(400);
			}
			await t.reset(rel);
			return 'stamina modal survives the selection write at 150 and 380 ms';
		},
	},
	{
		// Spec G-S3: type fast into the Malice label while an earlier click's write lands.
		id: 'G-S3',
		async run(t) {
			const rel = 'Lifecycle/ogres.md';
			await t.open(rel);
			await t.reset(rel);
			await t.tag(TRACKER, 's3');
			const text = 'abcdefghijklmnopqrstuvwxyz0123456789';
			await t.ev(`${t.root(TRACKER)}.querySelector('button.dse-init__portrait-toggle').click()`);
			await t.sleep(250);
			await t.ev(`${t.root(TRACKER)}.querySelector('input.dse-init__malice-quickadd-label').focus()`);
			for (const ch of text) {
				await t.cdp.call('Input.insertText', { text: ch });
				await t.sleep(6);
			}
			await t.sleep(400);
			const st = await t.ev(`(() => { const i = ${t.root(TRACKER)}.querySelector('input.dse-init__malice-quickadd-label'); return { value: i.value, active: document.activeElement === i, caret: i.selectionStart }; })()`);
			t.expect(await t.sameRoot(TRACKER, 's3'), 'tracker root replaced (not adopted)');
			t.expect(st.value === text, `typed text lost: "${st.value}"`);
			t.expect(st.active && st.caret === text.length, `focus/caret lost: ${JSON.stringify(st)}`);
			t.expect(/has_taken_turn: true/.test(t.read(rel)), 'the earlier click did not write');
			await t.reset(rel);
			return `0/${text.length} keystrokes lost; focus and caret kept`;
		},
	},
	{
		// Spec G-S4: pane + embed, then two panes — writer-only adoption; leaked copy refused.
		id: 'G-S4',
		async run(t) {
			const B = 'Lifecycle/B.md';
			await t.open('Lifecycle/A.md');
			await t.reset(B);
			await t.ev(`(async () => { const leaf = app.workspace.getLeaf('split', 'vertical'); window.__lcB = leaf; await leaf.setViewState({ type: 'markdown', state: { file: '${B}', mode: 'preview' }, active: true }); })()`);
			await t.sleep(1500);
			const leaked = (await t.entries(B)).filter((e) => !e.connected).length;
			const leafA = `app.workspace.getLeavesOfType('markdown').find((l) => l.view.file?.path === 'Lifecycle/A.md')`;
			const leafB = 'window.__lcB';
			for (const [writer, other] of [[leafB, leafA], [leafA, leafB], [leafB, leafA], [leafA, leafB]]) {
				await t.tag(TRACKER, 'w', writer);
				await t.tag(TRACKER, 'o', other);
				const m = await t.mark();
				await t.ev(`${t.root(TRACKER, writer)}.querySelector('button[aria-label="Advance round"]').click()`);
				await t.sleep(2500);
				t.expect(await t.sameRoot(TRACKER, 'w', writer), 'writer lost its view');
				t.expect(!(await t.sameRoot(TRACKER, 'o', other)), 'the other instance kept a stale view');
				t.expect((await t.modsSince(m, B)) === 1, 'not exactly one write');
				const round = (t.read(B).match(/round: (\d+)/) ?? [null, '1'])[1];
				const shown = await t.ev(`Array.from(document.querySelectorAll('${TRACKER} .dse-init__round-value')).filter((x) => x.isConnected).map((x) => x.textContent)`);
				t.expect(shown.every((s) => s === `Round ${round}`), `instances disagree: ${JSON.stringify(shown)} vs round ${round}`);
			}
			t.expect((await t.entries(B)).filter((e) => !e.connected).length === leaked, 'a leaked copy was adopted');
			// a leaked copy (if Obsidian left one) writing its stale model is refused, note unchanged
			if (leaked > 0) {
				const before = t.read(B);
				await t.ev(`(() => { const e = ${t.reg}.liveEntries().find((x) => x.host.sourcePath === '${B}' && !x.root.isConnected); e.view.advanceRound(); })()`);
				await t.sleep(1500);
				t.expect(t.read(B) === before, 'the leaked copy overwrote the note');
			}
			t.expect(t.integrity(B).ok, 'note integrity');
			await t.ev(`${leafB}.detach()`);
			await t.open(B);
			await t.reset(B);
			return `4 alternating writes: writer-only adoption, 1 write each; leaked copies=${leaked}, never claimed`;
		},
	},
	{
		// Spec G-S5: external edit and undo-like revert -> fresh view, old released.
		id: 'G-S5',
		async run(t) {
			const rel = 'Lifecycle/counter.md';
			await t.open(rel);
			await t.reset(rel);
			await t.tag('[data-dse-element="counter"]', 'c1');
			await t.edit(rel, `c.replace('current_value: 10', 'current_value: 12')`);
			await t.sleep(1500);
			t.expect(!(await t.sameRoot('[data-dse-element="counter"]', 'c1')), 'external edit was adopted');
			t.expect((await t.entries(rel)).length === 1, 'old view not released');
			const before = t.read(rel);
			await t.tag('[data-dse-element="counter"]', 'c2');
			await t.clickIncrease(0);
			await t.sleep(1500);
			t.expect(await t.sameRoot('[data-dse-element="counter"]', 'c2'), 'own write was not adopted');
			await t.ev(`(async () => { await app.vault.modify(app.vault.getAbstractFileByPath('${rel}'), ${JSON.stringify(before)}); })()`);
			await t.sleep(1500);
			t.expect(!(await t.sameRoot('[data-dse-element="counter"]', 'c2')), 'revert was adopted');
			t.expect((await t.entries(rel)).length === 1, 'old view not released after revert');
			await t.reset(rel);
			return 'external edit and revert rebuilt fresh; 1 live view';
		},
	},
	{
		// G-S6c: Reading -> Source -> Reading, with a pending write.
		id: 'G-S6c',
		async run(t) {
			const rel = 'Lifecycle/counter.md';
			await t.open(rel);
			await t.reset(rel);
			await t.tag('[data-dse-element="counter"]', 'src');
			await t.clickIncrease(0);
			await t.sleep(30);
			await t.ev(`(async () => { await app.workspace.getMostRecentLeaf().setViewState({ type: 'markdown', state: { file: '${rel}', mode: 'source' } }); })()`);
			await t.sleep(1500);
			t.expect(t.counterValues(rel)[0] === 11, 'pending write lost on Reading->Source');
			await t.ev(`(async () => { await app.workspace.getMostRecentLeaf().setViewState({ type: 'markdown', state: { file: '${rel}', mode: 'preview' } }); })()`);
			await t.sleep(1500);
			t.expect((await t.entries(rel)).length === 1, 'duplicate views after the toggle');
			await t.reset(rel);
			return 'write landed; 1 live view after Source and back';
		},
	},
	{
		// G-S6d: previewMode.rerender(true) -> fresh views, old ones released.
		id: 'G-S6d',
		async run(t) {
			const rel = 'Lifecycle/counter.md';
			await t.open(rel);
			await t.tag('[data-dse-element="counter"]', 'rr');
			await t.ev(`app.workspace.getMostRecentLeaf().view.previewMode.rerender(true)`);
			await t.sleep(1500);
			t.expect(!(await t.sameRoot('[data-dse-element="counter"]', 'rr')), 'rerender adopted');
			t.expect((await t.entries(rel)).length === 1, 'old view not released');
			return 'fresh view, 1 live';
		},
	},
	{
		// G-S6e: plugin disable with a pending write, then enable.
		id: 'G-S6e',
		async run(t) {
			const rel = 'Lifecycle/counter.md';
			await t.open(rel);
			await t.reset(rel);
			await t.clickIncrease(0);
			await t.sleep(30);
			await t.ev(`(async () => { await app.plugins.disablePlugin('draw-steel-elements'); })()`);
			await t.sleep(1500);
			t.expect(t.counterValues(rel)[0] === 11, 'pending write lost on plugin disable');
			await t.ev(`(async () => { await app.plugins.enablePlugin('draw-steel-elements'); })()`);
			await t.sleep(2500);
			await t.ev(PAGE_HELPERS);
			const live = (await t.entries()).filter((e) => e.connected).length;
			const rendered = await t.rendered();
			t.expect(live === rendered, `after re-enable: live views ${live} != rendered ${rendered}`);
			await t.reset(rel);
			return `write landed; re-enable live=${live}=rendered`;
		},
	},
	{
		// G-S6f: pending write in an embed, then the embedding leaf is detached.
		id: 'G-S6f',
		async run(t) {
			const B = 'Lifecycle/B.md';
			await t.reset(B);
			await t.ev(`(async () => { const leaf = app.workspace.getLeaf('split', 'vertical'); window.__lcA = leaf; await leaf.setViewState({ type: 'markdown', state: { file: 'Lifecycle/A.md', mode: 'preview' }, active: true }); })()`);
			await t.sleep(1800);
			await t.ev(`${t.root(TRACKER, 'window.__lcA')}.querySelector('button.dse-init__portrait-toggle').click()`);
			await t.sleep(30);
			await t.ev('window.__lcA.detach()');
			await t.sleep(1500);
			t.expect(/has_taken_turn: true/.test(t.read(B)), 'embed write lost on leaf detach');
			t.expect(t.integrity(B).ok, 'note integrity');
			await t.reset(B);
			return 'write landed in B';
		},
	},
	{
		// G-S6g: a hover popover of a DSE block renders read-only (spec §6.4 row, §6.5 item 4).
		id: 'G-S6g',
		async run(t) {
			await t.open('Lifecycle/hoverhost.md');
			await t.ev(`(() => { const a = app.workspace.getMostRecentLeaf().view.containerEl.querySelector('a.internal-link'); app.workspace.trigger('hover-link', { event: new MouseEvent('mouseover', { clientX: 400, clientY: 300 }), source: 'preview', hoverParent: app.workspace.getMostRecentLeaf().view, targetEl: a, linktext: 'counter', sourcePath: 'Lifecycle/hoverhost.md' }); })()`);
			await t.waitFor(`!!document.querySelector('.hover-popover [data-dse-element="counter"]')`, 'hover popover counter', 8000);
			const ro = await t.ev(`document.querySelector('.hover-popover [data-dse-element="counter"]').getAttribute('data-dse-readonly')`);
			t.expect(ro === 'true', `hover counter is writable (data-dse-readonly=${ro})`);
			await t.ev(`document.querySelectorAll('.hover-popover').forEach((p) => p.remove())`);
			return 'hover counter read-only';
		},
	},
	{
		// G-S6h: a nested ds-counter (party hero_ref) survives the party's adoption, read-only.
		id: 'G-S6h',
		async run(t) {
			const rel = 'Lifecycle/party.md';
			await t.open(rel);
			await t.reset(rel);
			const nested = '[data-dse-element="party"] [data-dse-element="counter"]';
			t.expect(await t.ev(`!!${t.root(nested)}`), 'nested counter did not render');
			await t.tag('[data-dse-element="party"]', 'party');
			await t.tag(nested, 'nested');
			await t.ev(`${t.root('[data-dse-element="party"]')}.querySelector('button[aria-label="Increase Hero tokens"]').click()`);
			await t.sleep(1500);
			t.expect(/hero_tokens: 3/.test(t.read(rel)), 'party write did not land');
			t.expect(await t.sameRoot('[data-dse-element="party"]', 'party'), 'party not adopted');
			t.expect(await t.sameRoot(nested, 'nested'), 'nested counter was torn down by the adoption');
			t.expect((await t.ev(`${t.root(nested)}.getAttribute('data-dse-readonly')`)) === 'true', 'nested counter writable');
			await t.reset(rel);
			return 'nested card kept and read-only';
		},
	},
	{
		// G-S6i: after everything, only other.md open -> no connected live views remain.
		id: 'G-S6i',
		async run(t) {
			await t.open('Lifecycle/other.md');
			await t.sleep(1000);
			const connected = (await t.entries()).filter((e) => e.connected).length;
			const rendered = await t.rendered();
			t.expect(connected === rendered, `live connected views ${connected} != rendered ${rendered}`);
			t.expect((await t.ev('document.querySelectorAll(".modal-container").length')) === 0, 'orphaned modal');
			return `live=${connected}=rendered; 0 modals`;
		},
	},
	{
		// Spec G-S8: tall scrolled tracker keeps scrollTop across its own write (pin on).
		id: 'G-S8',
		async run(t) {
			const rel = 'Lifecycle/tall.md';
			await t.open(rel);
			await t.reset(rel);
			await t.ev(`(() => { const s = app.workspace.getMostRecentLeaf().view.containerEl.querySelector('.markdown-preview-view'); const r = ${t.root(TRACKER)}; s.scrollTop = r.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop + 1500; })()`);
			await t.sleep(900);
			const samples = await t.ev(`new Promise((resolve) => { const s = app.workspace.getMostRecentLeaf().view.containerEl.querySelector('.markdown-preview-view'); const sr = s.getBoundingClientRect(); const b = Array.from(${t.root(TRACKER)}.querySelectorAll('button.dse-init__portrait-toggle')).find((x) => { const r = x.getBoundingClientRect(); return r.top > sr.top + 100 && r.bottom < sr.bottom - 100; }); const out = []; const t0 = performance.now(); const tick = () => { out.push(s.scrollTop); if (performance.now() - t0 < 2200) requestAnimationFrame(tick); else resolve(out); }; requestAnimationFrame(tick); b.click(); })`);
			const min = Math.min(...samples);
			const max = Math.max(...samples);
			t.expect(min === samples[0] && max === samples[0], `scrollTop moved: start ${samples[0]} min ${min} max ${max}`);
			t.expect(/has_taken_turn: true/.test(t.read(rel)), 'write did not land');
			await t.reset(rel);
			return `scrollTop held at ${samples[0]} over ${samples.length} frames`;
		},
	},
);
```
Move `const SCENARIOS = [...]` above these pushes if needed (the pushes must run before `main()`); `PAGE_HELPERS` is SC-343's constant. `t.clickIncrease`, `t.counterValues`, `t.integrity`, `t.reset`, `t.open`, `t.edit`, `t.modsSince`, `t.mark` are SC-343's.

- [ ] **Step 4: Measure the spec's hover assumption first, then run the full gate**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run build-no-check && node visual-harness/obsidian-lifecycle.mjs --only=G-S6g'
```
If `G-S6g` FAILS because a hover popover counter is writable, measure the same scenario against the pre-SC-340 build:

```bash
rm -rf /tmp/sc340-base && mkdir -p /tmp/sc340-base && cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && git archive origin/develop | tar -x -C /tmp/sc340-base && ln -s /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements/node_modules /tmp/sc340-base/node_modules
devbox run -- bash -c 'cd /tmp/sc340-base && npm run build-no-check'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && DSE_LIFECYCLE_BUNDLE=/tmp/sc340-base node visual-harness/obsidian-lifecycle.mjs --only=G-S6g'
```
If the base build is writable in hover too, the spec's "hover is read-only" assumption (§6.4 row, F1 §4.4) is false in Obsidian 1.14: STOP and report NEEDS_CONTEXT with both outputs — do not weaken the assertion. Remove `/tmp/sc340-base` afterwards.

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run obsidian-lifecycle'
```
Expected: 18 `ok` lines and `OBSIDIAN-LIFECYCLE done: 18/18 ok, 0 failed` (≈5 min; adoption is ON since Task 7).

Then prove the adoption scenarios discriminate, using the kill switch: temporarily change `main.ts` to `{ viewAdoption: false }`, run

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run build-no-check && node visual-harness/obsidian-lifecycle.mjs --only=G-S1,G-S2,G-S3'
```
expect all three to FAIL (modal closed / typed text lost), then `git checkout main.ts` and confirm `git status --porcelain` lists only `visual-harness/obsidian-lifecycle.mjs`. Record both outputs in the report.

- [ ] **Step 5: Full battery, in order**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run lint'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run obsidian-lifecycle'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js main.css styles.css && npm run shots'
devbox run -- bash -c 'bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements/visual-harness/shots'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && npm run parity'
```
Expected: tsc/lint clean; jest green (record the new total vs Task 0); lifecycle `done: 18/18 ok, 0 failed`; shots `0 FAIL`; freeze byte-identical; parity `0 GAPs / 0 undeclared / 16 DECLARED`.

- [ ] **Step 6: Docs** (spec §12):
  - F1 spec: under SC-343's amendment note add "> **Amended by SC-340** (spec `SC-340-view-adoption-spec.md`): reading-mode views are owned by the plugin-scoped `ViewRegistry` (§2.4 steps 4–6, §4.5); an echo rebuild of the view's own write ADOPTS the live view instead of building a fresh one (§2.4 step 5, §4.2 step 3 — view ≡ document still holds: a claim requires the new section's body to equal the body the view wrote); `ReadingModeBlockHost.rebind()` (§3.4)." and a one-line pointer at each of §2.4 step 4, §2.4 step 5, §3.4, §4.2 step 3, §4.5.
  - `.repo-docs/architecture.md`: add rows for `host/viewRegistry.ts` and `host/adoptView.ts`; update the `registerFrameworkElements.ts` row (claim → adopt; returns the registry) and the `host/ReadingModeBlockHost.ts` row (rebind, registry-owned view); add a short "Write → adopt → release" paragraph (write records a ticket before `Vault.process`; the new section's processor claims `(docId, path, body)` within 3000 ms and moves the root synchronously; the old render child's unload is then a no-op; the current render child's unload releases the view: flush, then unload; `viewAdoption: false` in data.json turns it off).
  - `.repo-docs/integration.md`: next to the sidebar self-echo note, one sentence: "Reading mode now adopts its own echo too (SC-340): the rebuild caused by a block's own write keeps the live view."
  - `CHANGELOG.md` (7.0.0 section): extend SC-343's `[INTERNAL]` bullet with a second sentence rather than adding a `[FIX]` (every symptom — SC-331, SC-339, SC-336, SC-198 — arose only in the unreleased 7.0.0 framework): "Reading-mode blocks now keep their live view across their own saves (SC-340): open dialogs, focus and typed text survive a write."
  - dse-verify skill: step 4 expected line becomes `OBSIDIAN-LIFECYCLE done: 18/18 ok, 0 failed` (~5 min); list the SC-340 scenario ids in the lifecycle paragraph; add a "Current expected numbers" entry (SC-340 landing) with Task 0 vs Step 4 numbers.

- [ ] **Step 7: Commit (dse, then superproject)**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && rm -f main.js main.css styles.css && git add visual-harness/obsidian-lifecycle.mjs .repo-docs/architecture.md .repo-docs/integration.md CHANGELOG.md && git commit -m "test(harness): SC-340 — lifecycle gate adoption scenarios; docs"
cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption && git add docs/superpowers/dse-overhaul/F1-element-framework-v2-spec.md .claude/skills/dse-verify/SKILL.md && git commit -m "docs(dse): SC-340 — F1 ownership/adoption amendment; dse-verify lifecycle gate 18 scenarios"
```
(Do not stage the submodule pointer — landing is the owner's step. After landing, SC-331, SC-339 and SC-336 close, and branch `sc331-condition-modal` @ `2cd5275` may be deleted — owner action, not this task.)

---


## Self-review (done at plan time)

- **Spec coverage:** §6.1 registry + invariant → T2 (spy test); §6.2 claim key, candidacy, window, ambiguity, synchronous move, focus → T4; collision guard → T5; §6.3 rebind → T3; §6.4 every unload path → T2 (jest) + T8 (`G-S6a/b` from SC-343, `G-S6c`–`i`, `G-S5`); §6.5 → consumed from SC-343; §6.6 kill switch → T2 (option) + T7 (key); §7 interfaces → T2/T3/T6/T7; §8 adopt failure → T4; §9.1 → T6; §9.2 → T6; §10.1 SC-331 → T4 (new pin + carry-overs; the deferral tests are simply never ported); §10.2 jest + SC-337 → T1, gate → T8; §11 order → T0–T8 (release merged into T2, gap 1; enable before the gate task so the gate runs on the real default); §12 docs → T8.
- **Placeholder scan:** code in every code step. Two instructions are conditional by design and state both branches: T1 Step 4 (which tests break is only knowable by running the corrected mock) and T8 Step 4 (the hover assumption).
- **Type consistency:** `ViewRegistry`, `ViewRegistryEntry`, `CLAIM_WINDOW_MS`, `own/noteWrite/claim/finishClaim/release`, `liveEntries`, `stats.{claims,misses,releases,ambiguous,collisions}`, `rebind`, `docId`, `attachEntry`, `registry`, `adoptView`, `captureFocus`, `restoreFocusWhenConnected`, and SC-343's `normalizeBody`, `setMountedBody`, `lastKnownBody`, `lastKnownLineStart`, `notePersistIntent` match across tasks and the SC-343 plan.
- **Review Focus:** each line has its test in the named task.
