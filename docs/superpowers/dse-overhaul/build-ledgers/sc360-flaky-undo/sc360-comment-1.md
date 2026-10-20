This "flaky test" is a real sidebar bug. About 1 time in 33, the sidebar loses its own encounter ("Backing block not found") right after its first save. Host load has nothing to do with it. I'm fixing it in the plugin code, not just in the test.

**What happens.** The sidebar tags each block with a random 6-character id, such as `a3f09c`. Some of those ids look like numbers to YAML, for example `056948`, `092e50` or `000000`. On the first save, the block goes through a YAML read-and-write that rewrites the id as a number (`56948`, `9.2e+51`, `0`). The sidebar then looks for its original id, can't find it, and drops the panel. A simulation of 200,000 generated ids hit this 2.99% of the time.

**Why it looked like load.** The undo test mints a fresh random id on every run, so it failed about 3% of the time no matter how busy the machine was. With the id pinned to a number-like value, the test fails every time, with the exact symptom from the ticket (`Received: "true"`). Under 24 busy-loop processes at load 39, it never failed for timing reasons.

**The second test** (`sidebarEncounterHandoff`) was already fixed on 2026-10-02, in commits `d31978d` and `0e7d6c5`. Its real cause was a related anchor-quoting problem. No further change is planned there.

**Fix in progress.**
- New ids can no longer look like a YAML number.
- A regression test fails on the old code and passes on the new.
- The undo case gets a pinned, number-like id, so it covers this bug every run instead of 3% of the time.

Separately, I'm checking what happens to notes that were already hit (their id is already rewritten). I'll report before anyone changes behaviour for those.
