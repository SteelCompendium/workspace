Option A is built and ready to land. New feature blocks will no longer show a "Villain Action 1" chip on what is a main-action card.

I'm treating your "Option A is good" (comment b4241ded) as the sanction for option A's 8-line print-freeze rebaseline, since option A can't land without it. That covers exactly the 8 lines from my ask: `feature`, `feature-collapsed`, `feature-spend` and `chrome-collapsed-rollout`, each in `--steel-print` and `--steel-realprint`. If you meant only the choice and not the sanction, say so before it lands.

---

Mechanics: DSE branch `sc236-feature-example` @ `ade5064`, rebased onto develop `36635e9`. The only conflict was the CHANGELOG, resolved by putting this bullet at the top. Gates:

- tsc and lint clean.
- jest 4100 passed / 1 skipped.
- obsidian-lifecycle 19/19.
- shots 524 / 0 FAIL.
- parity 0 GAPs / 16 DECLARED.
- freeze: exactly the same 8 lines move, with the same hashes as before the rebase. The replacement lines get applied at landing.
