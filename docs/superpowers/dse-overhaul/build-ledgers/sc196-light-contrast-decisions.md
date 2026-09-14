# SC-196 — decisions ledger (light-scheme contrast audit)

**Reconstructed 2026-09-13** by the ticket-owner: the original `.superpowers/sdd/sc196-light-contrast/`
ledger + reports were destroyed in the 2026-09-06 `.superpowers/` wipe (SC-306 incident, adapter §8.7).
Rulings below are quoted from the Linear thread; the branch itself survived in the worktree.

## Effort state

- Worktree: `/home/scott/code/steelCompendium/worktrees/sc196-light-contrast`
- dse branch `sc196-light-contrast`: commits `a81f074` (light STATE palette) + `a74fa87` (round 2:
  inter-token separation, select solve) — rebased 2026-08-29 onto develop `c09cf6f`; now 65 behind
  `origin/develop` `e12c6bd`. Files: `styles-source.css`, `test/dom/framework/lightContrast.test.ts`
  (new), `test/dom/framework/theme-steel.test.ts`.
- Superproject worktree: doc commit `77c0748` (D3 token map Steel-light column) — 108 behind
  `origin/main` `728f514`.
- Spun-off tickets (Backlog): SC-270 spent-row neutral-ink dimming, SC-271 dark-scheme misses,
  SC-273 token-map value gate, SC-274 final-review LOW nits.
- Last posted numbers (2026-08-29, pre-wipe): jest 3281/185 suites; shots 474, 0 FAIL; freeze 210/210;
  parity 0/0/16 DECLARED; dark 0/119 changed; print 0/236 changed.
- Freeze baseline has since been regenerated (252) and rebaselined by SC-202 (260) — expected now
  `freeze OK (260/260 …)` on develop `e12c6bd`.

## Rulings (verbatim, dated)

### 2026-08-29 — Scott, replying to the consolidated ask (decisions 1–3 + flagged color-only spots)

> Looks a lot better.  This all looks good.  For the things you flagged, so long as they have on-hover tooltips, I think they are fine

Owner's reading (2026-09-13):
- Decision 1 (approve the light state palette): **approved** → lands to develop.
- Decision 2 (crit as heaviest spine): **keep as is.**
- Decision 3 (stamina hues near-equal darkness): **(a) accept.**
- Flagged color-only spots — roll-result active/dimmed row, the +N temp-stamina badge, the selection
  ring as a signal — are acceptable **conditional on each having an on-hover tooltip** that names
  the state in words. Round 3 must verify/add these before land-ready.

### 2026-08-23 — Scott, SC-183 (origin of this ticket)

> Yes, i also thought some of the contrast ratios in the light theme are harsh. Please make a ticket in the DSE 7.0.0 project.

## Rounds

- r1–r2 (2026-08-28/29): palette + review, posted for approval. Reports lost in the wipe.
- r3 (2026-09-13): rebase onto develop `e12c6bd` / main `728f514` + tooltip condition. Implementer.

### r3 result (2026-09-13, implementer)
- dse rebased 0-conflict onto `e12c6bd` → palette commits re-issued, tooltip commit on top; tip `068a2a6`.
  Superproject rebased onto `728f514`, pointer bumped; tip `95c88a7`.
- Tooltips added via kit `tooltip()`/`setTooltip` + aria-label on: roll-result active/dimmed rows,
  `+N` temp badge ("Temporary Stamina: N"), initiative cell toggle. CSS untouched; light token values
  byte-identical to `a74fa87`; `lightContrast.test.ts` 25/25.
- Gates: tsc/lint clean; jest 3870 passed / 1 skipped / 202 of 203 suites; shots 524, 0 FAIL
  (host-copy pin OK, host-leak OK 113 kinds); freeze OK 260/260 exit 0; parity 0/0/16 exit 0.
- Follow-up (worker): superproject worktree's untouched submodules (data-gen, data-sdk-npm, steel-etl,
  steelCompendium.github.io, v2) show as modified after the superproject rebase — checkouts vs
  rebased pins. Landing concern for the dispatcher (`git submodule update` on untouched ones), not code.
- Owner probes handed to the r3 reviewer: selected cell's tooltip still says "Select …"?; roll-row
  label run-together ("≤113 + M damage") real or dump artifact?

### r3 review (2026-09-13, reviewer) — FIX-ROUND
- Gates + rebase integrity PASS (dark 0/132, print 0/130, realprint 0/130 changed; light token values
  identical to a74fa87). Tooltip condition NOT met.
- Decisive fact: Obsidian `setTooltip` writes only `aria-label`; hover renderer reads it back. So
  tooltip text == accessible name.
- HIGH-1: selected cell still hovers "Select Goblin #1" (kit iconButton restores aria-label after
  tooltip()). HIGH-2: `IconButtonHandle.setTooltip` is a no-op for every kit button; test locks it in.
- MEDIUM-1: roll-row label run-together is real ("≤113 + M damage", powerRollPanel.ts:260).
- MEDIUM-2: roll rows are roleless divs — aria-label reaches no AT; deliverable is the tooltip only.
- LOW-1/2: 4 of 9 new tests mutation-green; tests assert the call, not the rendered state.
- Surface 2 (+N temp badge) PASSES.
- Owner rulings: ALL six folded into r4 (same files, same area). No new tickets. Changelog bullets
  (dse + workspace) folded into r4 too. Roles on roll rows out of scope.

### r4 result (2026-09-14, implementer; interrupted once by a Sonnet session rate limit, resumed)
- dse `613801e` (fix code+tests) + `638c657` (changelog); superproject `d9d238c` (pointer + workspace
  CHANGELOG bullet). All six r3 findings addressed: dead `IconButtonHandle.setTooltip` removed;
  selected cell now "Selected — <name>" via `setLabel`; roll rows "Not rolled. ≤11: 3 + M damage";
  false screen-reader claims removed; tests assert rendered aria-label.
- Gates: tsc/lint clean; jest 3870/1 skipped/202 of 203 suites; shots 524/0 FAIL; freeze 260/260;
  parity 0/0/16; lightContrast 25/25; mutation 10/182 red (2 surface-3 tests green by construction).
- Follow-up (worker): mount-time `IconButtonOptions.tooltip` has the same aria-label-restore bug for
  callers whose tooltip differs from label (e.g. conditionIcons.ts). Sent to the r4 reviewer for
  verification by execution; owner decides ticket after.

### r4 review (2026-09-14, reviewer) — LAND-READY, 0 blocking, 3 LOW/INFO
- All six findings confirmed fixed by execution; mutation 1 10/182 red, mutation 2 (setLabel neutered)
  turns surface-3 tests red — "green by construction" holds. Gates match r4 report. Pixel manifest
  byte-identical to r3 review; dark/print/realprint 0 changed vs develop reference; light 50/132.
- Follow-up REAL: mount-time `IconButtonOptions.tooltip` discarded when != label; 10 call sites / 6
  files. **Ruling: filed SC-324 (Backlog, DSE 7.0.0, related SC-196).**
- LOW-1 (iconButton.ts:40 JSDoc still promises `tooltip?:` works) + LOW-2 (changelog: "all ten" →
  eleven tokens incl. `--dse-turn-done`/`--dse-danger`; "the power-roll tier badges" overstates —
  only crit gold is new to light). **Ruling: fold into r5 docs-only chore** (Haiku), gates tsc/lint/jest
  only (no CSS/DOM change → shots/freeze/parity cannot move; owner reviews the diff).
- INFO-1 (powerRollPanel.test.ts:512 raw `**bleeding**` because unit mount passes no renderMd).
  **Ruling: drop** — test-mount artifact, production renders markdown.

### r5 (2026-09-14, chore) — docs-only, done
- dse `96e2238` (SC-324 warning on `IconButtonOptions.tooltip` JSDoc + changelog wording), superproject
  `f1f0104`. tsc/lint/jest 0 (3870/1 skipped/202 of 203). Owner reviewed the diffs: correct.
- **LAND-READY** as of dse `96e2238` / superproject `f1f0104`. Landing is the dispatcher's move.
  Main now `93a541b` → superproject rebase at landing (CHANGELOG Unreleased bullet may conflict);
  dse develop still `e12c6bd`. Untouched submodules in the worktree need `git submodule update` first.
