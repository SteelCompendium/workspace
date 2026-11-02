# SC-511: proposed dse-verify text (apply at landing; SKILL.md NOT edited on the branch)

dse head to name: the final landed sha of `sc511-sidebar-unpin-focus` (branch head at r2: `eafe76e1`, on `origin/develop` `423e798d`; the dispatcher substitutes the landed develop sha).

## 1. Row 4b (e2e) — replace the "today" figure

In the table row "4b. e2e (real Obsidian, headless)", replace

    (today `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`)

with

    (today `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`)

(SC-511 added SBR-F01..F04, `e2e/specs/sidebar/sidebar-unpin-focus.e2e.ts`, and one control id `chrome.unpin` with press:Enter and click = +2 pairs.)

## 2. New CURRENT block (move the existing CURRENT to PREVIOUS as usual)

**CURRENT — dse `develop` @ `<landed sha>` (2026-11-02; SC-511 landed — a keyboard "Unpin from sidebar" (or "Remove panel" on an unavailable panel) hands focus to the panel that took the removed one's place, else the panel above, else the "No pinned blocks" message, instead of dropping it to the page body; a mouse click is unchanged; the note link and that message show the shared focus ring; no new lifecycle scenario):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6287 passed / 1 skipped / 251 of 252 suites** (fresh worktree 6286 / 2; +15 tests, +1 suite) · lifecycle **46/46** (three `--only` parts 21 + 16 + 9; none added) · e2e **`OBSIDIAN-E2E done: 128/128 ok,
0 failed, 0 known-bug, coverage: 89/89 pairs`** (+4 tests, +2 pairs) · shots **592**, 0 FAIL, button host-leak 161/966 · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as measured by the SC-511 implementer at `c37d9b49` (full battery) and re-measured, all matching, by its independent reviewer; the r2 delta (`eafe76e1`: a comment in `focusHandoff.ts` plus the CHANGELOG bullet) re-ran tsc, lint and the two touched jest files (96/96).

## 3. (dropped by the owner)

No lifecycle-row footgun line: the skill already says a busy port exits 2 and to set your own `DSE_LIFECYCLE_PORT`; the race behind the one mass-FAIL seen here is SC-551's to fix and document.
