# SC-552 r2b report (dse 260763ab on 0698550f; superproject c64edebc)

## Executive summary
- Rebased the 7 r2 commits onto 0698550f (origin/develop = 0698550f; no conflicts; lifecycle G-S59 and G-S64 coexist, scrollPin.pin() untouched). New commits: f2b913be (F2), 42b62158 (G-S64 q/r/s + architecture), 260763ab (header). Superproject c64edebc (CHANGELOG wording only).
- F1: measured on 0698550f base: the same blank line before the closing fence (RAW source ends with a newline). Code left; G-S64 (q) stays tolerant. Owner decides drop/file.
- F2: ReadingModeBlockHost.keepFormOpenOn also requires a markdown leaf showing the note; (q) now triggers a redraw (blank lines appended at EOF); new (r) navigate-away and (s) pane-close phases: form closes, note unchanged. Mutant M11 (check removed) FAILs (r),(s) and 2 jest tests.
- Gates: tsc/lint clean · jest 6422 passed / 1 skipped / 255 of 256 (cached CSS; +44 tests, +2 suites vs 6378/1/253 of 254) · lifecycle 50/50 in five parts (183/320/277/296/199 s) · e2e 128/128 89/89 · shots 592 0 FAIL 161/966 modal 228 input 15/176 checkbox 7/116 prose 106 [212] · freeze 280/280 · parity 0/0/24.
- G-S64 on a 0698550f bundle: red on (a)-(i),(k),(l),(n),(o),(p),(q); passes only controls (m),(r),(s).
Commits: see  sc552 evidence list in the final message; logs: sc552-r2b-*.
