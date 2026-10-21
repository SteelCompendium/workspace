# SC-459 r2 implement report

## Executive summary
- STATUS: DONE. dse head `be5607c` on branch `sc459-scroll-pin-gate`, base `188755b` (origin/develop unchanged after fetch; no rebase).
- Prototype applied unchanged; touches only the G-S8 scenario object in `visual-harness/obsidian-lifecycle.mjs`. `t.reg`, `t.tag`, `t.sameRoot` are existing helpers (lines ~429/438/442); the kill switch (`viewRegistry.enabled`) is restored in `finally`.
- F2: comment-only header update in `src/framework/host/previewScrollPin.ts` (1.13.7 text kept, marked as history; 1.14.4 measurement added). No code change. No harness README scenario list for G-S8 exists, so nothing else edited.
- Built output byte-identical to `188755b` (main.js 42f1445cb451..., styles.css 698d2d07cf15...) -> shots/freeze/parity skipped.
- Gates: tsc 0, lint 0, jest 5256 passed / 2 skipped / 229 of 230 suites (uncached obsidian-app.css), lifecycle 27/27, e2e 83/87 0 failed 57/57.
- Discrimination: nopin-js FAIL, nopin-css FAIL, stock ok. git status empty.

Details are in the return message; logs/scripts are `sc459-r2-*` in this directory.
