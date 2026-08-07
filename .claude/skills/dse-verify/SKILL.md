---
name: dse-verify
description: Use when verifying, testing, or gating any change to the draw-steel-elements plugin (CSS, TS, tokens, fixtures) — the full battery, its command shapes, and the freeze/parity rules
---

# DSE Verify

## Overview

`draw-steel-elements` (the DSE Obsidian plugin) gates every change through a fixed battery
of checks: type-check, unit tests, visual shots, a byte-level freeze check, and a CSS/DOM
parity check against the live v2 site. All commands run through devbox and have specific
footguns that silently produce false-green results if you get the shape wrong. This skill
is the command reference — read it before running (or reporting on) any of these gates.

**Never edit `draw-steel-elements/` from the shared main workspace checkout.** Do this work
in an isolated worktree (`just wt-new <name>`) per the workspace CLAUDE.md.

## The battery, in order

Run these against a worktree's `draw-steel-elements/` (never the main checkout). Use
absolute paths — devbox ignores your shell's `cd`.

| Step | Command | Expects |
|---|---|---|
| 1. Type-check | `npm run tsc` | clean (no output) |
| 2. Unit tests | `npx jest` | all suites/tests green |
| 3. Visual shots | `npm run shots` | regenerates `visual-harness/shots/` |
| 4. Freeze check | `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <repo>/draw-steel-elements/visual-harness/shots` | all producible shots byte-identical, **0 FAILED** checksums — see "Current expected numbers" below for today's baseline size vs. how many of its lines a given branch can produce |
| 5. Parity (LAST) | `npm run parity` | `0 GAPs`, `0 undeclared WARNs`, exactly the documented declared-deferral set, exit 0 |
| 6. Obsidian shots (only if a display is available) | `npm run obsidian-shots` | regenerates ground-truth PNGs from a real spawned Obsidian |

Run parity last: it rebuilds the harness bundle itself (`harness:build` is a
`predependency` step inside `npm run parity`), so running it after the freeze check keeps
freeze's PNG comparison isolated from parity's own rebuild. `obsidian-shots` needs a real
display (`DISPLAY=:1` by default) and the system Obsidian binary — skip it in headless
environments, don't fake it.

### Devbox wrapping (every command above)

`devbox run --` executes from the devbox project root and **ignores your shell's `cd`**.
Always wrap with `bash -c` using an **absolute** path:

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/<name>/draw-steel-elements && npm run tsc'
```

`$PIPESTATUS` and `${var:-x}`-style substitutions **break under devbox's sh wrapper** — don't
rely on them to recover a command's exit code.

### THE exit-code footgun

A pipe or a trailing command can silently turn a real failure into an apparent success:

- `cmd 2>&1 | tail -20` reports **tail's** exit status (0), not `cmd`'s — and since
  `$PIPESTATUS` doesn't survive the devbox sh wrapper, you can't recover the real code that
  way either.
- `cmd; echo done` has the same effect: `echo`'s exit status (0) becomes the new `$?`.

**Rule: whichever command's pass/fail you actually need, make it the LAST thing evaluated in
the `bash -c '...'` string** — no `| tail`, no `; echo`, nothing chained after it:

```bash
# WRONG — jest's real exit code is masked by tail's success
devbox run -- bash -c 'cd /abs/path/draw-steel-elements && npx jest 2>&1 | tail -3'

# RIGHT — jest is last, nothing after it
devbox run -- bash -c 'cd /abs/path/draw-steel-elements && npx jest'
```

If you also want trimmed output for readability, redirect to a log file and `tail` the file
in a **separate** command after you've already checked the exit code — don't pipe the
gate command itself.

## Freeze semantics

`check-freeze.sh` (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh`)
compares real bytes because `visual-harness/shots/` is gitignored — a `git status` check on
that directory is vacuous. It runs `sha256sum -c` against
`.superpowers/sdd/freeze-baseline.sha256`, a flat list of **107** `<hash>  <filename>` lines
(`*--legacy-{dark,light}.png` + `*--steel-print.png`).

**The baseline covers the BROWSER camera only.** Obsidian-camera output
(`*--obsidian-*.png`, incl. the modal/settings/canvas/sidebar specials) is deliberately not
pinned: those shots come from a real, self-updating Obsidian against a live display and are
not byte-reproducible, so freezing them would produce noise, not a gate. Their regression
protection is the camera's own in-run ASSERTIONS (e.g. the canvas capture fails loudly if any
element root is missing `data-dse-readonly`; the by-SCC capture fails if the nested card
didn't mount) plus human review of the PNGs.

- **The `<shots-dir>` argument is mandatory** — the script's built-in default path points at
  a worktree that no longer exists.
- **`sha256sum -c` only validates the filenames literally listed in the baseline file.** A
  shot present in the directory but absent from the baseline is invisible to the check — not
  flagged, not reported. New fixtures produce new files that don't trip the freeze check by
  construction (they don't collide with an existing frozen name).
- **A reported mismatch means an existing frozen shot changed bytes** — almost always because
  a new/edited Steel CSS rule leaked into the legacy or print scheme. Fix it by narrowing the
  rule's selector scope (see "Steel scoping rule" below). **Never edit the baseline to accept
  the new bytes** — that defeats the entire check.
- **Widening the baseline is additions-only**, and only when you deliberately want new shots
  pinned against future regression: append the new hash lines, never touch/reorder the
  existing ones, and bump the two literal count strings in `check-freeze.sh`'s comment +
  success echo to match. Full procedure:
  `.superpowers/sdd/sc108-fixture-coverage-design.md` §3. Widenings so far:
  - **2026-08-02, SC-108 / FOLLOWUPS #37: 98 → 101.** The `featureblock/advancement`
    fixture (3 lines: legacy-dark, legacy-light, steel-print).
  - **2026-08-04, SC-121 Batch 4: 101 → 107.** Two new browser fixtures, 3 lines each —
    `negotiation-checked` (the first fixture anywhere that renders a CHECKED checkbox;
    batch-1 review M-4) and `perk-narrow` (the first fixture at a NARROW/sidebar width,
    300px; batch-3 review L-5). Verified before and after: the pre-existing 101 lines are
    byte-identical and the run reported the SAME 5 known-mismatch names both times
    (96/101 → 102/107; the 5 treasure/gallery lines are a deliberate open item awaiting
    Scott's sanction, not a leak). Batch 4's modal/settings/canvas/sidebar coverage is
    Obsidian-camera and therefore out of the baseline by construction (see above).
  - **2026-08-07, SC-117 Batch 6: 107 → 113.** Two new browser fixtures, 3 lines each —
    `feature/spend` (the `--dse-surface-sunken` audit's D9: `.dse-section--spend` never
    rendered anywhere, so the class's own dashed-box styling was unverified — a named
    fixture variant gives one effect a `cost` starting "Spend") and
    `negotiation-pr-checked`, the harness's first INTERACTION_SHOTS entry (`shoot.mjs`
    performs one real click on the production affordance between mount-done and the
    screenshot, `entry.ts`'s new `INTERACTION_SHOTS` list, same "own id, own manifest
    array" convention as `NARROW_SHOTS`) — closes consumer #16:
    `.dse-pr__row[aria-checked='true']` was reachable only by user selection, which no
    static fixture could express. Verified before and after: `check-freeze.sh` reported
    a clean `107/107` before this widening (the SC-121 C-5 rebaseline already covers the
    5 treasure/gallery lines — no open mismatches on this branch) and `113/113` after,
    with the pre-existing 107 lines untouched. Deliberately landed BEFORE SC-117 B1 (the
    `--dse-surface-sunken` token flip): both new fixtures render surfaces gated by that
    token, and it's a Steel-scoped rule, so legacy/print must be unaffected by the flip —
    pinning them now makes any future leak into legacy/print loud instead of silent.
- **Sanctioned single-line rebaselines — the third case (rare; Scott-approved only).** A
  Steel-only DOM rebuild of a display family necessarily changes that family's frozen
  `*--steel-print.png` (print is a pure CSS attribute over whatever DOM the active theme
  built, so it renders the new Steel DOM — it cannot be branched around). When Scott has
  explicitly approved the after-shots for exactly that family, replace **only** that one
  `<hash>  <name>` line in `freeze-baseline.sha256` with the approved worktree shot's
  `sha256sum`, **at landing time, never mid-plan** — count unchanged, then re-run
  `check-freeze.sh` → `freeze OK (101/101 …)`. During execution the expected result is a
  sole mismatch on that file (e.g. `100/101`, only that name); any other mismatch is still
  a leak to fix. Each rebaseline needs its own dated sign-off recorded here:
  - **2026-08-03, SC-100** (plan 24 kit stat-tile rebuild): `kit--steel-print.png` only —
    Scott approved the round-3 after-shots; rebaseline applied at landing. Future Steel
    compositions for the remaining display families (SC-120) each need their own entry.
  - **2026-08-04, SC-121 (C-5)**: 5 lines — `treasure--legacy-{dark,light}.png`,
    `treasure--steel-print.png`, `gallery--legacy-{dark,light}.png`. A theme-agnostic
    CONTENT fix (treasure Project row rendered a raw markdown literal; `markdown: true`
    in treasureLayout) necessarily reaches Legacy/print. Scott approved explicitly
    ("oh that's fine. Fix it."); rebaseline applied at landing, count unchanged at 107.

## Parity semantics

**Site reference captures (Scott's rule, 2026-08-03): always capture BOTH color schemes.**
The site's top-right toggle switches light/dark, and **dark mode carries design features light
lacks** (e.g. gradient treatment on the kit-bonus tiles) — Scott finds dark the richer
reference and reviews against it. A light-only reference capture is an incomplete reference;
any ad-hoc Playwright capture of a site page for design-reference purposes must produce a
dark-mode shot (and ideally the light twin), matching how `parity:site` already captures both
schemes.

`npm run parity` diffs plugin-rendered CSS/DOM against the live v2 site on a fixed set of
mapped selectors. **The gate contract is a biconditional (SC-110):**

> **exit 0 ⟺ 0 GAPs AND 0 undeclared WARNs.**

Expected clean result today: **0 GAPs / 0 undeclared WARNs / 18 DECLARED rows / exit 0**.

A `WARN` now means "the comparison did not happen" (a selector that never rendered, an
unparseable value) and **fails the run** — before SC-110 it was printed and ignored, so a
pair could go blind with the gate still green. The only escape is an explicit
`declaredDeferrals` entry in `visual-harness/parity/selector-map.json`
(`{ pair, rule, scheme?, why }`), which prints as `DECLARED` and must cite a workspace
`FOLLOWUPS.md` number or a Linear ticket. `compare.cjs` refuses to run on a declaration that
names a missing pair, an unknown rule, a **non-declarable** rule, a rule the pair doesn't own,
or carries no citation; `diff.mjs` fails on a declaration that **matched nothing** (anti-rot).
Unit-tested, can-fail proof included, in `test/unit/parity/compare.test.ts`.

**Which classes are declarable.** Every rule has a property class, and the class decides
whether a divergence in it can ever be excused:

| Class | Rules | Declarable? |
|---|---|---|
| **material** | `bg`, `shadow`, `hairline-top`, `hairline-bottom` | **NEVER** — a hard contract error |
| geometry | `padding-*`, `margin-top`, `margin-bottom` | yes |
| typography | `font-size`, `line-height`, `body-font`, `letter-spacing` | yes |
| ink | `ink` | yes |
| capture | `capture-site`, `capture-plugin` (directional — one does not silence the other) | yes |

A flat surface, a missing bevel or a missing hairline is always closable in
`styles-source.css`, and a wholly flat Steel theme that passed human review is the exact
failure this gate was built to catch (plan 19) — so no material row may be declared away.
Geometry/typography/ink stay declarable because that is where genuine pixel decisions live.
(Conservative by design; relaxing it is a one-line change to `NON_DECLARABLE_CLASSES` in
`compare.cjs`.)

The 9 declared entries (18 rows — each covers both schemes) are four findings:
- **FOLLOWUPS #39** (8 rows) — `statblock-wrap` / `featureblock-wrap` `margin-top`/`-bottom`:
  site 34px (`1.7rem` on `.sb-wrap`/`.fb-wrap`) vs plugin 8px (Legacy-base `0.5em` on the
  host). A **pixel decision** for Scott, no longer an invisible one.
- **FOLLOWUPS #51** (6 rows) — `section-tag` `font-size`/`line-height`/`letter-spacing`:
  site 18px/30.6px/1.8px vs plugin 16px/27.2px/1.12px. One type-scale decision for Scott.
- **FOLLOWUPS #40** (2 rows) — `pr-chars:ink`: the plugin's single-node power-roll caption is
  deliberately heading-emphasised where the site splits `.pre`/`.chars`.
- **FOLLOWUPS #52** (2 rows) — `statblock-wrap:line-height`: site `.sb-wrap` 27.2px vs the
  plugin's statblock host 24px. A **one-line CSS fix** (the Plan 21 Task 2 `line-height: 1.7`
  group at `styles-source.css` ~3512 omits the statblock host), deferred only because the
  SC-110 fix round that surfaced it changes no plugin CSS.

If the DECLARED count or composition differs from this set, don't just accept a new number:
either it's a regression (fix it) or a new legitimate deferral (file it under its own
FOLLOWUPS number and add a `declaredDeferrals` entry citing it).

**`owns`** is the sibling mechanism: when the plugin collapses two site nodes into one, two
pairs share the plugin selector and each declares which rules it is authoritative for. It can
only **move** a rule — `compare.cjs` requires, for **every** plugin selector (shared or named
by a single pair), that each rule be owned by exactly one pair, so nothing can be dropped or
double-counted. The one way to drop a rule is an explicit `excludes: [{ rule, why }]` entry
citing a FOLLOWUPS number / ticket, priced exactly like a declared deferral; the shipped map
uses none.

> Until the SC-110 fix round that invariant ran **only on shared selectors**, so a pair naming
> a plugin node no one else named could narrow `owns` and silently drop the rest — exit 0, no
> error, no dead declaration. `statblock-wrap` was live proof, hiding two real `line-height`
> rows (now FOLLOWUPS #52). If you read a doc anywhere claiming the partition is unconditional
> and older than 2026-08-07, it was describing the intent, not the code.

## Steel scoping rule

Every new Steel CSS rule must carry
`[data-dse-theme='steel']:not([data-dse-print="on"])` — otherwise it leaks into the frozen
legacy/print shots and trips the freeze check. Only unfrozen steel-dark/steel-light shots may
change.

## Rebuild before live-vault review

`main.js`/`styles.css` at the plugin root are **untracked build artifacts**. The harness
(`npm run shots`, `npm run parity`) compiles its own bundle via `harness:build` — so gates
stay green even while the vault-loaded `main.js`/`styles.css` lag behind. Before any live
Obsidian-vault review (Scott's or your own), rebuild explicitly:

```bash
devbox run -- bash -c 'cd /abs/path/draw-steel-elements && npm run build-no-check'
```

## Current expected numbers (drift — verify against current main)

As of dse SC-117 Batch 6 (branch `sc117-audit`, 2026-08-07, `f09f6cc` + this batch's
commit): jest **2191/154 suites** (+1: the new `feature/spend` fixture's own
fixtures.test.ts mount case), shots **189** (+10: `feature-spend`/`negotiation-pr-checked`
× 5 combos each), freeze **113/113 clean** (widened from 107 — no open mismatches on this
branch; the SC-121 C-5 rebaseline already covers the 5 treasure/gallery lines main was
still carrying).

As of dse SC-110/SC-109 + fix round (branch `guards` rebased onto B6, 2026-08-07): jest
**2248/155 suites**, parity **0 GAPs / 0 undeclared WARNs / 18 DECLARED / exit 0** — the
old "10 WARNs" number predates the declared-deferrals contract (exit 0 ⟺ 0 GAPs AND every
WARN declared; material classes `bg`/`shadow`/`hairline-*` are never declarable; the
"16 DECLARED" number predates the fix round that stopped `statblock-wrap` hiding two rows).
`npm run parity` also runs in CI as of SC-109. These numbers change as the plugin
grows — treat them as "what to expect right now," not a hardcoded target. Always confirm the actual counts against whatever commit you're
gating, and if they differ, figure out why before treating it as either pass or fail.
