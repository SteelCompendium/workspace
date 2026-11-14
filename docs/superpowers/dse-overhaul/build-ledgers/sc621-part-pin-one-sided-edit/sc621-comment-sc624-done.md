Already fixed by SC-568, which landed after this was filed. The test now waits for the embed's first read of the note to finish before it makes the outside edit, so it no longer depends on how busy the machine is.

+++ Agent notes

- dse develop `b1e4f027` (SC-568): `reading-mode-host-pin.test.ts` "an outside edit elsewhere in the source note …" calls `await settleVaultReads()` right after `pinPosition()` and asserts the rebased pin before the outside edit (commits d76c7de2, bc37d682, b1e4f027).
- SC-621 r4 full jest on `96955985` (on b1e4f027): 11892 passed / 2 skipped, this suite green.

+++
