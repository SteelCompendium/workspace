# SC-531 r2 independent review report

## Executive summary
- **Verdict: APPROVE.** dse `4deb8cfd725cd372c5dd1ba361617c12b06ba5dd` on `develop` `4f73043`. `origin/develop` is still `4f73043` after a fetch. Working tree clean before and after.
- **Findings: 0 HIGH, 0 MEDIUM, 0 LOW, 4 INFO.** None blocks landing.
- **The race was reproduced in real Obsidian 1.15.0, which r1 could not do.** Sequence: `Page.reload`, then the harness's own `waitFor('!!document.body')`, then the install eval. The OLD string threw the exact ticket TypeError 6/48 times (1/12, then 5/36; all 5 in the 36-run sample at 0 ms delay). The NEW string failed 0/48. In all 48 NEW runs the observer flag was still there after `layoutReady`.
- Real-page probes, 11/11 as expected. OLD with no body throws the exact TypeError. NEW waits about 328 ms, installs one observer and dismisses a later dialog. Two NEW evals racing for the body install one observer. The timeout gives the SC-531 message, and when nothing catches it the harness exits **2**. The re-assert is a no-op while the observer is live and re-installs after a disconnect plus a deleted flag. A DSE modal is never clicked.
- jsdom probe (my own): 32/32 as expected, for both the lifecycle and e2e strings.
- Gates on `4deb8cf`: tsc clean, lint clean. jest **6152 passed / 2 skipped / 248 of 249 suites** (fresh worktree with no shots cache, as expected). lifecycle **20/20 + 21/21 = 41/41**. e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`**. Every rc is 0.
- SC-522 overlap: a 3-way merge of SC-522's uncommitted lifecycle edits onto `4deb8cf` gives the same single conflict as onto `4f73043`. That conflict is the scenarios-array append and is unrelated. SC-531 adds no conflicts.

## Scope check (brief item 1)
- `git diff --stat 4f73043..4deb8cf`: `e2e/driver/recorders.ts` +9/-1, `visual-harness/obsidian-lifecycle.mjs` +16/-1. That is all.
- Lifecycle hunks: `AUTO_DISMISS_TRUST_DIALOG` (lines 477-489, the async IIFE, the bounded in-page wait and the second guard), and `main()` start-up, which gains one `t.ev(AUTO_DISMISS_TRUST_DIALOG)` after the `layoutReady` waitFor (lines 3515-3518). Nothing else changed. No plugin bytes changed.
- SC-522 merge simulation, done on scratch copies only: base `71437da` (SC-522's HEAD), ours = SC-522's working-tree `obsidian-lifecycle.mjs`, theirs = `4f73043` and then `4deb8cf`. Each gives 1 conflict, and the two conflict hunks are identical apart from the file label. It is the SCENARIOS append at roughly 3184-3579, which already exists against develop. All three SC-531 hunks merge in cleanly at merged lines 489, 496 and 3688.

## The race and the fix, measured (brief items 2, 4, 5)
Real Obsidian probe: a scratch copy of the HEAD harness (repo path pinned). The probe block runs after the real start-up, which includes both SC-531 evals. Scenarios are skipped. Port 9293.

| # | Probe | Result |
|---|---|---|
| 1 | Observer present after the real start-up | `__lcTrustObserver instanceof MutationObserver` true |
| 2 | Re-eval while the observer is live | returns true, same object |
| 3 | Live observer vs a synthetic trust dialog (empty container first, filled 10 ms later) | clicked once |
| 4a | Control: disconnect and delete the flag, then add a dialog | not clicked |
| 4b | Re-assert eval | fresh observer; its one-shot scan dismisses the open dialog (1 click) |
| 4c | Fresh observer vs a new dialog | clicked once |
| 5 | OLD string with `document.body` removed | `page eval failed: TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.` (exact ticket text); flag left set |
| 6 | NEW string with the body removed and restored after 300 ms | waited 328 ms, resolved true, later dialog clicked once |
| 6b | Two concurrent NEW evals with the body absent (counting MO subclass) | both true, **1** observer constructed |
| 7 | NEW with the bound shortened to 500 ms, body never returns | `page eval failed: Error: trust-dialog observer: document.body never became a Node within 20 s (SC-531)` after 505 ms; flag not set |
| 8 | `.dse-modal` container whose text contains "trust the author" | not clicked |
| exit | Same as 7 but uncaught, inside `main()` | `OBSIDIAN-LIFECYCLE environment: Error: page eval failed: Error: trust-dialog observer: … (SC-531)`, **rc=2**; finally/cleanup ran, no orphan processes |
| 9 | Reload race: `Page.reload` → delay {0,0,5,10,20,40} ms → `waitFor('!!document.body')` → install eval, then `layoutReady` | run 1 (x12): OLD 1 TypeError / 11 ok, NEW 12 ok. Run 2 (x36): OLD **5 TypeError (all at 0 ms)** / 31 ok, NEW **36/36 ok, flag kept after layoutReady 36/36** |

Row 9 is the root-cause mechanism. A document load between the passing `waitFor` eval and the install eval sends the install eval into a new document that has not yet parsed `<body>`. This matches the comment at `obsidian-lifecycle.mjs:479-483`. The ledger's "unconfirmed root cause" can be narrowed to this: the mechanism is confirmed, but what triggers a reload or navigation during a real launch is still unknown.

jsdom probe (both files, OLD from `4f73043` vs NEW from HEAD): 32/32 as expected. It covers the following.
- OLD throws the exact TypeError, leaves its flag on a dead observer, and a plain retry returns true without observing. This confirms r1's point that a plain retry would not have been enough.
- NEW: one observer, which dismisses a later dialog. Sequential and 3-way concurrent evals each give one observer.
- The timeout rejects in about 303 ms with no flag left behind, and a later eval still installs.
- The re-assert after disconnect plus delete gives a fresh observer and clicks once. While the observer is live the re-assert keeps the same object and clicks once.
- DSE and plain modals are not clicked.

## `ev` awaits the promise (brief item 3)
- Lifecycle `makeHarness().ev` (`obsidian-lifecycle.mjs:521-525`): `Runtime.evaluate` with `awaitPromise: true`. A rejected promise becomes `exceptionDetails` and is re-thrown as `page eval failed: …`. That goes to `main().catch` (lines 3573-3580) and `process.exit(2)`, measured above.
- e2e `ev` (`e2e/driver/page.ts:7-17`): `awaitPromise: true`, same throw. Its only call site, `installRecorders` (`recorders.ts:72-76`), runs in the root mocha `before` hook (`session.ts:15-19`), after the "plugin loaded" waitFor. So the body is always present there and the new wait cannot loop.
- Hang analysis: the in-page bound is 20 s, and `cdp.call` defaults to a 30 s timeout (`obsidian-lifecycle.mjs:409-419`), so the SC-531 message always wins. The poll clears on success or on timeout. There is no unbounded wait. The dismissal logic is byte-identical to before.

## Findings

**HIGH:** none. **MEDIUM:** none. **LOW:** none.

**INFO-1: same-context body swap is not covered (pre-existing, not seen in Obsidian).**
- Where: `obsidian-lifecycle.mjs:478,489` and `recorders.ts:47,55`.
- Scenario: the install succeeds on body element B1, then the page replaces `<body>` with B2 in the same context. The observer now watches a detached B1. The flag is still set, so the post-`layoutReady` re-assert is a no-op and later trust dialogs are not dismissed. jsdom row H shows clicks=0. OLD behaves the same.
- Prescribed fix (optional, separate ticket only if it is ever seen): store the observed body (`window.__lcTrustBody = document.body`) and make the guard `if (window.__lcTrustObserver && window.__lcTrustBody === document.body) return true;`. Otherwise disconnect and re-install.

**INFO-2: a context torn down during the in-page wait is unmeasured.**
- Scenario: a second navigation while the NEW eval is waiting in a body-less document. `Runtime.evaluate` would most likely return a CDP error instead of `exceptionDetails`. `cdp.call` would reject with `Runtime.evaluate: <message>`, which still reaches `main().catch` and exit 2, but with a generic message instead of the SC-531 one.
- This needs two document loads inside the roughly 0-300 ms body-less window. It was not hit in 36 NEW reload runs. No fix needed.

**INFO-3: the 20 s in-page bound only works because it is below the 30 s `cdp.call` default.**
- Where: `obsidian-lifecycle.mjs:484` vs `:409`.
- Scenario: if someone raises the bound past 30 s, the CDP timeout fires first and the named message is lost (the exit is still 2).
- Prescribed fix (optional): a half-line comment beside `bodyDeadline` noting the coupling.

**INFO-4: the ledger can record the reproduction.**
- r1's "root cause unconfirmed (0/5)" can now read: "mechanism reproduced: a reload between the body waitFor and the install eval, OLD 6/48 TypeError, NEW 0/48; the real-launch trigger is still unknown".
- The r1 follow-up ruling to drop the `PAGE_HELPERS` guard still holds. `PAGE_HELPERS` runs after `layoutReady` plus the plugin-loaded waits, and the reload probe showed the body is parsed well before `layoutReady`.

## Gates (head `4deb8cf`, port 9293, one blocking foreground call each)
- tsc (`tsc --noEmit && tsc --noEmit -p e2e`): clean, GATE_RC=0
- lint (`eslint src main.ts e2e`): clean (only the pre-existing `.eslintignore` deprecation warning), GATE_RC=0
- jest (after `rm -f main.js styles.css`): `Tests: 2 skipped, 6152 passed, 6154 total`; `Test Suites: 1 skipped, 248 passed, 248 of 249 total`; GATE_RC=0. This is the expected fresh-worktree reading: no `visual-harness/dist/` shots cache, so one fewer pass and 2 skipped against CURRENT's 6153/1.
- lifecycle A (`--only` the 20 ids G-S7a…G-S8): `OBSIDIAN-LIFECYCLE done: 20/20 ok, 0 failed`, GATE_RC=0
- lifecycle B (`--only` the 21 ids G-S9a…G-S50): `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed`, GATE_RC=0. The union is the harness's 41 distinct `id:` entries.
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`, GATE_RC=0
- After the run: dse `git status --porcelain` is empty and HEAD is still `4deb8cf`. The worktree superproject shows only the unbumped `draw-steel-elements` pointer (4f73043 → 4deb8cf), which comes from r1's commit and has no dirty marker. No process on 9293, and no kept lifecycle temp dirs.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc531-r2-review/`)
- jsdom probe: `sc531-r2-jsdom-probe.cjs`, `sc531-r2-jsdom-run.sh`, `sc531-r2-jsdom-probe.log`
- Real-Obsidian probe: `sc531-r2-gen-real-probe.cjs`, `sc531-r2-real-probe-block.mjs.txt`, `sc531-r2-real-probe-block-v2.mjs.txt`, `sc531-r2-real-probe-harness.mjs`, `sc531-r2-real-probe-harness-v2.mjs`, `sc531-r2-real-probe-run.sh`, `sc531-r2-real-probe-reload-run.sh`, `sc531-r2-real-probe-gen.log`, `sc531-r2-real-probe-gen-v2.log`, `sc531-r2-real-probe-checks.log`, `sc531-r2-real-probe-exit.log`, `sc531-r2-real-probe-reload36.log`
- Merge simulation: `sc531-r2-merge-sim/` (`base-71437da.mjs`, `sc522-wt.mjs`, `develop-4f73043.mjs`, `sc531-4deb8cf.mjs`, `merged-vs-develop.mjs`, `merged-vs-sc531.mjs`)
- Gates: `sc531-r2-gate-{tsc,lint,jest,lcA,lcB,e2e}.sh` and `.log`
