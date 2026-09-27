# SC-338 round 2 (fix round) — report

## Executive summary

**Status: DONE.** All four owner rulings from the r1 review addressed. `.dse-swatch`
(Conditions "Color" row) joins the same two rules `.dse-optchip` uses (the shared kit
focus ring + the SC-203 host re-grounding `box-shadow: none` list) — proven the pressed
swatch's own selection outline is untouched (different CSS property from what the
re-grounding entry resets). MEDIUM-1 kept as-is per the owner's pick, disclosed in the
CHANGELOG and with a new labeled rest-state grid. LOW-1/LOW-2 folded into `dse-verify`
SKILL.md (inline numbers, corrected padding claim, addendum below). Evidence: two new
labeled before/after grids from real Obsidian (private Xvfb `:170`/9270), r1's grid
unchanged (chip pixels don't move this round). Full battery green: tsc/lint clean, jest
3997/1 skipped (no flake this run), shots 524/0 FAIL, host-leak 114/684 (unchanged), freeze
260/260, parity 0/0/16, both required camera checks (`modal-montage-edit` ring-checked,
`modal-montage-limits` ok). Process-kill rule followed throughout — every kill this round
was by exact tracked PID within `worktrees/sc338-chip-focus/`, confirmed before killing.

## Commits

- `draw-steel-elements` `117082268880ba6b5afafad20fe85786fc78fdb7` — `fix(kit): SC-338 r2 —
  .dse-swatch joins the shared kit focus ring` (styles-source.css,
  test/dom/kit/kit-index.test.ts, test/dom/theme/hostRegrounding.test.ts)
- Superproject worktree `49028fc1a80c417245fc918fbcefada6dcbd8e83` — `docs: SC-338 r2 —
  CHANGELOG swatch/rest-state clause + dse-verify inline numbers` (CHANGELOG.md,
  `.claude/skills/dse-verify/SKILL.md`). `draw-steel-elements` pointer deliberately left
  **uncommitted** (dispatcher bumps it at landing).

## Task 1 — swatches join the fix

`.dse-swatch:focus-visible,` added to the shared kit ring rule (right after
`.dse-optchip:focus-visible,`); `.dse-swatch` added to the SC-203 section-B `box-shadow:
none` `:where()` list, alongside `.dse-optchip`. Both CSS comments state explicitly why the
swatch's own `[aria-pressed='true'] { outline: 2px solid var(--dse-accent); outline-offset:
2px }` rule is untouched: it sets `outline`, the re-grounding entry only ever sets
`box-shadow` — two different properties, no conflict possible by construction.

**The one real cascade fact, proven live, not assumed:** on a chip/swatch that is BOTH
pressed AND focused, the new ring rule (`outline: 2px solid var(--dse-focus-ring)`) and the
swatch's own pressed rule (`outline: 2px solid var(--dse-accent)`) are the same `(0,2,0)`
specificity — a genuine tie, broken by source order (the ring rule sits later in the file,
so it wins). This is invisible in practice because `--dse-accent` and `--dse-focus-ring`
resolve to the identical hex in both Steel schemes (`#4db8c7` dark, `#2a7b88` light).
Measured live: a pressed+focused swatch's computed `outline` is byte-identical to a
pressed+unfocused swatch's (`rgb(77,184,199) solid 2px` dark / `rgb(42,123,136) solid 2px`
light, both states) — the pressed selection mark is provably unchanged whether focused or
not, before and after this fix.

**Tests:** `kit-index.test.ts`'s `FOCUSABLE_KIT_CONTROLS` list gained
`'.dse-swatch:focus-visible'`; `hostRegrounding.test.ts`'s box-shadow-reset test's family
loop gained `'.dse-swatch'`. Vacuity proven: with only the two swatch hunks reverted (chip
hunks intact), both tests fail — `kit-index.test.ts`: "one rule covers every focusable kit
control with the token ring" (`.dse-swatch:focus-visible` missing from the selector);
`hostRegrounding.test.ts`: "the box-shadow reset excludes the selected tab" (`.dse-swatch`
missing from the `:where()` list). Restored, both green again (`gate-logs/jest-restored.log`;
the revert/red proof is `gate-logs/jest-vacuity-swatch.log`, `2 failed, 80 passed`).

## Task 2 — CHANGELOG

The Unreleased SC-338 bullet now names the Conditions color swatches alongside the chips,
and adds: "Unpressed chips and swatches also drop Obsidian's own drop-shadow plate at rest
and on hover, matching every other DSE button — they never asked for that plate in the
first place, and this makes them consistent with the rest of the plugin." (Owner ruling
MEDIUM-1, pick (a): keep the fix, disclose it — no code change, CSS is unchanged from r1
for the chip's own rest/hover behavior; only the disclosure and the swatch coverage are
new.)

## Task 3 — dse-verify SKILL.md

- The button-host-leak-sweep "Expected line" (§ In-run gates) now reads: `111 … 666` (as
  of SC-205) **followed by** a dated re-measurement note: "re-measured 2026-09-24
  (SC-338): 114 kinds / 684 comparisons — pre-existing drift from unrelated landings since
  SC-205, not caused by SC-338".
- The SC-334 modal-camera section's `FOCUS RING CLIPPED BY THE MODAL BODY` note now carries
  a **Correction** paragraph (LOW-2): the focused Success chip sits 46.0px / 62.8px inside
  the body's scroll-box edges — real slack, not a close fit against the 4px padding — and
  the padding regression is actually guarded by `modal-montage-limits`, not
  `modal-montage-edit` (proven with the review's own `outline-offset` probes, reproduced
  in this round's evidence).
- The SC-338 battery paragraph now states both rounds' numbers inline (LOW-1) rather than
  pointing at a scratch report, including the round-2 line with the swatch addition.

## Task 4 — report addendum correcting LOW-2

Done inline above (Task 3's third bullet) and in the dse-verify SKILL.md edit itself. For
the record, stated once more plainly: **the r1 impl report's claim "the ring fits inside
the modal body's 4px padding" was wrong.** The auto-focused chip has real geometric slack
(46px/62.8px) from the body edges; the check is genuinely live (proven by `outline-offset`
probes that DO trip it — see the r1 review report's LOW-2 section and this round's own
`camera-after-edit.log`/`camera-before-edit.log`, which show the check passing/skipping
correctly on the actual, unmodified geometry), but the *reason* it passes on
`modal-montage-edit` specifically is slack, not a close-fit proof of the padding. The
padding's own regression coverage is `modal-montage-limits` (confirmed again this round:
`camera-after-limits.log` — `ok … focus ring inside the body (input.dse-mt__sheet-input)`).

## Gates

Devbox: `devbox run -- bash -c 'cd .../draw-steel-elements && <cmd>'`, gate command last,
`rm -f main.js styles.css` before every jest run, foreground only. Full logs under
`evidence-r2/gate-logs/`.

| Gate | Line |
|---|---|
| tsc | clean, exit 0 |
| lint | clean, exit 0 |
| jest | `Tests: 1 skipped, 3997 passed, 3998 total`; `Test Suites: 1 skipped, 206 passed, 206 of 207 total`; 3 snapshots, exit 0 — **no flake this run** (load 4.23 at start; SC-360's known `sidebarInitiative.test.ts:350` flake did not fire, so no re-run was needed) |
| obsidian-lifecycle | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 |
| shots | 524 PNGs, 0 FAIL; `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light … verbatim Obsidian 1.14.2 …)`; `button host-leak OK (114 button kinds × 3 states … = 684 comparisons …)` — **identical to r1's measured 114/684**, confirming `.dse-swatch` (like `.dse-optchip`) never mounts in the browser gallery either |
| freeze | `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0 — **0 frozen bytes moved** |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 |
| camera `--element=modal-montage-edit` (private Xvfb `:170`/9270) | AFTER: `modal confirmed; no sideways scroll; focus ring inside the body (button.dse-optchip.dse-mt__sheet-resultchip)`. BEFORE (base `6c4f6aa` build): `… focus ring not checked (focused field draws no outline)` — confirms the skip only disappears with the fix present |
| camera `--element=modal-montage-limits` | `modal confirmed; no sideways scroll; focus ring inside the body (input.dse-mt__sheet-input)` — unaffected by this round, re-confirmed green |

Base gates (tsc/lint/lifecycle/shots-composition/freeze/parity) were not independently
re-measured at `6c4f6aa` this round beyond what the camera and jest vacuity checks already
prove — a CSS-only plus two-test-string diff cannot move any of them, and jest was proven
non-vacuous by the revert-and-red step above (not merely re-run).

## Evidence (real Obsidian, private Xvfb `:170`/port 9270 — never `:1`)

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/evidence-r2/`:

- `sc338-grid-rest.png` — the montage Result row at REST (no focus, no hover): Success
  (pressed) / Failure / Assist (unpressed), dark and light, before vs after. Shows the
  MEDIUM-1 disclosure: unpressed chips visibly lose the host drop-shadow/inset-ring plate.
- `sc338-grid-swatch.png` — Conditions color swatches: pressed+focused, unpressed+focused,
  pressed+unfocused, dark and light, before vs after. The unpressed+focused row is the
  clearest single before/after pair in this round: BEFORE shows Obsidian's low-contrast
  grey `0 0 0 3px` ring, AFTER shows the plugin's own teal/dark-teal ring.
- `probe-before/`, `probe-after/` — individual tight crops (24px/20px margin, 2x scale) +
  `sc338-r2-probe.log` (per-state computed outline/box-shadow/aria-pressed/focus-visible).
- `computed-style-and-contrast-r2.md` — full tables + WCAG contrast math (BEFORE dark host
  ring 2.29:1 / light 1.88:1 vs modal ground; AFTER dark ring 7.30:1 / light 4.90:1; both
  before figures under the 3:1 guideline, both after figures clear it).
- `gate-logs/` — every gate log above.
- r1's own grid (`evidence-r1/sc338-chip-focus-grid.png`) is **unchanged and not
  regenerated** — this round's CSS only adds `.dse-swatch` selectors; no `.dse-optchip`
  rule's specificity, value, or source position moved, so the chip's focused-state pixels
  are provably the same (this round's own rest-grid crops reproduce the chip's r1 computed
  outline/box-shadow verbatim as a side effect of capturing the row).

Method (identical discipline to r1): a temporary, opt-in probe patch to
`visual-harness/obsidian-camera.mjs` (env-gated `SC338_R2_PROBE=1`, reused the file's own
launch/CDP/screenshot machinery plus real CDP Tab presses and a DOM marker attribute to
re-locate a blurred element), run once against a real build of base `6c4f6aa`
(`git show 6c4f6aa:styles-source.css` swapped in, rebuilt) and once against this branch,
then **reverted byte-clean** (`git checkout -- visual-harness/obsidian-camera.mjs`,
confirmed via `git diff` empty before committing).

## Process discipline (adapter §8.9 compliance)

Every process I killed this round was killed by exact PID after confirming its command
line contained `worktrees/sc338-chip-focus/` via `pgrep -af "worktrees/sc338-chip-focus/"`
or a direct `ps -p <pid>` check immediately before the kill — the Xvfb instance I started on
`:170` (PID `552200`, confirmed via `ps -p 552200 -o pid,cmd` before `kill -TERM`). No
`pkill`/`killall` by pattern was run at any point this round.

## Drive-by fixes

None.

## Follow-ups (owner decides, unchanged from r1 + review)

Carried forward, not re-litigated this round (owner already ruled on these):
- F1 kit/iconButton migration — DROPPED by owner ruling.
- F2 / INFO-2 host-leak sweep never mounts modal-only buttons — filed SC-356 (Backlog).
- INFO-1 jest flake `sidebarInitiative.test.ts:350` — filed SC-360 (Backlog); did not
  reproduce this round (see Gates table).
- INFO-3 chips/swatches still take height/bg/text from Obsidian's host `button` rules
  (unrelated properties, not in scope for the focus ring) — appended to SC-356.

## Tree state

Both worktrees clean except the pre-existing, deliberately-uncommitted ` M
draw-steel-elements` submodule pointer in the superproject. `git diff` on
`visual-harness/obsidian-camera.mjs` is empty (temp probe fully reverted). No leftover
`--ERROR.png` or stray probe files in `visual-harness/shots/` beyond the legitimate
`modal-montage-edit`/`modal-montage-limits` regenerated shots (gitignored either way).

## Return contract

- Verdict: **DONE.**
- Commits: `draw-steel-elements` `117082268880ba6b5afafad20fe85786fc78fdb7`; superproject
  worktree `49028fc1a80c417245fc918fbcefada6dcbd8e83`.
- Tests: 2 existing guard tests extended a second time (now cover both `.dse-optchip` and
  `.dse-swatch`); both proven to fail with only the swatch hunk reverted, then restored.
- Gates: tsc/lint clean; jest 3997/1 skipped/3998/206 of 207 (no flake); shots 524/0 FAIL,
  host-leak 114/684 (unchanged from r1); freeze 260/260; parity 0/0/16; lifecycle 6/6;
  real-Obsidian camera `modal-montage-edit` ring-checked ok, `modal-montage-limits` ok.
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/sc338-r2-fix-report.md`
- Evidence root: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/evidence-r2/`
