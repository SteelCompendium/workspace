# SC-338 round 1 — independent review

**Verdict: APPROVE-WITH-NITS.** dse `7177033` / superproject `74a71c7`, base dse `6c4f6aa` (origin/develop has not moved since).
- R1 met, checked live in real Obsidian 1.14.2 (private Xvfb `:187`, ports 9287/9288). Both modals, dark and light: every keyboard-focused `.dse-optchip` draws `solid 2px` at `2px` offset (Tab walk reached 27/27 chips in Conditions and all 3 Result chips). The ring colour is the real token (`#4db8c7` / `#2a7b88`). The host grey ring is gone (`0 0 0 3px #555` / `#bdbdbd` → `none`). The pressed bevel is still drawn. A mouse click gives `:focus-visible` false and no outline.
- R2 met: the camera prints `focus ring inside the body (button.dse-optchip…)` instead of the skip. The check is live: a 50px offset makes it FAIL (`cut off on top 6.0px`). But zeroing the body padding does NOT make it fail: the chip sits 46px / 63px from the body edges (LOW-2).
- Both guard tests are non-vacuous: reverting each CSS hunk alone fails exactly its own test.
- Battery (re-run by me): tsc/lint clean · jest **3997 / 1 skipped / 206 of 207**. The first full run had 1 load-sensitive flake, not related to SC-338 (INFO-1) · lifecycle 6/6 · shots 524, 0 FAIL, host-leak 114/684 · freeze **260/260** · parity **0 / 0 / 16**.
- **MEDIUM-1:** the fix also changes how every unpressed chip looks at REST and on HOVER, not only on focus: Obsidian's drop-shadow plate is removed. The R3 evidence and the CHANGELOG don't mention this, so Scott's Needs Review ask must include it.
- LOW-1: SKILL.md points at a scratch report for the round's numbers. LOW-2: the impl report is wrong about why the ring fits. INFO: flake, sweep diagnosis confirmed, leftover chip host leaks, `.dse-swatch` has the same defect.
- Tree state: both worktrees are byte-identical to the start state (`git status` shows only the pre-existing uncommitted ` M draw-steel-elements` pointer in the superproject). Evidence is in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/`.

---

## Findings

### MEDIUM-1 — Undisclosed visual change: unpressed chips lose Obsidian's `--input-shadow` at rest and on hover
- **Where:** `draw-steel-elements/styles-source.css:15359` (`.dse-optchip` added to the SC-203 section-B `box-shadow: none` `:where()` list). Disclosure gaps are in `CHANGELOG.md:11-17` (superproject) and in the R3 evidence set (`evidence-r1/probe-*`, which only has focused crops).
- **What happens:** section B is `box-shadow: none` for **every state**, not only `:focus-visible`. It is (0,2,0), so it beats all of Obsidian's (0,1,1) rules: `button:not(.clickable-icon){box-shadow: var(--input-shadow)}`, `button:hover{box-shadow: var(--input-shadow-hover)}` and `button:focus-visible`. Measured live on the same session, using the CSSOM base simulation (the two SC-338 selectors removed, then restored):

  | unpressed chip | base (6c4f6aa behaviour) | branch |
  |---|---|---|
  | dark, rest | `inset 0 .5px .5px .5px rgba(255,255,255,.09), 0 2px 4px rgba(0,0,0,.15), 0 1px 1.5px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.2)` | `none` |
  | light, rest | `inset 0 0 0 1px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.067)` | `none` |
  | dark / light, hover | `--input-shadow-hover` (4-layer / 2-layer) | `none` |

  You can see it (`rest-grid.png`, left = base, right = branch). In light mode, unpressed chips lose a double-border look (their own `--dse-border` plus Obsidian's 12% inset ring) and a drop shadow. In dark mode they lose the drop shadow. Pressed chips are unchanged: the Steel bevel is (0,4,0) and still wins.
- **Why it matters:** R3 says any visual change goes to Scott's eye, and the ask as built only shows the focused state. The CHANGELOG says "Both states now draw the same outlined ring … with the pressed chip's own bevel look untouched", which a reader takes to mean nothing else changed. The change itself is defensible: it is exactly SC-203's re-grounding philosophy, and the chip's own rule never asked for a host shadow. But it is a resting-state pixel change in two dialogs, and nobody has shown it.
- **Prescribed fix (owner picks one):**
  - (a) Keep the code. Add the unpressed rest-state before/after crops (both schemes) to the Needs Review ask, for example `probe-rest/{dark,light}-REST-{BASEsim,after}.png`. Add one CHANGELOG clause: "unpressed chips also drop Obsidian's own drop-shadow plate, matching every other DSE button".
  - (b) If Scott wants the host plate kept at rest, narrow the entry to `.dse-optchip:focus-visible` inside the `:where()`. That is still (0,2,0), so it still beats `button:focus-visible`. Update the hostRegrounding test string to match. I recommend (a), because (b) keeps a known host leak on purpose.

### LOW-1 — SKILL.md's SC-338 battery note points at a scratch file for its numbers
- **Where:** `workspace/.claude/skills/dse-verify/SKILL.md:195-199` (superproject `74a71c7`): "shots/freeze/parity as measured that round (see the round's report for the exact lines)".
- **Failure scenario:** the round report lives under `.superpowers/` (untracked scratch). The same file records a 2026-09-06 `rm -rf .superpowers` wipe, so the pointer can go dead and the durable doc would carry no numbers. The same section's expected host-leak line also still reads `111 … 666` (SC-205). The implementer measured `114 … 684` and flagged the drift, but did not update it.
- **Fix:** inline the lines: `shots 524, 0 FAIL; button host-leak OK (114 kinds × 3 states × dark/light = 684); freeze 260/260; parity 0 / 0 / 16 DECLARED; lifecycle 6/6`. Re-date the host-leak "expect right now" figure to 114/684 (`SKILL.md:136`).

### LOW-2 — The impl report gives the wrong reason for the passing ring check, and the check's power on this capture is geometric slack
- **Where:** `sc338-r1-impl-report.md` "Camera skip": "the ring fits inside the modal body's 4px padding".
- **Measured:** the auto-focused Success chip sits **46.0px** below and **62.8px** right of the body's scroll-box edges (`probe-geo/probe.log`, body does not scroll). So:
  - body `padding: 0; margin: 0` on `styles-source.css:13529-13530` → `modal-montage-edit` still prints `ok … focus ring inside the body` (`logs/camera-clipprobe.log`).
  - `outline-offset: 40px !important` on the chip → still `ok` (`camera-offsetprobe.log`).
  - `outline-offset: 50px !important` → `FAIL … FOCUS RING CLIPPED BY THE MODAL BODY: button.dse-optchip.dse-mt__sheet-resultchip (ring reaches 52px outside it) — cut off on top 6.0px` (`camera-offset50.log`). So the check really executes: R2 is satisfied and the check is not a no-op.
  - The padding regression the brief suggested is still guarded, but by `modal-montage-limits`: with padding zeroed it fails with `input.dse-mt__sheet-input … cut off on top 4.0px, right 4.0px` (`camera-limits-clip.log`), and it is `ok` again once restored (`camera-limits-clean.log`).
- **Fix:** no code change. Correct the claim in the ledger/report, and do not cite `modal-montage-edit` as the padding guard in the Needs Review ask or SKILL.md. The SKILL.md edit itself only says "the check runs for real", which is accurate.

### INFO-1 — A jest flake unrelated to SC-338 (load-sensitive)
- The first full `npx jest` run (1-min load ~8→13, other agents' shots/lifecycle running) gave `1 failed, 1 skipped, 3996 passed`: `test/dom/framework/sidebarInitiative.test.ts:350`, "SC-288 r2 (MEDIUM-1): undo right after a panel write recovers the degraded panel", `expect(received).toBeNull() / Received: "true"`.
- In isolation it passed 3/3 (11/11 each time), and a second full run was green: **3997 passed / 1 skipped / 206 of 207 suites / 3 snapshots**, exit 0. A CSS plus two-test-string diff cannot reach that suite. This is the SC-282/SC-288 sidebar area, so the owner may want a Backlog ticket for timing sensitivity (`logs/jest.log` has the trace).

### INFO-2 — Host-leak sweep diagnosis confirmed; the sweep does not guard this fix
- `button host-leak OK (114 button kinds × 3 states … = 684 comparisons …)` with the same 12-record exemption boundary (8/2/2), and `optchip` appears 0 times in `logs/shots.log`.
- `.dse-optchip` is created at exactly 4 sites, all inside `DseModal` subclasses: `src/elements/montage/LogActionModal.ts:192`, `src/views/ConditionsModal.ts:300,342,410`. `tagButtons()` (`visual-harness/shoot.mjs:1714`) sweeps the `gallery=1` page, which never opens a modal. Its key reads `data-pressed`, not `aria-pressed`, and a modal chip has no `[data-dse-element]` ancestor, so its root would key as `(none)`.
- So removing the section-B entry would not trip the sweep. The only automated guards are the `hostRegrounding.test.ts` string check (proven non-vacuous) and the real-Obsidian probe in this review. That is what the owner noted before dispatch, and the Backlog ticket is the right home.

### INFO-3 — The chip still has host leaks (not in scope; include in the sweep-extension Backlog ticket)
- Measured live, branch, all chips: `height: 30px` (Obsidian `--input-height`; the chip declares none).
- `background-color` is Obsidian `--interactive-normal` (`rgb(51,51,51)` dark / `#fff` light), not `var(--dse-surface)`. `button:not(.clickable-icon)` (0,1,1) beats `.dse-optchip` (0,1,0), `styles-source.css:2086-2097`.
- Unpressed `color` is Obsidian `--text-normal` (`rgb(218,218,218)` / `rgb(34,34,34)`), not `var(--dse-fg-muted)`. The same arithmetic applies.

### INFO-4 — `.dse-swatch` (Conditions "Color" row) has the same focus defect
- `styles-source.css:2131-2147`: a bare `<button>`, not in the ring rule or in section B.
- Measured: a focused **unpressed** swatch shows only Obsidian's grey `0 0 0 3px #555` / `#bdbdbd` ring. A focused **pressed** swatch shows its selection mark (`outline: 2px solid var(--dse-accent)`) plus the grey ring under it, so pressed looks the same focused or unfocused, except for the low-contrast grey (`probe-rest/*-swatch-pressed-focused.png`).
- Out of scope for SC-338 (the ticket names `.dse-optchip`). It is a sibling Backlog candidate. A fix would need a focus indicator that is distinct from the accent selection outline.

### INFO-5 — Questions from the brief, checked with no finding
- **Consumers / scope (brief item 2):** every consumer mounts inside `.dse-modal`, and `DseModal.open()` stamps `data-dse-theme="steel"` there (`src/framework/kit/managedModal.ts:98-104`). That puts the chip inside the steel token scope and the section-B anchor. Modals never carry `data-dse-print` (measured `null`; `reflectCss` deliberately does not reflect attribute-bearing prefs), so print mode cannot reach them.
- **Cascade (brief item 7):** `.dse-optchip:hover` (0,2,0) sets only background and colour. The pressed Steel rule (0,4,0) sets only background-image and box-shadow. Neither touches `outline`, and Obsidian's only outline rule is `button { outline: none }` (0,0,1). The selector list was only appended to, so no other control sharing the rule changes: shots 0 FAIL and host-leak 684 are unchanged.
- **Spacing:** the gap between chips is 5.25px and the ring reaches 4px, so the ring never overlaps a neighbouring chip.
- **Contrast:** it matches the implementer's figures (ring `#4db8c7` on `#333`, and `#2a7b88` on `#fff`, both above 3:1).
- **Mouse clicks:** clicking the result chips and the icon choices (whose handler re-renders and then calls `.focus()` programmatically) leaves `:focus-visible` false, so no ring appears on a mouse pick.

### INFO-6 — Disclosure
- I ran `git fetch -q origin` in the main checkout and in its `draw-steel-elements` (remote-tracking refs only, no working-tree change) to check for base drift. Neither `CHANGELOG.md` nor `SKILL.md` moved on `origin/main` since `eaba8d7`, and dse `origin/develop` is still `6c4f6aa`.
- My probes did modify the worktree and I undid each change: the CSS probe edits (restored via `git checkout`; `styles-source.css` md5 `4b5d0539…` before and after each), `demo-vault/.obsidian/appearance.json` (restored via `git checkout`), and the git-ignored `demo-vault/Harness/conditions.md` (regenerated via `notes-gen.mjs`).
- `main.js`/`styles.css` are rebuilt from the clean branch. The camera shots `modal-montage-{edit,limits}--obsidian-steel-dark.png` were regenerated clean, and my two `--ERROR.png` files were removed.
- The only processes killed were ones I started, by PID: Xvfb `:187` and the Obsidian children.

---

## Probes run (commands and outcomes)

| # | Probe | Result |
|---|---|---|
| 1 | Real Obsidian, montage edit-mode sheet + Conditions row editor, dark + light, real CDP Tab / Shift-Tab / mouse (`probe.mjs` → `probe-branch/probe.log`) | Ring present on all focused chips, pressed and unpressed. Token is real. Host ring gone. Bevel kept. Mouse click gives no ring. BASE simulation reproduces the defect: unpressed = grey 3px box-shadow only, pressed = no indicator |
| 2 | Vacuity: remove `.dse-optchip:focus-visible,` only → run the 2 guard files | `kit-index` "one rule covers every focusable kit control" FAILS (1 failed / 81) |
| 2b | Vacuity: remove `.dse-optchip` from section B only | `hostRegrounding` "the box-shadow reset excludes the selected tab" FAILS (1 failed / 81); clean = 82/82 |
| 3 | Camera `--element=modal-montage-edit`, branch | `ok … focus ring inside the body (button.dse-optchip.dse-mt__sheet-resultchip)` |
| 3b | Same, ring selector removed | `ok … focus ring not checked (focused field draws no outline)`, which is the old skip |
| 3c | Same, body padding/margin zeroed | still `ok` (geometric slack, LOW-2) |
| 3d | Same, `outline-offset: 50px` | `FAIL … cut off on top 6.0px` (check is live) |
| 3e | `--element=modal-montage-limits`, padding zeroed / restored | `FAIL … top 4.0px, right 4.0px` / `ok` |
| 4 | Rest/hover before-vs-after, swatches, chip gap (`probe-rest.mjs`) | MEDIUM-1, INFO-4, gap 5.25px |

## Battery (this review, worktree `sc338-chip-focus`, dse `7177033`)

| Gate | Line |
|---|---|
| tsc | clean, exit 0 |
| lint | clean, exit 0 |
| jest | run 1: `1 failed, 1 skipped, 3996 passed` (INFO-1 flake) → run 2: `Tests: 1 skipped, 3997 passed, 3998 total`, `Test Suites: 1 skipped, 206 passed, 206 of 207 total`, 3 snapshots, exit 0 |
| obsidian-lifecycle | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 |
| shots | exit 0, 524 browser PNGs, 0 FAIL; `host-copy pin OK (… verbatim Obsidian 1.14.2 …)`; `button host-leak OK (114 button kinds × 3 states … = 684 comparisons …)` |
| freeze | `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0 |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 |
| camera | `modal-montage-edit` ok (ring checked); `modal-montage-limits` ok |

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/`)
- `review-grid.png`: 12 focused crops. Rows: dark montage, light montage, dark Conditions, light Conditions. Montage columns: pressed, unpressed, unpressed BASE-sim.
- `rest-grid.png`: resting Result row, BASE-sim (left) vs branch (right), dark and light, plus pressed-swatch focus.
- `probe-branch/`, `probe-rest/`, `probe-geo/`: individual crops and `probe.log` files.
- `logs/`: every gate and camera log named above.
- Probe scripts: `probe.mjs`, `probe-rest.mjs`, `probe-geo.mjs`, `run-probe.sh`, `run-camera.sh`.
