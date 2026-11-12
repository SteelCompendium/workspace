# SC-610 r4 — scoped re-review of the r3 delta (on c6077860)

You are the r2 reviewer, resumed. Your final text goes to the ticket-owner. **Workers never call the tracker.** Review, do not fix.

## Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/decisions.md` — the r2 owner rulings (LOW-1, LOW-2, INFO-1, INFO-3 FOLD; INFO-2 DROP).
- r3 author report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/sc610-r3-fix-report.md`.
- Plugin branch rebased onto dse develop `c6077860` (SC-596 landed). Head `3ad68185`; r2-reviewed head was `3a0f3079` on `7866426e`. Superproject worktree head `f18fad5a`. Fetch inside the plugin clone if `c6077860` is missing: `git -C /home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/draw-steel-elements fetch origin`.

## Scope (delta only, not a fresh full pass)

1. `git range-diff 7866426e..3a0f3079 c6077860..3ad68185` — r1 commits carried unchanged, or every rebase change explained.
2. Each folded finding is closed: re-run your r2 probe (`zzsc610r2probe.test.ts.txt`) plus targeted probes for LOW-1 (string / mapping / number `participants` survive an unrelated write; add-hero wraps), LOW-2 (every all-null shape dropped, no `null` in serialized `participants`, `0` / `false` / `" "` kept), INFO-1 (a `.name` read on the raw list fails to compile; nothing outside `src/elements/montage/` changed type), INFO-3 (CHANGELOG bullet matches the ledger's text).
3. Nothing new broke: O1 / O3 (a)-(f), §B.5 order, SC-606 no-key rule.
4. New tests red on `3a0f3079`, green on head.
5. Spot gates on head: jest (expect `10624 + SC-610 tests` passed / 2 skipped fresh, or +1/-1 post-shots), e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`, lifecycle part 5 `--only=G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7/7) and part 6 `--only=G-S92,G-S96` (2/2). Pass `--only` comma-separated.

All footguns from your r2 brief (`sc610-brief-r2-review.md` §3) still apply. Leave the plugin worktree clean.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/sc610-r4-rereview-report.md`, ≤10-line executive summary first (verdict LAND / FIX, severity counts, gate numbers). Return raw facts and every artifact path.
