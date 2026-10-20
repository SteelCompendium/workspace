Still ready to land. The Escape fix is unchanged; it now sits on top of SC-455, which landed first, and every test still passes.

The rebase had no conflicts. The new draw-steel-elements head is `ab34293` on `develop` `b6b08f3`, and the superproject head is `7afd315` on main `8969a34`.

Gates at the new head:
- tsc and lint clean
- jest 5262 passed / 1 skipped
- lifecycle 27/27
- e2e 83/87 ok, 0 failed, 4 known-bug, coverage 57/57 pairs
- shots 572, 0 FAIL
- freeze 276/276
- parity 0 GAPs / 0 undeclared / 24 declared
