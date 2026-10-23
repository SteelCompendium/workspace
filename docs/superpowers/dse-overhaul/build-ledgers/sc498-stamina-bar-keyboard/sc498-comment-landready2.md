Still ready to land after rebasing onto SC-495's stepper focus fix. Nothing changed in behaviour, and nothing is needed from you.

The bar's keyboard access, the focus outline and the screenshots in the previous comment all still apply. The rebase had no conflicts, and the 7 commits are identical to the reviewed ones.

---
Mechanics:
- dse branch `sc498-stamina-bar-keyboard` @ `b624eef` on develop `c98bd82`; superproject @ `e3e1fd6` (one CHANGELOG-only commit) on origin/main `1add69e`. Submodule pointer not bumped; the dispatcher lands and applies the dse-verify G-S36 row.
- Gates: tsc + lint clean · jest 5889 passed / 1 skipped / 241 of 242 suites · lifecycle 35/35 (G-S36) · e2e `114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` · shots 592, 0 FAIL · freeze `freeze OK (280/280)`, no rebaseline · parity 0 gaps / 0 undeclared / 24 declared.
