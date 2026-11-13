An Edit form Save or a + / - on one of two identical counters no longer goes into the other counter when an outside change (Sync, another app) deleted the one you were on. Nothing is written and the "changed on disk first" Notice shows; the form stays open. Ready to land; no decision needed from you.

**What changed for a user**
- The ticket's shape is fixed in Reading view and Live Preview: two identical counters separated only by blank lines, the upper one deleted from outside while its form was open, or just after you pressed + / - on it. Both used to write the lower counter with no message.
- The review found more shapes of the same bug and they are fixed too: the lower one deleted while a nearby line was edited in the same change, and the same with a counter of another value next to the pair. These also wrote the surviving counter.
- Reopening the form, or the next click, saves as usual. A note without identical counters behaves exactly as before.

**New refusals you may notice (all safe: a Notice, nothing written, under your 2026-11-10 ruling "Save nothing with a notice is fine.")**
- In the same outside change, an identical counter was added or removed beside yours, so the note cannot tell which counter was yours. This includes the mirror of the ticket (the lower one deleted while you were on the upper), which used to save only by luck.
- An outside change that only adds or removes spaces or blank lines inside the counter you are editing, in a note that has identical counters. That counter really did change on disk, so the Notice is accurate. Before, this saved.
- A code block at the very end of the note that was never closed, with a closed copy pasted above it from outside. Before, the Save went into the pasted copy.

**Still possible, as before this fix (not made worse)**
- A change of more than 400 lines in one go, combined with a deleted identical counter: the old guess is used.
- A counter moved or pasted so that the note reads exactly the same either way.

**Filed along the way (Backlog)**
- SC-621: the same "a nearby line edited too" gap in hover previews and embeds (SC-607's rule there does not see it).

+++ Agent notes

- dse branch `sc612-twin-deleted-wholenote-pin` at 1f1ae442 on develop 2074a152; superproject branch at 53be46e9 on main f9082867 (one CHANGELOG commit; one pointer bump at landing).
- Rule P (`pinnedTarget`, whole-note pins whose known body occurs twice, in the note as pinned or now; also twinned SC-607 strict pins): place only when the head-first line map's answer is the UNIQUE cheapest placement of the pinned block by line-edit cost, counting "deleted" as an option. Cost is a capped Myers `editDistance` factored out of `mapLineOf` (cap `LINE_MAP_MAX_EDITS`); a capped give-up keeps the old behaviour. SC-607's tail-first check for strict pins is kept. A note without identical counters takes the old path.
- Gates on 1f1ae442: tsc and lint clean · jest 11788 passed / 2 skipped (base 11707 + 81) · lifecycle 62/62 in seven parts (21/16/9/4/7/4 + new part 7 `G-S108`, 67 s) · e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · styles.css byte-identical to a clean 2074a152 build, so shots 592 / freeze 280/280 / parity 0/0/24 carry.
- Fuzz (234,064 generated cells, independent placement oracle): 0 writes into the other twin where the note is a tie (r2 rule: 212), 0 refusals where the block was unambiguous (r2 rule: 508), 0 corrupt writes, 0 refusals with no outside edit, 0 refusals that persist to the next round.
- Red on base: 31 of 897 SC-612 jest tests fail on base host code; lifecycle G-S108 (15 cells, Obsidian 1.15.1, own part 7) is red on a base bundle in (a)-(g) and (l)-(o), controls (h)-(k) green.
- Cost inside `vault.process` (form Save, median): twin note 5000 lines / 198 edits 7.65 ms vs 3.49 base; 300 identical counters 21.7 vs 4.65; non-twin 5000 lines 5.02 vs 3.27.
- Reviews: r1 design (Opus), r2 implementation (Sonnet), r3 independent review (Opus; FIX: two HIGH, rule replaced), r4 fixes, r5 scoped re-review (LAND; whitespace residual accepted, CHANGELOG nit folded), r6 rebase + re-gate.
- Ledger and reports: `.superpowers/sdd/sc612-twin-deleted-wholenote-pin/` (machine-local; preserve to `docs/superpowers/dse-overhaul/build-ledgers/` at landing). dse-verify SKILL text proposal: `sc612-dse-verify-proposal.md` there (new lifecycle part 7 `G-S108`, 62/62).

+++
