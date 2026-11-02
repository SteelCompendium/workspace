Two test runs started at the same moment no longer share one virtual screen. Each e2e, lifecycle and docs-shots run now uses only a display whose Xvfb it started itself. Nothing for you to decide; this is ready to land.

**What was wrong.** A runner picked a free display number, started Xvfb on it, and treated "the display's socket file exists" as "my Xvfb is up". When two runs picked the same number at once, the second Xvfb lost and did nothing, but its runner saw the first run's socket and ran on that screen. When the first run finished, the second lost its screen and failed with errors that looked like code faults.

**Reproduced first.** Two real e2e runners started together shared a display in 7 of 10 pairs (9 of 10 in the independent review). In one pair the second run then read 83 of 86 failed. The lifecycle harness had the same race and it was worse: 40 of 40 at function level, because it never tries another number. docs-shots had it too (40 of 40).

**The fix.** One small helper, `scripts/xvfb-owned.mjs`, used by all three. It starts Xvfb with `-displayfd`, so the display counts as ours only when our own Xvfb writes back its number once it is listening. A lost race moves on to the next number. Display ranges are unchanged (e2e :200-:239, lifecycle :160-:199, docs-shots :99-:129), and no runner picks your real display :1 on its own.

After the fix: 0 of 10 real pairs shared a display, and a 4-process stress test returned 100 displays with none shared and nothing left behind.

**One caveat until everyone rebases.** A lifecycle run from a worktree that has NOT rebased onto this change can still land on a new run's display if both start within about 250 ms (16 of 20 in the review's mixed test). The new code cannot stop an old runner. It goes away once every worktree is on this change; the READMEs say so. The same applies to an un-rebased docs-shots run.

Harness-only: the built `main.js` and `styles.css` are byte-identical to `develop`. No user-visible change, so no CHANGELOG entry.

---

Mechanics:
- dse branch `sc546-e2e-xvfb-race` @ `423e798d` on `develop` `eaf64ba6`.
- Gates: tsc and lint clean; jest 6271 passed / 2 skipped on a fresh tree, which is 6272 / 1 once the shots cache exists (6262 base + 10 new); `main.js`/`styles.css` sha256 identical to a build of `eaf64ba6`; lifecycle 46/46 in three parts; e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` twice.
- Review: independent review LAND (2 LOW, 5 INFO; 5 fixed, 2 dropped as theoretical/no-action); scoped re-review of the fix round LAND (4 INFO: 3 fixed, 1 dropped as a cosmetic log line); final docs-only commit checked.
- Proposed dse-verify text: `.superpowers/sdd/sc546-e2e-xvfb-race/sc546-r1-dse-verify-proposal.md` (not applied to SKILL.md).
