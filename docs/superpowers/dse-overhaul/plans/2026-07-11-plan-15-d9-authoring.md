# D9 Authoring & Editing UX Implementation Plan (Plan 15)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The D9 authoring tools, reconciled against what F1/D1–D5 actually built. D9 is
**four generators over F1's `ElementRegistry`** — register an element and it gets authoring
support for free, with **zero per-element authoring code**. This plan ships the three tools
that are buildable today and defers the two that are blocked or high-risk:

- **Ship** — the `ElementDefinition.authoring` contract (fills the F1-reserved slot);
  per-element curated examples on a **single source of truth** (`example.yaml`, shared by
  the authoring palette AND the visual-harness fixture); **Insert commands** + a `/ds`
  **`EditorSuggest`** scaffolder; a **key/enum autocomplete** `EditorSuggest` inside `ds-*`
  fences; and a generic **Form/GUI editor** (schema → controls, live validation via F1's
  `ValidationService`, live preview via `createView`, write-back through the existing
  `BlockHost.replaceSource`), reachable from a reading-mode pencil behind a new default-OFF
  pref.
- **Defer** (with reasons, in the OD table) — the **text importer** (§4: the SDK readers it
  needs do not exist in the pinned SDK 2.1.5 — F2 has not landed) and the **inline squiggle
  linter** (§5.2: CM6 `registerEditorExtension`, highest complexity, `@codemirror/lint`
  availability unverified, passively changes editor behavior).

**Architecture:** Every tool is a pure function of `registry.all()` + `def.schema` +
`def.authoring`. New code lives under a new `src/authoring/` module (scaffold builder,
insert command wiring, the two suggesters, the form modal); F1/D2 seams are consumed
verbatim — `ElementRegistry`, `ElementDefinition`, `ValidationService`, `BlockHost`,
`ElementView`/pipeline (for the form preview), the D2 kit (`DseModal`/`managedModal`,
`iconButton`), and Obsidian's first-class `addCommand`/`EditorSuggest` APIs. There is **no
new validator, no new write path, no per-element form class**. The only F1 interface touched
is the additive `authoring` slot F1 already reserved on `ElementDefinition` (`registry.ts:59`
— today `authoring?: unknown`); D9 types it. All authoring editor surfaces are the **edit
surface** (source mode + Live-Preview *editing*), which exists today independent of the F1
Live-Preview *render* deferral — D9 is **not** blocked on LP.

**Tech Stack:** vanilla TypeScript, jest 30 (`unit` + `dom` projects), esbuild (its existing
yaml-loader already covers `.yaml` raw-text imports — the single-source `example.yaml`
mechanism needs **no build-config change**), the D2 kit, the F4 browser harness
(`npm run shots`, 64) and F5 Obsidian camera (`npm run obsidian-shots`, 48). **No new runtime
dependencies** — insert/suggest/form are Obsidian + F1 only.

**Spec:** `docs/superpowers/dse-overhaul/D9-authoring-ux-spec.md` · **Base:** plugin `main`
@ `6b4a532` (D1–D5 landed; 12 elements on Framework v2). The spec predates the D1–D5 build —
the reconciliation deltas below are part of this plan's contract.

## Open-Decision resolutions (Scott can veto any line before execution)

| OD | Spec recommendation | Resolution taken |
|---|---|---|
| **OD-1** (additive `ElementDefinition.authoring`) | (a) add it | **(a) — typed now.** Task 1 replaces `authoring?: unknown` with a typed `AuthoringHint` (`example`, `sdkModel`, `fields`). Purely additive; every existing def compiles unchanged (field stays optional). This is the one F1-interface touch, and F1 pre-reserved the slot exactly for it. |
| **OD-2** (suggest trigger token) | `/ds…`, setting if it collides | **`/ds` fixed; no configurability pref in v1.** Discoverable, won't fire mid-word (`(?:^\|\s)/ds` anchor). A configurable prefix is a documented follow-up if a collision is reported — not built speculatively. |
| **OD-3** (squiggle precision vs YAML-CST dep) | v1→v2 no dep, defer v3 | **Defer §5.2 entirely (all tiers).** The inline linter is the highest-complexity, highest-risk surface, its `@codemirror/lint` dependency is unverified on the host CM6 surface, and it passively changes editor behavior. The **low-risk half of §5 — key/enum autocomplete (§5.1) — ships** (Task 4, `EditorSuggest`, no CM6 extension, no dep). Squiggles become a clean follow-up. |
| **OD-4** (`@codemirror/lint` + schemaless form) | verify lint; raw-YAML now | **lint: N/A (linter deferred).** Schemaless SDK-backed elements (feature/featureblock/statblock/counter/negotiation — no `def.schema`) get the **raw-YAML textarea** form fallback with parse-error validation (OD-4b). SDK-JSON-schema form generation waits on F1 OD-4 shipping element schemas. |
| **OD-5** (importer type detection) | Auto + picker | **N/A — the text importer (§4) is DEFERRED.** See OD-D9-10: the SDK readers it delegates to (`AutoDataReader`/`MarkdownStatblockReader`/…/`SteelCompendiumIdentifier`/`YamlWriter`) do not exist in the pinned SDK 2.1.5; F2 has not landed. Building the importer against absent modules is impossible. It becomes free once F2 bumps the SDK — the `authoring.sdkModel` hooks it needs ship now (Task 2). |
| **OD-6** (form hard-fail vs save-anyway) | hard-fail + escape hatch | **Hard-fail: Save disabled while invalid. Defer the "save anyway" escape hatch.** Writing knowingly-invalid YAML back to the note is the opposite of what an authoring tool should default to; the escape hatch is a documented follow-up, not v1. |
| **OD-7** (reading-mode pencil) | add it, gated on `canPersist` | **Add it, gated on `host.canPersist` AND a NEW default-OFF pref `authoringControls`.** A passive pencil on every rendered block is net-new UI (not a command/palette entry), so the fresh-install fidelity bar forces a default-off gate. Off (the default) ⇒ reading-mode DOM is byte-identical to today; the pref makes it discoverable via settings. This is the form editor's only in-place-EDIT entry point (see OD-D9-12). |

### Reconciliation Open Decisions (new; introduced by this plan)

| OD | Resolution |
|---|---|
| **OD-D9-8** (`ValidationService` reachability) | The spec assumes `validationService` is ambient. **It is not on `RenderContext`** — it lives in `src/framework/validation.ts` and is a member of the framework services bundle (`ElementFrameworkV2Services.validation`, also an `ElementPipeline` dep). The form and its preview receive the `ValidationService` **explicitly** (from `frameworkV2.services.validation` at registration, or from `pipeline.deps.validation` for the pencil), never via `cx.validation`. Signature matches the spec: `validate(def.id, def.schema, data)`. |
| **OD-D9-9** (single source of truth for examples) | Canonical example bodies move to **`src/elements/<id>/example.yaml`** (one per element, id === directory name for all 12). `.yaml` is chosen deliberately: the **existing** esbuild yaml-loader and jest raw-text mapper already cover `.yaml` in the *main* bundle — **no esbuild change**, whereas `.md` is only wired in the harness build. The one file is consumed three ways: (1) `def.authoring.example` (`import ex from './example.yaml'`), (2) the visual-harness fixture (`entry.ts` imports the same file), (3) the F5 camera's `notes-gen.mjs` (reads it from disk). `visual-harness/fixtures/` is deleted. `fixtures.test.ts`'s "all 12" validity gate keeps every example valid. **One body, zero hand-maintained copies.** |
| **OD-D9-10** (text importer deferred) | See OD-5. SDK is **2.1.5**; the readers/writers the importer delegates to are absent. Deferred wholesale; `authoring.sdkModel` (feature/featureblock/statblock) ships now so the importer is pure additive later. |
| **OD-D9-11** (squiggle linter deferred) | See OD-3. §5.2 not built. |
| **OD-D9-12** (in-place edit is reading-mode-only) | Two safety constraints collide in the editor: *editor mutations are insert-at-cursor only, never rewrite* AND *any in-place edit goes through `host.replaceSource`, never a parallel path*. In a pure editor context there is no `BlockHost`. Therefore **the form EDITS an existing block only in reading mode** (the pencil, via `cx.host.replaceSource`); the **editor-side surface is insert-only** (the insert command + `/ds` suggest emit a fresh scaffold at the cursor). The spec's "edit as form from the editor" command is dropped in favor of this constraint-clean split. |
| **OD-D9-13** (new `authoringControls` pref + `Authoring` group) | One new **behavioral** pref (`authoringControls: boolean`, default `false`, no `attr` ⇒ no CSS reflection, no `pref-reflection` churn) in a new `'Authoring'` `PrefGroup`. Primitive default (catalog invariant holds). Gates only the reading-mode pencil. |

## Spec-vs-built reconciliation deltas (the load-bearing facts)

1. **The `authoring` slot already exists, untyped.** `registry.ts:59` ships
   `authoring?: unknown` with a doc comment: *"Additive optional authoring-tool hint slot (D9
   fills this contract)."* D9 replaces `unknown` with `AuthoringHint`. No existing def sets it,
   so nothing breaks.
2. **`ValidationService` is NOT on `cx`** (OD-D9-8). `RenderContext` exposes
   `theme/prefs/refs/session/host` and optional `roll` — **not** `validation`. The service is
   `frameworkV2.services.validation` / `ElementPipeline` dep `validation`. Authoring code takes
   it as a constructor arg.
3. **The SDK is 2.1.5** (`node_modules/steel-compendium-sdk/package.json`) and exports **none**
   of the F2 readers/writers the importer needs. §4 is undeliverable now (OD-D9-10).
4. **12 elements are registered** (`registerFrameworkElementDefinitions`, main.ts:228 — the 11
   D1 migrations + `roll`). The insert generator loops all 12. The `fixtures.test.ts` gate reads
   *"covers every registered element (all 12)"* and asserts
   `Object.keys(FIXTURES).sort() === registered ids` — so the Task-2 example relocation must
   keep all 12 `FIXTURES` keys and their bodies byte-identical (shots stay 64/48).
5. **The obsidian test mock lacks the authoring APIs.** `test/mocks/obsidian-core.ts` has no
   `Editor`, no `EditorSuggest`, no `registerEditorSuggest`, and its `Plugin.addCommand` is a
   no-op that records nothing. Tasks 3–5 add **minimal jest-free** core extensions (plain
   classes + array recorders, the established pattern — no `jest.fn`).
6. **The single-source example bodies are pure YAML.** Each `visual-harness/fixtures/<id>/
   default.md` is a bare block body (e.g. `roll/default.md` = `name:`/`roll:`/`tiers:`…) that
   `fixtures.test.ts` mounts as one element. That is exactly an `authoring.example`, so moving
   it to `example.yaml` and importing it in both places is a rename + rewire, not a rewrite.
7. **`notes-gen.mjs` reads fixtures from disk by path** (`fixtures/<id>/default.md`). Relocating
   the source means rewiring its `fixturesDir` scan to `src/elements/*/example.yaml`. Miss this
   and the F5 camera (`obsidian-shots`) loses its notes.
8. **The kit modal base is `DseModal`** (`framework/kit/managedModal.ts`): `body`,
   `setDseTitle(text)`, `footer(IconButtonOptions[])`, `openManagedModal(owner, factory)`
   (registers `owner.register(() => modal.close())`). The form extends `DseModal`.
9. **View mount for the live preview:** `def.createView(cx)` → `view.mount(root, model)`
   (`ElementView` is a `Component`; `def.parse(rawData, source)` produces the model). The form
   mounts a throwaway view into a preview pane and ties it to the modal `lifecycle` Component so
   it tears down on close.
10. **`BlockHost.replaceSource(body)`** (`framework/host/BlockHost.ts`) replaces the fence body
    atomically (`Vault.process` + section-info splice), resolves `false` when `!canPersist` or
    the block can't be located, never throws. This is the form's ONLY write path.
11. **The reading-mode click shield doesn't block buttons.** `armClickShield` stops
    `mousedown`/`pointerdown`, not `click` — the pencil button (like counter/negotiation
    buttons) works without a shield opt-out; `noClickShield` stays unset.
12. **Fresh-install fidelity holds** because: insert commands + both suggesters are net-new,
    trigger-gated editor surfaces that never touch rendered output; the pencil is default-OFF
    (OD-7); no `serialize` is added or changed; **zero new tokens**; the example relocation keeps
    all 12 fixtures byte-identical. Reading-mode DOM at defaults is unchanged.

## Global Constraints

- **Repo/branch:** work happens in a NEW worktree `d9-authoring` (created via
  `just wt-new d9-authoring` from the workspace); all tasks run in
  `/home/scott/code/steelCompendium/worktrees/d9-authoring/draw-steel-elements` on branch
  **`d9-authoring`**; `npm ci` once (Task 1 Step 0). **Never touch the main checkout** at
  `workspace/draw-steel-elements`.
- **Node invocation:** node/npm/npx/jest/tsc are NOT on PATH. Wrap every command, run from
  `/home/scott/code/steelCompendium/workspace`:
  `devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/d9-authoring/draw-steel-elements && <cmd>"`.
  devbox eats `$?` in the inner shell — append `; echo EXIT=$?` INSIDE the inner command and
  read the echoed value, not the outer status.
- **Gates after EVERY task:** `npx tsc --noEmit` → 0 errors; `npx jest` → all green
  (**1142 tests before this plan; the count only goes up** — each task states its expected
  total; if you legitimately add tests, adjust upward, never down). Do not commit red.
- **Commit hygiene:** NO Co-Authored-By / "Generated with" / any AI-attribution trailers.
  `git push origin d9-authoring` after each task's commit. Restore any stray
  `package.json`/`package-lock.json` churn before committing (no task changes deps).
- **Editor-mutation safety (non-negotiable):** editor surfaces (insert command, `/ds` suggest,
  key/enum suggest) are **insert-at-cursor / replace-the-trigger-token ONLY — never rewrite
  existing content.** The ONLY in-place edit of an existing block is the reading-mode form,
  and it writes through the EXISTING `host.replaceSource` path (never a parallel writer, never
  `editor.replaceRange` over a live block). See OD-D9-12.
- **Fresh-install/default fidelity:** with default prefs, reading-mode render is byte-identical
  to today. The net-new commands + suggesters ARE the sanctioned deliverable (trigger-gated,
  editor-only, no rendered-output change); the one passive affordance (the pencil) is gated
  behind `authoringControls` (default `false`). No `serialize` added or changed anywhere.
- **No new runtime dependencies.** Insert/suggest/form are Obsidian + F1 only. The deferred
  importer's SDK readers and the deferred linter's `@codemirror/lint` are explicitly NOT added.
- **Styling / tokens:** the `styleGuard` (`test/dom/kit/styleGuard.ts`) forbids color literals
  in TS (hex/named/color-function) AND non-geometry `.style` access; all styling via `--dse-*`
  tokens. **This plan adds ZERO tokens** — authoring UI composes the existing 64-name vocabulary
  and kit widgets (`DseModal`, `iconButton`, Obsidian `Setting`). Every token-coverage pin
  (steel 58+6, light 31, print 41+6+17) stays byte-identical.
- **Catalog invariant:** every pref default must be a **primitive** (`authoringControls`'s
  default is `false`). The new pref is behavioral (NO `attr`) — no reflection, no
  `pref-reflection.test.ts` churn, no new CSS attr vocabulary.
- **Camera battery:** D9 adds **no new element**, so `npm run shots` stays **64** and
  `npm run obsidian-shots` stays **48**. Task 2 relocates fixtures but keeps all 12 bodies
  byte-identical — both sweeps must stay clean with zero `--ERROR` shots. Task 6 runs the full
  sweeps.

---

### Task 1: Worktree + the `authoring` contract + the pure scaffold builder

Type the F1-reserved `authoring` slot and build the pure scaffold generator
(`buildScaffold`/`scaffoldFromSchema`/`wrapFence`). No Obsidian wiring yet — pure functions
+ tests, the leaf every later task imports.

**Files:**
- Modify: `src/framework/registry.ts` (type the `authoring` slot)
- Create: `src/authoring/scaffold.ts`, `test/dom/authoring/scaffold.test.ts`

**Interfaces:**
- Consumes: `ElementDefinition` (registry), Obsidian `parseYaml` (test mock supports it).
- Produces: `AuthoringHint`/`AuthoringFieldHint`/`FormWidget` (typed on `ElementDefinition.authoring`);
  `Scaffold`, `wrapFence(alias, body)`, `scaffoldFromSchema(schemaYaml?)`, `buildScaffold(def)`.

- [ ] **Step 0: Create the worktree + install + baseline**

From `/home/scott/code/steelCompendium/workspace`:

```bash
devbox run -- bash -c "just wt-new d9-authoring; echo EXIT=$?"
devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/d9-authoring/draw-steel-elements && npm ci && npx tsc --noEmit; echo EXIT=$?"
devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/d9-authoring/draw-steel-elements && npx jest 2>&1 | tail -3; echo EXIT=$?"
```

Expected: `EXIT=0` each; jest tail shows `Tests: 1142 passed`. All later steps run in this
worktree.

- [ ] **Step 1: Type the `authoring` slot in `src/framework/registry.ts`**

Replace the `authoring?: unknown;` field (lines ~54–59) and add the contract types just above
the `ElementDefinition` interface:

```ts
/** Form control kind the schema-driven form maps a field to (D9). */
export type FormWidget = 'text' | 'textarea' | 'number' | 'toggle' | 'select';

/** Per-field UI override for the generated form; the schema is the fallback for each. */
export interface AuthoringFieldHint {
	label?: string;
	widget?: FormWidget;
	order?: number;
	hidden?: boolean;
	help?: string;
}

/**
 * D9 authoring-tool hints. Absence changes nothing (scaffold/form still derive from the
 * schema); presence enriches. Purely additive — this is the ONLY change D9 makes to an F1
 * interface (F1 reserved the slot at registry.ts as `authoring?: unknown`).
 */
export interface AuthoringHint {
	/** Curated starter block BODY (YAML, no fences). Overrides the schema-derived scaffold. */
	example?: string;
	/** SDK model this element parses — routes the (deferred) text importer. Declared now. */
	sdkModel?: 'statblock' | 'feature' | 'featureblock';
	/** Per-field UI overrides for the form; schema is the fallback for every field. */
	fields?: Record<string, AuthoringFieldHint>;
}
```

and change the field itself (keep the doc note that it is additive/optional):

```ts
	/**
	 * D9 authoring-tool hints (curated example, importer sdk model, per-field form UI).
	 * Additive + optional — absence changes nothing; every tool falls back to the schema.
	 */
	authoring?: AuthoringHint;
```

- [ ] **Step 2: Write the failing scaffold tests**

Create `test/dom/authoring/scaffold.test.ts` (dom project — `parseYaml` comes from the
obsidian mock):

```ts
// Plan 15 Task 1 (D9 §2.1) — the pure scaffold builder. buildScaffold prefers a curated
// authoring.example; scaffoldFromSchema walks the JSON-Schema (required first, optionals
// commented) when there is none; wrapFence wraps a body in the canonical fence. No
// Obsidian editor, no DOM mutation — string in, string out.
import { buildScaffold, scaffoldFromSchema, wrapFence } from '../../../src/authoring/scaffold';
import type { ElementDefinition } from '../../../src/framework/registry';

const SCHEMA = `
type: object
required: [name, max_stamina]
properties:
  name:
    type: string
    description: Display name
  max_stamina:
    type: integer
    minimum: 1
  style:
    type: string
    enum: [card, flat]
    default: card
  collapsible:
    type: boolean
`;

function def(over: Partial<ElementDefinition>): ElementDefinition {
	return {
		id: 'x', name: 'X', aliases: ['ds-x'], shape: 'static',
		parse: (d) => d, createView: () => ({} as never),
		...over,
	} as ElementDefinition;
}

describe('wrapFence', () => {
	test('wraps a body in a fenced block with the canonical alias', () => {
		expect(wrapFence('ds-x', 'a: 1')).toBe('```ds-x\na: 1\n```');
	});
	test('trims trailing newlines so there is exactly one before the close', () => {
		expect(wrapFence('ds-x', 'a: 1\n\n')).toBe('```ds-x\na: 1\n```');
	});
});

describe('scaffoldFromSchema', () => {
	test('required properties first, in declaration order, uncommented', () => {
		const body = scaffoldFromSchema(SCHEMA);
		const lines = body.split('\n');
		expect(lines[0]).toBe('name: ""  # Display name');
		expect(lines[1]).toBe('max_stamina: 0');
	});
	test('optionals follow a divider, commented; enum uses default→first, boolean stub false', () => {
		const body = scaffoldFromSchema(SCHEMA);
		expect(body).toContain('# --- optional ---');
		expect(body).toContain('# style: card');       // default wins
		expect(body).toContain('# collapsible: false'); // typed stub
	});
	test('no schema / unparseable / no properties → empty string (never throws)', () => {
		expect(scaffoldFromSchema(undefined)).toBe('');
		expect(scaffoldFromSchema(': : not yaml : :')).toBe('');
		expect(scaffoldFromSchema('type: object')).toBe('');
	});
});

describe('buildScaffold', () => {
	test('prefers authoring.example over the schema-derived body', () => {
		const s = buildScaffold(def({ schema: SCHEMA, authoring: { example: 'name: Goblin' } }));
		expect(s.text).toBe('```ds-x\nname: Goblin\n```');
		// cursor sits at the first body character (just past the opening fence line)
		expect(s.cursorOffset).toBe('```ds-x\n'.length);
	});
	test('falls back to the schema scaffold when there is no example', () => {
		const s = buildScaffold(def({ schema: SCHEMA }));
		expect(s.text.startsWith('```ds-x\nname: ""')).toBe(true);
	});
	test('no example and no schema → a placeholder comment, still a valid fence', () => {
		const s = buildScaffold(def({}));
		expect(s.text).toBe('```ds-x\n# fill in fields\n```');
	});
});
```

Run: `npx jest test/dom/authoring/scaffold.test.ts` → FAIL (module missing).

- [ ] **Step 3: Write `src/authoring/scaffold.ts` (complete)**

```ts
// Plan 15 Task 1 (D9 §2.1) — the pure scaffold builder. buildScaffold(def) yields the
// fenced block the insert command / suggester drops at the cursor: a curated
// authoring.example when present, else a body walked from def.schema (required keys first,
// optionals commented), else a placeholder. PURE: parseYaml aside, no Obsidian, no DOM,
// no editor mutation — the editor writes happen in insert.ts/suggest.ts.
import { parseYaml } from 'obsidian';
import type { ElementDefinition } from '@/framework/registry';

export interface Scaffold {
	/** Full fenced block text to insert. */
	text: string;
	/** Offset (chars into `text`) to drop the cursor: the first body character. */
	cursorOffset: number;
}

/** Wrap a YAML body in the canonical fence, guaranteeing exactly one trailing newline. */
export function wrapFence(alias: string, body: string): string {
	const trimmed = body.replace(/\n+$/, '');
	return '```' + alias + '\n' + trimmed + '\n```';
}

/** Placeholder value for a property, by JSON-Schema node: default → enum[0] → typed stub. */
function stubFor(prop: unknown): string {
	if (!prop || typeof prop !== 'object') return '""';
	const p = prop as { default?: unknown; enum?: unknown[]; type?: string };
	if ('default' in p) return JSON.stringify(p.default);
	if (Array.isArray(p.enum) && p.enum.length > 0) return JSON.stringify(p.enum[0]);
	switch (p.type) {
		case 'integer':
		case 'number':
			return '0';
		case 'boolean':
			return 'false';
		case 'array':
			return '[]';
		case 'object':
			return '{}';
		default:
			return '""';
	}
}

/** Walk a YAML JSON-Schema into a scaffold body. Empty string if it has no properties. */
export function scaffoldFromSchema(schemaYaml: string | undefined): string {
	if (!schemaYaml) return '';
	let schema: unknown;
	try {
		schema = parseYaml(schemaYaml);
	} catch {
		return '';
	}
	if (!schema || typeof schema !== 'object') return '';
	const s = schema as { properties?: Record<string, unknown>; required?: unknown };
	const props = s.properties;
	if (!props || typeof props !== 'object') return '';
	const requiredSet = new Set(Array.isArray(s.required) ? (s.required as string[]) : []);
	const names = Object.keys(props);
	const required = names.filter((n) => requiredSet.has(n));
	const optional = names.filter((n) => !requiredSet.has(n));

	const lines: string[] = [];
	const emit = (name: string, commented: boolean): void => {
		const prop = props[name];
		const desc =
			prop && typeof prop === 'object' && typeof (prop as { description?: unknown }).description === 'string'
				? `  # ${(prop as { description: string }).description}`
				: '';
		const line = `${name}: ${stubFor(prop)}${desc}`;
		lines.push(commented ? `# ${line}` : line);
	};
	for (const n of required) emit(n, false);
	if (optional.length > 0) {
		lines.push('# --- optional ---');
		for (const n of optional) emit(n, true);
	}
	return lines.join('\n');
}

/** Build the ready-to-insert scaffold for an element. */
export function buildScaffold(def: ElementDefinition): Scaffold {
	const alias = def.aliases[0];
	const body = (def.authoring?.example ?? scaffoldFromSchema(def.schema)) || '# fill in fields';
	return {
		text: wrapFence(alias, body),
		cursorOffset: ('```' + alias + '\n').length,
	};
}
```

- [ ] **Step 4: Gates**

```bash
npx jest test/dom/authoring/scaffold.test.ts   # → all green (8 tests)
npx tsc --noEmit                                # → 0
npx jest                                        # → 1150 (1142 + 8)
```

- [ ] **Step 5: Commit + push**

```bash
git add src/framework/registry.ts src/authoring/scaffold.ts test/dom/authoring/scaffold.test.ts
git commit -m "feat(authoring): type ElementDefinition.authoring + pure scaffold builder (D9)"
git push origin d9-authoring
```

---

### Task 2: Single-source `example.yaml` per element + `authoring` fills

Make each element's harness fixture and its `authoring.example` **one file**. Move every
`visual-harness/fixtures/<id>/default.md` to `src/elements/<id>/example.yaml`, point both
`authoring.example` and the harness at it, rewire `notes-gen.mjs`, delete the old fixtures
tree. Add `authoring.sdkModel` to the three SDK-backed elements (hooks for the deferred
importer). All 12 bodies stay byte-identical — shots unchanged.

**Files:**
- Create: `src/elements/<id>/example.yaml` ×12 (moved content)
- Modify: `src/elements/<id>/definition.ts` ×12 (add `authoring`), `visual-harness/entry.ts`
  (import paths), `visual-harness/notes-gen.mjs` (disk scan)
- Delete: `visual-harness/fixtures/` (the 12 `default.md` files + dirs)

**Interfaces:**
- Consumes: the raw `.yaml` loader (esbuild + jest) — already present.
- Produces: `def.authoring.example` on all 12; `def.authoring.sdkModel` on
  feature/featureblock/statblock; `FIXTURES` unchanged in shape (12 keys, same bodies).

- [ ] **Step 1: Move each fixture body to the element dir (byte-identical)**

For each of the 12 ids (`characteristics`, `counter`, `feature`, `featureblock`,
`horizontal-rule`, `initiative`, `negotiation`, `roll`, `skills`, `stamina-bar`, `statblock`,
`values-row`) move the file, preserving content exactly:

```bash
for id in characteristics counter feature featureblock horizontal-rule initiative negotiation roll skills stamina-bar statblock values-row; do
  git mv "visual-harness/fixtures/$id/default.md" "src/elements/$id/example.yaml"
done
rmdir visual-harness/fixtures/* visual-harness/fixtures 2>/dev/null
echo EXIT=$?
```

(`git mv` keeps the bytes; the extension change is cosmetic — the content was already pure
YAML. Verify with `git diff --stat` that only paths moved.)

- [ ] **Step 2: Add `authoring.example` to each definition**

In each `src/elements/<id>/definition.ts`, import the co-located example and set it on the
definition object. Pattern (shown for stamina-bar; repeat per element, matching each file's id
and variable style):

```ts
import staminaExample from './example.yaml';
// …
export const staminaBarElement: ElementDefinition<StaminaBar> = {
	id: 'stamina-bar',
	// …existing fields unchanged…
	authoring: { example: staminaExample },
};
```

For the three SDK-backed elements, ALSO declare `sdkModel` (the deferred importer's hook):

```ts
// feature/definition.ts
authoring: { example: featureExample, sdkModel: 'feature' },
// featureblock/definition.ts
authoring: { example: featureblockExample, sdkModel: 'featureblock' },
// statblock/definition.ts
authoring: { example: statblockExample, sdkModel: 'statblock' },
```

- [ ] **Step 3: Rewire the harness `entry.ts` imports**

In `visual-harness/entry.ts`, change each fixture import from the old fixtures path to the new
element-dir source (the `FIXTURES` map body is otherwise unchanged):

```ts
import characteristicsDefault from '../src/elements/characteristics/example.yaml';
import counterDefault from '../src/elements/counter/example.yaml';
import featureDefault from '../src/elements/feature/example.yaml';
import featureblockDefault from '../src/elements/featureblock/example.yaml';
import horizontalRuleDefault from '../src/elements/horizontal-rule/example.yaml';
import initiativeDefault from '../src/elements/initiative/example.yaml';
import negotiationDefault from '../src/elements/negotiation/example.yaml';
import rollDefault from '../src/elements/roll/example.yaml';
import skillsDefault from '../src/elements/skills/example.yaml';
import staminaBarDefault from '../src/elements/stamina-bar/example.yaml';
import statblockDefault from '../src/elements/statblock/example.yaml';
import valuesRowDefault from '../src/elements/values-row/example.yaml';
```

(The `FIXTURES` object keeps all 12 keys → `fixtures.test.ts`'s "all 12" gate is satisfied
unchanged; the harness esbuild's `.yaml` text loader already handles these.)

- [ ] **Step 4: Rewire `notes-gen.mjs` to the new disk location**

In `visual-harness/notes-gen.mjs`, the fixture scan currently walks
`visual-harness/fixtures/<id>/default.md`. Repoint it at `src/elements/<id>/example.yaml`:

```js
const elementsDir = path.join(root, 'src', 'elements');
const ids = fs
	.readdirSync(elementsDir)
	.filter((d) => fs.existsSync(path.join(elementsDir, d, 'example.yaml')));
// …
const body = fs.readFileSync(path.join(elementsDir, id, 'example.yaml'), 'utf8');
```

(Match the file's existing `root`/`path` variables; the alias lookup and `Harness/<id>.md`
output are unchanged, so the F5 camera still generates the same 12 notes.)

- [ ] **Step 5: Gates**

```bash
npx tsc --noEmit                                       # → 0
npx jest test/dom/visual-harness/fixtures.test.ts      # → green (all 12 still covered)
npx jest                                               # → 1150 (no new tests this task)
npm run build                                          # → production bundle green (yaml import resolves)
git diff --stat                                        # → only moves + import/authoring edits
```

Sanity: confirm no `example.yaml` body changed — `git show :src/elements/roll/example.yaml`
equals the pre-move `roll/default.md`. Shots are NOT run here (Task 6 runs the full sweep);
they must stay 64/48 because bodies are unchanged.

- [ ] **Step 6: Commit + push**

```bash
git add src/elements visual-harness/entry.ts visual-harness/notes-gen.mjs
git rm -r --cached visual-harness/fixtures 2>/dev/null; true
git add -A visual-harness/fixtures
git commit -m "refactor(authoring): single-source element examples (example.yaml) shared by palette + harness (D9)"
git push origin d9-authoring
```

---

### Task 3: Insert commands + the `/ds` `EditorSuggest` scaffolder

One insert command per element and one `/ds` suggester, both pure loops over `registry.all()`.
Insert-at-cursor / replace-the-trigger-token only — never rewrite existing content. Requires
minimal jest-free obsidian-mock extensions (`Editor`, `EditorSuggest`, command/suggest
recorders).

**Files:**
- Create: `src/authoring/insert.ts`, `src/authoring/suggest.ts`,
  `test/dom/authoring/insert.test.ts`, `test/dom/authoring/suggest.test.ts`
- Modify: `test/mocks/obsidian-core.ts` (add `Editor`/`EditorSuggest`/recorders),
  `main.ts` (wire in `onload`)

**Interfaces:**
- Consumes: `buildScaffold` (Task 1), `ElementRegistry`, Obsidian `addCommand`/`Editor`/
  `EditorSuggest`/`registerEditorSuggest`.
- Produces: `registerInsertCommands(plugin, registry)`, `insertScaffold(editor, def)`,
  `DsElementSuggest` (extends `EditorSuggest<ElementDefinition>`, trigger `/ds`).

- [ ] **Step 1: Extend the obsidian mock (minimal, jest-free)**

In `test/mocks/obsidian-core.ts` add (near the other UI classes) the editor/suggest surface and
make `Plugin` record commands + suggesters:

```ts
export interface EditorPosition {
	line: number;
	ch: number;
}
export interface EditorSuggestTriggerInfo {
	start: EditorPosition;
	end: EditorPosition;
	query: string;
}
export interface EditorSuggestContext {
	editor: Editor;
	file: TFile | null;
	start: EditorPosition;
	end: EditorPosition;
	query: string;
}

/** Minimal line-buffer editor for authoring tests: records every write it is asked to make. */
export class Editor {
	private lines: string[];
	cursor: EditorPosition = { line: 0, ch: 0 };
	readonly writes: Array<{ text: string; from: EditorPosition; to: EditorPosition }> = [];
	constructor(text = '') {
		this.lines = text.split('\n');
	}
	getLine(n: number): string {
		return this.lines[n] ?? '';
	}
	lineCount(): number {
		return this.lines.length;
	}
	getCursor(): EditorPosition {
		return this.cursor;
	}
	setCursor(pos: EditorPosition): void {
		this.cursor = pos;
	}
	getValue(): string {
		return this.lines.join('\n');
	}
	replaceSelection(text: string): void {
		this.writes.push({ text, from: this.cursor, to: this.cursor });
	}
	replaceRange(text: string, from: EditorPosition, to: EditorPosition): void {
		this.writes.push({ text, from, to });
	}
}

export abstract class EditorSuggest<T> {
	app: App;
	context: EditorSuggestContext | null = null;
	constructor(app: App) {
		this.app = app;
	}
	abstract onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null;
	abstract getSuggestions(context: EditorSuggestContext): T[] | Promise<T[]>;
	abstract renderSuggestion(value: T, el: HTMLElement): void;
	abstract selectSuggestion(value: T, evt: unknown): void;
}
```

And extend the existing `Plugin` class — replace the no-op `addCommand` and add recorders:

```ts
	readonly commands: any[] = [];
	readonly editorSuggests: any[] = [];
	addCommand(command: any): any {
		this.commands.push(command);
		return command;
	}
	registerEditorSuggest(suggest: any): void {
		this.editorSuggests.push(suggest);
	}
	registerEditorExtension(_ext: any): void {}
```

- [ ] **Step 2: Write the failing insert + suggest tests**

Create `test/dom/authoring/insert.test.ts`:

```ts
// Plan 15 Task 3 (D9 §2.1) — one insert command per registered element; each inserts a
// scaffold at the cursor (replaceSelection), never rewriting existing text.
import { registerInsertCommands, insertScaffold } from '../../../src/authoring/insert';
import { createElementRegistry } from '../../../src/framework/registry';
import { registerFrameworkElementDefinitions } from 'main';
import { Editor, Plugin, App } from 'obsidian';

function makeRegistry() {
	const r = createElementRegistry();
	registerFrameworkElementDefinitions(r);
	return r;
}

test('registers exactly one insert-<id> command per element, sentence-cased', () => {
	const plugin = new Plugin(new App());
	const registry = makeRegistry();
	registerInsertCommands(plugin as never, registry);
	expect(plugin.commands).toHaveLength(registry.all().length); // 12
	const roll = plugin.commands.find((c) => c.id === 'insert-roll');
	expect(roll.name).toBe('Insert Draw Steel: Roll');
	expect(typeof roll.editorCallback).toBe('function');
});

test('the command callback inserts the element scaffold at the cursor only', () => {
	const editor = new Editor('existing line');
	editor.cursor = { line: 0, ch: 13 };
	const def = makeRegistry().get('roll')!;
	insertScaffold(editor as never, def);
	expect(editor.writes).toHaveLength(1);
	expect(editor.writes[0].text.startsWith('```ds-roll\n')).toBe(true);
	expect(editor.writes[0].from).toEqual(editor.writes[0].to); // pure insert, no range replace
	expect(editor.getValue()).toBe('existing line');            // mock records, never mangles
});
```

Create `test/dom/authoring/suggest.test.ts`:

```ts
// Plan 15 Task 3 (D9 §2.2) — the /ds EditorSuggest: triggers on a /ds token, filters the
// registry by name/alias, and on select replaces the trigger token (start..end) with the
// scaffold — never touching anything else on the line.
import { DsElementSuggest } from '../../../src/authoring/suggest';
import { createElementRegistry } from '../../../src/framework/registry';
import { registerFrameworkElementDefinitions } from 'main';
import { Editor, App } from 'obsidian';

function makeSuggest() {
	const registry = createElementRegistry();
	registerFrameworkElementDefinitions(registry);
	return new DsElementSuggest(new App(), registry);
}

test('onTrigger fires on a /ds token and reports the token range + query', () => {
	const s = makeSuggest();
	const editor = new Editor('  /dsroll');
	const info = s.onTrigger({ line: 0, ch: 9 }, editor as never, null);
	expect(info).not.toBeNull();
	expect(info!.query).toBe('roll');
	expect(info!.start).toEqual({ line: 0, ch: 2 }); // start of "/dsroll"
	expect(info!.end).toEqual({ line: 0, ch: 9 });
});

test('onTrigger does NOT fire mid-word (no leading boundary)', () => {
	const s = makeSuggest();
	const editor = new Editor('foo/dsx');
	expect(s.onTrigger({ line: 0, ch: 7 }, editor as never, null)).toBeNull();
});

test('getSuggestions filters by name and alias; empty query lists all', () => {
	const s = makeSuggest();
	s.context = { editor: null as never, file: null, start: { line: 0, ch: 0 }, end: { line: 0, ch: 0 }, query: '' };
	expect(s.getSuggestions({ ...s.context, query: '' })).toHaveLength(s['registry'].all().length);
	const stam = s.getSuggestions({ ...s.context, query: 'stam' });
	expect(stam.some((d) => d.id === 'stamina-bar')).toBe(true);
});

test('selectSuggestion replaces the token range with the scaffold', () => {
	const s = makeSuggest();
	const editor = new Editor('  /dsroll');
	s.context = { editor: editor as never, file: null, start: { line: 0, ch: 2 }, end: { line: 0, ch: 9 }, query: 'roll' };
	const roll = s['registry'].get('roll')!;
	s.selectSuggestion(roll, null);
	expect(editor.writes).toHaveLength(1);
	expect(editor.writes[0].from).toEqual({ line: 0, ch: 2 });
	expect(editor.writes[0].to).toEqual({ line: 0, ch: 9 });
	expect(editor.writes[0].text.startsWith('```ds-roll\n')).toBe(true);
});
```

Run: `npx jest test/dom/authoring/insert.test.ts test/dom/authoring/suggest.test.ts` → FAIL.

- [ ] **Step 3: Write `src/authoring/insert.ts` (complete)**

```ts
// Plan 15 Task 3 (D9 §2.1) — insert commands: one per registered element, each dropping a
// scaffold at the cursor. INSERT ONLY (replaceSelection) — never a range-replace over
// existing content (editor-mutation safety, Global Constraints / OD-D9-12).
import type { Editor, Plugin } from 'obsidian';
import type { ElementDefinition, ElementRegistry } from '@/framework/registry';
import { buildScaffold } from './scaffold';

/** Insert the element's scaffold at the cursor (or over the current selection). */
export function insertScaffold(editor: Editor, def: ElementDefinition): void {
	editor.replaceSelection(buildScaffold(def).text);
}

/** Register `insert-<id>` for every element in the registry (loop, no per-element code). */
export function registerInsertCommands(plugin: Plugin, registry: ElementRegistry): void {
	for (const def of registry.all()) {
		plugin.addCommand({
			id: `insert-${def.id}`,
			name: `Insert Draw Steel: ${def.name}`,
			editorCallback: (editor: Editor) => insertScaffold(editor, def),
		});
	}
}
```

- [ ] **Step 4: Write `src/authoring/suggest.ts` (complete)**

```ts
// Plan 15 Task 3 (D9 §2.2) — the /ds EditorSuggest scaffolder. One suggester covers every
// element: type "/ds", filter by name/alias, pick, and the trigger token is REPLACED with
// the scaffold (start..end only — the rest of the line is untouched). First-class Obsidian
// API; works in source mode + Live-Preview editing (independent of the LP render deferral).
import { EditorSuggest } from 'obsidian';
import type { App, Editor, EditorPosition, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from 'obsidian';
import type { ElementDefinition, ElementRegistry } from '@/framework/registry';
import { buildScaffold } from './scaffold';

/** `/ds` optionally followed by a query, anchored to a word boundary so it never fires mid-word. */
const TRIGGER = /(?:^|\s)\/ds([a-z-]*)$/i;

export class DsElementSuggest extends EditorSuggest<ElementDefinition> {
	constructor(
		app: App,
		private readonly registry: ElementRegistry,
	) {
		super(app);
	}

	onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
		const before = editor.getLine(cursor.line).slice(0, cursor.ch);
		const m = TRIGGER.exec(before);
		if (!m) return null;
		const tokenLength = m[1].length + 3; // "/ds" + query
		return {
			start: { line: cursor.line, ch: cursor.ch - tokenLength },
			end: cursor,
			query: m[1].toLowerCase(),
		};
	}

	getSuggestions(context: EditorSuggestContext): ElementDefinition[] {
		const q = context.query;
		if (q === '') return this.registry.all().slice();
		return this.registry
			.all()
			.filter((d) => d.name.toLowerCase().includes(q) || d.aliases.some((a) => a.includes(q)));
	}

	renderSuggestion(def: ElementDefinition, el: HTMLElement): void {
		el.createDiv({ cls: 'dse-suggest__title', text: def.name });
		el.createDiv({ cls: 'dse-suggest__alias', text: def.aliases[0] });
	}

	selectSuggestion(def: ElementDefinition): void {
		if (!this.context) return;
		this.context.editor.replaceRange(buildScaffold(def).text, this.context.start, this.context.end);
	}
}
```

- [ ] **Step 5: Wire into `main.ts` `onload`**

Add the imports near the other framework imports:

```ts
import { registerInsertCommands } from '@/authoring/insert';
import { DsElementSuggest } from '@/authoring/suggest';
```

In `onload`, right after `registerFrameworkElements(this, frameworkV2);` (before the existing
`download-data-md-dse` command):

```ts
		// D9 (Plan 15 Task 3): authoring scaffolders — one Insert command per element and a
		// /ds EditorSuggest, both pure loops over the registry (no per-element code). Editor
		// surfaces only: insert-at-cursor, never a rewrite.
		registerInsertCommands(this, frameworkV2.registry);
		this.registerEditorSuggest(new DsElementSuggest(this.app, frameworkV2.registry));
```

- [ ] **Step 6: Gates + commit**

```bash
npx jest test/dom/authoring/insert.test.ts test/dom/authoring/suggest.test.ts   # → green (6)
npx tsc --noEmit    # → 0
npx jest            # → 1156 (1150 + 6)
git add src/authoring/insert.ts src/authoring/suggest.ts test/dom/authoring test/mocks/obsidian-core.ts main.ts
git commit -m "feat(authoring): insert commands + /ds EditorSuggest scaffolder (D9)"
git push origin d9-authoring
```

---

### Task 4: Key/enum autocomplete inside `ds-*` fences (§5.1)

The low-risk half of §5: a second `EditorSuggest` that fires **inside** a `ds-*` fence,
offering property-name completions (unused keys) and enum-value completions from `def.schema`.
No CM6 extension, no dependency — the squiggle linter (§5.2) stays deferred (OD-3).

**Files:**
- Create: `src/authoring/schemaSuggest.ts`, `test/dom/authoring/schemaSuggest.test.ts`
- Modify: `main.ts` (register the second suggester)

**Interfaces:**
- Consumes: `ElementRegistry`, `def.schema` (parsed once, cached), Obsidian `EditorSuggest`.
- Produces: `DsSchemaSuggest` (extends `EditorSuggest<string>`).

- [ ] **Step 1: Write the failing tests**

Create `test/dom/authoring/schemaSuggest.test.ts`:

```ts
// Plan 15 Task 4 (D9 §5.1) — key/enum autocomplete scoped to a ds-* fence body. onTrigger
// finds the enclosing opening fence (bail if a closing fence is hit first), resolves the
// element, and offers property names (key context) or enum values (after "key:").
import { DsSchemaSuggest } from '../../../src/authoring/schemaSuggest';
import { createElementRegistry, type ElementDefinition } from '../../../src/framework/registry';
import { Editor, App } from 'obsidian';

const SCHEMA = `
type: object
properties:
  name: { type: string }
  style: { type: string, enum: [card, flat] }
`;

function suggest() {
	const registry = createElementRegistry();
	registry.register({
		id: 'x', name: 'X', aliases: ['ds-x'], shape: 'static', schema: SCHEMA,
		parse: (d) => d, createView: () => ({} as never),
	} as ElementDefinition);
	return new DsSchemaSuggest(new App(), registry);
}

test('key context inside the fence → property-name completions', () => {
	const s = suggest();
	const editor = new Editor('```ds-x\nna');
	const info = s.onTrigger({ line: 1, ch: 2 }, editor as never, null);
	expect(info).not.toBeNull();
	expect(s.getSuggestions({ ...info!, editor: editor as never, file: null })).toEqual(['name']);
});

test('enum context after "style:" → enum values', () => {
	const s = suggest();
	const editor = new Editor('```ds-x\nstyle: ');
	const info = s.onTrigger({ line: 1, ch: 7 }, editor as never, null);
	expect(info).not.toBeNull();
	expect(s.getSuggestions({ ...info!, editor: editor as never, file: null })).toEqual(['card', 'flat']);
});

test('outside any ds fence → no trigger', () => {
	const s = suggest();
	const editor = new Editor('just prose\nna');
	expect(s.onTrigger({ line: 1, ch: 2 }, editor as never, null)).toBeNull();
});

test('a closing fence above the cursor means NOT inside → no trigger', () => {
	const s = suggest();
	const editor = new Editor('```ds-x\nname: A\n```\nna');
	expect(s.onTrigger({ line: 3, ch: 2 }, editor as never, null)).toBeNull();
});

test('unknown fence language → no trigger', () => {
	const s = suggest();
	const editor = new Editor('```python\nna');
	expect(s.onTrigger({ line: 1, ch: 2 }, editor as never, null)).toBeNull();
});
```

Run: `npx jest test/dom/authoring/schemaSuggest.test.ts` → FAIL.

- [ ] **Step 2: Write `src/authoring/schemaSuggest.ts` (complete)**

```ts
// Plan 15 Task 4 (D9 §5.1) — key/enum autocomplete inside a ds-* fence. A supported
// EditorSuggest (NOT a CM6 extension — the squiggle linter, §5.2, stays deferred per OD-3).
// onTrigger walks upward to the enclosing opening fence (bailing if a bare closing fence is
// hit first), resolves the element by its fence language, and offers either property names
// or, after "key:", that key's enum values. Reads def.schema (parsed once per id, cached).
import { EditorSuggest, parseYaml } from 'obsidian';
import type { App, Editor, EditorPosition, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from 'obsidian';
import type { ElementRegistry } from '@/framework/registry';

const OPEN_FENCE = /^(?:```|~~~)\s*(ds-[a-z0-9-]+)\s*$/i;
const BARE_FENCE = /^(?:```|~~~)\s*$/;

type Mode = { kind: 'key'; id: string } | { kind: 'enum'; id: string; key: string };

interface SchemaShape {
	properties?: Record<string, { enum?: unknown[] } | undefined>;
}

export class DsSchemaSuggest extends EditorSuggest<string> {
	private mode: Mode | null = null;
	private readonly schemaCache = new Map<string, SchemaShape | null>();

	constructor(
		app: App,
		private readonly registry: ElementRegistry,
	) {
		super(app);
	}

	/** Language of the ds-* fence enclosing `line`, or null if the cursor isn't inside one. */
	private enclosingFenceLang(editor: Editor, line: number): string | null {
		for (let l = line - 1; l >= 0; l--) {
			const text = editor.getLine(l);
			const open = OPEN_FENCE.exec(text);
			if (open) return open[1].toLowerCase();
			if (BARE_FENCE.test(text)) return null; // a closing fence first → not inside a block
		}
		return null;
	}

	private schemaFor(id: string): SchemaShape | null {
		if (!this.schemaCache.has(id)) {
			const def = this.registry.get(id);
			let parsed: SchemaShape | null = null;
			if (def?.schema) {
				try {
					parsed = parseYaml(def.schema) as SchemaShape;
				} catch {
					parsed = null;
				}
			}
			this.schemaCache.set(id, parsed);
		}
		return this.schemaCache.get(id) ?? null;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
		if (OPEN_FENCE.test(editor.getLine(cursor.line)) || BARE_FENCE.test(editor.getLine(cursor.line))) return null;
		const lang = this.enclosingFenceLang(editor, cursor.line);
		if (!lang) return null;
		const def = this.registry.get(lang);
		if (!def?.schema) return null;

		const before = editor.getLine(cursor.line).slice(0, cursor.ch);
		const enumCtx = /^(\s*)([A-Za-z0-9_-]+):\s*(\S*)$/.exec(before);
		if (enumCtx) {
			this.mode = { kind: 'enum', id: def.id, key: enumCtx[2] };
			return { start: { line: cursor.line, ch: cursor.ch - enumCtx[3].length }, end: cursor, query: enumCtx[3] };
		}
		const keyCtx = /^(\s*)([A-Za-z0-9_-]*)$/.exec(before);
		if (keyCtx) {
			this.mode = { kind: 'key', id: def.id };
			return { start: { line: cursor.line, ch: cursor.ch - keyCtx[2].length }, end: cursor, query: keyCtx[2] };
		}
		return null;
	}

	getSuggestions(context: EditorSuggestContext): string[] {
		if (!this.mode) return [];
		const schema = this.schemaFor(this.mode.id);
		const props = schema?.properties ?? {};
		const q = context.query.toLowerCase();
		if (this.mode.kind === 'key') {
			return Object.keys(props).filter((k) => k.toLowerCase().startsWith(q));
		}
		const prop = props[this.mode.key];
		const values = Array.isArray(prop?.enum) ? (prop!.enum as unknown[]).map(String) : [];
		return values.filter((v) => v.toLowerCase().startsWith(q));
	}

	renderSuggestion(value: string, el: HTMLElement): void {
		el.setText(value);
	}

	selectSuggestion(value: string): void {
		if (!this.context) return;
		this.context.editor.replaceRange(value, this.context.start, this.context.end);
	}
}
```

- [ ] **Step 3: Register in `main.ts`**

Add the import and register beside the `/ds` suggester:

```ts
import { DsSchemaSuggest } from '@/authoring/schemaSuggest';
```

```ts
		this.registerEditorSuggest(new DsSchemaSuggest(this.app, frameworkV2.registry));
```

- [ ] **Step 4: Gates + commit**

```bash
npx jest test/dom/authoring/schemaSuggest.test.ts   # → green (5)
npx tsc --noEmit    # → 0
npx jest            # → 1161 (1156 + 5)
git add src/authoring/schemaSuggest.ts test/dom/authoring/schemaSuggest.test.ts main.ts
git commit -m "feat(authoring): key/enum autocomplete inside ds-* fences (D9 §5.1)"
git push origin d9-authoring
```

---

### Task 5: The Form/GUI editor (schema → controls; write via `BlockHost`)

A single generic modal parameterized by an `ElementDefinition` — no per-element form class.
Schema-bearing elements get labeled controls; schemaless SDK-backed elements get a raw-YAML
textarea (OD-4b). Live validation via F1's `ValidationService`, live preview via
`def.createView`, Save through `host.replaceSource`. Reachable from a reading-mode pencil gated
behind the new default-OFF `authoringControls` pref (OD-7). Save is disabled while invalid
(OD-6).

**Files:**
- Create: `src/authoring/formModel.ts`, `src/authoring/FormModal.ts`,
  `test/dom/authoring/formModel.test.ts`, `test/dom/authoring/formModal.test.ts`
- Modify: `src/prefs/catalog.ts` (new `authoringControls` pref + `Authoring` group),
  `src/framework/pipeline.ts` (mount the pencil when the pref is on and `canPersist`)

**Interfaces:**
- Consumes: `def.schema`/`def.serialize`/`def.parse`/`def.createView`, `ValidationService`
  (explicit arg — OD-D9-8), `RenderContext` (for preview + `host.replaceSource`), `DseModal`,
  `iconButton`, Obsidian `Setting`/`stringifyYaml`/`parseYaml`.
- Produces: `FormField`/`fieldsFromSchema(def)`; `openFormEditor(cx, def, source, validation)`
  (`DseModal` subclass under the hood); `authoringControls` pref; a pipeline pencil.

- [ ] **Step 1: New pref + group in `src/prefs/catalog.ts`**

Add to the `DsePrefs` augmentation (after the References block):

```ts
		// —— Authoring (behavioral; D9 — gates the reading-mode form pencil) ——
		authoringControls: boolean;
```

Extend the `PrefGroup` union and `GROUP_ORDER` with `'Authoring'` (append at the end):

```ts
export type PrefGroup =
	| 'Appearance'
	| 'Statblock display'
	| 'Element defaults'
	| 'Rolling'
	| 'References'
	| 'Authoring';

export const GROUP_ORDER: readonly PrefGroup[] = [
	'Appearance',
	'Statblock display',
	'Element defaults',
	'Rolling',
	'References',
	'Authoring',
];
```

Add the descriptor (with the other `d({...})` entries, at the end of the list):

```ts
	d({
		key: 'authoringControls', default: false,
		ui: {
			group: 'Authoring', label: 'Show edit button on rendered blocks', control: 'toggle',
			help: 'Adds a pencil to each rendered Draw Steel block that opens a form editor (writes back through the normal save path). Off — the default — renders blocks exactly as before; the Insert commands and /ds autocomplete work regardless of this setting.',
		},
	}),
```

- [ ] **Step 2: Write the failing form tests**

Create `test/dom/authoring/formModel.test.ts`:

```ts
// Plan 15 Task 5 (D9 §3.1) — fieldsFromSchema: schema node → control descriptor, with
// authoring.fields overrides (label/widget/order/hidden) and schema fallbacks.
import { fieldsFromSchema } from '../../../src/authoring/formModel';
import type { ElementDefinition } from '../../../src/framework/registry';

const SCHEMA = `
type: object
properties:
  name: { type: string, description: The name }
  max: { type: integer }
  style: { type: string, enum: [card, flat] }
  on: { type: boolean }
  notes: { type: string }
`;

function def(over: Partial<ElementDefinition>): ElementDefinition {
	return {
		id: 'x', name: 'X', aliases: ['ds-x'], shape: 'static', schema: SCHEMA,
		parse: (d) => d, createView: () => ({} as never), ...over,
	} as ElementDefinition;
}

test('maps schema types to widgets and derives sentence-case labels', () => {
	const f = fieldsFromSchema(def({}));
	const byKey = Object.fromEntries(f.map((x) => [x.key, x]));
	expect(byKey.name.widget).toBe('text');
	expect(byKey.name.label).toBe('Name');
	expect(byKey.name.help).toBe('The name');
	expect(byKey.max.widget).toBe('number');
	expect(byKey.style.widget).toBe('select');
	expect(byKey.style.enum).toEqual(['card', 'flat']);
	expect(byKey.on.widget).toBe('toggle');
});

test('authoring.fields overrides label/widget/order and can hide a field', () => {
	const f = fieldsFromSchema(
		def({ authoring: { fields: { notes: { label: 'GM notes', widget: 'textarea', order: -1 }, max: { hidden: true } } } }),
	);
	expect(f[0].key).toBe('notes');          // order: -1 sorts first
	expect(f[0].widget).toBe('textarea');
	expect(f.some((x) => x.key === 'max')).toBe(false); // hidden dropped
});

test('no schema → empty field list (caller falls back to a raw-YAML textarea)', () => {
	expect(fieldsFromSchema(def({ schema: undefined }))).toEqual([]);
});
```

Create `test/dom/authoring/formModal.test.ts`:

```ts
// Plan 15 Task 5 (D9 §3.2) — the generic form modal: seed from the block body, live-validate
// via ValidationService (Save disabled while invalid — OD-6), and Save through
// host.replaceSource (the one write path — OD-D9-12). Uses the real ValidationService + a
// fake BlockHost recording the write.
import { openFormEditor } from '../../../src/authoring/FormModal';
import { createValidationService } from '../../../src/framework/validation';
import { createElementRegistry, type ElementDefinition } from '../../../src/framework/registry';
import { App, stringifyYaml } from 'obsidian';

const SCHEMA = `
type: object
required: [name]
properties:
  name: { type: string }
  count: { type: integer }
`;

function makeCx(writes: string[]) {
	const containerEl = document.createElement('div');
	return {
		app: new App(),
		host: {
			mode: 'reading', sourcePath: 'N.md', containerEl, canPersist: true,
			addChild: <T,>(c: T) => c, getBlockInfo: () => null, blockKey: () => 'k',
			replaceSource: async (body: string) => (writes.push(body), true),
		},
	} as never;
}

function schemaDef(): ElementDefinition {
	return {
		id: 'x', name: 'X', aliases: ['ds-x'], shape: 'static', schema: SCHEMA,
		parse: (d) => d,
		createView: () => ({ mount: async () => {}, load: () => {}, unload: () => {} } as never),
	} as ElementDefinition;
}

test('opens seeded from the body and renders one control per visible field', () => {
	const validation = createValidationService();
	const modal = openFormEditor(makeCx([]), schemaDef(), 'name: Goblin\ncount: 3', validation);
	expect(modal.body.querySelectorAll('.setting-item, .dse-form__field').length).toBeGreaterThan(0);
	modal.close();
});

test('Save writes serialize/stringify output through host.replaceSource', async () => {
	const writes: string[] = [];
	const validation = createValidationService();
	const modal = openFormEditor(makeCx(writes), schemaDef(), 'name: Goblin', validation);
	await modal.save();
	expect(writes).toHaveLength(1);
	expect(writes[0]).toContain('name: Goblin');
	modal.close();
});

test('invalid working object disables Save and does not write', async () => {
	const writes: string[] = [];
	const validation = createValidationService();
	const modal = openFormEditor(makeCx(writes), schemaDef(), 'count: 3', validation); // missing required name
	expect(modal.canSave()).toBe(false);
	await modal.save();
	expect(writes).toHaveLength(0);
	modal.close();
});

test('schemaless element → raw-YAML textarea, saved verbatim through replaceSource', async () => {
	const writes: string[] = [];
	const validation = createValidationService();
	const def = {
		id: 'ft', name: 'Feature', aliases: ['ds-ft'], shape: 'static',
		parse: (_d: unknown, raw: string) => ({ raw }),
		createView: () => ({ mount: async () => {}, load: () => {}, unload: () => {} } as never),
	} as ElementDefinition;
	const modal = openFormEditor(makeCx(writes), def, 'name: Charge\ncost: 1', validation);
	expect(modal.body.querySelector('textarea')).not.toBeNull();
	await modal.save();
	expect(writes[0]).toContain('name: Charge');
	modal.close();
});
```

Run these two → FAIL (modules missing). (`stringifyYaml` is already in the mock.)

- [ ] **Step 3: Write `src/authoring/formModel.ts` (complete)**

```ts
// Plan 15 Task 5 (D9 §3.1) — schema → form-field descriptors. Pure: reads def.schema and
// def.authoring.fields, emits one FormField per visible property, applying label/widget/
// order/hidden overrides with schema fallbacks. The modal (FormModal.ts) turns these into
// controls. Complex nodes (array/object/$ref) fall back to a YAML textarea widget (v1;
// rich nested editors deferred — Post-plan).
import { parseYaml } from 'obsidian';
import type { AuthoringFieldHint, ElementDefinition, FormWidget } from '@/framework/registry';

export interface FormField {
	key: string;
	label: string;
	widget: FormWidget;
	help?: string;
	enum?: string[];
	order: number;
}

/** property name → sentence-case label ("max_stamina" → "Max stamina"). */
function labelize(key: string): string {
	const spaced = key.replace(/[_-]+/g, ' ').trim();
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function widgetFor(node: { type?: string; enum?: unknown[] }): FormWidget {
	if (Array.isArray(node.enum)) return 'select';
	switch (node.type) {
		case 'integer':
		case 'number':
			return 'number';
		case 'boolean':
			return 'toggle';
		case 'string':
			return 'text';
		default:
			return 'textarea'; // array/object/$ref/unknown → raw-YAML sub-editor (v1)
	}
}

export function fieldsFromSchema(def: ElementDefinition): FormField[] {
	if (!def.schema) return [];
	let schema: { properties?: Record<string, { type?: string; enum?: unknown[]; description?: string }> };
	try {
		schema = parseYaml(def.schema);
	} catch {
		return [];
	}
	const props = schema?.properties;
	if (!props || typeof props !== 'object') return [];
	const overrides: Record<string, AuthoringFieldHint> = def.authoring?.fields ?? {};

	const fields: FormField[] = [];
	let i = 0;
	for (const key of Object.keys(props)) {
		const o = overrides[key] ?? {};
		if (o.hidden) continue;
		const node = props[key] ?? {};
		fields.push({
			key,
			label: o.label ?? labelize(key),
			widget: o.widget ?? widgetFor(node),
			help: o.help ?? node.description,
			enum: Array.isArray(node.enum) ? node.enum.map(String) : undefined,
			order: o.order ?? i,
		});
		i++;
	}
	return fields.sort((a, b) => a.order - b.order);
}
```

- [ ] **Step 4: Write `src/authoring/FormModal.ts` (complete)**

```ts
// Plan 15 Task 5 (D9 §3.2) — the generic Form editor. ONE modal for every element: schema
// fields → Setting controls (schemaless → a raw-YAML textarea, OD-4b), a working object,
// live validation via ValidationService (Save disabled while invalid — OD-6), a live
// preview built with def.createView (torn down with the modal), and Save through
// host.replaceSource — the SAME write path persisted elements use (OD-D9-12: no parallel
// writer). No per-element form code.
import { Setting, parseYaml, stringifyYaml } from 'obsidian';
import type { RenderContext } from '@/framework/context';
import type { ElementDefinition } from '@/framework/registry';
import type { ValidationService } from '@/framework/validation';
import { DseModal } from '@/framework/kit/managedModal';
import { fieldsFromSchema, type FormField } from './formModel';

class FormModal extends DseModal {
	private working: Record<string, unknown> = {};
	private rawMode = false;
	private rawText = '';
	private saveDisabled = false;
	private errorEl: HTMLElement | null = null;
	private previewEl: HTMLElement | null = null;
	private previewView: { unload(): void } | null = null;
	private saveHandle: { setDisabled(disabled: boolean): void } | null = null;

	constructor(
		private readonly cx: RenderContext,
		private readonly def: ElementDefinition,
		private readonly source: string,
		private readonly validation: ValidationService,
	) {
		super(cx.app);
	}

	onOpen(): void {
		super.onOpen();
		this.setDseTitle(`Edit ${this.def.name}`);
		try {
			const parsed = parseYaml(this.source);
			this.working = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
		} catch {
			this.working = {};
		}
		const fields = fieldsFromSchema(this.def);
		this.rawMode = !this.def.schema || fields.length === 0;

		if (this.rawMode) {
			this.rawText = this.source;
			this.renderRaw();
		} else {
			for (const field of fields) this.renderField(field);
		}
		this.previewEl = this.body.createDiv({ cls: 'dse-form__preview' });
		this.errorEl = this.body.createDiv({ cls: 'dse-form__errors' });

		const [save] = this.footer([
			{ label: 'Save', icon: 'save', variant: 'accent', onClick: () => void this.save() },
			{ label: 'Cancel', icon: 'x', variant: 'ghost', onClick: () => this.close() },
		]);
		this.saveHandle = save;
		this.revalidate();
	}

	/** A full-width real <textarea> (not Setting.addTextArea) so raw YAML gets room. */
	private textarea(labelText: string, initial: string, onInput: (value: string) => void): void {
		this.body.createEl('label', { cls: 'dse-form__label', text: labelText });
		const ta = this.body.createEl('textarea', { cls: 'dse-form__raw' });
		ta.value = initial;
		this.lifecycle.registerDomEvent(ta, 'input', () => onInput(ta.value));
	}

	private renderRaw(): void {
		this.textarea('YAML', this.rawText, (value) => {
			this.rawText = value;
			this.revalidate();
		});
	}

	private renderField(field: FormField): void {
		const current = this.working[field.key];
		if (field.widget === 'textarea') {
			// Array/object/$ref nodes: a real YAML sub-editor (rich row editors deferred).
			this.textarea(field.label, current == null ? '' : stringifyYaml(current).trimEnd(), (value) => {
				try {
					this.working[field.key] = value === '' ? undefined : parseYaml(value);
				} catch {
					this.working[field.key] = value; // keep raw; validation flags it
				}
				this.revalidate();
			});
			return;
		}
		const setting = new Setting(this.body).setName(field.label);
		if (field.help) setting.setDesc(field.help);
		const set = (value: unknown): void => {
			this.working[field.key] = value;
			this.revalidate();
		};
		switch (field.widget) {
			case 'toggle':
				setting.addToggle((t) => t.setValue(current === true).onChange(set));
				break;
			case 'number':
				setting.addText((t) =>
					t.setValue(current == null ? '' : String(current)).onChange((v) => set(v === '' ? undefined : Number(v))),
				);
				break;
			case 'select':
				setting.addDropdown((d) => {
					for (const opt of field.enum ?? []) d.addOption(opt, opt);
					d.setValue(current == null ? (field.enum?.[0] ?? '') : String(current)).onChange(set);
				});
				break;
			case 'text':
			default:
				setting.addText((t) => t.setValue(current == null ? '' : String(current)).onChange(set));
				break;
		}
	}

	/** Current body text: raw textarea verbatim, else serialize(model)/stringify(working). */
	private currentBody(): string {
		if (this.rawMode) return this.rawText;
		const data = this.working;
		if (this.def.serialize) {
			try {
				return this.def.serialize(this.def.parse(data, stringifyYaml(data)));
			} catch {
				return stringifyYaml(data);
			}
		}
		return stringifyYaml(data);
	}

	private revalidate(): void {
		let messages: string[] = [];
		if (this.rawMode) {
			// No schema: the parse() reader is the validator (SDK-backed elements).
			try {
				this.def.parse(parseYaml(this.rawText) ?? {}, this.rawText);
			} catch (error) {
				messages = [error instanceof Error ? error.message : String(error)];
			}
		} else if (this.def.schema) {
			const result = this.validation.validate(this.def.id, this.def.schema, this.working);
			messages = result.errors.map((e) => `${e.path || 'root'}: ${e.message}`);
		}
		this.saveDisabled = messages.length > 0;
		this.saveHandle?.setDisabled(this.saveDisabled);
		if (this.errorEl) this.errorEl.setText(messages.join('\n'));
		this.renderPreview();
	}

	private renderPreview(): void {
		if (!this.previewEl) return;
		// Tear the previous preview view down (else every keystroke leaks a mounted view).
		if (this.previewView) {
			this.lifecycle.removeChild(this.previewView as never);
			this.previewView = null;
		}
		this.previewEl.empty();
		if (this.saveDisabled) return;
		try {
			const model = this.def.parse(this.rawMode ? (parseYaml(this.rawText) ?? {}) : this.working, this.currentBody());
			const view = this.def.createView(this.cx);
			this.lifecycle.addChild(view); // torn down with the modal / next revalidate (F1 §4.5)
			this.previewView = view;
			void view.mount(this.previewEl, model);
		} catch {
			// A parse/mount slip in the preview must never break the form.
		}
	}

	/** Test/entry surface: is Save currently allowed? */
	canSave(): boolean {
		return !this.saveDisabled;
	}

	/** Write the current body through the one persisted write path. No-op when invalid. */
	async save(): Promise<void> {
		if (this.saveDisabled) return;
		const ok = await this.cx.host.replaceSource(this.currentBody());
		if (ok) this.close();
	}
}

/** Open the form editor for a block. Returns the modal (tests drive save()/canSave()). */
export function openFormEditor(
	cx: RenderContext,
	def: ElementDefinition,
	source: string,
	validation: ValidationService,
): FormModal {
	const modal = new FormModal(cx, def, source, validation);
	modal.open();
	return modal;
}
```

- [ ] **Step 5: Mount the reading-mode pencil in `src/framework/pipeline.ts`**

The pipeline already builds `cx` and mounts the view. After a successful mount, append the
pencil **only** when the pref is on and the host can persist — so default renders are
byte-identical. Add the import:

```ts
import { iconButton } from './kit/iconButton';
import { openFormEditor } from '@/authoring/FormModal';
```

Immediately after the `view.mount(...)` success path (where `root`, `cx`, `def`, `source`, and
`this.deps.validation` are all in scope — mirror the exact local names in `run()`):

```ts
			// D9 (Plan 15 Task 5): opt-in reading-mode edit affordance. Default OFF
			// (authoringControls) ⇒ this branch never runs ⇒ rendered DOM is unchanged.
			// Gated on canPersist (never on embeds/exports); writes go through the SAME
			// host.replaceSource path (no parallel writer).
			if (cx.host.canPersist && prefs.get('authoringControls') === true) {
				iconButton(
					root,
					{
						icon: 'pencil',
						label: `Edit ${def.name}`,
						variant: 'ghost',
						onClick: () => openFormEditor(cx, def, source, this.deps.validation),
					},
					view,
				);
			}
```

(If `prefs` isn't already destructured in `run()`, read it as `this.deps.prefs`. `view` is the
`Component` owning the button's listener — it dies with the block.)

- [ ] **Step 6: Gates + commit**

```bash
npx jest test/dom/authoring/formModel.test.ts test/dom/authoring/formModal.test.ts   # → green (7)
npx tsc --noEmit    # → 0
npx jest            # → 1168 (1161 + 7); confirm pref-reflection.test / settings tests still green
git add src/authoring/formModel.ts src/authoring/FormModal.ts test/dom/authoring/formModel.test.ts test/dom/authoring/formModal.test.ts src/prefs/catalog.ts src/framework/pipeline.ts
git commit -m "feat(authoring): schema-driven form editor + reading-mode pencil (D9 §3)"
git push origin d9-authoring
```

---

### Task 6: Docs + full verification battery

**Files:**
- Modify: `CLAUDE.md` (plugin repo), `.repo-docs/architecture.md`, `README.md` + `docs/`
  (only where they enumerate elements/settings — check first), `REMAINING-TASKS.md`

**Interfaces:**
- Consumes: everything shipped in Tasks 1–5.
- Produces: docs a cold agent (or user) can operate the authoring tools from; the full green
  battery on the final tree.

- [ ] **Step 1: `CLAUDE.md` (plugin repo)**

In "Key Architecture", add one bullet after the Rolling (D5) bullet:

```markdown
- **Authoring (D9)**: `src/authoring/` — four generators over the registry (no per-element
  code). `scaffold.ts` builds insert bodies (curated `authoring.example` → else a
  schema-walked stub); `insert.ts` registers one Insert command per element; `suggest.ts`
  is the `/ds` EditorSuggest scaffolder; `schemaSuggest.ts` is key/enum autocomplete inside
  a `ds-*` fence; `FormModal.ts`/`formModel.ts` are the generic schema→form editor (live
  validation via F1's `ValidationService`, live preview via `createView`, Save through
  `BlockHost.replaceSource`), reachable from a reading-mode pencil gated by the default-OFF
  `authoringControls` pref. The `ElementDefinition.authoring` slot (`registry.ts`) carries
  `example`/`sdkModel`/`fields`; each element's `example.yaml` is the SINGLE source shared
  by the palette AND the visual-harness fixture. Deferred: the SDK-reader text importer (F2)
  and the CM6 squiggle linter (§5.2).
```

Update any element-count/settings enumerations if present:
`grep -rn "all 11\|11 elements\|Rolling section\|settings tab" CLAUDE.md .repo-docs/ README.md docs/`.

- [ ] **Step 2: `.repo-docs/architecture.md`**

Read its framework/seams section and add an "Authoring (D9)" subsection in the file's voice
covering: the four-generators-over-the-registry principle (register an element → free
authoring); the `authoring` contract on `ElementDefinition` (the one additive F1-interface
touch); the single-source `example.yaml` mechanism (one body → palette + fixture + F5 notes,
validity-gated by `fixtures.test.ts`); the editor-mutation safety split (editor = insert-only;
in-place edit = reading-mode pencil via `host.replaceSource` only); that `ValidationService` is
passed explicitly (not on `cx`); and the deliberate deferrals (text importer on F2, squiggle
linter). Keep it under ~40 lines; link the D9 spec path.

- [ ] **Step 3: `README.md` + `docs/` sweep**

`grep -rn "settings\|elements\b\|command" README.md docs/*.md | head -30`. Where user-facing
docs enumerate the settings tab, add the **Authoring → "Show edit button on rendered blocks"**
row. Where they list commands/authoring, describe the **Insert Draw Steel: <element>** commands
and the **`/ds`** + in-fence autocomplete. Do NOT invent a new doc if nothing enumerates; match
the established `docs/` pattern.

- [ ] **Step 4: Full battery**

All from the worktree (wrap each in the devbox invocation; check echoed EXIT):

```bash
npx tsc --noEmit                       # → 0
npx jest                               # → 1168 (or your adjusted-up total)
npm run build                          # → production build green (type check + bundle)
npm run shots                          # → 64 shots, zero --ERROR (example relocation is byte-identical)
npm run obsidian-shots                 # → 48 shots (notes-gen rewired to src/elements/*/example.yaml)
git log --format='%b' 6b4a532..HEAD | grep -iE 'co-authored|generated with' | wc -l   # → 0
git status --porcelain                 # → clean; restore any package.json / devbox.lock churn
```

Manual ground truth to note in the report (real Obsidian): type `/dsroll` in a note → the
suggester lists elements and inserts a `ds-roll` scaffold; inside a `ds-x` fence, autocomplete
offers keys/enums; enable `authoringControls` in settings → a pencil appears on a rendered block
and opens the form, editing writes back via the normal save path; with the pref OFF the render
is unchanged. (The text importer and squiggle linter are deferred — say so.)

- [ ] **Step 5: Commit + push**

```bash
git add CLAUDE.md .repo-docs/architecture.md README.md docs/ REMAINING-TASKS.md
git commit -m "docs(authoring): D9 authoring tools architecture + settings/commands (D9)"
git push origin d9-authoring
```

(Drop paths Step 3 left untouched.)

---

## Post-plan (orchestrator, workspace repo)

- `docs/superpowers/dse-overhaul/README.md`: D9 row → built (v1: insert/suggest/form/autocomplete;
  importer + squiggles deferred).
- Build-ledger entries per task; Linear comment if the SC thread tracks D9.
- `REMAINING-TASKS.md` (plugin repo): ADD the D9 deferrals with one-liners: **text importer**
  (§4 — F2-gated; SDK 2.1.5 lacks `AutoDataReader`/`MarkdownStatblockReader`/…/`YamlWriter`; the
  `authoring.sdkModel` hooks already ship, so it's purely additive once F2 bumps the SDK);
  **inline squiggle linter** (§5.2 — CM6 `registerEditorExtension`; verify `@codemirror/lint` on
  the host surface first; block-level → per-line → CST ladder, OD-3); **form "save anyway" escape
  hatch** (OD-6); **rich array/object form editors** (v1 renders complex nodes as a YAML textarea
  sub-control); **configurable `/ds` trigger prefix** (OD-2, only if a collision is reported);
  **editor-side form-EDIT of an existing block** (blocked by the insert-only + single-write-path
  constraints, OD-D9-12 — revisit if/when an editor `BlockHost` exists).
- **Scott's review gate before landing:** get him in front of rendered output early —
  (1) `/ds` insert + in-fence autocomplete in a real vault; (2) `authoringControls` ON, the
  pencil → form over a statblock and a schemaless feature block (the marquee flow), confirming
  Save round-trips through `replaceSource`; (3) the settings tab's new Authoring section. Two
  explicit veto candidates to surface: (a) `authoringControls` default `false` (OD-7 — flip later
  = one primitive default change, migration-free); (b) the pencil placement/treatment (D3's
  territory if he wants a bespoke look — which would then own any token/CSS change under the
  zero-new-tokens rule).
- Scott's veto pass over the Open-Decision resolutions tables at the top of this plan —
  especially the two DEFERRALS (importer, squiggles): confirm they're acceptable for D9 v1.
- Land via `just wt-finish d9-authoring` after the review gate.
