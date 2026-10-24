# SC-500 r1 implementer report

Executive summary
- STATUS DONE. dse commits on origin/develop 7046eb0: 31c1778 (ids + manifest + census tests), 4f7aba6 (INIT-DEF-E01/E03/E04 via dse.click, dse.hover). Not pushed.
- Ids: init.hero.turn (hero portrait overlay), init.reset-encounter (chrome item), init.reset-encounter.confirm ("Yes, Reset").
- New manifest e2e/manifest/initiative.ts (3 rows, kind click). e2e coverage 79/79 -> 82/82 pairs.
- Gates on 7046eb0: tsc/lint clean; jest 6027 passed/1 skipped/243 of 244; lifecycle 36/36; e2e 114/114, 82/82; shots 592 0 FAIL; freeze 280/280; parity 0/0/24.
- Mutant (ids removed): INIT-DEF-E01/E03/E04 fail, 0/3 ok.
- No CHANGELOG bullet (test/coverage infra; prior e2e-manifest commits add none).
- Bases: dse 7046eb0, superproject rebased onto origin/main aa57411 (pointer not staged).
Details: see the return message; logs in the scratchpad sc500-impl-r1-main dir.
