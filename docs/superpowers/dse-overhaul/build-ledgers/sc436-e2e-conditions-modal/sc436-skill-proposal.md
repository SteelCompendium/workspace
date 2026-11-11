# SC-436 — proposed dse-verify SKILL.md CURRENT update (for the dispatcher at landing)

Executive summary: after SC-436 lands on top of 32441332, update "Current expected numbers":
e2e → `249/260 ok, 0 failed, 11 known-bug, coverage: 161/161 pairs`; jest → 7050 passed /
1 skipped (with the shots CSS cache); lifecycle 52/52, shots 592 / host-leak 163/978 / clip 147,
freeze 280/280, parity 0/0/24 unchanged.

- CURRENT line text: SC-436 landed — e2e rollout Tier 1: the ConditionsModal is covered in real
  Obsidian (specs `e2e/specs/conditions-modal/`, driver `e2e/driver/conditions.ts`, fixtures
  `Initiative/conditions.md` and `Initiative/two-trackers.md`, census `[CENSUS-09]`) and by a
  jsdom logic matrix (`test/dom/views/conditions-modal-matrix.test.ts`); `data-dse-control` ids
  on every ConditionsModal control (`cond.remove`, `cond.option`, `cond.icon`,
  `cond.color-custom`, `cond.done` added; DOM otherwise byte-identical); known-bug markers for
  SC-257, SC-355, SC-384, SC-580 (e2e) and SC-581, SC-582, SC-583, SC-585, SC-586 (jsdom).
- e2e known-bug set (11): SC-257, SC-384, SC-580, SC-355 (this ticket) + SC-577, SC-578,
  SC-588, SC-576 ×2, SC-575, SC-572.
- Gotcha worth recording: e2e scenario ids are global — a duplicate `[CENSUS-nn]` id across
  branches makes the runner exit 2 at start (hit on the SC-437 rebase).
- `cond.color-custom`: the native colour chooser is out of CDP reach; COND-D11 drives Enter as
  real input, COND-D17 dispatches the chooser's commit page-side (not a manifest drive).
