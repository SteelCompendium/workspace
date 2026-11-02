# SC-522 r5 brief — scoped re-review of the r4 delta (reviewer, resumed r3)

Your final text goes to the ticket-owner, not a human. Workers never call the tracker. Execute and probe.

## Scope

Delta only: `git -C /home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll/draw-steel-elements range-diff 4deb8cf..86ab9a2 34f46cf..64e176f` (if develop moved) or `diff 86ab9a2..64e176f`, plus the superproject CHANGELOG delta. Head `64e176f` on develop `34f46cf`; superproject `d82709b` on origin/main `8174d81`. Read the ledger section "Owner rulings on r3 (2026-11-01)" and the r4 report `sc522-r4-fix-report.md` (exec summary first) in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/`.

## Checks

1. **LOW-1 re-proved with your own probes**, base vs head, 2 reps: (i) delete one of two blocks, host at end — frames the hold outlives the redraw; (ii) prose-only shrink; (iii) write to tracker 1 of a two-tracker B, host at end — must hold 0 px (premature release is a HIGH); (iv) three writes 1 s apart; (v) two embeds of B. If r4 took the fallback, verify the failing case it names and the reworded KNOWN LIMITS.
2. **No regression of r3's probes**: G-S52 (a)-(e) ok; Form Save from an LP embed 0 px; the Part 2 click set; close pane / popout mid-hold leaves nothing.
3. **G-S52 phase (f)**: frame-bound assertion (no timer deciding the outcome), not vacuous; the new control "release only on a fresh root" FAILs (f) only — rebuild it from head sources and run it once; head ok; base result on (f).
4. LOW-2 wording and the INFO-1 citation in the header are accurate; the proposed dse-verify text matches what G-S52 now does.
5. Re-run tsc/lint/jest and `--only=G-S8,G-S15,G-S18,G-S42,G-S50,G-S52`.

Findings by severity with file:line, scenario, prescribed fix. Same footguns as your r3 brief (`sc522-brief-r3-review.md` §3) — follow them exactly; use a fresh private scratch subfolder `…/scratchpad/sc522-r5-<agentId>/`. Leave the tree as you found it.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/sc522-r5-rereview-report.md`, ≤10-line executive summary first (verdict, counts, the (i)-(v) table, gates). Evidence with the `sc522-r5-` prefix. If the write is blocked, return it inline. Final text: raw facts + absolute paths. If you need input, end with STATUS: NEEDS_CONTEXT. Any message you send starts with `SC-522:`.

## Added by the owner after r4 (2026-11-01)

- develop moved 4deb8cf -> 34f46cf (SC-525) under r4, so use the range-diff form: `range-diff 4deb8cf..86ab9a2 34f46cf..64e176f`. r4's first two commits (61a2423, 257ec42) are the rebased b813edd/86ab9a2; the new work is 7612b48, 3a8429c, 64e176f.
- r4 Follow-up 1 (owner ruling: r5 measures it once): "A second write landing before the first mount (under ~50 ms apart) re-holds with an empty root that our view then mounts into. That counts as neither fresh nor put back, so that hold waits for its TTL." Drive two writes < 50 ms apart, once where B's height is unchanged and once where the second write shrinks B; report blank band duration and settled position vs base. A 2.5 s blank band on the shrink case is a finding (same class as LOW-1); an invisible floor on the same-height case is not.
- r4 Follow-up 2 (a redraw split across two tasks would release early and degrade to stock's clamp) → owner ACCEPTS (never worse than stock); no probe needed.
- Expected numbers at 34f46cf: jest 6201 / 1 skipped / 248 of 249; lifecycle 42/42 (halves 21+21). Discrimination r4 reported: head ok; base FAIL (a)-(f); ctl-nohold and ctl-norelease FAIL (a)-(d)+(f); ctl-noclick FAIL (e); ctl-fresh FAIL (f) only.
