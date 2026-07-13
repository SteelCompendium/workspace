# D5 Rolling & Interactivity Implementation Plan (Plan 14)

> **STATUS: BUILT + LANDED** (plugin main 6b4a532, 2026-07-11; Opus-reviewed ready-to-merge; suite 1037→1142; edge/bane math AMENDED per header note). Linear SC-7 Done.

> **⚠️ AMENDMENT (2026-07-11, Task-1 review):** the edge/bane math originally drafted here
> (cancel-then-clamp) contradicted the rulebook — each side caps at 2 (double) BEFORE
> cancelling: `net = min(edges,2) − min(banes,2)` ("a double edge and just one bane = one
> edge, regardless of how many edges contributed"). The engine + Task-1 pins were corrected
> in the fix round; any later task text implying cancel-then-clamp is superseded by this.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The D5 rolling system, reconciled against what F1/D2/D3/D4 actually built: a pure
2d10 roll engine (tiers / crit / edge-bane, all four modes) under `src/framework/roll/`; a
`RollService` seam filling the `RollService` stub that already sits on `RenderContext`
(`context.ts:23`) — with a feature-detected Dice Roller bridge behind the already-cataloged
`rollerEngine` pref; two new kit widgets (`rollBar`, `rollResultCard`) plus an additive
`setRollResult()` on the existing `powerRollPanel`; an opt-in roller on every rendered
power-roll effect (feature / featureblock / statblock, via the shared `renderFeature`
grammar); and a new first-class `ds-roll` element. Results are session-ephemeral — rolling
NEVER writes the note.

**Architecture:** Everything rides existing seams. The engine (`resolveRoll`) is a pure
module (injected `DiceSource`, no Obsidian/DOM/Math.random) — the F3-testable core D7/D8
will import. `RollService` is constructed in `initializeElementFrameworkV2` beside the
other services, enters `ElementPipelineDeps`, and reaches views as the already-declared
optional `cx.roll`. The roller UI attaches inside `renderFeature`'s per-effect
`powerRollPanel` mount, behind a NEW master pref `rollingEnabled` (default **false** — the
fresh-default fidelity bar: at defaults, nothing changes on screen). Highlighting rides a
new `data-dse-roll-result` attribute channel on `.dse-pr__row`, deliberately separate from
the selectable mode's `aria-checked` radio semantics (Negotiation keeps its radios; feature
panels stay static divs). **Zero new `--dse-*` tokens** — all roll UI styles compose the
existing 64-name vocabulary, so the token-coverage pins (steel 58+6, light 31, print
41+6+17) are untouched.

**Tech Stack:** vanilla TypeScript, jest 30 (`unit` + `dom` projects), esbuild (+ its
yaml-loader for the `ds-roll` schema), the D2 kit, the F4 browser harness (`npm run
shots`) and the F5 Obsidian camera (`npm run obsidian-shots`) for ground truth. **No new
runtime dependencies** — the native RNG is in-repo `Math.random`; the Dice Roller bridge is
runtime feature detection only (no import, no package.json entry).

**Spec:** `docs/superpowers/dse-overhaul/D5-rolling-interactivity-spec.md` · **Base:**
plugin `main` @ `76df29f`. The spec predates the D2/D3/D4 build — the reconciliation
deltas below are part of this plan's contract.

## Open-Decision resolutions (Scott can veto any line before execution)

| OD | Resolution taken |
|---|---|
| OD-1 (`RollService` on `RenderContext`) | **Yes, and it's already half-built**: `context.ts` ships an EMPTY `RollService` stub interface and an optional `roll?: RollService` field (and `view.ts`'s `PanelHost.roll?` references it). D5 moves the REAL interface to `framework/roll/service.ts`, re-exports it from `context.ts` (so `view.ts`'s import keeps working), and has the pipeline always supply it. The field STAYS optional (`roll?:`) — additive, no existing `createRenderContext` caller breaks; views guard. |
| OD-2 (characteristic sourcing) | **Manual stepper by default** + the `CharacteristicProvider` hook (`framework/roll/binding.ts`); `FeatureElementView.setCharacteristicProvider()` is the D7 injection point. No D7 dependency. |
| OD-3 (Dice Roller bridge) | **Built in this plan** (small, capability-detected, never a dependency) — NOT deferred, because D4 already shipped the `rollerEngine` pref with a `dice-roller` option and this plan un-hides it: an un-hidden settings option must work, never be a silent no-op (explicit-affordance house rule). Detection is capability-based against plugin id `obsidian-dice-roller`; ANY failure ⇒ native fallback. Default stays `native`. |
| OD-4 (pinned results) | **Session-pin only**: history + last-used modifiers live in `SessionStore` (`roll.history` / `roll.lastInput.<n>` slots, cap 10). `ds-roll` ships `shape: "interactive"`, NO serialize — zero note writes anywhere in D5. Note-pin (persisted) is a follow-up. |
| OD-5 (click-to-roll vs button) | **Both, behind a NEW master pref `rollingEnabled` (default `false`)**. The spec has no master switch, but the fidelity bar ("at defaults NOTHING changes on screen or in interaction semantics") forces one — even a Roll button is a screen change. When enabled: the Roll button is always present (the keyboard path); `rollClickToRoll` (built default `true`, KEPT — it was hidden, never user-visible) additionally makes the tier rows a pointer convenience. `ds-roll` ignores the master pref: authoring the block IS the opt-in. |
| OD-6 (crit eligibility) | **Infer from `usage`** via the existing `actionTypeOf()` (`'main'` ⇒ crit-eligible); the roll bar shows an override toggle in power-roll mode. |
| OD-7 (opposed UX in `ds-roll`) | **Single roll + total** v1 ("Opposed — 14" headline); two-sided compare deferred. |
| OD-8 (reroll & history) | Reroll **appends** to history (cap **10** per blockKey·effect); the card shows the latest. The history *popover UI* is deferred — recording ships now so the popover is purely additive later. |
| OD-D5-9 (tokens) | **Zero new `--dse-*` tokens.** Roll UI consumes existing tokens only (`tier-*`, `select`, `accent`, `chip-bg`, `surface-raised`, `border`, `fg-muted`, `radius`, `pad`, `focus-ring`, `touch-min`). The 64-name vocabulary and every token-coverage pin (58+6 / 31 / 41+6+17) stay byte-identical. If review demands a dedicated roll token later, that change must own the vocabulary + all pin updates as its own task. |
| OD-D5-10 (parser placement) | `parseRollExpression` is a **pure module export** (`framework/roll/parse.ts`), not a `RollService` method (spec §2.3 hung it on the service; built style favors pure modules — the service owns only RNG source + delegate). |
| OD-D5-11 (`tierShifted` type) | Spec bug fixed: spec §2.1 types `tierShifted: 0 \| 1 \| -1` but its own §2.2 algorithm assigns `3 - base` (up to **+2**) on a nat-19–20 override. Reconciled to `tierShifted: number` documented as `tier - base` ∈ −2..+2 (audit/animation delta). |

## Spec-vs-built reconciliation deltas (the load-bearing facts)

1. **`cx.roll` already exists as a stub.** `context.ts:23` has `export interface
   RollService {}` (empty) and `roll?: RollService` on `RenderContext`/`createRenderContext`
   args; `view.ts:200` (`PanelHost.roll?`) imports it from `./context`. D5 fills the
   contract in `framework/roll/service.ts` and `context.ts` re-exports the real type —
   no import path changes anywhere.
2. **The D4 catalog pre-registered two hidden roll prefs** (`src/prefs/catalog.ts:160-170`):
   `rollerEngine: 'native' | 'dice-roller'` (default `native`) and `rollClickToRoll:
   boolean` (default **`true`**), both `ui.hidden: true` ("D5 flips them visible"). This
   plan un-hides both AND adds `rollingEnabled` (default `false`) — the built
   `rollClickToRoll: true` default is kept (it only matters once `rollingEnabled` is on, so
   fidelity holds). Catalog invariant (catalog.ts header): **every default must be a
   primitive** — the sparse store's `value === descriptor.default` check requires it. All
   three roll prefs are behavioral (NO `attr`) — no reflection, no CSS attr vocabulary
   change, no `pref-reflection.test.ts` churn.
3. **The settings tab needs zero edits.** `SettingsTab.ts` renders from descriptors and
   skips `ui.hidden` rows (`renderPrefSections`, line 71); `'Rolling'` is already a
   `PrefGroup` member and already in `GROUP_ORDER` (`catalog.ts:47-61`). Un-hiding = the
   rows appear; adding `rollingEnabled` to the catalog = its row appears. No new
   `PrefGroup` union member is needed.
4. **The tier UI is the kit `powerRollPanel`** (`framework/kit/powerRollPanel.ts`), not the
   spec's legacy `EffectView`/`ds-pr-tier-line` DOM (deleted by Plan 09 Task 10). Rows are
   `.dse-pr__row[data-tier="low|mid|high|crit"]`; the spec's `ds-pr-tier-{n}-line` /
   `ds-pr-crit-line` class names do not exist. Highlighting lands on the built rows via a
   new additive `PowerRollPanelHandle.setRollResult()`.
5. **Selectable rows are REAL radios** (`role="radio"`/`aria-checked` in a radiogroup,
   Negotiation). D5's roll-result channel is a *different* attribute
   (`data-dse-roll-result="active|dimmed"`) and click-to-roll listeners are attached ONLY
   on non-selectable panels (feature/featureblock/statblock panels are static divs) — the
   radio selection semantic is composed with, never replaced or shadowed.
6. **The roller attaches inside `renderFeature`** (`src/elements/feature/renderFeature.ts`)
   — the ONE shared grammar all three power-roll-rendering elements use (feature view
   directly; featureblock/view.ts:139 and statblock/view.ts:147 via `renderFeatureList`).
   The spec's "FeatureRollController instantiated by the feature view" becomes an optional
   `roll` member on `RenderFeatureOptions` threaded from each view's `cx`; `renderFeature`
   stays cx-free (it receives plain hooks), and with the option absent its output is
   byte-identical to today (every existing render test passes untouched).
7. **`SessionStore` is `(blockKey, slot)`-keyed** (`framework/session.ts`), not the spec's
   `SessionStore[blockKey]["roll.history"]` object shape — slots are
   `roll.history.<effectIndex>` / `roll.lastInput.<effectIndex>` (one rolling effect per
   panel, spec §3.1's "each rollable effect independently").
8. **History recording lives in the CALLER, not `RollService.roll()`** (spec §7 put it in
   the service): the service has no blockKey; the kit stays cx-free (kit⊥elements,
   session.ts's `SessionPersist` pattern). The roll controller / `RollView` write history.
9. **`ds-roll` gets a schema; the built elements' no-schema convention doesn't apply.**
   Counter/negotiation deliberately have no schema (legacy parity); `ds-roll` is a NEW
   element with its own YAML shape and no SDK reader — F1 §5/OD-4 says schema, hard-fail.
   The yaml-loader (esbuild.config.mjs:30, jest.config.ts:45 raw-text) already supports
   `import schemaYaml from './schema.yaml'` from any path.
10. **Registering a 12th element trips two existing pins**: `test/dom/visual-harness/
    fixtures.test.ts` requires a `FIXTURES` entry for EVERY registered element ("covers
    every registered element (all 11)") — so the `ds-roll` harness fixture is REQUIRED in
    the same task that registers the element, not a docs-time nicety. Grep for other
    "all 11"/element-count pins before committing Task 5.
11. **The reading-mode click shield doesn't block buttons.** `armClickShield`
    (pipeline.ts:84) stops `mousedown`/`pointerdown` at the root — `click` still fires, so
    every kit button inside elements already works (counter, negotiation radios). Roll
    buttons and row-click-to-roll need no shield opt-out; `noClickShield` stays unset.
12. **Rolling works on read-only hosts.** `data-dse-readonly` gates *persistence*
    (canvas etc.); rolling never persists, so roll affordances mount regardless of
    `host.canPersist`. Session history/last-input also work (in-memory).

## Global Constraints

- **Repo/branch:** work happens in a NEW worktree `d5-rolling` (created via `just wt-new
  d5-rolling` from the workspace); all tasks run in
  `/home/scott/code/steelCompendium/worktrees/d5-rolling/draw-steel-elements` on branch
  **`d5-rolling`**; `npm ci` once (Task 1 Step 0 — ts-node is now a declared
  devDependency, fresh installs just work). Never touch the main checkout at
  `workspace/draw-steel-elements`.
- **Node invocation:** node/npm/npx are NOT on PATH. Wrap every node/npm/npx/jest/tsc
  command, run from `/home/scott/code/steelCompendium/workspace`:
  `devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/d5-rolling/draw-steel-elements && <cmd>"`
  devbox eats `$?` in the inner shell — check exit codes INSIDE the inner command
  (`<cmd>; echo EXIT=$?`) and read the echoed value, not the outer status.
- **Gates after EVERY task:** `npx tsc --noEmit` → 0 errors; `npx jest` → all green
  (**1037 tests before this plan; the count only goes up** — each task states its expected
  total; if you legitimately add more tests, adjust upward, never down). Do not commit red.
- **Commit hygiene:** NO Co-Authored-By / "Generated with" / any AI-attribution trailers.
  `git push origin d5-rolling` after each task's commit. Restore any stray
  `package.json`/`package-lock.json` churn after jest runs before committing (no task in
  this plan changes deps).
- **Fresh-install/default fidelity:** with `rollClickToRoll` (and every roll pref) at its
  default, NOTHING changes on screen or in interaction semantics. Concretely: the master
  `rollingEnabled` defaults `false`, so feature/featureblock/statblock render byte-identical
  DOM to today (Task 4 pins this); persisted elements' `serialize` is untouched anywhere in
  this plan (rolling never writes the note).
- **No new runtime dependencies** without an explicit OD row — dice rolling is the in-repo
  RNG (`Math.random`-backed `DiceSource`; OD-3/OD-D5 table above). The Dice Roller bridge
  is runtime feature detection only: no import, no bundling, no package.json entry.
- **Styling:** the `styleGuard` forbids color literals in TS (`test/dom/kit/styleGuard.ts`
  — hex/named/color-function literals AND non-geometry `.style` access); all styling via
  `--dse-*` tokens in `styles-source.css`. Any NEW tokens must be added to the 64-name
  vocabulary (`src/framework/tokens.ts`) + the theme value blocks + the pinned count splits
  (steel 58+6, light 31 — `theme-steel.test.ts:336`, print 41+6+17 —
  `token-coverage.test.ts:233/242`). **This plan adds ZERO tokens (OD-D5-9)** — if you find
  yourself needing one, stop and re-read OD-D5-9; if it truly can't compose, that is a plan
  amendment that must own those pin updates explicitly.
- **Visual verification:** `npm run shots` (F4 browser harness) for iteration;
  `npm run obsidian-shots` (F5 real-Obsidian camera) for sign-off. Task 5 adds the
  `ds-roll` fixture so both cameras see the new element; Task 6 runs the full sweeps.

---

### Task 1: Worktree + the pure roll engine (`types` / `engine` / `parse`)

The F3-testable core: `resolveRoll` (2d10 + characteristic → tier/crit/edge-bane, four
modes) and `parseRollExpression`, both pure (no Obsidian, no DOM, no `Math.random` — RNG
injected). This is the module D7/D8 import when they need math without UI.

**Files:**
- Create: `src/framework/roll/types.ts`, `src/framework/roll/engine.ts`,
  `src/framework/roll/parse.ts`, `test/unit/framework/roll-engine.test.ts`,
  `test/unit/framework/roll-parse.test.ts`

**Interfaces:**
- Consumes: nothing (pure leaf modules).
- Produces: `RollMode`/`RollTier`/`CharacteristicName`/`DiceSource`/`RollInput`/`RollResult`
  (spec §2.1, `tierShifted` widened per OD-D5-11); `resolveRoll(input, dice)` (spec §2.2
  algorithm, normative); `ParsedRollExpression` + `parseRollExpression(expr)` (spec §2.5).

- [ ] **Step 0: Create the worktree + install + baseline**

From `/home/scott/code/steelCompendium/workspace`:

```bash
devbox run -- bash -c "just wt-new d5-rolling; echo EXIT=$?"
devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/d5-rolling/draw-steel-elements && npm ci && npx tsc --noEmit; echo EXIT=$?"
devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/d5-rolling/draw-steel-elements && npx jest 2>&1 | tail -3; echo EXIT=$?"
```

Expected: `EXIT=0` each; jest tail shows `Tests: 1037 passed`. All subsequent steps run in
this worktree.

- [ ] **Step 1: Write the failing engine tests**

Create `test/unit/framework/roll-engine.test.ts`:

```ts
// Plan 14 Task 1 (D5 §1/§2/§8) — the pure roll engine. Seeded DiceSource replays
// exact faces; every row of the spec §8 matrices is pinned. No DOM, no Obsidian.
import { resolveRoll } from '../../../src/framework/roll/engine';
import type { DiceSource, RollInput } from '../../../src/framework/roll/types';

/** Seeded dice: replays `faces` in order; throws if the engine over-draws. */
function seeded(faces: number[]): DiceSource {
	let i = 0;
	return {
		rollDie: (sides: number): number => {
			if (i >= faces.length) throw new Error('seeded DiceSource exhausted');
			const face = faces[i++];
			if (face < 1 || face > sides) throw new Error(`seeded face ${face} out of 1..${sides}`);
			return face;
		},
	};
}

const roll = (input: Partial<RollInput>, faces: number[]) =>
	resolveRoll({ mode: 'power-roll', ...input }, seeded(faces));

describe('D5 §8.1 — core tier bands (power-roll)', () => {
	// [dice, characteristic, isMainActionAbility, expect: {natural,total,tier,isNat,isCritical}]
	test.each([
		[[1, 1], 0, false, { natural: 2, total: 2, tier: 1, isNat: false, isCritical: false }],
		[[5, 6], 0, false, { natural: 11, total: 11, tier: 1, isNat: false, isCritical: false }],
		[[5, 6], 1, false, { natural: 11, total: 12, tier: 2, isNat: false, isCritical: false }],
		[[8, 8], 0, false, { natural: 16, total: 16, tier: 2, isNat: false, isCritical: false }],
		[[8, 9], 0, false, { natural: 17, total: 17, tier: 3, isNat: false, isCritical: false }],
		[[9, 10], 0, false, { natural: 19, total: 19, tier: 3, isNat: true, isCritical: false }],
		[[9, 10], 0, true, { natural: 19, total: 19, tier: 3, isNat: true, isCritical: true }],
		// THE key nat assertion: total 15 would be tier 2; nat 20 forces tier 3.
		[[10, 10], -5, true, { natural: 20, total: 15, tier: 3, isNat: true, isCritical: true }],
	])('dice %j char %i main:%s → %j', (dice, characteristic, isMainActionAbility, expected) => {
		const r = roll({ characteristic, isMainActionAbility }, dice);
		expect(r.natural).toBe(expected.natural);
		expect(r.total).toBe(expected.total);
		expect(r.tier).toBe(expected.tier);
		expect(r.isNat).toBe(expected.isNat);
		expect(r.isCritical).toBe(expected.isCritical);
		expect(r.dice).toEqual(dice);
	});
});

describe('D5 §8.2 — edges & banes (single = flat, double = shift, cancel, caps)', () => {
	// [edges, banes, dice, expect {net, edgeBaneFlat, total, tier}]
	test.each([
		[1, 0, [5, 6], { net: 1, edgeBaneFlat: 2, total: 13, tier: 2 }],   // single edge = +2
		[0, 1, [5, 6], { net: -1, edgeBaneFlat: -2, total: 9, tier: 1 }],  // single bane = −2
		[2, 0, [5, 6], { net: 2, edgeBaneFlat: 0, total: 11, tier: 2 }],   // double edge: band 1 → shift → 2
		[0, 2, [8, 8], { net: -2, edgeBaneFlat: 0, total: 16, tier: 1 }],  // double bane: band 2 → shift → 1
		[3, 1, [5, 6], { net: 1, edgeBaneFlat: 2, total: 13, tier: 2 }],   // 3e−1b: cap sides at 2 FIRST → double edge − one bane = ONE edge (+2 flat) [AMENDED: rulebook cap-before-cancel; Plan-14 Task-1 review]
		[2, 2, [5, 6], { net: 0, edgeBaneFlat: 0, total: 11, tier: 1 }],   // full cancel
		[1, 2, [8, 9], { net: -1, edgeBaneFlat: -2, total: 15, tier: 2 }], // net −1: flat, not shift
		[2, 0, [10, 9], { net: 2, edgeBaneFlat: 0, total: 19, tier: 3 }],  // double edge on nat19: clamp at 3
		[0, 2, [10, 10], { net: -2, edgeBaneFlat: 0, total: 20, tier: 3 }],// double bane on nat20: nat overrides → 3
	])('edges %i banes %i dice %j → %j', (edges, banes, dice, expected) => {
		const r = roll({ edges, banes }, dice);
		expect(r.net).toBe(expected.net);
		expect(r.edgeBaneFlat).toBe(expected.edgeBaneFlat);
		expect(r.total).toBe(expected.total);
		expect(r.tier).toBe(expected.tier);
	});

	test('tierShifted is tier − base (double bane on nat20: base 3, shift −1, nat forces 3 back ⇒ 0)', () => {
		expect(roll({ edges: 0, banes: 2 }, [10, 10]).tierShifted).toBe(0);
		expect(roll({ edges: 2, banes: 0 }, [5, 6]).tierShifted).toBe(1);
		expect(roll({ edges: 0, banes: 2 }, [8, 8]).tierShifted).toBe(-1);
		// nat override can exceed ±1 (OD-D5-11: the reason tierShifted is a number)
		expect(roll({ characteristic: -5, isMainActionAbility: true }, [10, 10]).tierShifted).toBe(1); // base 2 → 3
	});
});

describe('D5 §8.3 — modes', () => {
	test('test mode: same bands, isNat on 19–20, NEVER critical (even main-action)', () => {
		const r = roll({ mode: 'test', isMainActionAbility: true }, [9, 10]);
		expect(r.tier).toBe(3);
		expect(r.isNat).toBe(true);
		expect(r.isCritical).toBe(false);
	});

	test('opposed: no tier; single edge/bane ±2', () => {
		const r = roll({ mode: 'opposed', edges: 1 }, [5, 6]);
		expect(r.tier).toBeUndefined();
		expect(r.edgeBaneFlat).toBe(2);
		expect(r.total).toBe(13);
	});

	test('opposed: DOUBLE edge/bane become flat ±4 (no shift)', () => {
		expect(roll({ mode: 'opposed', edges: 2 }, [5, 6]).edgeBaneFlat).toBe(4);
		expect(roll({ mode: 'opposed', banes: 3 }, [5, 6]).edgeBaneFlat).toBe(-4);
		expect(roll({ mode: 'opposed', edges: 2 }, [5, 6]).total).toBe(15);
	});

	test('flat: sums faces + bonus; no tier/crit; seeded [4] on 1d6+2 ⇒ 6', () => {
		const r = roll({ mode: 'flat', flat: { count: 1, sides: 6, bonus: 2 } }, [4]);
		expect(r.natural).toBe(4);
		expect(r.total).toBe(6);
		expect(r.tier).toBeUndefined();
		expect(r.isNat).toBe(false);
		expect(r.isCritical).toBe(false);
	});

	test('flat: edges/banes are IGNORED (edgeBaneFlat 0)', () => {
		const r = roll({ mode: 'flat', edges: 2, banes: 1, flat: { count: 2, sides: 6 } }, [3, 5]);
		expect(r.edgeBaneFlat).toBe(0);
		expect(r.total).toBe(8);
	});

	test('flat: multi-die expressions draw count faces of the right sides', () => {
		const r = roll({ mode: 'flat', flat: { count: 3, sides: 4, bonus: 1 } }, [1, 4, 2]);
		expect(r.dice).toEqual([1, 4, 2]);
		expect(r.total).toBe(8);
	});
});

describe('D5 §2.2 — totality / clamping (no throws for junk input)', () => {
	test('negative edge/bane counts clamp to 0 (never invert)', () => {
		const r = roll({ edges: -3, banes: -1 }, [5, 6]);
		expect(r.net).toBe(0);
		expect(r.edgeBaneFlat).toBe(0);
	});

	test('flat with a zero/absent dice spec still resolves (defaults 1d10, bonus 0)', () => {
		const r = roll({ mode: 'flat' }, [7]);
		expect(r.total).toBe(7);
	});
});

describe('D5 §8.5 — property/fuzz (seeded PRNG, deterministic)', () => {
	test('for all faces/char/edges/banes: tier ∈ {1,2,3}, nat19–20 ⇒ tier 3, never throws', () => {
		// Tiny LCG so the sweep is deterministic across runs.
		let s = 42;
		const rnd = (n: number) => ((s = (s * 1103515245 + 12345) % 2147483648), s % n);
		for (let i = 0; i < 2000; i++) {
			const d1 = 1 + rnd(10), d2 = 1 + rnd(10);
			const input: RollInput = {
				mode: 'power-roll',
				characteristic: rnd(11) - 5,
				edges: rnd(4),
				banes: rnd(4),
				isMainActionAbility: rnd(2) === 1,
			};
			const r = resolveRoll(input, seeded([d1, d2]));
			expect([1, 2, 3]).toContain(r.tier);
			if (d1 + d2 >= 19) expect(r.tier).toBe(3);
			expect(r.natural).toBe(d1 + d2);
		}
	});
});

describe('D5 §3.5 — breakdown string (every number traceable)', () => {
	test('power-roll breakdown names faces, modifiers, and total', () => {
		const r = roll({ characteristic: 2, skillBonus: 2, edges: 1 }, [8, 9]);
		expect(r.breakdown).toBe('2d10 [8, 9] = 17, +2 characteristic, +2 skill, +2 edge → 23');
	});

	test('double-edge breakdown says the shift, not a flat bonus', () => {
		const r = roll({ edges: 2 }, [5, 6]);
		expect(r.breakdown).toBe('2d10 [5, 6] = 11, double edge → tier +1 → 11');
	});
});
```

Run: `npx jest test/unit/framework/roll-engine.test.ts` → FAIL (module missing).

- [ ] **Step 2: Write the failing parser tests**

Create `test/unit/framework/roll-parse.test.ts`:

```ts
// Plan 14 Task 1 (D5 §2.5/§8.4) — the lenient, pure roll-expression parser.
import { parseRollExpression } from '../../../src/framework/roll/parse';

test('"Power Roll + Reason" → power-roll + reason keyword', () => {
	expect(parseRollExpression('Power Roll + Reason')).toEqual({
		mode: 'power-roll', characteristic: 'reason', raw: 'Power Roll + Reason',
	});
});

test('"2d10 + 5" → power-roll, flatBonus 5, explicit dice', () => {
	expect(parseRollExpression('2d10 + 5')).toEqual({
		mode: 'power-roll', flatBonus: 5, dice: { count: 2, sides: 10 }, raw: '2d10 + 5',
	});
});

test('"Might test" → test mode + might', () => {
	expect(parseRollExpression('Might test')).toEqual({
		mode: 'test', characteristic: 'might', raw: 'Might test',
	});
});

test('"1d6 + 3" → dice {1,6} + flatBonus 3', () => {
	expect(parseRollExpression('1d6 + 3')).toEqual({
		mode: 'power-roll', flatBonus: 3, dice: { count: 1, sides: 6 }, raw: '1d6 + 3',
	});
});

test('characteristic keyword wins over a trailing "+ N" (never both)', () => {
	// "Power Roll + Might" must NOT read "+ might" as a number, and a real ability
	// like "Power Roll + Might or Agility" still yields the FIRST keyword.
	expect(parseRollExpression('Power Roll + Might or Agility')).toEqual({
		mode: 'power-roll', characteristic: 'might', raw: 'Power Roll + Might or Agility',
	});
});

test('case-insensitive keywords', () => {
	expect(parseRollExpression('power roll + INTUITION').characteristic).toBe('intuition');
});

test('garbage → { mode: "power-roll", raw } and never throws', () => {
	expect(parseRollExpression('¯\\_(ツ)_/¯')).toEqual({ mode: 'power-roll', raw: '¯\\_(ツ)_/¯' });
	expect(parseRollExpression('')).toEqual({ mode: 'power-roll', raw: '' });
});
```

- [ ] **Step 3: Write `src/framework/roll/types.ts` (complete)**

```ts
// Plan 14 Task 1 (D5 §2.1) — the roll engine's type surface. PURE: no Obsidian,
// no DOM. D7/D8 import these when they need roll math without UI.
//
// Reconciliation (OD-D5-11): the spec typed `tierShifted: 0 | 1 | -1` but its own
// algorithm assigns `3 - base` on a nat-19–20 override (up to +2) — widened to
// `number`, documented as `tier - base` (−2..+2), an audit/animation delta only.

export type RollMode = 'power-roll' | 'test' | 'opposed' | 'flat';
export type RollTier = 1 | 2 | 3;
export type CharacteristicName = 'might' | 'agility' | 'reason' | 'intuition' | 'presence';

/** Deterministic, injectable dice source. Returns 1..sides. */
export interface DiceSource {
	/** One die. Real impl: 1 + Math.floor(Math.random() * sides). */
	rollDie(sides: number): number;
}

/** Arbitrary dice expression for mode "flat" (damage, saving throws, bleeding). */
export interface FlatDice {
	count: number;
	sides: number;
	bonus?: number;
}

/** Fully-specified, already-numeric roll request. Pure — no strings, no UI. */
export interface RollInput {
	mode: RollMode; // D5 §1.5
	/** Characteristic score already resolved to a number (−5..+5). Omit ⇒ 0. */
	characteristic?: number;
	/** +2 when an applicable skill is used. Omit ⇒ 0. */
	skillBonus?: number;
	/** Any other flat modifiers (feature bonuses, situational +/−). Omit ⇒ 0. */
	flatBonus?: number;
	/** Raw counts; the engine cancels & caps (D5 §1.3). Omit ⇒ 0. */
	edges?: number;
	banes?: number;
	/** Enables the critical-hit flag in power-roll mode (D5 §1.4). Default false. */
	isMainActionAbility?: boolean;
	/** Mode "flat" only: the dice expression. Tiered modes are always 2d10. */
	flat?: FlatDice;
}

export interface RollResult {
	input: RollInput; // echoed for history/re-roll
	dice: number[]; // individual faces rolled, in draw order
	natural: number; // sum of faces BEFORE any modifier (nat-19–20 source)
	/** Net edges after cancel, clamped to −2..+2 (±2 = double). */
	net: number;
	/** Flat modifier applied from edges/banes: ±2 single, 0 double (±4 opposed double). */
	edgeBaneFlat: number;
	total: number; // final number (all modes)
	tier?: RollTier; // power-roll & test only; absent for opposed/flat
	/** tier − base band (−2..+2): double-shift and/or nat-override audit delta. */
	tierShifted: number;
	isNat: boolean; // natural 19–20 (2d10 modes only)
	isCritical: boolean; // isNat && power-roll && main-action ability
	breakdown: string; // human-readable trace for the result card
}
```

- [ ] **Step 4: Write `src/framework/roll/engine.ts` (complete)**

```ts
// Plan 14 Task 1 (D5 §2.2) — resolveRoll: the normative Draw Steel roll math.
// PURE + TOTAL: deterministic given `dice`, clamps out-of-range counts, no
// throws for junk numeric input, no Math.random, no wall clock, no DOM. This is
// the ONE place tiers/edges/banes/crits are computed — D7/D8 import it; a
// regression here is a bug against this module's tests, never re-derived.
//
// Rules provenance (D5 §1): 2d10 + characteristic; tiers ≤11 / 12–16 / 17+;
// single edge/bane = flat ±2, double = tier shift ±1 (opposed: flat ±4 instead);
// natural 19–20 (the SUM, before modifiers) always tier 3 — overriding even a
// double bane — and crits only on main-action ability power rolls.
import type { DiceSource, RollInput, RollResult, RollTier } from './types';

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** Resolve one roll. Draws from `dice` (2 faces for tiered modes; `flat.count` for flat). */
export function resolveRoll(input: RollInput, dice: DiceSource): RollResult {
	const tiered = input.mode !== 'flat';

	// 1. Roll dice.
	const faces: number[] = [];
	if (tiered) {
		faces.push(dice.rollDie(10), dice.rollDie(10));
	} else {
		const count = Math.max(1, Math.trunc(input.flat?.count ?? 1));
		const sides = Math.max(2, Math.trunc(input.flat?.sides ?? 10));
		for (let i = 0; i < count; i++) faces.push(dice.rollDie(sides));
	}
	const natural = faces.reduce((sum, face) => sum + face, 0);

	// 2. Net edges/banes: cancel 1-for-1, cap magnitude at 2 (D5 §1.3).
	const edges = Math.max(0, Math.trunc(input.edges ?? 0));
	const banes = Math.max(0, Math.trunc(input.banes ?? 0));
	const net = Math.min(edges, 2) - Math.min(banes, 2); // cap-before-cancel (rulebook; AMENDED per Task-1 review)

	// 3. Flat portion of edge/bane (mode-dependent; doubles shift instead — step 5).
	let edgeBaneFlat = 0;
	if (input.mode === 'opposed') {
		edgeBaneFlat = net === 2 ? 4 : net === -2 ? -4 : 2 * net; // double = ±4, single = ±2
	} else if (tiered) {
		edgeBaneFlat = Math.abs(net) >= 2 ? 0 : 2 * net; // double = no flat; single = ±2
	} // flat mode: edges/banes ignored entirely.

	// 4. Total.
	const total =
		natural +
		(input.characteristic ?? 0) +
		(input.skillBonus ?? 0) +
		(input.flatBonus ?? 0) +
		edgeBaneFlat +
		(input.mode === 'flat' ? input.flat?.bonus ?? 0 : 0);

	// 5-6. Tier (power-roll & test only) + nat detection.
	const isNat = tiered && natural >= 19;
	let tier: RollTier | undefined;
	let tierShifted = 0;
	if (input.mode === 'power-roll' || input.mode === 'test') {
		const base = (total <= 11 ? 1 : total <= 16 ? 2 : 3) as RollTier;
		const shift = net === 2 ? 1 : net === -2 ? -1 : 0;
		tier = clamp(base + shift, 1, 3) as RollTier;
		if (isNat) tier = 3; // nat 19–20 ALWAYS tier 3, overriding shifts (D5 §1.4)
		tierShifted = tier - base;
	}

	// 7. Crit: nat + power-roll + main-action ability, nothing else (D5 §1.4).
	const isCritical = isNat && input.mode === 'power-roll' && input.isMainActionAbility === true;

	return {
		input,
		dice: faces,
		natural,
		net,
		edgeBaneFlat,
		total,
		tier,
		tierShifted,
		isNat,
		isCritical,
		breakdown: renderBreakdown(input, faces, natural, net, edgeBaneFlat, tierShifted, total),
	};
}

/** Human-readable trace: every number in `total` accounted for, in apply order. */
function renderBreakdown(
	input: RollInput,
	faces: number[],
	natural: number,
	net: number,
	edgeBaneFlat: number,
	tierShifted: number,
	total: number,
): string {
	const sides = input.mode === 'flat' ? Math.max(2, Math.trunc(input.flat?.sides ?? 10)) : 10;
	const parts: string[] = [`${faces.length}d${sides} [${faces.join(', ')}] = ${natural}`];
	const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);
	if (input.characteristic) parts.push(`${signed(input.characteristic)} characteristic`);
	if (input.skillBonus) parts.push(`${signed(input.skillBonus)} skill`);
	if (input.flatBonus) parts.push(`${signed(input.flatBonus)} bonus`);
	if (input.mode === 'flat' && input.flat?.bonus) parts.push(`${signed(input.flat.bonus)} bonus`);
	if (edgeBaneFlat !== 0) {
		parts.push(`${signed(edgeBaneFlat)} ${net > 0 ? 'edge' : 'bane'}`);
	} else if (Math.abs(net) === 2) {
		parts.push(
			input.mode === 'opposed'
				? `double ${net > 0 ? 'edge' : 'bane'}`
				: `double ${net > 0 ? 'edge' : 'bane'} → tier ${net > 0 ? '+1' : '−1'}`,
		);
	}
	return `${parts.join(', ')} → ${total}`;
}
```

Note the two breakdown pins in Step 1 are exact-string — if you adjust wording here, adjust
the pins to match (they exist to freeze the format, not to be decorative).

- [ ] **Step 5: Write `src/framework/roll/parse.ts` (complete)**

```ts
// Plan 14 Task 1 (D5 §2.5) — the lenient roll-expression parser. Ability YAML
// stores free text ("Power Roll + Reason", "2d10 + 5", "Might test"); this maps
// it to a partial roll shape. PURE, total (garbage → power-roll passthrough).
// A pure module export, NOT a RollService method (OD-D5-10).
import type { CharacteristicName, RollMode } from './types';

export interface ParsedRollExpression {
	/** "test" iff the word test appears; else "power-roll". */
	mode: RollMode;
	/** FIRST matched characteristic keyword — labels/binds the stepper, never a value. */
	characteristic?: CharacteristicName;
	/** Trailing "+ N" when NO characteristic keyword matched. */
	flatBonus?: number;
	/** Explicit "NdM" when present; tiered rolls default 2d10 without it. */
	dice?: { count: number; sides: number };
	raw: string;
}

const CHARACTERISTICS: readonly CharacteristicName[] = [
	'might',
	'agility',
	'reason',
	'intuition',
	'presence',
];

/** Parse an ability/`ds-roll` `roll:` string. Never throws. */
export function parseRollExpression(expr: string): ParsedRollExpression {
	const raw = expr;
	const lower = expr.toLowerCase();
	const out: ParsedRollExpression = {
		mode: /\btest\b/.test(lower) ? 'test' : 'power-roll',
		raw,
	};
	for (const ch of CHARACTERISTICS) {
		if (new RegExp(`\\b${ch}\\b`).test(lower)) {
			out.characteristic = ch;
			break; // first keyword wins ("Might or Agility" → might; the UI labels one stepper)
		}
	}
	const dice = lower.match(/\b(\d+)\s*d\s*(\d+)\b/);
	if (dice) out.dice = { count: parseInt(dice[1], 10), sides: parseInt(dice[2], 10) };
	if (!out.characteristic) {
		const bonus = lower.match(/\+\s*(\d+)\s*$/);
		if (bonus) out.flatBonus = parseInt(bonus[1], 10);
	}
	return out;
}
```

- [ ] **Step 6: Gates**

Run: `npx jest test/unit/framework/roll-engine.test.ts test/unit/framework/roll-parse.test.ts`
→ **36 PASS** (29 engine + 7 parser).
Run: `npx tsc --noEmit` → 0.
Run: `npx jest` → expected **1073** (1037 + 36).

- [ ] **Step 7: Commit + push**

```bash
git add src/framework/roll/ test/unit/framework/roll-engine.test.ts test/unit/framework/roll-parse.test.ts
git commit -m "feat(roll): pure Draw Steel roll engine + expression parser (D5)"
git push origin d5-rolling
```

---

### Task 2: `RollService` + Dice Roller bridge + the `cx.roll` seam wiring

Fills the F1-era stub: the real `RollService` interface (RNG source + delegate selection),
the feature-detected Dice Roller bridge, construction in `initializeElementFrameworkV2`,
delivery through `ElementPipelineDeps` → `createRenderContext` → `cx.roll`. Un-hides the
`rollerEngine` settings row (its consumer now exists).

**Files:**
- Create: `src/framework/roll/service.ts`, `src/framework/roll/diceBridge.ts`,
  `test/dom/framework/roll-service.test.ts`
- Modify: `src/framework/context.ts` (stub → re-export of the real interface),
  `src/framework/pipeline.ts` (deps + context pass-through), `main.ts` (construct + bundle),
  `src/prefs/catalog.ts` (un-hide `rollerEngine` + help text)

**Interfaces:**
- Consumes: `resolveRoll` (Task 1), `PreferenceStore.get('rollerEngine')` (D4 catalog),
  `App` (bridge detection only — `(app as …).plugins`, dynamic, no import of the other
  plugin).
- Produces: `RollService { resolve, roll, dice, delegate }` (spec §2.3, minus
  `parseRollExpression` — OD-D5-10); `createRollService(prefs, app?)`;
  `DiceBridge`/`detectDiceRoller(app)` (spec §6.1, capability-based, null on any failure);
  `NATIVE_DICE`. `ElementPipelineDeps.roll` (required — the few direct pipeline
  constructors in tests get one line each); `RenderContext.roll` stays OPTIONAL (`roll?:`)
  so no `createRenderContext` caller breaks, but the pipeline now always supplies it.

- [ ] **Step 1: Write the failing tests**

Create `test/dom/framework/roll-service.test.ts`:

```ts
// Plan 14 Task 2 (D5 §2.3/§6) — RollService: native RNG, pref-gated Dice Roller
// delegation (capability-detected, never a dependency, always falls back), and
// the cx.roll seam. The dom project supplies the obsidian mock.
import { createRollService, NATIVE_DICE } from '../../../src/framework/roll/service';
import { detectDiceRoller } from '../../../src/framework/roll/diceBridge';
import { createPreferenceStore } from '../../../src/framework/seams/prefs';
import type { PrefsStorage, PreferenceStore } from '../../../src/framework/seams/prefs';
import { DSE_PREF_DESCRIPTORS } from '../../../src/prefs/catalog';
import { prefUi } from '../../../src/prefs/catalog';
import type { DiceSource } from '../../../src/framework/roll/types';
import type { App } from 'obsidian';

function makeStore(): PreferenceStore {
	const storage: PrefsStorage = { get: async () => undefined, set: async () => {} };
	const store = createPreferenceStore(storage);
	store.describe(DSE_PREF_DESCRIPTORS);
	return store;
}

/** Fake app.plugins shape (Obsidian's is untyped/private — the bridge reads it dynamically). */
function makeApp(api: unknown, enabled = true): App {
	return {
		plugins: {
			enabledPlugins: new Set(enabled ? ['obsidian-dice-roller'] : []),
			plugins: { 'obsidian-dice-roller': api === undefined ? undefined : { api } },
		},
	} as unknown as App;
}

const seeded = (faces: number[]): DiceSource => {
	let i = 0;
	return { rollDie: () => faces[i++] };
};

describe('D5 §2.3 — native service', () => {
	test('NATIVE_DICE stays in 1..sides across a sweep', () => {
		for (let i = 0; i < 500; i++) {
			const face = NATIVE_DICE.rollDie(10);
			expect(face).toBeGreaterThanOrEqual(1);
			expect(face).toBeLessThanOrEqual(10);
			expect(Number.isInteger(face)).toBe(true);
		}
	});

	test('resolve() uses caller-supplied dice (pure path re-exposed)', () => {
		const service = createRollService(makeStore());
		const r = service.resolve({ mode: 'power-roll' }, seeded([9, 10]));
		expect(r.natural).toBe(19);
		expect(r.isNat).toBe(true);
	});

	test('roll() resolves asynchronously with the native source by default', async () => {
		const service = createRollService(makeStore());
		expect(service.delegate).toBe('native');
		const r = await service.roll({ mode: 'power-roll' });
		expect(r.dice).toHaveLength(2);
		expect(r.natural).toBeGreaterThanOrEqual(2);
		expect(r.natural).toBeLessThanOrEqual(20);
	});
});

describe('D5 §6.1 — detectDiceRoller (capability-based, null on any failure)', () => {
	test('plugin not enabled → null', () => {
		expect(detectDiceRoller(makeApp({ roll: async () => 4 }, false))).toBeNull();
	});

	test('api missing or without a roll function → null', () => {
		expect(detectDiceRoller(makeApp(undefined))).toBeNull();
		expect(detectDiceRoller(makeApp({ roll: 'not-a-function' }))).toBeNull();
	});

	test('throwing plugins accessor → null (never propagates)', () => {
		const app = {
			get plugins(): never {
				throw new Error('boom');
			},
		} as unknown as App;
		expect(detectDiceRoller(app)).toBeNull();
	});

	test('capable api → a bridge that returns per-die faces', async () => {
		const rolls: string[] = [];
		const bridge = detectDiceRoller(
			makeApp({ roll: async (formula: string) => (rolls.push(formula), 7) }),
		);
		expect(bridge).not.toBeNull();
		await expect(bridge!.rollDice(2, 10)).resolves.toEqual([7, 7]);
		expect(rolls).toEqual(['1d10', '1d10']); // per-die so natural/nat-19–20 stay exact (§6.2)
	});

	test('a { result: n } payload is unwrapped; junk payloads throw inside the bridge', async () => {
		const bridge = detectDiceRoller(makeApp({ roll: async () => ({ result: 3 }) }));
		await expect(bridge!.rollDice(1, 10)).resolves.toEqual([3]);
		const bad = detectDiceRoller(makeApp({ roll: async () => 'NaN-city' }));
		await expect(bad!.rollDice(1, 10)).rejects.toThrow();
	});
});

describe('D5 §6.3 — delegation is pref-gated and always falls back', () => {
	test('pref native → native even when the plugin is detected', async () => {
		const service = createRollService(makeStore(), makeApp({ roll: async () => 5 }));
		expect(service.delegate).toBe('native');
	});

	test('pref dice-roller + detected → delegate reported, faces come from the bridge', async () => {
		const store = makeStore();
		await store.set('rollerEngine', 'dice-roller');
		const service = createRollService(store, makeApp({ roll: async () => 5 }));
		expect(service.delegate).toBe('dice-roller');
		const r = await service.roll({ mode: 'power-roll' });
		expect(r.dice).toEqual([5, 5]);
		expect(r.natural).toBe(10);
	});

	test('pref dice-roller but NOT detected → transparent native fallback', async () => {
		const store = makeStore();
		await store.set('rollerEngine', 'dice-roller');
		const service = createRollService(store, makeApp(undefined));
		expect(service.delegate).toBe('native');
		const r = await service.roll({ mode: 'power-roll' });
		expect(r.dice).toHaveLength(2);
	});

	test('a bridge that starts THROWING mid-session → next roll() falls back to native', async () => {
		const store = makeStore();
		await store.set('rollerEngine', 'dice-roller');
		const service = createRollService(
			store,
			makeApp({ roll: async () => { throw new Error('bridge broke'); } }),
		);
		const r = await service.roll({ mode: 'power-roll' }); // must not reject (§6: can never break rolling)
		expect(r.dice).toHaveLength(2);
	});

	test('flat mode draws flat.count dice of flat.sides through the bridge', async () => {
		const store = makeStore();
		await store.set('rollerEngine', 'dice-roller');
		const formulas: string[] = [];
		const service = createRollService(
			store,
			makeApp({ roll: async (f: string) => (formulas.push(f), 2) }),
		);
		const r = await service.roll({ mode: 'flat', flat: { count: 3, sides: 6, bonus: 1 } });
		expect(formulas).toEqual(['1d6', '1d6', '1d6']);
		expect(r.total).toBe(7);
	});
});

describe('catalog: rollerEngine row is now visible (D5 shipped its consumer)', () => {
	test('rollerEngine ui.hidden is gone', () => {
		const d = DSE_PREF_DESCRIPTORS.find((x) => (x.key as string) === 'rollerEngine')!;
		expect(prefUi(d)!.hidden).toBeUndefined();
	});
});
```

Run: `npx jest test/dom/framework/roll-service.test.ts` → FAIL (modules missing).

- [ ] **Step 2: Write `src/framework/roll/diceBridge.ts` (complete)**

```ts
// Plan 14 Task 2 (D5 §6) — the OPTIONAL Dice Roller bridge. DSE delegates ONLY
// the raw dice (per-die 1dN formulas so faces — and nat-19–20 — stay exact);
// tier/crit/edge-bane resolution always stays in resolveRoll. No import of the
// other plugin, no package.json entry: capability detection over app.plugins at
// call time, null on ANY failure (missing, disabled, shape drift, throw). The
// service treats a null/throwing bridge as "use native" — the bridge can never
// break rolling (§6.1).
import type { App } from 'obsidian';

/** Async per-die source the service marries to the sync engine via face replay. */
export interface DiceBridge {
	/** Roll `count` × 1d`sides`; resolves the individual faces. */
	rollDice(count: number, sides: number): Promise<number[]>;
}

const DICE_ROLLER_ID = 'obsidian-dice-roller';

/** Untyped shape of Obsidian's private plugin registry (accessed dynamically). */
interface PluginsShape {
	enabledPlugins?: Set<string>;
	plugins?: Record<string, { api?: { roll?: (formula: string) => unknown } } | undefined>;
}

/**
 * Capability-based detection (never version-based): the plugin must be enabled
 * AND expose `api.roll(formula)`. A future API shift degrades to null → native.
 */
export function detectDiceRoller(app: App): DiceBridge | null {
	try {
		const plugins = (app as unknown as { plugins?: PluginsShape }).plugins;
		if (!plugins?.enabledPlugins?.has(DICE_ROLLER_ID)) return null;
		const api = plugins.plugins?.[DICE_ROLLER_ID]?.api;
		if (!api || typeof api.roll !== 'function') return null;
		const roll = api.roll.bind(api);
		return {
			async rollDice(count: number, sides: number): Promise<number[]> {
				const faces: number[] = [];
				for (let i = 0; i < count; i++) {
					// One die per call: some Dice Roller results only expose a total, and
					// DSE needs the individual faces (natural / nat-19–20, §6.2).
					const raw = await roll(`1d${sides}`);
					const value =
						typeof raw === 'number'
							? raw
							: typeof (raw as { result?: unknown } | null)?.result === 'number'
								? (raw as { result: number }).result
								: NaN;
					const face = Math.trunc(value);
					if (!Number.isFinite(face) || face < 1 || face > sides) {
						throw new Error(`Dice Roller bridge returned an unusable value: ${String(raw)}`);
					}
					faces.push(face);
				}
				return faces;
			},
		};
	} catch {
		return null;
	}
}
```

- [ ] **Step 3: Write `src/framework/roll/service.ts` (complete)**

```ts
// Plan 14 Task 2 (D5 §2.3/§6.3) — RollService: the plugin-scoped roll seam.
// Owns the ACTIVE dice source: native Math.random d10s, or (pref-gated,
// capability-detected) the Dice Roller bridge. The math itself is always
// resolveRoll — the bridge only supplies faces, which the service replays into
// the pure engine. Detection re-runs per roll (cheap: a Set lookup + property
// probe) so enabling/disabling Dice Roller mid-session Just Works and a broken
// bridge degrades to native on the very next roll (§6.3).
//
// History is NOT recorded here (reconciliation delta 8): the service has no
// blockKey — callers (the feature roll controller, RollView) write cx.session.
import type { App } from 'obsidian';
import type { PreferenceStore } from '../seams/prefs';
import type { DiceSource, RollInput, RollResult } from './types';
import { resolveRoll } from './engine';
import { detectDiceRoller } from './diceBridge';

export type RollDelegate = 'native' | 'dice-roller';

/** The interactive roll seam views reach via cx.roll (fills the F1 stub). */
export interface RollService {
	/** The pure math, re-exposed for callers who bring their own dice. */
	resolve(input: RollInput, dice?: DiceSource): RollResult;
	/** Roll now with the active source (native, or the Dice Roller bridge). */
	roll(input: RollInput): Promise<RollResult>;
	/** The always-available native source (tests/tools may want it explicitly). */
	readonly dice: DiceSource;
	/** What the NEXT roll() would use, honoring the rollerEngine pref + live detection. */
	readonly delegate: RollDelegate;
}

/** The in-repo RNG (OD table: no dependency). 1..sides, uniform. */
export const NATIVE_DICE: DiceSource = {
	rollDie: (sides: number): number => 1 + Math.floor(Math.random() * sides),
};

/** Replays pre-rolled faces into the sync engine (bridge → resolveRoll marriage). */
function replaySource(faces: readonly number[]): DiceSource {
	let i = 0;
	return { rollDie: (): number => faces[i++] ?? 1 };
}

class DseRollService implements RollService {
	readonly dice = NATIVE_DICE;

	constructor(
		private readonly prefs: PreferenceStore,
		private readonly app?: App,
	) {}

	get delegate(): RollDelegate {
		return this.activeBridge() ? 'dice-roller' : 'native';
	}

	resolve(input: RollInput, dice: DiceSource = NATIVE_DICE): RollResult {
		return resolveRoll(input, dice);
	}

	async roll(input: RollInput): Promise<RollResult> {
		const bridge = this.activeBridge();
		if (bridge) {
			try {
				const count = input.mode === 'flat' ? Math.max(1, Math.trunc(input.flat?.count ?? 1)) : 2;
				const sides = input.mode === 'flat' ? Math.max(2, Math.trunc(input.flat?.sides ?? 10)) : 10;
				const faces = await bridge.rollDice(count, sides);
				return resolveRoll(input, replaySource(faces));
			} catch (error) {
				// The bridge can never break rolling (§6): log once, fall through to native.
				console.warn('Draw Steel Elements: Dice Roller bridge failed; rolling natively.', error);
			}
		}
		return resolveRoll(input, NATIVE_DICE);
	}

	/** The bridge, iff the pref asks for it AND detection succeeds right now. */
	private activeBridge() {
		if (this.prefs.get('rollerEngine') !== 'dice-roller') return null;
		return this.app ? detectDiceRoller(this.app) : null;
	}
}

/** Construct the roll seam. `app` optional: without it (tests/harness) the
 *  service is native-only — detection needs the live plugin registry. */
export function createRollService(prefs: PreferenceStore, app?: App): RollService {
	return new DseRollService(prefs, app);
}
```

- [ ] **Step 4: `context.ts` — the stub becomes a re-export**

In `src/framework/context.ts`:

(a) Delete the stub block (lines 19-25):

```ts
/**
 * Stub interface for roll service (D5 implementation).
 * Minimal/empty in F1 — D5 fills the contract.
 */
export interface RollService {
	// Placeholder for D5; intentionally empty for now.
}
```

and replace it with (keeping the import group tidy — put the import beside the other
seam imports, the re-export where the stub was):

```ts
import type { RollService } from './roll/service';

// D5 (Plan 14): the F1-era stub is gone — the REAL RollService lives in
// framework/roll/service.ts and is re-exported here so F1-era importers
// (view.ts's PanelHost) keep their './context' import path unchanged.
export type { RollService };
```

(b) Update the `roll` field docs (interface + factory arg keep `roll?: RollService` —
OPTIONAL stays, per OD-1):

```ts
	/** Roll service seam (D5) — supplied by the pipeline; optional so bare
	 *  createRenderContext callers (tests) stay valid. Views guard on absence. */
	readonly roll?: RollService;
```

(c) Update the file-header comment's "stub `RollService`" sentence to say the seam is
now real (D5) and re-exported from `./roll/service`.

- [ ] **Step 5: `pipeline.ts` — carry the seam**

In `src/framework/pipeline.ts`:

(a) Add the import:

```ts
import type { RollService } from './roll/service';
```

(b) `ElementPipelineServices` gains the member (after `session`):

```ts
	roll: RollService;
```

(c) In `run()`, destructure and pass it (the two lines change to):

```ts
		const { app, plugin, settings, theme, prefs, refs, validation, session, roll } = this.deps;

		// Step 1 (F1 §2.4): build the RenderContext for this block instance.
		const cx = createRenderContext({ app, plugin, settings, host, theme, prefs, refs, session, roll });
```

- [ ] **Step 6: `main.ts` — construct + bundle**

In `initializeElementFrameworkV2`, after `const refs = createReferenceService(app, settings);`:

```ts
	// D5 (Plan 14 Task 2): the roll seam — native RNG by default; the rollerEngine
	// pref + live capability detection can delegate raw dice to the Dice Roller
	// plugin (framework/roll/diceBridge.ts). Constructed after prefs (it reads them).
	const roll = createRollService(prefs, app);
```

Add `roll` to the pipeline deps and the returned bundle:

```ts
	const pipeline = new ElementPipeline({ app, plugin, settings, theme, prefs, refs, validation, session, roll });

	return {
		services: { validation, session, theme, prefs, refs, roll },
		registry,
		pipeline,
	};
```

`ElementFrameworkV2Services` gains the member + import:

```ts
import { createRollService } from '@/framework/roll/service';
import type { RollService } from '@/framework/roll/service';
```

```ts
export interface ElementFrameworkV2Services {
	validation: ValidationService;
	session: SessionStore;
	theme: ThemeService;
	prefs: PreferenceStore;
	refs: ReferenceService;
	roll: RollService;
}
```

- [ ] **Step 7: catalog — un-hide `rollerEngine`**

In `src/prefs/catalog.ts`, the `rollerEngine` descriptor loses `hidden: true` and gains
help (full replacement of that `d({...})` entry):

```ts
	d({
		key: 'rollerEngine', default: 'native',
		ui: {
			group: 'Rolling', label: 'Roller', control: 'select',
			help: 'Which engine rolls the dice. "Dice Roller plugin" delegates the raw dice to the community Dice Roller plugin when it is installed and enabled (Draw Steel tier/edge/bane math always stays native); it falls back to the built-in roller automatically.',
			options: [{ value: 'native', label: 'Draw Steel native' }, { value: 'dice-roller', label: 'Dice Roller plugin' }],
		},
	}),
```

Also update the section comment above the Rolling group from "rows hidden until it ships"
to reflect that D5 shipped (rollClickToRoll stays hidden until Task 4 — leave ITS
`hidden: true` untouched in this task).

- [ ] **Step 8: Fix direct pipeline constructors**

`ElementPipelineDeps.roll` is now required. Find every direct construction:

```bash
grep -rln "new ElementPipeline(" src/ test/ visual-harness/
```

For each test/harness deps-builder that doesn't go through `initializeElementFrameworkV2`
(expect: the shared harness deps in `visual-harness/entry.ts` (`makeHarnessDeps`), plus a
handful of test helpers like `test/dom/framework/pipeline.test.ts` and element suites that
assemble deps inline), add beside its `createPreferenceStore(...)`:

```ts
import { createRollService } from '../../src/framework/roll/service'; // adjust relative path

	roll: createRollService(prefs),
```

(`app` omitted deliberately — tests/harness are native-only.) Update the existing
catalog-hidden pin: `test/unit/prefs/catalog.test.ts` has a test asserting
`rollerEngine`/`rollClickToRoll`/`webLinkFallback` are all hidden — narrow it to
`['rollClickToRoll', 'webLinkFallback']` (Task 4 will narrow it again).

- [ ] **Step 9: Gates**

Run: `npx jest test/dom/framework/roll-service.test.ts` → **14 PASS**.
Run: `npx tsc --noEmit` → 0 (this is the gate that catches any missed
`ElementPipelineDeps` constructor).
Run: `npx jest` → expected **1087** (1073 + 14). If `plugin-wiring.test.ts` pins the
services-bundle shape, extend the expectation with `roll`.

- [ ] **Step 10: Commit + push**

```bash
git add src/framework/roll/ src/framework/context.ts src/framework/pipeline.ts main.ts src/prefs/catalog.ts test/dom/framework/roll-service.test.ts test/unit/prefs/catalog.test.ts visual-harness/entry.ts
git commit -m "feat(roll): RollService seam + feature-detected Dice Roller bridge (D5)"
git push origin d5-rolling
```

(Also `git add` any test helpers Step 8 touched.)

---

### Task 3: Kit widgets — `rollBar`, `rollResultCard`, `powerRollPanel.setRollResult`

The reusable pre-roll modifier bar (spec §4), the post-roll result card (spec §3.5), and
the additive highlight channel on the existing tier panel (spec §3.4, reconciled to the
built `.dse-pr__row` DOM). Kit stays cx-free (kit⊥elements): both widgets take options +
`owner`, emit plain state — no session, no service, no Obsidian beyond `Component`/`setIcon`.
**Zero new tokens** (OD-D5-9).

**Files:**
- Create: `src/framework/kit/rollBar.ts`, `src/framework/kit/rollResultCard.ts`,
  `test/dom/kit/rollBar.test.ts`, `test/dom/kit/rollResultCard.test.ts`
- Modify: `src/framework/kit/powerRollPanel.ts` (additive `setRollResult`),
  `src/framework/kit/index.ts` (barrel), `styles-source.css` (roll UI rules, tokens only),
  `test/dom/kit/powerRollPanel.test.ts` (new describe block), `test/dom/kit/kit-index.test.ts`
  (barrel completeness pin — check how it enumerates and extend)

**Interfaces:**
- Consumes: kit `stepper`/`iconButton`/`buttonRow`, `RollInput`/`RollResult`/`RollMode`
  types (Task 1), existing `--dse-*` tokens.
- Produces: `RollBarState { characteristic, skillBonus, edges, banes, mainAction }`;
  `rollBar(parent, opts, owner) → RollBarHandle { rootEl, getState, setState }`;
  `rollResultCard(parent, opts, owner) → RollResultCardHandle { rootEl }`;
  `PowerRollPanelHandle.setRollResult(active | null)` — sets
  `data-dse-roll-result="active|dimmed"` on rows / clears all (never touches
  `aria-checked`, `tabindex`, or any selectable-mode state).

- [ ] **Step 1: Write the failing tests**

Create `test/dom/kit/rollBar.test.ts`:

```ts
// Plan 14 Task 3 (D5 §4) — the edge/bane resolver bar: steppers + toggles emit a
// RollBarState; the net-effect label mirrors §1.3 live (single = flat, double =
// shift, cancel); the bar carries NO DS math (it defers to resolveRoll).
import { rollBar } from '../../../src/framework/kit/rollBar';
import type { RollBarState } from '../../../src/framework/kit/rollBar';
import { Component } from '../../mocks/obsidian';
import * as fs from 'fs';
import * as path from 'path';
import { styleGuardFindings } from './styleGuard';

function mount(opts: Partial<Parameters<typeof rollBar>[1]> = {}) {
	const owner = new Component();
	owner.load();
	const parent = document.createElement('div');
	const onRoll = jest.fn();
	const handle = rollBar(
		parent,
		{ mode: 'power-roll', characteristicLabel: 'Reason', onRoll, ...opts },
		owner,
	);
	return { parent, owner, handle, onRoll };
}

const netLabel = (parent: HTMLElement): string =>
	parent.querySelector('.dse-rollbar__net')!.textContent ?? '';

test('hygiene: rollBar.ts passes the kit style guard', () => {
	const src = fs.readFileSync(path.join(__dirname, '../../../src/framework/kit/rollBar.ts'), 'utf8');
	expect(styleGuardFindings(src)).toEqual([]);
});

test('mounts characteristic stepper (labelled), skill toggle, edge/bane steppers, Roll + reset', () => {
	const { parent } = mount();
	expect(parent.querySelector('.dse-rollbar')).not.toBeNull();
	expect(parent.querySelectorAll('.dse-stepper').length).toBe(3); // characteristic + edges + banes
	expect(parent.querySelector('button[aria-label="Skill (+2)"]')).not.toBeNull();
	expect(parent.querySelector('button[aria-label="Roll"]')).not.toBeNull();
	expect(parent.querySelector('button[aria-label="Reset modifiers"]')).not.toBeNull();
});

test('no characteristicLabel → no characteristic stepper (flat-mod abilities, §3.3)', () => {
	const { parent } = mount({ characteristicLabel: undefined });
	expect(parent.querySelectorAll('.dse-stepper').length).toBe(2); // edges + banes only
});

test('net label: single edge "+2", single bane "−2"', () => {
	const { parent, handle } = mount();
	handle.setState({ edges: 1 });
	expect(netLabel(parent)).toBe('Edge +2');
	handle.setState({ edges: 0, banes: 1 });
	expect(netLabel(parent)).toBe('Bane −2');
});

test('net label: doubles announce the tier shift; opposed announces ±4', () => {
	const { parent, handle } = mount();
	handle.setState({ edges: 2 });
	expect(netLabel(parent)).toBe('Double edge — tier ↑');
	const opposed = mount({ mode: 'opposed' });
	opposed.handle.setState({ edges: 2 });
	expect(netLabel(opposed.parent)).toBe('Double edge → +4');
});

test('net label: both > 0 netting 0 says they cancel; 0/0 is quiet', () => {
	const { parent, handle } = mount();
	handle.setState({ edges: 2, banes: 2 });
	expect(netLabel(parent)).toBe('Edges & banes cancel');
	handle.setState({ edges: 0, banes: 0 });
	expect(netLabel(parent)).toBe('');
});

test('skill toggle flips aria-pressed and adds skillBonus 2 to the emitted state', () => {
	const { parent, handle } = mount();
	const skill = parent.querySelector<HTMLButtonElement>('button[aria-label="Skill (+2)"]')!;
	skill.click();
	expect(skill.getAttribute('aria-pressed')).toBe('true');
	expect(handle.getState().skillBonus).toBe(2);
	skill.click();
	expect(handle.getState().skillBonus).toBe(0);
});

test('Roll emits the CURRENT state once per activation', () => {
	const { parent, handle, onRoll } = mount();
	handle.setState({ edges: 1, characteristic: 3 });
	parent.querySelector<HTMLButtonElement>('button[aria-label="Roll"]')!.click();
	expect(onRoll).toHaveBeenCalledTimes(1);
	const state = onRoll.mock.calls[0][0] as RollBarState;
	expect(state).toEqual({ characteristic: 3, skillBonus: 0, edges: 1, banes: 0, mainAction: false });
});

test('reset clears modifiers but keeps the characteristic value (it is a fact, not a modifier)', () => {
	const { parent, handle } = mount();
	handle.setState({ characteristic: 4, edges: 2, banes: 1, skillBonus: 2 });
	parent.querySelector<HTMLButtonElement>('button[aria-label="Reset modifiers"]')!.click();
	expect(handle.getState()).toEqual({ characteristic: 4, skillBonus: 0, edges: 0, banes: 0, mainAction: false });
});

test('main-action toggle renders only in power-roll mode with showMainAction', () => {
	const withToggle = mount({ showMainAction: true, mainAction: true });
	const toggle = withToggle.parent.querySelector('button[aria-label="Main action (can crit)"]');
	expect(toggle).not.toBeNull();
	expect(toggle!.getAttribute('aria-pressed')).toBe('true');
	const testMode = mount({ mode: 'test', showMainAction: true });
	expect(testMode.parent.querySelector('button[aria-label="Main action (can crit)"]')).toBeNull();
});

test('characteristic provided read-only (bound hero, §3.3): value shown, no stepper', () => {
	const { parent } = mount({ characteristicLabel: 'Reason', characteristicFixed: 2 });
	expect(parent.querySelectorAll('.dse-stepper').length).toBe(2);
	expect(parent.querySelector('.dse-rollbar__char-fixed')!.textContent).toContain('Reason +2');
});
```

**Selector caveat for this file (and every later test counting steppers):** verify the
kit stepper's actual root class before running — `grep -n "createDiv\|createSpan"
src/framework/kit/stepper.ts | head -5` — and if it isn't `.dse-stepper`, substitute the
real class in every `querySelectorAll('.dse-stepper')` here, in Task 4's
`feature-roll.test.ts`, and in Task 5's `roll.test.ts`. Same for the ± button labels
("Increase Edges" etc. come from stepper.ts's documented `"Increase {label}"` derivation
— confirm the exact casing).

Create `test/dom/kit/rollResultCard.test.ts`:

```ts
// Plan 14 Task 3 (D5 §3.5) — the result card: tier/total headline, crit
// treatment, traceable breakdown, Reroll/Clear actions, aria-live announce.
import { rollResultCard } from '../../../src/framework/kit/rollResultCard';
import { resolveRoll } from '../../../src/framework/roll/engine';
import type { DiceSource } from '../../../src/framework/roll/types';
import { Component } from '../../mocks/obsidian';
import * as fs from 'fs';
import * as path from 'path';
import { styleGuardFindings } from './styleGuard';

const seeded = (faces: number[]): DiceSource => {
	let i = 0;
	return { rollDie: () => faces[i++] };
};

function mount(result = resolveRoll({ mode: 'power-roll', characteristic: 2 }, seeded([5, 6]))) {
	const owner = new Component();
	owner.load();
	const parent = document.createElement('div');
	const onReroll = jest.fn();
	const onClear = jest.fn();
	const handle = rollResultCard(parent, { result, onReroll, onClear }, owner);
	return { parent, handle, onReroll, onClear };
}

test('hygiene: rollResultCard.ts passes the kit style guard', () => {
	const src = fs.readFileSync(
		path.join(__dirname, '../../../src/framework/kit/rollResultCard.ts'), 'utf8');
	expect(styleGuardFindings(src)).toEqual([]);
});

test('tiered headline: "Tier N · total" + polite live region on the card root', () => {
	const { parent } = mount(); // total 13 → tier 2
	const card = parent.querySelector('.dse-rollcard')!;
	expect(card.getAttribute('aria-live')).toBe('polite');
	expect(card.getAttribute('role')).toBe('status');
	expect(card.querySelector('.dse-rollcard__headline')!.textContent).toBe('Tier 2 · 13');
});

test('crit headline: "Critical!" + the extra-main-action reminder', () => {
	const { parent } = mount(
		resolveRoll({ mode: 'power-roll', isMainActionAbility: true }, seeded([10, 10])),
	);
	expect(parent.querySelector('.dse-rollcard__headline')!.textContent).toBe('Critical! · 20');
	expect(parent.querySelector('.dse-rollcard__crit-note')!.textContent).toContain(
		'additional main action',
	);
});

test('opposed + flat headlines are totals (no tier invented)', () => {
	const opposed = mount(resolveRoll({ mode: 'opposed' }, seeded([5, 6])));
	expect(opposed.parent.querySelector('.dse-rollcard__headline')!.textContent).toBe('Opposed — 11');
	const flat = mount(resolveRoll({ mode: 'flat', flat: { count: 1, sides: 6, bonus: 2 } }, seeded([4])));
	expect(flat.parent.querySelector('.dse-rollcard__headline')!.textContent).toBe('6');
});

test('breakdown renders the engine trace verbatim', () => {
	const { parent } = mount();
	expect(parent.querySelector('.dse-rollcard__breakdown')!.textContent).toBe(
		'2d10 [5, 6] = 11, +2 characteristic → 13',
	);
});

test('Reroll/Clear buttons fire their callbacks', () => {
	const { parent, onReroll, onClear } = mount();
	parent.querySelector<HTMLButtonElement>('button[aria-label="Reroll"]')!.click();
	parent.querySelector<HTMLButtonElement>('button[aria-label="Clear result"]')!.click();
	expect(onReroll).toHaveBeenCalledTimes(1);
	expect(onClear).toHaveBeenCalledTimes(1);
});

test('delegate marker: dice-roller rolls carry a subtle attribution; native none', () => {
	const owner = new Component();
	owner.load();
	const parent = document.createElement('div');
	rollResultCard(
		parent,
		{ result: resolveRoll({ mode: 'power-roll' }, seeded([5, 6])), delegate: 'dice-roller' },
		owner,
	);
	expect(parent.querySelector('.dse-rollcard__delegate')!.textContent).toBe('rolled with Dice Roller');
	const { parent: nativeParent } = mount();
	expect(nativeParent.querySelector('.dse-rollcard__delegate')).toBeNull();
});
```

Add to `test/dom/kit/powerRollPanel.test.ts` (new describe block at the end; reuse the
file's existing mount helpers):

```ts
describe('Plan 14 (D5 §3.4) — setRollResult: the roll-highlight channel', () => {
	test('active rows get data-dse-roll-result="active"; the rest "dimmed"; null clears', () => {
		const owner = new Component();
		owner.load();
		const parent = document.createElement('div');
		const handle = powerRollPanel(
			parent,
			{ rows: [
				{ tier: 'low', md: 'a' }, { tier: 'mid', md: 'b' },
				{ tier: 'high', md: 'c' }, { tier: 'crit', md: 'd' },
			] },
			owner,
		);
		handle.setRollResult(['high', 'crit']);
		expect(handle.rowEls.high!.getAttribute('data-dse-roll-result')).toBe('active');
		expect(handle.rowEls.crit!.getAttribute('data-dse-roll-result')).toBe('active');
		expect(handle.rowEls.low!.getAttribute('data-dse-roll-result')).toBe('dimmed');
		expect(handle.rowEls.mid!.getAttribute('data-dse-roll-result')).toBe('dimmed');
		handle.setRollResult(null);
		for (const row of Object.values(handle.rowEls)) {
			expect(row!.hasAttribute('data-dse-roll-result')).toBe(false);
		}
	});

	test('setRollResult never touches selectable-mode state (aria-checked/tabindex)', () => {
		const owner = new Component();
		owner.load();
		const parent = document.createElement('div');
		const handle = powerRollPanel(
			parent,
			{ rows: [{ tier: 'low', md: 'a' }, { tier: 'mid', md: 'b' }], selectable: true, selected: 'mid' },
			owner,
		);
		handle.setRollResult(['low']);
		expect(handle.rowEls.mid!.getAttribute('aria-checked')).toBe('true'); // selection intact
		expect(handle.rowEls.mid!.getAttribute('tabindex')).toBe('0');
		expect(handle.rowEls.low!.getAttribute('data-dse-roll-result')).toBe('active');
	});
});
```

(Match the file's existing import style for `powerRollPanel`/`Component` — extend, don't
duplicate imports.)

Run the three files → FAIL (modules/method missing).

- [ ] **Step 2: `powerRollPanel.ts` — the additive highlight channel**

(a) Add to `PowerRollPanelHandle` (after `getSelected`):

```ts
	/**
	 * D5 (Plan 14): roll-result highlight — data-dse-roll-result="active|dimmed"
	 * on every row (null clears). A SEPARATE channel from selectable-mode
	 * selection: never touches aria-checked/tabindex, works on static panels.
	 */
	setRollResult(active: readonly PowerRollTier[] | null): void;
```

(b) Add to the returned handle object (after `getSelected`):

```ts
		setRollResult: (active: readonly PowerRollTier[] | null): void => {
			for (const tier of tiers) {
				const rowEl = rowEls[tier]!;
				if (active === null) rowEl.removeAttribute('data-dse-roll-result');
				else rowEl.setAttribute('data-dse-roll-result', active.includes(tier) ? 'active' : 'dimmed');
			}
		},
```

- [ ] **Step 3: Write `src/framework/kit/rollBar.ts` (complete)**

```ts
// Plan 14 Task 3 (D5 §4) — kit/rollBar: the pre-roll modifier surface shared by
// the feature roller and ds-roll. Composes kit steppers + iconButtons; holds UI
// state ONLY (counts/toggles — ephemeral; the CALLER seeds/saves session state)
// and carries NO DS math: the net-effect label mirrors §1.3 for the user's eyes,
// but resolution is always resolveRoll's. Emits a plain RollBarState on Roll.
//
// A11y (§3.6/§4): all controls are real buttons/steppers (Tab/Enter/Space),
// aria-pressed on toggles, stepper labels name their subject. Styling via
// .dse-rollbar* classes + existing --dse-* tokens only (OD-D5-9: no new tokens).
import type { Component } from 'obsidian';
import { iconButton } from './iconButton'; // sibling imports, NEVER './index' (barrel cycle)
import { stepper } from './stepper';
import type { StepperHandle } from './stepper';
import type { RollMode } from '../roll/types';

/** The bar's emitted UI state — feeds RollInput construction in the caller. */
export interface RollBarState {
	characteristic: number;
	skillBonus: 0 | 2;
	edges: number;
	banes: number;
	mainAction: boolean;
}

export interface RollBarOptions {
	mode: RollMode;
	/** Characteristic name to label the stepper ("Reason"). Absent ⇒ no stepper (§3.3 flat-mod). */
	characteristicLabel?: string;
	/** Bound-hero value (§3.3 case 1): shown read-only, stepper suppressed. */
	characteristicFixed?: number;
	/** Initial state (session-restored by the caller). */
	initial?: Partial<RollBarState>;
	/** Show the main-action (crit-eligible) override toggle (power-roll mode only). */
	showMainAction?: boolean;
	/** Initial main-action value (inferred from usage by the caller, OD-6). */
	mainAction?: boolean;
	/** Fired once per Roll activation with the CURRENT state. */
	onRoll: (state: RollBarState) => void;
}

export interface RollBarHandle {
	readonly rootEl: HTMLElement;
	getState(): RollBarState;
	/** External update (session restore); re-renders controls + net label in place. */
	setState(state: Partial<RollBarState>): void;
}

/** Mounts the edge/bane resolver bar into `parent` (D5 §4). */
export function rollBar(parent: HTMLElement, opts: RollBarOptions, owner: Component): RollBarHandle {
	const state: RollBarState = {
		characteristic: opts.characteristicFixed ?? opts.initial?.characteristic ?? 0,
		skillBonus: opts.initial?.skillBonus === 2 ? 2 : 0,
		edges: opts.initial?.edges ?? 0,
		banes: opts.initial?.banes ?? 0,
		mainAction: opts.mainAction ?? opts.initial?.mainAction ?? false,
	};

	const rootEl = parent.createDiv({ cls: 'dse-rollbar' });
	const signed = (n: number): string => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);
	/** Display cap at "2+": further clicks stay "double", matching the engine clamp. */
	const capped = (n: number): string => (n >= 2 ? '2+' : String(n));

	// -- characteristic: fixed (bound hero) / manual stepper / absent --
	let charStepper: StepperHandle | undefined;
	if (opts.characteristicLabel !== undefined && opts.characteristicFixed !== undefined) {
		rootEl.createSpan({
			cls: 'dse-rollbar__char-fixed',
			text: `${opts.characteristicLabel} ${signed(opts.characteristicFixed)}`,
		});
	} else if (opts.characteristicLabel !== undefined) {
		charStepper = stepper(
			rootEl,
			{
				value: state.characteristic, min: -5, max: 5, editable: true, integer: true,
				label: opts.characteristicLabel,
				onChange: (value) => { state.characteristic = value; },
			},
			owner,
		);
	}

	// -- skill toggle --
	const skillButton = iconButton(
		rootEl,
		{
			label: 'Skill (+2)', text: 'Skill +2', pressed: state.skillBonus === 2, variant: 'ghost',
			onClick: () => {
				state.skillBonus = state.skillBonus === 2 ? 0 : 2;
				skillButton.setPressed(state.skillBonus === 2);
			},
		},
		owner,
	);

	// -- edge / bane steppers --
	const edgeStepper = stepper(
		rootEl,
		{
			value: state.edges, min: 0, max: 9, label: 'Edges', format: capped,
			onChange: (value) => { state.edges = value; renderNet(); },
		},
		owner,
	);
	const baneStepper = stepper(
		rootEl,
		{
			value: state.banes, min: 0, max: 9, label: 'Banes', format: capped,
			onChange: (value) => { state.banes = value; renderNet(); },
		},
		owner,
	);

	// -- main-action override (power-roll only, OD-6) --
	let mainActionButton: ReturnType<typeof iconButton> | undefined;
	if (opts.showMainAction && opts.mode === 'power-roll') {
		mainActionButton = iconButton(
			rootEl,
			{
				label: 'Main action (can crit)', text: 'Main action', pressed: state.mainAction, variant: 'ghost',
				onClick: () => {
					state.mainAction = !state.mainAction;
					mainActionButton!.setPressed(state.mainAction);
				},
			},
			owner,
		);
	}

	// -- live net-effect label (mirrors §1.3 / §1.5 so flat-vs-shift is visible pre-roll) --
	const netEl = rootEl.createSpan({ cls: 'dse-rollbar__net' });
	function renderNet(): void {
		const net = Math.min(2, Math.max(-2, state.edges - state.banes));
		let text = '';
		if (net === 0) text = state.edges > 0 && state.banes > 0 ? 'Edges & banes cancel' : '';
		else if (opts.mode === 'opposed') text = net === 2 ? 'Double edge → +4' : net === -2 ? 'Double bane → −4' : net === 1 ? 'Edge +2' : 'Bane −2';
		else if (net === 2) text = 'Double edge — tier ↑';
		else if (net === -2) text = 'Double bane — tier ↓';
		else text = net === 1 ? 'Edge +2' : 'Bane −2';
		netEl.setText(text);
	}
	renderNet();

	// -- reset + Roll --
	iconButton(
		rootEl,
		{
			icon: 'rotate-ccw', label: 'Reset modifiers', variant: 'ghost',
			onClick: () => {
				setState({ skillBonus: 0, edges: 0, banes: 0, mainAction: opts.mainAction ?? false });
			},
		},
		owner,
	);
	iconButton(
		rootEl,
		{ icon: 'dices', label: 'Roll', text: 'Roll', variant: 'accent', onClick: () => opts.onRoll({ ...state }) },
		owner,
	);

	function setState(patch: Partial<RollBarState>): void {
		if (patch.characteristic !== undefined && opts.characteristicFixed === undefined) {
			state.characteristic = patch.characteristic;
			charStepper?.setValue(state.characteristic);
		}
		if (patch.skillBonus !== undefined) {
			state.skillBonus = patch.skillBonus === 2 ? 2 : 0;
			skillButton.setPressed(state.skillBonus === 2);
		}
		if (patch.edges !== undefined) { state.edges = patch.edges; edgeStepper.setValue(state.edges); }
		if (patch.banes !== undefined) { state.banes = patch.banes; baneStepper.setValue(state.banes); }
		if (patch.mainAction !== undefined) {
			state.mainAction = patch.mainAction;
			mainActionButton?.setPressed(state.mainAction);
		}
		renderNet();
	}

	return { rootEl, getState: () => ({ ...state }), setState };
}
```

- [ ] **Step 4: Write `src/framework/kit/rollResultCard.ts` (complete)**

```ts
// Plan 14 Task 3 (D5 §3.5) — kit/rollResultCard: the compact post-roll card.
// Headline (tier / opposed / flat total; crit gets the reminder), the engine's
// traceable breakdown verbatim, Reroll/Clear actions. Small and inline — never
// a modal. The card root is a polite live region so a roll announces itself
// (§3.4 step 3). Kit⊥elements: takes a RollResult, knows nothing of session or
// service. Tokens only (OD-D5-9).
import type { Component } from 'obsidian';
import { iconButton } from './iconButton';
import type { RollResult } from '../roll/types';

export interface RollResultCardOptions {
	result: RollResult;
	/** Attribution marker when the Dice Roller bridge rolled the faces (§6.3). */
	delegate?: 'native' | 'dice-roller';
	onReroll?: () => void;
	onClear?: () => void;
}

export interface RollResultCardHandle {
	readonly rootEl: HTMLElement;
}

/** Mounts one result card into `parent`. Re-rolls REPLACE the card (caller empties). */
export function rollResultCard(
	parent: HTMLElement,
	opts: RollResultCardOptions,
	owner: Component,
): RollResultCardHandle {
	const { result } = opts;
	const rootEl = parent.createDiv({ cls: 'dse-rollcard' });
	// The live region: mounting/replacing the card announces the outcome (§3.6).
	rootEl.setAttribute('role', 'status');
	rootEl.setAttribute('aria-live', 'polite');

	const headline =
		result.isCritical ? `Critical! · ${result.total}`
		: result.tier !== undefined ? `Tier ${result.tier} · ${result.total}`
		: result.input.mode === 'opposed' ? `Opposed — ${result.total}`
		: `${result.total}`;
	rootEl.createDiv({ cls: 'dse-rollcard__headline', text: headline });
	if (result.isCritical) {
		rootEl.createDiv({
			cls: 'dse-rollcard__crit-note',
			text: 'Natural 19–20: you gain an additional main action this turn.',
		});
	}
	rootEl.createDiv({ cls: 'dse-rollcard__breakdown', text: result.breakdown });
	if (opts.delegate === 'dice-roller') {
		rootEl.createDiv({ cls: 'dse-rollcard__delegate', text: 'rolled with Dice Roller' });
	}

	const actionsEl = rootEl.createDiv({ cls: 'dse-rollcard__actions' });
	if (opts.onReroll) {
		iconButton(actionsEl, { icon: 'dices', label: 'Reroll', text: 'Reroll', onClick: () => opts.onReroll!() }, owner);
	}
	if (opts.onClear) {
		iconButton(actionsEl, { icon: 'x', label: 'Clear result', text: 'Clear', variant: 'ghost', onClick: () => opts.onClear!() }, owner);
	}

	return { rootEl };
}
```

- [ ] **Step 5: Barrel + CSS**

(a) `src/framework/kit/index.ts` — add after the powerRollPanel exports:

```ts
// -- Rolling (D5 §3.5/§4, Plan 14) --
export { rollBar } from './rollBar';
export type { RollBarState, RollBarOptions, RollBarHandle } from './rollBar';
export { rollResultCard } from './rollResultCard';
export type { RollResultCardOptions, RollResultCardHandle } from './rollResultCard';
```

Check `test/dom/kit/kit-index.test.ts`'s completeness pin (it "pins completeness") and
extend its expected export list with the four value exports if it enumerates them.

(b) `styles-source.css` — locate the `.dse-pr__row` rules (`grep -n "dse-pr__row"
styles-source.css`) and add directly AFTER that block (existing tokens ONLY — OD-D5-9):

```css
/* -- D5 (Plan 14) roll-result highlight: a SEPARATE attribute channel from
   selectable-mode aria-checked. Dimming is opacity (no color literal); the
   active row borrows the select/accent tokens. -- */
[data-dse-element] .dse-pr__row[data-dse-roll-result='dimmed'] {
	opacity: 0.45;
}
[data-dse-element] .dse-pr__row[data-dse-roll-result='active'] {
	background-color: var(--dse-select);
	border-radius: var(--dse-radius);
	outline: 1px solid var(--dse-accent);
	outline-offset: -1px;
}

/* -- D5 roll bar + result card (kit widgets; token-composed) -- */
[data-dse-element] .dse-rollbar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
	padding: 0.35rem 0.5rem;
	margin-top: 0.35rem;
	border: 1px solid var(--dse-border);
	border-radius: var(--dse-radius);
	background-color: var(--dse-surface-sunken);
}
[data-dse-element] .dse-rollbar__net {
	font-size: var(--font-ui-smaller);
	color: var(--dse-fg-muted);
}
[data-dse-element] .dse-rollbar__char-fixed {
	font-size: var(--font-ui-smaller);
	color: var(--dse-fg);
	background-color: var(--dse-chip-bg);
	border-radius: var(--dse-radius);
	padding: 0.1rem 0.4rem;
}
[data-dse-element] .dse-rollcard {
	margin-top: 0.35rem;
	padding: 0.5rem 0.65rem;
	border: 1px solid var(--dse-border-strong);
	border-radius: var(--dse-radius);
	background-color: var(--dse-surface-raised);
}
[data-dse-element] .dse-rollcard__headline {
	font-weight: 700;
	color: var(--dse-heading);
}
[data-dse-element] .dse-rollcard__crit-note {
	font-size: var(--font-ui-smaller);
	color: var(--dse-warn);
}
[data-dse-element] .dse-rollcard__breakdown {
	font-family: var(--dse-font-mono);
	font-size: var(--font-ui-smaller);
	color: var(--dse-fg-muted);
}
[data-dse-element] .dse-rollcard__delegate {
	font-size: var(--font-ui-smaller);
	color: var(--dse-fg-faint);
	font-style: italic;
}
[data-dse-element] .dse-rollcard__actions {
	display: flex;
	gap: 0.35rem;
	margin-top: 0.25rem;
}
/* Roll affordance button on feature cards (mounted by the roll controller). */
[data-dse-element] .dse-roll-btn {
	margin-left: 0.5rem;
}
```

- [ ] **Step 6: Gates**

Run: `npx jest test/dom/kit/rollBar.test.ts test/dom/kit/rollResultCard.test.ts test/dom/kit/powerRollPanel.test.ts`
→ **11 + 7 + (existing + 2) PASS**.
Run: `npx jest test/dom/framework/token-coverage.test.ts test/dom/framework/theme-steel.test.ts`
→ green UNCHANGED (the CSS above introduces no `--dse-*` definitions, only consumption —
if a token pin moved, you added a token; revert and re-read OD-D5-9).
Run: `npx tsc --noEmit` → 0. Run: `npx jest` → expected **1107** (1087 + 20).

- [ ] **Step 7: Commit + push**

```bash
git add src/framework/kit/ styles-source.css test/dom/kit/
git commit -m "feat(kit): rollBar + rollResultCard widgets, powerRollPanel roll-result channel (D5)"
git push origin d5-rolling
```

---

### Task 4: The feature roller — prefs, `renderFeature` hooks, roll controller

The marquee flow: every rendered power-roll effect (feature, featureblock, statblock —
one shared grammar) gains a Roll button → resolver bar → seeded result → tier-row
highlight, gated behind the new master pref `rollingEnabled` (default `false` — the
fidelity bar). Un-hides `rollClickToRoll`; adds the `CharacteristicProvider` hook for D7.

**Files:**
- Create: `src/framework/roll/binding.ts`, `src/elements/feature/rollController.ts`,
  `test/dom/elements/feature-roll.test.ts`
- Modify: `src/prefs/catalog.ts` (+`rollingEnabled`, un-hide `rollClickToRoll`),
  `src/elements/feature/renderFeature.ts` (optional roll hooks),
  `src/elements/feature/view.ts`, `src/elements/featureblock/view.ts`,
  `src/elements/statblock/view.ts` (build hooks + live pref re-mount),
  `test/unit/prefs/catalog.test.ts` (hidden/defaults/attrs pins)

**Interfaces:**
- Consumes: Task 2's `cx.roll` + `cx.session` + `cx.prefs`, Task 3's
  `rollBar`/`rollResultCard`/`setRollResult`, `parseRollExpression` (Task 1),
  `actionTypeOf` (existing — OD-6 crit inference), `BlockHost.blockKey()`.
- Produces: `CharacteristicProvider` (spec §3.3) + `FeatureElementView.
  setCharacteristicProvider()` (the D7 injection point); `FeatureRollHooks` +
  `attachRollControls(...)` + `featureRollHooks(cx, provider?)`;
  `RenderFeatureOptions.roll?` (absent ⇒ byte-identical output — every existing render
  test passes untouched); session slots `roll.lastInput.<n>` / `roll.history.<n>`
  (cap 10, OD-8). Rolling never calls `persist()`/`replaceSource` — zero note writes.

- [ ] **Step 1: Catalog — `rollingEnabled` + un-hide `rollClickToRoll`**

In `src/prefs/catalog.ts`:

(a) The `DsePrefs` augmentation's Rolling section becomes:

```ts
		// —— Rolling (behavioral; D5) ——
		rollingEnabled: boolean;
		rollerEngine: 'native' | 'dice-roller';
		rollClickToRoll: boolean;
```

(b) The Rolling descriptor block becomes (`rollingEnabled` FIRST — registration order is
row order in the settings tab; the `rollerEngine` entry is Task 2's un-hidden version):

```ts
	// —— Rolling (D5, Plan 14: OD-D4-1a's hidden rows go live + the master switch) ——
	d({
		key: 'rollingEnabled', default: false,
		ui: {
			group: 'Rolling', label: 'Enable rolling', control: 'toggle',
			help: 'Add a dice roller to rendered ability cards (feature, featureblock, statblock). Off — the default — renders cards exactly as before. The ds-roll element always rolls; authoring one is its own opt-in.',
		},
	}),
	// …the Task 2 rollerEngine descriptor stays here unchanged…
	d({
		key: 'rollClickToRoll', default: true,
		ui: {
			group: 'Rolling', label: 'Click ability to roll', control: 'toggle',
			help: 'When rolling is enabled, clicking a power-roll tier row rolls it. The Roll button always works regardless.',
		},
	}),
```

`rollClickToRoll`'s BUILT default (`true`) is deliberately kept (OD-5): it only takes
effect once `rollingEnabled` is on, so fresh-default fidelity is preserved by the master
switch, and flipping a shipped default would be a gratuitous divergence from what D4
persisted. All three prefs stay attr-less (behavioral — views read `cx.prefs.get`).

(c) Update `test/unit/prefs/catalog.test.ts`: the hidden-rows pin becomes
`['webLinkFallback']` only; the defaults test adds
`expect(store.get('rollingEnabled')).toBe(false);` and
`expect(store.get('rollClickToRoll')).toBe(true);`; the attrs-vocabulary pin adds
`rollingEnabled: null`.

- [ ] **Step 2: Write `src/framework/roll/binding.ts` (complete)**

```ts
// Plan 14 Task 4 (D5 §3.3) — the D7 injection hook. D5 ships the MANUAL path
// (stepper in the roll bar) + this interface; D7 composes a hero sheet and calls
// FeatureElementView.setCharacteristicProvider() so bound abilities read the
// hero's scores instead. Pure types — no Obsidian, no DOM.
import type { CharacteristicName } from './types';

export interface CharacteristicProvider {
	/** Score for a characteristic, or undefined if unknown (roller falls back to manual). */
	get(ch: CharacteristicName): number | undefined;
	/** Optional: an applicable-skill default (+2) the bar can pre-toggle. */
	skillBonus?(): number | undefined;
}
```

- [ ] **Step 3: Write `src/elements/feature/rollController.ts` (complete)**

```ts
// Plan 14 Task 4 (D5 §3) — the per-effect roll controller for the shared feature
// grammar. renderFeature mounts ONE controller per rolling effect (spec §3.1:
// each rollable effect rolls independently) when hooks are supplied; without
// hooks (rollingEnabled off, or no cx.roll) renderFeature output is byte-
// identical to today.
//
// Flow (§3.2/§3.4): a Roll button (die icon) — first activation reveals the
// resolver bar AND rolls; the bar stays for adjust-and-reroll. Results highlight
// the resolved tier row via the panel's data-dse-roll-result channel (crit adds
// the crit row), render a result card (aria-live), and land in SessionStore
// (roll.lastInput.<n> / roll.history.<n>, cap 10 — OD-8). Rolling NEVER writes
// the note; read-only hosts roll fine (reconciliation delta 12).
import type { Component } from 'obsidian';
import type { RenderContext } from '@/framework/context';
import { iconButton, rollBar, rollResultCard } from '@/framework/kit';
import type { PowerRollPanelHandle, PowerRollTier, RollBarHandle, RollBarState } from '@/framework/kit';
import { parseRollExpression } from '@/framework/roll/parse';
import type { RollService } from '@/framework/roll/service';
import type { RollInput, RollResult } from '@/framework/roll/types';
import type { CharacteristicProvider } from '@/framework/roll/binding';
import type { SessionStore } from '@/framework/session';

/** Everything the controller needs from the element view's cx (kept plain so
 *  renderFeature stays cx-free — reconciliation delta 6). */
export interface FeatureRollHooks {
	service: RollService;
	clickToRoll: boolean;
	session: SessionStore;
	blockKey: string;
	provider?: CharacteristicProvider;
}

/** Builds hooks from a view's cx, or undefined when rolling is off/unavailable.
 *  The undefined path IS the fidelity bar: renderFeature renders exactly today's DOM. */
export function featureRollHooks(
	cx: RenderContext,
	provider?: CharacteristicProvider,
): FeatureRollHooks | undefined {
	if (!cx.roll || !cx.prefs.get('rollingEnabled')) return undefined;
	return {
		service: cx.roll,
		clickToRoll: cx.prefs.get('rollClickToRoll'),
		session: cx.session,
		blockKey: cx.host.blockKey(),
		provider,
	};
}

const TIER_TO_ROW: readonly PowerRollTier[] = ['low', 'mid', 'high'];

export interface AttachRollControlsOptions {
	/** The effect's host element (the .dse-section / feature root the panel sits in). */
	hostEl: HTMLElement;
	panel: PowerRollPanelHandle;
	/** The effect's raw `roll:` string (parsed leniently; absent ⇒ bare power roll). */
	rollExpr: string | undefined;
	/** OD-6: inferred from usage via actionTypeOf === 'main'; bar shows the override. */
	mainActionDefault: boolean;
	/** Accessible name: "Roll <ability>". */
	abilityName: string;
	/** Per-feature rolling-effect ordinal — keys the session slots. */
	effectIndex: number;
	hooks: FeatureRollHooks;
	owner: Component;
}

/** Layers roll interactivity onto one mounted power-roll panel. */
export function attachRollControls(opts: AttachRollControlsOptions): void {
	const parsed = parseRollExpression(opts.rollExpr ?? '');
	const lastSlot = `roll.lastInput.${opts.effectIndex}`;
	const historySlot = `roll.history.${opts.effectIndex}`;
	const fixed =
		parsed.characteristic !== undefined
			? opts.hooks.provider?.get(parsed.characteristic)
			: undefined;

	// Bar + result mount BELOW the panel, inside the effect's host.
	const areaEl = opts.hostEl.createDiv({ cls: 'dse-roll-area' });
	let bar: RollBarHandle | undefined;
	let cardHostEl: HTMLElement | undefined;

	// The launch affordance: in the panel head when it has one, else atop the area.
	const launchHost = opts.panel.headEl ?? areaEl;
	const launch = iconButton(
		launchHost,
		{
			icon: 'dices',
			label: `Roll ${opts.abilityName}`,
			variant: 'ghost',
			onClick: () => void doRoll(), // first click reveals the bar AND rolls (§3.2)
		},
		opts.owner,
	);
	launch.buttonEl.addClass('dse-roll-btn');

	if (opts.hooks.clickToRoll) {
		// Pointer convenience on the STATIC panel rows (feature grammar is never
		// selectable — negotiation's radios keep their own click semantics untouched).
		opts.owner.registerDomEvent(opts.panel.rootEl, 'click', (evt: MouseEvent) => {
			if ((evt.target as HTMLElement).closest('.dse-pr__row')) void doRoll();
		});
	}

	function ensureBar(): RollBarHandle {
		if (bar) return bar;
		const last = opts.hooks.session.get<Partial<RollBarState>>(opts.hooks.blockKey, lastSlot);
		bar = rollBar(
			areaEl,
			{
				mode: parsed.mode,
				characteristicLabel:
					parsed.characteristic !== undefined
						? parsed.characteristic.charAt(0).toUpperCase() + parsed.characteristic.slice(1)
						: undefined,
				characteristicFixed: fixed,
				initial: last,
				showMainAction: true,
				mainAction: opts.mainActionDefault,
				onRoll: (state) => void doRoll(state),
			},
			opts.owner,
		);
		return bar;
	}

	async function doRoll(state?: RollBarState): Promise<void> {
		const s = state ?? ensureBar().getState();
		opts.hooks.session.set(opts.hooks.blockKey, lastSlot, s);
		const input: RollInput = {
			mode: parsed.mode,
			characteristic: s.characteristic,
			skillBonus: s.skillBonus,
			flatBonus: parsed.flatBonus,
			edges: s.edges,
			banes: s.banes,
			isMainActionAbility: s.mainAction,
		};
		const result = await opts.hooks.service.roll(input);
		const history = opts.hooks.session.get<RollResult[]>(opts.hooks.blockKey, historySlot) ?? [];
		opts.hooks.session.set(opts.hooks.blockKey, historySlot, [...history, result].slice(-10));
		renderResult(result);
	}

	function renderResult(result: RollResult): void {
		let active: PowerRollTier[] | null = null;
		if (result.tier !== undefined) {
			active = [TIER_TO_ROW[result.tier - 1]];
			// Nat-19–20 crit also lights the crit line when the ability has one (§3.4).
			if (result.isCritical && opts.panel.rowEls.crit) active.push('crit');
		}
		opts.panel.setRollResult(active);
		cardHostEl?.remove();
		cardHostEl = areaEl.createDiv();
		rollResultCard(
			cardHostEl,
			{
				result,
				delegate: opts.hooks.service.delegate,
				onReroll: () => void doRoll(),
				onClear: clear,
			},
			opts.owner,
		);
	}

	function clear(): void {
		opts.panel.setRollResult(null);
		cardHostEl?.remove();
		cardHostEl = undefined;
	}
}
```

- [ ] **Step 4: `renderFeature.ts` — the optional hooks (additive)**

(a) Extend the options interface + imports:

```ts
import { attachRollControls } from './rollController';
import type { FeatureRollHooks } from './rollController';
```

```ts
export interface RenderFeatureOptions {
	/** aria-level for the cardHead name heading. Default 3; nested abilities get +1. */
	headingLevel?: number;
	/** D5 (Plan 14): roll interactivity hooks. ABSENT ⇒ output byte-identical to
	 *  the pre-D5 grammar (the fidelity bar); present ⇒ each rolling effect gains
	 *  a roll controller. Built by featureRollHooks(cx) in the element views. */
	roll?: FeatureRollHooks;
}
```

(b) In `renderFeature`, add a rolling-effect ordinal beside the `act` computation
(function-top scope, before the effects loop):

```ts
	// D5: per-feature ordinal of rolling effects — keys the session slots.
	let rollableIndex = 0;
```

(c) In `renderEffect`, the power-roll block becomes:

```ts
		if (effect.roll || rows.length > 0) {
			const handle = powerRollPanel(
				hostEl,
				{ rows, renderMd, head: effect.roll?.trim() || false },
				owner,
			);
			handle.headEl?.addClass('dse-md-inline');
			// D5 (Plan 14): the roller layers ONTO the static panel when hooks are
			// supplied (rollingEnabled) — attribute channel only, no DOM change to the
			// rows themselves; without hooks this branch is byte-identical to before.
			if (opts.roll) {
				attachRollControls({
					hostEl,
					panel: handle,
					rollExpr: effect.roll ?? undefined,
					mainActionDefault: act === 'main',
					abilityName: feature.name ?? 'power roll',
					effectIndex: rollableIndex,
					hooks: opts.roll,
					owner,
				});
			}
			rollableIndex++;
		}
```

(`renderFeatureList` already forwards `opts` — nested abilities inherit the hooks with a
single shared blockKey; per-effect ordinals stay unique because the counter lives per
`renderFeature` call. Nested features get their own `renderFeature` frame — that resets
the ordinal, so nested rolling effects of the SAME block can collide on session slots
across siblings; acceptable for best-effort dice state (F1 §4.3 key drift is already
documented), noted here so nobody chases it as a bug.)

- [ ] **Step 5: The three views — hooks + live pref re-mount**

(a) `src/elements/feature/view.ts` becomes:

```ts
// Plan 09 Task 5 (D2 §3.6) — FeatureElementView on the D2 kit card grammar.
// (…keep the existing header comment, then append:)
//
// D5 (Plan 14): passes roll hooks when rollingEnabled (featureRollHooks — absent
// hooks render the byte-identical pre-D5 card), exposes the D7 characteristic-
// provider injection point, and re-mounts live when the roll prefs flip so the
// settings toggle is immediately visible on open notes.
import { ElementView } from '@/framework/view';
import type { RenderContext } from '@/framework/context';
import type { FeatureConfig } from '@model/FeatureConfig';
import type { CharacteristicProvider } from '@/framework/roll/binding';
import { renderFeature } from './renderFeature';
import { featureRollHooks } from './rollController';

export class FeatureElementView extends ElementView<FeatureConfig> {
	private provider?: CharacteristicProvider;

	constructor(cx: RenderContext) {
		super(cx);
		// D5: re-mount when the roll prefs flip so the settings toggle is visible on
		// open notes immediately. Inline in each consuming view (not a shared helper:
		// rootEl/model/update are protected — only the subclass reaches them type-
		// safely). The view is the subscription owner ⇒ unload detaches (F1 §4.5).
		// Before first mount rootEl is unset — the guard makes a pre-mount flip a
		// no-op (the mount itself reads the fresh value).
		const remount = (): void => {
			if (this.rootEl) void this.update(this.model);
		};
		cx.prefs.subscribe('rollingEnabled', this, remount);
		cx.prefs.subscribe('rollClickToRoll', this, remount);
	}

	/** D7 hook (D5 §3.3): inject a bound hero's characteristic values. */
	setCharacteristicProvider(provider: CharacteristicProvider): void {
		this.provider = provider;
		if (this.rootEl) void this.update(this.model);
	}

	protected onMount(root: HTMLElement, model: FeatureConfig): void {
		renderFeature(root, model, this, (md, el) => this.renderMarkdown(md, el), {
			roll: featureRollHooks(this.cx, this.provider),
		});
	}
}
```

(b) `src/elements/featureblock/view.ts` — add the same 8-line `remount` constructor block
(imports: `featureRollHooks` from `@/elements/feature/rollController`, plus
`RenderContext` if the file lacks it; add a constructor only if one doesn't exist,
otherwise append the block to the existing one):

```ts
	constructor(cx: RenderContext) {
		super(cx);
		// D5 roll-pref re-mount — see FeatureElementView's constructor comment.
		const remount = (): void => {
			if (this.rootEl) void this.update(this.model);
		};
		cx.prefs.subscribe('rollingEnabled', this, remount);
		cx.prefs.subscribe('rollClickToRoll', this, remount);
	}
```

and its `renderFeatures` call site (line ~139) becomes:

```ts
			renderFeatureList(host, FeatureConfig.allFrom(run.features), this, renderMd, {
				roll: featureRollHooks(this.cx),
			});
```

(c) `src/elements/statblock/view.ts` — same constructor block; the call site (line ~147)
becomes:

```ts
		renderFeatureList(card, FeatureConfig.allFrom(features), this, renderMd, {
			roll: featureRollHooks(this.cx),
		});
```

- [ ] **Step 6: Write `test/dom/elements/feature-roll.test.ts`**

```ts
// Plan 14 Task 4 (D5 §3) — the feature roller. Fine-grained behavior drives
// attachRollControls directly (seeded RollService stub; full control over rows/
// crit); integration mounts the REAL pipeline over the known-good harness
// fixtures (visual-harness/entry FIXTURES — already validity-gated by
// fixtures.test.ts) and pins the fidelity bar: at catalog defaults the roller
// leaves NO trace in the DOM.
import { ElementPipeline } from '../../../src/framework/pipeline';
import type { ElementPipelineDeps } from '../../../src/framework/pipeline';
import { createElementRegistry } from '../../../src/framework/registry';
import { registerFrameworkElementDefinitions } from 'main';
import { createPreferenceStore } from '../../../src/framework/seams/prefs';
import type { PrefsStorage } from '../../../src/framework/seams/prefs';
import { DSE_PREF_DESCRIPTORS } from '../../../src/prefs/catalog';
import { createThemeService } from '../../../src/framework/seams/theme';
import { createReferenceService } from '../../../src/framework/seams/refs';
import { createValidationService } from '../../../src/framework/validation';
import { createSessionStore } from '../../../src/framework/session';
import type { SessionStore } from '../../../src/framework/session';
import { resolveRoll } from '../../../src/framework/roll/engine';
import type { RollService } from '../../../src/framework/roll/service';
import type { DiceSource, RollInput } from '../../../src/framework/roll/types';
import { attachRollControls } from '../../../src/elements/feature/rollController';
import type { FeatureRollHooks } from '../../../src/elements/feature/rollController';
import { powerRollPanel } from '../../../src/framework/kit';
import type { BlockHost } from '../../../src/framework/host/BlockHost';
import { migrateSettings } from '@model/Settings';
import { FIXTURES } from '../../../visual-harness/entry';
import { App, Component, flushAsync } from '../../mocks/obsidian';
import type { Plugin } from 'obsidian';

// ---- seeded RollService stub: replays `faces` afresh on every roll() ----
function stubService(faces: number[]): RollService {
	const seeded = (): DiceSource => {
		let i = 0;
		return { rollDie: () => faces[i++] ?? 1 };
	};
	return {
		resolve: (input: RollInput, dice?: DiceSource) => resolveRoll(input, dice ?? seeded()),
		roll: async (input: RollInput) => resolveRoll(input, seeded()),
		dice: seeded(),
		delegate: 'native',
	};
}

// ---- controller harness (no pipeline; full row control) ----
function mountController(opts: {
	faces: number[];
	rollExpr?: string;
	mainActionDefault?: boolean;
	clickToRoll?: boolean;
	crit?: boolean;
	session?: SessionStore;
	blockKey?: string;
}) {
	const owner = new Component();
	owner.load();
	const hostEl = document.createElement('div');
	const rows = [
		{ tier: 'low' as const, md: 'a' },
		{ tier: 'mid' as const, md: 'b' },
		{ tier: 'high' as const, md: 'c' },
		...(opts.crit ? [{ tier: 'crit' as const, md: 'd' }] : []),
	];
	const panel = powerRollPanel(hostEl, { rows, head: 'Power Roll + Might' }, owner);
	const session = opts.session ?? createSessionStore();
	const hooks: FeatureRollHooks = {
		service: stubService(opts.faces),
		clickToRoll: opts.clickToRoll ?? false,
		session,
		blockKey: opts.blockKey ?? 'k',
	};
	attachRollControls({
		hostEl,
		panel,
		rollExpr: opts.rollExpr ?? 'Power Roll + Might',
		mainActionDefault: opts.mainActionDefault ?? true,
		abilityName: 'Gouge',
		effectIndex: 0,
		hooks,
		owner,
	});
	const launch = hostEl.querySelector<HTMLButtonElement>('button[aria-label="Roll Gouge"]')!;
	return { hostEl, panel, launch, session, owner };
}

describe('attachRollControls — the per-effect roller', () => {
	test('mounts the launch button; bar + result appear on first activation', async () => {
		const { hostEl, launch } = mountController({ faces: [5, 6] });
		expect(hostEl.querySelector('.dse-rollbar')).toBeNull(); // inert until engaged
		launch.click();
		await flushAsync(1);
		expect(hostEl.querySelector('.dse-rollbar')).not.toBeNull();
		expect(hostEl.querySelector('.dse-rollcard')).not.toBeNull();
	});

	test('seeded [5,6] (tier 1) highlights low, dims the rest', async () => {
		const { panel, launch } = mountController({ faces: [5, 6] });
		launch.click();
		await flushAsync(1);
		expect(panel.rowEls.low!.getAttribute('data-dse-roll-result')).toBe('active');
		expect(panel.rowEls.mid!.getAttribute('data-dse-roll-result')).toBe('dimmed');
		expect(panel.rowEls.high!.getAttribute('data-dse-roll-result')).toBe('dimmed');
	});

	test('nat 20 on a main action lights tier 3 AND the crit row', async () => {
		const { panel, launch } = mountController({ faces: [10, 10], crit: true, mainActionDefault: true });
		launch.click();
		await flushAsync(1);
		expect(panel.rowEls.high!.getAttribute('data-dse-roll-result')).toBe('active');
		expect(panel.rowEls.crit!.getAttribute('data-dse-roll-result')).toBe('active');
	});

	test('maneuver default (mainActionDefault false): nat 20 is tier 3 but NOT critical', async () => {
		const { hostEl, panel, launch } = mountController({ faces: [10, 10], crit: true, mainActionDefault: false });
		launch.click();
		await flushAsync(1);
		expect(panel.rowEls.crit!.getAttribute('data-dse-roll-result')).toBe('dimmed');
		expect(hostEl.querySelector('.dse-rollcard__headline')!.textContent).toBe('Tier 3 · 20');
	});

	test('Clear removes highlight + card; the bar stays for the next roll', async () => {
		const { hostEl, panel, launch } = mountController({ faces: [5, 6] });
		launch.click();
		await flushAsync(1);
		hostEl.querySelector<HTMLButtonElement>('button[aria-label="Clear result"]')!.click();
		expect(panel.rowEls.low!.hasAttribute('data-dse-roll-result')).toBe(false);
		expect(hostEl.querySelector('.dse-rollcard')).toBeNull();
		expect(hostEl.querySelector('.dse-rollbar')).not.toBeNull();
	});

	test('Reroll replaces the card; history APPENDS and caps at 10 (OD-8)', async () => {
		const { hostEl, launch, session } = mountController({ faces: [5, 6], blockKey: 'hist' });
		launch.click();
		await flushAsync(1);
		for (let i = 0; i < 12; i++) {
			hostEl.querySelector<HTMLButtonElement>('button[aria-label="Reroll"]')!.click();
			await flushAsync(1);
		}
		expect(hostEl.querySelectorAll('.dse-rollcard')).toHaveLength(1);
		expect(session.get<unknown[]>('hist', 'roll.history.0')).toHaveLength(10);
	});

	test('last-used modifiers persist per block: a NEW controller on the same key restores them', async () => {
		const session = createSessionStore();
		const first = mountController({ faces: [5, 6], session, blockKey: 'same' });
		first.launch.click();
		await flushAsync(1);
		first.hostEl.querySelector<HTMLButtonElement>('button[aria-label="Increase Edges"]')!.click();
		first.hostEl.querySelector<HTMLButtonElement>('button[aria-label="Roll"]')!.click();
		await flushAsync(1);
		const second = mountController({ faces: [5, 6], session, blockKey: 'same' });
		second.launch.click();
		await flushAsync(1);
		// single edge: 11 + 2 = 13 → tier 2 on the restored state
		expect(second.panel.rowEls.mid!.getAttribute('data-dse-roll-result')).toBe('active');
	});

	test('click-to-roll: row click rolls when enabled, does nothing when disabled', async () => {
		const on = mountController({ faces: [5, 6], clickToRoll: true });
		on.panel.rowEls.mid!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flushAsync(1);
		expect(on.hostEl.querySelector('.dse-rollcard')).not.toBeNull();
		const off = mountController({ faces: [5, 6], clickToRoll: false });
		off.panel.rowEls.mid!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flushAsync(1);
		expect(off.hostEl.querySelector('.dse-rollcard')).toBeNull();
	});
});

// ---- pipeline integration over the known-good harness fixtures ----
function makeDeps() {
	const app = new App() as never;
	const plugin = new Component() as unknown as Plugin;
	const storage: PrefsStorage = { get: async () => undefined, set: async () => {} };
	const prefs = createPreferenceStore(storage);
	prefs.describe(DSE_PREF_DESCRIPTORS);
	const settings = migrateSettings(undefined);
	const deps: ElementPipelineDeps = {
		app,
		plugin,
		settings,
		theme: createThemeService(prefs, plugin),
		prefs,
		refs: createReferenceService(app, settings),
		validation: createValidationService(),
		session: createSessionStore(),
		roll: stubService([5, 6]),
	};
	return { deps, prefs };
}

function makeHost(containerEl: HTMLElement, owner: Component): BlockHost {
	return {
		mode: 'reading',
		sourcePath: '',
		containerEl,
		canPersist: true,
		addChild: (child) => { owner.addChild(child); return child; },
		getBlockInfo: () => null,
		replaceSource: async () => false,
		blockKey: () => 'test-block',
	};
}

async function mountFixture(elementId: string, enableRolling: boolean) {
	const registry = createElementRegistry();
	registerFrameworkElementDefinitions(registry);
	const { deps, prefs } = makeDeps();
	if (enableRolling) await prefs.set('rollingEnabled', true);
	const owner = new Component();
	owner.load();
	const containerEl = document.createElement('div');
	document.body.appendChild(containerEl);
	const pipeline = new ElementPipeline(deps);
	await pipeline.run(registry.get(elementId)!, FIXTURES[elementId].default, makeHost(containerEl, owner));
	await flushAsync(2);
	return { containerEl, prefs };
}

describe('pipeline integration — the fidelity bar and the opt-in', () => {
	test('FIDELITY: at catalog defaults a feature renders with ZERO roll affordances', async () => {
		const { containerEl } = await mountFixture('feature', false);
		expect(containerEl.querySelector('.dse-pr')).not.toBeNull(); // the fixture does roll…
		expect(containerEl.querySelector('.dse-roll-btn')).toBeNull(); // …but no roller leaks
		expect(containerEl.querySelector('.dse-rollbar')).toBeNull();
		expect(containerEl.querySelector('.dse-roll-area')).toBeNull();
	});

	test('rollingEnabled: every power-roll panel gains exactly one launch button', async () => {
		const { containerEl } = await mountFixture('feature', true);
		const panels = containerEl.querySelectorAll('.dse-pr');
		expect(panels.length).toBeGreaterThan(0);
		expect(containerEl.querySelectorAll('.dse-roll-btn')).toHaveLength(panels.length);
	});

	test('statblock abilities gain the roller too (shared grammar)', async () => {
		const { containerEl } = await mountFixture('statblock', true);
		const panels = containerEl.querySelectorAll('.dse-pr');
		expect(panels.length).toBeGreaterThan(0);
		expect(containerEl.querySelectorAll('.dse-roll-btn')).toHaveLength(panels.length);
	});

	test('featureblock abilities gain the roller too', async () => {
		const { containerEl } = await mountFixture('featureblock', true);
		const panels = containerEl.querySelectorAll('.dse-pr');
		expect(panels.length).toBeGreaterThan(0);
		expect(containerEl.querySelectorAll('.dse-roll-btn')).toHaveLength(panels.length);
	});

	test('LIVE: toggling rollingEnabled re-mounts an already-rendered feature', async () => {
		const { containerEl, prefs } = await mountFixture('feature', false);
		expect(containerEl.querySelector('.dse-roll-btn')).toBeNull();
		await prefs.set('rollingEnabled', true);
		await flushAsync(2);
		expect(containerEl.querySelector('.dse-roll-btn')).not.toBeNull();
		await prefs.set('rollingEnabled', false);
		await flushAsync(2);
		expect(containerEl.querySelector('.dse-roll-btn')).toBeNull();
	});
});
```

Implementation notes for this file: (i) if an existing element suite (e.g.
`test/dom/elements/feature.test.ts`) already exports/contains a deps-builder helper,
PREFER reusing/extracting it over the inline `makeDeps` above — match its exact factory
signatures; (ii) the fixture assertions lean only on invariants (`.dse-pr` count vs
`.dse-roll-btn` count), never fixture-specific text, so fixture edits don't break them;
(iii) if statblock/featureblock fixtures turn out to contain zero power rolls, swap the
`default` fixture for one that has them or extend the fixture — do not weaken the
assertion to `>= 0`.

- [ ] **Step 7: Gates**

Run: `npx jest test/dom/elements/feature-roll.test.ts` → **13 PASS**.
Run: `npx jest test/unit/prefs/catalog.test.ts` → green with the Step 1c pin updates.
Run: `npx jest test/dom/elements/feature.test.ts test/dom/elements/featureblock.test.ts test/dom/elements/statblock.test.ts`
→ green UNTOUCHED — these suites mount at catalog defaults; any failure means the
fidelity bar broke (a roll affordance leaked into the default render): fix the code,
never the pins.
Run: `npx tsc --noEmit` → 0. Run: `npx jest` → expected **1120** (1107 + 13; the catalog
pin edits modify existing tests, net 0).

- [ ] **Step 8: Commit + push**

```bash
git add src/prefs/catalog.ts src/framework/roll/binding.ts src/elements/feature/ src/elements/featureblock/view.ts src/elements/statblock/view.ts test/dom/elements/feature-roll.test.ts test/unit/prefs/catalog.test.ts
git commit -m "feat(roll): opt-in Power Roll roller on the shared feature grammar (D5)"
git push origin d5-rolling
```

---

### Task 5: The `ds-roll` element

A standalone block for arbitrary DS rolls (homebrew, GM notes, quick tests, damage).
First-class F1 element: schema (hard-fail), `shape: "interactive"` (session-only — no
serialize, no note writes; OD-4), always-visible roll bar (authoring the block IS the
opt-in — the `rollingEnabled` master pref does not gate it, OD-5).

**Files:**
- Create: `src/elements/roll/schema.yaml`, `src/elements/roll/model.ts`,
  `src/elements/roll/view.ts`, `src/elements/roll/definition.ts`,
  `visual-harness/fixtures/roll/default.md`, `test/dom/elements/roll.test.ts`,
  `test/dom/elements/rollTestHelpers.ts` (extracted from Task 4's inline helpers)
- Modify: `main.ts` (register), `visual-harness/entry.ts` (fixture import + `FIXTURES`),
  `test/dom/visual-harness/fixtures.test.ts` ("all 11" → "all 12" pin),
  `test/dom/elements/feature-roll.test.ts` (import the extracted helpers),
  `styles-source.css` (a few `.dse-roll*` card rules),
  `src/framework/pipeline.ts` (one-line empty-source normalization — Step 1a)

**Interfaces:**
- Consumes: Tasks 1-3 (engine/parse/service/kit), the pipeline's schema validation
  (yaml-text AJV, F1 §5), `cardHead`/`powerRollPanel`.
- Produces: element id `roll`, aliases `["ds-roll", "ds-r", "ds-power-roll"]` (canonical
  first; kept forever per F1 OD-6 alias hygiene), `RollModel`/`parseRollModel`, `RollView`.

- [ ] **Step 0: Alias collision check**

```bash
grep -rn "'ds-r'\|\"ds-r\"\|ds-power-roll" src/ main.ts
```

Expected: no hits (every existing alias is ≥ 4 chars after `ds-`). If `ds-r` collides with
anything, drop it from the alias list (never repurpose a live alias) and note it in the
task report.

- [ ] **Step 1a: Pipeline — normalize empty YAML for schema validation**

The spec's "an empty `ds-roll` block rolls a bare 2d10 power roll" hits an AJV corner:
`parseYaml('')` yields `undefined`, which fails EVERY JSON-Schema `type` (even
`["object","null"]`). Normalize once in the pipeline — in `src/framework/pipeline.ts`,
the validation call becomes:

```ts
					// D5 (Plan 14): parseYaml('') is undefined, which no JSON-Schema type
					// accepts — normalize to null so schemas can OPT IN to empty blocks via
					// type: ["object","null"] (ds-roll does). Schemas without "null" keep
					// erroring on empty sources exactly as before.
					const result = runStage('schema', () => validation.validate(def.id, schema, rawData ?? null));
```

(Behavior-neutral for every existing element: their schemas don't allow `null`, so an
empty block fails schema either way. `def.parse` still receives the ORIGINAL `rawData`.)

- [ ] **Step 1: Write `src/elements/roll/schema.yaml` (complete)**

```yaml
# Plan 14 Task 5 (D5 §5.2) — the ds-roll block schema (AJV, hard-fail per F1 §5).
# `type` includes "null" so a completely EMPTY ds-roll block is valid — it rolls
# a bare 2d10 power roll (§5.2's first line). The reserved `prefs:` map is popped
# by the pipeline BEFORE validation, so it is deliberately absent here.
$schema: "http://json-schema.org/draft-07/schema#"
$id: "https://steelcompendium.io/schemas/dse-roll-1.0.0"
type: ["object", "null"]
additionalProperties: false
properties:
  name:
    type: string
  roll:
    type: string
    description: Free-text expression ("Power Roll + Reason", "2d10 + 5", "Might test"). Wins over the structured fields below.
  mode:
    type: string
    enum: [power-roll, test, opposed, flat]
  characteristic:
    description: A number (score, used directly) OR a keyword ("Reason", labels a manual stepper).
    oneOf:
      - type: number
      - type: string
  skill:
    description: true ⇒ +2; or a skill name (display only) ⇒ +2.
    oneOf:
      - type: boolean
      - type: string
  edges:
    type: integer
    minimum: 0
  banes:
    type: integer
    minimum: 0
  bonus:
    type: number
  difficulty:
    type: string
    enum: [easy, medium, hard]
  main_action:
    type: boolean
  dice:
    type: string
    description: Flat mode only — arbitrary dice ("1d6+2").
  tiers:
    type: object
    additionalProperties: false
    properties:
      t1: { type: string }
      t2: { type: string }
      t3: { type: string }
  crit:
    type: string
  auto_roll:
    type: boolean
```

- [ ] **Step 2: Write `src/elements/roll/model.ts` (complete)**

```ts
// Plan 14 Task 5 (D5 §5.2) — RollModel: the ds-roll block's plain model. Folds
// the free-text `roll:` via parseRollExpression; `roll` wins over structured
// fields where both speak. Pure (schema already validated the shape).
import { parseRollExpression } from '@/framework/roll/parse';
import type { FlatDice, RollMode } from '@/framework/roll/types';

export interface RollModel {
	name?: string;
	mode: RollMode;
	/** Keyword characteristic → labels the manual stepper. */
	characteristicLabel?: string;
	/** Numeric characteristic → used directly (read-only in the bar). */
	characteristicValue?: number;
	/** Seed skill (+2) on. */
	skill: boolean;
	edges: number;
	banes: number;
	bonus: number;
	difficulty?: 'easy' | 'medium' | 'hard';
	mainAction: boolean;
	/** Flat-mode dice (defaults 1d10 when mode is flat and no dice given). */
	flat?: FlatDice;
	tiers?: { t1?: string; t2?: string; t3?: string };
	crit?: string;
	autoRoll: boolean;
	/** Human line shown under the head ("Power Roll + Reason", "1d6+2", …). */
	expressionText: string;
}

interface RawRoll {
	name?: string;
	roll?: string;
	mode?: RollMode;
	characteristic?: number | string;
	skill?: boolean | string;
	edges?: number;
	banes?: number;
	bonus?: number;
	difficulty?: 'easy' | 'medium' | 'hard';
	main_action?: boolean;
	dice?: string;
	tiers?: { t1?: string; t2?: string; t3?: string };
	crit?: string;
	auto_roll?: boolean;
}

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Schema-validated data → RollModel. `null` (empty block) ⇒ a bare power roll. */
export function parseRollModel(data: unknown): RollModel {
	const raw: RawRoll = (data ?? {}) as RawRoll;
	const parsed = raw.roll !== undefined ? parseRollExpression(raw.roll) : undefined;

	const mode: RollMode = raw.mode ?? parsed?.mode ?? 'power-roll';

	// Characteristic: the roll string's keyword wins; else the structured field
	// (number ⇒ value, string keyword ⇒ stepper label).
	let characteristicLabel: string | undefined;
	let characteristicValue: number | undefined;
	if (parsed?.characteristic) characteristicLabel = capitalize(parsed.characteristic);
	else if (typeof raw.characteristic === 'number') characteristicValue = raw.characteristic;
	else if (typeof raw.characteristic === 'string') characteristicLabel = capitalize(raw.characteristic);

	// Flat dice: mode flat reads `dice:` ("1d6+2"); default 1d10.
	let flat: FlatDice | undefined;
	if (mode === 'flat') {
		const diceParsed = raw.dice !== undefined ? parseRollExpression(raw.dice) : undefined;
		flat = {
			count: diceParsed?.dice?.count ?? 1,
			sides: diceParsed?.dice?.sides ?? 10,
			bonus: diceParsed?.flatBonus ?? 0,
		};
	}

	const bonus = (raw.bonus ?? 0) + (mode !== 'flat' ? parsed?.flatBonus ?? 0 : 0);

	const expressionText =
		raw.roll?.trim() ||
		(mode === 'flat'
			? `${flat!.count}d${flat!.sides}${flat!.bonus ? `+${flat!.bonus}` : ''}`
			: [
					mode === 'test' ? 'Test' : mode === 'opposed' ? 'Opposed Power Roll' : 'Power Roll',
					characteristicLabel !== undefined ? `+ ${characteristicLabel}` : '',
					characteristicValue !== undefined ? `+ ${characteristicValue}` : '',
				]
					.filter(Boolean)
					.join(' '));

	return {
		name: raw.name,
		mode,
		characteristicLabel,
		characteristicValue,
		skill: raw.skill === true || typeof raw.skill === 'string',
		edges: raw.edges ?? 0,
		banes: raw.banes ?? 0,
		bonus,
		difficulty: raw.difficulty,
		mainAction: raw.main_action ?? false,
		flat,
		tiers: raw.tiers,
		crit: raw.crit,
		autoRoll: raw.auto_roll ?? false,
		expressionText,
	};
}
```

- [ ] **Step 3: Write `src/elements/roll/view.ts` (complete)**

```ts
// Plan 14 Task 5 (D5 §5.3) — RollView: the ds-roll card. Head (optional name) ·
// expression/difficulty caption · optional tier panel (t1/t2/t3/crit, highlights
// like the feature roller) · the ALWAYS-VISIBLE roll bar (authoring the block is
// the opt-in; rollingEnabled does not gate this element) · the result card.
// Results are session-ephemeral (OD-4): history/last-input in SessionStore, no
// container.empty() rebuild on roll — the result card is a targeted DOM update
// (F1 §2.1 principle 4). auto_roll rolls once on mount.
import { ElementView } from '@/framework/view';
import { cardHead, powerRollPanel, rollBar, rollResultCard } from '@/framework/kit';
import type { PowerRollPanelHandle, PowerRollRow, PowerRollTier, RollBarHandle, RollBarState } from '@/framework/kit';
import type { RollInput, RollResult } from '@/framework/roll/types';
import type { RollModel } from './model';

const LAST_SLOT = 'roll.lastInput.0';
const HISTORY_SLOT = 'roll.history.0';
const TIER_TO_ROW: readonly PowerRollTier[] = ['low', 'mid', 'high'];

export class RollView extends ElementView<RollModel> {
	private panel?: PowerRollPanelHandle;
	private bar?: RollBarHandle;
	private areaEl!: HTMLElement;
	private cardHostEl?: HTMLElement;

	protected onMount(root: HTMLElement, model: RollModel): void {
		this.panel = undefined;
		this.bar = undefined;
		this.cardHostEl = undefined;
		const service = this.cx.roll;
		const cardEl = root.createDiv({ cls: 'dse-roll' });

		if (model.name) cardHead(cardEl, { name: model.name, level: 3 }, this);
		const caption = [
			model.expressionText,
			model.difficulty ? `${model.difficulty} difficulty` : '',
		]
			.filter(Boolean)
			.join(' · ');
		if (caption) cardEl.createDiv({ cls: 'dse-roll__expr', text: caption });

		// Optional tier rows (§5.3): render + highlight exactly like the feature roller.
		const rows: PowerRollRow[] = [];
		if (model.tiers?.t1) rows.push({ tier: 'low', md: model.tiers.t1 });
		if (model.tiers?.t2) rows.push({ tier: 'mid', md: model.tiers.t2 });
		if (model.tiers?.t3) rows.push({ tier: 'high', md: model.tiers.t3 });
		if (model.crit) rows.push({ tier: 'crit', md: model.crit });
		if (rows.length > 0) {
			this.panel = powerRollPanel(
				cardEl,
				{ rows, head: false, renderMd: (md, el) => this.renderMarkdown(md, el) },
				this,
			);
		}

		this.areaEl = cardEl.createDiv({ cls: 'dse-roll-area' });
		if (!service) {
			// Defensive only — the pipeline always supplies cx.roll (Task 2); a bare
			// harness context without it degrades to a static card, never a throw.
			this.areaEl.createDiv({ cls: 'dse-roll__expr', text: 'Rolling unavailable.' });
			return;
		}

		const last = this.cx.session.get<Partial<RollBarState>>(this.blockKey(), LAST_SLOT);
		this.bar = rollBar(
			this.areaEl,
			{
				mode: model.mode,
				characteristicLabel: model.characteristicLabel,
				characteristicFixed: model.characteristicValue,
				initial: last ?? {
					skillBonus: model.skill ? 2 : 0,
					edges: model.edges,
					banes: model.banes,
				},
				showMainAction: true,
				mainAction: model.mainAction,
				onRoll: (state) => void this.doRoll(state),
			},
			this,
		);

		if (model.autoRoll) void this.doRoll(this.bar.getState());
	}

	private blockKey(): string {
		return this.cx.host.blockKey();
	}

	private async doRoll(state: RollBarState): Promise<void> {
		const service = this.cx.roll!;
		const model = this.model;
		this.cx.session.set(this.blockKey(), LAST_SLOT, state);
		const input: RollInput = {
			mode: model.mode,
			characteristic: model.characteristicValue ?? state.characteristic,
			skillBonus: state.skillBonus,
			flatBonus: model.bonus,
			edges: state.edges,
			banes: state.banes,
			isMainActionAbility: state.mainAction,
			flat: model.flat,
		};
		const result = await service.roll(input);
		const history = this.cx.session.get<RollResult[]>(this.blockKey(), HISTORY_SLOT) ?? [];
		this.cx.session.set(this.blockKey(), HISTORY_SLOT, [...history, result].slice(-10));

		if (this.panel) {
			let active: PowerRollTier[] | null = null;
			if (result.tier !== undefined) {
				active = [TIER_TO_ROW[result.tier - 1]];
				if (result.isCritical && this.panel.rowEls.crit) active.push('crit');
			}
			this.panel.setRollResult(active);
		}
		this.cardHostEl?.remove();
		this.cardHostEl = this.areaEl.createDiv();
		rollResultCard(
			this.cardHostEl,
			{
				result,
				delegate: service.delegate,
				onReroll: () => void this.doRoll(this.bar!.getState()),
				onClear: () => {
					this.panel?.setRollResult(null);
					this.cardHostEl?.remove();
					this.cardHostEl = undefined;
				},
			},
			this,
		);
	}
}
```

- [ ] **Step 4: Write `src/elements/roll/definition.ts` (complete)**

```ts
// Plan 14 Task 5 (D5 §5.4) — the ds-roll ElementDefinition. shape "interactive":
// results are session/ephemeral (OD-4 session-pin; note-pin — serialize + shape
// "persisted" — is the documented follow-up). Schema hard-fails per F1 §5. No
// refs (autoResolveRefs false): a roll block carries no @path/scc strings.
import type { ElementDefinition } from '@/framework/registry';
import rollSchemaYaml from './schema.yaml';
import { parseRollModel } from './model';
import type { RollModel } from './model';
import { RollView } from './view';

export const rollElement: ElementDefinition<RollModel> = {
	id: 'roll',
	name: 'Roll',
	aliases: ['ds-roll', 'ds-r', 'ds-power-roll'],
	shape: 'interactive',
	schema: rollSchemaYaml,
	parse: (data) => parseRollModel(data),
	autoResolveRefs: false,
	createView: (cx) => new RollView(cx),
};
```

- [ ] **Step 5: Register + fixture + pins**

(a) `main.ts`: `import { rollElement } from '@/elements/roll/definition';` and append
`registry.register(rollElement);` in `registerFrameworkElementDefinitions`; extend that
function's doc comment ("…Plan 14 appends Roll (D5) — the 12th element and the first
NEW element born on the framework; RegisterElements.ts still registers nothing.").

(b) Create `visual-harness/fixtures/roll/default.md`:

```yaml
name: Fireball
roll: "Power Roll + Reason"
edges: 1
tiers:
  t1: "5 fire damage"
  t2: "9 fire damage"
  t3: "13 fire damage"
crit: "The target is also burning (save ends)"
```

(c) `visual-harness/entry.ts`: add `import rollDefault from './fixtures/roll/default.md';`
beside the other fixture imports and `roll: { default: rollDefault },` in `FIXTURES`.

(d) `test/dom/visual-harness/fixtures.test.ts`: the coverage test's name/comment "all 11"
→ "all 12" (the assertion itself is generic and needs no change). Run
`grep -rn "all 11\|11 elements" test/ src/ visual-harness/ CLAUDE.md .repo-docs/` and
update any other live count pins the same way (docs counts are Task 6's job — only fix
pins that FAIL tests here).

(e) `styles-source.css` — after the Task 3 roll-card block:

```css
/* -- D5 ds-roll element card -- */
[data-dse-element='roll'] .dse-roll {
	padding: var(--dse-pad);
	border: 1px solid var(--dse-border);
	border-radius: var(--dse-radius);
	background-color: var(--dse-surface);
}
[data-dse-element='roll'] .dse-roll__expr {
	font-size: var(--font-ui-smaller);
	color: var(--dse-fg-muted);
}
```

- [ ] **Step 6: Extract the Task 4 test helpers + write `test/dom/elements/roll.test.ts`**

(a) Move `stubService`, `makeDeps`, and `makeHost` from `feature-roll.test.ts` into a new
`test/dom/elements/rollTestHelpers.ts` (same code, exported; keep `flushAsync`/mocks
imports inside the helper module) and import them back into `feature-roll.test.ts` —
no test-behavior change.

(b) Create `test/dom/elements/roll.test.ts`:

```ts
// Plan 14 Task 5 (D5 §5/§8.6) — the ds-roll element through the REAL pipeline:
// schema gate, empty-block default, expression/structured parsing, tier
// highlight, flat/opposed cards, auto_roll, session recording, aliases.
import { ElementPipeline } from '../../../src/framework/pipeline';
import { createElementRegistry } from '../../../src/framework/registry';
import { registerFrameworkElementDefinitions } from 'main';
import { rollElement } from '../../../src/elements/roll/definition';
import { stubService, makeDeps, makeHost } from './rollTestHelpers';
import { Component, flushAsync } from '../../mocks/obsidian';

const registry = createElementRegistry();
registerFrameworkElementDefinitions(registry);

async function mountRoll(source: string, faces: number[] = [5, 6], blockKey = 'roll-block') {
	const { deps } = makeDeps();
	deps.roll = stubService(faces);
	const owner = new Component();
	owner.load();
	const containerEl = document.createElement('div');
	document.body.appendChild(containerEl);
	const pipeline = new ElementPipeline(deps);
	await pipeline.run(rollElement, source, makeHost(containerEl, owner, blockKey));
	await flushAsync(2);
	return { containerEl, session: deps.session };
}

test('aliases: ds-roll canonical, ds-r and ds-power-roll registered', () => {
	for (const alias of ['ds-roll', 'ds-r', 'ds-power-roll']) {
		expect(registry.getByAlias(alias)?.id).toBe('roll');
	}
});

test('schema hard-fail: an unknown mode renders the schema error card', async () => {
	const { containerEl } = await mountRoll('mode: banana');
	expect(containerEl.querySelector('.dse-error-card')).not.toBeNull();
	expect(containerEl.firstElementChild!.getAttribute('data-dse-error-stage')).toBe('schema');
});

test('an EMPTY block is a bare 2d10 power roll: bar + Roll, no panel, no error', async () => {
	const { containerEl } = await mountRoll('');
	expect(containerEl.querySelector('.dse-error-card')).toBeNull();
	expect(containerEl.querySelector('.dse-rollbar')).not.toBeNull();
	expect(containerEl.querySelector('.dse-pr')).toBeNull();
	expect(containerEl.querySelector('button[aria-label="Roll"]')).not.toBeNull();
});

test('roll string keyword labels the characteristic stepper', async () => {
	const { containerEl } = await mountRoll('roll: "Power Roll + Reason"');
	expect(containerEl.querySelector('.dse-rollbar')!.textContent).toContain('Reason');
	expect(containerEl.querySelectorAll('.dse-stepper')).toHaveLength(3);
});

test('numeric characteristic is fixed (no stepper for it)', async () => {
	const { containerEl } = await mountRoll('characteristic: 3');
	expect(containerEl.querySelectorAll('.dse-stepper')).toHaveLength(2);
});

test('tiers render a panel; rolling highlights the seeded tier and stores history', async () => {
	const source = 'tiers:\n  t1: "5 fire"\n  t2: "9 fire"\n  t3: "13 fire"';
	const { containerEl, session } = await mountRoll(source, [5, 6], 'fireball');
	containerEl.querySelector<HTMLButtonElement>('button[aria-label="Roll"]')!.click();
	await flushAsync(1);
	expect(
		containerEl.querySelector('.dse-pr__row[data-tier="low"]')!.getAttribute('data-dse-roll-result'),
	).toBe('active');
	expect(session.get<unknown[]>('fireball', 'roll.history.0')).toHaveLength(1);
});

test('mode flat + dice "1d6+2": no panel; seeded [4] rolls a plain 6', async () => {
	const { containerEl } = await mountRoll('mode: flat\ndice: "1d6+2"', [4]);
	expect(containerEl.querySelector('.dse-pr')).toBeNull();
	containerEl.querySelector<HTMLButtonElement>('button[aria-label="Roll"]')!.click();
	await flushAsync(1);
	expect(containerEl.querySelector('.dse-rollcard__headline')!.textContent).toBe('6');
});

test('mode opposed: single-roll total headline (OD-7)', async () => {
	const { containerEl } = await mountRoll('mode: opposed', [5, 6]);
	containerEl.querySelector<HTMLButtonElement>('button[aria-label="Roll"]')!.click();
	await flushAsync(1);
	expect(containerEl.querySelector('.dse-rollcard__headline')!.textContent).toBe('Opposed — 11');
});

test('difficulty renders in the caption (display only — never engine math)', async () => {
	const { containerEl } = await mountRoll('roll: "Might test"\ndifficulty: medium');
	expect(containerEl.querySelector('.dse-roll__expr')!.textContent).toBe(
		'Might test · medium difficulty',
	);
});

test('auto_roll rolls once on mount', async () => {
	const { containerEl } = await mountRoll('auto_roll: true', [8, 9]);
	expect(containerEl.querySelector('.dse-rollcard__headline')!.textContent).toBe('Tier 3 · 17');
});

test('rolling never writes the note: replaceSource is never called', async () => {
	const { deps } = makeDeps();
	deps.roll = stubService([5, 6]);
	const owner = new Component();
	owner.load();
	const containerEl = document.createElement('div');
	document.body.appendChild(containerEl);
	const host = makeHost(containerEl, owner, 'no-writes');
	const spy = jest.spyOn(host, 'replaceSource');
	await new ElementPipeline(deps).run(rollElement, 'auto_roll: true', host);
	await flushAsync(2);
	expect(containerEl.querySelector('.dse-rollcard')).not.toBeNull();
	expect(spy).not.toHaveBeenCalled();
});
```

(`makeHost` gains an optional `blockKey` third parameter during the extraction — default
`'test-block'` so Task 4's call sites are unchanged. If `registry.getByAlias` is not the
real lookup name, check `src/framework/registry.ts` for the alias accessor and use that.)

- [ ] **Step 7: Gates**

Run: `npx jest test/dom/elements/roll.test.ts` → **12 PASS**.
Run: `npx jest test/dom/visual-harness/fixtures.test.ts` → green (now covering 12
elements + the new `roll/default` mount test).
Run: `npx tsc --noEmit` → 0. Run: `npx jest` → expected **1133** (1120 + 12 roll tests +
1 new fixture mount test).
Visual: `npm run shots -- --element=roll` → PNGs render the Fireball card (bar visible,
no result yet) with zero `--ERROR` shots.

- [ ] **Step 8: Commit + push**

```bash
git add src/elements/roll/ src/framework/pipeline.ts main.ts visual-harness/ test/dom/elements/ test/dom/visual-harness/fixtures.test.ts styles-source.css
git commit -m "feat(roll): ds-roll element — standalone Draw Steel rolls (D5)"
git push origin d5-rolling
```

---

### Task 6: Docs + full verification battery

**Files:**
- Modify: `CLAUDE.md` (plugin repo), `.repo-docs/architecture.md`, `README.md` +
  `docs/` element docs (only where they enumerate elements/settings — check first)

**Interfaces:**
- Consumes: everything shipped in Tasks 1-5.
- Produces: docs a cold agent (or user) can operate the rolling system from; the full
  green battery on the final tree.

- [ ] **Step 1: `CLAUDE.md` (plugin repo)**

In "Key Architecture", add one bullet after the Preferences (D4) bullet:

```markdown
- **Rolling (D5)**: `src/framework/roll/` — pure engine (`engine.ts resolveRoll`:
  2d10/tiers/edges/banes/crit, injected `DiceSource`), lenient `parse.ts`, and the
  `RollService` seam (`service.ts`, reached as `cx.roll`; optional Dice Roller plugin
  bridge via `diceBridge.ts`, capability-detected, always falls back to native). The
  feature grammar's roller lives in `src/elements/feature/rollController.ts`, gated by
  the `rollingEnabled` pref (default OFF — defaults render zero roll UI); `ds-roll`
  (`src/elements/roll/`) is the standalone element and always rolls. Results are
  session-only (`SessionStore` `roll.*` slots) — rolling NEVER writes the note.
```

Also update the element counts in CLAUDE.md/architecture docs if they say "all 11"
(`grep -rn "11 elements\|all 11" CLAUDE.md .repo-docs/ README.md docs/`).

- [ ] **Step 2: `.repo-docs/architecture.md`**

Read its framework/seams section and add a "Rolling" subsection in the file's voice
covering: the pure-engine/service split and why (engine = D7/D8's import, service = RNG
source + delegation), the `cx.roll` seam (optional field, pipeline-supplied), the
edge/bane math ownership rule ("tier/crit/edge-bane resolution happens in exactly one
module"), the pref gates (`rollingEnabled` master, `rollClickToRoll`, `rollerEngine`),
the `data-dse-roll-result` channel vs selectable `aria-checked` (composition rule), the
session-slot scheme (`roll.lastInput.<n>` / `roll.history.<n>`, cap 10, best-effort key
drift), and the deliberate deferrals (history popover, note-pin, two-sided opposed,
D7 `CharacteristicProvider` wiring). Keep it under ~40 lines; link the D5 spec path.

- [ ] **Step 3: `README.md` + `docs/` sweep**

`grep -rn "ds-roll\|elements\b" README.md docs/*.md | head -30` — if the user-facing docs
enumerate the `ds-*` elements or the settings tab, add `ds-roll` (aliases, the YAML schema
fields from §5.2 with a short example) and the three Rolling settings rows. If nothing
enumerates, add a short `docs/Roll.md` mirroring the other per-element docs' format ONLY
if such per-element docs exist (`ls docs/`) — match the established pattern, don't invent
a new one.

- [ ] **Step 4: Full battery**

All from the worktree (wrap each in the devbox invocation; check echoed EXIT):

```bash
npx tsc --noEmit                       # → 0
npx jest                               # → 1133 passed (or your adjusted-up total)
npm run build                          # → production build green (type check + bundle)
npm run shots                          # → full harness sweep incl. roll/, zero --ERROR shots
npm run obsidian-shots -- --element=roll   # → ground-truth ds-roll card (sign-off camera)
git log --format='%b' 76df29f..HEAD | grep -iE 'co-authored|generated with' | wc -l   # → 0
git status --porcelain                 # → only intended files; restore any package.json churn
```

Manual ground truth to note in the report (real Obsidian, F5 camera or by hand): enable
`rollingEnabled` in settings, open a note with a statblock, roll an ability — tier row
highlights, result card reads correctly, Clear restores; toggle `rollerEngine` with Dice
Roller absent — rolling keeps working natively (OD-3's fallback is the ONLY part of the
bridge we can't fully verify without the live community plugin; say so in the report).

- [ ] **Step 5: Commit + push**

```bash
git add CLAUDE.md .repo-docs/architecture.md README.md docs/
git commit -m "docs(roll): rolling architecture + ds-roll element docs (D5)"
git push origin d5-rolling
```

(Drop paths Step 3 left untouched.)

---

## Post-plan (orchestrator, workspace repo)

- `docs/superpowers/dse-overhaul/README.md`: D5 row → built.
- Build-ledger entries per task (the plans-01-12 ledger's successor file); Linear comment
  if the SC thread tracks D5.
- `REMAINING-TASKS.md` (plugin repo): strike "D5 un-hides its catalog rows when it ships"
  (done); ADD the D5 deferrals with one-liners: history popover UI (recording ships,
  cap 10 — popover is additive), note-pin persistence (`ds-roll` → `shape: "persisted"` +
  serialize, reuses F1's write path), two-sided opposed compare (OD-7), D7
  `CharacteristicProvider` wiring (`setCharacteristicProvider` is live and untested
  against a real hero), live verification of the Dice Roller bridge against the actual
  community plugin (the API-shape guess is capability-guarded but unconfirmed — OD-3),
  nested-feature session-slot ordinal collision (renderFeature note, Task 4 Step 4c).
- **Scott's review gate before landing:** get him in front of rendered output early —
  `npm run shots -- --element=roll`, plus a real vault with `rollingEnabled` ON over a
  statblock note (the marquee flow), and the settings tab's Rolling section. Two explicit
  veto candidates to surface: (1) `rollingEnabled` default `false` (OD-5 — flip to `true`
  later = one primitive default change, migration-free under sparse storage); (2) the
  roll-highlight visual treatment (select/accent tokens — D3's territory if he wants a
  bespoke look, which would then need the OD-D5-9 token amendment).
- Scott's veto pass over the Open-Decision resolutions table at the top of this plan.
- Land via `just wt-finish d5-rolling` after the review gate.



