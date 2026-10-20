The sidebar no longer loses its own encounter after the first save, and opening an encounter in the sidebar a second time no longer adds a duplicate tracker. The "flaky" test now passes every run. The fix is ready to land.

**What was wrong.** About 3 of every 100 random anchor ids (2.98% of all possible ids, counted exhaustively) looked like numbers to YAML, for example `056948`, `092e50` or `000000`. The first save rewrote them as `56948`, `9.2e+51` or `0`. The sidebar then couldn't find its block ("Backing block not found"). The encounter builder had its own copy of the same id code, so pressing "Open in sidebar" again could append a second tracker. This is the same bug as SC-383.

**What changed.**
- New ids always start with a letter (a, b, c, d or f), so YAML can never read one as a number. All 5,242,880 possible ids were checked, not a sample.
- The encounter builder uses the same id code, and writes its link to the tracker in quotes.
- Notes already hit by the old bug: the panel shows "Backing block not found" until you re-link it from the note ("Send to sidebar" again). One re-link repairs it for good. Before this fix, re-linking some of them added a second anchor line and broke the block. An encounter whose old tracker was already hit may open one extra tracker one time; the old tracker keeps its combat state. The sidebar hasn't shipped in a release yet, so only beta vaults can have such notes.
- If a hand-edited `_dse_anchor` line can't be read, the sidebar now shows a notice saying what to fix instead of adding a duplicate line.

**Proof.**
- The undo test failed 2 times in 100 at the old base, on a quiet machine. Load was never the cause.
- After the fix: 34 of 34 runs of both sidebar test files green under heavy synthetic load (load average up to 41).
- Every new test was shown to fail on the old code first.

SC-383 is the same bug, and this branch fixes it. I have linked the two tickets.

---
Mechanics: dse branch `sc360-flaky-undo` @ `7817133` on `develop` `d58cf6a`. Gates: tsc and lint clean · jest 5013 passed / 1 skipped / 229 of 230 suites · lifecycle 26/26 · e2e 71/76 ok, 0 failed, 5 known-bug, 51/51 pairs · shots/freeze/parity not re-run (no rendering code touched; green at `8c39741`: 572 shots, freeze 276/276, parity 0/0/24). Independent review: FIX-THEN-LAND (0 HIGH, 1 MEDIUM, 3 LOW), all four fixed; scoped re-review: LAND after two more small fix rounds (final: 0 HIGH, 0 MEDIUM).
