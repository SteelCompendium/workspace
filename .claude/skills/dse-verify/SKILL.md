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
| 4. Freeze check | `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <repo>/draw-steel-elements/visual-harness/shots` | `freeze OK (107/107 …)` |
| 5. Parity (LAST) | `npm run parity` | `0 GAPs`, exactly the documented 10-WARN deferral set, exit 0 |
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

## Parity semantics

**Site reference captures (Scott's rule, 2026-08-03): always capture BOTH color schemes.**
The site's top-right toggle switches light/dark, and **dark mode carries design features light
lacks** (e.g. gradient treatment on the kit-bonus tiles) — Scott finds dark the richer
reference and reviews against it. A light-only reference capture is an incomplete reference;
any ad-hoc Playwright capture of a site page for design-reference purposes must produce a
dark-mode shot (and ideally the light twin), matching how `parity:site` already captures both
schemes.

`npm run parity` diffs plugin-rendered CSS/DOM against the live v2 site on a fixed set of
mapped selectors. Expected clean result: **0 GAPs / 10 WARNs / exit 0**.

The 10 WARNs are not noise — they are exactly the documented per-(pair, rule) deferrals from
`visual-harness/parity/selector-map.json`'s `expectedGapsNote`:
- **4×** FOLLOWUPS #39 — `featureblock:margin-top` / `featureblock:margin-bottom`, ×2 schemes
  (the site's real block margin lives on the un-paired `*-wrap` node, not the mapped pair).
- **6×** FOLLOWUPS #40 — `section-head:ink`, `section-head:letter-spacing`, `pr-head:ink`,
  ×2 schemes (the pair maps the plugin's content node to the site's text-less flex wrapper).

If the WARN count or composition differs from this set, don't just accept a new number:
either it's a regression (fix it) or a new legitimate deferral (file it under its own
FOLLOWUPS number and update `selector-map.json`'s `expectedGapsNote`).

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

As of dse SC-121 Batch 4 (branch `sc121-fixes`, 2026-08-04): jest **2189/154 suites**,
shots **179**, obsidian-shots **141**, freeze **107** lines (currently 102/107 — the 5
treasure/gallery mismatches are a KNOWN open item pending Scott's sanction, not a
regression), parity **0 GAPs / 10 WARNs / exit 0**. These numbers change as the plugin
grows — treat them as "what to expect right now," not a hardcoded target. Always confirm the actual counts against whatever commit you're
gating, and if they differ, figure out why before treating it as either pass or fail.
