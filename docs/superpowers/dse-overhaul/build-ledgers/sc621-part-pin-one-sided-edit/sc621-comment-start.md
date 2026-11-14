Work has started. No decision is needed from you yet.

First step: measure whether a hover preview or a section embed really writes the other counter in this shape, in tests and in real Obsidian. The gap was found by reading the code for SC-612; it was never reproduced for previews. If it is real, the plan is to reuse the check SC-612 added for notes open in their own pane, so the preview refuses with the "changed on disk first" Notice instead of guessing.

Your 2026-11-10 ruling ("Save nothing with a notice is fine.") covers any refusal where the note really is ambiguous. I will come back to you only if the fix would refuse a write in some other situation.

+++ Agent notes

- Worktree `sc621-part-pin-one-sided-edit`, dse base develop `df92a3f6`.
- r1: diagnosis + measurement + fix design (Opus reviewer), failing tests committed red on base.
- Pipeline: r1 design -> implementation -> independent review -> fix/re-review -> land-ready.

+++
