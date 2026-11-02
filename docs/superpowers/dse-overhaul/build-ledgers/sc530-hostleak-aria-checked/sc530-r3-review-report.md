# SC-530 r3: independent adversarial review (orchestration:reviewer a0c4522cdcb4100bf)

## Executive summary
1. **Verdict: LAND-READY.** Findings: 0 HIGH, 0 MED, 2 LOW (jest seam gaps; the shots gate covers them, so neither blocks landing), 5 INFO.
2. dse `sc530-hostleak-aria-checked` @ **2388872d** on **ad018cda**. The diff touches only `visual-harness/shoot.mjs` and `test/dom/visual-harness/fixtures.test.ts`; there is no `src/` change. Built `main.js` a37fbb6f… and `styles.css` ae45354b… are byte-identical to a clean `git archive ad018cda` build.
3. origin/develop has moved to **88cb7db9** (SC-539, e2e/* only). Its files do not overlap the branch's, and `git merge-tree` shows 0 conflicts.
4. Key change, measured with base and head `tagButtons` on the same DOM (gallery + 10 modal scenarios, dark and light): **0 lost, 0 renamed, 0 first nodes moved.** There are 4 new kinds per scheme. 22 nodes changed key, and every one is either `aria-checked="true"` or inside `.dse-track--vertical` (none for any other reason, none missed). The modal pass has no `aria-checked` node.
5. Head shots: rc 0, **592 PNGs sha256-identical** to r2's clean fb24f8a2 base (that list is also identical to r1's f81a277 base). Button **161 / 966**. Boundary **34 records, block text identical** to base. Modal 228, input 15/176, checkbox 7/116, prose 106 [212]. Freeze **280/280**.
6. tsc 0, lint 0, jest **6249 passed / 1 skipped / 249 of 250** (= 6245 + 4).
7. Can-fail probes on the head, each rc 1 naming only the right kind: checked tier row (18 lines, `negotiation|dse-pr__row|checked`); vertical idle seal (18 lines, `negotiation|dse-track__slot|in:track--vertical`); vertical current seal (18 lines, `…|checked|in:track--vertical`); horizontal current seal (6 lines, `negotiation|dse-track__slot|checked`); tier click removed (named SC-527 reached and SC-530 tagged lines). A broadened `|checked` predicate is also caught (SC-512/513/527 named lines).
8. Jest break-proof, my own breaks: 2 of 6 one-line breaks fail jest. 4 pass, and the shots sweep catches 2 of those 4. See LOW-1 and LOW-2.
9. SC-526 simulation (Recoveries popover opened last): +2 popover kinds at both base and head, and SC-530 is unchanged (+4, 0 renamed/moved). The popover has no `aria-checked` node and no track. No interaction.

## Findings

### HIGH
None.

### MED
None.

### LOW-1: the jest test "no existing kind is renamed" does not test that claim
- Where: `test/dom/visual-harness/fixtures.test.ts:763-774`.
- The test checks two key strings: `negotiation|dse-pr__row` and `negotiation|dse-track__slot`. It also checks that no key contains `aria-checked` and that `|in:track` keys have the right *shape*.
- Failure scenario K1: change `shoot.mjs:2326` to `(n.getAttribute('aria-checked') !== 'false' ? '|checked' : '')`. This renames every button that has no `aria-checked`, i.e. almost every kind in the gallery.
  - jest: **130/130 pass** (`r3-brk-K1.log`).
  - The shots sweep catches it (probe Pi, rc 1): the SC-512/513/527 expected keys go missing.
- Failure scenario K8: change `shoot.mjs:2334` to apply the suffix inside `.dse-track--horizontal` instead of vertical.
  - jest: **pass** (`r3-brk-K8.log`). Shots: also pass, because all 4 SC530_EXPECT keys still exist.
  - Effect: the existing kind `negotiation|dse-track__slot` silently moves its first node from Patience 0 to Interest 5. That is exactly the "first node moved" the owner ruling forbids, and nothing catches it.
- Prescribed fix (test only, one assertion in test 3): over every node `tagButtons` tagged (`[data-dse-hostleak]`), assert both of these:
  - `key.includes('|checked') === (node.getAttribute('aria-checked') === 'true')`
  - `key.endsWith('|in:track--vertical') === !!node.closest('.dse-track--vertical')`

  Optionally also assert that the node tagged `negotiation|dse-track__slot` is inside `.dse-track--horizontal`. Both K1 and K8 then fail.

### LOW-2: the jest seam does not test `assertSc530Tagged`'s body or the new `reached` selector
- Where: `visual-harness/shoot.mjs:3076-3082` and `:2991-2992`; tests at `fixtures.test.ts:776-783`.
- Failure scenario K7: make the body `if (false && !keys.includes(want))`. jest passes. Shots also pass, because nothing is missing at the head.
- Failure scenario K5: delete the line `'button.dse-pr__row[role="radio"][aria-checked="true"]',` from SC527_STATES' `reached` list. jest passes. Shots still name the miss through `assertSc530Tagged` (the noclick probe Pd shows both lines).
- Today the shots can-fail probes (Pd) are the only proof that these lines work. This is the same shape as SC-527's `assertSc527Tagged`, which is not jest-tested either, so it is consistent with existing practice.
- Prescribed fix (optional): extract `assertSc530Tagged` the same way the test already extracts `tagButtons`. Call it with `[]` and expect 4 problems; call it with SC530_EXPECT and expect 0. Not a landing blocker.

### INFO-1: lint does not cover the diff
`npm run lint` is `eslint src main.ts e2e`. `shoot.mjs` and `test/` are outside it, so "lint 0" says nothing about this change. ts-jest compiles the test file, and jest passes.

### INFO-2: two comment wordings are slightly overstated
- `shoot.mjs:2329-2330` says vertical seals set width/padding/border/… "none of which a horizontal seal has". In fact `.dse-track--horizontal .dse-track__slot` sets its own `width`/`height`/`border-radius`. The point stands (the own-box declarations differ); only the wording overstates it. Suggested text: "which a horizontal seal sets differently".
- `shoot.mjs:2322-2325`, "no rule tells `false` from an absent attribute": `.dse-pr__row[aria-checked]:focus-visible` is a presence rule. The statement holds in practice only because every swept `button.dse-pr__row` carries the attribute (r1 §2).
- Both are cosmetic.

### INFO-3: other uncompared variants in the same family (beyond the ticket; no action needed)
Inventory of variants that share a kind with its first node:
- `negotiation|dse-pr__row`: first node is the low-tier first-child row; 9 mid/high/crit rows are never compared.
- `…|in:track--vertical`: first node is the `data-edge=first` seal; 3 `data-edge=last` seals are never compared.
- `negotiation|dse-track__slot`: first node is a `fill=floor` seal; the `on`/`spent`/`last` seals are never compared.

Host-only probes on these variants all stay **rc 0** at the head:
- Pf: vertical `[data-edge=last]`
- Pg: `button.dse-pr__row:not(:first-child)`
- Pj: horizontal `[data-fill=spent]`

Why this needs no action: the pinned host model's highest specificity is (0,1,1) (`button:not(.clickable-icon)`, `button[disabled]`). Each variant either declares nothing on its own box (`data-fill`: only `.dse-track__mark` descendants), or declares at equal or higher specificity than its sampled twin (`[data-edge=last]` at (0,3,0); non-first rows take `border-top` at (0,3,0)). So no real Obsidian `button` rule can leak onto a variant without also leaking onto the sampled node. A Backlog item makes sense only if the owner wants the r1 "hypothetical host rule" standard applied family-wide (it would add `data-edge`/`:first-child` context to the key).

### INFO-4: SC-526 rebase risk is low
- SC-526's region, the end of `mountClickRevealedForSweep` (`shoot.mjs:2869-2934`), plus `SC513_PREFS`/`SC513_EXPECT` (`:2781-2800`), does not overlap any SC-530 hunk.
- The one textual risk: SC-530's comment hunk (`:2956-2958`) sits 2 lines above the sentence "Runs BEFORE `mountClickRevealedForSweep` on purpose: SC-526 will add the Recoveries popover…" (`:2960`). SC-526 will probably reword that sentence, which could give a trivial 3-line-context conflict.
- Behaviour: the simulation (`r3-inv526.cmp.txt`) shows popover kinds `hero|dse-stamina-rec__pop-btn` and `hero|dse-stamina-rec__pop-cb` at both base and head. The SC-530 delta is unchanged, and there are no `aria-checked` nodes in the popover (`RecoveriesStrip.ts:203-215`: plain buttons).

### INFO-5: develop moved
origin/develop is now 88cb7db9 (SC-539: `e2e/README.md`, `e2e/run.mjs`, `e2e/x11-pointer.mjs`). It does not overlap the branch, and `git merge-tree` shows 0 conflicts. Lifecycle and e2e are carried, because the build is byte-identical to ad018cda and SC-539 changes no plugin source.

## Probes and measurements

| # | what | result | evidence |
|---|---|---|---|
| state | start: dse `git status --porcelain` empty; superproject ` M draw-steel-elements`. End: the same. HEAD 2388872d throughout | ok | — |
| 1 | diff `ad018cda..2388872d` | 2 files (+102/−3): shoot.mjs, fixtures.test.ts; 0 `src/` | — |
| 1 | build identity (clean `git archive ad018cda` export vs head worktree) | main.js a37fbb6f…c133c24 ==; styles.css ae45354b…ad5b0 == | `r3-build.sha256`, `r3-build.log` |
| 2 | base vs head `tagButtons` on one DOM, 22 runs (gallery + 10 modals × dark/light) | gallery 157→161, 0 lost / 0 renamed / 0 moved, 22 changed nodes all checked/vertical, 0 bad; modals 0 change | `r3-inv.json`, `r3-cmp.txt` |
| 2 | new kinds (both schemes) | `negotiation\|dse-track__slot\|checked` #153 Patience 3; `…\|in:track--vertical` #156 Interest 5; `…\|checked\|in:track--vertical` #158 Interest 3; `negotiation\|dse-pr__row\|checked` #411 sec 38 "≤11 −1 Patience chosen" | `r3-cmp.txt` |
| 4 | full head shots (660 s, load < 1) | rc 0, 592, 0 FAIL, 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212] | `r3-shots-head.{log,sha256,rc}` |
| 4 | PNGs vs r2 clean fb24f8a2 base (`r2-shots-base.sha256`, status and diff empty; == r1 f81a277 base) | sha256 list byte-identical | `cmp` |
| 4 | boundary block vs base | identical (34 records) | `r3-boundary-head.txt`, `r3-boundary-r2base.txt` |
| 4 | freeze | `freeze OK (280/280 …)` | `r3-freeze.log` |
| 4 | tsc / lint | rc 0 / rc 0 | `r3-tsc.log`, `r3-lint.log` |
| 4 | jest | 6249 / 1 skipped / 249 of 250, rc 0 | `r3-jest-full.log` |
| 4 | break-proofs (`fixtures.test.ts`, 130 tests) | K1 broadened predicate: PASS (LOW-1). K2 `\|checked` removed: FAIL 1. K4 call removed: FAIL 1. K5 reached selector removed: PASS (LOW-2). K7 vacuous assert: PASS (LOW-2). K8 suffix on horizontal: PASS (LOW-1) | `r3-brk-K*.{diff,log,rc,after}` |
| 3 | probe harness: fast path (probe-only edit runs just `assertBtnHostLeak` + `assertModalBtnHostLeak` after the manifest loads), validated P0 on clean head | rc 0, 161/966, boundary identical, modal 228 | `r3-probe-P0.*` |
| 3 | Pa `[aria-checked=true].dse-pr__row` padding | rc 1, 18 lines, all `negotiation\|dse-pr__row\|checked` | `r3-probe-Pa.*` |
| 3 | Pb vertical idle seal | rc 1, 18, all `…\|in:track--vertical` | `r3-probe-Pb.*` |
| 3 | Pc vertical current seal | rc 1, 18, all `…\|checked\|in:track--vertical` | `r3-probe-Pc.*` |
| 3 | Pe horizontal current seal | rc 1, 6, all `negotiation\|dse-track__slot\|checked` | `r3-probe-Pe.*` |
| 3 | Pd tier click `['.dse-pr__row', 0]` removed | rc 1: SC-527 reached unmet (Complete Argument + the SC-530 checked row selector) and the tagged-no lines for `negotiation\|dse-btn.dse-btn--accent` and `negotiation\|dse-pr__row\|checked`, dark and light | `r3-probe-Pd.*` |
| 3 | Pi broadened `\|checked` predicate | rc 1 (SC-512/513/527 named misses) | `r3-probe-Pi.*` |
| 3 | Pf / Pg / Pj structural variants | rc 0 (INFO-3) | `r3-probe-P{f,g,j}.*` |
| 3 | `mixed` | 0 producers in `src/` (only `track.ts:111` / `powerRollPanel.ts:175` write `aria-checked`, String(bool)); 0 `[aria-checked]` outside the swept selector; 48 swept (7 true / 41 false) | `r3-cmp.txt` |
| 5 | SC-526 simulation (pref `staminaRecoveryPopover:true`, pips click after `mountClickRevealedForSweep`) | base 159 / head 163; SC-530 +4 unchanged, 0 renamed/moved; popover kinds have no `aria-checked` | `r3-inv526.cmp.txt`, `r3-inv526.json` |
| 6 | scope | no `staminaRecoveryPopover`/pips/popover mount touched; the comments cite SC-530 | diff |

All evidence is in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc530-r3-a0c4522cdcb4100bf/`. Scripts: `r3shots.sh`, `r3probe.sh`, `r3brk.sh`, `r3jest.sh`, `r3run.sh`, `r3build.sh`, `r3inv.sh`, `r3-inv.mjs`, `r3-extract.mjs`, `r3-cmp.py`, `r3inv526.sh`, `r3-inv526.mjs`, `r3sum.sh`. Every probe and break was reverted with `git checkout HEAD -- visual-harness/shoot.mjs`, and each one's `.after` status is empty. The shots dir is still the head run's (sha list re-verified at the end).

## r4 scoped re-review (reviewer a0c4522cdcb4100bf, 2026-11-02)
**Verdict: LAND-READY.** 0 new findings, and LOW-1, LOW-2 and INFO-2 are folded as ruled.
- The rebase changed nothing: `range-diff` shows the 3 reviewed commits are `=`.
- 97284051 is test-only plus comment-only in shoot.mjs.
- Breaks K1, K8, K7 and K5 each now fail jest (rc 1).
- jest 6252 / 1 / 249 of 250, tsc rc 0. `main.js` a37fbb6f… and `styles.css` ae45354b… are identical to a clean 88cb7db9 build.

### Checks
| # | check | result |
|---|---|---|
| state | start and end: dse `status --porcelain` empty; superproject ` M draw-steel-elements`; HEAD 97284051; origin/develop 88cb7db9 | ok |
| 1 | `git range-diff ad018cda..2388872d 88cb7db9..97284051` | 2831b6c6 = c59c4882, a0000b88 = f9bdb873, 2388872d = 13e5d0c2 (all `=`); 97284051 is the only new commit. `git diff 2388872d 97284051 -- visual-harness test src` equals 97284051's own diff (only SC-539's `e2e/*` lies between) |
| 2 | 97284051 content | fixtures.test.ts +38, adding 3 tests. (a) LOW-1: the per-node invariants over every `[data-dse-hostleak]` node (`\|checked` iff `aria-checked="true"`; `\|in:track--vertical` iff `closest('.dse-track--vertical')`), plus the optional assertion that the node tagged `negotiation\|dse-track__slot` is inside `.dse-track--horizontal`; not vacuous (`nodes.length > 0`). (b) LOW-2: `assertSc530Tagged` is extracted from the shoot.mjs source; `[]` gives 4 problems, each naming its key; `SC530_EXPECT` gives 0. (c) LOW-2: `SC527_STATES[1].reached` contains the checked-tier-row selector. shoot.mjs +4/−2 = the 2 INFO-2 rewordings, as ruled; 0 non-comment lines changed, so no shots re-run |
| 3 | breaks on the head (`r3brk.sh`, each reverted, `.after` empty) | K1 broadened `\|checked`: rc 1 (per-node invariant test). K8 suffix on horizontal: rc 1 (per-node invariant test). K7 vacuous `assertSc530Tagged`: rc 1 (extraction test). K5 reached selector removed: rc 1 (reached test). Each run: 1 failed / 132 passed / 133 |
| 4 | jest (full) / tsc | 6252 passed / 1 skipped / 249 of 250, rc 0 / rc 0 |
| 5 | build identity (clean `git archive 88cb7db9` export vs the head worktree) | main.js a37fbb6f…c133c24 ==, styles.css ae45354b…ad5b0 ==; build rc 0 0 |

### Evidence
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc530-r3-a0c4522cdcb4100bf/`:
- Breaks on the r4 head: `r3-brk-{K1,K8,K7,K5}.{diff,log,rc,after}`.
- The r3 runs of those same breaks on 2388872d were moved to `r4/r3-head2388-brk-{K1,K8,K7,K5}.*`; the r3 table above refers to them.
- jest: `r3-jest-r4full.{log,rc,diff}`. tsc: `r3-r4tsc.{log,rc}`.
- Build: `r4/r4-build.{sha256,log,rc,head}`, script `r4build.sh`.
