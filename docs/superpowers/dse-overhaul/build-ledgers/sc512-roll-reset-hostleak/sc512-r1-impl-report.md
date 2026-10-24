# SC-512 r1 implementer report

## Executive summary
- STATUS: DONE. dse branch `sc512-roll-reset-hostleak` head `635b6df` (one commit on base `c2758a2` = `origin/develop`; rebased 38f94f4 -> a0365a4 -> c2758a2 mid-round at the owner's request; full battery re-run on 635b6df). Not pushed; superproject pointer untouched.
- The gallery has a new sweep-only second `ds-roll` strip; the button sweep clicks its Edges "+" (real click), so its Reset is enabled. The first strip's Reset stays disabled and stays compared.
- Button sweep: `button host-leak OK (114 button kinds ... 684 comparisons ...)` = 113 -> 114 kinds, 678 -> 684 (+1 kind x 3 states x 2 schemes). The one new kind key is `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset` (enabled). Boundary unchanged: 12 records, same kinds.
- Zero new photographed shots (592), freeze 280/280, no widening file, modal 10/9/38/228, input 164, checkbox 60 unchanged.
- jest 6062 passed / 1 skipped / 245 of 246 suites (base 6058, +4 new tests). tsc, lint clean. lifecycle 37/37. e2e 123/123, 87/87. parity 0/0/24, exit 0.
- Base (c2758a2, no SC-512 change) gallery sweep measured: 113 kinds / 678, same 12-record boundary, modal 228, input 164, checkbox 60, 592 PNGs - so every delta here is SC-512's.
- Anti-vacuity: with the click disabled, the sweep FAILs (lines in section 5). Note one unrelated montage-wheel flake seen once under load (section 6).

## 1. Mechanism and why
`galleryExtra=roll` (new `HarnessParams.galleryExtra`, parsed like `stack`) appends a second `roll` section AFTER every gallery section, marked `data-dse-harness-extra="roll"` (no CSS keys on it). Only `assertBtnHostLeak`'s URL sends it; no capture URL does, so `gallery=1` and the `gallery--steel-*` shots mount exactly what they did (zero frozen/photographed movement, 592 PNGs unchanged). It is last in DOM order, so `tagButtons`' first-node-per-key still tags every existing kind from the original sections; the only new key is the one the extra strip's changed state creates. A second strip (not clicking the first) is required by the owner ruling that the disabled Reset stay compared. The real click is on `[data-dse-control="roll.edges.inc"]` inside the extra section, every dark/light load, after `openRollModifiersForSweep`, never from a capture.

## 2. Files changed (plugin submodule, commit b8ace1c)
- `visual-harness/entry.ts`: `galleryExtra` param (type, parse, appended targets, section marker via `mountOne(..., extra)`).
- `visual-harness/shoot.mjs`: `galleryExtra: 'roll'` on the button sweep URL; `ROLL_RESET_KEY`; `changeExtraRollModifierForSweep` (real click + loud asserts: exactly one Reset on the extra strip, enabled, with a box; first strip's Reset still disabled); after tagging, a loud check that both `...reset` and `...reset|disabled` keys were tagged.
- `test/dom/visual-harness/fixtures.test.ts`: 4 tests (param parse; no extra section without the param; extra strip mounted last + marked with its own Reset; Edges "+" click enables only the extra strip's Reset).
No `src/` change.

## 3. New kind keys
- `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset` (enabled). Only one. The Edges "+" click does not create another new kind (the enabled Edges +/- kinds already existed from the first strip's authored `edges: 1`).

## 4. Battery (final, at head 635b6df on c2758a2; logs in scratch dir below)
| Step | Result | rc |
|---|---|---|
| tsc (incl. `-p e2e`) | clean | 0 |
| lint (incl. e2e) | clean | 0 |
| jest | Tests: 1 skipped, 6062 passed, 6063 total; Suites: 1 skipped, 245 passed, 245 of 246 | 0 |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 37/37 ok, 0 failed` | 0 |
| e2e | `OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` | 0 |
| shots (shots-final-635b6df.log) | 592 PNGs, 0 FAIL | 0 |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical ...)` | 0 |
| parity (last, parity-final.log) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` | 0 |

Base measurement on c2758a2 without SC-512 (shots-base-c2758a2.log, also shots-base-a0365a4.log): `button host-leak OK (113 ... 678 ...)`, identical 12-record boundary, modal 228, input 164, checkbox 60, 592 PNGs.

Exact new line:
`button host-leak OK (114 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 684 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)`

Printed boundary (12 of those records, unchanged from SC-501):
```
10× focus-visible: disabled
    montage|dse-btn|disabled ×2
    negotiation|dse-btn|disabled ×2
    party|dse-btn.dse-btn--icon.dse-stepper__btn|disabled ×2
    roll|dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled ×2
    roll|dse-btn.dse-btn--icon.dse-stepper__btn|disabled ×2
2× hover: no point in its box hit-tests to it (clipped by an ancestor overflow, or covered)
    initiative|dse-btn.dse-init__stamina ×2
```
Modal line `10 modal scenarios over 9 modal classes, 38 button kinds ... 228 comparisons` + 6-record boundary unchanged; input `14 kinds ... 164`; checkbox `60`: all unchanged. `OBSIDIAN APP.CSS PIN DRIFT` warning present, expected. The enabled Reset has no exemption record (it is compared at rest, hover and keyboard focus-visible in both schemes).

## 5. Anti-vacuity (run on b8ace1c, pre-rebase; shoot.mjs/entry.ts byte-identical after rebase)
- Click disabled (`if (false && ... ) await inc.click()`, temporary, reverted; `git status` clean after): `npm run shots` rc=1,
```
BUTTON HOST-LEAK VIOLATED ...
  dark: clicking the extra roll strip's Edges "+" did not leave an enabled Reset with a box (0 enabled, 0 without a box) — the enabled roll Reset would go unchecked
  dark: the sweep tagged no `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset` button — the roll Reset would go unchecked in that state
  (same two lines for light)
```
- First draft (query param `galleryExtra` accidentally not wired in): same sweep FAILed with `expected exactly one Reset on the extra roll strip (galleryExtra=roll), found 0` - also shows the missing-strip branch is loud.

## 6. Notes
- One intermediate shots run (anti-vacuity attempt 1) died on an unrelated gate: `MONTAGE BOARD CLIPS INSTEAD OF SCROLLING - coarse pointer, 14 rounds, 900px pane: A MOUSE WHEEL OVER THE BOARD DID NOT SCROLL IT ... scrollLeft 0px of 1565.0px` (load avg ~14, other sessions running). Re-run was clean; the committed code's own full shots run (`shots2.log`) is green. Looks like a load flake, not caused by this change; log kept.
- `npm ci` was needed (worktree had no node_modules); lockfile unchanged.
- No widening file (no new photographed state, no new print line).
- Commit message carries no AI trailer (user's global CLAUDE.md rule overrides the harness attribution reminder).

Drive-by fixes: none.

Follow-ups:
- Possible flake to track: montage board wheel-scroll gate under heavy load (one occurrence, above). Not filed.
- dse-verify text for the owner to draft: button line becomes 114 kinds / 684 comparisons; add `galleryExtra` / enabled roll Reset note to the "Button host-leak sweep" bullet.

## Evidence artifacts (scratch dir /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc512-r1-impl/)
tsc.log, lint.log, jest-full.log, lifecycle.log, e2e.log, shots-final-635b6df.log (final shots), freeze.log, parity-final.log, shots-base-c2758a2.log, shots-base-a0365a4.log, shots2.log (pre-rebase green run), shots1.log (first failing draft), shots3a-montage-wheel-flake.log, shots3b-antivacuity.log, each with a matching .rc.

---

# r3 fix round (appended)

## Executive summary
- STATUS: DONE. dse head `f89f69f` on `253aa5f` (origin/develop; rebased from c2758a2). Two commits ahead: `a706ff7` (r1 work, rebased) + `f89f69f` (r3, new commit, not amended). Not pushed.
- LOW-1 fixed: `changeExtraRollModifierForSweep` records `incCount`; when not 1 it pushes `expected exactly one Edges "+" ([data-dse-control="roll.edges.inc"]) on the extra roll strip, found N — the click that enables its Reset could not be made` (Reset checks still run).
- INFO-1 fixed: the fixtures test types `gallery` as `Parameters<typeof mountFromParams>[1]` (not `as const`), so the three redundant `galleryIds: ['roll']` re-spreads are gone (the `as const` readonly tuple was why they were there: tsc rejected it).
- Full battery on f89f69f: tsc/lint clean; jest 6078 passed / 1 skipped / 245 of 246; lifecycle 38/38; e2e 123/123, 0 known-bug, 87/87; shots 592, 0 FAIL, `button host-leak OK (114 … 684 …)`, same 12-record boundary, modal 228, input 164, checkbox 60; freeze 280/280; parity 0/0/24, exit 0.
- Anti-vacuity (selector broken to `roll.edges.incX`, reverted): shots rc=1 with the new line `dark: expected exactly one Edges "+" ([data-dse-control="roll.edges.inc"]) on the extra roll strip, found 0 — …` (same for light), followed by the Reset lines.
- Superproject worktree: fetched, `merge --ff-only origin/main` OK (head 104dd85), `merge-base --is-ancestor origin/main HEAD` rc 0, `status -sb` shows only ` M draw-steel-elements`, submodule head f89f69f. Pointer not committed.
- LOW-2 (feature ability roll strip) untouched: SC-513's.

Logs (scratch dir sc512-r1-impl/): jest-r3b.log, lifecycle-r3b.log, e2e-r3b.log, shots-r3-final.log, parity-r3.log, freeze.log, shots-r3-antivacuity.log (each with .rc).
