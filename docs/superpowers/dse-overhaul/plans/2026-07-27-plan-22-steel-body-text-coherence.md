# Steel Body-Text Coherence (plan-21 follow-up) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

> **STATUS 2026-07-27: DRAFT — awaiting Scott's go-ahead.** Written against `draw-steel-elements`
> main @ `f5923f8` (plan 21 landed). Baselines: tsc clean · jest **2010 / 144 suites** · shots
> **164** · obsidian-shots **131** · parity **0 GAPs / 10 WARNs / exit 0** (dark+light) ·
> freeze **98/98**. This is the audit-recommended next step (gap inventory §C1/§E); the kit
> rebuild (#32) remains a **separate** plan per Scott's decision.

**Goal:** Make the plugin's ~20 *plugin-only* families (hero sheet, trackers, negotiation,
montage, project, party, …) read in the same serif + open + cool-ink body style plan 21 gave the
card families — so the whole Steel theme reads as one type system instead of "serif card head +
sans body."

**Architecture:** Plan 21 routed body text to the serif token (`--dse-font-display`) + the site
line-height/ink, but scoped it to **four card-family roots** (`feature`, `featureblock`,
`.dse-sb`, `.dse-card`). The plugin-only families reuse the shared `cardHead`/`powerRollPanel`
(so their *heads* are already serif + material-correct) but their *body/label/control text*
still falls to `-apple-system` sans at the old 1.5 line-height. This plan **broadens that same
routing to every Steel element root** (screen-only), with careful exclusions, and reconciles the
now-redundant per-card-family rules into the shared one (DRY). CSS-only, no DOM.

**Tech Stack:** CSS (`draw-steel-elements/styles-source.css`); jest + the existing offline
contract-test pattern (`test/dom/theme/steelTypography.test.ts`); the harness shots for visual
verification.

---

## Why this is safe (and why it's not the kit problem)

Unlike the kit rebuild (#32), this is **CSS-only and freeze-compatible**: every new rule carries
`[data-dse-theme='steel']:not([data-dse-print="on"])`, exactly as plan 21's rules do — so
`*--steel-print.png` and all `*--legacy-*.png` stay byte-identical. Only the **steel-dark/light**
shots of the plugin-only families change (they become serif), and those are **not** in the freeze
set. There is no DOM change, so the 2010-test suite and the goldens' DOM stay valid.

## Global Constraints

- **LEGACY-FREEZE is absolute** — every `visual-harness/shots/*--legacy-{dark,light}.png` byte-
  identical. **`*--steel-print.png` must also stay byte-identical.** Every new/changed rule is
  scoped `[data-dse-theme='steel']:not([data-dse-print="on"])` (single-quote theme selector — the
  file's convention).
- **Prove the freeze** each task: `npm run shots`, then `bash
  /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree-shots-dir>`
  (98 legacy+print PNGs vs sha256 baseline; expect `freeze OK (98/98 …)`). The script takes the
  shots dir as `$1` — pass this plan's worktree path. Never rebaseline; fix the selector scope.
- **No DOM/TS changes** — `src/` untouched. If a fix seems to need markup, STOP and report.
- **No new tokens** — reuse `--dse-font-display` and the ink token plan 21 used (`--dse-fg`;
  verify the exact name). Registering a `--dse-*` token needs a forbidden `tokens.ts` edit
  (plan 21's C6 finding).
- **Do not regress the card families.** After broadening the routing, `npm run parity` must stay
  **0 GAPs / 10 WARNs / exit 0** and `steelTypography.test.ts` + `steelMaterial.test.ts` stay
  green — that proves the card-family body font/spacing/ink are still correct.
- **Exclusions matter.** Body routing must NOT change: numeric `<input>`s / steppers, monospace
  SCC-code fallbacks (`--dse-font-mono`), and the small-caps chip/eyebrow rules (they set their
  own font). Verify each still renders correctly after the change.
- **Environment / commits:** devbox-wrapped with absolute `cd` (`devbox run -- bash -c 'cd
  <worktree>/draw-steel-elements && <cmd>'`); `$PIPESTATUS`/`${var:-x}` break under devbox sh —
  use plain forms, and read a node exit code by running the command LAST with no trailing `echo`
  (plan 21 footgun). Commit messages carry **no AI/Claude attribution or co-author trailers**.

## Execution

**Worktree (required).** From `/home/scott/code/steelCompendium/workspace`:
`devbox run -- bash -c 'just wt-new steel-body'` → work in
`/home/scott/code/steelCompendium/worktrees/steel-body/draw-steel-elements` (branch
`steel-body`); `npm ci` first. Substitute this path for `…/workspace/draw-steel-elements` below.

**Stop condition: do NOT land.** Finish, report. Scott lands with `just wt-finish steel-body`
from the MAIN checkout (verify pins first).

**Final report:** commit sha per task · before/after parity (must stay 0/10) · gate numbers ·
the per-family visual verdicts (hero, encounter, negotiation, montage, initiative, project,
party) · freeze result.

---

### Task 1: Broaden the body-text routing to every Steel element root

**Files:** Modify `draw-steel-elements/styles-source.css`.

- [ ] **Step 1: Read the landed routing.** The card-family rule is at ~`styles-source.css:3443`:
  `[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='feature']…, … .dse-sb, .dse-card { font-family: var(--dse-font-display); line-height:<X>; color:<ink>; }`.
  Note its exact declarations (font-family, line-height, color/ink token, and whether
  `letter-spacing: normal` is here or separate). Also read the existing plugin-only heading rule
  at ~`:4419` (`[data-dse-element='encounter'/'negotiation'/… ] :is(h3,h4,h5,h6)`) — it is the
  precedent that these element roots are a known selector group.

- [ ] **Step 2: Broaden the routing.** Change the card-family root selector to cover **every**
  Steel element root — i.e. `[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element]:not([data-dse-error-stage])`
  (a single attribute-presence selector covers all families) — carrying the same font-family +
  line-height + ink declarations. Prefer this over adding a parallel rule, so the card-family
  routing is subsumed (DRY). Keep the comment explaining screen-only + the ink/line-height
  provenance.

- [ ] **Step 3: Guard the exclusions.** Confirm the following still set their own font and are not
  overridden into serif by the broadened rule (they are more specific or set `font-family`
  directly): the chip/eyebrow small-caps rules, `--dse-font-mono` code fallbacks, numeric
  `<input>`/stepper controls. If any now inherits serif wrongly, add a targeted
  `font-family: var(--dse-font-mono)` / small-header reset — do not narrow the broadened rule.

- [ ] **Step 4: Rebuild + verify the card families didn't regress.**
  Run: `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && npm run parity'`
  Expected: **0 GAPs / 10 WARNs / exit 0** (unchanged — proves card-family body type/space/ink
  still correct). If a card-family GAP appears, the broadened rule dropped a declaration — fix it.

- [ ] **Step 5: Prove the freeze.**
  `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && npm run shots'` then
  `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots`
  Expected: `freeze OK (98/98 …)`. (Steel-dark/light plugin-only shots WILL change — that's the
  intended effect and they're not frozen.)

- [ ] **Step 6: Visual verification (mandatory).** Read these steel-dark shots and confirm body/
  label/control text now renders serif + open + cool-ink, coherent with a note card, and that
  inputs/steppers/SCC-code fallbacks/chips are unchanged:
  `visual-harness/shots/{hero,encounter,negotiation,montage,initiative,project,party}--steel-dark.png`.
  Report a one-line verdict per family. If any family looks wrong (e.g. a control went serif that
  shouldn't), fix in Step 3's manner.

- [ ] **Step 7: Gates + commit.**
  `npm run tsc` clean · `npx jest` **2010/144** green.
```bash
git add styles-source.css
git commit -m "feat(steel): route body text to the serif face across all element families (coherence)"
```

---

### Task 2: Lock the coherence contract + wrap

**Files:** Modify `draw-steel-elements/test/dom/theme/steelTypography.test.ts`; docs
(`D3-token-map.md` note, plugin + workspace `CHANGELOG.md`, gap inventory status, FOLLOWUPS).

- [ ] **Step 1: Extend the contract test.** Add an assertion (same comment-stripped, single-quote-
  scope-aware source-text approach as the existing tests) that the body-font routing targets the
  **element-root** selector (`[data-dse-element]`, not just the four card families) under Steel +
  `:not([data-dse-print="on"])`. Prove it can fail: revert Task 1's selector to the 4-root form,
  watch the test fail, restore. Report the evidence.

- [ ] **Step 2: Full battery + record numbers.** tsc · jest (2010 + new) · shots 164 ·
  obsidian-shots 131 · parity 0/10/exit0 · freeze 98/98.

- [ ] **Step 3: Docs.** Plugin + workspace `CHANGELOG.md` bullets (accurate: Steel body typography
  now spans all families; still serif-not-slab, screen-only, print/legacy frozen). Mark gap
  inventory §C1/§C2 CLOSED. Note in `D3-token-map.md` that body font routes on every element root.

- [ ] **Step 4: Commit** (submodule: test; superproject: docs — separate commits, no pointer bump,
  no push).
```bash
git add test/dom/theme/steelTypography.test.ts
git commit -m "test(steel): body-text routing spans all families — a sans-body family now fails the suite"
```

---

## Self-review

**Spec coverage.** Gap inventory §C1 (plugin-only body sans) → Task 1; §C2 (line-height) → folded
into the same broadened rule; guard → Task 2. §C3 (hero empty-panel space) and §D2 (stats-as-list)
are explicitly **out of scope** — the former is low-priority grid layout, the latter folds into the
kit/#32 plan.

**Placeholder scan.** Each step names the real selector (`[data-dse-element]` root) and the real
landed rule (~`:3443`) to extend. Two verify-the-name points (the ink token name; the exclusion
selectors) are deliberate, plan-21 style — stated with the failure mode and caught by Step 4's
parity check + Step 6's shot-read.

**Type/name consistency.** Reuses `--dse-font-display` and the existing ink token (no new token —
plan 21's C6). The freeze invariant (`:not([data-dse-print="on"])`) and the parity-stays-0/10
regression check carry over from plan 21 unchanged.

**Known risk.** Over-reach — the broadened rule turning a control/code/chip serif. Mitigated by
Step 3's exclusion audit, Step 4's card-family parity regression check (0/10), and Step 6's
per-family shot-read (which would show a wrongly-serif input). No parity gate covers the
plugin-only families (no site counterpart), so the shot-read is the primary visual guard —
call it out honestly in the report rather than implying the gate proves coherence.
