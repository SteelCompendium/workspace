# SC-492 r2 scoped re-review — dse `04ab9dc` on `2c61511`, superproject `76d22fa` on `2ba04a6`

## Summary
- Verdict: **LAND-READY**. 0 HIGH / 0 MEDIUM / 0 LOW / 2 INFO (both concern the next rebase, not code).
- Rebase: `git range-diff d152ea4..d41d19d 2c61511..04ab9dc` shows the 2 r1 src/test commits `=` (identical). The 2 r1 G-S32 commits differ only in context lines (G-S18 header and the tail of G-S18). `git diff 2c61511..HEAD -- obsidian-lifecycle.mjs` deletes nothing, and G-S18, G-S28 and G-S32 are all present. The conflict resolution is correct.
- Fixes reviewed: LOW-1 (header now "(34 scenarios in all)" at `obsidian-lifecycle.mjs:56`; 34 scenarios counted, and the gate prints 34/34), INFO-1 (pin test), INFO-4 (`bar.contains(chrome)` at `StaminaBarPanel.ts:142-143`, plus its test). All correct.
- New tests are not vacuous. Each run used only `StaminaBarPanel.ts` from the named ref:

  | Src from | Result | Failing tests |
  |---|---|---|
  | `2c61511` | 5 failed / 19 passed | the new pin row and the 4 r1 tests |
  | r1 `d41d19d` | 1 failed / 23 passed | only "a .dse-chrome ABOVE the bar does not swallow a click on the bar" |
  | HEAD | 24/24 passed | none |

  The INFO-4 test protects exactly the change it was written for.
- Gates at `04ab9dc`:
  - tsc and lint clean.
  - jest 5804 passed / 1 skipped / 240 of 241 suites.
  - lifecycle 34/34 (G-S18, G-S28 and G-S32 ok).
  - e2e 104/104 ok, 0 failed, 0 known-bug, 69/69 pairs.
  - Plain shots: rc 0, 592 PNGs, 0 FAIL. It printed the expected `OBSIDIAN APP.CSS PIN DRIFT` warning. Also: `host-copy pin OK (… verbatim Obsidian 1.15.0; 18 further rules …)`, `button host-leak OK (113 … 678 …)` with 20 rest-sampled records, `modal button host-leak OK (10 … 228 …)`, `text scale OK (1626 …)` and `text scale once OK (107256 … 214 loads …)`.
  - freeze 280/280 OK.
  - parity 0 / 0 / 24 DECLARED.
- Real Obsidian 1.15.0 (r1 probes R-default and R-off; bundles built from head and from 2c61511):

  | Probe | base | head |
  |---|---|---|
  | Pencil by mouse, Tab+Enter, Tab+Space | `["form","stamina"]` | `["form"]` |
  | Bar click | — | `["stamina"]` |
  | Collapse / expand / panel background | collapse `["stamina"]` | `[]` |
  | Sidebar copy | — | pencil `["form"]`, bar `["stamina"]` |
  | authoring OFF | — | collapse `[]`, bar `["stamina"]` |

- Interaction with develop `53e1e48` (SC-488 + SC-485): **No**. Reasons are in INFO-2.
- Tree as found: plugin clean with no stash; superproject ` M draw-steel-elements` only, as before. Nothing committed.

## Findings

### INFO-1 — the superproject CHANGELOG will conflict on the next rebase (trivial)
- origin/main is now `78ab8c2`. Since `2ba04a6` it has added the SC-485 bullet at the top of `## Unreleased`.
- `git merge-tree 2ba04a6 origin/main HEAD` shows one conflict in `CHANGELOG.md`: both bullets are inserted at the same spot. Resolution: keep both bullets.
- Correction to my r1 INFO-6: the "`git merge-tree` is clean" claim was not actually verified. This machine's git 2.34.1 has no `--write-tree`, so the command errored and printed nothing. At r1 the result happened to be harmless, because origin/main's delta then touched only HANDOFF.md.

### INFO-2 — SC-488 and SC-485 do not interact with the pencil → edit-form path or with the bar click handler
- `git diff 2c61511..origin/develop --stat`: 17 files. None of them is a file this branch touches (`StaminaBarPanel.ts`, the two jest files, `obsidian-lifecycle.mjs`), and none is in `src/framework/` (pipeline, chrome).
- SC-488 (`src/authoring/FormModal.ts`, `formModel.ts`, `schemaShape.ts`) changes how the form displays and saves an absent optional select.
  - The `openFormEditor` export and its signature are unchanged. The pipeline's pencil item calls that function, and the jest test spies on it.
  - `.dse-form__preview`, which G-S32 uses to tell "form" from "stamina", is still created (`FormModal.ts:117` on develop).
  - G-S32 never saves the form; it asserts the note is byte-identical. SC-488's save semantics are therefore not exercised.
- SC-485 (initiative `model.ts`/`resolveRefs.ts`, plus `undeclaredDefaults.ts` gaining `isUntouchedDefault` and an optional `keep` parameter) changes what gets written on save. It does not change rendering or click wiring. The initiative rows' `renderStaminaBar` call is not touched.
- `test/mocks/obsidian-core.ts` gains a `selectEl` on the fake dropdown. That is unrelated to clicks.
- Prediction: the implementer's rebase onto `53e1e48` should replay `src`/`test`/lifecycle without conflicts. That is inferred from the diffs; I did not run it.

## Evidence (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc492-rereview-r2/`)
- `tests-vs-2c61511.log`, `tests-vs-d41d19d.log`, `tests-vs-HEAD.log` (script `tests-vs.sh`)
- `tsc.log`, `lint.log`, `jest.log`, `lifecycle.log`, `e2e.log`, `shots.log`, `freeze.log`, `parity.log` (+ `.rc` files)
- `rv-head-exp1.log`, `rv-base-exp1.log` (scenario source `review-scenarios.mjs.txt`, spliced by `splice.py` into a temporary harness copy that is deleted after each run)
