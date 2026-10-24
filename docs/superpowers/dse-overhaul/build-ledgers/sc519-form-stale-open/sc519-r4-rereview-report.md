# SC-519 r4 scoped re-review (delta 1e97599..253aa5f, superproject 9797d3c..f0cd44b)

## Executive summary
- **Verdict: LAND-READY.** 0 HIGH / 0 MEDIUM / 0 LOW / 2 INFO. All three folds (M-1 CHANGELOG, L-1 comment, L-2 fixed wait) are correct; nothing else changed.
- Delta: dse 2 files (+27/-4): `src/framework/view.ts` (comment only), `visual-harness/obsidian-lifecycle.mjs` (pinToSidebar wait; both `sleep(1000)` removed). Superproject 1 file: `CHANGELOG.md` (+2/-2). origin/develop still c2758a2; HEAD 253aa5f.
- G-S40,G-S45 on 253aa5f: 3/3 runs, each 2/2 ok. A diagnostic copy shows the wait's condition reads real values (string cachedContent, loaded child, 1 panel, 1 modify) and holds on the first poll.
- Breaking the wait on purpose: never true (stamp `modify` not counted) gives G-S40 and G-S45 FAIL "timed out waiting for sidebar: the panel caught up with the anchor stamp"; always true (no wait) gives both ok on HEAD, and G-S45 still FAILs on a c2758a2 bundle. The SC-519 assertions do not depend on the wait.
- G-S45 (253aa5f harness) still FAILs on a c2758a2 bundle (Reading view, click lost), and FAILs in the Sidebar phase on a "flush only in Reading view" mutant bundle.
- Cleanup: deleted by literal path /tmp/dse-obsidian-lifecycle-{JZLZpk,8lyigx,jfAV0T,xRXzGA} and my own r4 FAIL dirs {28lbVy,IiBOzo,EKzPw3,eIliHk}. Tree unchanged before/after; no commits.

## Checks
1. **CHANGELOG** (`CHANGELOG.md`, SC-519 bullet under Unreleased): headline now "in Reading view and the sidebar, the block edit form ...", body ends "(Live Preview is not covered by this fix.)". Claims only Reading view and the sidebar. OK.
2. **view.ts comment** (`src/framework/view.ts:309-312`): "A write the host drops because the block changed on disk shows the host's dropped-write Notice; a disk failure (a read-only note) or a write rejected before it starts shows no Notice, only a console error, and with the former the host body can already be ahead of the disk (SC-524)." Matches my r2 P-FAIL measurements (DROP: Notice, form from disk; EACCES: console only, form from the card's content because knownBody was set in the callback; REJECTED: console only, form from disk). OK.
3. **pinToSidebar condition wait** (`visual-harness/obsidian-lifecycle.mjs:744-780`):
   - Not vacuous: v2 (the stamp's `modify` never counted) makes both scenarios time out at the wait (15 s), so the condition is evaluated and gates. v3 diagnostics: in G-S40 and G-S45 every clause reads a real value on the first poll: `{"mods":1,"host":true,"root":true,"loaded":true,"inPanel":true,"cacheType":"string","panels":1,"cacheEq":true}`; private field names (`view.panels`, `panel.host`, `host.lastMountedChild`, `host.cachedContent`) resolve.
   - Cannot pass falsely: with the wait removed (v1, condition `return true`) G-S40/G-S45 still pass on HEAD and G-S45 still FAILs on c2758a2. The wait only orders the steps; every SC-519 assertion (held-timer count, note old at the pencil, form body, note after Save, outside-block bytes) is independent of it. A late panel rebuild after the condition would fail those assertions loudly, not pass them.
   - Flakiness: `--only=G-S40,G-S45` on 253aa5f run 3 times, 3/3 rc 0, 2/2 ok each.
   - No fixed delay is left in the G-S40/G-S45 sidebar path (the two `sleep(1000)` lines are gone; the wait has a 15 s deadline, not a sleep).
4. **G-S45 red**: `G-S45 FAIL: Reading view (the click was lost: the form started from "name: Health\ncurrent_value: 3 ...")` on the c2758a2 bundle (also with the no-wait variant). Sidebar phase: FAIL on the r2 `readingonly` mutant bundle (`Sidebar (the click was lost ... _dse_anchor: d5b05a)`).
5. **Nothing else changed**: diff stat above; src change is comment-only (no code), so tsc/lint/jest/e2e/shots/freeze/parity were not re-run by me (the r3 fixer's tsc/lint/jest/lifecycle/e2e/parity numbers on 253aa5f match r2).

## INFO
- INFO-1 In the normal ordering the condition holds on the first poll (the stamp's `modify` arrives before the panel exists, as the fixer measured), so the wait only matters under load; it cannot observe the end of `SidebarPanel.handleExternalChange`'s async tail after a late `modify` (stated by the fixer). Acceptable: such a late rebuild fails G-S45 loudly.
- INFO-2 The condition reads `panels?.[0]`; if an earlier scenario ever left a sidebar panel for another note open, the wait would time out (loud), not pass. G-S40 and G-S45 both detach `dse-sidebar` leaves in their `finally`.

## Evidence (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc519-r4-rereview-b/`)
- `setup.sh`, `variant.py`, `run.sh`; trees `head/` (253aa5f export + bundle), `v1/`, `v2/`, `v3/` (harness variants only).
- HEAD x3: `run-head-1.log`, `run-head-2.log`, `run-head-3.log`. Diagnostics: `run-v3-diag.log`. Never-true: `run-v2-head.log`. No-wait: `run-v1-head.log`, `run-v1-base.log`. Red: `run-head-vs-base.log` (c2758a2 bundle = `../sc519-r2-review-b/base`), `run-head-vs-readingonly.log` (`../sc519-r2-review-b/mut-readingonly`).
- Tree state: `status-{before,after}-{dse,super}.txt` identical (dse clean; superproject ` M draw-steel-elements`).
