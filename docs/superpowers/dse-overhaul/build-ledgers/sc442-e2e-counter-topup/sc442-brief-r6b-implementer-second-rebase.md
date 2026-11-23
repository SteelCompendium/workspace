# SC-442 r6b — implementer addendum: develop moved to `957e4b11` (SC-672 landed); rebase again, CTR-W01 / CTR-W02 become plain tests, full battery

This extends `sc442-brief-r6-implementer-rebase.md`. Everything in that brief still applies
(context loading, hard rules, gate-running rules incl. the two corrections sent by message: never
read the 490 KB dse-verify SKILL.md whole; long gates are started from a script with a log + rc
file and waited on with `timeout 175 tail --pid=<pid> -f /dev/null`). A fresh worker picking this
up reads that brief first, then this one, then the ledger's "Resume 2026-11-23" section to its end.

Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/decisions.md`
dse submodule: `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup/draw-steel-elements`
(branch `sc442-e2e-counter-topup`; at this writing rebased on `8c08bce2`, head `5a170bb2`).

**You never call the tracker. You never push. No `src/` changes. No co-author / AI-attribution
trailers in commits.**

## 1. What changed

While you ran the battery on the `8c08bce2`-based head, SC-672 landed. dse `origin/develop` is now
`957e4b1135ea34355235ee541f1cc142701d3f0e`. That battery is superseded: let the gate that is
running right now finish (do not kill it), do NOT start further gates on the old head, and note in
your report which gates you measured on the `8c08bce2`-based head and their summary lines (useful
as a cross-check, not as land-ready evidence).

Relay from the SC-672 owner, verbatim: "SC-442 carries `knownBug('SC-672')` markers CTR-W01 and
CTR-W02. They must become plain tests when it rebases over this, or its run fails."

SC-672 put on develop: `e2e/specs/counter/counter-wrong-block.e2e.ts` (CTR-W03..W16), new Counter
fixtures including `e2e/vaults/shipped/Counter/empty-block.md` and `wrong-block.md` — **the same
two file names this branch adds, so expect add/add conflicts** — more `e2e/README.md` rows,
`src/model/Counter.ts`, `test/dom/elements/counter-wrong-block.test.ts`,
`test/unit/model/counter-wrong-block.test.ts`. An empty block is now a counter at 0; a non-map
block (`hello`, a list, a number) shows an error card and nothing is written.

## 2. The task

1. `git -C <dse> fetch origin`; confirm `origin/develop` is `957e4b1135ea34355235ee541f1cc142701d3f0e`
   (else STOP, NEEDS_CONTEXT with both shas). `git -C <dse> rebase 957e4b11`.
2. Resolve conflicts by these owner rulings (quoted from the ledger):

   > **Fixture conflicts (`empty-block.md`, `wrong-block.md`): develop's copy wins, byte for byte**
   > (SC-672's CTR-W03..W16 and its jest tests depend on them). Adapt this branch's tests to
   > develop's content. If a test here needs content develop's file lacks, add a NEW fixture with a
   > name that says what it is; never edit develop's two files.

   > **`e2e/README.md`: keep every row from both sides.**

   After the rebase, `git -C <dse> diff 957e4b11 HEAD -- e2e/vaults/shipped/Counter/empty-block.md e2e/vaults/shipped/Counter/wrong-block.md`
   must be empty. Any other conflict: resolve only if plainly additive on both sides; otherwise
   STOP, NEEDS_CONTEXT with the hunks.
3. The markers (ledger ruling, quoted):

   > **CTR-W01 / CTR-W02 → plain tests.** Remove `knownBug('SC-672')` / `failsWith` from both. Keep
   > each ruled assertion: W01 — the user's text is still in the note after the user tries a press
   > (a card with no button is fine); W02 — the card never shows a raw JavaScript error. Keep the
   > shared raw-JS-error check (r2 M-1) on both. Both must pass against the fixed product; if one
   > does not, do not weaken it — STOP, NEEDS_CONTEXT. Do not delete them as duplicates of
   > CTR-W03..W16.

   Sweep this branch's own files for text that still calls SC-672 an open bug (spec comments,
   `e2e/manifest/counter.ts` notes, `e2e/README.md` rows, the matrix and census test comments, the
   Counter fixtures this branch owns) and correct it. SC-672 is fixed on develop at `957e4b11`.
4. Other tests (ledger rulings, quoted):

   > **jsdom census `RENDERS` (r2 M-2):** `wrong-block` stays out of the list (an error card is not
   > a counter surface). No change needed for `empty-block` unless a test goes red.

   > **Matrix / census tests red after SC-672:** change a test to match the fixed product ONLY where
   > it had been written around B4 / B5 (non-map or empty block). Anything else red is a finding —
   > STOP, NEEDS_CONTEXT.

   Remaining markers after this round: SC-673 (e2e + the jsdom `test.failing`), SC-674, SC-680
   only. If any of those now passes unexpectedly, STOP, NEEDS_CONTEXT — do not flip it yourself.
5. Re-check scenario ids are unique after the rebase (develop now has CTR-W03..W16; this branch
   keeps W01 / W02). If `package.json` / `package-lock.json` changed between `8c08bce2` and
   `957e4b11`, `npm ci` before any gate.
6. Commit (`test(SC-442): …`, plain words), then run the **full battery** on the final head.

## 3. Gates — numbers at develop `957e4b11` (baseline)

- tsc and lint clean
- jest **14013 passed / 2 skipped** (fresh worktree; one more passed / 1 skipped with the shots css cache)
- lifecycle **64/64**, seven `--only=` parts (G-S63 flaked once on part 3 for the SC-672 owner and
  passed on a re-run — SC-689; one re-run of that part, a repeat is real)
- e2e **`OBSIDIAN-E2E done: 682/687 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`**
- shots **592** · freeze **280/280** · parity **0 / 0 / 24**

Expected on this branch: tsc/lint clean; jest above baseline (exact count + delta); lifecycle
64/64; e2e `0 failed`, coverage **428/428 pairs** (re-count; explain any other number), known-bug
= 5 + this branch's remaining markers (list each id → ticket; CTR-U01, CTR-W01, CTR-W02 must NOT
be among them); shots / freeze / parity unchanged. Run e2e **twice**; report both summary lines.
The dse tree must be clean at the end (`git -C <dse> status --porcelain` empty).

## 4. Report and return

Write (or overwrite) `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc442-e2e-counter-topup/sc442-r6-implementer-report.md`
covering BOTH rebases, opening with a ≤10-line executive summary for the final `957e4b11`-based
head (status, final sha, base sha, each gate's summary line). Then: every conflict and its
resolution; the CTR-U01, CTR-W01, CTR-W02 changes in a few lines each; any other test changed and
why; the marker list; every gate's exact summary line with its log path (final head), then the
superseded `8c08bce2`-head numbers in a clearly separate section; Drive-by fixes; Follow-ups.
If the report-file write is blocked by your harness, return the report inline.

Final text to the ticket-owner: raw facts, no prose — `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`,
final dse head sha, base sha, `git log --oneline 957e4b11..HEAD`, each gate's measured summary
line, the marker list, and the absolute path of every artifact you produced.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
`to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your
completion notification and will resume you with the answer. If you ever do send a message
anyway, its FIRST WORD must be your ticket key (`SC-442:`).
