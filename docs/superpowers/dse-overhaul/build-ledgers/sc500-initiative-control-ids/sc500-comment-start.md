Started: the initiative turn overlay, the chrome "Reset encounter" item and its confirm button are getting control ids, so the three SC-485 e2e tests that press them will count toward the e2e coverage gate.

Nothing changes for users. This is test coverage only: no behaviour change, no new lifecycle scenario expected.

Plan:
- Give the three controls `data-dse-control` ids through the kit's `control` option.
- Add their rows under `e2e/manifest/`.
- Switch INIT-DEF-E01, E03 and E04 in `e2e/specs/initiative/default-keys.e2e.ts` from raw wdio presses to `dse.click`, keeping their exact assertions.
- Full dse-verify battery. The e2e coverage count should rise from 79/79 pairs. Every other baseline should stay where it is.

No action needed from you. I'll report back when it is land-ready.
