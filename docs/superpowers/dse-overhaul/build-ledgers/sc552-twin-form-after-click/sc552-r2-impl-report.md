# SC-552 r2 implementation report (dse b8b6b3be on 367a2f1d, superproject 160e3a8e)

## Executive summary
- dse commits on 367a2f1d: c9bd20aa red tests · 14a66a0b B (pin) · 52b748d2 K + K-strict · 63506958 WIDE (own commit) · 63d8d6c2 G-S64 · 2522cd15 test follow-up · b8b6b3be docs. Superproject 160e3a8e (CHANGELOG only, no pointer bump).
- Gates on b8b6b3be: tsc/lint clean · jest 6367 passed / 2 skipped / 254 of 255 suites on a fresh worktree (baseline 6325/2/252 of 253: +42 tests, +2 suites) · lifecycle 49/49 (21+16+8+4: 186/327/285/295 s) · e2e 128/128, 89/89 · shots 592, 0 FAIL, 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze 280/280 · parity 0/0/24. styles.css byte-identical to 367a2f1d.
- Red/green: jest 20 red on 367a2f1d (log), wide tests 4 red before the wide commit; G-S64 on a 367a2f1d bundle (sha256 1bb51153...) FAILs (a)-(k), (l), (n), (o), (p), (q), passes only (m); HEAD passes all 17 phases (~40 s alone).
- Mutants: jest M1-M10 + J4/J5 all red (list in sc552-r2-jest-mutants.txt); lifecycle M1-M8 all caught by the expected phases.
- SC-549 phases (n) [7,6,5] and (o) [5,6,5] pass on HEAD; base [7,5,6] / [5,5,6].

Full detail: see the final message and the evidence files in this directory (sc552-r2-*).
