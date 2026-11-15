# SC-631 — proposed dse-verify SKILL.md edits (for the dispatcher at landing)

1. Line ~205 ("Lifecycle and e2e notes", Montage e2e bullet). Replace
   `jsdom \`test.failing\` markers for montage bugs: SC-631 (SC-625's \`[K01]\`/\`[K02]\` and SC-626's \`[K03]\` are plain tests; \`test/dom/elements/montage-matrix.test.ts\`).`
   with
   `No jsdom \`test.failing\` markers remain for montage bugs (SC-625's \`[K01]\`/\`[K02]\`, SC-626's \`[K03]\` and SC-631's \`[K04]\` are plain tests; \`test/dom/elements/montage-matrix.test.ts\`). Skill and hero-name matching (SC-627, SC-631) is trimmed and case-insensitive through one helper, \`matchKey\` in \`model.ts\`; the skill-reuse warning names the skill as the board stores it (\`reusedSkillSpelling\`).`

2. New CURRENT block (numbers from the SC-631 owner; fill the landed sha):
   dse `develop` @ `<landed sha>` (2026-11-14; SC-631 landed on `e1be1775`; in a `ds-montage` Log an action
   window the "already used this skill" warning ignores casing and surrounding spaces ("nature" / " nature "
   after "Nature") and names the skill as the board stores it; warning only, the skill is logged as typed;
   `src/elements/montage/model.ts` `reusedSkillSpelling` + shared `matchKey`, `LogActionModal.ts`; jsdom `[K04]`
   marker now a plain test; new e2e MONT-L12) — tsc (incl. `tsc -p e2e`) and lint clean · jest **13334 passed /
   2 skipped** in a fresh worktree · lifecycle **64/64** · e2e
   **`OBSIDIAN-E2E done: 597/612 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`** (+1 ok, +1 total:
   MONT-L12, no new pair) · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze
   **280/280** · parity **0 / 0 / 24**.
   Also update the e2e row (step 4b) "today" figure to 597/612.

(Numbers subject to the r2 review / any fix round; the owner will amend this file if they move.)
