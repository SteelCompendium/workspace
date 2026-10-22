# SC-356 round 3 — scoped re-review report (delta only)

**Summary**
- VERDICT: **LAND-READY.** There are 0 CRITICAL/HIGH/MED/LOW findings and 2 INFO.
- Reviewed dse `2796ab8` on `8d890f9`. origin/develop is still `8d890f9`. Branch `sc356-hostleak-modal-buttons`; the tree was clean before and after.
- Superproject: `f87af93` on `988f24f`.
- The 4 rebased commits are patch-identical to their pre-rebase counterparts (`git range-diff`: all `=`). The delta is exactly e572c67 (styles-source.css + jsdom test) and 2796ab8 (shoot.mjs).
- LOW-1, LOW-2, LOW-3 (cheap part) and INFO-4 are fixed as ruled. The LOW-1 pin catches all 3 ways I weakened the rule. The LOW-3 registry check catches both a grandchild subclass and an inline `new Modal(`.
- The FreeHealConfirmModal scenario is sound. Its sweep tags only the confirmation's 2 buttons, with 2 `.dse-modal` roots open. Without `top`, it fails as "wrong modal". If the confirmation never opens, it fails as "blind".
- Gates are all green and match the brief's expectations:
  - jest 5591 / 1 skipped / 234 of 235
  - lifecycle 31/31
  - e2e 95/98, 0 failed, 3 known-bug, 66/66
  - shots 580: gallery 112/672; modal 10/9/38/228; text-scale 1626 + once 104184/208
  - freeze 280/280
  - parity 0/0/24

## Gates (2796ab8; fresh per-run logs in sc356-r3-rereview-q8v2/)
| gate | verbatim |
|---|---|
| tsc (incl. e2e) | rc=0, no output |
| lint (incl. e2e) | rc=0 (only the pre-existing `.eslintignore` ESLintIgnoreWarning) |
| jest | `Test Suites: 1 skipped, 234 passed, 234 of 235 total` / `Tests:       1 skipped, 5591 passed, 5592 total` |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` (port 9389) |
| e2e | `OBSIDIAN-E2E done: 95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` |
| shots | rc=0, 580 PNGs, 0 FAIL. `host-copy pin OK (… verbatim Obsidian 1.14.4 …)`; `button host-leak OK (112 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 672 comparisons …)`, boundary `8× focus-visible: disabled` / `2× hover: no point in its box hit-tests to it …`; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 228 comparisons …)`; `100 property difference(s) ALLOWLISTED … (SC-361: .dse-swatch, 10 properties)`; `not openable in the harness (3 …): CompendiumSearchModal, LegacyCompendiumModal, CompendiumMigrationModal`; `6× focus-visible: disabled`; `text scale OK (1626 comparisons: … on 5 chrome surfaces …)`; `text scale once OK (104184 comparisons over 208 loads: … 5 chrome surfaces included; 74s)` |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` |
| parity | `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**` (run last) |

The shots run took more than 600s. I launched it with nohup through a script file and waited in the foreground on its own PID (2438719), using `kill -0` loops. Its output went to the per-run log `shots-r1792628113.log`.

## Per-finding verification
- **LOW-1** (`styles-source.css:17194-17199` comment; `test/dom/theme/hostRegrounding.test.ts` new test; worktree `SKILL.md:194`).
  - The comment now owns the in-note `.dse-nt__chip` and its (0,3,0) restatement, and the block stays unscoped as ruled.
  - The pin catches each weakening I tried. Each probe was an uncommitted edit to `styles-source.css`, restored with `git checkout`:
    - dropping `height: auto;` from `.dse-nt__chip` failed 1 of 15 (`Expected substring: "height: auto;"`);
    - dropping `justify-content: flex-start;` failed 1 of 15;
    - lowering the nest to `:where([data-dse-element="negotiation"]) .dse-nt {` failed 1 of 15 (`toBeGreaterThan … Expected: > 0`).
- **LOW-2** (`styles-source.css:17224`): `display: inline-flex`, the comment is corrected, and the jsdom test rejects plain `flex`. The modal pass stays green.
- **LOW-3** (`visual-harness/shoot.mjs:2885` `assertModalRegistry`). It builds a class→parent map, takes the transitive closure to DseModal/Modal/SuggestModal/FuzzySuggestModal, and adds an inline `new (Modal|SuggestModal|FuzzySuggestModal)(` check with comments stripped. Cross-file button helpers are not followed, as ruled, and the doc comment says so. Probes used a temporary `src/__rr356_probe.ts`, deleted after each run:
  - `class RrProbeGrandchildModal extends LogActionModal {}` failed with `RrProbeGrandchildModal (src/__rr356_probe.ts) is a Modal subclass that is neither swept … nor declared …`;
  - `new Modal(app)` plus a button failed with `src/__rr356_probe.ts constructs a Modal inline (\`new Modal(…)\`) — … blind to its buttons …`.
- **INFO-4** (`shoot.mjs` ~:2864): the CompendiumSearchModal reason is reworded accurately. The harness mounts its rows for text-scale but never opens the modal, and the modal has no `<button>`.

## Rebase integrity
- **SC-422 + SC-356 both live in shoot.mjs.** One shots run printed both host-leak lines and both text-scale lines (above).
- **StaminaEditModal after SC-432** still sweeps 5 kinds per scheme, unchanged from r2: `dse-sedit__btn`, `dse-stepper__btn`, `dse-btn--danger.dse-sedit__btn`, `dse-btn`, and `dse-btn--accent|disabled`. The `stamina-bar:default` fixture is a no-pool hero, so Spend Recovery is enabled as "Heal Recovery Value" and adds no disabled kind. The modal exemptions are unchanged at 6× focus-visible disabled.
- **FreeHealConfirmModal (`shoot.mjs:2790-2804` scenario, `:2971` rootSel):**
  - **Topmost only:** with 2 `.dse-modal` roots open, the scope `[data-sc356-top]` tags exactly `modal:(none)|dse-btn ; modal:(none)|dse-btn.dse-btn--accent` (dark and light). None of the Stamina modal's kinds leak in.
  - **Contrast:** the same scenario with `top: false` failed with `opened a modal titled "Stamina", expected /^Heal without spending a Recovery\?$/ — the check would be sweeping the wrong modal`.
  - **Not opening:** when the press no longer opens the confirmation, it failed with `dark|FreeHealConfirmModal: the modal could not be opened (TimeoutError: page.waitForFunction: Timeout 8000ms exceeded.) — the check would be blind` (and the same for light).
- **CHANGELOG** `## Unreleased` keeps both bullets, SC-432 first and then SC-356, with no conflict markers.
- **SKILL.md** numbers match the run: 10 scenarios / 9 classes / 38 kinds / 228, 100 allowlisted, 3 unreachable, 6 exemptions, gallery 10-record boundary. The "modal-only" phrase is corrected.
- **dse clone** is still on `sc356-hostleak-modal-buttons` @ 2796ab8. The superproject shows ` M draw-steel-elements` (the pointer is unbumped, as expected).

## Findings
- **INFO-1 — superproject origin/main moved again.** It is now `3ba0832` (one `docs/handoffs/HANDOFF.md`-only commit: "SC-356/SC-361 second-lander reconcile recipe"). f87af93 sits on 988f24f. That commit has no overlapping files, so the rebase or fast-forward at landing is trivial. Its recipe applies if SC-361 lands first: relabel the second "E." block "F.", delete the HOSTLEAK_KNOWN_LEAKS entry, re-run shots.
- **INFO-2 — report-only wording.** sc356-r3-impl-report.md says the new kinds are "Cancel ghost, Heal accent". The measured Cancel key is plain `dse-btn` (no `--ghost`). No code or doc in the branch makes that claim, so nothing needs changing.

## Artifacts
Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc356-r3-rereview-q8v2/`
- Gate logs, each with a matching `.exit` file: `g-tsc.log`, `g-lint.log`, `g-jest.log`, `g-lifecycle.log`, `g-e2e.log`, `shots-r1792628113.log`, `g-freeze.log`, `g-parity.log`
- LOW-1 pin probes: `pin-drop-height.log`, `pin-drop-justify.log`, `pin-lower-nest.log`
- Registry probes: `m-plain-transitive.log`, `m-plain-inline.log`
- Control with per-scenario key dump: `m-plain-none.log`
- FreeHeal probes: `m-freeheal-noopen.log`, `m-freeheal-notop.log`
- Harness build: `hb.log`
- Probe sources: `rr_ntweaken.py`, `rr_mkscratch.py`, `rr-modalpass.sh`, `probe-transitive.ts.txt`, `probe-inline.ts.txt`, `rr-run.sh`, `rr-shots-launch.sh`
