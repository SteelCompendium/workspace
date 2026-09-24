# SC-343 — Stale-position write guard + durable block identity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A reading-mode block's write never lands in the wrong place: it is spliced at the section Obsidian reports only when that section still holds the body we last knew, otherwise the block is found again by that body (nearest its last known line), and a write that cannot be placed is dropped with a visible Obsidian Notice instead of corrupting the note — which also makes the flush after navigate-away land (SC-336).

**Architecture:** All write-path logic stays in `ReadingModeBlockHost` (`src/framework/host/ReadingModeBlockHost.ts`). It gains a durable identity (last known body, line, fence language, and whether its section ever resolved), a guarded write target inside `Vault.process`, and a body-based locate reusing `listFences` from `src/framework/sidebar/anchor.ts`. A small new module `droppedWriteNotice.ts` owns the rate-limited Notice. `ElementView.persist()` refreshes the position through a new optional `BlockHost.notePersistIntent?()`; `registerFrameworkElements` seeds the mount body. A new headless real-Obsidian gate (`npm run obsidian-lifecycle`) proves the behaviour in Obsidian 1.14.x and becomes dse-verify battery step 4.

**Tech Stack:** TypeScript (Obsidian plugin API), jest + jsdom with the in-repo obsidian mock (`test/mocks/obsidian-core.ts`), Node ≥ 22 (built-in `WebSocket`) + raw CDP for the real-Obsidian gate, Xvfb from the dse devbox package set.

**Spec:** `/home/scott/code/steelCompendium/worktrees/sc340-view-adoption/docs/superpowers/dse-overhaul/SC-340-view-adoption-spec.md` @ `2428179` (APPROVED) — this plan implements §6.5 items 1–5, §8 "Durable miss", §13 Q1/Q2. Decision ledgers: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc343-stale-write-guard/sc343-decisions.md` and `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-decisions.md`. Spike evidence (reference only — never paste its code, it was written against `e4bcd0f`): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc340-view-adoption/sc340-spike-r2-report.md`, `sc340-probe-r2.mjs`.

## Global Constraints

- Worktree: dse = `/home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements` (branch `sc343-stale-write-guard`, base dse `origin/develop` `0c132d8`); superproject = `/home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard` (branch `sc343-stale-write-guard`). Verify `pwd` before every write. NEVER write under `/home/scott/code/steelCompendium/workspace/draw-steel-elements`; workspace-level files (dse-verify skill, F1 spec) are edited in the worktree SUPERPROJECT, never under `/home/scott/code/steelCompendium/workspace/`.
- Every command through devbox with an absolute path: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && <cmd>'`. devbox eats `$?`/`$PIPESTATUS`: put the gate command LAST, no pipes after it, and read the tool's own summary line.
- `rm -f main.js styles.css` in the dse dir before EVERY jest run (a stale `main.js` shadows `main.ts` for jest — dse-verify "Stale main.js").
- Gates per `/home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/.claude/skills/dse-verify/SKILL.md`: tsc, lint, jest, shots, freeze, parity (+ the new `obsidian-lifecycle` once Task 5 creates it). Expected: 0 frozen bytes moved; parity `0 GAPs / 0 undeclared / 16 DECLARED`.
- Commit messages `feat|fix|test|docs(<area>): SC-343 — …`. **No `Co-Authored-By` or any AI-attribution line** (Scott's standing rule). Never push, merge, or tag; never tag or release draw-steel-elements. Landing is the owner's step.
- Real-Obsidian runs: headless Xvfb on a free display in `:160–:199`, own CDP port (default 9262), own `--user-data-dir` under a per-run temp dir, scratch COPY of `demo-vault/`; never display `:1`, never write the worktree's `demo-vault/`.
- Notice text, verbatim (spec §8/§13 Q2): `Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first.` where `<note>` is the note's file basename (no extension). At most one Notice per note (keyed by `sourcePath`) per **5000 ms**; a `console.warn` on EVERY dropped write.
- `canPersist` via durable identity ONLY for a host whose section **resolved at least once** (spec §6.5 item 4). Hover popovers, print/export, canvas (`sourcePath === ''`) and blocks nested in another view's `MarkdownRenderer.render` stay read-only for life.
- The persist-time position refresh (`BlockHost.notePersistIntent?()`) lands HERE, not in SC-340 (spec §13 Q1).
- Do not touch `src/framework/host/SidebarBlockHost.ts`, `previewScrollPin.ts`, or `test/mocks/obsidian-core.ts`'s Component unload order (that is SC-337, fixed inside SC-340).

## Review Focus

- **A note saved with CRLF line endings** (Windows sync): the body compare must treat `\r\n` and `\n` as equal, so writes to a CRLF note still take the section path and land — never a Notice. Pinned in Task 2 ("CRLF note").
- **A block whose opening fence is not at column 0** (inside a callout `> ```ds-counter`, a list item, or indented): exactly today's behaviour — no write, and **no Notice**, on every click. Pinned in Task 2 ("fence not at column 0").
- **An unterminated fence at the end of the note** (Obsidian extends the section to EOF): the write still lands and closes the fence, as today — the guard must not turn it into a Notice. Pinned in Task 2 ("unterminated at EOF").
- **Two blocks with byte-identical bodies** after lines above them shifted, flushed after navigate-away: the write lands in the block that was clicked, never its twin. Pinned in Task 2 (nearest-line jest) and Task 5 (`G-S7b`, real Obsidian).
- **Repeated dropped writes**: several misses on the same note inside 5 s show ONE Notice (but warn every time); a miss on a DIFFERENT note shows its own Notice at once. Pinned in Task 1.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/framework/host/droppedWriteNotice.ts` (new) | The dropped-write message, the per-note 5 s Notice rate limit, the console.warn | 1 |
| `src/framework/host/ReadingModeBlockHost.ts` | Durable identity, `readSection()`, `canPersist` rule, `setMountedBody`, `notePersistIntent`, guarded write target, body locate, Notice on a miss | 2, 3 |
| `src/framework/host/BlockHost.ts` | Optional `notePersistIntent?(): void` member + `canPersist` doc | 2 |
| `src/framework/view.ts` | `persist()` calls `cx.host.notePersistIntent?.()` | 4 |
| `src/framework/registerFrameworkElements.ts` | `host.setMountedBody(source)` before `pipeline.run` | 4 |
| `visual-harness/obsidian-lifecycle.mjs` (new) + `package.json` script `obsidian-lifecycle` | Real-Obsidian gate, SC-343 scenarios | 5 |
| `test/dom/framework/dropped-write-notice.test.ts` (new) | Task 1 tests | 1 |
| `test/dom/framework/reading-mode-host-durable.test.ts` (new) | Task 2/3 tests | 2, 3 |
| `test/dom/framework/element-view.test.ts`, `test/dom/framework/register-framework-elements.test.ts` | Task 4 tests | 4 |
| Superproject `docs/superpowers/dse-overhaul/F1-element-framework-v2-spec.md`, `.claude/skills/dse-verify/SKILL.md`; dse `.repo-docs/architecture.md`, `CHANGELOG.md` | Docs | 6 |

---

### Task 0: Baseline

**Files:** none modified.

**Interfaces:**
- Consumes: nothing.
- Produces: the baseline numbers every later task compares against (record them in your task report).

- [ ] **Step 1: Confirm the worktree and base**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && pwd && git branch --show-current && git log --oneline -1 && git status --porcelain
```
Expected: `…/sc343-stale-write-guard/draw-steel-elements`, branch `sc343-stale-write-guard`, HEAD `0c132d8`, empty status.

- [ ] **Step 2: Install dependencies** (the worktree has no `node_modules/`)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm ci'
```
Expected: ends with `added N packages`.

- [ ] **Step 3: Run the battery in order and record each summary line**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run lint'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run shots'
devbox run -- bash -c 'bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements/visual-harness/shots'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run parity'
```
Expected: tsc/lint clean; jest all green (record `Tests: N passed, 1 skipped` and suite count); shots `0 FAIL`; `freeze OK (…)`; parity `0 GAPs / 0 undeclared / 16 DECLARED`. If anything is red on the untouched base, STOP and report it (NEEDS_CONTEXT) — do not start Task 1.

- [ ] **Step 4: Leave the tree clean**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && git status --porcelain
```
Expected: empty (all generated outputs are gitignored). No commit for this task.

---

### Task 1: Dropped-write Notice (rate-limited)

**Files:**
- Create: `src/framework/host/droppedWriteNotice.ts`
- Test: `test/dom/framework/dropped-write-notice.test.ts`

**Interfaces:**
- Consumes: `Notice` from `obsidian` (mock: `test/mocks/obsidian-core.ts` `Notice.notices: string[]`).
- Produces (exact):
  - `export const DROPPED_WRITE_NOTICE_INTERVAL_MS = 5000;`
  - `export function droppedWriteMessage(noteName: string): string;`
  - `export function notifyDroppedWrite(sourcePath: string, noteName: string, now?: number): boolean;` — always `console.warn`s; returns `true` when a Notice was shown, `false` when rate-limited.
  - `export function resetDroppedWriteNotices(): void;` — test-only reset of the rate-limit memory.

- [ ] **Step 1: Write the failing test**

```ts
// test/dom/framework/dropped-write-notice.test.ts
// SC-343 (spec SC-340 §8 / §13 Q2): a write that cannot be placed is dropped with a
// visible Obsidian Notice — at most one per note per 5 s — plus a console.warn every time.
import {
	DROPPED_WRITE_NOTICE_INTERVAL_MS,
	droppedWriteMessage,
	notifyDroppedWrite,
	resetDroppedWriteNotices,
} from '../../../src/framework/host/droppedWriteNotice';
import { Notice } from '../../mocks/obsidian';

describe('SC-343: dropped-write Notice', () => {
	let warn: jest.SpyInstance;
	beforeEach(() => {
		resetDroppedWriteNotices();
		Notice.notices.length = 0;
		warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
	});
	afterEach(() => warn.mockRestore());

	test('the message is the approved text, verbatim, naming the note', () => {
		expect(droppedWriteMessage('Session 3')).toBe(
			'Draw Steel Elements: a change to a block in Session 3 was not saved — the block changed on disk first.',
		);
	});

	test('first miss on a note shows the Notice and warns', () => {
		expect(notifyDroppedWrite('Notes/Session 3.md', 'Session 3', 1_000)).toBe(true);
		expect(Notice.notices).toEqual([droppedWriteMessage('Session 3')]);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0][0])).toContain('Notes/Session 3.md');
	});

	test('a second miss on the SAME note inside 5 s shows no second Notice but still warns', () => {
		notifyDroppedWrite('A.md', 'A', 1_000);
		expect(notifyDroppedWrite('A.md', 'A', 1_000 + DROPPED_WRITE_NOTICE_INTERVAL_MS - 1)).toBe(false);
		expect(Notice.notices).toHaveLength(1);
		expect(warn).toHaveBeenCalledTimes(2);
	});

	test('a miss on the same note at exactly 5 s later shows a new Notice', () => {
		notifyDroppedWrite('A.md', 'A', 1_000);
		expect(notifyDroppedWrite('A.md', 'A', 1_000 + DROPPED_WRITE_NOTICE_INTERVAL_MS)).toBe(true);
		expect(Notice.notices).toHaveLength(2);
	});

	test('a miss on a DIFFERENT note shows its own Notice immediately', () => {
		notifyDroppedWrite('A.md', 'A', 1_000);
		expect(notifyDroppedWrite('B.md', 'B', 1_001)).toBe(true);
		expect(Notice.notices).toEqual([droppedWriteMessage('A'), droppedWriteMessage('B')]);
	});
});
```

- [ ] **Step 2: Run it — expect FAIL** (`Cannot find module '…/droppedWriteNotice'`)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/dropped-write-notice.test.ts'
```

- [ ] **Step 3: Implement**

```ts
// src/framework/host/droppedWriteNotice.ts
// SC-343 (spec SC-340 §8 "Durable miss", §13 Q2 — Scott: "Show the obsidian notice.").
//
// A pending write is DROPPED when its block changed or vanished on disk first (sync, a hand
// edit, or undo landing inside the ~400 ms persist debounce, or a stale leaked embed copy
// writing an old model). A dropped write is lost user data, so it is never silent: an
// Obsidian Notice (at most one per note per 5 s, so a burst of misses is one message) plus
// a console.warn on every drop for diagnosis.
import { Notice } from 'obsidian';

export const DROPPED_WRITE_NOTICE_INTERVAL_MS = 5000;

/** Approved text, verbatim (spec §8). `noteName` is the note's basename, no extension. */
export function droppedWriteMessage(noteName: string): string {
	return `Draw Steel Elements: a change to a block in ${noteName} was not saved — the block changed on disk first.`;
}

/** sourcePath -> time (ms) the last Notice for that note was shown. */
const lastShownAt = new Map<string, number>();

/**
 * Report one dropped write. Always warns; shows the Notice unless one was shown for the same
 * note less than DROPPED_WRITE_NOTICE_INTERVAL_MS ago. Returns whether a Notice was shown.
 */
export function notifyDroppedWrite(sourcePath: string, noteName: string, now: number = Date.now()): boolean {
	console.warn(
		`Draw Steel Elements: dropped a write to ${sourcePath} — the block was not found by its last known body.`,
	);
	const previous = lastShownAt.get(sourcePath);
	if (previous !== undefined && now - previous < DROPPED_WRITE_NOTICE_INTERVAL_MS) return false;
	lastShownAt.set(sourcePath, now);
	new Notice(droppedWriteMessage(noteName));
	return true;
}

/** Test-only: forget every note's last-shown time. */
export function resetDroppedWriteNotices(): void {
	lastShownAt.clear();
}
```

- [ ] **Step 4: Run it — expect PASS (5 tests)**, then lint the file

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/dropped-write-notice.test.ts'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run lint'
```
Expected: 5 passed; lint clean (the `obsidianmd/ui/sentence-case` rule already lists the "Draw Steel Elements" brand).

- [ ] **Step 5: Commit**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && git add src/framework/host/droppedWriteNotice.ts test/dom/framework/dropped-write-notice.test.ts && git commit -m "feat(framework): SC-343 — rate-limited Notice for a dropped block write"
```

---

### Task 2: Durable identity + `canPersist` rule + `notePersistIntent`

**Files:**
- Modify: `src/framework/host/ReadingModeBlockHost.ts` (class body; keep the file header comment and append the SC-343 paragraph below)
- Modify: `src/framework/host/BlockHost.ts` (add the optional member after `blockKey()`; extend the `canPersist` doc)
- Test: `test/dom/framework/reading-mode-host-durable.test.ts` (new)

**Interfaces:**
- Consumes: `listFences(content: string, alias: string): BlockInfo[]` from `src/framework/sidebar/anchor.ts` (fence lines inclusive; column-0 fences only; unterminated fences skipped); `MarkdownSectionInformation` type from `obsidian`.
- Produces (exact, used by Task 3, Task 4 and SC-340):
  - `BlockHost.notePersistIntent?(): void` — optional; "the view is about to schedule a write: refresh any cached position while it is still live".
  - `export function normalizeBody(body: string): string` — `\r\n`/`\r` → `\n`, trailing whitespace trimmed.
  - `export function locateByBody(content: string, language: string, body: string, nearLine: number): { lineStart: number; lineEnd: number } | null` — nearest match by `|lineStart − nearLine|`, ties to the earlier block.
  - On `ReadingModeBlockHost`: `setMountedBody(source: string): void`; `notePersistIntent(): void`; `get lastKnownBody(): string | null`; `get lastKnownLineStart(): number | null`; `canPersist` = section resolves now OR (section resolved at least once AND body, line and language are all known). `sourcePath === ''` is always `false`.
  - Private (Task 3 uses them): `readSection(): MarkdownSectionInformation | null` (records line + language + `sectionResolvedOnce` whenever the section resolves); `hasDurableIdentity: boolean`; fields `knownBody`, `knownLineStart`, `knownLanguage`, `sectionResolvedOnce`.

- [ ] **Step 1: Write the failing tests**

```ts
// test/dom/framework/reading-mode-host-durable.test.ts
// SC-343 (spec SC-340 §6.5): durable block identity for ReadingModeBlockHost.
import {
	ReadingModeBlockHost,
	locateByBody,
	normalizeBody,
} from '../../../src/framework/host/ReadingModeBlockHost';
import { App, Plugin, makeFakeContext } from '../../mocks/obsidian';
import type { MarkdownPostProcessorContext } from '../../mocks/obsidian';

/** A ctx whose getSectionInfo returns whatever `section.current` holds (null = gone). */
function switchableCtx(sourcePath: string, section: { current: { text: string; lineStart: number; lineEnd: number } | null }) {
	const ctx: MarkdownPostProcessorContext = {
		docId: 'doc-switchable',
		sourcePath,
		frontmatter: undefined,
		addChild: () => {},
		getSectionInfo: () => section.current,
	};
	return ctx;
}

const COUNTER = ['```ds-counter', 'name: A', 'current_value: 1', '```'].join('\n');

describe('SC-343: normalizeBody / locateByBody', () => {
	test('normalizeBody treats CRLF, CR and LF alike and trims trailing whitespace', () => {
		expect(normalizeBody('a: 1\r\nb: 2\r\n  \n')).toBe('a: 1\nb: 2');
		expect(normalizeBody('a: 1\rb: 2')).toBe('a: 1\nb: 2');
	});

	test('locateByBody picks the identical block NEAREST the last known line (ties to the earlier one)', () => {
		const note = ['top', COUNTER, 'mid', COUNTER, 'bottom'].join('\n');
		// fences: first at line 1 (1..4), second at line 6 (6..9)
		expect(locateByBody(note, 'ds-counter', 'name: A\ncurrent_value: 1', 7)).toEqual({ lineStart: 6, lineEnd: 9 });
		expect(locateByBody(note, 'ds-counter', 'name: A\ncurrent_value: 1', 2)).toEqual({ lineStart: 1, lineEnd: 4 });
		expect(locateByBody(note, 'ds-counter', 'name: A\ncurrent_value: 1', 3.5)).toEqual({ lineStart: 1, lineEnd: 4 });
	});

	test('locateByBody returns null when no block of that language has that body', () => {
		expect(locateByBody(COUNTER, 'ds-counter', 'name: B', 0)).toBeNull();
		expect(locateByBody(COUNTER, 'ds-stamina', 'name: A\ncurrent_value: 1', 0)).toBeNull();
	});
});

describe('SC-343: durable identity and canPersist', () => {
	test('a host whose section resolved once stays persistable after the section goes (navigate-away)', () => {
		const app = new App();
		app.vault.setFile('Note.md', COUNTER);
		const section = { current: { text: COUNTER, lineStart: 0, lineEnd: 3 } as { text: string; lineStart: number; lineEnd: number } | null };
		const host = new ReadingModeBlockHost(new Plugin(app) as any, document.createElement('div'), switchableCtx('Note.md', section) as any, 'ds-counter');
		host.setMountedBody('name: A\ncurrent_value: 1');

		section.current = null; // section replaced / note navigated away
		expect(host.canPersist).toBe(true);
		expect(host.lastKnownBody).toBe('name: A\ncurrent_value: 1');
		expect(host.lastKnownLineStart).toBe(0);
	});

	test('a host whose section NEVER resolved (hover popover / print / nested render) stays read-only even with a mount body', () => {
		const app = new App();
		app.vault.setFile('Note.md', COUNTER);
		const section = { current: null as { text: string; lineStart: number; lineEnd: number } | null };
		const host = new ReadingModeBlockHost(new Plugin(app) as any, document.createElement('div'), switchableCtx('Note.md', section) as any, 'ds-counter');
		host.setMountedBody('name: A\ncurrent_value: 1');

		expect(host.canPersist).toBe(false);
	});

	test('canvas (sourcePath "") is never persistable, whatever the identity', () => {
		const app = new App();
		const section = { current: { text: COUNTER, lineStart: 0, lineEnd: 3 } };
		const host = new ReadingModeBlockHost(new Plugin(app) as any, document.createElement('div'), switchableCtx('', section) as any, 'ds-counter');
		host.setMountedBody('name: A\ncurrent_value: 1');
		expect(host.canPersist).toBe(false);
	});

	test('a fence not at column 0 (callout) never forms a durable identity: read-only once its section is gone', () => {
		const app = new App();
		const text = ['> [!note]', '> ```ds-counter', '> name: A', '> ```'].join('\n');
		app.vault.setFile('Note.md', text);
		const section = { current: { text, lineStart: 0, lineEnd: 3 } as { text: string; lineStart: number; lineEnd: number } | null };
		const host = new ReadingModeBlockHost(new Plugin(app) as any, document.createElement('div'), switchableCtx('Note.md', section) as any, 'ds-counter');
		host.setMountedBody('name: A');
		expect(host.canPersist).toBe(true); // section resolves: unchanged from today
		section.current = null;
		expect(host.canPersist).toBe(false); // no language could be read -> no durable identity
	});

	test('notePersistIntent refreshes the last known line from the live section', () => {
		const app = new App();
		app.vault.setFile('Note.md', COUNTER);
		const ctx = makeFakeContext(app, 'Note.md');
		const host = new ReadingModeBlockHost(new Plugin(app) as any, ctx.el, ctx as any, 'ds-counter');
		expect(host.lastKnownLineStart).toBe(0);

		app.vault.setFile('Note.md', ['shift 1', 'shift 2', 'shift 3', COUNTER].join('\n'));
		host.notePersistIntent();
		expect(host.lastKnownLineStart).toBe(3);
	});
});
```

- [ ] **Step 2: Run — expect FAIL** (`locateByBody`/`normalizeBody`/`setMountedBody` not exported/defined)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/reading-mode-host-durable.test.ts'
```

- [ ] **Step 3: Implement — `BlockHost.ts`**

In `src/framework/host/BlockHost.ts`, append to the `canPersist` doc comment (after its last sentence, inside the same `/** … */`):

```ts
	 * SC-343: a reading-mode host whose section RESOLVED AT LEAST ONCE stays persistable
	 * after the section goes (e.g. the flush after navigate-away) through its durable
	 * identity; a host whose section never resolved stays read-only for life.
```

and add this member after `blockKey(): string;`:

```ts
	/**
	 * SC-343 (spec SC-340 §6.5 item 5) — optional. `ElementView.persist()` calls it just
	 * before scheduling a write, so a host that caches the block's position can refresh it
	 * while the section is still live (the write itself may run after the section is gone).
	 */
	notePersistIntent?(): void;
```

- [ ] **Step 4: Implement — `ReadingModeBlockHost.ts`**

Append this paragraph to the end of the file header comment (before the imports):

```ts
//
// SC-343 — durable identity + stale-position guard (spec SC-340 §6.5). The host remembers
// the body it last knew is on disk (mount source, then every successful write), the line it
// last saw the block at, and the fence language. Writes splice at getSectionInfo's range
// only when the LIVE content there still holds that body; otherwise the block is found again
// by its body, nearest the last known line (identical twins resolve by distance). A write
// that cannot be placed is dropped with a Notice (droppedWriteNotice.ts). A host whose
// section never resolved (hover, print, nested renders, canvas) never gets this identity.
```

Replace the import block's last import line and add:

```ts
import { MarkdownRenderChild, TFile } from 'obsidian';
import type { Component, MarkdownPostProcessorContext, MarkdownSectionInformation, Plugin } from 'obsidian';
import type { BlockHost, BlockInfo, RenderMode } from './BlockHost';
import type { PreviewScrollPin } from './previewScrollPin';
import { listFences } from '../sidebar/anchor';
```

(If the mock/`obsidian` types do not export `MarkdownSectionInformation`, use `NonNullable<ReturnType<MarkdownPostProcessorContext['getSectionInfo']>>` via a local `type SectionInfo = …` alias instead; the real `obsidian.d.ts` exports `MarkdownSectionInformation`.)

After `parseCloseFence`, add:

```ts
/** SC-343: bodies compare equal across CRLF/CR/LF and trailing whitespace. */
export function normalizeBody(body: string): string {
	return body.replace(/\r\n?/g, '\n').replace(/\s+$/, '');
}

/**
 * SC-343: find the `language` block whose body equals `body` in `content`, nearest
 * `nearLine` (ties go to the earlier block). Fence lines inclusive. Null when none matches.
 */
export function locateByBody(
	content: string,
	language: string,
	body: string,
	nearLine: number,
): { lineStart: number; lineEnd: number } | null {
	const wanted = normalizeBody(body);
	const lines = content.split('\n');
	let best: { lineStart: number; lineEnd: number } | null = null;
	let bestDistance = Infinity;
	for (const info of listFences(content, language)) {
		const candidate = normalizeBody(lines.slice(info.lineStart + 1, info.lineEnd).join('\n'));
		if (candidate !== wanted) continue;
		const distance = Math.abs(info.lineStart - nearLine);
		if (distance < bestDistance) {
			best = { lineStart: info.lineStart, lineEnd: info.lineEnd };
			bestDistance = distance;
		}
	}
	return best;
}
```

In the class, add the fields after `private readonly renderChild: MarkdownRenderChild;`:

```ts
	// -- SC-343 durable identity --------------------------------------------------------
	/** True once ctx.getSectionInfo(containerEl) has resolved at least once. */
	private sectionResolvedOnce = false;
	/** The body we last knew is on disk: the mount source, then every successful write. */
	private knownBody: string | null = null;
	/** The fence line the block was last seen at (refreshed on every resolving read). */
	private knownLineStart: number | null = null;
	/** The fence language read from the document (null until an opening fence parses). */
	private knownLanguage: string | null = null;
```

At the end of the constructor body add `this.readSection();`.

Add these members (anywhere in the class; keep `blockKey()` last):

```ts
	/** SC-343: every section read goes through here so the durable position stays fresh. */
	private readSection(): MarkdownSectionInformation | null {
		if (this.ctx.sourcePath === '') return null; // canvas: quarantined, see file header
		const section = this.ctx.getSectionInfo(this.containerEl);
		if (!section) return null;
		this.sectionResolvedOnce = true;
		this.knownLineStart = section.lineStart;
		const fence = parseOpenFence(section.text, section.lineStart);
		if (fence) this.knownLanguage = fence.language;
		return section;
	}

	/** SC-343: identity good enough to find the block again by its body. */
	private get hasDurableIdentity(): boolean {
		return (
			this.sectionResolvedOnce &&
			this.knownBody !== null &&
			this.knownLineStart !== null &&
			this.knownLanguage !== null
		);
	}

	/** SC-343: registerFrameworkElements seeds the body the view is built from. */
	setMountedBody(source: string): void {
		this.knownBody = source;
	}

	/** SC-343 (BlockHost.notePersistIntent): refresh the durable position while live. */
	notePersistIntent(): void {
		this.readSection();
	}

	get lastKnownBody(): string | null {
		return this.knownBody;
	}

	get lastKnownLineStart(): number | null {
		return this.knownLineStart;
	}
```

Replace `canPersist` and `getBlockInfo` with:

```ts
	get canPersist(): boolean {
		if (this.ctx.sourcePath === '') return false; // canvas: quarantined, see file header
		if (this.readSection() !== null) return true;
		return this.hasDurableIdentity; // SC-343: section gone, but it resolved once
	}

	getBlockInfo(): BlockInfo | null {
		const section = this.readSection();
		if (!section) return null;
		const fence = parseOpenFence(section.text, section.lineStart);
		return {
			language: fence?.language ?? this.alias,
			lineStart: section.lineStart,
			lineEnd: section.lineEnd,
		};
	}
```

Do NOT change `replaceSource` in this task.

- [ ] **Step 5: Run the new file and the existing host suite — expect PASS**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/reading-mode-host-durable.test.ts test/dom/framework/reading-mode-host.test.ts'
```
Expected: all pass (the existing 11 host tests are unchanged in behaviour).

- [ ] **Step 6: tsc + lint, then commit**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run lint'
cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && git add src/framework/host/ReadingModeBlockHost.ts src/framework/host/BlockHost.ts test/dom/framework/reading-mode-host-durable.test.ts && git commit -m "feat(framework): SC-343 — durable block identity and the resolved-once canPersist rule"
```

---

### Task 3: Guarded write target + durable locate + Notice on a miss

**Files:**
- Modify: `src/framework/host/ReadingModeBlockHost.ts` (`replaceSource` + a private `resolveWriteTarget`)
- Test: `test/dom/framework/reading-mode-host-durable.test.ts` (append a `describe`)

**Interfaces:**
- Consumes: Task 1 `notifyDroppedWrite(sourcePath, noteName)`; Task 2 `normalizeBody`, `locateByBody`, `readSection()`, `hasDurableIdentity`, `knownBody`, `knownLineStart`, `knownLanguage`.
- Produces: `replaceSource(newSource)` contract (SC-340 relies on it):
  - section resolves AND the live content has an opening fence at `lineStart`, a closing fence at `lineEnd` (or the section is an unterminated fence running to the last line), AND the body between equals `knownBody` (or `knownBody === null`) → splice there (unchanged output format).
  - otherwise, with a durable identity → `locateByBody(content, knownLanguage, knownBody, knownLineStart)`; found → splice there and set `knownLineStart`; not found → no write, resolve `false`, call `notifyDroppedWrite(sourcePath, file.basename)` AFTER `Vault.process` returns.
  - otherwise (no identity) → no write, resolve `false`, no Notice (today's abort).
  - every successful write sets `knownBody = newSource`.

- [ ] **Step 1: Write the failing tests** (append the `describe` to `reading-mode-host-durable.test.ts`; move the two `import` lines to the file's import block at the top)

```ts
import { Notice } from '../../mocks/obsidian';
import { droppedWriteMessage, resetDroppedWriteNotices } from '../../../src/framework/host/droppedWriteNotice';

describe('SC-343: guarded replaceSource', () => {
	let warn: jest.SpyInstance;
	beforeEach(() => {
		resetDroppedWriteNotices();
		Notice.notices.length = 0;
		warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
	});
	afterEach(() => warn.mockRestore());

	function hostFor(app: App, sourcePath: string, section: { current: { text: string; lineStart: number; lineEnd: number } | null }, body: string | null) {
		const host = new ReadingModeBlockHost(new Plugin(app) as any, document.createElement('div'), switchableCtx(sourcePath, section) as any, 'ds-counter');
		if (body !== null) host.setMountedBody(body);
		return host;
	}

	test('stale section range (a detached duplicate still reports old lines): never corrupts — relocates by body', async () => {
		const app = new App();
		// The block GREW since this host last saw it (lines 0..3); the stale range would cut it.
		const live = ['```ds-counter', 'name: A', 'current_value: 1', 'extra: yes', '```', '', 'After'].join('\n');
		app.vault.setFile('Note.md', live);
		const section = { current: { text: live, lineStart: 0, lineEnd: 3 } };
		const host = hostFor(app, 'Note.md', section, 'name: A\ncurrent_value: 1\nextra: yes');

		await expect(host.replaceSource('name: A\ncurrent_value: 2\nextra: yes')).resolves.toBe(true);
		expect(app.vault.getContent('Note.md')).toBe(
			['```ds-counter', 'name: A', 'current_value: 2', 'extra: yes', '```', '', 'After'].join('\n'),
		);
		expect(Notice.notices).toHaveLength(0);
	});

	test('stale model (body on disk is not what we last knew, block not found by body): dropped + ONE Notice, note unchanged', async () => {
		const app = new App();
		const live = ['```ds-counter', 'name: Vigor', 'current_value: 10', '```'].join('\n');
		app.vault.setFile('Folder/Session 3.md', live);
		const section = { current: { text: live, lineStart: 0, lineEnd: 3 } };
		const host = hostFor(app, 'Folder/Session 3.md', section, 'name: Health\ncurrent_value: 10');

		await expect(host.replaceSource('name: Health\ncurrent_value: 11')).resolves.toBe(false);
		expect(app.vault.getContent('Folder/Session 3.md')).toBe(live);
		expect(Notice.notices).toEqual([droppedWriteMessage('Session 3')]);
		expect(warn).toHaveBeenCalledTimes(1);
	});

	test('section gone (navigate-away flush): the write lands through the durable locate (SC-336)', async () => {
		const app = new App();
		const live = ['# N', '', '```ds-counter', 'name: A', 'current_value: 1', '```'].join('\n');
		app.vault.setFile('Note.md', live);
		const section = { current: { text: live, lineStart: 2, lineEnd: 5 } as { text: string; lineStart: number; lineEnd: number } | null };
		const host = hostFor(app, 'Note.md', section, 'name: A\ncurrent_value: 1');
		section.current = null;

		await expect(host.replaceSource('name: A\ncurrent_value: 2')).resolves.toBe(true);
		expect(app.vault.getContent('Note.md')).toContain('current_value: 2');
		expect(Notice.notices).toHaveLength(0);
	});

	test('identical twins, section gone after lines shifted: writes the twin nearest the refreshed position', async () => {
		const app = new App();
		const twin = ['```ds-counter', 'name: Twin', 'current_value: 5', '```'].join('\n');
		const before = ['TOP', twin, 'MID', twin, 'BOTTOM'].join('\n'); // lower twin at line 6
		app.vault.setFile('Note.md', before);
		const section = { current: { text: before, lineStart: 6, lineEnd: 9 } as { text: string; lineStart: number; lineEnd: number } | null };
		const host = hostFor(app, 'Note.md', section, 'name: Twin\ncurrent_value: 5');
		// 16 lines inserted above both twins; the live section follows (Obsidian E2)...
		const shifted = [...Array.from({ length: 16 }, (_, i) => `shift ${i}`), before].join('\n');
		app.vault.setFile('Note.md', shifted);
		section.current = { text: shifted, lineStart: 22, lineEnd: 25 };
		host.notePersistIntent(); // ...and persist() refreshes the durable position
		section.current = null; // then the note is navigated away before the flush

		await expect(host.replaceSource('name: Twin\ncurrent_value: 6')).resolves.toBe(true);
		const values = (app.vault.getContent('Note.md')!.match(/current_value: (\d+)/g) ?? []).map((s) => s.split(': ')[1]);
		expect(values).toEqual(['5', '6']); // the LOWER twin, never the upper one
	});

	test('CRLF note: the section path still matches the body and writes (no Notice)', async () => {
		const app = new App();
		const live = ['```ds-counter', 'name: A', 'current_value: 1', '```', ''].join('\r\n');
		app.vault.setFile('Note.md', live);
		const section = { current: { text: live, lineStart: 0, lineEnd: 3 } };
		const host = hostFor(app, 'Note.md', section, 'name: A\ncurrent_value: 1');

		await expect(host.replaceSource('name: A\ncurrent_value: 2')).resolves.toBe(true);
		expect(app.vault.getContent('Note.md')).toContain('current_value: 2');
		expect(Notice.notices).toHaveLength(0);
	});

	test('fence not at column 0 (callout): no write and NO Notice (unchanged from today)', async () => {
		const app = new App();
		const live = ['> [!note]', '> ```ds-counter', '> name: A', '> ```'].join('\n');
		app.vault.setFile('Note.md', live);
		const section = { current: { text: live, lineStart: 0, lineEnd: 3 } };
		const host = hostFor(app, 'Note.md', section, 'name: A');

		await expect(host.replaceSource('name: B')).resolves.toBe(false);
		expect(app.vault.getContent('Note.md')).toBe(live);
		expect(Notice.notices).toHaveLength(0);
	});

	test('unterminated fence at the end of the note: still writes and closes the fence (unchanged from today)', async () => {
		const app = new App();
		const live = ['Before', '', '```ds-counter', 'name: A', 'current_value: 1'].join('\n');
		app.vault.setFile('Note.md', live);
		const section = { current: { text: live, lineStart: 2, lineEnd: 4 } };
		const host = hostFor(app, 'Note.md', section, 'name: A\ncurrent_value: 1');

		await expect(host.replaceSource('name: A\ncurrent_value: 2')).resolves.toBe(true);
		expect(app.vault.getContent('Note.md')).toBe(['Before', '', '```ds-counter', 'name: A', 'current_value: 2', '```'].join('\n'));
		expect(Notice.notices).toHaveLength(0);
	});

	test('a successful write becomes the new known body (a second write finds it)', async () => {
		const app = new App();
		const live = ['```ds-counter', 'name: A', 'current_value: 1', '```'].join('\n');
		app.vault.setFile('Note.md', live);
		const section = { current: { text: live, lineStart: 0, lineEnd: 3 } as { text: string; lineStart: number; lineEnd: number } | null };
		const host = hostFor(app, 'Note.md', section, 'name: A\ncurrent_value: 1');
		await host.replaceSource('name: A\ncurrent_value: 2');
		expect(host.lastKnownBody).toBe('name: A\ncurrent_value: 2');
		section.current = null;
		await expect(host.replaceSource('name: A\ncurrent_value: 3')).resolves.toBe(true);
		expect(app.vault.getContent('Note.md')).toContain('current_value: 3');
	});
});
```

- [ ] **Step 2: Run — expect FAIL** (stale-range test corrupts/aborts; Notice not shown; navigate-away returns false)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/reading-mode-host-durable.test.ts'
```

- [ ] **Step 3: Implement.** Add the import `import { notifyDroppedWrite } from './droppedWriteNotice';` and replace `replaceSource` with:

```ts
	async replaceSource(newSource: string): Promise<boolean> {
		if (!this.canPersist) return false;

		const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
		if (!(abstractFile instanceof TFile)) return false;

		// Captured immediately before entering Vault.process, with nothing async in between.
		// SC-343: it is only a HINT now — resolveWriteTarget re-validates it against the live
		// content inside the callback and falls back to the durable locate when it is stale.
		const section = this.readSection();

		// SC-198: hold the preview's height across the rebuild this write is about to
		// provoke (only meaningful while the block is on screen, i.e. its section resolves).
		if (section) this.scrollPin?.pin(this.containerEl);

		let wrote = false;
		let dropped = false;
		await this.plugin.app.vault.process(abstractFile, (content) => {
			const target = this.resolveWriteTarget(content, section);
			if (target === 'abort') return content;
			if (target === 'miss') {
				dropped = true;
				return content;
			}
			const lines = content.split('\n');
			const openFence = parseOpenFence(content, target.lineStart);
			if (!openFence) return content; // resolveWriteTarget guarantees one; defensive
			const closeFence = parseCloseFence(lines[target.lineEnd]) ?? openFence.fence;
			const newBlockLines = [`${openFence.fence}${openFence.language}`, ...newSource.split('\n'), closeFence];
			lines.splice(target.lineStart, target.lineEnd - target.lineStart + 1, ...newBlockLines);
			wrote = true;
			return lines.join('\n');
		});
		if (wrote) this.knownBody = newSource;
		if (dropped) notifyDroppedWrite(this.ctx.sourcePath, abstractFile.basename);
		return wrote;
	}

	/**
	 * SC-343: where this write goes, decided from the LIVE content inside Vault.process.
	 *  - the section range, when it still holds our block (opening fence, closing fence or
	 *    an unterminated fence running to the last line, and the body we last knew);
	 *  - else, with a durable identity, the block found by that body nearest the last line;
	 *  - 'miss' when the identity exists but nothing matches (dropped + Notice);
	 *  - 'abort' when there is no identity at all (today's silent no-write).
	 */
	private resolveWriteTarget(
		content: string,
		section: MarkdownSectionInformation | null,
	): { lineStart: number; lineEnd: number } | 'abort' | 'miss' {
		if (section) {
			const lines = content.split('\n');
			const { lineStart, lineEnd } = section;
			const openOk = parseOpenFence(content, lineStart) !== null;
			const closeOk = parseCloseFence(lines[lineEnd]) !== null;
			const unterminatedAtEof = !closeOk && lineEnd === lines.length - 1;
			const bodyEnd = unterminatedAtEof ? lineEnd + 1 : lineEnd;
			const bodyOk =
				this.knownBody === null ||
				normalizeBody(lines.slice(lineStart + 1, bodyEnd).join('\n')) === normalizeBody(this.knownBody);
			if (openOk && (closeOk || unterminatedAtEof) && bodyOk) return { lineStart, lineEnd };
		}
		if (!this.hasDurableIdentity) return 'abort';
		const located = locateByBody(content, this.knownLanguage!, this.knownBody!, this.knownLineStart!);
		if (!located) return 'miss';
		this.knownLineStart = located.lineStart;
		return located;
	}
```

- [ ] **Step 4: Run the durable file AND the existing host/registration/sidebar suites — expect PASS**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/reading-mode-host-durable.test.ts test/dom/framework/reading-mode-host.test.ts test/dom/framework/register-framework-elements.test.ts test/dom/framework/registration.test.ts'
```
Expected: all pass. The existing "block vanished under us" test still resolves `false` with the note unchanged (no mount body → no identity → `'abort'`). If any existing test now shows a Notice or a changed write, STOP and report — do not edit the existing test.

- [ ] **Step 5: Full jest, tsc, lint; commit**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run lint'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest'
cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && git add src/framework/host/ReadingModeBlockHost.ts test/dom/framework/reading-mode-host-durable.test.ts && git commit -m "fix(framework): SC-343 — guard stale section ranges, locate blocks by body, Notice on a dropped write"
```
Expected jest: baseline count + 21 (Task 1: 5, Task 2: 8, Task 3: 8) — record the exact new total.

---

### Task 4: Wire the mount body and the persist-time refresh

**Files:**
- Modify: `src/framework/registerFrameworkElements.ts` (the processor lambda inside the `for` loops)
- Modify: `src/framework/view.ts` (`persist()`, right after the `canPersist` early return)
- Test: `test/dom/framework/register-framework-elements.test.ts`, `test/dom/framework/element-view.test.ts` (append one test each)

**Interfaces:**
- Consumes: Task 2 `ReadingModeBlockHost.setMountedBody(source)`, `BlockHost.notePersistIntent?()`.
- Produces: every production `ReadingModeBlockHost` has `lastKnownBody === source` before `pipeline.run`; `ElementView.persist()` calls `cx.host.notePersistIntent?.()` exactly once per call, after the `canPersist` check and before scheduling.

- [ ] **Step 1: Write the failing tests**

Append to `test/dom/framework/register-framework-elements.test.ts` (inside the top-level `describe`; reuse that file's `fakeDef`, `fakeRegistry`, `fakePipelineRun` helpers):

```ts
	test('SC-343: the host handed to pipeline.run already knows the mount body', async () => {
		const def = fakeDef({ id: 'c', aliases: ['ds-c'] });
		const run = fakePipelineRun();
		const pipeline = { run } as unknown as ElementPipeline;
		const app = new App();
		app.vault.setFile('Note.md', '```ds-c\nname: A\n```');
		const plugin = new Plugin(app);
		registerFrameworkElements(plugin as any, { registry: fakeRegistry([def]), pipeline });

		const ctx = makeFakeContext(app, 'Note.md');
		await plugin.registeredProcessors.get('ds-c')!('name: A', ctx.el, ctx as any);

		const host = run.mock.calls[0][2] as ReadingModeBlockHost;
		expect(host).toBeInstanceOf(ReadingModeBlockHost);
		expect(host.lastKnownBody).toBe('name: A');
	});
```

(If the mock's `registeredProcessors` map stores the handler under a different shape, read `test/mocks/obsidian-core.ts` `registerMarkdownCodeBlockProcessor` and call the stored handler the same way the file's existing tests do.)

Append to `test/dom/framework/element-view.test.ts` inside `describe('persist() (F1 §4.2)', …)`:

```ts
		test('SC-343: persist() asks the host to refresh its position before scheduling (and not when read-only)', async () => {
			const notePersistIntent = jest.fn();
			const host = makeHost({ notePersistIntent } as Partial<BlockHost>);
			const { cx } = makeContext(host);
			const view = new TestView(cx);
			await view.mount(document.createElement('div'), { value: 'x' });
			view.injectSerializer((m) => `value: ${m.value}`);

			void view.triggerPersist();
			expect(notePersistIntent).toHaveBeenCalledTimes(1);

			const readOnly = makeHost({ canPersist: false, notePersistIntent: jest.fn() } as Partial<BlockHost>);
			const ro = new TestView(makeContext(readOnly).cx);
			await ro.mount(document.createElement('div'), { value: 'x' });
			ro.injectSerializer((m) => `value: ${m.value}`);
			await ro.triggerPersist();
			expect(readOnly.notePersistIntent).not.toHaveBeenCalled();
		});
```

- [ ] **Step 2: Run both files — expect the two new tests to FAIL**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/register-framework-elements.test.ts test/dom/framework/element-view.test.ts'
```

- [ ] **Step 3: Implement**

`src/framework/registerFrameworkElements.ts` — replace the processor lambda with:

```ts
				(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
					const host = new ReadingModeBlockHost(plugin, el, ctx, alias, scrollPin);
					// SC-343: the durable identity starts from the body this view is built from.
					host.setMountedBody(source);
					return framework.pipeline.run(def, source, host);
				},
```

`src/framework/view.ts` — in `persist()`, directly after `if (!this.cx.host.canPersist) return Promise.resolve(false);` add:

```ts
		// SC-343 (spec SC-340 §6.5 item 5): let the host refresh its durable position while
		// the section is still live — the write runs ~400 ms later, possibly after the note
		// was navigated away, when only that remembered position can pick the right block.
		this.cx.host.notePersistIntent?.();
```

- [ ] **Step 4: Run both files — expect PASS; then full jest, tsc, lint**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest test/dom/framework/register-framework-elements.test.ts test/dom/framework/element-view.test.ts'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run lint'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest'
```
Expected jest: baseline + 23, all green.

- [ ] **Step 5: Commit**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && git add src/framework/registerFrameworkElements.ts src/framework/view.ts test/dom/framework/register-framework-elements.test.ts test/dom/framework/element-view.test.ts && git commit -m "feat(framework): SC-343 — seed the mount body and refresh the block position at persist()"
```

---

### Task 5: The real-Obsidian lifecycle gate (`npm run obsidian-lifecycle`)

**Gate decision (owner brief, "preferred shape"): SC-343 CREATES the gate** with the scenarios SC-343 alone can pass; SC-340 appends its adoption scenarios to the same `SCENARIOS` array. Reason: the infrastructure (Xvfb, CDP, scratch vault, pass-line protocol) is scenario-independent and ~70% of the script; SC-343's own claims (twins, navigate-away flush, Notice on a miss) need real Obsidian to prove, because jest cannot reproduce Obsidian's section rebuild and unload timing. The leaked-embed-copy scenario is NOT in SC-343's gate: on base, a detached copy is reachable only through SC-340's view registry — its stale-range write is pinned in jest instead (Task 3, first test).

**Files:**
- Create: `visual-harness/obsidian-lifecycle.mjs`
- Modify: `package.json` (`scripts`: add `"obsidian-lifecycle": "npm run build-no-check && node visual-harness/obsidian-lifecycle.mjs"`, after `obsidian-shots`)

**Interfaces:**
- Consumes: the built plugin (`main.js`, `styles.css`, `manifest.json` in the dse root, produced by `build-no-check`); `/usr/bin/obsidian` (override `DSE_LIFECYCLE_BIN`); the newest `obsidian-*.asar` in `~/.config/obsidian` (copied read-only into the scratch user-data-dir); Xvfb (env `XVFB_BIN`, PATH, or `<dse>/.devbox/nix/profile/default/bin/Xvfb`).
- Produces (SC-340 extends these exactly):
  - `const FIXTURES = { '<vault-relative path>': '<note text>', … }` — written into the scratch vault before launch.
  - `const SCENARIOS = [{ id: string, run: async (t) => string }]` — `run` returns the text inside the ok line's parentheses; it throws (via `t.expect`) on failure.
  - the harness object `t` with: `ev(expr)`, `waitFor(expr, what, timeoutMs?)`, `sleep(ms)`, `open(rel, leafExpr?)`, `reset(rel)`, `read(rel)`, `edit(rel, fnBodyExpr)`, `integrity(rel)`, `modsSince(mark, rel?)`, `mark()`, `notices()`, `errorsSince(mark)`, `expect(cond, message)`, `shot(name)`, `counterValues(rel)`.
  - stdout lines: `OBSIDIAN-LIFECYCLE <id> ok (<summary>)` / `OBSIDIAN-LIFECYCLE <id> FAIL: <message>` and the final `OBSIDIAN-LIFECYCLE done: <ok>/<total> ok, <failed> failed`; exit 0 only when 0 failed; exit 2 on environment problems (no Xvfb, no Obsidian, port busy, no asar, no build).
  - flags: `--only=<id,id>`; env `DSE_LIFECYCLE_BUNDLE=<dir>` (built plugin taken from another dir).

- [ ] **Step 1: Create `visual-harness/obsidian-lifecycle.mjs`**

```js
#!/usr/bin/env node
// visual-harness/obsidian-lifecycle.mjs — SC-343 (spec SC-340 §10.2, Scott's ruling 4):
// the headless real-Obsidian gate for the block WRITE LIFECYCLE — what jest cannot see,
// because only real Obsidian re-draws a section after a write and unloads the old one.
//
// Launches an isolated Obsidian (own Xvfb display :160–:199, own CDP port, own
// --user-data-dir, SCRATCH copy of demo-vault with the FIXTURES below), attaches over raw
// CDP (Node >= 22 built-in WebSocket — see obsidian-camera.mjs for why not Playwright),
// runs SCENARIOS in order, prints one ok/FAIL line per scenario and a final done line.
// Exit 0 = every scenario ok; 1 = a scenario failed; 2 = the environment is unusable.
//
// SC-343 scenarios: identical twin blocks (section path and durable path), the flush after
// navigate-away (SC-336) and after leaf close, and the Notice on a dropped write.
// SC-340 appends its view-adoption scenarios to FIXTURES/SCENARIOS.
//
// Usage: npm run obsidian-lifecycle   (builds the plugin first)
//        node visual-harness/obsidian-lifecycle.mjs [--only=G-S7a,G-S6a]
// Env:   XVFB_BIN, DSE_LIFECYCLE_BIN (default /usr/bin/obsidian), DSE_LIFECYCLE_PORT (9262),
//        DSE_LIFECYCLE_BUNDLE (dir holding main.js/styles.css/manifest.json; default: this repo)
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.dirname(dir);
const BIN = process.env.DSE_LIFECYCLE_BIN ?? '/usr/bin/obsidian';
const PORT = Number(process.env.DSE_LIFECYCLE_PORT ?? 9262);
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'dse-obsidian-lifecycle-'));
const vault = path.join(work, 'vault');
const udd = path.join(work, 'udd');
const shotsDir = path.join(work, 'shots');
const VAULT_ID = 'dselifecycle0001';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const envFail = (msg) => {
	console.log(`OBSIDIAN-LIFECYCLE environment: ${msg}`);
	process.exit(2);
};

// ------------------------------------------------------------------------- fixtures
const fence = (lang, lines) => ['```' + lang, ...lines, '```'].join('\n');
const COUNTER = (value = 10, name = 'Health') =>
	fence('ds-counter', [`name: ${name}`, `current_value: ${value}`, 'max_value: 20', 'min_value: 0']);

const FIXTURES = {
	'Lifecycle/twins.md': `# twins\n\nTOP\n\n${COUNTER(5, 'Twin')}\n\nMID\n\n${COUNTER(5, 'Twin')}\n\nBOTTOM\n`,
	'Lifecycle/counter.md': `# counter\n\nABOVE\n\n${COUNTER(10)}\n\nBELOW\n`,
	'Lifecycle/other.md': '# other\n\nJust another note.\n',
};

// ------------------------------------------------------------------ note integrity
/** Every fence closed, the block count unchanged, no stray text outside fences. */
function scanOutside(text) {
	let inFence = false;
	let opens = 0;
	const outside = [];
	for (const line of text.split('\n')) {
		if (/^```/.test(line)) {
			if (!inFence) {
				inFence = true;
				opens++;
			} else if (line.trim() === '```') inFence = false;
			continue;
		}
		if (!inFence && line.trim()) outside.push(line);
	}
	return { inFence, opens, outside };
}

// --------------------------------------------------------------------- Xvfb / CDP
/** Xvfb, in preference order: explicit env, PATH, this repo's devbox profile (as docs-shots.mjs). */
function resolveXvfb() {
	if (process.env.XVFB_BIN && fs.existsSync(process.env.XVFB_BIN)) return process.env.XVFB_BIN;
	const onPath = spawnSync('which', ['Xvfb'], { encoding: 'utf8' });
	if (onPath.status === 0 && onPath.stdout.trim()) return onPath.stdout.trim();
	const devboxBin = path.join(repo, '.devbox', 'nix', 'profile', 'default', 'bin', 'Xvfb');
	if (fs.existsSync(devboxBin)) return devboxBin;
	const install = spawnSync('devbox', ['install'], { cwd: repo, stdio: 'inherit' });
	if (install.status === 0 && fs.existsSync(devboxBin)) return devboxBin;
	return null;
}
async function startXvfb() {
	const bin = resolveXvfb();
	if (!bin) envFail('Xvfb not found (set XVFB_BIN or run `devbox install` in draw-steel-elements)');
	let num = -1;
	for (let n = 160; n < 200; n++) {
		if (!fs.existsSync(`/tmp/.X11-unix/X${n}`) && !fs.existsSync(`/tmp/.X${n}-lock`)) {
			num = n;
			break;
		}
	}
	if (num < 0) envFail('no free X display in :160–:199');
	const child = spawn(bin, [`:${num}`, '-screen', '0', '1600x1200x24', '-nolisten', 'tcp'], { stdio: 'ignore' });
	child.on('error', () => {});
	for (let i = 0; i < 40; i++) {
		if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) return { child, display: `:${num}` };
		await sleep(250);
	}
	envFail(`Xvfb did not start on :${num}`);
}
class Cdp {
	constructor(ws) {
		this.ws = ws;
		this.id = 0;
		this.pending = new Map();
		ws.onmessage = (e) => {
			const m = JSON.parse(e.data);
			if (m.id === undefined) return;
			const p = this.pending.get(m.id);
			if (!p) return;
			this.pending.delete(m.id);
			if (m.error) p.reject(new Error(`${p.method}: ${m.error.message}`));
			else p.resolve(m.result);
		};
	}
	static async connect(url) {
		const ws = new WebSocket(url);
		await new Promise((res, rej) => {
			ws.onopen = res;
			ws.onerror = () => rej(new Error('CDP websocket failed'));
		});
		return new Cdp(ws);
	}
	call(method, params = {}) {
		const id = ++this.id;
		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject, method });
			this.ws.send(JSON.stringify({ id, method, params }));
		});
	}
}

// ----------------------------------------------------------------- page helpers
const PAGE_HELPERS = `(() => {
  if (window.__lc) return true;
  const lc = window.__lc = { mods: [], notices: [], errs: [], n: 0 };
  app.vault.on('modify', (f) => lc.mods.push({ n: ++lc.n, path: f.path }));
  new MutationObserver((records) => {
    for (const r of records) for (const node of r.addedNodes) {
      if (node.nodeType !== 1) continue;
      const els = node.classList.contains('notice') ? [node] : Array.from(node.querySelectorAll('.notice'));
      for (const el of els) lc.notices.push({ n: ++lc.n, text: el.textContent });
    }
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('error', (e) => lc.errs.push({ n: ++lc.n, text: String(e.message) }));
  window.addEventListener('unhandledrejection', (e) => lc.errs.push({ n: ++lc.n, text: 'rejection: ' + String(e.reason && (e.reason.stack || e.reason)) }));
  const origError = console.error.bind(console);
  console.error = (...a) => { lc.errs.push({ n: ++lc.n, text: 'console.error: ' + a.map((x) => (x && x.stack) || String(x)).join(' ') }); origError(...a); };
  return true;
})()`;

function makeHarness(cdp) {
	const t = {
		cdp,
		sleep,
		async ev(expr) {
			const r = await cdp.call('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
			if (r.exceptionDetails) throw new Error(`page eval failed: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
			return r.result?.value;
		},
		async waitFor(expr, what, timeoutMs = 15000) {
			const t0 = Date.now();
			for (;;) {
				if (await t.ev(expr)) return;
				if (Date.now() - t0 > timeoutMs) throw new Error(`timed out waiting for ${what}`);
				await sleep(80);
			}
		},
		async open(rel, leafExpr = 'app.workspace.getMostRecentLeaf()') {
			await t.ev(`(async () => { const leaf = ${leafExpr}; await leaf.setViewState({ type: 'markdown', state: { file: ${JSON.stringify(rel)}, mode: 'preview' }, active: true }); })()`);
			await t.waitFor(`(${leafExpr})?.view?.file?.path === ${JSON.stringify(rel)}`, `open ${rel}`);
			await sleep(700);
		},
		async reset(rel) {
			await t.ev(`(async () => { await app.vault.modify(app.vault.getAbstractFileByPath(${JSON.stringify(rel)}), ${JSON.stringify(FIXTURES[rel])}); })()`);
			await sleep(1000);
		},
		read: (rel) => fs.readFileSync(path.join(vault, rel), 'utf8'),
		async edit(rel, fnBodyExpr) {
			await t.ev(`(async () => { await app.vault.process(app.vault.getAbstractFileByPath(${JSON.stringify(rel)}), (c) => ${fnBodyExpr}); })()`);
		},
		integrity(rel) {
			const now = scanOutside(t.read(rel));
			const orig = scanOutside(FIXTURES[rel]);
			const allowed = new Set(orig.outside);
			const stray = now.outside.filter((l) => !allowed.has(l) && !/^shift \d+$/.test(l));
			return { ok: !now.inFence && now.opens === orig.opens && stray.length === 0, blocks: now.opens, stray: stray.slice(0, 3) };
		},
		counterValues: (rel) => (t.read(rel).match(/current_value: (\d+)/g) ?? []).map((s) => Number(s.split(': ')[1])),
		mark: () => t.ev('window.__lc.n'),
		modsSince: async (mark, rel) => t.ev(`__lc.mods.filter((m) => m.n > ${mark} && (${JSON.stringify(rel ?? null)} === null || m.path === ${JSON.stringify(rel ?? null)})).length`),
		notices: () => t.ev('__lc.notices.map((x) => x.text)'),
		noticesSince: (mark) => t.ev(`__lc.notices.filter((x) => x.n > ${mark}).map((x) => x.text)`),
		errorsSince: (mark) => t.ev(`__lc.errs.filter((x) => x.n > ${mark}).map((x) => x.text)`),
		expect(cond, message) {
			if (!cond) throw new Error(message);
		},
		async shot(name) {
			const r = await cdp.call('Page.captureScreenshot', { format: 'png' });
			fs.mkdirSync(shotsDir, { recursive: true });
			const f = path.join(shotsDir, `${name}.png`);
			fs.writeFileSync(f, Buffer.from(r.data, 'base64'));
			return f;
		},
		/** Click `Increase …` on the index-th counter root of the given leaf. */
		async clickIncrease(index, leafExpr = 'app.workspace.getMostRecentLeaf()') {
			const ok = await t.ev(`(() => { const roots = Array.from((${leafExpr}).view.containerEl.querySelectorAll('[data-dse-element="counter"]')).filter((r) => r.isConnected); const b = roots[${index}]?.querySelector('button[aria-label^="Increase"]'); if (!b) return false; b.click(); return true; })()`);
			t.expect(ok, `no Increase button on counter #${index}`);
		},
	};
	return t;
}

// ------------------------------------------------------------------------ scenarios
const NOTICE_TEXT = (note) =>
	`Draw Steel Elements: a change to a block in ${note} was not saved — the block changed on disk first.`;

const SCENARIOS = [
	{
		// SC-343: identical twins, 4 lines inserted above — the SECTION path writes the right twin.
		id: 'G-S7a',
		async run(t) {
			const rel = 'Lifecycle/twins.md';
			await t.open(rel);
			await t.reset(rel);
			await t.edit(rel, `c.replace('TOP', 'TOP\\n\\nshift 1\\n\\nshift 2')`);
			await t.sleep(1200);
			const m = await t.mark();
			await t.clickIncrease(1);
			await t.sleep(1500);
			const values = t.counterValues(rel);
			t.expect(JSON.stringify(values) === '[5,6]', `expected [5,6], got ${JSON.stringify(values)}`);
			t.expect(t.integrity(rel).ok, `note integrity: ${JSON.stringify(t.integrity(rel))}`);
			t.expect((await t.noticesSince(m)).length === 0, 'unexpected Notice');
			return `values=[5,6], writes=${await t.modsSince(m, rel)}`;
		},
	},
	{
		// SC-343: twins identical, +16 lines above, click the lower twin, navigate away 30 ms later:
		// the flush runs with the section gone and must pick the lower twin by position.
		id: 'G-S7b',
		async run(t) {
			const rel = 'Lifecycle/twins.md';
			await t.open(rel);
			await t.reset(rel);
			const add = Array.from({ length: 8 }, (_, i) => `\\n\\nshift ${i}`).join('');
			await t.edit(rel, `c.replace('TOP', 'TOP${add}')`);
			await t.sleep(1200);
			const m = await t.mark();
			await t.clickIncrease(1);
			await t.sleep(30);
			await t.open('Lifecycle/other.md');
			await t.sleep(1500);
			const values = t.counterValues(rel);
			t.expect(JSON.stringify(values) === '[5,6]', `expected [5,6] (lower twin), got ${JSON.stringify(values)}`);
			t.expect(t.integrity(rel).ok, 'note integrity');
			t.expect(t.read('Lifecycle/other.md') === FIXTURES['Lifecycle/other.md'], 'other.md was written');
			t.expect((await t.noticesSince(m)).length === 0, 'unexpected Notice');
			return 'values=[5,6] via durable locate';
		},
	},
	{
		// SC-336: a click, then navigate away in the same leaf 30 ms later — the edit lands.
		id: 'G-S6a',
		async run(t) {
			const rel = 'Lifecycle/counter.md';
			await t.open(rel);
			await t.reset(rel);
			const m = await t.mark();
			await t.clickIncrease(0);
			await t.sleep(30);
			await t.open('Lifecycle/other.md');
			await t.sleep(1500);
			t.expect(t.counterValues(rel)[0] === 11, `expected 11, got ${t.counterValues(rel)[0]}`);
			t.expect(t.integrity(rel).ok, 'note integrity');
			t.expect(t.read('Lifecycle/other.md') === FIXTURES['Lifecycle/other.md'], 'other.md was written');
			t.expect((await t.errorsSince(m)).length === 0, `errors: ${JSON.stringify(await t.errorsSince(m))}`);
			return 'current_value=11 after navigate-away';
		},
	},
	{
		// A click, then the leaf is closed 30 ms later — the edit lands.
		id: 'G-S6b',
		async run(t) {
			const rel = 'Lifecycle/counter.md';
			await t.open(rel);
			await t.reset(rel);
			await t.ev(`(async () => { const leaf = app.workspace.getLeaf('split', 'vertical'); window.__lcLeaf = leaf; await leaf.setViewState({ type: 'markdown', state: { file: '${rel}', mode: 'preview' }, active: true }); })()`);
			await t.sleep(1200);
			const m = await t.mark();
			await t.clickIncrease(0, 'window.__lcLeaf');
			await t.sleep(30);
			await t.ev('window.__lcLeaf.detach()');
			await t.sleep(1500);
			t.expect(t.counterValues(rel)[0] === 11, `expected 11, got ${t.counterValues(rel)[0]}`);
			t.expect(t.integrity(rel).ok, 'note integrity');
			t.expect((await t.errorsSince(m)).length === 0, 'errors');
			return 'current_value=11 after leaf close';
		},
	},
	{
		// SC-343 §8: a click, then an external edit of the same block inside the 400 ms delay.
		// The external edit wins, our write is dropped, and exactly ONE Notice says so — a
		// second miss on the same note inside 5 s adds no second Notice.
		id: 'G-S5n',
		async run(t) {
			const rel = 'Lifecycle/counter.md';
			await t.open(rel);
			await t.reset(rel);
			const m = await t.mark();
			await t.clickIncrease(0);
			await t.sleep(100);
			await t.edit(rel, `c.replace('name: Health', 'name: Vigor')`);
			await t.sleep(1500);
			const text = t.read(rel);
			t.expect(text.includes('name: Vigor') && t.counterValues(rel)[0] === 10, `external edit must win: ${text}`);
			let notices = await t.noticesSince(m);
			t.expect(notices.length === 1 && notices[0] === NOTICE_TEXT('counter'), `expected one Notice, got ${JSON.stringify(notices)}`);
			await t.clickIncrease(0);
			await t.sleep(100);
			await t.edit(rel, `c.replace('name: Vigor', 'name: Grit')`);
			await t.sleep(1500);
			notices = await t.noticesSince(m);
			t.expect(notices.length === 1, `rate limit: expected 1 Notice in 5 s, got ${notices.length}`);
			t.expect(t.integrity(rel).ok, 'note integrity');
			return 'external edit kept; 1 Notice for 2 dropped writes';
		},
	},
];

// ---------------------------------------------------------------------------- main
async function main() {
	// DSE_LIFECYCLE_BUNDLE: take the built plugin from another dir (used to prove the gate
	// discriminates against an older build). Default: this repo's own fresh build.
	const bundleDir = process.env.DSE_LIFECYCLE_BUNDLE ?? repo;
	for (const f of ['main.js', 'styles.css', 'manifest.json']) {
		if (!fs.existsSync(path.join(bundleDir, f))) envFail(`missing built ${f} in ${bundleDir} — run \`npm run obsidian-lifecycle\` (it builds first)`);
	}
	if (!fs.existsSync(BIN)) envFail(`no Obsidian binary at ${BIN}`);
	try {
		await fetch(`http://localhost:${PORT}/json/version`);
		envFail(`port ${PORT} already serves CDP — another instance owns it`);
	} catch {
		/* free — expected */
	}
	const cfg = path.join(os.homedir(), '.config', 'obsidian');
	const asars = fs.existsSync(cfg) ? fs.readdirSync(cfg).filter((f) => /^obsidian-.*\.asar$/.test(f)).sort() : [];
	if (!asars.length) envFail('no obsidian-*.asar in ~/.config/obsidian — open Obsidian once so it self-updates');

	// scratch vault = demo-vault copy (no plugins, no workspace) + fixtures + the fresh build
	spawnSync('bash', ['-c', `mkdir -p "${vault}" && cd "${path.join(repo, 'demo-vault')}" && tar --exclude=./.obsidian/plugins --exclude=./.obsidian/workspace.json -cf - . | tar -xf - -C "${vault}"`], { stdio: 'inherit' });
	const pdir = path.join(vault, '.obsidian', 'plugins', 'draw-steel-elements');
	fs.mkdirSync(pdir, { recursive: true });
	for (const f of ['main.js', 'styles.css', 'manifest.json']) fs.copyFileSync(path.join(bundleDir, f), path.join(pdir, f));
	fs.writeFileSync(path.join(vault, '.obsidian', 'community-plugins.json'), JSON.stringify(['draw-steel-elements']));
	for (const [rel, text] of Object.entries(FIXTURES)) {
		fs.mkdirSync(path.dirname(path.join(vault, rel)), { recursive: true });
		fs.writeFileSync(path.join(vault, rel), text);
	}
	fs.mkdirSync(udd, { recursive: true });
	fs.writeFileSync(path.join(udd, 'obsidian.json'), JSON.stringify({ vaults: { [VAULT_ID]: { path: vault, ts: Date.now(), open: true } } }));
	fs.writeFileSync(path.join(udd, `${VAULT_ID}.json`), JSON.stringify({ x: 0, y: 0, width: 1440, height: 1100, isMaximized: false, devTools: false, zoom: 0 }));
	fs.copyFileSync(path.join(cfg, asars.at(-1)), path.join(udd, asars.at(-1)));

	const x = await startXvfb();
	const child = spawn(BIN, [`--user-data-dir=${udd}`, `--remote-debugging-port=${PORT}`, '--window-size=1440,1100'], {
		env: { ...process.env, DISPLAY: x.display },
		stdio: 'ignore',
	});
	let alive = true;
	child.once('exit', () => (alive = false));
	let ok = 0;
	let failed = 0;
	const selected = SCENARIOS.filter((s) => !ONLY.length || ONLY.includes(s.id));
	try {
		let target;
		const t0 = Date.now();
		while (!target) {
			if (!alive) envFail('Obsidian exited during start-up');
			if (Date.now() - t0 > 45000) envFail('no CDP page target after 45 s');
			try {
				target = (await (await fetch(`http://localhost:${PORT}/json/list`)).json()).find((p) => p.type === 'page' && p.url.startsWith('app://obsidian.md'));
			} catch {
				/* not up yet */
			}
			if (!target) await sleep(300);
		}
		const cdp = await Cdp.connect(target.webSocketDebuggerUrl);
		const t = makeHarness(cdp);
		await t.waitFor('window.app?.workspace?.layoutReady === true', 'layoutReady', 45000);
		if (!(await t.ev("!!app.plugins?.plugins?.['draw-steel-elements']"))) {
			await t.ev(`(async () => { await app.plugins.setEnable(true); await app.plugins.enablePluginAndSave('draw-steel-elements'); })()`);
		}
		await t.waitFor("!!app.plugins.plugins['draw-steel-elements']", 'plugin loaded', 20000);
		await sleep(800);
		for (let i = 0; i < 3; i++) {
			await t.ev("document.querySelectorAll('.modal-container .modal-close-button').forEach((b) => b.click())");
			await sleep(200);
		}
		await t.ev(PAGE_HELPERS);
		const version = await t.ev('require("electron").ipcRenderer.sendSync("version")');
		console.log(`OBSIDIAN-LIFECYCLE start: obsidian ${version}, display ${x.display}, port ${PORT}, ${selected.length} scenario(s)`);
		for (const s of selected) {
			try {
				const summary = await s.run(t);
				ok++;
				console.log(`OBSIDIAN-LIFECYCLE ${s.id} ok (${summary})`);
			} catch (e) {
				failed++;
				let shotPath = '';
				try {
					shotPath = ` [shot ${await t.shot(`${s.id}-FAIL`)}]`;
				} catch {
					/* best effort */
				}
				console.log(`OBSIDIAN-LIFECYCLE ${s.id} FAIL: ${e instanceof Error ? e.message : String(e)}${shotPath}`);
			}
		}
	} finally {
		child.kill('SIGTERM');
		await sleep(1500);
		if (alive) child.kill('SIGKILL');
		x.child.kill('SIGTERM');
	}
	console.log(`OBSIDIAN-LIFECYCLE done: ${ok}/${selected.length} ok, ${failed} failed`);
	process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => {
	console.log(`OBSIDIAN-LIFECYCLE environment: ${e instanceof Error ? e.stack : String(e)}`);
	process.exit(2);
});
```

- [ ] **Step 2: Add the npm script** in `package.json` `scripts`, after `"obsidian-shots"`:

```json
    "obsidian-lifecycle": "npm run build-no-check && node visual-harness/obsidian-lifecycle.mjs",
```

- [ ] **Step 3: Prove the gate discriminates — run the SC-343 scenarios against a `0c132d8` build**

Build the untouched base into a temp dir (sharing this worktree's `node_modules`) and point the gate at it with `DSE_LIFECYCLE_BUNDLE`:

```bash
rm -rf /tmp/sc343-base && mkdir -p /tmp/sc343-base && cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && git archive 0c132d8 | tar -x -C /tmp/sc343-base && ln -s /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements/node_modules /tmp/sc343-base/node_modules
devbox run -- bash -c 'cd /tmp/sc343-base && npm run build-no-check'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && DSE_LIFECYCLE_BUNDLE=/tmp/sc343-base node visual-harness/obsidian-lifecycle.mjs --only=G-S7b,G-S6a,G-S5n'
```
Expected on base: `G-S6a FAIL` (value stays 10 — SC-336), `G-S5n FAIL` (no Notice), `G-S7b FAIL` (the durable path does not exist on base, value stays `[5,5]`); final line `done: 0/3 ok, 3 failed`. Record the three FAIL lines in the task report. Then `rm -rf /tmp/sc343-base`. If base instead PASSES a scenario, that scenario does not discriminate — report it, do not change the assertion.

- [ ] **Step 4: Run the full gate on HEAD — expect `5/5 ok`**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run obsidian-lifecycle'
```
Expected (last lines): five `OBSIDIAN-LIFECYCLE G-… ok (…)` lines and `OBSIDIAN-LIFECYCLE done: 5/5 ok, 0 failed`. Runtime ≈ 1.5 min. If a scenario fails on HEAD, diagnose with `--only=<id>` and the FAIL screenshot; do not weaken an assertion — report it.

- [ ] **Step 5: Clean build outputs and commit**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js main.css styles.css && git status --porcelain && git add visual-harness/obsidian-lifecycle.mjs package.json && git commit -m "test(harness): SC-343 — real-Obsidian lifecycle gate (twins, navigate-away flush, dropped-write Notice)"
```

---

### Task 6: Docs + full battery

**Files:**
- Modify (superproject `/home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard`): `docs/superpowers/dse-overhaul/F1-element-framework-v2-spec.md`, `.claude/skills/dse-verify/SKILL.md`
- Modify (dse): `.repo-docs/architecture.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: the Task 0 baseline numbers and the Task 5 gate output.
- Produces: dse-verify battery step 4 = `npm run obsidian-lifecycle` (SC-340 later raises its expected count).

- [ ] **Step 1: F1 spec amendment.** Under the F1 header block (after the `**One-line summary:**` paragraph), add:

```markdown
> **Amended 2026-09-23 by SC-343** (spec: `SC-340-view-adoption-spec.md` §6.5): the reading-mode
> write path (§4.2) now validates `getSectionInfo`'s range against the live content, locates a
> block by its last known body when the range is stale or gone, and drops an unplaceable write
> with an Obsidian Notice; `canPersist` (§3.4/§4.4) survives a vanished section only for a host
> whose section resolved at least once; `BlockHost.notePersistIntent?()` is new (§3.4).
```

In §3.4, after the `blockKey(): string;` line inside the TS block, add `  /** SC-343: refresh a cached position before a write is scheduled. */\n  notePersistIntent?(): void;`. In §4.2 step 2's last bullet ("reading mode implementation uses `Vault.process` …"), append: " — SC-343: only when the live content at that range still holds the last known body; otherwise the block is found by that body nearest its last known line, and a write with no match is dropped with a Notice (one per note per 5 s)."

- [ ] **Step 2: `.repo-docs/architecture.md`.** In the framework file table, append to the `host/ReadingModeBlockHost.ts` row: " SC-343: keeps a durable identity (last known body/line/language), splices at the section range only when the live content there still holds that body, otherwise re-locates the block by body (nearest line; identical twins by distance), and drops an unplaceable write via `droppedWriteNotice.ts`." Add a row after it:

```markdown
| `host/droppedWriteNotice.ts` | SC-343: the dropped-write Obsidian Notice ("…was not saved — the block changed on disk first."), at most one per note per 5 s, plus a `console.warn` on every drop. |
```

- [ ] **Step 3: CHANGELOG.** Under `## 7.0.0 (unreleased; previously numbered 6.0.0)`, add ONE `[INTERNAL]` bullet (spec §12's reasoning: every symptom SC-343 guards against — a stale write position, a lost edit on navigate-away — arose only in the unreleased 7.0.0 framework; 5.1.1 users never saw them, so no `[FIX]` bullet):

```markdown
- [INTERNAL] A block's save now finds the block by its content when its position in the note has
  moved, instead of trusting a possibly stale line range, so a save can no longer land in the wrong
  place or cut a block short (SC-343). A click followed at once by switching notes now still saves
  (SC-336). If a save cannot be placed because the block changed on disk first (sync or a hand edit
  inside the save delay), it is dropped and a notice says so: "Draw Steel Elements: a change to a
  block in <note> was not saved — the block changed on disk first."
```

- [ ] **Step 4: dse-verify skill** (superproject `.claude/skills/dse-verify/SKILL.md`). In "The battery, in order" table insert a new row 4 and renumber the rest (shots 5, freeze 6, parity 7, obsidian-shots 8):

```markdown
| 4. Lifecycle (real Obsidian, headless) | `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 5/5 ok, 0 failed`, exit 0 (~1.5 min). Builds `main.js` itself, so it runs AFTER jest; own Xvfb `:160–:199`, CDP port 9262, scratch vault — never `:1`. Exit 2 = environment (no Xvfb/asar/binary, port busy), not a code failure |
```

and add a paragraph after the table's run-order paragraph:

```markdown
**Lifecycle gate (SC-343, spec SC-340 §10.2).** `visual-harness/obsidian-lifecycle.mjs` drives a real
Obsidian through the block write lifecycle jest cannot reproduce (section re-draw and unload). One
`OBSIDIAN-LIFECYCLE <id> ok (…)` line per scenario; a failure prints `… FAIL: <assertion> [shot <path>]`
and exits 1. `--only=<id,…>` reruns a subset. SC-343's scenarios: `G-S7a`/`G-S7b` (identical twins,
section and durable path), `G-S6a` (navigate-away flush, SC-336), `G-S6b` (leaf close), `G-S5n`
(dropped-write Notice + rate limit). Mandatory — unlike `obsidian-shots` it needs no real display.
```

Update "Current expected numbers" with a new dated entry (SC-343 landing) listing each gate's before (Task 0) / after numbers from Step 5.

- [ ] **Step 5: Full battery, in the new order**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run lint'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js styles.css && npx jest'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run obsidian-lifecycle'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js main.css styles.css && npm run shots'
devbox run -- bash -c 'bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements/visual-harness/shots'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && npm run parity'
```
Expected: tsc/lint clean; jest = baseline + the new tests, all green; lifecycle `5/5 ok, 0 failed`; shots `0 FAIL` (same count as baseline); freeze byte-identical (0 FAILED); parity `0 GAPs / 0 undeclared / 16 DECLARED`.

- [ ] **Step 6: Commit (dse, then superproject)**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard/draw-steel-elements && rm -f main.js main.css styles.css && git add .repo-docs/architecture.md CHANGELOG.md && git commit -m "docs(framework): SC-343 — architecture row, CHANGELOG"
cd /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard && git add docs/superpowers/dse-overhaul/F1-element-framework-v2-spec.md .claude/skills/dse-verify/SKILL.md && git commit -m "docs(dse): SC-343 — F1 write-path amendment; dse-verify lifecycle gate (battery step 4)"
```
(Do not stage the `draw-steel-elements` submodule pointer in the superproject — the owner does that at landing with `just wt-finish`.)

---

## Self-review (done at plan time)

- **Spec coverage:** §6.5 item 1 (identity) → T2; item 2 (guard) → T3; item 3 (locate, nearest) → T2/T3; item 4 (resolved-once canPersist) → T2; item 5 (persist refresh, Q1) → T2/T4; §8 durable miss + Q2 Notice → T1/T3; SC-336 → T3 jest + T5 `G-S6a`; gate (ruling 4) → T5; docs (§12 reasoning) → T6.
- **Placeholder scan:** every code step carries code; the only conditional instruction (Task 5 Step 3 base build) states both outcomes.
- **Type consistency:** `normalizeBody`, `locateByBody`, `setMountedBody`, `notePersistIntent`, `lastKnownBody`, `lastKnownLineStart`, `notifyDroppedWrite(sourcePath, noteName, now?)` are spelled identically in T1–T6 and in the SC-340 plan.
- **Review Focus:** each of the five lines has its test (T1 rate limit; T2/T3 CRLF, column-0, unterminated, twins; T5 `G-S7b`).
