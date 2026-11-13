Ready to land: the lifecycle check G-S91 no longer fails at random. A G-S91 failure now means the product is wrong. Nothing changed in the plugin itself; only the test was fixed.

**Why it failed.** The test opens a window from a hover preview, then presses inside the window very quickly. It sent that second press so fast that it sometimes arrived before Obsidian's own 10 ms timer had marked the preview as in use. When that happened, Obsidian closed the preview and the window with it.

That case is a known limit from SC-598. A real person cannot click that fast except with a double-click, and a double-click already closes the window by design (SC-604). So the test was racing a case SC-598 never promised to handle. It was not finding a new bug.

**What changed in the test.** The test now releases its second press just after Obsidian's 10 ms timer. That is still well inside the 150 ms window the old bug lived in.

The "too slow to prove anything" check now measures from the end of the opening click instead of its start. A trial that fails only that check (a busy machine) is re-run up to twice. A real failure, such as the preview or the window disappearing, is never re-run.

**Proof.**
- Before: 2 of 17 runs failed on clean dse. A worst-case version of the race failed 16 of 20 trials.
- After: 33 of 33 runs passed, with no re-runs needed. The worst-case race passed 20 of 20.
- With SC-598's product fix removed, the test still fails every trial, for the right reason (the preview disappears). So it still catches the bug it was written for.
- An independent review tried five deliberately broken versions of SC-598's fix. The new test catches each one in the same trials the old test did.

+++ Agent notes

- dse branch `sc616-gs91-hover-flake` @ `1cc54eac` on develop `3a5986d3` (commits `54b08986` release + gate, `a2797330` bounded re-run, `1cc54eac` comments + message); superproject branch `ec35b4b2` = one pointer bump on workspace main `b31eb542`. Harness only: `visual-harness/obsidian-lifecycle.mjs` (`gs91Trial` and the G-S91 judge).
- Gates on `1cc54eac`: tsc and lint clean · jest 11794 passed / 2 skipped · lifecycle 62/62 (seven parts; part 5 393 s) · e2e `331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · `main.js` and `styles.css` byte-identical to a `3a5986d3` build, so shots 592 / freeze 280/280 / parity 0/0/24 carry.
- Review: independent review LAND (0 HIGH / 0 MEDIUM / 1 LOW / 6 INFO; LOW and 4 INFO fixed, 2 dropped with reasons in the ledger); scoped re-review LAND (2 optional INFO: one folded, one dropped).
- Cause (r1): Obsidian's click-to-edit helper arms its 10 ms timer at the end of the opening click's dispatch; queued input is handled before a due timer, so the zero-length second press could reach Obsidian's window-capture hide (`T3`) before the preview was focused. Failing timeline: timer due +72.2 ms, click handled +82.8, timer ran +83.0, preview hidden +88.1.
- Not closed: SC-598's residual itself (a press queued within ~10 ms of the opening dispatch). The only fix is a private Obsidian API, which SC-598 already declined (stuck preview after close, version fragility).
- SKILL.md text updates (G-S91 flake note, G-S83 footgun 12): `sc616-dse-verify-proposal.md` in the ledger dir, for landing.
- Ledger: `.superpowers/sdd/sc616-gs91-hover-flake/decisions.md` (preserved to `docs/superpowers/dse-overhaul/build-ledgers/` at landing).

+++
