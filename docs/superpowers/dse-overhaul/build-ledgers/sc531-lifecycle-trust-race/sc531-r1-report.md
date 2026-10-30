# SC-531 r1 report

## Executive summary
- STATUS: DONE. dse branch `sc531-lifecycle-trust-race`, final sha `4deb8cfd725cd372c5dd1ba361617c12b06ba5dd` (one commit on `develop` @ `4f73043`; origin/develop still `4f73043`, no rebase). Not pushed.
- Diff touches only `visual-harness/obsidian-lifecycle.mjs` (+16/-1) and `e2e/driver/recorders.ts` (+9/-1); no plugin byte change.
- Gates: tsc clean; lint clean; jest 6152 passed / 2 skipped / 248 of 249 suites (fresh worktree, no shots cache: expected one fewer passed, 2 skipped); lifecycle 20/20 + 21/21 = 41/41 ok, 0 failed (union of 41 distinct ids); e2e `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, exit 0.
- Anti-vacuity probe (jsdom): 20/20 checks as expected. OLD throws the exact TypeError; NEW resolves, one observer, clicks the synthetic trust dialog.
- Root-cause probe: NOT reproduced in 5 launches. Body was present and the execution context stable (no context created/destroyed/navigation after first attach) in all 5.

## Diff summary
- `visual-harness/obsidian-lifecycle.mjs:477-489` `AUTO_DISMISS_TRUST_DIALOG`: `(() =>` -> `(async () =>`; after the first idempotency guard, SC-531 comment + `while (!(document.body instanceof Node))` poll (25 ms, bound 20000 ms, throws `trust-dialog observer: document.body never became a Node within 20 s (SC-531)`), then a second `if (window.__lcTrustObserver) return true;` (a concurrent install won while waiting). The rest of the string (dismiss, observer, one-shot scan) is unchanged. The explanatory block above the constant is untouched.
- `visual-harness/obsidian-lifecycle.mjs:~3515-3518` `main()`: second `await t.ev(AUTO_DISMISS_TRUST_DIALOG);` right after the `layoutReady` waitFor, with an SC-531 comment.
- `e2e/driver/recorders.ts:46-56`: same in-page wait in the e2e copy (flag `__dseTrustObserver`); `installRecorders` untouched.
- `t.ev` (lifecycle `makeHarness`, line ~522) already calls `Runtime.evaluate` with `awaitPromise: true`; e2e `ev` (`e2e/driver/page.ts:10`) too. Neither changed. A thrown in-page error surfaces as `page eval failed: Error: ...` -> exit 2 as before.
- Design note: the idempotency flag is now set only after the body exists. In the OLD string the flag (`window.__lcTrustObserver = new MutationObserver(...)`) was assigned BEFORE `observe(null)` threw, so the OLD string left a flag on a dead observer and a plain retry of the OLD string would have returned true without observing (probe row 2 below). That is why a "retry the eval" fix on the OLD string would not have worked and why the wait lives inside the string.

## Anti-vacuity probe (jsdom, scratch)
Script `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc531-r1-impl/sc531-antivacuity-probe.cjs`, output `.../sc531-antivacuity-probe.log`. It extracts the constant text from `4f73043` (OLD) and the working tree (NEW) for both files, evals in a jsdom window whose `document.body` is removed at install and re-attached at ~200 ms; a counting `MutationObserver` subclass counts constructions and valid/null `observe` targets.
- OLD (lifecycle and e2e): throws `Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.`; 0 valid observe calls, 1 null call, flag left set (`__lcTrustObserver` / `__dseTrustObserver` = true).
- NEW (lifecycle and e2e): resolves `true`; constructed 1 / observed 1; a synthetic `.modal-container > .modal.mod-trust-folder .modal-header-button` appended after install is clicked exactly once; evaluated twice sequentially -> 1 observer; two evals racing the missing body -> 1 observer; body present at install -> resolves, 1 observer; a dialog already open at install -> clicked once by the one-shot scan; body never appears -> throws the SC-531 timeout message (bound shortened 20000 -> 300 ms by string replace for the probe; observed 301-303 ms; shipped bound is 20 s).
- Summary line: `PROBE SUMMARY: 20/20 checks as expected, 0 unexpected`.

## Root-cause probe (real Obsidian 1.15.0, 5 launches, scratch)
Scratch copy of the lifecycle harness `.../sc531-r1-impl/sc531-lifecycle-rootcause-probe.mjs` (start-up block replaced by a CDP observer: `Page.enable` + `Runtime.enable`, logs `executionContextCreated/Destroyed/Cleared`, `Page.frameNavigated/frameStartedLoading/frameStoppedLoading/domContentEventFired/loadEventFired/navigatedWithinDocument`, and polls every 10 ms `{body, body instanceof Node, readyState, per-document mark in window, href, layoutReady}` from first attach until layoutReady + 3 s, then skips scenarios). Runner `.../sc531-rootcause-run.sh`; logs `.../sc531-rootcause-launch{1..5}.log`; port 9291.
- 5/5 launches: attach at +62..+321 ms; exactly one `executionContextCreated` (id 1, replayed by `Runtime.enable`), no `executionContextDestroyed/Cleared`, no `frameNavigated`, the per-document `mark` never changed, `document.body` was a Node at the first poll in every launch (launch 5 attached while `readyState` was `interactive`: body already present). layoutReady at +520..+820 ms. So no context replacement and no body-less moment after attach was seen: non-reproduction. Caveat: `Runtime.enable` and the 10 ms polling are themselves a perturbation vs. the real harness (which does a single `waitFor` then an eval); the race is rare (one in several dozen runs) and was not hit. Hypothesis stays "a document/context replaced between the two evals", unconfirmed.

## Gates (final commit `4deb8cf`)
Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc531-r1-impl/`:
- tsc (`tsc --noEmit && tsc --noEmit -p e2e`): clean, rc 0 - `sc531-gate-tsc.log`
- lint (`eslint src main.ts e2e`): clean, rc 0 - `sc531-gate-lint.log`
- jest (after `rm -f main.js styles.css`): `Tests: 2 skipped, 6152 passed, 6154 total`; `Test Suites: 1 skipped, 248 passed, 248 of 249 total`; rc 0 - `sc531-gate-jest.log`
- lifecycle, `DSE_LIFECYCLE_PORT=9291`, two `--only` halves: A `done: 20/20 ok, 0 failed` (`sc531-gate-lc-A.log`), B `done: 21/21 ok, 0 failed` (`sc531-gate-lc-B.log`); union = 41 distinct ids (A: G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8; B: G-S9a G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40 G-S45 G-S44 G-S42 G-S50), derived from the 41 `id: '...'` entries in the harness; both rc 0
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, rc 0 - `sc531-gate-e2e.log`
- `git diff --stat 4f73043..HEAD`: only the two files above (25 insertions, 2 deletions).
- Other logs: `sc531-npmci.log` (fresh worktree needed `npm ci`; no `node_modules` existed), `sc531-build.log`.

## Drive-by fixes:
none.

## Follow-ups:
- The lifecycle `PAGE_HELPERS` and e2e `PAGE_HELPERS` (`recorders.ts:30`, `.observe(document.body, ...)`) also observe `document.body` unguarded; both run after the layoutReady waits so they are behind the same wait the trust observer now has. Not touched (out of scope; the same one-line in-page wait would harden them if the race is ever seen there).
- The root cause of the original one-off is unconfirmed (no reproduction in 5 launches). If it recurs, the main() re-assert and the in-page wait cover the context-replacement and body-less cases; a recurrence with the new code would surface as the SC-531 timeout message or as a clean pass.
- Worktree note: the fresh worktree has no `node_modules`; `npm ci` (done, rc 0) is needed before any gate. `npm ci` printed audit warnings only.
