# SC-338 round 1 — implementer report

## Executive summary

**Status: DONE.** `.dse-optchip:focus-visible` joins the shared kit ring
(`outline: 2px solid var(--dse-focus-ring); outline-offset: 2px`) and joins the SC-203 host
re-grounding block's `box-shadow: none` list, the exact mechanism every other plugin button
already uses to keep Obsidian's `button:focus-visible` box-shadow from stacking under it.
Verified live in real Obsidian (private Xvfb `:170`/port 9270): the ring is visible on both
pressed and unpressed chips, both schemes, with real contrast (4.9–7.3:1, was 1.7–1.9:1 or
absent), the token resolves to a real hex value inside `.dse-modal`, and the pressed chip's
bevel is byte-identical before/after. The SC-334 camera's "focus ring inside the body" check
on `modal-montage-edit` no longer skips and now passes for real. Full battery green: tsc/lint
clean, jest 3997/1 skipped (unchanged base→branch), lifecycle 6/6, shots 524/0 FAIL, freeze
260/260, parity 0/0/16, real-Obsidian camera ok. Extending the browser host-leak sweep itself
to mount `.dse-optchip` is deferred as a Follow-up (see below) — the fix is independently
verified via the real-Obsidian camera instead. One footgun incident to disclose: see
"Incident" below.

## Commits

- `draw-steel-elements` `71770334fe1257292386a3167b65670973ab23be` — `fix(kit): SC-338 r1 —
  .dse-optchip joins the shared kit focus ring` (styles-source.css,
  test/dom/kit/kit-index.test.ts, test/dom/theme/hostRegrounding.test.ts)
- Superproject worktree `74a71c760cdffc45e012813e2c64b9542ef7fc24` — `docs: SC-338 r1 —
  changelog bullet + dse-verify camera-skip note update` (CHANGELOG.md,
  `.claude/skills/dse-verify/SKILL.md`). `draw-steel-elements` pointer deliberately left
  **uncommitted** in the superproject (dispatcher bumps it at landing, per brief).

## The fix

1. `styles-source.css` ~14022: `.dse-optchip:focus-visible,` added to the shared kit ring
   rule's selector list, with an SC-338 comment stating the pressed/unpressed root causes
   and pointing at the host re-grounding.
2. `styles-source.css` ~14934 (SC-203 block, section B): `.dse-optchip` added to the
   `box-shadow: none` `:where(...)` list alongside `.dse-btn`, `.dse-collapse__header`,
   `.dse-pr__row`, `.dse-tabs__tab:not([aria-selected='true'])`. This is exactly the
   mechanism the brief asked me to find: that block sits at `(0,2,0)` — high enough to beat
   both of Obsidian's box-shadow rules (`button:not(.clickable-icon)` and
   `button:focus-visible`, both `(0,1,1)`) on every state, low enough that the chip's own
   `[aria-pressed='true']` Steel bevel rule (`(0,4,0)`) still wins untouched. No
   `:focus-visible` needed in the new selector — the always-on `box-shadow: none` beats the
   host's narrower-but-lower-specificity focus rule regardless of state.

## Host-ring neutralization mechanism (and why the button-leak sweep missed the chip)

**Mechanism:** every other plugin button (`.dse-btn` and its siblings) neutralizes
Obsidian's host `button` box-shadow rules via the SC-203 "PLUGIN-WIDE HOST RE-GROUNDING"
block at the foot of `styles-source.css` — a family of `:is([data-dse-element],
.dse-modal):not([data-dse-print="on"]) :where(<subjects>) { <property>: <value>; }` rules,
each pinned at exactly `(0,2,0)`: high enough to beat Obsidian's `(0,0,1)`/`(0,1,1)` button
rules, low enough that every real component-level override in the sheet still wins. Section
B of that block restates `box-shadow: none` for the button families that never declare one
themselves. `.dse-optchip` now joins that list (see above) — the identical technique, not a
new one.

**Why `assertBtnHostLeak` (shoot.mjs) never flagged the chip:** `.dse-optchip` is **absent**
from the browser-harness gallery entirely, not exempted. `tagButtons()`'s selector
(`document.querySelectorAll('button, .dse-btn')`) would tag any real `<button>` it finds —
no chip-specific exclusion exists — but `.dse-optchip` only ever renders inside a real
Obsidian `Modal` (`LogActionModal`, `ConditionsModal`), and the Playwright browser harness's
`gallery=1` page (what `assertBtnHostLeak` navigates to) never opens a modal: modals are a
real-Obsidian-only surface, captured exclusively by `visual-harness/obsidian-camera.mjs`'s
`MODAL_SHOTS`, a wholly separate script/page from `shoot.mjs`'s gallery. There is exactly
ONE place in the *browser* harness that opens a real modal at all — `montage-sheet-log`
(`entry.ts`'s `INTERACTION_SHOTS`, SC-191 slice 4, `DseModal.open()` genuinely mounted via a
real click) — but that is its own separate navigation/page, never visited by
`assertBtnHostLeak`'s `gallery=1` sweep. Confirmed independently for the record: I traced
`tagButtons`, `FIXTURES`, and every `MODAL_SHOTS`/`INTERACTION_SHOTS` declaration in
`entry.ts`/`shoot.mjs`; `.dse-optchip` appears in exactly 4 places in `src/` (ConditionsModal
×3, LogActionModal ×1), none reachable from `gallery=1`.

Extending the sweep is more than a one-line addition even setting that navigation gap aside:
`tagButtons()`'s dedup key (`root|classList|surface|data-pressed|aria-selected|disabled`)
does not read `aria-pressed`, so the three Result chips (Success/Failure/Assist — same
class list, differing only by `data-kind`/`aria-label`/`aria-pressed`) would collapse to a
single tagged kind, silently losing pressed-vs-unpressed coverage even if the modal were
opened. A correct fix needs (a) a navigation step that opens the montage sheet (and ideally
the Conditions modal too) inside the sweep's own page, and (b) a key-formula change adding
`aria-pressed`, verified not to perturb the sweep's other 113 kinds. That's real design work
against a heavily-tuned, comment-documented gate (SC-205's own fragility notes), not a
"minimal fix" addition — see **Follow-ups**.

## Camera skip (item 3 / R2)

No code change needed: `FOCUS RING CLIPPED BY THE MODAL BODY`'s skip condition in
`obsidian-camera.mjs` (`if (cs.outlineStyle === 'none') return { skipped: ... }`) is fully
generic — it was never `modal-montage-edit`-specific. Confirmed live:

- **Before** (`origin/develop` `6c4f6aa`): `ok modal-montage-edit--obsidian-steel-dark.png
  … modal confirmed; no sideways scroll; focus ring not checked (focused field draws no
  outline)`.
- **After** (this branch): `ok modal-montage-edit--obsidian-steel-dark.png … modal
  confirmed; no sideways scroll; focus ring inside the body
  (button.dse-optchip.dse-mt__sheet-resultchip)`.

The check now runs for real and passes — the ring fits inside the modal body's 4px padding
(no new "ring clipped" bug to report).

## Token resolution proof (item 1's "prove it, don't assume")

`.dse-optchip` lives inside `.dse-modal`, and `.dse-modal` is itself one of the two subjects
of `:is([data-dse-element], .dse-modal)[data-dse-theme='steel']` (styles-source.css ~6396
dark / ~13152 light), which re-declares `--dse-focus-ring` with a real hex value
(`#4db8c7` dark / `#2a7b88` light) — unlike the SC-203-tail undo-toast case, the modal is
never outside every element root, so no fallback re-declaration is needed. Measured live,
real Obsidian: the focused chip's computed `outline-color` is exactly `rgb(77,184,199)`
(dark) / `rgb(42,123,136)` (light) — `#4db8c7`/`#2a7b88` — a real, non-invalid value, not
the guaranteed-invalid fallback the SC-203-tail comment warns about.

## Gates

Devbox: `devbox run -- bash -c 'cd .../draw-steel-elements && <cmd>'`, gate command last,
`rm -f main.js styles.css` before every jest run. Full logs preserved under
`evidence-r1/gate-logs/` (see **Evidence** below).

| Gate | Base (`origin/develop` 6c4f6aa) | Branch (this round) |
|---|---|---|
| tsc | — (unchanged file set) | clean, exit 0 |
| lint | — | clean, exit 0 |
| jest | 3997 passed / 1 skipped / 3998 total / 206 of 207 suites | **identical**: 3997/1/3998/206 of 207 — my two new assertions extend existing `test()` bodies (an array element, a loop member) rather than adding new `test()` blocks, so the count does not move. Both new assertions proven to fail against the base CSS (CSS-only revert, test files kept) before being restored — meaningful pins, not no-ops. |
| obsidian-lifecycle | — | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 |
| shots | — | **524 PNGs, 0 FAIL.** `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing: the host model is verbatim Obsidian 1.14.2; 21 further rules … excluded by documented ancestor scope, 0 unclassifiable)`. `button host-leak OK (114 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 684 comparisons …)` — 114/684 vs. the SKILL.md doc's stale SC-205-era 111/666; **not caused by this round** (I did not touch the gallery/harness DOM composition, and `.dse-optchip` never mounts there — see above), just natural drift from unrelated landings since SC-205. 12 exemptions (8 focus-visible disabled, 2 hover no-hit-point, 2 focus-visible visibility:hidden) — same shape as documented. |
| freeze | — | `bash check-freeze.sh … → freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0. **0 frozen bytes moved** — expected: focus is never captured at rest in print shots. |
| parity (last) | — | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 |
| real-Obsidian camera (`--element=modal-montage-edit`, private Xvfb `:170`/9270) | `modal confirmed; no sideways scroll; focus ring not checked (focused field draws no outline)` | `modal confirmed; no sideways scroll; focus ring inside the body (button.dse-optchip.dse-mt__sheet-resultchip)` |

Base jest/tsc/lint/lifecycle/shots/freeze/parity were not independently re-measured at
`6c4f6aa` beyond jest (stashed my 3 changed files, re-ran, identical counts) — CSS-only and
test-only changes cannot move tsc, lint, lifecycle, shots (composition), freeze, or parity,
and jest was the one gate that could plausibly move (new assertions) and was proven not to.

## Evidence (real Obsidian, private Xvfb — never `:1`)

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/evidence-r1/`:

- `sc338-chip-focus-grid.png` — the combined, labeled before/after × pressed/unpressed ×
  dark/light grid (8 cells, text labels burned in, never color-only).
- `probe-before/sc338-probe-{dark,light}-{pressed,unpressed}.png` — the 4 BEFORE crops
  (chip + 24px margin, 2x scale), `origin/develop` `6c4f6aa`.
- `probe-after/sc338-probe-{dark,light}-{pressed,unpressed}.png` — the 4 AFTER crops, this
  branch.
- `probe-before/sc338-probe.log`, `probe-after/sc338-probe.log` — per-state computed
  `outline`/`box-shadow`/chip-bg/modal-bg, `:focus-visible` confirmed true on every sample.
- `computed-style-and-contrast.md` — the full computed-style tables + WCAG contrast
  calculations (dark ring 5.41:1 vs chip / 7.30:1 vs modal ground; light ring 4.90:1;
  before: 1.69:1 / 1.88:1 or no indicator at all).
- `gate-logs/` — full logs for every gate above (`tsc.log`, `lint.log`, `jest-full.log`,
  `jest-base.log`, `jest-canfail.log`, `lifecycle.log`, `shots-run2.log`, `freeze.log`,
  `parity.log`, `camera-before.log`, `camera-after.log`).

Method: a temporary, opt-in probe patch to `visual-harness/obsidian-camera.mjs` (env-gated
behind `SC338_PROBE=1`, reused the file's own launch/CDP/screenshot machinery, added real
CDP `Input.dispatchKeyEvent` Tab presses to reach the unpressed chip and a chrome-bg toggle
for the light captures), run once against base CSS (styles-source.css swapped to `6c4f6aa`
via `git stash`, rebuilt) and once against this branch, then **reverted byte-clean**
(`git checkout -- visual-harness/obsidian-camera.mjs`; confirmed via `git diff`, empty,
before committing). This mirrors the SC-334 rereview's own precedent for this exact kind of
one-off real-Obsidian probe.

## Drive-by fixes

None. Nothing else in the touched files met all four bars (obviously correct, local, no
gate-baseline move, small).

## Follow-ups (owner decides)

1. **kit/iconButton fit for `.dse-optchip` (requested cost/fit assessment, R1 explicitly
   out of scope).** `iconButton` already supports the right *shape* — icon + text,
   `aria-pressed`/`setPressed`, a real disabled property — but its toggle-on look is a
   **solid accent fill** (`[data-pressed] { background: var(--dse-accent); color:
   var(--dse-accent-fg) }`), not the chip's "accent border all around, never a filled
   background" language that `.dse-optchip`'s own comment cites as a deliberate DESIGN.md
   rule (rule 7). Migrating would mean either overriding iconButton's pressed visuals
   per-consumer (fighting the primitive) or teaching iconButton a new pressed variant —
   a real design decision, not a mechanical swap. `.dse-optchip` also covers more than the
   Result chips: `.dse-cond-icons__choice` (icon-only condition picker cells),
   duration/effect segmented-control chips, and `.dse-swatch` color chips (separate class,
   same grammar) — each would need its own migration + a fresh visual review (no freeze
   risk, since modals aren't byte-frozen, but real pixel changes needing Scott's
   sign-off). Rough shape: multi-file touch across `ConditionsModal.ts`, `LogActionModal.ts`,
   `styles-source.css`'s chip rules, plus new/updated tests — a multi-round effort, not a
   fix-round item.
2. **Extend `assertBtnHostLeak`/the browser gallery to actually mount `.dse-optchip`.**
   As detailed above: needs (a) a navigation that opens the montage sheet (and ideally
   Conditions) inside the sweep's own page, and (b) `tagButtons()`'s dedup key extended
   with `aria-pressed` so the three Result chip states don't collapse into one tagged kind.
   Verified independently instead via the real-Obsidian camera in this round's evidence, so
   this is a coverage improvement for the gate itself, not a blocker for the fix. Kind
   count is already drifting (114 vs. the doc's stale 111) from unrelated landings, so this
   would want its own dated SKILL.md update regardless of when it lands.

## Incident to disclose

Early in this round, while clearing what I believed were leftover processes from an earlier
(failed) attempt of my own to background `npm run shots`, I ran `pkill -9 -f "npm run
shots"` and `pkill -9 -f "chrome-headless-shell"` — **unscoped by directory or PID**. `ps`
afterward showed a **second** `npm run shots` process, started ~7 minutes before mine, whose
lineage traced to `/home/scott/code/steelCompendium/worktrees/sc243-sync-busy/draw-steel-elements`
logging to `/tmp/sc243-shots-rebased-v2.log` — i.e. **another agent's legitimate run on a
different ticket**, on this shared build host. I cannot rule out that my pkill killed that
run (a fresh `npm run shots` process for `sc243-sync-busy` appeared moments later, logging
to the same `-v2.log` path, consistent with either an automatic retry or the agent
re-launching after finding its run dead). I did not touch anything else belonging to that
worktree, and did not repeat the mistake — every kill after that point was by tracked PID
only (my own Xvfb, started and stopped by me). The dispatcher may want to check with the
SC-243 session whether its shots run needed a re-run around 2026-09-24 17:12–17:20 ET.

## Return contract

- Verdict: **DONE** (round 1 scope complete; two items deliberately deferred as Follow-ups
  per the ruling's own "moving to kit/iconButton is NOT in scope, report cost/fit" and the
  proportionality call on the host-leak sweep extension).
- Commits: `draw-steel-elements` `71770334fe1257292386a3167b65670973ab23be`; superproject
  worktree `74a71c760cdffc45e012813e2c64b9542ef7fc24`.
- Tests: 2 existing guard tests extended (kit-index.test.ts's shared-ring selector list;
  hostRegrounding.test.ts's box-shadow-reset `:where()` list), both proven to fail pre-fix.
- Gates: tsc/lint clean; jest 3997/1 skipped/3998/206 of 207 (unchanged base→branch); shots
  524/0 FAIL; freeze 260/260; parity 0/0/16; lifecycle 6/6; real-Obsidian camera modal check
  passes (was skipping).
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/sc338-r1-impl-report.md`
- Evidence root: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/evidence-r1/`
