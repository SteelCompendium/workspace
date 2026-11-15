# SC-648 r4 — scoped re-review of the r3 delta

You are the SC-648 reviewer (you did r2). Final text goes to the SC-648 ticket-owner. Workers never call the tracker.
Read the ledger `decisions.md` (r2 rulings, rebase instruction) and `sc648-r3-implementer-report.md` in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc648-negotiation-menu-position/`.

Scope — the delta only, not a fresh full pass:
1. LOW-1 fold: `e2e/driver/negotiation.ts` helper now accepts a menu ending at the button's bottom
   (`Math.abs(m.bottom - b.bottom) <= tol`) and its comment is correct. Re-run your r2 near-bottom probe against the
   new helper if cheap.
2. INFO-2 fold: the `view.ts` `width` comment is corrected; the `showAtPosition` call itself is unchanged.
3. Rebase: the plugin branch's commits sit on dse develop **3e88b3f5** (`git -C <plugin> log --oneline 3e88b3f5..HEAD`
   = SC-648 commits only; `git range-diff` against 09c879f2..544fd4e0 shows only the r3 fixes).
4. Superproject branch: based on workspace `origin/main` (dc16b57d or later; r3 reports 7cea83eb), exactly two commits on top — the
   CHANGELOG bullet under `## Unreleased` and ONE `chore: bump draw-steel-elements to <sha>` pointing at the plugin
   head; `git -C <super> diff origin/main --stat` shows only `CHANGELOG.md` and `draw-steel-elements`; no AI
   attribution trailers; working trees clean.
5. Gates: verify the r3 logs' summary lines (don't re-run the full battery unless a log is missing or suspect).
   Re-run the negotiation e2e specs only (`--only`/grep form per dse-verify) on the rebased head. Expected full-run
   numbers: jest 13327 / 2 · lifecycle 64/64 · e2e `596/611 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs` ·
   styles.css identical to a clean 3e88b3f5 build so shots / freeze / parity carry.

Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc648-r4-review/`.
Same rules as r2: never `rm` anything in /tmp or the scratchpad, `git -C` absolute paths, never pkill by pattern,
foreground `timeout 175 tail --pid=<your pid>` waits, no Monitor, never key a wait on a scratch filename.

Report `sc648-r4-rereview-report.md` in the ledger dir, ≤10-line summary first (inline if blocked). Final text:
verdict (LAND-READY / FIX-ROUND), shas checked (plugin head, superproject head and base), findings by severity with
file:line, numbers you measured, artifact paths. For input end with STATUS: NEEDS_CONTEXT; any message you send
anyway starts with `SC-648:`.
