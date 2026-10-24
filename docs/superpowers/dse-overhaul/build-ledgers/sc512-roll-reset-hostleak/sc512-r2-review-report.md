# SC-512 r2 independent review

## Executive summary
- **Verdict: LAND-READY.** Reviewed dse `c2758a2..635b6df` (1 commit, `sc512-roll-reset-hostleak`; `origin/develop` is still `c2758a2`). No HIGH, no MED. 2 LOW, 3 INFO. None block landing.
- Shots, run by me on 635b6df: rc 0, 592 PNGs, `button host-leak OK (114 … 684 …)`. Same 12-record boundary as base. Modal 10/9/38/228 (6-record boundary), input 164, checkbox 60, `PIN DRIFT` warning as expected. All match r1's report.
- Freeze `280/280`, rc 0. Parity `0 gap(s), 0 undeclared, 24 declared`, rc 0. jest 6062 passed / 1 skipped / 245 of 246 suites (my run read 6060 + 3 skipped; the 2 extra skips are an environment effect, see P5). tsc and lint clean.
- **All 592 PNGs are byte-identical between base c2758a2 and branch 635b6df** (full sha256 list, not only the 280 frozen). No widening is needed.
- The enabled kind is compared in all 3 states × 2 schemes, and only that kind. A leak scoped to the enabled Reset turns the branch red with exactly 6 lines, each naming `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset`. The same leak on base passes `113/678` green, which proves the hole existed. The disabled kind is still in the boundary ×2.
- Two more anti-vacuity probes go red loudly: (a) Reset never enables; (b) the click "swaps" onto the first strip, which is the regression the owner ruling forbids.
- lifecycle and e2e were not re-run. They build `main.ts` only, and nothing outside jest and the harness imports `visual-harness/entry.ts`.
- Follow-up for the owner to consider filing (LOW-2): the roll strip inside a feature ability is never host-leak swept, in either state.

## Findings

### LOW-1: a missing stepper is reported as a click that did not take
`visual-harness/shoot.mjs:2691` (`if ((await inc.count()) === 1) await inc.click();`) and the message at `:2713`.
- **Scenario:** someone renames the `roll.edges.inc` control id, or the extra strip's mode hides Edges (flat dice). The click is then skipped without a word. The sweep still FAILS, but the message says `clicking the extra roll strip's Edges "+" did not leave an enabled Reset … (0 enabled, 0 without a box)`. That sends the reader to Reset/rollBar instead of the selector.
- **Fix:** record `incCount` (the result of `inc.count()`). When it is not 1, push a separate problem: `expected exactly one Edges "+" ([data-dse-control="roll.edges.inc"]) on the extra roll strip, found N`. The check stays loud either way, which is why this is LOW.

### LOW-2 (follow-up, out of SC-512's scope): the feature ability's roll strip is never swept
`src/elements/feature/rollController.ts:110` mounts a second `rollBar` inside a feature ability, only after a Roll click with `rollingEnabled`. The gallery never does either. So that strip's buttons (`feature|…dse-rollbar__reset`, enabled and disabled, its steppers, its Roll button) are never compared with vs. without the host.
- **Evidence:** on base, my enabled-Reset leak probe (P2b) moved `feature-rolled-modified--steel-{dark,light}.png`, so those photographed shots show an enabled Reset. Yet the base sweep printed `113/678 OK`, and the boundary has no `feature|…rollbar…` key.
- **Fix:** the owner files a Backlog ticket. One option is a sweep-only extra section, `galleryExtra=feature` plus a per-section `rollingEnabled` pref, with a real Roll click. The risk is low today because the Reset rule `[data-dse-element] .dse-rollbar__reset` and the regrounding are not tied to one element. Do not fold this into SC-512.

### INFO-1: a redundant spread in a test
`test/dom/visual-harness/fixtures.test.ts:514` (and the two later `mountFromParams` calls) re-spread `galleryIds: ['roll']`, which the `gallery` constant at `:492` already carries. Harmless.

### INFO-2: `galleryExtra` is silently ignored outside gallery mode
`visual-harness/entry.ts:2463-2474`: with `stack=` or without `gallery=1`, `galleryExtra` is dropped without a warning. That is consistent with its doc comment, which says it is "appended AFTER every gallery section". Only the button sweep sends it. No change needed.

### INFO-3: dse-verify wording when the owner drafts it
The new `114 kinds / 684` happens to equal the stale SC-338 figure in the "Button host-leak sweep" bullet (`.claude/skills/dse-verify/SKILL.md` ~200-203, "re-measured 2026-09-24 (SC-338): 114 kinds / 684"). The draft should name the composition: 113 at c2758a2 plus the enabled `roll|…dse-rollbar__reset`. It should also say that `galleryExtra=roll` is sweep-only, so nobody reads the number as a regression to the old one.

## Code quality (probe 5)
- **Comments:** accurate against the source.
  - `rollBar.ts:263` is `resetButton.setDisabled(atDefaults())`.
  - `styles-source.css:15240` is the Reset's `padding-inline-start: 0`.
  - `shoot.mjs` ~2297 is the `tagButtons` first-node-per-key rule.
  - No CSS keys on `data-dse-harness-extra` (grep is empty).
- **Assertion messages:** they name the scheme, the kind key and the reason. LOW-1 is the one exception.
- **Dead code:** none.
- **Idempotence across dark/light:** each scheme is a fresh navigation, and the session store is in memory. The first-strip-disabled check would catch any state carried across a load. Green in both schemes in my run.
- `openRollModifiersForSweep` already handles two strips: its `header.first()` loop runs over the `aria-expanded="false"` headers.
- `harnessCompendiumModeFor` is unaffected, because `roll/default` is already in the full gallery's set.
- The commit carries no AI trailer, per the user's global rule.

## Probes run (all logs under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc512-r2-review/`)

| # | What | Tree | Result | Log |
|---|---|---|---|---|
| P1 | `npm run shots` | reviewed worktree, 635b6df | rc 0; 592 PNGs; `button host-leak OK (114 … 684 …)`; boundary 12 = 10 focus-visible disabled (montage, negotiation, party stepper, roll stepper, **roll Reset `|disabled` ×2**) + 2 hover no hit point (initiative stamina); modal 228 with 6-record boundary; input 164; checkbox 60 | r2-shots-branch.log / .rc |
| P1b | freeze | same shots | `freeze OK (280/280 …)`, rc 0 | r2-freeze-branch.log / .rc |
| P1c | parity (last on the reviewed tree) | 635b6df | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 | r2-parity-branch.log / .rc |
| P3 | full shots on **base** c2758a2 (scratch worktree) + sha256 of all PNGs | c2758a2 | rc 0, `113 … 678`, same 12 records; **all 592 sha256 identical to the branch** | r2-scratch-base-c2758a2.log, r2-shots-base-c2758a2.sha256, r2-shots-branch.sha256 |
| P2b-base | control: base + a temporary rule `[data-dse-element] .dse-rollbar__reset:enabled { color: var(--text-color, var(--dse-fg)); }` (`--text-color` is set only by Obsidian's `button` rule, so this is a real leak on the enabled Reset only) | c2758a2 + mutation | rc 0, `113/678 OK`: **the leak is invisible on base**; only photographed shots `feature-rolled-modified--steel-{dark,light}` moved | r2-scratch-base-leakB.log / .tree |
| P2b | same mutation on the branch | 635b6df + mutation | rc 1, exactly 6 problems: `{dark,light}\|{rest,hover,focus-visible}\|roll\|dse-btn.dse-btn--ghost.dse-rollbar__reset: Obsidian's button rules change color …`; nothing on `\|disabled` | r2-scratch-branch-leakB.log / .tree |
| P2a | Reset never enables (`rollBar.ts:263` → `setDisabled(true)`) | 635b6df + mutation | rc 1: per scheme "did not leave an enabled Reset … (0 enabled, 0 without a box)" + "the sweep tagged no `roll\|…reset` button" | r2-scratch-branch-resetNeverEnables.log / .tree |
| P2c | swap regression: the click goes to the FIRST strip's Edges "+" | 635b6df + mutation | rc 1: per scheme "did not leave an enabled Reset" + "the gallery's own roll strip must keep its Reset disabled (1 found, 1 enabled)". The key-presence check alone would pass here, because both keys still exist; the strip-specific checks are what catch it | r2-scratch-branch-swapFirstStrip.log / .tree |
| P4 | jest (clean scratch at 635b6df, no stale main.js) | 635b6df | rc 0; `Tests: 3 skipped, 6060 passed, 6063`; `Suites: 1 skipped, 245 passed, 245 of 246`. The 2 extra skips are `token-coverage.test.ts`'s `workspaceMapAvailable` block (the scratch path sits outside the workspace layout): 6060 + 2 = 6062 / 1 skipped, which equals r1's count | r2-jest-scratch.log / .tree |
| P4b | tsc (incl. `-p e2e`; tsconfig includes `**/*.ts`, so it covers test/ and visual-harness/) + lint | 635b6df | both rc 0, clean | r2-tsc-scratch.log, r2-lint-scratch.log |
| P4c | importers of `visual-harness/entry.ts` | — | only `test/dom/visual-harness/fixtures.test.ts`, `test/dom/framework/chromeRollout.test.ts` and `visual-harness/esbuild.mjs`. `obsidian-lifecycle.mjs` and `e2e/` do not import it (they build `main.ts`), so lifecycle 37/37 and e2e 123/123 from r1 stand without a re-run. `galleryExtra` appears only in entry.ts, shoot.mjs:2559 and the new tests; no capture, camera or docs-shots URL sends it | grep |

The mutations lived only in a scratch `git worktree` (`…/sc512-r2-review/dse-scratch`, node_modules symlinked). Each was reverted (`git checkout -- <file>`) before the next one. The worktree has since been removed: `git worktree remove`, with the node_modules symlink unlinked first so its target stayed intact.

The reviewed worktree is unchanged. `git status --porcelain` is the same before and after (`status-before.txt` = `status-after.txt`): the superproject still shows ` M draw-steel-elements` (pointer not yet bumped, as r1 left it) and the plugin is clean at 635b6df. The only side effect is that my shots and parity runs regenerated the gitignored `visual-harness/shots/`, parity report and bundle there, all byte-identical to base.
