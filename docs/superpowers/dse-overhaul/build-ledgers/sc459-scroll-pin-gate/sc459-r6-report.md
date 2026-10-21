# SC-459 r6 report (fix r5 findings + rebase onto 84636a9)
## Executive summary
- STATUS: DONE. dse head `0267b8a` on base `84636a9` (rebased 3 commits, 0 conflicts; G-S12 intact). Commits: f67288a, 63f8ac3, 0267b8a (r6 fix).
- LOW-A: G-S8 sampling cap counts from first pin sighting (+4500 ms, hard cap 12 s; 5 s if the pin never appears). Stock at 6x throttle ok 2/2 on the rebased head (6984 ms, 6761 ms).
- LOW-B, INFO-A, INFO-B done (comments / header only).
- Discrimination on 0267b8a: nopin-js FAIL, nopin-css FAIL, stock ok 2/2.
- Built main.js/styles.css byte-identical to a build of 84636a9 (4a0b87f5.../9d88edb6...): shots/freeze/parity skipped.
- Gates: tsc/lint 0, jest 5328 passed / 2 skipped / 230 of 231, lifecycle 28/28, e2e 83/87 0 failed 57/57.
- Note: stock at 8x throttle (pre-rebase probe) fails because the pin's 2500 ms TTL expires before the rebuild; product limit, not the cap.
