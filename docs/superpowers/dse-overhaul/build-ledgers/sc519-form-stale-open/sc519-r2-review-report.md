# SC-519 r2 independent review report

## Executive summary
- **Verdict: LAND-READY.** No HIGH. 1 MEDIUM (Live Preview: the form opened inside the debounce closes at once; NOT a regression, no data loss; owner to rule follow-up vs in-ticket), 2 LOW, 5 INFO.
- Reviewed dse `c2758a2..1e97599` (origin/develop still `c2758a2` after fetch), superproject `2bfd07d..9797d3c`. Branch left at `1e97599`, tree clean (before and after).
- Red/green: the 3 SC-519 jest files on c2758a2 source = 14 failed / 41 passed (7 formSaveRedraw + 1 hero + 6 view-level); on HEAD 55/55. G-S45 FAILs on a c2758a2 bundle (Reading view, click lost) and passes on HEAD.
- Mutations: 8 mutants, all caught by jest; the 4 behavioural ones (no await / no flush / flush only in Reading / no in-flight wait) also FAIL G-S45 in real Obsidian.
- Real-Obsidian probes (scratch scenarios, HEAD vs c2758a2): Reading, sidebar, ds-hero, double pencil during a held flush, no-pending, twins, two counters, flush failure (dropped / real EACCES / rejected), adoption off, Live Preview. Everything holds except Live Preview and adoption-off (M-1).
- The two KEPT owner rulings were probed: the sidebar `currentBody` change is right, and it fixes a worse bug than reported (at c2758a2 a sidebar form Save reverted an outside edit and a landed click). Flush failure matches the ruling only on the "dropped" branch (L-1).
- Gates on 1e97599 (this run): tsc clean · lint rc 0 · jest 6074 passed / 1 skipped / 245 of 246 · lifecycle 38/38 (G-S40 ok, G-S45 ok) · e2e 123/123 ok, 0 failed, 0 known-bug, 87/87 · shots 592 PNGs, 0 FAIL · jest after shots 6074 / 1 / 245 of 246 · freeze OK 280/280 · parity 0 gaps / 0 undeclared / 24 declared. All equal the r1 numbers.

## Findings

### M-1 (MEDIUM) Live Preview: the form opened inside the debounce opens and closes at once (also Reading view with `viewAdoption: false`)
- Where: `src/framework/view.ts:312-324` (`openAfterPendingWrite` opens once the write settles) + `src/framework/kit/managedModal.ts:172` (`owner.register(() => modal.close())`) + the Live Preview rebuild of a view's own write (no adoption in LP).
- Scenario (real Obsidian, probe P-LP phase A, HEAD): LP, counter at 3, Increase (debounce timer held at the hook), pencil. The flush writes 4, `open()` runs while the old view is still loaded, then CodeMirror rebuilds the widget (root replaced, claims 0 -> 0: LP does not adopt the view's own write), the old view unloads and the modal it owns closes. Measured: `modal opened 1, closed 1`, 0 forms open afterwards, disk 4, card 4, no Notice. The user sees the form flash and has to press the pencil again.
- Same in Reading view with the `viewAdoption` kill switch off (probe P-MISC NOADOPT on HEAD: opened 1, closed 1).
- Not a regression: at c2758a2 in LP the form opened at once from the stale body and closed by itself when the debounced write landed (probe P-LP phase B on the c2758a2 bundle: held write fired under the open form -> opened 1, closed 1). No data loss either way (at HEAD the click is on disk before the form exists).
- The r1 per-opener table ("Live Preview ... Yes by construction, same code path as Reading") is wrong: the code path is the same, but LP does not adopt the view's own write, so the owner of the form dies.
- Reachability: in LP the pencil cannot be reached with a mouse at all (INFO-1); only by keyboard (Tab to the pencil, Enter) inside the 400 ms window.
- Fix (owner's choice): (a) follow-up ticket: when the flushed write will rebuild the card (no adoption: LP, or `viewAdoption` off), hand the pending open to the successor view for the same block key (or own the form by something that outlives the rebuild and seed it after the write); or (b) in this ticket, at least scope the CHANGELOG entry (superproject `CHANGELOG.md`, SC-519 bullet) to "in Reading view and the sidebar". Recommend (a) + (b).

### L-1 (LOW) Flush failure: the ruled behaviour ("host Notice, then the form opens from the body on disk") holds only for the dropped-write branch
Probe P-FAIL on HEAD, real Obsidian, write held then pencil:
- DROPPED (host's "block changed on disk first" branch): Notice shown; form opens from the disk body (3); card keeps showing 4. Matches the ruling.
- REAL I/O failure (note file chmod 0444 on disk): no Notice at open, only `console.error: Draw Steel Elements: block write failed Error: EACCES`. The form opens from the CARD's content (4), not the disk (3), because `ReadingModeBlockHost` sets `knownBody = newSource` inside the `vault.process` callback (`src/framework/host/ReadingModeBlockHost.ts:609`) before Obsidian's disk write fails. Save then fails with the misleading Notice "the block changed on disk first" (knownBody is now ahead of the disk) and the form stays open. The r1 report's "knownBody is only advanced on a landed write" is not true for this branch.
- REJECTED before the callback (vault.process rejects, e.g. the file vanished): no Notice (console only); the form opens from the disk body (3); Save unchanged is a no-op write; card 4, disk 3: the click is lost with only a console error.
- Pre-existing class (SC-282 LOW-B made rejected writes console-only; knownBody-ahead-of-disk is SC-343), not made worse by SC-519.
- Fix: correct the doc comment at `src/framework/view.ts:309` ("If the flushed write fails the host has already said so (its own Notice)") to say a rejected write is only logged. Follow-up ticket: a rejected view write should show the dropped-write Notice (ElementView catch at `view.ts:385`), and `ReadingModeBlockHost.replaceSource` should restore `knownBody` when `vault.process` rejects after the callback ran.

### L-2 (LOW) G-S45 sidebar phase: a fixed 1000 ms settle before the step
- `visual-harness/obsidian-lifecycle.mjs:2702` `await sleep(1000); // the stamp's own rebuild of the panel settles` (copied from G-S40, `:2597`). It is not inside the race window (the debounce timer is held at a hook, which is the right technique), but it is a timed wait for Obsidian to finish rebuilding the panel after the anchor stamp; under load a slower rebuild lets the real Increase click land on a panel about to be replaced (held count 0 or a different root), a flake rather than a false green.
- Fix: replace with a hook/event wait, e.g. tag the panel root after `pinToSidebar` and wait until the sidebar leaf has had its post-stamp mount (MutationObserver on the leaf container for the new `[data-dse-element]` root, or the panel's remount counter), then proceed. Fold into G-S40 at the same time.

### INFO
- INFO-1 Live Preview: the chrome panel's pencil is not reachable with a mouse. While the panel is revealed (pointer-events auto), `document.elementFromPoint` at the pencil's centre returns the preceding `DIV.cm-line`; a real hover route from the card loses the reveal. Identical diagnostics on c2758a2, so pre-existing (SC-169 chrome in LP); my LP probes had to fall back to a DOM `.click()` on the pencil. Follow-up ticket.
- INFO-2 A second in-card click landing between the pencil and the form opening (a few ms while `vault.process` runs) is not waited for; the form opens with it pending (the SC-509 INFO-2 crossing in a tiny window). Not human-reachable. Hardening if wanted: in `openAfterPendingWrite`, re-settle while `hasPendingWrite()` before calling `open`.
- INFO-3 ds-hero: the form's Save re-serializes the definition (flow lists become block lists, `conditions: []` added). Pre-existing: same on c2758a2 with nothing pending (probe HERO-NOPEND). At c2758a2 with a pending write the stale unload flush happened to restore the original definition bytes (the INFO-2 crossing); at HEAD the form's own bytes stand and `surges: 2` is kept. Expected.
- INFO-4 Sidebar (KEEP ruling validated): at c2758a2 the panel form also ignored outside edits. Probe P-SB on c2758a2: after an outside edit Health -> Vigor the form showed Health; after a landed click (4) plus an outside edit elsewhere, the form showed 3 and Save wrote back `name: Health, current_value: 3`, reverting both. HEAD: Vigor, then 4 + Vigor, Save keeps both.
- INFO-5 Bookkeeping: superproject shows ` M draw-steel-elements` (pointer intentionally not bumped; the dispatcher lands). dse-verify SKILL.md CURRENT still reads 37/37 and stops at G-S40 (dispatcher to add G-S45 and 38/38 at landing, per the ledger).

## 1. Red / green
- Jest red: c2758a2 source + HEAD's `test/dom/framework/formSaveRedraw.test.ts`, `test/dom/elements/heroSheet.test.ts`, `test/dom/framework/element-view.test.ts`: `Tests: 14 failed, 41 passed, 55 total`. Failing: the 7 formSaveRedraw SC-519 tests (Reading 5: Increase/pencil/Save, flush is the view's own write, two pencil clicks, text above/below, hand edit; sidebar 2), the hero SC-519 test, and the 6 view-level `openAfterPendingWrite` tests (API absent). Passing controls include "no pending write" and "two counters".
- Jest green on HEAD: `Tests: 55 passed, 55 total`.
- G-S45 vs c2758a2 bundle: `G-S45 FAIL: Reading view (the click was lost: the form started from "name: Health\ncurrent_value: 3 ...")`. On HEAD: ok (also in the full 38/38 run).

## 2. Mutation check (each in its own scratch tree from 1e97599)
| Mutant | Change | jest (3 SC-519 files) | G-S45 (real Obsidian) |
|---|---|---|---|
| noawait | flush, then `open()` synchronously | 6 fail (view-level x5, sidebar 1, two-pencil 1) | FAIL Reading (click lost; the note ends at 3) |
| noflush | `settlePendingWrite` without `flushPersist()` | 9 fail | FAIL Reading |
| noinflight | flush, resolve after one microtask without awaiting the write | 1 fail ("a write already in flight is waited for too") | FAIL Reading |
| readingonly | flush only for `ReadingModeBlockHost`; sidebar opens at once (host body fix kept) | 1 fail (sidebar Increase/pencil/Save) | FAIL Sidebar |
| noguard | drop `formOpenWaiting` | 2 fail | not run |
| nounload | open even after unload | 1 fail | not run |
| herorevert | hero opens without flushing | 1 fail (hero) | not run |
| sourcebody | sidebar `currentBody` back to `source` | 2 fail (both sidebar) | (r1 already showed FAIL Sidebar) |

Note: the jest Reading test alone does not catch `noawait` (the jest vault fake runs the process callback synchronously); the view-level test and G-S45 do.

## 3. Real-Obsidian probes (scratch copy of the harness; HEAD bundle vs c2758a2 bundle)
| Probe | HEAD | c2758a2 |
|---|---|---|
| Reading (G-S45) | 4 kept, same root, claims +1 | click lost |
| Sidebar (G-S45, P-SB) | 4 kept; outside edit followed | stale (G-S45) and outside edit reverted (P-SB) |
| Live Preview, pending (P-LP A/B) | form opens then closes (M-1); disk 4 | form opens stale; closes when the debounce lands |
| Live Preview, nothing pending (P-LP C) | opens inside the click dispatch, 0 `vault.process` | same |
| Live Preview, form Save with a change (P-LP D) | card redraws (Wounds), outside untouched | same |
| ds-hero Edit definition, pending surge (P-MISC HERO) | flushed before open (held 0 at open), disk `surges: 2` | `surges: 2` kept too (model-seeded), via the stale unload flush |
| Double pencil while the flush is held at `vault.process` (P-DBL) | 0 forms while held, 1 `vault.process` call, 1 form after release, Save keeps 4 | n/a |
| No pending write (P-MISC NOPEND) | form open when the click finished dispatching, 0 `vault.process`, 0 modify, note unchanged | same |
| Identical twins, write + pencil on twin 2 (P-MISC TWINS) | values 3,4; twin 1 untouched; outside untouched | 3,3 (click lost) |
| Two counters, A pending, pencil on B (P-MISC TWO) | B opens at once from B (7); A not flushed (still held); A lands 2 on its own timer; outside untouched | same |
| Adoption off, Reading (P-MISC NOADOPT) | form opens then closes (M-1) | form opens stale |
| Flush failure (P-FAIL) | see L-1 | n/a |

Text outside the block was byte-identical in every phase that saved (G-S45 and `outsideOk` in the probes). G-S40 ok in the full run.

## 4. Lifecycle authoring rule (G-S45)
The race is removed at a hook: a `window.setTimeout` wrapper captures the plugin's 400 ms debounce timer (exactly 1 held asserted), the note is asserted old at the pencil click (anti-vacuity), and 0 held at form open proves the flush. No timed delay is used to win the race. Remaining fixed waits: the sidebar settle (L-2) and harness-wide helpers (`t.open` 700 ms, `t.reset` 1000 ms, `realClick` 150 ms), which are pre-existing.

## 5. Persist / flush contract, adoption, other openers
- `flushPersist` change is additive: the same promise chain now returns `ok`/`false` and is tracked in `writesInFlight` (removed on settle). The `.catch` still swallows the rejection, so `write.then(delete)` cannot raise an unhandled rejection. `persistInFlight` and `hasPendingWrite()` unchanged; coalesced waiters still resolve with the same result. Unload flush unchanged (the `unloaded` flag is a second `register` callback). Dropped-write Notice and rate limit untouched (G-S5n ok in 38/38).
- Adoption: the flush carries `{ fromView: true }` (jest asserts it; G-S45 Reading measures claims +1 and the same root), so SC-509's split holds; a later form Save still redraws (jest + G-S40 ok).
- Openers of the form: the pipeline pencil (chrome item and standalone button, `pipeline.ts:589`) and ds-hero Edit definition (`hero/view.ts:259`); no other caller of `openFormEditor` in `src/`. FormModal.ts untouched.
- A write that never settles leaves `formOpenWaiting` true and the pencil inert for that view (theoretical; noted, no action).

## 6. Gates on 1e97599 (this run)
| Gate | Result |
|---|---|
| tsc (`tsc --noEmit && tsc --noEmit -p e2e`) | clean, rc 0 |
| lint | rc 0 (only the known `.eslintignore` warning) |
| jest (obsidian-app.css already cached) | 6074 passed / 1 skipped / 245 of 246 suites |
| lifecycle (port 9293) | `38/38 ok, 0 failed` |
| e2e | `123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` |
| shots | rc 0, 592 PNGs, 0 FAIL (ran over 600 s under load from other sessions' shots runs; waited on its PID) |
| jest after shots | 6074 passed / 1 skipped / 245 of 246 suites |
| freeze | `freeze OK (280/280 ...)`, rc 0 |
| parity (last) | rc 0, `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` |

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc519-r2-review-b/`)
- Red/green jest: `jest-red.log`, `jest-green.log`. Mutations: `mutate.py`, `muts.sh`, `mut-<name>.jest.log`, `mut-<name>/` (trees + bundles). G-S45 vs mutants: `run-mut-{noawait,noflush,readingonly,noinflight}.log`.
- Probes: `probe-helpers.mjs.txt`, `probe-scenarios.mjs.txt`, `splice.py` (spliced into the scratch copy `probe/visual-harness/obsidian-lifecycle.mjs` only). HEAD: `run-head1.log` (G-S45, P-DBL), `run-head2.log` (P-FAIL), `run-head3.log` (P-MISC incl. hero note text), `run-head4.log` (P-LP, P-SB). c2758a2 bundle: `run-base1.log` (G-S45 FAIL), `run-base2.log` (P-MISC incl. HERO-NOPEND), `run-base4.log` (P-LP), `run-base5.log` (P-SB).
- Gates: `g-{tsc,lint,jest1,lifecycle,e2e,shots,jest2,freeze,parity}.log` + `.rc`.
- Working-tree state: `status-{before,after}-{dse,super}.txt` and `head-{before,after}.txt` are identical (dse clean at 1e97599; superproject ` M draw-steel-elements` before and after). No git worktree, stash or branch change in the dse repo; probes ran from `git archive` exports.
