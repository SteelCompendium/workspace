# SC-431 r2 scoped re-review (reviewer B) — dse `73e6a80` on `7817133`, superproject `b67a07c`

## Executive summary
- **Verdict: LAND-READY.** No BLOCKER, HIGH, MEDIUM or LOW findings; 2 INFO.
- The rebase carried r1 over unchanged: `git range-diff` shows `cb613d8 = 9741e41` and `56c83b8 = 1df0aa6`.
- Gates re-run at `73e6a80`:
  - tsc rc=0, lint rc=0.
  - jest 5033 passed / 1 skipped / 229 of 230, rc=0. That is 5013 + 17 + 3: the Conditions block went from 1 test to 4.
  - lifecycle 26/26, rc=0.
  - e2e `74/78 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`, rc=0.
- ConditionsModal, in real Obsidian: Escape with the dropdown open now closes only the dropdown and moves focus to "Add condition"; a second Escape closes the window; nothing is written. PRB-06 now shows `modals=1`; in r1 it showed `modals=0`. Escape after an Enter-add (a live write) and Escape across three reopen cycles behave the same way. Escape with the dropdown closed is unchanged (PRB-07). COND-E01 passes.
- Mutation MC (Conditions registration neutralised): COND-E01, PRB-06, PRB-09 and PRB-10 fail in real Obsidian, and 2 jest tests fail. STAM-S06 and PRB-07 stay green.
- LOW-2 is fixed. Under M1 (override reverted) 7 jest tests fail; each of the 7 also fails when run alone, and no clean-Escape test fails. In r1, 4 of 9 failures were cascades.
- LOW-3 is fixed. Under M3 (teardown deleted) 3 tests fail, including the managedModal teardown test that stayed green in r1.
- The rename is complete: no stale `draftCancel` / `cancelDraftAt` / canceler names, and the semantics are byte-equivalent. The CHANGELOG wording is accurate. The census commit `73e6a80` adds the newly declared manifest ids; it does not loosen either census.

## Gates (foreground, rc captured by a script wrapper)
| Gate | Result | Log |
|---|---|---|
| tsc | clean, rc=0 | sc431-r2-rereview-tsc.log |
| lint | clean (only the old .eslintignore warning), rc=0 | sc431-r2-rereview-lint.log |
| jest (`main.js`/`styles.css` removed first) | `Test Suites: 1 skipped, 229 passed, 229 of 230 total` / `Tests: 1 skipped, 5033 passed, 5034 total`, rc=0 | sc431-r2-rereview-jest.log |
| lifecycle (port 9532) | `OBSIDIAN-LIFECYCLE done: 26/26 ok, 0 failed`, rc=0 | sc431-r2-rereview-lifecycle.log |
| e2e full | `OBSIDIAN-E2E done: 74/78 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`, rc=0 (COND-E01, STAM-S06/T12/S07/F07a and CENSUS-01..05 ok) | sc431-r2-rereview-e2e-head.log |

- The coverage delta of +5 pairs is the new manifest: `init.cond.add` click, `cond.add` click and press:Escape, `cond.input` type and press:Escape.
- I did not re-run shots, freeze or parity: the r2 delta touches no CSS, and adds only `data-dse-control` attributes, which the visual harness does not render.

## Real-Obsidian probes at `73e6a80`
- Spec: sc431-r2-rereview-probe.e2e.ts. Log: sc431-r2-rereview-e2e-probe-head.log.
- PRB-01..05 and PRB-07 (the r1 set) still pass, along with COND-E01.
- **PRB-06 (ok):** type "daz" (2 menu items), then Esc. Result: `modals=1 comboboxStillOpen=false addButtonShown=true focus=dse-btn dse-condal__add`.
- **PRB-09 (ok):** type "dazed", then Enter. The condition is added and written live, and the combobox stays open with focus on `cond.input`. Esc closes only the dropdown; a second Esc closes the window. The note contains "dazed".
- **PRB-10 (ok):** open the dropdown, type, and press Esc, three times in a row. The modal stays open each time, with exactly 1 modal open. The final Esc closes it with no write. Each re-render registers a fresh consumer.
- PRB-08 (`ds-conditions` panel path, which opens through `openManagedModal`) cannot be probed. `ds-conditions` is `deferred: true` (`src/elements/conditions/definition.ts:28`, SC-406), so the block renders inert unless `experimental` is on, and the probe timed out waiting for it to render. The panel opens the same `ConditionsModal` class, so the jsdom tests cover it. This is not a product finding.

## Mutations (throwaway `git worktree` at an absolute scratch path, now removed)
- **MC: `registerEscapeConsumer(...)` in `ConditionsModal.renderCombobox` turned into a no-op.**
  - jest: 2 failed ("the first Escape closes just the dropdown…" and "a second Escape (dropdown now closed)…").
  - e2e: COND-E01 FAIL ("the first Escape should close only the dropdown…"), PRB-06 FAIL (Received 0), PRB-09 FAIL, PRB-10 FAIL. PRB-07 and STAM-S06 ok.
  - Logs: sc431-r2-rereview-mutC-jest.log, sc431-r2-rereview-mutC-e2e.log.
- **M1: `managedModal.ts` reverted to `7817133` (no `onEscapeKey` override).**
  - jest, over all 5 SC-431 suites: 7 failed, 282 passed. The failures are managedModal (dirty draft; second Escape), conditions (first; second), stamina-edit-modal (Stamina; Temp) and the pool modal.
  - Each of the 7 also fails alone (`-t`, one at a time), so the failing set equals the isolated set. The clean-Escape and footer-button tests pass under M1, so nothing cascades.
  - Logs: sc431-r2-rereview-mut1-jest.log, sc431-r2-rereview-mut1-isolated.log.
- **M3: the `owner.register` teardown deleted from `escapeConsumer.ts`.**
  - jest: 3 failed: the stepper test "consumer is dropped when the owner unloads", the managedModal test "after the modal closes its field is no longer an Escape consumer" (vacuous in r1), and the conditions test "stale combobox input is no longer an Escape consumer".
  - Log: sc431-r2-rereview-mut3-jest.log.

## Delta review
- **ConditionsModal** (`src/views/ConditionsModal.ts:559-571`):
  - The consumer is registered per combobox input and owned by `this.lifecycle`.
  - It returns false when `!this.addOpen`, so the modal closes as before.
  - Otherwise it calls `closeAdd()` (re-render, then focus "Add condition") and returns true.
  - Entries from earlier re-renders sit on detached inputs, are harmless, and are dropped when the modal unloads.
  - The old keydown Escape branch (`:583`) stays as a harmless fallback; inside a DseModal the Scope always handles Escape first.
  - Prescription followed exactly.
- **Rename:** `draftCancel.ts` becomes `escapeConsumer.ts`, `registerDraftCancel` becomes `registerEscapeConsumer`, and `cancelDraftAt` becomes `consumeEscapeAt`. The function bodies are identical apart from the identifier and comment wording. `git grep` for `draftCancel|cancelDraftAt|registerDraftCancel|draft-cancel|canceler` at `73e6a80` returns nothing.
- **CHANGELOG** (worktree superproject `CHANGELOG.md:13-19`, under `## Unreleased`):
  - It now says "the pool Stamina field in the initiative minion Stamina window" (LOW-1 fixed) and adds the Conditions "Add condition" dropdown.
  - Both claims are accurate. The Conditions window ships through the initiative tracker; the standalone block is deferred.
- **LOW-2** (`test/dom/_obsidianKeymap.ts:11-37`):
  - A module-level `live` set plus an `afterEach` registered on each importing file detaches every stand-in keymap; detach is idempotent.
  - All end-of-test `detach()` calls are removed, in managedModal, stamina-edit-modal, the pool modal and conditions.
  - Proven by M1, where nothing cascades.
- **LOW-3** (`test/dom/kit/managedModal.test.ts:568-579`): the teardown test now asserts `consumeEscapeAt(inputEl) === false` after close, with a dirty value in place, and its comment explains why a dispatched event would be vacuous. Proven by M3.
- **Census commit `73e6a80`** (legitimate):
  - jsdom (`test/dom/e2eCensus.test.ts:197`): the "no `data-dse-control`" scan is still scoped to the stamina entry points. The "every id is in a manifest" scan covers the whole tracker root, and the tracker now stamps `init.cond.add`, so the allowed set gains exactly `idsOf(conditionsManifest)`: `cond.add`, `cond.input`, `init.cond.add`.
  - Real Obsidian (`e2e/specs/_census.e2e.ts:15`): `ALL_IDS` gains the same 3 ids. No scope was narrowed, no check was removed, and every added id is declared in a manifest with required kinds, so the exercised-set gate enforces it (57/57).
  - `e2e/manifest/conditions-modal.ts` says plainly that it inventories only what COND-E01 drives. No census scans the Conditions modal body, which is consistent with that narrow scope and is no regression from r1, where the modal was not a pilot surface at all.

## Findings
- **INFO-1** (`src/framework/kit/managedModal.ts:7`): the header comment still reads "a draft-first Escape". The `onEscapeKey` doc (`:101`) was updated to "backs out first". There is a similar test title at `test/dom/kit/managedModal.test.ts:581`. Cosmetic; optional one-word edit.
- **INFO-2** (landing note for the owner): the superproject worktree branch is based on `2b9b29d` and carries `a7f5d96` + `b67a07c`, while workspace `main` is now `b874ac0`. The land-stack flow (`wt-finish`) must rebase or merge it and bump the pointer to the dse `develop` result. Not a code issue.
- The dse-verify expected numbers should become 74/78, 4 known-bug, 57/57 pairs and jest 5033/1 (implementer follow-up; dispatcher at landing).

## Hygiene
- Before and after `git status --porcelain` are identical (dse with `--ignored`, and the superproject: the unstaged ` M draw-steel-elements` pointer).
- The throwaway worktree `…/scratchpad/wt-probe2` was removed after its `node_modules` symlink was unlinked.
- No commits, stashes or resets on `sc431-escape-field`, no processes left running, and no tracker calls.

## Artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc431-escape-field/)
- Report and probe inputs: sc431-r2-rereview-report.md, sc431-r2-rereview-probe.e2e.ts, sc431-r2-rereview-probe-conditions.md
- Head gates: sc431-r2-rereview-tsc.log, sc431-r2-rereview-lint.log, sc431-r2-rereview-jest.log, sc431-r2-rereview-lifecycle.log, sc431-r2-rereview-e2e-head.log, sc431-r2-rereview-e2e-probe-head.log
- Mutations: sc431-r2-rereview-mutC-jest.log, sc431-r2-rereview-mutC-e2e.log, sc431-r2-rereview-mut1-jest.log, sc431-r2-rereview-mut1-isolated.log, sc431-r2-rereview-mut3-jest.log
