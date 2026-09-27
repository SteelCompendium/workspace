**Ready to land as you chose (option A). No action needed from you.** The busy-state fix is rebased onto the latest develop with no changes to it and passes every gate.

- DSE branch `sc243-sync-busy` @ `e9bc15e`, on develop `619c4bd` (after SC-340 view adoption). The rebase had no conflicts, and every commit is identical to the reviewed version.
- Gates at `e9bc15e`: tsc and lint clean. jest 4063 passed / 1 skipped. Lifecycle 19/19. Shots 524 with 0 FAIL. Freeze 260/260 (no frozen screenshot moved). Parity 0 gaps / 0 undeclared / 16 declared.
- The workspace CHANGELOG bullet is on superproject branch `sc243-sync-busy`. The dispatcher lands both.
