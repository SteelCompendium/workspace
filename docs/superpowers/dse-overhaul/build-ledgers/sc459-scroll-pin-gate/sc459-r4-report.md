# SC-459 r4 report (rebase onto ba20072 + r3 fixes)

## Executive summary
- STATUS: DONE. dse head `fb1b6f6` on base `ba20072` (origin/develop confirmed; rebase clean, no package.json change, no npm ci). Commits: `d12fa22` (rebased r2) + `fb1b6f6` (r3 fixes).
- Folded LOW-1..3, INFO-1..6 (INFO-5 only the in-file line-24 description). Scope: G-S8 object, the line-24 description, previewScrollPin.ts header comment.
- Built main.js + styles.css at head are byte-identical to a build of ba20072 -> shots/freeze/parity skipped.
- Gates: tsc 0, lint 0, jest 5259 passed / 2 skipped / 230 of 231 (no shots cache), lifecycle 27/27, e2e 83/87 0 failed 57/57.
- Discrimination on fb1b6f6: nopin-js FAIL, nopin-css FAIL, stock ok. git status empty.
- G-S8 runtime: sampling now ends at pin release + 10 frames: 3245-3266 ms per phase 2 sample (was a fixed 2400 ms), phase 1 similar.
- Caveat: eslint ignores visual-harness/*.mjs by config and crashes with --no-ignore even at the base, so the .mjs is only syntax-checked (`node --check`); the same held for r2's "eslint rc=0".
Full facts in the return message.
