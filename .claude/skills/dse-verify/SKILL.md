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
| 2. Lint | `npm run lint` | clean (no output), exit 0 — gated in CI as of SC-136/FOLLOWUPS #61 |
| 3. Unit tests | `npx jest` | all suites/tests green |
| 4. Visual shots | `npm run shots` | regenerates `visual-harness/shots/` |
| 5. Freeze check | `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <repo>/draw-steel-elements/visual-harness/shots` | all producible shots byte-identical, **0 FAILED** checksums — see "Current expected numbers" below for today's baseline size vs. how many of its lines a given branch can produce |
| 6. Parity (LAST) | `npm run parity` | `0 GAPs`, `0 undeclared WARNs`, exactly the documented declared-deferral set, exit 0 |
| 7. Obsidian shots (only if a display is available) | `npm run obsidian-shots` | regenerates ground-truth PNGs from a real spawned Obsidian |

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

### Stale `main.js` shadows `main.ts` for jest (2026-08-18, FOLLOWUPS #77)

A built `main.js` at the plugin root silently replaces `main.ts` for any test that reaches
`visual-harness/entry.ts` (it imports `'../main'` relatively — the `'^main$'` mapper misses
it; jest prefers `.js`). **`cssNesting.test.ts` WRITES `main.js`, so each jest run plants the
artifact for the next.** Symptom: dozens of failures shaped `X is not a function` from a
bundle older than the source you're testing (67 on SC-169's fix round). **Protocol until
#77 lands: `rm -f main.js styles.css` in the plugin root before `npx jest`**, and if a jest
red mentions a method you just added, suspect this first.

### Load-sensitive jest suites (shared build host, 2026-08-16)

With several agents running batteries concurrently (1-min load 45–57 observed), jest's
default 5s per-test timeout fires in the two slowest suites — `test/dom/views/settings-tab`
and `settings-preview` — producing 4–6 "Exceeded timeout" failures that look like a
regression and are not. Proven by A/B: the BASE commit under the same load fails the same
five tests; a re-run on a quiet machine is fully green. **Rule: on a timeout-shaped red in
those suites, check `/proc/loadavg` and re-run before believing it** — and never let a
fix round "address" it. Prefer to run the full battery when load is low; tsc/lint/shots/
freeze/parity are not load-sensitive in the same way.

### THE exit-code footgun

A pipe or a trailing command can silently turn a real failure into an apparent success:

- `cmd 2>&1 | tail -20` reports **tail's** exit status (0), not `cmd`'s — and since
  `$PIPESTATUS` doesn't survive the devbox sh wrapper, you can't recover the real code that
  way either.
- `cmd; echo done` has the same effect: `echo`'s exit status (0) becomes the new `$?`.
- `devbox run -- bash -c "cmd; echo X=\$?"` (DOUBLE quotes) reported `X=0` for a jest run
  with 6 real failures (SC-165 review, 2026-08-16) — the escaped `\$?` is expanded by the
  outer shell/devbox wrapper before bash ever sees it. Never trust an echoed `$?` through
  double quotes; read the tool's own textual summary (jest's "Tests:" line, `freeze OK`,
  parity's counts) as the truth, or use single quotes with the gate command LAST.

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

## In-run gates inside `npm run shots` (SC-205, 2026-08-28)

`npm run shots` carries two loud in-run gates beyond the captures themselves. Both print an
OK line on success; read the lines, don't infer from exit code alone.

- **Host-copy pin** (`visual-harness/obsidian-host-pin.mjs` + `shoot.mjs`): verifies the
  harness's Obsidian button model (`OBSIDIAN_HOST_BUTTON_CSS` in `shoot.mjs`) AND the
  human-facing listing in `styles-source.css`'s host-rules comment against the newest
  installed Obsidian asar (`~/.config/obsidian/obsidian-*.asar`; the `/opt` installer copy
  is years stale and deliberately never used as a comparison source). Expected line:
  `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the
  styles-source.css listing … 21 further rules … excluded by documented ancestor scope, 0
  unclassifiable …)`. On a machine with no asar at/above the pinned version (currently
  1.13.7): **`host-copy pin PARTIAL` — expected, not a failure**; the in-repo
  sheet-vs-model fence check still runs unconditionally, and the pin never compares
  against an asar older than the pinned version. Real failures print
  `HOST COPY DRIFTED` / `IN-REPO HOST-MODEL CHECK FAILED` with a drift-kind-specific
  remedy — follow the printed remedy (an Obsidian self-update means re-extract and update
  `PINNED_OBSIDIAN` + both copies; a sheet-listing drift means fix the comment/model, NOT
  re-extract). Deferred parser-hardening edge cases: SC-276.
- **Button host-leak sweep** (`assertBtnHostLeak` in `shoot.mjs`): computed-style
  invariance of every gallery button kind with vs. without the injected host copy, now at
  **3 states (rest / hover / focus-visible) × dark/light**. Expected line as of SC-205:
  `button host-leak OK (111 button kinds × 3 states … = 666 comparisons …)` plus a printed
  12-record exemption boundary (8 focus-visible disabled, 2 hover no-hit-point, 2
  focus-visible `visibility: hidden`). Kind counts drift as fixtures/chrome grow — treat
  them as "expect right now", and treat any per-record `matches(':focus-visible')` failure
  or a new unexplained exemption as a real red, not noise.

Battery numbers at SC-205 land-ready (dse branch `sc205-btn-host-leak`, 2026-08-28, base
`16e25ff`): jest 3257 passed / 1 skipped / 185 suites; shots 474 PNGs, 0 FAIL; freeze
210/210, 0 mismatches; parity 0 GAPs / 0 undeclared / 16 DECLARED. SC-205 moved zero
pixels and zero frozen bytes; shots runtime grew ~+35 s (+11%) from the two state passes.

## Freeze semantics

`check-freeze.sh` (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh`)
compares real bytes because `visual-harness/shots/` is gitignored — a `git status` check on
that directory is vacuous. It runs `sha256sum -c` against
`.superpowers/sdd/freeze-baseline.sha256`, a flat list of **66** `<hash>  <filename>` lines —
**`*--steel-print.png` only**, one per browser capture id.

**Only print is frozen (SC-144, 2026-08-11).** The baseline used to be three classes
(`*--legacy-{dark,light}.png` + `*--steel-print.png`) and two thirds of it existed to hold
the legacy theme still. That theme is gone; those 134 lines were retired. What the gate is
now, and is not:

- **What it still catches:** `steel-print` renders the SAME DOM as the screen combos (print
  is a CSS attribute layered over whatever DOM the render produced — it cannot be branched
  around). So every theme-agnostic DOM or content regression still trips it — the class the
  SC-121 treasure fix tripped — just at one capture class instead of three. It also catches
  the specific accident worth a byte gate: a structure-tier Steel rule leaking into print.
- **What was genuinely lost:** byte coverage of *screen-only, base-layer* CSS regressions.
  Nothing pins steel-dark/steel-light bytes today.
- **Why Steel is deliberately NOT frozen:** Steel is under active design (SC-120's remaining
  family compositions, SC-117's token work). A frozen Steel would go red on every *intended*
  change and demand a sanctioned rebaseline each time — precisely the "a gate that always
  reads red trains people to skim it" failure the SC-117 M3 fix was written to eliminate.
  Revisit once 7.0.0 ships. `steel-print` is the right survivor because print is stable and
  is never itself the target of design work, so it goes red only when something leaked.

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
  a new/edited Steel CSS rule leaked into the print scheme. Fix it by narrowing the rule's
  selector scope (see "Steel scoping rule" below). **Never edit the baseline to accept the
  new bytes** — that defeats the entire check.
- **Division of labor (standardized 2026-08-11 → 08-16; role mapping updated for v2,
  2026-08-27): worktree agents NEVER edit the shared baseline — only the dispatcher applies
  changes, at landing.** When a branch legitimately moves frozen bytes, the agent's
  deliverable is a ready-to-apply hash file at `.superpowers/sdd/<effort>/rebaseline.txt`
  (`<sha256>  <filename>` lines, verified deterministic across 2 runs) plus before/after
  crops for the sanction ask. The **ticket-owner** then puts the sanction ask on the ticket
  and (1) gets Scott's explicit sanction on the ticket (his "sanctioned" / "good to go" quote
  is the record); at landing the **dispatcher** (2) backs the baseline up to a dated
  `freeze-baseline.sha256.pre-<effort>-bak`, (3) applies the lines, (4) appends a dated
  entry to this file quoting the sanction. Widenings (additions-only) need no sanction —
  the dispatcher verifies additions-only by sorted-diff and applies at landing.
  - **2026-08-26, SC-185 round 3 (six approved categories): 94 lines rebaselined, count
    unchanged at 210 — APPLIED at landing.** Scott approved six of the eight font-scale
    categories (A roll surfaces, B statblock display values, D notice/badge chrome, F
    initiative cell readout, G stamina numeral derivation, H the snap/derive tail) and
    declined C (stamina-editor modal) and E (sticky mini-header + char box). **His sanction,
    SC-185 comment 2026-08-26, in direct reply to an ask that spelled out the cost — "The
    freeze baseline moves for the set you pick … This is a **sanctioned rebaseline**, so it
    needs your word":**

    > "approved"

    47 capture ids × 2 (steel-print twin + steel-realprint) = 94 lines. **Expected 49 pairs,
    actual 47** — `statblock-kwusage-{grid,ledger}` are moved independently by BOTH category B
    and category H, so the union of the per-category sets is 47, not the arithmetic sum. This
    is exactly why a combined rebaseline must be generated from the real bytes of the combined
    tree and never stitched from per-category files. Verified at apply time: the 94 failing
    filenames were **identical** to the rebaseline's filename set (no collateral movement); the
    baseline's filename set is unchanged before/after (hashes only, 0 added, 0 removed); and
    `check-freeze.sh` returned `freeze OK (210/210)` afterwards. Determinism: 5 clean sweeps,
    all byte-identical, plus one more after rebasing onto `origin/develop` (SC-197 + SC-126),
    which left all 94 hashes valid — both are shot-neutral. Backup:
    `freeze-baseline.sha256.pre-sc185r3-bak`.
- **RETIREMENT — the fourth baseline operation (2026-08-11, SC-144).** Distinct from a
  widening (new names, additions-only), a sanctioned rebaseline (an approved change moves an
  existing frozen shot's bytes) and a capture-artifact correction (the harness was pinning
  the wrong thing). A **retirement removes lines for a surface that no longer exists** — the
  shots are not wrong, they are no longer producible at all, so leaving them in would make
  the gate permanently report "missing" for a reason no future branch can ever fix.
  - **The sanction is Scott's ruling on SC-144**: *"The 'legacy' theme option is completely
    broken. I dont particularly feel like fixing it. Instead lets just drop support for
    it."* Dropping the theme is what makes the 134 legacy lines unproducible; retiring them
    is the mechanical consequence, not a separate visual decision.
  - **200 → 66, removals-only.** 67 `*--legacy-dark.png` + 67 `*--legacy-light.png` deleted;
    all 66 `*--steel-print.png` lines kept **byte-identical**. Proof recorded at the time:
    a sorted diff of old vs. new shows **134 `<` lines, 0 `>` lines** (nothing added,
    nothing changed), and `diff <(grep -- '--steel-print.png$' <old>) <new>` is empty. The
    66 hashes were then re-verified against a fresh `npm run shots` on the SC-144 branch →
    `freeze OK (66/66 …)`, exit 0.
  - Backup kept forever: `freeze-baseline.sha256.pre-sc144-bak`.
  - **A retirement is removals-only by definition.** If applying one would change or add a
    hash, something else is going on — stop and diagnose it as its own case.
- **Baseline corrections — the CAPTURE-ARTIFACT case (rare): the baseline pinned an artifact, not
  a look.** Distinct from a widening (new name, additions-only) and a sanctioned rebaseline
  (an approved DOM/CSS change legitimately moves a frozen shot) — here the *harness itself*
  was capturing the wrong thing, so the frozen bytes never represented the surface they claim
  to.
  - **2026-08-07, SC-117 fix wave M1.** `shoot.mjs`'s interaction-shot click
    (`page.locator(opts.click).click()`) left the pointer sitting on the clicked row, so
    every `negotiation-pr-checked--*` shot captured `:hover` (`--dse-hover`,
    `rgba(77,184,199,.1)`) painted OVER the row's resting fill instead of the resting fill
    itself — the three frozen lines were pinned to a hover wash, not to consumer #16's
    actual at-rest surface. Fix: `await page.mouse.move(0, 0)` right after the click, before
    the screenshot (one line, `visual-harness/shoot.mjs`). Verified live before re-pinning: a
    standalone probe (click via `page.locator(...).click()`, then `mouse.move(0,0)`, then
    read `getComputedStyle`) reports `hover: false`, `background-color: rgba(0,0,0,.18)`
    steel-dark / `rgba(0,0,0,.02)` steel-light — the surface `.dse-pr__row[aria-checked=true]`
    is actually supposed to paint. Baseline backed up to
    `freeze-baseline.sha256.pre-hoverfix-bak` before editing; only **2 of the 3** frozen lines
    actually changed bytes on regeneration — `negotiation-pr-checked--legacy-{dark,light}.png`
    changed, but `--steel-print.png` came back byte-**identical**, because `:hover` does not
    apply under Playwright's print-media emulation regardless of pointer position, so that one
    line was never actually contaminated. All three lines were nonetheless re-pinned to the
    freshly regenerated at-rest bytes (the unchanged one is a no-op write), count unchanged at
    119. This is a **capture-artifact correction, not a visual change** — no CSS moved, no
    surface got lighter or darker; the fix only stopped the camera from pinning its own
    pointer position into the golden.
- **Widening the baseline is additions-only**, and only when you deliberately want new shots
  pinned against future regression: append the new hash lines, never touch/reorder the
  existing ones, and bump the two literal count strings in `check-freeze.sh`'s comment +
  success echo to match. Full procedure:
  `.superpowers/sdd/sc108-fixture-coverage-design.md` §3.
  - **Post-SC-144 arithmetic: a widening is ONE line per new capture id, not three.** Every
    historical entry below reads "3 lines each (legacy-dark, legacy-light, steel-print)"
    because all three classes were frozen then. Only `*--steel-print.png` is now, so a new
    fixture contributes exactly one line — don't pattern-match the examples and go looking
    for two more hashes that no longer exist.

  **2026-08-23, SC-188 (flat feature style): 4-line sanctioned rebaseline, count
  unchanged at 210.** The plugin drew an act-colored spine bar in flat mode that the
  site never draws — a previous round (SC-101) had only squared the bar's corners, on an
  assumption its own code comment recorded as fact ("the site's flat mode uses a plain
  square border-left"), which turned out to be false. Setting the flat-mode bar to
  `display:none` legitimately moves exactly two twin+realprint pairs:
  `statblock-featstyle-flat--steel-{print,realprint}` and
  `featureblock-featstyle-flat--steel-{print,realprint}`. **Scott's sanction: "sc-188
  approved" (2026-08-23)**, on an ask that named the four files and showed before/after.
  Verified before applying: the agent stash-proved the "before" hashes byte-identical to
  the then-live baseline, hashes deterministic across two clean sweeps, twin==realprint
  within each pair. Backup: `freeze-baseline.sha256.pre-sc188-bak`. Post-apply against
  the branch's shots: `0 checksum mismatches` (14 "missing" are SC-183's newer tracker
  ids, not producible on that older base — expected, not a failure).

  Widenings so far:
  - **2026-08-23, SC-183 promotion round: 196 → 210.** Seven new capture ids × twin +
    realprint (14 lines), from the tracker overhaul's new fixtures: `initiative-roster`,
    `-roster-500`, `-roster-narrow`, `initiative-squads`, `-squads-500`,
    `initiative-portraits-off`, `initiative-mark-seal`. **Additions-only, so no sanction
    needed** — verified before applying that none of the 7 names already existed in the
    196-line baseline (scripted collision check, zero hits), hashes deterministic across
    two clean sweeps, twin==realprint per pair. Backup:
    `freeze-baseline.sha256.pre-sc183-bak`. Post-apply: `freeze OK (210/210)`, exit 0.
    Note the four losing `initiative-mark-*` candidates (sheathe/shutter/laurel) were
    deleted in the same round and were never in the baseline, so this is a pure addition,
    not a swap. **`check-freeze.sh` needs no edit for a widening** — its counts are
    computed (`${ok_count}/${total}`), not literals; the "66" in its header comment is
    stale historical prose, not a live count.
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
  - **2026-08-07, plan 25 / SC-102 S-5 (worktree `sc10x-structural`, Task 7): 113 → 119.**
    Two new browser fixtures, 3 lines each — `feature/villain`, the only REAL standalone
    villain action anywhere (the D9 `feature/example.yaml` is a *permanent* false villain:
    `ability_type: Villain Action 1` alongside `usage: Main action`, and usage correctly
    wins — FOLLOWUPS #53), and `statblock/villain-corpus`, villain actions in the shape
    `steel-etl` actually emits (`cost: "Villain Action N"` + `usage: "-"`, **no**
    `ability_type` — the shape the task-3 review found made the whole feature a no-op on
    real content). Verified: `diff <(head -113 …) …pre-plan25-bak` is empty — the
    pre-existing 113 lines are byte-untouched — and both fixtures' **legacy** twins were
    green *before* the widening (they were simply unlisted), so pinning them records a
    proven-clean state, not a leak. **What this widening does NOT do:** it pins the trio's
    own after-bytes only for *new names with no prior frozen state*. The 5 pre-existing
    `*--steel-print.png` lines the trio moves are a separate, Scott-sanctioned rebaseline
    (below) applied at landing — never bundled into a widening.
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
  - **2026-09-04, SC-191 montage element overhaul (worktree `sc191-montage-overhaul`,
    landed dse `c2a5cec` to develop): SANCTIONED 2-line rebaseline (1 twin+realprint pair)
    + 14-line WIDENING (7 new capture ids × twin+realprint), 210 → 224 — APPLIED at
    landing by the dispatcher.** The redesigned `ds-montage` element (board grid, log/roll
    modal, collapsible strip + guide) necessarily moves `montage--steel-print.png` /
    `-realprint.png` for the same reason every prior entry in this section does — print
    renders whatever DOM the active theme built, and a Steel-only DOM rebuild cannot be
    branched around it. **Scott's sanction: "Approved, lets land it" (SC-191 comment,
    2026-09-04 13:55 UTC)**, against a self-contained ask carrying before/after crops (the
    print card gaining visible gold ▲/▼ tier-pip triangles; a limit-ended montage's header
    correctly reading "ROUND 1/2/3 DONE" instead of stale "IN PLAY"). Both fixes were the
    subject of a review-2 FIX-ROUND (fix round 4) before the ask went out — the pip fill and
    the round-header state bug were both caught and closed prior to landing, not shipped
    then patched. The widening's 7 new capture ids: `montage-strip-pinned`,
    `montage-guide-open`, `montage-mid`, `montage-old-shape`, `montage-failed`,
    `montage-narrow`, `montage-done` — the redesign's own new fixture coverage, additions-
    only (0 collisions with the pre-existing 210-line baseline, scripted check). Verified
    before applying: the rebaseline+widening files were both generated from the final,
    fully-reviewed tree (`c2a5cec`) and deterministic across the branch's own repeated
    shots runs; every pair twin==realprint. Verified after applying, from a fresh
    `npm run shots` regenerated on the landed worktree tip (`c2a5cec`, matching
    `origin/develop`): `freeze OK (224/224 …)`, exit 0. Backup:
    `freeze-baseline.sha256.pre-sc191-bak`.
  - **2026-08-29, SC-120 §D2 Steel compositions for the remaining display families
    (worktree `sc120-d2-steel-compositions`, landed dse to develop): SANCTIONED 24-line
    rebaseline (12 twin+realprint pairs), count unchanged at 210 — APPLIED at landing by
    the dispatcher.** The effort built Steel compositions for twelve display families
    across three batches — Batch C: ancestry, condition, perk (+ perk-narrow), rule;
    Batch A: class, career; Batch B: treasure, title, complication (+
    complication-edit-btn), culture — each necessarily moving that family's frozen
    `*--steel-print.png`/`*--steel-realprint.png` pair for the same reason every prior
    entry in this section does: print renders whatever DOM the active theme built, and a
    Steel-only DOM rebuild cannot be branched around it. **Scott's sanction, in two
    parts:** Batch C — SC-120 comment, 2026-08-29 01:16 UTC, replying to the Batch C
    sanction ask verbatim: *"Looks great, go for it."* Batches A and B — SC-120 comment,
    2026-08-29 11:20: *"All aproved."* Both asks named their families and carried
    before/after crops; every "before" hash in `rebaseline.txt` was cross-checked against
    the fix-round tables with zero novel values before the ask went out. Applied on the
    REBASED landing tree (the branch was rebased onto `origin/develop` `6035d12` after
    SC-190 landed in between; full battery re-run post-rebase: tsc/lint clean, jest
    3394+1sk/3395, shots 0 FAIL deterministic across 2 runs, parity 0/0/16). Verified
    before applying: the 24 mismatch names from a fresh `check-freeze.sh` run on the
    rebased tree matched `rebaseline.txt`'s filename set exactly (diff empty both ways);
    every hash byte-identical across the 2 shots runs. Backup:
    `freeze-baseline.sha256.pre-sc120-bak`. Verified after: `freeze OK (210/210 …)`,
    exit 0.
  - **2026-08-22, SC-152 sheet styling + characteristics unification (worktree
    `sc152-sheet-styling`, landed dse to develop): SANCTIONED 20-line rebaseline
    (10 twin+realprint pairs), count unchanged at 196 — APPLIED at landing by the
    orchestrator.** Sanction: **Scott on SC-152, 2026-08-22: "sc-152 looks great, kick
    it off"** — against the round-3 self-contained ask that enumerated exactly this
    set. The ask grew from round 2's "2 lines" to 20: SC-170's realprint class doubled
    every line, and round 3 (Scott's same-comment direction: "The characteristics here
    should probably be the same css and code that is used in the statblocks") moved 8
    more pairs. The 10 pairs by cause: `heroic-resource` + `surges` — the round-2
    dead-selector padding repair (base-tier, legitimately reaches print, exactly as
    hero-tokens' always has); `characteristics`, `hero`, `hero-narrow`, `hero-sparse`,
    `hero-collapsed`, `chrome-hover-hero`, `chrome-placement-trio`,
    `chrome-collapsed-trio` — the characteristics DOM unification (ds-char + the hero
    sheet's region render the statblock's `.dse-sb__chars` rail via the shared kit
    builder; the three chrome/collapsed names are SC-169 fixtures that render the hero
    — the plan-25 "sibling fixture name-collateral" case, and collapsed prints
    expanded). **No statblock pair moved** — the statblock's renderChars delegation to
    the kit was proven byte-identical, which was the unification's own correctness
    gate. Every pair twin==realprint; deterministic across repeated clean sweeps;
    hashes computed from the REBASED landing tree (post-SC-168 develop), re-verified
    unchanged after the fresh-eyes fix round (docs-image regen + comment fixes +
    screen-only overflow guard — none touch print). Backup:
    `freeze-baseline.sha256.pre-sc152-bak`. Deliverable preserved in
    `.superpowers/sdd/sc152/`. Verified after: `freeze OK (196/196 …)`, exit 0.
  - **2026-08-20, SC-154 tracker layout + SC-162 (worktree `sc154-tracker-layout`, landed
    dse to develop): SANCTIONED 8-line rebaseline (4 twin+realprint pairs) + 14-line
    WIDENING (7 new capture ids × twin+realprint), 182 → 196 — APPLIED at landing by the
    orchestrator.** Sanction: **Scott on SC-154, 2026-08-20: "Option 1, sanctioned"** —
    covering (a) the round-0→2 encounter/initiative spacing + portrait-fallback changes
    (the "encounter/initiative print pair still pending from round 2") and (b) the round-3
    command-bar layout he picked becoming the default. The ask named 2 pairs
    (`encounter`, `initiative`); the applied set is 4 pairs because SC-169 landed in
    between and froze two NEW encounter-rendering fixtures (`encounter-collapsed`,
    `chrome-collapsed-rollout`) at the pre-SC-154 bytes — the plan-25 "sibling branch's
    new fixture enlarges your rebaseline ask" case. Diagnosed, not assumed:
    `encounter-collapsed--steel-print` was byte-identical to `encounter--steel-print` in
    the OLD baseline and is byte-identical to it again in the new bytes (a collapsed
    element prints expanded — chrome is print-absent), so the extra pairs are the same
    sanctioned pixels under new names; `chrome-collapsed-rollout` is the rollout stack
    containing the encounter. Every pair twin==realprint (in-run print-twin parity 98/98);
    deterministic across 3 full sweeps incl. one from an rm-rf'd shots dir (which caught
    stale round-3 review shots masquerading as producible — wipe before trusting a name
    list). The widening's 7 ids: `encounter-narrow`, `initiative-narrow`,
    `initiative-no-images`, `initiative-no-images-narrow` (rounds 0-2 fixtures that were
    never widened), `initiative-controls` (the mid-fight bar), `initiative-controls-narrow`
    and `initiative-log-open` (the drawer open — the promotion round's two permanent
    regression shots). Backup: `freeze-baseline.sha256.pre-sc154-bak`. Deliverable files
    preserved in `.superpowers/sdd/sc154/`. Verified after: `freeze OK (196/196 …)`,
    exit 0.
  - **2026-08-03, SC-100** (plan 24 kit stat-tile rebuild): `kit--steel-print.png` only —
    Scott approved the round-3 after-shots; rebaseline applied at landing. Future Steel
    compositions for the remaining display families (SC-120) each need their own entry.
  - **2026-08-04, SC-121 (C-5)**: 5 lines — `treasure--legacy-{dark,light}.png`,
    `treasure--steel-print.png`, `gallery--legacy-{dark,light}.png`. A theme-agnostic
    CONTENT fix (treasure Project row rendered a raw markdown literal; `markdown: true`
    in treasureLayout) necessarily reaches Legacy/print. Scott approved explicitly
    ("oh that's fine. Fix it."); rebaseline applied at landing, count unchanged at 107.
  - **2026-08-12, SC-123 defaults flip (worktree `sc123-defaults`): 18 lines rebaselined,
    count unchanged at 67 — APPLIED at landing.** All 18 statblock-family
    `*--steel-print.png` lines (and ONLY those — the untouched 49 cross-checked) moved by
    ONE ruling: Scott flipped the two site-divergent defaults to site parity
    (`sbCharLine` 'one'→'two', `sbVillain` 'inline'→'banded') — **his sanction, SC-123
    comment 2026-08-12: "nobody has this code yet... Lets do the correct thing"**, given in
    direct response to the gate ask that named the frozen-shot cost. Independent re-review
    hash-verified all 18 after-hashes against its own regenerated shots and eyeballed crops
    (only the characteristics/villain reshapes). Backup:
    `freeze-baseline.sha256.pre-sc123-defaults-bak`. Verified after: 67 lines, 0 duplicate
    names.
  - **2026-08-11, SC-146 round 2 (worktree `sc146-round2`): 17 lines rebaselined + 1-line
    widening, 66 → 67 — APPLIED at landing.** The 17 rebaselined `*--steel-print.png` lines
    (statblock + its preference-variant fixtures) all trace to ONE Scott-requested change:
    the head-notch diamond's clearance above the primary stat row (Scott's SC-146 round-2
    bug #4), which shifts print content below the head down ~9 CSS px. Pixel forensics
    (independent re-review) confirmed a pure vertical translation + sub-pixel glyph
    re-hinting, nothing structural; every "before" hash verified against the pre-sanction
    baseline. **Scott's approval 2026-08-11, SC-146 comment "146 is good to go"** against
    the self-contained sanction ask (comment `1cf8beb7`) carrying the before/after crop
    (`r2-item3-notch-print.png`). The widening adds `statblock-with-captain--steel-print.png`
    (the new 4-secondary-cell fixture). Backup: `freeze-baseline.sha256.pre-sc146r2-bak`.
    Verified after: `freeze OK (67/67 steel-print PNGs byte-identical)`, exit 0.
  - **2026-08-18, SC-169 element chrome panel + collapse (worktree `sc169-menu-panel`, landed
    dse `062a109`): SANCTIONED 10-line rebaseline (5 stamina pairs) + 38-line WIDENING (19 new
    capture ids × twin+realprint), 144 → 182 — APPLIED at landing by the orchestrator.**
    Sanction: Scott on SC-169, 2026-08-18: **"Option D and E3. Sanctioned"** — the stamina
    bar's old "Stamina Bar" disclosure header removed in favour of the framework chrome
    panel; every `ds-stamina` fixture (`stamina-bar`, `-dying`, `-recoveries`, `-winded`,
    `stamina-rail`) moves as a twin+realprint pair (each pair identical, deterministic; before
    hashes matched the live baseline; crops on the ticket). Widening: 19 chrome/collapse
    capture ids (`chrome-*`, `*-collapsed`, `stamina-bar-collapse-default`,
    `stamina-bar-not-collapsible`) — none had ever been widened because the branch spanned 3
    rounds; each pair twin==realprint, 0 collisions. Verified in one pass: 10 swapped, 38
    added, 0 removed, 0 duplicate names, `freeze OK (182/182 …)`. Backup:
    `freeze-baseline.sha256.pre-sc169-bak`. Panel itself is print-absent by construction
    (both classes) — verified on a real Obsidian PDF export by two independent reviewers.
  - **2026-08-18, SC-156 hero example codes (worktree `sc147-inserts`, landed dse `3bc7685`
    with SC-147/148): 6-line SANCTIONED rebaseline, count unchanged 144 → 144 — APPLIED at
    landing by the orchestrator. FIRST rebaseline under the twin+realprint pair rule.** The
    ask on SC-156 was 3 twin lines (`hero`, `hero-narrow`, `hero-sparse` `--steel-print`);
    landing after SC-170 froze the realprint class, each twin's `--steel-realprint` sibling
    moved identically → 6 lines applied as 3 PAIRS. Verified before applying: each pair's
    twin hash == realprint hash on the rebased tree; deterministic across 2 runs; check-freeze
    reported exactly these 6 and nothing else. Visible change = two ability-row titles in the
    starter hero (placeholders → `brutal-slam`/`thunder-roar`); crop of the entire pixel delta
    on the ticket. **Scott's sanction, 2026-08-18: "sanctioned"** (after asking what the ask
    was — lesson recorded in orchestrate/linear-flow: lead with the one-line ask, mechanics
    below). Hashes regenerated from the REBASED landing tree (da96da2 base), NOT the branch's
    old `sc156-rebaseline.txt` (which predates SC-170's class and 6 landings). Backup:
    `freeze-baseline.sha256.pre-sc156-bak`. Verified after: `freeze OK (144/144 …)`, exit 0.
  - **2026-08-18, SC-170 real `@media print` (worktree `sc170-real-print`, landed dse
    `da96da2`): 72-line widening (additions-only), 72 → 144 — APPLIED at landing by the
    orchestrator. THIS ADDS A SECOND FROZEN CLASS.** The harness now captures every
    element under Playwright `emulateMedia({media:'print'})` as `<id>--steel-realprint.png`
    alongside the existing print-preview twin `<id>--steel-print.png`. **Invariant pinned:
    every realprint hash equals its twin's hash** (verified 72/72 at landing on the REBASED
    tree; deterministic across clean sweeps) — real Ctrl-P/PDF export must render exactly
    what the print-preview twin renders. `npm run shots` also asserts this in-run
    ("print-twin parity 72/72") and asserts print-class coverage (a capture with one class
    but not the other fails). Backup: `freeze-baseline.sha256.pre-sc170-widening-bak`;
    `check-freeze.sh` echo label updated (backup `.pre-sc170-bak`; arithmetic unchanged —
    it was always `sha256sum -c` over the whole file). Verified after: `freeze OK (144/144
    …)`, exit 0. **Consequence for future rebaselines: a sanctioned change to a print twin
    now moves TWO lines (twin + realprint), and they must move together — a delta touching
    only one of the pair is a bug (real print diverging from the preview), not a rebaseline.**
  - **2026-08-17, SC-160 statblock sticky mini-header (worktree `sc160-sticky-header`,
    landed dse `c676d58`): 5-line widening (additions-only), 67 → 72 — APPLIED at landing by
    the orchestrator.** The 5 lines are `statblock-sticky{,-unscrolled,-nometa,-off,-narrow}
    --steel-print.png` — new fixture NAMES only; the sticky is screen-only chrome (reveal rule
    under `@media screen` + `:not([data-dse-print="on"])`), so three of the five print twins
    are byte-identical to each other (bar inert in print) — expected. Hashes generated from
    the REBASED tip in the landing tree, not the agent's rebaseline file. Additions-only proof:
    sorted diff 0 `<` / 5 `>`; no duplicate names. Backup:
    `freeze-baseline.sha256.pre-sc160-widening-bak`. Verified after: `freeze OK (72/72
    steel-print PNGs byte-identical)`, exit 0. No sanction needed (no existing hash moved).
  - **2026-08-11, SC-145 edit-button placement (worktree `sc145-edit-button`): 12-line
    widening (additions-only), 188 → 200 — APPLIED at landing by the orchestrator.** The 12
    lines are the frozen-class twins of 4 new `*-edit-btn` authoring-controls fixtures (the
    setting's first shot coverage). Hashes pre-verified byte-identical by the independent
    review (`sc145-freeze-widening-12.txt`, preserved in the sc145 build-ledger dir).
    Backup: `freeze-baseline.sha256.pre-sc145-landing-bak`. Duplicate-name check clean (200
    unique).
  - **2026-08-10, SC-123 settings-parity ports (worktree `sc123-settings-ports`):
    39-line widening (additions-only), 149 → 188 — APPLIED at landing by the orchestrator.**
    No rebaselined lines. 36 lines are the frozen-class twins (`legacy-{dark,light}`,
    `steel-print`) of SC-123's 12 new preference-variant fixtures
    (`statblock-{kwusage-{text,grid,ledger},disttarget-{text,ledger},charline-two,charbox-{on,onword},villain-banded}`,
    `featureblock-{stats,stats-ledger,featstyle-flat}`) — hashes verified byte-identical to a
    fresh capture by the delta re-review, applied verbatim from the branch-prepared
    `sc123-freeze-widening-36.txt` (preserved in the sc123 build-ledger dir). 3 more lines fix
    a PRE-EXISTING gap: `hero-sparse--{legacy-dark,legacy-light,steel-print}` (SC-107's sparse
    fixture landed 2026-08-10 without its widening — same missed-widening class as SC-128's,
    caught by the SC-123 fix-round agent). Backup:
    `freeze-baseline.sha256.pre-sc123-landing-bak`. Duplicate-name check clean (188 unique).
  - **2026-08-10, SC-146 statblock settings fixes (worktree `sc146-statblock-settings`):
    12-line widening (additions-only), 137 → 149 — APPLIED pre-landing.** No rebaselined
    lines: orchestrator-verified additions-only (sorted-diff, 0 changed/0 removed). The 12
    new lines are the frozen-class twins (`legacy-{dark,light}`, `steel-print`) of four new
    harness fixture variants added for regression coverage of the SC-146 pref fixes:
    `statblock-{stats-ledger,stats-gridc,featstyle-flat,columns-wide}`. Widening-only, so
    no Scott sanction required (existing hashes untouched); delta re-review eyeballed the
    new frozen shots for theme correctness. Backup:
    `freeze-baseline.sha256.pre-sc146-fixround-bak`. Verified after:
    `freeze OK (149/149 legacy+print PNGs byte-identical)`, exit 0.
  - **2026-08-10, SC-132 stamina redesign (worktree `sc132-stamina`): 5 lines rebaselined
    + 18-line widening, 119 → 137 — APPLIED at landing.** The five rebaselined lines —
    `hero--legacy-{dark,light}`, `hero--steel-print`, `gallery--legacy-{dark,light}` — all
    trace to ONE theme-agnostic change: deleting the duplicative `.dse-hero__stamina-stepper`
    row (the redesign itself is base-hidden/Steel-revealed and moves zero frozen pixels;
    proven by two independent reviews, both of which reproduced the 5-line set and its
    hashes). **Scott's approval 2026-08-10**, SC-132 comment `b3b6806d` item 4 ("approved"),
    against the gate ask (comment `02903859`) carrying the five before/after crops with
    every "before" hash-verified against the baseline. The widening adds the frozen-class
    lines for six fixtures: SC-132's five new stamina fixtures (`hero-narrow`,
    `stamina-bar-{dying,recoveries,winded}`, `stamina-rail`) and `statblock-roleless-corpus`
    — an SC-128 fixture whose widening was missed at that landing, caught here. Backup:
    `freeze-baseline.sha256.pre-sc132-bak` (keep forever). Verified after:
    `freeze OK (137/137 legacy+print PNGs byte-identical)`, exit 0.
  - **2026-08-08, plan 25 (SC-101/SC-102/SC-103, worktree `sc10x-structural`): 5 lines,
    count unchanged at 119 — APPLIED at landing.** The trio's structure-tier CSS (the shared
    nested-card frame, the standalone action-spine removal, the villain action type, the
    head-band notch — all "print follows structure" per S-1(a)) necessarily reaches print.
    The five, all `*--steel-print.png`: `statblock`, `feature`, `featureblock`,
    `featureblock-advancement`, `feature-spend`.
    - **Scott's approval, 2026-08-08**, against the self-contained sanction ask on **SC-102**
      — comment `f8bbaadf` (the five before/after pairs, every "before" regenerated and
      hash-verified byte-identical to the baseline line it replaces) plus its follow-up
      `a9e0158d`, which answers Scott's question about the shots and enumerates exactly what
      approval covers: *"Approve = I rebaseline exactly those five hashes at landing (dated
      sign-off, established procedure)."* Nothing else in the baseline was touched. The
      dark-on-dark look of the `steel-print` captures is a longstanding **harness capture
      artifact** (print tokens over the DARK scheme), shared by both halves of every pair —
      a separate follow-up will re-capture print over the light scheme, which will be its
      own deliberate all-print-lines re-pin, not part of this sanction.
    - Applied procedure: `npm run shots` re-run at the exact landing commit (post-rebase onto
      the SC-117 fix wave), baseline backed up to
      `freeze-baseline.sha256.pre-plan25-landing-bak`, exactly those 5 `<hash>  <name>` lines
      replaced (`diff` against the backup shows 5 changed lines and no others, `wc -l` still
      119), then `check-freeze.sh` → `freeze OK (119/119 legacy+print PNGs byte-identical)`,
      exit 0.
    - The 5th (`feature-spend`) appeared only at Task 7: it is a **SC-117 Batch 6** fixture
      that did not exist on this branch until the rebase, and it is a `feature`-element card
      — so the Task 4 spine-removal rule
      (`[data-dse-theme='steel'][data-dse-element='feature'] .dse-feature[data-dse-act]::before`)
      reaches it for exactly the same reason it reaches `feature--steel-print`. Diagnosed,
      not assumed: its **legacy** twins stayed byte-identical (so no theme-agnostic DOM
      change touched it — the move is Steel-structure-only), and its pre-trio bytes were
      regenerated at `origin/main` and **hash-matched the frozen baseline line exactly**,
      giving a real before/after pair for the sanction ask.
    - **Lesson worth keeping:** a sibling branch's new fixture can silently enlarge *your*
      rebaseline ask. Re-run the freeze check **after** the rebase, never only before, and
      count the mismatch names rather than trusting the plan's predicted number.
    - **Consequence for other in-flight branches:** the baseline now carries the trio's
      *after* bytes for those five names. Any branch still based on pre-plan-25 `main` will
      report exactly those 5 as `FAILED` until it rebases. That is the rebaseline showing
      through, not a leak — rebase, then re-check.

**2026-08-07, SC-117 fix wave M3 — exit-code semantics fixed: MISSING and MISMATCH used to
be conflated.** `sha256sum -c` reports both a not-yet-producible file and a real byte
mismatch as a non-`: OK` line, and the old script's logic (`grep -v ': OK$'`, nonempty ->
`FREEZE VIOLATED`, exit 1) treated them identically — so any branch that doesn't (yet) carry
every fixture the shared baseline has grown to (the normal state whenever one worktree
widens the baseline before another lands, e.g. plan 25's unlanded 113 -> 119) could never
exit 0. A gate that always reads red trains people to skim it, which is exactly the failure
mode the freeze check exists to prevent. Fixed to distinguish the two: `: FAILED$` (checksum
mismatch — still `FREEZE VIOLATED`, still exit 1) from `: FAILED open or read$` (missing —
not producible on this branch, reported by count but not fatal), and exit 0 whenever
mismatches are zero, regardless of how many are missing. The two count literals in the
success message are now computed from the actual run (`ok_count`/`total`) instead of
hardcoded, so they no longer drift the next time the baseline widens. **New proof-of-life
result** (first time the fixed script can ever say this on a branch missing sibling
fixtures): `freeze OK (113/119 producible OK, 6 missing (not producible on this branch), 0
checksum mismatches)`, exit 0 — the 6 missing are plan 25's `feature-villain--*` /
`statblock-villain-corpus--*` trio (unlanded `sc10x-structural`), same 6 the old script
reported as `FREEZE VIOLATED` for no actionable reason. A real mismatch still prints and
still exits 1, unchanged. Script backed up to `check-freeze.sh.pre-distinguish-bak` before
editing (main-checkout scratch, `.superpowers/sdd/`).

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

Expected clean result today: **0 GAPs / 0 undeclared WARNs / 16 DECLARED rows / exit 0**.

A `WARN` now means "the comparison did not happen" (a selector that never rendered, an
unparseable value) and **fails the run** — before SC-110 it was printed and ignored, so a
pair could go blind with the gate still green. The only escape is an explicit
`declaredDeferrals` entry in `visual-harness/parity/selector-map.json`
(`{ pair, rule, scheme?, why }`), which prints as `DECLARED` and must cite a Linear ticket
(or, for entries predating the 2026-08-27 FOLLOWUPS→Linear migration, a historical
`FOLLOWUPS #N`). `compare.cjs` refuses to run on a declaration that
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

**Known limitation (SC-117 fix wave M4) — `background-color` is sampled but never compared.**
The `bg` rule (`compare.cjs:323-324`) fires only when the site's `background-image` is
non-flat and the plugin's is flat — it never reads `background-color`, even though
`background-color` is already captured into both inventories for every mapped pair, both
schemes. SC-117 washed 13 declaration sites the wrong **polarity** (translucent white where
the site sits on translucent black) and every pair passed clean throughout, because neither
side's `background-image` was `none`. `bg` stays `material` (never declarable), so closing
this only ever tightens the gate. Future fix, as its own ticket: a polarity-only check first
(site translucent-black vs. plugin translucent-white/opaque) — cheap, near-noise-free, would
have caught SC-117 on day one; a full `background-color` comparison is separately-scoped,
larger work. Full reasoning: `visual-harness/parity/README.md` → "Known limitation —
`background-color` is sampled but never compared."

The 8 declared entries (16 rows — each covers both schemes) are three findings:
- **FOLLOWUPS #39** (8 rows) — `statblock-wrap` / `featureblock-wrap` `margin-top`/`-bottom`:
  site 34px (`1.7rem` on `.sb-wrap`/`.fb-wrap`) vs plugin 8px (the unscoped base's `0.5em`
  on the host — reworded from "Legacy base" by SC-144, matching `selector-map.json` and
  `parity/README.md`; the finding itself is unchanged, that `0.5em` is a base rule and it
  survived the theme removal). A **pixel decision** for Scott, no longer an invisible one.
- **FOLLOWUPS #51** (6 rows) — `section-tag` `font-size`/`line-height`/`letter-spacing`:
  site 18px/30.6px/1.8px vs plugin 16px/27.2px/1.12px. One type-scale decision for Scott.
- **FOLLOWUPS #40** (2 rows) — `pr-chars:ink`: the plugin's single-node power-roll caption is
  deliberately heading-emphasised where the site splits `.pre`/`.chars`.

**FOLLOWUPS #52 HEALED and was deleted (2026-08-07, SC-117 rider R1) — 9/18 → 8/16.** Its
one-selector fix (the statblock host joined the Plan 21 `line-height: 1.7` group) landed, and
the next `npm run parity` **failed** with `DEAD DECLARATION(S): … statblock-wrap:line-height
… Delete them` because the declaration matched nothing. Removing it is the required response,
not a rebaseline — and it is the shape every entry above is expected to end in. When you fix a
declared finding, expect the run to go red until you delete its declaration, and expect to move
`compare.test.ts`'s "the declared set is exactly the documented N entries" guard and
`visual-harness/parity/README.md` in the same commit.

If the DECLARED count or composition differs from this set, don't just accept a new number:
either it's a regression (fix it) or a new legitimate deferral (file a Linear Backlog ticket
and add a `declaredDeferrals` entry citing its SC-key).

**`owns`** is the sibling mechanism: when the plugin collapses two site nodes into one, two
pairs share the plugin selector and each declares which rules it is authoritative for. It can
only **move** a rule — `compare.cjs` requires, for **every** plugin selector (shared or named
by a single pair), that each rule be owned by exactly one pair, so nothing can be dropped or
double-counted. The one way to drop a rule is an explicit `excludes: [{ rule, why }]` entry
citing a Linear ticket's SC-key, priced exactly like a declared deferral; the shipped map
uses none.

> Until the SC-110 fix round that invariant ran **only on shared selectors**, so a pair naming
> a plugin node no one else named could narrow `owns` and silently drop the rest — exit 0, no
> error, no dead declaration. `statblock-wrap` was live proof, hiding two real `line-height`
> rows (now FOLLOWUPS #52). If you read a doc anywhere claiming the partition is unconditional
> and older than 2026-08-07, it was describing the intent, not the code.

## Capture-width convention (Scott's rule, 2026-08-07)

**Design-review evidence gets the standard main-pane width.** Narrow/sidebar captures are
only for when narrow behaviour is literally the thing under review (e.g. FOLLOWUPS #48's
hero-sheet sidebar overflow, or a `--width=` narrow-axis shot). Don't reach for a narrow
capture as a shortcut or as "extra thoroughness" on an ordinary design-review pass — it
answers a different question than the one being reviewed.

**The camera sets pane widths programmatically — never ask Scott to resize his vault.** Both
cameras already do this in code, not by hand: the browser harness fixes its page at
`viewport: { width: 900, height: 1200 }` (`visual-harness/shoot.mjs`) with an explicit
`?width=<px>` override for the narrow axis (`visual-harness/entry.ts`'s `NARROW_SHOTS`); the
Obsidian camera drives real sidebar-leaf width via `Emulation.setDeviceMetricsOverride` over
CDP (`visual-harness/obsidian-camera.mjs`). If a capture needs a specific width, set it in the
capture script/CDP call — don't ask a human to resize a window and hope the next run matches.

## Steel scoping rule

Every new Steel CSS rule must carry
`[data-dse-theme='steel']:not([data-dse-print="on"])`. Both halves still matter, for
different reasons since SC-144:

- **`:not([data-dse-print="on"])` is the load-bearing half — it is the whole freeze rule
  now.** Print is the only frozen class, so a screen-intended rule that forgets this
  exclusion leaks into `*--steel-print.png` and trips the check. Only the unfrozen
  steel-dark/steel-light shots may change freely.
- **`[data-dse-theme='steel']` is always true, and stays anyway.** With one theme, the
  prefix on ~297 rule blocks can never fail to match. **Do not strip it.** Removing it drops
  the specificity of every one of those rules by one attribute selector, which silently
  reorders the cascade against the unscoped base — putting all 66 frozen bytes and every
  Steel shot back in play for a pure-readability gain. It also keeps the snippet-theme door
  (D3 §6) open. Declined by default; if it is ever revisited, it is its own ticket with its
  own full battery.

**Where "legacy" went.** There is no second theme. Legacy was never a scoped rule set — it
was the unscoped `:root` base that Steel overrides, and that base **stays**, because Steel
inherits from it. SC-144 therefore deleted **zero** CSS; the sheet's own contract comment
(`styles-source.css`, the theming-contract block) is the authority. Anything you read that
says a rule "must not leak into legacy" means "must not leak into print" today.

## Rebuild before live-vault review

`main.js`/`styles.css` at the plugin root are **untracked build artifacts**. The harness
(`npm run shots`, `npm run parity`) compiles its own bundle via `harness:build` — so gates
stay green even while the vault-loaded `main.js`/`styles.css` lag behind. Before any live
Obsidian-vault review (Scott's or your own), rebuild explicitly:

```bash
devbox run -- bash -c 'cd /abs/path/draw-steel-elements && npm run build-no-check'
```

## Current expected numbers (drift — verify against current main)

**CURRENT — SC-144, the legacy-theme removal (branch `sc144-legacy-removal`, 2026-08-11,
based on dse main `20a78e2` = post-SC-149).** Measured at the landing commit, full battery
in order:

| Gate | Before (base `20a78e2`) | After |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` | 2680 passed / 1 skipped / **164 suites** (+1 skipped) / 3 snapshots | **2686 passed / 1 skipped / 164 suites / 3 snapshots** (net **+6**) |
| `npm run shots` | 334, 0 FAIL | **200, 0 FAIL** |
| `check-freeze.sh` | `freeze OK (200/200 …)`, exit 0 | **`freeze OK (66/66 …)`, exit 0** |
| `npm run parity` | 0 GAPs / 0 undeclared / 16 DECLARED / exit 0 | **unchanged** |
| `npm run obsidian-shots` | not run (display busy); last recorded 145 | not run; the theme axis halved, so expect roughly half |

Three of those want explaining before you treat a difference as a failure:

- **Shots 334 → 200 is the combo count, not lost coverage.** `shoot.mjs`'s `COMBOS` went
  5 → 3 (the two `legacy-*` entries are gone); 66 capture ids × 3 + 2 galleries = 200.
  Every `*--legacy-*.png` name simply no longer exists.
- **Jest went UP (+6), not down. This is not a miscount.** The plan predicted −7 to −9.
  The four theme-switching contracts in `displayCardThemeBranch.test.ts` did die (that file
  is now `displayCardBranch.test.ts` with 4 tests). Against that: 4 new `migrateSettings`
  cases, 6 harness cases pinning the theme-param clamp (`parseParams` ×4 + two rendered-root
  cases), and — the part that swallows the predicted deletions — several tests the plan
  said to DELETE were converted into stronger invariants instead. The descriptor's "carries
  the OD-5 options" pin (a fixture) became "carries NO `ui`" (the contract); tokens.test.ts's
  "no `[data-dse-theme="legacy"]` scope" (one banned literal) became "`steel` is the only
  `[data-dse-theme]` value in the sheet" (any second theme scope, under any name). All were
  can-fail proven by re-introducing the exact regression each catches. Deleting them to hit
  a predicted number would trade a real guard for a tidy figure — don't.
- **Jest counts are LOCATION-SENSITIVE — check where you ran from before believing a delta.**
  `test/dom/framework/token-coverage.test.ts` resolves the workspace D3 token map against a
  fixed list of known layouts (the main checkout and the worktrees dir). Run the suite from
  anywhere else — a scratch checkout under `/tmp`, say — and it silently SKIPS 2 tests:
  you get `3 skipped / 2680 passed` where the same commit reports `1 skipped / 2682 passed`
  in a proper worktree. Independently hit and confirmed during the SC-144 review while
  re-deriving the base numbers from a scratch tree. A −2 "regression" discovered this way is
  an artifact of your working directory, not the branch.
- **Every Steel shot is byte-identical across the whole ticket.** That was the primary
  correctness gate: a sha256 of all 200 `*--steel-*.png` was taken before any edit and
  re-diffed at phases 2, 3 and 7 — empty diff every time, including all 66 `steel-print`.
  Removing a theme changed nothing about the theme that remains.


As of dse SC-117 Batch 6 (branch `sc117-audit`, 2026-08-07, `f09f6cc` + this batch's
commit): jest **2191/154 suites** (+1: the new `feature/spend` fixture's own
fixtures.test.ts mount case), shots **189** (+10: `feature-spend`/`negotiation-pr-checked`
× 5 combos each), freeze **113/113 clean** (widened from 107 — no open mismatches on this
branch; the SC-121 C-5 rebaseline already covers the 5 treasure/gallery lines main was
still carrying).

As of dse SC-117 fix wave B1-B4 + riders (branch `sc117-audit`, 2026-08-07): jest
**2249/155 suites**, shots **189**, freeze **113 producible lines OK / 0 mismatches**, parity
**0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0**.

Two branch-specific notes that will read as failures if you don't expect them:
- **The freeze baseline is 119 lines, but only 113 of them are producible here.** The other 6
  (`feature-villain--*`, `statblock-villain-corpus--*`) belong to plan 25's two new fixtures,
  which live on the unlanded `sc10x-structural` branch, so `sha256sum -c` reports them as
  `No such file or directory` rather than as checksum mismatches. **A missing file is not a
  leak; a `FAILED` checksum is.** Read the two categories separately before calling the gate
  red. (**Superseded 2026-08-08:** plan 25 landed, so those 6 lines are producible on `main`
  and this "6 missing" arm no longer fires there. The *category* distinction is permanent and
  still the point.) Equally: the 5 then-sanction-pending `*--steel-print.png` mismatches plan
  25 carried did NOT apply on any other branch at the time — but the sanctioned rebaseline
  has since been applied, so the baseline now holds the trio's *after* bytes and a branch
  still based on pre-plan-25 `main` will report exactly those 5 as `FAILED` until it rebases.
- Historical numbers: jest was **2248/155** on `guards` (before B6's fixture test) and parity
  was **18 DECLARED** until SC-117 R1 healed FOLLOWUPS #52. The old "10 WARNs" figure predates
  the declared-deferrals contract entirely (exit 0 ⟺ 0 GAPs AND every WARN declared; material
  classes `bg`/`shadow`/`hairline-*` are never declarable), and a "16 DECLARED" written before
  2026-08-07 means the pre-fix-round set, not this one — same number, different composition.
  `npm run parity` also runs in CI as of SC-109. These numbers change as the plugin
grows — treat them as "what to expect right now," not a hardcoded target. Always confirm the actual counts against whatever commit you're
gating, and if they differ, figure out why before treating it as either pass or fail.

**As of the SC-117 fix-wave FIX ROUND (branch `sc117-audit`, 2026-08-07, M1+M2+M4+L2
commits on top of R1):** jest **2249/155 suites, 3 snapshots** (unchanged — no test surface
touched), shots **189** (unchanged — no fixture added, M1 only changed what one existing
capture does with the mouse), freeze (fixed script, see "Baseline corrections" above) →
`freeze OK (113/119 producible OK, 6 missing (not producible on this branch), 0 checksum
mismatches)`, exit **0** — the first branch that can ever say this with the corrected
semantics. Parity **0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0**, unchanged from R1
(M4 only edited README prose, no selector-map/compare.cjs change). M3 (`check-freeze.sh`
itself) has no branch/version number of its own — it's shared workspace scratch, not part
of this repo's test surface.

**LANDING STATE — `sc10x-structural` (plan 25, structural trio, rebased onto the SC-117
fix-wave main and rebaselined 2026-08-08):** jest **2289 passed / 155 suites / 3 snapshots**,
shots **199 browser** (0 FAIL), freeze **`freeze OK (119/119 legacy+print PNGs
byte-identical)`, exit 0** — the first fully-green freeze on this work, and the state the
five-line sanctioned rebaseline above produced. Parity **0 GAPs / 0 undeclared WARNs / 16
DECLARED / exit 0**, composition byte-for-byte identical to main's (`git diff
origin/main...HEAD -- visual-harness/parity/` is empty): none of the 16 declarations concerns
a surface this plan touched, and none of the trio's rules moved a sampled property.
`obsidian-shots` was NOT run at landing — a live Obsidian session owned display `:1`; the
last recorded value for this branch is 145.

Two numbers moved between this branch's own finale and its landing, both because the SC-117
**fix wave** landed on `main` in between:
- **Parity 18 → 16 DECLARED.** Not this branch's doing: the fix wave healed FOLLOWUPS #52,
  removing the two `statblock-wrap:line-height` declarations. This branch never touched
  `selector-map.json`, and the rebase must not resurrect the removed declaration — verified
  by the empty parity diff above.
- **Freeze 114/119 → 119/119.** The rebaseline, not new work.

Jest is unchanged at 2289 across the rebase, which is the correct answer and worth checking
rather than assuming: the fix wave added **zero** test cases (its only `test(...)` edit
renamed "the documented 9 entries" → "8"), so main's count did not move and the trio's own
+41 lands on the same base. The freeze denominator went 113 → **119** on this branch (this
plan's own S-5 widening, above). This whole block is exactly the "confirm the actual counts
against whatever commit you're gating" case the paragraph above warns about: the plan
predicted 4 print mismatches and the real post-rebase answer was 5, because a sibling
branch's new `feature-spend` fixture sits in a family this plan restyles. **Don't average,
don't assume, re-run — after the rebase.**
